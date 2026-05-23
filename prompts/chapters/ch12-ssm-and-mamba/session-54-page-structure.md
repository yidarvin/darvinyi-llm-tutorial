# Session 54 — Chapter 12 page structure

> First chapter session for Chapter 12 ("State-space models and Mamba"). **The Phase 10 closer** — the other architectural alternative to standard dense transformers. Where Ch 11 (MoE) replaced the FFN with a sparse mixture, Ch 12 replaces *attention itself* with state-space modeling. Covers SSMs in continuous time, discretization, the recurrence-convolution duality, S4's structured SSMs, Mamba's selectivity, the hardware-aware selective scan, Mamba-2 / SSD, and hybrid models (Jamba). Single-topic chapter; uses the **4-file cadence**. Closes Phase 10.

---

## Read first (in this order)

1. **`research/ch12-ssm-and-mamba/research.md`** — the source material. Every section, derivation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch11-moe/session-50-page-structure.md`** — for the architectural-variant chapter template (Ch 11 established the pattern for Phase 10)
4. **`prompts/chapters/ch04-attention/session-19-page-structure.md`** — for the mathematically-careful template (Ch 4 introduced attention; Ch 12 replaces it)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 12 page. By end of session:

- `src/pages/ch12-ssm-and-mamba/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch12-ssm-and-mamba/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 12's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch12-ssm-and-mamba/` with sidebar showing Ch 12 active, prev/next nav linking to Ch 11 (active) and Ch 13 (disabled)

**Tonal note:** Ch 12 is the most mathematically demanding chapter since Ch 4 (attention). State-space models come from control theory; the reader needs to follow continuous-time dynamics, discretization, and the recurrence-convolution duality. The voice is mathematically careful but accessible — use analogies (state as "compressed memory," $\Delta_t$ as "shutter speed") liberally. **Don't try to make Mamba look easier than it is.** Acknowledge the conceptual leap from "attention is just QKᵀ" to "linear dynamical systems with input-dependent parameters."

**Phase 10 closer framing:** explicitly bridge to the next phase. After Ch 12, Phase 11 (post-training) begins. The chapter close should signal that the *architectural* exploration is complete and the *training methods* exploration is next.

**Chapter cadence:** Ch 12 uses the **4-file cadence** (single-topic chapter — SSMs/Mamba). Original BUILD_ORDER had 6 files (70-75); files 74-75 absorbed.

---

## Inputs

State of the repo after session 52 (Ch 11 complete):

- Ch 1-11 all `'published'`
- `research/ch12-ssm-and-mamba/research.md` exists
- `src/lib/chapters.ts` has Ch 1-11 `'published'`, Ch 12-30 `'planned'`
- No `src/pages/ch12-ssm-and-mamba/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch12-ssm-and-mamba/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch12-ssm-and-mamba/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 12's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch12-ssm-and-mamba
description: State-space models (SSMs) and Mamba — the second major architectural alternative to standard transformers. Where MoE (Chapter 11) modified the feed-forward network, SSMs replace attention itself. The bet is on linear-time recurrence instead of quadratic attention. This chapter covers continuous-time SSMs, discretization, the recurrence-convolution duality, S4's structured state spaces, Mamba's selectivity (input-dependent parameters), the hardware-aware selective scan, Mamba-2's matrix-form computation, and hybrid models like Jamba. SSMs are an important but not yet dominant architectural family — pure-Mamba models exist but most production SSM-based systems are hybrids.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~250 words) of opening.

**Sample opening** — rewrite in chapter voice:

> Attention has a problem: it's $O(N^2)$ in both memory and compute. For a 32K-token context, the attention matrix is 1 billion entries. For 1M tokens (the rumored upper limit of frontier models), it's a trillion. Long contexts are bottlenecked by attention, not by FFN or anything else.
>
> The state-space model family takes a different bet. **Don't store every past token explicitly.** Instead, maintain a fixed-size *state* — a vector that summarizes everything important about the history. New tokens update the state via a linear recurrence; predictions read from the state. Like an RNN, but with mathematical structure (continuous-time linear dynamics, principled discretization) that makes it actually work for long sequences.
>
> The lineage runs through S4 (Gu et al. 2022, structured SSMs with HiPPO initialization), through Mamba (Gu & Dao, Dec 2023, adding input-dependent selectivity), to Mamba-2 (Dao & Gu, May 2024, matrix-form computation that connects SSMs to attention). And then there are hybrids: **Jamba** (Lieber et al. 2024) interleaves Mamba and Transformer layers because, in practice, neither alone is optimal. This chapter walks the math, the algorithms, and the practical reality. **Like Chapter 11 (MoE), Chapter 12 is honest: SSMs are not yet dominant.** They're an architectural alternative with genuine advantages for long contexts and genuine costs everywhere else.

### Section 1: The setup — attention's O(N²) problem

**Heading:** `## The setup — attention's O(N²) problem`
**Word target:** ~400

**Teaching beats:**
1. **Attention's scaling**: $O(N^2)$ in both compute and memory. At 32K tokens, the QKᵀ matrix is 1B entries (4GB in BF16). At 1M tokens, 4TB. **Attention doesn't scale to very long contexts.**
2. **FlashAttention (Ch 10) helped**: reduced HBM I/O from $O(N^2)$ to $O(N)$. But the *underlying compute* is still $O(N^2)$ — FlashAttention hides the cost in SRAM, doesn't eliminate it.
3. **What we want**: linear-time sequence modeling. $O(N)$ memory + compute. Constant memory per token at inference.
4. **What the alternatives offer**:
   - **Linear attention** (Performer, Linformer): approximations; quality degrades.
   - **RWKV**: linear RNN with time-decay; competitive but architecturally distinct from SSMs.
   - **State-space models**: principled continuous-time dynamics; linear by construction; this chapter's subject.
5. **Mamba** (Dec 2023) was the breakthrough that made SSMs competitive on language modeling. Pre-Mamba SSMs (S4, S5) worked on long-range benchmarks but underperformed transformers on language.

**Required widget placeholder** — SSM vs Attention scaling (marquee, session 55):

```mdx
<WidgetFrame title="SSM vs attention scaling" caption="Compute and memory cost as a function of sequence length, for attention vs SSM. Attention's $O(N^2)$ scaling explodes at long contexts; SSMs grow linearly. Slider for sequence length (256 to 1M tokens). At short contexts (≤2K), attention's optimized matmul wins on wall clock; at long contexts (32K+), the asymptotic difference dominates.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 55 (marquee)
  </div>
</WidgetFrame>
```

**Required callout** — type `warning`: MC3 from research.md. "Linear in sequence length means always faster." Wrong on short contexts. **Asymptotically yes, but constant factors favor attention at short sequences.** Modern GPUs are optimized for matmul (what attention uses); SSM's recurrent computation requires custom kernels to compete. At seq_len = 2K, Mamba is *not* faster than FlashAttention. The win shows up at 8K-128K and beyond.

**Connection forward:** to understand SSMs, we start in continuous time.

### Section 2: SSMs in continuous time — the dynamical systems view

**Heading:** `## SSMs in continuous time — the dynamical systems view`
**Word target:** ~600
**Sub-headings:** `### The continuous formulation`, `### State as compressed memory`

**Teaching beats:**

**The continuous formulation:**
1. A state-space model is defined by four matrices: $A, B, C, D$.
   $$h'(t) = A h(t) + B x(t)$$
   $$y(t) = C h(t) + D x(t)$$
2. **Decode the symbols**: $x(t)$ is input at time $t$; $h(t) \in \mathbb{R}^N$ is *state* of fixed size $N$; $y(t)$ is output.
3. **$A \in \mathbb{R}^{N \times N}$** controls how the state evolves (dynamics).
4. **$B \in \mathbb{R}^{N \times 1}$** controls how input enters the state.
5. **$C \in \mathbb{R}^{1 \times N}$** controls how output is read from the state.
6. **$D$** is a skip-connection (residual).

**State as compressed memory:**
7. The state $h(t)$ has constant dimension $N$ **regardless of how long the sequence is**. A single fixed-size vector carries all relevant history.
8. **Contrast with attention**: a transformer's KV cache grows linearly with sequence length. Every past token contributes a key+value pair. SSMs don't store past tokens — they store a *summary*.
9. **The trade-off**: SSMs are bounded in what they can remember (compressed into $N$ dimensions). Attention's KV cache can recall any past token exactly. SSMs trade exact recall for efficiency.
10. **This is the SSM bet**: most of what matters about past tokens can be summarized; exact recall of distant tokens is rarely needed.

**Required callout** — type `note`: SSMs come from control theory, not from machine learning. The equations $h'(t) = A h(t) + B x(t)$, $y(t) = C h(t)$ describe linear time-invariant systems studied since the 1960s. The novelty in S4/Mamba is using this framework for sequence modeling and finding the right structure for $A, B, C$ to make it work.

**No code in this section.** Conceptual setup.

**Connection forward:** continuous-time dynamics are mathematically clean but not directly computable. Section 3 covers discretization.

### Section 3: Discretization — making SSMs computable

**Heading:** `## Discretization — making SSMs computable`
**Word target:** ~600
**Sub-headings:** `### Zero-order hold`, `### The discrete recurrence`

**Teaching beats:**

**Zero-order hold:**
1. **The problem**: text tokens are *discrete*. The continuous formulation doesn't directly apply.
2. **The solution**: discretize the continuous system using a step size $\Delta$.
3. **Zero-order hold (ZOH) discretization** — the standard method:
   $$\bar{A} = \exp(\Delta A), \quad \bar{B} = (\Delta A)^{-1}(\exp(\Delta A) - I) \cdot \Delta B$$
4. **Intuition**: assume the continuous input is constant for $\Delta$ seconds, solve the continuous ODE exactly over that interval, repeat.
5. **In practice for diagonal $A$**: $\bar{A}_{ii} = \exp(\Delta \cdot a_i)$ (element-wise), $\bar{B} \approx \Delta B$ (Euler approximation, used in Mamba).

**The discrete recurrence:**
6. After discretization, the SSM becomes a discrete recurrence:
   $$h_t = \bar{A} h_{t-1} + \bar{B} x_t$$
   $$y_t = C h_t$$
7. **This is structurally an RNN.** But the linear structure (no element-wise nonlinearity in the recurrence) makes it special.
8. **$\Delta$ as "shutter speed"**: small $\Delta$ → fine-grained sampling, state changes slowly per step. Large $\Delta$ → coarse sampling, state updates strongly per step. The model **learns** $\Delta$ — and in Mamba, $\Delta$ varies *per token*.

**Required equation block** with label `12.ssm`:

```mdx
<Equation label="12.ssm">
$$h_t = \bar{A} h_{t-1} + \bar{B} x_t, \quad y_t = C h_t$$
</Equation>

The discrete SSM recurrence. $\bar{A}$ and $\bar{B}$ are the discretized parameters via ZOH (zero-order hold). For diagonal $A$, $\bar{A}_{ii} = \exp(\Delta \cdot a_i)$. The state $h_t \in \mathbb{R}^N$ has fixed dimension; the recurrence is linear by design.
```

**Required code** — `<RunnableCode>` with continuous → discrete impulse response:

```python
import numpy as np

def ssm_forward_recurrence(x, A_diag, B, C, delta):
    """
    Discrete SSM (diagonal A) via recurrence.
    """
    T = len(x)
    N = len(A_diag)
    A_bar = np.exp(delta * A_diag)   # element-wise diagonal exp
    B_bar = delta * B                  # Euler approximation
    h = np.zeros(N)
    y = np.zeros(T)
    for t in range(T):
        h = A_bar * h + B_bar * x[t]
        y[t] = C @ h
    return y

# Diagonal A with different decay rates per state element
A_diag = np.array([-1.0, -0.5, -0.25, -0.1])   # eigenvalues
B = np.array([1.0, 1.0, 1.0, 1.0])
C = np.array([0.5, 0.3, 0.15, 0.05])
delta = 0.1

# Impulse response: input is a single 1.0 at time 0
T = 50
x = np.zeros(T)
x[0] = 1.0
y = ssm_forward_recurrence(x, A_diag, B, C, delta)

print(f"Impulse response (first 10 samples):")
for t in range(10):
    print(f"  y[{t}] = {y[t]:.4f}")
print(f"\nDecay over longer time: y[20]={y[20]:.4f}, y[49]={y[49]:.6f}")
print(f"\nEach state element decays at rate exp(delta * a_i):")
print(f"  Element 0 (a=-1.0): half-life ~{0.693 / (delta * 1.0):.1f} steps")
print(f"  Element 3 (a=-0.1): half-life ~{0.693 / (delta * 0.1):.1f} steps")
print(f"\nSlower eigenvalues → longer-range memory.")
```

**Connection forward:** the recurrence is one way to compute the SSM. Section 4 shows the other.

### Section 4: The recurrence-convolution duality

**Heading:** `## The recurrence-convolution duality`
**Word target:** ~500

**Teaching beats:**
1. **Unroll the recurrence**: $h_t = \sum_{i=0}^t \bar{A}^{t-i} \bar{B} x_i$. Each output is a weighted sum of past inputs.
2. **This is a convolution**: $y_t = \sum_i \bar{K}_{t-i} x_i$ where $\bar{K}_j = C \bar{A}^j \bar{B}$ is the **kernel**.
3. **Two ways to compute the same SSM**:
   - **Recurrence mode**: $O(N)$ time per token, sequential. Memory bounded by state size. **Good for inference** (one token at a time).
   - **Convolution mode**: parallelizable; can use FFT for $O(N \log N)$ overall. **Good for training** (process the whole sequence at once).
4. **The choice depends on workload**: training prefers convolution (parallel); inference prefers recurrence (low memory). SSMs let you choose.
5. **Compare to attention**: attention is *only* parallel matmul (no efficient recurrence). RNNs are *only* sequential recurrence (no efficient parallel form). SSMs have both. **This is the SSM's signature property.**

**Required callout** — type `aside`: The recurrence-convolution duality is unique to *linear* recurrences. Standard RNNs have nonlinear activations in the recurrence ($h_t = \tanh(W h_{t-1} + U x_t)$), which breaks the duality. SSMs maintain linearity precisely to preserve this property. The price: less expressive per layer than RNN. The benefit: massive computational flexibility.

**Required code** — `<RunnableCode>` demonstrating the duality:

```python
import numpy as np

def ssm_recurrence(x, A_diag, B, C, delta):
    """Compute via sequential recurrence."""
    T = len(x)
    A_bar = np.exp(delta * A_diag)
    B_bar = delta * B
    h = np.zeros(len(A_diag))
    y = np.zeros(T)
    for t in range(T):
        h = A_bar * h + B_bar * x[t]
        y[t] = C @ h
    return y

def ssm_kernel(A_diag, B, C, delta, length):
    """Compute the SSM kernel: K[j] = C @ A_bar^j @ B_bar."""
    A_bar = np.exp(delta * A_diag)
    B_bar = delta * B
    K = np.zeros(length)
    A_power = np.ones_like(A_bar)
    for j in range(length):
        K[j] = (C * A_power * B_bar).sum()
        A_power *= A_bar
    return K

def ssm_convolution(x, K):
    """Compute via convolution: y[t] = sum_i K[t-i] * x[i]."""
    T = len(x)
    L = len(K)
    y = np.zeros(T)
    for t in range(T):
        for i in range(min(t + 1, L)):
            y[t] += K[i] * x[t - i]
    return y

# Setup
np.random.seed(1)
A_diag = np.array([-1.0, -0.5, -0.25, -0.1])
B = np.array([1.0, 1.0, 1.0, 1.0])
C = np.array([0.5, 0.3, 0.15, 0.05])
delta = 0.1
T = 30
x = np.random.normal(0, 1, T)

# Method 1: recurrence
y_rec = ssm_recurrence(x, A_diag, B, C, delta)

# Method 2: convolution
K = ssm_kernel(A_diag, B, C, delta, T)
y_conv = ssm_convolution(x, K)

# They should match
print(f"Recurrence output (first 5): {y_rec[:5].round(4).tolist()}")
print(f"Convolution output (first 5): {y_conv[:5].round(4).tolist()}")
print(f"\nMax difference: {np.abs(y_rec - y_conv).max():.2e}")
print(f"\nSame SSM, two implementations. Use recurrence for inference,")
print(f"convolution (with FFT) for training. This duality is the magic of SSMs.")
```

**Connection forward:** the duality is beautiful but has a limitation. Section 5 explains why Mamba had to break it.

### Section 5: From S4 to Mamba — selectivity

**Heading:** `## From S4 to Mamba — selectivity`
**Word target:** ~700 — CENTRAL CONCEPT
**Sub-headings:** `### S4 — structured but rigid`, `### The selectivity insight`, `### Mamba's recurrence`

**Teaching beats:**

**S4 — structured but rigid:**
1. **S4 (Gu et al. 2022)** introduced practical SSMs with two key structural choices:
   - **HiPPO initialization for $A$**: a specific matrix structure that compresses input history as Legendre polynomial coefficients. Critical for long-range performance.
   - **Diagonal + low-rank $A$**: enables efficient computation of $\bar{A}^t$.
2. **S4's limitation**: $\bar{A}, \bar{B}, \bar{C}$ are **fixed for the whole sequence**. The SSM can't focus on important tokens or ignore irrelevant ones — its dynamics are content-independent.
3. **Why this matters**: language is selective. "The capital of France is ___" relies on remembering "France"; "and" is mostly fillter. S4's uniform dynamics treat both the same.

**The selectivity insight:**
4. **Mamba's innovation (Gu & Dao, Dec 2023)**: make the SSM parameters depend on the input.
   $$\bar{B}_t = \text{Linear}_B(x_t), \quad \bar{C}_t = \text{Linear}_C(x_t), \quad \Delta_t = \text{softplus}(\text{Linear}_\Delta(x_t))$$
5. **What this buys**: the model can now *decide* — per token — whether to update strongly ($\Delta_t$ large) or weakly ($\Delta_t$ small).
6. **Selective forgetting**: when $\Delta_t \to 0$, $\bar{A}_t = \exp(\Delta_t A) \to I$ — the state is unchanged. The model "ignores" this token.
7. **Selective remembering**: when $\Delta_t$ is large, the state updates strongly with $x_t$. Important tokens get encoded.

**Mamba's recurrence:**
8. The Mamba recurrence:
   $$h_t = \bar{A}_t h_{t-1} + \bar{B}_t x_t$$
9. **Notice the subscript on $\bar{A}_t$**: the dynamics are now *time-varying*. The system is no longer time-invariant.
10. **The cost**: time-varying parameters break the convolution mode. The kernel $\bar{K}_j$ would need to be different for each $t$ — there's no fixed kernel. **Mamba can only run as a recurrence.**
11. This breaks the elegant duality of S4 — but the quality gain from selectivity is worth it.

**Required widget placeholder** — Selective scan animation (secondary, session 56):

```mdx
<WidgetFrame title="Selective scan visualization" caption="Watch state $h_t$ evolve through a sequence as $\\Delta_t$ varies per token. Large $\\Delta_t$ → strong state update on this token; small $\\Delta_t$ → state nearly unchanged. The hand-tuned sequence has some 'important' tokens (large $\\Delta$) and 'filler' tokens (small $\\Delta$); reader sees how the state captures only the important content.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 56 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with selective SSM:

```python
import numpy as np

def softplus(x):
    return np.log(1 + np.exp(x))

def selective_ssm(x, A_diag, W_B, W_C, W_delta):
    """
    Selective (Mamba-style) SSM. Parameters depend on input.
    """
    T = len(x)
    N = len(A_diag)
    h = np.zeros(N)
    y = np.zeros(T)
    deltas = np.zeros(T)

    for t in range(T):
        # Input-dependent parameters
        B_t = W_B.flatten() * x[t]   # (N,)
        C_t = W_C.flatten() * x[t]   # (N,)
        delta_t = softplus(W_delta[0, 0] * x[t])
        deltas[t] = delta_t

        # Discretize and update
        A_bar = np.exp(delta_t * A_diag)
        B_bar = delta_t * B_t

        h = A_bar * h + B_bar
        y[t] = C_t @ h

    return y, deltas

# Demo: alternating loud/quiet inputs
np.random.seed(42)
N = 4
A_diag = np.array([-1.0, -0.5, -0.25, -0.1])
W_B = np.random.normal(0, 0.5, (N, 1))
W_C = np.random.normal(0, 0.5, (N, 1))
W_delta = np.array([[1.0]])

# Sequence: loud (5.0) and quiet (0.1) tokens alternating
x = np.array([0.1, 5.0, 0.1, 0.1, 5.0, 0.1, 0.1, 0.1, 5.0, 0.1])
y, deltas = selective_ssm(x, A_diag, W_B, W_C, W_delta)

print(f"Inputs:  {x.tolist()}")
print(f"Deltas:  {deltas.round(3).tolist()}")
print(f"Outputs: {y.round(3).tolist()}")
print(f"\nLarger deltas on loud inputs → state updates strongly on important tokens.")
print(f"Smaller deltas on quiet inputs → state mostly unchanged on filler.")
print(f"\nThis is the core insight of Mamba: input-dependent dynamics.")
```

**Connection forward:** breaking the duality means we need a new algorithm to compute the recurrence efficiently. Section 6.

### Section 6: The selective scan — hardware-aware parallelism

**Heading:** `## The selective scan — hardware-aware parallelism`
**Word target:** ~600
**Sub-headings:** `### Naive recurrence is slow`, `### Parallel scan over associative ops`, `### The Mamba CUDA kernel`

**Teaching beats:**

**Naive recurrence is slow:**
1. A direct recurrence is sequential — token $t$ depends on $t-1$. For 32K tokens this is too slow on GPUs (which excel at parallelism, not sequential ops).
2. **For S4 / fixed-parameter SSMs**: convolution mode parallelizes. For Mamba / time-varying parameters: no convolution mode. **What now?**

**Parallel scan over associative ops:**
3. **Key insight**: even though $h_t$ depends on $h_{t-1}$, the *sequence* of states can be computed in parallel using prefix-sum-like algorithms.
4. **Express the recurrence as a binary op**: define $(A_t, b_t) \circ (A_s, b_s) = (A_t A_s, A_t b_s + b_t)$.
5. **This is associative**: $(o_3 \circ o_2) \circ o_1 = o_3 \circ (o_2 \circ o_1)$.
6. **Associative operations can be parallelized** via Blelloch scan: $O(\log T)$ depth, $O(T)$ work.
7. **The selective scan** is this algorithm applied to Mamba's time-varying recurrence.

**The Mamba CUDA kernel:**
8. **Mamba's contribution**: a custom CUDA kernel implementing the selective scan with hardware-aware optimizations:
   - **State $h$ stays in SRAM** (fast memory), not HBM
   - **Input/output projections fused** into the same kernel
   - **Activation recomputation** during backward (saves memory)
9. **Mirror to FlashAttention** (Ch 10): same engineering pattern — the algorithm was known; the kernel made it practical.
10. **Mamba-2's matrix form**: Dao & Gu 2024 reformulated selective SSMs so they can be expressed as matmul. Modern GPUs are matmul machines, so the matrix form is **2-8× faster** than the scan kernel. This is the current state-of-the-art SSM implementation.

**Required callout** — type `warning`: MC5 from research.md. "Selective scan is the algorithm." Wrong — selective scan is one *implementation*. The algorithm is "compute the linear recurrence with input-dependent parameters." Selective scan (Mamba) uses a custom CUDA kernel with parallel scan. **Mamba-2 reformulates the same computation as matmul** — same correctness, 2-8× faster on modern GPUs. The algorithm has multiple implementations.

**Connection forward:** with the math and algorithms in place, section 7 covers the practical block structure.

### Section 7: Mamba in practice — block structure, hybrids

**Heading:** `## Mamba in practice — block structure and hybrids`
**Word target:** ~500
**Sub-headings:** `### The Mamba block`, `### Hybrid models — Jamba`

**Teaching beats:**

**The Mamba block:**
1. A Mamba block replaces a transformer block (attention + FFN) with a single SSM-based architecture.
2. **Structure**: two parallel branches both expand the input via Linear+activation. One branch runs through the selective SSM. The other branch is a "gate" that modulates the SSM output. Combined and projected back.
3. **No attention, no separate FFN**. The gating mechanism plays a similar role to FFN's nonlinearity.
4. **Parameter count**: Mamba blocks are roughly comparable to transformer blocks at similar widths, but distribute parameters differently (no QKV projections; wider intermediate dim).

**Hybrid models — Jamba:**
5. **Pure-Mamba models exist**: Mamba 2.8B / 7B (Gu & Dao), Falcon Mamba 7B (TII 2024). Competitive but not state-of-the-art at their parameter scale.
6. **Hybrid models often win**: **Jamba** (Lieber et al. 2024) interleaves Mamba and Transformer layers, with MoE on top. Reasoning: attention is genuinely useful for *some* tasks (in-context learning, retrieval), while Mamba is more efficient for *most* tasks. Hybrid captures both.
7. **Common hybrid pattern**: ~80% Mamba layers, ~20% Transformer layers, distributed throughout the network.
8. **Why not pure Mamba?** The current evidence suggests pure-Mamba slightly underperforms on standard language benchmarks at scale. The fixed-size state can't perfectly capture all the in-context information that attention's growing KV cache provides.

**Required callout** — type `warning`: MC4 from research.md. "SSMs don't need attention." **The best SSM-based models are hybrids.** Pure-Mamba models exist (Mamba 2.8B, Falcon Mamba 7B) but don't quite match transformer quality at scale. Hybrids (Jamba) win by combining SSM efficiency with attention's expressivity for in-context learning. Don't expect Mamba to fully replace attention; expect them to coexist.

**Connection forward:** when to use SSMs at all? Section 8.

### Section 8: Trade-offs — where SSMs win and lose

**Heading:** `## Trade-offs — where SSMs win and lose`
**Word target:** ~400
**Sub-headings:** `### Where SSMs win`, `### Where SSMs lose`, `### Bridge to Phase 11`

**Teaching beats:**

**Where SSMs win:**
1. **Long contexts (32K+)**: linear scaling pays off. Inference cost stays bounded; attention's KV cache exhausts GPU memory.
2. **Streaming / online inference**: fixed state size → low latency, predictable memory.
3. **Edge deployment**: SSM models are smaller and more efficient at inference time.

**Where SSMs lose:**
4. **Short contexts (≤8K)**: attention's optimized matmul kernels are faster in absolute terms. SSMs only win asymptotically.
5. **Exact recall (needle-in-haystack)**: SSMs compress all history into fixed state. Attention's KV cache preserves every token exactly. For tasks requiring precise retrieval of distant content, attention wins.
6. **In-context learning**: surprisingly, pure-SSM models are slightly worse at in-context learning than transformers. Attention's exact recall of demonstrations matters.
7. **Standard language benchmarks**: pure-Mamba slightly underperforms transformers at the same scale. The gap is small but real.

**Bridge to Phase 11:**
8. **Phase 10 closes here**. We've covered the two major architectural alternatives to dense transformers: **MoE** (Ch 11) modifies the FFN; **SSM** (Ch 12) replaces attention. Together they cover the architectural innovation space of 2022-2024.
9. **Phase 11 (Post-training)** begins next: SFT, RLHF, DPO, PEFT, distillation. After training a model (dense, MoE, or SSM), what do you do with it? The Phase 11 chapters answer that.

**Sample close** (rewrite in chapter voice):

> The architecture wars of 2022-2024 left us with three families: dense transformers (Llama-3, Qwen), MoE transformers (Mixtral, DeepSeek-V3, rumored GPT-4), and SSM-based models (mostly hybrids like Jamba). None has fully displaced the others. Each excels in different regimes.
>
> Whatever architecture you train, the next question is how to turn raw next-token prediction into something useful. **Phase 11 (Post-training) is about that.** Chapter 13 covers supervised fine-tuning — the simplest post-training method, and the foundation for everything else. Chapter 14 covers preference optimization (RLHF, DPO, RLVR) — the family of methods that turn a fine-tuned model into a chatbot. Chapter 15 covers parameter-efficient methods (LoRA, adapters). Chapter 16 covers distillation. Together they cover the practical methods that turn pre-trained models into ChatGPT-style assistants. The training arc is over; the *useful-model* arc begins.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 12, slug: 'ch12-ssm-and-mamba', title: 'State-space models and Mamba', partNum: 4, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch12-ssm-and-mamba/index.astro && rm src/pages/ch12-ssm-and-mamba/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch12-ssm-and-mamba/`** renders with:
   - Chapter eyebrow ("Chapter 12") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 3, 4, 5)
   - 2 `<WidgetFrame>` placeholders (sections 1 and 5)
   - Labeled equation `<Equation label="12.ssm">` in section 3
   - At least 5 callouts (targeting MC3, MC4, MC5 from research.md, plus the control-theory aside and duality aside)
3. **Sidebar:** Ch 1-11 published; Ch 12 active (draft); Ch 13-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 12:** prev = Ch 11 (active); next = Ch 13 (disabled)
6. **TOC on Ch 12** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 4000 and 5000 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 55 and 56 own them.
- ❌ **Do not write exercises.** Session 56 owns (combined with secondary widget).
- ❌ **Do not flip Ch 12's status to `'published'`.** Session 56 owns.
- ❌ **Do not derive the HiPPO matrix.** Mention it exists; cite the paper. The full derivation is graduate-level.
- ❌ **Do not implement Mamba-2's matrix form.** Mention it exists; don't reproduce.
- ❌ **Do not cover RWKV in detail.** Brief mention only — different family of sub-quadratic alternatives.
- ❌ **Do not derive the Blelloch parallel scan algorithm in detail.** Sketch the associative-operation insight; don't reproduce the algorithm.
- ❌ **Do not modify Ch 1-11.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch12-ssm-and-mamba/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch12-ssm-and-mamba/index.astro 2>/dev/null || true
git commit -m "session 54: Ch 12 prose — state-space models and Mamba"
git push origin main
```

---

## Notes for the session author

**On the mathematical density:**
Ch 12 is the most mathematically demanding chapter since Ch 4 (attention). Reader navigates continuous-time differential equations, discretization, recurrences, convolutions, and parallel scans. **Use analogies liberally to ground the math.** The "state as compressed memory" and "$\Delta_t$ as shutter speed" analogies are critical.

**On the "SSMs come from control theory" framing:**
Section 2's callout emphasizes that SSMs aren't invented for sequence modeling — they're an established mathematical framework from control theory, adapted for ML. This grounds the reader: "this isn't a new ML hack; it's a 60-year-old math framework that turned out to be useful for language."

**On the duality being SSMs' signature property:**
Section 4 should emphasize this strongly. Standard RNNs are *only* sequential; attention is *only* parallel matmul. SSMs are *both* — the linear structure enables it. This duality is unique to SSMs and is what makes them more than "just another RNN."

**On Mamba breaking the duality:**
Section 5's punchline: selectivity gains expressivity but loses the convolution mode. This is presented as a deliberate trade-off — Mamba gives up the duality for the quality gain. It's not a flaw but a chosen complexity.

**On the FlashAttention parallel:**
Section 6 should explicitly draw the parallel: Mamba's selective scan is *to SSMs* what FlashAttention is *to attention* — a hardware-aware implementation that makes the algorithm practical. Same engineering pattern: keep state in SRAM, fuse operations, custom CUDA kernel. **Bridges Phase 10 (architectures) to Phase 9 (Ch 10 infrastructure).**

**On Jamba and hybrids:**
Section 7 should be honest. **Pure-Mamba is not state-of-the-art.** Modern SSM-based production models (Jamba, others) are hybrids. The architecture-purist version of "Mamba replaces transformers" hasn't won; the pragmatic "hybrids combine the best of both" has.

**On not over-deriving:**
HiPPO matrix derivation, Mamba-2's matrix form derivation, Blelloch's parallel scan algorithm — all are graduate-level. **State they exist; cite the papers; don't reproduce.** The chapter is about the architectural ideas, not the full mathematical scaffolding.

**On the 3 runnable code blocks:**
- Section 3 (discretization → impulse response): reader sees the recurrence in action
- Section 4 (duality demo): reader verifies recurrence == convolution
- Section 5 (selective SSM): reader sees input-dependent dynamics

3 blocks. Same density as Ch 11.

**On the Phase 10 closing framing:**
Section 8 should explicitly bridge to Phase 11. Phase 10 covered two architectural alternatives. After Ch 12 publishes, the *architecture* exploration is done. Phase 11 turns to *what to do* with these architectures: SFT, RLHF, PEFT, distillation. New phase, new theme.

**Pedagogical claim of the chapter:**
"State-space models offer a principled alternative to attention. They come from control theory: a continuous-time linear dynamical system, discretized for tokens, with fixed-size state replacing the growing KV cache. The recurrence-convolution duality lets SSMs run efficiently in both training (parallel) and inference (recurrent) modes. Mamba's selectivity (input-dependent parameters) made SSMs competitive with attention on language modeling. Mamba's selective scan and Mamba-2's matrix form are hardware-aware implementations that make selective SSMs practical on GPUs. But SSMs aren't dominant in practice: hybrid models like Jamba currently win, combining SSM efficiency with attention's expressivity."

**This chapter closes Phase 10.** After Ch 12 publishes, the architecture arc is complete. **Build with care — this is a milestone chapter.**
