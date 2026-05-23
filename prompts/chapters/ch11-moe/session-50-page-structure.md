# Session 50 — Chapter 11 page structure

> First chapter session for Chapter 11 ("Mixture of Experts"). **The Phase 10 opener** — the first chapter exploring architectural variants beyond the standard dense transformer of Ch 1-6. Covers the MoE block (router + experts), top-k routing math, load balancing via auxiliary loss, expert capacity, modern variants (Switch / GLaM / Mixtral / DeepSeek-MoE), and the practical engineering challenges. Single-topic chapter; uses the **4-file cadence**. Sets the tone for Phase 10: chapters are more thematic and independent than Phase 9's contiguous training arc.

---

## Read first (in this order)

1. **`research/ch11-moe/research.md`** — the source material. Every section, derivation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch06-positional-encoding/session-30-page-structure.md`** — for the "architectural variants" chapter template (Ch 6 established the pattern for chapters covering multiple variants of a single architectural element)
4. **`prompts/chapters/ch05-multihead-and-block/session-25-page-structure.md`** — for the central-architecture chapter template (Ch 5 introduced the transformer block; Ch 11 modifies it)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 11 page. By end of session:

- `src/pages/ch11-moe/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch11-moe/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 11's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch11-moe/` with sidebar showing Ch 11 active, prev/next nav linking to Ch 10 (active) and Ch 12 (disabled)

**Tonal note:** Ch 11 returns to the *architectural* voice of Ch 1-6 (precise, mathematically careful, attentive to design choices) after Ch 7-10's *engineering* voice. The reader is back in "build the network" mode — but instead of constructing the standard block, we're swapping out one of its components. Still empirical when it matters (cite Mixtral, DeepSeek-V3 with real numbers), but the focus is on understanding the architectural variant, not just running it.

**Phase 10 framing:** the chapter should signal that we're entering a new section. Phase 9 was the contiguous training arc; Phase 10+ is more thematic — each chapter covers a major variant or extension. Be explicit in the opening that Ch 11 returns to architectural concerns.

**Chapter cadence:** Ch 11 uses the **4-file cadence** (single-topic chapter — MoE architecture). Original BUILD_ORDER may have additional file slots beyond 68; will absorb appropriately.

---

## Inputs

State of the repo after session 48 (Ch 10 complete):

- Ch 1-10 all `'published'`
- `research/ch11-moe/research.md` exists
- `src/lib/chapters.ts` has Ch 1-10 `'published'`, Ch 11-30 `'planned'`
- No `src/pages/ch11-moe/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch11-moe/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch11-moe/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 11's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch11-moe
description: Mixture of Experts (MoE) — the architectural pattern that decouples parameters from compute. Replace the dense feed-forward block with a sparse mixture of expert sub-networks plus a router that picks which experts process each token. The result: dramatically more parameters at roughly the same FLOPs per token. Used by Mixtral, DeepSeek-V3, GLaM, Switch Transformer, and reportedly GPT-4. This chapter covers the MoE block, top-k routing, load balancing, expert capacity, modern variants, and why MoE is harder to train and serve than dense models.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~250 words) of opening that signals the Phase 10 transition.

**Sample opening** — rewrite in chapter voice:

> Chapter 10 closed the training-side arc. We now know how to *train* a dense transformer at any scale. Chapters 11 and 12 cover the major architectural alternatives — variants that change the building block itself, not just how it's trained.
>
> Mixture of Experts is the most consequential architectural change since the original transformer. The intuition is simple: a dense feed-forward layer uses *all* its parameters for *every* token. That couples parameter count to FLOPs per token — doubling parameters doubles compute. MoE breaks this coupling by replacing the dense FFN with many small "expert" sub-networks plus a **router** that picks which experts handle each token. Total parameters can grow large while compute per token stays small.
>
> The pattern was proposed in 2017 (Shazeer et al.) and gradually became dominant: Switch Transformer (2021), GLaM (2021), Mixtral 8x7B (2024), DeepSeek-V3 (2024). GPT-4 is reportedly MoE. Mixtral 8x7B has 46.7B total parameters but uses only ~12.9B per token — outperforming Llama-2 70B at fraction of inference cost. This chapter explains how MoE works, why it's hard to train, and the modern variants that have made it production-viable.

### Section 1: The setup — scaling parameters without scaling FLOPs

**Heading:** `## The setup — scaling parameters without scaling FLOPs`
**Word target:** ~400

**Teaching beats:**
1. **The fundamental scaling problem of dense models**: parameters and FLOPs per token are coupled. A 70B model uses 70B parameters per token. A 700B model uses 700B per token. **Inference cost scales linearly with total parameters.**
2. **The MoE solution**: not every parameter contributes to every token. **Sparse activation.** A model can have $N$ "experts" but only $k$ of them are computed per token. Total params = $N$ × expert size; active params per token = $k$ × expert size. **Decouples capacity from compute.**
3. **The intuition is biological**: human brains don't activate all neurons for every thought. Different brain regions handle different tasks. MoE applies this principle to transformers — specialized experts emerge through training.
4. **The economic argument**: at inference time, **active parameters drive cost**, not total parameters. MoE wins on quality-per-inference-cost. Mixtral 8x7B at ~12.9B active params often beats Llama-2 70B at 70B active params.

**Required callout** — type `note`: Phase 10 transition. Phase 9 was the contiguous training arc (data, loop, scaling, infrastructure). Phase 10 is thematic — each chapter (Ch 11-12) covers a major architectural alternative to the standard dense transformer. Both chapters are largely independent; readers can pick based on interest.

**No code in this section.** Motivational setup.

**Connection forward:** section 2 introduces the MoE block — the architectural piece that makes sparse activation possible.

### Section 2: The MoE block — router + experts

**Heading:** `## The MoE block — router + experts`
**Word target:** ~700
**Sub-headings:** `### What changes`, `### The mathematics`

**Teaching beats:**

**What changes:**
1. The standard transformer block (Ch 5): Attention → LayerNorm → **FFN** → LayerNorm.
2. The MoE block: Attention → LayerNorm → **MoE layer** → LayerNorm.
3. **The only difference**: replace one dense FFN with the MoE pattern. Attention, residuals, layer norms — all unchanged.
4. **The MoE layer** has two components: a small **router** (gating network) and $N$ separate **experts**, each itself a FFN.
5. **The router** decides which experts to use for each token; the **experts** are the actual computation.

**The mathematics:**
6. For a standard FFN: $\text{FFN}(x) = W_2 \cdot \text{GeLU}(W_1 x)$. One computation, all parameters used.
7. For an MoE layer: $\text{MoE}(x) = \sum_{i \in \text{top}_k} g_i(x) \cdot \text{FFN}_i(x)$ where the router computes $g(x) = \text{softmax}(W_r x)$ and only the top-$k$ experts contribute.
8. **Critical**: only $k$ of $N$ FFNs are actually computed. The others contribute zero. **FLOPs per token = $k$ × FFN cost**, *independent of total $N$.*

**Required equation block** with label `11.moe`:

```mdx
<Equation label="11.moe">
$$\text{MoE}(x) = \sum_{i \in \text{top}_k(\ell)} g_i(x) \cdot \text{FFN}_i(x), \quad g_i(x) = \text{softmax}(W_r x)_i$$
</Equation>

The router $W_r$ produces logits $\ell = W_r x$. Top-$k$ selects the $k$ largest logits' indices; softmax over only these produces gate values $g_i(x)$ that sum to 1 across selected experts. Each selected expert $\text{FFN}_i$ runs; outputs are weighted-summed.
```

**Required callout** — type `warning`: MC1 from research.md. "MoE has more parameters → more compute per token." Wrong. **MoE decouples parameters from compute**. Total parameters scale with $N$ (number of experts), but FLOPs per token scale with $k$ (top-$k$ active experts). Doubling $N$ doubles total parameters and **does not change FLOPs per token**. This decoupling is the entire reason MoE matters.

**Required code** — `<RunnableCode>` with MoE forward pass:

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def moe_forward(x, router_W, expert_W1s, expert_W2s, k=2):
    """
    MoE forward pass for a sequence of tokens.
    
    x:           (seq_len, d_model) — input
    router_W:    (num_experts, d_model)
    expert_W1s:  (num_experts, d_ffn, d_model)
    expert_W2s:  (num_experts, d_model, d_ffn)
    k:           top-k routing
    """
    seq_len, d_model = x.shape
    num_experts = router_W.shape[0]

    # Router logits per token
    router_logits = x @ router_W.T   # (seq_len, num_experts)

    # Top-k selection per token
    top_k_indices = np.argsort(router_logits, axis=-1)[:, -k:][:, ::-1]
    top_k_logits = np.take_along_axis(router_logits, top_k_indices, axis=-1)
    gates = softmax(top_k_logits, axis=-1)   # (seq_len, k)

    # Combine top-k expert outputs
    output = np.zeros_like(x)
    for t in range(seq_len):
        for j in range(k):
            expert_idx = top_k_indices[t, j]
            gate = gates[t, j]
            h = np.maximum(x[t] @ expert_W1s[expert_idx].T, 0)   # ReLU
            expert_out = h @ expert_W2s[expert_idx].T
            output[t] += gate * expert_out

    return output, top_k_indices, gates

# Demo: 4 experts, top-2 routing
np.random.seed(42)
d_model, d_ffn, num_experts, seq_len = 32, 64, 4, 6

x = np.random.normal(0, 1, (seq_len, d_model))
router_W = np.random.normal(0, 0.1, (num_experts, d_model))
expert_W1s = np.random.normal(0, 0.1, (num_experts, d_ffn, d_model))
expert_W2s = np.random.normal(0, 0.1, (num_experts, d_model, d_ffn))

output, indices, gates = moe_forward(x, router_W, expert_W1s, expert_W2s, k=2)

print(f"Top-2 expert indices per token:")
for t in range(seq_len):
    print(f"  Token {t}: experts {indices[t].tolist()} with gates {gates[t].round(3).tolist()}")

print(f"\nSparsity: {2}/{num_experts} = {2/num_experts:.0%} of experts active per token.")
```

**Connection forward:** section 3 dives deeper into the routing mathematics.

### Section 3: Top-k routing — the gating function

**Heading:** `## Top-k routing — the gating function`
**Word target:** ~700
**Sub-headings:** `### The routing decision`, `### Top-1 vs top-2`, `### Active vs total parameters`

**Teaching beats:**

**The routing decision:**
1. The router is a single linear layer: $W_r \in \mathbb{R}^{N \times d}$. Tiny relative to the experts.
2. For each token $x$, compute logits $\ell = W_r x \in \mathbb{R}^N$ — one logit per expert.
3. **Top-k selection**: pick the $k$ experts with the highest logits. **Discrete decision** — only these $k$ experts will be computed.
4. **Softmax over selected**: normalize the $k$ selected logits to get gate values summing to 1.
5. **Discrete + differentiable**: the top-k operation is non-differentiable, but gradients flow through the soft routing weights $g_i$ that *modulate* expert outputs.

**Top-1 vs top-2:**
6. **Top-1 (Switch Transformer)**: simplest. One expert per token. Gate value is just the softmax probability of the selected expert (or 1.0 in some variants). No convex combination needed.
7. **Top-2 (GLaM, Mixtral)**: two experts per token. More expressive — different experts can contribute differently. Modern standard.
8. **Trade-off**: top-2 doubles FFN FLOPs per token vs top-1. But the small extra cost is worth the quality gain. Most modern MoE uses top-2.

**Active vs total parameters:**
9. **Total parameters**: $N$ experts × per-expert FFN size. For Mixtral 8x7B: 46.7B (8 experts, each contributing ~5.6B to the FFN portion).
10. **Active parameters per token**: $k$ × per-expert FFN size + shared attention + router. For Mixtral: ~12.9B.
11. **Sparsity ratio**: $k / N$. For Mixtral: 2/8 = 25%.
12. **The inference economics**: GPU memory needs *total* parameters (all experts must be loaded). Per-token compute is *active* parameters. **Memory bandwidth and FFN FLOPs are decoupled** — a Mixtral GPU can hold 46.7B params and compute as if only 12.9B exist.

**Required widget placeholder** — MoE Routing Visualizer (marquee, session 51):

```mdx
<WidgetFrame title="MoE routing visualizer" caption="A sequence of tokens flows into an MoE layer with 8 experts. The router computes logits per token; top-2 selection picks the two experts to handle each token. Watch how different tokens route to different expert combinations. The hand-tuned tokens show how experts naturally specialize during training — code tokens to expert 3, factual tokens to expert 5, syntax tokens to expert 1, etc. Adjustable: top-k value (1, 2, or 4); hover any expert for routing statistics.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 51 (marquee)
  </div>
</WidgetFrame>
```

**Required callout** — type `warning`: MC4 from research.md. "Mixtral 8x7B is 56B parameters used per inference." Wrong on both counts. **Total** is 46.7B, not 56B (experts share attention + embedding + output). **Active per token** is ~12.9B (top-2 of 8 experts). The active-per-token number is what determines inference cost — Mixtral is cheaper to run than Llama-2 70B.

**Connection forward:** routing decides who works; but what happens when the router collapses or distributes work unevenly? Section 4.

### Section 4: Load balancing — the practical hard problem

**Heading:** `## Load balancing — the practical hard problem`
**Word target:** ~600
**Sub-headings:** `### Router collapse`, `### The auxiliary loss`

**Teaching beats:**

**Router collapse:**
1. **The problem**: nothing in the architecture forces all experts to be used. Untrained routers tend to send most tokens to a few "favored" experts.
2. **Why it happens**: once expert 0 gets slightly more tokens, it trains faster, becomes better, and the router learns to send even more tokens to it. **Positive feedback loop.** Other experts under-train and get further ignored.
3. **The failure mode**: 7 of 8 experts effectively dead. Model uses only ~1/8 of its capacity. **Defeats the entire purpose of MoE.**
4. **Why this matters more for MoE than dense**: a dense model has no "wasted" parameters; all are always active. MoE's value depends on all experts being trained and useful.

**The auxiliary loss:**
5. The fix is an **auxiliary loss** added to the main training objective.
6. **Switch Transformer's formulation**: $\mathcal{L}_{\text{aux}} = \alpha \cdot N \cdot \sum_i f_i \cdot P_i$ where $f_i$ is the fraction of tokens routed to expert $i$ and $P_i$ is the router's average probability for expert $i$. Minimized when both are uniform ($1/N$).
7. **The coefficient $\alpha$ (~0.01)** balances main task vs balance. Too small: collapse risk. Too large: distorts language modeling.
8. **Limitation**: even with aux loss, imbalance can persist. Frontier MoE training uses additional techniques — router z-loss (ST-MoE), expert dropout, careful initialization. DeepSeek-V3 (Dec 2024) introduced auxiliary-loss-free balancing.

**Required code** — `<RunnableCode>` with aux loss demonstration:

```python
import numpy as np

def aux_load_balance_loss(router_probs, expert_assignments, num_experts, alpha=0.01):
    """
    Switch Transformer auxiliary load balancing loss.
    """
    # f_i: fraction of tokens routed to expert i
    f = np.array([np.mean(expert_assignments == i) for i in range(num_experts)])
    # P_i: average router probability for expert i
    P = np.mean(router_probs, axis=0)
    # Loss
    loss = alpha * num_experts * np.sum(f * P)
    return loss, f, P

np.random.seed(0)
num_experts, num_tokens = 4, 100

# Balanced routing: uniform-ish across experts
balanced_probs = np.random.dirichlet([5.0] * num_experts, size=num_tokens)
balanced_assign = np.argmax(balanced_probs, axis=-1)
loss_bal, f_bal, P_bal = aux_load_balance_loss(balanced_probs, balanced_assign, num_experts)

# Collapsed routing: most tokens → expert 0
collapsed_probs = np.random.dirichlet([10.0, 0.1, 0.1, 0.1], size=num_tokens)
collapsed_assign = np.argmax(collapsed_probs, axis=-1)
loss_col, f_col, P_col = aux_load_balance_loss(collapsed_probs, collapsed_assign, num_experts)

print(f"Balanced routing:")
print(f"  f (token fractions): {f_bal.round(3)}")
print(f"  P (avg router probs): {P_bal.round(3)}")
print(f"  Aux loss: {loss_bal:.5f}\n")

print(f"Collapsed routing (most → expert 0):")
print(f"  f (token fractions): {f_col.round(3)}")
print(f"  P (avg router probs): {P_col.round(3)}")
print(f"  Aux loss: {loss_col:.5f}\n")

print(f"→ Collapsed has higher aux loss → gradient pushes router back toward balance.")
print(f"  This is the central training signal that prevents router collapse.")
```

**Connection forward:** even with balanced routing in expectation, individual batches can be uneven. What happens then? Section 5 — expert capacity.

### Section 5: Expert capacity and dropped tokens

**Heading:** `## Expert capacity and dropped tokens`
**Word target:** ~500

**Teaching beats:**
1. **The setup**: experts must be implemented with a fixed compute budget per batch. Can't dynamically resize. So each expert has a **maximum number of tokens** it processes — its **capacity**.
2. **The capacity formula**: $C = \rho \cdot (T / N)$ where $T$ is total tokens, $N$ is number of experts, $\rho$ is the **capacity factor** (typically 1.0 to 1.25). At $\rho = 1.0$, each expert gets exactly its fair share if routing is perfectly balanced.
3. **What happens when an expert overflows**: extra tokens are **dropped** — they skip the expert and pass through via the residual connection without expert processing.
4. **The cost of drops**: dropped tokens don't get the MoE benefit. Some semantic content goes through "untransformed." Too many drops degrade quality.
5. **The trade-off**: high $\rho$ (e.g., 2.0) reduces drops but wastes compute on empty slots. Low $\rho$ (e.g., 0.5) is efficient but drops more. Typical: $\rho = 1.0$ at inference, $\rho = 1.25$ at training.
6. **Auxiliary loss helps**: the more balanced the routing, the less expert overflow. Balanced routing minimizes both wasted capacity and dropped tokens.

**Required callout** — type `aside`: Dropped tokens are an unusual phenomenon — the model literally skips computation for some tokens. The residual connection saves the day (the token's hidden state passes through unchanged), but the quality cost is real. Modern MoE training carefully tunes capacity to keep drop rates below 1-2%.

**No widget in this section.** Conceptual.

**Connection forward:** with the architecture established, section 6 surveys the modern variants.

### Section 6: Modern MoE variants — Switch, GLaM, Mixtral, DeepSeek-MoE

**Heading:** `## Modern MoE variants`
**Word target:** ~600
**Sub-headings:** `### Switch Transformer (2021)`, `### GLaM (2021)`, `### Mixtral 8x7B (2024)`, `### DeepSeek-MoE (2024)`, `### DeepSeek-V3 (Dec 2024)`

**Teaching beats:**

**Switch Transformer (2021):**
1. **Top-1 routing.** The simplest MoE — one expert per token.
2. **Demonstrated trillion-parameter MoE training.** Showed expert capacity formalism.
3. **Pedagogically clean.** Easy to reason about.

**GLaM (2021):**
4. **Top-2 routing.** More expressive than Switch; small extra compute.
5. **1.2T parameters total**, matched dense models at ~1/3 the FLOPs.
6. **Top-2 became the de facto standard** after GLaM.

**Mixtral 8x7B (2024):**
7. **8 experts per layer, top-2 routing.** 46.7B total params, 12.9B active per token.
8. **The breakthrough open-weights MoE.** Demonstrated MoE at "useful production scale."
9. **Roughly matches Llama-2 70B** at fraction of inference cost.
10. **Made MoE serving infrastructure (vLLM, Mistral.rs)** a first-class concern.

**DeepSeek-MoE (2024):**
11. **Fine-grained experts**: many small experts (256+) instead of fewer large ones.
12. **Shared experts**: some experts always run (capture common features); others routed.
13. **Outperforms standard MoE** at same total parameter count.

**DeepSeek-V3 (Dec 2024):**
14. **671B total, 37B active.** Current open-weights frontier.
15. **Auxiliary-loss-free load balancing** — uses bias adjustment instead of aux loss.

**Required widget placeholder** — Active vs Total Parameters comparison (secondary, session 52):

```mdx
<WidgetFrame title="Active vs total parameters" caption="The inference economics of MoE made concrete. Slide the configuration sliders ($N$ experts, top-$k$, base FFN size, layer count) and see total and active parameters change. Compare against real models: Llama-2 7B/13B/70B (dense, total = active), Mixtral 8x7B, DeepSeek-V3. The chart visualizes the central MoE claim: more total parameters at the same active cost.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 52 (secondary)
  </div>
</WidgetFrame>
```

**Connection forward:** with the variants surveyed, section 7 honestly covers why MoE is harder than dense.

### Section 7: Why MoE is hard — instability, serving, fine-tuning

**Heading:** `## Why MoE is hard`
**Word target:** ~500
**Sub-headings:** `### Training instability`, `### Serving complexity`, `### Fine-tuning is harder`

**Teaching beats:**

**Training instability:**
1. **Router gradients are noisy.** Each token sees only $k$ experts; the routing decision is discrete.
2. **Router z-loss** (ST-MoE 2022): additional penalty on router logit magnitude. Prevents extreme routing.
3. **Numerical precision**: router computations must be in higher precision (FP32) even when the rest of the model is in BF16.
4. **Auxiliary loss tuning**: balancing main vs balance loss is delicate. Wrong $\alpha$ → collapse or distorted training.

**Serving complexity:**
5. **All experts must be loaded into GPU memory** — total parameters drive memory.
6. **Per-batch routing decisions** — every forward pass has unique expert assignments. Batching efficiency matters.
7. **All-to-all collectives** in distributed serving. Network bandwidth matters for inference, not just training.
8. **Specialized inference engines** (vLLM, Mistral.rs, DeepSpeed-MII) needed for efficient MoE serving.

**Fine-tuning is harder:**
9. **Fewer effective samples per expert.** Each expert sees only $1/N$ of the data. Fine-tuning is slower and noisier.
10. **Expert routing can shift** during fine-tuning, especially with small datasets.
11. **Modern remedy**: freeze the router during fine-tuning; train only experts. Or use parameter-efficient methods (Ch 15).

**Required callout** — type `warning`: MC3 from research.md. "MoE always outperforms dense models." Wrong. **MoE wins on parameters-per-FLOP but loses on parameters-per-quality.** At the *same training compute*, MoE typically matches or modestly beats dense. But the quality scaling per *parameter* is worse — a 100B MoE doesn't necessarily beat a 100B dense model. The right comparison is at the same compute, not the same parameter count.

**Required callout** — type `warning`: MC6 from research.md. "MoE replaces dense models." Wrong. **They coexist.** Dense is simpler to train, serve, and fine-tune. MoE is better at very large scale where inference cost dominates. Llama-3 405B is dense; DeepSeek-V3 is MoE. Both are frontier-class models. Choice depends on use case.

**Connection forward:** with MoE characterized, section 8 bridges to Ch 12 (other alternative architectures).

### Section 8: Bridge to alternative architectures

**Heading:** `## What we've covered — and what's next`
**Word target:** ~300

**Teaching beats:**
1. **What this chapter covered**: MoE block, top-k routing math, load balancing via auxiliary loss, expert capacity, modern variants (Switch / GLaM / Mixtral / DeepSeek-MoE), and the practical challenges (training instability, serving complexity, fine-tuning).
2. **Where MoE wins**: very large total parameter counts with manageable inference cost. The "sweet spot" for frontier open-weights models in 2024.
3. **Where MoE loses**: simplicity. If your use case doesn't need >50B effective capacity, dense models are easier and equally good.
4. **Bridge to Ch 12 (alternative architectures)**: MoE keeps the attention mechanism unchanged. Ch 12 covers architectures that *replace* attention — **Mamba** and other state-space models. Different problem, different solution. Together, Ch 11 + 12 = the two major architectural alternatives to standard dense transformers in 2024.

**Sample close** (rewrite in chapter voice):

> MoE has been the most consequential architectural innovation of 2022-2024. Mixtral made it open-source-practical; DeepSeek-V3 pushed it to the frontier. But MoE keeps the underlying attention mechanism intact — it changes *what happens after attention*, not attention itself.
>
> Chapter 12 takes the other path. State-space models like **Mamba** replace attention entirely, trading attention's $O(N^2)$ memory + compute for $O(N)$ throughout. A different bet on what's holding transformers back. The two alternatives — MoE for sparse activation, Mamba for sub-quadratic sequence handling — together cover the major architectural alternatives that have emerged in the last few years.
>
> Phase 10 will conclude with Ch 12. Then Phase 11+ enters post-training (Ch 13-16), where we'll take a *pre-trained* model (dense or MoE) and turn it into something useful — SFT, RLHF, DPO, and the rest of the post-training stack.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 11, slug: 'ch11-moe', title: 'Mixture of Experts', partNum: 4, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch11-moe/index.astro && rm src/pages/ch11-moe/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch11-moe/`** renders with:
   - Chapter eyebrow ("Chapter 11") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 4, and one more if desired — research file includes 3+ candidates)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 6)
   - Labeled equation `<Equation label="11.moe">` in section 2
   - At least 5 callouts spread through the chapter (targeting MC1, MC3, MC4, MC6 from research.md, plus the Phase 10 transition note)
3. **Sidebar:** Ch 1-10 published; Ch 11 active (draft); Ch 12-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 11:** prev = Ch 10 (active); next = Ch 12 (disabled)
6. **TOC on Ch 11** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 4000 and 4800 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 51 and 52 own them.
- ❌ **Do not write exercises.** Session 52 owns (combined with secondary widget).
- ❌ **Do not flip Ch 11's status to `'published'`.** Session 52 owns.
- ❌ **Do not derive the gradient of the routing function.** Implementation detail.
- ❌ **Do not deep-dive into all-to-all NCCL implementation.** Mention it; don't elaborate.
- ❌ **Do not cover Mamba.** Ch 12 owns.
- ❌ **Do not cover post-training of MoE.** Ch 13+ owns.
- ❌ **Do not modify Ch 1-10.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch11-moe/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch11-moe/index.astro 2>/dev/null || true
git commit -m "session 50: Ch 11 prose — Mixture of Experts (router, top-k, load balancing, variants)"
git push origin main
```

---

## Notes for the session author

**On the Phase 10 transition framing:**
Phase 9 was a contiguous arc — Ch 7-10 told one story (data → loop → scaling → infrastructure). Phase 10 is thematic — Ch 11 (MoE) and Ch 12 (Mamba) are largely independent. Readers can choose based on interest. Be explicit about this in the chapter opening — it sets expectations for the post-training phases ahead, which are even more independent.

**On the architectural-voice return:**
Ch 11 is the first chapter to return to "build the architecture" voice since Ch 6. Re-engage that mode — precise math, attention to design choices, equations get labels. But don't go full Ch 5 — MoE has practical engineering concerns (load balancing, capacity, all-to-all) that Ch 5 didn't.

**On the running case study (Mixtral 8x7B):**
Mention Mixtral 8x7B in sections 1, 3, 6, and 7. **The reader should walk away knowing Mixtral's numbers**: 46.7B total / 12.9B active per token, 8 experts top-2. This makes the abstract claim "MoE decouples params from compute" concrete.

**On the Switch / GLaM / Mixtral progression:**
Switch (2021) → GLaM (2021) → Mixtral (2024) is a clean three-step story:
1. Switch: top-1, simplicity, demonstrate sparse scaling
2. GLaM: top-2, the recipe became standard
3. Mixtral: top-2 open-weights, MoE production-ready

Tell this progression in section 6.

**On the honest framing of MoE's limitations:**
The chapter shouldn't oversell MoE. Section 7 is the honest-tradeoffs section. Be specific: training is harder (instability, aux loss tuning), serving is harder (specialized engines), fine-tuning is harder (data per expert is smaller). MoE is a major innovation **with real costs**. Modern systems have learned to manage these, but the costs are real.

**On the 3 runnable code blocks:**
- Section 2 (MoE forward pass): the implementation. Reader sees how routing actually works.
- Section 4 (aux loss): balanced vs collapsed scenarios. Reader sees the loss signal that prevents collapse.
- Optional third: active vs total parameter calculator (could go in section 6). The research file has one ready.

3 blocks is enough; resist the urge to add more.

**On the labeled equation `11.moe`:**
This is the chapter's central equation. Place it in section 2 immediately after the prose description. Reference it elsewhere via `<EqRef label="11.moe" />` if needed.

**Pedagogical claim of the chapter:**
"MoE is the architectural pattern that decouples capacity from compute. By replacing a dense FFN with $N$ experts and routing each token to top-$k$ of them, total parameters scale with $N$ while compute per token scales with $k$. This is the central economic claim of modern open-weights frontier models: Mixtral 8x7B uses 46.7B parameters worth of capacity but only 12.9B parameters worth of compute per token. The practical challenges — load balancing, expert capacity, distributed all-to-all communication — are non-trivial but solvable. Modern MoE training is harder than dense but achievable at the frontier."

**This chapter begins the post-Phase-9 arc.** Pace through Ch 12 (Mamba) similarly — 4-file cadence, mathematically careful, honest about trade-offs. After Phase 10 closes, post-training begins.
