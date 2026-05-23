# Chapter 18 — Quantization: research

> Curated source material for Chapter 18's build sessions. **The second chapter of Phase 12 (Inference).** Where Ch 17 reduced *wasted computation* (KV cache, batching, Flash Attention, speculative decoding), Ch 18 reduces the *bits per parameter*. The two combine multiplicatively — a production stack uses both. **Practical engineering chapter with a side of theory**: the math of float→int mapping is short but the engineering choices around it (symmetric vs asymmetric, per-tensor vs per-channel vs per-group, PTQ vs QAT, AWQ vs GPTQ) are dense and operationally consequential. Bridges back to Ch 15 (QLoRA's NF4 was a teaser); bridges forward to combined throughput numbers in Ch 19. Single-topic chapter; uses the **4-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Quantization

**Premise:** Modern LLMs are trained in FP32 or BF16 — 32 or 16 bits per parameter. For inference, this is wasteful: most parameters don't need that much precision to produce nearly identical outputs. **Quantization** reduces the bits per parameter to INT8 (2× compression), INT4 (4× compression), or even lower (NF4, 2-bit). The result: smaller memory footprint, faster memory access, higher throughput. Modern recipes (LLM.int8, NF4, GPTQ, AWQ) are nearly lossless at the bit widths they target. **This is the chapter that explains how to deploy a 70B model on a single GPU.**

**Two broad approaches covered:**

1. **Post-training quantization (PTQ)**: take a trained model and quantize its weights. No retraining. Fast, common. Algorithms: round-to-nearest, GPTQ, AWQ.
2. **Quantization-aware training (QAT)**: train (or fine-tune) the model with simulated quantization. Higher quality at low bit widths but expensive. Less common in LLM era.

**Out of scope (other chapters):**
- Distillation (Ch 16) — reduces parameter *count*, not bits per parameter
- Inference optimization (Ch 17) — already covered; this chapter assumes its primitives
- Sampling (Ch 19) — sampling doesn't depend on quantization
- Pruning — briefly mentioned; not the focus

**In scope and locked:**
- **The basic float-to-int mapping**: scale + zero point + clipping
- **Symmetric vs asymmetric quantization**: tradeoffs and use cases
- **Per-tensor, per-channel, per-group quantization**: granularity of scale factors
- **INT8 quantization**: the canonical example; LLM.int8 (Dettmers 2022)
- **INT4 quantization**: more aggressive; group-wise is essential
- **NF4** (Dettmers 2023): the 4-bit format optimized for normal distributions; the format behind QLoRA
- **GPTQ** (Frantar 2023): post-training quantization with second-order calibration
- **AWQ** (Lin 2023): activation-aware weight quantization
- **Activation quantization**: harder than weight quantization; SmoothQuant (Xiao 2023)
- **KV cache quantization**: applying these techniques to the cache (links to Ch 17)
- **The combined picture**: quantization × KV cache × continuous batching × speculative decoding

**Suggested chapter structure** (8 sections):

1. Why quantize (~400 words)
2. The basic mapping — scale, zero point, clipping (~600 words)
3. Symmetric, asymmetric, per-tensor, per-channel, per-group (~600 words)
4. INT8 — the canonical example (~500 words)
5. INT4 and NF4 — going lower (~600 words — important; bridges to Ch 15 QLoRA)
6. Modern PTQ — GPTQ and AWQ (~600 words)
7. Activation quantization (~400 words)
8. The full picture — combining with Ch 17 (~400 words)

Target: ~4100 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Jacob et al. 2018 — "Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference"
- **arXiv:** [1712.05877](https://arxiv.org/abs/1712.05877)
- **What it contributed:** the foundational paper on neural-network quantization. Established the float→int mapping with scale + zero point, the per-tensor/per-channel distinction, and quantization-aware training basics. **The conceptual root of all modern LLM quantization.**

### Dettmers et al. 2022 — "LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale"
- **arXiv:** [2208.07339](https://arxiv.org/abs/2208.07339)
- **What it contributed:** **the paper that proved INT8 quantization works at LLM scale.** Key insight: a small number of outlier features in LLM activations break naive INT8 quantization. The fix: keep outliers in FP16, quantize the rest. **Made INT8 quantization the default for LLM serving.**

### Dettmers et al. 2023 — "QLoRA: Efficient Finetuning of Quantized LLMs"
- **arXiv:** [2305.14314](https://arxiv.org/abs/2305.14314)
- **What it contributed:** introduced **NF4** — a 4-bit data type designed for weights that follow a normal distribution. Combined with double quantization (quantizing the quantization constants themselves) for further compression. **Already covered in Ch 15 as the quantization layer of QLoRA**; this chapter gives NF4 its proper treatment.

### Frantar et al. 2023 — "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers"
- **arXiv:** [2210.17323](https://arxiv.org/abs/2210.17323)
- **What it contributed:** **GPTQ** — a post-training quantization algorithm using second-order information (approximate Hessian) to optimize the quantization grid. Reduces error vs round-to-nearest. Industry-standard for INT4 PTQ.
- **For the chapter:** section 6.

### Lin et al. 2023 — "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration"
- **arXiv:** [2306.00978](https://arxiv.org/abs/2306.00978)
- **What it contributed:** **AWQ** — preserves the most important weight channels (those with high activation magnitudes) by scaling them before quantization. Surprisingly simple; competitive with GPTQ at much lower computational cost.
- **For the chapter:** section 6 paired reference.

### Xiao et al. 2023 — "SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models"
- **arXiv:** [2211.10438](https://arxiv.org/abs/2211.10438)
- **What it contributed:** **SmoothQuant** — a per-channel transformation that shifts the quantization difficulty from activations (hard) to weights (easy). Enables W8A8 (8-bit weights + 8-bit activations) quantization.
- **For the chapter:** section 7.

### Frantar & Alistarh 2023 — "SparseGPT: Massive Language Models Can Be Accurately Pruned in One-Shot"
- **arXiv:** [2301.00774](https://arxiv.org/abs/2301.00774)
- **What it contributed:** one-shot post-training pruning of LLMs. Briefly mention as a parallel compression technique; not the focus.

---

## Core concepts

### Concept 1: Why quantize

**The memory case:**
- A 70B model in BF16 takes 140 GB (weights only)
- In INT8: 70 GB (fits a single H100 with room for KV cache)
- In INT4: 35 GB (fits a single A100 80GB with room for KV cache and batching)
- In NF4: ~35-40 GB (similar to INT4 but with much better quality per bit)

**The bandwidth case:**
- Decode is memory-bound (Ch 17, Concept 3): the GPU spends most of its time loading weights from HBM
- Halving the bytes per weight halves the time to load — **2× decode throughput at INT8, 4× at INT4**
- For memory-bound workloads, quantization gives near-linear speedups

**The throughput case:**
- Smaller weights = more concurrent requests fit in memory = larger batch sizes = higher throughput
- Combined with Ch 17's continuous batching: quantization unlocks more parallelism

**The accuracy case:**
- Modern quantization (LLM.int8, NF4, AWQ, GPTQ) loses ≤ 1% on most benchmarks
- This is *practically* lossless for most use cases
- The exception: very-low-bit quantization (2-bit, 3-bit) is still an active research area

### Concept 2: The basic mapping

The float→int mapping is a linear transformation:

$$x_{\text{int}} = \text{round}\left(\frac{x_{\text{float}}}{s}\right) + z$$

where:
- $s$ = **scale** (a positive float)
- $z$ = **zero point** (an integer)
- The result is clipped to the integer range, e.g., $[-128, 127]$ for INT8

The inverse (dequantization):

$$x_{\text{float}} \approx s \cdot (x_{\text{int}} - z)$$

The error is in the rounding step: $|x_{\text{float}} - s \cdot (x_{\text{int}} - z)| \leq s/2$.

**Choosing $s$ and $z$:**
- Given a range $[x_{\min}, x_{\max}]$ of floats to quantize:
  - **Symmetric**: $z = 0$; $s = \max(|x_{\min}|, |x_{\max}|) / 127$ (for INT8)
  - **Asymmetric**: $z = -\text{round}(x_{\min}/s)$; $s = (x_{\max} - x_{\min}) / 255$ (for INT8)

```mdx
<Equation label="18.quantize-mapping">
$$x_{\text{int}} = \text{clip}\left(\text{round}\left(\frac{x_{\text{float}}}{s}\right) + z, \; q_{\min}, \; q_{\max}\right)$$
</Equation>
```

**Storage cost:**
- Float: 32 or 16 bits per number
- INT8: 8 bits + (per-tensor or per-channel) scale + zero point overhead
- INT4: 4 bits + scale/zero-point overhead

For a 7B model:
- FP16: 14 GB
- INT8 with per-channel scales: ~7.05 GB (the .05 is the scale overhead)
- INT4 with per-group scales: ~3.6 GB

### Concept 3: Symmetric vs asymmetric; per-tensor vs per-channel vs per-group

**Symmetric vs asymmetric:**
- **Symmetric quantization** ($z = 0$): the float range is assumed to be symmetric around zero. Cheaper compute (no zero-point offset). Used when distributions are roughly zero-centered — most LLM weights.
- **Asymmetric quantization** ($z \neq 0$): handles ranges that are skewed (e.g., post-ReLU activations are all $\geq 0$). More flexible; slightly more compute.
- **For LLM weights**: symmetric is the default. For activations (especially after ReLU/GELU), asymmetric is common.

**Granularity of scale factors:**
- **Per-tensor quantization**: one scale + zero point for the entire weight matrix. Cheapest in memory; worst quality.
- **Per-channel quantization**: one scale + zero point per output channel (row of the weight matrix). Standard for INT8. Reasonable quality/memory tradeoff.
- **Per-group quantization**: one scale + zero point per group of $G$ contiguous weights (e.g., $G = 64$ or $G = 128$). Essential for INT4. Better quality at the cost of more scale storage.

**Why per-group matters for INT4:**
At INT4 (16 distinct values), the quantization error grows. **Local statistics dominate global statistics.** A group of 64 consecutive weights typically has a much smaller dynamic range than the whole tensor — making the quantization grid much more efficient.

**Tradeoff**: per-group at $G = 64$ in INT4 adds ~3-5% storage overhead but recovers most of the quality loss.

### Concept 4: INT8 — the canonical example

**The straightforward recipe:**
1. For each weight matrix $W$:
   - Compute scale $s = \max(|W|) / 127$ (symmetric, per-channel)
   - Quantize: $W_q = \text{round}(W / s)$
2. Store $W_q$ (INT8) + $s$ (one float per channel)
3. At inference: dequantize on the fly during matmul, or use fused INT8 kernels

**The LLM.int8 wrinkle:**
Dettmers 2022 discovered that LLM activations have **outlier features** — a small number of dimensions with very large magnitudes. Naive INT8 quantization on activations crushes everything else into the quantization noise.

**The LLM.int8 fix:**
- Identify outlier dimensions (typically <0.5% of features)
- Keep those in FP16; quantize the rest to INT8
- Mixed-precision matmul: INT8 × INT8 for the bulk; FP16 × FP16 for outliers
- Result: nearly lossless INT8 quantization at LLM scale

**Modern frameworks:**
- bitsandbytes implements LLM.int8 natively
- vLLM, TGI, TensorRT-LLM all support INT8 inference
- INT8 quantization is the **default starting point** for LLM serving

### Concept 5: INT4 and NF4 — going lower

**INT4 with group-wise scales:**
- 4 bits per weight = 16 distinct values
- Symmetric, per-group quantization with $G = 64$ or $G = 128$
- Storage: 4 bits + (1 float / G) for scales
- For a 7B model with $G = 128$: ~3.6 GB

**The quality story for INT4:**
- Round-to-nearest INT4 with per-tensor: significant quality loss (5-15 perplexity points)
- INT4 per-group: minor quality loss (1-3 perplexity points)
- INT4 with GPTQ or AWQ: nearly lossless (< 1 perplexity point)

**NF4 — the 4-bit format for normal distributions:**
- Standard INT4 uses 16 evenly-spaced quantization levels
- **NF4** (Normal Float 4) uses 16 levels spaced so they're *equiprobable* under a normal distribution
- More resolution where weights are dense; less where they're sparse
- Result: 1-2% better quality than INT4 RTN at the same bit width

**NF4 levels** (approximate; for reference):
```
-1.0, -0.696, -0.526, -0.395, -0.285, -0.184, -0.091, 0.0,
 0.0796, 0.160, 0.246, 0.338, 0.440, 0.563, 0.723, 1.0
```

(These are the cumulative quantiles of a standard normal; each level represents 1/16 of the probability mass.)

**Double quantization** (also from QLoRA):
- The per-group scales themselves are 32-bit floats: $G = 64$ scales = 0.5 bits per weight overhead
- **Double quantization**: quantize the scales to 8 bits with a per-group structure of their own
- Saves another ~0.3 bits per weight
- Total: 4.0 + 0.13 (scales) = ~4.13 bits per weight effective

**NF4 + double quantization is the QLoRA recipe** (Ch 15). Now you've seen its full mechanics.

### Concept 6: Modern PTQ — GPTQ and AWQ

**Round-to-nearest (RTN) is the baseline.** Quantize each weight to its nearest grid point. Fast; ignores correlations between weights.

**GPTQ** (Frantar 2023):
1. Use a small calibration dataset (~128 sequences of ~2048 tokens)
2. Compute the Hessian of the per-layer loss with respect to the layer's weights
3. **Quantize weights one at a time, adjusting the remaining (unquantized) weights to compensate** for the rounding error of each step
4. The Hessian-aware adjustment minimizes downstream error
5. Computational cost: ~1 GPU-hour for a 7B model

**Why it works**: instead of rounding each weight independently, GPTQ optimizes the *combined* effect. Errors in one weight can be compensated by adjustments in others.

**AWQ** (Lin 2023):
1. Identify "important" weight channels — those with high activation magnitudes during calibration
2. **Scale up those channels** before quantization (and apply the inverse scale to activations at inference)
3. The scaling moves important weights into the high-resolution part of the quantization range
4. Surprisingly simple; competitive with GPTQ at ~10× lower computational cost

**When to use which:**
- **AWQ**: fast PTQ; easy to apply; widely supported (vLLM, TensorRT-LLM)
- **GPTQ**: slightly better quality at slower PTQ; also widely supported
- **In practice, both achieve <1% degradation on standard benchmarks at INT4**

```mdx
<Equation label="18.gptq-update">
$$\Delta w_j = -\frac{(w_q - w_i)_i}{[H^{-1}]_{i,i}} [H^{-1}]_{i,j}$$
</Equation>
```

(GPTQ's per-weight update: when weight $i$ is rounded to $w_q$, weight $j$ is adjusted by $\Delta w_j$ to compensate.)

### Concept 7: Activation quantization

**The challenge:**
- Weights are static: quantization happens once
- Activations are dynamic: distributions change per input
- Activations also have **larger dynamic range**: outliers happen
- **Activations are harder to quantize.**

**SmoothQuant** (Xiao 2023):
- Insight: the difficulty of quantizing activations and weights is *coupled* through the matmul
- Apply a per-channel scaling factor $s$ that *increases* weights and *decreases* activations
- Net result of $W \cdot a$ unchanged: $(W \cdot s) \cdot (a / s)$
- But the activation range is now smaller → easier to quantize
- The weight range grew → but weights are still easy to quantize because they're static

**The full W8A8 stack:**
- W8: weights at INT8 (per-channel)
- A8: activations at INT8 (per-token dynamic quantization, with SmoothQuant)
- Result: fully INT8 matmul; further speedup over W8A16

**W4A16 is more common in practice** than W8A8:
- W4 (weights at INT4): 4× weight compression
- A16 (activations stay at BF16): no activation quantization risk
- For decode (memory-bound), this is what matters: the weights are the bandwidth bottleneck

### Concept 8: KV cache quantization (bridge to Ch 17)

**The KV cache is a large memory consumer** at long context (Ch 17, Concept 2):
- Llama-70B at 128K: ~22 GB per sequence
- KV cache often equals or exceeds the model weights at long context

**Quantizing the KV cache:**
- INT8 KV cache: 2× memory reduction; ~minor quality loss
- INT4 KV cache: 4× memory reduction; small quality loss (a few perplexity points)
- Same techniques as weights: per-token, per-channel, or per-group scaling
- **Mostly drop-in: existing inference stacks (vLLM, TGI) support it**

**Why it works:**
- KV cache entries are noisy by nature (they encode many subtle features)
- Small perturbations to individual entries average out across the attention sum
- More robust to quantization than activations, less robust than weights

### Concept 9: The full picture — combining with Ch 17

A modern production inference stack:

| Optimization | Source | Effect |
|---|---|---|
| KV cache | Ch 17 | $O(N^2) \to O(N)$ per token |
| Continuous batching | Ch 17 | High GPU utilization |
| Flash Attention | Ch 17 | $O(N^2) \to O(N)$ memory |
| Speculative decoding | Ch 17 | 2-3× decode amortization |
| PagedAttention | Ch 17 | 2-4× concurrent requests |
| **INT8 / INT4 quantization** | **Ch 18** | **2-4× weight bandwidth** |
| **KV cache quantization** | **Ch 18** | **2-4× cache memory** |

**Combined effect on a 70B model on A100:**
- Naive: ~50 tok/sec single-stream; one sequence at a time
- Production stack (Ch 17 + Ch 18): ~500-1000 tok/sec aggregate; many concurrent sequences
- **10-20× total speedup**

**For a service handling 1B tokens/day:**
- Naive: ~30 A100s of capacity needed
- Production stack: 2-3 A100s
- **Order-of-magnitude operational cost savings.**

---

## Glossary

- **Quantization**: representing floating-point values with reduced-precision integers.
- **Scale ($s$)**: the floating-point multiplier in the quantization mapping.
- **Zero point ($z$)**: the integer offset in asymmetric quantization.
- **Symmetric quantization**: $z = 0$; the quantization grid is centered on zero.
- **Asymmetric quantization**: $z \neq 0$; the grid is shifted for skewed distributions.
- **Per-tensor**: one scale + zero point for the entire tensor.
- **Per-channel**: one per output channel (row of weight matrix).
- **Per-group**: one per group of $G$ consecutive weights.
- **PTQ (Post-Training Quantization)**: quantize a trained model without retraining.
- **QAT (Quantization-Aware Training)**: train with simulated quantization.
- **RTN (Round-to-Nearest)**: the simplest PTQ; just round to grid points.
- **LLM.int8**: Dettmers 2022; mixed-precision INT8 with FP16 outliers.
- **NF4**: 4-bit format with quantization levels spaced by normal-distribution quantiles.
- **Double quantization**: quantizing the scale factors of a quantized tensor.
- **GPTQ**: Hessian-aware PTQ; quantizes one weight at a time, adjusts others.
- **AWQ**: Activation-aware Weight Quantization; scales important channels before quantization.
- **SmoothQuant**: shifts quantization difficulty from activations to weights via per-channel scaling.
- **W8A8 / W4A16**: weight bits / activation bits (W=weights, A=activations).
- **Calibration data**: a small dataset used by PTQ algorithms to estimate per-layer statistics.

---

## Pedagogical analogies

### 1. Quantization as "rounding to coins"
Imagine you can only pay with quarters. Every price has to be rounded to the nearest $0.25. Some prices ($1.00, $2.25) are exact; others ($1.13, $1.99) round with error. **The quantization grid is the available coins**; the error is the rounding loss. Coarser grids (only quarters) lose more precision but require less storage.

Best used for: section 2 the basic mapping.

### 2. Per-channel as "different coin denominations for different aisles"
At the grocery store, fresh produce might be priced in $0.05 increments while electronics are priced in $1.00 increments. **Per-channel quantization is the same idea**: each output channel of a weight matrix gets its own quantization grid sized to its dynamic range. A channel with weights in $[-0.01, 0.01]$ doesn't need the same grid as a channel with weights in $[-10, 10]$.

Best used for: section 3 granularity.

### 3. NF4 as "coin sizes matched to where the money lives"
If most prices are between $0.50 and $2.00, you'd want lots of small coins in that range and fewer in less-used ranges. **NF4's quantization levels are placed so that each level represents an equal probability mass** under a standard normal — more resolution where the weights actually live.

Best used for: section 5 NF4.

### 4. AWQ as "spending more on the coins that matter most"
Some weights have outsized impact on outputs (those with high activation magnitudes). **AWQ scales up those weights before quantization** so they land on a finer part of the quantization grid. The total information cost is the same, but it's allocated where it matters.

Best used for: section 6 AWQ.

### 5. GPTQ as "compensating one cashier's rounding by adjusting the next"
If the first cashier rounds your $1.07 to $1.00, the next cashier can charge you $0.07 more on the next item to compensate. **GPTQ does this for weights**: when weight $i$ is rounded with error $\epsilon$, weight $j$ is adjusted by an amount proportional to $\epsilon$ and the inverse Hessian.

Best used for: section 6 GPTQ.

---

## Common misconceptions

### MC1: "Quantization always degrades quality significantly."
**Reality:** false in practice. **Modern PTQ methods (LLM.int8, NF4 + DQ, AWQ, GPTQ) lose <1% on standard benchmarks** at INT8 and often at INT4. The "degradation" framing comes from older work; modern recipes are nearly lossless at the bit widths they target.

### MC2: "Lower bits = more compression always wins."
**Reality:** false. Below 4 bits, quality degradation becomes significant — 2-bit and 3-bit quantization is still an active research area. **INT4 is the typical floor for nearly-lossless inference today.** Lower than that requires either accepting some quality loss or using exotic methods (e.g., AQLM, QuIP#).

### MC3: "Quantization-aware training is always better than PTQ."
**Reality:** false at LLM scale. **PTQ with good calibration (AWQ, GPTQ) is competitive with QAT** and much cheaper. QAT requires fine-tuning with simulated quantization; for a 70B model that's expensive. For LLMs, PTQ dominates.

### MC4: "Quantization is just for inference."
**Reality:** false. **QLoRA** (Ch 15) shows quantization can also be used during fine-tuning: store the frozen base in NF4 while training LoRA adapters in BF16. **Quantization is now part of both training and inference workflows.**

### MC5: "INT8 means all weights are 8-bit integers."
**Reality:** not quite. **INT8 quantization usually keeps accumulation in higher precision** (FP32 or INT32) and the bias/output in FP. The "INT8" refers to the bit width of the *quantized weights and the multiplication step*. Modern hardware (A100 Tensor Cores, H100) has dedicated INT8 matmul instructions that handle this internally.

### MC6: "Quantization compresses the model 4×."
**Reality:** mostly true for weights but **the throughput speedup is more nuanced.** For decode (memory-bound): roughly linear speedup with quantization (2× for INT8, 4× for INT4). For prefill (compute-bound): often smaller speedups because compute is the bottleneck. **Quantization helps decode more than prefill.**

### MC7: "Activation quantization is just like weight quantization."
**Reality:** false. **Activations are harder.** They're dynamic (must be quantized at runtime), have larger dynamic ranges, and contain outlier features. Modern techniques (SmoothQuant, LLM.int8 outlier handling) are necessary to make activation quantization work without quality loss.

### MC8: "PTQ doesn't need calibration data."
**Reality:** modern PTQ does. **RTN (round-to-nearest) needs no calibration**; just round each weight. But GPTQ and AWQ use a small calibration dataset (~128 sequences) to estimate per-layer statistics. **Calibration matters**: 128 random sequences vs 128 task-relevant sequences can produce noticeably different quantized models.

---

## Tricky implementation details

### TID1: Per-channel scale dimension
For a weight matrix $W \in \mathbb{R}^{\text{out} \times \text{in}}$, per-channel quantization gives one scale per *output* dimension. The scale tensor is shape $(\text{out},)$. **Common bug: quantizing per-input-channel instead** — produces worse quality because the activation flow is column-wise.

### TID2: Outlier handling in LLM.int8
The 0.5% outlier threshold is a hyperparameter. Real implementations: identify outliers per matmul based on activation magnitudes (threshold typically ~6 standard deviations). Outlier dimensions can change per layer.

### TID3: NF4 levels and dtype storage
NF4 uses 16 specific floating-point values as its grid. Implementations store the *indices* (4 bits) into a small lookup table containing the levels. **Two 4-bit indices pack into one byte**; storage layout is sometimes nonintuitive.

### TID4: Double quantization granularity
In QLoRA's double quantization, the per-group scales (FP32) are grouped into "super-groups" of 256 scales each, and those are quantized to FP8. The super-group scales are kept in FP32. **Layered structure**; saves ~0.3 bits per weight.

### TID5: Group size choice
Group sizes of 64 or 128 are common. **Smaller groups = better quality but more scale overhead.** Most practical recipes (GPTQ, AWQ, NF4 in QLoRA) use $G = 64$ or $G = 128$. Below 32 = significant overhead; above 256 = quality drops.

### TID6: Calibration set selection for GPTQ
GPTQ's Hessian estimate uses a calibration set (~128 × 2048 tokens by default). **The choice of calibration data matters**: using domain-mismatched data (e.g., calibrating with Wikipedia for a coding model) hurts quality on the target distribution. **Use representative calibration data.**

### TID7: KV cache quantization granularity
For KV cache quantization (Ch 17 bridge), per-token scaling is common (each token gets its own scale across all heads). **Reduces dequantization overhead** at the cost of slightly more scale storage. Alternative: per-head per-token (more scales, less overhead per scale).

### TID8: Mixed precision in practice
A real production INT4 model uses:
- INT4 for weights with per-group scales (FP16 or NF8 doubled)
- BF16 for activations (unquantized in W4A16 setup)
- BF16 for LayerNorm/embeddings (sensitive to precision; small parameter count)
- FP32 for softmax / loss / attention scores (numerical stability)
- **It's not "everything in INT4"** — careful precision allocation is part of the engineering.

---

## Reference implementations

### Basic symmetric quantization

```python
import numpy as np

def quantize_symmetric(x, n_bits=8):
    """
    Symmetric quantization to n_bits.
    Returns: (quantized_int, scale).
    """
    qmax = 2**(n_bits - 1) - 1   # 127 for INT8, 7 for INT4
    qmin = -qmax - 1             # -128 for INT8, -8 for INT4
    
    scale = np.abs(x).max() / qmax
    if scale == 0:
        scale = 1.0
    
    x_int = np.round(x / scale).clip(qmin, qmax).astype(np.int32)
    return x_int, scale

def dequantize_symmetric(x_int, scale):
    """Reverse: x_float ≈ scale * x_int."""
    return scale * x_int.astype(np.float32)

# Example: quantize a random weight vector at different bit widths
np.random.seed(0)
W = np.random.normal(0, 0.1, 256)

print(f"{'Bits':>5} | {'Storage':>10} | {'MSE':>10} | {'Max err':>10}")
print("-" * 50)
for n_bits in [8, 4, 3, 2]:
    W_int, scale = quantize_symmetric(W, n_bits=n_bits)
    W_dq = dequantize_symmetric(W_int, scale)
    mse = ((W - W_dq) ** 2).mean()
    max_err = np.abs(W - W_dq).max()
    storage = f"{n_bits} bits"
    print(f"{n_bits:>5} | {storage:>10} | {mse:>10.6f} | {max_err:>10.4f}")

print("\\nObservations:")
print("- INT8: nearly indistinguishable from FP32 (MSE ~1e-7)")
print("- INT4: visible quantization error (MSE ~1e-5)")
print("- INT2: significant error (only 4 distinct values)")
```

### Per-channel vs per-group quantization

```python
import numpy as np

def quantize_per_tensor(W, n_bits=4):
    qmax = 2**(n_bits - 1) - 1
    scale = np.abs(W).max() / qmax
    return np.round(W / scale).clip(-qmax-1, qmax) * scale

def quantize_per_channel(W, n_bits=4):
    """One scale per row (output channel)."""
    qmax = 2**(n_bits - 1) - 1
    scales = np.abs(W).max(axis=1, keepdims=True) / qmax
    scales = np.where(scales == 0, 1.0, scales)
    return np.round(W / scales).clip(-qmax-1, qmax) * scales

def quantize_per_group(W, n_bits=4, group_size=64):
    """One scale per group of consecutive weights along the input dim."""
    qmax = 2**(n_bits - 1) - 1
    rows, cols = W.shape
    assert cols % group_size == 0, "input dim must divide evenly"
    
    W_q = np.zeros_like(W)
    for g in range(cols // group_size):
        start, end = g * group_size, (g + 1) * group_size
        chunk = W[:, start:end]
        scales = np.abs(chunk).max(axis=1, keepdims=True) / qmax
        scales = np.where(scales == 0, 1.0, scales)
        W_q[:, start:end] = np.round(chunk / scales).clip(-qmax-1, qmax) * scales
    return W_q

# Compare granularities at INT4
np.random.seed(0)
W = np.random.normal(0, 0.1, (512, 512))
# Make some rows have wildly different scales
W[0] *= 10   # outlier row

print(f"{'Granularity':<25} | {'MSE':>12} | {'Max err':>10}")
print("-" * 55)
for name, fn in [
    ("Per-tensor", lambda x: quantize_per_tensor(x, n_bits=4)),
    ("Per-channel (per-row)", lambda x: quantize_per_channel(x, n_bits=4)),
    ("Per-group (G=128)", lambda x: quantize_per_group(x, n_bits=4, group_size=128)),
    ("Per-group (G=64)", lambda x: quantize_per_group(x, n_bits=4, group_size=64)),
]:
    W_q = fn(W)
    mse = ((W - W_q) ** 2).mean()
    max_err = np.abs(W - W_q).max()
    print(f"{name:<25} | {mse:>12.6f} | {max_err:>10.4f}")

print("\\nObservations:")
print("- Per-tensor at INT4 is destroyed by the outlier row")
print("- Per-channel handles the outlier row well (its own scale)")
print("- Per-group is even better: each group has its own scale")
print("- INT4 + per-group is the standard configuration for LLM quantization")
```

### NF4 quantization (conceptual)

```python
import numpy as np
from scipy.stats import norm

# The NF4 quantization levels are quantiles of the standard normal
# Each level represents 1/16 of the probability mass
def compute_nf4_levels():
    """Compute the 16 NF4 levels as equiprobable normal quantiles."""
    # 16 levels, symmetric: pair the levels around zero
    # Implementation: place levels at the centers of equal-probability bins
    levels_half = []
    for i in range(8):
        # Center of bin i: (i + 0.5) / 16 of probability mass
        p = (i + 0.5) / 16   # 0.03125, 0.09375, ..., 0.46875
        # Inverse CDF of normal, shifted to [0.5, 1.0)
        levels_half.append(norm.ppf(0.5 + p / 2))
    # Symmetric: full set is [-levels_half[::-1], levels_half]
    levels = [-x for x in reversed(levels_half)] + levels_half
    # Normalize so the absolute max is 1.0
    max_level = max(abs(l) for l in levels)
    return [l / max_level for l in levels]

NF4_LEVELS = np.array(compute_nf4_levels())
print(f"NF4 levels ({len(NF4_LEVELS)}): {[f'{x:+.3f}' for x in NF4_LEVELS]}")

def quantize_nf4(W):
    """
    Per-group NF4 quantization with group size 64.
    Returns dequantized values (showing the quality, not the storage).
    """
    G = 64
    rows, cols = W.shape
    W_q = np.zeros_like(W)
    
    for g in range(cols // G):
        start, end = g * G, (g + 1) * G
        for r in range(rows):
            chunk = W[r, start:end]
            scale = np.abs(chunk).max()
            if scale == 0:
                continue
            normalized = chunk / scale
            # Find closest NF4 level for each value
            for i, x in enumerate(normalized):
                idx = np.argmin(np.abs(NF4_LEVELS - x))
                W_q[r, start + i] = NF4_LEVELS[idx] * scale
    
    return W_q

# Compare INT4 vs NF4 on normally-distributed weights
np.random.seed(0)
W = np.random.normal(0, 0.05, (64, 256))

# INT4 per-group
from textwrap import dedent

def quantize_int4_per_group(W, G=64):
    qmax = 7
    rows, cols = W.shape
    out = np.zeros_like(W)
    for g in range(cols // G):
        start, end = g * G, (g + 1) * G
        for r in range(rows):
            chunk = W[r, start:end]
            scale = np.abs(chunk).max() / qmax
            if scale > 0:
                out[r, start:end] = np.round(chunk / scale).clip(-qmax-1, qmax) * scale
    return out

W_int4 = quantize_int4_per_group(W)
W_nf4 = quantize_nf4(W)

print(f"\\nMSE on N(0, 0.05) weights:")
print(f"  INT4 per-group: {((W - W_int4) ** 2).mean():.7f}")
print(f"  NF4  per-group: {((W - W_nf4) ** 2).mean():.7f}")
print(f"\\nNF4 places more grid points near zero (where weights are dense)")
print(f"and fewer in the tails. For normally-distributed weights, this")
print(f"reduces quantization error by ~1-2× vs uniform INT4.")
```

---

## Connections to other chapters

- **Ch 4 (Attention)**: quantization applies to attention's weight matrices ($W_Q$, $W_K$, $W_V$, $W_O$) and to the KV cache.
- **Ch 7-10 (Pre-training)**: pre-training is usually in BF16; quantization happens after.
- **Ch 13-14 (Post-training)**: after SFT and preference optimization, weights are usually quantized for deployment.
- **Ch 15 (PEFT / QLoRA)**: NF4 was the quantization layer of QLoRA. This chapter gives the full treatment.
- **Ch 16 (Distillation)**: distillation reduces parameter count; quantization reduces bits per parameter. **Multiplicative effect** — distilled + quantized models are the smallest deployable artifacts.
- **Ch 17 (Inference optimization)**: combines multiplicatively. KV cache is the central memory consumer; KV cache quantization gives another 2-4×.
- **Ch 19 (Sampling)**: sampling happens after quantized matmul produces logits. No dependence between sampling algorithm and quantization scheme.
- **Ch 26 (Evaluation)**: quantization is benchmarked via perplexity on standard sets and via task-level accuracy.

---

## Open questions for the chapter author

### Q1: How much linear-algebra detail for the mapping?
**Recommendation:** moderate. Section 2 establishes the scale + zero-point + clip formula with the boxed equation. Sections 4-5 reference it but don't re-derive. **Don't deep-dive into bit-packing details.**

### Q2: GPTQ vs AWQ depth?
**Recommendation:** medium for each. Section 6 explains the *idea* of both (Hessian-aware updates for GPTQ; activation-aware scaling for AWQ) without deriving the full math. The boxed equation `18.gptq-update` gives the canonical formula; explanation is conceptual.

### Q3: NF4 derivation?
**Recommendation:** show the construction principle (equiprobable normal quantiles); list the levels; don't derive the CDF inversion. The runnable code (NF4 levels via scipy) makes it tangible.

### Q4: Activation quantization depth?
**Recommendation:** brief. Section 7 covers the *why* (activations are harder) and *how* (SmoothQuant). **Don't go deep on outlier handling** — that's an LLM.int8 detail already covered in section 4.

### Q5: Calibration data sensitivity?
**Recommendation:** brief mention in section 6 (GPTQ/AWQ) and TID6. **Practical warning, not deep analysis.**

### Q6: Widget candidates
1. **Quantization Explorer (marquee):** visualize a weight distribution being quantized at different bit widths (FP16 → INT8 → INT4 → NF4). Slider for bit width and quantization mode. **Reader sees precision loss directly.**
2. **Group-wise vs Per-tensor Visualizer (secondary):** show a weight matrix with outlier rows; visualize the quantization grid for per-tensor vs per-channel vs per-group at INT4. **Reader sees why granularity matters.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 18 is a **single-topic chapter** (quantization). Uses the **4-file cadence**.

Planned file layout:
- File 104: research (this)
- File 105: page structure (~600 lines, 8 sections; runnables embedded)
- File 106: Quantization Explorer marquee widget
- File 107: Group-wise Visualizer secondary widget + exercises + closeout (absorbs file 108)

**Pedagogical outcomes for the reader.** After Ch 18, the reader should be able to:
1. Explain why quantization helps inference (memory + bandwidth)
2. Compute the basic float→int mapping (scale, zero point, clip)
3. Distinguish symmetric vs asymmetric and per-tensor vs per-channel vs per-group
4. Describe LLM.int8 and its outlier handling
5. Explain NF4 and why it beats INT4 RTN for normally-distributed weights
6. Distinguish GPTQ from AWQ at a conceptual level
7. Understand why activation quantization is harder than weight quantization
8. Combine quantization with Ch 17 optimizations for end-to-end throughput

Eight outcomes. Exercises hit outcomes 2 (basic mapping), 3 (granularity), 5 (NF4 levels).

**Tonal framing**: practical engineering, like Ch 15 (PEFT) and Ch 17 (inference). **Concrete numbers**: memory savings in GB; bits per weight; perplexity loss. **Honest tradeoffs**: quality vs compression; per-tensor vs per-group; PTQ vs QAT; weight vs activation quantization.

**Phase 12 middle**: Ch 18 is the *technical heart* of Phase 12. Ch 17 introduced the inference cost problem; Ch 19 closes it with sampling. Ch 18 contains the densest engineering content — the float→int mapping, granularity choices, modern PTQ algorithms, activation quantization, and the multiplicative combination with Ch 17.

**Importance**: quantization is what makes large models *affordable* to deploy. Without it, a 70B model needs 2× A100s for weights alone. With INT4, it fits on 1× A100 with room for KV cache and batching. **The single highest-leverage optimization for inference cost reduction**, alongside KV cache. **Don't skip the rigor.**
