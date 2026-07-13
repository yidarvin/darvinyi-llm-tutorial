# Chapter 29 — Multi-agent: research

> Curated source material for Chapter 29's build sessions. **The composition chapter of Part IX.** Where Ch 27 gave the conceptual foundation and Ch 28 the engineering toolkit, this chapter is about **when one agent isn't enough.** Multi-agent architectures (manager-worker, peer-to-peer, hierarchical); communication patterns (shared workspaces, message passing, blackboard); role specialization (proposer-critic-judge); the 2025 framework landscape (CrewAI, AutoGen, OpenAI Swarm, LangGraph multi-actor); generative-agent simulations (Park 2023 Smallville); honest assessment of multi-agent's production reality. **Two-topic chapter**; uses the **5-file cadence**. **The chapter that composes everything that came before — and honestly admits how rarely that composition is the right answer.**

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Multi-agent

**Premise:** Single-agent systems (linear, ReAct, Reflexion) cover most production use cases. **Multi-agent systems** earn their place when tasks genuinely decompose into specialized roles, when adversarial dynamics (proposer/critic) improve quality, or when agents must collaborate at scale. The 2023-2024 multi-agent hype produced impressive demos (AutoGPT, BabyAGI, generative simulations) but **few production deployments at the time of writing**. This chapter covers the architectural vocabulary, communication patterns, framework landscape, and — crucially — when multi-agent is genuinely the right call versus when it's a worse single-agent design in disguise.

**The framing:** multi-agent done well requires:
1. **Genuine task decomposition** into distinct expertise/role needs
2. **Clear communication protocols** between agents
3. **A coordinator/orchestrator** or clear convention for who decides when
4. **Honest assessment** of whether a better single-agent design would suffice

**Out of scope (other chapters):**
- The single-agent loop and ReAct (Ch 27)
- Tool design and implementation (Ch 28)
- Agent evaluation (Ch 30 — closes the curriculum)
- General LLM capabilities (Ch 20-23)

**In scope and locked:**
- **When to use multi-agent** (and the much-larger when-not)
- **Architectures**: manager-worker, peer-to-peer, hierarchical
- **Communication patterns**: shared workspaces, message passing, blackboard
- **Role specialization**: proposer/critic/judge; divider/finder/explainer
- **2025 frameworks**: CrewAI, AutoGen, OpenAI Swarm, LangGraph multi-actor
- **Generative-agent simulations**: Park 2023 Smallville
- **Production reality**: honest framing of what's actually shipping in 2025

**Suggested chapter structure** (8 sections):

1. When multi-agent is actually warranted (~500 words)
2. Architectures (~600 words)
3. Communication patterns (~500 words)
4. Role specialization (~500 words)
5. The 2025 framework landscape (~500 words)
6. Generative-agent simulations (~400 words)
7. The honest assessment — when NOT to use multi-agent (~500 words)
8. One chapter remains (~400 words)

Target: ~3900 words plus 2 widgets and 3 runnable code blocks.

**Tonal anchor:** **respectful skepticism.** Multi-agent is a powerful and under-deployed tool in some contexts (long-horizon adversarial workflows, genuine role specialization) and a heavily-overhyped one in most (chat assistants, task automation, coding). The chapter should respect the field's genuine contributions while pushing back hard on the "more agents = better" reflex.

---

## Key papers and references

### Park et al. 2023 — "Generative Agents: Interactive Simulacra of Human Behavior"
- **Paper:** [arxiv.org/abs/2304.03442](https://arxiv.org/abs/2304.03442)
- **What it contributed:** Smallville — 25 generative agents simulated daily life in a small town, with memory, reflection, planning. **Most-cited multi-agent paper of 2023.** Demonstrated that agents with memory + reflection produce believable social behavior.
- **Cross-reference for**: memory architectures (Ch 27), agent simulations (this chapter).

### Significant 2023-2024 — "AutoGPT" (covered in Ch 27)
- Cross-reference for: planner-executor decomposition; the 2023 viral moment that sparked multi-agent interest.

### Wu et al. 2023 — "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation"
- **Paper:** [arxiv.org/abs/2308.08155](https://arxiv.org/abs/2308.08155)
- **What it contributed:** Microsoft Research framework for multi-agent conversation. Agents communicate by exchanging messages; conversation is the orchestration primitive. **One of the most-adopted multi-agent frameworks.**

### CrewAI documentation 2024
- **Site:** [docs.crewai.com](https://docs.crewai.com)
- **What it contributed:** Role-based multi-agent framework. **Define agents by role + goal + backstory; combine them into "crews"** with sequential or hierarchical execution.

### OpenAI 2024 — "Swarm"
- **Repository:** [github.com/openai/swarm](https://github.com/openai/swarm)
- **What it contributed:** Lightweight multi-agent orchestration. **Agents hand off to each other via function calls**; routing is the core primitive. Marked as "experimental" but widely studied.

### LangGraph documentation 2024-2025
- **Site:** [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph)
- **What it contributed:** Graph-based agent orchestration. **Multi-agent as graph nodes with edges between them.** Supports both single and multi-agent setups; graph mental model is the framework's signature.

### Hong et al. 2024 — "MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework"
- **Paper:** [arxiv.org/abs/2308.00352](https://arxiv.org/abs/2308.00352)
- **What it contributed:** Multi-agent system with **SOP (standardized operating procedures) baked in**: agents fill roles like Product Manager, Architect, Engineer. **Highlighted that structure beats free-form for many multi-agent tasks.**

### Du et al. 2023 — "Improving Factuality and Reasoning in Language Models through Multiagent Debate"
- **Paper:** [arxiv.org/abs/2305.14325](https://arxiv.org/abs/2305.14325)
- **What it contributed:** Empirical evidence that **multi-agent debate** (multiple LLM instances debating an answer) improves factuality on hard tasks. Foundation for the proposer-critic-judge pattern.

### Madaan et al. 2023 — "Self-Refine" (cross-reference)
- **Paper:** [arxiv.org/abs/2303.17651](https://arxiv.org/abs/2303.17651)
- **What it contributed:** Iterative self-critique within a single agent. Cross-reference for: when role specialization can be done by *one* agent in *different* prompting modes rather than multiple agents.

### Anthropic 2024-2025 — Computer Use blog posts
- **Resource:** [anthropic.com/news/3-5-models-and-computer-use](https://anthropic.com/news/3-5-models-and-computer-use)
- **What it contributed:** Computer-use agents that can drive a desktop UI. **Sometimes orchestrate sub-agents for sub-tasks** — a recent production multi-agent example.

### Erman, Hayes-Roth, Lesser, and Reddy 1980 — "The Hearsay-II Speech-Understanding System" (historical)
- Pre-LLM origin of the blackboard pattern: shared write-and-read workspace for multiple expert systems, built in the 1970s. **Multi-agent LLM systems often rediscover this architecture.**

---

## Core concepts

### Concept 1: When multi-agent is actually warranted

**The default assumption should be single-agent.** A well-designed single-agent setup (Ch 27 patterns + Ch 28 engineering) handles the vast majority of production tasks. **Multi-agent is the exception, not the rule** — and most multi-agent demos would work better as single-agent designs.

**Multi-agent earns its place** when:

**1. Genuine role specialization exists**
- The task decomposes into truly distinct expertise (research, writing, code review, legal review)
- Different roles need different prompts, tools, or constraints
- A single prompt managing all roles would be unwieldy

**2. Adversarial dynamics improve quality**
- Proposer/critic/judge patterns where one agent generates and another critiques
- Self-debate scenarios (Du et al. 2023)
- Tasks where the LLM is unreliable on its own answers but reliable as a judge

**3. Long-horizon collaboration is required**
- Days-long workflows with stable role boundaries
- Memory and state belonging to specific roles
- Persistent specialization across many tasks

**4. Parallelism is genuinely useful**
- Subtasks that can truly run in parallel (research multiple topics; review multiple PRs)
- Speed gains from concurrent execution that justify orchestration overhead

**Empirical evidence (early 2025)**:
- **Most production "agents"** are single-agent ReAct loops with multiple tools
- **AutoGen, CrewAI, MetaGPT** have impressive demos but limited production traction relative to their GitHub stars
- **Multi-agent debate** (Du et al. 2023) shows measurable improvements on hard reasoning tasks
- **Generative-agent simulations** (Park 2023) are research demos; no widespread production use
- **Anthropic Claude Code** is fundamentally single-agent

**The default to challenge**: "I have a complex task; therefore I need multiple agents." **Reality:** most "complex" tasks decompose into a single ReAct loop with the right tools.

### Concept 2: Architectures of multi-agent systems

**Three primary architectures** appear in production:

**1. Manager-worker (orchestrator-executor)**
- One manager agent receives the user task; decomposes into subtasks; assigns to workers
- Workers execute their assigned subtask; return result to manager
- Manager combines results into a final answer

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

**Common variations**:
- **Sequential**: workers execute one at a time, each seeing prior results
- **Parallel**: workers execute concurrently; manager aggregates
- **Hierarchical**: workers themselves manage sub-workers

**Production use**: MetaGPT (Product Manager → Architect → Engineer); LangGraph supervisor pattern; CrewAI sequential crews.

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

### Concept 3: Communication patterns

**How agents talk to each other** is as important as the architecture. **Three patterns** dominate:

**1. Direct message passing**
- Agent A sends an explicit message to Agent B
- Includes the sender, recipient, and message content
- Most flexible; easiest to reason about; most LLM-call-expensive

```python
# Simplified
manager.send(to="researcher", content="Look up Bhutan population.")
researcher.send(to="manager", content="787,000 (2024 estimate).")
```

**2. Shared workspace (blackboard)**
- All agents read and write to a shared state object
- Agents pull what they need; push their contributions
- Lower per-message overhead; harder to reason about who's seeing what

```python
workspace = {
    'task': 'Compute Bhutan population density',
    'population': None,
    'area': None,
    'density': None,
}
# Agents read from workspace; write their contributions
```

**3. Hub-and-spoke**
- One central agent (the hub) coordinates communication
- Other agents only talk to the hub, not each other
- Common in manager-worker architectures

**Choice factors**:
- **Number of agents**: > 4 agents → shared workspace; ≤ 4 → direct messaging
- **Privacy/scoping**: do agents need to see each other's reasoning? → direct messaging
- **Determinism**: shared workspace is harder to make deterministic
- **Debugging**: message passing has natural sequence; workspace has snapshots

**Frameworks' choices**:
- **AutoGen**: message passing (conversation logs)
- **CrewAI**: shared workspace + sequential task execution
- **LangGraph**: graph state object (shared workspace pattern)
- **OpenAI Swarm**: handoffs (direct message passing with role switching)

### Concept 4: Role specialization

**The most useful multi-agent pattern in practice** isn't general-purpose collaboration — it's **structured role specialization** where each role has a clear, narrow responsibility.

**Classic patterns**:

**Proposer-critic-judge (Du et al. 2023)**
- **Proposer**: generates a candidate answer
- **Critic**: critiques the answer; identifies errors or weaknesses
- **Judge** (optional): decides whether the critique is valid; produces final answer

**Why this works**: LLMs are often better critics than generators. Separating the roles lets each operate in a focused mode.

**Plan-execute-verify**
- **Planner**: generates a step-by-step plan
- **Executor**: runs each step using tools
- **Verifier**: checks that steps were completed correctly

**Why this works**: planning and execution have different cognitive demands; verification benefits from a fresh perspective.

**Divider-finder-explainer**
- **Divider**: breaks the user's question into sub-questions
- **Finder**: searches for information answering each sub-question
- **Explainer**: synthesizes findings into a coherent answer

**Why this works**: each role has a single, narrow task; the LLM is good at each in isolation but worse when trying to do all three at once.

**Role specialization done well**:
- Each role has a **clearly different prompt** (not "same prompt, different name")
- Each role has **role-appropriate tools** (researcher gets search; reviewer gets validators)
- **Output formats are agreed upon** between roles (JSON schemas, structured messages)
- **Termination is explicit** (judge decides; max rounds; consensus)

**Role specialization done badly**:
- Three agents with identical prompts and tools — wasted LLM calls
- Roles that overlap heavily — confused responsibilities
- No clear termination — infinite back-and-forth

### Concept 5: The 2025 framework landscape

**The dominant multi-agent frameworks** as of early 2025:

**CrewAI**
- **Design**: define agents by role + goal + backstory; combine into crews
- **Execution**: sequential or hierarchical; tasks assigned by manager
- **Strengths**: easy onboarding; expressive role definitions
- **Weaknesses**: opinionated structure; harder to deviate from the role-based model
- **Production use**: moderate; popular for prototyping

**AutoGen (Microsoft)**
- **Design**: agents communicate by exchanging messages; conversation is the primary primitive
- **Execution**: group chats; nested chats; human-in-the-loop options
- **Strengths**: flexible; supports many architectures; tight Microsoft integration
- **Weaknesses**: verbose configuration; conversation logs can sprawl
- **Production use**: moderate; common in Microsoft ecosystem

**OpenAI Swarm (experimental)**
- **Design**: lightweight handoffs; agents transfer control via function calls
- **Execution**: routing-as-orchestration
- **Strengths**: minimal abstractions; close to the bare metal
- **Weaknesses**: explicitly marked experimental; smaller community
- **Production use**: limited; popular for learning

**LangGraph (LangChain)**
- **Design**: explicit graph of agents/nodes with shared state
- **Execution**: graph traversal; supports cycles for iterative workflows
- **Strengths**: explicit control flow; persistence; state management
- **Weaknesses**: steep learning curve; verbose for simple cases
- **Production use**: high; popular for complex workflows

**MetaGPT**
- **Design**: SOPs (standard operating procedures) baked in; agent roles like PM/Architect/Engineer
- **Execution**: phase-driven; each role has defined inputs/outputs
- **Strengths**: structure for software-development workflows
- **Weaknesses**: rigid; less useful outside software-engineering tasks
- **Production use**: limited; mostly research

**Custom implementations**
- **Reality**: many production multi-agent systems are bespoke code that uses one of the above as scaffolding (or none at all)
- **Common pattern**: LangGraph or AutoGen for orchestration + custom prompts/tools per role

**Framework choice factors**:
- **Team familiarity**: stick with what your team knows
- **Complexity needs**: LangGraph for complex graphs; CrewAI for role-based; AutoGen for conversation-driven
- **Production maturity**: LangGraph and AutoGen have the most production-tested code
- **Lock-in concern**: write framework-agnostic role logic; let the framework be plumbing

### Concept 6: Generative-agent simulations

**Park et al. 2023** is the most-cited multi-agent paper of recent years. **Smallville** — 25 generative agents living in a simulated town — produced believable emergent social behavior: agents organized parties, formed relationships, had conversations that referenced past events.

**The architecture**:
- **Memory stream**: each agent records every observation as a memory record
- **Retrieval**: agents retrieve relevant memories when deciding what to do
- **Reflection**: periodically, agents synthesize lower-level memories into higher-level insights
- **Planning**: agents create daily plans, refine them in response to new observations

**What it demonstrated**:
- LLMs + memory + reflection can produce coherent multi-day behavior
- Emergent social dynamics arise from individual-level reasoning
- The complexity of social behavior comes from interaction, not from any one agent

**Beyond Smallville (2024-2025)**:
- Game NPCs with generative agents (multiple research projects, limited commercial deployment)
- Negotiation simulations between specialized agents
- Multi-agent debate environments

**Production reality (2025)**:
- **Generative-agent simulations remain research demos**
- **No widespread commercial deployment** as of early 2025
- The patterns (memory + reflection + planning) **influence production single-agent design** more than they drive standalone multi-agent products

**Why simulations stay in research**:
- Cost per simulated agent-day is significant
- Failure modes are emergent and hard to debug
- Use cases that justify the cost are narrow

### Concept 7: The honest assessment — when NOT to use multi-agent

**The most important section of the chapter.** Multi-agent is genuinely useful in narrow cases — and dramatically overused everywhere else.

**Multi-agent is the wrong choice when**:

**1. A single agent with the right tools would work**
- "I need an agent to search, summarize, and report" → single ReAct loop with three tools
- "I need an agent to plan and execute" → single ReAct loop; the LLM is good at both within one prompt
- "I need an agent that's careful" → add a self-critique step within the same loop, not a separate critic agent

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

**The 80/20 of multi-agent**:
- **80% of multi-agent designs** would work better as single-agent ReAct loops
- **20% of cases** genuinely benefit from multi-agent — usually adversarial workflows or long-horizon role specialization
- **Most "I want multi-agent" instincts** are actually "I want better single-agent prompting"

**Single-agent alternatives** that often beat multi-agent:
- **Self-refine** (Madaan 2023): one agent, multiple prompting modes — generator + critic in sequence
- **Better tool design** (Ch 28): atomic tools that compose, rather than tool-using subagents
- **Better system prompts**: explicit step-by-step instructions instead of step-by-step agent delegation
- **Single-agent with memory**: persistent state in a single loop instead of state spread across agents

**When multi-agent IS worth it**:
- Adversarial workflows where the judge truly benefits from a separate context (debate, code review)
- Genuinely parallel tasks with no inter-dependencies (research N topics independently)
- Long-horizon work with stable, distinct expertise (legal + medical + engineering)
- Cases where the role count is genuinely > 2 and the roles genuinely don't overlap

### Concept 8: One chapter remains

**Part IX status**:

| Chapter | Topic | Status |
|---------|-------|--------|
| Ch 27 | Agent foundations | ✅ |
| Ch 28 | Agents from scratch | ✅ |
| **Ch 29 (this)** | **Multi-agent** | (closing here) |
| Ch 30 | Agent eval and frameworks | ⬜ (closes the curriculum) |

**What's left**:
- **Ch 30 (Agent eval and frameworks)** — how to evaluate agents quantitatively (bringing Ch 26's eval discipline back to bear); production frameworks summarized; deployment patterns; **the curriculum's close**

**The trajectory**:
- Ch 27 conceptual → Ch 28 engineering → **Ch 29 composition** (you are here) → Ch 30 evaluation
- Each builds on the prior
- The curriculum closes by bringing eval discipline (Part VIII) to bear on the composition arc

**After Ch 30**: the reader has the full stack — numpy primitives (Ch 1) → transformer internals (Ch 4-6) → pretraining (Ch 7-10) → alt architectures (Ch 11-12) → post-training (Ch 13-16) → inference (Ch 17-19) → capabilities (Ch 20-23) → safety/interp/eval (Ch 24-26) → agent systems (Ch 27-30).

---

## Glossary

- **Multi-agent system (MAS)**: a system where multiple LLM-driven agents cooperate or compete to complete tasks
- **Manager-worker**: an architecture with one orchestrator and multiple workers
- **Peer-to-peer**: an architecture where all agents are equals; communication is direct
- **Hierarchical**: nested manager-worker structures (managers managing managers)
- **Message passing**: communication pattern where agents send explicit messages to each other
- **Shared workspace (blackboard)**: communication pattern where agents read/write a shared state
- **Hub-and-spoke**: communication pattern with one central agent
- **Role specialization**: assigning distinct roles (researcher, critic, etc.) to different agents
- **Proposer-critic-judge**: a three-role pattern for adversarial improvement
- **Plan-execute-verify**: a three-role pattern for separating planning, execution, and verification
- **Self-refine**: single-agent alternative — one agent operating in different prompting modes
- **Generative-agent simulation**: research paradigm where many agents inhabit a simulated environment
- **SOPs (standard operating procedures)**: structured workflows baked into multi-agent designs (MetaGPT)
- **Handoff**: in OpenAI Swarm, an agent transferring control to another agent via function call
- **Group chat**: in AutoGen, multiple agents conversing in a shared thread

---

## Pedagogical analogies

### 1. Multi-agent as teams in an organization
A well-functioning team has clear roles, defined communication channels, and explicit handoff procedures. **Multi-agent systems mirror these patterns.** A team where everyone does the same job is wasted headcount; a team with overlapping responsibilities is dysfunctional. **The same is true for agent crews.**

Best used for: section 4.

### 2. Multi-agent as microservices
Microservice architectures emerged when monoliths became unwieldy. **Multi-agent emerges when single-agent prompts become unwieldy.** And just like microservices: the overhead is real (orchestration, communication, debugging); use them only when the monolith genuinely doesn't work. **Most teams that adopt microservices regret it.** Most multi-agent designs face the same regret curve.

Best used for: sections 1 and 7.

### 3. Multi-agent debate as scientific peer review
Scientific peer review works because **proposers and critics have different incentives and contexts.** Multi-agent debate exploits the same dynamic: an LLM generating an answer is in a different mode than the same LLM evaluating one. **The separation of roles is the source of the improvement.**

Best used for: sections 4 (role specialization) and 7 (when multi-agent IS worth it).

### 4. Shared workspace as a kitchen
Imagine a restaurant kitchen: multiple chefs, one prep station, one stove, one pass. **Everyone reads the same orders; everyone contributes to the same dishes.** That's a shared workspace — efficient for many tasks, chaotic for some.

Best used for: section 3.

### 5. Generative-agent simulations as The Sims
Park 2023's Smallville is essentially "The Sims, but with LLMs." **Believable social behavior emerges from individual-level reasoning.** Best used for: section 6.

---

## Common misconceptions

### MC1: "Multi-agent is the future of LLM systems."
**Reality:** uncertain. **Single-agent setups dominate production as of early 2025.** Multi-agent has genuine use cases (debate, role specialization, long-horizon teams) but is heavily overhyped relative to its production traction. **Predicting "the future" of AI architectures has a poor track record** — 2023's "AGI via AutoGPT" framing aged poorly.

### MC2: "More agents = better results."
**Reality:** false. **More agents = more cost, more latency, more failure modes, and rarely more quality.** A 5-agent crew with similar prompts is typically worse than one well-prompted agent. The quality benefit comes from genuine role differentiation, not from agent count.

### MC3: "Multi-agent debate always improves accuracy."
**Reality:** partially true. **Du et al. 2023 showed improvements on hard reasoning tasks**, but the gains are task-specific and not free (5-10× cost). For easy tasks, debate doesn't help; for tasks where the LLM is unreliable as a judge, it can hurt.

### MC4: "Generative-agent simulations will replace game NPCs."
**Reality:** speculative. **Park 2023 is impressive research**; production game deployments remain limited. Cost per simulated character-hour is high; failure modes are unpredictable; designers want more control than emergent behavior provides. **2024-2025 saw some commercial experiments; widespread adoption remains in the future.**

### MC5: "Pick the framework with the most stars."
**Reality:** misleading. **Star counts measure curiosity, not production utility.** CrewAI has many stars; production deployments are moderate. **Choose based on team familiarity, complexity needs, and production track record** — not popularity.

### MC6: "Frameworks save engineering effort."
**Reality:** partially true. **Frameworks save scaffolding effort** (message routing, state management); **they don't save prompt engineering, tool design, or evaluation effort** — which is most of the work. **Custom code on top of a thin framework is more common than full-framework adoption.**

### MC7: "If a problem is hard, use multi-agent."
**Reality:** usually wrong. **Hard problems are usually hard because of the task structure, not because of single-agent limits.** Better tools, better prompts, better memory often beat multi-agent for "hard" tasks. **Multi-agent helps when the task has genuine role decomposition; otherwise it adds complexity without benefit.**

### MC8: "Multi-agent enables emergent intelligence."
**Reality:** speculative and largely unsubstantiated. **No widely-replicated evidence** that multi-agent setups produce capabilities qualitatively beyond their constituent agents. Generative-agent simulations produce *believable* behavior; "intelligence beyond constituents" is mostly anthropomorphic interpretation. **Be cautious about emergence claims**; the prior should be skeptical.

---

## Tricky implementation details

### TID1: Termination in peer-to-peer setups
Peer-to-peer architectures need explicit termination criteria: max rounds, consensus detection, "we're done" signal. **Without these, agents loop indefinitely** — a common production failure.

### TID2: Cost accounting across multiple agents
Each agent makes LLM calls; per-task cost is sum across all agents. **Budget enforcement requires aggregated tracking**, not per-agent budgets that don't communicate.

### TID3: Shared workspace consistency
When multiple agents write to a shared workspace, race conditions emerge if execution is parallel. **Either serialize writes or accept that the workspace state is eventually-consistent.**

### TID4: Handoff context
When agent A hands off to agent B, what context goes? Too much: context bloat. Too little: B can't do its job. **Handoff context design is the multi-agent analog of prompt design.**

### TID5: Multi-agent debugging
Standard agent traces (Ch 28's flame graph) don't naturally show inter-agent communication. **Multi-agent debugging tools** (LangSmith, custom) need to render the inter-agent layer explicitly.

### TID6: Convergence vs divergence
In peer-to-peer debate, agents can converge on a wrong answer faster than a single agent would reach the right one. **Group dynamics are a real failure mode** — multiple agents reinforcing each other's errors.

### TID7: Framework lock-in
Each framework defines its own agent abstraction. **Migrating between frameworks is costly.** Write role logic (prompts, tool definitions) framework-agnostically; let the framework be plumbing only.

### TID8: Memory architecture for multi-agent
Each agent has its own memory; shared memory needs explicit design. **Park 2023's memory streams** are one design; others exist (shared vector DB, structured shared facts). **No single best answer**; task-dependent.

### TID9: Role conflicts and overlapping responsibilities
When roles are unclear, agents disagree about who should act. **Explicit role boundaries** in system prompts prevent this; the cost is verbosity.

### TID10: Human-in-the-loop in multi-agent
Where does the human interject? Reviewing every message is impractical; reviewing none defeats the purpose. **Common pattern**: human approves manager decisions; manager doesn't approve worker decisions.

---

## Reference implementations

### Minimal manager-worker setup

```python
# A minimal manager-worker multi-agent setup.
# The manager decomposes the task; workers execute; manager aggregates.

class Agent:
    """Simplified agent: just a system prompt and a callable."""
    def __init__(self, name: str, system_prompt: str, callable):
        self.name = name
        self.system_prompt = system_prompt
        self.callable = callable
    
    def respond(self, message: str) -> str:
        """Mock LLM call. Real version: call Claude/GPT-4 with the system prompt."""
        return self.callable(self.system_prompt, message)


# Mock LLM behaviors for each role
def manager_brain(system_prompt, message):
    if 'decompose' in system_prompt:
        if 'Bhutan' in message:
            return 'Subtasks:\\n1. researcher: Find population of Bhutan\\n2. researcher: Find area of Bhutan in km²\\n3. calculator: Compute population / area'
        return 'Subtasks:\\n1. researcher: General lookup\\n2. calculator: Compute result'
    if 'aggregate' in system_prompt:
        return 'Final answer: Bhutan has ~20.5 people/km² (787,000 / 38,394).'
    return ''


def researcher_brain(system_prompt, message):
    if 'population' in message.lower():
        return '787,000 (2024 estimate)'
    if 'area' in message.lower():
        return '38,394 km²'
    return 'No result'


def calculator_brain(system_prompt, message):
    # Naive extraction; real: structured input
    if '787000' in message.replace(',', '') or '787,000' in message:
        return '20.5 people per km²'
    return 'Compute error'


# Set up the team
manager = Agent('manager', 'You decompose tasks and aggregate results.', manager_brain)
researcher = Agent('researcher', 'You look up facts.', researcher_brain)
calculator = Agent('calculator', 'You compute math.', calculator_brain)

WORKERS = {'researcher': researcher, 'calculator': calculator}


def run_manager_worker(user_task: str):
    print(f"User task: {user_task}\\n")
    
    # Step 1: manager decomposes
    plan = manager.respond(f"decompose: {user_task}")
    print(f"=== Manager plan ===\\n{plan}\\n")
    
    # Step 2: workers execute
    results = []
    for line in plan.split('\\n'):
        if ':' not in line or not line.strip().startswith(('1', '2', '3', '4', '5')):
            continue
        try:
            _, body = line.split(':', 1)
            worker_name, subtask = body.strip().split(':', 1)
            worker = WORKERS.get(worker_name.strip())
            if worker:
                result = worker.respond(subtask.strip())
                print(f"  {worker.name}: '{subtask.strip()}' → '{result}'")
                results.append((subtask.strip(), result))
        except ValueError:
            continue
    
    # Step 3: manager aggregates
    summary = '\\n'.join(f"- {q}: {r}" for q, r in results)
    final = manager.respond(f"aggregate:\\n{summary}")
    print(f"\\n=== Manager final ===\\n{final}")


# Run it
run_manager_worker("What's the population density of Bhutan?")

# Observations:
# - Three agents with different roles + different "brains"
# - Manager decomposes; workers execute; manager aggregates
# - Communication: manager-to-worker (assignment), worker-to-manager (result)
# - Could this be a single agent? YES — and probably should be, for this task
# - Multi-agent earns its place when roles are genuinely distinct AND task is complex enough
```

### Proposer-critic-judge pattern

```python
# Adversarial role specialization: proposer generates, critic critiques, judge decides.
# A common pattern for tasks where the LLM is unreliable as a generator but reliable as a judge.

def propose(question):
    """Generate a candidate answer."""
    # Mock: occasionally gets it wrong
    candidates = {
        'capital of australia': 'Sydney',  # wrong; correct is Canberra
        'square root of 144': '12',
        'fastest land animal': 'Cheetah',
    }
    return candidates.get(question.lower(), 'Unknown')


def critique(question, answer):
    """Critique the answer; flag possible errors."""
    # Mock: detects the Sydney error
    if 'capital' in question.lower() and 'australia' in question.lower() and answer == 'Sydney':
        return 'Wrong. Sydney is the largest city, but Canberra is the capital.'
    return 'No issues detected.'


def judge(question, answer, critique_text):
    """Decide whether to accept the answer or use the critique."""
    if 'wrong' in critique_text.lower():
        # Re-propose, taking the critique into account
        if 'capital' in question.lower() and 'australia' in question.lower():
            return 'Canberra'
        return f"[corrected] (was: {answer})"
    return answer


def proposer_critic_judge(question):
    print(f"\\nQuestion: {question}")
    proposal = propose(question)
    print(f"  Proposer:  {proposal}")
    critique_text = critique(question, proposal)
    print(f"  Critic:    {critique_text}")
    final = judge(question, proposal, critique_text)
    print(f"  Judge:     {final}")
    return final


# Run several
questions = [
    'Capital of Australia',
    'Square root of 144',
    'Fastest land animal',
]
for q in questions:
    proposer_critic_judge(q)

# Observations:
# - Proposer can be wrong; critic catches the error; judge produces final answer
# - Each role has a different cognitive task (generate / evaluate / synthesize)
# - Each role could be the same LLM with different system prompts (cheap multi-agent)
# - Or three separate LLM calls in sequence (expensive multi-agent)
# - Du et al. 2023 showed measurable improvements with this pattern
```

### Honest comparison — single-agent vs multi-agent for the same task

```python
# Compare a multi-agent solution to a single-agent solution for the same task.
# Demonstrates the chapter's central honesty: multi-agent often isn't worth it.

# Multi-agent: 3 separate calls
def multi_agent_solve(question):
    print(f"\\n--- Multi-agent ({question}) ---")
    calls = 0
    
    # Researcher
    print(f"  [researcher] looking up '{question}'...")
    calls += 1
    
    # Summarizer
    print(f"  [summarizer] processing findings...")
    calls += 1
    
    # Formatter
    print(f"  [formatter] producing final response...")
    calls += 1
    
    print(f"  Total LLM calls: {calls}")
    print(f"  Estimated cost: ${calls * 0.01:.2f}")
    return calls


# Single-agent: one well-prompted call with tools
def single_agent_solve(question):
    print(f"\\n--- Single-agent ({question}) ---")
    calls = 0
    
    print(f"  [agent] looking up + summarizing + formatting in one prompt...")
    calls += 1
    
    print(f"  Total LLM calls: {calls}")
    print(f"  Estimated cost: ${calls * 0.01:.2f}")
    return calls


# Compare
question = "What's the GDP of Bhutan?"
multi_calls = multi_agent_solve(question)
single_calls = single_agent_solve(question)

print(f"\\n=== Comparison ===")
print(f"Multi-agent: {multi_calls} calls (~${multi_calls * 0.01:.2f})")
print(f"Single-agent: {single_calls} call (~${single_calls * 0.01:.2f})")
print(f"Multi-agent is {multi_calls / single_calls:.1f}× more expensive")
print(f"\\nQuality: roughly equivalent for this kind of simple task.")
print(f"\\nMulti-agent earns its place ONLY when roles are genuinely distinct.")
print(f"For simple lookup/summarize tasks, single-agent is the right answer.")

# Observations:
# - 3× cost for negligible quality gain on simple tasks
# - The "multi-agent trap": treating a single-prompt task as multi-agent
# - When to actually use multi-agent: tasks with distinct expertise needs (research + critique)
# - Most "complex" tasks fit in a single ReAct loop with good tools
```

---

## Connections to other chapters

- **Ch 20 (Reasoning)**: chain-of-thought is the foundation for proposer/critic patterns within a single agent
- **Ch 21 (Tool use)**: workers in manager-worker are tool-using single agents
- **Ch 22 (RAG)**: shared workspaces resemble RAG retrieval over agent state
- **Ch 25 (Interpretability)**: multi-agent traces are higher-dimensional than single-agent; interpretability scales
- **Ch 26 (Evaluation)**: multi-agent evaluation is harder; emergent behaviors evade per-step metrics
- **Ch 27 (Agent foundations)**: single-agent patterns; multi-agent is the composition layer
- **Ch 28 (Agents from scratch)**: tool design, error handling, scaffolding — all amplify in multi-agent
- **Ch 30 (Agent eval and frameworks)**: closes the curriculum; brings eval discipline to agent systems

---

## Open questions for the chapter author

### Q1: How much should the chapter push back on multi-agent hype?
**Recommendation:** firmly but respectfully. **Section 7 should be unambiguous**: most multi-agent designs are wrong choices. **But the chapter must also legitimize multi-agent's real use cases** — adversarial workflows, role specialization, parallel work. **Balance: honest skepticism, not dismissal.**

### Q2: Which framework gets the most attention?
**Recommendation:** balanced coverage. **Name the canon (CrewAI, AutoGen, OpenAI Swarm, LangGraph, MetaGPT) with one-paragraph treatments each.** Don't tutorial any single framework. Engineers will pick based on their stack.

### Q3: How much Park 2023 detail?
**Recommendation:** moderate. **Smallville is the most-cited multi-agent paper of the era and warrants its own section** (~400 words), but the chapter should not over-romanticize simulation work. **Position it as research with lessons that influence single-agent design** rather than a vision of multi-agent's future.

### Q4: How to handle the "AGI via multi-agent" framing?
**Recommendation:** dismiss firmly. **No credible 2025 case** that multi-agent leads to AGI. MC8 callout. **Be a calibration tool against this framing.**

### Q5: Production examples?
**Recommendation:** name concrete examples: Claude Code (single-agent), Cursor (single-agent), Devin (single-agent with sub-task delegation), AutoGen group chats in research, CrewAI prototypes. **Most "production multi-agent" turns out to be single-agent with tools.**

### Q6: Widget candidates
1. **Multi-Agent Topology Explorer (marquee 1):** show 4-5 architectures (single-agent baseline, manager-worker, peer-to-peer, hierarchical, proposer-critic-judge) with diagrams + use cases + tradeoffs. **Like Ch 27's pattern catalog but for multi-agent specifically.** **Recommended as marquee 1.**

2. **Inter-Agent Conversation Viewer (marquee 2):** show a real-looking multi-agent conversation (proposer-critic-judge solving a task; manager-worker decomposing a task) with messages flowing between agents; reader steps through turn by turn. **Like Ch 27's loop visualizer but for multi-agent.** **Recommended as marquee 2.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 29 is a **two-topic chapter**. Uses the **5-file cadence** (slot 166 absorbed).

Planned file layout:
- File 161: research (this)
- File 162: page structure (~850 lines, 8 sections; runnables embedded)
- File 163: Multi-Agent Topology Explorer marquee widget (topic 1: architectures)
- File 164: Inter-Agent Conversation Viewer marquee widget (topic 2: communication/collaboration)
- File 165: exercises + closeout (slot 166 absorbed)

**Pedagogical outcomes for the reader.** After Ch 29, the reader should be able to:
1. Decide when multi-agent is genuinely warranted (vs single-agent)
2. Name and diagram three architectures (manager-worker, peer-to-peer, hierarchical)
3. Pick a communication pattern (message passing, shared workspace, hub-and-spoke) appropriate to the task
4. Apply role specialization patterns (proposer-critic-judge, plan-execute-verify)
5. Survey the 2025 framework landscape and pick one for a given task
6. Articulate what Park 2023 demonstrated and its limits
7. Argue against multi-agent for cases where single-agent suffices
8. Locate Ch 29 within Part IX and anticipate Ch 30's eval focus

Eight outcomes. Exercises hit outcomes 1, 4, 7.

**Tonal anchor**: respectful skepticism. Multi-agent is a real and useful pattern in narrow cases, and overhyped in most. **Honest framing throughout** — the chapter should respect the field's work while pushing back on the "more agents = better" reflex. **Production reality emphasized over speculation.**

**Part IX advancing**: composition layer over Ch 28's engineering and Ch 27's concepts. **Two chapters from the curriculum's end.**

**Importance**: this chapter has unique value because the field is full of multi-agent hype. **Engineers leaving this chapter should know when to and when not to use multi-agent** — a calibration most public discourse fails to provide. **The chapter's "honest assessment" framing is its most important pedagogical contribution.**
