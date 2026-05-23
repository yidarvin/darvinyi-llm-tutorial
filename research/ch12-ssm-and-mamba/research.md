# Chapter 12 — State-space models and Mamba: research

> Curated source material for Chapter 12's build sessions. The second (and last) chapter of Phase 10. Where Ch 11 (MoE) replaced the transformer's *FFN* with a sparse mixture, Ch 12 replaces the transformer's *attention* with state-space modeling. **State-space models (SSMs)** view a sequence as the trajectory of a continuous-time linear dynamical system; **Mamba** (2023) adds input-dependent dynamics to make SSMs competitive with attention. The architectural bet: attention's $O(N^2)$ cost is the bottleneck holding back long-context LLMs; if we replace it with linear-time recurrence, we trade some expressiveness for dramatic efficiency. Single-topic chapter — uses the **4-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** State-space models and Mamba

**Premise:** Attention is $O(N^2)$ in memory and compute. For long sequences (32K+ tokens), this is the dominant cost. Several research lines have proposed sub-quadratic alternatives — linear attention, recurrent networks, retention. The **state-space model** family (S4, S5, Mamba, Mamba-2) emerged as the most successful: linear-time inference, constant-memory per token, competitive quality. Mamba (Gu & Dao, Dec 2023) made SSMs production-viable. Mamba-2 (May 2024) connected SSMs to transformers, showing they're variants of the same framework.

**Out of scope (other chapters):**
- MoE / sparse models (Ch 11)
- Post-training (Ch 13+)
- Inference optimization for transformers (Ch 17 — KV cache, paged attention)

**In scope and locked:**
- **Why sub-quadratic alternatives matter**: attention's cost at long contexts
- **State-space models in continuous time**: $h'(t) = A h(t) + B x(t)$, $y(t) = C h(t)$
- **Discretization**: continuous → discrete recurrence
- **Linear recurrence ↔ convolution duality**: SSMs can run as a recurrence (linear in $N$) OR as a convolution (parallelizable, FFT-able)
- **S4 (Gu et al. 2022)**: structured SSMs with HiPPO initialization
- **Selective SSM (Mamba, S6)**: input-dependent $\bar{A}, \bar{B}, \bar{C}$ parameters
- **Hardware-aware selective scan**: the parallel scan algorithm Mamba uses on GPUs
- **Mamba block**: replacing attention with selective SSM + gating
- **Mamba-2**: SSD (state-space duality) — connecting SSMs to attention
- **Hybrid models**: Jamba, Mamba-Transformer mixes
- **Trade-offs vs attention**: where SSMs win and lose

**Suggested chapter structure** (8 sections):

1. The setup — attention's $O(N^2)$ problem (~400 words)
2. SSMs in continuous time — the dynamical systems view (~600 words)
3. Discretization — making SSMs computable (~600 words)
4. The recurrence-convolution duality (~500 words)
5. From S4 to Mamba — selectivity (~700 words — central concept)
6. The selective scan — hardware-aware parallelism (~600 words)
7. Mamba in practice — block structure, hybrids (~500 words)
8. Trade-offs — where SSMs win and lose (~400 words)

Target: ~4300 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Gu et al. 2020 — "HiPPO: Recurrent Memory with Optimal Polynomial Projections"
- **arXiv:** [2008.07669](https://arxiv.org/abs/2008.07669)
- **What it contributed:** **HiPPO** (High-order Polynomial Projection Operators) — a principled way to compress sequence history into a fixed-size state. Gives a specific $A$ matrix (HiPPO-LegS) that's near-optimal for "remembering" past inputs as Legendre polynomial coefficients.
- **Why it matters:** HiPPO is the theoretical foundation for S4. Without HiPPO, SSMs work poorly on long-range dependencies.
- **For the chapter:** brief reference. Pedagogically, "HiPPO gives us the right $A$ matrix" is enough.

### Gu et al. 2022 — "Efficiently Modeling Long Sequences with Structured State Spaces" (S4)
- **arXiv:** [2111.00396](https://arxiv.org/abs/2111.00396)
- **What it contributed:** **S4** — the first practical SSM for language. Demonstrated long-range performance using HiPPO initialization + diagonal+low-rank structure for $A$. Beat transformers on Long Range Arena benchmark.
- **For the chapter:** the canonical pre-Mamba SSM. Cite when introducing SSMs.

### Gu & Dao 2023 — "Mamba: Linear-Time Sequence Modeling with Selective State Spaces"
- **arXiv:** [2312.00752](https://arxiv.org/abs/2312.00752)
- **What it contributed:** **Mamba** — adds **selectivity** to SSMs. The transition parameters $\bar{A}, \bar{B}$ become functions of the input $x_t$, letting the model dynamically forget/remember based on content. This was the breakthrough that made SSMs competitive with attention on language modeling.
- **For the chapter:** the central reference. Mamba is the running example.

### Dao & Gu 2024 — "Transformers are SSMs: Generalized Models and Efficient Algorithms Through Structured State Space Duality"
- **arXiv:** [2405.21060](https://arxiv.org/abs/2405.21060)
- **What it contributed:** **Mamba-2** — reformulates selective SSMs in a way that reveals their connection to attention. Both are special cases of a more general "Structured State Space Duality" framework. Mamba-2 is also significantly faster (~2-8× speedup) than Mamba on modern GPUs.
- **For the chapter:** central reference for the "SSMs vs attention" comparison. Worth a dedicated subsection.

### Lieber et al. 2024 — "Jamba: A Hybrid Transformer-Mamba Language Model"
- **arXiv:** [2403.19887](https://arxiv.org/abs/2403.19887)
- **What it contributed:** **Jamba** — production hybrid model interleaving Mamba and Transformer layers (with MoE!). Demonstrates that pure-Mamba isn't optimal — hybrid architectures often win.
- **For the chapter:** central reference for the "hybrid" theme. Modern frontier SSM-based models are nearly all hybrids.

### Smith et al. 2023 — "Simplified State Space Layers for Sequence Modeling" (S5)
- **arXiv:** [2208.04933](https://arxiv.org/abs/2208.04933)
- **What it contributed:** **S5** — simplified S4 using parallel scans instead of FFT-based convolution. Foundational for Mamba's selective scan.
- **For the chapter:** brief reference. S5's parallel scan is the algorithmic precursor to Mamba's selective scan.

### Peng et al. 2023 — "RWKV: Reinventing RNNs for the Transformer Era"
- **arXiv:** [2305.13048](https://arxiv.org/abs/2305.13048)
- **What it contributed:** **RWKV** — a different sub-quadratic alternative. Linear attention with time-decay; can be trained like a transformer and run like an RNN. Competitive with similar-scale transformers.
- **For the chapter:** brief mention as an alternative sub-quadratic family. SSMs are one branch; RWKV is another.

---

## Core derivations

### Derivation 1: The continuous-time SSM

A linear time-invariant SSM is defined by four matrices:

$$h'(t) = A h(t) + B x(t)$$
$$y(t) = C h(t) + D x(t)$$

where:
- $x(t) \in \mathbb{R}$ is the input at time $t$ (a single scalar for now; vector inputs handled per-channel)
- $h(t) \in \mathbb{R}^N$ is the **state** — a fixed-size vector that "summarizes" the input history
- $y(t) \in \mathbb{R}$ is the output
- $A \in \mathbb{R}^{N \times N}, B \in \mathbb{R}^{N \times 1}, C \in \mathbb{R}^{1 \times N}, D \in \mathbb{R}$ are learned parameters

**The state $h(t)$ has constant dimension $N$ regardless of how long the sequence is.** This is the entire reason SSMs are linear in sequence length: a single fixed-size state carries all history.

The continuous formulation is mathematically clean but not directly useful for computers — we need a discrete version.

### Derivation 2: Discretization

To apply an SSM to discrete tokens $x_1, x_2, \ldots, x_T$, we discretize the continuous system using a step size $\Delta$ (which can be a learned parameter).

**Zero-order hold (ZOH) discretization:**
$$\bar{A} = \exp(\Delta A), \quad \bar{B} = (\Delta A)^{-1}(\exp(\Delta A) - I) \cdot \Delta B$$

Then the discrete recurrence is:
$$h_t = \bar{A} h_{t-1} + \bar{B} x_t$$
$$y_t = C h_t + D x_t$$

**This is just an RNN.** The state $h_t$ evolves via a linear function of the previous state plus the input. **But the structure (linear, no nonlinearity in the recurrence) makes it special.** Linear recurrences have powerful properties unavailable to standard RNNs.

```mdx
<Equation label="12.ssm">
$$h_t = \bar{A} h_{t-1} + \bar{B} x_t, \quad y_t = C h_t$$
</Equation>
```

(The $D x_t$ "skip connection" is omitted for clarity; it's a residual.)

### Derivation 3: The recurrence-convolution duality

The discrete SSM recurrence $h_t = \bar{A} h_{t-1} + \bar{B} x_t$ unrolls to:

$$h_t = \sum_{i=0}^{t} \bar{A}^{t-i} \bar{B} x_i$$

So:
$$y_t = C h_t = \sum_{i=0}^{t} C \bar{A}^{t-i} \bar{B} x_i = \sum_{i=0}^{t} \bar{K}_{t-i} x_i$$

where $\bar{K}_j = C \bar{A}^j \bar{B}$ is the **kernel**.

**This is a convolution.** The SSM can be computed two ways:
1. **As a recurrence**: $O(N \cdot \text{state\_dim})$ per token, sequential. Good for inference (one token at a time).
2. **As a convolution**: $O(N \log N)$ overall via FFT, parallelizable. Good for training (process the whole sequence at once).

**This duality is the magic of SSMs.** Same model, two implementations. Choose the right one for your workload.

### Concept: S4 — structured state spaces

S4 (Gu et al. 2022) introduced practical SSMs with three key structural choices:

1. **HiPPO initialization for $A$**: a specific matrix structure (HiPPO-LegS) that initializes the state to "compress" the input history optimally as Legendre polynomial coefficients. Without HiPPO, SSMs fail to model long-range dependencies.

2. **Diagonal+low-rank $A$**: enforce $A$ to be diagonalizable (specifically, "DPLR" — diagonal plus low-rank). Reduces the cost of computing $\bar{A}^t$ from $O(N^3)$ to $O(N)$ for diagonal cases.

3. **FFT-based convolution**: for the convolution mode, S4 uses FFT to compute the kernel $\bar{K}$ efficiently for very long sequences.

**Limitation of S4**: the parameters $\bar{A}, \bar{B}, \bar{C}$ are **fixed for the whole sequence**. The SSM can't "focus" on specific tokens or "ignore" irrelevant ones — its dynamics are content-independent. This is why S4, despite long-range capability, fell short of transformers on language modeling.

### Concept: Mamba — selective SSMs

Mamba (Gu & Dao, Dec 2023) added **selectivity**: the SSM parameters $\bar{A}, \bar{B}, \bar{C}, \Delta$ become functions of the input $x_t$:

$$\bar{B}_t = \text{Linear}_B(x_t), \quad \bar{C}_t = \text{Linear}_C(x_t), \quad \Delta_t = \text{softplus}(\text{Linear}_\Delta(x_t))$$

(The matrix $A$ is kept fixed; only the discretized $\bar{A}_t = \exp(\Delta_t A)$ varies via $\Delta_t$.)

The recurrence becomes input-dependent:

$$h_t = \bar{A}_t h_{t-1} + \bar{B}_t x_t$$

**What this buys**:
- **Selective forgetting**: when $\Delta_t$ is large for "useful" inputs, the state strongly updates with $x_t$; when $\Delta_t$ is small for "irrelevant" inputs, the state is unchanged.
- **Content-dependent dynamics**: $\bar{B}_t$ and $\bar{C}_t$ change with input, so different tokens are encoded into and read out from state differently.

**The cost**: selectivity breaks the convolution mode. With time-varying $\bar{A}_t, \bar{B}_t$, the system is no longer time-invariant, so there's no fixed kernel. **Mamba can only run as a recurrence.**

This is where the **selective scan** algorithm comes in.

### Concept: The selective scan — hardware-aware parallelism

A naive recurrence is sequential — token $t$ depends on token $t-1$. For 2048-token sequences this would be very slow.

**The selective scan** is a parallel algorithm for linear recurrences. Key insight: even though $h_t$ depends on $h_{t-1}$, the *sequence* of states $h_0, h_1, \ldots, h_T$ can be computed in parallel using a *prefix-sum-like* algorithm.

For a recurrence $h_t = \bar{A}_t h_{t-1} + \bar{B}_t x_t$, define the "tuple" $(A_t, B_t x_t)$. The composition operator is:
$$(A_2, b_2) \circ (A_1, b_1) = (A_2 A_1, A_2 b_1 + b_2)$$

This is **associative**. Associative operations can be computed via **parallel scan** (Blelloch-style) in $O(\log T)$ depth with $O(T)$ work.

**Hardware-aware implementation**: Mamba's selective scan is implemented with a custom CUDA kernel that:
1. Keeps the state $h$ in **SRAM** (not HBM) during the scan
2. Fuses the input projection, scan, and output projection into one kernel
3. Recomputes activations during backward (memory savings)

This is the "hardware-aware" part of Mamba — the algorithm only became practical with a custom GPU kernel. Similar to FlashAttention (Ch 10): the math was known; the engineering made it useful.

### Concept: The Mamba block

The Mamba block replaces a transformer block. Its structure:

```
input x
  │
  ├──→ Linear (expand) ──→ activation ──→ SSM ──→ ┐
  │                                                │
  └──→ Linear (expand) ──→ activation ────────────→ × (gating) ──→ Linear (project back) ──→ output
```

Key differences from a transformer block:
1. **No attention** — replaced by the selective SSM
2. **No separate FFN** — the gating mechanism plays a similar expressivity role
3. **Wider intermediate dim** — typically $2d$ to compensate for the simpler architecture

**Parameter count**: Mamba blocks have *fewer* parameters per layer than transformer blocks (no attention QKV projections), so Mamba models often have more layers to match parameter count.

### Concept: Mamba-2 and state-space duality

Mamba-2 (Dao & Gu, May 2024) reformulated selective SSMs by restricting the matrix structure. In Mamba-2:
- $A$ becomes a scalar (one shared $\alpha$ per channel)
- The recurrence simplifies to $h_t = \alpha_t h_{t-1} + \bar{B}_t x_t$

This restriction enables **matrix-form computation**:
$$Y = SSM(X) = M \odot (X W_C) W_B^T X$$

where $M$ is a structured mask. **This is matmul!** Modern GPUs are highly optimized for matmul; Mamba-2's matrix form is 2-8× faster than Mamba's scan kernel.

**The duality claim** (Dao & Gu 2024): both transformers (with attention) and Mamba-2 (with SSM) are special cases of a "Structured State Space Duality" framework. The difference is what structure they impose on the masking matrix $M$. **Attention and SSMs are not opposing approaches but variants of the same idea.**

### Concept: Hybrid models

Pure Mamba models exist (Mamba 2.8B, 7B from Gu & Dao) but **most state-of-the-art SSM models are hybrids**:

**Jamba** (Lieber et al. 2024): interleaves Mamba and transformer layers, plus MoE FFNs. Open-weights. Trades pure-SSM efficiency for hybrid quality.

**Zamba** (2024): different hybrid pattern.

**Falcon Mamba** (TII, 2024): pure-Mamba 7B.

**Why hybrid?** Pure Mamba is great for long-range tasks but slightly worse on standard language modeling than transformers. Hybrids get most of the efficiency benefit with closer-to-transformer quality.

**The current state of architectures (late 2024)**:
- **Dense transformers**: dominant for general-purpose LLMs (Llama-3, Qwen)
- **MoE transformers**: dominant for frontier (Mixtral, DeepSeek-V3, rumored GPT-4)
- **Pure Mamba**: long-range specialty applications
- **Hybrid Mamba-Transformer**: emerging; competitive but not yet dominant

---

## Glossary

- **SSM (State-Space Model)**: a continuous- or discrete-time linear dynamical system used for sequence modeling.
- **State**: a fixed-size vector $h_t$ summarizing the input history at time $t$.
- **Recurrence mode**: computing the SSM token-by-token via $h_t = \bar{A} h_{t-1} + \bar{B} x_t$.
- **Convolution mode**: computing the SSM as a convolution with a fixed kernel $\bar{K}$.
- **Discretization**: converting continuous-time SSM to discrete recurrence via a step size $\Delta$.
- **ZOH (Zero-Order Hold)**: the standard discretization method.
- **HiPPO**: a specific $A$ matrix structure for optimal sequence compression.
- **S4**: structured state space — the first practical SSM language model.
- **S6 / Mamba**: selective SSM — parameters depend on input.
- **Selectivity**: making $\bar{A}, \bar{B}, \bar{C}, \Delta$ functions of input $x_t$.
- **Selective scan**: the parallel algorithm Mamba uses for time-varying recurrences.
- **Mamba-2**: reformulation enabling matrix-form computation; 2-8× faster than Mamba.
- **SSD (State Space Duality)**: the framework unifying SSMs and attention.
- **Jamba**: hybrid Mamba-Transformer model.
- **Hardware-aware implementation**: custom GPU kernel keeping state in SRAM; analogous to FlashAttention's approach.

---

## Pedagogical analogies

### 1. SSM state as "compressed memory"
A transformer keeps all past tokens explicitly (the KV cache) — like keeping every email you've ever received. An SSM keeps a fixed-size state that "summarizes" the past — like keeping a daily journal where each day's entry is a few sentences. The journal is bounded in size; the inbox grows forever.

**Best used for:** section 2 introducing SSMs.

### 2. Discretization as "sampling continuous dynamics"
The continuous SSM is like a physical system (a pendulum, a circuit). Discretizing it is like taking snapshots of the system every $\Delta$ seconds. With small $\Delta$, you capture the dynamics accurately but compute many snapshots; with large $\Delta$, you sample sparsely and lose detail. The learned $\Delta_t$ in Mamba is like a "shutter speed" — fast when content is changing, slow when it's not.

**Best used for:** section 3 explaining discretization.

### 3. Recurrence-convolution duality as "movie playback vs editing"
A recurrence is like *watching* a movie — frame by frame, sequentially. A convolution is like *editing* — operating on all frames at once. Same content, two interaction modes. SSMs let you choose: watch for inference, edit for training.

**Best used for:** section 4 explaining the duality.

### 4. Selectivity as "decisive note-taking"
Without selectivity (S4): you write down every word in a lecture, regardless of importance. Useful but inefficient.
With selectivity (Mamba): you decide on the fly what to write down. Important words get full sentences; filler words get nothing. Your fixed-size notebook captures the essential content much better.

**Best used for:** section 5 introducing Mamba's selectivity.

### 5. Hybrid models as "the right tool for each job"
Pure Mamba is fast but slightly worse on standard language tasks. Pure Transformer is great on standard tasks but slow on long contexts. Hybrid: use Mamba layers where speed matters (most of the time), Transformer layers where precision matters (a few key layers). Get most of both worlds.

**Best used for:** section 7 explaining hybrid models.

---

## Common misconceptions

### MC1: "SSMs are just a fancy RNN."
**Reality:** structurally similar but mathematically very different. **SSMs are linear recurrences** with no element-wise nonlinearity in the recurrence (the nonlinearity is *between* SSM blocks, not within). This linearity enables the convolution-recurrence duality, FFT acceleration, and parallel scans — none of which work for standard nonlinear RNNs. SSMs are also derived from continuous-time dynamics with principled discretization (HiPPO, ZOH), giving them better inductive biases for sequence modeling than ad-hoc RNN designs.

### MC2: "Mamba replaces transformers."
**Reality:** **not in practice, not yet.** Most state-of-the-art LLMs in late 2024 are still transformers (dense or MoE). Pure-Mamba models exist (Mamba 2.8B, Falcon Mamba 7B) but don't quite match transformer quality at the same scale. Hybrids (Jamba) are gaining traction but aren't dominant. Mamba's main advantage is efficiency for long sequences; for short-to-medium contexts, transformers are still preferred.

### MC3: "Linear in sequence length means always faster."
**Reality:** asymptotically yes, but hardware matters. **Attention is highly optimized on GPUs** (matmul is what GPUs love); SSM's recurrent computation requires custom kernels (Mamba's scan, Mamba-2's matrix form) to compete. At short sequences (≤2K), Mamba is *not* faster than FlashAttention. The win comes at 8K-128K context lengths and beyond. **For short contexts, the constant factors favor attention.**

### MC4: "SSMs don't need attention."
**Reality:** **the best SSM models are hybrids that include attention layers.** Jamba uses interleaved Mamba + Transformer layers. The reason: attention is genuinely useful for some tasks (in-context learning, retrieval), and hybrid models capture both efficiency and capability. Pure-SSM is rarely the right answer; hybrid is.

### MC5: "Selective scan is the algorithm."
**Reality:** **selective scan is the *implementation*.** The algorithm is "compute the linear recurrence with input-dependent parameters." The selective scan is a parallel algorithm (Blelloch scan) that does this efficiently on GPUs with a custom CUDA kernel that keeps state in SRAM. The algorithm could be implemented other ways — Mamba-2 reformulates the same computation as matmul for additional speedup. **The scan is one implementation; the matrix form is another.**

### MC6: "Mamba's state is unbounded memory."
**Reality:** **Mamba's state is fixed-size** ($d_{\text{state}}$ scalars per channel, typically 16). The state can carry information across very long contexts in principle, but it's still compressing all that history into a fixed bottleneck. Pure-Mamba models can struggle on tasks requiring exact recall of distant tokens (e.g., needle-in-a-haystack); attention's KV cache makes such tasks easy. **Mamba trades exact recall for efficiency.**

### MC7: "S4 / Mamba / Mamba-2 are all the same thing."
**Reality:** they're a *family* with meaningful differences. **S4** (2022): fixed parameters, FFT-based convolution. **Mamba/S6** (Dec 2023): selective parameters, custom scan kernel. **Mamba-2** (May 2024): restricted parameter structure enabling matrix-form computation, 2-8× faster than Mamba. The evolution mirrors transformers from "attention is all you need" through Multi-Query, Grouped-Query, FlashAttention, etc.

---

## Tricky implementation details

### TID1: The HiPPO-LegS matrix
HiPPO-LegS has a specific lower-triangular structure:
$$A_{ij} = \begin{cases} -(2i+1)^{1/2}(2j+1)^{1/2} & i > j \\ -(i+1) & i = j \\ 0 & i < j \end{cases}$$

Random or identity initialization for $A$ produces poor long-range performance. The HiPPO initialization is critical.

### TID2: Reparameterization for stability
Direct learning of $A$ leads to instability (eigenvalues can become unstable). S4 reparameterizes as $A = -P^T P - Q$ where $P, Q$ are learned with constraints. Mamba uses a different reparameterization but the principle is the same.

### TID3: ZOH vs Bilinear discretization
The ZOH formula $\bar{A} = \exp(\Delta A)$ is theoretically correct but expensive (matrix exponential). For diagonal $A$, this simplifies to element-wise $\exp(\Delta \cdot a_i)$. Mamba uses a simpler Euler approximation $\bar{A} \approx I + \Delta A$ for speed; works because $\Delta A$ is typically small.

### TID4: The softplus on $\Delta$
$\Delta_t = \text{softplus}(\text{Linear}_\Delta(x_t))$ ensures $\Delta_t > 0$. Without the softplus, negative $\Delta$ would give imaginary eigenvalues and unstable dynamics.

### TID5: State size matters
Mamba uses $d_{\text{state}} = 16$ per channel — much smaller than you might expect. Larger state sizes don't necessarily help; the inductive bias of the SSM does most of the work. Hybrid models can use even smaller state (8 or 4).

### TID6: Parallel scan implementation
Parallel scan via Blelloch algorithm: bottom-up reduction (compute partial products), then top-down propagation. $O(\log T)$ depth, $O(T)$ work. For Mamba's purposes, the custom CUDA kernel does this within a single CUDA block, keeping state in SRAM throughout.

---

## Reference implementations

### Naive SSM forward pass (recurrence mode)

```python
import numpy as np

def ssm_forward_recurrence(x, A, B, C, delta):
    """
    Discrete-time SSM forward pass via recurrence.
    
    x:     (T,) — input sequence (scalar per token)
    A:     (N, N) — state transition (continuous)
    B:     (N,)   — input projection
    C:     (N,)   — output projection
    delta: float  — discretization step
    
    Returns: y of shape (T,)
    """
    T = len(x)
    N = A.shape[0]

    # ZOH discretization (diagonal A case for simplicity)
    A_bar = np.exp(delta * A)               # (N, N) — diagonal exp if A is diagonal
    B_bar = delta * B                        # (N,) — Euler-approximation for B

    h = np.zeros(N)
    y = np.zeros(T)
    for t in range(T):
        h = A_bar @ h + B_bar * x[t]
        y[t] = C @ h
    return y

# Demo: simple diagonal SSM (each state element is a leaky integrator)
np.random.seed(0)
N = 4
# Diagonal A with eigenvalues like [-1.0, -0.5, -0.25, -0.1] (slower decay → longer memory)
A = np.diag([-1.0, -0.5, -0.25, -0.1])
B = np.array([1.0, 1.0, 1.0, 1.0])
C = np.array([0.5, 0.3, 0.15, 0.05])
delta = 0.1

# Test: impulse response
x = np.zeros(50)
x[0] = 1.0   # impulse at time 0
y = ssm_forward_recurrence(x, A, B, C, delta)

print(f"Impulse response (first 10 samples):")
print([f"{v:.3f}" for v in y[:10]])
print(f"Total decay: y[0]={y[0]:.3f}, y[20]={y[20]:.3f}, y[49]={y[49]:.6f}")
print(f"\nThe state remembers the input through exponential decay.")
print(f"Slower eigenvalues → longer-range memory.")
```

### Selective SSM (Mamba-style) — input-dependent parameters

```python
import numpy as np

def softplus(x):
    return np.log(1 + np.exp(x))

def selective_ssm_forward(x, A, W_B, W_C, W_delta):
    """
    Selective (Mamba-style) SSM forward pass.
    
    x:        (T,) — input sequence
    A:        (N, N) — fixed state transition
    W_B:      (N, 1) — projects x to B_t (B becomes input-dependent)
    W_C:      (N, 1) — projects x to C_t
    W_delta:  (1, 1) — projects x to delta_t
    
    Returns: y of shape (T,)
    """
    T = len(x)
    N = A.shape[0]

    h = np.zeros(N)
    y = np.zeros(T)
    for t in range(T):
        # Compute input-dependent parameters
        B_t = W_B.flatten() * x[t]   # (N,) — depends on input
        C_t = W_C.flatten() * x[t]   # (N,)
        delta_t = softplus(W_delta[0, 0] * x[t])

        # Discretize
        A_bar = np.exp(delta_t * np.diag(A))   # diagonal exp; (N,)
        B_bar = delta_t * B_t   # (N,)

        # Recurrence step
        h = A_bar * h + B_bar    # element-wise (for diagonal A)
        y[t] = C_t @ h

    return y

# Demo: a sequence with some "important" tokens and some "filler"
np.random.seed(42)
N = 4
A = np.diag([-1.0, -0.5, -0.25, -0.1])
W_B = np.random.normal(0, 0.5, (N, 1))
W_C = np.random.normal(0, 0.5, (N, 1))
W_delta = np.array([[1.0]])

# Sequence: alternating "loud" (5.0) and "quiet" (0.1) inputs
x = np.array([0.1, 5.0, 0.1, 0.1, 5.0, 0.1, 0.1, 0.1, 5.0, 0.1])

y = selective_ssm_forward(x, A, W_B, W_C, W_delta)

print(f"Inputs:  {x.tolist()}")
print(f"Outputs: {y.round(2).tolist()}")
print(f"\nThe state updates more strongly when input is loud (delta is larger).")
print(f"This is selectivity: the model dynamically allocates more 'state update'")
print(f"to important inputs, less to filler.")
```

### Recurrence-convolution duality demonstration

```python
import numpy as np

def ssm_convolution(x, kernel):
    """
    Compute SSM output via convolution: y[t] = sum_i kernel[t-i] * x[i]
    """
    T = len(x)
    L = len(kernel)
    y = np.zeros(T)
    for t in range(T):
        for i in range(min(t + 1, L)):
            y[t] += kernel[i] * x[t - i]
    return y

def compute_kernel(A, B, C, delta, length):
    """Compute the SSM kernel: K[t] = C @ A_bar^t @ B_bar."""
    A_bar = np.exp(delta * np.diag(A))   # diagonal
    B_bar = delta * B
    kernel = np.zeros(length)
    A_power = np.ones_like(A_bar)
    for t in range(length):
        kernel[t] = (C * A_power * B_bar).sum()
        A_power *= A_bar
    return kernel

# Setup (same as recurrence demo)
N = 4
A = np.diag([-1.0, -0.5, -0.25, -0.1])
B = np.array([1.0, 1.0, 1.0, 1.0])
C = np.array([0.5, 0.3, 0.15, 0.05])
delta = 0.1
T = 30

np.random.seed(1)
x = np.random.normal(0, 1, T)

# Method 1: recurrence
def ssm_forward_recurrence(x, A, B, C, delta):
    T = len(x)
    N = A.shape[0]
    A_bar = np.exp(delta * np.diag(A))
    B_bar = delta * B
    h = np.zeros(N)
    y = np.zeros(T)
    for t in range(T):
        h = A_bar * h + B_bar * x[t]
        y[t] = C @ h
    return y

y_rec = ssm_forward_recurrence(x, A, B, C, delta)

# Method 2: convolution
kernel = compute_kernel(A, B, C, delta, T)
y_conv = ssm_convolution(x, kernel)

# Check they match
print(f"Recurrence output (first 5):  {y_rec[:5].round(4).tolist()}")
print(f"Convolution output (first 5): {y_conv[:5].round(4).tolist()}")
print(f"\nMax difference: {np.abs(y_rec - y_conv).max():.6f}")
print(f"\nSame SSM, two ways to compute it. Recurrence is O(T) sequential.")
print(f"Convolution can use FFT for O(T log T) parallel.")
```

---

## Connections to other chapters

- **Ch 4 (Attention)**: SSM replaces attention. The $O(N^2)$ memory + compute of attention is exactly what Mamba targets. Mamba-2 (Dao & Gu 2024) actually shows they're variants of the same framework — the "structured state space duality."
- **Ch 5 (Transformer block)**: the Mamba block replaces the entire transformer block (attention + FFN) with a single SSM-based block. Different building element entirely.
- **Ch 10 (Training infrastructure)**: Mamba's selective scan is a custom GPU kernel, analogous to FlashAttention. Hardware-aware implementation is critical.
- **Ch 11 (MoE)**: orthogonal to SSMs. Jamba combines MoE *and* Mamba — Mamba layers with MoE FFNs (except Jamba's MoE layers replace some Mamba layers entirely). Different optimizations stacked.
- **Ch 17 (Inference)**: SSMs have an inference advantage — fixed state size, no growing KV cache. For very long contexts, this is the killer feature.

---

## Open questions for the chapter author

### Q1: How much continuous-time math?
**Recommendation:** medium. State the continuous formulation $h'(t) = A h(t) + B x(t)$ for grounding. Don't deep-dive into ODE theory. Discretization is the more relevant practical detail.

### Q2: HiPPO depth?
**Recommendation:** minimal. State that "HiPPO gives us the right $A$ matrix for long-range memory" and cite the paper. Don't derive the HiPPO formula — it's notationally heavy and not pedagogically central.

### Q3: Selective scan algorithm depth?
**Recommendation:** medium. State the parallel-scan-on-associative-operations claim. Don't reproduce the Blelloch algorithm in detail. The key insight is "linear recurrences can be parallelized via prefix-sum-like operations" — this is enough.

### Q4: Mamba-2 vs Mamba?
**Recommendation:** brief subsection. Mamba-2 is the current state of the art; mention the matrix form and the duality claim. Don't deep-dive — it's a 2024 paper that may evolve.

### Q5: Widget candidates
1. **SSM vs Attention scaling (marquee, session 55):** show compute and memory as a function of sequence length for attention vs SSM. Attention's $O(N^2)$ explodes; SSM stays linear. Sliders for sequence length and model size. **Recommended marquee.**
2. **Selective scan animation (secondary, session 56):** animate the state $h_t$ evolving through a sequence with input-dependent $\Delta_t$. Show how the state updates strongly on "important" tokens, weakly on filler. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 12 is a **single-topic chapter** (state-space models / Mamba). Uses the **4-file cadence**.

Planned file layout:
- File 70: research (this)
- File 71: page structure (~600 lines, 8 sections; runnables embedded)
- File 72: SSM vs Attention scaling marquee widget
- File 73: Selective Scan animation secondary widget + exercises + closeout

Files 74-75 from original BUILD_ORDER absorbed.

**Pedagogical outcomes for the reader.** After Ch 12, the reader should be able to:
1. State the SSM equation $h_t = \bar{A} h_{t-1} + \bar{B} x_t$ and contrast with attention
2. Explain the recurrence-convolution duality
3. Explain what selectivity does (input-dependent parameters)
4. Sketch Mamba's selective scan as a parallel algorithm
5. Compare SSMs to attention on compute, memory, and quality dimensions
6. Identify hybrid models (Jamba) and why they exist
7. Reason about when to use SSMs vs transformers

Seven outcomes. Exercises hit outcomes 1-3 (implementation), 5 (comparison).

**This chapter closes Phase 10 — alternative architectures.** Ch 11 (MoE) + Ch 12 (SSMs) = the two major architectural alternatives to standard dense transformers. After Ch 12 publishes, **Phase 10 is complete**.

**Important framing:** SSMs are not (yet) the dominant architecture. Most production LLMs in 2024 are still transformers (dense or MoE). Mamba is genuinely impressive but hasn't displaced attention. Be honest about this — don't oversell.

After Phase 10, **Phase 11 (post-training)** begins — the largest remaining arc. 4 chapters on what to do with a pre-trained model (dense, MoE, or SSM) to make it useful: SFT, RLHF/DPO, PEFT, distillation.
