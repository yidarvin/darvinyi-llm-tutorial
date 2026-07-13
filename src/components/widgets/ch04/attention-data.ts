export const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
export const N = TOKENS.length;
export const D_MODEL = 6;
export const D_K = 4;
export const D_V = 4;
export const SQRT_D_K = Math.sqrt(D_K);

export const X: number[][] = [
  [1.0, 0.2, -0.3, 0.1, 0.5, -0.1],
  [0.3, 1.0, 0.4, -0.2, -0.1, 0.6],
  [-0.2, 0.5, 1.0, 0.3, -0.4, 0.1],
  [0.1, -0.3, 0.4, 1.0, 0.2, -0.5],
  [1.0, 0.2, -0.3, 0.1, 0.5, -0.1],
  [0.4, 0.9, 0.1, -0.3, 0.2, 0.7],
];

const W_Q: number[][] = [
  [0.5, 0.0, 0.1, 0.2],
  [0.1, 0.6, 0.0, -0.1],
  [-0.1, 0.0, 0.7, 0.1],
  [0.0, -0.2, 0.1, 0.5],
  [0.3, 0.1, -0.1, 0.0],
  [0.1, 0.4, 0.0, 0.3],
];

const W_K: number[][] = [
  [0.6, -0.1, 0.0, 0.2],
  [-0.1, 0.7, 0.1, 0.0],
  [0.0, 0.1, 0.6, -0.1],
  [0.2, 0.0, -0.1, 0.5],
  [0.5, 0.1, 0.0, 0.1],
  [0.0, 0.5, 0.1, 0.0],
];

const W_V: number[][] = [
  [0.4, 0.2, 0.0, 0.1],
  [0.1, 0.5, 0.1, 0.0],
  [-0.1, 0.0, 0.6, 0.1],
  [0.2, 0.0, 0.0, 0.5],
  [0.3, 0.2, -0.1, 0.0],
  [0.0, 0.4, 0.1, 0.2],
];

function matmul(A: number[][], B: number[][]): number[][] {
  const m = A.length, n = B[0]!.length, p = B.length;
  const out = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < p; k++) s += A[i]![k]! * B[k]![j]!;
      out[i]![j] = s;
    }
  }
  return out;
}

function transpose(A: number[][]): number[][] {
  const m = A.length, n = A[0]!.length;
  const out = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) out[j]![i] = A[i]![j]!;
  return out;
}

function scaleMatrix(A: number[][], c: number): number[][] {
  return A.map(row => row.map(v => v * c));
}

function softmaxRows(A: number[][]): number[][] {
  return A.map(row => {
    const mx = Math.max(...row);
    const exps = row.map(v => Math.exp(v - mx));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => v / sum);
  });
}

export const Q: number[][] = matmul(X, W_Q);
export const K: number[][] = matmul(X, W_K);
export const V: number[][] = matmul(X, W_V);

export const K_T: number[][] = transpose(K);
export const RAW_SCORES: number[][] = matmul(Q, K_T);
export const SCALED_SCORES: number[][] = scaleMatrix(RAW_SCORES, 1 / SQRT_D_K);
export const ATTENTION_WEIGHTS: number[][] = softmaxRows(SCALED_SCORES);
export const OUTPUT: number[][] = matmul(ATTENTION_WEIGHTS, V);

export interface Stage {
  id: string;
  title: string;
  description: string;
  highlight: ('X' | 'Q' | 'K' | 'V' | 'scores' | 'scaled' | 'weights' | 'output')[];
}

// ---------------------------------------------------------------------------
// Causal mask computation (appended for session 20)
// ---------------------------------------------------------------------------

/**
 * The causal mask: 0 on or below the diagonal; -Infinity strictly above.
 * Added to scores before softmax — illegal positions become 0 in the
 * post-softmax weights.
 */
export const CAUSAL_MASK: number[][] = (() => {
  const m: number[][] = [];
  for (let i = 0; i < N; i++) {
    const row: number[] = [];
    for (let j = 0; j < N; j++) {
      row.push(j > i ? -Infinity : 0);
    }
    m.push(row);
  }
  return m;
})();

/**
 * For display purposes: a numeric representation of the mask that's friendly
 * to the diverging color scale. -Infinity is hard to render; we use a sentinel
 * value (-1000) that the widget interprets as "blocked".
 */
export const CAUSAL_MASK_DISPLAY: number[][] = (() => {
  const m: number[][] = [];
  for (let i = 0; i < N; i++) {
    const row: number[] = [];
    for (let j = 0; j < N; j++) {
      row.push(j > i ? -1000 : 0);
    }
    m.push(row);
  }
  return m;
})();

/** Scaled scores with the causal mask added (still pre-softmax). */
export const MASKED_SCALED_SCORES: number[][] = SCALED_SCORES.map((row, i) =>
  row.map((v, j) => j > i ? -Infinity : v)
);

/** Post-softmax attention weights with the causal mask applied. */
export const MASKED_ATTENTION_WEIGHTS: number[][] = (() => {
  return MASKED_SCALED_SCORES.map(row => {
    const validMax = Math.max(...row.filter(v => v !== -Infinity));
    const exps = row.map(v => v === -Infinity ? 0 : Math.exp(v - validMax));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => sum === 0 ? 0 : v / sum);
  });
})();

/** Output computed from the masked attention weights. */
export const MASKED_OUTPUT: number[][] = (() => {
  const m = MASKED_ATTENTION_WEIGHTS.length, n = V[0]!.length, p = V.length;
  const out: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < p; k++) s += MASKED_ATTENTION_WEIGHTS[i]![k]! * V[k]![j]!;
      out[i]![j] = s;
    }
  }
  return out;
})();

export const STAGES: Stage[] = [
  {
    id: 'input',
    title: 'Stage 1 — Input embeddings',
    description:
      "The 6-token sequence enters as a 6×6 matrix X. Each row is one token's embedding vector. This is what comes out of the embedding lookup (Chapter 2).",
    highlight: ['X'],
  },
  {
    id: 'projections',
    title: 'Stage 2 — Project to Q, K, V',
    description:
      'Three learned linear projections turn the same input X into three different matrices. Q (queries), K (keys), V (values). Each is 6×4 — six positions, four dimensions per position.',
    highlight: ['X', 'Q', 'K', 'V'],
  },
  {
    id: 'scores',
    title: 'Stage 3 — Attention scores: Q · Kᵀ',
    description:
      "The matrix product Q · Kᵀ produces a 6×6 matrix of dot products. Entry (i, j) is q_i · k_j — the similarity between position i's query and position j's key. We then divide by √d_k = 2 to control the variance (more on why in section 4).",
    highlight: ['Q', 'K', 'scores', 'scaled'],
  },
  {
    id: 'softmax',
    title: 'Stage 4 — Softmax: attention weights',
    description:
      "Row-wise softmax turns each row of scaled scores into a probability distribution. Each row sums to 1. With these particular Q/K projections and no positional encoding yet, every row's brightest cell sits on the diagonal — each token attends most strongly to itself — and the rest of the row's weight is spread thinly and fairly evenly across the other positions.",
    highlight: ['scaled', 'weights'],
  },
  {
    id: 'output',
    title: 'Stage 5 — Weighted sum: output',
    description:
      "The attention weights are applied to the values V via a final matmul. The output is 6×4 — each row is a weighted average of V rows, weighted by that position's attention distribution. This is what feeds into the next transformer layer.",
    highlight: ['weights', 'V', 'output'],
  },
];
