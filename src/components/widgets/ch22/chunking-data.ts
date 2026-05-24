/** A chunk: a slice of the original document with metadata. */
export interface Chunk {
  id: number;
  start: number;
  end: number;
  text: string;
  tokenCount: number;
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

/** ---------- Strategy 4: parent-document ----------
 * Two-level chunking: small chunks for precise retrieval, large parents for context.
 * Returns small chunks (each tagged with parentId) plus the parent paragraphs.
 */
export function chunkParentDoc(doc: string): { small: Chunk[]; parents: Chunk[] } {
  const parents = chunkParagraphs(doc);
  const small: Chunk[] = [];
  let id = 0;
  for (const parent of parents) {
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
  totalCoverage: number;
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
