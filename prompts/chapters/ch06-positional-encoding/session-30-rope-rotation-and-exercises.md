# Session 30 — RoPE rotation widget + exercises + Ch 6 closeout

> Final Chapter 6 session. Three deliverables: the **RoPERotation** widget for section 5 (visualizes RoPE's central rotation interpretation — 4 pair-circles showing Q vectors rotating by position-dependent angles), an **Exercises section** with 4 problems (sinusoidal PE properties, learned PE limitations, RoPE implementation, ALiBi extrapolation), and the **status flip** from `'draft'` to `'published'`. **End of Phase 8.**

---

## Read first (in this order)

1. **`research/ch06-positional-encoding/research.md`** — Derivation 3 (RoPE) is the reference; the widget visualizes exactly the rotation described there
2. **`prompts/chapters/ch06-positional-encoding/session-28-page-structure.md`** — for the section-5 widget placeholder and where the Exercises section goes
3. **`prompts/chapters/ch06-positional-encoding/session-29-sinusoidal-pe-visualizer.md`** — for the widget conventions established by Ch 6's marquee
4. **`prompts/chapters/ch05-multihead-and-block/session-26-exercises-and-closeout.md`** — for the closeout template (exercises + status flip)

---

## Goal

By end of session:

1. **Section 5's `<WidgetFrame>` placeholder is filled** with `<RoPERotation client:visible />` — a widget showing 4 pair-circles, each visualizing one (sin, cos) dimension pair as a 2D vector. A position slider rotates each pair by angle proportional to position × the pair's frequency.
2. **An "Exercises" section is appended** to `index.mdx`, between section 8 ("What we have — everything except training") and the final chapter close paragraph, containing 4 exercises with hints and starter `<RunnableCode>` blocks
3. **Ch 6's status flips from `'draft'` to `'published'`** — adding the sixth published chapter to the site
4. **The chapter renders end-to-end as a complete deliverable**

After this session, Chapter 6 is the sixth complete chapter on production. **Phase 8 closes. The "architectural" half of the tutorial (Ch 1-6) is complete.**

---

## Inputs

State of the repo after session 29:

- Section 2's marquee widget (`SinusoidalPE`) is wired
- Section 5's widget is still stubbed
- `src/lib/chapters.ts` has Ch 1-5 `'published'`, Ch 6 `'draft'`, others `'planned'`

---

## Deliverables

1. **Create** `src/components/widgets/ch06/RoPERotation.tsx` — the React widget
2. **Create** `src/components/widgets/ch06/RoPERotation.module.css` — scoped styles
3. **Create** `src/components/widgets/ch06/rope-data.ts` — fixed base Q vector + pair frequencies + rotation helpers
4. **Update** `src/components/widgets/index.ts` — add `RoPERotation` export
5. **Update** `src/pages/ch06-positional-encoding/index.mdx`:
   - Replace section 5's `<WidgetFrame>` interior with `<RoPERotation client:visible />`
   - Add new `## Exercises` section between section 8 and the final chapter close paragraph
6. **Update** `src/lib/chapters.ts` — change Ch 6's `status` from `'draft'` to `'published'`

---

## Detailed spec

### Part A — RoPE rotation widget

#### A1. `rope-data.ts` — the data layer

A fixed base Q vector with `d_k = 8` (4 pairs of 2D vectors) and the standard frequency schedule. Position is the user-controlled parameter; everything else is fixed for deterministic, inspectable behavior.

```ts
// src/components/widgets/ch06/rope-data.ts

export const D_K = 8;
export const N_PAIRS = D_K / 2;    // 4 pairs
export const BASE = 10000;
export const MAX_POSITION = 50;

/**
 * Fixed Q vector at position 0 — represents one query before RoPE is applied.
 * Each adjacent pair forms a 2D vector that will be rotated by RoPE.
 *
 * Hand-chosen so each pair has a non-trivial starting direction (not all aligned
 * with the same axis) — makes the rotation visible from any starting angle.
 */
export const BASE_Q: number[] = [
  0.8, 0.3,    // pair 0 (d0, d1)
  -0.2, 0.7,   // pair 1 (d2, d3)
  0.5, -0.4,   // pair 2 (d4, d5)
  -0.6, 0.1,   // pair 3 (d6, d7)
];

/** Pair frequencies: omega_k = 1 / base^(2k/d_k). */
export const PAIR_FREQUENCIES: number[] = Array.from({ length: N_PAIRS }, (_, k) =>
  1 / Math.pow(BASE, (2 * k) / D_K)
);

/** Pair periods in positions: 2π / omega_k. */
export const PAIR_PERIODS: number[] = PAIR_FREQUENCIES.map(omega => (2 * Math.PI) / omega);

/**
 * Apply RoPE to the base Q at a given position.
 * Returns the rotated Q vector (length d_k).
 */
export function rotateQ(position: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < N_PAIRS; k++) {
    const omega = PAIR_FREQUENCIES[k]!;
    const theta = position * omega;
    const x = BASE_Q[2 * k]!;
    const y = BASE_Q[2 * k + 1]!;
    // 2D rotation: (x, y) -> (x cos θ - y sin θ, x sin θ + y cos θ)
    out.push(x * Math.cos(theta) - y * Math.sin(theta));
    out.push(x * Math.sin(theta) + y * Math.cos(theta));
  }
  return out;
}

/** Compute the rotation angle (in radians) for pair k at position p. */
export function rotationAngle(pairIdx: number, position: number): number {
  return position * PAIR_FREQUENCIES[pairIdx]!;
}

/** Format an angle in radians as a nice string, modulo 2π. */
export function formatAngle(theta: number): string {
  const mod = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return `${mod.toFixed(2)} rad`;
}

/** Format the period for a pair. */
export function formatPeriod(period: number): string {
  if (period < 100) return `${period.toFixed(1)} positions`;
  return `${Math.round(period).toLocaleString()} positions`;
}
```

#### A2. Visual layout

```
ViewBox: 0 0 800 600

┌────────────────────────────────────────────────────────────────────┐
│  RoPE rotation — Q vectors rotated by position-dependent angles    │
│                                                                    │
│  Position p: [────●──────────────] 12     Reset                    │
│                                                                    │
│  ┌────────────┬────────────┬────────────┬────────────┐            │
│  │ Pair 0     │ Pair 1     │ Pair 2     │ Pair 3     │            │
│  │ d0, d1     │ d2, d3     │ d4, d5     │ d6, d7     │            │
│  │ ω = 1.000  │ ω = 0.316  │ ω = 0.100  │ ω = 0.032  │            │
│  │            │            │            │            │            │
│  │   ┌─────┐  │   ┌─────┐  │   ┌─────┐  │   ┌─────┐  │            │
│  │   │     │  │   │     │  │   │     │  │   │     │  │            │
│  │   │  ↗  │  │   │   ↘ │  │   │ ←   │  │   │↑    │  │            │
│  │   │     │  │   │     │  │   │     │  │   │     │  │            │
│  │   └─────┘  │   └─────┘  │   └─────┘  │   └─────┘  │            │
│  │            │            │            │            │            │
│  │ θ = 12 rad │ θ = 3.8rad │ θ = 1.2rad │ θ = 0.4rad │            │
│  │ period: 6  │ period: 20 │ period: 63 │ period:198 │            │
│  └────────────┴────────────┴────────────┴────────────┘            │
│                                                                    │
│  Description:                                                      │
│  Each pair of adjacent dimensions in Q forms a 2D vector that      │
│  gets rotated by an angle proportional to position × frequency.    │
│  Low pairs rotate quickly (short period); high pairs rotate        │
│  slowly (long period). The original Q vector at position 0 is      │
│  shown dimmed; the current rotated Q is highlighted in cyan.       │
└────────────────────────────────────────────────────────────────────┘
```

**Each pair-circle shows:**
- A unit circle (radius ~50px) centered at origin
- The original 2D vector (Q at position 0) — drawn in dim gray
- The current rotated 2D vector (Q at the slider's position) — drawn in cyan
- An arc connecting them, indicating the rotation angle
- Labels: pair index, dimensions (e.g. "d0, d1"), frequency, current angle, period

**Interaction:** drag the position slider → all 4 pair-circles update their rotated vectors. The rate of rotation differs per pair (pair 0 rotates much faster than pair 3 for the same position change).

#### A3. `RoPERotation.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  BASE_Q, N_PAIRS, MAX_POSITION,
  PAIR_FREQUENCIES, PAIR_PERIODS,
  rotateQ, rotationAngle, formatAngle, formatPeriod,
} from './rope-data';
import styles from './RoPERotation.module.css';

const CIRCLE_SIZE = 140;   // svg viewbox dimensions per pair-circle
const VEC_LENGTH = 50;     // logical vector length in svg units

export default function RoPERotation() {
  const [position, setPosition] = useState(12);

  const rotatedQ = useMemo(() => rotateQ(position), [position]);

  return (
    <div className={styles.widget}>
      {/* Position slider */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Position p: <span className={styles.controlValue}>{position}</span>
          </label>
          <input
            type="range"
            min={0}
            max={MAX_POSITION}
            value={position}
            onChange={e => setPosition(Number(e.target.value))}
            className={styles.slider}
            aria-label="Position"
          />
        </div>
        <button onClick={() => setPosition(12)} className={styles.resetButton}>Reset</button>
      </div>

      {/* 4 pair-circles in a row */}
      <div className={styles.pairsRow}>
        {Array.from({ length: N_PAIRS }, (_, k) => {
          const omega = PAIR_FREQUENCIES[k]!;
          const period = PAIR_PERIODS[k]!;
          const theta = rotationAngle(k, position);
          const originalX = BASE_Q[2 * k]!;
          const originalY = BASE_Q[2 * k + 1]!;
          const rotatedX = rotatedQ[2 * k]!;
          const rotatedY = rotatedQ[2 * k + 1]!;

          return (
            <PairCircle
              key={k}
              pairIdx={k}
              omega={omega}
              period={period}
              theta={theta}
              originalX={originalX}
              originalY={originalY}
              rotatedX={rotatedX}
              rotatedY={rotatedY}
            />
          );
        })}
      </div>

      {/* Description */}
      <div className={styles.description}>
        <strong>RoPE rotates each pair of dimensions by an angle proportional to position × frequency.</strong>{' '}
        Low pairs (e.g. pair 0) rotate quickly — full revolution every ~6 positions. High pairs (e.g. pair 3) rotate slowly — full revolution every ~200 positions. The original Q vector at position 0 is shown dimmed; the rotated Q at the current position is highlighted in cyan. RoPE has no learned parameters — the rotation is fully determined by position and dimension.
      </div>
    </div>
  );
}

interface PairCircleProps {
  pairIdx: number;
  omega: number;
  period: number;
  theta: number;
  originalX: number;
  originalY: number;
  rotatedX: number;
  rotatedY: number;
}

function PairCircle({ pairIdx, omega, period, theta, originalX, originalY, rotatedX, rotatedY }: PairCircleProps) {
  // Convert vector to SVG coordinates (origin at center, y flipped for screen)
  const cx = CIRCLE_SIZE / 2;
  const cy = CIRCLE_SIZE / 2;

  // Scale vectors so they're visible in the circle. The base vectors are roughly unit length.
  const originalScreenX = cx + originalX * VEC_LENGTH;
  const originalScreenY = cy - originalY * VEC_LENGTH;     // flip y
  const rotatedScreenX = cx + rotatedX * VEC_LENGTH;
  const rotatedScreenY = cy - rotatedY * VEC_LENGTH;

  return (
    <div className={styles.pairCard}>
      <div className={styles.pairHeader}>
        <div className={styles.pairTitle}>Pair {pairIdx}</div>
        <div className={styles.pairSubtitle}>d{2 * pairIdx}, d{2 * pairIdx + 1}</div>
        <div className={styles.pairFreq}>ω = {omega.toFixed(3)}</div>
      </div>

      <svg viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`} className={styles.pairSvg} role="img">
        {/* Unit circle reference */}
        <circle cx={cx} cy={cy} r={VEC_LENGTH} className={styles.unitCircle} />
        {/* Origin axes */}
        <line x1={0} x2={CIRCLE_SIZE} y1={cy} y2={cy} className={styles.axis} />
        <line x1={cx} x2={cx} y1={0} y2={CIRCLE_SIZE} className={styles.axis} />

        {/* Original vector (dimmed) */}
        <line
          x1={cx} y1={cy}
          x2={originalScreenX} y2={originalScreenY}
          className={styles.originalVector}
        />
        <circle cx={originalScreenX} cy={originalScreenY} r={3} className={styles.originalDot} />

        {/* Rotated vector (cyan, prominent) */}
        <line
          x1={cx} y1={cy}
          x2={rotatedScreenX} y2={rotatedScreenY}
          className={styles.rotatedVector}
        />
        <circle cx={rotatedScreenX} cy={rotatedScreenY} r={4} className={styles.rotatedDot} />

        {/* Rotation arc (small, just to show direction) */}
        {/* Optional: draw an arc from original to rotated showing the rotation direction */}
      </svg>

      <div className={styles.pairFooter}>
        <div>θ = {formatAngle(theta)}</div>
        <div>period: {formatPeriod(period)}</div>
      </div>
    </div>
  );
}
```

#### A4. `RoPERotation.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.controls {
  display: flex;
  align-items: end;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
}
.controlGroup { flex: 1; min-width: 240px; }
.controlLabel {
  display: block;
  margin-bottom: 0.35rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.controlValue { color: var(--cyan-300); font-weight: 500; }
.slider { width: 100%; }
.resetButton {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.resetButton:hover { color: var(--cyan-300); border-color: var(--cyan-500); }

.pairsRow {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.pairCard {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pairHeader {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
}
.pairTitle {
  font-size: 0.85rem;
  color: var(--cyan-300);
  font-weight: 500;
}
.pairSubtitle {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}
.pairFreq {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.pairSvg {
  width: 100%;
  height: auto;
}

.unitCircle {
  fill: none;
  stroke: var(--border-default);
  stroke-width: 1;
  stroke-dasharray: 2 2;
}
.axis {
  stroke: var(--border-subtle);
  stroke-width: 0.5;
}

.originalVector {
  stroke: var(--text-tertiary);
  stroke-width: 1.5;
  opacity: 0.6;
}
.originalDot {
  fill: var(--text-tertiary);
  opacity: 0.6;
}

.rotatedVector {
  stroke: var(--cyan-400);
  stroke-width: 2.5;
  transition: stroke 100ms;
}
.rotatedDot {
  fill: var(--cyan-400);
}

.pairFooter {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.description {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.description strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .pairsRow { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .pairsRow { grid-template-columns: 1fr; }
  .controls { flex-direction: column; gap: 0.75rem; }
}
```

#### A5. Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
export { default as AutogradGraph } from './ch01/AutogradGraph';
export { default as EmbeddingSpace } from './ch02/EmbeddingSpace';
export { default as Word2VecDynamics } from './ch02/Word2VecDynamics';
export { default as BPETraining } from './ch03/BPETraining';
export { default as TokenizerComparison } from './ch03/TokenizerComparison';
export { default as AttentionHeatmap } from './ch04/AttentionHeatmap';
export { default as CausalMask } from './ch04/CausalMask';
export { default as MultiHeadDecomposition } from './ch05/MultiHeadDecomposition';
export { default as TransformerBlockFlow } from './ch05/TransformerBlockFlow';
export { default as SinusoidalPE } from './ch06/SinusoidalPE';
export { default as RoPERotation } from './ch06/RoPERotation';
```

#### A6. Update `index.mdx` — section 5 widget

```mdx
import { SinusoidalPE, RoPERotation } from '@components/widgets';
```

```mdx
<WidgetFrame title="RoPE rotation" caption="RoPE rotates each pair of adjacent dimensions in Q (and K) by an angle proportional to position × frequency. Drag the position slider to see all 4 pairs rotate at their own rate — low pairs rotate quickly, high pairs slowly. The rotation has no learned parameters; angles are determined by position and pair index.">
  <RoPERotation client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 8 ("What we have — everything except training") and the final chapter close paragraph:

````mdx
## Exercises

The exercises build on the chapter. Each is a self-contained problem with a starting template. Hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Compute sinusoidal PE and verify the structure

Compute sinusoidal positional encoding for several positions. Verify that (a) PE values are in [-1, 1], (b) adjacent dimensions form sin/cos pairs at the same frequency, (c) the leftmost dimensions oscillate quickly and the rightmost slowly.

<details>
<summary>Hint</summary>

PE(p, 2k) = sin(p / 10000^(2k/d_model)); PE(p, 2k+1) = cos(p / 10000^(2k/d_model)). Verify pair structure by checking that PE[p, 2k]² + PE[p, 2k+1]² ≈ 1 for all p, k (since (sin θ)² + (cos θ)² = 1).

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def sinusoidal_pe(max_len, d_model, base=10000.0):
    # TODO: implement
    pass

# Test (a): all values in [-1, 1]
PE = sinusoidal_pe(max_len=100, d_model=64)
# print(f"PE range: [{PE.min():.3f}, {PE.max():.3f}]  (expect ≈ [-1, 1])")

# Test (b): adjacent dims form sin/cos pairs at the same frequency
# Verify PE[:, 0]^2 + PE[:, 1]^2 ≈ 1 for all positions
# TODO: compute pair-sum-of-squares, verify

# Test (c): leftmost dims oscillate fast, rightmost slow
# Verify that PE[0, 0] differs a lot from PE[1, 0] (fast)
# but PE[0, 62] is close to PE[1, 62] (slow)
# TODO: print PE differences for dim 0 vs dim 62
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Why learned PE doesn't extrapolate

Train a tiny learned PE (random init) on positions 0-31 and try to use it at position 64. Demonstrate that there's no meaningful "position 64 embedding"; the model has no information about positions it wasn't trained on. Then compare to sinusoidal PE at the same position — sinusoidal gives a well-defined value, even though it wasn't seen during "training" (a learned PE wasn't trained on it).

<details>
<summary>Hint</summary>

For learned PE, position 64 has no entry in the 32-position embedding table. Any value you put there is arbitrary (typically: out-of-bounds error, or zero-padded, or random). For sinusoidal PE, the formula gives a value for position 64 even if you never used it during a hypothetical training pass — the formula is deterministic.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

d_model = 32
trained_len = 32

# Learned PE — random init for the "trained" range
rng = np.random.default_rng(42)
learned_pe = rng.normal(0, 0.02, (trained_len, d_model))

# Sinusoidal PE — formula-based, well-defined for any position
def sinusoidal_pe_at(p, d_model, base=10000.0):
    pe = np.zeros(d_model)
    k_indices = np.arange(0, d_model, 2)
    inv_freq = 1.0 / (base ** (k_indices / d_model))
    pe[0::2] = np.sin(p * inv_freq)
    pe[1::2] = np.cos(p * inv_freq)
    return pe

# Position 16 (in-range for learned PE)
# print(f"Learned PE at p=16: {learned_pe[16][:5].round(3)} ...")
# print(f"Sinusoidal PE at p=16: {sinusoidal_pe_at(16, d_model)[:5].round(3)} ...")

# Position 64 (out-of-range for learned PE)
# TODO: try to access learned_pe[64] — what happens?
# TODO: compute sinusoidal PE at p=64 — what's the result?

# Conclusion: sinusoidal extrapolates by formula; learned PE doesn't have any
# value for unseen positions.
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Implement RoPE and verify the relative-position property

Implement RoPE: rotate Q and K vectors by position-dependent angles before computing attention scores. Verify the key property: for fixed offset n - m, the dot product `RoPE(q, m) · RoPE(k, n)` is the same regardless of m.

<details>
<summary>Hint</summary>

Treat the d_k-dimensional Q vector as d_k/2 pairs of 2D vectors. For position p and pair k, rotate the k-th pair by angle p × omega_k where omega_k = 1 / 10000^(2k/d_k). Apply the same to K. Then compute the dot product. Test at offsets (0, 5), (3, 8), (10, 15) — all have relative offset 5, so dot products should be equal.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def rope(x, position_ids, base=10000.0):
    """Apply RoPE to (seq_len, d_k) tensor."""
    # TODO: compute frequencies (inv_freq), angles, cos/sin
    # TODO: split x into even/odd dim halves
    # TODO: apply 2D rotation per pair, interleave back
    pass

# Verify relative-position property
d_k = 8
rng = np.random.default_rng(42)
q = rng.normal(0, 1, (1, d_k))
k = rng.normal(0, 1, (1, d_k))

# Test pairs all with relative offset = 5
pairs = [(0, 5), (3, 8), (10, 15), (50, 55)]
print("Dot products should all be equal (relative offset = 5):")
for m, n in pairs:
    # q_rot = rope(q, np.array([m]))
    # k_rot = rope(k, np.array([n]))
    # dot = (q_rot @ k_rot.T)[0, 0]
    # print(f"  q@pos{m}, k@pos{n}: dot = {dot:.6f}")
    pass

# All values should be identical (up to floating-point error).
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — ALiBi and length extrapolation

Implement ALiBi attention scores: standard scaled dot-product attention plus a linear-distance bias. Demonstrate that the bias pattern is well-defined at any sequence length — even lengths far beyond training. Compute the attention pattern on a 16-position sequence with the bias; verify the bias is monotonically negative with distance.

<details>
<summary>Hint</summary>

ALiBi adds `-m_h * |query_pos - key_pos|` to each attention score, where m_h is a head-specific slope (typically `2^(-8h/n_heads)`). For seq_len=16 and 4 heads, build the bias matrix as `(n_heads, seq_len, seq_len)`. Add it to your scaled dot-product attention scores. After softmax, attention should be concentrated near the query position with smooth decay.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def alibi_bias(seq_len, n_heads):
    """Return (n_heads, seq_len, seq_len) ALiBi bias matrix."""
    # TODO: compute head slopes (2^(-8h/n_heads) for h = 1..n_heads)
    # TODO: compute distance matrix |m - n|
    # TODO: bias = -slope * distance
    pass

def attention_with_alibi(Q, K, V, n_heads):
    """Multi-head attention with ALiBi bias added to scores."""
    # TODO: compute standard scaled dot-product attention scores
    # TODO: add ALiBi bias
    # TODO: softmax + multiply V
    pass

# Test: ALiBi bias is well-defined at any seq_len
seq_len, n_heads = 16, 4
bias = alibi_bias(seq_len, n_heads)
# print(f"Bias shape: {bias.shape}")
# print(f"Head 0 row 8 (distance from position 8 to each other position):")
# print(bias[0, 8].round(3))
# Expect: a V-shape — 0 at position 8, monotonically decreasing as you move away

# Verify length-extrapolation safety: bias formula works at seq_len = 1024
# bias_long = alibi_bias(1024, n_heads)
# print(f"Long-context bias shape: {bias_long.shape}  (works without retraining)")
`}
  packages={["numpy"]}
/>
````

### Part C — Flip Ch 6's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 6, slug: 'ch06-positional-encoding', title: 'Positional encoding', partNum: 2, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 5 of Ch 6** renders with the working `RoPERotation` widget. Section 2's marquee still works.
3. **Default state:** position slider at 12; all 4 pair-circles show original vectors (dimmed) and rotated vectors (cyan). Description visible below.
4. **Drag position slider 0 → 50:** all 4 vectors rotate. Pair 0 (ω = 1.0) completes multiple full rotations; pair 3 (ω ≈ 0.032) barely rotates.
5. **At position 0:** rotated vector overlaps with original vector exactly (θ = 0 for all pairs).
6. **Annotations correct:** ω, θ, and period displayed accurately. Period for pair 0 ≈ 6.3 positions; pair 3 ≈ 198 positions.
7. **The Exercises section** is below section 8 and above the chapter close paragraph; contains 4 sub-exercises with collapsible hints and runnable starter code.
8. **Sidebar:** Ch 1-6 all active (published); Ch 7-30 still dimmed.
9. **Landing page CTA:** still reads "Start with Chapter 1 →".
10. **Prev/next at bottom of Ch 6:** prev = Ch 5 (active); next = Ch 7 (disabled).
11. **TOC on Ch 6** includes Exercises as h2 plus 4 h3 sub-entries.
12. **Mobile:** 4 pair-circles collapse to 2×2 at < 720px and 1×4 at < 480px.
13. **`npm run typecheck`** passes.
14. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement a relative-position demo in the widget.** The runnable code in section 5 verifies this property numerically — more rigorous than a widget could show.
- ❌ **Do not implement the K vector rotation** as a separate visual. The chapter prose already covers that Q and K rotate the same way.
- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 6 flips.
- ❌ **Do not modify Ch 1-5.** Sealed.

---

## Wire-up

```bash
git add src/components/widgets/ch06/RoPERotation.tsx src/components/widgets/ch06/RoPERotation.module.css src/components/widgets/ch06/rope-data.ts src/components/widgets/index.ts src/lib/chapters.ts src/pages/ch06-positional-encoding/index.mdx
git commit -m "session 30: RoPE rotation widget + Ch 6 exercises + status: published"
git push origin main
```

After deploy, verify both Ch 6 widgets work and all 4 exercises render.

---

## Phase 8 closeout

This session closes **Phase 8**. **Chapter 6 is the sixth complete chapter on production. The architectural half of the tutorial (Ch 1-6) is now complete.**

Confirm before declaring Phase 8 complete:

- ✅ BUILD_ORDER.md shows files 38-41 (Phase 8) all ✅
- ✅ File 42 marked ⏭️ (absorbed)
- ✅ Ch 6 status is `'published'`
- ✅ Both Ch 6 widgets work in production
- ✅ All 4 Ch 6 exercises render with working starter code
- ✅ Ch 6 total word count is in the 4500-5500 range
- ✅ Lighthouse scores green on `/ch06-positional-encoding/`

**Phase 8 retrospective notes:**

Ch 6 fit the 4-file cadence cleanly. Despite covering four PE variants (sinusoidal, learned, RoPE, ALiBi), the chapter is one-topic-with-variants rather than two genuine topics — Ch 5's 5-file structure isn't needed here.

**Cadence summary across all 6 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual-heavy | 2 | 4 |
| Ch 5 | Two-topic (multi-head + block) | 2 | 5 |
| Ch 6 | Variants of one topic (PE) | 2 | 4 |

**Six chapters → architectural completion.** Ch 1-6 covers every architectural piece of a transformer:
1. Neural net primitives (Ch 1) — gradients, autograd, optimizers
2. Embeddings (Ch 2) — token vectors
3. Tokenization (Ch 3) — string → integer mapping
4. Attention (Ch 4) — the centerpiece operation
5. Multi-head + block (Ch 5) — the layer that stacks
6. Positional encoding (Ch 6) — the structural gap

After Ch 6, the reader has every architectural piece needed to build a transformer from scratch. Phase 9 (Ch 7+) shifts to training — what turns random initial weights into a working LLM.

**The architectural half is done. The training half begins.**

---

## Notes for the session author

**On the 4 pair-circles design:**
RoPE operates on pairs of adjacent dimensions. With d_k = 8, there are 4 pairs. Each pair gets its own 2D circle showing the rotation. This is the natural way to visualize RoPE because the math itself is pair-by-pair — showing 4 separate rotations makes that structural fact concrete.

**On the rotation rates being visually different:**
Pair 0 (ω = 1.000) rotates fast — at position 50, it has rotated 50 radians, or about 8 full revolutions. Pair 3 (ω ≈ 0.032) rotates slow — at position 50, it has rotated only ~1.6 radians (about a quarter turn). The visual difference between fast and slow rotation across the 4 pairs is the chapter's key claim made spatial.

**On the "original" vs "rotated" vectors per pair:**
Each pair shows two vectors: the original Q at position 0 (dimmed gray) and the rotated Q at the current position (cyan, prominent). Without the original, the user has nothing to compare against. With both visible, the rotation is visible. Don't omit the original.

**On the unit circle background:**
The dashed unit circle (radius = 1 in vector space) provides reference. The base Q vector has length ≈ 1 (hand-tuned for visual fit). The rotation preserves length — the rotated vector also has length ≈ 1, on the same circle.

**On the period annotation:**
Period = 2π / ω. For pair 0, period ≈ 6.3 positions. For pair 3, period ≈ 198 positions. Display in human-readable form. The period is what tells the reader "this pair completes a full rotation every X positions" — the most intuitive way to grasp the frequency.

**On the 4 exercises:**
- Exercise 1 (sinusoidal properties) verifies the formula structure. The pair-sum-of-squares = 1 verification is the kind of "wait, that's neat" moment that makes the design click.
- Exercise 2 (learned PE doesn't extrapolate) makes MC3 concrete by *trying to fail*. Position 64 with a 32-position learned PE is an actual error.
- Exercise 3 (RoPE relative-position) is the chapter's capstone implementation. Same verification as the section 5 runnable; reader implements it themselves.
- Exercise 4 (ALiBi) extends to the linear-bias variant. The "length extrapolation safety" check at seq_len=1024 demonstrates that the bias formula has no hidden length constraints.

**On Ch 6 being the architectural finish line:**
After Ch 6, every architectural piece of a transformer has been covered. Ch 7+ shifts focus from "what is the model" to "how do we train it." This is a meaningful pedagogical inflection point — the reader has all the parts and can assemble a transformer; what's left is making it actually learn from data.

**Phase 8 closeout. Phase 9 begins on the next file (Ch 7, whatever topic that turns out to be).**
