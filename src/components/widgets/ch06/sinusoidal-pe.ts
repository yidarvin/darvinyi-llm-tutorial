/**
 * Compute sinusoidal positional encoding.
 * Returns a (max_len, d_model) 2D array of PE values.
 */
export function sinusoidalPE(maxLen: number, dModel: number, base: number = 10000): number[][] {
  const pe: number[][] = [];
  for (let p = 0; p < maxLen; p++) {
    const row: number[] = [];
    for (let d = 0; d < dModel; d++) {
      const k = Math.floor(d / 2);
      const omega = 1 / Math.pow(base, (2 * k) / dModel);
      const angle = p * omega;
      const value = d % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
      row.push(value);
    }
    pe.push(row);
  }
  return pe;
}

/**
 * Compute the period (in positions) for a given dimension.
 * The period is the number of positions over which the sin/cos completes one full cycle.
 */
export function periodForDimension(d: number, dModel: number, base: number = 10000): number {
  const k = Math.floor(d / 2);
  const omega = 1 / Math.pow(base, (2 * k) / dModel);
  return (2 * Math.PI) / omega;
}

/**
 * Compute a single dimension's wave values across all positions.
 */
export function waveForDimension(d: number, dModel: number, maxLen: number, base: number = 10000): number[] {
  const k = Math.floor(d / 2);
  const omega = 1 / Math.pow(base, (2 * k) / dModel);
  const wave: number[] = [];
  const fn = d % 2 === 0 ? Math.sin : Math.cos;
  for (let p = 0; p < maxLen; p++) {
    wave.push(fn(p * omega));
  }
  return wave;
}

/** Format a period nicely (e.g. 6.28 → "≈ 6.3 positions"; 62831 → "≈ 62,831 positions"). */
export function formatPeriod(period: number): string {
  if (period < 100) return `≈ ${period.toFixed(1)} positions`;
  return `≈ ${Math.round(period).toLocaleString()} positions`;
}
