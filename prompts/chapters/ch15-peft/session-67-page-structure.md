# Session 67 — Chapter 15 page structure

> First chapter session for Chapter 15 ("Parameter-Efficient Fine-Tuning"). **The practical-engineering chapter** of Phase 11. Where Ch 13 (SFT) and Ch 14 (RLHF/DPO/RLVR) covered post-training *methods*, Ch 15 covers what makes them tractable at scale: LoRA, adapters, prefix tuning, (IA)³, and the QLoRA combo (4-bit base + LoRA adapters) that democratized 70B fine-tuning. Single-topic chapter; uses the **4-file cadence**.

---

## Read first (in this order)

1. **`research/ch15-peft/research.md`** — the source material. Every section, derivation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch10-training-infrastructure/session-45-page-structure.md`** — for the practical-engineering voice (Ch 10 is the closest precedent for "operational concerns, not algorithmic novelty")
4. **`prompts/chapters/ch13-sft/session-59-page-structure.md`** — for the Phase 11 voice and the "cheap-and-cheerful" framing — Ch 15 builds on Ch 13's framing

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 15 page. By end of session:

- `src/pages/ch15-peft/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch15-peft/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 15's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch15-peft/` with sidebar showing Ch 15 active, prev/next nav linking to Ch 14 (active) and Ch 16 (disabled)

**Tonal note:** Ch 15 is **practical engineering** — like Ch 7 (data) and Ch 10 (infrastructure). LoRA isn't a deep algorithmic innovation; it's a beautifully simple idea that happens to work extremely well. The chapter should feel grounded: lots of concrete numbers (memory, parameter counts, GPU sizes), real-world operational considerations (merging vs adapter-mode, target modules, multi-adapter serving), and honest engineering trade-offs. **Don't oversell elegance** — LoRA's value is *operational*, not theoretical.

**Phase 11 context:** Ch 15 is the *engineering* chapter of Phase 11. Ch 13-14 gave the reader post-training methods; Ch 15 gives them the engineering that makes those methods practical. **Most production fine-tuning is LoRA-based**, not full-parameter. The reader should walk away knowing why, when, and how.

**Chapter cadence:** Ch 15 uses the **4-file cadence** (single-topic).

---

## Inputs

State of the repo after session 66 (Ch 14 complete):

- Ch 1-14 all `'published'`
- `research/ch15-peft/research.md` exists
- `src/lib/chapters.ts` has Ch 1-14 `'published'`, Ch 15-30 `'planned'`
- No `src/pages/ch15-peft/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch15-peft/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch15-peft/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 15's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch15-peft
description: Parameter-efficient fine-tuning (PEFT) — the practical alternative to full fine-tuning that powers most production deployments. Where Chapters 13-14 covered post-training methods (SFT, RLHF, DPO, RLVR), this chapter covers the engineering that makes them tractable: rather than training all 70B parameters of a frontier model, train ~0.1-1% — a small low-rank update that captures the essential changes. The dominant technique is LoRA (Hu et al. 2021); QLoRA (Dettmers et al. 2023) makes it accessible on consumer GPUs by combining 4-bit NF4 quantization of the base model with LoRA training. The chapter also covers adapters, prefix tuning, (IA)³, DoRA, and the modern PEFT family. Most production fine-tuning is LoRA-based — this chapter explains why and how.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~250 words) of opening that frame the chapter as practical engineering.

**Sample opening** — rewrite in chapter voice:

> Chapters 13 and 14 left you with the recipes for post-training: take a base model, apply SFT, optionally apply DPO or RLHF, and you have a useful chat model. But there's a wrinkle: **doing this at the parameter scale of modern models is operationally brutal**. Full fine-tuning of a 70B-parameter model requires storing optimizer states for all 70B parameters — roughly 1 TB of GPU memory. That's ~10× A100s. Out of reach for most teams.
>
> Most production fine-tuning isn't done that way. Instead, teams use **parameter-efficient methods**: freeze the base model (no gradient, no optimizer state for those parameters) and train only a small subset — typically 0.1% to 1% of the base model's parameters. The dominant technique is **LoRA** (Low-Rank Adaptation), introduced by Hu et al. in 2021. The hypothesis: fine-tuning updates have *low intrinsic dimensionality* — the matrix of changes $\Delta W = W_{\text{ft}} - W_{\text{base}}$ can be well-approximated by a low-rank decomposition $\Delta W \approx BA$. Train $B$ and $A$ (small); leave $W$ frozen (large).
>
> Combined with **QLoRA** (Dettmers et al. 2023), which adds 4-bit NF4 quantization of the base model to LoRA training, you can fine-tune a 70B model on a single 48 GB GPU. **This is what made open-source post-training explode** after early 2023. This chapter walks through LoRA mechanics, the broader PEFT family (adapters, prefix tuning, (IA)³), QLoRA's tricks, and the modern variants (DoRA, AdaLoRA). It's the practical-engineering counterpart to Chapters 13-14's algorithmic content.

### Section 1: The setup — full fine-tuning is expensive

**Heading:** `## The setup — full fine-tuning is expensive`
**Word target:** ~400
**Sub-headings:** `### The memory cost`, `### The opportunity`

**Teaching beats:**

**The memory cost:**
1. **Full fine-tuning of a 70B model in BF16**:
   - Parameters: 140 GB (70B × 2 bytes)
   - Gradients: 140 GB
   - Optimizer state (AdamW first + second moments, typically FP32): 560 GB (4 bytes × 2 moments × 70B)
   - Activations: depends on checkpointing; tens to hundreds of GB
   - **Total: 840+ GB for weights and optimizer alone**
2. **GPU memory budgets**: A100 = 80 GB, H100 = 80 GB. **Full FT of 70B needs ~10 GPUs minimum** — out of reach for most teams.
3. **Even with FSDP** (Ch 10): you can spread the load across many GPUs, but the *total* memory budget is unchanged. You need ~10× A100s no matter how you shard.

**The opportunity:**
4. **Key observation**: most parameters don't need to change much during fine-tuning. The pre-training learned billions of features; fine-tuning typically just teaches the model to *combine* those features differently.
5. **What if we could**: freeze the base model entirely, and train only a small subset of additional parameters? **Memory drops by ~10×.** That's the PEFT promise.

**Required callout** — type `note`: Ch 15 is the *engineering* chapter of Phase 11. Ch 13-14 gave you methods; Ch 15 gives you the engineering that makes those methods practical. Most production post-training — open-source and frontier — uses some form of PEFT. The conceptual material is straightforward; the impact is enormous.

**No code in this section.** Setup and motivation.

**Connection forward:** Section 2 explains *why* this works.

### Section 2: The low-rank hypothesis

**Heading:** `## The low-rank hypothesis`
**Word target:** ~600
**Sub-headings:** `### Intrinsic dimensionality`, `### Low-rank decomposition`

**Teaching beats:**

**Intrinsic dimensionality:**
1. **Aghajanyan et al. (2020)**: an empirical observation about LM fine-tuning. If you project the fine-tuning update $\Delta W$ into a $d$-dimensional subspace (with $d \ll N$, where $N$ is the total parameter count), you can recover most of the fine-tuning effect.
2. **Empirically**: the effective $d$ is typically $10^4$ to $10^5$ — orders of magnitude smaller than the model's parameter count.
3. **Intuition**: pre-training learned a *language model*; fine-tuning teaches the model to *use* the language model differently. The "use" knob has fewer degrees of freedom than the underlying features.

**Low-rank decomposition:**
4. **LoRA's specific hypothesis** (Hu et al. 2021): for each weight matrix $W \in \mathbb{R}^{d \times k}$ in a transformer, the fine-tuning update $\Delta W$ has *intrinsic low rank*. We can approximate it as:
   $$\Delta W \approx BA, \quad B \in \mathbb{R}^{d \times r}, \quad A \in \mathbb{R}^{r \times k}, \quad r \ll \min(d, k)$$
5. **The savings**: trainable parameters drop from $d \cdot k$ (full) to $r(d + k)$ (LoRA). For $d = k = 4096$ and $r = 16$:
   - Full: $4096 \times 4096 = 16{,}777{,}216$ parameters
   - LoRA: $16 \times 8192 = 131{,}072$ parameters
   - **128× reduction per weight matrix.**
6. **Across a 7B transformer with LoRA on all attention projections**: typically ~0.1-1% of base model parameters are trainable. For a 70B model: ~50-500 MB of trainable parameters vs ~140 GB for the base.

**Required callout** — type `aside`: The low-rank hypothesis isn't a theorem — it's an empirical observation. There exist tasks where it fails (rare, but real). For most instruction tuning, preference optimization, and style adaptation, low-rank captures the relevant changes. For tasks requiring *deep* knowledge updates (adding a new language, a new modality), full fine-tuning often wins.

**No code in this section.** Conceptual setup.

**Connection forward:** Section 3 covers LoRA's mechanics in detail.

### Section 3: LoRA mechanics

**Heading:** `## LoRA mechanics`
**Word target:** ~700 — CENTRAL CONCEPT
**Sub-headings:** `### The forward pass`, `### Initialization`, `### Merging vs adapter-mode`

**Teaching beats:**

**The forward pass:**
1. For a weight matrix $W_0 \in \mathbb{R}^{d \times k}$ in the base model, LoRA adds a low-rank update:
   $$h = W_0 x + \Delta W x = W_0 x + \frac{\alpha}{r} BA x$$
2. **Decode the symbols**: $W_0$ is the *frozen* pre-trained weight; $A \in \mathbb{R}^{r \times k}$ and $B \in \mathbb{R}^{d \times r}$ are *trainable* low-rank factors; $r$ is the rank; $\alpha$ is a scaling factor.
3. **The forward path is two parallel terms**: the base projection $W_0 x$ and the LoRA contribution $(\alpha/r) BAx$. Sum them.

**Initialization:**
4. **$A$ initialized with Gaussian noise**, e.g., $\mathcal{N}(0, 1/r^2)$.
5. **$B$ initialized to zero**.
6. **Therefore $\Delta W = BA = 0$ at step 0** — the model behaves *identically* to the base model. **Critical detail**: without zero-init of $B$, the first forward pass would inject random noise into the model, breaking pre-trained representations.

**Merging vs adapter-mode:**
7. **Merging**: compute $W_{\text{merged}} = W_0 + (\alpha/r) BA$ once at the end of training. At inference, use $W_{\text{merged}}$ directly. **Zero inference overhead** — LoRA at inference is identical in cost to the base model.
8. **Adapter-mode**: keep $W_0$, $A$, $B$ separate. At inference, compute both terms per forward pass. **Slight overhead, but adapters are swappable per-request** (multi-LoRA serving).
9. **Most deployments**: merge for production speed; keep separate during experimentation.

**Required equation block** with label `15.lora`:

```mdx
<Equation label="15.lora">
$$h = W_0 x + \frac{\alpha}{r} B A x, \quad B \in \mathbb{R}^{d \times r}, \quad A \in \mathbb{R}^{r \times k}, \quad r \ll \min(d, k)$$
</Equation>

LoRA forward pass. $W_0$ is the frozen pre-trained weight; $A$ and $B$ are trainable low-rank factors. $r$ is the rank (typically 8-32); $\alpha$ is a scaling factor (typically $\alpha = r$ or $\alpha = 2r$). At step 0, $B = 0$ so $\Delta W = 0$ — the model is identical to the base.
```

**Required widget placeholder** — LoRA Architecture Visualizer (marquee, session 68):

```mdx
<WidgetFrame title="LoRA architecture" caption="A transformer attention layer with LoRA injected. The base weights W_Q, W_K, W_V, W_O are frozen (large). The LoRA adapters B·A are trainable (small). Slide the rank to see how the trainable parameter count scales. The widget visualizes the parameter ratio — typically <1% of base weights — at a glance.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 68 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with LoRA forward pass + zero-init check:

```python
import numpy as np

def lora_forward(x, W_base, A, B, alpha=16, r=8):
    """
    LoRA forward pass.
    
    x:      (batch, d_in)
    W_base: (d_in, d_out) — FROZEN base weight
    A:      (r, d_in) — TRAINABLE down-projection
    B:      (d_out, r) — TRAINABLE up-projection
    alpha:  scaling factor (typically alpha = r or 2r)
    """
    base_out = x @ W_base                         # (batch, d_out)
    lora_out = x @ A.T @ B.T * (alpha / r)        # (batch, d_out)
    return base_out + lora_out

# Setup
np.random.seed(0)
d_in, d_out, r = 512, 768, 8
batch = 4

W_base = np.random.normal(0, 0.02, (d_in, d_out))
A = np.random.normal(0, 0.01, (r, d_in))   # Gaussian init for A
B = np.zeros((d_out, r))                     # ZERO init for B

# At step 0: LoRA should contribute nothing
x = np.random.normal(0, 1, (batch, d_in))
out_step0 = lora_forward(x, W_base, A, B)
out_base = x @ W_base
print(f"At step 0, LoRA output == base output: {np.allclose(out_step0, out_base)}")
print(f"(This is why we zero-init B. Without it, the first forward pass would corrupt the model.)")

# After training: B is non-zero, LoRA contributes
B_trained = np.random.normal(0, 0.01, (d_out, r))
out_trained = lora_forward(x, W_base, A, B_trained)
print(f"\\nAfter training (B != 0), LoRA != base: {not np.allclose(out_trained, out_base)}")
```

**Required callout** — type `warning`: MC4 from research.md. "LoRA is only for training; it doesn't matter at inference." False — **LoRA exists at both.** During training, $A$ and $B$ are updated. At inference, you have two choices: **merge** ($W_{\text{merged}} = W_0 + (\alpha/r) BA$ for zero overhead) or **adapter-mode** (keep separate for swap-ability). Most production deployments merge for performance.

**Connection forward:** Section 4 covers hyperparameter choices.

### Section 4: Practical LoRA — rank, alpha, target modules

**Heading:** `## Practical LoRA — rank, alpha, target modules`
**Word target:** ~600
**Sub-headings:** `### Rank`, `### Alpha and the scaling factor`, `### Target modules`

**Teaching beats:**

**Rank ($r$):**
1. **Typical range**: 4-64. **8 or 16 is the most common starting point.**
2. **Higher rank = more capacity = more parameters = more memory.**
3. **Diminishing returns past $r=16-32$** for most tasks. The original LoRA paper found rank 1 surprisingly effective; modern recipes use 8-32.
4. **When to go higher**: complex tasks requiring deep capability shifts. When in doubt, try $r=16$ first.

**Alpha and the scaling factor:**
5. **$\alpha/r$ scales the LoRA contribution**. This isn't a learning rate — the gradient still flows through both $A$ and $B$ with full magnitude. $\alpha/r$ shrinks (or amplifies) the *output* of the LoRA path.
6. **Conventional choices**:
   - $\alpha = r$ (no rescaling; ratio = 1)
   - $\alpha = 2r$ (modest amplification; ratio = 2)
   - $\alpha = 16$ regardless of $r$ (heuristic; ratio varies)
7. **Effective vs nominal learning**: think of $\alpha/r$ as a "knob" that controls how much LoRA contributes relative to the base. Higher $\alpha/r$ = stronger LoRA influence.

**Target modules:**
8. **Which weight matrices get LoRA?** Three common patterns:
   - **Attention Q + V only**: the original LoRA paper. Minimal parameter overhead. ~0.1% of base.
   - **Attention Q, K, V, O**: all attention projections. Modern default. ~0.3% of base.
   - **All linear layers**: also LoRA on FFN up/down. Maximum coverage. ~0.5-1% of base.
9. **Empirically**: covering more modules helps for complex tasks; minimal coverage suffices for simple instruction tuning.

**Required code** — `<RunnableCode>` with parameter count comparison:

```python
def full_ft_params(d_model=4096, n_layers=32, vocab=128000):
    """Approximate full transformer parameter count."""
    attn = 4 * d_model * d_model              # Q, K, V, O
    ffn = 8 * d_model * d_model               # FFN ~ 4x d_model expansion
    embed = 2 * vocab * d_model               # tied input/output
    return n_layers * (attn + ffn) + embed

def lora_params(d_model=4096, n_layers=32, rank=16, targets=4):
    """LoRA parameter count. targets = matrices per layer."""
    per_target = 2 * d_model * rank
    return n_layers * targets * per_target

# 7B-class model
d, L = 4096, 32

full = full_ft_params(d, L)
lora_qv = lora_params(d, L, rank=16, targets=2)
lora_qkvo = lora_params(d, L, rank=16, targets=4)
lora_all = lora_params(d, L, rank=16, targets=6)
lora_high_rank = lora_params(d, L, rank=64, targets=4)

print(f"7B-class transformer (d={d}, layers={L}):")
print(f"  Full fine-tuning:           {full/1e9:5.2f}B params")
print(f"  LoRA r=16, Q + V only:      {lora_qv/1e6:5.1f}M params ({100*lora_qv/full:.3f}% of full)")
print(f"  LoRA r=16, Q + K + V + O:   {lora_qkvo/1e6:5.1f}M params ({100*lora_qkvo/full:.3f}% of full)")
print(f"  LoRA r=16, all linear:      {lora_all/1e6:5.1f}M params ({100*lora_all/full:.3f}% of full)")
print(f"  LoRA r=64, Q + K + V + O:   {lora_high_rank/1e6:5.1f}M params ({100*lora_high_rank/full:.3f}% of full)")
print(f"\\nLoRA reduces trainable params by 100-1000×.")
print(f"Combined with QLoRA's 4-bit base, fits 70B fine-tuning on a single 48GB GPU.")
```

**Required callout** — type `warning`: MC2 from research.md. "Higher LoRA rank is always better." Diminishing returns past $r=16-32$. **The original LoRA paper found rank 1 was often surprisingly effective.** Modern recipes typically use $r=8-32$. Going beyond rank 64 rarely helps — and adds memory + slows training.

**Connection forward:** Section 5 covers the broader PEFT family.

### Section 5: The PEFT family — adapters, prefix tuning, (IA)³

**Heading:** `## The PEFT family — beyond LoRA`
**Word target:** ~500
**Sub-headings:** `### Adapters`, `### Prefix tuning and prompt tuning`, `### (IA)³`

**Teaching beats:**

**Adapters (Houlsby et al. 2019):**
1. **The original PEFT approach**, predating LoRA by 2 years. Insert a small bottleneck module after each attention and FFN block:
   - Down-projection: $W_{\text{down}} \in \mathbb{R}^{d \times r}$
   - Activation function
   - Up-projection: $W_{\text{up}} \in \mathbb{R}^{r \times d}$
   - Residual connection
2. **Trainable parameters**: $2 \cdot d \cdot r$ per insertion point.
3. **Compared to LoRA**: adapters add *new layers* (slight inference overhead). LoRA modifies *existing weights* (no inference overhead after merging).
4. **Why LoRA won**: inference parity with the base model. Adapters are still used (especially in multi-task setups), but LoRA dominates.

**Prefix tuning and prompt tuning:**
5. **Prefix tuning** (Li & Liang 2021): prepend $L$ trainable "soft prompt" vectors to the attention KV at *each layer*. Train only the prefixes. ~1% of base parameters. **Doesn't modify model weights at all** — only injects information through attention.
6. **Prompt tuning** (Lester et al. 2021): even simpler — train only the *input embeddings* of a soft prompt prepended to the input. Much smaller (just $L \cdot d$ parameters). **Works well at very large scale** (10B+); weaker at smaller scale.

**(IA)³ — Infused Adapter (Liu et al. 2022):**
7. **Even smaller than LoRA**: element-wise rescaling vectors applied to attention K, V and FFN.
8. **Trainable parameters**: 3 vectors of length $d$ per layer — 10× fewer parameters than LoRA.
9. **Use case**: few-shot fine-tuning. When you have very little data and want to lightly adapt the model.

**Required callout** — type `aside`: There are many PEFT methods. LoRA is by far the most widely used; adapters are still common in multi-task setups; prefix/prompt tuning are useful niches; (IA)³ for few-shot. **For 95% of teams, the answer is LoRA** (or QLoRA). The others are worth knowing but less critical.

**No code in this section.** Conceptual survey.

**Connection forward:** Section 6 covers QLoRA — the technique that democratized 70B fine-tuning.

### Section 6: QLoRA — 4-bit base + LoRA

**Heading:** `## QLoRA — 4-bit base + LoRA`
**Word target:** ~600 — CENTRAL PRACTICAL TECHNIQUE
**Sub-headings:** `### The memory problem persists`, `### NF4 quantization`, `### The full recipe`

**Teaching beats:**

**The memory problem persists:**
1. **Even with LoRA**, the *base model* still needs to be in memory. For 70B in BF16: 140 GB.
2. **Single-GPU users**: 140 GB doesn't fit on any current consumer or prosumer GPU. Need 2× A100 80GB at minimum.
3. **The QLoRA solution** (Dettmers et al. 2023): **quantize the base model to 4 bits** while keeping LoRA adapters in BF16. Reduce the dominant memory cost.

**NF4 quantization:**
4. **NF4 (NormalFloat 4-bit)**: a custom 4-bit format optimized for normally-distributed weights. 16 quantization levels placed at the quantiles of a normal distribution.
5. **Why NF4 not INT4**: pre-trained LLM weights are approximately normally distributed. NF4 fits this distribution; standard INT4 (uniform) doesn't.
6. **Memory reduction**: 70B at BF16 = 140 GB; 70B at NF4 = ~35 GB. **4× reduction** vs BF16.

**The full recipe:**
7. **Step 1**: Load base model. **Quantize to NF4** at load time.
8. **Step 2**: Add LoRA adapters in BF16 (small, ~0.5 GB for a 70B model).
9. **Step 3**: Forward pass — **dequantize on-the-fly** (NF4 → BF16 for the matmul, then discard). LoRA path runs in BF16.
10. **Step 4**: Backward pass — gradient flows through LoRA only (base is frozen). Quantization is on forward path only.
11. **Additional tricks**:
    - **Double quantization**: quantize the quantization scalars themselves. Saves ~0.4 bits/parameter.
    - **Paged optimizers**: use unified memory paging to handle optimizer state larger than GPU memory.
12. **Total memory budget** for fine-tuning 70B:
    - NF4 base: ~35 GB
    - LoRA adapters (BF16): ~0.5 GB
    - Activations + optimizer state: ~5-10 GB
    - **Total: ~40-45 GB** — fits on a single 48 GB GPU (A6000) or 80 GB GPU (A100, H100).

**Required widget placeholder** — Parameter Budget Calculator (secondary, session 69):

```mdx
<WidgetFrame title="Parameter budget calculator" caption="Interactive calculator. Choose model size (7B / 13B / 70B), method (full FT / LoRA / QLoRA), rank, and target modules. Outputs: trainable parameters, memory requirements, and minimum GPU recommendation. The calculator makes the operational story tangible — see exactly when LoRA, QLoRA, or full FT becomes feasible for your setup.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 69 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with QLoRA memory budget calculation:

```python
def memory_full_ft(n_params, precision_bytes=2):
    """Memory for full fine-tuning.
    Params + gradients (BF16) + optimizer (FP32 first + second moments)."""
    params = n_params * precision_bytes        # weights in BF16 = 2 bytes
    grads = n_params * precision_bytes         # gradients in BF16 = 2 bytes
    optim = n_params * 4 * 2                    # optimizer (FP32) = 4 bytes * 2 moments
    return params + grads + optim

def memory_lora(n_params_base, n_params_lora, precision_bytes=2):
    """Memory for LoRA fine-tuning.
    Base in BF16 (no gradient/optimizer) + LoRA in BF16 + LoRA optimizer in FP32."""
    base = n_params_base * precision_bytes
    lora_w = n_params_lora * precision_bytes
    lora_grad = n_params_lora * precision_bytes
    lora_optim = n_params_lora * 4 * 2
    return base + lora_w + lora_grad + lora_optim

def memory_qlora(n_params_base, n_params_lora):
    """Memory for QLoRA: base in NF4 (4 bits = 0.5 bytes/param) + LoRA in BF16."""
    base = n_params_base * 0.5                 # 4-bit base
    lora_w = n_params_lora * 2
    lora_grad = n_params_lora * 2
    lora_optim = n_params_lora * 4 * 2
    return base + lora_w + lora_grad + lora_optim

# Compute for 70B model with LoRA on Q + K + V + O at r=16
n_base = 70e9
d_model, n_layers, rank, targets = 8192, 80, 16, 4   # 70B specs
n_lora = n_layers * targets * 2 * d_model * rank

mem_full = memory_full_ft(n_base) / 1e9
mem_lora = memory_lora(n_base, n_lora) / 1e9
mem_qlora = memory_qlora(n_base, n_lora) / 1e9

print(f"Fine-tuning a 70B model:")
print(f"  Full FT:  {mem_full:.0f} GB  ({mem_full/80:.1f}x A100 80GB)")
print(f"  LoRA:     {mem_lora:.0f} GB  ({mem_lora/80:.1f}x A100 80GB)")
print(f"  QLoRA:    {mem_qlora:.0f} GB  ({mem_qlora/48:.1f}x A6000 48GB)")
print(f"\\nQLoRA on a 70B model fits on a single 48GB GPU.")
print(f"This is what made open-source post-training accessible to small teams.")
```

**Required callout** — type `warning`: MC7 from research.md. "QLoRA is just LoRA with quantization." More subtle than that. QLoRA introduces **NF4** (not standard INT4), **double quantization** (quantize the quantization scalars), and **paged optimizers** (unified memory paging). Without these, naive INT4 + LoRA loses more quality. **All three matter** for the headline result.

**Connection forward:** Section 7 surveys modern variants.

### Section 7: Modern variants — DoRA, AdaLoRA, X-LoRA

**Heading:** `## Modern variants`
**Word target:** ~400
**Sub-headings:** `### DoRA`, `### AdaLoRA`, `### Mixture of LoRAs`

**Teaching beats:**

**DoRA (Liu et al. 2024):**
1. **Weight-Decomposed LoRA**: decompose weight $W$ into magnitude $m$ and direction $V/\|V\|$. Apply LoRA only to the *direction*.
2. **Why this helps**: separating magnitude and direction lets the model learn finer-grained updates.
3. **Empirically**: improves over LoRA on many tasks at the same parameter count.

**AdaLoRA (Zhang et al. 2023):**
4. **Adaptive rank allocation**: not all modules need the same rank. AdaLoRA learns to *allocate the rank budget* across modules during training.
5. **Use case**: when you have a fixed parameter budget and want to maximize utility.

**Mixture of LoRAs:**
6. **MoLoRA / X-LoRA**: multiple LoRA adapters with a router (like MoE for adapters). Each expert specializes in different tasks or domains.
7. **Use case**: multi-task fine-tuning. One base model + many small LoRA experts + router = flexible, parameter-efficient multi-task system.

**Required callout** — type `aside`: PEFT is an active research area in 2024-2025. New variants appear monthly. **Stick with LoRA or QLoRA as your default**; explore variants only when you have a specific need (DoRA for finer-grained updates; AdaLoRA for budget allocation; MoLoRA for multi-task). Don't optimize prematurely.

**No code in this section.** Brief survey.

**Connection forward:** Section 8 covers when to use what.

### Section 8: When to use PEFT

**Heading:** `## When to use PEFT vs full fine-tuning`
**Word target:** ~400
**Sub-headings:** `### Use PEFT when…`, `### Use full FT when…`, `### Hybrid recipes`

**Teaching beats:**

**Use PEFT when…:**
1. **Compute budget is limited** (most teams).
2. **You need multiple fine-tuned versions** of the same base model (LoRA adapters are ~MBs, easy to store and swap).
3. **Fine-tuning is a small departure from pre-training** (instruction following, style, refusal behavior).
4. **You want fast iteration** on hyperparameters.

**Use full FT when…:**
5. **The task requires deep capability shifts** (adding a new language, new modality).
6. **You're producing a foundation model** for many downstream tasks.
7. **You have the compute** and LoRA's expressivity is genuinely limiting.

**Hybrid recipes:**
8. **Common production pattern**:
   - **Full FT for SFT** (one expensive run; preserves base capabilities; expensive but feasible at lab scale)
   - **LoRA for downstream task adaptation** (cheap; many specialized versions)
9. **Alternative**:
   - **QLoRA for SFT** (fits on one GPU)
   - **QLoRA for DPO** (also fits)
   - **Merge adapters** at the end if desired

**Sample close** (rewrite in chapter voice):

> Parameter-efficient fine-tuning is what makes Chapter 13-14's methods practical at scale. The recipe: freeze the base model; train only ~0.1-1% of additional parameters; combine with 4-bit quantization (QLoRA) for single-GPU 70B fine-tuning. **This is what most production teams do.** LoRA is the dominant technique; the broader PEFT family (adapters, prefix tuning, (IA)³) is worth knowing but rarely necessary; modern variants (DoRA, AdaLoRA, MoLoRA) refine the recipe.
>
> Chapter 16 — the final chapter of Phase 11 — covers **distillation**: how to compress a fully-trained model into a smaller one. Where Chapters 13-15 covered how to *train* aligned models, Ch 16 covers how to *deploy* them efficiently when even an inference-optimized 70B is too big. After Ch 16, Phase 11 (the post-training arc) closes; Phase 12 (inference and serving) begins.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 15, slug: 'ch15-peft', title: 'Parameter-Efficient Fine-Tuning (PEFT)', partNum: 5, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch15-peft/index.astro && rm src/pages/ch15-peft/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch15-peft/`** renders with:
   - Chapter eyebrow ("Chapter 15") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 3, 4, 6)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 6)
   - Labeled equation `<Equation label="15.lora">` in section 3
   - At least 4 callouts (targeting MC2, MC4, MC7 from research.md, plus the Phase 11 note in section 1)
3. **Sidebar:** Ch 1-14 published; Ch 15 active (draft); Ch 16-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 15:** prev = Ch 14 (active); next = Ch 16 (disabled)
6. **TOC on Ch 15** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 4000 and 4800 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 68 and 69 own them.
- ❌ **Do not write exercises.** Session 69 owns (combined with secondary widget).
- ❌ **Do not flip Ch 15's status to `'published'`.** Session 69 owns.
- ❌ **Do not derive the low-rank approximation theory.** Cite Aghajanyan et al.; sketch the empirical claim.
- ❌ **Do not enumerate every PEFT variant.** Cover LoRA in depth; brief mentions of adapters, prefix tuning, (IA)³, DoRA, AdaLoRA, MoLoRA.
- ❌ **Do not derive NF4 in detail.** State that it's a 4-bit format for normal weights; cite the QLoRA paper.
- ❌ **Do not cover distillation.** Ch 16 owns.
- ❌ **Do not modify Ch 1-14.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch15-peft/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch15-peft/index.astro 2>/dev/null || true
git commit -m "session 67: Ch 15 prose — PEFT (LoRA, QLoRA, adapters, modern variants)"
git push origin main
```

---

## Notes for the session author

**On the "practical engineering" voice:**
Ch 15 should feel like Ch 7 (data engineering) and Ch 10 (training infrastructure). **Concrete numbers, real operational considerations, honest trade-offs.** LoRA isn't conceptually deep — it's a simple idea that works. Don't oversell its elegance; emphasize its *operational* impact.

**On the QLoRA section being the chapter's practical centerpiece:**
Section 6 should walk through the recipe step-by-step: NF4 quantization, double quantization, paged optimizers. Reader walks away knowing **how to fine-tune 70B on one GPU**. The concrete numbers (35 GB NF4 base, 0.5 GB LoRA, 40-45 GB total fitting on a 48 GB GPU) make this tangible.

**On the LoRA mechanics being the chapter's algorithmic centerpiece:**
Section 3 should be careful and complete. Equation `15.lora` (boxed); initialization story (zero-init of $B$); merging vs adapter-mode binary; explicit "no inference overhead after merging." Reader internalizes the full LoRA forward pass.

**On the parameter budget calculator widget being action-oriented:**
The widget in section 6 lets readers *compute* their own scenario: pick a model size, method, rank, target modules → see memory + GPU recommendation. **This is decision-support**, not abstract visualization.

**On the LoRA architecture visualizer widget being orientation-oriented:**
The widget in section 3 shows the *structure* of LoRA — base weights frozen (large), adapters trainable (small), the BA decomposition. **This is orientation**, helping the reader build a mental model before encountering the numbers.

**On the 3 runnable code blocks:**
- Section 3 (LoRA forward + zero-init verification): reader sees that B=0 means LoRA contributes nothing at step 0
- Section 4 (parameter count comparison): reader sees the 100-1000× reduction concretely for a 7B-class model
- Section 6 (QLoRA memory budget): reader computes memory for full FT vs LoRA vs QLoRA at 70B scale; sees QLoRA fitting on a single 48 GB GPU

3 blocks. Each grounds a key claim in the chapter.

**On not over-enumerating variants:**
The PEFT space has *many* variants (DoRA, AdaLoRA, MoLoRA, X-LoRA, LoRA+, NEFTune, RoSA, etc.). Most teams use LoRA or QLoRA. **Don't try to enumerate everything.** Cover LoRA in depth, QLoRA as the practical technique; brief survey of the broader family; brief modern variants. Discipline.

**Pedagogical claim of the chapter:**
"Parameter-efficient fine-tuning is the engineering that makes Phase 11's methods practical. LoRA decomposes the fine-tuning update into a low-rank product BA, training only ~0.1-1% of parameters. QLoRA combines LoRA with 4-bit NF4 quantization of the base, fitting 70B fine-tuning on a single 48 GB GPU. Most production post-training is LoRA-based — not because it's theoretically beautiful, but because it works and it fits on the GPUs teams actually have."

**Phase 11 progress after this session**: Ch 13 ✅, Ch 14 ✅, Ch 15 in progress (draft). Ch 16 (distillation) is the final Phase 11 chapter. Pace through Ch 15 closeout and Ch 16 to finish Phase 11.

**This chapter is the operational bridge** between the algorithmic content of Ch 13-14 and the deployment content of Phase 12. Build with care.
