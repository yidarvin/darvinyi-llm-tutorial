# Session 86 — Chapter 19 page structure

> First chapter session for Chapter 19 ("Sampling"). **The chapter that closes Phase 12.** Where Ch 17 reduced wasted computation and Ch 18 reduced bits per parameter, Ch 19 governs how the decoder actually picks tokens given the logits. **Conceptually clean closing chapter** — the algorithms are short; the engineering tradeoffs are clear; the operational reality (chat models default to temperature ~0.7 + top-p ~0.95) is well-understood. Single-topic chapter; uses the **4-file cadence**.

---

## Read first (in this order)

1. **`research/ch19-sampling/research.md`** — the source material. Every section, equation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch18-quantization/session-82-page-structure.md`** — for the Phase 12 voice template (Ch 18 is the immediate predecessor; same practical-engineering voice carries here)
4. **`prompts/chapters/ch17-inference-optimization/session-77-page-structure.md`** — for the Phase 12 opening voice template

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 19 page. By end of session:

- `src/pages/ch19-sampling/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch19-sampling/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 19's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch19-sampling/` with sidebar showing Ch 19 active, prev/next nav linking to Ch 18 (active) and Ch 20 (disabled)

**Tonal note:** Ch 19 is **practical engineering with a slightly lighter voice than Ch 18.** Sampling algorithms are conceptually clean: temperature, top-k, top-p are short to define and the tradeoffs are intuitive. **The chapter should feel like a satisfying close to Phase 12** — algorithms simple; impact huge; reader leaves with the full deployment mental model. **Concrete numbers** matter: temperature values per use case, top-p defaults, the recipes table is operationally consequential.

**Phase 12 closing context:** this chapter closes Phase 12. The reader should feel the trilogy come together: Ch 17 reduced wasted *compute*; Ch 18 reduced wasted *bits*; Ch 19 governs the *decision*. After this chapter, **Phase 12 is complete** and Phase 13 (capabilities: reasoning, tools, RAG, multimodal) opens. The closing should make this transition feel earned and exciting.

**Chapter cadence:** Ch 19 uses the **4-file cadence** (single-topic).

---

## Inputs

State of the repo after session 84 (Ch 18 complete):

- Ch 1-18 all `'published'`
- `research/ch19-sampling/research.md` exists
- `src/lib/chapters.ts` has Ch 1-18 `'published'`, Ch 19-30 `'planned'`
- No `src/pages/ch19-sampling/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch19-sampling/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch19-sampling/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 19's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch19-sampling
description: Sampling — how a transformer's logits become emitted tokens. Greedy/argmax for deterministic outputs; temperature for global softness; top-k for fixed-size truncation; top-p (nucleus) sampling (Holtzman 2019) as the modern adaptive default; combinations with repetition penalties for chat-grade output; beam search for high-likelihood paths (rare in modern serving); constrained decoding (Outlines, JSON mode, grammar enforcement) for structured outputs. Modern recipes per use case (chat, code, creative, reasoning). The chapter that closes Phase 12 — and the inference-engineering arc.
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

> Chapter 17 made the forward pass faster. Chapter 18 made it smaller. This chapter is about what happens *after* the forward pass: how a vector of logits — one score per vocabulary token — becomes the next emitted text token. **The choice matters enormously.** Greedy decoding produces robotic, repetitive output. Pure random sampling produces incoherent nonsense. Carefully-designed strategies (temperature + nucleus + a mild repetition penalty) produce natural, varied, useful text. The algorithms are short; the impact is huge.
>
> This chapter walks through the canon: **greedy** (argmax) as baseline; **temperature** as the global softening knob; **top-k** as fixed-size truncation; **top-p (nucleus) sampling** (Holtzman 2019) as the modern adaptive default; **repetition penalties** for loop-prevention; **beam search** for the cases where it still wins; and **constrained decoding** for production agents that need structured output. By the end, you'll know which sampling configuration to reach for in chat, code, creative writing, reasoning, and structured-output use cases — and why the production defaults are what they are.
>
> **And then Phase 12 is complete.** Three chapters covered the full inference-engineering arc: cache + batching + Flash Attention + speculative + paging (Ch 17); quantization + NF4 + GPTQ + AWQ (Ch 18); and sampling (this chapter). Combined, these are the difference between a 50-token-per-second research curiosity and a 500-token-per-second production service. **Phase 13 opens next with capabilities** — reasoning, tools, retrieval, multimodal — the chapters that turn deployable models into useful systems.

### Section 1: From logits to text

**Heading:** `## From logits to text`
**Word target:** ~400
**Sub-headings:** `### The three steps`, `### Why this is microseconds`

**Teaching beats:**

**The three steps:**
1. **Logits**: the model's forward pass produces a vector $z \in \mathbb{R}^V$ where $V$ is the vocabulary size (50K-200K typical).
2. **Softmax**: $p_i = \exp(z_i) / \sum_j \exp(z_j)$ — converts logits to a probability distribution.
3. **Sampling**: an algorithm picks token index $i^*$ from this distribution. **The choice of algorithm is what this chapter is about.**

**Why this is microseconds:**
4. **The forward pass dominates time per token**: hundreds of milliseconds.
5. **Sampling is microseconds**: even the most elaborate strategy (top-p + repetition penalty + constrained masking) is sub-millisecond.
6. **But the *impact* of sampling on output quality is huge** — order-of-magnitude difference in usefulness between greedy and well-tuned nucleus sampling.

**Required callout** — type `aside`: **Sampling is the highest leverage-to-complexity ratio in Phase 12.** A few lines of code (top-p, temperature, a mild repetition penalty) transforms output quality. Compare to Ch 17 (sophisticated kernel engineering) and Ch 18 (intricate quantization recipes). Sampling is *not* where the engineering effort is hardest, but it's where small changes have the biggest user-facing effect.

**No code in this section.** Setup.

**Connection forward:** Section 2 covers the simplest strategies — greedy and temperature.

### Section 2: Greedy and temperature

**Heading:** `## Greedy and temperature`
**Word target:** ~500
**Sub-headings:** `### Greedy decoding`, `### Temperature scaling`

**Teaching beats:**

**Greedy decoding:**
1. **Greedy = argmax**: emit the highest-probability token at each step.
2. **Pros**: deterministic; reproducible; sometimes best for short, factual answers (extraction tasks).
3. **Cons**:
   - **Repetitive**: greedy text loops ("the cat sat on the the cat sat on the")
   - **Brittle**: an early mistake compounds across the rest of the sequence
   - **Robotic**: lacks the natural variation of human text

**Temperature scaling:**
4. **The simplest stochastic generalization**: divide logits by $T$ before softmax:

```mdx
<Equation label="19.temperature">
$$p_i(T) = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$
</Equation>
```

5. **$T = 1$**: standard sampling (the model's natural distribution).
6. **$T < 1$**: sharpens (more conservative; approaches greedy as $T \to 0$).
7. **$T > 1$**: softens (more random; approaches uniform as $T \to \infty$).

**Typical values:**
- **$T = 0$** (or near-zero): deterministic for factual extraction, code "definite" tokens
- **$T = 0.7$ - $1.0$**: default for chat / creative writing
- **$T = 1.2$ - $1.5$**: for diverse generations (brainstorming, story writing)

**Reader bridge to Ch 16**: temperature here is the same mathematical operation as in distillation (Ch 16), but used differently. There, high temperature *revealed* the teacher's dark knowledge by softening its peaked distribution. Here, temperature *adjusts the creativity dial* of the sampling process. **Same math; different purpose.**

**Required code** — `<RunnableCode>` implementing greedy + temperature + top-k:

```python
import numpy as np

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

def greedy(logits):
    """Emit argmax."""
    return int(np.argmax(logits))

def temperature_sample(logits, T=1.0, rng=None):
    """Sample from softened distribution."""
    if rng is None: rng = np.random
    p = softmax(logits / T)
    return int(rng.choice(len(p), p=p))

# Synthetic logits with one clear winner + several runners-up
np.random.seed(0)
V = 100
logits = np.random.normal(0, 1, V)
logits[5] = 4.0     # Clear winner
logits[12] = 2.5    # Runner-up
logits[42] = 2.0    # Distant third

print(f"Logits peak at token 5 (4.0); runner-up at 12 (2.5)\\n")

print(f"{'Method':<25} | 10 samples")
print("-" * 70)
rng = np.random.RandomState(42)
for name, fn in [
    ("Greedy (T=0)",      lambda: greedy(logits)),
    ("Temp = 0.5 (sharp)", lambda: temperature_sample(logits, T=0.5, rng=rng)),
    ("Temp = 1.0 (raw)",   lambda: temperature_sample(logits, T=1.0, rng=rng)),
    ("Temp = 2.0 (soft)",  lambda: temperature_sample(logits, T=2.0, rng=rng)),
]:
    samples = [fn() for _ in range(10)]
    print(f"{name:<25} | {samples}")

print("\\nObservations:")
print("- Greedy: always token 5 (deterministic, but boring)")
print("- T = 0.5: mostly 5, occasional 12 (sharp, conservative)")
print("- T = 1.0: balanced — 5 dominant, 12 and 42 appear sometimes")
print("- T = 2.0: random tokens from all over (too noisy)")
```

**Required callout** — type `warning`: MC1 from research.md. "Higher temperature is always more creative." False at extremes — **at $T \gtrsim 2$, the distribution approaches uniform** and the output becomes incoherent. The creativity sweet spot is $T = 0.7 - 1.2$. **Above 1.5, quality degrades rapidly.**

**Connection forward:** Section 3 covers truncation strategies starting with top-k.

### Section 3: Top-k sampling

**Heading:** `## Top-k sampling`
**Word target:** ~400
**Sub-headings:** `### The tail-noise problem`, `### Fixed-size truncation`

**Teaching beats:**

**The tail-noise problem:**
1. **At $T = 1$**, the tail of the distribution still contributes occasionally — even tokens with $p < 10^{-6}$.
2. **Most of those tokens are nonsensical** given the context. **Tail noise is real**.

**Fixed-size truncation:**
3. **Top-k sampling** (Fan et al. 2018):
   - Sort tokens by probability; keep only the top $k$
   - Renormalize the surviving probabilities
   - Sample from the truncated distribution
4. **Typical values**: $k = 50$ (older default), $k = 40$ (chat), $k = 20$ (more focused).
5. **Pros**: simple; fast.
6. **Cons**: $k$ is fixed regardless of distribution shape.
   - **Peaked distribution** (high confidence): $k = 50$ is wasteful (only the top few matter)
   - **Flat distribution** (uncertain): $k = 50$ may be too restrictive

**This fixed-size limitation motivates top-p**, the topic of section 4.

**No code in this section.** The runnable in section 2 already showed temperature; top-k is implemented in the runnable for section 4.

**Required callout** — type `aside`: Top-k is the historical predecessor of top-p. **Before nucleus sampling (2019), top-k was the standard truncation strategy.** It's still useful as a "safety net" — even production stacks that use top-p often combine it with $k = 50$ to bound the truncation set in pathological cases.

**Connection forward:** Section 4 introduces the modern default — top-p / nucleus sampling.

### Section 4: Top-p (nucleus) sampling

**Heading:** `## Top-p (nucleus) sampling`
**Word target:** ~600 — IMPORTANT (modern default)
**Sub-headings:** `### The adaptive insight`, `### The algorithm`, `### Why it's the default`

**Teaching beats:**

**The adaptive insight:**
1. **Holtzman et al. 2019** observed: the right truncation set depends on the distribution's *peakedness*, not a fixed size.
2. At peaked distributions, just a few tokens carry most mass.
3. At flat distributions, many tokens are plausible.
4. **A fixed $k$ doesn't adapt.** Top-p does.

**The algorithm:**
5. **Top-p (nucleus) sampling**:

```mdx
<Equation label="19.nucleus">
$$\text{Nucleus}_p(z) = \left\{i : i \text{ is in the smallest set with } \sum p_i \geq p\right\}$$
</Equation>
```

6. **Steps**:
   - Sort tokens by probability (descending)
   - Find the smallest $k$ such that $p_1 + p_2 + \ldots + p_k \geq p$
   - Keep those $k$ tokens; renormalize; sample

**Why it's the default:**
7. **At peaked distributions**: nucleus is small (most mass on few tokens)
8. **At flat distributions**: nucleus grows (more tokens needed to reach mass $p$)
9. **Adapts to the distribution** — no fixed budget
10. **Typical values**: $p = 0.95$ (chat default), $p = 0.9$ (older default), $p = 0.8$ (more focused).

**Modern reality:**
11. **Nucleus sampling is the default** for GPT, Claude, Llama, Gemini APIs.
12. **Min-p variant** (Nguyen 2024): keep tokens with $p_i \geq p_{\min} \cdot \max p_j$ — adapts to the *peak* rather than cumulative mass.

**Required code** — `<RunnableCode>` implementing top-p with adaptive nucleus size:

```python
import numpy as np

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

def top_p_sample(logits, p=0.95, T=1.0, rng=None):
    """Top-p (nucleus) truncation + sampling."""
    if rng is None: rng = np.random
    z = logits / T
    probs = softmax(z)
    # Sort by probability (descending)
    sorted_idx = np.argsort(probs)[::-1]
    sorted_probs = probs[sorted_idx]
    # Find smallest k such that cumulative sum reaches p
    cumsum = np.cumsum(sorted_probs)
    nucleus_size = int(np.searchsorted(cumsum, p) + 1)
    nucleus_idx = sorted_idx[:nucleus_size]
    # Mask everything outside the nucleus
    mask = np.full_like(z, -np.inf)
    mask[nucleus_idx] = z[nucleus_idx]
    p_final = softmax(mask)
    return int(rng.choice(len(p_final), p=p_final))

def nucleus_size(probs, p=0.95):
    """Return the size of the nucleus for diagnostic purposes."""
    sorted_probs = np.sort(probs)[::-1]
    cumsum = np.cumsum(sorted_probs)
    return int(np.searchsorted(cumsum, p) + 1)

# Demo: how does nucleus size adapt to distribution shape?
def make_distribution(shape, V=50):
    np.random.seed(0)
    z = np.random.normal(0, 1, V)
    if shape == 'peaked':
        z[0] += 5.0   # one clear winner
    elif shape == 'bimodal':
        z[0] += 3.0   # two top candidates
        z[1] += 2.5
    # 'flat': do nothing
    return softmax(z)

print(f"{'Shape':<10} | {'p=0.5':>8} {'p=0.9':>8} {'p=0.95':>8}")
print("-" * 40)
for shape in ['peaked', 'bimodal', 'flat']:
    probs = make_distribution(shape)
    sizes = [nucleus_size(probs, p) for p in [0.5, 0.9, 0.95]]
    print(f"{shape:<10} | {sizes[0]:>8} {sizes[1]:>8} {sizes[2]:>8}")

print("\\nObservations:")
print("- Peaked: nucleus is small (~1-3 tokens at p=0.95)")
print("- Bimodal: nucleus includes both peaks (~2-4 tokens)")
print("- Flat: nucleus is large (need many tokens to reach 95% mass)")
print("\\nTop-p adapts where top-k cannot.")
```

**Required widget placeholder** — Sampling Distribution Visualizer (marquee, session 87):

```mdx
<WidgetFrame title="Sampling distribution explorer" caption="See how the same logits get transformed by different sampling strategies. Sliders for temperature, top-p, and top-k; bars show original probabilities and which tokens survive truncation. The nucleus adapts to distribution shape — small at peaked logits, large at flat ones. The widget makes the modern default's adaptive behavior visceral.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 87 (marquee)
  </div>
</WidgetFrame>
```

**Required callout** — type `note`: MC2 from research.md. "Top-p is always better than top-k." Mostly true but **not always**. In practice, most production stacks **use top-p** for its adaptive properties, but some combine it with a "safety net" top-k (like $k = 50$) to bound truncation in pathological cases. The combination is often default in libraries like Hugging Face's `transformers`.

**Connection forward:** Section 5 covers how multiple strategies combine.

### Section 5: Combining strategies

**Heading:** `## Combining strategies`
**Word target:** ~500
**Sub-headings:** `### Order of operations`, `### Production recipes`

**Teaching beats:**

**Order of operations:**
1. **In production, multiple strategies are stacked**. A typical chat sampling step:
   - Compute logits $z$
   - Apply temperature: $z' = z / T$
   - Apply nucleus (top-p) truncation: keep tokens with cumulative mass ≥ $p$
   - Apply repetition penalty (section 6): downweight recent tokens
   - Softmax over surviving tokens
   - Sample

**Order matters**:
- Temperature first (changes distribution shape)
- Then truncation (top-p applied to the softened distribution)
- Then repetition penalty (applied to surviving tokens)
- Finally softmax and sample

**Production recipes:**
2. **Recommended configurations by use case**:

| Use case | Temperature | Top-p | Top-k | Rep penalty |
|---|---|---|---|---|
| Factual extraction | 0.0 - 0.3 | (any) | (any) | mild (1.05) |
| Chat / instruction | 0.7 | 0.95 | (off) | mild (1.05) |
| Creative writing | 1.0 - 1.2 | 0.95 | (off) | moderate (1.1) |
| Code completion | 0.2 - 0.5 | 0.95 | (off) | (off) |
| Reasoning | 0.6 - 0.7 | 0.95 | (off) | (off) |
| Brainstorming | 1.2 - 1.5 | 0.95 - 1.0 | (off) | (off) |

3. **API defaults differ**:
   - OpenAI: $T = 1.0$, top-p $= 1.0$ (effectively off), no top-k, no penalties
   - Anthropic Claude: $T = 1.0$, other parameters per-request
   - Llama (Meta recommendation): $T = 0.6$, top-p $= 0.9$
   - Codex / Copilot: $T = 0.2$, top-p $= 0.95$
   - Reasoning models (o1, R1): $T = 0.6 - 0.7$, top-p $= 0.95$

**Practical guideline**: **start with chat defaults** ($T = 0.7$, top-p $= 0.95$, mild repetition penalty); adjust based on observed output.

**Required callout** — type `note`: The defaults in the recipes table are *guidance*, not laws. **Different models prefer different sampling configurations** — a model heavily trained with RLHF (Claude, GPT-4) produces well-shaped distributions where $T = 1.0$ + top-p $= 1.0$ works well. A less-tuned model may need lower temperature or tighter top-p to avoid incoherent outputs. **Tune per-model in practice.**

**No code in this section.** Conceptual.

**Connection forward:** Section 6 covers the repetition penalty mechanics.

### Section 6: Repetition penalties

**Heading:** `## Repetition penalties`
**Word target:** ~400
**Sub-headings:** `### Three mechanisms`, `### When to use`

**Teaching beats:**

**Three mechanisms:**
1. **Frequency penalty** (OpenAI convention): logit reduced proportional to token count so far:
   $z'_i = z_i - \alpha \cdot \text{count}_i$
2. **Presence penalty**: logit reduced by a fixed amount if token has appeared at all:
   $z'_i = z_i - \alpha \cdot \mathbb{1}[\text{count}_i > 0]$
3. **N-gram blocking** (aggressive): if generating token $t$ would produce an $n$-gram already in the output, set $p_t = 0$.

**Typical values**:
- Frequency penalty: $\alpha = 0.0 - 1.0$ (typically 0.0 - 0.3)
- Presence penalty: $\alpha = 0.0 - 1.0$ (typically 0.0 - 0.5)
- N-gram blocking: typically 3-grams or 4-grams

**When to use:**
4. **Modern instruction-tuned models** (post-SFT/RLHF) rarely need strong repetition penalties — RLHF already discourages loops.
5. **A mild frequency penalty** (~0.1) is usually sufficient for chat.
6. **Higher penalties** (>0.5) often *hurt* quality — they prevent natural repetition like common words ("the").

**Required code** — `<RunnableCode>` implementing the three penalties:

```python
import numpy as np

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

def apply_frequency_penalty(logits, token_counts, alpha=0.5):
    """Reduce logit by alpha * count."""
    return logits - alpha * token_counts

def apply_presence_penalty(logits, seen_tokens, alpha=0.5):
    """Reduce logit by alpha if token has appeared at all."""
    penalty = np.zeros_like(logits)
    for t in seen_tokens:
        penalty[t] = alpha
    return logits - penalty

# Demo: simulate a decode step where token 5 has been emitted 3 times
np.random.seed(0)
V = 50
logits = np.random.normal(0, 1, V)
logits[5] = 5.0   # Strong preference for token 5
token_counts = np.zeros(V)
token_counts[5] = 3
seen = {5}

# Compare probabilities
p_orig = softmax(logits)[5]
p_freq = softmax(apply_frequency_penalty(logits, token_counts, 0.5))[5]
p_pres = softmax(apply_presence_penalty(logits, seen, 0.5))[5]

print(f"Original logit for token 5: {logits[5]:.2f}")
print(f"P(token 5):")
print(f"  Original:          {p_orig:.3f}")
print(f"  Freq penalty (α=0.5): {p_freq:.3f}  (penalty grows with count)")
print(f"  Presence penalty:     {p_pres:.3f}  (fixed regardless of count)")
print(f"\\nFor modern chat models, α = 0.1 is usually sufficient.")
print(f"α > 0.5 often degrades output by suppressing natural repetition.")
```

**Required callout** — type `warning`: MC6 from research.md. "Repetition penalties always improve quality." False at high values. **Strong penalties** (>0.5) prevent natural repetition — common words like "the" become rare; output becomes unnatural. **Modern RLHF'd chat models rarely need strong repetition penalties** because RLHF training already discourages loops. Start with $\alpha = 0.1$; only raise if observed loops.

**Connection forward:** Section 7 covers the search-based alternative — beam search.

### Section 7: Beam search

**Heading:** `## Beam search`
**Word target:** ~400
**Sub-headings:** `### The mechanics`, `### Why it's rare in LLM serving`

**Teaching beats:**

**The mechanics:**
1. **Beam search** is a search-based strategy: maintain $B$ partial sequences (the "beam") at each step.
2. For each sequence in the beam, compute logits and consider top-$k$ extensions → $B \times k$ candidates.
3. Keep the top $B$ overall by cumulative log-probability.
4. Repeat until end-of-sequence or max length.

**Why it's rare in LLM serving:**
5. **Pros**: finds higher-likelihood sequences than greedy/sampling.
6. **Cons**:
   - **Repetitive at high beam width**: famously degenerate (Holtzman 2019)
   - **Computational cost**: $B \times$ more forward passes per step
   - **Bland output**: maximum-likelihood sequences are often "safe" and dull
   - **Doesn't suit creative tasks**: chat / story / brainstorming want diversity, not max-likelihood

**When beam search still wins**:
- **Machine translation** with discrete correct answers
- **Short, well-defined outputs** where likelihood matters
- **Older NMT systems**: beam search was the standard

**Modern reality:**
7. **Most production LLM APIs don't expose beam search** as a sampling option. Available in `transformers.generate()` but rarely default.

**Required callout** — type `aside`: Beam search dominated machine translation for years (2014-2020) but has fallen out of favor for LLM serving. Why? **Modern LLMs trained with RLHF produce well-shaped output distributions**; stochastic sampling competes well even on tasks where beam search used to win. **Beam search is now mostly a fallback for specialized tasks with discrete correct answers.**

**No code in this section.** Conceptual; beam search implementations are dozens of lines and not pedagogically critical.

**Connection forward:** Section 8 covers constrained decoding and closes Phase 12.

### Section 8: Constrained decoding and modern recipes

**Heading:** `## Constrained decoding and modern recipes`
**Word target:** ~700 — closing section
**Sub-headings:** `### Why constrained decoding matters`, `### The FSM masking technique`, `### Phase 12 — complete`

**Teaching beats:**

**Why constrained decoding matters:**
1. **Production agents need structured outputs**: JSON for tool calls, regex matches for parseable fields, grammars for valid Python/SQL.
2. **Naive approach**: prompt the model to follow the format; parse; retry on failure. **Brittle and slow.**
3. **Constrained decoding**: guarantee the output satisfies the constraint.

**The FSM masking technique:**
4. **Compile the constraint to a finite-state machine** (or context-free grammar).
5. **At each decode step**: determine which tokens are valid at the current FSM state.
6. **Mask invalid tokens** by setting their logits to $-\infty$:

```mdx
<Equation label="19.constrained">
$$z'_i = \begin{cases} z_i & \text{if token } i \text{ is valid at current state} \\ -\infty & \text{otherwise} \end{cases}$$
</Equation>
```

7. **Apply usual sampling** (temperature, top-p) over the masked distribution.
8. **The model picks the most-likely valid token** — output remains coherent within the constraint.

**Production implementations:**
9. **Outlines library** (Willard & Louf 2023): regex-to-FSM compilation; works with any HF model
10. **OpenAI JSON mode**: `response_format = json_object` constrains output
11. **Anthropic structured outputs**: tool schema enforcement
12. **Llama.cpp grammar mode**: BNF grammar enforcement

**Required widget placeholder** — Constrained Decoding Visualizer (secondary, session 88):

```mdx
<WidgetFrame title="Constrained decoding" caption="A small JSON grammar masking the decoder. Walk through a step-by-step generation; at each step, see which tokens are valid (sampleable) vs invalid (masked to -∞). The model picks the most-likely valid token. The widget makes 'how does JSON mode work' concrete.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 88 (secondary)
  </div>
</WidgetFrame>
```

**Phase 12 — complete:**
13. **Phase 12 wraps with sampling.** The trilogy:
    - **Ch 17**: reduced wasted *computation* — KV cache, batching, Flash Attention, speculative decoding, PagedAttention
    - **Ch 18**: reduced *bits per parameter* — INT8, INT4, NF4, GPTQ, AWQ
    - **Ch 19** (this chapter): governs the *decision* — how the decoder picks tokens

14. **Combined**: 10-20× throughput vs naive on the same hardware, with full control over output behavior.

**Sample close** (rewrite in chapter voice):

> Phase 12 is complete. Three chapters covered the full inference-engineering arc — from how the forward pass runs (Ch 17), through how the weights are stored (Ch 18), to how the output is decided (Ch 19). A modern production stack uses optimizations from all three: KV cache + continuous batching + INT4 weights + nucleus sampling + (for agents) constrained decoding. Combined effect: an order-of-magnitude operational cost reduction vs naive inference, with full control over the model's behavior.
>
> **Phase 13 opens next with capabilities.** Where Phase 12 made the model *deployable*, Phase 13 makes it *useful*: reasoning (Ch 20) covers chain-of-thought, deliberation, and modern reasoning models like o1 / R1; tools (Ch 21) covers how the model calls external APIs; retrieval-augmented generation (Ch 22) covers RAG; multimodal (Ch 23) covers vision and audio. **From this chapter forward, deployment is assumed and the focus shifts to building useful systems on top of deployed models.**

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 19, slug: 'ch19-sampling', title: 'Sampling', partNum: 6, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch19-sampling/index.astro && rm src/pages/ch19-sampling/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch19-sampling/`** renders with:
   - Chapter eyebrow ("Chapter 19") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 4, 6)
   - 2 `<WidgetFrame>` placeholders (sections 4 and 8)
   - Labeled equations `<Equation label="19.temperature">`, `<Equation label="19.nucleus">`, `<Equation label="19.constrained">`
   - At least 5 callouts (the section-1 aside about leverage, MC1 in section 2, the top-k historical aside in section 3, MC2 in section 4, the per-model defaults note in section 5, MC6 in section 6, the beam-search aside in section 7 — pick 5)
3. **Sidebar:** Ch 1-18 published; Ch 19 active (draft); Ch 20-30 dimmed
4. **Prev/next nav at bottom of Ch 19:** prev = Ch 18 (active); next = Ch 20 (disabled)
5. **TOC on Ch 19** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3700 and 4400 words
7. **Production recipes table** in section 5 renders correctly (Markdown table with 6 rows)
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 87 and 88 own them.
- ❌ **Do not write exercises.** Session 88 owns.
- ❌ **Do not flip Ch 19's status to `'published'`.** Session 88 owns.
- ❌ **Do not derive Mirostat math.** Brief mention only.
- ❌ **Do not derive regex-to-FSM compilation.** Cite Willard & Louf 2023; explain the masking concept.
- ❌ **Do not enumerate every constrained-decoding library.** Cover Outlines, JSON mode, Llama.cpp grammar. That's enough.
- ❌ **Do not cover diverse-beam-search variants.** Brief mention of vanilla beam search only.
- ❌ **Do not modify Ch 1-18.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch19-sampling/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch19-sampling/index.astro 2>/dev/null || true
git commit -m "session 86: Ch 19 prose — sampling (closes Phase 12)"
git push origin main
```

---

## Notes for the session author

**On the slightly lighter voice:**
Ch 19 is the closing chapter of Phase 12. The voice should be **slightly lighter than Ch 18** — sampling algorithms are conceptually clean; the chapter doesn't need to grind through derivations. **The reader should feel a satisfying close to the deployment trilogy** — algorithms simple; impact huge; mental model complete.

**On the from-logits-to-text framing:**
Section 1's role is to position the chapter clearly: **sampling is the post-forward-pass step**. The "microseconds per token" callout grounds the leverage ratio — small code, big impact. **This framing makes the chapter's importance immediately apparent.**

**On the temperature bridge to Ch 16:**
Section 2 explicitly references Ch 16's distillation temperature: "**Same math; different purpose.**" Notes-for-author: this should feel like a callback that rewards the reader who remembered. The mathematical reuse (same softmax scaling) is genuine; the purpose is different (creativity dial here; dark knowledge there).

**On section 4 being the chapter's pedagogical center:**
Top-p is the modern default. Section 4 is the longest section (600 words target) and gets:
- The boxed equation `19.nucleus`
- A detailed explanation of the adaptive insight
- The runnable code with the "nucleus size adapts to distribution shape" demo
- The MC2 callout about combining with top-k as safety net
- The marquee widget placeholder

Notes-for-author: "**Top-p is the chapter's pedagogical center.** It's the modern default, the conceptual pinnacle of stochastic sampling, and the widget will make its adaptive behavior visceral."

**On the recipes table being the most operationally useful artifact:**
Section 5's recipes table tells the reader **exactly what defaults to use** for each use case:
- Chat: $T = 0.7$ + top-p $= 0.95$ + mild repetition
- Code: $T = 0.2 - 0.5$ + top-p $= 0.95$
- Reasoning: $T = 0.6 - 0.7$ + top-p $= 0.95$
- Etc.

**This table is the most directly actionable content in the chapter.** Reader can copy these defaults into their own code.

**On the per-model defaults caveat in section 5:**
The recipes table is followed by a callout: "**Different models prefer different sampling configurations.**" Notes-for-author: "Tune per-model in practice." The reader should know that the defaults are guidance, not laws.

**On repetition penalties being a small section:**
Section 6 is shorter (400 words) because the three mechanisms (frequency, presence, n-gram) are conceptually simple. The MC6 callout — "modern RLHF'd models rarely need strong repetition penalties" — is the operationally most important takeaway.

**On beam search being honestly framed:**
Section 7 explains beam search and then explains why it's rare in modern LLM serving. **Don't oversell its remaining use cases** — they're niche.

**On section 8 closing Phase 12:**
Section 8 has dual function: (a) cover constrained decoding (production-critical for agents); (b) close Phase 12 with the trilogy summary. **The closing should feel earned**: the reader has traveled from KV cache (Ch 17) through quantization (Ch 18) to sampling (Ch 19), and now Phase 12 is complete. **Phase 13 opens with anticipation.**

**On the widget placements:**
- **Marquee (Sampling Distribution Visualizer)** in section 4: where the modern default is introduced. Reader sees nucleus adapting to distribution shape.
- **Secondary (Constrained Decoding Visualizer)** in section 8: practically motivating (JSON mode is operationally huge). Reader sees FSM masking step-by-step.

**On the 3 runnable code blocks:**
- Section 2 (greedy + temperature): reader sees the simplest sampling strategies; baseline
- Section 4 (top-p with adaptive nucleus): reader implements the modern default
- Section 6 (repetition penalties): reader implements all three penalty types

Three runnables, ascending complexity, all in early sections.

**Pedagogical claim of the chapter:**
"Sampling is the highest leverage-to-complexity ratio in Phase 12. A few lines of code (top-p, temperature, mild repetition penalty) transforms output quality. Top-p (nucleus sampling) is the modern default because it adapts to distribution shape — small nucleus at peaked confidence, large at uncertainty. Production recipes vary by use case but the chat default ($T = 0.7$, top-p $= 0.95$, mild penalty) covers most needs. Constrained decoding via FSM masking enables structured outputs for agents — essential for tool-using systems. **With Ch 19 complete, Phase 12 is complete and the full inference-engineering arc is in place.**"

**Phase 12 closing tone:**
The closing should feel like a satisfying close — algorithms simple; impact huge; deployment trilogy complete. **Phase 13 opens with anticipation**, not abruptness. Bridge to capabilities (reasoning, tools, RAG, multimodal) with enthusiasm — the deployable model is now ready to be made useful.

Build with care.
