function softplus(x: number): number {
  if (x > 0) return x + Math.log1p(Math.exp(-x));
  return Math.log1p(Math.exp(x));
}

function sigmoid(x: number): number {
  if (x >= 0) {
    const e = Math.exp(-x);
    return 1 / (1 + e);
  }
  const e = Math.exp(x);
  return e / (1 + e);
}

export function dpoLoss(rChosen: number, rRejected: number): number {
  const diff = rChosen - rRejected;
  return softplus(-diff);
}

export function dpoGradient(rChosen: number, rRejected: number): { dChosen: number; dRejected: number } {
  const sigDiff = sigmoid(rChosen - rRejected);
  return {
    dChosen: sigDiff - 1,
    dRejected: 1 - sigDiff,
  };
}

export interface GridCell {
  i: number;
  j: number;
  rChosen: number;
  rRejected: number;
  loss: number;
}

export function buildLossGrid(
  domainMin = -3,
  domainMax = 3,
  resolution = 25,
): { cells: GridCell[]; minLoss: number; maxLoss: number } {
  const cells: GridCell[] = [];
  let minLoss = Infinity;
  let maxLoss = -Infinity;
  const step = (domainMax - domainMin) / resolution;
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const rChosen = domainMin + (i + 0.5) * step;
      const rRejected = domainMin + (j + 0.5) * step;
      const loss = dpoLoss(rChosen, rRejected);
      cells.push({ i, j, rChosen, rRejected, loss });
      if (loss < minLoss) minLoss = loss;
      if (loss > maxLoss) maxLoss = loss;
    }
  }
  maxLoss = Math.min(maxLoss, 6);
  return { cells, minLoss, maxLoss };
}

export function lossToColor(loss: number, minLoss: number, maxLoss: number): string {
  const t = Math.max(0, Math.min(1, (loss - minLoss) / (maxLoss - minLoss)));
  if (t < 0.5) {
    const tt = t * 2;
    return `color-mix(in srgb, var(--cyan-500) ${(1 - tt) * 75}%, var(--amber-400) ${tt * 75}%)`;
  } else {
    const tt = (t - 0.5) * 2;
    return `color-mix(in srgb, var(--amber-400) ${(1 - tt) * 75}%, var(--rose-400) ${tt * 75}%)`;
  }
}
