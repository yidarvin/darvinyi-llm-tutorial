# Session 23 — Chapter 5 page structure

> First chapter session for Chapter 5 ("Multi-head attention and the transformer block"). The **densest chapter so far** — covers two major topics in one go: multi-head attention as a generalization of Ch 4, and the full transformer block (multi-head + FFN + residuals + layer norm). Produces the full MDX page: 9 sections, ~5000 words of prose, all derivations rendered via KaTeX, two widget placeholders (sessions 24 and 25 fill them), and four runnable code blocks. Uses the **5-file chapter cadence** (research + 4 chapter sessions) — one extra session vs the 4-file norm to accommodate two widget topics.

---

## Read first (in this order)

1. **`research/ch05-multihead-and-block/research.md`** — the source material. Every derivation, formula, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`context/CURRICULUM.md`** — for Ch 5's locked scope
4. **`prompts/chapters/ch04-attention/session-18-page-structure.md`** — for the dense-math chapter template (Ch 5 is the next chapter of equivalent density)
5. **`prompts/chapters/ch03-tokenization/session-14-page-structure.md`** — for the 9-section chapter template (Ch 3 also used 9 sections; Ch 5 does too)

If anything contradicts the research file, the research file wins.

---

## Goal

Replace any placeholder with a full `index.mdx` Chapter 5 page. By end of session:

- `src/pages/ch05-multihead-and-block/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch05-multihead-and-block/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 5's status flipped from `'planned'` to `'draft'` (full `'published'` flip happens in session 26)
- The chapter renders at `/ch05-multihead-and-block/` with sidebar showing Ch 5 active, prev/next nav linking to Ch 4 (active) and Ch 6 (disabled)

**Note on chapter cadence:** Ch 5 uses the **5-file cadence** (research + 4 chapter sessions) instead of the 4-file norm. The chapter covers two major topics — multi-head attention AND the transformer block — and each warrants its own dedicated widget session. Files 30-31 in the original BUILD_ORDER plan are NOT absorbed for Ch 5; sessions 23 (this), 24, 25, 26 are all distinct deliverables.

---

## Inputs

State of the repo after session 22 (Ch 4 complete):

- Ch 1-4 all `'published'` with full prose and widgets
- `research/ch05-multihead-and-block/research.md` exists
- `src/lib/chapters.ts` has Ch 1-4 `'published'`, Ch 5-30 `'planned'`
- Widget directories `ch01/` through `ch04/` exist; no `ch05/` yet

---

## Deliverables

1. **Create** `src/pages/ch05-multihead-and-block/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch05-multihead-and-block/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 5's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch05-multihead-and-block
description: Multi-head attention generalizes Chapter 4's single-head attention to h parallel heads, each with their own learned projections. The transformer block wraps multi-head attention with a feedforward network, residual connections, and layer normalization. Together, multi-head attention and the block form the minimum unit that stacks N times to make a transformer.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

(Widget imports added in sessions 24 and 25.)

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 2-3 short paragraphs (~180 words) of opening.

**Sample opening** — rewrite in chapter voice:

> Chapter 4 was about one attention head. Real transformers have many — eight, twelve, ninety-six, depending on the model. Each head has its own learned projections, computes its own attention pattern, and produces its own slice of output. The slices are concatenated and projected back into the model's feature space. The motivation: different heads can specialize in different relationships — locality, syntax, coreference — without the architectural complexity of separate networks.
>
> But multi-head attention alone isn't a transformer. The transformer's repeating unit — the *block* — wraps multi-head attention with three more pieces: a feedforward network (the larger of the two parameter contributors), residual connections (so gradients can flow), and layer normalization (so training is stable). The block runs each piece in sequence, applies the residual short-circuits, and produces a refined representation.
>
> This chapter is two chapters folded into one. The first half generalizes attention to multi-head. The second half assembles the block. By the end, the reader will have written a working Pre-LN transformer block in numpy — the unit that stacks N times to form GPT, LLaMA, Mistral, Claude, and every modern LLM.

### Section 1: The setup — why multiple heads

**Heading:** `## The setup — why multiple heads`
**Word target:** ~500

**Teaching beats:**
1. Recap: in Ch 4, attention had one set of $W^Q$, $W^K$, $W^V$. The output was a weighted sum of the value vectors, with weights determined by query-key dot products.
2. The motivation for multi-head: a single attention pattern is one "viewpoint" on the sequence. With multiple heads, the model gets multiple viewpoints simultaneously. One head might focus on adjacent positions; another on syntactic dependencies; another on long-range references.
3. **Architecture preview:** $h$ parallel attention operations, each with their own projections. Concatenate outputs, project back through a final linear layer.
4. **What we'll see in section 3:** despite running attention $h$ times, multi-head attention has *the same parameter count and same compute* as single-head at the same $d_{\text{model}}$. The split into heads is a representation choice, not a capacity one.

**Required callout** — type `note`: this chapter assumes Ch 4. If the attention formula isn't second nature, revisit Ch 4 before continuing.

**No code in this section.** Setup and motivation.

**Connection forward:** section 2 introduces the multi-head architecture formally.

### Section 2: Multi-head attention — the parallel-heads architecture

**Heading:** `## Multi-head attention — the parallel-heads architecture`
**Word target:** ~900 (longest section)
**Sub-headings:** `### The formula`, `### The d_k = d_model / h convention`, `### A working implementation`

**Teaching beats:**

**The formula:**
1. State the multi-head formula prominently. Label this equation for cross-reference:

```mdx
<Equation label="5.multihead">
$$\text{MultiHead}(X) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) \cdot W^O$$
$$\text{where } \text{head}_i = \text{Attention}(X W_i^Q, X W_i^K, X W_i^V)$$
</Equation>
```

2. Each head computes Ch 4's scaled dot-product attention with its own learned $W_i^Q, W_i^K, W_i^V$. Outputs are concatenated along the feature dimension into a single matrix, then projected through a final $W^O \in \mathbb{R}^{(h \cdot d_v) \times d_{\text{model}}}$.

3. **The d_k = d_model / h convention:** standard convention sets $d_k = d_v = d_{\text{model}} / h$. With this choice:
   - Concatenated output dim is $h \cdot d_v = d_{\text{model}}$ — matches the input
   - $W^O$ is a square $d_{\text{model}} \times d_{\text{model}}$ matrix
   - Total parameters across heads are $h \cdot 3 \cdot d_{\text{model}} \cdot (d_{\text{model}}/h) = 3 d_{\text{model}}^2$ — same as single-head

4. **What heads learn (empirically):** different heads tend to specialize. One head might focus on adjacent positions; another on syntactic dependencies (subject-verb agreement); another on coreference. Whether each head is truly distinct varies by training — many heads end up redundant in practice. Mechanistic interpretability (Ch 25) gives this rigorous analysis.

5. **The widget placement:** the section's widget visualizes a 4-head decomposition of the same 6-token sequence from Ch 4. Each head has its own attention heatmap; the user can toggle between heads to see they differ.

**Required widget placeholder** — Multi-head decomposition (marquee, session 24):

```mdx
<WidgetFrame title="Multi-head attention" caption="The same 6-token sequence with h=4 attention heads. Each head has its own learned Q, K, V projections, producing a different attention pattern. The final output blends the heads via a learned projection.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 24 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with the multi-head implementation from research.md. Trim to essentials:

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

class MultiHeadAttention:
    def __init__(self, d_model, n_heads, seed=42):
        assert d_model % n_heads == 0, "d_model must be divisible by n_heads"
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        rng = np.random.default_rng(seed)
        # All Q, K, V projections combined into single (d_model, d_model) matrices
        self.W_Q = rng.normal(0, 0.02, (d_model, d_model))
        self.W_K = rng.normal(0, 0.02, (d_model, d_model))
        self.W_V = rng.normal(0, 0.02, (d_model, d_model))
        self.W_O = rng.normal(0, 0.02, (d_model, d_model))

    def __call__(self, X, mask=None):
        n, d_model = X.shape
        # Compute Q, K, V; reshape to (n_heads, n, d_k)
        Q = (X @ self.W_Q).reshape(n, self.n_heads, self.d_k).transpose(1, 0, 2)
        K = (X @ self.W_K).reshape(n, self.n_heads, self.d_k).transpose(1, 0, 2)
        V = (X @ self.W_V).reshape(n, self.n_heads, self.d_k).transpose(1, 0, 2)

        # Per-head attention: (n_heads, n, n)
        scores = (Q @ K.transpose(0, 2, 1)) / np.sqrt(self.d_k)
        if mask is not None:
            scores = scores + mask    # broadcasts over n_heads
        weights = softmax(scores, axis=-1)
        head_outputs = weights @ V    # (n_heads, n, d_k)

        # Concatenate heads: (n_heads, n, d_k) -> (n, d_model)
        concat = head_outputs.transpose(1, 0, 2).reshape(n, d_model)

        return concat @ self.W_O

# Demo: 6-token sequence, d_model=8, 4 heads (each with d_k=2)
n, d_model = 6, 8
mha = MultiHeadAttention(d_model, n_heads=4)
X = np.random.default_rng(0).normal(0, 1, (n, d_model))
output = mha(X)
print(f"Input shape:  {X.shape}")
print(f"Output shape: {output.shape}")
```

**Required callout** — type `insight`: this is MC1 from research.md. "More heads = more capacity" — wrong. With $d_k = d_{\text{model}}/h$, multi-head attention has the *same* parameter count and the *same* compute as single-head at the same $d_{\text{model}}$. The split is a representation choice, not a capacity choice. Doubling the number of heads doesn't add parameters; each head just gets a smaller dimension.

**Connection forward:** section 3 makes the parameter accounting rigorous.

### Section 3: Parameter and compute accounting

**Heading:** `## Parameter and compute accounting`
**Word target:** ~500

**Teaching beats:**
1. **Multi-head parameter breakdown:**
   - $W^Q$, $W^K$, $W^V$ combined: $3 d_{\text{model}}^2$ parameters
   - $W^O$: $d_{\text{model}}^2$ parameters
   - **Total: $4 d_{\text{model}}^2$**
2. **FFN parameter breakdown (preview, fully covered in section 4):**
   - Up-projection ($d \to 4d$): $4 d_{\text{model}}^2$
   - Down-projection ($4d \to d$): $4 d_{\text{model}}^2$
   - **Total: $8 d_{\text{model}}^2$**
3. **Surprising implication:** the FFN has **twice the parameters** of multi-head attention. Most of a transformer block's parameters live in the FFN, not in attention.
4. **For GPT-3 (175B parameters):** $d_{\text{model}} = 12288$, 96 layers. Each block has ~$12 d_{\text{model}}^2 + 2 d_{\text{model}}$ = ~1.8B params. 96 blocks × 1.8B = 173B (the remainder is embeddings).
5. **Compute scaling:** at sequence length $n$ and per-token, attention is $O(n \cdot d_{\text{model}}^2)$ + $O(n^2 \cdot d_{\text{model}})$. FFN is $O(n \cdot d_{\text{model}}^2)$ (linear in $n$, quadratic in $d$). At short sequences, FFN dominates compute; at long sequences, attention's $n^2$ wins.

**Required table** — render this as a markdown table for visual clarity:

| Component | Parameter count |
|---|---|
| Multi-head $W^Q, W^K, W^V$ | $3 d_{\text{model}}^2$ |
| Multi-head $W^O$ | $d_{\text{model}}^2$ |
| **Multi-head total** | **$4 d_{\text{model}}^2$** |
| FFN up-projection | $4 d_{\text{model}}^2$ |
| FFN down-projection | $4 d_{\text{model}}^2$ |
| **FFN total** | **$8 d_{\text{model}}^2$** |
| Layer norm scales (×2) | $2 d_{\text{model}}$ |
| **Block total** | **$12 d_{\text{model}}^2 + 2 d_{\text{model}}$** |

**Required callout** — type `warning`: MC3 from research.md. "The FFN is the least important part." Wrong — it's the biggest by parameter count (twice the size of attention). Mechanistic interpretability research suggests the FFN is where most of the model's *knowledge* lives. Attention shuffles information between positions; the FFN processes that information at each position. Both are essential.

**No code in this section.** Conceptual.

**Connection forward:** section 4 fills in the FFN details.

### Section 4: The feedforward network (FFN)

**Heading:** `## The feedforward network (FFN)`
**Word target:** ~700
**Sub-headings:** `### Structure: expand then contract`, `### Activation choice — GELU and SwiGLU`, `### Implementation`

**Teaching beats:**
1. **The FFN is position-wise:** the same MLP is applied independently to each position's vector. No information flow between positions in this step — the FFN is where each position "thinks alone," after attention has gathered relevant context.
2. **Standard structure:** two linear layers with an activation in between:
   - Input: $d_{\text{model}}$
   - Hidden: $4 d_{\text{model}}$ (the "expansion ratio")
   - Output: $d_{\text{model}}$
3. **Why expand by 4?** Empirical — Vaswani et al. 2017 chose 4; subsequent architecture experiments showed this ratio works well across scales. Smaller ratios (2x) save parameters but underperform; larger (8x) help only marginally and double parameters.
4. **Activation function choices:**
   - **ReLU** (original transformer): simple, fast, but has the "dying ReLU" issue at large scale
   - **GELU** (BERT, GPT-2/3): smoother than ReLU, slightly better empirical gradients, current default
   - **SwiGLU** (LLaMA, Mistral): a gated variant; uses three linear projections instead of two; modest empirical improvement
5. **SwiGLU details:** $\text{SwiGLU}(x) = \text{Swish}(xW_1) \odot (xW_2)$, then projected through $W_3$. Used by most modern open-source LLMs. The chapter implements GELU (simpler); the exercise can implement SwiGLU.

**Required equation** — the FFN formula with GELU:

$$\text{FFN}(x) = \text{GELU}(x W_1 + b_1) W_2 + b_2$$

where $W_1 \in \mathbb{R}^{d_{\text{model}} \times 4 d_{\text{model}}}$ and $W_2 \in \mathbb{R}^{4 d_{\text{model}} \times d_{\text{model}}}$.

**Required equation** — GELU:

$$\text{GELU}(x) = x \cdot \Phi(x) \approx \frac{1}{2} x \left(1 + \tanh\!\left[\sqrt{\frac{2}{\pi}}\left(x + 0.044715 x^3\right)\right]\right)$$

where $\Phi$ is the standard normal CDF; the right side is the standard fast approximation.

**Required code** — `<RunnableCode>` with the FFN implementation:

```python
import numpy as np

def gelu(x):
    """GELU activation — tanh approximation."""
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

# Demo
d_model = 8
ffn = FFN(d_model)
X = np.random.default_rng(0).normal(0, 1, (6, d_model))
out = ffn(X)
print(f"Input shape:  {X.shape}")
print(f"Hidden shape: ({X.shape[0]}, {4 * d_model}) — 4x expansion")
print(f"Output shape: {out.shape}")
```

**Required callout** — type `aside`: modern open-source LLMs (LLaMA, Mistral) use SwiGLU instead of GELU. The performance improvement is small but consistent; the parameter cost is similar (SwiGLU uses 3 linear layers; standard GELU uses 2). The chapter implements GELU for pedagogical clarity; Exercise 4 implements SwiGLU as an extension.

**Connection forward:** so far the chapter has presented multi-head attention and the FFN as separate operations. Section 5 introduces what connects them inside the block.

### Section 5: Residual connections — why they matter

**Heading:** `## Residual connections — why they matter`
**Word target:** ~500

**Teaching beats:**
1. **The setup:** when transformers were introduced, residual connections were already standard (He et al. 2016 had introduced them for ResNets). The transformer's block uses them around each sublayer (attention and FFN).
2. **The pattern:** for a sublayer $f$ (attention or FFN):
   $$h_{\text{out}} = h_{\text{in}} + f(h_{\text{in}})$$
   The "residual" is the unchanged input being added back to the sublayer's output.
3. **Why this helps:** gradient flow. The gradient through $h_{\text{out}} = h_{\text{in}} + f(h_{\text{in}})$ has two paths — through the identity (passing through unchanged) and through $f$'s Jacobian. Even if $f$'s Jacobian shrinks gradients, the identity path preserves them.
4. **At very deep networks (50+ layers):** without residuals, gradients can vanish exponentially with depth. With residuals, they degrade only via the additive nudges from each $f$.
5. **The "highway" framing:** residuals create a clean lane through the network. Information (forward) and gradients (backward) can pass through unchanged via the identity path. Each sublayer adds a small refinement; the highway carries the bulk.

**Required equation** — the gradient through a residual:

$$\frac{\partial \mathcal{L}}{\partial h_{\text{in}}} = \frac{\partial \mathcal{L}}{\partial h_{\text{out}}} \cdot \left(I + \frac{\partial f}{\partial h_{\text{in}}}\right) = \underbrace{\frac{\partial \mathcal{L}}{\partial h_{\text{out}}}}_{\text{identity path}} + \underbrace{\frac{\partial \mathcal{L}}{\partial h_{\text{out}}} \cdot \frac{\partial f}{\partial h_{\text{in}}}}_{\text{through } f}$$

**Required callout** — type `warning`: MC5 from research.md. "Residuals are about depth." Wrong framing — they're really about gradient flow. Even at moderate depth (12-24 layers), residuals make training significantly more stable. The "deeper networks work now" headline is a consequence; the "gradients flow cleanly" mechanism is the cause.

**No code in this section** — the residual is a `+` in code; it doesn't need its own block. Section 7's full-block code includes it.

**Connection forward:** the third piece of the block is normalization.

### Section 6: Layer normalization

**Heading:** `## Layer normalization`
**Word target:** ~600
**Sub-headings:** `### The formula`, `### Why not batch norm`, `### Modern variant: RMSNorm`

**Teaching beats:**
1. **What layer norm does:** for each token's feature vector, subtract the mean across features, divide by the standard deviation, apply a learned per-feature scale and shift.
2. **Why:** without normalization, activations can grow or shrink as they propagate through layers. Some neurons saturate; others vanish. Layer norm forces every token's features back to a standard scale at every block boundary. Training becomes stable.
3. **Compared to batch norm:** batch norm normalizes across the batch dimension (different examples, same feature). Layer norm normalizes across the feature dimension (same example, different features). For sequence models with variable lengths, layer norm is strictly preferred.
4. **RMSNorm** (Zhang & Sennrich 2019): drop the mean subtraction. Just normalize by RMS. Used by LLaMA, T5. Slightly faster; comparable quality. Modern but not universal.

**Required equation** — layer norm:

$$\text{LayerNorm}(x) = \gamma \odot \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta$$

where $\mu = \frac{1}{d} \sum_i x_i$ and $\sigma^2 = \frac{1}{d} \sum_i (x_i - \mu)^2$ (statistics computed across the feature dimension); $\gamma, \beta \in \mathbb{R}^d$ are learnable; $\epsilon \approx 10^{-5}$.

**Required equation** — RMSNorm (the simplified variant):

$$\text{RMSNorm}(x) = \gamma \odot \frac{x}{\sqrt{\frac{1}{d}\sum_i x_i^2 + \epsilon}}$$

**Required code** — `<RunnableCode>` with the LayerNorm implementation:

```python
import numpy as np

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

# Demo
d_model = 8
ln = LayerNorm(d_model)
X = np.random.default_rng(0).normal(0, 5, (4, d_model))   # large-scale input

print(f"Input stats per token (mean, std):")
for i, row in enumerate(X):
    print(f"  Token {i}: mean={row.mean():+.3f}, std={row.std():.3f}")

X_normed = ln(X)
print(f"\nAfter layer norm:")
for i, row in enumerate(X_normed):
    print(f"  Token {i}: mean={row.mean():+.3f}, std={row.std():.3f}")
```

Expected output: pre-norm, token mean/std varies widely; post-norm, each token has mean ≈ 0 and std ≈ 1.

**Required callout** — type `warning`: MC4 from research.md. "Layer norm is just like batch norm." Wrong — they normalize across different axes. BatchNorm uses statistics from many examples (problematic for variable-length sequences and small batches); LayerNorm uses statistics from a single example (clean for any batch size and sequence length). For transformers, layer norm is strictly preferred.

**Connection forward:** section 7 assembles everything into the full block.

### Section 7: The full transformer block — Pre-LN vs Post-LN

**Heading:** `## The full transformer block — Pre-LN vs Post-LN`
**Word target:** ~700
**Sub-headings:** `### Pre-LN: norm before sublayer`, `### Post-LN: norm after the residual`, `### Why modern transformers use Pre-LN`, `### A working block`

**Teaching beats:**

1. **The block has four components:** multi-head attention, FFN, residuals, layer norms. There are two ways to compose them:

2. **Post-LN** (original transformer, Vaswani 2017):
   $$h = \text{LayerNorm}(h_{\text{in}} + \text{Sublayer}(h_{\text{in}}))$$
   Norm applied after the residual addition.

3. **Pre-LN** (modern default, GPT-2 onwards):
   $$h = h_{\text{in}} + \text{Sublayer}(\text{LayerNorm}(h_{\text{in}}))$$
   Norm applied before the sublayer; residual wraps the unnormalized input.

4. **Why Pre-LN won:**
   - The residual path is "clean" — pure identity flowing through without normalization. Gradients flow straight back along this path.
   - No learning-rate warmup needed. Post-LN models require careful warmup schedules; Pre-LN trains stably with constant or cosine-decay schedules.
   - Empirically: better stability at depth. Xiong et al. 2020 showed this rigorously.

5. **Modern usage:** GPT-2, GPT-3, GPT-4, LLaMA, Mistral all use Pre-LN. The original paper used Post-LN; the field has moved.

6. **The full block** (Pre-LN, the modern default):
   - $h_1 = h + \text{Attention}(\text{LayerNorm}(h))$
   - $h_2 = h_1 + \text{FFN}(\text{LayerNorm}(h_1))$

**Required widget placeholder** — Transformer block flow (secondary, session 25):

```mdx
<WidgetFrame title="Pre-LN transformer block" caption="Data flowing through one Pre-LN transformer block: input → LN → attention → residual → LN → FFN → residual → output. Each step preserves the residual path; the sublayers add refinements.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 25
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with the full Pre-LN transformer block:

```python
import numpy as np

# Reuse: MultiHeadAttention, LayerNorm, FFN from earlier sections

class TransformerBlock:
    def __init__(self, d_model, n_heads, seed=42):
        self.ln_1 = LayerNorm(d_model)
        self.attn = MultiHeadAttention(d_model, n_heads, seed=seed)
        self.ln_2 = LayerNorm(d_model)
        self.ffn = FFN(d_model, seed=seed + 1)

    def __call__(self, x, mask=None):
        # Pre-LN: norm before each sublayer; residual wraps the unnormalized input
        x = x + self.attn(self.ln_1(x), mask=mask)
        x = x + self.ffn(self.ln_2(x))
        return x

# Demo: 6-token sequence through one block
n, d_model = 6, 32
rng = np.random.default_rng(0)
X = rng.normal(0, 1, (n, d_model))

block = TransformerBlock(d_model, n_heads=4)
out = block(X)
print(f"Input shape:  {X.shape}")
print(f"Output shape: {out.shape}")
print(f"\nPer-token output norm (residual keeps things in a similar range):")
print(np.linalg.norm(out, axis=-1).round(3))
```

**Required callout** — type `warning`: MC6 from research.md. "Pre-LN and Post-LN are interchangeable." Wrong — they're empirically different in training stability. Post-LN requires careful warmup; Pre-LN trains stably with simpler schedules. The original transformer paper used Post-LN, but the field has moved to Pre-LN. When implementing from scratch, use Pre-LN unless you have a specific reason to deviate.

**Connection forward:** one block is one layer. Real transformers stack many.

### Section 8: Stacking blocks — depth and capability

**Heading:** `## Stacking blocks — depth and capability`
**Word target:** ~400

**Teaching beats:**
1. **A real transformer stacks $N$ blocks** in sequence. Each block takes the previous block's output as input; each refines the representation slightly.
2. **Depth scales:**
   - GPT-2 small: 12 blocks
   - GPT-2 medium: 24 blocks
   - GPT-3: 96 blocks
   - LLaMA-3 8B: 32 blocks
   - LLaMA-3 70B: 80 blocks
3. **The block is the building block.** The chapter doesn't need to show stacking in detail; Ch 8 (Building a small LLM) does that. But noting that "this thing repeats N times" is essential for the reader's mental model.
4. **What does depth give?** Each block can be thought of as one "refinement step" on the representation. Early blocks process surface features (syntactic structure, local patterns); later blocks process abstract features (semantics, reasoning chains). The exact specialization is poorly understood; mechanistic interpretability (Ch 25) is the active area.

**Required callout** — type `note`: the chapter's transformer block code is a complete spec. Ch 8 uses it almost verbatim — embedding lookup + 12 blocks + output projection = a working LLM. The block here is the LEGO brick; subsequent chapters assemble bricks.

**No code in this section.** Stack visualization is implied; full code is in Ch 8.

### Section 9: Bridge to positional encoding

**Heading:** `## What's missing — positional encoding`
**Word target:** ~200

**Teaching beats:**
1. **Notice what the chapter's block does NOT know:** the order of tokens. Shuffle the input sequence and the output is shuffled identically — the attention operation is permutation-equivariant.
2. **Real language is sequential.** "The dog bit the man" ≠ "The man bit the dog." The model needs position information *somewhere*.
3. **Where does position enter?** Not in attention (it's position-blind). Not in FFN (position-wise, but no positional encoding). The standard answer: add positional information to the input embeddings before the first block.
4. **Chapter 6** covers positional encoding in full — sinusoidal, learned, RoPE (the modern default).

**Sample close** (rewrite in chapter voice):

> The block in this chapter — multi-head attention, FFN, residuals, layer norms — is the transformer's repeating unit. Stack twelve of these on top of an embedding layer and you have GPT-2. Stack ninety-six on top of an embedding layer and you have GPT-3. Stack thirty-two with some additional refinements (RMSNorm, SwiGLU, RoPE) and you have LLaMA.
>
> What we're missing — and what Chapter 6 fixes — is position. Attention is permutation-equivariant; shuffle the input and the output shuffles the same way. Language is not permutation-equivariant. Position information must enter the model somewhere. Chapter 6 explores where, and how.

---

### Update `src/lib/chapters.ts`

Find the Ch 5 entry:

```ts
{ num: 5, slug: 'ch05-multihead-and-block', title: 'Multi-head attention and the transformer block', partNum: 2, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`. (Session 26 flips to `'published'` after the secondary widget and exercises are added.)

### Delete the placeholder

```bash
test -f src/pages/ch05-multihead-and-block/index.astro && rm src/pages/ch05-multihead-and-block/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch05-multihead-and-block/`** renders with:
   - Chapter eyebrow ("Chapter 5") + h1 + description
   - 9 h2 sections in the order specified
   - All equations render via KaTeX; the labeled equation `<Equation label="5.multihead">` is present
   - 4 `<RunnableCode>` blocks (sections 2, 4, 6, 7)
   - 2 `<WidgetFrame>` placeholders (sections 2 and 7)
   - At least 7 callouts spread through the chapter
   - A markdown parameter-accounting table in section 3
3. **Sidebar:** Ch 1-4 published; Ch 5 active (draft); Ch 6-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 5:** prev = Ch 4 (active link); next = Ch 6 (disabled)
6. **TOC on Ch 5** populates with all 9 sections plus subsections
7. **Word count:** chapter prose between 5000 and 6500 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 24 and 25 own them.
- ❌ **Do not write exercises.** Session 26 owns.
- ❌ **Do not flip Ch 5's status to `'published'`.** Session 26 owns.
- ❌ **Do not introduce positional encoding.** Ch 6 owns.
- ❌ **Do not modify Ch 1, 2, 3, or 4.** Sealed.
- ❌ **Do not modify any layout, styling, or scaffolding file.**

---

## Wire-up

```bash
git add src/pages/ch05-multihead-and-block/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch05-multihead-and-block/index.astro 2>/dev/null || true
git commit -m "session 23: Chapter 5 prose — multi-head attention + transformer block, 9 sections, 4 runnable code blocks, widget placeholders"
git push origin main
```

---

## Notes for the session author

**On the two-topic structure:** sections 1-3 cover multi-head attention; sections 4-6 cover the block's other components (FFN, residuals, layer norm); sections 7-9 assemble. This is the chapter's spine — don't reorder.

**On code reuse across sections:** sections 2, 4, 6, 7 each include their own `<RunnableCode>`. Section 7's code reuses MultiHeadAttention, FFN, and LayerNorm from earlier sections. This is fine — `<RunnableCode>` blocks are independent Pyodide runs, but the reader sees how the classes fit together. The chapter author can repeat the relevant class definitions in section 7's code block (since Pyodide execution is per-block) or note that "the classes from earlier blocks are implicitly available" depending on whether `<RunnableCode>` supports shared state in the implementation.

**On equation cross-references:** the labeled equation `<Equation label="5.multihead">` in section 2 can be referenced via `<EqRef id="5.multihead" />` in later sections. Use this in section 3 (parameter accounting) and section 7 (full block).

**On the parameter accounting table:** render as standard markdown table; the design system styles tables automatically. Don't use a custom component for this.

**On GELU vs SwiGLU:** the chapter implements GELU in code; the prose notes SwiGLU as the modern default. This is honest: GELU is simpler to teach; SwiGLU is what's actually used. The exercise in session 26 implements SwiGLU as an extension.

**On Pre-LN vs Post-LN:** the chapter strongly prefers Pre-LN (it's what every modern transformer uses). The Post-LN formulation is presented for completeness and historical accuracy, but the working code is Pre-LN.

**On widget placeholders:** the section-2 marquee shows multi-head decomposition (each head's attention pattern). The section-7 secondary shows data flow through a block (input → LN → attention → residual → LN → FFN → residual → output). The two widgets together cover the chapter's two major topics.

**Pedagogical outcomes for the reader.** After Ch 5, the reader should be able to:
1. Explain why multi-head attention has the same parameter count as single-head at the same $d_{\text{model}}$
2. Implement multi-head attention in numpy with correct reshape/transpose
3. State the standard FFN structure (linear → GELU → linear, 4× expansion) and parameter count
4. Explain residual connections via the gradient-flow argument
5. State the layer norm formula and why it's used over batch norm
6. Distinguish Pre-LN from Post-LN and articulate why Pre-LN is preferred
7. Implement a full Pre-LN transformer block

Seven outcomes — the most ambitious chapter contract so far, justifying the 5-file cadence.

This chapter unlocks every subsequent "training a transformer" chapter. Build with care.
