# Chapter 5 — Multi-head attention and the transformer block: research

> Curated source material for Chapter 5's build sessions. This is a **two-topic chapter** — multi-head attention extends Ch 4's single-head attention, and the transformer block wraps attention with FFN, residuals, and layer norm. The chapter covers both because they're the minimum unit of what a "transformer layer" actually is. Builds the bridge from Ch 4's isolated attention operation to Ch 8's full LLM.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Multi-head attention and the transformer block

**Premise:** Ch 4 covered a single attention head. Real models have many — typically 8, 12, or more parallel attention heads per layer, each with their own learned projections. After computing attention, the output passes through a feedforward network (FFN), with residual connections wrapping both operations and layer norms keeping activations stable. This bundle — multi-head attention + FFN + residuals + layer norm — is the *transformer block*, the unit that stacks N times to form a transformer.

**Out of scope (other chapters):**
- The Q, K, V mechanics of attention itself (Ch 4)
- Positional encoding (Ch 6)
- The full model: embedding + N blocks + output head (Ch 8)
- KV cache and inference (Ch 17)

**In scope and locked:**
- Multi-head attention: parallel heads, $d_k = d_v = d_{\text{model}} / h$ convention
- Parameter and compute accounting for multi-head
- The feedforward network (FFN): linear → activation → linear with 4× expansion
- Activation function choices: ReLU → GELU → SwiGLU
- Residual connections: gradient flow argument
- Layer normalization: the formula and why
- Pre-LN vs Post-LN ordering
- The full transformer block forward pass
- Stacking blocks: depth → capability

**Suggested chapter structure** (8 sections, possibly 9 if Pre-LN/Post-LN gets its own):

1. The setup — why multiple heads (~500 words)
2. Multi-head attention: the parallel-heads architecture (~900 words)
3. Parameter and compute accounting (~500 words)
4. The feedforward network (FFN) (~700 words)
5. Residual connections — why they matter (~500 words)
6. Layer normalization (~600 words)
7. The full transformer block — Pre-LN vs Post-LN (~700 words)
8. Stacking blocks: depth and capability (~400 words)
9. Bridge to positional encoding (~200 words)

Target: ~5000 words plus 2 widgets and 4-5 runnable code blocks.

---

## Key papers and references

### Vaswani et al. 2017 — "Attention Is All You Need"
- **arXiv:** [1706.03762](https://arxiv.org/abs/1706.03762)
- **What it contributed for this chapter:** the multi-head attention architecture itself, the FFN with $d_{\text{ff}} = 4 \cdot d_{\text{model}}$ expansion ratio (in the original transformer), and the original Post-LN transformer block. Section 3.2 details multi-head; section 3.3 details the FFN.
- **For the chapter:** central reference. Same paper as Ch 4. Cite extensively.

### He, Zhang, Ren, Sun 2016 — "Deep Residual Learning for Image Recognition"
- **arXiv:** [1512.03385](https://arxiv.org/abs/1512.03385)
- **What it contributed:** residual connections (skip connections, "ResNets"). Showed that with residuals, networks could be trained to 100+ layers without degradation. The gradient-flow argument: residual connections create a direct path for gradients to flow back through the network without vanishing.
- **For the chapter:** cite when introducing residuals (section 5). The transformer didn't invent residuals; it inherited them from CNN research.

### Ba, Kiros, Hinton 2016 — "Layer Normalization"
- **arXiv:** [1607.06450](https://arxiv.org/abs/1607.06450)
- **What it contributed:** Layer Normalization — normalize across the feature dimension within a single sample, rather than across the batch dimension (as in BatchNorm). Better for sequence models because: independent of batch size, doesn't require running statistics, works correctly during inference.
- **For the chapter:** cite when introducing layer norm (section 6). The transformer paper used Post-LN; modern transformers use Pre-LN.

### Xiong et al. 2020 — "On Layer Normalization in the Transformer Architecture"
- **arXiv:** [2002.04745](https://arxiv.org/abs/2002.04745)
- **What it contributed:** showed that Pre-LN transformers (norm before attention/FFN, residuals around) train more stably than Post-LN transformers (residuals first, then norm). Pre-LN doesn't require learning-rate warmup; Post-LN does. Modern transformers (GPT-2/3/4, LLaMA) all use Pre-LN.
- **For the chapter:** cite in section 7. The Pre-LN vs Post-LN distinction is a small architectural detail with significant training-stability consequences.

### Hendrycks & Gimpel 2016 — "Gaussian Error Linear Units (GELUs)"
- **arXiv:** [1606.08415](https://arxiv.org/abs/1606.08415)
- **What it contributed:** the GELU activation function: $\text{GELU}(x) = x \cdot \Phi(x)$ where $\Phi$ is the standard normal CDF. Smoother than ReLU; used in GPT-2/3, BERT, and most modern transformers.
- **For the chapter:** brief mention in section 4. The activation choice is a small but consequential detail; most modern code uses GELU or SwiGLU rather than ReLU.

### Shazeer 2020 — "GLU Variants Improve Transformer"
- **arXiv:** [2002.05202](https://arxiv.org/abs/2002.05202)
- **What it contributed:** SwiGLU — the FFN variant that gates one branch of the FFN with a sigmoid-linear unit. Used by LLaMA, Mistral, and most modern open-source LLMs. Slightly better than GELU empirically.
- **For the chapter:** brief mention in section 4. Modern FFNs are SwiGLU, not pure GELU; the chapter should note this.

### Karpathy — `nanoGPT`
- **GitHub:** [github.com/karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)
- **For the chapter:** the canonical minimal reference implementation of a transformer block. The `Block` class is ~30 lines and shows Pre-LN + multi-head attention + FFN + residuals in a clean structure.

---

## Core derivations

### Derivation 1: Multi-head attention — the architecture

**Setup:** in single-head attention (Ch 4), we had one $W^Q, W^K, W^V$ projecting $X \in \mathbb{R}^{n \times d_{\text{model}}}$ into Q, K, V of dimension $d_k$. The output was $n \times d_v$.

**Multi-head attention** generalizes this with $h$ parallel "heads," each with their own projections:

$$\text{head}_i = \text{Attention}(X W_i^Q, X W_i^K, X W_i^V)$$

where $W_i^Q, W_i^K \in \mathbb{R}^{d_{\text{model}} \times d_k}$ and $W_i^V \in \mathbb{R}^{d_{\text{model}} \times d_v}$.

**Combining heads:** concatenate along the feature dimension and project through a final linear layer:

$$\boxed{\text{MultiHead}(X) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) \cdot W^O}$$

where $W^O \in \mathbb{R}^{h \cdot d_v \times d_{\text{model}}}$ is the output projection.

**The $d_k = d_v = d_{\text{model}} / h$ convention:** if we set the per-head dimensions to $d_{\text{model}} / h$, then:
- Total parameters across heads: $h \times 3 \times d_{\text{model}} \times (d_{\text{model}}/h) = 3 \cdot d_{\text{model}}^2$. Same as single-head attention.
- Concatenated output dim: $h \times d_v = d_{\text{model}}$. Matches input dim; the output projection $W^O$ is $d_{\text{model}} \times d_{\text{model}}$ (square).
- Compute per head: $O(n^2 \cdot d_k) = O(n^2 \cdot d_{\text{model}} / h)$. Total across $h$ heads: $O(n^2 \cdot d_{\text{model}})$. Same as single-head attention.

**Why this matters:** multi-head attention has **the same parameter count and same compute** as single-head attention at the same $d_{\text{model}}$. The split into $h$ heads is a *representation* choice, not a capacity choice. Each head gets a smaller dimension to play with, but the total work is identical.

**What heads learn (empirically):** different heads tend to specialize. One head might focus on adjacent positions; another on long-range syntactic dependencies; another on coreference patterns. With $h$ heads, the layer has $h$ different "views" of the sequence. Whether each head is truly distinct varies by training — many heads end up redundant in practice.

### Derivation 2: Parameter accounting

For a single transformer layer (one block), the parameter breakdown is:

| Component | Parameter count |
|---|---|
| $W^Q, W^K, W^V$ (across all heads) | $3 \cdot d_{\text{model}}^2$ |
| $W^O$ (output projection) | $d_{\text{model}}^2$ |
| **Multi-head total** | **$4 \cdot d_{\text{model}}^2$** |
| FFN up-projection ($d \to 4d$) | $4 \cdot d_{\text{model}}^2$ |
| FFN down-projection ($4d \to d$) | $4 \cdot d_{\text{model}}^2$ |
| **FFN total** | **$8 \cdot d_{\text{model}}^2$** |
| Layer norm scales (2 layer norms) | $2 \cdot d_{\text{model}}$ |
| **Block total** | **$12 \cdot d_{\text{model}}^2 + 2 d_{\text{model}}$** |

**Surprising implication:** FFN has **twice the parameters** of multi-head attention in a standard transformer block. The 4× expansion in the FFN is most of the layer's parameter count.

For GPT-3 175B (96 layers, $d_{\text{model}} = 12288$): each block is ~$12 \cdot 12288^2 = 1.8$B parameters. Total transformer blocks: $96 \cdot 1.8\text{B} = 173$B (the rest are embeddings).

### Derivation 3: Residual connections — the gradient-flow argument

A residual connection wraps a function $f$ such that the output is $\text{output} = \text{input} + f(\text{input})$.

**Forward:** if $f$ is the attention or FFN sub-layer, then:

$$h_{\text{out}} = h_{\text{in}} + f(h_{\text{in}})$$

**Backward:** the gradient through this operation is:

$$\frac{\partial \mathcal{L}}{\partial h_{\text{in}}} = \frac{\partial \mathcal{L}}{\partial h_{\text{out}}} \cdot \left(I + \frac{\partial f}{\partial h_{\text{in}}}\right) = \frac{\partial \mathcal{L}}{\partial h_{\text{out}}} + \frac{\partial \mathcal{L}}{\partial h_{\text{out}}} \cdot \frac{\partial f}{\partial h_{\text{in}}}$$

**The key observation:** the gradient has two paths. One flows directly through $I$ (the identity); the other flows through $\partial f / \partial h_{\text{in}}$. Even if $f$'s Jacobian has small singular values (gradients vanishing), the identity path preserves the gradient.

**Consequence:** very deep networks (50+ layers) become trainable. Without residuals, gradients can vanish exponentially in depth; with residuals, they degrade only via the additive nudges from each $f$.

**The "highway" framing:** residuals create a "skip lane" through the network. Information (forward) and gradients (backward) can flow through the skip lane without passing through $f$. Each $f$ adds a small refinement; the skip lane carries the bulk of the signal.

### Derivation 4: Layer normalization formula

For an input vector $x \in \mathbb{R}^{d}$ (a single token's features), layer norm computes:

$$\mu = \frac{1}{d} \sum_{i=1}^{d} x_i, \qquad \sigma^2 = \frac{1}{d} \sum_{i=1}^{d} (x_i - \mu)^2$$

$$\text{LayerNorm}(x) = \gamma \odot \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta$$

where $\gamma, \beta \in \mathbb{R}^d$ are learnable scale and shift parameters, and $\epsilon$ is a small constant (typically $10^{-5}$) for numerical stability.

**Interpretation:** normalize each token's feature vector to have zero mean and unit variance, then apply a learned per-feature scale and shift. The normalization is *across features* of one token, not across tokens.

**Compared to BatchNorm:**
- **BatchNorm** normalizes across the batch dimension (per-feature statistics across many examples). Requires running mean/variance; sensitive to batch size; problematic for variable-length sequences.
- **LayerNorm** normalizes across the feature dimension (per-example statistics across features). No running stats; batch-size independent; works for any sequence length.

For transformers, LayerNorm is strictly preferred. The chapter doesn't need to derive BatchNorm; mention the contrast and move on.

**Modern variant — RMSNorm** (Zhang & Sennrich 2019): drop the mean subtraction; only normalize by RMS. Used by LLaMA, T5, and others. Saves a small amount of compute; comparable quality. Note as a variation; don't go deep.

### Derivation 5: Pre-LN vs Post-LN

**Post-LN** (original transformer):
$$h = \text{LayerNorm}(h_{\text{in}} + \text{Sublayer}(h_{\text{in}}))$$

**Pre-LN** (modern transformers):
$$h = h_{\text{in}} + \text{Sublayer}(\text{LayerNorm}(h_{\text{in}}))$$

The difference: in Post-LN, normalization comes *after* the residual addition; in Pre-LN, normalization comes *before* the sublayer (attention or FFN) and the residual wraps the whole thing.

**Why Pre-LN is preferred:**
- The residual path is "clean" — pure identity flowing through without normalization. Gradients flow straight back along this path.
- No learning-rate warmup needed. Post-LN models require careful warmup schedules; Pre-LN models train stably with constant or cosine-decay learning rates.
- Empirically: better stability at depth.

**Modern usage:** GPT-2, GPT-3, GPT-4, LLaMA, Mistral all use Pre-LN. The original transformer paper used Post-LN; this is a rare case where the published architecture has been displaced in practice.

---

## Glossary

- **Multi-head attention:** $h$ parallel attention operations, each with their own learned Q, K, V projections, concatenated and projected through an output matrix.
- **Attention head:** one of the parallel attention operations in multi-head attention. Each head has its own $W^Q, W^K, W^V$.
- **Number of heads ($h$):** the number of parallel attention operations. Typical values: 8 (small models), 16 (GPT-2), 32 (LLaMA-7B), 96 (GPT-3).
- **Head dimension ($d_k$, $d_v$):** the per-head Q/K and V dimensions. By convention $d_k = d_v = d_{\text{model}} / h$.
- **Output projection ($W^O$):** the final linear layer that maps the concatenated head outputs back to $d_{\text{model}}$.
- **Feedforward network (FFN):** the position-wise MLP that follows attention in each transformer block. Standard form: $\text{Linear}(d \to 4d) \to \text{Activation} \to \text{Linear}(4d \to d)$.
- **Expansion ratio:** the ratio of FFN hidden dim to model dim. Standard: 4. Some variants use 2.66 (LLaMA's SwiGLU effectively, due to the gating).
- **GELU:** Gaussian Error Linear Unit. $\text{GELU}(x) = x \cdot \Phi(x)$. Smoother than ReLU; common in transformers.
- **SwiGLU:** an FFN variant using a sigmoid-linear gating: $\text{SwiGLU}(x) = \text{Swish}(xW_1) \odot (xW_2)$, then projected. Used by LLaMA, Mistral.
- **Residual connection / skip connection:** $\text{output} = \text{input} + f(\text{input})$. Provides a direct gradient path.
- **Layer normalization (LayerNorm):** per-token feature normalization. Zero mean, unit variance, learned scale and shift.
- **RMSNorm:** simplified LayerNorm without mean subtraction. Used by LLaMA.
- **Pre-LN / Post-LN:** the ordering of layer norm relative to the residual. Pre-LN: norm inside the residual; Post-LN: norm wrapping the residual.
- **Transformer block / layer:** the unit consisting of multi-head attention + FFN + residuals + layer norms. A transformer has $N$ stacked blocks.

---

## Pedagogical analogies

### 1. Multi-head as multiple "perspectives" on the same sequence
A single attention head decides "where to look" using one set of learned projections. Multi-head attention runs $h$ such decisions in parallel — each head can specialize in a different kind of relationship (recent context, syntactic dependency, coreference). The model gets $h$ views instead of one. The final output projection $W^O$ blends them.

**Best used for:** introducing multi-head in section 1. The "perspectives" framing motivates the architectural choice naturally.

### 2. The transformer block as an "edit operation"
Each block takes the current representation, computes an edit (attention + FFN), and adds the edit to the existing representation (residual). The output is the input plus a refinement. Stacking $N$ blocks applies $N$ refinements; each one nudges the representation closer to whatever it needs to be for the final task.

**Best used for:** introducing residuals and the block structure in sections 5-7. Makes the "additive nudges" intuition geometric.

### 3. Layer norm as "resetting the scale at every step"
Without normalization, activations can grow or shrink as they propagate through layers. Some neurons saturate; others vanish. Layer norm forces every token's feature vector back to a standard scale (zero mean, unit variance) at every block boundary. The model learns to operate at a known scale; training becomes stable.

**Best used for:** introducing layer norm in section 6. The "scale reset" framing is more concrete than the formula.

### 4. The FFN as a per-position "thinking step"
Attention is the operation where positions communicate with each other. The FFN is the operation where each position thinks alone — same MLP applied independently to each position. After attention has gathered relevant information, the FFN processes it. Stacked together: think → communicate → think → communicate → ... → output.

**Best used for:** introducing the FFN in section 4. Sets up why attention and FFN alternate.

---

## Common misconceptions

### MC1: "More attention heads = more capacity."
**Reality:** with the standard $d_k = d_{\text{model}} / h$ convention, multi-head attention has the *same parameter count and same compute* as single-head attention. The split into heads is a representation choice, not a capacity choice. Doubling the number of heads doesn't add parameters; it just gives each head a smaller dimension to work in. The marginal value of more heads diminishes; many heads end up redundant in practice.

### MC2: "Each attention head computes independently of the others."
**Reality:** the heads compute independently *given the same input X*. They all take $X$, project it through their own $W^Q, W^K, W^V$, compute attention. Their outputs are then concatenated and mixed through $W^O$. So there's no information exchange *during* the per-head computation, but the concatenation + output projection blends the heads' outputs before they leave the layer.

### MC3: "The FFN is the least important part of the transformer."
**Reality:** the FFN holds **most of the parameters** in a standard transformer block — typically $8 d_{\text{model}}^2$ (the FFN) vs $4 d_{\text{model}}^2$ (multi-head attention). At inference time, FFN also dominates compute for short sequences ($n^2 < d_{\text{model}}$). The FFN is where most of the model's "knowledge" lives, according to mechanistic interpretability work (Geva et al. 2022 and follow-ups).

### MC4: "Layer norm is just like batch norm."
**Reality:** they normalize across *different axes*. BatchNorm normalizes across the batch dimension (statistics computed over many examples for each feature); LayerNorm normalizes across the feature dimension (statistics computed within each example). For sequence models with variable lengths and small batches, LayerNorm is strictly preferred — BatchNorm's batch-statistics break.

### MC5: "Residual connections are about making networks deeper."
**Reality:** the *original* motivation (He et al. 2016) was depth, but the *actual* mechanism is gradient flow. Even at moderate depth (12-24 layers), residuals make training significantly more stable because gradients can flow back through the identity path without being squashed by each sublayer's Jacobian. The "deeper networks" framing is a consequence; the "cleaner gradients" framing is the cause.

### MC6: "Pre-LN and Post-LN are interchangeable."
**Reality:** they're empirically different in training stability. Post-LN requires careful learning-rate warmup; Pre-LN trains stably with simpler schedules. Modern transformers (GPT-2+, LLaMA, etc.) almost universally use Pre-LN. The original transformer paper used Post-LN; the field has moved.

### MC7: "GELU is fundamentally better than ReLU."
**Reality:** GELU is *slightly* better empirically — smoother, slightly better gradients near zero. It's the standard for transformers because of historical convention (BERT used it; subsequent models inherited). ReLU still works; the improvement is marginal. Modern models often use SwiGLU instead, which is itself a small improvement over GELU.

---

## Tricky implementation details

### TID1: Multi-head reshape and transpose
Multi-head attention is usually implemented with reshaping: compute $Q$, $K$, $V$ of shape $(n, d_{\text{model}})$ in one matmul, then reshape to $(n, h, d_k)$ and transpose to $(h, n, d_k)$. This is more efficient than $h$ separate matmuls. Easy to get the axis order wrong; double-check shapes.

### TID2: Layer norm epsilon
$\epsilon$ in $\sqrt{\sigma^2 + \epsilon}$ is typically $10^{-5}$ or $10^{-6}$. Without it, divisions by very small variances produce instability. PyTorch defaults to $10^{-5}$.

### TID3: Layer norm parameters
$\gamma$ initialized to ones, $\beta$ to zeros. The "identity at init" pattern: with $\gamma = 1, \beta = 0$, layer norm is just centering + scaling. The learned parameters let the model adjust.

### TID4: FFN bias terms
The two FFN linears typically include bias. Modern variants (LLaMA, others) often omit them — biases add small parameter count but minimal benefit when used after a normalized input. The chapter can mention but not dwell.

### TID5: Residual scaling
Some implementations scale the residual by $1/\sqrt{N}$ where $N$ is the number of layers. Helps with deep networks (50+ layers). Standard transformers don't bother; recent very-deep models do.

### TID6: Activation choice — chapter recommendation
The chapter should use GELU in code (modern default, simple to implement) and mention SwiGLU in prose. Implementing SwiGLU in numpy requires three linear projections per FFN (not two), which clutters the runnable code without adding much pedagogical value.

---

## Reference implementations

### Multi-head attention in numpy

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

class MultiHeadAttention:
    def __init__(self, d_model, n_heads, seed=42):
        assert d_model % n_heads == 0
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        rng = np.random.default_rng(seed)
        # All Q, K, V projections combined into single (d_model, d_model) matrices
        self.W_Q = rng.normal(0, 0.02, (d_model, d_model))
        self.W_K = rng.normal(0, 0.02, (d_model, d_model))
        self.W_V = rng.normal(0, 0.02, (d_model, d_model))
        self.W_O = rng.normal(0, 0.02, (d_model, d_model))

    def __call__(self, X, mask=None):
        """X: (n, d_model). Returns: (n, d_model)"""
        n, d_model = X.shape
        # Compute Q, K, V; reshape to (n_heads, n, d_k)
        Q = (X @ self.W_Q).reshape(n, self.n_heads, self.d_k).transpose(1, 0, 2)
        K = (X @ self.W_K).reshape(n, self.n_heads, self.d_k).transpose(1, 0, 2)
        V = (X @ self.W_V).reshape(n, self.n_heads, self.d_k).transpose(1, 0, 2)

        # Attention per head: (n_heads, n, n)
        scores = (Q @ K.transpose(0, 2, 1)) / np.sqrt(self.d_k)
        if mask is not None:
            scores = scores + mask    # broadcasts over n_heads
        weights = softmax(scores, axis=-1)
        head_outputs = weights @ V    # (n_heads, n, d_k)

        # Concatenate heads: (n_heads, n, d_k) -> (n, n_heads * d_k) = (n, d_model)
        concat = head_outputs.transpose(1, 0, 2).reshape(n, d_model)

        # Output projection
        return concat @ self.W_O
```

### Layer norm

```python
class LayerNorm:
    def __init__(self, d_model, eps=1e-5):
        self.gamma = np.ones(d_model)
        self.beta = np.zeros(d_model)
        self.eps = eps

    def __call__(self, x):
        """x: (..., d_model). Normalizes along the last axis."""
        mean = x.mean(axis=-1, keepdims=True)
        var = x.var(axis=-1, keepdims=True)
        return self.gamma * (x - mean) / np.sqrt(var + self.eps) + self.beta
```

### FFN

```python
def gelu(x):
    """GELU approximation: x * Phi(x). Using the tanh approximation for speed."""
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x**3)))

class FFN:
    def __init__(self, d_model, d_ff=None, seed=42):
        d_ff = d_ff or 4 * d_model
        rng = np.random.default_rng(seed)
        self.W1 = rng.normal(0, 0.02, (d_model, d_ff))
        self.b1 = np.zeros(d_ff)
        self.W2 = rng.normal(0, 0.02, (d_ff, d_model))
        self.b2 = np.zeros(d_model)

    def __call__(self, x):
        h = gelu(x @ self.W1 + self.b1)
        return h @ self.W2 + self.b2
```

### A full Pre-LN transformer block

```python
class TransformerBlock:
    def __init__(self, d_model, n_heads, seed=42):
        self.ln_1 = LayerNorm(d_model)
        self.attn = MultiHeadAttention(d_model, n_heads, seed=seed)
        self.ln_2 = LayerNorm(d_model)
        self.ffn = FFN(d_model, seed=seed + 1)

    def __call__(self, x, mask=None):
        # Pre-LN: norm before each sublayer, residual wraps both
        x = x + self.attn(self.ln_1(x), mask=mask)
        x = x + self.ffn(self.ln_2(x))
        return x

# Demo: 6-token sequence through one block
n, d_model = 6, 64
rng = np.random.default_rng(0)
X = rng.normal(0, 1, (n, d_model))

block = TransformerBlock(d_model, n_heads=4)
out = block(X)
print(f"Input shape:  {X.shape}")
print(f"Output shape: {out.shape}")
print(f"Per-token output norm (should be similar across positions):")
print(np.linalg.norm(out, axis=-1).round(3))
```

---

## Connections to other chapters

- **Ch 4 (Attention):** the single-head attention this chapter generalizes. Multi-head IS Ch 4's operation, run $h$ times in parallel.
- **Ch 6 (Positional encoding):** position information needs to be added before/within this chapter's machinery. Section 9 sets up the question; Ch 6 answers it.
- **Ch 7 (Training a small LLM — could be its own chapter):** the chapter's transformer block is the unit that stacks N times. Ch 7 wraps it with embeddings + N blocks + output head.
- **Ch 8 (Building a small LLM):** uses the block from this chapter as-is. The chapter's reference implementation is the spec.
- **Ch 11 (Mamba):** an alternative to attention that fits into the same block structure (attention → SSM, but FFN, residuals, norms unchanged). The chapter's block becomes a generic "mixer + processor" pattern.
- **Ch 13-15 (Post-training: SFT, RLHF, etc.):** these chapters keep the transformer block from Ch 5; only the training objective changes.
- **Ch 17 (Inference optimization):** the multi-head structure interacts with KV caching — keys and values are cached per-head. Multi-query attention and grouped-query attention (Ainslie 2023) are common modern variants reducing the cache size.
- **Ch 25 (Interpretability):** much of mech interp is about understanding what each *head* does (induction heads, name-mover heads, etc.). Multi-head is the structural reason this is a tractable line of inquiry.

---

## Open questions for the chapter author

### Q1: How much to cover Pre-LN vs Post-LN?
**Recommendation:** dedicated subsection in section 7. State both formulations; note that Pre-LN is the modern default and Post-LN is the original paper. Cite Xiong 2020 for the empirical comparison. Don't derive the training-stability argument in full math; cite and gesture.

### Q2: SwiGLU?
**Recommendation:** brief mention in section 4 as "what modern LLMs actually use." Don't implement in the chapter's runnable code (clutter). Maybe Exercise 4 (hard) implements SwiGLU as an extension.

### Q3: RMSNorm vs LayerNorm?
**Recommendation:** one paragraph in section 6 noting that RMSNorm is a simplified variant used by LLaMA. Don't re-derive; reference Zhang & Sennrich 2019.

### Q4: How much head-specialization to discuss?
**Recommendation:** brief — one paragraph in section 2 or 3 noting that different heads tend to specialize empirically. Don't go deep on induction heads / mechanistic interp; that's Ch 25's domain.

### Q5: Widget candidates
1. **Multi-head decomposition (marquee, session 24):** show the same 6-token attention from Ch 4, but now with $h = 4$ parallel heads each computing their own attention pattern. Each head has its own heatmap; the user can toggle between heads or view all 4 simultaneously. **Recommended marquee.**
2. **Transformer block flow (secondary, session 25):** animate data flowing through a single Pre-LN transformer block: input → LN → attention → residual add → LN → FFN → residual add → output. Show the shape and a summary value at each stage. **Recommended secondary.**
3. **Parameter accounting visualizer (alternative):** for various $d_{\text{model}}$ and $n_{\text{heads}}$, show the breakdown of parameters across attention/FFN/norms. Pedagogically less essential than the other two.

Recommend (1) and (2).

---

## Pre-research notes

This is the **densest chapter so far** in terms of content per session. Two major topics (multi-head + the block) plus multiple sub-concepts (FFN, residuals, layer norm, Pre-LN/Post-LN) compete for prose space.

**Recommended cadence: 5 files** (research + 4 chapter sessions). One more than the standard 4-session model:
- Research (this file)
- Page structure session (~700 lines target)
- Marquee widget: multi-head decomposition (~700 lines)
- Secondary widget: transformer block flow (~600 lines)
- Closeout: exercises + status flip (~500 lines)

This gives each of the chapter's two major topics its own widget session, while still consolidating the runnables into the page-structure session as `<RunnableCode>` blocks.

**Pedagogical outcomes for the reader.** After Ch 5, the reader should be able to:
1. Explain why multi-head attention has the same parameter count as single-head at the same $d_{\text{model}}$
2. Implement multi-head attention in numpy with correct reshape/transpose
3. State the standard FFN structure (linear → GELU → linear, 4× expansion)
4. Explain residual connections via the gradient-flow argument
5. State the layer norm formula and why it's used over batch norm in transformers
6. Distinguish Pre-LN from Post-LN and articulate why Pre-LN is preferred
7. Implement a full Pre-LN transformer block

Seven outcomes — the most ambitious chapter contract so far. Justifies the extra session.

This chapter unlocks every subsequent chapter that uses "a transformer." Ch 7 onwards assumes this material; build with care.
