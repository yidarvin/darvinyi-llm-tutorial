# Chapter 22 — Retrieval-augmented generation: research

> Curated source material for Chapter 22's build sessions. **The chapter that lets the model look up what it doesn't know.** Where Ch 20 gave the model time to think and Ch 21 gave it the ability to act, Ch 22 gives it the ability to *retrieve* — to ground outputs in real documents instead of relying solely on parametric memory. **Tool retrieval from Ch 21 Ex 3 was a taste; RAG is the full meal.** Sparse retrieval (BM25), dense retrieval (embeddings + vector stores), hybrid retrieval, chunking strategies, reranking with cross-encoders, RAG architectures (vanilla → agentic → graph-based), production patterns, and evaluation. **Single-topic chapter**; uses the **4-file cadence**. **The chapter that turns "the model knows what it was trained on" into "the model knows what it can find."**

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Retrieval-augmented generation (RAG)

**Premise:** A trained LLM's knowledge is **parametric** — encoded in its weights. This has limits: the training cutoff means recent events are unknown; private knowledge (your company's docs) isn't in the weights; specific facts (a customer's order history) live in databases, not language. **Retrieval-augmented generation** addresses all three: fetch relevant documents from an external store; concatenate them into the model's context; generate an answer grounded in those documents. **RAG is how production LLMs handle private data, fresh facts, and specific records.**

**The two-step pattern**:
1. **Retrieve**: given a user query, find the top-K most-relevant documents from a corpus
2. **Generate**: include those documents in the model's context; generate a grounded answer

**Out of scope (other chapters):**
- Tool use mechanics (Ch 21 — but tool retrieval *is* a form of RAG; this chapter generalizes)
- Multimodal retrieval (Ch 23 covers vision/audio)
- Evaluation in depth (Ch 26 covers eval methodology more broadly)
- Knowledge graphs and structured retrieval (briefly mentioned; full treatment outside scope)

**In scope and locked:**
- **The retrieval problem**: parametric vs non-parametric knowledge
- **Sparse retrieval**: TF-IDF, BM25 (the classic baseline)
- **Dense retrieval**: embeddings, vector stores (FAISS, Pinecone, etc.)
- **Hybrid retrieval**: combining sparse + dense scores
- **Chunking strategies**: fixed-size, sentence, semantic, parent-document
- **Reranking**: second-stage cross-encoders
- **RAG architectures**: vanilla → agentic (with reasoning) → graph-based
- **Production patterns**: caching, freshness, multi-tenant, security
- **Evaluation**: recall@K, faithfulness, attribution (RAGAS, etc.)

**Suggested chapter structure** (8 sections):

1. Why retrieval matters (~400 words)
2. Sparse retrieval — BM25 (~500 words)
3. Dense retrieval — embeddings and vector stores (~600 words)
4. Hybrid retrieval (~400 words)
5. Chunking strategies (~500 words)
6. Reranking (~400 words)
7. RAG architectures (~500 words)
8. Production patterns and evaluation (~500 words)

Target: ~3800 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Robertson 2009 — "The Probabilistic Relevance Framework: BM25 and Beyond"
- **URL:** [stephenrobertson.org/papers/SIGIR2009-tutorial.pdf](https://www.staff.city.ac.uk/~sb317/papers/foundations_bm25_review.pdf)
- **What it contributed:** **BM25** — the gold-standard sparse retrieval algorithm. TF-IDF with document length normalization and saturating term frequency. **The strong baseline that all modern retrieval is measured against**; still wins on many domains in 2025.
- **For the chapter:** central reference for section 2.

### Reimers & Gurevych 2019 — "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks"
- **arXiv:** [1908.10084](https://arxiv.org/abs/1908.10084)
- **What it contributed:** **Sentence-BERT (SBERT)** — fine-tunes BERT to produce sentence embeddings via a siamese architecture. The first widely-deployed dense-embedding model for semantic similarity. **The technique that made dense retrieval practical at scale.**
- **For the chapter:** section 3 reference.

### Karpukhin et al. 2020 — "Dense Passage Retrieval for Open-Domain Question Answering"
- **arXiv:** [2004.04906](https://arxiv.org/abs/2004.04906)
- **What it contributed:** **DPR** — dense retrieval specifically for QA. Trained with contrastive learning on QA pairs. Demonstrated dense retrieval could substantially beat BM25 on QA benchmarks.
- **For the chapter:** section 3 reference.

### Lewis et al. 2020 — "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"
- **arXiv:** [2005.11401](https://arxiv.org/abs/2005.11401)
- **What it contributed:** **the original RAG paper.** Coupled DPR (retrieval) with BART (generation). Demonstrated that retrieval-augmented models outperform pure parametric models on knowledge-heavy tasks. **The paper that gave the technique its name.**
- **For the chapter:** central reference for section 7 (architectures) and section 1 framing.

### Khattab & Zaharia 2020 — "ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT"
- **arXiv:** [2004.12832](https://arxiv.org/abs/2004.12832)
- **What it contributed:** **ColBERT** — multi-vector representation; each token in a document gets its own embedding; query-document similarity uses late interaction (MaxSim per query token). Higher accuracy than single-vector dense retrieval, at higher storage cost.

### Johnson, Douze, Jégou 2017 — "Billion-scale similarity search with GPUs" (FAISS)
- **arXiv:** [1702.08734](https://arxiv.org/abs/1702.08734)
- **What it contributed:** **FAISS** — Meta's open-source library for vector similarity search. IVF, HNSW, PQ indices. **The standard for billion-scale vector retrieval.**
- **For the chapter:** section 3 vector-store reference.

### Asai et al. 2023 — "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection"
- **arXiv:** [2310.11511](https://arxiv.org/abs/2310.11511)
- **What it contributed:** **Self-RAG** — the model decides *when* to retrieve, and *self-critiques* its outputs. Uses special tokens to mark retrieval decisions. **One of the modern variants of RAG.**

### Es et al. 2023 — "RAGAS: Automated Evaluation of Retrieval Augmented Generation"
- **arXiv:** [2309.15217](https://arxiv.org/abs/2309.15217)
- **What it contributed:** **RAGAS** — an evaluation framework for RAG systems. Metrics: faithfulness (does the answer match retrieved content?), context precision (are retrieved chunks relevant?), context recall (did we retrieve everything needed?). **Standardized RAG evaluation.**
- **For the chapter:** section 8 reference.

### Anthropic 2024 — "Introducing Contextual Retrieval"
- **URL:** [anthropic.com/news/contextual-retrieval](https://www.anthropic.com/news/contextual-retrieval)
- **What it contributed:** **contextual retrieval** — prepend each chunk with a context summary before embedding. Improves retrieval quality by 30-50%. **A modern production technique.**

### Wang et al. 2023 — "Improving Text Embeddings with Large Language Models"
- **arXiv:** [2401.00368](https://arxiv.org/abs/2401.00368)
- **What it contributed:** **E5-Mistral** — using an LLM to generate synthetic training data for embedding models. Demonstrates how modern embedding models are trained.

### Borgeaud et al. 2022 — "Improving Language Models by Retrieving from Trillions of Tokens" (RETRO)
- **arXiv:** [2112.04426](https://arxiv.org/abs/2112.04426)
- **What it contributed:** **RETRO** — DeepMind's retrieval-augmented LM trained from scratch with retrieval baked into the architecture. Demonstrated competitive performance with much smaller parametric size. **A *trained* RAG, vs RAG as an inference-time pipeline.**

---

## Core concepts

### Concept 1: Why retrieval matters

**The parametric knowledge problem**:
A trained LLM stores knowledge in its weights — facts, patterns, language. This is **parametric knowledge**. It has three fundamental limits:

1. **Training cutoff**: anything that happened after training is unknown
2. **Private data**: your company's docs, the user's records, internal databases — none of this was in pretraining
3. **Specific records**: a customer's order history, a database row, a single document — these are facts the model can't memorize all of

**Retrieval-augmented generation (RAG)** addresses all three:
1. **Index a corpus** of documents (your private docs; current news; database records)
2. **At query time**, find the top-K most relevant documents
3. **Concatenate** them into the model's context
4. **Generate** an answer grounded in the retrieved documents

**The fundamental trade-off**:
- **Parametric memory** is fast (no retrieval step) but fixed
- **Non-parametric memory** (retrieval) is dynamic but adds latency, infrastructure, and complexity
- **Modern production systems use both**: parametric for general knowledge; retrieval for fresh/private/specific facts

**The two-stage pipeline**:

```mdx
<Equation label="22.rag-pipeline">
$$\text{query} \;\xrightarrow{\text{retrieve}}\; \text{top-K docs} \;\xrightarrow{\text{generate}}\; \text{grounded answer}$$
</Equation>
```

**Empirical scale (early 2025)**:
- **Internal docs corpora**: 100K-10M documents typical for enterprise RAG
- **Top-K retrieved per query**: 3-20 documents
- **Total context after retrieval**: 5K-50K tokens (depending on chunk size and K)
- **Production latency target**: <2s end-to-end (retrieval + generation)
- **Quality**: well-tuned RAG can achieve 80-95% answer accuracy on domain-specific QA

### Concept 2: Sparse retrieval — BM25

**The classic technique** (predates deep learning by decades). **Still the strong baseline** in 2025.

**TF-IDF intuition**:
- **Term frequency (TF)**: how often a word appears in a document
- **Inverse document frequency (IDF)**: how rare the word is across the corpus
- **Score** = sum of TF × IDF over query terms

**BM25** (Robertson 1994 / 2009) refines TF-IDF with:
- **Document length normalization**: penalize long documents (so they don't win just by being long)
- **TF saturation**: capping the contribution of repeated terms (the 100th occurrence of "quantum" matters less than the 1st)

**The BM25 formula** (sketch):

$$\text{score}(D, Q) = \sum_{q \in Q} \text{IDF}(q) \cdot \frac{f(q, D) \cdot (k_1 + 1)}{f(q, D) + k_1 \cdot (1 - b + b \cdot \frac{|D|}{\text{avgdl}})}$$

where:
- $f(q, D)$ = term frequency of query word $q$ in document $D$
- $|D|$ = document length
- $\text{avgdl}$ = average document length in corpus
- $k_1, b$ = hyperparameters (typically $k_1 = 1.2$, $b = 0.75$)

**Why BM25 still works**:
- **Exact-match prowess**: keywords matter; embeddings can miss them
- **No training required**: works on any corpus immediately
- **Fast and well-understood**: implemented in every search engine
- **Strong baseline**: dense retrieval often only modestly beats BM25 on general-purpose corpora

**Where BM25 fails**:
- **Synonyms**: "automobile" vs "car" — no shared exact terms
- **Paraphrases**: different surface forms
- **Concept queries**: "What causes inflation?" matches documents that mention "inflation" but may miss documents on monetary policy

### Concept 3: Dense retrieval — embeddings and vector stores

**The setup**:
1. **Embedding model**: maps text → vector in $\mathbb{R}^d$ (typically $d \in [384, 1536]$)
2. **Pre-compute**: embed every document chunk; store vectors
3. **At query time**: embed the query; find the top-K nearest vectors by cosine similarity

```mdx
<Equation label="22.cosine-similarity">
$$\text{sim}(q, d) = \frac{\mathbf{e}_q \cdot \mathbf{e}_d}{\|\mathbf{e}_q\| \cdot \|\mathbf{e}_d\|}$$
</Equation>
```

**Why dense beats BM25 for semantic queries**:
- "automobile" and "car" map to nearby vectors
- "What causes inflation?" maps near documents on monetary policy
- **Paraphrase-robust**

**Embedding models**:
- **Sentence-BERT** (Reimers 2019): the OG; small (110M params); 768-dim
- **OpenAI `text-embedding-3-small`** (2024): cheap, 1536-dim, strong general-purpose
- **OpenAI `text-embedding-3-large`**: 3072-dim, higher quality
- **`all-MiniLM-L6-v2`**: tiny (22M params), 384-dim, runs locally
- **E5-Mistral** (Wang 2023): LLM-based; very strong on benchmarks

**Vector stores** (where embeddings live):
- **FAISS** (Meta): open-source, fast, runs locally; IVF/HNSW/PQ indices
- **Pinecone**: managed service; production-grade
- **Weaviate, Qdrant, Milvus**: open-source managed/self-hosted
- **pgvector**: Postgres extension; good for hybrid SQL + vector
- **Modern reality**: most teams use a managed service for production; FAISS for prototypes

**Index types** (for ANN — Approximate Nearest Neighbor):
- **Flat** (brute force): exact; slow at scale
- **IVF** (Inverted File): cluster vectors; search within clusters
- **HNSW** (Hierarchical Navigable Small World): graph-based; fast and accurate
- **PQ** (Product Quantization): compress vectors; faster but lossy

### Concept 4: Hybrid retrieval

**The empirical fact**: BM25 and dense retrieval find *different* documents. **Combining them often beats either alone.**

**The pattern**:
1. Run BM25 query → get top-K_sparse documents with scores
2. Run dense query → get top-K_dense documents with scores
3. **Combine the rankings** (multiple methods exist)
4. Take the top-K of the combined ranking

**Combination methods**:

**Reciprocal Rank Fusion (RRF)**:
$$\text{RRF}(d) = \sum_{i \in \{\text{sparse, dense}\}} \frac{1}{k + \text{rank}_i(d)}$$
where $k$ is a constant (often 60). **Simple, robust, no score normalization needed.**

**Weighted combination**:
$$\text{score}(d) = \alpha \cdot \text{norm}(\text{score}_\text{sparse}(d)) + (1 - \alpha) \cdot \text{norm}(\text{score}_\text{dense}(d))$$

**Score normalization is tricky**: BM25 and cosine similarity have different ranges and distributions. RRF avoids this issue.

**When hybrid wins most**:
- **Mixed query types**: some queries are keyword-heavy ("error code E0023"); others are semantic ("how do I authenticate?")
- **Diverse corpora**: technical docs benefit from both
- **Production**: hybrid retrieval is the default in mature RAG systems

**Empirical**: hybrid retrieval typically adds 5-15 points on recall@K vs either alone.

### Concept 5: Chunking strategies

**The problem**: documents are too long to embed as single vectors. **Chunking** splits them into pieces.

**Strategies**:

**1. Fixed-size chunks**: e.g., 512 tokens per chunk, with 50-token overlap
   - **Simple, predictable**
   - **Can split mid-sentence**, hurting embedding quality
   - **The default** in most RAG tutorials

**2. Sentence-based**: chunk on sentence boundaries
   - **Preserves semantic units**
   - **Variable size** — can produce tiny or huge chunks

**3. Paragraph-based**: chunk on paragraph breaks
   - **Larger semantic units**
   - **Works well for prose**

**4. Semantic chunking**: use embeddings to find topic boundaries; split there
   - **Higher quality but more compute**
   - **Less common in production**

**5. Parent-document retrieval**:
   - **Embed small chunks** (for precise retrieval)
   - **Return large parent documents** (for sufficient context)
   - Best of both worlds

**6. Contextual retrieval** (Anthropic 2024):
   - Prepend each chunk with a summary of its document context
   - Embed the contextualized chunk
   - **Improves retrieval by 30-50%** on many benchmarks

**Chunk size tradeoffs**:
- **Small** (100-300 tokens): precise retrieval; risks losing context
- **Medium** (500-1000 tokens): production sweet spot
- **Large** (1500+ tokens): rarely chunked; embeddings get noisier

**Common pitfalls**:
- **Wrong chunk size for the corpus** (technical docs need smaller chunks than narrative)
- **No overlap between chunks** (loses context at boundaries)
- **Embedding marketing copy** when the queries are technical

### Concept 6: Reranking

**The pipeline addition**:
1. Retrieve top-100 with cheap method (BM25 or dense)
2. **Rerank** with a more expensive model
3. Return top-K (typically 3-10) of the reranked

**Why rerank?**:
- First-stage retrieval optimizes for *recall* (find any relevant doc)
- Reranking optimizes for *precision* (rank the most relevant first)
- **Cross-encoders** are slow but accurate; **good for the rerank stage**, not for first-stage retrieval

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
- **When top-3 will be passed to the LLM** (small budget; rank quality is critical)
- **When recall is high but precision is the bottleneck**

**Typical recall@10 improvements from reranking**: 5-15 points on diverse corpora.

### Concept 7: RAG architectures

**Vanilla RAG**:
```
query → retrieve(K) → concat(query, docs) → LLM → answer
```
**The simplest pattern.** Single retrieval call; no iteration.

**Agentic RAG**:
- The model **decides when to retrieve** (uses tool calls — Ch 21)
- May retrieve **multiple times** with different queries
- Can **reformulate** queries based on initial results
- **Bridges to Ch 21**: retrieval is just one tool the agent can call

**Self-RAG** (Asai 2023):
- Model emits special tokens deciding whether retrieval is needed
- Critiques its own outputs against retrieved context
- More sophisticated than vanilla RAG

**HyDE** (Hypothetical Document Embeddings):
- Use the LLM to generate a *hypothetical* answer first
- Embed the hypothetical answer; use that for retrieval
- **Improves recall** when queries are short or vague

**Graph RAG**:
- Build a knowledge graph from documents (entities, relationships)
- Retrieve **subgraphs** rather than chunks
- **Better for multi-hop reasoning** ("Who is the CEO of the company that made X?")
- Active area of research; production use limited

**RETRO** (Borgeaud 2022):
- RAG **baked into the model architecture**
- Trained from scratch with retrieval; cross-attends to retrieved chunks
- **Distinct from inference-time RAG**: this is a *trained* retrieval model

**The choice depends on use case**:
- **FAQ / docs search**: vanilla RAG is sufficient
- **Multi-step research**: agentic RAG
- **Multi-hop questions**: graph RAG (still emerging)
- **High-quality production**: vanilla RAG + hybrid retrieval + reranking + careful chunking

### Concept 8: Production patterns and evaluation

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
- Common pattern: per-tenant index; per-tenant embedding cache
- Filter at retrieval time on tenant ID

**Security**:
- **Document ACLs**: who can see which docs?
- Filter retrieval results by permissions
- Audit trail for accessed documents

**Evaluation**:

| Metric | What it measures |
|---|---|
| **Recall@K** | Did we retrieve the relevant docs? |
| **MRR** (Mean Reciprocal Rank) | Where did the first relevant doc appear? |
| **NDCG@K** | Are the highly-relevant docs ranked higher? |
| **Faithfulness** (RAGAS) | Does the answer match retrieved content? |
| **Attribution** | Can each claim be traced to a doc? |
| **Context precision** | Are retrieved chunks relevant? |
| **Context recall** | Did we retrieve all the relevant chunks? |
| **End-to-end accuracy** | Does the final answer correct? |

**RAGAS** (Es 2023) — the standard RAG eval framework. Uses an LLM judge to score faithfulness and context precision.

**Common failures**:
- **Retrieval misses**: relevant doc not in top-K (fix: improve retrieval; rerank; expand K)
- **Faithfulness errors**: model hallucinates despite retrieved context (fix: prompt engineering; smaller models worse at this)
- **Attribution gaps**: model gives uncited claims (fix: structured output requiring citations)
- **Stale data**: retrieved doc is outdated (fix: freshness monitoring; recency filters)

---

## Glossary

- **Parametric knowledge**: facts encoded in model weights
- **Non-parametric knowledge**: facts retrieved from external stores
- **BM25**: sparse retrieval algorithm; TF-IDF with normalization
- **Dense retrieval**: retrieve via embedding similarity
- **Embedding**: text → fixed-dim vector
- **Vector store**: database of embeddings + ANN search
- **ANN**: Approximate Nearest Neighbor
- **HNSW / IVF / PQ**: vector index types
- **Hybrid retrieval**: combining sparse + dense
- **RRF**: Reciprocal Rank Fusion
- **Chunking**: splitting documents into smaller units for embedding
- **Reranking**: second-stage relevance scoring with a cross-encoder
- **Cross-encoder**: model that scores (query, doc) jointly
- **Dual-encoder**: model that embeds query and doc separately
- **RAG**: Retrieval-Augmented Generation
- **Self-RAG**: model decides when to retrieve and self-critiques
- **HyDE**: Hypothetical Document Embeddings
- **Graph RAG**: retrieval over knowledge graphs
- **Faithfulness**: does the answer match retrieved content?
- **Attribution**: can each claim be traced to a source?
- **RAGAS**: RAG evaluation framework

---

## Pedagogical analogies

### 1. RAG as open-book vs closed-book exams
A closed-book exam tests what you've memorized. An open-book exam tests what you can *find and apply*. **Parametric LLMs are closed-book**; RAG turns them into **open-book test takers**. Same intelligence; different access to information.

Best used for: section 1 motivation.

### 2. BM25 as Ctrl-F with statistics
Ctrl-F finds exact matches. **BM25 is Ctrl-F with statistics** — it ranks documents by how unusual the query words are (IDF) and how often they appear (TF). **Still the best technique when keywords matter.**

Best used for: section 2.

### 3. Dense retrieval as semantic GPS
GPS finds you the nearest point in physical space. **Dense retrieval finds you the nearest point in *meaning* space.** Documents about cars cluster near documents about automobiles, even with no shared words.

Best used for: section 3.

### 4. Hybrid retrieval as belt-and-suspenders
A belt holds your pants up. Suspenders hold your pants up. Together: redundant but reliable. **Hybrid retrieval is belt-and-suspenders** — BM25 catches exact matches; dense catches semantic ones; together they catch both.

Best used for: section 4.

### 5. Reranking as the second-pass interview
First-pass interviews filter many candidates fast. Second-pass interviews evaluate finalists deeply. **First-stage retrieval is the first pass; reranking is the second pass.** Different methods optimize for different stages.

Best used for: section 6.

---

## Common misconceptions

### MC1: "Dense retrieval always beats BM25."
**Reality:** false in many domains. **BM25 remains a strong baseline** — and often the *winning* technique on domains with technical vocabulary (legal, medical, code). Modern production systems use **hybrid** for safety.

### MC2: "Bigger embeddings are always better."
**Reality:** mostly false at production scale. Larger embeddings (3072-dim vs 384-dim) **increase storage 8x and search latency proportionally** for marginal quality gains. **Production sweet spot**: 768-1536 dim depending on domain.

### MC3: "Just use cosine similarity; don't worry about chunking."
**Reality:** chunking dominates retrieval quality. **Wrong chunk size can degrade recall by 30-50%.** Most "RAG isn't working" debugging traces back to chunking choices, not embedding model quality.

### MC4: "RAG eliminates hallucinations."
**Reality:** false. **RAG reduces hallucinations but doesn't eliminate them.** The model can still:
- Hallucinate facts not in the retrieved docs
- Mix retrieved facts incorrectly
- Reason poorly even with correct context
- **Faithfulness evaluation** (RAGAS) is essential to measure remaining hallucination rate.

### MC5: "More retrieval = better."
**Reality:** false. **Retrieving 50 docs hurts more than helps**:
- Context length cost grows linearly
- "Lost in the middle" effect — models attend less well to middle of long contexts
- More irrelevant content dilutes the signal
- **Production sweet spot**: K = 3-10 after reranking.

### MC6: "Production RAG is just embedding + cosine + LLM."
**Reality:** drastically underestimates production complexity. **Real production RAG** includes:
- Hybrid retrieval (sparse + dense + rerank)
- Multi-tenant isolation
- Permission/ACL filtering
- Caching at multiple layers
- Index freshness monitoring
- Faithfulness evaluation in CI
- Incident response for stale/wrong retrieval
- Cost monitoring (embedding API spend can dominate)

### MC7: "Reranking is always worth it."
**Reality:** depends on K and latency budget. **For top-3 with strict latency, reranking is essential.** For top-20 where the LLM filters in context, reranking may be skippable. **Profile before adopting.**

### MC8: "Graph RAG is the future."
**Reality:** unclear (as of 2025). **Graph RAG is interesting for multi-hop reasoning** but production deployments are rare; the construction cost is high; vanilla RAG + good reranking covers most use cases. **Don't reach for graph RAG by default.**

---

## Tricky implementation details

### TID1: Tokenization mismatch
The retriever's tokenizer may differ from the LLM's tokenizer. **A chunk of 512 retriever-tokens** may be 600 LLM-tokens. **Budget by LLM tokens** when concatenating into the prompt.

### TID2: Embedding model + corpus mismatch
**Embedding models trained on web text** may underperform on legal/medical/code corpora. **Domain fine-tuning** of the embedding model can dramatically improve retrieval — even more than choosing a "better" general-purpose model.

### TID3: Index updates and consistency
Updating a vector index is non-trivial. **HNSW indices** support incremental updates but rebalancing is expensive. **Production patterns**:
- Append-only with periodic rebuilds
- Two-index approach (one for queries; one for updates; swap atomically)
- Tombstoning for deletions

### TID4: Query encoding asymmetry
Some embedding models use *different* encodings for queries vs documents (e.g., E5 uses `query: ...` vs `passage: ...` prefixes). **Forgetting this drops retrieval quality silently.**

### TID5: Lost in the middle
Models attend less well to the **middle** of long contexts. **Place the most-relevant retrieved doc at the *start* or *end*** of the context window, not the middle. **Order retrieved docs by relevance**: most relevant first.

### TID6: Re-ranker latency
Cross-encoders score each (query, doc) pair sequentially. **For top-100 reranking, that's 100 inference calls.** Batch them; cap total candidates. **Production**: rerank only top-20 to top-50; not top-200.

### TID7: Stale embedding pre-computation
If you upgrade your embedding model, **all stored embeddings are now incompatible**. Re-embed the entire corpus — expensive for large corpora. **Plan for this**: track embedding model versions; budget for periodic reindexing.

### TID8: Chunk overlap matters
**Without overlap**, a sentence at a chunk boundary is split — losing context for retrieval. **Standard overlap**: 50-100 tokens per 500-token chunk. **Too much overlap**: duplicate content in different chunks → confused retrieval.

### TID9: Filtering vs reranking
Sometimes you want to **filter** results (only docs from this tenant; only recent docs); sometimes you want to **rerank** (best relevance first). **Apply filtering first** (it's cheap); then rerank only what's left.

### TID10: Multi-vector retrieval (ColBERT-style)
ColBERT stores one vector per token. **Storage is 10-50× larger** than single-vector dense retrieval. **Performance gains** are real but you need to budget for the storage hit. Production deployments of ColBERT are still rare.

---

## Reference implementations

### BM25 retrieval (using rank_bm25)

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

# Tokenize (simple whitespace split for demo)
tokenized = [doc.lower().split() for doc in docs]
bm25 = BM25Okapi(tokenized)

# Query
query = "machine learning"
tokenized_query = query.lower().split()
scores = bm25.get_scores(tokenized_query)

# Rank
ranking = sorted(zip(scores, docs), key=lambda x: -x[0])
print(f"Query: '{query}'")
print(f"{'Score':>7} | Doc")
print("-" * 70)
for score, doc in ranking:
    print(f"{score:>7.2f} | {doc}")

# Observations:
# - Doc 4 (Machine learning models...) scores highest — both query terms present
# - Doc 5 (Deep learning is a subset of machine learning) — both present, longer
# - Doc 1 / 2 (cats) — zero or near-zero
# - BM25 catches exact matches well
```

### Dense retrieval (using sentence-transformers)

```python
from sentence_transformers import SentenceTransformer
import numpy as np

# Load a small model
model = SentenceTransformer('all-MiniLM-L6-v2')   # 22M params, 384-dim

docs = [
    "The cat sat on the mat.",
    "Cats are great pets that love affection.",
    "Dogs are loyal companions and very playful.",
    "Machine learning models can be trained on data.",
    "Deep learning is a subset of machine learning.",
]

# Pre-compute embeddings
doc_embeddings = model.encode(docs)

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Query
query = "AI training"
query_embedding = model.encode([query])[0]

# Rank
similarities = [cosine_sim(query_embedding, e) for e in doc_embeddings]
ranking = sorted(zip(similarities, docs), key=lambda x: -x[0])

print(f"Query: '{query}'")
print(f"{'Sim':>6} | Doc")
print("-" * 70)
for sim, doc in ranking:
    print(f"{sim:>6.3f} | {doc}")

# Observations:
# - "AI training" → doc about ML models and doc about deep learning rank highest
# - "AI" and "training" don't appear literally in any doc — but dense retrieval finds them
# - BM25 would have scored these as 0 (no shared terms)
# - This is why dense retrieval helps for semantic queries.
```

### Hybrid retrieval with RRF

```python
def reciprocal_rank_fusion(rankings, k=60):
    """
    Combine multiple rankings via Reciprocal Rank Fusion.
    rankings: list of [(doc, rank), ...] from each retriever
    Returns combined ranking sorted by RRF score.
    """
    rrf_scores = {}
    for ranking in rankings:
        for doc, rank in ranking:
            rrf_scores[doc] = rrf_scores.get(doc, 0) + 1.0 / (k + rank)
    
    # Sort descending
    combined = sorted(rrf_scores.items(), key=lambda x: -x[1])
    return combined

# Example: combine BM25 + dense rankings
# (in practice, you'd get these from the previous two demos)
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
print("Hybrid (RRF) ranking:")
print(f"{'RRF':>6} | Doc")
print("-" * 70)
for doc, score in combined:
    print(f"{score:>6.4f} | {doc}")

# Observation:
# - Docs ranked highly by *both* retrievers score highest
# - Docs ranked highly by only one still appear but score lower
# - RRF doesn't need score normalization — uses ranks only
# - This is the production-default hybrid combination.
```

---

## Connections to other chapters

- **Ch 17 (Inference)**: RAG adds latency; KV cache + PagedAttention matter for long retrieved contexts
- **Ch 19 (Sampling)**: structured outputs (citations as JSON) often used in RAG
- **Ch 20 (Reasoning)**: agentic RAG = reasoning + retrieval as tools
- **Ch 21 (Tool use)**: retrieval is one of the most common tools; tool retrieval was Ex 3 of Ch 21
- **Ch 23 (Multimodal)**: multimodal RAG retrieves images + text
- **Ch 24-26 (Safety/Interp/Eval)**: RAG eval (RAGAS) is its own discipline; faithfulness and attribution matter for trust
- **Ch 27-30 (Agents)**: agents almost always use retrieval; production agent systems are RAG-heavy

---

## Open questions for the chapter author

### Q1: How much BM25 math?
**Recommendation:** moderate. Section 2 shows the formula and explains why it works. **Don't derive from probabilistic IR theory**; it's a tutorial chapter, not a textbook chapter.

### Q2: Embedding model depth?
**Recommendation:** brief. Section 3 mentions Sentence-BERT, OpenAI embeddings, E5-Mistral as exemplars. **Don't enumerate every model** — engineers will choose based on their constraints.

### Q3: Vector store depth?
**Recommendation:** brief. Section 3 names FAISS, Pinecone, Weaviate, Qdrant, pgvector. **Don't tutorial any specific one** — they're all variants of the same conceptual operation.

### Q4: Chunking depth?
**Recommendation:** medium. Section 5 enumerates strategies and discusses tradeoffs. **The chunking choice often matters more than the embedding model** — give it real airtime.

### Q5: Reranking depth?
**Recommendation:** brief but honest. Section 6 covers the concept and names a few rerankers (MS-MARCO, Cohere Rerank). **Reranking is increasingly important** in mature RAG systems.

### Q6: Widget candidates
1. **Retrieval Comparator (marquee):** interactive comparison of BM25, dense, and hybrid retrieval on the same small corpus. Reader picks a query type (keyword / semantic / paraphrased); sees which docs each method retrieves. **Recommended marquee.**
2. **Chunking Visualizer (secondary):** show how different chunking strategies (fixed-size, sentence, paragraph, parent-doc) split the same document. Reader toggles strategy; sees the resulting chunks. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 22 is a **single-topic chapter**. Uses the **4-file cadence**.

Planned file layout:
- File 124: research (this)
- File 125: page structure (~650 lines, 8 sections; runnables embedded)
- File 126: Retrieval Comparator marquee widget
- File 127: Chunking Visualizer secondary widget + exercises + closeout (slots 128-129 absorbed)

**Pedagogical outcomes for the reader.** After Ch 22, the reader should be able to:
1. Articulate the parametric vs non-parametric knowledge distinction and when each matters
2. Implement BM25 sparse retrieval and explain why it remains a strong baseline
3. Use dense retrieval with embedding models and vector stores
4. Combine sparse + dense via Reciprocal Rank Fusion
5. Choose chunking strategies appropriate to the corpus
6. Add reranking as a precision-improving stage
7. Compare RAG architectures (vanilla → agentic → graph-based)
8. Evaluate RAG systems using recall@K, faithfulness, and attribution

Eight outcomes. Exercises hit outcomes 2, 3, 4, 6.

**Tonal framing**: practical and infrastructure-focused. RAG is **the most-deployed LLM application pattern** of 2024-2025; engineers reading this are likely working on a RAG system already. **Concrete numbers**: typical corpus sizes (100K-10M docs), chunk sizes (500-1000 tokens), top-K values (3-10 after reranking), latency targets (<2s). **Honest tradeoffs**: BM25 vs dense (still both useful), embedding dimension vs storage, chunking granularity, when reranking matters.

**Part VII progression**: Ch 22 is the third of four Part VII chapters. **Reasoning (Ch 20) gave the model time to think; tool use (Ch 21) gave it the ability to act; retrieval (this chapter) gives it the ability to know what it wasn't trained on.** After this: Ch 23 (Multimodal) extends to non-text modalities; then Part VIII (Safety/Interp/Eval); then Part IX (Agents).

**Importance**: RAG is the single most-deployed LLM pattern. Production AI systems at virtually every company use RAG for one or more use cases. **Engineers need both the conceptual model (parametric + retrieved) and the production discipline (hybrid retrieval, chunking strategy, reranking, evaluation). This chapter is their roadmap.**
