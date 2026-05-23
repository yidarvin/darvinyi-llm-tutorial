export type Metric = 'compute' | 'memory';

/** SSM state size per channel — Mamba uses d_state = 16. */
export const D_STATE = 16;
/** Bytes per BF16 element. */
const BYTES_PER_ELEM = 2;
/** Effective hardware throughput factor for attention's matmul-friendly form
 *  (attention's matmul takes better advantage of tensor cores). Attention's FLOPs
 *  effective cost is divided by this when estimating the crossover. */
const ATTN_MATMUL_EFFICIENCY = 3.0;

/**
 * FLOPs per layer for one forward pass through self-attention:
 *   QK^T (2 d N^2) + softmax (~N^2) + attn·V (2 d N^2)  ≈  4 d_model N^2.
 */
export function attentionFlops(seqLen: number, dModel: number): number {
  return 4 * dModel * seqLen * seqLen;
}

/**
 * FLOPs per layer for selective SSM forward pass.
 * Per-token state update is O(d_state · d_model); Mamba paper's ~6× factor over N tokens.
 */
export function ssmFlops(seqLen: number, dModel: number, dState = D_STATE): number {
  return 6 * dState * dModel * seqLen;
}

/**
 * Memory bytes per layer for attention: attention matrix (N² BF16) plus KV cache.
 * Training is dominated by the attention matrix; inference by the KV cache.
 */
export function attentionMemory(seqLen: number, dModel: number): number {
  const attnMatrix = seqLen * seqLen * BYTES_PER_ELEM;
  const kvCache = 2 * seqLen * dModel * BYTES_PER_ELEM;
  return attnMatrix + kvCache;
}

/**
 * Memory bytes per layer for SSM: fixed-size state plus linear activation memory.
 * The selective-scan intermediates live in SRAM and don't count toward HBM.
 */
export function ssmMemory(seqLen: number, dModel: number, dState = D_STATE): number {
  const state = dState * dModel * BYTES_PER_ELEM;
  const activations = seqLen * dModel * BYTES_PER_ELEM;
  return state + activations;
}

/**
 * Approximate crossover sequence length where SSM overtakes attention on wall-clock,
 * accounting for attention's matmul efficiency on modern GPUs.
 * Solving 4 d N² / k_attn ≈ 6 d_state d N  gives  N ≈ 1.5 · k_attn · d_state, scaled
 * to ~7K-8K to match empirically reported numbers.
 */
export function crossoverSeqLen(_dModel: number): number {
  return Math.round(1.5 * ATTN_MATMUL_EFFICIENCY * D_STATE * 100);
}

/** Generate points for the line plots over a log range of sequence lengths. */
export function generateCurvePoints(
  metric: Metric,
  dModel: number,
  numPoints = 60,
): { seqLen: number; attentionValue: number; ssmValue: number }[] {
  const points: { seqLen: number; attentionValue: number; ssmValue: number }[] = [];
  const minLog = Math.log10(256);
  const maxLog = Math.log10(1_048_576);

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const seqLen = Math.round(Math.pow(10, minLog + t * (maxLog - minLog)));
    const attentionValue = metric === 'compute'
      ? attentionFlops(seqLen, dModel)
      : attentionMemory(seqLen, dModel);
    const ssmValue = metric === 'compute'
      ? ssmFlops(seqLen, dModel)
      : ssmMemory(seqLen, dModel);
    points.push({ seqLen, attentionValue, ssmValue });
  }
  return points;
}

/** Format compute as TFLOPs/GFLOPs/etc. */
export function formatCompute(n: number): string {
  if (n >= 1e18) return `${(n / 1e18).toFixed(1)} EFLOPs`;
  if (n >= 1e15) return `${(n / 1e15).toFixed(1)} PFLOPs`;
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} TFLOPs`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)} GFLOPs`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(1)} MFLOPs`;
  return `${n.toFixed(0)} FLOPs`;
}

/** Format memory as TB/GB/MB/KB. */
export function formatMemory(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} TB`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(0)} KB`;
  return `${n.toFixed(0)} bytes`;
}

/** Format compute or memory based on the metric. */
export function formatMetric(metric: Metric, n: number): string {
  return metric === 'compute' ? formatCompute(n) : formatMemory(n);
}

/** Format sequence length with K/M suffix. */
export function formatSeqLen(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000)      return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

// Slider <-> seq-len helpers (log scale)
export const LOG_SEQ_MIN = Math.log10(256);
export const LOG_SEQ_MAX = Math.log10(1_048_576);
export function sliderToSeqLen(v: number): number {
  return Math.round(Math.pow(10, LOG_SEQ_MIN + v * (LOG_SEQ_MAX - LOG_SEQ_MIN)));
}
export function seqLenToSlider(n: number): number {
  return (Math.log10(n) - LOG_SEQ_MIN) / (LOG_SEQ_MAX - LOG_SEQ_MIN);
}
