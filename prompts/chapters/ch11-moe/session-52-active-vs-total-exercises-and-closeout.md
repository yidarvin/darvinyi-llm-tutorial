# Session 52 — Active vs Total Params widget + Ch 11 exercises + closeout

> The Chapter 11 grand closeout. Three deliverables in one session: the **Active vs Total Parameters** secondary widget (bar chart comparing real models — Llama-2 family vs Mixtral variants vs DeepSeek-V2/V3 — plus a custom MoE configurator), an **Exercises section** with 4 problems (MoE forward pass, parameter counting, auxiliary loss, expert capacity simulation), and the **status flip** from `'draft'` to `'published'`. **Closes Ch 11. Phase 10 needs only Ch 12 (Mamba) to close.**

---

## Read first (in this order)

1. **`research/ch11-moe/research.md`** — pedagogical outcomes 1-4 (forward pass, parameter math, load balancing) are the exercises' focus; the reference-implementations section has working code that adapts directly
2. **`prompts/chapters/ch11-moe/session-50-page-structure.md`** — for the section-6 widget placeholder and the structure of `index.mdx`
3. **`prompts/chapters/ch11-moe/session-51-moe-routing-visualizer-widget.md`** — for the Ch 11 widget conventions established by the marquee
4. **`prompts/chapters/ch10-training-infra/session-48-step-timeline-exercises-and-closeout.md`** — for the closeout template (Ch 10's closeout established the combined-widget + exercises + status-flip pattern)

---

## Goal

By end of session, three things change in the repo:

1. **`<ActiveVsTotalParams />`** widget replaces the section-6 `<WidgetFrame>` placeholder. The widget shows a horizontal bar chart of real models (Llama-2 7B, 13B, 70B; Llama-3 405B; Mixtral 8x7B, 8x22B; DeepSeek-V2, V3) with total params + active params overlaid. Plus a custom MoE configurator (sliders for $N$ experts, top-$k$, layer count, $d_{\text{model}}$) that adds a custom bar to the chart.
2. **An "Exercises" section** is appended to `index.mdx`, between section 8 ("What we've covered — and what's next") and the final chapter close paragraph. Four exercises with hints + runnable starter code.
3. **Ch 11's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. Ch 11 is the eleventh published chapter.

After this session: **Ch 11 is complete.** Phase 10 needs only Ch 12 (Mamba / state-space models) to complete the alternative architectures arc.

---

## Inputs

State of the repo after session 51:

- Section 3's `MoERoutingVisualizer` marquee widget is wired
- Section 6's widget is still stubbed
- All 3 runnable code blocks from session 50 are in place
- `src/lib/chapters.ts` has Ch 1-10 `'published'`, Ch 11 `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch11/ActiveVsTotalParams.tsx` — the React widget
2. **Create** `src/components/widgets/ch11/ActiveVsTotalParams.module.css` — scoped styles
3. **Create** `src/components/widgets/ch11/model-data.ts` — real model specs + parameter calculation helpers
4. **Update** `src/components/widgets/index.ts` — add `ActiveVsTotalParams` export
5. **Update** `src/pages/ch11-moe/index.mdx`:
   - Replace section-6's `<WidgetFrame>` interior with `<ActiveVsTotalParams client:visible />`
   - Add new `## Exercises` section between section 8 and the final chapter close paragraph
6. **Update** `src/lib/chapters.ts` — change Ch 11's `status` from `'draft'` to `'published'`

---

## Detailed spec

### Part A — Active vs Total Parameters widget

#### A1. `model-data.ts` — real model specs

```ts
// src/components/widgets/ch11/model-data.ts

export type ModelType = 'dense' | 'moe';

export interface ModelSpec {
  key: string;
  label: string;
  type: ModelType;
  totalParams: number;   // raw count (e.g., 70e9)
  activeParams: number;  // = totalParams for dense
  note?: string;
  releaseYear: number;
}

/**
 * Real model specs. Numbers verified against public technical reports / papers.
 * Order: by total parameter count.
 */
export const REAL_MODELS: ModelSpec[] = [
  // Dense Llama-2 family
  { key: 'llama2_7b',     label: 'Llama-2 7B',      type: 'dense', totalParams: 6.74e9,  activeParams: 6.74e9,  releaseYear: 2023 },
  { key: 'llama2_13b',    label: 'Llama-2 13B',     type: 'dense', totalParams: 13.0e9,  activeParams: 13.0e9,  releaseYear: 2023 },

  // Mixtral 8x7B — the open-weights MoE breakthrough
  { key: 'mixtral_8x7b',  label: 'Mixtral 8x7B',    type: 'moe',   totalParams: 46.7e9,  activeParams: 12.9e9,  note: '8 experts, top-2', releaseYear: 2024 },

  // Dense Llama-2 70B (the comparison Mixtral targets)
  { key: 'llama2_70b',    label: 'Llama-2 70B',     type: 'dense', totalParams: 69.0e9,  activeParams: 69.0e9,  releaseYear: 2023 },

  // Mixtral 8x22B — larger Mixtral
  { key: 'mixtral_8x22b', label: 'Mixtral 8x22B',   type: 'moe',   totalParams: 141e9,   activeParams: 39e9,    note: '8 experts, top-2', releaseYear: 2024 },

  // DeepSeek-V2 — fine-grained MoE
  { key: 'deepseek_v2',   label: 'DeepSeek-V2',     type: 'moe',   totalParams: 236e9,   activeParams: 21e9,    note: '160 experts, 6 active', releaseYear: 2024 },

  // Llama-3 405B — dense frontier
  { key: 'llama3_405b',   label: 'Llama-3 405B',    type: 'dense', totalParams: 405e9,   activeParams: 405e9,   releaseYear: 2024 },

  // DeepSeek-V3 — current open-weights MoE frontier
  { key: 'deepseek_v3',   label: 'DeepSeek-V3',     type: 'moe',   totalParams: 671e9,   activeParams: 37e9,    note: '256 experts, 8 active + 1 shared', releaseYear: 2024 },
];

/** Format numbers compactly: 7e9 → "7.0B" */
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

/**
 * Compute total and active parameters for a custom MoE transformer.
 * Approximate accounting: attention + LN + experts + router + embeddings.
 */
export function computeCustomMoEParams(config: CustomMoEConfig): { total: number; active: number } {
  const { numExperts, topK, numLayers, dModel, dFFN } = config;

  // Per-layer attention: 4 * d^2 (Q, K, V, O)
  const attnParams = 4 * dModel * dModel;
  // LayerNorms: 4 * d_model per block
  const lnParams = 4 * dModel;
  // Per-expert FFN: 2 * d_model * d_ffn
  const ffnPerExpert = 2 * dModel * dFFN;
  // Router: num_experts * d_model
  const routerParams = numExperts * dModel;

  // Per-layer total (all experts)
  const layerTotal = attnParams + lnParams + numExperts * ffnPerExpert + routerParams;
  // Per-layer active (top-k experts only)
  const layerActive = attnParams + lnParams + topK * ffnPerExpert + routerParams;

  // Across all layers
  const layersTotal = numLayers * layerTotal;
  const layersActive = numLayers * layerActive;

  // Embeddings (estimated vocab=128K, tied embedding/output → 2 * vocab * d_model)
  const vocabSize = 128_000;
  const embeddingParams = 2 * vocabSize * dModel;

  return {
    total: layersTotal + embeddingParams,
    active: layersActive + embeddingParams,
  };
}

/** Default custom config: Mixtral 8x7B-ish */
export const DEFAULT_CUSTOM_CONFIG: CustomMoEConfig = {
  numExperts: 8,
  topK: 2,
  numLayers: 32,
  dModel: 4096,
  dFFN: 14336,
};
```

#### A2. Visual layout

```
ViewBox: 0 0 800 760

┌──────────────────────────────────────────────────────────────────┐
│ Comparing dense vs MoE models                                     │
│                                                                    │
│ Llama-2 7B (dense)    │█│ 6.7B                                    │
│ Llama-2 13B (dense)   │██│ 13.0B                                  │
│ Mixtral 8x7B (MoE)    │░░░░░██│ 46.7B total / 12.9B active        │
│ Llama-2 70B (dense)   │█████████│ 69.0B                            │
│ Mixtral 8x22B (MoE)   │░░░░░░░░░░░░░░██████│ 141B / 39B active    │
│ DeepSeek-V2 (MoE)     │░░░░░░░░░░░░░░░░░░░░░░░██│ 236B / 21B      │
│ Llama-3 405B (dense)  │█████████████████████████████████████████│  │
│                       │ 405B                                       │
│ DeepSeek-V3 (MoE)     │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██│       │
│                       │ 671B / 37B active                          │
│                                                                    │
│ Custom config: │░░░░░██│ ~46.7B / ~12.9B active                   │
│                                                                    │
│ Legend: ░ inactive (memory cost)   █ active (compute cost)        │
│                                                                    │
│ Custom MoE configuration:                                          │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ N experts:  [────●────] 8     Top-k:  [○ 1] [● 2] [○ 4]    │   │
│ │ Layers:     [────●────] 32    d_model: [────●────] 4096    │   │
│ │                                                             │   │
│ │ Total params:    46.7B                                      │   │
│ │ Active params:   12.9B                                      │   │
│ │ Sparsity:        28%                                        │   │
│ │ Memory (BF16):   93 GB                                      │   │
│ │ Compute/token:   77 GFLOPs                                  │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ Takeaway: Mixtral 8x7B's active params (12.9B) is between Llama-2 │
│ 13B and 70B — but with the parameter capacity of a 46.7B model.   │
└──────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Adjust any custom MoE slider → custom config bar updates in real-time; total / active / sparsity numbers update
- Hover any model bar → tooltip shows model details (total, active, sparsity, year)
- The custom bar is always visible at the bottom of the chart (visually distinct — dashed border)
- Toggle button: "Sort by total" / "Sort by active" — switches the chart's sort order to emphasize different perspectives

#### A3. `ActiveVsTotalParams.tsx`

```tsx
import { useMemo, useState } from 'react';
import {
  REAL_MODELS, formatParams, computeCustomMoEParams, DEFAULT_CUSTOM_CONFIG, type CustomMoEConfig,
} from './model-data';
import styles from './ActiveVsTotalParams.module.css';

type SortMode = 'total' | 'active';

export default function ActiveVsTotalParams() {
  const [custom, setCustom] = useState<CustomMoEConfig>(DEFAULT_CUSTOM_CONFIG);
  const [sortMode, setSortMode] = useState<SortMode>('total');

  const customResult = useMemo(() => computeCustomMoEParams(custom), [custom]);

  // Sort models per current mode
  const sortedModels = useMemo(() => {
    return [...REAL_MODELS].sort((a, b) => {
      if (sortMode === 'total') return a.totalParams - b.totalParams;
      return a.activeParams - b.activeParams;
    });
  }, [sortMode]);

  // Scale: max total param in dataset (Llama-3 405B or DeepSeek-V3) for x-axis
  const maxParams = Math.max(
    ...REAL_MODELS.map(m => m.totalParams),
    customResult.total,
  );

  return (
    <div className={styles.widget}>
      {/* Sort toggle */}
      <div className={styles.sortToggle}>
        <span className={styles.sortLabel}>Sort by:</span>
        <button
          className={`${styles.sortButton} ${sortMode === 'total' ? styles.sortButtonActive : ''}`}
          onClick={() => setSortMode('total')}
        >Total params</button>
        <button
          className={`${styles.sortButton} ${sortMode === 'active' ? styles.sortButtonActive : ''}`}
          onClick={() => setSortMode('active')}
        >Active params</button>
      </div>

      {/* Bar chart */}
      <div className={styles.chartPanel}>
        {sortedModels.map(m => (
          <ModelBar key={m.key} model={m} maxParams={maxParams} />
        ))}

        {/* Custom config bar */}
        <div className={styles.customSeparator}>Your custom MoE</div>
        <ModelBar
          model={{
            key: 'custom',
            label: 'Custom MoE',
            type: 'moe',
            totalParams: customResult.total,
            activeParams: customResult.active,
            note: `${custom.numExperts} experts, top-${custom.topK}`,
            releaseYear: 2024,
          }}
          maxParams={maxParams}
          isCustom
        />

        <div className={styles.legend}>
          <span><span className={styles.legendSwatchActive} /> active (compute cost per token)</span>
          <span><span className={styles.legendSwatchInactive} /> total – active (memory cost only)</span>
        </div>
      </div>

      {/* Custom MoE controls */}
      <div className={styles.configPanel}>
        <div className={styles.configTitle}>Custom MoE configuration</div>
        <div className={styles.configGrid}>
          <Slider
            label="N experts"
            value={custom.numExperts}
            min={2} max={256} step={1}
            onChange={v => setCustom({ ...custom, numExperts: v })}
          />
          <KSelector
            value={custom.topK}
            onChange={v => setCustom({ ...custom, topK: v })}
          />
          <Slider
            label="Layers"
            value={custom.numLayers}
            min={8} max={120} step={1}
            onChange={v => setCustom({ ...custom, numLayers: v })}
          />
          <Slider
            label="d_model"
            value={custom.dModel}
            min={512} max={16384} step={128}
            onChange={v => setCustom({ ...custom, dModel: v, dFFN: 4 * v })}
          />
        </div>
        <div className={styles.configResults}>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Total params</span>
            <span className={styles.configMetricValue}>{formatParams(customResult.total)}</span>
          </div>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Active params</span>
            <span className={styles.configMetricValueActive}>{formatParams(customResult.active)}</span>
          </div>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Sparsity</span>
            <span className={styles.configMetricValue}>{(customResult.active / customResult.total * 100).toFixed(0)}%</span>
          </div>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Memory (BF16)</span>
            <span className={styles.configMetricValue}>{(customResult.total * 2 / 1e9).toFixed(0)} GB</span>
          </div>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Compute/token</span>
            <span className={styles.configMetricValue}>{(customResult.active * 6 / 1e9).toFixed(0)} GFLOPs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelBar({ model, maxParams, isCustom }: { model: import('./model-data').ModelSpec; maxParams: number; isCustom?: boolean }) {
  const totalPct = (model.totalParams / maxParams) * 100;
  const activePct = (model.activeParams / maxParams) * 100;
  const isMoE = model.type === 'moe';

  return (
    <div className={`${styles.modelRow} ${isCustom ? styles.modelRowCustom : ''}`}>
      <div className={styles.modelLabel}>{model.label}</div>
      <div className={styles.barContainer}>
        {/* Total bar (background) */}
        <div className={styles.barTotal} style={{ width: `${totalPct}%` }} />
        {/* Active overlay */}
        <div className={styles.barActive} style={{ width: `${activePct}%` }} />
      </div>
      <div className={styles.modelStats}>
        {isMoE ? (
          <>
            <span className={styles.statTotal}>{formatParams(model.totalParams)}</span>
            <span className={styles.statSeparator}>/</span>
            <span className={styles.statActive}>{formatParams(model.activeParams)}</span>
          </>
        ) : (
          <span className={styles.statTotal}>{formatParams(model.totalParams)}</span>
        )}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className={styles.sliderGroup}>
      <label className={styles.sliderLabel}>{label}: <span className={styles.sliderValue}>{value}</span></label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className={styles.slider} />
    </div>
  );
}

function KSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className={styles.sliderGroup}>
      <label className={styles.sliderLabel}>Top-k: <span className={styles.sliderValue}>{value}</span></label>
      <div className={styles.kButtons}>
        {[1, 2, 4, 8].map(k => (
          <button
            key={k}
            className={`${styles.kButton} ${value === k ? styles.kButtonActive : ''}`}
            onClick={() => onChange(k)}
          >{k}</button>
        ))}
      </div>
    </div>
  );
}
```

#### A4. `ActiveVsTotalParams.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.sortToggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}
.sortLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
}
.sortButton {
  padding: 0.35rem 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.sortButton:hover { border-color: var(--border-strong); color: var(--text-primary); }
.sortButtonActive {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

.chartPanel {
  padding: 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.modelRow {
  display: grid;
  grid-template-columns: 150px 1fr 110px;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.4rem;
}
.modelRowCustom { /* highlighted styling below */ }
.modelLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-primary);
}
.modelRowCustom .modelLabel { color: var(--cyan-300); font-weight: 500; }

.barContainer {
  position: relative;
  height: 18px;
  background: var(--bg-primary);
  border-radius: 3px;
  overflow: hidden;
}
.barTotal {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  background: color-mix(in srgb, var(--cyan-500) 18%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--cyan-500) 40%, transparent);
}
.barActive {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  background: var(--cyan-500);
}
.modelRowCustom .barTotal { border-right-color: var(--amber-400); background: color-mix(in srgb, var(--amber-400) 18%, transparent); }
.modelRowCustom .barActive { background: var(--amber-400); }

.modelStats {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-secondary);
  text-align: right;
}
.statTotal { color: var(--text-tertiary); }
.statSeparator { color: var(--text-tertiary); margin: 0 0.2rem; }
.statActive { color: var(--cyan-300); font-weight: 500; }
.modelRowCustom .statActive { color: var(--amber-300); }

.customSeparator {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 0.85rem;
  margin-bottom: 0.4rem;
  padding-top: 0.65rem;
  border-top: 1px dashed var(--border-default);
}

.legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-subtle);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  flex-wrap: wrap;
}
.legendSwatchActive {
  display: inline-block;
  width: 14px; height: 8px;
  background: var(--cyan-500);
  margin-right: 0.4rem;
  vertical-align: middle;
}
.legendSwatchInactive {
  display: inline-block;
  width: 14px; height: 8px;
  background: color-mix(in srgb, var(--cyan-500) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--cyan-500) 40%, transparent);
  margin-right: 0.4rem;
  vertical-align: middle;
}

.configPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.configTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--cyan-300);
  font-weight: 500;
  margin-bottom: 0.75rem;
}
.configGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
  margin-bottom: 0.85rem;
}
.sliderGroup { display: flex; flex-direction: column; gap: 0.25rem; }
.sliderLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-secondary);
}
.sliderValue { color: var(--cyan-300); }
.slider { width: 100%; }
.kButtons { display: flex; gap: 0.3rem; }
.kButton {
  padding: 0.25rem 0.55rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.kButtonActive {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

.configResults {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--border-subtle);
}
.configMetric {
  padding: 0.45rem 0.7rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.configMetricLabel {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.15rem;
}
.configMetricValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--text-primary);
}
.configMetricValueActive {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--cyan-300);
  font-weight: 500;
}

@media (max-width: 720px) {
  .modelRow { grid-template-columns: 110px 1fr 95px; gap: 0.4rem; }
  .modelLabel { font-size: 0.7rem; }
  .modelStats { font-size: 0.68rem; }
  .configGrid { grid-template-columns: 1fr; }
}
```

#### A5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as MoERoutingVisualizer } from './ch11/MoERoutingVisualizer';
export { default as ActiveVsTotalParams } from './ch11/ActiveVsTotalParams';
```

#### A6. Update section-6's WidgetFrame in `index.mdx`

```mdx
import { MoERoutingVisualizer, ActiveVsTotalParams } from '@components/widgets';
```

```mdx
<WidgetFrame title="Active vs total parameters" caption="The inference economics of MoE made concrete. Each model shown as a bar — light region is total parameters (memory cost), filled region is active parameters per token (compute cost). Dense models (Llama-2, Llama-3) have total = active. MoE models (Mixtral, DeepSeek) show a visible gap between memory and compute. The custom configurator below lets you design your own MoE and see where it lands.">
  <ActiveVsTotalParams client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 8 ("What we've covered — and what's next") and the final chapter close paragraph:

````mdx
## Exercises

Four exercises that build on the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — MoE forward pass at top-1 vs top-2

Implement the MoE forward pass. Verify that top-1 routing uses exactly one expert per token; top-2 uses two with normalized gates.

<details>
<summary>Hint</summary>

For each token:
1. Compute router logits: $\ell = W_r x$
2. Find the top-$k$ expert indices (by argmax of logits)
3. Softmax over only the selected logits to get gate values summing to 1
4. Run only the top-$k$ FFNs and combine: $\text{MoE}(x) = \sum_{i \in \text{top}_k} g_i \cdot \text{FFN}_i(x)$

Top-1 case: the gate is just 1.0 (single-element softmax) or the softmax of one logit.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def moe_forward(x, router_W, expert_W1s, expert_W2s, k=2):
    """
    MoE forward for one token (1D x).
    Returns: (output, expert_indices, gates)
    """
    # TODO: compute router logits = x @ router_W.T
    # TODO: pick top-k expert indices
    # TODO: softmax over selected logits → gates
    # TODO: for each selected expert, compute FFN(x) and combine
    pass

# Test setup
np.random.seed(42)
d_model, d_ffn, num_experts = 16, 32, 4
x = np.random.normal(0, 1, d_model)
router_W = np.random.normal(0, 0.1, (num_experts, d_model))
expert_W1s = np.random.normal(0, 0.1, (num_experts, d_ffn, d_model))
expert_W2s = np.random.normal(0, 0.1, (num_experts, d_model, d_ffn))

# Test top-1
# out, idx, gates = moe_forward(x, router_W, expert_W1s, expert_W2s, k=1)
# print(f"Top-1: experts={idx}, gates={gates}")
# assert len(idx) == 1, "Top-1 should select exactly one expert"
# assert abs(gates[0] - 1.0) < 1e-6, "Top-1 gate should be 1.0"

# Test top-2
# out, idx, gates = moe_forward(x, router_W, expert_W1s, expert_W2s, k=2)
# print(f"Top-2: experts={idx}, gates={gates.round(3)}")
# assert len(idx) == 2, "Top-2 should select two experts"
# assert abs(gates.sum() - 1.0) < 1e-6, f"Gates should sum to 1, got {gates.sum()}"
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Parameter counting (Mixtral 8x7B verification)

Compute total and active parameters for an MoE transformer with given config. Verify against Mixtral 8x7B's published numbers (46.7B total, 12.9B active).

<details>
<summary>Hint</summary>

Per layer of an MoE transformer:
- Attention: $4 d^2$ (Q, K, V, O projections)
- LayerNorms: ~$4d$
- Per-expert FFN: $2 d \cdot d_{\text{ffn}}$
- Router: $N \cdot d$

Total layer params (all experts) = attn + LN + $N \cdot \text{FFN}_{\text{per-expert}}$ + router.
Active layer params (top-k only) = attn + LN + $k \cdot \text{FFN}_{\text{per-expert}}$ + router.

Plus embeddings: ~$2 \cdot V \cdot d$ (vocab + output projection, often tied).

For Mixtral 8x7B: $d=4096$, $d_{\text{ffn}}=14336$, $N=8$, $k=2$, $L=32$, $V \approx 32000$.

</details>

<RunnableCode
  client:visible
  defaultCode={`def count_moe_params(num_layers, d_model, d_ffn, num_experts, top_k, vocab_size=32000):
    """Compute total and active parameters for an MoE transformer."""
    # Per-layer attention: 4 * d^2 (Q, K, V, O)
    attn = 4 * d_model * d_model
    # LayerNorms: 4 * d_model per block
    ln = 4 * d_model
    # FFN per expert: 2 * d_model * d_ffn (assuming gated FFN like SwiGLU is approximately the same per matmul count)
    ffn_per_expert = 2 * d_model * d_ffn
    # Router: num_experts * d_model
    router = num_experts * d_model
    
    # TODO: layer_total = attn + ln + num_experts * ffn_per_expert + router
    # TODO: layer_active = attn + ln + top_k * ffn_per_expert + router
    
    # TODO: total = num_layers * layer_total + 2 * vocab_size * d_model
    # TODO: active = num_layers * layer_active + 2 * vocab_size * d_model
    
    # return total, active
    pass

# Mixtral 8x7B verification (approximate config)
# total, active = count_moe_params(
#     num_layers=32, d_model=4096, d_ffn=14336,
#     num_experts=8, top_k=2, vocab_size=32000,
# )
# print(f"Mixtral 8x7B (computed):")
# print(f"  Total:  {total/1e9:.1f}B  (published: 46.7B)")
# print(f"  Active: {active/1e9:.1f}B  (published: 12.9B)")
# print(f"  Sparsity: {active/total*100:.0f}%")

# Compare to dense Llama-2 70B (set num_experts=1, top_k=1)
# total_dense, active_dense = count_moe_params(
#     num_layers=80, d_model=8192, d_ffn=28672,
#     num_experts=1, top_k=1, vocab_size=32000,
# )
# print(f"\\nLlama-2 70B (dense):")
# print(f"  Total = Active = {total_dense/1e9:.1f}B")
# print(f"\\n→ Mixtral has 67% the total params and 18% the active params of Llama-2 70B.")
# print(f"  Same memory footprint as Llama-2 13B; quality closer to Llama-2 70B.")
`}
  packages={[]}
/>

### Exercise 3 (medium) — Auxiliary load balance loss

Implement the Switch Transformer auxiliary loss. Verify that it's lower for balanced routing than for collapsed routing — providing the gradient signal that prevents collapse.

<details>
<summary>Hint</summary>

The auxiliary loss is:
$$\mathcal{L}_{\text{aux}} = \alpha \cdot N \cdot \sum_{i=1}^N f_i \cdot P_i$$

where:
- $f_i$ = fraction of tokens routed to expert $i$ (computed from argmax assignments)
- $P_i$ = average router probability for expert $i$ (computed from the softmax outputs)
- $\alpha$ = balance coefficient, typically 0.01

The loss is minimized when both $f_i$ and $P_i$ are uniform ($1/N$ each). It's larger when routing is imbalanced.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def aux_load_balance_loss(router_probs, expert_assignments, num_experts, alpha=0.01):
    """
    Switch Transformer auxiliary load balancing loss.
    
    router_probs:        (num_tokens, num_experts) — softmax output for each token
    expert_assignments:  (num_tokens,) — top-1 expert assignment per token (argmax)
    num_experts:         N
    alpha:               balance coefficient
    """
    # TODO: f_i = fraction of tokens routed to expert i
    # TODO: P_i = average router probability for expert i (across tokens)
    # TODO: loss = alpha * num_experts * sum(f_i * P_i)
    pass

np.random.seed(0)
num_experts, num_tokens = 4, 100

# Balanced: uniform-ish routing
balanced_probs = np.random.dirichlet([5.0] * num_experts, size=num_tokens)
balanced_assign = np.argmax(balanced_probs, axis=-1)

# Collapsed: most tokens → expert 0
collapsed_probs = np.random.dirichlet([10.0, 0.1, 0.1, 0.1], size=num_tokens)
collapsed_assign = np.argmax(collapsed_probs, axis=-1)

# Compute losses
# loss_bal = aux_load_balance_loss(balanced_probs, balanced_assign, num_experts)
# loss_col = aux_load_balance_loss(collapsed_probs, collapsed_assign, num_experts)

# print(f"Balanced routing loss: {loss_bal:.5f}")
# print(f"Collapsed routing loss: {loss_col:.5f}")
# print(f"Ratio: {loss_col / loss_bal:.2f}x")
# print(f"\\n→ Collapsed routing has a higher loss → gradient pushes back toward balance.")
# print(f"  This is the central signal preventing router collapse during training.")
`}
  packages={[]}
/>

### Exercise 4 (hard) — Expert capacity and dropped tokens

Simulate expert capacity. Given a batch of routing decisions, count how many tokens are dropped at each capacity factor. Plot the drop rate vs capacity factor.

<details>
<summary>Hint</summary>

Expert capacity formula: $C = \rho \cdot (T / N)$ where $T$ is total tokens, $N$ is number of experts, $\rho$ is the capacity factor.

For each expert:
- Count how many tokens were assigned to it (from top-1 argmax)
- If count > capacity, drop (count - capacity) tokens
- Total drops = sum of overflow across experts

Drop rate = total drops / total tokens.

At $\rho = 1.0$: perfect routing has zero drops; imperfect routing has some.
At $\rho = 2.0$: very generous; most batches have zero drops but compute is wasted.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def simulate_drops(expert_assignments, num_experts, capacity_factor):
    """
    Given top-1 expert assignments for a batch, compute the number of dropped tokens
    at a given capacity factor.
    """
    num_tokens = len(expert_assignments)
    # Capacity per expert: rho * (T / N)
    capacity = int(capacity_factor * num_tokens / num_experts)
    
    # TODO: count tokens per expert
    # counts = np.bincount(expert_assignments, minlength=num_experts)
    # TODO: drops = sum(max(0, count - capacity) for each expert)
    # TODO: return drops, drop_rate (= drops / num_tokens)
    pass

np.random.seed(42)
num_experts, num_tokens = 8, 1000

# Imperfect routing — Zipf-like (some experts get more)
weights = np.array([3.0, 2.0, 1.5, 1.0, 1.0, 0.8, 0.5, 0.3])
weights = weights / weights.sum()
assignments = np.random.choice(num_experts, size=num_tokens, p=weights)

print(f"Tokens per expert: {np.bincount(assignments, minlength=num_experts).tolist()}")
print(f"Perfect balance would be: ~{num_tokens // num_experts} per expert")
print(f"\\nDrop rate at various capacity factors:")

# for rho in [0.5, 0.8, 1.0, 1.25, 1.5, 2.0]:
#     drops, rate = simulate_drops(assignments, num_experts, rho)
#     print(f"  rho={rho}: {drops} drops ({rate*100:.1f}%)")

# At rho=1.0: imperfect routing → some drops
# At rho=1.25: most drops eliminated; small efficiency cost
# At rho=2.0: zero drops but 50% of capacity wasted
# Modern training: rho ≈ 1.25 (sweet spot)
`}
  packages={[]}
/>

````

### Part C — Flip Ch 11's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 11, slug: 'ch11-moe', title: 'Mixture of Experts', partNum: 4, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3's** `MoERoutingVisualizer` widget still renders correctly.
3. **Section 6** now renders the working `ActiveVsTotalParams` widget.
4. **Default state:** 8 real models + custom MoE bar visible; sort by "Total" active; custom config at defaults shows ~46-48B total / ~12-13B active.
5. **Mixtral 8x7B row**: visible gap between total (46.7B) and active (12.9B) parts of the bar. **DeepSeek-V3 row**: dramatic gap (671B / 37B).
6. **Sort toggle**: switching between "Total" and "Active" reorders the bars correctly. Llama-3 405B and DeepSeek-V3 swap order when sorting by active (Llama-3 has higher active).
7. **Sliders update the custom bar in real-time**: increasing N experts increases total but keeps active near constant (for fixed k). Increasing top-k increases active proportionally.
8. **Memory + compute metrics** show concrete numbers (e.g., "93 GB BF16 memory, 77 GFLOPs/token").
9. **Exercises section** is below section 8 and above chapter close; contains 4 sub-exercises.
10. **Sidebar:** Ch 1-11 all active (published); Ch 12-30 still dimmed.
11. **Prev/next at bottom of Ch 11:** prev = Ch 10 (active); next = Ch 12 (disabled).
12. **TOC on Ch 11** includes Exercises as h2 plus 4 h3 sub-entries.
13. **Mobile (< 720px):** bar chart compresses; config grid collapses to 1 column.
14. **`npm run typecheck`** passes.
15. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 11 flips.
- ❌ **Do not modify Ch 1-10.** Sealed.
- ❌ **Do not modify Ch 11 widgets.** Only section 6's WidgetFrame gets updated.
- ❌ **Do not modify Ch 11 prose sections 1-8.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch11-moe/index.mdx src/lib/chapters.ts src/components/widgets/ch11/ActiveVsTotalParams.tsx src/components/widgets/ch11/ActiveVsTotalParams.module.css src/components/widgets/ch11/model-data.ts src/components/widgets/index.ts
git commit -m "session 52: Ch 11 active-vs-total params widget + exercises + status: published"
git push origin main
```

---

## Ch 11 closeout

Chapter 11 is now the eleventh complete chapter on production. **Phase 10 is half done** — one more chapter (Ch 12, Mamba) completes the alternative-architectures arc.

Confirm before declaring Ch 11 done:

- ✅ BUILD_ORDER.md shows files 65-68 ✅
- ✅ File 69 marked ⏭️ (absorbed)
- ✅ Ch 11 status is `'published'`
- ✅ Both Ch 11 widgets work in production
- ✅ All 4 Ch 11 exercises render

**Cadence check across 11 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual | 2 | 4 |
| Ch 5 | Two-topic (architecture) | 2 | 5 |
| Ch 6 | Variants | 2 | 4 |
| Ch 7 | Data engineering | 2 | 4 |
| Ch 8 | Two-topic (training) | 2 | 5 |
| Ch 9 | Two-topic (scaling) | 2 | 5 |
| Ch 10 | Engineering | 2 | 4 |
| Ch 11 | Architectural variant | 2 | 4 |

Cadence policy stable: 4-file for single-topic; 5-file for two-topic. 11 chapters validated.

**Phase 10 (Alternative architectures) status:**
- ✅ Ch 11 (Mixture of Experts) — complete
- ⬜ Ch 12 (Mamba / state-space models) — next

After Ch 12, Phase 10 closes. Then **Phase 11 (Post-training)** begins — the largest remaining arc: Ch 13 (SFT), Ch 14 (RLHF/DPO/RLVR), Ch 15 (PEFT — LoRA, adapters), Ch 16 (distillation). 4 chapters of post-training methods.

---

## Notes for the session author

**On the model data being verifiable:**
The real model specs are from public technical reports / papers:
- Llama-2 7B/13B/70B: Meta technical report, 2023
- Llama-3 405B: Meta technical report, 2024
- Mixtral 8x7B: Mistral paper, Jan 2024
- Mixtral 8x22B: Mistral release, Apr 2024
- DeepSeek-V2: DeepSeek paper, May 2024
- DeepSeek-V3: DeepSeek paper, Dec 2024

Numbers should round to nearest 0.1B-1B for display clarity.

**On the custom configurator being meaningful:**
At default config (8 experts, top-2, 32 layers, d=4096) the widget should compute ~46-48B total / ~12-13B active — close to Mixtral 8x7B. This validates the math by reproducing a real model's numbers.

Other tests:
- 256 experts, top-8, 60 layers, d=7168 → DeepSeek-V3 territory (671B / 37B)
- 1 expert, top-1 → recovers dense model accounting (e.g., 32 layers d=4096 → ~7B total = active = Llama-2 7B)

**On the exercise progression:**
- Ex 1 (easy) — implementation: see how the routing actually works. Test top-1 vs top-2 invariants.
- Ex 2 (medium) — math: reproduce Mixtral's published numbers from scratch. Validates understanding of MoE parameter accounting.
- Ex 3 (medium) — load balancing: implement the aux loss; verify it differentiates balanced vs collapsed routing.
- Ex 4 (hard) — capacity simulation: explore the drop rate vs capacity factor curve. Find the sweet spot.

Four exercises cover the chapter's full mechanical scope.

**On the 4 exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. MoE block equation | Ex 1 |
| 2. Top-k routing implementation | Ex 1 |
| 3. Active vs total parameters | Ex 2 |
| 4. Load balancing aux loss | Ex 3 |
| 5. Expert capacity / dropped tokens | Ex 4 |
| 6. MoE variants | (chapter prose + widget) |
| 7. Training challenges | (chapter prose) |
| 8. Inference economics | Ex 2 + widget |

Outcomes 1-5 served by exercises. Outcomes 6-7 served by chapter prose. Outcome 8 served by Ex 2 + widget.

**Pedagogical claim of the closeout:**
"You now have the full machinery of MoE. You can implement the forward pass (Ex 1). You can compute total/active parameters for any configuration and reproduce real models' numbers (Ex 2). You can implement the auxiliary loss that prevents router collapse (Ex 3). You can simulate expert capacity and find the optimal capacity factor (Ex 4). Combined with the chapter's variants survey and the inference-economics widget, you can read any MoE paper and understand its design choices."

**Phase 10 progress:**
After this session, Ch 11 is done. Ch 12 (Mamba) is the only remaining Phase 10 chapter. Pace through Ch 12 with the same 4-file cadence (it's another single-topic architectural variant).

**This chapter closes the first half of Phase 10.** MoE is the dominant architectural innovation of 2022-2024. Reader walks away calibrated on its strengths (decoupled params/compute, breakthrough open-weights models) and limitations (training instability, serving complexity, fine-tuning harder).

Build with care.
