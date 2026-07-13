export const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
export const N = TOKENS.length;

export interface HeadSpec {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  /** 6x6 post-softmax attention weights; rows sum to 1. */
  attention: number[][];
}

function normalize(unnormalized: number[][]): number[][] {
  return unnormalized.map(row => {
    const sum = row.reduce((a, b) => a + b, 0);
    return sum === 0 ? row : row.map(v => v / sum);
  });
}

// Head 1: Local attention — each token attends to itself + adjacent tokens
const HEAD_1_RAW: number[][] = [
  [0.6, 0.3, 0.05, 0.02, 0.02, 0.01],
  [0.25, 0.5, 0.2, 0.02, 0.02, 0.01],
  [0.02, 0.25, 0.5, 0.2, 0.02, 0.01],
  [0.01, 0.02, 0.25, 0.5, 0.2, 0.02],
  [0.01, 0.02, 0.02, 0.25, 0.5, 0.2],
  [0.01, 0.02, 0.02, 0.05, 0.3, 0.6],
];

// Head 2: Backward shift — each token attends primarily to the previous token
const HEAD_2_RAW: number[][] = [
  [0.8, 0.05, 0.05, 0.05, 0.025, 0.025],
  [0.8, 0.15, 0.02, 0.01, 0.01, 0.01],
  [0.05, 0.8, 0.1, 0.02, 0.02, 0.01],
  [0.02, 0.05, 0.8, 0.1, 0.02, 0.01],
  [0.01, 0.02, 0.05, 0.8, 0.1, 0.02],
  [0.01, 0.01, 0.02, 0.05, 0.8, 0.11],
];

// Head 3: "the"-detection — every token attends primarily to "the" positions (0 and 4)
const HEAD_3_RAW: number[][] = [
  [0.5, 0.1, 0.05, 0.05, 0.25, 0.05],
  [0.45, 0.1, 0.05, 0.05, 0.3, 0.05],
  [0.4, 0.1, 0.1, 0.05, 0.3, 0.05],
  [0.4, 0.1, 0.05, 0.1, 0.3, 0.05],
  [0.4, 0.1, 0.05, 0.05, 0.35, 0.05],
  [0.4, 0.1, 0.05, 0.05, 0.3, 0.1],
];

// Head 4: Ending-broadcast — later tokens attend broadly to earlier tokens
const HEAD_4_RAW: number[][] = [
  [0.85, 0.05, 0.04, 0.03, 0.02, 0.01],
  [0.35, 0.55, 0.04, 0.03, 0.02, 0.01],
  [0.3, 0.25, 0.35, 0.05, 0.03, 0.02],
  [0.25, 0.2, 0.2, 0.25, 0.07, 0.03],
  [0.2, 0.18, 0.18, 0.18, 0.2, 0.06],
  [0.18, 0.16, 0.16, 0.17, 0.17, 0.16],
];

export const HEADS: HeadSpec[] = [
  {
    id: 'head-1',
    label: 'Head 1: Local attention',
    shortLabel: 'Local',
    description: 'Each token attends primarily to itself and its immediate neighbors. This kind of "local" head captures short-range syntactic patterns, n-gram-like dependencies.',
    attention: normalize(HEAD_1_RAW),
  },
  {
    id: 'head-2',
    label: 'Head 2: Backward shift',
    shortLabel: 'Previous',
    description: 'Each token attends primarily to the previous token. A backward-shift head implements something like "the most recent token", useful for syntactic dependencies that always look one step back.',
    attention: normalize(HEAD_2_RAW),
  },
  {
    id: 'head-3',
    label: 'Head 3: "the"-detection',
    shortLabel: '"the"',
    description: 'Every token attends primarily to positions where "the" appears (positions 0 and 4). A "token-specific detector" head finds occurrences of a particular word regardless of position.',
    attention: normalize(HEAD_3_RAW),
  },
  {
    id: 'head-4',
    label: 'Head 4: Ending broadcast',
    shortLabel: 'Spread',
    description: 'Later tokens attend broadly to earlier tokens. A "broadcast" head aggregates global context, useful when the current token needs to draw on the whole prefix.',
    attention: normalize(HEAD_4_RAW),
  },
];

/**
 * Per-token "summary intensity" per head, for visualizing the concat step.
 * The actual per-head output is (n × d_v); we summarize to one scalar per
 * (token, head) for visual simplicity.
 */
export const PER_HEAD_OUTPUT_SUMMARY: number[][] = [
  [0.62, 0.58, 0.65, 0.55],
  [0.55, 0.72, 0.60, 0.50],
  [0.48, 0.65, 0.55, 0.60],
  [0.50, 0.50, 0.62, 0.65],
  [0.65, 0.55, 0.70, 0.58],
  [0.58, 0.62, 0.60, 0.70],
];

/** Final combined output: per-token "intensity" after concat + W_O projection. */
export const COMBINED_OUTPUT_SUMMARY: number[] = [0.60, 0.59, 0.57, 0.57, 0.62, 0.63];
