# Session 84 — Ch 18 granularity visualizer + exercises + closeout

> **The Chapter 18 closeout.** Three deliverables: (1) implement the **Granularity Visualizer** secondary widget — a weight matrix heatmap with one outlier row, quantized at INT4 with three granularities (per-tensor / per-channel / per-group), showing how granularity affects quality; (2) add an **Exercises section** with 4 problems (symmetric quantization, per-channel matrix quantization, per-group with adjustable G, NF4 level construction); (3) flip Ch 18's status from `'draft'` to `'published'`. **Closes Ch 18 — the densest chapter of Phase 12.**

This is a **single-topic chapter** (4-file cadence). The secondary widget gets combined with exercises in this final session — the standard closeout pattern.

---

## Read first (in this order)

1. **`research/ch18-quantization/research.md`** — concepts 2-5 and the granularity discussion
2. **`prompts/chapters/ch18-quantization/session-82-page-structure.md`** — for the section-3 widget placeholder and exercise placement
3. **`prompts/chapters/ch18-quantization/session-83-quantization-explorer-widget.md`** — for the Ch 18 widget conventions
4. **`prompts/chapters/ch17-inference-optimization/session-79-speculative-decoding-and-exercises-and-closeout.md`** — for the recent Phase 12 closeout pattern

---

## Goal

By end of session, three things change in the repo:

1. **`GranularityVisualizer` widget** is implemented and wired into section 3 of Ch 18. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("Activation quantization") and section 8 ("The full picture"). Four exercises with hints + runnable starter code.
3. **Ch 18's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. Ch 18 is the eighteenth published chapter — and the second of Phase 12.

After this session: **Ch 18 is complete.** Phase 12 is 2/3 done; Ch 19 (sampling) remains.

---

## Inputs

State of the repo after session 83:

- Section 2's `QuantizationExplorer` marquee widget is wired
- Section 3's widget is still stubbed
- All 3 runnable code blocks from session 82 are in place
- `src/lib/chapters.ts` has Ch 1-17 `'published'`, Ch 18 `'draft'`
- `src/components/widgets/ch18/` exists with one widget already

---

## Deliverables

1. **Create** `src/components/widgets/ch18/GranularityVisualizer.tsx` — the React widget
2. **Create** `src/components/widgets/ch18/GranularityVisualizer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch18/granularity-data.ts` — weight matrix + granularity-specific quantization
4. **Update** `src/components/widgets/index.ts` — add `GranularityVisualizer` export
5. **Update** `src/pages/ch18-quantization/index.mdx`:
   - Replace section-3's `<WidgetFrame>` interior with `<GranularityVisualizer client:visible />`
   - Insert new `## Exercises` section between section 7 ("Activation quantization") and section 8 ("The full picture")
6. **Update** `src/lib/chapters.ts` — change Ch 18's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 18's marquee widget is sealed.

---

## Detailed spec

### Part A — `GranularityVisualizer` widget

#### A.1 `granularity-data.ts`

```ts
// src/components/widgets/ch18/granularity-data.ts

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boxMuller(rand: () => number): number {
  const u1 = rand();
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export const ROWS = 8;
export const COLS = 64;
export const N_BITS = 4;

/**
 * Generate the demo weight matrix.
 * Row 0 is an outlier row (10× amplitude) — pedagogically the most interesting case.
 * Other rows: noise + occasional larger within-row variation in some columns.
 */
export function generateMatrix(seed: number = 42): number[][] {
  const rand = mulberry32(seed);
  const W: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: number[] = [];
    const isOutlier = r === 0;
    const baseStd = 0.1;
    const scale = isOutlier ? 10 : 1;
    
    // Add some within-row variation: a "hot region" in some columns
    const hotStart = Math.floor(rand() * COLS);
    const hotEnd = Math.min(hotStart + 16, COLS);
    
    for (let c = 0; c < COLS; c++) {
      const inHotRegion = c >= hotStart && c < hotEnd;
      const localScale = inHotRegion && !isOutlier ? 2.5 : 1;
      row.push(boxMuller(rand) * baseStd * scale * localScale);
    }
    W.push(row);
  }
  return W;
}

export const WEIGHT_MATRIX = generateMatrix(42);

export type Granularity = 'per-tensor' | 'per-channel' | 'per-group';

/** Quantize symmetrically at given bit width. */
function quantizeValue(v: number, scale: number, qmin: number, qmax: number): number {
  const intVal = Math.max(qmin, Math.min(qmax, Math.round(v / scale)));
  return intVal * scale;
}

/** Apply quantization at a given granularity. */
export function quantizeMatrix(
  W: number[][],
  granularity: Granularity,
  groupSize: number = 32,
  nBits: number = N_BITS,
): {
  quantized: number[][];
  numScales: number;
  scaleStorageBytes: number;
} {
  const qmax = Math.pow(2, nBits - 1) - 1;
  const qmin = -qmax - 1;
  const rows = W.length;
  const cols = W[0]!.length;
  const quantized: number[][] = W.map(row => row.slice());

  if (granularity === 'per-tensor') {
    let absMax = 0;
    for (const row of W) for (const v of row) absMax = Math.max(absMax, Math.abs(v));
    const scale = absMax / qmax;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        quantized[r]![c] = quantizeValue(W[r]![c]!, scale, qmin, qmax);
      }
    }
    return { quantized, numScales: 1, scaleStorageBytes: 4 };
  }

  if (granularity === 'per-channel') {
    for (let r = 0; r < rows; r++) {
      let absMax = 0;
      for (const v of W[r]!) absMax = Math.max(absMax, Math.abs(v));
      const scale = absMax === 0 ? 1 : absMax / qmax;
      for (let c = 0; c < cols; c++) {
        quantized[r]![c] = quantizeValue(W[r]![c]!, scale, qmin, qmax);
      }
    }
    return { quantized, numScales: rows, scaleStorageBytes: rows * 4 };
  }

  // per-group
  const numGroupsPerRow = Math.floor(cols / groupSize);
  for (let r = 0; r < rows; r++) {
    for (let g = 0; g < numGroupsPerRow; g++) {
      const start = g * groupSize;
      const end = start + groupSize;
      let absMax = 0;
      for (let c = start; c < end; c++) absMax = Math.max(absMax, Math.abs(W[r]![c]!));
      const scale = absMax === 0 ? 1 : absMax / qmax;
      for (let c = start; c < end; c++) {
        quantized[r]![c] = quantizeValue(W[r]![c]!, scale, qmin, qmax);
      }
    }
  }
  const numScales = rows * numGroupsPerRow;
  return { quantized, numScales, scaleStorageBytes: numScales * 4 };
}

/** Per-row MSE for the error heatmap. */
export function perRowMSE(W: number[][], Q: number[][]): number[] {
  return W.map((row, r) => {
    let sumSq = 0;
    for (let c = 0; c < row.length; c++) {
      const e = row[c]! - Q[r]![c]!;
      sumSq += e * e;
    }
    return sumSq / row.length;
  });
}

/** Overall MSE. */
export function overallMSE(W: number[][], Q: number[][]): number {
  let sumSq = 0, count = 0;
  for (let r = 0; r < W.length; r++) {
    for (let c = 0; c < W[r]!.length; c++) {
      const e = W[r]![c]! - Q[r]![c]!;
      sumSq += e * e;
      count++;
    }
  }
  return sumSq / count;
}

/** Effective bits per weight including scale storage. */
export function effectiveBits(numScales: number, totalWeights: number, nBits: number): number {
  return nBits + (numScales * 32) / totalWeights;
}
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 700

┌────────────────────────────────────────────────────────────────┐
│ Granularity visualizer                                           │
│                                                                  │
│ Setup: 8 × 64 weight matrix, one outlier row (10× larger)        │
│ Bit width: INT4 (fixed)                                          │
│                                                                  │
│ Granularity: [Per-tensor]  [Per-channel]  [Per-group]            │
│ Group size (per-group only): [─────●─────]  G = 32               │
│                                                                  │
│ Original matrix (heatmap):                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ row 0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ← outlier (10× amplitude) │ │
│ │ row 1 ░░▒▒░░░░░░▒▒▒▒░░░░░░░░░░░░░░                          │ │
│ │ row 2 ░░░░░░░░░░░░░░░░░░░░░░▒▒▒░░                          │ │
│ │ ...                                                           │ │
│ │ row 7 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Quantized matrix (current granularity):                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ row 0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                            │ │
│ │ row 1 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ← stuck at one value         │ │
│ │ row 2 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ (per-tensor: outlier destroys│ │
│ │ ...                              non-outlier rows)            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Per-row MSE:                                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ row 0  ███ 0.0002 (outlier — preserved by its own scale)     │ │
│ │ row 1  ████████████ 0.0089  (per-tensor: lots of error)      │ │
│ │ row 2  ███████████ 0.0078                                    │ │
│ │ ...                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Metrics:                                                          │
│  • Number of scales:      1 (per-tensor)                         │
│  • Scale storage:         4 bytes                                │
│  • Effective bits/weight: 4.008                                  │
│  • Overall MSE:           0.0067                                 │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click granularity button: instantly updates the quantized matrix and metrics
- Group size slider (only active for per-group): 16, 32, 64 (must divide 64 evenly)
- Original matrix is fixed; the same throughout
- Quantized matrix is the heatmap that updates
- Per-row MSE bars update
- Metrics update

**Visual encoding:**
- **Heatmap colors**: weight value → color
  - Large negative: rose (deep red)
  - Negative: rose (lighter)
  - Near zero: dark gray
  - Positive: cyan (lighter)
  - Large positive: cyan (deep cyan)
- **Original outlier row** clearly visible (highest contrast)
- **Quantized matrix** shows the discretization — colors snap to grid points

#### A.3 `GranularityVisualizer.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  WEIGHT_MATRIX, ROWS, COLS, N_BITS,
  quantizeMatrix, perRowMSE, overallMSE, effectiveBits,
  type Granularity,
} from './granularity-data';
import styles from './GranularityVisualizer.module.css';

const GROUP_SIZES = [16, 32, 64];

export default function GranularityVisualizer() {
  const [granularity, setGranularity] = useState<Granularity>('per-tensor');
  const [groupSize, setGroupSize] = useState(32);

  const result = useMemo(
    () => quantizeMatrix(WEIGHT_MATRIX, granularity, groupSize, N_BITS),
    [granularity, groupSize]
  );
  const rowMSEs = useMemo(() => perRowMSE(WEIGHT_MATRIX, result.quantized), [result.quantized]);
  const totalMSE = useMemo(() => overallMSE(WEIGHT_MATRIX, result.quantized), [result.quantized]);
  const totalWeights = ROWS * COLS;
  const effBits = effectiveBits(result.numScales, totalWeights, N_BITS);

  // Color helper for heatmap (value → CSS color)
  function valueToColor(v: number, absMax: number): string {
    const norm = Math.max(-1, Math.min(1, v / absMax));
    if (norm > 0) {
      // Cyan side
      const intensity = Math.min(255, Math.round(norm * 255));
      return `rgb(${Math.round(intensity * 0.3)}, ${Math.round(intensity * 0.85)}, ${intensity})`;
    } else {
      // Rose side
      const intensity = Math.min(255, Math.round(-norm * 255));
      return `rgb(${intensity}, ${Math.round(intensity * 0.35)}, ${Math.round(intensity * 0.45)})`;
    }
  }

  // Use the original matrix's max magnitude for consistent coloring
  const matrixAbsMax = Math.max(...WEIGHT_MATRIX.flat().map(Math.abs));

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Granularity visualizer</div>
        <div className={styles.titleSubLabel}>
          <strong>{ROWS} × {COLS}</strong> matrix, one outlier row (10× amplitude); quantized at <strong>INT{N_BITS}</strong>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Granularity:</span>
          <div className={styles.granularityButtons}>
            {(['per-tensor', 'per-channel', 'per-group'] as Granularity[]).map(g => (
              <button
                key={g}
                className={`${styles.granularityButton} ${granularity === g ? styles.granularityButtonActive : ''}`}
                onClick={() => setGranularity(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Group size:</span>
          <div className={styles.groupButtons}>
            {GROUP_SIZES.map(g => (
              <button
                key={g}
                className={`${styles.groupButton} ${groupSize === g && granularity === 'per-group' ? styles.groupButtonActive : ''}`}
                onClick={() => setGroupSize(g)}
                disabled={granularity !== 'per-group'}
              >G = {g}</button>
            ))}
          </div>
          <span className={styles.controlHint}>
            (only active for per-group)
          </span>
        </div>
      </div>

      {/* Original matrix */}
      <div className={styles.matrixPanel}>
        <div className={styles.matrixTitle}>Original matrix</div>
        <Heatmap matrix={WEIGHT_MATRIX} absMax={matrixAbsMax} colorFn={valueToColor} />
        <div className={styles.outlierNote}>
          ▲ Row 0 is the outlier (10× larger weights)
        </div>
      </div>

      {/* Quantized matrix */}
      <div className={styles.matrixPanel}>
        <div className={styles.matrixTitle}>Quantized matrix ({granularity})</div>
        <Heatmap matrix={result.quantized} absMax={matrixAbsMax} colorFn={valueToColor} />
      </div>

      {/* Per-row MSE */}
      <div className={styles.msePanel}>
        <div className={styles.mseTitle}>Per-row MSE</div>
        <div className={styles.mseBars}>
          {rowMSEs.map((mse, r) => {
            const maxMSE = Math.max(...rowMSEs);
            const widthPct = maxMSE > 0 ? (mse / maxMSE) * 100 : 0;
            const isOutlier = r === 0;
            return (
              <div key={r} className={styles.mseRow}>
                <span className={styles.mseRowLabel}>row {r}</span>
                <div className={styles.mseBarTrack}>
                  <div
                    className={`${styles.mseBar} ${isOutlier ? styles.mseBarOutlier : ''}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className={styles.mseValue}>{mse.toExponential(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.metricsPanel}>
        <div className={styles.metricsTitle}>Metrics</div>
        <div className={styles.metricsBody}>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Number of scales:</span>
            <span className={styles.metricValue}>{result.numScales.toLocaleString()}</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Scale storage:</span>
            <span className={styles.metricValue}>{result.scaleStorageBytes} bytes</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Effective bits/weight:</span>
            <span className={styles.metricValue}>{effBits.toFixed(3)}</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Overall MSE:</span>
            <span className={styles.metricValue}>{totalMSE.toExponential(2)}</span>
          </div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Watch the granularity progression: <strong>per-tensor</strong> uses one scale, destroyed by the outlier row;
        non-outlier rows lose almost all resolution. <strong>Per-channel</strong> gives each row its own scale —
        the outlier row is fine, and the rest are well-preserved. <strong>Per-group</strong> goes further: even
        within-row variation gets its own scale, recovering quality further at the cost of more scale storage.
        At INT4 with per-group + G=32: <strong>essentially the production recipe.</strong>
      </div>
    </div>
  );
}

interface HeatmapProps {
  matrix: number[][];
  absMax: number;
  colorFn: (v: number, absMax: number) => string;
}
function Heatmap({ matrix, absMax, colorFn }: HeatmapProps) {
  const rows = matrix.length;
  const cols = matrix[0]!.length;
  const W = 720;
  const H = 100;
  const cellW = W / cols;
  const cellH = H / rows;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.heatmapSvg} role="img" aria-label="Weight matrix heatmap">
      {matrix.map((row, r) =>
        row.map((v, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * cellW} y={r * cellH}
            width={cellW + 0.3} height={cellH + 0.3}
            fill={colorFn(v, absMax)}
          />
        ))
      )}
    </svg>
  );
}
```

#### A.4 `GranularityVisualizer.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .matrixPanel, .msePanel, .metricsPanel, .caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.titlePanel { padding: 0.7rem 1rem; }
.titleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  color: var(--text-primary);
  font-weight: 500;
}
.titleSubLabel {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}
.titleSubLabel strong { color: var(--cyan-300); }

/* Controls */
.controlRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.controlRow:last-child { margin-bottom: 0; }
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 110px;
}
.controlHint {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  font-style: italic;
}
.granularityButtons, .groupButtons {
  display: flex;
  gap: 0.3rem;
}
.granularityButton, .groupButton {
  padding: 0.35rem 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.granularityButton:hover:not(:disabled), .groupButton:hover:not(:disabled) {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.granularityButton:disabled, .groupButton:disabled { opacity: 0.35; cursor: not-allowed; }
.granularityButtonActive, .groupButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Matrix */
.matrixTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
  font-weight: 500;
}
.heatmapSvg {
  width: 100%;
  height: auto;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.outlierNote {
  margin-top: 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--rose-400);
  font-style: italic;
}

/* MSE bars */
.mseTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.mseBars { display: flex; flex-direction: column; gap: 0.2rem; }
.mseRow {
  display: grid;
  grid-template-columns: 60px 1fr 90px;
  gap: 0.6rem;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.mseRowLabel { color: var(--text-secondary); text-align: right; }
.mseBarTrack {
  height: 18px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 2px;
  overflow: hidden;
}
.mseBar {
  height: 100%;
  background: linear-gradient(90deg, var(--cyan-700), var(--cyan-400));
  transition: width 200ms ease-out;
}
.mseBarOutlier {
  background: linear-gradient(90deg, var(--rose-700, #881337), var(--rose-400));
}
.mseValue { color: var(--text-secondary); text-align: right; font-size: 0.72rem; }

/* Metrics */
.metricsTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
  font-weight: 500;
}
.metricsBody { display: flex; flex-direction: column; gap: 0.25rem; }
.metricRow {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.metricLabel { color: var(--text-secondary); }
.metricValue { color: var(--text-primary); font-weight: 500; }

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .controlRow { flex-direction: column; align-items: flex-start; }
  .controlLabel { min-width: 0; }
  .granularityButton, .groupButton { padding: 0.3rem 0.5rem; font-size: 0.7rem; }
  .mseRow { grid-template-columns: 50px 1fr 70px; gap: 0.4rem; font-size: 0.7rem; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as QuantizationExplorer } from './ch18/QuantizationExplorer';
export { default as GranularityVisualizer } from './ch18/GranularityVisualizer';
```

#### A.6 Update `src/pages/ch18-quantization/index.mdx`

**Edit A: Update widget import:**

```mdx
import { QuantizationExplorer, GranularityVisualizer } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Granularity visualizer" caption="An 8 × 64 weight matrix with one outlier row (10× larger). Quantize at INT4 with three granularities: per-tensor (one scale; outlier destroys quality), per-channel (one per row; outlier handled), per-group (G=16/32/64; even within-row variation handled). Toggle to see how per-row MSE changes. The widget makes 'why per-group matters' visceral.">
  <GranularityVisualizer client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("Activation quantization") and section 8 ("The full picture"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Symmetric quantization

Implement the basic symmetric quantization mapping. Compute scale, quantize, dequantize, and verify the per-weight error is bounded by $s/2$.

<details>
<summary>Hint</summary>

Symmetric quantization:
$$x_{\text{int}} = \text{clip}\!\left(\text{round}(x/s), \;-q_{\max}-1, \; q_{\max}\right)$$

with $s = \max(|x|) / q_{\max}$ and $q_{\max} = 2^{n-1} - 1$.

Dequantization: $\hat x = s \cdot x_{\text{int}}$.

The rounding error per weight is bounded by $|x - \hat x| \leq s/2$ (worst case: a weight exactly halfway between two grid points).

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def quantize_symmetric(x, n_bits=8):
    """
    Symmetric quantization.
    Returns: (x_int, scale).
    """
    # TODO:
    # 1. Compute qmax = 2**(n_bits - 1) - 1
    # 2. Compute scale = max(|x|) / qmax
    # 3. Quantize: round(x / scale), clip to [-qmax-1, qmax]
    # 4. Return (x_int as int32, scale as float)
    pass

def dequantize_symmetric(x_int, scale):
    """Inverse: ~ x ≈ scale * x_int."""
    return scale * x_int.astype(np.float32)

# Test
np.random.seed(0)
W = np.random.normal(0, 0.1, 100)

print(f"{'Bits':>5} | {'MSE':>12} | {'Max err':>10} | {'Bound s/2':>12}")
print("-" * 50)
for n_bits in [8, 4, 2]:
    # W_int, scale = quantize_symmetric(W, n_bits=n_bits)
    # W_dq = dequantize_symmetric(W_int, scale)
    # mse = ((W - W_dq) ** 2).mean()
    # max_err = np.abs(W - W_dq).max()
    # bound = scale / 2
    # print(f"{n_bits:>5} | {mse:>12.7f} | {max_err:>10.6f} | {bound:>12.6f}")
    pass

# Verify:
# - Max error should be ≤ scale/2 for every weight
# - MSE shrinks as n_bits grows
# - At 2 bits, error is huge; at 8 bits, error is tiny
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Per-channel quantization

Implement per-channel symmetric quantization for a weight matrix. Each row gets its own scale.

<details>
<summary>Hint</summary>

For a weight matrix $W \in \mathbb{R}^{R \times C}$:
- Compute the per-row absmax: a vector of $R$ values
- Scale per row: $s_r = \text{absmax}_r / q_{\max}$
- Quantize each row using its own scale

Setup: create a matrix where one row has 10× larger weights than others (an outlier row). Compare per-tensor (single scale; destroyed by outlier) to per-channel (each row independent).

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def quantize_per_tensor(W, n_bits=4):
    qmax = 2**(n_bits - 1) - 1
    scale = np.abs(W).max() / qmax
    return np.round(W / scale).clip(-qmax-1, qmax) * scale

def quantize_per_channel(W, n_bits=4):
    """
    Per-channel quantization. One scale per row (output dimension).
    """
    # TODO:
    # 1. Compute qmax
    # 2. Compute per-row absmax: shape (R, 1)
    # 3. Scales: shape (R, 1)
    # 4. Quantize each row independently
    # 5. Dequantize and return
    pass

# Setup
np.random.seed(0)
W = np.random.normal(0, 0.1, (8, 64))
W[0] *= 10   # outlier row

# Compare
# W_pt = quantize_per_tensor(W, n_bits=4)
# W_pc = quantize_per_channel(W, n_bits=4)

# print(f"Per-tensor MSE: {((W - W_pt) ** 2).mean():.6f}")
# print(f"Per-channel MSE: {((W - W_pc) ** 2).mean():.6f}")
# 
# # Compare per-row MSE
# print(f"\\nPer-row MSE comparison:")
# print(f"{'Row':>3} | {'Per-tensor':>12} | {'Per-channel':>12}")
# print("-" * 35)
# for r in range(W.shape[0]):
#     pt_mse = ((W[r] - W_pt[r]) ** 2).mean()
#     pc_mse = ((W[r] - W_pc[r]) ** 2).mean()
#     marker = ' ← outlier' if r == 0 else ''
#     print(f"{r:>3} | {pt_mse:>12.6f} | {pc_mse:>12.6f}{marker}")
# 
# # Observation:
# # - Per-tensor: the outlier row sets scale; non-outlier rows have huge error
# # - Per-channel: each row has its own scale; all rows preserved
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Per-group quantization

Implement per-group symmetric quantization with adjustable group size. Compare to per-channel.

<details>
<summary>Hint</summary>

Per-group: within each row, split into groups of $G$ consecutive weights and quantize each group with its own scale.

For row $r$ and group $g$ (spanning columns $g \cdot G$ to $(g+1) \cdot G - 1$):
- $s_{r,g} = \max(|W_{r, g \cdot G : (g+1) \cdot G}|) / q_{\max}$
- Quantize this slice with $s_{r,g}$

Group size choices: $G = 16, 32, 64, 128$. Smaller = better quality but more scale overhead. Standard for production: $G = 64$ or $G = 128$.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def quantize_per_group(W, n_bits=4, group_size=32):
    """
    Per-group quantization. One scale per group of group_size consecutive weights within a row.
    """
    # TODO:
    # 1. Compute qmax
    # 2. For each row:
    #    For each group g:
    #      Compute scale from absmax of W[r, g*G : (g+1)*G]
    #      Quantize that group with its own scale
    # 3. Return dequantized matrix
    pass

# Setup: matrix with outlier row + within-row variation
np.random.seed(0)
W = np.random.normal(0, 0.1, (8, 64))
W[0] *= 10                                         # outlier row
W[1:, 20:40] *= 3                                  # within-row "hot region" in non-outlier rows

# Compare group sizes
# print(f"{'Group size':<15} | {'Overall MSE':>15} | {'Scales':>8}")
# print("-" * 50)
# for G in [16, 32, 64]:
#     W_q = quantize_per_group(W, n_bits=4, group_size=G)
#     mse = ((W - W_q) ** 2).mean()
#     num_scales = W.shape[0] * (W.shape[1] // G)
#     print(f"G = {G:<11} | {mse:>15.6f} | {num_scales:>8}")
# 
# # Compare to per-channel
# # from above: per-channel uses 8 scales (one per row)
# 
# # Observation:
# # - Smaller G = better MSE (per-group handles within-row variation)
# # - More scales = more storage overhead
# # - G = 32 or 64 is the sweet spot in practice
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — NF4 quantization

Implement NF4 quantization: 16 levels at equiprobable normal quantiles, with per-group scaling. Compare to INT4 per-group on normally-distributed weights.

<details>
<summary>Hint</summary>

NF4 levels are placed at the equiprobable quantiles of a standard normal distribution. Compute via `scipy.stats.norm.ppf`:

For 16 levels (symmetric construction):
- Place 8 levels in the positive half at quantile midpoints
- Mirror to get the negative half
- Normalize so the absolute max is 1.0

For per-group NF4:
- For each group, compute scale = max(|chunk|)
- Normalize chunk by scale
- For each value, find the nearest NF4 level
- Dequantize: nearest level × scale

Compare to INT4 per-group on the same normally-distributed weights. Expectation: NF4 has lower MSE because levels are denser where weights are dense.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np
from scipy.stats import norm

def compute_nf4_levels():
    """16 NF4 levels via equiprobable normal quantiles."""
    # TODO:
    # 1. For i in 0..7: place a level at the midpoint of the i-th equiprobable bin
    #    (use norm.ppf to get the quantile)
    # 2. Mirror to get 16 total levels (negative + positive)
    # 3. Normalize so abs max is 1.0
    pass

NF4_LEVELS = compute_nf4_levels()
# print(f"NF4 levels: {NF4_LEVELS}")

def quantize_nf4_per_group(W, group_size=32):
    """Per-group NF4 quantization."""
    # TODO:
    # 1. For each row, for each group of group_size weights:
    #    a. Compute scale = max(|chunk|)
    #    b. Normalize: chunk / scale
    #    c. For each value, find argmin distance to NF4_LEVELS
    #    d. Dequantize: NF4_LEVELS[idx] * scale
    pass

def quantize_int4_per_group(W, group_size=32):
    """Per-group INT4 quantization for comparison."""
    qmax = 7
    R, C = W.shape
    out = np.zeros_like(W)
    for g in range(C // group_size):
        start, end = g * group_size, (g + 1) * group_size
        for r in range(R):
            chunk = W[r, start:end]
            scale = np.abs(chunk).max() / qmax
            if scale > 0:
                out[r, start:end] = np.round(chunk / scale).clip(-qmax-1, qmax) * scale
    return out

# Compare on normally-distributed weights
# np.random.seed(0)
# W = np.random.normal(0, 0.1, (64, 256))
# 
# W_int4 = quantize_int4_per_group(W, group_size=32)
# W_nf4 = quantize_nf4_per_group(W, group_size=32)
# 
# print(f"\\nMSE on N(0, 0.1) weights:")
# print(f"  INT4 per-group: {((W - W_int4) ** 2).mean():.7f}")
# print(f"  NF4  per-group: {((W - W_nf4) ** 2).mean():.7f}")
# 
# # Observation:
# # - NF4 places more levels near zero (where weights live)
# # - Fewer levels in the tails (where weights are sparse)
# # - Result: lower MSE on normally-distributed weights
# # - This is the format behind QLoRA (Ch 15)
`}
  packages={["numpy", "scipy"]}
/>

````

### Part C — Flip Ch 18's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 18, slug: 'ch18-quantization', title: 'Quantization', partNum: 6, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 18 still render correctly (no changes to existing sections).
3. **Section 2's** `QuantizationExplorer` marquee widget still renders correctly.
4. **Section 3** now renders the working `GranularityVisualizer` widget.
5. **Default state**: granularity = per-tensor, group size = 32 (disabled since per-tensor).
6. **Three granularity buttons**: per-tensor, per-channel, per-group. Active button highlighted in cyan.
7. **Group size buttons** (16, 32, 64): disabled unless granularity = per-group. Active button highlighted when per-group is selected.
8. **Original matrix heatmap**: 8 rows × 64 cols. Row 0 visibly more saturated (10× amplitude). Other rows have "hot regions" — clusters of larger weights in some columns.
9. **Quantized matrix heatmap**: updates with granularity choice.
   - **Per-tensor**: non-outlier rows look very flat (heavy quantization noise — only ~16 distinct values across the whole matrix)
   - **Per-channel**: outlier row preserved; non-outlier rows preserved per their own scale
   - **Per-group at G=32**: even within-row hot regions preserved
10. **Per-row MSE bar chart**: 8 bars. Outlier row's bar is colored **rose**; other rows are cyan.
    - **Per-tensor**: outlier row has small MSE (its own scale fits); other rows have HUGE MSE
    - **Per-channel**: all rows have small MSE
    - **Per-group**: all rows have smallest MSE
11. **Metrics panel** updates with each granularity choice:
    - Per-tensor: 1 scale, 4 bytes, ~4.008 eff bits/weight
    - Per-channel: 8 scales, 32 bytes, ~4.063 eff bits/weight
    - Per-group at G=32: 16 scales, 64 bytes, ~4.125 eff bits/weight
    - Per-group at G=16: 32 scales, 128 bytes, ~4.25 eff bits/weight
12. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
13. **Sidebar**: Ch 1-18 all active (published); Ch 19-30 still dimmed.
14. **Prev/next at bottom of Ch 18**: prev = Ch 17 (active); next = Ch 19 (disabled).
15. **TOC**: includes Exercises as h2 between section 7 and section 8.
16. **Mobile**: controls stack; heatmaps stay readable.
17. **`npm run typecheck`** passes.
18. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not animate transitions** between granularities — click is sufficient.
- ❌ **Do not flip any other chapter's status.** Only Ch 18 flips.
- ❌ **Do not modify Ch 1-17.** Sealed.
- ❌ **Do not modify Ch 18's marquee widget.** Sealed.
- ❌ **Do not modify Ch 18 prose sections 1-8.** Sealed. (Only insert the new Exercises section between sections 7 and 8.)
- ❌ **Do not implement GPTQ or AWQ in the widget.** They're conceptually different (calibration-based); not visualizable cleanly.
- ❌ **Do not allow user-provided matrices.** Fixed example only.

---

## Wire-up

```bash
git add src/components/widgets/ch18/GranularityVisualizer.tsx src/components/widgets/ch18/GranularityVisualizer.module.css src/components/widgets/ch18/granularity-data.ts src/components/widgets/index.ts src/pages/ch18-quantization/index.mdx src/lib/chapters.ts
git commit -m "session 84: Ch 18 closeout — granularity visualizer + exercises + status: published"
git push origin main
```

---

## Ch 18 closeout

Chapter 18 is now the eighteenth complete chapter on production. **Phase 12 is 2/3 done** — Ch 19 (sampling) remains.

Confirm before declaring Ch 18 done:

- ✅ BUILD_ORDER.md shows files 104-107 ✅
- ✅ File 108 marked ⏭️ (absorbed; would have been a separate exercise file in 5-file cadence; absorbed into closeout for 4-file cadence)
- ✅ Ch 18 status is `'published'`
- ✅ Both Ch 18 widgets work in production
- ✅ All 4 Ch 18 exercises render with their starter code

**Cadence check across 18 chapters:**

**4-file cadence** holds for **13 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, **18**).
**5-file cadence** holds for **5 two-topic chapters** (Ch 1, 5, 8, 9, 14).

**18-chapter pattern stable.**

**Phase 12 (Inference) status:**
- ✅ Ch 17 (Inference Optimization)
- ✅ Ch 18 (Quantization)
- ⬜ Ch 19 (Sampling) — next, single-topic, 4-file. **Closes Phase 12.**

**What's next — Ch 19: Sampling.** Where Ch 17 reduced wasted computation and Ch 18 reduced bits per parameter, Ch 19 covers **how decisions are made about which token to emit**, given the logits. Top-k, top-p (nucleus), temperature, beam search, constrained decoding (JSON, regex), repetition penalties, mirostat. Closes Phase 12 — and the inference-engineering arc.

---

## Notes for the session author

**On the secondary widget showing the chapter's most important quality lever:**
Section 3 of the prose argued that **granularity affects quality more than almost any other choice**. The widget makes this claim visible. **Per-tensor at INT4 is destroyed by the outlier row; per-channel recovers most of it; per-group recovers within-row variation too.** Reader watches the heatmap and per-row MSE change with each click.

**On the matrix design — outlier row + hot regions:**
The 8 × 64 demo matrix has:
- **Row 0**: 10× larger weights — the "outlier row" that motivates per-channel
- **Non-outlier rows**: random "hot regions" of ~16 columns with 2.5× amplitude — the *within-row* variation that motivates per-group

This dual pattern means each granularity has a distinct visual signature:
- **Per-tensor**: only the outlier row is preserved; everything else looks flat
- **Per-channel**: outlier row + non-outlier rows all preserved at the row level, but hot regions within rows still slightly quantized
- **Per-group at G=32 or G=16**: hot regions also preserved

**Without the hot regions**, per-group would look identical to per-channel and the widget would teach less.

**On the heatmap color scale being consistent across original and quantized:**
Both heatmaps use the same `absMax` for color scaling. **The reader can see directly that the colors don't fully match** in the quantized version — the quantization grid forces values to specific levels, visible as flat color bands.

**On the per-row MSE bars using rose for the outlier row:**
The outlier row gets rose color in the MSE bars; non-outlier rows get cyan. **This is intentional**: at per-tensor granularity, the outlier row has *small* MSE (the scale fits it perfectly), while non-outlier rows have huge MSE. The rose color highlights the outlier row's special status across granularities.

**On the metrics panel showing scale storage:**
The metrics panel includes:
- **Number of scales**: 1 / 8 / 16 / 32 depending on granularity + G
- **Scale storage in bytes**: makes the overhead concrete
- **Effective bits/weight**: 4.008 for per-tensor, 4.125 for per-group at G=32

**These specific numbers matter pedagogically**: reader sees that per-group adds only ~3% storage overhead while dramatically improving quality.

**On the four exercises being a granularity progression:**

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | Basic symmetric quantization | 2 |
| 2 | medium | Per-channel matrix quantization | 3 |
| 3 | medium | Per-group with adjustable G | 3 |
| 4 | hard | NF4 with level construction | 5 |

The four exercises mirror the chapter's structure: basic mapping (Ex 1), granularity progression (Ex 2-3), NF4 (Ex 4). **Each exercise builds on the previous.**

**On Ex 4 being the hardest:**
NF4 has two non-trivial pieces: (a) constructing the 16 levels via `scipy.stats.norm.ppf`, and (b) implementing nearest-level lookup with per-group scaling. **Reader has to combine concepts from both chapters' previous machinery.**

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Why quantize | (chapter prose) |
| 2. Basic mapping | Ex 1 + section 2 runnable |
| 3. Granularity choices | Ex 2, Ex 3 + section 3 runnable + secondary widget |
| 4. INT8 with LLM.int8 | (chapter prose) |
| 5. NF4 | Ex 4 + section 5 runnable + marquee widget (NF4 toggle) |
| 6. GPTQ vs AWQ | (chapter prose) |
| 7. Activation quantization | (chapter prose) |
| 8. Combined with Ch 17 | (chapter prose, section 8 table) |

Outcomes 2, 3, 5 served by exercises directly. Outcomes 1, 4, 6, 7, 8 served by chapter prose and widgets.

**Pedagogical claim of the chapter (revisited):**
"Quantization is the optimization that decides whether a model can be deployed at all. The math is short (scale + zero point + clip); the engineering is dense. Granularity is the highest-leverage choice (per-tensor destroyed by outliers; per-group rescues quality). NF4's quantile-based levels beat uniform INT4 for normally-distributed weights. Modern PTQ (GPTQ, AWQ) achieves <1% degradation at INT4. **Combined with Ch 17: 10-20× throughput vs naive on the same hardware.**"

**Phase 12 progress after this session**: Ch 17 ✅, Ch 18 ✅. **Ch 19 closes the inference arc.** Pace through Ch 19 with confidence — sampling is conceptually clean and the chapter should feel like a satisfying close.

**This chapter is the densest of Phase 12.** After Ch 19, Phase 12 is complete and the back half of the curriculum (capabilities, safety, agents) opens.

Build with care.
