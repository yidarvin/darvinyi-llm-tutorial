# Session 90 — Test-time compute curves marquee widget

> The marquee Chapter 20 widget. **An interactive accuracy-vs-compute plot** showing six reasoning techniques scaling with inference compute, across three problem-difficulty regimes. **Snell 2024's central empirical insight made visceral**: on easy problems, all techniques converge fast and extra compute is wasted; on hard problems, the curves diverge dramatically — modern reasoning models and best-of-N+PRM pull 30+ percentage points ahead of direct generation. **The widget that explains why o1 and R1 think for minutes** in 30 seconds of interaction.

---

## Read first (in this order)

1. **`research/ch20-reasoning/research.md`** — concepts 6 (test-time compute scaling) and 8 (the technique table) are the source material
2. **`prompts/chapters/ch20-reasoning/session-89-page-structure.md`** — for the section-6 widget placeholder this session fills
3. **`prompts/chapters/ch9-scaling/session-XX-scaling-laws-widget.md`** *(if exists)* — for the log-axis curve plotting pattern (closest precedent)
4. **`prompts/chapters/ch19-sampling/session-87-sampling-distribution-widget.md`** — for the most recent multi-curve / multi-slider Phase 12 widget conventions

---

## Goal

Replace the `<WidgetFrame title="Test-time compute scaling">` placeholder in section 6 with a working interactive widget that:

- Renders an **accuracy-vs-compute plot** (y-axis: accuracy 0-100%; x-axis: log-scale compute, 1× to 1000×)
- Plots **six reasoning techniques** as separate colored curves:
  1. **Direct generation** (1× compute; flat at one point)
  2. **Zero-shot CoT** (1-2× compute)
  3. **Self-consistency** (N×, where N is the compute budget)
  4. **Best-of-N + PRM** (N×, with better gain than self-consistency)
  5. **Tree-of-thoughts** (10-100×; flattens at high compute)
  6. **Modern reasoning model** (RLVR-trained; highest accuracy at all compute levels)
- **Difficulty selector**: easy / medium / hard (3 buttons)
- On **easy problems**: all curves converge near 100% accuracy at low compute (the "ceiling effect")
- On **medium problems**: curves spread but most reach 80%+ given enough compute
- On **hard problems**: curves diverge dramatically — direct stays at ~30%; modern reasoning model reaches ~85%
- **Annotated insights** below the plot that update with the difficulty selection
- **Pedagogical caption** explaining what the reader is seeing

**End state:** section 6 of Chapter 20 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) **easy problems plateau at low compute** — extra thinking is wasted; (b) **hard problems benefit dramatically** from extra compute; (c) **modern reasoning models pull ahead of all prompting techniques** on hard problems; (d) **the cost-quality math justifies multi-minute thinking** when problems are hard enough.

---

## Inputs

State of the repo after session 89:

- `src/pages/ch20-reasoning/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 6)
- `src/lib/chapters.ts` has Ch 20 as `'draft'`
- No `src/components/widgets/ch20/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch20/TestTimeComputeCurves.tsx` — the React widget
2. **Create** `src/components/widgets/ch20/TestTimeComputeCurves.module.css` — scoped styles
3. **Create** `src/components/widgets/ch20/compute-curves-data.ts` — pre-computed curves and accuracy functions
4. **Update** `src/components/widgets/index.ts` — add `TestTimeComputeCurves` export
5. **Update** `src/pages/ch20-reasoning/index.mdx` — replace section-6's `<WidgetFrame>` interior with `<TestTimeComputeCurves client:visible />`

---

## Detailed spec

### 1. `compute-curves-data.ts` — pre-computed accuracy curves

The curves are **hand-tuned to be pedagogically clear**, not measured from real models. They reflect the qualitative shape reported in Snell 2024 and similar literature.

```ts
// src/components/widgets/ch20/compute-curves-data.ts

export type Difficulty = 'easy' | 'medium' | 'hard';

export type TechniqueId =
  | 'direct'
  | 'zero-shot-cot'
  | 'self-consistency'
  | 'best-of-n-prm'
  | 'tree-of-thoughts'
  | 'modern-reasoning';

export interface TechniqueSpec {
  id: TechniqueId;
  label: string;
  shortLabel: string;
  color: 'gray' | 'amber' | 'cyan' | 'emerald' | 'violet' | 'cyan-bright';
  description: string;
}

export const TECHNIQUES: TechniqueSpec[] = [
  {
    id: 'direct',
    label: 'Direct generation',
    shortLabel: 'Direct',
    color: 'gray',
    description: 'Single forward pass; baseline.',
  },
  {
    id: 'zero-shot-cot',
    label: 'Zero-shot CoT',
    shortLabel: 'CoT',
    color: 'amber',
    description: '"Let\'s think step by step." Same model, longer trace.',
  },
  {
    id: 'self-consistency',
    label: 'Self-consistency',
    shortLabel: 'Self-cons.',
    color: 'cyan',
    description: 'N independent CoT traces; majority vote.',
  },
  {
    id: 'best-of-n-prm',
    label: 'Best-of-N + PRM',
    shortLabel: 'BoN+PRM',
    color: 'emerald',
    description: 'N traces, scored by a process reward model.',
  },
  {
    id: 'tree-of-thoughts',
    label: 'Tree-of-thoughts',
    shortLabel: 'ToT',
    color: 'violet',
    description: 'Search over reasoning paths with backtracking.',
  },
  {
    id: 'modern-reasoning',
    label: 'Modern reasoning model (o1, R1)',
    shortLabel: 'Reasoning',
    color: 'cyan-bright',
    description: 'RLVR-trained; emits long internal reasoning autonomously.',
  },
];

/** Compute levels (log scale): 1×, 2×, 5×, 10×, 20×, 50×, 100×, 200×, 500×, 1000× */
export const COMPUTE_LEVELS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

/**
 * Accuracy as a function of (technique, difficulty, compute).
 * Hand-tuned to be pedagogically clear.
 * 
 * Pattern:
 *   - All techniques have a *baseline* accuracy at 1× compute
 *   - Most techniques *only operate at certain compute levels* (e.g., direct is always 1×)
 *   - Technique accuracy approaches an *asymptote* as compute → ∞
 *   - Higher difficulty → lower asymptote and slower approach
 */
export interface CurvePoint {
  compute: number;
  accuracy: number;       // 0-100
  defined: boolean;        // false if technique doesn't make sense at this compute level
}

export type DifficultyProfile = {
  baseline: number;       // direct-generation accuracy at 1×
  cotMultiplier: number;  // CoT lifts to baseline * cotMultiplier
  asymptote: {            // technique ceiling at infinite compute
    [K in TechniqueId]: number;
  };
  steepness: {            // how fast each technique approaches its asymptote
    [K in TechniqueId]: number;
  };
};

const PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: {
    baseline: 75,
    cotMultiplier: 1.18,
    asymptote: {
      'direct': 75,
      'zero-shot-cot': 89,
      'self-consistency': 94,
      'best-of-n-prm': 96,
      'tree-of-thoughts': 95,
      'modern-reasoning': 97,
    },
    steepness: {
      'direct': 0,
      'zero-shot-cot': 0,
      'self-consistency': 1.4,
      'best-of-n-prm': 1.6,
      'tree-of-thoughts': 1.1,
      'modern-reasoning': 1.8,
    },
  },
  medium: {
    baseline: 42,
    cotMultiplier: 1.55,
    asymptote: {
      'direct': 42,
      'zero-shot-cot': 65,
      'self-consistency': 78,
      'best-of-n-prm': 84,
      'tree-of-thoughts': 80,
      'modern-reasoning': 91,
    },
    steepness: {
      'direct': 0,
      'zero-shot-cot': 0,
      'self-consistency': 0.9,
      'best-of-n-prm': 1.0,
      'tree-of-thoughts': 0.7,
      'modern-reasoning': 1.3,
    },
  },
  hard: {
    baseline: 12,
    cotMultiplier: 2.2,
    asymptote: {
      'direct': 12,
      'zero-shot-cot': 26,
      'self-consistency': 48,
      'best-of-n-prm': 64,
      'tree-of-thoughts': 56,
      'modern-reasoning': 85,
    },
    steepness: {
      'direct': 0,
      'zero-shot-cot': 0,
      'self-consistency': 0.6,
      'best-of-n-prm': 0.7,
      'tree-of-thoughts': 0.5,
      'modern-reasoning': 0.9,
    },
  },
};

/** 
 * Smooth saturation curve: accuracy starts at baseline, approaches asymptote as compute grows.
 * Uses 1 - exp(-k * log10(compute)) shape — gentle ascent, smooth saturation.
 */
function saturating(baseline: number, asymptote: number, compute: number, steepness: number): number {
  if (compute <= 1 || steepness === 0) return baseline;
  const ramp = 1 - Math.exp(-steepness * Math.log10(compute));
  return baseline + (asymptote - baseline) * ramp;
}

/** Where each technique operates on the compute axis. */
function operatingRange(t: TechniqueId): [number, number] {
  switch (t) {
    case 'direct':            return [1, 1];
    case 'zero-shot-cot':     return [1, 2];      // 1-2× compute
    case 'self-consistency':  return [5, 1000];   // multi-sample
    case 'best-of-n-prm':     return [5, 1000];
    case 'tree-of-thoughts':  return [10, 1000];
    case 'modern-reasoning':  return [10, 1000];  // model thinks; doesn't run at 1×
    default:                  return [1, 1000];
  }
}

/** Build a curve of (compute, accuracy) points for a given technique + difficulty. */
export function buildCurve(t: TechniqueId, d: Difficulty): CurvePoint[] {
  const profile = PROFILES[d];
  const [minC, maxC] = operatingRange(t);
  const baseline = profile.baseline;
  const asymptote = profile.asymptote[t];
  const steepness = profile.steepness[t];

  return COMPUTE_LEVELS.map(c => {
    if (c < minC || c > maxC) {
      return { compute: c, accuracy: NaN, defined: false };
    }
    // CoT/direct: flat (no scaling). Self-consistency etc.: saturating curve from min compute.
    let accuracy: number;
    if (t === 'direct') {
      accuracy = baseline;
    } else if (t === 'zero-shot-cot') {
      // Single bump at 1-2× to CoT-baseline
      accuracy = baseline * profile.cotMultiplier;
    } else {
      // Saturating curve from operating range start
      accuracy = saturating(baseline, asymptote, c / minC, steepness);
    }
    return { compute: c, accuracy: Math.min(100, accuracy), defined: true };
  });
}

/** Pre-compute all curves once per difficulty. */
export function buildAllCurves(d: Difficulty): Record<TechniqueId, CurvePoint[]> {
  return Object.fromEntries(
    TECHNIQUES.map(t => [t.id, buildCurve(t.id, d)])
  ) as Record<TechniqueId, CurvePoint[]>;
}

/** Adaptive insight text for the current difficulty. */
export interface InsightBlock {
  difficulty: Difficulty;
  title: string;
  body: string;
  numbers: string;
}

export function insightFor(d: Difficulty): InsightBlock {
  if (d === 'easy') {
    return {
      difficulty: 'easy',
      title: 'Easy problems plateau quickly',
      body: 'All techniques converge near the ceiling. Extra compute beyond a few × is wasted — the model already knows the answer.',
      numbers: 'Direct: ~75% · Reasoning model at 100×: ~97% — a 22-point gap, mostly closed by simple CoT.',
    };
  }
  if (d === 'medium') {
    return {
      difficulty: 'medium',
      title: 'Medium problems reward modest compute',
      body: 'Self-consistency and best-of-N pay off; tree-of-thoughts and reasoning models keep climbing. Diminishing returns appear above ~100×.',
      numbers: 'Direct: ~42% · Reasoning model at 100×: ~91% — a 49-point gap. CoT alone closes ~23 points.',
    };
  }
  return {
    difficulty: 'hard',
    title: 'Hard problems benefit dramatically',
    body: 'Curves spread widely. Modern reasoning models pull 30+ points ahead of all prompting techniques. Compute scaling is *most* valuable here.',
    numbers: 'Direct: ~12% · Reasoning model at 1000×: ~85% — a 73-point gap. CoT alone only reaches ~26%.',
  };
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Test-time compute scaling                                        │
│                                                                  │
│ Difficulty:  [ easy ]  [ medium ]  [ hard ]                      │
│                                                                  │
│  Accuracy (%)                                                     │
│  100 ┤    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ modern reasoning model    │
│      │   /  ━━━━━━━━━━━━━━━━━━━ best-of-N + PRM                  │
│   80 ┤  /  /   ━━━━━━━━━━━━ tree-of-thoughts                     │
│      │ /  / ──  ────────── self-consistency                      │
│   60 ┤/  /                                                        │
│      │ ─/                                                         │
│   40 ┤  ──── zero-shot CoT (flat: only at 1-2×)                  │
│      │                                                            │
│   20 ┤ ●  direct generation (single point at 1×)                 │
│      │                                                            │
│    0 ┼─────┬─────┬─────┬─────┬─────┬─────┬─────                  │
│      1×    2×    10×   100×  1000×    compute (log scale)         │
│                                                                  │
│  Legend:                                                          │
│  ━ direct (gray)        ━ CoT (amber)        ━ self-cons. (cyan)  │
│  ━ BoN+PRM (emerald)    ━ ToT (violet)       ━ reasoning (cyan!)  │
│                                                                  │
│ Insight (hard difficulty):                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Hard problems benefit dramatically                           │ │
│ │ Curves spread widely. Modern reasoning models pull 30+ points│ │
│ │ ahead of all prompting techniques. Compute scaling is *most*  │ │
│ │ valuable here.                                                │ │
│ │ Direct: ~12% · Reasoning model at 1000×: ~85% — 73-point gap │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click difficulty button → instantly redraws all 6 curves and updates the insight
- No sliders — the difficulty selector is the only control
- Hovering a curve (optional, nice-to-have): show the technique label and accuracy at that compute level
- Legend toggling (optional, nice-to-have): click a legend entry to hide/show that curve

**Visual encoding:**
- 6 colored curves, each labeled
- X-axis: logarithmic (positions 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000)
- Y-axis: linear (0-100%)
- "Direct" appears as a dot at 1× (no curve, just a point)
- "Zero-shot CoT" appears as a short horizontal segment from 1× to 2×
- Other 4 techniques: full curves from their minimum operating compute to 1000×
- Background grid (faint)
- Annotations next to the rightmost point of each curve (technique short label)

### 3. `TestTimeComputeCurves.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  TECHNIQUES, COMPUTE_LEVELS,
  buildAllCurves, insightFor,
  type Difficulty, type TechniqueId,
} from './compute-curves-data';
import styles from './TestTimeComputeCurves.module.css';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const COLOR_MAP: Record<string, string> = {
  'gray': 'var(--text-tertiary)',
  'amber': 'var(--amber-400)',
  'cyan': 'var(--cyan-400)',
  'emerald': 'var(--emerald-400)',
  'violet': 'var(--violet-400)',
  'cyan-bright': 'var(--cyan-200)',
};

export default function TestTimeComputeCurves() {
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const curves = useMemo(() => buildAllCurves(difficulty), [difficulty]);
  const insight = insightFor(difficulty);

  // SVG plot setup
  const W = 740, H = 360;
  const pad = { l: 60, r: 110, t: 30, b: 50 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  // X (log scale): map compute (1 to 1000) → 0..plotW
  function xFor(compute: number) {
    const t = Math.log10(compute) / Math.log10(1000);
    return pad.l + t * plotW;
  }
  // Y (linear 0-100): map accuracy → plotH..0
  function yFor(accuracy: number) {
    return pad.t + (1 - accuracy / 100) * plotH;
  }

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Test-time compute scaling</div>
        <div className={styles.titleSubLabel}>
          Six reasoning techniques · accuracy vs inference compute
        </div>
      </div>

      {/* Difficulty selector */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Problem difficulty:</span>
          <div className={styles.diffButtons}>
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`${styles.diffButton} ${difficulty === d ? styles.diffButtonActive : ''}`}
                onClick={() => setDifficulty(d)}
              >{d}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Plot */}
      <div className={styles.plotPanel}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={styles.plotSvg}
          role="img"
          aria-label="Accuracy vs compute for six reasoning techniques"
        >
          {/* Grid: horizontal lines at 20, 40, 60, 80, 100 */}
          {[0, 20, 40, 60, 80, 100].map(y => (
            <g key={`grid-y-${y}`}>
              <line
                x1={pad.l} x2={pad.l + plotW}
                y1={yFor(y)} y2={yFor(y)}
                className={styles.gridLine}
              />
              <text
                x={pad.l - 6} y={yFor(y) + 4}
                textAnchor="end"
                className={styles.axisLabel}
              >{y}</text>
            </g>
          ))}

          {/* X-axis tick labels */}
          {[1, 10, 100, 1000].map(c => (
            <g key={`xtick-${c}`}>
              <line
                x1={xFor(c)} x2={xFor(c)}
                y1={pad.t + plotH} y2={pad.t + plotH + 4}
                className={styles.gridLine}
              />
              <text
                x={xFor(c)} y={pad.t + plotH + 18}
                textAnchor="middle"
                className={styles.axisLabel}
              >{c}×</text>
            </g>
          ))}

          {/* X axis */}
          <line
            x1={pad.l} x2={pad.l + plotW}
            y1={pad.t + plotH} y2={pad.t + plotH}
            className={styles.axis}
          />
          {/* Y axis */}
          <line
            x1={pad.l} x2={pad.l}
            y1={pad.t} y2={pad.t + plotH}
            className={styles.axis}
          />

          {/* Axis titles */}
          <text
            x={pad.l + plotW / 2} y={H - 8}
            textAnchor="middle"
            className={styles.axisTitle}
          >Inference compute (log scale)</text>
          <text
            x={14} y={pad.t + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${pad.t + plotH / 2})`}
            className={styles.axisTitle}
          >Accuracy (%)</text>

          {/* Plot each technique's curve */}
          {TECHNIQUES.map(tech => {
            const pts = curves[tech.id].filter(p => p.defined);
            if (pts.length === 0) return null;
            const color = COLOR_MAP[tech.color] ?? 'var(--text-tertiary)';

            if (tech.id === 'direct') {
              // Single dot
              const p = pts[0]!;
              return (
                <g key={tech.id}>
                  <circle
                    cx={xFor(p.compute)} cy={yFor(p.accuracy)}
                    r={5}
                    fill={color}
                    className={styles.endpointDot}
                  />
                  <text
                    x={xFor(p.compute) + 10} y={yFor(p.accuracy) + 4}
                    className={styles.curveLabel}
                    fill={color}
                  >{tech.shortLabel}</text>
                </g>
              );
            }

            if (tech.id === 'zero-shot-cot') {
              // Short horizontal segment 1×→2×
              const p1 = pts[0]!, p2 = pts[pts.length - 1]!;
              return (
                <g key={tech.id}>
                  <line
                    x1={xFor(p1.compute)} y1={yFor(p1.accuracy)}
                    x2={xFor(p2.compute)} y2={yFor(p2.accuracy)}
                    stroke={color}
                    strokeWidth={2.5}
                  />
                  <text
                    x={xFor(p2.compute) + 8} y={yFor(p2.accuracy) + 4}
                    className={styles.curveLabel}
                    fill={color}
                  >{tech.shortLabel}</text>
                </g>
              );
            }

            // Full curve
            const path = pts.map((p, i) =>
              `${i === 0 ? 'M' : 'L'} ${xFor(p.compute)} ${yFor(p.accuracy)}`
            ).join(' ');
            const last = pts[pts.length - 1]!;
            return (
              <g key={tech.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={tech.id === 'modern-reasoning' ? 3.0 : 2.0}
                />
                <circle cx={xFor(last.compute)} cy={yFor(last.accuracy)} r={3.5} fill={color} />
                <text
                  x={xFor(last.compute) + 8} y={yFor(last.accuracy) + 4}
                  className={tech.id === 'modern-reasoning' ? styles.curveLabelEmph : styles.curveLabel}
                  fill={color}
                >{tech.shortLabel}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Insight panel */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>
          Insight · <strong>{insight.difficulty}</strong> difficulty
        </div>
        <div className={styles.insightTitle}>{insight.title}</div>
        <div className={styles.insightBody}>{insight.body}</div>
        <div className={styles.insightNumbers}>{insight.numbers}</div>
      </div>

      {/* Legend / technique descriptions */}
      <div className={styles.legendPanel}>
        <div className={styles.legendTitle}>Techniques</div>
        <div className={styles.legendGrid}>
          {TECHNIQUES.map(tech => (
            <div key={tech.id} className={styles.legendRow}>
              <span
                className={styles.legendSwatch}
                style={{ background: COLOR_MAP[tech.color] }}
              />
              <span className={styles.legendName}>{tech.label}</span>
              <span className={styles.legendDesc}>{tech.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Try the sequence <strong>easy → medium → hard</strong>. On <strong>easy</strong>, all curves
        converge fast — extra compute is wasted. On <strong>medium</strong>, the spread grows; reasoning
        models pull ahead. On <strong>hard</strong>, the gap is dramatic: <strong>direct generation
        plateaus near 12%; modern reasoning models reach ~85%</strong> at 1000× compute. This is
        Snell 2024's central insight, and the economic foundation of o1/R1 — for hard problems,
        thinking longer beats thinking with more parameters.
      </div>
    </div>
  );
}
```

### 4. `TestTimeComputeCurves.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .plotPanel, .insightPanel, .legendPanel, .caption {
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
  flex-wrap: wrap;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 140px;
}
.diffButtons { display: flex; gap: 0.3rem; }
.diffButton {
  padding: 0.4rem 1.1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
  min-width: 80px;
}
.diffButton:hover {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.diffButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 12%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Plot */
.plotSvg {
  width: 100%;
  height: auto;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
}
.axis { stroke: var(--border-default); stroke-width: 1.2; }
.gridLine { stroke: var(--border-subtle); stroke-width: 0.7; opacity: 0.6; }
.axisLabel {
  fill: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}
.axisTitle {
  fill: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
}
.endpointDot { filter: drop-shadow(0 0 4px currentColor); }
.curveLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
}
.curveLabelEmph {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
}

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
  margin-bottom: 0.4rem;
}
.insightLabel strong { color: var(--cyan-200); }
.insightTitle {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 0.3rem;
}
.insightBody {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 0.4rem;
}
.insightNumbers {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--cyan-300);
  font-style: italic;
}

/* Legend */
.legendTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.55rem;
  font-weight: 500;
}
.legendGrid {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.legendRow {
  display: grid;
  grid-template-columns: 16px 220px 1fr;
  gap: 0.6rem;
  align-items: center;
  font-size: 0.78rem;
}
.legendSwatch {
  width: 14px; height: 4px;
  border-radius: 2px;
}
.legendName {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
  font-weight: 500;
}
.legendDesc { color: var(--text-secondary); }

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
  .diffButton { padding: 0.35rem 0.6rem; font-size: 0.74rem; min-width: 60px; }
  .legendRow { grid-template-columns: 16px 1fr; gap: 0.4rem; }
  .legendDesc { display: none; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as TestTimeComputeCurves } from './ch20/TestTimeComputeCurves';
// Session 91 will add:
// export { default as SelfConsistencyAggregator } from './ch20/SelfConsistencyAggregator';
```

### 6. Update `src/pages/ch20-reasoning/index.mdx`

**Edit A: Add widget import:**

```mdx
import { TestTimeComputeCurves } from '@components/widgets';
```

**Edit B: Replace section-6's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Test-time compute scaling" caption="Accuracy vs inference compute across six reasoning techniques. Pick a problem difficulty (easy / medium / hard) and watch the curves. On easy problems, everyone reaches the ceiling fast — extra compute is wasted. On hard problems, modern reasoning models pull 30+ points ahead. This is Snell 2024's central empirical insight, and the economic foundation of the o1/R1 paradigm.">
  <TestTimeComputeCurves client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 6 of Ch 20** renders with the working widget. Section 3's placeholder still stubbed.
3. **Default state**: difficulty = hard. Six curves visible with reasoning model dramatically above others.
4. **Difficulty buttons** (easy / medium / hard): active one highlighted in cyan.
5. **Curves redraw instantly** when difficulty changes. No animation glitches.
6. **Six techniques rendered correctly**:
   - **Direct generation**: single dot at 1× compute
   - **Zero-shot CoT**: short horizontal segment from 1× to 2× compute
   - **Self-consistency**: full curve from 5× to 1000×
   - **Best-of-N + PRM**: full curve from 5× to 1000×, above self-consistency
   - **Tree-of-thoughts**: full curve from 10× to 1000×
   - **Modern reasoning model**: full curve from 10× to 1000×, *highest* of all techniques at all compute levels
7. **Modern reasoning curve emphasized** (thicker stroke, brighter color, slightly larger label).
8. **Each curve ends with a labeled endpoint** showing the technique's short name.
9. **X-axis is logarithmic**: ticks at 1×, 10×, 100×, 1000×.
10. **Y-axis is linear**: ticks at 0, 20, 40, 60, 80, 100; horizontal grid lines.
11. **Easy difficulty**: all curves above 75%; spread is small (~22 points top to bottom).
12. **Medium difficulty**: curves spread to ~49 points (direct 42% → reasoning 91%).
13. **Hard difficulty**: curves spread dramatically (direct 12% → reasoning 85% — a 73-point gap).
14. **Insight panel** updates with each difficulty change; shows title, body, and concrete numbers.
15. **Legend** shows all six techniques with color swatches and one-line descriptions.
16. **Mobile** (< 720px): controls stack; descriptions hidden in legend (just colors + names).
17. **`npm run typecheck`** passes.
18. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not use real benchmark data**. Hand-tuned curves only — they're pedagogically clear and reflect the *qualitative* shape from Snell 2024.
- ❌ **Do not allow user input for accuracy values**. Curves are fixed per difficulty.
- ❌ **Do not implement curve toggling** (click legend to hide). Nice-to-have but not required.
- ❌ **Do not implement hover tooltips**. Nice-to-have but not required.
- ❌ **Do not show error bars or confidence intervals**. Clean curves only.
- ❌ **Do not animate curve transitions** between difficulties. Instant redraw is clearer.
- ❌ **Do not implement actual reasoning** (no sampling, no PRM). The widget is about *curves*, not execution.
- ❌ **Do not flip Ch 20's status**. Session 117 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch20/ src/components/widgets/index.ts src/pages/ch20-reasoning/index.mdx
git commit -m "session 90: test-time compute curves marquee — visualize Snell 2024's insight"
git push origin main
```

Verify on production:
- All three difficulty buttons work
- Curves render correctly per difficulty
- Reasoning model curve is visually emphasized
- Insight text adapts to difficulty
- Legend descriptions readable

---

## Notes for the session author

**On the hand-tuned curves vs real benchmark data:**
The curves in this widget are **hand-tuned for pedagogical clarity**, not derived from real measurements. Real Snell 2024 curves have similar *qualitative* shapes — saturating with log compute, with hard problems spreading further than easy ones — but the exact numbers depend on dataset, model, and technique implementation. **For pedagogy, clean tuned curves are better than noisy real data.** Notes-for-author: "The reader's job is to *see* the qualitative pattern (curves saturate; harder problems spread more; reasoning models pull ahead). Real data would obscure this with noise."

**On the easy → medium → hard sequence as the chapter's "aha":**
The widget's pedagogical power comes from clicking through difficulties:
- **Easy**: all curves bunch up near 100% — visually unimpressive
- **Medium**: curves spread modestly — improvement visible
- **Hard**: curves diverge dramatically — reasoning model towers above the rest

Notes-for-author: "**The hard difficulty is the chapter's 'aha moment.'** The reader sees why o1 and R1 think for minutes — the cost-quality math works out only on hard problems. This is Snell 2024's central insight made visible in two clicks."

**On the modern reasoning curve being visually emphasized:**
The "modern reasoning model" curve uses a brighter cyan (cyan-200 vs cyan-400 for self-consistency) and slightly thicker stroke (3.0 vs 2.0). **This is intentional**: the chapter's argument is that modern reasoning is the qualitatively new thing. The visual hierarchy should reinforce this.

**On direct generation being a single dot:**
Direct generation only operates at 1× compute — there's no "more compute" version of single-forward-pass generation. **Showing it as a single dot** (not a flat line) communicates this correctly. Notes-for-author: "Direct generation isn't a curve; it's a *point*. The visual makes this clear."

**On zero-shot CoT being a short segment:**
Zero-shot CoT runs at 1-2× compute (the trace is longer than direct, but it's still a single forward pass per query). **Showing it as a short horizontal segment** captures this — a tiny range of compute, modest accuracy gain over direct.

**On the asymptote/steepness profile structure:**
The data layer separates each technique's:
- **Operating range** (where on the compute axis it appears)
- **Asymptote** (its accuracy ceiling at infinite compute)
- **Steepness** (how fast it approaches the ceiling)

Notes-for-author: "This separation makes the data file self-documenting. A future author can adjust asymptotes or steepnesses without rewriting the saturation logic."

**On the insight numbers being concrete:**
Each insight block ends with a concrete numerical comparison: "Direct: ~12% · Reasoning model at 1000×: ~85% — a 73-point gap." **Numbers ground the qualitative observation.** Notes-for-author: "Readers remember 'a 73-point gap' better than 'a big gap.' Be concrete."

**On the legend giving each technique a one-line description:**
The legend isn't just colors — it's a one-line summary of each technique. Reader who only glances at the widget gets a primer on the techniques in the legend. Notes-for-author: "**The legend is also pedagogy.** Even without clicking, the reader walks away knowing what each technique is."

**On the caption's "easy → medium → hard" instruction:**
The caption tells the reader the recommended interaction sequence. **This is guided exploration**: by the end of three clicks, the reader has seen the curves diverge and understands why test-time compute matters.

**Pedagogical claim this widget supports:**
"Inference compute scales with stable, predictable curves across reasoning techniques. On easy problems, all techniques saturate quickly — extra compute is wasted. On hard problems, curves spread dramatically — modern reasoning models pull 30+ percentage points ahead of all prompting techniques. **This is the economic foundation of the o1/R1 paradigm**: for hard problems, *thinking longer beats thinking with more parameters*. The widget makes Snell 2024's central insight visible in 30 seconds of interaction."

After 30 seconds of interaction, the reader has internalized: (a) easy problems plateau; (b) hard problems benefit dramatically from compute; (c) modern reasoning models dominate hard problems; (d) test-time compute is a first-class deployment variable.

**This is Ch 20's central visualization.** Build with care.
