# Session 59 — Chapter 13 page structure

> First chapter session for Chapter 13 ("Supervised Fine-Tuning"). **The Phase 11 opener** — the post-training arc begins. Covers SFT motivation, the recipe, response-only loss masking, chat templates (ChatML / Llama-3 / Mistral / Gemma), multi-turn conversations, system prompts, LIMA's data-quality insight, synthetic data and teacher distillation, format brittleness, and the capability tax. Single-topic chapter; uses the **4-file cadence**.

---

## Read first (in this order)

1. **`research/ch13-sft/research.md`** — the source material. Every section, derivation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch08-building-small-llm/session-36-page-structure.md`** — for the practical-engineering template (SFT is "just training with a different dataset and a loss mask"; Ch 8's voice is the closest precedent)
4. **`prompts/chapters/ch07-pretraining-data/session-32-page-structure.md`** — for the data-engineering template (Ch 7 introduced data curation; Ch 13 returns to data with a focus on quality)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 13 page. By end of session:

- `src/pages/ch13-sft/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch13-sft/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 13's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch13-sft/` with sidebar showing Ch 13 active, prev/next nav linking to Ch 12 (active) and Ch 14 (disabled)

**Tonal note:** Ch 13 returns to *practical engineering* voice. SFT is **not glamorous**. Most of the work is data curation; the math is identical to Ch 8 with a loss mask. Be honest about this — the chapter should feel grounded and operational, not breathless. **Don't oversell.** SFT is the start of post-training because it works, is cheap, and is universal — not because it's clever.

**Phase 11 framing:** explicit transition. Phase 10 covered alternative architectures (MoE, SSMs); Phase 11 covers what to do with *any* pre-trained architecture to make it useful. The transition signal: "We now have models that complete text. The remaining four chapters teach them to be useful."

**Chapter cadence:** Ch 13 uses the **4-file cadence** (single-topic).

---

## Inputs

State of the repo after session 56 (Ch 12 complete):

- Ch 1-12 all `'published'`
- `research/ch13-sft/research.md` exists
- `src/lib/chapters.ts` has Ch 1-12 `'published'`, Ch 13-30 `'planned'`
- No `src/pages/ch13-sft/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch13-sft/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch13-sft/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 13's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch13-sft
description: Supervised Fine-Tuning (SFT) — the first and most universal post-training method. Take a pre-trained base model, fine-tune on instruction-response pairs with response-only loss masking, and you have a usable chatbot. This chapter covers the SFT recipe, chat templates (ChatML, Llama-3, Mistral, Gemma), multi-turn conversation formatting, system prompts, the LIMA insight that 1000 high-quality examples can suffice, synthetic data generation (Alpaca, Vicuna, UltraChat), and the capability tax — how SFT can degrade pre-training capabilities. The first chapter of Phase 11 (post-training); the foundation of every modern chatbot.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~250 words) of opening that signal the Phase 11 transition.

**Sample opening** — rewrite in chapter voice:

> Chapters 1-10 taught how to train a pre-trained language model. Chapters 11-12 covered architectural alternatives (MoE, SSMs) for when standard transformers don't fit your constraints. **What you have at the end of either path** — dense transformer, MoE, or SSM — is a model that completes text. Type "The capital of France is" and it produces "Paris." Type a question and it may or may not answer.
>
> That model isn't a chatbot. It doesn't know it should respond when asked. It doesn't follow instructions, refuse harmful requests, or adopt a persona. **Phase 11 (Post-training)** covers how to turn raw next-token prediction into something useful: SFT (this chapter), preference optimization (Chapter 14), parameter-efficient methods (Chapter 15), and distillation (Chapter 16).
>
> Supervised Fine-Tuning is the foundation. **The recipe is mechanically simple**: take a base model, fine-tune on a dataset of (instruction, response) pairs with the loss computed only on response tokens. That's it. The math is unchanged from Chapter 8's training loop; what differs is the data and a mask. Every modern chatbot — GPT-4, Claude, Llama-3-Instruct, Mistral-Instruct, Gemini — went through SFT. The interesting questions are operational: what chat template, what data, how much, what hyperparameters. This chapter covers those.

### Section 1: The setup — pre-trained ≠ useful

**Heading:** `## The setup — pre-trained ≠ useful`
**Word target:** ~400

**Teaching beats:**
1. **Pre-trained capabilities**: base models can complete text and follow patterns shown in-context. With careful prompting (few-shot), they can do many tasks. But they don't *intrinsically* know to be a chatbot.
2. **What's missing**: response format, system-prompt awareness, refusal behavior, persona, instruction-following without few-shot demonstrations.
3. **The post-training pipeline**: SFT → preference optimization → (optional PEFT, distillation). SFT comes first because everything else depends on having a chatbot-ish starting point.
4. **Why SFT is universal**: GPT-4, Claude, Llama-3, Gemini, Mistral all went through SFT. **It's the most universally-applied post-training method.** Some skip preference optimization; none skip SFT.
5. **What this chapter doesn't cover**: preference optimization (Ch 14), PEFT/LoRA (Ch 15), distillation as a separate technique (Ch 16). Pure full-parameter SFT here.

**Required callout** — type `note`: Phase 11 transition. The architecture exploration is over (Phase 10 closed with Ch 12). Phase 11 covers post-training methods for any pre-trained architecture: SFT (this chapter), preference optimization (Ch 14), PEFT (Ch 15), and distillation (Ch 16). Phase 11 chapters are more sequential than Phase 10's — each builds on the previous.

**No code in this section.** Setup and motivation.

**Connection forward:** section 2 introduces the recipe.

### Section 2: The SFT recipe — instructions in, responses out

**Heading:** `## The SFT recipe — instructions in, responses out`
**Word target:** ~700
**Sub-headings:** `### The recipe in one paragraph`, `### What changes from pre-training`, `### What stays the same`

**Teaching beats:**

**The recipe in one paragraph:**
1. **The recipe**: take a pre-trained base model. Construct a dataset of (instruction, response) pairs. Format each pair according to a chat template. Fine-tune with standard next-token prediction loss, **but mask the loss on instruction tokens**. Train for 1-3 epochs at a learning rate ~10× smaller than pre-training (typically 1e-5 to 5e-5). The resulting model knows it's a chatbot.
2. **That's it.** No new architecture. No new loss function (just masked). No new optimizer.

**What changes from pre-training:**
3. **Data**: instruction-response pairs instead of raw web text
4. **Loss mask**: response-only instead of all tokens
5. **Learning rate**: ~10× smaller (1e-5 vs 1e-4)
6. **Epochs**: 1-3 vs pre-training's "as many tokens as Chinchilla says"
7. **Sequence length**: typically shorter (2K-8K) since conversations are short
8. **Batch size**: smaller token budget per batch (256K-1M tokens vs pre-training's many millions)

**What stays the same:**
9. **Architecture**: identical. Same transformer, same attention, same FFN, same embedding.
10. **Optimizer**: AdamW with similar β₁, β₂, weight decay
11. **Mixed precision**: BF16 + FP32 master weights
12. **Parallelism**: same FSDP / Megatron stack from Ch 10, just at smaller scale
13. **The math**: cross-entropy loss, gradient descent — unchanged from Chapter 8

**Required callout** — type `aside`: SFT is "just training with a different dataset and a loss mask." Most engineering teams reuse their pre-training infrastructure (FSDP scripts, optimizer configs, training loops) for SFT with minor modifications: load a base checkpoint, swap the dataset, reduce the LR, add response masking. **There's no separate "SFT framework"** — it's all the same code.

**No code in this section.** Conceptual setup; code arrives in section 3 with loss masking.

**Connection forward:** the loss mask is the chapter's central technical detail. Section 3.

### Section 3: Response-only loss masking

**Heading:** `## Response-only loss masking`
**Word target:** ~500 — CENTRAL TECHNICAL DETAIL
**Sub-headings:** `### Why mask the loss`, `### How the mask works`

**Teaching beats:**

**Why mask the loss:**
1. **Pre-training computes loss on every token.** Each token in the sequence is a training target.
2. **In SFT, the instruction is *given*** — it's not what we want the model to learn to produce.
3. **Without masking, the model would**:
   - Memorize specific user prompts (waste of capacity)
   - Learn weird mid-conversation completions (training on user-side tokens that don't generalize)
   - Slightly hurt response quality
4. **The fix**: compute the loss only on assistant response tokens. User prompt + system prompt tokens are still in the context but don't contribute to the loss.

**How the mask works:**
5. **The mask is a binary tensor** the same shape as the input sequence: 1 on assistant tokens, 0 elsewhere.
6. **In practice**: tokenize the conversation, identify which token positions are response, build the mask.
7. **HuggingFace utilities**: `DataCollatorForCompletionOnlyLM` handles this automatically using the chat template's role markers.
8. **Mathematically**:
   $$\mathcal{L}_{\text{SFT}} = \frac{1}{\sum_t m_t} \sum_t m_t \cdot \mathcal{L}_{\text{CE}}(y_t, p_t)$$
   where $m_t \in \{0, 1\}$ is the response mask.

**Required widget placeholder** — SFT Data Flow / Loss Masking (marquee, session 60):

```mdx
<WidgetFrame title="SFT loss masking" caption="A multi-turn conversation tokenized and visualized. Each token is shown with its role (system / user / assistant). Toggle 'response mask' on/off to see which tokens contribute to the loss. Hover any token for details. The mask determines what the model learns to generate vs what's just context.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 60 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with the response-only loss masking implementation:

```python
import numpy as np

def cross_entropy(logits, labels):
    """Numerically stable per-position cross-entropy."""
    max_logit = logits.max(axis=-1, keepdims=True)
    log_z = np.log(np.exp(logits - max_logit).sum(axis=-1, keepdims=True)) + max_logit
    # Gather logits at the label positions
    label_logits = np.take_along_axis(logits, labels[..., None], axis=-1).squeeze(-1)
    return (log_z.squeeze(-1) - label_logits)

def sft_loss(logits, labels, response_mask):
    """
    SFT loss with response-only masking.
    
    logits:        (T, V) — model output for one sequence
    labels:        (T,)   — target tokens
    response_mask: (T,)   — 1 where this token is assistant response, 0 elsewhere
    """
    per_position = cross_entropy(logits, labels)   # (T,)
    masked = per_position * response_mask
    return masked.sum() / max(response_mask.sum(), 1)

# Demo: 8-token sequence; first 4 tokens are user prompt, last 4 are assistant response
np.random.seed(0)
T, V = 8, 100
logits = np.random.normal(0, 1, (T, V))
labels = np.random.randint(0, V, T)

# Full loss: counts all 8 tokens
full_loss = cross_entropy(logits, labels).mean()

# Masked loss: only counts last 4 (assistant) tokens
response_mask = np.zeros(T)
response_mask[4:] = 1.0
masked_loss = sft_loss(logits, labels, response_mask)

print(f"Full-sequence loss: {full_loss:.3f}")
print(f"Response-only loss: {masked_loss:.3f}")
print(f"\nThe response-only loss focuses gradient updates on assistant tokens.")
print(f"The model learns to generate good responses, not to memorize user prompts.")
```

**Required callout** — type `warning`: MC3 from research.md. "SFT loss is computed on all tokens." Wrong — **response-only loss masking is the standard.** Computing loss on user prompts wastes model capacity (memorizing specific prompts instead of learning to respond) and slightly hurts performance. Always mask.

**Connection forward:** with the loss handled, how do we *format* the conversation so the model knows what's user vs assistant?

### Section 4: Chat templates and special tokens

**Heading:** `## Chat templates and special tokens`
**Word target:** ~700 — CENTRAL PRACTICE
**Sub-headings:** `### What a chat template does`, `### Four major templates`, `### Using `apply_chat_template()``

**Teaching beats:**

**What a chat template does:**
1. **The problem**: an LM takes a flat token sequence. A conversation has multiple roles (system, user, assistant). The template flattens the conversation into a sequence with **special tokens** marking role boundaries.
2. **Special tokens are pre-defined**: each model family has its own tokens for role markers, added during tokenizer training. They have specific token IDs the model was trained to recognize.

**Four major templates:**
3. **ChatML** (used by OpenAI, Mistral via tokenizer config): `<|im_start|>role\ncontent<|im_end|>`. Clean, system-prompt-aware.
4. **Llama-3** (Meta): verbose, with `<|begin_of_text|>`, `<|start_header_id|>role<|end_header_id|>`, `<|eot_id|>`. Distinguishes turn-of-turn from end-of-sequence.
5. **Mistral** (older, native): `[INST] ... [/INST]`. Simpler. No system role natively — system instructions get prepended to the first user message.
6. **Gemma** (Google): `<start_of_turn>role\ncontent<end_of_turn>`. Like ChatML but different syntax. Also lacks system role.

**Using `apply_chat_template()`:**
7. **HuggingFace's `tokenizer.apply_chat_template()`** is the standard API. You pass a list of `{"role": ..., "content": ...}` messages; the tokenizer applies the model's template.
8. **Why this matters**: writing templates by hand is error-prone. The model's tokenizer ships with the right template baked in. **Just use the function.**

**Required widget placeholder** — Chat Template Comparison (secondary, session 61):

```mdx
<WidgetFrame title="Chat template comparison" caption="The same conversation rendered in four chat templates: ChatML, Llama-3, Mistral, and Gemma. Each uses different special tokens, role markers, and handles system prompts differently. Switching templates between models causes broken output — always match the template to the model.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 61 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with manual template implementation:

```python
def format_chatml(messages):
    """ChatML format: <|im_start|>role\ncontent<|im_end|>"""
    out = ""
    for m in messages:
        out += f"<|im_start|>{m['role']}\n{m['content']}<|im_end|>\n"
    return out

def format_llama3(messages):
    """Llama-3 format: verbose header IDs, end-of-turn tokens"""
    out = "<|begin_of_text|>"
    for m in messages:
        out += f"<|start_header_id|>{m['role']}<|end_header_id|>\n\n{m['content']}<|eot_id|>"
    return out

def format_mistral(messages):
    """Mistral [INST] format; no native system role"""
    out = "<s>"
    sys_content = ""
    for m in messages:
        if m["role"] == "system":
            sys_content = m["content"] + "\n\n"
        elif m["role"] == "user":
            out += f"[INST] {sys_content}{m['content']} [/INST]"
            sys_content = ""
        else:  # assistant
            out += f" {m['content']}</s>"
    return out

# Same conversation, three templates
conversation = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is the capital of France?"},
    {"role": "assistant", "content": "The capital of France is Paris."},
]

for name, fn in [("ChatML", format_chatml), ("Llama-3", format_llama3), ("Mistral", format_mistral)]:
    print(f"=== {name} ===")
    print(fn(conversation))
    print()

print("Different special tokens; same logical conversation.")
print("Mixing them up (ChatML tokens on a Llama-3 model) breaks the model.")
```

**Required callout** — type `warning`: MC6 from research.md. "Any LM can use any chat template." Wrong — **each model is trained with specific special tokens.** Using ChatML tokens on a Llama-3 model produces broken output. Always use the model's intended template, either via `tokenizer.apply_chat_template()` or by following the model card's instructions.

**Connection forward:** templates handle single-turn well. What about multi-turn dialog and system prompts?

### Section 5: Multi-turn conversations and system prompts

**Heading:** `## Multi-turn conversations and system prompts`
**Word target:** ~500
**Sub-headings:** `### Multi-turn dialog`, `### System prompts`

**Teaching beats:**

**Multi-turn dialog:**
1. **The template extends to multi-turn**: append turns sequentially.
2. **For SFT, mask each user turn**: only assistant turns contribute to loss.
3. **Why mask all user turns**: each assistant turn should be predicted given the full history. The model learns to continue from any conversation state.
4. **Truncation vs packing for long conversations**:
   - Truncate: drop oldest turns (loses early context).
   - Pack: pack multiple short conversations into one sequence with proper boundaries. Modern recipes use packing for GPU efficiency.

**System prompts:**
5. **System prompts set persistent behavior** at the start. Examples: "You are a helpful assistant," "You are a coding assistant focused on Python," "You are a doctor."
6. **System prompts during SFT**: include diverse system prompts in training data so the model learns to follow them.
7. **System prompts at inference**: the model can follow *any* system prompt — it generalizes.
8. **Practical robustness tip**: include training examples both *with* and *without* system prompts (or with a default). The model needs to handle both cases.

**Required callout** — type `aside`: MC7 from research.md. System prompts are "just text" technically, but the model treats them differently in practice. System-role tokens have **stronger persistence** across the conversation because the model was trained to weight them. Putting your instructions in the user message gives weaker steering than the system message.

**No code in this section.** Conceptual extension of section 4.

**Connection forward:** with the mechanics covered, what about the data itself? Section 6.

### Section 6: Data quality matters more than quantity

**Heading:** `## Data quality matters more than quantity`
**Word target:** ~600 — LIMA SECTION
**Sub-headings:** `### The LIMA claim`, `### Why alignment is shallow`, `### Practical implications`

**Teaching beats:**

**The LIMA claim:**
1. **LIMA** (Zhou et al. 2023): fine-tuned Llama-65B on just **1000 manually-curated** instruction-response pairs.
2. **Performance**: competitive with much larger SFT runs (Alpaca's 52K, OpenAssistant's 161K).
3. **The provocative claim**: **alignment is shallow** — you don't need huge datasets to teach format.
4. **Why this surprised people**: prior wisdom was "more data is always better." LIMA showed clear diminishing returns past ~1K-10K examples.

**Why alignment is shallow:**
5. **Pre-training already taught the model**: how to generate text, what humans typically write about, factual content, syntactic patterns.
6. **SFT just teaches the surface format** of being a chatbot: how to introduce yourself, how to structure responses, when to refuse.
7. **Format is fast to learn**: a small number of high-quality examples is enough to elicit the model's pre-existing capabilities in chatbot form.
8. **What SFT *doesn't* teach**: new world knowledge. The model that didn't know who won the 2024 election from pre-training won't learn it from 1000 SFT examples.

**Practical implications:**
9. **Curate, don't accumulate**: 1000 hand-curated examples often beat 100K auto-generated examples.
10. **Diversity matters more than volume**: 50 task types × 100 examples > 1 task type × 5000 examples.
11. **Bad data teaches bad habits**: training on noisy responses makes the model produce noisy responses.
12. **Quality over quantity has limits**: at industrial scale (Llama-3-Instruct, Claude, GPT-4), large + curated datasets do help. But for any first SFT pass: start small and high-quality.

**Required callout** — type `warning`: MC1 from research.md. "SFT teaches the model new knowledge." Mostly false — **SFT teaches format and style, rarely teaches new facts.** LIMA's success comes precisely because *only format needs to be taught*. The model already knew the content; SFT just taught it the *shape* of being an assistant.

**Required callout** — type `warning`: MC2 from research.md. "More SFT data is always better." False — **LIMA showed 1000 high-quality examples beat 100K low-quality ones.** Diminishing returns past 10K-50K. Overtraining (>3 epochs) actively hurts.

**Connection forward:** but hand-curation is expensive. How do most open-source projects get data? Section 7.

### Section 7: Synthetic data and teacher distillation

**Heading:** `## Synthetic data and teacher distillation`
**Word target:** ~500
**Sub-headings:** `### The teacher-student pattern`, `### Major synthetic SFT datasets`, `### Limitations`

**Teaching beats:**

**The teacher-student pattern:**
1. **Hand-curation is expensive** (LIMA used graduate students). For open-source at scale, the alternative is **synthetic data from a stronger model**.
2. **Self-Instruct** (Wang et al. 2022): bootstrap data using the model itself + seed instructions.
3. **Alpaca pattern** (Taori et al. 2023): 175 hand-written seed instructions → GPT-3.5 generates ~52K more → fine-tune Llama-7B. Total cost: ~$600. **Cheap and cheerful.**

**Major synthetic SFT datasets:**
4. **Alpaca** (52K, single-turn, GPT-3.5-davinci): the original cheap recipe
5. **Vicuna** (~70K, multi-turn, ShareGPT conversations): better quality than Alpaca because real conversations are more diverse
6. **UltraChat** (1.5M, multi-turn, GPT-3.5-turbo): scale via synthetic conversations
7. **OpenOrca / Orca-1/2** (Microsoft): step-by-step reasoning traces from GPT-4. Strong on math/reasoning.
8. **WizardLM** (Microsoft): instruction evolution — iteratively complicate instructions

**Limitations:**
9. **Distillation ceiling**: student can't exceed teacher on the teacher's distribution. Alpaca can't exceed GPT-3.5-davinci.
10. **Stylistic homogeneity**: all synthetic data sounds like the teacher. Less diversity than human data.
11. **Hallucination propagation**: teacher errors transfer to student.
12. **License issues**: outputs from commercial APIs may have ToS restrictions on using outputs for training competitors.

**Required code** — `<RunnableCode>` simulating a basic quality filter for synthetic data:

```python
import numpy as np

def quality_score(example):
    """
    Score an instruction-response example. Higher = better.
    Real systems use: length checks, reward models, deduplication,
    profanity filters, etc. This is a simplified version.
    """
    instruction = example["instruction"]
    response = example["response"]
    
    score = 1.0
    # Penalize too-short responses
    if len(response) < 20: score *= 0.3
    # Penalize too-long responses (often padded/repetitive)
    if len(response) > 2000: score *= 0.5
    # Penalize meta-references ("As an AI...")
    if "as an ai" in response.lower(): score *= 0.5
    # Penalize empty / placeholder responses
    if response.strip() in ["", "I don't know.", "N/A"]: score *= 0.1
    # Prefer responses that don't repeat the instruction
    if instruction.lower() in response.lower(): score *= 0.5
    return score

# Simulated synthetic dataset
examples = [
    {"instruction": "What is the capital of France?",
     "response": "The capital of France is Paris."},
    {"instruction": "Explain quantum entanglement.",
     "response": "OK"},
    {"instruction": "Write a poem about clouds.",
     "response": "As an AI language model, I cannot truly experience clouds, but here is a poem..."},
    {"instruction": "What's 2 + 2?",
     "response": "2 + 2 equals 4."},
    {"instruction": "Tell me about photosynthesis.",
     "response": " ".join(["This is a great topic."] * 200)},   # padded/repetitive
]

print(f"{'instruction':>40} | score | keep?")
print("-" * 65)
for ex in examples:
    s = quality_score(ex)
    keep = "✓" if s >= 0.5 else "✗"
    print(f"{ex['instruction'][:38]:>40} | {s:.2f}  | {keep}")

print("\nA simple quality filter eliminates many low-quality synthetic examples.")
print("Real systems use reward models + deduplication + heuristics.")
```

**Connection forward:** SFT works but has costs. Section 8.

### Section 8: Pitfalls — format brittleness, capability tax

**Heading:** `## Pitfalls — format brittleness, capability tax`
**Word target:** ~400
**Sub-headings:** `### The capability tax`, `### Format brittleness`, `### Bridge to preference optimization`

**Teaching beats:**

**The capability tax:**
1. **SFT can hurt pre-training capabilities** that aren't represented in the SFT data.
2. **InstructGPT** (Ouyang et al. 2022): InstructGPT was *worse* than base GPT-3 on some standard NLP benchmarks. **The "alignment tax."**
3. **Specific risks**: code performance degrades if SFT is non-code-heavy; math performance degrades; some world knowledge can drift.
4. **Mitigations**: mix diverse data (include code, math, factual), don't overtrain (1-3 epochs), use lower LR, optionally mix in pre-training data.

**Format brittleness:**
5. **Heavily SFT'd models can be brittle to format changes**. The model becomes "addicted" to the exact format of training.
6. **Example**: train on `<|im_start|>` templates → model produces garbage when prompted without them.
7. **Mitigations**: include diverse templates in training; don't overtrain; use template consistency tools.

**Bridge to preference optimization:**
8. **SFT teaches format; it doesn't teach quality.** A model can produce confidently wrong, confidently harmful, or confidently low-quality responses after SFT.
9. **Preference optimization** (Ch 14) addresses this — train the model to *prefer* responses humans rate higher. SFT + DPO is the modern open-source post-training stack.
10. **The progression**: pre-training → SFT (this chapter) → preference optimization (Ch 14) → optionally PEFT (Ch 15) or distillation (Ch 16).

**Required callout** — type `warning`: MC5 from research.md. "SFT preserves all pre-training capabilities." False — **SFT causes some capability degradation (catastrophic forgetting).** Capabilities not represented in SFT data tend to degrade. Mix in diverse data and don't overtrain.

**Sample close** (rewrite in chapter voice):

> SFT is the cheap-and-cheerful start of post-training. Pre-trained model + instruction-response data + response-masked loss + a chat template = chatbot. Every modern chat model went through this step. The work isn't in the algorithm — it's in choosing the chat template, curating data, balancing diversity, and managing the capability tax.
>
> But SFT only teaches *format*. The model learns to *respond* but not necessarily to respond *well*. A bad SFT response can still be confident, harmful, or low-quality. **Chapter 14** covers what comes next: preference optimization. RLHF, DPO, RLVR — the family of methods that turn an instruction-following model into a *helpful* one. The recipe is more elaborate; the gains are real. Modern open-source post-training is SFT + DPO; the next chapter walks through DPO and its variants.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 13, slug: 'ch13-sft', title: 'Supervised Fine-Tuning (SFT)', partNum: 5, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch13-sft/index.astro && rm src/pages/ch13-sft/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch13-sft/`** renders with:
   - Chapter eyebrow ("Chapter 13") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 3, 4, 7)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 4)
   - At least 5 callouts (targeting MC1, MC2, MC3, MC5, MC6 from research.md, plus the Phase 11 transition note and "SFT is just training with a mask" aside)
3. **Sidebar:** Ch 1-12 published; Ch 13 active (draft); Ch 14-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 13:** prev = Ch 12 (active); next = Ch 14 (disabled)
6. **TOC on Ch 13** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 4000 and 4800 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 60 and 61 own them.
- ❌ **Do not write exercises.** Session 61 owns (combined with secondary widget).
- ❌ **Do not flip Ch 13's status to `'published'`.** Session 61 owns.
- ❌ **Do not derive RLHF, DPO, or any preference optimization math.** Ch 14 owns. Just mention they exist in section 8.
- ❌ **Do not deep-dive into LoRA / PEFT.** Ch 15 owns. Mention "LoRA-based SFT is common in practice" and move on.
- ❌ **Do not enumerate every chat template.** Show 4 (ChatML, Llama-3, Mistral, Gemma); emphasize `apply_chat_template()` as the API.
- ❌ **Do not list every synthetic SFT dataset.** Mention 4-5 historical anchors (Alpaca, Vicuna, UltraChat, OpenOrca, WizardLM).
- ❌ **Do not modify Ch 1-12.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch13-sft/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch13-sft/index.astro 2>/dev/null || true
git commit -m "session 59: Ch 13 prose — SFT (recipe, response masking, chat templates, LIMA, synthetic data)"
git push origin main
```

---

## Notes for the session author

**On Phase 11 framing in the opening:**
The opening should explicitly signal: "Phase 9-10 = how to *train* a base model. Phase 11 = how to *use* a base model." Phase 11 chapters build on each other more than Phase 10's did — SFT → preference optimization → PEFT → distillation is a sequence.

**On the "SFT is not glamorous" voice:**
Don't oversell SFT. The chapter should feel grounded: this is the cheap-and-cheerful start of post-training. The math is unchanged from Ch 8; the work is in data and operations. Match Ch 7's empirical-engineer voice. Don't get breathless about LIMA's insight (it's surprising but well-documented); don't oversell synthetic data (it has real limitations).

**On the central technical detail (response masking):**
Section 3 is the most important *mechanical* section. The reader should walk away knowing: response-only loss is the standard; it's a single line of code; tools like `DataCollatorForCompletionOnlyLM` handle it. Don't elaborate beyond this — the technique is simple.

**On chat templates being a craft topic:**
Section 4 is the most important *practical* section. Show 3-4 templates explicitly. Emphasize `apply_chat_template()` as the API. **Don't try to enumerate all variants** — they multiply faster than the tutorial can track.

**On LIMA emphasis:**
Section 6 is the most important *insight* section. LIMA's claim is counterintuitive and worth dwelling on. **The pedagogical punchline: "alignment is shallow."** Once readers internalize this, they understand why SFT works at all.

**On the synthetic data section:**
Section 7 is the most important *historical* section. Alpaca, Vicuna, UltraChat, OpenOrca, WizardLM. Each is a specific recipe. Be honest about limitations (distillation ceiling, homogeneity, hallucination propagation).

**On capability tax being honest:**
Section 8 should be honest about SFT's costs. InstructGPT was *worse* than GPT-3 on some benchmarks. This is real; mention it. Mitigations exist but the tax is real.

**On the 3 runnable code blocks:**
- Section 3 (response masking): runs in Pyodide with numpy
- Section 4 (chat templates): runs in Pyodide; string manipulation
- Section 7 (quality filter): runs in Pyodide; simple heuristics

3 blocks. Same density as previous chapters.

**Pedagogical claim of the chapter:**
"SFT is the cheap-and-cheerful foundation of post-training. The math is unchanged from pre-training: cross-entropy loss, gradient descent. What changes: instruction-response data instead of web text, response-only loss masking, smaller learning rate, fewer epochs, a chat template. LIMA showed that 1000 high-quality examples can suffice — alignment is shallow. But SFT only teaches format; the next chapter (DPO/RLHF) teaches quality."

**This chapter opens Phase 11.** Pace through the next three chapters at the established cadence — they build on each other more than Phase 10's chapters did.
