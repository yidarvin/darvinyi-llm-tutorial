# Chapter 10 — Training infrastructure: research

> Curated source material for Chapter 10's build sessions. The systems engineering chapter that closes Phase 9 (Pre-training). Where Ch 9 covered the *mathematics* of distribution (Chinchilla + DP/TP/PP/FSDP), Ch 10 covers the *practical reality* — GPU hardware, interconnects (NVLink + InfiniBand), NCCL collective implementations, training frameworks (DeepSpeed, Megatron, PyTorch FSDP), custom GPU kernels (Triton, FlashAttention), and the cost economics of frontier-scale training. Framed in Ch 9's section 8 as *practical depth* rather than *core knowledge* — useful for engineers who'll run the systems, optional for those who just want the conceptual story.

> **Single-topic chapter** — uses the **4-file cadence** (research + 3 chapter sessions).

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Training infrastructure

**Premise:** Ch 9 explained that frontier LLMs use 3D parallelism (DP + TP + PP) across thousands of GPUs. This chapter covers *how that actually works in practice*. What GPUs do the major labs use? How are they connected? What software stack runs the training? When do you write custom kernels? How much does it cost?

**Out of scope (other chapters):**
- Scaling laws themselves (Ch 9)
- Parallelism strategies (Ch 9)
- Post-training (Ch 13-15)
- Inference optimization (Ch 17-19)

**In scope and locked:**
- **GPU hardware**: H100, A100, GH200, MI300X — what each offers (memory, FLOPs, interconnect)
- **GPU interconnects**: NVLink (within node), InfiniBand / RoCE (across nodes)
- **NCCL**: the collective communications library; ring all-reduce algorithm
- **Training frameworks**: DeepSpeed (Microsoft), Megatron-LM (NVIDIA), PyTorch FSDP (native), JAX + GSPMD
- **Custom GPU kernels**: when to write them; **Triton** as the practical toolchain
- **FlashAttention**: the canonical custom-kernel success story
- **Activation checkpointing**: trading memory for compute
- **Mixed precision**: BF16 vs FP16 vs FP8
- **Checkpointing & fault tolerance**: practical concerns at scale
- **Cost economics**: GPU-hours, $/GPU-hour, frontier-model training costs

**Suggested chapter structure** (8 sections):

1. The setup — why infrastructure matters (~400 words)
2. The hardware — GPUs and what they offer (~700 words)
3. The interconnects — NVLink and InfiniBand (~600 words)
4. NCCL — collectives on GPUs (~500 words)
5. Training frameworks (~600 words)
6. Custom kernels — Triton and FlashAttention (~800 words — algorithmic centerpiece)
7. Practical concerns — checkpointing, mixed precision, activations (~600 words)
8. Cost economics + closeout (~300 words)

Target: ~4500 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Dao et al. 2022 — "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness"
- **arXiv:** [2205.14135](https://arxiv.org/abs/2205.14135)
- **What it contributed:** **FlashAttention** — a custom GPU kernel that computes attention with $O(N)$ memory instead of $O(N^2)$ by tiling and recomputation. Doesn't approximate; gives the same output as standard attention. Provides 2-4× speedup at long sequence lengths.
- **Why it matters:** the canonical example of "custom kernels matter more than the model architecture." Standard PyTorch attention is memory-bound on long sequences; FlashAttention is compute-bound. Same math, different implementation, dramatically different performance.
- **For the chapter:** central reference for section 6.

### Dao 2023 — "FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning"
- **arXiv:** [2307.08691](https://arxiv.org/abs/2307.08691)
- **What it contributed:** FlashAttention-2 — further optimizations on top of FA1, particularly around GPU thread utilization. ~2× faster than FA1, ~5-9× faster than standard attention.
- **For the chapter:** mention in section 6 as "the current default."

### Tillet et al. 2019 — "Triton: An Intermediate Language and Compiler for Tiled Neural Network Computations"
- **Paper:** [Tillet et al., MAPL 2019](https://www.eecs.harvard.edu/~htk/publication/2019-mapl-tillet-kung-cox.pdf)
- **What it contributed:** **Triton** — a Python-embedded language for writing GPU kernels at a higher level than CUDA. Lets researchers write custom kernels in dozens of lines instead of hundreds. OpenAI's preferred toolchain for kernel development.
- **For the chapter:** central reference for section 6.

### Korthikanti et al. 2022 — "Reducing Activation Recomputation in Large Transformer Models"
- **arXiv:** [2205.05198](https://arxiv.org/abs/2205.05198)
- **What it contributed:** **selective activation checkpointing** — recompute only the most-memory-intensive activations during the backward pass, not all of them. Saves memory with minimal compute overhead.
- **For the chapter:** central reference for section 7 (activation checkpointing).

### Chowdhery et al. 2022 — "PaLM: Scaling Language Modeling with Pathways"
- **arXiv:** [2204.02311](https://arxiv.org/abs/2204.02311)
- **What it contributed:** detailed infrastructure description for PaLM (540B parameters, 6144 TPU v4 chips). Production-scale demonstration of multi-thousand-chip training.
- **For the chapter:** brief reference; demonstrates scale.

### Micikevicius et al. 2022 — "FP8 Formats for Deep Learning"
- **arXiv:** [2209.05433](https://arxiv.org/abs/2209.05433)
- **What it contributed:** **FP8 mixed precision** — two formats (E4M3 and E5M2) for forward and backward respectively. Hopper-generation GPUs (H100+) support FP8 natively, providing ~2× throughput vs BF16.
- **For the chapter:** mention in section 7.

### Rajbhandari et al. 2020 — "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models"
- **arXiv:** [1910.02054](https://arxiv.org/abs/1910.02054)
- **What it contributed:** **DeepSpeed's ZeRO** (covered in Ch 9 as FSDP equivalent). For Ch 10: brief reference to DeepSpeed as a framework.
- **For the chapter:** brief reference in section 5.

---

## Core concepts and derivations

### Concept: GPU hardware spectrum

Frontier-scale LLM training in 2024 uses one of a few GPU families:

**NVIDIA H100 (Hopper, 2022-present)**
- 80 GB HBM3 memory
- 3 TB/s memory bandwidth
- ~989 TFLOPS BF16 matmul (with sparsity off)
- ~1979 TFLOPS FP8 matmul
- NVLink 4.0: 900 GB/s per GPU
- The current workhorse for frontier training (Llama-3, GPT-4-class)

**NVIDIA A100 (Ampere, 2020)**
- 40 or 80 GB HBM2e
- 2 TB/s memory bandwidth (80GB variant)
- ~312 TFLOPS BF16
- NVLink 3.0: 600 GB/s per GPU
- Still widely used; previous-generation frontier (GPT-3, Chinchilla, LLaMA 1)

**NVIDIA GH200 (Grace Hopper Superchip, 2023-present)**
- 96 or 144 GB HBM3 per GPU
- 4 TB/s memory bandwidth
- Tightly-coupled with Grace CPU; massive unified memory
- Used in newer frontier clusters

**AMD MI300X (CDNA 3, 2023-present)**
- 192 GB HBM3 memory (~2.4× H100)
- 5.3 TB/s memory bandwidth
- ~1.3 PFLOPS BF16
- Competitive alternative; growing adoption

**Cluster scale:** "8 GPUs per node" is standard. 1024 nodes × 8 GPUs = 8192 GPUs is a moderately large cluster. GPT-4-class models reportedly trained on 10,000-25,000 GPUs.

### Concept: GPU memory hierarchy

GPUs have a memory hierarchy that matters enormously for kernel performance:

- **Registers**: ~thousands of bytes per thread. Fastest.
- **Shared memory / L1 cache**: ~128 KB per SM (streaming multiprocessor). Fast, shared across threads in a block.
- **L2 cache**: ~40 MB total (H100). Medium speed, shared across all SMs.
- **HBM (high-bandwidth memory)**: 80 GB per H100. Main GPU memory. ~3 TB/s bandwidth.
- **Host memory (CPU RAM)**: ~100s of GB. Slowest; cross-PCIe transfers.

**The performance lesson**: keep data in the fastest tier of memory possible during compute. FlashAttention's trick is to keep attention computations in shared memory rather than streaming through HBM.

### Concept: NVLink and InfiniBand topology

**NVLink (within node)** — point-to-point GPU-GPU connection at ~900 GB/s per H100. 8 GPUs in a node form a **fully-connected** mesh via NVSwitch — every GPU can reach every other GPU at full bandwidth.

**InfiniBand (across nodes)** — switched network at ~25-50 GB/s per port. Typical topology: each GPU has 1 InfiniBand HCA; nodes connected via switches; full network has bandwidth proportional to node count.

**The bandwidth gap**: NVLink is ~20-40× faster than InfiniBand. This dictates parallelism design:
- **Within a node** (NVLink): communication-heavy operations like TP all-reduce
- **Across nodes** (InfiniBand): less-frequent operations like DP gradient all-reduce

This is *why* Ch 9 said "TP-rank is typically ≤ 8."

### Concept: NCCL — the collective communications library

NCCL is NVIDIA's library implementing collective operations (all-reduce, all-gather, etc.) on GPU networks. Key features:

- **Topology-aware**: detects NVLink + InfiniBand layout; chooses optimal algorithms.
- **GPU-direct**: data moves GPU-to-GPU without staging through CPU memory.
- **Ring all-reduce**: the default algorithm — divide tensor into chunks, pass chunks around a ring in a coordinated way. $2 \cdot (n-1)/n$ tensor-size of communication for $n$ GPUs.
- **Tree all-reduce**: alternative algorithm faster for very large $n$ (>32 nodes).

**Practical note**: NCCL configuration tuning (`NCCL_*` environment variables) can give 20-30% throughput improvements. Frontier training runs require careful NCCL tuning.

### Concept: Training frameworks landscape

Major LLM training stacks in 2024:

**PyTorch FSDP (native)**
- Built into PyTorch as `torch.distributed.fsdp.FullyShardedDataParallel`
- Implements ZeRO-3 with PyTorch-native API
- The current default for most teams; well-documented
- Limitations: TP and PP are *not* native; must combine with other libraries

**DeepSpeed (Microsoft)**
- The original ZeRO implementation; extensive features beyond PyTorch FSDP
- ZeRO-Infinity: offload to CPU/NVMe for huge models
- Best when needing extreme memory savings (e.g., trillion-parameter on small clusters)

**Megatron-LM (NVIDIA)**
- Native tensor parallelism + pipeline parallelism
- The TP/PP reference implementation
- Best when needing 3D parallelism

**Megatron-DeepSpeed**
- Combination — TP+PP from Megatron, FSDP-like sharding from DeepSpeed
- Used for Megatron-Turing NLG, BLOOM
- Best for very large models on heterogeneous clusters

**JAX + GSPMD (Google)**
- TPU-native; some GPU support
- Google's stack for PaLM, Gemini
- Different programming model (functional, traced)

For most non-Google workflows: PyTorch FSDP for ≤30B models; Megatron-LM for 30B+; Megatron-DeepSpeed for the largest.

### Concept: Custom kernels and Triton

**Why custom kernels?** PyTorch's auto-generated CUDA kernels are good but not always optimal. For specific common patterns (attention, matmul + activation fusion, layer norm), custom kernels can:

- Reduce memory bandwidth by fusing operations
- Use better memory hierarchy (keep intermediate results in SRAM)
- Eliminate Python overhead

**Triton** (OpenAI) is a Python-embedded language for writing GPU kernels at a higher level than CUDA. Reasonable performance with ~10× less code.

**A simple Triton kernel example (vector addition):**

```python
import triton
import triton.language as tl

@triton.jit
def vector_add_kernel(x_ptr, y_ptr, output_ptr, n_elements, BLOCK_SIZE: tl.constexpr):
    pid = tl.program_id(axis=0)
    offsets = pid * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)
    mask = offsets < n_elements
    x = tl.load(x_ptr + offsets, mask=mask)
    y = tl.load(y_ptr + offsets, mask=mask)
    output = x + y
    tl.store(output_ptr + offsets, output, mask=mask)

# Wrap as PyTorch op
def vector_add(x, y):
    output = torch.empty_like(x)
    n = output.numel()
    grid = (triton.cdiv(n, 1024),)
    vector_add_kernel[grid](x, y, output, n, BLOCK_SIZE=1024)
    return output
```

This is intentionally trivial — just adding two vectors — but shows the structure: `@triton.jit` decorator, work tiled across program IDs, explicit memory loads/stores, mask handling at boundaries.

**FlashAttention is the canonical complex Triton example**: it tiles attention computation so that for each query block, the K and V blocks are streamed through SRAM, kept in cache, and the softmax + matmul happens on-chip without writing intermediate $QK^T$ to HBM.

### Concept: FlashAttention's IO complexity

**Standard attention** (`softmax(QK^T / sqrt(d)) V`):
- Compute $S = QK^T$ in $\mathbb{R}^{N \times N}$ → write to HBM
- Compute $P = \text{softmax}(S)$ → read $S$ from HBM, write $P$ to HBM
- Compute $O = PV$ → read $P$ from HBM
- **HBM I/O**: $O(N^2 d + Nd)$ — dominated by the $N^2$ attention matrix
- **Memory**: $O(N^2)$ for the attention matrix

**FlashAttention** ($O(N)$ memory, $O(N^2 d / M)$ HBM I/O for $M$ = SRAM size):
- Process attention in **tiles** of size $B_r \times B_c$ that fit in SRAM
- Compute $S_{ij}$, online softmax, $O_{ij}$ all in SRAM, without writing $N \times N$ to HBM
- Re-scale partial outputs as new tiles are processed (online softmax algorithm)
- **HBM I/O**: $O(N d \cdot N / M)$ — much smaller for large $N$
- **Memory**: $O(N d)$ — linear in sequence length

**The result**: 2-4× speedup at typical sequence lengths (2K-8K); 10×+ speedup at very long contexts (32K-128K). No approximation; output is identical to standard attention.

This is the canonical "custom kernel > improved architecture" demonstration. Many of the architectural innovations of 2022-2024 (long-context LLMs, in particular) became possible because FlashAttention removed the $O(N^2)$ memory wall.

### Concept: Activation checkpointing

**The problem**: training requires storing all intermediate activations from the forward pass so that the backward pass can compute gradients. For a 70B-parameter model with seq_len=2048 and 80 layers, this is ~100s of GB of activations per micro-batch.

**The fix**: don't store all activations. **Checkpoint** at certain layer boundaries; during backward, recompute the intermediate activations from the nearest checkpoint.

**The trade-off**: typically 30% extra forward-pass compute, ~6× memory reduction. Almost always a good trade for large models.

**Selective activation checkpointing** (Korthikanti et al. 2022): instead of checkpointing every layer, identify which activations are the most memory-intensive (attention's QKV projections, MLP intermediate) and recompute only those. Reduces compute overhead to ~10% with similar memory savings.

### Concept: Mixed precision details

Three precision formats in modern training:
- **FP32**: 32-bit IEEE float. Master weights and optimizer state.
- **BF16 (bfloat16)**: 16-bit with 8 exponent + 7 mantissa bits. Same dynamic range as FP32; lower precision. **The current default for training.**
- **FP8** (E4M3 and E5M2): 8-bit floats. Hopper-generation GPUs support natively. ~2× throughput vs BF16; requires careful loss scaling.

**The training recipe (BF16 + FP32 master)**:
1. Maintain FP32 master copy of weights
2. Cast to BF16 for forward/backward pass
3. Compute gradients in BF16, accumulate in FP32
4. Apply optimizer update to FP32 master weights
5. Re-cast to BF16 for next step

BF16 is dominant because it has the same range as FP32 (avoiding the FP16 underflow issues). FP8 is gaining adoption on H100+ for additional throughput.

### Concept: Cost economics

Training a frontier model costs serious money. Rough back-of-the-envelope:

**GPU-hour cost** (cloud pricing, 2024):
- A100 80GB: ~$2-5/hr
- H100 80GB: ~$3-8/hr (depending on contract)
- Spot prices ~30-50% lower for owned clusters

**Training run examples** (estimated):
- LLaMA-2 70B: ~1.7M GPU-hours → ~$8M at $5/hr
- GPT-4 (rumored): ~30M GPU-hours → ~$100M+
- Llama-3 405B (estimated): ~16M GPU-hours → ~$50-80M

**The "$1B training run" prediction**: as models scale toward Chinchilla-optimal at the next compute level (~10²⁵-10²⁶ FLOPs), individual training runs approach $1B in compute cost. The largest expenses are now infrastructure, not researchers' time.

**Utilization matters more than $/hour**: a 50% MFU (model FLOPs utilization) means you're getting half the cost-efficiency you could be. Even small efficiency improvements (10%) on a $50M training run pay for *years* of engineer salaries.

---

## Glossary

- **GPU**: Graphics Processing Unit. The compute substrate for LLM training.
- **HBM (High-Bandwidth Memory)**: the main GPU memory. ~80GB on H100.
- **SM (Streaming Multiprocessor)**: a GPU's compute unit. H100 has 132 SMs.
- **Tensor core**: specialized matrix-multiply unit in modern GPUs.
- **NVLink**: NVIDIA's GPU-GPU interconnect within a node.
- **NVSwitch**: switch enabling full mesh NVLink connectivity in a multi-GPU node.
- **InfiniBand**: high-performance network for multi-node clusters.
- **RoCE (RDMA over Converged Ethernet)**: alternative to InfiniBand using Ethernet hardware.
- **NCCL**: NVIDIA Collective Communications Library — the GPU-aware MPI for deep learning.
- **PCIe (Peripheral Component Interconnect Express)**: the bus between CPU and GPU. Slower than NVLink.
- **Triton**: OpenAI's Python-embedded GPU kernel language.
- **FlashAttention**: the canonical custom-kernel example. Computes exact attention in $O(N)$ memory.
- **Activation checkpointing**: recompute activations during backward to save memory.
- **Selective activation checkpointing**: checkpoint only memory-intensive activations.
- **BF16 (bfloat16)**: 16-bit float with FP32-range. Current default training precision.
- **FP8**: 8-bit float. H100+ feature, ~2× throughput vs BF16.
- **MFU (Model FLOPs Utilization)**: actual FLOPs / theoretical max FLOPs. A measure of training efficiency.
- **DeepSpeed / Megatron-LM / PyTorch FSDP**: the major training frameworks.

---

## Pedagogical analogies

### 1. GPU as "specialized factory"
A GPU is a factory with ~16,000 tiny workers (CUDA cores) organized into ~132 teams (SMs). They all run the same program but on different data — single instruction, multiple data (SIMD). The factory's productivity depends as much on getting raw materials in fast enough (memory bandwidth) as on the workers' speed.

**Best used for:** section 2 motivation.

### 2. NVLink vs InfiniBand as "highway vs city street"
Within a single node, NVLink is a multi-lane highway (~900 GB/s) connecting GPUs. Across nodes, InfiniBand is more like a busy city street (~25-50 GB/s). Both are fast by everyday standards; the gap is what dictates "TP within nodes, DP across nodes."

**Best used for:** section 3 introducing the bandwidth gap.

### 3. FlashAttention as "doing math on a tiny chalkboard"
Standard attention writes the entire $N \times N$ attention matrix to main memory (HBM) — like writing a giant table on a billboard. FlashAttention tiles the work so each tile fits on a tiny chalkboard (GPU SRAM), then erases and reuses the chalkboard for the next tile. Same final answer, vastly less I/O.

**Best used for:** section 6 introducing FlashAttention.

### 4. Activation checkpointing as "discarding the recipe and re-deriving it"
The forward pass produces intermediate results (activations) that the backward pass needs. Storing all of them is expensive. Activation checkpointing throws most away and recomputes them when needed during backward — like discarding your work notes from a problem and re-solving the steps when you want to check your answer.

**Best used for:** section 7 introducing activation checkpointing.

### 5. Cost economics as "the price of compute, not the price of code"
Modern frontier training spends most of the budget on GPU-hours, not on engineering. A 5% efficiency improvement on a $50M training run is $2.5M — far more than the salary of the engineer who made it happen. This is why systems engineering has become a first-class research area.

**Best used for:** section 8 closing.

---

## Common misconceptions

### MC1: "Bigger GPU = always faster."
**Reality:** depends on workload + interconnect. A single H100 might *underperform* against 8 well-connected A100s for some workloads if HBM bandwidth is the bottleneck. Total throughput depends on memory bandwidth, interconnect speed, and software efficiency — not just FLOPS.

### MC2: "Multi-node is always slower than single-node."
**Reality:** *per GPU*, yes — InfiniBand is ~20× slower than NVLink. But for very large models, single-node can't even hold the parameters. Multi-node training is *necessary*, not optional. The art is hiding inter-node communication behind compute.

### MC3: "FlashAttention is just a faster attention."
**Reality:** FlashAttention changes the **I/O complexity** of attention from $O(N^2)$ HBM accesses to $O(N \cdot d)$ HBM accesses. This isn't a constant-factor speedup — it changes the *asymptotic memory footprint* of attention. Long-context LLMs (32K-200K context) became practical *because of* FlashAttention.

### MC4: "Mixed precision just saves memory."
**Reality:** mixed precision also **doubles training throughput**. BF16 matmuls run on tensor cores ~2× faster than FP32. FP8 (on H100+) doubles throughput again. Memory savings are a bonus; the speedup is the main point.

### MC5: "Activation checkpointing trades compute for memory."
**Reality:** it trades ~30% extra forward-pass compute for ~6× memory reduction. With selective checkpointing (Korthikanti et al. 2022), the trade is ~10% compute for ~5× memory. Often the compute overhead is *hidden* — the backward pass was waiting on memory bandwidth anyway, and recomputing activations uses idle compute. **Sometimes it's nearly free.**

### MC6: "Triton makes everything faster."
**Reality:** Triton lets you write custom kernels more easily, but the kernel still has to be *better* than PyTorch's default. Most PyTorch operations have already-optimized kernels (cuBLAS, cuDNN). Triton's value is in *fusing* operations that PyTorch can't fuse (like FlashAttention's softmax-matmul fusion) or implementing patterns PyTorch doesn't have.

### MC7: "$/GPU-hour is what matters."
**Reality:** **utilization matters more**. A cluster with 30% MFU (model FLOPs utilization) at $5/hr/GPU costs *more per useful FLOP* than a cluster with 60% MFU at $8/hr/GPU. Modern training engineering focuses heavily on MFU optimization — sometimes more than on raw infrastructure costs.

---

## Reference implementations

### Triton vector-add kernel (the "hello world" of GPU kernels)

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
#     mask = offsets < n_elements              # don't read past the end
#     x = tl.load(x_ptr + offsets, mask=mask)
#     y = tl.load(y_ptr + offsets, mask=mask)
#     output = x + y
#     tl.store(output_ptr + offsets, output, mask=mask)

# def vector_add(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
#     output = torch.empty_like(x)
#     n = output.numel()
#     grid = (triton.cdiv(n, 1024),)
#     vector_add_kernel[grid](x, y, output, n, BLOCK_SIZE=1024)
#     return output

print("Triton kernel above is illustrative — running requires GPU + Triton.")
print("Note the structure:")
print("  1. @triton.jit decorator")
print("  2. Work tiled across program IDs (each program processes BLOCK_SIZE elements)")
print("  3. Explicit memory loads (tl.load) and stores (tl.store)")
print("  4. Boundary handling via masks")
print("\nFor real kernels (like FlashAttention), the same structure scales — just with")
print("more complex compute inside each program.")
```

### Activation checkpointing in PyTorch

```python
# Illustrative — PyTorch API for activation checkpointing.

# import torch
# import torch.utils.checkpoint as checkpoint

# class TransformerBlock(torch.nn.Module):
#     def __init__(self, d_model, n_heads, ...):
#         ...
    
#     def forward(self, x):
#         # x → attention → x_attn → FFN → out
#         ...

# # Without activation checkpointing: each block stores all intermediate activations
# class StandardModel(torch.nn.Module):
#     def __init__(self):
#         super().__init__()
#         self.blocks = torch.nn.ModuleList([TransformerBlock(...) for _ in range(80)])
    
#     def forward(self, x):
#         for block in self.blocks:
#             x = block(x)
#         return x

# # With activation checkpointing: don't store intermediates; recompute on backward
# class CheckpointedModel(torch.nn.Module):
#     def __init__(self):
#         super().__init__()
#         self.blocks = torch.nn.ModuleList([TransformerBlock(...) for _ in range(80)])
    
#     def forward(self, x):
#         for block in self.blocks:
#             x = checkpoint.checkpoint(block, x, use_reentrant=False)
#         return x

# Result: ~6x memory reduction, ~30% slower forward pass.

print("PyTorch's torch.utils.checkpoint wraps an operation; during backward,")
print("the operation is RE-RUN to produce the activations needed for gradient computation.")
print("\nWith 80 layers and ~6x memory reduction per layer:")
print("  Standard: each step requires ~80 GB of activations (rough)")
print("  Checkpointed: each step requires ~13 GB of activations")
print("  Cost: ~30% slower training")
```

### MFU calculation

```python
def model_flops_utilization(achieved_tokens_per_sec, model_params, seq_len, batch_size, num_gpus, peak_flops_per_gpu):
    """
    Compute MFU (Model FLOPs Utilization).
    
    achieved_tokens_per_sec: end-to-end training throughput
    peak_flops_per_gpu: theoretical peak (e.g., 989e12 for H100 BF16 without sparsity)
    
    Returns MFU as a fraction in [0, 1]. Modern well-tuned training reaches 40-50% MFU.
    """
    # Forward + backward FLOPs per token: ~6 * model_params
    # (Forward: 2 * model_params; Backward: 4 * model_params)
    flops_per_token = 6 * model_params
    
    achieved_flops_per_sec = achieved_tokens_per_sec * flops_per_token
    theoretical_flops_per_sec = num_gpus * peak_flops_per_gpu
    
    return achieved_flops_per_sec / theoretical_flops_per_sec

# Example: Llama-3 8B training on 128 H100s achieving 500K tokens/sec
mfu = model_flops_utilization(
    achieved_tokens_per_sec=500_000,
    model_params=8e9,
    seq_len=8192,
    batch_size=2,
    num_gpus=128,
    peak_flops_per_gpu=989e12,   # H100 BF16
)
print(f"Achieved MFU: {mfu * 100:.1f}%")
# Real-world MFU for Llama-3 8B: ~40-50% — a respectable number
```

---

## Connections to other chapters

- **Ch 8 (Training loop):** Ch 10 covers the systems engineering that makes the Ch 8 training loop run at scale. Same loop body; different infrastructure.
- **Ch 9 (Scaling + distributed):** Ch 10 is the practical companion to Ch 9. Ch 9 explains parallelism *strategy*; Ch 10 explains *how to actually run it* on real GPU clusters.
- **Ch 4 (Attention):** FlashAttention from Ch 10 is the high-performance implementation of Ch 4's standard attention. Same math, dramatically different performance.
- **Ch 17 (Inference):** inference has its own infrastructure considerations (KV cache, batching, paged attention). Ch 17 reuses some Ch 10 concepts (custom kernels, memory hierarchy).
- **Ch 26 (Evaluation):** training run cost feeds into experiment design. MFU optimization is a research area in its own right.

---

## Open questions for the chapter author

### Q1: How much hardware detail?
**Recommendation:** medium. State H100/A100/MI300X specs in section 2 but don't deep-dive into GPU architecture. The reader needs to know "H100 has 80GB HBM and 989 TFLOPS" but doesn't need warp-level scheduling details.

### Q2: How much Triton code?
**Recommendation:** include the vector-add kernel as a "hello world" runnable in section 6. Don't try to write FlashAttention from scratch — too long and complex for chapter pedagogy. Mention that FlashAttention exists in Triton form in the FlashAttention2 reference repo.

### Q3: How much cost economics?
**Recommendation:** brief section 8 covering rough GPU-hour costs and frontier training expenses. Don't speculate on private models' exact training costs — use ranges and "rumored" labels.

### Q4: Triton vs CUDA — how deep?
**Recommendation:** explain Triton as "easier to write than CUDA, comparable performance for most patterns." Don't deep-dive into when CUDA outperforms Triton — that's a graduate-level optimization topic.

### Q5: Widget candidates
1. **Training Stack Picker (marquee, session 47):** sliders for model size + GPU type + GPU count → recommended parallelism stack (FSDP, Megatron, DeepSpeed), estimated MFU, estimated cost. Practical decision support tool. **Recommended marquee.**
2. **Step Timeline (secondary, session 48):** Gantt-chart visualization of one training step showing compute (forward, backward) and communication (all-reduce, all-gather) phases. Toggle "overlap" on/off to see how communication can hide behind compute. **Recommended secondary.**
3. **GPU Memory Breakdown (alternative):** stacked bar showing parameters / gradients / optimizer state / activations under different parallelism choices. Less pedagogically central than (1) and (2).

Recommend (1) and (2).

---

## Pre-research notes

**Chapter cadence:** Ch 10 is a **single-topic chapter** (training infrastructure) — uses the **4-file cadence** (research + 3 chapter sessions).

Planned file layout:
- File 60: research (this)
- File 61: page structure (~600 lines, 8 sections; Triton walkthrough embedded as runnable code)
- File 62: training stack picker marquee widget
- File 63: step timeline secondary widget + exercises + closeout (status flip 'draft' → 'published')

File 64 from the original BUILD_ORDER absorbed.

**Pedagogical outcomes for the reader.** After Ch 10, the reader should be able to:
1. State the major GPU families (H100, A100, MI300X) and their key specs
2. Explain the NVLink-vs-InfiniBand bandwidth gap and why it dictates parallelism choices
3. Identify the major training frameworks (FSDP, DeepSpeed, Megatron) and when to use each
4. Explain what Triton is and what it's good for
5. Describe FlashAttention's key insight (IO complexity reduction) without re-deriving the algorithm
6. Explain activation checkpointing's trade-off and when it pays
7. State the MFU concept and why it's the key engineering metric for training efficiency
8. Estimate training cost in GPU-hours and dollars for a given model

Eight outcomes. The exercises will hit outcomes 2 (bandwidth math), 4-5 (kernels), 6 (checkpointing memory math), and 7 (MFU calculation).

**This chapter closes Phase 9 — the entire training arc.** Ch 7 (data) + Ch 8 (loop) + Ch 9 (scaling math + parallelism strategies) + Ch 10 (infrastructure) = the complete training-side story. After Ch 10, the tutorial moves to alternative architectures (Ch 11+), post-training (Ch 13+), and inference (Ch 17+).

Framing within the tutorial: Ch 10 is **practical depth** — the reader who stops at Ch 9 has the conceptual training story; Ch 10 adds the production reality. The chapter should be honest that its content is more specialized than earlier chapters.
