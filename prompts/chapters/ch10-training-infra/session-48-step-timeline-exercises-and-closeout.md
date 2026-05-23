# Session 48 — Step timeline widget + Ch 10 exercises + Phase 9 closeout

> The Phase 9 grand finale. Three deliverables in one session: the **Step Timeline** secondary widget (compute-communication overlap visualization showing why MFU is the engineering metric), an **Exercises section** with 4 problems (NVLink-vs-InfiniBand bandwidth math, FlashAttention I/O complexity, activation checkpointing memory, MFU calculation), and the **status flip** from `'draft'` to `'published'`. **Closes Ch 10. Closes Phase 9.** After this session, the entire training-side arc of the tutorial — Ch 7 (data) + Ch 8 (loop) + Ch 9 (scaling) + Ch 10 (infrastructure) — is on production.

---

## Read first (in this order)

1. **`research/ch10-training-infra/research.md`** — pedagogical outcomes 2 (bandwidth), 5 (FlashAttention), 6 (checkpointing), 7 (MFU) are the focus
2. **`prompts/chapters/ch10-training-infra/session-46-page-structure.md`** — for the section-7 widget placeholder and the structure of `index.mdx`
3. **`prompts/chapters/ch10-training-infra/session-47-training-stack-picker-widget.md`** — for the widget conventions established by Ch 10's marquee (sliders + recommendation panel + comparison)
4. **`prompts/chapters/ch09-scaling-and-distributed/session-44-exercises-and-closeout.md`** — for the closeout template (Ch 9 established the pattern)

---

## Goal

By end of session, three things change in the repo:

1. **`<StepTimeline />`** widget replaces the section-7 `<WidgetFrame>` placeholder. The widget shows two timelines (sequential vs overlapped) for a configurable training step. Sliders control compute time and communication time; the comparison panel shows how overlap improves MFU.
2. **An "Exercises" section** is appended to `index.mdx`, between section 8 ("Cost economics — and what's next") and the final chapter close paragraph. Four exercises with hints + runnable starter code.
3. **Ch 10's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. Ch 10 is the tenth published chapter.

After this session: **Ch 10 is complete. Phase 9 is complete.** The tutorial covers the entire training-side story end-to-end.

---

## Inputs

State of the repo after session 47:

- Section 5's `TrainingStackPicker` marquee widget is wired
- Section 7's widget is still stubbed
- All 4 runnable code blocks from session 46 are in place
- `src/lib/chapters.ts` has Ch 1-9 `'published'`, Ch 10 `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch10/StepTimeline.tsx` — the React widget
2. **Create** `src/components/widgets/ch10/StepTimeline.module.css` — scoped styles
3. **Create** `src/components/widgets/ch10/step-timeline-data.ts` — timing math helpers
4. **Update** `src/components/widgets/index.ts` — add `StepTimeline` export
5. **Update** `src/pages/ch10-training-infra/index.mdx`:
   - Replace section-7's `<WidgetFrame>` interior with `<StepTimeline client:visible />`
   - Add new `## Exercises` section between section 8 and the final chapter close paragraph
6. **Update** `src/lib/chapters.ts` — change Ch 10's `status` from `'draft'` to `'published'`

---

## Detailed spec

### Part A — Step Timeline widget

#### A1. `step-timeline-data.ts`

```ts
// src/components/widgets/ch10/step-timeline-data.ts

export interface StepTiming {
  computeTime: number;   // ms
  commTime: number;      // ms
}

export interface StepMetrics {
  totalTime: number;       // ms (sequential or overlapped depending on mode)
  computeTime: number;     // ms
  commTime: number;        // ms
  mfu: number;             // 0..1 (fraction of total time spent computing)
}

/** Sequential mode: total = compute + comm (no overlap). */
export function sequentialMetrics(t: StepTiming): StepMetrics {
  const total = t.computeTime + t.commTime;
  return {
    totalTime: total,
    computeTime: t.computeTime,
    commTime: t.commTime,
    mfu: t.computeTime / total,
  };
}

/** Overlapped mode: total = max(compute, comm) — communication hidden behind compute. */
export function overlappedMetrics(t: StepTiming): StepMetrics {
  const total = Math.max(t.computeTime, t.commTime);
  return {
    totalTime: total,
    computeTime: t.computeTime,
    commTime: t.commTime,
    mfu: t.computeTime / total,   // capped at 1 (when compute ≥ comm)
  };
}

/** Speedup from overlap vs sequential. */
export function speedupFromOverlap(t: StepTiming): number {
  const seq = sequentialMetrics(t).totalTime;
  const ovr = overlappedMetrics(t).totalTime;
  return seq / ovr;
}
```

#### A2. Visual layout

```
ViewBox: 0 0 800 600

┌────────────────────────────────────────────────────────────────────┐
│  Compute time:        [────●────] 100 ms                          │
│  Communication time:  [───●─────] 40 ms                            │
│                                                                    │
│  Sequential mode:                                                  │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ Compute  ████████████████████████░░░░░░░░░░░░░░░░     │ 100 ms │
│  │ Comm     ░░░░░░░░░░░░░░░░░░░░░░░░██████████░░░░░░     │ 40 ms  │
│  │ Step total:  140 ms                                    │        │
│  │ MFU: 71% (compute fraction of total)                  │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                    │
│  Overlapped mode:                                                  │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ Compute  ████████████████████████████░░░░             │ 100 ms │
│  │ Comm     ██████████░░░░░░░░░░░░░░░░░░░░               │ 40 ms  │
│  │ Step total:  100 ms (max of compute, comm)            │        │
│  │ MFU: 100% (compute fully hides communication)         │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                    │
│  Speedup from overlap: 1.4× faster                                 │
│                                                                    │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ The difference between 71% and 100% MFU here is just  │        │
│  │ ordering — same compute, same communication, but      │        │
│  │ communication hidden behind compute. This is what     │        │
│  │ modern training frameworks optimize for.              │        │
│  └──────────────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Adjust compute time (10-300 ms range) → both timelines redraw; metrics update
- Adjust communication time (10-300 ms range) → both timelines redraw; metrics update
- When communication exceeds compute (e.g., comm > compute): overlapped MFU < 100%; the timeline visually shows compute completing while communication is still in flight
- When communication is much smaller than compute (e.g., comm = 10 ms, compute = 200 ms): overlapped MFU ≈ 100%; speedup minimal because there was nothing to hide

#### A3. `StepTimeline.tsx`

```tsx
import { useState } from 'react';
import {
  sequentialMetrics, overlappedMetrics, speedupFromOverlap,
  type StepTiming,
} from './step-timeline-data';
import styles from './StepTimeline.module.css';

export default function StepTimeline() {
  const [computeTime, setComputeTime] = useState(100);
  const [commTime, setCommTime] = useState(40);

  const timing: StepTiming = { computeTime, commTime };
  const seq = sequentialMetrics(timing);
  const ovr = overlappedMetrics(timing);
  const speedup = speedupFromOverlap(timing);

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Compute time: <span className={styles.controlValue}>{computeTime} ms</span>
          </label>
          <input
            type="range" min={10} max={300} step={5}
            value={computeTime}
            onChange={e => setComputeTime(Number(e.target.value))}
            className={styles.slider}
            aria-label="Compute time"
          />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Communication time: <span className={styles.controlValue}>{commTime} ms</span>
          </label>
          <input
            type="range" min={10} max={300} step={5}
            value={commTime}
            onChange={e => setCommTime(Number(e.target.value))}
            className={styles.slider}
            aria-label="Communication time"
          />
        </div>
      </div>

      {/* Sequential timeline */}
      <div className={styles.timelinePanel}>
        <div className={styles.timelineLabel}>
          Sequential — communication after compute (no overlap)
        </div>
        <TimelineSvg
          mode="sequential"
          computeTime={computeTime}
          commTime={commTime}
          totalTime={seq.totalTime}
        />
        <div className={styles.metricsRow}>
          <Metric label="Step total" value={`${seq.totalTime} ms`} />
          <Metric label="MFU" value={`${(seq.mfu * 100).toFixed(0)}%`} />
        </div>
      </div>

      {/* Overlapped timeline */}
      <div className={styles.timelinePanel}>
        <div className={styles.timelineLabel}>
          Overlapped — communication hidden behind compute
        </div>
        <TimelineSvg
          mode="overlapped"
          computeTime={computeTime}
          commTime={commTime}
          totalTime={ovr.totalTime}
        />
        <div className={styles.metricsRow}>
          <Metric label="Step total" value={`${ovr.totalTime} ms`} />
          <Metric label="MFU" value={`${(ovr.mfu * 100).toFixed(0)}%`} highlight={ovr.mfu >= 0.95} />
        </div>
      </div>

      {/* Speedup */}
      <div className={styles.speedupPanel}>
        <span className={styles.speedupLabel}>Speedup from overlap:</span>
        <span className={styles.speedupValue}>{speedup.toFixed(2)}×</span>
        <span className={styles.speedupNote}>
          {speedup >= 1.5 && '— large win, communication was the bottleneck'}
          {speedup >= 1.1 && speedup < 1.5 && '— meaningful win'}
          {speedup < 1.1 && '— small win, communication was already cheap relative to compute'}
        </span>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        The difference between sequential and overlapped MFU here is just <em>ordering</em> —
        same compute, same communication, but communication scheduled to run during compute.
        Modern training frameworks (PyTorch FSDP, Megatron-LM) overlap automatically via async
        CUDA streams and careful kernel scheduling. The MFU gap between a default-tuned and
        well-tuned training run is largely this overlap.
      </div>
    </div>
  );
}

interface TimelineSvgProps {
  mode: 'sequential' | 'overlapped';
  computeTime: number;
  commTime: number;
  totalTime: number;
}

function TimelineSvg({ mode, computeTime, commTime, totalTime }: TimelineSvgProps) {
  const WIDTH = 720;
  const HEIGHT = 120;
  const PADDING_LEFT = 70;
  const PADDING_RIGHT = 20;
  const PADDING_TOP = 20;
  const LANE_HEIGHT = 30;
  const LANE_GAP = 8;

  const plotW = WIDTH - PADDING_LEFT - PADDING_RIGHT;

  // Scale: visualize relative to the max time we might show (~600 ms = 2× longest slider value)
  const SCALE_MAX = 600;
  function timeToX(t: number): number {
    return (t / SCALE_MAX) * plotW;
  }

  // Compute lane (top)
  const computeY = PADDING_TOP;
  const computeStartX = PADDING_LEFT;
  const computeEndX = PADDING_LEFT + timeToX(computeTime);

  // Comm lane (bottom)
  const commY = PADDING_TOP + LANE_HEIGHT + LANE_GAP;
  let commStartX: number;
  let commEndX: number;

  if (mode === 'sequential') {
    commStartX = computeEndX;
    commEndX = commStartX + timeToX(commTime);
  } else {
    // Overlapped: comm runs in parallel from the start
    commStartX = PADDING_LEFT;
    commEndX = PADDING_LEFT + timeToX(commTime);
  }

  // Total time marker
  const totalEndX = PADDING_LEFT + timeToX(totalTime);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label={`${mode} timeline`}>
      {/* Axis baseline */}
      <line
        x1={PADDING_LEFT} x2={PADDING_LEFT + plotW}
        y1={HEIGHT - 22} y2={HEIGHT - 22}
        className={styles.axisLine}
      />
      {/* Tick marks every 100 ms */}
      {[0, 100, 200, 300, 400, 500, 600].map(t => (
        <g key={`tick-${t}`}>
          <line
            x1={PADDING_LEFT + timeToX(t)} x2={PADDING_LEFT + timeToX(t)}
            y1={HEIGHT - 22} y2={HEIGHT - 18}
            className={styles.tickLine}
          />
          <text
            x={PADDING_LEFT + timeToX(t)} y={HEIGHT - 6}
            className={styles.tickLabel}
            textAnchor="middle"
          >
            {t} ms
          </text>
        </g>
      ))}

      {/* Lane labels */}
      <text x={PADDING_LEFT - 10} y={computeY + LANE_HEIGHT / 2 + 5} className={styles.laneLabel} textAnchor="end">Compute</text>
      <text x={PADDING_LEFT - 10} y={commY + LANE_HEIGHT / 2 + 5} className={styles.laneLabel} textAnchor="end">Comm</text>

      {/* Compute block */}
      <rect
        x={computeStartX} y={computeY}
        width={computeEndX - computeStartX} height={LANE_HEIGHT}
        rx={3}
        className={styles.computeBlock}
      />
      <text
        x={computeStartX + (computeEndX - computeStartX) / 2}
        y={computeY + LANE_HEIGHT / 2 + 5}
        className={styles.blockLabel}
        textAnchor="middle"
      >
        {computeTime} ms
      </text>

      {/* Comm block */}
      <rect
        x={commStartX} y={commY}
        width={commEndX - commStartX} height={LANE_HEIGHT}
        rx={3}
        className={styles.commBlock}
      />
      <text
        x={commStartX + (commEndX - commStartX) / 2}
        y={commY + LANE_HEIGHT / 2 + 5}
        className={styles.blockLabel}
        textAnchor="middle"
      >
        {commTime} ms
      </text>

      {/* Total time marker (vertical line + label) */}
      <line
        x1={totalEndX} x2={totalEndX}
        y1={PADDING_TOP - 5} y2={HEIGHT - 22}
        className={styles.totalMarker}
      />
      <text
        x={totalEndX + 4} y={PADDING_TOP + 5}
        className={styles.totalLabel}
      >
        ← step end ({totalTime} ms)
      </text>
    </svg>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`${styles.metric} ${highlight ? styles.metricHighlight : ''}`}>
      <span className={styles.metricLabel}>{label}:</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  );
}
```

#### A4. `StepTimeline.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.controlGroup { display: flex; flex-direction: column; gap: 0.3rem; }
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
}
.controlValue { color: var(--cyan-300); font-weight: 500; }
.slider { width: 100%; }

.timelinePanel {
  margin-bottom: 1rem;
  padding: 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.timelineLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.svg { width: 100%; height: auto; }

.axisLine { stroke: var(--border-default); stroke-width: 1; }
.tickLine { stroke: var(--border-default); stroke-width: 1; }
.tickLabel { fill: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; font-size: 9px; }
.laneLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; }
.computeBlock { fill: color-mix(in srgb, var(--cyan-500) 70%, transparent); stroke: var(--cyan-400); stroke-width: 1; }
.commBlock { fill: color-mix(in srgb, var(--amber-400) 70%, transparent); stroke: var(--amber-400); stroke-width: 1; }
.blockLabel { fill: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; }
.totalMarker { stroke: var(--rose-400); stroke-width: 1.5; stroke-dasharray: 4 3; }
.totalLabel { fill: var(--rose-400); font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; }

.metricsRow {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.7rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-subtle);
}
.metric {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.metricLabel { color: var(--text-tertiary); margin-right: 0.4rem; }
.metricValue { color: var(--text-primary); font-weight: 500; }
.metricHighlight .metricValue { color: var(--emerald-400); }

.speedupPanel {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem 1rem;
  background: color-mix(in srgb, var(--cyan-500) 6%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.speedupLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
}
.speedupValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.4rem;
  color: var(--cyan-300);
  font-weight: 500;
}
.speedupNote {
  font-size: 0.82rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption em { color: var(--cyan-300); font-style: normal; font-weight: 500; }

@media (max-width: 640px) {
  .metricsRow { flex-direction: column; gap: 0.3rem; }
  .speedupPanel { flex-direction: column; align-items: flex-start; }
}
```

#### A5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as TrainingStackPicker } from './ch10/TrainingStackPicker';
export { default as StepTimeline } from './ch10/StepTimeline';
```

#### A6. Update section-7's WidgetFrame in `index.mdx`

```mdx
import { TrainingStackPicker, StepTimeline } from '@components/widgets';
```

```mdx
<WidgetFrame title="Step timeline" caption="One training step visualized as a timeline: compute (cyan) and communication (amber) phases. Sequential mode runs compute then communication (no overlap); overlapped mode hides communication behind compute. Adjust the slider values to see when overlap helps most.">
  <StepTimeline client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 8 ("Cost economics — and what's next") and the final chapter close paragraph:

````mdx
## Exercises

Four exercises that build on the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — NVLink vs InfiniBand bandwidth math

Compute the time for a single gradient all-reduce on a 7B-parameter model across two scenarios: 8 GPUs on one node (NVLink) vs 8 GPUs across two nodes (InfiniBand). Verify the ~20× speed difference.

<details>
<summary>Hint</summary>

For ring all-reduce of size $D$ bytes across $n$ GPUs, total communication per GPU ≈ $2 \cdot (n-1)/n \cdot D$. For 8 GPUs and gradient size $D = 2 \times 7 \times 10^9 = 14$ GB (BF16 grads), per-GPU comm is ~24.5 GB.

- NVLink at 900 GB/s: 24.5 / 900 ≈ 0.027 sec
- InfiniBand at 25 GB/s: 24.5 / 25 ≈ 0.98 sec

The ~36× gap is what dictates "TP within node, DP across nodes."

</details>

<RunnableCode
  client:visible
  defaultCode={`def all_reduce_time(data_size_bytes, num_gpus, bandwidth_gbps):
    """
    Time for ring all-reduce in seconds.
    
    Ring all-reduce per-GPU communication: 2 * (n-1)/n * data_size
    """
    # Ring all-reduce factor: 2(n-1)/n
    per_gpu_bytes = 2 * (num_gpus - 1) / num_gpus * data_size_bytes
    # Convert bandwidth GB/s → bytes/s
    bandwidth_bytes_s = bandwidth_gbps * 1e9
    # TODO: return per_gpu_bytes / bandwidth_bytes_s
    pass

# Test scenario: 7B model gradient all-reduce
GRAD_SIZE = 2 * 7e9   # BF16 = 2 bytes/param
NUM_GPUS = 8

# NVLink (~900 GB/s for H100)
# nvlink_time = all_reduce_time(GRAD_SIZE, NUM_GPUS, 900)
# print(f"NVLink (~900 GB/s):     {nvlink_time*1000:>7.2f} ms")

# InfiniBand (~25 GB/s for HDR)
# ib_time = all_reduce_time(GRAD_SIZE, NUM_GPUS, 25)
# print(f"InfiniBand (~25 GB/s):  {ib_time*1000:>7.2f} ms")

# Speed gap
# print(f"\\nSpeed gap: {ib_time / nvlink_time:.0f}x slower across nodes")
# print(f"This is WHY TP is restricted to within-node (NVLink) operations.")
`}
  packages={[]}
/>

### Exercise 2 (medium) — FlashAttention I/O complexity

Compute the HBM I/O for standard attention vs FlashAttention at increasing sequence lengths. Verify that the gap grows asymptotically.

<details>
<summary>Hint</summary>

**Standard attention** writes the full $N \times N$ attention matrix to HBM:
$\text{HBM I/O} \approx O(N^2 \cdot d)$ bytes

**FlashAttention** tiles attention to fit in SRAM (size $M$):
$\text{HBM I/O} \approx O(N \cdot d \cdot \lceil N / M \rceil)$ bytes

For typical SRAM sizes (e.g., $M \approx 100K$ elements), once $N > M$, the FlashAttention I/O grows linearly in $N$ rather than quadratically.

</details>

<RunnableCode
  client:visible
  defaultCode={`def standard_attention_hbm_io(N, d, dtype_bytes=2):
    """
    HBM I/O for standard attention.
    
    Operations:
      1. Compute Q*K^T: read Q, K (2 * N * d); write S (N * N)
      2. Softmax: read S (N * N); write P (N * N)
      3. Compute P*V: read P, V (N * N + N * d); write O (N * d)
    
    Total: dominated by O(N^2) attention matrix I/O.
    """
    # Read Q, K, V; write O: 4 * N * d
    qkv_o_io = 4 * N * d * dtype_bytes
    # Read/write attention matrix S, P: 4 * N^2
    attn_matrix_io = 4 * N * N * dtype_bytes
    return qkv_o_io + attn_matrix_io

def flashattention_hbm_io(N, d, sram_size=100_000, dtype_bytes=2):
    """
    HBM I/O for FlashAttention.
    
    Tile size limited by SRAM. For each Q tile, K and V tiles are streamed
    through SRAM. Each K, V element is loaded approximately N / sram_size times.
    """
    # TODO: implement
    # Each Q, K, V, O is read/written ~N / sram_size times
    # Total I/O ≈ 4 * N * d * (N / sram_size) * dtype_bytes — but bounded below by 4*N*d
    pass

# Test at increasing sequence lengths
print(f"{'N':>8} {'Standard':>15} {'FlashAttn':>15} {'Speedup':>10}")
print("-" * 55)
for N in [512, 2048, 8192, 32768, 131072]:
    std = standard_attention_hbm_io(N, 64)
    # flash = flashattention_hbm_io(N, 64)
    # speedup = std / flash
    # print(f"{N:>8} {std/1e6:>12.1f} MB {flash/1e6:>12.1f} MB {speedup:>10.1f}x")

# Expected: at N=512, speedup ~1-2x; at N=131072, speedup ~50x+
# The asymptotic gap is why long-context LLMs became practical with FlashAttention.
`}
  packages={[]}
/>

### Exercise 3 (medium) — Activation memory with checkpointing

Compute activation memory for a 70B-parameter transformer (80 layers, d_model=8192) at various sequence lengths, with and without activation checkpointing. Identify the sequence length where checkpointing becomes necessary on an 80GB H100.

<details>
<summary>Hint</summary>

Per-layer activations include attention QKV (3 × B × N × d), attention output (B × N × d), FFN intermediate (B × N × 4d), and various LayerNorm outputs. Total per layer ≈ 10 × B × N × d × bytes.

Without checkpointing: total = num_layers × per_layer.
With selective checkpointing: keep only input to each layer → total ≈ num_layers × B × N × d × bytes (10× reduction).

Compare against H100's 80 GB; account for state memory (~140 GB for 70B model under FSDP on 8 GPUs = 17.5 GB/GPU, leaving ~60 GB for activations).

</details>

<RunnableCode
  client:visible
  defaultCode={`def activation_memory(num_layers, batch_size, seq_len, d_model, with_checkpointing, dtype_bytes=2):
    """
    Activation memory per GPU.
    
    Per-layer activations (no checkpointing) ≈ 10 * B * N * d * bytes
    With selective checkpointing: ~1 * B * N * d * bytes (10x reduction)
    """
    # TODO: implement
    pass

# Test: 70B model on 8 H100s (FSDP), various sequence lengths
NUM_LAYERS = 80
D_MODEL = 8192
BATCH_SIZE = 4   # per GPU
H100_MEM_GB = 80

# State memory per GPU (FSDP across 8 GPUs): 70B * 18 bytes / 8 = 157 GB total / 8 = ~19 GB/GPU
STATE_GB = (70e9 * 18) / 8 / 1e9

print(f"State memory per GPU: {STATE_GB:.1f} GB")
print(f"Available for activations: {H100_MEM_GB - STATE_GB:.1f} GB\\n")

print(f"{'seq_len':>8} {'no checkpt':>12} {'with checkpt':>14} {'fits no/yes':>14}")
print("-" * 52)
for seq_len in [512, 1024, 2048, 4096, 8192, 16384]:
    # mem_no = activation_memory(NUM_LAYERS, BATCH_SIZE, seq_len, D_MODEL, with_checkpointing=False) / 1e9
    # mem_yes = activation_memory(NUM_LAYERS, BATCH_SIZE, seq_len, D_MODEL, with_checkpointing=True) / 1e9
    # available_gb = H100_MEM_GB - STATE_GB
    # fits_no = "✓" if mem_no < available_gb else "✗"
    # fits_yes = "✓" if mem_yes < available_gb else "✗"
    # print(f"{seq_len:>8} {mem_no:>9.1f} GB {mem_yes:>10.1f} GB {fits_no:>6} / {fits_yes:>6}")
    pass

# Conclusion: checkpointing extends the practical sequence length 10x.
`}
  packages={[]}
/>

### Exercise 4 (hard) — MFU calculation + cost projection

Compute MFU and dollar cost for a realistic training run: Llama-3 70B trained on 1.4T tokens across 1024 H100s. Compare against industry-typical 40-50% MFU.

<details>
<summary>Hint</summary>

MFU = achieved FLOPs / theoretical peak FLOPs.

For training:
- Total FLOPs ≈ 6 × N × D (where N = params, D = tokens)
- Achieved FLOPs/sec = tokens_per_sec × 6 × N
- Theoretical FLOPs/sec = num_gpus × peak_flops_per_gpu

For a real training run, you measure tokens/sec and back out MFU.

</details>

<RunnableCode
  client:visible
  defaultCode={`def estimate_training_run(model_params, tokens, num_gpus, peak_flops_per_gpu, mfu, hourly_cost_per_gpu):
    """
    Estimate total training time and cost.
    
    Total FLOPs = 6 * N * D
    Achievable FLOPs/sec = num_gpus * peak_flops_per_gpu * mfu
    Time = total_FLOPs / achievable_FLOPs_per_sec
    Cost = time_hours * num_gpus * hourly_cost
    """
    # TODO: implement
    pass

def mfu_from_throughput(tokens_per_sec, model_params, num_gpus, peak_flops_per_gpu):
    """
    Back out MFU from observed throughput.
    
    achieved_flops_per_sec = tokens_per_sec * 6 * model_params
    theoretical_flops_per_sec = num_gpus * peak_flops_per_gpu
    """
    # TODO: implement
    pass

# Scenario: Llama-3 70B training run
MODEL_PARAMS = 70e9
TOKENS = 1.4e12          # 1.4T tokens (~20× model size, Chinchilla)
NUM_GPUS = 1024          # 1024 H100s
PEAK_FLOPS_H100 = 989e12 # 989 TFLOPS BF16

# Industry-typical MFU values
for mfu in [0.30, 0.40, 0.50]:
    # result = estimate_training_run(
    #     MODEL_PARAMS, TOKENS, NUM_GPUS, PEAK_FLOPS_H100, mfu, hourly_cost_per_gpu=5.0
    # )
    # print(f"MFU={mfu*100:.0f}%: {result['hours']/24:.1f} days, cost \${result['cost']/1e6:.1f}M")
    pass

# Verify MFU calculation from a hypothetical throughput
# If we measure 1.0M tokens/sec on 1024 H100s training a 70B model:
# observed_mfu = mfu_from_throughput(1.0e6, MODEL_PARAMS, NUM_GPUS, PEAK_FLOPS_H100)
# print(f"\\nObserved MFU from 1M tokens/sec: {observed_mfu*100:.1f}%")
# (Should be in the 40-50% range — industry-typical for well-tuned training)
`}
  packages={[]}
/>

````

### Part C — Flip Ch 10's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 10, slug: 'ch10-training-infra', title: 'Training infrastructure', partNum: 3, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 5's** `TrainingStackPicker` widget still renders correctly.
3. **Section 7** now renders the working `StepTimeline` widget.
4. **Default state:** compute time = 100 ms, comm time = 40 ms. Sequential total = 140 ms (71% MFU). Overlapped total = 100 ms (100% MFU). Speedup = 1.4×.
5. **At compute = 100 ms, comm = 200 ms:** sequential = 300 ms (33% MFU); overlapped = 200 ms (50% MFU). Comm becomes the bottleneck — even overlap can't fully hide it.
6. **At compute = 200 ms, comm = 20 ms:** sequential = 220 ms (91% MFU); overlapped = 200 ms (100% MFU). Comm is so small overlap barely helps — speedup = 1.1×.
7. **The Exercises section** is below section 8 and above the chapter close paragraph; contains 4 sub-exercises with collapsible hints and runnable starter code.
8. **Sidebar:** Ch 1-10 all active (published); Ch 11-30 still dimmed.
9. **Landing page CTA:** still reads "Start with Chapter 1 →".
10. **Prev/next at bottom of Ch 10:** prev = Ch 9 (active); next = Ch 11 (disabled).
11. **TOC on Ch 10** includes Exercises as h2 plus 4 h3 sub-entries.
12. **Mobile:** controls and metrics stack vertically; timelines still readable.
13. **`npm run typecheck`** passes.
14. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 10 flips.
- ❌ **Do not modify Ch 1-9.** Sealed.
- ❌ **Do not modify Ch 10 widgets.** Only section 7's WidgetFrame gets updated.
- ❌ **Do not modify Ch 10 prose sections 1-8.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch10-training-infra/index.mdx src/lib/chapters.ts src/components/widgets/ch10/StepTimeline.tsx src/components/widgets/ch10/StepTimeline.module.css src/components/widgets/ch10/step-timeline-data.ts src/components/widgets/index.ts
git commit -m "session 48: Ch 10 step timeline widget + exercises + status: published"
git push origin main
```

---

## 🎉 Phase 9 closeout

**This is the closeout for both Chapter 10 AND Phase 9.** After this session deploys, the tutorial's entire training-side arc is complete on production.

Confirm before declaring Ch 10 / Phase 9 done:

- ✅ BUILD_ORDER.md shows files 60-63 ✅
- ✅ File 64 marked ⏭️ (absorbed)
- ✅ Ch 10 status is `'published'`
- ✅ Both Ch 10 widgets work in production
- ✅ All 4 Ch 10 exercises render
- ✅ Sidebar shows Ch 1-10 all active

**Cadence check across 10 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual-heavy | 2 | 4 |
| Ch 5 | Two-topic (architecture) | 2 | 5 |
| Ch 6 | Variants | 2 | 4 |
| Ch 7 | Data engineering | 2 | 4 |
| Ch 8 | Two-topic (training) | 2 | 5 |
| Ch 9 | Two-topic (scaling) | 2 | 5 |
| Ch 10 | Engineering | 2 | 4 |

**4-file cadence holds for single-topic chapters (Ch 2, 3, 4, 6, 7, 10).**
**5-file cadence holds for two-topic chapters (Ch 1, 5, 8, 9).**
**Pattern stable across 10 chapters in two very different halves of the tutorial.**

**Phase 9 (Pre-training) status:**
- ✅ Ch 7 (Pre-training data)
- ✅ Ch 8 (Building a small LLM)
- ✅ Ch 9 (Scaling laws + distributed training)
- ✅ Ch 10 (Training infrastructure)

**Phase 9 is complete.** The training arc — data, training loop, scaling, infrastructure — is fully on production. Readers can walk from "what is a transformer" (Ch 1-6) to "trained at frontier scale" (Ch 10) with full conceptual and engineering understanding.

**What's next — Phase 10+:**
- **Ch 11**: Mixture of Experts (MoE)
- **Ch 12**: Alternative architectures (Mamba, state-space)
- **Ch 13-16**: Post-training (SFT, RLHF/DPO, PEFT, distillation)
- **Ch 17-19**: Inference
- **Ch 20-23**: Capabilities (reasoning, tools, RAG, multimodal)
- **Ch 24-26**: Safety + interpretability + evaluation
- **Ch 27-30**: Agents

The training-side arc is the longest contiguous arc in the tutorial. After Phase 9, the chapters are more independent — readers can largely pick and choose Phase 10+ chapters based on interest.

---

## Notes for the session author

**On the Step Timeline being conceptually simple but pedagogically rich:**
The widget visualizes one simple idea: communication can run during compute, or after. The MFU difference between "sequential" and "overlapped" is just *ordering*. This is conceptually trivial but operationally crucial — modern training frameworks expend enormous engineering effort to maximize overlap. The widget makes the abstract claim "overlap matters" concrete in a way that prose cannot.

**On the speedup hint messages:**
- Speedup ≥ 1.5×: "large win, communication was the bottleneck"
- Speedup ≥ 1.1×: "meaningful win"
- Speedup < 1.1×: "small win, communication was already cheap relative to compute"

These messages help the reader interpret what they see. Without them, the reader might miss the intuition that overlap helps most when communication is large relative to compute.

**On the exercise sequence:**
- Ex 1 (easy): bandwidth math — verifies the NVLink-vs-InfiniBand gap quantitatively. Reader confirms the ~20-40× gap the chapter claims.
- Ex 2 (medium): FlashAttention I/O — verifies the asymptotic gap between standard and FlashAttention. Reader sees the gap GROWS with N, not just constant-factor.
- Ex 3 (medium): activation checkpointing — computes when checkpointing becomes necessary for a 70B model. Reader finds the seq_len threshold (~8K-16K) where checkpointing transitions from "optional optimization" to "required for fit."
- Ex 4 (hard): MFU + cost projection — combines the chapter's two key metrics (MFU and cost). Reader projects costs at 30%/40%/50% MFU and sees the dollar-amount difference (10s of millions).

**On the 4 exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. GPU families | (chapter prose) |
| 2. NVLink vs InfiniBand gap | Ex 1 |
| 3. Training frameworks | (chapter prose + Ex widget) |
| 4. Triton | (chapter prose) |
| 5. FlashAttention insight | Ex 2 |
| 6. Activation checkpointing | Ex 3 |
| 7. MFU concept | Ex 4 |
| 8. Cost estimation | Ex 4 |

Outcomes 2, 5, 6, 7, 8 served by exercises. Outcomes 1, 3, 4 served by chapter prose. Comprehensive coverage of engineering knowledge.

**Pedagogical claim of the closeout:**
"You now have the full engineering toolkit. You can compute bandwidth costs (Ex 1). You can reason about FlashAttention's I/O complexity (Ex 2). You can predict activation memory and when checkpointing helps (Ex 3). You can project training run costs from MFU estimates (Ex 4). Combined with Ch 1-9, you can run any modern training pipeline conceptually — and with the practical depth of Ch 10, plan real deployments."

**Phase 9 grand closeout:**
After this session deploys, Phase 9 is complete. The tutorial's longest contiguous arc (Ch 7-10) is on production. The reader has walked from "raw web text" through "trained 70B model on production infrastructure." Every architectural piece, every training decision, every parallelism strategy, and every cost trade-off is documented and runnable.

**Phase 10+ begins next.** It's a different texture — chapters are more independent, less contiguous, more breadth-focused. Mixture of Experts, alternative architectures, post-training methods, inference, capabilities, safety, agents. Each is its own story.

Build with care. **This session closes the longest arc in the project.**
