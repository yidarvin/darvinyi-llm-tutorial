# Session 94 — Chapter 21 page structure

> First chapter session for Chapter 21 ("Tool use"). **The chapter that turns reasoning into agency.** Where Ch 20 gave the model time to think, Ch 21 gives it the ability to act — function calls, tool schemas, agent loops, MCP, computer use. **Bridges from ReAct (Ch 20 §4) into production engineering.** Single-topic chapter; uses the **4-file cadence**.

---

## Read first (in this order)

1. **`research/ch21-tool-use/research.md`** — the source material. Every section, equation, code snippet, and misconception traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch20-reasoning/session-89-page-structure.md`** — for the Phase 13 voice template (Ch 20 is the immediate predecessor; same "useful AI" energy)
4. **`prompts/chapters/ch19-sampling/session-86-page-structure.md`** — for the single-topic 4-file cadence template

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 21 page. By end of session:

- `src/pages/ch21-tool-use/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch21-tool-use/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 21's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch21-tool-use/` with sidebar showing Ch 21 active, prev/next nav linking to Ch 20 (active) and Ch 22 (disabled)

**Tonal note:** Ch 21 is **operational engineering with Phase 13's forward-looking energy.** Concrete and confident — every concept ties to a real API, a real protocol, or a real production failure mode. **Engineers should leave knowing how to design a tool-using system.** Concrete numbers (tool catalog sizes, agent loop step counts, ~85-95% success rates on benchmarks); honest tradeoffs (structured calls vs computer use; description-based vs embedding-based routing); explicit bridges (Ch 19 constrained decoding makes calls reliable; Ch 20 ReAct is the conceptual seed).

**Phase 13 progression**: this chapter follows Ch 20 (reasoning) and precedes Ch 22 (RAG). **The capability stack is being assembled**: reasoning gave the model time to think; tool use gives it agency; retrieval will give it knowledge; multimodal will extend it beyond text.

**Chapter cadence:** Ch 21 uses the **4-file cadence** (single-topic chapter).

---

## Inputs

State of the repo after session 92 (Ch 20 complete):

- Ch 1-20 all `'published'`
- `research/ch21-tool-use/research.md` exists
- `src/lib/chapters.ts` has Ch 1-20 `'published'`, Ch 21-30 `'planned'`
- No `src/pages/ch21-tool-use/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch21-tool-use/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch21-tool-use/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 21's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch21-tool-use
description: Tool use — how production agents call functions, query databases, browse the web, and control applications. From ReAct's prompting-era pattern (Yao 2022) to modern function-calling APIs (OpenAI, Anthropic, Google), tool schemas (JSON Schema), constrained decoding for structured tool calls, the multi-step agent loop, multi-tool routing strategies, observation and error handling, Anthropic's Model Context Protocol (MCP), and computer use as the frontier. The chapter that turns reasoning into agency.
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

> Chapter 20 ended with reasoning models that can think for minutes before answering — but they can only *describe* what they would do, not *do* it. A reasoning model that can't act on the world is limited. **Tool use** removes that limit. Modern LLMs are trained to emit structured calls to external functions; the surrounding system executes those calls; the results flow back into the model's context. The model decides when to invoke a tool and which tool to invoke. This is the bridge from chat to agency.
>
> The conceptual pattern is **ReAct** (Yao 2022), which Chapter 20 §4 introduced: think → act → observe → repeat. **This chapter is about turning that pattern into production engineering.** Function calling APIs (OpenAI, Anthropic, Google) standardized the structured-call interface. JSON Schema specifies what arguments a tool takes. Constrained decoding (Chapter 19) guarantees that the model's tool calls are well-formed. The **agent loop** iterates think-act-observe until the model produces a final answer. Multi-tool routing, observation handling, and error recovery turn the basic loop into a robust system. Anthropic's **Model Context Protocol** (MCP) standardizes how tools and clients communicate. **Computer use** generalizes tool calls to any application's UI.
>
> Every production LLM agent runs on this stack. Customer support bots, autonomous coding agents, retrieval pipelines, Claude with tool use, GPT with function calling, AI assistants embedded in IDEs and operating systems — they all use the patterns this chapter covers. **By the end, you'll know how to design and deploy a tool-using system**, where the production failure modes are, and which protocols are likely to matter in 2025 and beyond.

### Section 1: From ReAct to tools

**Heading:** `## From ReAct to tools`
**Word target:** ~400
**Sub-headings:** `### The bridge from Chapter 20`, `### What changed`

**Teaching beats:**

**The bridge from Chapter 20:**
1. **Chapter 20 §4** introduced the ReAct pattern: Thought → Action → Observation → Thought → ... The model interleaves reasoning with external actions.
2. **In 2022 (ReAct era)**: actions were emitted as natural-language strings; the surrounding system parsed them with regex or string matching.
3. **In modern production**: actions are emitted as **structured JSON** matching a declared schema; the system parses with a JSON parser; **constrained decoding (Ch 19)** guarantees the call is well-formed.

**What changed:**
4. The conceptual loop (think → act → observe → repeat) is identical.
5. The grounding effect (observations are real, not fabricated) is identical.
6. The model's autonomy in choosing when and which tool to call is identical.
7. **What's new**: production-grade infrastructure — schemas, validators, dispatchers, retry logic, monitoring.

**Empirical scale:**
- **Toolformer** (2023): ~70% success rate on a few dozen tools
- **GPT-4 + function calling** (2023): ~85-95% on benchmarks
- **Modern frontier** (2025): hundreds of tools, agentic loops spanning 50+ steps, ~70-85% on complex multi-step tasks

**Required callout** — type `aside`: Tool use is the single most economically consequential LLM capability of 2023-2025. **Every production agent runs on it** — customer support, coding agents, browser automation, IDE integrations, computer use. The patterns in this chapter aren't optional knowledge for engineers building AI systems; they're the foundation.

**No code in this section.** Bridge setup.

**Connection forward:** Section 2 introduces the modern function calling APIs.

### Section 2: Function calling APIs

**Heading:** `## Function calling APIs`
**Word target:** ~600 — IMPORTANT (foundational)
**Sub-headings:** `### The interface convention`, `### Provider variations`, `### Why structured beats natural-language`

**Teaching beats:**

**The interface convention** (established by OpenAI June 2023):
1. The model is given: a **list of available tools** (each with name, description, parameter schema), the user's request, and the conversation history.
2. The model emits either: a **regular text response** (no tool needed) or a **structured tool call** (tool name + JSON arguments).
3. The system: parses the tool call, executes the function, returns the result as a **tool message** in the conversation.
4. The model continues with the result in context.

**Provider variations:**
- **OpenAI**: `tools` array; `tool_choice` parameter; `tool_calls` in response
- **Anthropic**: `tools` array; tool-use response blocks; **parallel tool calls** supported natively
- **Google (Gemini)**: "function declarations"; similar pattern
- **Convergence**: all three converged on JSON-Schema-based parameter specs

```mdx
<Equation label="21.tool-call">
$$\text{model}(\text{context}, \text{schemas}) \;\to\; \text{either text response or } \{\text{name}, \text{args (JSON conforming to schema)}\}$$
</Equation>
```

**Why structured beats natural-language:**
- **Reliability**: a JSON parser always succeeds or fails cleanly; regex parsing of natural language is brittle.
- **Programmatic dispatch**: function call → function execution is one step, not many.
- **Type safety**: parameter schemas catch errors at the boundary.
- **Composability**: tool calls chain cleanly through agent loops.

**The constrained-decoding bridge to Ch 19:**
- FSM masking (Ch 19 §8) enforces valid JSON structurally
- The model is constrained at *each token* to emit only valid continuations of the schema
- **Structural validity is guaranteed**; semantic correctness still depends on the model

**Required code** — `<RunnableCode>` showing a single Anthropic-style tool call (schematic — no real API needed for the demo):

```python
# Anthropic-style tool call structure (schematic, no API calls)
# The pattern: define schemas, send query, parse response, execute, send result back

tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a location.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "City, e.g., 'San Francisco'"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
            },
            "required": ["location"],
        },
    }
]

# What the model emits (the model produces this structured output)
mock_model_response = {
    "stop_reason": "tool_use",
    "content": [
        {"type": "text", "text": "I'll check the weather for you."},
        {
            "type": "tool_use",
            "id": "call_abc",
            "name": "get_weather",
            "input": {"location": "San Francisco", "unit": "fahrenheit"},
        },
    ],
}

# System extracts the tool call
tool_call = next(b for b in mock_model_response["content"] if b["type"] == "tool_use")
print(f"Model wants to call: {tool_call['name']}({tool_call['input']})")

# System executes the function
def get_weather(location, unit="fahrenheit"):
    return f"72°{'F' if unit == 'fahrenheit' else 'C'}, sunny"

result = get_weather(**tool_call["input"])
print(f"Tool result: {result}")

# System sends result back to model (as a tool_result message)
tool_result_message = {
    "role": "user",
    "content": [
        {"type": "tool_result", "tool_use_id": tool_call["id"], "content": result}
    ],
}
print(f"\\nSent back to model: {tool_result_message}")
print("\\n(Model would now produce a final text response using the weather data.)")
```

**Required callout** — type `note`: MC2 from research.md. "Function calling APIs are model-specific and not portable." **Mostly true historically; converging now.** OpenAI, Anthropic, and Google all use JSON-Schema-based tool calling with slight API differences. **MCP** (covered in section 7) standardizes the tool-server side. **Cross-provider tool definitions are now practical** — write tools once, use them with multiple providers.

**Connection forward:** Section 3 dives into the tool schemas themselves.

### Section 3: Tool schemas

**Heading:** `## Tool schemas`
**Word target:** ~500
**Sub-headings:** `### Anatomy of a schema`, `### Schema best practices`

**Teaching beats:**

**Anatomy of a schema:**
1. **Name** — stable identifier (`get_weather`, `search_database`)
2. **Description** — natural-language guidance for the model
3. **Parameters** — JSON Schema describing required and optional arguments

**Example (annotated)**:

```yaml
name: search_database
description: |
  Search the company knowledge base for documents matching a query.
  Returns up to 5 most relevant documents with titles and excerpts.
parameters:
  type: object
  properties:
    query:
      type: string
      description: "The search query. Be specific."
    max_results:
      type: integer
      default: 5
      minimum: 1
      maximum: 10
  required: ["query"]
```

**Schema best practices:**
- **Clear descriptions**: the model picks tools based on descriptions; vague descriptions = bad tool selection
- **Use enums**: constrain string parameters to known values where possible (`unit: ["celsius", "fahrenheit"]`)
- **Required vs optional**: mark only truly-required parameters
- **Examples in descriptions**: "Examples: 'pricing changes', 'API authentication'"
- **Avoid overlapping tools**: two tools with similar descriptions confuse the model

**Sweet spot**: 50-200 characters per tool description.

**Required widget placeholder** — Tool Schema Validator (secondary, session 122):

```mdx
<WidgetFrame title="Tool schema validator" caption="Edit a JSON Schema; try different tool calls; see which pass and which fail. Structural validation by the API catches type errors and missing required fields at the boundary; semantic validation happens inside the tool. The widget makes 'what does constrained decoding guarantee' concrete.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 122 (secondary)
  </div>
</WidgetFrame>
```

**Required callout** — type `warning`: MC5 from research.md. "Constrained decoding makes tool calls reliable." **Mostly true with nuance.** **Structural validity** is guaranteed (the JSON parses; the schema matches). **Semantic correctness** isn't — the model can still pass nonsensical arguments (e.g., `get_weather(location="Atlantis")`). **Tool implementations need to validate** inputs even after the schema check.

**Connection forward:** Section 4 covers what happens when tool calls chain — the agent loop.

### Section 4: The agent loop

**Heading:** `## The agent loop`
**Word target:** ~600 — IMPORTANT (central operational concept)
**Sub-headings:** `### Single tool call`, `### Multi-step loop`, `### Parallel tool calls`

**Teaching beats:**

**Single tool call** (the simplest pattern):
1. User asks a question requiring one piece of external information
2. Model emits a tool call
3. System executes; returns result
4. Model produces final answer

**Multi-step loop** (the general pattern):

```python
while not done:
    response = model.generate(context, tools)
    if response.is_text():
        return response.text   # final answer; terminal
    tool_call = response.tool_call
    result = execute(tool_call)
    context.append(tool_call)
    context.append(result)
```

**Termination conditions**:
- **Natural**: model emits a text response (no more tool calls needed)
- **Limit**: `max_iterations` cap prevents infinite loops
- **Error**: unrecoverable error in execution

**Parallel tool calls** (Anthropic and OpenAI both support):
- Model can emit *multiple* tool calls in one response
- All execute in parallel (independence assumed)
- Results return together in the next message
- **Significant speedup for independent calls**

```mdx
<Equation label="21.agent-loop">
$$\text{loop until terminal: } \text{model} \to \text{action(s)} \to \text{execute} \to \text{observation(s)} \to \text{model} \to \ldots$$
</Equation>
```

**Required widget placeholder** — Tool Call Trace (marquee, session 121):

```mdx
<WidgetFrame title="Agent loop trace" caption="Step through a realistic multi-step agent loop. The model invokes 2-3 tools to answer a complex question; each step shows the thought, the tool call (with structured arguments), and the resulting observation. The widget makes 'how an agent thinks and acts' visible step-by-step — the production version of Ch 20's ReAct pattern.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 121 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing the agent loop:

```python
# Schematic agent loop with mock model + mock tools

def mock_model(messages, tools):
    """
    Mock model that produces tool calls based on the conversation state.
    In production this would be a real LLM API call.
    """
    last_user = messages[-1]["content"] if messages and messages[-1]["role"] == "user" else ""
    n_tools_called = sum(1 for m in messages if m["role"] == "assistant" and "tool_use" in str(m.get("content", "")))
    
    # First call: search the web
    if n_tools_called == 0:
        return {"stop_reason": "tool_use", "tool_use": {"name": "web_search", "input": {"query": "current weather San Francisco"}}}
    
    # Second call: calculate based on result
    if n_tools_called == 1:
        return {"stop_reason": "tool_use", "tool_use": {"name": "calculator", "input": {"expression": "(72 - 32) * 5 / 9"}}}
    
    # Final: produce text answer
    return {"stop_reason": "end_turn", "text": "It's 72°F (about 22°C) in San Francisco today."}

# Mock tools
def web_search(query): return f"Search results: 72°F, sunny in SF"
def calculator(expression): return f"{eval(expression):.1f}"

TOOLS = {"web_search": web_search, "calculator": calculator}

def agent_loop(user_message, max_iterations=10):
    messages = [{"role": "user", "content": user_message}]
    
    for step in range(max_iterations):
        response = mock_model(messages, TOOLS)
        print(f"\\n--- Step {step + 1} ---")
        
        if response["stop_reason"] == "end_turn":
            print(f"Final answer: {response['text']}")
            return response["text"]
        
        # Tool call step
        call = response["tool_use"]
        print(f"Tool call: {call['name']}({call['input']})")
        result = TOOLS[call["name"]](**call["input"])
        print(f"Observation: {result}")
        
        messages.append({"role": "assistant", "content": [{"type": "tool_use", **call}]})
        messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
    
    return None   # hit max_iterations

# Run
# answer = agent_loop("What's the weather in San Francisco in Celsius?")
# 
# # Expected trace:
# # Step 1: web_search → "72°F, sunny in SF"
# # Step 2: calculator(expression="(72-32)*5/9") → "22.2"
# # Step 3: end_turn → "It's 72°F (about 22°C) in San Francisco today."
```

**Connection forward:** Section 5 covers what happens with many tools available.

### Section 5: Multi-tool routing

**Heading:** `## Multi-tool routing`
**Word target:** ~400
**Sub-headings:** `### The selection problem`, `### Production patterns`

**Teaching beats:**

**The selection problem**:
1. With 5-10 tools, the model reads all descriptions and picks. Works fine.
2. With 50+ tools, descriptions consume too much context.
3. With 500+ tools, the model gets confused; similar tools collide.

**Production patterns**:

**1. Description-based routing** (default)
The model reads all tool descriptions and picks. Works at 5-50 tools.

**2. Hierarchical routing**
First classify the request into a tool *category*; then pick a specific tool within that category. Common at 50-500 tools.

**3. Tool retrieval (RAG for tools)**
Embed tool descriptions; at each step, retrieve the top-N most-relevant tools and present only those. **Required for >100 tools.**

**4. RBAC and permissions**
Hide tools the user/agent doesn't have access to. **Critical for production safety.**

**Common pitfalls**:
- **Overlapping descriptions**: "search_documents" vs "find_files" — the model picks wrong
- **Vague descriptions**: "fetch data" — model has no signal about which data
- **Hallucinated tools**: model invents a non-existent tool; return an error listing valid options

**Required callout** — type `aside`: MC3 from research.md. "More tools is always better." **False beyond ~50 tools.** Description bloat consumes context; similar tools confuse the model. **Production rule of thumb**: if you have more than 50 tools, you need either hierarchical routing or embedding-based tool retrieval. **Pre-filter aggressively** — give the model the smallest tool set that includes what's needed.

**No code in this section.** Conceptual.

**Connection forward:** Section 6 covers what happens when tool calls fail or return unexpected data.

### Section 6: Observation handling and error recovery

**Heading:** `## Observation handling and error recovery`
**Word target:** ~400
**Sub-headings:** `### Observations vary in size`, `### Errors are observations too`

**Teaching beats:**

**Observations vary in size**:
- A web search might return 50KB of text
- A database query might return 10K rows
- A calculation returns one number

**Truncation strategies**:
- **Length-based**: truncate to N tokens; append `...truncated`
- **Summarization**: use a smaller model to summarize before feeding back
- **Structured**: return only relevant fields (e.g., `{title, snippet}` instead of full HTML)

**Errors are observations too**:
When a tool fails, return the error message as an observation. The model often recovers gracefully:

```
Action: get_weather(location="Atlantis")
Observation: Error: location not found.
Thought: Atlantis isn't a real location. Let me ask the user to clarify.
Final answer: I couldn't find weather for "Atlantis". Could you specify a different city?
```

**Common error patterns**:
- **Bad parameters**: schema validation catches at API level
- **Missing data**: tool returns empty; model handles
- **Service unavailable**: retry with backoff at system level
- **Permission denied**: surface to model; it can pivot
- **Rate limiting**: model can decide to wait or pivot

**The recovery pattern**:
```
Error → Observation: "Error: X" → Model decides to retry, pivot, or escalate
```

**This is agent resilience** — handled at the loop layer, not the tool layer.

**Required callout** — type `note`: **Idempotency matters.** Some tools have side effects (sending email, creating tickets, charging cards). **Retries can cause duplicates.** Production patterns: include **idempotency keys** in tool calls; require **confirmation steps** before high-stakes actions; keep **audit logs** of every tool call. The agent loop should never silently retry side-effect-causing tools.

**Connection forward:** Section 7 introduces the modern interop protocol — MCP.

### Section 7: MCP and modern protocols

**Heading:** `## MCP and modern protocols`
**Word target:** ~400
**Sub-headings:** `### The interoperability problem`, `### Anthropic's Model Context Protocol`

**Teaching beats:**

**The interoperability problem (2023-2024)**:
1. Every tool integration was a custom build
2. Connecting an LLM to a database meant writing custom function-calling code per integration
3. **No standard meant duplicate effort across the ecosystem**

**Anthropic's Model Context Protocol** (MCP, late 2024):
4. **A standard interface** between LLM clients and tool/data servers
5. Servers expose **tools, resources, and prompts** via the protocol
6. **Any MCP-compatible client** (Claude, third-party agents, IDE plugins) can talk to **any MCP-compatible server**
7. Database team writes one MCP server; *any* LLM client can use it

**Protocol mechanics** (high level):
- JSON-RPC over stdio or HTTP
- Capabilities negotiation: client asks "what tools do you offer?"; server replies
- Tool invocation: client sends `tools/call` with name + arguments; server returns result
- Resource access: read-only data via URI; useful for context (files, documents)
- Prompt templates: reusable prompts the server provides

**Adoption** (early 2025):
- Claude Desktop ships MCP clients
- VS Code, Cursor, and other IDEs include MCP plugins
- Third-party MCP servers exist for Git, GitHub, Slack, Postgres, Notion, Linear, dozens more
- **An emerging standard** comparable to LSP (Language Server Protocol) for code editing

**Required callout** — type `aside`: **MCP is USB-C for AI.** USB-C standardized a connector that works across devices, manufacturers, and use cases — the ecosystem effect was the point. MCP is doing the same for LLMs: one protocol, many tools, many clients. Engineers building tool-using systems today are likely to encounter MCP in production environments. **The transferability of MCP servers is the breakthrough**; one tool server, many LLM clients.

**Connection forward:** Section 8 closes with computer use and Phase 13's trajectory.

### Section 8: The full picture

**Heading:** `## The full picture`
**Word target:** ~400
**Sub-headings:** `### Computer use — the frontier`, `### What's next in Phase 13`

**Teaching beats:**

**Computer use — the frontier** (Anthropic 2024):
1. Generalizes tool use to *any* application's UI
2. The "tools" become: **Screenshot** (see the screen), **Mouse** (click, drag), **Keyboard** (type, press), **Wait** (pause)
3. The model becomes a "**generalist computer operator**": drive any application by looking at the screen and operating mouse + keyboard
4. **The same agent loop pattern**, just with different tools

**Implications**:
- No need for custom integrations with legacy apps
- The model can use anything a human can
- Slow and error-prone today; improving rapidly
- High-stakes — needs careful guardrails

**What's next in Phase 13**:
- **Ch 22 (RAG)**: retrieval-augmented generation — retrieval as a kind of tool, plus the larger pattern of grounding LLM outputs in retrieved knowledge
- **Ch 23 (Multimodal)**: vision, audio, video — extending tool use and reasoning beyond text
- **Then Phase 14**: safety, interpretability, evaluation
- **Then Phase 15**: agents — where tool use, reasoning, retrieval, and multimodal compose into complete systems

**Sample close** (rewrite in chapter voice):

> Tool use is the capability that turns a reasoning model into an agent. The Thought-Action-Observation loop (ReAct, 2022) became production engineering in 2023-2024: structured tool calls with JSON Schema, constrained decoding for reliability, parallel calls for speed, multi-tool routing for scale, MCP for interoperability, computer use for legacy applications. Every commercial agent built today rests on this stack.
>
> **Chapter 22 opens next: retrieval-augmented generation.** Retrieval is one of the most useful tools — the model looks up information it doesn't have memorized. But RAG has its own engineering depth (chunking, embedding, vector search, reranking) and gets its own chapter. **Chapter 23** extends the capability stack to multimodal inputs and outputs. **Then Phase 14** covers safety, interpretability, and evaluation — the disciplines that turn capable systems into trustworthy ones. **Then Phase 15** assembles everything into full agent architectures.

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 21, slug: 'ch21-tool-use', title: 'Tool use', partNum: 7, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch21-tool-use/index.astro && rm src/pages/ch21-tool-use/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch21-tool-use/`** renders with:
   - Chapter eyebrow ("Chapter 21") + h1 + description
   - 8 h2 sections in the order specified
   - **2 `<RunnableCode>` blocks** (sections 2, 4)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 4)
   - Labeled equations `<Equation label="21.tool-call">`, `<Equation label="21.agent-loop">`
   - At least 5 callouts (the section-1 economic aside, MC2 in section 2, MC5 in section 3, MC3 in section 5, the idempotency note in section 6, the MCP USB-C aside in section 7 — pick 5)
3. **Sidebar:** Ch 1-20 published; Ch 21 active (draft); Ch 22-30 dimmed
4. **Prev/next nav at bottom of Ch 21:** prev = Ch 20 (active); next = Ch 22 (disabled)
5. **TOC on Ch 21** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3500 and 4200 words
7. **`npm run typecheck`** passes
8. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 121 and 122 own them.
- ❌ **Do not write exercises.** Session 122 owns.
- ❌ **Do not flip Ch 21's status to `'published'`.** Session 122 owns.
- ❌ **Do not write a third RunnableCode block.** The single-tool-call (section 2) and agent-loop (section 4) runnables are sufficient; schema validation goes into the secondary widget.
- ❌ **Do not enumerate every provider's API quirks.** OpenAI / Anthropic / Google convergence on JSON Schema is the point.
- ❌ **Do not deep-dive into MCP protocol specifics.** Concept-level only; engineers building MCP servers can read the spec.
- ❌ **Do not derive constrained-decoding math.** That's Ch 19's territory; this chapter cites the Ch 19 bridge.
- ❌ **Do not enumerate every LangChain abstraction.** Mention LangChain exists; don't tutorial.
- ❌ **Do not modify Ch 1-20.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch21-tool-use/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch21-tool-use/index.astro 2>/dev/null || true
git commit -m "session 94: Ch 21 prose — tool use (turns reasoning into agency)"
git push origin main
```

---

## Notes for the session author

**On the "reasoning into agency" framing:**
This chapter's tagline — **"reasoning into agency"** — appears in the opening, in the section 8 close, and implicitly throughout. **The reader should walk away with this phrase internalized.** Ch 20 gave the model time to think; Ch 21 gives it the ability to act. Together they enable agents (Phase 15).

**On the chapter's operational tone:**
Ch 21 is the most **operational** chapter in Phase 13. Where Ch 20 had a paradigm-shift narrative (classic CoT → modern reasoning), Ch 21 has a **single architectural narrative**: ReAct → structured calls → schemas → agent loop → routing → recovery → MCP → computer use. **The chapter feels like a production guide.**

Notes-for-author: "**Write like a senior engineer documenting a system architecture**, not like a researcher introducing a new idea."

**On the Ch 19 + Ch 20 bridges being explicit:**
Two prior chapters connect directly:
- **Ch 19 (Sampling)**: constrained decoding makes tool calls structurally reliable. Section 2 and 3 reference this.
- **Ch 20 (Reasoning)**: ReAct is the conceptual seed. Section 1 makes the bridge explicit.

**Both bridges should feel like callbacks that reward the reader.**

**On the marquee widget placement (section 4):**
The agent loop is the chapter's central operational concept. **The marquee belongs there.** Reader watches a realistic 3-step agent loop unfold: web search → calculator → final answer. **This is the production version of Ch 20's ReAct pattern made tangible.**

**On the secondary widget placement (section 3):**
Tool schemas are interactive in a different way — readers want to edit and see what passes validation. **The secondary widget belongs in section 3** where schemas are introduced. **Hands-on with JSON Schema; structural-vs-semantic validation made concrete.**

**On the 2 runnable code blocks (not 3):**
This chapter has only 2 runnables (section 2 single tool call; section 4 agent loop) rather than the usual 3. **The schema validation that would be a third runnable is instead the secondary widget** — interactive editing is more pedagogical than a static code block for that topic.

**On MCP getting prominent treatment:**
MCP is the chapter's "**modern protocol**" story. Notes-for-author: "Engineers reading this in 2025 will encounter MCP in production. The chapter should give them enough to recognize it, understand what it solves, and know when to reach for it." **Don't deep-dive into the spec** — but make the conceptual case strong.

**On computer use as the frontier closer:**
Section 8 closes with computer use because it's the natural generalization of the chapter's pattern: same agent loop, broader tool set. **It also previews the multimodal direction** (computer use requires vision) which Ch 23 will pick up.

**On honest tradeoffs throughout:**
- Structured tool calls beat natural-language parsing — but at the cost of API integration overhead
- Description-based routing is simple — but doesn't scale beyond ~50 tools
- Parallel calls speed things up — but only when independent
- Computer use is general — but slow and error-prone
- MCP unifies interfaces — but you still need to write the servers

**These tradeoffs should be visible**, not buried.

**Pedagogical claim of the chapter:**
"Tool use is the engineered production version of ReAct. Modern LLMs emit structured tool calls (JSON conforming to declared schemas); constrained decoding (Ch 19) makes calls structurally reliable; agent loops iterate think → act → observe until completion; multi-tool routing, error recovery, and protocols like MCP turn the basic loop into a robust production system. **Tool use is what turns a reasoning model into an agent — and what every production AI assistant runs on.**"

**Phase 13 trajectory after Ch 21**: Ch 20 ✅, Ch 21 (in progress). **2 chapters remain** in Phase 13 (Ch 22 RAG, Ch 23 Multimodal). After Phase 13: Phase 14 (Safety/Interp/Eval), Phase 15 (Agents).

Build with care.
