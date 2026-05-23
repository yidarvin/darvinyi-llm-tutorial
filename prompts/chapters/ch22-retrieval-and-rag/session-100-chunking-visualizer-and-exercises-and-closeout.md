# Session 100 — Ch 22 chunking visualizer + exercises + closeout

> **The Chapter 22 closeout.** Three deliverables: (1) implement the **Chunking Visualizer** secondary widget — a medium-length document re-chunked under four strategies (fixed-size with overlap, sentence-based, paragraph-based, parent-document); reader toggles between strategies; chunks are color-coded with size statistics; (2) add an **Exercises section** with 4 problems (BM25 from scratch, vector store with cosine retrieval, RRF hybrid combination, retrieval evaluation with recall@K); (3) flip Ch 22's status from `'draft'` to `'published'`. **Closes Ch 22 — the chapter on retrieval-augmented generation.** **Three of four Phase 13 chapters complete.** Only Ch 23 (Multimodal) remains in Phase 13.

This is a **single-topic chapter** (4-file cadence). The secondary widget combines with exercises in this final session — the standard closeout pattern. **File 100 of the project** — a milestone worth noting.

---

## Read first (in this order)

1. **`research/ch22-retrieval-and-rag/research.md`** — concepts 5 (chunking) and 8 (evaluation) are the source material
2. **`prompts/chapters/ch22-retrieval-and-rag/session-98-page-structure.md`** — for the section-5 widget placeholder and exercise placement
3. **`prompts/chapters/ch22-retrieval-and-rag/session-99-retrieval-comparator-widget.md`** — for the Ch 22 widget conventions
4. **`prompts/chapters/ch21-tool-use/session-96-tool-schema-validator-and-exercises-and-closeout.md`** — for the recent Phase 13 closeout pattern

---

## Goal

By end of session, three things change in the repo:

1. **`ChunkingVisualizer` widget** is implemented and wired into section 5. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("RAG architectures") and section 8 ("Production patterns and evaluation"). Four exercises with hints + runnable starter code.
3. **Ch 22's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 22 is the twenty-second published chapter — and the third of Phase 13.**

After this session: **Ch 22 is complete.** Phase 13 trajectory: Ch 23 (Multimodal) is the last chapter remaining.

---

## Inputs

State of the repo after session 99:

- Section 4's `RetrievalComparator` marquee widget is wired
- Section 5's widget is still stubbed
- All 3 runnable code blocks from session 98 are in place
- `src/lib/chapters.ts` has Ch 1-21 `'published'`, Ch 22 `'draft'`
- `src/components/widgets/ch22/` exists with `RetrievalComparator` already

---

## Deliverables

1. **Create** `src/components/widgets/ch22/ChunkingVisualizer.tsx` — the React widget
2. **Create** `src/components/widgets/ch22/ChunkingVisualizer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch22/chunking-data.ts` — sample document + chunking algorithms + stats
4. **Update** `src/components/widgets/index.ts` — add `ChunkingVisualizer` export
5. **Update** `src/pages/ch22-retrieval-and-rag/index.mdx`:
   - Replace section-5's `<WidgetFrame>` interior with `<ChunkingVisualizer client:visible />`
   - Insert new `## Exercises` section between section 7 ("RAG architectures") and section 8 ("Production patterns and evaluation")
6. **Update** `src/lib/chapters.ts` — change Ch 22's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 22's marquee widget is sealed.

---

## Detailed spec

### Part A — `ChunkingVisualizer` widget

#### A.1 `chunking-data.ts`

```ts
// src/components/widgets/ch22/chunking-data.ts

/** A chunk: a slice of the original document with metadata. */
export interface Chunk {
  id: number;
  start: number;          // character offset in source document
  end: number;            // exclusive end offset
  text: string;
  tokenCount: number;     // approximate (chars / 4)
  /** For parent-document strategy: the parent chunk this small chunk belongs to. */
  parentId?: number;
}

/** Sample document — six paragraphs of ML/RAG-related content for variety. */
export const DOCUMENT = `Retrieval-augmented generation (RAG) is the most-deployed LLM application pattern in production. The core idea is simple: instead of relying solely on the model's parametric memory, retrieve relevant documents from an external corpus and pass them to the model as context. This solves three fundamental limits of pure parametric memory — training cutoffs, private data, and specific records.

The retrieval step has two main flavors. Sparse retrieval uses algorithms like BM25 that match exact keywords; it remains a strong baseline that is hard to beat on domains with specialized vocabulary. Dense retrieval uses embedding models that map text into high-dimensional vectors; semantically similar texts produce nearby vectors, which lets the system match paraphrases and synonyms. Modern production systems usually combine both, often via Reciprocal Rank Fusion.

Chunking is the often-overlooked decision that dominates retrieval quality. Documents are typically too long to embed as single vectors, so they must be split into pieces. The choice of chunking strategy — fixed-size with overlap, sentence-based, paragraph-based, semantic, parent-document — affects what gets retrieved more than the choice of embedding model. Wrong chunk sizes can degrade recall by thirty to fifty percent.

After retrieval, a reranking stage often improves precision. Cross-encoders score each candidate document jointly with the query, producing more accurate relevance estimates than the dual-encoder embedding models used in first-stage retrieval. Reranking is slower per pair but only runs on the top candidates, so the total cost remains tractable.

Production RAG systems handle more than just retrieval. They cache aggressively (re-embedding millions of documents is expensive), monitor index freshness, isolate multi-tenant data, enforce document-level access controls, and instrument every layer for evaluation. RAGAS and similar frameworks measure faithfulness — does the generated answer match the retrieved content — alongside traditional information-retrieval metrics like recall and NDCG.

The architectural landscape continues to evolve. Vanilla RAG with a single retrieval call suffices for FAQ and documentation use cases. Agentic RAG, where the model decides when to retrieve via tool calls, handles multi-step research. Graph RAG attempts multi-hop reasoning over knowledge graphs. RETRO bakes retrieval into the model architecture during training. Each variant trades simplicity for capability; choose based on the actual use case.`;

/** Approximate token count (1 token ≈ 4 characters for English text). */
function approxTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

/** ---------- Strategy 1: fixed-size with overlap ---------- */
export function chunkFixedSize(doc: string, size = 80, overlap = 15): Chunk[] {
  const chunks: Chunk[] = [];
  const step = size - overlap;
  let id = 0;
  for (let start = 0; start < doc.length; start += step) {
    const end = Math.min(doc.length, start + size);
    const text = doc.slice(start, end);
    chunks.push({ id: id++, start, end, text, tokenCount: approxTokens(text) });
    if (end >= doc.length) break;
  }
  return chunks;
}

/** ---------- Strategy 2: sentence-based ---------- */
export function chunkSentences(doc: string): Chunk[] {
  const chunks: Chunk[] = [];
  // Simple sentence-boundary detection: ". ", "! ", "? " followed by capital
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)/g;
  let m: RegExpExecArray | null;
  let id = 0;
  while ((m = sentenceRegex.exec(doc)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    const text = doc.slice(start, end);
    chunks.push({ id: id++, start, end, text, tokenCount: approxTokens(text) });
  }
  return chunks;
}

/** ---------- Strategy 3: paragraph-based ---------- */
export function chunkParagraphs(doc: string): Chunk[] {
  const chunks: Chunk[] = [];
  const parts = doc.split(/\n\n+/);
  let cursor = 0;
  let id = 0;
  for (const part of parts) {
    const start = doc.indexOf(part, cursor);
    const end = start + part.length;
    chunks.push({ id: id++, start, end, text: part, tokenCount: approxTokens(part) });
    cursor = end;
  }
  return chunks;
}

/** ---------- Strategy 4: parent-document ---------- */
/**
 * Two-level chunking: small chunks for precise retrieval, large parents for context.
 * Returns small chunks; each has parentId pointing to a paragraph-level parent.
 */
export function chunkParentDoc(doc: string): { small: Chunk[]; parents: Chunk[] } {
  const parents = chunkParagraphs(doc);
  const small: Chunk[] = [];
  let id = 0;
  for (const parent of parents) {
    // Sub-split each paragraph by sentences
    const subSentences = chunkSentences(parent.text);
    for (const sub of subSentences) {
      small.push({
        id: id++,
        start: parent.start + sub.start,
        end: parent.start + sub.end,
        text: sub.text,
        tokenCount: sub.tokenCount,
        parentId: parent.id,
      });
    }
  }
  return { small, parents };
}

/** Stats about a chunking output. */
export interface ChunkingStats {
  count: number;
  avgTokens: number;
  minTokens: number;
  maxTokens: number;
  stdDev: number;
  totalCoverage: number;     // fraction of doc covered (1.0 = full); >1.0 indicates overlap
}

export function computeStats(chunks: Chunk[], docLength: number): ChunkingStats {
  if (chunks.length === 0) {
    return { count: 0, avgTokens: 0, minTokens: 0, maxTokens: 0, stdDev: 0, totalCoverage: 0 };
  }
  const tokens = chunks.map(c => c.tokenCount);
  const sum = tokens.reduce((a, b) => a + b, 0);
  const avg = sum / tokens.length;
  const variance = tokens.reduce((a, t) => a + (t - avg) ** 2, 0) / tokens.length;
  const stdDev = Math.sqrt(variance);
  const totalChars = chunks.reduce((a, c) => a + (c.end - c.start), 0);
  return {
    count: chunks.length,
    avgTokens: Math.round(avg),
    minTokens: Math.min(...tokens),
    maxTokens: Math.max(...tokens),
    stdDev: Math.round(stdDev * 10) / 10,
    totalCoverage: Math.round((totalChars / docLength) * 1000) / 1000,
  };
}

/** Strategy metadata for the picker. */
export interface StrategyInfo {
  id: 'fixed-size' | 'sentence' | 'paragraph' | 'parent-doc';
  label: string;
  description: string;
  insight: string;
}

export const STRATEGIES: StrategyInfo[] = [
  {
    id: 'fixed-size',
    label: 'Fixed-size + overlap',
    description: '80-character chunks with 15-character overlap.',
    insight: 'Simple and predictable; can split mid-sentence. The default in most RAG tutorials. Overlap fraction (here ~19%) trades chunk count for boundary context. In production, fixed-size chunks usually target 500-1000 tokens with 50-100 tokens of overlap.',
  },
  {
    id: 'sentence',
    label: 'Sentence-based',
    description: 'Each sentence becomes its own chunk.',
    insight: 'Preserves semantic units; chunk size varies with sentence length. Tiny chunks (one short sentence) may lose context; very long sentences are still single chunks. Good for FAQ-style retrieval where each Q/A is one or two sentences.',
  },
  {
    id: 'paragraph',
    label: 'Paragraph-based',
    description: 'Each paragraph becomes one chunk.',
    insight: 'Larger semantic units; works well for prose. Chunks are coherent and self-contained, but bigger chunks mean fewer total chunks — and retrieval becomes less precise. Best when your corpus already has good paragraph structure.',
  },
  {
    id: 'parent-doc',
    label: 'Parent-document',
    description: 'Embed sentences, retrieve paragraphs.',
    insight: 'Best-of-both: precise retrieval (sentences match exact queries) plus sufficient context (return the parent paragraph). Modern default for high-quality RAG. The small chunks below show what gets embedded; the colored backgrounds show which paragraph each belongs to.',
  },
];

/** Distinct colors for chunks (cycled). Echoes Phase 13 conventions. */
export const CHUNK_COLORS = [
  'var(--cyan-400)',
  'var(--amber-400)',
  'var(--emerald-400)',
  'var(--violet-400)',
  'var(--rose-400)',
  'var(--cyan-500)',
];
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Chunking visualizer                                              │
│                                                                  │
│ Strategy:                                                        │
│   [ Fixed-size + overlap ]  [ Sentence-based ]                   │
│   [ Paragraph-based ]       [ Parent-document ]                  │
│                                                                  │
│ 80-character chunks with 15-character overlap.                   │
│                                                                  │
│ Document (chunks color-coded; overlap shown by adjacent colors): │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ┃cyan▓Retrieval-augmented generation (RAG) is the most-de   │ │
│ │ ▓amber▓ployed LLM application pattern in production.        │ │
│ │ ▓emerald▓The core idea is simple: instead of relying        │ │
│ │ solely on the model's parametric...                          │ │
│ │ [continues with cycled colors for each chunk]               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Statistics:                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Chunks:     30                                                │ │
│ │ Avg size:   20 tokens                                         │ │
│ │ Range:      19 - 20 tokens   (std σ: 0.4)                     │ │
│ │ Coverage:   119%   (overlap of ~19%)                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Insight:                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Simple and predictable; can split mid-sentence. The default  │ │
│ │ in most RAG tutorials. Overlap fraction trades chunk count   │ │
│ │ for boundary context. In production, fixed-size chunks       │ │
│ │ usually target 500-1000 tokens with 50-100 tokens overlap.   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click strategy button → recomputes chunks; redraws colored backgrounds; updates stats and insight
- Document text is shown with **background-color spans** marking chunk boundaries
- Adjacent chunks use different colors (cycling through 6 colors)
- For **parent-document** strategy: the document is colored by *parent* paragraph; small chunks shown below in a list

**Visual encoding:**
- **Chunk backgrounds**: faint color tints (20% opacity); strong enough to see boundaries, weak enough to read text
- **Overlap regions (fixed-size only)**: where two colors visually overlap = the overlap region
- **Strategy buttons**: cyan-active style consistent with other Phase 13 widgets
- **Stats grid**: 4-cell layout with monospace numbers

#### A.3 `ChunkingVisualizer.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  DOCUMENT, STRATEGIES,
  chunkFixedSize, chunkSentences, chunkParagraphs, chunkParentDoc,
  computeStats, CHUNK_COLORS,
  type Chunk, type StrategyInfo,
} from './chunking-data';
import styles from './ChunkingVisualizer.module.css';

export default function ChunkingVisualizer() {
  const [strategyIdx, setStrategyIdx] = useState(0);
  const strategy = STRATEGIES[strategyIdx]!;

  // Compute chunks based on strategy
  const { displayChunks, smallChunks } = useMemo(() => {
    switch (strategy.id) {
      case 'fixed-size': {
        const c = chunkFixedSize(DOCUMENT, 80, 15);
        return { displayChunks: c, smallChunks: null };
      }
      case 'sentence': {
        const c = chunkSentences(DOCUMENT);
        return { displayChunks: c, smallChunks: null };
      }
      case 'paragraph': {
        const c = chunkParagraphs(DOCUMENT);
        return { displayChunks: c, smallChunks: null };
      }
      case 'parent-doc': {
        const { small, parents } = chunkParentDoc(DOCUMENT);
        return { displayChunks: parents, smallChunks: small };
      }
    }
  }, [strategy]);

  const stats = useMemo(
    () => computeStats(displayChunks, DOCUMENT.length),
    [displayChunks],
  );

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Chunking visualizer</div>
        <div className={styles.titleSubLabel}>
          Same document · four chunking strategies · color-coded boundaries
        </div>
      </div>

      {/* Strategy picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Strategy:</span>
          <div className={styles.strategyButtons}>
            {STRATEGIES.map((s, i) => (
              <button
                key={s.id}
                className={`${styles.strategyButton} ${strategyIdx === i ? styles.strategyButtonActive : ''}`}
                onClick={() => setStrategyIdx(i)}
              >{s.label}</button>
            ))}
          </div>
        </div>
        <div className={styles.strategyDescription}>{strategy.description}</div>
      </div>

      {/* Document with colored chunk backgrounds */}
      <div className={styles.docPanel}>
        <div className={styles.docTitle}>
          Document {strategy.id === 'parent-doc' ? '(colored by parent paragraph)' : '(colored by chunk)'}
        </div>
        <div className={styles.docBody}>
          {renderDocument(DOCUMENT, displayChunks, strategy.id === 'fixed-size')}
        </div>
      </div>

      {/* Small chunks (parent-doc strategy only) */}
      {smallChunks && (
        <div className={styles.smallChunksPanel}>
          <div className={styles.smallChunksTitle}>
            What gets embedded ({smallChunks.length} small chunks)
          </div>
          <div className={styles.smallChunksList}>
            {smallChunks.slice(0, 8).map(chunk => (
              <div
                key={chunk.id}
                className={styles.smallChunkRow}
                style={{
                  borderLeftColor: CHUNK_COLORS[chunk.parentId! % CHUNK_COLORS.length],
                }}
              >
                <span className={styles.smallChunkLabel}>
                  #{chunk.id} (parent #{chunk.parentId})
                </span>
                <span className={styles.smallChunkText}>{chunk.text.trim()}</span>
              </div>
            ))}
            {smallChunks.length > 8 && (
              <div className={styles.smallChunkMore}>
                ... and {smallChunks.length - 8} more small chunks (omitted for display)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className={styles.statsPanel}>
        <div className={styles.statsTitle}>Statistics</div>
        <div className={styles.statsGrid}>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Chunks</div>
            <div className={styles.statValue}>{stats.count}</div>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Avg size (tokens)</div>
            <div className={styles.statValue}>{stats.avgTokens}</div>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Size range</div>
            <div className={styles.statValue}>{stats.minTokens}–{stats.maxTokens}</div>
            <div className={styles.statSubValue}>σ {stats.stdDev}</div>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Coverage</div>
            <div className={styles.statValue}>{(stats.totalCoverage * 100).toFixed(0)}%</div>
            {stats.totalCoverage > 1.01 && (
              <div className={styles.statSubValue}>
                +{((stats.totalCoverage - 1) * 100).toFixed(0)}% overlap
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{strategy.insight}</div>
      </div>

      {/* Caption */}
      <div className={styles.caption}>
        Toggle between strategies to see the trade-offs. <strong>Chunk count</strong> drives
        retrieval precision (more chunks → more fine-grained matches). <strong>Chunk size variance</strong>
        affects embedding quality (uniform sizes embed more consistently). <strong>Overlap</strong>
        preserves context at boundaries but inflates index size. <strong>The chunking decision
        affects retrieval more than the embedding model choice</strong> — and is the most common
        source of "RAG isn't working" debugging.
      </div>
    </div>
  );
}

/**
 * Render the document with background-color spans for each chunk.
 * For fixed-size: chunks overlap, so we render each chunk as its own colored span,
 * inserting visible boundaries.
 * For other strategies: chunks are contiguous; render with cycled colors.
 */
function renderDocument(doc: string, chunks: Chunk[], showOverlap: boolean): JSX.Element {
  if (chunks.length === 0) return <span>{doc}</span>;

  // For non-overlapping strategies, simple span rendering
  if (!showOverlap) {
    return (
      <>
        {chunks.map((chunk, i) => (
          <span
            key={chunk.id}
            className={styles.chunkSpan}
            style={{
              backgroundColor: `color-mix(in srgb, ${CHUNK_COLORS[i % CHUNK_COLORS.length]} 20%, transparent)`,
              borderLeft: `2px solid ${CHUNK_COLORS[i % CHUNK_COLORS.length]}`,
            }}
            title={`Chunk ${i + 1} · ${chunk.tokenCount} tokens`}
          >
            {chunk.text}
          </span>
        ))}
      </>
    );
  }

  // For fixed-size: rebuild character-by-character with overlap stripes
  // For each character, determine which chunk(s) own it; assign the latest chunk's color
  const charColors: string[] = new Array(doc.length).fill('transparent');
  chunks.forEach((chunk, i) => {
    const color = CHUNK_COLORS[i % CHUNK_COLORS.length];
    for (let j = chunk.start; j < chunk.end; j++) {
      // For overlap, blend by taking the second chunk's color (so adjacent chunks alternate)
      charColors[j] = color;
    }
  });

  // Group consecutive same-color characters into spans
  const parts: JSX.Element[] = [];
  let curStart = 0;
  for (let i = 1; i <= doc.length; i++) {
    if (i === doc.length || charColors[i] !== charColors[curStart]) {
      const text = doc.slice(curStart, i);
      const color = charColors[curStart]!;
      parts.push(
        <span
          key={curStart}
          className={styles.chunkSpan}
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 22%, transparent)`,
          }}
        >
          {text}
        </span>,
      );
      curStart = i;
    }
  }
  return <>{parts}</>;
}
```

#### A.4 `ChunkingVisualizer.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .docPanel, .smallChunksPanel, .statsPanel, .insightPanel, .caption {
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
  min-width: 80px;
}
.strategyButtons { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.strategyButton {
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
.strategyButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.strategyButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}
.strategyDescription {
  margin-top: 0.5rem;
  padding: 0.45rem 0.7rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  font-style: italic;
}

/* Document panel */
.docTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.55rem;
  font-weight: 500;
}
.docBody {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-primary);
  padding: 0.7rem 0.9rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  max-height: 320px;
  overflow-y: auto;
}
.chunkSpan {
  padding: 0.05em 0.05em;
  border-radius: 2px;
  transition: background-color 250ms;
}

/* Small chunks (parent-doc only) */
.smallChunksTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.smallChunksList {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-height: 200px;
  overflow-y: auto;
}
.smallChunkRow {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 0.5rem;
  padding: 0.4rem 0.55rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-left-width: 3px;
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
}
.smallChunkLabel { color: var(--text-tertiary); }
.smallChunkText {
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.smallChunkMore {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  font-style: italic;
  padding: 0.3rem;
}

/* Statistics */
.statsTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.statCell {
  padding: 0.55rem 0.65rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.statLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  margin-bottom: 0.2rem;
}
.statValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--cyan-300);
}
.statSubValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  margin-top: 0.15rem;
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
  .statsGrid { grid-template-columns: repeat(2, 1fr); }
  .docBody { font-size: 0.82rem; line-height: 1.55; padding: 0.5rem 0.65rem; }
  .smallChunkRow { grid-template-columns: 90px 1fr; font-size: 0.7rem; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as RetrievalComparator } from './ch22/RetrievalComparator';
export { default as ChunkingVisualizer } from './ch22/ChunkingVisualizer';
```

#### A.6 Update `src/pages/ch22-retrieval-and-rag/index.mdx`

**Edit A: Update widget import:**

```mdx
import { RetrievalComparator, ChunkingVisualizer } from '@components/widgets';
```

**Edit B: Replace section-5's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Chunking visualizer" caption="The same document re-chunked under four strategies. Fixed-size with overlap (the tutorial default; predictable but can split mid-sentence). Sentence-based (preserves semantic units; variable size). Paragraph-based (larger units; works for prose). Parent-document (embed small chunks; retrieve large parents — modern default). Watch how chunk count, size variance, and coverage change. The chunking choice often affects retrieval more than the embedding model.">
  <ChunkingVisualizer client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("RAG architectures") and section 8 ("Production patterns and evaluation"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the production RAG stack. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

The exercises trace the chapter's arc: implement BM25 from scratch (Ex 1) → build a vector store (Ex 2) → combine them via RRF (Ex 3) → evaluate retrieval quality (Ex 4).

### Exercise 1 (easy) — BM25 from scratch

Implement BM25 scoring against a small corpus. Compute IDF and TF for each query term; apply length normalization and TF saturation.

<details>
<summary>Hint</summary>

BM25 score for query Q against document D:

$$\text{score}(D, Q) = \sum_{q \in Q} \text{IDF}(q) \cdot \frac{f(q, D) \cdot (k_1 + 1)}{f(q, D) + k_1 \cdot (1 - b + b \cdot \frac{|D|}{\text{avgdl}})}$$

where:
- $f(q, D)$ = how many times $q$ appears in $D$
- $|D|$ = length of $D$ in tokens
- $\text{avgdl}$ = average document length in the corpus
- $k_1 = 1.2$, $b = 0.75$ are standard
- $\text{IDF}(q) = \log(\frac{N - df + 0.5}{df + 0.5} + 1)$ with $df$ = number of docs containing $q$

Implementation steps:
1. Tokenize all docs (lowercase + whitespace split)
2. Build a term-frequency dictionary per doc
3. Build a document-frequency dictionary across the corpus
4. For each query token, compute IDF and add the per-doc contribution

</details>

<RunnableCode
  client:visible
  defaultCode={`import math
from collections import Counter

# Tiny corpus
docs = [
    "the cat sat on the mat",
    "machine learning models are trained on data",
    "deep learning is a subset of machine learning",
    "cats are great pets that love affection",
    "dogs are loyal companions",
]

def tokenize(text):
    return text.lower().split()

def bm25_scores(query, docs, k1=1.2, b=0.75):
    """
    Return a list of BM25 scores, one per doc.
    """
    # TODO:
    # 1. Tokenize each doc and the query.
    # 2. Compute document lengths and average length.
    # 3. Build doc-frequency dictionary (how many docs contain each term).
    # 4. For each doc, compute the BM25 score by summing over query terms.
    pass

# Test
queries = [
    "machine learning",
    "cats",
    "deep learning data",
]

# for q in queries:
#     scores = bm25_scores(q, docs)
#     ranked = sorted(zip(scores, docs), key=lambda x: -x[0])
#     print(f"\\nQuery: '{q}'")
#     for score, doc in ranked[:3]:
#         print(f"  {score:>6.2f}  {doc}")

# Expected behavior:
# - "machine learning" → docs 2 and 3 score highest (both terms present)
# - "cats" → doc 4 (literal match) scores higher than doc 1 ("cat" singular)
# - "deep learning data" → doc 3 (deep+learning) and doc 2 (learning+data)
`}
  packages={[]}
/>

### Exercise 2 (medium) — Vector store with cosine retrieval

Build a tiny in-memory vector store. Embed documents using a mock embedding function; at query time, embed the query and return the top-K most similar documents by cosine similarity.

<details>
<summary>Hint</summary>

The pattern:
1. **Pre-compute**: embed every doc; store (id, vector) pairs.
2. **At query time**: embed the query; compute cosine similarity to each stored vector; sort descending.

Cosine similarity:
$$\\cos(a, b) = \\frac{a \\cdot b}{\\|a\\| \\, \\|b\\|}$$

For the exercise: use a mock embedding function — random-but-seeded so the same text always produces the same vector. (In production: use a real embedding model.)

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

class VectorStore:
    def __init__(self, dim=8):
        self.dim = dim
        self.docs = []         # list of (id, text, vector) tuples
    
    def embed(self, text):
        """Mock embedding: deterministic random vector based on text hash."""
        seed = sum(ord(c) for c in text)
        rng = np.random.RandomState(seed)
        v = rng.randn(self.dim)
        # Add some structure: bias the vector based on a few keywords
        for keyword, axis_idx in [("machine", 0), ("learning", 1), ("cat", 2), ("dog", 3)]:
            if keyword in text.lower():
                v[axis_idx] += 2.0
        return v
    
    def add(self, doc_id, text):
        vector = self.embed(text)
        self.docs.append((doc_id, text, vector))
    
    def search(self, query, top_k=3):
        """Return [(score, doc_id, text), ...] sorted descending."""
        # TODO:
        # 1. Embed the query.
        # 2. Compute cosine similarity to each stored doc.
        # 3. Sort by similarity descending.
        # 4. Return the top_k.
        pass


# Build the store
docs = [
    "The cat sat on the mat.",
    "Machine learning models are trained on labeled data.",
    "Deep learning is a subset of machine learning.",
    "Cats are great pets that love affection.",
    "Dogs are loyal companions and playful.",
]

store = VectorStore()
for i, doc in enumerate(docs):
    store.add(i, doc)

# Test
queries = [
    "machine learning",
    "cat affection",
    "dog companions",
]
# for q in queries:
#     results = store.search(q, top_k=3)
#     print(f"\\nQuery: '{q}'")
#     for score, doc_id, text in results:
#         print(f"  sim={score:>5.2f}  id={doc_id}  {text}")

# Observations:
# - The mock embedding biases vectors by keyword presence, so cosine similarity
#   correlates with keyword overlap (approximating what real embeddings do).
# - In production: replace embed() with a real model (e.g., sentence-transformers).
# - The store structure (id, text, vector) is the production pattern.
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Hybrid retrieval with RRF

Combine BM25 and dense rankings via Reciprocal Rank Fusion. Verify that the combined ranking is robust across query types — never losing badly to either method.

<details>
<summary>Hint</summary>

Reciprocal Rank Fusion:

$$\\text{RRF}(d) = \\sum_{i} \\frac{1}{k + \\text{rank}_i(d)}$$

where the sum is over retrievers, $\\text{rank}_i(d)$ is the doc's rank in retriever $i$ (starting at 1), and $k$ is a constant (typically 60).

Why $k = 60$? It limits the influence of any single top-ranked doc. Without it, a doc ranked 1 would dominate (1/1 vs 1/2 is a 2× gap; 1/61 vs 1/62 is much smaller).

Steps:
1. Get rankings from each retriever as [(doc_id, rank), ...] lists.
2. Iterate over all rankings; accumulate RRF score per doc.
3. Sort descending.

</details>

<RunnableCode
  client:visible
  defaultCode={`def reciprocal_rank_fusion(rankings, k=60):
    """
    Combine multiple rankings via RRF.
    
    rankings: list of [(doc_id, rank), ...] from each retriever (rank starts at 1).
    Returns combined ranking sorted by RRF score descending.
    """
    # TODO:
    # 1. Initialize a dict: {doc_id: cumulative_rrf_score}
    # 2. For each ranking, for each (doc_id, rank), add 1.0 / (k + rank) to the doc's score.
    # 3. Sort by score descending and return.
    pass

# Mock rankings: BM25 and dense found different docs
bm25_ranking = [
    (0, 1),    # doc 0 ranked first by BM25
    (3, 2),
    (1, 3),
    (5, 4),
    (2, 5),
]

dense_ranking = [
    (1, 1),    # doc 1 ranked first by dense
    (0, 2),    # doc 0 ranked second by dense
    (4, 3),
    (3, 4),
    (7, 5),
]

# combined = reciprocal_rank_fusion([bm25_ranking, dense_ranking])
# print(f"{'Doc ID':>7} | {'RRF Score':>10}")
# print("-" * 25)
# for doc_id, score in combined:
#     print(f"{doc_id:>7} | {score:>10.4f}")
# 
# # Observations:
# # - Doc 0 (top in BM25, 2nd in dense) wins: scored by both
# # - Doc 1 (3rd in BM25, top in dense) also high: scored by both
# # - Doc 5 / 4 / 7 (in only one ranking) score lower
# # - RRF needs no score normalization — uses ranks only
# # - Robust to score-scale differences between retrievers

# Bonus: try a query where BM25 and dense find completely disjoint docs.
# RRF still produces a sensible combined ranking.
`}
  packages={[]}
/>

### Exercise 4 (hard) — Retrieval evaluation with recall@K

Build a small evaluation harness. Given a labeled test set (query → list of relevant doc IDs), compute recall@K for a retrieval method. Compare BM25 vs dense vs hybrid; verify the chapter's central claim — that hybrid is robust across query types.

<details>
<summary>Hint</summary>

Recall@K = fraction of relevant docs that appear in the top-K of the retriever's ranking.

$$\\text{recall@K} = \\frac{|\\text{relevant} \\cap \\text{top-K retrieved}|}{|\\text{relevant}|}$$

For each query in the test set:
1. Run the retriever; get top-K results.
2. Count how many of the K results are in the labeled relevant set.
3. Divide by the total number of relevant docs.

Average across queries for the overall recall@K.

In production, this is the basic IR evaluation. RAGAS extends it with faithfulness (does the answer match retrieved content?) and attribution (can each claim be traced?).

</details>

<RunnableCode
  client:visible
  defaultCode={`def recall_at_k(retrieved_ids, relevant_ids, k):
    """
    Compute recall@K for a single query.
    
    retrieved_ids: ordered list of retrieved doc IDs (top-K of retriever's ranking).
    relevant_ids:  set of doc IDs known to be relevant for this query.
    """
    # TODO:
    # 1. Take the top k of retrieved_ids.
    # 2. Count intersection with relevant_ids.
    # 3. Divide by len(relevant_ids).
    pass


def evaluate(retriever_fn, test_set, k=5):
    """
    Run a retriever over a test set; return average recall@K.
    
    test_set: list of (query, [relevant_doc_ids])
    retriever_fn: callable(query) -> ordered list of doc_ids
    """
    # TODO:
    # 1. For each (query, relevant_ids) in test_set:
    #    a. Call retriever_fn(query) to get a ranked list of doc_ids.
    #    b. Compute recall@K.
    # 2. Average recall@K across queries.
    pass


# Mock retrievers for the demo
def bm25_retriever(query):
    # Mocked: pretend BM25 returns these doc_ids in order for each query
    mock = {
        "machine learning": [2, 1, 4, 0, 3],
        "cat affection": [3, 0, 1, 2, 4],
        "prices rising": [4, 1, 0, 2, 3],   # BM25 misses inflation docs (no overlap)
    }
    return mock.get(query, [])

def dense_retriever(query):
    mock = {
        "machine learning": [1, 2, 4, 0, 3],
        "cat affection": [0, 3, 4, 1, 2],
        "prices rising": [1, 4, 0, 3, 2],   # dense finds doc 1 (inflation paraphrase)
    }
    return mock.get(query, [])

def hybrid_retriever(query):
    # Pretend this is the RRF combination of bm25 and dense
    mock = {
        "machine learning": [2, 1, 4, 0, 3],
        "cat affection": [3, 0, 1, 4, 2],
        "prices rising": [1, 4, 0, 3, 2],
    }
    return mock.get(query, [])

# Test set: query → relevant doc IDs
test_set = [
    ("machine learning", [1, 2]),       # ML & deep-learning docs
    ("cat affection", [0, 3]),          # cat docs
    ("prices rising", [1, 4]),          # inflation docs (paraphrased query)
]

# Evaluate each retriever
# print(f"{'Retriever':<10} | {'Recall@5':>9}")
# print("-" * 24)
# for name, fn in [("BM25", bm25_retriever), ("Dense", dense_retriever), ("Hybrid", hybrid_retriever)]:
#     avg = evaluate(fn, test_set, k=5)
#     print(f"{name:<10} | {avg:>9.2%}")
# 
# # Observation:
# # - BM25 misses on "prices rising" (no exact-term overlap with inflation docs)
# # - Dense catches it (paraphrase generalization)
# # - Hybrid catches it (gets best of both)
# # - This is the chapter's central claim, made measurable.
`}
  packages={[]}
/>

````

### Part C — Flip Ch 22's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 22, slug: 'ch22-retrieval-and-rag', title: 'Retrieval-augmented generation', partNum: 7, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 22 still render correctly (no changes to existing sections).
3. **Section 4's** `RetrievalComparator` marquee widget still renders correctly.
4. **Section 5** now renders the working `ChunkingVisualizer` widget.
5. **Default state**: strategy = "Fixed-size + overlap". Document shown with colored chunk backgrounds.
6. **Four strategy buttons**: Fixed-size / Sentence-based / Paragraph-based / Parent-document. Active button highlighted in cyan.
7. **Strategy description** updates with each selection.
8. **Document panel**: shows the full document with background-color spans marking chunks.
9. **For parent-document**: an additional "What gets embedded" panel shows the small chunks, color-coded by parent.
10. **Statistics grid** (4 cells): Chunks, Avg size (tokens), Size range (min-max with std σ), Coverage (% with overlap indicator).
11. **Stats update correctly for each strategy**:
    - **Fixed-size**: ~25-35 chunks, uniform size (small σ), >100% coverage (overlap shown)
    - **Sentence**: ~20-30 chunks, variable size (large σ), 100% coverage
    - **Paragraph**: 6 chunks, large size, 100% coverage
    - **Parent-doc**: 6 parent chunks shown with small-chunks list below
12. **Insight text** updates with each strategy selection.
13. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
14. **Sidebar**: Ch 1-22 all active (published); Ch 23-30 still dimmed.
15. **Prev/next at bottom of Ch 22**: prev = Ch 21 (active); next = Ch 23 (disabled).
16. **TOC**: includes Exercises as h2 between section 7 and section 8.
17. **Mobile**: stats grid stacks to 2 columns; document body remains readable.
18. **`npm run typecheck`** passes.
19. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not allow editing the document in the widget.** Fixed sample document only.
- ❌ **Do not call a real LLM** in exercises. Mock retrievers / hardcoded mock data only.
- ❌ **Do not flip any other chapter's status.** Only Ch 22 flips.
- ❌ **Do not modify Ch 1-21.** Sealed.
- ❌ **Do not modify Ch 22's marquee widget or prose sections 1-8.** Sealed. (Only insert the new Exercises section between sections 7 and 8.)
- ❌ **Do not implement a real embedding model in the chunking widget.** Chunking is about splitting; embeddings happen downstream.

---

## Wire-up

```bash
git add src/components/widgets/ch22/ChunkingVisualizer.tsx src/components/widgets/ch22/ChunkingVisualizer.module.css src/components/widgets/ch22/chunking-data.ts src/components/widgets/index.ts src/pages/ch22-retrieval-and-rag/index.mdx src/lib/chapters.ts
git commit -m "session 100: Ch 22 closeout — chunking visualizer + exercises + status: published"
git push origin main
```

---

## Ch 22 closeout

Chapter 22 is now the twenty-second complete chapter on production. **Phase 13 has three of its four chapters published** (Ch 20 Reasoning, Ch 21 Tool use, Ch 22 RAG). Only Ch 23 (Multimodal) remains in Phase 13.

Confirm before declaring Ch 22 done:

- ✅ BUILD_ORDER.md shows files 124-127 ✅
- ✅ Files 128 and 129 marked ⏭️ (absorbed for 4-file cadence)
- ✅ Ch 22 status is `'published'`
- ✅ Both Ch 22 widgets work in production
- ✅ All 4 Ch 22 exercises render with their starter code

**Cadence check across 22 chapters:**

**4-file cadence** holds for **16 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, 19, 21, **22**).
**5-file cadence** holds for **6 two-topic chapters** (Ch 1, 5, 8, 9, 14, 20).

**22-chapter pattern stable.** The build process continues to scale.

**Phase 13 (Capabilities) status:**
- ✅ Ch 20 (Reasoning)
- ✅ Ch 21 (Tool use)
- ✅ Ch 22 (RAG)
- ⬜ Ch 23 (Multimodal) — closes Phase 13

**What's next — Ch 23: Multimodal.** Where reasoning gave the model time to think, tool use gave it the ability to act, and RAG gave it the ability to retrieve, **multimodal extends all three to images, audio, and video.** Vision-language models, audio understanding, multimodal retrieval, and the computer-use bridge from Ch 21. **The chapter that takes LLMs beyond text — and closes Phase 13.**

---

## Notes for the session author

**On the chunking widget being more about "show, not tell":**
Chunking is hard to discuss abstractly. **Showing the same document re-chunked under four strategies makes the trade-offs visceral.** Reader sees that fixed-size cuts mid-sentence; sentence-based produces tiny/huge chunks; paragraph-based loses precision; parent-document combines small embeddings with large context.

Notes-for-author: "**The widget is the lesson.** A reader can spend more time clicking through four strategies than reading a thousand words of chunking discussion. **Visual contrast is the pedagogy.**"

**On the document being deliberately about RAG itself:**
The sample document is six paragraphs of RAG-related content (parametric memory, retrieval flavors, chunking, reranking, production, architectures). **Two reasons**:
1. **Pedagogical recursion**: the reader sees the chapter's own content being chunked. Self-referential.
2. **Content variety**: paragraphs differ in length and style, exercising the chunking strategies fairly.

Notes-for-author: "**The document is the chapter, in miniature.** Reader sees chunking applied to the very concepts they just read about. **The recursion is intentional.**"

**On the four exercises serving the production stack:**

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | BM25 from scratch | 2 |
| 2 | medium | Vector store + cosine retrieval | 3 |
| 3 | medium | RRF hybrid combination | 4 |
| 4 | hard | Retrieval evaluation (recall@K) | 8 |

**The progression: implement the components → combine them → evaluate them.** By the end, the reader has built the full first-stage retrieval pipeline from scratch.

Notes-for-author: "**Ex 4 is the discipline exercise.** Implementing recall@K teaches the reader to *measure* retrieval, not just *do* it. That's the production mindset."

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Parametric vs non-parametric | (chapter prose) |
| 2. BM25 sparse retrieval | Ex 1 |
| 3. Dense retrieval | Ex 2 |
| 4. Hybrid via RRF | Ex 3 + section 4 marquee |
| 5. Chunking strategies | section 5 widget |
| 6. Reranking | (chapter prose) |
| 7. RAG architectures | (chapter prose) |
| 8. Evaluation | Ex 4 |

Outcomes 2, 3, 4, 8 served by exercises. Outcome 5 served by the widget. Outcomes 1, 6, 7 served by chapter prose.

**On the chunking widget being implementation-detail-rich:**
The widget computes chunks for real (it doesn't use pre-computed data). **Four chunking algorithms in TypeScript** — small enough to read; pedagogically clear. Reader who skims the code sees how each strategy actually works.

Notes-for-author: "**Real chunking algorithms in the widget reinforce section 5's prose.** A reader who reads the source sees fixed-size with overlap, sentence regex, paragraph splitting, and parent-document hierarchy implemented — exactly as section 5 described."

**On the parent-document strategy getting special UI treatment:**
Parent-document is the most sophisticated strategy. The widget shows **two views**:
1. **Top: the document colored by parent paragraph**
2. **Below: a list of small chunks**, each with its parent ID and color

This makes the "embed small, retrieve large" pattern visible. Notes-for-author: "**The parent-doc strategy has the most going on conceptually.** The dual view makes it concrete: small chunks for precise retrieval; large parents for context."

**Pedagogical claim of the chapter (revisited):**
"RAG is the most-deployed LLM application pattern of 2024-2025. The conceptual frame: parametric memory (in weights) + non-parametric memory (retrieved). The production stack: BM25 + dense + RRF for hybrid retrieval; thoughtful chunking (the often-decisive quality lever); cross-encoder reranking when precision matters; the right architecture for the use case; disciplined evaluation. **Engineers need both the conceptual model and the production discipline. With Ch 22 complete, Phase 13 has covered thinking (Ch 20), acting (Ch 21), and retrieving — the three core capabilities beyond raw generation.**"

**Phase 13 progress after this session**: Ch 20 ✅, Ch 21 ✅, Ch 22 ✅. **One chapter remaining** in Phase 13: Ch 23 (Multimodal).

**File 100 of the project is complete.** The project crossed the 100-file mark earlier with Ch 22's research; **with this file, the project has reached 102 files (~68%)**. The build continues to scale predictably.

**This chapter is the production-infrastructure counterpart to Ch 21's engineering chapter.** Together with Ch 20 (reasoning) and Ch 23 (multimodal), Phase 13 covers the full capability stack.

Build with care.
