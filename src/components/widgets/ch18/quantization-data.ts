/** Seeded PRNG (mulberry32) for deterministic weight generation. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller transform: uniform → normal */
function boxMuller(u1: number, u2: number): number {
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Generate N normally-distributed weights with seed. */
export function generateWeights(
  n: number,
  mean: number,
  stddev: number,
  seed: number,
): number[] {
  const rand = mulberry32(seed);
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    samples.push(mean + stddev * boxMuller(u1, u2));
  }
  return samples;
}

/** Pre-generated weights: 1000 samples from N(0, 0.1). Fixed across instances. */
export const WEIGHTS: number[] = generateWeights(1000, 0, 0.1, 42);

/** NF4 levels — equiprobable normal quantiles, symmetric, normalized to [-1, 1]. */
export const NF4_LEVELS: number[] = [
  -1.0, -0.6961, -0.5251, -0.3947, -0.2844, -0.1848, -0.0911, 0.0, 0.0796,
  0.1602, 0.2461, 0.3379, 0.4407, 0.5626, 0.723, 1.0,
];

/** Quantize using INT levels (uniformly-spaced). */
export function quantizeINT(
  value: number,
  scale: number,
  qmin: number,
  qmax: number,
): number {
  const intVal = Math.max(qmin, Math.min(qmax, Math.round(value / scale)));
  return intVal * scale;
}

/** Quantize using NF4 levels (lookup nearest). */
export function quantizeNF4(value: number, scale: number): number {
  const normalized = value / scale;
  let bestLevel = NF4_LEVELS[0]!;
  let bestDist = Math.abs(normalized - bestLevel);
  for (const level of NF4_LEVELS) {
    const dist = Math.abs(normalized - level);
    if (dist < bestDist) {
      bestDist = dist;
      bestLevel = level;
    }
  }
  return bestLevel * scale;
}

/** Format for quantization (INT or NF; NF only valid at 4 bits). */
export type Format = 'INT' | 'NF';

/** Compute quantized weights and grid levels. */
export function quantizeAll(
  weights: number[],
  nBits: number,
  format: Format,
): {
  quantized: number[];
  gridLevels: number[];
  scale: number;
  numLevels: number;
} {
  if (nBits >= 16) {
    // Pseudo-FP16: just return originals. Real FP16 has its own quantization
    // structure but the per-weight error is negligible vs INT8/4/2 and the
    // widget's pedagogical point is the bit-width tradeoff.
    return {
      quantized: weights.slice(),
      gridLevels: [],
      scale: 0,
      numLevels: 65536,
    };
  }

  const absMax = weights.reduce((m, w) => Math.max(m, Math.abs(w)), 0);

  if (nBits === 4 && format === 'NF') {
    const scale = absMax;
    const quantized = weights.map((w) => quantizeNF4(w, scale));
    const gridLevels = NF4_LEVELS.map((l) => l * scale);
    return { quantized, gridLevels, scale, numLevels: 16 };
  }

  // INT quantization (uniform levels)
  const qmax = Math.pow(2, nBits - 1) - 1;
  const qmin = -qmax - 1;
  const scale = absMax / qmax;
  const quantized = weights.map((w) => quantizeINT(w, scale, qmin, qmax));
  const gridLevels: number[] = [];
  for (let i = qmin; i <= qmax; i++) {
    gridLevels.push(i * scale);
  }
  return { quantized, gridLevels, scale, numLevels: qmax - qmin + 1 };
}

/** Compute error metrics. */
export function computeMetrics(
  original: number[],
  quantized: number[],
): { mse: number; maxErr: number } {
  let sumSqErr = 0;
  let maxErr = 0;
  for (let i = 0; i < original.length; i++) {
    const err = original[i]! - quantized[i]!;
    sumSqErr += err * err;
    if (Math.abs(err) > maxErr) maxErr = Math.abs(err);
  }
  return { mse: sumSqErr / original.length, maxErr };
}

/** Build a histogram (returns bin counts). */
export function buildHistogram(
  values: number[],
  nBins: number,
  valMin: number,
  valMax: number,
): number[] {
  const counts = new Array(nBins).fill(0);
  const binWidth = (valMax - valMin) / nBins;
  for (const v of values) {
    let bin = Math.floor((v - valMin) / binWidth);
    if (bin < 0) bin = 0;
    if (bin >= nBins) bin = nBins - 1;
    counts[bin]++;
  }
  return counts;
}

/** Insight text based on bit width and format. */
export function insightFor(nBits: number, format: Format): string {
  if (nBits >= 16)
    return 'FP16 baseline — nearly indistinguishable from FP32. The reference.';
  if (nBits === 8)
    return 'INT8 — practically lossless for most weight distributions. Production default.';
  if (nBits === 4 && format === 'NF')
    return 'NF4 — levels placed at equiprobable normal quantiles. Denser near zero (where weights live); better quality per bit for normally-distributed weights.';
  if (nBits === 4)
    return 'INT4 uniform — visible quantization error in the tails. Needs per-group scaling and/or NF4 to be production-ready.';
  if (nBits === 3)
    return 'INT3 — quality starts to degrade noticeably. Active research area; typically combined with sophisticated PTQ.';
  if (nBits === 2)
    return 'INT2 — only 4 levels. Catastrophic for general use; works only with sophisticated methods (AQLM, QuIP#).';
  return '';
}

/** Effective bits per weight including scale overhead. */
export function effectiveBits(
  nBits: number,
  weightsPerScale: number = 1000,
): number {
  // 32-bit FP scale, one per `weightsPerScale` weights (here: per-tensor for 1000)
  return nBits + 32 / weightsPerScale;
}
