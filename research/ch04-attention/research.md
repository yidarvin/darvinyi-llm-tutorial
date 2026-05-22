# Chapter 4 — Attention: research

> Curated source material for Chapter 4's build sessions (sessions 18-20, files 27-29 in BUILD_ORDER). Attention is the most important single chapter in the tutorial — the operation that defines the modern LLM architecture. This research file goes deep on the formula, the variance argument behind $\sqrt{d_k}$, the geometric intuition of dot-product similarity, the softmax properties that make it the right normalization, and causal masking.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Attention

**Premise:** Scaled dot-product attention — the operation at the heart of every transformer. How a sequence of vectors can refine itself by having each position look at every other position. Why dot product as similarity, why softmax as normalization, why $\sqrt{d_k}$ in the denominator. Causal masking for autoregressive models. The quadratic compute cost that motivates much of the rest of the tutorial.

**Out of scope (other chapters):**
- Multi-head attention — multiple parallel attention operations (Ch 5)
- Positional encoding — how position information enters attention (Ch 6)
- The full transformer block — attention + FFN + residuals (Ch 7)
- KV cache and inference optimization (Ch 17)
- Attention variants — sparse, linear, flash (later chapters)
- Mamba and the post-attention era (Ch 11)

**In scope and locked:**
- Why attention exists — the limitations of fixed-window sequence models
- The Q, K, V abstraction
- The scaled dot-product formula
- Geometric interpretation of dot-product similarity
- The $\sqrt{d_k}$ normalization — the variance argument
- Softmax properties: differentiability, "soft argmax", temperature
- Causal masking for autoregressive generation
- Self-attention vs cross-attention
- Computational complexity: $O(n^2 \cdot d)$ per layer

**Suggested chapter structure:**

1. The setup — why attention exists (~500 words)
2. Soft database lookup — the Q/K/V framing (~700 words)
3. The scaled dot-product formula (~900 words — central section)
4. Why $\sqrt{d_k}$? The variance argument (~600 words)
5. Why softmax? The normalization choice (~700 words)
6. Causal masking — attention for autoregressive models (~600 words)
7. Self-attention vs cross-attention (~500 words)
8. Computational cost — the $O(n^2)$ bottleneck (~500 words)
9. Bridge to multi-head (~300 words)

Target total: ~5300 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Vaswani et al. 2017 — "Attention Is All You Need"
- **arXiv:** [1706.03762](https://arxiv.org/abs/1706.03762)
- **What it contributed:** the Transformer architecture. Replaced recurrence (RNNs) and convolution with attention as the sole sequence-modeling operation. Introduced scaled dot-product attention, multi-head attention, and the encoder-decoder transformer.
- **For the chapter:** THE central reference. The scaled dot-product formula in this paper is what every modern LLM computes (with variations). Cite extensively. Quote the formula verbatim.

### Bahdanau, Cho, Bengio 2014 — "Neural Machine Translation by Jointly Learning to Align and Translate"
- **arXiv:** [1409.0473](https://arxiv.org/abs/1409.0473)
- **What it contributed:** introduced "attention" as an idea in NMT. Used *additive attention* (a learned feedforward network) over encoder hidden states from a decoder. The first sequence-to-sequence model with a learnable alignment.
- **For the chapter:** historical context. Brief mention in section 1 — attention existed before transformers; transformers made it the *only* operation.

### Luong, Pham, Manning 2015 — "Effective Approaches to Attention-based Neural Machine Translation"
- **arXiv:** [1508.04025](https://arxiv.org/abs/1508.04025)
- **What it contributed:** simplified Bahdanau's additive attention. Introduced "multiplicative" / dot-product attention — closer to what Vaswani et al. 2017 use. Showed dot-product was faster and comparable in quality.
- **For the chapter:** historical bridge between additive attention (2014) and scaled dot-product (2017). Brief mention.

### Karpathy — `nanoGPT`
- **GitHub:** [github.com/karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)
- **YouTube:** "Let's build GPT" — the 2-hour deep dive
- **What it is:** a clean, minimal GPT implementation in PyTorch. The `CausalSelfAttention` class is the canonical modern reference for scaled dot-product + causal masking. ~30 lines of dense, careful code.
- **For the chapter:** cite as the reference implementation. Readers wanting "this in PyTorch instead of numpy" should go here.

### Tay, Dehghani, Bahri, Metzler 2022 — "Efficient Transformers: A Survey"
- **arXiv:** [2009.06732](https://arxiv.org/abs/2009.06732)
- **What it contributed:** systematic survey of alternatives to vanilla attention — sparse, low-rank, linearized, kernel-based. The $O(n^2)$ cost motivation throughout the field.
- **For the chapter:** brief mention in section 8 (computational cost). Chapter doesn't survey alternatives in depth; this paper is the pointer.

---

## Core derivations

### Derivation 1: Scaled dot-product attention — the formula

**Setup:** for each position $i$ in a sequence of length $n$, we have a query vector $q_i \in \mathbb{R}^{d_k}$. The full set of queries forms a matrix $Q \in \mathbb{R}^{n \times d_k}$. Similarly, every position has a key $k_i \in \mathbb{R}^{d_k}$ stacked into $K \in \mathbb{R}^{n \times d_k}$, and a value $v_i \in \mathbb{R}^{d_v}$ stacked into $V \in \mathbb{R}^{n \times d_v}$.

In **self-attention**, $Q$, $K$, $V$ are all produced from the same input sequence $X \in \mathbb{R}^{n \times d_{\text{model}}}$ via learned linear projections:

$$Q = X W^Q, \qquad K = X W^K, \qquad V = X W^V$$

where $W^Q, W^K \in \mathbb{R}^{d_{\text{model}} \times d_k}$ and $W^V \in \mathbb{R}^{d_{\text{model}} \times d_v}$. Typically $d_k = d_v$ in single-head attention; in multi-head, $d_k = d_v = d_{\text{model}} / h$ where $h$ is the number of heads (Ch 5).

**The attention formula** (Vaswani et al. 2017):

$$\boxed{\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{Q K^\top}{\sqrt{d_k}}\right) V}$$

**Walking through the shapes:**

- $Q K^\top \in \mathbb{R}^{n \times n}$ — the attention scores. Entry $(i, j)$ is $q_i \cdot k_j$: the similarity between position $i$'s query and position $j$'s key.
- Dividing by $\sqrt{d_k}$ — the scaling. Justified in Derivation 2.
- Softmax over the last dimension (rows independently). Each row $i$ becomes a probability distribution over positions $j \in \{1, \dots, n\}$.
- Multiplying by $V \in \mathbb{R}^{n \times d_v}$ produces an output in $\mathbb{R}^{n \times d_v}$ — each position is now a weighted average of the value vectors.

**Interpretation:** for each position $i$, we compute a probability distribution over all positions $j$ (where to attend), then take a weighted average of the value vectors using those probabilities. Position $i$'s output is $\sum_j p_{ij} v_j$ where $p_{ij}$ is the softmaxed similarity score.

### Derivation 2: Why √d_k? The variance argument

**The claim** (Vaswani et al. 2017, footnote 4): if $q$ and $k$ are independent random vectors with components drawn i.i.d. from a distribution with mean 0 and variance 1, then $q \cdot k = \sum_i q_i k_i$ has mean 0 and variance $d_k$.

**Proof:**

$$\mathbb{E}[q \cdot k] = \sum_i \mathbb{E}[q_i k_i] = \sum_i \mathbb{E}[q_i] \, \mathbb{E}[k_i] = 0$$

(Using independence between $q_i$ and $k_i$, and zero means.)

$$\text{Var}(q \cdot k) = \mathbb{E}[(q \cdot k)^2] - 0^2 = \mathbb{E}\!\left[\sum_i \sum_j q_i q_j k_i k_j\right]$$

By independence, $\mathbb{E}[q_i q_j k_i k_j] = 0$ unless $i = j$. When $i = j$: $\mathbb{E}[q_i^2 k_i^2] = \mathbb{E}[q_i^2] \cdot \mathbb{E}[k_i^2] = 1 \cdot 1 = 1$. Summing:

$$\text{Var}(q \cdot k) = \sum_i 1 = d_k$$

So dot products grow in *standard deviation* like $\sqrt{d_k}$. For typical $d_k = 64$, the std dev is 8. For $d_k = 128$, it's about 11.3.

**Why this matters for softmax:** as logits grow large in absolute value, softmax becomes increasingly *peaked* — the gradient vanishes for non-max positions. Concretely, $\frac{\partial \text{softmax}(x)_i}{\partial x_j}$ is largest when the softmax distribution is uniform; it becomes near-zero when one $x$ dominates.

Without scaling: large $d_k$ → large dot products → peaked softmax → vanishing gradients. The model can't learn nuanced attention patterns; it commits early to confident-but-rigid choices.

**The fix:** divide the scores by $\sqrt{d_k}$, restoring unit variance. Now the dot products have variance 1 regardless of $d_k$, and softmax behaves reasonably for any embedding dimension.

**Why √ specifically, not 1/d_k?** Because *variance* scales linearly with $d_k$; *standard deviation* scales with $\sqrt{d_k}$. Dividing by std dev (not variance) gives unit-variance scores. This is the same standardization you'd apply elsewhere — Z-score normalization, just for dot products.

### Derivation 3: The softmax gradient

For softmax $\sigma(x)_i = e^{x_i} / \sum_j e^{x_j}$:

$$\frac{\partial \sigma(x)_i}{\partial x_j} = \sigma(x)_i \cdot (\delta_{ij} - \sigma(x)_j)$$

where $\delta_{ij}$ is the Kronecker delta (1 if $i = j$, else 0).

**Implications:**
- Diagonal ($i = j$): $\sigma_i (1 - \sigma_i)$. Maximized at $\sigma_i = 0.5$ (gradient 0.25); zero when $\sigma_i \in \{0, 1\}$.
- Off-diagonal ($i \neq j$): $-\sigma_i \sigma_j$. Largest in magnitude when both $\sigma_i, \sigma_j$ are intermediate.

**The peaked-softmax problem:** when one logit dominates, the corresponding softmax entry is $\approx 1$; all others are $\approx 0$. The gradient through that softmax is $\approx 0$ in every direction. The model can't learn to redistribute attention away from this saturated state.

This is the practical reason $\sqrt{d_k}$ matters. Without it, attention saturates early in training and can't refine.

### Derivation 4: Causal masking via additive infinity

For autoregressive generation, position $i$ must only attend to positions $j \leq i$. The standard implementation: add $-\infty$ to the attention scores at illegal positions *before* softmax:

$$\text{scores}_{ij} = \begin{cases} \dfrac{q_i \cdot k_j}{\sqrt{d_k}} & \text{if } j \leq i \\ -\infty & \text{if } j > i \end{cases}$$

After softmax: $\text{softmax}(-\infty) = 0$. So $p_{ij} = 0$ for $j > i$ regardless of the score. The output at position $i$ is a weighted average over positions $1$ through $i$ only.

**Practical encoding:** instead of literal $-\infty$, use a large negative number like $-10^9$ (avoids NaN from $-\infty - (-\infty)$ in some softmax implementations). PyTorch and JAX have `masked_fill(mask, -inf)` patterns that handle this safely.

**In matrix form:** the causal mask is a lower-triangular matrix $M$ with zeros below or on the diagonal and $-\infty$ above. The masked attention scores are:

$$S_{\text{masked}} = \frac{Q K^\top}{\sqrt{d_k}} + M$$

Then softmax acts on $S_{\text{masked}}$ row-wise.

### Derivation 5: Backward pass through attention (sketch)

Suppose $L$ is the loss and $Y = \text{Attention}(Q, K, V) \in \mathbb{R}^{n \times d_v}$. Given $\frac{\partial L}{\partial Y}$, what are the gradients w.r.t. $Q$, $K$, $V$?

Let $A = \text{softmax}(QK^\top / \sqrt{d_k})$, so $Y = AV$.

$$\frac{\partial L}{\partial V} = A^\top \frac{\partial L}{\partial Y}$$

The softmax-then-multiply structure means $V$ has a clean gradient.

For $Q$ and $K$:

$$\frac{\partial L}{\partial A} = \frac{\partial L}{\partial Y} V^\top$$

Then through the softmax (each row independently), and finally:

$$\frac{\partial L}{\partial Q} = \frac{1}{\sqrt{d_k}} \cdot \frac{\partial L}{\partial S} \cdot K, \qquad \frac{\partial L}{\partial K} = \frac{1}{\sqrt{d_k}} \cdot \left(\frac{\partial L}{\partial S}\right)^\top \cdot Q$$

where $S = QK^\top / \sqrt{d_k}$ is the pre-softmax scores.

**For the chapter:** don't derive the softmax-row-gradient in full prose. Mention that the backward pass is mechanical (chain rule through softmax and matmul) and that modern frameworks handle it automatically. The reader who wants depth can work it out from these formulas.

---

## Glossary

- **Attention:** an operation computing, for each output position, a weighted sum over input positions, with weights determined by query-key similarity.
- **Query ($Q$):** the vector at each output position used to determine "what am I looking for here?"
- **Key ($K$):** the vector at each input position used to determine "what could be matched against a query?"
- **Value ($V$):** the vector at each input position that gets aggregated into the output, weighted by the query-key similarity.
- **Attention scores:** the pre-softmax dot products $QK^\top$. Real-valued, can be positive or negative.
- **Attention weights / attention distribution:** the post-softmax probabilities. Non-negative, rows sum to 1.
- **Self-attention:** $Q$, $K$, $V$ all derived from the same input sequence. Each position attends to all positions in the same sequence.
- **Cross-attention:** $Q$ comes from one sequence, $K$ and $V$ from another. Used in encoder-decoder models (translation, summarization).
- **Causal / masked attention:** restriction that position $i$ may only attend to positions $j \leq i$. Required for autoregressive generation.
- **Bidirectional attention:** position $i$ may attend to any position $j$ (no causal mask). Used in encoder models (BERT).
- **$d_k$:** dimensionality of query/key vectors. Controls how much "matching space" the attention has.
- **$d_v$:** dimensionality of value vectors. Usually equal to $d_k$, but doesn't have to be.
- **$d_{\text{model}}$:** the model's internal embedding dimension. Inputs and outputs to attention live in this space.
- **Scaled dot-product attention:** the specific attention variant from Vaswani et al. 2017, with the $\sqrt{d_k}$ normalization.
- **Multiplicative attention:** dot-product attention without scaling (Luong 2015). Functionally the same operation; the scaling is the addition.
- **Additive attention:** Bahdanau 2014's formulation, where attention scores are computed by a small feedforward network rather than a dot product. Slower, comparable quality.
- **Temperature ($\tau$):** a divisor applied to logits before softmax — $\text{softmax}(x / \tau)$. $\tau < 1$ sharpens the distribution; $\tau > 1$ flattens it. Sometimes used at inference time (sampling), almost never during training.
- **Position $i$ attends to position $j$ with weight $p_{ij}$** — the standard phrasing for what attention does.

---

## Pedagogical analogies

### 1. Attention as a soft database lookup
In a traditional database: you have a query, you compare it against an index of keys, you retrieve the value at the matched key. Attention does the same — but softly. Instead of a single match, you get a probability distribution over keys. The "retrieval" is then a weighted average of all values, weighted by how well each key matched the query.

**Best used for:** the opening of section 2 (the Q/K/V framing). The database analogy makes the three-letter abbreviation feel motivated rather than arbitrary.

### 2. The classroom voting analogy
Imagine 8 students in a classroom. Each student holds up a "Query card" describing what they're interested in learning. Each student also holds up a "Key card" describing what they know. To form a study group, each student votes: I'll listen most to the students whose Key cards best match my Query card. The votes are softmax-normalized so each student has a unit voting budget to distribute across the others. After voting, each student's understanding becomes a weighted blend of everyone else's *Value* cards (the actual content), weighted by how well their Q-K vote aligned.

**Best used for:** explaining self-attention. The students-with-three-cards analogy makes Q ≠ K ≠ V intuitive even when they all come from the same input.

### 3. The flashlight on the sequence
Each position in the sequence shines a flashlight on the rest of the sequence. The flashlight beam is *shaped* by the query: a query like "find the most recent verb" produces a beam focused on verbs; a query like "find the subject of this clause" produces a beam focused on nouns earlier in the sentence. The brightness of the beam at each location is the attention weight; what the position then "sees" is a weighted blend of what's illuminated.

**Best used for:** building intuition for attention patterns. The flashlight image foreshadows the attention heatmap visualization in the widget.

### 4. Dot product as soft cosine similarity
Two vectors in high-dimensional space — they could point in roughly the same direction (large positive dot product), orthogonal directions (zero), or opposite (large negative). The dot product as similarity metric is essentially asking "do these point the same way, weighted by magnitude?" Cosine similarity normalizes out magnitude; raw dot product doesn't. Attention uses raw dot product, which means magnitude matters — keys with large magnitudes get more attention by default. Whether this is a bug or a feature depends on context; it's why some attention variants normalize.

**Best used for:** the geometric interpretation in section 3. Sets up why dot product is a reasonable similarity choice.

---

## Common misconceptions

### MC1: "Attention attends to one position."
**Reality:** attention is *soft*. Each query position produces a probability distribution over ALL key positions. The output is a weighted average over the entire sequence. Calling it "attention" suggests focus on one place; in practice, well-trained attention often distributes weight across many positions. The misleading framing comes from cherry-picked visualizations where one position gets ~90% of the weight; that's the exception, not the rule.

### MC2: "Q, K, V are fundamentally different things."
**Reality:** in self-attention, $Q$, $K$, $V$ are all derived from the same input matrix $X$ via three different linear projections. They have different *roles* in the attention computation, but they originate from the same data. The distinction is functional, not ontological. (In cross-attention, $Q$ does come from a different sequence than $K, V$ — but $K$ and $V$ still come from the same source.)

### MC3: "Softmax is mandatory."
**Reality:** softmax is *standard*, not mandatory. The chapter focuses on softmax attention because it's by far the most common variant and has nice properties (probability distribution, differentiable, emphasizes the maximum). Linear attention variants skip the softmax entirely; sparse attention variants use thresholded versions; "Performer"-style attention approximates softmax with kernel methods. Softmax is a choice, not a constraint.

### MC4: "Attention is the same as alignment."
**Reality:** in NMT (Bahdanau 2014), attention was used as an *alignment* mechanism — a "soft translation table" between source and target tokens. In modern self-attention, attention isn't really aligning anything; it's a general-purpose "look at related positions" mechanism. The semantic interpretation of attention weights is much weaker than the NMT-era literature suggests.

### MC5: "Causal masking is added after attention."
**Reality:** the mask is added to the attention *scores* (pre-softmax), not to the attention *outputs* (post-softmax). If you applied the mask after softmax (zeroing out illegal positions), the remaining probabilities would no longer sum to 1, and your weighted sum would be miscalibrated. Adding $-\infty$ before softmax makes illegal positions contribute exactly 0 to the probability mass, leaving the legal positions summing to 1.

### MC6: "Attention scores are interpretable."
**Reality:** attention scores often *look* interpretable (high scores for "obvious" relationships like subject-verb), but the field has accumulated substantial evidence that they're unreliable as explanations. Jain & Wallace 2019 ("Attention is not Explanation") and follow-ups show that you can perturb attention weights significantly without changing model outputs — meaning the attention pattern doesn't uniquely determine what the model is doing. Treat attention visualizations as suggestive, not authoritative.

### MC7: "$d_k = d_v$ always."
**Reality:** they're often equal (Vaswani uses $d_k = d_v = d_{\text{model}} / h$ in multi-head), but they don't have to be. You could have $d_k = 32$ (small matching space) with $d_v = 64$ (larger value space). The chapter sticks to $d_k = d_v$ for simplicity; mention the flexibility in a footnote.

---

## Tricky implementation details

### TID1: Subtract the max before softmax for numerical stability
Naive softmax: $\text{softmax}(x)_i = e^{x_i} / \sum_j e^{x_j}$. If any $x_j$ is large (say 1000), $e^{x_j}$ overflows. Fix:

$$\text{softmax}(x)_i = \frac{e^{x_i - \max_j x_j}}{\sum_j e^{x_j - \max_j x_j}}$$

Mathematically identical (the factor $e^{-\max}$ cancels in numerator and denominator); numerically stable for any input range. Every production softmax does this; you should too.

### TID2: Padding token masking
Real sequences have variable lengths. To batch them, you pad shorter sequences with `<pad>` tokens. But the attention computation will happily attend TO and FROM pad tokens. The fix: another additive mask that zeros out pad positions in the attention scores. This is independent of (and often combined with) the causal mask.

### TID3: Mixed-precision attention
Modern training uses fp16 or bf16. The attention scores can overflow fp16 (range $\pm 65504$). With $d_k = 64$ and unit-variance inputs, post-scaling scores have std dev ~1; with $d_k = 128$, ~1.4 — both fp16-safe. But before the $\sqrt{d_k}$ scaling, raw dot products can hit thousands; do the scaling in fp32 if numerical issues appear.

### TID4: Memory: the attention matrix is the bottleneck
For sequence length $n$ and batch size $b$, the attention scores matrix $A$ has shape $(b, n, n)$. At $n = 8192$ with $b = 1$: $A$ is $8192 \times 8192 = 67M$ floats $= 256$ MB at fp32 (128 MB at fp16). For long contexts, the attention matrix is the GPU memory bottleneck — not the model weights. Flash Attention (Ch 17) solves this by never materializing $A$ explicitly.

### TID5: Compute: $O(n^2 d)$
The matmul $QK^\top$ is $O(n^2 d_k)$. The matmul $AV$ is $O(n^2 d_v)$. Total: $O(n^2 d)$ where $d = d_k + d_v$. The dominant term for long sequences is $n^2$, hence the "quadratic attention" framing. For $n = 1024$, $d = 64$: ~134M ops per attention layer per example. For $n = 16384$: ~34B ops. The chapter should give concrete numbers to make the cost real.

### TID6: $d_k$ vs $d_{\text{model}}$ — getting the shapes right
The Q, K, V projections take inputs of dimension $d_{\text{model}}$ and produce outputs of dimension $d_k$ (or $d_v$). In single-head attention, $d_k = d_{\text{model}}$ is common. In multi-head (Ch 5), $d_k = d_{\text{model}} / h$. The chapter author should pick one convention for the chapter's runnable code and stick with it.

---

## Reference implementations

### Scaled dot-product attention in numpy

```python
import numpy as np

def softmax(x, axis=-1):
    """Numerically stable softmax."""
    x = x - x.max(axis=axis, keepdims=True)
    exp_x = np.exp(x)
    return exp_x / exp_x.sum(axis=axis, keepdims=True)


def scaled_dot_product_attention(Q, K, V, mask=None):
    """
    Q: (n, d_k) — queries
    K: (n, d_k) — keys
    V: (n, d_v) — values
    mask: optional (n, n) matrix of 0s (allow) and -inf (block)

    Returns: (n, d_v) attention output and (n, n) attention weights.
    """
    d_k = Q.shape[-1]
    scores = (Q @ K.T) / np.sqrt(d_k)        # (n, n)
    if mask is not None:
        scores = scores + mask
    weights = softmax(scores, axis=-1)        # (n, n), rows sum to 1
    output = weights @ V                      # (n, d_v)
    return output, weights


# Causal mask: 0 on and below the diagonal, -inf above
def causal_mask(n):
    mask = np.full((n, n), -np.inf)
    mask = np.triu(mask, k=1)                 # upper triangle, excluding diagonal
    return mask


# Demo
n, d_k, d_v = 6, 4, 4
rng = np.random.default_rng(42)
Q = rng.normal(0, 1, (n, d_k))
K = rng.normal(0, 1, (n, d_k))
V = rng.normal(0, 1, (n, d_v))

# Unmasked attention
out, weights = scaled_dot_product_attention(Q, K, V)
print(f"Output shape: {out.shape}")
print(f"Weights shape: {weights.shape}; row sums: {weights.sum(axis=-1)}")

# Causal attention
out_c, weights_c = scaled_dot_product_attention(Q, K, V, mask=causal_mask(n))
print(f"Causal weights (upper triangle should be 0):\n{weights_c.round(3)}")
```

### Self-attention layer (Q/K/V from same input)

```python
class SelfAttention:
    def __init__(self, d_model, d_k, d_v, seed=42):
        rng = np.random.default_rng(seed)
        self.W_Q = rng.normal(0, 0.1, (d_model, d_k))
        self.W_K = rng.normal(0, 0.1, (d_model, d_k))
        self.W_V = rng.normal(0, 0.1, (d_model, d_v))

    def __call__(self, X, mask=None):
        """X: (n, d_model)"""
        Q = X @ self.W_Q    # (n, d_k)
        K = X @ self.W_K    # (n, d_k)
        V = X @ self.W_V    # (n, d_v)
        return scaled_dot_product_attention(Q, K, V, mask)

# Demo: feed a 6-position embedded sequence through self-attention
attn = SelfAttention(d_model=8, d_k=8, d_v=8)
X = rng.normal(0, 1, (6, 8))
out, weights = attn(X, mask=causal_mask(6))
print(f"Self-attention output: {out.shape}")
```

### Demonstrating the √d_k effect

```python
# Without scaling: large d_k → peaked softmax → no learning
for d_k in [8, 64, 512]:
    Q = rng.normal(0, 1, (5, d_k))
    K = rng.normal(0, 1, (5, d_k))

    raw_scores = Q @ K.T
    raw_weights = softmax(raw_scores, axis=-1)

    scaled_scores = raw_scores / np.sqrt(d_k)
    scaled_weights = softmax(scaled_scores, axis=-1)

    print(f"d_k = {d_k:4d}")
    print(f"  Raw score std:    {raw_scores.std():.2f}")
    print(f"  Scaled score std: {scaled_scores.std():.2f}")
    print(f"  Raw weight max (row 0):    {raw_weights[0].max():.4f}")
    print(f"  Scaled weight max (row 0): {scaled_weights[0].max():.4f}")
    print()
```

Expected: as $d_k$ grows, raw scores' std grows like $\sqrt{d_k}$, and the unscaled softmax becomes increasingly peaked (max approaches 1.0). The scaled version stays near uniform regardless of $d_k$.

---

## Connections to other chapters

- **Ch 2 (Embeddings):** the input to attention is a sequence of embedded tokens. Without Ch 2's embedding layer, there'd be no continuous vectors to feed into Q/K/V projections.
- **Ch 3 (Tokenization):** sequence length $n$ — and therefore attention's $O(n^2)$ cost — is determined by the tokenizer. Better tokenization (fewer tokens per text) directly reduces attention compute.
- **Ch 5 (Multi-head attention):** Ch 4 covers single-head attention. Multi-head is multiple copies of Ch 4's operation in parallel, with different learned Q/K/V projections.
- **Ch 6 (Positional encoding):** Ch 4's attention is *position-blind* — shuffle the input sequence and the output set is shuffled identically. Positional encoding is how spatial information enters the model. Ch 6 explores the design space.
- **Ch 7 (The transformer block):** attention is one of two main operations in a transformer block. The other is the FFN. Plus residuals and layer norms.
- **Ch 8 (Building a small LLM):** attention is the dominant compute cost. Profiling a small LLM will show ~50-80% of FLOPs going to attention.
- **Ch 11 (Mamba):** the alternative to attention. State-space models that achieve $O(n)$ instead of $O(n^2)$ scaling. The motivation is precisely the cost discussed in Ch 4's section 8.
- **Ch 17 (Inference optimization):** the KV cache is THE central inference optimization. The idea: at generation time, every new token attends to the same K and V matrices for all previous tokens. Cache them; don't recompute.
- **Ch 22 (Retrieval & RAG):** RAG can be framed as "attention over a much larger corpus." The compute cost limits of attention motivate why we use retrieval instead of just extending context.
- **Ch 25 (Interpretability):** attention visualization is one of the oldest interpretability tools, despite the caveats (MC6). Modern interp moves beyond attention to activation patching, circuit analysis, etc.

---

## Open questions for the chapter author

### Q1: How much pre-2017 attention history to cover?
**Recommendation:** brief. One paragraph in section 1 mentioning Bahdanau 2014 (additive attention in NMT) and Luong 2015 (dot-product attention) is enough. The chapter is about modern attention; don't lose the reader in pre-Transformer history.

### Q2: Should section 5 (softmax) include alternative normalization functions?
**Recommendation:** mention them briefly (sparsemax, taylor softmax, linear attention) but don't derive any. The chapter's pedagogical claim is "softmax has nice properties"; the alternatives are footnotes. Pointing to "Efficient Transformers: A Survey" lets curious readers go deeper.

### Q3: How to handle multi-head as a forward reference?
**Recommendation:** end Ch 4 by setting up multi-head as the natural next question. "Single-head attention has one projection per role; what if we wanted multiple, parallel attention heads each learning different aspects?" Then Ch 5 picks it up. Don't preview the math.

### Q4: Should the runnable code use a real text example?
**Recommendation:** yes, ideally. A 6-token sentence ("The cat sat on the mat") tokenized into 6 fake "embeddings" and run through self-attention produces an attention matrix you can visualize. Concrete examples beat random vectors when the reader is learning.

### Q5: Widget candidates
1. **Attention heatmap (marquee)** — for a small sequence (6-8 tokens with labels), animate through the computation: $Q$ and $K$ vectors → dot product matrix → scaled scores → softmax → weighted sum with $V$ → output. Each step is a phase of the animation. Pedagogically essential. **Recommended marquee.**
2. **Causal mask visualizer (secondary)** — show the same attention matrix with and without the causal mask applied; an interactive slider lets the user toggle the mask intensity (0 = no mask, 1 = strict causal). Demonstrates Derivation 4 visually.
3. **Token-to-token attention flow** — for each query position, draw arrows to all key positions, with arrow thickness proportional to attention weight. Could be inline rather than full widget.

Recommend: (1) marquee, (2) secondary. Three widgets are unnecessary given the chapter's other rich content (5 derivations, 4 code blocks).

---

## Pre-research notes (for the human running these sessions)

This is the densest research file so far. Five derivations, 7 misconceptions, 6 tricky details. The chapter has both rigorous math (the $\sqrt{d_k}$ variance argument is one of the prettiest in deep learning) and dense intuition-building.

**Three chapter shapes have now been established:**
- **Ch 1** (neural net primitives): math-heavy, code-heavy, derivation-rich, 3 widgets, **5 files**
- **Ch 2** (embeddings): concept-heavy, less math, 2 widgets, **4 files**
- **Ch 3** (tokenization): algorithm-heavy, code-heavy, consequence-heavy, 2 widgets, **4 files**
- **Ch 4** (attention): math-heavy + concept-heavy + visual, 2 widgets, **4 files** — a hybrid

Ch 4 has Ch 1's mathematical density but with a smaller and more focused widget count. The 4-session model fits because attention's intuition can be delivered through a smaller number of carefully designed visualizations.

**The $\sqrt{d_k}$ derivation** is a chapter highlight. It's a clean variance calculation that explains a design choice in the foundational transformer paper. Most readers encountering it for the first time find it satisfying — math that *explains* an engineering choice. Build the chapter so this derivation lands with the impact it deserves.

**Attention has been written about extensively** in blogs, tutorials, papers, lecture notes. The chapter's job isn't to be the 1000th explanation; it's to be a *good* explanation that integrates with the surrounding chapters. Lean on:
- The previous chapters' framing (token IDs from Ch 3, embeddings from Ch 2)
- Forward references to Ch 5 (multi-head), Ch 6 (positional), Ch 7 (transformer block)
- Pedagogical rigor (the variance argument, not just "it works")

If after reading the chapter, the reader can:
1. State the attention formula
2. Explain why $\sqrt{d_k}$
3. Implement scaled dot-product attention in numpy
4. Explain causal masking
5. Distinguish self-attention from cross-attention
6. Articulate why attention is $O(n^2)$

— the chapter has done its job. These are the six pedagogical outcomes. The widgets, code, and prose all serve them.

This research file unlocks the most important single chapter in the tutorial. Build it with care.
