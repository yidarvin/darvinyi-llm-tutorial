# Session 39 — Ch 8 exercises and closeout

> Final Chapter 8 session. Two deliverables: an **Exercises section** with 4 problems (cross-entropy from logits, AdamW from scratch, warmup + cosine schedule, complete training loop on a tiny corpus) and the **status flip** from `'draft'` to `'published'`. Chapter 8 — the project's center of gravity for training-side material — joins production. Phase 9 is now half complete.

---

## Read first (in this order)

1. **`research/ch08-building-small-llm/research.md`** — pedagogical outcomes 1, 3, 4, 6 are the focus of these exercises
2. **`prompts/chapters/ch08-building-small-llm/session-36-page-structure.md`** — for the structure of `index.mdx` and where the Exercises section goes
3. **`prompts/chapters/ch07-pretraining-data/session-34-quality-filter-and-exercises.md`** — for the closeout template (the most recent closeout session establishes the pattern)

---

## Goal

By end of session:

1. **An "Exercises" section is appended** to `index.mdx`, between section 9 ("What we've built — and what's next") and the final chapter close paragraph, containing 4 exercises with hints and runnable starter code
2. **Ch 8's status flips from `'draft'` to `'published'`** — Ch 8 is the eighth published chapter
3. **The chapter renders end-to-end as a complete deliverable**

After this session, Chapter 8 is the eighth complete chapter — and the centerpiece of Phase 9 (Pre-training). The reader now has the full path from "what is a transformer" (Ch 1-6) to "build the corpus" (Ch 7) to "train the model" (Ch 8) on production.

---

## Inputs

State of the repo after session 38:

- Sections 4 (`OptimizerComparison`) and 7 (`LossCurve`) both render with working widgets
- All 6 runnable code blocks from sessions 36 are in place
- `src/lib/chapters.ts` has Ch 1-7 `'published'`, Ch 8 `'draft'`

---

## Deliverables

1. **Update** `src/pages/ch08-building-small-llm/index.mdx`:
   - Add new `## Exercises` section between section 9 ("What we've built — and what's next") and the final chapter close paragraph
   - The section contains 4 exercises (Exercise 1 — Exercise 4), each with a `<details>` hint block and a `<RunnableCode>` starter block
2. **Update** `src/lib/chapters.ts` — change Ch 8's `status` from `'draft'` to `'published'`

**Do NOT modify:** any widget file, any prior chapter, or any other infrastructure file.

---

## Detailed spec

### Part A — Exercises section

Insert between section 9 and the final chapter close paragraph:

````mdx
## Exercises

Four exercises that build on the chapter's machinery. Each is a self-contained problem with a starting template; the runnable code lets you iterate without leaving the page. Hints are collapsed — try the problem first.

### Exercise 1 (easy) — Cross-entropy from logits

Implement cross-entropy loss for next-token prediction. Verify it matches the theoretical random baseline ($-\log(1/V)$ for a uniform distribution over $V$ classes) when the logits are random and the targets are random.

<details>
<summary>Hint</summary>

For numerical stability, compute log-softmax explicitly rather than softmax-then-log. The standard trick: subtract the max logit before exponentiating. Then index the log-probabilities at the target positions and take the negative mean.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

np.random.seed(42)

def cross_entropy(logits, targets):
    """
    logits: (n, V) — predicted logits at each position
    targets: (n,) — true token indices
    Returns: average cross-entropy loss (scalar)
    """
    # TODO: implement
    # Hint 1: subtract max(logits) per row for numerical stability
    # Hint 2: log_probs = logits_shifted - log(sum(exp(logits_shifted)))
    # Hint 3: gather log_probs at target indices, then negate and average
    pass

# Test: with random logits and random targets, loss ≈ log(V)
V = 100
n = 200
logits = np.random.normal(0, 1, (n, V))
targets = np.random.randint(0, V, n)

# loss = cross_entropy(logits, targets)
# baseline = np.log(V)   # theoretical loss for uniform predictions
# print(f"Cross-entropy loss: {loss:.4f}")
# print(f"Theoretical baseline (log V): {baseline:.4f}")
# print(f"Difference: {abs(loss - baseline):.4f}")
# assert abs(loss - baseline) < 0.5, f"Expected loss near log({V}) = {baseline:.2f}, got {loss:.2f}"

# Bonus: what happens to the loss if targets are deliberately the highest-logit class?
# best_targets = np.argmax(logits, axis=-1)
# loss_best = cross_entropy(logits, best_targets)
# print(f"\\nIf we always 'predict correctly': loss = {loss_best:.4f}")
# (should be < log(V) — even random logits have some max-logit class)
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Implement AdamW from scratch

Implement AdamW with bias correction. Verify your implementation converges on a simple quadratic, and observe that weight decay biases the convergence point toward the origin.

<details>
<summary>Hint</summary>

Maintain $m_t$ (first moment) and $v_t$ (second moment) per parameter. At each step:

1. Update $m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t$
2. Update $v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2$
3. Bias-correct: $\hat{m}_t = m_t / (1-\beta_1^t)$, $\hat{v}_t = v_t / (1-\beta_2^t)$
4. AdamW update: $\theta_t = (1 - \alpha\lambda)\theta_{t-1} - \alpha \hat{m}_t / (\sqrt{\hat{v}_t} + \epsilon)$

The key difference from Adam + L2: the weight decay term $(1 - \alpha\lambda)\theta_{t-1}$ is applied multiplicatively, not folded into the gradient.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

class AdamW:
    def __init__(self, params_shape, lr=0.01, beta1=0.9, beta2=0.95, eps=1e-8, weight_decay=0.0):
        # TODO: initialize m, v, t, and store hyperparameters
        pass

    def step(self, params, grads):
        """In-place update of params using gradients."""
        # TODO: implement AdamW update
        # 1. Increment t
        # 2. Update m and v
        # 3. Compute bias-corrected m_hat, v_hat
        # 4. Update params: (1 - lr*wd)*params - lr*m_hat/(sqrt(v_hat)+eps)
        pass

# Test 1: convergence on (x - 3)^2 with weight_decay = 0
print("=== Test 1: no weight decay — should converge to x = 3 ===")
params = np.array([0.0])
opt = AdamW(params.shape, lr=0.1, weight_decay=0.0)
for step in range(200):
    grads = 2 * (params - 3)
    opt.step(params, grads)
print(f"Final x = {params[0]:.4f} (expected: 3.0)")

# Test 2: same problem, with weight_decay = 0.05
# Weight decay should pull x slightly toward 0
print("\\n=== Test 2: weight_decay = 0.05 — convergence point pulled toward 0 ===")
params = np.array([0.0])
opt = AdamW(params.shape, lr=0.1, weight_decay=0.05)
for step in range(200):
    grads = 2 * (params - 3)
    opt.step(params, grads)
print(f"Final x = {params[0]:.4f} (expected: < 3.0, somewhere around 2.5-2.9)")
print("(The exact value depends on the equilibrium between gradient pull and decay pull)")
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Warmup + cosine schedule

Implement the warmup + cosine decay LR schedule. Verify it ramps to peak at the warmup boundary, decays smoothly, and reaches the minimum floor at total_steps.

<details>
<summary>Hint</summary>

Three regimes:

1. **Warmup** ($t < W$): $\alpha(t) = \alpha_{\max} \cdot t/W$
2. **Cosine decay** ($W \leq t \leq T$): $\alpha(t) = \alpha_{\min} + \frac{1}{2}(\alpha_{\max} - \alpha_{\min})(1 + \cos(\pi \cdot (t-W)/(T-W)))$
3. **Beyond training** ($t > T$): stay at $\alpha_{\min}$

At $t = W$: warmup gives $\alpha_{\max}$; cosine at progress=0 gives $\alpha_{\min} + (\alpha_{\max} - \alpha_{\min}) = \alpha_{\max}$. So the schedule is continuous at the boundary.

At $t = T$: cosine at progress=1 gives $\alpha_{\min} + 0 = \alpha_{\min}$.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def lr_schedule(step, max_lr=6e-4, min_lr=6e-5, warmup_steps=2000, total_steps=100000):
    """Return the learning rate at the given step."""
    # TODO: implement three regimes
    # 1. step < warmup_steps: linear ramp
    # 2. warmup_steps <= step <= total_steps: cosine decay
    # 3. step > total_steps: stay at min_lr
    pass

# Verify schedule properties
W = 2000
T = 100000
max_lr = 6e-4
min_lr = 6e-5

# Check: at step 0, lr = 0
# lr_at_0 = lr_schedule(0, max_lr, min_lr, W, T)
# print(f"step 0:        lr = {lr_at_0:.2e} (expected: 0.0)")
# assert abs(lr_at_0) < 1e-9

# Check: at warmup boundary, lr = max_lr
# lr_at_W = lr_schedule(W, max_lr, min_lr, W, T)
# print(f"step {W}:     lr = {lr_at_W:.2e} (expected: {max_lr:.2e})")
# assert abs(lr_at_W - max_lr) < 1e-9

# Check: at total_steps, lr = min_lr
# lr_at_T = lr_schedule(T, max_lr, min_lr, W, T)
# print(f"step {T}:   lr = {lr_at_T:.2e} (expected: {min_lr:.2e})")
# assert abs(lr_at_T - min_lr) < 1e-9

# Check: cosine decay is monotonic (each step lower than the previous)
# steps_to_check = range(W, T, 1000)
# prev_lr = max_lr + 1   # start higher than any expected value
# for s in steps_to_check:
#     curr_lr = lr_schedule(s, max_lr, min_lr, W, T)
#     assert curr_lr < prev_lr, f"Schedule not monotonic at step {s}"
#     prev_lr = curr_lr
# print("\\n✓ Cosine decay is monotonic from step W to step T")
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Tiny end-to-end training loop

Train a *very* small character-level transformer on a tiny corpus end-to-end. The scaffolding (data, model class, hyperparameters) is provided; you implement the training loop and verify the loss drops.

<details>
<summary>Hint</summary>

The training loop has 7 phases per step (see section 7 of this chapter):

1. Compute learning rate from schedule
2. Get a batch: `(x, y)` where `y` is `x` shifted by 1
3. Forward pass: `logits = model(x)`; compute cross-entropy on `logits.view(-1, V), y.view(-1)`
4. Backward pass: `optimizer.zero_grad(); loss.backward()`
5. Gradient clipping: `torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)`
6. Set the LR on all optimizer param groups; then `optimizer.step()`
7. Periodically log

The expected outcome: starting loss around 3.0 (random baseline for the small vocab), ending loss around 1.5-2.0 after a few hundred steps on the toy corpus.

</details>

<RunnableCode
  client:visible
  defaultCode={`import math
import torch
import torch.nn as nn
import torch.nn.functional as F

torch.manual_seed(42)

# === Toy character-level setup ===
# Tiny corpus: a single sentence repeated
corpus = ("the quick brown fox jumps over the lazy dog. " * 100)
chars = sorted(set(corpus))
vocab_size = len(chars)
char_to_idx = {c: i for i, c in enumerate(chars)}
idx_to_char = {i: c for i, c in enumerate(chars)}
data = torch.tensor([char_to_idx[c] for c in corpus], dtype=torch.long)
print(f"Vocab size: {vocab_size}")
print(f"Random baseline loss: log({vocab_size}) = {math.log(vocab_size):.3f}")

# === Tiny transformer ===
class TinyGPT(nn.Module):
    def __init__(self, vocab_size, d_model=64, n_heads=4, n_layers=2, seq_len=32):
        super().__init__()
        self.tok_emb = nn.Embedding(vocab_size, d_model)
        self.pos_emb = nn.Embedding(seq_len, d_model)
        self.blocks = nn.ModuleList([
            nn.TransformerEncoderLayer(d_model, n_heads, dim_feedforward=4*d_model, batch_first=True, activation='gelu')
            for _ in range(n_layers)
        ])
        self.ln_f = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab_size, bias=False)
        self.seq_len = seq_len

    def forward(self, x):
        B, T = x.shape
        pos = torch.arange(T, device=x.device)
        h = self.tok_emb(x) + self.pos_emb(pos)
        # Causal mask
        causal_mask = torch.triu(torch.ones(T, T, device=x.device), diagonal=1).bool()
        for block in self.blocks:
            h = block(h, src_mask=causal_mask)
        h = self.ln_f(h)
        return self.head(h)

# === Data loader ===
SEQ_LEN = 32
BATCH_SIZE = 32

def get_batch():
    ix = torch.randint(0, len(data) - SEQ_LEN - 1, (BATCH_SIZE,))
    x = torch.stack([data[i:i+SEQ_LEN] for i in ix])
    y = torch.stack([data[i+1:i+SEQ_LEN+1] for i in ix])
    return x, y

# === Hyperparameters ===
MAX_LR = 3e-3
MIN_LR = 3e-4
WARMUP = 50
TOTAL = 500

def lr_at(step):
    if step < WARMUP:
        return MAX_LR * (step / WARMUP)
    progress = (step - WARMUP) / (TOTAL - WARMUP)
    return MIN_LR + 0.5 * (MAX_LR - MIN_LR) * (1 + math.cos(math.pi * progress))

# === Build model + optimizer ===
model = TinyGPT(vocab_size, d_model=64, n_heads=4, n_layers=2, seq_len=SEQ_LEN)
optimizer = torch.optim.AdamW(model.parameters(), lr=MAX_LR, betas=(0.9, 0.95), weight_decay=0.1)

# === Training loop ===
print(f"\\nTraining for {TOTAL} steps...")
losses = []
for step in range(TOTAL):
    # TODO: implement the 7-phase training loop
    # 1. compute lr_at(step) and set on optimizer param groups
    # 2. get_batch()
    # 3. forward: logits = model(x); loss = cross_entropy(logits.view(-1, V), y.view(-1))
    # 4. optimizer.zero_grad(); loss.backward()
    # 5. torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    # 6. optimizer.step()
    # 7. losses.append(loss.item()); print every 50 steps
    pass

# Verify: loss dropped
if losses:
    print(f"\\nStarting loss: {losses[0]:.3f}")
    print(f"Ending loss:   {losses[-1]:.3f}")
    print(f"Drop:          {losses[0] - losses[-1]:.3f}")
    # Expected: ending loss < starting loss by at least 0.5
`}
  packages={["torch"]}
/>

````

### Part B — Flip Ch 8's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 8, slug: 'ch08-building-small-llm', title: 'Building a small LLM', partNum: 3, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **Section 4's** `OptimizerComparison` widget still renders correctly.
3. **Section 7's** `LossCurve` widget still renders correctly.
4. **The Exercises section** is below section 9 and above the chapter close paragraph; contains 4 sub-exercises with collapsible hints and runnable starter code.
5. **Exercise 4** is correctly marked as hard; uses PyTorch (the only exercise with a PyTorch package dep).
6. **Sidebar:** Ch 1-8 all active (published); Ch 9-30 still dimmed.
7. **Landing page CTA:** still reads "Start with Chapter 1 →".
8. **Prev/next at bottom of Ch 8:** prev = Ch 7 (active); next = Ch 9 (disabled).
9. **TOC on Ch 8** includes Exercises as h2 plus 4 h3 sub-entries.
10. **`npm run typecheck`** passes.
11. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 8 flips.
- ❌ **Do not modify Ch 1-7.** Sealed.
- ❌ **Do not modify Ch 8 widgets.** Sealed.
- ❌ **Do not modify Ch 8 prose sections 1-9.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch08-building-small-llm/index.mdx src/lib/chapters.ts
git commit -m "session 39: Ch 8 exercises + status: published"
git push origin main
```

After deploy:
- All 4 exercises render with working starter code
- Sidebar shows Ch 1-8 active
- Ch 8 closeout is visible

---

## Ch 8 closeout

Chapter 8 is now the eighth complete chapter on production. **The project's center of gravity for training-side material is complete.** Combined with Ch 1-6 (architecture) and Ch 7 (data), the reader has the entire path: random tokens → trained model.

Confirm before declaring Ch 8 done:

- ✅ BUILD_ORDER.md shows files 48-52 ✅
- ✅ File 53 marked ⏭️ (absorbed)
- ✅ Ch 8 status is `'published'`
- ✅ Both Ch 8 widgets work in production
- ✅ All 4 Ch 8 exercises render
- ✅ Section 7's training loop capstone code is intact

**Cadence check across 8 chapters:**

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

The 5-file cadence appears for two-topic chapters (Ch 5 and Ch 8); 4-file for single-topic chapters. The pattern is stable across both architectural (Ch 5) and training-side (Ch 8) two-topic chapters. Project's cadence policy validated.

**Phase 9 (Pre-training) status:**
- ✅ Ch 7 (Pre-training data) — complete
- ✅ Ch 8 (Building a small LLM) — complete
- ⬜ Ch 9 (Scaling laws + distributed training) — next
- ⬜ Ch 10 (Training infrastructure) — after

Phase 9 is roughly half complete after Ch 8. Ch 9 and Ch 10 will be substantial — Ch 9 covers the Chinchilla scaling law and basic distributed training (data parallelism, FSDP); Ch 10 covers the GPU systems engineering (cluster orchestration, Triton kernels). Both topics are dense.

---

## Notes for the session author

**On the exercise progression:**
- **Exercise 1 (easy)** — cross-entropy from logits with the random-baseline check. Verifies the reader understands what the loss represents.
- **Exercise 2 (medium)** — AdamW from scratch with a deliberate weight-decay test that mirrors the OptimizerComparison widget's claim. The test cases force the reader to *observe* the decay-pulled-toward-origin effect numerically.
- **Exercise 3 (medium)** — LR schedule with three assertion points (step 0, step W, step T) plus monotonicity check. The reader verifies that the schedule is continuous at the warmup boundary.
- **Exercise 4 (hard)** — the full training loop on a tiny corpus. Scaffolding provided; reader implements the 7-phase loop. Expected to drop from random baseline (~3.0) to ~1.5-2.0 over 500 steps. This is the chapter's culminating exercise — the reader *trains a model end-to-end* on their own.

**On Exercise 4 being PyTorch-based:**
This is the only exercise that requires PyTorch. The earlier exercises are numpy for the standalone teaching value (you learn the math by implementing it). Exercise 4 needs PyTorch because:
- A full transformer is too much to implement from scratch as an exercise
- `nn.TransformerEncoderLayer` provides the architecture; the reader focuses on the *training loop*
- The whole point is "verify your training loop on a real (tiny) model"

Pyodide supports PyTorch CPU. The Exercise 4 should run in ~30-60 seconds in Pyodide.

**On Exercise 4's expected outcome:**
With the provided hyperparameters (LR 3e-3 max, 50 warmup, 500 total, AdamW with weight decay 0.1), the model should reliably drop from loss ~3.0 to ~1.5-2.0. The drop is *visible* — the reader sees their training loop work.

If the reader's implementation has a bug (e.g., forgets to call `optimizer.zero_grad()`), the loss won't drop. The exercise has built-in error detection — a working loop gives a falling loss curve; a broken loop doesn't.

**On the 4 exercises serving the 7 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. State cross-entropy loss | Ex 1 |
| 2. Explain AdamW > Adam + L2 | (chapter prose) |
| 3. Implement AdamW from scratch | Ex 2 |
| 4. State warmup + cosine schedule | Ex 3 |
| 5. Explain why gradient clipping helps | (chapter prose + Ex 4 uses it) |
| 6. Implement complete training loop | Ex 4 |
| 7. Generate text with sampling | (chapter prose) |

Outcomes 1, 3, 4, 6 are directly served by exercises. Outcomes 2, 5, 7 are served by the chapter prose. Together, the chapter covers all 7 outcomes.

**Pedagogical claim of the closeout:** "You can now read the training loop in section 7 and *understand what every line does*. You can implement it. You can debug it. You have the full mental model of how an LLM trains." After working through these exercises, the reader knows what every piece of `torch.optim.AdamW(...)` actually means.

**This chapter is the project's pivot point.** Ch 1-7 led here; Ch 9-30 build outward. After Ch 8, the reader can claim "I've trained an LLM." Ch 9 scales it up; Ch 10 deploys the infrastructure; Ch 11+ goes into specialized topics. But the core knowledge is here.

Chapter 8 is now complete. Phase 9 continues with Ch 9 — scaling laws and distributed training. The training loop from Ch 8 doesn't change at scale; what changes is the *system* it runs on.
