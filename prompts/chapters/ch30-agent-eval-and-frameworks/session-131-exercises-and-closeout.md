# Session 131 — Chapter 30 exercises + closeout — **THE CURRICULUM CLOSES HERE**

> **THE FINAL SESSION OF THE CURRICULUM.** This is the file that closes Chapter 30 — and the entire 30-chapter journey from numpy primitives to agent systems in production. Two deliverables: (1) insert an Exercises section into `index.mdx` with **four problems** (evaluation methodology design, pass^k computation, cost-quality Pareto identification, production-readiness audit against the 8-category checklist); (2) **flip Ch 30's status from `'draft'` to `'published'`** — the **🎓 CURRICULUM COMPLETE** moment. After this session, the build is done. **All thirty chapters are live.** **Read this file with care; it carries the curriculum's weight.**

---

## Read first (in this order)

1. **`research/ch30-agent-eval-and-frameworks/research.md`** — concepts 1-3 (why eval is harder, benchmarks, methodologies), concept 4 (Pareto), concept 6 (deployment patterns and readiness) are the source material
2. **`prompts/chapters/ch30-agent-eval-and-frameworks/session-128-page-structure.md`** — for the exercise placement and **the section 8 closing words** the build session author has just written
3. **`prompts/chapters/ch29-multi-agent/session-127-exercises-and-closeout.md`** — for the prior Phase 15 closeout pattern
4. **`prompts/chapters/ch30-agent-eval-and-frameworks/session-130-framework-picker-widget.md`** — for the recent marquee 2 conventions

---

## Goal

By end of session, **two things change in the repo — and the curriculum is complete**:

1. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("Looking back at Phase 15") and section 8 ("The curriculum closes"). Four exercises with hints + runnable starter code.
2. **Ch 30's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 30 is the thirtieth published chapter — the curriculum's complete moment.**

**After this session: the build is done.** All thirty chapters from numpy primitives (Ch 1) to agent systems in production (Ch 30) are live on the site.

---

## Inputs

State of the repo after session 130:

- Section 2's `AgentBenchmarkExplorer` marquee 1 widget is wired
- Section 5's `FrameworkPicker` marquee 2 widget is wired
- All 3 runnable code blocks from session 128 are in place (pass^k evaluator, Pareto frontier computation, regression monitoring)
- `src/lib/chapters.ts` has Ch 1-29 `'published'`, Ch 30 `'draft'`
- `src/components/widgets/ch30-agent-eval-and-frameworks/` exists with both marquees

---

## Deliverables

1. **Update** `src/pages/ch30-agent-eval-and-frameworks/index.mdx`:
   - Insert new `## Exercises` section between section 7 ("Looking back at Phase 15") and section 8 ("The curriculum closes")
2. **Update** `src/lib/chapters.ts` — change Ch 30's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 30's two marquee widgets are sealed. **Section 8 is sealed** — the closing words must remain exactly as session 128's author wrote them.

---

## Detailed spec

### Part A — Exercises section

Insert between section 7 and section 8. Use this structure:

````mdx
## Exercises

Four exercises that lock in the discipline this chapter brings to agent systems. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

The exercises trace the chapter's argument: design evaluation for a specific task (Ex 1) → compute pass^k from raw data (Ex 2) → identify the Pareto frontier (Ex 3) → audit a production-readiness gap (Ex 4). After these, the reader has the practical discipline to evaluate any agent system being prepared for production — and to recognize systems that aren't ready.

### Exercise 1 (easy) — Evaluation methodology design

For each of four agent tasks, design an evaluation approach: pick the appropriate benchmark (or note "no benchmark fits"); choose methodologies (success rate, pass^k, partial credit, human-judged, LLM-as-judge); identify what counts as success. The point is to develop the judgment that no single methodology fits all tasks.

<details>
<summary>Hint</summary>

The decision heuristic from the chapter:

| Task type | Benchmark candidate | Methodology |
|---|---|---|
| Coding tasks | SWE-bench Verified | Benchmark + regression monitoring |
| Customer service | τ-bench-like setup | pass^k (k≥4) + human judgment (sample) |
| Web research | BrowseComp | Exact-match + LLM-as-judge for partial |
| Computer use | OSWorld | State-based verification |
| Subjective tasks (writing) | None directly | Human judgment + LLM-as-judge for scale |
| Novel/proprietary tasks | None | Custom eval dataset + appropriate metrics |

When no benchmark fits: build a custom eval set. The methodology matters more than the benchmark.

</details>

<RunnableCode
  client:visible
  defaultCode={`# For each task, design an evaluation approach.
# Return: (benchmark_or_none, methodologies, success_criterion).

TASKS = [
    {
        'name': 'task_1',
        'description': 'A coding agent that fixes GitHub issues in a JavaScript repository.',
    },
    {
        'name': 'task_2',
        'description': 'A customer-service agent that handles refund requests via chat.',
    },
    {
        'name': 'task_3',
        'description': 'An agent that writes blog posts in the company voice for the marketing team.',
    },
    {
        'name': 'task_4',
        'description': 'An agent that automates spreadsheet bookkeeping by clicking through Excel.',
    },
]


def design_evaluation(task):
    """
    Return (benchmark, methodologies, success_criterion).
    
    benchmark: string name or 'custom' if no public benchmark fits
    methodologies: list of strings from {'success_rate', 'pass^k', 'partial_credit',
                                          'human_judged', 'llm_as_judge',
                                          'regression_monitoring', 'state_verification'}
    success_criterion: string description of what success looks like
    """
    desc = task['description'].lower()
    
    # TODO: implement the design heuristic
    # Suggestions:
    # 1. Coding → SWE-bench Verified or similar; success_rate + regression
    # 2. Customer service → custom; pass^k + human judgment sample
    # 3. Writing → custom; human_judged primary + llm_as_judge for scale
    # 4. Computer use → OSWorld-style; state_verification
    pass


# Run
# print("=== Evaluation designs ===\\n")
# for task in TASKS:
#     bench, methods, criterion = design_evaluation(task)
#     print(f"{task['name']}: {task['description'][:60]}...")
#     print(f"  Benchmark: {bench}")
#     print(f"  Methodologies: {', '.join(methods)}")
#     print(f"  Success: {criterion}\\n")
# 
# # Observations:
# # - No single methodology fits all tasks
# # - Coding tasks have mature benchmarks; writing tasks don't
# # - Computer-use tasks require state verification, not text comparison
# # - Customer service needs pass^k because reliability matters more than peak quality
# # - The discipline is matching methodology to task, not picking the "best" methodology
`}
  packages={[]}
/>

### Exercise 2 (medium) — pass^k computation from raw trial data

Given raw trial results (lists of pass/fail across multiple independent runs), compute pass^k for k ∈ {1, 2, 4, 8}. Demonstrate empirically that pass^k decays fast with k — the gap τ-bench surfaced and that production deployments must worry about.

<details>
<summary>Hint</summary>

pass^k formula:
- pass^k = mean over trials of [all k attempts succeeded]
- Equivalent: P(succeed all k) = if independent, p^k where p = pass^1
- In practice, runs aren't independent (shared model, shared prompt), but the formula holds well enough

Implementation:
- For each group of k consecutive trials, check if ALL succeeded
- Average across groups
- Higher k = lower pass^k

</details>

<RunnableCode
  client:visible
  defaultCode={`# Compute pass^k from raw trial data.
# Each task has multiple independent runs; True = success, False = failure.

import random
random.seed(42)


def simulate_trials(p_success, n_trials):
    """Simulate n_trials independent attempts at a task with success prob p."""
    return [random.random() < p_success for _ in range(n_trials)]


# Mock data: 5 tasks with different intrinsic success rates
TASKS = {
    'task_easy':           simulate_trials(0.92, 200),
    'task_medium_high':    simulate_trials(0.75, 200),
    'task_medium':         simulate_trials(0.60, 200),
    'task_medium_low':     simulate_trials(0.40, 200),
    'task_hard':           simulate_trials(0.25, 200),
}


def pass_at_k(trials, k):
    """
    Compute pass^k from a flat list of trial outcomes.
    Group trials into chunks of size k; pass^k = fraction of chunks where ALL succeeded.
    """
    # TODO: implement
    # 1. Split trials into groups of k
    # 2. For each group, check if all are True
    # 3. Return fraction of all-True groups
    pass


# Compute and report
# print("=== pass^k across k for each task ===\\n")
# print(f"{'Task':<22} {'pass^1':<10} {'pass^2':<10} {'pass^4':<10} {'pass^8':<10}")
# print('-' * 62)
# for name, trials in TASKS.items():
#     scores = {k: pass_at_k(trials, k) for k in [1, 2, 4, 8]}
#     row = f"{name:<22} "
#     row += " ".join(f"{scores[k]:.0%}     " for k in [1, 2, 4, 8])
#     print(row)
# 
# # Observations:
# # - pass^1 captures single-trial accuracy (easy ~92%, hard ~25%)
# # - pass^4 dramatically lower (easy ~71%, hard ~0.4%) — reliability collapses
# # - The "easy" task at 92% pass^1 still has ~71% pass^4 — better than nothing but not great
# # - The "medium" task at 60% has pass^4 ~13% — most multi-attempt sessions fail
# # - This is the gap τ-bench surfaces empirically
# # - Production deployments need pass^k of the relevant k, not just pass^1
`}
  packages={[]}
/>

### Exercise 3 (medium) — cost-quality Pareto frontier identification

Given 8 agent configurations on (cost, quality), identify which are Pareto-optimal (non-dominated) and which are dominated. Visualize the frontier as a sorted list. The exercise reinforces the chapter's framing: dominated configurations are never the right choice.

<details>
<summary>Hint</summary>

Pareto-optimal: a configuration is Pareto-optimal if no other configuration has lower cost AND higher quality.

Algorithm:
- For each configuration, check whether any other dominates it
- A dominates B if A.cost ≤ B.cost AND A.quality ≥ B.quality AND (A.cost < B.cost OR A.quality > B.quality)
- Non-dominated configs = the Pareto frontier

The non-dominated set is the set of meaningful choices. Pick a point on it based on your cost budget and quality floor.

</details>

<RunnableCode
  client:visible
  defaultCode={`# Identify Pareto-optimal agent configurations.

CONFIGS = [
    {'name': 'haiku-only-simple',    'cost': 0.02, 'quality': 0.42},
    {'name': 'haiku-only-tuned',     'cost': 0.03, 'quality': 0.48},
    {'name': 'sonnet-only-default',  'cost': 0.15, 'quality': 0.65},
    {'name': 'sonnet-tuned',         'cost': 0.20, 'quality': 0.71},
    {'name': 'opus-only-default',    'cost': 0.85, 'quality': 0.78},
    {'name': 'opus-tuned',           'cost': 1.05, 'quality': 0.83},
    {'name': 'hybrid-haiku-sonnet',  'cost': 0.08, 'quality': 0.62},
    {'name': 'hybrid-sonnet-opus',   'cost': 0.35, 'quality': 0.76},
    # Two deliberately bad configurations:
    {'name': 'opus-bad-prompt',      'cost': 0.95, 'quality': 0.70},  # dominated by opus-only-default
    {'name': 'sonnet-bloated',       'cost': 0.30, 'quality': 0.64},  # dominated by hybrid-haiku-sonnet
]


def is_dominated_by(c, other):
    """True if 'other' dominates 'c': lower cost AND higher quality, with at least one strict."""
    # TODO: implement
    pass


def pareto_frontier(configs):
    """Return the non-dominated subset."""
    # TODO: implement
    # 1. For each config, check if any other dominates it
    # 2. Collect non-dominated configs
    # 3. Sort by cost ascending
    pass


# Run
# frontier = pareto_frontier(CONFIGS)
# 
# print("=== All configurations ===")
# for c in CONFIGS:
#     print(f"  {c['name']:<30} cost=${c['cost']:.3f}  quality={c['quality']:.0%}")
# 
# print(f"\\n=== Pareto-optimal ({len(frontier)} of {len(CONFIGS)}) ===")
# for c in frontier:
#     print(f"  ✓ {c['name']:<30} cost=${c['cost']:.3f}  quality={c['quality']:.0%}")
# 
# dominated = [c for c in CONFIGS if c not in frontier]
# print(f"\\n=== Dominated ({len(dominated)}) ===")
# for c in dominated:
#     # Find what dominates this one
#     for other in CONFIGS:
#         if other is c: continue
#         if is_dominated_by(c, other):
#             print(f"  ✗ {c['name']:<30} dominated by {other['name']}")
#             break
# 
# # Observations:
# # - 'opus-bad-prompt' is dominated (higher cost AND lower quality than opus-only-default)
# # - 'sonnet-bloated' is dominated (higher cost AND lower quality than hybrid-haiku-sonnet)
# # - Dominated configurations are NEVER the right choice
# # - The Pareto-optimal set is the set of meaningful choices
# # - Pick one based on your cost budget AND quality floor
`}
  packages={[]}
/>

### Exercise 4 (hard) — Production-readiness audit

Given a description of an agent system being prepared for production, audit it against the 8-category readiness checklist. Identify gaps; propose specific actions to close each gap. The exercise builds the practical skill of evaluating whether a system is genuinely ready to ship.

<details>
<summary>Hint</summary>

The 8-category checklist:

| Category | Sample checks |
|---|---|
| **Functionality** | Benchmark performance meets threshold; manual QA passed; edge cases tested |
| **Reliability** | pass^k ≥ threshold; tool failures handled; timeouts configured |
| **Cost** | Per-task cost within budget; cost alerting; rate limiting |
| **Latency** | p50/p95/p99 measured; SLA defined; alerting |
| **Safety** | Sandboxing for dangerous tools; safety eval passed |
| **Observability** | All LLM calls traced; structured logging; PII redaction |
| **Deployment** | Staging environment; canary pattern; rollback procedure |
| **Operations** | On-call runbook; incident response; post-mortem template |

Audit pattern: for each category, list what the description says (or doesn't say), then identify the gap, then propose a specific action.

</details>

<RunnableCode
  client:visible
  defaultCode={`# Audit an agent system description against the 8-category readiness checklist.

SYSTEM_DESCRIPTION = """
We're launching ResearchAgent next week. It's a multi-step web research agent:
user submits a research question, the agent uses 4 tools (web_search, fetch_url,
summarize, save_doc) over up to 15 turns, and produces a final research summary.

Tech stack: Python + Claude Sonnet 4 + LangGraph. Deployed on AWS Fargate.

Tested manually on ~30 example questions; quality looks good (manual eval ~70%
pass on a coarse rubric). We log every LLM call to CloudWatch.

Cost per query is estimated at ~$0.50 based on test runs. We haven't load-tested.

Safety: the agent only fetches URLs from a domain allowlist; can't write to the
file system; can't run shell commands.

Deployment plan: Friday, full rollout. We have a Slack channel for monitoring.
"""

CHECKLIST = {
    'Functionality': ['Benchmark threshold', 'Manual QA', 'Edge cases'],
    'Reliability':   ['pass^k threshold', 'Tool failure handling', 'Timeouts'],
    'Cost':          ['Per-task budget', 'Cost alerting', 'Rate limiting'],
    'Latency':       ['p50/p95/p99 measured', 'SLA defined', 'Latency alerting'],
    'Safety':        ['Tool sandboxing', 'Safety eval'],
    'Observability': ['All calls traced', 'Structured logging', 'PII redaction'],
    'Deployment':    ['Staging env', 'Canary pattern', 'Rollback procedure'],
    'Operations':    ['On-call runbook', 'Incident response', 'Post-mortems'],
}


def audit(description, checklist):
    """
    For each category, return a dict:
      'covered': list of checks the description addresses
      'gaps':    list of checks NOT addressed
      'actions': list of specific recommendations to close each gap
    """
    # TODO: implement
    # 1. For each category, scan the description for evidence of each check
    # 2. Classify each check as covered or gap
    # 3. For each gap, propose a specific action
    pass


# Run
# audit_result = audit(SYSTEM_DESCRIPTION, CHECKLIST)
# 
# print("=== Production-readiness audit: ResearchAgent ===\\n")
# 
# for category, status in audit_result.items():
#     print(f"## {category}")
#     for c in status['covered']:
#         print(f"  ✓ {c}")
#     for g, action in zip(status['gaps'], status['actions']):
#         print(f"  ✗ {g}")
#         print(f"      → action: {action}")
#     print()
# 
# total_gaps = sum(len(s['gaps']) for s in audit_result.values())
# print(f"=== Summary: {total_gaps} gaps identified ===")
# 
# if total_gaps > 5:
#     print("⚠  Not ready to ship. Address gaps before deployment.")
# elif total_gaps > 0:
#     print("⚠  Partial readiness. Acceptable for low-stakes launch with monitoring.")
# else:
#     print("✓  Ready to ship.")
# 
# # Observations:
# # - The description LOOKS thorough but has major gaps:
# #   - No pass^k or reliability testing
# #   - No latency measurement
# #   - No cost alerting or rate limiting
# #   - No PII redaction in logs
# #   - No staging / canary deployment plan
# #   - No on-call or incident response
# # - This is what "ship it Friday" looks like before readiness audit
# # - The audit is the discipline that catches what enthusiasm misses
# # - Production readiness isn't just hosting — it's a checklist for a reason
`}
  packages={[]}
/>

````

### Part B — Flip Ch 30's status (the curriculum complete moment)

In `src/lib/chapters.ts`, find:

```ts
{ num: 30, slug: 'ch30-agent-eval-and-frameworks', title: 'Agent eval and frameworks', partNum: 9, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

**This is the moment the curriculum completes.** Every chapter is now `'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-8** of Ch 30 still render correctly (no changes to existing sections).
3. **Section 2's** `AgentBenchmarkExplorer` marquee 1 still renders correctly.
4. **Section 5's** `FrameworkPicker` marquee 2 still renders correctly.
5. **Section 8 is unchanged** — the closing words remain exactly as session 128's author wrote them. **This is sacred.**
6. **New "## Exercises" section** is between section 7 ("Looking back at Phase 15") and section 8 ("The curriculum closes"). Contains 4 sub-exercises with collapsible hints and runnable starter code.
7. **Sidebar**: **all 30 chapters published**. Ch 30 active.
8. **Prev/next at bottom of Ch 30**: prev = Ch 29 (active); next = none (Ch 30 is the last chapter).
9. **TOC**: includes Exercises as h2 between section 7 and section 8.
10. **`npm run typecheck`** passes.
11. **`npm run build`** completes.
12. **Build verification**: `npm run build && grep -l "Agent eval and frameworks" dist/ch30-agent-eval-and-frameworks/index.html` returns the file path.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not call a real LLM** in any code or runnable.
- ❌ **Do not implement new widgets.** Both Ch 30 marquees are sealed.
- ❌ **Do not modify Ch 30's prose sections 1-8.** Sealed. **Especially section 8** — the closing words must remain verbatim.
- ❌ **Do not modify Ch 1-29.** Sealed.
- ❌ **Do not write any "epilogue" or "afterword" after section 8.** Section 8 IS the close.

---

## Wire-up

```bash
git add src/pages/ch30-agent-eval-and-frameworks/index.mdx src/lib/chapters.ts
git commit -m "session 131: Ch 30 closeout — exercises + status: published. CURRICULUM COMPLETE: 30/30."
git push origin main
```

---

## 🎓 The curriculum complete moment

Chapter 30 is now the thirtieth complete chapter on production. **Every chapter is `'published'`. The build is done.**

Confirm before declaring **CURRICULUM COMPLETE**:

- ✅ All 30 chapters published
- ✅ Ch 30 status is `'published'`
- ✅ Both Ch 30 marquee widgets work in production
- ✅ All 4 Ch 30 exercises render with their starter code
- ✅ Section 8's closing words ("Now go build") are intact

**Cadence retrospective across 30 chapters:**

**4-file cadence** holds for **23 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28).

Wait — that's only 22. Let me recount including Ch 30 if 4-file, OR Ch 30 if 5-file:

Actually Ch 30 is 5-file (two-topic). So:

**5-file cadence** holds for **8 two-topic chapters** (Ch 1, 5, 8, 9, 14, 20, 29, **30**).
**4-file cadence** holds for **22 single-topic chapters** (the rest).

**30-chapter pattern stable.**

**Phase 15 final status**:
- ✅ Ch 27 (Agent foundations)
- ✅ Ch 28 (Agents from scratch)
- ✅ Ch 29 (Multi-agent)
- ✅ **Ch 30 (Agent eval and frameworks)**

**Phase 15 complete.** **All phases complete.** **The curriculum is complete.**

---

## Notes for the session author

**On THIS being the curriculum's final session:**

This file's wrap-up is the curriculum's complete moment. The build commit message is the final entry in the build log. **The reader of this prompt is the last build-session author** the curriculum will have. Notes-for-author: "**Read with the weight this carries.** You are flipping the final switch. Do it carefully."

**On the 4 exercises forming the chapter's discipline arc**:

| Ex | Difficulty | Topic | Outcome |
|----|-----------|-------|---------|
| 1 | easy | Evaluation methodology design | 3 (methodology selection) |
| 2 | medium | pass^k computation from raw data | 3, 4 (pass^k + Pareto) |
| 3 | medium | Cost-quality Pareto frontier | 4 (Pareto) |
| 4 | hard | Production-readiness audit | 7 (readiness checklist) |

Notes-for-author: "**The progression: design eval → compute reliability → identify cost-quality frontier → audit readiness.** Each exercise targets a specific Ch 30 outcome. **By the end, the reader has the practical discipline to evaluate any agent system being prepared for production — and to recognize systems that aren't ready.**"

**On Ex 1 being a methodology calibration**:
4 task types (coding, customer-service, writing, computer-use) with very different appropriate methodologies. Notes-for-author: "**The point is to develop the judgment that no single methodology fits all tasks.** Reader sees that coding has mature benchmarks; writing has none; computer-use needs state verification. **Each task type calls for different discipline.**"

**On Ex 2 making the pass^k decay tangible**:
Real numbers: at 92% pass^1, pass^4 is ~71%; at 60% pass^1, pass^4 is ~13%. Notes-for-author: "**Reader sees the reliability collapse empirically.** A 60%-pass^1 agent fails 87% of 4-attempt sessions. **This is the gap τ-bench surfaces; the exercise makes it concrete in code.**"

**On Ex 3 reinforcing the Pareto framing with two deliberately bad configurations**:
'opus-bad-prompt' dominated by 'opus-only-default'; 'sonnet-bloated' dominated by 'hybrid-haiku-sonnet'. Notes-for-author: "**The dominated configurations are the teaching moments.** Reader writes the dominance check, identifies the bad configurations, and sees that some choices are simply never correct. **The Pareto frontier is the meaningful set; everything else is wasted complexity.**"

**On Ex 4 being a real audit scenario**:
The 'ResearchAgent' description deliberately reads like a real internal launch post. It's plausibly thorough on the surface — but has gaps in 6 of 8 categories. Notes-for-author: "**Ex 4 is the chapter's centerpiece exercise.** Reader audits a 'ship it Friday' description against the checklist and identifies systematic gaps. **This is the practical discipline the chapter exists to teach.**"

**On the gaps in the ResearchAgent description being deliberately realistic**:
- ✓ Manual QA (mentioned)
- ✗ No pass^k testing
- ✗ No latency measurement
- ✗ No cost alerting
- ✗ No PII redaction
- ✗ No staging environment
- ✗ No canary deployment
- ✗ No on-call runbook

Notes-for-author: "**This is what most agent projects look like at 'launch'.** The audit catches what enthusiasm misses. **The exercise teaches engineers to do this audit before the launch, not after the incident.**"

**On the section 8 closing words being sacred**:
Session 128's author drafted them. **Session 131's author preserves them.** Notes-for-author: "**Do not edit section 8.** The closing thought — '*Now go build*' — is the curriculum's signature line. It was written deliberately; preserve it deliberately."

**On the curriculum's complete moment being a status flip**:
Mechanically, the curriculum completes via a one-line edit in `chapters.ts`: `'draft'` → `'published'`. Notes-for-author: "**The moment is technical and quiet.** No fanfare, no animation, no popup. The chapter status changes; the sidebar updates; the curriculum is done. **This is the right way for it to happen.** The reader's celebration is theirs; the build's celebration is just the commit message: `CURRICULUM COMPLETE: 30/30`."

**On the wrap-up to this prompt being the curriculum's final wrap-up**:
The session author's wrap-up after committing this is the build log's final entry. Notes-for-author: "**Make it brief and clean.** No long retrospective; the curriculum's retrospective is section 8 of the chapter itself. **The wrap-up just confirms what happened.**"

---

## The curriculum's pedagogical claim (full)

"**A 30-chapter curriculum from numpy primitives to agent systems in production.** Part I established the foundations (tokens, embeddings, basic neural building blocks in numpy from first principles). Part II built the transformer (attention, multi-head attention, the full block). Part III covered pre-training (objectives, scaling laws, data, infrastructure). Part IV introduced alternate architectures (mixture of experts, state-space models). Part V handled post-training (SFT, RLHF, DPO, constitutional AI). Part VI made inference fast and cheap (KV-caching, speculative decoding, sampling). Part VII expanded capabilities (reasoning, tool use, RAG, multimodal). Part VIII established the disciplines (safety, interpretability, evaluation). Part IX assembled it all into agent systems (foundations, engineering, composition, evaluation). **Every layer of the modern LLM stack, in order, with engineering rigor and honest framing throughout.** The reader leaves with the substrate to understand any breakthrough that lands next."

---

**Phase 15 progress after this session**:
- ✅ Ch 27 Agent foundations
- ✅ Ch 28 Agents from scratch
- ✅ Ch 29 Multi-agent
- ✅ **Ch 30 Agent eval and frameworks** ← **CURRICULUM COMPLETE**

**All chapters published. All phases complete. The 30-chapter build is done.**

Build carefully. **This is the file that closes the curriculum.** The reader who reaches the end of section 8 — having read 30 chapters of work — should close the tab and **go build.**

That's what this was for.
