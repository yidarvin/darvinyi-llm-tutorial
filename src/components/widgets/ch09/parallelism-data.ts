export type StrategyKey = 'dp' | 'tp' | 'pp' | 'fsdp';

/**
 * Each GPU's memory state for a given strategy.
 * `full`  — full layer parameters present
 * `shard` — only a slice (1/n) of this layer's parameters
 * `empty` — this layer is not on this GPU
 */
export type LayerState = 'full' | 'shard' | 'empty';

export interface GPUMemoryColumn {
  /** Length 4 — one entry per layer (L0, L1, L2, L3). */
  layers: LayerState[];
  /** What data this GPU sees: 'shard' = its slice of the batch; 'full' = full batch. */
  data: 'shard' | 'full';
  /** Data shard label, e.g. "B[0:4]" or "B[0:16]". */
  dataLabel: string;
}

export interface CommArrow {
  /** Direction or type — different rendering styles. */
  kind: 'all_reduce' | 'all_gather' | 'reduce_scatter' | 'peer_to_peer';
  /** Label shown on the arrow. */
  label: string;
  /** When in the diagram timeline this arrow appears. */
  position: 'between_layers' | 'after_backward' | 'pipeline_boundaries';
}

export interface ParallelismStrategy {
  key: StrategyKey;
  label: string;
  shortLabel: string;
  color: string;
  /** Length 4 — one column per GPU. */
  gpuColumns: GPUMemoryColumn[];
  /** Communication arrows for this strategy. */
  comms: CommArrow[];
  /** Trade-off description shown below the diagram. */
  description: string;
  /** Memory per GPU (as a fraction of full model). */
  memoryPerGPU: string;
  /** Communication cost per step (informal). */
  commCost: string;
  /** Scaling limit (informal). */
  scalingLimit: string;
}

function gpuColumn(layers: LayerState[], data: 'shard' | 'full', dataLabel: string): GPUMemoryColumn {
  return { layers, data, dataLabel };
}

// === DP — Data Parallelism ===
// Each GPU has the full model; batch is sharded.
const DP_STRATEGY: ParallelismStrategy = {
  key: 'dp',
  label: 'Data Parallelism (DP)',
  shortLabel: 'DP',
  color: 'var(--cyan-400)',
  gpuColumns: [
    gpuColumn(['full', 'full', 'full', 'full'], 'shard', 'B[0:4]'),
    gpuColumn(['full', 'full', 'full', 'full'], 'shard', 'B[4:8]'),
    gpuColumn(['full', 'full', 'full', 'full'], 'shard', 'B[8:12]'),
    gpuColumn(['full', 'full', 'full', 'full'], 'shard', 'B[12:16]'),
  ],
  comms: [
    { kind: 'all_reduce', label: 'all-reduce(gradients)', position: 'after_backward' },
  ],
  description:
    'Each GPU holds a complete copy of the model. The batch is sharded across GPUs, and each GPU processes a different micro-batch. After backward, gradients are averaged across all GPUs via a single all-reduce. The simplest parallelism strategy, but every GPU duplicates the entire model + grads + optimizer state in memory.',
  memoryPerGPU: 'Full model (no reduction)',
  commCost: 'One all-reduce of model_size per step',
  scalingLimit: 'Bandwidth-bound past ~1000 GPUs; cannot exceed single-GPU model size',
};

// === TP — Tensor Parallelism ===
// Each GPU has a shard of every layer; full batch on every GPU.
const TP_STRATEGY: ParallelismStrategy = {
  key: 'tp',
  label: 'Tensor Parallelism (TP)',
  shortLabel: 'TP',
  color: 'var(--amber-400)',
  gpuColumns: [
    gpuColumn(['shard', 'shard', 'shard', 'shard'], 'full', 'B[0:16]'),
    gpuColumn(['shard', 'shard', 'shard', 'shard'], 'full', 'B[0:16]'),
    gpuColumn(['shard', 'shard', 'shard', 'shard'], 'full', 'B[0:16]'),
    gpuColumn(['shard', 'shard', 'shard', 'shard'], 'full', 'B[0:16]'),
  ],
  comms: [
    { kind: 'all_reduce', label: 'all-reduce(activations) × per-layer', position: 'between_layers' },
  ],
  description:
    "Each layer's operations are split across GPUs along carefully-chosen dimensions (Megatron-style: column-then-row). Every GPU sees the full batch but computes only a partial output. After each layer, all-reduce the partial outputs to reconstruct the full activation. High per-layer communication, typically restricted to within a node (TP-rank ≤ 8 over NVLink).",
  memoryPerGPU: '1/TP-rank of model',
  commCost: 'One all-reduce of activation_size per layer',
  scalingLimit: 'Bandwidth-bound across nodes; TP-rank usually ≤ 8',
};

// === PP — Pipeline Parallelism ===
// Different layers on different GPUs; data flows through the pipeline.
const PP_STRATEGY: ParallelismStrategy = {
  key: 'pp',
  label: 'Pipeline Parallelism (PP)',
  shortLabel: 'PP',
  color: 'var(--emerald-400)',
  gpuColumns: [
    gpuColumn(['full', 'empty', 'empty', 'empty'], 'shard', 'mb0,1,2'),
    gpuColumn(['empty', 'full', 'empty', 'empty'], 'shard', 'mb0,1,2'),
    gpuColumn(['empty', 'empty', 'full', 'empty'], 'shard', 'mb0,1,2'),
    gpuColumn(['empty', 'empty', 'empty', 'full'], 'shard', 'mb0,1,2'),
  ],
  comms: [
    { kind: 'peer_to_peer', label: 'send(activations)', position: 'pipeline_boundaries' },
  ],
  description:
    'Different layers live on different GPUs. The batch is split into micro-batches that flow through the pipeline: GPU 0 (layer 0) → GPU 1 (layer 1) → ... → GPU N-1 (last layer). At the start of a batch, only the first GPU is busy; the pipeline gradually fills up. The "pipeline bubble" (idle time at the edges) reduces efficiency, but the per-step communication cost is low (only at stage boundaries).',
  memoryPerGPU: '1/PP-rank of model',
  commCost: 'Peer-to-peer sends at pipeline boundaries (low)',
  scalingLimit: 'Pipeline bubble grows with PP-rank; typically ≤ 64',
};

// === FSDP — Fully Sharded Data Parallel (ZeRO-3) ===
// Each GPU has shards of every layer's parameters AND a slice of the batch.
const FSDP_STRATEGY: ParallelismStrategy = {
  key: 'fsdp',
  label: 'Fully Sharded Data Parallel (FSDP)',
  shortLabel: 'FSDP',
  color: 'var(--violet-400)',
  gpuColumns: [
    gpuColumn(['shard', 'shard', 'shard', 'shard'], 'shard', 'B[0:4]'),
    gpuColumn(['shard', 'shard', 'shard', 'shard'], 'shard', 'B[4:8]'),
    gpuColumn(['shard', 'shard', 'shard', 'shard'], 'shard', 'B[8:12]'),
    gpuColumn(['shard', 'shard', 'shard', 'shard'], 'shard', 'B[12:16]'),
  ],
  comms: [
    { kind: 'all_gather', label: 'all-gather(layer L params), before each layer', position: 'between_layers' },
    { kind: 'reduce_scatter', label: 'reduce-scatter(layer L grads), after each layer', position: 'between_layers' },
  ],
  description:
    "ZeRO-3 sharding: both the model AND the batch are sharded across GPUs. Before computing each layer, all-gather the layer's parameters from all DP ranks (everyone temporarily has the full layer). Compute, then discard the gathered parameters. After the backward pass for that layer, reduce-scatter the gradients back to the appropriate ranks. Same total communication as DP, but communicated piecewise, enabling overlap with compute, plus massive memory reduction.",
  memoryPerGPU: '1/DP-rank of model + grads + optimizer state',
  commCost: 'Same as DP (one model-size of comms per step), piecewise',
  scalingLimit: 'Same as DP, but with much higher memory ceiling',
};

export const STRATEGIES: ParallelismStrategy[] = [DP_STRATEGY, TP_STRATEGY, PP_STRATEGY, FSDP_STRATEGY];

export function getStrategy(key: StrategyKey): ParallelismStrategy {
  return STRATEGIES.find(s => s.key === key)!;
}
