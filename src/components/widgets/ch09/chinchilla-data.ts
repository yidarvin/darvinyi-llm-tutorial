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
 * Compute-optimal allocation: the actual loss-minimizing point along the
 * 6*N*D = C constraint, found by sweeping the tokens-per-parameter ratio r
 * and taking the argmin of chinchillaLoss.
 *
 * Note: with Hoffmann et al.'s published parametric constants, this true
 * optimum is compute-dependent and lands well above the famous "~20 tokens
 * per parameter" rule of thumb (it's in the 50-150+ range over the slider's
 * compute span). The "~20" figure comes from Chinchilla's separate iso-FLOP
 * analysis, not from directly solving this parametric fit — see the chapter
 * prose for the distinction.
 */
export function computeOptimalAllocation(C: number): { N: number; D: number; r: number } {
  const rMin = 0.1;
  const rMax = 2000;
  const numPoints = 2000;
  let bestR = rMin;
  let bestN = 0;
  let bestD = 0;
  let bestLoss = Infinity;
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const r = rMin * Math.pow(rMax / rMin, t);
    const { N, D } = allocateByRatio(C, r);
    const loss = chinchillaLoss(N, D);
    if (loss < bestLoss) {
      bestLoss = loss;
      bestR = r;
      bestN = N;
      bestD = D;
    }
  }
  return { N: bestN, D: bestD, r: bestR };
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
      "The actual loss-minimizing ratio for this compute budget, found by sweeping the 6ND=C constraint. Marked at the bottom of the curve. This ratio drifts with compute (roughly 50-150+ tokens/parameter over this widget's range) — it doesn't sit at a fixed \"20,\" which is Chinchilla's separate iso-FLOP rule of thumb (and happens to match the real Chinchilla model's own 70B-param/1.4T-token ratio) rather than a consequence of this parametric fit.",
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
