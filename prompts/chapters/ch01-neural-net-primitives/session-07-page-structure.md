# Session 07 — Chapter 1 page structure

> First chapter session in the project. Takes the research file for Chapter 1 ("Neural network primitives") and produces the actual MDX page. Writes ~5500 words of prose across 8 sections with all equations, callouts, and runnable code; leaves placeholder `<WidgetFrame>` blocks where the marquee backprop visualizer (session 08) and other interactive widgets (sessions 09–10) will be wired in.

---

## Read first (in this order)

These are mandatory context files for this session:

1. **`research/ch01-neural-net-primitives/research.md`** — the source material. Every equation, every code snippet, every misconception in this session's output should trace back to a corresponding entry here. **This is the primary reference.**
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience, forbidden phrases, intellectual honesty stance
3. **`context/CURRICULUM.md`** — for Ch 1's locked scope and word target
4. **`context/DESIGN_SYSTEM.md`** — for the Callout types, Equation/EqRef usage, WidgetFrame conventions
5. **`prompts/scaffolding/session-03-mdx-content-pipeline.md`** — to understand the MDX components you'll be using
6. **`prompts/scaffolding/session-04-layout-and-navigation.md`** — to understand `ChapterLayout` (which renders the chapter eyebrow + h1 + description automatically; this MDX file starts at h2)

If anything in this prompt contradicts the research file, the research file wins (it's the curated source material; this prompt is the production plan).

---

## Goal

Replace the placeholder `index.astro` with a full `index.mdx` Chapter 1 page. By end of session:

- `src/pages/ch01-neural-net-primitives/index.mdx` exists with full prose, equations, code blocks, and widget placeholders
- `src/pages/ch01-neural-net-primitives/index.astro` is **deleted** (replaced)
- `src/lib/chapters.ts` has Ch 1's status flipped from `'planned'` to `'draft'` (full `'published'` flip happens in session 10 after widgets are wired)
- The chapter renders end-to-end at `/ch01-neural-net-primitives/`: sidebar shows Ch 1 active (not disabled), TOC populates, prev/next nav shows the right adjacent chapters, page is readable and substantive

The page won't be feature-complete — three `<WidgetFrame>` blocks contain placeholder content awaiting sessions 08–10. That's expected. The acceptance bar for this session is: a reader could read the chapter and learn from it, even if the widgets are stubbed.

---

## Inputs

State of the repo at start of this session:

- All Phase 1 + Phase 2 scaffolding complete; site is live at `llm-tutorial.darvinyi.com`
- `src/pages/ch01-neural-net-primitives/index.astro` is a placeholder using `ChapterLayout` with stub content
- `src/lib/chapters.ts` has all 30 chapters as `'planned'`
- `research/ch01-neural-net-primitives/research.md` exists with curated source material

---

## Deliverables

1. **Delete** `src/pages/ch01-neural-net-primitives/index.astro`
2. **Create** `src/pages/ch01-neural-net-primitives/index.mdx` — full chapter prose with widget placeholders
3. **Update** `src/lib/chapters.ts` — change Ch 1's `status` field from `'planned'` to `'draft'`

**Do not modify** any other file. The chapter layout, components, and scaffolding are owned by earlier sessions and stay untouched.

---

## Detailed spec

### Frontmatter

The `.mdx` file starts with this frontmatter exactly:

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch01-neural-net-primitives
description: The math and code of neural network primitives — affine maps, activations, gradient descent, backpropagation, and the autograd computational graph. Implemented in numpy from scratch.
---
```

**Notes:**
- `layout` uses a relative path because MDX frontmatter doesn't resolve `@/` aliases
- `slug` matches the folder name and the entry in `chapters.ts`
- `description` is rendered automatically by `ChapterLayout` as the kicker paragraph below the h1

### Imports

Directly after the frontmatter, import the components the chapter uses:

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` automatically renders the "Chapter 1" eyebrow + "Neural network primitives" h1 + description. The MDX file's first content is the opening prose — no h2 yet.

**Target:** 2-3 short paragraphs (~150 words). Establishes:
- What this chapter is doing in the context of LLMs (we're building the toolkit before we touch attention)
- Why numpy from scratch (so the autograd of PyTorch isn't magic later)
- The pacing: math first, code second, intuition throughout

**Sample opening** (the chapter author should rewrite in their voice, but this is the target tone):

> Before we can build a transformer, we need to be able to build any neural network. Before we can build any neural network, we need four things: a way to combine inputs (the affine map), a way to break linearity (the activation), a way to measure wrongness (the loss), and a way to fix the wrongness (gradient descent).
>
> The next twenty-something chapters of this tutorial will use these four things constantly. This chapter is the part where we build them in numpy, by hand, so that nothing in PyTorch feels magic later.
>
> The reader who already has these primitives in their bones can skim to Chapter 2. The reader who hasn't computed a backward pass by hand recently should slow down here — what we build here is what every transformer training loop is doing underneath the autograd.

### Section 1: Affine + activation

**Heading:** `## Affine + activation`
**Word target:** ~600
**Sub-heading:** `### The two building blocks` (or similar)

**Teaching beats:**
1. The affine map $y = Wx + b$ is the only way information moves between layers
2. Without an activation function, a stack of affine maps would collapse to a single affine map ($W_2(W_1 x + b_1) + b_2 = W' x + b'$). Show this collapse explicitly.
3. The nonlinearity is what gives a network expressive power
4. ReLU is the default activation for hidden layers in modern networks; introduce it with the math
5. Brief mention of the activation zoo (sigmoid, tanh, GELU, SiLU) — the chapter doesn't go deep on the alternatives; pointers to Ch 5 for GELU in transformer FFNs
6. Bias term: include it. Usually starts at zero.

**Required equation** (use `<Equation>`):

$$y = Wx + b, \quad W \in \mathbb{R}^{m \times n}, \; b \in \mathbb{R}^m$$

**Required callout** — type `aside`, placed at end of section, mentioning that modern transformers often *omit* biases in attention projections for memory/efficiency reasons but keep them in FFN. Citation: any modern transformer code; the LLaMA architecture is a common reference.

**No code in this section.** The chapter doesn't need numpy yet — the math is the point.

**Connection forward:** end the section gesturing toward "but a network is more than one affine + activation; it's a stack of them. To train the stack, we need to know how wrong it is."

### Section 2: Loss functions

**Heading:** `## Measuring wrongness — loss functions`
**Word target:** ~500

**Teaching beats:**
1. The model produces predictions; we need a scalar measure of how wrong they are
2. **MSE for regression:** $L = \frac{1}{B} \sum_b (y_b - \hat{y}_b)^2$. Simple, intuitive, what you'd guess.
3. **Cross-entropy for classification:** more nuanced. When predictions are probability distributions, MSE doesn't work well (saturates).
4. CE formula: $L = -\sum_i y_i \log p_i$ where $y$ is one-hot, $p = \softmax(\text{logits})$
5. Why CE matters specifically: it's what every LLM training loop minimizes when predicting the next token
6. Brief mention: the gradient of CE w.r.t. logits is unreasonably clean ($p - y$). We'll derive this in section 4. Tease the result.

**Required equations** (both via `<Equation>`):

$$L_{\text{MSE}} = \frac{1}{B} \sum_{b=1}^{B} (y_b - \hat{y}_b)^2$$

$$L_{\text{CE}} = -\sum_{i} y_i \log p_i, \quad p = \softmax(z)$$

**Required code:** small `<RunnableCode>` showing stable softmax + cross-entropy, with sample logits and a target:

```python
import numpy as np

def softmax(z, axis=-1):
    z = z - z.max(axis=axis, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=axis, keepdims=True)

def cross_entropy(logits, target_class):
    p = softmax(logits)
    return -np.log(p[target_class])

logits = np.array([2.5, 1.0, -0.5, 3.2])
print("probs:  ", softmax(logits).round(3))
print("CE if target=3:", cross_entropy(logits, 3).round(3))
print("CE if target=0:", cross_entropy(logits, 0).round(3))
```

**Connection forward:** the loss tells us *how wrong*. Now we need *how to fix it*.

### Section 3: Gradient descent

**Heading:** `## Walking downhill — gradient descent`
**Word target:** ~700
**Sub-headings:** `### One parameter at a time`, `### Many parameters at once`

**Teaching beats:**
1. Use the "walking downhill in fog" analogy from `research.md`. Each step: feel the slope at your feet, step in the steepest-downhill direction.
2. The gradient $\nabla L$ is the multivariable generalization of "slope at your feet" — it points in the direction of steepest ascent. So we step in $-\nabla L$.
3. The update rule: $\theta \leftarrow \theta - \alpha \nabla_\theta L$
4. Learning rate $\alpha$: too big = overshoot; too small = forever. This is a real hyperparameter, not a knob you ignore.
5. One parameter at a time first: imagine $L(\theta) = \theta^2$. The gradient is $2\theta$. The update halves $\theta$ each step (for $\alpha = 0.5$). Show this converging to zero.
6. Generalize to many parameters: gradient is a vector with one component per parameter. Each parameter updates independently using its own partial derivative.
7. Mini-batch SGD: in practice we don't compute the gradient over the full dataset (too slow); we estimate it on a mini-batch. The estimate is noisy but cheap.

**Required equation** (via `<Equation label="1.gd">`):

$$\theta_{t+1} = \theta_t - \alpha \nabla_\theta L(\theta_t)$$

**Required code:** small `<RunnableCode>` showing 1D gradient descent converging:

```python
import numpy as np

# Minimize L(theta) = (theta - 3)^2 starting from theta = 0
theta = 0.0
lr = 0.1
for step in range(20):
    grad = 2 * (theta - 3)         # dL/dtheta
    theta = theta - lr * grad
    if step % 4 == 0:
        loss = (theta - 3) ** 2
        print(f"step {step:2d}  theta={theta:.4f}  loss={loss:.4f}")
```

**Required callout** — type `note`, after the code: mention that the choice of $\alpha = 0.1$ here is benign. Try $\alpha = 1.0$ in the runnable code (overshoots and oscillates). Try $\alpha = 1.5$ (diverges to infinity). This is the kind of thing readers should poke at.

**Connection forward:** we have a way to update one parameter given its gradient. Now we need to compute gradients efficiently for *all* the parameters of a neural network. Enter backprop.

### Section 4: Backpropagation

**Heading:** `## Backpropagation — the chain rule, applied carefully`
**Word target:** ~1200 (the longest section)
**Sub-headings:** `### The chain rule, scalar form`, `### The computational graph`, `### The cross-entropy gradient (and why it's clean)`, `### Matrix form for a 2-layer MLP`

**Teaching beats:**
1. Pose the problem: a deep network is a composition $f_n \circ f_{n-1} \circ \dots \circ f_1$. To do gradient descent on each parameter, we need $\partial L / \partial \theta_k$ for every layer.
2. Naive approach: compute each partial derivative independently. Cost: $O(\text{layers}^2)$.
3. Backprop: use the chain rule to share work across layers. Cost: $O(\text{layers})$.
4. Build the chain rule in scalar form first. $L = f(g(\theta))$, $\partial L / \partial \theta = f'(g(\theta)) \cdot g'(\theta)$. Walk through a toy example with $f$ and $g$ as specific functions.
5. **The computational graph:** introduce as a DAG. Use the recipe analogy from research.md. Forward pass = execute the recipe. Backward pass = trace back, asking "how did each ingredient affect the final dish?"
6. Reverse-mode autodiff: traverse the graph in reverse topological order, accumulating gradients. This is what every framework's `.backward()` does under the hood.
7. **Cross-entropy gradient derivation:** the full step-by-step from `research.md` Derivation 1. Each step gets its own equation block. End with the boxed result $\partial L / \partial z_j = p_j - y_j$.
8. **Matrix form for a 2-layer MLP:** the shapes-annotated backward pass from `research.md` Derivation 3. Walk through every gradient with shape annotations.

**Required equations:**

- Chain rule scalar: $\frac{\partial L}{\partial \theta} = \frac{\partial L}{\partial g} \cdot \frac{\partial g}{\partial \theta}$
- Softmax-CE result (labeled): use `<Equation label="1.ce-grad">` so the next section can `<EqRef id="1.ce-grad" />`
- Multiple equations for the matrix form — each one with shape annotation

**Required callout** — type `insight`, placed before the matrix-form section: explain *why* the CE gradient is so clean. The cross-entropy + softmax pairing isn't an accident; it's specifically designed so the gradient through the softmax doesn't have to be computed separately. Frameworks like PyTorch fuse them into `cross_entropy_with_logits` for this reason — both for efficiency and numerical stability.

**Required widget placeholder:** the marquee Ch 1 widget — the backprop visualizer. Session 08 fills this in. For now, place a `<WidgetFrame>` with a clear placeholder:

```mdx
<WidgetFrame title="Backprop through a 2-layer MLP" caption="Animated trace of the forward and backward pass through a small MLP. Hover over any operation to see the gradient flowing through it.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 08
  </div>
</WidgetFrame>
```

This placeholder uses the WidgetFrame chrome (matching the final widget's visual home) but with stub interior. Session 08 replaces the inner `<div>` with the actual widget content.

**No code block in this section** — the matrix-form gradients are dense enough; readers don't need code on top yet. Code arrives in section 5.

**Connection forward:** we have the math. Now let's run it.

### Section 5: The MLP end-to-end

**Heading:** `## Putting it together — an MLP in numpy`
**Word target:** ~800
**Sub-headings:** `### Forward pass`, `### Backward pass`, `### Training on a toy task`

**Teaching beats:**
1. The full MLP class from `research.md` reference implementation. Walk the reader through it.
2. Show forward pass first: just the affine + ReLU + affine + softmax pipeline. Note where intermediate values are cached (for backward).
3. Backward pass: implements Derivation 3. Each line corresponds to one of the gradient equations from section 4.
4. Training loop: the 60-second toy task from `research.md` — classifying 2D points by quadrant. Set up the data, instantiate the MLP and optimizer, train 500 steps, watch accuracy reach >95%.
5. The widget after the code: animated loss curve as the model trains. Session 09 owns this widget.

**Required code:** the full MLP + Adam + training loop from `research.md` reference implementations, as a single substantial `<RunnableCode>` block:

```python
import numpy as np

def softmax(z, axis=-1):
    z = z - z.max(axis=axis, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=axis, keepdims=True)

def relu(x):
    return np.maximum(0, x)

def relu_grad(x):
    return (x > 0).astype(x.dtype)

class MLP:
    def __init__(self, d_in, d_h, d_out, seed=42):
        rng = np.random.default_rng(seed)
        self.W1 = rng.normal(0, np.sqrt(2.0 / d_in),  size=(d_in, d_h))
        self.b1 = np.zeros(d_h)
        self.W2 = rng.normal(0, np.sqrt(2.0 / d_h),   size=(d_h, d_out))
        self.b2 = np.zeros(d_out)

    def forward(self, x):
        self.x  = x
        self.z1 = x @ self.W1 + self.b1
        self.a1 = relu(self.z1)
        self.z2 = self.a1 @ self.W2 + self.b2
        return self.z2

    def backward(self, y_true):
        B, K = self.z2.shape
        p = softmax(self.z2)
        y_onehot = np.eye(K)[y_true]
        dz2 = (p - y_onehot) / B
        dW2 = self.a1.T @ dz2
        db2 = dz2.sum(axis=0)
        da1 = dz2 @ self.W2.T
        dz1 = da1 * relu_grad(self.z1)
        dW1 = self.x.T @ dz1
        db1 = dz1.sum(axis=0)
        return dW1, db1, dW2, db2

# Toy task: classify 2D points by quadrant (4 classes)
rng = np.random.default_rng(0)
N = 1000
x_data = rng.normal(0, 1, size=(N, 2))
y_data = ((x_data[:, 0] > 0).astype(int) +
          (x_data[:, 1] > 0).astype(int) * 2)

mlp = MLP(d_in=2, d_h=16, d_out=4, seed=42)
lr = 0.05
for step in range(500):
    idx = rng.integers(0, N, size=64)
    xb, yb = x_data[idx], y_data[idx]
    logits = mlp.forward(xb)
    grads = mlp.backward(yb)
    # Simple SGD update
    for p, g in zip([mlp.W1, mlp.b1, mlp.W2, mlp.b2], grads):
        p -= lr * g
    if step % 50 == 0:
        pred = logits.argmax(axis=-1)
        acc = (pred == yb).mean()
        # Recompute loss for logging
        p_full = softmax(logits)
        loss = -np.log(p_full[np.arange(len(yb)), yb] + 1e-12).mean()
        print(f"step {step:3d}  loss {loss:.4f}  acc {acc:.2%}")
```

**Required callout** — type `note`, placed after the code: explain that this uses plain SGD (no momentum, no Adam) intentionally. Section 7 introduces the better optimizers. SGD works on this toy task; on a real LLM, it would be painfully slow.

**Required widget placeholder:** the training-curves visualization. Session 09 fills this in.

```mdx
<WidgetFrame title="Training curves — SGD vs Momentum vs Adam" caption="Same MLP, same data, three optimizers. Note how Adam reaches lower loss faster but isn't always best at the end.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 09
  </div>
</WidgetFrame>
```

**Connection forward:** we built an MLP. We trained it. There are subtle but important details we glossed over — initialization and optimizers — that matter exponentially as networks get deep. Next two sections cover those.

### Section 6: Initialization

**Heading:** `## Initialization — why it matters more than you think`
**Word target:** ~400

**Teaching beats:**
1. The MLP above used He initialization without comment. Now explain why.
2. The variance-preservation argument: if input activations have variance $\sigma^2$, what should the weight variance be so that output activations also have variance $\sigma^2$?
3. Without principled init: a deep network's activations either vanish to zero or explode to infinity within a few layers. Training breaks before it begins.
4. **Glorot/Xavier:** $W \sim \mathcal{N}(0, 2/(n_{\text{in}} + n_{\text{out}}))$ — designed for symmetric activations (tanh, sigmoid)
5. **He/Kaiming:** $W \sim \mathcal{N}(0, 2/n_{\text{in}})$ — the factor of 2 accounts for ReLU killing half the activations
6. Modern networks (transformers included) use He for ReLU-family activations. Don't overthink it.
7. Brief mention: there's a long literature on initialization variants (orthogonal, fixup, Lecun). For a tutorial focus on LLMs, He init is the answer 99% of the time.

**Required equations:**

$$W \sim \mathcal{N}\!\left(0, \frac{2}{n_{\text{in}} + n_{\text{out}}}\right) \quad \text{(Glorot)}$$

$$W \sim \mathcal{N}\!\left(0, \frac{2}{n_{\text{in}}}\right) \quad \text{(He)}$$

**Required callout** — type `warning`: misconception MC6 from research.md. "Initialization barely matters; the network will figure it out." Wrong. With bad init at depth 100, the network never trains. With good init, it trains fine. Init matters exponentially with depth.

**No code block.** The MLP above already uses He; no new code needed.

### Section 7: Beyond SGD — momentum, Adam, AdamW

**Heading:** `## Better optimizers — momentum, Adam, AdamW`
**Word target:** ~800
**Sub-headings:** `### Momentum`, `### Adam`, `### AdamW`

**Teaching beats:**
1. **Plain SGD limitation:** the gradient of a mini-batch is a noisy estimate of the true gradient. SGD takes each step at face value, even when it's mostly noise.
2. **Momentum:** average gradient estimates over time. Mathematically: $v_t = \mu v_{t-1} + g_t$, update $\theta \leftarrow \theta - \alpha v_t$. Acts like physics — gradients accumulate velocity in consistent directions.
3. **Adam (Kingma & Ba 2014):** maintains two moments per parameter. First moment = mean of gradients (momentum). Second moment = mean of squared gradients (per-parameter learning-rate scaling). Adaptive: parameters with consistently large gradients get scaled-down updates; quiet parameters get scaled-up updates.
4. Show the Adam update formula explicitly. Mention bias correction (without it, the first ~100 steps are off-scale).
5. Adam is the default for transformer training. AdamW is the production variant.
6. **AdamW (Loshchilov & Hutter 2017):** the subtle but consequential change. Weight decay should be applied to the parameter directly, not as L2 regularization in the gradient. The difference matters in adaptive optimizers — see the misconception in `research.md` MC3.
7. Don't go deep on AdamW math. The conceptual point ("decay separately from gradient") matters more.

**Required equations:**

Momentum update via `<Equation>`:

$$v_t = \mu v_{t-1} + g_t, \quad \theta_{t} = \theta_{t-1} - \alpha v_t$$

Adam update via `<Equation>` (from `research.md`):

$$m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2$$
$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \quad \hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$
$$\theta_t = \theta_{t-1} - \alpha \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

(can be one big `<Equation>` block with all four lines, or separate.)

**Required callout** — type `aside`: AdamW's weight decay coupling with learning rate schedules. One sentence: since weight decay is applied with the learning rate as the scale factor, weight decay automatically follows the LR schedule (smaller decay at the end of training when LR warms down). Some implementations decouple this; most don't.

**Required code:** the Adam class from `research.md` reference implementations, as a `<RunnableCode>` showing it minimizing a Rosenbrock-like function or extending the toy task from section 5:

```python
import numpy as np

class Adam:
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8):
        self.params = params
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

# Minimize a simple 2D function to visualize Adam's behavior
# f(x, y) = x^2 + 10 * y^2  — elongated bowl
params = [np.array([5.0, 5.0])]
opt = Adam(params, lr=0.1)
for step in range(50):
    x, y = params[0]
    grad = np.array([2 * x, 20 * y])
    opt.step([grad])
    if step % 10 == 0:
        loss = x**2 + 10 * y**2
        print(f"step {step:2d}  x={params[0][0]:6.3f}  y={params[0][1]:6.3f}  loss={loss:.4f}")
```

### Section 8: Autograd — how this generalizes

**Heading:** `## Autograd — the computational graph in production`
**Word target:** ~600

**Teaching beats:**
1. The MLP above hard-codes backward. For every new model architecture, we'd have to derive backward by hand. That doesn't scale to transformers.
2. Autograd automates this: as the forward pass runs, the system records a computational graph. When `loss.backward()` is called, the graph is traversed in reverse, applying each operation's known gradient formula.
3. Show Karpathy's micrograd structure: a `Value` class with `.data`, `.grad`, `._backward` closure, `._prev` parents, `._op` label. Operations build the graph by combining existing `Value` objects into new ones.
4. The chain rule applied locally: each operation knows its own backward formula. The engine composes them via topological sort.
5. Use the recipe analogy: forward pass = run the recipe, backward pass = trace through the recipe in reverse.
6. **Autograd is not symbolic differentiation.** This is misconception MC1 from research.md — important callout here.
7. Brief mention: PyTorch, JAX, TensorFlow all implement this idea. PyTorch is "eager mode" (graph built dynamically each forward pass). JAX is "trace then compile." TensorFlow has both modes.
8. Forward reference to Ch 5+: from here on, the tutorial uses PyTorch. The numpy-from-scratch was for understanding what PyTorch is doing.

**Required code:** a minimal autograd implementation, ~30 lines (much shorter than micrograd but capturing the essence):

```python
import math

class Value:
    """A single scalar value with autograd support — micrograd-style."""

    def __init__(self, data, _children=(), _op=''):
        self.data = data
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)
        self._op = _op

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), '+')
        def _backward():
            self.grad  += 1.0 * out.grad
            other.grad += 1.0 * out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), '*')
        def _backward():
            self.grad  += other.data * out.grad
            other.grad += self.data  * out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0, self.data), (self,), 'relu')
        def _backward():
            self.grad += (1.0 if self.data > 0 else 0.0) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        # Topological sort + reverse traversal
        topo, visited = [], set()
        def build(v):
            if v in visited: return
            visited.add(v)
            for child in v._prev: build(child)
            topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo): v._backward()

# A tiny computation: L = (x * w + b).relu()
x = Value(2.0)
w = Value(-3.0)
b = Value(1.0)
L = (x * w + b).relu()
L.backward()
print(f"L = {L.data}")
print(f"dL/dx = {x.grad}, dL/dw = {w.grad}, dL/db = {b.grad}")
```

**Required callout** — type `insight`: misconception MC1 from research.md. Autograd doesn't manipulate the expression "$x^2$" to get "$2x$" symbolically. It records that "we computed `x * x` with `x = 1.7`" and applies the chain rule numerically. The graph stores numerical operations on specific values, not algebraic expressions.

**Required widget placeholder:** session 10 may add an interactive autograd-graph exercise. Stub:

```mdx
<WidgetFrame title="Walk the computational graph" caption="Click through a small forward pass; then walk the backward pass step by step.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 10
  </div>
</WidgetFrame>
```

### Chapter close

After the autograd section, a short closing (~150 words):

**Teaching beats:**
- What we built: affine + activation, loss, gradient descent, backprop, init, optimizers, autograd
- What's next: Chapter 2 is about turning words into vectors that a network can consume — embeddings
- Tease: the same backprop machinery we just built will train those embeddings end-to-end with the model. Embeddings are just parameters that happen to live at the input boundary.

**Sample close** (rewrite in chapter voice):

> Every transformer's training loop is doing what we just did, scaled up. The affine maps become attention projections and FFN layers. The activations become GELU and SiLU. The loss stays cross-entropy (because we're predicting the next token, which is classification over the vocabulary). Backprop stays the same algorithm. Adam — usually AdamW — stays the optimizer. Initialization stays He.
>
> What changes is the model architecture. Specifically, in chapters 4–6, the attention mechanism takes center stage. But before we can talk about attention, we need to talk about how words become vectors.
>
> See you in Chapter 2.

---

### Update `src/lib/chapters.ts`

Find the entry for chapter 1 and change `status: 'planned'` to `status: 'draft'`. Specifically the line:

```ts
{ num: 1, slug: 'ch01-neural-net-primitives', title: 'Neural network primitives', partNum: 1, status: 'planned' },
```

becomes:

```ts
{ num: 1, slug: 'ch01-neural-net-primitives', title: 'Neural network primitives', partNum: 1, status: 'draft' },
```

**Status meaning:**
- `'planned'` — chapter doesn't exist; sidebar shows it disabled
- `'draft'` — chapter exists but isn't widget-complete; sidebar links to it; landing CTA does NOT activate
- `'published'` — chapter is complete; landing CTA activates (`getFirstPublishedChapter()` returns it)

Session 10 will flip Ch 1 to `'published'` at the end of Phase 3.

### Delete the placeholder

```bash
rm src/pages/ch01-neural-net-primitives/index.astro
```

The directory `src/pages/ch01-neural-net-primitives/` remains — it now contains `index.mdx`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch01-neural-net-primitives/`** renders with:
   - Chapter eyebrow ("Chapter 1") + h1 ("Neural network primitives") + description at top
   - 8 h2 sections in the order listed above
   - All equations rendered correctly via KaTeX (no raw `$...$`)
   - 4 runnable code blocks (sections 2, 3, 5, 7, 8 — actually let me recount: 2, 3, 5, 7, 8 = 5 code blocks; verify in your output)
   - Each `<RunnableCode>` block has working "Run" button that executes Python via Pyodide
   - 3 `<WidgetFrame>` placeholders with stub content (sessions 08, 09, 10 will fill)
   - At least 5 callouts spread through the chapter (mix of note/warning/aside/insight types)
   - TOC on the right (≥1280px) shows all 8 sections plus subsections
   - Active section highlighting in TOC works as you scroll
3. **Sidebar:** Ch 1 is shown as **active** (not dimmed) — confirms `status` was flipped to `'draft'`. Other 29 chapters still appear dimmed.
4. **Landing page CTA:** still shows "Chapters coming soon" because no chapter is yet `'published'` (Ch 1 is `'draft'`). This is intentional.
5. **Prev/next nav at bottom of Ch 1:** prev = none (Ch 1 is first); next = "Embeddings & representation" rendered as disabled card (still `'planned'`).
6. **Word count:** total prose between section opens and section closes is between 5000 and 6500 words. Use a simple estimator: count words in the MDX file excluding the frontmatter, imports, and code blocks. (Tools: `wc -w` after stripping non-prose; or use any online word counter.)
7. **`npm run typecheck`** passes.
8. **`npm run build`** completes. `dist/ch01-neural-net-primitives/index.html` exists.
9. **`src/pages/ch01-neural-net-primitives/index.astro`** no longer exists.

---

## Out of scope

- ❌ **Do not implement the backprop visualizer widget.** Session 08 owns it.
- ❌ **Do not implement the training-curves visualization.** Session 09.
- ❌ **Do not implement the autograd-graph exercise.** Session 10 (and it may end up being a smaller widget or omitted).
- ❌ **Do not flip Ch 1's status to `'published'`.** Session 10 owns that at end of Phase 3.
- ❌ **Do not write exercises.** Session 10 adds a final "Exercises" section.
- ❌ **Do not add chapter-specific React components beyond `<RunnableCode>`** in this session. Reuse only what `@components/content` and `@components/code` provide.
- ❌ **Do not write content beyond Ch 1.** Each chapter is its own set of sessions.
- ❌ **Do not modify any layout, styling, or scaffolding file.** Phases 1–2 sealed those.

---

## Wire-up

After all acceptance criteria pass:

```bash
git add src/pages/ch01-neural-net-primitives/index.mdx src/lib/chapters.ts
git rm src/pages/ch01-neural-net-primitives/index.astro
git commit -m "session 07: Chapter 1 prose — 8 sections, equations, code, widget placeholders"
git push origin main
```

Visit the production URL (Vercel auto-deploys). Read through the chapter on a phone and on a desktop. Verify:
- Mobile: prose is readable; runnable code blocks render OK; widget placeholders don't break layout
- Desktop: TOC populates and follows scroll; sidebar shows Ch 1 active; cyan accents are visible but not overwhelming

If anything feels off, fix it now — sessions 08–10 will inherit whatever shape the chapter is in after this session.

The next session (`session-08-backprop-visualizer.md`) assumes:
- The `.mdx` file at `src/pages/ch01-neural-net-primitives/index.mdx` exists with the placeholder `<WidgetFrame title="Backprop through a 2-layer MLP">` exactly as specified above
- Section 4's prose is in place and section 8 will be replaced when its widget lands

---

## Notes for the session author

**On voice:** the project voice is sparse, technical, calm. No second-person hectoring ("Now you will see..."). No overpromising ("This will change how you think about deep learning"). The reader is treated as a capable adult learning a technical subject — explain clearly, cite carefully, don't sell.

**On equations:** prefer `<Equation>` for display equations. Inline math (`$E = mc^2$`) is for short expressions you can read in a sentence. Long expressions on their own line go in `<Equation>`. If you want to reference an equation later, give it a label.

**On code:** every `<RunnableCode>` block must work when the reader clicks Run. The numbers in print statements should be reproducible (we use deterministic seeds). Don't show code that hangs or errors as a "feature" — if you want to show error behavior, use a separate `<RunnableCode>` clearly framed as "this fails."

**On callouts:** four types (note, warning, aside, insight) — use them deliberately. Note = supplementary detail. Warning = correction of a common misconception. Aside = tangent the reader can skip. Insight = the key takeaway of a section. Don't use insight for everything; it loses impact.

**On widget placeholders:** the `<WidgetFrame>` stub still uses the real WidgetFrame component with `title` and `caption` — so the chapter looks 95% complete even with the inside replaced by a stub. Sessions 08–10 swap the inner `<div>` for the real React component.

**On word counts:** these are targets, not hard limits. If a section needs 700 words instead of 600 to land, take the 700. If it lands in 450, don't pad. The total should land roughly between 5000-6500; outside that range, reconsider.

**On the chapter's pedagogical job:** by the time a reader finishes Ch 1, they should be able to (1) explain the chain rule applied to a 2-layer MLP, (2) write the forward and backward pass in numpy from memory, (3) describe what Adam does differently from SGD, (4) explain why autograd is not symbolic differentiation. These are the four acceptance criteria for the reader's understanding, even though the chapter prose can't directly test for them.

**If you hit content that feels marginal** (interesting but not on the critical path to those four outcomes), cut it. Chapter 1 sets the precedent for chapters 2–30 — being disciplined here pays back across the tutorial.

This is the first chapter session. The chapter that comes out of it sets the bar for the rest. Take your time.
