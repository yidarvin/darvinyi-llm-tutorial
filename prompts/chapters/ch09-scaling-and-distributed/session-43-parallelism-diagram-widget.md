# Session 43 — Parallelism diagram secondary widget

> The secondary Chapter 9 widget. Side-by-side visualization of four parallelism strategies (DP, TP, PP, FSDP) showing how data and parameters distribute across 4 GPUs under each. Tab-controlled strategy selector swaps between layouts; each layout uses distinct color coding for parameter shards, data shards, and communication operations. A description panel below explains the trade-offs of the currently-selected strategy. Replaces the section-6 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch09-scaling-and-distributed/research.md`** — sections on DP, TP, PP, FSDP define what each strategy splits and communicates
2. **`prompts/chapters/ch09-scaling-and-distributed/session-41-page-structure.md`** — for the section-6 widget placeholder this session fills
3. **`prompts/chapters/ch07-pretraining-data/session-34-quality-filter-and-exercises.md`** — for the tabbed selector pattern (QualityFilter widget uses similar tab UX)
4. **`prompts/chapters/ch05-multihead-and-block/session-25-transformer-block-flow.md`** — for the labeled-SVG-diagram pattern (TransformerBlockFlow has SVG box-and-arrow precedent)

---

## Goal

Replace the `<WidgetFrame title="Parallelism strategies">` placeholder in section 6 with a working interactive widget that:

- Displays **4 GPUs** as boxes in a horizontal row
- Provides a **tab selector** at the top — DP / TP / PP / FSDP
- Each tab swaps the visualization to show that strategy's:
  - **Memory layout** inside each GPU (which layers / shards of layers are present)
  - **Data distribution** above the GPUs (which micro-batch each GPU sees)
  - **Communication arrows** below or between the GPUs (all-reduce, all-gather, reduce-scatter, peer-to-peer)
- Color-codes each strategy with its accent color (DP=cyan, TP=amber, PP=emerald, FSDP=violet)
- A **trade-off summary** panel below the diagram describes the strategy's memory, communication cost, and scaling limit

**End state:** section 6 of Chapter 9 has a working secondary widget. After 30 seconds of tabbing, the reader should be able to articulate: (a) DP replicates everything; (b) TP shards each layer; (c) PP shards by layer; (d) FSDP shards everything *and* shards data. They should also recognize the communication pattern unique to each.

---

## Inputs

State of the repo after session 42:

- Section 3's marquee widget (`ScalingLawCalculator`) is wired
- Section 6's widget is still stubbed
- `src/lib/chapters.ts` has Ch 9 as `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch09/ParallelismDiagram.tsx` — the React widget
2. **Create** `src/components/widgets/ch09/ParallelismDiagram.module.css` — scoped styles
3. **Create** `src/components/widgets/ch09/parallelism-data.ts` — strategy specs (memory layouts, comms, descriptions)
4. **Update** `src/components/widgets/index.ts` — add `ParallelismDiagram` export
5. **Update** `src/pages/ch09-scaling-and-distributed/index.mdx` — replace section-6's `<WidgetFrame>` interior with `<ParallelismDiagram client:visible />`

**Do NOT modify:** any prior chapter widget, the section-3 marquee, or any other file.

---

## Detailed spec

### 1. `parallelism-data.ts` — the data layer

Each strategy is described as a small declarative spec the renderer interprets.

```ts
// src/components/widgets/ch09/parallelism-data.ts

export type StrategyKey = 'dp' | 'tp' | 'pp' | 'fsdp';

/**
 * Each GPU's memory state for a given strategy.
 * `full` — full layer parameters present
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

// Each strategy has 4 GPUs and a 4-layer model for the diagram.
const N_GPUS = 4;
const N_LAYERS = 4;

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
    'Each GPU holds a complete copy of the model. The batch is sharded across GPUs — each GPU processes a different micro-batch. After backward, gradients are averaged across all GPUs via a single all-reduce. The simplest parallelism strategy, but every GPU duplicates the entire model + grads + optimizer state in memory.',
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
    "Each layer's operations are split across GPUs along carefully-chosen dimensions (Megatron-style: column-then-row). Every GPU sees the full batch but computes only a partial output. After each layer, all-reduce the partial outputs to reconstruct the full activation. High per-layer communication — typically restricted to within a node (TP-rank ≤ 8 over NVLink).",
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
    'Different layers live on different GPUs. The batch is split into micro-batches that flow through the pipeline: GPU 0 (layer 0) → GPU 1 (layer 1) → ... → GPU N-1 (last layer). At the start of a batch, only the first GPU is busy; the pipeline gradually fills up. The "pipeline bubble" — idle time at the edges — reduces efficiency, but the per-step communication cost is low (only at stage boundaries).',
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
    { kind: 'all_gather', label: 'all-gather(layer L params) — before each layer', position: 'between_layers' },
    { kind: 'reduce_scatter', label: 'reduce-scatter(layer L grads) — after each layer', position: 'between_layers' },
  ],
  description:
    "ZeRO-3 sharding — both the model AND the batch are sharded across GPUs. Before computing each layer, all-gather the layer's parameters from all DP ranks (everyone temporarily has the full layer). Compute, then discard the gathered parameters. After the backward pass for that layer, reduce-scatter the gradients back to the appropriate ranks. Same total communication as DP, but communicated piecewise — enables overlap with compute, plus massive memory reduction.",
  memoryPerGPU: '1/DP-rank of model + grads + optimizer state',
  commCost: 'Same as DP (one model-size of comms per step), piecewise',
  scalingLimit: 'Same as DP, but with much higher memory ceiling',
};

export const STRATEGIES: ParallelismStrategy[] = [DP_STRATEGY, TP_STRATEGY, PP_STRATEGY, FSDP_STRATEGY];

export function getStrategy(key: StrategyKey): ParallelismStrategy {
  return STRATEGIES.find(s => s.key === key)!;
}
```

### 2. Visual layout

For each strategy, the layout is:

```
ViewBox: 0 0 800 600

┌──────────────────────────────────────────────────────────┐
│  Strategy:  [● DP]  [○ TP]  [○ PP]  [○ FSDP]            │
│                                                          │
│  Data: ▓▓▓▓ B[0:4]    ▓▓▓▓ B[4:8]   ▓▓▓▓ B[8:12]   ...│
│        ↓              ↓              ↓             ↓     │
│   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐ │
│   │ GPU 0  │    │ GPU 1  │    │ GPU 2  │    │ GPU 3  │ │
│   │ ┌───┐  │    │ ┌───┐  │    │ ┌───┐  │    │ ┌───┐  │ │
│   │ │L0 │  │    │ │L0 │  │    │ │L0 │  │    │ │L0 │  │ │
│   │ ├───┤  │    │ ├───┤  │    │ ├───┤  │    │ ├───┤  │ │
│   │ │L1 │  │    │ │L1 │  │    │ │L1 │  │    │ │L1 │  │ │
│   │ ├───┤  │    │ ├───┤  │    │ ├───┤  │    │ ├───┤  │ │
│   │ │L2 │  │    │ │L2 │  │    │ │L2 │  │    │ │L2 │  │ │
│   │ ├───┤  │    │ ├───┤  │    │ ├───┤  │    │ ├───┤  │ │
│   │ │L3 │  │    │ │L3 │  │    │ │L3 │  │    │ │L3 │  │ │
│   │ └───┘  │    │ └───┘  │    │ └───┘  │    │ └───┘  │ │
│   └────┬───┘    └────┬───┘    └────┬───┘    └────┬───┘ │
│        │             │             │             │      │
│        ▼             ▼             ▼             ▼      │
│   ◄────────────────────────────────────────────►        │
│   all-reduce(gradients) — after backward                │
└──────────────────────────────────────────────────────────┘

Trade-off panel:
┌─────────────────┬─────────────────┬──────────────────┐
│ Memory per GPU  │ Comm cost       │ Scaling limit    │
│ Full model      │ One all-reduce  │ Bandwidth-bound  │
│ (no reduction)  │ of model_size   │ past ~1000 GPUs  │
└─────────────────┴─────────────────┴──────────────────┘

Description:
Each GPU holds a complete copy of the model. The batch is sharded...
```

For each strategy, the layer rendering differs:
- `'full'`: solid colored rectangle (full opacity), height = full
- `'shard'`: striped pattern OR solid with reduced height (1/N) showing it's only a slice
- `'empty'`: dashed outline, no fill — visually absent

Communication arrows differ:
- **all-reduce**: bidirectional arrow spanning all GPUs, dashed
- **all-gather**: arrows pointing FROM each GPU outward (parameters being gathered)
- **reduce-scatter**: arrows pointing INTO each GPU
- **peer-to-peer**: short arrows between adjacent GPUs only

### 3. `ParallelismDiagram.tsx`

```tsx
import { useState } from 'react';
import {
  STRATEGIES, getStrategy,
  type StrategyKey, type ParallelismStrategy, type LayerState, type CommArrow,
} from './parallelism-data';
import styles from './ParallelismDiagram.module.css';

const N_GPUS = 4;
const N_LAYERS = 4;

export default function ParallelismDiagram() {
  const [activeKey, setActiveKey] = useState<StrategyKey>('dp');
  const strategy = getStrategy(activeKey);

  return (
    <div className={styles.widget}>
      {/* Strategy tabs */}
      <div className={styles.tabs} role="tablist">
        {STRATEGIES.map(s => (
          <button
            key={s.key}
            role="tab"
            aria-selected={s.key === activeKey}
            className={`${styles.tab} ${s.key === activeKey ? styles.tabActive : ''}`}
            style={{ borderColor: s.key === activeKey ? s.color : undefined, color: s.key === activeKey ? s.color : undefined }}
            onClick={() => setActiveKey(s.key)}
          >
            {s.shortLabel}
          </button>
        ))}
      </div>

      {/* Diagram */}
      <div className={styles.diagramPanel}>
        <div className={styles.panelTitle} style={{ color: strategy.color }}>
          {strategy.label}
        </div>
        <DiagramSvg strategy={strategy} />
      </div>

      {/* Trade-off summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Memory per GPU</div>
          <div className={styles.statValue}>{strategy.memoryPerGPU}</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Comm cost</div>
          <div className={styles.statValue}>{strategy.commCost}</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Scaling limit</div>
          <div className={styles.statValue}>{strategy.scalingLimit}</div>
        </div>
      </div>

      {/* Description */}
      <div className={styles.description} aria-live="polite">
        <div className={styles.descriptionBody}>{strategy.description}</div>
      </div>
    </div>
  );
}

function DiagramSvg({ strategy }: { strategy: ParallelismStrategy }) {
  const WIDTH = 760;
  const HEIGHT = 460;

  // Layout constants
  const TOP_DATA_Y = 30;
  const TOP_DATA_HEIGHT = 22;
  const ARROW_DOWN_TOP = 60;
  const ARROW_DOWN_BOTTOM = 90;
  const GPU_TOP = 100;
  const GPU_BOTTOM = 360;
  const GPU_HEIGHT = GPU_BOTTOM - GPU_TOP;
  const COMM_Y = 410;

  const GPU_WIDTH = 130;
  const GPU_GAP = 30;
  const TOTAL_GPU_WIDTH = N_GPUS * GPU_WIDTH + (N_GPUS - 1) * GPU_GAP;
  const GPU_START_X = (WIDTH - TOTAL_GPU_WIDTH) / 2;

  const LAYER_HEIGHT = (GPU_HEIGHT - 60) / N_LAYERS;
  const LAYER_PADDING = 4;
  const LAYER_LABEL_OFFSET = 30;

  function gpuX(idx: number): number {
    return GPU_START_X + idx * (GPU_WIDTH + GPU_GAP);
  }
  function layerY(layerIdx: number): number {
    return GPU_TOP + LAYER_LABEL_OFFSET + layerIdx * LAYER_HEIGHT;
  }

  // Communication arrow rendering
  function CommunicationArrow({ comm }: { comm: CommArrow }) {
    const allGpuLeft = gpuX(0);
    const allGpuRight = gpuX(N_GPUS - 1) + GPU_WIDTH;
    const allGpuCenter = (allGpuLeft + allGpuRight) / 2;

    if (comm.kind === 'all_reduce') {
      return (
        <g>
          <line
            x1={allGpuLeft + 30} x2={allGpuRight - 30}
            y1={COMM_Y} y2={COMM_Y}
            className={styles.commLineAllReduce}
            style={{ stroke: strategy.color }}
            markerStart="url(#leftArrow)"
            markerEnd="url(#rightArrow)"
          />
          <text x={allGpuCenter} y={COMM_Y + 22} className={styles.commLabel} textAnchor="middle" fill={strategy.color}>
            {comm.label}
          </text>
        </g>
      );
    }

    if (comm.kind === 'peer_to_peer') {
      // Arrows between adjacent GPUs
      return (
        <g>
          {Array.from({ length: N_GPUS - 1 }, (_, i) => {
            const x1 = gpuX(i) + GPU_WIDTH;
            const x2 = gpuX(i + 1);
            return (
              <line
                key={i}
                x1={x1 + 4} x2={x2 - 4}
                y1={COMM_Y} y2={COMM_Y}
                className={styles.commLinePeerToPeer}
                style={{ stroke: strategy.color }}
                markerEnd="url(#rightArrow)"
              />
            );
          })}
          <text x={allGpuCenter} y={COMM_Y + 22} className={styles.commLabel} textAnchor="middle" fill={strategy.color}>
            {comm.label}
          </text>
        </g>
      );
    }

    // all_gather: arrows pointing outward from each GPU
    if (comm.kind === 'all_gather') {
      return (
        <g>
          <line
            x1={allGpuLeft + 30} x2={allGpuRight - 30}
            y1={COMM_Y} y2={COMM_Y}
            className={styles.commLineGather}
            style={{ stroke: strategy.color }}
            markerStart="url(#leftArrow)"
            markerEnd="url(#rightArrow)"
          />
          <text x={allGpuCenter} y={COMM_Y + 22} className={styles.commLabel} textAnchor="middle" fill={strategy.color}>
            {comm.label}
          </text>
        </g>
      );
    }

    // reduce_scatter: similar bidirectional but different label position
    return (
      <g>
        <line
          x1={allGpuLeft + 30} x2={allGpuRight - 30}
          y1={COMM_Y + 16} y2={COMM_Y + 16}
          className={styles.commLineScatter}
          style={{ stroke: strategy.color }}
          markerStart="url(#leftArrow)"
          markerEnd="url(#rightArrow)"
        />
        <text x={allGpuCenter} y={COMM_Y + 38} className={styles.commLabel} textAnchor="middle" fill={strategy.color}>
          {comm.label}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label={`${strategy.label} diagram`}>
      {/* Arrow head markers */}
      <defs>
        <marker id="rightArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill={strategy.color} />
        </marker>
        <marker id="leftArrow" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
          <polygon points="8 0, 0 4, 8 8" fill={strategy.color} />
        </marker>
      </defs>

      {/* Top: data shards */}
      {strategy.gpuColumns.map((col, idx) => (
        <g key={`data-${idx}`}>
          <rect
            x={gpuX(idx) + 10}
            y={TOP_DATA_Y}
            width={GPU_WIDTH - 20}
            height={TOP_DATA_HEIGHT}
            className={styles.dataBlock}
            fill={col.data === 'full' ? `color-mix(in srgb, ${strategy.color} 35%, transparent)` : `color-mix(in srgb, ${strategy.color} 20%, transparent)`}
            stroke={strategy.color}
          />
          <text x={gpuX(idx) + GPU_WIDTH / 2} y={TOP_DATA_Y + 15} className={styles.dataLabel} textAnchor="middle">
            {col.dataLabel}
          </text>
          {/* Arrow from data → GPU */}
          <line
            x1={gpuX(idx) + GPU_WIDTH / 2} x2={gpuX(idx) + GPU_WIDTH / 2}
            y1={ARROW_DOWN_TOP} y2={ARROW_DOWN_BOTTOM}
            className={styles.dataArrow}
            stroke={strategy.color}
            markerEnd="url(#rightArrow)"
          />
        </g>
      ))}

      {/* GPU boxes with layer blocks */}
      {strategy.gpuColumns.map((col, idx) => (
        <g key={`gpu-${idx}`}>
          {/* GPU outer frame */}
          <rect
            x={gpuX(idx)} y={GPU_TOP}
            width={GPU_WIDTH} height={GPU_HEIGHT}
            rx={6}
            className={styles.gpuBox}
          />
          {/* GPU label */}
          <text x={gpuX(idx) + GPU_WIDTH / 2} y={GPU_TOP + 20} className={styles.gpuLabel} textAnchor="middle">
            GPU {idx}
          </text>

          {/* Layer blocks */}
          {col.layers.map((state, layerIdx) => (
            <LayerBlock
              key={layerIdx}
              x={gpuX(idx) + LAYER_PADDING}
              y={layerY(layerIdx)}
              width={GPU_WIDTH - 2 * LAYER_PADDING}
              height={LAYER_HEIGHT - 4}
              state={state}
              layerIdx={layerIdx}
              gpuIdx={idx}
              color={strategy.color}
            />
          ))}
        </g>
      ))}

      {/* Communication arrows */}
      {strategy.comms.map((comm, idx) => (
        <CommunicationArrow key={idx} comm={comm} />
      ))}
    </svg>
  );
}

interface LayerBlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  state: LayerState;
  layerIdx: number;
  gpuIdx: number;
  color: string;
}

function LayerBlock({ x, y, width, height, state, layerIdx, gpuIdx, color }: LayerBlockProps) {
  const labelX = x + width / 2;
  const labelY = y + height / 2 + 4;

  if (state === 'empty') {
    return (
      <g>
        <rect
          x={x} y={y}
          width={width} height={height}
          rx={3}
          className={styles.layerEmpty}
        />
        <text x={labelX} y={labelY} className={styles.layerLabelEmpty} textAnchor="middle">
          —
        </text>
      </g>
    );
  }

  if (state === 'shard') {
    return (
      <g>
        {/* Sharded: render as 4 narrow vertical stripes, the gpuIdx-th highlighted */}
        {Array.from({ length: 4 }, (_, i) => {
          const stripeW = (width - 4) / 4;
          const stripeX = x + 2 + i * stripeW;
          const isMyShard = i === gpuIdx;
          return (
            <rect
              key={i}
              x={stripeX} y={y + 2}
              width={stripeW - 1} height={height - 4}
              fill={isMyShard ? color : `color-mix(in srgb, ${color} 15%, transparent)`}
              opacity={isMyShard ? 0.85 : 0.3}
            />
          );
        })}
        <text x={labelX} y={labelY} className={styles.layerLabel} textAnchor="middle">
          L{layerIdx} (1/4)
        </text>
      </g>
    );
  }

  // state === 'full'
  return (
    <g>
      <rect
        x={x} y={y}
        width={width} height={height}
        rx={3}
        fill={color}
        opacity={0.85}
      />
      <text x={labelX} y={labelY} className={styles.layerLabel} textAnchor="middle">
        L{layerIdx}
      </text>
    </g>
  );
}
```

### 4. `ParallelismDiagram.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.5rem;
}
.tab {
  padding: 0.5rem 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.tab:hover { border-color: var(--border-strong); color: var(--text-primary); }
.tabActive {
  font-weight: 500;
  /* border + color set inline based on strategy.color */
}

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.diagramPanel {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  margin-bottom: 1rem;
}
.svg { width: 100%; height: auto; }

.dataBlock { stroke-width: 1; }
.dataLabel {
  fill: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
}
.dataArrow { stroke-width: 1.5; opacity: 0.7; }

.gpuBox {
  fill: var(--bg-primary);
  stroke: var(--border-default);
  stroke-width: 1.5;
}
.gpuLabel {
  fill: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
}

.layerLabel {
  fill: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  pointer-events: none;
}
.layerLabelEmpty {
  fill: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 500;
  pointer-events: none;
}
.layerEmpty {
  fill: none;
  stroke: var(--border-default);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.commLineAllReduce {
  stroke-width: 2;
  stroke-dasharray: 6 3;
}
.commLineGather {
  stroke-width: 2;
}
.commLineScatter {
  stroke-width: 2;
  stroke-dasharray: 2 3;
}
.commLinePeerToPeer {
  stroke-width: 2;
}
.commLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.statCell {
  padding: 0.65rem 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.statLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.statValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.3;
}

.description {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.descriptionBody {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .tabs { flex-wrap: wrap; }
  .statsGrid { grid-template-columns: 1fr; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as ScalingLawCalculator } from './ch09/ScalingLawCalculator';
export { default as ParallelismDiagram } from './ch09/ParallelismDiagram';
```

### 6. Update `src/pages/ch09-scaling-and-distributed/index.mdx`

**Edit A: Add widget import:**

```mdx
import { ScalingLawCalculator, ParallelismDiagram } from '@components/widgets';
```

**Edit B: Replace section-6's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Parallelism strategies" caption="Four parallelism strategies (DP, TP, PP, FSDP) shown as 4-GPU layouts. Each strategy distributes data and parameters differently and uses different communication primitives. Tab between strategies to compare memory layouts, batch distribution, and communication patterns.">
  <ParallelismDiagram client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 6 of Ch 9** renders with the working `ParallelismDiagram` widget. Section 3's marquee still works.
3. **Initial state:** DP tab active; cyan accent; 4 GPUs each showing 4 full-color layers (L0-L3); data labels show B[0:4], B[4:8], B[8:12], B[12:16] (sharded batch); one all-reduce arrow at the bottom labeled "all-reduce(gradients)".
4. **Click TP tab:** layout swaps to amber; each GPU shows 4 sharded layers (visualized as 4 thin stripes per layer, the GPU's own shard highlighted); data labels all show B[0:16] (full batch on every GPU); communication label shows "all-reduce(activations) × per-layer".
5. **Click PP tab:** layout swaps to emerald; **each GPU shows exactly one layer in full color** and the other three as dashed empty rectangles; data labels show "mb0,1,2" on each (micro-batches flowing through); communication shows peer-to-peer arrows between adjacent GPUs.
6. **Click FSDP tab:** layout swaps to violet; each GPU shows 4 sharded layers (same striping as TP); data labels show sharded batches (like DP); communication shows both "all-gather" and "reduce-scatter" arrows.
7. **Trade-off cards** below the diagram update to the active strategy's memory / comm cost / scaling limit values.
8. **Description panel** below the cards updates to the active strategy's description.
9. **Mobile (< 640px):** tabs wrap if needed; trade-off cards collapse to single column.
10. **`npm run typecheck`** passes.
11. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement animation of the forward pass.** Static diagrams. Animating would obscure rather than clarify the comparison.
- ❌ **Do not implement scaling number sliders.** Fixed at 4 GPUs, 4 layers.
- ❌ **Do not implement 3D parallelism visualization.** Single-strategy diagrams only.
- ❌ **Do not implement Triton / kernel-level visualization.** Out of scope for Ch 9; might be Ch 10's territory.
- ❌ **Do not flip Ch 9's status.** Session 44 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch09/ParallelismDiagram.tsx src/components/widgets/ch09/ParallelismDiagram.module.css src/components/widgets/ch09/parallelism-data.ts src/components/widgets/index.ts src/pages/ch09-scaling-and-distributed/index.mdx
git commit -m "session 43: parallelism diagram secondary widget — DP/TP/PP/FSDP layout comparison"
git push origin main
```

Verify on production:
- All four tabs work; each strategy's diagram is visually distinct
- The PP diagram is the most visually different (only 1 layer per GPU; empty boxes)
- TP and FSDP look memory-similar (both shard layers) but their communication labels differ
- The trade-off cards make the strategies' differences quantifiable

---

## Notes for the session author

**On using stripes for sharded layers:**
The naive way to show a sharded layer is "render at 1/N height." But that loses the visual that the layer *exists* on all GPUs — each GPU has *some* of it. Stripes solve this: render 4 vertical stripes, the GPU's own shard highlighted. Reader sees "this GPU has shard 0 of the layer; the other shards exist elsewhere" — accurate to the actual memory layout.

**On the visual difference between TP and FSDP:**
TP and FSDP have *identical* parameter sharding (1/N per GPU). What differs is the *data* distribution and the *communication pattern*:
- TP: full batch on every GPU; all-reduce activations per layer
- FSDP: sharded batch (like DP); all-gather params + reduce-scatter grads per layer

The widget shows these differences through:
- Top data bars (full vs sharded labels)
- Bottom communication arrows (different labels and arrow styles)

If the user can't distinguish TP from FSDP at a glance, the widget has failed. Make sure the data row and comm row are visually informative.

**On the PP diagram being the most visually striking:**
PP has dashed empty rectangles where layers aren't present. This is intentional — readers should *immediately* notice that PP looks very different from the others. The visual hierarchy (full → shard → empty) communicates the strategy's signature.

**On the all-reduce arrow style:**
A dashed bidirectional arrow spanning all 4 GPUs visualizes "all GPUs participate in averaging." Peer-to-peer arrows are short and unidirectional, only between adjacent GPUs — visualizes "data only travels to the next stage." These visual distinctions matter; if both strategies used the same arrow style, the comparison would be less clear.

**On the color coding per strategy:**
- DP = cyan (project default; simplest strategy)
- TP = amber (warning-ish color suggests "more communication overhead")
- PP = emerald (different shade; suggests "different topology")
- FSDP = violet (most distinctive; suggests "most sophisticated")

The color choices reinforce the strategies' character without being arbitrary.

**On the static-vs-animated choice:**
An animated version showing one forward pass per strategy would be very engaging — but it would also be hard to compare across strategies (you can only see one animation at a time). A static comparison lets the reader tab quickly between layouts and notice the differences. The static approach also keeps the widget code manageable.

**Pedagogical claim this widget supports:**
"The four parallelism strategies don't just shard the same things differently — they have *fundamentally different communication patterns*. DP averages gradients once per step. TP all-reduces activations every layer. PP sends activations only at stage boundaries. FSDP all-gathers params before each layer and reduce-scatters grads after. The communication pattern is the strategy's defining property."

After 30 seconds of tabbing, the reader can articulate: (a) the memory layout differences (full vs shard per layer; one vs all layers per GPU); (b) the data distribution differences (sharded vs replicated); (c) the communication pattern differences (when and what).

**This is the chapter's engineering-side capstone.** The marquee widget (scaling law) handles the math; this widget handles the systems. Together they cover Ch 9's two topics.

Build with care — the diagram is what makes the abstract "DP/TP/PP/FSDP" terms tangible.
