# Session 42 — Scaling law calculator marquee widget

> The marquee Chapter 9 widget. Lets the reader pick a compute budget (slider) and see the Chinchilla loss curve along the iso-compute constraint, parameterized by tokens-per-parameter ratio. Three strategy markers — **Kaplan** (D/N ≈ 1.7, overlarge model), **Chinchilla** (D/N ≈ 20, optimal), **Llama-3 style** (D/N ≈ 100-1000, over-trained smaller model) — show where each sits on the curve. The reader sees viscerally that Chinchilla is the optimum, but Llama-3's off-optimum choice is a small loss penalty in exchange for major inference savings. Replaces the section-3 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch09-scaling-and-distributed/research.md`** — Derivation 1 (Chinchilla equation) and Derivation 2 (compute-optimal allocation) are the reference; the widget visualizes both
2. **`prompts/chapters/ch09-scaling-and-distributed/session-41-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch08-building-small-llm/session-37-loss-curve-widget.md`** — for the SVG line plot pattern (LossCurve has the closest precedent)
4. **`prompts/chapters/ch08-building-small-llm/session-38-optimizer-comparison-widget.md`** — for the clickable-strategy-cards pattern (OptimizerComparison uses identical UX)

---

## Goal

Replace the `<WidgetFrame title="Scaling law calculator">` placeholder in section 3 with a working interactive widget that:

- Displays a **compute budget slider** (log scale, 10²¹ to 10²⁶ FLOPs)
- Plots **loss vs tokens-per-parameter ratio** (D/N) along the iso-compute constraint
- Highlights three strategy points on the curve:
  - **Kaplan** (rose) — D/N ≈ 1.7 (GPT-3-like)
  - **Chinchilla** (cyan) — D/N ≈ 20 (compute-optimal)
  - **Llama-3 style** (amber) — D/N ≈ 250 (over-trained small)
- Three strategy cards below the plot showing N, D, and predicted loss for each strategy at the current compute budget
- Click a card to highlight that strategy (thicker marker, description updates)
- A description panel below explaining the currently-focused strategy

**End state:** section 3 of Chapter 9 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) Chinchilla is the loss-optimum; (b) Kaplan-style allocations leave significant loss on the table; (c) Llama-3-style allocations sacrifice a small amount of loss for major inference savings.

---

## Inputs

State of the repo after session 41:

- `src/pages/ch09-scaling-and-distributed/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 6)
- `src/lib/chapters.ts` has Ch 9 as `'draft'`
- No `src/components/widgets/ch09/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch09/ScalingLawCalculator.tsx` — the React widget
2. **Create** `src/components/widgets/ch09/ScalingLawCalculator.module.css` — scoped styles
3. **Create** `src/components/widgets/ch09/chinchilla-data.ts` — Chinchilla constants + helper functions
4. **Update** `src/components/widgets/index.ts` — add `ScalingLawCalculator` export
5. **Update** `src/pages/ch09-scaling-and-distributed/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<ScalingLawCalculator client:visible />`

**Do NOT modify:** any prior chapter widget, the section-6 placeholder, or any other file.

---

## Detailed spec

### 1. `chinchilla-data.ts` — the data layer

```ts
// src/components/widgets/ch09/chinchilla-data.ts

/**
 * Chinchilla scaling law constants from Hoffmann et al. 2022 (approximate).
 * L(N, D) = E + A / N^alpha + B / D^beta
 */
export const E = 1.69;
export const A = 406.0;
export const B = 410.0;
export const ALPHA = 0.34;
export const BETA = 0.28;

/** Compute = 6 * N * D (forward 2ND + backward 4ND). */
export function chinchillaLoss(N: number, D: number): number {
  return E + A / Math.pow(N, ALPHA) + B / Math.pow(D, BETA);
}

/**
 * Given a compute budget C and a tokens-per-parameter ratio r = D / N,
 * solve for N and D under the constraint 6 * N * D = C.
 *
 * From 6 * N * D = C and D = r * N:
 *   6 * N * (r * N) = C
 *   N^2 = C / (6r)
 *   N = sqrt(C / (6r))
 *   D = r * N
 */
export function allocateByRatio(C: number, r: number): { N: number; D: number } {
  const N = Math.sqrt(C / (6 * r));
  const D = r * N;
  return { N, D };
}

/**
 * Compute-optimal allocation under Chinchilla:
 *   N propto C^(beta/(alpha+beta)), D propto C^(alpha/(alpha+beta))
 * For the fitted constants, the optimum is approximately D/N = 20.
 */
export function computeOptimalAllocation(C: number): { N: number; D: number } {
  return allocateByRatio(C, 20);
}

export interface Strategy {
  key: 'kaplan' | 'chinchilla' | 'llama3';
  label: string;
  shortLabel: string;
  ratio: number;
  description: string;
  color: string;
}

export const STRATEGIES: Strategy[] = [
  {
    key: 'kaplan',
    label: 'Kaplan-style (overlarge model)',
    shortLabel: 'Kaplan',
    ratio: 1.7,
    description:
      'The original 2020 scaling law recommendation. ~1.7 tokens per parameter — most compute goes to making the model larger. Used by GPT-3 (175B params, 300B tokens). Significantly undertrains the model; sits notably above the Chinchilla optimum on the loss curve.',
    color: 'var(--rose-400)',
  },
  {
    key: 'chinchilla',
    label: 'Chinchilla optimal',
    shortLabel: 'Chinchilla ★',
    ratio: 20,
    description:
      'The Hoffmann et al. 2022 compute-optimal allocation. ~20 tokens per parameter. Minimizes loss given a fixed compute budget. Used by Chinchilla itself (70B params, 1.4T tokens) and many post-2022 frontier training runs. The mathematical optimum.',
    color: 'var(--cyan-400)',
  },
  {
    key: 'llama3',
    label: 'Llama-3 style (over-trained small)',
    shortLabel: 'Llama-3 style',
    ratio: 250,
    description:
      'Over-train a smaller architecture past Chinchilla-optimal. ~100-2000 tokens per parameter; here we use 250 as a representative value. Llama-3 8B trained on 15T tokens — about 100× past Chinchilla. Slight loss penalty during training; major savings during inference (smaller model = cheaper to serve).',
    color: 'var(--amber-400)',
  },
];

/**
 * Sample the loss curve along the iso-compute constraint.
 * Returns ~100 points sweeping r from 0.1 to 2000 (log scale).
 */
export function sampleLossCurve(C: number, numPoints = 120): { r: number; N: number; D: number; loss: number }[] {
  const rMin = 0.1;
  const rMax = 2000;
  const points: { r: number; N: number; D: number; loss: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // Log-space sampling
    const r = rMin * Math.pow(rMax / rMin, t);
    const { N, D } = allocateByRatio(C, r);
    const loss = chinchillaLoss(N, D);
    points.push({ r, N, D, loss });
  }
  return points;
}

/** Format very large/small numbers compactly: 7.0e9 → "7.0B", 1.4e12 → "1.4T". */
export function formatLargeNumber(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n / 1e9 ).toFixed(1) + 'B';
  if (n >= 1e6)  return (n / 1e6 ).toFixed(1) + 'M';
  if (n >= 1e3)  return (n / 1e3 ).toFixed(1) + 'K';
  return n.toFixed(0);
}

/** Compute budget slider runs in log space. Map slider [0, 1] to log(FLOPs). */
export const LOG_C_MIN = 21;   // 10^21 FLOPs (small experiment)
export const LOG_C_MAX = 26;   // 10^26 FLOPs (frontier scale)

export function sliderToCompute(sliderValue: number): number {
  return Math.pow(10, LOG_C_MIN + sliderValue * (LOG_C_MAX - LOG_C_MIN));
}

export function computeToSlider(C: number): number {
  return (Math.log10(C) - LOG_C_MIN) / (LOG_C_MAX - LOG_C_MIN);
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 700

┌────────────────────────────────────────────────────────────────┐
│  Compute budget:  [────●─────────────] 6.0e+23 FLOPs           │
│                    10²¹    10²³    10²⁶                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ Loss along iso-compute curve                          │     │
│  │                                                        │     │
│  │  4.0 ┤●                                                │     │
│  │      │ ●●●                                             │     │
│  │  3.0 ┤    ●●●●                                         │     │
│  │      │        ●●●●●                                    │     │
│  │  2.5 ┤             ●●●●                                │     │
│  │      │                 ●●● [K]                ●● [L3]  │     │
│  │  2.2 ┤                     ●●●●          ●●●●         │     │
│  │      │                          ●●● [C] ●●            │     │
│  │  2.0 ┤                              ●●●●              │     │
│  │      │                              ←-- optimum       │     │
│  │      └──────────────────────────────────────────       │     │
│  │       0.1     1     10    20    100    1000           │     │
│  │              tokens per parameter (D/N), log scale    │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                  │
│  Three strategies at this compute budget:                       │
│  ┌──────────────────────┬──────────────────────┬──────────────┐│
│  │ Kaplan               │ Chinchilla ★          │ Llama-3 style ││
│  │ ratio: 1.7           │ ratio: 20             │ ratio: 250    ││
│  │ N: 9.7B  D: 16B      │ N: 2.9B  D: 58B       │ N: 813M  D: 200B│
│  │ Loss: 2.42           │ Loss: 2.10            │ Loss: 2.27   ││
│  └──────────────────────┴──────────────────────┴──────────────┘│
│                                                                  │
│  Highlighted: Chinchilla optimal                                │
│  The Hoffmann et al. 2022 compute-optimal allocation. ~20      │
│  tokens per parameter. Minimizes loss given a fixed compute... │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Slide compute budget → all curves rescale; strategy points update; cards update; loss values change
- Click a strategy card → that strategy becomes focused (large marker on the curve, description below switches)
- Hover the loss curve → readout shows (r, N, D, loss) at hover point
- At low compute budgets (10²¹), all strategies converge close together (small models); at high budgets (10²⁵+), the differences become pronounced

### 3. `ScalingLawCalculator.tsx`

```tsx
import { useMemo, useState } from 'react';
import {
  STRATEGIES, type Strategy,
  allocateByRatio, chinchillaLoss, sampleLossCurve,
  formatLargeNumber, sliderToCompute, computeToSlider,
} from './chinchilla-data';
import styles from './ScalingLawCalculator.module.css';

export default function ScalingLawCalculator() {
  const [sliderValue, setSliderValue] = useState(computeToSlider(6e23));   // default: GPT-3-class compute
  const [focusedKey, setFocusedKey] = useState<Strategy['key']>('chinchilla');
  const [hovered, setHovered] = useState<{ r: number; N: number; D: number; loss: number } | null>(null);

  const C = sliderToCompute(sliderValue);
  const curve = useMemo(() => sampleLossCurve(C), [C]);
  const strategyResults = useMemo(
    () => STRATEGIES.map(s => {
      const { N, D } = allocateByRatio(C, s.ratio);
      return { ...s, N, D, loss: chinchillaLoss(N, D) };
    }),
    [C]
  );
  const focused = strategyResults.find(s => s.key === focusedKey)!;

  return (
    <div className={styles.widget}>
      {/* Compute budget slider */}
      <div className={styles.controls}>
        <label className={styles.controlLabel}>
          Compute budget: <span className={styles.controlValue}>{C.toExponential(1)} FLOPs</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={sliderValue}
          onChange={e => setSliderValue(Number(e.target.value))}
          className={styles.slider}
          aria-label="Compute budget"
        />
        <div className={styles.sliderHints}>
          <span>10²¹ (small experiment)</span>
          <span>10²³ (GPT-3-class)</span>
          <span>10²⁶ (frontier)</span>
        </div>
      </div>

      {/* Loss curve plot */}
      <div className={styles.plotPanel}>
        <div className={styles.panelTitle}>Loss along iso-compute curve — varying D/N at fixed C</div>
        <LossCurvePlot
          curve={curve}
          strategies={strategyResults}
          focusedKey={focusedKey}
          onHover={setHovered}
        />
      </div>

      {/* Strategy cards */}
      <div className={styles.panelTitle}>Three strategies at this compute budget</div>
      <div className={styles.cardsGrid}>
        {strategyResults.map(s => (
          <div
            key={s.key}
            className={`${styles.strategyCard} ${s.key === focusedKey ? styles.cardFocused : ''}`}
            onClick={() => setFocusedKey(s.key)}
            style={{ borderColor: s.key === focusedKey ? s.color : undefined }}
            role="button"
            tabIndex={0}
          >
            <div className={styles.cardHeader} style={{ color: s.color }}>{s.shortLabel}</div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>D/N</span>
              <span className={styles.cardValue}>{s.ratio}</span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>N (params)</span>
              <span className={styles.cardValue}>{formatLargeNumber(s.N)}</span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>D (tokens)</span>
              <span className={styles.cardValue}>{formatLargeNumber(s.D)}</span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>loss</span>
              <span className={styles.cardLossValue} style={{ color: s.color }}>{s.loss.toFixed(3)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className={styles.description} aria-live="polite">
        <div className={styles.descriptionHeader} style={{ color: focused.color }}>
          {focused.label}
        </div>
        <div className={styles.descriptionBody}>{focused.description}</div>
      </div>

      {/* Hover readout */}
      {hovered && (
        <div className={styles.hoverReadout}>
          D/N = <strong>{hovered.r.toFixed(1)}</strong> &nbsp;|&nbsp;
          N = <strong>{formatLargeNumber(hovered.N)}</strong> &nbsp;|&nbsp;
          D = <strong>{formatLargeNumber(hovered.D)}</strong> &nbsp;|&nbsp;
          loss = <strong>{hovered.loss.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

interface PlotProps {
  curve: { r: number; N: number; D: number; loss: number }[];
  strategies: (Strategy & { N: number; D: number; loss: number })[];
  focusedKey: Strategy['key'];
  onHover: (h: { r: number; N: number; D: number; loss: number } | null) => void;
}

function LossCurvePlot({ curve, strategies, focusedKey, onHover }: PlotProps) {
  const WIDTH = 720;
  const HEIGHT = 300;
  const PADDING = { top: 20, right: 20, bottom: 40, left: 55 };
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  // Log-scale x (r = D/N) from 0.1 to 2000
  const R_MIN_LOG = Math.log10(0.1);
  const R_MAX_LOG = Math.log10(2000);

  // Linear-scale y, anchored to dynamic range
  const lossValues = curve.map(p => p.loss);
  const yMin = Math.floor(Math.min(...lossValues) * 10) / 10 - 0.1;
  const yMax = Math.ceil(Math.max(...lossValues) * 10) / 10 + 0.1;

  function xFor(r: number): number {
    return PADDING.left + ((Math.log10(r) - R_MIN_LOG) / (R_MAX_LOG - R_MIN_LOG)) * plotW;
  }
  function yFor(loss: number): number {
    return PADDING.top + ((yMax - loss) / (yMax - yMin)) * plotH;
  }

  // X-axis ticks (log scale): 0.1, 1, 10, 100, 1000
  const xTicks = [0.1, 1, 10, 100, 1000];
  // Y-axis ticks (dynamic)
  const yTickStep = 0.5;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / yTickStep) * yTickStep; v <= yMax; v += yTickStep) {
    yTicks.push(parseFloat(v.toFixed(2)));
  }

  const pathD = curve.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xFor(pt.r)} ${yFor(pt.loss)}`).join(' ');

  function handleSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svgEl = e.currentTarget;
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    // Convert SVG-x back to r
    const xRel = (local.x - PADDING.left) / plotW;
    if (xRel < 0 || xRel > 1) { onHover(null); return; }
    const logR = R_MIN_LOG + xRel * (R_MAX_LOG - R_MIN_LOG);
    const r = Math.pow(10, logR);
    // Find closest curve point
    let best = curve[0]!;
    let bestDist = Math.abs(best.r - r);
    for (const p of curve) {
      const d = Math.abs(Math.log10(p.r) - logR);
      if (d < bestDist) { best = p; bestDist = d; }
    }
    onHover(best);
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.svg}
      onMouseMove={handleSvgMouseMove}
      onMouseLeave={() => onHover(null)}
      role="img"
      aria-label="Loss along iso-compute curve"
    >
      {/* Grid */}
      {xTicks.map(t => (
        <line key={`gx-${t}`} x1={xFor(t)} x2={xFor(t)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.gridLine} />
      ))}
      {yTicks.map(t => (
        <line key={`gy-${t}`} x1={PADDING.left} x2={WIDTH - PADDING.right} y1={yFor(t)} y2={yFor(t)} className={styles.gridLine} />
      ))}

      {/* Axes */}
      <line x1={PADDING.left} x2={PADDING.left} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.axisLine} />
      <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={HEIGHT - PADDING.bottom} y2={HEIGHT - PADDING.bottom} className={styles.axisLine} />

      {/* Tick labels */}
      {xTicks.map(t => (
        <text key={`xt-${t}`} x={xFor(t)} y={HEIGHT - PADDING.bottom + 18} className={styles.tickLabel} textAnchor="middle">{t}</text>
      ))}
      {yTicks.map(t => (
        <text key={`yt-${t}`} x={PADDING.left - 8} y={yFor(t) + 4} className={styles.tickLabel} textAnchor="end">{t.toFixed(1)}</text>
      ))}

      {/* Axis labels */}
      <text x={PADDING.left + plotW / 2} y={HEIGHT - 6} className={styles.axisLabel} textAnchor="middle">
        tokens per parameter (D / N), log scale
      </text>
      <text x={-PADDING.top - plotH / 2} y={14} className={styles.axisLabel} textAnchor="middle" transform="rotate(-90)">
        predicted loss
      </text>

      {/* Loss curve */}
      <path d={pathD} fill="none" className={styles.curvePath} />

      {/* Strategy markers */}
      {strategies.map(s => {
        const isFocused = s.key === focusedKey;
        return (
          <g key={s.key}>
            {/* Vertical line down to x-axis */}
            <line
              x1={xFor(s.ratio)} x2={xFor(s.ratio)}
              y1={yFor(s.loss)} y2={HEIGHT - PADDING.bottom}
              stroke={s.color}
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={isFocused ? 0.7 : 0.35}
            />
            {/* Marker dot */}
            <circle
              cx={xFor(s.ratio)}
              cy={yFor(s.loss)}
              r={isFocused ? 7 : 5}
              fill={s.color}
              stroke="var(--bg-primary)"
              strokeWidth={2}
            />
            {/* Label */}
            <text
              x={xFor(s.ratio)}
              y={yFor(s.loss) - 12}
              fill={s.color}
              className={styles.strategyLabel}
              textAnchor="middle"
              fontWeight={isFocused ? 500 : 400}
            >
              {s.shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

### 4. `ScalingLawCalculator.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
  position: relative;
}

.controls {
  margin-bottom: 1rem;
}
.controlLabel {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 0.35rem;
}
.controlValue { color: var(--cyan-300); font-weight: 500; }
.slider { width: 100%; }
.sliderHints {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-tertiary);
}

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin: 1rem 0 0.5rem;
  font-weight: 500;
}

.plotPanel {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  margin-bottom: 1rem;
}
.svg { width: 100%; height: auto; cursor: crosshair; }

.gridLine { stroke: var(--border-subtle); stroke-width: 0.5; stroke-dasharray: 2 4; }
.axisLine { stroke: var(--border-default); stroke-width: 1; }
.tickLabel { fill: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; font-size: 10px; }
.axisLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.curvePath { stroke: var(--cyan-400); stroke-width: 2; }
.strategyLabel { font-family: 'JetBrains Mono', monospace; font-size: 10px; }

.cardsGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.strategyCard {
  padding: 0.75rem 0.9rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 200ms;
}
.strategyCard:hover { border-color: var(--border-strong); }
.cardFocused { /* color border set inline based on strategy.color */ }
.cardHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.45rem;
}
.cardRow {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  margin-bottom: 0.15rem;
}
.cardLabel { color: var(--text-tertiary); }
.cardValue { color: var(--text-secondary); }
.cardLossValue { font-size: 0.85rem; font-weight: 500; }

.description {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.5rem;
}
.descriptionHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.4rem;
}
.descriptionBody {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.hoverReadout {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  padding: 0.4rem 0.7rem;
  background: var(--bg-elevated);
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--text-primary);
  pointer-events: none;
  z-index: 10;
}
.hoverReadout strong { color: var(--cyan-300); }

@media (max-width: 640px) {
  .cardsGrid { grid-template-columns: 1fr; }
  .sliderHints { font-size: 0.55rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as ScalingLawCalculator } from './ch09/ScalingLawCalculator';
// Session 43 will add:
// export { default as ParallelismDiagram } from './ch09/ParallelismDiagram';
```

### 6. Update `src/pages/ch09-scaling-and-distributed/index.mdx`

**Edit A: Add widget import:**

```mdx
import { ScalingLawCalculator } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Scaling law calculator" caption="The Chinchilla loss curve along the iso-compute constraint. Adjust your compute budget; the curve rescales. Three strategy points highlight the trade-off: Kaplan (overlarge model, undertrained), Chinchilla (optimal balance), Llama-3 style (over-trained smaller model for inference economics). Click any strategy card to focus it.">
  <ScalingLawCalculator client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 9** renders with the working widget. Section 6's placeholder still stubbed.
3. **Initial state:** slider at ~6e23 FLOPs (GPT-3-class); Chinchilla focused; three strategy markers visible on the curve.
4. **At default compute (6e23 FLOPs)**, approximate strategy values should be:
   - Kaplan (ratio 1.7): N ≈ 6-9B, D ≈ 11-16B, loss ≈ 2.4
   - Chinchilla (ratio 20): N ≈ 2-3B, D ≈ 50-60B, loss ≈ 2.1
   - Llama-3 style (ratio 250): N ≈ 0.5-1B, D ≈ 130-200B, loss ≈ 2.25
5. **Slider behavior:** sliding to lower compute (10²¹) shrinks all sizes; sliding to higher compute (10²⁵) grows all sizes; the curve shape remains qualitatively the same but the absolute loss values change.
6. **Curve shape:** U-shaped (loss high at low D/N, drops to minimum around D/N=20, rises again at high D/N). The minimum is *near* the Chinchilla marker by construction.
7. **Strategy markers:** vertical dashed lines drop from each marker to the x-axis (showing where on the D/N axis the strategy sits). Focused marker is larger (r=7 vs r=5) and has stronger dashed line (opacity 0.7 vs 0.35).
8. **Clicking a card:** that strategy becomes focused; description below the cards updates to that strategy's description.
9. **Hovering the plot:** readout box appears in bottom-right showing (D/N, N, D, loss) at the hover point.
10. **Mobile (< 640px):** cards collapse to single column; slider hints shrink.
11. **`npm run typecheck`** passes.
12. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not let the user edit the strategy ratios.** Fixed at Kaplan=1.7, Chinchilla=20, Llama-3=250.
- ❌ **Do not let the user edit the Chinchilla constants (E, A, B, α, β).** Fixed at the published values.
- ❌ **Do not show a 2D heatmap of loss vs (N, D).** The 1D curve along iso-compute is the chapter's pedagogical focus.
- ❌ **Do not implement parallelism visualization here.** Session 43 owns the parallelism diagram.
- ❌ **Do not flip Ch 9's status.** Session 44 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch09/ src/components/widgets/index.ts src/pages/ch09-scaling-and-distributed/index.mdx
git commit -m "session 42: scaling law calculator marquee widget — Chinchilla iso-compute curve with strategy markers"
git push origin main
```

Verify on production:
- Curve is clearly U-shaped with minimum near D/N = 20
- All three strategy markers appear at their expected positions
- Sliding compute budget rescales everything sensibly
- At 10²⁵ compute (frontier scale): Chinchilla allocation should be ~30B params on ~600B tokens

---

## Notes for the session author

**On the iso-compute curve being U-shaped:**
The Chinchilla equation $L = E + A/N^\alpha + B/D^\beta$ has two error terms — one penalizing small $N$, one penalizing small $D$. Along the constraint $N \cdot D = C/6$ (fixed compute), trading $N$ for $D$ (or vice versa) increases one error and decreases the other. The minimum is *where the two terms balance*. The U-shape is the visual signature of this balance.

For Chinchilla's fitted constants, the minimum is around $D/N \approx 20$ — independent of the compute level (only the absolute loss values change with $C$, not the position of the minimum).

**On the strategy ratios:**
- **Kaplan (1.7)**: average ratio across GPT-3-era models. GPT-3 itself was 175B/300B ≈ 1.7. Megatron-Turing: 530B/270B ≈ 0.5. Gopher: 280B/300B ≈ 1.1. The Kaplan recommendation pushed toward larger models with fewer tokens.
- **Chinchilla (20)**: the canonical optimum from Hoffmann et al. 2022. Chinchilla itself: 70B/1.4T = 20.
- **Llama-3 (250)**: representative of modern over-training. Llama-3 8B: 8B/15T = 1875 (much more aggressive). Llama-3 70B: 70B/15T = 214 (close to our chosen value). 250 is a reasonable representative.

**On the formatLargeNumber helper:**
N typically ranges from millions to hundreds of billions. D from billions to trillions. Compact formatting ("9.7B", "16T") is essential for the cards to be readable on mobile.

**On the slider being log-scale:**
Compute budgets span 5 orders of magnitude (10²¹ to 10²⁶). Linear slider would compress most of the range into a tiny region. Log-scale gives equal slider distance to each order of magnitude. The slider hints ("small experiment", "GPT-3-class", "frontier") anchor the reader's intuition.

**On the cursor=crosshair on the SVG:**
Visual cue that the plot is hoverable. Without it, the reader might not realize they can hover for precise values.

**On the strategy markers having vertical drops:**
Two visual elements per strategy: the colored dot on the curve at its loss value, plus a dashed vertical line down to the x-axis. The vertical line emphasizes "this strategy sits at D/N = X" — connecting the loss-value point to the allocation ratio. Without the vertical line, the marker would feel disconnected from the x-axis.

**On the focused marker being more prominent:**
Focused: radius 7, dashed line opacity 0.7, label fontWeight 500. Non-focused: radius 5, dashed line opacity 0.35, label fontWeight 400. Visible hierarchy without making non-focused markers invisible.

**Pedagogical claim this widget supports:**
"The Chinchilla scaling law isn't just a recommendation — it's the *minimum* of a loss curve. Move away from D/N = 20 in either direction and loss increases. Kaplan-style allocations sit on the rising left edge (too large a model, too little data); Llama-3-style sits on the rising right edge (over-trained smaller model). The cost of being off-optimum is *visible* — it's the vertical distance between the strategy marker and the curve minimum."

After 30 seconds of exploration, the reader has internalized: (a) compute-optimal is a *point*, not a region; (b) the loss penalty for being off-optimum is *quantifiable*; (c) Llama-3's choice is a small loss penalty (~0.15 nats at GPT-3-class compute) in exchange for major inference savings — a deliberate trade-off, not a mistake.

**This is the chapter's mathematical centerpiece.** The Chinchilla equation in section 3's prose is abstract; this widget makes it concrete. Reader can plug in their own compute budget and see what they should train.

Build with care. This is the visual the reader will remember.
