# Session 103 — Chapter 23 page structure

> First chapter session for Chapter 23 ("Multimodal"). **The chapter that takes LLMs beyond text — and closes Phase 13.** Eight sections walking from "why multimodal matters" → Vision Transformers (secondary widget here) → CLIP (marquee widget here) → modern VLMs → audio → multimodal RAG → computer use → Phase 13 close / Phase 14 open. Single-topic chapter; uses the **4-file cadence**. **The chapter that closes the capability arc.**

---

## Read first (in this order)

1. **`research/ch23-multimodal/research.md`** — the source material. Every section, equation, code snippet, and misconception traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch22-retrieval-and-rag/session-98-page-structure.md`** — for the immediate predecessor's voice; Phase 13's infrastructure-engineering tone carries here
4. **`prompts/chapters/ch20-reasoning/session-89-page-structure.md`** — for the Phase 13 opening voice template (the first Phase 13 chapter)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 23 page. By end of session:

- `src/pages/ch23-multimodal/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch23-multimodal/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 23's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch23-multimodal/` with sidebar showing Ch 23 active, prev/next nav linking to Ch 22 (active) and Ch 24 (disabled)

**Tonal note:** Ch 23 is a **capability survey with operational realism.** Multimodal is **rapidly evolving** in 2024-2025; the chapter must balance "here's the foundational technique" with "here's what's currently frontier." Concrete numbers (token counts per image: 196-4000; Whisper training data: 680k hours; voice-native latency: <500ms; VLM context budgets: 100K-1M tokens). Honest tradeoffs (bolt-on vs native VLMs; OCR limits; computer-use latency).

**Phase 13 progression**: this chapter is the **final Phase 13 chapter**. **Closing the capability arc**: reasoning (think) + tool use (act) + RAG (retrieve) + multimodal (perceive). After Ch 23: Phase 14 opens with safety, interpretability, and evaluation as full disciplines.

**Chapter cadence:** Ch 23 uses the **4-file cadence** (single-topic chapter).

---

## Inputs

State of the repo after session 100 (Ch 22 complete):

- Ch 1-22 all `'published'`
- `research/ch23-multimodal/research.md` exists
- `src/lib/chapters.ts` has Ch 1-22 `'published'`, Ch 23-30 `'planned'`
- No `src/pages/ch23-multimodal/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch23-multimodal/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch23-multimodal/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 23's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch23-multimodal
description: Multimodal — how LLMs perceive images, audio, and video. From the unifying technical pattern (any modality, tokenize, transformer), through Vision Transformers (images as patches), CLIP contrastive image-text alignment, modern vision-language models (LLaVA, GPT-4V, Claude with vision, Gemini), Whisper and voice-native audio, multimodal RAG, and computer use as the visual-agent frontier. Closes Phase 13's capability arc — reasoning, tool use, retrieval, and now perception — and sets up Phase 14's disciplines (safety, interpretability, evaluation).
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

> Most of the world isn't text. Images, audio, video, screenshots, charts, faces, voices — these carry vast information that text alone can't represent. **Multimodal models extend the language-model framework to non-text inputs and outputs.** The core technical question: how do you turn a non-text modality into something a transformer can process? The answer for vision: chop the image into patches and treat each patch as a "visual token." The answer for audio: spectrogram → patches → tokens. The recipe generalizes. **Once a modality is tokenized, the transformer doesn't know the difference between a text token, a visual token, or an audio token. They're all just vectors.**
>
> This chapter covers the production multimodal stack. **Vision Transformers (ViT)** are the foundational mechanism — images become token sequences via patch embedding. **CLIP** trains image and text encoders jointly so the embeddings share a space; cosine similarity becomes a cross-modal bridge. **Modern vision-language models** — LLaVA, GPT-4V, Claude with vision, Gemini — connect CLIP-style vision encoders to LLMs. **Audio** follows the same recipe: Whisper turned spectrograms into a strong open-source ASR; voice-native models (GPT-4o, Gemini Live) handle audio in and out end-to-end. **Multimodal RAG** retrieves images alongside text in shared embedding spaces. **Computer use** ties everything together — a visual agent that operates a desktop via screenshots + mouse + keyboard, combining vision (this chapter) with tool use (Ch 21) and reasoning (Ch 20).
>
> **This chapter closes Phase 13.** The capability arc — reasoning, tool use, retrieval, multimodal — turns raw next-token generation into something closer to a generally-capable digital assistant. **By the end, you'll understand how LLMs perceive beyond text — and what's still hard.** Then Phase 14 opens with the disciplines that turn capable systems into trustworthy ones: safety, interpretability, and evaluation.

### Section 1: Why multimodal matters

**Heading:** `## Why multimodal matters`
**Word target:** ~400
**Sub-headings:** `### The unstated assumption of text-only models`, `### The unifying pattern`

**Teaching beats:**

**The unstated assumption:**
1. **Text-only LLMs assume the world is describable in text.** It mostly isn't.
2. Documents have layout; diagrams have spatial structure; voices carry tone; videos have motion; charts have geometry.
3. **Text-only models can describe these things post-hoc, but they can't directly perceive them.**

**What multimodal unlocks:**
4. **Document understanding** — read PDFs with figures, tables, formulas
5. **Diagram and chart reasoning** — answer questions about visuals
6. **Voice interfaces** — conversational AI that actually listens
7. **Computer use** — agents that can see their environment (Ch 21 bridge)
8. **Robotics and embodied AI** — perception-action loops

**The unifying technical pattern:**

```mdx
<Equation label="23.multimodal-pattern">
$$\text{modality} \;\xrightarrow{\text{tokenizer}}\; \text{token sequence} \;\xrightarrow{\text{transformer}}\; \text{output}$$
</Equation>
```

**Once a modality is tokenized, the transformer treats it like any other sequence.** The novelty is the tokenizer; the architecture isn't new.

**Empirical scale (early 2025)**:
- **VLM input**: 196-4000 visual tokens per image (depends on resolution)
- **Multimodal context**: 100K-1M tokens for video understanding
- **Voice latency**: GPT-4o and Gemini Live target <500ms end-to-end
- **Quality**: frontier VLMs match or exceed humans on many visual QA benchmarks

**Required callout** — type `aside`: **MC1 from research.md.** "Multimodal is fundamentally different from text-only." **False.** The transformer architecture is identical; **the only difference is the tokenizer.** Text uses BPE; images use ViT patches; audio uses spectrogram patches. **Once tokenized, the transformer doesn't know the difference.** This is why multimodal is conceptually simple but engineering-heavy — the transformer stays the same; the tokenization layer is what changes.

**No code in this section.** Setup.

**Connection forward:** Section 2 introduces the canonical vision tokenizer — ViT.

### Section 2: Vision Transformers — images as tokens

**Heading:** `## Vision Transformers — images as tokens`
**Word target:** ~600 — IMPORTANT (foundational technique)
**Sub-headings:** `### The recipe`, `### Patch size tradeoffs`, `### What this enables`

**Teaching beats:**

**The recipe** (Dosovitskiy 2020):
1. **Take an image** (e.g., 224×224 pixels, RGB)
2. **Split into patches** (e.g., 16×16 pixels → 196 patches total)
3. **Flatten each patch** into a vector (16×16×3 = 768 values)
4. **Linearly project** to a fixed embedding dim (e.g., 768)
5. **Add positional encoding** (which patch is where)
6. **Prepend a `[CLS]` token** for global representation
7. **Feed into a standard transformer**

The transformer's output for `[CLS]` is a representation of the whole image; per-patch outputs represent regions.

**The remarkable claim**: a transformer with no convolutions, trained on enough data, **matches or exceeds CNNs** on image classification. The bias toward locality that CNNs hard-code can be learned from data instead.

**Patch size tradeoffs**:
- **Smaller** (8×8): more tokens; finer-grained; more compute
- **Larger** (32×32): fewer tokens; coarser; less compute
- **Standard**: 14×14 or 16×16 for 224-resolution images

**Number of tokens per image** (rough):
- 224×224 with 16×16 patches → **196** visual tokens
- 336×336 with 14×14 patches → **576** visual tokens (LLaVA default)
- 1024×1024 with 16×16 patches → **4096** visual tokens (high-detail)

**Tokens scale quadratically with resolution**; high-resolution VLM input is expensive.

**Required widget placeholder** — ViT Patch Tokenizer (secondary, session 133):

```mdx
<WidgetFrame title="ViT patch tokenizer" caption="See how an image becomes tokens. A small image is split into a grid of patches; each patch becomes one visual token. Reader picks a patch; sees its position, dimensions, and a sketch of what the projection layer does. Makes the 'image → tokens' transformation concrete — the foundational mechanism for every modern vision-language model.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 133 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing ViT patch embedding:

```python
import numpy as np

# Image: 224×224 RGB. Patch size: 16×16. Embedding dim: 768.
# Result: (224/16)² = 196 patches; each patch becomes a 768-dim vector.

def patch_embed_image(image_array, patch_size=16, embed_dim=768):
    """
    image_array: shape (H, W, C) = (224, 224, 3)
    Returns: shape (N, embed_dim) = (196, 768)
    """
    H, W, C = image_array.shape
    n_patches_h = H // patch_size      # 14
    n_patches_w = W // patch_size      # 14
    
    # Step 1: Slice into patches and flatten
    patches = []
    for i in range(n_patches_h):
        for j in range(n_patches_w):
            patch = image_array[
                i*patch_size:(i+1)*patch_size,
                j*patch_size:(j+1)*patch_size,
                :,
            ]
            patches.append(patch.flatten())   # shape: (16*16*3,) = (768,)
    patches = np.stack(patches, axis=0)       # shape: (196, 768)
    
    # Step 2: Linear projection to embed_dim
    # In practice, this is a trained nn.Linear(patch_dim, embed_dim)
    np.random.seed(0)
    projection = np.random.randn(patch_size * patch_size * C, embed_dim) * 0.02
    embeddings = patches @ projection         # shape: (196, 768)
    
    # Step 3: Add positional encoding
    pos_encoding = np.random.randn(196, embed_dim) * 0.02   # placeholder
    embeddings = embeddings + pos_encoding
    
    return embeddings

# Demo: a random 224×224 image
np.random.seed(42)
image = np.random.rand(224, 224, 3) * 255

tokens = patch_embed_image(image)
print(f"Input image shape:    {image.shape}")
print(f"Visual tokens shape:  {tokens.shape}")
print(f"Number of tokens:     {tokens.shape[0]}  (= 14×14 patches)")
print(f"Each flattened patch: {16*16*3} values, projected to {tokens.shape[1]}-dim")

# Observations:
# - An image becomes a token sequence; (196, 768) is the same shape a text encoder
#   produces for a 196-token sentence
# - The transformer that follows this layer doesn't know it's processing an image
# - Patch ordering matters; positional encodings preserve spatial relationships
```

**Connection forward:** Section 3 introduces how vision tokens align with text — CLIP.

### Section 3: CLIP — aligning image and text

**Heading:** `## CLIP — aligning image and text`
**Word target:** ~500
**Sub-headings:** `### The training objective`, `### What CLIP enables`

**Teaching beats:**

**The training objective** (Radford 2021):
1. **Image encoder**: ViT → 512 or 768-dim embedding
2. **Text encoder**: small transformer → same-dim embedding
3. **Contrastive loss**: for a batch of N (image, caption) pairs, the N×N cosine similarity matrix should be the identity (paired pairs at high sim; unpaired at low)

```mdx
<Equation label="23.clip-contrastive">
$$\mathcal{L}_{\text{CLIP}} = -\frac{1}{2}\left[\frac{1}{N}\sum_{i} \log \frac{\exp(s_{ii} / \tau)}{\sum_j \exp(s_{ij} / \tau)} + \frac{1}{N}\sum_{j} \log \frac{\exp(s_{jj} / \tau)}{\sum_i \exp(s_{ij} / \tau)}\right]$$
</Equation>
```

where $s_{ij} = \cos(\mathbf{e}^I_i, \mathbf{e}^T_j)$ is the cosine similarity between image $i$ and text $j$, and $\tau$ is a learnable temperature.

**What this does**:
- **Pulls together** paired (image, caption) embeddings
- **Pushes apart** unpaired ones
- After training, images and texts about the same thing live in nearby regions of a **shared embedding space**

**Required widget placeholder** — CLIP Embedding Space (marquee, session 132):

```mdx
<WidgetFrame title="CLIP embedding space" caption="A 2D projection of CLIP image and text embeddings. Reader picks a caption; sees the matching image highlighted; cosine similarities are visualized as distances. The shared image-text embedding space is the foundational technique for every modern vision-language model — and the conceptual bridge between vision and language.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 132 (marquee)
  </div>
</WidgetFrame>
```

**What CLIP enables**:
- **Zero-shot classification**: compare image to class-name embeddings ("a photo of a cat", "a photo of a dog") — no labeled training needed
- **Text-to-image search**: query text → search image vector store
- **Image-to-text search**: query image → search text corpus
- **Vision encoder for VLMs**: CLIP's image encoder is the most common visual encoder in modern VLMs

**Training scale**: CLIP was trained on **400M (image, caption) pairs** scraped from the web. Modern variants use up to 5B+ pairs (LAION, DataComp).

**Required code** — `<RunnableCode>` showing the contrastive scoring core:

```python
import numpy as np

# Simulate a batch of (image, caption) pairs.
# In CLIP: image_encoder(image) → image_embedding
#         text_encoder(caption) → text_embedding
# Both are L2-normalized.

np.random.seed(7)
N = 4    # batch size
D = 512  # embedding dim

# Mock embeddings (in reality, these come from CLIP's image and text encoders)
image_embeddings = np.random.randn(N, D)
text_embeddings = np.random.randn(N, D)

# Inject "paired" structure: each text embedding is biased toward its image
for i in range(N):
    text_embeddings[i] += 0.6 * image_embeddings[i]

# L2 normalize
image_embeddings = image_embeddings / np.linalg.norm(image_embeddings, axis=1, keepdims=True)
text_embeddings = text_embeddings / np.linalg.norm(text_embeddings, axis=1, keepdims=True)

# Cosine similarity matrix: shape (N, N)
sim_matrix = image_embeddings @ text_embeddings.T

# Display
print(f"Image-to-text similarity matrix (diagonal should be highest):\\n")
print(f"{'':>10}", " ".join(f"text_{j}" for j in range(N)))
for i in range(N):
    print(f"image_{i}:  ", " ".join(f"{v:>6.2f}" for v in sim_matrix[i]))

# Compute the contrastive loss (image-to-text direction)
temperature = 0.07
logits = sim_matrix / temperature
log_probs = logits - np.log(np.exp(logits).sum(axis=1, keepdims=True))
loss_i2t = -np.mean([log_probs[i, i] for i in range(N)])
print(f"\\nImage-to-text contrastive loss: {loss_i2t:.4f}")
print(f"(Lower is better; perfect alignment → 0)")

# Observations:
# - The diagonal of the similarity matrix is highest (paired image-text)
# - Off-diagonal (unpaired) is lower
# - CLIP training nudges all unpaired pairs down and paired pairs up
# - Temperature controls peakiness of the softmax; learned in real CLIP
```

**Connection forward:** Section 4 covers what happens when CLIP's vision encoder gets connected to an LLM.

### Section 4: Modern vision-language models

**Heading:** `## Modern vision-language models`
**Word target:** ~600 — IMPORTANT
**Sub-headings:** `### The LLaVA-style pattern`, `### Training stages`, `### The frontier landscape`

**Teaching beats:**

**The LLaVA-style pattern** (the open-source default):

```
image → CLIP vision encoder → visual tokens → projection → LLM
                                                ↑
                                          text tokens
```

**Step-by-step:**
1. **Pre-trained vision encoder** (typically CLIP-ViT-L) embeds the image → ~576 visual tokens
2. **Linear projection** (or small MLP) maps to the LLM's embedding dimension
3. **Concatenate** with text tokens (e.g., `<image_tokens> What is in this image?`)
4. **LLM generates** the response autoregressively

**Training stages** (LLaVA recipe):
- **Stage 1**: freeze vision encoder + LLM; train only the projection layer on caption data
- **Stage 2**: unfreeze the LLM; fine-tune on visual instruction-tuning data (VQA pairs, image-conditioned chat)

**The frontier landscape** (2024-2025):
- **GPT-4V / GPT-4o** (OpenAI): broad visual capabilities; OCR; chart reasoning
- **Claude 3.5 / 4 with vision** (Anthropic): strong document understanding; computer use
- **Gemini 1.5 / 2.0** (Google): **native multimodal** — trained on text + images + audio + video together from the start
- **Open-source**: LLaVA, Qwen-VL, InternVL, Pixtral

**Architectural variants**:
- **Bolt-on** (LLaVA-style): vision encoder + projector + frozen LLM
- **Cross-attention** (Flamingo-style): text tokens attend to visual tokens via cross-attention layers
- **Native** (Gemini-style): single architecture with mixed-modality tokens

**Required callout** — type `note`: **MC2 from research.md.** "Native multimodal models are always better than bolt-on." Depends. **Native** (Gemini) has better cross-modal reasoning but costs more to train. **Bolt-on** (LLaVA) benefits from text-LLM advances and is cheaper. **Both are competitive at the frontier**; the architectural choice is a research bet, not a clear win.

**No code in this section.** Architectural overview.

**Connection forward:** Section 5 extends the same recipe to audio.

### Section 5: Audio — Whisper and voice-native models

**Heading:** `## Audio — Whisper and voice-native models`
**Word target:** ~500
**Sub-headings:** `### Whisper`, `### Voice-native models`

**Teaching beats:**

**Whisper** (Radford 2022):
1. **Audio (waveform)** → mel-spectrogram (2D representation: time × frequency)
2. **Encoder** (transformer): processes the spectrogram as a sequence of "audio patches"
3. **Decoder** (transformer): autoregressively generates text tokens

**Training scale**: 680k hours of audio with paired transcripts, scraped from the internet. **Multilingual; robust** to accents, noise, and background music.

**Whisper's value**:
- **Open-source and accurate**: drops in as a transcription layer for any voice product
- **Multitask**: transcription, translation, language ID in one model
- **Robust**: handles noisy, low-quality audio (the dataset was deliberately noisy)

**Voice-native models** (the modern frontier):
- **GPT-4o** (OpenAI, May 2024): natively multimodal (text + audio + vision); voice-native conversation with <500ms latency
- **Gemini Live** (Google, 2024): real-time voice conversation
- **Claude voice** (Anthropic, planned)

**The architectural shift**: previously, voice systems chained `Whisper → LLM → TTS`. **Voice-native models do this end-to-end** — the model takes audio in and produces audio out, with text as an intermediate or skipped entirely.

**Why end-to-end matters**:
- **Latency**: removes serial processing through 3 models
- **Prosody**: end-to-end models can capture tone, emotion, emphasis
- **Interrupts**: natural conversational interrupts work because the model is listening continuously

**Required callout** — type `aside`: **MC4 from research.md.** "Voice-native models are just Whisper + LLM + TTS in one model." Half true. **End-to-end voice-native captures things the pipeline can't**: prosody (tone, emphasis), natural interrupts, sub-word audio cues. **The architectural change is significant**, not cosmetic — the model truly hears, rather than reading transcripts of what it heard.

**No code in this section** (third runnable is in section 6).

**Connection forward:** Section 6 covers retrieval over multimodal corpora.

### Section 6: Multimodal RAG

**Heading:** `## Multimodal RAG`
**Word target:** ~400
**Sub-headings:** `### The extension to non-text`, `### Production patterns`

**Teaching beats:**

**The extension to non-text:**
1. **Image-as-document**: index images alongside text in a shared embedding space (via CLIP); query in either modality; retrieve in either or both
2. **OCR-as-bridge**: for documents with text + figures, OCR the text and chunk normally; use figure metadata for image retrieval

**Use cases**:
- **Visual customer support**: user uploads a photo of a broken product; retrieve relevant manual pages
- **Document QA with figures**: "what does figure 3 show?" → retrieve and present figure 3
- **Brand monitoring**: image + text search across social media

**Required code** — `<RunnableCode>` showing a multimodal RAG sketch:

```python
import numpy as np

# Pretend we have CLIP embeddings for a corpus of images and texts.
# In production: real CLIP forward passes; vector store.

np.random.seed(99)
DIM = 512

corpus = [
    {'kind': 'image', 'id': 'img_cat', 'caption': 'a fluffy orange cat'},
    {'kind': 'image', 'id': 'img_dog', 'caption': 'a black labrador dog'},
    {'kind': 'image', 'id': 'img_car', 'caption': 'a red sports car'},
    {'kind': 'text', 'id': 'txt_cat_care', 'text': 'How to care for an orange tabby cat'},
    {'kind': 'text', 'id': 'txt_dog_train', 'text': 'Training tips for labrador retrievers'},
    {'kind': 'text', 'id': 'txt_car_review', 'text': 'Review of the latest red sports cars'},
]

def mock_clip_embed(descriptor):
    """Mock CLIP embedding: deterministic, biased by content category."""
    seed = sum(ord(c) for c in descriptor)
    rng = np.random.RandomState(seed)
    base = rng.randn(DIM)
    if 'cat' in descriptor.lower():
        base[:5] += 2.0
    if 'dog' in descriptor.lower() or 'labrador' in descriptor.lower():
        base[5:10] += 2.0
    if 'car' in descriptor.lower():
        base[10:15] += 2.0
    return base / np.linalg.norm(base)

# Pre-compute embeddings
for item in corpus:
    descriptor = item.get('caption') or item.get('text')
    item['embedding'] = mock_clip_embed(descriptor)

# Query: text input, retrieve mixed image+text results
query = "tips for taking care of cats"
query_emb = mock_clip_embed(query)

sims = [(item, float(np.dot(query_emb, item['embedding']))) for item in corpus]
sims.sort(key=lambda x: -x[1])

print(f"Query: '{query}'\\n")
print(f"{'Sim':>5} | {'Kind':>5} | {'ID':<18}  {'Content'}")
print('-' * 70)
for item, sim in sims:
    content = item.get('caption') or item.get('text', '')
    print(f"{sim:>5.2f} | {item['kind']:>5} | {item['id']:<18}  {content[:40]}")

# Observations:
# - Top results mix images and text — both are searched in the shared CLIP space
# - "tips for taking care of cats" retrieves both the cat image AND the cat-care text
# - Production multimodal RAG returns both kinds to a VLM for grounded answers
```

**Required callout** — type `warning`: **MC8 from research.md.** "Multimodal RAG is just regular RAG with image embeddings." Half true. **The retrieval-quality profile is different**: noisier, more biased by appearance vs content, less reliable than text retrieval. **Production multimodal RAG often uses text-only retrieval over OCR'd content**, with images surfaced as references — not as the primary retrieval channel. **Treat multimodal embeddings as supplementary, not primary, for high-precision retrieval.**

**Connection forward:** Section 7 ties everything together with computer use.

### Section 7: Computer use as visual agent

**Heading:** `## Computer use as visual agent`
**Word target:** ~400
**Sub-headings:** `### The Ch 21 bridge`, `### The agent loop, with vision`, `### Limitations`

**Teaching beats:**

**The Ch 21 bridge**:
1. **Tool use (Ch 21)**: any function the model can invoke
2. **Computer use**: the function is **operating a computer's UI** via screenshots and input devices
3. **Same agent loop**; just visual observations and motor actions

**The tools become**:
- `computer_screenshot`: capture the screen
- `computer_mouse`: click at (x, y); drag from (x1, y1) to (x2, y2)
- `computer_keyboard`: type text; press keys
- `computer_wait`: pause for animations

**The agent loop, with vision**:
1. **Take a screenshot** (visual observation)
2. **Reason about what to do** (Ch 20 ReAct)
3. **Emit a tool call** (Ch 21 — click here, type that)
4. **Tool executes; new screenshot is the next observation**
5. **Loop until task complete**

**Why this matters**:
- **No custom API integration** — the model can use any application a human can
- **Legacy app automation** — drive desktop software with no API
- **Web automation** — operate browsers visually

**Limitations** (2025):
- **Slow**: ~2-5 seconds per step
- **Error-prone**: misclicks, hallucinated UI elements
- **High-stakes**: a model that operates a computer can do real damage; needs sandboxing

**Required callout** — type `note`: **MC5 from research.md.** "Computer use will automate everything soon." Unlikely. **Computer use is impressive but slow and error-prone** as of 2025. **Production tasks where it works**: web form filling, accessibility testing, repetitive UI workflows. **Tasks where it doesn't work yet**: sub-second latency, high-stakes financial actions, tasks needing deep domain reasoning. **It's a tool in the toolkit, not a universal automator.**

**No code in this section.**

**Connection forward:** Section 8 closes Phase 13 and previews Phase 14.

### Section 8: Closing Phase 13 / opening Phase 14

**Heading:** `## Closing Phase 13 / opening Phase 14`
**Word target:** ~400
**Sub-headings:** `### Phase 13 recap`, `### What's next`

**Teaching beats:**

**Phase 13 recap**:
- **Ch 20 (Reasoning)**: the model can think before answering
- **Ch 21 (Tool use)**: the model can act in the world
- **Ch 22 (RAG)**: the model can retrieve grounded knowledge
- **Ch 23 (Multimodal)**: the model can perceive beyond text

**Together**, these four capabilities turn raw next-token generation into something **closer to a generally-capable digital assistant.** A model that reasons + retrieves + acts + perceives can — in principle — handle most cognitive office-work tasks.

**What Phase 13 doesn't cover**:
- **Are these models safe?** (Ch 24)
- **What's actually happening inside them?** (Ch 25)
- **How do we measure progress?** (Ch 26)

**Phase 14 (Safety, Interpretability, Evaluation)** answers these. The capability arc (Phase 13) and the discipline arc (Phase 14) are **complementary, not sequential** — modern AI labs work on both simultaneously.

**Then Phase 15 (Agents)** composes the capability stack into complete agent architectures.

**Sample close** (rewrite in chapter voice):

> Phase 13 ends here. Reasoning, tool use, retrieval, and multimodal — the four capabilities that turn an LLM from a chat box into something approaching a digital assistant. **By this point in the curriculum, you've seen what modern LLMs can do.** What's left is the harder question of whether they can be trusted.
>
> Phase 14 opens with **safety**: alignment, jailbreaks, refusal calibration, red-teaming. **Then interpretability**: probing models, mechanistic interpretability, sparse autoencoders, circuits. **Then evaluation**: benchmarks, leaderboards, what they measure and what they miss. These three chapters cover the disciplines that turn capable systems into trustworthy ones — and that ultimately determine whether AI safety research keeps pace with AI capability research.
>
> **Phase 15** then assembles the full capability stack into complete agent architectures: ReAct foundations, agents from scratch, multi-agent orchestration, and frontier agent patterns. **The curriculum's final arc.** By the end of Phase 15, the reader will have seen the modern LLM stack end to end — from numpy primitives in Phase 1 through frontier agents in Phase 15.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 23, slug: 'ch23-multimodal', title: 'Multimodal', partNum: 7, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch23-multimodal/index.astro && rm src/pages/ch23-multimodal/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch23-multimodal/`** renders with:
   - Chapter eyebrow ("Chapter 23") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 3, 6)
   - 2 `<WidgetFrame>` placeholders (sections 2 and 3)
   - Labeled equations `<Equation label="23.multimodal-pattern">`, `<Equation label="23.clip-contrastive">`
   - At least 5 callouts (MC1 in section 1, MC2 in section 4, MC4 in section 5, MC8 in section 6, MC5 in section 7 — pick 5)
3. **Sidebar:** Ch 1-22 published; Ch 23 active (draft); Ch 24-30 dimmed
4. **Prev/next nav at bottom of Ch 23:** prev = Ch 22 (active); next = Ch 24 (disabled)
5. **TOC on Ch 23** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3500 and 4200 words
7. **`npm run typecheck`** passes
8. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 132 and 133 own them.
- ❌ **Do not write exercises.** Session 133 owns.
- ❌ **Do not flip Ch 23's status to `'published'`.** Session 133 owns.
- ❌ **Do not enumerate every frontier VLM release.** The landscape moves too fast for an exhaustive list.
- ❌ **Do not derive attention again.** Ch 4 covers it; this chapter only mentions the ViT bridge.
- ❌ **Do not tutorial Whisper internals.** Concept-level; engineers can find docs.
- ❌ **Do not deep-dive computer-use API specifics.** That's Anthropic-product-specific.
- ❌ **Do not modify Ch 1-22.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch23-multimodal/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch23-multimodal/index.astro 2>/dev/null || true
git commit -m "session 103: Ch 23 prose — multimodal (closes Phase 13 capability arc)"
git push origin main
```

---

## Notes for the session author

**On the unifying-pattern framing:**
The chapter's central technical claim is in section 1's equation: `modality → tokenizer → token sequence → transformer → output`. **Every other section in the chapter is an instance of this pattern.**

- Section 2 (ViT): image → patches → tokens
- Section 3 (CLIP): aligning two modalities' tokens in a shared space
- Section 5 (audio): waveform → spectrogram → patches → tokens
- Section 6 (multimodal RAG): retrieval over the shared space
- Section 7 (computer use): vision tokens as observations in an agent loop

Notes-for-author: "**The unifying pattern is the chapter's spine.** Every section should explicitly tie back to 'this is what tokenization looks like for THIS modality.'"

**On Phase 13's tonal closer:**
This chapter has a dual role: **deliver multimodal content** AND **close Phase 13's capability arc.** Section 8 should feel like a satisfying chapter close — and a satisfying phase close. The phrase "**the four capabilities — reasoning, tool use, retrieval, multimodal**" should appear together, framing what Phase 13 covered.

Notes-for-author: "**Section 8 carries emotional weight.** The reader has invested through 23 chapters; the arc is closing. Honor that with a closing that frames Phase 13 as a complete unit and previews what comes next."

**On the rapid-evolution honesty:**
Multimodal is moving fast. **Name today's frontier models** (GPT-4V/4o, Claude vision, Gemini, LLaVA) but **don't promise the list is current.** The chapter should be evergreen enough to age gracefully.

Notes-for-author: "**Treat the frontier landscape as snapshots.** Use phrases like 'as of 2025' / 'recent variants' / 'the landscape continues to evolve.' Engineers reading this in 2026 will recognize the patterns even if model names change."

**On the CLIP marquee placement (section 3):**
The CLIP shared embedding space is the chapter's most conceptually elegant idea. **The marquee belongs there.** Reader sees image and text embeddings cluster by content. Pedagogically: the bridge from "images and text are separate things" to "images and text live in the same space" is the key conceptual move.

**On the ViT secondary placement (section 2):**
The ViT patch tokenization is mechanically interesting and hands-on. **Reader benefits from clicking patches and seeing what they become.** Secondary placement keeps the chapter's flow (section 2 sets up the mechanism; section 3 shows what you can do with it).

**On the 3 runnable code blocks**:
- **Section 2 (ViT patch embed)**: shows the image → token transformation in numpy
- **Section 3 (CLIP contrastive)**: shows the similarity matrix and the loss
- **Section 6 (multimodal RAG)**: shows mixed image+text retrieval via shared embeddings

**These three runnables form a complete tokenize → align → retrieve story.** Reader sees the multimodal stack in code.

**On computer use as the Phase 13 convergence point:**
Section 7 ties together:
- **Vision** (this chapter) — perceive the screen
- **Reasoning** (Ch 20) — decide what to do
- **Tool use** (Ch 21) — operate the mouse/keyboard
- **Retrieval** (Ch 22) — could augment with documentation lookup

Notes-for-author: "**Section 7 is where the four Phase 13 capabilities meet.** Reader sees that computer use isn't a new technique — it's the *convergence* of the previous three chapters. This is the chapter's most satisfying connection."

**Pedagogical claim of the chapter:**
"Multimodal extends LLMs beyond text by tokenizing other modalities — images via patch embedding (ViT), audio via spectrograms (Whisper). CLIP's contrastive training creates a shared image-text embedding space, the foundation for modern VLMs (LLaVA, GPT-4V, Claude vision, Gemini) and multimodal RAG. Voice-native models (GPT-4o, Gemini Live) handle audio end-to-end. Computer use closes the loop: vision + reasoning + tool use = a visual agent. **The unifying pattern: any modality, tokenized, becomes input to the same transformer architecture.** With Ch 23 complete, Phase 13's capability arc closes — reasoning, tool use, retrieval, and perception."

**Phase 13 progress after this session**: Ch 20 ✅, Ch 21 ✅, Ch 22 ✅, Ch 23 (in progress). **One file remains** in Phase 13: closing Ch 23, then Phase 13 is done.

Build with care.
