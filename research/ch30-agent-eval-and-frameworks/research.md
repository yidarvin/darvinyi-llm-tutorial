# Chapter 30 — Agent eval and frameworks: research

> **THE FINAL CHAPTER OF THE CURRICULUM.** Curated source material for Chapter 30's build sessions. The closing chapter brings Part VIII's evaluation discipline (Ch 26) to bear on Part IX's agent systems (Ch 27-29) — and then takes stock of the full 30-chapter journey. **The chapter that closes the curriculum.** Agent evaluation is harder than LLM evaluation because: tasks are complex; success criteria are multi-dimensional (correctness, cost, latency, safety); benchmarks are slow to develop; production-readiness includes observability, deployment, and ongoing monitoring. **Topics:** why agent eval is structurally harder than LLM eval; the 2025 agent benchmark landscape (SWE-bench Verified, GAIA, OSWorld, τ-bench, BrowseComp); evaluation methodologies (success rate, partial-credit, cost-quality Pareto frontiers, human-judged scoring); production observability frameworks (LangSmith, Helicone, Braintrust, Anthropic's evaluation tools); deployment patterns and production-readiness checklists; **and the curriculum's closing retrospective**: 30 chapters from numpy primitives to agent systems in production. **Two-topic chapter**; uses the **5-file cadence**. **The chapter that closes the journey.**

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Agent eval and frameworks

**Premise:** Building an agent (Ch 28) and composing multiple agents (Ch 29) gives you a working system. **Knowing whether it's good** is a separate problem — and a harder one than evaluating individual LLMs (Ch 26). Agent tasks are multi-step; success is multi-dimensional; benchmarks are still maturing; production-readiness includes observability and deployment. **This chapter brings discipline back to agents** and **closes the curriculum**.

**Dual responsibility:**
1. **As a chapter**: cover agent evaluation comprehensively — benchmarks, methodologies, production frameworks, deployment patterns
2. **As the curriculum's close**: bring together themes from the full 30-chapter arc; honor the journey from numpy primitives (Ch 1) to agent systems (Ch 30)

**Out of scope (other chapters):**
- LLM-level evaluation (Ch 26 — discipline arc)
- Agent foundations (Ch 27)
- Agent engineering (Ch 28)
- Multi-agent composition (Ch 29)

**In scope and locked:**
- **Why agent evaluation is structurally harder** than LLM evaluation
- **Agent benchmarks** — SWE-bench Verified, GAIA, OSWorld, τ-bench, BrowseComp, WebArena
- **Evaluation methodologies** — success rate, partial-credit, cost-quality Pareto frontiers, human-judged
- **Production observability frameworks** — LangSmith, Helicone, Braintrust, Anthropic eval tools, OpenTelemetry
- **Deployment patterns** — staging, canarying, A/B testing, regression monitoring
- **Production-readiness checklist**
- **The curriculum's close** — 30 chapters in retrospect

**Suggested chapter structure** (8 sections):

1. Why agent evaluation is harder (~400 words)
2. Agent benchmarks (~600 words)
3. Evaluation methodologies (~500 words)
4. Cost-quality Pareto (~400 words)
5. Production observability frameworks (~500 words)
6. Deployment patterns and readiness (~500 words)
7. Looking back at the agent arc (~400 words)
8. **The curriculum closes** (~700 words)

Target: ~4000 words plus 2 widgets and 3 runnable code blocks.

**Tonal anchor:** **discipline applied to composition.** Ch 26 was discipline applied to capability; Ch 30 is discipline applied to composition. The two chapters mirror each other across the curriculum's halves. **The closing section must honor the journey without being maudlin.** Honest, grounded, forward-looking.

**Importance:** This chapter has **dual responsibility** — it's both a substantive chapter on agent evaluation AND the curriculum's close. The closing section is the curriculum's signature moment. **Write it with care.**

---

## Key papers and references

### Jimenez et al. 2023 — "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?"
- **Paper:** [arxiv.org/abs/2310.06770](https://arxiv.org/abs/2310.06770)
- **Site:** [swebench.com](https://swebench.com)
- **What it contributed:** Benchmark of 2,294 real GitHub issues from 12 popular Python repositories. **SWE-bench Verified** (a curated subset of ~500 problems) is the de facto standard for coding-agent evaluation. **Frontier agents reach ~50%** on Verified as of early 2025; humans ~85%.

### Mialon et al. 2023 — "GAIA: A Benchmark for General AI Assistants"
- **Paper:** [arxiv.org/abs/2311.12983](https://arxiv.org/abs/2311.12983)
- **Site:** [huggingface.co/gaia-benchmark](https://huggingface.co/gaia-benchmark)
- **What it contributed:** 466 multi-step real-world tasks requiring tool use, web browsing, file reading. **Three difficulty levels** (Level 1: easy; Level 3: hard). **Humans score ~92%; frontier agents ~60-75%** on Level 1 as of early 2025.

### OSWorld (2024)
- **Paper:** [arxiv.org/abs/2404.07972](https://arxiv.org/abs/2404.07972)
- **Site:** [os-world.github.io](https://os-world.github.io)
- **What it contributed:** 369 real computer tasks (desktop apps, browsers, file management) executed in Ubuntu/Windows VMs. **Frontier agents ~12-15%** as of early 2025 — significantly harder than text-only benchmarks.

### τ-bench (TauBench) — Anthropic 2024
- **Paper:** [arxiv.org/abs/2406.12045](https://arxiv.org/abs/2406.12045)
- **What it contributed:** Tool-use benchmark with conversational customer-service scenarios (retail, airline). **Tests reliability across multiple attempts** (pass^k metric — does the agent succeed all k attempts?). **Frontier agents pass^4 around 50%** — revealing reliability gaps that single-trial metrics hide.

### BrowseComp — OpenAI 2024
- **Paper / blog:** [openai.com/index/browsecomp](https://openai.com/index/browsecomp)
- **What it contributed:** Browsing benchmark requiring complex web research (multi-page, multi-source). **Frontier agents ~30-50%** as of early 2025. **Designed to be hard for humans too** — questions where the answer requires substantial research.

### WebArena (2023)
- **Paper:** [arxiv.org/abs/2307.13854](https://arxiv.org/abs/2307.13854)
- **Site:** [webarena.dev](https://webarena.dev)
- **What it contributed:** Realistic web environments (e-commerce, social, dev) with 812 tasks. **Earlier benchmark** that informed later designs (BrowseComp, OSWorld).

### LangSmith documentation 2023-2025
- **Site:** [docs.smith.langchain.com](https://docs.smith.langchain.com)
- **What it contributed:** Production observability platform for LLM applications. **Trace visualization** (mirrors Ch 28's Agent Trace Inspector); evaluation pipelines; dataset management. **The most-adopted observability platform** in the LangChain ecosystem.

### Helicone 2024
- **Site:** [helicone.ai](https://helicone.ai)
- **What it contributed:** Open-source LLM observability. **Drop-in proxy** that captures every LLM call; cost tracking; latency profiling. Lighter-weight than LangSmith; popular for cost-sensitive deployments.

### Braintrust 2024
- **Site:** [braintrust.dev](https://braintrust.dev)
- **What it contributed:** Evaluation-first LLM platform. **Strong focus on eval pipelines, regression detection, prompt experimentation.** Popular at companies running rigorous eval-driven development.

### Anthropic 2024-2025 — Agent evaluation guidance
- **Site:** [docs.anthropic.com](https://docs.anthropic.com)
- **What it contributed:** Anthropic's published guidance on evaluating agentic systems — including the "agent evaluation playbook" framing; the pass^k reliability metric (τ-bench); rubric-based human-judged evaluation patterns.

### OpenTelemetry GenAI conventions 2024
- **Site:** [opentelemetry.io/docs/specs/semconv/gen-ai/](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- **What it contributed:** Standardized semantic conventions for LLM trace data — span attributes for model name, token counts, costs. **The convergence of observability standards** across vendors.

### Cross-references from earlier chapters
- **Ch 26 (Evaluation)** — discipline; LLM benchmarks; LLM-as-judge; the framing this chapter extends
- **Ch 28 (Agents from scratch)** — observability (trace flame graph widget); structured logging
- **Ch 24 (Safety)** — agent safety evaluation; sandboxing
- **Ch 19 (Sampling)** — temperature affects agent reliability; pass^k metric
- **Ch 20 (Reasoning)** — chain-of-thought metrics

---

## Core concepts

### Concept 1: Why agent evaluation is harder

**LLM evaluation** (Ch 26) is challenging but bounded. **Agent evaluation** is structurally harder because:

**1. Tasks are multi-step.**
A single LLM eval has one prompt and one response. **An agent eval has a task** that the agent executes over many turns — with tool calls, retries, intermediate decisions. **Evaluation must cover the trajectory**, not just the final answer.

**2. Success is multi-dimensional.**
LLM eval can often reduce to one number (accuracy, ROUGE, BLEU). **Agent eval involves**:
- **Task success** (did the agent complete the task?)
- **Cost** (LLM calls, tool calls, total $)
- **Latency** (time to completion)
- **Safety** (no harmful actions taken)
- **Robustness** (success across N attempts — pass^k)
- **Cost-quality tradeoff** (Pareto frontier across models/configs)

**No single number** captures all of these.

**3. Verifying success is harder.**
LLM eval has labeled answers; agent eval often requires:
- **Running the agent's output** (does the produced code compile? do tests pass?)
- **Replicating environment state** (was the email sent? was the file created?)
- **Human judgment** (is the produced essay "good"?)

**Verification often requires running the world** that the agent acted on.

**4. Reliability matters more.**
A 95%-accurate LLM is great; **a 95%-reliable agent fails 1 in 20 production tasks.** Agent eval emphasizes **pass^k metrics** — does the agent succeed across k independent runs of the same task? This catches reliability issues that single-trial accuracy hides.

**5. Benchmarks are slow to develop.**
LLM benchmarks (MMLU, HumanEval) can be assembled in months. **Agent benchmarks require** realistic environments (real GitHub repos, real desktop OS, real web pages) — building these takes years. **SWE-bench took ~1 year to build**; OSWorld required custom VM infrastructure.

**The framing**: agent eval is **LLM eval × system complexity × environmental verification**. It's not just harder in degree — it's harder in kind.

### Concept 2: Agent benchmarks

**The 2025 agent benchmark landscape** has matured but is still developing. Five benchmarks dominate:

**SWE-bench (Verified)** — coding agents
- **Tasks**: 500 real GitHub issues from popular Python projects
- **Success criterion**: agent's PR passes all the original tests
- **State of the art (early 2025)**: frontier agents ~50%; humans ~85%
- **Used by**: Anthropic Claude (Sonnet 4 achieved frontier scores), Cognition (Devin), GitHub Copilot, every coding-agent vendor
- **What makes it useful**: real code, real bugs, real tests — closest thing to production coding work

**GAIA** — general AI assistants
- **Tasks**: 466 multi-step real-world tasks requiring tool use, browsing, file reading
- **Success criterion**: exact-match on final answer
- **State of the art**: frontier agents 60-75% on Level 1; humans ~92%
- **Three levels**: increasing difficulty
- **What makes it useful**: tests the full agent stack — planning, tool use, retrieval

**OSWorld** — computer-use agents
- **Tasks**: 369 desktop tasks (Excel, browsers, file management)
- **Success criterion**: state-based (was the file saved? was the form submitted?)
- **State of the art**: frontier agents ~12-15% — much harder than text-only benchmarks
- **Used by**: Anthropic Claude Computer Use, OpenAI Operator (when announced), all desktop-agent vendors
- **What makes it useful**: tests embodied/computer interaction — the hardest agent regime

**τ-bench (TauBench)** — tool-use reliability
- **Tasks**: customer-service scenarios (retail, airline) requiring multi-turn tool use
- **Success criterion**: pass^k — does the agent succeed across k independent runs?
- **State of the art**: pass^4 around 50% for frontier agents
- **What makes it useful**: surfaces reliability issues that single-trial benchmarks miss

**BrowseComp** — web research agents
- **Tasks**: complex web research questions requiring multiple sources
- **Success criterion**: exact-match or near-match on factual answer
- **State of the art**: frontier agents 30-50%
- **What makes it useful**: tests real-world browsing capability; designed to be hard even for humans

**Benchmark hygiene**:
- **No training-set contamination** (test problems weren't seen during training)
- **Realistic environments** (real repos, real OS, real web)
- **Reproducible execution** (deterministic where possible)
- **Multiple difficulty levels** to track progress across capability ranges

**What benchmarks don't capture**:
- **Subjective quality** (was the email well-written?)
- **User satisfaction** (did the user like the result?)
- **Long-term impact** (did the agent's actions cause downstream problems?)
- **Cost-effectiveness in deployment** (a 50% benchmark score may be acceptable if costs are 1/10 of alternatives)

### Concept 3: Evaluation methodologies

**Beyond benchmark scores**, real agent evaluation uses several methodologies:

**1. Task success rate**
- Binary: did the agent complete the task?
- Most common single metric
- **Limitations**: doesn't capture partial progress; reliability hidden in single-trial averages

**2. Partial-credit scoring**
- Define sub-task milestones; score based on how many were completed
- More informative than binary success
- **Example**: SWE-bench could score on (files touched correctly, tests modified appropriately, tests passing)
- **Tradeoff**: more complex to design; rubrics can drift

**3. Pass^k (reliability)**
- Run the same task k times; success rate across all k runs (must succeed every time)
- Surfaces reliability issues hidden by single-trial accuracy
- **Example**: if pass^1 = 80% but pass^4 = 50%, the agent fails 1 in 4 production runs
- **τ-bench's signature metric**

**4. Cost-quality Pareto frontiers**
- Plot cost vs quality for different model/configuration choices
- Identifies which configurations are dominated (higher cost AND lower quality)
- **The right configuration depends on the use case** — production may prioritize cost; experimentation may prioritize quality

**5. Human-judged evaluation**
- Have humans score outputs on a rubric (correctness, helpfulness, safety)
- Necessary for subjective tasks
- **Expensive but irreplaceable** for tasks like "write a good essay"

**6. LLM-as-judge (Ch 26 cross-reference)**
- Use another LLM to score outputs
- Cheaper than human eval; catches obvious failures
- **Known biases**: verbosity bias, position bias, recency bias (Ch 26)

**7. Regression monitoring**
- Score outputs on a fixed dataset across model/prompt versions
- Detect regressions when changes degrade quality
- **The production-eval workhorse** — checks that updates don't break anything

**Methodology selection**:
- **Coding tasks** → benchmark (SWE-bench) + regression monitoring
- **Customer service** → pass^k + human judgment (sample)
- **Research/writing** → human judgment + LLM-as-judge for scale
- **Production deployment** → all of the above

### Concept 4: Cost-quality Pareto

**Cost matters in production.** A 90%-accurate agent costing $0.50 per task may be worse than an 85%-accurate agent costing $0.05 — depending on volume and tolerance.

**The Pareto frontier**:
- Plot configurations on (cost, quality) axes
- The Pareto-optimal set = configurations not dominated by any other
- A configuration is **dominated** if another exists with lower cost AND higher quality
- **Non-dominated configurations** are the meaningful choices

**Typical 2025 cost-quality tradeoffs**:
- **Small models** (Claude Haiku, GPT-4 mini): low cost, lower quality
- **Frontier models** (Claude Opus, GPT-4o, Gemini Pro): higher cost, higher quality
- **Hybrid**: cheap model for routing/simple tasks; frontier for hard subtasks

**Engineering levers**:
- **Model choice**: bigger ≠ always better when cost matters
- **Caching**: repeated tool calls can be cached
- **Prompt compression**: tighter prompts cost less per call
- **Self-routing**: cheap model decides if frontier is needed
- **Parallelism vs sequential**: parallel often faster but not cheaper

**Production framing**:
- Define your **cost budget** (per task or per month)
- Define your **quality floor** (minimum acceptable score)
- **Find Pareto-optimal configurations** that meet both constraints
- **Iterate** as models, prompts, and tools improve

**The cost-quality story for SWE-bench-class tasks** (early 2025):
- Cheapest viable: ~$0.10/task at ~30% success
- Frontier: ~$2-5/task at ~50% success
- The gap is shrinking as smaller models improve

### Concept 5: Production observability frameworks

**Building an agent is half the work; operating it is the other half.** Production observability frameworks make agent systems debuggable, monitorable, and improvable.

**LangSmith (LangChain)**
- **Design**: end-to-end LLM application observability
- **Features**: trace visualization (callback to Ch 28's flame graph); dataset management; eval pipelines; prompt experimentation
- **Strengths**: tight LangChain integration; mature; most-adopted in the LangChain ecosystem
- **Weaknesses**: opinionated; assumes LangChain conventions
- **When to use**: if you're on LangChain/LangGraph

**Helicone**
- **Design**: drop-in proxy that captures every LLM call
- **Features**: cost tracking; latency profiling; cache management; user-level analytics
- **Strengths**: minimal integration overhead; open-source; cost-focused
- **Weaknesses**: less feature-rich than LangSmith for complex workflows
- **When to use**: cost-sensitive deployments; lightweight observability needs

**Braintrust**
- **Design**: evaluation-first LLM platform
- **Features**: strong eval pipelines; regression detection; prompt experimentation; A/B testing
- **Strengths**: rigorous eval-driven development; engineering-team focused
- **Weaknesses**: steeper learning curve
- **When to use**: teams running rigorous evals as part of their development workflow

**Anthropic's evaluation tooling**
- **Design**: integrated with Anthropic's Console and Claude apps
- **Features**: evaluation playgrounds; prompt comparison; safety tooling
- **Strengths**: tight integration with Anthropic models; safety-aware
- **When to use**: Anthropic-native deployments

**OpenTelemetry GenAI conventions**
- **Design**: open standard for LLM trace data
- **Features**: standardized span attributes; vendor-neutral
- **Strengths**: future-proof; works across vendors
- **Weaknesses**: requires manual instrumentation
- **When to use**: when vendor independence matters

**The convergence**: most platforms now adopt OpenTelemetry-compatible conventions. **The plumbing is standardizing**; the UX/UI differentiates them.

**Framework selection**:
- **Team familiarity** > anything else
- **Existing stack alignment** (LangChain → LangSmith; cost-focused → Helicone; eval-driven → Braintrust)
- **Vendor independence** if you're worried about lock-in (OpenTelemetry)

### Concept 6: Deployment patterns and readiness

**Going from prototype to production** requires more than just hosting. The patterns and checklists below mark the boundary.

**Deployment patterns**:

**1. Staging environments**
- Production-like environment with non-production data
- Run regression eval before promoting to production
- Catch breakage from prompt/model changes before users see it

**2. Canary deployment**
- Roll out changes to small % of traffic first
- Monitor cost, latency, quality metrics
- Roll back if metrics regress
- **The standard pattern** for production agent deployments

**3. A/B testing**
- Run two versions in parallel; compare metrics
- Statistical significance for quality comparisons
- **Effective for**: prompt changes, model swaps, tool design changes

**4. Shadow deployment**
- New version runs in parallel without affecting users
- Compares outputs offline
- Lower risk than A/B; slower to learn from

**5. Feature flags**
- Toggle agent features on/off without code deploy
- Enable per-user rollouts
- Quick rollback when issues surface

**Production-readiness checklist**:

| Category | Checks |
|---|---|
| **Functionality** | Benchmark performance meets threshold; manual QA passed; edge cases tested |
| **Reliability** | Pass^4 ≥ acceptable threshold; tool failures handled gracefully; timeouts configured |
| **Cost** | Per-task cost within budget; cost monitoring alerting; rate limiting in place |
| **Latency** | p50/p95/p99 latency measured; SLA defined; latency monitoring alerting |
| **Safety** | Sandboxing for dangerous tools; safety eval passed; safety regression monitoring |
| **Observability** | All LLM calls traced; structured logging; PII redaction in logs |
| **Deployment** | Staging environment; canary pattern; rollback procedure documented |
| **Operations** | On-call runbook; incident response plan; post-mortem template |

**The transition from prototype to production** is where most agent projects stall. **Checklists like this make the transition concrete.**

### Concept 7: Looking back at the agent arc

**Part IX covered the agent stack** in four chapters:

| Chapter | Topic | What it taught |
|---------|-------|----------------|
| **Ch 27** Agent foundations | Conceptual | The agentic loop; ReAct; AutoGPT lessons; patterns and anti-patterns |
| **Ch 28** Agents from scratch | Engineering | Tool design, schemas, error handling, observability, scaffolding (the 80%) |
| **Ch 29** Multi-agent | Composition | Architectures, communication, role specialization, frameworks, honest assessment |
| **Ch 30** (this) | Discipline | Evaluation, observability frameworks, deployment, production readiness |

**The Part IX arc**:
- Ch 27 → Ch 28: from concept to working code
- Ch 28 → Ch 29: from one agent to many
- Ch 29 → Ch 30: from building to evaluating

**What the reader can now do after Part IX**:
- Design an agent loop appropriate to a task
- Implement production-grade agents with proper tools, schemas, error handling, observability
- Decide when multi-agent is warranted (and — equally importantly — when it isn't)
- Evaluate agent systems with appropriate methodologies
- Deploy agents to production with the right observability and safety patterns

**Where agents stand today**: agents are real, useful, and improving fast. They are also still maturing. **The reader leaving Part IX has the practical foundation to build agent systems that survive production traffic** — and the calibration to avoid over-engineering them.

### Concept 8: The curriculum closes

**Thirty chapters.** From numpy primitives to agent systems in production. **Looking back over the arc:**

**Part I — Foundations (Ch 1-3)**
Tokens, embeddings, basic neural building blocks in numpy. **The chapter that started it all: matrix multiplication and softmax.**

**Part II — The Transformer (Ch 4-6)**
Attention, multi-head attention, the full transformer block. **The architectural pattern that powered everything that followed.**

**Part III — Pre-training (Ch 7-10)**
Training objectives, scaling laws, data curation, infrastructure. **How the big models actually get made.**

**Part IV — Alternate Architectures (Ch 11-12)**
Mixture of experts, state-space models. **The architectural alternatives** — most production is still transformer-dominated, but the alternatives matter.

**Part V — Post-training (Ch 13-16)**
Supervised fine-tuning, RLHF, DPO, constitutional AI. **From base models to assistants.**

**Part VI — Inference (Ch 17-19)**
KV-caching, speculative decoding, sampling strategies. **What makes serving fast and cheap.**

**Part VII — Capabilities (Ch 20-23)**
Reasoning (chain-of-thought, scratchpads), tool use, retrieval-augmented generation, multimodal. **What LLMs can do beyond text generation.**

**Part VIII — Discipline (Ch 24-26)**
Safety, interpretability, evaluation. **Making capability trustworthy.**

**Part IX — Agents (Ch 27-30)**
Foundations, engineering, composition, evaluation. **Putting it all together into systems that act.**

**The journey**: every layer of the modern LLM stack, in order, with engineering rigor and honest framing throughout.

**What this curriculum doesn't cover**:
- Specific model implementations (Llama, Claude, GPT internals — vendor-specific)
- Hardware design (TPUs, chips — beyond the chapter on infrastructure)
- The latest research papers (the field moves faster than any curriculum can)
- Specific business applications (each industry has its own patterns)

**What comes next for the field**:
- **Better reasoning** (test-time compute scaling; reasoning models)
- **Better agents** (more reliable, more capable, more autonomous)
- **Better safety** (interpretability scaling; alignment research)
- **Better efficiency** (smaller models with frontier capability)
- **Better integration** (LLMs as components in larger software systems)

**The reader has the foundation to follow any of these directions.**

**The closing thought** (one paragraph, written in voice for the chapter):

> Thirty chapters. From the first matrix multiplication to the last production agent. **You started with numpy and ended with systems that observe, think, act, and iterate at production scale.** The field will keep moving — new architectures, new capabilities, new failure modes, new disciplines. **What this curriculum gave you is the foundation to follow.** The transformer block is still the same matrix-multiplication-and-softmax it was in Ch 4. The agent loop is still the same observe-think-act it was in Ch 27. **The principles don't change as fast as the products.** When the next breakthrough lands — and it will — you'll be reading the paper with the substrate to understand it. **That's what this curriculum was for.** Now go build.

---

## Glossary

- **Agent benchmark**: a standardized set of tasks for evaluating agent systems
- **SWE-bench Verified**: curated 500-problem subset of SWE-bench; the de facto coding-agent benchmark
- **GAIA**: General AI Assistant benchmark with 3 difficulty levels
- **OSWorld**: desktop computer-use benchmark
- **τ-bench (TauBench)**: tool-use reliability benchmark using pass^k
- **BrowseComp**: web-browsing research benchmark
- **WebArena**: realistic web environment benchmark
- **pass^k**: probability of succeeding across k independent runs
- **Partial-credit scoring**: scoring sub-task milestones, not just final success
- **Cost-quality Pareto**: set of non-dominated (cost, quality) configurations
- **Regression monitoring**: detecting quality drops on a fixed dataset across versions
- **LangSmith**: observability platform from LangChain
- **Helicone**: cost-focused observability proxy
- **Braintrust**: evaluation-first LLM platform
- **OpenTelemetry GenAI**: standardized semantic conventions for LLM trace data
- **Canary deployment**: rolling out changes to small % of traffic first
- **A/B testing**: comparing two versions in parallel
- **Shadow deployment**: running new version without affecting users
- **Feature flag**: toggle for enabling/disabling features without code deploy
- **Staging environment**: production-like environment for pre-prod testing

---

## Pedagogical analogies

### 1. Agent eval as integration testing
Unit tests check individual functions; integration tests check whole systems. **LLM eval is unit testing; agent eval is integration testing.** The latter is harder because everything has to work together.

Best used for: section 1.

### 2. Cost-quality Pareto as production engineering
A web service trades latency for throughput; an agent trades cost for quality. **Both are engineering tradeoffs without a single correct answer.** The right point depends on the use case.

Best used for: section 4.

### 3. Production observability as flight-data recording (callback to Ch 28)
Aircraft have flight data recorders not because crashes are common but because **when they happen, the recording is the only diagnostic.** Agent observability is the same — essential when things break.

Best used for: section 5 (callback strengthens the curriculum's continuity).

### 4. Deployment patterns as canary mining (etymological note)
Canary deployment is named after coal miners who carried canaries to detect dangerous gases — the canary died before the miners did. **Modern canary deployment is the same idea**: roll out to a small subset first; detect problems before they affect everyone.

Best used for: section 6.

### 5. The curriculum's close as a graduation
**Thirty chapters from numpy to agents.** The closing chapter is the curriculum's graduation moment. **Honor it without sentimentality.** The reader earned this; now they go build.

Best used for: section 8.

---

## Common misconceptions

### MC1: "If the benchmark score is high, the agent is ready for production."
**Reality:** false. **Benchmarks measure narrow things; production requires the whole stack** — observability, safety, cost monitoring, deployment patterns, regression detection. **A 70% SWE-bench score doesn't mean ready for prod**; it means a starting point.

### MC2: "Higher accuracy is always better."
**Reality:** false in production. **Cost-quality tradeoffs are real.** A 70%-accurate agent at $0.05/task may be far better than an 85%-accurate agent at $0.50/task — depending on volume and tolerance. **Optimize the Pareto, not the single metric.**

### MC3: "Single-trial accuracy tells you reliability."
**Reality:** false. **Reliability is pass^k**, not pass^1. An 80% pass^1 agent may have a 40% pass^4. **τ-bench surfaced this gap empirically; ignore it at your peril.**

### MC4: "LLM-as-judge can replace human evaluation."
**Reality:** partially. **LLM-as-judge has known biases** (verbosity, position, recency — Ch 26). For coarse-grained eval at scale, it's useful; **for high-stakes decisions, human judgment is irreplaceable.**

### MC5: "Pick the observability platform with the most features."
**Reality:** misleading. **The right platform is the one your team will actually use.** Feature overload often correlates with under-adoption. **Match the platform to your team's needs**, not to the maximum feature checklist.

### MC6: "Deployment is just hosting."
**Reality:** false. **Production deployment requires** staging, canary, monitoring, alerting, rollback, on-call. **Skipping these is how agent projects go from working prototype to broken production system.** The readiness checklist exists for a reason.

### MC7: "Agent benchmarks predict production performance."
**Reality:** loosely. **Benchmarks correlate with production performance but don't predict it directly.** Your tasks differ from the benchmark's; your tools differ; your users differ. **Use benchmarks as a starting point, not a final answer.**

### MC8: "When the curriculum ends, the learning ends."
**Reality:** false — and intentionally so. **The curriculum was a foundation, not a destination.** The field moves fast; the principles in this curriculum equip the reader to follow it. **The closing thought of Ch 30: now go build.**

---

## Tricky implementation details

### TID1: Benchmark contamination
Older benchmarks may have leaked into training data. **Use newer benchmarks** (SWE-bench Verified, recent τ-bench versions) when possible. **Check whether the model was trained on the benchmark data** before trusting scores.

### TID2: Sandboxing for OSWorld and computer-use benchmarks
Agents that act on desktops can cause real damage. **Run benchmarks in isolated VMs or containers.** Anthropic's Computer Use docs emphasize this; reproducing benchmark results requires similar isolation.

### TID3: Cost accounting for multi-step agents
Per-call cost ≠ per-task cost. **Aggregate across the entire agent trajectory** to get per-task cost. **Cost-quality Pareto** requires per-task cost.

### TID4: Eval datasets need maintenance
Production agents drift; eval datasets must reflect current task distributions. **Refresh eval datasets quarterly** (or more often) for production systems.

### TID5: pass^k k selection
What's the right k? **k = 4-5 captures most variability** for typical agents. Higher k is more rigorous but more expensive. **τ-bench uses pass^4 as default.**

### TID6: Statistical significance for A/B tests
LLM outputs are stochastic; small samples can mislead. **Use proper statistical tests** (chi-square for binary outcomes; bootstrap for continuous). **Don't trust small-sample wins.**

### TID7: PII redaction in observability
Agent traces contain whatever the LLM saw — often including PII. **Redact before logging.** **Anthropic's evaluation tooling and OpenTelemetry conventions include PII-aware patterns.**

### TID8: Canary rollback latency
How fast can you roll back? **The faster, the safer.** Feature flags + canary deployments enable rollback in seconds; full deploy rollback can take hours. **For agent systems, prefer fast-rollback patterns.**

### TID9: Eval-prompt drift
Eval prompts can drift over time as you tune them. **Version eval prompts like code.** Compare against historical scores using the original prompt for fair comparison.

### TID10: Production benchmark interpretation
A 60% production benchmark score may be "great" or "terrible" depending on context. **Always compare to**: previous version score (regression); competitor score (positioning); human baseline (ceiling).

---

## Reference implementations

### Minimal pass^k evaluator

```python
# Pass^k evaluation: run a task k times; success rate across all k must succeed.

import random

def run_agent_on_task(task, seed=None):
    """
    Mock agent execution. Real version calls the agent and returns True/False
    based on whether the task succeeded.
    """
    if seed is not None:
        random.seed(seed)
    # Mock: ~75% pass^1 rate
    return random.random() < 0.75


def pass_at_k(task, k=4, n_trials=20):
    """
    Compute pass^k: probability that the agent succeeds in ALL k attempts.
    Run n_trials independent groups of k attempts; report mean success rate.
    """
    successes = 0
    for trial in range(n_trials):
        all_succeeded = all(run_agent_on_task(task, seed=trial * k + i) for i in range(k))
        if all_succeeded:
            successes += 1
    return successes / n_trials


# Compare pass^1 vs pass^4 vs pass^8
task = "Handle this customer-service scenario."

print(f"=== Reliability evaluation for: {task} ===\\n")
for k in [1, 4, 8]:
    rate = pass_at_k(task, k=k, n_trials=100)
    print(f"  pass^{k}: {rate:.0%}")

# Observations:
# - pass^1 captures single-trial accuracy (~75% in this mock)
# - pass^4 captures reliability across 4 attempts (~32% in this mock)
# - pass^8 captures reliability across 8 (~10% in this mock)
# - The gap between pass^1 and pass^k is what production deployments must worry about
# - τ-bench uses pass^4 as the headline metric
```

### Cost-quality Pareto frontier computation

```python
# Identify Pareto-optimal configurations on (cost, quality).

CONFIGS = [
    {'name': 'haiku-only',      'cost_per_task': 0.02, 'quality': 0.45},
    {'name': 'sonnet-only',     'cost_per_task': 0.15, 'quality': 0.68},
    {'name': 'opus-only',       'cost_per_task': 0.85, 'quality': 0.78},
    {'name': 'hybrid-haiku-sonnet', 'cost_per_task': 0.08, 'quality': 0.62},
    {'name': 'hybrid-sonnet-opus',  'cost_per_task': 0.35, 'quality': 0.75},
    # A dominated configuration (more expensive AND less accurate than hybrid):
    {'name': 'opus-bad-prompt', 'cost_per_task': 0.95, 'quality': 0.70},
]


def find_pareto_frontier(configs):
    """
    Return the subset of configs that are Pareto-optimal:
    not dominated by any other config (lower cost AND higher quality).
    """
    frontier = []
    for c in configs:
        dominated = False
        for other in configs:
            if other is c:
                continue
            # other dominates c if other has lower cost AND higher quality
            if other['cost_per_task'] <= c['cost_per_task'] and other['quality'] >= c['quality']:
                if other['cost_per_task'] < c['cost_per_task'] or other['quality'] > c['quality']:
                    dominated = True
                    break
        if not dominated:
            frontier.append(c)
    return frontier


frontier = find_pareto_frontier(CONFIGS)

print("=== All configurations ===")
for c in CONFIGS:
    print(f"  {c['name']:<25} cost=${c['cost_per_task']:.3f}  quality={c['quality']:.0%}")

print("\\n=== Pareto-optimal (non-dominated) ===")
for c in sorted(frontier, key=lambda x: x['cost_per_task']):
    print(f"  ✓ {c['name']:<25} cost=${c['cost_per_task']:.3f}  quality={c['quality']:.0%}")

# Observations:
# - 'opus-bad-prompt' is dominated by 'opus-only' (more expensive, lower quality)
# - All other configs are non-dominated — meaningful choices
# - Production picks a point on the Pareto frontier based on cost budget + quality floor
# - Dominated configurations are NEVER the right choice
```

### Regression monitoring scaffold

```python
# Compare current vs baseline on a fixed dataset; alert on regressions.

BASELINE_SCORES = {
    'task_lookup':       0.92,
    'task_summarize':    0.85,
    'task_code_review':  0.71,
    'task_math':         0.65,
}


def score_current_version(task_name):
    """Mock: in production, runs the current agent against the labeled dataset."""
    # Simulate small drift + occasional regression
    import random
    random.seed(hash(task_name) % 1000)
    drift = random.uniform(-0.05, 0.05)
    # Inject a regression on 'task_math'
    if task_name == 'task_math':
        return BASELINE_SCORES[task_name] - 0.15  # significant regression
    return BASELINE_SCORES[task_name] + drift


def check_regressions(baseline, regression_threshold=0.05):
    """Compare current scores against baseline; flag drops > threshold."""
    print("=== Regression check ===\\n")
    regressions = []
    for task, baseline_score in baseline.items():
        current = score_current_version(task)
        delta = current - baseline_score
        marker = '🚨' if delta < -regression_threshold else '✓ '
        print(f"  {marker} {task:<22} baseline={baseline_score:.0%}  current={current:.0%}  Δ={delta:+.0%}")
        if delta < -regression_threshold:
            regressions.append({'task': task, 'delta': delta})
    
    print()
    if regressions:
        print(f"⚠️  {len(regressions)} regression(s) detected — BLOCK deployment")
        for r in regressions:
            print(f"   {r['task']}: {r['delta']:+.0%}")
    else:
        print("✓ All tasks pass regression check — OK to deploy")
    
    return regressions


regressions = check_regressions(BASELINE_SCORES)

# Observations:
# - Regression monitoring catches quality drops that benchmarks alone miss
# - Threshold (5%) is a tunable parameter — too tight = false alarms; too loose = misses
# - 'task_math' regressed 15% — flagged
# - Production CI/CD blocks deployments with significant regressions
# - This is the production-eval workhorse
```

---

## Connections to other chapters

- **Ch 26 (Evaluation)**: discipline; LLM benchmarks; LLM-as-judge — this chapter extends to agents
- **Ch 28 (Agents from scratch)**: observability — trace flame graph widget; structured logging
- **Ch 24 (Safety)**: safety evaluation; sandboxing
- **Ch 19 (Sampling)**: temperature affects agent reliability; relevant to pass^k
- **Ch 27 (Agent foundations)**: agent loop being evaluated
- **Ch 29 (Multi-agent)**: multi-agent evaluation is harder still (emergent behaviors evade per-step metrics)
- **All prior chapters**: the curriculum's close in section 8 references every layer

---

## Open questions for the chapter author

### Q1: How much detail on specific benchmarks?
**Recommendation:** moderate. **Each benchmark gets a paragraph in section 2** with state-of-the-art numbers and what makes it useful. **Don't tutorial any single benchmark** in depth — readers will go to the source for that.

### Q2: How much production-deployment detail?
**Recommendation:** practical-checklist-level. **Section 6's readiness checklist is the takeaway**; the prose contextualizes it. **Don't deep-dive any single deployment pattern** — readers know enough engineering to apply the patterns.

### Q3: How to handle the curriculum's close?
**Recommendation:** earned, not performative. **Section 8 should honor the journey** without being maudlin. **The closing thought paragraph** (the one referenced above) is the curriculum's signature moment — write with care. **A reader who reaches it should feel: respected, equipped, sent off well.**

### Q4: Widget candidates
1. **Agent Benchmark Explorer (marquee 1):** show 5 agent benchmarks side-by-side (SWE-bench, GAIA, OSWorld, τ-bench, BrowseComp) with state-of-the-art numbers, characteristics, and example tasks. **Like Ch 26's Benchmark Heatmap but specifically for agent benchmarks.** **Recommended as marquee 1.**

2. **Framework Picker (marquee 2):** interactive selector across 4-5 observability frameworks (LangSmith, Helicone, Braintrust, OpenTelemetry, custom) — reader selects task characteristics; widget recommends framework with reasoning. **Recommended as marquee 2.**

Recommend both.

### Q5: How to handle "what comes next" in the field?
**Recommendation:** brief and honest. **Section 8 includes a "what comes next for the field" paragraph** — better reasoning, better agents, better safety, better efficiency. **Don't predict specifics**; the closing thought is that the reader has the foundation to follow whatever happens next.

---

## Pre-research notes

**Chapter cadence:** Ch 30 is a **two-topic chapter** (evaluation + frameworks/deployment). Uses the **5-file cadence**.

Planned file layout:
- File 167: research (this)
- File 168: page structure (~900 lines, 8 sections; runnables embedded)
- File 169: Agent Benchmark Explorer marquee widget 1
- File 170: Framework Picker marquee widget 2
- File 171: **exercises + closeout + status: published + CURRICULUM COMPLETE**

**Pedagogical outcomes for the reader.** After Ch 30, the reader should be able to:
1. Articulate why agent evaluation is structurally harder than LLM evaluation
2. Name and characterize the 2025 agent benchmark landscape (SWE-bench, GAIA, OSWorld, τ-bench, BrowseComp)
3. Apply evaluation methodologies (pass^k, partial credit, cost-quality Pareto, human-judged)
4. Compute and interpret cost-quality Pareto frontiers
5. Pick a production observability framework based on stack + needs
6. Apply deployment patterns (staging, canary, A/B, shadow, feature flags)
7. Use a production-readiness checklist to evaluate agent deployments
8. **Look back across the curriculum and articulate the journey from numpy primitives to agent systems**

Eight outcomes. Exercises hit outcomes 3, 4, 5, 7. Outcome 8 is met by the curriculum's close itself.

**Tonal framing**: discipline applied to composition. Mirror to Ch 26 (discipline applied to capability). **The closing section honors the journey without sentimentality.**

**The curriculum's close**: section 8 is the curriculum's signature moment. **Write it with care.** Acknowledge what the reader has earned; honor the journey from Ch 1 to Ch 30; be honest about what's not covered; point forward without predicting. **End with "now go build."**

**Importance**: this chapter is THE FINAL CHAPTER. It has dual responsibility — substantive chapter content AND curriculum close. **The closing section is the most important paragraph in the entire curriculum** for tone and lasting impression. **The reader's final memory of this curriculum** is shaped by this section.
