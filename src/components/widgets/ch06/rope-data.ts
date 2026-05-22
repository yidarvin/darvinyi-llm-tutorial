export const D_K = 8;
export const N_PAIRS = D_K / 2;
export const BASE = 10000;
export const MAX_POSITION = 50;

export const BASE_Q: number[] = [
  0.8, 0.3,
  -0.2, 0.7,
  0.5, -0.4,
  -0.6, 0.1,
];

export const PAIR_FREQUENCIES: number[] = Array.from({ length: N_PAIRS }, (_, k) =>
  1 / Math.pow(BASE, (2 * k) / D_K)
);

export const PAIR_PERIODS: number[] = PAIR_FREQUENCIES.map(omega => (2 * Math.PI) / omega);

export function rotateQ(position: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < N_PAIRS; k++) {
    const omega = PAIR_FREQUENCIES[k]!;
    const theta = position * omega;
    const x = BASE_Q[2 * k]!;
    const y = BASE_Q[2 * k + 1]!;
    out.push(x * Math.cos(theta) - y * Math.sin(theta));
    out.push(x * Math.sin(theta) + y * Math.cos(theta));
  }
  return out;
}

export function rotationAngle(pairIdx: number, position: number): number {
  return position * PAIR_FREQUENCIES[pairIdx]!;
}

export function formatAngle(theta: number): string {
  const mod = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return `${mod.toFixed(2)} rad`;
}

export function formatPeriod(period: number): string {
  if (period < 100) return `${period.toFixed(1)} positions`;
  return `${Math.round(period).toLocaleString()} positions`;
}
