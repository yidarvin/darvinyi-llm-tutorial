export type TargetModulesOption = 'qv' | 'qkvo' | 'all';

export interface TargetModulesInfo {
  id: TargetModulesOption;
  label: string;
  count: number;
  description: string;
}

export const TARGET_MODULES: Record<TargetModulesOption, TargetModulesInfo> = {
  qv: {
    id: 'qv',
    label: 'Q + V only',
    count: 2,
    description: 'Original LoRA paper. Minimal parameter overhead.',
  },
  qkvo: {
    id: 'qkvo',
    label: 'Q + K + V + O',
    count: 4,
    description: 'All attention projections. Modern default.',
  },
  all: {
    id: 'all',
    label: 'All linear (attn + FFN)',
    count: 6,
    description: 'Attention + FFN up/down. Maximum coverage.',
  },
};

export const MODEL_CONFIG = {
  d_model: 4096,
  n_layers: 32,
  vocab_size: 128000,
  total_params_approx: 6.74e9,
  base_size_bf16_gb: 13.5,
  label: '7B-class transformer',
};

export function paramsPerMatrix(d: number = MODEL_CONFIG.d_model): {
  frozen: number;
  loraAt: (rank: number) => number;
} {
  return {
    frozen: d * d,
    loraAt: (rank: number) => rank * (d + d),
  };
}

export function paramsPerLayer(
  targetCount: number,
  rank: number,
  d: number = MODEL_CONFIG.d_model,
): {
  frozen: number;
  trainable: number;
} {
  const perMatrix = paramsPerMatrix(d);
  return {
    frozen: targetCount * perMatrix.frozen,
    trainable: targetCount * perMatrix.loraAt(rank),
  };
}

export function paramsWholeModel(
  targetCount: number,
  rank: number,
  d: number = MODEL_CONFIG.d_model,
  layers: number = MODEL_CONFIG.n_layers,
  totalBase: number = MODEL_CONFIG.total_params_approx,
): {
  baseTotal: number;
  trainable: number;
  ratio: number;
  adapterDiskMB: number;
} {
  const perLayer = paramsPerLayer(targetCount, rank, d);
  const trainable = perLayer.trainable * layers;
  return {
    baseTotal: totalBase,
    trainable,
    ratio: trainable / totalBase,
    adapterDiskMB: (trainable * 2) / 1e6,
  };
}

export function formatParams(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n.toFixed(0)}`;
}

export const RANK_OPTIONS = [1, 4, 8, 16, 32, 64];
