# Session 28 — Chapter 6 page structure

> First chapter session for Chapter 6 ("Positional encoding"). Single-topic chapter with multiple variants: sinusoidal (the original), learned (BERT/GPT-2), **RoPE** (the modern default — centerpiece), and ALiBi (length extrapolation). The 4-file cadence applies: research + 3 chapter sessions. Produces the full MDX page — 8 sections, ~4600 words, all derivations rendered via KaTeX, two widget placeholders (sessions 29 and 30 fill them), four runnable code blocks (sinusoidal, learned, RoPE with relative-position verification, ALiBi).

---

## Read first (in this order)

1. **`research/ch06-positional-encoding/research.md`** — the source material. Every derivation, formula, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch05-multihead-and-block/session-23-page-structure.md`** — for the multi-section dense-math chapter template
4. **`prompts/chapters/ch04-attention/session-18-page-structure.md`** — for the labeled-equation pattern (Ch 6 reuses this for `6.sin`, `6.rope`)

If anything contradicts the research file, the research file wins.

---

## Goal

Replace any placeholder with a full `index.mdx` Chapter 6 page. By end of session:

- `src/pages/ch06-positional-encoding/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch06-positional-encoding/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 6's status flipped from `'planned'` to `'draft'` (full `'published'` flip happens in session 30)
- The chapter renders at `/ch06-positional-encoding/` with sidebar showing Ch 6 active, prev/next nav linking to Ch 5 (active) and Ch 7 (disabled)

**Note on chapter cadence:** Ch 6 uses the **4-file cadence** (research + 3 chapter sessions). One main topic (positional encoding) with multiple variants — not a two-topic chapter like Ch 5. Files 30 and 31 in the chapter session sequence (sessions 29, 30 here) cover the marquee widget and the secondary widget + exercises + status flip respectively.

---

## Inputs

State of the repo after session 26 (Ch 5 complete):

- Ch 1-5 all `'published'` with full prose and widgets
- `research/ch06-positional-encoding/research.md` exists
- `src/lib/chapters.ts` has Ch 1-5 `'published'`, Ch 6-30 `'planned'`
- No `src/pages/ch06-positional-encoding/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch06-positional-encoding/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch06-positional-encoding/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 6's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch06-positional-encoding
description: Attention is permutation-equivariant — shuffle the input and the output shuffles identically. Language is not. This chapter covers how position information enters the transformer: sinusoidal encoding (the original), learned embeddings (BERT, GPT-2), Rotary Positional Embedding (the modern default in LLaMA, Mistral, and most open-source LLMs), and ALiBi (length extrapolation).
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

(Widget imports added in sessions 29 and 30.)

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 2-3 short paragraphs (~180 words) of opening.

**Sample opening** — rewrite in chapter voice:

> Chapter 5's transformer block has a curious property: it doesn't know the order of its inputs. Shuffle the input sequence — "cat the on mat sat the" instead of "the cat sat on the mat" — and the output is shuffled identically. Multi-head attention, FFN, residual, layer norm: none of them care which token came first.
>
> But language *does* care. "The dog bit the man" and "The man bit the dog" share the same multiset of tokens; they don't share a meaning. Somewhere, position information has to enter the model. Where, and how, is the subject of this chapter.
>
> Four approaches matter. The original transformer added precomputed sinusoidal waves to the input embeddings. BERT and GPT-2 learned position-specific embeddings, treating "position 5" like a vocabulary word. Modern open-source LLMs — LLaMA, Mistral, Qwen, most of the field — use Rotary Positional Embedding (RoPE), which rotates the query and key vectors inside each attention layer. A fourth approach, ALiBi, gives up on positional encoding entirely and adds a distance-based bias to attention scores; this turns out to extrapolate cleanly to longer sequences.

### Section 1: Why position matters

**Heading:** `## Why position matters`
**Word target:** ~500

**Teaching beats:**
1. **The permutation-equivariance claim:** for any permutation $\pi$ and self-attention layer $A$, $A(\pi(X)) = \pi(A(X))$. Shuffle the input, the output is shuffled the same way.
2. **Where does this come from?** Look at the attention formula. Each output position $i$ is a weighted sum of value vectors, where weights come from query $q_i$ and keys $k_1, \ldots, k_n$. If you relabel positions, the same set of weights gets computed — just associated with different indices.
3. **Why language cares:** word order encodes meaning. "Dog bites man" and "Man bites dog" share tokens but not semantics. SVO vs OVS distinguishes English from Yoda-speech. The model must distinguish positions.
4. **The fix:** inject position information *somewhere*. Two main options: (a) add a position-dependent vector to each token's embedding before the first block, or (b) modify the attention computation to be position-aware.

**Required callout** — type `warning`: MC1 from research.md. "Attention has positional information." Wrong — plain self-attention is permutation-equivariant. Position must come from outside. The misconception arises because attention seems "obvious enough to handle position"; it doesn't.

**No code in this section.** Conceptual motivation.

**Connection forward:** section 2 introduces the first solution.

### Section 2: Sinusoidal positional encoding

**Heading:** `## Sinusoidal positional encoding`
**Word target:** ~900 (longest non-RoPE section)
**Sub-headings:** `### The formula`, `### The frequency schedule`, `### How it's used`

**Teaching beats:**

**The formula:**
State the sinusoidal PE formula. Label as `6.sin` for cross-reference:

```mdx
<Equation label="6.sin">
$$\text{PE}(p, 2k) = \sin\!\left(\frac{p}{10000^{2k/d_{\text{model}}}}\right)$$
$$\text{PE}(p, 2k+1) = \cos\!\left(\frac{p}{10000^{2k/d_{\text{model}}}}\right)$$
</Equation>
```

For position $p$ and dimension pair $k$ (with $0 \leq k < d_{\text{model}}/2$).

**The frequency schedule:**
1. Adjacent dimensions $(2k, 2k+1)$ form a (sin, cos) pair at frequency $\omega_k = 1/10000^{2k/d_{\text{model}}}$
2. Low $k$: high frequency (short period; distinguishes nearby positions). At $k=0$: period $= 2\pi \approx 6.28$ positions
3. High $k$: low frequency (long period; distinguishes far positions). At $k = d_{\text{model}}/2 - 1$: period $\approx 10000 \cdot 2\pi \approx 62831$ positions
4. **Why a frequency range?** Different "resolutions" of position. Nearby tokens need precise position info (high freq); far tokens need approximate position info (low freq).

**The widget placement:**
The section's widget visualizes the PE matrix as a heatmap. Position on the y-axis (rows); dimension on the x-axis (columns). The reader sees the "stripe pattern" — fast oscillations on the left, slow on the right.

**Required widget placeholder** — Sinusoidal PE visualizer (marquee, session 29):

```mdx
<WidgetFrame title="Sinusoidal positional encoding" caption="The sinusoidal PE matrix as a heatmap: position on the y-axis, dimension on the x-axis. Each pair of adjacent dimensions encodes position via a sin/cos at the same frequency. Frequencies range from 2π positions (leftmost pairs) to 62831 positions (rightmost pairs).">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 29 (marquee)
  </div>
</WidgetFrame>
```

**How it's used:**
Sinusoidal PE is precomputed for a maximum sequence length, then added element-wise to the token embeddings before the first block:
$$x_p^{(0)} = \text{embedding}(\text{token}_p) + \text{PE}(p)$$

The PE has no learnable parameters; it's a fixed mathematical function of position.

**Required code** — `<RunnableCode>` with the sinusoidal_pe implementation:

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
print(f"\nPE at position 0 (first 8 dims): {PE[0, :8].round(3)}")
print(f"PE at position 50 (first 8 dims): {PE[50, :8].round(3)}")

# Verify: the rightmost dimensions barely change between far-apart positions
print(f"\nPE[0] vs PE[50], far dimensions:")
print(f"  pos 0,  dims 60-63: {PE[0, 60:64].round(4)}")
print(f"  pos 50, dims 60-63: {PE[50, 60:64].round(4)}")
print(f"  (nearly identical — these dims have very long period)")
```

**Required callout** — type `note`: the chapter uses base 10000 — the standard value from Vaswani 2017. Modern long-context models (LLaMA-3, etc.) sometimes use higher bases like 500000 to better support long contexts. The base trades off resolution between short and long distances.

**Connection forward:** section 3 explains a subtle property of the design.

### Section 3: The implicit relative-position argument

**Heading:** `## The implicit relative-position argument`
**Word target:** ~600

**Teaching beats:**
1. **The claim** (Vaswani 2017, footnote): sinusoidal PE allows the model to attend to relative positions because $\text{PE}(p + \Delta)$ is a linear function of $\text{PE}(p)$.
2. **The math:** for one frequency pair, $(\sin(\omega(p+\Delta)), \cos(\omega(p+\Delta)))$ can be written as a rotation matrix $R(\omega \Delta)$ times $(\sin(\omega p), \cos(\omega p))$:
   $$\begin{pmatrix} \sin(\omega(p+\Delta)) \\ \cos(\omega(p+\Delta)) \end{pmatrix} = \begin{pmatrix} \cos(\omega \Delta) & \sin(\omega \Delta) \\ -\sin(\omega \Delta) & \cos(\omega \Delta) \end{pmatrix} \begin{pmatrix} \sin(\omega p) \\ \cos(\omega p) \end{pmatrix}$$
3. **What this means:** the model can, in principle, learn projections that compute relative-position-only attention. The information is *representationally available*.
4. **Caveat:** the model must *learn* to use this property. Empirical results: sinusoidal often underperforms learned PE for in-distribution evaluation. RoPE (section 5) makes the relative-position property *built in* rather than learned.
5. **Brief mention of relative position embeddings** (Shaw et al. 2018): the conceptual predecessor of RoPE — adds learned relative-position offsets to the attention computation. Less used in modern code; RoPE supersedes it.

**Required callout** — type `warning`: MC2 from research.md. "Sinusoidal encodes only absolute position." Wrong — it *allows* relative-position attention via the linear-transformation property, but the model has to learn to use it. The information is there; whether the model uses it is empirical.

**No code in this section.** Math derivation only.

**Connection forward:** section 4 covers the simpler learned alternative.

### Section 4: Learned positional embeddings

**Heading:** `## Learned positional embeddings`
**Word target:** ~400

**Teaching beats:**
1. **The idea:** treat position 0, position 1, ..., position $M-1$ as a vocabulary. Look up each position in an embedding table. Use exactly like a token embedding.
2. **Used by:** BERT, GPT-2, GPT-3 (with some variations).
3. **Pros:** simple; the model can learn whatever position encoding is optimal for the task.
4. **Cons:**
   - Adds parameters ($M \cdot d_{\text{model}}$ per model — small but nonzero)
   - **Doesn't extrapolate.** If you trained with $M = 2048$, there's no embedding for position 2049. The model can't process longer sequences.
   - No structural inductive bias toward smoothness in position space.

**Required code** — `<RunnableCode>` with the LearnedPE class:

```python
import numpy as np

class LearnedPE:
    def __init__(self, max_len, d_model, seed=42):
        rng = np.random.default_rng(seed)
        self.embeddings = rng.normal(0, 0.02, (max_len, d_model))

    def __call__(self, seq_len):
        """Return position embeddings for positions 0..seq_len-1."""
        if seq_len > self.embeddings.shape[0]:
            raise ValueError(f"seq_len {seq_len} exceeds trained max_len {self.embeddings.shape[0]}")
        return self.embeddings[:seq_len]

# Usage
pe = LearnedPE(max_len=2048, d_model=768)
print(f"Embedding table shape: {pe.embeddings.shape}")
print(f"Total positional parameters: {pe.embeddings.size:,}")
print(f"PE for seq_len=10: shape = {pe(10).shape}")

# Failing case: try to extrapolate beyond training
try:
    pe(3000)
except ValueError as e:
    print(f"\nExpected error when extrapolating: {e}")
```

**Required callout** — type `warning`: MC3 from research.md. "Learned PE is always better than sinusoidal." Wrong — learned PE is better within the training context length. But it doesn't generalize to longer sequences. Sinusoidal extrapolates somewhat; RoPE and ALiBi extrapolate even better. The "always better" framing ignores the extrapolation regime.

**Connection forward:** section 5 introduces the modern default — RoPE.

### Section 5: Rotary Positional Embedding (RoPE)

**Heading:** `## Rotary Positional Embedding (RoPE) — the modern default`
**Word target:** ~900 (longest section, the chapter's centerpiece)
**Sub-headings:** `### The setup`, `### The rotation`, `### The relative-position property`, `### Implementation`

**Teaching beats:**

**The setup:**
1. Sinusoidal and learned PE add position information to the input embeddings (once, before the first block). RoPE does something different: it modifies the Q and K vectors *inside each attention layer*.
2. The motivation: build the relative-position property *into the attention computation* rather than hoping the model learns it.
3. RoPE is **parameter-free** — the rotation angles are determined by position and dimension; nothing learned. No extra parameters compared to a model without positional encoding.

**The rotation:**
4. Treat each $d_k$-dimensional Q (or K) vector as $d_k/2$ pairs of 2D vectors.
5. For position $p$ and pair index $k$, rotate the $k$-th 2D pair by angle $\theta_k(p) = p \cdot \omega_k$ where $\omega_k = 1/10000^{2k/d_k}$ (same frequency schedule as sinusoidal — small $k$ rotates fast, large $k$ rotates slow).
6. The 2D rotation:
   $$R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}$$

**The relative-position property:**
7. The key insight: if you rotate $q$ by angle $m\omega$ and $k$ by angle $n\omega$, the dot product becomes:
   $$\langle R(m\omega) q, \, R(n\omega) k \rangle = \langle q, \, R((n-m)\omega) k \rangle$$
8. The dot product depends on $n - m$ (the relative position) — not on $m$ and $n$ individually. The same property the sinusoidal scheme had to *learn*, RoPE gets *for free*.

State the central RoPE formula prominently. Label as `6.rope`:

```mdx
<Equation label="6.rope">
$$\tilde{q}_m^{(k)} = R(m \omega_k) \, q^{(k)}, \quad \tilde{k}_n^{(k)} = R(n \omega_k) \, k^{(k)}$$
$$\langle \tilde{q}_m^{(k)}, \, \tilde{k}_n^{(k)} \rangle = \langle q^{(k)}, R((n-m)\omega_k) \, k^{(k)} \rangle$$
</Equation>
```

**Implementation:**

**Required code** — `<RunnableCode>` with the rope() implementation AND the relative-position property verification:

```python
import numpy as np

def rope(x, position_ids, base=10000.0):
    """
    Apply Rotary Positional Embedding to Q or K vectors.
    x: (seq_len, d_k) — Q or K
    position_ids: (seq_len,) — integer positions
    """
    seq_len, d_k = x.shape
    assert d_k % 2 == 0

    indices = np.arange(0, d_k, 2)
    inv_freq = 1.0 / (base ** (indices / d_k))     # (d_k/2,)
    angles = position_ids[:, None] * inv_freq[None, :]    # (seq_len, d_k/2)

    x_even = x[:, 0::2]
    x_odd = x[:, 1::2]

    cos = np.cos(angles)
    sin = np.sin(angles)

    # (a, b) -> (a*cos - b*sin, a*sin + b*cos)
    out = np.empty_like(x)
    out[:, 0::2] = x_even * cos - x_odd * sin
    out[:, 1::2] = x_even * sin + x_odd * cos
    return out

# Demo: verify the relative-position property
# Property: <RoPE(q, m), RoPE(k, n)> depends only on (n - m), not on m or n
d_k = 8
rng = np.random.default_rng(42)
q = rng.normal(0, 1, (1, d_k))
k = rng.normal(0, 1, (1, d_k))

print("Verifying RoPE's relative-position property:")
print("All pairs below have relative offset = 5; dot products should be equal.\n")

pairs = [(0, 5), (3, 8), (10, 15), (50, 55)]
for m, n in pairs:
    q_rot = rope(q, np.array([m]))
    k_rot = rope(k, np.array([n]))
    dot = (q_rot @ k_rot.T)[0, 0]
    print(f"  q at pos {m:>3d}, k at pos {n:>3d}:  q_rot · k_rot = {dot:.6f}")

print("\nAll four values should be identical (up to floating-point error).")
```

**Required callout** — type `insight`: MC7 from research.md. RoPE is **parameter-free**. The rotation angles are determined by position and dimension; nothing is learned. This is partly why it's so widely adopted in modern LLMs — adds no parameters, no extra compute beyond sin/cos.

**Required callout** — type `warning`: MC4 from research.md. "RoPE replaces sinusoidal PE — they do the same thing." Wrong — they encode position at different layers. Sinusoidal PE adds to the *input embeddings* once. RoPE rotates Q and K *in every attention layer*. RoPE's per-layer application is part of why it's more expressive.

**Connection forward:** section 6 covers an alternative that takes a different path entirely.

### Section 6: ALiBi — linear attention biases

**Heading:** `## ALiBi — linear attention biases`
**Word target:** ~500

**Teaching beats:**
1. **The idea:** don't add positional encoding to inputs or rotate Q/K. Instead, add a **linear bias** to the attention scores, with bias magnitude proportional to the distance between query and key positions.
2. **The formula:** for query at position $m$ and key at position $n$:
   $$\text{scores}_{mn} = \frac{q_m \cdot k_n}{\sqrt{d_k}} - m_h \cdot |m - n|$$
   where $m_h$ is a head-specific slope.
3. **Head-specific slopes:** for $H$ total heads, slopes are $m_h = 2^{-8h/H}$. Different heads have different "decay rates" — some are local-focused, others span longer distances.
4. **Why it extrapolates well:** the bias is a *function of distance*, not a learned position-specific embedding. At inference time, even for positions outside the training range, the linear-distance bias works correctly. "Train short, test long."
5. **Trade-offs vs RoPE:** ALiBi is simpler and extrapolates more naturally; RoPE is slightly more expressive in-distribution. Modern LLMs mostly use RoPE; some (BLOOM, some MosaicML models) use ALiBi.

**Required code** — `<RunnableCode>` with the alibi_bias function:

```python
import numpy as np

def alibi_bias(seq_len, n_heads):
    """ALiBi bias: (n_heads, seq_len, seq_len). bias[h, m, n] = -slope[h] * |m - n|"""
    slopes = 2.0 ** (-8.0 * np.arange(1, n_heads + 1) / n_heads)

    positions = np.arange(seq_len)
    distance = np.abs(positions[:, None] - positions[None, :])

    bias = -slopes[:, None, None] * distance[None, :, :]
    return bias

# Demo
seq_len = 8
n_heads = 4
bias = alibi_bias(seq_len, n_heads)

print(f"Bias shape: {bias.shape}\n")
print(f"Head 0 (slope = {2**(-8*1/n_heads):.4f}) bias:")
print(bias[0].round(2))
print(f"\nHead 3 (slope = {2**(-8*4/n_heads):.4f}) bias (steeper decay):")
print(bias[3].round(2))
```

**Connection forward:** different PE schemes extrapolate differently. Section 7 makes this explicit.

### Section 7: Length extrapolation — extending context at inference time

**Heading:** `## Length extrapolation — extending context at inference time`
**Word target:** ~500

**Teaching beats:**
1. **The problem:** a model trained with context length $L$ can struggle to process sequences longer than $L$. Why? Position information isn't well-defined for unseen positions.
2. **Per-scheme behavior:**
   - **Learned PE**: no embedding exists for new positions — hard failure
   - **Sinusoidal PE**: PE values exist for any position (the formula doesn't have a cutoff), but the model has only *seen* certain values during training; quality degrades
   - **ALiBi**: linear-distance bias works at any length — clean extrapolation
   - **RoPE**: rotation angles defined for any position, but for positions far outside training range, the rotations look different from anything seen during training — degrades unless extended via interpolation
3. **Position Interpolation (PI):** introduced in Chen et al. 2023. For RoPE-trained models, scale down the position indices at inference time. If trained on 4K positions, want to use 32K: divide all positions by 8 before applying RoPE. The model sees "compressed" position information but in a familiar range.
4. **NTK-aware scaling, YaRN:** more sophisticated extensions of PI. Modern 128K-context models (LLaMA-3, Claude, etc.) use these techniques to extend short-trained context to long inference.
5. **Practical implication:** if you want long context, choose your PE scheme accordingly. RoPE + sophisticated extension techniques is the modern standard for very long contexts.

**Required callout** — type `warning`: MC6 from research.md. "Length extrapolation is automatic." Wrong — very few PE schemes extrapolate well out of the box. ALiBi is the cleanest; RoPE works with extension techniques; learned PE fails entirely. If you're working with long context, the PE scheme is one of the most important architectural decisions.

**No code in this section.** Conceptual — the implementations of PI, NTK-aware scaling, YaRN are too involved for the chapter. Cite Chen et al. 2023 and move on.

### Section 8: Bridge to training a small LLM

**Heading:** `## What we have — everything except training`
**Word target:** ~300

**Teaching beats:**
1. **What the reader now has:** every architectural piece needed to build a transformer.
   - Ch 1: neural network primitives (gradients, autograd)
   - Ch 2: embeddings
   - Ch 3: tokenization
   - Ch 4-5: attention + multi-head + the transformer block
   - Ch 6: positional encoding (this chapter)
2. **What's still missing:** training. The model architecture is defined, but the weights start as random noise. Training is what turns random weights into a model that can predict the next token.
3. **What's coming:** Ch 7 (next) discusses what a forward pass through a complete transformer looks like, end to end. Ch 8 covers training a small LLM from scratch — the loss function, the optimizer, the data pipeline.
4. **Architectural decisions made by the LLM you're building:**
   - Layer count $N$ (12, 24, 96?)
   - Model dim $d_{\text{model}}$ (768, 1024, 12288?)
   - Heads per layer $h$ (12, 16, 96?)
   - PE scheme (sinusoidal? learned? RoPE? ALiBi?)
   - Context length $L$ (2048? 8192? 128K?)
   - Vocabulary size $V$ (50K? 128K?)
   - Activation (GELU? SwiGLU?)

**Sample close** (rewrite in chapter voice):

> Six chapters in, the architectural picture is complete. Tokens come in, get embedded, get position-encoded (sinusoidal or learned or — most likely — RoPE), then pass through twelve or twenty-four or ninety-six transformer blocks. Each block does multi-head attention, then FFN, with residuals and layer norms keeping training stable. At the end, the last block's output projects back into vocabulary space and produces a probability distribution over the next token.
>
> That's the architecture. What turns it from a random initialization into a model that can write, reason, and converse is training — and that's what the next chapter is about.

---

### Update `src/lib/chapters.ts`

Find the Ch 6 entry:

```ts
{ num: 6, slug: 'ch06-positional-encoding', title: 'Positional encoding', partNum: 2, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`. (Session 30 flips to `'published'`.)

### Delete the placeholder

```bash
test -f src/pages/ch06-positional-encoding/index.astro && rm src/pages/ch06-positional-encoding/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch06-positional-encoding/`** renders with:
   - Chapter eyebrow ("Chapter 6") + h1 + description
   - 8 h2 sections in the order specified
   - All equations render via KaTeX; labeled equations `<Equation label="6.sin">` and `<Equation label="6.rope">` are present
   - 4 `<RunnableCode>` blocks (sections 2, 4, 5, 6)
   - 2 `<WidgetFrame>` placeholders (sections 2 and 5)
   - At least 6 callouts spread through the chapter
3. **Sidebar:** Ch 1-5 published; Ch 6 active (draft); Ch 7-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 6:** prev = Ch 5 (active); next = Ch 7 (disabled)
6. **TOC on Ch 6** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 4500 and 5500 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 29 and 30 own them.
- ❌ **Do not write exercises.** Session 30 owns.
- ❌ **Do not flip Ch 6's status to `'published'`.** Session 30 owns.
- ❌ **Do not go deep on position interpolation, NTK-aware scaling, or YaRN.** Brief mention only; these are advanced topics.
- ❌ **Do not derive Shaw et al. relative position embeddings.** Brief mention only as RoPE's conceptual predecessor.
- ❌ **Do not modify Ch 1, 2, 3, 4, or 5.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch06-positional-encoding/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch06-positional-encoding/index.astro 2>/dev/null || true
git commit -m "session 28: Ch 6 prose — positional encoding, 8 sections, sinusoidal + learned + RoPE + ALiBi"
git push origin main
```

---

## Notes for the session author

**On RoPE as the centerpiece:**
The chapter's pedagogical destination is RoPE — every modern open-source LLM uses it. Earlier sections (sinusoidal, learned, the implicit relative-position argument) build toward understanding why RoPE is the natural endpoint of the design evolution. Section 5 should feel like *arrival*, not just one more variant in a list.

**On the chapter's "four variants" structure:**
There's a temptation to give each variant equal weight. Don't. The reader needs to understand sinusoidal (historical context), can skim learned (limited modern use), should master RoPE (production default), and should know that ALiBi exists (alternative for length extrapolation). Word counts reflect this: sinusoidal ~900, learned ~400, RoPE ~900, ALiBi ~500.

**On the labeled equations:**
`<Equation label="6.sin">` for the sinusoidal formula; `<Equation label="6.rope">` for the RoPE formula. Reference them in later sections via `<EqRef id="..." />`. Same pattern as Ch 4 (`4.attn`) and Ch 5 (`5.multihead`).

**On the relative-position verification in section 5:**
The runnable code for RoPE includes a loop that verifies the relative-position property: rotating $q$ at position $m$ and $k$ at position $n$ gives the same dot product as long as $n - m$ is constant. This is the "see it with your own eyes" demonstration that makes RoPE's central property concrete. Don't skip this.

**On the widget placement:**
Section 2 (sinusoidal) has the marquee. Why? Because the sinusoidal heatmap is the iconic positional-encoding visual — every textbook on transformers has this image. RoPE's rotation is also striking, but it's at the centerpiece section (section 5) and gets the secondary widget. The marquee widget anchors the chapter; the secondary widget supports the centerpiece concept.

**On pedagogical outcomes (from research.md):**
After Ch 6, the reader should be able to:
1. State why attention is permutation-equivariant and what that means for language
2. Compute sinusoidal PE values for given positions and dimensions
3. Explain why sinusoidal *can* but doesn't always encode relative positions
4. State the difference between learned and sinusoidal PE
5. Implement RoPE in numpy, verifying the relative-position property
6. Explain ALiBi and why it extrapolates well
7. Articulate which PE schemes are used in modern LLMs

Seven outcomes. The exercises in session 30 will explicitly serve outcomes 2, 5, and 6.

This chapter completes the architectural picture. After Ch 6, the reader has every piece needed to build a transformer; Ch 7+ shifts to training.
