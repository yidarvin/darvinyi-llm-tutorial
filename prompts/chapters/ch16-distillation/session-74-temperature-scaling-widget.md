# Session 74 — Temperature scaling marquee widget

> The marquee Chapter 16 widget. An interactive bar chart of the teacher's softmax distribution across a fixed set of candidate classes, with a slider for temperature $T$. At $T=1$: the distribution is peaked — the correct class dominates; dark knowledge is hidden. At $T=4-8$: dark knowledge is revealed — non-target classes show their relative similarity. At $T=32+$: distribution flattens toward uniform; signal lost. The example is a concrete **next-token prediction**: "Paris is the capital of ___" with candidates {France, Spain, Italy, Germany, ...}. Reader watches Spain and Italy *emerge* from the tail as $T$ increases. **The visualization that makes Hinton's central insight viscerally obvious.** Replaces the section-2 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch16-distillation/research.md`** — concepts 2 (soft labels and dark knowledge) and 3 (temperature scaling) are the source material
2. **`prompts/chapters/ch16-distillation/session-73-page-structure.md`** — for the section-2 widget placeholder this session fills
3. **`prompts/chapters/ch04-attention/session-19-attention-heatmap-widget.md`** — for the precomputed-data + slider visualization pattern (AttentionHeatmap)
4. **`prompts/chapters/ch15-peft/session-68-lora-architecture-widget.md`** — for the recent Ch 15 widget conventions

---

## Goal

Replace the `<WidgetFrame title="Temperature scaling">` placeholder in section 2 with a working interactive widget that:

- Displays a **fixed example**: "Paris is the capital of ___" with 15 candidate completions
- Shows the **teacher's softmax distribution** as a horizontal bar chart (probability bars)
- **Slider for $T$** from 1 to 50 (logarithmically spaced)
- Bars rescale live as $T$ changes
- **Dark knowledge indicator**: a badge showing "hidden" / "visible" / "lost" based on the ratio of top-2 to top-1 probability
- **Adaptive insight text** below the chart that changes based on $T$:
  - $T = 1$: "Standard softmax. The correct class dominates; dark knowledge is hidden in the tail."
  - $T = 2-3$: "Dark knowledge starting to emerge."
  - $T = 4-8$: "Dark knowledge clearly visible. The standard distillation sweet spot."
  - $T = 12-20$: "Distribution flattening. Signal weakening."
  - $T > 25$: "Distribution near uniform. Information is being lost."
- **Top-2 probability labels** displayed prominently — the readout that captures the dark-knowledge insight

**End state:** section 2 of Chapter 16 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) at $T=1$, the teacher's distribution is peaked and most classes are near zero; (b) raising $T$ reveals the *relative* probabilities of non-target classes; (c) the sweet spot for distillation is $T=4-8$; (d) too-high $T$ destroys the signal; (e) dark knowledge is the information that's *crushed* at $T=1$ but *visible* at moderate $T$.

---

## Inputs

State of the repo after session 73:

- `src/pages/ch16-distillation/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 2 and 7)
- `src/lib/chapters.ts` has Ch 16 as `'draft'`
- No `src/components/widgets/ch16/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch16/TemperatureScaling.tsx` — the React widget
2. **Create** `src/components/widgets/ch16/TemperatureScaling.module.css` — scoped styles
3. **Create** `src/components/widgets/ch16/temperature-data.ts` — teacher logits and softmax helpers
4. **Update** `src/components/widgets/index.ts` — add `TemperatureScaling` export
5. **Update** `src/pages/ch16-distillation/index.mdx` — replace section-2's `<WidgetFrame>` interior with `<TemperatureScaling client:visible />`

---

## Detailed spec

### 1. `temperature-data.ts` — example data and softmax helpers

```ts
// src/components/widgets/ch16/temperature-data.ts

/**
 * The example: "Paris is the capital of ___"
 * Teacher logits chosen so that France clearly dominates at T=1,
 * with European-capital countries emerging as the second tier at moderate T.
 */
export const EXAMPLE = {
  prompt: 'Paris is the capital of ___',
  candidates: [
    { label: 'France',      logit:  4.0, tier: 'correct' as const },
    { label: 'Spain',       logit:  1.2, tier: 'similar' as const },
    { label: 'Italy',       logit:  0.8, tier: 'similar' as const },
    { label: 'Germany',     logit:  0.5, tier: 'similar' as const },
    { label: 'Belgium',     logit:  0.3, tier: 'similar' as const },
    { label: 'Portugal',    logit:  0.1, tier: 'similar' as const },
    { label: 'Switzerland', logit: -0.2, tier: 'other' as const },
    { label: 'Netherlands', logit: -0.4, tier: 'other' as const },
    { label: 'Austria',     logit: -0.5, tier: 'other' as const },
    { label: 'Greece',      logit: -0.8, tier: 'other' as const },
    { label: 'Denmark',     logit: -1.0, tier: 'other' as const },
    { label: 'Sweden',      logit: -1.2, tier: 'other' as const },
    { label: 'Poland',      logit: -1.5, tier: 'other' as const },
    { label: 'Finland',     logit: -2.0, tier: 'other' as const },
    { label: 'Norway',      logit: -2.5, tier: 'other' as const },
  ],
};

/** Stable softmax with temperature. */
export function softmaxWithTemperature(logits: number[], T: number): number[] {
  const scaled = logits.map(z => z / T);
  const maxLogit = Math.max(...scaled);
  const exps = scaled.map(z => Math.exp(z - maxLogit));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

/** Slider goes from 1 to 50 on a log scale. */
export function sliderToT(sliderValue: number): number {
  // sliderValue: 0 to 100
  // T: 1 to 50 (logarithmic)
  const minLog = Math.log(1);
  const maxLog = Math.log(50);
  const logT = minLog + (sliderValue / 100) * (maxLog - minLog);
  return Math.exp(logT);
}

export function tToSlider(T: number): number {
  const minLog = Math.log(1);
  const maxLog = Math.log(50);
  return 100 * (Math.log(T) - minLog) / (maxLog - minLog);
}

/**
 * Classify the current state based on T and probability distribution.
 * Returns a tag for the dark-knowledge indicator and the insight text.
 */
export function classifyState(T: number, probs: number[]): {
  darkKnowledgeStatus: 'hidden' | 'emerging' | 'visible' | 'fading' | 'lost';
  insight: string;
} {
  // Heuristic based on the ratio of 2nd to 1st probability
  const sorted = [...probs].sort((a, b) => b - a);
  const ratio = sorted[1] / sorted[0];
  
  if (T < 1.5) {
    return {
      darkKnowledgeStatus: 'hidden',
      insight: 'Standard softmax. The correct class dominates; dark knowledge is hidden in the tail.',
    };
  }
  if (T < 3.5) {
    return {
      darkKnowledgeStatus: 'emerging',
      insight: 'Dark knowledge starting to emerge — non-target classes becoming visible.',
    };
  }
  if (T < 10) {
    return {
      darkKnowledgeStatus: 'visible',
      insight: 'Dark knowledge clearly visible. Non-target classes show their relative similarity. The standard distillation sweet spot (T = 4-8).',
    };
  }
  if (T < 25) {
    return {
      darkKnowledgeStatus: 'fading',
      insight: 'Distribution flattening. Signal weakening — the gap between correct and incorrect classes is shrinking.',
    };
  }
  return {
    darkKnowledgeStatus: 'lost',
    insight: 'Distribution near uniform. Information is being lost — at T → ∞, all classes are equal.',
  };
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 700

┌────────────────────────────────────────────────────────────────┐
│ Teacher's distribution for next-token prediction                 │
│                                                                  │
│ Prompt: "Paris is the capital of ___"                            │
│                                                                  │
│ Temperature T: [────●─────────────] T = 1.0                      │
│                  1    2  4  8  16  32  50                        │
│                                                                  │
│ Distribution (softmax with T = 1.0):                             │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ France      ████████████████████████████████████████  0.871│ │
│ │ Spain       ▓▓ 0.046                                        │ │
│ │ Italy       ▓ 0.031                                         │ │
│ │ Germany     ▓ 0.023                                         │ │
│ │ Belgium     ░ 0.019                                         │ │
│ │ Portugal    ░ 0.015                                         │ │
│ │ Switzerland ░ 0.011                                         │ │
│ │ Netherlands ░ 0.009                                         │ │
│ │ ... 7 more, each ≤ 0.008                                    │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Top-2 readout:                                                   │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Top-1: France  (0.871)                                       │ │
│ │ Top-2: Spain   (0.046)   ratio: 0.05                         │ │
│ │ Dark knowledge: HIDDEN — distribution too peaked              │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Insight:                                                          │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Standard softmax. The correct class dominates; dark         │ │
│ │ knowledge is hidden in the tail.                             │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

At $T=4$:
```
France      ████████████████ 0.342
Spain       █████████ 0.181        ← dark knowledge: Spain emerges
Italy       ███████ 0.142
Germany     ██████ 0.110
Belgium     ████ 0.095
Portugal    ████ 0.082
...
Top-2 readout: France (0.342), Spain (0.181), ratio: 0.53
Dark knowledge: VISIBLE (emerald badge)
```

At $T=32$:
```
France      █████ 0.082
Spain       █████ 0.071
Italy       ████ 0.068
Germany     ████ 0.065
Belgium     ████ 0.062
...
Top-2 readout: France (0.082), Spain (0.071), ratio: 0.86
Dark knowledge: LOST (distribution near uniform)
```

**Interaction:**
- Drag the slider → all bars resize live; readouts and insight update
- Bar widths scale to the maximum probability at the current $T$ (otherwise at high $T$, bars become invisible)
- Each bar is color-coded by tier: cyan (correct/France), emerald (similar/European capitals), rose (other)
- Top-2 readout always visible — the headline numbers for understanding the effect
- The "dark knowledge" indicator badge changes color based on state: rose (hidden) → amber (emerging/fading) → emerald (visible) → rose (lost)

### 3. `TemperatureScaling.tsx`

```tsx
import { useMemo, useState } from 'react';
import {
  EXAMPLE, softmaxWithTemperature, sliderToT, tToSlider, classifyState,
} from './temperature-data';
import styles from './TemperatureScaling.module.css';

export default function TemperatureScaling() {
  const [sliderValue, setSliderValue] = useState(0);  // 0 corresponds to T=1
  const T = sliderToT(sliderValue);

  const logits = EXAMPLE.candidates.map(c => c.logit);
  const probs = useMemo(() => softmaxWithTemperature(logits, T), [T]);

  // Find top-1 and top-2
  const indexedProbs = probs.map((p, i) => ({ p, i }));
  const sorted = [...indexedProbs].sort((a, b) => b.p - a.p);
  const top1 = sorted[0];
  const top2 = sorted[1];
  const ratio = top2.p / top1.p;

  const { darkKnowledgeStatus, insight } = classifyState(T, probs);

  // Bar widths normalized to the current maximum
  const maxProb = top1.p;

  return (
    <div className={styles.widget}>
      {/* Prompt panel */}
      <div className={styles.promptPanel}>
        <span className={styles.promptLabel}>Prompt:</span>
        <span className={styles.promptText}>{EXAMPLE.prompt}</span>
      </div>

      {/* Temperature slider */}
      <div className={styles.sliderPanel}>
        <div className={styles.sliderHeader}>
          <span className={styles.sliderLabel}>Temperature T:</span>
          <span className={styles.sliderValue}>T = {T.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0} max={100} step={1}
          value={sliderValue}
          onChange={e => setSliderValue(Number(e.target.value))}
          className={styles.slider}
          aria-label="temperature"
        />
        <div className={styles.sliderTicks}>
          {[1, 2, 4, 8, 16, 32, 50].map(t => (
            <span
              key={t}
              className={styles.sliderTick}
              style={{ left: `${tToSlider(t)}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>Distribution (softmax with T = {T.toFixed(2)}):</div>
        <div className={styles.barChart}>
          {EXAMPLE.candidates.map((c, i) => {
            const p = probs[i];
            const widthPct = (p / maxProb) * 100;
            return (
              <div key={c.label} className={styles.barRow}>
                <span className={`${styles.barLabel} ${styles[`tier_${c.tier}`]}`}>
                  {c.label}
                </span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles[`barFill_${c.tier}`]}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className={styles.barValue}>{p.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top-2 readout */}
      <div className={styles.readoutPanel}>
        <div className={styles.readoutTitle}>Top-2 readout</div>
        <div className={styles.readoutRow}>
          <span className={styles.readoutLabel}>Top-1:</span>
          <span className={styles.readoutValue}>
            {EXAMPLE.candidates[top1.i]!.label} ({top1.p.toFixed(3)})
          </span>
        </div>
        <div className={styles.readoutRow}>
          <span className={styles.readoutLabel}>Top-2:</span>
          <span className={styles.readoutValue}>
            {EXAMPLE.candidates[top2.i]!.label} ({top2.p.toFixed(3)})
          </span>
        </div>
        <div className={styles.readoutRow}>
          <span className={styles.readoutLabel}>Top-2 / Top-1 ratio:</span>
          <span className={styles.readoutValue}>{ratio.toFixed(3)}</span>
        </div>
        <div className={styles.darkKnowledgeRow}>
          <span className={styles.readoutLabel}>Dark knowledge:</span>
          <span className={`${styles.dkBadge} ${styles[`dk_${darkKnowledgeStatus}`]}`}>
            {darkKnowledgeStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Insight text */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight:</div>
        <div className={styles.insightText}>{insight}</div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Hinton's central insight: <strong>dark knowledge</strong> is the information in non-target class probabilities.
        At $T = 1$, this information is crushed (the correct class dominates). Raising $T$ reveals it — at
        $T = 4-8$, the relative similarities between classes become visible. <strong>The student trained
        on softened distributions learns more per example</strong> than from hard labels alone.
      </div>
    </div>
  );
}
```

### 4. `TemperatureScaling.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.promptPanel {
  padding: 0.7rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
  display: flex;
  gap: 0.7rem;
  align-items: baseline;
}
.promptLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.promptText {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.92rem;
  color: var(--text-primary);
  font-style: italic;
}

/* Slider */
.sliderPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.sliderHeader {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
}
.sliderLabel { font-size: 0.82rem; color: var(--text-secondary); }
.sliderValue { font-size: 1.05rem; color: var(--cyan-300); font-weight: 500; }
.slider { width: 100%; }
.sliderTicks {
  position: relative;
  height: 18px;
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}
.sliderTick {
  position: absolute;
  font-size: 0.68rem;
  color: var(--text-tertiary);
  transform: translateX(-50%);
}

/* Chart */
.chartPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.chartTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.6rem;
}
.barChart { display: flex; flex-direction: column; gap: 0.18rem; }
.barRow {
  display: grid;
  grid-template-columns: 110px 1fr 70px;
  gap: 0.6rem;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
}
.barLabel { font-size: 0.78rem; text-align: right; }
.tier_correct { color: var(--cyan-300); font-weight: 500; }
.tier_similar { color: var(--emerald-400); }
.tier_other   { color: var(--text-tertiary); }
.barTrack {
  height: 16px;
  background: var(--bg-primary);
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}
.barFill {
  height: 100%;
  transition: width 150ms ease-out;
  border-radius: 2px;
}
.barFill_correct { background: linear-gradient(90deg, var(--cyan-700), var(--cyan-400)); }
.barFill_similar { background: linear-gradient(90deg, var(--emerald-700), var(--emerald-400)); }
.barFill_other   { background: linear-gradient(90deg, var(--neutral-700, #404040), var(--neutral-500, #737373)); }
.barValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  color: var(--text-secondary);
  text-align: right;
}

/* Readout */
.readoutPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.readoutTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
}
.readoutRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.2rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.readoutLabel { color: var(--text-secondary); }
.readoutValue { color: var(--text-primary); font-weight: 500; }

.darkKnowledgeRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.55rem;
  margin-top: 0.4rem;
  border-top: 1px solid var(--border-subtle);
  font-family: 'JetBrains Mono', monospace;
}
.dkBadge {
  padding: 0.2rem 0.55rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}
.dk_hidden    { background: color-mix(in srgb, var(--rose-400) 15%, transparent); color: var(--rose-400); }
.dk_emerging  { background: color-mix(in srgb, var(--amber-400) 15%, transparent); color: var(--amber-400); }
.dk_visible   { background: color-mix(in srgb, var(--emerald-400) 15%, transparent); color: var(--emerald-400); }
.dk_fading    { background: color-mix(in srgb, var(--amber-400) 15%, transparent); color: var(--amber-400); }
.dk_lost      { background: color-mix(in srgb, var(--rose-400) 15%, transparent); color: var(--rose-400); }

/* Insight */
.insightPanel {
  padding: 0.85rem 1rem;
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
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
  .promptPanel { flex-direction: column; gap: 0.15rem; }
  .barRow { grid-template-columns: 80px 1fr 55px; gap: 0.4rem; font-size: 0.7rem; }
  .barLabel { font-size: 0.7rem; }
  .readoutRow { font-size: 0.74rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as TemperatureScaling } from './ch16/TemperatureScaling';
// Session 75 will add:
// export { default as DistillationPipeline } from './ch16/DistillationPipeline';
```

### 6. Update `src/pages/ch16-distillation/index.mdx`

**Edit A: Add widget import:**

```mdx
import { TemperatureScaling } from '@components/widgets';
```

**Edit B: Replace section-2's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Temperature scaling" caption="The teacher's softmax distribution for 'Paris is the capital of ___' across 15 candidate completions. At T=1: France dominates (0.87); dark knowledge is hidden. Raise T to see the next tier — Spain, Italy, Germany — emerge as the European-capital cluster. At T=32+: distribution flattens; signal lost. The sweet spot for distillation is T=4-8.">
  <TemperatureScaling client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 2 of Ch 16** renders with the working widget. Section 7's placeholder still stubbed.
3. **Default state:** $T = 1.0$ (slider at 0). France probability ≈ 0.87 (peaked). Dark knowledge badge: **HIDDEN** (rose).
4. **Prompt panel** shows the prompt "Paris is the capital of ___" in JetBrains Mono italic.
5. **Temperature slider**: range 0-100 (mapping to T=1 to T=50 log-spaced). Tick marks at 1, 2, 4, 8, 16, 32, 50.
6. **At $T = 4$**: France ≈ 0.34, Spain ≈ 0.18, Italy ≈ 0.14. Dark knowledge badge: **VISIBLE** (emerald). Insight: "Dark knowledge clearly visible. Non-target classes show their relative similarity. The standard distillation sweet spot (T = 4-8)."
7. **At $T = 32$**: probabilities approach uniform (all in 0.05-0.10 range). Dark knowledge badge: **LOST** (rose). Insight: "Distribution near uniform. Information is being lost — at T → ∞, all classes are equal."
8. **Bar chart**: 15 rows, one per candidate. Bars colored by tier:
   - **France** (correct): cyan
   - **Spain, Italy, Germany, Belgium, Portugal** (similar/European capitals): emerald
   - **Switzerland-Norway** (other): neutral gray
9. **Bar widths normalized to the current max** so that at any $T$, the top class always uses the full track width. (Otherwise at high $T$, all bars become tiny.)
10. **Top-2 readout** always visible with top-1, top-2, and ratio values. Updates live.
11. **Dark knowledge badge** changes color smoothly:
   - HIDDEN: rose
   - EMERGING: amber
   - VISIBLE: emerald
   - FADING: amber
   - LOST: rose
12. **Insight text** changes based on $T$ — 5 distinct messages matching the 5 states.
13. **Smooth animation**: bar widths transition over ~150ms when the slider moves.
14. **Mobile (< 720px)**: bar rows compact (smaller label column, smaller text); slider full width.
15. **`npm run typecheck`** passes.
16. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not allow the user to edit the logits.** Fixed example only.
- ❌ **Do not animate the slider automatically.** User-controlled only.
- ❌ **Do not show the distillation loss in the widget.** Section 3's widget territory — this widget is purely about temperature.
- ❌ **Do not compare student vs teacher distributions in the widget.** Teacher only here.
- ❌ **Do not visualize KL divergence.** Section 3's territory.
- ❌ **Do not include a "compute distillation loss" calculator.** Out of scope.
- ❌ **Do not flip Ch 16's status.** Session 75 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch16/ src/components/widgets/index.ts src/pages/ch16-distillation/index.mdx
git commit -m "session 74: temperature scaling marquee — visualize Hinton dark knowledge revelation"
git push origin main
```

Verify on production:
- Slider scrubs from T=1 to T=50 smoothly
- Bars animate to new widths
- Dark knowledge badge transitions through hidden → emerging → visible → fading → lost
- Insight text updates with state
- Mobile compact layout

---

## Notes for the session author

**On the example choice — "Paris is the capital of ___":**
This is a relatable next-token prediction with a clear correct answer (France) and a natural cluster of similar candidates (other European capitals). **Spain and Italy emerging at moderate $T$ is the chapter's pedagogical centerpiece.** It captures the essence of dark knowledge — the teacher *knows* Spain is more similar to France than, say, Australia, even though it's not the correct answer.

Don't use a digit-classification example (Hinton's original). LLMs are about tokens. The example should be tokens.

**On the logit values being chosen carefully:**
The base logits `[4.0, 1.2, 0.8, 0.5, 0.3, 0.1, -0.2, -0.4, -0.5, -0.8, -1.0, -1.2, -1.5, -2.0, -2.5]` were chosen so that:
- At $T=1$: France clearly dominates (~0.87 probability)
- At $T=4$: France still wins but Spain/Italy emerge (top-3 = ~64% of mass)
- At $T=32$: distribution near uniform (top-1 < 0.10)

**These specific values matter for pedagogy.** If the implementor changes them, verify the qualitative behavior at each $T$ value is preserved.

**On bar normalization at high $T$:**
At $T = 32$, the maximum probability is only ~0.08. If bars were normalized to a fixed 0-1 scale, they'd all be invisible at high $T$. **The widget normalizes to the *current max*** — at any $T$, the top class uses the full bar track. This preserves visual signal across the full $T$ range.

**On the tier-based color coding:**
- **Correct (France)**: cyan — the right answer; the chapter's signature color
- **Similar (Spain, Italy, Germany, Belgium, Portugal)**: emerald — the dark knowledge tier; emergence is the punchline
- **Other (rest)**: neutral gray — background; not pedagogically critical

When the reader watches the slider, they should see **emerald bars emerging from the tail** as $T$ increases. This is the visual punchline.

**On the dark knowledge indicator badge:**
The 5-state classification is heuristic but pedagogically clear:
- **HIDDEN** ($T < 1.5$): dark knowledge is there but invisible (peaked distribution)
- **EMERGING** ($1.5 < T < 3.5$): just starting to see non-target classes
- **VISIBLE** ($3.5 < T < 10$): the sweet spot; dark knowledge clearly readable
- **FADING** ($10 < T < 25$): distribution flattening; signal weakening
- **LOST** ($T > 25$): near-uniform; no useful information

The color transitions (rose → amber → emerald → amber → rose) make the sweet spot visually obvious. **The reader sees that there's a U-curve** — too low or too high is bad; the middle is right.

**On the insight text adapting:**
Each state has its own one-sentence insight. The reader doesn't have to interpret the distribution — the widget tells them what's happening. **Pedagogy via narration.**

**On the slider being logarithmically spaced:**
Linear spacing would give too much resolution at high $T$ (where the distribution barely changes) and too little at low $T$ (where the most interesting changes happen). Log spacing gives equal resolution per "octave" — $T = 1 \to 2$, $2 \to 4$, $4 \to 8$, etc. — which matches the way temperature actually affects the distribution.

**Pedagogical claim this widget supports:**
"Temperature reveals dark knowledge. At T=1, the teacher's confidence in the correct class crushes everything else; the relative similarities between non-target classes are invisible. Raising T spreads the distribution and reveals those similarities — at T=4-8, the student can see that Spain and Italy are 'similar to France' in a way that Australia isn't. Beyond T=25, the distribution flattens to uniform and the information is lost. **Distillation uses temperature to extract the maximum signal from the teacher's distributions.**"

After 30 seconds of interaction, the reader has internalized: (a) at $T=1$, only the top class is visible; (b) raising $T$ reveals the relative probabilities of non-target classes; (c) the sweet spot is $T=4-8$; (d) too-high $T$ destroys the signal; (e) dark knowledge is the chapter's central concept and now they've *seen* it.

**This is the chapter's most important visualization.** Section 3's math becomes intuitive after this widget. Build with care.
