# Session 83 — Quantization explorer marquee widget

> The marquee Chapter 18 widget. An **interactive bit-width explorer** that visualizes a weight distribution being quantized at different bit widths (16, 8, 4, 3, 2). At 4 bits, the reader can toggle between **INT4** (uniformly-spaced levels) and **NF4** (normal-distribution-spaced levels) to see the qualitative difference. A histogram shows the original weight distribution; vertical lines mark the quantization grid points; an error histogram below shows the resulting per-weight error. Live readouts of MSE, max error, distinct levels, and effective storage. **The widget that makes the precision/storage tradeoff viscerally obvious** — INT8 is nearly lossless, INT4 is visible but small, INT2 destroys quality, and NF4 specifically wins on normally-distributed weights.

---

## Read first (in this order)

1. **`research/ch18-quantization/research.md`** — concepts 2, 4, 5 are the source material
2. **`prompts/chapters/ch18-quantization/session-82-page-structure.md`** — for the section-2 widget placeholder this session fills
3. **`prompts/chapters/ch16-distillation/session-74-temperature-scaling-widget.md`** — for the bar-chart + slider visualization pattern (TemperatureScaling is the closest precedent — interactive parameter with live distribution updates)
4. **`prompts/chapters/ch17-inference-optimization/session-78-kv-cache-animation-widget.md`** — for the recent Ch 17 widget conventions

---

## Goal

Replace the `<WidgetFrame title="Quantization explorer">` placeholder in section 2 with a working interactive widget that:

- Shows a **fixed weight distribution** of ~1000 samples from $\mathcal{N}(0, 0.1)$ (representing a typical LLM weight tensor)
- **Bit-width slider/segmented control**: 16 (baseline / FP-like), 8, 4, 3, 2 bits
- **Format toggle** (visible only when bit width = 4): INT4 vs NF4
- **Top panel**: histogram of the original distribution + vertical grid lines at each quantization level
- **Middle panel** (optional): a "before/after" overlay showing original vs quantized values
- **Bottom panel**: live readout of MSE, max error, distinct levels, storage per weight, effective bits per weight
- **Insight text** that adapts to the current bit width:
  - **16-bit**: "FP16 baseline — nearly indistinguishable from FP32. The reference."
  - **8-bit**: "INT8 — practically lossless for most weight distributions. Production default."
  - **4-bit (INT4)**: "INT4 uniform — visible quantization error in the tails. Needs per-group scaling and/or NF4 to be production-ready."
  - **4-bit (NF4)**: "NF4 — levels placed at equiprobable normal quantiles. Denser near zero (where weights live); better quality per bit for normally-distributed weights."
  - **3-bit**: "INT3 — quality starts to degrade noticeably. Active research area."
  - **2-bit**: "INT2 — only 4 levels. Catastrophic for general use; works only with sophisticated methods (AQLM, QuIP#)."

**End state:** section 2 of Chapter 18 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) INT8 is nearly lossless; (b) INT4 has visible error but is still usable with good granularity; (c) NF4 beats INT4 on normally-distributed weights because levels are denser where weights are dense; (d) sub-INT4 quantization is research territory.

---

## Inputs

State of the repo after session 82:

- `src/pages/ch18-quantization/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 2 and 3)
- `src/lib/chapters.ts` has Ch 18 as `'draft'`
- No `src/components/widgets/ch18/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch18/QuantizationExplorer.tsx` — the React widget
2. **Create** `src/components/widgets/ch18/QuantizationExplorer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch18/quantization-data.ts` — pre-generated weights + quantization functions
4. **Update** `src/components/widgets/index.ts` — add `QuantizationExplorer` export
5. **Update** `src/pages/ch18-quantization/index.mdx` — replace section-2's `<WidgetFrame>` interior with `<QuantizationExplorer client:visible />`

---

## Detailed spec

### 1. `quantization-data.ts` — weights and quantization helpers

```ts
// src/components/widgets/ch18/quantization-data.ts

/** Seeded PRNG (mulberry32) for deterministic weight generation. */
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

/** Box-Muller transform: uniform → normal */
function boxMuller(u1: number, u2: number): number {
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Generate N normally-distributed weights with seed. */
export function generateWeights(n: number, mean: number, stddev: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = rand();
    const u2 = rand();
    samples.push(mean + stddev * boxMuller(u1, u2));
  }
  return samples;
}

/** Pre-generated weights, ~1000 samples from N(0, 0.1). Fixed across instances. */
export const WEIGHTS: number[] = generateWeights(1000, 0, 0.1, 42);

/** NF4 levels — equiprobable normal quantiles. Used at 4-bit when NF4 format selected. */
export const NF4_LEVELS: number[] = (() => {
  // Approximate inverse CDF of standard normal at midpoints of equiprobable bins
  // (We use a hardcoded list since these are computed offline; could also compute via numerical inversion)
  const raw = [
    -1.0, -0.6961, -0.5251, -0.3947, -0.2844, -0.1848, -0.0911, 0.0,
     0.0796,  0.1602,  0.2461,  0.3379,  0.4407,  0.5626,  0.7230,  1.0,
  ];
  return raw;
})();

/** Quantize using INT levels (uniformly-spaced). */
export function quantizeINT(value: number, scale: number, qmin: number, qmax: number): number {
  const intVal = Math.max(qmin, Math.min(qmax, Math.round(value / scale)));
  return intVal * scale;
}

/** Quantize using NF4 levels (lookup nearest). */
export function quantizeNF4(value: number, scale: number): number {
  const normalized = value / scale;
  let bestLevel = NF4_LEVELS[0]!;
  let bestDist = Math.abs(normalized - bestLevel);
  for (const level of NF4_LEVELS) {
    const dist = Math.abs(normalized - level);
    if (dist < bestDist) {
      bestDist = dist;
      bestLevel = level;
    }
  }
  return bestLevel * scale;
}

/** Format for quantization (INT or NF, NF only valid at 4 bits). */
export type Format = 'INT' | 'NF';

/** Compute quantized weights and grid levels. */
export function quantizeAll(weights: number[], nBits: number, format: Format): {
  quantized: number[];
  gridLevels: number[];
  scale: number;
  numLevels: number;
} {
  if (nBits >= 16) {
    // Pseudo-FP16: just return originals (real FP16 has its own structure but
    // for visualization purposes the error is negligible vs INT8/4/2)
    return {
      quantized: weights.slice(),
      gridLevels: [],
      scale: 0,
      numLevels: 65536,
    };
  }

  if (nBits === 4 && format === 'NF') {
    const scale = Math.max(...weights.map(Math.abs));
    const quantized = weights.map(w => quantizeNF4(w, scale));
    const gridLevels = NF4_LEVELS.map(l => l * scale);
    return { quantized, gridLevels, scale, numLevels: 16 };
  }

  // INT quantization (uniform levels)
  const qmax = Math.pow(2, nBits - 1) - 1;
  const qmin = -qmax - 1;
  const scale = Math.max(...weights.map(Math.abs)) / qmax;
  const quantized = weights.map(w => quantizeINT(w, scale, qmin, qmax));
  const gridLevels: number[] = [];
  for (let i = qmin; i <= qmax; i++) {
    gridLevels.push(i * scale);
  }
  return { quantized, gridLevels, scale, numLevels: qmax - qmin + 1 };
}

/** Compute error metrics. */
export function computeMetrics(original: number[], quantized: number[]): {
  mse: number;
  maxErr: number;
} {
  let sumSqErr = 0;
  let maxErr = 0;
  for (let i = 0; i < original.length; i++) {
    const err = original[i]! - quantized[i]!;
    sumSqErr += err * err;
    if (Math.abs(err) > maxErr) maxErr = Math.abs(err);
  }
  return {
    mse: sumSqErr / original.length,
    maxErr,
  };
}

/** Build a histogram (returns bin counts). */
export function buildHistogram(values: number[], nBins: number, valMin: number, valMax: number): number[] {
  const counts = new Array(nBins).fill(0);
  const binWidth = (valMax - valMin) / nBins;
  for (const v of values) {
    let bin = Math.floor((v - valMin) / binWidth);
    if (bin < 0) bin = 0;
    if (bin >= nBins) bin = nBins - 1;
    counts[bin]++;
  }
  return counts;
}

/** Insight text based on bit width and format. */
export function insightFor(nBits: number, format: Format): string {
  if (nBits >= 16) return 'FP16 baseline — nearly indistinguishable from FP32. The reference.';
  if (nBits === 8) return 'INT8 — practically lossless for most weight distributions. Production default.';
  if (nBits === 4 && format === 'NF') return 'NF4 — levels placed at equiprobable normal quantiles. Denser near zero (where weights live); better quality per bit for normally-distributed weights.';
  if (nBits === 4) return 'INT4 uniform — visible quantization error in the tails. Needs per-group scaling and/or NF4 to be production-ready.';
  if (nBits === 3) return 'INT3 — quality starts to degrade noticeably. Active research area; typically combined with sophisticated PTQ.';
  if (nBits === 2) return 'INT2 — only 4 levels. Catastrophic for general use; works only with sophisticated methods (AQLM, QuIP#).';
  return '';
}

/** Effective bits per weight including scale overhead. */
export function effectiveBits(nBits: number, weightsPerScale: number = 1000): number {
  // Scale: 32-bit FP, one per weightsPerScale weights (here: per-tensor for 1000 weights)
  return nBits + 32 / weightsPerScale;
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Quantization explorer                                            │
│                                                                  │
│ Weight distribution: 1000 samples from N(0, 0.1)                 │
│                                                                  │
│ Bit width: [ 16 | 8 | 4 | 3 | 2 ]                                │
│ Format (4-bit only): [INT4] [NF4]                                │
│                                                                  │
│ Distribution + quantization grid:                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │      gray histogram bars (original distribution)              │ │
│ │   ┌─┐                                                          │ │
│ │   │ ├─┐                                                        │ │
│ │   │ │ ├─┐  amber vertical lines at quantization grid points    │ │
│ │   │ │ │ │ │  │  │  │  (15 lines for INT4)                      │ │
│ │   │ │ │ │ ├─┐                                                  │ │
│ │ ─ │ │ │ │ │ ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                  │ │
│ │   │ │ │ │ │ │ │                                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Quantization error (original - quantized):                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  small histogram of errors (cyan)                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Metrics:                                                          │
│  • MSE:                       0.000004                            │
│  • Max error:                 0.0089                              │
│  • Distinct levels:           256 (8-bit signed)                 │
│  • Storage per weight:        8 bits                              │
│  • Effective bits/weight:     8.03 (incl. per-tensor scale)       │
│                                                                  │
│ Insight:                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ INT8 — practically lossless for most weight distributions.   │ │
│ │ Production default.                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click bit-width buttons (16/8/4/3/2): instantly updates the visualization and metrics
- At 4 bits: format toggle (INT4/NF4) becomes active; click to switch
- At other bit widths: format toggle is disabled (visually grayed out)
- Distribution histogram remains constant (the original weights don't change)
- Quantization grid lines (amber) update with the bit width
- Error histogram (cyan, below) updates with the bit width
- Metrics panel updates instantly
- Insight text adapts to the chosen configuration

**Visual details:**
- Original distribution: gray histogram bars (~40 bins from -0.4 to 0.4)
- Quantization grid: vertical amber lines, full height of the histogram panel, slightly transparent
- Error histogram: smaller, cyan, range roughly [-max_err, max_err]
- Metrics panel: tabular, monospace, with the "effective bits" row showing the scale overhead

### 3. `QuantizationExplorer.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  WEIGHTS, quantizeAll, computeMetrics, buildHistogram, insightFor, effectiveBits,
  type Format,
} from './quantization-data';
import styles from './QuantizationExplorer.module.css';

const BIT_WIDTHS = [16, 8, 4, 3, 2];

export default function QuantizationExplorer() {
  const [nBits, setNBits] = useState(8);
  const [format, setFormat] = useState<Format>('INT');

  const effectiveFormat: Format = nBits === 4 ? format : 'INT';
  const { quantized, gridLevels, numLevels } = useMemo(
    () => quantizeAll(WEIGHTS, nBits, effectiveFormat),
    [nBits, effectiveFormat]
  );
  const metrics = useMemo(() => computeMetrics(WEIGHTS, quantized), [quantized]);
  const insight = insightFor(nBits, effectiveFormat);
  const effBits = effectiveBits(nBits);

  // Histogram of original weights (gray bars)
  const valMin = -0.4;
  const valMax = 0.4;
  const nBins = 40;
  const histCounts = useMemo(() => buildHistogram(WEIGHTS, nBins, valMin, valMax), []);
  const maxCount = Math.max(...histCounts);

  // Error histogram (cyan bars)
  const errorValues = useMemo(() => WEIGHTS.map((w, i) => w - quantized[i]!), [quantized]);
  const errMax = Math.max(0.001, metrics.maxErr) * 1.1;
  const errMin = -errMax;
  const errCounts = useMemo(() => buildHistogram(errorValues, nBins, errMin, errMax), [errorValues, errMin, errMax]);
  const errMaxCount = Math.max(1, ...errCounts);

  const W = 740;
  const H = 200;
  const ErrH = 90;

  function xForVal(v: number, vMin: number, vMax: number): number {
    return ((v - vMin) / (vMax - vMin)) * W;
  }

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Quantization explorer</div>
        <div className={styles.titleSubLabel}>
          Weight distribution: 1000 samples from <strong>N(0, 0.1)</strong>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Bit width:</span>
          <div className={styles.bitButtons}>
            {BIT_WIDTHS.map(b => (
              <button
                key={b}
                className={`${styles.bitButton} ${nBits === b ? styles.bitButtonActive : ''}`}
                onClick={() => setNBits(b)}
              >{b}</button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Format (4-bit only):</span>
          <div className={styles.formatButtons}>
            <button
              className={`${styles.formatButton} ${nBits === 4 && format === 'INT' ? styles.formatButtonActive : ''}`}
              onClick={() => setFormat('INT')}
              disabled={nBits !== 4}
            >INT4</button>
            <button
              className={`${styles.formatButton} ${nBits === 4 && format === 'NF' ? styles.formatButtonActive : ''}`}
              onClick={() => setFormat('NF')}
              disabled={nBits !== 4}
            >NF4</button>
          </div>
        </div>
      </div>

      {/* Distribution + quantization grid */}
      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>Distribution + quantization grid</div>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg} role="img" aria-label="Weight distribution with quantization grid">
          {/* Original distribution: gray bars */}
          {histCounts.map((count, i) => {
            const binW = W / nBins;
            const x = i * binW;
            const h = (count / maxCount) * (H - 20);
            return (
              <rect
                key={`bar-${i}`}
                x={x + 0.5} y={H - 10 - h}
                width={binW - 1} height={h}
                className={styles.histBar}
              />
            );
          })}
          {/* Quantization grid: amber vertical lines */}
          {gridLevels.length > 0 && gridLevels.length <= 256 && gridLevels.map((level, i) => {
            if (level < valMin || level > valMax) return null;
            const x = xForVal(level, valMin, valMax);
            return (
              <line
                key={`grid-${i}`}
                x1={x} y1={4}
                x2={x} y2={H - 10}
                className={`${styles.gridLine} ${effectiveFormat === 'NF' ? styles.gridLineNF : ''}`}
              />
            );
          })}
          {/* Axis */}
          <line x1={0} y1={H - 10} x2={W} y2={H - 10} className={styles.axis} />
          <text x={5} y={H - 1} className={styles.axisLabel}>{valMin.toFixed(2)}</text>
          <text x={W / 2 - 5} y={H - 1} className={styles.axisLabel}>0</text>
          <text x={W - 25} y={H - 1} className={styles.axisLabel}>{valMax.toFixed(2)}</text>
        </svg>
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span className={styles.legendBar} /> original weights
          </span>
          {gridLevels.length > 0 && gridLevels.length <= 256 && (
            <span className={styles.legendItem}>
              <span className={`${styles.legendLine} ${effectiveFormat === 'NF' ? styles.legendLineNF : ''}`} />
              {effectiveFormat === 'NF' ? 'NF4 levels' : `INT${nBits} levels`} ({numLevels})
            </span>
          )}
          {gridLevels.length > 256 && (
            <span className={styles.legendItem}>
              {numLevels.toLocaleString()} levels (too many to draw)
            </span>
          )}
        </div>
      </div>

      {/* Error histogram */}
      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>Quantization error (original – quantized)</div>
        <svg viewBox={`0 0 ${W} ${ErrH}`} className={styles.chartSvg} role="img" aria-label="Quantization error histogram">
          {errCounts.map((count, i) => {
            const binW = W / nBins;
            const x = i * binW;
            const h = (count / errMaxCount) * (ErrH - 20);
            return (
              <rect
                key={`err-${i}`}
                x={x + 0.5} y={ErrH - 10 - h}
                width={binW - 1} height={h}
                className={styles.errorBar}
              />
            );
          })}
          {/* Zero line */}
          <line
            x1={xForVal(0, errMin, errMax)} y1={4}
            x2={xForVal(0, errMin, errMax)} y2={ErrH - 10}
            className={styles.zeroLine}
          />
          <line x1={0} y1={ErrH - 10} x2={W} y2={ErrH - 10} className={styles.axis} />
          <text x={5} y={ErrH - 1} className={styles.axisLabel}>{errMin.toFixed(3)}</text>
          <text x={W / 2 - 5} y={ErrH - 1} className={styles.axisLabel}>0</text>
          <text x={W - 35} y={ErrH - 1} className={styles.axisLabel}>{errMax.toFixed(3)}</text>
        </svg>
      </div>

      {/* Metrics */}
      <div className={styles.metricsPanel}>
        <div className={styles.metricsTitle}>Metrics</div>
        <div className={styles.metricsBody}>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>MSE:</span>
            <span className={styles.metricValue}>{metrics.mse.toExponential(2)}</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Max error:</span>
            <span className={styles.metricValue}>{metrics.maxErr.toFixed(5)}</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Distinct levels:</span>
            <span className={styles.metricValue}>
              {numLevels.toLocaleString()} ({nBits >= 16 ? 'FP16' : `${nBits}-bit ${effectiveFormat === 'NF' ? 'NF' : 'signed'}`})
            </span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Storage per weight:</span>
            <span className={styles.metricValue}>{nBits} bits</span>
          </div>
          <div className={styles.metricRow}>
            <span className={styles.metricLabel}>Effective bits/weight:</span>
            <span className={styles.metricValue}>
              {effBits.toFixed(2)} (incl. per-tensor scale)
            </span>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{insight}</div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Try the sequence <strong>16 → 8 → 4 → 3 → 2</strong>: watch the quantization grid get coarser and the
        error grow. At 4 bits, toggle between <strong>INT4</strong> (uniform spacing) and <strong>NF4</strong>
        (denser near zero) — NF4 visibly reduces error on this normally-distributed weight set. <strong>INT8 is
        the production default; INT4 with NF4/GPTQ/AWQ is the production frontier; sub-INT4 is research.</strong>
      </div>
    </div>
  );
}
```

### 4. `QuantizationExplorer.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .chartPanel, .metricsPanel, .insightPanel, .caption {
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
  min-width: 145px;
}
.bitButtons, .formatButtons {
  display: flex;
  gap: 0.3rem;
}
.bitButton, .formatButton {
  padding: 0.35rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
  min-width: 50px;
}
.bitButton:hover:not(:disabled), .formatButton:hover:not(:disabled) {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.bitButton:disabled, .formatButton:disabled { opacity: 0.35; cursor: not-allowed; }
.bitButtonActive, .formatButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Chart panels */
.chartTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.chartSvg {
  width: 100%;
  height: auto;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
}
.histBar {
  fill: var(--text-tertiary);
  opacity: 0.6;
}
.gridLine {
  stroke: var(--amber-400);
  stroke-width: 1;
  opacity: 0.65;
}
.gridLineNF {
  stroke: var(--emerald-400);
}
.errorBar {
  fill: var(--cyan-400);
  opacity: 0.85;
}
.zeroLine {
  stroke: var(--text-tertiary);
  stroke-width: 0.8;
  stroke-dasharray: 2 2;
  opacity: 0.5;
}
.axis {
  stroke: var(--border-default);
  stroke-width: 1;
}
.axisLabel {
  fill: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
}

.chartLegend {
  display: flex;
  gap: 1.2rem;
  margin-top: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  flex-wrap: wrap;
}
.legendItem {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.legendBar {
  display: inline-block;
  width: 12px; height: 8px;
  background: var(--text-tertiary);
  opacity: 0.6;
  border-radius: 1px;
}
.legendLine {
  display: inline-block;
  width: 12px; height: 12px;
  background: var(--amber-400);
  opacity: 0.65;
  width: 2px;
  border-radius: 0;
}
.legendLineNF { background: var(--emerald-400); }

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

/* Insight */
.insightPanel {
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
}
.insightLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--cyan-300);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.insightText {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.5;
}

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
  .bitButton, .formatButton { padding: 0.3rem 0.6rem; font-size: 0.74rem; min-width: 40px; }
  .chartLegend { gap: 0.7rem; font-size: 0.66rem; }
  .metricRow { font-size: 0.74rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as QuantizationExplorer } from './ch18/QuantizationExplorer';
// Session 84 will add:
// export { default as GranularityVisualizer } from './ch18/GranularityVisualizer';
```

### 6. Update `src/pages/ch18-quantization/index.mdx`

**Edit A: Add widget import:**

```mdx
import { QuantizationExplorer } from '@components/widgets';
```

**Edit B: Replace section-2's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Quantization explorer" caption="1000 weights from N(0, 0.1). Pick a bit width (16/8/4/3/2); at 4 bits, toggle between INT4 (uniform levels) and NF4 (normal-spaced). Histogram shows the original distribution; vertical lines mark quantization grid points; error histogram below shows resulting per-weight errors. INT8 is nearly lossless; INT4 has visible error; NF4 visibly reduces it for normal-shaped weights.">
  <QuantizationExplorer client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 2 of Ch 18** renders with the working widget. Section 3's placeholder still stubbed.
3. **Default state**: bit width = 8, format = INT (effectively INT8). Grid shows ~256 levels (too many to draw individually — code handles this case with text only).
4. **Bit-width buttons**: 5 options (16, 8, 4, 3, 2). Click toggles between them. Active button is highlighted in cyan.
5. **Format buttons**: INT4 and NF4. **Disabled** when bit width ≠ 4. **Active** when bit width = 4.
6. **At bit width = 16**: no grid lines drawn (FP-like baseline); MSE ~0; max error ~0; distinct levels = 65536.
7. **At bit width = 8**: 256 grid lines (too many to render visually — code falls through to "256 levels" text only); MSE ~ 1e-7; max error ~ 0.0006.
8. **At bit width = 4 (INT4)**: 16 amber grid lines visible; MSE ~ 1e-5; max error ~ 0.012; uniformly spaced.
9. **At bit width = 4 (NF4)**: 16 emerald grid lines visible; **denser near zero, sparser in tails**; lower MSE than INT4 on this normal-shaped weight set.
10. **At bit width = 3**: 8 grid lines; visibly more error; insight text says "INT3 — quality starts to degrade noticeably."
11. **At bit width = 2**: 4 grid lines; massive error; insight text says "INT2 — only 4 levels. Catastrophic..."
12. **Distribution histogram** is the same gray bars regardless of bit width (the originals don't change).
13. **Error histogram** updates with bit width; visibly grows as bit width decreases.
14. **Metrics panel** updates instantly with each click.
15. **Insight text** changes to match the 6 distinct configurations (16, 8, INT4, NF4, 3, 2).
16. **Grid color**: amber for INT, emerald for NF (so NF4 is visually distinguished from INT4).
17. **Legend** below the distribution chart explains the colors and shows the level count.
18. **Mobile** (< 720px): controls stack; chart shrinks but stays readable.
19. **`npm run typecheck`** passes.
20. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not allow user-provided weights**. Fixed N(0, 0.1) example only.
- ❌ **Do not implement asymmetric quantization**. Symmetric only.
- ❌ **Do not implement per-group or per-channel** — this is section 3's territory.
- ❌ **Do not implement GPTQ or AWQ** — these are section 6's algorithms; widget is about the bit-width tradeoff.
- ❌ **Do not animate transitions**. Click-driven state change is sufficient.
- ❌ **Do not show storage in GB** for a full model — the widget is per-weight, not per-model.
- ❌ **Do not flip Ch 18's status**. Session 84 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch18/ src/components/widgets/index.ts src/pages/ch18-quantization/index.mdx
git commit -m "session 83: quantization explorer marquee — visualize bit width and NF4 vs INT4"
git push origin main
```

Verify on production:
- Click through all bit widths
- Toggle NF4/INT4 at 4 bits
- Grid lines render correctly (amber for INT, emerald for NF)
- Metrics update with each click
- Insight text matches the chosen configuration

---

## Notes for the session author

**On the "watch the grid get coarser" pedagogical arc:**
The widget tells a story by clicking through bit widths. **16 → 8 → 4 → 3 → 2**: each click shows the grid getting coarser and the error growing. Then at 4 bits, the NF4 toggle shows that not all 4-bit formats are equal. **This is the chapter's central pedagogical claim made interactive.**

**On the choice of N(0, 0.1) weights:**
LLM weights at initialization are typically $\mathcal{N}(0, \sigma)$ for some small $\sigma$. After training, the distribution gets thinner-tailed but remains approximately normal. **N(0, 0.1) is representative.** NF4 specifically wins on this kind of distribution; the widget makes the win visible.

**On grid line rendering at high bit widths:**
At 8 bits, there are 256 grid lines. Drawing all of them creates visual noise. **The widget falls back to text-only ("256 levels") at high bit widths.** The grid lines are pedagogically interesting only at low bit widths (4 or fewer) where you can see each level distinctly.

**On INT vs NF color coding:**
- **INT (uniform)**: amber — the "default" recipe; reader has seen amber for "intermediate" optimizations in earlier widgets
- **NF (normal-spaced)**: emerald — the "improvement"; reader has seen emerald for "good" / "preferred" choices

The color shift between INT4 and NF4 reinforces "this is a different, better approach."

**On the error histogram being below the distribution histogram:**
The two histograms are stacked vertically. Reader sees:
- Top: the original distribution + the quantization grid (where the levels live)
- Bottom: the resulting per-weight errors (how far each weight had to move to the nearest level)

**This pairing is the chapter's central visual claim**: the grid determines the error pattern.

**On the metrics panel reading like an engineer's spec sheet:**
- MSE (in scientific notation)
- Max error
- Distinct levels
- Storage per weight
- Effective bits per weight (including scale overhead)

**This is the kind of spec sheet a production engineer would actually consult.** The widget teaches the reader to read it.

**On insight text changing with configuration:**
6 distinct configurations: bit ∈ {16, 8, 4 (INT), 4 (NF), 3, 2}. **Each gets its own insight message**, written like a short verdict from an experienced practitioner:
- 16: "The reference."
- 8: "Production default."
- INT4: "Needs per-group scaling and/or NF4 to be production-ready."
- NF4: "Better quality per bit for normally-distributed weights."
- 3: "Active research area."
- 2: "Catastrophic for general use."

**These verdicts are themselves pedagogy** — they tell the reader where each bit width lives in the practical landscape.

**On the caption's recommended interaction**:
The caption tells readers to try the sequence "16 → 8 → 4 → 3 → 2" and then toggle INT/NF at 4 bits. **This is a guided exploration**: by the end of the sequence, the reader has seen quality degrade across the bit-width spectrum, then has seen NF4 specifically improve over INT4. **The chapter's central pedagogical claim, encoded as an interaction.**

**Pedagogical claim this widget supports:**
"Quantization is a precision-storage tradeoff: fewer bits = less storage and bandwidth, but more rounding error. At 8 bits, the error is so small it's practically invisible — that's why INT8 is the production default. At 4 bits with uniform spacing (INT4), the error is visible but small — usable with per-group scaling. **NF4 specifically places levels at the equiprobable quantiles of the normal distribution, putting more resolution where weights live (near zero) and less where they're sparse (in the tails) — this is the format behind QLoRA.** Sub-INT4 (3-bit, 2-bit) is research territory where sophisticated methods are required to recover quality."

After 30 seconds of interaction, the reader has internalized: (a) INT8 is essentially lossless; (b) INT4 has visible but tolerable error; (c) NF4 visibly improves on INT4 for normally-distributed weights; (d) sub-INT4 is catastrophic without special methods.

**This is Ch 18's central visualization.** Build with care.
