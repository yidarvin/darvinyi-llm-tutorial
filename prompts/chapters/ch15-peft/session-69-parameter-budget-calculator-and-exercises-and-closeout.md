# Session 69 — Ch 15 parameter budget calculator + exercises + closeout

> **The Chapter 15 closeout.** Three deliverables: (1) implement the **Parameter Budget Calculator** secondary widget — an interactive calculator that takes model size × method × rank × target modules and outputs memory + GPU recommendation; (2) add an **Exercises section** with 4 problems (LoRA forward + zero-init verification, parameter count comparison, LoRA merge equivalence, QLoRA memory budget); (3) flip Ch 15's status from `'draft'` to `'published'`. **Closes Ch 15.** After this session, PEFT is on production. **Phase 11 will be 3/4 done; only Ch 16 (Distillation) remains.**

This is a **single-topic chapter** (4-file cadence). The secondary widget gets combined with exercises in this final session — standard closeout pattern.

---

## Read first (in this order)

1. **`research/ch15-peft/research.md`** — concept 6 (QLoRA) and pedagogical outcomes 2, 3, 4 (LoRA implementation, hyperparameters, QLoRA mechanics)
2. **`prompts/chapters/ch15-peft/session-67-page-structure.md`** — for the section-6 widget placeholder and exercise placement
3. **`prompts/chapters/ch15-peft/session-68-lora-architecture-widget.md`** — for the Ch 15 widget conventions (data-layer helpers, controls pattern, stats table)
4. **`prompts/chapters/ch11-moe/session-52-active-vs-total-params-and-exercises.md`** — for the secondary-widget + exercises + closeout template (the 4-file cadence closeout pattern)
5. **`prompts/chapters/ch13-sft/session-61-chat-template-comparison-exercises-and-closeout.md`** — for the recent Phase 11 closeout pattern

---

## Goal

By end of session, three things change in the repo:

1. **`ParameterBudgetCalculator` widget** is implemented and wired into section 6 of Ch 15. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("Modern variants") and section 8 ("When to use PEFT"). Four exercises with hints + runnable starter code.
3. **Ch 15's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. Ch 15 is the fifteenth published chapter.

After this session: **Ch 15 is complete.** Phase 11 is 3/4 done; only Ch 16 (Distillation) remains.

---

## Inputs

State of the repo after session 68:

- Section 3's `LoRAArchitecture` marquee widget is wired
- Section 6's widget is still stubbed
- All 3 runnable code blocks from session 67 are in place
- `src/lib/chapters.ts` has Ch 1-14 `'published'`, Ch 15 `'draft'`
- `src/components/widgets/ch15/` exists with one widget already

---

## Deliverables

1. **Create** `src/components/widgets/ch15/ParameterBudgetCalculator.tsx` — the React widget
2. **Create** `src/components/widgets/ch15/ParameterBudgetCalculator.module.css` — scoped styles
3. **Create** `src/components/widgets/ch15/memory-budget-data.ts` — memory computation helpers
4. **Update** `src/components/widgets/index.ts` — add `ParameterBudgetCalculator` export
5. **Update** `src/pages/ch15-peft/index.mdx`:
   - Replace section-6's `<WidgetFrame>` interior with `<ParameterBudgetCalculator client:visible />`
   - Insert new `## Exercises` section between section 7 ("Modern variants") and section 8 ("When to use PEFT")
6. **Update** `src/lib/chapters.ts` — change Ch 15's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 15's marquee widget is sealed.

---

## Detailed spec

### Part A — `ParameterBudgetCalculator` widget

#### A.1 `memory-budget-data.ts`

```ts
// src/components/widgets/ch15/memory-budget-data.ts

export type ModelSizeId = '7b' | '13b' | '70b';
export type MethodId = 'full' | 'lora' | 'qlora';
export type TargetId = 'qv' | 'qkvo' | 'all';

export interface ModelSize {
  id: ModelSizeId;
  label: string;
  totalParams: number;
  d_model: number;
  n_layers: number;
  activationsGB: number;   // rough estimate; varies with batch and seq length
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
  full:  { id: 'full',  label: 'Full FT',     description: 'Train all parameters; BF16 weights + grads + FP32 AdamW state.', baseBytesPerParam: 2, trainsBase: true },
  lora:  { id: 'lora',  label: 'LoRA',        description: 'Freeze base in BF16; train LoRA adapters only.',                  baseBytesPerParam: 2, trainsBase: false },
  qlora: { id: 'qlora', label: 'QLoRA',       description: '4-bit NF4 base + BF16 LoRA adapters.',                              baseBytesPerParam: 0.5, trainsBase: false },
};

export interface Target {
  id: TargetId;
  label: string;
  count: number;
}

export const TARGETS: Record<TargetId, Target> = {
  qv:   { id: 'qv',   label: 'Q + V',          count: 2 },
  qkvo: { id: 'qkvo', label: 'Q, K, V, O',     count: 4 },
  all:  { id: 'all',  label: 'All linear',     count: 6 },
};

export interface MemoryBreakdown {
  /** GB */
  baseWeights: number;
  trainableParams: number;
  gradients: number;
  optimizerState: number;
  activations: number;
  /** Total memory required (GB) */
  total: number;
  /** Trainable parameter count (raw, not GB) */
  trainableCount: number;
  /** Trainable ratio: trainable / base */
  trainableRatio: number;
  /** Adapter size on disk if applicable (MB) */
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

  // Trainable parameter count
  let trainableCount: number;
  if (method.id === 'full') {
    trainableCount = model.totalParams;
  } else {
    // LoRA params: target_count * 2 * d_model * rank per layer * n_layers
    trainableCount = target.count * 2 * model.d_model * rank * model.n_layers;
  }

  // Memory breakdown (GB)
  const baseWeightsBytes = model.totalParams * method.baseBytesPerParam;
  const trainableWeightsBytes = (method.id === 'full' ? 0 : trainableCount * 2);
  const gradientsBytes = trainableCount * 2;   // BF16 gradients
  // Optimizer state: AdamW first + second moments, FP32 (4 bytes * 2 = 8 bytes per trainable param)
  const optimizerBytes = trainableCount * 8;
  const activationsBytes = model.activationsGB * 1e9;

  const totalBytes = baseWeightsBytes + trainableWeightsBytes + gradientsBytes + optimizerBytes + activationsBytes;

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
  { label: 'RTX 4090',        memoryGB: 24 },
  { label: 'A6000',           memoryGB: 48 },
  { label: 'A100 / H100',     memoryGB: 80 },
  { label: '2× A100 80GB',    memoryGB: 160 },
  { label: '4× A100 80GB',    memoryGB: 320 },
  { label: '8× A100 80GB',    memoryGB: 640 },
];

export function formatParams(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n.toFixed(0)}`;
}

export const RANK_OPTIONS = [4, 8, 16, 32, 64];
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 700

┌────────────────────────────────────────────────────────────────┐
│ Configuration                                                    │
│ Model size: [○ 7B] [● 13B] [○ 70B]                              │
│ Method:     [○ Full FT] [● LoRA] [○ QLoRA]                      │
│ Rank:       [○ 4] [○ 8] [● 16] [○ 32] [○ 64]    (LoRA + QLoRA)  │
│ Target:     [○ Q,V] [● Q,K,V,O] [○ all linear]                  │
│                                                                  │
│ Memory breakdown                                                 │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Base weights (BF16):     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 26.0 GB     │  │
│ │ Trainable params (BF16): ░ 0.05 GB                          │  │
│ │ Gradients (BF16):        ░ 0.05 GB                          │  │
│ │ Optimizer state (FP32):  ░ 0.21 GB                          │  │
│ │ Activations (estimated): ▓▓ 4.0 GB                          │  │
│ │                                                              │  │
│ │ TOTAL: ~30.3 GB                                              │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ GPU recommendation                                               │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ ✗ RTX 4090 (24 GB)            does NOT fit                  │  │
│ │ ✓ A6000 (48 GB)               FITS — recommended            │  │
│ │ ✓ A100 / H100 (80 GB)         fits                          │  │
│ │ ✓ 2× A100 80GB (160 GB)       fits                          │  │
│ │ ✓ 4× A100 80GB (320 GB)       fits                          │  │
│ │ ✓ 8× A100 80GB (640 GB)       fits                          │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Trainable parameters: 26.2M (0.20% of base)                     │
│ Adapter file on disk: 52.4 MB (BF16). Tiny enough to email.     │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Selecting any option (model size, method, rank, target) immediately recomputes memory breakdown and GPU recommendation
- Rank and Target controls disabled (visually dimmed) when method = 'full' (LoRA-specific hyperparameters don't apply)
- The horizontal bar segments in the breakdown are sized proportionally to actual GB
- GPU recommendation rows show ✓ (emerald) or ✗ (rose) plus the "recommended" tag on the smallest fitting option

#### A.3 `ParameterBudgetCalculator.tsx`

```tsx
import { useMemo, useState } from 'react';
import {
  MODEL_SIZES, METHODS, TARGETS, RANK_OPTIONS, GPU_OPTIONS,
  computeMemory, formatParams,
  type ModelSizeId, type MethodId, type TargetId,
} from './memory-budget-data';
import styles from './ParameterBudgetCalculator.module.css';

export default function ParameterBudgetCalculator() {
  const [modelId, setModelId] = useState<ModelSizeId>('13b');
  const [methodId, setMethodId] = useState<MethodId>('lora');
  const [rank, setRank] = useState(16);
  const [targetId, setTargetId] = useState<TargetId>('qkvo');

  const memory = useMemo(
    () => computeMemory(modelId, methodId, rank, targetId),
    [modelId, methodId, rank, targetId],
  );

  const isLoRABased = methodId !== 'full';

  // Find the smallest GPU that fits (for "recommended" tag)
  const fittingGPUs = GPU_OPTIONS.filter(g => g.memoryGB >= memory.total);
  const recommendedGPU = fittingGPUs[0];

  return (
    <div className={styles.widget}>
      {/* Configuration */}
      <div className={styles.controlsPanel}>
        <div className={styles.panelTitle}>Configuration</div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Model size:</span>
          <div className={styles.optionButtons}>
            {(['7b', '13b', '70b'] as ModelSizeId[]).map(m => (
              <button
                key={m}
                className={`${styles.optionButton} ${modelId === m ? styles.optionActive : ''}`}
                onClick={() => setModelId(m)}
              >
                {MODEL_SIZES[m].label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Method:</span>
          <div className={styles.optionButtons}>
            {(['full', 'lora', 'qlora'] as MethodId[]).map(m => (
              <button
                key={m}
                className={`${styles.optionButton} ${methodId === m ? styles.optionActive : ''}`}
                onClick={() => setMethodId(m)}
                title={METHODS[m].description}
              >
                {METHODS[m].label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.controlRow} ${!isLoRABased ? styles.disabled : ''}`}>
          <span className={styles.controlLabel}>Rank:</span>
          <div className={styles.optionButtons}>
            {RANK_OPTIONS.map(r => (
              <button
                key={r}
                className={`${styles.optionButton} ${rank === r ? styles.optionActive : ''}`}
                onClick={() => setRank(r)}
                disabled={!isLoRABased}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.controlRow} ${!isLoRABased ? styles.disabled : ''}`}>
          <span className={styles.controlLabel}>Target:</span>
          <div className={styles.optionButtons}>
            {(['qv', 'qkvo', 'all'] as TargetId[]).map(t => (
              <button
                key={t}
                className={`${styles.optionButton} ${targetId === t ? styles.optionActive : ''}`}
                onClick={() => setTargetId(t)}
                disabled={!isLoRABased}
              >
                {TARGETS[t].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Memory breakdown */}
      <div className={styles.breakdownPanel}>
        <div className={styles.panelTitle}>Memory breakdown</div>
        <MemoryBar
          label="Base weights"
          subLabel={methodId === 'qlora' ? '(NF4)' : '(BF16)'}
          value={memory.baseWeights}
          maxValue={memory.total}
          colorClass={styles.barBase}
        />
        {isLoRABased && (
          <MemoryBar
            label="Trainable params"
            subLabel="(BF16)"
            value={memory.trainableParams}
            maxValue={memory.total}
            colorClass={styles.barTrainable}
          />
        )}
        <MemoryBar
          label="Gradients"
          subLabel="(BF16)"
          value={memory.gradients}
          maxValue={memory.total}
          colorClass={styles.barGrad}
        />
        <MemoryBar
          label="Optimizer state"
          subLabel="(FP32, AdamW)"
          value={memory.optimizerState}
          maxValue={memory.total}
          colorClass={styles.barOptim}
        />
        <MemoryBar
          label="Activations"
          subLabel="(estimated)"
          value={memory.activations}
          maxValue={memory.total}
          colorClass={styles.barAct}
        />
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>TOTAL</span>
          <span className={styles.totalValue}>~{memory.total.toFixed(1)} GB</span>
        </div>
      </div>

      {/* GPU recommendation */}
      <div className={styles.gpuPanel}>
        <div className={styles.panelTitle}>GPU recommendation</div>
        {GPU_OPTIONS.map(g => {
          const fits = g.memoryGB >= memory.total;
          const isRecommended = fits && g === recommendedGPU;
          return (
            <div key={g.label} className={`${styles.gpuRow} ${fits ? styles.gpuFits : styles.gpuNoFit}`}>
              <span className={styles.gpuMarker}>{fits ? '✓' : '✗'}</span>
              <span className={styles.gpuLabel}>{g.label}</span>
              <span className={styles.gpuMemory}>({g.memoryGB} GB)</span>
              <span className={styles.gpuStatus}>
                {fits
                  ? (isRecommended ? <strong className={styles.recommendedTag}>FITS — recommended</strong> : 'fits')
                  : 'does NOT fit'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className={styles.summaryPanel}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Trainable parameters:</span>
          <span className={styles.summaryValue}>
            {formatParams(memory.trainableCount)}
            {' '}({(100 * memory.trainableRatio).toFixed(3)}% of base)
          </span>
        </div>
        {isLoRABased && (
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Adapter on disk (BF16):</span>
            <span className={styles.summaryValue}>{memory.adapterDiskMB.toFixed(1)} MB</span>
          </div>
        )}
      </div>

      <div className={styles.caption}>
        {methodId === 'full' && (
          <>Full fine-tuning needs <strong>{memory.total.toFixed(0)} GB</strong> for {MODEL_SIZES[modelId].label}.
          That's {Math.ceil(memory.total / 80)}× A100 80GB minimum. <strong>Most teams can't afford this.</strong></>
        )}
        {methodId === 'lora' && (
          <>LoRA fits {MODEL_SIZES[modelId].label} into <strong>{memory.total.toFixed(0)} GB</strong>.
          {recommendedGPU && <> Fits on a single <strong>{recommendedGPU.label}</strong>.</>}
          {' '}Adapter is {memory.adapterDiskMB.toFixed(0)} MB — easy to store and swap.</>
        )}
        {methodId === 'qlora' && (
          <>QLoRA (NF4 base) fits {MODEL_SIZES[modelId].label} into <strong>{memory.total.toFixed(0)} GB</strong>.
          {recommendedGPU && <> Fits on a single <strong>{recommendedGPU.label}</strong>.</>}
          {' '}<strong>This is what made open-source post-training accessible.</strong></>
        )}
      </div>
    </div>
  );
}

function MemoryBar({
  label, subLabel, value, maxValue, colorClass,
}: { label: string; subLabel?: string; value: number; maxValue: number; colorClass: string }) {
  const widthPct = Math.max(0.5, (value / maxValue) * 100);
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>
        {label}{subLabel && <span className={styles.barSubLabel}> {subLabel}</span>}
      </span>
      <div className={styles.barTrack}>
        <div className={`${styles.barFill} ${colorClass}`} style={{ width: `${widthPct}%` }} />
      </div>
      <span className={styles.barValue}>{value.toFixed(2)} GB</span>
    </div>
  );
}
```

#### A.4 `ParameterBudgetCalculator.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.controlsPanel, .breakdownPanel, .gpuPanel, .summaryPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.6rem;
  font-weight: 500;
}

.controlRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.controlRow:last-child { margin-bottom: 0; }
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  min-width: 90px;
}
.disabled { opacity: 0.4; }
.disabled .controlLabel { color: var(--text-tertiary); }

.optionButtons { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.optionButton {
  padding: 0.3rem 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.optionButton:hover:not(:disabled) { border-color: var(--border-strong); color: var(--text-primary); }
.optionButton:disabled { cursor: not-allowed; }
.optionActive {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  background: color-mix(in srgb, var(--cyan-500) 6%, transparent);
  font-weight: 500;
}

/* Memory bars */
.barRow {
  display: grid;
  grid-template-columns: 180px 1fr 80px;
  gap: 0.7rem;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  padding: 0.3rem 0;
}
.barLabel { color: var(--text-secondary); }
.barSubLabel { color: var(--text-tertiary); font-size: 0.7rem; }
.barTrack {
  height: 14px;
  background: var(--bg-primary);
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}
.barFill {
  height: 100%;
  transition: width 200ms;
}
.barValue { color: var(--text-primary); text-align: right; }

.barBase      { background: linear-gradient(90deg, var(--cyan-700), var(--cyan-500)); }
.barTrainable { background: linear-gradient(90deg, var(--emerald-700), var(--emerald-400)); }
.barGrad      { background: linear-gradient(90deg, var(--amber-700), var(--amber-400)); }
.barOptim     { background: linear-gradient(90deg, var(--violet-700), var(--violet-400)); }
.barAct       { background: linear-gradient(90deg, var(--rose-700), var(--rose-400)); }

.totalRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 0.7rem;
  padding-top: 0.6rem;
  border-top: 2px solid var(--border-default);
  font-family: 'JetBrains Mono', monospace;
}
.totalLabel { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; letter-spacing: 0.05em; }
.totalValue { font-size: 1.1rem; color: var(--cyan-300); font-weight: 500; }

/* GPU options */
.gpuRow {
  display: grid;
  grid-template-columns: 24px 1fr 80px 1fr;
  gap: 0.5rem;
  align-items: baseline;
  padding: 0.3rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.gpuMarker { font-size: 0.9rem; font-weight: 600; }
.gpuLabel { color: var(--text-primary); }
.gpuMemory { color: var(--text-tertiary); font-size: 0.72rem; }
.gpuStatus { color: var(--text-secondary); }
.gpuFits .gpuMarker { color: var(--emerald-400); }
.gpuNoFit .gpuMarker { color: var(--rose-400); }
.gpuNoFit .gpuLabel, .gpuNoFit .gpuStatus { color: var(--text-tertiary); }
.recommendedTag { color: var(--emerald-400); font-weight: 500; }

/* Summary */
.summaryRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.25rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.summaryLabel { color: var(--text-secondary); }
.summaryValue { color: var(--text-primary); font-weight: 500; }

.caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .controlRow { flex-direction: column; align-items: flex-start; }
  .controlLabel { min-width: 0; }
  .barRow { grid-template-columns: 130px 1fr 65px; gap: 0.4rem; font-size: 0.72rem; }
  .gpuRow { grid-template-columns: 20px 1fr 60px 1fr; gap: 0.3rem; font-size: 0.72rem; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as LoRAArchitecture } from './ch15/LoRAArchitecture';
export { default as ParameterBudgetCalculator } from './ch15/ParameterBudgetCalculator';
```

#### A.6 Update `src/pages/ch15-peft/index.mdx`

**Edit A: Add widget import:**

```mdx
import { LoRAArchitecture, ParameterBudgetCalculator } from '@components/widgets';
```

**Edit B: Replace section-6's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Parameter budget calculator" caption="Interactive calculator. Pick model size (7B / 13B / 70B), method (full FT / LoRA / QLoRA), rank, and target modules. See memory breakdown (base weights / trainable / gradients / optimizer / activations) and a per-GPU 'fits/does not fit' assessment with a recommended option. The calculator makes the operational story tangible: full FT of 70B needs 8× A100s; QLoRA of 70B fits on a single A6000.">
  <ParameterBudgetCalculator client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("Modern variants") and section 8 ("When to use PEFT"). Use this structure:

````mdx
## Exercises

Four exercises that build on the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — LoRA forward pass + zero-init

Implement the LoRA forward pass and verify that with proper zero-initialization of $B$, the LoRA contribution is exactly zero at step 0 — the model behaves identically to the base model.

<details>
<summary>Hint</summary>

The LoRA forward pass is:
$$h = W_0 x + \frac{\alpha}{r} B A x$$

At step 0, with $A \sim \mathcal{N}(0, \sigma^2)$ Gaussian and $B = \mathbf{0}$:
- $BA = 0$
- $\Delta W = (\alpha/r) BA = 0$
- $h = W_0 x$ (identical to base)

After "training" (simulated by replacing $B$ with non-zero values), the contribution becomes non-zero.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def lora_forward(x, W_base, A, B, alpha=16, r=8):
    """
    LoRA forward pass.
    
    x:      (batch, d_in) — input
    W_base: (d_in, d_out) — FROZEN base weight
    A:      (r, d_in) — TRAINABLE down-projection
    B:      (d_out, r) — TRAINABLE up-projection
    alpha:  scaling factor
    r:      rank
    """
    # TODO: implement
    pass

# Setup
np.random.seed(0)
d_in, d_out, r = 512, 768, 8
batch = 4

W_base = np.random.normal(0, 0.02, (d_in, d_out))

# Proper LoRA initialization:
A = np.random.normal(0, 0.01, (r, d_in))   # Gaussian for A
B = np.zeros((d_out, r))                     # ZERO for B

x = np.random.normal(0, 1, (batch, d_in))

# TODO: verify that LoRA output equals base output at step 0
# out_lora_step0 = lora_forward(x, W_base, A, B)
# out_base = x @ W_base
# print(f"At step 0: LoRA == base? {np.allclose(out_lora_step0, out_base)}")
# print(f"(This is why we zero-init B. Without it, the first forward pass would inject random noise.)")

# Now simulate post-training: B becomes non-zero
# B_trained = np.random.normal(0, 0.01, (d_out, r))
# out_lora_trained = lora_forward(x, W_base, A, B_trained)
# print(f"\\nAfter training: LoRA != base? {not np.allclose(out_lora_trained, out_base)}")
# print(f"  Difference: max={np.abs(out_lora_trained - out_base).max():.4f}")
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Parameter count across configs

Compute trainable parameter counts for LoRA across multiple model sizes (7B, 13B, 70B), ranks (4, 8, 16, 32, 64), and target modules (Q+V / Q,K,V,O / all linear). Print a table and observe how the ratio (trainable / base) stays consistently small.

<details>
<summary>Hint</summary>

LoRA trainable param count formula:
$$\text{trainable} = (\text{target modules per layer}) \times 2 \times d_{\text{model}} \times \text{rank} \times \text{layers}$$

Model size specs:
- 7B:  d_model=4096, layers=32, total ≈ 7B
- 13B: d_model=5120, layers=40, total ≈ 13B
- 70B: d_model=8192, layers=80, total ≈ 70B

Target counts:
- Q+V:        2 matrices per layer
- Q,K,V,O:    4 matrices per layer
- All linear: 6 matrices per layer (attention + FFN gates)

Build a nested loop and print results in a tidy table.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

MODELS = {
    "7B":  {"d_model": 4096, "n_layers": 32, "total": 7e9},
    "13B": {"d_model": 5120, "n_layers": 40, "total": 13e9},
    "70B": {"d_model": 8192, "n_layers": 80, "total": 70e9},
}

TARGETS = {
    "Q+V":        2,
    "Q,K,V,O":    4,
    "all linear": 6,
}

def lora_params(d_model, n_layers, rank, targets_per_layer):
    """Compute LoRA trainable parameter count."""
    # TODO: return the trainable count
    pass

# Table header
# print(f"{'Model':<6} {'Target':<12} {'Rank':<6} {'Trainable':<12} {'% of base':<10}")
# print("-" * 50)
# for model_name, spec in MODELS.items():
#     for target_name, target_count in TARGETS.items():
#         for rank in [4, 8, 16, 32, 64]:
#             count = lora_params(spec["d_model"], spec["n_layers"], rank, target_count)
#             pct = 100 * count / spec["total"]
#             print(f"{model_name:<6} {target_name:<12} r={rank:<4} {count/1e6:>6.1f}M {pct:>8.3f}%")
#     print()

# After running, observe:
# 1. The ratio (trainable / base) is consistently <1% across all configs
# 2. Rank scales the count linearly
# 3. More target modules scale the count linearly (2 → 4 → 6 matrices)
# 4. Larger models have larger d_model AND more layers, so trainable scales faster than total
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — LoRA merge equivalence

Verify that merging LoRA into the base weights produces *exactly* the same output as keeping them separate in adapter-mode. This is what enables zero-overhead inference.

<details>
<summary>Hint</summary>

The merged weight is:
$$W_{\text{merged}} = W_0 + \frac{\alpha}{r} B A$$

Both forward modes should produce identical outputs (up to floating-point precision):
1. **Adapter mode**: $h = W_0 x + (\alpha/r) B A x$
2. **Merged mode**: $h = W_{\text{merged}} x$

Test with batch of random inputs and check that the difference is zero (within FP32 precision, say < 1e-5).

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def lora_forward_adapter(x, W_base, A, B, alpha=16, r=8):
    """Adapter-mode forward pass (LoRA kept separate)."""
    return x @ W_base + x @ A.T @ B.T * (alpha / r)

def lora_merge(W_base, A, B, alpha=16, r=8):
    """Merge LoRA into base weights for zero-overhead inference."""
    # TODO: compute W_merged
    pass

def lora_forward_merged(x, W_merged):
    """Merged-mode forward pass."""
    # TODO: just a matmul
    pass

# Setup
np.random.seed(2)
d_in, d_out, r = 256, 256, 16
W_base = np.random.normal(0, 0.02, (d_in, d_out))
A = np.random.normal(0, 0.01, (r, d_in))
B = np.random.normal(0, 0.01, (d_out, r))   # Non-zero (post-training)

x = np.random.normal(0, 1, (8, d_in))

# Run both modes and compare
# out_adapter = lora_forward_adapter(x, W_base, A, B)
# W_merged = lora_merge(W_base, A, B)
# out_merged = lora_forward_merged(x, W_merged)
# 
# max_diff = np.abs(out_adapter - out_merged).max()
# print(f"Max difference between adapter and merged: {max_diff:.2e}")
# print(f"Within FP32 precision? {max_diff < 1e-5}")
# 
# # Performance hint: adapter-mode requires 3 matmuls; merged requires 1
# print(f"\\nAdapter mode: 3 matrix multiplications (x@W, x@A.T, ...@B.T)")
# print(f"Merged mode:  1 matrix multiplication (x@W_merged)")
# print(f"At inference, prefer merged. At training, you can't merge (need separate grads).")
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — QLoRA memory budget for 70B

Compute the full memory budget for QLoRA fine-tuning of a 70B-parameter model. Break down the components (NF4 base, BF16 LoRA, gradients, optimizer state, activations) and identify which GPUs the budget fits on.

<details>
<summary>Hint</summary>

Memory components for QLoRA fine-tuning of 70B:

1. **NF4 base**: 4 bits per parameter = 0.5 bytes per parameter.
   - 70B × 0.5 = 35 GB
2. **LoRA adapters (BF16)**: depends on rank and target count.
   - Per layer (Q,K,V,O at r=16): $4 \times 2 \times 8192 \times 16 \approx 1M$ params
   - 80 layers: $\approx 84M$ params total
   - In BF16: $84M \times 2 = 168 MB \approx 0.17 GB$
3. **Gradients (BF16)**: same shape as LoRA adapters.
   - 0.17 GB
4. **Optimizer state (FP32 AdamW, 2 moments)**: 8 bytes per LoRA param.
   - 84M × 8 = 672 MB ≈ 0.67 GB
5. **Activations (estimated)**: ~8 GB for 70B at reasonable batch sizes (varies with batch and seq length).

Sum these. Then check against GPU memory limits: 24 (RTX 4090), 48 (A6000), 80 (A100 / H100), 160 (2× A100), etc.

</details>

<RunnableCode
  client:visible
  defaultCode={`def qlora_memory_70b(rank=16, target_count=4, d_model=8192, n_layers=80, activations_gb=8):
    """Memory breakdown for QLoRA fine-tuning of 70B."""
    total_params = 70e9
    
    # TODO: compute each component (in GB)
    # base_nf4 = ?
    # lora_count = ?  (number of trainable LoRA parameters)
    # lora_bf16 = ?
    # gradients_bf16 = ?
    # optimizer_fp32 = ?  (AdamW: 2 moments * 4 bytes = 8 bytes per trainable param)
    # 
    # Print each component and the total
    pass

# Compute for default QLoRA config
# qlora_memory_70b()

# Then check which GPUs fit
GPU_OPTIONS = [
    ("RTX 4090",     24),
    ("A6000",        48),
    ("A100 / H100",  80),
    ("2× A100 80GB", 160),
    ("4× A100 80GB", 320),
]
# total = ...  # from your computation
# print(f"\\nGPU fit check (total = {total:.1f} GB):")
# for label, mem in GPU_OPTIONS:
#     fits = mem >= total
#     marker = "✓ FITS" if fits else "✗ does not fit"
#     print(f"  {marker:<14} {label:<15} ({mem} GB)")
`}
  packages={[]}
/>
````

### Part C — Flip Ch 15's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 15, slug: 'ch15-peft', title: 'Parameter-Efficient Fine-Tuning (PEFT)', partNum: 5, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 15 still render correctly (no changes to existing sections).
3. **Section 3's** `LoRAArchitecture` marquee widget still renders correctly.
4. **Section 6** now renders the working `ParameterBudgetCalculator` widget.
5. **Default state (calculator)**: model=13B, method=LoRA, rank=16, target=Q,K,V,O. Memory shows ~30 GB total. Recommended GPU: A6000.
6. **Selecting Full FT**: Rank and Target controls dim (disabled). Memory jumps to ~150+ GB for 13B. Recommended GPU: 2× A100.
7. **Selecting QLoRA**: base weights bar shrinks to 25% (NF4 = 0.5 bytes/param). Memory drops significantly. For 70B QLoRA: fits on A6000.
8. **Memory bars** sized proportionally to actual GB values; total row shows cyan-highlighted total.
9. **GPU recommendations**: 6 rows from RTX 4090 (24 GB) up to 8× A100 (640 GB). ✓ in emerald for fitting; ✗ in rose for not fitting. "FITS — recommended" tag on the smallest fitting GPU.
10. **Caption text** changes based on method:
    - Full FT: "X× A100 80GB minimum"
    - LoRA: "fits on a single [GPU]"
    - QLoRA: "fits on a single [GPU]. This is what made open-source post-training accessible."
11. **New "## Exercises" section** is between section 7 ("Modern variants") and section 8 ("When to use PEFT"). Contains 4 sub-exercises with collapsible hints and runnable starter code.
12. **Section 8** ("When to use PEFT") still renders correctly after the insert.
13. **Sidebar:** Ch 1-15 all active (published); Ch 16-30 still dimmed.
14. **Prev/next at bottom of Ch 15:** prev = Ch 14 (active); next = Ch 16 (disabled).
15. **TOC on Ch 15** includes Exercises as h2 between section 7 and section 8, plus 4 h3 sub-entries.
16. **Exercise starter code** runs (placeholders return `None`/`pass`; reader can fill in).
17. **Mobile:** controls stack; bars rescale; GPU rows compact.
18. **`npm run typecheck`** passes.
19. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 15 flips.
- ❌ **Do not modify Ch 1-14.** Sealed.
- ❌ **Do not modify Ch 15's marquee widget.** Sealed.
- ❌ **Do not modify Ch 15 prose sections 1-8.** Sealed. (Only insert the new Exercises section between sections 7 and 8.)
- ❌ **Do not implement actual LoRA training in an exercise.** Hands-on numpy demos only.

---

## Wire-up

```bash
git add src/components/widgets/ch15/ParameterBudgetCalculator.tsx src/components/widgets/ch15/ParameterBudgetCalculator.module.css src/components/widgets/ch15/memory-budget-data.ts src/components/widgets/index.ts src/pages/ch15-peft/index.mdx src/lib/chapters.ts
git commit -m "session 69: Ch 15 parameter budget calculator + exercises + status: published — Phase 11 is 3/4 done"
git push origin main
```

---

## Ch 15 closeout — Phase 11 nearly complete

Chapter 15 is now the fifteenth complete chapter on production. **Phase 11 is 3/4 done** — only Ch 16 (Distillation) remains.

Confirm before declaring Ch 15 done:

- ✅ BUILD_ORDER.md shows files 88-91 ✅
- ✅ File 92 marked ⏭️ (absorbed)
- ✅ Ch 15 status is `'published'`
- ✅ Both Ch 15 widgets work in production
- ✅ All 4 Ch 15 exercises render with their starter code

**Cadence check across 15 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual | 2 | 4 |
| Ch 5 | Two-topic | 2 | 5 |
| Ch 6 | Variants | 2 | 4 |
| Ch 7 | Data engineering | 2 | 4 |
| Ch 8 | Two-topic | 2 | 5 |
| Ch 9 | Two-topic | 2 | 5 |
| Ch 10 | Engineering | 2 | 4 |
| Ch 11 | Architectural variant | 2 | 4 |
| Ch 12 | Architectural variant | 2 | 4 |
| Ch 13 | Practical engineering | 2 | 4 |
| Ch 14 | Two-topic (RLHF + DPO/RLVR) | 2 | 5 |
| Ch 15 | Practical engineering | 2 | 4 |

**4-file cadence holds for 10 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, **15**).
**5-file cadence holds for 5 two-topic chapters** (Ch 1, 5, 8, 9, 14).

**15-chapter pattern stable.**

**Phase 11 (Post-training) status:**
- ✅ Ch 13 (Supervised Fine-Tuning)
- ✅ Ch 14 (Preference Optimization: RLHF, DPO, RLVR)
- ✅ Ch 15 (Parameter-Efficient Fine-Tuning)
- ⬜ Ch 16 (Distillation) — next, single-topic, 4-file

**What's next — Ch 16: Distillation.** Where Ch 13-15 covered post-training (teaching the model the right behaviors), Ch 16 covers compression: how to take a fully-trained model and produce a smaller one with similar capabilities. Soft-label distillation, hard-label distillation, structured pruning + distillation, and modern recipes (DistilBERT, Phi, Gemma distilled variants).

**Phase 12 (Inference) is on the horizon** after Ch 16 closes. Five chapters of post-training → five chapters of efficient inference and serving.

---

## Notes for the session author

**On combining the secondary widget with exercises in one session:**
For single-topic chapters (4-file cadence), the closeout file is the "everything else" file: secondary widget + exercises + status flip. This is the established pattern (Ch 2-4, 6-7, 10-13). **Longer than the marquee session** because three deliverables. Aim for ~1000-1100 lines total.

**On the parameter budget calculator being decision-support:**
This widget is *operational*, not pedagogical. Readers come to it asking "can I fine-tune X with method Y on my GPU?" The calculator answers in seconds. The horizontal memory bars give the *intuition* (base weights dominate everything else); the GPU recommendations give the *answer*. **Tool, not tutorial.**

**On the QLoRA dramatic effect:**
When the user selects QLoRA, the base-weights bar shrinks visibly (75% smaller — 0.5 vs 2 bytes/param). This is the **visual punchline of QLoRA**: the dominant cost is dramatically reduced. Combined with the GPU recommendation jumping from "8× A100" (Full 70B) to "A6000" (QLoRA 70B), the calculator makes QLoRA's democratizing claim numerically obvious.

**On the four exercises' progression:**
- **Ex 1 (easy) — LoRA forward + zero-init**: implements the central LoRA mechanic; verifies zero-init at step 0. Locks in section 3.
- **Ex 2 (medium) — Parameter count across configs**: builds a table of trainable counts across 7B/13B/70B × 5 ranks × 3 targets. Sees that the ratio stays consistently <1%. Locks in section 4.
- **Ex 3 (medium) — LoRA merge equivalence**: implements adapter-mode and merged-mode forward; verifies they're numerically identical. Locks in section 3's merging discussion.
- **Ex 4 (hard) — QLoRA memory budget for 70B**: computes memory components in detail; checks against GPU options. Locks in section 6.

Difficulty: easy → medium → medium → hard. Standard progression.

**On the exercises serving the 7 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Low-rank hypothesis | (chapter prose) |
| 2. LoRA forward + merging | Ex 1, Ex 3 |
| 3. Hyperparameter selection | Ex 2 |
| 4. QLoRA recipe + memory | Ex 4 |
| 5. PEFT comparison | (chapter prose) |
| 6. DoRA / variants | (chapter prose) |
| 7. PEFT vs full FT decision | (calculator widget) |

Outcomes 2, 3, 4 served by exercises directly. Outcomes 1, 5, 6 served by chapter prose. Outcome 7 served by the calculator widget itself.

**On the LoRA forward exercise (Ex 1) being easy:**
The exercise is more about *verification* than implementation. The function body is one line: `return x @ W_base + x @ A.T @ B.T * (alpha / r)`. The pedagogical work is in *running it twice* (with B=0 and with B nonzero) and observing what changes. Reader internalizes: "B=0 makes LoRA invisible at step 0."

**On the QLoRA memory exercise (Ex 4) being hard:**
This is the chapter's most demanding exercise. Reader has to:
1. Compute NF4 base size (70B × 0.5 = 35 GB)
2. Compute LoRA param count (4 × 2 × 8192 × 16 × 80 ≈ 84M params)
3. Convert to bytes (BF16, FP32 for optimizer)
4. Sum all components
5. Compare to GPU memory budgets

Five steps, lots of arithmetic. **But every step is concrete.** Reader walks away with a tool for budgeting their own QLoRA runs.

**Pedagogical claim of the chapter (revisited):**
"Parameter-efficient fine-tuning is the engineering that makes Phase 11's methods practical at scale. LoRA decomposes the fine-tuning update into a low-rank product BA, training only ~0.1-1% of parameters. QLoRA combines LoRA with 4-bit NF4 quantization, fitting 70B fine-tuning on a single 48 GB GPU. The chapter's exercises lock in the mechanics (Ex 1, Ex 3), the parameter counting (Ex 2), and the memory budget math (Ex 4)."

**Phase 11 progress after this session**: Ch 13 ✅, Ch 14 ✅, Ch 15 ✅. **Only Ch 16 (Distillation) remains in Phase 11.** Single-topic; 4-file cadence; pace through it.

**This chapter is the operational counterpart to Ch 13-14.** Ch 13-14 gave the reader algorithms; Ch 15 gave them the engineering. After Ch 15 + Ch 16, the reader has the full post-training toolkit. **Phase 12 (Inference) opens after that.**

Build with care.
