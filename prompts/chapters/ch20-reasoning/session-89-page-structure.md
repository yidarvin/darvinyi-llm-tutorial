# Session 89 — Chapter 20 page structure

> First chapter session for Chapter 20 ("Reasoning"). **The chapter that opens Phase 13.** Two-topic chapter: classic CoT era (Wei 2022 → self-consistency → ToT → ReAct) and modern reasoning era (PRMs → test-time compute scaling → o1, R1, Gemini Thinking). **Bridges the prompting-based reasoning of 2022-2023 to the trained reasoning paradigm of 2024-2025.** The chapter where deployable models become genuinely useful for complex tasks. Uses the **5-file cadence** (two-topic chapter).

---

## Read first (in this order)

1. **`research/ch20-reasoning/research.md`** — the source material. Every section, equation, code snippet, and misconception traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch14-alignment/session-61-page-structure.md`** — for the two-topic voice template (Ch 14 covered RLHF + DPO/RLVR; same two-era structural pattern)
4. **`prompts/chapters/ch19-sampling/session-86-page-structure.md`** — for the immediately preceding Phase 12 voice (Phase 13 builds on it)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 20 page. By end of session:

- `src/pages/ch20-reasoning/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch20-reasoning/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 20's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch20-reasoning/` with sidebar showing Ch 20 active, prev/next nav linking to Ch 19 (active) and Ch 21 (disabled)

**Tonal note:** Ch 20 is **the chapter where the curriculum's energy picks up.** Reader has finished Phase 12 (deployable models); now Phase 13 (useful systems) opens. The voice should reflect this shift: **forward-looking, slightly more excited than Phase 12's grounded engineering tone**. Concrete numbers (GSM8K 5% → 46% with CoT; R1 matching o1 on AIME 2024; o1 thinking for several minutes); honest about limits (reasoning traces aren't introspection; hard problems get the most benefit); careful about the paradigm shift (classic CoT era vs modern trained-reasoning era are *different* paradigms, not just refinements).

**Phase 13 opening context:** this chapter opens Phase 13 (Capabilities). After this: Ch 21 (Tool use), Ch 22 (RAG), Ch 23 (Multimodal). The opening should make this trajectory clear — readers see what's ahead and feel the buildup to agents (Phase 15).

**Chapter cadence:** Ch 20 uses the **5-file cadence** (two-topic chapter).

---

## Inputs

State of the repo after session 88 (Ch 19 complete, Phase 12 complete):

- Ch 1-19 all `'published'`
- `research/ch20-reasoning/research.md` exists
- `src/lib/chapters.ts` has Ch 1-19 `'published'`, Ch 20-30 `'planned'`
- No `src/pages/ch20-reasoning/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch20-reasoning/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch20-reasoning/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 20's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch20-reasoning
description: Reasoning — the capability that turns deployable models into useful systems. Two eras: classic CoT prompting (Wei 2022 chain-of-thought, Wang 2022 self-consistency, Yao 2023 tree-of-thoughts, Yao 2022 ReAct) and modern trained reasoning (Lightman 2023 process reward models, Snell 2024 test-time compute scaling, OpenAI o1, DeepSeek R1, Gemini Thinking). The chapter that opens Phase 13 — where deployable models become genuinely useful for math, code, and complex reasoning tasks. From "let's think step by step" prompts to RLVR-trained reasoning models.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~300 words) of opening.

**Sample opening** — rewrite in chapter voice:

> Phase 12 ended with deployable models — efficient, quantized, sampling cleanly. But a deployable model isn't automatically a *useful* one. For factual questions ("Who painted the Mona Lisa?"), direct generation works fine. For **hard reasoning** — math word problems, multi-step logic, code with subtle bugs, planning across many moves — direct generation often fails. The model commits to early decisions it can't revise. **Reasoning techniques** address this by giving the model space to think before answering.
>
> This chapter walks through reasoning's two-era arc. **The classic era (2022-2023)** discovered that *prompting* the model to "think step by step" dramatically improved accuracy. Wei et al. 2022 introduced chain-of-thought; Wang et al. 2022 added self-consistency (sample N traces, majority vote); Yao et al. 2023 generalized to tree-of-thoughts. These were *prompting* techniques — same model, different prompts. **The modern era (2024-2025)** trained reasoning directly. OpenAI's o1, DeepSeek's R1, Google's Gemini Thinking — all use RLVR (Chapter 14) to teach the model to produce long internal reasoning traces autonomously. **Test-time compute scaling** (Snell 2024) showed that more thinking time monotonically improves accuracy on hard problems.
>
> **Phase 13 opens here.** Reasoning is the natural starting point — it's the capability that turns a chat model into a problem-solving system. **Chapter 21 covers tool use** (extending ReAct into engineered systems). **Chapter 22 covers RAG.** **Chapter 23 covers multimodal**. Together, Phase 13 turns deployable models into useful ones. After Phase 13: safety/interpretability/evaluation (Phase 14), then agents (Phase 15). The exciting half of the curriculum begins.

### Section 1: Why reasoning matters

**Heading:** `## Why reasoning matters`
**Word target:** ~400
**Sub-headings:** `### The limit of direct generation`, `### The chapter's two-era arc`

**Teaching beats:**

**The limit of direct generation:**
1. A trained transformer's forward pass produces tokens autoregressively. For *facts*, this works. For *reasoning*, it often doesn't.
2. **The intuition**: a single forward pass commits to early decisions. Once the model emits "the answer is 120," it can't easily revise.
3. **Empirical evidence**: GPT-3 on GSM8K (math word problems) — **direct generation: ~5%**. With reasoning techniques: 50%+.

**The chapter's two-era arc:**
4. **Classic era (2022-2023)**: reasoning via prompting. Model unchanged; prompt structure differs.
5. **Modern era (2024-2025)**: reasoning *trained in* via RL. Models autonomously produce long internal reasoning.
6. **Both eras are still relevant**: CoT prompting works on any model; modern reasoning models are state-of-the-art for hard tasks.

**Required callout** — type `note`: Reasoning is not just "longer answers." **Reasoning is *intermediate computation* that the model performs before committing to a final answer.** A reasoning trace is the model's *scratch paper*. Even a perfectly-trained chat model benefits from CoT on hard problems because the extra tokens give the model more compute per query — each reasoning token attends back through the KV cache (Ch 17), building up state.

**No code in this section.** Setup.

**Connection forward:** Section 2 covers the foundational technique — CoT.

### Section 2: Chain-of-thought prompting

**Heading:** `## Chain-of-thought prompting`
**Word target:** ~600 — IMPORTANT (foundational)
**Sub-headings:** `### Few-shot CoT`, `### Zero-shot CoT`, `### Why it works (and where it fails)`

**Teaching beats:**

**Few-shot CoT** (Wei et al. 2022):
1. Provide few-shot examples that include intermediate reasoning steps.
2. **The dramatic empirical finding**: GPT-3 on GSM8K — direct ~5%; CoT ~46%. PaLM 540B: direct 17%; CoT 57%.
3. **The model already had the reasoning capability**; CoT just *elicits* it.

**Zero-shot CoT** (Kojima et al. 2022):
4. **No exemplars needed**. Just append "Let's think step by step." to the prompt.
5. Works nearly as well as few-shot CoT in many cases.
6. **One of the most-cited single-sentence interventions in NLP.**

**Why it works (and where it fails):**
7. **Why it works**: extra tokens = extra compute per query. The KV cache builds up state across reasoning tokens.
8. **Where it fails**:
   - **Reasoning-answer gap**: trace can be correct, final answer wrong (or vice versa)
   - **Plausible-but-wrong traces**: the model can hallucinate reasoning that looks valid
   - **Prompt sensitivity**: phrasing matters more than it "should"

**The CoT template:**

```mdx
<Equation label="20.cot-template">
$$\text{prompt} \;\to\; \text{reasoning}_1, \text{reasoning}_2, \ldots, \text{reasoning}_k \;\to\; \text{answer}$$
</Equation>
```

**Required code** — `<RunnableCode>` showing zero-shot CoT example:

```python
# Pseudo: in production, this calls a real LLM API
def call_model(prompt):
    """Mock LLM that returns a fixed response for demo purposes."""
    if "step by step" in prompt.lower():
        return ("The cafeteria had 23 apples. They used 20 for lunch, so 23 - 20 = 3.\\n"
                "Then they bought 6 more, so 3 + 6 = 9.\\n"
                "The answer is 9.")
    else:
        # Direct prompt: model often gets it wrong
        return "The answer is 29."

question = "The cafeteria had 23 apples. If they used 20 to make lunch and bought 6 more, how many apples do they have?"

# Direct prompt
direct_prompt = f"Q: {question}\\nA:"
direct_answer = call_model(direct_prompt)
print("Direct prompt:")
print(f"  {direct_answer}\\n")

# Zero-shot CoT
cot_prompt = f"Q: {question}\\nA: Let's think step by step."
cot_answer = call_model(cot_prompt)
print("Zero-shot CoT:")
print(f"  {cot_answer}")

print("\\nObservations:")
print("- Direct generation often skips intermediate steps and produces wrong answers")
print("- 'Let's think step by step' elicits the model's reasoning capability")
print("- The reasoning trace lets the model 'check its work' at each step")
print("- This is the simplest reasoning technique that works.")
```

**Required callout** — type `aside`: MC1 from research.md. **"CoT works because the model is being more honest about its thinking."** False. **The CoT trace is generation, not introspection.** The model produces tokens that *look like* reasoning — sometimes they're an accurate reflection of its internal computation, but often they're plausible-sounding fabrications. The empirical fact that CoT improves accuracy doesn't imply the trace reflects ground-truth reasoning. **CoT is a useful pattern, not a window into the model's mind.**

**Connection forward:** Section 3 covers techniques that aggregate multiple traces — self-consistency and tree-of-thoughts.

### Section 3: Self-consistency and tree-of-thoughts

**Heading:** `## Self-consistency and tree-of-thoughts`
**Word target:** ~600
**Sub-headings:** `### Self-consistency`, `### Tree-of-thoughts`

**Teaching beats:**

**Self-consistency** (Wang et al. 2022):
1. Sample $N$ independent CoT traces (typically $N = 5$ to $40$). **Different sampling seeds → different traces.**
2. Extract each trace's final answer.
3. **Take the majority vote.**
4. Adds 10-20 accuracy points over single-sample CoT on GSM8K.
5. **Trades inference compute for accuracy** — foreshadows test-time compute scaling (section 6).

**The mechanism:**

```mdx
<Equation label="20.self-consistency">
$$\hat{a} = \text{mode}\{a_1, a_2, \ldots, a_N\} \text{ where each } a_i \text{ is from an independent CoT trace}$$
</Equation>
```

**Tree-of-thoughts** (Yao et al. 2023):
6. Reasoning as a tree. Each "thought" is a node; child nodes extend the reasoning.
7. Use BFS or DFS to explore multiple paths.
8. The LM scores intermediate states; the search backtracks when paths look unpromising.
9. **Significantly outperforms CoT on planning puzzles** (Game of 24, creative writing).
10. **Cost**: $10\times$ to $100\times$ more expensive than CoT — pays off only for hard problems.

**Required widget placeholder** — Self-Consistency Aggregator (secondary, session 116):

```mdx
<WidgetFrame title="Self-consistency aggregator" caption="N independent CoT traces are sampled; each trace's final answer is extracted; the majority answer is returned. Watch traces accumulate; the most-frequent answer wins. Adjustable N. This is the simplest test-time compute technique that works, and the conceptual ancestor of modern reasoning models.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 116 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing self-consistency aggregation:

```python
import re
from collections import Counter

def extract_answer(trace, pattern=r"answer is (\d+)"):
    """Extract numeric answer from a CoT trace."""
    matches = re.findall(pattern, trace.lower())
    return int(matches[-1]) if matches else None

def self_consistency(traces):
    """Sample N CoT traces; majority-vote the final answers."""
    answers = [extract_answer(t) for t in traces]
    answers = [a for a in answers if a is not None]
    if not answers:
        return None, 0
    counter = Counter(answers)
    most_common, count = counter.most_common(1)[0]
    return most_common, count / len(answers)

# Demo: 5 CoT traces for the same problem
# (In production, these come from sampling the model N times with different seeds)
mock_traces = [
    "Speed = 60/2 = 30 mph. The answer is 30.",
    "60 miles in 2 hours. Speed is 30. The answer is 30.",
    "Distance/time. The answer is 30.",
    "I think it's 40. The answer is 40.",          # outlier
    "60 / 2 = 30. The answer is 30.",
]

answer, confidence = self_consistency(mock_traces)
print(f"Sampled {len(mock_traces)} traces.")
print(f"Majority answer: {answer}")
print(f"Confidence (fraction of traces agreeing): {confidence:.0%}")
print()
print("Observations:")
print("- One trace was wrong (outlier said 40)")
print("- 4 of 5 traces agreed on the correct answer")
print("- Majority vote ignores the outlier; result is robust")
print("- This is the simplest test-time compute technique that works.")
```

**Required callout** — type `warning`: MC2 from research.md. **Self-consistency needs *sampling variance*.** A common bug: running the same prompt N times at temperature 0 — all samples are identical; no benefit. **Self-consistency requires non-zero temperature** (typical: $T = 0.7$, top-p $= 0.95$). The variance is what creates the wisdom-of-crowds effect.

**Connection forward:** Section 4 covers ReAct — interleaving reasoning with actions.

### Section 4: ReAct and tool-integrated reasoning

**Heading:** `## ReAct and tool-integrated reasoning`
**Word target:** ~400
**Sub-headings:** `### The Thought-Action-Observation pattern`, `### Bridge to Chapter 21`

**Teaching beats:**

**The Thought-Action-Observation pattern** (Yao et al. 2022):
1. Interleave **reasoning** with **actions** (tool calls):
   ```
   Thought: I need to find the population of France.
   Action: search("population of France")
   Observation: ~68 million
   Thought: Now I need the population of Germany.
   Action: search("population of Germany")
   Observation: ~83 million
   Thought: France 68M, Germany 83M. Answer: Germany.
   Final answer: Germany
   ```

**Why it matters:**
2. **Grounding**: each observation is real (from an actual tool), not fabricated.
3. **Compositional reasoning**: the model can chain multiple lookups.
4. **The foundation of modern LLM agents**: Claude tool use, GPT function calling, autonomous agents — all built on this pattern.

**Bridge to Chapter 21:**
5. **Chapter 21 dives into the engineering**: how actions are parsed (constrained decoding from Ch 19), how observations are formatted, how the loop terminates.
6. **For this chapter**: ReAct is the conceptual bridge from "model thinking" to "model acting." It closes Topic 1.

**Required callout** — type `note`: The ReAct pattern is **arguably the most influential prompting paradigm in production LLM systems**. Every modern agent (whether built on Claude, GPT, or open-source models) uses some form of Thought → Action → Observation. **Chapter 21 covers the production engineering**: parsing structured actions, validating observations, handling errors, terminating loops. **Here we just establish the pattern.**

**No code in this section.** Conceptual; Ch 21 has the full implementation.

**Connection forward:** Section 5 opens Topic 2 — modern reasoning. We start with process reward models.

### Section 5: Process reward models

**Heading:** `## Process reward models`
**Word target:** ~500 — opens Topic 2 (modern reasoning era)
**Sub-headings:** `### Scoring each step`, `### PRM vs ORM`

**Teaching beats:**

**Scoring each step** (Lightman et al. 2023):
1. The **reasoning-answer gap problem**: a CoT trace might be wrong even if the final answer is right (lucky guess) or vice versa.
2. **Process reward models (PRMs)** score *each step* of a reasoning trace.
3. Reward: "is this step correct given the steps so far?"
4. Each step gets a score in $[0, 1]$.

**Two uses:**
5. **Inference-time scoring**: generate $N$ traces; score each with the PRM; pick the highest-scoring trace.
6. **Training-time reward**: in RLVR (Ch 14), use the PRM to give dense intermediate reward.

**PRM vs ORM:**
7. **Outcome reward models (ORMs)**: only score the final answer. Simpler; less feedback.
8. **Process reward models (PRMs)**: score each step. More feedback; more compute; can hallucinate intermediate "correctness."
9. **The R1 surprise**: DeepSeek showed that **pure outcome rewards work**, with no PRM. **The field reconsidered whether PRMs are necessary.**

**Required code** — `<RunnableCode>` showing best-of-N with a mock PRM:

```python
def mock_prm_score(trace):
    """
    Mock PRM: scores a trace based on simple features.
    Real PRMs are trained transformers that score each step.
    """
    has_explicit_math = '=' in trace or '/' in trace or '+' in trace
    length_score = min(len(trace) / 100, 1.0)
    math_bonus = 0.3 if has_explicit_math else 0.0
    return min(0.5 + length_score * 0.3 + math_bonus, 1.0)

def best_of_n_with_prm(traces):
    """Pick the trace with the highest PRM score."""
    scored = [(t, mock_prm_score(t)) for t in traces]
    return max(scored, key=lambda x: x[1])

# Demo: 4 candidate traces of varying quality
traces = [
    "The answer is 30.",                                            # short, no math shown
    "Speed = 30. The answer is 30.",                               # short with math
    "60 / 2 = 30. The answer is 30.",                              # explicit calculation
    "Distance = 60 miles, time = 2 hours. 60 / 2 = 30 mph. The answer is 30.",  # detailed
]

scored = sorted([(t, mock_prm_score(t)) for t in traces], key=lambda x: -x[1])
print(f"{'Score':>6} | Trace")
print("-" * 70)
for trace, score in scored:
    print(f"{score:>6.2f} | {trace[:60]}{'...' if len(trace) > 60 else ''}")

print()
print("Observations:")
print("- Detailed traces with explicit math score highest")
print("- A real PRM scores *each step's correctness*, not just length")
print("- Best-of-N with PRM trades N× inference for accuracy")
print("- This is the inference-time use of PRMs (no model retraining needed).")
```

**Required callout** — type `aside`: MC4 from research.md. **"PRMs are strictly better than ORMs."** False. **R1 demonstrated that pure outcome rewards work**, with no PRM. PRMs add complexity and can introduce reward-hacking — the model "performs reasoning steps" to score well, even if the steps don't help the answer. **Both have their place**: PRMs are still useful for inference-time filtering; ORMs are simpler for training.

**Connection forward:** Section 6 covers the central modern insight — test-time compute scaling.

### Section 6: Test-time compute scaling

**Heading:** `## Test-time compute scaling`
**Word target:** ~600 — IMPORTANT (modern central insight)
**Sub-headings:** `### The empirical claim`, `### The scaling curve`

**Teaching beats:**

**The empirical claim** (Snell et al. 2024):
1. For many tasks, **increasing inference-time compute outperforms increasing model size**.
2. **The setup**: take a fixed model; run multiple ways at inference (direct → self-consistency → best-of-N+PRM → tree-of-thoughts).
3. **The result**: across math benchmarks, scaling inference compute improves accuracy with stable curves.
4. **The implication**: a smaller model with more thinking time can match a larger model with less thinking time.

**The scaling curve:**

```mdx
<Equation label="20.test-time-scaling">
$$\text{Accuracy}(\text{model size} = M, \text{compute} = C) \approx f(M^{\alpha} \cdot C^{\beta})$$
</Equation>
```

where $\beta > 0$ — inference compute genuinely contributes.

5. **For *easy* problems**: extra thinking doesn't help much (the curve is flat).
6. **For *hard* problems**: extra thinking pays off dramatically — 30+ percentage points possible.
7. **This is the empirical foundation for the o1/R1 paradigm**: train the model to think; let it think for as long as needed.

**The deployment implication:**
8. **Test-time compute is now a deployment variable.** o1's API has `reasoning_effort = low | medium | high`. R1's serving stack accepts `max_thinking_tokens`. **Pre-2024, there was no such knob.**
9. **Cost-quality trade-off**: 10-100× inference compute for hard problems can outperform a 10× larger model. **Often a better economic choice.**

**Required widget placeholder** — Test-Time Compute Curves (marquee, session 115):

```mdx
<WidgetFrame title="Test-time compute scaling" caption="Accuracy vs compute curves across reasoning techniques. Direct generation (1× compute), CoT, self-consistency (N×), best-of-N with PRM, tree-of-thoughts (10-100×), and modern reasoning models. Slider for problem difficulty. The widget makes 'why test-time compute scaling matters' visible — easy problems plateau, hard problems benefit dramatically.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 115 (marquee)
  </div>
</WidgetFrame>
```

**Required callout** — type `note`: MC5 from research.md. **"Test-time compute always pays off."** False. **Diminishing returns are real.** Spending 100× inference compute on a question the model could answer at 1× is wasteful. **Scaling helps most on the *hardest* problems**, where the marginal benefit of extra thinking is largest. For easy problems, the curve flattens.

**Connection forward:** Section 7 covers the modern reasoning models that productionized this insight.

### Section 7: Modern reasoning models — o1, R1, Gemini Thinking

**Heading:** `## Modern reasoning models — o1, R1, Gemini Thinking`
**Word target:** ~600 — IMPORTANT (the paradigm shift)
**Sub-headings:** `### OpenAI o1`, `### DeepSeek R1`, `### The paradigm shift`

**Teaching beats:**

**OpenAI o1** (Sept 2024):
1. First widely-deployed reasoning model.
2. **Internal chain-of-thought, trained via RL** (not just prompted).
3. Thinks for variable time at inference (10 seconds to several minutes).
4. Substantially better at math (AIME, IMO problems), code (Codeforces-level), science (PhD-level physics).
5. **Doesn't reveal its internal reasoning** to the user.

**DeepSeek R1** (Jan 2025):
6. Matched o1's reasoning ability on math/code — **open-source**.
7. **Pure RLVR with GRPO** (Ch 14) — no SFT bootstrap.
8. **Released the recipe**: GRPO details, training data, reward design.
9. **Released distilled smaller models** (1.5B to 32B) — see Ch 16. Reasoning capability transfers via distillation.
10. **Reveals thinking trace** in `<think>...</think>` tags.

**Gemini Thinking** (Dec 2024): Google's variant; similar paradigm; exposes reasoning traces.

**The paradigm shift:**
11. **Classic era**: CoT was a *prompt* applied at inference. Same model, different prompt.
12. **Modern era**: reasoning is *trained in* via RL. The model *autonomously* decides when and how long to think.
13. **The math**:

```mdx
<Equation label="20.modern-reasoning">
$$\text{Model}(\text{prompt}) \to \langle \text{think} \rangle \, \text{long reasoning trace} \, \langle / \text{think} \rangle \to \text{answer}$$
</Equation>
```

14. **The model emits reasoning autonomously**; the user just sees the answer (o1) or sees both (R1, Gemini Thinking).

**Required callout** — type `note`: **R1 is the most accessible exemplar of the modern paradigm**. Open-source, transparent, replicable. **The recipe is simple in concept**: start with a base model; apply RLVR with rule-based outcome rewards (math: exact match; code: test pass rate); train via GRPO; result — a model that learns to generate long reasoning traces that produce correct answers. **The breakthrough was that this works at all without any SFT bootstrap.**

**Bridge to Ch 17**: long reasoning traces (R1 can emit 10K+ thinking tokens) **stress the KV cache aggressively**. **PagedAttention is essential.** Some systems use **KV cache quantization** (Ch 18) for reasoning models.

**No code in this section.** Conceptual; modern reasoning model implementations are training-level (Ch 14) not inference-level.

**Connection forward:** Section 8 wraps Phase 13's opening.

### Section 8: The full picture

**Heading:** `## The full picture`
**Word target:** ~400
**Sub-headings:** `### When to use which technique`, `### What's next in Phase 13`

**Teaching beats:**

**When to use which technique:**

| Technique | When to use | Cost |
|---|---|---|
| Direct generation | Simple factual queries | 1× |
| Zero-shot CoT | Easy math, multi-step | 1-2× |
| Few-shot CoT | Need consistent format | 1-2× |
| Self-consistency | Math, cheap verification | $N×$ |
| Tree-of-thoughts | Planning, puzzles | $10-100×$ |
| ReAct | Tool-using tasks | varies |
| Best-of-N + PRM | Intermediate scoring possible | $N×$ |
| Modern reasoning model | Hard math, code, science | $10-100×$ |

1. **Decision rule**: simplest technique that works.
2. **For most chat tasks**: modern instruction-tuned models with zero-shot CoT suffice.
3. **For hard reasoning**: modern reasoning models (o1, R1) are now the default.

**What's next in Phase 13:**
4. **Ch 21 (Tool use)**: extends ReAct into engineered systems. Function calling, agents-as-libraries.
5. **Ch 22 (RAG)**: retrieval-augmented generation — the model looks up information.
6. **Ch 23 (Multimodal)**: vision, audio, video — beyond text.
7. **After Phase 13**: safety/interpretability/evaluation (Phase 14), agents (Phase 15).

**Sample close** (rewrite in chapter voice):

> Reasoning is the capability that turns deployable models into useful systems. The classic era (2022-2023) discovered CoT, self-consistency, and ReAct — *prompting* techniques that work on any model. The modern era (2024-2025) trained reasoning directly via RLVR — o1, R1, Gemini Thinking emit long reasoning traces autonomously. **Test-time compute scaling** showed that more thinking outperforms more parameters for hard problems, often dramatically.
>
> **Chapter 21 opens next: tool use.** Where reasoning gave the model time to think, tools give it the ability to *act* — call APIs, search the web, execute code, retrieve information. **The ReAct pattern this chapter introduced is the foundation; Ch 21 covers the engineering.** **Chapter 22 covers RAG**; **Chapter 23 covers multimodal**. By the end of Phase 13, we have reasoning + tools + retrieval + multimodal — the full capability stack of a modern AI system.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 20, slug: 'ch20-reasoning', title: 'Reasoning', partNum: 7, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch20-reasoning/index.astro && rm src/pages/ch20-reasoning/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch20-reasoning/`** renders with:
   - Chapter eyebrow ("Chapter 20") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 3, 5)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 6)
   - Labeled equations `<Equation label="20.cot-template">`, `<Equation label="20.self-consistency">`, `<Equation label="20.test-time-scaling">`, `<Equation label="20.modern-reasoning">`
   - At least 5 callouts (the section-1 "scratch paper" note, MC1 in section 2, MC2 in section 3, the ReAct preview in section 4, MC4 in section 5, MC5 in section 6, the R1 note in section 7 — pick 5)
   - The 8-row technique decision table in section 8
3. **Sidebar:** Ch 1-19 published; Ch 20 active (draft); Ch 21-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 20:** prev = Ch 19 (active); next = Ch 21 (disabled)
6. **TOC on Ch 20** populates with all 8 sections plus subsections
7. **Word count:** chapter prose between 3900 and 4500 words
8. **Topic split is visible**: sections 1-4 are "classic CoT era"; sections 5-8 are "modern reasoning era"
9. **`npm run typecheck`** passes
10. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 115 and 116 own them.
- ❌ **Do not write exercises.** Session 117 owns.
- ❌ **Do not flip Ch 20's status to `'published'`.** Session 117 owns.
- ❌ **Do not enumerate ToT search variants.** Brief mention only.
- ❌ **Do not derive PRM training math.** Conceptual coverage only.
- ❌ **Do not derive test-time compute scaling laws.** Cite Snell 2024; show the boxed equation form.
- ❌ **Do not deep-dive into o1's training (it's not public).** Use R1 as the open-source exemplar instead.
- ❌ **Do not implement actual ReAct.** Brief preview; Ch 21 has full treatment.
- ❌ **Do not modify Ch 1-19.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch20-reasoning/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch20-reasoning/index.astro 2>/dev/null || true
git commit -m "session 89: Ch 20 prose — reasoning (opens Phase 13)"
git push origin main
```

---

## Notes for the session author

**On the two-topic energy:**
This chapter has more sections (8) and slightly more words than recent single-topic chapters because it bridges two eras. **Don't shortchange either**:
- Topic 1 (sections 1-4): the prompting era. Wei 2022, Wang 2022, Yao 2022/2023.
- Topic 2 (sections 5-8): the training era. Lightman 2023, Snell 2024, OpenAI o1, DeepSeek R1.

The reader should walk away understanding **both eras as relevant** — CoT prompting still works on any model; modern reasoning models are state-of-the-art for hard tasks.

**On the Phase 13 opening tone:**
Phase 12 was practical engineering — grounded, numbers-heavy, slightly mechanical in tone. **Phase 13 opens with more energy.** The reader has just completed the deployment trilogy; now the capability arc begins. The opening sample explicitly bridges: "Phase 12 ended with deployable models — efficient, quantized, sampling cleanly. But a deployable model isn't automatically a useful one." **This signals the shift.**

**On R1 as the open-source exemplar:**
o1 is widely deployed but not transparent — OpenAI doesn't publish o1's training details. **R1 is the chapter's center of gravity for modern reasoning** because:
1. It's open-source
2. The training recipe (GRPO + outcome rewards) is documented (Ch 14)
3. Distilled smaller models are available (Ch 16)
4. The thinking trace is visible

Notes-for-author: "Where possible, use R1 as the concrete example for modern reasoning. o1 gets mentioned but R1 carries the load."

**On the reasoning-answer gap being honest:**
Section 2's callout (MC1) is the chapter's most important honesty moment. **CoT traces aren't introspection.** The model generates plausible-looking reasoning that *correlates* with better accuracy, but the trace isn't a window into the model's "thoughts." **The accuracy is real; the philosophical claim is uncertain.** This honesty matters for Phase 14 (interpretability).

**On test-time compute being the conceptual centerpiece:**
Section 6 is the chapter's most important modern-era concept. **The empirical insight from Snell 2024** — that inference compute scales with stable curves — is what made the o1/R1 paradigm economically viable. **The widget (marquee in section 6)** makes this visceral.

Notes-for-author: "Test-time compute scaling is the *organizing insight* of modern reasoning. Without it, training a model to think for 10 minutes would seem absurd. With it, the cost-quality math works out."

**On the widget placements:**
- **Marquee (Test-Time Compute Curves)** in section 6: where the modern era's central insight is introduced. Reader sees how each technique's accuracy curves scale with compute.
- **Secondary (Self-Consistency Aggregator)** in section 3: alongside the classic-era technique. Reader watches N traces accumulate; majority vote forms.

Both widgets pedagogically motivated by their placement.

**On the three runnable code blocks:**
- Section 2 (zero-shot CoT): reader sees the simplest reasoning intervention
- Section 3 (self-consistency aggregation): reader implements majority vote
- Section 5 (best-of-N with mock PRM): reader sees the scoring interface

Three runnables, all in the first half of the chapter. The second half is conceptual.

**On the section 8 closing:**
The closing bridges to Ch 21. **The ReAct pattern from section 4 is the conceptual seed** that Ch 21 grows into. Notes-for-author: "Section 8 should make the rest of Phase 13 feel inevitable — tool use is the natural next step from ReAct; RAG extends retrieval to documents; multimodal extends beyond text. **The reader should feel the trajectory.**"

**Pedagogical claim of the chapter:**
"Reasoning is the capability that turns deployable models into useful systems. The classic era used prompting (CoT, self-consistency, ToT, ReAct); the modern era uses RL training (PRMs, test-time compute scaling, o1, R1). **Both eras are still relevant**: CoT works on any model; modern reasoning models are state-of-the-art for hard tasks. **Test-time compute scaling is the empirical foundation** for the modern paradigm — more thinking dramatically improves accuracy on hard problems. **The chapter that opens Phase 13** — where deployable models become genuinely useful for complex reasoning tasks."

**Phase 13 opening**: Ch 20 opens Phase 13. Three more chapters (21, 22, 23) complete it. **Pace the reader's excitement**: each chapter of Phase 13 adds a new capability layer (reasoning → tools → retrieval → multimodal). After Phase 13, the curriculum closes with safety/interp/eval (Phase 14) and agents (Phase 15).

Build with care.
