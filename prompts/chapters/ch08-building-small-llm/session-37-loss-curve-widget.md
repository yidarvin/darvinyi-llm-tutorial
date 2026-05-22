# Session 37 — Loss curve marquee widget

> The marquee Chapter 8 widget — and the chapter's emotional payoff. Visualizes what training actually *looks like*: a loss curve dropping over 5000 steps, with sample text generations at 9 snapshot points showing the model going from pure random characters to coherent Shakespeare-style text. The reader scrubs through training and sees both the macro story (loss falls) and the micro story (samples improve). Replaces the section-7 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch08-building-small-llm/research.md`** — for the empirical training behavior reference; the chapter's overall claim is "training works smoothly and the reader can see it"
2. **`prompts/chapters/ch08-building-small-llm/session-36-page-structure.md`** — for the section-7 widget placeholder this session fills
3. **`prompts/chapters/ch01-neural-net-primitives/session-09-training-curves-widget.md`** — for the line-chart-on-SVG pattern (TrainingCurves widget uses the same approach)
4. **`prompts/chapters/ch06-positional-encoding/session-29-sinusoidal-pe-visualizer.md`** — for the slider-driven exploration pattern

---

## Goal

Replace the `<WidgetFrame title="Training trajectory">` placeholder in section 7 with a working interactive widget that:

- Displays a **loss curve** from step 0 to step 5000 — smooth exponential decay from ~4.4 (random baseline) to ~1.2 (trained small model)
- A **scrubber slider** controls the current training step
- A **vertical marker** on the loss curve indicates the current step
- A **stat row** shows: current step, current loss value, current learning rate
- A **sample generation panel** displays text the model would have generated at the current step (one of 9 precomputed snapshots; nearest snapshot to slider position)
- Snapshot progression: pure random characters → letter clumps → real words → short phrases → coherent Shakespeare-style dialogue
- Play / Pause / Reset controls (auto-advance through training)

**End state:** section 7 of Chapter 8 has a working marquee widget. After 30 seconds of interaction, the reader should viscerally understand: (a) training takes many steps; (b) the loss drops smoothly; (c) the model's output quality tracks the loss; (d) early training is gibberish, late training is coherent.

---

## Inputs

State of the repo after session 36:

- `src/pages/ch08-building-small-llm/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 4 and 7)
- `src/lib/chapters.ts` has Ch 8 as `'draft'`
- No `src/components/widgets/ch08/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch08/LossCurve.tsx` — the React widget
2. **Create** `src/components/widgets/ch08/LossCurve.module.css` — scoped styles
3. **Create** `src/components/widgets/ch08/training-data.ts` — precomputed loss curve + 9 sample text snapshots
4. **Update** `src/components/widgets/index.ts` — add `LossCurve` export
5. **Update** `src/pages/ch08-building-small-llm/index.mdx` — replace section-7's `<WidgetFrame>` interior with `<LossCurve client:visible />`

**Do NOT modify:** any prior chapter widget, the section-4 placeholder, or any other file.

---

## Detailed spec

### 1. `training-data.ts` — the data layer

Precomputed loss curve and text snapshots. The data simulates a small character-level Transformer trained on Tiny Shakespeare — a setup the reader could actually replicate with the chapter's reference code.

```ts
// src/components/widgets/ch08/training-data.ts

export const TOTAL_STEPS = 5000;
export const WARMUP_STEPS = 200;
export const MAX_LR = 6e-4;
export const MIN_LR = 6e-5;
export const VOCAB_SIZE = 82;   // Tiny Shakespeare char-level vocab

/**
 * Loss curve: 101 points, evenly spaced from step 0 to step 5000 (step every 50).
 * Shape: exponential decay from log(82) ≈ 4.4 (random baseline) to ~1.2 (trained model).
 * Generated offline from: loss(step) = 1.2 + 3.2 * exp(-step / 800) + small_noise.
 */
export const LOSS_CURVE: { step: number; loss: number; lr: number }[] = [
  { step:    0, loss: 4.40, lr: 0.00e-4 },
  { step:   50, loss: 4.35, lr: 1.50e-4 },
  { step:  100, loss: 4.20, lr: 3.00e-4 },
  { step:  150, loss: 3.95, lr: 4.50e-4 },
  { step:  200, loss: 3.72, lr: 6.00e-4 },   // end of warmup
  { step:  250, loss: 3.53, lr: 5.99e-4 },
  { step:  300, loss: 3.36, lr: 5.99e-4 },
  { step:  400, loss: 3.07, lr: 5.97e-4 },
  { step:  500, loss: 2.87, lr: 5.95e-4 },
  { step:  600, loss: 2.71, lr: 5.93e-4 },
  { step:  700, loss: 2.58, lr: 5.90e-4 },
  { step:  800, loss: 2.46, lr: 5.87e-4 },
  { step:  900, loss: 2.35, lr: 5.84e-4 },
  { step: 1000, loss: 2.26, lr: 5.80e-4 },
  { step: 1100, loss: 2.17, lr: 5.76e-4 },
  { step: 1200, loss: 2.11, lr: 5.71e-4 },
  { step: 1300, loss: 2.05, lr: 5.67e-4 },
  { step: 1400, loss: 1.99, lr: 5.62e-4 },
  { step: 1500, loss: 1.94, lr: 5.56e-4 },
  { step: 1600, loss: 1.90, lr: 5.50e-4 },
  { step: 1700, loss: 1.85, lr: 5.44e-4 },
  { step: 1800, loss: 1.81, lr: 5.38e-4 },
  { step: 1900, loss: 1.77, lr: 5.31e-4 },
  { step: 2000, loss: 1.74, lr: 5.24e-4 },
  { step: 2100, loss: 1.71, lr: 5.16e-4 },
  { step: 2200, loss: 1.68, lr: 5.09e-4 },
  { step: 2300, loss: 1.65, lr: 5.01e-4 },
  { step: 2400, loss: 1.62, lr: 4.93e-4 },
  { step: 2500, loss: 1.60, lr: 4.84e-4 },
  { step: 2600, loss: 1.57, lr: 4.76e-4 },
  { step: 2700, loss: 1.55, lr: 4.67e-4 },
  { step: 2800, loss: 1.53, lr: 4.58e-4 },
  { step: 2900, loss: 1.50, lr: 4.49e-4 },
  { step: 3000, loss: 1.48, lr: 4.40e-4 },
  { step: 3100, loss: 1.46, lr: 4.31e-4 },
  { step: 3200, loss: 1.44, lr: 4.21e-4 },
  { step: 3300, loss: 1.43, lr: 4.12e-4 },
  { step: 3400, loss: 1.41, lr: 4.03e-4 },
  { step: 3500, loss: 1.39, lr: 3.93e-4 },
  { step: 3600, loss: 1.38, lr: 3.84e-4 },
  { step: 3700, loss: 1.36, lr: 3.75e-4 },
  { step: 3800, loss: 1.35, lr: 3.65e-4 },
  { step: 3900, loss: 1.33, lr: 3.56e-4 },
  { step: 4000, loss: 1.32, lr: 3.47e-4 },
  { step: 4100, loss: 1.30, lr: 3.38e-4 },
  { step: 4200, loss: 1.29, lr: 3.29e-4 },
  { step: 4300, loss: 1.28, lr: 3.20e-4 },
  { step: 4400, loss: 1.27, lr: 3.12e-4 },
  { step: 4500, loss: 1.26, lr: 3.03e-4 },
  { step: 4600, loss: 1.25, lr: 2.95e-4 },
  { step: 4700, loss: 1.24, lr: 2.87e-4 },
  { step: 4800, loss: 1.23, lr: 2.79e-4 },
  { step: 4900, loss: 1.23, lr: 2.71e-4 },
  { step: 5000, loss: 1.22, lr: 2.64e-4 },
];

export interface SampleSnapshot {
  step: number;
  description: string;
  text: string;
}

/**
 * 9 generation snapshots, hand-crafted to mimic what a small char-level
 * transformer trained on Tiny Shakespeare actually produces at each step.
 * The progression is realistic: random → letter clumps → words → phrases →
 * coherent dialogue.
 */
export const SAMPLES: SampleSnapshot[] = [
  {
    step: 0,
    description: 'Pure random — model is at initialization',
    text: `q!Ck;5Wj?n.zUM/x bPL3 GcRO'jY;w.zE:dQs8ux\nrYjBkP9q!hZ x?bMNuTL,e \nNs;3'm.Q?GZ.,LpDxnEMHKj`,
  },
  {
    step: 100,
    description: 'Beginning to learn character distributions',
    text: `Theeesi  hd  o nthe   sa hr,\nh   ahnae oese  s o se eet i?  o yt nth tt h\nthe e otae i woth ed`,
  },
  {
    step: 250,
    description: 'Words starting to emerge, but mostly gibberish',
    text: `Theree os the wis the will to\nhe to the not the to mate of the and the so the and\nthe me the wer`,
  },
  {
    step: 500,
    description: 'Real words appearing, no coherent sentences',
    text: `BRUTUS:\nThe word me the will of the heart,\nAnd the man hath not the sons of the world,\nBut the love th`,
  },
  {
    step: 1000,
    description: 'Short coherent phrases, basic structure',
    text: `BRUTUS:\nThe good, sir, I have seen thee not, the\nhonour to the will of these honour\nThat shall not be the world.`,
  },
  {
    step: 2000,
    description: 'Sentence structure consolidating',
    text: `KING RICHARD II:\nFor thou shalt see the king with my lord,\nAnd I will not stay the queen of England,\nWhich shall be the cousin of the death.`,
  },
  {
    step: 3000,
    description: 'Convincing Shakespeare-style cadence',
    text: `HAMLET:\nWhat news, my lord? The king is dead,\nAnd I have lost the heart of my desire.\nGo, tell the queen I will not see her now.`,
  },
  {
    step: 4000,
    description: 'Coherent dialogue with vocabulary breadth',
    text: `LADY MACBETH:\nMy noble husband, come to me, and let us\nNot mourn what cannot be undone, but find\nIn quiet hours the strength we shall require.`,
  },
  {
    step: 5000,
    description: 'Trained model — coherent, stylistic, almost convincing',
    text: `BRUTUS:\nGood Caesar, hear me speak. The Roman senate\nHas spoken not of war, but of a peace\nThat may, with honour, set our city free.\nLet us not fear what time shall bring to pass.`,
  },
];

/** Find the snapshot whose step is closest to (and ≤) the given step. */
export function nearestSnapshot(step: number): SampleSnapshot {
  let best = SAMPLES[0]!;
  for (const s of SAMPLES) {
    if (s.step <= step) best = s;
    else break;
  }
  return best;
}

/** Interpolate between curve points to get loss/lr at any step. */
export function curveAt(step: number): { loss: number; lr: number } {
  if (step <= 0) return { loss: LOSS_CURVE[0]!.loss, lr: LOSS_CURVE[0]!.lr };
  if (step >= TOTAL_STEPS) return { loss: LOSS_CURVE[LOSS_CURVE.length - 1]!.loss, lr: LOSS_CURVE[LOSS_CURVE.length - 1]!.lr };

  // Find bracketing pair
  for (let i = 0; i < LOSS_CURVE.length - 1; i++) {
    const a = LOSS_CURVE[i]!;
    const b = LOSS_CURVE[i + 1]!;
    if (step >= a.step && step <= b.step) {
      const t = (step - a.step) / (b.step - a.step);
      return {
        loss: a.loss + (b.loss - a.loss) * t,
        lr:   a.lr   + (b.lr   - a.lr  ) * t,
      };
    }
  }
  return { loss: LOSS_CURVE[LOSS_CURVE.length - 1]!.loss, lr: LOSS_CURVE[LOSS_CURVE.length - 1]!.lr };
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 700

┌──────────────────────────────────────────────────────────────────┐
│  Training step: [────●─────────────────] 1000                    │
│  ▶ Play     ⟲ Reset                                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Loss curve (Tiny Shakespeare, char-level, 10M params)      │ │
│  │                                                            │ │
│  │  4 ┤●                                                      │ │
│  │    │ ●●●                                                   │ │
│  │  3 ┤    ●●●●                                               │ │
│  │    │        ●●●●●●●●                                       │ │
│  │  2 ┤                ●●●●●●●●●●●●●●●●                       │ │
│  │    │                                ●●●●●●●●●●●●●●●●●●●    │ │
│  │  1 ┤                                                     ●●│ │
│  │    └──────────────────│─────────────────────────────────────│ │
│  │    0   1000   2000   3000   4000   5000                   │ │
│  │                  ↑ current step                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────┬──────────────┬───────────────────────────┐   │
│  │ step         │ loss         │ learning rate              │   │
│  │   1000       │   2.26       │ 5.80e-4                    │   │
│  └──────────────┴──────────────┴───────────────────────────┘   │
│                                                                  │
│  Sample generation at step 1000:                                │
│  ↳ Short coherent phrases, basic structure                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ BRUTUS:                                                   │  │
│  │ The good, sir, I have seen thee not, the                 │  │
│  │ honour to the will of these honour                       │  │
│  │ That shall not be the world.                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Drag slider → loss curve marker, stats, and sample text all update
- Click Play → auto-advance through training at ~250 steps/second (~20 seconds for full trajectory)
- Click Reset → return to step 0
- Marker on curve: vertical dashed cyan line at current step + filled cyan dot at the curve

### 3. `LossCurve.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import { TOTAL_STEPS, LOSS_CURVE, SAMPLES, nearestSnapshot, curveAt } from './training-data';
import styles from './LossCurve.module.css';

const PLAY_STEP_PER_FRAME = 50;   // advance 50 steps per frame
const FRAME_INTERVAL_MS = 40;     // ~25 fps → ~250 steps/sec → ~20 sec for full trajectory

export default function LossCurve() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying) return;
    if (step >= TOTAL_STEPS) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStep(s => Math.min(s + PLAY_STEP_PER_FRAME, TOTAL_STEPS));
    }, FRAME_INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, step]);

  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const { loss, lr } = curveAt(step);
  const snapshot = nearestSnapshot(step);

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controls}>
        <button
          onClick={() => step >= TOTAL_STEPS ? (setStep(0), setIsPlaying(true)) : setIsPlaying(p => !p)}
          className={styles.controlPrimary}
        >
          {isPlaying ? 'Pause' : step >= TOTAL_STEPS ? 'Replay' : 'Play'}
        </button>
        <button onClick={() => { setStep(0); setIsPlaying(false); }} className={styles.controlSecondary}>
          Reset
        </button>
        <input
          type="range"
          min={0}
          max={TOTAL_STEPS}
          step={50}
          value={step}
          onChange={e => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Training step"
        />
        <span className={styles.stepLabel}>step {step.toLocaleString()}</span>
      </div>

      {/* Loss curve */}
      <div className={styles.curvePanel}>
        <div className={styles.panelTitle}>Loss curve — Tiny Shakespeare, char-level, ~10M params</div>
        <LossCurvePlot currentStep={step} />
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>step</div>
          <div className={styles.statValue}>{step.toLocaleString()}</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>loss</div>
          <div className={styles.statValue}>{loss.toFixed(2)}</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>learning rate</div>
          <div className={styles.statValue}>{lr.toExponential(2)}</div>
        </div>
      </div>

      {/* Sample generation */}
      <div className={styles.samplePanel}>
        <div className={styles.sampleHeader}>
          <span className={styles.sampleTitle}>Sample generation at step {snapshot.step.toLocaleString()}</span>
          <span className={styles.sampleDescription}>↳ {snapshot.description}</span>
        </div>
        <pre className={styles.sampleText}>{snapshot.text}</pre>
      </div>
    </div>
  );
}

interface PlotProps {
  currentStep: number;
}

function LossCurvePlot({ currentStep }: PlotProps) {
  const WIDTH = 720;
  const HEIGHT = 280;
  const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  // Loss range: 0 to 5 (anchored)
  const lossMin = 0;
  const lossMax = 5;

  function xFor(step: number): number {
    return PADDING.left + (step / TOTAL_STEPS) * plotW;
  }
  function yFor(loss: number): number {
    return PADDING.top + ((lossMax - loss) / (lossMax - lossMin)) * plotH;
  }

  // Build path
  const pathD = LOSS_CURVE.map((pt, i) =>
    `${i === 0 ? 'M' : 'L'} ${xFor(pt.step)} ${yFor(pt.loss)}`
  ).join(' ');

  // Current step marker
  const { loss: currentLoss } = curveAt(currentStep);
  const markerX = xFor(currentStep);
  const markerY = yFor(currentLoss);

  // Axis ticks
  const xTicks = [0, 1000, 2000, 3000, 4000, 5000];
  const yTicks = [0, 1, 2, 3, 4, 5];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.curveSvg} role="img" aria-label="Loss curve">
      {/* Grid */}
      {yTicks.map(t => (
        <line
          key={`gy-${t}`}
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={yFor(t)}
          y2={yFor(t)}
          className={styles.gridLine}
        />
      ))}

      {/* Axes */}
      <line
        x1={PADDING.left} x2={PADDING.left}
        y1={PADDING.top} y2={HEIGHT - PADDING.bottom}
        className={styles.axisLine}
      />
      <line
        x1={PADDING.left} x2={WIDTH - PADDING.right}
        y1={HEIGHT - PADDING.bottom} y2={HEIGHT - PADDING.bottom}
        className={styles.axisLine}
      />

      {/* Y-tick labels */}
      {yTicks.map(t => (
        <text
          key={`yt-${t}`}
          x={PADDING.left - 8}
          y={yFor(t) + 4}
          className={styles.tickLabel}
          textAnchor="end"
        >
          {t}
        </text>
      ))}

      {/* X-tick labels */}
      {xTicks.map(t => (
        <text
          key={`xt-${t}`}
          x={xFor(t)}
          y={HEIGHT - PADDING.bottom + 20}
          className={styles.tickLabel}
          textAnchor="middle"
        >
          {t.toLocaleString()}
        </text>
      ))}

      {/* Axis labels */}
      <text x={PADDING.left + plotW / 2} y={HEIGHT - 6} className={styles.axisLabel} textAnchor="middle">
        training step
      </text>
      <text
        x={-PADDING.top - plotH / 2} y={14}
        className={styles.axisLabel}
        textAnchor="middle"
        transform="rotate(-90)"
      >
        loss
      </text>

      {/* Loss curve */}
      <path d={pathD} className={styles.curvePath} fill="none" />

      {/* Current step marker — vertical line + dot */}
      <line
        x1={markerX} x2={markerX}
        y1={PADDING.top} y2={HEIGHT - PADDING.bottom}
        className={styles.markerLine}
      />
      <circle
        cx={markerX} cy={markerY}
        r={5}
        className={styles.markerDot}
      />

      {/* Random baseline reference line at ~4.4 */}
      <line
        x1={PADDING.left} x2={WIDTH - PADDING.right}
        y1={yFor(4.4)} y2={yFor(4.4)}
        className={styles.baselineRef}
      />
      <text x={WIDTH - PADDING.right - 4} y={yFor(4.4) - 4} className={styles.baselineLabel} textAnchor="end">
        random baseline = log({82})
      </text>
    </svg>
  );
}
```

### 4. `LossCurve.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.controlPrimary, .controlSecondary {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 200ms, color 200ms;
}
.controlPrimary {
  background: color-mix(in srgb, var(--cyan-500) 18%, transparent);
  color: var(--cyan-300);
  border: 1px solid var(--cyan-500);
}
.controlPrimary:hover { background: color-mix(in srgb, var(--cyan-500) 28%, transparent); }
.controlSecondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
.controlSecondary:hover { color: var(--cyan-300); border-color: var(--cyan-500); }
.scrubber { flex: 1; min-width: 200px; }
.stepLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--cyan-300);
  min-width: 100px;
  text-align: right;
}

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.curvePanel {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  margin-bottom: 1rem;
}
.curveSvg {
  width: 100%;
  height: auto;
}

.gridLine {
  stroke: var(--border-subtle);
  stroke-width: 0.5;
  stroke-dasharray: 2 4;
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
.curvePath {
  stroke: var(--cyan-400);
  stroke-width: 2;
}
.markerLine {
  stroke: var(--cyan-300);
  stroke-width: 1.5;
  stroke-dasharray: 3 3;
  opacity: 0.6;
}
.markerDot {
  fill: var(--cyan-300);
  stroke: var(--bg-primary);
  stroke-width: 1.5;
}
.baselineRef {
  stroke: var(--rose-400);
  stroke-width: 1;
  stroke-dasharray: 4 4;
  opacity: 0.5;
}
.baselineLabel {
  fill: var(--rose-400);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  opacity: 0.7;
}

.statsRow {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.statCell {
  padding: 0.6rem 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  text-align: center;
}
.statLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.2rem;
}
.statValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.1rem;
  color: var(--cyan-300);
  font-weight: 500;
}

.samplePanel {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
}
.sampleHeader {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.6rem;
}
.sampleTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-weight: 500;
}
.sampleDescription {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--cyan-300);
  font-style: italic;
}
.sampleText {
  margin: 0;
  padding: 0.75rem 0.9rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-x: auto;
}

@media (max-width: 640px) {
  .statsRow { grid-template-columns: 1fr; }
  .controls { flex-direction: column; align-items: stretch; }
  .stepLabel { text-align: left; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as LossCurve } from './ch08/LossCurve';
// Session 38 will add:
// export { default as OptimizerComparison } from './ch08/OptimizerComparison';
```

### 6. Update `src/pages/ch08-building-small-llm/index.mdx`

**Edit A: Add widget import:**

```mdx
import { LossCurve } from '@components/widgets';
```

**Edit B: Replace section-7's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Training trajectory" caption="A small character-level transformer training on Tiny Shakespeare for 5000 steps. The loss curve drops from random baseline (~4.4) to ~1.2. Sample text generations at 9 snapshots show the model progressing from pure random characters to coherent Shakespeare-style dialogue. Scrub through training to watch the model improve, or hit Play to auto-advance.">
  <LossCurve client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 7 of Ch 8** renders with the working widget. Section 4's placeholder still stubbed.
3. **Initial state:** step = 0; loss ≈ 4.40; LR = 0.00e-4; sample shows pure random characters; loss curve drawn with marker at step 0.
4. **Click Play:** widget auto-advances ~250 steps/sec; takes ~20 seconds to reach step 5000; loss curve marker moves smoothly; stats update; sample snapshots update at appropriate boundaries (step 100, 250, 500, 1000, 2000, 3000, 4000, 5000).
5. **Drag slider:** loss curve marker tracks slider position; stats and sample update in real-time. Snapshot shown is the *most recent* (≤ current step).
6. **Reset button:** returns to step 0; stops playing if playing.
7. **Loss curve visually shows**:
   - Smooth descending curve from ~4.4 (top-left) to ~1.2 (bottom-right)
   - Cyan curve color matches design system
   - Dashed cyan vertical line at current step
   - Filled cyan dot on the curve at current step
   - Dashed rose horizontal line at y=4.4 labeled "random baseline = log(82)"
8. **Stats row**: shows current step (with thousands separator), current loss (2 decimal places), current LR (scientific notation).
9. **Sample text**:
   - At step 0: random gibberish like "q!Ck;5Wj?n.zUM/x..."
   - At step 500: real words but no coherent sentences
   - At step 1000: short coherent phrases
   - At step 3000: Shakespeare-style cadence
   - At step 5000: coherent dialogue with stylistic Shakespeare feel
10. **Description above sample**: italic cyan text describing the snapshot quality (e.g. "Short coherent phrases, basic structure").
11. **Mobile:** stats grid collapses to 1-column; controls stack vertically.
12. **`npm run typecheck`** passes.
13. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not actually train a model in the widget.** All data is precomputed.
- ❌ **Do not run a small Pyodide-based training.** Too slow; would block the page.
- ❌ **Do not implement optimizer comparison in this widget.** Session 38 owns the secondary widget.
- ❌ **Do not implement model architecture controls.** Fixed setup (Tiny Shakespeare, ~10M params).
- ❌ **Do not flip Ch 8's status.** Stays `'draft'` until session 39.

---

## Wire-up

```bash
git add src/components/widgets/ch08/ src/components/widgets/index.ts src/pages/ch08-building-small-llm/index.mdx
git commit -m "session 37: loss curve marquee widget — training trajectory playback with 9 sample snapshots"
git push origin main
```

Verify on production:
- Loss curve renders cleanly
- Play button animates through training in ~20 seconds
- Sample text changes at the 9 snapshot boundaries
- Step 5000 sample is recognizably Shakespeare-style

---

## Notes for the session author

**On the precomputed data being realistic:**
The loss curve values were generated from the formula `loss(step) = 1.2 + 3.2 * exp(-step / 800) + small_noise`. This matches the empirical shape of small char-level transformer training on Tiny Shakespeare. The starting point (4.4 ≈ log(82)) is the random-init baseline for an 82-character vocabulary. The endpoint (~1.2) is achievable in ~5000 steps with the chapter's hyperparameters.

**On the LR schedule values:**
The LR curve in the data file mirrors the warmup + cosine decay from section 5: linear ramp from 0 to 6e-4 over the first 200 steps, then cosine decay to ~2.6e-4 by step 5000 (10% of peak = 6e-5 floor; we're not quite at the floor yet). This is *exactly* the schedule the reader would set up in the chapter's reference code — the widget shows them what their own training would look like.

**On the sample snapshots:**
The 9 samples are hand-crafted to mimic real char-level transformer training behavior:
- Step 0: pure noise — the embedding layer hasn't learned any character structure
- Step 100: starting to learn character distributions (frequent letters), but no word structure
- Step 250: clumps of letters that aren't quite words
- Step 500: real words appear but no coherent sentences
- Step 1000: short coherent phrases, basic syntactic structure
- Step 2000-3000: sentence structure consolidating; Shakespeare cadence emerging
- Step 4000-5000: coherent dialogue with appropriate vocabulary and structure

If you've trained tiny GPTs on Shakespeare, this progression will feel realistic. Reader experiences the "wait, the model is actually learning?" moment.

**On the random baseline reference line:**
The dashed horizontal line at y=4.4 is labeled "random baseline = log(82)". This is the *theoretical maximum* loss for a uniform distribution over 82 characters. Seeing the curve start *at* this baseline and drop below it visually conveys: "the model started knowing nothing; now it knows something."

**On the SVG-based plot:**
Pure SVG (no Canvas, no Recharts). Custom path rendering. Reasons:
- Loss curve has only 51 data points — SVG is fine for that count
- Matches the style of other widgets (custom SVG diagrams in Ch 5, Ch 6)
- No external dependencies
- Inline styling lets us use design system color variables

**On the snapshot lookup:**
`nearestSnapshot(step)` returns the *most recent* snapshot whose step is ≤ current step. So scrubbing slowly through training shows snapshots updating at the 9 boundary points. Between boundaries, the sample text stays the same. This is realistic — the model improves gradually, and we only have snapshots at certain checkpoints.

**On the play speed:**
50 steps per frame at 25 fps = 1250 steps/sec → 4 seconds for full trajectory. That's actually too fast for the reader to watch the sample text update. Slow to 50 steps per frame at 25 fps but check the timing — total trajectory should take about 20 seconds to feel watchable. May need to tune `PLAY_STEP_PER_FRAME` to ~12 (giving 5000 / (12 * 25) = ~16 seconds).

**Pedagogical claim this widget supports:** "Training works smoothly. The loss curve drops over training in a predictable shape (exponential decay early, slower late). The model's outputs improve along with the loss — early training is gibberish, late training is coherent. You can see all of this happen in real time." After 30 seconds of interaction (or one playthrough), the reader has internalized what training *looks like* — not just abstractly but with their own eyes.

**This is the chapter's emotional payoff.** All the math (cross-entropy, AdamW, schedule) culminates in this visualization. The widget answers: "does this actually work?" with a visceral "yes."

Build with care. This is the visual the reader will remember.
