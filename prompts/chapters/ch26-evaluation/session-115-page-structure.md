# Session 115 — Chapter 26 page structure

> First chapter session for Chapter 26 ("Evaluation"). **The chapter that closes Phase 14's discipline arc.** Where Ch 24 covered "what we want" (safety) and Ch 25 covered "what's actually computing" (interpretability), this chapter covers "how do we measure both?" Eight sections walking from "what is an evaluation" → capability benchmarks (marquee widget here) → safety benchmarks → agentic benchmarks → LLM-as-judge (secondary widget here) → eval failure modes → designing new evals → Phase 14 closes / Phase 15 ahead. Single-topic chapter; uses the **4-file cadence**. **The chapter that turns intuition into measurement — and closes the curriculum's discipline arc.**

---

## Read first (in this order)

1. **`research/ch26-evaluation/research.md`** — the source material. Every section, equation, code snippet, and misconception traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch25-interpretability/session-111-page-structure.md`** — for Phase 14's tonal conventions; this chapter is its closer
4. **`prompts/chapters/ch24-safety/session-107-page-structure.md`** — for the Phase 14 opening template; section 8 should bridge back to it

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 26 page. By end of session:

- `src/pages/ch26-evaluation/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch26-evaluation/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 26's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch26-evaluation/` with sidebar showing Ch 26 active, prev/next nav linking to Ch 25 (active) and Ch 27 (disabled)

**Tonal note:** Ch 26 is **methodology with honest limits.** **Evaluation is the bridge from craft to engineering**, but eval has its own failure modes. **Concrete numbers** (benchmark saturation timelines: 12-36 months; SWE-bench scores: 30% → 65% in 18 months; Chatbot Arena Elo ranges; eval costs) and **honest tradeoffs** (single-metric vs dashboard; static vs dynamic; public vs private; cost vs coverage). **No overclaiming** about any single benchmark. **No corporate politics** — engineering focus.

**Phase 14 closing position**: Ch 24 set up "what we want;" Ch 25 covered "what's actually there;" Ch 26 closes the loop with "how to measure both." Section 8 explicitly frames the three-discipline arc as complete and previews Phase 15 (Agents) as the curriculum's final phase.

**Chapter cadence:** Ch 26 uses the **4-file cadence** (single-topic chapter).

---

## Inputs

State of the repo after session 113 (Ch 25 complete):

- Ch 1-25 all `'published'`
- `research/ch26-evaluation/research.md` exists
- `src/lib/chapters.ts` has Ch 1-25 `'published'`, Ch 26-30 `'planned'`
- No `src/pages/ch26-evaluation/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch26-evaluation/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch26-evaluation/index.astro` if it existed
3. **Update** `src/lib/chapters.ts` — change Ch 26's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch26-evaluation
description: Evaluation — the discipline that turns intuition about LLM quality into measurement. From the operational definition of an eval (three flavors: standard benchmarks, open-ended evaluation, eval design), through capability benchmarks (MMLU, HumanEval, HellaSwag, GPQA, MATH), safety benchmarks (HarmBench, TruthfulQA, ToxiGen, WMDP), agentic benchmarks (SWE-bench, GAIA, OSWorld), LLM-as-judge methodology and its biases, eval failure modes (saturation, contamination, reward hacking, Goodhart's law), and designing new evals. Closes Phase 14's discipline arc — safety, interpretability, evaluation — and bridges to Phase 15 (Agents), the curriculum's final arc.
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

> Chapter 24 covered safety: what we want the model to do, and how we train it to do that. Chapter 25 covered interpretability: what the model is actually doing internally. **This chapter covers the third discipline of Phase 14**: how do we measure both? Evaluation turns "this model is better" into a measurable claim. Without it, AI development is opinion and marketing. **With it, claims become comparable** — across models, across techniques, across releases. It's the bridge from craft to engineering.
>
> Modern AI evaluation is **three flavors**. **Standard benchmarks** — fixed test sets with known answers (MMLU, HumanEval, HellaSwag, GPQA, MATH). **Open-ended evaluation** — LLM-as-judge methodology (MT-Bench), crowdsourced human preferences (Chatbot Arena), structured rubrics. **Eval design** — making new evaluations for new capabilities (SWE-bench for agentic coding, GAIA for general AI assistants, OSWorld for computer use). This chapter covers all three, plus their failure modes — saturation, contamination, reward hacking, Goodhart's law — and how production teams design their own evals.
>
> **The discipline isn't a solved science.** Benchmarks saturate within 12-36 months. Major benchmarks (GSM8K, MATH, MMLU, HumanEval) have documented contamination. Models routinely reward-hack benchmarks they're optimized against. **Modern AI eval is a dashboard, not a number.** By the end of this chapter, you'll know which benchmarks exist, what they measure, how they fail — and how to design your own. **Then Phase 15 opens** with agents: ReAct foundations, agents from scratch, multi-agent orchestration, and agent-eval frameworks. **The curriculum's final arc.**

### Section 1: What is an evaluation?

**Heading:** `## What is an evaluation?`
**Word target:** ~400
**Sub-headings:** `### The operational definition`, `### Three flavors`

**Teaching beats:**

**The operational definition** (what eval teams do):
1. **Define what to measure** (capability, safety, alignment, utility)
2. **Build or choose a test set** (fixed benchmark, dynamic arena, human evaluation)
3. **Run models against it** and compute a score
4. **Compare across models** to claim improvement (or not)

**Three flavors**:

```mdx
<Equation label="26.eval-flavors">
$$\text{standard benchmarks} \;\;\Vert\;\; \text{open-ended evaluation} \;\;\Vert\;\; \text{eval design}$$
</Equation>
```

- **Standard benchmarks** — fixed test sets with known answers (MMLU, HumanEval, HarmBench)
- **Open-ended evaluation** — LLM-as-judge, human evaluation, dynamic arenas (MT-Bench, Chatbot Arena)
- **Eval design** — making new evaluations for new capabilities (SWE-bench, GAIA, WMDP)

**Why evaluation is hard** (5 bullets):
- **Calibration**: a score of 75% doesn't mean the model is "75% capable" — depends on distribution
- **Saturation**: when models max out, the benchmark stops being informative
- **Contamination**: test data in pretraining inflates scores
- **Goodhart's law**: when a metric becomes a target, it ceases to be a good metric
- **Distribution shift**: benchmark distribution ≠ deployment distribution

**Empirical scale (early 2025)**:
- **Frontier model release cycles**: 6-12 months
- **Active benchmarks**: ~50-100 widely-cited
- **Saturation pace**: 12-36 months from release to ceiling
- **Cost of running**: 1k-100k inferences per model per benchmark

**Required callout** — type `aside`: **Evaluation is the bridge from craft to engineering.** Without it, AI development can't claim verifiable progress. With it, comparisons become rigorous. **But evaluation is also where engineering meets economics** — leaderboard rankings affect billions in market cap, creating incentives to game metrics. This chapter is the operational toolkit, with the failure modes built in.

**No code in this section.** Setup.

**Connection forward:** Section 2 covers the largest category — capability benchmarks.

### Section 2: Capability benchmarks

**Heading:** `## Capability benchmarks`
**Word target:** ~600 — IMPORTANT
**Sub-headings:** `### The landscape`, `### Methodology`, `### Score interpretation`

**Teaching beats:**

**The capability-benchmark landscape (early 2025)**:

| Benchmark | Released | What it measures | Saturation |
|-----------|----------|------------------|------------|
| MMLU | 2020 | 57 subjects, multiple choice | Mostly saturated (~88-90%) |
| HumanEval | 2021 | Python code generation | Saturated (~95%+) |
| HellaSwag | 2019 | Common-sense reasoning | Saturated (~95%+) |
| MATH | 2021 | Competition math | Saturated (~95%+) |
| **GPQA** | **2023** | **Graduate-level science** | **Active (~55-70% frontier)** |
| BBH | 2022 | 23 hard tasks | Mostly saturated |
| MMLU-Pro | 2024 | Harder MMLU variant | Active |

**The pattern**: most benchmarks saturate in 12-36 months. **GPQA is the modern hard benchmark**; new ones are released as old ones max out.

**What capability benchmarks measure well**:
- Knowledge breadth (MMLU spans 57 subjects)
- Code synthesis (HumanEval)
- Math reasoning (MATH)
- Logical/scientific reasoning (GPQA)

**What capability benchmarks measure poorly**:
- Open-ended generation quality (no clean metric)
- Conversational ability (single-turn evals miss drift)
- Long-context reasoning (most benchmarks are short)
- Real-world tasks (everything stylized)

**Capability benchmark methodology**:
- **Multi-choice format** (MMLU, GPQA): easy to score, vulnerable to surface heuristics
- **Open-ended with hidden tests** (HumanEval, MATH): test-case verification; cleaner; more compute
- **Chain-of-thought variants**: most modern benchmarks have CoT-allowed scoring

**Score interpretation**:
- **Random baseline** (4-choice MC): 25%
- **Frontier model expectation** (2025): 60-90% on hard benchmarks
- **Human expert ceiling**: 80-95%

**Required widget placeholder** — Benchmark Heatmap (marquee, session 147):

```mdx
<WidgetFrame title="Benchmark heatmap" caption="A heatmap of ~10 frontier models × ~10 benchmarks (capability + safety + agentic). Each cell shows the model's score with color coding. Sort by any column to see the ranking on that benchmark. Visualizes the eval landscape at a glance — and which benchmarks have saturated (whole columns near 95%+). Demonstrates the chapter's central operational claim: modern AI eval is a dashboard, not a number.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 147 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing a benchmark scoring harness:

```python
# A minimal benchmark scoring harness.
# Real benchmarks: thousands of items; more nuanced scoring.
# The harness pattern (run + score + summarize) is the same at any scale.

TEST_ITEMS = [
    {'q': 'What is 2 + 2?',                  'category': 'math',    'answer': '4'},
    {'q': 'What is 5 * 7?',                  'category': 'math',    'answer': '35'},
    {'q': 'What is sqrt(144)?',              'category': 'math',    'answer': '12'},
    {'q': 'When was the Declaration signed?', 'category': 'history', 'answer': '1776'},
    {'q': 'First US president?',              'category': 'history', 'answer': 'George Washington'},
    {'q': 'What year did WWII end?',          'category': 'history', 'answer': '1945'},
]


def mock_model(question):
    """Pretend this is a real model API call."""
    answers = {
        '2 + 2':       '4',
        '5 * 7':       '35',
        'sqrt(144)':   '12',
        'Declaration': '1776',
        'First US':    'George Washington',
        'WWII end':    '1944',                     # wrong!
    }
    for keyword, answer in answers.items():
        if keyword in question:
            return answer
    return '???'


def run_benchmark(items, model_fn):
    results = []
    for item in items:
        pred = model_fn(item['q'])
        correct = pred.strip().lower() == item['answer'].strip().lower()
        results.append({**item, 'predicted': pred, 'correct': correct})
    return results


def summarize(results):
    n = len(results)
    correct = sum(r['correct'] for r in results)
    by_category = {}
    for cat in set(r['category'] for r in results):
        cat_results = [r for r in results if r['category'] == cat]
        by_category[cat] = sum(r['correct'] for r in cat_results) / len(cat_results)
    return {'overall': correct / n, 'by_category': by_category, 'n': n, 'correct': correct}


results = run_benchmark(TEST_ITEMS, mock_model)
summary = summarize(results)

print(f"Benchmark results")
print(f"  Overall: {summary['correct']}/{summary['n']} = {summary['overall']:.0%}")
print(f"  By category:")
for cat, acc in summary['by_category'].items():
    print(f"    {cat:>10}:  {acc:.0%}")

# Observations:
# - Even a tiny benchmark surfaces per-category variation (math vs history)
# - Real benchmarks: thousands of items, paraphrase-tolerant scoring
# - Per-category breakdown beats overall accuracy — never compare on one number
```

**Required callout** — type `note`: **MC1 from research.md.** "A higher MMLU score means a better model." False in isolation. **MMLU is one signal among many.** A model with 88% MMLU and 30% TruthfulQA is unsafe; a model with 75% MMLU and 60% safety scores may be better for production. **Single-metric comparisons are misleading.** This is why the chapter's central operational claim is: **modern AI eval is a dashboard, not a number.**

**Connection forward:** Section 3 turns to the safety-eval landscape (briefly, since Ch 24 already covered the safety side).

### Section 3: Safety benchmarks

**Heading:** `## Safety benchmarks`
**Word target:** ~400
**Sub-headings:** `### The landscape`, `### Calibrated refusal evaluation`

**Teaching beats:**

(Brief — these were introduced in Ch 24; recapped here as part of the eval landscape.)

**The safety-benchmark landscape**:
- **TruthfulQA** (Lin 2021): 817 questions on common falsehoods
- **HarmBench** (Mazeika 2024): jailbreak success rates across categories of harm
- **JailbreakBench**: another standardized jailbreak eval
- **ToxiGen**: toxic vs benign language
- **WMDP** (Hendrycks 2024): dangerous CBRN knowledge proxy

**What safety benchmarks measure well**:
- **Direct harm** (HarmBench): does the model produce harmful content?
- **Truthfulness** (TruthfulQA): does the model give correct answers vs popular ones?
- **Dangerous-capability proxy** (WMDP): could the model help with dangerous tasks?

**What safety benchmarks measure poorly**:
- **Calibrated refusals**: over-refusal vs under-refusal (separate evals needed — Ch 24)
- **Novel jailbreaks**: by definition, a benchmark covers known patterns
- **Multi-turn manipulation**: most safety benchmarks are single-turn
- **Long-tail failures**: rare-but-severe failures don't show up in aggregate scores

**Linking back to Ch 24**: safety benchmarks are **necessary but not sufficient** for deployment decisions. **They're one signal**; red-teaming, interpretability monitoring (Ch 25), and post-deployment review fill out the picture.

**Required callout** — type `aside`: Safety benchmarks measure **what the model produces** under known attack patterns. **Capability vs propensity** (from Ch 24) is the key distinction: WMDP measures what the model *could* do (capability); HarmBench measures what it *does* do under attack (propensity). **Both signals matter for deployment.**

**No code in this section** (Ch 24's runnables already cover safety evaluation patterns).

**Connection forward:** Section 4 turns to the new frontier — agentic benchmarks.

### Section 4: Agentic benchmarks

**Heading:** `## Agentic benchmarks`
**Word target:** ~500
**Sub-headings:** `### The new frontier`, `### The landscape`, `### Trajectory`

**Teaching beats:**

**The new frontier of evaluation**. Phase 13 covered agentic capabilities (tool use, RAG, multimodal); Phase 14's eval discipline needs benchmarks for these.

**The agentic-benchmark landscape**:
- **SWE-bench** (Jimenez 2023): real GitHub issues; produce a patch passing hidden tests; reference agentic-coding benchmark
- **GAIA** (Mialon 2023): multi-step real-world tasks (web browsing, tool use, reasoning); humans ~92%, agents ~60-75%
- **OSWorld** (Xie 2024): computer-use tasks with real desktop applications
- **MLE-bench** (Chen 2024): 75 Kaggle competitions; agents produce code and submit predictions
- **WebArena**: web-browsing agent tasks
- **Cybench**: cybersecurity capture-the-flag tasks
- **Upwork HAPI** (illustrative): real freelance tasks across thousands of categories

**What agentic benchmarks measure well**:
- End-to-end task completion (did the agent solve it?)
- Tool-use chains (can it compose multiple tools?)
- Resilience to environmental noise (does it recover from errors?)
- Real-world relevance (tasks look like actual work)

**What agentic benchmarks measure poorly**:
- **Cost** (each run is expensive; agents take many turns)
- **Reproducibility** (real environments change; flaky tests)
- **Specific failure modes** (knowing the score doesn't tell you what's failing)

**The trajectory**:
- **2023**: most agents <30% on GAIA
- **2024**: 50-65% with frontier models + good scaffolding
- **2025**: 70%+ achievable; GAIA may saturate within 1-2 years

**Why this matters**: agentic benchmarks **are the new frontier**. As classic benchmarks saturate, agentic ones become the discriminator between models.

**Required callout** — type `note`: Agentic benchmarks are **expensive and hard to design**. A single SWE-bench run can cost hundreds of dollars in inference for a frontier model with multi-turn agent scaffolding. Reproducibility is harder than for fixed test sets — environments drift, tools fail. **But they measure what production teams actually care about** — task completion in realistic settings. Engineers building agent products **must** track agentic benchmarks; classic capability benchmarks alone don't tell you whether your product will work.

**No code in this section** (third runnable is in section 5).

**Connection forward:** Section 5 covers the methodology that connects benchmarks to chat quality — LLM-as-judge.

### Section 5: LLM-as-judge

**Heading:** `## LLM-as-judge`
**Word target:** ~500
**Sub-headings:** `### The methodology`, `### Bias modes`, `### Chatbot Arena`

**Teaching beats:**

**The methodology** (Zheng 2023):
1. Run two models on the same prompts
2. Have a stronger model judge which response is better
3. Aggregate judgments into win rates or Elo ratings

**Standard implementations**:
- **MT-Bench**: 80 multi-turn questions across 8 categories; GPT-4 judges
- **Chatbot Arena**: humans judge crowdsourced battles; Elo ratings

**LLM-as-judge bias modes** (Zheng 2023):
- **Position bias**: judges favor the first response shown
- **Verbosity bias**: judges prefer longer responses
- **Self-enhancement bias**: judge prefers responses from its own model family
- **Coverage bias**: judges miss subtle factual errors they don't know

**Mitigation techniques**:
- **Randomize positions** in pairwise comparisons (mitigates position bias)
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

**Required widget placeholder** — LLM-as-Judge Bias Demo (secondary, session 148):

```mdx
<WidgetFrame title="LLM-as-judge bias demo" caption="See an LLM judge evaluate two responses to the same prompt under both orderings (A first vs B first). When the judge's verdict flips with order, that's position bias — a documented failure mode (Zheng 2023). Demonstrates swap-mitigation, the simplest reliable defense. Also shows verbosity bias when one response is much longer than the other.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 148 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing LLM-as-judge with bias mitigation:

```python
def mock_judge(prompt, response_a, response_b):
    """
    Mock LLM-as-judge with documented verbosity bias.
    Real implementation: call GPT-4 or Claude with a judge prompt.
    """
    # SIMULATE verbosity bias: judge sometimes favors longer responses
    if len(response_a) > len(response_b) * 1.3:
        return 'A'
    if len(response_b) > len(response_a) * 1.3:
        return 'B'
    return 'tie'


def judge_with_swap(prompt, response_a, response_b):
    """
    Run the judge in both orderings. If results disagree, return 'tie'.
    Mitigates position bias.
    """
    judgment_ab = mock_judge(prompt, response_a, response_b)
    judgment_ba = mock_judge(prompt, response_b, response_a)
    # Re-map judgment_ba: 'A' in second call means response_b won → maps to 'B'
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
]

print(f"LLM-as-judge with swap mitigation:\\n")
for case in test_cases:
    naive = mock_judge(case['prompt'], case['response_a'], case['response_b'])
    mitigated = judge_with_swap(case['prompt'], case['response_a'], case['response_b'])
    
    print(f"Prompt: {case['prompt']}")
    print(f"  A ({len(case['response_a']):>3} chars): {case['response_a'][:60]}...")
    print(f"  B ({len(case['response_b']):>3} chars): {case['response_b'][:60]}...")
    print(f"  Naive:     {naive}")
    print(f"  Mitigated: {mitigated}\\n")

# Observations:
# - Verbosity bias: naive judge favors longer responses
# - Swap mitigation helps with position bias (different problem)
# - For verbosity: need rubric-based judging or human calibration
# - Real LLM-as-judge: multiple judges, calibration, explicit reasoning
```

**Connection forward:** Section 6 covers what goes wrong with evaluation — the failure modes.

### Section 6: Eval failure modes

**Heading:** `## Eval failure modes`
**Word target:** ~600 — IMPORTANT
**Sub-headings:** `### Saturation`, `### Contamination`, `### Reward hacking and Goodhart`, `### The systemic implication`

**Teaching beats:**

**Saturation**:
- A benchmark stops being informative when models reach the ceiling
- **Example**: HumanEval was the code benchmark for years; now ~95%+ for frontier models
- **Response**: build harder benchmarks (GPQA replaced MMLU's hard tier)

**Contamination**:
- If benchmark data appeared in pretraining, scores are inflated
- **Documented across major benchmarks**: GSM8K, MATH, MMLU, HumanEval
- **Detection**: check if a model can complete test items it shouldn't have seen
- **Response**: held-out evals, dynamic benchmarks, rotation

**Reward hacking**:
- Models score well by gaming the metric, not solving the task
- **Example**: code models hard-coding test cases
- **Example**: math models memorizing problem-answer pairs from training
- **Response**: held-out items, qualitative review, multiple metrics

**Goodhart's law**:
- When a benchmark becomes a target (for training, comparison, marketing), the metric stops measuring the underlying capability
- **Example**: optimizing for MMLU directly produces benchmark-tuned models that don't generalize
- **Response**: hold out unpublished evals, surprise benchmarks, multi-metric tracking

**Distribution shift**:
- Benchmark distribution ≠ deployment distribution
- A model that scores 90% on MMLU may not generalize to your domain
- **Response**: domain-specific evals, deployment metrics, user feedback

**Single-metric thinking**:
- A single benchmark score hides important variation
- **Response**: dashboards of multiple metrics

**Capability vs propensity** (from Ch 24):
- Benchmarks measure what a model *can* do; deployment depends on what it *does*
- **WMDP** is the canonical example: measures dangerous knowledge, doesn't measure propensity to share

**The systemic implication**: **modern AI eval is a dashboard, not a number.** Treating any single benchmark as the model's overall quality is misleading.

**Required code** — `<RunnableCode>` showing reward hacking detection:

```python
def looks_like_hardcoded(submission, test_cases):
    """
    Heuristic: does the submission appear to hard-code the test cases?
    Real detection: more nuanced (AST analysis, abstract interpretation).
    """
    hits = 0
    for tc in test_cases:
        input_str = str(tc['input'])
        output_str = str(tc['expected_output'])
        if input_str in submission and output_str in submission:
            hits += 1
    return hits / max(1, len(test_cases))


TEST_CASES = [
    {'input': 2, 'expected_output': 4},
    {'input': 5, 'expected_output': 10},
    {'input': 7, 'expected_output': 14},
    {'input': 100, 'expected_output': 200},
]

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
    return None   # off-distribution: fails outside the test set
''',
}

print("Reward hacking detection:\\n")
for name, sub in submissions.items():
    suspicion = looks_like_hardcoded(sub, TEST_CASES)
    flag = '⚠️  POSSIBLE HACKING' if suspicion > 0.5 else '✓ looks clean'
    print(f"{name}:")
    print(f"  Suspicion: {suspicion:.0%} of test cases appear in code")
    print(f"  Verdict: {flag}\\n")

# Observations:
# - Hard-coding is the simplest reward-hacking pattern
# - Production code-eval frameworks add: hidden test cases; adversarial test generation;
#   static analysis; runtime probes
# - The principle generalizes: any time the metric is a target, models will optimize
#   for the metric (Goodhart's law)
```

**Required callout** — type `warning`: **MC6 from research.md.** "Reward hacking is rare." False. **Reward hacking has been documented across major benchmarks** — code models hard-coding test cases, models memorizing benchmark items, models exploiting eval format. **The closer a metric is to a training target, the more it gets hacked.** Production teams treat reward hacking as the default failure mode, not an edge case.

**Connection forward:** Section 7 turns to building new evals.

### Section 7: Designing new evals

**Heading:** `## Designing new evals`
**Word target:** ~400
**Sub-headings:** `### When you need a new eval`, `### The design checklist`

**Teaching beats:**

**When you need a new eval**:
- New capability not covered (agentic coding, computer use)
- Domain-specific (medical Q&A, legal reasoning)
- Safety-critical area (child safety, election integrity)
- Internal product metrics (does our chatbot help users complete onboarding?)

**The new-eval design checklist**:

1. **What are you measuring?**
   - State the capability/property precisely
   - Distinguish from related metrics
   - Decide: capability, propensity, or both

2. **What's the test format?**
   - Multi-choice (easy to score, surface-heuristic risk)
   - Open-ended with hidden tests (cleaner; needs verification logic)
   - LLM-as-judge (needs bias mitigation)
   - Human evaluation (expensive; gold-standard)
   - Real-environment simulation (most realistic; most complex)

3. **What's the test set?**
   - Sample size (statistical power)
   - Difficulty distribution (avoid all-easy or all-hard)
   - Representativeness (matches deployment distribution)
   - Held-out from training

4. **What's the calibration?**
   - Random baseline (chance level)
   - Human baseline (expert, non-expert)
   - Current SOTA reference
   - Target threshold

5. **How will you maintain it?**
   - Rotation policy
   - Versioning
   - Public vs private trade-off

**Production patterns**:
- **Hold-out test sets**: never published; internal use only
- **Multi-judge ensembles** for LLM-as-judge
- **Domain-specific evals** alongside broad benchmarks
- **Live deployment metrics**: real-world signals are the ultimate eval

**Required callout** — type `note`: **MC8 from research.md.** "Eval design is a research problem, not an engineering one." False. **Every production AI team builds custom evals.** Designing them — choosing what to measure, how to score, how to maintain — is core production engineering. **Not optional; essential.** This chapter's most directly-actionable section.

**No code in this section** (3 runnables already in sections 2, 5, 6).

**Connection forward:** Section 8 closes Phase 14 and previews Phase 15.

### Section 8: Phase 14 closes — Phase 15 ahead

**Heading:** `## Phase 14 closes — Phase 15 ahead`
**Word target:** ~400
**Sub-headings:** `### The three disciplines complete`, `### Phase 15 — the curriculum's final arc`

**Teaching beats:**

**Phase 14 retrospective** — three disciplines together:

| Discipline | Question | Chapter |
|------------|----------|---------|
| Safety | What do we want? | Ch 24 |
| Interpretability | What's the model doing? | Ch 25 |
| Evaluation (this chapter) | How do we measure both? | Ch 26 |

**All three together** turn AI development from craft to engineering. **No single discipline suffices**:
- Safety without measurement is wishful thinking
- Interpretability without measurement can't validate claims
- Evaluation without safety thinking misses what matters

**Where Phase 14 leaves the curriculum**: with a complete discipline arc. **A capable model (Phase 13)** + **a trustworthy development process (Phase 14)** = the foundations of modern AI production.

**Phase 15 (Agents) ahead**:
- **Ch 27 (Agent foundations)** — ReAct, AutoGPT, the agentic loop, principles
- **Ch 28 (Agents from scratch)** — building real agents, tool implementation, error recovery
- **Ch 29 (Multi-agent)** — orchestration, agent-to-agent communication, multi-step planning
- **Ch 30 (Agent eval and frameworks)** — closes the curriculum

**The arc completes**: capabilities (Phase 13) → disciplines (Phase 14) → composition (Phase 15). **Then the tutorial closes.**

**Sample close** (rewrite in chapter voice):

> Evaluation is the discipline that turns intuition about LLM quality into measurement. Standard benchmarks (MMLU, HumanEval, GPQA, MATH) measure capability across knowledge breadth, code, math, science. Safety benchmarks (HarmBench, TruthfulQA, WMDP) measure harm avoidance and dangerous-knowledge proxies. Agentic benchmarks (SWE-bench, GAIA, OSWorld) measure what's new and hard. LLM-as-judge methodology and Chatbot Arena cover the open-ended quality gap. Eval failure modes — saturation, contamination, reward hacking, Goodhart — are not bugs but features of any measurement applied to a trained system. **Modern AI eval is a dashboard, not a number.**
>
> Phase 14 closes here. **Safety, interpretability, evaluation** — three disciplines complete. Together they turn capable models (Phase 13) into trustworthy development. **Phase 15 opens with agents** — the composition arc. ReAct foundations. Agents from scratch. Multi-agent orchestration. And finally, agent evaluation frameworks, where Phase 14's eval discipline meets Phase 15's compositions. **Four chapters from the curriculum's end.**

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 26, slug: 'ch26-evaluation', title: 'Evaluation', partNum: 8, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch26-evaluation/index.astro && rm src/pages/ch26-evaluation/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch26-evaluation/`** renders with:
   - Chapter eyebrow ("Chapter 26") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 5, 6)
   - 2 `<WidgetFrame>` placeholders (sections 2 and 5)
   - Labeled equation `<Equation label="26.eval-flavors">`
   - At least 5 callouts (section-1 aside, MC1 in section 2, section-3 aside, section-4 note, MC6 in section 6, MC8 in section 7 — pick 5)
3. **Sidebar:** Ch 1-25 published; Ch 26 active (draft); Ch 27-30 dimmed
4. **Prev/next nav at bottom of Ch 26:** prev = Ch 25 (active); next = Ch 27 (disabled)
5. **TOC on Ch 26** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3500 and 4200 words
7. **`npm run typecheck`** passes
8. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 147 and 148 own them.
- ❌ **Do not write exercises.** Session 148 owns.
- ❌ **Do not flip Ch 26's status to `'published'`.** Session 148 owns.
- ❌ **Do not deep-dive any single benchmark.** Name the canon; brief.
- ❌ **Do not enumerate every benchmark ever released.** Name the canon (MMLU, HumanEval, HellaSwag, GPQA, MATH, BBH for capability; HarmBench, TruthfulQA, ToxiGen, WMDP for safety; SWE-bench, GAIA, OSWorld for agentic).
- ❌ **Do not corporate-politics the field.** Mention market-cap incentives briefly; don't dwell.
- ❌ **Do not modify Ch 1-25.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch26-evaluation/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch26-evaluation/index.astro 2>/dev/null || true
git commit -m "session 115: Ch 26 prose — evaluation (closes Phase 14 discipline arc)"
git push origin main
```

---

## Notes for the session author

**On the chapter's dual responsibility as Phase 14 closer:**
This chapter has dual roles: **deliver evaluation content** AND **close the Phase 14 discipline arc.** Notes-for-author: "**Phase 14 has covered two of three disciplines** (safety in Ch 24, interpretability in Ch 25). **This chapter completes the trio.** Opening and section 8 should both frame Phase 14 as a coherent unit. **Reader leaves with a complete operational framework for trustworthy AI development.**"

**On "modern AI eval is a dashboard, not a number" as the chapter's central claim:**
This single phrase carries the chapter's most important operational insight. **It appears in the opening, section 2, section 6, and section 8.** Notes-for-author: "**Repeat the dashboard framing.** Reader who internalizes only one phrase from this chapter should internalize this one."

**On the agentic benchmarks getting their own section:**
SWE-bench, GAIA, OSWorld, MLE-bench — these matter most for the readers who will go on to Phase 15 (Agents). Notes-for-author: "**Engineers building agent products care most about section 4** — it's the new frontier. As classic benchmarks saturate, agentic ones become the discriminator. **Phase 15 will need readers who understand this section.**"

**On LLM-as-judge being the most practically-relevant for chat-product engineers:**
Most engineers building chat products use LLM-as-judge methodology. **Section 5 needs to cover the bias modes carefully** so engineers don't deploy biased eval systems by default. Notes-for-author: "**Section 5 is the most directly-actionable section** for engineers shipping chat products today. Position bias, verbosity bias, self-enhancement bias, coverage bias — and the mitigations for each."

**On the seven failure modes being treated as a systematic list:**
Section 6 enumerates 7 distinct failure modes (saturation, contamination, reward hacking, Goodhart, distribution shift, single-metric thinking, capability vs propensity). **The breadth matters.** Notes-for-author: "**Engineers should leave knowing that eval fails in characteristic ways** — not as one big confusion but as 7 specific patterns they can name and defend against."

**On the 3 runnable code blocks**:
- **Section 2 (benchmark scoring harness)**: 40 lines; small dataset; per-category breakdown; the "run + score + summarize" pattern
- **Section 5 (LLM-as-judge with swap mitigation)**: 40 lines; mock judge with verbosity bias; demonstrates swap-mitigation against position bias
- **Section 6 (reward hacking detection)**: 30 lines; pattern detection for hard-coded test cases; honest about its limits

**The progression**: run a benchmark → judge open-ended outputs → detect gaming. **The reader sees the eval lifecycle in code.**

**On the marquee widget placement (section 2):**
The Benchmark Heatmap spans capability + safety + agentic in one view. **Section 2 is where the capability discussion lives**; the heatmap there shows readers the landscape they're about to learn about. Notes-for-author: "**The heatmap is the chapter's central visualization.** It encodes the dashboard framing — many benchmarks, many models, color-coded scores. **Whole chapter's claim made visible.**"

**On the secondary widget placement (section 5):**
LLM-as-judge bias modes are the chapter's most subtle technical content. **The widget should make position bias visible** — show the judge's verdict flip when responses are swapped. Notes-for-author: "**The bias demo is where the methodology gets concrete.** Reader sees that 'just use GPT-4 to judge' has documented failure modes; mitigation isn't optional."

**On the Phase 15 preview being substantial:**
Section 8 previews Phase 15 with chapter titles and short descriptions. **The reader is now 4 chapters from the curriculum's end.** Notes-for-author: "**Section 8 carries phase-closing weight AND curriculum-preview weight.** Frame Phase 14 as complete; preview Phase 15 as the composition arc. **Make clear that the end is in sight.**"

**Pedagogical claim of the chapter:**
"Evaluation is the discipline that turns intuition about LLM quality into measurement. **Standard benchmarks** (MMLU, HumanEval, GPQA, MATH) cover capability. **Safety benchmarks** (HarmBench, TruthfulQA, WMDP) cover harm avoidance and dangerous-knowledge proxies. **Agentic benchmarks** (SWE-bench, GAIA, OSWorld) cover the new frontier. **LLM-as-judge methodology** and **Chatbot Arena** cover open-ended quality. **Eval failure modes** — saturation, contamination, reward hacking, Goodhart's law — are features of any measurement applied to a trained system, not bugs. **Modern AI eval is a dashboard, not a number.** This chapter closes Phase 14's discipline arc: safety + interpretability + evaluation complete. Phase 15 opens with agents — the curriculum's final arc."

**Phase 14 progress after this session**: Ch 24 ✅, Ch 25 ✅, Ch 26 in progress (1/4 files). **Three sessions remain** to close Ch 26 — and Phase 14. Then Phase 15 (Agents) closes the curriculum.

Build with care. **This chapter is the discipline arc's closing piece.**
