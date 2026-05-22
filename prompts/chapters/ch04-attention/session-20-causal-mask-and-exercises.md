# Session 20 — Causal mask widget + exercises + Ch 4 closeout

> Final Chapter 4 session. Three deliverables: the **CausalMask** widget for section 6 (toggle between bidirectional and causally-masked attention on the same 6-token sequence, with the lower-triangular mask matrix visible alongside), an **Exercises section** at chapter end with 4 problems, and the **status flip** from `'draft'` to `'published'`. **End of Phase 6 — the most important chapter on production.**

---

## Read first (in this order)

1. **`research/ch04-attention/research.md`** — Derivation 4 (causal masking via additive infinity) is the reference
2. **`prompts/chapters/ch04-attention/session-18-page-structure.md`** — for the section-6 widget placeholder and where the Exercises section goes
3. **`prompts/chapters/ch04-attention/session-19-attention-heatmap-widget.md`** — for the widget conventions established by Ch 4's marquee (especially the matrix-cell rendering, color scales, hover readout)
4. **`prompts/chapters/ch03-tokenization/session-16-tokenizer-comparison-and-exercises.md`** — for the chapter-closeout template

---

## Goal

By end of session:

1. **Section 6's `<WidgetFrame>` placeholder is filled** with `<CausalMask client:visible />` — a comparison widget showing the same attention computation with and without the causal mask, plus the mask matrix itself
2. **An "Exercises" section is appended** to `index.mdx`, between section 9 and the chapter close paragraph, containing 4 exercises with hints and starter `<RunnableCode>` blocks
3. **Ch 4's status flips from `'draft'` to `'published'`** — adding the fourth published chapter to the site
4. **The chapter renders end-to-end as a complete deliverable**

After this session, Chapter 4 is the fourth complete chapter on production. **Phase 6 closes.**

---

## Inputs

State of the repo after session 19:

- `src/components/widgets/ch04/AttentionHeatmap.{tsx,module.css}` and `attention-data.ts` exist (session 19)
- `src/components/widgets/index.ts` exports `AttentionHeatmap`
- Section 3's marquee widget is wired in `index.mdx`
- Section 6's widget is still stubbed
- `src/lib/chapters.ts` has Ch 1-3 `'published'`, Ch 4 `'draft'`, others `'planned'`

---

## Deliverables

1. **Create** `src/components/widgets/ch04/CausalMask.tsx` — the React widget
2. **Create** `src/components/widgets/ch04/CausalMask.module.css` — scoped styles
3. **Update** `src/components/widgets/ch04/attention-data.ts` — export the masked attention computation (additive function over the existing data)
4. **Update** `src/components/widgets/index.ts` — add `CausalMask` export
5. **Update** `src/pages/ch04-attention/index.mdx`:
   - Replace section 6's `<WidgetFrame>` interior with `<CausalMask client:visible />`
   - Add new `## Exercises` section between section 9 and the final chapter close
6. **Update** `src/lib/chapters.ts` — change Ch 4's `status` from `'draft'` to `'published'`

---

## Detailed spec

### Part A — Extend `attention-data.ts`

Add the masked computations as exports. The widget reuses the existing X, Q, K, V, scaled scores from session 19; this session adds the mask matrix, masked scores, and masked weights.

Append the following to `src/components/widgets/ch04/attention-data.ts`:

```ts
// ---------------------------------------------------------------------------
// Causal mask computation (appended for session 20)
// ---------------------------------------------------------------------------

/**
 * The causal mask: 0 on or below the diagonal; -Infinity strictly above.
 * Added to scores before softmax — illegal positions become 0 in the
 * post-softmax weights.
 */
export const CAUSAL_MASK: number[][] = (() => {
  const m: number[][] = [];
  for (let i = 0; i < N; i++) {
    const row: number[] = [];
    for (let j = 0; j < N; j++) {
      row.push(j > i ? -Infinity : 0);
    }
    m.push(row);
  }
  return m;
})();

/**
 * For display purposes: a numeric representation of the mask that's friendly
 * to the diverging color scale. -Infinity is hard to render; we use a sentinel
 * value (-1000) that the widget interprets as "blocked".
 */
export const CAUSAL_MASK_DISPLAY: number[][] = (() => {
  const m: number[][] = [];
  for (let i = 0; i < N; i++) {
    const row: number[] = [];
    for (let j = 0; j < N; j++) {
      row.push(j > i ? -1000 : 0);   // 0 = allow, -1000 = block
    }
    m.push(row);
  }
  return m;
})();

/** Scaled scores with the causal mask added (still pre-softmax). */
export const MASKED_SCALED_SCORES: number[][] = SCALED_SCORES.map((row, i) =>
  row.map((v, j) => j > i ? -Infinity : v)
);

/** Post-softmax attention weights with the causal mask applied. */
export const MASKED_ATTENTION_WEIGHTS: number[][] = (() => {
  return MASKED_SCALED_SCORES.map(row => {
    // Softmax with -Infinity entries: exp(-inf) = 0; row sums over valid entries only
    const validMax = Math.max(...row.filter(v => v !== -Infinity));
    const exps = row.map(v => v === -Infinity ? 0 : Math.exp(v - validMax));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => sum === 0 ? 0 : v / sum);
  });
})();

/** Output computed from the masked attention weights. */
export const MASKED_OUTPUT: number[][] = (() => {
  // matmul(MASKED_ATTENTION_WEIGHTS, V)
  const m = MASKED_ATTENTION_WEIGHTS.length, n = V[0]!.length, p = V.length;
  const out: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < p; k++) s += MASKED_ATTENTION_WEIGHTS[i]![k]! * V[k]![j]!;
      out[i]![j] = s;
    }
  }
  return out;
})();
```

### Part B — Visual layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Causal masking                                                      │
│                                                                      │
│  [● Bidirectional]  [○ Causal masked]    ← toggle                    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Mask matrix                                                  │    │
│  │ ──────────                                                   │    │
│  │    the cat sat on  the mat                                   │    │
│  │ the [0][⊥][⊥][⊥][⊥][⊥]                                       │    │
│  │ cat [0][0][⊥][⊥][⊥][⊥]                                       │    │
│  │ sat [0][0][0][⊥][⊥][⊥]                                       │    │
│  │ on  [0][0][0][0][⊥][⊥]                                       │    │
│  │ the [0][0][0][0][0][⊥]                                       │    │
│  │ mat [0][0][0][0][0][0]                                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────┬──────────────────────────┐            │
│  │ Bidirectional attention  │ Causal-masked attention  │            │
│  │ (no mask)                │ (mask applied)           │            │
│  │ ────────────────────     │ ──────────────────────   │            │
│  │ [matrix]                 │ [matrix]                 │            │
│  │                          │                          │            │
│  │ Each row sums to 1;     │ Each row sums to 1;     │            │
│  │ all positions attended.  │ upper triangle is zero.  │            │
│  └──────────────────────────┴──────────────────────────┘            │
│                                                                      │
│  Description:                                                        │
│  When the toggle is OFF, attention is bidirectional — every position │
│  attends to every other position. When ON, the causal mask zeros     │
│  out the upper triangle, restricting each position to only past      │
│  positions (autoregressive generation).                              │
└──────────────────────────────────────────────────────────────────────┘
```

The toggle highlights the active mode; the two attention matrices are shown side-by-side at all times; the mask matrix is above them as reference.

### Part C — `CausalMask.tsx`

```tsx
import { useState } from 'react';
import {
  TOKENS, N,
  ATTENTION_WEIGHTS,
  MASKED_ATTENTION_WEIGHTS,
  CAUSAL_MASK_DISPLAY,
} from './attention-data';
import styles from './CausalMask.module.css';

type MaskMode = 'bidirectional' | 'causal';

export default function CausalMask() {
  const [mode, setMode] = useState<MaskMode>('bidirectional');
  const [hovered, setHovered] = useState<{ matrix: string; i: number; j: number; v: number } | null>(null);

  return (
    <div className={styles.widget}>
      {/* Mode toggle */}
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Attention mode:</span>
        <button
          onClick={() => setMode('bidirectional')}
          className={`${styles.toggleButton} ${mode === 'bidirectional' ? styles.toggleButtonActive : ''}`}
          aria-pressed={mode === 'bidirectional'}
        >
          Bidirectional (no mask)
        </button>
        <button
          onClick={() => setMode('causal')}
          className={`${styles.toggleButton} ${mode === 'causal' ? styles.toggleButtonActive : ''}`}
          aria-pressed={mode === 'causal'}
        >
          Causal masked
        </button>
      </div>

      {/* Mask matrix — fades when toggle is "bidirectional" */}
      <div className={`${styles.maskPanel} ${mode === 'causal' ? styles.maskPanelActive : styles.maskPanelDimmed}`}>
        <div className={styles.panelTitle}>Mask matrix (lower-triangular)</div>
        <MaskMatrixView
          tokens={TOKENS}
          mask={CAUSAL_MASK_DISPLAY}
          setHovered={setHovered}
        />
        <div className={styles.panelHint}>
          0 = allow attention · ⊥ (-∞) = blocked
        </div>
      </div>

      {/* Two attention matrices side by side */}
      <div className={styles.attentionRow}>
        <div className={`${styles.attentionPanel} ${mode === 'bidirectional' ? styles.panelActive : styles.panelDimmed}`}>
          <div className={styles.panelTitle}>Bidirectional</div>
          <AttentionMatrixView
            tokens={TOKENS}
            weights={ATTENTION_WEIGHTS}
            label="bidirectional"
            setHovered={setHovered}
          />
          <div className={styles.panelHint}>
            Every row sums to 1; every position attends to all positions
          </div>
        </div>

        <div className={`${styles.attentionPanel} ${mode === 'causal' ? styles.panelActive : styles.panelDimmed}`}>
          <div className={styles.panelTitle}>Causal masked</div>
          <AttentionMatrixView
            tokens={TOKENS}
            weights={MASKED_ATTENTION_WEIGHTS}
            label="causal"
            setHovered={setHovered}
          />
          <div className={styles.panelHint}>
            Each row sums to 1; only positions ≤ row index get non-zero weight
          </div>
        </div>
      </div>

      {/* Description */}
      <div className={styles.description} aria-live="polite">
        {mode === 'bidirectional' ? (
          <>
            <strong>Bidirectional attention:</strong> every position attends to every other position. Used in encoder models like BERT, where the model sees the entire sequence at once. Inappropriate for autoregressive generation — the model would "see" tokens it's supposed to predict.
          </>
        ) : (
          <>
            <strong>Causal-masked attention:</strong> position i may only attend to positions j ≤ i. Implemented by adding -∞ to the upper triangle of the scaled scores before softmax. exp(-∞) = 0, so blocked positions contribute exactly 0 weight. Required for autoregressive generation (GPT-style models).
          </>
        )}
      </div>

      {/* Hover readout */}
      {hovered && (
        <div className={styles.hoverReadout}>
          {hovered.matrix}[{hovered.i},{hovered.j}] = <strong>{hovered.v.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

function MaskMatrixView({ tokens, mask, setHovered }: {
  tokens: string[];
  mask: number[][];
  setHovered: (h: { matrix: string; i: number; j: number; v: number } | null) => void;
}) {
  return (
    <div className={styles.matrixGrid} style={{ gridTemplateColumns: `auto repeat(${tokens.length}, 32px)` }}>
      <div></div>
      {tokens.map((t, j) => <div key={j} className={styles.colLabel}>{t}</div>)}
      {mask.map((row, i) => (
        <RowFragment key={i} rowLabel={tokens[i]!}>
          {row.map((v, j) => (
            <div
              key={j}
              className={styles.maskCell}
              style={{
                backgroundColor: v === 0
                  ? 'color-mix(in srgb, var(--emerald-500) 25%, transparent)'
                  : 'color-mix(in srgb, var(--rose-500) 25%, transparent)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={() => setHovered({ matrix: 'mask', i, j, v: v === 0 ? 0 : -Infinity })}
              onMouseLeave={() => setHovered(null)}
              title={v === 0 ? `allow [${i},${j}]` : `block [${i},${j}] (-∞)`}
            >
              {v === 0 ? '0' : '⊥'}
            </div>
          ))}
        </RowFragment>
      ))}
    </div>
  );
}

function AttentionMatrixView({ tokens, weights, label, setHovered }: {
  tokens: string[];
  weights: number[][];
  label: string;
  setHovered: (h: { matrix: string; i: number; j: number; v: number } | null) => void;
}) {
  return (
    <div className={styles.matrixGrid} style={{ gridTemplateColumns: `auto repeat(${tokens.length}, 32px)` }}>
      <div></div>
      {tokens.map((t, j) => <div key={j} className={styles.colLabel}>{t}</div>)}
      {weights.map((row, i) => (
        <RowFragment key={i} rowLabel={tokens[i]!}>
          {row.map((v, j) => (
            <div
              key={j}
              className={styles.cell}
              style={{ backgroundColor: `rgba(34, 211, 238, ${v.toFixed(3)})` }}
              onMouseEnter={() => setHovered({ matrix: label, i, j, v })}
              onMouseLeave={() => setHovered(null)}
              title={`${label}[${i},${j}] = ${v.toFixed(3)}`}
            />
          ))}
        </RowFragment>
      ))}
    </div>
  );
}

function RowFragment({ rowLabel, children }: { rowLabel: string; children: React.ReactNode }) {
  return (
    <>
      <div className={styles.rowLabel}>{rowLabel}</div>
      {children}
    </>
  );
}
```

### Part D — `CausalMask.module.css`

Match the existing widget CSS conventions. Key new styles:

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.toggleRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.toggleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}
.toggleButton {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 200ms, border-color 200ms, background 200ms;
}
.toggleButton:hover { color: var(--text-primary); border-color: var(--border-strong); }
.toggleButtonActive {
  color: var(--cyan-300);
  border-color: var(--cyan-500);
  background: color-mix(in srgb, var(--cyan-500) 12%, transparent);
}

.maskPanel,
.attentionPanel {
  padding: 0.9rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: opacity 300ms;
}
.maskPanel { margin-bottom: 1rem; }
.attentionRow {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.attentionPanel { flex: 1 1 0; min-width: 240px; }

.maskPanelActive, .panelActive { opacity: 1; }
.maskPanelDimmed, .panelDimmed { opacity: 0.45; }

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
  font-weight: 500;
}
.panelHint {
  margin-top: 0.5rem;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.matrixGrid {
  display: grid;
  gap: 1px;
  background: var(--border-default);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 1px;
}

.cell, .maskCell {
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition: outline-color 150ms;
}
.cell:hover, .maskCell:hover {
  outline: 2px solid var(--cyan-500);
  outline-offset: -2px;
}
.maskCell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}

.colLabel, .rowLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rowLabel { padding-right: 6px; justify-content: flex-end; }

.description {
  margin-top: 0.5rem;
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.description strong { color: var(--cyan-300); font-weight: 500; }

.hoverReadout {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  padding: 0.4rem 0.7rem;
  background: var(--bg-elevated);
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-primary);
  pointer-events: none;
  z-index: 10;
}
.hoverReadout strong { color: var(--cyan-300); }

@media (max-width: 640px) {
  .attentionRow { flex-direction: column; }
  .cell, .maskCell { width: 28px; height: 28px; }
}
```

### Part E — Update `src/components/widgets/index.ts`

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
```

### Part F — Update `src/pages/ch04-attention/index.mdx`

Three edits:

**Edit F1: Update widget imports**

```mdx
import { AttentionHeatmap, CausalMask } from '@components/widgets';
```

**Edit F2: Replace section 6's `<WidgetFrame>` interior**

Find:

```mdx
<WidgetFrame title="Causal masking" caption="...">
  <div style={{ ... }}>
    Widget content — session 20
  </div>
</WidgetFrame>
```

Replace its `<div>` with:

```mdx
<WidgetFrame title="Causal masking" caption="Toggle between bidirectional and causally-masked attention on the same 6-token sequence. The mask matrix (top) shows which positions are blocked; the two attention matrices below show the difference in the resulting patterns.">
  <CausalMask client:visible />
</WidgetFrame>
```

**Edit F3: Add the Exercises section**

Insert between section 9 ("From single-head to multi-head") and the final chapter close paragraph:

````mdx
## Exercises

The exercises build on the chapter. Each is a self-contained problem with a starting template. Hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Verify scaled dot-product attention

Implement scaled dot-product attention from scratch and verify two properties: (a) the attention weights for each row sum to 1, (b) without the √d_k scaling, the softmax produces a much more peaked distribution at large d_k.

<details>
<summary>Hint</summary>

Use the implementation from section 3 as a starting point. For property (a), compute `weights.sum(axis=-1)` — should be all 1s. For property (b), compare `softmax(scores)` to `softmax(scores / sqrt(d_k))` at d_k = 8 vs d_k = 512. The max weight should be much higher without scaling.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def scaled_dot_product_attention(Q, K, V):
    """Return (output, weights). No mask."""
    # TODO: implement scaled dot-product attention
    pass

# Test (a): rows sum to 1
n = 6
d_k = 8
rng = np.random.default_rng(0)
Q = rng.normal(0, 1, (n, d_k))
K = rng.normal(0, 1, (n, d_k))
V = rng.normal(0, 1, (n, d_k))

# TODO: compute attention; check sum
# out, weights = scaled_dot_product_attention(Q, K, V)
# print(f"Row sums: {weights.sum(axis=-1)}")  # expect [1, 1, 1, 1, 1, 1]

# Test (b): peaked softmax at large d_k without scaling
# TODO: at d_k = 8 vs d_k = 512, compare unscaled vs scaled softmax max
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Implement causal masking

Extend your scaled dot-product attention from Exercise 1 to support causal masking. Verify that each position only attends to itself and earlier positions; verify that masked rows still sum to 1.

<details>
<summary>Hint</summary>

Construct a `(n, n)` mask matrix with 0 on or below the diagonal and `-np.inf` strictly above. Add this mask to the scaled scores before softmax. `np.triu(arr, k=1)` produces a matrix with the upper triangle (excluding diagonal); use it to construct the `-inf` mask.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def causal_mask(n):
    """Return (n, n) mask: 0 on/below diagonal, -inf above."""
    # TODO: build the mask
    pass

def causal_attention(Q, K, V):
    """Scaled dot-product attention with causal masking applied."""
    # TODO: compute scores, scale, add mask, softmax, multiply V
    pass

# Test
n = 5
d_k = 8
rng = np.random.default_rng(0)
Q = rng.normal(0, 1, (n, d_k))
K = rng.normal(0, 1, (n, d_k))
V = rng.normal(0, 1, (n, d_k))

# out, weights = causal_attention(Q, K, V)
# print(f"Upper triangle should be all 0:")
# print(weights.round(3))
# print(f"Row sums: {weights.sum(axis=-1)}")  # expect [1, 1, 1, 1, 1]
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Quantify the O(n²) memory cost

Compute the memory required for attention at various sequence lengths. Compare to the memory required for the FFN's largest tensor at the same sequence length. Find the crossover point where attention's memory exceeds FFN's.

<details>
<summary>Hint</summary>

Attention's main memory consumer is the (n, n) scores/weights matrix. FFN's main memory consumer is the intermediate hidden states of shape (n, 4 * d_model) where the factor of 4 is the standard FFN expansion ratio. At d_model = 4096, the crossover is approximately at n ≈ 4 * 4096 = 16384.

</details>

<RunnableCode
  client:visible
  defaultCode={`def attention_memory_bytes(n, dtype_bytes=2):
    """Memory for the n x n attention matrix."""
    # TODO: return the memory in bytes
    pass

def ffn_memory_bytes(n, d_model, dtype_bytes=2, expansion=4):
    """Memory for the intermediate FFN tensor: (n, expansion * d_model)."""
    # TODO: return the memory in bytes
    pass

d_model = 4096
for n in [256, 1024, 4096, 16384, 65536]:
    attn = attention_memory_bytes(n)
    ffn = ffn_memory_bytes(n, d_model)
    print(f"n = {n:>6d}: attn = {attn/1e9:>5.2f} GB, ffn = {ffn/1e9:>5.2f} GB, ratio = {attn/ffn:>5.2f}")

# TODO: find the n where attn = ffn (approximately)
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Implement cross-attention

Implement cross-attention: queries come from one sequence; keys and values from another. Demonstrate it on a toy encoder-decoder setup where the decoder (length 4) attends to an encoder output (length 6). Verify shapes and that the attention works regardless of the two sequences having different lengths.

<details>
<summary>Hint</summary>

The formula is identical to self-attention — `softmax(QK^T / sqrt(d_k)) V` — but Q has shape `(n_dec, d_k)` while K and V have shape `(n_enc, d_k)`. The attention matrix is `(n_dec, n_enc)`, not square. There's no causal masking in standard cross-attention; the decoder attends to the entire encoder output.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def cross_attention(Q, K, V):
    """
    Cross-attention: Q from one sequence, K and V from another.
    Q: (n_dec, d_k)
    K: (n_enc, d_k)
    V: (n_enc, d_v)
    Returns: (n_dec, d_v) output and (n_dec, n_enc) attention weights
    """
    # TODO: compute scaled dot-product attention
    pass

# Toy setup: decoder of length 4 attending to encoder output of length 6
n_dec, n_enc = 4, 6
d_k = 8
rng = np.random.default_rng(42)
Q_dec = rng.normal(0, 1, (n_dec, d_k))
K_enc = rng.normal(0, 1, (n_enc, d_k))
V_enc = rng.normal(0, 1, (n_enc, d_k))

# out, weights = cross_attention(Q_dec, K_enc, V_enc)
# print(f"Output shape: {out.shape}  (expect (4, 8))")
# print(f"Weights shape: {weights.shape}  (expect (4, 6))")
# print(f"Row sums: {weights.sum(axis=-1)}  (expect [1, 1, 1, 1])")
`}
  packages={["numpy"]}
/>
````

### Part G — Flip Ch 4's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 4, slug: 'ch04-attention', title: 'Attention', partNum: 2, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

`getFirstPublishedChapter()` still returns Ch 1; landing CTA still reads "Start with Chapter 1 →".

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 6 of Ch 4** renders with the working `CausalMask` widget. Section 3's marquee widget still works.
3. **Initial state:** "Bidirectional" toggle is active; the bidirectional attention matrix has full opacity; the causal-masked attention matrix is dimmed at 45%; the mask matrix is dimmed.
4. **Click "Causal masked":** the toggle switches; the bidirectional matrix dims; the causal-masked matrix lights up; the mask matrix lights up; description text updates.
5. **Mask matrix visualization:** lower triangle (including diagonal) shows green cells with "0"; upper triangle shows red cells with "⊥". Total 21 zeros (lower triangle) and 15 ⊥'s (strict upper triangle) for n=6.
6. **Verify the causal pattern:** in the causal-masked matrix, every cell strictly above the diagonal is exactly 0 (rendered as transparent in the cyan color scale). Row sums still 1.
7. **Hovering any cell** in any matrix shows the matrix name, indices, and value in the hover readout.
8. **The four exercise blocks render** with collapsible hints and runnable starter code.
9. **Exercise 4's hint** explains the shape change clearly.
10. **Chapter close paragraph** is the final content in the file, AFTER the Exercises section.
11. **Landing page:** CTA still reads "Start with Chapter 1 →".
12. **Sidebar:** Ch 1, Ch 2, Ch 3, Ch 4 all active (published); Ch 5-30 still dimmed.
13. **Prev/next nav at bottom of Ch 4:** prev = Ch 3 (active); next = Ch 5 (disabled).
14. **TOC on Ch 4** includes Exercises as an h2 entry plus 4 h3 entries.
15. **Mobile:** the two attention matrices stack vertically; cells shrink to 28px; toggles still tappable.
16. **`npm run typecheck`** passes.
17. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement cross-attention** as a widget. It's an exercise (Exercise 4), not a chapter visual.
- ❌ **Do not implement multi-head attention.** Ch 5 owns.
- ❌ **Do not add a way to type custom text into the widget.** The hand-tuned matrices only work for the fixed 6-token sequence.
- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 4 flips.
- ❌ **Do not modify Ch 1, 2, or 3.** Sealed.

---

## Wire-up

```bash
git add src/components/widgets/ch04/CausalMask.tsx src/components/widgets/ch04/CausalMask.module.css src/components/widgets/ch04/attention-data.ts src/components/widgets/index.ts src/lib/chapters.ts src/pages/ch04-attention/index.mdx
git commit -m "session 20: causal mask widget + Ch 4 exercises + status: published"
git push origin main
```

After deploy, verify both Ch 4 widgets render correctly and the 4 exercises display with working hints.

---

## Phase 6 closeout

This session closes **Phase 6** per `MASTER_PLAN.md`. **Chapter 4 is the fourth complete chapter on production — and the most important single chapter in the tutorial.**

Confirm before declaring Phase 6 complete:

- ✅ BUILD_ORDER.md shows files 26-29 (Phase 6) all ✅
- ✅ Ch 4 status is `'published'`
- ✅ Both Ch 4 widgets work in production
- ✅ All 4 Ch 4 exercises have working starter code
- ✅ Ch 4 total word count is in the 5500-7500 range
- ✅ Lighthouse scores green on `/ch04-attention/`
- ✅ Bundle size for Ch 4's chunk is reasonable (< 200 KB; the matrices are small)

**Phase 6 retrospective notes:**

Ch 4 fit the 4-session model cleanly. The chapter is dense — 9 sections, the √d_k variance derivation, two widgets, the causal mask, the cross-attention variant — but the file count stayed at 4. This suggests the 4-session cadence absorbs even unusually content-rich chapters.

**Cadence now validated across four chapters:**
- Ch 1 (math/code-heavy, 3 widgets): 5 files
- Ch 2 (concept-heavy, 2 widgets): 4 files
- Ch 3 (algorithm-heavy, 2 widgets): 4 files
- Ch 4 (math + visual-heavy, 2 widgets): 4 files

The 4-session model is the established norm. Ch 1 was the exception (5 files), not the rule.

**Pattern observation across Phase 6:**

The widget-data layer pattern has now been used four times:
- `embedding-data.ts` (Ch 2, hand-tuned coordinates for clean analogy geometry)
- `bpe-corpus.ts` (Ch 3, fixed corpus + algorithm that runs in JS)
- `tokenizer-data.json` (Ch 3, offline-computed real data)
- `attention-data.ts` (Ch 4, hand-tuned matrices for interpretable attention)

These represent three distinct sub-patterns:
1. **Hand-tuned data** for pedagogical clarity (Ch 2's embeddings, Ch 4's attention)
2. **In-browser computation** of small algorithms (Ch 3's BPE)
3. **Offline-precomputed real data** for production fidelity (Ch 3's tokenizer comparisons)

Future chapter widgets will pick from these patterns based on what produces the clearest pedagogical artifact. The decision logic:
- Data needs to be "real" (production-like) AND too heavy for browser → offline pre-compute
- Data is small AND deterministic AND interpretable → hand-tune for clarity
- Algorithm is interesting AND fits in <100ms → compute in browser at mount

---

## Notes for the session author

**On reusing attention-data.ts:** session 19 created the file and computed Q, K, V, scores, scaled scores, weights, and output. Session 20 appends causal mask + masked weights + masked output. The widget data structure stays clean — one file holds everything for both widgets in Ch 4.

**On the side-by-side comparison:** showing both attention matrices simultaneously is the pedagogical move. A toggle that *replaces* one with the other would force the reader to remember the previous state mentally; side-by-side puts both in working memory at once. The dim/highlight pattern emphasizes the active mode without hiding the comparison.

**On the ⊥ symbol for blocked positions:** the perpendicular symbol (⊥, U+22A5) is the closest visual approximation to "blocked" or "undefined" that's also widely supported in monospace fonts. Avoids the math problem of literal `-∞` rendering as a stretched dash on some systems. The color (red-ish for blocked, green for allowed) carries the same information redundantly.

**On Exercise 3 (memory crossover):** this exercise has a precise computational answer (n ≈ 16384 for d_model = 4096). The "find the crossover" instruction guides the reader to compute it. The pedagogical point: attention's O(n²) cost dominates FFN's O(n) cost above a specific crossover, and that crossover is small enough to matter for long-context models (4K → 32K context windows).

**On Exercise 4 (cross-attention):** this is the "extension" exercise — the chapter covers self-attention thoroughly, but cross-attention is a one-line modification (Q from one sequence, K and V from another). The exercise lets the reader implement it themselves rather than reading about it. Standard pedagogical move: "the math is the same; the shapes differ; here's the toy setup."

**On the chapter being complete:**

Chapter 4 is now the fourth complete chapter on the production site — and arguably the most important. Read it end-to-end:
1. The opening establishes attention as the centerpiece
2. Section 3's formula + AttentionHeatmap widget shows the operation mechanically
3. Section 4's √d_k variance argument explains the design choice
4. Section 6's causal masking + CausalMask widget show the autoregressive variant
5. Section 8 establishes the O(n²) cost that motivates Ch 11 and Ch 17

If a reader walks away from Ch 4 able to state the formula, justify √d_k, implement attention in numpy, explain causal masking, distinguish self from cross-attention, and articulate the O(n²) cost — the chapter has done its job. The widgets, code, prose, and exercises all serve these six outcomes.

**Phase 6 closeout. Phase 7 begins on the next file (Ch 5 — Multi-head attention).**
