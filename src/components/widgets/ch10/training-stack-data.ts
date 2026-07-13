export type GPUKey = 'h100' | 'a100' | 'mi300x';

export interface GPUSpec {
  key: GPUKey;
  label: string;
  memoryGB: number;
  peakFlopsBF16: number;
  hourlyCostUSD: number;
}

export const GPU_SPECS: GPUSpec[] = [
  { key: 'h100', label: 'H100 80GB', memoryGB: 80, peakFlopsBF16: 989, hourlyCostUSD: 5.0 },
  { key: 'a100', label: 'A100 80GB', memoryGB: 80, peakFlopsBF16: 312, hourlyCostUSD: 2.5 },
  { key: 'mi300x', label: 'MI300X 192GB', memoryGB: 192, peakFlopsBF16: 1300, hourlyCostUSD: 4.5 },
];

export type StackKey = 'dp' | 'fsdp' | 'megatron_fsdp' | 'megatron_deepspeed';

export interface StackResult {
  key: StackKey;
  label: string;
  shortLabel: string;
  tpRank: number;
  ppRank: number;
  dpRank: number;
  memoryPerGPU: number;
  stateMemoryPerGPU: number;
  activationMemoryPerGPU: number;
  fits: boolean;
  mfuEstimate: number;
  rationale: string;
}

export function evaluateStacks(
  modelParams: number,
  gpu: GPUSpec,
  gpuCount: number,
): StackResult[] {
  const STATE_BYTES_PER_PARAM = 18;
  const totalStateGB = (modelParams * STATE_BYTES_PER_PARAM) / 1e9;
  const baseActivationGB = totalStateGB * 0.1;

  const dp: StackResult = {
    key: 'dp',
    label: 'Vanilla Data Parallelism',
    shortLabel: 'DP',
    tpRank: 1,
    ppRank: 1,
    dpRank: gpuCount,
    stateMemoryPerGPU: totalStateGB,
    activationMemoryPerGPU: baseActivationGB,
    memoryPerGPU: totalStateGB + baseActivationGB,
    fits: totalStateGB + baseActivationGB < gpu.memoryGB * 0.9,
    mfuEstimate: estimateMFU('dp', gpuCount),
    rationale:
      'Each GPU holds the full model + grads + optimizer state. Simplest stack but does not scale to large models: each GPU needs to hold the entire state.',
  };

  const fsdpStateMem = totalStateGB / gpuCount;
  const fsdp: StackResult = {
    key: 'fsdp',
    label: 'PyTorch FSDP',
    shortLabel: 'FSDP',
    tpRank: 1,
    ppRank: 1,
    dpRank: gpuCount,
    stateMemoryPerGPU: fsdpStateMem,
    activationMemoryPerGPU: baseActivationGB,
    memoryPerGPU: fsdpStateMem + baseActivationGB,
    fits: fsdpStateMem + baseActivationGB < gpu.memoryGB * 0.9,
    mfuEstimate: estimateMFU('fsdp', gpuCount),
    rationale:
      "ZeRO-3 shards model, grads, and optimizer state across DP ranks. Each layer's params are all-gathered just before compute, then discarded. Standard choice for 1B-30B models.",
  };

  const tpRank = Math.min(8, gpuCount);
  const remainingAfterTP = Math.max(1, Math.floor(gpuCount / tpRank));
  const megatronFsdpStateMem = totalStateGB / (tpRank * remainingAfterTP);
  const megaFsdp: StackResult = {
    key: 'megatron_fsdp',
    label: 'Megatron-LM + FSDP',
    shortLabel: 'Megatron+FSDP',
    tpRank,
    ppRank: 1,
    dpRank: remainingAfterTP,
    stateMemoryPerGPU: megatronFsdpStateMem,
    activationMemoryPerGPU: baseActivationGB / tpRank,
    memoryPerGPU: megatronFsdpStateMem + baseActivationGB / tpRank,
    fits: megatronFsdpStateMem + baseActivationGB / tpRank < gpu.memoryGB * 0.9,
    mfuEstimate: estimateMFU('megatron_fsdp', gpuCount, tpRank),
    rationale:
      'Tensor parallelism (TP=8 within a node, NVLink) for activation sharding; FSDP across nodes for state sharding. Standard choice for 30B-100B models.',
  };

  const tpRank3D = 8;
  const ppRank3D = modelParams < 100e9 ? 4 : modelParams < 500e9 ? 8 : 16;
  const dpRank3D = Math.max(1, Math.floor(gpuCount / (tpRank3D * ppRank3D)));
  const megaDS_stateMem = totalStateGB / (tpRank3D * ppRank3D * dpRank3D);
  const megaDS: StackResult = {
    key: 'megatron_deepspeed',
    label: 'Megatron-DeepSpeed (3D)',
    shortLabel: 'Megatron-DS',
    tpRank: tpRank3D,
    ppRank: ppRank3D,
    dpRank: dpRank3D,
    stateMemoryPerGPU: megaDS_stateMem,
    activationMemoryPerGPU: baseActivationGB / (tpRank3D * ppRank3D),
    memoryPerGPU: megaDS_stateMem + baseActivationGB / (tpRank3D * ppRank3D),
    fits:
      megaDS_stateMem + baseActivationGB / (tpRank3D * ppRank3D) < gpu.memoryGB * 0.9 &&
      gpuCount >= tpRank3D * ppRank3D,
    mfuEstimate: estimateMFU('megatron_deepspeed', gpuCount, tpRank3D, ppRank3D),
    rationale:
      '3D parallelism: TP (within node) + PP (across nodes) + sharded DP. Standard choice for 100B+ models. Highest communication overhead but only way to fit huge models.',
  };

  return [dp, fsdp, megaFsdp, megaDS];
}

function estimateMFU(stack: StackKey, gpuCount: number, tpRank = 1, ppRank = 1): number {
  let mfu = 0.5;
  if (ppRank > 1) mfu -= 0.05;
  if (tpRank > 1) mfu -= 0.03;
  if (gpuCount > 512) mfu -= 0.05;
  if (gpuCount > 4096) mfu -= 0.05;
  if (stack === 'fsdp' && gpuCount > 256) mfu -= 0.03;
  if (stack === 'megatron_deepspeed') mfu -= 0.02;
  return Math.max(0.2, mfu);
}

export function recommendStack(results: StackResult[]): StackKey {
  for (const r of results) {
    if (r.fits) return r.key;
  }
  return results[results.length - 1]!.key;
}

export function estimateTrainingRun(
  modelParams: number,
  gpu: GPUSpec,
  gpuCount: number,
  mfu: number,
): { hours: number; costUSD: number; flopsTotal: number; tokensTotal: number } {
  const tokensTotal = modelParams * 20;
  const flopsTotal = 6 * modelParams * tokensTotal;
  const effectiveFlopsPerGPU = gpu.peakFlopsBF16 * 1e12 * mfu;
  const totalEffectiveFlops = gpuCount * effectiveFlopsPerGPU;
  const seconds = flopsTotal / totalEffectiveFlops;
  const hours = seconds / 3600;
  const costUSD = hours * gpuCount * gpu.hourlyCostUSD;
  return { hours, costUSD, flopsTotal, tokensTotal };
}

export const LOG_PARAMS_MIN = 8;
export const LOG_PARAMS_MAX = 12;
export const LOG_GPUS_MIN = 3;
export const LOG_GPUS_MAX = 14;

export function sliderToParams(v: number): number {
  return Math.pow(10, LOG_PARAMS_MIN + v * (LOG_PARAMS_MAX - LOG_PARAMS_MIN));
}
export function paramsToSlider(p: number): number {
  return (Math.log10(p) - LOG_PARAMS_MIN) / (LOG_PARAMS_MAX - LOG_PARAMS_MIN);
}
export function sliderToGpuCount(v: number): number {
  return Math.round(Math.pow(2, LOG_GPUS_MIN + v * (LOG_GPUS_MAX - LOG_GPUS_MIN)));
}
export function gpuCountToSlider(c: number): number {
  return (Math.log2(c) - LOG_GPUS_MIN) / (LOG_GPUS_MAX - LOG_GPUS_MIN);
}

export function formatLargeNumber(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

export function formatUSD(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

export function formatTime(hours: number): string {
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  if (hours < 24 * 14) return `${(hours / 24).toFixed(1)} days`;
  if (hours < 24 * 90) return `${(hours / (24 * 7)).toFixed(1)} weeks`;
  return `${(hours / (24 * 30)).toFixed(1)} months`;
}
