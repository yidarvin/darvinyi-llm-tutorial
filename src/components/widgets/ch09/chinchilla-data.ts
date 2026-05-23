/**
 * Chinchilla scaling law constants from Hoffmann et al. 2022 (approximate).
 * L(N, D) = E + A / N^alpha + B / D^beta
 */
export const E = 1.69;
export const A = 406.0;
export const B = 410.0;
export const ALPHA = 0.34;
export const BETA = 0.28;

/** Compute = 6 * N * D (forward 2ND + backward 4ND). */
export function chinchillaLoss(N: number, D: number): number {
  return E + A / Math.pow(N, ALPHA) + B / Math.pow(D, BETA);
}

/**
 * Given a compute budget C and a tokens-per-parameter ratio r = D / N,
 * solve for N and D under the constraint 6 * N * D = C.
 *
 * From 6 * N * D = C and D = r * N:
 *   6 * N * (r * N) = C
 *   N^2 = C / (6r)
 *   N = sqrt(C / (6r))
 *   D = r * N
 */
export function allocateByRatio(C: number, r: number): { N: number; D: number } {
  const N = Math.sqrt(C / (6 * r));
  const D = r * N;
  return { N, D };
}

/**
 * Compute-optimal allocation under Chinchilla:
 *   N propto C^(beta/(alpha+beta)), D propto C^(alpha/(alpha+beta))
 * For the fitted constants, the optimum is approximately D/N = 20.
 */
export function computeOptimalAllocation(C: number): { N: number; D: number } {
  return allocateByRatio(C, 20);
}

export interface Strategy {
  key: 'kaplan' | 'chinchilla' | 'llama3';
  label: string;
  shortLabel: string;
  ratio: number;
  description: string;
  color: string;
}

export const STRATEGIES: Strategy[] = [
  {
    key: 'kaplan',
    label: 'Kaplan-style (overlarge model)',
    shortLabel: 'Kaplan',
    ratio: 1.7,
    description:
      'The original 2020 scaling law recommendation. ~1.7 tokens per parameter — most compute goes to making the model larger. Used by GPT-3 (175B params, 300B tokens). Significantly undertrains the model; sits notably above the Chinchilla optimum on the loss curve.',
    color: 'var(--rose-400)',
  },
  {
    key: 'chinchilla',
    label: 'Chinchilla optimal',
    shortLabel: 'Chinchilla ★',
    ratio: 20,
    description:
      'The Hoffmann et al. 2022 compute-optimal allocation. ~20 tokens per parameter. Minimizes loss given a fixed compute budget. Used by Chinchilla itself (70B params, 1.4T tokens) and many post-2022 frontier training runs. The mathematical optimum.',
    color: 'var(--cyan-400)',
  },
  {
    key: 'llama3',
    label: 'Llama-3 style (over-trained small)',
    shortLabel: 'Llama-3 style',
    ratio: 250,
    description:
      'Over-train a smaller architecture past Chinchilla-optimal. ~100-2000 tokens per parameter; here we use 250 as a representative value. Llama-3 8B trained on 15T tokens — about 100× past Chinchilla. Slight loss penalty during training; major savings during inference (smaller model = cheaper to serve).',
    color: 'var(--amber-400)',
  },
];

/**
 * Sample the loss curve along the iso-compute constraint.
 * Returns ~120 points sweeping r from 0.1 to 2000 (log scale).
 */
export function sampleLossCurve(
  C: number,
  numPoints = 120,
): { r: number; N: number; D: number; loss: number }[] {
  const rMin = 0.1;
  const rMax = 2000;
  const points: { r: number; N: number; D: number; loss: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const r = rMin * Math.pow(rMax / rMin, t);
    const { N, D } = allocateByRatio(C, r);
    const loss = chinchillaLoss(N, D);
    points.push({ r, N, D, loss });
  }
  return points;
}

/** Format very large/small numbers compactly: 7.0e9 → "7.0B", 1.4e12 → "1.4T". */
export function formatLargeNumber(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

/** Compute budget slider runs in log space. Map slider [0, 1] to log(FLOPs). */
export const LOG_C_MIN = 21;
export const LOG_C_MAX = 26;

export function sliderToCompute(sliderValue: number): number {
  return Math.pow(10, LOG_C_MIN + sliderValue * (LOG_C_MAX - LOG_C_MIN));
}

export function computeToSlider(C: number): number {
  return (Math.log10(C) - LOG_C_MIN) / (LOG_C_MAX - LOG_C_MIN);
}
