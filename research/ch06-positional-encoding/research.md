# Chapter 6 — Positional encoding: research

> Curated source material for Chapter 6's build sessions. Positional encoding is the small but consequential piece that turns the chapter-5 transformer block from a position-blind set processor into a position-aware sequence model. The chapter covers four approaches in order of historical and practical importance: **sinusoidal** (original), **learned** (BERT/GPT-2 era), **RoPE** (modern default), **ALiBi** (length extrapolation). RoPE deserves the most depth — every modern open-source LLM uses it.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Positional encoding

**Premise:** The transformer block from Chapter 5 is **permutation-equivariant** — shuffle the input sequence and the output shuffles identically. Language is not permutation-equivariant; "the dog bit the man" ≠ "the man bit the dog." Position information must enter the model somewhere. This chapter explores **where** and **how**.

**Out of scope (other chapters):**
- The attention mechanism itself (Ch 4)
- Multi-head attention and the block (Ch 5)
- Stacking blocks into a full LLM (Ch 7-8)
- KV cache and inference (Ch 17)

**In scope and locked:**
- Why position matters — attention's permutation equivariance
- **Sinusoidal positional encoding** (Vaswani et al. 2017): formula, properties, the implicit relative-position argument
- **Learned positional embeddings** (BERT, GPT-2): just a learnable lookup table for positions
- **Relative position embeddings** (Shaw et al. 2018): conceptual intro, not deep dive
- **Rotary Positional Embedding (RoPE)** (Su et al. 2021): the modern default — used by LLaMA, Mistral, Qwen, PaLM, and most open-source LLMs
- **ALiBi** (Press et al. 2021): linear-bias variant, used for length extrapolation
- **Length extrapolation**: why some schemes extend cleanly beyond training context, and others don't

**Suggested chapter structure** (8 sections):

1. Why position matters — attention is permutation-equivariant (~500 words)
2. Sinusoidal positional encoding (~900 words — central historical reference)
3. The implicit relative-position argument (~600 words)
4. Learned positional embeddings (~400 words)
5. Rotary Positional Embedding (RoPE) (~900 words — central modern reference)
6. ALiBi — linear attention biases (~500 words)
7. Length extrapolation: extending context at inference time (~500 words)
8. Bridge to training a small LLM (~300 words)

Target: ~4600 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Vaswani et al. 2017 — "Attention Is All You Need"
- **arXiv:** [1706.03762](https://arxiv.org/abs/1706.03762)
- **What it contributed for this chapter:** sinusoidal positional encoding. Section 3.5 introduces the formula. The paper claims (without proof) that sinusoidal allows the model to learn relative positions; subsequent papers (Shaw et al., Su et al.) made this rigorous.
- **For the chapter:** central historical reference. Cite when introducing sinusoidal PE.

### Su, Lu, Pan, Murtadha, Wen, Liu 2021 — "RoFormer: Enhanced Transformer with Rotary Position Embedding"
- **arXiv:** [2104.09864](https://arxiv.org/abs/2104.09864)
- **What it contributed:** RoPE (Rotary Positional Embedding). Encodes position as a rotation matrix applied to Q and K vectors *before* the attention dot product. Has the property that the inner product $q \cdot k$ depends only on the *relative position* of $q$ and $k$, without needing explicit relative-position embeddings.
- **For the chapter:** central modern reference. Used by LLaMA, Mistral, Qwen, PaLM, GPT-NeoX. Treat this as the chapter's centerpiece formula.

### Press, Smith, Lewis 2021 — "Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation"
- **arXiv:** [2108.12409](https://arxiv.org/abs/2108.12409)
- **What it contributed:** ALiBi (Attention with Linear Biases). Instead of adding positional encoding to the input, ALiBi adds a linear bias to the attention scores, with bias proportional to the distance between query and key positions. The "train short, test long" claim: ALiBi-trained models can be evaluated at much longer context than they were trained on.
- **For the chapter:** brief but important — covers in section 6. The length-extrapolation result is the headline.

### Shaw, Uszkoreit, Vaswani 2018 — "Self-Attention with Relative Position Representations"
- **arXiv:** [1803.02155](https://arxiv.org/abs/1803.02155)
- **What it contributed:** the first widely-adopted relative-position embedding scheme. Instead of adding position to the input, it modifies the attention computation to include learned relative-position offsets. Influential conceptually; less used in modern code than RoPE or ALiBi.
- **For the chapter:** brief mention in section 3 as the conceptual ancestor of RoPE.

### Chen, Wong, Chen, Tian 2023 — "Extending Context Window of Large Language Models via Positional Interpolation"
- **arXiv:** [2306.15595](https://arxiv.org/abs/2306.15595)
- **What it contributed:** positional interpolation (PI) — extending RoPE-trained models to longer contexts by scaling down the position indices at inference time. Also: the "NTK-aware" scaling variant. This and YaRN (further variant) are how 4K-trained models get extended to 128K+ context.
- **For the chapter:** brief mention in section 7 (length extrapolation). The full story is for an advanced reader; the chapter just notes that "RoPE can be extended via interpolation."

### Karpathy — `nanoGPT` (RoPE in LLaMA-style)
- **GitHub:** [github.com/karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)
- **What it is:** nanoGPT's GPT-2-style implementation uses learned positional embeddings. The LLaMA reference implementation (`build-nanogpt` repo) uses RoPE — the cleanest reference for "RoPE in 30 lines."
- **For the chapter:** cite as the canonical implementation reference for both styles.

---

## Core derivations

### Derivation 1: Sinusoidal positional encoding

**The formula** (Vaswani 2017):

For position $p$ and dimension index $i$ (with $0 \leq i < d_{\text{model}}$):

$$\text{PE}(p, 2k)   = \sin\!\left(\frac{p}{10000^{2k/d_{\text{model}}}}\right)$$

$$\text{PE}(p, 2k+1) = \cos\!\left(\frac{p}{10000^{2k/d_{\text{model}}}}\right)$$

where $k = i/2$ is the pair index (each pair of consecutive dimensions shares a frequency).

**Geometric interpretation:** the positional encoding for position $p$ is a vector where:
- Pairs of dimensions $(2k, 2k+1)$ form a unit vector in $\mathbb{R}^2$, rotated by angle $\theta_k(p) = p / 10000^{2k/d_{\text{model}}}$
- Different pairs use different frequencies: low pairs have *high* frequency (rotate quickly with $p$); high pairs have *low* frequency (rotate slowly)
- The lowest frequency has period $10000 \cdot 2\pi \approx 62831$ positions (extremely slow)
- The highest frequency has period $2\pi$ positions (very fast)

**Why this design:** the wide range of frequencies means different dimensions encode position at different "resolutions." The high-frequency dimensions distinguish nearby positions; the low-frequency dimensions distinguish far positions.

**How it's used:** added directly to the input embeddings before the first transformer block:

$$x_p^{(0)} = \text{embedding}(\text{token}_p) + \text{PE}(p)$$

### Derivation 2: Why sinusoidal implicitly encodes relative position

**The claim** (from Vaswani 2017, footnote): the sinusoidal PE allows the model to attend to relative positions because $\text{PE}(p + k)$ can be expressed as a linear function of $\text{PE}(p)$.

**Why:** consider one frequency pair $(2k, 2k+1)$. The PE at position $p$ for this pair is $(\sin(\omega_k p), \cos(\omega_k p))$ where $\omega_k = 1/10000^{2k/d_{\text{model}}}$.

Using the angle-addition identities:

$$\sin(\omega_k (p + \Delta)) = \sin(\omega_k p)\cos(\omega_k \Delta) + \cos(\omega_k p)\sin(\omega_k \Delta)$$

$$\cos(\omega_k (p + \Delta)) = \cos(\omega_k p)\cos(\omega_k \Delta) - \sin(\omega_k p)\sin(\omega_k \Delta)$$

This is a **linear transformation** of $(\sin(\omega_k p), \cos(\omega_k p))$ — specifically, multiplication by a rotation matrix $R(\omega_k \Delta)$. The rotation matrix only depends on $\Delta$ (the relative position), not on $p$.

So the model can, in principle, learn linear projections that compute attention based on the relative offset $\Delta$ rather than absolute positions $p$ and $p + \Delta$ separately. The model has to *learn* this; it's not given for free.

**Caveat:** the claim "sinusoidal allows the model to attend to relative positions" is true in a *representational* sense (the information is there) but not always realized in practice. Empirically, learned position embeddings often outperform sinusoidal for in-distribution evaluation; sinusoidal generalizes better to longer sequences.

### Derivation 3: RoPE — Rotary Positional Embedding

**The setup:** instead of adding positional encoding to the input embeddings, RoPE applies a position-dependent rotation to the Q and K vectors *inside* the attention layer (before the dot product). The V vectors are unchanged.

**For a 2-dimensional vector** (a single pair of features), the rotation by angle $\theta$ is:

$$R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}$$

**RoPE's recipe:** treat the $d_k$-dimensional Q and K vectors as $d_k/2$ pairs of 2D vectors. For position $p$ and pair $k$, rotate the $k$-th pair by angle $\theta_k(p) = p \cdot \omega_k$ where $\omega_k = 1/10000^{2k/d_k}$ (same frequency schedule as sinusoidal).

**The key property:** for queries at position $m$ and keys at position $n$, the rotated dot product reduces to:

$$\langle R(m\omega) q, \, R(n\omega) k \rangle = \langle q, \, R((n - m)\omega) k \rangle$$

(This is a property of rotations: $R(\alpha)^\top R(\beta) = R(\beta - \alpha)$.) The dot product depends only on the **relative position** $n - m$, not on the absolute positions $m$ and $n$.

**What this gets you:**
- Relative-position-only attention scores (the cleanest possible relative encoding)
- No additional parameters (the rotation is determined by position; nothing is learned)
- Extends naturally to longer sequences (with caveats — see section 7)

**Concrete formula** (more explicit):

Let $q \in \mathbb{R}^{d_k}$ at position $m$ be split into pairs $(q^{(1)}, q^{(2)}, \ldots, q^{(d_k/2)})$, each in $\mathbb{R}^2$. The RoPE-transformed $q$ at position $m$ is:

$$\tilde{q}_m^{(k)} = R(m \omega_k) \, q^{(k)} = \begin{pmatrix} \cos(m\omega_k) & -\sin(m\omega_k) \\ \sin(m\omega_k) & \cos(m\omega_k) \end{pmatrix} q^{(k)}$$

Same for $k$ vectors. The attention scores are then $\tilde{q}_m \cdot \tilde{k}_n$, which by the property above depends only on $n - m$.

### Derivation 4: ALiBi — Attention with Linear Biases

**The setup:** ALiBi (Press, Smith, Lewis 2021) doesn't add positional encoding to inputs at all. Instead, it adds a **linear bias** to the attention scores, proportional to the distance between query and key positions.

**The formula:** for query at position $m$ and key at position $n$ (where $n \leq m$ for causal attention):

$$\text{scores}_{mn} = \frac{q_m \cdot k_n}{\sqrt{d_k}} - m_h \cdot |m - n|$$

where $m_h$ is a head-specific slope (different value per attention head). The bias is *subtracted*: more distant positions get *lower* attention scores, encouraging the model to focus on nearby positions.

**Head-specific slopes:** for $h$ heads, the slopes are chosen as $m_h = 2^{-8h/H}$ where $H$ is the total number of heads. This means different heads have different "decay rates" — some focus on local context, others on more distant context.

**Why ALiBi extrapolates well:** the bias is a *function of distance*, not a learned position-specific embedding. At inference time, even if you're processing positions outside the training range, the linear-distance bias still works correctly. No retraining needed for longer contexts.

**Trade-off vs RoPE:** ALiBi is simpler and extrapolates more naturally, but is generally considered slightly less expressive for in-distribution tasks. Modern LLMs mostly use RoPE; some (BLOOM, some MosaicML models) use ALiBi.

---

## Glossary

- **Permutation equivariance:** the property that shuffling the input shuffles the output identically. Self-attention has this property. Adding position breaks it (desirably, for language).
- **Positional encoding (PE):** a representation of position used to inject sequence information into a position-blind model.
- **Absolute positional encoding:** encodes "this is position 5" — gives each position a unique vector.
- **Relative positional encoding:** encodes "this is 3 positions away" — operates on offsets.
- **Sinusoidal PE:** the original from Vaswani et al. — sin/cos waves at multiple frequencies.
- **Learned PE:** a positional vocabulary like a regular embedding lookup. Used by BERT, GPT-2.
- **RoPE (Rotary Positional Embedding):** rotates Q and K vectors by position-dependent angles before the dot product. Modern default.
- **ALiBi (Attention with Linear Biases):** adds linear distance-based biases to attention scores. Length-extrapolation friendly.
- **Length extrapolation:** the ability to process sequences longer than seen during training. RoPE + interpolation, ALiBi support this; learned PE does not.
- **Position interpolation (PI):** scaling down position indices when extending a RoPE model to longer context.
- **YaRN, NTK-aware scaling:** advanced RoPE extension techniques. Mentioned in research, not depth in the chapter.
- **Context window:** the maximum sequence length a model can process.
- **Frequency schedule:** the choice of frequencies $\omega_k$ in sinusoidal PE or RoPE. Standard: $\omega_k = 1 / 10000^{2k/d}$.

---

## Pedagogical analogies

### 1. Position as "where in the sentence" labels
Without position, every token is just "a token of type X" — the model sees a bag of tokens. Position adds "this token is at slot 5." Different positions get different labels; the model learns to use these labels to distinguish word orderings.

**Best used for:** section 1 motivation. Concretizes the abstract claim about permutation equivariance.

### 2. Sinusoidal as a "fingerprint" at multiple scales
Each position gets a unique fingerprint composed of waves at many frequencies. High-frequency waves change quickly (distinguish positions 5 and 6); low-frequency waves change slowly (distinguish positions 5 and 5000). The model can use whichever resolution matters for the task.

**Best used for:** section 2, motivating the multi-frequency design of sinusoidal PE.

### 3. RoPE as "rotating the question and answer by the same amount"
In attention, the query at position $m$ asks a question, and the key at position $n$ provides an answer. RoPE rotates the query by angle proportional to $m$, and the key by angle proportional to $n$. When the dot product is computed, only the *difference* $n - m$ matters — because rotating both by the same amount cancels out, leaving only the relative offset.

**Best used for:** section 5 introducing RoPE. The "rotate question and answer together" framing makes the relative-position property intuitive.

### 4. ALiBi as "distant tokens whisper, nearby tokens shout"
ALiBi subtracts a distance-proportional bias from attention scores. Tokens close to the query get nearly full attention; tokens far away have their scores reduced. The model has a built-in locality bias — useful for both efficiency and length extrapolation.

**Best used for:** section 6 introducing ALiBi.

---

## Common misconceptions

### MC1: "Attention has positional information."
**Reality:** plain self-attention is **permutation-equivariant**. Shuffle the input sequence and the output is shuffled identically. Position information must be injected from outside — that's what this chapter is about. The misconception arises because attention seems "obvious enough to handle position"; it doesn't.

### MC2: "Sinusoidal encodes only absolute position."
**Reality:** sinusoidal PE *can* be used to compute relative positions, because $\text{PE}(p + \Delta)$ is a linear function of $\text{PE}(p)$ (Derivation 2). The model has to *learn* to use this property; it's there representationally. In practice, sinusoidal often works less well than RoPE because the model rarely learns the optimal relative-position decomposition.

### MC3: "Learned positional embeddings are always better than sinusoidal."
**Reality:** learned PE is better *within the training context length* on in-distribution evaluation. But learned PE doesn't generalize to longer sequences (there's no embedding for position 5000 if you only trained on positions 0-2048). Sinusoidal extrapolates somewhat better; RoPE and ALiBi extrapolate even better.

### MC4: "RoPE replaces sinusoidal PE — they do the same thing."
**Reality:** they encode position at different layers. Sinusoidal PE adds to the *input embeddings* (once, before the first block). RoPE rotates *Q and K vectors* in every attention layer (every block, every layer). RoPE's per-layer application is part of why it's more expressive — position information is re-injected at every layer.

### MC5: "Position encoding only affects the input layer."
**Reality:** depends on the scheme. Sinusoidal/learned PE only modifies the input; the position information then "propagates" through the network via the residual stream. RoPE modifies attention in every layer, so position is freshly applied at each layer. ALiBi modifies attention scores in every layer too.

### MC6: "Length extrapolation is automatic."
**Reality:** very few PE schemes extrapolate well. Learned PE doesn't (no embeddings exist for unseen positions). Sinusoidal does in principle, but empirical results show degradation. ALiBi extrapolates cleanly (linear-distance bias works at any range). RoPE extrapolates with techniques like position interpolation (PI) or NTK-aware scaling. Modern long-context models (128K+) use RoPE + sophisticated extension techniques.

### MC7: "RoPE has parameters."
**Reality:** RoPE is **parameter-free**. The rotation angles are determined by position and dimension; nothing is learned. This is partly why it's so widely adopted — adds no parameters, no extra compute beyond a few sin/cos.

---

## Tricky implementation details

### TID1: Sinusoidal PE shape and broadcasting
The PE is precomputed as a `(max_len, d_model)` matrix. To add to a `(batch, seq_len, d_model)` input, slice `PE[:seq_len]` and broadcast. The broadcast is along the batch dimension.

### TID2: Sinusoidal PE scale
The PE values are in $[-1, 1]$ (sin and cos output range). The input embeddings are typically initialized with std ~0.02 — they have much smaller magnitudes than PE. The original Vaswani paper scales the *embeddings* by $\sqrt{d_{\text{model}}}$ before adding PE, balancing the scales. Some implementations skip this; results vary.

### TID3: RoPE implementation as element-wise complex multiplication
The standard RoPE implementation pairs adjacent dimensions and rotates each pair. An efficient way to code this is to interpret each Q/K vector as a vector of complex numbers (`d_k/2` complex), multiply element-wise by `exp(i * m * omega)`, then unpack back to reals. This is what most production code does.

### TID4: RoPE base
The frequency schedule uses base 10000 by default. Some long-context models increase this base (e.g., LLaMA-3 uses base 500000) to better support long contexts. Position interpolation effectively changes the *effective* base.

### TID5: ALiBi only for causal attention
ALiBi's linear distance bias is typically applied only in the causal-attention case. For bidirectional attention (BERT), ALiBi has limited use.

### TID6: Max sequence length and PE table size
For learned or sinusoidal PE, the embedding table must be sized for the maximum sequence length expected. Sizing too small means the model can't process longer sequences; sizing too large wastes parameters (learned PE only — sinusoidal is free).

---

## Reference implementations

### Sinusoidal PE in numpy

```python
import numpy as np

def sinusoidal_pe(max_len, d_model):
    """Compute (max_len, d_model) sinusoidal positional encoding."""
    position = np.arange(max_len)[:, np.newaxis]                  # (max_len, 1)
    div_term = np.exp(np.arange(0, d_model, 2) * -(np.log(10000.0) / d_model))   # (d_model/2,)

    pe = np.zeros((max_len, d_model))
    pe[:, 0::2] = np.sin(position * div_term)
    pe[:, 1::2] = np.cos(position * div_term)
    return pe

# Demo
PE = sinusoidal_pe(max_len=100, d_model=64)
print(f"PE shape: {PE.shape}")
print(f"PE range: [{PE.min():.3f}, {PE.max():.3f}]")
print(f"PE[0, :8] (position 0, first 8 dims): {PE[0, :8].round(3)}")
print(f"PE[50, :8] (position 50, first 8 dims): {PE[50, :8].round(3)}")
```

### Learned PE (basically just an embedding lookup)

```python
import numpy as np

class LearnedPE:
    def __init__(self, max_len, d_model, seed=42):
        rng = np.random.default_rng(seed)
        self.embeddings = rng.normal(0, 0.02, (max_len, d_model))

    def __call__(self, seq_len):
        """Return positions 0..seq_len-1 as a (seq_len, d_model) matrix."""
        return self.embeddings[:seq_len]

# Usage:
# pe = LearnedPE(max_len=2048, d_model=768)
# X_with_pe = X + pe(seq_len=128)
```

### RoPE in numpy

```python
import numpy as np

def rope(x, position_ids, base=10000.0):
    """
    Apply Rotary Positional Embedding to a tensor x.
    x: (seq_len, d_k) — Q or K
    position_ids: (seq_len,) — integer positions (typically arange(seq_len))
    base: frequency base (default 10000)

    Returns: x with RoPE applied — same shape.
    """
    seq_len, d_k = x.shape
    assert d_k % 2 == 0, "RoPE requires even d_k"

    # Compute frequencies: omega_k = 1 / base^(2k/d_k) for k = 0, 1, ..., d_k/2 - 1
    indices = np.arange(0, d_k, 2)   # 0, 2, 4, ...
    inv_freq = 1.0 / (base ** (indices / d_k))   # (d_k/2,)

    # Compute angles: position * omega
    # shape: (seq_len, d_k/2)
    angles = position_ids[:, None] * inv_freq[None, :]

    # Treat x as pairs of (real, imag)
    # x_pairs[i, j] = (x[i, 2j], x[i, 2j+1])
    x_even = x[:, 0::2]   # (seq_len, d_k/2)
    x_odd = x[:, 1::2]    # (seq_len, d_k/2)

    cos = np.cos(angles)
    sin = np.sin(angles)

    # Rotation: (a, b) -> (a*cos - b*sin, a*sin + b*cos)
    out_even = x_even * cos - x_odd * sin
    out_odd = x_even * sin + x_odd * cos

    # Interleave back
    out = np.empty_like(x)
    out[:, 0::2] = out_even
    out[:, 1::2] = out_odd
    return out

# Demo: RoPE applied to a 6-position Q vector
seq_len, d_k = 6, 8
rng = np.random.default_rng(42)
Q = rng.normal(0, 1, (seq_len, d_k))
positions = np.arange(seq_len)

Q_roped = rope(Q, positions)
print(f"Original Q[0, :4]:   {Q[0, :4].round(3)}")
print(f"Roped Q[0, :4]:      {Q_roped[0, :4].round(3)}")    # position 0: angle 0; should be same
print(f"Original Q[5, :4]:   {Q[5, :4].round(3)}")
print(f"Roped Q[5, :4]:      {Q_roped[5, :4].round(3)}")    # position 5: rotated
```

### Verifying RoPE's relative-position property

```python
# Property: <RoPE(q, m), RoPE(k, n)> = <q, R(n-m) k>
# Equivalently: rotating both q and k by the same shift preserves the dot product

q = rng.normal(0, 1, (1, d_k))
k = rng.normal(0, 1, (1, d_k))

# Compute dot products at various position pairs
pairs = [(0, 5), (1, 6), (2, 7), (3, 8)]  # all have relative offset 5
print("Verifying that dot product depends only on relative position (offset = 5):")
for m, n in pairs:
    q_rot = rope(q, np.array([m]))
    k_rot = rope(k, np.array([n]))
    dot = (q_rot @ k_rot.T)[0, 0]
    print(f"  q at pos {m}, k at pos {n}:  q_rot · k_rot = {dot:.6f}")
# All values should be the same (within float precision)
```

### ALiBi linear bias

```python
import numpy as np

def alibi_bias(seq_len, n_heads):
    """Compute ALiBi bias matrix: (n_heads, seq_len, seq_len).
    Each head has its own slope; bias is -slope * |m - n|."""
    # Head-specific slopes (powers of 2)
    slopes = 2.0 ** (-8.0 * np.arange(1, n_heads + 1) / n_heads)

    # Distance matrix: |m - n| for m, n in [0, seq_len)
    positions = np.arange(seq_len)
    distance = np.abs(positions[:, None] - positions[None, :])   # (seq_len, seq_len)

    # bias[h, m, n] = -slopes[h] * distance[m, n]
    bias = -slopes[:, None, None] * distance[None, :, :]
    return bias

# Demo
bias = alibi_bias(seq_len=8, n_heads=4)
print(f"Bias shape: {bias.shape}")
print(f"Head 0 (slope ≈ {2**(-8/4):.3f}) bias matrix:")
print(bias[0].round(2))
```

---

## Connections to other chapters

- **Ch 4 (Attention):** the operation that's permutation-equivariant; positional encoding is what fixes this.
- **Ch 5 (Multi-head + block):** the chapter's block doesn't include positional information — that's added before the first block. For RoPE, applied inside each attention layer.
- **Ch 7 (Training a small LLM — could be its own chapter):** the model architecture choice includes which PE to use. nanoGPT uses learned; LLaMA reference uses RoPE.
- **Ch 8 (Building a small LLM):** position encoding choice is a design decision. The chapter's reference architecture should use one (probably RoPE, since it's the modern default).
- **Ch 17 (Inference optimization):** the KV cache stores K and V vectors. For RoPE, K is stored *after* the rotation has been applied — meaning the cached K already has its positional encoding baked in. This affects how rotated K can be re-used in subsequent positions.
- **Ch 22 (Retrieval & RAG):** retrieval embeddings often use position-agnostic representations. The interaction between RAG and positional encoding is non-trivial; mention briefly.

---

## Open questions for the chapter author

### Q1: How deep on the implicit relative-position argument (Derivation 2)?
**Recommendation:** include the full trig identity in section 3, but don't belabor it. The pedagogical claim is "sinusoidal allows but doesn't ensure relative-position attention" — calibrating the reader's expectations.

### Q2: How much ALiBi to cover?
**Recommendation:** one section (section 6) of ~500 words. Cover the formula and the length-extrapolation property. Don't derive head-specific slopes in full.

### Q3: Should the chapter cover position interpolation (PI), NTK-aware scaling, YaRN?
**Recommendation:** brief mention in section 7. These are advanced topics; depth would derail the chapter. One paragraph saying "RoPE can be extended via these techniques" with citations.

### Q4: Relative position embeddings (Shaw et al. 2018) — depth?
**Recommendation:** one paragraph in section 3 as the conceptual predecessor of RoPE. Don't derive; cite.

### Q5: Should the runnable code in section 5 include the relative-position property verification?
**Recommendation:** yes. The verification (showing that RoPE preserves dot product for the same relative offset) is the kind of "see it with your own eyes" demonstration that makes the math click. Include the loop checking that dot products at offsets (0,5), (1,6), (2,7), (3,8) are all equal.

### Q6: Widget candidates
1. **Sinusoidal PE visualizer (marquee, session 28):** a 2D heatmap with position on the y-axis and dimension on the x-axis, cells colored by PE value. The classic "stripe pattern" emerges — high-frequency on the left dimensions, low-frequency on the right. Slider to switch between sinusoidal and learned PE views. **Recommended marquee.**
2. **RoPE rotation visualizer (secondary, session 29):** show Q vectors at different positions rotating by their position-dependent angles. Pairs of dimensions form 2D rotations. The reader can see the rotation accumulate as position increases. **Recommended secondary.**
3. **PE comparison playground (alternative):** type a sequence length, see how each PE scheme would look. Less pedagogically central; the marquee already shows sinusoidal.

Recommend (1) and (2).

---

## Pre-research notes

Ch 6 is a single-topic chapter (positional encoding) with multiple variants. Unlike Ch 5 (which had two genuinely distinct topics — multi-head AND the block), Ch 6 has one main topic with four variants. **The 4-file cadence applies** (research + 3 chapter sessions, with file 42 absorbed into the closeout).

The chapter has a natural pedagogical arc:
1. Why position matters (sections 1)
2. The original solution (sections 2-3: sinusoidal)
3. The simpler intermediate (section 4: learned)
4. The modern default (section 5: RoPE — the centerpiece)
5. The alternative (section 6: ALiBi)
6. The extrapolation story (section 7)

RoPE deserves the most depth. It's used by every modern open-source LLM and has the cleanest mathematical structure. The chapter prose should treat it as the "destination" — earlier sections build toward understanding it.

**Pedagogical outcomes for the reader.** After Ch 6, the reader should be able to:
1. State why attention is permutation-equivariant and what that means for language
2. Compute sinusoidal PE values for given positions and dimensions
3. Explain why sinusoidal *can* but doesn't always encode relative positions
4. State the difference between learned and sinusoidal PE
5. Implement RoPE in numpy, verifying the relative-position property
6. Explain ALiBi and why it extrapolates well
7. Articulate which PE schemes used in modern LLMs (LLaMA = RoPE, BERT = learned, etc.)

Seven outcomes. The chapter is dense for its size; widgets and code blocks need to be focused.

This chapter is the last "structural" gap. After Ch 6, the reader has every architectural piece needed to build a transformer from scratch. Ch 7+ shifts to training, optimization, and deployment.
