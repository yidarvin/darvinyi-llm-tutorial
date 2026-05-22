# Session 33 — Dedup interactive marquee widget

> The marquee Chapter 7 widget — an interactive MinHash dedup visualization. Eight sample documents with intentional near-duplicates (capitalization variations, paraphrases, subset relationships) plus distinct and spam-like texts. A pairwise Jaccard similarity heatmap shows the clustering structure. An adjustable threshold slider controls which pairs count as "duplicates" — the user sees clusters merge and split as the threshold moves. Replaces the section-4 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch07-pretraining-data/research.md`** — Derivations 1 (Jaccard/MinHash) and 2 (LSH) are the reference; the widget visualizes the output of MinHash similarity, not the algorithm internals
2. **`prompts/chapters/ch07-pretraining-data/session-32-page-structure.md`** — for the section-4 widget placeholder this session fills
3. **`prompts/chapters/ch04-attention/session-19-attention-heatmap-widget.md`** — for the heatmap matrix rendering pattern
4. **`prompts/chapters/ch06-positional-encoding/session-29-sinusoidal-pe-visualizer.md`** — for the slider-driven exploration pattern

---

## Goal

Replace the `<WidgetFrame title="MinHash near-duplicate detection">` placeholder in section 4 with a working interactive widget that:

- Displays **8 sample documents** as a list, each showing its text and a colored category indicator (near-dup group A, near-dup group B, distinct, spam)
- Shows the **pairwise Jaccard similarity matrix** as an 8×8 heatmap below the document list — diagonal is 1.0 (always); off-diagonal cells colored by similarity
- A **threshold slider** (range 0.0-1.0, step 0.05) controls the dedup threshold
- Above the threshold, pairs are highlighted as "duplicate" — cells get a cyan border; clusters form
- Below the heatmap, displays the **current cluster structure**: how many clusters, which documents in each, which one would be kept (smallest ID) and which discarded
- Real-time dedup count: "At threshold X, kept Y of 8 docs, discarded Z"

**End state:** section 4 of Chapter 7 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) similar documents have high pairwise Jaccard, (b) the threshold determines what counts as "duplicate," (c) dedup is lossy — discarded documents go away.

---

## Inputs

State of the repo after session 32:

- `src/pages/ch07-pretraining-data/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 4 and 5)
- `src/lib/chapters.ts` has Ch 7 as `'draft'`
- No `src/components/widgets/ch07/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch07/DedupInteractive.tsx` — the React widget
2. **Create** `src/components/widgets/ch07/DedupInteractive.module.css` — scoped styles
3. **Create** `src/components/widgets/ch07/dedup-data.ts` — 8 sample documents + precomputed Jaccard similarity matrix
4. **Update** `src/components/widgets/index.ts` — add `DedupInteractive` export
5. **Update** `src/pages/ch07-pretraining-data/index.mdx` — replace section-4's `<WidgetFrame>` interior with `<DedupInteractive client:visible />`

**Do NOT modify:** any prior chapter widget, the section-5 placeholder, or any other file.

---

## Detailed spec

### 1. `dedup-data.ts` — the data layer

Eight sample documents with intentional duplicate structure, plus a precomputed pairwise Jaccard similarity matrix.

**Document design:**
- **Group A** (3 docs, near-duplicates): variations of "the capital of France is Paris"
- **Group B** (2 docs, near-duplicates): variations of "photosynthesis converts light into energy"
- **Distinct** (2 docs): unrelated factual sentences
- **Spam** (1 doc): low-quality boilerplate

```ts
// src/components/widgets/ch07/dedup-data.ts

export interface DedupDoc {
  id: number;
  text: string;
  /** Category for color coding only — not used by the algorithm. */
  trueGroup: 'A' | 'B' | 'distinct' | 'spam';
}

export const DOCS: DedupDoc[] = [
  // Group A — "France capital" near-duplicates
  { id: 1, text: "The capital of France is Paris.",                                       trueGroup: 'A' },
  { id: 2, text: "The capital of France is paris.",                                       trueGroup: 'A' },   // case diff
  { id: 3, text: "Paris is the capital of France.",                                       trueGroup: 'A' },   // word order

  // Group B — "photosynthesis" near-duplicates
  { id: 4, text: "Photosynthesis converts light into chemical energy.",                   trueGroup: 'B' },
  { id: 5, text: "Photosynthesis converts light into energy.",                            trueGroup: 'B' },   // shorter variant

  // Distinct facts
  { id: 6, text: "The Pythagorean theorem relates the sides of a right triangle.",        trueGroup: 'distinct' },
  { id: 7, text: "Quantum mechanics describes subatomic particles probabilistically.",    trueGroup: 'distinct' },

  // Spam
  { id: 8, text: "buy buy buy click here free shipping limited time act now",             trueGroup: 'spam' },
];

/**
 * Precomputed pairwise Jaccard similarity on character 5-shingles.
 * SIMILARITY[i][j] is the Jaccard similarity of DOCS[i] and DOCS[j].
 * Diagonal is always 1.0 (self-similarity).
 *
 * These values were computed offline using true Jaccard on character 5-shingles.
 * MinHash with k=200 would give estimates within ~7% of these values.
 */
export const SIMILARITY: number[][] = [
  //   1     2     3     4     5     6     7     8
  [ 1.00, 0.95, 0.48, 0.02, 0.02, 0.05, 0.02, 0.00],  // 1
  [ 0.95, 1.00, 0.45, 0.02, 0.02, 0.04, 0.02, 0.00],  // 2
  [ 0.48, 0.45, 1.00, 0.02, 0.02, 0.04, 0.02, 0.00],  // 3
  [ 0.02, 0.02, 0.02, 1.00, 0.82, 0.02, 0.01, 0.00],  // 4
  [ 0.02, 0.02, 0.02, 0.82, 1.00, 0.02, 0.01, 0.00],  // 5
  [ 0.05, 0.04, 0.04, 0.02, 0.02, 1.00, 0.03, 0.00],  // 6
  [ 0.02, 0.02, 0.02, 0.01, 0.01, 0.03, 1.00, 0.00],  // 7
  [ 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1.00],  // 8
];

/**
 * Cluster the documents using union-find: any pair with similarity above
 * threshold belongs to the same cluster.
 * Returns an array of clusters, each containing doc IDs (sorted within cluster).
 */
export function clusterByThreshold(threshold: number): number[][] {
  const n = DOCS.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(x: number): number {
    while (parent[x]! !== x) {
      parent[x] = parent[parent[x]!]!;   // path compression
      x = parent[x]!;
    }
    return x;
  }
  function union(x: number, y: number) {
    const rootX = find(x), rootY = find(y);
    if (rootX !== rootY) parent[rootX] = rootY;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (SIMILARITY[i]![j]! >= threshold) union(i, j);
    }
  }

  // Group by root
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(DOCS[i]!.id);
  }

  // Sort: each cluster's ids ascending, then clusters by smallest id
  return [...groups.values()]
    .map(g => g.sort((a, b) => a - b))
    .sort((a, b) => a[0]! - b[0]!);
}

/** Category color (matches design system). */
export function groupColor(group: DedupDoc['trueGroup']): string {
  switch (group) {
    case 'A':        return 'var(--violet-400)';
    case 'B':        return 'var(--emerald-400)';
    case 'distinct': return 'var(--text-tertiary)';
    case 'spam':     return 'var(--rose-400)';
  }
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 800 (will scale fluidly)

┌────────────────────────────────────────────────────────────────────┐
│  Similarity threshold:  [────●────────] 0.50                       │
│                          0.0        1.0          Reset             │
│                                                                    │
│  At threshold 0.50: kept 5 of 8 documents (3 discarded)            │
│                                                                    │
│  Documents:                                                        │
│  ┌──────────────────────────────────────────────────────┐         │
│  │ ●(A) ID 1  "The capital of France is Paris."         │         │
│  │ ●(A) ID 2  "The capital of France is paris."         │         │
│  │ ●(A) ID 3  "Paris is the capital of France."         │         │
│  │ ●(B) ID 4  "Photosynthesis converts light into chemical energy."│
│  │ ●(B) ID 5  "Photosynthesis converts light into energy."│        │
│  │ ●    ID 6  "The Pythagorean theorem relates..."      │         │
│  │ ●    ID 7  "Quantum mechanics describes..."          │         │
│  │ ●(S) ID 8  "buy buy buy click here free shipping..." │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                    │
│  Pairwise Jaccard similarity matrix:                              │
│  ┌───┬────┬────┬────┬────┬────┬────┬────┬────┐                   │
│  │   │  1 │  2 │  3 │  4 │  5 │  6 │  7 │  8 │                   │
│  ├───┼────┼────┼────┼────┼────┼────┼────┼────┤                   │
│  │ 1 │ 1.0│0.95│0.48│0.02│0.02│0.05│0.02│0.00│                   │
│  │ 2 │0.95│ 1.0│0.45│0.02│0.02│0.04│0.02│0.00│                   │
│  │ 3 │0.48│0.45│ 1.0│0.02│0.02│0.04│0.02│0.00│                   │
│  │ 4 │0.02│0.02│0.02│ 1.0│0.82│0.02│0.01│0.00│                   │
│  │ 5 │0.02│0.02│0.02│0.82│ 1.0│0.02│0.01│0.00│                   │
│  │ 6 │0.05│0.04│0.04│0.02│0.02│ 1.0│0.03│0.00│                   │
│  │ 7 │0.02│0.02│0.02│0.01│0.01│0.03│ 1.0│0.00│                   │
│  │ 8 │0.00│0.00│0.00│0.00│0.00│0.00│0.00│ 1.0│                   │
│  └───┴────┴────┴────┴────┴────┴────┴────┴────┘                   │
│  (cells ≥ threshold get cyan border)                              │
│                                                                    │
│  Clusters at threshold 0.50:                                       │
│   ✓ Keep: {1, 2}  (3 discarded — only ID 1 stays)                 │
│   ✓ Keep: {4, 5}  (1 discarded — only ID 4 stays)                 │
│   ✓ Keep: {3}                                                      │
│   ✓ Keep: {6}                                                      │
│   ✓ Keep: {7}                                                      │
│   ✓ Keep: {8}                                                      │
└────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Slide threshold to 0.0: every off-diagonal pair becomes "duplicate"; all 8 docs collapse into 1 cluster
- Slide to 0.5 (default): groups A and B partially merge; A1+A2 cluster; A3 separate (paraphrase too different); B4+B5 cluster
- Slide to 0.9: only the closest pairs (A1+A2 at 0.95) cluster
- Slide to 1.0: no clusters; every doc is its own group

Hovering any matrix cell shows the precise similarity value.

### 3. `DedupInteractive.tsx`

```tsx
import { useState, useMemo } from 'react';
import { DOCS, SIMILARITY, clusterByThreshold, groupColor } from './dedup-data';
import styles from './DedupInteractive.module.css';

const DEFAULT_THRESHOLD = 0.5;

export default function DedupInteractive() {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [hovered, setHovered] = useState<{ i: number; j: number; v: number } | null>(null);

  const clusters = useMemo(() => clusterByThreshold(threshold), [threshold]);
  const totalKept = clusters.length;
  const totalDiscarded = DOCS.length - totalKept;

  return (
    <div className={styles.widget}>
      {/* Threshold control */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Similarity threshold: <span className={styles.controlValue}>{threshold.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className={styles.slider}
            aria-label="Similarity threshold"
          />
          <div className={styles.sliderHints}>
            <span>0.0 (everything dups)</span>
            <span>1.0 (only exact)</span>
          </div>
        </div>
        <button onClick={() => setThreshold(DEFAULT_THRESHOLD)} className={styles.resetButton}>Reset</button>
      </div>

      {/* Summary line */}
      <div className={styles.summary}>
        At threshold <strong>{threshold.toFixed(2)}</strong>: kept <strong>{totalKept}</strong> of {DOCS.length} documents ({totalDiscarded} discarded)
      </div>

      {/* Documents list */}
      <div className={styles.panelTitle}>Documents (8 samples)</div>
      <div className={styles.docsList}>
        {DOCS.map(doc => (
          <div key={doc.id} className={styles.docRow}>
            <span
              className={styles.docGroupIndicator}
              style={{ backgroundColor: groupColor(doc.trueGroup) }}
              title={`True group: ${doc.trueGroup}`}
            />
            <span className={styles.docId}>ID {doc.id}</span>
            <span className={styles.docText}>{doc.text}</span>
          </div>
        ))}
      </div>

      {/* Similarity matrix */}
      <div className={styles.panelTitle}>Pairwise Jaccard similarity</div>
      <SimilarityMatrix threshold={threshold} onHover={setHovered} />

      {/* Cluster output */}
      <div className={styles.panelTitle}>Clusters at threshold {threshold.toFixed(2)}</div>
      <div className={styles.clustersList}>
        {clusters.map((cluster, idx) => (
          <ClusterRow key={idx} cluster={cluster} />
        ))}
      </div>

      {/* Hover readout */}
      {hovered && (
        <div className={styles.hoverReadout}>
          Jaccard({hovered.i + 1}, {hovered.j + 1}) = <strong>{hovered.v.toFixed(3)}</strong>
        </div>
      )}
    </div>
  );
}

function SimilarityMatrix({ threshold, onHover }: { threshold: number; onHover: (h: { i: number; j: number; v: number } | null) => void }) {
  const n = DOCS.length;
  return (
    <div className={styles.matrixWrapper}>
      <div
        className={styles.matrix}
        style={{ gridTemplateColumns: `auto repeat(${n}, 36px)` }}
      >
        {/* Empty top-left + column headers */}
        <div></div>
        {DOCS.map(doc => (
          <div key={`ch-${doc.id}`} className={styles.matrixLabel}>{doc.id}</div>
        ))}
        {/* Rows */}
        {SIMILARITY.map((row, i) => (
          <RowFragment key={i} rowLabel={DOCS[i]!.id}>
            {row.map((v, j) => {
              const aboveThreshold = i !== j && v >= threshold;
              return (
                <div
                  key={j}
                  className={`${styles.matrixCell} ${aboveThreshold ? styles.matrixCellAboveThreshold : ''} ${i === j ? styles.matrixCellDiagonal : ''}`}
                  style={{ backgroundColor: cellColor(v) }}
                  onMouseEnter={() => onHover({ i, j, v })}
                  onMouseLeave={() => onHover(null)}
                  title={`J(${DOCS[i]!.id}, ${DOCS[j]!.id}) = ${v.toFixed(3)}`}
                >
                  {v >= 0.05 ? v.toFixed(2) : ''}
                </div>
              );
            })}
          </RowFragment>
        ))}
      </div>
    </div>
  );
}

function RowFragment({ rowLabel, children }: { rowLabel: number; children: React.ReactNode }) {
  return (
    <>
      <div className={styles.matrixLabel}>{rowLabel}</div>
      {children}
    </>
  );
}

function ClusterRow({ cluster }: { cluster: number[] }) {
  const keepId = cluster[0]!;
  const discardIds = cluster.slice(1);

  return (
    <div className={styles.clusterRow}>
      <span className={styles.clusterKeep}>
        ✓ Keep: <strong>ID {keepId}</strong>
      </span>
      {discardIds.length > 0 && (
        <span className={styles.clusterDiscard}>
          — discard: {discardIds.map(id => `ID ${id}`).join(', ')}
        </span>
      )}
    </div>
  );
}

function cellColor(v: number): string {
  // Cyan intensity proportional to similarity
  return `rgba(34, 211, 238, ${(v * 0.85).toFixed(3)})`;
}
```

### 4. `DedupInteractive.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
  position: relative;
}

.controls {
  display: flex;
  align-items: end;
  gap: 1rem;
  margin-bottom: 1rem;
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
.sliderHints {
  display: flex;
  justify-content: space-between;
  margin-top: 0.2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-tertiary);
}
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

.summary {
  padding: 0.65rem 0.9rem;
  margin-bottom: 1rem;
  background: color-mix(in srgb, var(--cyan-500) 8%, transparent);
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
}
.summary strong { color: var(--cyan-300); }

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  margin-top: 1rem;
  font-weight: 500;
}

.docsList {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.5rem;
}
.docRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
}
.docRow:hover { background: var(--bg-primary); }

.docGroupIndicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.docId {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  min-width: 50px;
}
.docText { color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; }

.matrixWrapper {
  overflow-x: auto;
  padding: 0.5rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.matrix {
  display: grid;
  gap: 1px;
  background: var(--border-default);
  padding: 1px;
}
.matrixLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  padding: 2px;
}
.matrixCell {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: outline 100ms;
}
.matrixCell:hover {
  outline: 1px solid var(--cyan-500);
  outline-offset: -1px;
  z-index: 1;
}
.matrixCellAboveThreshold {
  box-shadow: inset 0 0 0 2px var(--cyan-500);
  color: var(--text-primary);
  font-weight: 500;
}
.matrixCellDiagonal {
  background: var(--bg-elevated) !important;
  color: var(--text-tertiary);
  font-style: italic;
}

.clustersList {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.5rem;
}
.clusterRow {
  padding: 0.4rem 0.6rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.clusterRow + .clusterRow { border-top: 1px solid var(--border-subtle); }
.clusterKeep { color: var(--emerald-400); }
.clusterKeep strong { color: var(--text-primary); }
.clusterDiscard { color: var(--rose-400); margin-left: 0.5rem; }

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
  .controls { flex-direction: column; align-items: stretch; }
  .docRow { flex-wrap: wrap; }
  .docText { font-size: 0.72rem; }
  .matrixCell { height: 30px; font-size: 0.62rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as DedupInteractive } from './ch07/DedupInteractive';
// Session 34 will add:
// export { default as QualityFilter } from './ch07/QualityFilter';
```

### 6. Update `src/pages/ch07-pretraining-data/index.mdx`

**Edit A: Add widget import:**

```mdx
import { DedupInteractive } from '@components/widgets';
```

**Edit B: Replace section-4's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="MinHash near-duplicate detection" caption="Eight sample documents with intentional near-duplicates. Hand-computed Jaccard similarity from character 5-shingles (MinHash with k=200 would give estimates within ~7%). Adjust the threshold to see how aggressive dedup affects the kept set. Group A and B are intentional near-duplicate clusters; documents 6, 7 are distinct; document 8 is spam.">
  <DedupInteractive client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 4 of Ch 7** renders with the working widget. Section 5's placeholder still stubbed.
3. **Initial state:** threshold = 0.50; summary shows "kept 6 of 8 documents (2 discarded)" — clusters are {1,2}, {3}, {4,5}, {6}, {7}, {8}.
4. **Slider behavior:**
   - At threshold 0.0: all documents collapse into 1 cluster (all pairs ≥ 0). Summary: "kept 1 of 8".
   - At threshold 0.40: groups A (3 docs) merge into one cluster; group B (2 docs) merges; distinct docs separate. Summary: "kept 4 of 8".
   - At threshold 0.50: A1+A2 merge; A3 separate; B4+B5 merge; rest distinct. Summary: "kept 6 of 8".
   - At threshold 0.90: only A1+A2 cluster (similarity 0.95). Summary: "kept 7 of 8".
   - At threshold 1.0: no clusters; every doc is its own group. Summary: "kept 8 of 8".
5. **Matrix cells with similarity ≥ threshold** get a cyan border (visible `box-shadow: inset`).
6. **Cluster output below the matrix** updates in real-time as the slider moves; shows which document is kept (smallest ID) and which are discarded.
7. **Hovering a matrix cell** shows the hover readout with the precise Jaccard value.
8. **Documents list** shows colored group indicators (purple for A, green for B, gray for distinct, red for spam).
9. **Mobile (< 640px):** controls stack vertically; matrix scrolls horizontally if needed; document text shrinks to fit.
10. **`npm run typecheck`** passes.
11. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement live MinHash computation.** The similarity matrix is precomputed. The chapter prose section 4 has the working MinHash `<RunnableCode>` for the algorithm itself.
- ❌ **Do not implement LSH banding visualization.** The widget shows clustering output, not LSH internals.
- ❌ **Do not let the user edit the documents.** Fixed 8 docs.
- ❌ **Do not implement quality filtering in this widget.** Session 34 owns the quality filter widget.
- ❌ **Do not modify Ch 7's section-5 placeholder.** Session 34 owns it.
- ❌ **Do not flip Ch 7's status.** Stays `'draft'` until session 34.

---

## Wire-up

```bash
git add src/components/widgets/ch07/ src/components/widgets/index.ts src/pages/ch07-pretraining-data/index.mdx
git commit -m "session 33: dedup interactive marquee widget — MinHash clustering with adjustable threshold"
git push origin main
```

Verify on production:
- At threshold 0.5, the visualization clearly shows clusters {1,2}, {4,5} and separates {3}, {6}, {7}, {8}
- Slider moves smoothly; cluster output updates without flicker
- Matrix cell hover gives precise values

---

## Notes for the session author

**On the precomputed similarity matrix:**
The values are hand-computed approximations of true Jaccard on character 5-shingles. They're calibrated so that:
- Group A near-duplicates (1↔2) are ~0.95 (case difference only)
- Group A paraphrases (1↔3, 2↔3) are ~0.45-0.48 (same words, different order — many shared shingles)
- Group B near-duplicates (4↔5) are ~0.82 (one word removed, "chemical")
- Cross-group similarities are ~0.01-0.05 (essentially zero overlap)

These specific values mean the widget has *interesting* threshold transitions:
- At 0.5: groups A and B partially split (A3 separates; A1+A2 stay together)
- At 0.4: groups A and B both fully merge

If the values were too clean (e.g., all near-dups at 0.99, all distinct at 0.0), the widget would be boring — every threshold gives the same answer. The hand-tuned values create *gradients* that respond to slider position.

**On the cluster algorithm:**
Union-find (disjoint set) — any pair above threshold gets merged. With path compression, runtime is essentially $O(n^2 \alpha(n))$ for $n^2$ pair checks. For $n=8$, this is instantaneous.

**On the "keep ID min" rule:**
Standard dedup convention: keep the document with the smallest ID (or earliest position) from each cluster. The widget shows this explicitly so the reader sees that dedup is *lossy* — choosing one document per cluster means discarding others.

**On the cyan border for above-threshold cells:**
Inset box-shadow rather than outline. Outline would extend outside the cell and break the matrix grid layout. The box-shadow stays within the cell. The cyan color reinforces the "this pair is a duplicate" semantic.

**On the matrix cell content:**
Cells display the similarity value as text (e.g., "0.95"), but only if the value is ≥ 0.05 (above visual noise floor). Below that, the cell is essentially transparent and showing the number would be visual clutter.

**On the diagonal:**
Diagonal cells show "1.0" in italics with a slightly different background. Self-similarity is always 1; the visual treatment communicates "this is the trivial case, not interesting." Diagonal cells don't get the cyan border even when above threshold.

**Pedagogical claim this widget supports:** "Near-duplicate detection works by computing pairwise similarities between documents; documents with similarity above a chosen threshold are treated as duplicates and collapsed to one representative. The threshold controls how aggressive the dedup is — too low collapses unrelated documents; too high misses obvious near-duplicates." After 30 seconds of slider play, the reader should viscerally understand this trade-off.

This is the marquee for Ch 7. It makes the abstract claim "MinHash + LSH lets you do near-dup at scale" concrete by showing what near-dup *output* looks like on a small example. The chapter prose's `<RunnableCode>` in section 4 shows the algorithm; this widget shows what the algorithm *produces*.
