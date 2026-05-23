# Session 98 — Chapter 22 page structure

> First chapter session for Chapter 22 ("Retrieval-augmented generation"). **The chapter that lets the model look up what it doesn't know.** Eight sections walking from why retrieval matters → BM25 → dense → hybrid → chunking → reranking → architectures → production. Single-topic chapter; uses the **4-file cadence**. The third Phase 13 chapter; one chapter remains in Phase 13 after this one (Ch 23 Multimodal).

---

## Read first (in this order)

1. **`research/ch22-retrieval-and-rag/research.md`** — the source material. Every section, equation, code snippet, and misconception traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch21-tool-use/session-94-page-structure.md`** — for the Phase 13 voice template (Ch 21 is the immediate predecessor; same operational-engineering tone carries here)
4. **`prompts/chapters/ch20-reasoning/session-89-page-structure.md`** — for the Phase 13 opening voice template

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 22 page. By end of session:

- `src/pages/ch22-retrieval-and-rag/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch22-retrieval-and-rag/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 22's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch22-retrieval-and-rag/` with sidebar showing Ch 22 active, prev/next nav linking to Ch 21 (active) and Ch 23 (disabled)

**Tonal note:** Ch 22 is **practical infrastructure engineering.** RAG is **the most-deployed LLM application pattern of 2024-2025**; readers are likely working on a RAG system already. **The voice should reflect this**: practical, infrastructure-focused, honest about complexity. Concrete numbers (typical corpus sizes 100K-10M docs; chunk sizes 500-1000 tokens; top-K 3-10 after reranking; latency targets <2s). Honest tradeoffs (BM25 vs dense — both still useful; embedding dimension vs storage; chunking granularity; when reranking matters).

**Phase 13 progression**: this chapter is the third of four Phase 13 chapters. **Reasoning gave the model time to think (Ch 20); tool use gave it the ability to act (Ch 21); retrieval (this chapter) gives it the ability to know what it wasn't trained on.** After Ch 22: Ch 23 (Multimodal) closes Phase 13.

**Chapter cadence:** Ch 22 uses the **4-file cadence** (single-topic chapter).

---

## Inputs

State of the repo after session 96 (Ch 21 complete):

- Ch 1-21 all `'published'`
- `research/ch22-retrieval-and-rag/research.md` exists
- `src/lib/chapters.ts` has Ch 1-21 `'published'`, Ch 22-30 `'planned'`
- No `src/pages/ch22-retrieval-and-rag/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch22-retrieval-and-rag/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch22-retrieval-and-rag/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 22's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch22-retrieval-and-rag
description: Retrieval-augmented generation — how production LLMs ground their answers in real documents. From the parametric-vs-non-parametric knowledge distinction, through sparse retrieval (BM25), dense retrieval (embeddings + vector stores), hybrid retrieval (Reciprocal Rank Fusion), chunking strategies (fixed-size, sentence, parent-doc, contextual), cross-encoder reranking, RAG architectures (vanilla → agentic → graph-based), production patterns (caching, multi-tenant, freshness), and evaluation (recall@K, faithfulness, attribution — RAGAS). The chapter that lets the model look up what it doesn't know.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~280 words) of opening.

**Sample opening** — rewrite in chapter voice:

> A trained LLM's knowledge lives in its weights — call this **parametric memory**. It's fast, always available, and learned from pretraining. It also has three fundamental limits: the training cutoff hides recent events; your company's private docs were never in pretraining; specific records (a customer's order history, a database row) are too numerous to memorize. **Retrieval-augmented generation (RAG)** addresses all three. Index a corpus; given a query, fetch the most relevant documents; concatenate them into the model's context; generate a grounded answer. The model knows what's in its weights *and* what it can find.
>
> This chapter walks through the production RAG stack. **Sparse retrieval** (BM25, the classic) is still the strong baseline. **Dense retrieval** (embeddings + vector stores) handles semantic queries — "automobile" and "car" map to nearby vectors. **Hybrid retrieval** combines both via Reciprocal Rank Fusion and consistently beats either alone. **Chunking** — how to split documents before embedding — dominates retrieval quality more than choice of embedding model. **Reranking** with a cross-encoder turns recall-optimized first-stage retrieval into precision-optimized final results. **RAG architectures** range from vanilla (single retrieval) to agentic (retrieval as a tool — Ch 21 bridge) to graph-based (multi-hop). **Production patterns** — caching, multi-tenant isolation, freshness, evaluation — turn the conceptual pipeline into a reliable system.
>
> **RAG is the single most-deployed LLM pattern in production.** Every enterprise AI assistant, every documentation chatbot, every customer support agent, every legal-research tool — they all use RAG for one or more use cases. **By the end of this chapter, you'll know how to design, evaluate, and operate a production RAG system** — and which failure modes to anticipate. Then Chapter 23 closes Phase 13 with multimodal RAG extends to images and audio.

### Section 1: Why retrieval matters

**Heading:** `## Why retrieval matters`
**Word target:** ~400
**Sub-headings:** `### The three limits of parametric memory`, `### The two-stage pipeline`

**Teaching beats:**

**The three limits of parametric memory:**
1. **Training cutoff**: anything after pretraining is unknown to the model. Frontier models train continuously, but always with a cutoff.
2. **Private data**: your company's docs, the user's records, internal databases — none of this was in pretraining.
3. **Specific records**: a customer's order history, a single document, a database row — facts the model can't memorize all of.

**The two-stage pipeline:**
4. **Retrieve**: given a user query, find the top-K most relevant documents from a corpus
5. **Generate**: include those documents in the model's context; generate a grounded answer

```mdx
<Equation label="22.rag-pipeline">
$$\text{query} \;\xrightarrow{\text{retrieve}}\; \text{top-K docs} \;\xrightarrow{\text{generate}}\; \text{grounded answer}$$
</Equation>
```

**The fundamental trade-off**:
- **Parametric memory** is fast (no retrieval step) but **fixed**
- **Non-parametric memory** (retrieval) is **dynamic** but adds latency, infrastructure, and complexity
- **Production systems use both**: parametric for general knowledge; retrieval for fresh/private/specific facts

**Empirical scale (early 2025)**:
- **Internal docs corpora**: 100K-10M documents typical for enterprise RAG
- **Top-K per query**: 3-20 documents
- **Total context**: 5K-50K tokens after retrieval
- **Latency target**: <2s end-to-end
- **Quality**: well-tuned RAG can reach 80-95% answer accuracy on domain-specific QA

**Required callout** — type `aside`: **RAG is the single most-deployed LLM application pattern of 2024-2025.** Every enterprise AI assistant, documentation chatbot, customer support agent, and legal-research tool uses RAG. **If you're building AI products, you're building (or about to build) a RAG system.** The patterns in this chapter aren't optional — they're the foundation.

**No code in this section.** Setup.

**Connection forward:** Section 2 introduces the classic sparse-retrieval baseline — BM25.

### Section 2: Sparse retrieval — BM25

**Heading:** `## Sparse retrieval — BM25`
**Word target:** ~500
**Sub-headings:** `### TF-IDF intuition`, `### The BM25 refinements`, `### Why BM25 still wins`

**Teaching beats:**

**TF-IDF intuition:**
1. **Term frequency (TF)**: how often a query word appears in a document
2. **Inverse document frequency (IDF)**: how rare the word is across the corpus
3. **Score** = sum of TF × IDF over query terms

**The BM25 refinements** (Robertson 2009):
4. **Document length normalization**: penalize long documents (so they don't win by length alone)
5. **TF saturation**: cap the contribution of repeated terms (the 100th "quantum" matters less than the 1st)

**The BM25 formula** (sketch):

```mdx
<Equation label="22.bm25">
$$\text{score}(D, Q) = \sum_{q \in Q} \text{IDF}(q) \cdot \frac{f(q, D) \cdot (k_1 + 1)}{f(q, D) + k_1 \cdot (1 - b + b \cdot \frac{|D|}{\text{avgdl}})}$$
</Equation>
```

where $f(q, D)$ is term frequency, $|D|$ is doc length, $k_1, b$ are hyperparameters (typically $k_1 = 1.2$, $b = 0.75$).

**Why BM25 still wins**:
6. **Exact-match prowess**: keywords matter; embeddings can miss them
7. **No training required**: works on any corpus immediately
8. **Fast and well-understood**: implemented in every search engine
9. **Strong baseline**: dense retrieval often only modestly beats BM25 on general-purpose corpora

**Where BM25 fails**:
- **Synonyms**: "automobile" vs "car" — no shared exact terms
- **Paraphrases**: different surface forms
- **Concept queries**: "What causes inflation?" matches docs *mentioning* inflation but misses docs on monetary policy

**Required code** — `<RunnableCode>` showing BM25 retrieval:

```python
from rank_bm25 import BM25Okapi

# Tiny example corpus
docs = [
    "The cat sat on the mat.",
    "Cats are great pets that love affection.",
    "Dogs are loyal companions and very playful.",
    "Machine learning models can be trained on data.",
    "Deep learning is a subset of machine learning.",
]

# Tokenize (simple whitespace + lowercase for demo)
tokenized = [doc.lower().split() for doc in docs]
bm25 = BM25Okapi(tokenized)

# Query
query = "machine learning"
tokenized_query = query.lower().split()
scores = bm25.get_scores(tokenized_query)

# Rank
ranking = sorted(zip(scores, docs), key=lambda x: -x[0])
print(f"Query: '{query}'\\n")
print(f"{'Score':>7} | Doc")
print("-" * 70)
for score, doc in ranking:
    print(f"{score:>7.2f} | {doc}")

# Observations:
# - Doc 4 (Machine learning models...) and Doc 5 (Deep learning... machine learning) score highest
# - Both query terms ("machine", "learning") appear in those docs
# - The cat/dog docs score 0 (no shared terms)
# - BM25 catches exact-match queries beautifully — but would miss "AI training" entirely
```

**Required callout** — type `note`: MC1 from research.md. **"Dense retrieval always beats BM25."** False in many domains. **BM25 remains a strong baseline** — and often the *winning* technique on domains with technical vocabulary (legal, medical, code). Modern production systems use **hybrid** for safety; that's section 4.

**Connection forward:** Section 3 introduces the semantic counterpart — dense retrieval.

### Section 3: Dense retrieval — embeddings and vector stores

**Heading:** `## Dense retrieval — embeddings and vector stores`
**Word target:** ~600 — IMPORTANT
**Sub-headings:** `### The setup`, `### Embedding models`, `### Vector stores and ANN indices`

**Teaching beats:**

**The setup:**
1. **Embedding model**: maps text → vector in $\mathbb{R}^d$ (typically $d \in [384, 1536]$)
2. **Pre-compute**: embed every document chunk; store vectors in a database
3. **At query time**: embed the query; find top-K nearest by cosine similarity

```mdx
<Equation label="22.cosine-similarity">
$$\text{sim}(q, d) = \frac{\mathbf{e}_q \cdot \mathbf{e}_d}{\|\mathbf{e}_q\| \cdot \|\mathbf{e}_d\|}$$
</Equation>
```

**Why dense beats BM25 for semantic queries**:
4. **Synonyms cluster**: "automobile" and "car" map to nearby vectors
5. **Paraphrase-robust**: "What causes inflation?" finds documents on monetary policy
6. **Concept queries work**: the embedding captures meaning, not just surface form

**Embedding models** (a non-exhaustive landscape):
- **Sentence-BERT** (Reimers 2019): the OG; 768-dim
- **OpenAI `text-embedding-3-small`** (2024): cheap, 1536-dim, strong general-purpose
- **`all-MiniLM-L6-v2`**: tiny (22M params), 384-dim, runs locally — great for prototypes
- **E5-Mistral** (Wang 2023): LLM-based; very strong on benchmarks

**Vector stores**:
- **FAISS** (Meta): open-source; runs locally; IVF/HNSW/PQ indices
- **Pinecone**: managed service; production-grade
- **Weaviate, Qdrant, Milvus**: open-source managed/self-hosted
- **pgvector**: Postgres extension; good for hybrid SQL + vector

**Index types** (Approximate Nearest Neighbor — ANN):
- **Flat** (brute force): exact, slow at scale
- **IVF**: cluster vectors; search within clusters
- **HNSW**: graph-based; fast and accurate; modern default
- **PQ**: compress vectors; faster but lossy

**Required code** — `<RunnableCode>` showing dense retrieval:

```python
from sentence_transformers import SentenceTransformer
import numpy as np

# Load a small embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')   # 22M params, 384-dim

docs = [
    "The cat sat on the mat.",
    "Cats are great pets that love affection.",
    "Dogs are loyal companions and very playful.",
    "Machine learning models can be trained on data.",
    "Deep learning is a subset of machine learning.",
]

# Pre-compute document embeddings
doc_embeddings = model.encode(docs)

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Semantic query — uses terms not in any doc
query = "AI training"
query_embedding = model.encode([query])[0]

# Rank
similarities = [cosine_sim(query_embedding, e) for e in doc_embeddings]
ranking = sorted(zip(similarities, docs), key=lambda x: -x[0])

print(f"Query: '{query}'\\n")
print(f"{'Sim':>6} | Doc")
print("-" * 70)
for sim, doc in ranking:
    print(f"{sim:>6.3f} | {doc}")

# Observations:
# - "AI training" → ML and deep-learning docs rank highest
# - "AI" and "training" don't appear literally in any doc
# - BM25 would return 0 for this query — dense retrieval finds the right docs semantically
# - This is why dense retrieval is essential for natural-language queries.
```

**Required callout** — type `aside`: MC2 from research.md. **"Bigger embeddings are always better."** Mostly false at production scale. Larger embeddings (3072-dim vs 384-dim) **increase storage 8× and search latency proportionally** for marginal quality gains. **Production sweet spot**: 768-1536 dim depending on domain. **Profile both axes** — quality and infrastructure cost — before choosing.

**Connection forward:** Section 4 combines BM25 and dense — hybrid retrieval.

### Section 4: Hybrid retrieval

**Heading:** `## Hybrid retrieval`
**Word target:** ~400
**Sub-headings:** `### Why combine`, `### Reciprocal Rank Fusion`

**Teaching beats:**

**Why combine:**
1. **The empirical fact**: BM25 and dense retrieval find *different* documents.
2. **Combining them often beats either alone** by 5-15 points on recall@K.
3. **Mixed queries benefit most**: some queries are keyword-heavy ("error code E0023"); others are semantic ("how do I authenticate?").

**Reciprocal Rank Fusion** (RRF) — the production default:

```mdx
<Equation label="22.rrf">
$$\text{RRF}(d) = \sum_{i \in \{\text{sparse, dense}\}} \frac{1}{k + \text{rank}_i(d)}$$
</Equation>
```

where $k$ is a constant (often 60). **No score normalization needed** — uses ranks only.

**Alternative**: weighted sum of normalized scores:
$$\text{score}(d) = \alpha \cdot \text{norm}(\text{score}_\text{sparse}(d)) + (1 - \alpha) \cdot \text{norm}(\text{score}_\text{dense}(d))$$

**Score normalization is tricky** — BM25 and cosine similarity have different ranges. **RRF avoids this issue**.

**When hybrid wins most**:
- **Diverse query types** in the same workload
- **Mixed corpora** (technical + narrative)
- **Production**: hybrid is the default in mature RAG systems

**Required widget placeholder** — Retrieval Comparator (marquee, session 126):

```mdx
<WidgetFrame title="Retrieval comparator" caption="A small corpus with three query types: keyword (exact terms), semantic (paraphrased), and mixed. Run each query through BM25, dense, and hybrid (RRF) retrieval; compare which documents each method returns and at what rank. BM25 catches exact matches; dense catches semantic ones; hybrid catches both. The widget makes 'why hybrid is the production default' visible.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 126 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing hybrid retrieval via RRF:

```python
def reciprocal_rank_fusion(rankings, k=60):
    """
    Combine multiple rankings via Reciprocal Rank Fusion.
    rankings: list of [(doc, rank), ...] from each retriever (rank starts at 1).
    Returns combined ranking sorted by RRF score descending.
    """
    rrf_scores = {}
    for ranking in rankings:
        for doc, rank in ranking:
            rrf_scores[doc] = rrf_scores.get(doc, 0) + 1.0 / (k + rank)
    return sorted(rrf_scores.items(), key=lambda x: -x[1])

# Example: combine BM25 + dense rankings
# (In practice, you'd get these from the previous two demos.)
bm25_ranking = [
    ("Machine learning models can be trained on data.", 1),
    ("Deep learning is a subset of machine learning.", 2),
    ("The cat sat on the mat.", 3),
]
dense_ranking = [
    ("Deep learning is a subset of machine learning.", 1),
    ("Machine learning models can be trained on data.", 2),
    ("Cats are great pets that love affection.", 3),
]

combined = reciprocal_rank_fusion([bm25_ranking, dense_ranking])
print("Hybrid (RRF) ranking:\\n")
print(f"{'RRF':>6} | Doc")
print("-" * 70)
for doc, score in combined:
    print(f"{score:>6.4f} | {doc}")

# Observations:
# - Docs ranked highly by BOTH retrievers score highest (Deep learning, Machine learning)
# - Docs ranked highly by only one still appear, but lower
# - RRF doesn't need score normalization — uses ranks only
# - This is the production-default hybrid combination.
```

**Connection forward:** Section 5 covers the choice that dominates retrieval quality — chunking.

### Section 5: Chunking strategies

**Heading:** `## Chunking strategies`
**Word target:** ~500 — IMPORTANT (often more impactful than embedding choice)
**Sub-headings:** `### Why chunking matters`, `### Strategies`

**Teaching beats:**

**Why chunking matters:**
1. Documents are usually too long to embed as single vectors. **Chunking** splits them into pieces.
2. **Wrong chunk size can degrade recall by 30-50%.**
3. **Most "RAG isn't working" debugging traces to chunking choices**, not embedding model quality.

**Strategies**:

**1. Fixed-size chunks**: e.g., 512 tokens per chunk, 50-token overlap.
   - Simple, predictable; default in most tutorials.
   - Can split mid-sentence, hurting embedding quality.

**2. Sentence-based**: chunk on sentence boundaries.
   - Preserves semantic units.
   - Variable chunk size; can produce tiny or huge chunks.

**3. Paragraph-based**: chunk on paragraph breaks.
   - Larger semantic units; works for prose.

**4. Semantic chunking**: use embeddings to find topic boundaries.
   - Higher quality; more compute; less common in production.

**5. Parent-document retrieval**:
   - **Embed small chunks** (precise retrieval)
   - **Return large parent documents** (sufficient context)
   - Best of both worlds.

**6. Contextual retrieval** (Anthropic 2024):
   - **Prepend each chunk with a context summary** before embedding.
   - Improves retrieval by 30-50%.
   - Modern production technique.

**Chunk size tradeoffs**:
- **Small** (100-300 tokens): precise retrieval; risks losing context.
- **Medium** (500-1000 tokens): production sweet spot.
- **Large** (1500+ tokens): rarely chunked; embeddings get noisier.

**Required widget placeholder** — Chunking Visualizer (secondary, session 127):

```mdx
<WidgetFrame title="Chunking visualizer" caption="A medium-length document split using different chunking strategies: fixed-size, sentence-based, paragraph-based, parent-document. Toggle between strategies; see the resulting chunks color-coded by boundary type. Visualizes overlap, semantic-unit preservation, and chunk-size variance. The widget makes 'how chunking affects what gets retrieved' tangible.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 127 (secondary)
  </div>
</WidgetFrame>
```

**Required callout** — type `warning`: MC3 from research.md. **"Just use cosine similarity; don't worry about chunking."** False. **Chunking dominates retrieval quality.** Most "RAG isn't working" debugging traces back to chunking choices, not embedding model quality. **Spend more time on chunking than on choosing an embedding model.**

**Connection forward:** Section 6 covers the precision-improving stage — reranking.

### Section 6: Reranking

**Heading:** `## Reranking`
**Word target:** ~400
**Sub-headings:** `### The two-stage pattern`, `### Cross-encoders`

**Teaching beats:**

**The two-stage pattern:**
1. **Stage 1 — first-stage retrieval**: get top-100 candidates with a cheap method (BM25 or dense)
2. **Stage 2 — reranking**: score each (query, candidate) with a more accurate model
3. **Return top-K** (typically 3-10) of the reranked

**Why two stages?**:
- **First stage optimizes for recall** — find any relevant docs in top-100
- **Reranking optimizes for precision** — rank the most relevant first
- **Cross-encoders** are slow but accurate; perfect for reranking; not viable for first-stage

**Cross-encoder mechanics**:
- Input: `[query] [SEP] [document]` (concatenated)
- Output: a single relevance score
- **More accurate than dual-encoder dense retrieval** (which embeds query and doc separately)
- **Slower**: must score each (query, doc) pair individually

**Reranking models**:
- **`ms-marco-MiniLM-L-6-v2`**: small, fast, free; runs locally
- **`cross-encoder/ms-marco-electra-base`**: stronger, slower
- **Cohere Rerank API**: managed service; very strong
- **Voyage AI Rerank**: another managed option

**When reranking matters most**:
- **Domains where exact relevance ordering matters** (legal, medical)
- **Small top-K passed to the LLM** (top-3; rank quality is critical)
- **High recall, precision is the bottleneck**

**Typical recall@10 improvements from reranking**: 5-15 points on diverse corpora.

**No code in this section** (third runnable is the hybrid in section 4).

**Required callout** — type `note`: MC7 from research.md. **"Reranking is always worth it."** Depends on K and latency budget. **For top-3 with strict latency, reranking is essential.** For top-20 where the LLM filters in context, reranking may be skippable. **Profile before adopting.** Cross-encoders add 50-300ms per query depending on candidate count.

**Connection forward:** Section 7 covers the architectural design space — from vanilla RAG to agentic RAG to graph RAG.

### Section 7: RAG architectures

**Heading:** `## RAG architectures`
**Word target:** ~500
**Sub-headings:** `### Vanilla RAG`, `### Agentic RAG`, `### Specialized variants`

**Teaching beats:**

**Vanilla RAG** (the simplest pattern):
```
query → retrieve(K) → concat(query, docs) → LLM → answer
```
1. Single retrieval call; no iteration.
2. **Sufficient for FAQ, docs search, and most enterprise use cases.**

**Agentic RAG**:
3. The model **decides when to retrieve** via tool calls (Ch 21 bridge)
4. May retrieve **multiple times** with different queries
5. Can **reformulate** queries based on initial results
6. **Bridges to Ch 21**: retrieval is just one tool the agent can call

**Specialized variants**:
- **Self-RAG** (Asai 2023): model emits special tokens deciding when to retrieve; self-critiques outputs
- **HyDE** (Hypothetical Document Embeddings): generate a hypothetical answer first; embed *that* for retrieval; improves recall for short or vague queries
- **Graph RAG**: build a knowledge graph from documents; retrieve subgraphs; **better for multi-hop reasoning** ("Who is the CEO of the company that made X?")
- **RETRO** (Borgeaud 2022): RAG **baked into model architecture** — trained from scratch with retrieval; cross-attends to retrieved chunks. **Distinct from inference-time RAG**.

**Decision guide**:
- **FAQ / docs search**: vanilla RAG is sufficient
- **Multi-step research**: agentic RAG
- **Multi-hop questions**: graph RAG (still emerging)
- **High-quality production**: vanilla RAG + hybrid retrieval + reranking + careful chunking

**Required callout** — type `aside`: MC8 from research.md. **"Graph RAG is the future."** Unclear as of 2025. **Graph RAG is interesting for multi-hop reasoning** but production deployments are rare; the construction cost is high; vanilla RAG + good reranking covers most use cases. **Don't reach for graph RAG by default** — start with vanilla; add complexity when you have evidence you need it.

**Connection forward:** Section 8 covers what turns a RAG prototype into a production system.

### Section 8: Production patterns and evaluation

**Heading:** `## Production patterns and evaluation`
**Word target:** ~500
**Sub-headings:** `### Production concerns`, `### Evaluation`

**Teaching beats:**

**Production concerns**:

**Caching**:
- Cache embeddings for stable corpora (re-embedding is expensive)
- Cache query embeddings when queries repeat
- Cache full retrieval results for popular queries

**Freshness**:
- **How quickly do new docs become retrievable?**
- Real-time indexing for live data (news, chat); nightly batch for stable corpora
- **Trade-off**: freshness vs index cost

**Multi-tenant**:
- Each tenant's docs are isolated (security + relevance)
- Per-tenant index; per-tenant embedding cache
- Filter at retrieval time on tenant ID

**Security**:
- **Document ACLs**: who can see which docs?
- Filter retrieval results by permissions
- Audit trail for accessed documents

**Evaluation** — turning RAG from "seems to work" to "measurably works":

| Metric | What it measures |
|---|---|
| **Recall@K** | Did we retrieve the relevant docs? |
| **MRR** | Where did the first relevant doc appear? |
| **NDCG@K** | Are highly-relevant docs ranked higher? |
| **Faithfulness** | Does the answer match retrieved content? |
| **Attribution** | Can each claim be traced to a doc? |
| **Context precision** | Are retrieved chunks relevant? |
| **Context recall** | Did we retrieve all relevant chunks? |

**RAGAS** (Es 2023) — the standard RAG eval framework. Uses an LLM judge to score faithfulness and context precision.

**Common production failures**:
- **Retrieval misses**: fix with hybrid + better chunking + reranking
- **Faithfulness errors**: fix with prompt engineering; smaller models worse at this
- **Attribution gaps**: fix with structured output requiring citations
- **Stale data**: fix with freshness monitoring; recency filters

**Sample close** (rewrite in chapter voice):

> RAG is the most-deployed LLM pattern of 2024-2025 — and it's about more than embeddings. Production RAG combines BM25 and dense retrieval (hybrid via RRF), thoughtful chunking (often the biggest quality lever), cross-encoder reranking when precision matters, the right architecture for the use case, and disciplined evaluation (recall@K, faithfulness, attribution). Every enterprise AI system uses some form of RAG; engineers who design these systems need both the conceptual model and the production discipline.
>
> **Chapter 23 closes Phase 13**: multimodal — extending reasoning, tool use, and retrieval beyond text. Vision-language models, audio, video, and the protocols (and limits) that let LLMs operate across modalities. After Phase 13: **Phase 14** opens with safety, interpretability, and evaluation as full disciplines. **Phase 15** assembles the capability stack into complete agent architectures. The capability arc is two-thirds done.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 22, slug: 'ch22-retrieval-and-rag', title: 'Retrieval-augmented generation', partNum: 7, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch22-retrieval-and-rag/index.astro && rm src/pages/ch22-retrieval-and-rag/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch22-retrieval-and-rag/`** renders with:
   - Chapter eyebrow ("Chapter 22") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 3, 4)
   - 2 `<WidgetFrame>` placeholders (sections 4 and 5)
   - Labeled equations `<Equation label="22.rag-pipeline">`, `<Equation label="22.bm25">`, `<Equation label="22.cosine-similarity">`, `<Equation label="22.rrf">`
   - At least 5 callouts (the section-1 RAG-is-most-deployed aside, MC1 in section 2, MC2 in section 3, MC3 in section 5, MC7 in section 6, MC8 in section 7 — pick 5)
   - The 7-row evaluation metrics table in section 8
3. **Sidebar:** Ch 1-21 published; Ch 22 active (draft); Ch 23-30 dimmed
4. **Prev/next nav at bottom of Ch 22:** prev = Ch 21 (active); next = Ch 23 (disabled)
5. **TOC on Ch 22** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3600 and 4300 words
7. **`npm run typecheck`** passes
8. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 126 and 127 own them.
- ❌ **Do not write exercises.** Session 127 owns.
- ❌ **Do not flip Ch 22's status to `'published'`.** Session 127 owns.
- ❌ **Do not derive BM25 from probabilistic IR theory.** Show the formula; explain the refinements; don't go deeper.
- ❌ **Do not tutorial any specific vector store** (FAISS, Pinecone, etc.). Name them; don't deep-dive.
- ❌ **Do not enumerate every embedding model.** Name a few exemplars.
- ❌ **Do not implement graph RAG.** Brief mention in section 7 only.
- ❌ **Do not deep-dive RAGAS internals.** Cite it; show the metrics table.
- ❌ **Do not modify Ch 1-21.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch22-retrieval-and-rag/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch22-retrieval-and-rag/index.astro 2>/dev/null || true
git commit -m "session 98: Ch 22 prose — retrieval-augmented generation"
git push origin main
```

---

## Notes for the session author

**On the practical-infrastructure tone:**
Ch 22 is the most **infrastructure-heavy** chapter in Phase 13. Where Ch 20 had a research-survey narrative (CoT eras), Ch 21 had a single architectural pattern (the agent loop), **Ch 22 is about engineering a working production system.** The voice should feel like documentation written by a senior engineer who has built and operated several RAG systems.

Notes-for-author: "**Write like someone who has been paged at 3am because RAG was returning stale docs.** The chapter should feel battle-tested."

**On chunking being given prominent treatment:**
Section 5 is one of the chapter's most important sections. **The chunking choice often matters more than the embedding model**, yet most RAG tutorials gloss over it. **Give chunking real airtime** — six strategies enumerated, tradeoffs explicit, MC3 callout reinforcing the point.

Notes-for-author: "**If the reader takes one operational lesson from this chapter, it should be: spend more time on chunking than on choosing an embedding model.** Section 5 must make this case viscerally."

**On hybrid being the production default:**
Many readers will arrive with "dense retrieval is the modern way; BM25 is legacy." **The chapter actively rebuts this** (MC1, section 2's "Why BM25 still wins", section 4's hybrid as default). **Hybrid retrieval is the production default in mature systems** — this is the modern view.

Notes-for-author: "**The pendulum has swung back to hybrid.** Sophisticated teams don't choose 'dense' or 'BM25' — they use both. Reflect this maturity in the chapter."

**On the Retrieval Comparator marquee placement (section 4):**
The widget belongs in section 4 (hybrid) because that's where the comparison story lives. Reader sees the three methods on the same corpus with different query types. **The widget makes 'why hybrid is the production default' visible.**

**On the Chunking Visualizer secondary placement (section 5):**
Chunking is hard to discuss abstractly. The widget shows how different strategies actually split a document. **Hands-on with chunking strategies makes the trade-offs tangible.**

**On the 3 runnable code blocks**:
- **Section 2 (BM25)**: shows exact-match prowess on simple corpus
- **Section 3 (dense)**: shows semantic matching where BM25 fails ("AI training" → ML docs)
- **Section 4 (RRF)**: shows combination via Reciprocal Rank Fusion

**These three runnables form a complete sparse → dense → hybrid story.** Reader sees the progression in code.

**On the evaluation table being the production reality check:**
Section 8's metrics table grounds the chapter in measurable outcomes. **RAG isn't done when it "seems to work"** — it's done when you can measure recall@K, faithfulness, and attribution. Engineers need this discipline.

Notes-for-author: "**The evaluation table tells the reader: production RAG requires measurement.** Without recall and faithfulness metrics, you're flying blind."

**On the bridges to other chapters**:
- **Ch 17 (Inference)**: long retrieved contexts stress KV cache; mentioned in section 8
- **Ch 19 (Sampling)**: structured outputs for citations
- **Ch 20 (Reasoning)**: agentic RAG combines reasoning + retrieval
- **Ch 21 (Tool use)**: retrieval is one of the most common tools; Ex 3 of Ch 21 was tool retrieval — RAG generalizes
- **Ch 23 (Multimodal)**: extends to image and audio retrieval

**These bridges should feel natural** — the curriculum's connective tissue is dense by Chapter 22.

**Pedagogical claim of the chapter:**
"RAG is the most-deployed LLM application pattern of 2024-2025. The conceptual frame: parametric memory (in weights) + non-parametric memory (retrieved). The production stack: BM25 + dense + RRF for hybrid retrieval; thoughtful chunking (often the biggest quality lever); cross-encoder reranking when precision matters; the right architecture for the use case; disciplined evaluation. **Engineers need both the conceptual model and the production discipline. This chapter is the roadmap.**"

**Phase 13 progress after this session**: Ch 20 ✅, Ch 21 ✅, Ch 22 (in progress). **One chapter remains** in Phase 13: Ch 23 (Multimodal).

**This chapter is the production-engineering counterpart to Ch 21's tool-use engineering.** Together with Ch 20 (reasoning) and Ch 23 (multimodal), Phase 13 covers the full capability stack.

Build with care.
