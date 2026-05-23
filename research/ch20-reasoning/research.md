# Chapter 20 — Reasoning: research

> Curated source material for Chapter 20's build sessions. **The chapter that opens Phase 13 (Capabilities).** Where Phase 11 trained the model and Phase 12 made it deployable, Phase 13 makes it *useful* — starting with reasoning. **Two-topic chapter**: (1) the classic chain-of-thought era (Wei et al. 2022; self-consistency; tree-of-thoughts; ReAct) and (2) the modern reasoning paradigm (process reward models; test-time compute scaling; o1, R1, Gemini Thinking models). This is the chapter where readers see how production AI systems handle complex reasoning — and why the "thinking model" paradigm of 2024-2025 changed what's possible. Uses the **5-file cadence** (two-topic chapter).

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Reasoning

**Premise:** A trained, deployed transformer can answer questions directly — predict one token, then another, then another. For many tasks, that's enough. For **reasoning tasks** (math problems, logic puzzles, multi-step planning, code debugging), direct generation often fails: the model commits to early decisions it can't easily revise. **Reasoning techniques** address this by giving the model space to *think before answering*. The chapter walks through this idea's evolution: from simple "let's think step by step" prompts (2022), through self-consistency and tree-of-thoughts (2022-2023), to process reward models and test-time compute scaling (2023-2024), to the modern reasoning paradigm of o1, DeepSeek-R1, and Gemini Thinking (2024-2025). **The chapter where deployable models become genuinely useful for complex tasks.**

**Two flavors of reasoning covered:**

1. **Classic CoT era (2022-2023)**: prompting-based techniques. The model produces reasoning traces during inference; the user designs prompts to elicit them. Self-consistency aggregates multiple traces.
2. **Modern reasoning era (2024-2025)**: training-based techniques. Models are trained (via RLVR — see Ch 14) to produce extended reasoning traces internally. Test-time compute scaling shows that *thinking longer* monotonically improves accuracy across many tasks.

**Out of scope (other chapters):**
- RLVR training (Ch 14) — covered there; this chapter assumes it
- Tool use (Ch 21) — ReAct touches the boundary but tools have their own chapter
- RAG (Ch 22) — separate chapter
- Evaluation of reasoning (Ch 26) — separate chapter

**In scope and locked:**
- **Chain-of-thought** (Wei et al. 2022): few-shot and zero-shot ("let's think step by step")
- **Self-consistency** (Wang et al. 2022): sample N traces; majority vote
- **Tree-of-thoughts** (Yao et al. 2023): explicit search over reasoning paths
- **ReAct** (Yao et al. 2022): interleave reasoning + action
- **Process reward models** (Lightman et al. 2023): score each reasoning *step*
- **Test-time compute scaling** (Snell et al. 2024): the modern empirical insight
- **o1 / R1 / Gemini Thinking models**: long internal reasoning; trained with RLVR
- **Combined picture**: when to use which technique

**Suggested chapter structure** (8 sections, two-topic framing):

TOPIC 1 — Classic CoT era (~2000 words):
1. Why reasoning matters (~400 words)
2. Chain-of-thought prompting (~600 words)
3. Self-consistency and tree-of-thoughts (~600 words)
4. ReAct and tool-integrated reasoning (~400 words)

TOPIC 2 — Modern reasoning era (~2100 words):
5. Process reward models (~500 words)
6. Test-time compute scaling (~600 words)
7. Modern reasoning models — o1, R1, Gemini Thinking (~600 words)
8. The full picture and Phase 13 framing (~400 words)

Target: ~4100 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Wei et al. 2022 — "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"
- **arXiv:** [2201.11903](https://arxiv.org/abs/2201.11903)
- **What it contributed:** **chain-of-thought (CoT) prompting** — provide few-shot examples that include intermediate reasoning steps; the model learns to produce reasoning before its answer. Dramatic improvements on math word problems (GSM8K, SVAMP) and commonsense reasoning. **The foundational paper of LLM reasoning.**
- **For the chapter:** central reference for section 2.

### Kojima et al. 2022 — "Large Language Models are Zero-Shot Reasoners"
- **arXiv:** [2205.11916](https://arxiv.org/abs/2205.11916)
- **What it contributed:** **zero-shot CoT** — just prepend "Let's think step by step" to the prompt; no exemplars needed. Almost as effective as few-shot CoT. **One of the most-cited single-sentence interventions in NLP.**
- **For the chapter:** section 2 paired reference.

### Wang et al. 2022 — "Self-Consistency Improves Chain-of-Thought Reasoning in Language Models"
- **arXiv:** [2203.11171](https://arxiv.org/abs/2203.11171)
- **What it contributed:** **self-consistency** — sample N independent reasoning traces (typically 5-40); take majority vote of final answers. Trades inference compute for accuracy. Foreshadows test-time compute scaling. **The simplest test-time compute technique that works.**
- **For the chapter:** central reference for section 3.

### Yao et al. 2023 — "Tree of Thoughts: Deliberate Problem Solving with Large Language Models"
- **arXiv:** [2305.10601](https://arxiv.org/abs/2305.10601)
- **What it contributed:** **Tree of Thoughts (ToT)** — formalize reasoning as a tree; explore multiple branches with explicit search (BFS or DFS); evaluate intermediate states. Significantly outperforms CoT on planning and search puzzles.
- **For the chapter:** section 3 reference.

### Yao et al. 2022 — "ReAct: Synergizing Reasoning and Acting in Language Models"
- **arXiv:** [2210.03629](https://arxiv.org/abs/2210.03629)
- **What it contributed:** **ReAct** — interleave reasoning and action steps. Thought → action → observation → thought → action → ... The pattern that became the foundation of modern LLM agents.
- **For the chapter:** central reference for section 4; bridges to Ch 21 (tool use).

### Lightman et al. 2023 — "Let's Verify Step by Step"
- **arXiv:** [2305.20050](https://arxiv.org/abs/2305.20050)
- **What it contributed:** **process reward models (PRMs)** — train a model to score *each step* of a reasoning trace, not just the final answer. Used at inference to filter solutions; can be used as RL reward signal. **Pre-cursor to RLVR (Ch 14).**
- **For the chapter:** central reference for section 5.

### Snell et al. 2024 — "Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters"
- **arXiv:** [2408.03314](https://arxiv.org/abs/2408.03314)
- **What it contributed:** **the test-time compute scaling result** — for many tasks, increasing inference-time compute (more reasoning steps, more samples, better PRM scoring) outperforms increasing model size. **The empirical foundation for the o1/R1 paradigm.**
- **For the chapter:** central reference for section 6.

### OpenAI 2024 — "Learning to Reason with LLMs" (o1 announcement)
- **URL:** [openai.com/index/learning-to-reason-with-llms](https://openai.com/index/learning-to-reason-with-llms)
- **What it contributed:** **o1** — first widely-deployed reasoning model. Uses internal chain-of-thought trained via RL; thinks for longer at inference; substantially better at math, code, science.
- **For the chapter:** section 7 reference.

### DeepSeek 2025 — "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning"
- **arXiv:** [2501.12948](https://arxiv.org/abs/2501.12948)
- **What it contributed:** **R1** — open-source reasoning model matching o1's reasoning ability on math/code. Trained via **pure RLVR** (no SFT bootstrap; uses GRPO from Ch 14). **Released the recipe and the distilled smaller models**, democratizing reasoning capability.
- **For the chapter:** central reference for section 7.

### Wei et al. 2024 — "Long-form factuality in large language models" (FactScore-style reasoning evaluation)
- **arXiv:** [2403.18802](https://arxiv.org/abs/2403.18802)
- **What it contributed:** evaluation framework for reasoning-style outputs; widely used for assessing modern reasoning models.

### Madaan et al. 2023 — "Self-Refine: Iterative Refinement with Self-Feedback"
- **arXiv:** [2303.17651](https://arxiv.org/abs/2303.17651)
- **What it contributed:** the model critiques and revises its own outputs iteratively. A different mode of "thinking" compared to CoT.

---

## Core concepts

### Concept 1: Why reasoning matters

**The limit of direct generation:**
A trained transformer's forward pass produces one token at a time. For factual questions ("Who painted the Mona Lisa?"), direct generation works fine — the model has the answer in its weights.

For **reasoning tasks**, direct generation often fails:
- Math word problems requiring intermediate calculations
- Multi-step logic puzzles
- Code with subtle bugs requiring trace-through
- Planning problems with branching choices
- Programs that require deliberation

**The intuition**: a single forward pass commits to early decisions. Once the model emits the first few tokens of its answer, it's constrained. **Reasoning techniques give the model space to think before committing.**

**The empirical claim**: across most "hard" benchmarks (GSM8K, MATH, HumanEval, ARC), techniques that let the model reason explicitly produce *dramatically* better results than direct answer generation.

**The chapter's two-era arc**:
- **Classic era (2022-2023)**: reasoning achieved via *prompting*. The model is the same; the prompt structure changes.
- **Modern era (2024-2025)**: reasoning is *trained in*. Models are RL-trained to produce extended reasoning traces; test-time compute scaling becomes a first-class deployment variable.

### Concept 2: Chain-of-thought (CoT)

**Wei et al. 2022** introduced **chain-of-thought prompting**: provide few-shot examples that include intermediate reasoning steps.

**Few-shot CoT example**:
```
Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls.
   Each can has 3 tennis balls. How many tennis balls does he have now?
A: Roger started with 5 balls. 2 cans of 3 balls each is 6 balls.
   5 + 6 = 11. The answer is 11.

Q: The cafeteria had 23 apples. If they used 20 to make lunch and
   bought 6 more, how many apples do they have?
A: [model generates reasoning trace + answer]
```

**Key empirical finding**: this prompting *dramatically* improves accuracy on math/reasoning benchmarks. GPT-3 on GSM8K: direct ~5%; CoT ~46%. PaLM 540B: direct ~17%; CoT ~57%.

**Zero-shot CoT** (Kojima et al. 2022): no examples needed. Just append:
```
Let's think step by step.
```

to the prompt. Works almost as well as few-shot CoT in many cases.

**Why CoT works (intuition)**:
- The model has the *capability* to reason; CoT just elicits it.
- Generating intermediate steps gives the model "more tokens to think with" — extra compute per output.
- Each reasoning token can attend back to earlier reasoning tokens via the KV cache, building up state.

**Limitations**:
- Sometimes the reasoning trace is *correct* but the final answer doesn't match it (the "reasoning-answer gap").
- The trace can be *plausible but wrong* (hallucinated reasoning).
- Sensitive to prompt phrasing.

```mdx
<Equation label="20.cot-template">
$$\text{prompt} \;\to\; \text{reasoning}_1, \text{reasoning}_2, \ldots, \text{reasoning}_k \;\to\; \text{answer}$$
</Equation>
```

### Concept 3: Self-consistency and tree-of-thoughts

**Self-consistency** (Wang et al. 2022):
1. Generate $N$ independent CoT traces (typically $N = 5$ to $40$).
2. Extract each trace's final answer.
3. **Take the majority vote.**

**Why it works**: different traces may make different errors, but the *correct* answer tends to appear most often.

**Empirical**: self-consistency adds 10-20 accuracy points over single-sample CoT on GSM8K and similar benchmarks. **Trades inference compute for accuracy.**

**Tree-of-thoughts** (Yao et al. 2023):
- Reasoning as a tree: each "thought" is a node; child nodes extend the reasoning
- Use BFS or DFS to explore multiple paths
- Evaluate intermediate states (the LM scores each node)
- Backtrack when a path looks unpromising
- **Significantly outperforms CoT on planning puzzles** (Game of 24, creative writing, crosswords)

**Computational cost**: ToT can be $10\times$-$100\times$ more expensive than CoT for the same query.

**ReAct preview** (Yao et al. 2022): interleave reasoning steps with *actions* (e.g., tool calls). Covered briefly in section 4; full treatment in Ch 21.

```mdx
<Equation label="20.self-consistency">
$$\hat{a} = \text{mode}\{a_1, a_2, \ldots, a_N\} \text{ where each } a_i \text{ is from an independent CoT trace}$$
</Equation>
```

### Concept 4: ReAct and tool-integrated reasoning

**ReAct** (Yao et al. 2022) is the recipe that became modern LLM agents.

**The pattern**:
```
Thought: I need to find the population of France.
Action: search("population of France")
Observation: ~68 million
Thought: Now I need to find population of Germany.
Action: search("population of Germany")
Observation: ~83 million
Thought: France: 68M; Germany: 83M. The answer is Germany.
Final answer: Germany
```

**Why it matters**:
- The model doesn't have to memorize everything — it can *look up*
- Reasoning becomes verifiable — each action's observation is grounded
- **The pattern that all modern LLM agents use**: Claude with tool use, GPT with function calling, custom agents with their own action spaces

**Bridge to Ch 21**: the ReAct pattern's *action* and *observation* steps are exactly what tool use covers. **Chapter 21 dives into the engineering**: how the action gets parsed (constrained decoding from Ch 19); how observations get formatted; how the loop terminates.

### Concept 5: Process reward models (PRMs)

The **reasoning-answer gap** problem: a CoT trace might be wrong even if the final answer is right (lucky guess), or right even if the answer is wrong (final-step error).

**Process reward models** (Lightman et al. 2023):
- Train a model to score *each step* of a reasoning trace (not just the final answer)
- Reward: "is this step correct given the steps so far?"
- Each step gets a score in $[0, 1]$

**Two uses**:
1. **Inference-time scoring**: generate $N$ traces; score each with the PRM; pick the highest-scoring trace.
2. **Training-time reward**: in RLVR (Ch 14), use the PRM to give dense intermediate reward (not just final-outcome reward).

**Trade-off**:
- **Outcome reward models (ORMs)**: only score the final answer. Simpler; less feedback.
- **Process reward models (PRMs)**: score each step. More feedback; more compute; can hallucinate intermediate "correctness."

**Recent shift**: with DeepSeek-R1's success using **pure outcome rewards** (no PRM needed), the field reconsidered whether PRMs are necessary. **Both approaches have their place**: PRMs are still useful for inference-time filtering; ORMs are simpler for training.

### Concept 6: Test-time compute scaling

**Snell et al. 2024** showed something striking: **for many tasks, spending more inference-time compute outperforms spending more training compute.**

**The setup**: take a fixed model. Run it multiple ways at inference:
- 1× compute: direct answer
- 5× compute: self-consistency with N=5
- 50× compute: best-of-N with N=50 + PRM scoring
- 500× compute: tree-of-thoughts with deep exploration

**The result**: across math benchmarks, scaling inference compute improves accuracy with surprisingly stable curves. **Doubling inference compute often beats doubling model size**, especially for hard problems.

**Practical implication**: a smaller model with more thinking time can match a larger model with less thinking time. **This is the empirical foundation for the o1/R1 paradigm.**

**The trade-off curve**:
- For *easy* problems: extra thinking doesn't help much
- For *hard* problems: extra thinking pays off dramatically — sometimes 30+ percentage points

```mdx
<Equation label="20.test-time-scaling">
$$\text{Accuracy}(\text{model size} = M, \text{compute} = C) \approx f(M^{\alpha} \cdot C^{\beta})$$
</Equation>
```

where $\beta > 0$ — inference compute genuinely contributes.

### Concept 7: Modern reasoning models — o1, R1, Gemini Thinking

**OpenAI's o1** (Sept 2024) was the first widely-deployed reasoning model:
- Internal chain-of-thought, trained via RL
- "Thinks" for variable time before answering (10 seconds to several minutes)
- Substantially better at math (AIME, IMO problems), code (Codeforces-level), science (PhD-level physics)
- **Doesn't reveal its internal reasoning** to the user (intentional design choice)

**DeepSeek-R1** (Jan 2025) was the open-source breakthrough:
- Matched o1's reasoning on math/code benchmarks
- **Used pure RLVR with GRPO** (Ch 14) — no SFT bootstrap
- **Released the recipe** (Group Relative Policy Optimization details)
- **Released distilled smaller models** (1.5B to 32B) inheriting much of the capability
- Reveals its thinking trace in `<think>...</think>` tags

**The R1 training recipe** (high-level — Ch 14 has the full GRPO details):
1. Start with a base model
2. Apply rule-based rewards for verifiable answers (math: exact match; code: test pass rate)
3. RLVR via GRPO
4. Result: model learns to generate long reasoning traces that produce correct answers
5. Optional: SFT distillation into smaller students (Ch 16)

**Gemini Thinking** (Dec 2024) — Google's reasoning variant: similar paradigm. Exposes reasoning traces.

**Key shift from CoT era**:
- **Then**: CoT was a *prompt* applied at inference
- **Now**: reasoning is *trained in* via RL; the model decides when and how long to think

```mdx
<Equation label="20.modern-reasoning">
$$\text{Model}(\text{prompt}) \to \langle \text{think} \rangle \text{reasoning trace} \langle / \text{think} \rangle \to \text{answer}$$
</Equation>
```

The model **emits reasoning autonomously**; the user just sees the answer (o1) or sees both (R1, Gemini Thinking).

### Concept 8: The full picture — when to use which technique

A modern reasoning-capable system has multiple options:

| Technique | When to use | Cost |
|---|---|---|
| **Direct generation** | Simple factual queries | 1× |
| **Zero-shot CoT** | Easy math, simple multi-step | 1-2× |
| **Few-shot CoT** | Need consistent format | 1-2× |
| **Self-consistency** | Math, when verification is cheap | $N×$ |
| **Tree-of-thoughts** | Planning, puzzles, search problems | $10-100×$ |
| **ReAct** | Tool-using tasks | varies |
| **PRM-scored Best-of-N** | When intermediate scoring possible | $N×$ |
| **Modern reasoning model** | Hard math, code, science | $10-100×$ |

**Decision rule**: use the simplest technique that works. **For most chat tasks, modern instruction-tuned models with zero-shot CoT suffice**. **For hard reasoning, modern reasoning models** (o1, R1) are now the default.

**Phase 13 trajectory**:
- **Ch 20** (this): how the model reasons
- **Ch 21**: how the model uses tools (extends ReAct)
- **Ch 22**: how the model retrieves external knowledge (RAG)
- **Ch 23**: how the model handles other modalities (vision, audio)

Together, Phase 13 turns deployable models (Phase 12) into useful systems.

---

## Glossary

- **Reasoning**: producing intermediate steps before a final answer
- **CoT (Chain-of-Thought)**: emitting reasoning steps as part of generation
- **Few-shot CoT**: providing exemplars in the prompt
- **Zero-shot CoT**: prompting "Let's think step by step"
- **Self-consistency**: $N$ samples, majority vote
- **Tree-of-thoughts (ToT)**: tree-structured search over reasoning paths
- **ReAct**: thought-action-observation interleaving
- **PRM (Process Reward Model)**: scores each reasoning step
- **ORM (Outcome Reward Model)**: scores only the final answer
- **Test-time compute scaling**: trading inference compute for accuracy
- **Reasoning model**: a model trained via RL to produce long internal CoT (o1, R1, Gemini Thinking)
- **Best-of-N**: sample $N$ candidates, pick the best by some scorer
- **Reasoning-answer gap**: when the trace and the final answer disagree
- **GRPO**: Group Relative Policy Optimization — the RL algorithm behind R1 (Ch 14)
- **AIME / IMO**: math competition benchmarks where reasoning models excel

---

## Pedagogical analogies

### 1. Reasoning as "scratch paper"
Before computers, math students used scratch paper to work out problems — too much for the brain alone, too valuable to throw away. **Reasoning traces are the model's scratch paper.** The model can think through intermediate steps, refer back to them via the KV cache, and arrive at answers it couldn't have produced in one step.

Best used for: section 1 motivation.

### 2. Self-consistency as "polling"
If you ask 5 friends a hard question, they might all give different answers — but the *correct* answer often wins by plurality. **Self-consistency polls the model.** Sample $N$ independent traces; take majority vote. The wisdom-of-crowds principle applies even when the "crowd" is one model sampled $N$ times.

Best used for: section 3 self-consistency.

### 3. Tree-of-thoughts as "exploring branches in a maze"
A maze runner who only goes forward is doomed. A clever solver backtracks: tries one path; if it doesn't work, returns and tries another. **Tree-of-thoughts gives the model the same flexibility.** Reasoning as tree search; backtrack when paths look unpromising.

Best used for: section 3 ToT.

### 4. Test-time compute as "more thinking = better answers"
A student who has 30 minutes for a math problem outperforms one with 30 seconds — *for hard problems*. For easy problems, more time doesn't help. **Test-time compute scaling is the same**: spending more inference compute mostly helps on hard problems, with diminishing returns. The o1/R1 paradigm productionizes this: hard problems get more thinking time.

Best used for: section 6 test-time compute.

### 5. Modern reasoning models as "trained to think aloud"
The CoT era prompted the model to think; the modern era *trained* it to think. **A student who's been drilled to show their work** is more reliable than one who has to remember the rule each time. RLVR + reasoning traces (Ch 14, this chapter) train the model to think autonomously.

Best used for: section 7 modern reasoning.

---

## Common misconceptions

### MC1: "CoT works because the model is being more honest about its thinking."
**Reality:** false. **The CoT trace is generation, not introspection.** The model produces tokens that *look like* reasoning — sometimes they're an accurate reflection of its internal "thought," but often they're plausible-sounding fabrications. The empirical fact that CoT improves accuracy doesn't imply the trace reflects ground-truth reasoning.

### MC2: "Self-consistency is just majority voting."
**Reality:** mostly true but with nuance. **The samples must be *independently sampled*** (different random seeds, different temperatures, etc.). Just running the same prompt multiple times at temperature 0 yields the same answer every time — no benefit. Self-consistency requires *sampling variation*.

### MC3: "Tree-of-thoughts is just an extension of CoT."
**Reality:** false. **ToT introduces explicit search** over reasoning states — backtracking, branch evaluation, multiple paths considered simultaneously. CoT is a single sequential trace. **ToT changes the algorithm**; CoT is just a prompt.

### MC4: "PRMs are strictly better than ORMs."
**Reality:** false. **R1 demonstrated that pure outcome rewards work**, with no PRM. PRMs add complexity and can introduce reward-hacking (the model "performs reasoning steps" to score well, even if the steps don't help the answer). **Both have their place**; ORMs are often simpler and equally effective.

### MC5: "Test-time compute always pays off."
**Reality:** false. **Diminishing returns are real.** Spending 100× inference compute on a question the model could answer at 1× is wasteful. **Scaling helps most on the *hardest* problems**, where the marginal benefit of extra thinking is largest. For easy problems, the curve flattens.

### MC6: "Modern reasoning models are just CoT applied during training."
**Reality:** partly true but misses the depth. **RLVR is what makes o1/R1 work.** The model learns to *generate effective* reasoning traces through trial-and-error during RL training (Ch 14). The reasoning behavior is *trained*; it's not just CoT applied at runtime. **The chapter's central insight: the modern paradigm is fundamentally different from the prompting era.**

### MC7: "Reasoning models 'really think.'"
**Reality:** philosophically loaded; empirically: they generate token sequences. **Whether reasoning traces constitute "real thinking"** is a deep question that the chapter doesn't resolve. What's clear empirically: extended traces produced via RLVR-trained models *correlate* with much higher accuracy on hard tasks. **The accuracy is real; the philosophical question is open.**

### MC8: "Hidden thinking (o1-style) is better than visible thinking (R1-style)."
**Reality:** false; mostly a design choice. **OpenAI's o1 hides the reasoning trace** for various reasons (competitive moat; safety; user experience). **R1 and Gemini Thinking show the trace.** Both work; the visibility choice is product, not algorithmic. **R1's open trace has the advantage of explainability**: users see *why* the model arrived at an answer.

---

## Tricky implementation details

### TID1: CoT prompt engineering at scale
For few-shot CoT, **exemplar choice matters**. Mismatched exemplars (different reasoning style than the target task) hurt performance. **Production systems often use task-adaptive exemplar selection** — retrieve relevant CoT examples for each query.

### TID2: Self-consistency sampling temperature
Self-consistency needs **non-trivial sampling variance** to be useful. **Common bug**: running self-consistency with $T = 0$ — all samples are identical. **Typical configuration**: $T = 0.7$, top-p $= 0.95$ for diversity.

### TID3: Trace length and KV cache
Long reasoning traces (R1 can emit 10K+ thinking tokens for hard problems) **dominate KV cache memory**. **Bridge to Ch 17**: reasoning models stress the KV cache aggressively. **PagedAttention is essential.** Some systems use **KV cache quantization** (Ch 18) for reasoning models.

### TID4: Final answer extraction
After a long CoT trace, **extracting the final answer is non-trivial**. Common patterns: `\boxed{...}` for math; specific markers ("The final answer is..."); structural output (JSON with answer field). **Constrained decoding (Ch 19)** helps here — force the answer into a parseable structure.

### TID5: Reasoning model temperature
**Reasoning models default to lower temperatures** than chat models: typically $T = 0.6 - 0.7$. Why: the model is trained to produce a coherent reasoning trace; high temperature breaks the coherence. **R1 recommends $T = 0.6$**; o1 doesn't expose temperature.

### TID6: PRM-vs-ORM training data
PRMs need **step-by-step labels**: was each step correct? This requires human annotation of intermediate reasoning steps — expensive. **PRM800K** (the dataset behind Lightman 2023) used GPT-4 to generate step annotations for math problems. **ORMs** only need final-outcome labels — much cheaper.

### TID7: Best-of-N with verifier
**Best-of-N**: sample $N$ traces; score each with a verifier; pick the best.
- **Pros**: simple; scales linearly with $N$
- **Cons**: requires a verifier (a PRM or an ORM); the verifier must be reliable
- **Hybrid**: use **self-consistency + verifier** for additional gain (Snell 2024)

### TID8: Test-time compute as a deployment knob
**Modern serving stacks expose reasoning effort as a parameter.** o1's API has `reasoning_effort = low | medium | high`. R1-style serving exposes `max_thinking_tokens`. **This is a new operational dimension** of LLM deployment — pre-2024, there was no "reasoning compute" knob.

### TID9: Reasoning + structured outputs
**Combining reasoning with constrained decoding** (Ch 19) is non-trivial. The model needs to:
1. Generate free-form reasoning trace
2. Switch to structured-output mode for the final answer

**Modern recipes**: use `<think>...</think>` tags for reasoning; structured output begins after `</think>`. The FSM only activates for the post-thinking portion.

### TID10: Reasoning model evaluation
**Evaluating reasoning models is different** from evaluating chat models. For chat: BLEU, ROUGE, human preference. For reasoning: exact-match on benchmarks (AIME), test-pass rate (HumanEval+), error analysis on reasoning traces. **Ch 26** covers this in detail.

---

## Reference implementations

### Zero-shot CoT prompting (pseudo)

```python
def zero_shot_cot(model, question):
    """
    Zero-shot CoT: just append "Let's think step by step."
    """
    prompt = f"Q: {question}\\nA: Let's think step by step."
    trace = model.generate(prompt, max_tokens=1000)
    # Final answer often appears at the end; use a parser or another model call
    return trace

# Demo: a math problem
question = "If a train travels 60 miles in 2 hours, what is its speed in mph?"
# trace = zero_shot_cot(model, question)
# print(trace)
# 
# Typical output:
# "The train travels 60 miles in 2 hours.
#  Speed = distance / time
#  Speed = 60 / 2 = 30 mph
#  The answer is 30 mph."

# Without "Let's think step by step", the same model might output:
# "The answer is 120 mph."  (wrong — forgot to divide)
```

### Self-consistency aggregation

```python
import numpy as np
from collections import Counter
import re

def extract_answer(trace, pattern=r"answer is (\d+)"):
    """Extract numeric answer from a CoT trace."""
    matches = re.findall(pattern, trace.lower())
    return int(matches[-1]) if matches else None

def self_consistency(model_traces, n_samples):
    """
    Take N CoT traces; majority-vote the final answers.
    """
    answers = []
    for trace in model_traces[:n_samples]:
        ans = extract_answer(trace)
        if ans is not None:
            answers.append(ans)
    
    if not answers:
        return None, 0
    
    # Majority vote
    counter = Counter(answers)
    most_common, count = counter.most_common(1)[0]
    confidence = count / len(answers)
    return most_common, confidence

# Demo: 5 CoT traces, 4 say "30 mph", 1 says "40 mph"
mock_traces = [
    "Speed = 60/2 = 30 mph. The answer is 30.",
    "60 miles in 2 hours. Speed is 30. The answer is 30.",
    "Distance/time. The answer is 30.",
    "I think it's 40. The answer is 40.",   # outlier
    "60 ÷ 2 = 30. The answer is 30.",
]

# answer, confidence = self_consistency(mock_traces, n_samples=5)
# print(f"Answer: {answer}, confidence: {confidence:.0%}")
# Expected: Answer: 30, confidence: 80%
# 
# Self-consistency improves robustness — one outlier trace doesn't change the result.
```

### Best-of-N with a mock PRM

```python
import numpy as np

def mock_prm_score(trace):
    """
    Mock PRM: assigns a score based on trace characteristics.
    Real PRMs are trained transformers that score each step.
    """
    # Mock: longer traces with explicit calculations score higher
    has_explicit_math = '=' in trace or '+' in trace or '/' in trace
    length_score = min(len(trace) / 100, 1.0)
    math_bonus = 0.3 if has_explicit_math else 0.0
    correctness_proxy = 0.5 + length_score * 0.3 + math_bonus
    return min(correctness_proxy, 1.0)

def best_of_n(traces):
    """Pick the trace with the highest PRM score."""
    scored = [(t, mock_prm_score(t)) for t in traces]
    best = max(scored, key=lambda x: x[1])
    return best

# Demo: 4 traces, varying quality
traces = [
    "The answer is 30.",                                            # short, no math shown
    "Speed = 30 mph. The answer is 30.",                           # short with math
    "60 miles / 2 hours = 30 mph. The answer is 30.",             # explicit math
    "We need to compute speed. Distance = 60 miles. Time = 2 hours. Speed = distance/time = 60/2 = 30 mph. The answer is 30.",  # detailed
]

# scored = [(t, mock_prm_score(t)) for t in traces]
# for t, s in sorted(scored, key=lambda x: -x[1]):
#     print(f"score={s:.2f}: {t[:70]}{'...' if len(t) > 70 else ''}")
# 
# The fourth trace (detailed) scores highest.
# A real PRM would score *each step's correctness*, not just length.
# This demo shows the *interface* of best-of-N with PRM.
```

---

## Connections to other chapters

- **Ch 4 (Attention)**: reasoning traces are long sequences; each reasoning token attends to all prior tokens via the KV cache.
- **Ch 13-14 (Post-training)**: modern reasoning models are trained via RLVR (Ch 14). GRPO is R1's algorithm.
- **Ch 16 (Distillation)**: reasoning capability *can be distilled* — R1's smaller students (1.5B to 32B) inherit reasoning ability. Section 7 references this.
- **Ch 17 (Inference optimization)**: reasoning traces are 1000s of tokens long; KV cache + PagedAttention are essential. Tied to TID3.
- **Ch 18 (Quantization)**: reasoning models often combine with INT4 weights + INT8 KV cache for efficient serving.
- **Ch 19 (Sampling)**: reasoning models use specific sampling defaults ($T = 0.6$); constrained decoding for final-answer extraction.
- **Ch 21 (Tool use)**: ReAct (section 4) is the foundation. **Direct bridge.**
- **Ch 22 (RAG)**: ReAct-style search is a form of RAG.
- **Ch 24-26 (Safety/Interp/Eval)**: reasoning traces are valuable interpretability artifacts but also vulnerable to manipulation (jailbreaks via reasoning paths).
- **Ch 27-30 (Agents)**: reasoning underpins all agent loops.

---

## Open questions for the chapter author

### Q1: How much CoT vs how much modern reasoning?
**Recommendation:** balanced. Topic 1 (sections 1-4) covers classic CoT; topic 2 (sections 5-8) covers modern reasoning. **Don't shortchange either.** The classic era established the techniques; the modern era productionized them.

### Q2: ToT depth?
**Recommendation:** brief. Section 3 mentions ToT alongside self-consistency but doesn't deep-dive into the search algorithms. **Don't enumerate BFS/DFS variants.**

### Q3: PRM depth?
**Recommendation:** medium. Section 5 covers PRM concept, two uses (inference filtering, training reward), and the PRM-vs-ORM tradeoff. **The R1 result (pure ORM works) deserves explicit mention.**

### Q4: R1 details?
**Recommendation:** prominent. Section 7 explains R1's recipe (RLVR + GRPO + outcome rewards + optional distillation). **R1 is the most accessible exemplar of the modern paradigm** — open-source, transparent, replicable.

### Q5: Test-time compute math?
**Recommendation:** moderate. Section 6 includes the boxed equation `20.test-time-scaling` showing the empirical form. **Don't derive scaling laws** — the Snell 2024 paper is the reference.

### Q6: Widget candidates
1. **Test-Time Compute Curves (marquee):** show accuracy vs compute curves across reasoning techniques (direct, CoT, self-consistency, best-of-N+PRM, modern reasoning model). Slider for "compute budget"; show accuracy per technique. **Reader sees the scaling story visually.** **Recommended marquee.**
2. **Self-Consistency Aggregator (secondary):** show N reasoning traces being sampled; final answers extracted; majority vote computed. Adjustable N. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 20 is a **two-topic chapter** (classic CoT era + modern reasoning era). Uses the **5-file cadence**.

Planned file layout:
- File 113: research (this)
- File 114: page structure (~700 lines, 8 sections; runnables embedded)
- File 115: Test-Time Compute Curves marquee widget
- File 116: Self-Consistency Aggregator secondary widget
- File 117: exercises + closeout (absorbs file 118 — combined for 5-file cadence)

**Pedagogical outcomes for the reader.** After Ch 20, the reader should be able to:
1. Explain why reasoning techniques exist (limit of direct generation)
2. Apply zero-shot and few-shot CoT prompting
3. Implement self-consistency (sample $N$, majority vote)
4. Understand tree-of-thoughts as search over reasoning paths
5. Distinguish PRM from ORM and explain when each is useful
6. Articulate the test-time compute scaling result
7. Describe modern reasoning models (o1, R1, Gemini Thinking) and their training
8. Choose the right technique for a given task

Eight outcomes. Exercises hit outcomes 2, 3, 5, 6.

**Tonal framing**: exciting and forward-looking — the back half of the curriculum opens here. **Concrete numbers**: GSM8K improvements (5% → 46% with CoT); R1 vs o1 benchmark parity; AIME 2024 scores. **Honest tradeoffs**: PRM complexity vs ORM simplicity; compute cost of reasoning vs accuracy gain; hidden vs visible thinking.

**Phase 13 opening**: Ch 20 opens Phase 13. The reader should feel a clear shift: **Phase 12 ended with deployable models; Phase 13 makes them useful.** Reasoning is the natural starting point — it's the capability that turns a chat model into a problem-solving system. **The energy should pick up here** — readers have done the hard groundwork of Phases 1-12, and now the payoff (capabilities, agents) begins.

**Importance**: reasoning is arguably the most important LLM capability in 2024-2025. The o1/R1 paradigm shift made reasoning models the default for hard tasks. **Engineers need to understand both eras**: classic CoT for general prompting; modern reasoning models for hard problems. **This chapter is their roadmap.**
