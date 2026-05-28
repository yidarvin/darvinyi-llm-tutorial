# CURRICULUM

> Every Claude Code chapter session reads its assigned chapter's entry here as the source of truth for what to build.
> Pre-research, prompts, and chapter content all derive from these specs. If a spec needs to change, change it here first, then update downstream artifacts.

## How to read this file

Each chapter has the same structure:

- **Position** — Part, math depth, session count (and globally-numbered session range)
- **Reader will be able to** — concrete capabilities, not vague understanding
- **Key concepts** — terms and ideas the chapter covers
- **Widgets** — interactive components (full per-widget specs live in session prompts)
- **Runnable code** — Pyodide-executable Python modules (full specs in session prompts)
- **Pre-research file scope** — what to put in `research/chXX-slug/research.md`
- **Tricky spots** — where the chapter typically goes wrong; what to get right
- **Connections** — what this chapter builds on; what later chapters depend on it

Per-chapter widget and runnable specs are intentionally one-line summaries here — the full per-file specifications live in their corresponding session prompts in `prompts/chapters/`. The job of this file is to lock chapter-level scope and ensure pre-research is comprehensive.

---

## Index

| Part | Chapters | Theme |
|---|---|---|
| **I — Foundations** | 1–3 | What an LLM is made of: neurons, embeddings, tokens |
| **II — The Transformer** | 4–6 | Attention, multi-head, the block, position |
| **III — Pre-training** | 7–10 | Data, training a small LLM, scaling, infrastructure |
| **IV — Alternative Architectures** | 11–12 | MoE, state-space models, Mamba |
| **V — Post-training** | 13–16 | SFT, alignment (RLHF/DPO/GRPO/RLVR), PEFT, distillation |
| **VI — Inference** | 17–19 | KV cache, FlashAttention, quantization, sampling |
| **VII — Modern Capabilities** | 20–23 | Reasoning, tool use, RAG, multimodal |
| **VIII — Safety, Interpretability & Eval** | 24–26 | Guardrails, mechanistic interp, evaluation |
| **IX — Agents** | 27–30 | Loops, harnesses, multi-agent, eval & frameworks |

### Capability lookup

- Backprop, autograd, AdamW → Ch 1
- Tokenization, BPE → Ch 3
- Attention, multi-head, transformer block → Ch 4–5
- RoPE, ALiBi → Ch 6
- nanoGPT-style training from scratch → Ch 8
- FSDP, ZeRO, tensor parallelism → Ch 9
- Megatron, DeepSpeed, Triton → Ch 10
- Mixture of Experts → Ch 11
- Mamba, state-space models → Ch 12
- RLHF, DPO, RLVR, GRPO, Constitutional AI → Ch 14
- LoRA, QLoRA → Ch 15
- KV cache, FlashAttention, speculative decoding → Ch 17
- GPTQ, AWQ, INT4 quantization → Ch 18
- Top-p, top-k, min-p, constrained decoding → Ch 19
- Chain-of-thought, self-consistency, o1/R1-style reasoning → Ch 20
- Tool use (function calling) → Ch 21
- Dense retrieval, BM25, RAG → Ch 22
- ViT, CLIP, vision-language models → Ch 23
- Jailbreaks, prompt injection, red-teaming → Ch 24
- Sparse autoencoders (SAEs), mechanistic interpretability → Ch 25
- MMLU, SWE-bench, τ-bench, agent eval → Ch 26, 30
- ReAct, agent loop → Ch 27
- Building an agent harness from scratch → Ch 28
- Multi-agent, MCP, A2A → Ch 29
- LangGraph, smolagents, OpenAI Agents SDK comparison → Ch 30

---

# Part I — Foundations

The reader arrives knowing what a neural network roughly is. They leave Part I able to implement the building blocks — neurons, embeddings, tokens — in numpy. Three chapters.

Part I's chapters are the most math-heavy in the tutorial. Chapter 1 in particular is the only chapter where we derive backprop in full. We pay this cost up front so later chapters can assume gradient flow without re-explaining it.

---

## Chapter 1 — Neural network primitives

**Part:** I — Foundations
**Math depth:** High
**Sessions:** 4 (07–10)

### Reader will be able to

- Implement forward and backward passes for a 2-layer MLP in numpy from scratch, with no autograd
- Derive the gradient of cross-entropy loss with respect to softmax-pre-activation logits and explain why the result $\partial L / \partial z = \softmax(z) - y$ is so clean
- Articulate what autograd computes mechanically (numerical chain rule via a recorded computational graph), as opposed to symbolic differentiation
- Read SGD, Adam, and AdamW update rules and explain when each is preferred

### Key concepts

Linear layer, activation functions (ReLU, GELU, SiLU), softmax with numerical stability, cross-entropy loss, the chain rule applied to compositions of layers, computational graphs, autograd via topological sort, parameter initialization (Glorot/Xavier, He/Kaiming), SGD, Adam, AdamW, weight decay vs L2 regularization, the "death of ReLU" phenomenon.

### Widgets

- **BackpropVisualizer** — interactive computational graph for a 2-layer MLP. User clicks a node to see its forward value, gradient, and the upstream gradient-flow path lighting up.

### Runnable code

- `mlp_numpy.py` — full forward + backward MLP, trained 30 steps on a 2D toy dataset (two Gaussians), with intermediate gradients printed
- `autograd_from_scratch.py` — minimal autograd engine (micrograd-style) with comments tying back to the chain-rule derivations from the chapter prose

### Pre-research file `research/ch01-neural-net-primitives/research.md` scope

- **Papers:** Kingma & Ba 2014 ("Adam", arxiv.org/abs/1412.6980) with the full update equations; Glorot & Bengio 2010 (Xavier init); He 2015 (Kaiming init, arxiv.org/abs/1502.01852); Loshchilov & Hutter 2017 ("Decoupled Weight Decay Regularization" = AdamW, arxiv.org/abs/1711.05101)
- **References:** Karpathy's micrograd repo (github.com/karpathy/micrograd) for the autograd implementation pattern; Goodfellow Ch 6 for the formal MLP treatment
- **Full derivations:** cross-entropy gradient w.r.t. logits; ReLU subgradient handling at zero; chain rule applied to a 2-layer MLP in matrix form
- **Glossary:** affine transformation, activation, loss, gradient, optimizer state, learning rate schedule
- **Analogies:** backprop as "credit assignment"; the computational graph as "a recipe you can execute forward and replay backward"
- **Common misconceptions:** confusing gradient flow with information flow; thinking autograd does symbolic differentiation (it doesn't — it's numerical, via the chain rule applied to recorded operations); confusing weight decay with L2 regularization in the AdamW context (they differ when adaptive learning rates are involved)

### Tricky spots

- Numerical stability of softmax (max-subtraction trick) — must be in the chapter or the toy MLP produces nans on adversarial inputs
- Distinguishing vanilla SGD from Adam — readers blur them together; show equations side by side
- The "gradient through a parameter" vs "gradient with respect to a parameter" distinction — autograd computes the latter
- AdamW's weight decay is NOT the same as adding $\lambda \|w\|^2$ to the loss in the presence of adaptive learning rates — this surprises people

### Connections

- **Builds on:** the reader's prior exposure to neural networks (we assume they've seen training, may not have implemented backprop themselves)
- **Sets up:** Chapter 4 (attention) reuses the gradient-flow intuition; Chapter 14 (alignment) revisits parameter updates in policy-gradient contexts; Chapter 25 (interpretability) revisits the computational graph from a different angle

---

## Chapter 2 — Embeddings & representation

**Part:** I — Foundations
**Math depth:** Medium
**Sessions:** 3 (11–13)

### Reader will be able to

- Explain why dense embeddings replaced one-hot representations
- Implement word2vec skip-gram with negative sampling in numpy
- Distinguish static word embeddings (word2vec, GloVe) from contextualized embeddings (the embedding table in a transformer that learns jointly with the rest of the model)
- Demonstrate the famous "king - man + woman ≈ queen" via vector arithmetic on pretrained vectors

### Key concepts

One-hot vs dense embedding, the distributional hypothesis, word2vec (CBOW and skip-gram), negative sampling, GloVe, contextualized vs static embeddings, the embedding table in modern transformers, tied input/output weights (Press & Wolf 2017), modern embedding dimensions (4096 → 12288).

### Widgets

- **EmbeddingSpaceExplorer** — 2D PCA projection of pretrained GloVe vectors with interactive nearest-neighbor lookup. Type a word, see its 10 nearest neighbors highlighted in the projection.

### Runnable code

Combined session 13: both runnables share one runnable code module per the 3-session budget.

- `word2vec_skipgram.py` — skip-gram with negative sampling trained on text8-mini (small enough for Pyodide), enough steps to demo basic word arithmetic
- `embedding_arithmetic.py` — load pretrained GloVe vectors (or a small subset bundled with the tutorial), compute and verify analogies

### Pre-research file `research/ch02-embeddings/research.md` scope

- **Papers:** Mikolov 2013a (word2vec, arxiv.org/abs/1301.3781); Mikolov 2013b (negative sampling, arxiv.org/abs/1310.4546); Pennington 2014 (GloVe); Press & Wolf 2017 (weight tying, arxiv.org/abs/1608.05859)
- **References:** McCormick's "Word2Vec Tutorial - The Skip-Gram Model" blog post for the cleanest treatment of negative sampling intuition
- **Equations:** the skip-gram softmax objective; the negative sampling approximation; the GloVe weighted least-squares objective
- **Glossary:** context window, negative sample, subsampling of frequent words, vocabulary truncation, embedding dimension
- **Analogies:** embeddings as a "compressed dictionary of meaning"; the distributional hypothesis as "you shall know a word by the company it keeps" (Firth 1957)
- **Common misconceptions:** thinking word2vec embeddings are universal — they're trained on specific corpora and inherit biases; conflating GloVe and word2vec (they use different objectives but produce similar geometries)

### Tricky spots

- The negative sampling derivation — readers struggle with where the sigmoid comes from. Walk through how the multi-class softmax is approximated by a sequence of binary classifications
- Why "king - man + woman = queen" works at all — give a brief geometric intuition (translation in a learned subspace) rather than overselling it
- Modern LLMs do NOT use word2vec/GloVe; the embedding table is learned jointly with the rest of the model. Make this transition explicit before Chapter 4.

### Connections

- **Builds on:** Ch 1 (the embedding table is a linear layer)
- **Sets up:** Ch 3 (tokenization changes what gets embedded); Ch 4 (the transformer's first operation is embedding lookup); Ch 25 (interpretability often probes embedding subspaces)

---

## Chapter 3 — Tokenization

**Part:** I — Foundations
**Math depth:** Low
**Sessions:** 4 (14–17)

### Reader will be able to

- Implement BPE (Byte Pair Encoding) from scratch — training, encoding, and decoding
- Compare BPE, WordPiece, and SentencePiece on the same input and explain the differences
- Articulate tokenization's impact on multilingual performance, numbers, and code
- Recognize what tiktoken (GPT-4's tokenizer) actually does and why it differs from earlier tokenizers

### Key concepts

Character-level vs word-level vs subword tokenization, BPE merges, vocabulary size tradeoffs, UNK tokens, whitespace handling, byte-level BPE (GPT-2 style), special tokens, chat template tokens (`<|im_start|>`, etc.), tokenizer training, multilingual tokenization challenges, the "Solidgoldmagikarp" glitch-token phenomenon.

### Widgets

- **TokenizerPlayground** — paste text, see how it tokenizes under BPE, WordPiece, and tiktoken (cl100k_base). Shows token IDs, token boundaries colored, and the merge history for BPE.

### Runnable code

- `bpe_from_scratch.py` — full BPE training loop on a small corpus, then encoding and decoding round-trip verification
- `tokenizer_comparison.py` — tokenize the same input under 4–5 real tokenizers (tiktoken, GPT-2, BERT, Llama 3, Gemma) and compare token counts and boundaries

### Pre-research file `research/ch03-tokenization/research.md` scope

- **Papers:** Sennrich 2016 (BPE for NMT, arxiv.org/abs/1508.07909); Schuster & Nakajima 2012 (WordPiece); Kudo 2018 (SentencePiece, arxiv.org/abs/1808.06226); Radford 2019 (GPT-2 byte-level BPE)
- **References:** Karpathy's "Let's build the GPT Tokenizer" video and accompanying minbpe repo; OpenAI's tiktoken repo; the Solidgoldmagikarp / glitch-tokens LessWrong post by Rumbelow & Watkins 2023
- **Algorithm pseudocode:** BPE training loop (count pairs, merge the most frequent, repeat); BPE encoding (greedy left-to-right matching against learned merges)
- **Glossary:** vocabulary, merge, token, subword, byte-level, prefix space, special token, chat template
- **Analogies:** BPE as "learning the most efficient compression of your text under a fixed-size codebook"
- **Common misconceptions:** that "tokens" are linguistic units (they're not — they're statistical units); that tokenization is solved (it isn't — multilingual, code, and number tokenization all have known issues)
- **Tokenizer-specific notes:** tiktoken's cl100k_base vocab size (~100K), its handling of numbers (digit-by-digit since GPT-4), its special-token reservations

### Tricky spots

- Byte-level vs character-level — readers conflate these. Byte-level operates on UTF-8 bytes, which means any sequence is representable without UNK; character-level operates on Unicode code points.
- The chat template tokens — these are NOT just text wrappers; they're specific token IDs the model was trained to recognize. The reader will need this for SFT in Ch 13.
- Number tokenization differences — GPT-2 tokenizes "123" as one token; GPT-4 tokenizes it as three. This has implications for arithmetic capability.
- Encoding "leading-space" tokens — most modern BPE tokenizers include the leading space as part of the token. "hello" and " hello" are different tokens.

### Connections

- **Builds on:** Ch 2 (tokens are what gets embedded)
- **Sets up:** Ch 4 (sequences of tokens are what attention operates over); Ch 13 (SFT requires chat-template tokens); Ch 21 (tool use produces structured tokens)

---

# Part II — The Transformer

The reader leaves Part II able to implement a complete transformer block from scratch and reason about why it has the structure it does. Three chapters: attention as a first-principles operation; multi-head and the block; positional encoding.

This is where the reader's investment in Part I pays off. Backprop and embeddings are presupposed; we focus on the operation that defines the architecture.

---

## Chapter 4 — Attention mechanism

**Part:** II — The Transformer
**Math depth:** High
**Sessions:** 5 (18–22)

### Reader will be able to

- Derive scaled dot-product attention from first principles, including why softmax and √d scaling are there
- Implement single-head attention in numpy with proper shape handling for batched inputs
- Implement causal masking and explain why decoders need it
- Connect attention to soft retrieval and (in an aside) to kernel methods

### Key concepts

Query/key/value abstraction, dot-product as similarity measure, scaling factor √d and why, softmax over keys (not queries), attention as soft retrieval, causal mask, padding mask, the variance argument for √d scaling, attention as a kernel method (advanced aside).

### Widgets

- **AttentionHeatmap** — 12-token sequence with adjustable Q, K, V projections (or selectable presets). Heatmap updates to show attention weights. Click a query token to highlight what it attends to.
- **CausalMaskExplainer** — toggle between bidirectional and causal attention; show how the mask zeros out the upper triangle and what this means for next-token prediction.

### Runnable code

- `scaled_dot_product_attention.py` — single-head attention forward pass in numpy with detailed shape comments at every step
- `causal_mask.py` — implement and apply the lower-triangular mask, demonstrate that a causal model can't peek

### Pre-research file `research/ch04-attention/research.md` scope

- **Papers:** Vaswani 2017 ("Attention is All You Need", arxiv.org/abs/1706.03762), §3.2 in particular; Bahdanau 2015 (the original additive attention for NMT, arxiv.org/abs/1409.0473) for historical context; Tsai 2019 ("Transformer Dissection: An Unified Understanding for Transformer's Attention via the Lens of Kernel", arxiv.org/abs/1908.11775) for the kernel-method connection
- **Full derivation:** why √d scaling — start from the assumption that Q and K entries are i.i.d. with mean 0 and variance 1; show that the dot product $q \cdot k$ then has variance $d$; without scaling, the variance grows with $d$ and softmax saturates; dividing by √d brings variance back to 1
- **Equations:** the scaled dot-product attention formula; the masking equation $\text{scores} = \text{scores} + (1 - \text{mask}) \cdot -\infty$
- **Glossary:** query, key, value, attention weights, attention scores (pre-softmax), masked attention, padding mask vs causal mask
- **Analogies:** attention as "differentiable dictionary lookup"; queries as "what am I looking for"; keys as "what do I have on offer"; values as "what to actually deliver"
- **Common misconceptions:** thinking Q, K, V come from somewhere magical (they're just three linear projections of the same input in self-attention); thinking the softmax is over Q (it's over K — for each query, we normalize across all keys); thinking attention is "looking at" tokens (it's mixing them; nothing is being "selected")

### Tricky spots

- Why softmax over keys, not queries — this trips up readers who think attention "picks" keys. It doesn't; it produces a weighted sum.
- The masking implementation detail — adding $-\infty$ to masked positions BEFORE softmax (so they become 0 after softmax). Adding $-\infty$ after softmax is wrong.
- Self-attention vs cross-attention — Q, K, V from the same source (self) vs different sources (cross, as in encoder-decoder). The Vaswani paper has both; modern decoder-only LLMs are pure self-attention.

### Connections

- **Builds on:** Ch 2 (embeddings provide the input vectors), Ch 1 (we'll need gradient flow through this)
- **Sets up:** Ch 5 (multi-head attention is just this, parallelized); Ch 6 (positional encoding adds the "where" to the "what"); Ch 17 (KV caches optimize inference of this exact operation)

---

## Chapter 5 — Multi-head attention & the transformer block

**Part:** II — The Transformer
**Math depth:** High
**Sessions:** 5 (23–27)

### Reader will be able to

- Implement multi-head attention in numpy AND PyTorch with proper head splitting and concatenation
- Build a complete transformer decoder block: attention → residual → norm → MLP → residual → norm
- Explain why pre-norm beat post-norm (training stability at scale)
- Articulate the role of each component in the block — residuals, normalization, feed-forward

### Key concepts

Multi-head attention as multiple parallel attention subspaces, head dimension ($d_k = d / H$), head concatenation and output projection, LayerNorm vs RMSNorm, pre-norm vs post-norm, residual connections, feed-forward networks (FFN), SwiGLU and GeGLU activation variants, MLP expansion ratio (typically 4× or 8/3× for SwiGLU variants), the Llama architecture as a modern reference point.

### Widgets

- **TransformerBlockDissection** — animated diagram of data flowing through one block. User clicks a layer (attn, norm, MLP, residual) to see the shape transformation and a one-sentence "what this does" explanation. Highlights the residual paths.

### Runnable code

- `multihead_attention.py` — numpy implementation with 8 heads on a short sequence, showing the head-splitting and -concatenation logic explicitly
- `transformer_block.py` — full block in PyTorch matching Llama's choices (RMSNorm, SwiGLU FFN, no biases on linear layers). Not runnable in Pyodide (PyTorch is too heavy in WASM); shown as static reference.

### Pre-research file `research/ch05-multihead-and-block/research.md` scope

- **Papers:** Vaswani 2017 (multi-head attention); Voita 2019 ("Analyzing Multi-Head Self-Attention", arxiv.org/abs/1905.09418) for "each head as a different attention pattern" intuition; Xiong 2020 ("On Layer Normalization in the Transformer Architecture", arxiv.org/abs/2002.04745) for the pre-norm vs post-norm analysis; Zhang & Sennrich 2019 (RMSNorm, arxiv.org/abs/1910.07467); Shazeer 2020 ("GLU Variants Improve Transformer", arxiv.org/abs/2002.05202) for SwiGLU; Touvron 2023 (Llama, arxiv.org/abs/2302.13971 and arxiv.org/abs/2307.09288) for the modern architecture choices
- **Equations:** multi-head attention with explicit head reshaping; LayerNorm formula; RMSNorm formula (and why it's cheaper); the SwiGLU FFN as $\text{FFN}_{\text{SwiGLU}}(x) = (\text{Swish}(xW_1) \odot xW_2) W_3$
- **Glossary:** head, head dimension, attention output projection, residual stream, normalization, feed-forward dimension, biases vs no-biases
- **Analogies:** multi-head as "ensembling different views of relevance"; the residual stream as a "communication highway" that every block reads from and writes to
- **Common misconceptions:** thinking each head is doing something semantically distinct (they're learned, not assigned; interpretability work shows some specialization but it's not as clean as the original paper hinted); confusing the LayerNorm placement (pre- inside the residual block, before each sublayer; post- after each sublayer); thinking the MLP is just for "depth" (it's where most of the parameter count lives and seems to do most of the "thinking")

### Tricky spots

- Head splitting vs head concatenation shape gymnastics — `[batch, seq, d_model] → [batch, heads, seq, d_k] → [batch, seq, d_model]`. Walk through this carefully.
- Why no biases in modern transformers — small computational saving, marginal effect on quality, mostly an aesthetic + memory simplification choice in Llama-era architectures.
- RMSNorm's elision of mean-centering — it works empirically despite the theoretical motivation for centering. The "why" is not well understood; be honest about that.

### Connections

- **Builds on:** Ch 4 (attention) directly; Ch 1 (gradient flow through residuals and normalization)
- **Sets up:** Ch 6 (position is the last missing piece); Ch 8 (training one of these from scratch); Ch 11 (MoE replaces the FFN with experts); Ch 17 (inference optimization targets this block)

---

## Chapter 6 — Positional encoding

**Part:** II — The Transformer
**Math depth:** High
**Sessions:** 4 (28–31)

### Reader will be able to

- Derive sinusoidal positional encoding from first principles
- Implement RoPE (Rotary Position Embedding) in numpy and verify the rotation property
- Compare ALiBi, learned positional embeddings, sinusoidal, and RoPE on the dimensions that matter: KV-cache compatibility, length extrapolation, training stability
- Explain why RoPE won

### Key concepts

Why position matters (attention is permutation-equivariant without it), absolute vs relative position, sinusoidal encoding, learned positional embeddings, RoPE as a rotation of Q and K, ALiBi as a linear bias on attention scores, YaRN and NTK-aware scaling for RoPE extension, position interpolation, length extrapolation.

### Widgets

- **PositionEncodingVisualizer** — plot the encoding values for each position. Toggle between sinusoidal, RoPE (visualized as rotation angle), and ALiBi (as bias matrix). User changes sequence length to see how each handles extrapolation beyond the training length.

### Runnable code

- `sinusoidal_pe.py` — generate the sinusoidal encoding matrix and plot a heatmap of it
- `rope.py` — RoPE in numpy: apply rotation to Q and K, verify the rotation property that $\text{RoPE}(q, m) \cdot \text{RoPE}(k, n) = f(q, k, m-n)$ (i.e., the dot product depends only on the relative position)

### Pre-research file `research/ch06-positional-encoding/research.md` scope

- **Papers:** Vaswani 2017 §3.5 (sinusoidal); Su 2021 ("RoFormer: Enhanced Transformer with Rotary Position Embedding", arxiv.org/abs/2104.09864); Press 2022 (ALiBi, arxiv.org/abs/2108.12409); Peng 2023 (YaRN, arxiv.org/abs/2309.00071); kaiokendev's NTK-aware scaling notes (gist.github.com/kaiokendev/...)
- **Derivation:** the rotation-matrix form of RoPE and why it gives relative position naturally; the math behind why ALiBi extrapolates (linearly decaying attention as a function of distance)
- **Glossary:** absolute position, relative position, length extrapolation, position interpolation, NTK scaling, base frequency
- **Analogies:** sinusoidal as "Fourier basis on position"; RoPE as "rotating Q and K in a 2D plane indexed by position so their dot product encodes relative offset"
- **Common misconceptions:** thinking learned positional embeddings are competitive with RoPE for long context (they're not — they don't extrapolate); thinking RoPE is "added" to embeddings like sinusoidal (it's not — it's applied multiplicatively to Q and K just before the dot product); thinking ALiBi is dead (it's not — Mistral and a few others still use it; the case is narrower than RoPE's but real)

### Tricky spots

- Why RoPE composes cleanly with KV caches — because rotation is applied at query/key projection time, the cached K is already RoPE'd; the cache stays valid. Learned positional embeddings break this if you ever want to extend context.
- The "base frequency" parameter in RoPE (`θ_i = 10000^(-2i/d)`) — explain why this geometric series of frequencies works (covering many spatial scales at once)
- NTK-aware scaling vs position interpolation — both are tricks to extend RoPE beyond training length; they're not the same thing. NTK adjusts the base frequency; PI rescales positions.

### Connections

- **Builds on:** Ch 4 (we modify Q and K before they dot-product), Ch 5 (positional encoding lives inside the transformer block)
- **Sets up:** every later chapter that involves long context (Ch 12 SSMs, Ch 17 KV caches, Ch 22 long-context RAG)

---

# Part III — Pre-training

The reader leaves Part III able to train a small LLM end to end and reason about what it takes to scale that to a frontier model. Four chapters: data, the training loop, scaling laws + distributed training, and the modern training infrastructure stack.

This is the longest part of the tutorial because the engineering surface here is enormous. We balance hands-on (Ch 7–8 are highly runnable) with conceptual (Ch 9–10 are about systems too large to run in browser).

---

## Chapter 7 — Pre-training data

**Part:** III — Pre-training
**Math depth:** Low
**Sessions:** 4 (32–35)

### Reader will be able to

- Name and characterize the major pre-training corpora (Common Crawl, RefinedWeb, FineWeb, The Pile, RedPajama)
- Implement deduplication with MinHash and explain why exact dedup isn't sufficient
- Apply quality filters (heuristic, classifier-based, perplexity-based) and articulate the tradeoffs
- Reason about data mixture choices and contamination detection

### Key concepts

Common Crawl, RefinedWeb, FineWeb, The Pile, RedPajama, deduplication (exact, MinHash, semantic), quality filtering (Gopher rules, classifier filtering, perplexity-based filtering), data mixture design, contamination detection, synthetic data (Phi-style training on textbook-quality generated content), the "more data vs better data" debate.

### Widgets

- **DedupInteractive** — paste two documents, see exact match, fuzzy match (MinHash similarity), and semantic match (cosine similarity of embeddings) scores update live as the documents are edited.

### Runnable code

- `minhash_dedup.py` — MinHash implementation from scratch in numpy with example documents
- `quality_filter.py` — perplexity-based filtering using a tiny pretrained language model (loaded via Pyodide-compatible means; if too heavy, use a precomputed table of perplexities)

### Pre-research file `research/ch07-pretraining-data/research.md` scope

- **Papers:** Penedo 2023 (RefinedWeb, arxiv.org/abs/2306.01116); Penedo 2024 (FineWeb, huggingface.co/blog/fineweb); Gao 2020 (The Pile, arxiv.org/abs/2101.00027); Lee 2022 ("Deduplicating Training Data Makes Language Models Better", arxiv.org/abs/2107.06499); Rae 2021 (Gopher, especially the quality-filter section); Xie 2023 (DoReMi for data mixture optimization, arxiv.org/abs/2305.10429); Gunasekar 2023 ("Textbooks Are All You Need", arxiv.org/abs/2306.11644)
- **Algorithms:** MinHash with $k$ hash functions and the Jaccard estimator; the Gopher rule list (mean line length, stopword fraction, etc.); a sketch of the LongFormer or similar perplexity filter
- **Glossary:** corpus, deduplication, near-duplicate, quality filter, contamination, data mixture
- **Reference numbers:** approximate sizes of major corpora (Common Crawl raw ~250TB, FineWeb ~15T tokens, The Pile ~825GB)
- **Common misconceptions:** thinking that "more tokens always helps" (Chinchilla showed this isn't true at fixed compute); thinking deduplication is straightforward (semantic near-duplicates from translation, paraphrase, and rewrite are hard); thinking contamination is rare (it's pervasive, especially for benchmarks)

### Tricky spots

- MinHash's relationship to Jaccard similarity — the elegant probabilistic argument that two MinHash signatures match with probability equal to Jaccard. Walk through this.
- The "synthetic data" debate — Phi-1.5 / Phi-3 showed synthetic data works; the open question is whether this scales or hits a ceiling. Be honest about this.
- Contamination detection is unsolved at scale — there are heuristics but no canonical method.

### Connections

- **Builds on:** Ch 3 (tokenization happens after dedup and filtering)
- **Sets up:** Ch 8 (we need data to train on); Ch 26 (contamination is an eval problem too)

---

## Chapter 8 — Building a small LLM

**Part:** III — Pre-training
**Math depth:** Medium
**Sessions:** 5 (36–40)

### Reader will be able to

- Train a working GPT-style model from scratch on TinyStories
- Read and interpret training-loss curves, including warmup, plateau, and divergence patterns
- Implement gradient accumulation, mixed precision (bf16), and gradient clipping
- Sample text from a trained model and explain why it sounds reasonable (or doesn't)

### Key concepts

The training loop, batch construction (packed vs padded sequences), learning-rate schedules (warmup + cosine decay), weight decay (AdamW), gradient clipping (norm-based), mixed precision (fp16 vs bf16), gradient accumulation, checkpointing, dataloader patterns, the TinyStories dataset (Eldan & Li 2023) as a feasibility-demonstrator.

### Widgets

- **LossCurveInteractive** — pre-recorded training-run data; user scrubs through training steps, sees the loss curve, the attention pattern at that step (cached snapshots), and a generated sample at that step. Demonstrates how generation quality improves with training.

### Runnable code

- `nano_gpt.py` — Karpathy-style nanoGPT trained on a small TinyStories subset; truncated to ~50 steps for browser feasibility. Loss should visibly decrease.
- `full_training_run.py` — non-runnable reference script with all production tricks (LR schedule, gradient accumulation, mixed precision, checkpointing, distributed setup hooks). Shown as static code for readers to study.

### Pre-research file `research/ch08-building-small-llm/research.md` scope

- **References:** Karpathy's nanoGPT (github.com/karpathy/nanoGPT) — the canonical readable training script; Eldan & Li 2023 (TinyStories, arxiv.org/abs/2305.07759); EleutherAI's GPT-NeoX-20B paper for recipe details (arxiv.org/abs/2204.06745)
- **Papers:** Loshchilov & Hutter 2017 (cosine LR schedule with restarts, arxiv.org/abs/1608.03983); Micikevicius 2018 (mixed precision training, arxiv.org/abs/1710.03740); Smith 2018 (cyclical learning rates, less relevant but useful for context)
- **Algorithms:** the standard transformer training loop; the gradient accumulation pattern (`loss.backward()` every step, `optimizer.step()` every $K$ steps); gradient clipping pseudocode
- **Glossary:** epoch, step, batch, micro-batch, gradient accumulation, mixed precision, loss scaling, checkpoint, warmup, cosine decay
- **Numbers to know:** Llama 7B trained on ~1T tokens with batch size ~4M tokens; warmup typically 0.5–2% of total steps; cosine decay to 10% of peak LR
- **Common misconceptions:** confusing batch size with micro-batch size (gradient accumulation makes effective batch size larger than per-GPU batch); thinking fp16 and bf16 are interchangeable (bf16 has same exponent range as fp32, fp16 doesn't — bf16 is preferred for training); thinking "loss going down means it's working" (it's necessary but not sufficient; you also need the model to be learning the right thing)

### Tricky spots

- The interaction between AdamW's weight decay and the LR schedule — weight decay coefficient is multiplied by current LR in most implementations, which is often a surprise
- Why bf16 specifically — fp16's narrow dynamic range causes overflow in attention scores; bf16's wider range avoids this; the cost (less mantissa precision) is acceptable
- Training instability at scale — small models train smoothly; large models exhibit loss spikes that require attention. We can't reproduce this in nanoGPT but should mention it.

### Connections

- **Builds on:** all of Part I and II; Ch 7 (the data we're training on)
- **Sets up:** Ch 9 (when this gets too big for one GPU); Ch 13 (post-training builds on this base)

---

## Chapter 9 — Scaling laws & distributed training

**Part:** III — Pre-training
**Math depth:** Medium
**Sessions:** 5 (41–45)

### Reader will be able to

- Read and interpret the Kaplan and Chinchilla scaling laws
- Compute compute-optimal model size given a token budget (and vice versa)
- Articulate when to use DDP vs FSDP vs ZeRO-stage-N vs tensor parallelism vs pipeline parallelism
- Estimate the memory footprint of training a model of a given size

### Key concepts

Scaling laws (Kaplan 2020 → Chinchilla 2022), compute-optimal training, Data Distributed Parallel (DDP), Fully Sharded Data Parallel (FSDP), ZeRO stages 1/2/3, tensor parallelism (Megatron), pipeline parallelism (GPipe, 1F1B), 3D parallelism, communication patterns (allreduce, allgather, reducescatter), the FLOPS/parameter/token equation $C \approx 6 N D$.

### Widgets

- **ScalingLawCalculator** — sliders for parameters, dataset size, compute budget. Plots the Chinchilla curve and highlights compute-optimal allocation. Updates predicted loss in real time.
- **ParallelismDiagram** — animated visualization of weights, activations, and gradients flowing across N GPUs under DDP, FSDP, TP, PP. User picks the scheme; sees which tensors live where.

### Runnable code

- `scaling_law_fit.py` — fit a Chinchilla-style scaling law to mock data using least squares, then predict loss at unseen scale. Distributed training itself isn't runnable in browser; reference snippets shown statically.

### Pre-research file `research/ch09-scaling-and-distributed/research.md` scope

- **Papers:** Kaplan 2020 ("Scaling Laws for Neural Language Models", arxiv.org/abs/2001.08361); Hoffmann 2022 ("Training Compute-Optimal Large Language Models" = Chinchilla, arxiv.org/abs/2203.15556); Rajbhandari 2020 (ZeRO, arxiv.org/abs/1910.02054); Shoeybi 2019 (Megatron-LM tensor parallelism, arxiv.org/abs/1909.08053); Huang 2018 (GPipe, arxiv.org/abs/1811.06965); Korthikanti 2022 (sequence parallelism, arxiv.org/abs/2205.05198)
- **Equations:** the Chinchilla loss equation $L(N, D) = A/N^\alpha + B/D^\beta + L_\infty$; compute scaling $C = 6 N D$; the compute-optimal $N^* / D^*$ ratio
- **Glossary:** all-reduce, all-gather, reduce-scatter, gradient sharding, parameter sharding, optimizer-state sharding, activation checkpointing, micro-batch, pipeline bubble, DP/TP/PP degrees
- **Numbers to know:** rough memory cost of training a model (parameters + gradients + optimizer state + activations ≈ ~16–20 bytes per parameter for AdamW fp16/bf16 training with checkpointing); H100 has ~3 TB/s HBM bandwidth; InfiniBand HDR provides ~200 Gbps
- **Common misconceptions:** thinking Kaplan and Chinchilla agree (they don't — Chinchilla showed Kaplan undertrained models); thinking FSDP is "just" DDP with sharding (it's much more complex due to communication patterns); thinking TP and DP are alternatives (they're typically combined as orthogonal axes in 3D parallelism)

### Tricky spots

- The Kaplan → Chinchilla shift was a big deal. Kaplan said "use most of your budget on parameters." Chinchilla said "balance parameters and tokens." Modern frontier models lean Chinchilla but are increasingly token-heavy (Llama 3 trained 8B on 15T tokens, far past Chinchilla-optimal). Address this honestly.
- Pipeline parallelism's "bubble" — at the start and end of each batch, some pipeline stages are idle. Modern schedules (1F1B, interleaved 1F1B) reduce but don't eliminate this.
- ZeRO stage 3 vs FSDP — they're nearly the same thing, conceptually. PyTorch's FSDP is essentially Microsoft's ZeRO-3 reimplemented in PyTorch.

### Connections

- **Builds on:** Ch 8 (the training loop we now want to parallelize)
- **Sets up:** Ch 10 (the actual software stacks for these parallelism schemes); Ch 17 (inference also has parallelism considerations)

---

## Chapter 10 — Training infrastructure

**Part:** III — Pre-training
**Math depth:** Low
**Sessions:** 4 (46–49)

### Reader will be able to

- Articulate the role of Megatron, DeepSpeed, NeMo, and torch-native FSDP
- Recognize compiler stacks (PyTorch 2 compile, Triton, JAX/XLA) and when each appears
- Describe how training observability and fault tolerance work at scale
- Understand the cluster architecture (NVLink, InfiniBand, NCCL) that production training runs on

### Key concepts

Megatron-LM, DeepSpeed, NeMo, Lightning, torch-native FSDP, Triton kernels, FlashAttention as a Triton-kernel exemplar, PyTorch 2.0 `torch.compile`, JAX/XLA, T5X/MaxText (Google's stack), Weights & Biases / TensorBoard observability, distributed checkpointing, fault recovery, training cluster architecture (H100/H200 with NVLink, InfiniBand HDR/NDR, NCCL).

### Widgets

- **TrainingStackPicker** — interactive flowchart: model size, available hardware, framework preference → recommends a stack (Megatron, DeepSpeed, FSDP, JAX/MaxText, etc.). Shows the reasoning behind each recommendation.

### Runnable code

None runnable. This chapter is reference-heavy; the actual stacks need cluster-grade hardware. Static reference snippets only.

### Pre-research file `research/ch10-training-infra/research.md` scope

- **References:** Megatron-LM repo (github.com/NVIDIA/Megatron-LM); DeepSpeed blog series (deepspeed.ai/tutorials/); Lightning AI's FSDP tutorial; Tri Dao's FlashAttention repos (FlashAttention-1: arxiv.org/abs/2205.14135; FlashAttention-2: arxiv.org/abs/2307.08691; FlashAttention-3: arxiv.org/abs/2407.08608)
- **Papers:** Tillet 2019 (Triton, dl.acm.org/doi/10.1145/3315508.3329973); PyTorch 2 compile design (pytorch.org/blog/getting-started-with-pytorch-2.0/); JAX/XLA design overview
- **Glossary:** kernel, kernel fusion, compute-bound vs memory-bound, NVLink, InfiniBand, NCCL, collective operation, distributed checkpoint
- **Cluster reference:** an H100 DGX node has 8 H100s connected by NVLink (~900 GB/s pairwise); nodes are connected by InfiniBand (~400 Gbps NDR or ~200 Gbps HDR); a 1024-GPU training cluster is the smallest "frontier-scale" setup
- **Common misconceptions:** thinking Megatron and DeepSpeed are competing alternatives (they're complementary; Megatron-DeepSpeed combines tensor parallelism from Megatron with optimizer sharding from DeepSpeed); thinking `torch.compile` always speeds up training (it can hurt for small models or unusual patterns); confusing CUDA kernels with Triton kernels (Triton is a Python-like DSL that compiles to CUDA; FlashAttention's reference impl is Triton-based)

### Tricky spots

- The chapter walks the line between "infrastructure tour" and "implementation detail." Stay at the infrastructure level — readers who want to write Megatron-LM code can read the repo.
- FlashAttention deserves a focused walkthrough — show the I/O complexity argument: standard attention is $O(N^2)$ memory because the full attention matrix is materialized; FlashAttention is $O(N)$ because it tiles and never materializes.
- The "compile vs no-compile" tradeoff — `torch.compile` works well for stable shapes and standard ops; struggles with dynamic shapes or unusual control flow.

### Connections

- **Builds on:** Ch 9 (parallelism is the foundation; this chapter is "how the actual code achieves it")
- **Sets up:** Ch 17 (inference also relies on Triton-style kernels like FlashAttention)

---

# Part IV — Alternative Architectures

The transformer dominates but isn't alone. Part IV covers two important alternatives: Mixture of Experts (sparsely-activated transformers) and state-space models (Mamba). Two chapters.

The reader leaves with calibrated expectations: MoE is production-real (Mixtral, DeepSeek-V3, GPT-4 is rumored MoE); SSMs are promising for long context but underperform transformers on some tasks. We're honest about both.

---

## Chapter 11 — Mixture of Experts (MoE)

**Part:** IV — Alternative Architectures
**Math depth:** Medium
**Sessions:** 4 (50–53)

### Reader will be able to

- Implement a top-k routed MoE layer in numpy with a load-balancing auxiliary loss
- Articulate the total-vs-active parameter distinction
- Explain why MoE is harder at inference time than training time (memory bandwidth)
- Recognize modern MoE designs: Mixtral, DeepSeek-V3, Grok

### Key concepts

Sparse experts, gating network, top-k routing (typically top-2), load-balancing auxiliary loss, expert capacity (how many tokens each expert can handle per batch), token dropping when over capacity, expert parallelism, fine-grained vs coarse-grained experts, shared experts (DeepSeek's innovation), the memory-bandwidth bottleneck at inference.

### Widgets

- **MoERoutingVisualizer** — sequence of tokens flowing into N experts. User adjusts gating temperature and load-balance penalty; watches routing change in real time. Bar chart shows load distribution per expert.

### Runnable code

- `moe_layer.py` — top-2 routed MoE forward pass in numpy with auxiliary loss computation
- `load_balance.py` — demonstrate experts collapsing without the aux loss (one expert receives almost all tokens)

### Pre-research file `research/ch11-moe/research.md` scope

- **Papers:** Shazeer 2017 ("Outrageously Large Neural Networks", arxiv.org/abs/1701.06538) for the original sparsely-gated MoE; Lepikhin 2020 (GShard, arxiv.org/abs/2006.16668); Fedus 2021 (Switch Transformers, arxiv.org/abs/2101.03961); Jiang 2024 (Mixtral, arxiv.org/abs/2401.04088); DeepSeek-V3 technical report 2024 (arxiv.org/abs/2412.19437) for fine-grained + shared experts; Krajewski 2024 (scaling laws for MoE, arxiv.org/abs/2402.07871)
- **Equations:** the gating softmax; the top-k masking; the load-balance loss $\mathcal{L}_{\text{aux}} = \alpha \sum_i f_i \cdot P_i$ where $f_i$ is the fraction of tokens routed to expert $i$ and $P_i$ is the average gate probability for expert $i$
- **Glossary:** expert, gate, router, top-k, expert capacity, capacity factor, shared expert, fine-grained expert, expert parallelism
- **Reference numbers:** Mixtral 8×7B has 47B total params, ~13B active per token (2 of 8 experts × 7B-ish each); DeepSeek-V3 has 671B total, 37B active
- **Common misconceptions:** thinking MoE makes models faster (it doesn't necessarily — total params are larger; the win is in compute-per-token, not memory bandwidth); thinking "8×7B = 56B" arithmetic works (it doesn't — experts share many parameters); thinking MoE replaces the whole transformer (only the FFN; attention is dense)

### Tricky spots

- Top-2 routing and renormalization — after picking top-2 experts, their gate values are renormalized to sum to 1. This is subtle but important.
- The "capacity factor" — how many extra tokens each expert can handle beyond its fair share. Lower capacity = more dropped tokens but cheaper compute.
- Why inference is memory-bound for MoE — even though only 2/8 experts are active per token, all 8 must be in memory because routing happens per-token. This is the actual production challenge with MoE.

### Connections

- **Builds on:** Ch 5 (we're replacing the FFN with the MoE)
- **Sets up:** Ch 17 (inference of MoE has special considerations)

---

## Chapter 12 — State-space models & Mamba

**Part:** IV — Alternative Architectures
**Math depth:** High
**Sessions:** 5 (54–58)

### Reader will be able to

- Derive the continuous-time SSM formulation and its discretization (zero-order hold)
- Implement a selective scan in numpy
- Articulate where SSMs win over transformers (long context, throughput) and where they lose (in-context learning, retrieval over long sequences)
- Recognize hybrid architectures (Jamba, Samba, Zamba) and why they exist

### Key concepts

State-space models, linear time-invariant (LTI) systems, HiPPO matrices, S4, S5, the selective SSM (S6 = Mamba), the scan operation, parallel scan, Mamba-2 and the SSD (Structured State Space Duality) framework, hybrid architectures (Jamba combines Mamba with attention layers).

### Widgets

- **SSMVsAttentionScaling** — plot compute and memory as sequence length grows. User adjusts sequence length and model size; sees the asymptotic difference ($O(L^2)$ vs $O(L)$).
- **SelectiveScanAnimation** — visualize how the state evolves through a sequence under a selective SSM. Each token updates a hidden state that's then used to produce output.

### Runnable code

- `ssm_discretization.py` — discretize a continuous SSM via zero-order hold, run the recurrence forward on a short sequence
- `selective_scan.py` — minimal Mamba-style selective scan in numpy (not optimized; for clarity). Show how it differs from a standard linear recurrence by making transition parameters input-dependent.

### Pre-research file `research/ch12-ssm-and-mamba/research.md` scope

- **Papers:** Gu 2020 (HiPPO, arxiv.org/abs/2008.07669) for the foundational long-range memory work; Gu 2022 (S4, arxiv.org/abs/2111.00396); Smith 2022 (S5, arxiv.org/abs/2208.04933) for the simplification; Gu & Dao 2023 (Mamba, arxiv.org/abs/2312.00752); Dao & Gu 2024 (Mamba-2 / SSD, arxiv.org/abs/2405.21060); Lieber 2024 (Jamba, arxiv.org/abs/2403.19887); Ren 2024 (Samba, arxiv.org/abs/2406.07522); Glorioso 2024 (Zamba)
- **Equations:** the continuous SSM $h'(t) = A h(t) + B u(t)$, $y(t) = C h(t) + D u(t)$; the discretization rules (zero-order hold); the selective SSM where $A$, $B$, $C$ become input-dependent
- **Glossary:** state-space model, LTI system, discretization, selective scan, hardware-aware algorithm, parallel scan
- **Honest assessment:** SSMs underperform transformers on certain tasks (Wen 2024 "Repeat After Me" finding that Mamba struggles with copying long contexts). Where SSMs win: throughput, long context, raw next-token loss. Where they lose: in-context learning, retrieval-from-long-context, code.
- **Common misconceptions:** thinking SSMs are "the next transformer" (the evidence is mixed; hybrids are the most likely near-term winners); thinking selective scan is just an RNN (the selectivity — input-dependent transitions — is what makes it expressive); thinking Mamba is interpretable (the hidden state is even harder to inspect than attention)

### Tricky spots

- The discretization step is mathematically dense. Walk through ZOH carefully; the reader needs intuition for why this gives a recurrence.
- "Selective" is doing a lot of work — it means the recurrence parameters change per timestep, which is what differentiates Mamba from S4/S5 and from classical RNNs.
- The hardware-aware algorithm in the Mamba paper (parallel scan via blelloch-style associative scan, kept in fast SRAM) is what makes Mamba competitive in practice. Mention this without going deep.

### Connections

- **Builds on:** Ch 1 (recurrence and gradient flow); Ch 4 (the comparison is fundamentally against attention)
- **Sets up:** discussions in Ch 17 (Mamba's inference profile is different — constant memory per token) and Ch 22 (long context is the territory where SSMs are most competitive)

---

# Part V — Post-training

Pre-training produces a base model that completes text. Post-training shapes it into something useful. Four chapters: SFT (instruction following), alignment (RLHF/DPO/RLVR), parameter-efficient fine-tuning, distillation.

This part covers the most operationally important techniques in the modern stack. RLHF, DPO, and now RLVR are how frontier labs produce models that follow instructions and reason. LoRA is how everyone else fine-tunes them affordably.

---

## Chapter 13 — Supervised fine-tuning (SFT)

**Part:** V — Post-training
**Math depth:** Low
**Sessions:** 4 (59–62)

### Reader will be able to

- Implement chat templating (rendering structured messages to a flat token sequence) and loss masking
- Articulate the role of SFT versus base pretraining versus RLHF
- Recognize common SFT pitfalls (overfitting on style, capability collapse, alignment tax)
- Format data for major chat templates: ChatML, Llama, Mistral, Gemma

### Key concepts

Instruction tuning, chat templates (ChatML, Llama 3, Alpaca, Mistral, Gemma), loss masking on assistant tokens only, packing vs padding, FLAN, Self-Instruct, Alpaca, Dolly, LIMA's "quality > quantity" thesis, capability collapse, the alignment tax.

### Widgets

- **ChatTemplateVisualizer** — type messages on the left; see them rendered as a flat token sequence on the right under different chat templates. Loss mask shown as a colored overlay on assistant tokens.

### Runnable code

- `chat_template.py` — implement ChatML formatting and tokenization for a small message list
- `loss_masking.py` — demonstrate computing cross-entropy only over assistant tokens, with user/system tokens contributing zero loss

### Pre-research file `research/ch13-sft/research.md` scope

- **Papers:** Wei 2022 (FLAN, arxiv.org/abs/2109.01652); Ouyang 2022 (InstructGPT, arxiv.org/abs/2203.02155) — focus on the SFT section; Wang 2023 (Self-Instruct, arxiv.org/abs/2212.10560); Taori 2023 (Alpaca); Zhou 2023 (LIMA, arxiv.org/abs/2305.11206); Touvron 2023 (Llama 2's SFT recipe)
- **Templates to reference:** ChatML spec; Llama 3 chat template (including special tokens like `<|begin_of_text|>`, `<|start_header_id|>`, `<|end_header_id|>`); Mistral's INST template; Gemma's chat template
- **Equations:** the loss-masked cross-entropy $\mathcal{L} = -\sum_t m_t \log p(x_t | x_{<t})$ where $m_t \in \{0, 1\}$ indicates whether position $t$ is an assistant token
- **Glossary:** instruction tuning, chat template, special token, packing, padding, loss mask, capability collapse, alignment tax
- **Common misconceptions:** thinking SFT adds capabilities (it doesn't really — it shapes existing capabilities; this is the "superficial alignment hypothesis" from LIMA); thinking more SFT is always better (LIMA showed 1000 high-quality examples beat 50K mediocre ones); confusing chat templates between models (they're not interchangeable)

### Tricky spots

- The chat template is NOT just text — the special tokens (`<|im_start|>`, `<|begin_of_text|>`, etc.) are specific token IDs the model was trained to recognize. Mistakes here silently destroy instruction-following.
- The loss-mask question of "should the system prompt contribute to loss?" — usually no, but some recipes include it for stronger system-prompt adherence
- Capability collapse — SFT'd models often score lower on raw capability benchmarks than the base they came from. This is the alignment tax; it's real and not yet fully solved.

### Connections

- **Builds on:** Ch 3 (the chat template tokens are tokenizer-specific); Ch 8 (we're fine-tuning a trained base)
- **Sets up:** Ch 14 (RLHF/DPO operate on an SFT'd starting point)

---

## Chapter 14 — Alignment (RLHF, DPO, GRPO, RLVR, Constitutional AI)

**Part:** V — Post-training
**Math depth:** High
**Sessions:** 6 (63–68)

### Reader will be able to

- Frame autoregressive generation as a token-level MDP and identify exactly where reward enters and where the per-token gradient comes from
- Walk through the RLHF pipeline: reward modeling, then PPO with a KL penalty against the reference
- Read PPO at the token level: where the clipped surrogate gates the gradient on or off, where the per-token KL enters the reward, the role of the value function and GAE
- Derive the DPO loss from the RLHF objective and explain the closed-form collapse
- Derive GRPO's group-relative advantage and explain why a Monte Carlo baseline replaces the value function
- Compose RLVR with GRPO to recreate the DeepSeek-R1 reasoning recipe and explain why long chain-of-thought emerges
- Articulate the differences between DPO, IPO, KTO, ORPO, SimPO
- Understand Constitutional AI / RLAIF
- Express PPO, DPO, GRPO, and RLVR as instances of one token-level pattern: reweighted next-token prediction with a leash to the reference

### Key concepts

The token-level MDP framing of generation (state = prompt + tokens so far; action = next token; deterministic transition; sparse terminal reward). Reward model training on pairwise preferences (Bradley-Terry). Policy gradient and importance sampling; PPO's clipped surrogate with the case-by-case gradient analysis for positive and negative advantage; Generalized Advantage Estimation (GAE); the value function / critic; the four-model RLHF system (policy, value, reward, reference); per-token KL penalty against the reference, folded into the reward. DPO (Direct Preference Optimization) and its derivation from the KL-regularized RL objective; the implicit reward; IPO (KL-regularized variant), KTO (Kahneman-Tversky), ORPO (odds-ratio preference optimization), SimPO (length-normalized, reference-free). Constitutional AI (RLAIF — RL from AI feedback). RLVR (RL with Verifiable Rewards) for math, code, and other checkable outputs. GRPO (Group Relative Policy Optimization, used in DeepSeek-R1) with group-relative advantage as a critic-free Monte Carlo baseline, broadcast to every token in the sampled completion; the k3 KL estimator; dead groups; length and difficulty bias from group standardization (Dr. GRPO). The synthesis: post-training as reweighted next-token prediction, where methods differ in how they compute the per-token weight and where they place the leash to the reference. Reward hacking, length bias, entropy collapse.

### Widgets

- **DPOLossLandscape** — plot the implicit reward induced by DPO for a 2-class toy problem. User adjusts β; sees how the loss reshapes preferences.
- **PPOClipExplorer** — slider for the clip ratio ε; show how it constrains the policy update around the reference policy.

### Runnable code

- `bradley_terry.py` — fit a Bradley-Terry preference model on pairwise data via gradient descent
- `dpo_loss.py` — implement the DPO loss in numpy and verify the gradient matches the derivation
- `ppo_step.py` — minimal PPO update on a single batch showing the clipped surrogate, the case-by-case clip behavior, and the per-token KL contribution
- `grpo_step.py` — minimal GRPO update: sample a group of G completions, compute the group-relative advantage, run a clipped update; demonstrate the dead-group edge case where all completions get the same reward

### Pre-research file `research/ch14-alignment/research.md` scope

- **Papers:** Christiano 2017 ("Deep RL from human preferences", arxiv.org/abs/1706.03741); Ouyang 2022 (InstructGPT — the full RLHF pipeline); Schulman 2017 (PPO, arxiv.org/abs/1707.06347); Rafailov 2023 (DPO, arxiv.org/abs/2305.18290) — derivation in §4; Azar 2023 (IPO, arxiv.org/abs/2310.12036); Ethayarajh 2024 (KTO, arxiv.org/abs/2402.01306); Hong 2024 (ORPO, arxiv.org/abs/2403.07691); Bai 2022 (Constitutional AI, arxiv.org/abs/2212.08073); DeepSeek-R1 paper (arxiv.org/abs/2501.12948) for RLVR / GRPO
- **Full derivations:** the Bradley-Terry preference model $P(y_w \succ y_l) = \sigma(r(y_w) - r(y_l))$; the KL-constrained RL objective $\max_\pi \mathbb{E}_\pi[r] - \beta \KL(\pi \| \pi_{\text{ref}})$; the DPO derivation showing this collapses to a closed-form classification loss when $r$ is parameterized implicitly via $\pi$
- **Equations:** the PPO clipped surrogate $L^{\text{CLIP}}(\theta) = \E_t[\min(r_t(\theta) A_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) A_t)]$; the DPO loss $L_{\text{DPO}} = -\E[(\log \sigma(\beta \log \frac{\pi(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi(y_l|x)}{\pi_{\text{ref}}(y_l|x)}))]$
- **Glossary:** preference data, reward model, policy, reference policy, KL penalty, clipped surrogate, advantage, value function, GAE, verifiable reward
- **Reward hacking case studies:** the "reward model gaming" phenomenon — models learning to game reward models (verbose answers, sycophancy, format-matching)
- **Common misconceptions:** thinking DPO is "easier RLHF" without tradeoffs (it does have tradeoffs — see Ivison 2024 on DPO leaving residual mass on dispreferred completions); thinking RLVR is just RL on math (it's a paradigm shift toward verifiable signals, which works wherever verification is cheap); confusing PPO with TRPO (PPO is the simpler-to-implement variant TRPO inspired)

### Tricky spots

- The DPO derivation is the chapter's first mathematical centerpiece. Walk through:
  1. The KL-constrained RL objective
  2. The optimal policy in closed form $\pi^*(y|x) \propto \pi_{\text{ref}}(y|x) \exp(r(y)/\beta)$
  3. Inverting to express $r$ in terms of $\pi^*$
  4. Substituting into the Bradley-Terry preference loss
  5. The result: a pure classification loss on preferences, no reward model needed
- The token-level synthesis is the chapter's second centerpiece. PPO, DPO, GRPO, and RLVR are all reweighted next-token prediction; what differs is (a) how the per-token weight is computed (GAE-with-critic for PPO, implicit-reward log-ratio for DPO, group-relative for GRPO, verifier for RLVR) and (b) where the leash to the reference is applied (KL inside the reward for PPO, implicit via $\pi_{\text{ref}}$ in the loss for DPO, explicit KL term for GRPO).
- The reference model — readers often forget that DPO, PPO, and GRPO all need this. It's the SFT'd model from Ch 13.
- The PPO clipped gradient: walk through the case-by-case analysis for $A_t > 0$ versus $A_t < 0$. The `min` of clipped and unclipped makes the bound one-sided: zero gradient when the policy has moved far in the rewarded direction (so you don't extrapolate past the trust region), but active gradient if it overshot in the wrong direction (so the policy can always self-correct).
- GRPO's group baseline replaces the value function. The mean reward across a group of G completions is a Monte Carlo estimate of $V(x)$. Standardizing by the group std turns this into the per-completion advantage, broadcast to every token in that completion. Two failure modes to flag: dead groups (all completions get the same reward → std = 0 → zero gradient; some pipelines filter or resample these), and the length/difficulty biases the standardization introduces (Dr. GRPO removes the length normalization and the std divide to fix them).
- PPO's KL leash lives inside the per-token reward; GRPO's lives directly in the loss as an explicit term (k3 estimator, always positive, low variance). Both work; the location changes how gradients flow.
- RLVR is a reward design, not an optimizer. It composes with either PPO or GRPO. R1 specifically used GRPO + RLVR, not PPO + RLVR; the chapter must not blur this. Verifiable rewards (math correct/wrong, code passes/fails) sidestep the reward-model gaming problem entirely.

### Connections

- **Builds on:** Ch 13 (we're aligning an SFT'd model)
- **Sets up:** Ch 20 (R1-style reasoning training uses RLVR/GRPO); Ch 24 (alignment intersects with safety)

---

## Chapter 15 — Parameter-efficient fine-tuning

**Part:** V — Post-training
**Math depth:** Medium
**Sessions:** 4 (69–72)

### Reader will be able to

- Derive the LoRA low-rank decomposition and compute the parameter savings
- Implement LoRA in numpy and apply it to a small linear layer
- Implement LoRA in PyTorch by wrapping linear layers
- Articulate the rank-vs-quality tradeoff and recognize variants (QLoRA, DoRA, VeRA, IA³)

### Key concepts

LoRA (Low-Rank Adaptation), rank $r$, alpha scaling factor, target modules, QLoRA (4-bit NF4 quantization + LoRA), DoRA (decomposed: magnitude + direction), VeRA (shared random matrices, only scales trained), prefix tuning, prompt tuning, IA³ (rescaling vectors), adapter layers (Houlsby).

### Widgets

- **LoRARankVisualizer** — show a weight update matrix $\Delta W$. Slider for rank; see the reconstructed $\Delta W \approx BA$ vary. Display parameter counts and savings.

### Runnable code

- `lora.py` — LoRA from scratch in numpy applied to a small linear layer; demonstrate that the rank-$r$ approximation captures most of $\Delta W$
- `lora_pytorch.py` — wrap a small PyTorch model with LoRA adapters, freeze base weights, train only the adapters; demonstrate parameter count savings

### Pre-research file `research/ch15-peft/research.md` scope

- **Papers:** Hu 2021 (LoRA, arxiv.org/abs/2106.09685); Dettmers 2023 (QLoRA, arxiv.org/abs/2305.14314); Liu 2024 (DoRA, arxiv.org/abs/2402.09353); Kopiczko 2023 (VeRA, arxiv.org/abs/2310.11454); Lester 2021 (prompt tuning, arxiv.org/abs/2104.08691); Li & Liang 2021 (prefix tuning, arxiv.org/abs/2101.00190); Liu 2022 (IA³, arxiv.org/abs/2205.05638); Biderman 2024 ("LoRA Learns Less and Forgets Less", arxiv.org/abs/2405.09673)
- **Equations:** the LoRA update $W' = W + \frac{\alpha}{r} BA$ where $B \in \R^{d \times r}$ and $A \in \R^{r \times k}$; parameter count: full fine-tuning $= dk$, LoRA $= r(d + k)$ — for $r=16, d=k=4096$, that's $\sim 0.8\%$ of full
- **Glossary:** rank, low-rank decomposition, adapter, target module, alpha scaling
- **NF4 spec:** the 4-bit NormalFloat datatype used in QLoRA — quantization grid optimized for normally-distributed weights
- **Common misconceptions:** thinking LoRA is lossless (it's not — Biderman 2024 shows LoRA underperforms full fine-tuning on hard tasks, especially math/code); thinking $\alpha$ does nothing (it scales the LoRA update; common practice is $\alpha = r$ but it's tunable); thinking LoRA only works on attention (it works on any linear layer, including FFN; for best quality target both)

### Tricky spots

- The "initialization trick" — $A$ is initialized with small Gaussian, $B$ is initialized to zero. This means $\Delta W = BA = 0$ at the start, so the LoRA-adapted model is identical to the base model at step 0.
- QLoRA's "double quantization" — the per-block quantization constants are themselves quantized, saving an additional ~0.4 bits per parameter. Small but real.
- The "merge" step — at inference, $W$ and $BA$ can be added together to recover a single weight matrix with no inference-time overhead. This is what makes LoRA practical for production.

### Connections

- **Builds on:** Ch 1 (we're learning low-rank parameter updates); Ch 13 (LoRA is most commonly used for SFT, not pre-training)
- **Sets up:** Ch 18 (QLoRA combines LoRA with quantization, which Ch 18 covers in depth)

---

## Chapter 16 — Distillation

**Part:** V — Post-training
**Math depth:** Medium
**Sessions:** 4 (73–76)

### Reader will be able to

- Implement response distillation (training a student on teacher logits with temperature scaling)
- Articulate when distillation works (specialization, compression) and when it doesn't
- Recognize feature/attention distillation
- Connect distillation to modern small models (DistilBERT, MiniLM, Phi, R1-distilled)

### Key concepts

Soft targets, temperature scaling, KL divergence loss, hard vs soft distillation, response distillation, feature/representation distillation, attention distillation, on-policy vs off-policy distillation, self-distillation, MiniLLM (reverse KL), distillation for reasoning (R1 → smaller models).

### Widgets

- **TemperatureScalingVisualizer** — show teacher logits, then the sharpened/softened distribution at different temperatures $T$. Demonstrate why high $T$ surfaces more information for the student.

### Runnable code

- `distillation_loss.py` — implement KL loss with temperature, compare to hard-label CE on a toy example. Show that the KL term over-weights the teacher's "wrong" but high-probability classes, which is the source of signal.
- `attention_distillation.py` — show how to align teacher and student attention maps with an auxiliary MSE loss

### Pre-research file `research/ch16-distillation/research.md` scope

- **Papers:** Hinton 2015 ("Distilling the Knowledge in a Neural Network", arxiv.org/abs/1503.02531); Sanh 2019 (DistilBERT, arxiv.org/abs/1910.01108); Jiao 2020 (TinyBERT — feature and attention distillation, arxiv.org/abs/1909.10351); Gu 2024 (MiniLLM — reverse KL, arxiv.org/abs/2306.08543); DeepSeek-R1's distillation results (R1-Distill-Qwen, R1-Distill-Llama variants)
- **Equations:** the standard distillation loss $\mathcal{L} = (1-\alpha) \mathcal{L}_{\text{CE}}(y, \sigma(z_s)) + \alpha T^2 \mathcal{L}_{\text{KL}}(\sigma(z_t/T) \| \sigma(z_s/T))$; explanation of the $T^2$ factor (gradient magnitude rescaling)
- **Glossary:** teacher, student, soft target, temperature, response distillation, feature distillation, attention distillation, on-policy distillation
- **Common misconceptions:** thinking distillation transfers "all" of the teacher (it doesn't — student capacity bounds what can be transferred); thinking distillation is just for compression (it's also for specialization — a 7B distilled from a frontier model can outperform a 7B trained from scratch); confusing on-policy and off-policy (on-policy: student generates, teacher scores; off-policy: teacher generates, student imitates)

### Tricky spots

- The temperature trick is non-obvious — at $T=1$, the teacher's soft targets are nearly one-hot for confident predictions; at $T=2$ or higher, the "secondary information" (which other classes the teacher thought were plausible) becomes visible.
- Why response distillation works for reasoning — R1 distillation showed that just training student models on the reasoning traces of a stronger model dramatically improves reasoning. The student doesn't need RLVR; it just needs the trace data.
- Feature/attention distillation vs response distillation — the former requires architectural compatibility (similar layers); the latter is architecture-agnostic.

### Connections

- **Builds on:** Ch 8 (the student is being trained); Ch 14 (R1-distill builds on RLVR-trained teachers)
- **Sets up:** Ch 20 (reasoning training can be replicated cheaply via distillation)

---

# Part VI — Inference

A trained model is half the story. Part VI covers what happens at inference: caching, attention optimization, quantization, and sampling. Three chapters.

The economic value of frontier models lives here — every percentage point of inference efficiency translates directly to cost. This is where production engineering pays for itself.

---

## Chapter 17 — Inference optimization

**Part:** VI — Inference
**Math depth:** Medium
**Sessions:** 5 (77–81)

### Reader will be able to

- Implement a KV cache in numpy and demonstrate the compute savings
- Explain FlashAttention at the level of "tiling avoids materializing the attention matrix"
- Articulate PagedAttention, continuous batching, and speculative decoding
- Distinguish prefill (compute-bound) from decode (memory-bound) and explain why this matters

### Key concepts

KV cache, prefill phase vs decode phase, memory-bound vs compute-bound inference, FlashAttention I/II/III (tiling to keep attention in SRAM), PagedAttention (vLLM's contribution — paging the KV cache like virtual memory), continuous batching, speculative decoding (draft + verify), Medusa, EAGLE, chunked prefill.

### Widgets

- **KVCacheAnimation** — animate a decoder generating tokens one by one. Show $K$ and $V$ matrices growing as tokens are added. Toggle between "no cache" (recomputes everything each step) and "with cache" (recomputes only the new column). Compare FLOPs.
- **SpeculativeDecodingVisualizer** — show draft model proposing 4 tokens, target model verifying. Walk through accept/reject logic step by step; demonstrate the average tokens-per-target-call speedup.

### Runnable code

- `kv_cache.py` — minimal decoder loop with and without KV cache, timing both; show the asymptotic FLOPs difference
- `speculative_decoding.py` — toy implementation of draft+verify with a small "draft" model and a "target" model; demonstrate the speedup empirically

### Pre-research file `research/ch17-inference-optimization/research.md` scope

- **Papers:** Dao 2022 (FlashAttention, arxiv.org/abs/2205.14135); Dao 2023 (FlashAttention-2, arxiv.org/abs/2307.08691); Shah 2024 (FlashAttention-3, arxiv.org/abs/2407.08608); Kwon 2023 (vLLM / PagedAttention, arxiv.org/abs/2309.06180); Leviathan 2023 (speculative decoding, arxiv.org/abs/2211.17192); Cai 2024 (Medusa, arxiv.org/abs/2401.10774); Li 2024 (EAGLE, arxiv.org/abs/2401.15077)
- **Equations:** FlashAttention's I/O complexity argument — standard attention is $O(N^2 d)$ memory due to materializing the attention matrix; FlashAttention tiles and computes online softmax, reducing to $O(N d)$ memory; speculative decoding's expected tokens-per-step under acceptance rate $\alpha$ for draft length $k$: $1 + \sum_{i=1}^{k} \alpha^i$
- **Glossary:** prefill, decode, KV cache, attention matrix materialization, online softmax, paged attention, draft model, target model, acceptance rate, continuous batching, chunked prefill
- **Numbers to know:** KV cache size for Llama 3 70B at 8K context $\approx$ 4–8 GB per request depending on precision; vLLM's PagedAttention reduces fragmentation by ~95%; speculative decoding typically yields 2–3× speedup for chat workloads
- **Common misconceptions:** thinking KV caching is free (it's not — it shifts cost from compute to memory; for long contexts, KV cache dominates GPU memory); thinking FlashAttention "speeds up attention" simplistically (it's about memory bandwidth — same FLOPs, but actually achieved much closer to peak because of better SRAM usage); thinking speculative decoding helps prefill (it doesn't — prefill is already compute-bound)

### Tricky spots

- The prefill/decode distinction is critical and often missed. Prefill processes the entire prompt at once (compute-bound, parallel across positions). Decode generates one token at a time (memory-bound, sequential). They have different optimization profiles.
- FlashAttention's "online softmax" trick — incrementally computing softmax over blocks without materializing the full matrix. The math is the LogSumExp identity applied tile-by-tile.
- Speculative decoding correctness — the rejection-sampling logic is what makes the speedup mathematically free: the output distribution is identical to the target model's. Walk through this.

### Connections

- **Builds on:** Ch 4 (the attention we're optimizing); Ch 5 (the transformer block); Ch 11 (MoE inference has special considerations)
- **Sets up:** Ch 18 (quantization is another inference optimization)

---

## Chapter 18 — Quantization & compression

**Part:** VI — Inference
**Math depth:** Medium
**Sessions:** 4 (82–85)

### Reader will be able to

- Implement INT8 quantization with symmetric and asymmetric scaling
- Implement INT4 group quantization
- Articulate GPTQ, AWQ, and SmoothQuant at the algorithmic level
- Recognize the role of quantization in deployment stacks (llama.cpp, vLLM, TGI)

### Key concepts

INT8/INT4 quantization, symmetric vs asymmetric, per-tensor vs per-channel vs per-group, weight-only vs weight+activation quantization, GPTQ (Hessian-based, layer-by-layer), AWQ (activation-aware, scaling outlier channels), SmoothQuant (smoothing activations into weights), GGUF format (llama.cpp), NF4 (used in QLoRA), Hadamard rotation tricks (QuIP, SpinQuant), outlier features.

### Widgets

- **QuantizationExplorer** — show a weight matrix. User picks quantization scheme (FP16, INT8 symmetric, INT4 symmetric, INT4 group). See quantized values, reconstruction error, and a histogram of quantization error per element.

### Runnable code

- `int8_quantization.py` — symmetric and asymmetric INT8 quantization from scratch in numpy; verify roundtrip
- `int4_group_quant.py` — group-wise INT4 with scale and zero-point per group of 32 or 128

### Pre-research file `research/ch18-quantization/research.md` scope

- **Papers:** Frantar 2022 (GPTQ, arxiv.org/abs/2210.17323); Lin 2023 (AWQ, arxiv.org/abs/2306.00978); Xiao 2022 (SmoothQuant, arxiv.org/abs/2211.10438); Dettmers 2022 (LLM.int8() — outlier features, arxiv.org/abs/2208.07339); Tseng 2024 (QuIP#, arxiv.org/abs/2402.04396); Ashkboos 2024 (SpinQuant, arxiv.org/abs/2405.16406)
- **Equations:** symmetric quantization $q = \text{round}(x / s) \cdot s$ where $s = \max(|x|) / (2^{b-1} - 1)$; asymmetric uses a zero-point; per-group: $s$ computed per group of consecutive elements
- **Glossary:** quantization, dequantization, scale, zero-point, group size, outlier feature, calibration data, per-tensor, per-channel, per-group
- **Reference numbers:** INT8 weight-only gives ~50% memory savings with minimal quality loss; INT4 weight-only gives ~75% with measurable quality drop (mitigated by GPTQ/AWQ); INT4 group-of-128 is the sweet spot for most weight quantization
- **GGUF format details:** the file format used by llama.cpp; includes quantization metadata so the model can be loaded directly
- **Common misconceptions:** thinking quantization is "just rounding" (the calibration, outlier handling, and per-group machinery matter enormously); thinking INT4 is universally fine (some tasks degrade noticeably); confusing weight quantization with activation quantization (weight-only is easier and more common in inference; activation quantization helps throughput but is harder to do without quality loss)

### Tricky spots

- The "outlier feature" phenomenon — a small fraction of features in LLM activations have outsized magnitudes. Naive quantization wastes the dynamic range on these outliers. LLM.int8() showed this; GPTQ and AWQ work around it.
- AWQ's specific insight: activation magnitude can be used to identify "important" weight columns; scale these to use more of the quantization range.
- Why per-group beats per-tensor — modern transformer weights have varying scales across channels; per-group adapts to this without the overhead of per-channel.

### Connections

- **Builds on:** Ch 15 (QLoRA combines this with LoRA)
- **Sets up:** Ch 17 (quantization interacts with KV cache — there's also KV cache quantization)

---

## Chapter 19 — Sampling & decoding

**Part:** VI — Inference
**Math depth:** Low
**Sessions:** 3 (86–88)

### Reader will be able to

- Implement greedy, top-k, top-p (nucleus), min-p, and temperature sampling
- Articulate when beam search is appropriate (rarely for LLMs)
- Implement structured output via grammar-constrained decoding
- Recognize repetition penalties, frequency penalties, and contrastive search

### Key concepts

Greedy decoding, temperature scaling, top-k truncation, top-p (nucleus) truncation, min-p truncation, typical sampling, beam search and its failure modes for LLMs, contrastive search, structured output via Outlines / JSON Schema, grammar-constrained decoding, repetition penalty, frequency/presence penalties.

### Widgets

- **SamplingDistributionInteractive** — given a fixed logit distribution, user adjusts temperature, top-k, top-p, min-p. See the effective distribution after each truncation step. Display entropy.

### Runnable code

Combined session 88: both runnables in one session per the 3-session budget.

- `sampling.py` — all major sampling methods in numpy, applied to a fixed logit distribution; visualize each
- `constrained_json.py` — Outlines-style JSON-schema constrained decoding on a tiny LM (or a mocked one with hand-crafted logits)

### Pre-research file `research/ch19-sampling/research.md` scope

- **Papers:** Holtzman 2020 (nucleus sampling, arxiv.org/abs/1904.09751); Hewitt 2022 (truncation analysis, arxiv.org/abs/2210.15191); Nguyen 2024 (min-p, arxiv.org/abs/2407.01082); Willard 2023 (Outlines, arxiv.org/abs/2307.09702); Su 2022 (contrastive search, arxiv.org/abs/2202.06417)
- **Algorithms:** all sampling methods as numpy pseudocode; FSM-based grammar-constrained decoding (Outlines's approach)
- **Glossary:** logits, probabilities, temperature, top-k, top-p, min-p, nucleus, beam, beam width, structured output, JSON Schema, grammar, finite state automaton
- **Common misconceptions:** thinking higher temperature is always more creative (very high $T$ becomes incoherent because low-probability tokens get sampled); thinking beam search is good for LLMs (it isn't — it produces repetitive, generic text because LLMs aren't trained for it); thinking constrained decoding is just regex (it's a runtime modification of the next-token distribution; the model isn't "choosing" — the distribution is masked)

### Tricky spots

- The interaction order between temperature, top-k, and top-p — most implementations apply them in this order: temperature → top-k → top-p → renormalize → sample. Document this carefully.
- Why beam search is bad for open-ended generation — Holtzman showed beam search produces dull, repetitive text; the maximum-likelihood objective doesn't match what humans want from generation.
- Constrained decoding doesn't make the model "smart" — if the model wasn't going to produce valid JSON anyway, constraining it forces tokens it didn't want and may produce nonsense within the JSON structure.

### Connections

- **Builds on:** Ch 4 (the logits we're sampling from)
- **Sets up:** Ch 20 (self-consistency uses sampling); Ch 21 (tool use requires structured output)

---

# Part VII — Modern Capabilities

What can a modern LLM actually do, beyond next-token prediction? Part VII covers four major capability areas: reasoning, tool use, retrieval/RAG, and multimodal.

These are the frontier-defining capabilities of 2024–2026. The reader leaves Part VII understanding how each works mechanically — what training data, what inference setup, what guardrails — and where each is still limited.

---

## Chapter 20 — Reasoning & test-time compute

**Part:** VII — Modern Capabilities
**Math depth:** Low
**Sessions:** 5 (89–93)

### Reader will be able to

- Articulate chain-of-thought (CoT), self-consistency, and tree-of-thoughts
- Distinguish process reward models (PRMs) from outcome reward models (ORMs)
- Recognize the o1/R1 paradigm: scaling test-time compute via RL on verifiable problems
- Understand GRPO and the shift away from value models

### Key concepts

Chain-of-thought prompting, zero-shot CoT, self-consistency (majority vote over sampled CoTs), tree of thoughts, MCTS-style search, process reward models (PRMs — score each reasoning step), outcome reward models (ORMs — score only the final answer), test-time compute scaling, o1-preview/o1, DeepSeek R1, GRPO (Group Relative Policy Optimization — no value model), the "aha moment" emergence during R1 training, reasoning data quality.

### Widgets

- **TestTimeComputeCurves** — plot accuracy vs FLOPs spent at inference for different methods (greedy, self-consistency-N, search-based). Show how more compute increases accuracy and the diminishing returns curve.

### Runnable code

- `self_consistency.py` — given a problem, sample N CoTs from a model (or a mocked model with hand-crafted output distribution), take majority vote
- `prm_scoring.py` — toy process reward model that scores each step in a CoT trace; aggregate to a final solution score

### Pre-research file `research/ch20-reasoning/research.md` scope

- **Papers:** Wei 2022 (CoT prompting, arxiv.org/abs/2201.11903); Kojima 2022 (zero-shot CoT, arxiv.org/abs/2205.11916); Wang 2022 (self-consistency, arxiv.org/abs/2203.11171); Yao 2023 (Tree of Thoughts, arxiv.org/abs/2305.10601); Lightman 2023 ("Let's Verify Step by Step" — PRMs, arxiv.org/abs/2305.20050); DeepSeek-R1 paper (arxiv.org/abs/2501.12948); OpenAI o1 system card (openai.com/index/openai-o1-system-card/); Snell 2024 ("Scaling LLM Test-Time Compute Optimally", arxiv.org/abs/2408.03314)
- **Equations:** the test-time compute scaling formulation; GRPO's group-relative advantage computation (advantage = reward - group mean, no value model needed)
- **Glossary:** chain of thought, scratchpad, self-consistency, process reward, outcome reward, test-time compute, reasoning trace, "aha moment"
- **Reference numbers:** o1's exact training methodology is not public; R1's GRPO + RLVR recipe is fully documented; self-consistency typically gives 5-10pp improvement on hard math/reasoning at the cost of N× inference
- **Common misconceptions:** thinking "more reasoning is always better" (no — extending CoT past a problem-dependent length plateaus); confusing PRM and ORM (PRMs score steps; ORMs score outcomes); thinking o1 is a fundamentally different architecture (it's almost certainly a standard transformer trained with new methods)

### Tricky spots

- The R1 paper's most important contribution is GRPO + RLVR. Walk through both:
  - RLVR: rewards come from verifying correctness (math, code, formal proofs) — no reward model
  - GRPO: advantage = reward - group mean, no value function — much simpler PPO variant
- The "aha moment" claim — the R1 paper showed that as RL training progressed, models began spontaneously generating longer, more reflective reasoning traces. This is striking but the mechanism is not yet understood.
- Self-consistency's tradeoff — it's expensive (N× inference) and only helps when problems have right/wrong answers. Open-ended generation can't use it.

### Connections

- **Builds on:** Ch 14 (RLVR / GRPO build on the alignment chapter); Ch 19 (sampling matters for diverse CoTs)
- **Sets up:** Ch 26 (reasoning evals); Ch 27 (agent loops often involve reasoning steps)

---

## Chapter 21 — Tool use

**Part:** VII — Modern Capabilities
**Math depth:** Low
**Sessions:** 4 (94–97)

### Reader will be able to

- Understand the JSON tool schema and function-calling protocol used by major APIs
- Articulate how models are trained for tool use
- Implement a minimal tool-use loop with the Anthropic API
- Recognize multi-step tool use, parallel tool calls, and error recovery

### Key concepts

Tool schemas, function-calling protocol, `tool_use` / `tool_result` message roles in Anthropic API (and OpenAI's analogous structure), structured output as a foundation, training data for tool use (synthetic generation + filtered traces), parallel tool calls, tool result conditioning, error handling and retries, tool-use evaluation (τ-bench).

### Widgets

- **ToolCallTraceViewer** — show a multi-step tool-using conversation. User clicks each step, sees the model's reasoning, the tool call (with JSON args), the tool result, and the next reasoning step. Highlight where errors happen and how the model recovers.

### Runnable code

- `tool_loop_anthropic.py` — minimal client-side loop using the Anthropic API. The user supplies their own API key via a small input form in the widget; key is stored in localStorage. Example task: a tiny weather + calendar tool combo. (Pyodide can run this; the `fetch` call is made via JS bridge.)
- `tool_schema_validation.py` — validate tool-call JSON against a JSON Schema before dispatching to the actual tool

### Pre-research file `research/ch21-tool-use/research.md` scope

- **Papers:** Schick 2023 (Toolformer, arxiv.org/abs/2302.04761); Yao 2022 (ReAct — closely related, arxiv.org/abs/2210.03629); the Berkeley Function-Calling Leaderboard for evaluation context (gorilla.cs.berkeley.edu/leaderboard.html); Yao 2024 (τ-bench, arxiv.org/abs/2406.12045)
- **References:** Anthropic tool use documentation (docs.claude.com); OpenAI function calling documentation; JSON Schema specification
- **Code patterns:** the Anthropic tool-use message protocol (`role: 'user'`, `role: 'assistant'`, `role: 'user'` with `tool_result` content); the OpenAI equivalent
- **Glossary:** tool, tool schema, function calling, tool call, tool result, parallel tool calls, structured output
- **Common misconceptions:** thinking tool use is just prompt engineering (modern models are trained on tool-use data; this changes the prior); thinking tool calls are always correct (they aren't — validate everything); thinking the model "executes" tools (it doesn't — the harness does; the model produces the call)

### Tricky spots

- The protocol shape is precise. Anthropic uses `tool_use` blocks inside assistant messages and `tool_result` blocks inside user messages. OpenAI uses a slightly different shape (function calls and function results as their own roles). Show both; the principle is the same.
- Error handling — when a tool fails, the harness must return a structured error to the model so it can recover. Bare exceptions break the loop.
- API key handling — readers must provide their own key. We do not ship one. The key lives in localStorage in the browser only; it's never sent to any server we control.

### Connections

- **Builds on:** Ch 19 (structured output is the foundation); Ch 13 (tool-use training data resembles SFT data)
- **Sets up:** Ch 27 (agents are essentially tool-use loops with planning); Ch 30 (tool-use evaluation)

---

## Chapter 22 — Retrieval & RAG

**Part:** VII — Modern Capabilities
**Math depth:** Medium
**Sessions:** 5 (98–102)

### Reader will be able to

- Implement dense embedding-based retrieval and BM25 from scratch
- Understand sparse, dense, and hybrid retrieval
- Implement a cross-encoder reranker
- Articulate RAG architecture patterns and when long context beats RAG (and vice versa)

### Key concepts

Sparse retrieval (BM25), dense retrieval (bi-encoders, dual encoders), cross-encoder rerankers, ColBERT (late-interaction retrieval), hybrid retrieval, chunking strategies, vector databases (FAISS, Pinecone, Weaviate, pgvector), MMR diversification, RAG vs long context, query rewriting, agentic retrieval, RAG evaluation (RAGAS), contextual retrieval (Anthropic 2024).

### Widgets

- **RetrievalComparator** — paste a query and a corpus of 10–20 docs. See top results under BM25, dense embeddings, and a reranker. Color-code which docs are actually relevant. Show score breakdowns.

### Runnable code

- `bm25.py` — BM25 from scratch in numpy with explicit term-frequency and inverse-document-frequency computation
- `dense_retrieval.py` — bi-encoder retrieval with a tiny sentence-embedding model (loaded via Pyodide or via precomputed embeddings)

### Pre-research file `research/ch22-retrieval-and-rag/research.md` scope

- **Papers:** Robertson 2009 (BM25 survey, dl.acm.org/doi/10.1561/1500000019); Karpukhin 2020 (DPR — dense passage retrieval, arxiv.org/abs/2004.04906); Khattab 2020 (ColBERT, arxiv.org/abs/2004.12832); Lewis 2020 (RAG, arxiv.org/abs/2005.11401); Reimers 2019 (Sentence-BERT, arxiv.org/abs/1908.10084); Xu 2024 ("Retrieval meets Long Context", arxiv.org/abs/2310.03025); Anthropic's contextual retrieval blog (www.anthropic.com/news/contextual-retrieval, 2024)
- **Equations:** BM25 formula with $k_1$ and $b$ parameters; the bi-encoder cosine similarity; MMR's diversification objective $\lambda \cdot \text{sim}(q, d) - (1-\lambda) \cdot \max_{d' \in S} \text{sim}(d, d')$
- **Glossary:** sparse retrieval, dense retrieval, bi-encoder, cross-encoder, reranker, embedding, chunk, vector database, recall, precision, MRR, MMR, RAG, hybrid retrieval
- **Reference numbers:** typical chunk sizes 200–800 tokens; reranker latency dominates for large candidate sets; contextual retrieval claims to halve retrieval failures on Anthropic's evals
- **Common misconceptions:** thinking RAG is "just retrieving documents" (chunking, query rewriting, reranking, and generation are all separate optimization targets); thinking dense always beats sparse (BM25 is competitive and sometimes better; hybrid is usually best); thinking long context obsoletes RAG (it doesn't — long context is expensive at inference; RAG is cheaper and more controllable)

### Tricky spots

- The bi-encoder vs cross-encoder tradeoff — bi-encoder is fast (precompute corpus embeddings, dot product at query time) but lower quality; cross-encoder is high quality but $O(N)$ per query. The standard recipe: bi-encoder to get top-100, cross-encoder to rerank to top-10.
- Chunking strategy matters enormously — fixed-size, semantic, hierarchical, with overlap. There's no universal best; document-type-dependent.
- Long context vs RAG honest comparison — for static knowledge and small docs, long context wins on quality. For dynamic content, large corpora, or cost-sensitive deployments, RAG wins.

### Connections

- **Builds on:** Ch 2 (embeddings); Ch 13 (rerankers are often fine-tuned variants of base models)
- **Sets up:** Ch 27 (agents often have retrieval as a core capability)

---

## Chapter 23 — Multimodal

**Part:** VII — Modern Capabilities
**Math depth:** Medium
**Sessions:** 4 (103–106)

### Reader will be able to

- Implement ViT (vision transformer) patch embedding
- Implement CLIP-style contrastive training (conceptually and as a small numpy demo)
- Articulate vision-language model paradigms: LLaVA (vision encoder + LLM), Flamingo (cross-attention), native multimodal (GPT-4o, Claude 3.5, Gemini)
- Recognize how audio and video modalities are incorporated

### Key concepts

ViT (patch embedding, position embedding for image patches), CLIP contrastive objective (InfoNCE), vision encoders + LLM (LLaVA pattern), cross-attention (Flamingo pattern), native multimodal (GPT-4o, Claude 3.5, Gemini), image tokenization (VQ-VAE, lookup-free), audio (Whisper, codecs), video (sparse frame sampling, temporal attention).

### Widgets

- **CLIPEmbeddingSpace** — show 2D projection of image and text embeddings from a small pretrained CLIP variant. User types text; see which image embeddings are nearest. Demonstrate the joint embedding space.

### Runnable code

- `vit_patch_embed.py` — implement ViT patch embedding for a small image (e.g., 32×32 with 4×4 patches)
- `clip_contrastive.py` — toy implementation of InfoNCE loss for a batch of image-text pairs; show the contrastive matrix and the symmetric loss

### Pre-research file `research/ch23-multimodal/research.md` scope

- **Papers:** Dosovitskiy 2020 (ViT, arxiv.org/abs/2010.11929); Radford 2021 (CLIP, arxiv.org/abs/2103.00020); Alayrac 2022 (Flamingo, arxiv.org/abs/2204.14198); Liu 2023 (LLaVA, arxiv.org/abs/2304.08485); Radford 2022 (Whisper, arxiv.org/abs/2212.04356); Esser 2020 (VQ-VAE); Mentzer 2023 (Finite Scalar Quantization, arxiv.org/abs/2309.15505)
- **System cards:** GPT-4o (technical report partial); Gemini 1.5 (arxiv.org/abs/2403.05530); Claude 3.5 Sonnet (anthropic.com/news/claude-3-5-sonnet — limited info)
- **Equations:** InfoNCE loss for image-text alignment; the patch-embedding transformation as a learned linear projection of flattened patches
- **Glossary:** patch, vision encoder, vision-language model, contrastive learning, modality, cross-attention, image tokenization
- **Common misconceptions:** thinking multimodal models "see" like humans (they don't — they tokenize images into patches and process them similarly to text); thinking ViT is the only vision encoder (it's the standard for VLMs but ConvNets still dominate some pure-vision tasks); thinking native multimodal is just LLaVA scaled up (it's architecturally different — modalities share the same model from token-1, not bolted on)

### Tricky spots

- The LLaVA vs native multimodal distinction — LLaVA bolts a vision encoder onto a text LLM with a projection layer. Native multimodal trains the whole model on interleaved modalities from scratch.
- The "image tokenization" question — there are multiple paradigms: ViT patches (continuous), VQ-VAE codebook indices (discrete), and lookup-free quantization (Yu 2023). Different VLMs use different schemes.
- We can't deeply spec native multimodal architectures because they're not public. Be honest about this.

### Connections

- **Builds on:** Ch 4–5 (the architecture is still transformer)
- **Sets up:** Ch 27 (multimodal agents — e.g., browsing agents that "see" web pages)

---

# Part VIII — Safety, Interpretability & Evaluation

The model exists; it works; how do we know it's safe, what's it doing internally, and how do we measure it? Three chapters: guardrails, mechanistic interpretability, evaluation.

This is where the field is most unsettled. We approach each topic with honesty about what's solved and what isn't.

---

## Chapter 24 — Guardrails & safety

**Part:** VIII — Safety, Interpretability & Evaluation
**Math depth:** Low
**Sessions:** 4 (107–110)

### Reader will be able to

- Articulate the layered defense model: input classifiers, refusal training, output classifiers
- Recognize common jailbreak categories and their corresponding defenses
- Distinguish jailbreaks from prompt injection (especially indirect prompt injection)
- Understand red-teaming methodology

### Key concepts

Input classifiers (toxicity, prompt injection), output classifiers, refusal training, RLHF for safety, Constitutional AI for safety, jailbreaks (role-play, prefix injection, encoded prompts, many-shot, gradient-based), prompt injection vs jailbreaks (different threat models), indirect prompt injection (the LLM reads attacker-controlled content), defense-in-depth, red-teaming (manual + automated), refusal rates and false-positive tradeoffs.

### Widgets

- **JailbreakTaxonomy** — interactive tree of jailbreak categories with one canonical example per leaf. User clicks a leaf to see the attack pattern and the corresponding defense.

### Runnable code

- `prompt_injection_classifier.py` — train a tiny classifier on a small labeled dataset of prompt-injection attempts vs benign prompts; show that even a basic classifier catches obvious cases (but not subtle ones)

### Pre-research file `research/ch24-safety/research.md` scope

- **Papers:** Wei 2023 ("Jailbroken: How Does LLM Safety Training Fail?", arxiv.org/abs/2307.02483); Anil 2024 (many-shot jailbreaking, anthropic.com/research/many-shot-jailbreaking); Perez 2022 ("Red Teaming Language Models with Language Models", arxiv.org/abs/2202.03286); Greshake 2023 (indirect prompt injection, arxiv.org/abs/2302.12173); Zou 2023 (gradient-based universal adversarial attacks, arxiv.org/abs/2307.15043)
- **References:** OWASP LLM Top 10 (genai.owasp.org); Anthropic's Responsible Scaling Policy (anthropic.com/news/responsible-scaling-policy); Constitutional AI revisited from Ch 14 with a safety angle
- **Taxonomies:** standard jailbreak categories — role-play attacks, prefix injection, encoded prompts (base64, leetspeak), many-shot in-context demonstrations, gradient-based suffix attacks; standard prompt injection vectors — direct user prompts, retrieved document poisoning, tool result poisoning
- **Glossary:** jailbreak, prompt injection, indirect prompt injection, refusal, refusal training, false positive, refusal rate, red team, blue team, defense in depth
- **Common misconceptions:** thinking jailbreaks and prompt injection are the same (they're not — jailbreaks make the model do something it wouldn't normally; prompt injection makes the model treat untrusted text as instructions); thinking guardrails are sufficient (they're necessary but not sufficient — bypass rates remain non-trivial); thinking refusal training is just SFT (it's RLHF/CAI plus targeted data; refusal is a learned behavior)

### Tricky spots

- The jailbreak/prompt injection distinction is critical and often missed. Walk through with examples.
- The "honest about residual risk" stance — no guardrail system is bulletproof. Models can be jailbroken, prompt injection is unsolved. Defenses are layered to reduce probability, not eliminate it.
- Avoid teaching attack details that would help an attacker. Stick to taxonomies and defense patterns.

### Connections

- **Builds on:** Ch 14 (alignment is the upstream safety mechanism)
- **Sets up:** Ch 26 (safety evals are a distinct category); Ch 28 (agent harnesses need their own defenses against tool-result injection)

---

## Chapter 25 — Interpretability

**Part:** VIII — Safety, Interpretability & Evaluation
**Math depth:** Medium
**Sessions:** 4 (111–114)

### Reader will be able to

- Distinguish mechanistic interpretability from probing from attribution
- Implement a linear probe on hidden states
- Articulate what sparse autoencoders (SAEs) do and the evidence for their interpretability claims
- Recognize circuits, feature universality, and the Anthropic "Golden Gate Bridge" demonstration

### Key concepts

Probing classifiers, attention-head analysis, induction heads, circuits, superposition, sparse autoencoders (SAEs), feature visualization, activation patching, causal scrubbing, gradient-based attribution, the Anthropic Scaling Monosemanticity result.

### Widgets

- **SAEFeatureExplorer** — show a small set of pretrained SAE features (text examples that activate each). User clicks a feature; see the top activating examples and what concept the feature seems to represent.

### Runnable code

- `linear_probing.py` — train a linear probe on hidden states of a small model to predict POS tags or sentiment; show that early layers contain different information than late layers
- `toy_sae.py` — train a tiny sparse autoencoder on hidden activations of a small model; show that the resulting features are sparser and more interpretable than raw activations

### Pre-research file `research/ch25-interpretability/research.md` scope

- **Papers:** Elhage 2021 ("A Mathematical Framework for Transformer Circuits", transformer-circuits.pub); Olsson 2022 ("In-context Learning and Induction Heads", transformer-circuits.pub/2022/in-context-learning-and-induction-heads); Bricken 2023 ("Towards Monosemanticity: Decomposing Language Models With Dictionary Learning", transformer-circuits.pub/2023/monosemantic-features); Templeton 2024 ("Scaling Monosemanticity", transformer-circuits.pub/2024/scaling-monosemanticity); Cunningham 2023 ("Sparse Autoencoders Find Highly Interpretable Features", arxiv.org/abs/2309.08600); Belinkov 2022 (probing survey, arxiv.org/abs/2102.12452)
- **Equations:** the SAE objective $\mathcal{L} = \|x - \hat{x}\|^2 + \lambda \|f\|_1$ where $f$ is the sparse feature activation; the linear probe objective (standard cross-entropy on hidden states)
- **Glossary:** probe, attribution, circuit, feature, superposition, monosemantic, polysemantic, induction head, dictionary learning, sparse autoencoder, activation patching, causal scrubbing
- **Reference numbers:** Anthropic's Sonnet SAEs found ~34M features at the largest scale; feature interpretability rates are high (~70-90% interpretable by human judges in their evals)
- **Common misconceptions:** thinking interpretability "solves" alignment (it doesn't — finding features is necessary but not sufficient for behavioral control); thinking SAEs recover "true" features (they recover useful features; whether they're "true" representations of the model's internal state is debated); confusing probing with mechanistic interpretability (probing finds *what* a layer represents; mechanistic interp finds *how* it computes)

### Tricky spots

- The honest-uncertainty stance — interpretability is making rapid progress but the field hasn't yet shown it can reliably predict or control model behavior at scale. Be careful not to oversell.
- The induction-heads story is the canonical "circuit" example — a 2-head attention pattern that does in-context copying. Walk through how it works.
- SAE vs PCA — both are dimensionality reductions, but SAEs add a sparsity constraint that produces sparse, more interpretable activations.

### Connections

- **Builds on:** Ch 4–5 (the architecture being interpreted)
- **Sets up:** Ch 26 (interpretability evals are emerging)

---

## Chapter 26 — Evaluation

**Part:** VIII — Safety, Interpretability & Evaluation
**Math depth:** Low
**Sessions:** 4 (115–118)

### Reader will be able to

- Articulate the evaluation landscape: capability evals, safety evals, agent evals
- Understand LLM-as-judge methodology and its pitfalls
- Recognize benchmark contamination and what to do about it
- Build a small custom evaluation set

### Key concepts

Capability benchmarks (MMLU, BIG-Bench, HumanEval, GSM8K, MATH, GPQA), agent benchmarks (τ-bench, SWE-bench, GAIA), safety evals (TruthfulQA, BBQ, harm benchmarks), LLM-as-judge (G-Eval, MT-Bench, Chatbot Arena), pairwise vs absolute scoring, contamination detection, holdout eval design, the "eval crisis" (saturation, gaming, contamination), Upwork HAPI as an exemplar real-world agent benchmark.

### Widgets

- **BenchmarkHeatmap** — matrix of recent models × benchmarks with scores. User filters by benchmark category, sees how models compare. Highlights contamination warnings where known.

### Runnable code

- `llm_judge.py` — implement a pairwise LLM-as-judge using the Anthropic API; demonstrate position bias and how to mitigate (swap order, take both)
- `custom_eval.py` — build and run a tiny custom eval set with pass/fail criteria

### Pre-research file `research/ch26-evaluation/research.md` scope

- **Papers:** Hendrycks 2020 (MMLU, arxiv.org/abs/2009.03300); Chen 2021 (HumanEval, arxiv.org/abs/2107.03374); Cobbe 2021 (GSM8K, arxiv.org/abs/2110.14168); Hendrycks 2021 (MATH, arxiv.org/abs/2103.03874); Rein 2023 (GPQA, arxiv.org/abs/2311.12022); Zheng 2023 (LLM-as-judge / MT-Bench, arxiv.org/abs/2306.05685); Chiang 2024 (Chatbot Arena, arxiv.org/abs/2403.04132); Yao 2024 (τ-bench); Jimenez 2023 (SWE-bench, arxiv.org/abs/2310.06770); Mialon 2023 (GAIA, arxiv.org/abs/2311.12983); Sainz 2023 ("NLP Evaluation in Trouble" — contamination, arxiv.org/abs/2310.18018); Golchin & Surdeanu 2023 (contamination detection methods)
- **References:** Upwork HAPI technical post (Darvin's team's contribution); Helm and EleutherAI evaluation harnesses; LMSYS Chatbot Arena leaderboard
- **Equations:** Elo rating for Chatbot Arena; LLM-as-judge bias correction (position-swap averaging)
- **Glossary:** benchmark, holdout, contamination, LLM-as-judge, position bias, length bias, pass@1, pass@k, Elo
- **Common misconceptions:** thinking benchmark scores are commensurable across models (contamination differs; some models trained on parts of benchmarks); thinking LLM-as-judge is unbiased (it has systematic biases — position, length, self-preference); confusing capability evals with safety evals (different methodologies, different threat models)

### Tricky spots

- Position bias in LLM-as-judge — the judge favors whichever answer comes first. Standard mitigation: evaluate both orderings, average.
- Contamination is pervasive and undetectable in many cases. Standard practice now: holdout eval sets created after model training cutoffs (GPQA Diamond, GAIA private split).
- The "eval crisis" — many benchmarks are saturating (>90% on MMLU is now common). New benchmarks (GPQA, AIME-like math) are pushing back the ceiling but creating eval gaps.

### Connections

- **Builds on:** all previous chapters (we're evaluating everything they covered)
- **Sets up:** Ch 30 (agent evaluation in detail)

---

# Part IX — Agents

The reader leaves Part IX able to design, build, and evaluate an LLM agent system from first principles. Four chapters: foundations, building a harness from scratch, multi-agent systems, evaluation and frameworks.

This is the tutorial's payoff. Everything before this builds toward agents — the system that exercises a model's full capabilities (reasoning, tool use, retrieval, long-running planning) on real tasks.

---

## Chapter 27 — Agent foundations

**Part:** IX — Agents
**Math depth:** Low
**Sessions:** 4 (119–122)

### Reader will be able to

- Articulate what an "agent" is in the modern LLM sense
- Implement the basic agent loop (observe → think → act → observe)
- Understand ReAct and the planning paradigm
- Recognize memory systems (short-term, long-term, working memory)

### Key concepts

Agent loop, ReAct (reasoning + acting), planning (top-down decomposition), reflection / self-critique, scratchpad / working memory, short-term memory (conversation history), long-term memory (vector store), episodic memory, the harness (system around the model), agent vs workflow distinction (Anthropic 2024 "Building Effective Agents").

### Widgets

- **AgentLoopTrace** — animated visualization of the loop: model generates → tool call → tool result → model generates. Step forward/backward through a recorded trace. Show working memory expanding with each iteration.

### Runnable code

- `react_loop.py` — minimal ReAct loop with one simple tool (a Python REPL exposed as a tool), using the Anthropic API. User supplies key.

### Pre-research file `research/ch27-agent-foundations/research.md` scope

- **Papers:** Yao 2022 (ReAct, arxiv.org/abs/2210.03629); Shinn 2023 (Reflexion, arxiv.org/abs/2303.11366); Park 2023 (Generative Agents — Stanford "Smallville", arxiv.org/abs/2304.03442); Sumers 2023 ("Cognitive Architectures for Language Agents", arxiv.org/abs/2309.02427)
- **References:** Anthropic "Building Effective Agents" blog (anthropic.com/research/building-effective-agents, 2024) — the workflow-vs-agent distinction is foundational
- **Glossary:** agent, harness, loop, observation, action, tool, memory (short-term, long-term, working), scratchpad, reflection, planning, workflow vs agent
- **Common misconceptions:** thinking every LLM application is an agent (workflows are not agents — they're predetermined sequences of LLM calls); thinking ReAct is the only pattern (it's the canonical one; many variants exist); thinking memory is just history (memory systems involve retrieval, summarization, and forgetting — see Park 2023 on this)

### Tricky spots

- The agent/workflow distinction matters a lot for design. Workflows are predetermined sequences; agents have dynamic control flow. Most production "agent" systems are actually workflows.
- ReAct's elegance — by interleaving reasoning and actions in the prompt, the model can reflect on observations and adjust plans. This is what gives the loop adaptive behavior.
- Memory systems are an active research area; current production systems use very simple memory (just conversation history + maybe a vector store).

### Connections

- **Builds on:** Ch 20 (reasoning is a core agent capability); Ch 21 (tool use is the action mechanism); Ch 22 (retrieval is memory)
- **Sets up:** Ch 28 (we build a real harness)

---

## Chapter 28 — Building an agent from scratch

**Part:** IX — Agents
**Math depth:** Low
**Sessions:** 5 (123–127)

### Reader will be able to

- Build a complete agent harness with tool registry, message protocol, retries, and budgets
- Implement a clean abstraction layer over the Anthropic API
- Handle errors, partial failures, and timeouts gracefully
- Add observability (traces, structured logging)

### Key concepts

Tool registry pattern, tool schemas (Pydantic / JSON Schema), message protocol design, retries with exponential backoff, max-iteration budgets, token budgets, partial failure handling, structured tracing (OpenTelemetry-style), agent state machines.

### Widgets

- **AgentStateMachineDiagram** — interactive state diagram of the harness: idle → planning → tool_call → tool_result → planning → ... → done. User clicks states; see transition conditions and the code that handles each.

### Runnable code

- `agent_harness.py` — a clean, ~150-line agent harness with tool registry, retries, and tracing. Production-quality patterns the reader can adapt for their own work.
- `tool_registry.py` — decorator-based tool registration with auto-generated JSON schemas from Python type hints

### Pre-research file `research/ch28-agent-from-scratch/research.md` scope

- **References:** Anthropic "Building Effective Agents" agentic patterns (orchestrator-workers, evaluator-optimizer, chain-of-prompts); the LangChain / LangGraph / smolagents / OpenAI Agents SDK / Pydantic AI source code as reference (but we are NOT using these — we're building from scratch to teach the underlying patterns)
- **Code patterns:** tool registry as a Python class with `@register_tool` decorator; the message protocol as a typed dataclass; retry policy as a context manager
- **Glossary:** harness, tool registry, message protocol, retry policy, budget, observability, trace, span
- **Design decisions to articulate:** sync vs async (we use async — agents do I/O); error handling philosophy (fail-fast vs graceful — we use graceful for tool calls, fail-fast for harness bugs); when to give up (budgets are the safety valve)
- **Common misconceptions:** thinking frameworks are necessary (they're not — the patterns are simple enough to implement directly); thinking complexity = sophistication (good agent harnesses are small and clear)

### Tricky spots

- The "happy path is short" principle — the harness's main loop should be readable in 30 lines. All the complexity goes into edge-case handling and observability.
- Tool registration via decorators with type-hint introspection — Pydantic's `BaseModel` makes this clean; show how.
- Cycles in the agent loop — without iteration budgets, agents can spin forever calling the same tool with slightly different args. Budgets are non-negotiable.

### Connections

- **Builds on:** Ch 21 (tool use); Ch 27 (the loop structure)
- **Sets up:** Ch 29 (multi-agent extends single-agent); Ch 30 (we eval what we built)

---

## Chapter 29 — Multi-agent systems

**Part:** IX — Agents
**Math depth:** Low
**Sessions:** 5 (128–132)

### Reader will be able to

- Articulate multi-agent patterns: orchestrator-workers, debate, swarms
- Implement an orchestrator-worker pattern
- Recognize when multi-agent helps and when single-agent + tools is better
- Understand inter-agent communication protocols (MCP, A2A)

### Key concepts

Orchestrator-workers, hierarchical agents, debate (Du 2023), swarm patterns, AutoGen-style group chat, MCP (Model Context Protocol — Anthropic 2024), A2A (Agent-to-Agent), inter-agent communication, when multi-agent helps (parallel exploration, role specialization), when it hurts (added complexity, error compounding, latency).

### Widgets

- **MultiAgentTopologySelector** — flowchart that asks about the task and recommends single-agent, orchestrator-workers, or debate. Shows the topology graph for each.

### Runnable code

- `orchestrator_workers.py` — implement orchestrator-workers pattern: one planner agent decomposes a task, dispatches to N worker agents, aggregates results
- `mcp_server_reference.py` — minimal MCP server example as static reference (MCP needs a runtime not feasible in browser)

### Pre-research file `research/ch29-multi-agent/research.md` scope

- **Papers:** Du 2023 ("Improving Factuality and Reasoning via Multiagent Debate", arxiv.org/abs/2305.14325); Wu 2023 (AutoGen, arxiv.org/abs/2308.08155); Anthropic's research on multi-agent (anthropic.com/news/multi-agent-research-system, 2025)
- **References:** MCP specification (modelcontextprotocol.io); A2A protocol (Google 2025); the Cognition AI "Don't Build Multi-Agents" blog (cognition.ai/blog/dont-build-multi-agents, 2025) — the strong counter-argument worth engaging
- **Glossary:** orchestrator, worker, planner, debate, swarm, MCP, A2A, group chat, shared context, agent-to-agent communication
- **Honest assessment:** Cognition's argument that multi-agent is overused has merit. Single-agent-with-tools wins for most production tasks. Multi-agent shines for: parallel exploration over independent subtasks (research summaries), debate-style verification (where errors are uncorrelated), tasks that benefit from specialized prompts/tools per role.
- **Common misconceptions:** thinking multi-agent always beats single-agent (it doesn't — it adds latency and error compounding); thinking MCP is for multi-agent (it's actually for tools — Model Context Protocol is about exposing tools to LLMs); confusing A2A with MCP (A2A is for agent-to-agent; MCP is for tool servers)

### Tricky spots

- The "when does multi-agent help?" question — frame this carefully. Parallel work over independent subtasks is the strongest case. Sequential pipelines are usually better as a single agent with multiple tool calls.
- MCP is genuinely useful and adoption is real. Don't dismiss it.
- The Cognition "Don't Build Multi-Agents" argument deserves engagement, not dismissal.

### Connections

- **Builds on:** Ch 28 (the single-agent harness is the building block)
- **Sets up:** Ch 30 (multi-agent eval has its own challenges)

---

## Chapter 30 — Agent evaluation & frameworks

**Part:** IX — Agents
**Math depth:** Low
**Sessions:** 4 (133–136)

### Reader will be able to

- Understand the major agent benchmarks (SWE-bench, τ-bench, GAIA, WebArena, OSWorld, BrowseComp, Upwork HAPI)
- Build a small custom agent eval
- Compare major agent frameworks (LangGraph, smolagents, OpenAI Agents SDK, Pydantic AI, Anthropic native)
- Articulate what's coming next in agent infrastructure

### Key concepts

SWE-bench / SWE-bench Verified, τ-bench, GAIA, WebArena, OSWorld, BrowseComp, Upwork HAPI, agent eval design (verifiable rewards, partial credit, judge-based), agent frameworks comparison, agent infrastructure (sandboxes, retry layers, observability).

### Widgets

- **AgentBenchmarkExplorer** — table of major agent benchmarks (task type, eval method, difficulty, top scores). User clicks a benchmark, sees an example task and how leading agents perform.
- **FrameworkPicker** — comparison matrix of frameworks across features (tool use, multi-agent, persistence, streaming, observability). User filters by requirement.

### Runnable code

- `custom_agent_eval.py` — build a small 10-task eval set with verifiable answers, run an agent against it, compute pass@1

### Pre-research file `research/ch30-agent-eval-and-frameworks/research.md` scope

- **Papers:** Jimenez 2023 (SWE-bench, arxiv.org/abs/2310.06770); SWE-bench Verified blog (openai.com); Yao 2024 (τ-bench, arxiv.org/abs/2406.12045); Mialon 2023 (GAIA, arxiv.org/abs/2311.12983); Zhou 2023 (WebArena, arxiv.org/abs/2307.13854); Xie 2024 (OSWorld); BrowseComp (OpenAI 2025); Upwork HAPI technical post (the publicly available material; this is Darvin's team's work)
- **Framework references:** LangGraph (langchain-ai/langgraph); smolagents (huggingface/smolagents); OpenAI Agents SDK (openai-agents-python); Pydantic AI (pydantic/pydantic-ai); Anthropic's native loop pattern (no SDK; just the API + a simple harness)
- **Glossary:** pass@1, pass@k, partial credit, sandbox, environment, task verifier, judge, framework, harness
- **Reference numbers:** SWE-bench Verified top scores were ~45-60% in late 2024 and have continued rising; τ-bench is harder; GAIA's L3 questions are still under 50% for leading agents
- **Common misconceptions:** thinking benchmarks measure "agent ability" universally (they measure benchmark-specific ability; transfer is inconsistent); thinking frameworks are interchangeable (they have meaningfully different abstractions); thinking we've "solved" agents (we haven't — error rates on simple real-world tasks remain high)

### Tricky spots

- Upwork HAPI deserves real attention given the author's background. Show what makes it different from prior agent benchmarks (real-world tasks from Upwork's marketplace, end-to-end evaluation).
- The "framework picker" widget needs to make honest tradeoffs — no framework is universally best. LangGraph for complex state machines; OpenAI Agents SDK for OpenAI-first development; Anthropic native for minimal harness; Pydantic AI for type-heavy work.
- We don't need to recommend a framework. The chapter's stance is: understand the patterns, then pick (or build) what fits.

### Connections

- **Builds on:** Ch 26 (general evaluation principles); Ch 27–29 (the agent systems we're evaluating)
- **Closes the tutorial.** The reader leaves capable of building and evaluating agents from first principles.

---

# Session totals

| Phase | Sessions |
|---|---|
| Scaffolding | 6 |
| Pre-research (per chapter) | 30 |
| Chapter sessions | 130 |
| Polish & QA | 6 |
| **Total Claude Code sessions** | **172** |

Plus 5 foundation context/plan files and this curriculum file itself: ~177 total artifacts across the project.
