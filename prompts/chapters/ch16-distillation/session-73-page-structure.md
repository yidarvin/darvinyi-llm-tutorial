# Session 73 — Chapter 16 page structure

> First chapter session for Chapter 16 ("Distillation"). **The chapter that closes Phase 11.** Where Ch 13 (SFT), Ch 14 (preference optimization), and Ch 15 (PEFT) covered post-training *methods*, Ch 16 covers compression — how to take a large trained model and produce a small one with similar capabilities. The classic technique is Hinton et al. 2015's knowledge distillation; modern recipes (DistilBERT, Phi, Gemma 2 distilled, DeepSeek-R1-Distill) demonstrate it at scale. **The deployment counterpart to Ch 13-15's training methods.** Single-topic chapter; uses the **4-file cadence**.

---

## Read first (in this order)

1. **`research/ch16-distillation/research.md`** — the source material. Every section, derivation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch15-peft/session-67-page-structure.md`** — for the Phase 11 practical-engineering voice (Ch 15 is the closest precedent for "operational concerns, deployment math")
4. **`prompts/chapters/ch13-sft/session-59-page-structure.md`** — for the Phase 11 voice (cheap-and-cheerful framing)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 16 page. By end of session:

- `src/pages/ch16-distillation/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch16-distillation/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 16's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch16-distillation/` with sidebar showing Ch 16 active, prev/next nav linking to Ch 15 (active) and Ch 17 (disabled)

**Tonal note:** Ch 16 is **practical engineering with a side of historical context**. Distillation predates transformers (Buciluă 2006 → Hinton 2015 → modern recipes). The voice should acknowledge this: "here's a foundational technique with renewed relevance in the LLM era." Concrete numbers (DistilBERT 97% at 40% size; R1-Distill-32B matching o1-mini); honest about hard vs soft distillation (the latter is the theory, the former is the practice); celebrate the recent reasoning distillation breakthrough without overselling it.

**Phase 11 closing context:** this chapter completes the post-training arc. The reader should walk away with the **full pipeline**: pre-train → SFT (Ch 13) → preference optimization (Ch 14) → PEFT for efficient training (Ch 15) → distill for cheap deployment (Ch 16). All four are used in modern production. Section 8 should make the pipeline explicit and bridge to Phase 12.

**Chapter cadence:** Ch 16 uses the **4-file cadence** (single-topic).

---

## Inputs

State of the repo after session 69 (Ch 15 complete):

- Ch 1-15 all `'published'`
- `research/ch16-distillation/research.md` exists
- `src/lib/chapters.ts` has Ch 1-15 `'published'`, Ch 16-30 `'planned'`
- No `src/pages/ch16-distillation/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch16-distillation/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch16-distillation/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 16's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch16-distillation
description: Distillation — the compression technique that turns a frontier-capable teacher into a deploy-cheaply student. Hinton et al. 2015 introduced soft-label distillation with temperature scaling: the dark knowledge in non-target class probabilities helps the student learn faster than from hard labels alone. Modern recipes (DistilBERT 40% smaller at 97% of BERT, the Phi family on textbook-quality data, Gemma 2 distilled variants, DeepSeek-R1-Distill matching o1-mini on reasoning) demonstrate distillation's impact at LLM scale. The chapter that closes Phase 11: pre-train → SFT → preference optimization → PEFT → distill. The full post-training pipeline used in production.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~280 words) of opening.

**Sample opening** — rewrite in chapter voice:

> Chapters 13 through 15 left you with the techniques to train and align large language models. But large is the operative word. A 70B-parameter model is too expensive to deploy at scale for many use cases — even with quantization and inference optimizations, serving it cheaply at high throughput is hard. Most production teams want models in the 7B-14B range. The capability gap, though, is significant: a 7B base model is typically 10-30 MMLU points behind a 70B base.
>
> **Distillation** is the technique that closes that gap. Train a small student model to imitate a large teacher. The student doesn't need to discover the teacher's behaviors from scratch — it just needs to match them. The result is models like **DistilBERT** (40% smaller than BERT, 97% of its capability), the **Phi family** (Microsoft's textbook-quality models), **Gemma 2 distilled variants**, and most recently **DeepSeek-R1-Distill** — 1.5B to 32B students that inherit reasoning capabilities from a frontier teacher.
>
> This chapter covers the classic Hinton et al. 2015 distillation framework (soft labels + temperature scaling + KL divergence), the practical hard-distillation recipes that dominate modern production, the architectural choices for the student model, the modern recipe lineage, and the new frontier of reasoning distillation. **It closes Phase 11**: pre-train → SFT (Ch 13) → preference optimization (Ch 14) → PEFT for cheap training (Ch 15) → distill for cheap deployment (Ch 16). The full post-training pipeline used in production.

### Section 1: Why distill — the case for compression

**Heading:** `## Why distill — the case for compression`
**Word target:** ~400
**Sub-headings:** `### The deployment math`, `### The Pareto frontier`

**Teaching beats:**

**The deployment math:**
1. **Serving a 70B model**: ~140 GB in BF16, needs ≥2× A100 80GB per inference instance. Throughput: ~50 tok/sec. Latency: ~25 ms/token.
2. **Serving a 7B model**: 1× A100 80GB (or even A6000), ~500 tok/sec, ~5 ms/token. **Order of magnitude cheaper per request** plus higher concurrency.
3. **The capability gap**: a 7B *base* model is 10-30 points behind a 70B base on MMLU. **Without distillation, the 7B isn't a viable substitute** for most use cases.

**The Pareto frontier:**
4. **Distillation moves you up and to the left**: cheaper AND nearly as capable. **The empirical evidence:**
   - DistilBERT: 40% smaller than BERT, 97% of GLUE score
   - Phi-3-mini (3.8B): approaches GPT-3.5 on many benchmarks
   - R1-Distill-Qwen-32B: matches o1-mini on math and coding
5. **The full Phase 11 pipeline** for production deployment:
   - Pre-train base model (Ch 7-10)
   - SFT (Ch 13)
   - Preference optimization (Ch 14)
   - PEFT for efficient training (Ch 15)
   - **Distill for cheap deployment (this chapter)**
6. **Bottom line**: distillation is what bridges "we have a great frontier model" to "we can deploy a useful model cheaply at scale."

**Required callout** — type `note`: Distillation is not new. **Buciluă et al. 2006** introduced model compression via teacher-student training 9 years before Hinton's 2015 paper popularized it. The modern LLM era has revived interest because the cost of serving frontier-quality models is so high that even moderate compression has enormous economic value.

**No code in this section.** Setup and motivation.

**Connection forward:** Section 2 covers the Hinton 2015 insight.

### Section 2: Soft labels and dark knowledge

**Heading:** `## Soft labels and dark knowledge`
**Word target:** ~600
**Sub-headings:** `### Hard labels vs soft labels`, `### Dark knowledge`, `### Temperature scaling`

**Teaching beats:**

**Hard labels vs soft labels:**
1. **Standard supervised learning** trains on hard labels: one-hot vectors. The correct class gets probability 1; all others get 0.
2. **Distillation** uses soft labels: the teacher's full probability distribution over all classes. For a digit-recognition example of "8":
   - Hard label: `[0, 0, 0, 0, 0, 0, 0, 0, 1, 0]`
   - Teacher's soft label: `[0.001, 0.002, 0.04, 0.18, 0.01, 0.005, 0.003, 0.01, 0.74, 0.009]`
3. **The teacher's soft label still picks "8"** — but it also says: "this image looks meaningfully similar to a 3 (0.18 probability)."

**Dark knowledge:**
4. **"Dark knowledge"** (Hinton's term) is the information encoded in the *relative probabilities of non-target classes*. The teacher implicitly knows that some classes are more similar than others.
5. **This information is lost in hard labels but preserved in soft labels.**
6. **Why it helps the student**: more signal per training example. The student learns not just "the right answer is X" but "the right answer is X, and these other answers are similar in this way."

**Temperature scaling:**
7. **The problem with raw softmax**: trained models often produce very peaked distributions. The correct class might get 0.999; all others near zero. **Dark knowledge is *there* but *crushed*.**
8. **Temperature scaling**: divide logits by $T > 1$ before softmax:
   $$p_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$
9. **Effect of $T$**: $T = 1$ is standard. $T > 1$ softens (reveals dark knowledge). $T \to \infty$ uniform.
10. **Typical $T = 2$ to $T = 10$.** Higher = more dark knowledge revealed; too high = uniform (information loss).

**Required widget placeholder** — Temperature Scaling Visualizer (marquee, session 74):

```mdx
<WidgetFrame title="Temperature scaling" caption="A teacher's logit distribution at varying temperatures. At T=1 (standard softmax): peaked distribution; one class dominates. At T=4-8: dark knowledge revealed — non-target classes show their relative similarity. At T=32+: distribution flattens toward uniform; signal lost. Slider for T; bar chart updates live. The widget makes 'temperature reveals dark knowledge' visceral.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 74 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with temperature effect on distributions:

```python
import numpy as np

def softmax_with_temperature(logits, T=1.0):
    """Softmax with temperature scaling."""
    logits = logits / T
    logits = logits - logits.max()
    exp = np.exp(logits)
    return exp / exp.sum()

# A teacher's logits for a 10-class problem
logits = np.array([2.5, 0.2, 0.8, -1.0, -0.5, 0.3, 0.1, -0.2, 0.5, -0.8])

print("Teacher's logits:", logits.tolist())
print(f"\\n{'T':>4} | top-3 classes (prob)")
print("-" * 65)
for T in [1, 2, 4, 8, 16, 32]:
    probs = softmax_with_temperature(logits, T=T)
    top3 = sorted(enumerate(probs), key=lambda x: -x[1])[:3]
    top3_str = '  '.join([f'class {c}: {p:.3f}' for c, p in top3])
    print(f"T={T:>3} | {top3_str}")

print("\\nObservations:")
print("- T=1:  top class dominates (~0.83); dark knowledge hidden")
print("- T=4:  non-target classes visible; dark knowledge revealed (sweet spot)")
print("- T=32: distribution flattens toward uniform; signal lost")
print("- Use T=2 to 10 for distillation.")
```

**Required callout** — type `warning`: MC7 from research.md. "More temperature is always better." False — **too-high temperature flattens the distribution into uniformity.** At $T \to \infty$, all classes get equal probability — no information. Typical sweet spot: $T = 2$ to $T = 10$. Below 2: too peaked; above 10: too flat.

**Connection forward:** Section 3 covers the actual distillation loss.

### Section 3: The distillation loss

**Heading:** `## The distillation loss`
**Word target:** ~600 — CENTRAL CONCEPT
**Sub-headings:** `### The hybrid loss`, `### The $T^2$ multiplier`, `### Implementation`

**Teaching beats:**

**The hybrid loss:**
1. **Hinton's distillation loss combines two terms**:
   - **Hard loss**: standard CE with true labels (keeps the student grounded)
   - **Soft loss**: KL divergence between teacher's and student's softened distributions
2. **Combined**: $\mathcal{L}_{\text{total}} = (1 - \alpha) \cdot \mathcal{L}_{\text{hard}} + \alpha \cdot \mathcal{L}_{\text{soft}}$
3. **$\alpha$ controls the balance**: typically 0.5 to 0.9 (more weight on soft loss when teacher is much better than hard labels).

**The $T^2$ multiplier:**
4. The soft loss includes a $T^2$ multiplier:
   $$\mathcal{L}_{\text{soft}} = T^2 \cdot \text{KL}(\sigma(z_T / T) \,\|\, \sigma(z_S / T))$$
5. **Why $T^2$**: as $T$ increases, the softmax derivatives shrink by $1/T^2$. Multiplying the loss by $T^2$ compensates — gradient magnitudes stay comparable to the hard-label loss.
6. **Without it, the soft loss has vanishingly small gradients at high $T$** — distillation effectively stops.

**Implementation:**
7. **The full loss formula**:

```mdx
<Equation label="16.distill">
$$\mathcal{L}_{\text{total}} = (1 - \alpha) \cdot \text{CE}(y_{\text{true}}, \sigma(z_S)) + \alpha \cdot T^2 \cdot \text{KL}(\sigma(z_T/T) \,\|\, \sigma(z_S/T))$$
</Equation>
```

8. **Training loop**: forward pass through both teacher (frozen) and student. Compute logits from both. Apply temperature; compute KL. Backward pass updates only student.

**Required code** — `<RunnableCode>` with full distillation loss implementation:

```python
import numpy as np

def softmax_with_temperature(logits, T=1.0):
    logits = logits / T
    logits = logits - logits.max(axis=-1, keepdims=True)
    exp = np.exp(logits)
    return exp / exp.sum(axis=-1, keepdims=True)

def kl_divergence(p, q, eps=1e-9):
    return (p * (np.log(p + eps) - np.log(q + eps))).sum(axis=-1)

def distillation_loss(student_logits, teacher_logits, true_labels, T=4.0, alpha=0.7):
    """
    Hinton distillation loss.
    
    student_logits: (batch, classes) — student raw logits
    teacher_logits: (batch, classes) — teacher raw logits (frozen)
    true_labels:    (batch,) — class indices
    """
    # Soft loss: KL on softened distributions
    p_teacher = softmax_with_temperature(teacher_logits, T)
    p_student = softmax_with_temperature(student_logits, T)
    L_soft = (T ** 2) * kl_divergence(p_teacher, p_student).mean()
    
    # Hard loss: standard CE
    p_student_raw = softmax_with_temperature(student_logits, T=1.0)
    one_hot = np.eye(p_student_raw.shape[-1])[true_labels]
    L_hard = -(one_hot * np.log(p_student_raw + 1e-9)).sum(axis=-1).mean()
    
    return (1 - alpha) * L_hard + alpha * L_soft, L_hard, L_soft

# Demo: a "wrong" student vs a "correct" teacher
np.random.seed(0)
batch, classes = 8, 10
teacher_logits = np.random.normal(0, 2, (batch, classes))
true_labels = np.random.randint(0, classes, batch)
# Make the teacher confidently correct
for i, c in enumerate(true_labels):
    teacher_logits[i, c] += 5

# Student is uninformed
student_logits = np.random.normal(0, 1, (batch, classes))

print(f"{'T':>4} | {'total':>7} {'hard':>7} {'soft':>7}")
print("-" * 35)
for T in [1, 2, 4, 8, 16]:
    total, hard, soft = distillation_loss(student_logits, teacher_logits, true_labels, T=T, alpha=0.7)
    print(f"T={T:>3} | {total:>7.3f} {hard:>7.3f} {soft:>7.3f}")

print("\\nObservations:")
print("- Hard loss is independent of T (uses true labels, T=1)")
print("- Soft loss varies with T: low at T=1 (teacher too peaked), high in mid-range")
print("- The T^2 multiplier keeps soft loss comparable in magnitude to hard")
print("- Use T=4 as a standard starting point for distillation")
```

**Required callout** — type `note`: The $T^2$ multiplier in the soft loss isn't a heuristic — it's the mathematically correct factor to compensate for the $1/T^2$ shrinkage of softmax gradients at high temperature. **Don't forget it.** Without it, the soft loss provides no meaningful gradient signal at typical $T = 4-8$ values.

**Connection forward:** Section 4 contrasts hard vs soft distillation in practice.

### Section 4: Hard vs soft distillation

**Heading:** `## Hard vs soft distillation`
**Word target:** ~500
**Sub-headings:** `### Two ways to use the teacher`, `### When to use each`

**Teaching beats:**

**Two ways to use the teacher:**
1. **Soft distillation** (the Hinton 2015 recipe): match the teacher's full probability distribution using the loss from Section 3.
2. **Hard distillation**: use the teacher's *predictions* (top-1) as training labels. Equivalent to:
   - Generate synthetic training data with the teacher
   - Train the student on it via standard supervised learning (Ch 13's SFT)
   - **No special distillation loss; just SFT on teacher outputs**

**When to use each:**
3. **Soft distillation strengths**: more information per example; better when training data is limited or the capability gap is large.
4. **Soft distillation costs**: requires teacher's full output distribution per example; requires aligned vocabularies; more complex training loop.
5. **Hard distillation strengths**: scales easily (just generate more data); works across heterogeneous models (different vocabularies, even different model families); easy to mix with other data sources.
6. **Hard distillation costs**: loses the dark knowledge information; needs more total data to compensate.
7. **Modern recipes overwhelmingly use hard distillation.** R1-Distill, Phi, Orca — all generate teacher outputs as training data, then SFT the student. Why? **Simplicity scales.**

**Required code** — `<RunnableCode>` with hard distillation pipeline:

```python
import numpy as np

# Conceptual: hard distillation generates synthetic data using the teacher
# In production this is a real LLM call; here we mock it

def teacher_generate(query):
    """Pseudo: in production, this is a real teacher LLM call."""
    return f"[teacher response to: {query[:30]}...]"

def filter_for_quality(synthetic_data):
    """Filter teacher-generated data (production uses scoring model or rubric)."""
    return [s for s in synthetic_data if len(s["response"]) > 10]

# Step 1: Generate synthetic data using the teacher
queries = [
    "What is 2 + 2?",
    "Explain photosynthesis briefly.",
    "What's the capital of France?",
    "How does a neural network learn?",
]

synthetic = [{"query": q, "response": teacher_generate(q)} for q in queries]
print(f"Step 1: generated {len(synthetic)} synthetic examples")
for s in synthetic[:2]:
    print(f"  Q: {s['query']}")
    print(f"  A: {s['response']}")

# Step 2: Filter for quality
filtered = filter_for_quality(synthetic)
print(f"\\nStep 2: filtered to {len(filtered)} high-quality examples")

# Step 3: Train student via standard SFT on filtered data
# This is exactly Ch 13's SFT training loop, just with teacher-generated data
print(f"\\nStep 3: train student via standard SFT (Ch 13's machinery)")
print(f"  No soft labels. No KL divergence. No special distillation loss.")
print(f"  Just: data = teacher_outputs; train student via SFT.")
print(f"\\nThis is the dominant modern recipe — R1-Distill, Phi, Orca all use it.")
print(f"Soft distillation is the theory; hard distillation is the practice.")
```

**Required callout** — type `note`: MC3 from research.md. Hard distillation is *not* "just data augmentation" — even though it uses standard SFT machinery, the *data source matters*. Teacher-generated data carries the teacher's behavioral patterns (tone, structure, reasoning style) in ways that human-curated data doesn't. The student learns to imitate not just the answers but the *manner* of producing them.

**Connection forward:** Section 5 covers student architecture choices.

### Section 5: Choosing the student architecture

**Heading:** `## Choosing the student architecture`
**Word target:** ~500
**Sub-headings:** `### Depth vs width tradeoffs`, `### Initialization tricks`

**Teaching beats:**

**Depth vs width tradeoffs:**
1. **Same depth, narrower width** (MobileBERT-style): student preserves the teacher's layer structure but with thinner hidden dimensions. Easier to distill; preserves "thinking depth."
2. **Shallower depth, same width**: student is shorter but as wide per layer. Smaller and faster per token; loses some long-range reasoning capability.
3. **Both shallower and narrower** (DistilBERT-style): aggressive compression. ~40% smaller for typical recipes. Most popular in practice.
4. **Completely independent architecture** (Phi-mini, R1-Distill students): student is a different model family entirely. **Works because the loss only cares about output behavior**, not internal structure.

**Initialization tricks:**
5. **DistilBERT layer initialization**: take a 12-layer teacher; initialize the 6-layer student by copying *alternating* teacher layers (1, 3, 5, 7, 9, 11). **Strong starting point**; the student already produces reasonable outputs before distillation begins.
6. **Layer dropping**: take a teacher; *delete* alternate layers to form the initial student. Distill to recover capability.
7. **Random initialization**: skip teacher initialization; rely on distillation loss alone. Works but takes longer.

**Empirically**: teacher-initialization works well when student architecture matches the teacher's. For very different architectures (Phi-mini from a Llama-style teacher), random init + distillation training works fine.

**No code in this section.** Conceptual.

**Required callout** — type `aside`: MC6 from research.md. "The student needs the same architecture as the teacher." False. **Students can differ in depth, width, vocabulary, even tokenizer.** What matters is that the student's *output interface* (token-level prediction over a shared vocabulary, for soft distillation) aligns with the teacher's. For hard distillation, even vocabulary alignment isn't required.

**Connection forward:** Section 6 covers feature-level distillation.

### Section 6: Feature and attention distillation

**Heading:** `## Feature and attention distillation`
**Word target:** ~500
**Sub-headings:** `### Beyond output matching`, `### Why most modern recipes skip it`

**Teaching beats:**

**Beyond output matching:**
1. **Output distillation** only matches the teacher's final logits. The student doesn't see the teacher's *intermediate reasoning*.
2. **Feature distillation** also matches *intermediate activations*. For each layer, the student's hidden state should match the teacher's (after a linear projection to align dimensions). Loss: MSE or cosine similarity.
3. **Attention distillation** (TinyBERT): match the teacher's *attention maps* layer-by-layer. The student learns which tokens to attend to, not just what to output.
4. **Why these help**: intermediate representations encode rich information. Feature distillation gives the student access to the teacher's "thinking process," not just its conclusions.

**Why most modern recipes skip it:**
5. **Engineering complexity**: feature distillation requires synchronizing teacher and student forward passes layer-by-layer. Memory cost roughly doubles (both models in memory simultaneously).
6. **Architecture constraints**: feature matching works best when teacher and student have aligned layer structures. Doesn't scale well to heterogeneous models.
7. **Diminishing returns at scale**: when teacher and student are both already strong, the marginal benefit of feature distillation is small.
8. **Modern recipes (Phi, R1-Distill) mostly use output-level hard distillation**: simpler, more flexible, scales better.

**Required callout** — type `note`: Feature and attention distillation were important in the BERT era (DistilBERT, TinyBERT, MobileBERT — all 2019-2020). They're **less common in the modern LLM era** because: (1) hard distillation via synthetic data scales better; (2) modern teachers/students often have incompatible architectures; (3) the engineering cost outweighs the benefit at scale. **Worth knowing the technique; not worth implementing for most use cases.**

**No code in this section.** Conceptual.

**Connection forward:** Section 7 walks through the modern recipe lineage.

### Section 7: Modern recipes

**Heading:** `## Modern recipes`
**Word target:** ~600
**Sub-headings:** `### Encoder era (2019-2020)`, `### LLM era — Phi and Gemma`, `### Reasoning distillation — Orca and R1-Distill`

**Teaching beats:**

**Encoder era (2019-2020):**
1. **DistilBERT** (Sanh et al. 2019): 6-layer student, 12-layer BERT teacher. **Triple loss**: masked LM + distillation + cosine similarity on hidden states. **Initialized from alternating teacher layers.** 40% smaller, 97% of BERT's GLUE score. The canonical encoder distillation recipe.
2. **TinyBERT** (Jiao et al. 2019): added attention distillation + hidden-state matching. Two-stage: general distillation then task-specific. Smaller and stronger than DistilBERT.
3. **MobileBERT** (Sun et al. 2020): same depth as BERT-LARGE but with bottleneck blocks. Designed for mobile. 4× smaller than BERT-base.

**LLM era — Phi and Gemma:**
4. **Phi-1 / Phi-2 / Phi-3 / Phi-4** (Microsoft 2023-2024): "Textbooks Are All You Need." **Data-quality-focused distillation philosophy**: train smaller students on carefully curated, pedagogically organized data. Phi-3-mini (3.8B) approaches GPT-3.5 on many benchmarks. **Distillation at the data level, not just the loss level.**
5. **Gemma 2** (Google 2024): the 2B and 9B variants were explicitly distilled from a larger teacher. Teacher-student curriculum with synthetic data. Smaller Gemma 2 models match or exceed Llama 2 7B/13B.

**Reasoning distillation — Orca and R1-Distill:**
6. **Orca** (Mukherjee et al. 2023): distilled **GPT-4's reasoning traces** into smaller students. The key insight: **don't just match outputs; match the teacher's chain-of-thought.** Set up the modern reasoning-distillation pattern.
7. **DeepSeek-R1-Distill** (DeepSeek 2025): the most exciting recent example. **R1 (trained with RLVR per Ch 14) distilled into students of size 1.5B / 7B / 8B / 14B / 32B.**
   - **R1-Distill-Qwen-32B matches o1-mini** on math and coding benchmarks
   - Students inherit the teacher's CoT thinking patterns
   - **Demonstrates that reasoning can be distilled** — not just outputs

**Required widget placeholder** — Distillation Pipeline Visualizer (secondary, session 75):

```mdx
<WidgetFrame title="Distillation pipeline" caption="The end-to-end flow from teacher to student. Click each stage for details on what happens: teacher training (full RLHF/RLVR pipeline), data generation (teacher samples on diverse prompts), filtering (quality scoring), student training (SFT on filtered data), and final evaluation. The widget makes the modern hard-distillation recipe — used by R1-Distill, Phi, Orca — concrete.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 75 (secondary)
  </div>
</WidgetFrame>
```

**Required callout** — type `note`: R1-Distill is the most exciting recent demonstration that **reasoning capabilities can be distilled**. The student doesn't need to discover chain-of-thought via RLVR (which is expensive); it can inherit the capability from a teacher that already has it. **This dramatically lowers the cost of producing reasoning-capable models** — and is one of the most important recent developments in post-training.

**Connection forward:** Section 8 wraps with method selection guidance.

### Section 8: When to use distillation

**Heading:** `## When to use distillation`
**Word target:** ~400
**Sub-headings:** `### Distillation vs PEFT vs full fine-tuning`, `### The full production pipeline`

**Teaching beats:**

**Distillation vs PEFT vs full fine-tuning:**
1. **Full fine-tuning** (Ch 13-14): trains all parameters. Expensive, but produces the strongest models. Use for foundation models.
2. **PEFT** (Ch 15): trains a small fraction of parameters via LoRA. Cheap; specializes an existing model. Use for task adaptation.
3. **Distillation**: produces a smaller student from a larger teacher. Reduces deployment cost. Use when serving cost matters.
4. **These serve different needs**:
   - Full FT: *build* a capable model
   - PEFT: *specialize* an existing model for a task
   - Distillation: *compress* a capable model for deployment

**The full production pipeline:**
5. **Typical modern recipe** for producing a deployable small model:
   - Pre-train a large base model (Ch 7-10)
   - SFT (Ch 13) on a curated instruction dataset
   - Preference optimization (Ch 14): DPO or RLHF; RLVR for reasoning
   - **Distillation (Ch 16)**: train a smaller student via hard distillation on teacher outputs
   - Optional PEFT on the student for downstream task adaptation
6. **For frontier reasoning models** (the o1, R1, Gemini Thinking pattern):
   - All of the above
   - Plus RLVR (Ch 14) to teach the teacher to reason
   - **R1-Distill is the reasoning-distillation closing step**

**Sample close** (rewrite in chapter voice):

> Phase 11 is complete. Across four chapters, we've covered the full post-training arc: supervised fine-tuning teaches the model *format* (Ch 13); preference optimization teaches it *quality* (Ch 14); parameter-efficient methods make all of this *affordable* (Ch 15); and distillation makes the result *deployable* at scale (this chapter). The full pipeline — pre-train → SFT → preference → PEFT → distill — is what every production team uses, in some form.
>
> **Phase 12 begins next.** Where Phase 11 covered training, Phase 12 covers *inference*: how to serve these models efficiently. Chapter 17 covers inference optimization (KV cache, batching, speculative decoding). Chapter 18 covers quantization for inference — the complement to distillation. Chapter 19 covers sampling algorithms (top-k, top-p, beam search, constrained decoding). Where distillation reduces parameter *count*, quantization reduces *bits per parameter*; they're often combined for multiplicative compression. After Phase 12, we move into capabilities: reasoning, tools, RAG, multimodal — the chapters that bring everything together.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 16, slug: 'ch16-distillation', title: 'Distillation', partNum: 5, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch16-distillation/index.astro && rm src/pages/ch16-distillation/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch16-distillation/`** renders with:
   - Chapter eyebrow ("Chapter 16") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 3, 4)
   - 2 `<WidgetFrame>` placeholders (sections 2 and 7)
   - Labeled equation `<Equation label="16.distill">` in section 3
   - At least 5 callouts (the historical note in section 1, MC7 in section 2, the $T^2$ note in section 3, MC3 in section 4, MC6 in section 5, the feature-distillation note in section 6, the R1-Distill note in section 7 — pick 5)
3. **Sidebar:** Ch 1-15 published; Ch 16 active (draft); Ch 17-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 16:** prev = Ch 15 (active); next = Ch 17 (disabled)
6. **TOC on Ch 16** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 4000 and 4800 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 74 and 75 own them.
- ❌ **Do not write exercises.** Session 75 owns.
- ❌ **Do not flip Ch 16's status to `'published'`.** Session 75 owns.
- ❌ **Do not deep-dive on attention distillation math.** Mention TinyBERT; sketch the concept.
- ❌ **Do not enumerate every distilled model.** Cover DistilBERT, Phi, Gemma 2, R1-Distill, Orca. That's enough.
- ❌ **Do not implement actual student training.** Pseudo-code for the pipeline only.
- ❌ **Do not cover pruning.** Briefly mention; not a focus.
- ❌ **Do not modify Ch 1-15.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch16-distillation/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch16-distillation/index.astro 2>/dev/null || true
git commit -m "session 73: Ch 16 prose — distillation (closes Phase 11)"
git push origin main
```

---

## Notes for the session author

**On the historical framing:**
Section 1's callout acknowledges that Bucilua 2006 predates Hinton 2015 by 9 years. **Don't gloss over this.** It's important context — distillation is not a new technique; the LLM era revived interest because of the cost-of-frontier-serving problem.

**On the hard-vs-soft honesty:**
Section 4 should be explicit: **"Soft distillation is the theory; hard distillation is the practice."** This is honest. Don't oversell soft distillation as the default — it's not. Modern recipes (Phi, R1-Distill, Orca) all use hard distillation via teacher-generated synthetic data + standard SFT. The reader needs to know this.

**On the $T^2$ multiplier being non-obvious:**
Section 3's callout makes explicit that $T^2$ isn't a heuristic — it's the mathematically correct compensation for $1/T^2$ gradient shrinkage. **Many tutorials skip this**; readers come away thinking it's an arbitrary scaling factor. It's not.

**On R1-Distill being the chapter's exciting recent development:**
Section 7 should celebrate R1-Distill carefully. **Reasoning distillation works** — this is genuinely exciting. R1-Distill-Qwen-32B matching o1-mini means a 32B student inherits much of a frontier reasoning teacher's capability. **Game-changing for accessibility.**

But don't oversell: the student still doesn't match the teacher; long-tail capabilities (very hard problems, novel domains) may not transfer perfectly. **Be enthusiastic without overstating.**

**On the widget placements:**
- **Marquee (Temperature Scaling Visualizer)** in section 2: when soft labels and dark knowledge are introduced. The widget makes "temperature reveals dark knowledge" visceral before the formal loss in section 3.
- **Secondary (Distillation Pipeline Visualizer)** in section 7: alongside modern recipes. Reader sees the end-to-end pipeline (teacher training → data generation → filtering → student training → eval) used by R1-Distill, Phi, Orca.

**On the 3 runnable code blocks:**
- Section 2 (temperature softmax visualization): reader sees how temperature reshapes a distribution
- Section 3 (full distillation loss): reader implements the Hinton loss with $T^2$ scaling
- Section 4 (hard distillation pipeline): reader sees the modern recipe — teacher-generated data + SFT

3 blocks. Each grounds a key claim.

**On the phase-closing tone:**
Section 8's closing should feel like wrapping up. **Phase 11 is complete after this chapter.** The reader should feel a sense of accomplishment — they now understand the full post-training pipeline. Then bridge to Phase 12 with anticipation: inference, capabilities, agents.

**Pedagogical claim of the chapter:**
"Distillation transfers capabilities from a large teacher to a small student. The Hinton 2015 framework uses soft labels with temperature scaling to reveal 'dark knowledge' in the teacher's distributions; modern recipes mostly use simpler hard distillation (teacher-generated synthetic data + standard SFT). The most exciting recent development is reasoning distillation (R1-Distill matching o1-mini at 32B) — a 32B student inheriting frontier reasoning from a teacher. **Distillation is what makes frontier-quality models cheap to deploy.**"

**Phase 11 progress after this session**: Ch 13 ✅, Ch 14 ✅, Ch 15 ✅, Ch 16 in progress (draft). After sessions 74-75, Ch 16 closes and **Phase 11 is complete**. Phase 12 (inference) opens.

**This chapter completes the post-training arc.** Build with care.
