# Session 36 — Chapter 8 page structure

> First chapter session for Chapter 8 ("Building a small LLM"). **The project's center of gravity for training-side material.** Combines the architecture from Ch 1-6 and the data from Ch 7 into a complete, runnable training loop. Cross-entropy loss, AdamW, learning rate schedules, training stability, sampling. **The chapter where the reader builds, trains, and generates from a working LLM.** Uses the **5-file cadence** (two-topic chapter: math of training + engineering of training).

---

## Read first (in this order)

1. **`research/ch08-building-small-llm/research.md`** — the source material. Every derivation, formula, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch05-multihead-and-block/session-23-page-structure.md`** — for the two-topic dense-math chapter template (Ch 5 is the closest precedent for chapter density)
4. **`prompts/chapters/ch07-pretraining-data/session-32-page-structure.md`** — for the engineering-flavored chapter template (Ch 7 set the tone for code-heavy practical chapters)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 8 page. By end of session:

- `src/pages/ch08-building-small-llm/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch08-building-small-llm/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 8's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch08-building-small-llm/` with sidebar showing Ch 8 active, prev/next nav linking to Ch 7 (active) and Ch 9 (disabled)

**Note on chapter cadence:** Ch 8 uses the **5-file cadence** — like Ch 5. Two genuine topics: (a) the math of training (loss, optimizer, gradients), (b) the engineering of training (loop, schedules, stability). Each topic earns its own widget. Original BUILD_ORDER files 53+ for Ch 8 are absorbed.

**Note on code density:** Ch 8 is the most code-heavy chapter in the tutorial — 6 runnable code blocks. The reader is *building* a trainer; code is the medium. Earlier chapters (Ch 1-6) were "what the model is"; Ch 8 is "how to make it work."

---

## Inputs

State of the repo after session 34 (Ch 7 complete):

- Ch 1-7 all `'published'`
- `research/ch08-building-small-llm/research.md` exists
- `src/lib/chapters.ts` has Ch 1-7 `'published'`, Ch 8-30 `'planned'`
- No `src/pages/ch08-building-small-llm/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch08-building-small-llm/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch08-building-small-llm/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 8's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch08-building-small-llm
description: Chapters 1-6 built the architecture; Chapter 7 built the data pipeline. This chapter combines them with the training mathematics — cross-entropy loss, AdamW, learning rate schedules, gradient clipping — into a complete, runnable training loop. By the end, you've trained (and sampled from) a small LLM.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3-4 short paragraphs (~250 words) of opening — slightly longer than usual because the chapter has more setup to communicate.

**Sample opening** — rewrite in chapter voice:

> Seven chapters in, you have the pieces. Chapters 1-6 built the architecture — embeddings, attention, transformer blocks, positional encoding. Chapter 7 built the data pipeline — web text filtered, deduplicated, decontaminated. What's missing is the part where the architecture *learns from* the data. That's this chapter.
>
> The training loop is short — maybe sixty lines for a small model — but every line packs decisions made over a decade of LLM research. The loss function (cross-entropy on next-token prediction) is settled. The optimizer (AdamW with specific betas) is settled. The schedule (warmup + cosine decay) is settled. Gradient clipping at norm 1.0 is settled. These choices weren't obvious in 2017; in 2024 they're the default. This chapter explains why each one matters.
>
> By the end, you'll have a working trainer. The chapter's reference implementation is GPT-2-style — a faithful, simplified nanoGPT — that you can run on a laptop. After ~1 hour of training on a small corpus, the model goes from gibberish to coherent. The widget in section 7 lets you scrub through this trajectory: watch the loss drop, watch the generated samples improve.

### Section 1: The setup — what we're about to do

**Heading:** `## The setup — what we're about to do`
**Word target:** ~400

**Teaching beats:**
1. **What the reader has**: a transformer architecture (Ch 5's block) + positional encoding (Ch 6) + a tokenized training corpus (Ch 7). What they don't have: trained weights.
2. **What training does**: turns random initial weights into weights that predict text well.
3. **The pieces of training**: a loss function (cross-entropy), an optimizer (AdamW), a learning rate schedule (warmup + cosine), and a few stability tricks (gradient clipping, mixed precision).
4. **What "small" means in 2024**: ~10M-1B parameters. Llama-3 8B has 8B params; the chapter targets 10M-100M. Small models can be trained on a laptop in hours; large models require GPU clusters and weeks.

**Required callout** — type `note`: this chapter is the most code-heavy in the tutorial. The reference training loop in section 7 is ~60 lines of PyTorch that you can run as-is. If you can't follow code yet, work through the earlier numpy implementations (sections 2, 4, 5, 6) first — they're equivalent in concept.

**No code in this section.** Setup and motivation.

**Connection forward:** section 2 introduces the training objective.

### Section 2: The objective — cross-entropy loss for next-token prediction

**Heading:** `## The objective — cross-entropy loss for next-token prediction`
**Word target:** ~700
**Sub-headings:** `### The likelihood`, `### Cross-entropy per position`, `### Why this loss specifically`

**Teaching beats:**

**The likelihood:**
1. Language modeling is **maximum likelihood estimation**. The model's joint probability over a sequence is the product of per-token conditional probabilities:
   $$p_\theta(x_1, \ldots, x_T) = \prod_{t=1}^T p_\theta(x_t \mid x_{<t})$$
2. **Training** = maximize this likelihood (equivalently, minimize negative log-likelihood):
   
   Label this equation `8.loss`:

```mdx
<Equation label="8.loss">
$$\mathcal{L}(\theta) = -\sum_{t=1}^T \log p_\theta(x_t \mid x_{<t})$$
</Equation>
```

**Cross-entropy per position:**
3. At each position $t$, the model outputs a probability distribution $\hat{p}_t$ over the vocabulary. The loss at position $t$ is $-\log \hat{p}_t[y_t]$ where $y_t$ is the true token.
4. **Cross-entropy from logits**: more numerically stable. Compute $\log\sum_v \exp(z_v)$ (log-sum-exp) without explicit softmax. Frameworks fuse log-softmax + NLL into one operation.
5. **Computational footprint**: for batch B, sequence T, vocabulary V, the loss involves $B \cdot T$ predictions, each over $V$ classes. For GPT-2 ($V \approx 50k, T = 1024, B = 32$): 32,768 predictions per step. Significant.

**Why this loss specifically:**
6. Cross-entropy is the **calibrated** loss for probabilistic prediction. Equivalent to minimizing KL divergence between predicted and true distributions (where "true" is a one-hot at $y_t$).
7. Alternatives (MSE on logits, hinge loss, contrastive losses) don't have the calibration property — they don't directly optimize the likelihood of the data.

**Required code** — `<RunnableCode>` with cross-entropy from scratch:

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def cross_entropy(logits, targets):
    """
    logits: (n, vocab_size)
    targets: (n,) — true token indices
    """
    probs = softmax(logits, axis=-1)
    n = len(targets)
    true_probs = probs[np.arange(n), targets]
    return -np.mean(np.log(true_probs + 1e-9))

# Demo
np.random.seed(42)
vocab_size = 100
n_positions = 20
logits = np.random.normal(0, 1, (n_positions, vocab_size))
targets = np.random.randint(0, vocab_size, n_positions)

loss = cross_entropy(logits, targets)
random_baseline = -np.log(1 / vocab_size)
print(f"Cross-entropy loss (random logits, random targets): {loss:.4f}")
print(f"Theoretical baseline (uniform over {vocab_size}): {random_baseline:.4f}")
print(f"(random-init models should produce loss ≈ baseline initially)")
```

**Required callout** — type `warning`: MC4 from research.md. "Cross-entropy loss is computed once per sequence." Wrong — computed at *every position* and averaged (or summed). For B sequences of T tokens each, $B \cdot T$ predictions, each over V classes. The loss compute is a non-trivial fraction of the forward pass, especially for large vocabularies.

**Connection forward:** the loss needs gradients. Section 3 walks through the forward + backward pass.

### Section 3: The forward pass — tokens to loss

**Heading:** `## The forward pass — tokens to loss`
**Word target:** ~600

**Teaching beats:**
1. **The full pipeline**: tokens → embedding lookup → +positional encoding → N transformer blocks → final layer norm → output projection → logits → cross-entropy.
2. **Each step contributes**:
   - **Embeddings (Ch 2)**: token IDs to dense vectors
   - **Positional encoding (Ch 6)**: position info added (or applied via RoPE inside attention)
   - **Transformer blocks (Ch 5)**: N applications of attention + FFN with residuals
   - **Output projection**: hidden states to vocabulary logits. Often tied to input embedding (parameter sharing).
3. **The "input shift"**: for next-token prediction, input is `x[:-1]` and target is `x[1:]`. Same sequence, shifted by one position.
4. **Backward pass**: gradients flow back through every operation. Auto-grad (Ch 1) handles this. The model has tens of thousands to billions of parameters; each gets a gradient.
5. **Memory**: storing intermediate activations for backward pass dominates training memory. This is why gradient checkpointing and mixed precision matter at scale (covered in section 6 and Ch 10).

**Required callout** — type `note`: weight tying. Most transformers tie the **input embedding** and the **output projection** (they share parameters). Saves ~50M parameters at GPT-2 scale; doesn't hurt quality. The chapter's reference implementation uses weight tying.

**No code in this section.** The full forward pass is implemented in section 7's capstone code.

**Connection forward:** with the loss computed and gradients available, we need an optimizer.

### Section 4: The optimizer — from SGD to Adam to AdamW

**Heading:** `## The optimizer — from SGD to Adam to AdamW`
**Word target:** ~900 (longest section, centerpiece)
**Sub-headings:** `### Why not SGD`, `### Adam`, `### AdamW: decoupled weight decay`

**Teaching beats:**

**Why not SGD:**
1. SGD: $\theta_t = \theta_{t-1} - \alpha g_t$. Universal but slow for transformers.
2. Problems with SGD on transformers:
   - **Adaptive scale missing**: every parameter gets the same step. Some parameters need big steps; others need tiny.
   - **No momentum** (in vanilla SGD): no smoothing of noisy gradient estimates.
   - **Tuning sensitivity**: requires careful per-parameter LR tuning; impractical at scale.
3. Modern transformers don't use SGD. Adam (Kingma & Ba 2014) and AdamW (Loshchilov & Hutter 2017) dominate.

**Adam:**
4. Adam maintains two state variables per parameter: $m_t$ (first moment / momentum) and $v_t$ (second moment / squared gradient average).
5. Bias-corrected updates:
   $$m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t, \quad v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2$$
   $$\hat{m}_t = m_t / (1 - \beta_1^t), \quad \hat{v}_t = v_t / (1 - \beta_2^t)$$
   $$\theta_t = \theta_{t-1} - \alpha \cdot \hat{m}_t / (\sqrt{\hat{v}_t} + \epsilon)$$
6. **Adaptive per-parameter rate**: $\sqrt{\hat{v}_t}$ normalizes by historical gradient magnitude. Parameters with consistent large gradients get smaller updates; parameters with rare gradients get larger.

**AdamW — decoupled weight decay:**
7. Weight decay (regularization) shrinks parameters toward zero. The standard formulation: subtract $\lambda \theta$ from the gradient before the optimizer step.
8. **The problem**: naive Adam + L2 lets the weight decay get *divided by* $\sqrt{\hat{v}_t}$ along with the data gradient. Effective decay becomes parameter-specific.
9. **AdamW's fix**: apply weight decay as a separate multiplicative step:
   $$\theta_t = (1 - \alpha \lambda) \theta_{t-1} - \alpha \hat{m}_t / (\sqrt{\hat{v}_t} + \epsilon)$$
10. **Empirical result**: AdamW measurably better than Adam + L2 at the same hyperparameters. The convention has flipped — AdamW is the default.

**Required widget placeholder** — Optimizer comparison (secondary, session 38):

```mdx
<WidgetFrame title="Optimizer comparison" caption="SGD, Adam, and AdamW on a simple 2D loss landscape. Watch how each optimizer navigates: SGD oscillates and is slow; Adam smooths over noise; AdamW handles weight decay correctly (decoupled from gradient scaling).">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 38 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with the AdamW implementation:

```python
import numpy as np

class AdamW:
    def __init__(self, params_shape, lr=6e-4, beta1=0.9, beta2=0.95, eps=1e-8, weight_decay=0.1):
        self.lr = lr
        self.beta1, self.beta2, self.eps = beta1, beta2, eps
        self.weight_decay = weight_decay
        self.m = np.zeros(params_shape)
        self.v = np.zeros(params_shape)
        self.t = 0

    def step(self, params, grads):
        self.t += 1
        self.m = self.beta1 * self.m + (1 - self.beta1) * grads
        self.v = self.beta2 * self.v + (1 - self.beta2) * grads**2
        m_hat = self.m / (1 - self.beta1**self.t)
        v_hat = self.v / (1 - self.beta2**self.t)

        # AdamW update: adam step + decoupled weight decay
        params -= self.lr * (m_hat / (np.sqrt(v_hat) + self.eps) + self.weight_decay * params)
        return params

# Demo: minimize (x - 3)^2 with weight decay pulling x toward 0
params = np.array([5.0])
opt = AdamW(params.shape, lr=0.1, weight_decay=0.05)

print(f"Step 0: x = {params[0]:.4f}, target = 3")
for step in range(50):
    grads = 2 * (params - 3)   # gradient of (x - 3)^2
    opt.step(params, grads)

print(f"Step 50: x = {params[0]:.4f}")
print(f"(Should converge near 3, but weight decay pulls it slightly toward 0)")
```

**Required callout** — type `warning`: MC2 from research.md. "Adam and AdamW are the same." Wrong — they differ in how weight decay is applied. AdamW's decoupled formulation produces measurably better models at the same hyperparameters. **Use AdamW for transformers; never plain Adam + L2.**

**Required callout** — type `aside`: standard betas for transformer training are $\beta_1 = 0.9, \beta_2 = 0.95$, not Adam's default 0.999. The lower $\beta_2$ adapts faster to gradient magnitude changes — empirically helps transformers converge better.

**Connection forward:** the LR $\alpha$ in AdamW isn't constant. It follows a schedule.

### Section 5: Learning rate schedules — warmup + cosine decay

**Heading:** `## Learning rate schedules — warmup + cosine decay`
**Word target:** ~600

**Teaching beats:**
1. **The peak LR is a hyperparameter** that depends on model size. Typical values: $6 \cdot 10^{-4}$ for 125M models; $3 \cdot 10^{-4}$ for 1.3B; $1 \cdot 10^{-4}$ for larger.
2. **The schedule**: linear warmup (steps 0 to W), cosine decay (steps W to T):

```mdx
<Equation label="8.lr">
$$\alpha(t) = \begin{cases}
\alpha_{\max} \cdot \dfrac{t}{W} & \text{if } t < W \\[2mm]
\alpha_{\min} + \dfrac{1}{2}(\alpha_{\max} - \alpha_{\min})\left(1 + \cos\!\left(\pi \dfrac{t - W}{T - W}\right)\right) & \text{if } W \leq t \leq T
\end{cases}$$
</Equation>
```

3. **Warmup (linear ramp)**: at $t = 0$, gradients are unreliable (model is random). Starting at low LR avoids early instability. At $t = W$, the model has "found a reasonable region"; ramp to peak.
4. **Cosine decay**: smooth monotonic decrease from peak $\alpha_{\max}$ to floor $\alpha_{\min}$. Late training needs small updates to fine-tune; cosine provides smooth approach to floor.
5. **Typical values**: $W = 2000$ steps (medium models); $\alpha_{\min} = 10\%$ of $\alpha_{\max}$; $T$ = total training steps.

**Required code** — `<RunnableCode>` with the schedule function:

```python
import numpy as np

def lr_schedule(step, max_lr=6e-4, min_lr=6e-5, warmup_steps=2000, total_steps=100000):
    if step < warmup_steps:
        return max_lr * (step / warmup_steps)
    elif step <= total_steps:
        progress = (step - warmup_steps) / (total_steps - warmup_steps)
        return min_lr + 0.5 * (max_lr - min_lr) * (1 + np.cos(np.pi * progress))
    else:
        return min_lr

# Visualize the schedule
print(f"{'step':>7} {'lr':>10}")
print("-" * 20)
for s in [0, 500, 1000, 2000, 5000, 25000, 50000, 75000, 100000]:
    print(f"{s:>7} {lr_schedule(s):>10.2e}")

# Verify: peak at step 2000, floor at step 100000
print(f"\nMaximum LR (at warmup end): {lr_schedule(2000):.2e}")
print(f"Minimum LR (at end of training): {lr_schedule(100000):.2e}")
```

**Required callout** — type `note`: warmup is now considered essential for transformer training. Originally introduced (Goyal et al. 2017) for large-batch training; turns out to help at all batch sizes. The empirical lesson: never skip warmup for transformers, even when you think you can.

**Connection forward:** training also requires stability tricks beyond the schedule.

### Section 6: Training stability — clipping, mixed precision, accumulation

**Heading:** `## Training stability — clipping, mixed precision, accumulation`
**Word target:** ~500

**Teaching beats:**

**Gradient clipping:**
1. Outlier batches occasionally produce huge gradients. Without clipping, these cause loss spikes and NaN failures.
2. **The fix**: cap gradient L2 norm. If $\|g\| > c$, scale to $c$. Direction preserved; magnitude bounded.
3. Typical $c = 1.0$ for transformers.

**Mixed precision:**
4. Use FP16 (or BF16) for forward/backward; keep **master weights and optimizer state in FP32**.
5. Halves memory; speeds matmuls on supported hardware (~1.5-2× throughput).
6. **Caveat**: pure FP16 loses too much precision. The mix is essential — never FP16 throughout.

**Gradient accumulation:**
7. Effective batch size = `micro_batch_size * accum_steps`. Useful when target batch size exceeds GPU memory.
8. Accumulate gradients over `accum_steps` mini-batches; step optimizer once.
9. Loss divided by `accum_steps` so accumulated gradient has correct magnitude.

**Required code** — `<RunnableCode>` with gradient clipping:

```python
import numpy as np

def clip_gradients(grads, max_norm=1.0):
    """Clip gradients to maximum L2 norm. Returns clipped grads."""
    norm = np.linalg.norm(grads)
    if norm > max_norm:
        return grads * (max_norm / norm)
    return grads

# Demo
grads_normal = np.random.normal(0, 0.5, (100,))
grads_outlier = np.random.normal(0, 0.5, (100,))
grads_outlier[5] = 100.0   # outlier

print(f"Normal batch: norm before = {np.linalg.norm(grads_normal):.3f}, after = {np.linalg.norm(clip_gradients(grads_normal)):.3f}")
print(f"Outlier batch: norm before = {np.linalg.norm(grads_outlier):.3f}, after = {np.linalg.norm(clip_gradients(grads_outlier)):.3f}")
print(f"(Outlier batch is rescaled down to norm 1.0; direction preserved)")
```

**Required callout** — type `warning`: MC7 from research.md. "Mixed precision is just FP16." Wrong — mixed precision uses FP16/BF16 for *forward and backward passes* but keeps **master weights and optimizer state in FP32**. Without the FP32 state, optimizer updates accumulate floating-point error and training silently degrades.

**Connection forward:** all pieces in place. Section 7 assembles the complete loop.

### Section 7: The complete training loop

**Heading:** `## The complete training loop`
**Word target:** ~700 — CAPSTONE
**Sub-headings:** `### Putting it together`, `### Running the loop`

**Teaching beats:**
1. **What the loop does**: at each step, get a batch, forward pass + loss, backward pass for gradients, clip gradients, update LR according to schedule, optimizer step. Plus periodic logging and validation.
2. **What "step" means**: one optimizer update. A step processes one batch (B sequences of T tokens each). For GPT-2 small: $B = 32, T = 1024$ → ~32K tokens per step.
3. **How many steps**: typical training is 10K-1M steps. Chinchilla-style scaling implies ~20 tokens per parameter; for a 124M model, that's ~2.5B tokens — at 32K tokens/step, ~80K steps.
4. **Validation**: every few thousand steps, evaluate on a held-out set. Track validation loss to detect overfitting or instability.

**Required widget placeholder** — Loss curve / training trajectory (marquee, session 37):

```mdx
<WidgetFrame title="Training trajectory" caption="A small character-level model training on Tiny Shakespeare (~1MB text). Loss curve drops over training; sample generations show the model going from gibberish to coherent. Scrub through the training process to watch the model improve.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 37 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with the complete training loop (the chapter's capstone code):

```python
# A simplified nanoGPT-style training loop.
# Assumes: model (any GPT-style transformer), tokenized train+val data, config.

import torch
import torch.nn.functional as F
import math

class TrainConfig:
    max_lr = 6e-4
    min_lr = 6e-5
    warmup_steps = 2000
    total_steps = 100_000
    weight_decay = 0.1
    grad_clip = 1.0
    log_interval = 100

def lr_at(step, cfg):
    if step < cfg.warmup_steps:
        return cfg.max_lr * (step / cfg.warmup_steps)
    progress = (step - cfg.warmup_steps) / (cfg.total_steps - cfg.warmup_steps)
    return cfg.min_lr + 0.5 * (cfg.max_lr - cfg.min_lr) * (1 + math.cos(math.pi * progress))

def train(model, train_data, val_data, cfg, device='cuda'):
    model = model.to(device)

    # Separate parameter groups: decay for matrices, no decay for biases/norms
    decay_params = [p for n, p in model.named_parameters() if p.dim() >= 2]
    no_decay_params = [p for n, p in model.named_parameters() if p.dim() < 2]
    optimizer = torch.optim.AdamW(
        [{'params': decay_params, 'weight_decay': cfg.weight_decay},
         {'params': no_decay_params, 'weight_decay': 0.0}],
        lr=cfg.max_lr, betas=(0.9, 0.95), eps=1e-8,
    )

    for step in range(cfg.total_steps):
        # 1. Update LR
        lr = lr_at(step, cfg)
        for pg in optimizer.param_groups:
            pg['lr'] = lr

        # 2. Get batch (x: input tokens; y: target tokens — x shifted by 1)
        x, y = train_data.get_batch()
        x, y = x.to(device), y.to(device)

        # 3. Forward pass
        logits = model(x)               # (B, T, vocab_size)
        loss = F.cross_entropy(
            logits.view(-1, logits.size(-1)),
            y.view(-1),
        )

        # 4. Backward pass
        optimizer.zero_grad()
        loss.backward()

        # 5. Gradient clipping
        torch.nn.utils.clip_grad_norm_(model.parameters(), cfg.grad_clip)

        # 6. Optimizer step
        optimizer.step()

        # 7. Logging
        if step % cfg.log_interval == 0:
            print(f"step {step:>6} | lr {lr:.2e} | loss {loss.item():.4f}")

# Usage:
# model = GPT(vocab_size=50257, d_model=384, n_heads=6, n_layers=6, max_len=512)
# train(model, train_data, val_data, TrainConfig())
```

**Required callout** — type `note`: this is GPT-2-style — RoPE-free, with learned positional embeddings (as in the original GPT-2). A modern LLaMA-style implementation would use RoPE inside attention, SwiGLU instead of GELU in the FFN, and RMSNorm instead of LayerNorm. The training loop is essentially the same.

**Connection forward:** after training, the model can generate text. Section 8 covers sampling.

### Section 8: Generation — sampling from the trained model

**Heading:** `## Generation — sampling from the trained model`
**Word target:** ~500
**Sub-headings:** `### Greedy decoding`, `### Temperature`, `### Top-k and top-p (nucleus) sampling`

**Teaching beats:**

**Greedy decoding:**
1. At inference, the model's forward pass produces logits for the next token. Greedy decoding takes argmax → most likely token.
2. **Problem**: deterministic; produces repetitive, often boring outputs. "The cat sat on the mat. The cat sat on the mat. ..."

**Temperature:**
3. Before softmax, divide logits by temperature $T$:
   $$\hat{p}_t[v] = \frac{\exp(\text{logits}[v] / T)}{\sum_{v'} \exp(\text{logits}[v'] / T)}$$
4. $T = 1$: original distribution. $T < 1$: sharper, more deterministic. $T > 1$: flatter, more random.
5. Typical $T = 0.7-1.0$.

**Top-k and top-p:**
6. **Top-k**: keep only the $k$ highest-probability tokens; mask others; sample from the masked distribution.
7. **Top-p (nucleus)**: keep the smallest set whose cumulative probability $\geq p$. More adaptive — wider when distribution is flat; narrower when distribution is peaked.
8. Typical $k = 50$ or $p = 0.9-0.95$.

**Required code** — `<RunnableCode>` with sampling:

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def sample_next_token(logits, temperature=0.7, top_p=0.9):
    """
    logits: (vocab_size,) — model output for one position
    Returns: a single sampled token index
    """
    # Apply temperature
    logits = logits / temperature

    # Sort by descending probability
    sorted_idx = np.argsort(logits)[::-1]
    sorted_logits = logits[sorted_idx]
    cumprobs = np.cumsum(softmax(sorted_logits))

    # Find nucleus: smallest set with cumprob >= top_p
    cutoff = np.searchsorted(cumprobs, top_p) + 1
    nucleus_indices = sorted_idx[:cutoff]
    nucleus_logits = logits[nucleus_indices]
    nucleus_probs = softmax(nucleus_logits)

    # Sample
    sampled_local_idx = np.random.choice(len(nucleus_indices), p=nucleus_probs)
    return int(nucleus_indices[sampled_local_idx])

# Demo
rng = np.random.default_rng(42)
vocab_size = 50
fake_logits = rng.normal(0, 1, vocab_size)
fake_logits[5] = 5.0   # make token 5 highly probable

print(f"Highest-prob token: {np.argmax(fake_logits)}")
print(f"\n10 samples with temperature=0.7, top_p=0.9:")
for _ in range(10):
    print(f"  Sampled token: {sample_next_token(fake_logits.copy(), temperature=0.7, top_p=0.9)}")
```

**Required callout** — type `aside`: chat-tuned models (Claude, ChatGPT, Llama-Chat) often use temperature 1.0 with top-p 0.95. Code models prefer temperature 0.2-0.5 (less randomness). The temperature is a deployment-time choice, not a training choice.

**Connection forward:** the model trained here is small. Section 9 looks ahead.

### Section 9: Bridge to scaling

**Heading:** `## What we've built — and what's next`
**Word target:** ~300

**Teaching beats:**
1. **What you have after this chapter**: a complete, runnable training pipeline. Architecture (Ch 1-6) + data (Ch 7) + training (Ch 8) = a small working LLM. ~10M-100M parameters, trained on a small corpus, generates coherent text.
2. **What "scaling" means**: bigger models on more data with more compute. The same training recipe — same loss, same AdamW, same schedule, same clip — works at billion-parameter scale, with caveats around distributed training and infrastructure.
3. **The next two chapters**:
   - **Ch 9**: scaling laws (how to choose model size + dataset size + compute budget) and distributed training (sharding across GPUs).
   - **Ch 10**: training infrastructure (GPU clusters, Triton kernels, the engineering systems behind production training).
4. **What you could do right now**: take the chapter's reference code, train on Tiny Shakespeare or any small corpus, watch the loss drop, sample text. The pipeline works — only the scale differs.

**Sample close** (rewrite in chapter voice):

> Eight chapters in, you have a working LLM. Small — 10M to 100M parameters, trained on perhaps 1GB of text — but real. It went from random noise to coherent text via the recipe in this chapter: cross-entropy, AdamW, cosine schedule with warmup, gradient clipping. Same recipe scales to 70B parameters; same recipe scales to a frontier lab's training cluster.
>
> Chapters 9 and 10 explore that scaling. How to choose model and dataset sizes (the Chinchilla scaling law). How to shard a model across many GPUs. How to write fused CUDA kernels for the bottleneck operations. The engineering changes substantially; the recipe doesn't.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 8, slug: 'ch08-building-small-llm', title: 'Building a small LLM', partNum: 3, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch08-building-small-llm/index.astro && rm src/pages/ch08-building-small-llm/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch08-building-small-llm/`** renders with:
   - Chapter eyebrow ("Chapter 8") + h1 + description
   - 9 h2 sections in the order specified
   - Equations render via KaTeX; labeled equations `<Equation label="8.loss">` and `<Equation label="8.lr">` are present
   - **6 `<RunnableCode>` blocks** (sections 2, 4, 5, 6, 7, 8) — most ever
   - 2 `<WidgetFrame>` placeholders (sections 4 and 7)
   - At least 6 callouts spread through the chapter
3. **Sidebar:** Ch 1-7 published; Ch 8 active (draft); Ch 9-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 8:** prev = Ch 7 (active); next = Ch 9 (disabled)
6. **TOC on Ch 8** populates with all 9 sections plus subsections
7. **Word count:** chapter prose between 5000 and 6000 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 37 and 38 own them.
- ❌ **Do not write exercises.** Session 39 owns.
- ❌ **Do not flip Ch 8's status to `'published'`.** Session 39 owns.
- ❌ **Do not go deep on scaling laws.** Ch 9 owns.
- ❌ **Do not cover distributed training.** Ch 9-10 own.
- ❌ **Do not cover SFT/RLHF/DPO.** Ch 13-15 own.
- ❌ **Do not modify Ch 1-7.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch08-building-small-llm/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch08-building-small-llm/index.astro 2>/dev/null || true
git commit -m "session 36: Ch 8 prose — building a small LLM (cross-entropy + AdamW + cosine schedule + training loop + sampling)"
git push origin main
```

---

## Notes for the session author

**On the chapter being the most code-heavy:**
Ch 8 is the chapter where the reader *implements* the trainer. Earlier chapters were mostly conceptual + small code snippets. Ch 8 has six runnable code blocks because the reader needs to *touch* every component: cross-entropy, AdamW, schedule, clipping, the full loop, sampling. Don't trim — each block teaches a specific piece.

**On the capstone code in section 7:**
This is ~60 lines of clean PyTorch — the chapter's most important deliverable. It must be:
- **Runnable as-is** with a tokenizer and dataset loader (which the chapter assumes exist; reader provides)
- **Complete**: forward, backward, clipping, scheduling, logging, parameter groups for decay
- **Minimal**: no premature optimization, no exotic features
- **GPT-2 style**: matches the architecture the rest of the chapter described

If the capstone code grows beyond ~80 lines, simplify. If under ~40, it's missing pieces.

**On the two widgets:**
- **Section 4 (secondary)**: optimizer comparison. SGD vs Adam vs AdamW on a 2D landscape. Visualizes WHY AdamW. Educational supplement to the prose.
- **Section 7 (marquee)**: training trajectory. Watch loss drop, samples improve. The emotional payoff of the chapter. The visual the reader walks away remembering.

The marquee is at section 7 (not section 2 or 4) because that's where the chapter's emotional climax happens. Place the visual at the moment of impact.

**On the two-topic structure:**
- Topic A (sections 2-5): the math of training. Cross-entropy, AdamW, LR schedule.
- Topic B (sections 6-8): the engineering of training. Stability, the loop, sampling.

The two topics share sections only loosely (gradient clipping spans both). The chapter has a natural pivot at section 6.

**Pedagogical outcomes for the reader.** After Ch 8, the reader should be able to:
1. State cross-entropy loss for next-token prediction
2. Explain why AdamW > Adam + L2 regularization
3. Implement AdamW from scratch
4. State the warmup + cosine LR schedule formula
5. Explain why gradient clipping helps
6. Implement a complete (small) training loop in PyTorch
7. Generate text from a trained model with temperature and top-p sampling

Seven outcomes. The exercises in session 39 will explicitly serve outcomes 1, 3, 4, and 6.

**This is the project's center of gravity for "training side."** Build with care; this chapter is what the entire training half of the tutorial leans on.
