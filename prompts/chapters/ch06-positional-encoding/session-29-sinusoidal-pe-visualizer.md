# Session 29 — Sinusoidal PE visualizer marquee widget

> The marquee Chapter 6 widget — the iconic sinusoidal positional encoding heatmap. Position on the y-axis, dimension on the x-axis, cells colored by PE value. The classic "stripe pattern" emerges: high-frequency oscillations on the left, low-frequency on the right. The reader can hover/click a dimension to see its underlying sin/cos wave plotted as a 1D curve. Replaces the section-2 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch06-positional-encoding/research.md`** — Derivation 1 (the sinusoidal PE formula) is the reference
2. **`prompts/chapters/ch06-positional-encoding/session-28-page-structure.md`** — for the section-2 widget placeholder this session fills
3. **`prompts/chapters/ch04-attention/session-19-attention-heatmap-widget.md`** — for the matrix-as-grid rendering pattern
4. **`prompts/chapters/ch01-neural-net-primitives/session-09-training-curves-widget.md`** — for the wave-plot rendering pattern (line chart on canvas/SVG)

---

## Goal

Replace the `<WidgetFrame title="Sinusoidal positional encoding">` placeholder in section 2 with a working interactive widget that:

- Displays the sinusoidal PE matrix as a **heatmap**: position on the y-axis (rows), dimension on the x-axis (columns), cells colored by PE value (diverging red/blue scale)
- The classic "stripe pattern" must be visually unmistakable: tight oscillation on the left dimensions, broad oscillation on the right
- **Two sliders** to control `max_len` (range 10-200, step 10) and `d_model` (range 8-128, step 8)
- **Click any column** in the heatmap to "select" a dimension — a wave plot below shows that dimension's sin or cos curve as a function of position, with the period annotated
- Hover any cell to see the precise PE[position, dimension] value in a readout
- Caption explains: "different dimensions encode position at different frequencies — low dimensions oscillate quickly, high dimensions oscillate slowly"

**End state:** section 2 of Chapter 6 has a working marquee widget. After 30 seconds of interaction, the reader should be able to (a) recognize the stripe pattern, (b) explain that dimensions are paired (sin, cos) at the same frequency, (c) describe how period varies across the dimension axis.

---

## Inputs

State of the repo after session 28:

- `src/pages/ch06-positional-encoding/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 2 and 5)
- `src/lib/chapters.ts` has Ch 6 as `'draft'`
- `src/components/widgets/index.ts` exports widgets for Ch 1-5
- No `src/components/widgets/ch06/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch06/SinusoidalPE.tsx` — the React widget
2. **Create** `src/components/widgets/ch06/SinusoidalPE.module.css` — scoped styles
3. **Create** `src/components/widgets/ch06/sinusoidal-pe.ts` — the pure PE computation logic (separable from the React view)
4. **Update** `src/components/widgets/index.ts` — add `SinusoidalPE` export
5. **Update** `src/pages/ch06-positional-encoding/index.mdx` — replace section-2's `<WidgetFrame>` interior with `<SinusoidalPE client:visible />`

**Do NOT modify:** any prior chapter widget, the section-5 placeholder, or any other file.

---

## Detailed spec

### Architecture overview

```
src/components/widgets/
├── ch01-05/...                       (sealed)
└── ch06/
    ├── SinusoidalPE.tsx              ← new
    ├── SinusoidalPE.module.css       ← new
    └── sinusoidal-pe.ts              ← new
```

### 1. `sinusoidal-pe.ts` — the data layer

Pure computation, no React. Exports a function that computes PE given `max_len` and `d_model`, plus helper utilities for the wave plot.

```ts
// src/components/widgets/ch06/sinusoidal-pe.ts

/**
 * Compute sinusoidal positional encoding.
 * Returns a (max_len, d_model) 2D array of PE values.
 */
export function sinusoidalPE(maxLen: number, dModel: number, base: number = 10000): number[][] {
  const pe: number[][] = [];
  for (let p = 0; p < maxLen; p++) {
    const row: number[] = [];
    for (let d = 0; d < dModel; d++) {
      const k = Math.floor(d / 2);   // pair index
      const omega = 1 / Math.pow(base, (2 * k) / dModel);
      const angle = p * omega;
      // Even dims: sin; odd dims: cos (matches Vaswani 2017)
      const value = d % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
      row.push(value);
    }
    pe.push(row);
  }
  return pe;
}

/**
 * Compute the period (in positions) for a given dimension.
 * The period is the number of positions over which the sin/cos completes one full cycle.
 */
export function periodForDimension(d: number, dModel: number, base: number = 10000): number {
  const k = Math.floor(d / 2);
  const omega = 1 / Math.pow(base, (2 * k) / dModel);
  return (2 * Math.PI) / omega;
}

/**
 * Compute a single dimension's wave values across all positions.
 * Used by the wave-plot view.
 */
export function waveForDimension(d: number, dModel: number, maxLen: number, base: number = 10000): number[] {
  const k = Math.floor(d / 2);
  const omega = 1 / Math.pow(base, (2 * k) / dModel);
  const wave: number[] = [];
  const fn = d % 2 === 0 ? Math.sin : Math.cos;
  for (let p = 0; p < maxLen; p++) {
    wave.push(fn(p * omega));
  }
  return wave;
}

/** Format a period nicely (e.g. 6.28 → "≈ 6 positions"; 62831 → "≈ 62,831 positions"). */
export function formatPeriod(period: number): string {
  if (period < 100) return `≈ ${period.toFixed(1)} positions`;
  return `≈ ${Math.round(period).toLocaleString()} positions`;
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 700

┌────────────────────────────────────────────────────────────────────┐
│  Sinusoidal positional encoding                                    │
│                                                                    │
│  max_len:  [────●────────────] 50      Reset                       │
│  d_model:  [───────●─────────] 32                                  │
│                                                                    │
│  PE Heatmap — position (y) × dimension (x)                         │
│  ┌──────────────────────────────────────────────────────┐         │
│  │       d0 d1 d2 d3 d4 d5 d6 d7 d8 d9 ...              │         │
│  │   p0  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●                  │         │
│  │   p1  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●                  │         │
│  │   ...                                                │         │
│  │   p50 ●  ●  ●  ●  ●  ●  ●  ●  ●  ●                  │         │
│  └──────────────────────────────────────────────────────┘         │
│  (stripe pattern visible: tight oscillation on left,              │
│   slow oscillation on right)                                       │
│                                                                    │
│  Selected: dimension 4 (pair index 2, sin) — period ≈ 51 positions │
│                                                                    │
│  ┌──────────────────────────────────────────────────────┐         │
│  │ Wave at dimension 4                                  │         │
│  │                                                      │         │
│  │   1.0 ┤    ╱╲      ╱╲      ╱╲                       │         │
│  │       │   ╱  ╲    ╱  ╲    ╱  ╲                      │         │
│  │   0.0 ┤──╱────╲──╱────╲──╱────╲────────             │         │
│  │       │ ╱      ╲╱      ╲╱      ╲                    │         │
│  │  -1.0 ┤╱        ╲      ╱        ╲                   │         │
│  │       └──────────────────────────                   │         │
│  │       0    10   20   30   40   50                   │         │
│  │                  position                            │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                    │
│  Hovered cell: PE[15, 4] = 0.524                                   │
└────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Drag `max_len` slider → heatmap updates with more/fewer rows
- Drag `d_model` slider → heatmap updates with more/fewer columns
- Click any column → wave plot below updates to show that dimension's curve
- Default selected dimension: 4 (a mid-frequency illustrative choice)
- Hover any cell → readout shows the PE value

### 3. `SinusoidalPE.tsx`

```tsx
import { useState, useMemo, useRef, useEffect } from 'react';
import { sinusoidalPE, waveForDimension, periodForDimension, formatPeriod } from './sinusoidal-pe';
import styles from './SinusoidalPE.module.css';

const DEFAULT_MAX_LEN = 50;
const DEFAULT_D_MODEL = 32;
const DEFAULT_SELECTED_DIM = 4;

export default function SinusoidalPE() {
  const [maxLen, setMaxLen] = useState(DEFAULT_MAX_LEN);
  const [dModel, setDModel] = useState(DEFAULT_D_MODEL);
  const [selectedDim, setSelectedDim] = useState(DEFAULT_SELECTED_DIM);
  const [hovered, setHovered] = useState<{ p: number; d: number; v: number } | null>(null);

  // Recompute PE matrix when sliders change
  const pe = useMemo(() => sinusoidalPE(maxLen, dModel), [maxLen, dModel]);

  // Clamp selectedDim if d_model decreases below it
  useEffect(() => {
    if (selectedDim >= dModel) setSelectedDim(dModel - 1);
  }, [dModel, selectedDim]);

  // Wave for the selected dimension
  const wave = useMemo(
    () => waveForDimension(selectedDim, dModel, maxLen),
    [selectedDim, dModel, maxLen]
  );
  const period = periodForDimension(selectedDim, dModel);
  const isSin = selectedDim % 2 === 0;
  const pairIdx = Math.floor(selectedDim / 2);

  function reset() {
    setMaxLen(DEFAULT_MAX_LEN);
    setDModel(DEFAULT_D_MODEL);
    setSelectedDim(DEFAULT_SELECTED_DIM);
  }

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            max_len: <span className={styles.controlValue}>{maxLen}</span>
          </label>
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={maxLen}
            onChange={e => setMaxLen(Number(e.target.value))}
            className={styles.slider}
            aria-label="Maximum sequence length"
          />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            d_model: <span className={styles.controlValue}>{dModel}</span>
          </label>
          <input
            type="range"
            min={8}
            max={128}
            step={8}
            value={dModel}
            onChange={e => setDModel(Number(e.target.value))}
            className={styles.slider}
            aria-label="Model dimension"
          />
        </div>
        <button onClick={reset} className={styles.resetButton}>Reset</button>
      </div>

      {/* Heatmap */}
      <div className={styles.panelTitle}>
        PE matrix — position (rows) × dimension (columns)
      </div>
      <Heatmap
        pe={pe}
        selectedDim={selectedDim}
        onSelectDim={setSelectedDim}
        onHover={setHovered}
      />

      {/* Selected dimension info */}
      <div className={styles.selectedInfo}>
        Selected dimension <strong>d{selectedDim}</strong> (pair {pairIdx}, {isSin ? 'sin' : 'cos'}) — period {formatPeriod(period)}
      </div>

      {/* Wave plot */}
      <WavePlot wave={wave} selectedDim={selectedDim} />

      {/* Hover readout */}
      {hovered && (
        <div className={styles.hoverReadout}>
          PE[p={hovered.p}, d={hovered.d}] = <strong>{hovered.v.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

interface HeatmapProps {
  pe: number[][];
  selectedDim: number;
  onSelectDim: (d: number) => void;
  onHover: (h: { p: number; d: number; v: number } | null) => void;
}

function Heatmap({ pe, selectedDim, onSelectDim, onHover }: HeatmapProps) {
  const maxLen = pe.length;
  const dModel = pe[0]?.length ?? 0;

  // Compute cell size based on widget width — render with a max of e.g. 600px wide
  // We use CSS Grid; cell size is determined by gridTemplateColumns.
  // For large dModel, cells become narrow but still visible.

  return (
    <div className={styles.heatmapContainer}>
      <div
        className={styles.heatmapGrid}
        style={{
          gridTemplateColumns: `repeat(${dModel}, 1fr)`,
          gridTemplateRows: `repeat(${maxLen}, 1fr)`,
          aspectRatio: `${dModel} / ${maxLen}`,
        }}
      >
        {pe.map((row, p) =>
          row.map((v, d) => (
            <div
              key={`${p}-${d}`}
              className={`${styles.heatmapCell} ${d === selectedDim ? styles.cellInSelectedColumn : ''}`}
              style={{ backgroundColor: cellColor(v) }}
              onClick={() => onSelectDim(d)}
              onMouseEnter={() => onHover({ p, d, v })}
              onMouseLeave={() => onHover(null)}
              role="button"
              aria-label={`PE position ${p} dimension ${d}: ${v.toFixed(3)}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

function cellColor(v: number): string {
  // Diverging: -1 (blue) → 0 (transparent) → +1 (red)
  if (v > 0) return `rgba(239, 68, 68, ${Math.min(v, 1).toFixed(3)})`;
  return `rgba(59, 130, 246, ${Math.min(-v, 1).toFixed(3)})`;
}

interface WavePlotProps {
  wave: number[];
  selectedDim: number;
}

function WavePlot({ wave, selectedDim }: WavePlotProps) {
  const WIDTH = 700;
  const HEIGHT = 200;
  const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const n = wave.length;
  if (n === 0) return null;

  // Wave values are in [-1, 1]; map to plot coordinates
  const points = wave.map((v, p) => ({
    x: PADDING.left + (p / (n - 1)) * plotW,
    y: PADDING.top + ((1 - v) / 2) * plotH,
  }));

  const pathD = points.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');

  // Axis ticks
  const xTicks = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];
  const yTicks = [-1, 0, 1];

  return (
    <div className={styles.wavePanel}>
      <div className={styles.panelTitle}>Wave at dimension d{selectedDim}</div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.waveSvg} role="img">
        {/* Y=0 axis line */}
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={PADDING.top + plotH / 2}
          y2={PADDING.top + plotH / 2}
          className={styles.axisLine}
        />
        {/* X axis */}
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={HEIGHT - PADDING.bottom}
          y2={HEIGHT - PADDING.bottom}
          className={styles.axisLine}
        />
        {/* Y axis */}
        <line
          x1={PADDING.left}
          x2={PADDING.left}
          y1={PADDING.top}
          y2={HEIGHT - PADDING.bottom}
          className={styles.axisLine}
        />

        {/* Y tick labels */}
        {yTicks.map(t => (
          <text
            key={`yt-${t}`}
            x={PADDING.left - 8}
            y={PADDING.top + ((1 - t) / 2) * plotH + 4}
            className={styles.tickLabel}
            textAnchor="end"
          >
            {t}
          </text>
        ))}

        {/* X tick labels */}
        {xTicks.map(t => (
          <text
            key={`xt-${t}`}
            x={PADDING.left + (t / (n - 1)) * plotW}
            y={HEIGHT - PADDING.bottom + 18}
            className={styles.tickLabel}
            textAnchor="middle"
          >
            {t}
          </text>
        ))}

        {/* X axis label */}
        <text
          x={PADDING.left + plotW / 2}
          y={HEIGHT - 4}
          className={styles.axisLabel}
          textAnchor="middle"
        >
          position
        </text>

        {/* The wave */}
        <path d={pathD} className={styles.wavePath} fill="none" />
      </svg>
    </div>
  );
}
```

### 4. `SinusoidalPE.module.css`

Match earlier widget CSS conventions. Key new styles:

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
  position: relative;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.controlGroup {
  flex: 1;
  min-width: 200px;
}

.controlLabel {
  display: block;
  margin-bottom: 0.35rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.controlValue {
  color: var(--cyan-300);
  font-weight: 500;
}

.slider {
  width: 100%;
  /* match the scrubber style from earlier widgets */
}

.resetButton {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 200ms, border-color 200ms;
}
.resetButton:hover { color: var(--cyan-300); border-color: var(--cyan-500); }

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
  font-weight: 500;
}

.heatmapContainer {
  width: 100%;
  margin-bottom: 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.75rem;
}

.heatmapGrid {
  display: grid;
  gap: 0;   /* heatmap cells are flush */
  width: 100%;
  /* aspectRatio set inline by the component to maintain proper proportions */
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  overflow: hidden;
}

.heatmapCell {
  cursor: pointer;
  transition: outline 80ms;
  min-width: 0;
  min-height: 0;
}
.heatmapCell:hover {
  outline: 1px solid var(--cyan-500);
  outline-offset: -1px;
  z-index: 1;
}
.cellInSelectedColumn {
  box-shadow: inset 0 0 0 1px var(--cyan-500);
}

.selectedInfo {
  padding: 0.65rem 0.85rem;
  background: color-mix(in srgb, var(--cyan-500) 8%, transparent);
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}
.selectedInfo strong { color: var(--cyan-300); font-weight: 500; }

.wavePanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.waveSvg {
  width: 100%;
  height: auto;
}

.axisLine {
  stroke: var(--border-default);
  stroke-width: 1;
}
.tickLabel {
  fill: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}
.axisLabel {
  fill: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.wavePath {
  stroke: var(--cyan-400);
  stroke-width: 2;
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
  font-size: 0.78rem;
  color: var(--text-primary);
  pointer-events: none;
  z-index: 10;
}
.hoverReadout strong { color: var(--cyan-300); }

@media (max-width: 640px) {
  .controls { flex-direction: column; gap: 0.75rem; }
  .controlGroup { width: 100%; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
export { default as AutogradGraph } from './ch01/AutogradGraph';
export { default as EmbeddingSpace } from './ch02/EmbeddingSpace';
export { default as Word2VecDynamics } from './ch02/Word2VecDynamics';
export { default as BPETraining } from './ch03/BPETraining';
export { default as TokenizerComparison } from './ch03/TokenizerComparison';
export { default as AttentionHeatmap } from './ch04/AttentionHeatmap';
export { default as CausalMask } from './ch04/CausalMask';
export { default as MultiHeadDecomposition } from './ch05/MultiHeadDecomposition';
export { default as TransformerBlockFlow } from './ch05/TransformerBlockFlow';
export { default as SinusoidalPE } from './ch06/SinusoidalPE';
// Session 30 will add:
// export { default as RoPERotation } from './ch06/RoPERotation';
```

### 6. Update `src/pages/ch06-positional-encoding/index.mdx`

**Edit A: Add widget import:**

```mdx
import { SinusoidalPE } from '@components/widgets';
```

**Edit B: Replace section-2's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Sinusoidal positional encoding" caption="The sinusoidal PE matrix as a heatmap: position on the y-axis, dimension on the x-axis. Different dimensions encode position at different frequencies — low dimensions oscillate quickly, high dimensions oscillate slowly. Click any column to see its underlying sin or cos wave plotted below.">
  <SinusoidalPE client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 2 of Ch 6** renders with the working widget. Section 5's placeholder still stubbed.
3. **Initial state:** `max_len = 50`, `d_model = 32`, selected dimension = 4. Heatmap shows the classic stripe pattern: tight oscillation on the left dimensions, broad on the right. Wave plot shows a sine wave (~period 51 positions).
4. **Drag `max_len` slider:** heatmap updates with more/fewer rows. Wave plot's x-axis range updates correspondingly.
5. **Drag `d_model` slider:** heatmap updates with more/fewer columns. The leftmost columns always have tightest oscillation; the rightmost columns always have the broadest. If the selected dimension is now out of bounds, it's clamped to `d_model - 1`.
6. **Click a column:** the column gets a cyan border outline; the wave plot updates to show that dimension's curve; the "Selected dimension" line updates with the period.
7. **The stripe pattern is visually unmistakable:** at default settings, the reader can see:
   - Dimensions 0-3 (leftmost): tight horizontal stripes (fast oscillation)
   - Dimensions 28-31 (rightmost): nearly constant colors across all rows (slow oscillation)
   - Smooth gradient between
8. **Hover any cell:** the hover readout shows `PE[p=X, d=Y] = Z.ZZZ` with the precise value.
9. **Reset button:** restores defaults.
10. **Mobile:** controls stack vertically; heatmap maintains aspect ratio; wave plot scales via SVG viewBox.
11. **`npm run typecheck`** passes.
12. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement a learned PE comparison view.** The marquee is sinusoidal-only; the chapter prose covers learned PE in section 4 with a separate `<RunnableCode>`.
- ❌ **Do not implement a RoPE comparison view.** Session 30 owns RoPE's widget.
- ❌ **Do not let the user adjust the base (10000).** Fixed for simplicity. The chapter prose mentions the base in section 2.
- ❌ **Do not animate / auto-play.** This is an exploratory widget, not a stage-based one. Static until the user interacts.
- ❌ **Do not modify Ch 6's section-5 placeholder.** Session 30 owns it.
- ❌ **Do not flip Ch 6's status.** Stays `'draft'` until session 30.

---

## Wire-up

```bash
git add src/components/widgets/ch06/ src/components/widgets/index.ts src/pages/ch06-positional-encoding/index.mdx
git commit -m "session 29: sinusoidal PE marquee widget — stripe heatmap + per-dimension wave inspector"
git push origin main
```

Verify on production:
- Stripe pattern is immediately obvious at default settings
- Slider changes update the heatmap smoothly
- Clicking columns updates the wave plot correctly

---

## Notes for the session author

**On the stripe pattern being "iconic":**
The sinusoidal PE heatmap is the most-reproduced visualization in transformer pedagogy — every blog post, every textbook, every conference talk that explains transformers shows some version of this image. The widget makes it interactive. Calibrate the default settings (max_len = 50, d_model = 32) so the stripe pattern is *immediately* visible — not a square grid that obscures the frequency variation, not so many dimensions that the leftmost stripes blur.

**On the diverging color scale:**
PE values are in [-1, 1]. Use red for positive, blue for negative, with white near zero. Same diverging scale as Ch 4's attention heatmap and Ch 5's block-flow data matrix. Consistent across the project.

**On dimensions being paired (sin, cos):**
Even dimensions are sin; odd dimensions are cos. The "Selected dimension" info displays this explicitly: "dimension 4 (pair 2, sin)". Helps the reader connect the formula to the visualization.

**On the wave plot:**
The wave plot is a simple SVG line chart with axes. It shows a single dimension's sin or cos curve. Period is annotated in the info line above. Why not just plot all dimensions? Because the stripe pattern in the heatmap *already* shows all dimensions at once; the wave plot is for *focused inspection* of a single dimension.

**On the period formatting:**
`formatPeriod` produces readable output: `"≈ 51 positions"` for short periods, `"≈ 62,831 positions"` for long ones. Don't show fractional positions for long periods — meaningless precision.

**On `useMemo` for PE:**
Recomputing the entire PE matrix on every render would be wasteful if other state changes (e.g., the hover state). `useMemo([maxLen, dModel])` caches the matrix. The selected-dim wave is computed only when `selectedDim`, `dModel`, or `maxLen` change.

**On the cell color computation:**
Inline `backgroundColor` styles per cell. No CSS variables for cell colors because each cell has a unique value. For very large `max_len * d_model` (e.g., 200 × 128 = 25,600 cells), this creates many DOM nodes — but React handles it fine because the cells are unchanging until a slider moves. If performance becomes an issue, the heatmap could be rendered as a single canvas; for now, DOM cells are simpler and acceptable.

**Pedagogical claim this widget supports:** "Sinusoidal positional encoding is a multi-frequency code. Adjacent dimensions form (sin, cos) pairs at the same frequency. Different pairs use different frequencies — high frequencies (left) distinguish nearby positions; low frequencies (right) distinguish far positions. The 'stripe pattern' in the heatmap is this frequency variation made visible." If the reader walks away with that mental model, the widget has succeeded.

This is the iconic Ch 6 visual. After interacting with it for 30 seconds, the reader should never look at a static PE diagram in a paper the same way again. Build with care.
