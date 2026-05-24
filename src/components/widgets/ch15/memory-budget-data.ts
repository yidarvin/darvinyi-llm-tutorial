export type ModelSizeId = '7b' | '13b' | '70b';
export type MethodId = 'full' | 'lora' | 'qlora';
export type TargetId = 'qv' | 'qkvo' | 'all';

export interface ModelSize {
  id: ModelSizeId;
  label: string;
  totalParams: number;
  d_model: number;
  n_layers: number;
  activationsGB: number;
}

export const MODEL_SIZES: Record<ModelSizeId, ModelSize> = {
  '7b':  { id: '7b',  label: '7B',  totalParams: 7e9,  d_model: 4096, n_layers: 32, activationsGB: 3 },
  '13b': { id: '13b', label: '13B', totalParams: 13e9, d_model: 5120, n_layers: 40, activationsGB: 4 },
  '70b': { id: '70b', label: '70B', totalParams: 70e9, d_model: 8192, n_layers: 80, activationsGB: 8 },
};

export interface Method {
  id: MethodId;
  label: string;
  description: string;
  /** Bytes per base parameter (e.g., 2 for BF16, 0.5 for NF4). */
  baseBytesPerParam: number;
  trainsBase: boolean;
}

export const METHODS: Record<MethodId, Method> = {
  full:  { id: 'full',  label: 'Full FT', description: 'Train all parameters; BF16 weights + grads + FP32 AdamW state.', baseBytesPerParam: 2,   trainsBase: true  },
  lora:  { id: 'lora',  label: 'LoRA',    description: 'Freeze base in BF16; train LoRA adapters only.',                 baseBytesPerParam: 2,   trainsBase: false },
  qlora: { id: 'qlora', label: 'QLoRA',   description: '4-bit NF4 base + BF16 LoRA adapters.',                            baseBytesPerParam: 0.5, trainsBase: false },
};

export interface Target {
  id: TargetId;
  label: string;
  count: number;
}

export const TARGETS: Record<TargetId, Target> = {
  qv:   { id: 'qv',   label: 'Q + V',      count: 2 },
  qkvo: { id: 'qkvo', label: 'Q, K, V, O', count: 4 },
  all:  { id: 'all',  label: 'All linear', count: 6 },
};

export interface MemoryBreakdown {
  baseWeights: number;
  trainableParams: number;
  gradients: number;
  optimizerState: number;
  activations: number;
  total: number;
  trainableCount: number;
  trainableRatio: number;
  adapterDiskMB: number;
}

export function computeMemory(
  modelId: ModelSizeId,
  methodId: MethodId,
  rank: number,
  targetId: TargetId,
): MemoryBreakdown {
  const model = MODEL_SIZES[modelId];
  const method = METHODS[methodId];
  const target = TARGETS[targetId];

  let trainableCount: number;
  if (method.id === 'full') {
    trainableCount = model.totalParams;
  } else {
    // LoRA: target_count * 2 * d_model * rank per layer * n_layers
    trainableCount = target.count * 2 * model.d_model * rank * model.n_layers;
  }

  const baseWeightsBytes = model.totalParams * method.baseBytesPerParam;
  const trainableWeightsBytes = method.id === 'full' ? 0 : trainableCount * 2;
  const gradientsBytes = trainableCount * 2;            // BF16 gradients
  const optimizerBytes = trainableCount * 8;            // AdamW FP32 (2 moments × 4 bytes)
  const activationsBytes = model.activationsGB * 1e9;

  const totalBytes =
    baseWeightsBytes + trainableWeightsBytes + gradientsBytes + optimizerBytes + activationsBytes;

  return {
    baseWeights: baseWeightsBytes / 1e9,
    trainableParams: trainableWeightsBytes / 1e9,
    gradients: gradientsBytes / 1e9,
    optimizerState: optimizerBytes / 1e9,
    activations: activationsBytes / 1e9,
    total: totalBytes / 1e9,
    trainableCount,
    trainableRatio: trainableCount / model.totalParams,
    adapterDiskMB: method.id === 'full' ? 0 : (trainableCount * 2) / 1e6,
  };
}

export interface GPUOption {
  label: string;
  memoryGB: number;
}

export const GPU_OPTIONS: GPUOption[] = [
  { label: 'RTX 4090',     memoryGB: 24 },
  { label: 'A6000',        memoryGB: 48 },
  { label: 'A100 / H100',  memoryGB: 80 },
  { label: '2× A100 80GB', memoryGB: 160 },
  { label: '4× A100 80GB', memoryGB: 320 },
  { label: '8× A100 80GB', memoryGB: 640 },
];

export function formatParams(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n.toFixed(0)}`;
}

export const RANK_OPTIONS = [4, 8, 16, 32, 64];
