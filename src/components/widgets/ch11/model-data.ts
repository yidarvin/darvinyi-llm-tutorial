export type ModelType = 'dense' | 'moe';

export interface ModelSpec {
  key: string;
  label: string;
  type: ModelType;
  totalParams: number;
  activeParams: number;
  note?: string;
  releaseYear: number;
}

export const REAL_MODELS: ModelSpec[] = [
  { key: 'llama2_7b',     label: 'Llama-2 7B',      type: 'dense', totalParams: 6.74e9,  activeParams: 6.74e9,  releaseYear: 2023 },
  { key: 'llama2_13b',    label: 'Llama-2 13B',     type: 'dense', totalParams: 13.0e9,  activeParams: 13.0e9,  releaseYear: 2023 },
  { key: 'mixtral_8x7b',  label: 'Mixtral 8x7B',    type: 'moe',   totalParams: 46.7e9,  activeParams: 12.9e9,  note: '8 experts, top-2', releaseYear: 2024 },
  { key: 'llama2_70b',    label: 'Llama-2 70B',     type: 'dense', totalParams: 69.0e9,  activeParams: 69.0e9,  releaseYear: 2023 },
  { key: 'mixtral_8x22b', label: 'Mixtral 8x22B',   type: 'moe',   totalParams: 141e9,   activeParams: 39e9,    note: '8 experts, top-2', releaseYear: 2024 },
  { key: 'deepseek_v2',   label: 'DeepSeek-V2',     type: 'moe',   totalParams: 236e9,   activeParams: 21e9,    note: '160 experts, 6 active', releaseYear: 2024 },
  { key: 'llama3_405b',   label: 'Llama-3 405B',    type: 'dense', totalParams: 405e9,   activeParams: 405e9,   releaseYear: 2024 },
  { key: 'deepseek_v3',   label: 'DeepSeek-V3',     type: 'moe',   totalParams: 671e9,   activeParams: 37e9,    note: '256 experts, 8 active + 1 shared', releaseYear: 2024 },
];

export function formatParams(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n / 1e9 ).toFixed(1) + 'B';
  if (n >= 1e6)  return (n / 1e6 ).toFixed(0) + 'M';
  return n.toFixed(0);
}

export interface CustomMoEConfig {
  numExperts: number;
  topK: number;
  numLayers: number;
  dModel: number;
  dFFN: number;
}

export function computeCustomMoEParams(config: CustomMoEConfig): { total: number; active: number } {
  const { numExperts, topK, numLayers, dModel, dFFN } = config;

  const attnParams = 4 * dModel * dModel;
  const lnParams = 4 * dModel;
  // SwiGLU FFN (Mixtral/Llama-style): gate (W1), up (W3), down (W2) projections
  const ffnPerExpert = 3 * dModel * dFFN;
  const routerParams = numExperts * dModel;

  const effectiveK = Math.min(topK, numExperts);

  const layerTotal = attnParams + lnParams + numExperts * ffnPerExpert + routerParams;
  const layerActive = attnParams + lnParams + effectiveK * ffnPerExpert + routerParams;

  const layersTotal = numLayers * layerTotal;
  const layersActive = numLayers * layerActive;

  const vocabSize = 128_000;
  const embeddingParams = 2 * vocabSize * dModel;

  return {
    total: layersTotal + embeddingParams,
    active: layersActive + embeddingParams,
  };
}

export const DEFAULT_CUSTOM_CONFIG: CustomMoEConfig = {
  numExperts: 8,
  topK: 2,
  numLayers: 32,
  dModel: 4096,
  dFFN: 14336,
};
