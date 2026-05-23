# Session 127 — Ch 29 exercises + closeout

> **The Chapter 29 closeout — the file that completes the multi-agent chapter.** Two deliverables: (1) add an **Exercises section** with 4 problems (architecture choice classifier, proposer-critic-judge implementation, anti-pattern audit and refactor, framework selection by scenario); (2) flip Ch 29's status from `'draft'` to `'published'`. **Closes Ch 29.** Phase 15 status: **three of four chapters published.** **Ch 30 (Agent eval and frameworks)** opens next — the final chapter, which closes the curriculum.

This is a **two-topic chapter** (5-file cadence). Both marquee widgets were implemented in sessions 125 and 126; this closeout is exercises + status flip only. No additional widget is needed. **File 165 is the file that closes Chapter 29.**

---

## Read first (in this order)

1. **`research/ch29-multi-agent/research.md`** — concepts 1 (when multi-agent), 4 (role specialization), 5 (frameworks), 7 (when NOT to use multi-agent) are the source material
2. **`prompts/chapters/ch29-multi-agent/session-124-page-structure.md`** — for the exercise placement
3. **`prompts/chapters/ch28-agent-from-scratch/session-123-agent-trace-inspector-and-exercises-and-closeout.md`** — for the recent Phase 15 closeout pattern
4. **`prompts/chapters/ch29-multi-agent/session-126-inter-agent-conversation-viewer-widget.md`** — for the recent marquee 2 conventions (the degenerate scenario this chapter relies on for exercise 3)

---

## Goal

By end of session, two things change in the repo:

1. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("The honest assessment — when NOT to use multi-agent") and section 8 ("One chapter remains"). Four exercises with hints + runnable starter code.
2. **Ch 29's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 29 is the twenty-ninth published chapter — and the third of Phase 15.**

After this session: **Ch 29 is complete. Phase 15 has its third published chapter.** **Ch 30 (Agent eval and frameworks)** opens next — the final chapter, which closes the curriculum.

---

## Inputs

State of the repo after session 126:

- Section 2's `MultiAgentTopologyExplorer` marquee 1 widget is wired
- Section 4's `InterAgentConversationViewer` marquee 2 widget is wired
- All 3 runnable code blocks from session 124 are in place (manager-worker setup, proposer-critic-judge, honest comparison)
- `src/lib/chapters.ts` has Ch 1-28 `'published'`, Ch 29 `'draft'`, Ch 30 `'planned'`
- `src/components/widgets/ch29-multi-agent/` exists with both marquees

---

## Deliverables

1. **Update** `src/pages/ch29-multi-agent/index.mdx`:
   - Insert new `## Exercises` section between section 7 ("The honest assessment — when NOT to use multi-agent") and section 8 ("One chapter remains")
2. **Update** `src/lib/chapters.ts` — change Ch 29's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 29's two marquee widgets are sealed.

---

## Detailed spec

### Part A — Exercises section

Insert between section 7 and section 8. Use this structure:

````mdx
## Exercises

Four exercises that lock in the multi-agent calibration. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

The exercises trace the chapter's argument: classify when multi-agent is warranted (Ex 1) → implement a well-designed multi-agent pattern (Ex 2) → audit a degenerate design and refactor (Ex 3) → pick a production framework (Ex 4). After these, the reader has the practical judgment to evaluate any multi-agent proposal.

### Exercise 1 (easy) — Architecture choice classifier

For each of five tasks, decide whether single-agent or multi-agent is the better choice and justify briefly. The heuristic: multi-agent earns its place when there's genuine role specialization, adversarial dynamics, long-horizon collaboration, or true parallelism. Otherwise: single-agent.

<details>
<summary>Hint</summary>

The decision heuristic from the chapter:

| Signal in the task | Recommended architecture |
|---|---|
| "Look up X, do Y, report Z" | Single-agent (one ReAct loop) |
| "Verifiable correctness; LLM unreliable as generator" | Proposer-critic-judge |
| "Decompose into specialized roles (research + write + edit)" | Manager-worker |
| "Truly parallel subtasks (compare N independent options)" | Manager-worker (parallel) |
| "Adversarial review needed (debate, peer review)" | Peer-to-peer or proposer-critic-judge |
| "Simple summarization, classification, single lookup" | Single-agent |

When uncertain: default to single-agent. The cost of "wrongly chose single-agent" is much lower than "wrongly chose multi-agent."

</details>

<RunnableCode
  client:visible
  defaultCode={`# For each task, classify as single-agent or multi-agent.
# Return ("single-agent", reasoning) or ("multi-agent: <pattern>", reasoning).

TASKS = [
    {
        'name': 'task_1',
        'description': 'What is the current weather in Tokyo?',
        # → single-agent (one tool call)
    },
    {
        'name': 'task_2',
        'description': 'Review this 200-line PR. Identify bugs, style issues, and missing tests.',
        # → could go either way; well-designed single-agent works; proposer-critic-judge can help on subtle bugs
    },
    {
        'name': 'task_3',
        'description': 'Prove this mathematical theorem. Verify each step. If a step is wrong, retry.',
        # → proposer-critic-judge (verifiable signal; LLM is better critic than generator)
    },
    {
        'name': 'task_4',
        'description': 'Summarize this 10-page document in 3 bullet points.',
        # → single-agent (one prompt, one output)
    },
    {
        'name': 'task_5',
        'description': 'Research the histories of 10 different cities in parallel and produce a comparison table.',
        # → multi-agent: manager-worker (parallel research really is parallel here)
    },
]


def classify(task):
    """
    Return (label, reasoning) where label is one of:
      'single-agent'
      'multi-agent: manager-worker'
      'multi-agent: proposer-critic-judge'
      'multi-agent: peer-to-peer'
    """
    desc = task['description'].lower()
    
    # TODO: implement classification heuristic
    # Suggestions:
    # 1. If "in parallel" or "compare N" with N > 3 → manager-worker
    # 2. If "verify", "prove", "review" (with verifiable signal) → proposer-critic-judge
    # 3. If "summarize", "what is", "lookup" (single fact) → single-agent
    # 4. If "debate", "discuss", "argue" → peer-to-peer
    # 5. Default → single-agent
    pass


# Run
# print("=== Architecture classifications ===\\n")
# for task in TASKS:
#     label, reasoning = classify(task)
#     print(f"{task['name']}: {task['description'][:60]}...")
#     print(f"  → {label}")
#     print(f"  Reasoning: {reasoning}\\n")
# 
# # Observations:
# # - Default to single-agent when uncertain
# # - Multi-agent earns its place via specific signals (parallelism, verification, debate)
# # - Most real tasks fit in single-agent — the chapter's 80/20 calibration
# # - The heuristic is engineering judgment, not algorithmic — real cases require nuance
`}
  packages={[]}
/>

### Exercise 2 (medium) — Proposer-critic-judge implementation

Implement a proposer-critic-judge for a math reasoning task, with **distinct system prompts per role**. The point is to demonstrate that role specialization done well requires more than "same prompt, different name" — each role has a different cognitive mode.

<details>
<summary>Hint</summary>

The pattern:
1. **Proposer**: system prompt asks it to generate a solution with reasoning
2. **Critic**: system prompt asks it to find errors specifically, treating the proposer as suspect
3. **Judge**: system prompt asks it to compare proposer's solution against critic's critique and produce a final answer

Each role's prompt should be **clearly different** — different verbs, different emphasis, different expectations of what success looks like.

For mock LLM calls: use canned responses keyed off the question. Real implementation calls Claude/GPT with the three different prompts.

</details>

<RunnableCode
  client:visible
  defaultCode={`# Proposer-critic-judge with three distinct role prompts.
# The mock LLM is keyed to question text — real implementation calls a real LLM.

# System prompts: each role has a clearly different mode
PROPOSER_PROMPT = """You are a math problem solver.
Given a question, produce a solution showing your reasoning step by step.
Conclude with: "Answer: <value>"
Do not second-guess yourself; just solve."""

CRITIC_PROMPT = """You are a math reviewer with high standards.
Given a question and a proposed solution, find any errors.
If the solution is correct, say "No errors detected."
If wrong, say "Error: <specific issue>" and explain.
Treat the proposer as potentially incorrect — verify, don't trust."""

JUDGE_PROMPT = """You are a math judge.
Given a question, a proposer's solution, and a critic's review:
- If critic detected no errors → accept proposer's answer
- If critic detected errors → produce a corrected final answer
- Output: "Final answer: <value>" plus a one-sentence justification."""


def mock_llm(system_prompt, user_message):
    """Mock LLM: returns canned responses based on the prompt + message."""
    # Proposer behavior
    if 'math problem solver' in system_prompt:
        if '17 * 23' in user_message:
            return "17 × 23. Let me compute: 17 × 20 = 340; 17 × 3 = 51; 340 + 51 = 391. Answer: 391"
        if 'sum of 1 to 10' in user_message:
            return "Using n(n+1)/2 = 10×11/2 = 55. Answer: 55"
        if 'sqrt(225)' in user_message:
            return "sqrt(225). I'll guess: 14 × 14 = 196, 15 × 15 = 225. Answer: 14"  # wrong!
        return "Answer: ?"
    
    # Critic behavior
    if 'math reviewer' in system_prompt:
        if '14 × 14 = 196, 15 × 15 = 225' in user_message and 'Answer: 14' in user_message:
            return "Error: arithmetic contradiction. The reasoning shows 15 × 15 = 225, which is correct, but the answer is given as 14. Final answer should be 15."
        return "No errors detected."
    
    # Judge behavior
    if 'math judge' in system_prompt:
        if 'Error:' in user_message:
            if '15' in user_message:
                return "Final answer: 15. Justification: critic correctly identified an arithmetic contradiction in the proposer's reasoning."
            return "Final answer: [revised]. Justification: critic's correction accepted."
        if 'Answer: 391' in user_message:
            return "Final answer: 391. Justification: proposer's solution is correct."
        if 'Answer: 55' in user_message:
            return "Final answer: 55. Justification: proposer's solution is correct."
        return "Final answer: [accepted]."
    
    return ""


def proposer_critic_judge(question):
    """
    Run the three-role pattern.
    Returns the final answer string.
    """
    # TODO:
    # 1. proposal = mock_llm(PROPOSER_PROMPT, question)
    # 2. critique = mock_llm(CRITIC_PROMPT, f"Question: {question}\\nProposed solution: {proposal}")
    # 3. verdict = mock_llm(JUDGE_PROMPT, f"Question: {question}\\nProposer: {proposal}\\nCritic: {critique}")
    # 4. Print each stage clearly; return final verdict
    pass


# Test
# questions = ['17 * 23', 'sum of 1 to 10', 'sqrt(225)']
# 
# for q in questions:
#     print(f"\\n=== Question: {q} ===")
#     answer = proposer_critic_judge(q)
#     print(f"\\nFinal: {answer}")
# 
# # Observations:
# # - Each role has a DIFFERENT system prompt (this is non-negotiable)
# # - Same LLM, three modes — single-agent variant of the same pattern
# # - True multi-agent: three different model instances or three different LLMs entirely
# # - The sqrt(225) example: proposer is wrong; critic catches it; judge fixes it
# # - This is the pattern Du et al. 2023 used to achieve measurable accuracy gains
`}
  packages={[]}
/>

### Exercise 3 (medium) — Anti-pattern audit and refactor

Given a degenerate multi-agent design (3 identical "reviewer" agents with the same prompt), audit it and refactor to a well-designed equivalent — either a single-agent design or a proper proposer-critic-judge.

<details>
<summary>Hint</summary>

The degenerate design's problems:
1. Three agents with identical prompts → wasted LLM calls
2. No role differentiation → no quality gain
3. No judge / consensus mechanism → no termination
4. 3× cost for 1× quality

Two fix options:
- **Single-agent**: one reviewer with the same prompt — does the same work for 1/3 the cost
- **Proper proposer-critic-judge**: distinct roles (e.g., coder, reviewer, tech lead) with distinct prompts

The exercise wants you to: (a) identify the anti-pattern; (b) propose a fix; (c) implement either fix.

</details>

<RunnableCode
  client:visible
  defaultCode={`# A degenerate multi-agent design — and your refactor.

# The degenerate design: 3 agents with identical prompts and tools
REVIEWER_PROMPT = """You are a code reviewer. Look at this PR and decide if it should be approved.
Output: 'APPROVE' or 'REJECT' with a one-line reason."""


def mock_llm(system_prompt, message):
    """Mock LLM: same input always produces same output (a key insight of the degenerate case)."""
    if 'code reviewer' in system_prompt:
        return "APPROVE - The changes look reasonable; I see no issues."
    if 'pr author' in system_prompt:
        return "Implemented feature X with comprehensive tests."
    if 'tech lead' in system_prompt:
        return "Approved. The implementation is sound; reviewer's no-issues finding is consistent with my own assessment."
    return ""


def degenerate_three_reviewers(pr_content):
    """The bad design: 3 reviewers with identical prompts."""
    print("=== DEGENERATE: 3 reviewers with identical prompts ===")
    calls = 0
    outputs = []
    for i in range(1, 4):
        output = mock_llm(REVIEWER_PROMPT, pr_content)
        calls += 1
        print(f"  Reviewer {i}: {output}")
        outputs.append(output)
    
    print(f"\\n  Total LLM calls: {calls}")
    print(f"  Unique outputs: {len(set(outputs))}")
    print(f"  Cost: ${calls * 0.01:.2f} for what could have been ${0.01:.2f}")
    return outputs


# TODO Option A: Refactor to single-agent
def fix_single_agent(pr_content):
    """One reviewer doing the same job for 1/3 the cost."""
    print("\\n=== FIX A: Single-agent (one reviewer) ===")
    # TODO: call mock_llm once with REVIEWER_PROMPT
    # Print the result and cost
    pass


# TODO Option B: Refactor to proper proposer-critic-judge with DIFFERENT prompts
AUTHOR_PROMPT = """You are the PR author defending your code.
Describe what the change does and why it's correct."""

REVIEWER_DETAILED_PROMPT = """You are a critical code reviewer.
Look for: bugs, security issues, performance problems, missing tests.
Be specific. Output: 'APPROVE: <reason>' or 'REJECT: <specific issues>'."""

TECH_LEAD_PROMPT = """You are the tech lead making the final approval decision.
Given the author's defense and the reviewer's findings, decide.
Output: 'MERGE' or 'BLOCK' plus a one-line justification."""


def fix_proposer_critic_judge(pr_content):
    """Three roles with DISTINCT prompts: author → reviewer → tech lead."""
    print("\\n=== FIX B: Proposer-critic-judge (three DISTINCT roles) ===")
    # TODO: 
    # 1. author_defense = mock_llm(AUTHOR_PROMPT, pr_content)
    # 2. review = mock_llm(REVIEWER_DETAILED_PROMPT, f"PR: {pr_content}\\nAuthor: {author_defense}")
    # 3. decision = mock_llm(TECH_LEAD_PROMPT, f"PR: {pr_content}\\nAuthor: {author_defense}\\nReview: {review}")
    # Print each stage and total cost (3 calls — but with genuine role differentiation)
    pass


# Test
# pr = "Add password validation to login form."
# 
# # Show the degenerate baseline
# degenerate_three_reviewers(pr)
# 
# # Show Fix A: single-agent
# fix_single_agent(pr)
# 
# # Show Fix B: proper multi-agent with distinct roles
# fix_proposer_critic_judge(pr)
# 
# # Observations:
# # - Degenerate: 3× cost, same output 3 times, no quality gain
# # - Fix A: 1× cost, same quality — usually the right call
# # - Fix B: 3× cost AGAIN — but now with genuine role differentiation; can produce better quality
# # - The choice between A and B: does the task genuinely benefit from distinct roles?
# # - For simple PR review: A wins. For complex/high-stakes review: B may earn its keep.
`}
  packages={[]}
/>

### Exercise 4 (hard) — Framework selection by scenario

For each of four production scenarios, recommend a framework (CrewAI / AutoGen / OpenAI Swarm / LangGraph / Custom code) and an architecture. Justify based on the scenario's characteristics.

<details>
<summary>Hint</summary>

Framework strengths (from section 5):

| Framework | Best for |
|---|---|
| **CrewAI** | Role-based teams (researcher / writer / editor); fast prototyping |
| **AutoGen** | Conversational multi-agent; group chats; Microsoft ecosystem |
| **OpenAI Swarm** | Lightweight handoffs; routing; learning the patterns |
| **LangGraph** | Complex stateful workflows; persistence; cycles |
| **Custom code** | When framework lock-in is a real concern; small surface area |

The decision factors:
1. **Complexity of state** → high state → LangGraph; low state → anything
2. **Number of distinct roles** → many → CrewAI; few → custom
3. **Conversational dynamics** → critical → AutoGen
4. **Team familiarity** → use what your team knows
5. **Production maturity needed** → LangGraph / AutoGen for production; Swarm for learning

When uncertain: write framework-agnostic role logic; treat the framework as plumbing.

</details>

<RunnableCode
  client:visible
  defaultCode={`# Recommend a framework + architecture for each scenario.

SCENARIOS = [
    {
        'name': 'scenario_1',
        'description': """A customer support bot that should answer 90% of FAQs and escalate the rest to a human.
Single role: answer or escalate. ~1000 queries/day. Should ship in 2 weeks.""",
        # → single-agent + custom code (or any framework as light scaffolding)
    },
    {
        'name': 'scenario_2',
        'description': """A blog content pipeline: research → outline → draft → edit → fact-check → publish.
Each step has clear handoffs. 4-5 distinct roles. Output: 1 article/day. Team is small (3 engineers).""",
        # → CrewAI: role-based teams with sequential handoffs is exactly its sweet spot
    },
    {
        'name': 'scenario_3',
        'description': """A coding assistant that fixes bugs by: (1) reading a stack trace, (2) navigating the codebase,
(3) writing a fix, (4) running tests, (5) iterating until tests pass. Heavy state across iterations.
Complex retry / rollback semantics. Production scale.""",
        # → LangGraph: stateful workflow with cycles; LangGraph's graph mental model fits
    },
    {
        'name': 'scenario_4',
        'description': """An experimental research project where 5 agents debate a philosophical question for N rounds
until consensus. Each agent has its own persona and opinion. Group chat dynamics matter; not production.""",
        # → AutoGen: group chat is its primary primitive; experimental work fits
    },
]


def recommend(scenario):
    """
    Return (framework, architecture, reasoning).
    Frameworks: 'CrewAI', 'AutoGen', 'OpenAI Swarm', 'LangGraph', 'Custom'
    Architectures: 'single-agent', 'manager-worker', 'peer-to-peer', 'proposer-critic-judge', 'hierarchical'
    """
    desc = scenario['description'].lower()
    
    # TODO: implement heuristic
    # 1. If single role, simple task, fast shipping → single-agent + Custom code
    # 2. If multiple distinct roles, sequential handoffs → manager-worker + CrewAI
    # 3. If heavy state, cycles, retry semantics → varies, but often single-agent + LangGraph 
    #    (single-agent in a complex graph is a common production pattern)
    # 4. If group dynamics, debate, conversation → peer-to-peer + AutoGen
    # 5. If experimental / learning → consider OpenAI Swarm
    pass


# Run
# print("=== Framework + architecture recommendations ===\\n")
# for scenario in SCENARIOS:
#     framework, architecture, reasoning = recommend(scenario)
#     print(f"{scenario['name']}: {scenario['description'][:80]}...")
#     print(f"  Framework: {framework}")
#     print(f"  Architecture: {architecture}")
#     print(f"  Reasoning: {reasoning}\\n")
# 
# # Observations:
# # - Framework choice is engineering judgment, not algorithmic
# # - Most real systems use one framework as scaffolding + custom logic on top
# # - Production maturity matters: LangGraph + AutoGen have track records; Swarm is experimental
# # - Don't over-engineer: scenario 1 doesn't need a framework at all
# # - The honest framing: many "multi-agent" deployments would work as single-agent with good tools
`}
  packages={[]}
/>

````

### Part B — Flip Ch 29's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 29, slug: 'ch29-multi-agent', title: 'Multi-agent', partNum: 9, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-8** of Ch 29 still render correctly (no changes to existing sections).
3. **Section 2's** `MultiAgentTopologyExplorer` marquee 1 still renders correctly.
4. **Section 4's** `InterAgentConversationViewer` marquee 2 still renders correctly.
5. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
6. **Sidebar**: Ch 1-29 all active (published); Ch 30 still dimmed.
7. **Prev/next at bottom of Ch 29**: prev = Ch 28 (active); next = Ch 30 (disabled).
8. **TOC**: includes Exercises as h2 between section 7 and section 8.
9. **`npm run typecheck`** passes.
10. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not call a real LLM** in any code or runnable.
- ❌ **Do not implement new widgets.** Both Ch 29 marquees are sealed.
- ❌ **Do not modify Ch 29's prose sections 1-8.** Sealed.
- ❌ **Do not modify Ch 1-28.** Sealed.
- ❌ **Do not flip any other chapter's status.** Only Ch 29 flips.

---

## Wire-up

```bash
git add src/pages/ch29-multi-agent/index.mdx src/lib/chapters.ts
git commit -m "session 127: Ch 29 closeout — exercises + status: published. Phase 15: 3 of 4 complete."
git push origin main
```

---

## Ch 29 closeout — Phase 15's third chapter

Chapter 29 is now the twenty-ninth complete chapter on production. **Phase 15 has its third published chapter.**

Confirm before declaring Ch 29 done:

- ✅ BUILD_ORDER.md shows files 161-165 ✅
- ✅ File 166 marked ⏭️ (absorbed for 5-file cadence)
- ✅ Ch 29 status is `'published'`
- ✅ Both Ch 29 marquee widgets work in production
- ✅ All 4 Ch 29 exercises render with their starter code

**Cadence check across 29 chapters:**

**4-file cadence** holds for **22 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28).
**5-file cadence** holds for **7 two-topic chapters** (Ch 1, 5, 8, 9, 14, 20, **29**).

**29-chapter pattern stable. Phase 15 status:**
- ✅ Ch 27 (Agent foundations) — conceptual
- ✅ Ch 28 (Agents from scratch) — engineering
- ✅ Ch 29 (Multi-agent) — composition
- ⬜ Ch 30 (Agent eval and frameworks) — opens next; **closes the curriculum**

**One chapter remains. The curriculum's end is at hand.**

---

## Notes for the session author

**On the 4 exercises forming the chapter's calibration arc**:

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | Architecture choice classifier | 1 (when multi-agent is warranted) |
| 2 | medium | Proposer-critic-judge with distinct prompts | 4 (role specialization done well) |
| 3 | medium | Anti-pattern audit and refactor | 7 (argue against multi-agent when single suffices) |
| 4 | hard | Framework selection by scenario | 5 (survey 2025 frameworks and pick) |

Notes-for-author: "**The progression: classify → implement → refactor → recommend.** Each exercise targets a specific Ch 29 outcome. **By the end, the reader has the practical judgment to evaluate any multi-agent proposal.**"

**On Ex 1 being a calibration exercise**:
Five tasks classified as single-agent vs multi-agent. **The point isn't whether the reader gets every classification right** — it's developing the heuristic. Notes-for-author: "**Ex 1 is a calibration exercise**, not a quiz. The classifications have defensible reasoning; the reader develops judgment, not answers."

**On Ex 2 emphasizing DISTINCT role prompts**:
The system prompts for proposer, critic, judge are written out explicitly to show what differentiation looks like. **'Same LLM, three modes' is the cheap multi-agent variant** that's often as effective as fully separate agents. Notes-for-author: "**Reader sees that distinct prompts are non-negotiable for proposer-critic-judge.** Without distinct prompts, you have the degenerate scenario from the widget. **The exercise teaches what role differentiation looks like in code.**"

**On Ex 3 mirroring the widget's degenerate scenario**:
The `InterAgentConversationViewer` widget showed 3 identical reviewers as the chapter's central anti-pattern. **Ex 3 asks the reader to refactor that exact scenario.** Notes-for-author: "**The widget showed the problem; the exercise asks for the fix.** Reader implements either single-agent refactor (Fix A — usually right) or proper proposer-critic-judge (Fix B — sometimes earns its keep). **Both fixes are valid; the choice depends on whether the task genuinely benefits from distinct roles.**"

**On Ex 4 being framework selection AND honest assessment**:
The four scenarios deliberately span: simple (custom code wins), role-based (CrewAI shines), stateful (LangGraph fits), experimental/conversational (AutoGen suits). **Scenario 1 has no framework match** — the right answer is "use a framework as light scaffolding or write custom code." Notes-for-author: "**Ex 4 includes a scenario where 'use a framework' is the wrong answer.** Most production multi-agent systems are bespoke. The exercise reinforces the chapter's framework-as-plumbing framing."

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Decide when multi-agent is warranted | Ex 1 ✓ |
| 2. Architecture vocabulary | (Ch prose + widget 1) |
| 3. Communication patterns | (Ch prose + widget 2) |
| 4. Role specialization | Ex 2 ✓ |
| 5. 2025 frameworks | Ex 4 ✓ |
| 6. Park 2023 / simulations | (Ch prose) |
| 7. Argue against multi-agent | Ex 3 ✓ |
| 8. Connection to Phase 15 / Ch 30 | (Ch prose + section 8) |

Outcomes 1, 4, 5, 7 served by exercises directly. Outcomes 2, 3, 6, 8 served by chapter prose + widgets.

**On the chapter's pedagogical claim through the exercises**:
"**Decide before implementing.** Most engineers reach for multi-agent without classifying their task — and end up with the degenerate-reviewer pattern. **The four exercises force the calibration step**: classify the task (Ex 1), implement well-designed multi-agent (Ex 2), recognize anti-patterns (Ex 3), pick the right framework (Ex 4). **After these, the reader has a heuristic for any multi-agent proposal.**"

**On Ch 29 being Phase 15's composition chapter**:
Ch 27 was conceptual; Ch 28 was engineering; Ch 29 is composition. **Together they form the agent-systems toolkit.** Notes-for-author: "**The reader leaving Ch 29 has the full agent-systems toolkit**: how the loop works, how to build production agents, how to compose them — and, equally important, when not to compose them. **Ch 30 brings evaluation discipline to close the curriculum.**"

**Pedagogical claim of the chapter (revisited):**
"Multi-agent is real and useful in narrow cases — adversarial workflows, role specialization, long-horizon collaboration. **Five architectures** form the design space (single-agent, manager-worker, peer-to-peer, hierarchical, proposer-critic-judge); single-agent is the recommended default. **Three communication patterns** (message passing, shared workspace, hub-and-spoke). **Role specialization done well requires distinct prompts** — same LLM in different modes, or genuinely separate agents. **The 2025 framework landscape** (CrewAI, AutoGen, OpenAI Swarm, LangGraph, MetaGPT) covers most production needs. **Park 2023** showed what memory + reflection + planning can do. **80% of multi-agent designs in the wild would work better as well-designed single-agent ReAct loops.** The default should be single-agent; multi-agent is the exception. **The chapter is a calibration tool** — respectful of multi-agent's contributions, skeptical of its hype, clear about when to reach for it and when not to."

**Phase 15 progress after this session**:
- ✅ Ch 27 Agent foundations
- ✅ Ch 28 Agents from scratch
- ✅ Ch 29 Multi-agent
- ⬜ Ch 30 Agent eval and frameworks (closes the curriculum)

**One chapter remains.**

Build with care. **This file closes the multi-agent chapter and leaves only Ch 30 to close the curriculum.**
