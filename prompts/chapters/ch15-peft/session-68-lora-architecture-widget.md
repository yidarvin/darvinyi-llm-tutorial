# Session 68 — LoRA architecture marquee widget

> The marquee Chapter 15 widget. A single attention block with the four projections ($W_Q, W_K, W_V, W_O$) shown as **large frozen matrices** and their **tiny trainable LoRA adapters** ($BA$ decomposition) injected alongside. Visual proportions reflect the actual parameter ratio — the frozen base dominates; the trainable adapters are barely visible. **Slider for rank** ($r$) shows how the trainable parameter count scales (but stays tiny). **Target module selector** toggles between Q+V (original LoRA paper) / Q,K,V,O (modern default) / all-linear (FFN included). **Stats panel** below shows per-matrix, per-layer, and whole-model counts for both frozen and trainable parameters. **The visualization that makes "freeze the big stuff, train the small stuff" viscerally obvious.** Replaces the section-3 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch15-peft/research.md`** — concept 3 (LoRA mechanics) and concept 4 (practical hyperparameters) are the references
2. **`prompts/chapters/ch15-peft/session-67-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch11-moe/session-51-moe-routing-visualizer-widget.md`** — for the model-architecture-with-injected-modules pattern (MoE routing showed similar visual structure)
4. **`prompts/chapters/ch10-training-infrastructure/session-46-parallelism-diagram-widget.md`** — for the SVG-architecture-diagram pattern

---

## Goal

Replace the `<WidgetFrame title="LoRA architecture">` placeholder in section 3 with a working interactive widget that:

- Shows a **single attention block** as the conceptual unit with $W_Q, W_K, W_V, W_O$ matrices visualized
- Renders each frozen weight as a **large rectangle** (visual area roughly proportional to parameter count)
- Renders each LoRA adapter as a **tiny pair of rectangles** ($B$ and $A$) injected alongside the corresponding base weight
- **Visual proportions** make the size disparity immediately obvious: frozen weight is hundreds of times larger than the trainable adapter
- **Rank slider** (1, 4, 8, 16, 32, 64) → trainable LoRA size scales but remains visually tiny
- **Alpha display** with explanation of $\alpha/r$ ratio
- **Target module selector**: Q+V only / Q,K,V,O / all-linear
- **Parameter count panel**: per-matrix, per-layer, whole-model — both frozen and trainable
- **"Adapter size on disk" line** — translates to MB at the bottom for tangible reference

**End state:** section 3 of Chapter 15 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) the base weight matrices are huge ($d \cdot k$ params); (b) the LoRA adapters are tiny ($r(d+k)$ params); (c) the ratio is typically 100-1000×; (d) higher rank → more trainable params but still tiny; (e) more target modules → more total trainable but still tiny.

---

## Inputs

State of the repo after session 67:

- `src/pages/ch15-peft/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 6)
- `src/lib/chapters.ts` has Ch 15 as `'draft'`
- No `src/components/widgets/ch15/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch15/LoRAArchitecture.tsx` — the React widget
2. **Create** `src/components/widgets/ch15/LoRAArchitecture.module.css` — scoped styles
3. **Create** `src/components/widgets/ch15/lora-params-data.ts` — parameter computation helpers
4. **Update** `src/components/widgets/index.ts` — add `LoRAArchitecture` export
5. **Update** `src/pages/ch15-peft/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<LoRAArchitecture client:visible />`

---

## Detailed spec

### 1. `lora-params-data.ts` — parameter math

```ts
// src/components/widgets/ch15/lora-params-data.ts

export type TargetModulesOption = 'qv' | 'qkvo' | 'all';

export interface TargetModulesInfo {
  id: TargetModulesOption;
  label: string;
  /** Number of matrices per layer that receive LoRA. */
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

/** Standard configurations for 7B-class transformers. */
export const MODEL_CONFIG = {
  d_model: 4096,
  n_layers: 32,
  vocab_size: 128000,
  total_params_approx: 7e9,
  label: '7B-class transformer',
};

/** Per-matrix parameter counts. */
export function paramsPerMatrix(d: number = MODEL_CONFIG.d_model): {
  frozen: number;
  loraAt: (rank: number) => number;
} {
  return {
    frozen: d * d,
    loraAt: (rank: number) => rank * (d + d),
  };
}

/** Per-layer parameter counts. */
export function paramsPerLayer(targetCount: number, rank: number, d: number = MODEL_CONFIG.d_model): {
  frozen: number;
  trainable: number;
} {
  const perMatrix = paramsPerMatrix(d);
  return {
    frozen: targetCount * perMatrix.frozen,
    trainable: targetCount * perMatrix.loraAt(rank),
  };
}

/** Whole-model parameter counts (approximation). */
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
    adapterDiskMB: (trainable * 2) / 1e6,  // BF16 = 2 bytes per param
  };
}

/** Format param counts with K/M/B suffix. */
export function formatParams(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n.toFixed(0)}`;
}

export const RANK_OPTIONS = [1, 4, 8, 16, 32, 64];
```

### 2. Visual layout

```
ViewBox: 0 0 800 760

┌────────────────────────────────────────────────────────────────┐
│ Configuration: 7B-class transformer, d_model=4096, layers=32   │
│                                                                  │
│ Rank r:       [○ 1] [○ 4] [○ 8] [● 16] [○ 32] [○ 64]            │
│ Alpha α:      α = 2r = 32 (scaling factor α/r = 2)              │
│ Target:       [○ Q,V] [● Q,K,V,O] [○ all linear]                │
│                                                                  │
│ Attention block diagram (one layer):                             │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │                                                             │  │
│ │      x (input)                                              │  │
│ │       │                                                     │  │
│ │       ├─────┬──────────────────────────────────┐           │  │
│ │       │     │                                  │           │  │
│ │      [Q]   [K]                [V]            [O]          │  │
│ │       │     │                  │              │            │  │
│ │     ┌─┴─┐ ┌─┴─┐              ┌─┴─┐         ┌─┴─┐          │  │
│ │     │██ │ │██ │              │██ │         │██ │ frozen   │  │
│ │     │██ │ │██ │              │██ │         │██ │ 4096x4096│  │
│ │     │██ │ │██ │              │██ │         │██ │           │  │
│ │     │██ │ │██ │              │██ │         │██ │           │  │
│ │     └───┘ └───┘              └───┘         └───┘           │  │
│ │      + +   + +                + +           + +           │  │
│ │     [B][A][B][A]             [B][A]       [B][A]  LoRA    │  │
│ │      ▒  ▒  ▒  ▒               ▒  ▒          ▒  ▒  trainable│  │
│ │                                                            │  │
│ │      attn(Q, K, V) → O                                     │  │
│ │                                                             │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Visual proportions are approximately to-scale (with log scaling │
│ to make the LoRA boxes visible at low ranks).                   │
│                                                                  │
│ Parameter counts:                                                │
│ ┌──────────────┬──────────────┬──────────────┬───────────────┐ │
│ │              │ Per matrix   │ Per layer    │ Whole model   │ │
│ │ Frozen       │ 16.8M        │ 67.1M        │ 6.74B         │ │
│ │ Trainable    │ 131K         │ 524K         │ 16.8M         │ │
│ │ Ratio        │ 0.78%        │ 0.78%        │ 0.25%         │ │
│ └──────────────┴──────────────┴──────────────┴───────────────┘ │
│                                                                  │
│ Adapter size on disk: 33.6 MB (BF16). Fits on a USB stick.      │
│ The frozen base is the entire 7B-class transformer (~13.5 GB    │
│ in BF16). The trainable adapter is ~4000× smaller.              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click any rank option → updates everything (LoRA box sizes scale; param counts update)
- Click any target-module option → corresponding matrices light up (or dim down) in the diagram; param counts update
- **No** alpha slider — display only (since alpha is a scaling factor, not architectural; show it for completeness but don't interact)
- The matrix visualization uses log-scaling on the rank axis so even rank=1 LoRA is visible

### 3. `LoRAArchitecture.tsx`

```tsx
import { useState } from 'react';
import {
  TARGET_MODULES, MODEL_CONFIG, RANK_OPTIONS,
  paramsPerMatrix, paramsPerLayer, paramsWholeModel,
  formatParams,
  type TargetModulesOption,
} from './lora-params-data';
import styles from './LoRAArchitecture.module.css';

export default function LoRAArchitecture() {
  const [rank, setRank] = useState(16);
  const [target, setTarget] = useState<TargetModulesOption>('qkvo');
  const targetInfo = TARGET_MODULES[target];

  // alpha = 2r is the modern default
  const alpha = 2 * rank;

  // Parameter math
  const perMatrix = paramsPerMatrix(MODEL_CONFIG.d_model);
  const perLayer = paramsPerLayer(targetInfo.count, rank);
  const whole = paramsWholeModel(targetInfo.count, rank);

  return (
    <div className={styles.widget}>
      {/* Configuration controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.configHeader}>
          Configuration: <strong>{MODEL_CONFIG.label}</strong>, d_model = {MODEL_CONFIG.d_model}, layers = {MODEL_CONFIG.n_layers}
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Rank r:</span>
          <div className={styles.optionButtons}>
            {RANK_OPTIONS.map(r => (
              <button
                key={r}
                className={`${styles.optionButton} ${rank === r ? styles.optionActive : ''}`}
                onClick={() => setRank(r)}
              >{r}</button>
            ))}
          </div>
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Alpha α:</span>
          <span className={styles.alphaDisplay}>
            α = 2r = <strong>{alpha}</strong> (scaling factor α/r = 2)
          </span>
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Target:</span>
          <div className={styles.optionButtons}>
            {(['qv', 'qkvo', 'all'] as TargetModulesOption[]).map(t => (
              <button
                key={t}
                className={`${styles.optionButton} ${target === t ? styles.optionActive : ''}`}
                onClick={() => setTarget(t)}
                title={TARGET_MODULES[t].description}
              >
                {TARGET_MODULES[t].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className={styles.diagramPanel}>
        <div className={styles.diagramTitle}>Attention block diagram (one layer)</div>
        <ArchitectureSvg rank={rank} target={target} />
        <div className={styles.diagramNote}>
          Visual proportions are roughly to-scale (with log scaling at low ranks for visibility).
          The frozen matrices ($d_{'{'}model{'}'} \times d_{'{'}model{'}'} \approx 16.8M$ params each) dominate; LoRA
          adapters ({rank * 2 * MODEL_CONFIG.d_model} params each) are barely visible.
        </div>
      </div>

      {/* Parameter counts */}
      <div className={styles.statsPanel}>
        <div className={styles.statsTitle}>Parameter counts</div>
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th></th>
              <th>Per matrix</th>
              <th>Per layer ({targetInfo.count} matrices)</th>
              <th>Whole model ({MODEL_CONFIG.n_layers} layers)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={styles.rowLabel}>Frozen</td>
              <td>{formatParams(perMatrix.frozen)}</td>
              <td>{formatParams(perLayer.frozen)}</td>
              <td>{formatParams(whole.baseTotal)}</td>
            </tr>
            <tr className={styles.trainableRow}>
              <td className={styles.rowLabel}>Trainable</td>
              <td>{formatParams(perMatrix.loraAt(rank))}</td>
              <td>{formatParams(perLayer.trainable)}</td>
              <td>{formatParams(whole.trainable)}</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>Ratio</td>
              <td>{(100 * perMatrix.loraAt(rank) / perMatrix.frozen).toFixed(2)}%</td>
              <td>{(100 * perLayer.trainable / perLayer.frozen).toFixed(2)}%</td>
              <td>{(100 * whole.ratio).toFixed(3)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        At rank r = {rank} with {targetInfo.label} target modules:
        the trainable adapter is <strong>{(100 * whole.ratio).toFixed(2)}%</strong> of the base model.
        On disk (BF16): <strong>{whole.adapterDiskMB.toFixed(1)} MB</strong>.
        The base model is ~13.5 GB. <strong>The adapter is roughly {(13500 / whole.adapterDiskMB).toFixed(0)}× smaller.</strong>
        Train cheap, deploy cheap, store many adapters per base.
      </div>
    </div>
  );
}

function ArchitectureSvg({ rank, target }: { rank: number; target: TargetModulesOption }) {
  const WIDTH = 720;
  const HEIGHT = 360;
  const targetInfo = TARGET_MODULES[target];

  // Module list — fixed positions; opacity adjusts based on target selection
  const modules = [
    { id: 'Q', x: 100, label: 'W_Q', active: true },
    { id: 'K', x: 270, label: 'W_K', active: target !== 'qv' },
    { id: 'V', x: 440, label: 'W_V', active: true },
    { id: 'O', x: 610, label: 'W_O', active: target !== 'qv' },
  ];

  // FFN icon (small, off to the side, only shown when target = 'all')
  const showFFN = target === 'all';

  // Sizes (kept fixed; visual proportions are conceptual)
  const matrixW = 70;
  const matrixH = 110;
  const loraBoxSize = Math.max(6, Math.min(matrixW / 2, Math.log2(rank + 1) * 5 + 6));   // log-scale, capped

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label="LoRA architecture diagram">
      {/* Input node */}
      <text x={WIDTH / 2} y={30} className={styles.inputLabel} textAnchor="middle">x (input)</text>
      <line x1={WIDTH / 2} y1={36} x2={WIDTH / 2} y2={60} className={styles.connector} />
      {/* Horizontal connector to all modules */}
      <line x1={100 + matrixW / 2} y1={60} x2={610 + matrixW / 2} y2={60} className={styles.connector} />
      {modules.map(m => (
        <line key={`conn-${m.id}`} x1={m.x + matrixW / 2} y1={60} x2={m.x + matrixW / 2} y2={85} className={styles.connector} />
      ))}

      {/* Module group: frozen matrix + label + LoRA adapter */}
      {modules.map(m => (
        <g key={m.id} opacity={m.active ? 1 : 0.25}>
          {/* Matrix label above */}
          <text x={m.x + matrixW / 2} y={80} className={styles.moduleLabel} textAnchor="middle">
            {m.label}
          </text>
          {/* Frozen matrix box */}
          <rect
            x={m.x} y={90}
            width={matrixW} height={matrixH}
            className={styles.frozenMatrix}
          />
          {/* Texture lines inside the frozen matrix to suggest size */}
          {[...Array(8)].map((_, i) => (
            <line
              key={`tex-${m.id}-${i}`}
              x1={m.x + 4} x2={m.x + matrixW - 4}
              y1={90 + 14 + i * 12} y2={90 + 14 + i * 12}
              className={styles.frozenTexture}
            />
          ))}
          {/* Dimension label below the matrix */}
          <text
            x={m.x + matrixW / 2}
            y={90 + matrixH + 14}
            className={styles.dimLabel}
            textAnchor="middle"
          >
            4096 × 4096
          </text>

          {/* LoRA adapter (B and A boxes injected alongside) */}
          {m.active && (
            <g>
              {/* Vertical connector */}
              <line
                x1={m.x + matrixW + 8} y1={90}
                x2={m.x + matrixW + 8} y2={90 + matrixH}
                className={styles.loraConnector}
              />
              {/* B box (top) */}
              <rect
                x={m.x + matrixW + 4}
                y={120}
                width={loraBoxSize}
                height={loraBoxSize}
                className={styles.loraBox}
              />
              <text
                x={m.x + matrixW + 4 + loraBoxSize / 2}
                y={120 + loraBoxSize / 2 + 3}
                className={styles.loraLabel}
                textAnchor="middle"
                fontSize="7"
              >B</text>
              {/* A box (bottom) */}
              <rect
                x={m.x + matrixW + 4}
                y={120 + loraBoxSize + 4}
                width={loraBoxSize}
                height={loraBoxSize}
                className={styles.loraBox}
              />
              <text
                x={m.x + matrixW + 4 + loraBoxSize / 2}
                y={120 + loraBoxSize + 4 + loraBoxSize / 2 + 3}
                className={styles.loraLabel}
                textAnchor="middle"
                fontSize="7"
              >A</text>
            </g>
          )}
        </g>
      ))}

      {/* Attention operation node */}
      <text x={WIDTH / 2} y={290} className={styles.opLabel} textAnchor="middle">
        attn(Q, K, V) → O
      </text>

      {/* Legend */}
      <g transform={`translate(20, ${HEIGHT - 50})`}>
        <rect x={0} y={0} width={18} height={14} className={styles.frozenMatrix} />
        <text x={24} y={11} className={styles.legendLabel} fontSize="10">frozen base weights</text>
        <rect x={170} y={0} width={10} height={10} className={styles.loraBox} />
        <text x={186} y={9} className={styles.legendLabel} fontSize="10">
          LoRA adapters (trainable, rank {rank})
        </text>
      </g>

      {/* "All linear" mode: add a small FFN icon */}
      {showFFN && (
        <g transform={`translate(${WIDTH - 90}, ${HEIGHT - 50})`}>
          <rect x={0} y={0} width={22} height={14} className={styles.ffnIcon} />
          <text x={28} y={11} className={styles.legendLabel} fontSize="10">
            + FFN (also LoRA'd)
          </text>
        </g>
      )}
    </svg>
  );
}
```

### 4. `LoRAArchitecture.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.controlsPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.configHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.7rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
}
.configHeader strong { color: var(--cyan-300); }

.controlRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  min-width: 70px;
}
.alphaDisplay {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-tertiary);
}
.alphaDisplay strong { color: var(--cyan-300); }
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
.optionButton:hover { border-color: var(--border-strong); color: var(--text-primary); }
.optionActive {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  background: color-mix(in srgb, var(--cyan-500) 6%, transparent);
  font-weight: 500;
}

.diagramPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.diagramTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
  font-weight: 500;
}
.svg { width: 100%; height: auto; }
.diagramNote {
  margin-top: 0.7rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.74rem;
  color: var(--text-tertiary);
  font-style: italic;
  line-height: 1.5;
}

.inputLabel { fill: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; }
.connector { stroke: var(--text-tertiary); stroke-width: 1; }
.moduleLabel { fill: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; }
.dimLabel { fill: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; font-size: 9px; }
.opLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 11px; }

.frozenMatrix {
  fill: var(--bg-primary);
  stroke: var(--border-default);
  stroke-width: 1.5;
}
.frozenTexture { stroke: var(--border-default); stroke-width: 0.5; opacity: 0.6; }

.loraBox {
  fill: var(--cyan-500);
  stroke: var(--cyan-300);
  stroke-width: 1;
  opacity: 0.85;
}
.loraLabel { fill: var(--bg-primary); font-family: 'JetBrains Mono', monospace; font-weight: 600; }
.loraConnector { stroke: var(--cyan-400); stroke-width: 0.8; stroke-dasharray: 2 2; opacity: 0.6; }

.ffnIcon {
  fill: var(--violet-400);
  stroke: var(--violet-400);
  stroke-width: 1;
  opacity: 0.7;
}

.legendLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }

.statsPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.statsTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
  font-weight: 500;
}
.statsTable {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.statsTable th {
  text-align: left;
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
.statsTable td {
  padding: 0.45rem 0.6rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}
.rowLabel {
  color: var(--text-tertiary);
  font-weight: 500;
}
.trainableRow td { color: var(--cyan-300); font-weight: 500; }
.trainableRow .rowLabel { color: var(--cyan-300); }

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
  .statsTable { font-size: 0.7rem; }
  .statsTable th, .statsTable td { padding: 0.3rem 0.4rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as LoRAArchitecture } from './ch15/LoRAArchitecture';
// Session 69 will add:
// export { default as ParameterBudgetCalculator } from './ch15/ParameterBudgetCalculator';
```

### 6. Update `src/pages/ch15-peft/index.mdx`

**Edit A: Add widget import:**

```mdx
import { LoRAArchitecture } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="LoRA architecture" caption="A single attention block with the four projections (W_Q, W_K, W_V, W_O) shown as large frozen matrices and their tiny trainable LoRA adapters (B·A pairs) injected alongside. Slider for rank shows how the trainable parameter count scales — but it stays a tiny fraction of the base. Target-module selector toggles between Q+V only / Q,K,V,O / all linear. The size disparity is the visual punchline: a 7B model has 6.74B frozen params and ~17M trainable.">
  <LoRAArchitecture client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 15** renders with the working widget. Section 6's placeholder still stubbed.
3. **Default state:** rank=16, target=Q+K+V+O. Parameter counts show:
   - Per matrix: frozen=16.8M, trainable=131K, ratio=0.78%
   - Per layer: frozen=67.1M, trainable=524K, ratio=0.78%
   - Whole model: frozen=6.74B, trainable=16.8M, ratio=0.25%
   - Adapter on disk: ~33.6 MB
4. **Configuration panel** displays "7B-class transformer, d_model=4096, layers=32" and the alpha row showing α=2r=32.
5. **Rank buttons**: 6 options (1, 4, 8, 16, 32, 64). Clicking each updates LoRA box sizes (log-scaled) and parameter counts.
6. **Target module buttons**: 3 options (Q+V, Q,K,V,O, all linear). Q,K,V,O is default. Switching to Q+V dims the K and O matrices in the diagram; switching to all linear adds a small FFN legend icon.
7. **Architecture diagram** shows:
   - 4 module groups (Q, K, V, O) horizontally arranged
   - Each with a large frozen matrix box (~70×110 px) plus a tiny LoRA pair (~6-15 px each, log-scaled by rank)
   - 4096×4096 dimension labels below each frozen matrix
   - Connecting lines from input x to each module
   - "attn(Q, K, V) → O" operation label at the bottom
   - Legend at the bottom-left showing frozen vs LoRA color coding
8. **At rank=1**: LoRA boxes are minimum size (~6 px); per-matrix trainable = 8K params; whole-model ratio = 0.015%.
9. **At rank=64**: LoRA boxes are larger (~36 px); per-matrix trainable = 524K params; whole-model ratio = 1.0%.
10. **At target=Q+V** (original LoRA): only 2 modules have visible LoRA pairs (K and O are dimmed); per-layer trainable cuts in half vs Q,K,V,O.
11. **At target=all linear**: FFN legend appears; whole-model trainable count increases (6 matrices/layer instead of 4).
12. **Caption updates** with current ratio and disk size.
13. **Mobile (< 720px)**: controls stack; stats table cells smaller; SVG still readable.
14. **`npm run typecheck`** passes.
15. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not animate the diagram.** Static structural visualization.
- ❌ **Do not show actual LoRA training**. Architecture only.
- ❌ **Do not compare to other PEFT methods** (adapters, prefix tuning). Section 5 / future widgets handle that.
- ❌ **Do not show QLoRA quantization** in the diagram. Section 6 / next widget handles that.
- ❌ **Do not include an alpha slider.** Display only; alpha is conceptually a scaling factor, not part of the architecture.
- ❌ **Do not let the user customize model size**. Fixed 7B-class — keep the comparison anchored.
- ❌ **Do not flip Ch 15's status.** Session 69 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch15/ src/components/widgets/index.ts src/pages/ch15-peft/index.mdx
git commit -m "session 68: LoRA architecture marquee — visual proportions of frozen base vs trainable adapter"
git push origin main
```

Verify on production:
- Default rank=16, target=Q,K,V,O renders with visible LoRA boxes
- Switching rank changes box sizes and param counts proportionally
- Q+V mode dims K and O matrices
- All-linear mode shows FFN legend
- Stats table updates live with all selections

---

## Notes for the session author

**On the visual disparity being the pedagogical punchline:**
The whole point of LoRA is that the trainable adapters are *tiny* compared to the frozen base. The architecture diagram should make this visceral — the W matrices are large boxes; the B and A boxes are barely visible. **Reader's eye sees the size disparity before reading any numbers.**

**On log-scaling the LoRA box size:**
At rank=1, true-to-scale LoRA boxes would be essentially invisible (1 vs 4096 → 0.024% of base matrix area). At rank=64, still tiny (1.56%). **Log-scaling makes low-rank LoRA visible** while preserving the qualitative "tiny compared to base" message. Formula: `loraBoxSize = max(6, min(matrixW/2, log2(rank+1) * 5 + 6))`.

**On the alpha display being passive:**
Alpha is the LoRA scaling factor — it doesn't change the *architecture* (number of params, structure). Including a slider for alpha would confuse readers into thinking it's structurally important. **Better to display "α = 2r = 32, ratio α/r = 2" and explain.** This is honest pedagogy: alpha is a *training hyperparameter*, not architecture.

**On the target-module dimming pattern:**
When target=Q+V, K and O matrices are dimmed (opacity 0.25). Their LoRA boxes are not rendered. **Reader sees that two of the four projections aren't being trained.** Visual feedback for the architectural choice.

**On the "all linear" mode being abbreviated:**
FFN matrices aren't drawn in the main diagram (it's an *attention* block diagram). Instead, an FFN legend icon appears, signaling "we'd also be LoRA'ing the FFN up/down projections." The parameter math accounts for them (targetCount=6 instead of 4). **Compromise**: show the architectural change in the legend rather than expanding the diagram.

**On the parameter count being the second pedagogical centerpiece:**
After the visual diagram, the stats table makes the size disparity rigorous. **Three columns (per matrix / per layer / whole model)** because the ratio changes — per-matrix is 0.78% at r=16; whole-model is 0.25% because the embeddings and other layers add to the frozen count without trainable counterparts. The reader sees how local and global ratios differ.

**On the disk-size line being the practical anchor:**
"33.6 MB adapter, ~13.5 GB base, ~4000× smaller" makes the operational impact tangible. **The adapter fits on a USB stick; the base is the whole model.** This is what enables multi-LoRA serving and adapter portfolios.

**On the choice of 7B-class as the fixed model size:**
7B is the most relatable open-source baseline (Llama-7B, Mistral-7B, etc.). The math scales linearly to larger models. Keeping it fixed lets readers focus on rank and target-module choices without juggling another variable.

**Pedagogical claim this widget supports:**
"LoRA's value is operational. The architecture is simple — frozen base weights plus tiny low-rank adapters injected alongside them. The size disparity is enormous: a 7B-class model has ~6.7B frozen parameters and ~17M trainable at rank 16 with attention LoRA. The trainable adapter is ~4000× smaller than the base. You can store dozens of adapters per base model and swap them as needed. This is what makes 'one base, many specialized variants' practical."

After 30 seconds of interaction, the reader has internalized: (a) LoRA injects small adapters alongside frozen base matrices; (b) the size disparity is several orders of magnitude; (c) higher rank = bigger adapters but still tiny; (d) more target modules = more trainable but still tiny; (e) the resulting adapter is small enough to fit anywhere.

**This is the chapter's central visual.** Section 3's math + this diagram = full mental model of LoRA's architecture.

Build with care.
