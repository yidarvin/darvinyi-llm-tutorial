# Session 124 — Chapter 29 page structure

> First chapter session for Chapter 29 ("Multi-agent"). **The composition chapter of Phase 15.** Where Ch 27 was conceptual (the agentic loop) and Ch 28 was engineering (production tools, schemas, error handling, observability), this chapter is composition — **when one agent isn't enough.** Eight sections walking from "when multi-agent is actually warranted" → architectures (marquee widget 1 here) → communication patterns → role specialization (marquee widget 2 here) → 2025 framework landscape → generative-agent simulations → the honest assessment of when NOT to use multi-agent → one chapter remains. **Two-topic chapter**; uses the **5-file cadence**. **Tonal anchor: respectful skepticism** — multi-agent is genuinely useful in narrow cases (adversarial workflows, role specialization) and dramatically overused everywhere else.

---

## Read first (in this order)

1. **`research/ch29-multi-agent/research.md`** — the source material. Every section, equation, code snippet, and misconception traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch28-agent-from-scratch/session-121-page-structure.md`** — for the Ch 28 page-structure pattern; this chapter builds directly on it
4. **`prompts/chapters/ch27-agent-foundations/session-118-page-structure.md`** — for the broader Phase 15 chapter shape

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 29 page. By end of session:

- `src/pages/ch29-multi-agent/index.mdx` exists with full prose, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch29-multi-agent/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 29's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch29-multi-agent/` with sidebar showing Ch 29 active, prev/next nav linking to Ch 28 (active) and Ch 30 (disabled)

**Tonal note:** Ch 29 is **respectful skepticism.** Multi-agent has real and important use cases — adversarial workflows (proposer-critic-judge), genuine role specialization, long-horizon collaboration — and the chapter must legitimize these. But the chapter must also push back hard on the "more agents = better" reflex, the AGI-via-multi-agent framing, and the over-application of multi-agent to tasks that single-agent setups handle better. **Section 7's honest assessment is the chapter's centerpiece.**

**Concrete framing**:
- **The default should be single-agent**; multi-agent is the exception
- **80% of multi-agent designs** would work better as single-agent ReAct loops
- **20% of cases** genuinely benefit from multi-agent
- **The chapter is a calibration tool** against multi-agent hype

**Phase 15 advancing position**: Ch 27 gave the conceptual toolkit; Ch 28 gave the engineering toolkit; Ch 29 covers composition. **Two chapters from the curriculum's end.** Section 8 explicitly maps the remaining trajectory.

**Chapter cadence:** Ch 29 uses the **5-file cadence** (two-topic chapter).

---

## Inputs

State of the repo after session 123 (Ch 28 complete):

- Ch 1-28 all `'published'`
- `research/ch29-multi-agent/research.md` exists
- `src/lib/chapters.ts` has Ch 1-28 `'published'`, Ch 29-30 `'planned'`
- No `src/pages/ch29-multi-agent/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch29-multi-agent/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch29-multi-agent/index.astro` if it existed
3. **Update** `src/lib/chapters.ts` — change Ch 29's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch29-multi-agent
description: Multi-agent systems — the composition chapter. When one agent isn't enough. Architectures (manager-worker, peer-to-peer, hierarchical), communication patterns (message passing, shared workspaces, hub-and-spoke), role specialization (proposer-critic-judge, plan-execute-verify), the 2025 framework landscape (CrewAI, AutoGen, OpenAI Swarm, LangGraph, MetaGPT), generative-agent simulations (Park 2023 Smallville), and the honest assessment of when NOT to use multi-agent. Tonal anchor: respectful skepticism — multi-agent is real and useful in narrow cases, dramatically overused everywhere else.
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

> Chapter 27 covered the agent loop. Chapter 28 covered the engineering 80% — tools, schemas, error handling, observability, scaffolding. By the end of Ch 28 you could build a production-grade single-agent system. **This chapter asks the next question**: what if one agent isn't enough? **Multi-agent systems** — manager-worker decompositions, peer-to-peer collaborations, hierarchical teams, adversarial debates — are the natural next step. The 2023 hype around AutoGPT and BabyAGI promised AGI through agent multiplicity; the 2024-2025 reality has been more sober. **Production systems are still mostly single-agent.**
>
> The honest framing this chapter takes: multi-agent has genuine, important use cases — and is dramatically overused everywhere else. **80% of multi-agent designs** in the wild would work better as well-designed single-agent ReAct loops. **20%** genuinely benefit — adversarial workflows where proposer/critic/judge patterns improve quality, long-horizon collaborations with stable role boundaries, tasks that genuinely decompose into distinct expertise. **The chapter is a calibration tool**: respectful of multi-agent's contributions, skeptical of its hype, clear about when to reach for it and when not to.
>
> Eight sections. **When multi-agent is warranted.** **Three architectures** — manager-worker, peer-to-peer, hierarchical. **Communication patterns** — message passing, shared workspaces, hub-and-spoke. **Role specialization** — proposer-critic-judge, plan-execute-verify. **The 2025 framework landscape** — CrewAI, AutoGen, OpenAI Swarm, LangGraph, MetaGPT. **Generative-agent simulations** — Park 2023's Smallville and the patterns it pioneered. **The honest assessment** — when NOT to use multi-agent. **One chapter remains** — Ch 30 brings Phase 14's eval discipline to bear on agent systems and closes the curriculum. **By the end you'll know how to build multi-agent systems, when they're worth building, and — equally important — when they aren't.**

### Section 1: When multi-agent is actually warranted

**Heading:** `## When multi-agent is actually warranted`
**Word target:** ~500 — IMPORTANT
**Sub-headings:** `### The default should be single-agent`, `### When multi-agent earns its place`

**Teaching beats:**

**The default**: **single-agent.** A well-designed single-agent system (Ch 27 patterns + Ch 28 engineering) handles the vast majority of production tasks. **Multi-agent is the exception, not the rule** — and most multi-agent demos would work better as single-agent designs.

**Multi-agent earns its place** in four narrow cases:

**1. Genuine role specialization exists** — the task decomposes into truly distinct expertise needs (research + writing + code review + legal review). Different roles need different prompts, tools, or constraints. A single prompt managing all roles would be unwieldy.

**2. Adversarial dynamics improve quality** — proposer/critic/judge patterns where one agent generates and another critiques. Self-debate scenarios (Du et al. 2023 showed measurable improvements on hard reasoning tasks). Tasks where the LLM is unreliable on its own answers but reliable as a judge.

**3. Long-horizon collaboration is required** — days-long workflows with stable role boundaries. Memory and state belonging to specific roles. Persistent specialization across many tasks.

**4. Parallelism is genuinely useful** — subtasks that can truly run in parallel (research multiple topics; review multiple PRs). Speed gains from concurrent execution that justify orchestration overhead.

**Empirical reality (early 2025)**:
- **Most production "agents"** are single-agent ReAct loops with multiple tools
- **AutoGen, CrewAI, MetaGPT** have impressive demos and limited production traction relative to GitHub stars
- **Multi-agent debate** (Du et al. 2023) shows measurable improvements on hard reasoning tasks (5-15% accuracy gains)
- **Generative-agent simulations** (Park 2023) are research demos; no widespread commercial deployment
- **Anthropic Claude Code, Cursor, GitHub Copilot Workspace, Devin** — all fundamentally single-agent

**The default to challenge**: "I have a complex task; therefore I need multiple agents." **Reality:** most "complex" tasks decompose into a single ReAct loop with the right tools.

**Required callout** — type `aside`: **The 80/20 of multi-agent.** **80% of multi-agent designs** would work better as well-designed single-agent ReAct loops. **20% of cases** genuinely benefit from multi-agent. **Most "I want multi-agent" instincts** are actually "I want better single-agent prompting" or "I want better tool design." **This chapter is a calibration tool against multi-agent hype.**

**No code in this section.** Setup.

**Connection forward:** Section 2 covers the architectures that show up when multi-agent IS the right call.

### Section 2: Architectures

**Heading:** `## Architectures`
**Word target:** ~600 — IMPORTANT
**Sub-headings:** `### Three primary architectures`, `### Choice factors`

**Teaching beats:**

**Three primary architectures** appear in production:

**1. Manager-worker (orchestrator-executor)**
- One manager agent receives the user task; decomposes into subtasks; assigns to workers
- Workers execute their assigned subtask; return results to manager
- Manager combines results into a final answer

ASCII diagram:
```text
       user task
          │
          ▼
      [Manager]
       /  |  \
      /   |   \
[Worker A][Worker B][Worker C]
      \   |   /
       \  |  /
       results
          ▼
       answer
```

Variations: sequential workers (each sees prior results), parallel workers (concurrent), hierarchical (workers managing sub-workers). **Production use**: MetaGPT (PM → Architect → Engineer); LangGraph supervisor pattern; CrewAI sequential crews.

**2. Peer-to-peer (round-robin or message-driven)**
- Multiple agents communicate as peers without a designated manager
- Each agent decides when it has something to contribute
- Termination is by convention (agreement, max rounds, etc.)

**Production use**: AutoGen group chats; multi-agent debate (Du et al. 2023).

**3. Hierarchical (recursive teams)**
- A manager has workers; some workers are themselves managers of sub-teams
- Tree structure of arbitrary depth
- Each level handles its appropriate scope

**Production use**: very rare; mostly research demos.

**Choice factors**:
- **Task structure**: pipelined → manager-worker; collaborative → peer-to-peer
- **Predictability**: known steps → manager-worker; emergent decisions → peer-to-peer
- **Debugging**: manager-worker traces are easier to read than peer-to-peer
- **Cost**: peer-to-peer often runs more LLM calls (every agent considers every turn)

**Required widget placeholder** — Multi-Agent Topology Explorer (marquee 1, session 163):

```mdx
<WidgetFrame title="Multi-agent topology explorer" caption="Five architectures visualized side-by-side: single-agent baseline (the chapter's recommended default), manager-worker, peer-to-peer, hierarchical, and proposer-critic-judge. Each shows a small node-and-arrow diagram, use cases, pros and cons, and a maturity badge. The chapter's central architectural vocabulary made concrete — including the single-agent baseline that most tasks should default to.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 163 (marquee 1)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing minimal manager-worker:

```python
class Agent:
    def __init__(self, name, system_prompt, callable):
        self.name = name
        self.system_prompt = system_prompt
        self.callable = callable
    
    def respond(self, message):
        return self.callable(self.system_prompt, message)


def manager_brain(system_prompt, message):
    if 'decompose' in system_prompt:
        return ('Subtasks:\\n1. researcher: Find population of Bhutan\\n'
                '2. researcher: Find area of Bhutan\\n3. calculator: Compute density')
    return 'Final answer: Bhutan ~20.5 people/km².'


def researcher_brain(_sys, msg):
    if 'population' in msg.lower(): return '787,000 (2024)'
    if 'area' in msg.lower(): return '38,394 km²'
    return 'No result'


def calculator_brain(_sys, msg):
    return '20.5 people per km²'


manager = Agent('manager', 'You decompose tasks and aggregate results.', manager_brain)
researcher = Agent('researcher', 'You look up facts.', researcher_brain)
calculator = Agent('calculator', 'You compute math.', calculator_brain)


def run(task):
    print(f"User task: {task}\\n")
    plan = manager.respond(f"decompose: {task}")
    print(f"=== Plan ===\\n{plan}\\n")
    
    # Workers execute (simplified)
    print(f"=== Workers ===")
    print(f"  researcher: 'population of Bhutan' → '787,000 (2024)'")
    print(f"  researcher: 'area of Bhutan' → '38,394 km²'")
    print(f"  calculator: '787,000 / 38,394' → '20.5 people per km²'")
    
    final = manager.respond("aggregate: results above")
    print(f"\\n=== Final ===\\n{final}")


run("What's the population density of Bhutan?")

# Observations:
# - Three agents with different "brains" representing different roles
# - Manager decomposes; workers execute; manager aggregates
# - Communication: manager-to-worker (assignment), worker-to-manager (result)
# - Could this be a single agent? YES — and for this task, probably should be
# - Multi-agent earns its place when roles are genuinely distinct
```

**Connection forward:** Section 3 covers how agents communicate with each other.

### Section 3: Communication patterns

**Heading:** `## Communication patterns`
**Word target:** ~500
**Sub-headings:** `### Three communication patterns`, `### Framework choices`

**Teaching beats:**

**How agents talk to each other** is as important as the architecture. **Three patterns** dominate:

**1. Direct message passing**
- Agent A sends an explicit message to Agent B
- Includes sender, recipient, content
- Most flexible; easiest to reason about; most LLM-call-expensive

**2. Shared workspace (blackboard)**
- All agents read and write to a shared state object
- Agents pull what they need; push their contributions
- Lower per-message overhead; harder to reason about who's seeing what
- Pattern dates back to **Hoff and Anderson 1976** — pre-LLM blackboard architectures

**3. Hub-and-spoke**
- One central agent (the hub) coordinates communication
- Other agents only talk to the hub, not each other
- Common in manager-worker architectures

**Choice factors**:
- **Number of agents**: > 4 → shared workspace; ≤ 4 → direct messaging
- **Privacy/scoping**: do agents need to see each other's reasoning? → direct messaging
- **Determinism**: shared workspace is harder to make deterministic
- **Debugging**: message passing has natural sequence; workspace has snapshots

**What 2025 frameworks chose**:
- **AutoGen**: message passing (conversation logs)
- **CrewAI**: shared workspace + sequential task execution
- **LangGraph**: graph state object (shared workspace pattern)
- **OpenAI Swarm**: handoffs (direct message passing with role switching)

**Required callout** — type `note`: Multi-agent communication patterns aren't novel inventions of the LLM era. **The blackboard pattern** is from **1976** — pre-LLM distributed problem-solving systems. **Message passing** is older still. **The LLM era rediscovered** these patterns and gave them new application. Engineers from distributed-systems backgrounds will recognize most of them.

**No code in this section** (the proposer-critic-judge runnable in section 4 demonstrates message passing).

**Connection forward:** Section 4 covers the most useful multi-agent pattern in practice — structured role specialization.

### Section 4: Role specialization

**Heading:** `## Role specialization`
**Word target:** ~500 — IMPORTANT
**Sub-headings:** `### Classic patterns`, `### Done well vs done badly`

**Teaching beats:**

**The most useful multi-agent pattern in practice** isn't general-purpose collaboration — it's **structured role specialization** where each role has a clear, narrow responsibility.

**Classic patterns**:

**Proposer-critic-judge (Du et al. 2023)**
- **Proposer** generates a candidate answer
- **Critic** critiques the answer; identifies errors or weaknesses
- **Judge** decides whether the critique is valid; produces final answer

**Why this works**: LLMs are often better critics than generators. Separating the roles lets each operate in a focused mode.

**Plan-execute-verify**
- **Planner** generates a step-by-step plan
- **Executor** runs each step using tools
- **Verifier** checks that steps were completed correctly

**Why this works**: planning and execution have different cognitive demands; verification benefits from a fresh perspective.

**Divider-finder-explainer**
- **Divider** breaks the user's question into sub-questions
- **Finder** searches for information answering each sub-question
- **Explainer** synthesizes findings into a coherent answer

**Why this works**: each role has a single, narrow task; the LLM is good at each in isolation but worse when trying to do all three at once.

**Required widget placeholder** — Inter-Agent Conversation Viewer (marquee 2, session 164):

```mdx
<WidgetFrame title="Inter-agent conversation viewer" caption="Step through multi-agent collaborations turn by turn. Four scenarios — proposer-critic-judge solving a reasoning task, manager-worker decomposing a research task, plan-execute-verify on a coding task, and a degenerate scenario showing multi-agent failure modes. Reader sees how messages flow between agents, how role specialization improves quality (and how badly designed roles do nothing). The chapter's central operational claim made concrete: 'agent' isn't one architecture but a family of them; multi-agent done well separates concerns.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 164 (marquee 2)
  </div>
</WidgetFrame>
```

**Role specialization done well**:
- Each role has a **clearly different prompt** (not "same prompt, different name")
- Each role has **role-appropriate tools** (researcher gets search; reviewer gets validators)
- **Output formats are agreed upon** between roles (JSON schemas, structured messages)
- **Termination is explicit** (judge decides; max rounds; consensus)

**Role specialization done badly**:
- Three agents with identical prompts and tools — wasted LLM calls
- Roles that overlap heavily — confused responsibilities
- No clear termination — infinite back-and-forth

**Required code** — `<RunnableCode>` showing proposer-critic-judge:

```python
def propose(question):
    """Generate a candidate answer. Sometimes wrong."""
    candidates = {
        'capital of australia': 'Sydney',  # wrong! Canberra is the capital
        'square root of 144': '12',
        'fastest land animal': 'Cheetah',
    }
    return candidates.get(question.lower(), 'Unknown')


def critique(question, answer):
    """Critique the answer; flag possible errors."""
    if 'capital' in question.lower() and 'australia' in question.lower() and answer == 'Sydney':
        return 'Wrong. Sydney is the largest city, but Canberra is the capital.'
    return 'No issues detected.'


def judge(question, answer, critique_text):
    """Decide whether to accept the answer or use the critique."""
    if 'wrong' in critique_text.lower():
        if 'capital' in question.lower() and 'australia' in question.lower():
            return 'Canberra'
        return f"[corrected] (was: {answer})"
    return answer


def proposer_critic_judge(question):
    print(f"\\nQuestion: {question}")
    proposal = propose(question)
    print(f"  Proposer:  {proposal}")
    crit = critique(question, proposal)
    print(f"  Critic:    {crit}")
    final = judge(question, proposal, crit)
    print(f"  Judge:     {final}")
    return final


for q in ['Capital of Australia', 'Square root of 144', 'Fastest land animal']:
    proposer_critic_judge(q)

# Observations:
# - Proposer can be wrong; critic catches; judge produces final
# - Each role has a different cognitive task (generate / evaluate / synthesize)
# - Could be the same LLM with different system prompts (cheap multi-agent)
# - Or three separate LLM calls in sequence (expensive multi-agent)
# - Du et al. 2023 showed measurable accuracy improvements with this pattern
```

**Required callout** — type `warning`: **MC2 from research.md.** "More agents = better results." False. **More agents = more cost, more latency, more failure modes, and rarely more quality.** A 5-agent crew with similar prompts is typically worse than one well-prompted agent. **The quality benefit comes from genuine role differentiation, not from agent count.**

**Connection forward:** Section 5 surveys the 2025 framework landscape.

### Section 5: The 2025 framework landscape

**Heading:** `## The 2025 framework landscape`
**Word target:** ~500
**Sub-headings:** `### Five dominant frameworks`, `### How to pick one`

**Teaching beats:**

**The dominant multi-agent frameworks** as of early 2025, with honest strengths/weaknesses:

**CrewAI**
- **Design**: define agents by role + goal + backstory; combine into crews
- **Execution**: sequential or hierarchical; tasks assigned by manager
- **Strengths**: easy onboarding; expressive role definitions
- **Weaknesses**: opinionated structure; harder to deviate from the role-based model
- **Production traction**: moderate; popular for prototyping

**AutoGen (Microsoft)**
- **Design**: agents communicate by exchanging messages; conversation is the primary primitive
- **Execution**: group chats; nested chats; human-in-the-loop options
- **Strengths**: flexible; supports many architectures; tight Microsoft integration
- **Weaknesses**: verbose configuration; conversation logs can sprawl
- **Production traction**: moderate; common in Microsoft ecosystem

**OpenAI Swarm (experimental)**
- **Design**: lightweight handoffs; agents transfer control via function calls
- **Execution**: routing-as-orchestration
- **Strengths**: minimal abstractions; close to the bare metal
- **Weaknesses**: explicitly marked experimental; smaller community
- **Production traction**: limited; popular for learning

**LangGraph (LangChain)**
- **Design**: explicit graph of agents/nodes with shared state
- **Execution**: graph traversal; supports cycles for iterative workflows
- **Strengths**: explicit control flow; persistence; state management
- **Weaknesses**: steep learning curve; verbose for simple cases
- **Production traction**: high; popular for complex workflows

**MetaGPT**
- **Design**: SOPs baked in; agent roles like PM/Architect/Engineer
- **Execution**: phase-driven; each role has defined inputs/outputs
- **Strengths**: structure for software-development workflows
- **Weaknesses**: rigid; less useful outside software-engineering tasks
- **Production traction**: limited; mostly research

**Custom implementations**: many production multi-agent systems are bespoke code that uses a framework as scaffolding (or none at all).

**How to pick one**:
- **Team familiarity** — stick with what your team knows
- **Complexity needs** — LangGraph for complex graphs; CrewAI for role-based; AutoGen for conversation-driven
- **Production maturity** — LangGraph and AutoGen have the most production-tested code
- **Lock-in concern** — write framework-agnostic role logic; let the framework be plumbing

**Required callout** — type `note`: **MC5 from research.md.** "Pick the framework with the most stars." Misleading. **Star counts measure curiosity, not production utility.** CrewAI has many stars; production deployments are moderate. **Choose based on team familiarity, complexity needs, and production track record** — not popularity.

**No code in this section** (frameworks are too varied to demo fairly; the honest-comparison runnable in section 7 does the work).

**Connection forward:** Section 6 covers the most-cited multi-agent paper of the era — and what it taught the field.

### Section 6: Generative-agent simulations

**Heading:** `## Generative-agent simulations`
**Word target:** ~400
**Sub-headings:** `### Park 2023 — Smallville`, `### Beyond Smallville`, `### Production reality`

**Teaching beats:**

**Park et al. 2023** is the most-cited multi-agent paper of recent years. **Smallville** — 25 generative agents simulated daily life in a small town — produced believable emergent social behavior: agents organized parties, formed relationships, had conversations referencing past events.

**The Smallville architecture**:
- **Memory stream**: each agent records every observation as a memory record
- **Retrieval**: agents retrieve relevant memories when deciding what to do
- **Reflection**: periodically, agents synthesize lower-level memories into higher-level insights
- **Planning**: agents create daily plans, refine them in response to new observations

**What Smallville demonstrated**:
- LLMs + memory + reflection can produce coherent multi-day behavior
- Emergent social dynamics arise from individual-level reasoning
- The complexity of social behavior comes from interaction, not from any one agent

**Beyond Smallville (2024-2025)**:
- Game NPCs with generative agents (several research projects; limited commercial deployment)
- Negotiation simulations between specialized agents
- Multi-agent debate environments

**Production reality (early 2025)**:
- **Generative-agent simulations remain research demos**
- **No widespread commercial deployment** as of early 2025
- The patterns (memory + reflection + planning) **influence production single-agent design** more than they drive standalone multi-agent products

**Why simulations stay in research**:
- Cost per simulated agent-day is significant
- Failure modes are emergent and hard to debug
- Use cases that justify the cost are narrow

**Required callout** — type `note`: **MC4 from research.md.** "Generative-agent simulations will replace game NPCs." Speculative. **Park 2023 is impressive research**; production game deployments remain limited. Cost per simulated character-hour is high; failure modes are unpredictable; designers want more control than emergent behavior provides. **2024-2025 saw some commercial experiments; widespread adoption remains in the future.**

**No code in this section.**

**Connection forward:** Section 7 is the chapter's centerpiece — when NOT to use multi-agent.

### Section 7: The honest assessment — when NOT to use multi-agent

**Heading:** `## The honest assessment — when NOT to use multi-agent`
**Word target:** ~500 — IMPORTANT
**Sub-headings:** `### Five anti-patterns`, `### Single-agent alternatives that often win`

**Teaching beats:**

**The most important section of the chapter.** Multi-agent is genuinely useful in narrow cases — and dramatically overused everywhere else.

**Multi-agent is the wrong choice when**:

**1. A single agent with the right tools would work**
- "I need an agent to search, summarize, and report" → single ReAct loop with three tools
- "I need an agent to plan and execute" → single ReAct loop; LLM is good at both within one prompt
- "I need an agent that's careful" → add self-critique within the same loop, not a separate critic agent

**2. The agents would just call the same LLM with different names**
- Three agents that all use Claude with similar prompts → wasted complexity
- The benefit of multi-agent comes from genuinely different roles, not from giving agents distinct names

**3. Cost matters and tasks are simple**
- Each agent adds LLM calls; per-task cost compounds
- A 5-agent crew running a simple task may cost 5× a single-agent setup with no quality gain

**4. Debugging matters and the system isn't critical**
- Multi-agent traces are harder to read than single-agent traces
- The cognitive overhead of "which agent did what when" exceeds the benefit in most cases

**5. The team is small and the system needs to ship**
- Multi-agent complexity slows development
- Iteration cycles are longer; quality regressions are harder to attribute

**Single-agent alternatives** that often beat multi-agent:
- **Self-refine** (Madaan 2023): one agent, multiple prompting modes — generator + critic in sequence within a single agent
- **Better tool design** (Ch 28): atomic tools that compose, rather than tool-using subagents
- **Better system prompts**: explicit step-by-step instructions instead of step-by-step agent delegation
- **Single-agent with memory**: persistent state in a single loop instead of state spread across agents

**Required code** — `<RunnableCode>` showing honest comparison:

```python
# Compare a multi-agent solution to a single-agent solution for the same task.
# Demonstrates the chapter's central honesty: multi-agent often isn't worth it.

def multi_agent_solve(question):
    print(f"\\n--- Multi-agent ({question}) ---")
    calls = 0
    print(f"  [researcher] looking up '{question}'...");      calls += 1
    print(f"  [summarizer] processing findings...");          calls += 1
    print(f"  [formatter] producing final response...");       calls += 1
    print(f"  Total LLM calls: {calls}")
    print(f"  Estimated cost: ${calls * 0.01:.2f}")
    return calls


def single_agent_solve(question):
    print(f"\\n--- Single-agent ({question}) ---")
    calls = 0
    print(f"  [agent] looking up + summarizing + formatting in one prompt...")
    calls += 1
    print(f"  Total LLM calls: {calls}")
    print(f"  Estimated cost: ${calls * 0.01:.2f}")
    return calls


question = "What's the GDP of Bhutan?"
mc = multi_agent_solve(question)
sc = single_agent_solve(question)

print(f"\\n=== Comparison ===")
print(f"Multi-agent: {mc} calls (~${mc * 0.01:.2f})")
print(f"Single-agent: {sc} call (~${sc * 0.01:.2f})")
print(f"Multi-agent is {mc / sc:.1f}× more expensive")
print(f"\\nQuality: roughly equivalent for this kind of simple task.")
print(f"\\nMulti-agent earns its place ONLY when roles are genuinely distinct.")

# Observations:
# - 3× cost for negligible quality gain on simple tasks
# - The "multi-agent trap": treating a single-prompt task as multi-agent
# - When to actually use multi-agent: tasks with distinct expertise needs
# - Most "complex" tasks fit in a single ReAct loop with good tools
```

**The 80/20**:
- **80% of multi-agent designs** in the wild would work better as single-agent ReAct loops
- **20% of cases** genuinely benefit — usually adversarial workflows, role specialization, or genuine parallelism
- **Most "I want multi-agent" instincts** are actually "I want better single-agent prompting"

**When multi-agent IS worth it**:
- Adversarial workflows where the judge truly benefits from a separate context (debate, code review)
- Genuinely parallel tasks with no inter-dependencies
- Long-horizon work with stable, distinct expertise (legal + medical + engineering review)
- Cases where the role count is genuinely > 2 and roles genuinely don't overlap

**Required callout** — type `warning`: **MC8 from research.md.** "Multi-agent enables emergent intelligence." Speculative and largely unsubstantiated. **No widely-replicated evidence** that multi-agent setups produce capabilities qualitatively beyond their constituent agents. Generative-agent simulations produce *believable* behavior; "intelligence beyond constituents" is mostly anthropomorphic interpretation. **Be cautious about emergence claims**; the prior should be skeptical.

**Connection forward:** Section 8 takes stock of Phase 15's last remaining chapter.

### Section 8: One chapter remains

**Heading:** `## One chapter remains`
**Word target:** ~400
**Sub-headings:** `### Phase 15 status`, `### Ch 30 closes the curriculum`

**Teaching beats:**

**Phase 15 status**:

| Chapter | Topic | Status |
|---------|-------|--------|
| Ch 27 | Agent foundations | ✅ |
| Ch 28 | Agents from scratch | ✅ |
| **Ch 29 (this)** | **Multi-agent** | (closing here) |
| Ch 30 | Agent eval and frameworks | ⬜ (closes the curriculum) |

**Ch 30** brings everything full-circle. **Phase 14's evaluation discipline** (Ch 26) applied to agent systems: how to evaluate agents quantitatively; production benchmarks (SWE-bench, GAIA, OSWorld, τ-bench, BrowseComp); production framework summary (LangSmith, Helicone, Braintrust); deployment patterns; **the curriculum's close.**

**The trajectory**:
- Ch 27 conceptual → Ch 28 engineering → **Ch 29 composition** (you are here) → Ch 30 evaluation
- Each builds on the prior
- The curriculum closes by bringing eval discipline back to bear on the agent systems we've built

**After Ch 30**: the reader has the full stack. **From numpy primitives (Ch 1) through transformer internals (Ch 4-6), pre-training (Ch 7-10), alt architectures (Ch 11-12), post-training (Ch 13-16), inference (Ch 17-19), capabilities (Ch 20-23), safety/interp/eval (Ch 24-26), and agent systems (Ch 27-30) — every layer covered.**

**Sample close** (rewrite in chapter voice):

> Multi-agent is real. **Adversarial workflows improve quality** when the LLM is unreliable as a judge of its own work. **Role specialization helps** when tasks genuinely decompose into distinct expertise. **Long-horizon collaboration** earns its keep when stable role boundaries persist across many tasks. The 2025 framework landscape — CrewAI, AutoGen, OpenAI Swarm, LangGraph, MetaGPT — has produced useful tools for the cases that warrant them. **And generative-agent simulations** (Park 2023) demonstrated that memory + reflection + planning can produce coherent multi-day behavior.
>
> Multi-agent is also overhyped. **80% of multi-agent designs** in the wild would work better as well-designed single-agent ReAct loops. **The "more agents = better" reflex is wrong**; the benefit comes from genuine role differentiation, not from agent count. **The "AGI via multi-agent" framing of 2023** aged poorly; **the "emergent intelligence" framing of 2024** has no replicated evidence. **The honest default is single-agent**; multi-agent is the exception.
>
> **One chapter remains.** Ch 30 evaluates agent systems — bringing Phase 14's evaluation discipline back to bear on Phase 15's composition arc. **And the curriculum closes.** **One chapter from the end.**

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 29, slug: 'ch29-multi-agent', title: 'Multi-agent', partNum: 9, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch29-multi-agent/index.astro && rm src/pages/ch29-multi-agent/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch29-multi-agent/`** renders with:
   - Chapter eyebrow ("Chapter 29") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 4, 7)
   - 2 `<WidgetFrame>` placeholders (sections 2 and 4)
   - At least 5 callouts (section-1 aside, section-3 note, section-4 warning/MC2, section-5 note/MC5, section-6 note/MC4, section-7 warning/MC8 — pick 5)
3. **Sidebar:** Ch 1-28 published; Ch 29 active (draft); Ch 30 dimmed
4. **Prev/next nav at bottom of Ch 29:** prev = Ch 28 (active); next = Ch 30 (disabled)
5. **TOC on Ch 29** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3400 and 4100 words
7. **`npm run typecheck`** passes
8. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 163 and 164 own them.
- ❌ **Do not write exercises.** Session 165 owns.
- ❌ **Do not flip Ch 29's status to `'published'`.** Session 165 owns.
- ❌ **Do not tutorial any single framework.** Name the canon (CrewAI, AutoGen, OpenAI Swarm, LangGraph, MetaGPT) briefly; don't deep-dive.
- ❌ **Do not romanticize generative-agent simulations.** Honest framing only.
- ❌ **Do not predict AGI via multi-agent.** MC8 callout actively pushes back on this.
- ❌ **Do not modify Ch 1-28.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch29-multi-agent/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch29-multi-agent/index.astro 2>/dev/null || true
git commit -m "session 124: Ch 29 prose — multi-agent (the composition chapter; respectful skepticism)"
git push origin main
```

---

## Notes for the session author

**On respectful skepticism as the chapter's tonal anchor:**
The chapter must legitimize multi-agent's real use cases AND push back on the hype. Notes-for-author: "**Respectful skepticism is the harder tone**. Dismissing multi-agent entirely would be wrong; uncritically promoting it would be worse. **The chapter calibrates** — it tells engineers when to reach for multi-agent and (more importantly) when not to."

**On the 80/20 framing as the chapter's signature claim:**
"80% of multi-agent designs would work better as single-agent setups; 20% genuinely benefit." This should appear in the opening, section 1, section 7, and section 8. Notes-for-author: "**This is the chapter's most important framing.** It's a calibration claim that pushes back on the 'more agents = better' reflex without dismissing multi-agent."

**On the architectural vocabulary being established in section 2:**
Manager-worker, peer-to-peer, hierarchical. **The ASCII diagram** anchors the visual structure. Notes-for-author: "**The reader needs vocabulary** for the rest of the chapter. Section 2 establishes it concretely with diagrams and production examples."

**On the marquee 1 widget placement (section 2 — architectures):**
The widget shows 5 architectures side-by-side (including a single-agent baseline as control). Notes-for-author: "**Including the single-agent baseline in the widget is deliberate.** Reader should see that single-agent is one architecture among many — and the recommended default for most tasks."

**On the marquee 2 widget placement (section 4 — role specialization):**
The widget shows multi-agent conversations turn-by-turn (proposer-critic-judge, manager-worker, plan-execute-verify, plus a degenerate failure case). Notes-for-author: "**The conversation viewer makes communication patterns concrete.** Reader sees messages flowing between agents, witnesses how role specialization improves quality, and sees what happens when roles overlap (degenerate scenario)."

**On the 3 runnable code blocks**:
- **Section 2 (manager-worker)**: 35 lines; 3 agents (manager, researcher, calculator) decomposing a task; the comment explicitly notes "Could this be a single agent? YES" — honest framing baked into the code
- **Section 4 (proposer-critic-judge)**: 35 lines; 3-stage adversarial pattern catching a wrong answer (Sydney → Canberra)
- **Section 7 (honest comparison)**: 35 lines; side-by-side multi-agent vs single-agent on a simple lookup; shows the 3× cost differential explicitly

**The progression**: build multi-agent → see when it helps → see when it doesn't. **Reader sees the chapter's central tension in code.**

**On section 6 (Park 2023) being treated with respect AND honest framing:**
Smallville is the most-cited multi-agent paper. The chapter must respect its contributions while honestly noting that **no widespread commercial deployment** has followed. Notes-for-author: "**Smallville is a real intellectual contribution** — the memory + reflection + planning architecture has influenced production single-agent design. **But it's research, not production.** Reader should leave knowing both."

**On section 7 (honest assessment) being the chapter's centerpiece:**
**This is where the chapter earns its keep.** The "five wrong-choice scenarios" + "single-agent alternatives that often win" + the runnable comparison = the most useful content in the chapter for practicing engineers. Notes-for-author: "**Section 7 is the calibration the field needs.** Most engineers will skim sections 2-6 and read section 7 carefully. **Make it count.**"

**On the four callouts pushing back on multi-agent hype:**
- MC2 (more agents ≠ better) in section 4
- MC4 (simulations won't replace NPCs) in section 6
- MC5 (don't pick by stars) in section 5
- MC8 (no emergent intelligence) in section 7

Notes-for-author: "**The four callouts form a coordinated calibration**. Each pushes back on one common piece of multi-agent hype. **Together they teach the reader to be skeptical of multi-agent claims without rejecting the technology.**"

**On the chapter's connection to Ch 30:**
Section 8 explicitly maps Ch 30 as bringing eval discipline back to bear on agent systems. **This connects Phase 14 (the discipline arc) with Phase 15 (the composition arc).** Notes-for-author: "**Ch 30 is the curriculum's closing chapter** — and the reader should know it. **One chapter from the end** is the right framing for section 8."

**Pedagogical claim of the chapter:**
"Multi-agent is real and useful in narrow cases — adversarial workflows (proposer-critic-judge), genuine role specialization, long-horizon collaboration with stable role boundaries, genuinely parallel tasks. **Three primary architectures** (manager-worker, peer-to-peer, hierarchical) and **three communication patterns** (message passing, shared workspace, hub-and-spoke) form the design space. **The 2025 framework landscape** (CrewAI, AutoGen, OpenAI Swarm, LangGraph, MetaGPT) covers most production needs. **Generative-agent simulations** (Park 2023) showed what memory + reflection + planning can do. **And yet**: 80% of multi-agent designs in the wild would work better as well-designed single-agent ReAct loops. **The default should be single-agent**; multi-agent is the exception. **The chapter is a calibration tool** — respectful of multi-agent's contributions, skeptical of its hype, clear about when to reach for it and when not to."

**Phase 15 progress after this session**: Ch 27 ✅; Ch 28 ✅; Ch 29 in progress (2/5 files). **Three sessions remain** to close Ch 29. Then Ch 30 closes the curriculum.

**Curriculum status**: 28 published / 30 total. **Two chapters from the end.**

Build with care. **This chapter is the calibration the multi-agent field needs.**
