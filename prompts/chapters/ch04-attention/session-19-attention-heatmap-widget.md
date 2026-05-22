# Session 19 — Attention heatmap marquee widget

> The marquee Chapter 4 widget — and arguably the most important visual in the entire tutorial. Animates the scaled dot-product attention computation step-by-step on a 6-token sequence ("the cat sat on the mat"). Five stages: input embeddings → Q/K/V projections → attention scores → softmax weights → weighted output. The reader watches the central operation of the modern LLM unfold one matrix at a time. Replaces the section-3 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch04-attention/research.md`** — Derivation 1 (the formula) is the reference; the widget visualizes exactly what's described there
2. **`prompts/chapters/ch04-attention/session-18-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch01-neural-net-primitives/session-08-backprop-visualizer.md`** — for the multi-stage animation pattern (BackpropVisualizer uses the same approach)
4. **`prompts/chapters/ch03-tokenization/session-15-bpe-training-widget.md`** — for the loading-then-stage-scrubbing controls pattern

---

## Goal

Replace the `<WidgetFrame title="Scaled dot-product attention">` placeholder in section 3 with a working interactive widget that:

- Visualizes scaled dot-product attention on a fixed 6-token sequence ("the cat sat on the mat") with deliberately hand-tuned Q, K, V matrices that produce an *interpretable* attention pattern (local-neighbor attention)
- Animates through **5 stages** of the computation, each with a description: input embeddings → Q/K/V projections → $QK^\top$ (raw scores) → softmax (attention weights) → weighted sum with $V$ (output)
- Each stage highlights the matrices involved while keeping previous matrices visible (dimmed)
- Cells in every matrix are color-coded by value (blue = negative, white = zero, red = positive; or single-hue for the attention weights which are 0-1)
- Play / pause / scrubber / reset controls
- The "iconic" attention heatmap (stage 4) is the visual the reader remembers — calibrate that step to look beautiful

**End state:** section 3 of Chapter 4 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate the attention computation as a sequence of matrix operations and identify which matrix in the visualization corresponds to each formula term.

---

## Inputs

State of the repo after session 18:

- `src/pages/ch04-attention/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 6)
- `src/lib/chapters.ts` has Ch 4 as `'draft'`
- `src/components/widgets/index.ts` exports widgets for Ch 1, Ch 2, Ch 3
- No `src/components/widgets/ch04/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch04/AttentionHeatmap.tsx` — the React widget
2. **Create** `src/components/widgets/ch04/AttentionHeatmap.module.css` — scoped styles
3. **Create** `src/components/widgets/ch04/attention-data.ts` — fixed Q, K, V matrices and the computed intermediate values
4. **Update** `src/components/widgets/index.ts` — add `AttentionHeatmap` export
5. **Update** `src/pages/ch04-attention/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<AttentionHeatmap client:visible />`

**Do NOT modify:** Ch 1-3 widget files, layout, styling, or scaffolding. Do NOT modify Ch 4's section-6 placeholder (session 20 owns it).

---

## Detailed spec

### Architecture overview

```
src/components/widgets/
├── ch01/...                          (sealed)
├── ch02/...                          (sealed)
├── ch03/...                          (sealed)
└── ch04/
    ├── AttentionHeatmap.tsx          ← new
    ├── AttentionHeatmap.module.css   ← new
    └── attention-data.ts             ← new
```

### 1. `attention-data.ts` — the data layer

The widget shows attention computing on hand-tuned Q, K, V matrices. The hand-tuning isn't a shortcut — it's the pedagogical point. We want the reader to see an attention pattern that looks like real trained attention (locality, syntactic relationships) rather than the random scatter that emerges from arbitrary matrices.

**Dimensions chosen for visual readability:**
- `n = 6` tokens
- `d_model = 6` (input embedding dim)
- `d_k = d_v = 4` (Q, K, V dim)

Six tokens fit on screen comfortably; 4-dimensional Q/K/V vectors are large enough to see structure in but small enough that each cell is legible.

**Target attention pattern** (what we want the user to see at stage 4):
After softmax, each token attends primarily to:
- "the" (pos 0) → itself (no left context)
- "cat" (pos 1) → "the" (det-noun)
- "sat" (pos 2) → "cat" (subj-verb)
- "on" (pos 3) → "sat" (verb-prep)
- "the" (pos 4) → "on" (prep-det)
- "mat" (pos 5) → "the" (det-noun) and "on"

This is local right-to-left attention with some long-range connections, mimicking what a trained model might learn.

**Implementation approach:** hand-construct Q and K such that the dot product `q_i · k_j` is high for the desired attention targets. The simplest way: make `Q[i]` similar to `K[target[i]]`. Then `Q[i] · K[target[i]]` ≈ `||K[target[i]]||²` (large) while `Q[i] · K[other]` is small.

```ts
// src/components/widgets/ch04/attention-data.ts

export const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
export const N = TOKENS.length;
export const D_MODEL = 6;
export const D_K = 4;
export const D_V = 4;
export const SQRT_D_K = Math.sqrt(D_K);

/**
 * Input embeddings X — what would come out of the embedding layer.
 * Each row is one token's embedding in R^6.
 *
 * Hand-set with some structure: the two "the" tokens (rows 0 and 4) are similar;
 * nouns (cat, mat) share a dimension pattern; verbs (sat) and preps (on) are
 * distinguishable.
 */
export const X: number[][] = [
  // the  cat   sat   on    the   mat
  [ 1.0,  0.2, -0.3,  0.1,  0.5, -0.1],   // the (pos 0)
  [ 0.3,  1.0,  0.4, -0.2, -0.1,  0.6],   // cat
  [-0.2,  0.5,  1.0,  0.3, -0.4,  0.1],   // sat
  [ 0.1, -0.3,  0.4,  1.0,  0.2, -0.5],   // on
  [ 1.0,  0.2, -0.3,  0.1,  0.5, -0.1],   // the (pos 4) — same as pos 0
  [ 0.4,  0.9,  0.1, -0.3,  0.2,  0.7],   // mat — similar to "cat"
];

/**
 * Q, K, V projection matrices, learned in a real model.
 * Here: hand-constructed to produce an interpretable attention pattern.
 *
 * Strategy: K is a "key embedding" — small fixed numbers giving each position
 * a distinguishable key. Q is constructed so that Q[i] is similar to K[target[i]]
 * — that's what causes high attention at the desired target.
 */
const W_Q: number[][] = [
  // d_model x d_k = 6 x 4
  [0.5, 0.0, 0.1, 0.2],
  [0.1, 0.6, 0.0, -0.1],
  [-0.1, 0.0, 0.7, 0.1],
  [0.0, -0.2, 0.1, 0.5],
  [0.3, 0.1, -0.1, 0.0],
  [0.1, 0.4, 0.0, 0.3],
];

const W_K: number[][] = [
  // d_model x d_k = 6 x 4
  [0.6, -0.1, 0.0, 0.2],
  [-0.1, 0.7, 0.1, 0.0],
  [0.0, 0.1, 0.6, -0.1],
  [0.2, 0.0, -0.1, 0.5],
  [0.5, 0.1, 0.0, 0.1],
  [0.0, 0.5, 0.1, 0.0],
];

const W_V: number[][] = [
  // d_model x d_v = 6 x 4
  [0.4, 0.2, 0.0, 0.1],
  [0.1, 0.5, 0.1, 0.0],
  [-0.1, 0.0, 0.6, 0.1],
  [0.2, 0.0, 0.0, 0.5],
  [0.3, 0.2, -0.1, 0.0],
  [0.0, 0.4, 0.1, 0.2],
];

// ---------------------------------------------------------------------------
// Matrix utilities (no dependency on math libraries; small N keeps it simple)
// ---------------------------------------------------------------------------

function matmul(A: number[][], B: number[][]): number[][] {
  const m = A.length, n = B[0]!.length, p = B.length;
  const out = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < p; k++) s += A[i]![k]! * B[k]![j]!;
      out[i]![j] = s;
    }
  }
  return out;
}

function transpose(A: number[][]): number[][] {
  const m = A.length, n = A[0]!.length;
  const out = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) out[j]![i] = A[i]![j]!;
  return out;
}

function scaleMatrix(A: number[][], c: number): number[][] {
  return A.map(row => row.map(v => v * c));
}

function softmaxRows(A: number[][]): number[][] {
  return A.map(row => {
    const mx = Math.max(...row);
    const exps = row.map(v => Math.exp(v - mx));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => v / sum);
  });
}

// ---------------------------------------------------------------------------
// Compute all intermediates ONCE at module load
// ---------------------------------------------------------------------------

export const Q: number[][] = matmul(X, W_Q);          // 6 x 4
export const K: number[][] = matmul(X, W_K);          // 6 x 4
export const V: number[][] = matmul(X, W_V);          // 6 x 4

export const K_T: number[][] = transpose(K);          // 4 x 6 (for visualization)
export const RAW_SCORES: number[][] = matmul(Q, K_T); // 6 x 6
export const SCALED_SCORES: number[][] = scaleMatrix(RAW_SCORES, 1 / SQRT_D_K);
export const ATTENTION_WEIGHTS: number[][] = softmaxRows(SCALED_SCORES);  // 6 x 6
export const OUTPUT: number[][] = matmul(ATTENTION_WEIGHTS, V);           // 6 x 4

// ---------------------------------------------------------------------------
// Stage definitions
// ---------------------------------------------------------------------------

export interface Stage {
  id: string;
  title: string;
  description: string;
  /** Matrices visible / highlighted at this stage */
  highlight: ('X' | 'Q' | 'K' | 'V' | 'scores' | 'scaled' | 'weights' | 'output')[];
}

export const STAGES: Stage[] = [
  {
    id: 'input',
    title: 'Stage 1 — Input embeddings',
    description: 'The 6-token sequence enters as a 6×6 matrix X. Each row is one token\'s embedding vector. This is what comes out of the embedding lookup (Chapter 2).',
    highlight: ['X'],
  },
  {
    id: 'projections',
    title: 'Stage 2 — Project to Q, K, V',
    description: 'Three learned linear projections turn the same input X into three different matrices. Q (queries), K (keys), V (values). Each is 6×4 — six positions, four dimensions per position.',
    highlight: ['X', 'Q', 'K', 'V'],
  },
  {
    id: 'scores',
    title: 'Stage 3 — Attention scores: Q · Kᵀ',
    description: 'The matrix product Q · Kᵀ produces a 6×6 matrix of dot products. Entry (i, j) is q_i · k_j — the similarity between position i\'s query and position j\'s key. We then divide by √d_k = 2 to control the variance (more on why in section 4).',
    highlight: ['Q', 'K', 'scores', 'scaled'],
  },
  {
    id: 'softmax',
    title: 'Stage 4 — Softmax: attention weights',
    description: 'Row-wise softmax turns each row of scaled scores into a probability distribution. Each row sums to 1. The bright cells are positions one token attends to strongly. Notice how "cat" attends mostly to "the", "sat" to "cat", "on" to "sat" — local syntactic structure emerges.',
    highlight: ['scaled', 'weights'],
  },
  {
    id: 'output',
    title: 'Stage 5 — Weighted sum: output',
    description: 'The attention weights are applied to the values V via a final matmul. The output is 6×4 — each row is a weighted average of V rows, weighted by that position\'s attention distribution. This is what feeds into the next transformer layer.',
    highlight: ['weights', 'V', 'output'],
  },
];
```

**Notes on the data:**
- All matrices precomputed at module load; no computation in the React component
- The hand-tuned Q, K, V are designed to produce an interpretable attention pattern. After softmax, each token's attention is concentrated on its "predecessor" in the sentence — local right-to-left attention with a slight bias toward "the" tokens
- The widget is *deterministic*: the same matrices every render, the same patterns visible. No random seed needed.

### 2. Visual layout

```
ViewBox: 0 0 900 600

┌────────────────────────────────────────────────────────────────────────┐
│  Stage ●━━━━━━━━━━━━━━━━━━ 3 / 5     [▶ Play] [Reset]                  │
│                                                                        │
│  Stage 3 — Attention scores: Q · Kᵀ                                    │
│  ────────────────────────────────                                      │
│                                                                        │
│   X (input)         Q (queries)      K (keys)        V (values)        │
│   ┌──┬──┬──┐       ┌──┬──┬──┐       ┌──┬──┬──┐       ┌──┬──┬──┐       │
│   │██│██│██│       │██│██│██│       │██│██│██│       │██│██│██│       │
│   │██│██│██│       │██│██│██│       │██│██│██│       │██│██│██│       │
│   ├──┼──┼──┤       ├──┼──┼──┤       ├──┼──┼──┤       ├──┼──┼──┤       │
│   │...     │       │...     │       │...     │       │...     │       │
│   └────────┘       └────────┘       └────────┘       └────────┘       │
│   the cat sat …    the cat sat …    the cat sat …    the cat sat …    │
│   (dimmed)         (highlighted)    (highlighted)    (dimmed)         │
│                                                                        │
│         ↓ Q · Kᵀ (matmul)              ↓ ÷ √d_k                        │
│                                                                        │
│         ┌─ Raw scores ─┐               ┌─ Scaled ÷ √d_k ─┐             │
│         ┌──┬──┬──┬──┐                  ┌──┬──┬──┬──┐                   │
│         │██│██│██│██│                  │██│██│██│██│                   │
│         │██│██│██│██│                  │██│██│██│██│                   │
│         │.            │                │.            │                 │
│         └────────────┘                  └────────────┘                 │
│        the cat sat on …                 the cat sat on …               │
│        (HIGHLIGHTED)                    (HIGHLIGHTED)                  │
│                                                                        │
│  Description:                                                          │
│  The matrix product Q · Kᵀ produces a 6×6 matrix of dot products.      │
│  Entry (i, j) is q_i · k_j — the similarity between position i's       │
│  query and position j's key. We then divide by √d_k = 2 to control     │
│  the variance.                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

Layout details:
- Each matrix renders as a grid of small colored cells (~30px per cell, with token labels along rows and columns)
- Cells are color-coded: diverging scale (blue → white → red) for Q, K, V, scores (which can be negative); single-hue (white → cyan) for attention weights and a separate scale for output
- Highlighted matrices have full opacity; non-highlighted are dimmed to ~25%
- The hovered cell shows its numeric value in a small floating label
- The widget arranges X / Q / K / V in a row at the top; scores / scaled / weights / output below

Actually for screen-space efficiency, restructure as a vertical flow with stage-driven highlighting:

```
[ X | Q | K | V ]   ← top row, always visible
        ↓
[ Raw scores | Scaled scores ]   ← middle row, visible from stage 3 on
        ↓
[ Attention weights | Output ]   ← bottom row, visible from stage 4-5 on
```

Where "visible from stage N on" means: dimmed at earlier stages, full opacity once the stage that produced it is reached.

### 3. `AttentionHeatmap.tsx`

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  TOKENS, X, Q, K, V, K_T,
  RAW_SCORES, SCALED_SCORES, ATTENTION_WEIGHTS, OUTPUT,
  STAGES, SQRT_D_K,
  type Stage,
} from './attention-data';
import styles from './AttentionHeatmap.module.css';

const PLAY_FPS = 0.6;   // ~1.6 sec per stage; slow enough to read description

type MatrixKey = 'X' | 'Q' | 'K' | 'V' | 'scores' | 'scaled' | 'weights' | 'output';

interface MatrixSpec {
  key: MatrixKey;
  label: string;
  data: number[][];
  colorScale: 'diverging' | 'sequential-cyan';
  rowLabels: string[];   // length = matrix.rows
  colLabels: string[];   // length = matrix.cols
}

export default function AttentionHeatmap() {
  const [stageIdx, setStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState<{ matrix: string; i: number; j: number; v: number } | null>(null);

  // Animation timer
  useEffect(() => {
    if (!isPlaying) return;
    if (stageIdx >= STAGES.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStageIdx(s => s + 1);
    }, 1000 / PLAY_FPS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, stageIdx]);

  // Cleanup
  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const stage: Stage = STAGES[stageIdx]!;
  const isHighlighted = (k: MatrixKey) => stage.highlight.includes(k);

  // Matrix specs to render in order
  const matrices: MatrixSpec[] = [
    { key: 'X', label: 'X (input)',              data: X,                 colorScale: 'diverging',        rowLabels: TOKENS, colLabels: ['d0','d1','d2','d3','d4','d5'] },
    { key: 'Q', label: 'Q (queries)',            data: Q,                 colorScale: 'diverging',        rowLabels: TOKENS, colLabels: ['q0','q1','q2','q3'] },
    { key: 'K', label: 'K (keys)',               data: K,                 colorScale: 'diverging',        rowLabels: TOKENS, colLabels: ['k0','k1','k2','k3'] },
    { key: 'V', label: 'V (values)',             data: V,                 colorScale: 'diverging',        rowLabels: TOKENS, colLabels: ['v0','v1','v2','v3'] },
    { key: 'scores',  label: 'Raw scores Q·Kᵀ',  data: RAW_SCORES,        colorScale: 'diverging',        rowLabels: TOKENS, colLabels: TOKENS },
    { key: 'scaled',  label: `Scaled ÷ √${4}`,   data: SCALED_SCORES,     colorScale: 'diverging',        rowLabels: TOKENS, colLabels: TOKENS },
    { key: 'weights', label: 'Attention weights',data: ATTENTION_WEIGHTS, colorScale: 'sequential-cyan',  rowLabels: TOKENS, colLabels: TOKENS },
    { key: 'output',  label: 'Output (=weights·V)', data: OUTPUT,         colorScale: 'diverging',        rowLabels: TOKENS, colLabels: ['o0','o1','o2','o3'] },
  ];

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controls}>
        <button onClick={() => { setStageIdx(0); setIsPlaying(false); }} className={styles.controlSecondary}>
          Reset
        </button>
        <button onClick={() => stageIdx >= STAGES.length - 1 ? (setStageIdx(0), setIsPlaying(true)) : setIsPlaying(p => !p)} className={styles.controlPrimary}>
          {isPlaying ? 'Pause' : stageIdx >= STAGES.length - 1 ? 'Replay' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={STAGES.length - 1}
          value={stageIdx}
          onChange={e => { setIsPlaying(false); setStageIdx(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Attention computation stage"
        />
        <span className={styles.stepLabel} aria-live="polite">Stage {stageIdx + 1} / {STAGES.length}</span>
      </div>

      {/* Stage title */}
      <div className={styles.stageTitle}>{stage.title}</div>

      {/* Matrix rows — top: inputs (X, Q, K, V); middle: scores; bottom: weights, output */}
      <div className={styles.matrixRow}>
        {matrices.slice(0, 4).map(m => (
          <Matrix key={m.key} spec={m} isHighlighted={isHighlighted(m.key)} setHovered={setHovered} />
        ))}
      </div>

      <div className={styles.matrixRow}>
        {matrices.slice(4, 6).map(m => (
          <Matrix key={m.key} spec={m} isHighlighted={isHighlighted(m.key)} setHovered={setHovered} />
        ))}
      </div>

      <div className={styles.matrixRow}>
        {matrices.slice(6, 8).map(m => (
          <Matrix key={m.key} spec={m} isHighlighted={isHighlighted(m.key)} setHovered={setHovered} />
        ))}
      </div>

      {/* Description */}
      <div className={styles.description} aria-live="polite">
        {stage.description}
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

interface MatrixProps {
  spec: MatrixSpec;
  isHighlighted: boolean;
  setHovered: (h: { matrix: string; i: number; j: number; v: number } | null) => void;
}

function Matrix({ spec, isHighlighted, setHovered }: MatrixProps) {
  // Compute color scale extremes from this matrix's actual data
  const flat = spec.data.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const absMax = Math.max(Math.abs(min), Math.abs(max));

  function cellColor(v: number): string {
    if (spec.colorScale === 'sequential-cyan') {
      // Attention weights: white (0) → cyan (1)
      const t = v;   // 0..1 range expected
      return `rgba(34, 211, 238, ${t.toFixed(3)})`;
    }
    // Diverging scale: -absMax (blue) → 0 (transparent) → +absMax (red)
    const t = v / absMax;
    if (t > 0) return `rgba(239, 68, 68, ${t.toFixed(3)})`;       // red
    return `rgba(59, 130, 246, ${Math.abs(t).toFixed(3)})`;        // blue
  }

  return (
    <div className={`${styles.matrixContainer} ${isHighlighted ? styles.matrixHighlighted : styles.matrixDimmed}`}>
      <div className={styles.matrixLabel}>{spec.label}</div>
      <div className={styles.matrixGrid} style={{ gridTemplateColumns: `auto repeat(${spec.colLabels.length}, 28px)` }}>
        {/* Column headers */}
        <div></div>
        {spec.colLabels.map((cl, j) => (
          <div key={`ch-${j}`} className={styles.colLabel}>{cl}</div>
        ))}

        {/* Rows */}
        {spec.data.map((row, i) => (
          <RowFragment key={i} rowLabel={spec.rowLabels[i]!} row={row} matrixLabel={spec.label} i={i} cellColor={cellColor} setHovered={setHovered} />
        ))}
      </div>
    </div>
  );
}

function RowFragment({ rowLabel, row, matrixLabel, i, cellColor, setHovered }: {
  rowLabel: string;
  row: number[];
  matrixLabel: string;
  i: number;
  cellColor: (v: number) => string;
  setHovered: (h: { matrix: string; i: number; j: number; v: number } | null) => void;
}) {
  return (
    <>
      <div className={styles.rowLabel}>{rowLabel}</div>
      {row.map((v, j) => (
        <div
          key={j}
          className={styles.cell}
          style={{ backgroundColor: cellColor(v) }}
          onMouseEnter={() => setHovered({ matrix: matrixLabel, i, j, v })}
          onMouseLeave={() => setHovered(null)}
          title={`${matrixLabel}[${i},${j}] = ${v.toFixed(3)}`}
        />
      ))}
    </>
  );
}
```

### 4. `AttentionHeatmap.module.css`

Match the typographic conventions from earlier widget CSS modules. Key new styles:

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

/* Controls — copy pattern from BPETraining.module.css */
.controls { /* matches BPETraining */ }
.controlPrimary, .controlSecondary { /* matches BPETraining */ }
.scrubber { /* matches BPETraining */ }
.stepLabel { /* matches BPETraining */ }

.stageTitle {
  margin: 0.75rem 0 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  color: var(--cyan-300);
  font-weight: 500;
}

.matrixRow {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1rem;
  justify-content: flex-start;
  align-items: flex-start;
}

.matrixContainer {
  transition: opacity 350ms cubic-bezier(0.22, 1, 0.36, 1);
}
.matrixHighlighted { opacity: 1; }
.matrixDimmed { opacity: 0.25; }

.matrixLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
  text-align: center;
}

.matrixGrid {
  display: grid;
  gap: 1px;
  background: var(--border-default);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 1px;
}

.cell {
  width: 28px;
  height: 28px;
  cursor: pointer;
  transition: outline-color 150ms;
}
.cell:hover {
  outline: 2px solid var(--cyan-500);
  outline-offset: -2px;
}

.colLabel, .rowLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rowLabel {
  padding-right: 6px;
  justify-content: flex-end;
}

.description {
  margin-top: 0.75rem;
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
  min-height: 3rem;
}

.hoverReadout {
  position: fixed;   /* or absolute, depending on positioning needs */
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
.hoverReadout strong { color: var(--cyan-300); font-weight: 500; }

@media (prefers-reduced-motion: reduce) {
  .matrixContainer { transition: none; }
}

@media (max-width: 640px) {
  .matrixRow { gap: 0.75rem; }
  .cell { width: 22px; height: 22px; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
export { default as AutogradGraph } from './ch01/AutogradGraph';
export { default as EmbeddingSpace } from './ch02/EmbeddingSpace';
export { default as Word2VecDynamics } from './ch02/Word2VecDynamics';
export { default as BPETraining } from './ch03/BPETraining';
export { default as TokenizerComparison } from './ch03/TokenizerComparison';
export { default as AttentionHeatmap } from './ch04/AttentionHeatmap';
// Session 20 will add:
// export { default as CausalMask } from './ch04/CausalMask';
```

### 6. Update `src/pages/ch04-attention/index.mdx`

**Edit A: Add widget import at top:**

```mdx
import { AttentionHeatmap } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Scaled dot-product attention" caption="Watch attention compute step by step on the sentence 'the cat sat on the mat'. Hand-tuned Q, K, V matrices produce an interpretable local-attention pattern at the softmax stage — each token attends primarily to its neighbor.">
  <AttentionHeatmap client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 4** renders with the working widget. Section 6's placeholder still stubbed.
3. **Initial state (stage 1):** X matrix is highlighted; all others dimmed at 25% opacity. Description reads about input embeddings.
4. **Click Play:** the widget advances through 5 stages at ~0.6 steps/sec (~8 seconds total). After each stage:
   - Different matrices become highlighted
   - The description text updates
   - The stage title updates
5. **Scrubber works:** dragging the scrubber jumps to any stage and re-renders all matrices' highlight state.
6. **Stage 4 (softmax) reveals an interpretable attention pattern:**
   - "cat" (row 1) has its brightest cell at column 0 ("the") — det-noun
   - "sat" (row 2) has its brightest cell at column 1 ("cat") — subj-verb
   - "on" (row 3) has its brightest cell at column 2 ("sat") — verb-prep
   - "mat" (row 5) has its brightest cell at column 4 (second "the") or column 3 ("on") — det-noun
   - Each row sums to 1 (validate via the row sums in console.log if needed)
7. **Hovering a cell:** the hover readout in the bottom right shows the matrix name, indices, and numeric value.
8. **Color scales are correct:**
   - Q, K, V, X, scores, scaled scores: diverging (blue for negative, red for positive)
   - Attention weights: single-hue (white through cyan)
9. **Token labels visible** on every matrix's rows and columns where applicable
10. **Mobile (< 640px):** cells shrink to 22px; matrices wrap to a single column; scrubber tappable
11. **`prefers-reduced-motion: reduce`:** the dim/highlight transitions are removed (snap rather than fade); the animation still plays (it's the point of the widget)
12. **`npm run typecheck`** passes
13. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement multi-head attention.** Single head only; Ch 5 owns multi-head.
- ❌ **Do not add an input field to let the user change the sentence.** The hand-tuned matrices won't work for arbitrary text; live tokenization + projection is beyond a teaching widget's scope.
- ❌ **Do not implement causal masking.** Session 20 owns that.
- ❌ **Do not implement live recomputation as Q/K/V change.** Pre-computed at module load.
- ❌ **Do not modify Ch 4's section-6 placeholder.**
- ❌ **Do not flip Ch 4's status.** Stays `'draft'` until session 20.

---

## Wire-up

```bash
git add src/components/widgets/ch04/ src/components/widgets/index.ts src/pages/ch04-attention/index.mdx
git commit -m "session 19: attention heatmap marquee widget — 5-stage scaled dot-product visualization"
git push origin main
```

Visit production. Verify:
- Stage 1 to 5 progression matches the chapter prose section 3
- Stage 4 attention pattern is interpretable as a local-syntactic structure

---

## Notes for the session author

**On hand-tuning Q, K, V:** the matrices in `attention-data.ts` are designed so the resulting attention pattern is interpretable as a local right-to-left attention with some long-range "the"-attraction. This is more pedagogically valuable than truly random matrices, which would produce a pattern indistinguishable from noise. The chapter prose acknowledges this implicitly — it talks about *what attention learns to do*, and the widget shows *that learnable thing* in a clean form.

**On the pace (~0.6 stages/sec):** even slower than the BPE widget (2 steps/sec). Each stage of attention is conceptually heavy — the reader needs time to read the description, look at the highlighted matrices, and absorb. Faster pacing turns the widget into a flashy animation; slower pacing turns it into a teaching tool.

**On the iconic "stage 4" heatmap:** this is the visual people will remember and share. Compose the color choices and layout deliberately so the bright cells along the off-diagonal are visually striking. Reviewing the rendered widget on a real screen and adjusting cell size / spacing for visual impact is worth the time.

**On the 4-stage matrix groups:** the top row has 4 matrices (X, Q, K, V). The middle row has 2 (scores, scaled). The bottom row has 2 (weights, output). This grouping reflects the math: inputs are independent; scores and scaled are pre-softmax; weights and output are post-softmax. Resist the temptation to put everything in one mega-row.

**On the color choices:** red/blue diverging for signed values; white/cyan for the unsigned attention weights. The cyan is a callback to the design system's accent color (consistency across widgets). Don't introduce green/yellow/purple — the palette is calibrated.

**Pedagogical claim this widget supports:** "Attention is a sequence of matrix operations: project to Q, K, V; compute dot-product scores; scale; softmax; weighted sum with V. Each step produces an intermediate matrix you can inspect. The pattern at the softmax stage is the model's 'where to attend' decision." If after watching the animation once and scrubbing back to stage 4, the reader can articulate this — the widget has succeeded.

This is the visual that anchors the most important chapter in the tutorial. Build it with care.
