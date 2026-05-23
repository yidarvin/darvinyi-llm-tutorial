# Session 128 — Chapter 30 page structure

> **First chapter session for THE FINAL CHAPTER.** This is the page structure for Chapter 30 — agent eval and frameworks — which is also **the curriculum's close.** Eight sections walking from why agent evaluation is structurally harder than LLM evaluation → the 2025 agent benchmark landscape (marquee widget 1 here) → evaluation methodologies → cost-quality Pareto → production observability frameworks (marquee widget 2 here) → deployment patterns and production readiness → looking back at Phase 15 → **the curriculum closes**. **Two-topic chapter**; uses the **5-file cadence**. **Tonal anchor: discipline applied to composition** — mirror to Ch 26's discipline applied to capability. **Section 8 is the curriculum's signature moment** — the closing words that become the reader's final memory of these 30 chapters. Write it with care.

---

## Read first (in this order)

1. **`research/ch30-agent-eval-and-frameworks/research.md`** — the source material. Every section, equation, benchmark stat, and the closing thought trace back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch29-multi-agent/session-124-page-structure.md`** — for the Ch 29 page-structure pattern; this chapter builds directly on it
4. **`prompts/chapters/ch26-evaluation/session-115-page-structure.md`** — for the Ch 26 (LLM eval) discipline chapter that this chapter mirrors and extends to agents

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 30 page. **THE FINAL CHAPTER.** By end of session:

- `src/pages/ch30-agent-eval-and-frameworks/index.mdx` exists with full prose, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch30-agent-eval-and-frameworks/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 30's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch30-agent-eval-and-frameworks/` with sidebar showing Ch 30 active, prev/next nav linking to Ch 29 (active) and nothing on next (Ch 30 is the last chapter)

**Tonal anchors:**
- **Discipline applied to composition** — Ch 26 was discipline applied to capability; this chapter brings the same discipline to agent systems
- **Honest framing throughout** — concrete numbers (SWE-bench Verified ~50% frontier; humans ~85%), honest tradeoffs (cost-quality Pareto), honest readiness (the checklist exists because most projects skip it)
- **The closing section is the curriculum's signature moment** — Section 8 must honor 30 chapters of work without being sentimental. **A reader reaching the closing thought should feel: respected, equipped, sent off well.**

**Concrete framing for section 8:**
- Acknowledge the journey (numpy primitives → agent systems in production)
- Summarize each of the 9 parts briefly
- Be honest about what's NOT covered
- Point forward without predicting specifics
- End with "now go build" (or equivalent in chapter voice)

**Section 8 word count**: ~700 words. The longest section, and the most important.

**Chapter cadence:** Ch 30 uses the **5-file cadence** (two-topic chapter).

---

## Inputs

State of the repo after session 127 (Ch 29 complete):

- Ch 1-29 all `'published'`
- `research/ch30-agent-eval-and-frameworks/research.md` exists
- `src/lib/chapters.ts` has Ch 1-29 `'published'`, Ch 30 `'planned'`
- No `src/pages/ch30-agent-eval-and-frameworks/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch30-agent-eval-and-frameworks/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch30-agent-eval-and-frameworks/index.astro` if it existed
3. **Update** `src/lib/chapters.ts` — change Ch 30's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch30-agent-eval-and-frameworks
description: Agent evaluation and production frameworks — the final chapter. Why agent eval is structurally harder than LLM eval. The 2025 agent benchmark landscape (SWE-bench Verified, GAIA, OSWorld, τ-bench, BrowseComp). Evaluation methodologies (pass^k, partial credit, cost-quality Pareto, human-judged). Production observability frameworks (LangSmith, Helicone, Braintrust, OpenTelemetry). Deployment patterns and readiness checklists. And — finally — the curriculum's close: looking back at thirty chapters from numpy primitives to agent systems in production.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~290 words) of opening.

**Sample opening** — rewrite in chapter voice:

> Chapter 26 made evaluation a discipline. Phase 14 closed by establishing that capable models without rigorous evaluation are research demos, not products. **Phase 15 then built the agent stack** — foundations (Ch 27), engineering (Ch 28), composition (Ch 29). **This chapter closes both arcs**: it brings Phase 14's evaluation discipline to bear on Phase 15's agent systems, and it closes the curriculum.
>
> The chapter's argument: **agent evaluation is structurally harder than LLM evaluation.** Tasks are multi-step; success is multi-dimensional; benchmarks are slow to develop; production-readiness includes observability and deployment patterns. We cover the 2025 agent benchmark landscape (SWE-bench Verified, GAIA, OSWorld, τ-bench, BrowseComp), the methodologies that actually catch failures (pass^k for reliability, cost-quality Pareto for production tradeoffs), the production observability frameworks (LangSmith, Helicone, Braintrust, OpenTelemetry), and the deployment patterns + readiness checklist that mark the boundary between prototype and production.
>
> **And then the curriculum closes.** Section 8 looks back at the thirty chapters — from numpy primitives in Ch 1 to agent systems in this chapter — and takes stock of what the reader can now do. **Honest about what's not covered. Forward-looking without predicting.** The closing thought sends the reader off well. **By the end of this chapter, you'll have the full stack of an LLM systems engineer**, the discipline to evaluate what you build, and — equally important — the perspective to follow the field as it keeps moving. **Now let's finish.**

### Section 1: Why agent evaluation is harder

**Heading:** `## Why agent evaluation is harder`
**Word target:** ~400
**Sub-headings:** `### Five structural reasons`, `### The framing`

**Teaching beats:**

**LLM evaluation** (Ch 26) is bounded and well-understood. **Agent evaluation** is structurally harder. **Five reasons**:

**1. Tasks are multi-step.** A single LLM eval has one prompt and one response; an agent eval has a multi-turn task. **Evaluation must cover the trajectory.**

**2. Success is multi-dimensional.**
- Task success (did the task complete?)
- Cost (LLM + tool calls)
- Latency (time to completion)
- Safety (no harmful actions taken)
- Robustness (pass^k — success across k attempts)
- Cost-quality tradeoff (Pareto frontier)

**No single number captures all of these.**

**3. Verifying success is harder.** LLM eval has labeled answers; agent eval often requires running the agent's output (does the code compile? do tests pass?), replicating environment state, or human judgment.

**4. Reliability matters more.** A 95%-accurate LLM is great; a 95%-reliable agent fails 1 in 20 production tasks. **pass^k metrics** surface what single-trial accuracy hides.

**5. Benchmarks are slow to develop.** SWE-bench took ~1 year to build. OSWorld required custom VM infrastructure. Real environments take years.

**The framing**: agent eval is **LLM eval × system complexity × environmental verification.** It's not just harder in degree — it's harder in kind.

**Required callout** — type `aside`: **Mirror to Ch 26.** Chapter 26 was discipline applied to capability — turning impressive LLM capabilities into trustworthy ones via evaluation. **This chapter is discipline applied to composition** — turning impressive agent systems into trustworthy ones. **The same intellectual move, one level up the stack.**

**No code in this section.** Setup.

**Connection forward:** Section 2 covers the 2025 agent benchmark landscape.

### Section 2: Agent benchmarks

**Heading:** `## Agent benchmarks`
**Word target:** ~600 — IMPORTANT
**Sub-headings:** `### The 2025 landscape`, `### What benchmarks don't capture`

**Teaching beats:**

**Five benchmarks dominate the 2025 agent landscape**:

**SWE-bench Verified** — coding agents
- 500 real GitHub issues from popular Python projects
- Success: agent's PR passes original tests
- **Frontier ~50%; humans ~85%** (early 2025)
- The de facto coding-agent standard

**GAIA** — general AI assistants
- 466 multi-step tasks requiring tool use + browsing + file reading
- Three difficulty levels
- **Frontier 60-75% on Level 1; humans ~92%**

**OSWorld** — computer-use agents
- 369 desktop tasks executed in VMs
- **Frontier ~12-15%** — significantly harder than text-only
- Tests the embodied/computer interaction regime

**τ-bench (TauBench)** — tool-use reliability
- Customer-service scenarios with multi-turn tool use
- **pass^k metric** — does the agent succeed across k independent runs?
- **Frontier pass^4 ~50%** — surfaces reliability gaps single-trial benchmarks hide

**BrowseComp** — web research agents
- Complex web research requiring multiple sources
- **Frontier 30-50%** — designed to be hard for humans too

**Required widget placeholder** — Agent Benchmark Explorer (marquee 1, session 169):

```mdx
<WidgetFrame title="Agent benchmark explorer" caption="Five 2025 agent benchmarks visualized side-by-side: SWE-bench Verified (coding), GAIA (general assistants), OSWorld (computer use), τ-bench (tool reliability), BrowseComp (web research). Each shows state-of-the-art numbers, characteristics, example tasks, and what makes the benchmark useful. The 2025 agent evaluation landscape made visible — the discipline of Ch 26 extended to agent systems.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 169 (marquee 1)
  </div>
</WidgetFrame>
```

**Benchmark hygiene**:
- No training-set contamination
- Realistic environments (real repos, real OS, real web)
- Reproducible execution
- Multiple difficulty levels

**What benchmarks don't capture**:
- Subjective quality (was the email well-written?)
- User satisfaction
- Long-term impact (downstream consequences)
- Cost-effectiveness in deployment

**Required callout** — type `note`: **MC1 from research.md.** "If the benchmark score is high, the agent is ready for production." False. **Benchmarks measure narrow things; production requires the whole stack.** A 70% SWE-bench score doesn't mean ready for prod — it means a starting point.

**No code in this section** (the pass^k runnable in section 3 demonstrates reliability evaluation).

**Connection forward:** Section 3 covers the methodologies beyond benchmark scores.

### Section 3: Evaluation methodologies

**Heading:** `## Evaluation methodologies`
**Word target:** ~500
**Sub-headings:** `### Seven methodologies`, `### Methodology selection`

**Teaching beats:**

**Beyond benchmark scores**, real agent evaluation uses several methodologies:

**1. Task success rate** — binary; did the agent complete?
**2. Partial-credit scoring** — sub-task milestones; more informative than binary
**3. Pass^k (reliability)** — succeed across all k runs; surfaces reliability gaps
**4. Cost-quality Pareto frontiers** — production tradeoffs
**5. Human-judged evaluation** — necessary for subjective tasks; expensive but irreplaceable
**6. LLM-as-judge** (Ch 26 cross-reference) — cheaper than human; known biases
**7. Regression monitoring** — fixed dataset across versions; production workhorse

**Required code** — `<RunnableCode>` showing pass^k evaluator:

```python
import random

def run_agent_on_task(task, seed=None):
    """Mock agent: ~75% pass^1 rate."""
    if seed is not None:
        random.seed(seed)
    return random.random() < 0.75


def pass_at_k(task, k=4, n_trials=20):
    """pass^k: probability of succeeding in ALL k attempts."""
    successes = 0
    for trial in range(n_trials):
        all_succeeded = all(
            run_agent_on_task(task, seed=trial * k + i)
            for i in range(k)
        )
        if all_succeeded:
            successes += 1
    return successes / n_trials


task = "Handle this customer-service scenario."

print(f"=== Reliability evaluation for: {task} ===\\n")
for k in [1, 4, 8]:
    rate = pass_at_k(task, k=k, n_trials=100)
    print(f"  pass^{k}: {rate:.0%}")

# Observations:
# - pass^1 captures single-trial accuracy (~75% in this mock)
# - pass^4 drops to ~32% — the agent fails 2 in 3 production sessions
# - pass^8 drops further — long-running deployments expose reliability issues
# - The gap between pass^1 and pass^k is what production cares about
# - τ-bench uses pass^4 as the headline metric
```

**Methodology selection**:
- **Coding tasks** → benchmark (SWE-bench) + regression monitoring
- **Customer service** → pass^k + human judgment (sample)
- **Research/writing** → human judgment + LLM-as-judge for scale
- **Production deployment** → all of the above

**Required callout** — type `warning`: **MC3 from research.md.** "Single-trial accuracy tells you reliability." False. **Reliability is pass^k**, not pass^1. An 80% pass^1 agent may have a 40% pass^4 — the agent fails more than half of 4-attempt sessions. **τ-bench surfaced this gap empirically; ignore it at your peril.**

**Connection forward:** Section 4 covers the cost-quality dimension that benchmark scores alone miss.

### Section 4: Cost-quality Pareto

**Heading:** `## Cost-quality Pareto`
**Word target:** ~400
**Sub-headings:** `### The Pareto frontier`, `### Engineering levers`

**Teaching beats:**

**Cost matters in production.** A 90%-accurate agent at $0.50/task may be worse than an 85%-accurate agent at $0.05/task — depending on volume and tolerance.

**The Pareto frontier**:
- Plot configurations on (cost, quality) axes
- A configuration is **dominated** if another has lower cost AND higher quality
- The **non-dominated set** is the meaningful set of choices

**Typical 2025 cost-quality tradeoffs**:
- **Small models** (Haiku, GPT-4 mini): low cost, lower quality
- **Frontier models** (Opus, GPT-4o): higher cost, higher quality
- **Hybrid**: cheap model for simple tasks; frontier for hard subtasks

**Engineering levers**:
- Model choice (bigger ≠ always better)
- Caching (repeated calls)
- Prompt compression (tighter prompts cost less)
- Self-routing (cheap model decides if frontier is needed)
- Parallelism vs sequential

**Production framing**:
- Define **cost budget** (per task or per month)
- Define **quality floor** (minimum acceptable score)
- Find **Pareto-optimal configurations** that meet both
- Iterate as models, prompts, tools improve

**The SWE-bench cost-quality story** (early 2025):
- Cheapest viable: ~$0.10/task at ~30% success
- Frontier: ~$2-5/task at ~50% success
- Gap shrinking as smaller models improve

**Required code** — `<RunnableCode>` showing Pareto computation:

```python
CONFIGS = [
    {'name': 'haiku-only',          'cost': 0.02, 'quality': 0.45},
    {'name': 'sonnet-only',         'cost': 0.15, 'quality': 0.68},
    {'name': 'opus-only',           'cost': 0.85, 'quality': 0.78},
    {'name': 'hybrid-haiku-sonnet', 'cost': 0.08, 'quality': 0.62},
    {'name': 'hybrid-sonnet-opus',  'cost': 0.35, 'quality': 0.75},
    {'name': 'opus-bad-prompt',     'cost': 0.95, 'quality': 0.70},  # dominated
]


def pareto_frontier(configs):
    """Return non-dominated configurations."""
    frontier = []
    for c in configs:
        dominated = False
        for other in configs:
            if other is c: continue
            if other['cost'] <= c['cost'] and other['quality'] >= c['quality']:
                if other['cost'] < c['cost'] or other['quality'] > c['quality']:
                    dominated = True
                    break
        if not dominated:
            frontier.append(c)
    return frontier


print("=== All configurations ===")
for c in CONFIGS:
    print(f"  {c['name']:<25} cost=${c['cost']:.3f}  quality={c['quality']:.0%}")

print("\\n=== Pareto-optimal ===")
for c in sorted(pareto_frontier(CONFIGS), key=lambda x: x['cost']):
    print(f"  ✓ {c['name']:<25} cost=${c['cost']:.3f}  quality={c['quality']:.0%}")

# Observations:
# - 'opus-bad-prompt' is dominated (higher cost AND lower quality than 'opus-only')
# - All other configs are non-dominated — meaningful choices
# - Production picks a point on the frontier based on budget + quality floor
# - Dominated configurations are NEVER the right choice
```

**Required callout** — type `note`: **MC2 from research.md.** "Higher accuracy is always better." False in production. **Cost-quality tradeoffs are real.** Optimize the Pareto, not the single metric. **The Pareto-optimal configurations are the meaningful choices; dominated configurations are never correct.**

**Connection forward:** Section 5 covers the production observability frameworks that make all of this measurable in real systems.

### Section 5: Production observability frameworks

**Heading:** `## Production observability frameworks`
**Word target:** ~500
**Sub-headings:** `### The 2025 framework landscape`, `### Choosing a framework`

**Teaching beats:**

**Building an agent is half the work; operating it is the other half.** Production observability frameworks make agent systems debuggable, monitorable, and improvable.

**The 2025 landscape**:

**LangSmith** (LangChain)
- End-to-end LLM application observability
- Trace visualization (callback to Ch 28's flame graph); dataset management; eval pipelines
- Tight LangChain integration; most-adopted in that ecosystem

**Helicone**
- Drop-in proxy that captures every LLM call
- Cost tracking; latency profiling; cache management
- Lightweight; open-source; cost-focused

**Braintrust**
- Evaluation-first LLM platform
- Strong eval pipelines; regression detection; prompt experimentation
- Engineering-team focused

**Anthropic's evaluation tooling**
- Integrated with Anthropic's Console
- Evaluation playgrounds; safety tooling
- Anthropic-native

**OpenTelemetry GenAI conventions**
- Open standard for LLM trace data
- Standardized span attributes; vendor-neutral
- Requires manual instrumentation; future-proof

**Required widget placeholder** — Framework Picker (marquee 2, session 170):

```mdx
<WidgetFrame title="Framework picker" caption="Select task characteristics (existing stack, team size, complexity needs, vendor independence) and see framework recommendations across LangSmith, Helicone, Braintrust, Anthropic eval tools, OpenTelemetry, and custom-code paths. Each framework has strengths and weaknesses honestly stated. The right framework is the one your team will actually use.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 170 (marquee 2)
  </div>
</WidgetFrame>
```

**The convergence**: most platforms now adopt OpenTelemetry-compatible conventions. **The plumbing is standardizing**; the UX/UI differentiates them.

**Choosing**:
- **Team familiarity** > anything else
- **Stack alignment** (LangChain → LangSmith; cost-focused → Helicone; eval-driven → Braintrust)
- **Vendor independence** matters → OpenTelemetry

**Required callout** — type `note`: **MC5 from research.md.** "Pick the observability platform with the most features." Misleading. **The right platform is the one your team will actually use.** Feature overload often correlates with under-adoption. Match the platform to your team's needs, not to the maximum feature checklist.

**No code in this section** (the next runnable is in section 6 — regression monitoring).

**Connection forward:** Section 6 closes the production-readiness arc with deployment patterns and a concrete checklist.

### Section 6: Deployment patterns and readiness

**Heading:** `## Deployment patterns and readiness`
**Word target:** ~500
**Sub-headings:** `### Five deployment patterns`, `### The production-readiness checklist`

**Teaching beats:**

**Going from prototype to production** requires more than hosting. **Five deployment patterns**:

**1. Staging environments** — production-like; non-production data; pre-prod regression eval
**2. Canary deployment** — small % of traffic first; monitor metrics; roll back on regression. **The standard pattern.**
**3. A/B testing** — two versions in parallel; statistical significance for quality
**4. Shadow deployment** — new version runs in parallel without affecting users
**5. Feature flags** — toggle without code deploy; per-user rollouts

**Required code** — `<RunnableCode>` showing regression monitoring:

```python
BASELINE_SCORES = {
    'task_lookup':       0.92,
    'task_summarize':    0.85,
    'task_code_review':  0.71,
    'task_math':         0.65,
}


def score_current_version(task_name):
    """Mock: in production, runs the current agent against the labeled dataset."""
    import random
    random.seed(hash(task_name) % 1000)
    drift = random.uniform(-0.05, 0.05)
    if task_name == 'task_math':
        return BASELINE_SCORES[task_name] - 0.15  # significant regression
    return BASELINE_SCORES[task_name] + drift


def check_regressions(baseline, threshold=0.05):
    print("=== Regression check ===\\n")
    regressions = []
    for task, baseline_score in baseline.items():
        current = score_current_version(task)
        delta = current - baseline_score
        marker = '🚨' if delta < -threshold else '✓ '
        print(f"  {marker} {task:<22} baseline={baseline_score:.0%}  current={current:.0%}  Δ={delta:+.0%}")
        if delta < -threshold:
            regressions.append({'task': task, 'delta': delta})
    print()
    if regressions:
        print(f"⚠️  {len(regressions)} regression(s) — BLOCK deployment")
    else:
        print("✓ All tasks pass — OK to deploy")
    return regressions


check_regressions(BASELINE_SCORES)

# Observations:
# - Regression monitoring catches quality drops that benchmarks alone miss
# - Threshold (5%) is tunable — too tight = false alarms; too loose = misses
# - 'task_math' regressed 15% — flagged
# - Production CI/CD blocks deployments with significant regressions
# - This is the production-eval workhorse
```

**The production-readiness checklist**:

| Category | Checks |
|---|---|
| **Functionality** | Benchmark threshold met; manual QA passed; edge cases tested |
| **Reliability** | pass^4 ≥ threshold; tool failures handled; timeouts configured |
| **Cost** | Per-task cost within budget; cost alerting; rate limiting |
| **Latency** | p50/p95/p99 measured; SLA defined; latency alerting |
| **Safety** | Sandboxing for dangerous tools; safety eval passed |
| **Observability** | All LLM calls traced; structured logging; PII redaction |
| **Deployment** | Staging environment; canary pattern; rollback procedure |
| **Operations** | On-call runbook; incident response; post-mortem template |

**The transition from prototype to production** is where most agent projects stall. **This checklist makes the transition concrete.**

**Required callout** — type `warning`: **MC6 from research.md.** "Deployment is just hosting." False. **Production deployment requires** staging, canary, monitoring, alerting, rollback, on-call. **Skipping these is how agent projects go from working prototype to broken production system.** The readiness checklist exists because the gap is real.

**Connection forward:** Section 7 takes stock of Phase 15's four-chapter arc.

### Section 7: Looking back at Phase 15

**Heading:** `## Looking back at Phase 15`
**Word target:** ~400
**Sub-headings:** `### The four chapters`, `### What the reader can now do`

**Teaching beats:**

**Phase 15 covered the agent stack** in four chapters:

| Chapter | Topic | Taught |
|---------|-------|--------|
| **Ch 27** Agent foundations | Conceptual | The loop; ReAct; AutoGPT lessons; patterns and anti-patterns |
| **Ch 28** Agents from scratch | Engineering | Tool design, schemas, error handling, observability, scaffolding (80%) |
| **Ch 29** Multi-agent | Composition | Architectures, communication, role specialization, frameworks, honest assessment |
| **Ch 30** (this) | Discipline | Evaluation, observability frameworks, deployment, production readiness |

**The Phase 15 arc**:
- Ch 27 → Ch 28: concept to working code
- Ch 28 → Ch 29: one agent to many
- Ch 29 → Ch 30: building to evaluating

**What the reader can now do after Phase 15**:
- Design an agent loop appropriate to a task
- Implement production-grade agents with proper tools, schemas, error handling, observability
- Decide when multi-agent is warranted (and when it isn't)
- Evaluate agent systems with appropriate methodologies (pass^k, Pareto, regression)
- Deploy agents to production with the right observability and safety patterns

**Phase 15 framing**: agents are real, useful, and improving fast. They are also still maturing. **The reader leaving Phase 15 has the practical foundation to build agent systems that survive production traffic — and the calibration to avoid over-engineering them.**

**No code in this section.** Reflective.

**Connection forward:** Section 8 closes the curriculum.

### Section 8: The curriculum closes

**Heading:** `## The curriculum closes`
**Word target:** ~700 — **THE MOST IMPORTANT SECTION OF THE CURRICULUM**
**Sub-headings:** `### Thirty chapters`, `### What's not covered`, `### What comes next`, `### One last thing`

**Teaching beats (this section is the curriculum's signature moment — write with care):**

**Thirty chapters.** From numpy primitives in Ch 1 to agent systems in production in Ch 30. **Looking back over the arc:**

The chapter walks through all **nine parts** of the curriculum with one paragraph each. Each paragraph honors what the reader learned in that part:

**Part I — Foundations (Ch 1-3).** Tokens, embeddings, basic neural building blocks. Implemented in numpy from first principles. **Matrix multiplication and softmax — the substrate of everything that followed.**

**Part II — The Transformer (Ch 4-6).** Attention, multi-head attention, the full transformer block. **The architectural pattern that powered the field. You implemented it from scratch.**

**Part III — Pre-training (Ch 7-10).** Training objectives. Scaling laws (Chinchilla; Hoffmann 2022). Data curation. Distributed training. **How frontier models actually get made — not just in theory but in engineering practice.**

**Part IV — Alternate Architectures (Ch 11-12).** Mixture of experts; state-space models. **The alternatives to dense transformers** — Mixtral, Mamba, the diversity of the architectural landscape.

**Part V — Post-training (Ch 13-16).** Supervised fine-tuning; RLHF; DPO; constitutional AI. **From base models to assistants. From "predicts the next token" to "answers helpfully and harmlessly."**

**Part VI — Inference (Ch 17-19).** KV-caching; speculative decoding; sampling strategies. **The engineering that makes serving fast and affordable. The 100ms/token vs 5ms/token difference between toy and product.**

**Part VII — Capabilities (Ch 20-23).** Reasoning (chain-of-thought, scratchpads). Tool use. Retrieval-augmented generation. Multimodal models. **What LLMs can do beyond text generation.**

**Part VIII — Discipline (Ch 24-26).** Safety, interpretability, evaluation. **The three disciplines that turn impressive capability into trustworthy products.** This is where the curriculum stopped accumulating features and started insisting on rigor.

**Part IX — Agents (Ch 27-30).** Foundations, engineering, composition, evaluation. **The composition of every layer that came before**: capable models (Phases 1-7), made trustworthy (Phase 8), assembled into systems that observe, think, act, iterate, and prove themselves in production (Phase 9).

**What this curriculum doesn't cover**:
- **Specific model implementations** (Llama, Claude, GPT internals — vendor-specific)
- **Hardware design** (TPUs, chips — beyond the chapters on infrastructure)
- **The latest research papers** — the field moves faster than any curriculum can
- **Specific business applications** — each industry has its own patterns

**What comes next for the field**:
- **Better reasoning** (test-time compute scaling; reasoning models like o1/o3)
- **Better agents** (more reliable, more capable, more autonomous within bounds)
- **Better safety** (interpretability scaling; alignment research)
- **Better efficiency** (smaller models with frontier capability)
- **Better integration** (LLMs as components in larger software systems)

**You have the foundation to follow any of these directions.**

**One last thing** (the closing thought — written in chapter voice):

> Thirty chapters. From the first matrix multiplication to the last production agent. **You started with numpy and ended with systems that observe, think, act, and iterate at production scale.** The field will keep moving — new architectures, new capabilities, new failure modes, new disciplines. **What this curriculum gave you is the foundation to follow.**
>
> The transformer block is still the same matrix-multiplication-and-softmax it was in Chapter 4. The agent loop is still the same observe-think-act it was in Chapter 27. **The principles don't change as fast as the products.** When the next breakthrough lands — and it will — you'll be reading the paper with the substrate to understand it.
>
> **That's what this curriculum was for.**
>
> **Now go build.**

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 30, slug: 'ch30-agent-eval-and-frameworks', title: 'Agent eval and frameworks', partNum: 9, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch30-agent-eval-and-frameworks/index.astro && rm src/pages/ch30-agent-eval-and-frameworks/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch30-agent-eval-and-frameworks/`** renders with:
   - Chapter eyebrow ("Chapter 30") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 3, 4, 6)
   - 2 `<WidgetFrame>` placeholders (sections 2 and 5)
   - At least 5 callouts (section-1 aside, MC1 in section 2, MC3 in section 3, MC2 in section 4, MC5 in section 5, MC6 in section 6 — pick 5)
3. **Sidebar:** Ch 1-29 published; Ch 30 active (draft)
4. **Prev/next nav at bottom of Ch 30:** prev = Ch 29 (active); next = none (Ch 30 is the last chapter)
5. **TOC on Ch 30** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3500 and 4200 words; section 8 specifically should be at least 600 words
7. **Section 8 includes**: the 9-part retrospective, the "what's not covered" list, the "what comes next" list, AND the closing thought paragraph (verbatim or in close-to-verbatim chapter voice)
8. **The closing thought** ends with "Now go build" (or equivalent declarative chapter voice)
9. **`npm run typecheck`** passes
10. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 169 and 170 own them.
- ❌ **Do not write exercises.** Session 171 owns.
- ❌ **Do not flip Ch 30's status to `'published'`.** Session 171 owns. **Session 171 is the curriculum's complete moment.**
- ❌ **Do not deep-dive any single benchmark.** Name the canon; readers will go to source.
- ❌ **Do not deep-dive any single observability framework.** Name strengths/weaknesses; choice depends on team.
- ❌ **Do not predict the future of AI.** Section 8's "what comes next" is high-level only.
- ❌ **Do not modify Ch 1-29.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch30-agent-eval-and-frameworks/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch30-agent-eval-and-frameworks/index.astro 2>/dev/null || true
git commit -m "session 128: Ch 30 prose — agent eval and frameworks + the curriculum's close"
git push origin main
```

---

## Notes for the session author

**On THIS being the most important page-structure session in the curriculum:**
Section 8 is the curriculum's signature moment. **A reader reaching the closing thought should feel: respected, equipped, sent off well.** Notes-for-author: "**This section will be re-read.** It's the conclusion of 30 chapters of work for the reader. **Write with the care it deserves.**"

**On the closing thought being verbatim-quality:**
The 4-paragraph closing thought (drafted in this prompt and in the research file) IS the curriculum's final message. Notes-for-author: "**The closing thought is essentially verbatim** from the research file. **Honor it.** Light edits for chapter voice are fine; the structure and ending ('Now go build.') are non-negotiable."

**On "discipline applied to composition" being the chapter's tonal anchor:**
Ch 26 was discipline applied to capability. Ch 30 is discipline applied to composition. **The two chapters mirror each other across the curriculum's halves.** Notes-for-author: "**The aside in section 1 names this mirror explicitly.** Reader who has read Ch 26 (95%+ of readers reaching Ch 30) will recognize the structural symmetry."

**On honest framing throughout:**
Concrete numbers (SWE-bench Verified ~50%; humans ~85%); honest tradeoffs (cost-quality Pareto; dominated configurations); honest readiness (most projects skip the checklist). Notes-for-author: "**The chapter's argument is that production agents require discipline.** Honest numbers and honest framing reinforce the argument."

**On the 9-part retrospective in section 8:**
Each part gets one paragraph. **Honor what the reader learned in that part.** Notes-for-author: "**These paragraphs are the curriculum's autobiography.** Reader sees the 30-chapter arc summarized; the parts that mattered most to them light up. **Each paragraph should evoke the chapters' character, not just list topics.**"

**On the marquee 1 placement (section 2 — benchmarks):**
Five benchmarks visualized side-by-side. Notes-for-author: "**The widget makes the 2025 agent evaluation landscape concrete.** Reader sees the numbers (50%, 75%, 12%, etc.) and recognizes that agent capability is still developing."

**On the marquee 2 placement (section 5 — frameworks):**
Framework picker — interactive selector with task-characteristic inputs. Notes-for-author: "**The widget reinforces the chapter's framework-as-plumbing framing.** No single "best" framework — the right choice depends on team and stack."

**On the 3 runnable code blocks:**
- **Section 3 (pass^k)**: 25 lines; demonstrates the gap between pass^1 (~75%), pass^4 (~32%), pass^8 (~10%)
- **Section 4 (Pareto)**: 35 lines; identifies dominated configurations
- **Section 6 (regression monitoring)**: 30 lines; CI/CD pattern catching quality drops

**The progression**: evaluate reliability → optimize cost-quality → monitor regression. **Reader sees the production-eval toolkit in code.**

**On the chapter's connection to all of Phase 14:**
Ch 24 (safety), Ch 25 (interpretability), Ch 26 (evaluation) all surface in Ch 30 — agent eval extends Ch 26's discipline; agent safety extends Ch 24's framing; observability extends Ch 25's interpretability. Notes-for-author: "**Ch 30 is the integration point** for Phase 14's three disciplines. **Reader who has internalized Phase 14 will see them all reappear here.**"

**On the closing thought's structural anatomy:**
1. Acknowledge the journey (paragraph 1)
2. Honor what doesn't change (paragraph 2)
3. State the curriculum's purpose (paragraph 3)
4. Send off (paragraph 4: "Now go build.")

Notes-for-author: "**The 4-paragraph structure is the curriculum's signature.** Each paragraph has a specific job. Don't merge them; don't reorder them; don't soften the ending."

**Pedagogical claim of the chapter (and of the curriculum):**
"**Agent eval is structurally harder than LLM eval.** Tasks are multi-step; success is multi-dimensional; benchmarks are slow to develop; production readiness includes observability and deployment. **The 2025 benchmark landscape** (SWE-bench Verified, GAIA, OSWorld, τ-bench, BrowseComp) is maturing but still incomplete. **Methodologies** (pass^k, partial credit, cost-quality Pareto, human-judged, regression monitoring) cover the dimensions benchmarks miss. **Production frameworks** (LangSmith, Helicone, Braintrust, OpenTelemetry) make observability and operations tractable. **Deployment patterns and readiness checklists** mark the boundary between prototype and production. **And the curriculum closes**: thirty chapters from numpy primitives to agent systems in production. **The principles don't change as fast as the products. Now go build.**"

**Curriculum status after this session**: 29 published / 30 total. **Ch 30 in progress (2/5 files).** Three sessions remain — and the curriculum is complete.

**The final session (171) is the curriculum's complete moment.** This page-structure session lays the foundation for it. **Write with care.**

Build with care. **This is the page structure for the final chapter of the curriculum.**
