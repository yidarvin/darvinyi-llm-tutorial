# PROJECT_OVERVIEW

> Every Codex agent session reads this file first.
> If a downstream decision contradicts what's here, this file wins.

---

## What this is

**darvinyi-llm-tutorial** is a comprehensive tutorial that takes a technically prepared reader from numpy primitives through implementing modern LLM agent frameworks. Thirty chapters across nine parts, ending with the reader capable of building, training, fine-tuning, deploying, and orchestrating modern language models — not just using them.

The site lives at **`llm-tutorial.darvinyi.com`**, deployed from **`github.com/yidarvin/darvinyi-llm-tutorial`** via Vercel on push to `main`. It is a sibling to `textbook.darvinyi.com` — shared design language, distinct subject matter, distinct branding (true cyan `#06b6d4` vs. the textbook's teal `#2dd4bf`).

The tutorial is freely accessible. There is no signup, no paywall, no email capture, no analytics beyond Vercel's defaults. The reader is the user; the tutorial is the product.

---

## Who reads this

A reader with:
- **Strong Python** — writes code daily; not learning Python here. Comfortable with numpy idioms, list/dict comprehensions, decorators, async basics.
- **Linear algebra** — knows what a matrix multiply does, what eigenvalues are, can read summation notation without translation.
- **Basic neural network exposure** — has seen MLPs, SGD, and convnets in some form, but may not have implemented one from scratch.
- **Curiosity bordering on impatience** — wants the real thing, not a sanitized version.

A reader who, on finishing the tutorial, can:
- Implement every primitive of a modern LLM in numpy (attention, transformer block, RoPE, MoE routing, selective scan, LoRA, KV cache)
- Read and write the PyTorch idioms used in production training stacks
- Hold technical conversations about RLHF, DPO, RLVR, MoE, Mamba, mechanistic interpretability, and agent harnesses
- Build, deploy, and evaluate an agentic system from first principles, without LangChain

What the reader is **not**:
- A complete beginner. We don't define `np.dot` or explain what a for loop does.
- A pure mathematician. We use math where it earns its place; we don't drown the reader in measure theory.
- A practitioner looking for API documentation. We explain the system, not the framework du jour.
- A passive consumer. They read, they execute the runnable code, they think about the exercises.

---

## Where this fits in the landscape

The free LLM education landscape is excellent but fragmented. We name the major resources explicitly and position respectfully:

- **Karpathy's Zero-to-Hero & nanoGPT** — video-first, masterful for transformer fundamentals, doesn't reach modern post-training or agents
- **Sebastian Raschka's *Build an LLM from Scratch*** — book-shaped, code-heavy, scope ends around GPT-2
- **Lilian Weng's blog** — deepest single articles on alignment and reasoning, not cohesive as a course
- **Jay Alammar's illustrated guides** — best visual intuitions, less implementation depth
- **HuggingFace NLP course** — framework-led, applied, less first-principles

This tutorial complements them by being **comprehensive, current, and interactive**:

- **Comprehensive** — numpy primitives → transformer → pre-training → MoE/Mamba → RLHF/DPO/RLVR → inference optimization → multimodal → safety & interpretability → agents → eval. No other free resource covers all of this in one cohesive arc.
- **Current** — 2025–2026 frontier topics (RLVR, R1-style reasoning, Mamba-2, modern MoE designs, test-time-compute scaling, SAEs) are first-class chapters, not afterthoughts.
- **Interactive** — interactive widgets that visualize what static figures cannot: attention patterns, sampling distributions, MoE routing, KV cache growth, SAE features, agent traces.

Where another resource is canonical for a specific topic, we link to it and build on it. We don't try to out-Karpathy Karpathy on backprop intuition; we cite the video and move into our own framing.

---

## Pedagogical principles

1. **Numpy first, PyTorch second.** Early chapters (1–8) implement everything in numpy so the operations are visible: tensor shapes, gradient flow, sampling boundaries. PyTorch versions follow to show the production form. Later chapters (17+) lean on PyTorch directly because the topics demand it (custom CUDA kernels, FSDP, distributed training).

2. **Math is shown, not hidden.** Equations render in KaTeX. Where math is non-obvious, we derive it step by step. Where math has matured into a one-liner, we show the one-liner and explain what each symbol carries. We don't pretend math is the same thing as understanding, but we don't hide behind prose either.

3. **Code earns its place.** Snippets are explained line by line where mechanics are subtle (the einsum in multi-head attention); otherwise they're shown and the reader is trusted to read. `<RunnableCode>` (Pyodide) blocks are reserved for cases where actually executing the code teaches something reading it doesn't — e.g., watching a tokenizer eat a weird string.

4. **Interactivity has a budget.** One or two widgets per chapter, chosen to unlock concepts that static figures can't. We do not gamify. We do not add interactivity for its own sake.

5. **The field is unsettled in places. Say so.** Where alignment, interpretability, or eval methodology is genuinely contested, we describe the disagreements rather than pretending consensus exists.

6. **Currency matters.** A chapter that pretends RLHF is the only alignment method, or that ignores R1-style reasoning training, is wrong. We update.

---

## Tone and voice

Direct. Technical. Opinionated where the field has converged. Careful where it hasn't. No filler. No marketing prose. No false humility.

### Voice tense

- **Second person ("you")** when explaining: *"You can verify the gradient flows through the residual unchanged."*
- **First person plural ("we")** when deriving or implementing alongside the reader: *"We multiply the queries by the keys and scale by √d."*
- **No first person singular.** The author does not insert themselves into the prose. There is no "I think" or "in my opinion." Strong opinions are stated as the project's stance, owned by the prose itself.

### Tone calibration — examples

**Do:**
> The softmax in attention isn't there because it's the only way to get a probability distribution — it's there because exponentiating before normalizing makes the largest pre-softmax score dominate, which is what lets attention sharpen onto a single key when needed.

**Don't:**
> In this section, we will discuss the softmax function, which is an important component of the attention mechanism. The softmax function converts logits into a probability distribution.

---

**Do:**
> RoPE won the position-encoding race because it composes cleanly with the KV cache and extrapolates more gracefully than learned positional embeddings. ALiBi's case is real but narrower.

**Don't:**
> There are many ways to encode position information. Each has its own advantages and disadvantages.

---

**Do:**
> This implementation skips numerical stability tricks beyond the max-subtraction. In production you'd also handle the inf/nan that masked positions can introduce; we cover this in §4.3.

**Don't:**
> Note: there are many additional considerations for production code that are beyond the scope of this tutorial.

---

**Do:**
> Whether DPO produces policies meaningfully different from full RLHF in practice is contested. The original paper showed equivalence; later analyses argue DPO leaves residual probability mass on dispreferred completions that RLHF removes. This is an open question.

**Don't:**
> Some researchers prefer DPO while others prefer RLHF. The choice depends on your use case.

### Specifically forbidden phrases

These add cognitive overhead with no information. They do not appear in chapter content:

- "In this section/chapter, we will..."
- "It's important to note that..."
- "As we can see..."
- "It's worth mentioning..."
- "Without further ado..."
- "Hopefully this clarifies..."
- "Now that we understand X, let's move on to Y."
- "Let's dive in."
- "Stay tuned for..."
- Any sentence whose only function is to announce the next sentence.

The reader can see the section heading. They don't need to be told what's coming.

### Headings name the thing, not the act of discussing the thing

- ✅ "Multi-head attention" · ❌ "Understanding multi-head attention"
- ✅ "The KV cache" · ❌ "How the KV cache works"
- ✅ "Why √d scaling" · ❌ "Explanation of the scaling factor"
- ✅ "RoPE" · ❌ "Introduction to RoPE"

---

## Conventions for math, code, and prose

### Math

- Inline math uses `$...$`. Display math uses `$$...$$` or `<Equation>` for labeled equations.
- Use the custom KaTeX macros defined in `astro.config.mjs` (`\softmax`, `\attn`, `\R`, `\E`, `\KL`, `\argmax`). Don't redefine them inline.
- Label equations referenced later: `<Equation label="4.1">...</Equation>`, cite with `<EqRef id="4.1" />`.
- Variable naming follows field conventions:
  - $Q, K, V$ for attention components
  - $\theta$ for parameters
  - $\pi$ for policies, $\pi_\text{ref}$ for the reference policy in RLHF/DPO
  - $n$ for sequence length (established by Chapters 4-6; some later, code-heavy chapters use $T$ to match PyTorch's `(B, T, ...)` tensor-shape convention — keep such use internally consistent within a chapter and don't let it collide with another local meaning), $d$ for hidden dimension, $H$ for number of heads, $d_k$ for per-head dimension
  - $\beta$ for KL temperature in DPO; $r$ for reward; $A$ for advantage
- Don't reinvent symbols. Match the canonical paper for the chapter's topic.

### Code in prose

- Numpy is the default for primitives (Chapters 1–8). PyTorch is the default for production-form code (Chapters 5+ as appropriate).
- Code is labeled with its target environment when ambiguous: ` ```python title="src/attention.py" `.
- Line-highlight the lines being discussed: ` ```python {3-5} `.
- Static Shiki blocks are the default. `<RunnableCode>` (Pyodide) only when executing the code genuinely teaches something reading it doesn't.
- Comments inside code explain the *why*, not the *what*. The variable name `d_k` doesn't need a `# the key dimension` comment.

### Citations

- Cite papers inline by first author and year: "Vaswani 2017", "Hoffmann 2022".
- Link to arxiv abstract pages (`arxiv.org/abs/...`), not PDFs.
- For blog posts and informal references, link the URL with a brief contextual phrase: "Karpathy's 2024 talk lays out the case ..."
- No collected bibliography at chapter end. Inline links suffice.
- Pre-research files (`research/chXX/research.md`) carry the full reading list for each chapter; chapter content references them implicitly.

### Cross-chapter references

Use the explicit form: "see §17.3 on speculative decoding" or "as introduced in Chapter 4," with a link to the appropriate anchor. Don't say "as we'll see later" without a destination.

---

## Intellectual honesty

Where the field is unsettled, the tutorial says so explicitly:

> There is no consensus on whether SAEs are recovering true features of the model or just convenient projections. The evidence for the former is suggestive — features are interpretable, transfer across models, and predict downstream behavior — but it's not conclusive.

Where the tutorial expresses a strong opinion, it owns the opinion and explains the basis:

> RoPE has effectively won. The KV-cache compatibility, extrapolation behavior, and clean composition with positional interpolation make it the default in every major open model since Llama 2.

Where production practice diverges from textbook treatment, the tutorial notes it:

> Textbook gradient descent updates the full parameter vector. Production training uses AdamW with weight decay, gradient clipping, and a cosine learning-rate schedule. The reasons aren't deep — they're empirical. We'll show the textbook version first because the math is cleaner, then switch.

Where the tutorial doesn't know, it says it doesn't know:

> Why scaling laws hold so cleanly across architectural variations remains poorly understood. The most honest answer is "the empirics are robust, the theory is incomplete."

Never bluff. Never pretend a frontier topic is fully settled.

---

## Visual identity (brief)

Dark mode only. Background `#0a0a0a`. True cyan `#06b6d4` as the single accent color. Inter for body and headings. JetBrains Mono for code. No light mode toggle.

Crimson Pro (used on `textbook.darvinyi.com`) is **not** used here. The LLM tutorial leans more engineering-flavored; Inter throughout gives it that feel.

Full visual spec, including the component contracts every chapter uses: see `context/DESIGN_SYSTEM.md`. Don't improvise visual choices that aren't covered there — open a question instead of guessing.

---

## Reading order

Chapters are designed to be read linearly. Each chapter assumes mastery of preceding chapters. The site supports two reading modes:

- **Linear** — prev/next at chapter end, sidebar lists all 30 chapters in order. This is the primary reading mode.
- **Direct lookup** — full-text search through the local MiniSearch index, sidebar jump. For readers returning to look up a specific concept.

We do not optimize for randomized reading order. A reader landing on Chapter 17 without having read Chapter 4 will struggle, and the prose doesn't apologize for that.

---

## What this is NOT

- **Not a marketing site.** No CTAs except "next chapter." No newsletter signup. No "join our community." No Discord link. No social-share buttons on every page.
- **Not a code repo viewer.** Code is shown inline with prose, not dumped.
- **Not a paper aggregator.** Where papers are cited, the relevant idea is explained in plain language first.
- **Not a video course.** All content is text + math + code + interactive components. No embedded video.
- **Not Markdown-only.** MDX is the authoring format; React components are first-class.
- **Not a vendor-neutral textbook.** Where Anthropic's tools (Claude, MCP) are the cleanest example for a concept, we use them. Where another vendor's tool is cleaner, we use that. The tutorial is intellectually independent of any single company; it's not artificially balanced.
- **Not a place for the author's biography.** Darvin Yi's name appears in the byline and footer, alongside a single one-line author affiliation. No further biographical detail.

---

## Repo and deployment

- Astro 5 static build. Output in `dist/`.
- Vercel auto-deploys `main`. PRs preview-deploy automatically.
- Subdomain `llm-tutorial.darvinyi.com` configured via Namecheap CNAME → `cname.vercel-dns.com`.
- A local MiniSearch index is generated from every chapter before development and production builds. It is segmented by chapter section, requires no runtime backend, and must cover all 30 chapters.
- No runtime backend. Pyodide runs entirely client-side.
- Tool-use examples that hit the Anthropic API (Chapter 21+) require the reader to supply their own key via a small in-widget form. The key is held in `localStorage`, never sent to any server we control.

---

## Naming the project in copy

- Title: **"LLM Tutorial"**
- Subtitle: **"From numpy to agents"**
- Author byline: **"Darvin Yi"** — includes a single one-line author affiliation on the public site
- Footer attribution: links to `darvinyi.com`, `textbook.darvinyi.com`, and the GitHub repo

When referencing the tutorial inside its own content, just write *"this tutorial"* or call it by chapter (*"Chapter 4 covers attention from first principles"*). Don't use the title in body prose.

---

## For the author of any chapter session

This list is what every chapter session must do, in order, before submitting work:

1. **Read this file, then `DESIGN_SYSTEM.md`, `TECH_STACK.md`, and `CURRICULUM.md`** (the latter focused on the assigned chapter). Then read the chapter's `research/chXX-slug/research.md` before writing prose.
2. **Match this file's tone exactly.** If a paragraph reads like a textbook intro, rewrite it. The "forbidden phrases" list above is enforceable.
3. **Cut filler ruthlessly.** If a sentence doesn't add information, delete it. Word count is not a virtue.
4. **Use the components in `src/components/content/`** — `Callout`, `Equation`, `EqRef`, `Figure`, `WidgetFrame`, `RunnableCode`. Don't reinvent them.
5. **Use the existing KaTeX macros** for `\softmax`, `\attn`, etc. Don't redefine.
6. **Honor field conventions for variable names.** $Q, K, V$ are attention components, not arbitrary matrices. $\pi$ is a policy, not a probability.
7. **When unsure about a technical claim, hedge or check.** Don't assert with confidence what you can't verify. "Common practice in modern training stacks" is fine; "all production models do this" is not unless you can name them.
8. **Never apologize in prose.** "This is a simplified treatment" is fine. "We apologize for not covering more" is not.
9. **Open questions, not silence.** If you encounter a real ambiguity (a visual choice not covered in `DESIGN_SYSTEM.md`, a technical decision the spec doesn't cover), surface it explicitly in the session output rather than guessing.
10. **End each session with a clean wire-up.** Final imports added, dev server tested locally, file paths confirmed against `MASTER_PLAN.md` and `BUILD_ORDER.md`.

If at any point the spec here contradicts a chapter-specific instruction, follow the chapter-specific instruction and flag the conflict in the session output so we can reconcile.
