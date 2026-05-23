# Session 56 — Selective scan widget + Ch 12 exercises + Phase 10 closeout

> **The Phase 10 grand finale.** Three deliverables in one session: the **Selective Scan** animation widget (16-token sequence with hand-tuned $\Delta_t$ values; state heatmap evolves through time showing selective forgetting/remembering), an **Exercises section** with 4 problems (discrete SSM recurrence, recurrence-convolution duality, selective SSM, parallel scan via associative operations), and the **status flip** from `'draft'` to `'published'`. **Closes Ch 12. Closes Phase 10.** After this session, the entire architectural exploration of the tutorial — dense transformers (Ch 1-6), MoE (Ch 11), SSMs (Ch 12) — is on production.

---

## Read first (in this order)

1. **`research/ch12-ssm-and-mamba/research.md`** — pedagogical outcomes 1-5 are the exercises' focus; the reference implementations section has working code that adapts directly
2. **`prompts/chapters/ch12-ssm-and-mamba/session-54-page-structure.md`** — for the section-5 widget placeholder
3. **`prompts/chapters/ch12-ssm-and-mamba/session-55-ssm-vs-attention-widget.md`** — for the Ch 12 widget conventions established by the marquee
4. **`prompts/chapters/ch11-moe/session-52-active-vs-total-exercises-and-closeout.md`** — for the closeout template (Ch 11 established the secondary-widget + exercises + status-flip pattern)

---

## Goal

By end of session, three things change in the repo:

1. **`<SelectiveScanAnimation />`** widget replaces the section-5 `<WidgetFrame>` placeholder. The widget shows a 16-token sequence with input-dependent $\Delta_t$ values driving a state heatmap. Play/pause controls let the reader scrub through time and see state components light up on "important" tokens and fade on "filler" tokens. Slow-decay components retain information longer; fast-decay components forget quickly — visible in the heatmap as differing fade rates per row.
2. **An "Exercises" section** is appended to `index.mdx`, between section 8 ("Trade-offs — where SSMs win and lose") and the final chapter close paragraph. Four exercises with hints + runnable starter code.
3. **Ch 12's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. Ch 12 is the twelfth published chapter.

After this session: **Ch 12 is complete. Phase 10 is complete.** The architectural exploration arc closes — Phase 11 (post-training) begins next.

---

## Inputs

State of the repo after session 55:

- Section 1's `SSMvsAttentionScaling` marquee widget is wired
- Section 5's widget is still stubbed
- All 3 runnable code blocks from session 54 are in place
- `src/lib/chapters.ts` has Ch 1-11 `'published'`, Ch 12 `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch12/SelectiveScanAnimation.tsx` — the React widget
2. **Create** `src/components/widgets/ch12/SelectiveScanAnimation.module.css` — scoped styles
3. **Create** `src/components/widgets/ch12/selective-scan-data.ts` — hand-tuned tokens + state evolution math
4. **Update** `src/components/widgets/index.ts` — add `SelectiveScanAnimation` export
5. **Update** `src/pages/ch12-ssm-and-mamba/index.mdx`:
   - Replace section-5's `<WidgetFrame>` interior with `<SelectiveScanAnimation client:visible />`
   - Add new `## Exercises` section between section 8 and the final chapter close paragraph
6. **Update** `src/lib/chapters.ts` — change Ch 12's `status` from `'draft'` to `'published'`

---

## Detailed spec

### Part A — Selective Scan Animation widget

#### A1. `selective-scan-data.ts` — hand-tuned tokens + state evolution

```ts
// src/components/widgets/ch12/selective-scan-data.ts

export interface Token {
  index: number;
  text: string;
  importance: 'important' | 'filler';
  /** Hand-tuned delta_t value — larger for important tokens. */
  deltaT: number;
  /** Hand-tuned input value driving the SSM. */
  inputValue: number;
}

/**
 * Hand-tuned 16-token sequence demonstrating selective state updates.
 * 
 * Important tokens (large delta_t ~0.8): "capital", "France", "Paris", "weather", "rainy", "winter"
 * Filler tokens (small delta_t ~0.05):    "The", "of", "is", ".", "and", "the", "there", "is", "often", "in"
 */
export const TOKENS: Token[] = [
  { index: 0,  text: 'The',     importance: 'filler',    deltaT: 0.05, inputValue: 0.2 },
  { index: 1,  text: 'capital', importance: 'important', deltaT: 0.85, inputValue: 1.0 },
  { index: 2,  text: 'of',      importance: 'filler',    deltaT: 0.05, inputValue: 0.1 },
  { index: 3,  text: 'France',  importance: 'important', deltaT: 0.90, inputValue: 1.2 },
  { index: 4,  text: 'is',      importance: 'filler',    deltaT: 0.05, inputValue: 0.15 },
  { index: 5,  text: 'Paris',   importance: 'important', deltaT: 0.88, inputValue: 1.1 },
  { index: 6,  text: '.',       importance: 'filler',    deltaT: 0.03, inputValue: 0.05 },
  { index: 7,  text: 'and',     importance: 'filler',    deltaT: 0.06, inputValue: 0.15 },
  { index: 8,  text: 'the',     importance: 'filler',    deltaT: 0.05, inputValue: 0.1 },
  { index: 9,  text: 'weather', importance: 'important', deltaT: 0.82, inputValue: 0.9 },
  { index: 10, text: 'there',   importance: 'filler',    deltaT: 0.07, inputValue: 0.2 },
  { index: 11, text: 'is',      importance: 'filler',    deltaT: 0.05, inputValue: 0.15 },
  { index: 12, text: 'often',   importance: 'filler',    deltaT: 0.10, inputValue: 0.3 },
  { index: 13, text: 'rainy',   importance: 'important', deltaT: 0.80, inputValue: 0.95 },
  { index: 14, text: 'in',      importance: 'filler',    deltaT: 0.05, inputValue: 0.1 },
  { index: 15, text: 'winter',  importance: 'important', deltaT: 0.78, inputValue: 0.9 },
];

/**
 * 8 state components with different decay rates.
 * Fast-decay components forget quickly; slow-decay components retain longer.
 */
export const STATE_DIM = 8;

/** Eigenvalues (a_i) for each state component. Negative for stability; smaller |a| = slower decay. */
export const STATE_EIGENVALUES = [-3.0, -2.5, -1.5, -1.0, -0.7, -0.4, -0.2, -0.1];

/** Decay-rate labels for the rows. */
export const STATE_LABELS = [
  'h₀ (fast)',
  'h₁ (fast)',
  'h₂ (medium)',
  'h₃ (medium)',
  'h₄ (medium)',
  'h₅ (slow)',
  'h₆ (slow)',
  'h₇ (slowest)',
];

/** Per-component input weight (B vector). All 1.0 for simplicity — inputs drive all components equally. */
const B_VEC = new Array(STATE_DIM).fill(1.0);

/**
 * Simulate the selective SSM forward pass across the full sequence.
 * Returns the state at each time step, plus the delta_t values used.
 */
export function simulateStateEvolution(): {
  states: number[][];   // (T, STATE_DIM)
  deltas: number[];     // (T,)
  inputs: number[];     // (T,)
} {
  const T = TOKENS.length;
  const states: number[][] = [];
  const deltas: number[] = [];
  const inputs: number[] = [];

  let h = new Array(STATE_DIM).fill(0);

  for (let t = 0; t < T; t++) {
    const tok = TOKENS[t]!;
    const dt = tok.deltaT;
    const x = tok.inputValue;

    // Discretize: A_bar_i = exp(dt * a_i)
    // Recurrence: h_i = A_bar_i * h_i + dt * B_i * x
    const newH = new Array(STATE_DIM);
    for (let i = 0; i < STATE_DIM; i++) {
      const aBar = Math.exp(dt * STATE_EIGENVALUES[i]!);
      newH[i] = aBar * h[i]! + dt * B_VEC[i]! * x;
    }
    h = newH;

    states.push([...h]);
    deltas.push(dt);
    inputs.push(x);
  }

  return { states, deltas, inputs };
}

/** Get the maximum state magnitude across all time steps and components (for normalization). */
export function getMaxStateMagnitude(states: number[][]): number {
  let max = 0;
  for (const row of states) {
    for (const v of row) {
      if (Math.abs(v) > max) max = Math.abs(v);
    }
  }
  return max;
}
```

#### A2. Visual layout

```
ViewBox: 0 0 800 600

┌──────────────────────────────────────────────────────────────────┐
│  Selective scan: state evolving through the sequence              │
│                                                                    │
│  Tokens:  The capital of France is Paris . and the weather there is often rainy in winter │
│           ░░  ████  ░░  ████  ░░  ████  ░░ ░░ ░░ ████  ░░ ░░ ░░ ████ ░░ ████              │
│  Δ_t:    0.05 0.85 0.05 0.90 0.05 0.88 .03 .06 .05 0.82 .07 .05 .10 0.80 .05 0.78      │
│                                                                    │
│  State heatmap (rows = state components, columns = time):         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ h₀ (fast)    ░ ▓ ░ ▓ ░ ▓ ░ ░ ░ ▓ ░ ░ ░ ▓ ░ ▓                │  │
│  │ h₁ (fast)    ░ ▓ ░ ▓ ░ ▓ ░ ░ ░ ▓ ░ ░ ░ ▓ ░ ▓                │  │
│  │ h₂ (medium)  ░ █ ░ █ ░ █ ░ ░ ░ █ ░ ░ ░ █ ░ █                │  │
│  │ h₃ (medium)  ░ █ ░ █ ░ █ ░ ░ ░ █ ░ ░ ░ █ ░ █                │  │
│  │ h₄ (medium)  ░ █ ▓ █ ▓ █ ▓ ░ ░ █ ▓ ░ ░ █ ▓ █                │  │
│  │ h₅ (slow)    ░ █ █ █ █ █ ▓ ▓ ▓ █ █ ▓ ▓ █ █ █                │  │
│  │ h₆ (slow)    ░ █ █ █ █ █ █ █ ▓ █ █ █ █ █ █ █                │  │
│  │ h₇ (slowest) ░ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █                │  │
│  └────────────────────────────────────────────────────────────┘  │
│  Brightness = magnitude of state component at that time.         │
│                                                                    │
│  Controls:                                                         │
│  [⏸ Play/Pause]  Time step: [────●────] 5 / 16                    │
│                                                                    │
│  Current step: t = 5 (token "Paris", important)                   │
│  Δ_5 = 0.88 → state updates strongly. Slow components retain      │
│  this update for many future steps; fast components fade by t=7.  │
└──────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Play/Pause button cycles through time steps automatically (every ~1 second)
- Time-step slider lets the reader scrub manually
- Cells past the current time are dimmed (showing the future is not yet computed)
- Current column has a vertical highlight
- Token row, $\Delta_t$ bars, and state heatmap are all aligned vertically
- Hovering any cell shows the precise state value at that (component, time)

#### A3. `SelectiveScanAnimation.tsx`

```tsx
import { useEffect, useMemo, useState } from 'react';
import {
  TOKENS, STATE_DIM, STATE_LABELS,
  simulateStateEvolution, getMaxStateMagnitude,
} from './selective-scan-data';
import styles from './SelectiveScanAnimation.module.css';

export default function SelectiveScanAnimation() {
  const T = TOKENS.length;
  const { states, deltas, inputs } = useMemo(() => simulateStateEvolution(), []);
  const maxMagnitude = useMemo(() => getMaxStateMagnitude(states), [states]);

  const [currentT, setCurrentT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying) return;
    const id = setTimeout(() => {
      setCurrentT(t => {
        if (t >= T - 1) {
          setIsPlaying(false);
          return T - 1;
        }
        return t + 1;
      });
    }, 800);
    return () => clearTimeout(id);
  }, [isPlaying, currentT, T]);

  function handlePlayPause() {
    if (currentT >= T - 1) {
      setCurrentT(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }

  const currentToken = TOKENS[currentT]!;
  const currentDelta = deltas[currentT]!;

  return (
    <div className={styles.widget}>
      {/* Main diagram */}
      <div className={styles.diagramPanel}>
        <ScanSvg
          states={states}
          deltas={deltas}
          maxMagnitude={maxMagnitude}
          currentT={currentT}
        />
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={styles.playButton}
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸ Pause' : currentT >= T - 1 ? '↻ Replay' : '▶ Play'}
        </button>
        <div className={styles.sliderGroup}>
          <label className={styles.sliderLabel}>
            Time step: <span className={styles.sliderValue}>{currentT + 1} / {T}</span>
          </label>
          <input
            type="range"
            min={0} max={T - 1} step={1}
            value={currentT}
            onChange={e => { setCurrentT(Number(e.target.value)); setIsPlaying(false); }}
            className={styles.slider}
          />
        </div>
      </div>

      {/* Selected step details */}
      <div className={styles.detailsPanel}>
        <div className={styles.detailsRow}>
          <span className={styles.detailsLabel}>Current step:</span>
          <span className={styles.detailsValue}>
            t = {currentT}, token "<strong>{currentToken.text}</strong>" ({currentToken.importance})
          </span>
        </div>
        <div className={styles.detailsRow}>
          <span className={styles.detailsLabel}>Δ_t:</span>
          <span className={styles.detailsValue}>
            <strong>{currentDelta.toFixed(2)}</strong>
            {currentToken.importance === 'important'
              ? ' → state updates STRONGLY on this important token'
              : ' → state barely changes on this filler token'}
          </span>
        </div>
        <div className={styles.detailsRow}>
          <span className={styles.detailsLabel}>State values:</span>
          <span className={styles.detailsValueSmall}>
            {states[currentT]!.map((v, i) => `${STATE_LABELS[i]!.split(' ')[0]}=${v.toFixed(2)}`).join(', ')}
          </span>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Watch how state components light up on important tokens (large Δ_t) and fade on filler tokens
        (small Δ_t). <strong>Fast-decay components</strong> (h₀, h₁) capture only the most recent
        update; they're effectively short-term memory. <strong>Slow-decay components</strong>
        (h₆, h₇) retain information across many tokens; they're long-term memory.
        This is Mamba's selectivity in action: the model dynamically allocates state updates to
        important content while letting filler pass through.
      </div>
    </div>
  );
}

interface ScanSvgProps {
  states: number[][];
  deltas: number[];
  maxMagnitude: number;
  currentT: number;
}

function ScanSvg({ states, deltas, maxMagnitude, currentT }: ScanSvgProps) {
  const T = TOKENS.length;
  const WIDTH = 760;
  const HEIGHT = 410;
  const LEFT_LABELS = 130;
  const TOP_TOKENS = 24;
  const TOP_DELTAS = 56;
  const TOP_HEATMAP = 100;
  const CELL_W = (WIDTH - LEFT_LABELS - 20) / T;
  const CELL_H = (HEIGHT - TOP_HEATMAP - 20) / STATE_DIM;

  function cellX(t: number): number {
    return LEFT_LABELS + t * CELL_W;
  }
  function cellY(i: number): number {
    return TOP_HEATMAP + i * CELL_H;
  }

  function magnitudeToColor(v: number): string {
    const norm = Math.min(1.0, Math.abs(v) / maxMagnitude);
    return `color-mix(in srgb, var(--cyan-500) ${norm * 90}%, transparent)`;
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label="State evolution heatmap">
      {/* Token labels at top */}
      {TOKENS.map((tok, t) => (
        <text
          key={`tok-${t}`}
          x={cellX(t) + CELL_W / 2}
          y={TOP_TOKENS - 4}
          className={`${styles.tokenLabel} ${tok.importance === 'important' ? styles.tokenLabelImportant : styles.tokenLabelFiller}`}
          textAnchor="middle"
          fontSize="9"
          transform={`rotate(-30 ${cellX(t) + CELL_W / 2} ${TOP_TOKENS - 4})`}
        >
          {tok.text}
        </text>
      ))}

      {/* Delta bars */}
      {deltas.map((dt, t) => {
        const barH = dt * 30;
        return (
          <g key={`delta-${t}`}>
            <rect
              x={cellX(t) + 3}
              y={TOP_DELTAS - barH + 30}
              width={CELL_W - 6}
              height={barH}
              fill={dt > 0.3 ? 'var(--cyan-400)' : 'var(--text-tertiary)'}
              opacity={t <= currentT ? 0.8 : 0.2}
            />
          </g>
        );
      })}
      {/* Delta axis label */}
      <text x={LEFT_LABELS - 6} y={TOP_DELTAS + 22} className={styles.axisLabel} textAnchor="end" fontSize="10">Δ_t</text>

      {/* Heatmap cells */}
      {states.map((row, t) =>
        row.map((v, i) => {
          const dimmed = t > currentT;
          return (
            <rect
              key={`cell-${t}-${i}`}
              x={cellX(t) + 0.5}
              y={cellY(i) + 0.5}
              width={CELL_W - 1}
              height={CELL_H - 1}
              fill={dimmed ? 'var(--bg-primary)' : magnitudeToColor(v)}
              stroke="var(--bg-primary)"
              strokeWidth={1}
              opacity={dimmed ? 0.25 : 1}
            />
          );
        })
      )}

      {/* Row labels (state component names) */}
      {STATE_LABELS.map((label, i) => (
        <text
          key={`row-${i}`}
          x={LEFT_LABELS - 6}
          y={cellY(i) + CELL_H / 2 + 4}
          className={styles.rowLabel}
          textAnchor="end"
          fontSize="10"
        >
          {label}
        </text>
      ))}

      {/* Current time highlight (vertical line) */}
      <line
        x1={cellX(currentT) + CELL_W / 2}
        x2={cellX(currentT) + CELL_W / 2}
        y1={TOP_DELTAS - 6}
        y2={cellY(STATE_DIM - 1) + CELL_H + 4}
        className={styles.currentLine}
      />
    </svg>
  );
}
```

#### A4. `SelectiveScanAnimation.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.diagramPanel {
  padding: 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.svg { width: 100%; height: auto; }

.tokenLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
.tokenLabelImportant { fill: var(--cyan-300); font-weight: 500; }
.tokenLabelFiller { fill: var(--text-tertiary); }

.rowLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
.axisLabel { fill: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; }

.currentLine { stroke: var(--amber-400); stroke-width: 1.5; stroke-dasharray: 4 3; opacity: 0.8; }

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.playButton {
  padding: 0.4rem 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  background: var(--cyan-500);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
}
.playButton:hover { background: var(--cyan-400); }

.sliderGroup { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; min-width: 200px; }
.sliderLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
}
.sliderValue { color: var(--cyan-300); font-weight: 500; }
.slider { width: 100%; }

.detailsPanel {
  padding: 0.85rem 1rem;
  background: color-mix(in srgb, var(--cyan-500) 6%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.detailsRow {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.35rem;
  flex-wrap: wrap;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.detailsLabel {
  color: var(--text-tertiary);
  min-width: 110px;
}
.detailsValue { color: var(--text-primary); }
.detailsValue strong { color: var(--cyan-300); }
.detailsValueSmall { font-size: 0.7rem; color: var(--text-secondary); }

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

@media (max-width: 640px) {
  .controls { flex-direction: column; align-items: stretch; }
  .detailsRow { flex-direction: column; gap: 0.15rem; }
}
```

#### A5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as SSMvsAttentionScaling } from './ch12/SSMvsAttentionScaling';
export { default as SelectiveScanAnimation } from './ch12/SelectiveScanAnimation';
```

#### A6. Update section-5's WidgetFrame in `index.mdx`

```mdx
import { SSMvsAttentionScaling, SelectiveScanAnimation } from '@components/widgets';
```

```mdx
<WidgetFrame title="Selective scan visualization" caption="A 16-token sequence with hand-tuned Δ_t per token. Important tokens (\"capital\", \"France\", \"Paris\", \"weather\", \"rainy\", \"winter\") have large Δ_t; filler tokens (\"The\", \"of\", \"is\", etc.) have small Δ_t. The state heatmap shows 8 components evolving over time. Slow-decay components retain information across many tokens; fast-decay components forget quickly. Press play to scrub through the sequence and see selectivity in action.">
  <SelectiveScanAnimation client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 8 ("Trade-offs — where SSMs win and lose") and the final chapter close paragraph:

````mdx
## Exercises

Four exercises that build on the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Discrete SSM recurrence with diagonal A

Implement the discrete SSM recurrence with diagonal $A$ and verify it produces a decaying impulse response. Slower eigenvalues should produce longer memory.

<details>
<summary>Hint</summary>

The discrete recurrence is $h_t = \bar{A} h_{t-1} + \bar{B} x_t$ where $\bar{A}_{ii} = \exp(\Delta a_i)$ for diagonal $A$ with diagonal entries $a_i$. For an impulse input ($x_0 = 1$, $x_t = 0$ for $t > 0$), the state at time $t$ decays as $h_{t,i} = \exp(\Delta t a_i)$ — exponential decay with rate $\Delta |a_i|$.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def discrete_ssm(x, A_diag, B, C, delta):
    """
    Discrete SSM with diagonal A.
    
    x:        (T,) — input sequence
    A_diag:   (N,) — eigenvalues of A (typically negative for stability)
    B, C:     (N,) — input and output projections
    delta:    float — discretization step
    
    Returns y of shape (T,)
    """
    # TODO: discretize A and B
    # A_bar = np.exp(delta * A_diag)   # element-wise for diagonal A
    # B_bar = delta * B                  # Euler approximation
    
    # TODO: run the recurrence
    # h = np.zeros(len(A_diag))
    # y = np.zeros(len(x))
    # for t in range(len(x)):
    #     h = A_bar * h + B_bar * x[t]
    #     y[t] = C @ h
    # return y
    pass

# Verify impulse response decay rates
A_diag = np.array([-3.0, -1.0, -0.3, -0.1])   # 4 eigenvalues, slowest = -0.1
B = np.array([1.0, 1.0, 1.0, 1.0])
C = np.array([1.0, 0.0, 0.0, 0.0])             # observe only first component
delta = 0.1

# Impulse input
T = 50
x = np.zeros(T); x[0] = 1.0

# y = discrete_ssm(x, A_diag, B, C, delta)
# print(f"With C reading component 0 (fastest decay):")
# print(f"  y[0]={y[0]:.3f}, y[5]={y[5]:.3f}, y[20]={y[20]:.6f}")

# Now read out slowest component
# C_slow = np.array([0.0, 0.0, 0.0, 1.0])
# y_slow = discrete_ssm(x, A_diag, B, C_slow, delta)
# print(f"\\nWith C reading component 3 (slowest decay):")
# print(f"  y[0]={y_slow[0]:.3f}, y[5]={y_slow[5]:.3f}, y[20]={y_slow[20]:.4f}")
# print(f"\\nSlower eigenvalues → longer memory. The state retains the impulse much longer.")
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Recurrence-convolution duality

Compute the same SSM output two ways: via recurrence and via convolution. Verify they match.

<details>
<summary>Hint</summary>

Both methods compute the same function. The recurrence runs in $O(N \cdot \text{state\_dim})$ per token (sequential). The convolution computes the kernel $\bar{K}_j = C \bar{A}^j \bar{B}$ once, then convolves: $y_t = \sum_{i} \bar{K}_{t-i} x_i$. The kernel can be FFT-accelerated for $O(N \log N)$ overall on long sequences. The two outputs should match to numerical precision.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def ssm_recurrence(x, A_diag, B, C, delta):
    T = len(x)
    A_bar = np.exp(delta * A_diag)
    B_bar = delta * B
    h = np.zeros(len(A_diag))
    y = np.zeros(T)
    for t in range(T):
        h = A_bar * h + B_bar * x[t]
        y[t] = C @ h
    return y

def compute_kernel(A_diag, B, C, delta, length):
    """Compute K[j] = C @ A_bar^j @ B_bar for j = 0..length-1."""
    A_bar = np.exp(delta * A_diag)
    B_bar = delta * B
    # TODO: compute kernel — for each j, K[j] = sum_i C_i * A_bar_i^j * B_bar_i
    pass

def ssm_convolution(x, kernel):
    """y[t] = sum_i kernel[t-i] * x[i]"""
    T = len(x); L = len(kernel)
    y = np.zeros(T)
    # TODO: implement convolution (causal)
    pass

# Setup
np.random.seed(2)
A_diag = np.array([-1.0, -0.5, -0.25, -0.1])
B = np.array([1.0, 1.0, 1.0, 1.0])
C = np.array([0.4, 0.3, 0.2, 0.1])
delta = 0.2
T = 40
x = np.random.normal(0, 1, T)

# Compute via recurrence
y_rec = ssm_recurrence(x, A_diag, B, C, delta)

# Compute via convolution
# K = compute_kernel(A_diag, B, C, delta, T)
# y_conv = ssm_convolution(x, K)

# Verify they match
# print(f"Recurrence vs convolution max diff: {np.abs(y_rec - y_conv).max():.2e}")
# print(f"\\nSame SSM, two implementations. This duality enables both efficient")
# print(f"training (parallel convolution) and efficient inference (sequential recurrence).")
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Selective SSM

Compare a non-selective (fixed $\Delta$) SSM to a selective (input-dependent $\Delta_t$) SSM on a sequence with both "important" and "filler" tokens. Verify the selective version captures the important content while the non-selective version smears across everything.

<details>
<summary>Hint</summary>

In a selective SSM, $\Delta_t$ depends on $x_t$. For this exercise, make $\Delta_t = \text{softplus}(x_t)$ — large $\Delta_t$ when $x_t$ is large/positive (important), small $\Delta_t$ when $x_t$ is small (filler).

Non-selective version: use a fixed $\Delta$ (the mean of the selective ones).

Compare the final state norms — the selective version should have larger state magnitudes for the important tokens.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softplus(x):
    return np.log(1 + np.exp(x))

def fixed_delta_ssm(x, A_diag, B, C, delta):
    """Fixed-delta SSM — same delta for every token."""
    T = len(x)
    A_bar = np.exp(delta * A_diag)
    B_bar = delta * B
    h = np.zeros(len(A_diag))
    states = []
    for t in range(T):
        h = A_bar * h + B_bar * x[t]
        states.append(h.copy())
    return np.array(states)

def selective_ssm(x, A_diag, B, C, W_delta=1.0):
    """Selective SSM — delta_t depends on input."""
    T = len(x)
    h = np.zeros(len(A_diag))
    states = []
    for t in range(T):
        # TODO: compute delta_t from x[t] via softplus
        # TODO: discretize and update state
        # delta_t = softplus(W_delta * x[t])
        # A_bar = np.exp(delta_t * A_diag)
        # B_bar = delta_t * B
        # h = A_bar * h + B_bar * x[t]
        # states.append(h.copy())
        pass
    return np.array(states)

# Sequence: alternating important (large) and filler (small) values
# Each pattern: [filler, IMPORTANT, filler, IMPORTANT, filler, ...]
x = np.array([0.1, 2.0, 0.1, 2.0, 0.1, 2.0, 0.1, 2.0, 0.1, 2.0])

A_diag = np.array([-1.0, -0.5, -0.25, -0.1])
B = np.array([1.0, 1.0, 1.0, 1.0])
C = np.array([1.0, 1.0, 1.0, 1.0])

# Fixed delta = mean of selective deltas
fixed_delta = np.mean([softplus(v) for v in x])
print(f"Mean delta for fixed-delta SSM: {fixed_delta:.3f}")

fixed_states = fixed_delta_ssm(x, A_diag, B, C, fixed_delta)
# selective_states = selective_ssm(x, A_diag, B, C, W_delta=1.0)

# Compare state norms at each step
# print(f"\\nState magnitudes at each step:")
# print(f"  fixed:     {[f'{np.linalg.norm(s):.2f}' for s in fixed_states]}")
# print(f"  selective: {[f'{np.linalg.norm(s):.2f}' for s in selective_states]}")
# print(f"\\nSelective SSM shows clearer 'spikes' on important tokens.")
# print(f"Fixed SSM smears across all tokens uniformly.")
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Parallel scan via associative operations

Implement Mamba's parallel scan algorithm. Given a sequence of $(A_t, B_t x_t)$ pairs, compute the prefix product/sum efficiently using the associative composition $(A_2, b_2) \circ (A_1, b_1) = (A_2 A_1, A_2 b_1 + b_2)$.

<details>
<summary>Hint</summary>

The parallel scan uses Blelloch's algorithm: an up-sweep (reduce) phase followed by a down-sweep (propagate) phase. For correctness verification, just implement a sequential prefix-sum and verify it matches the standard recurrence.

The associative operation is: combining $(A, b)$ and $(A', b')$ → $(A' A, A' b + b')$.
Identity element: $(I, 0)$.

For verification, you don't need true parallelism — just verify that scan via the associative operation gives the same result as direct recurrence.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def direct_recurrence(A_list, b_list, h0):
    """Standard sequential recurrence: h_t = A_t * h_{t-1} + b_t (diagonal A)"""
    h = h0.copy()
    states = [h.copy()]
    for t in range(len(A_list)):
        h = A_list[t] * h + b_list[t]
        states.append(h.copy())
    return states

def scan_via_associative(A_list, b_list, h0):
    """
    Compute the same recurrence by composing (A, b) pairs left-to-right via:
        (A_2, b_2) ∘ (A_1, b_1) = (A_2 * A_1, A_2 * b_1 + b_2)
    
    This is mathematically equivalent to the recurrence. A real parallel scan
    parallelizes this composition using Blelloch's algorithm.
    """
    # Start with identity (A=1, b=0) — applied to h0 gives h0
    # TODO: compose left-to-right and apply to h0 at each step
    # composed_A = np.ones_like(A_list[0])
    # composed_b = np.zeros_like(b_list[0])
    # states = [h0.copy()]
    # for t in range(len(A_list)):
    #     # Compose with the new (A_t, b_t)
    #     # New: A_new = A_t * composed_A, b_new = A_t * composed_b + b_t
    #     # Then h_t = A_new * h0 + b_new
    #     ...
    pass

# Verify equivalence
np.random.seed(3)
T = 20
N = 4
A_list = [np.random.uniform(0.3, 0.95, N) for _ in range(T)]   # diagonal A, magnitude < 1
b_list = [np.random.normal(0, 0.5, N) for _ in range(T)]
h0 = np.random.normal(0, 0.5, N)

direct = direct_recurrence(A_list, b_list, h0)
# scan = scan_via_associative(A_list, b_list, h0)

# Verify they match
# diffs = [np.linalg.norm(d - s) for d, s in zip(direct, scan)]
# print(f"Max difference: {max(diffs):.2e}")
# print(f"\\nThe associative composition gives the same result as the recurrence.")
# print(f"Mamba uses this property + Blelloch's algorithm to parallelize the scan on GPUs.")
# print(f"The CUDA kernel performs the composition in O(log T) depth instead of O(T).")
`}
  packages={["numpy"]}
/>

````

### Part C — Flip Ch 12's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 12, slug: 'ch12-ssm-and-mamba', title: 'State-space models and Mamba', partNum: 4, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 1's** `SSMvsAttentionScaling` widget still renders correctly.
3. **Section 5** now renders the working `SelectiveScanAnimation` widget.
4. **Default state:** t = 0; heatmap mostly dim. Press play → animation advances one step every ~800ms.
5. **Token row**: important tokens (capital, France, Paris, weather, rainy, winter) styled distinctly from filler.
6. **Δ_t bars**: tall on important tokens, short on filler tokens. Past bars at full opacity; future bars dimmed.
7. **State heatmap**:
   - Cells past current time are dimmed/hidden (showing the future hasn't been computed)
   - Fast-decay rows (h₀, h₁) light up only on important tokens and quickly fade
   - Slow-decay rows (h₆, h₇) light up on important tokens and STAY lit across many subsequent steps
   - Visible difference in fade rate between row groups
8. **Current-time vertical line** (amber) follows the slider/animation.
9. **Selected step details** updates with token text, Δ_t, importance, and state values.
10. **Exercises section** is below section 8 and above chapter close; contains 4 sub-exercises with collapsible hints and runnable starter code.
11. **Sidebar:** Ch 1-12 all active (published); Ch 13-30 still dimmed.
12. **Prev/next at bottom of Ch 12:** prev = Ch 11 (active); next = Ch 13 (disabled).
13. **TOC on Ch 12** includes Exercises as h2 plus 4 h3 sub-entries.
14. **Mobile (< 640px):** controls stack vertically; heatmap still readable.
15. **`npm run typecheck`** passes.
16. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 12 flips.
- ❌ **Do not modify Ch 1-11.** Sealed.
- ❌ **Do not modify Ch 12 marquee widget.** Only section 5's WidgetFrame gets updated.
- ❌ **Do not modify Ch 12 prose sections 1-8.** Sealed.
- ❌ **Do not implement a real Blelloch parallel scan** in the widget. The animation is a state-evolution visualization; the parallel scan is in Exercise 4.

---

## Wire-up

```bash
git add src/pages/ch12-ssm-and-mamba/index.mdx src/lib/chapters.ts src/components/widgets/ch12/SelectiveScanAnimation.tsx src/components/widgets/ch12/SelectiveScanAnimation.module.css src/components/widgets/ch12/selective-scan-data.ts src/components/widgets/index.ts
git commit -m "session 56: Ch 12 selective scan animation + exercises + status: published — Phase 10 complete"
git push origin main
```

---

## 🎉 Phase 10 closeout

**This is the closeout for both Chapter 12 AND Phase 10.** After this session deploys, the tutorial's entire architectural exploration is on production. Phase 11 (post-training) begins next.

Confirm before declaring Ch 12 / Phase 10 done:

- ✅ BUILD_ORDER.md shows files 70-73 ✅
- ✅ Files 74-75 marked ⏭️ (absorbed)
- ✅ Ch 12 status is `'published'`
- ✅ Both Ch 12 widgets work in production
- ✅ All 4 Ch 12 exercises render
- ✅ Sidebar shows Ch 1-12 all active

**Cadence check across 12 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual | 2 | 4 |
| Ch 5 | Two-topic | 2 | 5 |
| Ch 6 | Variants | 2 | 4 |
| Ch 7 | Data engineering | 2 | 4 |
| Ch 8 | Two-topic | 2 | 5 |
| Ch 9 | Two-topic | 2 | 5 |
| Ch 10 | Engineering | 2 | 4 |
| Ch 11 | Architectural variant | 2 | 4 |
| Ch 12 | Architectural variant | 2 | 4 |

**4-file cadence holds for single-topic chapters (Ch 2, 3, 4, 6, 7, 10, 11, 12 — 8 chapters now).**
**5-file cadence holds for two-topic chapters (Ch 1, 5, 8, 9 — 4 chapters).**
**12-chapter pattern stable.**

**Phase 10 (Alternative architectures) status:**
- ✅ Ch 11 (Mixture of Experts)
- ✅ Ch 12 (State-space models and Mamba)

**Phase 10 complete.** The architectural exploration arc is finished. The tutorial now covers all three major architecture families:
- **Dense transformers** (Ch 1-6)
- **Mixture of Experts** (Ch 11)
- **State-space models / Mamba** (Ch 12)

**What's next — Phase 11 (Post-training):**
- **Ch 13**: SFT (supervised fine-tuning)
- **Ch 14**: RLHF / DPO / RLVR (alignment methods)
- **Ch 15**: PEFT (LoRA, adapters, parameter-efficient methods)
- **Ch 16**: Distillation

Phase 11 is the largest remaining arc. It covers what to do with a pre-trained model to make it actually useful — turning raw next-token prediction into chatbots, instruction-followers, and helpful assistants.

---

## Notes for the session author

**On the selective scan animation being the conceptual centerpiece:**
The widget visualizes Mamba's key insight: state updates strongly when $\Delta_t$ is large (important tokens) and barely changes when $\Delta_t$ is small (filler). The reader can *see* the state "remember" important content (slow-decay rows stay lit) and "forget" filler (fast-decay rows fade quickly). No equation will make selectivity feel real the way this animation does.

**On the hand-tuned sequence:**
"The capital of France is Paris..." was chosen because:
- Has clear semantic structure (named entities, predicates)
- Important words have intuitively obvious salience (Paris, France, weather, rainy)
- Mix of factual ("capital of France is Paris") and atmospheric ("weather there is often rainy in winter") content
- 16 tokens — long enough to show patterns, short enough to scan visually

The handcrafted $\Delta_t$ values (~0.85 for important, ~0.05 for filler) are pedagogical — real Mamba routers produce noisier but qualitatively similar patterns.

**On the row-decay differential:**
Eight state components with eigenvalues from $-3.0$ (fast decay, half-life ~2 steps) to $-0.1$ (slow decay, half-life ~70 steps). The visual difference between fast-row fading and slow-row persistence is the chapter's signature. **Slow-decay components are long-term memory; fast-decay components are short-term.** This is the SSM's *capacity profile* across components.

**On the play/pause UX:**
800ms per step strikes the balance between "fast enough to watch" and "slow enough to absorb." Faster (200ms) loses the cell-by-cell narrative; slower (2000ms) feels sluggish. The slider lets readers scrub at their own pace; play button is for the canonical narrative.

**On the exercise sequence:**
- Ex 1 (easy) — discrete recurrence: locks in the basic math
- Ex 2 (medium) — duality: reader verifies the recurrence-convolution equivalence empirically
- Ex 3 (medium) — selectivity: comparison of fixed-$\Delta$ vs selective-$\Delta$ on the same sequence
- Ex 4 (hard) — parallel scan: implement the associative-composition method; verify equivalence with direct recurrence

**On the 4 exercises serving the 7 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. SSM equation | Ex 1 |
| 2. Recurrence-convolution duality | Ex 2 |
| 3. Selectivity | Ex 3 |
| 4. Selective scan algorithm | Ex 4 |
| 5. SSMs vs attention | (widget + Ex 4 sees parallelism) |
| 6. Hybrid models | (chapter prose) |
| 7. When to use SSMs | (chapter prose + widget) |

Outcomes 1-4 served by exercises. Outcomes 5-7 served by chapter prose + widgets.

**Phase 10 closeout:**
After this session deploys, Phase 10 is complete. The tutorial's three major architecture families are all on production. The reader has the full architectural toolkit:
- **When to use dense transformers**: general-purpose, well-understood, simplest to train and serve (Ch 1-6)
- **When to use MoE**: very large total parameters with manageable per-token inference cost (Ch 11)
- **When to use SSMs**: long contexts where attention's $O(N^2)$ is prohibitive (Ch 12)

**Phase 11 begins next.** It's a different texture from Phase 10. Phase 10 chapters were independent (MoE and SSMs are largely unrelated approaches). Phase 11's four chapters (SFT, RLHF/DPO/RLVR, PEFT, distillation) are more sequential — each builds on the previous. The reader will walk from "I have a pre-trained model" through "I have a useful chatbot."

**This session closes the architecture arc.** Pace through Phase 11 chapters at the established cadence. The pattern is stable across 12 chapters; expect Phase 11 to follow.

Build with care.
