# Chapter 27 — Agent foundations: research

> Curated source material for Chapter 27's build sessions. **The opening chapter of Part IX — the curriculum's final arc.** Part VIII closed the discipline arc (safety, interpretability, evaluation). **Part IX is composition** — taking capable, disciplined models and assembling them into systems that observe, think, act, and iterate. This chapter introduces the LLM as an actor: not just a text generator, but a system in a loop with an environment. **The agentic loop** (observe → think → act → observe). **ReAct** (Yao 2022) as the foundational pattern. The **2023 agent boom** (AutoGPT, BabyAGI) and what survived. **Memory and state**. **Common patterns and anti-patterns**. The **agentic stack today** (Anthropic's MCP, LangGraph, OpenAI Assistants). **Single-topic chapter**; uses the **4-file cadence**. **The chapter that turns a chat model into an actor.**

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Agent foundations

**Premise:** Most of the curriculum so far has treated LLMs as text generators — given a prompt, produce a completion. **An agent is something more**: an LLM in a loop with an environment, where outputs become actions, actions produce observations, and observations feed back into the next call. **This chapter is the working-engineer's introduction to that loop.** ReAct as the canonical pattern; AutoGPT and the 2023 boom as cautionary history; memory, state, common patterns and their failure modes; the modern agentic stack.

**The framing:** an agent is operationally three things:
1. **An LLM acting as a controller** — making decisions about what to do next
2. **A set of tools or actions** the LLM can invoke
3. **A loop** that feeds observations back to the LLM for the next decision

**Out of scope (other chapters):**
- Building real agents from scratch in detail (Ch 28)
- Multi-agent orchestration (Ch 29)
- Agent evaluation frameworks in depth (Ch 30)
- Tool implementation details (Ch 21 covered tools)

**In scope and locked:**
- **What an agent is** — operational definition; agent vs chatbot vs tool-using LLM
- **The agentic loop** — observe → think → act → observe; termination conditions
- **ReAct** (Yao 2022) — the foundational pattern; thought-action-observation triples
- **AutoGPT and the 2023 boom** — what it was, why it didn't quite work, lessons that survived
- **Memory and state** — short-term context, long-term memory stores, when each matters
- **Common patterns** — single-agent linear, iterative, hierarchical, with-memory, Reflexion
- **Anti-patterns** — unbounded loops, hallucinated tools, context bloat, over-decomposition
- **The agentic stack** — MCP, LangGraph, OpenAI Assistants, function calling

**Suggested chapter structure** (8 sections):

1. What is an agent? (~400 words)
2. The agentic loop (~500 words)
3. ReAct — the foundational pattern (~600 words)
4. From ReAct to AutoGPT — the 2023 boom (~400 words)
5. Memory and state (~400 words)
6. Patterns and anti-patterns (~500 words)
7. The agentic stack today (~400 words)
8. Part IX: chapter map (~400 words)

Target: ~3600 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Yao et al. 2022 — "ReAct: Synergizing Reasoning and Acting in Language Models"
- **arXiv:** [2210.03629](https://arxiv.org/abs/2210.03629)
- **What it contributed:** **ReAct** — interleave reasoning (chain-of-thought) with actions (tool calls). The thought-action-observation triple. **The foundational agentic pattern**; nearly every modern agent framework builds on this idea.
- **For the chapter:** central reference for section 3.

### Significant Gravitas (Toran Bruce Richards) 2023 — "AutoGPT"
- **GitHub:** [Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT)
- **What it contributed:** **AutoGPT** — open-source autonomous agent that decomposes goals into sub-tasks, executes them via tools, and reflects. **The viral moment for agents in 2023.** Demonstrated both the promise and the limits — most non-trivial tasks ended in unbounded loops or hallucinated successes. **The lessons that survived**: planner-executor decomposition, memory stores, structured tool calls.
- **For the chapter:** central reference for section 4.

### Yohei Nakajima 2023 — "BabyAGI"
- **GitHub:** [yoheinakajima/babyagi](https://github.com/yoheinakajima/babyagi)
- **What it contributed:** A minimal task-driven agent: maintain a task list, execute the highest-priority task with an LLM, generate new tasks from the result, repeat. **Demonstrated the recursive task-decomposition pattern** that became standard in agent frameworks.

### Shinn et al. 2023 — "Reflexion: Language Agents with Verbal Reinforcement Learning"
- **arXiv:** [2303.11366](https://arxiv.org/abs/2303.11366)
- **What it contributed:** **Reflexion** — agents that maintain self-critique memory. After each attempt, the agent writes a verbal reflection ("what I did wrong; what I should try next"). On the next attempt, the reflection is added to context. **A simple but effective pattern for iterative improvement.**

### Park et al. 2023 — "Generative Agents: Interactive Simulacra of Human Behavior"
- **arXiv:** [2304.03442](https://arxiv.org/abs/2304.03442)
- **What it contributed:** **Smallville** — 25 LLM-powered agents living in a simulated town, with memory streams, reflection, and planning. **The most ambitious early agent demonstration**; showed that complex agentic behaviors could emerge from straightforward architectures.

### Wang et al. 2024 — "A Survey on Large Language Model based Autonomous Agents"
- **arXiv:** [2308.11432](https://arxiv.org/abs/2308.11432)
- **What it contributed:** Comprehensive survey of the agent landscape circa 2024 — taxonomy of profile/memory/planning/action modules; case studies; open challenges. **Useful for chapter framing and the agentic stack section.**

### Schick et al. 2023 — "Toolformer: Language Models Can Teach Themselves to Use Tools"
- **arXiv:** [2302.04761](https://arxiv.org/abs/2302.04761)
- **What it contributed:** (Already cited in Ch 21.) Self-supervised tool-use learning. Relevant here as the substrate for ReAct's action step.

### Yao et al. 2023 — "Tree of Thoughts: Deliberate Problem Solving with Large Language Models"
- **arXiv:** [2305.10601](https://arxiv.org/abs/2305.10601)
- **What it contributed:** (Already cited in Ch 20.) Branch-and-evaluate reasoning. Relevant here as a planning pattern adopted by some agent frameworks.

### Anthropic 2024-2025 — "Model Context Protocol" (MCP)
- **Documentation:** [docs.anthropic.com/en/docs/agents-and-tools/mcp](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
- **What it contributed:** **MCP** — an open protocol for connecting LLMs to tools and data sources. Standardizes how agents discover, authenticate, and invoke external capabilities. **The closest thing to a USB-C standard for agents.**

### LangGraph (LangChain) 2024 — agent orchestration framework
- **Documentation:** [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph)
- **What it contributed:** Graph-based agent orchestration; state machines for multi-step agent loops; the dominant open-source agent framework as of 2025.

### OpenAI Assistants API 2023-2024
- **Documentation:** [platform.openai.com/docs/assistants](https://platform.openai.com/docs/assistants)
- **What it contributed:** Managed-agent service with built-in tools (code execution, retrieval, function calling). **Production-grade hosted agents** without needing to build infrastructure.

---

## Core concepts

### Concept 1: What is an agent?

**Operational definition**:

```mdx
<Equation label="27.agent-definition">
$$\text{agent} \;=\; \text{LLM controller} \;+\; \text{tools} \;+\; \text{loop}$$
</Equation>
```

An **agent** is **an LLM acting as a controller in a loop with an environment**. The LLM:
1. **Observes** the current state (initial prompt + any prior observations)
2. **Thinks** about what to do
3. **Acts** by invoking a tool or producing output
4. **Observes** the result
5. **Repeats** until done

**Distinctions**:

| System | What it is | Example |
|--------|-----------|---------|
| **Chat model** | One prompt → one response | "What's the capital of France?" → "Paris." |
| **Tool-using LLM** | One prompt → tool calls within the response | "What's the weather in Tokyo?" → calls weather tool |
| **Agent** | LLM in a loop; can decide to do multiple things; iterates | "Book me a flight to Tokyo for next Tuesday under $1000" — agent searches, compares, drafts, confirms |

**The defining feature** — **iteration and decision-making across multiple turns.** An agent decides what to do next; a chat model just responds.

**Why this matters now**:
- **Capable models exist** (Part VII) — but capability ≠ agency
- **Tools are mature** (Ch 21) — but tool use ≠ planning
- **Production needs require composition** — most real tasks are multi-step
- **The trajectory of 2023-2025** — frontier labs are investing heavily in agentic capabilities; agents are the next deployment frontier

**Empirical scale (early 2025)**:
- **GAIA scores** (from Ch 26): frontier agents 60-75% on multi-step real-world tasks
- **SWE-bench Verified**: frontier agents ~50% on real GitHub issues
- **Production deployments**: Anthropic Claude Code, OpenAI's o1 agent variants, GitHub Copilot Workspace, Cursor, Devin, Aider
- **Open-source ecosystem**: LangChain (~100k stars), AutoGPT (~170k stars), LangGraph, CrewAI, AutoGen

### Concept 2: The agentic loop

**The canonical agentic loop**:

```text
┌─────────────────┐
│  Initial prompt │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Observation   │────▶│   LLM controller │
└─────────────────┘     │  (reason/decide) │
         ▲              └────────┬─────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         │              │  Action (tool    │
         │              │  call OR output) │
         │              └────────┬─────────┘
         │                       │
         └───────────────────────┘
              (next observation)
```

**Components of the loop**:

1. **Initial state** — the user's request plus any system context
2. **Controller call** — LLM reasons about the current state and decides on an action
3. **Action execution** — tool is called, code is run, or final answer is produced
4. **Observation** — the result of the action becomes input for the next iteration
5. **Termination** — agent decides it's done; or hits max iterations; or fails

**Termination conditions**:
- **Success**: agent produces a final answer
- **Max iterations**: hit a hard cap (preventing runaway loops)
- **Budget exhausted**: token / cost limit reached
- **Error**: unrecoverable failure (e.g., tool returned an error the agent can't fix)
- **Human interrupt**: user cancels

**Why termination is hard**:
- The agent decides when it's done — but its judgment can be wrong
- **Premature termination**: agent gives up before completing the task
- **Late termination**: agent loops forever, refining unnecessarily
- **Hallucinated success**: agent claims to be done when it isn't

**The deceptively simple structure** hides most of the engineering complexity in agents. The loop itself is a dozen lines; making it work reliably is months of edge-case handling.

### Concept 3: ReAct — the foundational pattern

**The ReAct pattern** (Yao et al. 2022):

Interleave **reasoning** (chain-of-thought from Ch 20) with **actions** (tool calls from Ch 21). The agent produces structured output:

```text
Thought: I need to find the current weather in Tokyo.
Action: weather_lookup(city="Tokyo")
Observation: 18°C, partly cloudy

Thought: Good. Now I need today's date for context.
Action: get_current_date()
Observation: 2025-05-22

Thought: I have what I need. The weather in Tokyo today (May 22, 2025) is 18°C and partly cloudy.
Action: final_answer("Today in Tokyo: 18°C, partly cloudy.")
```

**Why ReAct works**:
- **Reasoning grounds actions** — the agent thinks about why it's calling a tool before calling it
- **Actions ground reasoning** — the observations correct any mistakes in the model's thinking
- **Composability** — multi-step tasks decompose naturally into thought-action-observation triples
- **Inspectability** — the trace is human-readable; failures are diagnosable

**ReAct in code** (sketch — full implementation in section 3's runnable):

```python
def react_agent(task, tools, max_iterations=10):
    history = [f"Task: {task}"]
    for _ in range(max_iterations):
        response = llm(prompt + "\\n".join(history))
        thought, action = parse_react(response)
        history.append(f"Thought: {thought}")
        history.append(f"Action: {action}")
        if action.startswith("final_answer"):
            return parse_answer(action)
        observation = execute_action(action, tools)
        history.append(f"Observation: {observation}")
    return "Max iterations reached without final answer."
```

**Variations on ReAct**:
- **Plan-and-execute**: produce a full plan first, then execute steps (less iterative; more structured)
- **Reflexion** (Shinn 2023): after each failure, write a verbal reflection that goes into context for the next attempt
- **Tree-of-Thoughts** (Yao 2023): branch the thought process; explore multiple reasoning paths

**Why ReAct is the default**:
- Simple to implement
- Works with any LLM that supports CoT + tool calls
- The output format is human-readable
- Failure modes are visible

### Concept 4: From ReAct to AutoGPT — the 2023 boom

**The 2023 agent boom**:

In March-April 2023, AutoGPT was released as an open-source project. It quickly became the most-starred GitHub repo of the year. **The pitch**: tell an LLM your goal, and it autonomously breaks it into sub-tasks and executes them.

**AutoGPT's architecture**:
1. User specifies a goal
2. LLM generates an initial task list
3. LLM picks the next task and executes it (with tools)
4. LLM updates the task list based on results
5. Repeat until the LLM decides the goal is met

**What worked**:
- **Task decomposition** — the planner-executor pattern proved useful
- **Tool integration** — file I/O, web browsing, code execution
- **The vision** — autonomy is a useful framing for many real-world tasks
- **Open source momentum** — sparked the broader agent ecosystem (LangChain, LangGraph, BabyAGI)

**What didn't work**:
- **Unbounded loops** — agents would refine endlessly without finishing
- **Hallucinated successes** — agents would claim "done" without actually completing the task
- **Context bloat** — long task histories overflowed the context window
- **Cost** — running agents until completion was expensive
- **Error recovery** — agents struggled to recover from tool failures
- **No grounding** — agents would generate plans disconnected from real-world constraints

**The lessons that survived**:
- **Planner-executor decomposition** — separating planning from execution makes both more tractable
- **Memory stores** — agents need external memory to handle long horizons
- **Structured tool calls** — JSON schemas instead of free-text actions
- **Bounded iteration** — explicit max-step limits prevent runaway loops
- **Human-in-the-loop checkpoints** — letting humans approve key decisions improves reliability

**Where the field went**: from end-to-end autonomous agents back to **bounded agents with human oversight**. The 2025 production-grade agent looks more like Claude Code (developer-supervised) than AutoGPT (fully autonomous).

### Concept 5: Memory and state

**The memory problem**:
LLMs have **no persistent state across calls**. Each agentic loop call is a fresh API request. **State must be reconstructed each time** — usually by passing it in the prompt.

**Short-term memory** (in-context):
- **Conversation history**: all prior turns in the current loop
- **Pros**: simple; LLM sees everything; reasoning has full context
- **Cons**: context window is finite; long conversations get truncated; cost scales with history length

**Long-term memory** (external):
- **Vector databases** (Ch 22) — store past observations as embeddings; retrieve relevant ones
- **Summary memory** — periodically summarize older history into a shorter representation
- **Structured memory** — key-value stores for facts the agent should remember
- **Episodic memory** — past complete task traces, retrieved when relevant

**When to use long-term memory**:
- **Long-horizon tasks** — anything that won't fit in a single context window
- **Persistent agents** — agents that operate across multiple user sessions
- **Self-improvement** — Reflexion-style learning from past failures
- **Personalization** — agents that adapt to user preferences over time

**Memory in practice (2025)**:
- **Anthropic Memory** — built-in cross-conversation memory
- **OpenAI Assistants** — thread-based memory with file attachments
- **LangChain memory modules** — modular memory implementations
- **Custom solutions** — most production agents roll their own memory layer

**The memory tradeoff**:
- More memory → more context → more cost → more potential confusion
- Less memory → smaller context → faster/cheaper → may forget important details
- **The right amount of memory is task-specific.**

### Concept 6: Patterns and anti-patterns

**Common patterns**:

**Pattern 1 — Single-agent linear**:
- One agent, one task, one execution path
- Used for: simple tasks where the path is obvious (translate, summarize, classify with tools)
- Example: "Look up the current price of AAPL and report it"

**Pattern 2 — Single-agent iterative (ReAct loop)**:
- One agent, looping until it decides to stop
- Used for: multi-step tasks with unknown depth (research, debugging, coding)
- Example: "Write a Python script to scrape this website and save the data"

**Pattern 3 — Hierarchical (planner + executor)**:
- One agent plans; another (or the same in different mode) executes
- Used for: complex tasks where planning matters (project management, multi-step workflows)
- Example: "Build me a Twitter clone in Next.js" → planner decomposes into tasks; executor implements each

**Pattern 4 — Reflexion (self-critique)**:
- After failure, agent writes a verbal critique that goes into context for retry
- Used for: tasks where iteration improves performance (coding, math, complex reasoning)
- Example: SWE-bench-style agents that retry with reflections from prior attempts

**Pattern 5 — Multi-agent (preview of Ch 29)**:
- Multiple agents with different roles cooperate
- Used for: tasks that decompose into specialized expertise
- Example: a research-agent + critic-agent + writer-agent pipeline

**Common anti-patterns**:

**Anti-pattern 1 — Unbounded loops**:
- No max-iteration cap; agent loops forever refining
- **Fix**: explicit cap; cost budget; output stability detector

**Anti-pattern 2 — Hallucinated tool outputs**:
- Agent fabricates what a tool would return instead of actually calling it
- **Fix**: structured tool calls with required JSON schemas; validation of tool responses

**Anti-pattern 3 — Context bloat**:
- Every observation appended to context; runs out of window
- **Fix**: summarization; rolling window; structured memory

**Anti-pattern 4 — Over-decomposition**:
- Agent generates a 50-task plan for a simple problem
- **Fix**: bias the planner toward shorter plans; require justification for sub-tasks

**Anti-pattern 5 — No error handling**:
- Tool fails; agent doesn't recover; entire task aborts
- **Fix**: explicit error-handling instructions in the system prompt; retry with backoff

**Anti-pattern 6 — Premature termination**:
- Agent claims to be done when it isn't
- **Fix**: verification step; "are you sure?" check; human approval for final answers

**Anti-pattern 7 — Hallucinated progress**:
- Agent claims to have completed steps without actually doing them
- **Fix**: ground claims in observable tool outputs; demand evidence

### Concept 7: The agentic stack today (2025)

**The modern agentic stack**:

**Layer 1 — Models**:
- Frontier LLMs with strong tool use: Claude Sonnet/Opus, GPT-4 family, Gemini Pro
- Specialized fine-tunes: Claude Code, GitHub Copilot models, Cursor's fine-tunes

**Layer 2 — Tool protocols**:
- **MCP (Model Context Protocol)** — Anthropic's open standard for tool/data connections
- **Function calling** — OpenAI's structured-output approach; widely adopted
- **OpenAPI integration** — REST APIs auto-converted to tool schemas

**Layer 3 — Agent frameworks**:
- **LangGraph** — graph-based agent orchestration; explicit state machines
- **CrewAI** — multi-agent collaboration framework
- **AutoGen** (Microsoft) — multi-agent conversation framework
- **Swarm** (OpenAI) — lightweight multi-agent orchestration
- **Custom** — most production agents are bespoke implementations

**Layer 4 — Hosted services**:
- **Anthropic Claude Code** — coding agent built on Claude with file/terminal access
- **OpenAI Assistants API** — managed agent service with built-in tools
- **OpenAI o1 / o3** — reasoning-first models with implicit agentic structure
- **Cursor / Aider / Continue** — coding-focused agent products
- **Devin** — autonomous SWE agent (Cognition AI)

**Layer 5 — Production patterns**:
- **Bounded autonomy**: agents act within constrained scopes with human oversight
- **Tool-use first, agency second**: most production "agents" are tool-using LLMs with light iteration
- **Specialized > general**: domain-specific agents (coding, customer support, data analysis) outperform general-purpose ones

**Where the field is in 2025**:
- Production agents work well in **constrained, well-defined domains** (coding, customer service, data lookup)
- They struggle with **open-ended, long-horizon tasks** (writing a startup business plan, conducting research)
- **Anthropic, OpenAI, Google** are all investing heavily — frontier capability is moving fast
- The **autonomous-AGI framing** of 2023 has given way to **bounded-agent-with-oversight** framing of 2025

### Concept 8: Part IX chapter map

**Part IX (Agents) — the curriculum's final arc**:

| Chapter | Topic | What it covers |
|---------|-------|----------------|
| **Ch 27 (this chapter)** | Agent foundations | The agentic loop, ReAct, AutoGPT, memory, patterns |
| **Ch 28** | Agents from scratch | Building real agents: tool implementation, error recovery, scaffolding |
| **Ch 29** | Multi-agent | Orchestration, agent-to-agent communication, role specialization |
| **Ch 30** | Agent eval and frameworks | How to evaluate agents (connecting back to Ch 26); production frameworks; the curriculum's close |

**The arc completes**:
- **Part VII (Capabilities)** — what individual models can do
- **Part VIII (Disciplines)** — making capable development trustworthy
- **Part IX (Composition)** — assembling models into systems

**Why agents close the curriculum**: they're the **highest level of composition** — combining capability (Part VII), discipline (Part VIII), and orchestration into systems that act in the world. **After Ch 30, the reader has the full stack** from numpy primitives (Ch 1) to production agent systems.

**The trajectory of this chapter into Ch 28**:
- Ch 27 (this chapter) — **conceptual**: what an agent is and how the loop works
- Ch 28 — **engineering**: actually build agents end-to-end with real tools

---

## Glossary

- **Agent**: an LLM acting as a controller in a loop with an environment
- **Agentic loop**: observe → think → act → observe cycle
- **ReAct**: reasoning + acting; the foundational agent pattern (Yao 2022)
- **AutoGPT**: 2023 open-source autonomous agent project
- **BabyAGI**: minimal task-driven agent (Nakajima 2023)
- **Reflexion**: self-critique loop pattern (Shinn 2023)
- **Tool**: an action the agent can invoke (function, API call, etc.) — Ch 21
- **Action**: a specific invocation of a tool with arguments
- **Observation**: the result of an action
- **Thought**: the agent's reasoning between observations and actions
- **Controller**: the LLM that decides what to do next
- **Planner-executor**: an architecture pattern where one component plans and another executes
- **Hierarchical agent**: agents organized in a hierarchy (manager + workers)
- **Multi-agent**: multiple agents collaborating (Ch 29)
- **Memory**: state preserved across loop iterations
- **Short-term memory**: in-context conversation history
- **Long-term memory**: external store (vector DB, summary, structured)
- **MCP**: Model Context Protocol — Anthropic's tool/data connection standard
- **Function calling**: structured tool invocation (OpenAI's approach)
- **Termination condition**: criterion for ending the loop
- **Max iterations**: explicit cap on loop iterations
- **Unbounded loop**: agent loops without termination — an anti-pattern
- **Hallucinated tool output**: agent fabricates a tool's response — anti-pattern
- **Context bloat**: agent's context exceeds available tokens — anti-pattern
- **Premature termination**: agent quits before finishing — anti-pattern
- **Bounded autonomy**: agents constrained to a limited scope of action

---

## Pedagogical analogies

### 1. Agent as employee with a job description
A chat model is a question-answerer. **An agent is an employee** — given a goal, they figure out the steps, do them, ask for help when stuck, and report when done. **The job description** (system prompt) defines scope; **the tools** (computer, phone, calendar) define capability; **the iteration** (multi-step work) is what makes them an agent rather than a question-answerer.

Best used for: section 1.

### 2. ReAct as a science notebook
A scientist running an experiment doesn't just take measurements — they also write down their reasoning. "I expect X because Y; here's the measurement; the measurement is Z, which means Y was wrong, so now I'll try W." **ReAct's thought-action-observation triples are the same pattern** applied to LLM agents.

Best used for: section 3.

### 3. The agentic loop as a feedback control system
Engineers know feedback control: sense → decide → actuate → sense. **An agentic loop is the LLM-powered version** of the same pattern. The LLM is the controller; the tools are the actuators; the observations are the sensors. **The control-theory framing makes termination, stability, and oscillation problems familiar.**

Best used for: section 2.

### 4. AutoGPT as the Wright Brothers' first powered flight
The Wright Flyer didn't fly far, didn't carry passengers, and crashed on its first non-test attempt — but it **proved that powered flight was possible** and started a field. **AutoGPT was the same for autonomous agents** — it didn't reliably complete tasks, but it demonstrated the pattern and sparked the entire agent ecosystem.

Best used for: section 4.

### 5. Memory as the difference between an intern and a senior engineer
An intern given a task today and the same task next week will start from scratch. **A senior engineer remembers** — past mistakes, project context, user preferences. **Agent memory systems are the difference** between agents that re-learn every interaction and agents that accumulate context.

Best used for: section 5.

---

## Common misconceptions

### MC1: "An agent is just a chat model with tools."
**Reality:** false. **The defining feature of an agent is iteration** — making multiple decisions across multiple turns, with the ability to incorporate observations into future actions. **A tool-using chat model is still single-turn**; an agent is the loop wrapped around it.

### MC2: "ReAct was the first agent framework."
**Reality:** false. **Tool-using LLMs** existed earlier (e.g., Toolformer, instructed-prompting agents). **ReAct's contribution was the formal interleaving** of reasoning with action — making the pattern explicit and replicable. **Earlier work** showed it could work; ReAct showed how to do it well.

### MC3: "AutoGPT was a failure."
**Reality:** mixed. **AutoGPT didn't reliably complete most non-trivial tasks** — that's true. But **it succeeded as a paradigm-shaper** — it sparked the broader agent ecosystem, validated the planner-executor pattern, and put autonomous agents on the industry agenda. **"Failure to ship" ≠ "failure to influence."**

### MC4: "More memory always helps."
**Reality:** false. **Long context bloats the prompt, raises cost, and can confuse the model.** Effective agents balance memory against focus — keep recent context detailed; summarize older context; retrieve only when needed. **The right amount of memory is task-specific.**

### MC5: "Multi-agent systems are better than single-agent."
**Reality:** false in general. **Multi-agent introduces coordination overhead, communication failures, and harder debugging.** Single-agent systems with good tools and memory often outperform multi-agent systems for the same task. **Multi-agent earns its keep only for tasks that genuinely decompose into specialized roles.** Covered in Ch 29.

### MC6: "Agents will replace developers."
**Reality:** debatable; current evidence: false. **As of 2025, agents work well in narrow, well-defined coding tasks** (refactoring, test generation, bug fixes with clear specs). **Open-ended development, architectural decisions, novel design** remain firmly human-led. **The 2025 production reality is agent-augmented developers, not agent-replaced developers.**

### MC7: "Agent frameworks save you from building anything yourself."
**Reality:** partially true. **Frameworks (LangGraph, CrewAI, etc.) handle the loop structure** — they don't handle your specific domain, tools, or failure modes. **Most production agents are 80% custom code** with a framework providing the scaffolding.

### MC8: "An agent's autonomy is the goal."
**Reality:** false in production. **Bounded autonomy is the production goal** — agents should be as autonomous as the task allows, but no more. **Human-in-the-loop checkpoints, explicit scope limits, and oversight mechanisms** are the difference between a useful agent and a runaway system. **2025's production agents emphasize bounded autonomy.**

---

## Tricky implementation details

### TID1: Parsing ReAct output
ReAct relies on the LLM producing structured output (Thought/Action/Observation). **Parsing is fragile** — LLMs vary in how they format. Modern alternatives use JSON / function-calling instead of text parsing.

### TID2: Tool schema design
A tool's JSON schema determines whether the LLM can call it correctly. **Common pitfalls**: ambiguous parameter names, missing required fields, no examples in descriptions, too many parameters. **Best practices**: short clear descriptions; one or two examples; minimal required fields.

### TID3: Error handling
When a tool fails, the agent's next move matters. **Options**: retry with same args (rarely works); retry with modified args; pick a different tool; report failure to user. **The system prompt should specify the policy.**

### TID4: Context window management
Long loops can blow past context limits. **Strategies**: summarize older turns; keep only the last N observations; use external memory for facts; prune redundant content.

### TID5: Cost management
Each loop iteration costs tokens. **Budget controls**: max iterations; max tokens; cost cap; early termination if no progress.

### TID6: Termination detection
Knowing when to stop is hard. **Heuristics**: explicit "final answer" action; consecutive identical outputs (oscillation); max iterations; user interrupt.

### TID7: Tool authentication
Real-world tools need credentials. **Patterns**: pre-configured credentials; OAuth flows initiated by the user; per-tool scoping; never put credentials in tool descriptions (they appear in the prompt).

### TID8: Concurrency and parallel tool calls
Modern agents support parallel tool calls (call multiple tools in one turn). **Benefits**: faster execution. **Pitfalls**: race conditions; harder error handling; harder to reason about state.

### TID9: State serialization
Persistent agents need to save/restore state. **What to serialize**: conversation history; tool definitions; user preferences; pending tasks. **What NOT to serialize**: credentials; tool implementations themselves.

### TID10: Observability and debugging
When an agent fails, the trace is the only diagnostic. **Production practices**: log every thought/action/observation; tag spans with iteration numbers; alert on unusual patterns (high iteration count, repeated tool failures, cost spikes).

---

## Reference implementations

### A minimal ReAct agent

```python
# A minimal ReAct agent implementation.
# Demonstrates the canonical loop pattern; real agents add error handling,
# parsing robustness, parallel tool calls, observability, etc.

import re

# Mock tools — real agents use actual APIs
def tool_weather(city):
    """Mock weather lookup."""
    return f"18°C, partly cloudy in {city}"

def tool_date():
    """Mock current date."""
    return "2025-05-22"

def tool_calculator(expression):
    """Eval a math expression."""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"Error: {e}"


TOOLS = {
    'weather': tool_weather,
    'date': tool_date,
    'calculator': tool_calculator,
}


def mock_llm(prompt):
    """
    Mock LLM that produces ReAct-style output.
    Real implementation: call Claude or GPT-4 with a system prompt
    that requests Thought/Action format.
    """
    # In production, this would be an API call.
    # For demo: deterministic responses based on the task.
    if 'weather' in prompt.lower() and 'Tokyo' not in prompt:
        return "Thought: I should check the weather.\\nAction: weather(\"Tokyo\")"
    if 'Tokyo' in prompt and 'date' not in prompt.lower():
        return "Thought: Now I need the date for context.\\nAction: date()"
    if '2025-05-22' in prompt:
        return "Thought: I have everything. Time to finalize.\\nAction: final_answer(\"Today in Tokyo (May 22, 2025): 18°C, partly cloudy.\")"
    return "Action: final_answer(\"Unable to complete the task.\")"


def parse_react(text):
    """Extract thought and action from LLM output."""
    thought_match = re.search(r'Thought:\\s*(.+?)(?=\\nAction:|$)', text, re.DOTALL)
    action_match = re.search(r'Action:\\s*(.+?)(?=\\n|$)', text, re.DOTALL)
    thought = thought_match.group(1).strip() if thought_match else ''
    action = action_match.group(1).strip() if action_match else ''
    return thought, action


def execute_action(action_str, tools):
    """Parse 'tool_name(args)' and execute."""
    match = re.match(r'(\\w+)\\((.*)\\)', action_str)
    if not match:
        return f"Error: malformed action '{action_str}'"
    tool_name, args = match.group(1), match.group(2)
    if tool_name == 'final_answer':
        return None   # signal to stop
    if tool_name not in tools:
        return f"Error: unknown tool '{tool_name}'"
    # Naive args parsing — strip quotes
    cleaned_args = args.strip().strip('"').strip("'")
    try:
        if cleaned_args:
            return tools[tool_name](cleaned_args)
        return tools[tool_name]()
    except Exception as e:
        return f"Error: {e}"


def react_agent(task, tools=TOOLS, max_iterations=8):
    history = [f"Task: {task}"]
    for i in range(max_iterations):
        prompt = "\\n".join(history)
        response = mock_llm(prompt)
        thought, action = parse_react(response)
        
        print(f"\\n--- Iteration {i+1} ---")
        print(f"Thought:     {thought}")
        print(f"Action:      {action}")
        
        history.append(f"Thought: {thought}")
        history.append(f"Action: {action}")
        
        if action.startswith('final_answer'):
            answer = re.search(r'final_answer\\(["\\'](.+)["\\']\\)', action)
            if answer:
                final = answer.group(1)
                print(f"\\n=== Final answer: {final}")
                return final
            return "Done"
        
        observation = execute_action(action, tools)
        print(f"Observation: {observation}")
        history.append(f"Observation: {observation}")
    
    print(f"\\n=== Max iterations reached.")
    return "Unable to complete the task."


# Run
result = react_agent("What's the weather in Tokyo, and what date is it today?")
```

### Agent with conversation memory

```python
# Agent that maintains memory across multiple tasks within a session.
# Memory: rolling window of recent observations + structured fact store.

class AgentMemory:
    def __init__(self, max_recent=10):
        self.recent_observations = []   # rolling window
        self.facts = {}                  # structured key-value store
        self.max_recent = max_recent
    
    def add_observation(self, observation):
        self.recent_observations.append(observation)
        if len(self.recent_observations) > self.max_recent:
            self.recent_observations.pop(0)
    
    def remember_fact(self, key, value):
        """Store a fact for long-term retrieval."""
        self.facts[key] = value
    
    def recall_fact(self, key):
        return self.facts.get(key, None)
    
    def summarize(self):
        """Return a string summary for context."""
        parts = []
        if self.facts:
            parts.append("Facts I remember:")
            for k, v in self.facts.items():
                parts.append(f"  - {k}: {v}")
        if self.recent_observations:
            parts.append("Recent observations:")
            for obs in self.recent_observations[-5:]:
                parts.append(f"  - {obs}")
        return "\\n".join(parts)


def memory_agent(tasks, memory=None):
    """Process a list of tasks while accumulating memory."""
    if memory is None:
        memory = AgentMemory()
    
    for task in tasks:
        print(f"\\n=== Task: {task}")
        print(f"Memory context:")
        print(memory.summarize() or "  (empty)")
        
        # Real implementation: call LLM with task + memory.summarize() in prompt
        # For demo, hard-code the agent's actions:
        if "name is" in task.lower():
            name = task.split("name is")[-1].strip().rstrip('.')
            memory.remember_fact('user_name', name)
            print(f"-> Stored: user_name = {name}")
        elif "what's my name" in task.lower():
            name = memory.recall_fact('user_name')
            if name:
                print(f"-> Answer: Your name is {name}")
            else:
                print(f"-> Answer: I don't have your name on record")
        elif "the weather is" in task.lower():
            memory.add_observation(task)
            print(f"-> Stored as recent observation")
    
    return memory


# Test: a multi-turn session
session_tasks = [
    "My name is Alex.",
    "The weather is rainy today.",
    "The weather is sunny tomorrow.",
    "What's my name?",
]
memory = memory_agent(session_tasks)
print(f"\\n=== Final memory state ===")
print(memory.summarize())

# Observations:
# - Short-term memory: rolling window of recent observations
# - Long-term memory: structured fact store
# - Real production: vector DB for episodic retrieval; LLM-summarized
#   context windows; per-user persistent state
```

### Error handling pattern

```python
# Agent with robust error handling for tool failures.

def flaky_tool(input_str):
    """A tool that sometimes fails — to demonstrate error handling."""
    import random
    if random.random() < 0.4:
        raise ConnectionError("Tool service unavailable")
    return f"Result for: {input_str}"


def execute_with_retry(tool, input_str, max_retries=3):
    """Retry pattern with exponential backoff."""
    import time
    for attempt in range(max_retries):
        try:
            return tool(input_str), None
        except Exception as e:
            wait = 2 ** attempt
            print(f"  Attempt {attempt + 1} failed: {e}. Waiting {wait}s...")
            time.sleep(wait * 0.001)   # short waits for demo
    return None, f"Failed after {max_retries} attempts"


def robust_agent(tasks, tool, max_iterations=5):
    """Agent that handles tool failures gracefully."""
    results = []
    for task in tasks:
        print(f"\\nProcessing: {task}")
        result, error = execute_with_retry(tool, task)
        if error:
            print(f"  ⚠️  Skipping task: {error}")
            results.append(None)
        else:
            print(f"  ✓ {result}")
            results.append(result)
    return results


# Test
import random
random.seed(42)
tasks = ['query A', 'query B', 'query C', 'query D']
results = robust_agent(tasks, flaky_tool)
print(f"\\n=== Summary ===")
print(f"Tasks completed: {sum(1 for r in results if r is not None)}/{len(tasks)}")

# Observations:
# - Naive agents abort on first tool failure
# - Robust agents retry with backoff
# - Production patterns add: circuit breakers, fallback tools,
#   error categorization (retryable vs not), structured error reporting
```

---

## Connections to other chapters

- **Ch 12 (Pretraining)**: agentic capabilities emerge from large-scale pretraining
- **Ch 14 (Post-training)**: RLHF and tool-use fine-tuning shape agent behavior
- **Ch 19 (Sampling)**: temperature affects agent decision diversity
- **Ch 20 (Reasoning)**: chain-of-thought is the "Thought" component of ReAct
- **Ch 21 (Tool use)**: the substrate for the "Action" component
- **Ch 22 (RAG)**: retrieval is a special case of tool use; vector DBs are agent memory
- **Ch 23 (Multimodal)**: multimodal agents (computer use, vision-enabled tools)
- **Ch 24 (Safety)**: agentic safety — bounded autonomy, oversight, manipulation resistance
- **Ch 25 (Interpretability)**: monitoring agents via interpretability tools
- **Ch 26 (Evaluation)**: SWE-bench, GAIA, OSWorld — agent benchmarks
- **Ch 28**: actually build agents from scratch (this chapter's next step)
- **Ch 29**: multi-agent orchestration
- **Ch 30**: agent evaluation in depth — closes the curriculum

---

## Open questions for the chapter author

### Q1: How much code in the chapter prose?
**Recommendation:** moderate. Section 3's ReAct implementation should appear in code; sections 5 and 6 also benefit from short code blocks. **Don't crowd out the conceptual content.**

### Q2: How critical of AutoGPT?
**Recommendation:** honest but historical. **AutoGPT didn't reliably complete tasks** — that's true. **But it shaped the field** — also true. **Frame it as a historic moment** that revealed both promise and limits, not as a failure or a triumph.

### Q3: How much MCP?
**Recommendation:** moderate. **Mention MCP as the emerging standard** for tool/data integration; one paragraph in section 7. **Don't tutorial it** — that's for documentation.

### Q4: How much LangGraph / LangChain?
**Recommendation:** moderate. **Name them** in section 7 as the dominant open-source frameworks; **don't endorse or tutorial.** Engineers will pick based on their stack.

### Q5: How much on AGI / agent autonomy debates?
**Recommendation:** brief. **Mention the 2023 autonomy framing and how it shifted to 2025's bounded-autonomy framing.** Don't dive into philosophy or AI-safety debates — those touch the chapter but aren't its focus.

### Q6: Widget candidates
1. **Agentic Loop Visualizer (marquee):** step through a ReAct agent's loop over a multi-step task; show thoughts/actions/observations accumulating; visualize the loop structure. **Recommended marquee.**
2. **Pattern Catalog (secondary):** show 4-5 common agent patterns side-by-side (single linear, ReAct iterative, hierarchical, Reflexion, multi-agent preview). **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 27 is a **single-topic chapter**. Uses the **4-file cadence**.

Planned file layout:
- File 150: research (this)
- File 151: page structure (~750 lines, 8 sections; runnables embedded)
- File 152: Agentic Loop Visualizer marquee widget
- File 153: Pattern Catalog secondary widget + exercises + closeout (slot 154 absorbed)

**Pedagogical outcomes for the reader.** After Ch 27, the reader should be able to:
1. Define an agent operationally — controller + tools + loop
2. Diagram the agentic loop (observe → think → act → observe)
3. Implement a minimal ReAct agent
4. Articulate why AutoGPT mattered despite not reliably completing tasks
5. Decide when to use short-term vs long-term memory
6. Recognize common agent patterns and anti-patterns
7. Name the layers of the 2025 agentic stack
8. Locate themselves in Part IX's chapter map and understand the trajectory

Eight outcomes. Exercises hit outcomes 3, 5, 6, 8.

**Tonal framing**: engineering with honest limits. **Agents are useful for narrow, well-defined tasks** with bounded autonomy and human oversight. **Open-ended autonomous agents remain unsolved.** Concrete numbers (GAIA at 60-75% for frontier, SWE-bench at ~50%, BabyAGI/AutoGPT GitHub stars) and **honest tradeoffs** (autonomy vs reliability; single-agent vs multi-agent; framework vs custom). **No overhype** about agent capabilities; **no underhype** about how much production progress has happened in 2024-2025.

**Part IX opening framing**: this is the curriculum's final arc. **Reader has reached the chapters that compose everything** they've learned. The end is in sight — four chapters remain.

**Importance**: agents are the production deployment frontier of 2024-2026. **Most engineers reading this curriculum will need to build or work with agents.** This chapter gives them the foundational vocabulary, patterns, and anti-patterns. **Ch 28 (Agents from scratch) builds on this conceptual foundation.** Part IX closes the curriculum.
