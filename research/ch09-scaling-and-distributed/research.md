# Chapter 9 — Scaling laws and distributed training: research

> Curated source material for Chapter 9's build sessions. The chapter where Ch 8's training loop scales from one GPU to thousands. Two distinct topics: **scaling laws** (how to allocate a fixed FLOP budget between model size and dataset size) and **distributed training** (how to actually run training across many GPUs). The math of scaling laws (Hoffmann et al. 2022, "Chinchilla") tells you what to train; the engineering of distributed training (data parallelism, FSDP, tensor parallelism, pipeline parallelism) tells you how to do it. Both pieces are essential for modern LLM training at scale.

> Like Ch 5 and Ch 8, this is a **two-topic chapter** and uses the **5-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Scaling laws and distributed training

**Premise:** Ch 8's training loop works on one GPU for small models. Modern LLMs have 8B-1T parameters and train on trillions of tokens — far beyond a single GPU. This chapter covers two things: (a) how to decide *what* to train (Chinchilla scaling laws: given a compute budget, how big should the model be and how many tokens should it see?) and (b) how to actually train large models on many GPUs (data parallelism, model parallelism, FSDP).

**Out of scope (other chapters):**
- The training loop itself (Ch 8)
- Pre-training data construction (Ch 7)
- GPU systems engineering, Triton kernels (Ch 10)
- MoE architectures (Ch 11)
- Post-training (Ch 13-15)

**In scope and locked:**
- **The original scaling laws** (Kaplan et al. 2020) — and why they were wrong
- **Chinchilla scaling laws** (Hoffmann et al. 2022) — the compute-optimal claim: ~20 tokens per parameter
- **The scaling-law equation**: $L(N, D) = E + A/N^\alpha + B/D^\beta$
- **Choosing model size + dataset size** given a compute budget
- **Why distribute**: model/data don't fit on one GPU; want to train faster
- **Data parallelism (DP)**: each GPU has the full model; data sharded; gradients all-reduced
- **Model parallelism (MP)** — two flavors:
  - **Tensor parallelism (TP)**: split single layers across GPUs (Megatron-style)
  - **Pipeline parallelism (PP)**: different layers on different GPUs (GPipe-style)
- **FSDP / ZeRO**: shard model parameters, gradients, optimizer state across all GPUs
- **3D parallelism**: combining DP + TP + PP for very large models
- **Communication patterns and bottlenecks**

**Suggested chapter structure** (8 sections):

1. The setup — single GPU isn't enough (~400 words)
2. The first scaling laws (Kaplan 2020) (~500 words)
3. The Chinchilla correction (Hoffmann 2022) (~800 words — central derivation)
4. Why distribute — three reasons (~400 words)
5. Data parallelism — the simple case (~700 words)
6. Model parallelism — tensor and pipeline (~800 words)
7. FSDP — the modern default (~600 words)
8. Bridge to infrastructure (~300 words)

Target: ~4500 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Kaplan et al. 2020 — "Scaling Laws for Neural Language Models"
- **arXiv:** [2001.08361](https://arxiv.org/abs/2001.08361)
- **What it contributed:** the **first systematic scaling laws** for transformers. Demonstrated that loss decreases predictably with model size, dataset size, and compute — following power laws. Established the field's vocabulary for thinking about scaling.
- **Their key claim:** with a fixed compute budget, *most* of the compute should go to model size (large N, small D). This recommendation turned out to be wrong at scale.
- **For the chapter:** historical reference for section 2. The chapter explains what they claimed, then how Chinchilla corrected it.

### Hoffmann et al. 2022 — "Training Compute-Optimal Large Language Models" (Chinchilla)
- **arXiv:** [2203.15556](https://arxiv.org/abs/2203.15556)
- **What it contributed:** the **Chinchilla scaling laws** — corrected the Kaplan recommendations using better experimental design. Trained a 70B model (Chinchilla) on 1.4T tokens (vs DeepMind's earlier 280B-parameter Gopher trained on only 300B tokens). Chinchilla outperformed Gopher despite being 4× smaller.
- **Their key claim:** at compute-optimal, **model size and dataset size should scale together** — roughly 20 tokens per parameter. Most large models from 2020-2022 (GPT-3, Gopher, Megatron-Turing, PaLM) were *significantly* undertrained for their size.
- **For the chapter:** central reference for section 3. The chapter's main scaling-law derivation comes from this paper.

### Shoeybi et al. 2019 — "Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism"
- **arXiv:** [1909.08053](https://arxiv.org/abs/1909.08053)
- **What it contributed:** **tensor parallelism** for transformers — splitting individual layer operations (attention QKV, FFN matmul) across GPUs along specific dimensions. Made it possible to train multi-billion-parameter models on a single node.
- **For the chapter:** central reference for section 6 (tensor parallelism subsection).

### Huang et al. 2019 — "GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism"
- **arXiv:** [1811.06965](https://arxiv.org/abs/1811.06965)
- **What it contributed:** **pipeline parallelism** — split model layers across GPUs, send micro-batches through the pipeline. Made it possible to train models that exceed any single GPU's memory.
- **For the chapter:** central reference for section 6 (pipeline parallelism subsection).

### Rajbhandari et al. 2020 — "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models"
- **arXiv:** [1910.02054](https://arxiv.org/abs/1910.02054)
- **What it contributed:** **ZeRO** — three increasingly aggressive sharding strategies:
  - ZeRO-1: shard optimizer state across data-parallel ranks
  - ZeRO-2: shard gradients also
  - ZeRO-3: shard parameters also (full sharding)
- **PyTorch's FSDP** is essentially ZeRO-3 with API conveniences.
- **For the chapter:** central reference for section 7.

### Narayanan et al. 2021 — "Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM"
- **arXiv:** [2104.04473](https://arxiv.org/abs/2104.04473)
- **What it contributed:** **3D parallelism** — combining DP + TP + PP for training models from 1B to 1T+ parameters. The empirical reference for choosing parallelism dimensions at scale.
- **For the chapter:** brief reference at end of section 7 / start of section 8.

### Smith et al. 2022 — "Using DeepSpeed and Megatron to Train Megatron-Turing NLG 530B"
- **arXiv:** [2201.11990](https://arxiv.org/abs/2201.11990)
- **What it contributed:** a production-scale demonstration of 3D parallelism (8-way TP + 35-way PP + 64-way DP = 17,920 GPUs) training a 530B-parameter model.
- **For the chapter:** brief reference; demonstrates the scale of modern training.

---

## Core derivations and concepts

### Derivation 1: The Chinchilla scaling-law equation

Hoffmann et al. 2022 fit a parametric loss function across a large grid of (model size $N$, dataset size $D$) experiments:

```mdx
<Equation label="9.chinchilla">
$$L(N, D) = E + \frac{A}{N^\alpha} + \frac{B}{D^\beta}$$
</Equation>
```

where:

- $L(N, D)$ is the expected training loss (in nats per token)
- $E$ is the irreducible loss — the lower bound (entropy of natural language). Approximately 1.69.
- $A, B$ are coefficients fit to data. Approximately $A \approx 406$, $B \approx 410$.
- $\alpha, \beta$ are exponents. Approximately $\alpha \approx 0.34$, $\beta \approx 0.28$.

**Interpretation:** loss decreases with both model size $N$ and dataset size $D$, each following a power law. The two terms can be thought of as the "model capacity error" (insufficient $N$) and "data limitation error" (insufficient $D$).

**Compute constraint:** training a model of size $N$ on $D$ tokens requires approximately $C \approx 6ND$ FLOPs (the "6" comes from forward + backward + optimizer step).

**The optimization problem:**
$$\min_{N, D} L(N, D) \quad \text{subject to} \quad 6ND = C$$

**The compute-optimal solution:** taking the Lagrangian and setting derivatives to zero, the optimal allocation is:

$$N_{\text{opt}} \propto C^{a}, \quad D_{\text{opt}} \propto C^{1-a}, \quad \text{where } a = \frac{\beta}{\alpha + \beta}$$

For Chinchilla's fitted values ($\alpha \approx 0.34, \beta \approx 0.28$), $a \approx 0.45$. Roughly, $N \propto C^{0.45}, D \propto C^{0.55}$. **Both scale together** as compute increases.

**The "20 tokens per parameter" rule of thumb:** for typical compute budgets in the GPT-3 era, $D_{\text{opt}} / N_{\text{opt}} \approx 20$. For each parameter, train on ~20 tokens. This is the simple rule everyone remembers from Chinchilla.

**The "Chinchilla correction":** Kaplan 2020 had recommended $N \propto C^{0.73}, D \propto C^{0.27}$ — much more emphasis on model size. The reason for the discrepancy: Kaplan's experiments used a fixed (small) number of training steps regardless of model size, which under-trained the larger models. When you train each model to convergence — as Chinchilla did — both $N$ and $D$ should scale roughly equally.

### Derivation 2: Why scaling laws are useful — concrete examples

**Example 1: Given a compute budget, choose model and data size.**

Suppose you have $C = 6 \times 10^{23}$ FLOPs (a medium-sized industry training run, comparable to GPT-3 Curie). Using Chinchilla's optimal allocation:

$$N_{\text{opt}} \approx \left(\frac{C}{6}\right)^{0.45} \cdot k_N$$
$$D_{\text{opt}} \approx \left(\frac{C}{6}\right)^{0.55} \cdot k_D$$

For $C = 6 \times 10^{23}$: $N_{\text{opt}} \approx 7$ billion parameters, $D_{\text{opt}} \approx 140$ billion tokens. (Ratio: ~20× tokens per parameter, as expected.)

**Example 2: Diminishing returns from data.**

If you double $D$ but keep $N$ fixed, the loss reduction comes only from the $B/D^\beta$ term:
$$\Delta L = B (1 - 2^{-\beta}) / D^\beta$$
With $\beta \approx 0.28$, doubling $D$ reduces loss by ~18% of the data term. Significant, but not as much as doubling both $N$ and $D$.

**Example 3: Why Llama-3 8B trained on 15T tokens.**

By Chinchilla, optimal $D/N \approx 20$, so an 8B-parameter model should ideally see ~160B tokens. **Llama-3 8B saw 15 *trillion* tokens** — almost 100× more than Chinchilla-optimal.

Why? Two reasons:
1. **Inference-time considerations**: a smaller model is cheaper to deploy. If you train a 70B model to Chinchilla-optimal and an 8B model 100× past Chinchilla-optimal, the 8B model has worse loss but is 9× cheaper to serve.
2. **Better data**: as discussed in Ch 7, filtered modern datasets (FineWeb-Edu, DCLM-Baseline) shift the scaling law's effective constants. Chinchilla's coefficients were fit on less-curated data.

Modern frontier models intentionally over-train smaller architectures past Chinchilla-optimal for inference economics — the "Chinchilla rule" is now a *lower bound* on training tokens, not the optimum.

### Derivation 3: FLOPs counting

The "6ND" estimate for transformer training FLOPs:
- **Forward pass**: ~2ND FLOPs (the 2 is multiply-accumulate; N parameters each multiplied with D inputs gives 2 × N × D)
- **Backward pass**: ~4ND FLOPs (the backward pass requires both gradient w.r.t. inputs AND gradient w.r.t. parameters, hence ~2× forward)
- **Total**: ~6ND FLOPs per training step on D tokens

This is a *rough* estimate. The actual FLOPs depend on architecture details, but 6ND is the convention used in scaling-law papers.

**For inference**: ~2ND FLOPs (forward pass only, no backward).

This is why training is so expensive: every token of training data costs 6N FLOPs, vs 2N at inference. Training a 70B model on 1.5T tokens: $6 \times 70 \times 10^9 \times 1.5 \times 10^{12} = 6.3 \times 10^{23}$ FLOPs.

### Concept: The three forms of parallelism

**Data parallelism (DP):**
- Each GPU has a *complete copy* of the model
- Each GPU processes a *different micro-batch* of data
- After the backward pass, gradients are averaged across all GPUs (**all-reduce**)
- Memory: model + gradients + optimizer state replicated on every GPU
- Communication: O(model size) per step
- **Scales until**: communication bandwidth saturates, or you run out of memory on a single GPU

**Tensor parallelism (TP):**
- A single layer's operations are split across GPUs along a specific dimension
- Classic Megatron example: split the FFN's first linear ($d \to 4d$) along the column dimension, then split the second linear ($4d \to d$) along the row dimension. The intermediate results stay split; only the final output needs all-reduce.
- Memory: model parameters split across TP-rank GPUs
- Communication: O(activation size) per layer
- **Scales until**: a single layer becomes communication-bound. Typically TP-rank is bounded by 8 (single node) due to high bandwidth requirements.

**Pipeline parallelism (PP):**
- Different *layers* of the model live on different GPUs
- Forward pass: micro-batches flow through the pipeline
- Backward pass: gradients flow backward through the pipeline
- "Pipeline bubbles" (idle time at the start and end of each batch) reduce efficiency
- Memory: each PP-rank GPU holds ~1/PP of the model
- Communication: O(activation size) at pipeline boundaries
- **Scales until**: pipeline depth × micro-batch granularity. Typically PP-rank is 8-64.

**Combining**: for very large models, all three are combined. Example for 530B model (Megatron-Turing): TP=8 × PP=35 × DP=64 = 17,920 GPUs.

### Concept: FSDP / ZeRO-3

**The motivation**: data parallelism replicates everything (model + grads + optimizer state) on every GPU. For a 7B model in FP32 with AdamW: 4 × 7B = 28GB just for parameters, plus gradients (28GB) plus optimizer state (m, v — 56GB). Total: ~112GB per GPU just for state. Won't fit on most GPUs.

**The fix**: **shard the state across DP ranks**. Each DP rank holds only $1/N_{\text{DP}}$ of the state.

**ZeRO-1**: shard optimizer state only. Memory reduction: ~2×.
**ZeRO-2**: shard optimizer state + gradients. Memory reduction: ~4×.
**ZeRO-3 (FSDP)**: shard parameters too. Memory reduction: ~N_DP×.

**The mechanics of FSDP**:
- Each GPU stores 1/N_DP of each layer's parameters
- Before computing layer L: **all-gather** the parameters of layer L from all DP ranks (everyone now has full layer L params temporarily)
- Compute forward pass for layer L
- **Discard** the gathered parameters (only keep your local shard)
- After backward pass: gradients are computed locally, then **reduce-scatter** to the appropriate ranks

**Cost vs benefit**: FSDP increases communication compared to vanilla DP. The benefit is dramatic memory reduction — you can train models that wouldn't fit otherwise. Modern PyTorch training defaults to FSDP for >1B parameter models.

### Concept: Communication primitives

A few primitives appear everywhere in distributed training:

- **All-reduce**: every GPU starts with a tensor; the operation produces the *sum* (or mean) of all GPUs' tensors, with the sum available on every GPU. Used to average gradients in DP.
- **All-gather**: every GPU starts with a *shard* of a tensor; the operation produces the *full* tensor on every GPU. Used in FSDP to assemble layer parameters.
- **Reduce-scatter**: inverse of all-gather. Every GPU starts with the *full* tensor; the operation distributes shards back. Used in FSDP for gradients.
- **Broadcast**: one GPU has a tensor; every other GPU receives a copy. Used at initialization.
- **All-to-all**: every GPU sends a different shard to every other GPU. Used in MoE routing (Ch 11).

**Communication cost** depends on tensor size, network bandwidth, and GPU interconnect. NVLink (within a node) is fast (~600 GB/s); InfiniBand (across nodes) is slower (~25-50 GB/s). Designing parallelism strategies means putting high-bandwidth operations within nodes and low-bandwidth operations across nodes.

---

## Glossary

- **Scaling law**: empirical functional form relating model size, dataset size, and compute to expected loss
- **Chinchilla scaling**: the corrected scaling laws from Hoffmann et al. 2022; key claim is ~20 tokens per parameter compute-optimal
- **Compute-optimal**: choosing $N, D$ to minimize loss for a given compute budget $C$
- **FLOPs (floating-point operations)**: standard unit for compute. Training a transformer: ~6ND FLOPs total.
- **Data parallelism (DP)**: same model on every GPU, different data on each
- **Model parallelism (MP)**: model split across GPUs
- **Tensor parallelism (TP)**: a single layer's operations split across GPUs
- **Pipeline parallelism (PP)**: different layers on different GPUs
- **FSDP (Fully Sharded Data Parallel)**: PyTorch's name for ZeRO-3
- **ZeRO**: DeepSpeed framework's name for sharded data parallelism. Three stages: optimizer / gradients / parameters
- **All-reduce / all-gather / reduce-scatter / broadcast / all-to-all**: collective communication primitives
- **NVLink**: high-bandwidth GPU-GPU interconnect within a node
- **InfiniBand**: lower-bandwidth GPU-GPU interconnect across nodes
- **3D parallelism**: combining DP + TP + PP
- **Micro-batch**: a small batch used as a unit of pipeline-parallel work
- **Pipeline bubble**: idle time at the start/end of pipeline-parallel training, where some GPUs are waiting for the pipeline to fill or drain

---

## Pedagogical analogies

### 1. Chinchilla scaling as "matching recipe to ingredients"
Imagine you're baking with a fixed amount of flour (compute). Should you (a) make one giant cake (huge model) with all the flour, or (b) make several normal-sized cakes (model + more training)? Kaplan said (a); Chinchilla said something between (a) and (b). The empirical answer: model size and training data should roughly scale together.

**Best used for:** section 3 motivating the Chinchilla correction.

### 2. Data parallelism as "many cooks, same recipe, different ingredients"
Each GPU is a cook making the same recipe (model), processing different ingredients (different batches). After everyone finishes, they pool their results (gradient all-reduce) to learn from the combined experience.

**Best used for:** section 5 introducing DP.

### 3. Tensor parallelism as "assembly line — each worker handles part of one operation"
The recipe says "mix flour and water." With TP, one cook handles the flour, another handles the water; they hand the partially-mixed result to a third cook who handles the next step. The single operation is split, but the overall task is still one assembly line.

**Best used for:** section 6 introducing TP.

### 4. Pipeline parallelism as "stations along an assembly line"
The recipe has multiple steps (layers). Each station (GPU) does one step. Ingredients (micro-batches) flow through the stations. Each station is always busy on the *next* micro-batch while the previous one moves forward.

**Best used for:** section 6 introducing PP.

### 5. FSDP as "shared library"
Instead of every cook owning every cookbook (parameters), the cookbooks are stored across a library system. When cook A needs a specific recipe, it's fetched temporarily from wherever in the library it lives; after using it, cook A discards the local copy. Saves storage; costs slightly more in fetch time.

**Best used for:** section 7 introducing FSDP.

---

## Common misconceptions

### MC1: "Bigger models are always better."
**Reality:** **only if you have data and compute to match**. Chinchilla showed that GPT-3 (175B params, 300B tokens) was significantly undertrained for its size — a 70B model on 1.4T tokens (same compute) outperforms it. **Compute-optimal is what matters**; "size for the sake of size" is wasted training compute.

### MC2: "Kaplan's scaling laws are correct."
**Reality:** Kaplan et al. 2020 was a pioneering paper but its experimental design under-trained the larger models (fixed step count regardless of size). When experiments are run to convergence — as Chinchilla did — the optimal allocation shifts substantially toward "more tokens per parameter." **Most pre-2022 models were undertrained**; Llama-2 onward fixed this.

### MC3: "Llama-3 8B violates Chinchilla."
**Reality:** Llama-3 8B trained on 15T tokens — almost 100× past Chinchilla-optimal for its size. This is *intentional*: smaller models cost less at inference. The "Chinchilla rule" is now a *lower bound* on training tokens for any production model. Modern frontier models intentionally over-train smaller architectures for inference economics.

### MC4: "Data parallelism scales to any number of GPUs."
**Reality:** vanilla DP scales until the **gradient all-reduce** becomes bandwidth-bound. For 1000+ GPUs training a large model, the gradient communication time per step dominates compute. This is why FSDP (which reduces per-step communication by overlapping) and 3D parallelism (which limits DP rank to a smaller number) are used at scale.

### MC5: "FSDP is just data parallelism with extra steps."
**Reality:** FSDP fundamentally changes the **memory layout**. Vanilla DP replicates the model, gradients, and optimizer state on every GPU. FSDP shards all three across DP ranks. The result: a model that wouldn't fit in vanilla DP can fit in FSDP. The "extra steps" are not optional — they're the entire point.

### MC6: "Tensor parallelism is just sharding the model across GPUs."
**Reality:** TP specifically splits *operations* (matmuls, attention) along careful dimensions chosen to minimize communication. Naive sharding doesn't work — communicating activations at every layer would be prohibitive. Megatron-LM's TP design has specific patterns (column-then-row, allowing all-reduce only at certain points) that minimize communication while sharding effectively.

### MC7: "Pipeline parallelism is free model splitting."
**Reality:** PP has a fundamental inefficiency — the **pipeline bubble**. Early in the pipeline, only the first GPUs are busy; late in the pipeline, only the last. The bubble fraction is approximately $(\text{PP-rank} - 1) / (\text{num micro-batches} + \text{PP-rank} - 1)$. To reduce the bubble: many small micro-batches. To make micro-batches small: smaller batch size or gradient accumulation.

---

## Tricky implementation details

### TID1: FSDP comes with API gotchas
- **Don't access parameters directly**: FSDP's parameters are not always "all-gathered." Use `with FSDP.summon_full_params(model):` to access them.
- **State dict saving**: standard `model.state_dict()` returns only the local shard. Need `FSDP.state_dict_type(model, StateDictType.FULL_STATE_DICT)` to save the full model.
- **Mixed precision**: FSDP has its own mixed-precision config (`MixedPrecision(param_dtype=torch.bfloat16, ...)`) — use this instead of the global `torch.autocast`.

### TID2: TP requires specific layer reorganization
The Megatron-LM TP recipe:
- For QKV projection in attention: split the output dimension across TP ranks. Each rank computes its slice of (Q, K, V).
- For attention output projection: split the input dimension. After multi-head attention, all-reduce across TP ranks.
- For FFN: column-parallel first linear ($d \to 4d/n$), row-parallel second linear ($4d/n \to d$), all-reduce at the end.

This is not a library wrapper around an existing model; the model code is restructured for TP.

### TID3: PP scheduling matters
The naive PP schedule is "all forward, then all backward" — gives huge bubbles. Modern schedules (1F1B, interleaved 1F1B) interleave forward and backward passes to reduce bubbles to <10% at scale.

### TID4: Communication overlap
At scale, the goal is to overlap communication with compute:
- **In DP**: start the gradient all-reduce *during* the backward pass, not after
- **In FSDP**: pre-fetch the next layer's parameters during the current layer's compute
- **In TP**: overlap the activation all-reduce with the matmul of the next layer

PyTorch's distributed primitives support these overlaps via async ops + careful CUDA stream management.

### TID5: Number of GPUs ≠ proportional speedup
Realistic training speed-ups:
- 8 GPUs (single node): ~7× speedup over 1 GPU (some communication overhead)
- 64 GPUs (8 nodes): ~50× speedup (cross-node communication is slower)
- 1024 GPUs: ~700× speedup (significant communication dominance)
- 10,000 GPUs: ~5000× speedup (heavy communication, careful engineering required)

The "efficiency" (actual speedup / num GPUs) drops with scale. Beyond ~10k GPUs, returns are sharply diminishing without expert engineering.

---

## Reference implementations

### Compute-optimal allocation (numpy)

```python
import numpy as np

# Chinchilla fitted constants (approximate, from Hoffmann et al. 2022)
E = 1.69
A = 406.0
B = 410.0
ALPHA = 0.34
BETA = 0.28

def chinchilla_loss(N, D):
    """Expected loss for model size N and dataset size D, per Chinchilla."""
    return E + A / (N ** ALPHA) + B / (D ** BETA)

def compute_optimal_NDC(C):
    """Given compute budget C (FLOPs), return (N_opt, D_opt, predicted_loss)."""
    # Compute-optimal allocation: N propto C^a, D propto C^(1-a)
    # where a = beta / (alpha + beta)
    a = BETA / (ALPHA + BETA)
    # Approximate constants from Chinchilla's fits
    k_N = 0.6  # rough fit constant
    k_D = 1.7  # rough fit constant
    N_opt = k_N * (C / 6) ** a
    D_opt = k_D * (C / 6) ** (1 - a)
    L_opt = chinchilla_loss(N_opt, D_opt)
    return N_opt, D_opt, L_opt

# Demo: a few compute budgets
print(f"{'Compute (FLOPs)':>20} {'N (params)':>15} {'D (tokens)':>15} {'D/N':>8} {'Loss':>7}")
print("-" * 75)
for C in [1e22, 1e23, 6e23, 1e24, 1e25]:
    N_opt, D_opt, L_opt = compute_optimal_NDC(C)
    print(f"{C:>20.1e} {N_opt:>15.2e} {D_opt:>15.2e} {D_opt/N_opt:>8.1f} {L_opt:>7.3f}")
```

### Communication cost estimator

```python
def comm_cost_dp(model_size_bytes, num_gpus):
    """All-reduce cost in bytes per step for data parallel."""
    # Ring all-reduce: 2 * (model_size) * (num_gpus - 1) / num_gpus
    # ≈ 2 * model_size for large num_gpus
    return 2 * model_size_bytes * (num_gpus - 1) / num_gpus

def comm_cost_fsdp(model_size_bytes, num_gpus, num_layers):
    """Approximate FSDP communication per step.
    
    For each layer: 1 all-gather (params) + 1 reduce-scatter (grads)
    Total: 2 * model_size per step (vs DP's 2 * model_size for grads only)
    BUT: FSDP enables overlap with compute, so wall-clock cost is often less.
    """
    return 2 * model_size_bytes  # roughly the same as DP, but communicated piecewise

# Example: 7B model in FP16
model_size = 7e9 * 2   # bytes (FP16 = 2 bytes per param)
for num_gpus in [8, 64, 512]:
    dp = comm_cost_dp(model_size, num_gpus)
    fsdp = comm_cost_fsdp(model_size, num_gpus, num_layers=32)
    print(f"GPUs: {num_gpus:>4d}  DP all-reduce: {dp/1e9:>6.1f} GB  FSDP total: {fsdp/1e9:>6.1f} GB")
```

### FSDP sketch (PyTorch pseudocode)

```python
# Just the FSDP setup — actual training loop is the same as Ch 8
import torch
import torch.distributed as dist
from torch.distributed.fsdp import FullyShardedDataParallel as FSDP
from torch.distributed.fsdp import MixedPrecision

# Initialize process group (typically via launcher: torchrun)
dist.init_process_group(backend='nccl')
local_rank = int(os.environ['LOCAL_RANK'])
torch.cuda.set_device(local_rank)

# Build model
model = GPT(vocab_size=50257, d_model=4096, n_heads=32, n_layers=32)

# Wrap with FSDP
model = FSDP(
    model,
    mixed_precision=MixedPrecision(
        param_dtype=torch.bfloat16,
        reduce_dtype=torch.bfloat16,
        buffer_dtype=torch.bfloat16,
    ),
    device_id=local_rank,
)

# Optimizer (sees the FSDP-wrapped parameters)
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, betas=(0.9, 0.95))

# Training loop is essentially identical to Ch 8 — FSDP handles the sharding internally
for step in range(total_steps):
    x, y = get_batch()
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    optimizer.zero_grad()
    loss.backward()   # FSDP automatically handles gradient sharding here
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    optimizer.step()
```

---

## Connections to other chapters

- **Ch 8 (Building a small LLM):** the training loop runs at scale via the techniques in this chapter. Ch 8's loop is *the same* — DP/FSDP wraps it; the loop body doesn't change.
- **Ch 7 (Pre-training data):** scaling laws assume *quality-controlled* training data. DCLM result (Ch 7) suggests that with better data, the effective scaling-law constants improve — same compute, lower loss.
- **Ch 10 (Training infrastructure):** the systems engineering of running distributed training. GPU clusters, NCCL, CUDA streams, Triton kernels.
- **Ch 11 (Mixture of Experts):** an alternative scaling approach — instead of dense scaling (more params, more data), MoE adds *sparse* parameters that aren't all activated per token.
- **Ch 17 (Inference):** the inference-time cost of a 7B vs 70B model. Llama-3's choice to over-train 8B is partly justified here.

---

## Open questions for the chapter author

### Q1: How deep on the Chinchilla derivation?
**Recommendation:** medium. State the loss equation $L(N, D) = E + A/N^\alpha + B/D^\beta$ with a labeled equation tag. Give the compute-optimal allocation result ($N \propto C^a, D \propto C^{1-a}$) without deriving it via Lagrangian. Mention the "20 tokens per parameter" rule of thumb prominently.

### Q2: How much code in the parallelism sections?
**Recommendation:** light on actual parallel code (it requires multi-GPU setup that Pyodide can't replicate). Show the FSDP wrapper as illustrative; emphasize conceptual understanding via diagrams.

### Q3: 3D parallelism — separate section or brief mention?
**Recommendation:** brief mention at the end of section 7. The chapter is already covering a lot; 3D parallelism is "combine the things we already covered." A diagram is worth more than 500 words of text here.

### Q4: Llama-3 vs Chinchilla — how much to discuss?
**Recommendation:** include in section 3 (the Chinchilla correction). Frame as "Chinchilla gave the compute-optimal answer; modern practice intentionally trades compute-optimal for inference-friendly." Clean explanation of why over-training small models is now standard.

### Q5: Widget candidates
1. **Scaling law calculator (marquee):** sliders for parameters and tokens; show the Chinchilla loss prediction; highlight the compute-optimal point along the constraint curve. The user sees that "more parameters with same tokens" plateaus; the optimal is balanced. **Recommended marquee.**
2. **Parallelism diagram (secondary):** animated visualization of DP / TP / PP / FSDP showing how a forward pass distributes across GPUs. Toggle between parallelism modes; see data flow. **Recommended secondary.**
3. **Communication cost calculator (alternative):** sliders for model size and GPU count; show expected communication cost. Less pedagogically central than (1) and (2).

Recommend (1) and (2).

---

## Pre-research notes

**Chapter cadence:** Ch 9 is another **two-topic chapter** like Ch 5 and Ch 8 — covers both the *math of scaling* (Chinchilla equation, compute-optimal allocation) and the *engineering of distributed training* (DP, TP, PP, FSDP). It earns the **5-file cadence**.

Planned file layout:
- File 54: research (this)
- File 55: page structure (~650 lines, 8 sections; embedded runnables)
- File 56: scaling law calculator marquee widget (interactive Chinchilla curve)
- File 57: parallelism diagram secondary widget (DP/TP/PP/FSDP visualizations)
- File 58: exercises + closeout (status flip 'draft' → 'published')

Files 58, 59 from the original BUILD_ORDER absorbed.

**Pedagogical outcomes for the reader.** After Ch 9, the reader should be able to:
1. State the Chinchilla scaling law equation and its key claim (~20 tokens per parameter)
2. Compute the compute-optimal $N$ and $D$ given a FLOP budget
3. Explain why modern frontier models often over-train small models past Chinchilla-optimal (inference economics)
4. Distinguish DP, TP, and PP — what each splits, what each communicates
5. Explain what FSDP is and why it's the modern default for >1B models
6. Identify which communication primitives each parallelism strategy uses
7. Reason about communication bottlenecks at different scales

Seven outcomes. The exercises will hit outcomes 1, 2, 4, and 5 directly.

**This chapter completes the "what's the training procedure?" arc.** Ch 7 covered data, Ch 8 covered the trainer, Ch 9 covers how to scale it. After Ch 9, the reader has the full training-side mental model. Ch 10 will be a systems engineering chapter — how to actually run the cluster — but it's optional/practical depth, not core conceptual material.
