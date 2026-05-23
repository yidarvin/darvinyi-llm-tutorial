# Chapter 16 — Distillation: research

> Curated source material for Chapter 16's build sessions. **The compression chapter that closes Phase 11.** Where Chapters 13-15 covered how to *train* aligned models, Ch 16 covers how to *compress* them — take a trained large model (the "teacher") and produce a smaller model (the "student") with similar capabilities. The classic technique is **knowledge distillation** (Hinton et al. 2015): train the student to match the teacher's *soft probability distributions*, not just its hard predictions. The full Phase 11 picture: pre-trained base (Ch 7-10) → SFT (Ch 13) → preference optimization (Ch 14) → PEFT for efficient training (Ch 15) → **distillation to compress** (Ch 16). Single-topic chapter; uses the **4-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Distillation

**Premise:** A 70B model is too big to serve cheaply at scale. A 7B model is cheap to serve but less capable. **Distillation** is the technique that transfers capabilities from a large teacher to a small student. The student doesn't need to discover the teacher's behaviors from scratch — it just needs to imitate them. The result is models like **DistilBERT** (40% smaller, 97% of BERT's capability), **TinyLlama**, **Phi-2/3/4**, **Gemma distilled variants**, and Anthropic's, OpenAI's, and Google's distilled production models. **Distillation is what powers cheap deployment of frontier-quality models.**

**Two flavors covered:**

1. **Output distillation** (Hinton 2015): match the teacher's *soft probability distributions* using KL divergence with temperature scaling. The information in non-target class probabilities ("dark knowledge") helps the student learn faster than from hard labels alone.
2. **Feature distillation** (DistilBERT, TinyBERT, MobileBERT): also match the teacher's *intermediate activations* — attention patterns, hidden states, layer outputs. More signal; harder to set up.

**Modern recipes covered:**
- **DistilBERT** (Sanh et al. 2019): the canonical recipe for transformer encoder distillation
- **TinyBERT** (Jiao et al. 2019): attention + hidden-state distillation
- **MobileBERT** (Sun et al. 2020): bottleneck architecture + distillation
- **Phi family** (Microsoft 2023-2024): "textbook quality" data + distillation
- **Gemma 2 distilled** (Google 2024): teacher-student curriculum for 2B / 9B Gemma models
- **DeepSeek-R1 Distilled** (DeepSeek 2025): reasoning distillation from a large R1 teacher into 1.5B-32B students

**Out of scope (other chapters):**
- Pre-training (Ch 7-10)
- SFT and preference optimization (Ch 13-14)
- PEFT (Ch 15)
- Quantization for inference (Ch 18) — compression at *inference time* via reduced precision; distillation compresses by *reducing parameter count*
- Pruning (briefly mentioned; not a chapter focus)

**In scope and locked:**
- **The distillation motivation**: serving cost at scale; capabilities vs cost trade-off
- **Soft labels and dark knowledge** (Hinton 2015): why probability distributions teach more than hard labels
- **Temperature scaling**: softens distributions to reveal non-target class structure
- **The distillation loss**: $L = (1-\alpha) \cdot L_{\text{hard}} + \alpha \cdot L_{\text{soft}}$ where $L_{\text{soft}} = T^2 \cdot \text{KL}(\sigma(z_T / T) \| \sigma(z_S / T))$
- **Hard vs soft distillation**: when each is appropriate
- **Architecture choices for the student**: depth vs width, sharing layers, initialization from teacher
- **Feature distillation**: matching hidden states; attention distillation (TinyBERT, MobileBERT)
- **Data choices**: teacher-generated data; rejection sampling; "textbook quality" data (Phi)
- **Modern recipes**: DistilBERT, TinyBERT, MobileBERT, Phi, Gemma, R1-distilled
- **Reasoning distillation**: Orca, DeepSeek-R1-Distill — transferring CoT capabilities
- **When to use distillation vs PEFT vs full fine-tuning**

**Suggested chapter structure** (8 sections):

1. Why distill — the case for compression (~400 words)
2. Hinton 2015 — soft labels and dark knowledge (~600 words)
3. The distillation loss — KL on softened logits (~600 words — central concept)
4. Hard vs soft distillation (~500 words)
5. Choosing the student architecture (~500 words)
6. Feature and attention distillation (~500 words)
7. Modern recipes — DistilBERT, Phi, Gemma, R1-distilled (~600 words)
8. When to use distillation (~400 words)

Target: ~4100 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Buciluă et al. 2006 — "Model Compression"
- **Paper:** [Bucilua 2006 KDD](https://www.cs.cornell.edu/~caruana/compression.kdd06.pdf)
- **What it contributed:** the **original distillation idea**, predating Hinton by 9 years. Compress an ensemble of classifiers into a single small model by training on synthetic data labeled by the ensemble. Introduced "knowledge transfer from a large model to a small one."
- **For the chapter:** historical reference. Important to acknowledge — Hinton popularized it but didn't invent it.

### Hinton, Vinyals & Dean 2015 — "Distilling the Knowledge in a Neural Network"
- **arXiv:** [1503.02531](https://arxiv.org/abs/1503.02531)
- **What it contributed:** **the foundational modern distillation paper.** Introduced **soft labels** with **temperature scaling** and the term "dark knowledge." Showed that the probability mass the teacher assigns to *wrong* classes carries useful information ("an 8 looks more like a 3 than a 7"). Distill loss formulated as KL divergence on softened distributions.
- **For the chapter:** the central reference. Sections 2-4 build on this directly.

### Sanh et al. 2019 — "DistilBERT, a distilled version of BERT"
- **arXiv:** [1910.01108](https://arxiv.org/abs/1910.01108)
- **What it contributed:** **DistilBERT** — the canonical transformer distillation recipe. 40% smaller than BERT, retains 97% of capability. Used triple loss: distillation loss + masked LM loss + cosine similarity on hidden states. **Initialized student layers from alternating teacher layers** — a key practical trick.
- **For the chapter:** the canonical modern recipe; section 7.

### Jiao et al. 2019 — "TinyBERT: Distilling BERT for Natural Language Understanding"
- **arXiv:** [1909.10351](https://arxiv.org/abs/1909.10351)
- **What it contributed:** **TinyBERT** — added **attention distillation** (match the teacher's attention maps layer-by-layer) and **hidden-state distillation**. Two-stage distillation: general distillation on pre-training data, then task-specific distillation. Much smaller (4-layer student vs 12-layer teacher).
- **For the chapter:** feature distillation section.

### Sun et al. 2020 — "MobileBERT: a Compact Task-Agnostic BERT for Resource-Limited Devices"
- **arXiv:** [2004.02984](https://arxiv.org/abs/2004.02984)
- **What it contributed:** **MobileBERT** — a *bottleneck* architecture (narrower, deeper) trained via distillation from a wider teacher (BERT-IB). The student is the same depth as the teacher but much thinner per layer.
- **For the chapter:** architecture choice section.

### Gunasekar et al. 2023 — "Textbooks Are All You Need" (Phi-1)
- **arXiv:** [2306.11644](https://arxiv.org/abs/2306.11644)
- **What it contributed:** **Phi-1** — Microsoft's first Phi model. Showed that **carefully curated "textbook quality" training data** could produce a 1.3B model with strong code generation. Phi-2 (2.7B), Phi-3 (3.8B-14B), Phi-4 (14B) followed. **A distillation philosophy at the data level**: train smaller students on cleaner, more pedagogically organized data.
- **For the chapter:** modern recipes section. The "Phi philosophy" of data-as-distillation.

### Team Gemma 2024 — "Gemma 2: Improving Open Language Models at a Practical Size"
- **arXiv:** [2408.00118](https://arxiv.org/abs/2408.00118)
- **What it contributed:** **Gemma 2** — Google's open-weight LLM family. **The 2B and 9B variants were distilled** from a larger teacher with explicit teacher-student curriculum. Demonstrated that distilled small models match much larger non-distilled models on benchmarks.
- **For the chapter:** modern recipes section.

### DeepSeek-AI 2025 — "DeepSeek-R1 (Distilled Variants)"
- **arXiv:** [2501.12948](https://arxiv.org/abs/2501.12948)
- **What it contributed:** **DeepSeek-R1-Distill** — distilled reasoning capability from DeepSeek-R1 (frontier) into student models of sizes 1.5B, 7B, 8B, 14B, 32B. **Reasoning distillation works**: the small students inherit much of the teacher's CoT capability. R1-Distill-Qwen-32B matched o1-mini on many benchmarks.
- **For the chapter:** the most exciting recent development. Section 7.

### Mukherjee et al. 2023 — "Orca: Progressive Learning from Complex Explanation Traces of GPT-4"
- **arXiv:** [2306.02707](https://arxiv.org/abs/2306.02707)
- **What it contributed:** **Orca** — distillation of GPT-4's *reasoning traces* into smaller students. The key insight: don't just match outputs; match the teacher's chain-of-thought. Set up the recipe later used by R1-Distill.
- **For the chapter:** reasoning distillation lineage.

---

## Core concepts and derivations

### Concept 1: The case for compression

**The deployment math.** Suppose your production model is a 70B parameter LLM. Inference cost:
- **GPU memory**: ~140 GB in BF16 — needs ≥2× A100 80GB per inference instance
- **Throughput**: ~50 tokens/sec per A100 at production batch sizes
- **Latency**: ~25 ms per token at decode

A 7B model: 1× A100 (or A6000); ~500 tokens/sec; ~5 ms per token. **Order of magnitude cheaper per request** — and you can serve many more concurrent users.

**The capability gap.** A 7B base model is significantly worse than a 70B base model — typically 10-30 points behind on MMLU. **Without distillation, the 7B isn't a viable substitute.** With distillation, you can sometimes close that gap to 2-5 points.

**The Pareto frontier**: distillation moves you up and to the left — cheaper *and* nearly as capable. The empirical evidence (DistilBERT 97% of BERT; Phi-3-mini approaching GPT-3.5; R1-Distill-32B matching o1-mini) shows this isn't theoretical.

### Concept 2: Soft labels and dark knowledge

**Hard labels:** the correct class gets probability 1; all others get 0. For classification of "8" vs other digits:
- True label: `[0, 0, 0, 0, 0, 0, 0, 0, 1, 0]` (one-hot, class 8)
- Student trained on hard labels: learns "the correct answer is 8."

**Soft labels (Hinton 2015):** the teacher's *full output distribution*. For the same image:
- Teacher's softmax: `[0.001, 0.002, 0.04, 0.18, 0.01, 0.005, 0.003, 0.01, 0.74, 0.009]` (still picks 8, but assigns notable probability to 3)
- Student trained on soft labels: learns "the correct answer is 8, **and it looks particularly similar to a 3**."

**"Dark knowledge"** is the information encoded in the *relative probabilities of non-target classes*. The teacher implicitly knows that some classes are more similar than others. This information is *lost* in hard labels but *preserved* in soft labels.

**Why this helps the student**: soft labels provide more signal per training example. Hard labels say "correct = 8"; soft labels say "correct = 8, also somewhat like 3, very unlike 1." More information per example → faster convergence → better small models.

### Concept 3: Temperature scaling

**The problem with raw softmax**: trained models often produce very *peaked* distributions — the correct class might get 0.999 probability, with all others near zero. The dark knowledge is *there* but *crushed*.

**Temperature scaling**: divide the logits by $T > 1$ before softmax:
$$p_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$

**Effect of $T$**:
- $T = 1$: standard softmax. Peaked distributions.
- $T > 1$: softer distributions. Non-target classes get more probability mass.
- $T \to \infty$: uniform distribution.

**Typical choice**: $T = 2$ to $T = 10$ for distillation. Higher $T$ = softer = more dark knowledge revealed.

**Both teacher and student outputs are softened with the same $T$**. The teacher's softened distribution is the target; the student's softened distribution is what's being trained to match it.

### Concept 4: The distillation loss

**The Hinton distillation loss** combines two terms:

$$\mathcal{L}_{\text{total}} = (1 - \alpha) \cdot \mathcal{L}_{\text{hard}} + \alpha \cdot \mathcal{L}_{\text{soft}}$$

where:
- $\mathcal{L}_{\text{hard}} = \text{CE}(y_{\text{true}}, \sigma(z_S))$ — standard cross-entropy with true labels
- $\mathcal{L}_{\text{soft}} = T^2 \cdot \text{KL}(\sigma(z_T/T) \,\|\, \sigma(z_S/T))$ — KL divergence on softened distributions

$\alpha \in [0, 1]$ balances the two terms; typically $\alpha = 0.5$ to $0.9$ (more weight on distillation).

**The $T^2$ factor**: ensures gradient magnitudes are comparable between hard and soft loss terms. As $T$ increases, the softmax derivatives shrink by $1/T^2$; multiplying the loss by $T^2$ compensates.

**Why include $\mathcal{L}_{\text{hard}}$**: pure distillation can amplify teacher errors. Including the true labels keeps the student grounded.

```mdx
<Equation label="16.distill">
$$\mathcal{L}_{\text{total}} = (1 - \alpha) \cdot \text{CE}(y_{\text{true}}, \sigma(z_S)) + \alpha \cdot T^2 \cdot \text{KL}(\sigma(z_T/T) \,\|\, \sigma(z_S/T))$$
</Equation>
```

### Concept 5: Hard vs soft distillation

**Hard distillation**: use the teacher's *predictions* (top-1) as training labels. Equivalent to: generate synthetic training data with the teacher; train the student on it as normal supervised learning.

**Soft distillation**: use the teacher's *full distribution* (softmax over all classes). Train the student to match it.

**When hard distillation suffices**:
- The teacher is much better than the student starting point
- You're working with very high-quality teacher predictions
- Implementation simplicity matters more than maximum efficiency
- Easier to combine with other training methods (just use the teacher's outputs as labels)

**When soft distillation helps more**:
- The capability gap between teacher and student is large
- Training data is limited (soft labels carry more information per example)
- You're targeting specific behaviors (soft labels carry confidence)

**In practice**: most modern recipes use **hard distillation** (teacher-generated synthetic data + standard SFT). The reason: easier to scale, easier to mix with other data, and easier to apply across heterogeneous models (different vocabularies, etc.).

### Concept 6: Choosing the student architecture

The student doesn't have to share the teacher's architecture, but compatible choices help.

**Depth vs width tradeoffs**:
- **Same depth, narrower width** (MobileBERT-style): student maintains the teacher's layer structure but with thinner hidden dimensions. Easier to distill; preserves "thinking depth."
- **Shallower depth, same width**: student is shorter but as wide. Smaller and faster per token; loses some long-range reasoning capability.
- **Both shallower and narrower** (DistilBERT-style): aggressive compression. ~40% smaller for typical recipes.

**Initialization tricks**:
- **DistilBERT**: initialize student layers from *alternating* teacher layers. Layer 1 from teacher layer 1; layer 2 from teacher layer 3; etc. Gives the student a strong starting point.
- **Tiny model from scratch**: skip teacher initialization; rely on distillation loss to teach the student.
- **Layer dropping**: take a teacher; *delete* alternate layers to form the initial student. Distill to recover capability.

**Modern recipes** typically use teacher-initialization where possible. The student starts close to the teacher's behavior and only needs to *recover* what's lost during compression.

### Concept 7: Feature distillation

**Beyond output distillation**: also match the teacher's *intermediate activations*.

**Hidden-state distillation**: at certain layers, the student's hidden state should match the teacher's (after a linear projection to align dimensions). Loss: MSE or cosine similarity between aligned activations.

**Attention distillation** (TinyBERT): the student's attention maps should match the teacher's. For each layer pair, minimize KL divergence on attention probability distributions across heads. **Carries information about which tokens the teacher attends to.**

**Why feature distillation helps**: the teacher's intermediate representations encode rich information. Output distillation only sees the final logits; feature distillation sees the *path* the teacher takes.

**Cost**: feature distillation requires running both teacher and student forward passes with matching intermediate access. More memory, more engineering complexity. **Most modern recipes skip it** in favor of pure output distillation, relying on scale and data quality instead.

### Concept 8: Modern recipes

**DistilBERT (Sanh et al. 2019)**:
- 6-layer student (BERT-base has 12)
- 40% smaller, 60% faster, 97% of BERT's GLUE score
- Triple loss: masked LM + distillation + cosine similarity
- Initialized from alternating BERT layers

**TinyBERT (Jiao et al. 2019)**:
- 4-layer student
- Two-stage: general distillation on pre-training data, then task-specific
- **Attention distillation** + hidden-state distillation
- Smaller and stronger than DistilBERT on many tasks

**MobileBERT (Sun et al. 2020)**:
- Same 24-layer depth as BERT-LARGE; very narrow per layer
- Bottleneck architecture: narrow, then expand inside each block
- Designed for mobile inference
- 4× smaller than BERT-base

**Phi family (Microsoft 2023-2024)**:
- Phi-1 (1.3B): "Textbooks Are All You Need" — train on curated educational data
- Phi-2 (2.7B): scaled approach; competitive with 7B models
- Phi-3-mini (3.8B): competitive with GPT-3.5 on many tasks
- Phi-4 (14B): state-of-the-art for ~14B size class as of late 2024
- **"Textbook approach"**: data quality > data quantity. Implicit distillation through synthetic textbook-quality data.

**Gemma 2 (Google 2024)**:
- 2B and 9B variants explicitly distilled from a larger teacher
- Used teacher-student curriculum with both soft labels and synthetic data
- Smaller Gemma 2 models match or exceed Llama 2 7B/13B on benchmarks

**DeepSeek-R1-Distill (DeepSeek 2025)**:
- 1.5B, 7B, 8B, 14B, 32B students distilled from R1
- **Reasoning distillation**: student inherits CoT capability
- R1-Distill-Qwen-32B competitive with o1-mini on math and coding
- **The most exciting recent example**: distilled reasoning works.

**Orca (Mukherjee et al. 2023)**:
- Distill GPT-4's *reasoning traces* into smaller students
- Set up the R1-Distill recipe pattern: emphasize matching the teacher's *thinking*, not just its answers

### Concept 9: When to use distillation

**Use distillation when**:
- You need a small model with capabilities close to a larger one
- Deployment cost matters more than training cost
- You have access to a strong teacher
- You're producing models for many downstream users

**Use PEFT instead when**:
- You want to specialize a model to a task (not compress it)
- You have a base model and small task-specific data
- Model size isn't the binding constraint

**Use full fine-tuning when**:
- You're producing the foundation model from which others will distill
- You need deep capability shifts (new language, new modality)

**Combined recipes** are common: train a strong teacher (full FT + RLHF); distill into a smaller student (Ch 16); then PEFT-tune the student for specific tasks (Ch 15). The full Phase 11 pipeline used in production.

---

## Glossary

- **Distillation**: transfer of capabilities from a large teacher to a small student.
- **Teacher**: the large, capable model being distilled from.
- **Student**: the small model being trained to imitate the teacher.
- **Soft labels**: probability distributions from the teacher (vs hard one-hot labels).
- **Dark knowledge**: information in the relative probabilities of non-target classes.
- **Temperature ($T$)**: softmax temperature; $T > 1$ softens distributions.
- **Hard distillation**: use teacher's top-1 predictions as labels.
- **Soft distillation**: match teacher's full probability distribution.
- **Distillation loss**: $(1-\alpha) L_{\text{hard}} + \alpha L_{\text{soft}}$.
- **Feature distillation**: match teacher's intermediate activations.
- **Attention distillation**: match teacher's attention maps (TinyBERT).
- **DistilBERT**: canonical encoder distillation; 40% smaller, 97% of BERT.
- **Phi family**: Microsoft's data-quality-focused small models.
- **R1-Distill**: DeepSeek's reasoning-distilled models (1.5B-32B).
- **Reasoning distillation**: transferring CoT capabilities to small models.

---

## Pedagogical analogies

### 1. Teacher and student
The names aren't accidental. A skilled teacher doesn't just tell a student "the answer is 8" — they say "the answer is 8, and notice how it looks similar to a 3 and very different from a 1." That extra context is exactly what soft labels provide. **Distillation is pedagogy applied to neural networks.**

Best used for: section 1 motivation.

### 2. Temperature as "spreading the probability mass"
Imagine a probability distribution as a hill. At $T=1$, the hill is sharp — almost all mass at the peak. At $T=10$, the hill is gentle — mass spread across many classes. **The student learns from the *shape* of the hill, not just its peak.** Temperature reveals the shape that's hidden in the sharp $T=1$ distribution.

Best used for: section 3 temperature scaling.

### 3. Dark knowledge as "the answer key plus the rationale"
A standardized test gives you the answer key: "Question 5 → B." A *good* answer key also explains: "B is correct; C is a tempting wrong answer because of [reason]; A is far off." **Dark knowledge is the rationale embedded in the soft probability distribution.** Hard labels are just the answer key; soft labels are the full study guide.

Best used for: section 2 dark knowledge.

### 4. Distillation vs PEFT vs full FT as "compress vs specialize vs build"
- **Full FT**: build a model from scratch (or extensively modify). Expensive; powerful.
- **PEFT (Ch 15)**: take an existing model and *specialize* it for a task. Cheap; doesn't change size.
- **Distillation**: take a capable model and *compress* it. Trades training cost for deployment cost. Doesn't increase capability; reduces footprint.

**They serve different needs.** Don't conflate them.

Best used for: section 8 method selection.

### 5. Reasoning distillation as "learning to think out loud from someone who already does"
A novice mathematician learns proof techniques by reading other mathematicians' proofs. Reading "the answer is X" isn't enough; reading "step 1, then step 2 because of Y, therefore X" is what teaches the *technique*. **Reasoning distillation does this**: the student matches the teacher's *chain-of-thought*, not just its final answers.

Best used for: section 7 R1-Distill.

---

## Common misconceptions

### MC1: "Distilled models are always worse than the teacher."
**Reality:** usually true, but the gap is much smaller than expected. **DistilBERT retains 97% of BERT's GLUE score** at 40% the size. **R1-Distill-Qwen-32B matches o1-mini** on many benchmarks despite being far smaller than R1. Distillation closes most of the capacity gap.

### MC2: "Bigger teacher is always better for the student."
**Reality:** false past a threshold. **The capacity gap matters.** A teacher that's *too much* larger than the student can produce distributions the student can't represent. Empirically, teacher-student ratios of 5-10× work well; ratios of 100× can underperform.

### MC3: "Distillation is just data augmentation with a teacher model."
**Reality:** hard distillation is exactly that, but **soft distillation carries information beyond what hard labels provide.** The dark knowledge in non-target probabilities is genuinely useful. **The teacher gives more signal per example than human labels do.**

### MC4: "Hinton invented distillation."
**Reality:** false. **Buciluă et al. 2006** ("Model Compression") introduced the idea 9 years before Hinton's 2015 paper. Hinton popularized it and introduced temperature scaling + soft labels. Credit where due.

### MC5: "Distillation is only for compression."
**Reality:** false. **Distillation is also for capability transfer.** Examples: cross-lingual transfer (English-trained teacher → multilingual student), cross-modal transfer (vision-language teacher → vision-only student), and capability extraction (reasoning teacher → reasoning student). Compression is one application; the more general idea is "teach the student by example."

### MC6: "The student needs the same architecture as the teacher."
**Reality:** false. **Students can differ in depth, width, vocabulary, even tokenizer.** DistilBERT has half the layers; MobileBERT has bottleneck blocks; Phi has completely different architecture from typical teachers. **The output interface matters more than internal architecture.**

### MC7: "More temperature is always better."
**Reality:** false. **Too-high temperature flattens the distribution into uniformity** — at $T \to \infty$, all classes get equal probability, which carries no information. Typical sweet spot: $T = 2$ to $T = 10$. Below 2: too peaked; above 10: too flat.

### MC8: "Distillation requires the teacher's probability distributions."
**Reality:** false. **Hard distillation works with just the teacher's predictions** (no need for the full distribution). Most modern recipes use hard distillation precisely because it's easier — synthesize data with the teacher, then train the student normally.

---

## Tricky implementation details

### TID1: Temperature gradient flow
At $T > 1$, the gradients of the softened softmax are scaled by $1/T^2$ compared to $T = 1$. **The $T^2$ multiplier in the loss compensates** so the gradient magnitudes are comparable to the hard-label loss. **Without it, the distillation loss would have vanishingly small gradients at high $T$.**

### TID2: Aligning teacher and student vocabularies
For hard distillation: teacher generates text; student trains on it. **Vocabulary doesn't need to match.** For soft distillation: the student's softmax must align with the teacher's softmax at the token level — they must share a vocabulary. **Soft distillation has more constraints; hard distillation is more flexible.**

### TID3: Layer initialization in DistilBERT-style
"Initialize layer $L_i$ of the student from layer $T_{2i}$ of the teacher." Concretely: a 6-layer student initialized from a 12-layer teacher takes teacher layers 1, 3, 5, 7, 9, 11. The student starts with strong representations and only needs to *recover* what's lost from the missing layers.

### TID4: Loss weighting
$\alpha$ controls the balance between hard and soft losses. **Higher $\alpha$ (more weight on soft) helps when the teacher is much better than hard labels.** Lower $\alpha$ helps when teacher outputs are noisy. Typical values: $\alpha = 0.5$ to $0.9$.

### TID5: Synthetic data for hard distillation
Most modern hard-distillation recipes generate synthetic training data using the teacher: prompt the teacher on a wide variety of queries; collect (query, response) pairs; filter for quality; SFT the student on the result. **The "distillation" is implicit** — the student learns to produce teacher-like responses.

### TID6: Capability gap and student floor
If the student is *too* small, no amount of distillation will close the gap. Empirically, **students below ~1B parameters struggle to inherit reasoning capabilities** even from frontier teachers. There's a *floor* below which distillation hits diminishing returns.

### TID7: Reasoning distillation specifics
For CoT distillation: the teacher generates reasoning traces; the student learns to produce similar traces. **The traces themselves are the training signal.** The student's "reasoning" emerges from imitating the teacher's thought patterns. Important: the trace quality bounds the student's reasoning quality.

### TID8: Mixing distillation with other training stages
A common recipe: pretrain → distill → SFT → DPO → PEFT for tasks. Distillation usually slots in after pre-training (or as part of pre-training with a teacher) and *before* alignment. Distilling an already-aligned model can degrade alignment.

---

## Reference implementations

### Soft label distillation loss

```python
import numpy as np

def softmax_with_temperature(logits, T=1.0):
    """Softmax with temperature scaling."""
    logits = logits / T
    logits = logits - logits.max(axis=-1, keepdims=True)   # numerical stability
    exp = np.exp(logits)
    return exp / exp.sum(axis=-1, keepdims=True)

def kl_divergence(p, q, eps=1e-9):
    """KL divergence KL(p || q) along the last axis."""
    return (p * (np.log(p + eps) - np.log(q + eps))).sum(axis=-1)

def distillation_loss(student_logits, teacher_logits, true_labels, T=4.0, alpha=0.7):
    """
    Hinton distillation loss.
    
    student_logits: (batch, classes) — student raw logits
    teacher_logits: (batch, classes) — teacher raw logits (frozen)
    true_labels:    (batch,) — class indices
    T:              temperature
    alpha:          balance between soft and hard loss
    """
    # Soft loss: KL between softened distributions
    p_teacher = softmax_with_temperature(teacher_logits, T)
    p_student = softmax_with_temperature(student_logits, T)
    L_soft = (T ** 2) * kl_divergence(p_teacher, p_student).mean()
    
    # Hard loss: standard cross-entropy with true labels
    p_student_raw = softmax_with_temperature(student_logits, T=1.0)
    one_hot = np.eye(p_student_raw.shape[-1])[true_labels]
    L_hard = -(one_hot * np.log(p_student_raw + 1e-9)).sum(axis=-1).mean()
    
    return (1 - alpha) * L_hard + alpha * L_soft, L_hard, L_soft

# Demo
np.random.seed(0)
batch, classes = 8, 10
teacher_logits = np.random.normal(0, 2, (batch, classes))
# Boost the "correct" class for the teacher
true_labels = np.random.randint(0, classes, batch)
for i, c in enumerate(true_labels):
    teacher_logits[i, c] += 5   # teacher is right

# Student that doesn't yet match teacher
student_logits = np.random.normal(0, 1, (batch, classes))

for T in [1, 4, 10]:
    total, hard, soft = distillation_loss(student_logits, teacher_logits, true_labels, T=T, alpha=0.7)
    print(f"T={T}: total={total:.3f}, hard={hard:.3f}, soft={soft:.3f}")

print("\nAt T=1, the teacher distribution is too peaked; soft loss is small.")
print("At T=4, the soft loss reveals dark knowledge — the standard choice.")
print("At T=10, the distribution flattens too much; signal weakens.")
```

### Temperature effect on probability distributions

```python
import numpy as np

def softmax(logits, T=1.0):
    logits = logits / T
    logits = logits - logits.max()
    exp = np.exp(logits)
    return exp / exp.sum()

# A "teacher" with a clear top class
logits = np.array([2.5, 0.2, 0.8, -1.0, -0.5, 0.3, 0.1, -0.2, 0.5, -0.8])

print(f"Logits: {logits}")
print(f"{'T':>4} | {' '.join([f'{i:>5}' for i in range(10)])} | most-prob")
print("-" * 80)
for T in [1, 2, 4, 8, 16, 32]:
    probs = softmax(logits, T=T)
    top_class = probs.argmax()
    formatted = ' '.join([f'{p:.3f}' for p in probs])
    print(f"{T:>4} | {formatted} | class {top_class}")

print("\nObservations:")
print("- At T=1: top class (0) gets ~0.83 probability; others barely visible.")
print("- At T=4: probability spreads; non-target classes show their relative similarity.")
print("- At T=32: distribution approaches uniform; dark knowledge fades.")
print("- Sweet spot for distillation: T=2 to T=10.")
```

### Hard distillation via synthetic data

```python
import numpy as np

# Conceptual: hard distillation generates synthetic data using the teacher
# Pseudo-code (real version would use a real model):

def generate_synthetic_data(teacher_model, queries):
    """Generate teacher responses for a set of queries. Used as student training data."""
    synthetic = []
    for query in queries:
        # response = teacher_model(query)        # imagine a real call
        response = f"[teacher response to: {query}]"
        synthetic.append({"query": query, "response": response})
    return synthetic

def filter_for_quality(synthetic_data, quality_threshold=0.8):
    """Filter teacher-generated data for quality (real version uses scoring model)."""
    # Pseudo: in production, you'd use a reward model or rubric
    return [s for s in synthetic_data if len(s["response"]) > 10]   # placeholder

# Demo: a few queries
queries = [
    "What is 2 + 2?",
    "Explain photosynthesis briefly.",
    "What's the capital of France?",
]

print("Hard distillation recipe (conceptual):")
print("1. Generate synthetic data using the teacher.")
print("2. Filter for quality.")
print("3. Train the student via standard SFT on the filtered data.\n")

# Step 1
synthetic = generate_synthetic_data(teacher_model=None, queries=queries)
print(f"Step 1: generated {len(synthetic)} synthetic examples.")
for s in synthetic:
    print(f"  Q: {s['query'][:50]}")
    print(f"  A: {s['response'][:60]}")

# Step 2
filtered = filter_for_quality(synthetic)
print(f"\nStep 2: filtered to {len(filtered)} high-quality examples.")

# Step 3: in production, this is just standard SFT training (Ch 13)
print("\nStep 3: train student with standard SFT on filtered data.")
print("\nNo soft labels needed. No KL divergence. Just teacher-generated SFT data.")
print("This is the dominant modern distillation recipe — including R1-Distill and Phi.")
```

---

## Connections to other chapters

- **Ch 13 (SFT)**: hard distillation is SFT with teacher-generated data. Same training loop; different data source.
- **Ch 14 (RLHF/DPO/RLVR)**: distilled models often still need preference optimization afterward. Distillation ≠ alignment.
- **Ch 15 (PEFT)**: you can use LoRA for distillation training (LoRA-distill). The student's adapter weights are trained; the base is frozen.
- **Ch 17-18 (Inference, Quantization)**: distillation compresses *parameter count*; quantization compresses *bits per parameter*. **Often used together** — first distill 70B → 7B, then quantize 7B → 4-bit. Multiplicative compression.
- **Ch 20+ (Reasoning, Tool use)**: reasoning distillation (Orca, R1-Distill) is how strong reasoning capabilities get into small models.

---

## Open questions for the chapter author

### Q1: How much soft-vs-hard distillation depth?
**Recommendation:** balanced. Section 4 covers both. **Honest framing**: hard distillation dominates in practice; soft distillation is the theoretical foundation.

### Q2: Coverage of feature/attention distillation?
**Recommendation:** brief — section 6 mentions TinyBERT and MobileBERT. **Don't deep-dive on alignment matrices.** Modern recipes mostly use output distillation; feature distillation is more historical/specialized.

### Q3: Modern recipe coverage?
**Recommendation:** prominent. Section 7 walks through DistilBERT, Phi, Gemma, R1-Distill, Orca. **R1-Distill is the most exciting recent development** — give it the longest treatment.

### Q4: Reasoning distillation depth?
**Recommendation:** substantial. R1-Distill demonstrated that reasoning *can* be distilled — connect to Ch 14's RLVR content. The reader sees the full pipeline: train teacher with RLVR → distill into small students.

### Q5: Widget candidates
1. **Temperature Scaling Visualizer (marquee):** show a teacher's logit distribution; slider for $T$; watch the probabilities reshape. Reveal dark knowledge at $T = 4-8$; over-flatten at $T = 32$. **Recommended marquee.**
2. **Distillation Pipeline Visualizer (secondary):** Show the data flow: teacher → soft+hard labels → student → comparison. Click each step for details. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 16 is a **single-topic chapter** (distillation). Uses the **4-file cadence**.

Planned file layout:
- File 93: research (this)
- File 94: page structure (~600 lines, 8 sections; runnables embedded)
- File 95: Temperature Scaling marquee widget
- File 96: Distillation Pipeline secondary widget + exercises + closeout (absorbs file 97)

**Pedagogical outcomes for the reader.** After Ch 16, the reader should be able to:
1. Explain why distillation matters for deployment
2. Define soft labels, dark knowledge, and temperature scaling
3. Compute the distillation loss
4. Distinguish hard vs soft distillation
5. Choose a student architecture
6. Identify modern recipes (DistilBERT, Phi, Gemma, R1-Distill)
7. Explain reasoning distillation
8. Decide between distillation, PEFT, and full FT

Eight outcomes. Exercises hit outcomes 3 (compute loss), 4 (hard vs soft tradeoffs), 6 (analyze a recipe).

**Tonal framing:** practical engineering with a side of historical context. Distillation is older than transformers (Bucilua 2006); Hinton 2015 is the canonical reference; modern recipes (R1-Distill, Phi) demonstrate its impact at scale. The voice should be: "here's a foundational technique with renewed relevance in the LLM era."

**Importance to Phase 11:** Ch 16 closes Phase 11. It's the *deployment* counterpart to Ch 13-15's *training* methods. **The full Phase 11 picture**: pre-train → SFT (Ch 13) → preference optimization (Ch 14) → PEFT for efficient training (Ch 15) → distill for cheap deployment (Ch 16). All four are used in modern production.

**Bridge to Phase 12:** after Ch 16 closes, Phase 12 (inference optimization, quantization, sampling) begins. **Distillation reduces parameter count; quantization reduces bits per parameter; sampling controls inference behavior.** The three layers of efficient deployment.

This chapter completes the post-training arc. The reader should walk away knowing that real production deployments use the full pipeline — and that distillation is the bridge from "we have a great frontier model" to "we can deploy a useful model cheaply at scale."
