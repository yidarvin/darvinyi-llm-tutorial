# Session 38 — Optimizer comparison secondary widget

> The secondary Chapter 8 widget — visualizes SGD, Adam, and AdamW navigating a 2D ill-conditioned quadratic loss landscape. Three animated trajectories show: SGD oscillates badly; Adam smooths the path via adaptive scaling; AdamW takes the same smooth path but ends at a different point because decoupled weight decay pulls toward the origin. The visual proof of why AdamW > Adam > SGD for transformers. Replaces the section-4 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch08-building-small-llm/research.md`** — Derivations 2 (Adam) and 3 (AdamW) are the reference; the widget visualizes the mathematical difference
2. **`prompts/chapters/ch08-building-small-llm/session-36-page-structure.md`** — for the section-4 widget placeholder this session fills
3. **`prompts/chapters/ch08-building-small-llm/session-37-loss-curve-widget.md`** — for the widget conventions established by Ch 8's marquee (panel layout, SVG plotting, slider controls)
4. **`prompts/chapters/ch01-neural-net-primitives/session-09-training-curves-widget.md`** — for the line-on-2D-plane rendering pattern (TrainingCurves widget has the closest precedent)

---

## Goal

Replace the `<WidgetFrame title="Optimizer comparison">` placeholder in section 4 with a working interactive widget that:

- Displays a **2D loss landscape** as contour ellipses for an ill-conditioned quadratic: $f(x, y) = 10(x - 3)^2 + (y - 1)^2$
- Minimum at $(3, 1)$, marked with a small "×" symbol
- Starting point: $(-3, 4)$, marked with a small dot
- Three optimizer trajectories animated as they take 100 steps:
  - **SGD** (rose-colored): oscillates in x (large gradient), slow in y (small gradient)
  - **Adam** (amber-colored): smooth, adaptive per-axis scaling
  - **AdamW** (cyan-colored): smooth, but ends pulled toward origin by decoupled weight decay
- Step slider (0-100) to scrub through training
- Play / Pause / Reset controls
- A small stats panel showing each optimizer's current position and loss value
- Toggle checkboxes for each optimizer (show/hide individual trajectories)

**End state:** section 4 of Chapter 8 has a working secondary widget. After 30 seconds of interaction, the reader should be able to articulate: (a) SGD struggles on ill-conditioned landscapes; (b) Adam's adaptive scaling produces smooth trajectories; (c) AdamW's decoupled weight decay shifts the convergence point toward zero (visible because the final AdamW position is *not* exactly at the minimum, but slightly pulled toward the origin).

---

## Inputs

State of the repo after session 37:

- Section 7's marquee widget (`LossCurve`) is wired
- Section 4's widget is still stubbed
- `src/lib/chapters.ts` has Ch 8 as `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch08/OptimizerComparison.tsx` — the React widget
2. **Create** `src/components/widgets/ch08/OptimizerComparison.module.css` — scoped styles
3. **Create** `src/components/widgets/ch08/optimizer-data.ts` — optimizer implementations + precomputed trajectories
4. **Update** `src/components/widgets/index.ts` — add `OptimizerComparison` export
5. **Update** `src/pages/ch08-building-small-llm/index.mdx` — replace section-4's `<WidgetFrame>` interior with `<OptimizerComparison client:visible />`

**Do NOT modify:** any prior chapter widget, the section-7 marquee, or any other file.

---

## Detailed spec

### 1. `optimizer-data.ts` — the data layer

Compute trajectories for all three optimizers at module load. The loss function, gradients, and optimizer math are simple — no need for runtime React-side recomputation.

```ts
// src/components/widgets/ch08/optimizer-data.ts

export const N_STEPS = 100;
export const START = { x: -3.0, y: 4.0 };
export const MINIMUM = { x: 3.0, y: 1.0 };

// Loss function and gradient
// f(x, y) = 10 * (x - 3)^2 + (y - 1)^2
// df/dx = 20 * (x - 3)
// df/dy = 2 * (y - 1)
export function loss(x: number, y: number): number {
  return 10 * (x - MINIMUM.x) ** 2 + (y - MINIMUM.y) ** 2;
}
export function grad(x: number, y: number): { gx: number; gy: number } {
  return {
    gx: 20 * (x - MINIMUM.x),
    gy: 2 * (y - MINIMUM.y),
  };
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  loss: number;
}

// Pure SGD: theta_{t} = theta_{t-1} - alpha * g
function computeSGD(lr: number): TrajectoryPoint[] {
  const traj: TrajectoryPoint[] = [{ x: START.x, y: START.y, loss: loss(START.x, START.y) }];
  let x = START.x, y = START.y;
  for (let t = 1; t <= N_STEPS; t++) {
    const { gx, gy } = grad(x, y);
    x -= lr * gx;
    y -= lr * gy;
    traj.push({ x, y, loss: loss(x, y) });
  }
  return traj;
}

// Adam: with momentum + adaptive scaling, no weight decay
function computeAdam(lr: number, beta1 = 0.9, beta2 = 0.95, eps = 1e-8): TrajectoryPoint[] {
  const traj: TrajectoryPoint[] = [{ x: START.x, y: START.y, loss: loss(START.x, START.y) }];
  let x = START.x, y = START.y;
  let mx = 0, my = 0, vx = 0, vy = 0;
  for (let t = 1; t <= N_STEPS; t++) {
    const { gx, gy } = grad(x, y);
    mx = beta1 * mx + (1 - beta1) * gx;
    my = beta1 * my + (1 - beta1) * gy;
    vx = beta2 * vx + (1 - beta2) * gx * gx;
    vy = beta2 * vy + (1 - beta2) * gy * gy;
    const mxh = mx / (1 - Math.pow(beta1, t));
    const myh = my / (1 - Math.pow(beta1, t));
    const vxh = vx / (1 - Math.pow(beta2, t));
    const vyh = vy / (1 - Math.pow(beta2, t));
    x -= lr * mxh / (Math.sqrt(vxh) + eps);
    y -= lr * myh / (Math.sqrt(vyh) + eps);
    traj.push({ x, y, loss: loss(x, y) });
  }
  return traj;
}

// AdamW: Adam + decoupled weight decay (theta_t = (1 - lr*wd) * theta_{t-1} - lr * adam_step)
function computeAdamW(lr: number, weight_decay = 0.05, beta1 = 0.9, beta2 = 0.95, eps = 1e-8): TrajectoryPoint[] {
  const traj: TrajectoryPoint[] = [{ x: START.x, y: START.y, loss: loss(START.x, START.y) }];
  let x = START.x, y = START.y;
  let mx = 0, my = 0, vx = 0, vy = 0;
  for (let t = 1; t <= N_STEPS; t++) {
    const { gx, gy } = grad(x, y);
    mx = beta1 * mx + (1 - beta1) * gx;
    my = beta1 * my + (1 - beta1) * gy;
    vx = beta2 * vx + (1 - beta2) * gx * gx;
    vy = beta2 * vy + (1 - beta2) * gy * gy;
    const mxh = mx / (1 - Math.pow(beta1, t));
    const myh = my / (1 - Math.pow(beta1, t));
    const vxh = vx / (1 - Math.pow(beta2, t));
    const vyh = vy / (1 - Math.pow(beta2, t));
    // Decoupled weight decay applied as separate multiplicative shrink
    x = (1 - lr * weight_decay) * x - lr * mxh / (Math.sqrt(vxh) + eps);
    y = (1 - lr * weight_decay) * y - lr * myh / (Math.sqrt(vyh) + eps);
    traj.push({ x, y, loss: loss(x, y) });
  }
  return traj;
}

// Precompute all three trajectories
// SGD uses a small LR to avoid divergence; Adam/AdamW use larger LR
export const TRAJ_SGD: TrajectoryPoint[] = computeSGD(0.04);
export const TRAJ_ADAM: TrajectoryPoint[] = computeAdam(0.3);
export const TRAJ_ADAMW: TrajectoryPoint[] = computeAdamW(0.3, 0.05);

export type OptimizerKey = 'sgd' | 'adam' | 'adamw';

export interface OptimizerSpec {
  key: OptimizerKey;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  trajectory: TrajectoryPoint[];
}

export const OPTIMIZERS: OptimizerSpec[] = [
  {
    key: 'sgd',
    label: 'SGD',
    shortLabel: 'SGD',
    description: 'Plain stochastic gradient descent. Same step size in every direction — overshoots in x (steep gradient) and crawls in y (shallow gradient).',
    color: 'var(--rose-400)',
    trajectory: TRAJ_SGD,
  },
  {
    key: 'adam',
    label: 'Adam',
    shortLabel: 'Adam',
    description: 'Adaptive per-parameter learning rates via second-moment estimate. Per-axis scaling means x gets smaller updates and y gets larger ones — smooth trajectory.',
    color: 'var(--amber-400)',
    trajectory: TRAJ_ADAM,
  },
  {
    key: 'adamw',
    label: 'AdamW',
    shortLabel: 'AdamW',
    description: 'Adam plus decoupled weight decay. Same adaptive updates as Adam, but parameters are shrunk toward zero each step. Convergence point sits slightly *toward* the origin, away from the minimum.',
    color: 'var(--cyan-400)',
    trajectory: TRAJ_ADAMW,
  },
];
```

### 2. Visual layout

```
ViewBox: 0 0 800 700

┌────────────────────────────────────────────────────────────────────┐
│  Step: [────●────────────] 25 / 100                                │
│  ▶ Play   ⟲ Reset                                                  │
│  Show: ☑ SGD  ☑ Adam  ☑ AdamW                                     │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  2D loss landscape — f(x, y) = 10(x − 3)² + (y − 1)²     │    │
│  │  Ill-conditioned: x curvature 10×, y curvature 1×.       │    │
│  │                                                          │    │
│  │  y=5 ┤  ●  ←─── start (-3, 4)                            │    │
│  │      │ /                                                  │    │
│  │      │/                                                   │    │
│  │  y=3 ┤   ··                                               │    │
│  │      │ ····                                               │    │
│  │      │··  (Adam path — amber, smooth)                    │    │
│  │  y=1 ┤    · ××              × <- minimum (3, 1)           │    │
│  │      │   /(SGD oscillates — rose, jagged)                 │    │
│  │      │  /                                                 │    │
│  │ y=-1 ┤                                                    │    │
│  │      └──────────────────────────────────────              │    │
│  │     -4    -2     0     2     4    6                       │    │
│  │                       x                                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────┬──────────────────┬──────────────────┐       │
│  │ SGD              │ Adam             │ AdamW            │       │
│  │ pos: (-1.2, 2.8) │ pos: (1.4, 1.6)  │ pos: (1.2, 1.5)  │       │
│  │ loss: 30.6       │ loss: 26.0       │ loss: 32.7       │       │
│  └──────────────────┴──────────────────┴──────────────────┘       │
│                                                                    │
│  Description (current optimizer focus): Adam — adaptive            │
│  per-parameter learning rates via second-moment estimate...        │
└────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Step slider → all three trajectories truncate to that step; positions/losses update
- Play → animate from step 0 to 100 over ~10 seconds
- Reset → return to step 0
- Toggle checkboxes → show/hide individual trajectories
- At step 100 (final):
  - SGD: still oscillating, far from minimum
  - Adam: converges very close to (3, 1)
  - AdamW: converges to ~(2.7, 0.9) — visibly biased toward origin compared to Adam

### 3. `OptimizerComparison.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import {
  N_STEPS, START, MINIMUM, OPTIMIZERS,
  type OptimizerKey, type TrajectoryPoint,
} from './optimizer-data';
import styles from './OptimizerComparison.module.css';

const PLAY_STEP_PER_FRAME = 1;
const FRAME_INTERVAL_MS = 80;   // ~12.5 fps → ~8 sec for 100 steps

const DEFAULT_VISIBLE: Record<OptimizerKey, boolean> = { sgd: true, adam: true, adamw: true };

export default function OptimizerComparison() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visible, setVisible] = useState<Record<OptimizerKey, boolean>>(DEFAULT_VISIBLE);
  const [focusedOpt, setFocusedOpt] = useState<OptimizerKey>('adamw');
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    if (step >= N_STEPS) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStep(s => Math.min(s + PLAY_STEP_PER_FRAME, N_STEPS));
    }, FRAME_INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, step]);

  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function toggleVisible(key: OptimizerKey) {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const focused = OPTIMIZERS.find(o => o.key === focusedOpt)!;

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controls}>
        <button
          onClick={() => step >= N_STEPS ? (setStep(0), setIsPlaying(true)) : setIsPlaying(p => !p)}
          className={styles.controlPrimary}
        >
          {isPlaying ? 'Pause' : step >= N_STEPS ? 'Replay' : 'Play'}
        </button>
        <button onClick={() => { setStep(0); setIsPlaying(false); }} className={styles.controlSecondary}>
          Reset
        </button>
        <input
          type="range"
          min={0}
          max={N_STEPS}
          value={step}
          onChange={e => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Optimizer step"
        />
        <span className={styles.stepLabel}>step {step} / {N_STEPS}</span>
      </div>

      {/* Visibility toggles */}
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Show:</span>
        {OPTIMIZERS.map(opt => (
          <label key={opt.key} className={styles.toggleItem} style={{ color: visible[opt.key] ? opt.color : 'var(--text-tertiary)' }}>
            <input
              type="checkbox"
              checked={visible[opt.key]}
              onChange={() => toggleVisible(opt.key)}
              className={styles.checkbox}
              style={{ accentColor: opt.color }}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Landscape + trajectories plot */}
      <div className={styles.plotPanel}>
        <div className={styles.panelTitle}>
          Loss landscape — f(x, y) = 10(x − 3)² + (y − 1)² &nbsp;&nbsp; (ill-conditioned: x curvature 10×)
        </div>
        <LandscapePlot step={step} visible={visible} focusedOpt={focusedOpt} setFocusedOpt={setFocusedOpt} />
      </div>

      {/* Per-optimizer stats */}
      <div className={styles.statsGrid}>
        {OPTIMIZERS.map(opt => {
          const pt = opt.trajectory[step]!;
          const isFocused = opt.key === focusedOpt;
          return (
            <div
              key={opt.key}
              className={`${styles.statCard} ${isFocused ? styles.statCardFocused : ''} ${!visible[opt.key] ? styles.statCardHidden : ''}`}
              onClick={() => setFocusedOpt(opt.key)}
              style={{ borderColor: visible[opt.key] && isFocused ? opt.color : undefined }}
              role="button"
              tabIndex={0}
            >
              <div className={styles.statHeader} style={{ color: opt.color }}>{opt.label}</div>
              <div className={styles.statValueRow}>
                <span className={styles.statLabel}>pos</span>
                <span className={styles.statValue}>({pt.x.toFixed(2)}, {pt.y.toFixed(2)})</span>
              </div>
              <div className={styles.statValueRow}>
                <span className={styles.statLabel}>loss</span>
                <span className={styles.statValue}>{pt.loss.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Description of focused optimizer */}
      <div className={styles.description} aria-live="polite">
        <strong style={{ color: focused.color }}>{focused.label}:</strong> {focused.description}
      </div>
    </div>
  );
}

interface PlotProps {
  step: number;
  visible: Record<OptimizerKey, boolean>;
  focusedOpt: OptimizerKey;
  setFocusedOpt: (k: OptimizerKey) => void;
}

function LandscapePlot({ step, visible, focusedOpt }: PlotProps) {
  const WIDTH = 720;
  const HEIGHT = 420;
  const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  // Coordinate system: x in [-5, 6], y in [-2, 5]
  const X_MIN = -5, X_MAX = 6;
  const Y_MIN = -2, Y_MAX = 5;

  function xPx(x: number): number {
    return PADDING.left + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  }
  function yPx(y: number): number {
    return PADDING.top + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * plotH;
  }

  // Contour ellipses for f(x, y) = 10(x - 3)^2 + (y - 1)^2 = c
  // For each contour value c: semi-major (y axis) = sqrt(c); semi-minor (x axis) = sqrt(c/10)
  const contourValues = [5, 20, 50, 100];

  // Axis tick values
  const xTicks = [-4, -2, 0, 2, 4, 6];
  const yTicks = [-2, 0, 2, 4];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label="2D loss landscape with optimizer trajectories">
      {/* Grid */}
      {xTicks.map(t => (
        <line key={`gx-${t}`} x1={xPx(t)} x2={xPx(t)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.gridLine} />
      ))}
      {yTicks.map(t => (
        <line key={`gy-${t}`} x1={PADDING.left} x2={WIDTH - PADDING.right} y1={yPx(t)} y2={yPx(t)} className={styles.gridLine} />
      ))}

      {/* Contour ellipses centered at (3, 1) */}
      {contourValues.map(c => {
        const rxData = Math.sqrt(c / 10);   // x semi-axis (in data units)
        const ryData = Math.sqrt(c);         // y semi-axis (in data units)
        // Convert to pixel radii (data range → pixel range)
        const rxPx = (rxData / (X_MAX - X_MIN)) * plotW;
        const ryPx = (ryData / (Y_MAX - Y_MIN)) * plotH;
        return (
          <ellipse
            key={`contour-${c}`}
            cx={xPx(MINIMUM.x)}
            cy={yPx(MINIMUM.y)}
            rx={rxPx}
            ry={ryPx}
            className={styles.contour}
          />
        );
      })}

      {/* Axes */}
      <line x1={PADDING.left} x2={PADDING.left} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.axisLine} />
      <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={HEIGHT - PADDING.bottom} y2={HEIGHT - PADDING.bottom} className={styles.axisLine} />

      {/* Tick labels */}
      {xTicks.map(t => (
        <text key={`xt-${t}`} x={xPx(t)} y={HEIGHT - PADDING.bottom + 18} className={styles.tickLabel} textAnchor="middle">{t}</text>
      ))}
      {yTicks.map(t => (
        <text key={`yt-${t}`} x={PADDING.left - 8} y={yPx(t) + 4} className={styles.tickLabel} textAnchor="end">{t}</text>
      ))}
      <text x={PADDING.left + plotW / 2} y={HEIGHT - 6} className={styles.axisLabel} textAnchor="middle">x</text>
      <text x={-PADDING.top - plotH / 2} y={14} className={styles.axisLabel} textAnchor="middle" transform="rotate(-90)">y</text>

      {/* Minimum marker */}
      <g className={styles.minimumMarker}>
        <line x1={xPx(MINIMUM.x) - 6} x2={xPx(MINIMUM.x) + 6} y1={yPx(MINIMUM.y) - 6} y2={yPx(MINIMUM.y) + 6} />
        <line x1={xPx(MINIMUM.x) + 6} x2={xPx(MINIMUM.x) - 6} y1={yPx(MINIMUM.y) - 6} y2={yPx(MINIMUM.y) + 6} />
      </g>
      <text x={xPx(MINIMUM.x) + 10} y={yPx(MINIMUM.y) - 8} className={styles.minimumLabel}>min</text>

      {/* Origin marker (for AdamW's decay target) */}
      <circle cx={xPx(0)} cy={yPx(0)} r={3} className={styles.originDot} />
      <text x={xPx(0) + 8} y={yPx(0) - 4} className={styles.originLabel}>origin</text>

      {/* Trajectories */}
      {OPTIMIZERS.map(opt => {
        if (!visible[opt.key]) return null;
        const isFocused = opt.key === focusedOpt;
        const pts = opt.trajectory.slice(0, step + 1);
        const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPx(p.x)} ${yPx(p.y)}`).join(' ');
        const currentPt = pts[pts.length - 1]!;
        return (
          <g key={opt.key}>
            <path
              d={pathD}
              fill="none"
              stroke={opt.color}
              strokeWidth={isFocused ? 2.5 : 1.5}
              opacity={isFocused ? 1 : 0.65}
            />
            <circle
              cx={xPx(currentPt.x)}
              cy={yPx(currentPt.y)}
              r={isFocused ? 6 : 4}
              fill={opt.color}
              stroke="var(--bg-primary)"
              strokeWidth={1.5}
            />
          </g>
        );
      })}

      {/* Start marker */}
      <circle cx={xPx(START.x)} cy={yPx(START.y)} r={4} className={styles.startMarker} />
      <text x={xPx(START.x) + 10} y={yPx(START.y) + 4} className={styles.startLabel}>start</text>
    </svg>
  );
}
```

### 4. `OptimizerComparison.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.controlPrimary, .controlSecondary {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
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
.scrubber { flex: 1; min-width: 180px; }
.stepLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--cyan-300);
  min-width: 100px;
  text-align: right;
}

.toggleRow {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
}
.toggleLabel { color: var(--text-tertiary); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
.toggleItem {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: color 200ms;
}
.checkbox { width: 14px; height: 14px; cursor: pointer; }

.plotPanel {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  margin-bottom: 1rem;
}
.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.svg { width: 100%; height: auto; }

.gridLine { stroke: var(--border-subtle); stroke-width: 0.5; stroke-dasharray: 2 4; }
.axisLine { stroke: var(--border-default); stroke-width: 1; }
.tickLabel { fill: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; font-size: 10px; }
.axisLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 11px; }

.contour {
  fill: none;
  stroke: color-mix(in srgb, var(--cyan-500) 30%, transparent);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}

.minimumMarker line { stroke: var(--text-primary); stroke-width: 2; }
.minimumLabel { fill: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; }

.originDot { fill: var(--text-tertiary); }
.originLabel { fill: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; font-size: 9px; }

.startMarker { fill: var(--text-secondary); stroke: var(--bg-primary); stroke-width: 1.5; }
.startLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 10px; }

.statsGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}
.statCard {
  padding: 0.65rem 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 200ms, opacity 200ms;
}
.statCard:hover { border-color: var(--border-strong); }
.statCardFocused { /* color border set inline based on opt.color */ }
.statCardHidden { opacity: 0.45; }

.statHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
}
.statValueRow {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  margin-bottom: 0.15rem;
}
.statLabel { color: var(--text-tertiary); }
.statValue { color: var(--text-secondary); font-weight: 500; }

.description {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.description strong { font-weight: 500; }

@media (max-width: 640px) {
  .statsGrid { grid-template-columns: 1fr; }
  .controls { flex-direction: column; align-items: stretch; }
  .stepLabel { text-align: left; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as LossCurve } from './ch08/LossCurve';
export { default as OptimizerComparison } from './ch08/OptimizerComparison';
```

### 6. Update `src/pages/ch08-building-small-llm/index.mdx`

**Edit A: Add widget import:**

```mdx
import { LossCurve, OptimizerComparison } from '@components/widgets';
```

**Edit B: Replace section-4's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Optimizer comparison" caption="Three optimizers navigating the same ill-conditioned 2D loss landscape: SGD, Adam, and AdamW. The function has 10× more curvature in x than y. Watch how SGD oscillates badly, Adam smooths the path via adaptive scaling, and AdamW takes the same smooth path but ends at a point slightly pulled toward the origin — the visible effect of decoupled weight decay. Click any optimizer card to focus on it.">
  <OptimizerComparison client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 4 of Ch 8** renders with the working `OptimizerComparison` widget. Section 7's marquee still works.
3. **Initial state:** step = 0; all three optimizer dots overlap at start point (-3, 4); SGD/Adam/AdamW visible by default; AdamW focused.
4. **Click Play:** widget advances 1 step per ~80ms over ~8 seconds; all three trajectories grow as polylines on the landscape; dots track current positions.
5. **Final state (step 100):**
   - **SGD trajectory**: visibly jagged — oscillates back and forth across the steep x-axis. Final position roughly somewhere like (1.5, 3.0); high loss.
   - **Adam trajectory**: smooth curve toward (3, 1). Final position very close to minimum.
   - **AdamW trajectory**: smooth curve almost identical to Adam *but* visibly offset — final position about (2.7, 0.9), pulled slightly toward origin.
6. **Contour ellipses** are visible as dashed cyan ellipses centered at (3, 1) — wider in y than x (matching the 10x ill-conditioning).
7. **Minimum marker** "×" at (3, 1) with "min" label.
8. **Origin marker** (small dot + "origin" label) at (0, 0) — visual reference for AdamW's decay pull.
9. **Click any stat card:** the corresponding optimizer becomes focused (thicker trajectory, larger dot, description updates).
10. **Toggle a checkbox off:** that optimizer's trajectory and dot disappear; stat card dims.
11. **Mobile:** stats grid collapses to single column; controls stack.
12. **`npm run typecheck`** passes.
13. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not let the user change the loss function.** Fixed quadratic.
- ❌ **Do not add hyperparameter sliders.** LR, betas, weight decay are fixed in `optimizer-data.ts`.
- ❌ **Do not implement other optimizers (RMSProp, Lion, etc.).** SGD/Adam/AdamW only.
- ❌ **Do not animate the contours.** Static contours; only trajectories animate.
- ❌ **Do not flip Ch 8's status.** Session 39 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch08/OptimizerComparison.tsx src/components/widgets/ch08/OptimizerComparison.module.css src/components/widgets/ch08/optimizer-data.ts src/components/widgets/index.ts src/pages/ch08-building-small-llm/index.mdx
git commit -m "session 38: optimizer comparison secondary widget — SGD vs Adam vs AdamW on ill-conditioned 2D landscape"
git push origin main
```

Verify on production:
- All three optimizer trajectories animate smoothly
- SGD's oscillation is visually unmistakable
- AdamW's final position is *visibly* different from Adam's (closer to origin)

---

## Notes for the session author

**On choosing the loss function:**
$f(x, y) = 10(x - 3)^2 + (y - 1)^2$ is deliberately ill-conditioned — 10× more curvature in x than y. This is the simplest scenario that makes the optimizer differences visible:
- SGD with a single LR can't handle both axes well. Set LR high enough to make progress in y → overshoot in x. Set LR low enough to be stable in x → glacial in y. The widget uses LR = 0.04 which keeps SGD stable but oscillating.
- Adam's per-axis adaptive scaling solves this. Big gradients in x → small steps; small gradients in y → bigger steps.
- AdamW does the same adaptive scaling, but the multiplicative `(1 - lr * wd)` shrink toward zero is visible because the minimum is at (3, 1), not at the origin.

If the minimum were at the origin, AdamW would converge identically to Adam — the weight decay would have nothing to "pull against." The chapter's claim that AdamW differs from Adam needs a minimum off-origin to be visible.

**On the LR values chosen:**
- SGD: lr = 0.04. Smaller would converge eventually but invisibly slowly. Larger diverges. 0.04 produces visible oscillation that the reader recognizes as "SGD is struggling."
- Adam: lr = 0.3. Adam can handle much larger LRs than SGD because of adaptive scaling. 0.3 gets it to the minimum in ~50 steps.
- AdamW: same LR (0.3), with weight decay 0.05. The decay value is large enough that AdamW's final position is *visibly* offset from the minimum (~10% pull toward origin), but not so large that AdamW fails to converge.

**On precomputing trajectories at module load:**
For 100 steps and three optimizers, the total computation is ~300 simple optimizer updates — milliseconds. Doing this at module load (not on every render) means the trajectories don't recompute as the user scrubs. The widget renders quickly.

**On the contour ellipses:**
For $f(x, y) = ax^2 + by^2 = c$, the contour is an ellipse with x-semi-axis $\sqrt{c/a}$ and y-semi-axis $\sqrt{c/b}$. For $a = 10, b = 1$, the y-semi-axis is $\sqrt{10}$ times longer than the x-semi-axis. The ellipses look tall and narrow — the visual signature of ill-conditioning.

**On the stat cards being clickable:**
Each stat card doubles as a "focus this optimizer" button. Clicking a card makes the corresponding trajectory thicker and larger; description updates. This is the chapter prose's pedagogical move: focus on one optimizer at a time, compare, then look at the others.

**On the focus state:**
Focused optimizer has 2.5px stroke + opacity 1; non-focused have 1.5px stroke + opacity 0.65. Visible difference without making non-focused optimizers invisible. The reader can compare all three while studying one closely.

**On the AdamW-pulled-toward-origin claim:**
At step 100, with my chosen hyperparameters, the trajectories should end approximately:
- SGD: (1.5, 3.0) — far from min, oscillating
- Adam: (2.98, 0.99) — essentially at minimum
- AdamW: (2.72, 0.91) — visibly pulled toward origin

The Adam–AdamW gap is what makes the widget pedagogically valuable. If your hyperparameters produce identical final positions, the weight decay isn't strong enough; if AdamW completely fails to converge, it's too strong. Tune until the visible offset is ~10% of the distance from origin to minimum.

**Pedagogical claim this widget supports:** "SGD struggles on ill-conditioned landscapes because it can't adapt to different curvatures per parameter. Adam's adaptive per-parameter learning rate fixes that. AdamW additionally pulls parameters toward zero via decoupled weight decay — a separate operation from the gradient step. The convergence point shifts toward the origin." If the reader watches the three trajectories evolve and can articulate this three-claim sequence afterward — the widget has succeeded.

This widget answers the Ch 8 prose's "why AdamW?" question with a visible, dynamical demonstration. Pairs with the section-4 prose; complements the section-7 marquee.
