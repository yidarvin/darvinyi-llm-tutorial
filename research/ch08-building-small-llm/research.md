# Chapter 8 — Building a small LLM: research

> Curated source material for Chapter 8's build sessions. This is the chapter where everything from Chapters 1-7 comes together. **Architecture** (Ch 1-6, the transformer block + positional encoding) + **data** (Ch 7, the pre-training corpus) → **a working trained LLM**. The chapter covers the cross-entropy loss for next-token prediction, the AdamW optimizer (not just Adam, not just SGD), learning rate schedules with warmup + cosine decay, training stability tricks (gradient clipping, mixed precision), and a complete nanoGPT-style reference implementation that the reader can run.

> Like Ch 5, this is a **two-topic chapter** — the mathematics of training (loss, optimizer, gradients) and the engineering of training (loop structure, schedules, sampling). It uses the **5-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Building a small LLM

**Premise:** Ch 1-6 built the architecture; Ch 7 built the data pipeline. This chapter writes the training loop that combines them. The result: a small (~10M parameter) language model trained on a small corpus, that visibly improves at next-token prediction. The reader can run the chapter's reference code on a laptop and see training happen.

**Out of scope (other chapters):**
- The architecture itself (Ch 1-6)
- Pre-training data construction (Ch 7)
- Scaling laws (Ch 9)
- Distributed / multi-GPU training (Ch 9-10)
- Post-training: SFT, RLHF, DPO (Ch 13-15)
- Inference optimization beyond basic sampling (Ch 17)

**In scope and locked:**
- **Cross-entropy loss** for next-token prediction (the language modeling objective)
- **The full forward pass**: embedding → N transformer blocks → output projection → loss
- **Backward pass and gradients**: gradient computation through the entire model
- **AdamW optimizer**: Adam with decoupled weight decay; why it beats SGD for transformers
- **Learning rate schedules**: warmup + cosine decay (the standard transformer recipe)
- **Training stability**: gradient clipping, mixed precision (FP16/BF16), gradient accumulation
- **The training loop**: data loading, forward, backward, optimizer step, logging
- **Generation/sampling at inference**: greedy, top-k, top-p sampling
- **What "small" means in 2024**: parameter counts, dataset sizes, training compute
- **nanoGPT-style reference**: a complete, runnable, minimal trainer

**Suggested chapter structure** (9 sections):

1. The setup — what we're about to do (~400 words)
2. The objective: cross-entropy loss for next-token prediction (~700 words)
3. The forward pass: tokens to loss (~600 words)
4. The optimizer: Adam to AdamW (~900 words — central, includes weight decay)
5. Learning rate schedules: warmup + cosine decay (~600 words)
6. Training stability: clipping, mixed precision, accumulation (~500 words)
7. The complete training loop (~700 words — capstone, includes full reference)
8. Generation: sampling from the trained model (~500 words)
9. Bridge to scaling (~300 words)

Target: ~5200 words plus 2 widgets and 4-5 runnable code blocks.

---

## Key papers and references

### Kingma & Ba 2014 — "Adam: A Method for Stochastic Optimization"
- **arXiv:** [1412.6980](https://arxiv.org/abs/1412.6980)
- **What it contributed:** the **Adam optimizer**. Combines momentum (first moment estimate $m_t$) and adaptive per-parameter learning rates (second moment estimate $v_t$). Defaults: $\beta_1 = 0.9, \beta_2 = 0.999, \epsilon = 10^{-8}$.
- **For the chapter:** central reference for section 4. The chapter introduces Adam, then refines to AdamW.

### Loshchilov & Hutter 2017 — "Decoupled Weight Decay Regularization"
- **arXiv:** [1711.05101](https://arxiv.org/abs/1711.05101)
- **What it contributed:** **AdamW** — Adam with weight decay applied as a separate step, not folded into the gradient. The standard claim: "Adam + L2 regularization isn't the same as Adam + decoupled weight decay." The decoupled version (AdamW) is what's actually used in modern transformers.
- **For the chapter:** central reference for section 4. The chapter explains why AdamW > Adam-with-L2.

### Loshchilov & Hutter 2016 — "SGDR: Stochastic Gradient Descent with Warm Restarts"
- **arXiv:** [1608.03983](https://arxiv.org/abs/1608.03983)
- **What it contributed:** **cosine annealing** — the learning rate schedule used by almost every modern LLM. After warmup, the learning rate decays following a cosine curve from peak to a small minimum.
- **For the chapter:** central reference for section 5. The standard schedule.

### Goyal et al. 2017 — "Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour"
- **arXiv:** [1706.02677](https://arxiv.org/abs/1706.02677)
- **What it contributed:** **learning rate warmup**. Showed that for large batch sizes, ramping up the learning rate linearly over the first few hundred steps is essential for training stability. Now standard practice for transformers regardless of batch size.
- **For the chapter:** brief mention in section 5 — warmup is a precondition for the cosine decay.

### Radford et al. 2019 — "Language Models are Unsupervised Multitask Learners" (GPT-2)
- **OpenAI tech report:** [GPT-2 paper PDF](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
- **What it contributed:** the GPT-2 architecture and the demonstration that scaling decoder-only transformers + next-token prediction produces remarkable capabilities. Established the modern LLM recipe.
- **For the chapter:** historical anchor. The chapter's reference implementation is "GPT-2-style."

### Karpathy 2023 — `nanoGPT`
- **GitHub:** [github.com/karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)
- **What it is:** a minimal, ~600-line implementation of GPT-2 training and inference. The canonical reference for "how a small LLM trains."
- **For the chapter:** the chapter's reference implementation will be a simplified version of nanoGPT, condensed for tutorial pedagogy.

### Karpathy 2023 — "Let's build GPT: from scratch, in code, spelled out"
- **YouTube:** [youtube.com/watch?v=kCc8FmEb1nY](https://www.youtube.com/watch?v=kCc8FmEb1nY)
- **What it is:** Karpathy's 2-hour video building a tiny GPT from scratch. Pedagogical gold standard.
- **For the chapter:** the chapter is structured similarly — math first, then code, then results.

### Micikevicius et al. 2018 — "Mixed Precision Training"
- **arXiv:** [1710.03740](https://arxiv.org/abs/1710.03740)
- **What it contributed:** mixed-precision training (FP16/BF16 weights and activations, FP32 master weights and optimizer state). Halves memory; doubles throughput on supported hardware.
- **For the chapter:** brief mention in section 6.

---

## Core derivations

### Derivation 1: Cross-entropy loss for next-token prediction

**The setup:** an autoregressive language model produces a probability distribution $p_\theta(x_{t+1} \mid x_1, \ldots, x_t)$ over the vocabulary at each position. Given a sequence $x_1, x_2, \ldots, x_T$, the model's joint probability is:

$$p_\theta(x_1, x_2, \ldots, x_T) = \prod_{t=1}^{T} p_\theta(x_t \mid x_1, \ldots, x_{t-1})$$

**The training objective** is to maximize this likelihood. Equivalently, minimize the negative log-likelihood:

$$\mathcal{L}(\theta) = -\sum_{t=1}^{T} \log p_\theta(x_t \mid x_1, \ldots, x_{t-1})$$

**Per-position interpretation:** at each position $t$, the model predicts a distribution over the vocabulary; the loss is the negative log probability of the *true* next token. Summing over positions gives the sequence's total loss.

**Cross-entropy formulation:** if $y_t \in \{1, \ldots, V\}$ is the true token at position $t$ and $\hat{p}_t$ is the model's predicted distribution (a $V$-vector summing to 1), then:

$$\mathcal{L}_t = -\log \hat{p}_t[y_t] = -\hat{p}_t^{\text{logits}}[y_t] + \log\sum_v \exp(\hat{p}_t^{\text{logits}}[v])$$

(The second form is the numerically-stable log-sum-exp formulation.)

**Computational note:** the loss is summed (or averaged) over positions. For a batch of B sequences of length T, the per-batch loss involves $B \cdot T$ predictions, each over $V$ classes. For GPT-2 ($V \approx 50k$, $T = 1024$, $B = 32$), that's $32 \cdot 1024 = 32{,}768$ predictions per step — significant compute just for the loss.

### Derivation 2: Adam optimizer update rule

For each parameter $\theta_i$, Adam maintains two state variables: the first moment $m_t$ (momentum) and the second moment $v_t$ (variance estimate).

**Update rule** at step $t$ with gradient $g_t = \nabla \mathcal{L}(\theta_t)$:

$$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2$$

**Bias correction** (since $m_0 = v_0 = 0$ biases the early estimates toward zero):

$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \qquad \hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$

**Parameter update:**

$$\theta_t = \theta_{t-1} - \alpha \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

**Defaults:** $\beta_1 = 0.9, \beta_2 = 0.999, \epsilon = 10^{-8}$, peak learning rate $\alpha$ chosen via schedule.

**Why Adam beats SGD for transformers:**
- **Adaptive per-parameter learning rates**: each parameter gets a rate inversely proportional to the historical gradient magnitude. Parameters with large gradients get smaller updates; rare gradients get larger updates.
- **Momentum-like behavior**: $\hat{m}_t$ smooths over recent gradients.
- **Robustness to gradient scale**: $\sqrt{\hat{v}_t}$ normalizes by gradient magnitude, making Adam less sensitive to the learning rate's exact value.

### Derivation 3: AdamW — decoupled weight decay

**Weight decay** (L2 regularization) discourages large parameter values. Naive implementation: add $\lambda \theta$ to the gradient:

$$g_t^{\text{adam-L2}} = g_t + \lambda \theta_{t-1}$$

**The problem with Adam + L2:** the L2 gradient gets divided by $\sqrt{\hat{v}_t}$ along with the data gradient. Effective weight decay becomes parameter-specific, depending on gradient history. Not what you want.

**AdamW's fix:** apply weight decay as a *separate step*, not through the gradient:

$$\theta_t = \theta_{t-1} - \alpha \left(\frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} + \lambda \theta_{t-1}\right)$$

Equivalently:

$$\theta_t = (1 - \alpha \lambda) \theta_{t-1} - \alpha \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

The first term is the **decoupled decay**: shrink $\theta$ multiplicatively before applying the Adam update. The second term is the standard Adam update without L2.

**Why this matters:** AdamW produces measurably better-trained models than Adam + L2 at the same hyperparameters. Empirical result; most modern transformers use AdamW.

**Typical weight decay:** $\lambda = 0.1$ for transformers (much higher than the 0.0001-0.001 typical for CNNs). The high value is because AdamW's effective decay is small per step; you need a larger nominal rate.

### Derivation 4: Learning rate schedule — warmup + cosine decay

**The pattern:**
1. **Warmup** (first $W$ steps): linear ramp from 0 to peak LR $\alpha_{\max}$.
2. **Cosine decay** (steps $W$ to $T$): smoothly decay from $\alpha_{\max}$ to a minimum $\alpha_{\min}$ following a half-cosine.

**Formula:**

$$\alpha(t) = \begin{cases}
\alpha_{\max} \cdot \dfrac{t}{W} & \text{if } t < W \text{ (warmup)} \\[2mm]
\alpha_{\min} + \dfrac{1}{2}(\alpha_{\max} - \alpha_{\min})\left(1 + \cos\!\left(\pi \cdot \dfrac{t - W}{T - W}\right)\right) & \text{if } W \leq t \leq T \text{ (cosine decay)}
\end{cases}$$

**Typical values:**
- $\alpha_{\max} = 6 \cdot 10^{-4}$ for small (~125M) models; $3 \cdot 10^{-4}$ for medium (~1.3B); $1 \cdot 10^{-4}$ for large
- $\alpha_{\min} = 10\%$ of $\alpha_{\max}$ (so $\alpha_{\min} = 6 \cdot 10^{-5}$ for small)
- $W = 2000$ steps for medium-scale models; more for larger
- $T$ = total training steps (chosen to match dataset size)

**Why warmup:** at initialization, gradients are unreliable (huge variance). Starting at a low LR avoids early training instability. After warmup, the model has "found a reasonable region" and the higher LR helps converge faster.

**Why cosine decay:** smooth, monotonic decrease from peak to floor. Empirically performs better than step decay or linear decay for transformers. The intuition: late training needs small updates to converge; cosine provides that without the abrupt transitions of step schedules.

### Derivation 5: Gradient clipping

**The problem:** during training, individual gradients can be huge — outliers from particular batches. Large gradients cause large parameter updates, which can destabilize training (loss spikes, NaN values).

**The fix:** clip gradients to a maximum L2 norm. Before the optimizer step:

$$g \leftarrow g \cdot \min\!\left(1, \frac{\text{clip\_value}}{\|g\|_2}\right)$$

If the gradient norm exceeds `clip_value`, scale it down to `clip_value`. The direction is preserved; the magnitude is bounded.

**Typical clip values:** 1.0 for transformers (small) to 0.1 for very large models. The smaller the clip, the more conservative each update.

**Why it helps:** prevents training divergence. Empirical observation: even well-behaved training runs have occasional outlier batches with huge gradients; clipping smooths these out.

---

## Glossary

- **Cross-entropy loss:** the language-modeling training objective. Negative log-likelihood of the true next token.
- **Logits:** the raw model outputs before softmax. Shape `(batch, seq_len, vocab_size)`.
- **Forward pass:** computing model outputs (and loss) from inputs.
- **Backward pass:** computing gradients of the loss w.r.t. parameters via backprop.
- **SGD:** Stochastic Gradient Descent. $\theta_t = \theta_{t-1} - \alpha g_t$. Baseline; not used for modern LLMs.
- **Momentum SGD:** SGD with a moving average of gradients. $m_t = \beta m_{t-1} + g_t$; $\theta_t = \theta_{t-1} - \alpha m_t$.
- **Adam:** adaptive momentum optimizer (Kingma & Ba 2014). $m_t, v_t$ updates, bias correction, normalized step.
- **AdamW:** Adam with **decoupled** weight decay (Loshchilov & Hutter 2017). The standard transformer optimizer.
- **Weight decay:** regularization that shrinks parameters toward zero. Decoupled (AdamW) vs L2-coupled (Adam + L2).
- **Learning rate (LR):** the step size for parameter updates. Scheduled during training.
- **Warmup:** linear LR ramp from 0 to peak over the first few hundred-thousand steps.
- **Cosine decay (annealing):** LR decay following a half-cosine curve from peak to floor.
- **Gradient clipping:** capping the L2 norm of gradients before the optimizer step.
- **Mixed precision (FP16/BF16):** using lower-precision floats for forward/backward to save memory and speed up compute. Optimizer state stays in FP32.
- **Gradient accumulation:** accumulating gradients over multiple mini-batches before stepping. Simulates a larger effective batch size on memory-constrained hardware.
- **Sampling (inference):** generating tokens from the trained model. Greedy = argmax; top-k = sample from k highest; top-p (nucleus) = sample from minimal set covering probability p.
- **Temperature:** scalar dividing logits before softmax during sampling. Higher T → more diverse; lower T → more deterministic.
- **Checkpoint:** snapshot of model + optimizer state saved during training.
- **nanoGPT:** Andrej Karpathy's minimal GPT implementation (~600 lines). The chapter's reference baseline.

---

## Pedagogical analogies

### 1. Training as "tuning a radio"
Imagine the loss landscape as a vast hilly terrain; the model's parameters are coordinates on it. Training is "rolling downhill" — gradient descent. But the terrain is high-dimensional (millions of axes), bumpy (noisy gradients from random batches), and the destination is unknown. Adam + scheduling + clipping is the modern toolkit for navigating this terrain efficiently.

**Best used for:** section 1 motivation.

### 2. Loss as "how surprised was the model"
For each token in the training corpus, the model assigns a probability. The loss is the negative log of that probability — i.e., how surprised the model is by the actual next token. Low surprise (high probability) = low loss. High surprise = high loss. Training is "reduce average surprise across all tokens in the training corpus."

**Best used for:** section 2 introducing cross-entropy.

### 3. AdamW vs SGD as "shock absorbers vs rigid axle"
SGD applies the same step size to every parameter, regardless of recent gradient history. Adam adapts per-parameter — parameters with consistent gradients get smaller updates; parameters with rare gradients get larger ones. Like a car's shock absorbers smoothing over bumps in the road, Adam smooths over gradient noise.

**Best used for:** section 4 motivating the optimizer.

### 4. Warmup as "loosening up before the workout"
The first few hundred training steps are unstable — gradients are unpredictable because the model is essentially random. Starting at a low LR avoids the chaos. After warmup, the model has stabilized; ramp to peak LR for productive training.

**Best used for:** section 5 motivating warmup.

---

## Common misconceptions

### MC1: "Training is just gradient descent."
**Reality:** at scale, plain gradient descent (or SGD) doesn't work well for transformers. The combination of (a) adaptive per-parameter learning rates (Adam/AdamW), (b) learning rate schedules (warmup + cosine), and (c) gradient clipping is essential. Each piece matters; removing any breaks training stability.

### MC2: "Adam and AdamW are the same thing."
**Reality:** they differ in how weight decay is applied. Adam + L2 (the naive combination) folds L2 into the gradient, which then gets divided by $\sqrt{\hat{v}_t}$ — effective weight decay becomes parameter-specific. AdamW applies decay as a separate step, decoupled from Adam's adaptivity. Empirical result: AdamW produces measurably better models at the same hyperparameters.

### MC3: "Larger learning rate = faster training."
**Reality:** too-large LR causes training divergence (NaN losses). Too-small LR makes training slow but stable. The peak LR is a hyperparameter; for transformers, it scales inversely with model size (Hoffmann et al. 2022): ~$6 \cdot 10^{-4}$ for ~125M models, ~$1 \cdot 10^{-4}$ for ~1B+. Warmup gives access to higher peak LRs by avoiding early instability.

### MC4: "Cross-entropy loss is computed once per sequence."
**Reality:** it's computed *per token position* and averaged (or summed). For a B-batch sequence of length T, you compute $B \cdot T$ next-token predictions. Each prediction is a softmax over the full vocabulary (typically 50K+). The loss is dominated by the largest probability values, but every token's prediction contributes.

### MC5: "Weight decay is just L2 regularization."
**Reality:** for AdamW, weight decay is *not* the same as adding L2 to the loss. The decoupled version applies $\theta \to (1 - \alpha\lambda)\theta$ as a separate operation, independent of Adam's adaptive scaling. The effective regularization is constant per step, regardless of gradient magnitudes. Different (and better, empirically) than L2.

### MC6: "More epochs is always better."
**Reality:** modern LLM pretraining is typically **< 1 epoch** on huge datasets. The Chinchilla scaling law (Ch 9) gives 20 tokens-per-parameter as roughly optimal — implying the model sees each training example fewer than once. Training to convergence on a small dataset is *overfitting territory*; doing fewer passes on a larger dataset is the modern strategy.

### MC7: "Mixed precision is just FP16."
**Reality:** mixed-precision training uses FP16 (or BF16) for *forward and backward passes*, but keeps **master weights and optimizer state in FP32**. The FP16/BF16 reduces memory bandwidth and speeds up matmuls; the FP32 state preserves numerical stability for the optimizer. Without the FP32 master weights, training silently degrades.

---

## Tricky implementation details

### TID1: Cross-entropy with logits, not softmax
Use `F.cross_entropy(logits, targets)` in PyTorch (or equivalent in JAX) — it operates directly on logits. Computing softmax then NLL separately is numerically less stable. Most frameworks have a fused log-softmax-then-NLL.

### TID2: AdamW betas and epsilon
Standard transformer settings: $\beta_1 = 0.9, \beta_2 = 0.95$ (not the Adam default of 0.999 — empirically 0.95 works better for LLMs), $\epsilon = 10^{-8}$, weight decay = 0.1.

### TID3: Weight decay only on non-bias non-norm parameters
By convention, do **not** apply weight decay to bias terms or layer norm scales. These should be free to take whatever values training requires. PyTorch's parameter groups make this easy: separate param groups, one with `weight_decay=0.1` (linear weights), one with `weight_decay=0` (biases, norms).

### TID4: Gradient accumulation
For very large effective batch sizes (1M tokens) on a single GPU:
```python
for step in range(steps):
    optimizer.zero_grad()
    for accum_step in range(accum_steps):
        loss = forward_and_loss(get_batch())
        (loss / accum_steps).backward()
    grad_clip(model)
    optimizer.step()
```
Loss is divided by `accum_steps` so the accumulated gradient has the correct magnitude.

### TID5: Sampling — temperature and top-p
At inference time, the standard transformer sampling pipeline:
1. Forward pass → logits for last position
2. Divide by temperature: `logits = logits / T`
3. Apply top-p: keep the smallest set of tokens whose probabilities sum to p; mask others
4. Softmax → probabilities
5. Sample one token from the masked distribution

Typical values: $T = 0.7-1.0$, $p = 0.9-0.95$. Lower temperature = more deterministic; lower top-p = more constrained.

### TID6: The pad token problem
Sequences in a batch may have different lengths. Common approaches: (a) pack sequences into fixed-length context windows (no padding), (b) pad to the longest sequence and mask out pad tokens from the loss. Modern training prefers (a) for efficiency.

---

## Reference implementations

### Cross-entropy loss (numpy)

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def cross_entropy(logits, targets):
    """
    logits: (n, vocab_size) — predicted logits at each position
    targets: (n,) — true token indices
    Returns: average cross-entropy loss (scalar)
    """
    probs = softmax(logits, axis=-1)
    # Pick the predicted probability of the true token at each position
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
print(f"Cross-entropy loss: {loss:.4f}")
print(f"Random baseline expected: -log(1/{vocab_size}) = {-np.log(1/vocab_size):.4f}")
print(f"(Random-init model should have loss ≈ baseline)")
```

### AdamW optimizer (numpy)

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
        """In-place update of params using gradients."""
        self.t += 1
        self.m = self.beta1 * self.m + (1 - self.beta1) * grads
        self.v = self.beta2 * self.v + (1 - self.beta2) * grads**2

        m_hat = self.m / (1 - self.beta1**self.t)
        v_hat = self.v / (1 - self.beta2**self.t)

        # Adam update + decoupled weight decay
        params -= self.lr * (m_hat / (np.sqrt(v_hat) + self.eps) + self.weight_decay * params)
        return params

# Demo
params = np.random.normal(0, 1, (10,))
target = np.zeros(10)   # we want params -> 0
opt = AdamW(params.shape, lr=0.01, weight_decay=0.0)   # no decay; just verify Adam mechanic

print(f"Initial params: {params.round(3)}")
print(f"Initial loss: {np.mean((params - target)**2):.4f}")

for step in range(100):
    grads = 2 * (params - target)   # gradient of MSE
    opt.step(params, grads)

print(f"Final params: {params.round(3)}")
print(f"Final loss: {np.mean((params - target)**2):.4f}")
```

### Learning rate schedule (warmup + cosine)

```python
import numpy as np

def lr_schedule(step, max_lr=6e-4, min_lr=6e-5, warmup_steps=2000, total_steps=100000):
    if step < warmup_steps:
        # Linear warmup
        return max_lr * (step / warmup_steps)
    elif step <= total_steps:
        # Cosine decay
        progress = (step - warmup_steps) / (total_steps - warmup_steps)
        return min_lr + 0.5 * (max_lr - min_lr) * (1 + np.cos(np.pi * progress))
    else:
        return min_lr

# Demo
steps_to_plot = [0, 500, 1000, 2000, 5000, 10000, 50000, 90000, 100000]
print(f"{'step':>7} {'lr':>10}")
print("-" * 20)
for s in steps_to_plot:
    print(f"{s:>7} {lr_schedule(s):>10.2e}")
```

### A complete training loop (PyTorch pseudocode)

```python
# A simplified nanoGPT-style training loop.
# In the chapter, this is the section-7 capstone code.

import torch
import torch.nn.functional as F

# Assume: model (a GPT instance), train_loader, val_loader, config
model = model.to(device)
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=config.max_lr,
    betas=(0.9, 0.95),
    weight_decay=0.1,
)

step = 0
while step < config.total_steps:
    # 1. Get a batch
    x, y = next(train_iter)   # x: (B, T) input tokens; y: (B, T) target tokens
    x, y = x.to(device), y.to(device)

    # 2. Forward pass
    logits = model(x)   # (B, T, vocab_size)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))

    # 3. Backward pass
    optimizer.zero_grad()
    loss.backward()

    # 4. Gradient clipping
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

    # 5. Update learning rate
    lr = lr_schedule(step, config.max_lr, config.min_lr, config.warmup_steps, config.total_steps)
    for pg in optimizer.param_groups:
        pg['lr'] = lr

    # 6. Optimizer step
    optimizer.step()

    # 7. Logging
    if step % 100 == 0:
        print(f"step {step:>6} | lr {lr:.2e} | loss {loss.item():.4f}")

    step += 1

# At inference time:
@torch.no_grad()
def generate(model, prompt_tokens, max_new_tokens=100, temperature=0.7, top_p=0.9):
    tokens = prompt_tokens
    for _ in range(max_new_tokens):
        logits = model(tokens)[:, -1, :]   # last position
        logits = logits / temperature
        # Top-p (nucleus) sampling
        sorted_logits, sorted_idx = torch.sort(logits, descending=True)
        cumprobs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
        mask = cumprobs <= top_p
        mask[..., 0] = True   # always include at least one token
        sorted_logits[~mask] = -float('inf')
        logits = torch.zeros_like(logits).scatter_(-1, sorted_idx, sorted_logits)

        probs = F.softmax(logits, dim=-1)
        next_token = torch.multinomial(probs, num_samples=1)
        tokens = torch.cat([tokens, next_token], dim=-1)
    return tokens
```

---

## Connections to other chapters

- **Ch 1-6 (Architecture):** the model in this chapter's training loop. The chapter uses the transformer block from Ch 5, the positional encoding from Ch 6, etc. The training loop is *what runs on top of* the architecture.
- **Ch 7 (Pre-training data):** the corpus in this chapter's training loop. Cleaned web data, tokenized via Ch 3's BPE, becomes the training stream.
- **Ch 9 (Scaling laws + distributed):** scales the training loop to many GPUs and very large models. Chinchilla scaling law (Hoffmann et al. 2022) gives the parameter/token trade-off.
- **Ch 10 (Training infrastructure):** the systems engineering of training at scale. GPU clusters, model parallelism, etc.
- **Ch 13 (SFT):** the post-training counterpart. SFT uses the same loss and optimizer but on instruction-following data, often with parameter-efficient methods (LoRA, etc., covered in Ch 16).
- **Ch 17 (Inference optimization):** sampling and KV cache at scale.

---

## Open questions for the chapter author

### Q1: How much code in the chapter?
**Recommendation:** the chapter is code-heavy. The reference training loop (section 7) is the capstone — it should be substantial (~50-80 lines of clean code) and *fully runnable*. Earlier sections introduce concepts with smaller code snippets.

### Q2: Should we run actual training in the chapter?
**Recommendation:** no — too slow for Pyodide. Instead, precompute a training trajectory offline (loss values + sample predictions at intervals) and play it back in the marquee widget. The reader sees what training looks like without waiting for it to run.

### Q3: PyTorch or numpy?
**Recommendation:** mixed. Numpy for the standalone optimizer / loss / schedule code (educational clarity). PyTorch for the capstone training loop (realistic and runnable). The chapter prose should explicitly call out which framework each code block uses.

### Q4: How much about scaling laws?
**Recommendation:** none in this chapter. Ch 9 owns scaling laws. Mention only in passing: "the Chinchilla scaling law (Ch 9) tells us how to balance model size and dataset size."

### Q5: Widget candidates
1. **Loss curve / training trajectory (marquee, session 37):** show a small model training over time. Precomputed loss curve + sample generated text at intervals. The user scrubs through the training process and sees the model improve from gibberish to coherent. **Recommended marquee.**
2. **Optimizer comparison (secondary, session 38):** show SGD, Adam, and AdamW running on a simple 2D loss landscape. The user sees how each optimizer navigates the landscape — SGD oscillates, Adam smooths, AdamW handles weight decay correctly. **Recommended secondary.**
3. **Learning rate schedule (alternative):** an interactive plot of the schedule with sliders for warmup_steps, total_steps, max_lr, min_lr. Less pedagogically central than the other two; consider for Ch 9 instead.

Recommend (1) and (2).

---

## Pre-research notes

**Chapter cadence:** Ch 8 is a **two-topic chapter** like Ch 5 — covers both the *math of training* (loss, optimizer, gradients) and the *engineering of training* (schedules, stability, the complete loop). It earns the **5-file cadence** (research + 4 chapter sessions).

Planned file layout:
- File 48: research (this)
- File 49: page structure (~700 lines, the longest chapter prose; 9 sections)
- File 50: loss curve marquee widget (training trajectory playback)
- File 51: optimizer comparison secondary widget
- File 52: exercises + closeout (status flip 'draft' → 'published')

Files 53+ from the original BUILD_ORDER absorbed.

**Pedagogical outcomes for the reader.** After Ch 8, the reader should be able to:
1. State cross-entropy loss for next-token prediction
2. Explain why AdamW > Adam + L2 regularization
3. Implement AdamW from scratch
4. State the warmup + cosine LR schedule formula
5. Explain why gradient clipping helps
6. Implement a complete (small) training loop using PyTorch
7. Generate text from a trained model with temperature and top-p sampling

Seven outcomes. The exercises will hit outcomes 1, 3, 4, and 6 directly.

**This chapter is the project's center of gravity for "training side."** Ch 9-10 scale it up; Ch 13-16 post-train it; Ch 17 deploys it. But the core mechanics are here.
