# Session 77 — Chapter 17 page structure

> First chapter session for Chapter 17 ("Inference Optimization"). **The chapter that opens Phase 12.** Where Ch 13-16 covered post-training methods, Ch 17 covers what makes those models *deployable*: KV cache, prefill vs decode, continuous batching, Flash Attention, speculative decoding, PagedAttention. **Practical engineering chapter** — concrete numbers, real operational concerns, honest tradeoffs. Single-topic chapter; uses the **4-file cadence**.

---

## Read first (in this order)

1. **`research/ch17-inference-optimization/research.md`** — the source material. Every section, derivation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch10-training-infrastructure/session-45-page-structure.md`** — for the practical-engineering voice (Ch 10 is the closest precedent — training infrastructure is the training-side analog of this chapter)
4. **`prompts/chapters/ch15-peft/session-67-page-structure.md`** — for the Phase 11 practical-engineering voice template

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 17 page. By end of session:

- `src/pages/ch17-inference-optimization/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch17-inference-optimization/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 17's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch17-inference-optimization/` with sidebar showing Ch 17 active, prev/next nav linking to Ch 16 (active) and Ch 18 (disabled)

**Tonal note:** Ch 17 is **practical engineering** — like Ch 7 (data engineering), Ch 10 (training infrastructure), and Ch 15 (PEFT). Concrete numbers (KV cache GB, tokens/sec, speedup factors); real operational considerations (continuous batching, draft model choice); honest tradeoffs (latency vs throughput, batch size sweet spots). **Don't oversell elegance** — these optimizations are valuable because they save real money at scale, not because they're conceptually beautiful.

**Phase 12 opening context:** this chapter opens Phase 12 (Inference). Where Phase 11 ended with the trained model, Phase 12 covers serving. The reader should feel the shift: **same model, different concerns**. Ch 17 is the foundation; Ch 18 (quantization) and Ch 19 (sampling) build on it.

**Chapter cadence:** Ch 17 uses the **4-file cadence** (single-topic).

---

## Inputs

State of the repo after session 75 (Ch 16 complete, Phase 11 complete):

- Ch 1-16 all `'published'`
- `research/ch17-inference-optimization/research.md` exists
- `src/lib/chapters.ts` has Ch 1-16 `'published'`, Ch 17-30 `'planned'`
- No `src/pages/ch17-inference-optimization/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch17-inference-optimization/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch17-inference-optimization/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 17's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch17-inference-optimization
description: Inference optimization — how to serve trained LLMs efficiently at scale. This chapter is the foundation of Phase 12. KV cache is the central optimization (~700× speedup vs naive); prefill (compute-bound) and decode (memory-bound) are fundamentally different phases with different bottlenecks; continuous batching is the modern default for high GPU utilization; Flash Attention enables long context; speculative decoding (Leviathan 2023) amortizes the big model's forward pass; PagedAttention (vLLM) manages KV cache memory like an OS. The chapter that opens the serving arc.
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

> Phase 11 left you with a trained model. Phase 12 covers what happens next: how do you *serve* it? A trained transformer is mathematically just a forward pass — but serving one efficiently at scale is an entire engineering domain. Naive inference is shockingly inefficient: rerunning every layer for every generated token; padding sequences to the same length; materializing huge attention matrices that the GPU then mostly discards. **Production inference does none of this.**
>
> This chapter covers the foundational optimizations that distinguish production serving from naive implementations. **KV cache** — the central optimization, an ~700× speedup over naive decoding. **Prefill vs decode** — two phases of inference with completely different performance characteristics. **Continuous batching** — Orca's idea (Yu et al. 2022) that lets the batch size adapt dynamically. **Flash Attention** — Dao 2022's memory-aware attention that enables long contexts. **Speculative decoding** — Leviathan 2023's draft + verify approach. **PagedAttention** — vLLM's OS-style memory management.
>
> The goal isn't to make you implement a vLLM clone. It's to give you the mental model: what's expensive, what's cheap, where the bottlenecks are, and what optimizations attack which bottleneck. With this foundation, the next two chapters (quantization, sampling) build naturally — and the modern serving stacks (vLLM, TGI, SGLang) make sense as combinations of these primitives.

### Section 1: The inference cost problem

**Heading:** `## The inference cost problem`
**Word target:** ~400
**Sub-headings:** `### The naive baseline`, `### Why this matters`

**Teaching beats:**

**The naive baseline:**
1. **Naive inference**: for each generated token, re-process all previous tokens through every layer. Cost: $O(N^2)$ per token in attention; total $O(N^3)$ to generate $N$ tokens.
2. **For 1024-token output**: ~$10^9$ FLOP-equivalents worth of redundant computation.
3. **Throughput** without optimizations: ~5-10 tokens/sec on an A100 for a 7B model.

**Why this matters:**
4. **Production throughput** with full optimization stack: 200-500 tokens/sec on the same hardware.
5. **5-50× difference** based purely on inference optimizations — not model architecture, not hardware.
6. **For a service handling 1B tokens/day**, this is the difference between 100 A100s and 5. **Operational money matters.**
7. The optimizations covered in this chapter are *standard* in production — every major inference stack (vLLM, TGI, SGLang, TensorRT-LLM) uses some combination of them.

**Required callout** — type `note`: This chapter is the *engineering* counterpart to Phase 11's training-method content. **Distillation (Ch 16) reduces parameter count; quantization (Ch 18) reduces bits per parameter; inference optimization (this chapter) reduces wasted computation.** All three combine multiplicatively. A production 70B serving stack might run 20× faster than a naive implementation just from these stacking.

**No code in this section.** Setup and motivation.

**Connection forward:** Section 2 introduces the two phases.

### Section 2: Prefill vs decode — two phases

**Heading:** `## Prefill vs decode — two phases`
**Word target:** ~500
**Sub-headings:** `### Prefill`, `### Decode`, `### Why this matters`

**Teaching beats:**

**Prefill:**
1. **Prefill** processes the entire prompt at once. All prompt tokens pass through the model in a single forward pass.
2. **Compute-bound**: lots of matmuls; high arithmetic intensity (FLOPs per byte loaded); GPU fully utilized.
3. **Cost scales with prompt length**: $O(N^2)$ for attention; $O(N)$ for everything else.
4. **TTFT** (Time To First Token) is dominated by prefill cost.

**Decode:**
5. **Decode** generates one token at a time. Each generation is a separate forward pass.
6. **Memory-bound**: small matmuls (just 1 new token); the GPU spends most of its time loading weights from HBM.
7. **Per-token cost is roughly constant** (after the KV cache amortizes historical work).
8. **TPOT** (Time Per Output Token) is dominated by decode cost.

**Why this matters:**
9. **Different bottlenecks → different optimizations**:
   - Prefill optimizations: larger matrices, kernel fusion (Flash Attention helps here)
   - Decode optimizations: reduce memory accesses (speculative decoding, KV cache layout, Flash Decoding)
10. **Latency vs throughput**: TTFT is the user-facing latency; TPOT determines streaming experience.

**Required callout** — type `aside`: A naive view treats inference as "running the model forward." But **the two phases have completely different characteristics.** Most papers and tutorials focus on the algorithmic forward pass; production engineers focus on the serving system that exploits the prefill/decode distinction. **This chapter is about the production engineer's perspective.**

**No code in this section.** Setup for KV cache.

**Connection forward:** Section 3 covers the central optimization — KV cache.

### Section 3: KV cache — the central optimization

**Heading:** `## KV cache — the central optimization`
**Word target:** ~700 — CENTRAL CONCEPT
**Sub-headings:** `### The redundancy`, `### What the cache stores`, `### The memory cost`

**Teaching beats:**

**The redundancy:**
1. **Without KV cache**: at decode step $i$, the model recomputes $K_1, V_1, K_2, V_2, \ldots, K_{i-1}, V_{i-1}$ even though they were computed at previous steps and haven't changed.
2. **With KV cache**: store the $K$ and $V$ values from previous tokens; only compute new ones for the new token.
3. **The savings**: per layer per token, cost drops from $O(N)$ matmul work (KV computation) to $O(1)$ matmul work (just for the new token). **Attention compute drops from $O(N^2)$ per step to $O(N)$.**

**What the cache stores:**
4. **Per layer, per attention head**: keys and values for every previous position.
5. **Cache shape**: `(layers, 2, batch, heads, seqlen, head_dim)`. The `2` is for K and V.
6. **At each decode step**:
   - Compute Q, K, V for the new token (1 position)
   - Append new K, V to cache
   - Compute attention between new Q and *full* K, V cache

**The memory cost:**
7. **Formula**:

```mdx
<Equation label="17.kv-cache">
$$\text{KV cache size} = 2 \times L \times H \times d_{\text{head}} \times N \times \text{batch}$$
</Equation>
```

where $L$ = layers, $H$ = heads, $d_{\text{head}}$ = head dim, $N$ = current sequence length, batch = batch size.

8. **For Llama-7B at 4K context**: $2 \times 32 \times 32 \times 128 \times 4096 = $ ~270 MB in BF16. Manageable.
9. **For Llama-70B at 128K context**: ~22 GB per sequence. **The KV cache dominates inference memory.**
10. **This is why long-context serving is expensive**: memory scales linearly with context length, and the model weights are fixed regardless.

**Required code** — `<RunnableCode>` with naive vs cached comparison:

```python
import numpy as np
import time

np.random.seed(0)
d_model = 256
n_layers = 4
W = [np.random.normal(0, 0.02, (d_model, d_model)) for _ in range(n_layers)]

def naive_decode_one_step(tokens, weights):
    """No KV cache — recompute everything for all tokens."""
    x = tokens                # (seq, d_model)
    for w in weights:
        # Recompute Q, K, V for ALL tokens; attention is O(seq^2) per layer
        x = np.tanh(x @ w + (x @ w.T) @ x / x.shape[0])
    return x

def cached_decode_one_step(new_token, kv_cache, weights):
    """With KV cache — process only the new token."""
    x = new_token.reshape(1, -1)
    for layer_idx, w in enumerate(weights):
        kv_cache[layer_idx].append(x @ w)
        keys = np.stack(kv_cache[layer_idx], axis=0)
        x = np.tanh(x @ w + (x @ keys.T) @ keys / len(kv_cache[layer_idx]))
    return x

# Setup: 100-token prompt, decode 50 more tokens
prompt = np.random.normal(0, 1, (100, d_model))

# Naive: every step recomputes everything
naive_start = time.time()
running = prompt
for _ in range(50):
    new = np.random.normal(0, 1, (1, d_model))
    running = np.concatenate([running, new], axis=0)
    _ = naive_decode_one_step(running, W)
naive_time = time.time() - naive_start

# Cached: only the new token at each step
kv_cache = [[] for _ in range(n_layers)]
for tok in prompt:
    cached_decode_one_step(tok, kv_cache, W)   # prefill
cached_start = time.time()
for _ in range(50):
    new = np.random.normal(0, 1, (d_model,))
    cached_decode_one_step(new, kv_cache, W)
cached_time = time.time() - cached_start

print(f"Naive decoding:  {naive_time*1000:.0f} ms")
print(f"Cached decoding: {cached_time*1000:.0f} ms")
print(f"Speedup: {naive_time/cached_time:.1f}×")
print(f"\\nIn production: the speedup is much larger because real attention is O(N^2) per layer.")
print(f"For 1024-token sequences, KV cache provides ~700× speedup vs naive.")
```

**Required widget placeholder** — KV Cache Animation (marquee, session 78):

```mdx
<WidgetFrame title="KV cache lifecycle" caption="Watch the KV cache fill during prefill (all prompt tokens processed at once), then grow one slot at a time during decode. The animation shows the transition from compute-bound prefill to memory-bound decode, with the cache size growing linearly. Hover any cache slot to see what's stored. The widget makes the central inference optimization visceral.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 78 (marquee)
  </div>
</WidgetFrame>
```

**Required callout** — type `warning`: MC1 from research.md. "KV cache is optional — just an optimization." False — **without KV cache, inference is ~700× slower** for a 1024-token sequence. Every modern inference stack uses it. The KV cache *is* inference, in practical terms. The cost: $O(N)$ per layer per sequence, in memory.

**Connection forward:** Section 4 covers how to handle multiple requests at once.

### Section 4: Batching strategies

**Heading:** `## Batching strategies`
**Word target:** ~500
**Sub-headings:** `### Static, dynamic, continuous`, `### The latency vs throughput tradeoff`

**Teaching beats:**

**Static, dynamic, continuous:**
1. **Static batching**: pad all sequences to the same length; run them as one batch. Simple but **wasteful** — short sequences waste compute on padding tokens.
2. **Dynamic batching**: group sequences by similar length; serve different lengths in different batches. Better utilization but adds **latency** (wait for batch to fill).
3. **Continuous batching** (Orca, Yu et al. 2022): **the modern default.** Add/remove sequences from the batch at each decode step:
   - When a sequence finishes (EOS), its slot becomes available
   - When a new request arrives, it joins the batch immediately
   - **Maximum utilization with minimum added latency**

**The latency vs throughput tradeoff:**
4. **Higher batch size**: more requests per GPU pass; **throughput up**; per-request latency up (waiting for batch to fill, more competition for memory).
5. **Lower batch size**: lower per-request latency; **throughput down** (GPU underutilized).
6. **Continuous batching**: best of both — fills the batch when possible without forcing waits.
7. **Practical sweet spot**: batch size 16-64 for 7B models on A100; varies with model size and hardware.

**Required callout** — type `note`: **Continuous batching is what makes vLLM, TGI, and SGLang competitive** with closed-source serving systems. Before continuous batching (pre-2022), serving systems either accepted poor GPU utilization or forced high latency. Orca's idea — interleave requests dynamically — opened the door.

**No code in this section.** Conceptual.

**Connection forward:** Section 5 covers the kernel-level optimization that makes attention fast.

### Section 5: Flash Attention

**Heading:** `## Flash Attention`
**Word target:** ~500
**Sub-headings:** `### The memory problem`, `### Tiling + online softmax`

**Teaching beats:**

**The memory problem:**
1. Naive attention computes the full $(N \times N)$ attention matrix as an intermediate. For $N = 8192$: 67M entries, 268 MB in BF16 just for the intermediate.
2. **The intermediate matrix is wasteful**: only the output of $\text{softmax}(QK^T) V$ matters, not the full $QK^T$.
3. **At long context, this matrix dominates memory bandwidth.** Most of the GPU's time is spent reading/writing the attention matrix to HBM.

**Tiling + online softmax:**
4. **Flash Attention** (Dao 2022): never materialize the full attention matrix.
5. **The trick**: process attention in tiles of size $B_q \times B_k$ that fit in fast on-chip SRAM. Compute partial softmax updates incrementally.
6. **The math**: "online softmax" — a way to update softmax results as more data arrives. Requires running statistics (max, sum) that allow correct combination.
7. **Result**: memory drops from $O(N^2)$ to $O(N)$ for the intermediate. **2-4× wall-clock speedup** because of reduced HBM traffic.

**Flash Attention 2** (Dao 2023): refines parallelism. Another 2× speedup over FA-1.

**Production reality:**
8. **PyTorch's SDPA**, vLLM, xFormers — all use Flash Attention by default. **"Naive" attention is what textbooks describe; production never runs it.**
9. **Flash Attention enables long context**: 32K, 128K, 1M context windows would be impractical without it.

**Required callout** — type `aside`: MC4 from research.md. "Flash Attention is just a faster kernel." It's more. **Flash Attention changes what's *feasible*.** By dropping memory complexity from $O(N^2)$ to $O(N)$, it enables long-context inference. Modern 1M-context models are only possible because of Flash Attention (or similar techniques like Ring Attention).

**No code in this section.** Conceptual sketch; deep-dive is out of scope.

**Connection forward:** Section 6 covers the second major optimization — speculative decoding.

### Section 6: Speculative decoding

**Heading:** `## Speculative decoding`
**Word target:** ~600 — IMPORTANT SECOND OPTIMIZATION
**Sub-headings:** `### The recipe`, `### Why it works`, `### The speedup formula`

**Teaching beats:**

**The recipe:**
1. **Problem with decode**: memory-bound. Lots of unused compute capacity per forward pass.
2. **Speculative decoding** (Leviathan 2023; Chen 2023): use a small "draft" model to propose $k$ tokens; verify all $k$ with the big model in *one forward pass*.
3. **The algorithm**:
   - Draft model generates $k$ candidate tokens (cheap, fast)
   - Big model runs one forward pass with all $k$ candidates as input
   - For each position $i = 1 \ldots k$:
     - If big model's distribution agrees with draft's choice: **accept**
     - Otherwise: **reject**, replace with big model's choice, stop
4. **Net effect**: amortize one big-model pass across multiple accepted tokens.

**Why it works:**
5. **Big model's forward pass with $k$ tokens isn't much slower than with 1 token**: same matmuls, slightly larger sequence dim. The marginal cost of adding tokens is small.
6. **Each accepted draft token = one full big-model forward pass saved.** When acceptance is high, big speedup.

**The speedup formula:**

```mdx
<Equation label="17.speculative-speedup">
$$\text{Speedup} = \frac{1 + \text{expected accepted tokens}}{1 + k \cdot (\text{draft cost / big cost}) + \text{overhead}}$$
</Equation>
```

7. **For acceptance rate $\alpha = 0.7$, $k = 5$, draft cost = 0.02× big cost**: ~2.5× speedup.
8. **Lossless variant** (Chen 2023): with rejection sampling, the resulting token distribution exactly matches what the big model alone would produce. **Speculative decoding ≠ approximation; it's an exact accelerator.**

**Required code** — `<RunnableCode>` with speedup calculator:

```python
def speculative_speedup(k, alpha, draft_relative_cost=0.02, overhead=0.05):
    """
    Estimate speculative decoding speedup.
    
    k: number of draft tokens proposed per round
    alpha: acceptance rate (fraction of draft tokens accepted)
    draft_relative_cost: draft inference cost / big inference cost
    overhead: framework overhead per round
    """
    # Expected accepted tokens per round
    if alpha < 1:
        expected_accepted = (1 - alpha**(k+1)) / (1 - alpha) - 1
    else:
        expected_accepted = k
    
    # Cost: 1 big pass + k draft passes + overhead
    cost_per_round = 1 + k * draft_relative_cost + overhead
    
    # Tokens per cost
    speedup = (1 + expected_accepted) / cost_per_round
    
    return expected_accepted, speedup

# Sweep over k and alpha
print(f"{'k':>3} | " + ' '.join(f'α={a:.1f}' for a in [0.3, 0.5, 0.7, 0.9]))
print("-" * 50)
for k in [1, 3, 5, 7, 10]:
    speeds = []
    for alpha in [0.3, 0.5, 0.7, 0.9]:
        _, s = speculative_speedup(k, alpha)
        speeds.append(f'{s:.2f}x')
    print(f"k={k:>3} | " + ' '.join(s.rjust(6) for s in speeds))

print("\\nObservations:")
print("- Low acceptance (α=0.3): marginal speedup at any k")
print("- High acceptance (α=0.7-0.9): k=5-7 gives 2-3x speedup")
print("- Too-high k can hurt: draft cost accumulates, acceptance drops over horizon")
```

**Required widget placeholder** — Speculative Decoding Visualizer (secondary, session 79):

```mdx
<WidgetFrame title="Speculative decoding" caption="The draft model proposes k candidate tokens. The big model verifies them in one parallel forward pass — accepting matching tokens, rejecting mismatches. Slider for k (draft length) and acceptance rate α. The widget shows the per-round token flow and computes the resulting speedup, making the 'draft + verify' pattern visceral.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 79 (secondary)
  </div>
</WidgetFrame>
```

**Required callout** — type `warning`: MC3 from research.md. "Speculative decoding always speeds up inference." False — **speedup depends on the draft model's acceptance rate.** If the draft rarely matches, you spend extra time on draft inference *and* still need the big model's pass. **Acceptance rate must be >60% for net speedup.** Choosing a draft model is itself a research problem; recent variants (Medusa, EAGLE) train the draft jointly with the big model for higher acceptance.

**Connection forward:** Section 7 covers memory management.

### Section 7: PagedAttention and modern stacks

**Heading:** `## PagedAttention and modern stacks`
**Word target:** ~400
**Sub-headings:** `### The fragmentation problem`, `### Pages, like an OS`, `### Modern inference stacks`

**Teaching beats:**

**The fragmentation problem:**
1. **Naive KV cache allocation**: reserve a contiguous block per sequence. Sequences finish at different lengths and times → memory fragmentation.
2. **Production reality**: serving 100+ concurrent sequences with variable lengths produces severe fragmentation.

**Pages, like an OS:**
3. **PagedAttention** (Kwon 2023, vLLM): manage KV cache in **fixed-size pages** (typically 16 tokens each). A sequence's KV cache = list of pages, not necessarily contiguous.
4. **Why this helps**:
   - **No fragmentation**: pages are interchangeable
   - **Shared prefixes**: multiple sequences sharing a common prompt can share KV cache pages (copy-on-write)
   - **Higher utilization**: 2-4× more concurrent sequences on the same GPU

**Modern inference stacks** (brief survey):
5. **vLLM**: open-source; introduced PagedAttention; widely used
6. **TGI** (Hugging Face Text Generation Inference): production-focused; multi-LoRA support; deep Hugging Face integration
7. **SGLang**: programming-language abstraction for complex LLM workflows
8. **TensorRT-LLM** (NVIDIA): aggressive kernel-level optimization; for NVIDIA-only deployments

**For most teams**: vLLM is the default open-source choice. Larger orgs use a combination of these or build custom stacks.

**Required callout** — type `aside`: MC6 from research.md. "PagedAttention is just a memory layout trick." It's more — **PagedAttention enables 2-4× throughput gains on the same hardware.** It's the foundation for sharing KV cache across requests, supporting much higher concurrency, and dynamically adjusting memory allocation. The OS analogy is genuinely apt: pages are interchangeable; the cache works like virtual memory.

**No code in this section.** Conceptual.

**Connection forward:** Section 8 wraps up.

### Section 8: The full inference picture

**Heading:** `## The full inference picture`
**Word target:** ~400
**Sub-headings:** `### The optimization stack`, `### What's next`

**Teaching beats:**

**The optimization stack:**
1. **A modern production inference stack combines**:
   - **Distilled or quantized model** (Ch 16, Ch 18) — smaller compute base
   - **KV cache** with **PagedAttention** — efficient memory
   - **Continuous batching** — high GPU utilization
   - **Flash Attention** — fast kernels
   - **Speculative decoding** — amortize big-model passes
   - **Custom sampling logic** (Ch 19) — temperature, top-p, constrained decoding
2. **Combined effect**: 5-10× throughput vs naive on the same hardware.
3. **For a 70B model on a single A100**: naive ~50 tok/sec; production stack 200-500 tok/sec.

**What's next:**
4. **Chapter 18**: quantization for inference. Where this chapter reduces *wasted computation*, quantization reduces *bits per parameter*. **Combines multiplicatively with this chapter's optimizations.**
5. **Chapter 19**: sampling algorithms. How decisions about which token to emit happen, given the logits.
6. **After Phase 12** (these three chapters), the back half of the curriculum opens: capabilities (Ch 20-23), safety (Ch 24-26), agents (Ch 27-30).

**Sample close** (rewrite in chapter voice):

> Inference optimization is what separates a research artifact from a production system. A trained model is a mathematical object; **serving it efficiently is engineering**. The optimizations covered in this chapter — KV cache, continuous batching, Flash Attention, speculative decoding, PagedAttention — are not optional. They're the difference between a 5-token-per-second toy and a 500-token-per-second production service on the same hardware.
>
> **Chapter 18** narrows the focus to a specific optimization: **quantization**. Where this chapter reduced wasted computation, Ch 18 reduces the bits used to represent the model itself — INT8, INT4, NF4, AWQ, GPTQ. Combined with this chapter's machinery, quantization gives another 2-4× throughput improvement. **Then Chapter 19** covers the sampling side: how the decoder actually picks tokens (top-k, top-p, temperature, beam search, constrained decoding). Together, these three chapters cover the full Phase 12 serving stack.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 17, slug: 'ch17-inference-optimization', title: 'Inference Optimization', partNum: 6, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch17-inference-optimization/index.astro && rm src/pages/ch17-inference-optimization/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch17-inference-optimization/`** renders with:
   - Chapter eyebrow ("Chapter 17") + h1 + description
   - 8 h2 sections in the order specified
   - **2 `<RunnableCode>` blocks** (sections 3 and 6) — note: only 2, not 3, because the third runnable was a memory-table demo in research that can be omitted from prose (page structure focuses on the most pedagogically critical code)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 6)
   - Labeled equations `<Equation label="17.kv-cache">` (section 3) and `<Equation label="17.speculative-speedup">` (section 6)
   - At least 5 callouts (the phase-opening note in section 1, the production-engineer aside in section 2, MC1 in section 3, the continuous-batching note in section 4, MC4 in section 5, MC3 in section 6, MC6 in section 7 — pick 5)
3. **Sidebar:** Ch 1-16 published; Ch 17 active (draft); Ch 18-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 17:** prev = Ch 16 (active); next = Ch 18 (disabled)
6. **TOC on Ch 17** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 3800 and 4500 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 78 and 79 own them.
- ❌ **Do not write exercises.** Session 79 owns.
- ❌ **Do not flip Ch 17's status to `'published'`.** Session 79 owns.
- ❌ **Do not derive online softmax.** Cite Dao 2022; sketch the tile + accumulate idea.
- ❌ **Do not derive rejection-sampling correctness for speculative decoding.** Mention it's lossless; cite Chen 2023.
- ❌ **Do not enumerate every inference stack.** Cover vLLM, TGI, SGLang, TensorRT-LLM. That's enough.
- ❌ **Do not cover quantization.** Ch 18 owns.
- ❌ **Do not cover sampling algorithms.** Ch 19 owns.
- ❌ **Do not modify Ch 1-16.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch17-inference-optimization/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch17-inference-optimization/index.astro 2>/dev/null || true
git commit -m "session 77: Ch 17 prose — inference optimization (opens Phase 12)"
git push origin main
```

---

## Notes for the session author

**On the practical-engineering voice:**
Ch 17 should feel like Ch 10 (training infrastructure) and Ch 15 (PEFT). **Concrete numbers, real operational considerations, honest tradeoffs.** The optimizations covered here are valuable because they save real money at scale — not because they're conceptually elegant. The voice should reflect this: grounded, numbers-heavy, occasionally pragmatic.

**On the prefill/decode distinction being the structural pivot:**
Section 2 introduces a *frame* that organizes the rest of the chapter. Prefill is compute-bound; decode is memory-bound. **All subsequent optimizations target one or the other.** When the reader encounters Flash Attention (section 5, helps prefill more) and speculative decoding (section 6, helps decode), they should see them through this frame. **The chapter benefits from this organizing principle.**

**On the KV cache being THE optimization:**
Section 3 is the chapter's most important section. KV cache is fundamental — every other optimization assumes its presence. Make sure the prose conveys: (a) what the cache stores (K and V for past tokens), (b) why it works (those values don't change for past tokens), (c) what it costs (memory linear in context), (d) why it dominates inference memory at long context.

**On Flash Attention being a sketch, not a derivation:**
Section 5 should be respectful of the technical depth (online softmax is genuinely nontrivial) but accessible. The reader should walk away knowing:
- Naive attention materializes the $(N \times N)$ matrix
- Flash Attention doesn't (tiles + online softmax)
- Result: $O(N^2) \to O(N)$ memory; 2-4× speedup
- Enables long context

That's enough. Don't try to teach the online softmax math.

**On speculative decoding being the second-most important optimization:**
After KV cache, speculative decoding is the optimization with the highest impact-to-complexity ratio. Section 6 covers the recipe carefully:
- Draft proposes $k$ tokens
- Big model verifies $k$ tokens in one pass
- Accept matches; reject mismatches
- Net: amortize big-model passes

The boxed equation `17.speculative-speedup` and the speedup table give readers a tool to reason about their own use case.

**On modern stacks being a brief survey:**
Section 7 lists vLLM, TGI, SGLang, TensorRT-LLM with one-line descriptions. **Don't compare them in detail** — the landscape evolves quickly. The reader needs to know these exist and which to reach for first (vLLM); not the latest benchmark comparison.

**On the widget placements:**
- **Marquee (KV Cache Animation)** in section 3: when the central optimization is introduced. Reader watches the cache fill during prefill and grow during decode.
- **Secondary (Speculative Decoding Visualizer)** in section 6: alongside the second-most-important optimization. Reader watches drafts proposed and verified.

**On the 2 runnable code blocks:**
- Section 3 (naive vs cached): reader sees the time savings concretely
- Section 6 (speculative speedup): reader computes their own speedup landscape

Note: research file had 3 reference implementations but page structure has only 2 runnables. The "KV cache memory estimation" code is omitted from prose because the boxed equation `17.kv-cache` plus a single example gives the same information without requiring a runnable.

**Pedagogical claim of the chapter:**
"Inference optimization is what makes deployed models cheap to serve. The KV cache eliminates redundant computation across decoding steps. Prefill and decode have fundamentally different bottlenecks (compute vs memory) and benefit from different optimizations. Continuous batching maximizes GPU utilization across variable-length requests. Flash Attention enables long context. Speculative decoding amortizes the big model's forward pass. PagedAttention manages KV cache memory like an OS. Combined: 5-10× throughput on the same hardware vs naive inference."

**Phase 12 opening tone:**
This chapter opens Phase 12. The reader should feel a clear shift from training (Phase 11) to serving (Phase 12). **Same models, different concerns.** The opening should acknowledge this shift; the close should preview Ch 18 (quantization) and Ch 19 (sampling) as the next layers.

Build with care.
