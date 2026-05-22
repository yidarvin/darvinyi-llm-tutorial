# Session 26 — Ch 5 exercises and closeout

> Final Chapter 5 session. Two deliverables: an **Exercises section** at chapter end with 4 problems (LayerNorm, multi-head reshape, full Pre-LN block, SwiGLU) and the **status flip** from `'draft'` to `'published'`. **End of Phase 7.** This session is lighter than typical closeout sessions because both widgets are already built (sessions 24 and 25); no widget code in this file.

---

## Read first (in this order)

1. **`research/ch05-multihead-and-block/research.md`** — for the parameter accounting, layer norm formula, and SwiGLU reference
2. **`prompts/chapters/ch05-multihead-and-block/session-23-page-structure.md`** — to confirm where the Exercises section goes (between section 9 and the chapter close)
3. **`prompts/chapters/ch04-attention/session-20-causal-mask-and-exercises.md`** — for the exercise template (Ch 4's closeout has the same structure: 4 exercises + status flip)

---

## Goal

By end of session:

1. **An "Exercises" section is appended** to `index.mdx`, between section 9 ("What's missing — positional encoding") and the final chapter close paragraph, containing 4 exercises with hints and starter `<RunnableCode>` blocks
2. **Ch 5's status flips from `'draft'` to `'published'`** — adding the fifth published chapter to the site
3. **The chapter renders end-to-end as a complete deliverable**

After this session, Chapter 5 is the fifth complete chapter on production. **Phase 7 closes.**

---

## Inputs

State of the repo after session 25:

- Both Ch 5 widgets exist and are wired (`MultiHeadDecomposition` in section 2, `TransformerBlockFlow` in section 7)
- `src/lib/chapters.ts` has Ch 1-4 `'published'`, Ch 5 `'draft'`, others `'planned'`
- `src/pages/ch05-multihead-and-block/index.mdx` exists with full prose + both widgets

---

## Deliverables

1. **Update** `src/pages/ch05-multihead-and-block/index.mdx`:
   - Add new `## Exercises` section between section 9 and the final chapter close paragraph
2. **Update** `src/lib/chapters.ts` — change Ch 5's `status` from `'draft'` to `'published'`

**Do not modify** any widget files, layout, styling, or earlier chapters.

---

## Detailed spec

### Part A — Add the Exercises section

Insert between section 9 ("What's missing — positional encoding") and the final chapter close paragraph in `index.mdx`:

````mdx
## Exercises

The exercises build on the chapter. Each is a self-contained problem with a starting template. Hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Implement LayerNorm and verify properties

Implement layer normalization from scratch. Verify that (a) each token's features have approximately zero mean and unit standard deviation after normalization, (b) the learnable γ and β parameters allow scaling and shifting after normalization.

<details>
<summary>Hint</summary>

The formula is straightforward: `LN(x) = γ * (x - mean) / sqrt(var + eps) + β` where mean and var are computed across the *last axis* (the feature dimension), not the batch axis. For property (a), check `x_normed.mean(axis=-1)` ≈ 0 and `x_normed.std(axis=-1)` ≈ 1. For property (b), test with `γ = 2`, `β = 1` and verify the output mean = 1 and std = 2.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

class LayerNorm:
    def __init__(self, d_model, eps=1e-5):
        # TODO: initialize gamma (ones) and beta (zeros)
        pass

    def __call__(self, x):
        """x: (..., d_model). Normalize along the last axis."""
        # TODO: compute mean and variance along axis=-1
        # TODO: normalize, then scale and shift
        pass

# Test (a): zero mean, unit std after normalization
ln = LayerNorm(d_model=8)
rng = np.random.default_rng(42)
X = rng.normal(0, 5, (4, 8))   # large-scale input

# X_normed = ln(X)
# print(f"Per-token mean (expect ≈ 0): {X_normed.mean(axis=-1)}")
# print(f"Per-token std (expect ≈ 1): {X_normed.std(axis=-1)}")

# TODO: Test (b): set gamma=2, beta=1, verify scaled-and-shifted output
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Multi-head attention with correct reshape

Implement multi-head attention. The trickiest part is the reshape and transpose: you need to split the `(n, d_model)` Q/K/V matrices into `(n_heads, n, d_k)` per-head matrices, run attention per head, then concatenate back. Verify that the output shape matches `(n, d_model)`.

<details>
<summary>Hint</summary>

After computing `Q = X @ W_Q` of shape `(n, d_model)`, reshape to `(n, n_heads, d_k)` then transpose to `(n_heads, n, d_k)`. Do the same for K and V. Then per-head attention is `(Q @ K.T) / sqrt(d_k)` broadcasting over the `n_heads` axis — softmax along the last axis, multiply by V. Concatenate by reverse transpose + reshape to `(n, d_model)`. Multiply by W_O at the end.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

class MultiHeadAttention:
    def __init__(self, d_model, n_heads, seed=42):
        assert d_model % n_heads == 0
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        rng = np.random.default_rng(seed)
        # TODO: initialize W_Q, W_K, W_V, W_O each shape (d_model, d_model)
        pass

    def __call__(self, X, mask=None):
        n, d_model = X.shape
        # TODO: compute Q, K, V; reshape and transpose to (n_heads, n, d_k)
        # TODO: per-head attention; combine across heads
        # TODO: concatenate heads back to (n, d_model)
        # TODO: project through W_O
        pass

# Test
n, d_model = 6, 16
mha = MultiHeadAttention(d_model, n_heads=4)
X = np.random.default_rng(0).normal(0, 1, (n, d_model))

# out = mha(X)
# print(f"Input shape:  {X.shape}")
# print(f"Output shape: {out.shape}  (expect (6, 16))")
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Build a full Pre-LN transformer block

Combine your LayerNorm (Exercise 1), MultiHeadAttention (Exercise 2), and FFN (from chapter section 4) into a full Pre-LN transformer block. Verify the output shape matches the input shape, and that the per-token output magnitude is reasonable (not exploding or vanishing).

<details>
<summary>Hint</summary>

The block has 4 components: LN₁, MHA, LN₂, FFN. The Pre-LN forward pass is:

```
x = x + MHA(LN_1(x))
x = x + FFN(LN_2(x))
return x
```

Note the structure: normalize *before* each sublayer, residual wraps the unnormalized input.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x**3)))

# Assume LayerNorm and MultiHeadAttention from Exercises 1 and 2 are available

class FFN:
    def __init__(self, d_model, d_ff=None, seed=42):
        d_ff = d_ff or 4 * d_model
        rng = np.random.default_rng(seed)
        self.W1 = rng.normal(0, 0.02, (d_model, d_ff))
        self.b1 = np.zeros(d_ff)
        self.W2 = rng.normal(0, 0.02, (d_ff, d_model))
        self.b2 = np.zeros(d_model)

    def __call__(self, x):
        h = gelu(x @ self.W1 + self.b1)
        return h @ self.W2 + self.b2

class TransformerBlock:
    def __init__(self, d_model, n_heads, seed=42):
        # TODO: initialize ln_1, attn, ln_2, ffn
        pass

    def __call__(self, x, mask=None):
        # TODO: Pre-LN forward pass
        # x = x + self.attn(self.ln_1(x), mask=mask)
        # x = x + self.ffn(self.ln_2(x))
        pass

# Test
n, d_model = 6, 16
block = TransformerBlock(d_model, n_heads=4)
X = np.random.default_rng(0).normal(0, 1, (n, d_model))

# out = block(X)
# print(f"Input shape:  {X.shape}")
# print(f"Output shape: {out.shape}")
# print(f"Per-token output norms: {np.linalg.norm(out, axis=-1).round(3)}")
# print(f"  (should be in a reasonable range — not zero, not exploding)")
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Implement SwiGLU

SwiGLU is the FFN variant used by LLaMA and Mistral. Instead of a single up-projection followed by GELU, SwiGLU uses two parallel up-projections; one is gated by a Swish (sigmoid-linear) activation. The two are element-wise multiplied before the down-projection. Implement SwiGLU and compare its parameter count to a standard GELU FFN at the same effective hidden dimension.

<details>
<summary>Hint</summary>

The SwiGLU FFN structure:
- Three linear layers: W_gate, W_up, W_down (vs two in standard FFN)
- Forward: `down(Swish(gate(x)) * up(x))` where `*` is element-wise multiplication
- Swish(x) = x * sigmoid(x)
- For an equivalent parameter budget to a standard 4x-expansion GELU FFN, SwiGLU typically uses a 2.66x expansion (because of the third linear layer — `8/3 ≈ 2.66` keeps the total parameters comparable)

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def swish(x):
    return x / (1 + np.exp(-np.clip(x, -30, 30)))   # x * sigmoid(x)

class SwiGLU_FFN:
    def __init__(self, d_model, d_ff=None, seed=42):
        # TODO: SwiGLU uses 3 linear layers, not 2
        # For comparable parameter count to standard FFN at 4x, use d_ff = int(d_model * 8 / 3)
        # (this makes total params ≈ same: 3 * d_model * d_ff ≈ 2 * d_model * 4*d_model)
        pass

    def __call__(self, x):
        # TODO: forward = W_down(Swish(W_gate @ x) * W_up @ x)
        pass

# Compare parameter counts
d_model = 64
d_ff_standard = 4 * d_model
d_ff_swiglu = int(d_model * 8 / 3)

standard_params = 2 * d_model * d_ff_standard   # W1 (d, 4d) + W2 (4d, d)
swiglu_params = 3 * d_model * d_ff_swiglu       # gate, up, down

print(f"Standard FFN (4x):  {standard_params:>6d} params (d_ff = {d_ff_standard})")
print(f"SwiGLU FFN (~2.66x): {swiglu_params:>6d} params (d_ff = {d_ff_swiglu})")
print(f"Ratio: {swiglu_params / standard_params:.3f} — should be ≈ 1.0")

# Test SwiGLU forward
# rng = np.random.default_rng(42)
# X = rng.normal(0, 1, (6, d_model))
# swiglu = SwiGLU_FFN(d_model)
# out = swiglu(X)
# print(f"SwiGLU output shape: {out.shape}")
`}
  packages={["numpy"]}
/>
````

### Part B — Flip Ch 5's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 5, slug: 'ch05-multihead-and-block', title: 'Multi-head attention and the transformer block', partNum: 2, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

`getFirstPublishedChapter()` still returns Ch 1; landing CTA still reads "Start with Chapter 1 →".

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch05-multihead-and-block/`** renders end-to-end with:
   - All 9 chapter sections present and rendering
   - Both widgets working (multi-head decomposition in section 2; transformer block flow in section 7)
   - New `## Exercises` section with 4 sub-exercises, each with collapsible hint and runnable starter code
   - Final chapter close paragraph after Exercises
3. **Sidebar:** Ch 1-5 all active (published); Ch 6-30 still dimmed.
4. **Landing page CTA:** still reads "Start with Chapter 1 →" (Ch 1 remains the first published).
5. **Prev/next nav at bottom of Ch 5:** prev = Ch 4 (active); next = Ch 6 (disabled).
6. **TOC on Ch 5** includes Exercises as an h2 entry plus 4 h3 sub-entries.
7. **Exercise hints expand/collapse** via the native `<details>` element.
8. **All 4 exercise `<RunnableCode>` blocks** render with a Run button and execute (even if the user hasn't filled in the TODOs).
9. **Mobile:** Exercises section renders correctly; details elements toggle; code blocks scroll horizontally if needed.
10. **`npm run typecheck`** passes.
11. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide solutions** to the exercises. Hints only.
- ❌ **Do not modify the chapter widgets** (sessions 24 and 25 are sealed).
- ❌ **Do not modify Ch 1, 2, 3, or 4.** Sealed.
- ❌ **Do not flip any other chapter's status.** Only Ch 5 flips.
- ❌ **Do not add additional exercises beyond the 4 specified.** Keep the exercise count consistent with prior chapters.

---

## Wire-up

```bash
git add src/pages/ch05-multihead-and-block/index.mdx src/lib/chapters.ts
git commit -m "session 26: Ch 5 exercises + status: published"
git push origin main
```

After deploy, verify:
- All 4 exercises render with working hints and runnable code
- Both widgets still work
- Sidebar shows Ch 1-5 active
- Landing CTA still points to Ch 1

---

## Phase 7 closeout

This session closes **Phase 7** per `MASTER_PLAN.md`. **Chapter 5 is the fifth complete chapter on production.**

Confirm before declaring Phase 7 complete:

- ✅ BUILD_ORDER.md shows files 32-36 (Phase 7) all ✅
- ✅ Ch 5 status is `'published'`
- ✅ Both Ch 5 widgets work in production
- ✅ All 4 Ch 5 exercises have working starter code
- ✅ Ch 5 total word count is in the 5500-7000 range
- ✅ Lighthouse scores green on `/ch05-multihead-and-block/`
- ✅ Bundle size for Ch 5's chunk is reasonable

**Phase 7 retrospective notes:**

Ch 5 used the **5-file cadence** (research + 4 chapter sessions) — one more than the standard 4-file model. The chapter covers two major topics (multi-head attention + the transformer block), each warranting its own widget session. The cadence felt right; the chapter doesn't feel rushed and isn't padded.

**Cadence summary across all chapters so far:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy (3 widgets) | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual-heavy | 2 | 4 |
| Ch 5 | Two-topic chapter (multi-head + block) | 2 | 5 |

**Refined cadence guidance for future chapters:**
- **3 widgets**: 5 files (Ch 1 — exception, justified by widget count)
- **2 widgets, one topic**: 4 files (Ch 2, 3, 4 — the norm)
- **2 widgets, two topics**: 5 files (Ch 5 — exception, justified by topic count)
- **Anything more complex**: case-by-case

The 4-file cadence remains the default. Exceptions need explicit justification (widget count or topic count).

**The two-widget split for two-topic chapters worked well.** Sessions 24 and 25 each had a clear, focused scope (multi-head decomposition; block data flow). The result is more pedagogically distinct visuals than trying to cram both topics into one mega-widget.

---

## Notes for the session author

**On the 4 exercises:**
- Exercise 1 (LayerNorm) reinforces the chapter prose with implementation. Reader confirms the math by running it.
- Exercise 2 (multi-head reshape) is the chapter's trickiest implementation detail — the reshape/transpose. Putting it in an exercise lets the reader work through it rather than reading about it.
- Exercise 3 (full Pre-LN block) is the chapter's capstone — combining everything into one working block. After this, the reader has implemented their first transformer block from scratch.
- Exercise 4 (SwiGLU) extends to a modern variant. The parameter-comparison setup teaches a subtle architectural detail: SwiGLU at 2.66× expansion matches standard FFN at 4× expansion in total parameters.

**On Exercise 4 specifically:**
The "2.66× expansion" calculation is a real architectural decision in LLaMA et al. It's not arbitrary — it makes the parameter budget directly comparable to a standard 4× FFN. The exercise's parameter-counting comparison surfaces this fact.

**On the chapter being complete:**
Chapter 5 is now the fifth complete chapter — and one of the two most important (along with Ch 4). The pair Ch 4 + Ch 5 covers the complete transformer architecture at single-block resolution:
- Ch 4: attention (single head)
- Ch 5: attention (multiple heads) + the full block (residuals, FFN, normalization)

After Ch 5, the reader has all the architectural machinery needed to build a transformer. Ch 6 adds positional encoding (the last "structural" gap); Ch 7 onwards stacks blocks and trains.

**Pedagogical outcomes recap from session 23:**
After Ch 5, the reader should be able to:
1. Explain multi-head attention's parameter accounting (same as single-head at same d_model)
2. Implement multi-head attention in numpy with correct reshape/transpose ← Exercise 2
3. State the FFN structure (linear → GELU → linear, 4× expansion)
4. Explain residual connections via gradient flow
5. State the layer norm formula ← Exercise 1
6. Distinguish Pre-LN from Post-LN
7. Implement a full Pre-LN transformer block ← Exercise 3

The exercises directly serve outcomes 1, 2, 5, 7. The other outcomes are served by prose and widgets.

**Phase 7 closeout. Phase 8 begins on the next file (Ch 6 — Positional encoding).**
