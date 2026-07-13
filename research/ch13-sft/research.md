# Chapter 13 — Supervised Fine-Tuning (SFT): research

> Curated source material for Chapter 13's build sessions. **The first chapter of Part V (Post-training)** — the largest remaining arc of the tutorial. Part V covers what to do with a pre-trained model to make it useful: SFT (Ch 13), preference optimization (Ch 14), parameter-efficient methods (Ch 15), and distillation (Ch 16). **SFT is the cheap-and-cheerful foundation** of every modern post-training pipeline: take a base LM, fine-tune on instruction-response pairs with response-only loss masking, and you have a usable chatbot. The recipe is mechanically simple but the *practice* — chat templates, data quality, format brittleness, capability tax — is where teams spend their time. Single-topic chapter; uses the **4-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Supervised Fine-Tuning (SFT)

**Premise:** Parts III–IV (Chapters 7–12) covered how to train a base language model. That model can complete text but doesn't follow instructions, doesn't know it's a chatbot, doesn't refuse harmful requests. SFT is the first step in turning it into something useful: fine-tune on a curated dataset of (instruction, response) pairs using **next-token prediction with the loss computed only on response tokens**. This teaches the model the format of "answer this question," "follow this instruction," "have this conversation." Most modern chat models start with SFT before any RLHF/DPO. **The recipe is simple; the data and format choices are where craft happens.**

**Out of scope (other chapters):**
- Pre-training (Ch 7-10)
- Preference optimization / RLHF / DPO (Ch 14)
- PEFT methods like LoRA (Ch 15)
- Distillation (Ch 16)
- Alternative architectures (Ch 11-12)

**In scope and locked:**
- **The SFT recipe**: standard next-token-prediction fine-tuning on instruction-response pairs
- **Response-only loss masking**: only compute loss on assistant tokens, not on user prompts
- **Chat templates**: ChatML, Llama-3, Mistral, Gemma; special tokens like `<|im_start|>`, `<|begin_of_text|>`
- **Multi-turn conversations**: how to format dialog history
- **System prompts**: setting persistent behavior at the start of the conversation
- **Data quality**: LIMA's claim that 1000 high-quality examples beat 100K low-quality
- **Common SFT datasets**: FLAN, Super-NaturalInstructions, Alpaca, ShareGPT, UltraChat, Tulu
- **Synthetic data and teacher distillation**: Alpaca and Vicuna patterns
- **Hyperparameters**: typical learning rates (lower than pre-training), batch sizes, epochs
- **The capability tax**: SFT degrades some pre-training capabilities (catastrophic forgetting)
- **Where SFT sits in the post-training pipeline**: usually before DPO/RLHF

**Suggested chapter structure** (8 sections):

1. The setup — pre-trained ≠ useful (~400 words)
2. The SFT recipe — instructions in, responses out (~700 words)
3. Response-only loss masking (~500 words — central technical detail)
4. Chat templates and special tokens (~700 words — central practice)
5. Multi-turn conversations and system prompts (~500 words)
6. Data quality matters more than quantity (~600 words — LIMA section)
7. Synthetic data and teacher distillation (~500 words)
8. Pitfalls — format brittleness, capability tax (~400 words)

Target: ~4300 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Ouyang et al. 2022 — "Training language models to follow instructions with human feedback" (InstructGPT)
- **arXiv:** [2203.02155](https://arxiv.org/abs/2203.02155)
- **What it contributed:** **InstructGPT** — the canonical paper introducing the modern three-stage post-training recipe: SFT → reward modeling → RL fine-tuning. Despite the title's RLHF emphasis, **Step 1 was SFT** — they collected ~13K instruction-response pairs from human labelers and fine-tuned on them. SFT alone produced models humans preferred to base GPT-3.
- **For the chapter:** the foundational citation. The SFT-first recipe came from here.

### Wei et al. 2021 — "Finetuned Language Models Are Zero-Shot Learners" (FLAN)
- **arXiv:** [2109.01652](https://arxiv.org/abs/2109.01652)
- **What it contributed:** **FLAN** — fine-tuned a language model on 60+ NLP datasets reformulated as instructions. Showed that *instruction tuning at scale* produces strong zero-shot generalization to held-out tasks. The "fine-tune on lots of instruction templates" recipe.
- **For the chapter:** central reference for "SFT works." Cite as the empirical foundation.

### Wang et al. 2022 — "Super-NaturalInstructions: Generalization via Declarative Instructions on 1600+ NLP Tasks"
- **arXiv:** [2204.07705](https://arxiv.org/abs/2204.07705)
- **What it contributed:** **Super-NaturalInstructions** — 1600+ tasks across 76 task types, each with task definition + instances. Demonstrated that instruction tuning generalizes to entirely unseen task types when training data is diverse enough.
- **For the chapter:** brief reference to the large-scale-data approach.

### Taori et al. 2023 — "Alpaca: A Strong, Replicable Instruction-Following Model"
- **Blog:** [crfm.stanford.edu/2023/03/13/alpaca.html](https://crfm.stanford.edu/2023/03/13/alpaca.html)
- **What it contributed:** **Alpaca** — fine-tuned Llama-7B on 52K instruction-following examples generated by GPT-3 (text-davinci-003) at total cost ~$600. Demonstrated that **a strong teacher model is itself a usable SFT data source** — the "self-instruct" pattern that became standard for open-source.
- **For the chapter:** central reference for synthetic SFT data. Cheap-and-cheerful instruction tuning.

### Chiang et al. 2023 — "Vicuna: An Open-Source Chatbot Impressing GPT-4 with 90%* ChatGPT Quality"
- **Blog:** [vicuna.lmsys.org](https://vicuna.lmsys.org)
- **What it contributed:** **Vicuna** — fine-tuned Llama on 70K conversation samples from ShareGPT (real ChatGPT conversations users shared). Demonstrated **multi-turn SFT data > single-turn**. Higher quality than Alpaca despite similar size.
- **For the chapter:** central reference for ShareGPT-style multi-turn SFT.

### Zhou et al. 2023 — "LIMA: Less Is More for Alignment"
- **arXiv:** [2305.11206](https://arxiv.org/abs/2305.11206)
- **What it contributed:** **LIMA** — fine-tuned Llama-65B on just **1000 manually-curated** instruction-response pairs. Achieved performance competitive with much larger SFT runs. **Quality > quantity** for SFT data.
- **For the chapter:** central reference for data quality. The pedagogical centerpiece of section 6.

### Tunstall et al. 2023 — "Zephyr: Direct Distillation of LM Alignment"
- **arXiv:** [2310.16944](https://arxiv.org/abs/2310.16944)
- **What it contributed:** **Zephyr-7B** — a recipe combining **SFT** on UltraChat + **DPO** on UltraFeedback. Demonstrated that the modern open-source post-training stack (SFT → DPO) produces ChatGPT-3.5-class quality on 7B models. **The current canonical small-model post-training recipe.**
- **For the chapter:** brief reference; sets up the bridge to Ch 14 (DPO).

### Wang et al. 2022 — "Self-Instruct: Aligning Language Models with Self-Generated Instructions"
- **arXiv:** [2212.10560](https://arxiv.org/abs/2212.10560)
- **What it contributed:** **Self-Instruct** — bootstrap instruction-following data using the model itself + a small seed set. The technique Alpaca used: ~175 hand-written seed instructions → 52K generated instructions via GPT-3.
- **For the chapter:** brief reference for synthetic data generation.

### Ivison et al. 2023 — "Camels in a Changing Climate: Enhancing LM Adaptation with Tulu 2"
- **arXiv:** [2311.10702](https://arxiv.org/abs/2311.10702)
- **What it contributed:** **Tulu 2** — open SFT recipe + curated data mixture. Tulu 2 SFT is the AI2 reference implementation of modern open SFT.
- **For the chapter:** brief reference for modern open-source SFT recipes.

---

## Core concepts and derivations

### Concept 1: The SFT recipe in one paragraph

Take a pre-trained base language model. Construct a dataset of (instruction, response) pairs. Format each pair according to a chat template (turning it into a single token sequence with role markers). Fine-tune the model on these sequences with **standard next-token prediction loss** — but **mask the loss on the instruction tokens** so the model is only trained to predict the response. Train for 1-3 epochs at a learning rate ~10× smaller than pre-training (typically 1e-5 to 5e-5). The resulting model knows it's a chatbot.

**That's it.** Mechanically, SFT is just "more pre-training" with a different dataset and a loss mask. All the engineering details (chat templates, response masking, learning rate schedule, data quality) are *operational* — the math is unchanged from Ch 8.

### Concept 2: Response-only loss masking

The base model's pre-training loss is computed on **every token**: predict every next token from the previous context.

In SFT, this would mean the model learns to predict the user's question — which is wasteful and slightly harmful (the model shouldn't memorize specific user prompts).

**Response-only loss masking**: compute the loss only on assistant response tokens. User prompt tokens are still in the context (the model sees them) but don't contribute to the loss.

In code, this is a simple mask in the loss computation:

```python
def sft_loss(logits, labels, response_mask):
    """
    logits:        (B, T, vocab_size) — model output
    labels:        (B, T) — target tokens (shifted by 1)
    response_mask: (B, T) — 1 where this token is assistant response, 0 elsewhere
    """
    # Standard cross-entropy at every position
    losses = F.cross_entropy(
        logits.view(-1, logits.size(-1)),
        labels.view(-1),
        reduction='none',
    ).view_as(labels)
    
    # Mask: only count response tokens
    masked_loss = (losses * response_mask).sum() / response_mask.sum()
    return masked_loss
```

**Why this matters**: the model is being taught to *respond*, not to *complete the user's prompt*. Without masking, the model would learn weird mid-conversation completions and waste capacity memorizing instructions.

### Concept 3: Chat templates

A chat template formats a conversation into a single token sequence with **special tokens** marking role boundaries.

**ChatML format** (used by OpenAI, Mistral, others):
```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
What is the capital of France?<|im_end|>
<|im_start|>assistant
The capital of France is Paris.<|im_end|>
```

**Llama-3 format** (Meta's recipe):
```
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>

What is the capital of France?<|eot_id|><|start_header_id|>assistant<|end_header_id|>

The capital of France is Paris.<|eot_id|>
```

**Mistral format** (simpler, no system token):
```
<s>[INST] What is the capital of France? [/INST] The capital of France is Paris.</s>
```

**Gemma format**:
```
<start_of_turn>user
What is the capital of France?<end_of_turn>
<start_of_turn>model
The capital of France is Paris.<end_of_turn>
```

**Each model family uses a different template** because they were trained with different special tokens. **Mismatched templates produce broken output** — the model expects `<|im_start|>user` and you give it `[INST]`, it gets confused.

**HuggingFace's `tokenizer.apply_chat_template()`** abstracts this — you provide messages as `[{"role": "user", "content": ...}, ...]` and the tokenizer formats them per the model's template. **This is the modern API**; everyone uses it.

### Concept 4: Multi-turn conversations and system prompts

**Multi-turn dialog**: the chat template can express conversations with multiple back-and-forth turns:

```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
What is the capital of France?<|im_end|>
<|im_start|>assistant
The capital of France is Paris.<|im_end|>
<|im_start|>user
And its population?<|im_end|>
<|im_start|>assistant
Paris has about 2.1 million people in the city proper.<|im_end|>
```

For SFT, you typically mask the loss on **all user turns** (not just the first); only assistant turns contribute to loss. This way the model learns to generate the *next* response given the entire conversation history.

**System prompts** set persistent behavior at the start. Common patterns:
- "You are a helpful assistant."
- "You are a coding assistant. Answer in Python."
- "You are a doctor. Be careful with medical advice."

**System prompts during SFT vs inference**: training data can include diverse system prompts so the model learns to follow them. Inference can use *any* system prompt — the model generalizes.

### Concept 5: Data quality matters more than quantity

**LIMA** (Zhou et al. 2023) is the canonical demonstration: 1000 manually-curated high-quality instruction-response pairs produced a model competitive with much larger SFT runs.

**Why quality matters more than quantity**:
1. **Pre-training already taught the model how to generate text.** SFT just teaches it the *format* of being an assistant. Format learning is fast.
2. **Bad data teaches bad habits.** A model trained on low-quality responses learns to produce low-quality responses.
3. **Diversity matters more than volume.** 100 examples per task type × 50 task types > 5000 examples of one task.
4. **The "alignment surface" is small.** Most of the model's capability comes from pre-training; SFT shifts a relatively small portion of behavior.

**LIMA's claim**: alignment is **shallow** — a small high-quality dataset is sufficient to elicit the model's pre-existing capabilities in chatbot form.

**Practical implication**: spend effort on data curation, not data volume. 10K hand-curated examples often beats 1M auto-generated examples.

### Concept 6: Synthetic data and teacher distillation

Hand-curating SFT data is expensive (LIMA used graduate students). **Most open-source SFT uses synthetic data** generated by larger models.

**Self-Instruct pattern** (Wang et al. 2022):
1. Hand-write ~175 seed instructions
2. Use a strong LM (GPT-3, GPT-4, Claude) to generate more instructions
3. Use the same LM to generate responses to those instructions
4. Filter for quality (heuristics + model judges)
5. Result: 50K-1M synthetic examples

**Alpaca**: 175 seed instructions → 52K generated examples via GPT-3 → fine-tune Llama-7B. **Total cost: ~$600.** First open instruction-tuned LM at competitive quality.

**Vicuna**: Use ShareGPT (real user-ChatGPT conversations users shared) → ~70K multi-turn conversations → fine-tune Llama. Better quality than Alpaca because real conversations are more diverse.

**Modern synthetic SFT recipes**:
- **UltraChat** (OpenBMB, 2023): 1.5M conversations generated by GPT-3.5-turbo
- **OpenOrca / Orca-1/2** (Microsoft 2023): step-by-step reasoning traces from GPT-4
- **WizardLM** (2023): instruction evolution — iteratively complicate instructions

**Limitations of synthetic data**:
1. **Distillation ceiling**: the student can't exceed the teacher's quality on the teacher's distribution
2. **Stylistic homogeneity**: all synthetic data sounds like the teacher; less diversity than human data
3. **Hallucination propagation**: teacher errors transfer to student
4. **Legal/license issues**: outputs from commercial APIs may have terms-of-service restrictions

### Concept 7: The capability tax

SFT is *not free* — it has costs.

**Format brittleness**: heavily SFT'd models can be brittle to format changes. Prompt them slightly differently from training format and they degrade.

**Capability degradation (catastrophic forgetting)**: SFT can hurt pre-training capabilities. Specifically:
- **Coding** if trained on non-code conversations
- **Math** if trained on non-math conversations
- **World knowledge** can drift if SFT data is narrow

**The "alignment tax"** — Ouyang et al. 2022 observed that InstructGPT was *worse* than base GPT-3 on some standard benchmarks (HellaSwag, etc.). The model gained instruction-following at the cost of some pure language modeling capability.

**Mitigations**:
1. **Mix in diverse data**: include code, math, factual, conversational
2. **Don't over-train**: 1-3 epochs is enough; more often hurts
3. **Use lower learning rates**: 1e-5 to 5e-5 vs pre-training's ~1e-4
4. **Mix in pre-training data** (some recipes): blend a small fraction of pre-training data into SFT to preserve base capabilities

### Concept 8: SFT hyperparameters

Typical SFT hyperparameters (the kind of thing you'd put in a `train.yaml`):

- **Learning rate**: 1e-5 to 5e-5 (10× smaller than pre-training)
- **LR schedule**: cosine or linear with warmup
- **Warmup**: 3-5% of total steps
- **Batch size (tokens)**: 256K-1M tokens per batch (less than pre-training)
- **Epochs**: 1-3 (more risks overfitting; LIMA used 15 with regularization but that's unusual)
- **Sequence length**: 2K-8K (modern models often 4K-8K)
- **Precision**: BF16 with FP32 master weights
- **Optimizer**: AdamW (β₁=0.9, β₂=0.999, weight decay=0.0 typical)

These are *much smaller* hyperparameters than pre-training — SFT is "fine" tuning, hence the name.

### Concept 9: Where SFT sits in the post-training pipeline

The modern post-training pipeline (per InstructGPT and modern open recipes):

1. **Base model** (pre-trained on web text, code, etc.)
2. **SFT** (this chapter): teach format of being a chatbot
3. **Preference optimization** (Ch 14): DPO or RLHF to align with human preferences
4. (Optional) **PEFT** (Ch 15): parameter-efficient fine-tuning for specific use cases
5. (Optional) **Distillation** (Ch 16): compress to smaller model

**Most production models** go through (1)→(2)→(3). Some skip (3) if SFT data quality is high enough (LIMA-style). Most stop after (3); few production models use (4) or (5).

**SFT is the foundation.** Skipping it means going straight from pre-training to RLHF, which is unstable (the RL gets confused about what "good" means without an SFT prior).

---

## Glossary

- **SFT (Supervised Fine-Tuning)**: fine-tuning a pre-trained LM on (instruction, response) pairs.
- **Base model**: a pre-trained LM before SFT. Does next-token prediction but isn't a chatbot.
- **Instruct model**: a model that's been through SFT (and possibly RLHF). Knows how to be a chatbot.
- **Chat template**: format for serializing a multi-turn conversation into a single token sequence.
- **Special tokens**: tokens like `<|im_start|>`, `[INST]`, `<|eot_id|>` that mark role boundaries.
- **Response masking / loss masking**: computing the loss only on assistant tokens.
- **Chat ML / ChatML**: a specific chat template format using `<|im_start|>` / `<|im_end|>`.
- **System prompt**: persistent instruction at the start of a conversation (e.g., "You are a helpful assistant.").
- **Multi-turn**: dialog with multiple back-and-forth exchanges.
- **Self-Instruct**: bootstrap method for generating instruction data using an LM.
- **Distillation (in SFT context)**: training on outputs of a stronger model.
- **LIMA**: the "Less Is More for Alignment" paper; 1000 high-quality examples can suffice.
- **UltraChat / OpenOrca / WizardLM**: prominent synthetic SFT datasets.
- **Capability tax / alignment tax**: degradation of base capabilities after SFT.
- **Catastrophic forgetting**: a network "forgetting" capabilities as it learns new ones.
- **Instruct format**: another name for chat template format.

---

## Pedagogical analogies

### 1. SFT as "format school"
A base model is a polymath who can produce text on any topic but doesn't know social conventions. SFT is teaching the polymath the conventions of being a chatbot — how to introduce themselves, how to structure answers, when to refuse, how to format code. The polymath already *knew* everything; SFT just teaches them *how to act*.

**Best used for:** section 1 motivation.

### 2. Chat template as "uniform"
A chat template is the model's uniform. It marks "I'm the user," "I'm the assistant," "this is the system instruction." Without the uniform, the model doesn't know who's speaking. Wrong uniform (using ChatML on a Llama-3 model) confuses it. The right uniform makes the model immediately recognize the conversation structure.

**Best used for:** section 4 chat templates.

### 3. Response masking as "graded essays only"
You're teaching writing. You give the student a prompt, they write a response, you grade only the response — not the prompt. SFT response masking is the same: gradient flows only through the model's response, not through the prompt it read. The prompt is *given*; the response is what we're evaluating.

**Best used for:** section 3 response masking.

### 4. LIMA's insight as "etiquette school"
A skilled chef doesn't need to learn cooking to attend etiquette school — they already cook. Etiquette school teaches them *table manners and presentation*. LIMA's insight: a pre-trained LM already has the cooking skills; SFT just teaches table manners. Table manners can be taught with 1000 well-curated examples, not 100,000.

**Best used for:** section 6 LIMA discussion.

### 5. Capability tax as "specialist gives up generalist skills"
A general doctor becomes a cardiologist through specialization. They gain heart expertise but lose some breadth — they're rustier on dermatology, less practiced at general internal medicine. SFT is the same: gain instruction-following expertise, lose some breadth. The trade is usually worth it but it's a real cost.

**Best used for:** section 8 capability tax discussion.

---

## Common misconceptions

### MC1: "SFT teaches the model new knowledge."
**Reality:** mostly false. **SFT teaches format and style, rarely teaches new facts.** A model that doesn't know who won the 2024 election from pre-training won't learn it from 1000 SFT examples either. SFT shifts behavior; it doesn't update most of the world model. LIMA's success comes precisely because *only format needs to be taught* — the model already knows the content.

### MC2: "More SFT data is always better."
**Reality:** false. **LIMA** showed that 1000 high-quality examples beat 100K low-quality ones. Diminishing returns kick in fast — typically by 10K-50K examples. Diversity matters more than volume. Some practitioners report that overtraining on SFT data (>3 epochs) actively hurts: the model becomes brittle to format changes and loses generalization.

### MC3: "SFT loss is computed on all tokens."
**Reality:** false. **Response-only loss masking is the standard.** Computing loss on user prompts wastes capacity (the model memorizes prompts instead of learning to respond) and slightly hurts performance (the model learns to "complete" user inputs, which is the wrong target).

### MC4: "SFT and RLHF are interchangeable."
**Reality:** they serve different purposes. **SFT teaches format** (be a chatbot, follow the template). **RLHF aligns preferences** (give responses humans prefer; refuse harmful ones; be helpful). SFT typically comes *first* and prepares the model so RLHF has a reasonable starting point. RLHF without SFT is unstable; SFT without RLHF works but produces less-aligned outputs.

### MC5: "SFT preserves all pre-training capabilities."
**Reality:** false. **SFT causes some capability degradation** (catastrophic forgetting). Specifically: capabilities not represented in the SFT data tend to degrade. A chat-focused SFT mixture can hurt code and math performance unless those tasks are explicitly included. The InstructGPT paper noted that InstructGPT was *worse* than base GPT-3 on some standard NLP benchmarks — the "alignment tax."

### MC6: "Any LM can use any chat template."
**Reality:** false. **Each model is trained with specific special tokens**; using the wrong template produces broken output. A Llama-3 model expecting `<|begin_of_text|>` and `<|eot_id|>` will get confused if you give it ChatML's `<|im_start|>` and `<|im_end|>`. **Always use the model's intended template** (typically via `tokenizer.apply_chat_template()`).

### MC7: "System prompts are just text concatenation."
**Reality:** *technically* yes (it's all tokens), but in practice the model treats system-role tokens differently. **System prompts have stronger persistence** across the conversation because the model was trained to weight them. Putting your instructions in the user message instead of the system message gives weaker behavioral steering.

---

## Tricky implementation details

### TID1: Loss masking via the special-token convention
Most modern chat templates produce token sequences where assistant content is bounded by specific tokens. The loss mask is constructed by tracking those boundaries during tokenization. HuggingFace `transformers` provides utilities (`DataCollatorForCompletionOnlyLM`) that handle this — most teams use these rather than rolling their own.

### TID2: BOS/EOS token confusion
Different models use different BOS (beginning-of-sequence) and EOS (end-of-sequence) tokens. Many chat templates *also* use turn-boundary tokens like `<|eot_id|>` (end-of-turn) that are distinct from EOS. Getting these wrong is a common bug — the model produces text indefinitely (no EOS triggered) or stops mid-response.

### TID3: Pad token alignment
For batched training, sequences need to be the same length, so padding is added. **Pad tokens must be excluded from the loss** (their gradient contribution is meaningless). Usually `attention_mask` and `labels = -100` (PyTorch convention) handle this.

### TID4: Truncation vs packing
For multi-turn data, conversations may exceed `max_seq_len`. Two strategies:
- **Truncate**: drop oldest turns. Loses early context.
- **Pack**: stuff multiple shorter conversations into one sequence with proper boundary tokens. Uses GPU memory better but more complex.

Modern open-source SFT recipes (Tulu 2, Zephyr) use packing for efficiency.

### TID5: System prompt presence
Some training data has system prompts; some doesn't. **Inconsistency causes issues** — a model trained with system prompts often expects one. Modern recipes: always include a system prompt (default: "You are a helpful assistant.") so the model is robust to its presence/absence.

### TID6: Length distribution mismatch
SFT data tends to have *much* shorter sequences than pre-training data. Pre-training: avg ~1K-2K tokens per sequence. SFT: avg ~200-500 tokens per conversation. This shifts the model's typical generation length unless you mix in longer examples.

### TID7: Learning rate for fine-tuning
Pre-training peak LR is ~1e-4 (for transformers at scale); SFT LR is typically ~1e-5 to 5e-5 (10× smaller). Too high and the model forgets pre-training. Too low and SFT doesn't transfer.

---

## Reference implementations

### Response-only loss masking

```python
import torch
import torch.nn.functional as F

def sft_loss(logits, labels, response_mask):
    """
    Compute SFT loss with response-only masking.
    
    logits:        (B, T, vocab_size) — model outputs
    labels:        (B, T) — target tokens (typically labels[:, t] = input_ids[:, t+1])
    response_mask: (B, T) — 1 where this token is an assistant response, 0 otherwise
    
    Returns scalar loss.
    """
    # Standard cross-entropy at every position
    losses = F.cross_entropy(
        logits.view(-1, logits.size(-1)),
        labels.view(-1),
        reduction='none',
    ).view_as(labels)   # (B, T)

    # Only count response tokens
    masked_loss = (losses * response_mask.float()).sum() / response_mask.float().sum().clamp(min=1)
    return masked_loss

# Demo
B, T, V = 2, 8, 100
logits = torch.randn(B, T, V)
labels = torch.randint(0, V, (B, T))

# Hand-crafted response mask: first 4 tokens are user prompt; last 4 are assistant response
response_mask = torch.zeros(B, T)
response_mask[:, 4:] = 1.0   # mark last 4 tokens as response

loss_full = F.cross_entropy(logits.view(-1, V), labels.view(-1))
loss_masked = sft_loss(logits, labels, response_mask)

print(f"Full-sequence loss: {loss_full:.3f}")
print(f"Response-only loss: {loss_masked:.3f}")
print(f"(Different because we only count the 4 response tokens, not all 8.)")
```

### Building a chat template manually

```python
def format_chatml(messages):
    """
    Format a multi-turn conversation in ChatML.
    
    messages: list of {"role": "system"/"user"/"assistant", "content": str}
    
    Returns the formatted prompt and a list of (start_idx, end_idx) tuples
    marking where each assistant response is (for loss masking).
    """
    output = ""
    response_spans = []   # (start, end) char indices for assistant responses
    
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        output += f"<|im_start|>{role}\n"
        
        if role == "assistant":
            start = len(output)
            output += content
            end = len(output)
            response_spans.append((start, end))
        else:
            output += content
        
        output += "<|im_end|>\n"
    
    return output, response_spans

# Demo
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is the capital of France?"},
    {"role": "assistant", "content": "The capital of France is Paris."},
    {"role": "user", "content": "And its population?"},
    {"role": "assistant", "content": "Paris has about 2.1 million people."},
]

formatted, spans = format_chatml(messages)
print("Formatted conversation:")
print(formatted)
print(f"\nAssistant response spans: {spans}")
print(f"(These are the char ranges to mask in for loss computation.)")
```

### Comparing chat templates side-by-side

```python
CONVERSATION = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is the capital of France?"},
    {"role": "assistant", "content": "The capital of France is Paris."},
]

def chatml(msgs):
    out = ""
    for m in msgs:
        out += f"<|im_start|>{m['role']}\n{m['content']}<|im_end|>\n"
    return out

def llama3(msgs):
    out = "<|begin_of_text|>"
    for m in msgs:
        out += f"<|start_header_id|>{m['role']}<|end_header_id|>\n\n{m['content']}<|eot_id|>"
    return out

def mistral(msgs):
    # Mistral has no system role; combine system into first user message
    out = "<s>"
    sys_content = ""
    for m in msgs:
        if m["role"] == "system":
            sys_content = m["content"] + "\n\n"
        elif m["role"] == "user":
            out += f"[INST] {sys_content}{m['content']} [/INST]"
            sys_content = ""
        else:  # assistant
            out += f" {m['content']}</s>"
    return out

def gemma(msgs):
    # Gemma has no system role; combine into user
    out = ""
    sys_content = ""
    for m in msgs:
        if m["role"] == "system":
            sys_content = m["content"] + "\n\n"
        elif m["role"] == "user":
            out += f"<start_of_turn>user\n{sys_content}{m['content']}<end_of_turn>\n"
            sys_content = ""
        else:
            out += f"<start_of_turn>model\n{m['content']}<end_of_turn>\n"
    return out

for name, fn in [("ChatML", chatml), ("Llama-3", llama3), ("Mistral", mistral), ("Gemma", gemma)]:
    print(f"=== {name} ===")
    print(fn(CONVERSATION))
    print()

print("Different special tokens, different role markers, different system handling.")
print("Pick the right template for the model — otherwise it breaks.")
```

---

## Connections to other chapters

- **Ch 8 (Training loop)**: SFT *is* the training loop from Ch 8, with a smaller LR and a response-masked loss. The mechanics are identical.
- **Ch 10 (Training infrastructure)**: SFT runs on the same infrastructure as pre-training, just smaller scale. Most teams use single-node FSDP for SFT.
- **Ch 11 (MoE)**: SFT works on MoE models with caveats — fine-tuning a sparse MoE risks expert collapse if data is narrow. Some practitioners freeze the router during SFT.
- **Ch 14 (Preference optimization)**: SFT precedes DPO/RLHF in the standard recipe. SFT teaches *format*; preference methods align *quality*.
- **Ch 15 (PEFT)**: most production SFT is actually LoRA-based PEFT, not full fine-tuning. Ch 15 covers this. But this chapter focuses on full SFT for clarity.
- **Ch 16 (Distillation)**: synthetic SFT data is teacher distillation — the student learns from teacher-generated examples. Ch 16 deep-dives.

---

## Open questions for the chapter author

### Q1: Full fine-tune vs LoRA in this chapter?
**Recommendation:** focus on full SFT for pedagogical clarity. Mention that LoRA-based SFT is more common in practice and forward-reference Ch 15. The math is the same; LoRA is an optimization.

### Q2: How deep on chat templates?
**Recommendation:** medium-deep. Show 3-4 templates (ChatML, Llama-3, Mistral, Gemma) side-by-side. Don't try to enumerate all variants — there are too many and they change. Emphasize that `tokenizer.apply_chat_template()` is the standard API.

### Q3: How much synthetic data discussion?
**Recommendation:** brief section (Section 7). Mention Alpaca, Vicuna, UltraChat, OpenOrca as historical anchors. Don't deep-dive on Self-Instruct mechanics — it's a 2022 technique that's been refined.

### Q4: LIMA emphasis level?
**Recommendation:** prominent — it's the chapter's most counterintuitive claim. "1000 examples is enough." Devote a full section (Section 6) to data quality with LIMA as the centerpiece.

### Q5: Widget candidates
1. **SFT Data Flow / Loss Masking visualizer (marquee):** show a conversation tokenized; highlight which tokens contribute to the loss (assistant tokens) and which don't (user + system tokens). Toggle to see the loss-masked gradient flow. **Recommended marquee.**
2. **Chat Template Comparison (secondary):** side-by-side comparison of ChatML / Llama-3 / Mistral / Gemma templates rendering the same conversation. Reader sees the format differences explicitly. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 13 is a **single-topic chapter** (SFT). Uses the **4-file cadence**.

Planned file layout:
- File 76: research (this)
- File 77: page structure (~600 lines, 8 sections; runnables embedded)
- File 78: SFT Data Flow / Loss Masking marquee widget
- File 79: Chat Template Comparison secondary widget + exercises + closeout

**Pedagogical outcomes for the reader.** After Ch 13, the reader should be able to:
1. State the SFT recipe in one sentence
2. Implement response-only loss masking
3. Distinguish chat templates and use `apply_chat_template()`
4. Explain LIMA's "quality > quantity" claim
5. List common SFT datasets and their characteristics
6. Describe the capability tax / alignment tax
7. Explain where SFT sits in the post-training pipeline
8. Identify the major pitfalls and mitigations

Eight outcomes. Exercises hit outcomes 2 (loss masking), 3 (templates), 5 (dataset structure).

**This chapter opens Part V — post-training.** Ch 13 (SFT) is the foundation. Ch 14 (preference optimization) builds on it. Ch 15 (PEFT) and Ch 16 (distillation) refine it. **Part V is more sequential** than Part IV — chapters build on each other.

**Tonal framing**: SFT is *not glamorous*. It's the cheap-and-cheerful start of post-training. Most of the work is in data curation, not algorithm design. Be honest about this — the chapter should feel practical and grounded, not breathless.

**Important framing**: SFT is universally applied. Every modern chatbot (GPT-4, Claude, Llama-3-Instruct, Mistral-Instruct, Gemini) went through SFT. **It's the most universally-applied post-training method.**
