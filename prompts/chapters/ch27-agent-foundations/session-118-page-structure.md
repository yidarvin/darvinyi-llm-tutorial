# Session 118 — Chapter 27 page structure

> First chapter session for Chapter 27 ("Agent foundations"). **The opening chapter of Phase 15 — the curriculum's final arc.** Phase 14 closed the discipline arc (safety, interpretability, evaluation); Phase 15 turns to composition — assembling capable, disciplined models into systems that observe, think, act, and iterate. Eight sections walking from "what is an agent" → the agentic loop → ReAct (marquee widget here) → AutoGPT history → memory and state → patterns and anti-patterns (secondary widget here) → the agentic stack today → Phase 15 chapter map. Single-topic chapter; uses the **4-file cadence**. **The chapter that turns a chat model into an actor.**

---

## Read first (in this order)

1. **`research/ch27-agent-foundations/research.md`** — the source material. Every section, equation, code snippet, and misconception traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch26-evaluation/session-115-page-structure.md`** — for the recent page-structure pattern (and the chapter immediately before this one)
4. **`prompts/chapters/ch21-tool-use/session-???-page-structure.md`** — for context on tool use (Phase 13, the substrate Ch 27 builds on)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 27 page. By end of session:

- `src/pages/ch27-agent-foundations/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch27-agent-foundations/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 27's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch27-agent-foundations/` with sidebar showing Ch 27 active, prev/next nav linking to Ch 26 (active) and Ch 28 (disabled)

**Tonal note:** Ch 27 is **engineering with honest limits.** **Agents are useful for narrow, well-defined tasks** with bounded autonomy and human oversight. **Open-ended autonomous agents remain unsolved.** Concrete numbers (GAIA at 60-75% for frontier; SWE-bench Verified at ~50%; LangChain ~100k stars; AutoGPT ~170k stars) and **honest tradeoffs** (autonomy vs reliability; single-agent vs multi-agent; framework vs custom). **No overhype** about agent capabilities; **no underhype** about how much production progress has happened in 2024-2025. **2025 framing is bounded autonomy with human oversight**, not autonomous-AGI.

**Phase 15 opening position**: this is the curriculum's final arc opening. **Reader has reached the chapters that compose everything they've learned.** Section 8 explicitly maps the four chapters of Phase 15 and signals that the end is in sight. **Four chapters remain.**

**Chapter cadence:** Ch 27 uses the **4-file cadence** (single-topic chapter).

---

## Inputs

State of the repo after session 117 (Ch 26 complete; Phase 14 complete):

- Ch 1-26 all `'published'`
- `research/ch27-agent-foundations/research.md` exists
- `src/lib/chapters.ts` has Ch 1-26 `'published'`, Ch 27-30 `'planned'`
- No `src/pages/ch27-agent-foundations/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch27-agent-foundations/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch27-agent-foundations/index.astro` if it existed
3. **Update** `src/lib/chapters.ts` — change Ch 27's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch27-agent-foundations
description: Agent foundations — the chapter that turns a chat model into an actor. From the operational definition of an agent (LLM controller + tools + loop), through the canonical agentic loop (observe → think → act → observe), ReAct as the foundational pattern (Yao 2022), the 2023 agent boom (AutoGPT, BabyAGI), memory and state, common patterns and anti-patterns, and the 2025 agentic stack (Anthropic MCP, LangGraph, OpenAI Assistants). Opens Phase 15 — the curriculum's final arc: agents from scratch, multi-agent orchestration, and agent evaluation frameworks closing the curriculum.
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

> Phase 14 closed with three disciplines complete: safety (what we want), interpretability (what's there), evaluation (how we measure). **Phase 15 opens here** — and Phase 15 is about composition. Taking capable, disciplined models and assembling them into systems that observe, think, act, and iterate. **This chapter is the foundational one**: what an agent is, what the loop looks like, what worked and what didn't in the 2023 boom, and where the field stands in 2025.
>
> An agent is **an LLM acting as a controller in a loop with an environment.** That's the operational definition this chapter builds on. The LLM observes; thinks; acts (by invoking a tool or producing output); observes again; repeats until done. **ReAct** (Yao 2022) is the canonical pattern — interleave reasoning (chain-of-thought from Ch 20) with actions (tool calls from Ch 21). **AutoGPT** was the 2023 viral moment that proved both the promise and the limits. The **2025 reality** is bounded autonomy with human oversight: production agents like Claude Code, Cursor, Devin, GitHub Copilot Workspace.
>
> The chapter is engineering with honest limits. **Agents work well for narrow, well-defined tasks** — GAIA scores at 60-75% for frontier agents; SWE-bench Verified at ~50%; meaningful production deployments. **Open-ended autonomous agents remain unsolved** — the 2023 framing has given way to 2025's bounded-autonomy framing. **By the end of this chapter, you'll have the conceptual toolkit and the historical context.** Then Ch 28 builds agents from scratch; Ch 29 composes multiple agents; Ch 30 evaluates them — **and closes the curriculum.** **Four chapters from the end.**

### Section 1: What is an agent?

**Heading:** `## What is an agent?`
**Word target:** ~400
**Sub-headings:** `### The operational definition`, `### Distinctions that matter`

**Teaching beats:**

**The operational definition**:

```mdx
<Equation label="27.agent-definition">
$$\text{agent} \;=\; \text{LLM controller} \;+\; \text{tools} \;+\; \text{loop}$$
</Equation>
```

An **agent** is **an LLM acting as a controller in a loop with an environment**:
1. **Observes** the current state (initial prompt + any prior observations)
2. **Thinks** about what to do
3. **Acts** by invoking a tool or producing output
4. **Observes** the result
5. **Repeats** until done

**Distinctions that matter**:

| System | Defining feature | Example |
|--------|-----------------|---------|
| **Chat model** | One prompt → one response | "Capital of France?" → "Paris." |
| **Tool-using LLM** | One prompt → tool calls within the response | "Weather in Tokyo?" → calls weather tool |
| **Agent** | Iteration and decision-making across multiple turns | "Book me a flight to Tokyo for next Tuesday under $1000" — searches, compares, drafts, confirms |

**The defining feature** — **iteration and decision-making.** An agent decides what to do next; a chat model just responds.

**Empirical scale (early 2025)**:
- **GAIA**: frontier agents 60-75% on multi-step real-world tasks (humans ~92%)
- **SWE-bench Verified**: frontier agents ~50% on real GitHub issues
- **Production deployments**: Anthropic Claude Code, GitHub Copilot Workspace, Cursor, Devin, Aider, OpenAI o-series with tool use
- **Open-source ecosystem**: LangChain ~100k stars; AutoGPT ~170k stars

**Required callout** — type `aside`: Agents are not **better chat models**. They're **a different mode of operation** — one where the LLM gets to keep going, keep deciding, keep iterating. **The capability is the loop, not the model.** A weaker model in a well-designed loop can outperform a stronger model used as a one-shot.

**No code in this section.** Setup.

**Connection forward:** Section 2 covers the loop itself.

### Section 2: The agentic loop

**Heading:** `## The agentic loop`
**Word target:** ~500
**Sub-headings:** `### The canonical loop`, `### Components`, `### Termination`

**Teaching beats:**

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
5. **Termination** — agent decides it's done, or hits a limit, or fails

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

**The deceptively simple structure** hides most of the engineering complexity in agents. **The loop itself is a dozen lines; making it work reliably is months of edge-case handling.**

**Required callout** — type `note`: The agentic loop is **the LLM analog of feedback control** — sense → decide → actuate → sense. Engineers from control-systems backgrounds will recognize the pattern; the failure modes (oscillation, divergence, instability) translate directly. **Bounded iteration, output stability detection, and explicit termination criteria are the LLM agent's equivalents of stability margins.**

**No code in this section** (the ReAct runnable in section 3 is where the loop becomes code).

**Connection forward:** Section 3 covers ReAct — the most influential implementation of the loop.

### Section 3: ReAct — the foundational pattern

**Heading:** `## ReAct — the foundational pattern`
**Word target:** ~600 — IMPORTANT
**Sub-headings:** `### Interleaving reasoning and acting`, `### Why it works`, `### Variations`

**Teaching beats:**

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
- **Actions ground reasoning** — observations correct any mistakes in the model's thinking
- **Composability** — multi-step tasks decompose naturally into thought-action-observation triples
- **Inspectability** — the trace is human-readable; failures are diagnosable

**Required widget placeholder** — Agentic Loop Visualizer (marquee, session 152):

```mdx
<WidgetFrame title="Agentic loop visualizer" caption="Step through a ReAct agent's loop over a multi-step task. Watch thoughts, actions, and observations accumulate turn by turn — the canonical agentic pattern in interactive form. Demonstrates the chapter's central operational claim: the LLM's power as an agent comes from the loop, not from any single call. Inspectable, debuggable, and a foundation for everything Phase 15 builds.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 152 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing a minimal ReAct agent:

```python
import re

# Mock tools — real agents use actual APIs
def tool_weather(city):
    return f"18°C, partly cloudy in {city}"

def tool_date():
    return "2025-05-22"

TOOLS = {'weather': tool_weather, 'date': tool_date}


def mock_llm(prompt):
    """
    Mock LLM that produces ReAct-style output.
    Real implementation: call Claude or GPT-4 with a system prompt
    that requests Thought/Action format.
    """
    if 'weather' in prompt.lower() and 'Tokyo' not in prompt:
        return 'Thought: I should check the weather.\\nAction: weather("Tokyo")'
    if 'Tokyo' in prompt and '2025' not in prompt:
        return 'Thought: Now I need the date.\\nAction: date()'
    if '2025-05-22' in prompt:
        return 'Thought: I have everything.\\nAction: final_answer("Today in Tokyo (May 22, 2025): 18°C, partly cloudy.")'
    return 'Action: final_answer("Unable to complete.")'


def parse_react(text):
    thought = re.search(r'Thought:\\s*(.+?)(?=\\nAction:|$)', text, re.DOTALL)
    action = re.search(r'Action:\\s*(.+?)(?=\\n|$)', text, re.DOTALL)
    return (thought.group(1).strip() if thought else '',
            action.group(1).strip() if action else '')


def execute_action(action_str, tools):
    match = re.match(r'(\\w+)\\((.*)\\)', action_str)
    if not match:
        return f"Error: malformed action"
    tool_name, args = match.group(1), match.group(2).strip().strip('"').strip("'")
    if tool_name == 'final_answer':
        return None
    if tool_name not in tools:
        return f"Error: unknown tool '{tool_name}'"
    return tools[tool_name](args) if args else tools[tool_name]()


def react_agent(task, tools=TOOLS, max_iterations=8):
    history = [f"Task: {task}"]
    for i in range(max_iterations):
        response = mock_llm("\\n".join(history))
        thought, action = parse_react(response)
        history.append(f"Thought: {thought}")
        history.append(f"Action: {action}")
        print(f"\\n--- Iteration {i+1} ---")
        print(f"Thought:     {thought}")
        print(f"Action:      {action}")
        if action.startswith('final_answer'):
            answer = re.search(r'final_answer\\(["\\'](.+)["\\']\\)', action)
            return answer.group(1) if answer else "Done"
        observation = execute_action(action, tools)
        print(f"Observation: {observation}")
        history.append(f"Observation: {observation}")
    return "Max iterations reached."


print(f"=== ReAct agent run ===")
result = react_agent("What's the weather in Tokyo, and what date is it today?")
print(f"\\n=== Final: {result}")

# Observations:
# - The loop itself is short; the LLM and parsing handle the complexity
# - Real ReAct uses JSON / function-calling instead of regex parsing
# - Max iterations prevents runaway loops
# - Every step is inspectable — agent failures are diagnosable
```

**Variations on ReAct**:
- **Plan-and-execute**: produce a full plan first, then execute steps (less iterative; more structured)
- **Reflexion** (Shinn 2023): after each failure, write a verbal reflection that goes into context for the next attempt
- **Tree-of-Thoughts** (Yao 2023): branch the thought process; explore multiple reasoning paths

**Why ReAct is the default**: simple, works with any LLM that supports CoT + tool calls, human-readable output, visible failure modes.

**Connection forward:** Section 4 covers the 2023 boom that took ReAct to its viral peak — and revealed its limits.

### Section 4: From ReAct to AutoGPT — the 2023 boom

**Heading:** `## From ReAct to AutoGPT — the 2023 boom`
**Word target:** ~400
**Sub-headings:** `### The viral moment`, `### What worked, what didn't`, `### The lessons that survived`

**Teaching beats:**

**The viral moment**:
In March-April 2023, AutoGPT was released. It quickly became the most-starred GitHub repo of the year (~170k stars). **The pitch**: tell an LLM your goal, and it autonomously breaks it into sub-tasks and executes them.

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
- **Open-source momentum** — sparked the broader agent ecosystem (LangChain, LangGraph, BabyAGI)

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

**Required callout** — type `note`: **MC3 from research.md.** "AutoGPT was a failure." Mixed. **AutoGPT didn't reliably complete tasks** — true. **But it succeeded as a paradigm-shaper** — sparked the agent ecosystem, validated planner-executor decomposition, put autonomous agents on the industry agenda. **"Failure to ship" ≠ "failure to influence."** The 2025 agentic stack exists because of the 2023 boom.

**No code in this section** (the next two sections cover memory and patterns in code).

**Connection forward:** Section 5 covers what made long-horizon agents possible — memory.

### Section 5: Memory and state

**Heading:** `## Memory and state`
**Word target:** ~400
**Sub-headings:** `### Short-term vs long-term`, `### The memory tradeoff`

**Teaching beats:**

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

**The memory tradeoff**:
- More memory → more context → more cost → more potential confusion
- Less memory → smaller context → faster/cheaper → may forget important details
- **The right amount of memory is task-specific.**

**Required code** — `<RunnableCode>` showing an agent with memory:

```python
class AgentMemory:
    def __init__(self, max_recent=10):
        self.recent_observations = []
        self.facts = {}
        self.max_recent = max_recent
    
    def add_observation(self, observation):
        self.recent_observations.append(observation)
        if len(self.recent_observations) > self.max_recent:
            self.recent_observations.pop(0)
    
    def remember_fact(self, key, value):
        self.facts[key] = value
    
    def recall_fact(self, key):
        return self.facts.get(key, None)
    
    def summarize(self):
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
    if memory is None:
        memory = AgentMemory()
    
    for task in tasks:
        print(f"\\n=== Task: {task}")
        print(f"Memory:")
        print(memory.summarize() or "  (empty)")
        
        # Real implementation: LLM call with task + memory.summarize() in prompt
        if "name is" in task.lower():
            name = task.split("name is")[-1].strip().rstrip('.')
            memory.remember_fact('user_name', name)
            print(f"-> Stored: user_name = {name}")
        elif "what's my name" in task.lower():
            name = memory.recall_fact('user_name')
            print(f"-> Answer: {'Your name is ' + name if name else 'Unknown'}")
        else:
            memory.add_observation(task)
            print(f"-> Stored as recent observation")
    return memory


session = [
    "My name is Alex.",
    "The weather is rainy today.",
    "The weather is sunny tomorrow.",
    "What's my name?",
]
memory_agent(session)

# Observations:
# - Short-term memory: rolling window
# - Long-term memory: structured fact store
# - Real production: vector DB; LLM-summarized context windows;
#   per-user persistent state across sessions
```

**Connection forward:** Section 6 covers the patterns that real production agents follow — and the anti-patterns they avoid.

### Section 6: Patterns and anti-patterns

**Heading:** `## Patterns and anti-patterns`
**Word target:** ~500 — IMPORTANT
**Sub-headings:** `### Common patterns`, `### Anti-patterns`, `### Defense-in-depth`

**Teaching beats:**

**Common patterns**:
1. **Single-agent linear** — one agent, one task, one execution path; simple tasks
2. **Single-agent iterative (ReAct)** — one agent, looping; multi-step tasks with unknown depth
3. **Hierarchical (planner + executor)** — one plans; another executes; complex multi-step
4. **Reflexion** (Shinn 2023) — self-critique loops; iterative improvement on failures
5. **Multi-agent** (preview of Ch 29) — multiple agents with specialized roles

**Common anti-patterns**:
1. **Unbounded loops** — no max-iteration cap; agent loops forever
2. **Hallucinated tool outputs** — agent fabricates what a tool would return
3. **Context bloat** — every observation appended; context overflows
4. **Over-decomposition** — agent generates a 50-task plan for a simple problem
5. **No error handling** — tool fails; agent doesn't recover; task aborts
6. **Premature termination** — agent claims done when it isn't
7. **Hallucinated progress** — agent claims to have completed steps without doing them

**Required widget placeholder** — Pattern Catalog (secondary, session 153):

```mdx
<WidgetFrame title="Agent pattern catalog" caption="Five common agent patterns visualized side-by-side: single-agent linear, ReAct iterative, hierarchical planner-executor, Reflexion self-critique, and a multi-agent preview. Each pattern shows the data flow and key tradeoffs. Demonstrates that 'agent' isn't one architecture but a family of them — and the choice matters.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 153 (secondary)
  </div>
</WidgetFrame>
```

**Defense-in-depth** (echoing Ch 24's safety framing):
- No single safeguard catches every failure mode
- **Layered defenses**: max iterations + cost cap + output validation + human-in-the-loop checkpoints
- **Observability**: every thought/action/observation logged; alerts on unusual patterns
- **Bounded autonomy**: production agents act within constrained scopes

**Required code** — `<RunnableCode>` showing error handling pattern:

```python
def flaky_tool(input_str):
    """Tool that sometimes fails."""
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


def robust_agent(tasks, tool):
    results = []
    for task in tasks:
        print(f"\\nProcessing: {task}")
        result, error = execute_with_retry(tool, task)
        if error:
            print(f"  ⚠️  Skipping: {error}")
            results.append(None)
        else:
            print(f"  ✓ {result}")
            results.append(result)
    return results


import random
random.seed(42)
tasks = ['query A', 'query B', 'query C', 'query D']
results = robust_agent(tasks, flaky_tool)
print(f"\\nCompleted: {sum(1 for r in results if r is not None)}/{len(tasks)}")

# Observations:
# - Naive agents abort on first tool failure
# - Robust agents retry with backoff
# - Production: circuit breakers, fallback tools, error categorization,
#   structured error reporting
```

**Required callout** — type `warning`: **MC1 from research.md.** "An agent is just a chat model with tools." False. **The defining feature of an agent is iteration** — making multiple decisions across multiple turns, with the ability to incorporate observations into future actions. A tool-using chat model is still single-turn; an agent is the loop wrapped around it. **The capability is the loop, not the tool.**

**Connection forward:** Section 7 surveys where the field is in 2025.

### Section 7: The agentic stack today

**Heading:** `## The agentic stack today`
**Word target:** ~400
**Sub-headings:** `### The 5-layer stack`, `### Where the field is`

**Teaching beats:**

**The modern agentic stack** (early 2025):

**Layer 1 — Models**:
- Frontier LLMs with strong tool use: Claude Sonnet/Opus, GPT-4 family, Gemini Pro
- Specialized fine-tunes: Claude Code, GitHub Copilot models

**Layer 2 — Tool protocols**:
- **MCP (Model Context Protocol)** — Anthropic's open standard for tool/data connections
- **Function calling** — OpenAI's structured-output approach; widely adopted

**Layer 3 — Agent frameworks**:
- **LangGraph** — graph-based agent orchestration; explicit state machines
- **CrewAI** — multi-agent collaboration framework
- **AutoGen** (Microsoft) — multi-agent conversation framework
- **Custom** — most production agents are bespoke implementations

**Layer 4 — Hosted services**:
- **Anthropic Claude Code** — coding agent with file/terminal access
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

**Required callout** — type `aside`: **MC8 from research.md.** "An agent's autonomy is the goal." False in production. **Bounded autonomy is the production goal** — agents should be as autonomous as the task allows, but no more. **Human-in-the-loop checkpoints, explicit scope limits, oversight mechanisms** are the difference between a useful agent and a runaway system. **2025's production agents emphasize bounded autonomy.**

**No code in this section.**

**Connection forward:** Section 8 closes the chapter and lays out Phase 15.

### Section 8: Phase 15 opens — chapter map

**Heading:** `## Phase 15 opens — chapter map`
**Word target:** ~400
**Sub-headings:** `### The composition arc`, `### Four chapters remain`

**Teaching beats:**

**Phase 15 — the curriculum's final arc**:

| Chapter | Topic | What it covers |
|---------|-------|----------------|
| **Ch 27 (this chapter)** | Agent foundations | The agentic loop, ReAct, AutoGPT, memory, patterns |
| **Ch 28** | Agents from scratch | Building real agents: tool implementation, error recovery, scaffolding |
| **Ch 29** | Multi-agent | Orchestration, agent-to-agent communication, role specialization |
| **Ch 30** | Agent eval and frameworks | How to evaluate agents (connecting back to Ch 26); production frameworks; the curriculum's close |

**The composition arc**:
- **Phase 13 (Capabilities)** — what individual models can do
- **Phase 14 (Disciplines)** — making capable development trustworthy
- **Phase 15 (Composition)** — assembling models into systems

**Why agents close the curriculum**: they're the **highest level of composition** — combining capability (Phase 13), discipline (Phase 14), and orchestration into systems that act in the world. **After Ch 30, the reader has the full stack** from numpy primitives (Ch 1) to production agent systems.

**The trajectory of this chapter into Ch 28**:
- Ch 27 (this chapter) — **conceptual**: what an agent is and how the loop works
- Ch 28 — **engineering**: actually build agents end-to-end with real tools

**Sample close** (rewrite in chapter voice):

> An agent is an LLM acting as a controller in a loop with an environment. **That's the operational definition.** The loop observes, thinks, acts, observes — until termination. **ReAct** interleaves reasoning with action, producing inspectable traces. **AutoGPT** proved the pattern's promise and revealed its limits; the 2025 agentic stack — Anthropic Claude Code, OpenAI Assistants, LangGraph, Cursor, Devin — runs on the lessons that survived. **Memory and state** turn single-shot loops into persistent agents. **Patterns and anti-patterns** turn experiments into production. **Bounded autonomy with human oversight** turns agents from research demos into reliable products.
>
> **Phase 15 has three chapters left.** Ch 28 builds agents end-to-end from real tools. Ch 29 composes multiple agents into orchestrated systems. Ch 30 evaluates agents — closing both the eval discipline from Ch 26 and the curriculum itself. **Three chapters between here and the end.**

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 27, slug: 'ch27-agent-foundations', title: 'Agent foundations', partNum: 9, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch27-agent-foundations/index.astro && rm src/pages/ch27-agent-foundations/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch27-agent-foundations/`** renders with:
   - Chapter eyebrow ("Chapter 27") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 3, 5, 6)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 6)
   - Labeled equation `<Equation label="27.agent-definition">`
   - At least 5 callouts (section-1 aside, section-2 note, section-4 note/MC3, section-6 warning/MC1, section-7 aside/MC8 — pick 5)
3. **Sidebar:** Ch 1-26 published; Ch 27 active (draft); Ch 28-30 dimmed
4. **Prev/next nav at bottom of Ch 27:** prev = Ch 26 (active); next = Ch 28 (disabled)
5. **TOC on Ch 27** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3300 and 4000 words
7. **`npm run typecheck`** passes
8. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 152 and 153 own them.
- ❌ **Do not write exercises.** Session 153 owns.
- ❌ **Do not flip Ch 27's status to `'published'`.** Session 153 owns.
- ❌ **Do not build agents from scratch in detail.** Ch 28 owns that.
- ❌ **Do not deep-dive multi-agent.** Ch 29 owns.
- ❌ **Do not enumerate every agent framework.** Name the canon (LangGraph, CrewAI, AutoGen).
- ❌ **Do not philosophize about AGI or autonomy debates.** Engineering focus only.
- ❌ **Do not modify Ch 1-26.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch27-agent-foundations/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch27-agent-foundations/index.astro 2>/dev/null || true
git commit -m "session 118: Ch 27 prose — agent foundations (opens Phase 15: the composition arc)"
git push origin main
```

---

## Notes for the session author

**On opening Phase 15 — the curriculum's final arc:**
Phase 14 closed with three disciplines complete. **Phase 15 opens here, and the curriculum's end is in sight.** Notes-for-author: "**Phase 15 is the composition arc.** Phase 13 (Capabilities) gave us capable models; Phase 14 (Disciplines) gave us trustworthy development; Phase 15 (Composition) assembles them into systems. **The reader is now four chapters from the end** — section 8 should explicitly mark that distance."

**On the operational definition being the chapter's anchor:**
The equation `agent = LLM controller + tools + loop` is the chapter's central frame. **It appears in section 1, gets unpacked across sections 2-3, and is referenced in section 8.** Notes-for-author: "**The reader should leave able to recite this equation.** Every subsequent agentic concept — patterns, anti-patterns, frameworks — is some elaboration of these three components."

**On "the capability is the loop, not the model" as the chapter's central insight:**
A weaker model in a well-designed loop can outperform a stronger model used as a one-shot. **This phrase should appear in section 1 (callout) and section 6 (callout).** Notes-for-author: "**Engineers often over-index on model selection and under-index on loop design.** This chapter wants to flip that intuition. Make the loop the protagonist."

**On AutoGPT framed as historic, not failure:**
The chapter must be honest about AutoGPT's reliability problems without dismissing its influence. Notes-for-author: "**AutoGPT didn't reliably complete tasks** — true and important. **But it shaped the field** — equally true. **Frame it as the Wright Brothers' first flight**: didn't go far, didn't carry passengers, but proved the pattern. **The 2025 agentic stack exists because of the 2023 boom.**"

**On the 2025 framing being bounded autonomy with human oversight:**
The chapter should NOT repeat 2023's autonomous-AGI framing. The 2025 production reality is bounded autonomy. Notes-for-author: "**Section 7 should explicitly contrast 2023 (autonomous) vs 2025 (bounded).** Production agents like Claude Code, Cursor, Devin are bounded — they have scope, oversight, error-recovery. The framing shift is engineering maturity, not capability ceiling."

**On the 3 runnable code blocks**:
- **Section 3 (minimal ReAct agent)**: 50 lines; mock LLM, mock tools, regex parsing; full loop with termination
- **Section 5 (agent with memory)**: 40 lines; AgentMemory class with short-term + long-term; multi-turn session
- **Section 6 (error handling)**: 30 lines; retry with exponential backoff; multi-task robustness

**The progression**: implement the loop → add memory → add error handling. **Reader sees the production-readiness progression in code.**

**On the marquee widget placement (section 3 — ReAct):**
ReAct is the foundational pattern; **the marquee belongs there.** Reader steps through a ReAct agent's loop over a multi-step task; sees thoughts/actions/observations accumulating. Notes-for-author: "**The widget makes the loop concrete.** Reader sees that the LLM's output is just one step in a longer iteration — and that the iteration is what gives the agent its power."

**On the secondary widget placement (section 6 — patterns):**
Five patterns visualized side-by-side. Notes-for-author: "**The pattern catalog teaches that 'agent' isn't one architecture.** Reader sees the family of agents and can pick the right pattern for their task. **This widget bridges Ch 27 (conceptual) and Ch 28 (engineering).**"

**On the Phase 15 chapter map being explicit:**
Section 8 should enumerate all four chapters of Phase 15 with one-line descriptions. **The reader is approaching the curriculum's end.** Notes-for-author: "**Four chapters remain.** Section 8 should make that clear and previewing what each covers. **By Ch 30, the reader will have built the full stack.**"

**Pedagogical claim of the chapter:**
"An agent is an LLM acting as a controller in a loop with an environment. **ReAct** (Yao 2022) is the foundational pattern — interleaving reasoning with action. **AutoGPT** demonstrated both promise and limits; the lessons that survived (planner-executor, memory, structured tools, bounded iteration, human-in-the-loop) shape the 2025 agentic stack (MCP, LangGraph, OpenAI Assistants, Claude Code, Cursor, Devin). **Memory and state** turn single-shot loops into persistent agents. **Patterns and anti-patterns** turn experiments into production. **Bounded autonomy with human oversight** is the 2025 production framing — not 2023's autonomous-AGI. **The capability is the loop, not the model.** This chapter is the conceptual foundation; Ch 28 builds agents from scratch."

**Phase 15 progress after this session**: Ch 27 in progress (1/4 files). **Three sessions remain** to close Ch 27. Then Ch 28-30 close the curriculum.

**Curriculum status**: 26 published / 30 total. **Four chapters from the end.**

Build with care. **This chapter opens the curriculum's final arc.**
