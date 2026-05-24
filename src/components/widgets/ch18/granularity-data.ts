export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boxMuller(rand: () => number): number {
  const u1 = rand();
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export const ROWS = 8;
export const COLS = 64;
export const N_BITS = 4;

export function generateMatrix(seed: number = 42): number[][] {
  const rand = mulberry32(seed);
  const W: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: number[] = [];
    const isOutlier = r === 0;
    const baseStd = 0.1;
    const scale = isOutlier ? 10 : 1;

    const hotStart = Math.floor(rand() * COLS);
    const hotEnd = Math.min(hotStart + 16, COLS);

    for (let c = 0; c < COLS; c++) {
      const inHotRegion = c >= hotStart && c < hotEnd;
      const localScale = inHotRegion && !isOutlier ? 2.5 : 1;
      row.push(boxMuller(rand) * baseStd * scale * localScale);
    }
    W.push(row);
  }
  return W;
}

export const WEIGHT_MATRIX = generateMatrix(42);

export type Granularity = 'per-tensor' | 'per-channel' | 'per-group';

function quantizeValue(v: number, scale: number, qmin: number, qmax: number): number {
  const intVal = Math.max(qmin, Math.min(qmax, Math.round(v / scale)));
  return intVal * scale;
}

export function quantizeMatrix(
  W: number[][],
  granularity: Granularity,
  groupSize: number = 32,
  nBits: number = N_BITS,
): {
  quantized: number[][];
  numScales: number;
  scaleStorageBytes: number;
} {
  const qmax = Math.pow(2, nBits - 1) - 1;
  const qmin = -qmax - 1;
  const rows = W.length;
  const cols = W[0]!.length;
  const quantized: number[][] = W.map(row => row.slice());

  if (granularity === 'per-tensor') {
    let absMax = 0;
    for (const row of W) for (const v of row) absMax = Math.max(absMax, Math.abs(v));
    const scale = absMax === 0 ? 1 : absMax / qmax;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        quantized[r]![c] = quantizeValue(W[r]![c]!, scale, qmin, qmax);
      }
    }
    return { quantized, numScales: 1, scaleStorageBytes: 4 };
  }

  if (granularity === 'per-channel') {
    for (let r = 0; r < rows; r++) {
      let absMax = 0;
      for (const v of W[r]!) absMax = Math.max(absMax, Math.abs(v));
      const scale = absMax === 0 ? 1 : absMax / qmax;
      for (let c = 0; c < cols; c++) {
        quantized[r]![c] = quantizeValue(W[r]![c]!, scale, qmin, qmax);
      }
    }
    return { quantized, numScales: rows, scaleStorageBytes: rows * 4 };
  }

  const numGroupsPerRow = Math.floor(cols / groupSize);
  for (let r = 0; r < rows; r++) {
    for (let g = 0; g < numGroupsPerRow; g++) {
      const start = g * groupSize;
      const end = start + groupSize;
      let absMax = 0;
      for (let c = start; c < end; c++) absMax = Math.max(absMax, Math.abs(W[r]![c]!));
      const scale = absMax === 0 ? 1 : absMax / qmax;
      for (let c = start; c < end; c++) {
        quantized[r]![c] = quantizeValue(W[r]![c]!, scale, qmin, qmax);
      }
    }
  }
  const numScales = rows * numGroupsPerRow;
  return { quantized, numScales, scaleStorageBytes: numScales * 4 };
}

export function perRowMSE(W: number[][], Q: number[][]): number[] {
  return W.map((row, r) => {
    let sumSq = 0;
    for (let c = 0; c < row.length; c++) {
      const e = row[c]! - Q[r]![c]!;
      sumSq += e * e;
    }
    return sumSq / row.length;
  });
}

export function overallMSE(W: number[][], Q: number[][]): number {
  let sumSq = 0, count = 0;
  for (let r = 0; r < W.length; r++) {
    for (let c = 0; c < W[r]!.length; c++) {
      const e = W[r]![c]! - Q[r]![c]!;
      sumSq += e * e;
      count++;
    }
  }
  return sumSq / count;
}

export function effectiveBits(numScales: number, totalWeights: number, nBits: number): number {
  return nBits + (numScales * 32) / totalWeights;
}
