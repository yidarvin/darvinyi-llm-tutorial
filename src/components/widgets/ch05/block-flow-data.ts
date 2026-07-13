export const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
export const N = TOKENS.length;
export const D_MODEL = 6;

export interface BlockStage {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  /** 6 × 6 data matrix — 6 tokens, 6 features */
  data: number[][];
  /** Which operation produced this stage. */
  via: 'input' | 'layer-norm-1' | 'mha' | 'residual-1' | 'layer-norm-2' | 'ffn' | 'residual-2';
}

const INPUT: number[][] = [
  [ 0.8, -0.3,  0.2,  0.5, -0.1,  0.4],
  [-0.2,  0.6,  0.4, -0.3,  0.5,  0.1],
  [ 0.3,  0.1, -0.5,  0.7,  0.2, -0.3],
  [ 0.5, -0.4,  0.3,  0.2, -0.6,  0.4],
  [ 0.7, -0.2,  0.1,  0.6, -0.2,  0.3],
  [-0.1,  0.5,  0.6, -0.2,  0.4, -0.4],
];

const AFTER_LN1: number[][] = [
  [ 1.5, -1.5, -0.1,  0.7, -0.9,  0.4],
  [-1.1,  1.2,  0.6, -1.4,  0.9, -0.2],
  [ 0.6,  0.0, -1.5,  1.6,  0.3, -1.0],
  [ 1.0, -1.1,  0.6,  0.3, -1.6,  0.8],
  [ 1.4, -1.2, -0.3,  1.1, -1.2,  0.2],
  [-0.6,  1.0,  1.2, -0.9,  0.7, -1.4],
];

const AFTER_MHA: number[][] = [
  [ 0.2, -0.1,  0.3,  0.4, -0.2,  0.1],
  [ 0.1,  0.3,  0.2, -0.1,  0.4,  0.2],
  [ 0.2,  0.1, -0.2,  0.5,  0.1, -0.1],
  [ 0.4, -0.2,  0.3,  0.1, -0.3,  0.3],
  [ 0.3, -0.1,  0.1,  0.4, -0.1,  0.2],
  [ 0.1,  0.4,  0.4, -0.1,  0.3, -0.2],
];

const AFTER_RESIDUAL_1: number[][] = INPUT.map((row, i) =>
  row.map((v, j) => +(v + AFTER_MHA[i]![j]!).toFixed(2))
);

const AFTER_LN2: number[][] = [
  [ 1.2, -1.4,  0.2,  1.0, -1.2,  0.2],
  [-1.0,  1.1,  0.5, -1.6,  1.1, -0.1],
  [ 0.5,  0.0, -1.4,  1.7,  0.2, -0.9],
  [ 1.1, -1.1,  0.6,  0.2, -1.6,  0.8],
  [ 1.2, -1.2, -0.3,  1.2, -1.2,  0.3],
  [-0.5,  1.0,  1.2, -0.9,  0.7, -1.4],
];

const AFTER_FFN: number[][] = [
  [ 0.3, -0.2,  0.4,  0.6, -0.1,  0.2],
  [-0.1,  0.5,  0.3, -0.2,  0.6,  0.1],
  [ 0.4,  0.2, -0.3,  0.8,  0.2, -0.1],
  [ 0.5, -0.3,  0.4,  0.3, -0.4,  0.4],
  [ 0.5, -0.1,  0.2,  0.6, -0.1,  0.3],
  [ 0.0,  0.5,  0.6, -0.1,  0.4, -0.3],
];

const AFTER_RESIDUAL_2: number[][] = AFTER_RESIDUAL_1.map((row, i) =>
  row.map((v, j) => +(v + AFTER_FFN[i]![j]!).toFixed(2))
);

export const STAGES: BlockStage[] = [
  {
    id: 'input',
    label: 'Input',
    shortLabel: 'Input',
    description: 'The block receives an n × d_model matrix as input: for example, the output of the previous block, or the embedded tokens plus positional encoding for the first block.',
    data: INPUT,
    via: 'input',
  },
  {
    id: 'after-ln-1',
    label: 'After LayerNorm₁',
    shortLabel: 'LN₁',
    description: 'The first layer norm normalizes each token\'s features to zero mean and unit standard deviation. Notice the values are now more uniform in magnitude across all six tokens: this is the "scale reset" that stabilizes training.',
    data: AFTER_LN1,
    via: 'layer-norm-1',
  },
  {
    id: 'after-mha',
    label: 'After Multi-Head Attention',
    shortLabel: 'MHA',
    description: 'Multi-head attention mixes information across positions. Each token\'s row is now a weighted combination of all positions\' values. The magnitudes are different from the LN₁ output: attention has reshaped the representation.',
    data: AFTER_MHA,
    via: 'mha',
  },
  {
    id: 'after-residual-1',
    label: 'After Residual₁ (= Input + MHA)',
    shortLabel: 'Res₁',
    description: 'The first residual adds the unchanged input to the attention output. The original input information is still present (look at the values, they\'re close to "Input" plus a small attention contribution). This is the gradient highway: even if attention\'s gradient is small, the identity path preserves it.',
    data: AFTER_RESIDUAL_1,
    via: 'residual-1',
  },
  {
    id: 'after-ln-2',
    label: 'After LayerNorm₂',
    shortLabel: 'LN₂',
    description: 'The second layer norm normalizes again, preparing the data for the FFN. The residual + LN pattern means each sublayer always receives normalized input, regardless of how large the residual stream grows.',
    data: AFTER_LN2,
    via: 'layer-norm-2',
  },
  {
    id: 'after-ffn',
    label: 'After FFN',
    shortLabel: 'FFN',
    description: 'The feedforward network applies a per-token MLP: expanding to 4× hidden dim, applying GELU, contracting back. Unlike attention, the FFN does not mix across tokens; each token is processed independently. This is the "think alone" step that follows attention\'s "talk to others" step.',
    data: AFTER_FFN,
    via: 'ffn',
  },
  {
    id: 'after-residual-2',
    label: 'After Residual₂: Output',
    shortLabel: 'Output',
    description: 'The second residual adds the post-FFN output to the post-Residual₁ values. The block\'s output. This goes to the next block (or, in the final block, to the output projection / unembedding). Notice the values: the original input from stage 0 is still detectable, plus refinements from both sublayers.',
    data: AFTER_RESIDUAL_2,
    via: 'residual-2',
  },
];
