# Session 104 — CLIP embedding space marquee widget

> The marquee Chapter 23 widget. **A 2D scatter plot of a CLIP-style shared embedding space.** Twelve items — six image emojis (🐱 🐶 🚗 ⛵ and friends) and six text snippets — are pre-positioned so they form **four content clusters** (cats, dogs, cars, boats). Reader picks one of **5 preset text queries**; the query appears as a special marker; **its top-3 nearest items light up** (cyan rings) and **faint lines connect the query to its neighbors**. **The widget that makes the shared image-text embedding space visceral** — the foundational concept behind every modern vision-language model and the chapter's most pedagogically elegant idea.

---

## Read first (in this order)

1. **`research/ch23-multimodal/research.md`** — concept 3 (CLIP) is the source material
2. **`prompts/chapters/ch23-multimodal/session-103-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch22-retrieval-and-rag/session-99-retrieval-comparator-widget.md`** — for the recent Phase 13 widget conventions (preset-driven, color-coded)
4. **`prompts/chapters/ch11-mixture-of-experts/session-50-moe-routing-widget.md`** — for the scatter-plot pattern (closest precedent for spatial visualization)

---

## Goal

Replace the `<WidgetFrame title="CLIP embedding space">` placeholder in section 3 with a working interactive widget that:

- Shows a **2D scatter plot** of 12 pre-positioned items in a CLIP-style shared embedding space
- Each item is **either an image marker** (emoji + caption) **or a text marker** (📄 + text snippet) — visually distinct so the reader sees both modalities co-existing in the same space
- Items form **four content clusters**: cats (top-left), dogs (bottom-left), cars (top-right), boats (bottom-right)
- Offers **5 preset text queries** ("fluffy pet", "fast vehicles", "ocean adventures", "caring for animals", "anything red")
- On query select: **renders the query as a special diamond marker**; **highlights top-3 nearest items** with cyan rings and bold labels; **draws faint cyan lines** from query to each of the 3 nearest items
- Shows a **legend** distinguishing image markers from text markers
- Shows a **top-3 neighbors panel** listing the matched items with their kind (image/text) and similarity scores
- Provides a **pedagogical caption** below explaining what the reader is seeing

**End state:** section 3 of Chapter 23 has a working marquee widget. After 30 seconds of interaction (clicking through 2-3 queries), the reader should be able to articulate: (a) **image and text live in the same embedding space** — both modalities are scattered on the same 2D plot; (b) **semantically similar items cluster together** — cats with cats, cars with cars; (c) **cross-modal retrieval works** — a text query finds both image and text neighbors; (d) **this is what CLIP gives you** — a shared space where cosine similarity bridges modalities.

---

## Inputs

State of the repo after session 103:

- `src/pages/ch23-multimodal/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 2 and 3)
- `src/lib/chapters.ts` has Ch 23 as `'draft'`
- No `src/components/widgets/ch23/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch23/CLIPEmbeddingSpace.tsx` — the React widget
2. **Create** `src/components/widgets/ch23/CLIPEmbeddingSpace.module.css` — scoped styles
3. **Create** `src/components/widgets/ch23/clip-data.ts` — 12 items + 5 queries with pre-computed 2D positions
4. **Update** `src/components/widgets/index.ts` — add `CLIPEmbeddingSpace` export
5. **Update** `src/pages/ch23-multimodal/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<CLIPEmbeddingSpace client:visible />`

---

## Detailed spec

### 1. `clip-data.ts`

```ts
// src/components/widgets/ch23/clip-data.ts

export type ItemKind = 'image' | 'text';

export interface EmbeddingItem {
  id: string;
  kind: ItemKind;
  /** For images: an emoji proxy; for texts: a text snippet. */
  label: string;
  /** Short caption shown on hover/highlight; the "content" the embedding represents. */
  caption: string;
  /** Pre-computed 2D position in [0, 1] × [0, 1]. */
  x: number;
  y: number;
}

/**
 * 12 items in four content clusters:
 *  - Cats:  top-left  (x ∈ [0.10, 0.30], y ∈ [0.65, 0.90])
 *  - Dogs:  bottom-left (x ∈ [0.10, 0.30], y ∈ [0.10, 0.35])
 *  - Cars:  top-right (x ∈ [0.70, 0.90], y ∈ [0.65, 0.90])
 *  - Boats: bottom-right (x ∈ [0.70, 0.90], y ∈ [0.10, 0.35])
 *
 * Each cluster has 3 items: 1 image + 2 texts (or 2 images + 1 text — varies for visual interest).
 * Image items use emoji proxies; text items use short captions.
 */
export const ITEMS: EmbeddingItem[] = [
  // Cats cluster (top-left)
  { id: 'cat-img-1', kind: 'image', label: '🐱', caption: 'a fluffy orange cat on a windowsill', x: 0.18, y: 0.82 },
  { id: 'cat-img-2', kind: 'image', label: '😺', caption: 'a black-and-white kitten sleeping',    x: 0.13, y: 0.71 },
  { id: 'cat-txt-1', kind: 'text',  label: '📄', caption: 'How to care for an orange tabby cat',  x: 0.24, y: 0.74 },

  // Dogs cluster (bottom-left)
  { id: 'dog-img-1', kind: 'image', label: '🐶', caption: 'a golden retriever puppy playing',     x: 0.15, y: 0.22 },
  { id: 'dog-txt-1', kind: 'text',  label: '📄', caption: 'Training tips for labrador retrievers', x: 0.22, y: 0.31 },
  { id: 'dog-txt-2', kind: 'text',  label: '📄', caption: 'Dogs make loyal lifelong companions',   x: 0.27, y: 0.16 },

  // Cars cluster (top-right)
  { id: 'car-img-1', kind: 'image', label: '🚗', caption: 'a red sports car on a mountain road',   x: 0.80, y: 0.84 },
  { id: 'car-img-2', kind: 'image', label: '🏎️', caption: 'a Formula-1 race car at the track',     x: 0.86, y: 0.72 },
  { id: 'car-txt-1', kind: 'text',  label: '📄', caption: 'Review of the latest red sports cars',   x: 0.74, y: 0.69 },

  // Boats cluster (bottom-right)
  { id: 'boat-img-1', kind: 'image', label: '⛵', caption: 'a sailboat on calm blue water',         x: 0.83, y: 0.20 },
  { id: 'boat-img-2', kind: 'image', label: '🚤', caption: 'a speedboat creating a foamy wake',     x: 0.76, y: 0.31 },
  { id: 'boat-txt-1', kind: 'text',  label: '📄', caption: 'Sailing technique for beginners',        x: 0.87, y: 0.13 },
];

/** Preset query: a position in the same 2D space + a label. */
export interface Query {
  id: string;
  text: string;
  /** Position chosen to be near the relevant cluster(s). */
  x: number;
  y: number;
  /** Insight text shown when this query is active. */
  insight: string;
}

export const QUERIES: Query[] = [
  {
    id: 'fluffy-pet',
    text: '"a fluffy pet"',
    x: 0.18, y: 0.55,     // between cats and dogs (the pet axis)
    insight: 'A "fluffy pet" query lands between the cats and dogs clusters — both are fluffy pets. CLIP brings the query close to *both* modalities (images and texts) about pets, even though "fluffy" appears in no document literally.',
  },
  {
    id: 'fast-vehicles',
    text: '"fast vehicles"',
    x: 0.82, y: 0.55,     // between cars and boats
    insight: 'A "fast vehicles" query lands between cars and boats — both are vehicles, both can be fast. Notice how the top neighbors include images and texts from both clusters; CLIP doesn\'t care about modality, only meaning.',
  },
  {
    id: 'ocean',
    text: '"ocean adventures"',
    x: 0.83, y: 0.22,     // inside boats cluster
    insight: 'A specific query lands inside its cluster. "Ocean adventures" sits right in the boats cluster — the matching items (sailboat image, sailing technique text) cross modalities but share semantic content.',
  },
  {
    id: 'caring',
    text: '"caring for animals"',
    x: 0.20, y: 0.55,     // between cats (care) and dogs (training)
    insight: '"Caring for animals" pulls in the care-related texts from cats and dogs. Even though the query mentions neither "cats" nor "dogs", CLIP\'s semantic match brings in both clusters — text-text matches dominate here.',
  },
  {
    id: 'red',
    text: '"anything red"',
    x: 0.60, y: 0.62,     // between cars (red sports car) and cats (orange cat) — color is a CLIP signal
    insight: 'Visual properties like color are encoded in CLIP. "Red" finds the red sports car image (literally red) and the orange-cat image (visually similar warm color). Color-based retrieval works because CLIP saw colors in millions of training pairs.',
  },
];

/** Euclidean distance between two points. */
export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Convert a Euclidean distance to a similarity (0-1). */
export function similarityFromDist(d: number): number {
  // In the unit square, max distance is sqrt(2) ≈ 1.414. Normalize and invert.
  return Math.max(0, Math.min(1, 1 - d / 1.0));
}

/** Find the top-K nearest items to a query. */
export function topKNearest(query: Query, items: EmbeddingItem[], k = 3): Array<{ item: EmbeddingItem; similarity: number }> {
  const scored = items.map(item => ({
    item,
    similarity: similarityFromDist(dist(query, item)),
  }));
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ CLIP embedding space                                             │
│                                                                  │
│ Pick a query:                                                    │
│  [ fluffy pet ] [ fast vehicles ] [ ocean adventures ]           │
│  [ caring for animals ] [ anything red ]                         │
│                                                                  │
│ Legend:  🐱 image marker   📄 text marker   ◆ query marker       │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Embedding space (2D projection of CLIP)                       │ │
│ │                                                                │ │
│ │  🐱     🚗                                                     │ │
│ │   📄  🏎️                                                       │ │
│ │  😺  📄                                                        │ │
│ │                                                                │ │
│ │             ◆← query                                          │ │
│ │                                                                │ │
│ │  🐶                          ⛵                                │ │
│ │   📄         🚤                                                │ │
│ │  📄                          📄                                │ │
│ │                                                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Query: "a fluffy pet"                                            │
│                                                                  │
│ Top-3 nearest items:                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  1. 🐱 [image]   "a fluffy orange cat on a windowsill"        │ │
│ │     sim: 0.69                                                  │ │
│ │  2. 🐶 [image]   "a golden retriever puppy playing"           │ │
│ │     sim: 0.65                                                  │ │
│ │  3. 📄 [text]    "Dogs make loyal lifelong companions"        │ │
│ │     sim: 0.61                                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Insight:                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ A "fluffy pet" query lands between the cats and dogs          │ │
│ │ clusters — both are fluffy pets. CLIP brings the query close  │ │
│ │ to BOTH modalities (images and texts), even though "fluffy"   │ │
│ │ appears in no document literally.                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click query button → recomputes top-3; redraws the scatter plot with the query marker; highlights top-3 with cyan rings
- Each query also draws **faint cyan lines** from the query marker to its 3 nearest items
- Top-3 panel updates with the matched items + similarity scores

**Visual encoding:**
- **Image markers**: emoji at center; subtle amber background circle (40% opacity)
- **Text markers**: 📄 emoji; subtle cyan background circle
- **Query marker**: cyan filled diamond ◆; larger than items
- **Highlighted items** (top-3 neighbors): cyan ring around the background circle; emoji slightly larger; label bold
- **Connection lines**: faint cyan, dashed, from query to each of top-3
- **Cluster labels** (optional, faint): "🐱 cats", "🐶 dogs", "🚗 cars", "⛵ boats" in corners as subtle hints

### 3. `CLIPEmbeddingSpace.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  ITEMS, QUERIES, topKNearest,
  type EmbeddingItem, type Query,
} from './clip-data';
import styles from './CLIPEmbeddingSpace.module.css';

const PLOT_W = 720;
const PLOT_H = 400;
const PAD = 30;

export default function CLIPEmbeddingSpace() {
  const [queryIdx, setQueryIdx] = useState(0);
  const query = QUERIES[queryIdx]!;
  const topNeighbors = useMemo(() => topKNearest(query, ITEMS, 3), [query]);
  const neighborIds = new Set(topNeighbors.map(n => n.item.id));

  // Convert (0-1) coords to SVG pixel coords
  const toX = (x: number) => PAD + x * (PLOT_W - 2 * PAD);
  const toY = (y: number) => PAD + (1 - y) * (PLOT_H - 2 * PAD);    // flip Y for visual orientation

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>CLIP embedding space</div>
        <div className={styles.titleSubLabel}>
          Shared image-text embedding space · 12 items, 4 content clusters
        </div>
      </div>

      {/* Query picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a query:</span>
          <div className={styles.queryButtons}>
            {QUERIES.map((q, i) => (
              <button
                key={q.id}
                className={`${styles.queryButton} ${queryIdx === i ? styles.queryButtonActive : ''}`}
                onClick={() => setQueryIdx(i)}
              >{q.text}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legendPanel}>
        <div className={styles.legendItem}>
          <span className={styles.legendImageMarker}>🐱</span>
          <span className={styles.legendText}>image marker</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendTextMarker}>📄</span>
          <span className={styles.legendText}>text marker</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendQueryMarker}>◆</span>
          <span className={styles.legendText}>query</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendRingMarker}>○</span>
          <span className={styles.legendText}>top-3 nearest</span>
        </div>
      </div>

      {/* Scatter plot */}
      <div className={styles.plotPanel}>
        <svg
          viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
          className={styles.plotSvg}
          role="img"
          aria-label="2D projection of CLIP embedding space"
        >
          {/* Axes (faint background) */}
          <rect
            x={PAD} y={PAD}
            width={PLOT_W - 2 * PAD}
            height={PLOT_H - 2 * PAD}
            className={styles.plotFrame}
          />

          {/* Cluster labels (faint hints in corners) */}
          <text x={toX(0.10)} y={toY(0.95)} className={styles.clusterLabel}>cats</text>
          <text x={toX(0.10)} y={toY(0.05) + 16} className={styles.clusterLabel}>dogs</text>
          <text x={toX(0.85)} y={toY(0.95)} className={styles.clusterLabel}>cars</text>
          <text x={toX(0.85)} y={toY(0.05) + 16} className={styles.clusterLabel}>boats</text>

          {/* Connection lines (query → top-3) */}
          {topNeighbors.map(({ item }) => (
            <line
              key={`line-${item.id}`}
              x1={toX(query.x)} y1={toY(query.y)}
              x2={toX(item.x)}  y2={toY(item.y)}
              className={styles.connectionLine}
            />
          ))}

          {/* Item markers */}
          {ITEMS.map(item => {
            const isNeighbor = neighborIds.has(item.id);
            const isImage = item.kind === 'image';
            return (
              <g key={item.id}>
                {/* Background circle */}
                <circle
                  cx={toX(item.x)}
                  cy={toY(item.y)}
                  r={isImage ? 18 : 16}
                  className={`${styles.itemBg} ${isImage ? styles.itemBgImage : styles.itemBgText} ${isNeighbor ? styles.itemBgNeighbor : ''}`}
                />
                {/* Highlight ring for neighbors */}
                {isNeighbor && (
                  <circle
                    cx={toX(item.x)}
                    cy={toY(item.y)}
                    r={isImage ? 22 : 20}
                    className={styles.itemHighlightRing}
                  />
                )}
                {/* Emoji / label */}
                <text
                  x={toX(item.x)}
                  y={toY(item.y)}
                  className={`${styles.itemLabel} ${isNeighbor ? styles.itemLabelNeighbor : ''}`}
                >{item.label}</text>
              </g>
            );
          })}

          {/* Query marker (diamond) */}
          <g>
            <polygon
              points={`${toX(query.x)},${toY(query.y) - 14} ${toX(query.x) + 12},${toY(query.y)} ${toX(query.x)},${toY(query.y) + 14} ${toX(query.x) - 12},${toY(query.y)}`}
              className={styles.queryMarker}
            />
            <text
              x={toX(query.x)}
              y={toY(query.y) + 28}
              className={styles.queryLabel}
            >query</text>
          </g>
        </svg>
      </div>

      {/* Current query readout */}
      <div className={styles.queryReadoutPanel}>
        <span className={styles.queryReadoutLabel}>Query:</span>
        <span className={styles.queryReadoutText}>{query.text}</span>
      </div>

      {/* Top-3 neighbors */}
      <div className={styles.neighborsPanel}>
        <div className={styles.neighborsTitle}>Top-3 nearest items</div>
        <ol className={styles.neighborsList}>
          {topNeighbors.map(({ item, similarity }, i) => (
            <li key={item.id} className={styles.neighborItem}>
              <span className={styles.neighborRank}>{i + 1}.</span>
              <span className={styles.neighborMarker}>{item.label}</span>
              <span className={styles.neighborKind}>[{item.kind}]</span>
              <span className={styles.neighborCaption}>"{item.caption}"</span>
              <span className={styles.neighborSim}>sim: {similarity.toFixed(2)}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Insight */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{query.insight}</div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Click through the queries. Watch where the query lands in the 2D embedding space, and which items
        light up as its nearest neighbors. <strong>Notice that images and texts both appear</strong> — the
        shared embedding space doesn't separate by modality, only by meaning. <strong>This is what CLIP
        gives you</strong>: cosine similarity that bridges modalities. It is the foundational technique
        behind every modern vision-language model (LLaVA, GPT-4V, Claude vision, Gemini) and behind
        multimodal RAG.
      </div>
    </div>
  );
}
```

### 4. `CLIPEmbeddingSpace.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .legendPanel, .plotPanel,
.queryReadoutPanel, .neighborsPanel, .insightPanel, .caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.titlePanel { padding: 0.7rem 1rem; }
.titleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  color: var(--text-primary);
  font-weight: 500;
}
.titleSubLabel {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}

/* Controls */
.controlRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 110px;
}
.queryButtons { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.queryButton {
  padding: 0.35rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.queryButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.queryButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Legend */
.legendPanel {
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  padding: 0.55rem 1rem;
}
.legendItem {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  color: var(--text-secondary);
}
.legendImageMarker,
.legendTextMarker,
.legendQueryMarker,
.legendRingMarker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.95rem;
}
.legendImageMarker {
  background: color-mix(in srgb, var(--amber-400) 25%, transparent);
}
.legendTextMarker {
  background: color-mix(in srgb, var(--cyan-400) 25%, transparent);
}
.legendQueryMarker {
  color: var(--cyan-300);
  font-size: 1.1rem;
}
.legendRingMarker {
  border: 2px solid var(--cyan-400);
  color: var(--cyan-300);
  font-size: 0.7rem;
}

/* Plot */
.plotPanel { padding: 0.7rem 0.7rem; }
.plotSvg {
  width: 100%;
  height: auto;
  display: block;
}
.plotFrame {
  fill: var(--bg-primary);
  stroke: var(--border-subtle);
  stroke-width: 1;
  rx: 4;
}
.clusterLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  fill: var(--text-tertiary);
  text-anchor: start;
  opacity: 0.45;
  font-style: italic;
}
.connectionLine {
  stroke: var(--cyan-400);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
  opacity: 0.55;
}
.itemBg {
  transition: all 250ms;
}
.itemBgImage {
  fill: color-mix(in srgb, var(--amber-400) 18%, transparent);
  stroke: color-mix(in srgb, var(--amber-400) 35%, transparent);
  stroke-width: 1;
}
.itemBgText {
  fill: color-mix(in srgb, var(--cyan-400) 12%, transparent);
  stroke: color-mix(in srgb, var(--cyan-400) 30%, transparent);
  stroke-width: 1;
}
.itemBgNeighbor.itemBgImage {
  fill: color-mix(in srgb, var(--amber-400) 32%, transparent);
}
.itemBgNeighbor.itemBgText {
  fill: color-mix(in srgb, var(--cyan-400) 26%, transparent);
}
.itemHighlightRing {
  fill: none;
  stroke: var(--cyan-400);
  stroke-width: 2;
  opacity: 0.85;
  animation: pulse 2.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.55; }
}
.itemLabel {
  font-size: 18px;
  text-anchor: middle;
  dominant-baseline: central;
  transition: font-size 250ms;
}
.itemLabelNeighbor {
  font-size: 22px;
}

.queryMarker {
  fill: var(--cyan-400);
  stroke: var(--cyan-300);
  stroke-width: 2;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--cyan-500) 45%, transparent));
}
.queryLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  fill: var(--cyan-300);
  text-anchor: middle;
}

@media (prefers-reduced-motion: reduce) {
  .itemHighlightRing { animation: none; }
}

/* Query readout */
.queryReadoutPanel {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.55rem 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.88rem;
}
.queryReadoutLabel { color: var(--text-tertiary); }
.queryReadoutText { color: var(--cyan-300); font-weight: 500; }

/* Neighbors */
.neighborsTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.neighborsList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.neighborItem {
  display: grid;
  grid-template-columns: 22px 28px 60px 1fr 75px;
  gap: 0.45rem;
  align-items: center;
  padding: 0.4rem 0.55rem;
  background: var(--bg-primary);
  border: 1px solid color-mix(in srgb, var(--cyan-500) 25%, var(--border-subtle));
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.neighborRank {
  color: var(--cyan-300);
  font-weight: 600;
}
.neighborMarker {
  font-size: 1.15rem;
  text-align: center;
}
.neighborKind {
  color: var(--text-tertiary);
  font-size: 0.72rem;
}
.neighborCaption {
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.neighborSim {
  color: var(--text-secondary);
  font-size: 0.74rem;
  text-align: right;
}

/* Insight */
.insightPanel {
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
}
.insightLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--cyan-300);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.insightText {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.5;
}

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .controlLabel { min-width: 0; }
  .legendPanel { gap: 0.7rem; }
  .neighborItem {
    grid-template-columns: 18px 22px 50px 1fr 60px;
    gap: 0.3rem;
    font-size: 0.7rem;
  }
  .neighborCaption { font-size: 0.7rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as CLIPEmbeddingSpace } from './ch23/CLIPEmbeddingSpace';
// Session 133 will add:
// export { default as ViTPatchTokenizer } from './ch23/ViTPatchTokenizer';
```

### 6. Update `src/pages/ch23-multimodal/index.mdx`

**Edit A: Add widget import:**

```mdx
import { CLIPEmbeddingSpace } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="CLIP embedding space" caption="A 2D projection of a CLIP-style shared embedding space. Twelve items — 6 image emojis and 6 text snippets — form four content clusters (cats, dogs, cars, boats). Pick a text query; watch its position; see which items light up as its top-3 nearest neighbors. Images and texts both appear in the results because they live in the same embedding space. This is what CLIP gives you: cosine similarity that bridges modalities — the foundation of every modern vision-language model.">
  <CLIPEmbeddingSpace client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 23** renders with the working widget. Section 2's placeholder still stubbed.
3. **Default state**: query 0 selected ("fluffy pet"). 12 items rendered; top-3 highlighted; query diamond visible.
4. **Five query buttons**: fluffy pet / fast vehicles / ocean adventures / caring for animals / anything red. Active button highlighted in cyan.
5. **Legend** shows 4 entries: image marker, text marker, query, top-3 nearest.
6. **Scatter plot** renders all 12 items at their pre-computed positions. Image markers have amber-tinted backgrounds; text markers have cyan-tinted backgrounds.
7. **Cluster labels** ("cats", "dogs", "cars", "boats") appear faintly in the corners.
8. **Query marker** (cyan diamond) renders at the query's position.
9. **Top-3 neighbors highlighted**: cyan ring around their background circles; emoji slightly larger.
10. **Connection lines** (faint dashed cyan) connect the query marker to each of the 3 nearest items.
11. **Top-3 neighbors panel** lists the matched items with: rank, marker, [kind], caption, similarity score.
12. **Insight text** updates with each query selection.
13. **Per-query top-3 expectations** (approximate; depends on Euclidean ordering):
    - **"fluffy pet"**: pulls from cats AND dogs (between-cluster query)
    - **"fast vehicles"**: pulls from cars AND boats
    - **"ocean adventures"**: pulls primarily from boats (in-cluster)
    - **"caring for animals"**: pulls from cats AND dogs (between-cluster, text-heavy)
    - **"anything red"**: pulls from cars (red sports car) AND cats (orange) — color cluster
14. **Mobile** (< 720px): layout remains readable; SVG scales; neighbors panel adjusts.
15. **Reduced-motion**: highlight ring animation disabled.
16. **`npm run typecheck`** passes.
17. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not call a real CLIP model.** Pre-computed 2D positions only.
- ❌ **Do not allow free-text query input.** Five preset queries.
- ❌ **Do not implement real embedding similarity.** Use Euclidean distance in the 2D plot space.
- ❌ **Do not load images.** Emoji proxies only.
- ❌ **Do not implement zoom or pan.** Fixed view.
- ❌ **Do not show pairwise similarities between all items.** Only top-3 to the query.
- ❌ **Do not flip Ch 23's status.** Session 133 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch23/ src/components/widgets/index.ts src/pages/ch23-multimodal/index.mdx
git commit -m "session 104: CLIP embedding space marquee — shared image-text 2D scatter"
git push origin main
```

---

## Notes for the session author

**On the scatter plot being the chapter's most pedagogically elegant idea:**
CLIP's shared embedding space is one of the most beautiful results in modern ML: train two encoders contrastively, end up with a space where images and text mean the same thing if they're nearby. **The widget visualizes this directly** — 2D scatter, both modalities co-existing, semantic clusters obvious.

Notes-for-author: "**This widget is what the chapter is *about*.** Section 2 (ViT) gives you the tokens; this widget shows what you can *do* with aligned vision-language tokens. **It's the moment the chapter's claim becomes visual.**"

**On using emoji as image proxies:**
The widget uses emoji (🐱 🚗 ⛵ etc.) as image proxies. **Why this works**:
1. **No external image dependencies** — runs entirely in-browser
2. **Universally recognizable** — emoji are visual icons everyone understands
3. **Visually compact** — fits in a scatter plot point
4. **Modality clarity** — emoji clearly read as "this is an image" without needing to render actual images

Notes-for-author: "**Emoji proxies are a pedagogical shortcut**, not a limitation. The reader's job is to internalize that images and text live in the same space — emoji communicate 'this is an image' fine for that purpose."

**On the four content clusters:**
The 12 items form four clusters: cats (top-left), dogs (bottom-left), cars (top-right), boats (bottom-right). **Two animal clusters on the left; two vehicle clusters on the right.** This gives the queries pedagogical structure:
- **"fluffy pet"** → between cats and dogs (between-cluster, animal half)
- **"fast vehicles"** → between cars and boats (between-cluster, vehicle half)
- **"caring for animals"** → between cats and dogs (text-favoring)
- **"ocean adventures"** → inside boats (in-cluster)
- **"anything red"** → diagonal between cars and cats (cross-cluster, color-based)

Notes-for-author: "**The five queries are deliberately chosen to teach five different lessons**: between-cluster (animals); between-cluster (vehicles); text-favoring; in-cluster; and color-based cross-cluster."

**On the "anything red" query being the most pedagogically interesting:**
"Anything red" lands between the cars cluster (red sports car image) and the cats cluster (orange cat — a similar warm color in real CLIP). **This shows that CLIP encodes visual properties like color**, not just object identity. Real CLIP would surface red-orange items across categories. Notes-for-author: "**The 'red' query is the demonstration that CLIP isn't just text-keyword matching.** It learns visual attributes. The reader sees this when the orange cat (no literal 'red') ends up near 'anything red'."

**On the connection lines:**
Faint dashed cyan lines from the query to its top-3 neighbors. **Pedagogically**: makes the "nearest neighbor" relationship visible at a glance, even without reading the neighbors panel. Notes-for-author: "**The lines are the 'aha' visual.** Reader's eye traces from query to neighbors; the spatial pattern (across clusters, within clusters) becomes obvious."

**On animation (highlight ring pulse):**
The highlighted (top-3) items get a slowly pulsing ring (opacity 0.55 ↔ 0.85, 2.5s cycle). **Subtle**, not distracting. **Reduced-motion users get a static ring.** This is the only animation in the widget.

**On the cluster labels in corners:**
"cats", "dogs", "cars", "boats" appear faintly in the corners as italic gray labels. **They're hints, not load-bearing**: a reader who skips them still gets the message; a reader who notices them gets a label for what they're seeing.

**Pedagogical claim this widget supports:**
"CLIP trains an image encoder and a text encoder jointly so paired (image, caption) pairs end up close in cosine space. The result: a **shared embedding space** where images and text about the same thing live in nearby regions. **Cosine similarity bridges modalities** — a text query can retrieve images; an image query can retrieve text; both can retrieve both. This is the foundational technique behind every modern vision-language model (LLaVA, GPT-4V, Claude vision, Gemini) and behind multimodal RAG. **The widget makes this space visual.**"

After 30 seconds of interaction (clicking through queries), the reader has internalized: (a) image and text markers exist in the same plot; (b) semantically similar items cluster; (c) cross-modal retrieval works; (d) this is what makes modern VLMs possible.

**This is Ch 23's central visualization.** Build with care.
