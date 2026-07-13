# Chapter 17 — Inference optimization: research

> Curated source material for Chapter 17's build sessions. **The chapter that opens Part VI (Inference).** Where Part V (Ch 13-16) covered how to *train* aligned, deployable models, Part VI covers how to *serve* them efficiently at scale. This chapter is the foundation: KV cache (the most important optimization), prefill vs decode phases, batching strategies, Flash Attention (memory-efficient kernels), speculative decoding (draft + verify), and PagedAttention (the memory-management technique behind vLLM). **Practical engineering chapter** — like Ch 10 (training infrastructure) and Ch 15 (PEFT), the voice is grounded, the numbers are concrete, and the operational story matters. Single-topic chapter; uses the **4-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Inference Optimization

**Premise:** A trained transformer is mathematically just a forward pass. But serving one efficiently at scale is an entire engineering domain. Naive inference re-runs every layer for every token; modern inference reuses computation via the KV cache, batches requests across users, exploits memory hierarchy via Flash Attention, accelerates decoding via speculative methods, and manages GPU memory via paged allocation. The result: serving costs drop by orders of magnitude vs naive implementation. **This is the chapter that explains how production LLM serving actually works.**

**Two flavors of optimization covered:**

1. **Algorithmic optimizations** — KV cache, speculative decoding, flash attention. Changes to *what* is computed.
2. **System optimizations** — continuous batching, paged memory, scheduling. Changes to *how* it's organized and executed.

**Out of scope (other chapters):**
- Quantization (Ch 18) — also reduces inference cost but via lower precision, not algorithmic restructuring
- Sampling algorithms (Ch 19) — how decisions are made about which token to emit, given the logits
- Model architecture (Ch 4-6) — already covered; this chapter assumes the architecture is fixed
- Distillation (Ch 16) — also reduces inference cost, but by changing the model itself

**In scope and locked:**
- **The two phases of inference**: prefill (process the prompt) and decode (generate tokens one at a time)
- **KV cache**: caching past keys and values so each new token only attends to the cache
- **The arithmetic intensity gap**: prefill is compute-bound; decode is memory-bound
- **Batching strategies**: static batching (uniform sequences), dynamic batching, **continuous batching** (the modern default)
- **Flash Attention** (Dao 2022, FlashAttention-2 2023): memory-aware attention with online softmax
- **Speculative decoding** (Leviathan 2023; Chen 2023): use a small draft model to propose tokens; verify with the big model in parallel
- **PagedAttention** (vLLM, Kwon 2023): manage KV cache memory in pages like an OS
- **Modern inference stacks**: vLLM, TGI, SGLang, TensorRT-LLM — what they offer
- **Throughput vs latency tradeoffs**: when batching helps vs hurts

**Suggested chapter structure** (8 sections):

1. The inference cost problem (~400 words)
2. Prefill vs decode — two phases (~500 words)
3. KV cache — the central optimization (~700 words — main concept)
4. Batching strategies (~500 words)
5. Flash Attention (~500 words)
6. Speculative decoding (~600 words — important second optimization)
7. PagedAttention and modern stacks (~400 words)
8. The full inference picture (~400 words)

Target: ~4000 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Vaswani et al. 2017 — "Attention Is All You Need"
- **arXiv:** [1706.03762](https://arxiv.org/abs/1706.03762)
- **Relevance for this chapter:** original transformer paper; the KV cache is implicit in the attention mechanism (each token attends to all previous tokens' keys and values).

### Dao et al. 2022 — "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness"
- **arXiv:** [2205.14135](https://arxiv.org/abs/2205.14135)
- **What it contributed:** **FlashAttention** — a memory-aware attention kernel that uses online softmax to avoid materializing the full attention matrix. Reduces memory complexity from $O(N^2)$ to $O(N)$ for the softmax intermediate. Dramatic speedups (~2-4×) and longer-context support.
- **For the chapter:** central reference for section 5.

### Dao 2023 — "FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning"
- **arXiv:** [2307.08691](https://arxiv.org/abs/2307.08691)
- **What it contributed:** **FlashAttention-2** — refined version with better parallelism and tighter loop ordering. 2× speedup over FlashAttention-1 in many cases.
- **For the chapter:** brief mention as the v2 successor.

### Leviathan, Kalman & Matias 2023 — "Fast Inference from Transformers via Speculative Decoding"
- **arXiv:** [2211.17192](https://arxiv.org/abs/2211.17192)
- **What it contributed:** **Speculative decoding** — use a small draft model to propose $k$ tokens at a time; verify with the big model in a single forward pass. Speedups of 2-3× for typical configurations.
- **For the chapter:** central reference for section 6.

### Chen et al. 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"
- **arXiv:** [2302.01318](https://arxiv.org/abs/2302.01318)
- **What it contributed:** **Speculative sampling** — DeepMind's variant of speculative decoding with a sampling-friendly verification scheme. Lossless: the sampling distribution of the big model is preserved.
- **For the chapter:** section 6 paired reference.

### Kwon et al. 2023 — "Efficient Memory Management for Large Language Model Serving with PagedAttention"
- **arXiv:** [2309.06180](https://arxiv.org/abs/2309.06180)
- **What it contributed:** **PagedAttention** + **vLLM** — manage KV cache memory in pages of fixed size, like an OS virtual memory system. Eliminates fragmentation; enables 2-4× higher throughput on the same hardware.
- **For the chapter:** central reference for section 7.

### Yu et al. 2022 — "Orca: A Distributed Serving System for Transformer-Based Generative Models"
- **OSDI 2022:** [Orca paper](https://www.usenix.org/conference/osdi22/presentation/yu)
- **What it contributed:** **Continuous batching** — instead of batching requests with the same sequence length, dynamically add/remove requests from the batch at each decode step. Higher GPU utilization for variable-length workloads.
- **For the chapter:** central reference for section 4 batching strategies.

### Xiao et al. 2024 — "StreamingLLM: Efficient Streaming Language Models with Attention Sinks"
- **arXiv:** [2309.17453](https://arxiv.org/abs/2309.17453)
- **What it contributed:** **Attention sinks** — when streaming inference for very long contexts, keep a few initial tokens in the KV cache permanently. Critical for sliding-window inference.
- **For the chapter:** brief mention in the long-context discussion.

---

## Core concepts

### Concept 1: The two phases of inference

A transformer generating text goes through **two phases**:

**Prefill** (also called "encoding" the prompt):
- The model processes the entire prompt at once
- All prompt tokens are passed through the model in a single forward pass
- The model computes keys, values, and an output token for each position
- This phase is **compute-bound**: lots of matmuls, high arithmetic intensity, full GPU utilization
- Cost scales with prompt length: $O(N^2)$ for attention; $O(N)$ for everything else

**Decode** (also called "generation" or "autoregressive sampling"):
- After prefill, the model emits tokens one at a time
- Each new token requires a forward pass
- But only the new token's query needs to be computed — the keys and values for all previous tokens are already in the **KV cache**
- This phase is **memory-bound**: small matmuls, lots of memory reads, GPU underutilized
- Cost per token is roughly constant (after KV cache amortizes the historical work)

**Why this matters**: prefill and decode have **fundamentally different performance characteristics**. Prefill batches well (sequences of different lengths can share the GPU); decode benefits more from speculative methods.

```
Time
  ├─ PREFILL ─┤├──── DECODE ────...
  
  Compute     ║▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
  intensity   ║░ ░ ░ ░ ░ ░ ░ ░ ░
  
  compute-bound      memory-bound
```

### Concept 2: KV cache — the central optimization

**The naive approach**: re-process all previous tokens for each new token. For each decode step at position $N+1$:
- Compute Q, K, V for *all* $N+1$ tokens
- Compute attention over $N+1$ tokens
- Total cost: $O((N+1)^2)$ per token

**With KV cache**: store the keys and values from previous tokens. For each decode step:
- Compute Q, K, V for *only* the new token
- Append K, V to the cache
- Compute attention between Q (for new token) and the full K, V cache
- Total cost: $O(N+1)$ per token

**The savings are enormous.** For a sequence of length 1024:
- Without cache: $\sum_{i=1}^{1024} i^2 \approx 3.6 \times 10^8$ FLOPs equivalent
- With cache: $\sum_{i=1}^{1024} i \approx 5.2 \times 10^5$
- **~700× reduction.**

**What the cache stores**: for each layer, the keys and values for every previous position. Shape: `(layers, 2, batch, heads, seqlen, head_dim)`. The `2` is K and V.

**Memory cost**: for a 7B model with 32 layers, 32 heads, head_dim=128:
- Per token, per layer, per head: $2 \times 128 = 256$ floats
- Per token, full model: $32 \text{ layers} \times 32 \text{ heads} \times 256 = 262{,}144$ floats $= 524 \text{ KB}$ in BF16
- For 4K context: $524 \text{ KB} \times 4096 = 2 \text{ GB}$ per sequence

**The KV cache dominates memory at inference time.** A 7B model is ~14 GB weights + 2 GB KV cache per concurrent sequence = ~14 + (batch × 2) GB.

```mdx
<Equation label="17.kv-cache">
$$\text{KV cache size} = 2 \times L \times H \times d_{\text{head}} \times N \times \text{batch}$$
</Equation>
```
where $L$ = layers, $H$ = heads, $d_{\text{head}}$ = head dim, $N$ = seq length.

### Concept 3: Arithmetic intensity and the memory wall

**Arithmetic intensity** = FLOPs / bytes loaded. High intensity = compute-bound; low intensity = memory-bound.

**Prefill**: arithmetic intensity is high. Each matmul $W \cdot X$ where $X$ has many tokens reuses the weights heavily. Compute-bound; GPU is happy.

**Decode**: arithmetic intensity is *low*. Each matmul has $X$ with just 1 token. Same weights loaded; far fewer FLOPs done. The GPU spends most of its time loading weights from HBM. **Memory-bandwidth-bound.**

**Why this matters**: techniques that help prefill (larger matrices, better kernel fusion) don't necessarily help decode. Decode-side optimizations focus on *reducing memory accesses* — Flash Attention, KV cache layout, speculative decoding (which amortizes the weight loading across $k$ tokens).

### Concept 4: Batching strategies

**Static batching**: pad all sequences to the same length; run them as a batch. Simple but wasteful — short sequences waste compute on padding.

**Dynamic batching**: group sequences by similar length; serve different lengths in different batches. Better utilization but added latency (wait for a batch to fill).

**Continuous batching** (Orca, Yu et al. 2022): the modern default.
- **Add/remove sequences from the batch at each decode step**
- When a sequence finishes (EOS), its slot becomes available for a new request
- When a new request arrives, it joins the batch immediately
- **Maximum GPU utilization with minimum latency**

Continuous batching is what makes vLLM, TGI, and SGLang competitive — they all use variants of it.

**The throughput vs latency tradeoff**:
- **Higher batch size**: more requests per GPU pass; throughput up; per-request latency up (waiting for batch to fill)
- **Lower batch size**: lower latency per request; throughput down
- **Continuous batching**: best of both — fills the batch when possible without forcing waits

### Concept 5: Flash Attention

**The problem**: naive attention computes $A = QK^T$ as a full $(N \times N)$ matrix. For $N = 8192$, that's 67M entries — 268 MB in BF16. **Materializing this matrix in GPU memory is wasteful**: it's just an intermediate; only the output of softmax-times-V is needed.

**Flash Attention** (Dao 2022) uses **tiling and online softmax**:
- Process attention in **tiles** of size $B_q \times B_k$ that fit in fast on-chip SRAM
- Compute partial softmax updates incrementally as tiles are processed
- Never materialize the full attention matrix

**Result**: memory cost drops from $O(N^2)$ to $O(N)$ for the intermediate. **Wall-clock speedups of 2-4×** vs naive attention because of reduced memory traffic.

**FlashAttention-2** (Dao 2023) refines parallelism: better work partitioning across thread blocks; tighter loops. Another 2× speedup over FA-1.

**Modern frameworks** (PyTorch SDPA, xFormers, vLLM) use FlashAttention by default. **You almost certainly don't run "naive" attention in production** — even though most textbook explanations describe naive attention.

### Concept 6: Speculative decoding

**The problem with decode**: it's memory-bound. The GPU spends most of its time loading weights, doing very few FLOPs. **Lots of unused compute capacity.**

**Speculative decoding** (Leviathan 2023; Chen 2023): use a small "draft" model to propose $k$ candidate tokens. Then run the big model **once** to verify all $k$ in parallel.

**The recipe:**
1. Draft model generates $k$ tokens (cheap, fast)
2. Big model runs *one forward pass* with all $k$ candidates as input
3. For each position $i$ from 1 to $k$:
   - If big model's distribution agrees with draft's token at position $i$: accept
   - Otherwise: reject and replace with big model's choice; stop

**Why it speeds up**:
- The big model's forward pass with $k$ tokens isn't much slower than with 1 token (it's the same matmuls, just with a slightly larger sequence dimension)
- Each accepted draft token saves a full big-model forward pass

**Acceptance rate matters**: if the draft model rarely agrees, you do extra work for no speedup. Typical acceptance rates: 60-80% for a well-chosen draft model.

**Lossless variant** (Chen 2023): rejection-sampling correction preserves the big model's sampling distribution exactly. **Speculative decoding is mathematically equivalent to standard decoding** — just faster.

**Typical speedups**: 2-3× for decoding with a draft model 30-100× smaller than the big model.

```mdx
<Equation label="17.speculative-speedup">
$$\text{Speedup} = \frac{k \cdot \alpha}{1 + (\text{draft cost} / \text{big cost})} + \text{overhead}$$
</Equation>
```
where $k$ = draft length, $\alpha$ = acceptance rate. With $k = 5$, $\alpha = 0.7$, draft 50× smaller: speedup ≈ 2.5-3×.

### Concept 7: PagedAttention and vLLM

**The KV cache fragmentation problem**: naive KV cache allocation reserves a contiguous block per sequence. When sequences vary in length and finish at different times, you get **memory fragmentation** — like RAM fragmentation in old operating systems.

**PagedAttention** (Kwon 2023, vLLM): manage the KV cache in **fixed-size pages** (typically 16 tokens each). A sequence's KV cache is a list of pages, not necessarily contiguous in memory.

**Why this helps**:
- **No fragmentation**: pages are interchangeable; finished sequences free up exact-sized chunks
- **Shared prefixes**: multiple sequences sharing a common prefix can share KV cache pages (copy-on-write)
- **Higher utilization**: a 24 GB GPU can serve more concurrent sequences

**vLLM**: the open-source serving system that introduced PagedAttention. Now widely used in production.

**Other modern stacks** (briefly):
- **TGI** (Hugging Face Text Generation Inference): production-focused, multi-LoRA support
- **SGLang**: programming-language abstraction for LLM workflows
- **TensorRT-LLM** (NVIDIA): aggressive kernel-level optimization
- **Together API, Anthropic API, OpenAI API**: opaque inference; you don't see the optimizations directly

### Concept 8: The full inference picture

A modern production inference stack combines:
1. **Distilled or quantized model** (Ch 16, Ch 18) — smaller, cheaper compute
2. **KV cache** with **PagedAttention** — efficient memory
3. **Continuous batching** — high GPU utilization
4. **Flash Attention** — fast attention kernels
5. **Speculative decoding** — amortize big-model passes
6. **Custom sampling logic** (Ch 19) — temperature, top-p, etc.

**Combined effect**: a "naive" 70B model serving setup might do 50 tok/sec on a single A100. A production stack with all the above does 200-500 tok/sec on the same hardware. **5-10× speedup just from inference optimizations.**

---

## Glossary

- **Prefill**: processing the prompt; first forward pass.
- **Decode**: autoregressive generation; one forward pass per token.
- **KV cache**: stored keys and values from past tokens; avoids recomputation.
- **Arithmetic intensity**: FLOPs per byte of memory loaded.
- **Memory-bound**: bottlenecked by memory bandwidth, not compute (decode is memory-bound).
- **Compute-bound**: bottlenecked by arithmetic operations (prefill is compute-bound).
- **Static batching**: pad sequences to uniform length.
- **Dynamic batching**: group by similar length.
- **Continuous batching**: add/remove sequences at each decode step (Orca, vLLM).
- **Flash Attention**: memory-aware attention with online softmax (Dao 2022).
- **Speculative decoding**: small draft proposes, big model verifies (Leviathan 2023).
- **Acceptance rate**: fraction of draft tokens kept in speculative decoding.
- **PagedAttention**: KV cache in fixed-size pages (Kwon 2023, vLLM).
- **vLLM, TGI, SGLang, TensorRT-LLM**: modern inference stacks.
- **TTFT (Time To First Token)**: latency from request to first output token (dominated by prefill).
- **TPOT (Time Per Output Token)**: latency per generated token (dominated by decode).
- **Attention sinks**: keeping initial tokens in KV cache for streaming (Xiao 2024).

---

## Pedagogical analogies

### 1. Prefill as "reading the question"; decode as "writing the answer"
A student reading a long exam question can scan the entire prompt in one pass — fast, parallel, uses lots of brain capacity. Then they write the answer one word at a time, looking back at their notes for each word — slower, sequential, mostly waiting for their hand to catch up. **Prefill is the scan; decode is the writing.** Different bottlenecks; different optimizations.

Best used for: section 2 prefill vs decode.

### 2. KV cache as "remembering what you've already said"
Without the KV cache, every time you generate a new token, you'd reread your entire conversation from the start to figure out what to say next. **The KV cache is the model's working memory** — the snapshot of "what's been said and how it's been processed" that lets the next token's generation be local rather than global.

Best used for: section 3 KV cache.

### 3. Speculative decoding as "guess and verify"
A skilled translator can sometimes guess what an author is about to say before reading the full sentence — and check by reading the next few words. If the guess matches, the translator saves time. **Speculative decoding is the same idea**: a fast "guesser" (small draft model) proposes tokens; the slow "verifier" (big model) checks them in parallel. When guesses are good, you save a lot.

Best used for: section 6 speculative decoding.

### 4. Continuous batching as "express checkout that always fills"
A grocery store with one cashier and a fixed-size line waits for the line to be full before processing — wasteful when fewer customers are present. **Continuous batching is like a checkout that always processes whoever's there**, dynamically adjusting throughput as customers come and go.

Best used for: section 4 batching.

### 5. Flash Attention as "tiling the calculation to fit cache"
You're multiplying two huge matrices. The intermediate result doesn't fit in your fast cache. Solution: tile the work into chunks that *do* fit; compute one chunk at a time; combine results. **Flash Attention does this for the softmax in attention.** The "online softmax" is a math trick that lets partial softmax results combine correctly.

Best used for: section 5 Flash Attention.

---

## Common misconceptions

### MC1: "KV cache is optional — just an optimization."
**Reality:** false in practice. **Without the KV cache, inference is ~700× slower** for a sequence of 1024 tokens. Every modern inference stack uses it. The cost in memory ($O(N)$ per layer per sequence) is the **central memory consideration** at inference time.

### MC2: "Larger batches always increase throughput."
**Reality:** true up to a point. **The sweet spot depends on memory and arithmetic intensity.** For decode (memory-bound), increasing batch size helps because the same weights are reused for more requests. For prefill (compute-bound), batch size has diminishing returns. **Each model + GPU has an optimal batch size.**

### MC3: "Speculative decoding always speeds up inference."
**Reality:** false. **Speedup depends on the draft model's acceptance rate.** If the draft rarely matches the big model's outputs, you spend extra time on draft inference *and* still need the big model's pass — net slowdown. **Acceptance rate must be high (typically >60%) for speculative decoding to win.**

### MC4: "Flash Attention is just a faster kernel."
**Reality:** it's more — Flash Attention **changes what's feasible**. By dropping memory complexity from $O(N^2)$ to $O(N)$ for the softmax intermediate, it enables long-context inference that wouldn't fit otherwise. 32K, 128K, 1M context windows depend on Flash Attention or similar techniques.

### MC5: "Inference is just running the model forward."
**Reality:** **inference is a serving system.** Forward pass is the computation; serving adds scheduling, batching, memory management, request prioritization, and streaming output. The serving system can be more impactful than the model architecture for total throughput.

### MC6: "PagedAttention is just a memory layout trick."
**Reality:** PagedAttention enables **2-4× throughput gains** on the same hardware. It's not just a layout change — it's the foundation for sharing KV cache across requests, supporting much higher concurrency, and dynamically adjusting memory allocation.

### MC7: "Prefill and decode have similar performance."
**Reality:** **very different.** Prefill: compute-bound, high arithmetic intensity, batches well by sequence count. Decode: memory-bound, low arithmetic intensity, batches well only when many requests run simultaneously. **Different bottlenecks; different optimizations.**

### MC8: "Inference optimization is only about latency."
**Reality:** **throughput matters more for cost.** A serving system optimized for low latency may serve few requests per GPU; one optimized for throughput serves many. **Production teams tune for cost per million tokens**, which is a throughput metric. Latency is the user-facing constraint; throughput is the cost driver.

---

## Tricky implementation details

### TID1: KV cache memory layout
The KV cache shape is typically `(batch, seq, heads, head_dim) × 2 (for K and V) × layers`. Different layouts perform differently on different hardware. **Common pattern**: `(batch, heads, seq, head_dim)` for K and V separately. PagedAttention uses a more complex page-table-style layout.

### TID2: Prefill vs decode kernel differences
Many frameworks (vLLM, TGI) use **different kernels for prefill and decode**. Prefill uses dense attention (Flash Attention); decode uses cache-aware attention. The transition happens at the boundary between processing the prompt and generating the first token.

### TID3: Continuous batching with variable prefill lengths
When requests of different prompt lengths arrive, scheduling becomes tricky. Modern stacks may **split prefill** across multiple steps (chunked prefill) to interleave with decode steps for other requests. Trade off TTFT vs throughput.

### TID4: Speculative decoding draft model choice
The draft model should be:
- Small enough to be much faster than the big model (typical: 30-100× smaller)
- **Aligned enough** with the big model to have high acceptance rate
- Often: a separately-distilled small model trained to imitate the big one. Microsoft's Medusa, Together's EAGLE — recent variants.

### TID5: PagedAttention page size
The page size in vLLM (default 16 tokens) trades off:
- **Larger pages**: less metadata overhead; less granularity for prefix sharing
- **Smaller pages**: more metadata; finer-grained sharing
- 16 is the empirically chosen sweet spot for most workloads

### TID6: Attention sinks for streaming
**Streaming inference** for very long contexts (Xiao 2024): instead of growing the KV cache forever, use a sliding window — but **also keep the first few tokens** permanently. Why: the model learned to "dump" certain attention patterns into the first tokens; removing them breaks attention. The "attention sink" trick keeps the model stable for long-running streams.

### TID7: Quantized KV cache
The KV cache is a large memory consumer. **Quantizing the KV cache to INT8 or INT4** halves or quarters this cost. Mostly lossless because cache entries are individually noisy and the model is robust to small perturbations. **Ch 18 covers quantization in detail.**

### TID8: Multi-LoRA serving with PagedAttention
Modern inference stacks (vLLM, TGI) support **multiple LoRA adapters** on a single base model — the base is shared; only the LoRA weights are swapped per request. Combined with continuous batching, you can serve many specialized models from one base. **This is the modern LoRA serving pattern.**

---

## Reference implementations

### Naive vs cached decoding (conceptual)

```python
import numpy as np

# Mock model: a "weight matrix" represents the transformer block
np.random.seed(0)
d_model = 256
n_layers = 4
W = [np.random.normal(0, 0.02, (d_model, d_model)) for _ in range(n_layers)]

def naive_attention(tokens, weights):
    """Pseudo: process all tokens through all layers (no KV cache)."""
    # Each layer recomputes K, V for ALL previous tokens
    x = tokens   # (seq, d_model)
    for w in weights:
        # In real attention: Q, K, V from x; softmax(QK^T)V
        # Here we just simulate the cost: O(seq^2) per layer
        x = np.tanh(x @ w + (x @ w.T) @ x / x.shape[0])
    return x

def cached_decode_one_step(new_token, kv_cache, weights):
    """Pseudo: process only the new token; reuse cached K, V."""
    # Each layer's Q, K, V for the new token only; attention over the cache
    # Cost: O(N) per layer where N is the current seq length
    x = new_token.reshape(1, -1)   # (1, d_model)
    for layer_idx, w in enumerate(weights):
        # Append new K, V to cache (simulated)
        kv_cache[layer_idx].append(x @ w)
        # Attend over the full cache
        keys = np.stack(kv_cache[layer_idx], axis=0)
        x = np.tanh(x @ w + (x @ keys.T) @ keys / len(kv_cache[layer_idx]))
    return x

# Compare: prefill 100 tokens; then decode 50 tokens
prompt = np.random.normal(0, 1, (100, d_model))

import time

# Naive: every token reprocesses everything
print("Naive decoding (no KV cache):")
naive_start = time.time()
running = prompt
for i in range(50):
    new_token = np.random.normal(0, 1, (1, d_model))
    running = np.concatenate([running, new_token], axis=0)
    _ = naive_attention(running, W)
naive_time = time.time() - naive_start
print(f"  Time: {naive_time*1000:.0f} ms")

# Cached: each new token only attends to cache
print("\\nCached decoding (with KV cache):")
kv_cache = [[] for _ in range(n_layers)]
# Prefill (mock): just initialize cache
for tok in prompt:
    cached_decode_one_step(tok, kv_cache, W)
# Decode with cache
cached_start = time.time()
for i in range(50):
    new_token = np.random.normal(0, 1, (d_model,))
    cached_decode_one_step(new_token, kv_cache, W)
cached_time = time.time() - cached_start
print(f"  Time (decode only): {cached_time*1000:.0f} ms")

print(f"\\nKV cache speedup: {naive_time/cached_time:.1f}×")
print("In production: KV cache speedup is even larger because real attention is O(N^2) per layer.")
```

### KV cache memory estimation

```python
def kv_cache_size_gb(seq_len, n_layers, n_heads, head_dim, batch=1, dtype_bytes=2):
    """
    Compute KV cache memory in GB.
    
    Formula: 2 * layers * heads * head_dim * seq_len * batch * dtype_bytes
    The 2 is for K and V.
    """
    bytes_total = 2 * n_layers * n_heads * head_dim * seq_len * batch * dtype_bytes
    return bytes_total / 1e9

# Common model sizes
MODELS = {
    "Llama-7B":  {"layers": 32, "heads": 32, "head_dim": 128},
    "Llama-13B": {"layers": 40, "heads": 40, "head_dim": 128},
    "Llama-70B": {"layers": 80, "heads": 64, "head_dim": 128},
}

contexts = [1024, 4096, 32768, 131072]

print(f"{'Model':<12} | {'1K':>8} {'4K':>8} {'32K':>8} {'128K':>8}")
print("-" * 60)
for model, spec in MODELS.items():
    sizes = [kv_cache_size_gb(c, spec["layers"], spec["heads"], spec["head_dim"]) for c in contexts]
    row = f"{model:<12} | " + ' '.join(f'{s:>5.2f} GB' for s in sizes)
    print(row)

print("\\nFor Llama-70B at 128K context, KV cache alone is ~22 GB per sequence.")
print("This is why long-context serving is expensive — memory dominates.")
print("\\nMitigations: quantize KV cache (INT8 halves; INT4 quarters); PagedAttention (sharing).")
```

### Speculative decoding speedup calculator

```python
def speculative_speedup(k, alpha, draft_relative_cost=0.02, overhead=0.05):
    """
    Estimate speculative decoding speedup.
    
    k: number of tokens proposed per round
    alpha: acceptance rate (fraction of draft tokens accepted)
    draft_relative_cost: draft inference cost / big inference cost
    overhead: framework overhead per round
    """
    # Expected tokens accepted per round (geometric-like)
    expected_accepted = (1 - alpha**(k+1)) / (1 - alpha) - 1 if alpha < 1 else k
    
    # Cost: 1 big-model pass + k draft passes + overhead
    cost_per_round = 1 + k * draft_relative_cost + overhead
    
    # Tokens per round vs cost per round
    speedup = (1 + expected_accepted) / cost_per_round
    
    return expected_accepted, speedup

# Sweep over draft length and acceptance rate
print(f"{'k':>3} | " + ' '.join(f'α={a:.1f}' for a in [0.3, 0.5, 0.7, 0.9]))
print("-" * 50)
for k in [1, 3, 5, 7, 10]:
    speeds = []
    for alpha in [0.3, 0.5, 0.7, 0.9]:
        _, s = speculative_speedup(k, alpha)
        speeds.append(f'{s:.2f}x')
    print(f"k={k:>3} | " + ' '.join(s.rjust(6) for s in speeds))

print("\\nObservations:")
print("- At low acceptance (α=0.3), speedup is marginal at any k")
print("- At α=0.7-0.9, k=5-7 gives 2-3x speedup")
print("- Too-high k can hurt: draft cost accumulates, acceptance drops at long horizons")
```

---

## Connections to other chapters

- **Ch 4 (Attention)**: KV cache is enabled by attention's specific structure — Q, K, V are computed once per token; only Q changes during decode.
- **Ch 10 (Training infrastructure)**: same kernels (Flash Attention) are used for both training and inference. Same hardware constraints. Different access patterns.
- **Ch 16 (Distillation)**: distillation produces smaller models → inference is cheaper. **Combines with this chapter's optimizations** for multiplicative effect.
- **Ch 18 (Quantization)**: quantization reduces bits per parameter. **Combines with this chapter's optimizations.** Quantized weights + KV cache compression + speculative decoding = compounding speedups.
- **Ch 19 (Sampling)**: sampling decisions happen after the forward pass produces logits. Speculative decoding adds nuance because the verifier may reject the draft's sample.
- **Ch 27+ (Agents)**: agent loops do many forward passes per task. Inference cost adds up; serving optimization matters proportionally.

---

## Open questions for the chapter author

### Q1: How much arithmetic-intensity math?
**Recommendation:** moderate. State the prefill (compute-bound) vs decode (memory-bound) distinction; give one concrete example. Don't deep-dive into roofline modeling.

### Q2: Flash Attention depth?
**Recommendation:** brief — section 5 sketches the tile + online-softmax idea. **Don't try to derive the online softmax.** Mention FlashAttention-2 in passing.

### Q3: Speculative decoding depth?
**Recommendation:** prominent — section 6 walks through the algorithm and includes the speedup formula. **The chapter's second most important optimization after KV cache.** Cover the verification step carefully; mention lossless variant.

### Q4: PagedAttention depth?
**Recommendation:** medium — section 7 covers the page abstraction; mentions vLLM and other stacks. **Don't try to derive page-table logic.** Reader should understand the *what* and *why*, not the implementation details.

### Q5: Modern stacks coverage?
**Recommendation:** brief survey. vLLM, TGI, SGLang, TensorRT-LLM — one-line each. **Don't compare in detail** — the landscape evolves quickly and detailed comparisons would date the chapter.

### Q6: Widget candidates
1. **KV Cache Animation (marquee):** show the cache filling during prefill, then growing one slot at a time during decode. Animate the prefill→decode transition. Reader sees the two phases and the cache's role. **Recommended marquee.**
2. **Speculative Decoding Visualizer (secondary):** show the draft model proposing $k$ tokens; verifier accepting some, rejecting others; net throughput gain. Slider for $k$ and acceptance rate. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 17 is a **single-topic chapter** (inference optimization). Uses the **4-file cadence**.

Planned file layout:
- File 98: research (this)
- File 99: page structure (~600 lines, 8 sections; runnables embedded)
- File 100: KV Cache Animation marquee widget
- File 101: Speculative Decoding secondary widget + exercises + closeout (absorbs files 102-103)

**Pedagogical outcomes for the reader.** After Ch 17, the reader should be able to:
1. Distinguish prefill from decode and their performance characteristics
2. Explain the KV cache and its memory cost
3. Define memory-bound vs compute-bound and where each applies
4. Describe continuous batching and why it's the modern default
5. Explain Flash Attention at a conceptual level
6. Compute the speculative decoding speedup formula
7. Describe PagedAttention's role in vLLM
8. Name the modern inference stacks and their roles

Eight outcomes. Exercises hit outcomes 2 (KV cache implementation/sizing), 6 (speculative speedup), 7 (memory calculations).

**Tonal framing**: practical engineering, like Ch 7 (data engineering), Ch 10 (training infrastructure), Ch 15 (PEFT). **Concrete numbers**: KV cache sizes in GB; throughput in tokens/sec; speedup factors. **Honest tradeoffs**: throughput vs latency; batch size sweet spots; draft model selection challenges.

**Part VI opening**: Ch 17 opens Part VI. Where Part V (Ch 13-16) covered training methods, Part VI covers serving. The reader should feel a clear shift: **same models, different concerns**. Ch 17 is the foundation; Ch 18 (quantization) and Ch 19 (sampling) build on it.

**Importance**: production serving cost is *enormous* — well-optimized inference can be 5-10× cheaper than naive. **Most engineers will encounter inference optimization at some point**; this chapter is their on-ramp.
