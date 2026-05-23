# Chapter 19 — Sampling: research

> Curated source material for Chapter 19's build sessions. **The final chapter of Phase 12 (Inference).** Where Ch 17 reduced wasted computation and Ch 18 reduced bits per parameter, Ch 19 covers how decisions are made about which token to emit, given the logits. **Conceptually clean** compared to Ch 18: the algorithms are short; the engineering tradeoffs are clear; the operational reality (chat models default to temperature ~0.7 + top-p ~0.95) is well-understood. **The chapter that closes the inference-engineering arc** and bridges to Phase 13 capabilities. Single-topic chapter; uses the **4-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Sampling

**Premise:** A trained transformer's forward pass produces logits — a vector of $V$ scores, one per vocabulary token. **Sampling** is the algorithm that turns logits into the next emitted token. The choice matters enormously: greedy decoding produces robotic, repetitive text; pure-random sampling produces incoherent nonsense; carefully-designed strategies (temperature + nucleus + repetition penalty) produce natural, varied, useful text. **This chapter is about that choice.**

**Two flavors of decoding covered:**

1. **Stochastic sampling**: temperature, top-k, top-p, min-p, repetition penalties. The dominant paradigm for LLM serving. Produces a distribution over next tokens; samples from it.
2. **Search-based decoding**: beam search and variants. Explore multiple paths; pick the best. **Dominant pre-LLM (NMT era); rare in modern LLM serving** but worth understanding.

**A third specialized topic:**

3. **Constrained decoding**: enforce structural constraints (JSON, regex, grammars) during sampling. Critical for production agents and tool-using models.

**Out of scope (other chapters):**
- KV cache, batching, Flash Attention (Ch 17) — already covered
- Quantization (Ch 18) — already covered
- Reasoning (Ch 20) — covered later; chain-of-thought *uses* sampling but isn't *about* sampling
- Tool use (Ch 21) — uses constrained decoding heavily but isn't *about* it

**In scope and locked:**
- **Greedy decoding** (argmax) as baseline
- **Temperature** as the global softening knob
- **Top-k** as the simplest truncation
- **Top-p (nucleus)** as the modern default
- **Min-p** as a recent variant
- **Repetition penalties**: frequency, presence, n-gram blocks
- **Beam search** and why it's less common in LLM era
- **Constrained decoding**: JSON mode, regex, grammar enforcement
- **Mirostat** briefly as adaptive sampling
- **Production recipes**: chat, code, reasoning each have different defaults
- **Interaction with speculative decoding** (bridge to Ch 17)

**Suggested chapter structure** (8 sections):

1. Why sampling matters — from logits to text (~400 words)
2. Greedy and temperature (~500 words)
3. Top-k sampling (~400 words)
4. Top-p (nucleus) sampling (~600 words — modern default)
5. Combining strategies (~500 words)
6. Repetition penalties (~400 words)
7. Beam search and constrained decoding (~600 words)
8. Modern recipes and Phase 12 closeout (~400 words)

Target: ~3800 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Fan et al. 2018 — "Hierarchical Neural Story Generation"
- **arXiv:** [1805.04833](https://arxiv.org/abs/1805.04833)
- **What it contributed:** introduced **top-k sampling**. Idea: restrict next-token choices to the top $k$ most-likely tokens; renormalize; sample. Reduces tail-noise without committing to deterministic greedy.
- **For the chapter:** central reference for section 3.

### Holtzman et al. 2019 — "The Curious Case of Neural Text Degeneration"
- **arXiv:** [1904.09751](https://arxiv.org/abs/1904.09751)
- **What it contributed:** introduced **top-p (nucleus) sampling**. **Diagnostic insight**: pure stochastic sampling from the full distribution produces incoherent text because most probability mass is concentrated on a small "nucleus" of tokens, but the long tail contributes catastrophic noise. **The fix**: restrict to the smallest set of tokens whose cumulative probability exceeds $p$. **Made nucleus sampling the default for LLM serving.**
- **For the chapter:** central reference for section 4.

### Basu et al. 2020 — "Mirostat: A Neural Text Decoding Algorithm that Directly Controls Perplexity"
- **arXiv:** [2007.14966](https://arxiv.org/abs/2007.14966)
- **What it contributed:** **Mirostat** — adaptive sampling that maintains a target perplexity. Adjusts the truncation threshold dynamically based on the model's recent outputs. Less common in production but conceptually interesting.

### Willard & Louf 2023 — "Efficient Guided Generation for Large Language Models" (Outlines)
- **arXiv:** [2307.09702](https://arxiv.org/abs/2307.09702)
- **What it contributed:** **regex-constrained decoding** via finite-state machine masking. Pre-compile a regex to an FSM; at each decode step, mask out tokens that would violate the FSM transitions. **Production-grade JSON, regex, and grammar enforcement.**
- **For the chapter:** central reference for section 7 constrained decoding.

### Geng et al. 2023 — "Grammar-Constrained Decoding"
- **arXiv:** [2305.13971](https://arxiv.org/abs/2305.13971)
- **What it contributed:** generalizes regex masking to **context-free grammars**. Used in production tools like Llama.cpp's grammar mode and many JSON-mode implementations.

### Beurer-Kellner et al. 2023 — "LMQL: Programming Large Language Models" / Various
- **arXiv:** [2212.06094](https://arxiv.org/abs/2212.06094)
- **What it contributed:** language-model-aware programming via **constrained decoding as a first-class abstraction**. Programmatic control over what the model emits.

### Nguyen et al. 2024 — "Min-p Sampling"
- **arXiv:** [2407.01082](https://arxiv.org/abs/2407.01082)
- **What it contributed:** **min-p sampling** — keep tokens whose probability is at least a fraction $p_{\min}$ of the top token's probability. Adapts the truncation threshold to the distribution's peakedness. Recent variant; gaining traction.

### Microsoft 2024 — "Guidance" (open-source library)
- A constrained-decoding library widely used in production. Demonstrates the regex-FSM and grammar-FSM approaches at engineering scale.

---

## Core concepts

### Concept 1: From logits to text — the sampling step

The model's forward pass produces **logits**: an unnormalized score vector $z \in \mathbb{R}^V$ where $V$ is the vocabulary size (e.g., 50,257 for GPT-2; 128,000 for Llama 3).

**Step 1**: softmax converts logits to a probability distribution:
$$p_i = \frac{\exp(z_i)}{\sum_j \exp(z_j)}$$

**Step 2**: sampling algorithm produces a token index $i^*$. The choice of sampling algorithm determines whether the next token is selected greedily, restricted to a top-k subset, restricted to a nucleus by cumulative mass, or some combination.

**Step 3**: the token is emitted, appended to the sequence, and the cycle repeats for the next position (with KV cache updated; Ch 17 §2).

**The sampling step takes a fraction of a microsecond per token** — negligible compared to the forward pass. **Its impact on output quality is enormous.**

### Concept 2: Greedy decoding and temperature

**Greedy decoding** = argmax: emit the highest-probability token at each step.

**Pros**: deterministic; reproducible; sometimes the "highest-quality" choice for short, factual answers.

**Cons**:
- **Repetitive**: greedy text loops ("the cat sat on the the cat sat on the").
- **Robotic**: lacks the natural variation of human text.
- **Brittle**: an early greedy mistake compounds across the rest of the sequence.

**Temperature scaling** is the simplest stochastic generalization. Divide logits by $T$ before softmax:

$$p_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$

- $T = 1$: standard sampling (the "natural" distribution).
- $T < 1$: sharpens the distribution (more conservative; closer to greedy as $T \to 0$).
- $T > 1$: softens the distribution (more random; closer to uniform as $T \to \infty$).

**Typical values:**
- $T = 0$ (or near-zero): deterministic for factual extraction, code completion at the "definite" tokens
- $T = 0.7$ - $1.0$: default for chat / creative writing
- $T = 1.2$ - $1.5$: for diverse generations (brainstorming, story writing)

```mdx
<Equation label="19.temperature">
$$p_i(T) = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$
</Equation>
```

**Reader note**: temperature reappears in Ch 16's **temperature scaling for distillation** but used differently — there it was to *reveal* the dark knowledge in the teacher's distribution. Same mathematical operation; different purpose.

### Concept 3: Top-k sampling

**The problem with pure temperature sampling**: at $T = 1$, the tail of the distribution (tokens with probability $<10^{-6}$) still contributes occasionally. Most of them are nonsensical given the context. **Tail noise** is real.

**Top-k sampling** (Fan et al. 2018):
1. Sort tokens by probability; keep only the top $k$.
2. Renormalize: $\tilde p_i = p_i / \sum_{j \in \text{top-}k} p_j$.
3. Sample from the truncated distribution.

**Typical values**: $k = 50$ (older default), $k = 40$ (chat), $k = 20$ (more focused).

**Pros**: simple; fast; works well in many cases.

**Cons**: $k$ is fixed regardless of distribution shape. At a **peaked distribution** (high confidence), $k = 50$ is wasteful — only the top 5 matter. At a **flat distribution** (uncertain), $k = 50$ may be too restrictive — important options excluded.

**Top-k's fixed-size limitation motivates top-p**, which adapts.

### Concept 4: Top-p (nucleus) sampling

**Holtzman et al. 2019** observed that the right truncation set depends on the distribution's *peakedness*, not a fixed size. **Top-p** (nucleus) sampling truncates to the smallest set whose cumulative probability exceeds $p$:

1. Sort tokens by probability (descending).
2. Find the smallest $k$ such that $\sum_{i=1}^{k} p_i \geq p$.
3. Keep only those $k$ tokens; renormalize.
4. Sample.

**Typical values**: $p = 0.9$ (older default), $p = 0.95$ (chat default), $p = 0.8$ (more focused).

**Why it's better than top-k**:
- **Peaked distributions** (high confidence): $k$ ends up small naturally
- **Flat distributions** (uncertain): $k$ grows to include more options
- **Adapts to the distribution** instead of imposing a fixed budget

**Nucleus sampling is the modern default for LLM serving.** GPT, Claude, Llama, Gemini APIs all default to some form of top-p.

```mdx
<Equation label="19.nucleus">
$$\text{Nucleus}_p(z) = \{i : i \text{ is among the smallest set with } \sum p_i \geq p\}$$
</Equation>
```

**Min-p variant** (Nguyen 2024): keep tokens with $p_i \geq p_{\min} \cdot \max_j p_j$. Adapts to the *top probability* rather than cumulative mass.

### Concept 5: Combining strategies

**In production, multiple strategies are combined.** A typical chat decoding step:

1. Compute logits $z$
2. Apply temperature: $z' = z / T$
3. Apply nucleus (top-p) truncation: keep tokens whose cumulative probability ≥ $p$
4. Apply repetition penalty (Concept 6): downweight tokens that recently appeared
5. Softmax over the surviving tokens
6. Sample

**Order matters**:
- Temperature first: changes the distribution shape
- Then truncation: top-p applied to the softened distribution
- Then repetition penalty: applied to surviving tokens
- Finally softmax: convert to a distribution; sample

**Common configurations**:

| Use case | Temperature | Top-p | Top-k | Rep penalty |
|---|---|---|---|---|
| Factual extraction | 0.0 - 0.3 | (any) | (any) | mild (1.05) |
| Chat / instruction | 0.7 | 0.95 | (off) | mild (1.05) |
| Creative writing | 1.0 - 1.2 | 0.95 | (off) | moderate (1.1) |
| Code completion | 0.2 - 0.5 | 0.95 | (off) | (off) |
| Reasoning | 0.6 - 0.7 | 0.95 | (off) | (off) |
| Brainstorming | 1.2 - 1.5 | 0.95 - 1.0 | (off) | (off) |

**Most production APIs default to**: $T = 1.0$, top-p $= 1.0$ (effectively off), no top-k, no repetition penalty. **Users adjust based on use case.**

### Concept 6: Repetition penalties

**The problem**: even with stochastic sampling, models can fall into repetition loops — particularly with low temperature or peaked distributions.

**Three common penalty mechanisms**:

**1. Frequency penalty** (used by OpenAI API): each token's logit gets reduced proportional to how many times it has appeared in the generation so far.
$$z'_i = z_i - \alpha \cdot \text{count}_i$$

**2. Presence penalty**: each token's logit is reduced by a fixed amount if it has appeared at all.
$$z'_i = z_i - \alpha \cdot \mathbb{1}[\text{count}_i > 0]$$

**3. N-gram blocking** (more aggressive): if generating token $t$ would produce an n-gram (e.g., 3-gram) that already appeared, set $p_t = 0$.

**Typical values**:
- Frequency penalty: $\alpha = 0.0 - 1.0$ (typically 0.0 - 0.3)
- Presence penalty: $\alpha = 0.0 - 1.0$ (typically 0.0 - 0.5)
- N-gram blocking: block 3-grams or 4-grams that have appeared

**Tradeoffs**:
- **Too low**: repetition loops persist
- **Too high**: model avoids natural repetition (e.g., common words like "the") — degenerate output
- **N-gram blocking**: can prevent legitimate repetition (proper nouns, idiomatic phrases)

**Modern instruction-tuned models** (post-SFT/RLHF) **rarely need strong repetition penalties** — the training already discourages loops. A mild frequency penalty (~0.1) is sufficient.

### Concept 7: Beam search

**Beam search** is a search-based decoding strategy: at each step, maintain $B$ partial sequences (the "beam"); for each, consider top-$k$ next-token extensions; keep the top-$B$ overall.

**Mechanics**:
1. Start with $B$ identical empty (or prompt) sequences.
2. For each sequence in the beam, compute logits.
3. Expand each: produce $B \times k$ candidates.
4. Score candidates by cumulative log-probability.
5. Keep the top $B$ overall. Repeat.

**Pros**:
- **Higher likelihood**: by exploring multiple paths, beam search finds higher-probability sequences than greedy or sampling
- **Best for machine translation** (NMT era): when there's a "right" output, beam search excels

**Cons**:
- **Repetitive at high beam width**: famously degenerate (Holtzman 2019)
- **Computational cost**: $B \times$ more forward passes
- **Bland output**: maximum-likelihood sequences are often "safe" and dull
- **Rare in modern LLM serving**: chat and creative use cases benefit more from stochastic sampling

**When to use beam search**:
- **Translation tasks** with discrete correct answers
- **Reasoning over short outputs** where high-likelihood matters
- **NOT for creative or open-ended generation**

**Modern stack**: most LLM APIs *don't expose beam search* as a sampling option. It's available in `transformers.generate()` but rarely the default.

### Concept 8: Constrained decoding

**The problem**: sometimes you need the output to follow a structural constraint:
- JSON output for an agent's tool call
- Regex match for a parseable field
- A grammar like "valid Python" or "valid SQL"

**Naive approach**: prompt the model to follow the format; parse the output; retry on failure. **Brittle and slow.**

**Constrained decoding** (Outlines, Willard & Louf 2023; Grammar-Constrained Decoding, Geng 2023):
1. Compile the constraint to a **finite-state machine** (or context-free grammar).
2. At each decode step, **mask out tokens** that would violate the FSM transitions.
3. Sample only from the surviving (valid) tokens.

**The math**:
- Compute logits as usual
- Determine which tokens are valid given current FSM state
- Set invalid token logits to $-\infty$ (probability 0)
- Apply usual sampling (temperature, top-p, etc.) over the masked distribution

**Why it works**:
- The model's predictions remain coherent — it picks the *most likely valid token*
- Output is **guaranteed** to satisfy the constraint
- Latency overhead is small (FSM lookup per token)

```mdx
<Equation label="19.constrained">
$$z'_i = \begin{cases} z_i & \text{if token } i \text{ is valid at current state} \\ -\infty & \text{otherwise} \end{cases}$$
</Equation>
```

**Production examples**:
- **OpenAI's JSON mode** (response_format = json_object): constrains output to valid JSON
- **Outlines library**: pre-compiles regex/grammar; works with any open-source LLM
- **Llama.cpp grammar mode**: BNF grammar enforcement
- **Anthropic's structured outputs**: uses constrained decoding under the hood

**For agent / tool-using models** (Ch 21), constrained JSON is *essential* — a malformed tool call breaks the entire downstream pipeline.

### Concept 9: Interaction with speculative decoding

**Bridge back to Ch 17 §6**: speculative decoding uses a small draft model to propose $k$ tokens; the big model verifies them in one forward pass.

**Sampling interaction**:
- The draft model emits a token using its own sampling (typically same strategy as the big model)
- The big model's verification step uses **rejection sampling** against the draft's distribution
- The "lossless" variant (Chen 2023): the final emitted token's distribution exactly matches what the big model alone would produce

**The takeaway**: speculative decoding doesn't change *what* you sample (your nucleus + temperature etc.); it changes *how* you sample (in parallel batches with rejection correction). Sampling and speculative decoding compose cleanly.

### Concept 10: Modern recipes

Production teams settle on per-use-case sampling defaults. Some real defaults:

**Chat (OpenAI default)**: $T = 1.0$, top-p $= 1.0$, no top-k, no penalties. The base distribution is well-shaped after RLHF.

**Chat (Anthropic default for Claude API)**: $T = 1.0$. Other parameters per-request.

**Llama chat (Meta recommendation)**: $T = 0.6$, top-p $= 0.9$ — slightly more conservative.

**Code completion (Codex, Copilot)**: $T = 0.2$, top-p $= 0.95$ — high confidence, low variance.

**Creative writing**: $T = 1.0$ - $1.2$, top-p $= 0.95$ — more variance, exploration.

**Reasoning models (o1, R1)**: $T = 0.6$ - $0.7$, top-p $= 0.95$ — balance between exploration during chain-of-thought and convergence to the final answer.

**Constrained / structured output**: any temperature; constrained decoding enforces shape.

---

## Glossary

- **Logits**: unnormalized scores from the model; shape $(V,)$ at each decode step
- **Softmax**: $p_i = \exp(z_i) / \sum_j \exp(z_j)$
- **Greedy / argmax**: emit the highest-probability token
- **Temperature ($T$)**: global softening factor; $T < 1$ sharpens, $T > 1$ softens
- **Top-k**: restrict to top $k$ probabilities; renormalize
- **Top-p / nucleus**: restrict to smallest set with cumulative probability ≥ $p$
- **Min-p**: keep tokens with $p_i \geq p_{\min} \cdot \max_j p_j$
- **Frequency penalty**: reduce logit proportional to token count
- **Presence penalty**: reduce logit if token has appeared at all
- **N-gram blocking**: prevent any $n$-gram from repeating
- **Beam search**: maintain $B$ partial sequences; pick top by cumulative log-prob
- **Constrained decoding**: mask invalid tokens via FSM/grammar
- **Mirostat**: adaptive sampling targeting a fixed perplexity
- **TTFT / TPOT**: Time To First Token / Time Per Output Token (Ch 17)

---

## Pedagogical analogies

### 1. Temperature as a thermostat
Temperature in LLM sampling is mathematically identical to temperature in statistical mechanics: it controls the "thermalization" of the distribution. At $T = 0$, the distribution collapses to the most-likely state (deterministic). At $T = \infty$, it spreads to uniform (random). **The "creativity dial" on a chat interface is literally adjusting a temperature.**

Best used for: section 2 temperature.

### 2. Top-k as a shortlist
Top-k sampling is like hiring: HR sends you the top 50 candidates regardless of how qualified the applicant pool is. **Fixed budget; doesn't adapt.** If the pool is excellent (peaked distribution), most of the 50 are good. If the pool is mediocre (flat distribution), you might be missing strong candidates outside the top 50.

Best used for: section 3 top-k.

### 3. Top-p as a dynamic shortlist
Top-p sampling is the *adaptive* version: "send me as many candidates as we need to capture 95% of the qualified pool." If the pool is excellent, you get a short list. If it's mediocre, you get a long one. **The shortlist size adapts to the situation.**

Best used for: section 4 nucleus.

### 4. Beam search as exploring multiple paths
Imagine a maze with many forks. Greedy decoding takes the first turn that looks good. Beam search explores $B$ paths in parallel — at each fork, it remembers the top $B$ partial paths it's seen, expanding them all. Eventually one path "wins" by being best overall. **Higher likelihood; slower; sometimes too conservative.**

Best used for: section 7 beam search.

### 5. Constrained decoding as guard rails
Constrained decoding is like driving with guard rails on a winding road. The car (the model) makes its own decisions about acceleration and direction, but the guard rails ensure it never goes off the cliff. **The model's predictions stay coherent; the guard rails just keep the output valid.**

Best used for: section 8 constrained.

---

## Common misconceptions

### MC1: "Higher temperature is always more creative."
**Reality:** false at the extremes. **At $T \gtrsim 2$, the distribution approaches uniform** — most-likely tokens lose their advantage, and the output becomes incoherent. **The "creativity sweet spot" is typically $T = 0.7 - 1.2$**; above 1.5, quality degrades rapidly.

### MC2: "Top-p is always better than top-k."
**Reality:** mostly true but not always. **Top-p adapts to the distribution shape**; top-k is fixed. For most uses, top-p is preferred. **But when distributions are typically peaked**, fixed top-k (e.g., $k = 20$) can be slightly more efficient. **In practice, most production stacks use top-p**, sometimes combined with a "safety net" top-k (like $k = 50$) to bound the truncation set in pathological cases.

### MC3: "Greedy is deterministic and best for accuracy."
**Reality:** false for most LLM use cases. **Greedy decoding underperforms sampling on long-form generation** because early mistakes compound. For factual extraction at short lengths, greedy can be fine; for chat or reasoning across hundreds of tokens, **stochastic sampling with moderate temperature** (0.6 - 0.7) consistently produces higher-quality outputs.

### MC4: "Beam search is best for translation."
**Reality:** **true historically (NMT era), less true now.** Modern LLMs trained with RLHF produce well-shaped output distributions; stochastic sampling competes well with beam search even on translation tasks. **Most production LLM APIs don't expose beam search.**

### MC5: "Sampling is independent of the model."
**Reality:** false. **Sampling decisions depend on logit shape.** A well-aligned model (RLHF + DPO) produces peakier, more reliable distributions where simple sampling works well. A base model with high variance benefits more from aggressive truncation. **Sampling defaults should match the model's training stage.**

### MC6: "Repetition penalties always improve quality."
**Reality:** false at high values. **High repetition penalties** (>1.5) **prevent natural repetition** — common words like "the" become rare. Output becomes unnatural. **Modern RLHF'd chat models rarely need strong repetition penalties** because RLHF training already discourages loops.

### MC7: "Constrained decoding hurts quality."
**Reality:** **partly true but small in practice.** Masking invalid tokens does *reduce* the choice set, which can slightly hurt fluency. But for **JSON / structured outputs**, the alternative (post-hoc parsing + retry) is far worse. The latency overhead is small; the reliability gain is huge. **For agents and tool-using models, constrained decoding is essential.**

### MC8: "Sampling is the slow part of inference."
**Reality:** false. **Sampling is microseconds per token**; the forward pass is hundreds of milliseconds. **The bottleneck is always the forward pass** (which is why Ch 17's optimizations matter). Sampling-level optimizations exist (efficient top-p kernels, etc.) but they're marginal.

---

## Tricky implementation details

### TID1: Sorting in top-k and top-p
Naive top-k requires sorting the entire $V$-sized logits vector. For $V = 100,000$, this is wasteful. **Production implementations use partial sorts** (e.g., `np.argpartition` or PyTorch's `topk`) which are O($V \log k$) instead of $O(V \log V)$.

### TID2: Numerical stability in softmax
At low temperatures, $\exp(z_i / T)$ overflows. **Always subtract the max** before exponentiating:
$$p_i = \frac{\exp((z_i - \max(z)) / T)}{\sum_j \exp((z_j - \max(z)) / T)}$$

This is mathematically identical but avoids overflow.

### TID3: Top-p with tied probabilities
What if the $k$-th and $(k+1)$-th tokens have equal probability? Standard implementation: include both, or use the smaller cumulative mass; the choice doesn't materially affect quality.

### TID4: Min-p threshold computation
Min-p keeps tokens with $p_i \geq p_{\min} \cdot p_{\max}$. The threshold uses the *post-softmax* probability, **not** the logit. Common bug: thresholding on logits directly.

### TID5: Repetition penalty applied to logits or probabilities?
Convention: **applied to logits before softmax**. OpenAI's frequency penalty: $z'_i = z_i - \alpha \cdot \text{count}_i$. Some implementations apply it to probabilities, which is mathematically different and inconsistent.

### TID6: N-gram blocking efficiency
Naive: check all previous n-grams at each decode step. For 4-grams over a 2000-token context: scan 2000 trigrams. **Production**: use a hash set of seen n-grams; $O(1)$ lookup. Mostly used in beam search; rare in standard sampling.

### TID7: Beam search with repetition
Vanilla beam search produces highly repetitive outputs (because high-likelihood sequences include common phrases). **Fix**: add a "no-repeat-n-gram" constraint or a length penalty. Modern variants (diverse beam search, contrastive beam search) address this.

### TID8: Constrained decoding state caching
The FSM/grammar state changes with each emitted token. **Cache the state across decode steps**; don't recompute from scratch. Critical for long generations to avoid quadratic overhead.

### TID9: Sampling under speculative decoding
The draft model and big model can use different sampling strategies, but for **lossless speculative decoding** (Chen 2023), the rejection sampling step depends on the *probabilities* (not raw logits) of both models at each position. **Both must apply the same temperature** for cleanest behavior.

### TID10: JSON mode quirks
OpenAI's JSON mode and similar implementations don't just constrain to valid JSON — they often require **explicit prompting** ("respond in JSON") to activate. Why: the FSM only constrains *given* the model is trying to emit JSON. The prompt sets the intent.

---

## Reference implementations

### Greedy, temperature, top-k, top-p

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

def top_k_sample(logits, k=50, T=1.0, rng=None):
    """Top-k truncation + sampling."""
    if rng is None: rng = np.random
    z = logits / T
    # Find top-k indices
    top_idx = np.argpartition(z, -k)[-k:]
    mask = np.full_like(z, -np.inf)
    mask[top_idx] = z[top_idx]
    p = softmax(mask)
    return int(rng.choice(len(p), p=p))

def top_p_sample(logits, p=0.95, T=1.0, rng=None):
    """Top-p (nucleus) truncation + sampling."""
    if rng is None: rng = np.random
    z = logits / T
    probs = softmax(z)
    # Sort by probability (descending)
    sorted_idx = np.argsort(probs)[::-1]
    sorted_probs = probs[sorted_idx]
    # Cumulative sum; find cutoff
    cumsum = np.cumsum(sorted_probs)
    nucleus_size = int(np.searchsorted(cumsum, p) + 1)
    nucleus_idx = sorted_idx[:nucleus_size]
    # Mask
    mask = np.full_like(z, -np.inf)
    mask[nucleus_idx] = z[nucleus_idx]
    p_final = softmax(mask)
    return int(rng.choice(len(p_final), p=p_final))

# Demo: synthetic logits + various samplers
np.random.seed(0)
V = 100
logits = np.random.normal(0, 1, V)
# Peaked: one clear winner
logits[5] += 4.0
# Make 10 sampling decisions
print(f"{'Method':<25} | sampled tokens")
print("-" * 70)
rng = np.random.RandomState(42)
for name, fn in [
    ("Greedy",         lambda: greedy(logits)),
    ("Temp=0.7",       lambda: temperature_sample(logits, T=0.7, rng=rng)),
    ("Temp=1.5",       lambda: temperature_sample(logits, T=1.5, rng=rng)),
    ("Top-k k=10",     lambda: top_k_sample(logits, k=10, T=1.0, rng=rng)),
    ("Top-p p=0.9",    lambda: top_p_sample(logits, p=0.9, T=1.0, rng=rng)),
    ("Top-p p=0.95",   lambda: top_p_sample(logits, p=0.95, T=1.0, rng=rng)),
]:
    samples = [fn() for _ in range(10)]
    print(f"{name:<25} | {samples}")

print("\\nObservations:")
print("- Greedy always picks 5 (the peak)")
print("- Temperature=0.7 mostly picks 5 with occasional alternatives")
print("- Temperature=1.5 spreads across many tokens (more noisy)")
print("- Top-k restricts to top 10")
print("- Top-p adapts to the distribution; at peaked logits, nucleus is small")
```

### Top-p computation with cumulative-mass

```python
import numpy as np

def top_p_indices(probs, p=0.95):
    """
    Return the set of indices in the top-p nucleus.
    
    1. Sort by probability (descending)
    2. Cumulative sum; find the smallest k such that cumsum[k-1] >= p
    3. Return the corresponding indices
    """
    sorted_idx = np.argsort(probs)[::-1]
    sorted_probs = probs[sorted_idx]
    cumsum = np.cumsum(sorted_probs)
    # Smallest k with cumsum[k-1] >= p
    k = int(np.searchsorted(cumsum, p) + 1)
    return sorted_idx[:k], sorted_probs[:k], k

# Demo on different distribution shapes
def make_distribution(shape='peaked'):
    np.random.seed(0)
    z = np.random.normal(0, 1, 50)
    if shape == 'peaked':
        z[0] += 5.0
    elif shape == 'bimodal':
        z[0] += 3.0
        z[1] += 2.5
    # else: 'flat' — keep as-is
    return softmax(z)

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

for shape in ['peaked', 'bimodal', 'flat']:
    probs = make_distribution(shape)
    for p in [0.5, 0.9, 0.95]:
        _, _, k = top_p_indices(probs, p=p)
        print(f"  {shape:>8} | p={p}: nucleus has {k:>3} tokens")
    print()

print("Observations:")
print("- Peaked: nucleus is tiny (top 1-3 tokens dominate)")
print("- Bimodal: nucleus includes both peaks")
print("- Flat: nucleus is large (need many tokens to reach 95% mass)")
print("- This adaptive behavior is what makes top-p superior to fixed top-k.")
```

### Repetition penalty applied to logits

```python
import numpy as np

def apply_frequency_penalty(logits, token_counts, alpha=0.5):
    """
    Frequency penalty: reduce logit by alpha * count for each token.
    """
    return logits - alpha * token_counts

def apply_presence_penalty(logits, seen_tokens, alpha=0.5):
    """
    Presence penalty: reduce logit by alpha for tokens already seen.
    """
    penalty = np.zeros_like(logits)
    for t in seen_tokens:
        penalty[t] = alpha
    return logits - penalty

# Demo: simulate a generation step with both penalties
np.random.seed(0)
V = 100
logits = np.random.normal(0, 1, V)
logits[5] = 5.0    # Strong preference for token 5

# Simulate that token 5 has been emitted 3 times already
token_counts = np.zeros(V)
token_counts[5] = 3

print(f"Original logit for token 5: {logits[5]:.2f}")
print(f"After frequency penalty (alpha=0.5): {apply_frequency_penalty(logits, token_counts, 0.5)[5]:.2f}")
print(f"After presence penalty (alpha=0.5): {apply_presence_penalty(logits, {5}, 0.5)[5]:.2f}")
print(f"\\nFrequency penalty grows with count; presence is fixed regardless of count.")
print(f"Both reduce the probability of token 5 in the next sample.")
```

---

## Connections to other chapters

- **Ch 4 (Attention)**: the forward pass through attention layers produces the logits that sampling operates on.
- **Ch 7-10 (Pre-training)**: the base model's logit distribution shape depends on training. Well-trained models produce well-shaped distributions where simple sampling works.
- **Ch 13-14 (Post-training)**: RLHF/DPO sharpens the distribution (peakier outputs); modern chat models need less aggressive sampling.
- **Ch 16 (Distillation)**: temperature in distillation reveals the teacher's dark knowledge (Ch 16). Same operation; different use.
- **Ch 17 (Inference optimization)**: KV cache and continuous batching speed up the *forward pass*. Sampling happens after; its cost is tiny.
- **Ch 17 (Speculative decoding)**: the draft + verify pattern interacts with sampling (TID9).
- **Ch 18 (Quantization)**: quantization changes the forward-pass cost; sampling is independent.
- **Ch 20 (Reasoning)**: chain-of-thought generation uses sampling heavily — long sequences benefit from temperature tuning.
- **Ch 21 (Tool use)**: constrained decoding for JSON tool calls is essential.
- **Ch 22 (RAG)**: sampling for retrieval-augmented generation; temperature affects fidelity to context.

---

## Open questions for the chapter author

### Q1: How much math for top-p?
**Recommendation:** moderate. Section 4 includes the boxed definition `19.nucleus` and the description "smallest set with cumulative ≥ $p$". **Don't deep-dive into nucleus theory** — the algorithm is short; the runnable code makes it tangible.

### Q2: Beam search depth?
**Recommendation:** brief but honest. **Section 7 sketches the algorithm** and explains why it's less common in modern LLM serving. The reader should know it exists and when to consider it. **Don't enumerate diverse-beam variants** — too detailed for the chapter scope.

### Q3: Constrained decoding depth?
**Recommendation:** medium. **Section 8 covers FSM masking concept** and **lists production examples** (OpenAI JSON mode, Outlines, Llama.cpp grammar). **Don't derive regex-to-FSM** — that's a compiler topic.

### Q4: Mirostat depth?
**Recommendation:** brief. Mention in misconceptions or TIDs as "an interesting variant that adapts to perplexity"; **don't give it its own subsection.** Not yet mainstream.

### Q5: Production defaults?
**Recommendation:** prominent in the recipes table. **Reader should walk away knowing the defaults**: $T = 0.7$ + top-p = 0.95 for chat; $T = 0.2$ for code. These are operationally important.

### Q6: Widget candidates
1. **Sampling Distribution Visualizer (marquee):** show the same logits being sampled with various strategies (temperature, top-k, top-p). Sliders for each parameter; bars highlight which tokens survive truncation. Reader sees the modified distribution visually. **Recommended marquee.**
2. **Constrained Decoding Visualizer (secondary):** show a small JSON grammar; walk through a sample generation; visualize which tokens are valid vs invalid at each step. **Recommended secondary.** Practically motivating (JSON mode is operationally huge).

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 19 is a **single-topic chapter** (sampling). Uses the **4-file cadence**.

Planned file layout:
- File 109: research (this)
- File 110: page structure (~600 lines, 8 sections; runnables embedded)
- File 111: Sampling Distribution Visualizer marquee widget
- File 112: Constrained Decoding Visualizer secondary widget + exercises + closeout

**Pedagogical outcomes for the reader.** After Ch 19, the reader should be able to:
1. Explain why sampling matters (logits → text)
2. Apply temperature scaling for desired creativity level
3. Distinguish top-k and top-p; choose appropriately
4. Combine temperature + top-p in a production-realistic stack
5. Use repetition penalties without overusing them
6. Know when beam search is/isn't appropriate
7. Implement constrained decoding via FSM masking
8. Choose sampling defaults for chat / code / creative / reasoning use cases

Eight outcomes. Exercises hit outcomes 2, 3, 4, 7.

**Tonal framing**: clean and operational, slightly lighter than Ch 18. Sampling is the closing chapter of Phase 12 and conceptually accessible. **Concrete numbers**: temperature values, top-p values per use case, production defaults. **Honest tradeoffs**: greedy vs sampling for long-form; top-k vs top-p; constrained vs free generation.

**Phase 12 closing**: Ch 19 closes the inference-engineering arc. Where Ch 17 reduced wasted computation and Ch 18 reduced bits per parameter, **Ch 19 governs how the decoder actually picks tokens**. After Ch 19, **Phase 12 is complete**; Phase 13 (capabilities: reasoning, tools, RAG, multimodal) opens.

**Importance**: sampling is the most user-facing decision in inference — the "temperature dial" on every chat interface, the "JSON mode" on every agent. Engineers and product folks both need to understand it. **The chapter should feel like a satisfying close** — algorithms are simple; impact is huge; reader leaves Phase 12 with the full mental model for deploying LLMs.
