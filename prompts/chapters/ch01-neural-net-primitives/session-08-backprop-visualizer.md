# Session 08 — Backprop visualizer (Chapter 1 marquee widget)

> Builds the highest pedagogical-value widget in Chapter 1: an animated 2-layer MLP that visualizes the forward pass left-to-right (input → hidden → output → loss) and then the backward pass right-to-left (loss → gradients → weight updates). Hover any node or edge for the math at that location. Play, step, and reset controls. Replaces the placeholder `<WidgetFrame>` in section 4 of `index.mdx`.

---

## Read first (in this order)

1. **`research/ch01-neural-net-primitives/research.md`** — Derivations 1 and 3 (cross-entropy gradient and 2-layer MLP backward in matrix form). The widget animates exactly these computations.
2. **`prompts/chapters/ch01-neural-net-primitives/session-07-page-structure.md`** — to understand where this widget plugs in (section 4, after the matrix-form discussion)
3. **`context/DESIGN_SYSTEM.md`** — especially "Widget aesthetics," "Color usage," and "Layout grid"
4. **`prompts/scaffolding/session-04-layout-and-navigation.md`** — for ChapterLayout dimensions; the widget renders inside `chapter-content` with `max-width: var(--container-wide)` = 1100px
5. **`prompts/scaffolding/session-05-pyodide-runnable-code.md`** — to understand the React-island pattern (this widget follows the same conventions: `client:visible`, `cancelledRef` cleanup, scoped CSS module)

The data-model decisions in section "Network state" of this prompt are derived from `research.md` Derivation 3. If anything contradicts, the research file wins.

---

## Goal

Replace the `<WidgetFrame title="Backprop through a 2-layer MLP">` placeholder in `src/pages/ch01-neural-net-primitives/index.mdx` with a working interactive widget that:

- Shows a 2-input → 4-hidden → 3-output MLP as an SVG diagram
- Plays the forward pass in 5 timed stages (~600ms each) with cyan-glowing nodes and edges
- Plays the backward pass in 5 more stages with amber-glowing gradient flow
- On hover, shows a tooltip with the exact math at that location (e.g., "z1[2] = W1[0][2]·x[0] + W1[1][2]·x[1] + b1[2] = 0.42")
- Has Play / Step / Reset controls
- Lets the user pick from 3 preset inputs to see how different inputs flow through

**End state:** the chapter's section 4 has a working marquee widget. Sessions 09 and 10's widget slots remain stubbed; only this one is filled by this session.

---

## Inputs

State of the repo after session 07:

- `src/pages/ch01-neural-net-primitives/index.mdx` exists with three `<WidgetFrame>` placeholders, one of which is for backprop
- `src/lib/seeded-prng.ts` is available (`mulberry32` + helpers)
- `src/components/code/RunnableCode.tsx` exists as a reference for React-island patterns
- No `src/components/widgets/` directory yet — this session creates it

---

## Deliverables

1. **Create** `src/components/widgets/ch01/BackpropVisualizer.tsx` — the React widget
2. **Create** `src/components/widgets/ch01/BackpropVisualizer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch01/network-state.ts` — the precomputed data + math helpers
4. **Create** `src/components/widgets/index.ts` — barrel for `@components/widgets`
5. **Update** `src/pages/ch01-neural-net-primitives/index.mdx` — replace the placeholder `<WidgetFrame>` interior with `<BackpropVisualizer client:visible />`

**Do NOT modify:** any file under `src/styles/`, `src/components/content/`, `src/components/nav/`, `src/components/code/`, or any layout file. Do NOT modify `src/lib/chapters.ts` (chapter status stays `'draft'` until session 10).

---

## Detailed spec

### Architecture overview

The widget is a single React component, `BackpropVisualizer`, mounted via `client:visible` (deferred until scroll-into-view — saves initial JS execution cost since the widget is below the fold).

```
src/components/widgets/
├── ch01/
│   ├── BackpropVisualizer.tsx        ← React + SVG + animation state machine
│   ├── BackpropVisualizer.module.css ← scoped styles
│   └── network-state.ts              ← pure data + math (no React)
└── index.ts                          ← barrel: `export { BackpropVisualizer }`
```

The data layer (`network-state.ts`) is pure functions: given (input, weights), compute the full forward + backward state. The view layer (`BackpropVisualizer.tsx`) reads from the data layer and renders animated SVG.

### 1. `network-state.ts`

Pure module — no React, no DOM. Exports types and computation functions.

```ts
// src/components/widgets/ch01/network-state.ts

import { seededPRNG, randNormal } from '@lib/seeded-prng';

export interface NetworkState {
  // Inputs
  x: number[];            // length 2 — the input vector
  y_target: number;       // class index 0, 1, or 2
  y_onehot: number[];     // length 3 — one-hot target

  // Parameters
  W1: number[][];         // shape (2, 4)
  b1: number[];           // length 4
  W2: number[][];         // shape (4, 3)
  b2: number[];           // length 3

  // Forward pass intermediates
  z1: number[];           // length 4 (pre-activation)
  a1: number[];           // length 4 (post-ReLU)
  z2: number[];           // length 3 (logits)
  p: number[];            // length 3 (probabilities)
  loss: number;           // scalar CE loss

  // Backward pass gradients
  dz2: number[];          // length 3
  dW2: number[][];        // shape (4, 3)
  db2: number[];          // length 3
  da1: number[];          // length 4
  dz1: number[];          // length 4
  dW1: number[][];        // shape (2, 4)
  db1: number[];          // length 4
}

const D_IN = 2;
const D_H = 4;
const D_OUT = 3;

export function initialWeights(seed: number = 42): {
  W1: number[][]; b1: number[]; W2: number[][]; b2: number[];
} {
  const rng = seededPRNG(seed);
  // He init: std = sqrt(2 / fan_in)
  const std1 = Math.sqrt(2 / D_IN);
  const std2 = Math.sqrt(2 / D_H);
  const W1 = Array.from({ length: D_IN },  () => Array.from({ length: D_H },   () => randNormal(rng) * std1));
  const W2 = Array.from({ length: D_H },   () => Array.from({ length: D_OUT }, () => randNormal(rng) * std2));
  const b1 = new Array(D_H).fill(0);
  const b2 = new Array(D_OUT).fill(0);
  return { W1, b1, W2, b2 };
}

export function softmax(z: number[]): number[] {
  const max = Math.max(...z);
  const exps = z.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

export function computeState(
  x: number[],
  y_target: number,
  W1: number[][], b1: number[],
  W2: number[][], b2: number[],
): NetworkState {
  // Forward pass — single-example (B = 1), so we work with vectors not matrices

  // z1 = x @ W1 + b1, shape (4,)
  const z1 = new Array(D_H).fill(0);
  for (let h = 0; h < D_H; h++) {
    for (let i = 0; i < D_IN; i++) {
      z1[h] += x[i]! * W1[i]![h]!;
    }
    z1[h] += b1[h]!;
  }

  // a1 = ReLU(z1)
  const a1 = z1.map(v => Math.max(0, v));

  // z2 = a1 @ W2 + b2, shape (3,)
  const z2 = new Array(D_OUT).fill(0);
  for (let o = 0; o < D_OUT; o++) {
    for (let h = 0; h < D_H; h++) {
      z2[o] += a1[h]! * W2[h]![o]!;
    }
    z2[o] += b2[o]!;
  }

  // p = softmax(z2)
  const p = softmax(z2);

  // loss = -log(p[y_target])
  const loss = -Math.log(Math.max(p[y_target]!, 1e-12));

  // Backward pass
  const y_onehot = new Array(D_OUT).fill(0);
  y_onehot[y_target] = 1;

  // dz2 = p - y_onehot  (batch size 1, no division needed for visualization clarity)
  const dz2 = p.map((pi, i) => pi - y_onehot[i]!);

  // dW2[h][o] = a1[h] * dz2[o], shape (4, 3)
  const dW2 = Array.from({ length: D_H }, (_, h) =>
    Array.from({ length: D_OUT }, (_, o) => a1[h]! * dz2[o]!)
  );

  // db2 = dz2
  const db2 = [...dz2];

  // da1[h] = sum_o W2[h][o] * dz2[o]
  const da1 = new Array(D_H).fill(0);
  for (let h = 0; h < D_H; h++) {
    for (let o = 0; o < D_OUT; o++) {
      da1[h] += W2[h]![o]! * dz2[o]!;
    }
  }

  // dz1[h] = da1[h] * relu_grad(z1[h])
  const dz1 = da1.map((g, h) => g * (z1[h]! > 0 ? 1 : 0));

  // dW1[i][h] = x[i] * dz1[h], shape (2, 4)
  const dW1 = Array.from({ length: D_IN }, (_, i) =>
    Array.from({ length: D_H }, (_, h) => x[i]! * dz1[h]!)
  );

  // db1 = dz1
  const db1 = [...dz1];

  return {
    x, y_target, y_onehot,
    W1, b1, W2, b2,
    z1, a1, z2, p, loss,
    dz2, dW2, db2, da1, dz1, dW1, db1,
  };
}

// Three preset inputs chosen so the visualization shows interesting dynamics:
// - INPUT_A: clearly classifies as class 0 (high pre-activations on output 0)
// - INPUT_B: ambiguous (probabilities close to uniform)
// - INPUT_C: clearly classifies as class 2

export const PRESETS = [
  { label: 'A: confident class 0', x: [ 1.2, -0.8] as number[], y_target: 0 },
  { label: 'B: ambiguous',         x: [ 0.1,  0.2] as number[], y_target: 1 },
  { label: 'C: confident class 2', x: [-1.0,  1.3] as number[], y_target: 2 },
];
```

**Notes:**
- `B = 1` (batch size 1) for visual simplicity. The gradient `dz2 = p - y_onehot` (no `/B` factor) shows the cleanest version of Derivation 1's result.
- Preset inputs are hand-picked to produce interesting visualizations — the seed-42 initial weights happen to produce these classifications. If you change the seed, regenerate the presets so they still hit "confident/ambiguous/confident" cases.
- The `!` non-null assertions are required by `noUncheckedIndexedAccess` in `tsconfig.json`. Array bounds are managed by explicit loop limits.

### 2. SVG layout specification

The widget renders inside a `<WidgetFrame>` (so the chrome is provided by the existing component; this section is just the SVG content).

**ViewBox:** `0 0 880 460` (16:9-ish at the widget's 1100px-ish width)

**Coordinate plan:**

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   x[0] ●━━━━━━━━ z1[0] ● → a1[0] ●━━━━━━━ z2[0] ● → p[0] ●            │
│         \      /         \      /         \      /          ╲          │
│   x[1] ●━━━━━━━━ z1[1] ● → a1[1] ●━━━━━━━ z2[1] ● → p[1] ● → ● Loss   │
│                            ⋮                                ╱          │
│                  z1[3] ● → a1[3] ●                                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Column x-coordinates:**
- Input column: `x = 100`
- Hidden column (z1 / a1): `x = 380`
- Output column (z2 / p): `x = 660`
- Loss bubble: `x = 820`

**Row y-coordinates** for the input column (2 nodes): `y = 190, 290`

**Row y-coordinates** for the hidden column (4 nodes): `y = 80, 180, 280, 380`

**Row y-coordinates** for the output column (3 nodes): `y = 130, 230, 330`

**Loss bubble:** `cx = 820, cy = 230, r = 28`

**Node geometry:**
- Each circular node has radius `r = 28`
- Inside the circle: the value rendered as text, font-family `JetBrains Mono`, size 14px, centered both axes
- Below the circle: a small label (e.g., "x[0]", "z1[2]", "p[1]"), font size 10px, `var(--text-tertiary)`

**Edge geometry:**
- 8 edges from input column → hidden column (each x[i] connects to each z1[h])
- 12 edges from hidden column → output column (each a1[h] connects to each z2[o])
- 3 edges from output column → loss bubble (each p[i] connects to the loss)
- Edges are drawn from circle-edge to circle-edge (not center to center) — compute the offset using basic trig
- Stroke width proportional to |weight| with min 0.5px, max 3px
- Stroke color: cyan-500 for positive weights, rose-500 for negative weights, at 30% opacity in idle state

**Important:** the four "hidden column" nodes appear *twice* in the layout — once as z1 (pre-activation) and once as a1 (post-ReLU). Rather than rendering them as two separate columns, render them as one column where the node's interior value changes between stages (z1 → a1 → da1 → dz1) as the animation progresses. Same for the output column (z2 → p → dz2).

This saves horizontal space and emphasizes that pre/post-activation are the same neuron at different stages.

### 3. Animation state machine

The widget transitions through 11 states. Each state determines what's visible / glowing / annotated.

| Stage | Phase     | Visible elements                                            | Active glow                | Tooltip mode |
|-------|-----------|-------------------------------------------------------------|----------------------------|--------------|
| 0     | idle      | Network skeleton, faded                                    | None                       | Inputs only  |
| 1     | forward-1 | Inputs lit; input→hidden edges flowing cyan               | Edges 1                    | Weights      |
| 2     | forward-2 | Hidden nodes show z1 values                                | Hidden nodes               | Pre-act sums |
| 3     | forward-3 | Hidden nodes flip to a1 (ReLU applied)                    | Hidden nodes               | ReLU         |
| 4     | forward-4 | Hidden→output edges flowing cyan                          | Edges 2                    | Weights      |
| 5     | forward-5 | Output nodes show z2 then p (softmax); loss bubble appears | Output nodes, loss         | Probabilities|
| 6     | backward-1| Loss → output gradient (dz2 = p - y)                      | Output nodes (amber)       | dz2          |
| 7     | backward-2| Output→hidden edges flowing amber (gradients backward)     | Edges 2 (amber)            | dW2 product  |
| 8     | backward-3| Hidden nodes show da1, then dz1 (ReLU subgradient mask)   | Hidden nodes (amber)       | ReLU mask    |
| 9     | backward-4| Hidden→input edges flowing amber                          | Edges 1 (amber)            | dW1 product  |
| 10    | done      | All gradients shown; "Step" button no longer active        | None                       | All values   |

Each stage holds for **600ms** before auto-advancing (when in play mode) or until user clicks "Step" (in step mode).

**Implementation:** a `stage: number` state variable (0–10). The SVG render function takes `stage` and conditionally shows/hides/styles elements based on it.

### 4. `BackpropVisualizer.tsx`

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type NetworkState,
  initialWeights,
  computeState,
  PRESETS,
} from './network-state';
import styles from './BackpropVisualizer.module.css';

const STAGE_DURATION_MS = 600;
const TOTAL_STAGES = 10; // 0 = idle, 10 = done; 11 states total

export default function BackpropVisualizer() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hovered, setHovered] = useState<{ kind: string; idx: number } | null>(null);

  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute the full network state for the selected preset
  const state: NetworkState = useMemo(() => {
    const { W1, b1, W2, b2 } = initialWeights(42);
    const preset = PRESETS[presetIdx]!;
    return computeState(preset.x, preset.y_target, W1, b1, W2, b2);
  }, [presetIdx]);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying) return;
    if (stage >= TOTAL_STAGES) { setIsPlaying(false); return; }

    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStage(s => s + 1);
    }, STAGE_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, stage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handlePlay() {
    if (stage >= TOTAL_STAGES) {
      setStage(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }

  function handleStep() {
    if (stage >= TOTAL_STAGES) return;
    setIsPlaying(false);
    setStage(s => s + 1);
  }

  function handleReset() {
    setIsPlaying(false);
    setStage(0);
    setHovered(null);
  }

  return (
    <div className={styles.widget}>
      <div className={styles.presetBar}>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => { handleReset(); setPresetIdx(i); }}
            className={`${styles.presetButton} ${i === presetIdx ? styles.presetActive : ''}`}
            aria-pressed={i === presetIdx}
          >
            {p.label}
          </button>
        ))}
      </div>

      <NetworkSVG state={state} stage={stage} hovered={hovered} setHovered={setHovered} />

      <Tooltip hovered={hovered} state={state} stage={stage} />

      <div className={styles.controls}>
        <button onClick={handlePlay} className={styles.controlPrimary} aria-label="Play or pause animation">
          {isPlaying ? 'Pause' : stage >= TOTAL_STAGES ? 'Replay' : stage === 0 ? 'Play' : 'Resume'}
        </button>
        <button onClick={handleStep} className={styles.controlSecondary} disabled={stage >= TOTAL_STAGES || isPlaying} aria-label="Step forward one stage">
          Step
        </button>
        <button onClick={handleReset} className={styles.controlSecondary} aria-label="Reset to initial state">
          Reset
        </button>
        <span className={styles.stageLabel} aria-live="polite">
          Stage {stage} / {TOTAL_STAGES}
        </span>
      </div>
    </div>
  );
}

// === Sub-components ===

function NetworkSVG({ state, stage, hovered, setHovered }: {
  state: NetworkState;
  stage: number;
  hovered: { kind: string; idx: number } | null;
  setHovered: (h: { kind: string; idx: number } | null) => void;
}) {
  // Render the full SVG. See "SVG layout specification" for coordinates.
  // Implementation guidance:
  //
  //   1. Render edges first (so nodes draw over edges)
  //   2. Render input column (always visible from stage 0)
  //   3. Render hidden column (visible from stage 2; value depends on stage:
  //      - stage 2: show z1
  //      - stage 3+: show a1 (forward direction)
  //      - stage 8: show da1 → dz1 (backward direction)
  //   4. Render output column (visible from stage 5):
  //      - stage 5: show p (with z2 as tooltip)
  //      - stage 6+: also show dz2 next to p
  //   5. Render loss bubble (visible from stage 5)
  //   6. Apply glow effects based on stage (see table above)
  //
  // For glowing edges during animation:
  //   - Stages 1, 4: cyan-tinted edges with a flowing animation (use CSS dash-array animation)
  //   - Stages 7, 9: amber-tinted edges with the same flowing animation
  //   - Other stages: edges in idle gray
  //
  // For hover states: each interactive element (node, edge) has onMouseEnter setting
  // hovered={kind: 'node-x' | 'node-z1' | ..., idx: 0..n}.
  //
  // Full implementation is ~250 lines. Build it up element-by-element; keep the
  // render function declarative — no imperative DOM manipulation.

  return (
    <svg viewBox="0 0 880 460" className={styles.svg} role="img" aria-label="Two-layer MLP with forward and backward pass">
      {/* ... render edges, nodes, loss bubble per the layout spec ... */}
    </svg>
  );
}

function Tooltip({ hovered, state, stage }: {
  hovered: { kind: string; idx: number } | null;
  state: NetworkState;
  stage: number;
}) {
  if (!hovered) {
    return <div className={styles.tooltipBox}>Hover any node or edge for the math at that point.</div>;
  }

  // Build the tooltip text based on hovered.kind and current stage.
  // Examples:
  //   kind === 'node-x', idx === 0  →  "x[0] = 1.20"
  //   kind === 'node-z1', idx === 2 →  if stage <= 2: "z1[2] = W1[0][2]·x[0] + W1[1][2]·x[1] + b1[2] = ..."
  //                                    if stage >= 8: also "dz1[2] = da1[2] · 1[z1[2] > 0] = ..."
  //   kind === 'edge-W1', idx === <flattened i,h index> → "W1[i][h] = ..."
  //   kind === 'node-p', idx === 0  →  "p[0] = softmax(z2)[0] = ..."  + if stage >= 6: "dz2[0] = p[0] - y[0] = ..."
  //
  // Format numbers with 3 decimal places. Use the Equation/EqRef components from
  // @components/content if KaTeX rendering would help (it does for the matrix-product
  // tooltips).

  return (
    <div className={styles.tooltipBox}>
      {/* derived text from hovered + state + stage */}
    </div>
  );
}
```

**Implementation notes:**
- `useMemo` ensures the network state is computed once per preset change, not on every render.
- The animation timer uses `setTimeout` not `requestAnimationFrame` — we don't need 60fps; we need crisp 600ms stage transitions. `setTimeout` is simpler and adequate.
- `cancelledRef` + cleanup pattern from `RunnableCode.tsx` carries over here. If the user scrolls away or navigates, in-flight `setStage` calls are skipped.
- `aria-live="polite"` on the stage label gives screen readers a non-disruptive announcement when stages advance.

### 5. `BackpropVisualizer.module.css`

CSS module — uses `var(--*)` to inherit the design system.

```css
.widget {
  --node-radius: 28px;
  --edge-base-width: 1px;
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
}

.presetBar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.presetButton {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: inherit;
  cursor: pointer;
  transition: border-color 200ms, color 200ms;
}
.presetButton:hover {
  color: var(--cyan-300);
  border-color: var(--cyan-500);
}
.presetActive {
  color: var(--cyan-400);
  border-color: var(--cyan-500);
  background: rgba(6, 182, 212, 0.08);
}

.svg {
  display: block;
  width: 100%;
  height: auto;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

/* Node visuals (apply via React's className based on stage) */
.svg :global(.node) {
  cursor: pointer;
}
.svg :global(.node-circle) {
  fill: var(--bg-elevated);
  stroke: var(--border-default);
  stroke-width: 1.5;
  transition: stroke 250ms cubic-bezier(0.22, 1, 0.36, 1),
              fill 250ms cubic-bezier(0.22, 1, 0.36, 1);
}
.svg :global(.node-circle.active-fwd) {
  stroke: var(--cyan-500);
  stroke-width: 2;
  fill: rgba(6, 182, 212, 0.10);
}
.svg :global(.node-circle.active-bwd) {
  stroke: var(--amber-500);
  stroke-width: 2;
  fill: rgba(245, 158, 11, 0.10);
}

.svg :global(.node-value) {
  font-size: 14px;
  fill: var(--text-primary);
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
}
.svg :global(.node-label) {
  font-size: 10px;
  fill: var(--text-tertiary);
  text-anchor: middle;
  pointer-events: none;
}

/* Edges */
.svg :global(.edge) {
  fill: none;
  stroke: var(--border-default);
  stroke-width: var(--edge-base-width);
  opacity: 0.4;
}
.svg :global(.edge-positive) { stroke: var(--cyan-500); }
.svg :global(.edge-negative) { stroke: var(--rose-500); }

.svg :global(.edge.flowing-fwd) {
  opacity: 0.9;
  stroke: var(--cyan-400);
  stroke-dasharray: 4 4;
  animation: flow-forward 800ms linear infinite;
}
.svg :global(.edge.flowing-bwd) {
  opacity: 0.9;
  stroke: var(--amber-500);
  stroke-dasharray: 4 4;
  animation: flow-backward 800ms linear infinite;
}

@keyframes flow-forward {
  to { stroke-dashoffset: -16; }
}
@keyframes flow-backward {
  to { stroke-dashoffset: 16; }
}

/* Loss bubble */
.svg :global(.loss-bubble) {
  fill: var(--bg-overlay);
  stroke: var(--cyan-500);
  stroke-width: 2;
}
.svg :global(.loss-bubble-label) {
  font-size: 11px;
  fill: var(--text-tertiary);
}
.svg :global(.loss-bubble-value) {
  font-size: 16px;
  fill: var(--cyan-400);
  font-weight: 500;
}

.tooltipBox {
  min-height: 70px;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}
.controlPrimary {
  padding: 0.5rem 1rem;
  background: var(--cyan-500);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
}
.controlPrimary:hover { background: var(--cyan-400); }

.controlSecondary {
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  cursor: pointer;
}
.controlSecondary:hover:not(:disabled) {
  color: var(--cyan-300);
  border-color: var(--cyan-500);
}
.controlSecondary:disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

.stageLabel {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Reduced motion: kill the flowing animations */
@media (prefers-reduced-motion: reduce) {
  .svg :global(.edge.flowing-fwd),
  .svg :global(.edge.flowing-bwd) {
    animation: none;
  }
}
```

### 6. `src/components/widgets/index.ts`

```ts
// src/components/widgets/index.ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
// Future widgets register here too:
// export { default as TrainingCurves } from './ch01/TrainingCurves';
// export { default as AutogradGraph } from './ch01/AutogradGraph';
```

### 7. Update `src/pages/ch01-neural-net-primitives/index.mdx`

Find the section-4 `<WidgetFrame title="Backprop through a 2-layer MLP">` block (created in session 07). Replace its interior `<div>` placeholder with the React component, using `client:visible` to defer mount until scroll:

```mdx
import { BackpropVisualizer } from '@components/widgets';

...

<WidgetFrame title="Backprop through a 2-layer MLP" caption="Animated trace of the forward and backward pass through a small MLP. Switch between input presets to see how different inputs flow through the network. Hover any node or edge for the math at that point.">
  <BackpropVisualizer client:visible />
</WidgetFrame>
```

**Notes:**
- The `import` line goes near the top of `index.mdx` next to the other component imports (sessions 07 added them).
- `client:visible` (not `client:load`) is the right hydration strategy: the widget is below the fold; deferring mount saves ~150KB of JS execution on initial page load.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly; no TypeScript errors; no console errors when navigating to `/ch01-neural-net-primitives/`.
2. **Section 4 of Ch 1** renders with the working widget where the placeholder was. The other two `<WidgetFrame>` placeholders (sessions 5 and 8 in the MDX file) remain stubbed — only the section-4 widget is filled by this session.
3. **Initial state (stage 0):** SVG shows the network skeleton with faded gray edges and node outlines. Inputs are visible. Hidden, output, and loss nodes are visible but values are blank / faded.
4. **Click Play:** the animation advances through stages 1–10, each holding for ~600ms. Forward pass shows cyan glow / flowing dashed edges; backward pass shows amber.
5. **At the end (stage 10):** all values visible, all gradients visible, Play button now says "Replay".
6. **Click Step (with paused):** advances one stage at a time. Disabled when playing or at end.
7. **Click Reset:** returns to stage 0.
8. **Preset switcher:** clicking "A: confident class 0" / "B: ambiguous" / "C: confident class 2" changes the input and resets the animation. The active preset has cyan-tinted styling.
9. **Hover any node:** tooltip below the SVG shows the math at that point — e.g., hovering on `z1[2]` shows `"z1[2] = W1[0][2]·x[0] + W1[1][2]·x[1] + b1[2] = (-0.32)·(1.20) + (0.85)·(-0.80) + 0.00 = -1.064"`. Number format: 3 decimal places.
10. **Hover backward-only elements while at stage < 6:** tooltip shows only the forward-state info; doesn't pretend gradients exist yet.
11. **Mobile (≤ 640px):** the SVG scales down via viewBox; tooltip remains readable; controls wrap to two rows if needed.
12. **`prefers-reduced-motion: reduce`:** flowing edge animations are static (no dash movement); stage transitions still happen but without the flowing visual.
13. **Bundle size:** check `npm run build` output. The chunk containing `BackpropVisualizer` should be < 50 KB gzipped (it's a small SVG component; no heavy deps).
14. **No console warnings** about `setState` on unmounted components when navigating away mid-animation.
15. **`npm run typecheck`** passes with zero errors.
16. **Final repo additions:**

```
src/
├── components/
│   └── widgets/
│       ├── ch01/
│       │   ├── BackpropVisualizer.tsx           ← new
│       │   ├── BackpropVisualizer.module.css    ← new
│       │   └── network-state.ts                 ← new
│       └── index.ts                             ← new
└── pages/
    └── ch01-neural-net-primitives/
        └── index.mdx                            (updated)
```

---

## Out of scope

- ❌ **Do not let the user edit the input vector by dragging.** Three preset inputs is enough for v1. Phase 13 polish could add input editing.
- ❌ **Do not implement weight updates after backward.** The animation ends at "gradients computed." Adding the weight-update stage doesn't add pedagogical value here; the optimizer story is in section 7 of the chapter.
- ❌ **Do not animate softmax or ReLU as separate stages.** They're folded into stages 3 and 5 — fast enough to read.
- ❌ **Do not use Recharts, D3, or Plotly.** Pure inline SVG. The widget is small enough that a charting library is overkill, and adds bundle weight.
- ❌ **Do not use `requestAnimationFrame`.** `setTimeout` is sufficient for stage transitions; rAF is for 60fps continuous animation (we don't have any).
- ❌ **Do not add chapter content / prose changes** beyond the single `<WidgetFrame>` interior swap. Section 7 of this prompt explicitly limits what's modified in `index.mdx`.
- ❌ **Do not implement the other two Ch 1 widgets.** Session 09 owns training-curves; session 10 owns autograd-graph.

---

## Wire-up

After all acceptance criteria pass:

```bash
git add src/components/widgets src/pages/ch01-neural-net-primitives/index.mdx
git commit -m "session 08: backprop visualizer — animated 2-layer MLP with forward/backward stages"
git push origin main
```

Visit production. Read section 4 of Ch 1 on desktop AND mobile. Verify:
- Desktop: widget fills the chapter-content width comfortably; tooltip below SVG is readable
- Mobile: SVG scales correctly; controls and preset buttons wrap; tooltip remains usable
- Animation feels right at 600ms per stage — not too slow, not too fast

If the timing feels wrong, adjust `STAGE_DURATION_MS` and commit a follow-up. 500–800ms is the reasonable range.

The next session (`session-09-mlp-runnable.md`) assumes:
- This widget exists and works
- The other two `<WidgetFrame>` placeholders in `index.mdx` are still stubbed (one for session 09, one for session 10)

---

## Notes for the session author

**Pixel-level precision matters here, but only for layout.** Animation timing and exact color shades can drift slightly — what matters is that the visualization clearly communicates "data flows left to right, then gradients flow right to left."

**SVG <-> React tip:** when the SVG has many similar elements (12 hidden→output edges), use a loop with `key={`${h}-${o}`}` rather than hand-writing each `<path>`. Easier to maintain and re-layout.

**On the dashed-line flowing animation:** the `stroke-dashoffset` CSS animation with `stroke-dasharray: 4 4` creates the "marching ants" effect. Forward: offset goes 0 → -16 (dashes move in direction of stroke). Backward: 0 → +16 (move opposite). 800ms is the right pace; faster looks frantic, slower looks dead.

**On accessibility:** the widget is decorative — the chapter prose explains the math without requiring the widget. So full keyboard navigation isn't required. But:
- The Play/Step/Reset buttons are real `<button>` elements with `aria-label`s
- Stage progression is announced via `aria-live="polite"` on the stage counter
- Reduced-motion users get a less-animated experience

**On the tooltip text:** every tooltip should be a *complete* math statement. Not "z1[2]" (just a label) but "z1[2] = W1[0][2]·x[0] + W1[1][2]·x[1] + b1[2] = (-0.32)·(1.20) + (0.85)·(-0.80) + 0.00 = -1.064". Show the formula, then the substitution, then the result. This is the pedagogical payoff — the widget makes the math from section 4 concrete by computing it for actual numbers.

**On testing:** the most failure-prone path is the gradient correctness. After implementing, manually verify that `dz2 = p - y_onehot` matches what the tooltip displays. If they disagree, the math layer (`network-state.ts`) has a bug — fix there, not in the view layer.

**On the "subtle stuff to get right":** the four hidden nodes show different values at different stages (z1, then a1, then da1, then dz1). The transition between these should feel like the *same neuron* changing state, not different neurons appearing. Use CSS transitions on the text content (or React's key prop to control re-renders) to make the value-swap feel smooth, not jarring.

This is the marquee widget for Chapter 1. The animation, the math tooltips, and the preset switcher together do something static prose can't: they let the reader watch backprop happen on a specific concrete example. That's the educational gravity that makes interactive textbooks worth building. Get this one right.
