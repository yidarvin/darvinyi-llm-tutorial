# Chapter 23 — Multimodal: research

> Curated source material for Chapter 23's build sessions. **The chapter that takes LLMs beyond text — and closes Phase 13.** Where reasoning (Ch 20) gave the model time to think, tool use (Ch 21) gave it the ability to act, and RAG (Ch 22) gave it grounded knowledge, **multimodal extends all three across images, audio, and video.** Vision Transformers (ViT) — how images become tokens. CLIP — how image and text get aligned in a shared embedding space. Modern vision-language models — LLaVA, GPT-4V, Claude with vision, Gemini. Audio understanding — Whisper and voice-native models. Multimodal RAG. Computer use as visual agent (the Ch 21 bridge). **Single-topic chapter**; uses the **4-file cadence**. **The chapter that closes the capability arc — and sets up the disciplines of Phase 14 (Safety, Interp, Eval).**

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Multimodal

**Premise:** Most of the world isn't text. Images, audio, video, screenshots, charts, faces, voices — these carry vast information that text alone can't represent. **Multimodal models extend the language-model framework to non-text inputs and outputs.** The core technical question: **how do you turn a non-text modality into something a transformer can process?** The answer for vision: chop the image into patches, embed each patch as a "visual token," let the transformer handle the rest. The answer for audio: spectrogram → patches → tokens. The recipe generalizes.

**The unifying pattern**: any modality can be tokenized into a vector sequence; once tokenized, a transformer doesn't care whether the tokens came from text, an image, or audio. **This is why multimodal is conceptually simple but engineering-heavy** — the transformer is the same; the tokenization layer is what changes.

**Out of scope (other chapters):**
- Image generation (DALL-E, Stable Diffusion) — generation is a different problem
- Video generation (Sora) — same
- Deep dives on speech synthesis — voice output is briefly mentioned
- Safety of multimodal models (Ch 24 — biases, jailbreaks)
- Evaluation of multimodal models in depth (Ch 26)

**In scope and locked:**
- **Vision Transformers (ViT)**: how images become tokens via patch embedding
- **CLIP**: contrastive image-text alignment; shared embedding space
- **Vision-language models** (modern VLMs): LLaVA, GPT-4V, Claude vision, Gemini
- **Audio**: Whisper (transcription); voice-native models (Gemini Live, Realtime)
- **Multimodal RAG**: retrieving images alongside text
- **Computer use**: screenshots as visual input; visual agents (Ch 21 bridge)
- **Modality-specific failure modes**: OCR drift, audio noise, image bias

**Suggested chapter structure** (8 sections):

1. Why multimodal matters (~400 words)
2. Vision Transformers — images as tokens (~600 words)
3. CLIP — aligning image and text (~500 words)
4. Modern vision-language models (~600 words)
5. Audio: Whisper and voice-native models (~500 words)
6. Multimodal RAG (~400 words)
7. Computer use as visual agent (~400 words)
8. Closing Phase 13 / opening Phase 14 (~400 words)

Target: ~3800 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Dosovitskiy et al. 2020 — "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale"
- **arXiv:** [2010.11929](https://arxiv.org/abs/2010.11929)
- **What it contributed:** **Vision Transformer (ViT)** — the paper that showed transformers can replace CNNs for image classification. **Chop the image into 16×16 pixel patches; treat each patch as a token; run a standard transformer.** Established that the transformer architecture isn't tied to language; it works on any tokenizable modality. **The foundational vision paper for multimodal LLMs.**
- **For the chapter:** central reference for section 2.

### Radford et al. 2021 — "Learning Transferable Visual Models From Natural Language Supervision" (CLIP)
- **arXiv:** [2103.00020](https://arxiv.org/abs/2103.00020)
- **What it contributed:** **CLIP** — contrastively train an image encoder and a text encoder so paired (image, caption) embeddings are close in cosine space and unpaired ones are far. **The shared image-text embedding space.** Enabled zero-shot image classification, text-to-image search, and became the visual encoder for many later multimodal LLMs.
- **For the chapter:** central reference for section 3.

### Alayrac et al. 2022 — "Flamingo: a Visual Language Model for Few-Shot Learning"
- **arXiv:** [2204.14198](https://arxiv.org/abs/2204.14198)
- **What it contributed:** **Flamingo** — DeepMind's vision-language model that **interleaves images and text** in a single token sequence. Demonstrated few-shot visual question-answering. **A bridge between vision encoders and language models.**

### Liu et al. 2023 — "Visual Instruction Tuning" (LLaVA)
- **arXiv:** [2304.08485](https://arxiv.org/abs/2304.08485)
- **What it contributed:** **LLaVA** — a simple, effective recipe for visual instruction tuning. **Connect a CLIP vision encoder to an LLM via a projection layer**; instruction-tune on visual question-answering data. **The reference architecture for open-source VLMs.**
- **For the chapter:** section 4.

### OpenAI 2023 — "GPT-4V(ision) System Card"
- **URL:** [openai.com/research/gpt-4v-system-card](https://openai.com/research/gpt-4v-system-card)
- **What it contributed:** **GPT-4V** — the first frontier commercial vision-language model. Image input alongside text; broad visual capabilities (captioning, OCR, reasoning over diagrams). Set the bar for commercial VLM products.

### Anthropic 2024 — "Claude 3 family"
- **URL:** [anthropic.com/news/claude-3-family](https://www.anthropic.com/news/claude-3-family)
- **What it contributed:** **Claude 3 with vision** — full multimodal capabilities at the frontier. Reads documents, diagrams, screenshots; reasons over visual content. **A modern production reference for vision-language understanding.**

### Google 2023 — "Gemini: A Family of Highly Capable Multimodal Models"
- **arXiv:** [2312.11805](https://arxiv.org/abs/2312.11805)
- **What it contributed:** **Gemini** — Google's multimodal model trained natively on text, images, audio, and video together. Argued for **native multimodality** (single architecture) over post-hoc adaptation (LLM + bolted-on vision encoder).

### Radford et al. 2022 — "Robust Speech Recognition via Large-Scale Weak Supervision" (Whisper)
- **arXiv:** [2212.04356](https://arxiv.org/abs/2212.04356)
- **What it contributed:** **Whisper** — OpenAI's open-source speech-to-text model. Encoder-decoder transformer trained on 680k hours of audio. **The reference open-source ASR (Automatic Speech Recognition) model.** Robust across accents, noise, and languages.
- **For the chapter:** section 5.

### Anthropic 2024 — "Introducing computer use"
- **URL:** [anthropic.com/news/3-5-models-and-computer-use](https://www.anthropic.com/news/3-5-models-and-computer-use)
- **What it contributed:** **Computer use** — Claude 3.5 Sonnet operating a desktop via screenshots + mouse + keyboard. **The convergence of vision + tool use + reasoning.** Frontier capability bridging Ch 21 (tool use) and this chapter.
- **For the chapter:** section 7.

### Bai et al. 2023 — "Qwen-VL: A Versatile Vision-Language Model"
- **arXiv:** [2308.12966](https://arxiv.org/abs/2308.12966)
- **What it contributed:** strong open-source VLM with OCR, grounding (object localization), and multilingual support. Mentioned for breadth of VLM landscape.

### OpenAI 2024 — "GPT-4o"
- **URL:** [openai.com/index/hello-gpt-4o](https://openai.com/index/hello-gpt-4o)
- **What it contributed:** **GPT-4o** — natively multimodal model (text + audio + vision in one). **Voice-native conversation** with low latency. Showed multimodal is moving beyond bolted-on vision toward unified architectures.

---

## Core concepts

### Concept 1: Why multimodal matters

**The unstated assumption** of text-only LLMs: the world is describable in text. **It mostly isn't.** Documents have layout; diagrams have spatial structure; voices carry tone; videos have motion; charts have geometry. **Text-only models can describe these things post-hoc, but they can't directly perceive them.**

**What multimodal unlocks:**
1. **Document understanding** — read PDFs with figures, tables, formulas
2. **Diagram and chart reasoning** — answer questions about a visual
3. **Image search and tagging** — text → image / image → text
4. **Voice interfaces** — conversational AI that actually listens
5. **Computer use** — agents that can see their environment (Ch 21 bridge)
6. **Accessibility** — describe images to visually impaired users
7. **Robotics and embodied AI** — perception-action loops

**The unifying technical pattern**:

```mdx
<Equation label="23.multimodal-pattern">
$$\text{modality} \;\xrightarrow{\text{tokenizer}}\; \text{token sequence} \;\xrightarrow{\text{transformer}}\; \text{output}$$
</Equation>
```

**Once a modality is tokenized, the transformer treats it like any other sequence.** The novelty is the tokenizer; the architecture isn't new.

**Empirical scale (early 2025)**:
- **VLM input**: typically a few hundred to a few thousand visual tokens per image (depends on resolution)
- **Multimodal context**: 100K-1M tokens for video understanding (sequences of frames)
- **Voice latency**: GPT-4o and Gemini Live target <500ms end-to-end for spoken conversation
- **Quality**: frontier VLMs match or exceed humans on many visual QA benchmarks (VQAv2, MMLU-Image)

### Concept 2: Vision Transformers — images as tokens

**The Vision Transformer (ViT)** (Dosovitskiy 2020) is the foundational idea: treat an image as a sequence of patches.

**The recipe:**
1. **Take an image** (e.g., 224×224 pixels, RGB)
2. **Split it into patches** (e.g., 16×16 pixels each → 196 patches total)
3. **Flatten each patch** into a vector (16×16×3 = 768 values per patch)
4. **Linearly project** each flat patch to a fixed embedding dimension (e.g., 768-dim)
5. **Add a positional encoding** (which patch is where in the image)
6. **Prepend a `[CLS]` token** for global representation
7. **Feed the sequence into a standard transformer**

The transformer's output for the `[CLS]` token is a representation of the whole image; per-patch outputs represent regions.

**The remarkable claim**: a transformer with no convolutions, trained on enough data, **matches or exceeds CNNs** on image classification. The bias toward locality that CNNs hard-code (convolutions look at nearby pixels) can be learned from data instead.

**Patch size tradeoffs**:
- **Smaller patches** (8×8): more tokens; finer-grained; more compute
- **Larger patches** (32×32): fewer tokens; coarser; less compute
- **Standard**: 14×14 or 16×16 for 224-resolution images

**Number of tokens per image** (rough):
- 224×224 with 16×16 patches → 196 visual tokens
- 336×336 with 14×14 patches → 576 visual tokens (LLaVA default)
- 1024×1024 with 16×16 patches → 4096 visual tokens (high-detail)

**Tokens scale quadratically with resolution**; high-resolution VLM input is expensive.

### Concept 3: CLIP — aligning image and text

**CLIP** (Radford 2021) is the foundational idea: train an image encoder and a text encoder **jointly**, so that paired (image, caption) embeddings end up close in cosine space.

**The training setup:**
1. **Image encoder**: ViT (or CNN) → 512 or 768-dim embedding
2. **Text encoder**: small transformer → same-dim embedding
3. **Contrastive loss**: for a batch of N (image, caption) pairs, the N×N cosine similarity matrix should be the identity (paired pairs at high sim; unpaired at low)

```mdx
<Equation label="23.clip-contrastive">
$$\mathcal{L}_{\text{CLIP}} = -\frac{1}{2}\left[\frac{1}{N}\sum_{i} \log \frac{\exp(s_{ii} / \tau)}{\sum_j \exp(s_{ij} / \tau)} + \frac{1}{N}\sum_{j} \log \frac{\exp(s_{jj} / \tau)}{\sum_i \exp(s_{ij} / \tau)}\right]$$
</Equation>
```

where $s_{ij} = \cos(\mathbf{e}^I_i, \mathbf{e}^T_j)$ is the cosine similarity between image $i$ and text $j$, and $\tau$ is a learnable temperature.

**What this does:**
- **Pulls together** paired (image, caption) embeddings
- **Pushes apart** unpaired ones
- After training, images and texts about the same thing live in nearby regions of the shared space

**Why CLIP matters:**
- **Zero-shot classification**: classify images by comparing to class-name embeddings ("a photo of a cat", "a photo of a dog", ...) — no labeled training needed
- **Text-to-image search**: query text → search image vector store
- **Image-to-text search**: query image → search text corpus
- **Vision encoder for VLMs**: CLIP's image encoder is the most common visual encoder used in modern VLMs (LLaVA, GPT-4V style architectures)

**Training scale**: CLIP was trained on 400M (image, caption) pairs scraped from the web. Modern variants use up to 5B+ pairs (LAION, DataComp).

### Concept 4: Modern vision-language models (VLMs)

**The architectural pattern** (LLaVA-style, the open-source default):

```
image → CLIP vision encoder → visual tokens → projection → LLM
                                                ↑
                                          text tokens
```

**Step-by-step:**
1. **Pre-trained vision encoder** (typically CLIP-ViT-L) embeds the image → ~576 visual tokens
2. **Linear projection** (or small MLP) maps visual tokens to the LLM's embedding dimension
3. **Concatenate** with text tokens (e.g., `<image_tokens> What is in this image?`)
4. **LLM generates** the response autoregressively

**Training stages** (LLaVA recipe):
- **Stage 1**: freeze vision encoder + LLM; train only the projection layer on caption data
- **Stage 2**: unfreeze the LLM; fine-tune on visual instruction-tuning data (VQA pairs, image-conditioned chat)

**The frontier VLMs** (2024-2025):
- **GPT-4V / GPT-4o** (OpenAI): broad visual capabilities; OCR; chart reasoning
- **Claude 3.5 / 4 with vision** (Anthropic): strong document understanding; computer use
- **Gemini 1.5 / 2.0** (Google): **native multimodal** — trained on text + images + audio + video together from the start
- **Open-source**: LLaVA, Qwen-VL, InternVL, Pixtral

**Architectural variants**:
- **Bolt-on** (LLaVA-style): vision encoder + projector + frozen LLM
- **Cross-attention** (Flamingo-style): text tokens attend to visual tokens via cross-attention layers
- **Native** (Gemini-style): single architecture with mixed-modality tokens

**Native multimodality vs bolt-on tradeoffs**:
- **Bolt-on**: cheaper to train; benefits from text-LLM advances
- **Native**: better cross-modal reasoning; higher cost to train

### Concept 5: Audio — Whisper and voice-native models

**Whisper** (Radford 2022) is the foundational open-source ASR (Automatic Speech Recognition) model:

**The pipeline:**
1. **Audio (waveform)** → mel-spectrogram (a 2D representation: time × frequency)
2. **Encoder** (transformer): processes the spectrogram as a sequence of "audio patches"
3. **Decoder** (transformer): autoregressively generates text tokens

**Training scale**: 680k hours of audio with paired transcripts, scraped from the internet. Multilingual; robust to accents, noise, and background music.

**Whisper's value**:
- **Open-source and accurate**: drops in as a transcription layer for any voice product
- **Multitask**: same model does transcription, translation, language ID
- **Robust**: handles noisy, low-quality audio (the dataset was deliberately noisy)

**Voice-native models** (the modern frontier):
- **GPT-4o** (OpenAI, May 2024): natively multimodal (text + audio + vision); voice-native conversation with <500ms latency
- **Gemini Live** (Google, 2024): real-time voice conversation with the model
- **Claude (voice)** (Anthropic, planned): voice input/output through similar architectures

**The architectural shift**: previously, voice systems chained Whisper → LLM → TTS (text-to-speech). **Voice-native models do this end-to-end** — the model takes audio in and produces audio out, with text as an intermediate or skipped entirely.

**Why end-to-end matters**:
- **Latency**: removes serial processing through 3 models
- **Prosody**: end-to-end models can capture tone, emotion, emphasis
- **Interrupts**: natural conversational interrupts work because the model is listening continuously

### Concept 6: Multimodal RAG

**The extension of Ch 22's RAG to non-text modalities:**

**Image-as-document RAG:**
- Index images alongside text in a shared embedding space (via CLIP)
- Query: text → retrieve relevant images
- Or: image → retrieve relevant documents
- Pass retrieved images to a VLM for grounded answers

**OCR-as-bridge** (the most common pattern):
- For documents with text + figures (papers, slides), OCR the text and chunk normally; use figure metadata for image retrieval
- Best of both: text retrieval for textual queries; image retrieval when image content matters

**Multimodal embeddings**:
- **CLIP**: text and image in shared 512-dim space (covered in concept 3)
- **EmbeddingV3 / Voyage Multimodal**: production multimodal embedding models (2024)
- **Multimodal e5**: open-source multimodal embedding

**Use cases**:
- **Visual customer support**: user uploads a photo of a broken product; retrieve relevant manual pages
- **Document QA with figures**: "what does figure 3 show?" → retrieve and present figure 3
- **Brand monitoring**: image + text search across social media

**Challenges**:
- **Modality drift**: text and image queries often have different precision/recall profiles
- **Embedding quality**: open-source multimodal embeddings still lag behind text-only at fine-grained semantic distinctions
- **Cost**: indexing images is more expensive (CLIP forward pass per image)

### Concept 7: Computer use as visual agent

**The Ch 21 bridge**:
Tool use (Ch 21) generalized to: any function the model can invoke. **Computer use** (Anthropic 2024) generalizes that further: the function is **operating a computer's UI** via screenshots and input devices.

**The tools become**:
- **`computer_screenshot`**: capture the screen
- **`computer_mouse`**: click at (x, y); drag from (x1, y1) to (x2, y2)
- **`computer_keyboard`**: type text; press keys
- **`computer_wait`**: pause for animations

**The agent loop** (Ch 21 pattern, with vision):
1. **Take a screenshot** (visual observation)
2. **Reason about what to do** (Ch 20 ReAct)
3. **Emit a tool call** (Ch 21 — click here, type that)
4. **Tool executes; new screenshot is the next observation**
5. **Loop until task complete**

**Why this matters**:
- **No custom API integration** needed — the model can use any application a human can use
- **Legacy app automation** — drive desktop software that has no API
- **Web automation** — operate browsers visually

**Limitations** (as of 2025):
- **Slow**: each step requires a screenshot + model call + action (~2-5 seconds)
- **Error-prone**: misclicks, hallucinated UI elements
- **High-stakes**: a model that can operate a computer can do real damage; needs careful sandboxing
- **Latency budget**: most useful for tasks where a human would also be slow (filling forms, navigating UIs)

**Frontier (2025)**: computer use is rapidly improving; latency and accuracy both dropping. **Production deployments** exist for QA automation, web scraping, and accessibility tooling.

### Concept 8: Closing Phase 13 / opening Phase 14

**Phase 13 recap**:
- **Ch 20 (Reasoning)**: the model can think before answering
- **Ch 21 (Tool use)**: the model can act in the world
- **Ch 22 (RAG)**: the model can retrieve grounded knowledge
- **Ch 23 (Multimodal)**: the model can perceive beyond text

**Together**, these four capabilities turn raw next-token generation into something **closer to a generally-capable digital assistant**. A model that reasons + retrieves + acts + perceives can — in principle — handle most cognitive office-work tasks.

**What Phase 13 doesn't cover**:
- **Are these models safe?** (Ch 24)
- **What's actually happening inside them?** (Ch 25)
- **How do we measure progress?** (Ch 26)

**Phase 14 (Safety, Interp, Eval)** answers these. The capability arc (Phase 13) and the discipline arc (Phase 14) are **complementary, not sequential** — modern AI labs work on both simultaneously.

**Then Phase 15 (Agents)** composes the capability stack into complete agent architectures.

---

## Glossary

- **ViT**: Vision Transformer; treats images as sequences of patches
- **Patch**: a small region of an image (e.g., 16×16 pixels), turned into one visual token
- **Visual token**: the embedding of a patch
- **CLIP**: contrastive image-text pretraining; produces a shared embedding space
- **VLM**: Vision-Language Model
- **Bolt-on / native multimodal**: post-hoc adapter vs joint pretraining
- **Cross-attention**: text attends to visual tokens (Flamingo)
- **Whisper**: open-source ASR (audio → text)
- **ASR**: Automatic Speech Recognition
- **Voice-native**: models that handle audio in/out end-to-end
- **Mel-spectrogram**: 2D audio representation; input format for Whisper
- **Multimodal RAG**: retrieval over corpora that include images and text
- **Computer use**: agent that operates a computer via vision + mouse + keyboard
- **OCR**: Optical Character Recognition; extract text from images
- **Grounding**: localizing references (e.g., "the red car") to image regions

---

## Pedagogical analogies

### 1. Vision Transformers as reading an image left-to-right
Text is processed left-to-right by transformers; ViT processes images patch-by-patch in raster order. **An image is just a long sequence of "visual words."** The transformer doesn't know the difference between a text token and a visual token — both are just vectors.

Best used for: section 2.

### 2. CLIP as a translator between languages
A bilingual dictionary lets you look up "cat" in English and find "gato" in Spanish. **CLIP is a bilingual dictionary between images and text** — both modalities map to a shared embedding space; similar concepts in either language end up nearby.

Best used for: section 3.

### 3. VLMs as a language model wearing glasses
A language model is fluent in text. Hook up a vision encoder, and it gets visual perception too. **The glasses (vision encoder) translate the visual world into the language the LLM already speaks** — vectors.

Best used for: section 4.

### 4. Whisper as the ear of an LLM
Whisper turns sound into text. **It's the ear that feeds the brain.** Modern voice-native models (GPT-4o, Gemini Live) skip the intermediate text — they have ears and mouths instead of needing translation layers.

Best used for: section 5.

### 5. Computer use as putting a model into a remote-control body
Tool use (Ch 21) gave the model arms — it could call APIs. **Computer use gives it eyes and full-body control** — it can see its environment and operate any app a human can. Slow and clumsy today, but improving fast.

Best used for: section 7.

---

## Common misconceptions

### MC1: "Multimodal is fundamentally different from text-only."
**Reality:** false. The transformer architecture is identical. **The only difference is the tokenizer** — text uses BPE; images use ViT patches; audio uses spectrogram patches. **Once tokenized, the transformer doesn't know the difference.**

### MC2: "Native multimodal models are always better than bolt-on."
**Reality:** depends. **Native** (Gemini-style) has better cross-modal reasoning but costs more to train. **Bolt-on** (LLaVA-style) benefits from text-LLM advances and is cheaper. **Both are competitive at the frontier**; the architectural choice is a research bet, not a clear win.

### MC3: "VLMs can read any text in any image."
**Reality:** false. **OCR is hard.** VLMs handle clear text in good lighting reasonably well, but struggle with: handwriting, low resolution, complex layouts (multi-column documents, tables), non-Latin scripts, artistic fonts. **Dedicated OCR (Google Vision, Mathpix) is still better for text-heavy documents.**

### MC4: "Voice-native models are just Whisper + LLM + TTS in one model."
**Reality:** half true. **End-to-end voice-native** captures things the pipeline can't: prosody (tone, emphasis), natural interrupts, sub-word audio cues. **The architectural change is significant**, not cosmetic.

### MC5: "Computer use will automate everything soon."
**Reality:** unlikely. **Computer use is impressive but slow and error-prone** as of 2025. **Production tasks where it works**: web form filling, accessibility testing, repetitive UI workflows. **Tasks where it doesn't work**: anything requiring sub-second latency; high-stakes financial or safety-critical actions; tasks needing deep domain reasoning. **It's a tool in the toolkit, not a universal automator.**

### MC6: "All multimodal models can understand video."
**Reality:** mostly false (as of early 2025). **Most VLMs process single images** or short sequences (a few keyframes). **True video understanding** (motion, temporal reasoning) is an active research area; Gemini 1.5/2.0 have the longest video context (millions of tokens); but reliable long-video understanding is still emerging.

### MC7: "Multimodal models hallucinate the same way text models do."
**Reality:** false in important ways. **Vision hallucinations** are weirder: objects that aren't there; misreading numbers in charts; making up text in images; conflating similar-looking entities. **Faithfulness to visual content is a distinct evaluation problem.** RAG-style attribution helps; specialized eval (POPE, etc.) exists.

### MC8: "Multimodal RAG is just regular RAG with image embeddings."
**Reality:** half true. **Image embeddings let you retrieve images**, but **the retrieval-quality profile is different**: noisier, more biased by appearance vs content, less reliable than text retrieval. **Production multimodal RAG often uses text-only retrieval over OCR'd content**, with images surfaced as references — not as the primary retrieval channel.

---

## Tricky implementation details

### TID1: Image resolution vs token count tradeoff
Higher resolution = more visual tokens = more context cost. **224×224 input** is the common ViT default (~196 tokens). **High-detail OCR** wants 1024×1024 or higher (~4000+ tokens), which dominates the context window. **Production VLMs** often use adaptive resolution — high for OCR-heavy queries; low for general image understanding.

### TID2: Patch ordering and positional encoding
ViT uses **2D positional encodings** (or 1D over raster-flattened patches). **A patch at the top-left vs bottom-right of an image carries different positional information.** Get this wrong and the model loses spatial reasoning.

### TID3: CLIP temperature is learnable
The CLIP loss has a temperature $\tau$ that scales the cosine similarities before softmax. **$\tau$ is a learned parameter** (not a hyperparameter). Initialization and clipping during training matter — too low and gradients explode; too high and the loss is too smooth.

### TID4: Multimodal context budget management
Each image consumes ~500-4000 tokens. **A multi-image conversation can easily blow past 100K tokens.** Production VLMs need: dynamic resolution; image compression; selective re-embedding for repeated images.

### TID5: Visual instruction tuning data
**LLaVA's data recipe** used GPT-4 (text-only) to generate visual QA pairs from image captions. **The visual content isn't directly used to generate training data** — the captions are. This is a clever but lossy approach; more recent VLMs use visual instruction data generated *with* visual context.

### TID6: Audio sample rate and pre-processing
Whisper expects **16kHz mono audio**. Wrong sample rate = garbage output. The mel-spectrogram is computed with specific FFT parameters; pre-processing must match training.

### TID7: Voice-native model interrupt handling
Real-time voice models stream audio in and out simultaneously. **Detecting when the user wants to interrupt** the model (vs background noise, breaths) is non-trivial. Production systems use voice activity detection (VAD) + heuristics + model confidence.

### TID8: Computer use coordinate systems
Screenshots have pixel coordinates; mouse clicks have pixel coordinates; but **DPI scaling can cause mismatches** (a "1024×768 screen" might render at 2048×1536 on a Retina display). Production computer-use agents normalize coordinates carefully.

### TID9: Image format and compression
JPEG compression artifacts can hurt OCR. **Lossless formats (PNG)** are better for text-heavy images; **lossy (JPEG)** is fine for natural photos. **Some VLM APIs auto-compress** uploaded images; be aware of this when OCR matters.

### TID10: Multilingual visual content
VLMs trained primarily on English image-caption pairs handle non-English text in images poorly. **CLIP** has known biases toward Western/English content. Multilingual VLMs (Qwen-VL, InternVL) help but still lag behind on low-resource languages.

---

## Reference implementations

### ViT patch tokenization (showing the patch-embed concept)

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
    n_patches = n_patches_h * n_patches_w   # 196
    
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
    
    # Step 3: Add positional encoding (sinusoidal or learned)
    pos_encoding = np.random.randn(n_patches, embed_dim) * 0.02  # placeholder
    embeddings = embeddings + pos_encoding
    
    return embeddings

# Demo: random 224x224 image
np.random.seed(42)
image = np.random.rand(224, 224, 3) * 255

tokens = patch_embed_image(image)
print(f"Input image shape:  {image.shape}")
print(f"Visual tokens shape: {tokens.shape}")
print(f"Number of tokens:    {tokens.shape[0]}  (= 14×14 patches)")
print(f"Each patch flattens to: {16*16*3} values, projected to {tokens.shape[1]}-dim")

# Observations:
# - An image becomes a token sequence; (196, 768) is the same shape a text encoder
#   would produce for a 196-token sentence with 768-dim embeddings
# - The transformer following this layer doesn't know it's processing an image
# - Patch ordering matters; positional encodings preserve spatial relationships
```

### CLIP contrastive scoring (the core idea, simplified)

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

# Print the similarity matrix
print(f"Image-to-text similarity matrix (diagonal should be highest):\\n")
print(f"{'':>10}", " ".join(f"text_{j}" for j in range(N)))
for i in range(N):
    row = sim_matrix[i]
    print(f"image_{i}:  ", " ".join(f"{v:>6.2f}" for v in row))

# Compute the contrastive loss (image-to-text direction)
# For each image, the correct text is at index i; loss is -log softmax
temperature = 0.07
logits = sim_matrix / temperature
log_probs = logits - np.log(np.exp(logits).sum(axis=1, keepdims=True))
loss_i2t = -np.mean([log_probs[i, i] for i in range(N)])
print(f"\\nImage-to-text contrastive loss: {loss_i2t:.4f}")
print(f"(Lower is better; perfect alignment → 0)")

# Observations:
# - The diagonal of the similarity matrix should be highest (paired image-text)
# - Off-diagonal (unpaired) should be lower
# - CLIP training nudges all unpaired pairs down and all paired pairs up
# - Temperature controls how peaky the softmax is; learned in CLIP
```

### Multimodal RAG: image and text retrieval (sketch)

```python
import numpy as np

# Pretend we have CLIP embeddings for a corpus of images and texts in a shared space.
# In production: real CLIP forward passes; vector store.

np.random.seed(99)
DIM = 512

# A small corpus: 3 images, 3 texts (with paired semantic content)
corpus = [
    {'kind': 'image', 'id': 'img_cat', 'caption': 'a fluffy orange cat'},
    {'kind': 'image', 'id': 'img_dog', 'caption': 'a black labrador dog'},
    {'kind': 'image', 'id': 'img_car', 'caption': 'a red sports car'},
    {'kind': 'text', 'id': 'txt_cat_care', 'text': 'How to care for an orange tabby cat'},
    {'kind': 'text', 'id': 'txt_dog_train', 'text': 'Training tips for labrador retrievers'},
    {'kind': 'text', 'id': 'txt_car_review', 'text': 'Review of the latest red sports cars'},
]

# Mock CLIP embeddings (paired by semantic content)
def mock_clip_embed(text_or_image_descriptor):
    """Returns a deterministic embedding biased by content category."""
    seed = sum(ord(c) for c in text_or_image_descriptor)
    rng = np.random.RandomState(seed)
    base = rng.randn(DIM)
    # Bias by category
    if 'cat' in text_or_image_descriptor.lower():
        base[:5] += 2.0
    if 'dog' in text_or_image_descriptor.lower() or 'labrador' in text_or_image_descriptor.lower():
        base[5:10] += 2.0
    if 'car' in text_or_image_descriptor.lower():
        base[10:15] += 2.0
    return base / np.linalg.norm(base)

# Pre-compute embeddings
for item in corpus:
    descriptor = item.get('caption') or item.get('text')
    item['embedding'] = mock_clip_embed(descriptor)

# Query: text input, retrieve mixed image+text results
query = "tips for taking care of cats"
query_emb = mock_clip_embed(query)

# Cosine similarity to each item
sims = [(item, float(np.dot(query_emb, item['embedding']))) for item in corpus]
sims.sort(key=lambda x: -x[1])

print(f"Query: '{query}'\\n")
print(f"{'Sim':>5} | {'Kind':>5} | {'ID':<20}  {'Content'}")
print('-' * 80)
for item, sim in sims:
    content = item.get('caption') or item.get('text', '')
    print(f"{sim:>5.2f} | {item['kind']:>5} | {item['id']:<20}  {content[:50]}")

# Observations:
# - Top results mix images and text — both are searched in the shared CLIP space
# - "tips for taking care of cats" retrieves both the cat image and the cat-care text
# - Production multimodal RAG returns both kinds of results to a VLM for grounded answers
```

---

## Connections to other chapters

- **Ch 2 (Tokenization)**: ViT patch tokenization is the visual analog of BPE
- **Ch 4 (Transformer architecture)**: ViT uses the same transformer blocks; only the embedding layer changes
- **Ch 6 (Positional encodings)**: ViT uses 2D positional encodings; the principle is the same
- **Ch 19 (Sampling)**: VLM outputs use the same sampling techniques as text-only LLMs
- **Ch 20 (Reasoning)**: VLMs can reason — CoT works on visual inputs too
- **Ch 21 (Tool use)**: computer use is the canonical multimodal tool — Ch 23 ties back here
- **Ch 22 (RAG)**: multimodal RAG extends what Ch 22 covered to images and audio
- **Ch 24 (Safety)**: VLM jailbreaks via images; bias in visual training data
- **Ch 25 (Interp)**: probing what visual features ViT learns
- **Ch 26 (Eval)**: multimodal benchmarks (VQAv2, MMLU-Image, POPE)
- **Ch 27-30 (Agents)**: agents combining vision + reasoning + tool use + retrieval are the modern frontier

---

## Open questions for the chapter author

### Q1: How much math for ViT?
**Recommendation:** moderate. Show the patch-embedding equation; reference positional encoding from Ch 6. Don't derive attention again (Ch 4).

### Q2: How much CLIP math?
**Recommendation:** moderate. The contrastive loss equation is worth showing — it's distinctive. **Don't enumerate every loss variant** (SigLIP, etc.).

### Q3: VLM landscape depth?
**Recommendation:** brief but representative. Name the frontier models (GPT-4V/4o, Claude with vision, Gemini) and the open-source reference (LLaVA). **Don't enumerate every release** — the landscape moves too fast for a tutorial.

### Q4: Audio depth?
**Recommendation:** brief. Mel-spectrogram → Whisper encoder-decoder → voice-native models. **Don't tutorial Whisper or TTS**; engineers will find their own libraries.

### Q5: Computer use depth?
**Recommendation:** brief but explicit. Section 7 ties back to Ch 21; show the bridge clearly. **Don't deep-dive Anthropic's API** — covered in research file already.

### Q6: Widget candidates
1. **CLIP Embedding Space (marquee):** an interactive visualization showing 6-10 image-caption pairs in a 2D projection. Reader hovers/clicks; sees which images and texts cluster together (cat images near cat captions; car images near car captions; etc.). **Recommended marquee.**
2. **ViT Patch Tokenizer (secondary):** show how an image gets split into patches. A small 8×8 grid of an image; reader sees patch boundaries; can click a patch to see its flattened representation. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 23 is a **single-topic chapter**. Uses the **4-file cadence**.

Planned file layout:
- File 130: research (this)
- File 131: page structure (~650 lines, 8 sections; runnables embedded)
- File 132: CLIP Embedding Space marquee widget
- File 133: ViT Patch Tokenizer secondary widget + exercises + closeout (slot 134 absorbed)

**Pedagogical outcomes for the reader.** After Ch 23, the reader should be able to:
1. Articulate the unifying multimodal pattern (modality → tokenizer → transformer)
2. Explain how Vision Transformers turn images into token sequences (patch embedding)
3. Describe CLIP's contrastive training objective and what it produces
4. Compare modern VLM architectures (bolt-on vs native; LLaVA vs Gemini)
5. Understand the audio pipeline (mel-spectrogram → encoder-decoder; voice-native variants)
6. Apply multimodal RAG patterns to image + text retrieval
7. Describe computer use as the convergence of vision + tool use + reasoning
8. Identify modality-specific failure modes (OCR limits, audio noise, video understanding gaps)

Eight outcomes. Exercises hit outcomes 2, 3, 6, 8.

**Tonal framing**: capability survey with operational realism. Multimodal is **rapidly evolving** in 2024-2025; the chapter has to balance "here's the foundational technique" with "here's what's currently frontier." **Concrete numbers**: token counts per image (196-4000), Whisper training data (680k hours), VLM context budgets (100K-1M tokens), voice-native latency (<500ms). **Honest tradeoffs**: bolt-on vs native; OCR limits; computer-use latency.

**Phase 13 progression**: Ch 23 is the **final Phase 13 chapter**. **Closing the capability arc**: reasoning (think) + tool use (act) + RAG (retrieve) + multimodal (perceive). After this: Phase 14 opens with safety, interpretability, and evaluation as full disciplines.

**Importance**: multimodal is the capability that brings LLMs out of the chat box and into the physical+digital world. Frontier products (GPT-4o, Claude vision, Gemini Live) are multimodal-native; computer-use agents are multimodal; voice interfaces are multimodal. **Engineers building modern AI products need to know how multimodal works conceptually — and where its limits are.** This chapter is their roadmap.
