# Session 24 — Multi-head decomposition marquee widget

> The marquee Chapter 5 widget — shows 4 parallel attention heads, each computing a **different** attention pattern on the same 6-token sequence ("the cat sat on the mat"). Hand-tuned to produce four interpretable specializations: local-neighbor, backward-shift, "the"-detection, and ending-broadcast. The reader sees concretely that multi-head attention gives the model multiple "views" of the same input. Replaces the section-2 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch05-multihead-and-block/research.md`** — Derivation 1 (the multi-head formula) is the reference
2. **`prompts/chapters/ch05-multihead-and-block/session-23-page-structure.md`** — for the section-2 widget placeholder this session fills
3. **`prompts/chapters/ch04-attention/session-19-attention-heatmap-widget.md`** — for the matrix-cell rendering conventions established in Ch 4
4. **`prompts/chapters/ch04-attention/session-20-causal-mask-and-exercises.md`** — for the multi-panel comparison pattern

---

## Goal

Replace the `<WidgetFrame title="Multi-head attention">` placeholder in section 2 with a working interactive widget that:

- Visualizes 4 parallel attention heads operating on the same fixed 6-token sequence ("the cat sat on the mat")
- Each head displays a **6×6 attention heatmap** showing its post-softmax weights
- The four heads are hand-tuned to produce four distinct, interpretable specializations: local, backward, "the"-detection, and ending-broadcast
- Default view: 2×2 grid showing all four heads at once
- Click any head to "focus" it — that head expands; the others dim
- Description below explains what specialization each head exhibits
- The composite "concat → output projection" step is shown as a final small panel below the grid

**End state:** section 2 of Chapter 5 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate that (a) multi-head attention runs $h$ parallel attention operations, (b) each head produces a different attention pattern, (c) the patterns are combined via concatenation + a learned output projection.

---

## Inputs

State of the repo after session 23:

- `src/pages/ch05-multihead-and-block/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 2 and 7)
- `src/lib/chapters.ts` has Ch 5 as `'draft'`
- `src/components/widgets/index.ts` exports widgets for Ch 1-4
- No `src/components/widgets/ch05/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch05/MultiHeadDecomposition.tsx` — the React widget
2. **Create** `src/components/widgets/ch05/MultiHeadDecomposition.module.css` — scoped styles
3. **Create** `src/components/widgets/ch05/multihead-data.ts` — fixed input tokens + hand-tuned attention patterns for 4 heads + composite output
4. **Update** `src/components/widgets/index.ts` — add `MultiHeadDecomposition` export
5. **Update** `src/pages/ch05-multihead-and-block/index.mdx` — replace section-2's `<WidgetFrame>` interior with `<MultiHeadDecomposition client:visible />`

**Do NOT modify:** Ch 1-4 widget files, layout, styling, or scaffolding. Do NOT modify Ch 5's section-7 placeholder (session 25 owns it).

---

## Detailed spec

### Architecture overview

```
src/components/widgets/
├── ch01-04/...                              (sealed)
└── ch05/
    ├── MultiHeadDecomposition.tsx           ← new
    ├── MultiHeadDecomposition.module.css    ← new
    └── multihead-data.ts                    ← new
```

### 1. `multihead-data.ts` — the data layer

Four hand-tuned attention patterns, each demonstrating a specific specialization. The patterns are stored directly as 6×6 matrices (post-softmax) — we don't compute them from underlying Q, K, V because the goal is to *demonstrate that heads specialize*, not to derive the math (the chapter prose covers that with `<RunnableCode>` blocks).

```ts
// src/components/widgets/ch05/multihead-data.ts

export const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
export const N = TOKENS.length;

export interface HeadSpec {
  id: string;
  label: string;
  shortLabel: string;     // for the grid cell title
  description: string;
  /** 6x6 post-softmax attention weights; rows sum to 1. */
  attention: number[][];
}

/**
 * Helper: build a 6x6 attention matrix from weights, then row-normalize so
 * each row sums to 1. Lets us hand-write "approximate" patterns and have the
 * normalization happen automatically.
 */
function normalize(unnormalized: number[][]): number[][] {
  return unnormalized.map(row => {
    const sum = row.reduce((a, b) => a + b, 0);
    return sum === 0 ? row : row.map(v => v / sum);
  });
}

// ---------------------------------------------------------------------------
// Head 1: Local attention — each token attends to itself + adjacent tokens
// ---------------------------------------------------------------------------
const HEAD_1_RAW: number[][] = [
  // From "the" (pos 0):  attends to itself and "cat" (pos 1)
  [0.6, 0.3, 0.05, 0.02, 0.02, 0.01],
  // From "cat" (pos 1):  attends to itself, "the" (0), and "sat" (2)
  [0.25, 0.5, 0.2, 0.02, 0.02, 0.01],
  // From "sat" (pos 2):  attends to "cat" (1), itself, "on" (3)
  [0.02, 0.25, 0.5, 0.2, 0.02, 0.01],
  // From "on" (pos 3):  attends to "sat" (2), itself, "the" (4)
  [0.01, 0.02, 0.25, 0.5, 0.2, 0.02],
  // From "the" (pos 4):  attends to "on" (3), itself, "mat" (5)
  [0.01, 0.02, 0.02, 0.25, 0.5, 0.2],
  // From "mat" (pos 5):  attends to "the" (4), itself
  [0.01, 0.02, 0.02, 0.05, 0.3, 0.6],
];

// ---------------------------------------------------------------------------
// Head 2: Backward shift — each token attends primarily to the *previous* token
// (with itself as fallback for position 0)
// ---------------------------------------------------------------------------
const HEAD_2_RAW: number[][] = [
  // pos 0 has no predecessor — attends to itself
  [0.8, 0.05, 0.05, 0.05, 0.025, 0.025],
  // pos 1 attends to pos 0
  [0.8, 0.15, 0.02, 0.01, 0.01, 0.01],
  // pos 2 attends to pos 1
  [0.05, 0.8, 0.1, 0.02, 0.02, 0.01],
  // pos 3 attends to pos 2
  [0.02, 0.05, 0.8, 0.1, 0.02, 0.01],
  // pos 4 attends to pos 3
  [0.01, 0.02, 0.05, 0.8, 0.1, 0.02],
  // pos 5 attends to pos 4
  [0.01, 0.01, 0.02, 0.05, 0.8, 0.11],
];

// ---------------------------------------------------------------------------
// Head 3: "the"-detection — every token attends primarily to "the" tokens
// ("the" appears at positions 0 and 4)
// ---------------------------------------------------------------------------
const HEAD_3_RAW: number[][] = [
  // From every position, big weight on positions 0 and 4 (the "the" tokens)
  [0.5, 0.1, 0.05, 0.05, 0.25, 0.05],
  [0.45, 0.1, 0.05, 0.05, 0.3, 0.05],
  [0.4, 0.1, 0.1, 0.05, 0.3, 0.05],
  [0.4, 0.1, 0.05, 0.1, 0.3, 0.05],
  [0.4, 0.1, 0.05, 0.05, 0.35, 0.05],
  [0.4, 0.1, 0.05, 0.05, 0.3, 0.1],
];

// ---------------------------------------------------------------------------
// Head 4: Ending-broadcast — later tokens attend broadly to earlier tokens
// (each row has more spread weight on earlier positions)
// ---------------------------------------------------------------------------
const HEAD_4_RAW: number[][] = [
  // pos 0: just itself (nothing earlier to attend to)
  [0.85, 0.05, 0.04, 0.03, 0.02, 0.01],
  // pos 1: itself + a bit of pos 0
  [0.35, 0.55, 0.04, 0.03, 0.02, 0.01],
  // pos 2: spread across [0, 1, 2]
  [0.3, 0.25, 0.35, 0.05, 0.03, 0.02],
  // pos 3: more spread
  [0.25, 0.2, 0.2, 0.25, 0.07, 0.03],
  // pos 4: spread further
  [0.2, 0.18, 0.18, 0.18, 0.2, 0.06],
  // pos 5: maximally broad (attends roughly to everyone)
  [0.18, 0.16, 0.16, 0.17, 0.17, 0.16],
];

export const HEADS: HeadSpec[] = [
  {
    id: 'head-1',
    label: 'Head 1 — Local attention',
    shortLabel: 'Local',
    description: 'Each token attends primarily to itself and its immediate neighbors. This kind of "local" head captures short-range syntactic patterns — n-gram-like dependencies.',
    attention: normalize(HEAD_1_RAW),
  },
  {
    id: 'head-2',
    label: 'Head 2 — Backward shift',
    shortLabel: 'Previous',
    description: 'Each token attends primarily to the previous token. A backward-shift head implements something like "the most recent token" — useful for syntactic dependencies that always look one step back.',
    attention: normalize(HEAD_2_RAW),
  },
  {
    id: 'head-3',
    label: 'Head 3 — "the"-detection',
    shortLabel: '"the"',
    description: 'Every token attends primarily to positions where "the" appears (positions 0 and 4). A "token-specific detector" head finds occurrences of a particular word regardless of position.',
    attention: normalize(HEAD_3_RAW),
  },
  {
    id: 'head-4',
    label: 'Head 4 — Ending broadcast',
    shortLabel: 'Spread',
    description: 'Later tokens attend broadly to earlier tokens. A "broadcast" head aggregates global context — useful when the current token needs to draw on the whole prefix.',
    attention: normalize(HEAD_4_RAW),
  },
];

/**
 * The combined output of multi-head attention: concatenate the per-head
 * outputs (each n × d_v) into n × (h·d_v), then project through W_O to get
 * back to n × d_model.
 *
 * For visualization, we represent each per-token output as a single "summary
 * value" per head (intensity in the [0, 1] range), and the final combined
 * output as a single intensity per token. The actual numerics aren't
 * pedagogically meaningful — what matters is showing the data flow.
 */
export const PER_HEAD_OUTPUT_SUMMARY: number[][] = [
  // Each row is one token; each column is one head's "output summary intensity"
  [0.62, 0.58, 0.65, 0.55],
  [0.55, 0.72, 0.60, 0.50],
  [0.48, 0.65, 0.55, 0.60],
  [0.50, 0.50, 0.62, 0.65],
  [0.65, 0.55, 0.70, 0.58],
  [0.58, 0.62, 0.60, 0.70],
];

/** Final combined output: per-token "intensity" after concat + W_O projection. */
export const COMBINED_OUTPUT_SUMMARY: number[] = [0.60, 0.59, 0.57, 0.57, 0.62, 0.63];
```

**Notes on the data:**
- Each head's pattern is hand-designed to demonstrate a specific specialization. The patterns are stylized — real trained heads don't separate this cleanly (MC2 from research.md warns about this). The widget is a pedagogical idealization.
- The "summary" output values are placeholders for visualization. The real per-head output is an `n × d_v` matrix; we summarize to a single scalar per (token, head) for visual simplicity.

### 2. Visual layout

```
ViewBox: 0 0 800 700

┌──────────────────────────────────────────────────────────────────────┐
│  Multi-head attention — 4 heads, same input, different patterns      │
│                                                                      │
│  Input sequence: [the] [cat] [sat] [on] [the] [mat]                  │
│                                                                      │
│  ┌────────────────────────┬────────────────────────┐                │
│  │ Head 1: Local          │ Head 2: Backward       │                │
│  │ ────────────           │ ─────────────          │                │
│  │       the cat sat on…  │       the cat sat on…  │                │
│  │  the [█ ▒ . . . .  ]   │  the [█ . . . . .]    │                │
│  │  cat [▒ █ ▒ . . .]    │  cat [█ ▒ . . . .]    │                │
│  │  sat [. ▒ █ ▒ . .]    │  sat [. █ ▒ . . .]    │                │
│  │  on  [. . ▒ █ ▒ .]    │  on  [. . █ ▒ . .]    │                │
│  │  the [. . . ▒ █ ▒]    │  the [. . . █ ▒ .]    │                │
│  │  mat [. . . . ▒ █]    │  mat [. . . . █ ▒]    │                │
│  └────────────────────────┴────────────────────────┘                │
│  ┌────────────────────────┬────────────────────────┐                │
│  │ Head 3: "the"-detect   │ Head 4: Ending spread  │                │
│  │ ─────────────────      │ ─────────────────      │                │
│  │  [█ ▒ . . █ .]        │  [█ . . . . .]        │                │
│  │  [█ ▒ . . █ .]        │  [▒ █ . . . .]        │                │
│  │  [█ ▒ ▒ . █ .]        │  [▒ ▒ █ . . .]        │                │
│  │  [█ ▒ . ▒ █ .]        │  [▒ ▒ ▒ █ . .]        │                │
│  │  [█ ▒ . . █ .]        │  [▒ ▒ ▒ ▒ ▒ .]        │                │
│  │  [█ ▒ . . █ ▒]        │  [▒ ▒ ▒ ▒ ▒ ▒]        │                │
│  └────────────────────────┴────────────────────────┘                │
│                                                                      │
│  ↓ Concatenate (per-token, across heads)                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐          │
│  │ Per-head outputs (each token's output across heads): │          │
│  │       H1   H2   H3   H4                              │          │
│  │  the [▒█▒█]                                          │          │
│  │  cat [▒█▒█]                                          │          │
│  │  ...                                                 │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                      │
│  ↓ Project through W^O                                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐          │
│  │ Combined output per token: [▒][█][▒][█][▒][▒]        │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                      │
│  Description: [explanation of the currently focused head, or         │
│   "Click a head to inspect it; all 4 heads run in parallel."]       │
└──────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Default: all four heads visible at equal opacity in 2×2 grid
- Click a head: it expands (slightly enlarges, full opacity); the other three dim to 30%
- Click the same head again, or click "Show all" button: returns to grid view
- Description text updates with the focused head's description

### 3. `MultiHeadDecomposition.tsx`

```tsx
import { useState } from 'react';
import { TOKENS, HEADS, PER_HEAD_OUTPUT_SUMMARY, COMBINED_OUTPUT_SUMMARY, type HeadSpec } from './multihead-data';
import styles from './MultiHeadDecomposition.module.css';

export default function MultiHeadDecomposition() {
  const [focusedHeadId, setFocusedHeadId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{ matrix: string; i: number; j: number; v: number } | null>(null);

  function toggleHead(id: string) {
    setFocusedHeadId(prev => prev === id ? null : id);
  }

  const focusedHead = focusedHeadId ? HEADS.find(h => h.id === focusedHeadId) : null;

  return (
    <div className={styles.widget}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          {focusedHead ? `Focused: ${focusedHead.label}` : 'All 4 heads — click any to focus'}
        </div>
        {focusedHead && (
          <button onClick={() => setFocusedHeadId(null)} className={styles.showAllButton}>
            Show all heads
          </button>
        )}
      </div>

      {/* Input tokens */}
      <div className={styles.inputRow}>
        <span className={styles.inputLabel}>Input:</span>
        {TOKENS.map((t, i) => (
          <code key={i} className={styles.tokenChip}>{t}</code>
        ))}
      </div>

      {/* 2x2 grid of heads */}
      <div className={styles.headGrid}>
        {HEADS.map(head => {
          const isFocused = focusedHead?.id === head.id;
          const isOtherFocused = focusedHead !== null && focusedHead.id !== head.id;
          return (
            <div
              key={head.id}
              className={`${styles.headCell} ${isFocused ? styles.headCellFocused : ''} ${isOtherFocused ? styles.headCellDimmed : ''}`}
              onClick={() => toggleHead(head.id)}
              role="button"
              tabIndex={0}
              aria-pressed={isFocused}
            >
              <div className={styles.headLabel}>{head.label}</div>
              <AttentionGrid
                weights={head.attention}
                tokens={TOKENS}
                matrixLabel={head.shortLabel}
                setHovered={setHovered}
              />
            </div>
          );
        })}
      </div>

      {/* Concat + projection visualization */}
      <div className={styles.compositeRow}>
        <div className={styles.compositePanel}>
          <div className={styles.panelTitle}>Per-head outputs (concatenated)</div>
          <div className={styles.outputTable}>
            <div className={styles.outputCellHeader}></div>
            {HEADS.map(h => (
              <div key={h.id} className={styles.outputCellHeader}>{h.shortLabel}</div>
            ))}
            {TOKENS.map((token, i) => (
              <RowFragment key={i} rowLabel={token}>
                {PER_HEAD_OUTPUT_SUMMARY[i]!.map((v, j) => (
                  <div
                    key={j}
                    className={styles.outputCell}
                    style={{ backgroundColor: `rgba(34, 211, 238, ${v.toFixed(3)})` }}
                    title={`Token "${token}", Head ${j+1}: ${v.toFixed(3)}`}
                  />
                ))}
              </RowFragment>
            ))}
          </div>
          <div className={styles.panelHint}>shape: (6 tokens) × (4 heads × d_v) → flattened to (6, d_model)</div>
        </div>
        <div className={styles.arrow}>↓ W<sup>O</sup></div>
        <div className={styles.compositePanel}>
          <div className={styles.panelTitle}>Final output (after projection)</div>
          <div className={styles.outputTable}>
            <div className={styles.outputCellHeader}></div>
            <div className={styles.outputCellHeader}>summary</div>
            {TOKENS.map((token, i) => (
              <RowFragment key={i} rowLabel={token}>
                <div
                  className={styles.outputCell}
                  style={{ backgroundColor: `rgba(34, 211, 238, ${COMBINED_OUTPUT_SUMMARY[i]!.toFixed(3)})` }}
                  title={`Token "${token}", final: ${COMBINED_OUTPUT_SUMMARY[i]!.toFixed(3)}`}
                />
              </RowFragment>
            ))}
          </div>
          <div className={styles.panelHint}>shape: (6, d_model)</div>
        </div>
      </div>

      {/* Description */}
      <div className={styles.description} aria-live="polite">
        {focusedHead ? (
          <>
            <strong>{focusedHead.label}:</strong> {focusedHead.description}
          </>
        ) : (
          <>
            <strong>Four parallel attention heads.</strong> Each head has its own learned <code>W<sup>Q</sup></code>, <code>W<sup>K</sup></code>, <code>W<sup>V</sup></code> projections, so each produces a different attention pattern from the same input. Click any head to inspect it. After per-head attention, the outputs are concatenated along the feature dim and projected through <code>W<sup>O</sup></code>.
          </>
        )}
      </div>

      {/* Hover readout */}
      {hovered && (
        <div className={styles.hoverReadout}>
          {hovered.matrix}[{TOKENS[hovered.i]}, {TOKENS[hovered.j]}] = <strong>{hovered.v.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

function AttentionGrid({ weights, tokens, matrixLabel, setHovered }: {
  weights: number[][];
  tokens: string[];
  matrixLabel: string;
  setHovered: (h: { matrix: string; i: number; j: number; v: number } | null) => void;
}) {
  return (
    <div className={styles.gridContainer} style={{ gridTemplateColumns: `auto repeat(${tokens.length}, 1fr)` }}>
      <div></div>
      {tokens.map((t, j) => (
        <div key={j} className={styles.colLabel}>{t}</div>
      ))}
      {weights.map((row, i) => (
        <RowFragment key={i} rowLabel={tokens[i]!}>
          {row.map((v, j) => (
            <div
              key={j}
              className={styles.attCell}
              style={{ backgroundColor: `rgba(34, 211, 238, ${v.toFixed(3)})` }}
              onMouseEnter={() => setHovered({ matrix: matrixLabel, i, j, v })}
              onMouseLeave={() => setHovered(null)}
              title={`${matrixLabel}: ${tokens[i]} → ${tokens[j]} = ${v.toFixed(3)}`}
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

### 4. `MultiHeadDecomposition.module.css`

Match conventions from `AttentionHeatmap.module.css` (session 19) and `CausalMask.module.css` (session 20). Key new styles:

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  color: var(--cyan-300);
  font-weight: 500;
}

.showAllButton {
  padding: 0.35rem 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.showAllButton:hover { color: var(--cyan-300); border-color: var(--cyan-500); }

.inputRow {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.inputLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.tokenChip {
  padding: 2px 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: 3px;
}

.headGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.headCell {
  padding: 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity 300ms, transform 300ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms;
}
.headCell:hover { border-color: var(--cyan-500); }
.headCellFocused {
  border-color: var(--cyan-500);
  transform: scale(1.02);
  z-index: 1;
}
.headCellDimmed { opacity: 0.3; }

.headLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.gridContainer {
  display: grid;
  gap: 1px;
  background: var(--border-default);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 1px;
}
.attCell {
  height: 26px;
  cursor: pointer;
  transition: outline-color 150ms;
}
.attCell:hover {
  outline: 2px solid var(--cyan-500);
  outline-offset: -2px;
}

.colLabel, .rowLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}
.rowLabel { justify-content: flex-end; padding-right: 4px; }

.compositeRow {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.compositePanel {
  flex: 1;
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.arrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  color: var(--cyan-400);
  white-space: nowrap;
}

.outputTable {
  display: grid;
  gap: 1px;
  background: var(--border-default);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 1px;
}
.outputCellHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: var(--text-tertiary);
  text-align: center;
  padding: 2px;
}
.outputCell {
  height: 22px;
  cursor: pointer;
}

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.panelHint {
  margin-top: 0.4rem;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  font-style: italic;
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
.description code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  background: var(--bg-primary);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--border-default);
}

.hoverReadout {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  padding: 0.4rem 0.7rem;
  background: var(--bg-elevated);
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  color: var(--text-primary);
  pointer-events: none;
  z-index: 10;
}
.hoverReadout strong { color: var(--cyan-300); }

@media (max-width: 640px) {
  .headGrid { grid-template-columns: 1fr; }
  .compositeRow { flex-direction: column; align-items: stretch; }
  .arrow { transform: rotate(0deg); margin: 0 auto; }
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
export { default as CausalMask } from './ch04/CausalMask';
export { default as MultiHeadDecomposition } from './ch05/MultiHeadDecomposition';
// Session 25 will add:
// export { default as TransformerBlockFlow } from './ch05/TransformerBlockFlow';
```

### 6. Update `src/pages/ch05-multihead-and-block/index.mdx`

**Edit A: Add widget import:**

```mdx
import { MultiHeadDecomposition } from '@components/widgets';
```

**Edit B: Replace section-2's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Multi-head attention" caption="Four parallel attention heads operating on the same 6-token sequence. Each head has its own hand-tuned attention pattern: local, backward, the-detection, and ending-broadcast. Real trained heads don't separate this cleanly — this is an idealization.">
  <MultiHeadDecomposition client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 2 of Ch 5** renders with the working widget. Section 7's placeholder still stubbed.
3. **Default view:** 2×2 grid showing all four heads at equal opacity. Title reads "All 4 heads — click any to focus".
4. **Each head displays a 6×6 attention heatmap** in cyan, with token labels along rows and columns.
5. **Each head's pattern is visually distinct:**
   - Head 1 (local): bright diagonal + adjacent off-diagonal
   - Head 2 (backward): bright sub-diagonal (one below main)
   - Head 3 ("the"-detect): bright columns at positions 0 and 4
   - Head 4 (ending): broadening rows toward the bottom
6. **Click a head:** it gains a cyan border and slightly enlarges (scale 1.02); the other three dim to 30% opacity; description updates with that head's specialization explanation; "Show all heads" button appears.
7. **Click the focused head again or "Show all":** returns to the 2×2 grid view.
8. **Concat → projection panel below the grid** shows: per-head output table (one row per token, one column per head, with cyan intensity), an arrow with W^O, and the final combined output table (one row per token, one cyan-intensity cell).
9. **Hover any cell:** the hover readout in the bottom right shows the matrix name, token pair, and value.
10. **Mobile (< 640px):** 2×2 grid collapses to 1×4 vertical stack; composite row stacks vertically.
11. **`npm run typecheck`** passes.
12. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement live multi-head attention computation.** The attention patterns are hand-tuned data; the widget shows specializations, not training dynamics.
- ❌ **Do not show Q, K, V matrices for each head.** Too much visual content; the chapter prose section 3 covers parameter accounting in prose.
- ❌ **Do not let the user change h (number of heads).** Fixed at 4 for visual clarity.
- ❌ **Do not implement causal masking in this widget.** Bidirectional attention only. The chapter prose has already established causal masking (Ch 4 section 6); this widget focuses on multi-head specialization.
- ❌ **Do not modify Ch 5's section-7 placeholder.** Session 25 owns it.
- ❌ **Do not flip Ch 5's status.** Stays `'draft'` until session 26.

---

## Wire-up

```bash
git add src/components/widgets/ch05/ src/components/widgets/index.ts src/pages/ch05-multihead-and-block/index.mdx
git commit -m "session 24: multi-head decomposition marquee widget — 4 parallel heads, distinct specializations"
git push origin main
```

Verify on production:
- All 4 heads render at equal opacity in 2×2 grid
- Click-to-focus interaction works smoothly
- Pattern differences are visually obvious

---

## Notes for the session author

**On hand-tuned patterns vs real attention:**
The four heads' patterns are idealizations. Real trained transformer heads rarely separate this cleanly — most heads in production models look "smeared" rather than sharply specialized. Mechanistic interpretability (Geva et al., Olsson et al., Conmy et al.) has found *some* sharply-specialized heads (induction heads, name-mover heads), but they're the exception. The widget is showing what's *possible* for heads to learn, not what *every* head does in practice. The caption ("Real trained heads don't separate this cleanly — this is an idealization") makes this honest.

**On the four specializations chosen:**
- Local (Head 1) — the easiest pattern to recognize visually; diagonal + neighbors
- Backward (Head 2) — implements "previous token" attention, common in real models for syntactic structure
- "the"-detection (Head 3) — represents content-specific heads (e.g., "find names," "find numbers")
- Ending broadcast (Head 4) — represents heads that aggregate context, common in deeper layers

Together they span the space of common attention pattern types.

**On the click-to-focus interaction:**
The grid view shows all four heads — pedagogically essential for "they're all running in parallel and they produce DIFFERENT patterns." The focus mode is for closer inspection. Without the grid view, the reader doesn't see the parallelism; without focus, the patterns are too small to study individually. Both modes are needed.

**On the composite panel:**
The per-head outputs and final combined output use abstract "intensity" values (not real numbers from a real computation). This is intentional — the chapter prose section 2 has the working `<RunnableCode>` for multi-head attention with real numbers; the widget's job is to show the *data flow*. Detailed numerics would distract.

**On scale transform during focus:**
The `transform: scale(1.02)` on the focused head is a small but effective visual cue. Combined with the dimming of the other three heads, it creates a clear "look at me" effect. Don't increase the scale further; 1.02 is enough.

**Pedagogical claim this widget supports:** "Multi-head attention runs $h$ parallel attention operations on the same input, each producing a different attention pattern. The per-head outputs are concatenated and projected through $W^O$ to produce the final output." If the reader walks away believing both halves of that claim — multiple heads AND they produce different patterns — the widget has succeeded.

This is the marquee for Ch 5's first major topic (multi-head). The transformer block flow widget (session 25) handles the second major topic. Together they cover the chapter.
