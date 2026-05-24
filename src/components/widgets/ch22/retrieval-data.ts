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

  const docFreq = new Map<string, number>();
  for (const tokens of tokenizedDocs) {
    const unique = new Set(tokens);
    for (const t of unique) {
      docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    }
  }

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
  const bm25Raw = bm25Scores(query.text, corpus);
  const bm25 = rankByScore(bm25Raw);

  const denseRaw = corpus.map(d => query.denseScores[d.id] ?? 0);
  const dense = rankByScore(denseRaw);

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
