# Session 18 — Chapter 4 page structure

> First chapter session for Chapter 4 ("Attention"). The most important single chapter in the tutorial — scaled dot-product attention is the operation that defines the modern LLM architecture. Takes the research file and produces the full MDX page: 9 sections, ~5300 words of prose, all derivations rendered via KaTeX, two widget placeholders (sessions 19 and 20 fill them), and 3-4 runnable code blocks. Follows the 4-session chapter model established in Phase 4 and validated in Phases 5.

---

## Read first (in this order)

1. **`research/ch04-attention/research.md`** — the source material. Every derivation, equation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`context/CURRICULUM.md`** — for Ch 4's locked scope
4. **`context/DESIGN_SYSTEM.md`** — for Callout types, Equation/EqRef usage
5. **`prompts/chapters/ch03-tokenization/session-14-page-structure.md`** — for the page-structure template (Ch 3 used a 9-section chapter; Ch 4 also uses 9)
6. **`prompts/chapters/ch01-neural-net-primitives/session-07-page-structure.md`** — for math-rendering and derivation conventions (Ch 4 is math-heavy like Ch 1)

If anything contradicts the research file, the research file wins.

---

## Goal

Replace the placeholder `index.astro` (if present from scaffolding) with a full `index.mdx` Chapter 4 page. By end of session:

- `src/pages/ch04-attention/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch04-attention/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 4's status flipped from `'planned'` to `'draft'` (full `'published'` flip happens in session 20)
- The chapter renders at `/ch04-attention/` with sidebar showing Ch 4 active, prev/next nav linking to Ch 3 and Ch 5

**Difference from earlier chapters:** Ch 4 is the most math-dense chapter in the tutorial so far. Section 3 (the attention formula) and section 4 (the $\sqrt{d_k}$ argument) require careful equation typesetting and step-by-step derivations. Allocate prose budget accordingly — these two sections together are ~1500 words.

**4-session cadence note:** the original BUILD_ORDER planned 5 chapter sessions for Ch 4 (sessions 18-22). Per the cadence shift established in Phase 4's retrospective, this chapter consolidates into 3 chapter sessions:
- Session 18 (file 27): page structure — this file
- Session 19 (file 28): attention heatmap marquee widget
- Session 20 (file 29): causal mask widget + exercises + status flip (closeout)

Files 30 and 31 from the original plan are absorbed.

---

## Inputs

State of the repo after session 17 (Ch 3 complete):

- Ch 1, Ch 2, Ch 3 all `'published'` with full prose and widgets
- `research/ch04-attention/research.md` exists
- `src/lib/chapters.ts` has Ch 1-3 `'published'`, Ch 4-30 `'planned'`
- Widget directories `ch01/`, `ch02/`, `ch03/` exist; no `ch04/` yet

---

## Deliverables

1. **Create** `src/pages/ch04-attention/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch04-attention/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 4's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Chapter layout, components, scaffolding, Ch 1-3, and the widgets directories stay untouched.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch04-attention
description: Scaled dot-product attention — the operation that defines the modern LLM. How a sequence refines itself by having each position look at every other. Why dot product as similarity, why softmax, why the √d_k denominator. Causal masking for autoregressive generation, and the quadratic compute cost that motivates much of the rest of the tutorial.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

(Widget imports added in sessions 19 and 20.)

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 2-3 short paragraphs (~180 words) of opening.

**Sample opening** — rewrite in chapter voice but match the register:

> The transformer is mostly attention. The rest — embeddings, feedforward layers, normalizations, residuals — is supporting cast. Attention is what does the work of letting one position in a sequence look at every other position and decide what to take from each.
>
> The operation is one matrix equation that takes three inputs and produces one output. It runs in $O(n^2)$ in the sequence length and costs roughly half the FLOPs of a modern LLM forward pass. It explains, simultaneously, why transformers are so capable and why they are so expensive.
>
> This chapter derives the attention formula from first principles. By the end, the reader should be able to write scaled dot-product attention in numpy, justify the $\sqrt{d_k}$ denominator from a variance calculation, and explain why causal masking is added to the scores rather than to the outputs. Everything else in the tutorial — multi-head attention, the transformer block, scaling, RLHF, inference optimization, agentic systems — is downstream of this one operation.

### Section 1: The setup — why attention exists

**Heading:** `## The setup — why attention exists`
**Word target:** ~500

**Teaching beats:**
1. Before attention, sequence models used recurrence (RNNs, LSTMs) or convolution (TCNs). Both have structural limitations:
   - **RNN limitation:** information flows position-by-position through a hidden state of fixed size. Long-range dependencies get washed out; training is sequential (slow).
   - **CNN limitation:** receptive field grows with depth, so long-range information takes many layers to propagate. Locality bias hurts global understanding.
2. The breakthrough: what if every position could look at every other position *directly*, with the strength of each look determined by content rather than distance?
3. **Historical context:** Bahdanau et al. 2014 introduced "attention" as an *alignment* mechanism in neural machine translation. Vaswani et al. 2017 said: don't just use attention to align — use it as the whole architecture. Hence "Attention Is All You Need."
4. The chapter focuses on the *operation* — what attention computes — independent of its place in a larger architecture. The transformer block (Ch 7) wraps attention with FFN, residuals, and normalization.

**No code in this section.** Setup and motivation.

**Required callout** — type `aside`: the chapter uses "attention" to mean self-attention by default. Cross-attention is a variant introduced in section 7. The "Attention Is All You Need" paper introduced both; the broader literature sometimes reserves "attention" for the original Bahdanau-style cross-attention, but the modern usage covers both.

**Connection forward:** section 2 introduces the abstraction — Q, K, V — that the rest of the chapter builds on.

### Section 2: Soft database lookup — the Q/K/V framing

**Heading:** `## Soft database lookup — the Q, K, V framing`
**Word target:** ~700

**Teaching beats:**
1. The mental model: attention is a soft database lookup.
2. **Traditional database:** you have a query. You look through an index of keys. You retrieve the value associated with the matched key. One query → one value.
3. **Attention's twist:** instead of a single match, you compute a similarity score between the query and *every* key. Softmax-normalize those scores into a probability distribution. The "retrieval" is then a weighted sum of all values, weighted by the (now soft) match scores.
4. **Why this is useful in sequence modeling:** at position $i$, the query says "what am I looking for?" Each other position has a key saying "this is what I am" and a value saying "this is what I have to offer." The output at position $i$ is a content-addressed blend of everything in the sequence.
5. **In self-attention specifically:** $Q$, $K$, $V$ are all derived from the same input sequence $X$. Three different learned linear projections of the same data, playing three different functional roles.
6. **The "classroom voting" analogy** (from research.md): 8 students each hold up a Query card, a Key card, and a Value card. Every student looks at every other student's Key card, decides how much to listen based on how well the keys match their query, then blends in the others' Value cards proportionally.

**Required equation** (setup; full attention formula in section 3):

$$Q = X W^Q, \qquad K = X W^K, \qquad V = X W^V$$

where $W^Q, W^K \in \mathbb{R}^{d_{\text{model}} \times d_k}$ and $W^V \in \mathbb{R}^{d_{\text{model}} \times d_v}$.

**Required callout** — type `insight`: this is MC2 from research.md. "Q, K, V are fundamentally different things" is a misconception. In self-attention, they all originate from the same input $X$; the distinction is functional, not ontological. Three different projections of the same data play three different roles in the attention computation.

**No code in this section.** The formal machinery comes in section 3.

**Connection forward:** the formula that ties Q, K, V together is in section 3.

### Section 3: The scaled dot-product formula

**Heading:** `## The scaled dot-product formula`
**Word target:** ~900 (longest section)
**Sub-headings:** `### The formula`, `### Walking through the shapes`, `### A working implementation`

**Teaching beats:**

**The formula:**
1. State the formula from research.md Derivation 1 prominently. This is the central equation of the chapter — typeset it with care (label it for cross-reference).
2. **Walk through it step by step:**
   - $QK^\top \in \mathbb{R}^{n \times n}$ — the attention scores matrix
   - Each entry $(i, j)$ is $q_i \cdot k_j$, the similarity between position $i$'s query and position $j$'s key
   - Dividing by $\sqrt{d_k}$ — the scaling (justified in section 4)
   - Softmax over the last dimension — each row becomes a probability distribution
   - Multiplying by $V$ — produces the final output, an $n \times d_v$ matrix
3. **Each output row is a weighted average:** position $i$'s output is $\sum_j p_{ij} v_j$ where $p_{ij}$ is the softmax probability. This is "content-addressed retrieval" in formal dress.

**The widget placement:** the section-3 widget illustrates this formula concretely. For a 6-token sequence (e.g., "the cat sat on the mat"), show:
- The $Q$ and $K$ matrices as small grids
- The dot product producing the attention scores
- The softmax producing attention weights
- The weighted sum with $V$ producing the output

This is the marquee — the visual that makes the formula feel like a mechanical, traceable operation.

**A working implementation:** the numpy implementation from research.md (or close variant). Trim to essentials; the chapter doesn't need every edge case. The implementation, the formula, and the widget together should produce understanding.

**Required equation** — label this one for cross-reference from later sections:

```mdx
<Equation label="4.attn">
$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{Q K^\top}{\sqrt{d_k}}\right) V$$
</Equation>
```

**Required widget placeholder** — Attention Heatmap widget (marquee, session 19):

```mdx
<WidgetFrame title="Scaled dot-product attention" caption="Watch attention compute step by step on a 6-token sequence. Q · Kᵀ produces attention scores; softmax produces weights; weighted sum with V produces the output.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 19 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with the scaled dot-product attention implementation:

```python
import numpy as np

def softmax(x, axis=-1):
    """Numerically stable softmax (subtract max before exp)."""
    x = x - x.max(axis=axis, keepdims=True)
    exp_x = np.exp(x)
    return exp_x / exp_x.sum(axis=axis, keepdims=True)

def scaled_dot_product_attention(Q, K, V, mask=None):
    """
    Q: (n, d_k) — queries
    K: (n, d_k) — keys
    V: (n, d_v) — values
    mask: optional (n, n) — 0s where allowed, -inf where blocked
    Returns: (output, attention_weights)
    """
    d_k = Q.shape[-1]
    scores = (Q @ K.T) / np.sqrt(d_k)        # (n, n) attention scores
    if mask is not None:
        scores = scores + mask
    weights = softmax(scores, axis=-1)        # (n, n) attention distribution
    output = weights @ V                      # (n, d_v) final output
    return output, weights

# Demo on a 6-position sequence with random embeddings
n, d_k, d_v = 6, 8, 8
rng = np.random.default_rng(42)
Q = rng.normal(0, 1, (n, d_k))
K = rng.normal(0, 1, (n, d_k))
V = rng.normal(0, 1, (n, d_v))

output, weights = scaled_dot_product_attention(Q, K, V)
print(f"Output shape: {output.shape}")
print(f"Attention weights (each row sums to 1):")
print(weights.round(3))
print(f"\nRow sums: {weights.sum(axis=-1)}")
```

**Required callout** — type `note`, after the implementation: the softmax in this code subtracts the max before exponentiating. This is the standard numerical-stability trick — without it, large logits cause overflow. Production code (PyTorch, JAX) does this automatically, but understanding why matters for debugging.

**Connection forward:** section 4 explains the $\sqrt{d_k}$ in the denominator.

### Section 4: Why √d_k? The variance argument

**Heading:** `## Why √d_k? The variance argument`
**Word target:** ~600
**Sub-headings:** `### The variance grows with d_k`, `### Why it matters for softmax`, `### Empirical verification`

**Teaching beats:**

1. The naive question: where does the $\sqrt{d_k}$ come from? Why not divide by $d_k$? Or not divide at all?
2. **The variance argument** (Vaswani et al. 2017, footnote 4): if $q$ and $k$ are random vectors with unit-variance components, then $q \cdot k$ has variance $d_k$.
3. **Proof from research.md Derivation 2:** include the full variance calculation. It's short, clean, and pedagogically satisfying.
4. **Why this matters for softmax:** large logits → peaked softmax → near-zero gradients on non-max positions. The model can't learn nuanced attention patterns; it saturates early to confident-but-rigid choices.
5. **The fix:** divide by $\sqrt{d_k}$ (the standard deviation), restoring unit variance to the scores. Now softmax behaves reasonably for any embedding dimension.
6. **Why √ and not 1/d_k:** because *variance* scales linearly with $d_k$; *standard deviation* scales with $\sqrt{d_k}$. Dividing by std dev is the standard "z-score" normalization applied to dot products.

**Required equation** — the variance derivation:

$$\text{Var}(q \cdot k) = \mathbb{E}\!\left[\sum_i \sum_j q_i q_j k_i k_j\right]$$

By independence, all cross terms ($i \neq j$) vanish. The diagonal terms give:

$$\text{Var}(q \cdot k) = \sum_i \mathbb{E}[q_i^2]\,\mathbb{E}[k_i^2] = \sum_i 1 = d_k$$

so $\text{std}(q \cdot k) = \sqrt{d_k}$.

**Required code** — `<RunnableCode>` demonstrating the effect empirically:

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

rng = np.random.default_rng(0)
print(f"{'d_k':>6}  {'raw score std':>15}  {'scaled score std':>17}  {'raw weight max':>16}  {'scaled weight max':>18}")
for d_k in [8, 64, 512, 4096]:
    Q = rng.normal(0, 1, (5, d_k))
    K = rng.normal(0, 1, (5, d_k))
    raw_scores = Q @ K.T
    scaled_scores = raw_scores / np.sqrt(d_k)
    raw_max = softmax(raw_scores, axis=-1)[0].max()
    scaled_max = softmax(scaled_scores, axis=-1)[0].max()
    print(f"{d_k:>6d}  {raw_scores.std():>15.2f}  {scaled_scores.std():>17.2f}  {raw_max:>16.4f}  {scaled_max:>18.4f}")
```

Expected output: raw score std grows like $\sqrt{d_k}$ (≈ 2.8 / 8 / 22.6 / 64), while scaled score std stays near 1. The max attention weight without scaling approaches 1 (peaked softmax); with scaling, stays moderate.

**Required callout** — type `insight`: this is one of the cleanest design-justification arguments in deep learning. The variance calculation explains an engineering choice that would otherwise look arbitrary. Many learners encounter $\sqrt{d_k}$ in formulas and treat it as "magic"; the variance argument turns it into "of course."

**Connection forward:** softmax has more interesting properties than just being a normalizer. Section 5 unpacks them.

### Section 5: Why softmax? The normalization choice

**Heading:** `## Why softmax? The normalization choice`
**Word target:** ~700

**Teaching beats:**

1. **Softmax has specific properties** that make it the standard choice:
   - **Produces a valid probability distribution:** non-negative entries summing to 1
   - **Differentiable everywhere:** unlike argmax (which is discontinuous)
   - **Emphasizes the maximum:** but softly — the largest input gets the most weight, but smaller inputs still contribute
   - **Translation-invariant:** $\text{softmax}(x + c) = \text{softmax}(x)$ for any constant $c$. This is why subtracting the max for stability is valid.
2. **Alternative normalization choices and their downsides:**
   - **Normalized exp without max-subtraction** — same as softmax mathematically, but numerically unstable
   - **Hardmax / argmax** — non-differentiable; can't backprop
   - **L1 normalization** — $|x| / \sum |x|$: non-differentiable at zero; doesn't emphasize the max
   - **Sparsemax** — produces exact zeros; differentiable almost everywhere; less common but used in some specialized attention variants
   - **Linear attention** — skips softmax entirely; uses kernel tricks. Different family of methods (won't cover in this chapter)
3. **Temperature scaling** (mention briefly): $\text{softmax}(x / \tau)$ where $\tau$ is a temperature. $\tau < 1$ sharpens the distribution; $\tau > 1$ flattens it. Sometimes used at inference time (LLM sampling); almost never during training. The $\sqrt{d_k}$ in attention is effectively a temperature.
4. **The peaked-softmax gradient problem** — explain from research.md Derivation 3: when one entry is near 1 and others near 0, the gradient is near zero for *all* directions. The model gets stuck.

**Required equation** — the softmax definition with the stability trick:

$$\text{softmax}(x)_i = \frac{e^{x_i - \max_j x_j}}{\sum_k e^{x_k - \max_j x_j}}$$

**Required equation** — the gradient:

$$\frac{\partial \text{softmax}(x)_i}{\partial x_j} = \text{softmax}(x)_i \cdot (\delta_{ij} - \text{softmax}(x)_j)$$

**Required callout** — type `warning`: misconception MC3 from research.md. "Softmax is mandatory." It isn't. It's *standard* because of the listed properties, but linear attention, sparsemax, and other variants drop softmax entirely. The chapter focuses on softmax because it's by far the most common; the alternatives exist for readers who pursue this further.

**No code in this section.** Conceptual.

**Connection forward:** so far the chapter has assumed bidirectional attention (each position can attend to all). For autoregressive generation, this needs a modification: causal masking.

### Section 6: Causal masking for autoregressive models

**Heading:** `## Causal masking — attention for autoregressive models`
**Word target:** ~600

**Teaching beats:**

1. **The setup:** in autoregressive generation (GPT-style), each position $i$ predicts the next token. Position $i$ may only depend on positions $1$ through $i$ — not on future positions, which haven't been generated yet.
2. **Why naive attention violates this:** in section 3's formula, every position attends to every other position. If position 2 attends to position 5 during training, the model "cheats" by seeing the answer.
3. **The fix:** add a mask to the attention scores. Specifically, add $-\infty$ to entries above the diagonal (positions in the "future"). After softmax, these become 0; the position contributes zero weight.
4. **Why add $-\infty$ to scores, not zero post-softmax?** Because zeroing post-softmax doesn't preserve the sum-to-1 constraint. Adding $-\infty$ pre-softmax ensures the legal positions still sum to 1.
5. **Practical: $-10^9$, not literal $-\infty$.** Avoids NaN from $-\infty - (-\infty)$ in some softmax implementations.
6. **In matrix form:** the mask is a lower-triangular matrix with zeros below or on the diagonal, $-\infty$ above. Add it to $QK^\top / \sqrt{d_k}$.

**Required equation:**

$$\text{scores}_{ij} = \begin{cases} \dfrac{q_i \cdot k_j}{\sqrt{d_k}} & \text{if } j \leq i \\ -\infty & \text{if } j > i \end{cases}$$

**Required code** — `<RunnableCode>` showing causal mask construction and use:

```python
import numpy as np

def causal_mask(n):
    """Lower-triangular mask: 0 below or on diagonal, -inf above."""
    mask = np.full((n, n), -np.inf)
    return np.triu(mask, k=1)   # k=1 means strict upper triangle gets -inf; diagonal stays 0
                                 # actually we need to zero out the lower triangle and keep -inf upper
                                 # easier: build it differently:

def causal_mask_v2(n):
    mask = np.zeros((n, n))
    mask[np.triu_indices(n, k=1)] = -np.inf   # set strict upper triangle to -inf
    return mask

# Test
n = 5
print(f"Causal mask for n={n}:")
print(causal_mask_v2(n))

# Apply to attention
rng = np.random.default_rng(42)
Q = rng.normal(0, 1, (n, 8))
K = rng.normal(0, 1, (n, 8))
V = rng.normal(0, 1, (n, 8))

# Compute attention with and without mask
from_section3_code_block = None  # assume scaled_dot_product_attention is defined

scores = (Q @ K.T) / np.sqrt(8)
scores_masked = scores + causal_mask_v2(n)

def softmax(x):
    x = x - x.max(axis=-1, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=-1, keepdims=True)

unmasked = softmax(scores)
masked = softmax(scores_masked)

print(f"\nUnmasked attention (every row sums to 1; every row is dense):")
print(unmasked.round(3))
print(f"\nMasked attention (lower triangular; rows still sum to 1):")
print(masked.round(3))
print(f"\nRow sums (masked): {masked.sum(axis=-1)}")
```

**Required widget placeholder** — Causal Mask Visualizer (secondary, session 20):

```mdx
<WidgetFrame title="Causal masking" caption="Toggle the causal mask on and off; see how it changes the attention pattern. Without the mask, each position attends to the whole sequence. With it, each position only attends to itself and earlier positions.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 20
  </div>
</WidgetFrame>
```

**Required callout** — type `warning`: misconception MC5 from research.md. "Causal masking is added after attention." Wrong — the mask is added to the *scores* (pre-softmax), not the *outputs* (post-softmax). If you applied the mask after softmax, you'd break the sum-to-1 constraint, leaving the legal positions miscalibrated.

**Connection forward:** so far the chapter has covered self-attention (same input for Q, K, V). Section 7 covers the cross-attention variant.

### Section 7: Self-attention vs cross-attention

**Heading:** `## Self-attention vs cross-attention`
**Word target:** ~500

**Teaching beats:**

1. **Self-attention:** $Q$, $K$, $V$ all derived from the same input $X$. Used in every modern decoder-only LLM (GPT family) and every encoder (BERT).
2. **Cross-attention:** $Q$ comes from one sequence (e.g., the decoder's current output so far), $K$ and $V$ come from another sequence (e.g., the encoder's output). Used in encoder-decoder models for translation, summarization, etc.
3. **Mechanically:** the formula is the same. The only difference is where $Q$, $K$, $V$ come from.
4. **Modern relevance:**
   - GPT-style decoder-only LLMs: only self-attention (with causal masking)
   - BERT-style encoder-only: only self-attention (bidirectional, no mask)
   - T5, original Transformer, BART: encoder-decoder with both self-attention (in both stacks) and cross-attention (decoder attending to encoder)
   - Most modern open-source LLMs (LLaMA, Mistral) are decoder-only

5. **Why decoder-only dominates:** simplicity. One operation; one training regime; clean autoregressive generation. Encoder-decoder models have advantages for tasks with clear input-output structure (translation) but more architectural complexity.

**No required equation or callout in this section.** Conceptual; brief.

**Connection forward:** all this beautiful math has a cost. Section 8 quantifies it.

### Section 8: Computational cost — the O(n²) bottleneck

**Heading:** `## Computational cost — the O(n²) bottleneck`
**Word target:** ~500

**Teaching beats:**

1. **The compute cost of attention:**
   - $QK^\top$: matrix multiply of $(n, d_k)$ and $(d_k, n)$ — $O(n^2 d_k)$ ops
   - Softmax over the $n \times n$ matrix: $O(n^2)$ ops
   - $A V$: matrix multiply of $(n, n)$ and $(n, d_v)$ — $O(n^2 d_v)$ ops
   - Total: $O(n^2 d)$ where $d = d_k + d_v$
2. **The memory cost:** the attention matrix $A$ has shape $(n, n)$. For $n = 8192$: $A$ is $\sim 67M$ floats $= 256$ MB at fp32 (128 MB at fp16). For long contexts, the attention matrix is the GPU memory bottleneck.
3. **Concrete numbers:** for a 7B-parameter model with $n = 4096$, attention compute per layer is roughly $4096^2 \times 64 \approx 10^9$ ops. With 32 layers, total attention is roughly $3 \times 10^{10}$ ops per token. The FFN per layer is roughly $4096 \times 4 \times 4096^2 \approx 2.7 \times 10^{11}$ ops — bigger per layer, but attention dominates as $n$ grows.
4. **At $n = 16$K** or $n = 128$K, attention compute starts to exceed FFN compute. This is the regime where alternatives matter.
5. **The motivation for the rest of the tutorial:**
   - Ch 11 (Mamba): $O(n)$ alternative
   - Ch 17 (Inference optimization): KV caching makes inference $O(n)$ in the new token (the existing context's K and V are cached)
   - Flash Attention (Ch 17 or Ch 11): same math, different memory layout — never materializes the full $n \times n$ matrix

**Required code** — a `<RunnableCode>` doing the memory/compute calculation:

```python
def attention_compute_cost(n, d_k, d_v):
    """Approximate FLOPs for scaled dot-product attention."""
    QK_cost = 2 * n * n * d_k        # matmul: 2 * a * b * c for (a,b) @ (b,c)
    softmax_cost = 3 * n * n         # max + subtract + exp + sum + divide (rough)
    AV_cost = 2 * n * n * d_v
    return QK_cost + softmax_cost + AV_cost

def attention_memory(n, dtype_bytes=4):
    """Bytes to store the n x n attention matrix."""
    return n * n * dtype_bytes

for n in [256, 1024, 4096, 16384, 131072]:
    flops = attention_compute_cost(n, d_k=64, d_v=64)
    mem_fp32 = attention_memory(n, 4)
    mem_fp16 = attention_memory(n, 2)
    print(f"n = {n:>7d}: {flops:.2e} FLOPs, {mem_fp32/1e6:>8.1f} MB fp32, {mem_fp16/1e6:>8.1f} MB fp16")
```

**Required callout** — type `note`: at $n = 131072$ (the 128K context length of recent Claude/GPT-4 models), the attention matrix alone is 64 GB at fp16 — vastly exceeding any single GPU's memory. This is why long-context inference requires Flash Attention or similar memory-efficient implementations that never materialize the full matrix.

**Connection forward:** the chapter has covered single-head attention completely. Multi-head is the next step.

### Section 9: Bridge to multi-head

**Heading:** `## From single-head to multi-head`
**Word target:** ~300

**Teaching beats:**
1. **The natural next question:** the chapter's attention had one $W^Q$, one $W^K$, one $W^V$. What if we had several, each learning different projections?
2. **The hypothesis:** different attention "heads" could specialize. One head might learn to focus on recent positions; another on subject-verb relationships; another on long-range references. With multiple heads, the model has more representational capacity per layer.
3. **The setup for Ch 5:** instead of one $d_k$-dimensional attention, run $h$ parallel $d_k/h$-dimensional attentions, each with their own learned projections. Concatenate outputs. Costs roughly the same (the per-head dimension is smaller) but provides $h$ different views of the sequence.
4. **Ch 5 takes it from here.**

**Sample close** (rewrite in chapter voice):

> Scaled dot-product attention is the operation that defines the modern LLM. Q, K, V — three learned views of the same input. Dot product as similarity, scaled by $\sqrt{d_k}$ for stability, softmaxed into a probability distribution, then used to take a weighted sum of values. Causal masking for autoregressive generation. $O(n^2)$ in the sequence length, both in compute and memory.
>
> Everything else in the tutorial is downstream of this operation. Chapter 5 extends it to multi-head attention — multiple parallel attentions, each with their own learned projections. Chapter 7 wraps it in a transformer block. Chapter 11 introduces an alternative ($O(n)$ state-space models) that may or may not win. Chapter 17 shows how to make inference fast without changing the math.
>
> What we built in this chapter is what they all start from.

---

### Update `src/lib/chapters.ts`

Find the Ch 4 entry:

```ts
{ num: 4, slug: 'ch04-attention', title: 'Attention', partNum: 2, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`. (Session 20 flips to `'published'` after the secondary widget and exercises are added.)

### Delete the placeholder

```bash
test -f src/pages/ch04-attention/index.astro && rm src/pages/ch04-attention/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch04-attention/`** renders with:
   - Chapter eyebrow ("Chapter 4") + h1 ("Attention") + description
   - 9 h2 sections in the order specified
   - All equations render via KaTeX (no raw `$...$`); the labeled equation `<Equation label="4.attn">` is present
   - 3-4 `<RunnableCode>` blocks (sections 3, 4, 6, 8)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 6)
   - At least 6 callouts spread through the chapter (mix of note/warning/aside/insight)
3. **Sidebar:** Ch 1, 2, 3 published; Ch 4 active (draft); Ch 5-30 dimmed.
4. **Landing page CTA:** still "Start with Chapter 1 →".
5. **Prev/next nav at bottom of Ch 4:** prev = Ch 3 (active link); next = Ch 5 (disabled).
6. **TOC on Ch 4** populates with all 9 sections plus subsections.
7. **Word count:** chapter prose between 5000 and 6500 words.
8. **`npm run typecheck`** passes.
9. **`npm run build`** completes; `dist/ch04-attention/index.html` exists.

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 19 and 20 own them.
- ❌ **Do not write exercises.** Session 20 owns.
- ❌ **Do not flip Ch 4's status to `'published'`.** Session 20 owns.
- ❌ **Do not introduce multi-head attention.** Ch 5 owns.
- ❌ **Do not introduce positional encoding.** Ch 6 owns.
- ❌ **Do not modify Ch 1, 2, or 3.** Sealed.
- ❌ **Do not modify any layout, styling, or scaffolding file.**

---

## Wire-up

```bash
git add src/pages/ch04-attention/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch04-attention/index.astro 2>/dev/null || true
git commit -m "session 18: Chapter 4 prose — 9 sections, scaled dot-product attention, √d_k derivation, causal masking, widget placeholders"
git push origin main
```

---

## Notes for the session author

**On math density:** Ch 4 is the most math-dense chapter so far. Sections 3 and 4 alone contain ~5 equations, including the variance derivation and the softmax gradient. Use `<Equation>` blocks generously; inline math should be minimal. The chapter author may need to manually verify KaTeX renders correctly for the more complex expressions.

**On the √d_k derivation:** this is a chapter highlight. The variance calculation is short and clean — quote it in full in section 4. Readers find satisfying derivations satisfying; don't summarize it away. The pedagogical payoff justifies the prose budget.

**On the labeled equation:** `<Equation label="4.attn">` for the central attention formula. Later sections (especially section 4) can reference it via `<EqRef id="4.attn" />`. This is the first chapter to use cross-equation references; verify the rendering works.

**On causal mask code:** the numpy `np.triu` / `np.triu_indices` API is fussy. The implementation in section 6's code block is intentionally verbose (clearly setting zeros below diagonal, $-\infty$ above) to make the construction inspectable. Don't golf it.

**On section 8's compute numbers:** the FLOP estimates use "$2 a b c$ for an $(a, b) \times (b, c)$ matmul" which is the standard counting (one multiply + one add per output element). The chapter author should keep this convention.

**On the closing paragraph:** the sample close ("Everything else in the tutorial is downstream of this operation") explicitly frames Ch 4 as the centerpiece. This isn't hyperbole — every later chapter does build on attention. The framing primes the reader for the rest of the tutorial.

**Pedagogical outcomes for the reader.** After Ch 4, the reader should be able to:
1. State the attention formula from memory
2. Implement scaled dot-product attention in numpy
3. Explain $\sqrt{d_k}$ via the variance argument
4. Explain causal masking and why it's pre-softmax
5. Distinguish self-attention from cross-attention
6. Articulate the $O(n^2)$ cost and where it comes from

These six outcomes are the chapter's contract. The widgets, code, and prose all serve them.

This is the central chapter of the tutorial. Build the prose with care; the reader is going to come back to it.
