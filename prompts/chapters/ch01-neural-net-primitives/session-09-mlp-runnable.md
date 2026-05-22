# Session 09 — Training curves widget (SGD vs Momentum vs Adam)

> Builds the second Chapter 1 widget: a side-by-side training visualization. Left panel = loss curves over 500 training steps for three optimizers (SGD, SGD with momentum, Adam). Right panel = decision boundary plot for the selected optimizer, animating as training progresses. Scrub the time slider to see how each optimizer carves up the 2D plane into 4 class regions at different rates. Replaces the second `<WidgetFrame>` placeholder in section 5 of `index.mdx`.

---

## Read first (in this order)

1. **`research/ch01-neural-net-primitives/research.md`** — for the Adam math (Kingma & Ba 2014) and the reference MLP implementation; this widget runs the MLP in JS three times in parallel
2. **`prompts/chapters/ch01-neural-net-primitives/session-07-page-structure.md`** — for the section-5 widget placeholder this session fills, and the toy 2D quadrant classification task
3. **`prompts/chapters/ch01-neural-net-primitives/session-08-backprop-visualizer.md`** — for the widget conventions established there (CSS module, `client:visible`, `cancelledRef`, scoped styles, network-state module)
4. **`context/DESIGN_SYSTEM.md`** — for chart styling, palette use, and accessibility floors

If the network state shape diverges from what `session-08`'s `network-state.ts` uses, that's expected — this widget has different needs (batch training over 500 steps, not single-example animation). Don't try to share types between the two widgets unless the type naturally generalizes.

---

## Goal

Replace the second `<WidgetFrame>` placeholder in `src/pages/ch01-neural-net-primitives/index.mdx` (section 5) with a working interactive widget that:

- Computes 500 training steps of an MLP on the toy quadrant-classification task, for each of three optimizers — SGD, SGD with momentum, Adam — at component mount
- Renders a loss-curve chart showing all three optimizers' losses over time
- Renders a decision-boundary plot for one selected optimizer, with the boundary snapshotted at 25 time points (every 20 steps)
- Lets the user scrub through training time with a slider; both charts update
- Has Play / Pause / Reset controls for auto-animation
- Lets the user select which optimizer's decision boundary to show

**End state:** section 5's training-curves widget shows pedagogically clearly that Adam converges fastest in early training but SGD with momentum can catch up; the decision boundaries make visual that the network is genuinely learning the quadrant rule.

---

## Inputs

State of the repo after session 08:

- `src/components/widgets/ch01/BackpropVisualizer.tsx` exists and works
- `src/components/widgets/ch01/network-state.ts` exists with single-example forward/backward code
- `src/components/widgets/index.ts` exists with `BackpropVisualizer` exported
- Section 4 of Ch 1 has the working backprop widget
- Sections 5 and 8 of Ch 1 still have placeholder `<WidgetFrame>` interiors
- Ch 1's `status` is `'draft'` in `chapters.ts`

---

## Deliverables

1. **Create** `src/components/widgets/ch01/TrainingCurves.tsx` — the React widget
2. **Create** `src/components/widgets/ch01/TrainingCurves.module.css` — scoped styles
3. **Create** `src/components/widgets/ch01/training-data.ts` — batch forward/backward, all three optimizers, decision-boundary precomputation
4. **Update** `src/components/widgets/index.ts` — add `TrainingCurves` export
5. **Update** `src/pages/ch01-neural-net-primitives/index.mdx` — replace section-5's placeholder `<WidgetFrame>` interior with `<TrainingCurves client:visible />`

**Do NOT modify** any file under `src/styles/`, `src/components/content/`, `src/components/nav/`, `src/components/code/`, `src/lib/`, or any layout file. Do NOT touch session 08's `BackpropVisualizer` files. Do NOT touch the section 8 placeholder (session 10 owns that).

---

## Detailed spec

### Architecture overview

```
src/components/widgets/ch01/
├── BackpropVisualizer.{tsx,module.css}       (session 08, unchanged)
├── network-state.ts                          (session 08, unchanged)
├── TrainingCurves.tsx                        ← new
├── TrainingCurves.module.css                 ← new
└── training-data.ts                          ← new
```

`training-data.ts` is pure data — generates the dataset, runs the three optimizers, samples the decision boundaries. No React, no DOM. `TrainingCurves.tsx` consumes its output and renders the charts.

### 1. `training-data.ts` — the math layer

```ts
// src/components/widgets/ch01/training-data.ts

import { seededPRNG, randNormal } from '@lib/seeded-prng';

const D_IN = 2;
const D_H = 16;
const D_OUT = 4;
const N_TRAIN = 1000;
const BATCH_SIZE = 64;
const TOTAL_STEPS = 500;
const SNAPSHOT_EVERY = 20;         // 25 snapshots total (steps 0, 20, 40, ..., 480)
const GRID_RESOLUTION = 30;        // 30x30 decision boundary grid
const GRID_RANGE = 3;              // domain: [-3, 3] x [-3, 3]

export type OptimizerName = 'sgd' | 'momentum' | 'adam';

export interface TrainingRun {
  losses: number[];           // length 500
  accuracies: number[];       // length 500
  snapshots: GridSnapshot[];  // length 25
}

export interface GridSnapshot {
  step: number;
  predictions: Uint8Array;    // length GRID_RESOLUTION^2 = 900; values 0..3
}

export interface TrainingData {
  // Shared across all runs
  x_data: number[][];         // [N, 2]
  y_data: Uint8Array;         // [N], values 0..3
  // Per-optimizer
  runs: Record<OptimizerName, TrainingRun>;
  // Decision boundary grid coordinates (same for all)
  grid_x: number[];           // length GRID_RESOLUTION
  grid_y: number[];           // length GRID_RESOLUTION
}

// === Dataset generation ===

function generateData(): { x: number[][]; y: Uint8Array } {
  const rng = seededPRNG(7);
  const x: number[][] = [];
  const y = new Uint8Array(N_TRAIN);
  for (let i = 0; i < N_TRAIN; i++) {
    const xi = [randNormal(rng), randNormal(rng)];
    x.push(xi);
    // Quadrant rule: 0 (bottom-left), 1 (bottom-right), 2 (top-left), 3 (top-right)
    y[i] = (xi[0]! > 0 ? 1 : 0) + (xi[1]! > 0 ? 2 : 0);
  }
  return { x, y };
}

// === Math primitives (vectorized for batches) ===

function relu(x: number[][]): number[][] {
  return x.map(row => row.map(v => Math.max(0, v)));
}

function softmax2d(x: number[][]): number[][] {
  return x.map(row => {
    const m = Math.max(...row);
    const exps = row.map(v => Math.exp(v - m));
    const s = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / s);
  });
}

function matmul(a: number[][], b: number[][]): number[][] {
  const m = a.length, k = a[0]!.length, n = b[0]!.length;
  const out: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let p = 0; p < k; p++) s += a[i]![p]! * b[p]![j]!;
      out[i]![j] = s;
    }
  }
  return out;
}

function addBias(z: number[][], b: number[]): number[][] {
  return z.map(row => row.map((v, j) => v + b[j]!));
}

// === MLP forward + backward (batch) ===

interface Weights { W1: number[][]; b1: number[]; W2: number[][]; b2: number[]; }

function initWeights(seed: number): Weights {
  const rng = seededPRNG(seed);
  const std1 = Math.sqrt(2 / D_IN);
  const std2 = Math.sqrt(2 / D_H);
  return {
    W1: Array.from({ length: D_IN },  () => Array.from({ length: D_H },   () => randNormal(rng) * std1)),
    b1: new Array(D_H).fill(0),
    W2: Array.from({ length: D_H },   () => Array.from({ length: D_OUT }, () => randNormal(rng) * std2)),
    b2: new Array(D_OUT).fill(0),
  };
}

function forward(x: number[][], w: Weights) {
  const z1 = addBias(matmul(x, w.W1), w.b1);
  const a1 = relu(z1);
  const z2 = addBias(matmul(a1, w.W2), w.b2);
  const p = softmax2d(z2);
  return { z1, a1, z2, p };
}

function backward(x: number[][], y: Uint8Array, w: Weights, fwd: ReturnType<typeof forward>) {
  const B = x.length;
  const { z1, a1, p } = fwd;

  // dz2 = (p - y_onehot) / B
  const dz2: number[][] = p.map((row, i) => row.map((pj, j) => (pj - (y[i] === j ? 1 : 0)) / B));

  // dW2 = a1^T @ dz2  (shape D_H x D_OUT)
  const dW2: number[][] = Array.from({ length: D_H }, () => new Array(D_OUT).fill(0));
  for (let h = 0; h < D_H; h++) {
    for (let o = 0; o < D_OUT; o++) {
      let s = 0;
      for (let b = 0; b < B; b++) s += a1[b]![h]! * dz2[b]![o]!;
      dW2[h]![o] = s;
    }
  }
  // db2 = sum_b dz2_b
  const db2 = new Array(D_OUT).fill(0);
  for (let b = 0; b < B; b++) for (let o = 0; o < D_OUT; o++) db2[o] += dz2[b]![o]!;

  // da1 = dz2 @ W2^T  (shape B x D_H)
  const da1: number[][] = Array.from({ length: B }, () => new Array(D_H).fill(0));
  for (let b = 0; b < B; b++) {
    for (let h = 0; h < D_H; h++) {
      let s = 0;
      for (let o = 0; o < D_OUT; o++) s += dz2[b]![o]! * w.W2[h]![o]!;
      da1[b]![h] = s;
    }
  }

  // dz1 = da1 * relu_grad(z1)
  const dz1: number[][] = da1.map((row, b) => row.map((g, h) => g * (z1[b]![h]! > 0 ? 1 : 0)));

  // dW1 = x^T @ dz1
  const dW1: number[][] = Array.from({ length: D_IN }, () => new Array(D_H).fill(0));
  for (let i = 0; i < D_IN; i++) {
    for (let h = 0; h < D_H; h++) {
      let s = 0;
      for (let b = 0; b < B; b++) s += x[b]![i]! * dz1[b]![h]!;
      dW1[i]![h] = s;
    }
  }
  const db1 = new Array(D_H).fill(0);
  for (let b = 0; b < B; b++) for (let h = 0; h < D_H; h++) db1[h] += dz1[b]![h]!;

  return { dW1, db1, dW2, db2 };
}

// === Optimizers ===

interface OptimizerState {
  // SGD has no state
  // Momentum: velocity per parameter
  v_W1?: number[][]; v_b1?: number[]; v_W2?: number[][]; v_b2?: number[];
  // Adam: first and second moments per parameter, plus step count
  m_W1?: number[][]; m_b1?: number[]; m_W2?: number[][]; m_b2?: number[];
  s_W1?: number[][]; s_b1?: number[]; s_W2?: number[][]; s_b2?: number[];
  t?: number;
}

// Apply a generic per-parameter update (SGD/momentum/adam all reduce to this once moments computed)
// See the three update functions below; each handles its own bookkeeping.

function sgdStep(w: Weights, g: ReturnType<typeof backward>, lr: number) {
  for (let i = 0; i < D_IN; i++) for (let h = 0; h < D_H; h++) w.W1[i]![h]! -= lr * g.dW1[i]![h]!;
  for (let h = 0; h < D_H; h++) w.b1[h]! -= lr * g.db1[h]!;
  for (let h = 0; h < D_H; h++) for (let o = 0; o < D_OUT; o++) w.W2[h]![o]! -= lr * g.dW2[h]![o]!;
  for (let o = 0; o < D_OUT; o++) w.b2[o]! -= lr * g.db2[o]!;
}

function momentumStep(w: Weights, g: ReturnType<typeof backward>, state: OptimizerState, lr: number, mu: number) {
  // Lazy-initialize velocity arrays on first call
  if (!state.v_W1) {
    state.v_W1 = Array.from({ length: D_IN }, () => new Array(D_H).fill(0));
    state.v_b1 = new Array(D_H).fill(0);
    state.v_W2 = Array.from({ length: D_H }, () => new Array(D_OUT).fill(0));
    state.v_b2 = new Array(D_OUT).fill(0);
  }
  for (let i = 0; i < D_IN; i++) for (let h = 0; h < D_H; h++) {
    state.v_W1[i]![h] = mu * state.v_W1[i]![h]! + g.dW1[i]![h]!;
    w.W1[i]![h]! -= lr * state.v_W1[i]![h]!;
  }
  for (let h = 0; h < D_H; h++) {
    state.v_b1![h] = mu * state.v_b1![h]! + g.db1[h]!;
    w.b1[h]! -= lr * state.v_b1![h]!;
  }
  for (let h = 0; h < D_H; h++) for (let o = 0; o < D_OUT; o++) {
    state.v_W2![h]![o] = mu * state.v_W2![h]![o]! + g.dW2[h]![o]!;
    w.W2[h]![o]! -= lr * state.v_W2![h]![o]!;
  }
  for (let o = 0; o < D_OUT; o++) {
    state.v_b2![o] = mu * state.v_b2![o]! + g.db2[o]!;
    w.b2[o]! -= lr * state.v_b2![o]!;
  }
}

function adamStep(w: Weights, g: ReturnType<typeof backward>, state: OptimizerState,
                  lr: number, b1: number, b2: number, eps: number) {
  if (state.t === undefined) {
    state.t = 0;
    state.m_W1 = Array.from({ length: D_IN }, () => new Array(D_H).fill(0));
    state.s_W1 = Array.from({ length: D_IN }, () => new Array(D_H).fill(0));
    state.m_b1 = new Array(D_H).fill(0);
    state.s_b1 = new Array(D_H).fill(0);
    state.m_W2 = Array.from({ length: D_H }, () => new Array(D_OUT).fill(0));
    state.s_W2 = Array.from({ length: D_H }, () => new Array(D_OUT).fill(0));
    state.m_b2 = new Array(D_OUT).fill(0);
    state.s_b2 = new Array(D_OUT).fill(0);
  }
  state.t++;
  const bc1 = 1 - Math.pow(b1, state.t);
  const bc2 = 1 - Math.pow(b2, state.t);

  const apply = (param: number, grad: number, m: number, s: number): [number, number, number] => {
    const m_new = b1 * m + (1 - b1) * grad;
    const s_new = b2 * s + (1 - b2) * grad * grad;
    const m_hat = m_new / bc1;
    const s_hat = s_new / bc2;
    return [param - lr * m_hat / (Math.sqrt(s_hat) + eps), m_new, s_new];
  };

  for (let i = 0; i < D_IN; i++) for (let h = 0; h < D_H; h++) {
    const [p, m, s] = apply(w.W1[i]![h]!, g.dW1[i]![h]!, state.m_W1![i]![h]!, state.s_W1![i]![h]!);
    w.W1[i]![h] = p; state.m_W1![i]![h] = m; state.s_W1![i]![h] = s;
  }
  for (let h = 0; h < D_H; h++) {
    const [p, m, s] = apply(w.b1[h]!, g.db1[h]!, state.m_b1![h]!, state.s_b1![h]!);
    w.b1[h] = p; state.m_b1![h] = m; state.s_b1![h] = s;
  }
  for (let h = 0; h < D_H; h++) for (let o = 0; o < D_OUT; o++) {
    const [p, m, s] = apply(w.W2[h]![o]!, g.dW2[h]![o]!, state.m_W2![h]![o]!, state.s_W2![h]![o]!);
    w.W2[h]![o] = p; state.m_W2![h]![o] = m; state.s_W2![h]![o] = s;
  }
  for (let o = 0; o < D_OUT; o++) {
    const [p, m, s] = apply(w.b2[o]!, g.db2[o]!, state.m_b2![o]!, state.s_b2![o]!);
    w.b2[o] = p; state.m_b2![o] = m; state.s_b2![o] = s;
  }
}

// === Decision boundary computation ===

function makeGrid(): { grid_x: number[]; grid_y: number[]; grid_points: number[][] } {
  const grid_x = Array.from({ length: GRID_RESOLUTION }, (_, i) => -GRID_RANGE + (i / (GRID_RESOLUTION - 1)) * 2 * GRID_RANGE);
  const grid_y = [...grid_x];
  const grid_points: number[][] = [];
  for (let gy of grid_y) for (let gx of grid_x) grid_points.push([gx, gy]);
  return { grid_x, grid_y, grid_points };
}

function predictGrid(w: Weights, grid_points: number[][]): Uint8Array {
  const out = new Uint8Array(grid_points.length);
  const { p } = forward(grid_points, w);
  for (let i = 0; i < p.length; i++) {
    let best = 0, bestVal = p[i]![0]!;
    for (let j = 1; j < D_OUT; j++) if (p[i]![j]! > bestVal) { best = j; bestVal = p[i]![j]!; }
    out[i] = best;
  }
  return out;
}

// === Main entry point — runs all three optimizers and assembles the result ===

export function computeTrainingData(): TrainingData {
  const { x: x_data, y: y_data } = generateData();
  const { grid_x, grid_y, grid_points } = makeGrid();

  const optimizerConfigs = {
    sgd:      { lr: 0.05 },
    momentum: { lr: 0.05, mu: 0.9 },
    adam:     { lr: 0.01, b1: 0.9, b2: 0.999, eps: 1e-8 },
  };

  const runs: Record<OptimizerName, TrainingRun> = { sgd: emptyRun(), momentum: emptyRun(), adam: emptyRun() };

  for (const opt of ['sgd', 'momentum', 'adam'] as OptimizerName[]) {
    const w = initWeights(42);
    const state: OptimizerState = {};
    const rng = seededPRNG(123);   // Same data ordering across optimizers

    for (let step = 0; step < TOTAL_STEPS; step++) {
      // Mini-batch indexing
      const batch_x: number[][] = [];
      const batch_y = new Uint8Array(BATCH_SIZE);
      for (let b = 0; b < BATCH_SIZE; b++) {
        const idx = Math.floor(rng() * N_TRAIN);
        batch_x.push(x_data[idx]!);
        batch_y[b] = y_data[idx]!;
      }

      const fwd = forward(batch_x, w);
      const grads = backward(batch_x, batch_y, w, fwd);

      // Loss + accuracy on this batch
      let loss = 0, correct = 0;
      for (let i = 0; i < BATCH_SIZE; i++) {
        loss -= Math.log(Math.max(fwd.p[i]![batch_y[i]!]!, 1e-12));
        let pred = 0, pmax = fwd.p[i]![0]!;
        for (let j = 1; j < D_OUT; j++) if (fwd.p[i]![j]! > pmax) { pred = j; pmax = fwd.p[i]![j]!; }
        if (pred === batch_y[i]) correct++;
      }
      runs[opt].losses.push(loss / BATCH_SIZE);
      runs[opt].accuracies.push(correct / BATCH_SIZE);

      // Snapshot decision boundary every SNAPSHOT_EVERY steps
      if (step % SNAPSHOT_EVERY === 0) {
        runs[opt].snapshots.push({ step, predictions: predictGrid(w, grid_points) });
      }

      // Optimizer step
      const cfg = optimizerConfigs[opt];
      if (opt === 'sgd')      sgdStep(w, grads, cfg.lr);
      if (opt === 'momentum') momentumStep(w, grads, state, cfg.lr, (cfg as any).mu);
      if (opt === 'adam')     adamStep(w, grads, state, cfg.lr, (cfg as any).b1, (cfg as any).b2, (cfg as any).eps);
    }
  }

  return { x_data, y_data, runs, grid_x, grid_y };
}

function emptyRun(): TrainingRun { return { losses: [], accuracies: [], snapshots: [] }; }
```

**Notes:**
- All three optimizers start from the same `initWeights(42)` and consume the same batches (same `seededPRNG(123)` for batch sampling). Comparison is fair.
- Loss is per-example mean over the batch (consistent with the chapter's section 3 convention).
- Decision-boundary grid is `30×30 = 900` points, sampled at 25 time points × 3 optimizers = 67,500 forward passes. With a 16-unit hidden layer that's ~600ms total at component mount on a typical laptop.
- Class colors: 0 = cyan, 1 = amber, 2 = rose, 3 = emerald. These map to the four CSS variables defined in `variables.css`. (Not all four are pure brand colors, but they're the four semantic accents available; the contrast is what matters.)
- The optimizer hyperparameters were chosen so the three runs are visibly distinct. SGD lr=0.05 converges slowly; momentum lr=0.05 + mu=0.9 catches up after ~100 steps; Adam lr=0.01 + standard betas converges fastest but plateaus similarly. If you change `initWeights` seed, the relative ordering should hold; if it doesn't, retune.

### 2. Visual layout

Two-panel widget, side by side on desktop, stacked on mobile.

```
Desktop (≥ 768px):
┌─────────────────────────────────────────────────────────────────────┐
│ [SGD] [Momentum] [Adam]     ← optimizer toggle for decision plot    │
│                                                                     │
│ ┌─────────────────────────┐  ┌─────────────────────────────────┐   │
│ │                         │  │                                 │   │
│ │      Loss curves        │  │     Decision boundary           │   │
│ │      (3 lines)          │  │     (background = predicted     │   │
│ │                         │  │      class regions; dots =      │   │
│ │  ──── SGD                │  │      training data colored      │   │
│ │  ──── Momentum           │  │      by true class)             │   │
│ │  ──── Adam               │  │                                 │   │
│ │                         │  │                                 │   │
│ │  Step ────────●────────  │  │                                 │   │
│ └─────────────────────────┘  └─────────────────────────────────┘   │
│                                                                     │
│ [◁] [▶ Play] [▷]   Step 240 / 500    Loss: SGD 0.94 Mom 0.42 Adam 0.31│
└─────────────────────────────────────────────────────────────────────┘

Mobile (< 768px):
┌─────────────────────────┐
│ Loss curves             │
└─────────────────────────┘
┌─────────────────────────┐
│ [SGD][Momentum][Adam]   │
│ Decision boundary       │
└─────────────────────────┘
[◁][▶][▷] Step 240 / 500
```

**Loss-curve panel:**
- SVG, viewBox `0 0 400 280`
- Three line plots over the 500-step horizontal axis
- Y-axis: log-scale (better separates fast and slow optimizers); range auto-fit to the data
- Three colors: SGD = `var(--text-secondary)`, Momentum = `var(--amber-500)`, Adam = `var(--cyan-500)`
- A vertical "scrubber" line shows the current step
- Hover for tooltip with step + loss values

**Decision boundary panel:**
- SVG, viewBox `0 0 400 400`
- Background: 30×30 grid of colored rects representing the model's predicted class at each grid point
- Foreground: scatter of training data points (~150 of them — full N=1000 would be too dense), colored by true class
- Axes labeled `x[0]` and `x[1]` along the bottom and left edges
- Updates instantly when the current step crosses a snapshot boundary (nearest-snapshot semantics — boundary "snaps" every 20 steps)

**Controls:**
- Step slider (range 0–499); thumb shows current step
- Play / Pause button: auto-advances the step at ~20 steps per second (= 25 seconds to play through 500 steps)
- Speed presets: 0.5×, 1×, 2× — adjusts the auto-advance rate
- Reset: back to step 0

### 3. `TrainingCurves.tsx`

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type OptimizerName,
  type TrainingData,
  computeTrainingData,
} from './training-data';
import styles from './TrainingCurves.module.css';

const PLAY_FPS = 20;            // 20 steps/sec at 1×
const SPEED_PRESETS = [0.5, 1, 2] as const;
const OPTIMIZERS: OptimizerName[] = ['sgd', 'momentum', 'adam'];
const OPTIMIZER_LABELS: Record<OptimizerName, string> = {
  sgd: 'SGD',
  momentum: 'Momentum',
  adam: 'Adam',
};
const OPTIMIZER_COLORS: Record<OptimizerName, string> = {
  sgd:      'var(--text-secondary)',
  momentum: 'var(--amber-500)',
  adam:     'var(--cyan-500)',
};

export default function TrainingCurves() {
  const [data, setData] = useState<TrainingData | null>(null);
  const [step, setStep] = useState(0);
  const [activeOpt, setActiveOpt] = useState<OptimizerName>('adam');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<typeof SPEED_PRESETS[number]>(1);

  const cancelledRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  // Compute training data on mount — deferred via setTimeout so the UI can render a loading state first
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cancelledRef.current) return;
      const computed = computeTrainingData();
      if (!cancelledRef.current) setData(computed);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !data) return;
    const intervalMs = 1000 / (PLAY_FPS * speed);
    const tick = () => {
      if (cancelledRef.current) return;
      setStep(s => {
        if (s >= 499) { setIsPlaying(false); return s; }
        return s + 1;
      });
      animationRef.current = window.setTimeout(tick, intervalMs);
    };
    animationRef.current = window.setTimeout(tick, intervalMs);
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [isPlaying, speed, data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  if (!data) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>
          <div className={styles.loadingBar} />
          Running 1500 training steps in JavaScript…
        </div>
      </div>
    );
  }

  // Find nearest snapshot for the decision boundary
  const snapshots = data.runs[activeOpt].snapshots;
  const snapshot = snapshots.reduce((best, curr) =>
    Math.abs(curr.step - step) < Math.abs(best.step - step) ? curr : best, snapshots[0]!
  );

  return (
    <div className={styles.widget}>
      <div className={styles.optBar}>
        <span className={styles.optLabel}>Decision boundary for:</span>
        {OPTIMIZERS.map(o => (
          <button
            key={o}
            onClick={() => setActiveOpt(o)}
            className={`${styles.optButton} ${o === activeOpt ? styles.optActive : ''}`}
            style={{ '--swatch': OPTIMIZER_COLORS[o] } as React.CSSProperties}
            aria-pressed={o === activeOpt}
          >
            <span className={styles.optSwatch} />
            {OPTIMIZER_LABELS[o]}
          </button>
        ))}
      </div>

      <div className={styles.panels}>
        <LossPanel data={data} currentStep={step} />
        <DecisionPanel data={data} snapshot={snapshot} activeOpt={activeOpt} />
      </div>

      <div className={styles.controls}>
        <button onClick={() => { setStep(0); setIsPlaying(false); }} className={styles.controlSecondary} aria-label="Reset to step 0">
          Reset
        </button>
        <button onClick={() => setIsPlaying(p => !p)} className={styles.controlPrimary} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? 'Pause' : (step >= 499 ? 'Replay' : 'Play')}
        </button>
        <input
          type="range"
          min={0}
          max={499}
          value={step}
          onChange={e => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Training step"
        />
        <span className={styles.stepLabel} aria-live="polite">
          Step {step.toString().padStart(3, ' ')} / 499
        </span>
      </div>

      <div className={styles.speedBar}>
        <span className={styles.speedLabel}>Speed:</span>
        {SPEED_PRESETS.map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`${styles.speedButton} ${s === speed ? styles.speedActive : ''}`}
            aria-pressed={s === speed}
          >
            {s}×
          </button>
        ))}
        <div className={styles.legend}>
          {OPTIMIZERS.map(o => (
            <span key={o} className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: OPTIMIZER_COLORS[o] }} />
              {OPTIMIZER_LABELS[o]} {data.runs[o].losses[step]!.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Sub-components ===

function LossPanel({ data, currentStep }: { data: TrainingData; currentStep: number }) {
  // SVG with three loss curves and a scrubber line at currentStep.
  // Use log-scale for y-axis (better separates the three runs).
  //
  // Layout: viewBox "0 0 400 280", with ~40px margin on left for y-axis labels,
  // ~30px margin on bottom for x-axis labels.
  //
  // For each optimizer:
  //   1. Build a polyline string from (stepIdx, log(loss[stepIdx])) pairs
  //   2. Render as <polyline> with the optimizer's color
  //
  // Scrubber: a vertical <line> at x corresponding to currentStep.

  return <svg viewBox="0 0 400 280" className={styles.svg}>{/* ... */}</svg>;
}

function DecisionPanel({ data, snapshot, activeOpt }: {
  data: TrainingData;
  snapshot: { step: number; predictions: Uint8Array };
  activeOpt: OptimizerName;
}) {
  // Render:
  //   1. 30x30 background grid — each cell colored by snapshot.predictions[i]
  //      (4 colors for 4 classes; map to CSS vars: cyan-500/8 alpha, amber-500/8 etc)
  //   2. Foreground scatter of training data (subsample to ~150 points for visual clarity)
  //   3. Axis labels
  //
  // Use the same color scheme as the loss curve for cross-panel consistency.

  return <svg viewBox="0 0 400 400" className={styles.svg}>{/* ... */}</svg>;
}
```

### 4. `TrainingCurves.module.css`

Modeled after `BackpropVisualizer.module.css` (session 08). Reuses the same control button styles and color vars. Specific additions:

- `.loading` container with a moving cyan bar (~3s during the initial compute)
- `.scrubber` is `<input type="range">` styled to match the design (cyan thumb, gray track)
- `.legend` items have small color swatches matching the loss-curve colors
- `.optButton`'s color swatch uses CSS `var(--swatch)` set inline per button

Key styling beats:
- Panels grow to fill the widget's `var(--container-wide)` width
- Mobile: `grid-template-columns: 1fr` (stacked); desktop: `1fr 1fr` (side-by-side)
- The `<input type="range">` needs `-webkit-appearance: none` reset + custom track and thumb styling for cyan accents

```css
/* Excerpts — full file follows the patterns from BackpropVisualizer.module.css */

.widget {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
}

.loading {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-tertiary);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
}

.loadingBar {
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg, var(--cyan-500), var(--cyan-300), var(--cyan-500));
  background-size: 200% 100%;
  animation: loading-shimmer 2s linear infinite;
}

@keyframes loading-shimmer {
  to { background-position: -200% 0; }
}

.panels {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 768px) {
  .panels { grid-template-columns: 1fr 1fr; }
}

/* Range slider — webkit + firefox styling */
.scrubber {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-default);
  border-radius: 2px;
  outline: none;
}
.scrubber::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--cyan-500);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--bg-primary);
}
.scrubber::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--cyan-500);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--bg-primary);
}

/* Optimizer toggle swatch */
.optButton {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  /* ... reuse .controlSecondary styles ... */
}
.optSwatch {
  width: 10px;
  height: 10px;
  background: var(--swatch);
  border-radius: 50%;
}

/* SVG */
.svg {
  display: block;
  width: 100%;
  height: auto;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

@media (prefers-reduced-motion: reduce) {
  .loadingBar { animation: none; background: var(--cyan-500); }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
// Future:
// export { default as AutogradGraph } from './ch01/AutogradGraph';
```

### 6. Update `src/pages/ch01-neural-net-primitives/index.mdx`

Find the section-5 `<WidgetFrame title="Training curves — SGD vs Momentum vs Adam">` placeholder. Replace its `<div>` interior with the component:

```mdx
import { BackpropVisualizer, TrainingCurves } from '@components/widgets';

...

<WidgetFrame title="Training curves — SGD vs Momentum vs Adam" caption="Three optimizers, same MLP, same data. Scrub the time slider to watch the decision boundary form; observe the loss curves to see why Adam reaches lower training loss faster.">
  <TrainingCurves client:visible />
</WidgetFrame>
```

The `import` is updated to include `TrainingCurves` in the existing import line (which was added in session 08 for `BackpropVisualizer`).

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly; no TypeScript errors.
2. **Section 5 of Ch 1** renders with the working widget. The section 8 widget placeholder still shows its session-10 stub.
3. **Initial load:** the widget renders a loading state ("Running 1500 training steps in JavaScript…") with a shimmer bar. Within ~1 second, the panels appear.
4. **Loss curves panel:** three lines — SGD (gray), Momentum (amber), Adam (cyan). All three start near `log(4) ≈ 1.4` and decrease. Adam descends fastest in the first ~100 steps. By step 400-500, Momentum and Adam are similar; SGD lags.
5. **Decision boundary panel:** initially shows roughly-random colored regions; by step 100-200 the four quadrants emerge as distinct color blocks; by step 500 the boundaries align with the axes (the true decision rule).
6. **Time scrubber:** dragging it updates both panels instantly (no playback gap).
7. **Play button:** auto-advances at ~20 steps/second at 1× speed. Speed presets 0.5× and 2× adjust the rate.
8. **Optimizer toggle:** clicking SGD/Momentum/Adam swaps the decision boundary panel to that optimizer's snapshots.
9. **Reset:** returns to step 0.
10. **Mobile (≤ 640px):** panels stack vertically; controls remain functional; scrubber is tappable; legend wraps neatly.
11. **`prefers-reduced-motion: reduce`:** the loading shimmer is static cyan; transitions in the decision boundary still happen (snapshots are discrete; no animation to disable).
12. **Bundle size:** the widget's chunk should be under 40 KB gzipped (no chart libraries; pure SVG).
13. **`npm run typecheck`** passes.
14. **`npm run build`** completes; production renders correctly.

---

## Out of scope

- ❌ **Do not add AdamW or Adam-without-bias-correction to the optimizer comparison.** Three optimizers is enough; more clutters the chart.
- ❌ **Do not let the user edit hyperparameters (learning rate, betas).** Adds complexity for marginal pedagogical value.
- ❌ **Do not use Recharts or any chart library.** Pure SVG. The two charts here are simple line / heatmap; libraries add weight.
- ❌ **Do not implement keyboard navigation for the time scrubber.** The `<input type="range">` natively supports arrow keys; that's enough.
- ❌ **Do not modify `BackpropVisualizer` or `network-state.ts`.** Session 08's files are sealed.
- ❌ **Do not implement the section 8 widget.** Session 10 owns that.
- ❌ **Do not change `chapters.ts` status.** Stays `'draft'` until session 10.
- ❌ **Do not modify the section 5 prose, code block, or `<RunnableCode>`.** Only swap the `<WidgetFrame>` interior.

---

## Wire-up

After all acceptance criteria pass:

```bash
git add src/components/widgets/ch01/TrainingCurves.tsx src/components/widgets/ch01/TrainingCurves.module.css src/components/widgets/ch01/training-data.ts src/components/widgets/index.ts src/pages/ch01-neural-net-primitives/index.mdx
git commit -m "session 09: training curves widget — SGD vs Momentum vs Adam on toy task"
git push origin main
```

Visit production. Verify the widget works in chrome + firefox + safari (the `<input type="range">` styling is the most cross-browser-finicky bit). On mobile, verify the scrubber is large enough to tap accurately.

The next session (`session-10-autograd-and-exercises.md`) assumes:
- This widget exists and works
- Section 5's placeholder is filled; section 8's is still stubbed
- Ch 1's status is still `'draft'`; session 10 flips to `'published'` after its widget lands and exercises are added

---

## Notes for the session author

**On compute timing:** the 67,500-forward-pass decision-boundary computation is the slowest part. Profile it: if it's significantly over 1 second on a typical laptop, reduce `GRID_RESOLUTION` from 30 to 25 (saves ~30% of the work) or `SNAPSHOT_EVERY` from 20 to 25 (saves 20%). Don't over-optimize before measuring.

**On the y-axis log scale for loss:** linear scale makes Adam's fast initial descent look like a single vertical line and then flat. Log scale shows all three optimizers' progress proportionally. Implement as: plot `log10(loss + 1e-12)` instead of `loss` directly; label the y-axis ticks as `10^k` values (or just label "loss (log)" without specific tick values).

**On the scatter overlay:** subsampling the 1000 training points to ~150 keeps the decision panel readable. Use `seededPRNG(99)` to pick a deterministic subset so the overlay doesn't shimmer between renders.

**On Class colors:** the four classes use `cyan-500`, `amber-500`, `rose-500`, `emerald-500`. The background-grid colors should be these at ~12% alpha (light enough to read scatter dots on top); the scatter dots use the full-opacity versions.

**On nearest-snapshot semantics:** when the user is at step 137, the decision boundary shows the snapshot from step 140 (nearest of {120, 140}). This produces a small "popping" effect every 20 steps. That's acceptable — the alternative (interpolating two snapshots) is much more complex and the popping is honest about what data we have.

**On accessibility:** the speed buttons and optimizer toggles use `aria-pressed`. The scrubber is a native range input (already accessible). The `aria-live="polite"` on the step label gives screen readers an updating step count without nagging.

**On the failure mode of "all three optimizers look the same":** if your loss curves don't separate visibly, the hyperparameters are wrong. Adam at lr=0.001 may converge slower than expected; SGD at lr=0.05 may diverge. The recommended values (Adam lr=0.01, SGD lr=0.05, Momentum lr=0.05 + mu=0.9) produce visibly distinct curves with the seed-42 weights. If you change anything, retune.

**On the decision-boundary visual judgment:** the regions should look "blocky" at first (random-looking colored noise) and then resolve into four clean quadrants. If they never resolve, the network isn't training — debug `training-data.ts` first. If they resolve immediately, the weights are starting too close to optimal — verify `initWeights` is using `randNormal` not `Math.random`.

This widget exists to make one pedagogical claim concrete: "Adam descends faster in early training, but all three optimizers converge to similar solutions on this simple task." If after building it, the visualization doesn't make that point obvious, the widget has failed even if the code is correct. Pause, look at it as a reader, and adjust until the claim is visually self-evident.
