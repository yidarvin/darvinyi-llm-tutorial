# Session 46 — Chapter 10 page structure

> First chapter session for Chapter 10 ("Training infrastructure"). **The systems-engineering chapter that closes Phase 9.** Where Ch 9 covered the *math* of distributed training (Chinchilla + DP/TP/PP/FSDP), Ch 10 covers the *practical reality* — GPU hardware, NVLink/InfiniBand interconnects, NCCL collectives, training frameworks (DeepSpeed, Megatron, FSDP), custom kernels (Triton, FlashAttention), activation checkpointing, mixed precision, and cost economics. **Honest about being practical depth rather than core knowledge** — readers can skip without losing the conceptual training story; engineers who'll run the systems should not skip. **Single-topic chapter**; uses the **4-file cadence**.

---

## Read first (in this order)

1. **`research/ch10-training-infra/research.md`** — the source material. Every section, derivation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch09-scaling-and-distributed/session-41-page-structure.md`** — for the engineering-flavored chapter template (Ch 9 set the tone for code-light, empirically-grounded engineering chapters)
4. **`prompts/chapters/ch07-pretraining-data/session-32-page-structure.md`** — for the pragmatic single-topic chapter template (Ch 7 established the empirical-engineer voice)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 10 page. By end of session:

- `src/pages/ch10-training-infra/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch10-training-infra/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 10's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch10-training-infra/` with sidebar showing Ch 10 active, prev/next nav linking to Ch 9 (active) and Ch 11 (disabled)

**Tonal note:** Ch 10 is the *practical engineering* chapter. The voice is that of an experienced infrastructure engineer who has run these clusters — pragmatic, opinionated, willing to say "use FSDP for X; switch to Megatron-LM for Y." Less mathematical than Ch 5/8/9; less abstract than Ch 7. **Honest about its narrower audience**: readers who want only the conceptual training story can skip Ch 10; readers who'll actually build these systems should read it carefully.

**Chapter cadence:** Ch 10 uses the **4-file cadence** (single-topic chapter — training infrastructure). File 64 from the original BUILD_ORDER is absorbed.

---

## Inputs

State of the repo after session 44 (Ch 9 complete):

- Ch 1-9 all `'published'`
- `research/ch10-training-infra/research.md` exists
- `src/lib/chapters.ts` has Ch 1-9 `'published'`, Ch 10-30 `'planned'`
- No `src/pages/ch10-training-infra/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch10-training-infra/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch10-training-infra/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 10's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch10-training-infra
description: The systems engineering chapter that closes Phase 9. Where Chapter 9 covered the math of distributed training, this chapter covers the practical reality — GPU hardware, NVLink and InfiniBand interconnects, NCCL collectives, training frameworks (DeepSpeed, Megatron, PyTorch FSDP), custom GPU kernels (Triton, FlashAttention), activation checkpointing, mixed precision, and cost economics. The chapter is practical depth — readers can skip without losing the conceptual training story; engineers who will actually build these systems should not.
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

> Chapter 9 ended with a complete conceptual story of distributed training. Choose your compute budget; allocate per Chinchilla (~20 tokens per parameter); combine DP, TP, PP, and FSDP into a 3D-parallel cluster; train. That's the *math*. This chapter is the *reality*: what GPUs you actually use (H100, A100, MI300X), how they connect (NVLink within nodes, InfiniBand across nodes), what runs the training loop (PyTorch FSDP, DeepSpeed, Megatron-LM), when you write custom kernels (Triton, FlashAttention), and what it all costs.
>
> Modern LLM training is a systems-engineering problem as much as it is a machine-learning problem. The FlashAttention paper, which appeared in 2022, did not change attention — it changed how attention is *computed*, and that was enough to make long-context LLMs practical. The DeepSpeed library did not invent new optimizers — it implemented existing math in a way that trains 70B models on existing hardware. Modern training is unrecognizable from 5 years ago, not because the math changed but because the engineering did.
>
> This chapter is denser on practical reality than earlier chapters. If you've made it through Chapters 1-9, you have the full conceptual story of how LLMs train. Chapter 10 is *optional depth* for readers who will actually run these systems — engineers at AI labs, researchers building their own training stacks, or anyone whose job involves the question "why is our MFU only 30%?" Read it if that's you; skip to Chapter 11 if not. The next phase of the tutorial (alternative architectures, post-training) doesn't assume Ch 10's content.

### Section 1: The setup — why infrastructure matters

**Heading:** `## The setup — why infrastructure matters`
**Word target:** ~400

**Teaching beats:**
1. **The headline claim**: modern LLM training is bottlenecked as much by *systems* as by *algorithms*. FlashAttention, DeepSpeed, and Triton each made possible model scales that were "obviously" impossible the year before.
2. **The shift in research focus**: 2017-2020 was architectural innovation (transformers, attention variants); 2020-2024 has increasingly been *systems* innovation. Most of the practical performance gains from GPT-3 to Llama-3 came from infrastructure, not architecture.
3. **What this chapter covers**: the practical stack — hardware, interconnect, software, kernels, optimization techniques, cost.
4. **What it doesn't cover**: GPU architecture in microarchitectural detail (warp scheduling, SIMT lanes, etc.) — those are graduate-level optimization topics. The chapter gives you enough to understand the *trade-offs* without making you a GPU engineer.

**Required callout** — type `note`: Chapter 10 is more specialized than earlier chapters. Readers focused on the conceptual story of LLMs can skip it; readers who will run training systems should read it carefully. Chapter 11 (alternative architectures) does not assume any Ch 10 content.

**No code in this section.** Setup and motivation.

**Connection forward:** section 2 starts with the hardware.

### Section 2: The hardware — GPUs and what they offer

**Heading:** `## The hardware — GPUs and what they offer`
**Word target:** ~700
**Sub-headings:** `### GPU spectrum (2024)`, `### Memory hierarchy`, `### Cluster scale`

**Teaching beats:**

**GPU spectrum (2024):**
1. **NVIDIA H100 (Hopper, 2022-present)**: 80 GB HBM3, 3 TB/s memory bandwidth, ~989 TFLOPS BF16, NVLink 4.0 at 900 GB/s. **The current workhorse for frontier training.**
2. **NVIDIA A100 (Ampere, 2020)**: 40-80 GB HBM2e, 2 TB/s memory, ~312 TFLOPS BF16, NVLink 3.0 at 600 GB/s. Previous-generation frontier; still widely used.
3. **NVIDIA GH200 (Grace Hopper, 2023)**: 96-144 GB HBM3, tightly coupled with Grace CPU. Newer frontier.
4. **AMD MI300X (2023)**: 192 GB HBM3 (2.4× H100), 5.3 TB/s memory, ~1.3 PFLOPS BF16. Competitive alternative.

**Memory hierarchy:**
5. GPUs have a tiered memory hierarchy that matters for kernel performance:
   - Registers (fastest, thousands of bytes per thread)
   - Shared memory / L1 (~128 KB per SM)
   - L2 cache (~40 MB on H100)
   - HBM (80 GB on H100, ~3 TB/s)
   - Host RAM (slowest, cross-PCIe)
6. **Performance lesson**: keep data in the fastest tier of memory possible. FlashAttention's trick is staying in shared memory.

**Cluster scale:**
7. "8 GPUs per node" is standard (NVLink between them). 1024 nodes × 8 GPUs = 8192 GPUs is a moderately large cluster. GPT-4-class training uses 10,000-25,000 GPUs.

**Required callout** — type `warning`: MC1 from research.md. "Bigger GPU = always faster." Wrong — depends on workload. A single H100 might underperform 8 well-connected A100s for memory-bandwidth-bound workloads. Total throughput depends on memory bandwidth, interconnect speed, and software efficiency — not just FLOPS.

**No code in this section.** Hardware reference; code appears in later sections.

**Connection forward:** section 3 covers how GPUs talk to each other.

### Section 3: The interconnects — NVLink and InfiniBand

**Heading:** `## The interconnects — NVLink and InfiniBand`
**Word target:** ~600
**Sub-headings:** `### NVLink within a node`, `### InfiniBand across nodes`, `### Why the gap dictates parallelism`

**Teaching beats:**

**NVLink within a node:**
1. NVLink is NVIDIA's GPU-GPU interconnect within a single node.
2. H100 NVLink 4.0: 900 GB/s per GPU.
3. **NVSwitch**: a chip that enables full-mesh NVLink connectivity. With NVSwitch, all 8 GPUs in a node can reach each other at full NVLink bandwidth.

**InfiniBand across nodes:**
4. Across nodes, GPUs talk via the network — typically InfiniBand or RoCE (RDMA over Converged Ethernet).
5. **Modern InfiniBand**: 25-50 GB/s per port.
6. **GPU-direct RDMA**: data flows GPU → NIC → fiber → NIC → GPU, never staging through CPU memory.

**Why the gap dictates parallelism:**
7. **The bandwidth gap**: NVLink ~900 GB/s vs InfiniBand ~25-50 GB/s = **~20-40× gap**.
8. **Design implication**: high-bandwidth operations (TP all-reduce per layer) must stay within a node. Lower-bandwidth operations (DP gradient all-reduce per step) can cross nodes.
9. **Practical rule**: TP-rank ≤ 8 (single node). PP-rank can be larger (cross-node). DP-rank scales until network saturates.

**Required callout** — type `warning`: MC2 from research.md. "Multi-node is always slower than single-node." Per-GPU, yes — InfiniBand is ~20-40× slower than NVLink. But for very large models, single-node *can't fit* the parameters. Multi-node is necessary, not optional. The art is hiding inter-node communication behind compute.

**No code in this section.** Conceptual hardware introduction.

**Connection forward:** section 4 — the software that runs on this hardware.

### Section 4: NCCL — collectives on GPUs

**Heading:** `## NCCL — collectives on GPUs`
**Word target:** ~500

**Teaching beats:**
1. **NCCL** (NVIDIA Collective Communications Library) implements collective operations (all-reduce, all-gather, broadcast, reduce-scatter, all-to-all) on GPU networks.
2. **Why a dedicated library**: collectives must be implemented carefully to use the optimal communication primitives (NVLink + InfiniBand + GPU-direct). Standard MPI is slow; PyTorch's distributed primitives use NCCL underneath on GPU clusters.
3. **Ring all-reduce algorithm**: the default for DP gradient reduction. Each GPU sends data to its right neighbor, receives from its left, and combines. After $n-1$ rounds, every GPU has the sum. Cost: $2 \cdot (n-1)/n \cdot \text{data\_size}$ — nearly optimal.
4. **Tree all-reduce**: alternative for very large $n$ (>32 nodes). Hierarchical reduction.
5. **Practical**: NCCL configuration (via environment variables like `NCCL_ALGO`, `NCCL_PROTO`) tunes for specific topology. Frontier training requires careful NCCL tuning — 20-30% throughput gains possible.

**Required code** — `<RunnableCode>` simulating ring all-reduce:

```python
import numpy as np

def simulate_ring_all_reduce(rank_data):
    """
    Simulate a ring all-reduce on synthetic data.
    
    rank_data: list of numpy arrays, one per rank. All same shape.
    Returns: the all-reduced (summed) array — same on every rank.
    """
    n = len(rank_data)
    assert n >= 2, "Ring all-reduce needs at least 2 ranks"

    # In a real ring all-reduce, data is sharded into chunks; each chunk
    # traverses the ring. Total comm: 2*(n-1)/n * data_size per rank.
    # Here we just sum element-wise (functionally equivalent).
    result = np.zeros_like(rank_data[0])
    for r in rank_data:
        result += r
    return result

# Demo: 4 ranks, each with different gradients
np.random.seed(42)
rank_data = [np.random.normal(0, 1, 10) for _ in range(4)]

print("Per-rank arrays (first 5 elements):")
for i, r in enumerate(rank_data):
    print(f"  Rank {i}: {r[:5].round(3)}")

reduced = simulate_ring_all_reduce(rank_data)
print(f"\nAll-reduced (summed) result: {reduced[:5].round(3)}")
print(f"\nCommunication cost (ring algorithm):")
n = 4; data_size = 10 * 4   # 4 bytes per FP32 element
print(f"  2 * ({n}-1)/{n} * {data_size} bytes = {2 * (n-1)/n * data_size:.1f} bytes per rank")
print(f"  Compare to naive all-to-all: ({n}-1) * {data_size} = {(n-1) * data_size} bytes per rank")
print(f"  Ring is {(n-1) * data_size / (2 * (n-1)/n * data_size):.1f}x cheaper")
```

**Required callout** — type `aside`: NCCL configuration tuning matters at scale. Standard `NCCL_*` environment variables (`NCCL_ALGO=Tree` or `Ring`, `NCCL_PROTO=Simple` or `LL128`, etc.) interact with cluster topology. The right setting can give 20-30% throughput improvement. Frontier training runs spend non-trivial engineering effort on NCCL tuning.

**Connection forward:** section 5 covers the frameworks that orchestrate all this.

### Section 5: Training frameworks

**Heading:** `## Training frameworks — which one to pick`
**Word target:** ~600
**Sub-headings:** `### PyTorch FSDP (the default)`, `### DeepSpeed`, `### Megatron-LM`, `### When to use what`

**Teaching beats:**

**PyTorch FSDP:**
1. **PyTorch's native ZeRO-3 implementation.** `torch.distributed.fsdp.FullyShardedDataParallel`.
2. Well-documented; integrates cleanly with the PyTorch ecosystem.
3. **Limitations**: TP and PP are not native; must combine with other libraries for 3D parallelism.

**DeepSpeed:**
4. **Microsoft's training library.** Original ZeRO implementation.
5. Extensive memory features beyond FSDP: ZeRO-Infinity (CPU/NVMe offload), 1-bit Adam (compressed comms), etc.
6. **Best for**: extreme memory savings; training models that wouldn't fit in vanilla FSDP.

**Megatron-LM:**
7. **NVIDIA's library, focused on TP + PP.**
8. The TP/PP reference implementation; many other frameworks follow Megatron's patterns.
9. **Best for**: 30B+ models needing 3D parallelism. Often combined with DeepSpeed for FSDP-style ZeRO sharding.

**When to use what:**
10. **<1B model, few GPUs**: vanilla DP via PyTorch.
11. **1B-30B model**: PyTorch FSDP. Simple, well-tested.
12. **30B-100B model**: Megatron-LM (TP within nodes + PP across nodes) + FSDP.
13. **100B+ model**: Megatron-DeepSpeed. 3D parallelism + extreme memory optimization.

**Required widget placeholder** — Training stack picker (marquee, session 47):

```mdx
<WidgetFrame title="Training stack picker" caption="Pick a model size, GPU type, and GPU count. The widget recommends a parallelism stack (FSDP vs Megatron vs Megatron-DeepSpeed), estimates achievable MFU, and projects training cost. Practical decision support — what would you actually use?">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 47 (marquee)
  </div>
</WidgetFrame>
```

**Connection forward:** these frameworks orchestrate the training loop, but for the most performance-critical operations, they invoke custom GPU kernels. Section 6 explains why and how.

### Section 6: Custom kernels — Triton and FlashAttention

**Heading:** `## Custom kernels — Triton and FlashAttention`
**Word target:** ~800 — ALGORITHMIC CENTERPIECE
**Sub-headings:** `### Why custom kernels`, `### Triton`, `### FlashAttention`

**Teaching beats:**

**Why custom kernels:**
1. **PyTorch's default kernels** are good but not always optimal.
2. **Fused operations**: combining multiple ops (softmax + matmul) into one kernel avoids writing intermediates to memory.
3. **Memory hierarchy exploitation**: keeping data in SRAM (fastest) instead of HBM (slowest).
4. **Eliminating Python overhead**: pure-CUDA kernels have no Python dispatch cost.

**Triton:**
5. **Triton** is OpenAI's Python-embedded GPU kernel language.
6. Higher-level than CUDA: write in dozens of lines instead of hundreds.
7. The `@triton.jit` decorator compiles Python code to GPU assembly.
8. **Structure of a Triton kernel**: program IDs (work tiles), explicit memory loads/stores, masks at boundaries.

**FlashAttention:**
9. The canonical custom-kernel success story.
10. **Standard attention**: compute $QK^T$ → write $N \times N$ matrix to HBM → softmax → write to HBM → matmul $PV$. **HBM I/O = $O(N^2)$.**
11. **FlashAttention**: tile the computation; keep tiles in SRAM; never write the full attention matrix to HBM. **HBM I/O = $O(N \cdot d \cdot N / M)$** where $M$ is SRAM size. Much smaller for large $N$.
12. **Result**: 2-4× speedup at standard contexts (2K-8K); 10×+ at long contexts (32K-128K). Same output as standard attention; no approximation.
13. **Why this matters historically**: long-context LLMs (32K-200K context windows) became possible *because of* FlashAttention. The architectural innovation wasn't new attention math; it was new attention engineering.

**Required code** — `<RunnableCode>` with the Triton vector-add kernel (illustrative; doesn't execute in Pyodide):

```python
# Illustrative — requires Triton + GPU to run.
# This is the "hello world" of GPU kernels.

# import torch
# import triton
# import triton.language as tl

# @triton.jit
# def vector_add_kernel(x_ptr, y_ptr, output_ptr, n_elements, BLOCK_SIZE: tl.constexpr):
#     pid = tl.program_id(axis=0)              # which "program" / thread block am I?
#     offsets = pid * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)
#     mask = offsets < n_elements              # boundary check
#     x = tl.load(x_ptr + offsets, mask=mask)
#     y = tl.load(y_ptr + offsets, mask=mask)
#     output = x + y
#     tl.store(output_ptr + offsets, output, mask=mask)

# def vector_add(x, y):
#     output = torch.empty_like(x)
#     n = output.numel()
#     grid = (triton.cdiv(n, 1024),)
#     vector_add_kernel[grid](x, y, output, n, BLOCK_SIZE=1024)
#     return output

print("Triton kernel above is illustrative — running requires GPU + Triton.")
print()
print("Structure of a Triton kernel:")
print("  1. @triton.jit decorator marks the function as a GPU kernel")
print("  2. Work is tiled across program IDs (each program processes BLOCK_SIZE elements)")
print("  3. Explicit memory loads (tl.load) and stores (tl.store)")
print("  4. Boundary handling via masks")
print()
print("For real kernels (like FlashAttention), the same structure scales —")
print("just with more complex compute inside each program (online softmax,")
print("tiled matmul, etc.) instead of trivial addition.")
print()
print("FlashAttention key insight:")
print("  Standard attention: O(N^2) HBM I/O  →  long contexts impractical")
print("  FlashAttention:     O(N) HBM I/O    →  long contexts (32K-128K) practical")
print("  Same math; same output; ~2-10x faster depending on sequence length")
```

**Required callout** — type `warning`: MC3 from research.md. "FlashAttention is just a faster attention." Wrong — FlashAttention changes the **I/O complexity** of attention from $O(N^2)$ HBM accesses to $O(N \cdot d)$. This isn't a constant-factor speedup; it's an *asymptotic* change in memory access pattern. **Long-context LLMs became practical because of FlashAttention** — the architectural innovation of long context was actually an engineering innovation.

**Required callout** — type `note`: **FlashAttention-2** (Dao 2023) is the current default in most modern frameworks. ~2× faster than FA1 due to better GPU thread utilization. PyTorch's `torch.nn.functional.scaled_dot_product_attention()` uses FA2 automatically when available.

**Connection forward:** with hardware, interconnect, frameworks, and kernels covered, what other practical concerns matter?

### Section 7: Practical concerns — checkpointing, mixed precision, activations

**Heading:** `## Practical concerns — checkpointing, mixed precision, activations`
**Word target:** ~600
**Sub-headings:** `### Activation checkpointing`, `### Mixed precision`, `### Step timing and overlap`

**Teaching beats:**

**Activation checkpointing:**
1. **The problem**: forward-pass activations must be stored for the backward pass. For 70B model with seq=2K and 80 layers, that's 100s of GB per micro-batch.
2. **The solution**: don't store all activations. Checkpoint at certain boundaries; recompute during backward.
3. **Trade-off**: ~30% extra forward-pass compute, ~6× memory reduction. Usually a good trade.
4. **Selective activation checkpointing** (Korthikanti et al. 2022): identify the most memory-intensive activations (QKV projections, MLP intermediate); checkpoint only those. ~10% compute overhead with similar memory savings.

**Mixed precision:**
5. Three formats matter: **FP32** (master weights, optimizer state), **BF16** (current default for forward/backward), **FP8** (Hopper+ feature, gaining adoption).
6. **BF16 vs FP16**: BF16 has same range as FP32 (8 exponent bits); doesn't underflow on small gradients. Hence the migration from FP16 to BF16 around 2020-2022.
7. **FP8**: 2 formats (E4M3 for forward, E5M2 for backward). H100+ native support. ~2× throughput vs BF16 with careful loss scaling.

**Step timing and overlap:**
8. A training step has phases: forward pass, backward pass, optimizer step. Communications happen between/during phases.
9. **Overlap**: hide communication behind compute. PyTorch's distributed primitives + careful CUDA stream management make this possible. A well-tuned training run *hides most of the communication time*.
10. **MFU (Model FLOPs Utilization)**: actual FLOPs / peak FLOPs. The headline efficiency metric. Modern well-tuned training reaches 40-50% MFU.

**Required widget placeholder** — Step timeline (secondary, session 48):

```mdx
<WidgetFrame title="Step timeline" caption="One training step visualized as a timeline: compute (forward, backward) plus communication (all-reduce, all-gather). Toggle 'overlap' on/off to see how hiding communication behind compute improves throughput. The difference between 30% MFU and 50% MFU is largely the difference between sequential and overlapped execution.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 48 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with activation checkpointing memory math:

```python
def memory_for_activations(num_layers, seq_len, batch_size, d_model, with_checkpointing=False):
    """
    Estimate activation memory per training step.
    
    Per layer, activations include:
      - Attention QKV: 3 * batch * seq * d_model
      - Attention output: batch * seq * d_model
      - FFN intermediate: batch * seq * 4 * d_model
      - LayerNorm outputs: 2 * batch * seq * d_model
    
    Roughly ~10x batch*seq*d_model per layer.
    """
    BYTES_PER_ELEMENT = 2  # BF16
    per_layer = 10 * batch_size * seq_len * d_model * BYTES_PER_ELEMENT

    if with_checkpointing:
        # Selective: keep ~1 activation per layer (the input); recompute others
        per_layer = batch_size * seq_len * d_model * BYTES_PER_ELEMENT

    return num_layers * per_layer

# Example: 70B model (d_model=8192, 80 layers, seq=2048, batch=4)
config = dict(num_layers=80, seq_len=2048, batch_size=4, d_model=8192)

mem_no_checkpoint = memory_for_activations(**config, with_checkpointing=False)
mem_with_checkpoint = memory_for_activations(**config, with_checkpointing=True)

print(f"Activation memory (no checkpointing):    {mem_no_checkpoint / 1e9:>6.1f} GB")
print(f"Activation memory (with checkpointing):  {mem_with_checkpoint / 1e9:>6.1f} GB")
print(f"Reduction: {mem_no_checkpoint / mem_with_checkpoint:.1f}x")
print()
print(f"For comparison, H100 has 80 GB of HBM.")
print(f"Without checkpointing, activations alone would consume all H100 memory.")
print(f"With checkpointing, ~6x reduction makes large models feasible.")
print()
print("Cost: ~30% extra forward-pass compute (recompute during backward).")
print("Trade is almost always worth it for >10B-parameter models.")
```

**Required callout** — type `warning`: MC5 from research.md. "Activation checkpointing trades compute for memory." Partially right, partially wrong. The naive form trades ~30% compute for ~6× memory. **Selective activation checkpointing** (Korthikanti et al. 2022) trades ~10% compute for similar memory — and sometimes the compute overhead is *hidden* because the backward pass was memory-bandwidth-bound anyway. Often nearly free.

**Connection forward:** all this engineering exists to maximize useful compute. Section 8 talks about how that translates to cost.

### Section 8: Cost economics + bridge

**Heading:** `## Cost economics — and what's next`
**Word target:** ~300
**Sub-headings:** `### The cost of frontier training`, `### Bridge to Phase 10+`

**Teaching beats:**

**The cost of frontier training:**
1. **GPU-hour cost** (cloud, 2024): A100 ~$2-5/hr; H100 ~$3-8/hr.
2. **Training run estimates**: LLaMA-2 70B ~$8M; GPT-4 ~$100M+ (rumored); Llama-3 405B ~$50-80M (estimated).
3. **The $1B training run is coming**: as models scale toward Chinchilla-optimal at 10²⁵-10²⁶ FLOPs, individual training runs approach $1B in compute alone.
4. **MFU matters more than $/GPU-hour**: 5% MFU improvement on a $50M run = $2.5M. Modern training engineering pays back enormously.

**Required code** — `<RunnableCode>` with MFU calculation:

```python
def mfu(tokens_per_sec, model_params, num_gpus, peak_flops_per_gpu):
    """
    Model FLOPs Utilization (MFU): a key training efficiency metric.
    
    Forward + backward FLOPs per token: ~6 * model_params
    """
    flops_per_token = 6 * model_params
    achieved = tokens_per_sec * flops_per_token
    theoretical = num_gpus * peak_flops_per_gpu
    return achieved / theoretical

# Example: Llama-3 8B training on 128 H100s, achieving 500K tokens/sec
result = mfu(
    tokens_per_sec=500_000,
    model_params=8e9,
    num_gpus=128,
    peak_flops_per_gpu=989e12,   # H100 BF16 peak
)
print(f"Achieved MFU: {result * 100:.1f}%")
print()
print(f"Industry-leading MFU for transformer training: ~50-55%")
print(f"Well-tuned production training: ~40-50%")
print(f"Default un-tuned PyTorch: ~20-30%")
print()
print(f"The difference between 25% and 50% MFU on a $50M training run is $25M.")
print(f"This is why every major lab has dedicated training infrastructure teams.")
```

**Bridge:**
5. **Phase 9 is now complete.** The reader has the full training-side story: data (Ch 7), training loop (Ch 8), scaling math + distribution strategies (Ch 9), and practical infrastructure (Ch 10).
6. **What's next**: Phase 10+ covers alternative architectures (MoE, Mamba), post-training (SFT, RLHF), inference, capabilities (reasoning, tools, RAG, multimodal), safety, evaluation, and agents.

**Sample close** (rewrite in chapter voice):

> Ten chapters in, you have the entire training story. Architecture (Ch 1-6), data (Ch 7), training loop (Ch 8), scaling math + parallelism (Ch 9), and infrastructure (Ch 10). With these, you can read the system diagrams of any frontier LLM training run — Llama-3, GPT-4-class, Gemini Ultra — and understand them at every level.
>
> Chapter 11 begins a new arc. Instead of *training* the architecture from Ch 1-6, we'll explore *alternative architectures*: Mixture of Experts (MoE), state-space models (Mamba), and others that aren't standard dense transformers. After that: post-training (SFT, RLHF, DPO), inference, and beyond. The training half of the book is done; the *capabilities* half begins.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 10, slug: 'ch10-training-infra', title: 'Training infrastructure', partNum: 3, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch10-training-infra/index.astro && rm src/pages/ch10-training-infra/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch10-training-infra/`** renders with:
   - Chapter eyebrow ("Chapter 10") + h1 + description
   - 8 h2 sections in the order specified
   - **4 `<RunnableCode>` blocks** (sections 4, 6, 7, 8)
   - 2 `<WidgetFrame>` placeholders (sections 5 and 7)
   - At least 5 callouts spread through the chapter (targeting MC1, MC2, MC3, MC5 from research.md, plus practical notes)
3. **Sidebar:** Ch 1-9 published; Ch 10 active (draft); Ch 11-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 10:** prev = Ch 9 (active); next = Ch 11 (disabled)
6. **TOC on Ch 10** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 4200 and 5000 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 47 and 48 own them.
- ❌ **Do not write exercises.** Session 48 owns (combined with secondary widget).
- ❌ **Do not flip Ch 10's status to `'published'`.** Session 48 owns.
- ❌ **Do not derive FlashAttention from scratch.** State the I/O complexity claim; explain the high-level approach; don't reproduce the algorithm.
- ❌ **Do not deep-dive into GPU microarchitecture.** Warp scheduling, SIMT lanes, etc. are graduate-level optimization topics. Stay at "memory hierarchy + bandwidth" level.
- ❌ **Do not cover inference optimization.** Ch 17 owns.
- ❌ **Do not modify Ch 1-9.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch10-training-infra/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch10-training-infra/index.astro 2>/dev/null || true
git commit -m "session 46: Ch 10 prose — training infrastructure (GPUs, NCCL, frameworks, Triton, FlashAttention, MFU)"
git push origin main
```

---

## Notes for the session author

**On Ch 10 being "practical depth":**
The chapter's opening explicitly tells the reader they can skip it. This is unusual — most tutorials don't tell readers "you don't have to read this chapter." But Ch 10's content is genuinely more specialized than Ch 1-9. The conceptual training story is complete after Ch 9; Ch 10 adds practical engineering depth. Be honest about this framing; don't oversell the chapter as "essential."

**On the engineering-pragmatic tone:**
The voice is that of an infrastructure engineer who's run these clusters. Opinionated about trade-offs ("use FSDP for X; switch to Megatron for Y"). Willing to give specific numbers (NVLink 900 GB/s, InfiniBand 50 GB/s, MFU 40-50%). Less abstract than Ch 5/8/9; less mathematical too. Match Ch 7's empirical-engineer voice but with even more practical detail.

**On FlashAttention being the algorithmic centerpiece:**
Section 6 is the chapter's most algorithmically dense section. The reader needs to understand:
1. Standard attention has $O(N^2)$ HBM I/O
2. FlashAttention reduces this to $O(N \cdot d \cdot N/M)$ — much smaller for large $N$
3. The reduction is *asymptotic*, not constant-factor
4. Long-context LLMs became practical because of this

Don't try to derive FlashAttention from scratch — too long and complex. State the I/O complexity claim; explain the tiling intuition; cite the paper. The reader should walk away knowing what FlashAttention does and *why* it matters, not how to implement it.

**On the 4 runnable code blocks:**
- Section 4 (NCCL ring all-reduce simulation): runs in Pyodide
- Section 6 (Triton vector-add): illustrative, commented-out (no GPU in browser)
- Section 7 (activation checkpointing memory): runs in Pyodide
- Section 8 (MFU calculation): runs in Pyodide

3 runnable + 1 illustrative. Same density as Ch 9 (3 runnable, 0 illustrative — Ch 9 didn't need a kernel example).

**On the widget placements:**
- Section 5 (marquee — Training Stack Picker): placed at the chapter's most *decision-flavored* section. The reader has just learned the frameworks landscape and can immediately use the picker. "Now you can choose."
- Section 7 (secondary — Step Timeline): placed at the practical-concerns section, after the algorithmic centerpiece. Shows the compute-comm overlap that determines MFU.

**On the MFU section:**
MFU is introduced in section 7 and reinforced in section 8 with the runnable code. The key claim — "MFU matters more than $/GPU-hour" — is the chapter's pragmatic punchline. Engineers reading Ch 10 should walk away with MFU as their core efficiency metric.

**Pedagogical outcomes for the reader.** After Ch 10, the reader should be able to:
1. State the major GPU families and their key specs (H100, A100, MI300X)
2. Explain the NVLink-vs-InfiniBand bandwidth gap (20-40×) and why it dictates parallelism
3. Identify the major training frameworks (FSDP, DeepSpeed, Megatron) and when to use each
4. Explain Triton at the level of "Python-embedded kernel language; alternative to CUDA"
5. State FlashAttention's key insight (I/O complexity reduction, not constant-factor speedup)
6. Explain activation checkpointing's trade-off and when it pays
7. State MFU and why it's the key engineering metric
8. Estimate training cost in GPU-hours and dollars for a given model

Eight outcomes. The exercises in session 48 will hit outcomes 2 (bandwidth), 5 (kernels), 6 (checkpointing), and 7 (MFU).

**This chapter closes the training-side arc of the tutorial.** Ch 7 + Ch 8 + Ch 9 + Ch 10 is the complete training story. After Ch 10, the tutorial moves to Ch 11 (alt architectures), Ch 13+ (post-training), Ch 17+ (inference), etc. Be aware this is the *bookend* — readers who finish Ch 10 should feel a sense of completion.
