# Session 82 — Chapter 18 page structure

> First chapter session for Chapter 18 ("Quantization"). **The technical heart of Phase 12.** Where Ch 17 reduced wasted computation, Ch 18 reduces the bits per parameter. The two combine multiplicatively. This is the chapter that explains how a 70B model fits on a single A100 — and what tradeoffs that entails. Bridges back to Ch 15 (QLoRA's NF4 was a teaser); bridges forward to Ch 19's combined throughput picture. Single-topic chapter; uses the **4-file cadence**.

---

## Read first (in this order)

1. **`research/ch18-quantization/research.md`** — the source material. Every section, derivation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch17-inference-optimization/session-77-page-structure.md`** — for the Phase 12 practical-engineering voice template (same voice carries here)
4. **`prompts/chapters/ch15-peft/session-67-page-structure.md`** — for the Ch 15 voice and the QLoRA reference that this chapter unpacks

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 18 page. By end of session:

- `src/pages/ch18-quantization/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch18-quantization/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 18's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch18-quantization/` with sidebar showing Ch 18 active, prev/next nav linking to Ch 17 (active) and Ch 19 (disabled)

**Tonal note:** Ch 18 is **practical engineering with the densest technical content in Phase 12.** The float→int mapping is short math; the engineering choices around it are dense (granularity, outlier handling, PTQ algorithms, calibration data, activation quantization, KV cache quantization). The voice should reflect this — confident with the math but heavy on operational tradeoffs and concrete numbers. **Bridge back to QLoRA**: section 5 should explicitly note "you saw NF4 in Ch 15 as a black box; here's its full mechanics."

**Phase 12 middle context:** this chapter is the middle of Phase 12. Ch 17 introduced inference cost; Ch 18 is the densest engineering content; Ch 19 (sampling) closes the trilogy. The reader should feel the technical pace pick up here — and feel pride at understanding NF4 properly after Ch 15 left it as a teaser.

**Chapter cadence:** Ch 18 uses the **4-file cadence** (single-topic).

---

## Inputs

State of the repo after session 79 (Ch 17 complete):

- Ch 1-17 all `'published'`
- `research/ch18-quantization/research.md` exists
- `src/lib/chapters.ts` has Ch 1-17 `'published'`, Ch 18-30 `'planned'`
- No `src/pages/ch18-quantization/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch18-quantization/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch18-quantization/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 18's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch18-quantization
description: Quantization — how to deploy large models cheaply by reducing the bits per parameter. The basic float→int mapping (scale + zero point + clip) is short math; the engineering choices around it (per-tensor vs per-channel vs per-group, symmetric vs asymmetric, INT8 vs INT4 vs NF4, GPTQ vs AWQ, weight vs activation quantization) are dense and operationally consequential. Bridges back to Ch 15's QLoRA: NF4 gets its proper treatment here. Combines multiplicatively with Ch 17's optimizations — production stacks use both. The chapter that explains how to fit a 70B model on a single GPU.
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

> Chapter 17 reduced wasted computation: KV cache, continuous batching, Flash Attention, speculative decoding. This chapter takes a complementary route — reduce the *bits per parameter*. A 70B model in BF16 takes 140 GB; in INT4, it fits on a single A100 80GB with room left for KV cache and batching. **Quantization is the optimization that determines whether a model can be deployed at all.**
>
> The math is short: a linear map from floats to integers, with a scale factor and a zero point. The engineering is dense. **Granularity** decisions (per-tensor vs per-channel vs per-group) affect both quality and memory overhead. **Outlier handling** (LLM.int8) is what made INT8 work at LLM scale. **NF4** (which you saw in Chapter 15 as the quantization layer of QLoRA) places quantization levels at equiprobable normal quantiles — better quality per bit when weights are normally distributed. **GPTQ** and **AWQ** are the modern post-training quantization algorithms that close the quality gap between FP16 and INT4.
>
> This chapter unpacks all of it. After it, the reader should be able to: compute the float→int mapping; choose a quantization granularity; explain why INT4 needs per-group; understand NF4's construction; distinguish GPTQ from AWQ; and combine quantization with Ch 17's optimizations for the full Phase 12 inference picture. **Then Chapter 19 closes Phase 12** with sampling — how the decoder picks tokens, given the (quantized) logits.

### Section 1: Why quantize

**Heading:** `## Why quantize`
**Word target:** ~400
**Sub-headings:** `### The memory case`, `### The bandwidth case`, `### The throughput case`

**Teaching beats:**

**The memory case:**
1. **A 70B model in BF16 takes 140 GB** (weights only). Doesn't fit on one A100 80GB.
2. **In INT8: 70 GB**. Fits a single H100 with room for KV cache.
3. **In INT4: 35 GB**. Fits a single A100 80GB with batch + KV cache.
4. **In NF4 with double quantization**: ~35-40 GB; similar to INT4 but much better quality per bit.

**The bandwidth case:**
5. Decode is memory-bound (Ch 17 §2). The GPU spends most of its time loading weights from HBM.
6. **Halving the bytes per weight halves the load time**: 2× decode throughput at INT8, 4× at INT4.
7. **For memory-bound workloads, quantization gives near-linear throughput improvements.**

**The throughput case:**
8. Smaller weights = more concurrent requests fit in memory = larger batch sizes = higher throughput.
9. **Combined with Ch 17's continuous batching**: quantization unlocks more parallelism.

**The accuracy case:**
10. Modern quantization (LLM.int8, NF4 + DQ, AWQ, GPTQ) **loses ≤ 1% on most benchmarks**. Practically lossless.
11. Sub-4-bit quantization is still an active research area; below 4 bits, quality degradation becomes non-trivial.

**Required callout** — type `note`: Quantization is the optimization that often determines whether a model is *deployable at all*, not just whether it's cheap. A 70B model that doesn't fit on a single A100 in BF16 fits comfortably at INT4. **The threshold of "what can be served on what hardware" moves dramatically with quantization.**

**No code in this section.** Setup and motivation.

**Connection forward:** Section 2 introduces the basic mapping.

### Section 2: The basic mapping

**Heading:** `## The basic mapping`
**Word target:** ~600
**Sub-headings:** `### Scale, zero point, clip`, `### Symmetric and asymmetric`, `### Storage overhead`

**Teaching beats:**

**Scale, zero point, clip:**
1. **The float→int mapping is linear**:

```mdx
<Equation label="18.quantize-mapping">
$$x_{\text{int}} = \text{clip}\!\left(\text{round}\!\left(\frac{x_{\text{float}}}{s}\right) + z, \; q_{\min}, \; q_{\max}\right)$$
</Equation>
```

with **scale** $s > 0$ (a float) and **zero point** $z$ (an integer). The clip bounds depend on bit width: $[-128, 127]$ for signed INT8, $[-8, 7]$ for signed INT4.
2. **Dequantization**: $x_{\text{float}} \approx s \cdot (x_{\text{int}} - z)$. The error is the rounding error, bounded by $s/2$.
3. **Choosing $s$ and $z$** given a range $[x_{\min}, x_{\max}]$:
   - **Symmetric**: $z = 0$; $s = \max(|x_{\min}|, |x_{\max}|) / q_{\max}$
   - **Asymmetric**: $z = -\text{round}(x_{\min}/s)$; $s = (x_{\max} - x_{\min}) / (q_{\max} - q_{\min})$

**Symmetric and asymmetric:**
4. **Symmetric**: cheap (no zero-point arithmetic). Best when distributions are roughly zero-centered. **Default for LLM weights** — weight distributions are typically symmetric around zero after initialization and training.
5. **Asymmetric**: handles skewed distributions (e.g., post-ReLU activations are all $\geq 0$). More flexible but slightly more compute per multiply.
6. **In practice**: symmetric for weights; asymmetric where needed for activations.

**Storage overhead:**
7. The quantized weights store $n$ bits per value, but the scale and zero point have their own cost:
   - Per-tensor: 1 scale per tensor → negligible overhead
   - Per-channel: 1 scale per output dim → small overhead
   - Per-group ($G$=64 or 128): 1 scale per $G$ weights → ~0.5 bits per weight overhead at INT4
8. **Effective bits per weight** includes the scale overhead:
   - 7B model at INT8 per-channel: 7.05 GB (negligible scale overhead)
   - 7B model at INT4 per-group ($G$=128): 3.6 GB (8% scale overhead included)

**Required code** — `<RunnableCode>` with basic symmetric quantization at varying bit widths:

```python
import numpy as np

def quantize_symmetric(x, n_bits=8):
    """
    Symmetric quantization to n_bits.
    Returns: (quantized_int, scale).
    """
    qmax = 2**(n_bits - 1) - 1
    qmin = -qmax - 1
    
    scale = np.abs(x).max() / qmax
    if scale == 0:
        scale = 1.0
    
    x_int = np.round(x / scale).clip(qmin, qmax).astype(np.int32)
    return x_int, scale

def dequantize_symmetric(x_int, scale):
    return scale * x_int.astype(np.float32)

# Compare quality at various bit widths
np.random.seed(0)
W = np.random.normal(0, 0.1, 256)

print(f"{'Bits':>5} | {'MSE':>12} | {'Max err':>10}")
print("-" * 38)
for n_bits in [8, 4, 3, 2]:
    W_int, scale = quantize_symmetric(W, n_bits=n_bits)
    W_dq = dequantize_symmetric(W_int, scale)
    mse = ((W - W_dq) ** 2).mean()
    max_err = np.abs(W - W_dq).max()
    print(f"{n_bits:>5} | {mse:>12.7f} | {max_err:>10.4f}")

print("\\nObservations:")
print("- INT8: nearly indistinguishable from FP32 (MSE ~1e-7)")
print("- INT4: visible quantization error (MSE ~1e-5)")
print("- INT2: significant error — only 4 distinct values")
print("\\nThis is why INT8 and INT4 are the production standards;")
print("sub-INT4 (INT2, INT3) requires special techniques and accepts some quality loss.")
```

**Required widget placeholder** — Quantization Explorer (marquee, session 83):

```mdx
<WidgetFrame title="Quantization explorer" caption="Watch a weight distribution get quantized at different bit widths. Slider for bit width (16, 8, 4, 2); toggle between INT (uniform spacing) and NF (normal-spaced) levels. Histogram shows the original distribution, the quantization grid, and the resulting error. The widget makes the precision/storage tradeoff visceral — INT8 is nearly lossless, INT4 is visible but small, INT2 destroys quality.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 83 (marquee)
  </div>
</WidgetFrame>
```

**Required callout** — type `aside`: Quantization theory often presents the float→int mapping as a "lossy compression" — but for LLMs, what matters is whether the lossy output behaves like the lossless original on downstream tasks. **Modern quantization at INT8 and INT4 with the right granularity and outlier handling is empirically nearly lossless** (< 1% on standard benchmarks), even though the per-weight error is non-zero.

**Connection forward:** Section 3 covers granularity — the engineering choice that affects quality the most.

### Section 3: Granularity

**Heading:** `## Granularity — per-tensor, per-channel, per-group`
**Word target:** ~600
**Sub-headings:** `### Three granularities`, `### Why per-group matters for INT4`

**Teaching beats:**

**Three granularities:**
1. **Per-tensor**: one scale + zero point for the entire weight matrix. Cheapest. Quality drops sharply when the tensor has *outlier values*.
2. **Per-channel**: one scale + zero point per output channel (row of the weight matrix). Each row gets its own grid. **Standard for INT8.**
3. **Per-group**: one scale + zero point per group of $G$ contiguous weights within a row. **Essential for INT4.**

**Why per-group matters for INT4:**
4. At INT4 (16 distinct values), local statistics dominate global ones. A group of 64 contiguous weights typically has a much smaller dynamic range than the whole tensor.
5. **Tradeoff**: per-group adds storage. $G$=64 in INT4 ≈ 0.5 bits per weight overhead.
6. **Practical group sizes**: $G$ = 64 or $G$ = 128. Below 32 = significant overhead; above 256 = quality drops noticeably.

**Required code** — `<RunnableCode>` showing per-tensor vs per-channel vs per-group on a matrix with outlier rows:

```python
import numpy as np

def quantize_per_tensor(W, n_bits=4):
    qmax = 2**(n_bits - 1) - 1
    scale = np.abs(W).max() / qmax
    return np.round(W / scale).clip(-qmax-1, qmax) * scale

def quantize_per_channel(W, n_bits=4):
    qmax = 2**(n_bits - 1) - 1
    scales = np.abs(W).max(axis=1, keepdims=True) / qmax
    scales = np.where(scales == 0, 1.0, scales)
    return np.round(W / scales).clip(-qmax-1, qmax) * scales

def quantize_per_group(W, n_bits=4, group_size=64):
    qmax = 2**(n_bits - 1) - 1
    rows, cols = W.shape
    assert cols % group_size == 0
    
    W_q = np.zeros_like(W)
    for g in range(cols // group_size):
        start, end = g * group_size, (g + 1) * group_size
        chunk = W[:, start:end]
        scales = np.abs(chunk).max(axis=1, keepdims=True) / qmax
        scales = np.where(scales == 0, 1.0, scales)
        W_q[:, start:end] = np.round(chunk / scales).clip(-qmax-1, qmax) * scales
    return W_q

# Setup: a weight matrix with one outlier row
np.random.seed(0)
W = np.random.normal(0, 0.1, (64, 256))
W[0] *= 10   # outlier row

print(f"{'Granularity':<28} | {'MSE':>12} | {'Max err':>10}")
print("-" * 58)
for name, fn in [
    ("Per-tensor",              lambda x: quantize_per_tensor(x, n_bits=4)),
    ("Per-channel (per-row)",   lambda x: quantize_per_channel(x, n_bits=4)),
    ("Per-group (G=128)",       lambda x: quantize_per_group(x, n_bits=4, group_size=128)),
    ("Per-group (G=64)",        lambda x: quantize_per_group(x, n_bits=4, group_size=64)),
]:
    W_q = fn(W)
    mse = ((W - W_q) ** 2).mean()
    max_err = np.abs(W - W_q).max()
    print(f"{name:<28} | {mse:>12.6f} | {max_err:>10.4f}")

print("\\nObservations:")
print("- Per-tensor at INT4 is destroyed by the outlier row")
print("  (one big-magnitude row sets the scale; everyone else loses resolution)")
print("- Per-channel handles outlier rows (each row has its own scale)")
print("- Per-group: even better — each group of 64-128 weights has its own scale")
print("\\nINT4 + per-group is the standard configuration for modern LLM quantization.")
```

**Required widget placeholder** — Granularity Visualizer (secondary, session 84):

```mdx
<WidgetFrame title="Granularity visualizer" caption="Watch the same weight matrix get quantized at INT4 with three granularities: per-tensor, per-channel, per-group. The matrix has one outlier row (10× larger weights); see how per-tensor is destroyed by the outlier while per-group preserves quality. Slider for group size shows the quality/storage tradeoff. The widget makes 'why per-group matters' visceral.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 84 (secondary)
  </div>
</WidgetFrame>
```

**Required callout** — type `note`: TID1 from research.md. For a weight matrix $W \in \mathbb{R}^{\text{out} \times \text{in}}$, per-channel quantization gives **one scale per *output* dimension** (row). A common bug is quantizing per-input-channel instead — produces worse quality because activations flow column-wise into the matmul. Check which axis you're scaling.

**Connection forward:** Section 4 covers INT8 — the canonical example.

### Section 4: INT8 — the canonical example

**Heading:** `## INT8 — the canonical example`
**Word target:** ~500
**Sub-headings:** `### The straightforward recipe`, `### The LLM.int8 wrinkle`

**Teaching beats:**

**The straightforward recipe:**
1. For each weight matrix $W$:
   - Compute scale $s = \max(|W|) / 127$ per channel
   - Quantize: $W_q = \text{round}(W / s)$, clip to $[-128, 127]$
2. Store $W_q$ (INT8) + $s$ (one float per channel).
3. At inference: use fused INT8 matmul kernels (NVIDIA's Tensor Cores include INT8 instructions).

**The LLM.int8 wrinkle:**
4. **Dettmers 2022** discovered that LLM activations have **outlier features** — a small number of dimensions (~0.5%) with very large magnitudes.
5. **Naive INT8 quantization on activations crushes everything else into the quantization noise** — the outlier scales dominate.
6. **The fix**: identify outlier dimensions (per-matmul, dynamically); keep those in FP16; quantize the rest to INT8.
7. **Mixed-precision matmul**: INT8 × INT8 for the bulk; FP16 × FP16 for outliers. Add the two paths.
8. **Result**: nearly lossless INT8 quantization at LLM scale. **Made INT8 the default starting point for LLM serving.**

**Required callout** — type `note`: **LLM.int8 was the paper that made INT8 quantization viable for LLMs.** Pre-2022, INT8 quantization at LLM scale was widely considered to cause significant quality loss. Dettmers and colleagues identified the outlier feature problem, gave the mixed-precision fix, and shipped `bitsandbytes` — making INT8 the default for the Hugging Face ecosystem. **This is the canonical example of "engineering insight unlocking a deployment regime."**

**No code in this section.** The earlier symmetric quantization handles INT8; the outlier handling is conceptual.

**Connection forward:** Section 5 covers INT4 and NF4 — going lower.

### Section 5: INT4 and NF4 — going lower

**Heading:** `## INT4 and NF4 — going lower`
**Word target:** ~600 — important (bridges back to Ch 15)
**Sub-headings:** `### INT4 with group-wise scales`, `### NF4 — quantiles of the normal`, `### Double quantization`

**Teaching beats:**

**INT4 with group-wise scales:**
1. **4 bits = 16 distinct values.** Need per-group scaling to handle local statistics.
2. **Storage**: 4 bits + (1 float / $G$) for scales. At $G$=128, ~0.13 bits per weight for scales.
3. **Quality**: per-group INT4 with RTN is 1-3 perplexity points worse than FP16. With GPTQ or AWQ, < 1 perplexity point — practically lossless.

**NF4 — quantiles of the normal:**
4. **The insight** (Dettmers 2023): if weights are roughly normally distributed, **uniform quantization wastes resolution in the tails** (where weights are sparse) and starves the center (where weights are dense).
5. **NF4** places the 16 levels at the **equiprobable quantiles of a standard normal distribution**. Each level represents 1/16 of the probability mass.
6. **The 16 levels** (approximate):

```
-1.0, -0.696, -0.526, -0.395, -0.285, -0.184, -0.091, 0.0,
 0.0796, 0.160, 0.246, 0.338, 0.440, 0.563, 0.723, 1.0
```

7. **Result**: NF4 gives ~1-2% better quality than INT4 RTN on normally-distributed weights, at the same bit width.

**Double quantization:**
8. Per-group scales (FP32) cost ~0.5 bits per weight at $G$=64. **Double quantization** quantizes the scales themselves.
9. Scales are grouped into "super-groups" of 256; quantize the super-group scales to FP8.
10. **Total**: ~4.13 bits per weight effective for NF4 + DQ. Tiny overhead beyond the 4-bit weights.

**Required code** — `<RunnableCode>` constructing NF4 levels:

```python
import numpy as np
from scipy.stats import norm

# NF4 places 16 levels at equiprobable quantiles of the standard normal
def compute_nf4_levels():
    """16 NF4 levels as equiprobable normal quantiles."""
    levels_half = []
    for i in range(8):
        # Center of bin i: (i + 0.5) / 16 of probability mass
        p = (i + 0.5) / 16
        # Inverse CDF of normal, shifted to [0.5, 1.0)
        levels_half.append(norm.ppf(0.5 + p / 2))
    # Symmetric construction
    levels = [-x for x in reversed(levels_half)] + levels_half
    # Normalize so the absolute max is 1.0
    max_level = max(abs(l) for l in levels)
    return [l / max_level for l in levels]

NF4_LEVELS = np.array(compute_nf4_levels())
print(f"NF4 levels (16):")
for l in NF4_LEVELS:
    print(f"  {l:+.4f}")

print(f"\\nObservations:")
print(f"- Levels are denser near zero (where normally-distributed weights are concentrated)")
print(f"- Tails get coarser resolution (where weights are sparse)")
print(f"- This matches the actual weight distribution of a trained model")
print(f"- Trade-off: NF4 is specifically for normal-like distributions;")
print(f"  for other distributions (e.g., post-ReLU), uniform INT4 may work better")
```

**Required callout** — type `aside`: You first saw NF4 in **Chapter 15** as the quantization layer of QLoRA — used to store the frozen base model in 4 bits while training LoRA adapters in BF16. **NF4 + double quantization is what made fitting Llama-65B fine-tuning on a single A100 possible.** Now you've seen its full mechanics: equiprobable normal quantiles, per-group scales, double-quantized scale factors. The pieces fit together: NF4 is the quantization recipe; QLoRA is the training pattern that exploits it.

**Connection forward:** Section 6 covers modern PTQ — GPTQ and AWQ.

### Section 6: Modern PTQ — GPTQ and AWQ

**Heading:** `## Modern PTQ — GPTQ and AWQ`
**Word target:** ~600
**Sub-headings:** `### Round-to-nearest as baseline`, `### GPTQ — Hessian-aware`, `### AWQ — activation-aware`

**Teaching beats:**

**Round-to-nearest as baseline:**
1. **RTN**: quantize each weight independently to its nearest grid point. Fast, simple. Ignores correlations between weights.
2. **Limitation**: errors in one weight aren't compensated; they accumulate through the layer's matmul.

**GPTQ — Hessian-aware:**
3. **GPTQ** (Frantar 2023): use a small calibration set (~128 sequences of ~2048 tokens) to compute the approximate Hessian of the per-layer loss.
4. **The algorithm**: quantize weights *one at a time*. When weight $i$ is rounded with error $\epsilon$, **adjust the remaining (unquantized) weights to compensate**.
5. The Hessian determines how much to adjust each remaining weight:

```mdx
<Equation label="18.gptq-update">
$$\Delta w_j = -\frac{(w_q - w_i)}{[H^{-1}]_{i,i}} [H^{-1}]_{i,j}$$
</Equation>
```

6. **Cost**: ~1 GPU-hour for a 7B model. **Result**: near-FP16 quality at INT4.

**AWQ — activation-aware:**
7. **AWQ** (Lin 2023): the surprisingly simple alternative. Identify "important" weight channels — those that multiply large activations during calibration.
8. **Scale up those channels** before quantization; apply the inverse scale to activations at inference.
9. The scaling moves important weights into the high-resolution part of the quantization range.
10. **Cost**: ~10× cheaper than GPTQ to compute. **Quality**: competitive with GPTQ.

**When to use which:**
11. **AWQ**: fast PTQ; widely supported (vLLM, TensorRT-LLM); easy to apply.
12. **GPTQ**: slightly better quality at slower PTQ; also widely supported.
13. **Both achieve <1% degradation** on standard benchmarks at INT4.

**Required callout** — type `note`: MC8 from research.md. "PTQ doesn't need calibration data." False for modern PTQ. **RTN needs no calibration**; just round each weight. But **GPTQ and AWQ use a small calibration dataset** (~128 sequences) to estimate per-layer statistics. **Calibration matters**: 128 random web sequences vs 128 task-relevant sequences can produce noticeably different quantized models. **Use representative calibration data** — your target distribution, not just "any data."

**No code in this section.** Conceptual coverage; pseudo-code for GPTQ would be too involved for a chapter section.

**Connection forward:** Section 7 covers activation quantization.

### Section 7: Activation quantization

**Heading:** `## Activation quantization`
**Word target:** ~400
**Sub-headings:** `### Why activations are harder`, `### SmoothQuant`

**Teaching beats:**

**Why activations are harder:**
1. **Weights are static**: quantization happens once. Activations are dynamic: distributions change per input.
2. **Activations have larger dynamic range**: outliers happen at runtime.
3. **Activation quantization must happen at inference time**, every forward pass.
4. **Without care**, activation quantization causes much more quality loss than weight quantization.

**SmoothQuant:**
5. **The insight** (Xiao 2023): quantization difficulty of activations and weights is *coupled* through the matmul $W \cdot a$.
6. **The trick**: apply a per-channel scaling factor $s$:
   - Multiply weights by $s$
   - Divide activations by $s$
   - Net result: $(W s)(a / s) = W a$ — unchanged
7. **But the activation range is now smaller** → easier to quantize.
8. **The weight range grew** → still easy because weights are static and known.

**The full W8A8 stack:**
9. W8 (weights at INT8 per-channel) + A8 (activations at INT8 dynamic) + SmoothQuant → fully INT8 matmul.
10. **In practice**: W4A16 is more common than W8A8 for decode workloads. The weights are the bandwidth bottleneck, not the activations.

**Required callout** — type `aside`: For decode workloads (Ch 17 §2), **W4A16 (4-bit weights, 16-bit activations) is the typical production configuration**, not full W8A8. Decode is memory-bound by weight loading; quantizing weights gives the most leverage. Activation quantization adds engineering complexity for modest additional speedup. **Many production stacks (vLLM, TGI) default to W4A16 with GPTQ or AWQ weights.**

**No code in this section.** Conceptual.

**Connection forward:** Section 8 wraps up with the combined picture.

### Section 8: The full picture — combining with Ch 17

**Heading:** `## The full picture — combining with Ch 17`
**Word target:** ~400
**Sub-headings:** `### The optimization stack`, `### What's next`

**Teaching beats:**

**The optimization stack:**
1. **A modern production inference stack combines**:

| Optimization | Source | Effect |
|---|---|---|
| KV cache | Ch 17 | $O(N^2) \to O(N)$ per token |
| Continuous batching | Ch 17 | High GPU utilization |
| Flash Attention | Ch 17 | $O(N^2) \to O(N)$ memory |
| Speculative decoding | Ch 17 | 2-3× decode amortization |
| PagedAttention | Ch 17 | 2-4× concurrent requests |
| **Weight quantization** | **Ch 18** | **2-4× weight bandwidth** |
| **KV cache quantization** | **Ch 18** | **2-4× cache memory** |

2. **Combined effect** on a 70B model on a single A100:
   - Naive: ~50 tok/sec single-stream; one sequence at a time
   - Production stack (Ch 17 + Ch 18): ~500-1000 tok/sec aggregate
   - **10-20× total speedup**

3. **For a service handling 1B tokens/day**:
   - Naive: ~30 A100s
   - Production stack: 2-3 A100s
   - **Order-of-magnitude operational cost savings.**

**What's next:**
4. **Chapter 19** closes Phase 12 with sampling — how the decoder picks tokens, given logits from the (quantized) forward pass. Top-k, top-p, temperature, beam search, constrained decoding.
5. **After Phase 12**, the back half of the curriculum opens: capabilities (Ch 20-23: reasoning, tools, RAG, multimodal), safety (Ch 24-26), agents (Ch 27-30).

**Sample close** (rewrite in chapter voice):

> Quantization is the optimization that **decides whether a model can be deployed at all**. A 70B model in BF16 needs 2× A100 for weights alone; in INT4, it fits comfortably on one with batching headroom. The basic float→int mapping is short math; the engineering choices around it — granularity (per-group at INT4), outlier handling (LLM.int8), level placement (NF4 for normally-distributed weights), PTQ method (GPTQ or AWQ), activation handling (SmoothQuant), KV cache quantization — are dense and operationally consequential.
>
> **Chapter 19 closes Phase 12** with sampling: top-k, top-p, temperature, beam search, constrained decoding. Where this chapter and Ch 17 reduced the *cost* of inference, Ch 19 governs the *behavior* — how the decoder actually picks tokens given the logits. After Ch 19, **Phase 12 is complete** and the back half of the curriculum opens: capabilities, safety, agents.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 18, slug: 'ch18-quantization', title: 'Quantization', partNum: 6, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch18-quantization/index.astro && rm src/pages/ch18-quantization/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch18-quantization/`** renders with:
   - Chapter eyebrow ("Chapter 18") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 3, 5)
   - 2 `<WidgetFrame>` placeholders (sections 2 and 3)
   - Labeled equations `<Equation label="18.quantize-mapping">` (section 2) and `<Equation label="18.gptq-update">` (section 6)
   - At least 5 callouts (pick from the 6+ described above)
3. **Sidebar:** Ch 1-17 published; Ch 18 active (draft); Ch 19-30 dimmed
4. **Prev/next nav at bottom of Ch 18:** prev = Ch 17 (active); next = Ch 19 (disabled)
5. **TOC on Ch 18** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3800 and 4500 words
7. **`npm run typecheck`** passes
8. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 83 and 84 own them.
- ❌ **Do not write exercises.** Session 84 owns.
- ❌ **Do not flip Ch 18's status to `'published'`.** Session 84 owns.
- ❌ **Do not derive GPTQ's full optimization.** Cite Frantar 2023; sketch the Hessian-update idea.
- ❌ **Do not derive AWQ's activation-importance metric.** Cite Lin 2023; explain the scaling intuition.
- ❌ **Do not enumerate every quantization paper.** Cover LLM.int8, NF4 (QLoRA), GPTQ, AWQ, SmoothQuant. That's enough.
- ❌ **Do not cover pruning** beyond a mention. Out of scope.
- ❌ **Do not cover 2-bit / 3-bit / 1.58-bit quantization** in depth. Brief mention; an emerging area.
- ❌ **Do not modify Ch 1-17.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch18-quantization/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch18-quantization/index.astro 2>/dev/null || true
git commit -m "session 82: Ch 18 prose — quantization (Phase 12 middle)"
git push origin main
```

---

## Notes for the session author

**On the practical-engineering voice continuing from Ch 17:**
Ch 18 sits in the same voice register as Ch 17: practical engineering, concrete numbers, honest tradeoffs. The technical content is denser (the float→int mapping, granularity choices, modern PTQ algorithms) but the *tone* is the same — grounded, numbers-heavy, occasionally tongue-in-cheek. **Don't let the density make the prose feel academic.** Keep the practical lens.

**On the bridge back to QLoRA in section 5:**
Section 5's callout is important. Reader saw NF4 in Ch 15 as a black box ("we use this 4-bit format called NF4 for the frozen base"). **Section 5 unpacks it**: equiprobable normal quantiles, per-group scales, double quantization. Notes-for-author: "**The pieces fit together: NF4 is the quantization recipe; QLoRA is the training pattern that exploits it.**" Reader feels the chapters connect.

**On the LLM.int8 story being the canonical "engineering insight" moment:**
Section 4's callout on LLM.int8 is the chapter's most narrative-rich moment. **It's the story of "engineering insight unlocking a deployment regime."** Before LLM.int8 (2022), people thought INT8 quantization at LLM scale was lossy. Dettmers et al. found the outlier feature problem, gave the mixed-precision fix, shipped `bitsandbytes`. Now INT8 is the default. **Honor this moment in the prose** — it's the kind of insight the chapter wants the reader to absorb the *style* of.

**On granularity being the chapter's most important pedagogical decision:**
Section 3 is dense because granularity affects quality more than almost any other choice. **Per-tensor at INT4 is destroyed by outliers; per-group recovers nearly all of the quality loss.** The runnable code makes this visible: same matrix, same bit width, vastly different MSE based on granularity alone. **This is the single most important "you must know this" technical content in the chapter.**

**On GPTQ vs AWQ being a paired treatment:**
Section 6 covers both because they're *the* modern PTQ methods. Notes-for-author: **"Both achieve <1% degradation on standard benchmarks at INT4. The choice between them is operational: AWQ is faster to apply; GPTQ has a slight quality edge."** Don't overstate the difference — both work; both are widely supported.

**On activation quantization being briefer:**
Section 7 is short because (a) activation quantization is operationally less common than weight quantization, and (b) the SmoothQuant trick is conceptually clean. The reader should walk away knowing that activation quantization exists, why it's harder, that SmoothQuant solves it via per-channel scaling, **and that W4A16 is more common than W8A8 in practice.**

**On the section 8 closing combining Ch 17 + Ch 18:**
The optimization stack table is the most important content in section 8. Reader sees all the optimizations together; sees that they're complementary, not substitutes; sees the combined effect (10-20× speedup, order-of-magnitude cost savings). **This frames Ch 19 as "the last piece of Phase 12."**

**On the widget placements:**
- **Marquee (Quantization Explorer)** in section 2: where the basic mapping is introduced. Reader watches a weight distribution get quantized at different bit widths; sees the rounding error directly. Also covers NF4 toggle.
- **Secondary (Granularity Visualizer)** in section 3: alongside the most quality-affecting engineering choice. Reader sees per-tensor destroyed by outliers and per-group recovering quality.

Both widgets early; sections 4-8 are text + the runnable in section 5.

**On the 3 runnable code blocks:**
- Section 2 (basic symmetric quantization): reader implements the float→int mapping; sees quality across bit widths
- Section 3 (per-tensor vs per-channel vs per-group): reader implements all three; sees the outlier-row effect
- Section 5 (NF4 levels via scipy): reader constructs the actual NF4 levels; sees the unequal spacing

Three runnables, three sections, ascending complexity. Standard pattern.

**Pedagogical claim of the chapter:**
"Quantization is the optimization that decides whether a model can be deployed at all. The basic float→int mapping is short math; the engineering choices (granularity, outlier handling, NF4 vs INT4, PTQ method) are dense and operationally consequential. Modern recipes (LLM.int8, NF4+DQ, GPTQ, AWQ) are nearly lossless at INT8 and INT4. Quantization combines multiplicatively with Ch 17's optimizations — together, 10-20× throughput improvement vs naive. **Without quantization, a 70B model needs 2× A100 for weights alone; with INT4, it fits on one.**"

**Phase 12 middle tone:**
This chapter is the technical center of Phase 12. Don't shy away from the density — the reader needs the rigor. But keep the practical lens and bridge back to QLoRA (Ch 15) so the connections feel earned.

Build with care.
