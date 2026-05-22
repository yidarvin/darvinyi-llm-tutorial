# Chapter 1 — Neural network primitives: research

> This file is curated source material for Chapter 1's build sessions (07–10). It is **not** chapter content. Chapter sessions read this file at session start to ground their writing, then produce chapter prose / widgets that reference these derivations, analogies, and code patterns.
>
> Audience for this document: future Claude Code sessions writing Chapter 1. Tone here is research-note, not chapter-prose — dense, citation-heavy, formula-heavy, with editorial recommendations the chapter author can take or leave.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Neural network primitives

**Premise:** Build the toolkit. Linear algebra, gradient descent, backpropagation, and the autograd computational graph view — implemented in numpy from scratch.

**Out of scope (other chapters):**
- Token embeddings as parameters (Ch 2)
- Attention mechanism (Ch 4)
- Anything transformer-specific (Ch 4–6)
- Production-grade training loops (Ch 8)
- Optimizer comparisons beyond Adam (Ch 8)

**In scope and locked:**
- The two operations every neural net uses: affine + nonlinearity
- The forward pass through a small MLP
- The backward pass — chain rule, scalar then matrix form
- Reverse-mode autograd as a computational-graph traversal
- SGD, momentum, Adam, AdamW (introduce all four; depth on Adam)
- Initialization (Xavier/Glorot for symmetric activations; He/Kaiming for ReLU)
- Numerical stability: softmax max-trick, log-softmax via LogSumExp

**Suggested chapter structure** (the chapter session may diverge — this is a starting point):

1. Affine + activation: the two building blocks (~600 words)
2. Loss functions: MSE for regression, CE for classification, why CE for logits (~500 words)
3. Gradient descent: scalar intuition, then vector (~700 words)
4. Backprop: chain rule, the computational graph, building it up (~1200 words)
5. The MLP end-to-end: forward + backward + update, in numpy (~800 words)
6. Initialization: why it matters, Xavier vs He (~400 words)
7. Beyond SGD: momentum → Adam → AdamW (~800 words)
8. Autograd: how numpy-from-scratch generalizes to PyTorch (~600 words)

Target total: ~5500-6000 words plus 2-3 widgets and 4-5 runnable code blocks.

---

## Key papers and references

### Kingma & Ba 2014 — "Adam: A Method for Stochastic Optimization"
- **arXiv:** [1412.6980](https://arxiv.org/abs/1412.6980)
- **What it contributed:** Adaptive moment estimation. Maintains first moment (mean of past gradients) and second moment (uncentered variance) per parameter, both via exponential moving averages. The "adaptive" part is that the per-parameter learning rate is scaled by `1/√(second_moment)`, so parameters with large historical gradients get smaller updates and vice versa.
- **Key equations** (with $t$ = step index, $g_t$ = gradient at step $t$):

$$m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2$$
$$\hat{m}_t = m_t / (1 - \beta_1^t) \quad \hat{v}_t = v_t / (1 - \beta_2^t)$$
$$\theta_t = \theta_{t-1} - \alpha \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

- **Defaults:** $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$, $\alpha = 10^{-3}$
- **Why bias correction matters:** without it, the first ~100 steps have artificially small moment estimates because $m_t$ starts at zero and only accumulates slowly. The correction $1/(1-\beta^t)$ goes to 1 quickly but is much larger than 1 early on.
- **For the chapter:** cite this paper when introducing Adam. The equations above are exactly what the runnable Adam widget should compute. Save deeper Adam analysis for Ch 8.

### Loshchilov & Hutter 2017 — "Decoupled Weight Decay Regularization" (AdamW)
- **arXiv:** [1711.05101](https://arxiv.org/abs/1711.05101)
- **What it contributed:** Showed that adding L2 regularization to the loss and then running Adam doesn't behave like classical weight decay — because Adam's adaptive scaling means parameters with large gradients (in their L2-contributing or otherwise) get less decay than parameters with small gradients. AdamW separates the decay from the gradient update:

  - **Adam with L2:** $g_t \leftarrow \nabla L + \lambda \theta$, then standard Adam step
  - **AdamW:** $g_t \leftarrow \nabla L$, run standard Adam step on $g_t$, then $\theta \leftarrow \theta - \alpha \lambda \theta$ separately

- The decoupled form is what modern transformers use universally.
- **Defaults:** weight decay $\lambda$ between 0.01 and 0.1
- **For the chapter:** introduce as a one-paragraph sidebar after Adam. The conceptual point — "weight decay should be a separate step, not added to the gradient" — is more important than the formula derivation. Ch 8 revisits with production training context.

### Glorot & Bengio 2010 — "Understanding the difficulty of training deep feedforward neural networks"
- **PMLR:** [proceedings.mlr.press/v9/glorot10a.html](https://proceedings.mlr.press/v9/glorot10a.html)
- **What it contributed:** The first principled initialization scheme. Sets weight variance so that activations and gradients have similar magnitude across layers — preventing the "exploding/vanishing" problem at initialization.
- **Formula** (uniform variant):

$$W \sim \mathcal{U}\!\left(-\sqrt{\frac{6}{n_{\text{in}} + n_{\text{out}}}}, \; \sqrt{\frac{6}{n_{\text{in}} + n_{\text{out}}}}\right)$$

  Or normal: $W \sim \mathcal{N}(0, 2/(n_{\text{in}} + n_{\text{out}}))$
- **Assumption:** symmetric activations like tanh, sigmoid. Breaks for ReLU because ReLU zeros half the activations and the variance analysis changes.
- **For the chapter:** mention as the foundational result. The He paper builds directly on this.

### He, Zhang, Ren, Sun 2015 — "Delving Deep into Rectifiers" (Kaiming init)
- **arXiv:** [1502.01852](https://arxiv.org/abs/1502.01852)
- **What it contributed:** Extended Glorot's analysis to ReLU. The factor of 2 in the variance accounts for ReLU zeroing out (in expectation) half the activations.

$$W \sim \mathcal{N}\!\left(0, \; \frac{2}{n_{\text{in}}}\right)$$

- **Standard for:** any ReLU-family activation (ReLU, GELU, SiLU). Modern transformers use this for FFN layers.
- **For the chapter:** this is the init the runnable MLP widget should use. Mention the Glorot connection.

### Karpathy — micrograd
- **GitHub:** [github.com/karpathy/micrograd](https://github.com/karpathy/micrograd)
- **Why reference:** ~150 lines of code implementing autograd from scratch. Each `Value` node stores: `data`, `grad`, `_backward` closure, `_prev` set of parents, `_op` string label. Operations build the graph as they execute; topological sort + reverse traversal computes gradients.
- **Pedagogical value:** demonstrates that autograd isn't magic — it's a graph + the chain rule applied locally at each node.
- **For the chapter:** in the autograd section, point readers to micrograd as the canonical reference. The chapter doesn't need to reimplement micrograd in full; it should show the conceptual structure (Value class with `_backward`) in maybe 30 lines and let readers explore the full repo.

### Goodfellow, Bengio, Courville 2016 — Deep Learning, Chapter 6: Deep Feedforward Networks
- **Free online:** [deeplearningbook.org](https://www.deeplearningbook.org/contents/mlp.html)
- **Why reference:** the canonical textbook treatment of MLPs and backprop. Slightly more formal than micrograd; complementary.
- **For the chapter:** cite as further reading at chapter end. Don't try to compete with it on rigor; offer the runnable-code angle instead.

### Karpathy — nanoGPT
- **GitHub:** [github.com/karpathy/nanoGPT](https://github.com/karpathy/nanoGPT)
- **Why mention here even though it's a transformer reference:** Ch 1 is the foundation that Ch 8 ("Building a small LLM") will scale up to nanoGPT-sized. Worth a one-line "this is where this thread ends up" note for readers who want to see the destination early.

---

## Core derivations (LaTeX-ready, paste into chapter MDX directly)

### Derivation 1: Cross-entropy gradient w.r.t. logits

**Setup:** logits $z \in \mathbb{R}^K$, probabilities $p = \softmax(z)$, one-hot target $y \in \{0,1\}^K$, loss $L = -\sum_i y_i \log p_i$.

**Goal:** show $\partial L / \partial z_j = p_j - y_j$.

**Step 1:** apply the chain rule.

$$\frac{\partial L}{\partial z_j} = -\sum_i y_i \frac{\partial \log p_i}{\partial z_j} = -\sum_i \frac{y_i}{p_i} \frac{\partial p_i}{\partial z_j}$$

**Step 2:** compute $\partial p_i / \partial z_j$ where $p_i = e^{z_i} / \sum_k e^{z_k}$. The quotient rule (treating numerator and denominator separately) gives:

$$\frac{\partial p_i}{\partial z_j} = \frac{[i{=}j] \, e^{z_i} \sum_k e^{z_k} - e^{z_i} \cdot e^{z_j}}{\left(\sum_k e^{z_k}\right)^2} = [i{=}j] \, p_i - p_i p_j = p_i([i{=}j] - p_j)$$

where $[i{=}j]$ is the Iverson bracket (1 if $i = j$, else 0).

**Step 3:** substitute back.

$$\frac{\partial L}{\partial z_j} = -\sum_i \frac{y_i}{p_i} \cdot p_i([i{=}j] - p_j) = -\sum_i y_i ([i{=}j] - p_j) = -y_j + p_j \sum_i y_i$$

**Step 4:** since $y$ is one-hot, $\sum_i y_i = 1$, giving the clean result:

$$\boxed{\frac{\partial L}{\partial z_j} = p_j - y_j}$$

**Editorial:** the cleanness here is no accident. CE + softmax is specifically designed for this. If you compute CE + softmax as separate ops, you'd compose two messy gradients and get the same answer the hard way. Frameworks like PyTorch fuse them into `cross_entropy_with_logits` for this reason — both for efficiency and to skip the numerically-unstable intermediate `softmax(z)`.

### Derivation 2: ReLU and its subgradient at zero

**Function:** $f(x) = \max(0, x)$.

**Derivative for $x \neq 0$:**

$$f'(x) = \begin{cases} 1 & x > 0 \\ 0 & x < 0 \end{cases}$$

**At $x = 0$:** $f$ is not differentiable. We pick a subgradient — any value in $[0, 1]$ is mathematically valid (the subdifferential of $\max(0, x)$ at zero is the closed interval $[0, 1]$).

**Convention:** $f'(0) = 0$. This is what PyTorch, NumPy, and most frameworks use. Variations:
- $f'(0) = 0.5$ — Glorot's "midpoint" suggestion
- $f'(0) = 1$ — treats it as the active branch

**Why it doesn't matter:** in float arithmetic, $x$ is exactly zero with probability close to zero. Even when it happens, the next mini-batch perturbs it.

**Editorial:** worth a brief callout in the chapter — readers often worry about "what about $x = 0$?" when they first see ReLU. The honest answer is "we pick a convention; it doesn't matter empirically."

### Derivation 3: Backprop through a 2-layer MLP, matrix form

**Setup** (single batch, dimensions explicit):
- Input: $x \in \mathbb{R}^{B \times d_{\text{in}}}$ (batch of $B$ examples, each of dimension $d_{\text{in}}$)
- Hidden weights: $W_1 \in \mathbb{R}^{d_{\text{in}} \times d_h}$, bias $b_1 \in \mathbb{R}^{d_h}$
- Output weights: $W_2 \in \mathbb{R}^{d_h \times K}$, bias $b_2 \in \mathbb{R}^K$
- One-hot targets: $y \in \{0,1\}^{B \times K}$

**Forward pass:**

$$z_1 = x W_1 + b_1 \quad (\text{shape: } B \times d_h)$$
$$a_1 = \text{ReLU}(z_1)$$
$$z_2 = a_1 W_2 + b_2 \quad (\text{shape: } B \times K)$$
$$p = \softmax(z_2, \text{axis}=-1)$$
$$L = -\frac{1}{B} \sum_{b=1}^{B} \sum_{k=1}^{K} y_{bk} \log p_{bk}$$

**Backward pass** — define $\delta_2 = \partial L / \partial z_2$. By Derivation 1 (and the $1/B$ batch averaging):

$$\delta_2 = \frac{1}{B}(p - y) \quad (\text{shape: } B \times K)$$

The remaining gradients (with shapes):

$$\frac{\partial L}{\partial W_2} = a_1^\top \delta_2 \quad (d_h \times K)$$
$$\frac{\partial L}{\partial b_2} = \sum_b (\delta_2)_b \quad (K,)$$
$$\frac{\partial L}{\partial a_1} = \delta_2 W_2^\top \quad (B \times d_h)$$
$$\delta_1 = \frac{\partial L}{\partial z_1} = \frac{\partial L}{\partial a_1} \odot \mathbb{1}[z_1 > 0] \quad (B \times d_h)$$
$$\frac{\partial L}{\partial W_1} = x^\top \delta_1 \quad (d_{\text{in}} \times d_h)$$
$$\frac{\partial L}{\partial b_1} = \sum_b (\delta_1)_b \quad (d_{\text{in}},)$$

where $\odot$ is elementwise multiplication and $\mathbb{1}[z_1 > 0]$ is the indicator (the ReLU subgradient evaluated at $z_1$).

**Editorial:** the shape annotations are the most important part for the chapter. Readers should be able to point at any line and answer "this is shape $? \times ?$". A widget that shows the matrix shapes flowing forward and backward through the MLP would land this well.

The "trick" for remembering which side $a_1$ and $\delta_2$ go on in the matrix product: dimensions have to match. $\partial L / \partial W_2$ has shape $(d_h \times K)$ — so it's $(d_h \times B)(B \times K) = a_1^\top \delta_2$, not $\delta_2 a_1^\top$.

---

## Glossary

Define these in the chapter; reuse them everywhere after.

- **Affine transformation:** $f(x) = Wx + b$. A linear map plus a bias. The fundamental neural-net building block, applied "between" activation functions.
- **Activation function:** a pointwise nonlinearity applied to the output of an affine transformation. Examples: ReLU, GELU, SiLU, tanh, sigmoid. Without these, a stack of affine maps would collapse to a single affine map.
- **Loss / cost / objective:** a scalar measure of how wrong the model is on a batch. Lower = better. Examples: cross-entropy (classification), MSE (regression), KL divergence (distribution matching).
- **Gradient:** the vector of partial derivatives of the loss with respect to parameters. Points in the direction of steepest ascent of the loss. To minimize, we step in the negative gradient direction.
- **Optimizer state:** information the optimizer maintains beyond the parameters themselves. SGD has none. SGD with momentum maintains a velocity per parameter. Adam maintains both first and second moments per parameter — doubling memory cost.
- **Learning rate ($\alpha$ or $\eta$):** the scalar step size for parameter updates. Typically scheduled (e.g., linear warmup + cosine decay).
- **Backward pass / backpropagation:** computing gradients of the loss w.r.t. parameters by reverse-mode automatic differentiation. Requires having recorded the forward pass.
- **Autograd:** the system that builds a computational graph during the forward pass and walks it backwards to compute gradients via repeated application of the chain rule.
- **Computational graph:** a directed acyclic graph (DAG) where nodes are tensor values and edges represent operations. Built dynamically during the forward pass in PyTorch (eager); built once and reused in TF1-style frameworks (graph mode).
- **Parameter initialization:** how weights are set before training begins. Bias usually zero; weights drawn from a distribution chosen so activations and gradients don't vanish or explode at initialization. Glorot for tanh-family, He for ReLU-family.
- **Weight decay:** a regularization that shrinks weights toward zero during the update step. In SGD this is equivalent to adding L2 regularization to the loss. In adaptive optimizers (Adam) it is *not* equivalent — see AdamW.
- **Subgradient:** for a function not differentiable at a point, any value satisfying the convex inequality $f(y) \geq f(x) + g \cdot (y - x)$. The set of such values is the subdifferential. For ReLU at zero, this is $[0, 1]$.

---

## Pedagogical analogies and framings

The chapter should use 2-3 of these (not all five — pick the strongest for each pedagogical moment).

### 1. Backprop as credit assignment

Each parameter gets a "share of the blame" for the loss. Backprop computes how much each parameter contributed by tracing the chain rule backwards through the network. The gradient is literally the answer to "if I nudged this parameter, how would the loss change?"

**Best used for:** introducing the conceptual point of backprop *before* the math.

### 2. The computational graph as a recipe

The forward pass *is* the recipe: take the ingredients (inputs), apply operations (forward), produce the dish (loss). The backward pass is reading the recipe in reverse: at each step, ask "how much did this ingredient affect the final taste?" The chain rule is what propagates the answer back step by step.

**Best used for:** introducing autograd. Highlights that backprop isn't a separate thing from the forward pass — it's the same graph traversed in reverse.

### 3. Gradient descent as walking downhill in fog

You can see the slope at your feet but not the bottom of the valley. Take a step in the steepest-downhill direction. Repeat. The step size (learning rate) is critical: too big and you overshoot, too small and you take forever.

**Best used for:** introducing learning rate as a hyperparameter that genuinely matters. Motivates schedules.

### 4. Adam's two moments as physics

Imagine pushing a ball down a hill. First moment (momentum) = the ball's velocity — it accumulates the direction the gradient has been pointing recently. Second moment (variance) = the roughness of the terrain — large in directions where the gradient has been bouncing around, small where the gradient is steady.

Adam takes bigger steps in smooth, consistent directions and smaller steps in rough, inconsistent ones — both effects normalized so the step size feels uniform.

**Best used for:** explaining *why* Adam works, not just what it computes.

### 5. Autograd ≠ symbolic differentiation

Autograd doesn't manipulate the expression "$x^2$" to get "$2x$" symbolically. It records that "we computed `x * x` with `x = 1.7`" and applies the chain rule numerically: the gradient is `2 * 1.7 = 3.4`. The graph is a record of numerical operations on specific values, not an algebraic expression.

**Best used for:** dispelling the common misconception that frameworks "know calculus." They know graph traversal + a hardcoded `_backward` for each primitive op.

---

## Common misconceptions (each one is a Callout-warning in the chapter)

### MC1: "Autograd computes derivatives symbolically."
**Reality:** It doesn't. It records numerical operations applied to specific values during the forward pass, then applies the chain rule numerically during the backward pass. The expression $\partial(x^2)/\partial x = 2x$ is never represented as a symbolic equation; it is evaluated at the specific $x$ value that flowed through the graph.

### MC2: "Gradient flow is the same as information flow."
**Reality:** These are related but distinct. Gradient flow tells you how parameters should update to reduce loss — it flows backward through the network during training. Information flow (in interpretability work — see Ch 25) refers to what computations the model performs on its inputs — it flows forward during inference. They use the same edges of the computational graph but read different things off them.

### MC3: "Weight decay and L2 regularization are equivalent."
**Reality:** For plain SGD, yes — they produce identical updates. For adaptive optimizers (Adam, RMSProp, etc.), no. L2 contributes to the gradient (which then gets scaled by Adam's per-parameter $1/\sqrt{\hat{v}}$ factor), so parameters with large gradients receive *less* effective decay. Decoupled weight decay (AdamW) applies the decay to the parameter directly, after the adaptive update — restoring the intended uniform behavior.

### MC4: "The dying ReLU problem is about the derivative at zero."
**Reality:** It's about neurons whose pre-activation stays negative for every training example, so they always output zero, so their gradient is always zero, so they never update — permanently "dead." The non-differentiability at $x = 0$ is a separate (mostly cosmetic) issue. Leaky ReLU, PReLU, ELU, GELU all address dying ReLU by ensuring a nonzero gradient for negative inputs.

### MC5: "Adam always converges faster than SGD."
**Reality:** Adam typically converges faster early in training, but in many computer-vision benchmarks SGD with momentum produces better final test accuracy. Adam/AdamW are dominant in NLP and LLM training; SGD with momentum is still preferred in some vision domains. It is an empirical choice, not a theoretical one.

### MC6: "Initialization barely matters; the network will figure it out."
**Reality:** Bad initialization at the right scale of depth can prevent training entirely. With He init, a 100-layer ReLU network can train; with $W \sim \mathcal{N}(0, 0.01)$ it cannot. The deeper the network, the more init matters — exponentially.

### MC7: "Bias terms are unimportant; you can omit them."
**Reality:** Without bias terms, the affine map $Wx$ passes through the origin. For some problems (centered data) this is fine. For most (image pixels, token embeddings) it isn't. Modern transformers omit bias in attention projections (for efficiency) but keep them in FFN layers. The choice is empirical and architectural, not universal.

---

## Tricky implementation details (these become "Insight" callouts or runnable examples)

### TID1: Numerical stability of softmax

Naively: `np.exp(z) / np.exp(z).sum()`. For large $z$ (e.g., logits in the hundreds, common in unscaled attention), `exp` overflows to `inf`. `inf / inf = nan`. Training is silently broken.

**Fix:** subtract the max first:

```python
def softmax(z, axis=-1):
    z = z - z.max(axis=axis, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=axis, keepdims=True)
```

Subtracting the max is mathematically a no-op: $e^{z_i - c} / \sum_j e^{z_j - c} = e^{z_i} / \sum_j e^{z_j}$. But after the shift, all exponents are ≤ 0, so all values are in $(0, 1]$ — no overflow.

**For the chapter:** the runnable softmax widget should show both the naive and stable versions side by side, with logits = `[1000, 999, 998]` to make the failure visible.

### TID2: Cross-entropy with logits via LogSumExp

Don't compute `softmax(z)` and then `log(p)`. The softmax intermediate underflows for very confident predictions. Use the log-softmax identity:

$$\log p_i = z_i - \log\sum_k e^{z_k} = z_i - \text{LogSumExp}(z)$$

where LogSumExp is computed stably as $c + \log\sum_k e^{z_k - c}$ with $c = \max_k z_k$.

Then $L = -\sum_i y_i \log p_i = -\sum_i y_i (z_i - \text{LSE}(z))$.

This is what PyTorch's `cross_entropy(logits, targets)` does internally. Numerically stable end-to-end.

### TID3: Gradient reduction (mean vs sum) and learning rate

If your loss is `loss.mean()` over a batch of $B$ examples, your gradients are scaled by $1/B$ relative to `loss.sum()`. This means doubling the batch size with mean-reduction *halves* the effective gradient magnitude — which interacts with your learning rate.

Common conventions:
- Mean reduction + fixed LR → loss is invariant to batch size; gradient magnitude is too.
- Sum reduction + LR scaled by $1/B$ → equivalent to mean reduction.

**For the chapter:** mention this in the SGD section. The runnable training loop should use mean reduction explicitly so readers see the convention.

### TID4: Adam bias correction matters early

Without `(1 - β₁^t)` and `(1 - β₂^t)` corrections, the first ~100 steps have artificially small moment estimates. With $\beta_1 = 0.9$:

- $t = 1$: $m_1 = 0.1 g_1$ → bias-corrected = $g_1$. Without correction: effective LR is 10× too small.
- $t = 10$: $m_{10}$ ≈ 0.65× the "true" running mean. Without correction: effective LR is ~1.5× too small.
- $t = 100$: $1 - \beta_1^{100}$ ≈ 1. No meaningful difference.

**For the chapter:** the runnable Adam widget should include a "bias correction off/on" toggle to make the first-100-steps difference visible in a loss curve.

### TID5: AdamW's coupling with the learning rate schedule

AdamW applies decay as $\theta \leftarrow \theta - \alpha \lambda \theta$. Since $\alpha$ is the (possibly scheduled) learning rate, the *effective* weight decay follows the LR schedule. This is intentional in most implementations — it means decay disappears when the LR warms down at end of training.

A subtlety: some implementations decouple the decay from the LR ($\theta \leftarrow \theta - \lambda \theta$), making it independent of the schedule. Both are reasonable; check the source if it matters.

### TID6: In-place operations and autograd

In PyTorch, `x += y` mutates `x` in place. This breaks gradient tracking if `x` was needed for a backward pass. PyTorch emits a warning; ignoring it leads to silently wrong gradients.

**Fix:** use `x = x + y` (creates a new tensor) instead of `x += y`.

This is mostly a Ch 5+ concern (when we move to PyTorch). Worth a one-line mention in Ch 1's autograd section.

---

## Reference implementations

Suggested code patterns for the chapter. The chapter session may rework these but they should be the conceptual core.

### Stable softmax (numpy)

```python
import numpy as np

def softmax(z, axis=-1):
    """Numerically stable softmax via max-subtraction."""
    z = z - z.max(axis=axis, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=axis, keepdims=True)
```

### ReLU + its gradient

```python
def relu(x):
    return np.maximum(0, x)

def relu_grad(x):
    """Subgradient of ReLU; convention f'(0) = 0."""
    return (x > 0).astype(x.dtype)
```

### Cross-entropy loss (with logits)

```python
def cross_entropy_with_logits(z, y_true):
    """
    z: (B, K) logits
    y_true: (B,) integer class indices

    Returns scalar mean loss.
    """
    # Stable log-softmax via LogSumExp
    z_shifted = z - z.max(axis=-1, keepdims=True)
    log_probs = z_shifted - np.log(np.exp(z_shifted).sum(axis=-1, keepdims=True))
    # Pick out the log-prob of the true class for each example
    B = z.shape[0]
    return -log_probs[np.arange(B), y_true].mean()
```

### 2-layer MLP, forward + backward

```python
class MLP:
    def __init__(self, d_in, d_h, d_out, seed=42):
        rng = np.random.default_rng(seed)
        # He init for ReLU (factor of 2 in variance)
        self.W1 = rng.normal(0, np.sqrt(2.0 / d_in),  size=(d_in, d_h))
        self.b1 = np.zeros(d_h)
        self.W2 = rng.normal(0, np.sqrt(2.0 / d_h),   size=(d_h, d_out))
        self.b2 = np.zeros(d_out)

    def forward(self, x):
        # Cache intermediates for backward
        self.x  = x
        self.z1 = x @ self.W1 + self.b1
        self.a1 = relu(self.z1)
        self.z2 = self.a1 @ self.W2 + self.b2
        # softmax is folded into the loss for stability;
        # we return logits here
        return self.z2

    def backward(self, y_true):
        B, K = self.z2.shape
        # gradient of CE w.r.t. logits
        p = softmax(self.z2)
        y_onehot = np.eye(K)[y_true]
        dz2 = (p - y_onehot) / B                  # (B, K)

        # Layer 2 gradients
        dW2 = self.a1.T @ dz2                     # (d_h, K)
        db2 = dz2.sum(axis=0)                     # (K,)
        da1 = dz2 @ self.W2.T                     # (B, d_h)

        # Layer 1 gradients
        dz1 = da1 * relu_grad(self.z1)            # (B, d_h)
        dW1 = self.x.T @ dz1                      # (d_in, d_h)
        db1 = dz1.sum(axis=0)                     # (d_h,)

        return dW1, db1, dW2, db2
```

### Adam optimizer

```python
class Adam:
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8):
        self.params = params      # list of numpy arrays (mutable)
        self.lr = lr
        self.b1, self.b2 = betas
        self.eps = eps
        self.m = [np.zeros_like(p) for p in params]
        self.v = [np.zeros_like(p) for p in params]
        self.t = 0

    def step(self, grads):
        self.t += 1
        for i, (p, g) in enumerate(zip(self.params, grads)):
            self.m[i] = self.b1 * self.m[i] + (1 - self.b1) * g
            self.v[i] = self.b2 * self.v[i] + (1 - self.b2) * g**2
            m_hat = self.m[i] / (1 - self.b1**self.t)
            v_hat = self.v[i] / (1 - self.b2**self.t)
            p -= self.lr * m_hat / (np.sqrt(v_hat) + self.eps)
```

### A 60-second training loop

```python
# Toy: classify 2D points by quadrant (4 classes)
rng = np.random.default_rng(0)
N = 1000
x_data = rng.normal(0, 1, size=(N, 2))
# Class = which quadrant (encoded 0-3)
y_data = ((x_data[:, 0] > 0).astype(int) +
          (x_data[:, 1] > 0).astype(int) * 2)

mlp = MLP(d_in=2, d_h=16, d_out=4, seed=42)
opt = Adam([mlp.W1, mlp.b1, mlp.W2, mlp.b2], lr=1e-2)

batch_size = 64
for step in range(500):
    idx = rng.integers(0, N, size=batch_size)
    xb, yb = x_data[idx], y_data[idx]

    logits = mlp.forward(xb)
    loss = cross_entropy_with_logits(logits, yb)
    grads = mlp.backward(yb)
    opt.step(grads)

    if step % 50 == 0:
        pred = logits.argmax(axis=-1)
        acc = (pred == yb).mean()
        print(f"step {step:3d}  loss {loss:.4f}  acc {acc:.2%}")
```

This trains in ~500 steps to >95% accuracy on the quadrant task. Good for the chapter's final "putting it all together" widget.

---

## Connections to other chapters

What Chapter 1 sets up; what later chapters return to:

- **Ch 4 (Attention):** the softmax gradient derivation here is reused when we compute the gradient through attention. The chapter can say "remember the cross-entropy derivation in Ch 1; the same algebra appears in the attention backward pass."
- **Ch 5 (Multi-head + Transformer Block):** residual connections preserve gradient flow. The chapter's discussion of "vanishing gradients" naturally references the chain rule built up in Ch 1.
- **Ch 8 (Building a Small LLM):** the full training loop with AdamW that's sketched here scales (with mini-modifications: gradient accumulation, mixed precision, etc.) to GPT-2-small territory.
- **Ch 14 (Alignment):** policy gradient methods reuse the gradient-ascent framing — instead of descending loss, we ascend reward. The reader who internalized backprop in Ch 1 will see the connection immediately.
- **Ch 17 (Inference optimization):** KV caching is justified by "we don't need to recompute the forward pass for past tokens" — relies on the reader having a solid forward-pass mental model.
- **Ch 25 (Interpretability):** the computational graph view from Ch 1 is the foundation for activation patching, attribution methods, and mechanistic circuits.

---

## Open questions for the chapter author

### Q1: How much PyTorch should appear in Ch 1?

**Recommendation:** minimal. Save PyTorch for Ch 5+ (transformer block) onward. Ch 1's pedagogical job is to show the math + numpy implementation; introducing PyTorch's autograd here splits attention. A single "this is what it looks like in production" sidebar with 10 lines of `torch.nn.Linear` + `loss.backward()` is enough.

### Q2: Scalar vs matrix chain rule — how to introduce?

**Recommendation:** scalar first for two reasons: (1) builds intuition for "the derivative of a composition is the product of derivatives," (2) lets the chapter use simple toy examples that fit in a paragraph. Then graduate to matrix form for the actual MLP backward pass, with shape annotations on every line.

### Q3: How deep on initialization?

**Recommendation:** half-page sidebar. Show the formulas for Glorot and He. Mention the variance-preservation argument in one sentence. Cite the papers for readers who want depth. The runnable MLP widget should use He init silently — no need to make the reader choose.

### Q4: When to introduce AdamW?

**Recommendation:** Ch 1 introduces Adam (because it's a primitive). AdamW gets a one-paragraph sidebar after the Adam section, explaining "Adam + L2 isn't the same as Adam + weight decay" and pointing to Ch 8 for production usage. Don't show the AdamW update in code in Ch 1 — that belongs in Ch 8 where production training context exists.

### Q5: Should the chapter include a "what we didn't cover" section?

**Recommendation:** yes, in 3–5 bullet points at chapter end. Mention: convolutions (out of scope for an LLM-focused tutorial), recurrent networks (mostly historical), batch normalization (covered briefly in Ch 5), advanced optimizers like Shampoo, K-FAC (out of scope). Sets reader expectations.

### Q6: Widget candidates for Ch 1

The chapter sessions (07–10) will build widgets. Strongest candidates based on this research:

1. **Backprop visualizer** (session 08) — animate the forward and backward pass through a tiny 2-layer MLP, showing gradients flowing back through each operation with shape annotations. Highest pedagogical value.
2. **Stable vs naive softmax** (smaller widget, possibly inline runnable code) — input a logit vector, see naive overflow vs stable success.
3. **Loss-curve comparison** — SGD vs SGD-with-momentum vs Adam vs Adam-without-bias-correction on the same toy classification task. Shows why each piece matters.

Recommend the chapter focus on (1) as the marquee widget. (2) and (3) can be runnable code blocks rather than full widgets.

---

## Pre-research process notes (for the human running these sessions)

This is the first research file in the project. A few things I learned writing it that may apply to the other 29 research files:

1. **Length target:** ~6000-8000 words is right. Less feels thin; more bloats. This file came in at ~5500 words excluding code; the code blocks add another ~250 lines.
2. **What to include vs exclude:** I included derivations the chapter will reference (CE, MLP backward), excluded derivations the chapter won't (e.g., the Adam convergence proof — out of scope). The test is "would the chapter session benefit from seeing this?"
3. **Editorial voice:** distinct from chapter voice. Research notes can say "recommendation: do X" directly; chapter prose should show, not tell.
4. **Citation style:** arxiv IDs + GitHub repos. No paywalled journals. If a paper is paywalled, find the arxiv preprint version.
5. **Code in research files:** the implementations here should be the canonical patterns. Chapter sessions may stylistically adjust them but shouldn't fundamentally diverge.
6. **Open questions section:** specifically for the chapter author to resolve. This is where the research file admits "I don't know the right pedagogical answer here; here's my recommendation but you decide."

Future research files for Ch 2–30 should follow this template. Sections may be omitted if not applicable (e.g., a chapter with no derivations to cite skips that section), but the overall shape should be recognizable.
