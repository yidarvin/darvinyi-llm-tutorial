# Chapter 26 — Evaluation: research

> Curated source material for Chapter 26's build sessions. **The chapter that closes Phase 14.** Phase 14 has covered two of three disciplines: safety (Ch 24 — what we want the model to do) and interpretability (Ch 25 — what the model is actually doing). **This chapter covers the third — how to measure both.** Evaluation turns "this model is better" into a measurable claim. Capability benchmarks (MMLU, HumanEval, HellaSwag, GPQA, MATH); safety benchmarks (HarmBench, TruthfulQA, ToxiGen, WMDP); agentic benchmarks (SWE-bench, GAIA, OSWorld, Upwork HAPI); LLM-as-judge methodology (MT-Bench, Chatbot Arena); eval failure modes — saturation, contamination, reward hacking, Goodhart's law — and the design of new evals. **Single-topic chapter**; uses the **4-file cadence**. **The chapter that turns intuition into measurement — and the last chapter of the discipline arc.**

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Evaluation

**Premise:** Engineering disciplines run on measurement. Without quantitative evaluation, "this model is better" is opinion. **The evaluation discipline of modern AI** is what turns opinion into measurement — through benchmarks, leaderboards, LLM-as-judge methodology, and structured human evaluation. **This chapter is a working-engineer's view of evaluation**: what benchmarks measure, what they miss, how to use them, how they fail, and how to design new ones.

**The framing:** evaluation in modern AI is operationally three things:
1. **Standard benchmarks** — fixed test sets with known answers
2. **Open-ended evaluation** — LLM-as-judge, human evaluation, dynamic arenas
3. **Eval design** — making new evaluations for new capabilities

**Out of scope (other chapters):**
- Safety techniques (Ch 24 — covered)
- Interpretability methods (Ch 25 — covered)
- Agent-specific evaluation in depth (Ch 30 — adjacent)
- Statistical learning theory of evaluation — too theoretical for this chapter

**In scope and locked:**
- **Capability benchmarks**: MMLU, HumanEval, HellaSwag, GPQA, MATH, BBH
- **Safety benchmarks**: HarmBench, TruthfulQA, ToxiGen, WMDP (with brief connections back to Ch 24)
- **Agentic benchmarks**: SWE-bench, GAIA, OSWorld, ML-Bench, Upwork HAPI
- **LLM-as-judge**: MT-Bench, Chatbot Arena, the methodology and its limits
- **Eval failure modes**: saturation, contamination, reward hacking, Goodhart's law
- **Designing new evals**: choosing what to measure, held-out data, calibration, dynamic vs static

**Suggested chapter structure** (8 sections):

1. What is an evaluation? (~400 words)
2. Capability benchmarks (~600 words)
3. Safety benchmarks (~400 words)
4. Agentic benchmarks (~500 words)
5. LLM-as-judge (~500 words)
6. Eval failure modes (~600 words)
7. Designing new evals (~400 words)
8. Phase 14 closes — Phase 15 ahead (~400 words)

Target: ~3800 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Hendrycks et al. 2020 — "Measuring Massive Multitask Language Understanding" (MMLU)
- **arXiv:** [2009.03300](https://arxiv.org/abs/2009.03300)
- **What it contributed:** **MMLU** — 57 subjects spanning STEM, humanities, social sciences; multiple-choice questions at high-school through professional difficulty. Became the **canonical broad capability benchmark** for LLMs from 2020-2024.
- **For the chapter:** central reference for section 2.

### Chen et al. 2021 — "Evaluating Large Language Models Trained on Code" (HumanEval)
- **arXiv:** [2107.03374](https://arxiv.org/abs/2107.03374)
- **What it contributed:** **HumanEval** — 164 Python programming problems with hidden test cases. **Codex paper.** The reference code-generation benchmark for years; eventually saturated.

### Zellers et al. 2019 — "HellaSwag: Can a Machine Really Finish Your Sentence?"
- **arXiv:** [1905.07830](https://arxiv.org/abs/1905.07830)
- **What it contributed:** **HellaSwag** — common-sense reasoning via sentence-completion. **Engineered to be hard for models, easy for humans**; used as a calibration benchmark for years.

### Rein et al. 2023 — "GPQA: A Graduate-Level Google-Proof Q&A Benchmark"
- **arXiv:** [2311.12022](https://arxiv.org/abs/2311.12022)
- **What it contributed:** **GPQA** — 448 graduate-level questions in biology, physics, chemistry written by domain experts. **"Google-proof"** — humans with Google still score ~34%. **The reference difficult capability benchmark** as MMLU saturated.
- **For the chapter:** central reference for section 2.

### Hendrycks et al. 2021 — "Measuring Mathematical Problem Solving With the MATH Dataset"
- **arXiv:** [2103.03874](https://arxiv.org/abs/2103.03874)
- **What it contributed:** **MATH** — 12,500 competition math problems with step-by-step solutions. **The reference math benchmark.**

### Lin et al. 2021 — "TruthfulQA: Measuring How Models Mimic Human Falsehoods"
- **arXiv:** [2109.07958](https://arxiv.org/abs/2109.07958)
- **What it contributed:** **TruthfulQA** — measures whether models repeat common falsehoods. (Cross-referenced from Ch 24.)

### Mazeika et al. 2024 — "HarmBench: A Standardized Evaluation Framework for Automated Red Teaming"
- **arXiv:** [2402.04249](https://arxiv.org/abs/2402.04249)
- **What it contributed:** **HarmBench** — standardized jailbreak evaluation. (Cross-referenced from Ch 24.)

### Anthropic / Hendrycks et al. 2024 — "WMDP" (Weapons of Mass Destruction Proxy)
- **arXiv:** [2403.03218](https://arxiv.org/abs/2403.03218)
- **What it contributed:** **WMDP** — proxy benchmark for dangerous CBRN knowledge. **Used by frontier labs** to test if models retain dangerous capabilities they shouldn't have.

### Jimenez et al. 2023 — "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?"
- **arXiv:** [2310.06770](https://arxiv.org/abs/2310.06770)
- **What it contributed:** **SWE-bench** — agent benchmark of real GitHub issues; given a repo and issue, can the model produce a patch that passes the hidden tests? **The reference agentic-coding benchmark** for 2024-2025.
- **For the chapter:** central reference for section 4.

### Mialon et al. 2023 — "GAIA: A Benchmark for General AI Assistants"
- **arXiv:** [2311.12983](https://arxiv.org/abs/2311.12983)
- **What it contributed:** **GAIA** — multi-step real-world tasks requiring web browsing, tool use, and reasoning. Humans solve ~92%; frontier agents have improved from <30% (2023) to 60-75% (2024-25).

### Xie et al. 2024 — "OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments"
- **arXiv:** [2404.07972](https://arxiv.org/abs/2404.07972)
- **What it contributed:** **OSWorld** — computer-use agent benchmark with real desktop applications. Tests multimodal-agent capability (Ch 23 computer use); 369 tasks.

### Chen et al. 2024 — "MLE-bench: Evaluating Machine Learning Agents on Machine Learning Engineering"
- **arXiv:** [2410.07095](https://arxiv.org/abs/2410.07095)
- **What it contributed:** **MLE-bench** — 75 Kaggle competitions; agents must produce code and submit predictions. **Tests ML engineering agency**, not just code generation.

### Upwork / Anthropic 2024-2025 — "HAPI" (Human-AI Performance Index) — illustrative reference
- **What it contributed:** A benchmark family from Upwork that measures real-world freelance-task completion across thousands of categories. Mentioned because Upwork-style frameworks are the kind of **applied evaluation** production teams build to measure capabilities relevant to their use case. (Real, but referenced lightly — engineers building production should consider domain-specific evals like this.)

### Zheng et al. 2023 — "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena"
- **arXiv:** [2306.05685](https://arxiv.org/abs/2306.05685)
- **What it contributed:** **MT-Bench** — multi-turn QA pairs evaluated by GPT-4-as-judge. **The reference paper for LLM-as-judge methodology** — including its limitations (position bias, verbosity bias, self-enhancement bias).
- **For the chapter:** central reference for section 5.

### Chiang et al. 2024 — "Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference"
- **arXiv:** [2403.04132](https://arxiv.org/abs/2403.04132)
- **What it contributed:** **Chatbot Arena (LMSYS)** — crowdsourced human preference comparisons between LLMs. **Elo ratings** computed from pairwise battles. **The reference open leaderboard** for general capability.

### Goodhart 1975 — "Problems of Monetary Management" (Goodhart's Law)
- **What it contributed:** "When a measure becomes a target, it ceases to be a good measure." **The classic statement of the saturation/gaming problem** in evaluation — applied widely in AI eval discussions.

### Various 2024 — Contamination work
- Multiple papers (Sainz et al., Yang et al., Magar & Schwartz) have documented **training-set contamination** of major benchmarks. Models that have seen the test set during pretraining can score artificially high. **A major confound in modern eval.**

---

## Core concepts

### Concept 1: What is an evaluation?

**Operational definition** (what eval teams do):
1. **Define what to measure** (capability, safety, alignment, utility)
2. **Build or choose a test set** (fixed benchmark, dynamic arena, human evaluation)
3. **Run models against it** and compute a score
4. **Compare across models** to claim improvement (or not)

**The three flavors of modern AI evaluation**:

```mdx
<Equation label="26.eval-flavors">
$$\text{standard benchmarks} \;\;\Vert\;\; \text{open-ended evaluation} \;\;\Vert\;\; \text{eval design}$$
</Equation>
```

- **Standard benchmarks** — fixed test sets with known answers (MMLU, HumanEval, HarmBench)
- **Open-ended evaluation** — LLM-as-judge, human evaluation, dynamic arenas (MT-Bench, Chatbot Arena)
- **Eval design** — making new evaluations for new capabilities (SWE-bench, GAIA, WMDP)

**Why evaluation is hard**:
- **Calibration**: a score of 75% doesn't mean the model is "75% capable" — it depends on the distribution
- **Saturation**: when models max out a benchmark, it stops being informative
- **Contamination**: if test data leaked into pretraining, scores are inflated
- **Goodhart's law**: when a metric becomes a target, it ceases to be a good metric
- **Distribution shift**: benchmark distribution ≠ deployment distribution

**Empirical scale (early 2025)**:
- **Frontier model release cycles**: 6-12 months
- **Active benchmarks**: ~50-100 widely-cited, hundreds more domain-specific
- **Saturation pace**: a hard benchmark can saturate (top score above human level) in 12-24 months
- **Cost of running**: 1k-100k inferences per model per benchmark; thousands of dollars

**The chapter's stance**: **evaluation is the bridge from craft to engineering.** Without it, AI development can't claim progress in a verifiable way. With it, comparisons across models, prompts, and techniques become rigorous. **But evaluation is also where engineering meets economics and politics** — leaderboard rankings affect billions in market cap.

### Concept 2: Capability benchmarks

**The capability-benchmark landscape (early 2025)**:

| Benchmark | Released | What it measures | Saturation |
|-----------|----------|------------------|------------|
| **MMLU** | 2020 | 57 subjects, MC questions | Mostly saturated (frontier ~88-90%) |
| **HumanEval** | 2021 | Python code generation | Saturated (~95%+) |
| **HellaSwag** | 2019 | Common-sense reasoning | Saturated (~95%+) |
| **MATH** | 2021 | Competition math problems | Saturated (~95%+) |
| **GPQA** | 2023 | Graduate-level science | Active (~55-70% frontier) |
| **BBH (BIG-bench Hard)** | 2022-23 | 23 hard tasks | Mostly saturated |
| **HumanEval+ / MBPP+** | 2022-23 | Harder code generation | Active |
| **MMLU-Pro** | 2024 | Harder MMLU variant | Active |

**The pattern**: most benchmarks saturate in 12-36 months. **GPQA is the modern hard benchmark**; new ones are released as old ones max out.

**What capability benchmarks measure well**:
- **Knowledge breadth** (MMLU spans 57 subjects)
- **Code synthesis** (HumanEval is a clean signal of "can produce working code")
- **Math reasoning** (MATH stress-tests step-by-step computation)
- **Logical/scientific reasoning** (GPQA pushes graduate-level)

**What capability benchmarks measure poorly**:
- **Open-ended generation quality** (no clean metric)
- **Conversational ability** (single-turn evals miss conversational drift)
- **Long-context reasoning** (most benchmarks are short)
- **Real-world tasks** (everything in a benchmark is a stylized version of work)

**Capability benchmark methodology**:
- **Multi-choice format** (MMLU, GPQA): easy to score, but vulnerable to surface heuristics
- **Open-ended format with hidden tests** (HumanEval, MATH): test-case verification; cleaner but more compute
- **Chain-of-thought variants**: many benchmarks now have CoT-allowed and CoT-restricted scoring

**Score interpretation**:
- **Random baseline** (4-choice MC): 25%
- **Frontier model expectation** (2025): 60-90% on hard benchmarks, 90%+ on saturated ones
- **Human expert ceiling**: 80-95% on most; 100% on saturated ones

### Concept 3: Safety benchmarks

(Brief — these were introduced in Ch 24; recapped here as part of the eval landscape.)

**The safety-benchmark landscape**:
- **TruthfulQA** (Lin 2021): 817 questions on common falsehoods; measures whether models repeat them
- **HarmBench** (Mazeika 2024): jailbreak success rates across categories of harm
- **JailbreakBench**: another standardized jailbreak eval; allows controlled comparisons
- **ToxiGen**: toxic vs benign language classification
- **WMDP** (Hendrycks 2024): dangerous CBRN knowledge proxy
- **Anthropic's internal safety evals**: detailed sweeps including manipulation, sycophancy, etc.

**What safety benchmarks measure well**:
- **Direct harm** (HarmBench): does the model produce harmful content when asked?
- **Truthfulness** (TruthfulQA): does the model give correct answers, not popular ones?
- **Dangerous capability proxy** (WMDP): could the model help with dangerous tasks?

**What safety benchmarks measure poorly**:
- **Calibrated refusals**: over-refusal vs under-refusal (separate evals needed)
- **Novel jailbreaks**: by definition, a benchmark covers known patterns
- **Multi-turn manipulation**: most safety benchmarks are single-turn
- **Long-tail safety failures**: rare-but-severe failures don't show up in aggregate scores

**Linking back to Ch 24**: safety benchmarks are **necessary but not sufficient** for deployment decisions. **They're one signal; red-teaming, interpretability monitoring, and post-deployment review fill out the picture.**

### Concept 4: Agentic benchmarks

**The new frontier of evaluation.** Phase 13 covered agentic capabilities (tool use, RAG, multimodal); Phase 14's eval discipline needs benchmarks for these.

**The agentic-benchmark landscape**:
- **SWE-bench** (Jimenez 2023): real GitHub issues; produce a patch that passes hidden tests; the reference agentic-coding benchmark
- **GAIA** (Mialon 2023): multi-step real-world tasks (web browsing, tool use, reasoning); humans solve ~92%, frontier agents ~60-75%
- **OSWorld** (Xie 2024): computer-use tasks with real desktop applications; tests Ch 23 computer-use capability
- **MLE-bench** (Chen 2024): 75 Kaggle competitions; agents produce code, submit predictions; tests ML engineering agency
- **WebArena**: web-browsing agent tasks
- **Cybench**: cybersecurity capture-the-flag tasks
- **Upwork HAPI** (illustrative): real freelance tasks measuring agent performance on what Upwork freelancers actually do

**What agentic benchmarks measure well**:
- **End-to-end task completion**: did the agent solve the task?
- **Tool-use chains**: can the agent compose multiple tools?
- **Resilience to environmental noise**: does the agent recover from errors?
- **Real-world relevance**: tasks look like actual work

**What agentic benchmarks measure poorly**:
- **Cost** (each evaluation run is expensive; agents take many turns)
- **Reproducibility** (real environments change; flaky tests)
- **Specific failure modes** (knowing the score doesn't tell you what's failing)

**The trajectory**:
- **2023**: most agents <30% on GAIA
- **2024**: 50-65% with frontier models + good scaffolding
- **2025**: 70%+ achievable; GAIA may saturate within 1-2 years

**Why this matters**: agentic benchmarks **are the new frontier**. As classic benchmarks saturate, agentic ones become the discriminator between models.

### Concept 5: LLM-as-judge

**The methodology** (Zheng 2023):
1. **Run two models** on the same prompts
2. **Have a stronger model judge** which response is better
3. **Aggregate judgments** into win rates or Elo ratings

**Standard implementations**:
- **MT-Bench** (Zheng 2023): 80 multi-turn questions across 8 categories; GPT-4 judges
- **Chatbot Arena** (Chiang 2024): humans judge crowdsourced battles between LLMs; Elo ratings

**What LLM-as-judge measures well**:
- **Open-ended generation quality** (no clean metric exists otherwise)
- **Conversation quality** (multi-turn, contextual)
- **Relative comparison** (which model is better, more than absolute scoring)

**LLM-as-judge bias modes** (Zheng 2023 documented these):
- **Position bias**: judges favor the first response shown
- **Verbosity bias**: judges prefer longer responses
- **Self-enhancement bias**: a judge model prefers responses from its own family
- **Coverage bias**: judges miss subtle factual errors they don't know

**Mitigation techniques**:
- **Randomize positions** in pairwise comparisons
- **Multiple judges** to average out biases
- **Calibrate judges** against human-labeled data
- **Reasoning judgments**: have the judge explain its reasoning (reduces some biases)

**Chatbot Arena specifics**:
- Crowdsourced humans pick the better of two anonymized model responses
- Elo ratings updated continuously; over a million votes by 2025
- **The closest thing to a "ground truth" capability ranking** for chat-style use
- But: biased toward chat users' preferences; doesn't measure agentic capability well

**When to use LLM-as-judge**:
- **Useful**: open-ended generation, conversation quality, style comparisons
- **Less useful**: factual accuracy (judges can be wrong), math/code (use programmatic verification), safety (use specialized benchmarks)

### Concept 6: Eval failure modes

**The empirical reality**: benchmarks fail in characteristic ways.

**Failure mode 1: Saturation**:
- A benchmark stops being informative when models reach the ceiling
- **Example**: HumanEval was the code benchmark for years; now ~95%+ for frontier models — small differences are within noise
- **Response**: build harder benchmarks (GPQA replaced MMLU's hard tier)

**Failure mode 2: Contamination**:
- If benchmark data appeared in pretraining, scores are inflated
- **Documented across major benchmarks**: GSM8K, MATH, MMLU, HumanEval
- **Detection**: check if a model can complete test items it shouldn't have seen
- **Response**: held-out evals, dynamic benchmarks, frequent rotation

**Failure mode 3: Reward hacking**:
- Models score well by gaming the metric, not solving the task
- **Example**: a code model produces code that passes the visible tests by hard-coding test cases
- **Example**: a math model memorizes problem-answer pairs from training
- **Response**: test on held-out items, look at qualitative output, use multiple metrics

**Failure mode 4: Goodhart's law**:
- When a benchmark becomes a target (for training, comparison, marketing), the metric stops measuring the underlying capability
- **Example**: optimizing for MMLU directly produces benchmark-tuned models that don't necessarily generalize
- **Response**: hold out evals that aren't published, use surprise benchmarks, track multiple correlated metrics

**Failure mode 5: Distribution shift**:
- Benchmark distribution ≠ deployment distribution
- A model that scores 90% on MMLU may not generalize to your domain
- **Response**: domain-specific evals, deployment metrics, user feedback signals

**Failure mode 6: Single-metric thinking**:
- A single benchmark score hides important variation
- **Example**: a model with 85% MMLU and 35% TruthfulQA is very different from 75%/65%
- **Response**: dashboards of multiple metrics; never compare on one number alone

**Failure mode 7: Capability vs propensity** (from Ch 24 — relevant here):
- Benchmarks measure what a model *can* do; deployment depends on what it *does*
- **WMDP** is the canonical example: measures dangerous knowledge, doesn't measure propensity to share

**The systemic implication**: **modern AI eval is a dashboard, not a number.** Treating any single benchmark as the model's overall quality is misleading.

### Concept 7: Designing new evals

**When you need a new eval**:
- New capability not covered by existing benchmarks (e.g., agentic coding, computer use)
- Domain-specific (e.g., medical Q&A, legal reasoning)
- Safety-critical area (e.g., child safety, election integrity)
- Internal product metrics (e.g., does our chatbot help users complete onboarding?)

**The new-eval design checklist**:

1. **What are you measuring?**
   - State the capability/property precisely
   - Distinguish from related metrics
   - Decide: capability, propensity, or both

2. **What's the test format?**
   - Multi-choice (easy to score, biased toward surface heuristics)
   - Open-ended with hidden tests (cleaner; needs verification logic)
   - LLM-as-judge (needs careful judge selection + bias mitigation)
   - Human evaluation (expensive; gold-standard)
   - Real-environment simulation (most realistic; most complex)

3. **What's the test set?**
   - Sample size (statistical power)
   - Difficulty distribution (avoid all-easy or all-hard)
   - Representativeness (matches deployment distribution)
   - Held-out from training (contamination prevention)

4. **What's the calibration?**
   - Random baseline (chance level)
   - Human baseline (expert, non-expert)
   - Current SOTA (where do existing models score?)
   - Target threshold (what "good" means)

5. **How will you maintain it?**
   - Rotation policy (avoid contamination over time)
   - Versioning (track benchmark changes)
   - Public vs private (trade transparency vs contamination risk)

**Production patterns**:
- **Hold-out test sets**: never publish them; use them only for internal evaluation
- **Multi-judge ensembles** for LLM-as-judge
- **Domain-specific evals** in addition to broad benchmarks
- **Live deployment metrics**: real-world signals are the ultimate eval

### Concept 8: Phase 14 closes — Phase 15 ahead

**Phase 14 retrospective**:

The three disciplines come together:

| Discipline | Question | This chapter's role |
|------------|----------|--------------------|
| Safety (Ch 24) | What do we want? | Behavioral discipline |
| Interpretability (Ch 25) | What's the model doing? | Mechanistic discipline |
| Evaluation (Ch 26, **this chapter**) | How do we measure both? | Quantitative discipline |

**All three together** turn AI development from craft to engineering. **No single discipline suffices**:
- Safety without measurement is wishful thinking
- Interpretability without measurement can't validate claims
- Evaluation without safety thinking misses what matters

**Where Phase 14 leaves the curriculum**: with a complete discipline arc. **A capable model (Phase 13)** + **a trustworthy development process (Phase 14)** = the foundations of modern AI production.

**Phase 15 (Agents) ahead**:
- Ch 27 (Agent foundations) — ReAct, AutoGPT, the agentic loop
- Ch 28 (Agents from scratch) — building real agents
- Ch 29 (Multi-agent) — orchestration, agent-to-agent communication
- Ch 30 (Agent eval and frameworks) — closes the curriculum

**The arc completes**: capabilities (Phase 13) → disciplines (Phase 14) → composition (Phase 15). **Then the tutorial closes.**

---

## Glossary

- **Benchmark**: a fixed test set with known answers
- **Capability benchmark**: tests what the model can do (MMLU, HumanEval)
- **Safety benchmark**: tests behavioral safety (HarmBench, TruthfulQA)
- **Agentic benchmark**: tests multi-step task completion (SWE-bench, GAIA)
- **LLM-as-judge**: using a stronger model to evaluate another model's output
- **Chatbot Arena**: crowdsourced pairwise comparison; Elo ratings
- **MT-Bench**: 80-question LLM-as-judge benchmark
- **Saturation**: when models reach a benchmark's ceiling
- **Contamination**: when benchmark data leaked into training data
- **Reward hacking**: scoring well by gaming the metric, not solving the task
- **Goodhart's law**: when a measure becomes a target, it ceases to be a good measure
- **Distribution shift**: benchmark distribution ≠ deployment distribution
- **Capability vs propensity**: can do vs does do
- **Held-out evaluation**: test set never used during training
- **Calibration**: aligning scores with meaningful thresholds (random, human, target)
- **Dynamic eval**: benchmark that changes over time (vs static fixed set)
- **WMDP**: Weapons of Mass Destruction Proxy benchmark
- **GAIA**: General AI Assistants benchmark
- **SWE-bench**: Software Engineering benchmark
- **MMLU**: Massive Multitask Language Understanding
- **GPQA**: Graduate-Level Google-Proof Q&A

---

## Pedagogical analogies

### 1. Benchmarks as thermometers
A thermometer reports a number, but the interpretation depends on context (cold for a fever, hot for a fridge). **Benchmark scores are the same** — 75% on MMLU is excellent for 2020 models, mediocre for 2025. **Calibration matters.**

Best used for: section 1.

### 2. Saturation as the ceiling of a test
A vocabulary test for 5-year-olds is useful at age 4-6; useless at age 12. **Benchmarks saturate the same way.** Once everyone aces the test, it stops discriminating — time for a harder one.

Best used for: section 6.

### 3. Contamination as cheating on an open-book exam
If a student has memorized the answer key, their score is meaningless. **Benchmark contamination is the same** — models that saw the test in pretraining have an unfair advantage. **Held-out evals are the closed-book version.**

Best used for: section 6.

### 4. Goodhart's law as teaching to the test
Schools that focus on standardized-test scores often produce students who can pass the test but lack broader skills. **Models optimized for benchmark scores often hit the metric but miss the underlying capability.** Goodhart's law in action.

Best used for: section 6.

### 5. LLM-as-judge as peer review
Academic peer review uses experts to evaluate work in their field. **LLM-as-judge is the AI analog** — strong models evaluate other models' output. **Both have known biases (position, verbosity, in-group preference)**; both are useful despite them.

Best used for: section 5.

---

## Common misconceptions

### MC1: "A higher MMLU score means a better model."
**Reality:** false in isolation. **MMLU is one signal among many.** A model with 88% MMLU and 30% TruthfulQA is unsafe; a model with 75% MMLU and 60% safety scores may be better for production. **Single-metric comparisons are misleading.**

### MC2: "Benchmark saturation means the field has solved that capability."
**Reality:** false. **Saturation means the benchmark stops discriminating**, not that the capability is solved. Many "saturated" benchmarks have known failure modes — models still get them wrong in distribution, just not on the test set.

### MC3: "Held-out test sets prevent contamination."
**Reality:** partially true. **A held-out test set prevents direct contamination during pretraining**, but: indirect leakage (paraphrased versions in training data), evaluation-data leakage (researchers training on test sets), and **publication itself** (once published, the test is potentially in next-generation pretraining) all defeat held-out protection.

### MC4: "LLM-as-judge is just as good as human evaluation."
**Reality:** false for many cases. **LLM judges have documented biases** (position, verbosity, self-enhancement, factual coverage gaps). For style and conversational quality, they correlate well with humans. For factual accuracy, math, code correctness — use programmatic verification, not LLM judges.

### MC5: "Chatbot Arena is the definitive capability ranking."
**Reality:** partially true. **Chatbot Arena's Elo ratings are the best available open ranking for chat-style use cases.** But: biased toward chat users' preferences; doesn't measure agentic capability, long-context reasoning, or domain-specific work well. **It's one ranking among many.**

### MC6: "Reward hacking is rare."
**Reality:** false. **Reward hacking has been documented across major benchmarks** — code models hard-coding test cases, models memorizing benchmark items, models exploiting eval format. The closer a metric is to a training target, the more it gets hacked.

### MC7: "Capability benchmarks measure what matters for deployment."
**Reality:** false in production. **Capability benchmarks measure what they measure** — usually stylized tasks distant from real work. **Production teams build domain-specific evals** because public benchmarks don't capture their use case.

### MC8: "Eval design is a research problem, not an engineering one."
**Reality:** false. **Every production AI team builds custom evals.** Designing them — choosing what to measure, how to score, how to maintain — is core production engineering. **Not optional; essential.**

---

## Tricky implementation details

### TID1: Benchmark scoring formats
- **Multi-choice**: easy to grade, vulnerable to shortcuts (e.g., choosing always-A)
- **Free-form with exact match**: brittle (paraphrases fail)
- **Free-form with LLM-as-judge**: nuanced but judge-biased
- **Code with hidden tests**: clean signal, expensive to run
- **Open-ended with rubrics**: requires careful rubric design

### TID2: Calibration vs raw scoring
A raw score (75%) is meaningless without calibration:
- **Random baseline**: chance accuracy
- **Human baseline**: expert / non-expert performance
- **SOTA reference**: where the field is
- **Threshold**: what counts as "good"

**Always report multiple calibrations**, not just the raw number.

### TID3: Test set quality control
- **Annotator agreement**: do human labelers agree? (Low agreement → ambiguous test items)
- **Edge cases**: ensure the test set includes hard cases, not just easy ones
- **Distribution check**: items match the deployment distribution
- **Diversity**: span the relevant subdomains

### TID4: Eval cost management
- **Inference cost** per item × items per benchmark × benchmarks per model evaluation = $$$
- **Sampling**: use stratified samples for large benchmarks
- **Caching**: store model outputs to avoid re-running on incidental changes
- **Cost-aware comparisons**: sometimes a smaller, focused eval is more informative

### TID5: Prompt sensitivity
- **Eval scores depend on prompt format.** Different prompts can produce different rankings.
- **Standard practice**: use the benchmark's recommended prompt; report the prompt; don't optimize prompts per model.

### TID6: Multi-shot vs zero-shot
- **Few-shot evals** can be much higher than zero-shot
- Some benchmarks specify the shot count; others let the evaluator choose
- **Cross-paper comparisons fail** when shot counts differ; check methodology

### TID7: Stochasticity in eval
- Temperature > 0 means non-deterministic outputs
- **Run multiple samples; report variance**
- Or: use temperature 0 / greedy decoding for reproducibility (with the caveat that this isn't deployment behavior)

### TID8: Eval data leakage during fine-tuning
- A model fine-tuned on training data adjacent to the eval can score higher post-tune
- **Be skeptical of post-tune scores** until you've checked for adjacent leakage

### TID9: Versioning benchmarks
- Benchmarks evolve. **Cite the version** when reporting scores.
- Old leaderboards might use older versions; cross-version comparisons can mislead.

### TID10: Aggregating across benchmarks
- Average across benchmarks weights them equally — usually wrong
- **Pareto frontiers** are often more informative than averages
- **Domain-weighted aggregates** match production reality better

---

## Reference implementations

### A small benchmark scoring harness

```python
# A minimal benchmark scoring harness.
# Run a model (mocked) against test items; compute accuracy and per-category breakdown.

# Mock benchmark: 8 items across 2 categories (math, history)
TEST_ITEMS = [
    {'q': 'What is 2 + 2?',                              'category': 'math',    'answer': '4'},
    {'q': 'What is 5 * 7?',                              'category': 'math',    'answer': '35'},
    {'q': 'What is sqrt(144)?',                          'category': 'math',    'answer': '12'},
    {'q': 'What is the integral of x^2?',                'category': 'math',    'answer': 'x^3/3 + C'},
    {'q': 'When was the Declaration of Independence?',   'category': 'history', 'answer': '1776'},
    {'q': 'Who was the first US president?',             'category': 'history', 'answer': 'George Washington'},
    {'q': 'What year did WWII end?',                     'category': 'history', 'answer': '1945'},
    {'q': 'What empire was Julius Caesar from?',         'category': 'history', 'answer': 'Roman'},
]


def mock_model(question):
    """Pretend this is a real model. Returns mock answers."""
    # In production: actual API call to claude-sonnet-4, GPT-4, etc.
    answers = {
        '2 + 2':           '4',
        '5 * 7':           '35',
        'sqrt(144)':       '12',
        'integral of x^2': "x^3/3 + C",
        'Declaration':     '1776',
        'first US':        'George Washington',
        'WWII end':        '1944',                     # wrong!
        'Julius Caesar':   'Greek',                     # wrong!
    }
    for keyword, answer in answers.items():
        if keyword in question:
            return answer
    return '???'


def score_item(predicted, expected):
    """Exact match (case-insensitive). Real benchmarks use more flexible matching."""
    return predicted.strip().lower() == expected.strip().lower()


def run_benchmark(items, model_fn):
    """Run a model against all items. Return per-item and per-category results."""
    results = []
    for item in items:
        pred = model_fn(item['q'])
        correct = score_item(pred, item['answer'])
        results.append({
            'q': item['q'],
            'category': item['category'],
            'expected': item['answer'],
            'predicted': pred,
            'correct': correct,
        })
    return results


def summarize(results):
    """Compute overall and per-category accuracy."""
    n = len(results)
    correct = sum(r['correct'] for r in results)
    overall = correct / n
    
    by_category = {}
    for cat in set(r['category'] for r in results):
        cat_results = [r for r in results if r['category'] == cat]
        by_category[cat] = sum(r['correct'] for r in cat_results) / len(cat_results)
    
    return {
        'overall': overall,
        'by_category': by_category,
        'n': n,
        'correct': correct,
    }


# Run
results = run_benchmark(TEST_ITEMS, mock_model)
summary = summarize(results)

print(f"Benchmark results")
print(f"  Overall: {summary['correct']}/{summary['n']} = {summary['overall']:.0%}")
print(f"  By category:")
for cat, acc in summary['by_category'].items():
    print(f"    {cat:>10}:  {acc:.0%}")

# Show errors
errors = [r for r in results if not r['correct']]
if errors:
    print(f"\\n  Errors ({len(errors)}):")
    for e in errors:
        print(f"    Q: {e['q']}")
        print(f"      Expected: {e['expected']}; Got: {e['predicted']}")

# Observations:
# - Even a tiny benchmark surfaces per-category variation (math vs history)
# - Real benchmarks: thousands of items, more nuanced scoring (paraphrase tolerance, partial credit)
# - The harness pattern (run + score + summarize) is the same at any scale
```

### LLM-as-judge with bias mitigation (sketch)

```python
# LLM-as-judge with position-bias mitigation via swapped-position re-judging.

def mock_judge(prompt, response_a, response_b):
    """
    Mock: a strong LLM-as-judge returns 'A', 'B', or 'tie' based on the responses.
    Real implementation: call GPT-4 or Claude with a judge prompt.
    
    We mock with simple heuristics to demonstrate bias.
    """
    len_a = len(response_a)
    len_b = len(response_b)
    # SIMULATE A VERBOSITY BIAS: judge sometimes favors longer responses
    if len_a > len_b * 1.3:
        return 'A'
    if len_b > len_a * 1.3:
        return 'B'
    return 'tie'


def judge_with_swap(prompt, response_a, response_b):
    """
    Run the judge in both orderings; if results disagree, return 'tie'.
    Mitigates position bias.
    """
    # First ordering: A then B
    judgment_ab = mock_judge(prompt, response_a, response_b)
    # Swapped ordering: B then A (results need to flip back)
    judgment_ba = mock_judge(prompt, response_b, response_a)
    # Re-map judgment_ba to A/B perspective:
    #   'A' in second call means response_b (which was in position A) wins → maps to 'B'
    #   'B' in second call means response_a wins → maps to 'A'
    #   'tie' stays 'tie'
    if judgment_ba == 'A':
        judgment_ba = 'B'
    elif judgment_ba == 'B':
        judgment_ba = 'A'
    
    if judgment_ab == judgment_ba:
        return judgment_ab
    return 'tie'   # bias detected → call it a tie


# Test cases
test_cases = [
    {
        'prompt': 'Explain photosynthesis briefly.',
        'response_a': 'Plants use sunlight, CO2, and water to produce sugar and oxygen.',
        'response_b': 'Photosynthesis is the process by which green plants and certain other organisms use sunlight to synthesize foods with the help of chlorophyll. The chemical reaction involves carbon dioxide and water producing glucose and oxygen as a byproduct.',
    },
    {
        'prompt': 'What is 12 * 11?',
        'response_a': '132',
        'response_b': '132',
    },
    {
        'prompt': 'Name three planets.',
        'response_a': 'Mercury, Venus, Earth.',
        'response_b': 'Mars, Jupiter, Saturn.',
    },
]

print(f"LLM-as-judge with position-bias mitigation\\n")
for case in test_cases:
    # Naive judgment (single direction)
    naive = mock_judge(case['prompt'], case['response_a'], case['response_b'])
    # Mitigated judgment (swap and recheck)
    mitigated = judge_with_swap(case['prompt'], case['response_a'], case['response_b'])
    
    print(f"Prompt: {case['prompt']}")
    print(f"  A ({len(case['response_a']):>3} chars): {case['response_a'][:60]}...")
    print(f"  B ({len(case['response_b']):>3} chars): {case['response_b'][:60]}...")
    print(f"  Naive judgment:     {naive}")
    print(f"  Swap-mitigated:     {mitigated}")
    print()

# Observations:
# - The naive judge with verbosity bias favors longer responses
# - Swap-mitigation catches the bias (longer always wins in both orderings → still biased)
# - For position bias specifically, swap-mitigation works well (Zheng 2023)
# - For verbosity bias: need rubric-based judging or human calibration
# - Real LLM-as-judge: multiple judges, calibration against human labels, explicit reasoning
```

### Reward hacking detection (illustrative)

```python
# Detect simple forms of reward hacking on a code benchmark:
# A model that "solves" by hard-coding test cases rather than implementing the function.

def looks_like_hardcoded(submission, test_cases):
    """
    Heuristic: does the submission appear to hard-code the test cases?
    Real detection: more nuanced (AST analysis, abstract interpretation).
    """
    # Simple check: does the submission's code text contain many of the test inputs/outputs?
    hits = 0
    for tc in test_cases:
        input_str = str(tc['input'])
        output_str = str(tc['expected_output'])
        if input_str in submission and output_str in submission:
            hits += 1
    # If most test cases appear literally in the code, suspect hard-coding
    return hits / max(1, len(test_cases))


# Mock benchmark: a "double" function with 4 test cases
TEST_CASES = [
    {'input': 2, 'expected_output': 4},
    {'input': 5, 'expected_output': 10},
    {'input': 7, 'expected_output': 14},
    {'input': 100, 'expected_output': 200},
]


# Two submissions: clean vs hard-coded
submissions = {
    'clean': '''
def double(x):
    return x * 2
''',
    'hardcoded': '''
def double(x):
    if x == 2: return 4
    if x == 5: return 10
    if x == 7: return 14
    if x == 100: return 200
    return None   # off-distribution: model fails outside the test set
''',
}

print("Reward hacking detection\\n")
for name, sub in submissions.items():
    suspicion = looks_like_hardcoded(sub, TEST_CASES)
    flag = '⚠️  POSSIBLE HACKING' if suspicion > 0.5 else '✓ looks clean'
    print(f"{name}:")
    print(f"  Suspicion score: {suspicion:.0%} of test cases appear in code")
    print(f"  Verdict: {flag}")
    print()

# Observations:
# - Hard-coding is one of the simplest reward-hacking patterns
# - Pattern matching catches obvious cases; sophisticated hacks need more analysis
# - Production code-eval frameworks add: hidden test cases (model can't see them);
#   adversarial test generation; static analysis; runtime probes
# - The principle generalizes: any time the metric is a target, models will optimize
#   for the metric rather than the underlying capability (Goodhart's law)
```

---

## Connections to other chapters

- **Ch 12 (Pretraining)**: train/eval distribution mismatch; eval data contamination during pretraining
- **Ch 14 (Post-training)**: RLHF reward hacking; training on eval data
- **Ch 19 (Sampling)**: temperature affects benchmark variance; deterministic decoding for reproducibility
- **Ch 20 (Reasoning)**: CoT changes benchmark scoring; many evals now have CoT-allowed variants
- **Ch 21 (Tool use)**: agentic benchmarks measure tool-use chains
- **Ch 22 (RAG)**: RAG-specific benchmarks (BEIR, MTEB); contamination of retrieval corpora
- **Ch 23 (Multimodal)**: multimodal benchmarks (VQAv2, POPE); cross-modal evaluation challenges
- **Ch 24 (Safety)**: safety benchmarks (HarmBench, TruthfulQA) — the immediate predecessor's eval suite
- **Ch 25 (Interpretability)**: feature labeling is itself an evaluation problem
- **Ch 27-30 (Agents)**: agent-specific evaluation in depth

---

## Open questions for the chapter author

### Q1: How much depth on each benchmark?
**Recommendation:** brief. Name the canon (MMLU, HumanEval, HellaSwag, GPQA, MATH, BBH); for each, one sentence of what it measures + one sentence of where it stands (active vs saturated). **Don't deep-dive any single benchmark** — engineers will look them up if they need details.

### Q2: How much LLM-as-judge?
**Recommendation:** substantial. **LLM-as-judge is the most practically-relevant eval method** for engineers building chat products. Cover the methodology, the bias modes, and the mitigations.

### Q3: How much on contamination?
**Recommendation:** moderate. **It's a major confound** — engineers should understand it. **Don't make it the whole chapter** — many other failure modes matter too.

### Q4: How much Chatbot Arena?
**Recommendation:** moderate. Cover the methodology and its strengths/limits. **It's the most-cited open ranking** as of 2025 — engineers will see it in product comparisons.

### Q5: How much agentic-eval depth?
**Recommendation:** moderate. SWE-bench is the modern reference; GAIA is the multi-step real-world reference; OSWorld is the computer-use reference. **Engineers building agent products care most about this section** — it's the new frontier.

### Q6: How honest about benchmark politics?
**Recommendation:** honest but brief. Mention that benchmark rankings affect market cap and that this creates incentives. **Don't go too far into corporate politics** — the chapter is engineering-focused.

### Q7: Widget candidates
1. **Benchmark Heatmap (marquee):** rows = ~10 frontier models; columns = ~10 benchmarks (capability + safety + agentic); cells = scores with color coding. Reader can sort by any column. Visualizes how models compare across the eval landscape — and which benchmarks are saturated. **Recommended marquee.**
2. **LLM-as-Judge Bias Demo (secondary):** show two responses and a judge's evaluation under two orderings (A first vs B first); compute swap-mitigation. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 26 is a **single-topic chapter**. Uses the **4-file cadence**.

Planned file layout:
- File 145: research (this)
- File 146: page structure (~750 lines, 8 sections; runnables embedded)
- File 147: Benchmark Heatmap marquee widget
- File 148: LLM-as-Judge Bias Demo secondary widget + exercises + closeout (slot 149 absorbed)

**Pedagogical outcomes for the reader.** After Ch 26, the reader should be able to:
1. Articulate the operational definition of evaluation (three flavors: benchmarks, open-ended, design)
2. Name and roughly characterize the main capability benchmarks
3. Connect safety and agentic benchmarks to their use cases
4. Apply LLM-as-judge methodology with awareness of biases
5. Recognize eval failure modes (saturation, contamination, reward hacking, Goodhart)
6. Design a new eval for a specific capability or domain
7. Read benchmark results critically (multi-metric, calibrated, contamination-aware)
8. Connect evaluation to Phase 15 (agents) and the curriculum's end

Eight outcomes. Exercises hit outcomes 1, 4, 5, 6.

**Tonal framing**: methodology with honest limits. **Evaluation is the bridge from craft to engineering**, but eval has its own failure modes. **Concrete numbers** (benchmark saturation timelines: 12-36 months; SWE-bench scores: 30% → 65% in 18 months; Chatbot Arena Elo ranges) and **honest tradeoffs** (single-metric vs dashboard; static vs dynamic; public vs private; cost vs coverage). **No overclaiming** about any single benchmark.

**Phase 14 closing**: this chapter closes Phase 14's discipline arc. **Three disciplines complete** (safety, interpretability, evaluation). The reader leaves Phase 14 with a complete operational framework for trustworthy AI development.

**Importance**: every production AI team builds and runs evals. **This is one of the most directly-actionable chapters** in the curriculum — engineers leaving Ch 26 will start choosing benchmarks for their product, designing custom evals, and reading leaderboards critically. **Phase 14 culminates here**; Phase 15 (Agents) opens next and closes the curriculum.
