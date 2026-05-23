# Session 65 — DPO loss landscape secondary widget

> The secondary Chapter 14 widget. A **2D heatmap of the DPO loss surface** with axes for the implicit reward of chosen and rejected responses. Color encodes loss magnitude (cool cyan = low loss; warm rose = high loss). The **diagonal line** ($r_{\text{chosen}} = r_{\text{rejected}}$) is where the loss equals $\log 2 \approx 0.693$ — the "no preference" baseline. Below the diagonal: chosen reward is higher; loss is low; **DPO has done its job**. Above the diagonal: rejected reward is higher; loss is high; the model has the preferences *backwards*. Sliders let the reader move the current operating point and adjust $\beta$. A gradient-descent arrow shows the direction the policy moves during training. **The visualization that makes DPO's gradient flow geometrically obvious.** Replaces the section-5 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch14-alignment/research.md`** — derivation 3 (DPO trick) is the source material
2. **`prompts/chapters/ch14-alignment/session-63-page-structure.md`** — for the section-5 widget placeholder this session fills
3. **`prompts/chapters/ch14-alignment/session-64-preference-pipeline-widget.md`** — for the Ch 14 widget conventions
4. **`prompts/chapters/ch08-building-small-llm/session-37-loss-curve-widget.md`** — for the precomputed-loss-grid pattern (LossCurve established the precomputed-data approach for loss visualization)

---

## Goal

Replace the `<WidgetFrame title="DPO loss landscape">` placeholder in section 5 with a working interactive widget that:

- Displays a **2D heatmap** of the DPO loss across a grid of $(r_{\text{chosen}}, r_{\text{rejected}})$ values
- Renders the **diagonal line** $r_{\text{chosen}} = r_{\text{rejected}}$ (the "no preference" boundary)
- Shows a **current-point marker** at the user-controlled $(r_{\text{chosen}}, r_{\text{rejected}})$ position
- Displays an **arrow at the current point** indicating the gradient descent direction
- **Sliders**: for $r_{\text{chosen}}$, $r_{\text{rejected}}$, and $\beta$
- **Live readout** of the loss value, gradient components, and "is the policy correct?" annotation
- **Pedagogical regions labeled**: "good" (below diagonal), "tied" (on diagonal), "bad" (above diagonal)

**End state:** section 5 of Chapter 14 has a working secondary widget. After 30 seconds of interaction, the reader should be able to articulate: (a) the DPO loss is a function of the difference $r_{\text{chosen}} - r_{\text{rejected}}$; (b) below the diagonal the loss is low because chosen is preferred; (c) above the diagonal the loss is high because rejected is preferred; (d) the gradient descent direction is consistently "increase chosen, decrease rejected"; (e) $\beta$ scales the loss landscape — higher $\beta$ makes the slope steeper.

---

## Inputs

State of the repo after session 64:

- Section 3's `PreferenceLearningPipeline` marquee widget is wired
- Section 5's widget is still stubbed
- `src/components/widgets/ch14/` exists with one widget already
- `src/lib/chapters.ts` has Ch 14 as `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch14/DPOLossLandscape.tsx` — the React widget
2. **Create** `src/components/widgets/ch14/DPOLossLandscape.module.css` — scoped styles
3. **Create** `src/components/widgets/ch14/loss-landscape-data.ts` — DPO loss computation helpers
4. **Update** `src/components/widgets/index.ts` — add `DPOLossLandscape` export
5. **Update** `src/pages/ch14-alignment/index.mdx` — replace section-5's `<WidgetFrame>` interior with `<DPOLossLandscape client:visible />`

---

## Detailed spec

### 1. `loss-landscape-data.ts` — DPO loss computation

```ts
// src/components/widgets/ch14/loss-landscape-data.ts

/** Stable softplus: log(1 + exp(x)) computed without overflow. */
function softplus(x: number): number {
  if (x > 0) return x + Math.log1p(Math.exp(-x));
  return Math.log1p(Math.exp(x));
}

/** Stable sigmoid. */
function sigmoid(x: number): number {
  if (x >= 0) {
    const e = Math.exp(-x);
    return 1 / (1 + e);
  }
  const e = Math.exp(x);
  return e / (1 + e);
}

/**
 * DPO loss at given implicit-reward values.
 *
 * L = -log σ(r_chosen - r_rejected) = softplus(-(r_chosen - r_rejected))
 *
 * Note: beta scales the implicit rewards but doesn't change the *shape* of the
 * loss surface in (r_chosen, r_rejected) space — it only affects the mapping
 * from policy log-ratios to implicit rewards. For the landscape visualization,
 * we plot directly in (r_chosen, r_rejected) space.
 */
export function dpoLoss(rChosen: number, rRejected: number): number {
  const diff = rChosen - rRejected;
  return softplus(-diff);
}

/**
 * Gradient of the DPO loss with respect to r_chosen and r_rejected.
 *
 *  ∂L/∂r_chosen   = -σ(r_rejected - r_chosen) = -(1 - σ(r_chosen - r_rejected)) =  σ(r_chosen - r_rejected) - 1
 *  ∂L/∂r_rejected = +σ(r_rejected - r_chosen) =  1 - σ(r_chosen - r_rejected)
 *
 * Gradient descent moves opposite to this: increase r_chosen, decrease r_rejected.
 */
export function dpoGradient(rChosen: number, rRejected: number): { dChosen: number; dRejected: number } {
  const sigDiff = sigmoid(rChosen - rRejected);
  return {
    dChosen: sigDiff - 1,    // negative when sigDiff < 1 (typically); descent → increase r_chosen
    dRejected: 1 - sigDiff,  // positive; descent → decrease r_rejected
  };
}

/**
 * Build a grid of loss values for the heatmap.
 *
 * Domain: [domainMin, domainMax] for both axes. Default [-3, 3].
 * Resolution: number of cells per axis. Default 25.
 */
export interface GridCell {
  i: number; j: number;
  rChosen: number; rRejected: number;
  loss: number;
}

export function buildLossGrid(
  domainMin = -3, domainMax = 3, resolution = 25,
): { cells: GridCell[]; minLoss: number; maxLoss: number } {
  const cells: GridCell[] = [];
  let minLoss = Infinity, maxLoss = -Infinity;
  const step = (domainMax - domainMin) / resolution;
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const rChosen = domainMin + (i + 0.5) * step;
      const rRejected = domainMin + (j + 0.5) * step;
      const loss = dpoLoss(rChosen, rRejected);
      cells.push({ i, j, rChosen, rRejected, loss });
      if (loss < minLoss) minLoss = loss;
      if (loss > maxLoss) maxLoss = loss;
    }
  }
  // Cap the max for display purposes (the loss diverges as r_chosen << r_rejected)
  maxLoss = Math.min(maxLoss, 6);
  return { cells, minLoss, maxLoss };
}

/** Map a loss value to a color string (cool → warm) via CSS color-mix. */
export function lossToColor(loss: number, minLoss: number, maxLoss: number): string {
  const t = Math.max(0, Math.min(1, (loss - minLoss) / (maxLoss - minLoss)));
  // t ∈ [0, 1]; 0 = cool (cyan), 1 = warm (rose)
  // Use a 3-stop interpolation: cyan → amber → rose
  if (t < 0.5) {
    const tt = t * 2;
    return `color-mix(in srgb, var(--cyan-500) ${(1 - tt) * 75}%, var(--amber-400) ${tt * 75}%)`;
  } else {
    const tt = (t - 0.5) * 2;
    return `color-mix(in srgb, var(--amber-400) ${(1 - tt) * 75}%, var(--rose-400) ${tt * 75}%)`;
  }
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│  β (temperature):  [────●────] 0.1                              │
│                                                                  │
│  DPO loss landscape:                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  r_rejected                                                  ││
│  │      3 ┌─────────────────────────────────────────────────┐  ││
│  │        │░░░░░░░░░░░░░░░░░░░  TIED                          │  ││
│  │      2 │░░░░░░ HIGH LOSS ░░░ along diagonal                │  ││
│  │        │░░░░░░ rejected   ░  loss ≈ 0.693                  │  ││
│  │      1 │░░░░ has higher  ░░░░ ░                           │  ││
│  │        │░░ reward (bad) ░░░ ░░ ░                          │  ││
│  │      0 │░░░ ░░ ░ ░ ●(current) ░ ░ ░                       │  ││
│  │        │░░ ░░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░░░░                      │  ││
│  │     -1 │░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░░░░░░░░                       │  ││
│  │        │░ ░ ░ ░ ░ ░░░░░░░░░░░░░░░░░                        │  ││
│  │     -2 │░ ░ ░░░ LOW LOSS ░░░░░░░░░░                        │  ││
│  │        │░░░░░░ chosen has higher ░░░░░░                    │  ││
│  │     -3 │░░░░░░░░░░ reward (good) ░░░░░░░░░░░               │  ││
│  │        └───────────────────────────────────                │  ││
│  │       -3  -2  -1  0  1  2  3  →  r_chosen                  │  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  At current point (r_chosen=0.5, r_rejected=-0.5):              │
│    DPO loss:    0.474                                            │
│    ∂L/∂r_chosen:  -0.27   (descent: increase r_chosen)          │
│    ∂L/∂r_rejected: +0.27  (descent: decrease r_rejected)        │
│    Policy state: GOOD — chosen has higher reward                │
│                                                                  │
│  r_chosen:   [──●─────] 0.5     (implicit reward for chosen)    │
│  r_rejected: [────●───] -0.5    (implicit reward for rejected)  │
│                                                                  │
│  How to read this:                                               │
│  • Below the diagonal (r_chosen > r_rejected): chosen wins; LOW │
│    loss; the policy correctly prefers the chosen response.      │
│  • On the diagonal: tied; loss = log(2) ≈ 0.693                 │
│  • Above the diagonal (r_chosen < r_rejected): rejected wins;   │
│    HIGH loss; the policy has it backwards.                       │
│  • Gradient descent always points "down and right" — increase   │
│    r_chosen, decrease r_rejected. DPO drives the policy below   │
│    the diagonal.                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Move the $r_{\text{chosen}}$ slider → current-point marker slides horizontally; loss + gradient update
- Move the $r_{\text{rejected}}$ slider → current-point marker slides vertically; loss + gradient update
- Move the $\beta$ slider → loss values rescale (but landscape shape preserved); gradient magnitudes rescale
- Click any cell in the heatmap → snap the current point to that cell's center
- The diagonal line and region labels are always visible (pedagogical anchors)

### 3. `DPOLossLandscape.tsx`

```tsx
import { useMemo, useState } from 'react';
import {
  buildLossGrid, dpoLoss, dpoGradient, lossToColor,
} from './loss-landscape-data';
import styles from './DPOLossLandscape.module.css';

const DOMAIN_MIN = -3;
const DOMAIN_MAX = 3;
const RESOLUTION = 25;

export default function DPOLossLandscape() {
  const [rChosen, setRChosen] = useState(0.5);
  const [rRejected, setRRejected] = useState(-0.5);
  const [beta, setBeta] = useState(0.1);

  const grid = useMemo(
    () => buildLossGrid(DOMAIN_MIN, DOMAIN_MAX, RESOLUTION),
    [],
  );

  const currentLoss = dpoLoss(rChosen, rRejected);
  const gradient = dpoGradient(rChosen, rRejected);
  const policyState =
    rChosen > rRejected ? 'GOOD' :
    rChosen < rRejected ? 'BAD' : 'TIED';

  return (
    <div className={styles.widget}>
      {/* Beta control */}
      <div className={styles.controlRow}>
        <label className={styles.controlLabel}>
          β (temperature): <span className={styles.controlValue}>{beta.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0.01} max={1.0} step={0.01}
          value={beta}
          onChange={e => setBeta(Number(e.target.value))}
          className={styles.slider}
          aria-label="beta"
        />
      </div>

      {/* Loss landscape */}
      <div className={styles.landscapePanel}>
        <LandscapeSvg
          grid={grid}
          rChosen={rChosen}
          rRejected={rRejected}
          gradient={gradient}
          onCellClick={(rc, rr) => { setRChosen(rc); setRRejected(rr); }}
        />
      </div>

      {/* Current-point readouts */}
      <div className={styles.readoutPanel}>
        <Readout label="DPO loss" value={currentLoss.toFixed(3)} highlight />
        <Readout
          label="∂L/∂r_chosen"
          value={`${gradient.dChosen >= 0 ? '+' : ''}${gradient.dChosen.toFixed(2)}`}
          note="descent → increase r_chosen"
        />
        <Readout
          label="∂L/∂r_rejected"
          value={`${gradient.dRejected >= 0 ? '+' : ''}${gradient.dRejected.toFixed(2)}`}
          note="descent → decrease r_rejected"
        />
        <Readout label="Policy state" value={policyState} tag={policyState.toLowerCase()} />
      </div>

      {/* Operating point sliders */}
      <div className={styles.controlRow}>
        <label className={styles.controlLabel}>
          r_chosen: <span className={styles.controlValueChosen}>{rChosen.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={DOMAIN_MIN} max={DOMAIN_MAX} step={0.05}
          value={rChosen}
          onChange={e => setRChosen(Number(e.target.value))}
          className={styles.slider}
          aria-label="r_chosen"
        />
      </div>
      <div className={styles.controlRow}>
        <label className={styles.controlLabel}>
          r_rejected: <span className={styles.controlValueRejected}>{rRejected.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={DOMAIN_MIN} max={DOMAIN_MAX} step={0.05}
          value={rRejected}
          onChange={e => setRRejected(Number(e.target.value))}
          className={styles.slider}
          aria-label="r_rejected"
        />
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        The DPO loss is <strong>−log σ(r_chosen − r_rejected)</strong> — it depends only on the difference.
        Below the diagonal: chosen has higher reward; loss is low; <strong>the policy correctly prefers chosen</strong>.
        Above the diagonal: rejected has higher reward; loss is high; the policy has it backwards.
        The gradient always points "down and right": <strong>increase r_chosen, decrease r_rejected</strong> — this is
        how DPO drives the policy toward correct preferences during training.
      </div>
    </div>
  );
}

interface LandscapeProps {
  grid: ReturnType<typeof buildLossGrid>;
  rChosen: number;
  rRejected: number;
  gradient: { dChosen: number; dRejected: number };
  onCellClick: (rChosen: number, rRejected: number) => void;
}

function LandscapeSvg({ grid, rChosen, rRejected, gradient, onCellClick }: LandscapeProps) {
  const WIDTH = 720;
  const HEIGHT = 460;
  const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;
  const cellSize = plotW / RESOLUTION;

  function xFor(rc: number): number {
    return PADDING.left + ((rc - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) * plotW;
  }
  function yFor(rr: number): number {
    // y axis inverted: high r_rejected at top
    return PADDING.top + ((DOMAIN_MAX - rr) / (DOMAIN_MAX - DOMAIN_MIN)) * plotH;
  }

  // Compute gradient descent vector (opposite of gradient)
  const descentX = -gradient.dChosen;       // descent direction along r_chosen axis
  const descentY = -gradient.dRejected;     // descent direction along r_rejected axis
  // Normalize and scale for display
  const descentMag = Math.sqrt(descentX * descentX + descentY * descentY);
  const arrowScale = 40;   // pixels
  const arrowDX = (descentX / Math.max(descentMag, 1e-9)) * arrowScale;
  const arrowDY = -(descentY / Math.max(descentMag, 1e-9)) * arrowScale;   // negate y because SVG y is inverted

  const cx = xFor(rChosen);
  const cy = yFor(rRejected);

  // X axis ticks
  const xTicks = [-3, -2, -1, 0, 1, 2, 3];
  // Y axis ticks
  const yTicks = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label="DPO loss landscape">
      {/* Heatmap cells */}
      {grid.cells.map(cell => (
        <rect
          key={`cell-${cell.i}-${cell.j}`}
          x={xFor(cell.rChosen) - cellSize / 2}
          y={yFor(cell.rRejected) - cellSize / 2}
          width={cellSize + 0.5}
          height={cellSize + 0.5}
          fill={lossToColor(cell.loss, grid.minLoss, grid.maxLoss)}
          opacity={0.7}
          style={{ cursor: 'pointer' }}
          onClick={() => onCellClick(cell.rChosen, cell.rRejected)}
        />
      ))}

      {/* Diagonal (r_chosen = r_rejected) */}
      <line
        x1={xFor(DOMAIN_MIN)} y1={yFor(DOMAIN_MIN)}
        x2={xFor(DOMAIN_MAX)} y2={yFor(DOMAIN_MAX)}
        className={styles.diagonal}
      />
      <text
        x={xFor(2.5)} y={yFor(2.5) - 5}
        className={styles.diagonalLabel}
        fontSize="9"
        textAnchor="end"
        transform={`rotate(-45 ${xFor(2.5)} ${yFor(2.5) - 5})`}
      >tied: r_c = r_r</text>

      {/* Region labels */}
      <text x={xFor(-2)} y={yFor(2)} className={styles.regionLabel} fontSize="11" textAnchor="middle">
        ABOVE DIAGONAL: BAD
      </text>
      <text x={xFor(-2)} y={yFor(2) + 14} className={styles.regionLabelDim} fontSize="9" textAnchor="middle">
        (rejected has higher reward)
      </text>
      <text x={xFor(2)} y={yFor(-2)} className={styles.regionLabel} fontSize="11" textAnchor="middle">
        BELOW DIAGONAL: GOOD
      </text>
      <text x={xFor(2)} y={yFor(-2) + 14} className={styles.regionLabelDim} fontSize="9" textAnchor="middle">
        (chosen has higher reward)
      </text>

      {/* Axes */}
      <line x1={PADDING.left} x2={PADDING.left} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.axisLine} />
      <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={HEIGHT - PADDING.bottom} y2={HEIGHT - PADDING.bottom} className={styles.axisLine} />

      {/* Tick labels */}
      {xTicks.map(t => (
        <text key={`xt-${t}`} x={xFor(t)} y={HEIGHT - PADDING.bottom + 14} className={styles.tickLabel} textAnchor="middle">
          {t}
        </text>
      ))}
      {yTicks.map(t => (
        <text key={`yt-${t}`} x={PADDING.left - 8} y={yFor(t) + 4} className={styles.tickLabel} textAnchor="end">
          {t}
        </text>
      ))}

      {/* Axis labels */}
      <text x={PADDING.left + plotW / 2} y={HEIGHT - 8} className={styles.axisLabel} textAnchor="middle">
        r_chosen (implicit reward for chosen response)
      </text>
      <text
        x={-PADDING.top - plotH / 2}
        y={18}
        className={styles.axisLabel}
        textAnchor="middle"
        transform="rotate(-90)"
      >
        r_rejected
      </text>

      {/* Gradient arrow at current point */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--cyan-300)" />
        </marker>
      </defs>
      <line
        x1={cx} y1={cy}
        x2={cx + arrowDX} y2={cy + arrowDY}
        className={styles.gradientArrow}
        markerEnd="url(#arrowhead)"
      />

      {/* Current point */}
      <circle cx={cx} cy={cy} r={7} className={styles.currentPointOuter} />
      <circle cx={cx} cy={cy} r={4} className={styles.currentPointInner} />
    </svg>
  );
}

function Readout({
  label, value, highlight, note, tag,
}: { label: string; value: string; highlight?: boolean; note?: string; tag?: string }) {
  return (
    <div className={`${styles.readout} ${highlight ? styles.readoutHighlight : ''}`}>
      <div className={styles.readoutLabel}>{label}</div>
      <div className={`${styles.readoutValue} ${tag ? styles[`readoutTag_${tag}`] : ''}`}>{value}</div>
      {note && <div className={styles.readoutNote}>{note}</div>}
    </div>
  );
}
```

### 4. `DPOLossLandscape.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.controlRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.7rem;
  flex-wrap: wrap;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 150px;
}
.controlValue { color: var(--cyan-300); font-weight: 500; }
.controlValueChosen { color: var(--emerald-400); font-weight: 500; }
.controlValueRejected { color: var(--rose-400); font-weight: 500; }
.slider { flex: 1; min-width: 200px; }

.landscapePanel {
  padding: 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;
}
.svg { width: 100%; height: auto; }

.diagonal { stroke: var(--text-primary); stroke-width: 1.5; stroke-dasharray: 4 4; opacity: 0.5; }
.diagonalLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-style: italic; }

.regionLabel { fill: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-weight: 500; opacity: 0.8; }
.regionLabelDim { fill: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; font-style: italic; }

.axisLine { stroke: var(--border-default); stroke-width: 1; }
.tickLabel { fill: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; font-size: 10px; }
.axisLabel { fill: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 11px; }

.gradientArrow { stroke: var(--cyan-300); stroke-width: 2.5; }

.currentPointOuter {
  fill: var(--bg-primary);
  stroke: var(--cyan-300);
  stroke-width: 2;
}
.currentPointInner {
  fill: var(--cyan-300);
}

.readoutPanel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.readout {
  padding: 0.55rem 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.readoutHighlight {
  border-color: var(--cyan-500);
  background: color-mix(in srgb, var(--cyan-500) 6%, var(--bg-elevated));
}
.readoutLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.25rem;
}
.readoutValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 500;
}
.readoutHighlight .readoutValue { color: var(--cyan-300); }
.readoutNote {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: var(--text-tertiary);
  margin-top: 0.2rem;
  font-style: italic;
}
.readoutTag_good { color: var(--emerald-400) !important; }
.readoutTag_bad { color: var(--rose-400) !important; }
.readoutTag_tied { color: var(--amber-400) !important; }

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
  .controlRow { flex-direction: column; align-items: flex-start; }
  .controlLabel { min-width: 0; }
  .readoutPanel { grid-template-columns: repeat(2, 1fr); }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as PreferenceLearningPipeline } from './ch14/PreferenceLearningPipeline';
export { default as DPOLossLandscape } from './ch14/DPOLossLandscape';
```

### 6. Update `src/pages/ch14-alignment/index.mdx`

**Edit A: Add widget import:**

```mdx
import { PreferenceLearningPipeline, DPOLossLandscape } from '@components/widgets';
```

**Edit B: Replace section-5's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="DPO loss landscape" caption="The DPO loss surface as a function of the implicit rewards for chosen and rejected responses. Below the diagonal (chosen reward > rejected): low loss; policy is correct. Above the diagonal: high loss; policy has it backwards. The arrow shows the gradient descent direction — always pointing toward 'increase chosen, decrease rejected.' Slide the implicit rewards or β to explore.">
  <DPOLossLandscape client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3's** `PreferenceLearningPipeline` widget still renders correctly.
3. **Section 5** now renders the working `DPOLossLandscape` widget.
4. **Default state:** $r_{\text{chosen}} = 0.5$, $r_{\text{rejected}} = -0.5$, $\beta = 0.1$. Current point sits in the "below diagonal" (good) region. Loss readout ≈ 0.474.
5. **Heatmap renders 625 cells** (25 × 25 grid). Cool cyan in the bottom-right (low loss); warm rose in the top-left (high loss); transitions smoothly through amber along the diagonal.
6. **Diagonal line visible** at $r_{\text{chosen}} = r_{\text{rejected}}$ with dashed white stroke and a "tied: r_c = r_r" label.
7. **Region labels visible**: "ABOVE DIAGONAL: BAD (rejected has higher reward)" in the top-left; "BELOW DIAGONAL: GOOD (chosen has higher reward)" in the bottom-right.
8. **Current-point marker** is a cyan circle at $(r_{\text{chosen}}, r_{\text{rejected}})$.
9. **Gradient arrow** points from the current point in the descent direction. When current is below diagonal: arrow points roughly "down-right" (further into low-loss). When current is above diagonal: arrow points "down-right" (toward the diagonal and beyond into low-loss).
10. **Readouts panel** shows 4 values:
    - **DPO loss**: cyan (highlighted)
    - **∂L/∂r_chosen**: with descent direction note
    - **∂L/∂r_rejected**: with descent direction note
    - **Policy state**: "GOOD" (emerald), "BAD" (rose), or "TIED" (amber) — based on $r_{\text{chosen}}$ vs $r_{\text{rejected}}$
11. **Sliders work**: moving $r_{\text{chosen}}$ moves the marker horizontally; moving $r_{\text{rejected}}$ moves it vertically; moving $\beta$ changes the slider value (but doesn't reshape the heatmap — see notes-for-author).
12. **Click any heatmap cell** → current point snaps to that cell's center.
13. **At $r_{\text{chosen}} = -2, r_{\text{rejected}} = 2$**: loss readout = 4.018 (high); policy state = "BAD" (rose).
14. **At $r_{\text{chosen}} = 2, r_{\text{rejected}} = -2$**: loss readout = 0.018 (very low); policy state = "GOOD" (emerald).
15. **On the diagonal ($r_{\text{chosen}} = r_{\text{rejected}}$)**: loss = $\log 2 \approx 0.693$; policy state = "TIED" (amber).
16. **Mobile (< 720px)**: control rows stack vertically; readouts go to 2 columns.
17. **`npm run typecheck`** passes.
18. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not animate gradient descent.** Static gradient arrow at the current point only; no trajectory simulation.
- ❌ **Do not implement actual policy training.** It's a *static* loss landscape visualization.
- ❌ **Do not visualize the policy log-ratio space.** The widget operates in implicit-reward space $(r_{\text{chosen}}, r_{\text{rejected}})$. $\beta$ relates implicit reward to log-ratio, but we plot directly in implicit-reward space.
- ❌ **Do not show PPO's loss surface for comparison.** Out of scope; PPO has a more complex objective.
- ❌ **Do not implement 3D visualization.** 2D heatmap is sufficient and clearer.
- ❌ **Do not flip Ch 14's status.** Session 66 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch14/DPOLossLandscape.tsx src/components/widgets/ch14/DPOLossLandscape.module.css src/components/widgets/ch14/loss-landscape-data.ts src/components/widgets/index.ts src/pages/ch14-alignment/index.mdx
git commit -m "session 65: DPO loss landscape secondary widget — 2D heatmap of preference loss surface"
git push origin main
```

Verify on production:
- Heatmap renders with cool-to-warm gradient
- Diagonal line clearly visible
- Region labels readable
- Sliders update current point smoothly
- Gradient arrow always points toward low-loss region
- Click-to-snap works on cells

---

## Notes for the session author

**On $\beta$'s role in the visualization:**
$\beta$ in DPO multiplies the policy log-ratios to form the implicit rewards: $r_\theta = \beta \log(\pi_\theta / \pi_{\text{ref}})$. **The landscape itself (loss as a function of $(r_{\text{chosen}}, r_{\text{rejected}})$) doesn't depend on $\beta$ — the shape is fixed.** What $\beta$ controls is how the policy *log-ratios* map to *implicit rewards*. So increasing $\beta$ effectively "stretches" the relationship between policy changes and movement in the landscape.

For this visualization, we plot directly in $(r_{\text{chosen}}, r_{\text{rejected}})$ space. The $\beta$ slider is present so the reader sees it's a hyperparameter; it doesn't change the heatmap. **This is honest** — most DPO visualizations conflate $\beta$'s role and confuse readers.

If the implementor wants $\beta$ to *do* something in the widget, an alternative interpretation is: show the landscape in *policy log-ratio* space ($\log \pi_\theta / \pi_{\text{ref}}$ for chosen and rejected). Then $\beta$ scales the axes (smaller $\beta$ = wider effective domain). This is OK to implement *additionally* if desired, but the simpler "plot in implicit-reward space" is more pedagogically clear and recommended.

**On the cool-to-warm color encoding:**
- **Cyan (cool)**: low loss. The project default; signals "good place to be."
- **Amber (mid)**: medium loss. The transition zone along the diagonal.
- **Rose (warm)**: high loss. Signals "bad place to be."

This three-color gradient is more readable than monochrome. The transition happens around $\log 2 \approx 0.693$ (the tied-preferences loss).

**On the diagonal being the visual punchline:**
The dashed diagonal line where $r_{\text{chosen}} = r_{\text{rejected}}$ is the "no preference" boundary. Below: chosen wins; above: rejected wins. **This is the central pedagogical anchor** — the reader should walk away understanding that DPO drives the policy *below the diagonal*.

**On the gradient arrow:**
The gradient arrow at the current point shows the *descent* direction (opposite of the gradient). It always points toward lower-loss regions. For points above the diagonal: arrow points down-right (toward and below the diagonal). For points below the diagonal: arrow still points "down-right" (toward extreme low loss in the bottom-right corner). **The arrow is always consistent: increase $r_{\text{chosen}}$, decrease $r_{\text{rejected}}$.**

**On the policy-state tag:**
- **GOOD**: chosen reward > rejected reward (below diagonal)
- **TIED**: chosen reward = rejected reward (on diagonal)
- **BAD**: chosen reward < rejected reward (above diagonal)

These three states map to emerald/amber/rose colors — the same traffic-light pattern as the heatmap.

**On the heatmap resolution:**
25 × 25 = 625 cells. Each is a `<rect>` element in SVG. This renders fast on modern browsers. Higher resolution (50 × 50 = 2500) would look smoother but adds DOM weight without much pedagogical gain.

**On click-to-snap:**
Clicking any cell snaps the current point to that cell's center. This lets the reader explore the landscape spatially: "what does the loss look like over here?" without having to dial the sliders. Sliders + click-to-snap together give two interaction modes for different exploration styles.

**Pedagogical claim this widget supports:**
"The DPO loss is geometrically simple. It depends only on the difference between chosen and rejected implicit rewards. The loss surface has a clear structure: low in the bottom-right (where chosen wins), high in the top-left (where rejected wins), with a $\log 2$ ridge along the diagonal where they're tied. Gradient descent has a single consistent direction across the entire landscape: increase chosen, decrease rejected. **DPO training is just gradient descent on this surface.**"

After 30 seconds of interaction, the reader has internalized: (a) the loss depends only on the difference $r_{\text{chosen}} - r_{\text{rejected}}$; (b) the diagonal separates "policy correct" from "policy wrong"; (c) the gradient always points "down-right"; (d) DPO geometrically drives the policy below the diagonal; (e) $\beta$ is a hyperparameter, not a landscape-shape parameter.

**This widget gives the DPO derivation geometric grounding.** The math from section 5 becomes the loss surface; the policy update becomes a step on the surface. After reading the math + seeing the surface, the reader has both algebraic and geometric intuition.

Build with care.
