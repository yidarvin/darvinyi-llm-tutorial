# Session 99 — Retrieval comparator marquee widget

> The marquee Chapter 22 widget. **A three-column side-by-side comparison** of BM25, Dense, and Hybrid (RRF) retrieval on a hand-curated 10-document corpus. **Four preset queries** demonstrate different retrieval scenarios: a keyword-heavy query (where BM25 wins), a semantic query (where Dense wins), a paraphrased query (where Dense really wins), and a mixed query (where Hybrid wins). **Correct documents are highlighted; the rank of the correct doc is read out for each method.** Reader watches BM25's exact-match prowess, Dense's semantic generalization, and Hybrid's consistent ability to catch both — **the chapter's central operational claim made visceral**: why hybrid retrieval is the production default.

---

## Read first (in this order)

1. **`research/ch22-retrieval-and-rag/research.md`** — concepts 2 (BM25), 3 (dense), 4 (hybrid) are the source material
2. **`prompts/chapters/ch22-retrieval-and-rag/session-98-page-structure.md`** — for the section-4 widget placeholder this session fills
3. **`prompts/chapters/ch21-tool-use/session-95-tool-call-trace-widget.md`** — for the recent Phase 13 widget conventions
4. **`prompts/chapters/ch19-sampling/session-87-sampling-distribution-widget.md`** — for the preset-driven comparison pattern (most similar precedent)

---

## Goal

Replace the `<WidgetFrame title="Retrieval comparator">` placeholder in section 4 with a working interactive widget that:

- Shows a **fixed 10-document corpus** (technical, conceptual, mixed content)
- Offers **4 preset queries** demonstrating different scenarios:
  1. **Keyword-heavy**: terms that appear literally in the corpus → BM25 wins
  2. **Semantic**: terms that don't literally appear but mean the same thing → Dense wins
  3. **Paraphrased**: a fully reworded question → Dense wins decisively
  4. **Mixed**: combines a keyword with semantic content → Hybrid wins
- Renders **three columns side by side**:
  - **BM25**: top-5 results with scores
  - **Dense**: top-5 results with cosine similarities
  - **Hybrid (RRF)**: top-5 results with RRF scores
- **Marks correct documents** with a cyan ✓ marker (each query has 2-3 hand-curated correct docs)
- **Shows the rank** of the first correct doc in each method (with ★ when the rank is 1)
- Includes an **insight panel** that adapts to the query type, explaining what the reader is seeing
- **Implements real BM25** in TypeScript (the corpus is small enough); uses **hand-tuned semantic scores** for Dense (a real embedding model would be overkill in-browser)
- Provides a **pedagogical caption** below

**End state:** section 4 of Chapter 22 has a working marquee widget. After 30 seconds of interaction (4 clicks across the query types), the reader should be able to articulate: (a) **BM25 wins on keyword queries** — exact matches dominate; (b) **Dense wins on semantic queries** — paraphrases and synonyms work; (c) **Hybrid wins on mixed queries** — and doesn't lose on the others; (d) **Hybrid is the production default** because it's robust across query types.

---

## Inputs

State of the repo after session 98:

- `src/pages/ch22-retrieval-and-rag/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 4 and 5)
- `src/lib/chapters.ts` has Ch 22 as `'draft'`
- No `src/components/widgets/ch22/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch22/RetrievalComparator.tsx` — the React widget
2. **Create** `src/components/widgets/ch22/RetrievalComparator.module.css` — scoped styles
3. **Create** `src/components/widgets/ch22/retrieval-data.ts` — corpus, queries, BM25 implementation, semantic scores, RRF combination
4. **Update** `src/components/widgets/index.ts` — add `RetrievalComparator` export
5. **Update** `src/pages/ch22-retrieval-and-rag/index.mdx` — replace section-4's `<WidgetFrame>` interior with `<RetrievalComparator client:visible />`

---

## Detailed spec

### 1. `retrieval-data.ts`

```ts
// src/components/widgets/ch22/retrieval-data.ts

/** A document in the demo corpus. */
export interface Doc {
  id: number;
  title: string;
  text: string;
}

/** 10-document corpus mixing technical and conceptual content. Hand-curated for pedagogical clarity. */
export const CORPUS: Doc[] = [
  {
    id: 0,
    title: 'BM25 sparse retrieval',
    text: 'BM25 is a sparse retrieval algorithm based on term frequency and inverse document frequency. It is the standard baseline for keyword-based search.',
  },
  {
    id: 1,
    title: 'Dense vector embeddings',
    text: 'Embedding models map text into high-dimensional vectors. Two pieces of text that mean the same thing produce nearby vectors.',
  },
  {
    id: 2,
    title: 'How automobiles work',
    text: 'A car uses an internal combustion engine to convert fuel into mechanical motion. Modern vehicles also use electric motors and hybrid systems.',
  },
  {
    id: 3,
    title: 'Electric vehicles',
    text: 'Battery-powered vehicles replace the internal combustion engine with electric motors and large lithium-ion battery packs.',
  },
  {
    id: 4,
    title: 'Inflation and monetary policy',
    text: 'Inflation occurs when the general price level rises. Central banks use interest-rate policy to influence price stability.',
  },
  {
    id: 5,
    title: 'Pasta carbonara recipe',
    text: 'A classic Roman pasta dish made with eggs, hard cheese, cured pork, and black pepper. No cream is involved in the traditional preparation.',
  },
  {
    id: 6,
    title: 'Neural network training',
    text: 'Training a neural network involves feeding it labeled training data and adjusting the weights through backpropagation to minimize loss.',
  },
  {
    id: 7,
    title: 'Reciprocal Rank Fusion',
    text: 'RRF combines rankings from multiple retrieval systems by summing the reciprocal of each document\'s rank across systems.',
  },
  {
    id: 8,
    title: 'Causes of rising prices',
    text: 'When demand outstrips supply, or when money supply expands rapidly, the general level of prices in an economy tends to climb.',
  },
  {
    id: 9,
    title: 'High-performance sports cars',
    text: 'Fast vehicles like Ferrari and Lamborghini emphasize acceleration, top speed, and handling. They are typically equipped with powerful engines and aerodynamic bodywork.',
  },
];

/** A preset query with hand-curated "correct" document IDs. */
export interface Query {
  id: string;
  label: string;
  type: 'keyword' | 'semantic' | 'paraphrased' | 'mixed';
  text: string;
  /** IDs of documents that are pedagogically "correct" results. */
  correctDocIds: number[];
  /** Hand-tuned dense (semantic) similarity scores per document. */
  denseScores: Record<number, number>;
}

export const QUERIES: Query[] = [
  {
    id: 'q1-keyword',
    label: 'Keyword-heavy',
    type: 'keyword',
    text: 'BM25 sparse retrieval algorithm',
    correctDocIds: [0, 7],
    /**
     * Semantic similarity (hand-tuned, 0-1):
     * - Doc 0 (BM25): high (exact concept match)
     * - Doc 7 (RRF): moderate (related concept)
     * - Doc 1 (dense embeddings): moderate (related; opposite of sparse)
     * - Other docs: low
     * BM25 will dominate here — exact term matches.
     */
    denseScores: {
      0: 0.82, 1: 0.55, 2: 0.05, 3: 0.04, 4: 0.06, 5: 0.02, 6: 0.18, 7: 0.62, 8: 0.04, 9: 0.05,
    },
  },
  {
    id: 'q2-semantic',
    label: 'Semantic',
    type: 'semantic',
    text: 'how do automobiles work',
    correctDocIds: [2, 3, 9],
    /**
     * "automobiles" appears in doc 2 (literal); "vehicles" in 2/3/9 (synonym).
     * BM25 finds doc 2 via the literal "automobiles"; misses 3 and 9.
     * Dense should pick up all three vehicle-related docs.
     */
    denseScores: {
      0: 0.04, 1: 0.07, 2: 0.91, 3: 0.78, 4: 0.05, 5: 0.06, 6: 0.08, 7: 0.05, 8: 0.05, 9: 0.71,
    },
  },
  {
    id: 'q3-paraphrased',
    label: 'Paraphrased',
    type: 'paraphrased',
    text: 'what makes prices go up in the economy',
    correctDocIds: [4, 8],
    /**
     * "inflation" not in query; "prices go up" is paraphrase.
     * BM25 will miss inflation-related docs because there's no overlap with "prices go up".
     * Doc 8 contains "rising prices" / "level of prices" — some overlap.
     * Doc 4 contains "inflation" / "general price level rises" — BM25 may catch via "prices".
     * Dense should catch both confidently.
     */
    denseScores: {
      0: 0.02, 1: 0.03, 2: 0.04, 3: 0.04, 4: 0.86, 5: 0.05, 6: 0.04, 7: 0.03, 8: 0.83, 9: 0.05,
    },
  },
  {
    id: 'q4-mixed',
    label: 'Mixed',
    type: 'mixed',
    text: 'training neural network embeddings',
    correctDocIds: [1, 6],
    /**
     * Three query terms: "training" (literal in 6), "neural network" (literal in 6),
     * "embeddings" (literal in 1).
     * BM25 will rank 6 high (two terms match); 1 lower (one term).
     * Dense should catch both as semantically similar.
     * Hybrid combines: both docs in top-2.
     */
    denseScores: {
      0: 0.18, 1: 0.79, 2: 0.04, 3: 0.05, 4: 0.05, 5: 0.03, 6: 0.84, 7: 0.20, 8: 0.05, 9: 0.05,
    },
  },
];

// =========================================================================
// BM25 implementation (small enough corpus that real BM25 is reasonable)
// =========================================================================

const K1 = 1.2;
const B = 0.75;

/** Tokenize: lowercase, simple whitespace + punctuation split. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/** Pre-compute corpus statistics for BM25. */
function buildBM25Stats(corpus: Doc[]) {
  const tokenizedDocs = corpus.map(d => tokenize(`${d.title} ${d.text}`));
  const docLengths = tokenizedDocs.map(d => d.length);
  const avgDocLength = docLengths.reduce((a, b) => a + b, 0) / docLengths.length;

  // Document frequencies (how many docs contain each term)
  const docFreq = new Map<string, number>();
  for (const tokens of tokenizedDocs) {
    const unique = new Set(tokens);
    for (const t of unique) {
      docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    }
  }

  // Term frequencies per doc
  const termFreq: Map<string, number>[] = tokenizedDocs.map(tokens => {
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) ?? 0) + 1);
    }
    return tf;
  });

  return { tokenizedDocs, docLengths, avgDocLength, docFreq, termFreq, N: corpus.length };
}

/** Score a query against all docs in the corpus using BM25. */
export function bm25Scores(query: string, corpus: Doc[]): number[] {
  const stats = buildBM25Stats(corpus);
  const queryTokens = tokenize(query);

  return corpus.map((_, docIdx) => {
    let score = 0;
    for (const q of queryTokens) {
      const df = stats.docFreq.get(q) ?? 0;
      if (df === 0) continue;
      const idf = Math.log((stats.N - df + 0.5) / (df + 0.5) + 1);
      const tf = stats.termFreq[docIdx]!.get(q) ?? 0;
      const lengthNorm = 1 - B + B * (stats.docLengths[docIdx]! / stats.avgDocLength);
      const numerator = tf * (K1 + 1);
      const denominator = tf + K1 * lengthNorm;
      score += idf * (numerator / denominator);
    }
    return score;
  });
}

/** Get a ranked list (docId, score) sorted descending. */
export function rankByScore(scores: number[]): Array<{ docId: number; score: number; rank: number }> {
  return scores
    .map((score, docId) => ({ docId, score }))
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

/** Reciprocal Rank Fusion of multiple rankings. k = constant (typically 60). */
export function rrf(
  rankings: Array<Array<{ docId: number; rank: number }>>,
  k = 60,
): Array<{ docId: number; score: number; rank: number }> {
  const scores = new Map<number, number>();
  for (const ranking of rankings) {
    for (const { docId, rank } of ranking) {
      scores.set(docId, (scores.get(docId) ?? 0) + 1 / (k + rank));
    }
  }
  return Array.from(scores.entries())
    .map(([docId, score]) => ({ docId, score }))
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

/** Build the three rankings (BM25, Dense, Hybrid) for a query. */
export interface RankingsResult {
  bm25: Array<{ docId: number; score: number; rank: number }>;
  dense: Array<{ docId: number; score: number; rank: number }>;
  hybrid: Array<{ docId: number; score: number; rank: number }>;
}

export function buildRankings(query: Query, corpus: Doc[]): RankingsResult {
  // BM25 scores from real implementation
  const bm25Raw = bm25Scores(query.text, corpus);
  const bm25 = rankByScore(bm25Raw);

  // Dense scores from hand-tuned data
  const denseRaw = corpus.map(d => query.denseScores[d.id] ?? 0);
  const dense = rankByScore(denseRaw);

  // Hybrid via RRF over BM25 and Dense rankings
  const hybrid = rrf([
    bm25.map(e => ({ docId: e.docId, rank: e.rank })),
    dense.map(e => ({ docId: e.docId, rank: e.rank })),
  ]);

  return { bm25, dense, hybrid };
}

/** Find the rank of the first correct doc in a ranking. Returns null if none of the correct docs appear in top-K. */
export function firstCorrectRank(
  ranking: Array<{ docId: number; rank: number }>,
  correctDocIds: number[],
  topK = 5,
): number | null {
  for (const entry of ranking.slice(0, topK)) {
    if (correctDocIds.includes(entry.docId)) {
      return entry.rank;
    }
  }
  return null;
}

/** Insight text for the query type. */
export function insightFor(query: Query): string {
  switch (query.type) {
    case 'keyword':
      return 'BM25 dominates: the query terms ("BM25", "sparse", "retrieval") appear literally in the relevant documents. Dense scores are also high — modern embedding models often catch keyword overlap too — but BM25 is the clearer win here.';
    case 'semantic':
      return 'Dense wins on semantic generalization: "automobiles" → "vehicles" / "cars" / "automobile". BM25 catches docs containing the literal word "automobiles" but misses the synonyms. Hybrid captures both signals.';
    case 'paraphrased':
      return 'Dense wins decisively: "prices go up" → "inflation" / "rising prices" / "general price level rises". BM25 has almost no overlap with the relevant docs because the query and docs share few exact terms.';
    case 'mixed':
      return 'Hybrid wins: BM25 catches docs with literal term overlap; Dense catches semantic relatives; RRF combines them. Note how the *correct* docs (cyan ✓) consistently rank high in the Hybrid column even when one method rates them low.';
  }
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Retrieval comparator                                             │
│                                                                  │
│ Pick a query:                                                    │
│   [ Keyword-heavy ]  [ Semantic ]  [ Paraphrased ]  [ Mixed ]   │
│                                                                  │
│ Query: "BM25 sparse retrieval algorithm"                         │
│ (Correct docs are highlighted ✓ in the rankings below.)          │
│                                                                  │
│ BM25                Dense                Hybrid (RRF)             │
│ ─────────────       ─────────────       ─────────────             │
│ 1. ✓ BM25 sparse    1.   Dense vector   1. ✓ BM25 sparse        │
│    score: 4.32         sim: 0.62           rrf: 0.0312           │
│ 2. ✓ RRF            2. ✓ BM25 sparse    2.   Dense vector        │
│    score: 2.15         sim: 0.55           rrf: 0.0301           │
│ 3.   Neural net    3. ✓ RRF             3. ✓ RRF                │
│    score: 1.02         sim: 0.20           rrf: 0.0294           │
│ 4.   Dense vec      4.   Neural net     4.   Neural net          │
│    score: 0.85         sim: 0.18           rrf: 0.0287           │
│ 5.   ...                                                          │
│                                                                  │
│ Rank of first correct doc:                                       │
│   BM25: 1 ★          Dense: 2          Hybrid: 1 ★                │
│                                                                  │
│ Insight:                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ BM25 dominates: the query terms ("BM25", "sparse", "retrieval")│
│ │ appear literally in the relevant docs. Dense scores are also  │ │
│ │ high — modern embedding models catch keyword overlap too —    │ │
│ │ but BM25 is the clearer win here.                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click query button → instantly redraws three columns; insight updates
- Each column shows top-5 results
- Each result has: rank, ✓ if correct, title, score
- "Rank of first correct doc" badges: ★ when rank = 1, plain number otherwise; ✗ when not in top-5

**Visual encoding:**
- **Correct docs**: cyan ✓ before the title; subtle cyan background
- **Wrong docs**: gray; no marker
- **Star (★)**: cyan accent on the "first correct rank" readout, only when rank = 1
- **Column headers**: monospace, BM25 / Dense / Hybrid in matching colors (amber / cyan / emerald respectively to echo earlier conventions)

### 3. `RetrievalComparator.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  CORPUS, QUERIES, buildRankings, firstCorrectRank, insightFor,
  type Query,
} from './retrieval-data';
import styles from './RetrievalComparator.module.css';

const TOP_K = 5;

export default function RetrievalComparator() {
  const [queryIdx, setQueryIdx] = useState(0);
  const query = QUERIES[queryIdx]!;
  const rankings = useMemo(() => buildRankings(query, CORPUS), [query]);
  const insight = insightFor(query);

  const bm25FirstCorrect = firstCorrectRank(rankings.bm25, query.correctDocIds, TOP_K);
  const denseFirstCorrect = firstCorrectRank(rankings.dense, query.correctDocIds, TOP_K);
  const hybridFirstCorrect = firstCorrectRank(rankings.hybrid, query.correctDocIds, TOP_K);

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Retrieval comparator</div>
        <div className={styles.titleSubLabel}>
          BM25 vs Dense vs Hybrid · on a hand-curated 10-doc corpus
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
              >{q.label}</button>
            ))}
          </div>
        </div>
        <div className={styles.queryText}>
          <span className={styles.queryTextLabel}>Query:</span>
          <span className={styles.queryTextValue}>"{query.text}"</span>
        </div>
        <div className={styles.queryNote}>
          Correct docs are highlighted with ✓ in the rankings below.
        </div>
      </div>

      {/* Three-column rankings */}
      <div className={styles.rankingsGrid}>
        <RankingColumn
          title="BM25"
          subtitle="sparse · exact match"
          colorClass={styles.colBM25}
          ranking={rankings.bm25}
          correctDocIds={query.correctDocIds}
          scoreLabel="score"
          scoreFormat={(s) => s.toFixed(2)}
        />
        <RankingColumn
          title="Dense"
          subtitle="embedding similarity"
          colorClass={styles.colDense}
          ranking={rankings.dense}
          correctDocIds={query.correctDocIds}
          scoreLabel="sim"
          scoreFormat={(s) => s.toFixed(3)}
        />
        <RankingColumn
          title="Hybrid"
          subtitle="RRF combination"
          colorClass={styles.colHybrid}
          ranking={rankings.hybrid}
          correctDocIds={query.correctDocIds}
          scoreLabel="rrf"
          scoreFormat={(s) => s.toFixed(4)}
        />
      </div>

      {/* Rank-of-first-correct readout */}
      <div className={styles.summaryPanel}>
        <div className={styles.summaryTitle}>Rank of first correct doc (top-{TOP_K})</div>
        <div className={styles.summaryGrid}>
          <FirstCorrectBadge label="BM25" rank={bm25FirstCorrect} />
          <FirstCorrectBadge label="Dense" rank={denseFirstCorrect} />
          <FirstCorrectBadge label="Hybrid" rank={hybridFirstCorrect} />
        </div>
      </div>

      {/* Insight */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{insight}</div>
      </div>

      {/* Caption */}
      <div className={styles.caption}>
        Click through the four queries. <strong>BM25 wins on keyword-heavy queries</strong>;
        <strong> Dense wins on semantic and paraphrased queries</strong>; <strong>Hybrid (RRF) is
        robust across all types</strong>, never losing badly to either alone. <strong>This is why
        hybrid retrieval is the production default</strong> in mature RAG systems — it handles the
        full diversity of real user queries.
      </div>
    </div>
  );
}

interface RankingColumnProps {
  title: string;
  subtitle: string;
  colorClass: string;
  ranking: Array<{ docId: number; score: number; rank: number }>;
  correctDocIds: number[];
  scoreLabel: string;
  scoreFormat: (s: number) => string;
}
function RankingColumn({
  title, subtitle, colorClass, ranking, correctDocIds, scoreLabel, scoreFormat,
}: RankingColumnProps) {
  return (
    <div className={`${styles.rankingColumn} ${colorClass}`}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitle}>{title}</div>
        <div className={styles.columnSubtitle}>{subtitle}</div>
      </div>
      <ol className={styles.rankList}>
        {ranking.slice(0, TOP_K).map(({ docId, score, rank }) => {
          const doc = CORPUS[docId]!;
          const isCorrect = correctDocIds.includes(docId);
          return (
            <li
              key={docId}
              className={`${styles.rankItem} ${isCorrect ? styles.rankItemCorrect : ''}`}
            >
              <span className={styles.rankNumber}>{rank}.</span>
              <span className={styles.rankCorrectMarker}>{isCorrect ? '✓' : ' '}</span>
              <span className={styles.rankTitle}>{doc.title}</span>
              <span className={styles.rankScore}>
                <span className={styles.scoreLabel}>{scoreLabel}:</span> {scoreFormat(score)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

interface FirstCorrectBadgeProps {
  label: string;
  rank: number | null;
}
function FirstCorrectBadge({ label, rank }: FirstCorrectBadgeProps) {
  let className = styles.badge;
  let display: string;
  if (rank === null) {
    className += ' ' + styles.badgeFail;
    display = '✗ not in top-5';
  } else if (rank === 1) {
    className += ' ' + styles.badgeBest;
    display = '★ 1';
  } else {
    display = `${rank}`;
  }
  return (
    <div className={className}>
      <div className={styles.badgeLabel}>{label}:</div>
      <div className={styles.badgeValue}>{display}</div>
    </div>
  );
}
```

### 4. `RetrievalComparator.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .summaryPanel, .insightPanel, .caption {
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
.queryText {
  margin-top: 0.6rem;
  padding: 0.5rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
}
.queryTextLabel { color: var(--text-tertiary); margin-right: 0.4rem; }
.queryTextValue { color: var(--cyan-300); font-weight: 500; }
.queryNote {
  margin-top: 0.4rem;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  font-style: italic;
}

/* Three-column grid */
.rankingsGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-bottom: 0.85rem;
}
.rankingColumn {
  padding: 0.7rem 0.6rem;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.colBM25 { border-left: 4px solid var(--amber-400); }
.colDense { border-left: 4px solid var(--cyan-400); }
.colHybrid { border-left: 4px solid var(--emerald-400); }

.columnHeader {
  margin-bottom: 0.55rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border-subtle);
}
.columnTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text-primary);
}
.colBM25 .columnTitle { color: var(--amber-400); }
.colDense .columnTitle { color: var(--cyan-400); }
.colHybrid .columnTitle { color: var(--emerald-400); }
.columnSubtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  margin-top: 0.1rem;
}

.rankList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.rankItem {
  display: grid;
  grid-template-columns: 22px 16px 1fr auto;
  gap: 0.3rem;
  align-items: baseline;
  padding: 0.35rem 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  border-radius: 3px;
  background: var(--bg-primary);
  border: 1px solid transparent;
}
.rankItemCorrect {
  background: color-mix(in srgb, var(--cyan-500) 6%, var(--bg-primary));
  border-color: color-mix(in srgb, var(--cyan-500) 35%, transparent);
}
.rankNumber { color: var(--text-tertiary); font-weight: 500; }
.rankCorrectMarker {
  color: var(--cyan-300);
  font-weight: 700;
  text-align: center;
}
.rankTitle {
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.74rem;
}
.rankItemCorrect .rankTitle { color: var(--cyan-300); font-weight: 500; }
.rankScore {
  font-size: 0.68rem;
  color: var(--text-secondary);
  text-align: right;
  white-space: nowrap;
}
.scoreLabel { color: var(--text-tertiary); }

/* Summary panel */
.summaryTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.summaryGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.badge {
  padding: 0.5rem 0.6rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: center;
}
.badgeLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
}
.badgeValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}
.badgeBest {
  background: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-primary));
  border-color: var(--cyan-500);
}
.badgeBest .badgeValue { color: var(--cyan-300); }
.badgeFail {
  background: color-mix(in srgb, var(--rose-400) 5%, var(--bg-primary));
  border-color: var(--rose-400);
}
.badgeFail .badgeValue { color: var(--rose-400); font-size: 0.78rem; }

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
  .rankingsGrid { grid-template-columns: 1fr; gap: 0.5rem; }
  .summaryGrid { gap: 0.3rem; }
  .badge { padding: 0.4rem 0.5rem; }
  .rankItem { grid-template-columns: 18px 14px 1fr auto; font-size: 0.66rem; }
  .rankTitle { font-size: 0.68rem; }
  .rankScore { font-size: 0.62rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as RetrievalComparator } from './ch22/RetrievalComparator';
// Session 127 will add:
// export { default as ChunkingVisualizer } from './ch22/ChunkingVisualizer';
```

### 6. Update `src/pages/ch22-retrieval-and-rag/index.mdx`

**Edit A: Add widget import:**

```mdx
import { RetrievalComparator } from '@components/widgets';
```

**Edit B: Replace section-4's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Retrieval comparator" caption="A 10-document corpus mixing technical and conceptual content. Four query types demonstrate the operational differences: keyword-heavy (BM25 wins), semantic (Dense wins), paraphrased (Dense wins decisively), mixed (Hybrid wins). Three columns side by side; correct docs are highlighted. Watch how Hybrid stays robust across all query types — never losing badly to either method. This is why hybrid retrieval is the production default in mature RAG systems.">
  <RetrievalComparator client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 4 of Ch 22** renders with the working widget. Section 5's placeholder still stubbed.
3. **Default state**: query 0 selected (Keyword-heavy). Three columns rendered; correct doc(s) highlighted.
4. **Four query buttons**: Keyword-heavy / Semantic / Paraphrased / Mixed. Active button highlighted in cyan.
5. **Query display panel**: shows the actual query string in cyan italic-style.
6. **Three columns**:
   - **BM25**: amber left-border accent, "score" label
   - **Dense**: cyan left-border accent, "sim" label
   - **Hybrid**: emerald left-border accent, "rrf" label
7. **Each column** shows top-5 results with rank, ✓ if correct, title, score.
8. **Correct documents**: cyan ✓ marker, cyan-tinted background, cyan title text.
9. **Rank-of-first-correct readout**: three badges showing BM25 / Dense / Hybrid first-correct rank.
   - **Rank = 1**: ★ symbol, cyan badge style
   - **Rank > 1**: plain number, default style
   - **Not in top-5**: "✗ not in top-5", rose badge style
10. **Insight panel** updates with each query change.
11. **Expected outcomes per query** (BM25 / Dense / Hybrid first-correct rank):
    - **Keyword-heavy** ("BM25 sparse retrieval algorithm"): 1 / 2 / 1 (BM25 wins on its home turf)
    - **Semantic** ("how do automobiles work"): 1 / 1 / 1 (BM25 gets doc 2 via literal "automobiles"; Dense also gets it; tied but Dense finds more across top-5)
    - **Paraphrased** ("what makes prices go up in the economy"): could be ✗ for BM25 if no overlap; 1 for Dense; 1 for Hybrid
    - **Mixed** ("training neural network embeddings"): low rank for BM25 (doc 6); 1 for Dense; 1 for Hybrid
12. **Hybrid's first-correct rank** is ≤ the worst of BM25 and Dense across all queries — demonstrating robustness.
13. **Mobile** (< 720px): three columns stack vertically; layout remains readable.
14. **`npm run typecheck`** passes.
15. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement real embedding models** in-browser. Hand-tuned semantic scores only — they're pedagogically clear.
- ❌ **Do not show all 10 documents in the UI.** Only top-5 per column.
- ❌ **Do not allow user-entered queries.** Four fixed queries.
- ❌ **Do not implement reranking.** That's a different topic; section 6.
- ❌ **Do not animate the rankings.** Click-driven updates only.
- ❌ **Do not flip Ch 22's status.** Session 127 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch22/ src/components/widgets/index.ts src/pages/ch22-retrieval-and-rag/index.mdx
git commit -m "session 99: retrieval comparator marquee — BM25 vs Dense vs Hybrid"
git push origin main
```

---

## Notes for the session author

**On the four queries being a pedagogical progression:**
The queries are designed to walk the reader through the chapter's central claim:
1. **Keyword-heavy** (BM25 wins) — establishes BM25's strength
2. **Semantic** (Dense wins) — shows BM25's limitation
3. **Paraphrased** (Dense wins decisively) — shows Dense's strength
4. **Mixed** (Hybrid wins) — shows why combining is the answer

**By click 4, the reader has internalized**: BM25 ≠ obsolete; Dense ≠ universal; Hybrid ≠ optional. **It's a three-act story** told in four clicks.

Notes-for-author: "**The four queries are the pedagogy.** Each one teaches a different lesson; the sequence builds the chapter's central claim."

**On real BM25 in TypeScript:**
The widget implements **real BM25** (not pre-computed scores). The corpus is small enough (~10 docs, ~500 total tokens) that the computation is trivial in-browser. **Why this matters pedagogically**: readers who skim the code see the formula in action; the connection between section 2's BM25 prose and the widget's behavior is direct.

Notes-for-author: "**Real BM25 in the widget reinforces section 2's prose.** A reader who opens the data file sees IDF, TF, length normalization in code — the same formula they just read about."

**On hand-tuned dense scores:**
Real embedding models would be overkill in-browser (model weights are 100MB+ for even small models). **Hand-tuned scores let us control the pedagogy**: we choose exactly which docs the "embedding model" should rank highly for each query, calibrated to teach the lesson.

The scores are calibrated so that:
- **Synonyms cluster** (automobile/vehicle/car all get high scores for "automobiles work")
- **Paraphrases cluster** (inflation/rising prices/price level both get high scores for "prices go up")
- **Concept words cluster** (BM25/RRF/embeddings all get moderate-to-high scores for retrieval queries)
- **Unrelated docs get low scores**

Notes-for-author: "**Hand-tuned scores aren't a shortcut — they're a deliberate pedagogical choice.** Real embedding scores are noisy; hand-tuned scores teach the *pattern* without the noise."

**On the corpus being deliberately mixed:**
The 10 documents span: retrieval algorithms (BM25, dense, RRF), automotive content (cars, electric vehicles, sports cars), economics (inflation, prices), cooking (carbonara), ML (neural networks). **This mix ensures every query type has both relevant and irrelevant docs to distinguish.**

Notes-for-author: "**The corpus is a microcosm of real RAG corpora**: technical content, conceptual content, off-topic content. **The variety is what makes the comparison illuminating.**"

**On the color convention for the three columns:**
- **BM25 = amber**: the "classic / sparse / exact" method
- **Dense = cyan**: the "modern / semantic" method
- **Hybrid = emerald**: the "combination / good outcome" method

This echoes earlier widget conventions: amber for source/intermediate; cyan for chosen/preferred; emerald for kept/good. **Visual continuity across the curriculum.**

**On the "rank of first correct doc" badges:**
The badges are the **single-number summary** of each method's performance. **Reader can compare BM25/Dense/Hybrid at a glance** without parsing the full rankings.

Notes-for-author: "**The badges are the quick-take.** A reader who only glances should see: 'oh, Hybrid is consistently 1 or low across all queries.' That's the chapter's central claim."

**On the cyan ✓ correct-doc highlighting:**
Cyan-tinted background + cyan title + ✓ marker for correct docs. **Pedagogically essential**: without highlighting, the reader has to know in advance which docs are "correct." With highlighting, the eye is drawn to whether the method ranked correct docs at the top.

**On the caption telegraphing the lesson:**
The caption explicitly states: "**BM25 wins on keyword-heavy queries; Dense wins on semantic and paraphrased queries; Hybrid (RRF) is robust across all types**, never losing badly to either alone."

This is the widget's central claim, made explicit so even a reader who doesn't click through every query gets the message. Notes-for-author: "**The caption is a safety net.** If the reader only clicks one query, the caption ensures they leave with the chapter's central insight."

**Pedagogical claim this widget supports:**
"BM25 and Dense retrieval find *different* documents. BM25 dominates on exact-match queries (keywords); Dense dominates on semantic queries (paraphrases, synonyms). **Hybrid retrieval (RRF) is robust across query types** — it never loses badly to either alone, and often wins outright on mixed queries. **This is why hybrid retrieval is the production default in mature RAG systems** — real user queries span the full keyword-to-semantic spectrum, and a single retrieval method can't handle them all."

After 30 seconds of interaction (4 clicks across query types), the reader has internalized: (a) BM25 still matters; (b) Dense generalizes beautifully; (c) the *combination* is what wins; (d) hybrid is the production default for good reason.

**This is Ch 22's central visualization.** Build with care.
