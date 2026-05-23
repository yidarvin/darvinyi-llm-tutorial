# Session 87 — Sampling distribution visualizer marquee widget

> The marquee Chapter 19 widget. An **interactive bar chart** that shows how the same logits get transformed by different sampling strategies. **Distribution shape selector** (peaked / bimodal / flat) lets the reader see how truncation behaves across confidence levels. **Three sliders** — temperature, top-p, top-k — let the reader build a sampling pipeline. **Two stacked bar charts** show the original distribution (top, gray) and the post-pipeline distribution (bottom, cyan for in-nucleus tokens, rose-faded for masked). **Stats panel** shows nucleus size, top probability, entropy. **The chapter's central insight made visceral**: top-p's nucleus *adapts* to distribution shape — small at peaked confidence, large at uncertainty — while top-k stays fixed regardless.

---

## Read first (in this order)

1. **`research/ch19-sampling/research.md`** — concepts 2-5 are the source material
2. **`prompts/chapters/ch19-sampling/session-86-page-structure.md`** — for the section-4 widget placeholder this session fills
3. **`prompts/chapters/ch16-distillation/session-74-temperature-scaling-widget.md`** — for the bar-chart + slider visualization pattern (TemperatureScaling is the closest precedent — also a distribution-transformation widget)
4. **`prompts/chapters/ch18-quantization/session-83-quantization-explorer-widget.md`** — for the recent Phase 12 widget conventions

---

## Goal

Replace the `<WidgetFrame title="Sampling distribution explorer">` placeholder in section 4 with a working interactive widget that:

- Provides a **distribution shape selector**: peaked / bimodal / flat — fixed pre-generated logits with characteristic shapes
- **Three sliders**: temperature ($T$ from 0.3 to 2.0), top-p ($p$ from 0.1 to 1.0), top-k ($k$ from 1 to vocabulary size)
- Shows **two bar charts**:
  - **Top chart**: original distribution after softmax (gray bars). Token indices on x-axis; probabilities on y-axis.
  - **Bottom chart**: post-pipeline distribution. Bars colored cyan (kept, in nucleus) or rose-faded (masked out).
- **Stats panel**: nucleus size (number of kept tokens), max probability, entropy of the kept distribution
- **Adaptive insight text**: 4 messages depending on the chosen distribution shape and current p:
  - Peaked: "Nucleus is small (~1-3 tokens) — the model is confident."
  - Bimodal: "Nucleus includes both peaks — the model is uncertain between two options."
  - Flat: "Nucleus is large — the model is uncertain across many options."
  - When top-p = 1.0: "Top-p effectively disabled — all tokens in nucleus."

**End state:** section 4 of Chapter 19 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) temperature changes the distribution's shape (sharpens or softens); (b) top-p's nucleus *adapts* — small at peaked confidence, large at uncertainty; (c) top-k's nucleus is *fixed* — same size regardless of shape; (d) the post-pipeline distribution always sums to 1 (renormalization happens after truncation).

---

## Inputs

State of the repo after session 86:

- `src/pages/ch19-sampling/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 4 and 8)
- `src/lib/chapters.ts` has Ch 19 as `'draft'`
- No `src/components/widgets/ch19/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch19/SamplingDistribution.tsx` — the React widget
2. **Create** `src/components/widgets/ch19/SamplingDistribution.module.css` — scoped styles
3. **Create** `src/components/widgets/ch19/sampling-data.ts` — pre-generated logits + sampling pipeline
4. **Update** `src/components/widgets/index.ts` — add `SamplingDistribution` export
5. **Update** `src/pages/ch19-sampling/index.mdx` — replace section-4's `<WidgetFrame>` interior with `<SamplingDistribution client:visible />`

---

## Detailed spec

### 1. `sampling-data.ts` — distributions and sampling pipeline

```ts
// src/components/widgets/ch19/sampling-data.ts

/** Seeded PRNG (mulberry32). */
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

export const VOCAB_SIZE = 50;

export type DistributionShape = 'peaked' | 'bimodal' | 'flat';

/**
 * Pre-generate logits for each distribution shape.
 * Fixed seeds for determinism.
 */
function generateShape(shape: DistributionShape): number[] {
  const rand = mulberry32(42);
  const z: number[] = [];
  for (let i = 0; i < VOCAB_SIZE; i++) {
    z.push(boxMuller(rand) * 0.7);
  }
  if (shape === 'peaked') {
    // One clear winner around index 5
    z[5] = (z[5] ?? 0) + 5.0;
  } else if (shape === 'bimodal') {
    // Two strong candidates around indices 5 and 12
    z[5] = (z[5] ?? 0) + 3.0;
    z[12] = (z[12] ?? 0) + 2.7;
  }
  // 'flat': leave as random noise
  return z;
}

export const DISTRIBUTIONS: Record<DistributionShape, number[]> = {
  peaked: generateShape('peaked'),
  bimodal: generateShape('bimodal'),
  flat: generateShape('flat'),
};

/** Numerically stable softmax. */
export function softmax(z: number[]): number[] {
  const max = Math.max(...z);
  const e = z.map(zi => Math.exp(zi - max));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map(ei => ei / sum);
}

/** Result of applying the full sampling pipeline. */
export interface PipelineResult {
  originalProbs: number[];
  postPipelineProbs: number[];   // renormalized after masking
  keptIndices: Set<number>;
  nucleusSize: number;
  truncationKind: 'top-p' | 'top-k' | 'none' | 'both';
  topProbability: number;
  entropy: number;
}

/**
 * Apply the sampling pipeline:
 * 1. Temperature scaling
 * 2. Truncation (top-p and/or top-k)
 * 3. Renormalize
 */
export function applyPipeline(
  logits: number[],
  T: number,
  topP: number,
  topK: number,
): PipelineResult {
  const originalProbs = softmax(logits);
  const scaled = logits.map(z => z / T);
  const scaledProbs = softmax(scaled);

  // Sort by scaled probability descending
  const idxByProb = scaledProbs
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p - a.p);

  // Determine which tokens survive top-p
  let topPCut = scaledProbs.length;
  if (topP < 1.0) {
    let cum = 0;
    for (let i = 0; i < idxByProb.length; i++) {
      cum += idxByProb[i]!.p;
      if (cum >= topP) {
        topPCut = i + 1;
        break;
      }
    }
  }

  // Determine which tokens survive top-k
  const topKCut = Math.min(topK, scaledProbs.length);

  // Intersection: keep tokens that survive BOTH (smaller of the two)
  const cut = Math.min(topPCut, topKCut);
  const keptIndices = new Set<number>();
  for (let i = 0; i < cut; i++) {
    keptIndices.add(idxByProb[i]!.i);
  }

  // Build post-pipeline distribution: kept tokens with renormalized probabilities
  const postScaled = scaled.map((z, i) => (keptIndices.has(i) ? z : -Infinity));
  const postProbs = softmax(postScaled);

  // Truncation kind for the readout
  let truncationKind: 'top-p' | 'top-k' | 'none' | 'both' = 'none';
  if (topP < 1.0 && topK < VOCAB_SIZE) {
    truncationKind = topPCut <= topKCut ? 'top-p' : 'top-k';
    if (topPCut === topKCut) truncationKind = 'both';
  } else if (topP < 1.0) {
    truncationKind = 'top-p';
  } else if (topK < VOCAB_SIZE) {
    truncationKind = 'top-k';
  }

  const topProbability = Math.max(...postProbs);
  const entropy = postProbs.reduce(
    (acc, p) => (p > 0 ? acc - p * Math.log2(p) : acc),
    0
  );

  return {
    originalProbs,
    postPipelineProbs: postProbs,
    keptIndices,
    nucleusSize: keptIndices.size,
    truncationKind,
    topProbability,
    entropy,
  };
}

/** Adaptive insight text based on shape and current settings. */
export function insightFor(shape: DistributionShape, topP: number, nucleusSize: number): string {
  if (topP >= 0.999) {
    return 'Top-p effectively disabled — all tokens in the nucleus. Adjust top-p below 1.0 to see truncation.';
  }
  if (shape === 'peaked') {
    return `Nucleus is small (${nucleusSize} tokens) — the model is confident; only a few candidates matter.`;
  }
  if (shape === 'bimodal') {
    return `Nucleus includes both peaks (${nucleusSize} tokens) — the model is uncertain between two main options.`;
  }
  return `Nucleus is large (${nucleusSize} tokens) — the model is uncertain across many options.`;
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Sampling distribution explorer                                   │
│                                                                  │
│ Distribution shape:                                              │
│   [ peaked ]  [bimodal]  [ flat ]                                │
│                                                                  │
│ Sampling parameters:                                              │
│   Temperature (T):  [───●─────────]  T = 1.0                     │
│   Top-p:            [─────────●───]  p = 0.95                    │
│   Top-k:            [─────────●───]  k = 50  (= off)             │
│                                                                  │
│ Original distribution (after softmax):                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ token  0  1  2  3  4  5  6  7  8  9 10 11 12 13 ...          │ │
│ │           gray bars showing original probabilities             │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Post-pipeline (after T + top-p + top-k):                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ token  0  1  2  3  4  5  6  7  8  9 10 11 12 13 ...          │ │
│ │                                                                │ │
│ │    cyan bars: in nucleus (sampleable)                          │ │
│ │    rose-faded bars: masked out                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Stats:                                                            │
│  • Nucleus size:           3 tokens (out of 50)                  │
│  • Truncation by:          top-p (since p=0.95 cut < k=50 cut)   │
│  • Top probability:        0.873                                 │
│  • Entropy:                0.487 bits                            │
│                                                                  │
│ Insight:                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Nucleus is small (3 tokens) — the model is confident;        │ │
│ │ only a few candidates matter.                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click distribution shape button → instantly switches logits; all charts and stats update
- Move temperature slider → bars rescale; nucleus may change as distribution shape changes
- Move top-p slider → nucleus boundary shifts; bars switch between cyan and rose
- Move top-k slider → fixed-size truncation; bars switch state
- Stats and insight update live with every change

**Visual encoding:**
- Original distribution (top): gray bars at consistent y-scale
- Post-pipeline (bottom): cyan bars for in-nucleus tokens; rose-faded bars (low opacity) for masked tokens
- Bar heights normalized to the max probability in each chart
- Token indices labeled on x-axis (every 5th token)

### 3. `SamplingDistribution.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  DISTRIBUTIONS, VOCAB_SIZE, applyPipeline, insightFor,
  type DistributionShape,
} from './sampling-data';
import styles from './SamplingDistribution.module.css';

export default function SamplingDistribution() {
  const [shape, setShape] = useState<DistributionShape>('peaked');
  const [T, setT] = useState(1.0);
  const [topP, setTopP] = useState(0.95);
  const [topK, setTopK] = useState(VOCAB_SIZE);

  const logits = DISTRIBUTIONS[shape];
  const result = useMemo(
    () => applyPipeline(logits, T, topP, topK),
    [logits, T, topP, topK]
  );
  const insight = insightFor(shape, topP, result.nucleusSize);

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Sampling distribution explorer</div>
        <div className={styles.titleSubLabel}>
          Watch how temperature + top-p + top-k transform the distribution
        </div>
      </div>

      {/* Distribution shape selector */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Distribution shape:</span>
          <div className={styles.shapeButtons}>
            {(['peaked', 'bimodal', 'flat'] as DistributionShape[]).map(s => (
              <button
                key={s}
                className={`${styles.shapeButton} ${shape === s ? styles.shapeButtonActive : ''}`}
                onClick={() => setShape(s)}
              >{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className={styles.controlsPanel}>
        <SliderRow
          label="Temperature (T):"
          value={T}
          display={`T = ${T.toFixed(2)}`}
          min={0.3} max={2.0} step={0.05}
          onChange={setT}
        />
        <SliderRow
          label="Top-p:"
          value={topP}
          display={`p = ${topP.toFixed(2)}${topP >= 0.999 ? ' (off)' : ''}`}
          min={0.1} max={1.0} step={0.05}
          onChange={setTopP}
        />
        <SliderRow
          label="Top-k:"
          value={topK}
          display={`k = ${topK}${topK >= VOCAB_SIZE ? ' (off)' : ''}`}
          min={1} max={VOCAB_SIZE} step={1}
          onChange={setTopK}
        />
      </div>

      {/* Original distribution */}
      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>Original distribution (after softmax)</div>
        <Histogram
          probs={result.originalProbs}
          keptIndices={null}
          maxProb={Math.max(...result.originalProbs)}
        />
      </div>

      {/* Post-pipeline distribution */}
      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>Post-pipeline (after T + top-p + top-k)</div>
        <Histogram
          probs={result.postPipelineProbs}
          keptIndices={result.keptIndices}
          maxProb={Math.max(0.01, Math.max(...result.postPipelineProbs))}
        />
      </div>

      {/* Stats */}
      <div className={styles.statsPanel}>
        <div className={styles.statsTitle}>Stats</div>
        <div className={styles.statsBody}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Nucleus size:</span>
            <span className={styles.statValue}>
              {result.nucleusSize} tokens (out of {VOCAB_SIZE})
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Truncation by:</span>
            <span className={styles.statValue}>
              {result.truncationKind === 'none' && 'none (no truncation active)'}
              {result.truncationKind === 'top-p' && `top-p (smaller than top-k cut)`}
              {result.truncationKind === 'top-k' && `top-k (smaller than top-p cut)`}
              {result.truncationKind === 'both' && `both (top-p and top-k coincide)`}
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Top probability:</span>
            <span className={styles.statValue}>{result.topProbability.toFixed(3)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Entropy:</span>
            <span className={styles.statValue}>{result.entropy.toFixed(3)} bits</span>
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
        Try this sequence: <strong>peaked</strong> with p=0.95 (nucleus is 1-3 tokens — the model is confident);
        switch to <strong>flat</strong> (nucleus grows to 20+ tokens — the model is uncertain). <strong>Top-p adapts;
        top-k stays fixed</strong>. Then raise temperature to 1.5 and watch the distribution flatten — even the peaked
        shape now has a wider nucleus. <strong>This adaptive behavior is what makes nucleus sampling the modern default.</strong>
      </div>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  display: string;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
}
function SliderRow({ label, value, display, min, max, step, onChange }: SliderRowProps) {
  return (
    <div className={styles.controlRow}>
      <span className={styles.controlLabel}>{label}</span>
      <span className={styles.controlValue}>{display}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={styles.slider}
        aria-label={label}
      />
    </div>
  );
}

interface HistogramProps {
  probs: number[];
  keptIndices: Set<number> | null;   // null = original (all gray); set = post-pipeline
  maxProb: number;
}
function Histogram({ probs, keptIndices, maxProb }: HistogramProps) {
  const W = 720;
  const H = 130;
  const barW = W / probs.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg} role="img" aria-label="probability histogram">
      {probs.map((p, i) => {
        const h = (p / maxProb) * (H - 22);
        const x = i * barW;
        const inNucleus = keptIndices === null ? null : keptIndices.has(i);
        const className =
          inNucleus === null
            ? styles.barOriginal
            : inNucleus
              ? styles.barKept
              : styles.barMasked;
        return (
          <rect
            key={`bar-${i}`}
            x={x + 0.5} y={H - 14 - h}
            width={barW - 1} height={Math.max(1, h)}
            className={className}
          />
        );
      })}
      {/* Axis */}
      <line x1={0} y1={H - 14} x2={W} y2={H - 14} className={styles.axis} />
      {/* X-axis labels (every 5) */}
      {probs.map((_, i) => {
        if (i % 5 !== 0) return null;
        return (
          <text
            key={`xlabel-${i}`}
            x={i * barW + barW / 2}
            y={H - 3}
            className={styles.axisLabel}
            textAnchor="middle"
          >{i}</text>
        );
      })}
    </svg>
  );
}
```

### 4. `SamplingDistribution.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .chartPanel, .statsPanel, .insightPanel, .caption {
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
.controlValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--cyan-300);
  font-weight: 500;
  min-width: 100px;
}
.slider { flex: 1; min-width: 180px; }

/* Shape buttons */
.shapeButtons { display: flex; gap: 0.3rem; }
.shapeButton {
  padding: 0.35rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
  min-width: 70px;
}
.shapeButton:hover {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.shapeButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Chart */
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
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.barOriginal {
  fill: var(--text-tertiary);
  opacity: 0.6;
}
.barKept {
  fill: var(--cyan-400);
}
.barMasked {
  fill: var(--rose-400);
  opacity: 0.18;
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

/* Stats */
.statsTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
  font-weight: 500;
}
.statsBody { display: flex; flex-direction: column; gap: 0.25rem; }
.statRow {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.statLabel { color: var(--text-secondary); }
.statValue { color: var(--text-primary); font-weight: 500; }

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
  .controlLabel, .controlValue { min-width: 0; }
  .shapeButton { padding: 0.3rem 0.6rem; font-size: 0.74rem; min-width: 50px; }
  .statRow { font-size: 0.74rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as SamplingDistribution } from './ch19/SamplingDistribution';
// Session 88 will add:
// export { default as ConstrainedDecoding } from './ch19/ConstrainedDecoding';
```

### 6. Update `src/pages/ch19-sampling/index.mdx`

**Edit A: Add widget import:**

```mdx
import { SamplingDistribution } from '@components/widgets';
```

**Edit B: Replace section-4's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Sampling distribution explorer" caption="Pick a distribution shape (peaked / bimodal / flat); adjust temperature, top-p, top-k. The top chart shows the original distribution; the bottom shows the post-pipeline distribution (cyan = in nucleus; rose-faded = masked). Stats panel shows nucleus size, top probability, entropy. Watch nucleus size adapt to distribution shape — small at peaked confidence, large at uncertainty. This is why nucleus sampling is the modern default.">
  <SamplingDistribution client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 4 of Ch 19** renders with the working widget. Section 8's placeholder still stubbed.
3. **Default state**: shape = peaked, T = 1.0, top-p = 0.95, top-k = 50. Nucleus size ~1-3 tokens.
4. **Three shape buttons**: peaked, bimodal, flat. Active button highlighted in cyan.
5. **Three sliders**: temperature (0.3-2.0), top-p (0.1-1.0), top-k (1-50). Each shows live value to the right of the label.
6. **Original distribution chart** (top): 50 gray bars showing the softmax of the chosen shape's logits.
   - **Peaked**: one tall bar around index 5; others very small
   - **Bimodal**: two tall bars around indices 5 and 12; others small
   - **Flat**: bars all roughly similar height with random variation
7. **Post-pipeline chart** (bottom): same 50 bars but colored.
   - Bars in the nucleus: **cyan** (full opacity)
   - Bars masked out: **rose** (low opacity ~0.18)
8. **Adaptive nucleus behavior**:
   - **Peaked + p=0.95**: nucleus ~1-3 tokens
   - **Bimodal + p=0.95**: nucleus ~2-5 tokens
   - **Flat + p=0.95**: nucleus ~25+ tokens
   - **This is the chapter's central insight.**
9. **Temperature interaction**: raising T from 1.0 to 1.5 should visibly flatten the post-pipeline distribution and grow the nucleus.
10. **Top-k interaction**: at top-k=10 with flat distribution, nucleus is at most 10 (regardless of top-p).
11. **Stats panel**:
    - Nucleus size: counts kept tokens
    - Truncation by: "top-p", "top-k", "both", or "none" based on which cut is tighter
    - Top probability: max of post-pipeline distribution
    - Entropy: bit-entropy of post-pipeline distribution (should decrease with smaller nucleus)
12. **Insight text** changes based on shape and current settings:
    - Peaked: "Nucleus is small — the model is confident"
    - Bimodal: "Nucleus includes both peaks — uncertain between two options"
    - Flat: "Nucleus is large — uncertain across many options"
    - Top-p ≥ 0.999: "Top-p effectively disabled — all tokens in nucleus"
13. **Mobile** (< 720px): controls stack; charts shrink but stay readable.
14. **`npm run typecheck`** passes.
15. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement actual sampling** (drawing a token from the distribution). The widget shows the *distribution*, not a draw.
- ❌ **Do not implement repetition penalties** in this widget. Section 6's territory.
- ❌ **Do not allow user-provided logits**. Three fixed shapes only.
- ❌ **Do not animate the bars**. CSS transitions are fine; no playback controls.
- ❌ **Do not show beam search** — that's a fundamentally different paradigm.
- ❌ **Do not implement constrained decoding** — session 88's territory.
- ❌ **Do not flip Ch 19's status.** Session 88 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch19/ src/components/widgets/index.ts src/pages/ch19-sampling/index.mdx
git commit -m "session 87: sampling distribution explorer marquee — visualize adaptive nucleus"
git push origin main
```

Verify on production:
- All three shape buttons work
- All three sliders work
- Charts update smoothly
- Stats update in real time
- Insight text adapts correctly

---

## Notes for the session author

**On the "peaked / bimodal / flat" pedagogical sequence:**
The three distribution shapes are designed to demonstrate the chapter's central insight progressively:
- **Peaked**: nucleus is tiny — top-p clearly preferred over top-k (top-k=50 is wasteful)
- **Bimodal**: nucleus naturally includes both peaks — top-p captures the right number
- **Flat**: nucleus is large — top-p adapts; top-k would either restrict too much (k=5) or be redundant (k=50)

Notes-for-author: "**Pick the shape; adjust top-p; watch the nucleus adapt.** This is the chapter's central insight made interactive."

**On the two-chart layout:**
The top chart shows the original distribution; the bottom shows the post-pipeline distribution. **Reader sees the input and the output simultaneously.** The visual comparison makes the transformation clear.

Notes-for-author: "Without the side-by-side, the reader has to track changes in their head. With both charts visible, the effect of each parameter is immediate."

**On the cyan / rose color encoding:**
- **Cyan (high opacity)**: tokens kept in the nucleus — sampleable
- **Rose (low opacity ~0.18)**: tokens masked out — not sampleable
- Faded rose communicates "still here in spirit but won't be picked"

The color scheme tells the truncation story at a glance.

**On the slider for top-k including an "off" state:**
At top-k = 50 (the vocabulary size), top-k is effectively off. The widget displays "k = 50 (off)" to make this clear. **Common confusion**: readers might think top-k = vocab size still truncates; the display dispels this.

**On the entropy stat being included:**
Entropy of the post-pipeline distribution is a useful diagnostic — it shrinks as the nucleus shrinks. Notes-for-author: "**Entropy gives a quantitative handle on the 'compactness' of the kept distribution.** Reader sees that at peaked + small p, entropy is near 0; at flat + large p, entropy is high."

**On the temperature interaction being a slow second-order effect:**
Temperature changes the *shape* of the distribution before truncation. Notes-for-author: "**Temperature is harder to see at a glance than top-p**, but at extreme values (T=0.3 or T=2.0) the effect is visible: T=0.3 sharpens (smaller nucleus); T=2.0 flattens (larger nucleus)."

**On the insight text being shape-aware:**
The insight text checks both the shape and the current top-p. **4 distinct messages** (peaked / bimodal / flat / top-p disabled). This makes the widget's pedagogy narrative — it tells the reader what they're seeing.

**On the caption suggesting a guided exploration:**
The caption tells readers to try the sequence: peaked → flat → raise temperature. **This is the chapter's central insight encoded as a 3-step interaction.**

**Pedagogical claim this widget supports:**
"Top-p (nucleus sampling) adapts to the distribution's peakedness — small nucleus at confident peaks, large nucleus at uncertainty. Top-k stays fixed regardless of shape — wasteful at peaks, restrictive at flat distributions. Temperature changes the underlying shape before truncation. **The widget makes 'why nucleus is the modern default' obvious by letting the reader watch the nucleus adapt across distribution shapes.**"

After 30 seconds of interaction, the reader has internalized: (a) nucleus size adapts to distribution shape; (b) top-k doesn't adapt; (c) temperature changes the distribution; (d) the stats (nucleus size, entropy) quantify what the eye sees.

**This is the chapter's central visualization.** Build with care.
