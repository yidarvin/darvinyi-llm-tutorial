# Chapter 28 — Agents from scratch: research

> Curated source material for Chapter 28's build sessions. **The engineering chapter of Part IX.** Where Ch 27 was conceptual (what an agent is, the loop, ReAct, patterns), this chapter is operational: **how to actually build one.** Tool design and implementation patterns; JSON schemas and structured tool calls (function calling, MCP); production-grade error handling and recovery (retries, circuit breakers, fallback tools); observability and trace debugging; agent scaffolding (system prompts, tool descriptions, few-shot examples); cost and latency management. **Single-topic chapter**; uses the **4-file cadence**. **The chapter that turns "I understand agents" into "I can build one."**

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Agents from scratch

**Premise:** Ch 27 gave the reader the conceptual toolkit — what an agent is, the canonical loop, patterns and anti-patterns. **Ch 28 is the engineering follow-on**: how to take those concepts and build a working agent in real code. Production agents are 80% engineering on top of 20% LLM. **This chapter covers the engineering 80%** — tool design, schema definition, error handling, observability, scaffolding — that turns a tutorial-grade ReAct loop into something deployable.

**The framing:** building an agent operationally requires:
1. **Designing tools** the LLM can call effectively
2. **Implementing tools** with reasonable contracts and error semantics
3. **Defining tool schemas** (JSON / function calling / MCP) so the LLM can invoke them
4. **Handling errors and recoveries** robustly
5. **Observing** what the agent is doing in production
6. **Scaffolding** the agent with prompts, descriptions, examples

**Out of scope (other chapters):**
- The agentic loop and patterns (Ch 27 — covered)
- Multi-agent orchestration (Ch 29)
- Agent evaluation frameworks (Ch 30)
- Tool-use as a general LLM capability (Ch 21 — different angle)

**In scope and locked:**
- **Tool design principles** — atomicity, single responsibility, clear contracts
- **Tool implementation patterns** — sync, async, idempotency, timeouts
- **Schemas** — JSON Schema, OpenAI function calling, Anthropic MCP, OpenAPI integration
- **Error handling** — retries, exponential backoff, circuit breakers, fallback tools
- **Observability** — structured logging, trace IDs, span instrumentation, debugging traces
- **Scaffolding** — system prompts, tool descriptions, few-shot examples, output validation
- **Cost and latency** — token budgets, caching, concurrency

**Suggested chapter structure** (8 sections):

1. From concept to code (~400 words)
2. Tool design principles (~500 words)
3. Implementing tools (~500 words)
4. Tool schemas and structured calls (~500 words)
5. Error handling and recovery (~500 words)
6. Observability — tracing and debugging (~400 words)
7. Scaffolding the agent (~500 words)
8. Three chapters from the end (~400 words)

Target: ~3700 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Anthropic 2024-2025 — "Model Context Protocol" (MCP)
- **Documentation:** [docs.anthropic.com/en/docs/agents-and-tools/mcp](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
- **What it contributed:** Standardized protocol for tool/data integration. Servers expose tools; clients (LLM applications) discover and invoke them. **Removes the need for every agent framework to define its own tool API.**

### OpenAI 2023 — "Function calling" specification
- **Documentation:** [platform.openai.com/docs/guides/function-calling](https://platform.openai.com/docs/guides/function-calling)
- **What it contributed:** Native LLM support for structured tool calls. The LLM produces JSON conforming to a provided schema; the developer executes the function; the result feeds back in. **The dominant pattern for tool invocation before MCP standardization.**

### Anthropic 2024 — "Tool use with Claude"
- **Documentation:** [docs.anthropic.com/en/docs/build-with-claude/tool-use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- **What it contributed:** Anthropic's tool-use API with parallel tool calls, structured outputs, and reasoning tokens. **Used heavily in Claude Code and other Anthropic products.**

### Nelson 1965 — "Complex information processing" (the original observability ancestor)
- Cross-reference for: structured logging, trace IDs, distributed tracing — concepts that long predate LLMs but apply directly to agent observability.

### OpenTelemetry community 2019-present
- **Spec:** [opentelemetry.io](https://opentelemetry.io)
- **What it contributed:** Standard for distributed tracing — spans, trace IDs, parent-child relationships. **Adopted by agent observability tools (LangSmith, Helicone, Braintrust).**

### LangSmith 2023 — agent observability platform
- **What it contributed:** Trace recording and analysis for LangChain agents; established the visual paradigm of agent-trace inspection (nested spans for tool calls, LLM calls, parsing steps).

### Schick et al. 2023 — "Toolformer" (Ch 21 already cited)
- Cross-reference for tool-use fine-tuning; foundational substrate for modern tool use.

### Yao et al. 2022 — "ReAct" (Ch 27 already cited)
- Cross-reference for the agent loop structure that frames tool-call placement.

### Anthropic's prompting guides 2024-2025
- **Documentation:** [docs.anthropic.com/en/docs/build-with-claude/prompt-engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
- **What it contributed:** Best practices for system prompts, tool descriptions, few-shot examples, structured outputs. **The most actionable production prompting guide as of 2025.**

### Various 2024-2025 — agent framework documentation
- **LangGraph** docs on state machines and persistence
- **CrewAI** docs on role-based agents
- **AutoGen** docs on conversation patterns
- **OpenAI Assistants API** docs on thread management

---

## Core concepts

### Concept 1: From concept to code

**The 80/20 of agent engineering**:
- **20% LLM**: the model itself, the prompt, the basic loop (Ch 27)
- **80% engineering**: tools, schemas, error handling, observability, scaffolding (this chapter)

Most production agents fail not because the LLM is bad but because the surrounding engineering is incomplete. **Building an agent that survives production traffic requires engineering depth, not just LLM expertise.**

**What goes into a real agent**:

```mdx
<Equation label="28.real-agent">
$$\text{production agent} \;=\; \text{ReAct loop} \;+\; \text{tools} \;+\; \text{schemas} \;+\; \text{error handling} \;+\; \text{observability} \;+\; \text{scaffolding}$$
</Equation>
```

Each component requires deliberate design. **Skip one and the agent is fragile.**

**Empirical anchors (early 2025)**:
- **Lines of code**: a minimal ReAct agent is ~50 lines; a production agent is 500-5000 lines
- **Tools**: production agents typically have 5-50 well-designed tools, not hundreds
- **Latency**: per-turn latency 1-10 seconds; total task latency 10-300 seconds for non-trivial tasks
- **Cost**: $0.01-$10 per task depending on complexity and model
- **Reliability target**: 95%+ task completion rate for production deployment

**The chapter's framing**: **engineering with empathy for the LLM.** Tools should be designed so the LLM can use them effectively — not so the engineer feels clever. Schemas should be obvious. Errors should be informative. Traces should be readable. **The agent is a system; engineering is the system design.**

### Concept 2: Tool design principles

**A tool is a function the agent can call.** Designing good tools is the most important non-LLM skill in agent engineering.

**Principle 1 — Single responsibility**:
Each tool does one thing. **Avoid grab-bag utilities** ("file_operations" that reads, writes, lists, copies). Instead: `read_file`, `write_file`, `list_directory`, `copy_file`. **The LLM picks tools by name** — clear names beat clever abstractions.

**Principle 2 — Atomic operations**:
Tools should be atomic — either complete fully or fail cleanly. **Avoid partial-completion semantics** that the LLM has to reason about. If a tool can fail halfway, design it so the LLM can recover.

**Principle 3 — Clear contracts**:
Each tool has:
- A name (verb-noun: `read_file`, `search_web`, `send_email`)
- A description (1-3 sentences for the LLM)
- Parameters with types and descriptions
- A return value with predictable structure
- Documented error modes

**Principle 4 — Idempotency where possible**:
A tool that can be called twice without different results is safer than one that can't. **Critical for retry logic** — if the LLM calls a tool, doesn't get a response, and retries, will the system be in a consistent state? **Reads are naturally idempotent; writes often aren't.**

**Principle 5 — Bounded outputs**:
Tools should return bounded amounts of data. **A `search_web` that returns 100 results blows up the context window.** Limit, paginate, summarize.

**Principle 6 — Informative errors**:
Errors should tell the agent what went wrong AND what to try next. **"Connection failed" is bad; "Connection failed: timeout after 30s; retry or try a different tool" is good.** The LLM uses the error message to decide its next step.

**Tool design anti-patterns**:
- **Kitchen-sink tools**: one tool with 20 parameters and 12 modes
- **Magic parameters**: parameter names that don't tell the LLM what they do
- **Silent failures**: tools that return empty strings instead of explicit errors
- **Unbounded outputs**: tools that dump entire databases into the context

### Concept 3: Implementing tools

**The implementation patterns** for production tools:

**Pattern 1 — Synchronous Python functions**:
The simplest implementation. The function takes parameters, does its work, returns a result.

```python
def get_weather(city: str) -> dict:
    """Return current weather for a city."""
    response = requests.get(f"https://api.weather.com/{city}")
    response.raise_for_status()
    return response.json()
```

**Pros**: simple, easy to test, easy to debug.
**Cons**: blocks the agent loop; doesn't scale to parallel calls.

**Pattern 2 — Async functions for I/O-bound tools**:
For tools that wait on network/disk, async unlocks parallel execution.

```python
async def get_weather(city: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(f"https://api.weather.com/{city}") as r:
            return await r.json()
```

**Pros**: parallel tool calls; better throughput.
**Cons**: needs async-aware agent loop; harder to debug.

**Pattern 3 — Timeouts on every tool**:
Every tool should have a timeout. **Infinite hangs are an anti-pattern** — they kill the agent loop without producing useful errors.

```python
def get_weather(city: str) -> dict:
    return requests.get(
        f"https://api.weather.com/{city}",
        timeout=10,  # 10-second hard timeout
    ).json()
```

**Pattern 4 — Output truncation**:
Always cap tool output size. Long outputs blow up context.

```python
def read_file(path: str, max_chars: int = 10_000) -> str:
    with open(path) as f:
        content = f.read()
    if len(content) > max_chars:
        return content[:max_chars] + f"\\n... [truncated; file is {len(content)} chars]"
    return content
```

**Pattern 5 — Side-effect tools with confirmation**:
Tools that modify state (send email, delete file, run code) should ideally require explicit confirmation or run in sandboxed environments. **The LLM might call them by mistake.**

**Pattern 6 — Tool registries**:
A registry maps tool names to functions, schemas, and descriptions. **Single source of truth** for what tools exist.

```python
TOOLS = {
    'get_weather': {
        'function': get_weather,
        'schema': {...},
        'description': '...',
    },
    'read_file': {...},
}
```

### Concept 4: Tool schemas and structured calls

**The schema problem**:
The LLM doesn't see Python types — it sees text. **Schemas tell the LLM how to call tools** in a structured, parseable way. Two dominant approaches: **function calling** (OpenAI's, now widely adopted) and **MCP** (Anthropic's open standard).

**OpenAI function calling**:
The LLM produces JSON conforming to a schema. The developer parses and executes.

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

When the LLM wants to call the tool, its response contains a structured `tool_calls` array:

```json
{
  "tool_calls": [
    { "function": { "name": "get_weather", "arguments": "{\\"city\\":\\"Tokyo\\"}" } }
  ]
}
```

The developer parses `arguments`, calls `get_weather`, and feeds the result back as a `tool` message.

**Anthropic tool use**:
Conceptually identical structure (define tools as JSON schemas; LLM produces structured tool-use blocks). **Differences**: explicit parallel tool calls; reasoning tokens; slightly different message formatting.

**Model Context Protocol (MCP)**:
A protocol layer above function calling. **MCP servers** expose tools; **MCP clients** (LLM applications) discover and invoke them. **Standardizes**: tool discovery, authentication, schemas, error handling.

**Why this matters**:
- **Tools become portable** between LLM providers
- **Tool discovery** is automatic — the LLM client can list available tools without hardcoding
- **Authentication** is handled by the protocol, not per-application
- **Versioning** is part of the spec

**OpenAPI integration**:
Many existing REST APIs can be auto-converted to tool schemas. **Mature tooling exists** for OpenAPI → function-calling-schema conversion. **Lets agents use any REST API** with minimal work.

**Schema best practices**:
- **Descriptions matter**: the LLM picks tools by reading descriptions
- **Parameter examples in descriptions**: helps the LLM call correctly
- **Required vs optional**: be explicit
- **Enums for constrained values**: prevents the LLM from passing junk
- **Object types for complex inputs**: lets the LLM structure rich arguments

### Concept 5: Error handling and recovery

**The reality of tool errors**:
- Network failures
- Service unavailable
- Rate limits
- Invalid arguments (LLM gets it wrong)
- Timeouts
- Authentication failures
- Permission denied

**Every one happens regularly in production.**

**Pattern 1 — Retry with exponential backoff**:
For transient failures (network, rate limit). Wait progressively longer between attempts.

```python
def call_with_retry(tool, args, max_retries=3):
    for attempt in range(max_retries):
        try:
            return tool(args), None
        except (TransientError, TimeoutError) as e:
            wait = 2 ** attempt   # 1s, 2s, 4s
            time.sleep(wait)
    return None, f"Failed after {max_retries} attempts"
```

**Pattern 2 — Circuit breakers**:
If a tool fails repeatedly, stop calling it for a cooldown period. **Prevents cascade failures** when one service is down.

```python
class CircuitBreaker:
    def __init__(self, threshold=5, cooldown=60):
        self.failures = 0
        self.open_until = None
        self.threshold = threshold
        self.cooldown = cooldown
    
    def call(self, fn, *args):
        if self.open_until and time.time() < self.open_until:
            raise CircuitOpen("Circuit breaker tripped")
        try:
            result = fn(*args)
            self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            if self.failures >= self.threshold:
                self.open_until = time.time() + self.cooldown
            raise
```

**Pattern 3 — Fallback tools**:
When one tool fails, try a backup. **Useful for redundancy** — e.g., two web search providers.

**Pattern 4 — Surface errors to the LLM**:
Don't swallow errors. The LLM uses error messages to plan recovery. **Return structured error info** as the tool result; let the LLM decide what to do.

```python
def safe_call(tool, args):
    try:
        return {'status': 'ok', 'result': tool(args)}
    except Exception as e:
        return {'status': 'error', 'error_type': type(e).__name__, 'message': str(e)}
```

The LLM sees the structured error and can choose: retry, try a different tool, or give up gracefully.

**Pattern 5 — Bounded iteration**:
Even with all error handling, cap iterations. **No agent should loop indefinitely** waiting for a non-existent solution.

**Pattern 6 — Cost budgets**:
Cap total cost per task. **If an agent burns through $10 in inference without making progress**, something is wrong.

**Error-handling anti-patterns**:
- **Swallowing errors silently** — agent never recovers
- **Retrying non-retryable errors** — invalid arguments will fail forever
- **Infinite retry** — bad pattern with backoff or without
- **Catching too broadly** — `except Exception` hides bugs

### Concept 6: Observability — tracing and debugging

**The trace problem**:
When an agent fails in production, the trace is the only diagnostic. **Without good traces, debugging is impossible.**

**A good trace shows**:
- Every LLM call (model, prompt tokens, completion tokens, latency, cost)
- Every tool call (name, arguments, result, latency, success/failure)
- The thought-action-observation sequence
- Errors and recoveries
- Cost and time accumulating per task

**Structured logging**:
Log every event as structured JSON, not free-text:

```python
logger.info({
    'event': 'tool_call',
    'task_id': 'abc123',
    'iteration': 3,
    'tool': 'get_weather',
    'arguments': {'city': 'Tokyo'},
    'latency_ms': 247,
    'success': True,
    'result_chars': 145,
})
```

**Distributed tracing** (OpenTelemetry):
- **Trace ID**: unique per task
- **Spans**: nested timed operations (LLM call → tool call → result processing)
- **Parent-child**: each span knows its parent
- **Attributes**: structured metadata per span

**Trace visualization**:
Production tools (LangSmith, Helicone, Braintrust, custom) render traces as nested timelines. **The visual representation** shows agent behavior at a glance — which tools are slow, where errors occur, what reasoning the LLM produced.

**Debugging from traces**:
- **Hung agent**: look for spans without end times
- **Wrong answer**: look at the thought-action sequence for missteps
- **Cost spike**: look for excessive iterations or large contexts
- **Slow response**: look for slow tools or model latency

**Production observability patterns**:
- **Alert on long traces** (probable infinite loops)
- **Alert on cost spikes** (probable runaway agents)
- **Alert on high error rates** (probable tool/service issues)
- **Sample slow traces** for inspection
- **Anonymize PII** in logged prompts

### Concept 7: Scaffolding the agent

**What goes into the agent's "scaffolding"** (everything that's not the loop or the tools):

**1 — System prompt**:
Sets the agent's role, behavior, constraints. **Most important single piece of agent code.**

A minimal production system prompt:
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

**2 — Tool descriptions**:
Each tool's description is read by the LLM at every call. **Write them as if writing for a colleague.**

**3 — Few-shot examples**:
Examples of correct agent behavior, embedded in the system prompt. **The most-impactful single intervention** for many tasks. Two or three good examples often outperform paragraphs of instructions.

**4 — Output validation**:
After the LLM produces output, validate it. **Structured outputs (JSON) need schema validation; free-text outputs may need pattern matching.** Reject and retry on invalid output.

**5 — Memory layer**:
What state does the agent preserve across turns / sessions? See Ch 27 section 5. Short-term in context; long-term in vector DB / structured store / summary.

**6 — Conversation management**:
For chat-style agents: how do you maintain user identity, session state, conversation history? **Production agents often have a separate "conversation" layer above the loop.**

**7 — Cost and rate limits**:
Set per-task budgets. **Hard caps prevent runaway costs.**

**Scaffolding anti-patterns**:
- **Massive system prompts** that the LLM can't reliably follow (>2000 tokens)
- **Vague tool descriptions** ("does stuff with data")
- **No few-shot examples** when the task is unusual
- **Skipping validation** because the LLM "usually gets it right"

### Concept 8: Three chapters from the end

**Part IX chapter map**:

| Chapter | Topic | Status |
|---------|-------|--------|
| Ch 27 | Agent foundations | ✅ |
| **Ch 28 (this)** | **Agents from scratch** | (closing here) |
| Ch 29 | Multi-agent | ⬜ |
| Ch 30 | Agent eval and frameworks | ⬜ (closes the curriculum) |

**What's left**:
- **Ch 29 (Multi-agent)** — when single-agent setups aren't enough; orchestration patterns; agent-to-agent communication; frameworks (CrewAI, AutoGen, Swarm)
- **Ch 30 (Agent eval and frameworks)** — how to evaluate agents quantitatively; production frameworks; deployment patterns; the curriculum's close

**The trajectory**:
- Ch 27 conceptual → Ch 28 engineering → Ch 29 composition → Ch 30 evaluation
- Each builds on the prior
- The curriculum closes with Ch 30 — bringing Part VIII's eval discipline back to bear on agent systems

**After Ch 30**: the reader has the full stack. **From numpy primitives (Ch 1) through transformer internals (Ch 4-6), pretraining and post-training (Ch 7-14), inference (Ch 17-19), reasoning and tools (Ch 20-23), safety/interp/eval (Ch 24-26), and agent systems (Ch 27-30) — every layer covered.**

---

## Glossary

- **Tool**: a function the agent can call (synonyms: function, action, capability)
- **Tool schema**: structured definition of a tool's name, parameters, return value
- **Function calling**: OpenAI's structured tool-call API
- **MCP (Model Context Protocol)**: Anthropic's open tool/data integration standard
- **OpenAPI**: REST API specification standard; convertible to function-calling schemas
- **Idempotent**: calling twice has the same effect as calling once
- **Atomic**: completes fully or fails cleanly; no partial state
- **Tool registry**: mapping of tool names to functions, schemas, descriptions
- **Retry with exponential backoff**: wait progressively longer between retries (1s, 2s, 4s, ...)
- **Circuit breaker**: stop calling a failing service after N failures; reset after cooldown
- **Fallback tool**: backup tool to try when the primary fails
- **Span**: a single timed operation in a distributed trace
- **Trace ID**: identifier connecting all spans of a single task
- **Structured logging**: logging events as JSON instead of free-text
- **System prompt**: the prompt that sets the agent's role and behavior
- **Tool description**: text the LLM reads to decide whether/how to call a tool
- **Few-shot examples**: examples of correct behavior embedded in the system prompt
- **Output validation**: checking the LLM's output against expectations
- **Cost budget**: maximum spend allowed per task
- **Bounded iteration**: explicit maximum number of agent loop iterations
- **PII**: personally identifiable information (must be anonymized in logs)

---

## Pedagogical analogies

### 1. Tools as REST endpoints
A well-designed REST endpoint has a clear URL, parameters, response format, and error semantics. **A well-designed tool is the same** — name, parameters, return value, errors. Engineers from API backgrounds will recognize most of the principles in section 2.

Best used for: section 2.

### 2. Schemas as contracts
A function signature in a typed language is a contract: "give me these types; I'll return this type." **A tool schema is the same contract**, but expressed in JSON for the LLM to parse. Schema design IS contract design.

Best used for: section 4.

### 3. Error handling as defensive driving
A defensive driver assumes others will make mistakes — and prepares to react. **Robust agent code does the same**: tools will fail, schemas will be ignored, LLMs will produce malformed output. Defense isn't paranoia; it's engineering.

Best used for: section 5.

### 4. Observability as flight-data recording
Aircraft have flight data recorders not because crashes are common but because **when they happen, the recording is the only way to understand what went wrong.** Agent traces are the same — they're invisible most of the time but indispensable when things break.

Best used for: section 6.

### 5. Scaffolding as the building's foundation
The visible part of a building is the structure; the invisible part is the foundation, the plumbing, the electrical. **Agent scaffolding is the invisible part** — system prompts, tool descriptions, examples, validation — that the user never sees but that makes everything work.

Best used for: section 7.

---

## Common misconceptions

### MC1: "If I just give the LLM more tools, it'll figure it out."
**Reality:** false. **More tools without clear descriptions and good design hurt agent performance.** The LLM has to read every tool description; it has to decide which to call; it has to remember constraints. **5 well-designed tools beat 50 sloppy ones.**

### MC2: "Frontier models don't need much scaffolding."
**Reality:** partially false. **Frontier models tolerate worse scaffolding** than older models, but the best-performing agents still invest heavily in system prompts, tool descriptions, and few-shot examples. **Scaffolding compounds the model's capability** — skip it and you leave performance on the table.

### MC3: "Function calling is mostly solved."
**Reality:** mostly true for individual calls; not for complex sequences. **Single tool calls work reliably** with frontier models. **Multi-tool chains, parallel calls, and recovery from tool errors** still require engineering work. The hard problems moved up the stack, not away.

### MC4: "Retries with backoff handle most production errors."
**Reality:** mostly true for transient errors. **For non-transient errors** (invalid arguments, authentication failures, permanent service outages), retry just wastes time. **Categorize errors first; retry only the retryable ones.**

### MC5: "Logging is enough for observability."
**Reality:** false. **Logs are necessary but not sufficient.** Production agent observability needs structured logs PLUS distributed tracing PLUS visualization tools. Reading thousands of log lines to debug an agent failure is impractical; trace visualization is essential.

### MC6: "MCP will replace function calling."
**Reality:** debatable. **MCP adds standardization above function calling**, not replacement. The underlying mechanism (LLM produces structured tool calls; developer executes) is the same. **MCP is plumbing, not a paradigm shift** — useful but not revolutionary.

### MC7: "I should use the latest framework."
**Reality:** false in general. **Most production agents are custom code** that uses frameworks as scaffolding, not as the whole solution. Frameworks change rapidly; your domain logic shouldn't be tightly coupled to one framework's API.

### MC8: "Tool errors should be hidden from the LLM."
**Reality:** false. **The LLM uses error messages to plan recovery.** Hiding errors means the LLM can't decide what to do next; it might retry the same broken tool indefinitely. **Surface errors as structured observations.**

---

## Tricky implementation details

### TID1: Token counting for budgets
LLM costs depend on input + output tokens. **Estimating cost requires accurate token counting.** Each provider has slightly different tokenizers; use the provider's official library.

### TID2: Tool call parsing robustness
Even with structured outputs, the LLM occasionally produces malformed tool calls. **Build a parser that handles edge cases**: missing fields, wrong types, extra fields. Recover by asking the LLM to retry with the malformed output as context.

### TID3: Async + sync mixing
If some tools are async and some are sync, the agent loop needs to handle both. **Wrapping sync tools in async** (via `asyncio.to_thread`) is the cleanest pattern.

### TID4: Tool registry hot-reload
For development, you want to add/edit tools without restarting the agent. **Hot-reload patterns** require care — function references in the registry, schema regeneration, etc.

### TID5: System-prompt versioning
System prompts evolve. **Version them like code.** Each agent task should record which prompt version generated it; A/B test prompt changes.

### TID6: Few-shot example selection
For complex tasks, dynamic few-shot examples (retrieve relevant examples per task) outperform static ones. **Retrieval over examples** is RAG-for-prompts — the same Ch 22 patterns apply.

### TID7: Confidential data in traces
Agent traces contain whatever the LLM saw — including PII. **Anonymize before logging.** Real production: redact phone numbers, emails, SSNs, etc. before traces leave the application.

### TID8: Sandboxing dangerous tools
Tools that execute code, modify files, or hit external services should be sandboxed. **Docker containers, VMs, or restricted environments** prevent runaway agents from doing real damage.

### TID9: Parallel tool calls
Many providers support parallel tool calls (LLM emits multiple calls in one turn). **Implementation choice**: execute sequentially (simpler) or in parallel (faster). Parallel needs careful error handling.

### TID10: Caching tool results
Many tool calls are repeated within a task. **Cache by (tool, arguments)**. Saves cost and latency. **Be careful with non-idempotent tools** — caching mutations is a bug.

---

## Reference implementations

### A complete tool registry pattern

```python
# A production-style tool registry: function + schema + description.
# This is the pattern at the heart of every well-engineered agent.

from typing import Callable
import json

class Tool:
    def __init__(
        self,
        name: str,
        description: str,
        parameters_schema: dict,
        function: Callable,
    ):
        self.name = name
        self.description = description
        self.parameters_schema = parameters_schema
        self.function = function
    
    def to_openai_schema(self):
        """Convert to OpenAI function-calling schema format."""
        return {
            'type': 'function',
            'function': {
                'name': self.name,
                'description': self.description,
                'parameters': self.parameters_schema,
            },
        }
    
    def to_anthropic_schema(self):
        """Convert to Anthropic tool-use schema format."""
        return {
            'name': self.name,
            'description': self.description,
            'input_schema': self.parameters_schema,
        }
    
    def execute(self, arguments: dict) -> dict:
        """Execute with structured error handling."""
        try:
            result = self.function(**arguments)
            return {'status': 'ok', 'result': result}
        except Exception as e:
            return {
                'status': 'error',
                'error_type': type(e).__name__,
                'message': str(e),
            }


# Tool registry
TOOLS: dict[str, Tool] = {}


def register(name: str, description: str, parameters_schema: dict):
    """Decorator to register a tool."""
    def wrapper(fn):
        TOOLS[name] = Tool(name, description, parameters_schema, fn)
        return fn
    return wrapper


# Register some example tools
@register(
    name='get_weather',
    description='Get current weather for a city. Returns temperature and conditions.',
    parameters_schema={
        'type': 'object',
        'properties': {
            'city': {
                'type': 'string',
                'description': 'City name (e.g. "Tokyo", "Paris", "San Francisco")',
            },
        },
        'required': ['city'],
    },
)
def get_weather(city: str) -> dict:
    # Mock: real implementation calls a weather API
    return {'city': city, 'temp_c': 18, 'conditions': 'partly cloudy'}


@register(
    name='calculate',
    description='Evaluate a mathematical expression. Returns the result.',
    parameters_schema={
        'type': 'object',
        'properties': {
            'expression': {
                'type': 'string',
                'description': 'Math expression (e.g. "2 + 2", "sqrt(144)", "5 * 7")',
            },
        },
        'required': ['expression'],
    },
)
def calculate(expression: str) -> float:
    # Real implementation: safer eval; here for demo
    import math
    return eval(expression, {'__builtins__': {}}, {'sqrt': math.sqrt, 'pi': math.pi})


# Test: convert registry to schemas
print("OpenAI schemas:")
for name, tool in TOOLS.items():
    print(json.dumps(tool.to_openai_schema(), indent=2))
    print()

# Execute a tool
print("Executing get_weather('Tokyo'):")
result = TOOLS['get_weather'].execute({'city': 'Tokyo'})
print(json.dumps(result, indent=2))

# Execute a tool that fails
print("\\nExecuting calculate('1/0'):")
result = TOOLS['calculate'].execute({'expression': '1/0'})
print(json.dumps(result, indent=2))

# Observations:
# - Registry centralizes tool definition (function + schema + description)
# - to_openai/anthropic_schema() converts for provider-specific APIs
# - execute() wraps in structured error handling
# - Errors are returned to the LLM as structured data, not raised
```

### A circuit-breaker + retry agent

```python
# Combining circuit breakers and retry with backoff.
# Production agents use this layered defense.

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
        # Check if circuit is open
        if time.time() < self.open_until:
            raise Exception("CircuitOpen: service unavailable")
        try:
            result = fn(*args, **kwargs)
            self.failures = 0  # Reset on success
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
            print(f"  Attempt {attempt + 1} failed: {e}. Waiting {wait*1000:.0f}ms...")
            time.sleep(wait)
    return None, f"Failed after {max_retries} attempts"


# Mock flaky tool
def flaky_search(query):
    """Fails 60% of the time when "broken" mode is active."""
    if random.random() < 0.6:
        raise ConnectionError("Service temporarily unavailable")
    return f"Search results for: {query}"


# Compose: circuit breaker around retry around the tool
breaker = CircuitBreaker(threshold=2, cooldown=0.5)


def safe_search(query):
    """Tool wrapped with circuit breaker + retry."""
    try:
        result, error = with_retry(lambda q: breaker.call(flaky_search, q), query, max_retries=2)
        if error:
            return f"Error: {error}"
        return result
    except Exception as e:
        return f"Error: {e}"


# Run several calls
random.seed(42)
for i in range(6):
    print(f"\\nCall {i + 1}: searching for 'topic_{i}'")
    print(f"Result: {safe_search(f'topic_{i}')}")
    time.sleep(0.1)

# Observations:
# - Retry handles short-lived flakiness
# - Circuit breaker prevents bombarding a failing service
# - Combined: bounded retry + bounded calls when broken
# - Real production: also add fallback tools, structured error reporting
```

### A minimal observability layer

```python
# A simple structured-logging trace layer.
# Production: use OpenTelemetry; this shows the conceptual pattern.

import time
import uuid
import json
from contextlib import contextmanager

class Tracer:
    def __init__(self):
        self.spans = []
        self.task_id = None
        self.span_stack = []
    
    def start_task(self, name: str):
        self.task_id = str(uuid.uuid4())
        self.spans = []
        self.span_stack = []
        return self.task_id
    
    @contextmanager
    def span(self, name: str, **attrs):
        """Context manager: opens a span; closes on exit."""
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
                parent = next((s for s in self.spans if s['span_id'] == pid), None)
                pid = parent['parent_id'] if parent else None
            indent = '  ' * depth
            status_icon = '✓' if span.get('status') == 'ok' else '✗'
            print(f"{indent}{status_icon} {span['name']:>20} ({span['duration_ms']:.1f}ms) "
                  f"{span['attributes']}")


# Use the tracer
tracer = Tracer()
tracer.start_task("answer_user_query")

with tracer.span("agent_turn", iteration=1):
    with tracer.span("llm_call", model="claude-sonnet-4", tokens=450):
        time.sleep(0.05)   # mock LLM latency
    
    with tracer.span("tool_call", tool="get_weather", city="Tokyo"):
        time.sleep(0.02)   # mock tool latency

with tracer.span("agent_turn", iteration=2):
    with tracer.span("llm_call", model="claude-sonnet-4", tokens=320):
        time.sleep(0.04)
    with tracer.span("tool_call", tool="get_date"):
        time.sleep(0.01)

with tracer.span("agent_turn", iteration=3):
    with tracer.span("llm_call", model="claude-sonnet-4", tokens=180):
        time.sleep(0.03)

tracer.report()

# Observations:
# - Each operation is a span: parent_id, start, end, duration
# - Spans nest naturally via context managers
# - Real production: OpenTelemetry standardizes this; LangSmith renders it
# - Visualization makes hours of debug work into seconds of inspection
```

---

## Connections to other chapters

- **Ch 19 (Sampling)**: temperature affects agent decisions; tool calls work best at low temperature
- **Ch 20 (Reasoning)**: CoT is the "Thought" half of ReAct; this chapter covers the "Action" engineering
- **Ch 21 (Tool use)**: tool use as LLM capability; this chapter is the engineering of tools
- **Ch 22 (RAG)**: retrieval is a tool; dynamic few-shot example retrieval applies the same pattern
- **Ch 23 (Multimodal)**: computer-use agents (Anthropic's tool) are agents with multimodal tools
- **Ch 24 (Safety)**: agent safety — bounded autonomy, sandboxing, oversight
- **Ch 25 (Interpretability)**: monitoring agent behavior via internal-state inspection
- **Ch 26 (Evaluation)**: SWE-bench, GAIA, OSWorld evaluate agents built with these techniques
- **Ch 27 (Agent foundations)**: the conceptual chapter this builds on
- **Ch 29 (Multi-agent)**: composing multiple agents — uses everything from this chapter
- **Ch 30 (Agent eval and frameworks)**: closes the curriculum; brings Ch 26's eval discipline to agents

---

## Open questions for the chapter author

### Q1: How much code in the chapter prose?
**Recommendation:** substantial. Ch 28 is the engineering chapter. Code examples in sections 2-7. **Don't crowd out the conceptual content** — keep examples short and illustrative; full implementations in the runnables.

### Q2: How much MCP vs function calling?
**Recommendation:** balanced. Cover both since both are used in production. **Frame MCP as standardization above function calling**, not replacement. Engineers will pick based on their stack.

### Q3: How much framework discussion?
**Recommendation:** brief. Name the canon (LangGraph, CrewAI, AutoGen, Anthropic's MCP) in section 7 or 8. **Don't tutorial any framework** — engineers will pick based on their domain.

### Q4: How much observability detail?
**Recommendation:** moderate. **Section 6 should establish the operational frame** — structured logging, traces, spans, debugging from traces. **Don't deep-dive OpenTelemetry** — that's tooling-specific.

### Q5: Tool sandboxing depth?
**Recommendation:** brief mention. Acknowledge that dangerous tools need sandboxing; don't tutorial container patterns.

### Q6: Widget candidates
1. **Tool Schema Builder (marquee):** interactive — pick a Python function from a list, see the auto-generated OpenAI/Anthropic schema, see how the LLM would call it. **Makes the function → schema mapping concrete.** **Recommended marquee.**
2. **Agent Trace Inspector (secondary):** show a 5-turn agent trace with token counts, latencies, costs, errors per span. **Makes observability concrete.** **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 28 is a **single-topic chapter**. Uses the **4-file cadence**.

Planned file layout:
- File 155: research (this)
- File 156: page structure (~750 lines, 8 sections; runnables embedded)
- File 157: Tool Schema Builder marquee widget
- File 158: Agent Trace Inspector secondary widget + exercises + closeout (slot 159 absorbed)

**Pedagogical outcomes for the reader.** After Ch 28, the reader should be able to:
1. Articulate the 80/20 of agent engineering (loop vs everything else)
2. Apply the 6 tool design principles to a new domain
3. Implement tools with proper contracts, timeouts, output bounds
4. Generate function-calling / MCP schemas from Python function signatures
5. Implement retry + circuit-breaker + fallback error handling
6. Add structured tracing to an agent and debug from traces
7. Design effective scaffolding (system prompts, descriptions, examples)
8. Identify how Ch 28 connects to Ch 29 (composition) and Ch 30 (closing)

Eight outcomes. Exercises hit outcomes 2, 3, 5, 7.

**Tonal framing**: engineering with empathy for the LLM. **Tools should be designed so the LLM can use them effectively** — not so the engineer feels clever. **Concrete numbers** (production agent line counts: 500-5000; tool counts: 5-50; task costs: $0.01-$10; reliability targets: 95%+) and **honest tradeoffs** (sync vs async; function calling vs MCP; framework vs custom; cost vs reliability). **The 80% engineering reality** is the central frame — most agent failures are engineering failures, not LLM failures.

**Part IX, chapter 2 of 4**: this chapter takes the reader from Ch 27's concepts to production-ready code. **Three chapters from the curriculum's end.**

**Importance**: this is the chapter that lets engineers **actually build** what Ch 27 described. Without Ch 28, the foundations chapter is academic. **Production-grade agents are 80% the engineering this chapter covers.**
