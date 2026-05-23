# Session 41 — Chapter 9 page structure

> First chapter session for Chapter 9 ("Scaling laws and distributed training"). **Two-topic chapter** like Ch 5 and Ch 8: combines the *math of scaling allocation* (Chinchilla) with the *engineering of multi-GPU training* (DP, TP, PP, FSDP). Honest about the field's learning curve — Kaplan 2020 pioneered scaling laws but got the allocation wrong; Chinchilla 2022 corrected; modern frontier models intentionally over-train past Chinchilla for inference economics. Produces the full MDX page: 8 sections, ~4500 words, **3 runnable code blocks** (lighter than Ch 8 — actual parallelism code requires multi-GPU hardware Pyodide doesn't have), and **two widget placeholders**. Uses the **5-file cadence**.

---

## Read first (in this order)

1. **`research/ch09-scaling-and-distributed/research.md`** — the source material. Every derivation, formula, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch08-building-small-llm/session-36-page-structure.md`** — for the two-topic chapter template (Ch 8 established the math + engineering split that Ch 9 follows)
4. **`prompts/chapters/ch07-pretraining-data/session-32-page-structure.md`** — for the engineering-flavored chapter template (lighter on math derivations, heavier on empirical claims with cited results)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 9 page. By end of session:

- `src/pages/ch09-scaling-and-distributed/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch09-scaling-and-distributed/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 9's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch09-scaling-and-distributed/` with sidebar showing Ch 9 active, prev/next nav linking to Ch 8 (active) and Ch 10 (disabled)

**Tonal note:** Ch 9's voice mixes Ch 8's mathematical clarity with Ch 7's empirical pragmatism. Section 3 (Chinchilla) is the mathematical centerpiece; sections 5-7 (parallelism strategies) are engineering pragmatism. The chapter should *not* derive Chinchilla via Lagrangian — state the result, give intuition, work examples. Don't oversell the empirical claims either — be honest that Llama-3 8B is *intentionally* not Chinchilla-optimal.

**Chapter cadence:** Ch 9 uses the **5-file cadence** like Ch 5 and Ch 8 — two genuine topics (scaling-allocation math + distributed-training engineering). Files 58, 59 from the original BUILD_ORDER are absorbed.

---

## Inputs

State of the repo after session 39 (Ch 8 complete):

- Ch 1-8 all `'published'`
- `research/ch09-scaling-and-distributed/research.md` exists
- `src/lib/chapters.ts` has Ch 1-8 `'published'`, Ch 9-30 `'planned'`
- No `src/pages/ch09-scaling-and-distributed/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch09-scaling-and-distributed/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch09-scaling-and-distributed/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 9's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch09-scaling-and-distributed
description: Modern LLMs have 8B-1T parameters and train on trillions of tokens — far beyond a single GPU. This chapter covers two things: (a) how to allocate a fixed compute budget between model size and dataset size (Chinchilla scaling laws), and (b) how to actually train large models across many GPUs (data parallelism, FSDP, tensor parallelism, pipeline parallelism).
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

> Chapter 8's training loop works beautifully on a small model. ~10M-100M parameters, one GPU, hours of training. Modern frontier LLMs are not small. Llama-3 has 8B-405B parameters; GPT-4 reportedly has trillion-plus. They train on trillions of tokens. A single GPU's memory holds, at best, a few billion parameters in mixed precision — and training requires *additional* memory for gradients, optimizer state, and activations. The single-GPU loop doesn't scale.
>
> This chapter handles two questions about scale. The first is *what should you train?* Given a fixed compute budget — say, 10²³ FLOPs — should you train a small model for a long time or a large model briefly? The Chinchilla scaling laws give a surprising answer: roughly 20 tokens per parameter, with both model size and training tokens scaling together. Pre-2022 models (GPT-3, Gopher, PaLM) violated this — they were significantly undertrained. Modern models (Llama-2 onward) fix it. And then *intentionally* over-train smaller models past Chinchilla-optimal for inference economics.
>
> The second question: *how do you actually train at scale?* Data parallelism, tensor parallelism, pipeline parallelism, FSDP. Four parallelism strategies that combine into "3D parallelism" for the largest models. After this chapter, you can read the system diagrams of GPT-4-scale training runs and understand them. Chapter 10 continues with the systems engineering of running those clusters.

### Section 1: The setup — single GPU isn't enough

**Heading:** `## The setup — single GPU isn't enough`
**Word target:** ~400

**Teaching beats:**
1. **The memory math**: a 7B parameter model in BF16 weighs ~14 GB. Add gradients (~14 GB), optimizer state (m + v for AdamW = ~28 GB in FP32), activations for backward (~10-20 GB depending on context length). Total: ~70 GB just for the training state.
2. **Single-GPU memory limits**: A100 has 40-80 GB; H100 has 80 GB. A 7B model is borderline fit on a single H100. A 70B model definitely doesn't fit.
3. **Time math**: Even if memory fit, training time scales with FLOPs / GPU-throughput. 70B model on 1T tokens at H100 speeds = months of single-GPU compute.
4. **Two distinct problems**: memory (can't fit) and time (can't wait). The solutions overlap but require different techniques.
5. **What the chapter covers**: first, the math of choosing what to train (sections 2-3); then the engineering of distributing across GPUs (sections 4-7).

**No code in this section.** Setup and motivation.

**Connection forward:** section 2 starts with the first scaling laws.

### Section 2: The first scaling laws (Kaplan 2020)

**Heading:** `## The first scaling laws — Kaplan 2020`
**Word target:** ~500

**Teaching beats:**
1. **Kaplan et al. 2020** trained transformers across a range of sizes and dataset sizes. Discovered that loss decreases predictably with model size $N$, dataset size $D$, and compute $C$ — following *power laws*.
2. **The headline finding**: loss is *jointly* limited by model size and data size, but Kaplan's analysis suggested most compute should go to making the model larger (with comparatively less data).
3. **Kaplan's recommendation**: $N \propto C^{0.73}$, $D \propto C^{0.27}$. **Most compute → model size; relatively little → more training data.**
4. **Impact on the field**: GPT-3 (175B params, 300B tokens, ratio ~1.7 tokens/param), Gopher (280B/300B = ~1 ratio), Megatron-Turing (530B/270B = 0.5 ratio), PaLM (540B/780B = 1.4 ratio). All followed Kaplan's recommendation: huge models, comparatively few tokens.
5. **The problem**: Kaplan's experimental design used a *fixed number of training steps* regardless of model size. Larger models were effectively under-trained. The recommendation was an artifact of the experimental setup, not the underlying scaling behavior.

**Required callout** — type `note`: this section presents Kaplan 2020 as the field's first attempt. The recommendation was *partially* wrong, but the *framework* — using power laws to predict loss — was foundational. Every subsequent scaling analysis builds on this paper's vocabulary.

**No code in this section.** Historical context, no math required at this point.

**Connection forward:** section 3 — the Chinchilla correction.

### Section 3: The Chinchilla correction (Hoffmann 2022)

**Heading:** `## The Chinchilla correction — Hoffmann 2022`
**Word target:** ~800 — CENTRAL DERIVATION
**Sub-headings:** `### The new experiment`, `### The scaling-law equation`, `### Compute-optimal allocation`, `### The 20-tokens-per-parameter rule`

**Teaching beats:**

**The new experiment:**
1. Hoffmann et al. 2022 redid the experiments with better methodology — *each model trained to convergence* rather than fixed steps.
2. They trained 400+ language models across model sizes and token counts; fit a parametric loss equation.
3. **The empirical demonstration**: trained Chinchilla (70B params, 1.4T tokens) — outperformed DeepMind's earlier Gopher (280B params, 300B tokens) despite being 4× smaller. *Same training compute*; better results from balanced allocation.

**The scaling-law equation:**
4. The fitted loss equation:

```mdx
<Equation label="9.chinchilla">
$$L(N, D) = E + \frac{A}{N^\alpha} + \frac{B}{D^\beta}$$
</Equation>
```

With fitted values: $E \approx 1.69$ (irreducible loss — natural language entropy), $A \approx 406, B \approx 410$, $\alpha \approx 0.34, \beta \approx 0.28$.

5. **Interpretation**: loss has three sources — irreducible language entropy ($E$), insufficient model capacity ($A/N^\alpha$), and insufficient training data ($B/D^\beta$). Each error term decays as a power law.

**Compute-optimal allocation:**
6. Training a model of size $N$ on $D$ tokens costs ~$6ND$ FLOPs. (Forward: $2ND$. Backward: $4ND$.)
7. **The optimization problem**: minimize $L(N, D)$ subject to $6ND = C$ for a given compute budget $C$.
8. **The solution** (skipping Lagrangian derivation): $N \propto C^a, D \propto C^{1-a}$ where $a = \beta/(\alpha+\beta) \approx 0.45$. So $N \propto C^{0.45}, D \propto C^{0.55}$. **Both scale together** — neither dominates.

**The 20-tokens-per-parameter rule:**
9. For typical compute budgets in the GPT-3 era, the compute-optimal $D/N \approx 20$ — *20 tokens per parameter*. This is the "rule of thumb" everyone remembers from Chinchilla.
10. **Practical use**: given a compute budget, compute $N_{\text{opt}}$ and $D_{\text{opt}}$; train that-sized model on that many tokens. Use Chinchilla as the *starting* allocation; tune from there.

**Required widget placeholder** — Scaling Law Calculator (marquee, session 42):

```mdx
<WidgetFrame title="Scaling law calculator" caption="The Chinchilla loss surface, plus the compute-optimal allocation curve. Adjust your compute budget; see what model size and dataset size you should choose. The 'compute-optimal point' is highlighted; off-optimal choices (Kaplan-style, Llama-3-style) show how much loss is left on the table — or intentionally accepted for other reasons.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 42 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with the Chinchilla loss + optimal allocation:

```python
import numpy as np

# Chinchilla fitted constants (approximate, from Hoffmann et al. 2022)
E, A, B = 1.69, 406.0, 410.0
ALPHA, BETA = 0.34, 0.28

def chinchilla_loss(N, D):
    """Expected loss for model size N and dataset size D, per Chinchilla."""
    return E + A / (N ** ALPHA) + B / (D ** BETA)

def compute_optimal(C):
    """Given compute budget C (FLOPs), return (N_opt, D_opt, predicted_loss)."""
    a = BETA / (ALPHA + BETA)
    # Fit constants for the proportionality
    k_N, k_D = 0.6, 1.7
    N_opt = k_N * (C / 6) ** a
    D_opt = k_D * (C / 6) ** (1 - a)
    return N_opt, D_opt, chinchilla_loss(N_opt, D_opt)

# Example: GPT-3-scale compute
print(f"{'Compute (FLOPs)':>18} {'N (params)':>15} {'D (tokens)':>15} {'D/N':>8} {'Loss':>7}")
print("-" * 70)
for C in [1e22, 1e23, 6e23, 1e24, 3e25]:
    N_opt, D_opt, L_opt = compute_optimal(C)
    print(f"{C:>18.1e} {N_opt:>15.2e} {D_opt:>15.2e} {D_opt/N_opt:>8.1f} {L_opt:>7.3f}")
```

**Required callout** — type `warning`: MC1 from research.md. "Bigger models are always better." Wrong — **only if you have matching data and compute**. Chinchilla showed GPT-3 (175B params, 300B tokens) was significantly undertrained. A 70B model on 1.4T tokens at the same compute outperforms it. **Compute-optimal is what matters**; size for its own sake wastes training compute.

**Required callout** — type `aside`: MC3 from research.md. **Llama-3 8B trained on 15T tokens** — about 100× past Chinchilla-optimal for its size. Why? Because smaller models cost less at inference. Modern frontier models intentionally over-train smaller architectures past Chinchilla-optimal for *deployment* economics. The "Chinchilla rule" is now a *lower bound* on training tokens, not the optimum.

**Connection forward:** with the math of allocation settled, the engineering question becomes: how do you actually train a 70B-parameter model that won't fit on one GPU?

### Section 4: Why distribute — three reasons

**Heading:** `## Why distribute — three reasons`
**Word target:** ~400

**Teaching beats:**
1. **Reason 1 — memory**: the model + gradients + optimizer state + activations exceed one GPU's RAM. For a 70B model in mixed precision with AdamW: ~700 GB total state. Won't fit on even an H100 (80 GB).
2. **Reason 2 — speed**: even if memory fit, training time scales with FLOPs / throughput. A 70B model on 1.4T tokens at H100 peak speed (~1000 TFLOPS) = years of single-GPU compute.
3. **Reason 3 — batch size**: language modeling benefits from large batches. To get reasonable per-step token counts, you need many GPUs processing in parallel.
4. **Three distinct parallelism strategies** address these reasons (often combined): data parallelism (DP), model parallelism (MP — both tensor and pipeline), and sharded data parallelism (FSDP). Sections 5-7 cover each.

**No code in this section.** Conceptual setup.

**Connection forward:** section 5 introduces the simplest case: data parallelism.

### Section 5: Data parallelism — the simple case

**Heading:** `## Data parallelism — the simple case`
**Word target:** ~700
**Sub-headings:** `### How DP works`, `### The all-reduce`, `### Scaling limits`

**Teaching beats:**

**How DP works:**
1. Each GPU holds a *complete copy* of the model parameters.
2. The training batch is *sharded* — each GPU processes a different micro-batch.
3. After each GPU computes its loss + gradients, gradients are **averaged across all GPUs** via an all-reduce operation.
4. Optimizer step happens on every GPU in lockstep, using the averaged gradients.
5. **Result**: all GPUs end the step with identical parameters (modulo floating-point noise).

**The all-reduce:**
6. **All-reduce** is a collective operation: every GPU contributes a tensor; the reduced result is available on every GPU.
7. The efficient implementation (ring all-reduce) costs $2 \cdot (n-1)/n \cdot \text{model\_size}$ in communication — roughly $2 \cdot \text{model\_size}$ for large $n$.
8. **Important nuance**: this all-reduce happens on *every step* and includes the entire model. Communication time scales with model size and stays roughly constant per step (independent of GPU count).

**Scaling limits:**
9. **Memory**: DP replicates the model on every GPU. Doesn't help with the memory problem — every GPU still needs to hold the full model + state.
10. **Speed**: DP linearly speeds up *compute*, but communication becomes the bottleneck at large GPU counts. Past ~1000 GPUs, gradient all-reduce dominates step time.
11. **The hard ceiling**: DP can't train a model bigger than fits on one GPU.

**Required code** — `<RunnableCode>` with a DP gradient all-reduce sketch:

```python
import numpy as np

def simulate_data_parallel_step(model_grads_per_rank):
    """
    Simulate a data-parallel gradient all-reduce.
    
    Input: list of gradient arrays, one per rank (simulated GPU).
    Output: averaged gradients (would be identical on every rank).
    """
    # Stack along a new axis, then take the mean
    stacked = np.stack(model_grads_per_rank, axis=0)
    averaged = np.mean(stacked, axis=0)
    return averaged

# Demo: 4 simulated GPUs, each with different gradients
n_params = 100
rank_grads = [
    np.random.normal(0, 1, n_params),   # GPU 0
    np.random.normal(0, 1, n_params),   # GPU 1
    np.random.normal(0, 1, n_params),   # GPU 2
    np.random.normal(0, 1, n_params),   # GPU 3
]

averaged = simulate_data_parallel_step(rank_grads)

print(f"GPU 0 mean grad: {np.mean(rank_grads[0]):>+.4f}")
print(f"GPU 1 mean grad: {np.mean(rank_grads[1]):>+.4f}")
print(f"GPU 2 mean grad: {np.mean(rank_grads[2]):>+.4f}")
print(f"GPU 3 mean grad: {np.mean(rank_grads[3]):>+.4f}")
print(f"\nAveraged grad:   {np.mean(averaged):>+.4f}")
print(f"(Each GPU will use this averaged gradient for its optimizer step)")
print(f"\nCommunication cost per step: ~2 * model_size = ~{2 * n_params * 4} bytes (FP32)")
```

**Required callout** — type `warning`: MC4 from research.md. "Data parallelism scales to any number of GPUs." Wrong — DP scales until the gradient all-reduce becomes bandwidth-bound. Past ~1000 GPUs on cross-node networks (InfiniBand), gradient communication dominates step time. **DP alone doesn't scale to frontier-model training**. The other parallelism strategies (TP, PP, FSDP) exist to handle this.

**Connection forward:** if DP can't break the per-GPU memory ceiling, we need to actually split the model. Section 6 covers two strategies.

### Section 6: Model parallelism — tensor and pipeline

**Heading:** `## Model parallelism — tensor and pipeline`
**Word target:** ~800
**Sub-headings:** `### Tensor parallelism (Megatron)`, `### Pipeline parallelism (GPipe)`, `### The tradeoff`

**Teaching beats:**

**Tensor parallelism (Megatron-LM, Shoeybi et al. 2019):**
1. **Split individual layer operations across GPUs.** Each GPU holds a slice of the layer's parameters and computes a slice of the output.
2. **The Megatron recipe for FFN**: split the first linear layer along the *column* dimension (so each GPU computes a chunk of the $4d$ hidden activations). Then split the second linear layer along the *row* dimension. After the second linear, all-reduce the results across TP ranks to recover the full output.
3. **For attention**: split QKV along the head dimension (different heads on different GPUs). Output projection requires all-reduce.
4. **Per-layer communication**: each layer requires one all-reduce of the activation. High bandwidth required — TP usually limited to within a node (typically TP-rank = 2, 4, or 8).

**Pipeline parallelism (GPipe, Huang et al. 2019):**
5. **Different layers live on different GPUs.** GPU 0 holds layers 1-4; GPU 1 holds layers 5-8; etc.
6. **Forward pass**: activation flows from GPU 0 → GPU 1 → ... → GPU N. Pipeline depth = number of stages.
7. **Backward pass**: gradients flow in reverse.
8. **The pipeline bubble**: at the start of training, only GPU 0 is busy (others wait for input). At the end of each backward pass, only later GPUs are busy. Idle time = "bubble"; reduces efficiency.
9. **Mitigation — micro-batches**: split each batch into many micro-batches; feed them through the pipeline. With $N$ stages and $M$ micro-batches, bubble fraction $\approx (N-1)/(M+N-1)$. To minimize bubble: $M \gg N$.

**The tradeoff:**
10. **TP**: low memory per GPU, high per-layer communication. Best within nodes (NVLink).
11. **PP**: lower communication (only at stage boundaries), but pipeline bubble. Best across nodes.
12. **Combined**: TP within nodes + PP across nodes is the standard pattern for >10B-parameter models.

**Required widget placeholder** — Parallelism diagram (secondary, session 43):

```mdx
<WidgetFrame title="Parallelism strategies" caption="How a single forward pass distributes across multiple GPUs under DP, TP, PP, and FSDP. Toggle between strategies to see how data flows, which GPUs hold which parameters, and where communication happens. Animation shows one micro-batch flowing through the architecture.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 43 (secondary)
  </div>
</WidgetFrame>
```

**Required callout** — type `warning`: MC6 from research.md. "Tensor parallelism is just sharding the model across GPUs." Wrong — TP specifically splits **operations** along carefully-chosen dimensions to minimize communication. Megatron-LM's column-row pattern lets the all-reduce happen *only at certain points*, not every operation. Naive sharding doesn't work.

**Required callout** — type `aside`: MC7 from research.md. "Pipeline parallelism is free model splitting." Wrong — PP has the pipeline bubble. The fraction of idle time grows with pipeline depth and shrinks with micro-batch count. Modern schedules (1F1B, interleaved 1F1B) reduce bubbles to <10% at scale, but they require careful scheduling.

**Connection forward:** there's a third way — keeping the simplicity of DP while still sharding state. Section 7 covers FSDP.

### Section 7: FSDP — the modern default

**Heading:** `## FSDP — the modern default`
**Word target:** ~600
**Sub-headings:** `### The motivation`, `### How FSDP works`, `### When to use what`

**Teaching beats:**

**The motivation:**
1. Vanilla DP wastes memory by replicating everything: model + gradients + optimizer state, on every GPU.
2. For a 7B model with AdamW in mixed precision: ~70 GB per GPU just for state. Barely fits on H100.
3. **The insight**: if the work is sharded across DP ranks anyway, why replicate the state? Shard the state too.

**How FSDP works (ZeRO-3):**
4. Each GPU stores only **1/N** of each layer's parameters (where N = number of DP ranks).
5. **Before computing layer L's forward pass**: all-gather layer L's parameters from all DP ranks. Now every GPU has the full layer L params *temporarily*.
6. **Compute** the forward pass for layer L.
7. **Discard** the gathered parameters; keep only the local shard.
8. **After the backward pass for layer L**: reduce-scatter the gradients to the appropriate ranks.
9. **Result**: each GPU only stores a 1/N shard of the model + grads + optimizer state. Massive memory reduction.

**When to use what:**
10. **Small model (<1B), few GPUs**: vanilla DP. Simple, low overhead.
11. **Medium model (1B-30B), many GPUs**: FSDP. Memory savings outweigh communication overhead.
12. **Large model (30B+)**: FSDP + TP (within nodes). Memory + communication considerations both matter.
13. **Frontier scale (100B+)**: 3D parallelism (DP + TP + PP), all three combined. Example from Megatron-Turing 530B: 8-way TP × 35-way PP × 64-way DP = 17,920 GPUs.

**Required code** — `<RunnableCode>` with FSDP wrapper sketch:

```python
# Illustrative FSDP setup (would need actual multi-GPU env to run).
# This shows how the API wraps an existing model — the training loop is essentially the same as Ch 8.

# import torch
# import torch.distributed as dist
# from torch.distributed.fsdp import FullyShardedDataParallel as FSDP
# from torch.distributed.fsdp import MixedPrecision

# # Initialize process group (typically via launcher: torchrun)
# dist.init_process_group(backend='nccl')
# local_rank = int(os.environ['LOCAL_RANK'])
# torch.cuda.set_device(local_rank)

# # Build the model — same model class as Ch 8
# model = GPT(vocab_size=50257, d_model=4096, n_heads=32, n_layers=32)

# # Wrap with FSDP
# model = FSDP(
#     model,
#     mixed_precision=MixedPrecision(
#         param_dtype=torch.bfloat16,
#         reduce_dtype=torch.bfloat16,
#         buffer_dtype=torch.bfloat16,
#     ),
#     device_id=local_rank,
# )

# # Optimizer + training loop are exactly the same as Ch 8
# optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, betas=(0.9, 0.95))

# for step in range(total_steps):
#     x, y = get_batch()
#     logits = model(x)
#     loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
#     optimizer.zero_grad()
#     loss.backward()   # FSDP handles gradient reduce-scatter automatically
#     torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
#     optimizer.step()

# Key point: the Ch 8 training loop is essentially unchanged.
# FSDP wraps the model; the rest of the code is identical.
# The "magic" happens inside the FSDP wrapper — all-gather before forward, reduce-scatter after backward.

print("(Code above is illustrative; requires multi-GPU env to run)")
print("Compare with Ch 8 section 7: the training loop is essentially unchanged.")
print("The FSDP wrapper handles the sharding internally.")
```

**Required callout** — type `note`: MC5 from research.md. **FSDP is not just data parallelism with extra steps.** Vanilla DP replicates the model, gradients, and optimizer state on every GPU. FSDP shards all three. A model that wouldn't fit in vanilla DP can fit in FSDP. The "extra steps" (all-gather params, reduce-scatter grads) are not optional — they're the entire point of memory savings.

**Connection forward:** the parallelism strategies are in place. Section 8 looks ahead.

### Section 8: Bridge to infrastructure

**Heading:** `## What we've built — and what's next`
**Word target:** ~300

**Teaching beats:**
1. **What you have after this chapter**: a complete mental model for scaling. You know how to choose model size + dataset size given a compute budget (Chinchilla). You know how to distribute training across many GPUs (DP, TP, PP, FSDP). You can read system diagrams of GPT-4-scale training runs.
2. **What's still missing**: the systems engineering of *running* these clusters. Cluster orchestration, NCCL configuration, CUDA streams, Triton kernel development, debugging at scale. Ch 10 covers this.
3. **The honest distinction**: this chapter's content is *core knowledge* for understanding modern LLM training. Ch 10's content is *practical depth* — useful but optional for most readers.
4. **The full Phase 9 picture**: Ch 7 (data) + Ch 8 (training loop) + Ch 9 (scaling + distribution) + Ch 10 (infrastructure) = the complete training-side story.

**Sample close** (rewrite in chapter voice):

> Nine chapters in, you have the full mental model of LLM training. You understand the architecture (Ch 1-6), the data (Ch 7), the training loop (Ch 8), and the scaling math + parallelism (this chapter). With these chapters, you can read the system diagram for any modern LLM training run — Llama-3, GPT-4-class, Chinchilla — and understand what's happening at every level.
>
> Chapter 10 will dive into the systems engineering. GPU clusters, NCCL collectives, Triton kernels — the practical reality of running a training cluster. Less conceptual; more "how things work in production." After Ch 10, the training side of the tutorial is complete, and we move on to post-training (Ch 13+) and inference (Ch 17+).

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 9, slug: 'ch09-scaling-and-distributed', title: 'Scaling laws and distributed training', partNum: 3, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch09-scaling-and-distributed/index.astro && rm src/pages/ch09-scaling-and-distributed/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch09-scaling-and-distributed/`** renders with:
   - Chapter eyebrow ("Chapter 9") + h1 + description
   - 8 h2 sections in the order specified
   - Equations render via KaTeX; labeled equation `<Equation label="9.chinchilla">` is present
   - **3 `<RunnableCode>` blocks** (sections 3, 5, 7) — lighter than Ch 8 because multi-GPU code can't run in Pyodide
   - 2 `<WidgetFrame>` placeholders (sections 3 and 6)
   - At least 5 callouts spread through the chapter (targeting MC1, MC4, MC5, MC6, MC7 from research.md)
3. **Sidebar:** Ch 1-8 published; Ch 9 active (draft); Ch 10-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 9:** prev = Ch 8 (active); next = Ch 10 (disabled)
6. **TOC on Ch 9** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 4200 and 5200 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 42 and 43 own them.
- ❌ **Do not write exercises.** Session 44 owns.
- ❌ **Do not flip Ch 9's status to `'published'`.** Session 44 owns.
- ❌ **Do not derive Chinchilla via Lagrangian.** State the result; give intuition; work examples. The original paper provides full derivation for those who want it.
- ❌ **Do not cover Triton kernels or GPU systems engineering.** Ch 10 owns.
- ❌ **Do not cover MoE — sparse parallelism.** Ch 11 owns.
- ❌ **Do not modify Ch 1-8.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch09-scaling-and-distributed/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch09-scaling-and-distributed/index.astro 2>/dev/null || true
git commit -m "session 41: Ch 9 prose — Chinchilla scaling laws + DP/TP/PP/FSDP distributed training"
git push origin main
```

---

## Notes for the session author

**On the lighter code count:**
Ch 9 has 3 runnable code blocks vs Ch 8's 6. Multi-GPU code requires hardware that Pyodide doesn't have, so most parallelism code can't be executed in the browser. The chapter relies on:
- 1 numerical block (Chinchilla loss + optimal allocation — runs in Pyodide)
- 1 simulation block (DP all-reduce on synthetic gradients — runs in Pyodide)
- 1 illustrative block (FSDP wrapper — pseudo-code, doesn't execute)

This is honest about Pyodide's limits. The widget in session 43 (parallelism diagram) compensates with visual demonstration of what the code would do.

**On the Llama-3 framing:**
The chapter says Llama-3 8B was trained ~100× past Chinchilla-optimal — *intentionally*. This is important: the chapter doesn't paint Chinchilla as wrong or Llama-3 as broken. Both are correct given different optimization objectives:
- Chinchilla: minimize loss given training compute
- Llama-3: minimize *deployment cost* (smaller model = cheaper inference) given a target capability

Frame the "Chinchilla rule" as a *lower bound* on training tokens for any model that will be deployed.

**On the equation label:**
`<Equation label="9.chinchilla">` is the only labeled equation in this chapter. Future chapters (especially Ch 11 on MoE, Ch 13+ on post-training) may reference it. The label is intentionally descriptive ("chinchilla" not just a number) for human readability when reading source.

**On the widget placements:**
- Section 3 (marquee — Scaling Law Calculator): the chapter's *math centerpiece*. After the reader sees the equation and the optimal allocation, the widget lets them explore the loss surface and see the optimum for themselves.
- Section 6 (secondary — Parallelism Diagram): placed at the *engineering centerpiece*. Section 6 introduces TP + PP, the parallelism strategies most often confused. The widget visualizes all four parallelism types so the reader can compare.

The pattern: marquee at the chapter's first big concept (Chinchilla); secondary at the chapter's first big engineering pattern (model parallelism).

**On the empirical tone of sections 4-7:**
These sections are about engineering trade-offs, not mathematical derivations. The voice should be that of someone who's seen these systems work and break — pragmatic, opinionated about trade-offs, willing to say "use FSDP for this; use 3D parallelism for that." Less proof-style; more "here's what works."

**Pedagogical outcomes for the reader.** After Ch 9, the reader should be able to:
1. State the Chinchilla scaling law equation
2. Compute compute-optimal $N, D$ given a FLOP budget
3. Explain Llama-3's "over-trained" choice as inference-economic, not Chinchilla violation
4. Distinguish DP, TP, PP — what each splits, what each communicates
5. Explain FSDP and why it's the modern default for >1B models
6. Identify the communication primitive (all-reduce, all-gather, reduce-scatter) used by each strategy
7. Reason about communication bottlenecks at different scales

Seven outcomes. The exercises in session 44 will explicitly serve outcomes 1, 2, 4, and 5.

**This chapter completes the "core training" arc.** Ch 7 + Ch 8 + Ch 9 = how LLMs actually get trained at scale. Ch 10 is practical depth. After Ch 9, the reader can claim "I understand how LLMs train" — not just conceptually but with the specific math (Chinchilla) and engineering (FSDP) of modern practice.
