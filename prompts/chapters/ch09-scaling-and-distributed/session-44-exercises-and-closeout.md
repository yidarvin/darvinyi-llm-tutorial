# Session 44 — Ch 9 exercises and closeout

> Final Chapter 9 session. Two deliverables: an **Exercises section** with 4 problems (Chinchilla loss, compute-optimal allocation, parallelism memory footprint, communication cost estimator) and the **status flip** from `'draft'` to `'published'`. Chapter 9 — completing the math + engineering of training at scale — joins production. Phase 9 needs only Ch 10 (training infrastructure) to fully close.

---

## Read first (in this order)

1. **`research/ch09-scaling-and-distributed/research.md`** — pedagogical outcomes 1, 2, 4, 5 are the focus of these exercises
2. **`prompts/chapters/ch09-scaling-and-distributed/session-41-page-structure.md`** — for the structure of `index.mdx` and where the Exercises section goes
3. **`prompts/chapters/ch08-building-small-llm/session-39-exercises-and-closeout.md`** — for the closeout template (Ch 8 established the pattern; same 4-exercise + status-flip layout)

---

## Goal

By end of session:

1. **An "Exercises" section is appended** to `index.mdx`, between section 8 ("What we've built — and what's next") and the final chapter close paragraph, containing 4 exercises with hints and runnable starter code
2. **Ch 9's status flips from `'draft'` to `'published'`** — Ch 9 is the ninth published chapter
3. **The chapter renders end-to-end as a complete deliverable**

After this session, Chapter 9 is the ninth complete chapter. **Phase 9 is now 3 of 4 chapters done.** Only Ch 10 (training infrastructure) remains to complete the entire training-side arc of the tutorial.

---

## Inputs

State of the repo after session 43:

- Sections 3 (`ScalingLawCalculator`) and 6 (`ParallelismDiagram`) both render with working widgets
- All 3 runnable code blocks from session 41 are in place
- `src/lib/chapters.ts` has Ch 1-8 `'published'`, Ch 9 `'draft'`

---

## Deliverables

1. **Update** `src/pages/ch09-scaling-and-distributed/index.mdx`:
   - Add new `## Exercises` section between section 8 ("What we've built — and what's next") and the final chapter close paragraph
   - The section contains 4 exercises (Exercise 1 — Exercise 4), each with a `<details>` hint block and a `<RunnableCode>` starter block
2. **Update** `src/lib/chapters.ts` — change Ch 9's `status` from `'draft'` to `'published'`

**Do NOT modify:** any widget file, any prior chapter, or any other infrastructure file.

---

## Detailed spec

### Part A — Exercises section

Insert between section 8 and the final chapter close paragraph:

````mdx
## Exercises

Four exercises that build on the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Chinchilla loss calculator

Implement the Chinchilla scaling law equation and verify two properties: (a) loss decreases as $N$ increases (model size); (b) loss decreases as $D$ increases (training tokens). Both monotonically.

<details>
<summary>Hint</summary>

The Chinchilla loss equation is $L(N, D) = E + A/N^\alpha + B/D^\beta$ with Hoffmann et al.'s fitted constants $E \approx 1.69$, $A \approx 406$, $B \approx 410$, $\alpha \approx 0.34$, $\beta \approx 0.28$. The monotonicity check is straightforward: as $N$ grows, $A/N^\alpha$ shrinks; as $D$ grows, $B/D^\beta$ shrinks. The loss is bounded below by $E$ — the irreducible entropy of natural language.

</details>

<RunnableCode
  client:visible
  defaultCode={`# Chinchilla fitted constants
E, A, B = 1.69, 406.0, 410.0
ALPHA, BETA = 0.34, 0.28

def chinchilla_loss(N, D):
    """L(N, D) = E + A/N^alpha + B/D^beta"""
    # TODO: implement
    pass

# Test 1: L(GPT-3) — 175B params, 300B tokens
# loss_gpt3 = chinchilla_loss(175e9, 300e9)
# print(f"GPT-3 (175B, 300B): loss = {loss_gpt3:.3f}")

# Test 2: L(Chinchilla) — 70B params, 1.4T tokens
# loss_chinchilla = chinchilla_loss(70e9, 1.4e12)
# print(f"Chinchilla (70B, 1.4T): loss = {loss_chinchilla:.3f}")
# print(f"(Should be LOWER than GPT-3, despite using fewer parameters — same compute budget)")

# Test 3: monotonicity in N (fix D = 1T tokens)
# print("\\nMonotonicity in N (D = 1T fixed):")
# for N in [1e9, 1e10, 1e11, 1e12]:
#     l = chinchilla_loss(N, 1e12)
#     print(f"  N={N:.0e}, loss = {l:.4f}")
# # Verify: each subsequent loss should be smaller

# Test 4: monotonicity in D (fix N = 7B params)
# print("\\nMonotonicity in D (N = 7B fixed):")
# for D in [1e9, 1e10, 1e11, 1e12]:
#     l = chinchilla_loss(7e9, D)
#     print(f"  D={D:.0e}, loss = {l:.4f}")
# # Verify: each subsequent loss should be smaller

# Test 5: irreducible loss
# huge_N, huge_D = 1e18, 1e18
# print(f"\\nLimit as N,D → ∞: {chinchilla_loss(huge_N, huge_D):.4f} (should approach E = {E})")
`}
  packages={[]}
/>

### Exercise 2 (medium) — Compute-optimal allocation

Given a compute budget $C$ (in FLOPs), find the model size $N$ and dataset size $D$ that minimize the Chinchilla loss subject to $6ND = C$. Use a brute-force search along the iso-compute curve.

<details>
<summary>Hint</summary>

Parameterize the constraint by the tokens-per-parameter ratio $r = D/N$. From $6ND = C$ and $D = rN$, you get $N = \sqrt{C / (6r)}$ and $D = r \cdot N$. Sweep $r$ over a wide range (log scale; say 0.1 to 2000) and pick the $r$ that minimizes the loss. The optimum should be near $r = 20$ regardless of $C$ — this is the "20 tokens per parameter" rule.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

E, A, B = 1.69, 406.0, 410.0
ALPHA, BETA = 0.34, 0.28

def chinchilla_loss(N, D):
    return E + A / N ** ALPHA + B / D ** BETA

def compute_optimal(C, ratios=None):
    """
    Given compute budget C (FLOPs), find N, D that minimize loss
    subject to 6 * N * D = C.
    Returns (N_opt, D_opt, ratio_opt, loss_opt).
    """
    if ratios is None:
        ratios = np.logspace(-1, 3.3, 200)   # 0.1 to ~2000

    # TODO: for each ratio r:
    #   1. Compute N = sqrt(C / (6 * r))
    #   2. Compute D = r * N
    #   3. Compute loss = chinchilla_loss(N, D)
    # TODO: pick the (N, D, r, loss) with the minimum loss
    pass

# Test: compute-optimal allocation at several compute budgets
# print(f"{'Compute (FLOPs)':>16} {'N_opt':>12} {'D_opt':>12} {'D/N':>6} {'Loss':>7}")
# print("-" * 60)
# for C in [1e22, 1e23, 6e23, 1e24, 1e25]:
#     N, D, r, L = compute_optimal(C)
#     print(f"{C:>16.1e} {N:>12.2e} {D:>12.2e} {r:>6.1f} {L:>7.3f}")
# # Verify: D/N should be near 20 regardless of C (the Chinchilla "rule of thumb")
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Parallelism memory footprint

For each of DP, TP, PP, and FSDP, compute the memory per GPU for a given model size and number of GPUs. Account for parameters, gradients, and optimizer state. Verify FSDP gives proportional reduction.

<details>
<summary>Hint</summary>

For a model of $N$ parameters trained with mixed precision + AdamW:

- **Parameters**: FP16 (2 bytes/param) = $2N$ bytes
- **Master weights**: FP32 (4 bytes/param) = $4N$ bytes
- **Gradients**: FP32 (4 bytes/param) = $4N$ bytes
- **Optimizer state**: AdamW stores $m, v$ in FP32 = $8N$ bytes total
- **Activations**: depends on batch size; ignore for this exercise

Total: $2N + 4N + 4N + 8N = 18N$ bytes per GPU under vanilla DP.

For each strategy, divide the appropriate state by the number of GPUs:
- **DP**: nothing sharded → $18N$ bytes/GPU regardless of GPU count
- **TP**: params + grads + optimizer state divided by TP-rank → $18N / \text{TP-rank}$ bytes/GPU
- **PP**: params + grads + optimizer state divided by PP-rank → $18N / \text{PP-rank}$ bytes/GPU
- **FSDP**: same as TP/PP for state, divided by DP-rank → $18N / \text{DP-rank}$ bytes/GPU

</details>

<RunnableCode
  client:visible
  defaultCode={`def memory_per_gpu(model_params, strategy, num_gpus):
    """
    Compute the per-GPU memory footprint in bytes for the given parallelism strategy.
    
    strategy: 'dp' | 'tp' | 'pp' | 'fsdp'
    
    Mixed-precision + AdamW accounting:
      params (FP16):       2N bytes
      master weights:      4N bytes  
      gradients (FP32):    4N bytes
      optimizer state:     8N bytes (m + v)
      Total:               18N bytes (vanilla DP)
    """
    BYTES_PER_PARAM_FULL = 18   # 2 + 4 + 4 + 8

    # TODO: for each strategy, return the per-GPU memory in bytes
    # 'dp':   full 18N (nothing sharded)
    # 'tp':   18N / num_gpus
    # 'pp':   18N / num_gpus
    # 'fsdp': 18N / num_gpus
    pass

# Test: 7B model on 8 GPUs (a typical training setup)
# print("=== 7B model, 8 GPUs ===")
# for strat in ['dp', 'tp', 'pp', 'fsdp']:
#     mem = memory_per_gpu(7e9, strat, 8)
#     print(f"  {strat.upper():<6} per-GPU: {mem/1e9:>5.1f} GB")

# Test: same model, 64 GPUs (FSDP advantage shows up)
# print("\\n=== 7B model, 64 GPUs ===")
# for strat in ['dp', 'tp', 'pp', 'fsdp']:
#     mem = memory_per_gpu(7e9, strat, 64)
#     print(f"  {strat.upper():<6} per-GPU: {mem/1e9:>5.1f} GB")
# # Verify: FSDP at 64 GPUs uses 1/8 the memory of DP at 64 GPUs

# Bonus: would a 70B model fit on 8 GPUs?
# print("\\n=== 70B model, 8 GPUs ===")
# for strat in ['dp', 'tp', 'pp', 'fsdp']:
#     mem = memory_per_gpu(70e9, strat, 8)
#     fits = "✓ fits" if mem / 1e9 < 80 else "✗ exceeds 80GB"
#     print(f"  {strat.upper():<6} per-GPU: {mem/1e9:>6.1f} GB  ({fits})")
`}
  packages={[]}
/>

### Exercise 4 (hard) — Communication cost in 3D parallelism

Estimate per-step communication cost for a 3D-parallel training setup. Inputs: model size, DP-rank, TP-rank, PP-rank, network bandwidth (TB/s). Outputs: communication time per step.

<details>
<summary>Hint</summary>

Each parallelism dimension has its own communication pattern:

- **DP all-reduce**: once per step; volume ≈ $2 \cdot \text{model\_size} / \text{DP-rank}$ bytes (per GPU). For Ring all-reduce on $n$ GPUs: $2(n-1)/n \cdot \text{model\_size}$.
- **TP all-reduce**: per layer; volume ≈ $\text{activation\_size}$ bytes per layer. Activation size depends on hidden dim, batch size, seq len.
- **PP peer-to-peer**: at stage boundaries; volume ≈ $\text{activation\_size}$ bytes per micro-batch boundary.
- **FSDP all-gather + reduce-scatter**: per layer; volume ≈ $2 \cdot \text{model\_size} / \text{DP-rank}$ bytes total (similar to DP but communicated piecewise).

For this exercise, use a simplified model: just account for DP and TP costs (PP costs are typically smaller). The communication time is `total_volume / bandwidth`.

</details>

<RunnableCode
  client:visible
  defaultCode={`def communication_time_per_step(
    model_params,    # number of parameters
    dp_rank,         # data parallel rank
    tp_rank,         # tensor parallel rank  
    num_layers,      # transformer layers
    seq_len,         # sequence length
    batch_size,      # per-DP batch size
    d_model,         # hidden dimension
    bandwidth_tb_s,  # interconnect bandwidth in TB/s
):
    """
    Estimate per-step communication time in seconds for DP + TP parallelism.
    
    DP cost: 1 × all-reduce(gradients) of size ~2 × model_params bytes (FP16 grads)
    TP cost: num_layers × all-reduce(activations) of size ~2 × batch × seq × d_model bytes
    """
    # Convert bandwidth to bytes/sec
    bandwidth_bytes_s = bandwidth_tb_s * 1e12

    # TODO: compute DP all-reduce volume
    # Ring all-reduce cost: 2 * (n - 1) / n * data_size; for large n ≈ 2 * data_size
    # dp_volume = 2 * (2 * model_params)  # 2 bytes per param (FP16 grads), all-reduce factor 2
    pass

    # TODO: compute TP all-reduce volume per layer
    # tp_per_layer = 2 * (2 * batch_size * seq_len * d_model)  # FP16 activations
    # tp_volume = num_layers * tp_per_layer

    # TODO: total time
    # total_volume = dp_volume + tp_volume
    # return total_volume / bandwidth_bytes_s

# Test: realistic 70B-class setup
# config = {
#     "model_params": 70e9,
#     "dp_rank": 64,
#     "tp_rank": 8,
#     "num_layers": 80,
#     "seq_len": 2048,
#     "batch_size": 4,
#     "d_model": 8192,
# }
# 
# # NVLink (within node, ~600 GB/s = 0.6 TB/s)
# nvlink_time = communication_time_per_step(**config, bandwidth_tb_s=0.6)
# print(f"NVLink (~600 GB/s):    {nvlink_time*1000:>7.2f} ms/step")
# 
# # InfiniBand (across nodes, ~25 GB/s = 0.025 TB/s)
# ib_time = communication_time_per_step(**config, bandwidth_tb_s=0.025)
# print(f"InfiniBand (~25 GB/s): {ib_time*1000:>7.2f} ms/step")
# 
# # Communication is much more expensive across nodes — this is why TP is within-node.
`}
  packages={[]}
/>

````

### Part B — Flip Ch 9's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 9, slug: 'ch09-scaling-and-distributed', title: 'Scaling laws and distributed training', partNum: 3, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **Section 3's** `ScalingLawCalculator` widget still renders correctly.
3. **Section 6's** `ParallelismDiagram` widget still renders correctly.
4. **The Exercises section** is below section 8 and above the chapter close paragraph; contains 4 sub-exercises with collapsible hints and runnable starter code.
5. **Exercise 1** uses no extra packages (pure Python math).
6. **Exercise 2** uses numpy (`np.logspace`, `np.argmin`).
7. **Exercises 3-4** use no extra packages.
8. **Sidebar:** Ch 1-9 all active (published); Ch 10-30 still dimmed.
9. **Landing page CTA:** still reads "Start with Chapter 1 →".
10. **Prev/next at bottom of Ch 9:** prev = Ch 8 (active); next = Ch 10 (disabled).
11. **TOC on Ch 9** includes Exercises as h2 plus 4 h3 sub-entries.
12. **`npm run typecheck`** passes.
13. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 9 flips.
- ❌ **Do not modify Ch 1-8.** Sealed.
- ❌ **Do not modify Ch 9 widgets.** Sealed.
- ❌ **Do not modify Ch 9 prose sections 1-8.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch09-scaling-and-distributed/index.mdx src/lib/chapters.ts
git commit -m "session 44: Ch 9 exercises + status: published"
git push origin main
```

After deploy:
- All 4 exercises render with working starter code
- Sidebar shows Ch 1-9 active
- Ch 9 closeout is visible

---

## Ch 9 closeout

Chapter 9 is now the ninth complete chapter on production. **The "scale-out" arc of the tutorial is complete.** Combined with Ch 8 (the training loop), the reader has the full mathematical and engineering machinery to run training at any scale.

Confirm before declaring Ch 9 done:

- ✅ BUILD_ORDER.md shows files 54-58 ✅
- ✅ File 59 marked ⏭️ (absorbed)
- ✅ Ch 9 status is `'published'`
- ✅ Both Ch 9 widgets work in production
- ✅ All 4 Ch 9 exercises render
- ✅ Section 3's Chinchilla code is intact
- ✅ Section 7's FSDP wrapper sketch is intact

**Cadence check across 9 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual-heavy | 2 | 4 |
| Ch 5 | Two-topic (architecture) | 2 | 5 |
| Ch 6 | Variants | 2 | 4 |
| Ch 7 | Data engineering | 2 | 4 |
| Ch 8 | Two-topic (training) | 2 | 5 |
| Ch 9 | Two-topic (scaling) | 2 | 5 |

The 5-file cadence has now been validated across **three distinct two-topic chapters** (Ch 5 architecture, Ch 8 training, Ch 9 scaling). The pattern is firmly established. 4-file cadence holds for single-topic chapters.

**Phase 9 (Pre-training) status:**
- ✅ Ch 7 (Pre-training data) — complete
- ✅ Ch 8 (Building a small LLM) — complete
- ✅ Ch 9 (Scaling laws + distributed training) — complete
- ⬜ Ch 10 (Training infrastructure) — next, the final chapter of Phase 9

Phase 9 is **75% complete** after Ch 9. Ch 10 is the systems engineering chapter — GPU clusters, NCCL, Triton kernels. It's framed in section 8 of Ch 9 as *practical depth* rather than *core knowledge*. The reader who finishes Ch 9 has the full conceptual training story; Ch 10 adds the production reality.

---

## Notes for the session author

**On the exercise progression:**
- **Exercise 1 (easy)** — Chinchilla loss with monotonicity checks. Verifies the reader understands the equation's structure and behavior at limits.
- **Exercise 2 (medium)** — brute-force compute-optimal allocation via grid search. The reader rediscovers the "20 tokens per parameter" rule numerically — no Lagrangian required. Each compute budget should yield $D/N \approx 20$ regardless of $C$, confirming the analytical claim.
- **Exercise 3 (medium)** — parallelism memory footprint with mixed-precision + AdamW accounting (18N bytes per GPU under vanilla DP). The bonus question (would 70B fit on 8 GPUs?) makes the strategies' practical differences concrete.
- **Exercise 4 (hard)** — communication cost estimator with NVLink vs InfiniBand comparison. The reader sees the ~24× bandwidth gap between within-node and across-node networks, which explains why TP is restricted to within nodes.

**On using `<RunnableCode>` for the parallelism exercises:**
Exercises 3-4 are about parallelism but don't actually run multi-GPU code — they're memory and bandwidth math. The runnable code computes hypothetical scenarios; the reader verifies their understanding without needing GPUs.

**On Exercise 4's bonus realization:**
The NVLink vs InfiniBand comparison is the chapter's most important practical lesson made concrete. Notes the chapter prose can't make this visceral; the exercise can: "InfiniBand is 24× slower than NVLink → TP must stay within node → typical TP-rank = 8 (single H100 node)." The exercise *demonstrates* the constraint the chapter explained.

**On the 4 exercises serving the 7 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. State Chinchilla equation | Ex 1 |
| 2. Compute optimal $N$, $D$ | Ex 2 |
| 3. Explain Llama-3 over-training | (chapter prose + widget) |
| 4. Distinguish DP/TP/PP | Ex 3 (memory footprint) |
| 5. Explain FSDP | Ex 3 (memory comparison) |
| 6. Identify communication primitives | (chapter prose + widget) |
| 7. Reason about bottlenecks | Ex 4 |

Outcomes 1, 2, 4, 5, 7 are served by exercises. Outcomes 3, 6 served by chapter prose + widgets. Comprehensive coverage.

**Pedagogical claim of the closeout:**
"You now have the full math + engineering toolkit for training at any scale. You can compute compute-optimal allocations (Chinchilla). You can choose parallelism strategies and estimate their memory + communication costs (DP/TP/PP/FSDP). You understand when each strategy makes sense and where each breaks. Ch 10's infrastructure chapter is practical depth on top of this conceptual foundation."

**This chapter closes the math + engineering of training.** Ch 7 (data) + Ch 8 (loop) + Ch 9 (scaling + distribution) = the conceptual training story. Ch 10 will be systems engineering. After Ch 10, Phase 9 closes and the tutorial enters the post-training arc (Phase 11+: MoE, alt architectures, SFT, RLHF, inference).

Chapter 9 is now complete. **Three two-topic chapters (Ch 5, 8, 9) validate the 5-file cadence.** The project's structure is stable; chapter cadence policy is reliable. Pace through Ch 10 should match Ch 7 (single-topic, 4 files).
