# Chapter 15 — Parameter-Efficient Fine-Tuning (PEFT): research

> Curated source material for Chapter 15's build sessions. **The practical alternative to full fine-tuning** that powers most production deployments. Where Ch 13 (SFT) and Ch 14 (RLHF/DPO/RLVR) covered post-training *methods*, Ch 15 covers the *engineering* that makes them tractable at scale: rather than training all 70B parameters of a frontier model, train ~0.1-1% — a small low-rank update that captures the essential changes. **LoRA** (Hu et al. 2021) is the dominant technique; **QLoRA** (Dettmers et al. 2023) makes it accessible on consumer GPUs by combining 4-bit quantization with LoRA training. The chapter also covers prefix tuning, adapters, (IA)³, DoRA, and the broader PEFT family. Single-topic chapter; uses the **4-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Parameter-Efficient Fine-Tuning (PEFT)

**Premise:** Full fine-tuning of a 70B-parameter model requires storing optimizer states for all 70B parameters — typically ~1 TB of GPU memory (with AdamW's first and second moments). This is impractical for most teams; even at frontier labs, training a separate full copy of a base model for every task is wasteful. **PEFT methods** address this by freezing the base model and training only a small subset of additional parameters (typically 0.1-1% of base model size). The training is dramatically cheaper, memory requirements drop by ~10×, and adapters can be swapped at inference. **LoRA is by far the dominant PEFT method**, with QLoRA enabling consumer-GPU fine-tuning of 70B models.

**The hypothesis** (Aghajanyan et al. 2020; Hu et al. 2021): fine-tuning updates to large pre-trained models have **low intrinsic dimension** — the change matrix $\Delta W = W_{\text{ft}} - W_{\text{base}}$ can be well-approximated by a low-rank decomposition $\Delta W \approx BA$ where $B \in \mathbb{R}^{d \times r}$ and $A \in \mathbb{R}^{r \times k}$ with $r \ll \min(d, k)$.

**Out of scope (other chapters):**
- Pre-training (Ch 7-10)
- SFT (Ch 13) and preference optimization (Ch 14) — Ch 15 covers PEFT *as an optimization* for these
- Quantization for inference (Ch 18)
- Distillation (Ch 16)

**In scope and locked:**
- **The PEFT motivation**: cost of full fine-tuning, what gets saved
- **The low-rank hypothesis**: why fine-tuning updates lie on a low-dim manifold
- **LoRA mechanics**: $W \leftarrow W_0 + BA$, frozen $W_0$, trainable $B, A$
- **Initialization**: $A$ random Gaussian, $B = 0$ (so initial $\Delta W = 0$)
- **Alpha scaling**: $\Delta W = (\alpha/r) \cdot BA$
- **Target modules**: typically Q, K, V, O attention projections; sometimes FFN
- **Practical hyperparameters**: rank, alpha, dropout, target modules
- **Merging vs adapter-mode inference**: LoRA can be merged into base weights at inference (zero overhead) OR kept as a separate adapter (swappable)
- **Adapters** (Houlsby et al. 2019): bottleneck modules inserted between layers
- **Prefix tuning** (Li & Liang 2021): prepend trainable "soft prompts" to attention KV
- **Prompt tuning** (Lester et al. 2021): trainable input embeddings only
- **(IA)³** (Liu et al. 2022): even smaller — element-wise rescaling vectors
- **QLoRA** (Dettmers et al. 2023): 4-bit quantized base + LoRA on top
- **DoRA** (Liu et al. 2024): weight decomposition into magnitude + direction
- **Modern variants**: MoLoRA, AdaLoRA, X-LoRA briefly
- **When to use PEFT vs full fine-tuning**

**Suggested chapter structure** (8 sections):

1. The setup — full fine-tuning is expensive (~400 words)
2. The low-rank hypothesis (~600 words)
3. LoRA mechanics (~700 words — central concept)
4. Practical LoRA — rank, alpha, target modules (~600 words)
5. The PEFT family — adapters, prefix tuning, (IA)³ (~500 words)
6. QLoRA — 4-bit base + LoRA (~600 words — central practical technique)
7. Modern variants — DoRA, MoLoRA, AdaLoRA (~400 words)
8. When to use PEFT (~400 words)

Target: ~4200 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Aghajanyan et al. 2020 — "Intrinsic Dimensionality Explains the Effectiveness of Language Model Fine-Tuning"
- **arXiv:** [2012.13255](https://arxiv.org/abs/2012.13255)
- **What it contributed:** the **intrinsic dimensionality** insight that fine-tuning updates lie on a low-dimensional manifold of the parameter space. Showed empirically that you can reparameterize a fine-tuning update into a much smaller subspace and still get strong performance. **The theoretical foundation for LoRA.**
- **For the chapter:** key motivation for section 2 (the low-rank hypothesis).

### Hu et al. 2021 — "LoRA: Low-Rank Adaptation of Large Language Models"
- **arXiv:** [2106.09685](https://arxiv.org/abs/2106.09685)
- **What it contributed:** **LoRA** — the dominant PEFT technique. Decompose $\Delta W = BA$; train only $B$ and $A$; freeze $W$. Demonstrated that LoRA matches full fine-tuning on many tasks at 10-100× lower trainable parameter count.
- **For the chapter:** the central reference. Sections 2-4 are about LoRA.

### Houlsby et al. 2019 — "Parameter-Efficient Transfer Learning for NLP"
- **arXiv:** [1902.00751](https://arxiv.org/abs/1902.00751)
- **What it contributed:** **Adapters** — the original PEFT approach. Insert small bottleneck modules between transformer layers; train only the adapters. Predates LoRA; demonstrated PEFT feasibility on BERT.
- **For the chapter:** historical reference. Adapters are still used but less dominant than LoRA.

### Li & Liang 2021 — "Prefix-Tuning: Optimizing Continuous Prompts for Generation"
- **arXiv:** [2101.00190](https://arxiv.org/abs/2101.00190)
- **What it contributed:** **Prefix tuning** — prepend a small set of trainable continuous "soft prompt" vectors to the attention KV at each layer. Train only the prefixes. ~1% of base parameters.
- **For the chapter:** PEFT family overview.

### Lester et al. 2021 — "The Power of Scale for Parameter-Efficient Prompt Tuning"
- **arXiv:** [2104.08691](https://arxiv.org/abs/2104.08691)
- **What it contributed:** **Prompt tuning** — even simpler than prefix tuning; train only the input embeddings of a small "soft prompt" prepended to the input. Showed prompt tuning becomes competitive with full fine-tuning at large model scale.
- **For the chapter:** PEFT family overview.

### Liu et al. 2022 — "Few-Shot Parameter-Efficient Fine-Tuning is Better and Cheaper than In-Context Learning"
- **arXiv:** [2205.05638](https://arxiv.org/abs/2205.05638)
- **What it contributed:** **(IA)³** (Infused Adapter by Inhibiting and Amplifying Inner Activations) — element-wise rescaling vectors instead of low-rank matrices. Even fewer parameters than LoRA. Effective for few-shot fine-tuning.
- **For the chapter:** PEFT family overview.

### Dettmers et al. 2023 — "QLoRA: Efficient Finetuning of Quantized LLMs"
- **arXiv:** [2305.14314](https://arxiv.org/abs/2305.14314)
- **What it contributed:** **QLoRA** — combine **4-bit NF4 quantization** of the base model with **LoRA training**. Reduces memory by ~5× vs FP16 LoRA. Made fine-tuning 65B models possible on a single 48GB GPU. **The democratizing technique** of 2023.
- **For the chapter:** central reference for section 6. Quantization for training (not just inference).

### Liu et al. 2024 — "DoRA: Weight-Decomposed Low-Rank Adaptation"
- **arXiv:** [2402.09353](https://arxiv.org/abs/2402.09353)
- **What it contributed:** **DoRA** — decompose weights into magnitude and direction; LoRA-update only the direction. Improves over LoRA on many tasks with the same parameter count.
- **For the chapter:** modern variants section.

### Zhang et al. 2023 — "AdaLoRA: Adaptive Budget Allocation for Parameter-Efficient Fine-Tuning"
- **arXiv:** [2303.10512](https://arxiv.org/abs/2303.10512)
- **What it contributed:** **AdaLoRA** — adapt the rank of LoRA across modules. Some modules need higher rank than others; AdaLoRA allocates the rank budget where it matters most.
- **For the chapter:** modern variants section.

---

## Core concepts and derivations

### Concept 1: The cost of full fine-tuning

Full fine-tuning of a transformer requires:
1. **Gradients** for all $N$ parameters: $N$ values
2. **Optimizer state** (AdamW's first and second moments): $2N$ values
3. **Activations** for backward pass: depends on activation checkpointing
4. **Parameters themselves**: $N$ values

For a 70B model in BF16 (2 bytes per parameter):
- Parameters: $70 \cdot 10^9 \cdot 2 = 140 \text{ GB}$
- Gradients: $140 \text{ GB}$
- Optimizer state (typically FP32 for stability): $4 \cdot 70 \cdot 10^9 \cdot 2 = 560 \text{ GB}$ (two moments, FP32)
- **Total: ~840 GB just for weights and optimizer**. Plus activations.

This requires **~10× A100/H100 GPUs** at minimum. Out of reach for most teams.

PEFT methods *freeze the base model* (no gradient or optimizer state needed for those parameters) and train only a small subset. **The memory drops by an order of magnitude.**

### Concept 2: The low-rank hypothesis

Aghajanyan et al. (2020) observed that **fine-tuning updates are low-dimensional**. If you project the full parameter update $\Delta W$ into a $d$-dimensional subspace (with $d \ll N$), you can recover most of the fine-tuning effect with $d$ on the order of $10^4$, not $10^9$.

**Intuition**: pre-training learned billions of features; fine-tuning teaches the model to *combine* those features differently. You don't need to relearn the features — just update how they're combined. The "combination space" is low-dimensional.

**LoRA's specific hypothesis** (Hu et al. 2021): for each weight matrix $W \in \mathbb{R}^{d \times k}$ in a transformer, the fine-tuning update $\Delta W$ has *intrinsic low rank* — approximately:
$$\Delta W \approx BA, \quad B \in \mathbb{R}^{d \times r}, \quad A \in \mathbb{R}^{r \times k}, \quad r \ll \min(d, k)$$

The number of trainable parameters drops from $d \cdot k$ (full) to $r(d + k)$ (LoRA). For $d = k = 4096$ and $r = 16$: $16 \cdot 8192 = 131{,}072$ vs $16{,}777{,}216$ — a **128× reduction** per weight matrix.

### Concept 3: LoRA mechanics

The LoRA forward pass for a weight matrix $W$:
$$h = W_0 x + \Delta W x = W_0 x + B A x$$

where:
- $W_0 \in \mathbb{R}^{d \times k}$ is the *frozen* pre-trained weight
- $A \in \mathbb{R}^{r \times k}$ and $B \in \mathbb{R}^{d \times r}$ are the *trainable* low-rank factors
- $r$ is the rank, typically 4, 8, 16, 32, or 64
- An alpha scaling is applied: $\Delta W = (\alpha / r) \cdot BA$

```mdx
<Equation label="15.lora">
$$h = W_0 x + \frac{\alpha}{r} B A x$$
</Equation>
```

**Initialization**: $A$ is initialized with Gaussian noise (e.g., $\mathcal{N}(0, 1/r^2)$); $B$ is initialized to **zero**. This means $\Delta W = 0$ at the start of training — **the model is identical to the base model**. Training adjusts $B$ (and $A$) from there.

**Why this initialization matters**: random initialization of both $B$ and $A$ would inject random noise into the model at step 0, breaking the pre-trained representations. Zero-init of $B$ guarantees the start state matches the base model.

**Inference**: at inference, you can compute $W_{\text{merged}} = W_0 + (\alpha / r) \cdot BA$ once and use that as your weight matrix. **Zero inference overhead** — LoRA at inference is identical in cost to the base model. (Alternatively, you can keep the adapter separate and swap it per-request — slower but more flexible.)

### Concept 4: Practical LoRA hyperparameters

**Rank ($r$)**: typically 4-64. **8 or 16 is the most common starting point.** Higher rank = more capacity but more parameters.

**Alpha ($\alpha$)**: a scaling factor. The conventional setup is $\alpha = r$ or $\alpha = 2r$. The ratio $\alpha / r$ controls the effective "learning rate" for the LoRA update — but unlike learning rate, $\alpha / r$ is *applied to the contribution itself*, not the gradient.

**Dropout**: optional dropout applied to the LoRA path (typically 0.05-0.1).

**Target modules**: which weight matrices get LoRA. Common choices:
- **Attention only**: Q, K, V, O projections (4 matrices per layer). The original LoRA paper used Q + V only.
- **Attention + FFN**: also LoRA on the FFN up/down projections. More expressive; more parameters.
- **All linear layers**: LoRA on every linear layer in the model. Maximum coverage.

**Modern recipes** (2024-2025) typically target all linear layers with rank 8-32 and $\alpha = 16-64$.

**Trainable parameters at scale**: for a 7B model with rank 16 LoRA on all attention QKV (16K, 16K, 16K = 48K + 16K = 64K cells/layer per matrix):
- Per layer: $4 \cdot 16 \cdot (4096 + 4096) \approx 524{,}288$ params
- Across 32 layers: $\approx 16.8 \text{M}$ trainable params
- Vs 7B base = **0.24% of base parameters**

### Concept 5: The PEFT family beyond LoRA

**Adapters** (Houlsby et al. 2019): insert a small bottleneck module after each attention and FFN block.
- Down-projection: $W_{\text{down}} \in \mathbb{R}^{d \times r}$
- Activation function
- Up-projection: $W_{\text{up}} \in \mathbb{R}^{r \times d}$
- Residual connection
- Trainable parameters: $2 \cdot d \cdot r$ per insertion point, plus biases

Compared to LoRA: adapters add *new layers* (slight inference overhead); LoRA modifies *existing weights* (no inference overhead after merging).

**Prefix tuning** (Li & Liang 2021): prepend $L$ trainable "soft prompt" vectors to the attention KV at *each layer*.
- Trainable parameters: $2 \cdot L \cdot d \cdot \text{layers}$ (two for K and V, per layer)
- Doesn't modify model weights at all — only injects information through attention
- Best for generation tasks; weaker on classification

**Prompt tuning** (Lester et al. 2021): even simpler — train *only* the input embeddings of a soft prompt.
- Trainable parameters: $L \cdot d$ (just the input embeddings)
- Much smaller than prefix tuning
- Works well at very large scale (10B+); weaker at smaller scale

**(IA)³** (Liu et al. 2022): element-wise rescaling vectors applied to attention K, V and FFN.
- Trainable parameters: 3 vectors of length $d$ per layer (or per attention head)
- Even smaller than LoRA — 10× fewer trainable params
- Effective for few-shot fine-tuning

### Concept 6: QLoRA — quantization meets LoRA

**The problem**: even with LoRA, the *base model* still needs to be in memory. For a 70B model in BF16, that's 140 GB — out of reach for single-GPU users.

**The QLoRA solution** (Dettmers et al. 2023): **quantize the base model to 4-bit while keeping LoRA adapters in BF16**.

The pipeline:
1. **Quantize $W_0$ to 4-bit** using NF4 (NormalFloat-4) quantization. NF4 is designed for normally-distributed weights (which trained LLM weights approximately are).
2. **Dequantize on-the-fly** during forward pass: convert quantized weights to BF16 for the matmul, then discard.
3. **LoRA adapters stay in BF16**: the trainable $A, B$ matrices are full-precision.
4. **Gradient flows through the dequantization**: backward pass uses the BF16 weights (no gradient through quantization).

**Memory savings**:
- BF16 70B: 140 GB
- 4-bit NF4 70B: ~35 GB
- + LoRA adapters: ~0.5 GB
- + activations + optimizer state: ~5-10 GB total
- **Total: ~40-45 GB** — fits on a single A6000 (48 GB) or A100 80GB easily

**Additional QLoRA tricks**:
- **Double quantization**: quantize the quantization scalars themselves. Saves ~0.4 bits/parameter.
- **Paged optimizers**: use unified memory paging to handle optimizer state larger than GPU memory.

**The democratizing impact**: QLoRA made it possible to fine-tune 65B-70B models on consumer/prosumer GPUs (RTX 3090, 4090, A6000). Open-source post-training exploded.

### Concept 7: Modern variants

**DoRA** (Weight-Decomposed Low-Rank Adaptation, Liu et al. 2024):
$$W = m \cdot \frac{V}{||V||_c}$$
where $m$ is a learned magnitude vector and $V$ is the direction matrix. DoRA applies LoRA only to the direction. Empirically improves over LoRA on many tasks with the same parameter count.

**AdaLoRA** (Zhang et al. 2023): allocates rank budget adaptively across modules. Some layers need higher rank than others; AdaLoRA detects this during training.

**MoLoRA / Mixture of LoRAs**: multiple LoRA adapters with a router, like MoE but for adapters. Useful for multi-task fine-tuning.

**X-LoRA** (Buehler & Buehler 2024): mixture-of-experts at the LoRA layer — each expert is a small LoRA adapter. Lets one model handle many domains by routing to the right LoRA.

### Concept 8: When to use PEFT vs full fine-tuning

**Use PEFT when**:
- Compute budget is limited (most teams)
- You need to maintain *multiple* fine-tuned versions of the same base model (PEFT adapters are tiny and swappable)
- The fine-tuning task is a relatively small departure from pre-training (instruction following, style adjustment)
- You want to iterate quickly on different hyperparameters

**Use full fine-tuning when**:
- You have the compute and the task requires deep changes (e.g., adding a new language or modality)
- You're training a foundation model for many downstream tasks
- LoRA's expressivity is limited for your task (rare but real)

**Hybrid: full fine-tuning of the SFT stage + LoRA for downstream task adaptation** is common in production. Get the base SFT'd model with full FT once; then LoRA-fine-tune for specific tasks.

---

## Glossary

- **PEFT (Parameter-Efficient Fine-Tuning)**: methods that train only a small subset of parameters.
- **LoRA (Low-Rank Adaptation)**: decompose $\Delta W = BA$; train $A, B$.
- **Rank ($r$)**: dimensionality of the LoRA bottleneck.
- **Alpha ($\alpha$)**: LoRA scaling factor; $\Delta W = (\alpha/r) \cdot BA$.
- **QLoRA**: 4-bit quantized base + BF16 LoRA adapters.
- **NF4**: 4-bit NormalFloat quantization optimized for normally-distributed weights.
- **DoRA**: Weight-decomposed LoRA; separates magnitude and direction.
- **AdaLoRA**: adaptive rank budget allocation across modules.
- **Adapter**: bottleneck module inserted between layers.
- **Prefix tuning**: trainable soft prompts injected into attention KV.
- **Prompt tuning**: trainable input embeddings only.
- **(IA)³**: element-wise rescaling vectors.
- **Merging**: combining LoRA update into base weights at inference: $W_{\text{merged}} = W_0 + (\alpha/r) \cdot BA$.
- **Adapter-mode inference**: keeping LoRA separate from base weights at inference; allows hot-swapping adapters per request.
- **Intrinsic dimension**: the effective dimensionality of fine-tuning updates.
- **Target modules**: which weight matrices to apply LoRA to (typically attention + FFN).

---

## Pedagogical analogies

### 1. LoRA as "post-it notes on a textbook"
You don't rewrite the whole textbook to fix a few errors. You stick post-it notes (small, focused additions) at the relevant pages. **LoRA is the same**: don't rewrite the 70B-parameter base model; add small low-rank updates at specific layers. The post-its are tiny relative to the textbook but enough to teach what you need.

Best used for: section 1 motivation.

### 2. Low-rank as "principal components of the change"
A fine-tuning update is a huge matrix $\Delta W$. But most of its "interesting structure" lives in a few principal directions. **Low-rank decomposition keeps only those directions** — the rest is noise or redundancy. By training in this low-rank space, you focus capacity where it matters.

Best used for: section 2 low-rank hypothesis.

### 3. QLoRA as "blueprints printed on cheap paper"
Imagine architectural blueprints. You can print them on expensive vellum (BF16) or cheap newsprint (4-bit NF4). The lines are slightly fuzzier on newsprint, but the *content* — what to build, how — is preserved. QLoRA stores the base model on "cheap paper" (4-bit) while keeping the *changes* (LoRA adapters) on "vellum" (BF16). The training works because the gradient signal is in the adapters, not in the base.

Best used for: section 6 QLoRA.

### 4. Merging vs adapter-mode as "permanent edits vs sticky tabs"
**Merged**: take the post-it notes and rewrite them permanently into the textbook. No more tabs; one continuous text. **Adapter-mode**: keep the tabs separate so you can swap them out. Permanent edits are faster to read; sticky tabs let you switch contexts. Same trade-off for LoRA: merge for inference speed; keep separate for adapter swapping.

Best used for: section 3/4 merging discussion.

### 5. (IA)³ as "rescaling instead of rewriting"
LoRA adds a *direction* to the weights. (IA)³ just *scales* the existing direction. It's like turning up or down the volume on what's already there. Less expressive — but much cheaper. Often enough for narrow adaptations.

Best used for: section 5 PEFT family.

---

## Common misconceptions

### MC1: "LoRA always matches full fine-tuning."
**Reality:** false in general. **LoRA can underperform full fine-tuning on complex tasks** requiring substantial knowledge updates. For most instruction-following tasks (the common case), LoRA matches; for tasks requiring deep capability shifts (e.g., adding a new language), full FT often wins. Empirically: LoRA matches within 1-2% on benchmarks like MMLU after instruction tuning; can lag by 5-10% on hard reasoning tasks.

### MC2: "Higher LoRA rank is always better."
**Reality:** diminishing returns past $r = 16-32$ for most tasks. **Higher rank = more parameters = more memory + slower training.** The original LoRA paper found rank 1 was often surprisingly effective; modern recipes typically use rank 8-32. Going beyond rank 64 rarely helps.

### MC3: "LoRA slows down inference."
**Reality:** false if merged. **LoRA can be merged into the base weights** ($W_{\text{merged}} = W_0 + (\alpha/r) \cdot BA$) for zero inference overhead. Adapter-mode (keeping LoRA separate for swap-ability) adds modest overhead. Most production deployments merge.

### MC4: "LoRA is only for training; it doesn't matter at inference."
**Reality:** LoRA exists at both. **During training**, the adapter weights are updated. **At inference**, you choose: merge (fastest) or keep separate (swappable). The phrase "LoRA at inference" usually means adapter-mode inference.

### MC5: "PEFT is only for compute-limited teams."
**Reality:** even **frontier labs use PEFT extensively** for many tasks. Adapter portfolios make it easy to maintain multiple fine-tuned versions of one base model. PEFT isn't only a budget choice — it's also an operational choice for managing many specialized models.

### MC6: "One LoRA adapter per use case is wasteful."
**Reality:** the opposite is true. **LoRA adapters are tiny** (typically <1% of base model size). Storing dozens of adapters for one base model costs a few hundred MB total. It's the *base model* that's expensive. PEFT enables one base + many task-specific adapters.

### MC7: "QLoRA is just LoRA with quantization."
**Reality:** more subtle. QLoRA introduces **NF4 quantization** (not standard INT4), **double quantization** (quantize the quantization scalars), and **paged optimizers** (unified-memory paging). The combination is what makes 70B-on-single-GPU work. Naive INT4 + LoRA would lose more quality.

### MC8: "LoRA learns the same thing as full fine-tuning."
**Reality:** LoRA learns within a *low-rank subspace* of the change matrix. Full FT can learn updates outside this subspace. **For most tasks, the low-rank subspace contains what matters** (this is the empirical evidence supporting the low-rank hypothesis). For some hard tasks, full FT's broader search wins.

---

## Tricky implementation details

### TID1: LoRA initialization
$A$ is initialized with $\mathcal{N}(0, \sigma^2)$ for some small $\sigma$. $B$ is **initialized to zero**. This means $\Delta W = BA = 0$ at step 0. The model behaves identically to the base model. **Without zero-init of $B$, the first forward pass would inject random noise**, breaking pre-trained representations.

### TID2: Alpha vs learning rate
$\alpha / r$ scales the LoRA contribution. This isn't a learning rate — the gradient still flows through both $A$ and $B$ with full magnitude. Effectively, $\alpha / r$ shrinks (or amplifies) the *output* of the LoRA path. Typical choices: $\alpha = r$ (no rescaling), $\alpha = 2r$ (modest amplification), $\alpha = 16$ regardless of $r$ (a heuristic).

### TID3: Target modules
The original LoRA paper applied LoRA only to attention's $W_Q$ and $W_V$. Modern recipes include all of Q, K, V, O *and* FFN's up/down projections. **More target modules = more expressivity = more trainable params.** The trade-off depends on memory and task complexity.

### TID4: Merging at inference
$W_{\text{merged}} = W_0 + (\alpha / r) \cdot BA$. Compute once; use as the weight matrix. Note: this *modifies* the weight matrix, so the model is no longer the base model. If you want to revert, you must store the original. **In practice, save adapters separately and load the base model fresh as needed.**

### TID5: Multiple adapters at inference
You can load multiple LoRA adapters and serve different requests with different adapters. Adapter-mode inference is slightly slower than merged but allows hot-swapping. Modern serving stacks (vLLM, TGI) support multi-LoRA serving.

### TID6: QLoRA's NF4 quantization
NF4 is a *non-uniform* 4-bit quantization scheme optimized for normally-distributed weights. The 16 quantization levels are placed at the quantiles of a normal distribution. **Pre-trained LLM weights are approximately normally distributed**, so NF4 is well-suited. Standard INT4 (uniform) is worse for this purpose.

### TID7: Gradient flow through quantization
During QLoRA backward: gradient w.r.t. the *base weights* is irrelevant (they're frozen). Gradient w.r.t. *LoRA weights* flows through the BF16 dequantized representation. **The quantization is on the forward path only**; backward is full-precision through the LoRA path.

### TID8: DoRA's two-stage update
DoRA decomposes $W = m \cdot V / ||V||$. LoRA-update only $V$. Magnitude $m$ is updated directly (small trainable vector). The norm normalization is applied per-column. **Subtle implementation detail**: how do you compute and apply per-column norms? Usually via a simple division operation in the forward pass.

---

## Reference implementations

### Basic LoRA forward pass

```python
import numpy as np

def lora_forward(x, W_base, A, B, alpha=16, r=8):
    """
    LoRA forward pass.
    
    x:      (batch, d_in) — input
    W_base: (d_in, d_out) — frozen base weight
    A:      (r, d_in) — trainable down-projection
    B:      (d_out, r) — trainable up-projection
    alpha:  scaling factor (typically alpha = r or 2r)
    r:      rank
    
    Returns: h of shape (batch, d_out)
    """
    base_out = x @ W_base                           # (batch, d_out)
    lora_out = x @ A.T @ B.T * (alpha / r)          # (batch, d_out)
    return base_out + lora_out

# Demo
np.random.seed(0)
d_in, d_out, r = 512, 768, 8
batch = 4

# Base model: random "pre-trained" weight
W_base = np.random.normal(0, 0.02, (d_in, d_out))

# LoRA adapters with proper initialization
A = np.random.normal(0, 0.01, (r, d_in))   # Gaussian init for A
B = np.zeros((d_out, r))                     # Zero init for B → delta_W = 0 at start

# At step 0: LoRA contributes nothing
x = np.random.normal(0, 1, (batch, d_in))
out_step0 = lora_forward(x, W_base, A, B)
out_base = x @ W_base
print(f"LoRA at step 0 == base model: {np.allclose(out_step0, out_base)}")

# After training: simulate B being non-zero
B = np.random.normal(0, 0.01, (d_out, r))
out_trained = lora_forward(x, W_base, A, B)
print(f"LoRA at step n != base model: {not np.allclose(out_trained, out_base)}")

# Parameter count: LoRA vs full
full_params = d_in * d_out
lora_params = r * d_in + d_out * r
print(f"\nParameter count:")
print(f"  Full fine-tuning: {full_params:,} params")
print(f"  LoRA (r={r}):     {lora_params:,} params ({100*lora_params/full_params:.2f}% of full)")
```

### LoRA merge into base weights

```python
import numpy as np

def lora_merge(W_base, A, B, alpha=16, r=8):
    """
    Merge LoRA into base weights for zero-overhead inference.
    
    Returns the merged weight matrix.
    """
    W_merged = W_base + (alpha / r) * (B @ A)
    return W_merged

# Demo: verify merged version produces same output as adapter-mode
np.random.seed(1)
d_in, d_out, r = 256, 256, 16
W_base = np.random.normal(0, 0.02, (d_in, d_out))
A = np.random.normal(0, 0.01, (r, d_in))
B = np.random.normal(0, 0.01, (d_out, r))   # nonzero (post-training)

x = np.random.normal(0, 1, (4, d_in))

# Adapter mode
def lora_forward(x, W_base, A, B, alpha=16, r=8):
    return x @ W_base + x @ A.T @ B.T * (alpha / r)

out_adapter = lora_forward(x, W_base, A, B)

# Merged mode
W_merged = lora_merge(W_base, A, B)
out_merged = x @ W_merged

# Should be identical
print(f"Adapter-mode vs merged: max diff = {np.abs(out_adapter - out_merged).max():.2e}")
print(f"\nMerging produces an identical model — no inference overhead.")
print(f"Use merged for production; adapter-mode for swappable adapters at runtime.")
```

### Parameter count comparison

```python
def full_ft_params(d_model=4096, n_layers=32, vocab=128000):
    """Approximate parameter count for full fine-tuning of a transformer."""
    # Attention: 4 * d^2 per layer (Q, K, V, O)
    attn = 4 * d_model * d_model
    # FFN: 2 * d * 4d = 8d^2 per layer (gated FFN approx)
    ffn = 8 * d_model * d_model
    # Per layer
    per_layer = attn + ffn
    # Embeddings
    embed = 2 * vocab * d_model
    return n_layers * per_layer + embed

def lora_params(d_model=4096, n_layers=32, rank=16, targets=4):
    """LoRA parameter count. 'targets' = how many matrices per layer get LoRA."""
    # Per LoRA-target: 2 * d * rank
    per_target = 2 * d_model * rank
    return n_layers * targets * per_target

# Compute for 7B-class model
d_model, n_layers = 4096, 32

full = full_ft_params(d_model, n_layers)
lora_qv = lora_params(d_model, n_layers, rank=16, targets=2)     # Q, V only
lora_qkvo = lora_params(d_model, n_layers, rank=16, targets=4)   # Q, K, V, O
lora_all = lora_params(d_model, n_layers, rank=16, targets=6)    # + FFN gates

print(f"For a 7B-class transformer (d={d_model}, layers={n_layers}):")
print(f"  Full fine-tuning:        {full/1e9:.2f}B params")
print(f"  LoRA r=16 on Q, V:       {lora_qv/1e6:.1f}M params ({100*lora_qv/full:.3f}% of full)")
print(f"  LoRA r=16 on Q, K, V, O: {lora_qkvo/1e6:.1f}M params ({100*lora_qkvo/full:.3f}% of full)")
print(f"  LoRA r=16 on all linear: {lora_all/1e6:.1f}M params ({100*lora_all/full:.3f}% of full)")
print(f"\nLoRA reduces trainable params by 100-1000×.")
print(f"Combined with QLoRA's 4-bit base, fits 70B fine-tuning on a single 48GB GPU.")
```

---

## Connections to other chapters

- **Ch 8 (Training loop)**: PEFT runs the same training loop. The only difference: freeze most parameters via `requires_grad = False`. Optimizer only sees the trainable subset.
- **Ch 10 (Training infrastructure)**: PEFT shines for memory-limited setups. Single-GPU 70B training is only feasible with PEFT + quantization.
- **Ch 13 (SFT)**: most production SFT is LoRA-based, not full fine-tuning. The chat-template + masked-loss machinery from Ch 13 still applies; the loss just flows through LoRA params instead of all params.
- **Ch 14 (RLHF/DPO/RLVR)**: DPO is often done with LoRA on top of the SFT model (which may itself be LoRA-trained). The reference model is the SFT model; the trained policy is SFT + LoRA delta.
- **Ch 18 (Quantization for inference)**: QLoRA is *training* with quantization. Ch 18 covers *inference* with quantization. Different use cases, related techniques.
- **Ch 17 (Inference optimization)**: LoRA's mergeability is an inference optimization. Multi-LoRA serving (vLLM, TGI) is a deployment pattern.

---

## Open questions for the chapter author

### Q1: How much PEFT math?
**Recommendation:** medium. State the LoRA decomposition $\Delta W = BA$; show parameter counts. Don't deep-dive into the intrinsic-dimensionality theory — that's a separate topic.

### Q2: Coverage of non-LoRA PEFT?
**Recommendation:** brief survey in section 5. Adapters, prefix tuning, (IA)³ each get a paragraph. **LoRA is dominant; the others are alternatives worth knowing.** Don't over-emphasize.

### Q3: QLoRA depth?
**Recommendation:** prominent. QLoRA is one of the most practically impactful techniques in modern ML. Section 6 should walk through the recipe: NF4 quantization, double quantization, paged optimizers. Reader walks away knowing how to fine-tune 70B on one GPU.

### Q4: Modern variants (DoRA, AdaLoRA, etc.)?
**Recommendation:** brief section. Mention DoRA, AdaLoRA, MoLoRA, X-LoRA. Each gets 1-2 sentences. Don't dive deep — these are recent developments and may not be settled.

### Q5: Widget candidates
1. **LoRA Architecture Visualizer (marquee):** show a single attention layer with W_Q, W_K, W_V, W_O matrices, then add LoRA decomposition (W_0 + BA) for each. Slider for rank. Visual count of trainable vs frozen parameters. **Recommended marquee.**
2. **Parameter Budget Calculator (secondary):** interactive calculator. Inputs: model size (7B / 13B / 70B), method (full FT / LoRA / QLoRA), rank, target modules. Outputs: trainable params, memory needed, GPU recommendation. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 15 is a **single-topic chapter** (PEFT methods). Uses the **4-file cadence**.

Planned file layout:
- File 86: research (this)
- File 87: page structure (~600 lines, 8 sections; runnables embedded)
- File 88: LoRA Architecture marquee widget
- File 89: Parameter Budget Calculator secondary widget + exercises + closeout

**Pedagogical outcomes for the reader.** After Ch 15, the reader should be able to:
1. State the low-rank hypothesis
2. Implement LoRA forward pass + merging
3. Choose LoRA hyperparameters (rank, alpha, target modules)
4. Explain QLoRA's recipe and memory savings
5. Compare PEFT methods (LoRA, adapters, prefix tuning, (IA)³)
6. Describe DoRA's improvement over LoRA
7. Choose between PEFT and full fine-tuning

Seven outcomes. Exercises hit outcomes 2 (LoRA forward), 3 (hyperparameter selection), 5 (PEFT comparison).

**Tonal framing**: practical engineering. This chapter is about the *operational* side of post-training — how to make it work in practice on the GPUs you actually have. Voice: grounded, like Ch 7 (data engineering) and Ch 10 (training infrastructure). LoRA isn't conceptually deep; it's a beautifully simple idea that happens to work extremely well.

**Importance to Phase 11**: PEFT is what makes Phase 11's methods (SFT, DPO, RLVR) practical at scale. **Most production post-training is LoRA-based.** Reader needs to understand both the *methods* (Ch 13-14) and the *engineering* (this chapter) to work in modern post-training.
