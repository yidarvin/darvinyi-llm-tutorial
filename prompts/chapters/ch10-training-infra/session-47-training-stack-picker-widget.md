# Session 47 — Training stack picker marquee widget

> The marquee Chapter 10 widget — and a genuinely useful decision-support tool. Pick a model size, GPU type, and GPU count. The widget computes the per-GPU memory requirement for each parallelism stack (vanilla DP, FSDP, Megatron+FSDP, Megatron-DeepSpeed), picks the simplest stack that fits, and estimates MFU, training time, and dollar cost for a Chinchilla-optimal training run. Practical engineering brought to interactive form. Replaces the section-5 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch10-training-infra/research.md`** — hardware specs (H100/A100/MI300X memory), framework recommendations, MFU concept, and cost economics are the references
2. **`prompts/chapters/ch10-training-infra/session-46-page-structure.md`** — for the section-5 widget placeholder this session fills
3. **`prompts/chapters/ch09-scaling-and-distributed/session-42-scaling-law-calculator-widget.md`** — for the sliders + recommendation-card UX pattern (ScalingLawCalculator is the closest precedent)
4. **`prompts/chapters/ch09-scaling-and-distributed/session-43-parallelism-diagram-widget.md`** — for the comparison-of-strategies pattern (ParallelismDiagram uses tabs; this widget uses recommendation cards)

---

## Goal

Replace the `<WidgetFrame title="Training stack picker">` placeholder in section 5 with a working interactive widget that:

- Provides three input controls:
  - **Model size slider** (log scale, 100M to 1T parameters)
  - **GPU type radio** (H100, A100, MI300X — different memory + peak FLOPS)
  - **GPU count slider** (log scale, 8 to 16,384 GPUs)
- For each parallelism stack (DP, FSDP, Megatron+FSDP, Megatron-DeepSpeed), computes:
  - **Per-GPU memory** required (state + activations)
  - **Fits or doesn't** (compares against GPU memory)
- **Recommends the simplest stack that fits** with reasonable headroom
- Shows the recommendation prominently with TP/PP/DP ranks
- Estimates:
  - **MFU** (with adjustments for cross-node parallelism, large DP rank, etc.)
  - **Training time** for Chinchilla-optimal token count (20 × N tokens)
  - **Dollar cost** based on cloud GPU pricing
- Displays a "why this stack" explanation
- Shows a 3-card comparison: DP / FSDP / Megatron 3D — each marked as "fits" or "doesn't fit" with a brief reason

**End state:** section 5 of Chapter 10 has a working marquee widget. After 30 seconds of exploration, the reader should be able to answer: "I want to train a 70B model on 64 H100s — what stack should I use, and what will it cost?" The widget gives a defensible answer with the reasoning shown.

---

## Inputs

State of the repo after session 46:

- `src/pages/ch10-training-infra/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 5 and 7)
- `src/lib/chapters.ts` has Ch 10 as `'draft'`
- No `src/components/widgets/ch10/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch10/TrainingStackPicker.tsx` — the React widget
2. **Create** `src/components/widgets/ch10/TrainingStackPicker.module.css` — scoped styles
3. **Create** `src/components/widgets/ch10/training-stack-data.ts` — GPU specs + recommendation logic
4. **Update** `src/components/widgets/index.ts` — add `TrainingStackPicker` export
5. **Update** `src/pages/ch10-training-infra/index.mdx` — replace section-5's `<WidgetFrame>` interior with `<TrainingStackPicker client:visible />`

**Do NOT modify:** any prior chapter widget, the section-7 placeholder, or any other file.

---

## Detailed spec

### 1. `training-stack-data.ts` — the recommendation logic

```ts
// src/components/widgets/ch10/training-stack-data.ts

export type GPUKey = 'h100' | 'a100' | 'mi300x';

export interface GPUSpec {
  key: GPUKey;
  label: string;
  memoryGB: number;
  peakFlopsBF16: number;   // TFLOPS
  hourlyCostUSD: number;
}

export const GPU_SPECS: GPUSpec[] = [
  { key: 'h100',   label: 'H100 80GB',   memoryGB: 80,  peakFlopsBF16: 989,  hourlyCostUSD: 5.0 },
  { key: 'a100',   label: 'A100 80GB',   memoryGB: 80,  peakFlopsBF16: 312,  hourlyCostUSD: 2.5 },
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
  memoryPerGPU: number;   // GB (state + activations estimate)
  stateMemoryPerGPU: number;   // GB (params + grads + optimizer)
  activationMemoryPerGPU: number;   // GB
  fits: boolean;
  mfuEstimate: number;   // 0..1
  rationale: string;
}

/**
 * Estimate memory + MFU for a given stack and configuration.
 * Returns a StackResult per stack key.
 */
export function evaluateStacks(
  modelParams: number,   // raw param count (e.g., 7e9)
  gpu: GPUSpec,
  gpuCount: number,
): StackResult[] {
  // Memory accounting (mixed precision + AdamW):
  //   params FP16:     2 bytes/param
  //   master FP32:     4 bytes/param
  //   gradients FP32:  4 bytes/param
  //   optimizer m, v:  8 bytes/param
  //   Total state:    18 bytes/param
  const STATE_BYTES_PER_PARAM = 18;
  const totalStateGB = (modelParams * STATE_BYTES_PER_PARAM) / 1e9;

  // Activation memory: ~10 * batch * seq * d_model per layer
  // For widget simplicity: assume seq=2048, batch=4 per DP rank, d_model = sqrt(modelParams) heuristic
  // Rough approximation: activations ~ 10% of state memory (with checkpointing)
  const baseActivationGB = totalStateGB * 0.1;

  // === Vanilla DP ===
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
      'Each GPU holds the full model + grads + optimizer state. Simplest stack but does not scale to large models — each GPU needs to hold the entire state.',
  };

  // === FSDP (ZeRO-3) ===
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

  // === Megatron + FSDP (TP within node, FSDP for the rest) ===
  // Choose TP = min(8, gpuCount), then FSDP across remaining
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
    activationMemoryPerGPU: baseActivationGB / tpRank,   // TP shards activations too
    memoryPerGPU: megatronFsdpStateMem + baseActivationGB / tpRank,
    fits: megatronFsdpStateMem + baseActivationGB / tpRank < gpu.memoryGB * 0.9,
    mfuEstimate: estimateMFU('megatron_fsdp', gpuCount, tpRank),
    rationale:
      'Tensor parallelism (TP=8 within a node, NVLink) for activation sharding; FSDP across nodes for state sharding. Standard choice for 30B-100B models.',
  };

  // === Megatron-DeepSpeed (full 3D parallelism) ===
  // Choose TP=8, PP based on size; remainder = DP
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
    fits: megaDS_stateMem + baseActivationGB / (tpRank3D * ppRank3D) < gpu.memoryGB * 0.9 && gpuCount >= tpRank3D * ppRank3D,
    mfuEstimate: estimateMFU('megatron_deepspeed', gpuCount, tpRank3D, ppRank3D),
    rationale:
      '3D parallelism: TP (within node) + PP (across nodes) + sharded DP. Standard choice for 100B+ models. Highest communication overhead but only way to fit huge models.',
  };

  return [dp, fsdp, megaFsdp, megaDS];
}

/** Estimate MFU based on stack and configuration. Returns 0..1. */
function estimateMFU(stack: StackKey, gpuCount: number, tpRank = 1, ppRank = 1): number {
  let mfu = 0.50;   // base efficiency for well-tuned training

  // Pipeline parallelism: bubble inefficiency
  if (ppRank > 1) mfu -= 0.05;
  // Tensor parallelism: per-layer all-reduce overhead
  if (tpRank > 1) mfu -= 0.03;
  // Large DP rank: gradient all-reduce becomes a bottleneck
  if (gpuCount > 512) mfu -= 0.05;
  if (gpuCount > 4096) mfu -= 0.05;
  // Stack-specific penalties
  if (stack === 'fsdp' && gpuCount > 256) mfu -= 0.03;
  if (stack === 'megatron_deepspeed') mfu -= 0.02;   // coordination overhead

  return Math.max(0.20, mfu);
}

/**
 * Pick the recommended stack: simplest one that fits with reasonable headroom.
 * Returns the recommended stack's key.
 */
export function recommendStack(results: StackResult[]): StackKey {
  // Try in order of complexity: DP, FSDP, Megatron+FSDP, Megatron-DS
  for (const r of results) {
    if (r.fits) return r.key;
  }
  // If none fit, return the most aggressive
  return results[results.length - 1]!.key;
}

/**
 * Estimate Chinchilla-optimal training: 20 tokens per parameter,
 * 6 * N * D FLOPs total, divided by (num_gpus * peak_flops * MFU).
 */
export function estimateTrainingRun(
  modelParams: number,
  gpu: GPUSpec,
  gpuCount: number,
  mfu: number,
): { hours: number; costUSD: number; flopsTotal: number; tokensTotal: number } {
  const tokensTotal = modelParams * 20;   // Chinchilla 20× rule
  const flopsTotal = 6 * modelParams * tokensTotal;
  // Effective FLOPS per GPU
  const effectiveFlopsPerGPU = gpu.peakFlopsBF16 * 1e12 * mfu;
  const totalEffectiveFlops = gpuCount * effectiveFlopsPerGPU;
  const seconds = flopsTotal / totalEffectiveFlops;
  const hours = seconds / 3600;
  const costUSD = hours * gpuCount * gpu.hourlyCostUSD;
  return { hours, costUSD, flopsTotal, tokensTotal };
}

// Slider helpers (log-scale)
export const LOG_PARAMS_MIN = 8;    // 100M params = 10^8
export const LOG_PARAMS_MAX = 12;   // 1T params = 10^12
export const LOG_GPUS_MIN = 3;      // 8 GPUs = 2^3
export const LOG_GPUS_MAX = 14;     // 16384 GPUs = 2^14

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

/** Format numbers compactly: 7e9 → "7.0B", 1.4e12 → "1.4T". */
export function formatLargeNumber(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n / 1e9 ).toFixed(1) + 'B';
  if (n >= 1e6)  return (n / 1e6 ).toFixed(1) + 'M';
  if (n >= 1e3)  return (n / 1e3 ).toFixed(1) + 'K';
  return n.toFixed(0);
}

/** Format USD: $25K, $2.5M, $50M */
export function formatUSD(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

/** Format hours: 3.2 days, 5.1 weeks */
export function formatTime(hours: number): string {
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  if (hours < 24 * 14) return `${(hours / 24).toFixed(1)} days`;
  if (hours < 24 * 90) return `${(hours / (24 * 7)).toFixed(1)} weeks`;
  return `${(hours / (24 * 30)).toFixed(1)} months`;
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 700

┌────────────────────────────────────────────────────────────────────┐
│  Model size: [────●────] 7.0B params  (log scale)                 │
│  GPU type:   (●) H100 80GB  (○) A100 80GB  (○) MI300X 192GB       │
│  GPU count:  [────●────] 64 GPUs                                   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  RECOMMENDED:  PyTorch FSDP                           │        │
│  │                                                       │        │
│  │  TP=1   PP=1   DP=64                                  │        │
│  │                                                       │        │
│  │  Per-GPU memory                                       │        │
│  │  ┌──────────────────────────────────────┐            │        │
│  │  │ ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ 2.2/80 GB │        │
│  │  └──────────────────────────────────────┘            │        │
│  │                                                       │        │
│  │  Est. MFU:           45%                              │        │
│  │  Est. training time: 3.2 days  (Chinchilla 140B tok) │        │
│  │  Est. cost:          $25,000                          │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                    │
│  Why FSDP?                                                         │
│  A 7B model in BF16 + AdamW = 126 GB total state. Won't fit on    │
│  a single H100 (80 GB) — but FSDP shards across 64 GPUs to ~2 GB. │
│  Megatron 3D parallelism would also fit but adds communication    │
│  overhead unnecessary at this scale.                              │
│                                                                    │
│  Compare all stacks:                                              │
│  ┌──────────┬──────────────┬──────────────┬──────────────┐       │
│  │ DP       │ FSDP ★       │ Megatron+FSDP│ Megatron-DS  │       │
│  │ ✗ 126 GB │ ✓ 2.2 GB     │ ✓ 2.2 GB     │ ✓ 0.5 GB     │       │
│  │ doesn't  │ fits with    │ fits but TP  │ overkill —   │       │
│  │ fit      │ headroom     │ overhead     │ 3D unneeded  │       │
│  └──────────┴──────────────┴──────────────┴──────────────┘       │
└────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Adjust model size slider → all per-GPU memory values update; recommendation may switch (e.g., 7B → FSDP; 70B → Megatron+FSDP; 405B → Megatron-DS)
- Switch GPU type → memory limits change (MI300X has 192GB vs H100's 80GB); recommendations may switch
- Adjust GPU count → DP rank changes; memory per GPU changes; cost changes
- Hover any stack card → see detailed rationale
- The recommendation card is always at the top; the comparison cards below show all four

### 3. `TrainingStackPicker.tsx`

```tsx
import { useMemo, useState } from 'react';
import {
  GPU_SPECS, type GPUKey, type StackKey,
  evaluateStacks, recommendStack, estimateTrainingRun,
  sliderToParams, paramsToSlider, sliderToGpuCount, gpuCountToSlider,
  formatLargeNumber, formatUSD, formatTime,
} from './training-stack-data';
import styles from './TrainingStackPicker.module.css';

export default function TrainingStackPicker() {
  const [paramsSlider, setParamsSlider] = useState(paramsToSlider(7e9));     // default: 7B
  const [gpuKey, setGpuKey] = useState<GPUKey>('h100');
  const [gpuCountSlider, setGpuCountSlider] = useState(gpuCountToSlider(64)); // default: 64 GPUs

  const modelParams = sliderToParams(paramsSlider);
  const gpuCount = sliderToGpuCount(gpuCountSlider);
  const gpu = GPU_SPECS.find(g => g.key === gpuKey)!;

  const stacks = useMemo(
    () => evaluateStacks(modelParams, gpu, gpuCount),
    [modelParams, gpu, gpuCount],
  );

  const recommendedKey = recommendStack(stacks);
  const recommended = stacks.find(s => s.key === recommendedKey)!;

  const trainingRun = useMemo(
    () => estimateTrainingRun(modelParams, gpu, gpuCount, recommended.mfuEstimate),
    [modelParams, gpu, gpuCount, recommended],
  );

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Model size: <span className={styles.controlValue}>{formatLargeNumber(modelParams)} params</span>
          </label>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={paramsSlider}
            onChange={e => setParamsSlider(Number(e.target.value))}
            className={styles.slider}
            aria-label="Model size"
          />
          <div className={styles.sliderHints}>
            <span>100M</span><span>1B</span><span>10B</span><span>100B</span><span>1T</span>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>GPU type</label>
          <div className={styles.radioGroup}>
            {GPU_SPECS.map(g => (
              <label key={g.key} className={styles.radioItem}>
                <input
                  type="radio"
                  name="gpu-type"
                  checked={gpuKey === g.key}
                  onChange={() => setGpuKey(g.key)}
                />
                <span>{g.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            GPU count: <span className={styles.controlValue}>{gpuCount.toLocaleString()} GPUs</span>
          </label>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={gpuCountSlider}
            onChange={e => setGpuCountSlider(Number(e.target.value))}
            className={styles.slider}
            aria-label="GPU count"
          />
          <div className={styles.sliderHints}>
            <span>8</span><span>64</span><span>512</span><span>4K</span><span>16K</span>
          </div>
        </div>
      </div>

      {/* Recommendation card */}
      <div className={styles.recommendationPanel}>
        <div className={styles.recommendationHeader}>
          RECOMMENDED: <strong>{recommended.label}</strong>
        </div>
        <div className={styles.recommendationRanks}>
          <span>TP={recommended.tpRank}</span>
          <span>PP={recommended.ppRank}</span>
          <span>DP={recommended.dpRank.toLocaleString()}</span>
        </div>

        <MemoryBar
          used={recommended.memoryPerGPU}
          total={gpu.memoryGB}
          fits={recommended.fits}
        />

        <div className={styles.metricsGrid}>
          <Metric label="MFU"          value={`${(recommended.mfuEstimate * 100).toFixed(0)}%`} />
          <Metric label="Time"         value={formatTime(trainingRun.hours)} subtext={`(${formatLargeNumber(trainingRun.tokensTotal)} tokens, Chinchilla)`} />
          <Metric label="Cost"         value={formatUSD(trainingRun.costUSD)} subtext={`@ $${gpu.hourlyCostUSD}/GPU-hour`} />
        </div>
      </div>

      {/* Rationale */}
      <div className={styles.rationalePanel}>
        <div className={styles.rationaleTitle}>Why {recommended.shortLabel}?</div>
        <div className={styles.rationaleBody}>{recommended.rationale}</div>
      </div>

      {/* Comparison grid */}
      <div className={styles.compareTitle}>All four stacks at this configuration:</div>
      <div className={styles.compareGrid}>
        {stacks.map(s => (
          <div
            key={s.key}
            className={`${styles.stackCard} ${s.key === recommendedKey ? styles.stackCardRecommended : ''}`}
          >
            <div className={styles.stackCardHeader}>
              {s.shortLabel} {s.key === recommendedKey && '★'}
            </div>
            <div className={`${styles.stackCardFitsRow} ${s.fits ? styles.fitsOk : styles.fitsNo}`}>
              {s.fits ? '✓ fits' : '✗ exceeds GPU memory'}
            </div>
            <div className={styles.stackCardMemory}>
              {s.memoryPerGPU < 1 ? `${(s.memoryPerGPU * 1024).toFixed(0)} MB` : `${s.memoryPerGPU.toFixed(1)} GB`} / GPU
            </div>
            <div className={styles.stackCardRanks}>
              TP={s.tpRank} PP={s.ppRank} DP={s.dpRank.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
      {subtext && <div className={styles.metricSubtext}>{subtext}</div>}
    </div>
  );
}

function MemoryBar({ used, total, fits }: { used: number; total: number; fits: boolean }) {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div className={styles.memoryBarSection}>
      <div className={styles.memoryBarLabel}>
        Per-GPU memory: <strong>{used < 1 ? `${(used * 1024).toFixed(0)} MB` : `${used.toFixed(1)} GB`} / {total} GB</strong>
        {fits ? <span className={styles.memoryBarOk}> ✓</span> : <span className={styles.memoryBarBad}> ✗ exceeds</span>}
      </div>
      <div className={styles.memoryBarTrack}>
        <div
          className={`${styles.memoryBarFill} ${fits ? styles.memoryBarFillOk : styles.memoryBarFillBad}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

### 4. `TrainingStackPicker.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.controlsPanel {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
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
.sliderHints {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-tertiary);
}

.radioGroup {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}
.radioItem {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.recommendationPanel {
  padding: 1.1rem 1.2rem;
  background: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.recommendationHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 0.4rem;
}
.recommendationHeader strong {
  color: var(--cyan-300);
  font-size: 1.05rem;
  font-family: 'Inter', sans-serif;
}
.recommendationRanks {
  display: flex;
  gap: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 0.85rem;
}

.memoryBarSection { margin-bottom: 1rem; }
.memoryBarLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.35rem;
}
.memoryBarLabel strong { color: var(--text-primary); }
.memoryBarOk { color: var(--emerald-400); }
.memoryBarBad { color: var(--rose-400); }
.memoryBarTrack {
  height: 18px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.memoryBarFill {
  height: 100%;
  transition: width 200ms;
}
.memoryBarFillOk { background: var(--cyan-500); }
.memoryBarFillBad { background: var(--rose-500); }

.metricsGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}
.metric {
  padding: 0.5rem 0.7rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.metricLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.2rem;
}
.metricValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  color: var(--cyan-300);
  font-weight: 500;
}
.metricSubtext {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-tertiary);
  margin-top: 0.15rem;
}

.rationalePanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.rationaleTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--cyan-300);
  font-weight: 500;
  margin-bottom: 0.4rem;
}
.rationaleBody {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.compareTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.compareGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.stackCard {
  padding: 0.65rem 0.8rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.stackCardRecommended {
  border-color: var(--cyan-500);
  background: color-mix(in srgb, var(--cyan-500) 5%, var(--bg-elevated));
}
.stackCardHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 0.3rem;
}
.stackCardFitsRow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  margin-bottom: 0.3rem;
}
.fitsOk { color: var(--emerald-400); }
.fitsNo { color: var(--rose-400); }
.stackCardMemory {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.15rem;
}
.stackCardRanks {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: var(--text-tertiary);
}

@media (max-width: 720px) {
  .metricsGrid { grid-template-columns: 1fr; }
  .compareGrid { grid-template-columns: 1fr 1fr; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as TrainingStackPicker } from './ch10/TrainingStackPicker';
// Session 48 will add:
// export { default as StepTimeline } from './ch10/StepTimeline';
```

### 6. Update `src/pages/ch10-training-infra/index.mdx`

**Edit A: Add widget import:**

```mdx
import { TrainingStackPicker } from '@components/widgets';
```

**Edit B: Replace section-5's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Training stack picker" caption="Pick a model size, GPU type, and GPU count. The widget computes per-GPU memory under each parallelism stack (DP, FSDP, Megatron+FSDP, Megatron-DeepSpeed), recommends the simplest stack that fits, and estimates MFU, training time, and cost for a Chinchilla-optimal run. Practical decision support.">
  <TrainingStackPicker client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 5 of Ch 10** renders with the working widget. Section 7's placeholder still stubbed.
3. **Default state:** 7B params, H100, 64 GPUs. Recommended stack: FSDP. Memory ~2 GB/GPU. MFU ~45%. Time ~3 days. Cost ~$25K.
4. **At 175B params, H100, 64 GPUs:** vanilla DP and FSDP both fail (state too large). Recommendation: Megatron+FSDP or Megatron-DS.
5. **At 7B params, H100, 8192 GPUs:** all stacks fit easily. Recommendation: FSDP (or DP if memory permits at extreme DP rank). Cost very low.
6. **At 1T params, H100, 16384 GPUs:** only Megatron-DS fits. Recommendation: Megatron-DS. Cost in the billions.
7. **GPU type switching:** MI300X (192GB) has more headroom than H100 (80GB) for the same model size — some stacks that "didn't fit" on H100 may fit on MI300X.
8. **Memory bar:** color changes to rose if memory exceeds (and "✗ exceeds" label appears); cyan if fits (and "✓" label).
9. **Recommended card** is highlighted (cyan border + tinted background). Other stacks shown in comparison grid below.
10. **Rationale panel** explains why the recommended stack was chosen — updates with model size changes.
11. **Mobile (< 720px):** metrics grid collapses to 1 column; compare grid to 2 columns.
12. **`npm run typecheck`** passes.
13. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement a true cost calculator with cloud pricing tiers.** Use a single $/GPU-hour rate per GPU type.
- ❌ **Do not implement detailed activation memory accounting.** The 10% heuristic is sufficient.
- ❌ **Do not implement framework-specific feature toggles (ZeRO-Infinity, activation checkpointing, etc.).** The widget is about parallelism choice, not framework tuning.
- ❌ **Do not implement Triton kernel selector.** Out of widget scope.
- ❌ **Do not flip Ch 10's status.** Session 48 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch10/ src/components/widgets/index.ts src/pages/ch10-training-infra/index.mdx
git commit -m "session 47: training stack picker marquee widget — practical parallelism decision support"
git push origin main
```

Verify on production:
- At default (7B, H100, 64): recommendation is FSDP with ~$25K cost
- At 70B + 256 H100s: recommendation switches to Megatron+FSDP
- At 405B + 16K H100s: recommendation is Megatron-DS; cost in $50M+ range
- All four cards always visible; recommended one highlighted

---

## Notes for the session author

**On the memory accounting being simplified:**
Real activation memory depends on sequence length, batch size, hidden dim, attention head count, activation checkpointing strategy, etc. The widget uses a 10%-of-state heuristic. This is rough but consistent — gets the qualitative shape right ("activations are smaller than state"). For pedagogical purposes, more precision would obscure rather than clarify.

**On the MFU estimation being heuristic:**
The MFU estimates are educated guesses based on industry-typical observations:
- Vanilla DP: 50% baseline
- TP overhead: -3% (per-layer all-reduce)
- PP overhead: -5% (pipeline bubble)
- Large DP rank (>512): -5% (network bottleneck)
- Very large (>4096): -5% more
- Coordination overhead for Megatron-DS: -2%

These match published MFU numbers for well-tuned training. Not exact, but pedagogically correct.

**On the recommendation logic:**
"Simplest stack that fits with reasonable headroom" — the widget tries DP first, then FSDP, then Megatron+FSDP, then Megatron-DS. First one with `fits === true` wins. The "headroom" is 90% of GPU memory (10% headroom for unaccounted overhead).

The pedagogical claim: **you should use the simplest parallelism stack that fits**. Adding TP or PP when not needed adds communication overhead without benefit. This is why FSDP dominates for 1B-30B models (no need for TP/PP) and Megatron 3D is reserved for very large models.

**On the GPU type selection:**
MI300X has 2.4× the memory of H100 (192 vs 80 GB). This makes a real difference for memory-constrained workloads — a 405B model might fit on MI300X with 2-way TP but require 8-way TP on H100. The widget reveals this kind of trade-off.

**On the cost estimates:**
Cloud GPU pricing in 2024 (mid-range estimates):
- H100: $5/hour
- A100: $2.5/hour  
- MI300X: $4.5/hour

These are rough averages; spot, reserved, and on-demand prices differ significantly. The widget uses single rates per GPU for simplicity. Real prices vary 2-3× depending on contract.

**On the default state being meaningful:**
The default (7B params, H100, 64 GPUs) was chosen to land *exactly* in FSDP's sweet spot — a real, common configuration for medium-size training runs (LLaMA-2 7B, Llama-3 8B finetuning, etc.). The reader's first view of the widget shows a realistic scenario.

**Pedagogical claim this widget supports:**
"Choosing a parallelism stack is a practical decision driven by memory math. The simplest stack that fits (with headroom) is usually the right choice. As models grow, you progress: DP → FSDP → Megatron+FSDP → Megatron-DeepSpeed. Each step adds complexity *and* communication overhead, so you only step up when memory forces you to."

After 30 seconds of slider play, the reader has internalized: (a) memory math drives stack choice; (b) bigger GPU memory (MI300X) reduces the need for aggressive parallelism; (c) frontier training (405B+) requires every trick in the book.

**This is the chapter's most useful practical tool.** Engineers can literally use this widget to plan their own training runs. The cost estimates, while rough, are within 2-3× of reality — useful for budget planning.

Build with care. This widget is the chapter's centerpiece, but more importantly, it's *useful* — readers will return to it as a reference.
