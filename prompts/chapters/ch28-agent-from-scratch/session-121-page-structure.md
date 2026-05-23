# Session 121 — Chapter 28 page structure

> First chapter session for Chapter 28 ("Agents from scratch"). **The engineering chapter of Phase 15.** Where Ch 27 was conceptual (loop, ReAct, AutoGPT, patterns), this chapter is operational — how to actually build a production-grade agent. Eight sections walking from the 80/20 framing of agent engineering → tool design principles → tool implementation → schemas and structured calls (marquee widget here) → error handling and recovery → observability (secondary widget here) → scaffolding → three-chapters-from-end. Single-topic chapter; uses the **4-file cadence**. **The chapter that turns "I understand agents" into "I can build one."**

---

## Read first (in this order)

1. **`research/ch28-agent-from-scratch/research.md`** — the source material. Every section, equation, code snippet, and misconception traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch27-agent-foundations/session-118-page-structure.md`** — for the Ch 27 page-structure pattern; this chapter builds directly on it
4. **`prompts/chapters/ch21-tool-use/`** — for Ch 21 references on tool-use as LLM capability (this chapter covers tool engineering)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 28 page. By end of session:

- `src/pages/ch28-agent-from-scratch/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch28-agent-from-scratch/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 28's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch28-agent-from-scratch/` with sidebar showing Ch 28 active, prev/next nav linking to Ch 27 (active) and Ch 29 (disabled)

**Tonal note:** Ch 28 is **engineering with empathy for the LLM.** **Tools should be designed so the LLM can use them effectively** — not so the engineer feels clever. **Concrete numbers** (production agent lines: 500-5000; tool counts: 5-50; task costs: $0.01-$10; reliability targets: 95%+) and **honest tradeoffs** (sync vs async; function calling vs MCP; framework vs custom; cost vs reliability). **The 80% engineering reality** is the central frame — most agent failures are engineering failures, not LLM failures.

**Phase 15 advancing position**: Ch 27 gave the conceptual toolkit; Ch 28 gives the engineering toolkit. **Three chapters from the curriculum's end.** Section 8 explicitly maps the remaining trajectory.

**Chapter cadence:** Ch 28 uses the **4-file cadence** (single-topic chapter).

---

## Inputs

State of the repo after session 120 (Ch 27 complete):

- Ch 1-27 all `'published'`
- `research/ch28-agent-from-scratch/research.md` exists
- `src/lib/chapters.ts` has Ch 1-27 `'published'`, Ch 28-30 `'planned'`
- No `src/pages/ch28-agent-from-scratch/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch28-agent-from-scratch/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch28-agent-from-scratch/index.astro` if it existed
3. **Update** `src/lib/chapters.ts` — change Ch 28's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch28-agent-from-scratch
description: Agents from scratch — the engineering chapter of Phase 15. From the 80/20 framing of agent engineering (LLM is 20%; everything else is 80%) through tool design principles, tool implementation patterns, schemas and structured calls (function calling, MCP), error handling and recovery (retries, circuit breakers, fallback tools), observability and trace debugging, and agent scaffolding (system prompts, tool descriptions, few-shot examples). The chapter that turns conceptual agent knowledge into working production code.
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

> Chapter 27 covered what an agent *is*: an LLM acting as a controller in a loop with an environment. ReAct as the foundational pattern. AutoGPT's lessons. Memory, patterns, anti-patterns, the 2025 stack. **All conceptual.** This chapter is engineering: how to take those concepts and build a working agent in real code. **Production agents are 80% engineering, 20% LLM.** The 20% is the model and the basic loop. The 80% is everything in this chapter: tool design, schemas, error handling, observability, scaffolding.
>
> The work breaks into six concerns. **Tool design** — atomic, single-responsibility, clear-contract functions the LLM can call effectively. **Tool implementation** — sync vs async, timeouts, output truncation, sandboxing. **Schemas** — JSON Schema, OpenAI function calling, Anthropic MCP; how the LLM knows what tools exist and how to call them. **Error handling** — retries, circuit breakers, fallback tools, surfacing errors to the LLM. **Observability** — structured logging, distributed tracing, debugging from traces. **Scaffolding** — system prompts, tool descriptions, few-shot examples, output validation.
>
> The tonal frame is engineering with empathy for the LLM. **Tools should be designed so the LLM can use them effectively** — not so you feel clever. A minimal ReAct agent is 50 lines; a production agent is 500-5000. **The difference is everything in this chapter.** By the end, you'll have the operational toolkit to build agents that survive real traffic. **Then Ch 29 composes multiple agents; Ch 30 evaluates them and closes the curriculum.** Three chapters from the end.

### Section 1: From concept to code

**Heading:** `## From concept to code`
**Word target:** ~400
**Sub-headings:** `### The 80/20`, `### What goes into a real agent`

**Teaching beats:**

**The 80/20**:
- **20% LLM**: the model, the prompt, the basic loop (Ch 27)
- **80% engineering**: tools, schemas, error handling, observability, scaffolding (this chapter)

**What goes into a real agent**:

```mdx
<Equation label="28.real-agent">
$$\text{production agent} \;=\; \text{ReAct loop} \;+\; \text{tools} \;+\; \text{schemas} \;+\; \text{error handling} \;+\; \text{observability} \;+\; \text{scaffolding}$$
</Equation>
```

Each component requires deliberate design. **Skip one and the agent is fragile.**

**Concrete production anchors (early 2025)**:
- **Lines of code**: minimal ReAct ~50 lines; production agent 500-5000 lines
- **Tool count**: production agents typically have 5-50 well-designed tools (not hundreds)
- **Per-turn latency**: 1-10 seconds
- **Total task latency**: 10-300 seconds for non-trivial tasks
- **Per-task cost**: $0.01-$10 depending on complexity and model
- **Reliability target**: 95%+ task completion for production deployment

**The chapter's tonal frame**: **engineering with empathy for the LLM.** Tools should be designed so the LLM can use them effectively. Schemas should be obvious. Errors should be informative. Traces should be readable. **The agent is a system; this chapter is its system design.**

**Required callout** — type `aside`: Most production agents fail not because the LLM is bad but because the surrounding engineering is incomplete. **The 80% engineering reality** is the central operational claim of this chapter. **Skip the engineering and the agent doesn't survive production traffic** — no matter how capable the underlying model.

**No code in this section.** Setup.

**Connection forward:** Section 2 starts the engineering with the most important non-LLM skill — tool design.

### Section 2: Tool design principles

**Heading:** `## Tool design principles`
**Word target:** ~500 — IMPORTANT
**Sub-headings:** `### Six principles`, `### Design anti-patterns`

**Teaching beats:**

**A tool is a function the agent can call.** Designing good tools is the most important non-LLM skill in agent engineering.

**Six principles**:

**1. Single responsibility** — each tool does one thing. **Avoid grab-bag utilities** ("file_operations" that reads/writes/lists). Instead: `read_file`, `write_file`, `list_directory`. **The LLM picks tools by name** — clear names beat clever abstractions.

**2. Atomic operations** — tools should complete fully or fail cleanly. **Avoid partial-completion semantics** that the LLM has to reason about.

**3. Clear contracts** — each tool has:
- A name (verb-noun: `read_file`, `search_web`, `send_email`)
- A description (1-3 sentences for the LLM)
- Parameters with types and descriptions
- A return value with predictable structure
- Documented error modes

**4. Idempotency where possible** — calling twice has the same effect as calling once. **Critical for retry logic.** Reads are naturally idempotent; writes often aren't.

**5. Bounded outputs** — tools should return bounded amounts of data. **A `search_web` that returns 100 results blows up the context window.** Limit, paginate, summarize.

**6. Informative errors** — errors should tell the agent what went wrong AND what to try next. **"Connection failed" is bad; "Connection failed: timeout after 30s; retry or try a different tool" is good.**

**Design anti-patterns**:
- **Kitchen-sink tools**: one tool with 20 parameters and 12 modes
- **Magic parameters**: parameter names that don't tell the LLM what they do
- **Silent failures**: tools that return empty strings instead of explicit errors
- **Unbounded outputs**: tools that dump entire databases into the context

**Required callout** — type `note`: **MC1 from research.md.** "If I just give the LLM more tools, it'll figure it out." False. **More tools without clear descriptions and good design hurt agent performance.** The LLM has to read every tool description; it has to decide which to call; it has to remember constraints. **5 well-designed tools beat 50 sloppy ones.** Quality beats quantity, every time.

**No code in this section** (the registry pattern in section 3 is where principles become code).

**Connection forward:** Section 3 turns principles into code patterns.

### Section 3: Implementing tools

**Heading:** `## Implementing tools`
**Word target:** ~500
**Sub-headings:** `### Synchronous tools`, `### Async, timeouts, and truncation`, `### Tool registries`

**Teaching beats:**

**Synchronous Python functions** — the simplest implementation:

```python
def get_weather(city: str) -> dict:
    """Return current weather for a city."""
    response = requests.get(f"https://api.weather.com/{city}", timeout=10)
    response.raise_for_status()
    return response.json()
```

**Pros**: simple, easy to test, easy to debug. **Cons**: blocks the loop; can't parallelize.

**Async for I/O-bound tools** — for tools that wait on network/disk:

```python
async def get_weather(city: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(f"https://api.weather.com/{city}") as r:
            return await r.json()
```

**Pros**: parallel tool calls; better throughput. **Cons**: needs async-aware loop; harder to debug.

**Timeouts on every tool** — infinite hangs are an anti-pattern. **Every network call gets a hard timeout.**

**Output truncation** — always cap output size:

```python
def read_file(path: str, max_chars: int = 10_000) -> str:
    with open(path) as f:
        content = f.read()
    if len(content) > max_chars:
        return content[:max_chars] + f"\\n... [truncated; file is {len(content)} chars]"
    return content
```

**Side-effect tools with confirmation** — tools that modify state (send email, delete file, run code) should require confirmation or run sandboxed. **The LLM might call them by mistake.**

**Tool registries** — a registry maps tool names to functions, schemas, and descriptions. **Single source of truth.**

**Required code** — `<RunnableCode>` showing a tool registry pattern:

```python
from typing import Callable
import math

class Tool:
    def __init__(self, name: str, description: str, parameters_schema: dict, function: Callable):
        self.name = name
        self.description = description
        self.parameters_schema = parameters_schema
        self.function = function
    
    def execute(self, arguments: dict) -> dict:
        """Execute with structured error handling. Returns {'status': 'ok'|'error', ...}."""
        try:
            result = self.function(**arguments)
            return {'status': 'ok', 'result': result}
        except Exception as e:
            return {
                'status': 'error',
                'error_type': type(e).__name__,
                'message': str(e),
            }


# Tool registry: maps names to Tool objects
TOOLS: dict[str, Tool] = {}


def register(name: str, description: str, parameters_schema: dict):
    """Decorator to register a tool."""
    def wrapper(fn):
        TOOLS[name] = Tool(name, description, parameters_schema, fn)
        return fn
    return wrapper


@register(
    name='get_weather',
    description='Get current weather for a city. Returns temperature and conditions.',
    parameters_schema={
        'type': 'object',
        'properties': {
            'city': {'type': 'string', 'description': 'City name (e.g. "Tokyo")'},
        },
        'required': ['city'],
    },
)
def get_weather(city: str) -> dict:
    return {'city': city, 'temp_c': 18, 'conditions': 'partly cloudy'}


@register(
    name='calculate',
    description='Evaluate a mathematical expression. Returns the result.',
    parameters_schema={
        'type': 'object',
        'properties': {
            'expression': {'type': 'string', 'description': 'Math expression (e.g. "2 + 2")'},
        },
        'required': ['expression'],
    },
)
def calculate(expression: str) -> float:
    return eval(expression, {'__builtins__': {}}, {'sqrt': math.sqrt, 'pi': math.pi})


# Execute via the registry
print(TOOLS['get_weather'].execute({'city': 'Tokyo'}))
print(TOOLS['calculate'].execute({'expression': '5 * 7'}))
print(TOOLS['calculate'].execute({'expression': '1/0'}))   # error case

# Observations:
# - Registry pattern: single source of truth for tool name + schema + function
# - execute() wraps in structured error handling (never raises to the agent)
# - Errors are structured data, returned as observations to the LLM
# - Provider-specific schema conversion (OpenAI / Anthropic) can be added later
```

**Connection forward:** Section 4 covers how the LLM sees these tools — schemas.

### Section 4: Tool schemas and structured calls

**Heading:** `## Tool schemas and structured calls`
**Word target:** ~500 — IMPORTANT
**Sub-headings:** `### The schema problem`, `### Function calling vs MCP`, `### Best practices`

**Teaching beats:**

**The schema problem**:
The LLM doesn't see Python types — it sees text. **Schemas tell the LLM how to call tools** in a structured, parseable way. Two dominant approaches: **function calling** (OpenAI's, now widely adopted) and **MCP** (Anthropic's open standard).

**OpenAI function calling**:
The LLM produces JSON conforming to a schema. Developer parses and executes.

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Return current weather for a city.",
    "parameters": {
      "type": "object",
      "properties": {
        "city": { "type": "string", "description": "City name (e.g. 'Tokyo')" }
      },
      "required": ["city"]
    }
  }
}
```

When the LLM wants to call the tool, its response contains a structured `tool_calls` array. Developer parses, calls the function, feeds the result back as a `tool` message.

**Anthropic tool use**:
Conceptually identical (schemas + structured tool blocks). **Differences**: explicit parallel tool calls; reasoning tokens; slightly different message formatting.

**Model Context Protocol (MCP)**:
A protocol layer **above** function calling. **MCP servers** expose tools; **MCP clients** (LLM applications) discover and invoke them. **Standardizes**: discovery, authentication, schemas, error handling.

**Why MCP matters**:
- Tools become **portable** between LLM providers
- Tool discovery is automatic (no hardcoded lists)
- Authentication handled by the protocol
- Versioning is part of the spec

**OpenAPI integration**:
Many existing REST APIs auto-convert to tool schemas. **Lets agents use any REST API** with minimal work.

**Required widget placeholder** — Tool Schema Builder (marquee, session 157):

```mdx
<WidgetFrame title="Tool schema builder" caption="Pick a Python tool function from a curated set; see the auto-generated OpenAI function-calling schema and Anthropic tool-use schema side by side; preview a sample LLM tool-call as JSON. Demonstrates the function → schema → invocation pipeline that every agent framework runs on. Makes the schema work concrete — the most under-appreciated piece of agent engineering.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 157 (marquee)
  </div>
</WidgetFrame>
```

**Schema best practices**:
- **Descriptions matter** — the LLM picks tools by reading them
- **Parameter examples in descriptions** — helps the LLM call correctly
- **Required vs optional** — be explicit
- **Enums for constrained values** — prevents junk arguments
- **Object types for complex inputs** — lets the LLM structure rich arguments

**Required callout** — type `note`: **MC6 from research.md.** "MCP will replace function calling." Debatable. **MCP adds standardization above function calling**, not replacement. The underlying mechanism (LLM produces structured tool calls; developer executes) is the same. **MCP is plumbing, not a paradigm shift** — useful but not revolutionary.

**No code in this section** (the schema work is in the marquee widget; the next runnable is in section 5).

**Connection forward:** Section 5 covers what happens when tools fail.

### Section 5: Error handling and recovery

**Heading:** `## Error handling and recovery`
**Word target:** ~500 — IMPORTANT
**Sub-headings:** `### The reality of tool errors`, `### Six patterns`, `### Anti-patterns`

**Teaching beats:**

**The reality**:
- Network failures
- Service unavailable
- Rate limits
- Invalid arguments (LLM gets it wrong)
- Timeouts
- Authentication failures
- Permission denied

**Every one happens regularly in production.** A robust agent handles all of them.

**Six patterns**:

**1. Retry with exponential backoff** — for transient failures. Wait progressively longer (1s, 2s, 4s, ...).

**2. Circuit breakers** — if a tool fails repeatedly, stop calling it for a cooldown period. **Prevents cascade failures.**

**3. Fallback tools** — when one tool fails, try a backup. **Useful for redundancy** (two web search providers, etc.).

**4. Surface errors to the LLM** — don't swallow errors. The LLM uses error messages to plan recovery.

**5. Bounded iteration** — even with all error handling, cap iterations.

**6. Cost budgets** — cap total cost per task. If an agent burns through $10 in inference without progress, something is wrong.

**Anti-patterns**:
- **Swallowing errors silently** — agent never recovers
- **Retrying non-retryable errors** — invalid arguments fail forever
- **Catching too broadly** — `except Exception` hides bugs
- **Infinite retry** without backoff or cap

**Required code** — `<RunnableCode>` showing circuit breaker + retry composition:

```python
import time
import random

class CircuitBreaker:
    """Stop calling a service after N failures; reset after cooldown."""
    def __init__(self, threshold=3, cooldown=5.0):
        self.failures = 0
        self.open_until = 0.0
        self.threshold = threshold
        self.cooldown = cooldown
    
    def call(self, fn, *args, **kwargs):
        if time.time() < self.open_until:
            raise Exception("CircuitOpen: cooldown active")
        try:
            result = fn(*args, **kwargs)
            self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            if self.failures >= self.threshold:
                self.open_until = time.time() + self.cooldown
                print(f"  [CIRCUIT OPEN] {self.failures} failures; cooldown {self.cooldown}s")
            raise


def with_retry(fn, *args, max_retries=3, base_wait=0.001, **kwargs):
    """Retry with exponential backoff. Returns (result, error)."""
    for attempt in range(max_retries):
        try:
            return fn(*args, **kwargs), None
        except Exception as e:
            wait = base_wait * (2 ** attempt)
            print(f"  Attempt {attempt + 1}: {e}. Waiting {wait*1000:.0f}ms...")
            time.sleep(wait)
    return None, f"Failed after {max_retries} attempts"


# Mock flaky tool — fails 60% of the time
def flaky_search(query):
    if random.random() < 0.6:
        raise ConnectionError("Service temporarily unavailable")
    return f"Search results for: {query}"


breaker = CircuitBreaker(threshold=2, cooldown=0.5)


def safe_search(query):
    """Wrap the tool in circuit breaker + retry layers."""
    try:
        result, error = with_retry(
            lambda q: breaker.call(flaky_search, q),
            query,
            max_retries=2,
        )
        return result if not error else f"Error: {error}"
    except Exception as e:
        return f"Error: {e}"


# Run multiple calls
random.seed(42)
for i in range(6):
    print(f"\\nCall {i+1}: searching for 'topic_{i}'")
    print(f"Result: {safe_search(f'topic_{i}')}")
    time.sleep(0.1)

# Observations:
# - Layered defense: retry handles transient flakiness; circuit breaker prevents cascade
# - Real production: also add fallback tools, error categorization, structured logging
# - The LLM should see structured errors (not exceptions) so it can recover
```

**Required callout** — type `warning`: **MC8 from research.md.** "Tool errors should be hidden from the LLM." False. **The LLM uses error messages to plan recovery.** Hiding errors means the LLM can't decide what to do next; it might retry the same broken tool indefinitely. **Surface errors as structured observations.** "Error: connection timeout after 30s. Retry or try a different tool" is far more useful than swallowed silence.

**Connection forward:** Section 6 covers how to see what the agent is doing.

### Section 6: Observability — tracing and debugging

**Heading:** `## Observability — tracing and debugging`
**Word target:** ~400
**Sub-headings:** `### The trace problem`, `### Spans and structured logs`, `### Debugging from traces`

**Teaching beats:**

**The trace problem**:
When an agent fails in production, the trace is the only diagnostic. **Without good traces, debugging is impossible.**

**A good trace shows**:
- Every LLM call (model, prompt tokens, completion tokens, latency, cost)
- Every tool call (name, arguments, result, latency, success/failure)
- The thought-action-observation sequence
- Errors and recoveries
- Cost and time accumulating per task

**Spans and structured logs**:
- **Trace ID**: unique per task
- **Spans**: nested timed operations (LLM call → tool call → result processing)
- **Parent-child**: each span knows its parent
- **Attributes**: structured metadata per span (model name, token counts, latency)

**Structured logging** — events as JSON, not free-text:

```python
logger.info({
    'event': 'tool_call',
    'task_id': 'abc123',
    'iteration': 3,
    'tool': 'get_weather',
    'arguments': {'city': 'Tokyo'},
    'latency_ms': 247,
    'success': True,
})
```

**Required widget placeholder** — Agent Trace Inspector (secondary, session 158):

```mdx
<WidgetFrame title="Agent trace inspector" caption="A real-looking agent trace rendered as nested spans: LLM calls, tool calls, errors, retries — each with model name, token counts, latency, cost. Inspectable like a flame graph. Demonstrates that production observability isn't optional — it's the only way to debug failures. Mirrors what tools like LangSmith and Helicone provide.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 158 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing a minimal tracing layer:

```python
import time
import uuid
from contextlib import contextmanager

class Tracer:
    def __init__(self):
        self.spans = []
        self.task_id = None
        self.span_stack = []
    
    def start_task(self, name: str) -> str:
        self.task_id = str(uuid.uuid4())
        self.spans = []
        self.span_stack = []
        return self.task_id
    
    @contextmanager
    def span(self, name: str, **attrs):
        span_id = str(uuid.uuid4())[:8]
        parent_id = self.span_stack[-1] if self.span_stack else None
        start = time.time()
        self.span_stack.append(span_id)
        record = {
            'span_id': span_id,
            'parent_id': parent_id,
            'task_id': self.task_id,
            'name': name,
            'start': start,
            'attributes': attrs,
        }
        self.spans.append(record)
        try:
            yield record
            record['status'] = 'ok'
        except Exception as e:
            record['status'] = 'error'
            record['error'] = str(e)
            raise
        finally:
            record['end'] = time.time()
            record['duration_ms'] = (record['end'] - start) * 1000
            self.span_stack.pop()
    
    def report(self):
        print(f"=== Trace for task {self.task_id} ===")
        for span in self.spans:
            depth = 0
            pid = span['parent_id']
            while pid:
                depth += 1
                pid = next((s['parent_id'] for s in self.spans if s['span_id'] == pid), None)
            indent = '  ' * depth
            icon = '✓' if span.get('status') == 'ok' else '✗'
            print(f"{indent}{icon} {span['name']:>15} ({span['duration_ms']:.1f}ms)  {span['attributes']}")


# Use the tracer
tracer = Tracer()
tracer.start_task("answer_user_query")

with tracer.span("agent_turn", iteration=1):
    with tracer.span("llm_call", model="claude-sonnet-4", tokens_in=450, tokens_out=120):
        time.sleep(0.05)
    with tracer.span("tool_call", tool="get_weather", city="Tokyo"):
        time.sleep(0.02)

with tracer.span("agent_turn", iteration=2):
    with tracer.span("llm_call", model="claude-sonnet-4", tokens_in=620, tokens_out=85):
        time.sleep(0.04)
    with tracer.span("tool_call", tool="get_date"):
        time.sleep(0.01)

tracer.report()

# Observations:
# - Spans nest via context managers (with statement)
# - Each span has start, end, duration, attributes
# - Real production: OpenTelemetry standardizes this; LangSmith renders it
# - Visualization turns hours of debugging into seconds of inspection
```

**Debugging from traces**:
- **Hung agent**: look for spans without end times
- **Wrong answer**: look at the thought-action sequence for missteps
- **Cost spike**: look for excessive iterations or large contexts
- **Slow response**: look for slow tools or model latency

**Connection forward:** Section 7 covers everything around the loop.

### Section 7: Scaffolding the agent

**Heading:** `## Scaffolding the agent`
**Word target:** ~500
**Sub-headings:** `### What goes into scaffolding`, `### Production patterns`

**Teaching beats:**

**Scaffolding** = everything that's not the loop or the tools. **Seven components**:

**1. System prompt** — sets the agent's role, behavior, constraints. **Most important single piece of agent code.**

**2. Tool descriptions** — each tool's description is read by the LLM at every call. **Write them as if for a colleague.**

**3. Few-shot examples** — examples of correct agent behavior, embedded in the system prompt. **The most-impactful single intervention for many tasks.** Two or three good examples often outperform paragraphs of instructions.

**4. Output validation** — after the LLM produces output, validate it. **Reject and retry on invalid output.**

**5. Memory layer** — what state does the agent preserve across turns/sessions? Ch 27 section 5.

**6. Conversation management** — for chat-style agents: user identity, session state, conversation history.

**7. Cost and rate limits** — set per-task budgets. **Hard caps prevent runaway costs.**

**Sample production system prompt**:

```text
You are a customer-support agent for [Company]. Your goals:
1. Answer user questions accurately using the tools provided.
2. If you can't help, escalate to a human via the `escalate` tool.
3. Be concise and friendly.

You have access to these tools:
- search_kb(query): search the knowledge base
- check_order(order_id): look up order status
- escalate(reason): hand off to a human agent

Guidelines:
- Never invent information; if unsure, use search_kb or escalate.
- Confirm sensitive actions before taking them.
- Keep responses under 200 words.

Output format: ReAct (Thought/Action/Observation).
```

**Production patterns**:
- **System-prompt versioning** — like code: each task records which prompt version ran it
- **Dynamic few-shot retrieval** — for complex tasks, retrieve relevant examples per task (RAG-for-prompts)
- **Output validation with retry** — reject malformed JSON; ask the LLM to try again
- **Sanitized logging** — redact PII before traces leave the application
- **Sandboxing dangerous tools** — Docker / VMs / restricted environments

**Scaffolding anti-patterns**:
- **Massive system prompts** (>2000 tokens) the LLM can't reliably follow
- **Vague tool descriptions** ("does stuff with data")
- **No few-shot examples** when the task is unusual
- **Skipping validation** because the LLM "usually gets it right"

**Required callout** — type `note`: **MC2 from research.md.** "Frontier models don't need much scaffolding." Partially false. **Frontier models tolerate worse scaffolding** than older models, but the best-performing agents still invest heavily in system prompts, tool descriptions, and few-shot examples. **Scaffolding compounds the model's capability** — skip it and you leave performance on the table.

**No code in this section** (the three runnables in sections 3, 5, 6 cover the central engineering).

**Connection forward:** Section 8 takes stock of Phase 15's remaining trajectory.

### Section 8: Three chapters from the end

**Heading:** `## Three chapters from the end`
**Word target:** ~400
**Sub-headings:** `### Phase 15 status`, `### What's left`

**Teaching beats:**

**Phase 15 status**:

| Chapter | Topic | Status |
|---------|-------|--------|
| Ch 27 | Agent foundations | ✅ |
| **Ch 28 (this)** | **Agents from scratch** | (closing here) |
| Ch 29 | Multi-agent | ⬜ |
| Ch 30 | Agent eval and frameworks | ⬜ (closes the curriculum) |

**What's left**:
- **Ch 29 (Multi-agent)** — when single-agent setups aren't enough; orchestration patterns; agent-to-agent communication; frameworks (CrewAI, AutoGen, Swarm)
- **Ch 30 (Agent eval and frameworks)** — how to evaluate agents quantitatively (bringing Ch 26's eval discipline back to bear); production frameworks; deployment patterns; the curriculum's close

**The trajectory**:
- **Ch 27 conceptual** → **Ch 28 engineering** (you are here) → **Ch 29 composition** → **Ch 30 evaluation**
- Each builds on the prior

**After Ch 30**: the reader has the full stack — **from numpy primitives (Ch 1) to production agent systems (Ch 27-30).** Every layer covered.

**Sample close** (rewrite in chapter voice):

> Production agents are 80% engineering on top of 20% LLM. **This chapter covered the 80%.** Tool design — atomic, single-responsibility, clear-contract functions. Tool implementation — sync, async, timeouts, output bounds, sandboxing. Schemas — function calling, MCP, the structured-call pipeline. Error handling — retry, circuit breakers, fallback, surfacing errors to the LLM. Observability — structured logs, distributed traces, debugging from spans. Scaffolding — system prompts, tool descriptions, few-shot examples, output validation, cost budgets. **All of it is engineering you'd recognize from any production system — applied with the LLM in mind.**
>
> **Three chapters remain.** Ch 29 composes multiple agents — when a single agent doesn't fit and orchestration matters. Ch 30 brings Phase 14's evaluation discipline back to bear on agent systems — and closes the curriculum. **You're now equipped to build a real agent.** The next chapters compose them and evaluate them. **Then the curriculum closes.**

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 28, slug: 'ch28-agent-from-scratch', title: 'Agents from scratch', partNum: 9, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch28-agent-from-scratch/index.astro && rm src/pages/ch28-agent-from-scratch/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch28-agent-from-scratch/`** renders with:
   - Chapter eyebrow ("Chapter 28") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 3, 5, 6)
   - 2 `<WidgetFrame>` placeholders (sections 4 and 6)
   - Labeled equation `<Equation label="28.real-agent">`
   - At least 5 callouts (section-1 aside, MC1 in section 2, MC6 in section 4, MC8 in section 5, MC2 in section 7 — pick 5)
3. **Sidebar:** Ch 1-27 published; Ch 28 active (draft); Ch 29-30 dimmed
4. **Prev/next nav at bottom of Ch 28:** prev = Ch 27 (active); next = Ch 29 (disabled)
5. **TOC on Ch 28** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3300 and 4100 words
7. **`npm run typecheck`** passes
8. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 157 and 158 own them.
- ❌ **Do not write exercises.** Session 158 owns.
- ❌ **Do not flip Ch 28's status to `'published'`.** Session 158 owns.
- ❌ **Do not deep-dive any single framework.** Name the canon (LangGraph, CrewAI, AutoGen, MCP) briefly.
- ❌ **Do not tutorial OpenTelemetry.** Conceptual frame only — spans, trace IDs, structured logs.
- ❌ **Do not dive into multi-agent orchestration.** Ch 29 owns.
- ❌ **Do not enumerate every error class.** Name the canon (retry, circuit breaker, fallback, surface).
- ❌ **Do not modify Ch 1-27.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch28-agent-from-scratch/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch28-agent-from-scratch/index.astro 2>/dev/null || true
git commit -m "session 121: Ch 28 prose — agents from scratch (the engineering 80% of production agents)"
git push origin main
```

---

## Notes for the session author

**On the 80/20 framing being the chapter's central operational claim:**
The phrase "production agents are 80% engineering, 20% LLM" should appear in the opening, section 1, and section 8. **It's the chapter's most important takeaway.** Notes-for-author: "**Engineers leaving Ch 27 may believe the LLM is the hard part. Ch 28 corrects this.** The LLM is the easy part (use a frontier model and good prompts); the engineering around it is where most production effort goes."

**On "engineering with empathy for the LLM" as the tonal frame:**
Tools should be designed so the LLM can use them effectively — not so the engineer feels clever. Notes-for-author: "**Tool design isn't an abstract aesthetic exercise.** Every design choice affects whether the LLM picks the right tool, calls it correctly, recovers from errors. **The LLM is your user**; tools are the API."

**On treating tool design as the most important non-LLM skill:**
Section 2's six principles are the chapter's most actionable content. Notes-for-author: "**The six principles are the chapter's most directly-applicable section.** Engineers will use them on day-one of their next agent project. Make them concrete with examples; don't abstract."

**On the 3 runnable code blocks**:
- **Section 3 (tool registry)**: 50 lines; Tool class with execute() wrapping in structured error handling; decorator-style register(); demonstrates the function → registry → execution pipeline
- **Section 5 (circuit breaker + retry)**: 50 lines; CircuitBreaker class; with_retry function; composed pattern shows layered defense
- **Section 6 (tracing layer)**: 50 lines; Tracer with context-manager spans; structured attributes; nested visualization in the report

**The progression**: register tools → handle errors → observe behavior. **Reader sees the production toolkit in code.**

**On the marquee widget placement (section 4 — schemas):**
Schemas are the **most under-appreciated piece of agent engineering.** The widget makes the function → schema → invocation pipeline concrete. Notes-for-author: "**The Tool Schema Builder makes the schema work visible.** Reader sees that a Python function becomes structured JSON that the LLM reads to decide whether/how to call. **The schema is the contract between engineer and LLM.**"

**On the secondary widget placement (section 6 — observability):**
Real agent traces are nested, structured, and dense. The widget shows what production tools (LangSmith, Helicone) render. Notes-for-author: "**The Agent Trace Inspector makes observability concrete.** Reader sees that production debugging looks like reading flame graphs — and that without traces, debugging is impossible."

**On honest framing of MCP vs function calling:**
Both are covered without picking favorites. Notes-for-author: "**MCP is plumbing, not a paradigm shift.** It standardizes what function calling already did. Frame both; let engineers pick based on their stack. **Don't predict the future** — both will be around for years."

**On the "surface errors to the LLM" principle being central:**
MC8 callout in section 5 emphasizes this. Notes-for-author: "**The LLM uses errors to plan recovery.** Hiding errors is one of the most common production failures. **Structured error observations are not negotiable** for robust agents."

**Pedagogical claim of the chapter:**
"Production agents are 80% engineering, 20% LLM. **Tool design** (six principles: single responsibility, atomic, clear contracts, idempotency, bounded outputs, informative errors) is the most important non-LLM skill. **Tool implementation** (sync/async, timeouts, output truncation, sandboxing) turns design into code. **Schemas** (function calling, MCP) tell the LLM how to call tools. **Error handling** (retry, circuit breakers, fallback, surfacing errors) keeps agents alive in production. **Observability** (structured logs, distributed traces, span instrumentation) is the only path to debugging. **Scaffolding** (system prompts, tool descriptions, few-shot examples, output validation) compounds model capability. **The engineering 80%** is what separates a tutorial agent from a production one."

**Phase 15 progress after this session**: Ch 27 ✅; Ch 28 in progress (1/4 files). **Three sessions remain** to close Ch 28. Then Ch 29 (Multi-agent) and Ch 30 (closes the curriculum).

**Curriculum status**: 27 published / 30 total. **Three chapters from the end.**

Build with care. **This chapter is the engineering toolkit for the rest of Phase 15.**
