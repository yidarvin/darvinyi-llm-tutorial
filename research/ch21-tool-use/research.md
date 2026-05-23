# Chapter 21 — Tool use: research

> Curated source material for Chapter 21's build sessions. **The chapter that turns reasoning into agency.** Where Ch 20 gave the model time to think, Ch 21 gives it the ability to *act* — call APIs, execute code, query databases, browse the web, control applications. **The ReAct pattern** from Ch 20 §4 is the conceptual foundation; this chapter covers the **production engineering**: function calling APIs (OpenAI, Anthropic, Google), tool schemas (JSON Schema), constrained decoding for structured tool calls (Ch 19 bridge), the multi-step agent loop, multi-tool routing, observation handling and error recovery, and modern protocols (Anthropic's Model Context Protocol). **Single-topic chapter**; uses the **4-file cadence**. **The chapter that lets the model do things in the world.**

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Tool use

**Premise:** A reasoning model that can't act on the world is limited. **Tool use** removes this limit. Modern LLMs are trained to emit structured calls to external functions; the surrounding system executes the calls; the results are fed back into the model's context. **Tool use is the bridge from chat to agency.** Every commercial production agent — Claude with tool use, GPT with function calling, autonomous coding agents, customer support automation, computer-use agents — runs on this pattern.

**What "tool" means here:**
A tool is any externally-callable function the model can invoke during generation: a calculator, a web search, a database query, a code interpreter, a calendar API, a file system, even a controlled browser. **The model decides when to call; the system handles execution and returns observations.**

**Out of scope (other chapters):**
- The reasoning that *decides* to call a tool (Ch 20)
- The constrained decoding that enforces tool-call format (Ch 19)
- Retrieval as a kind of tool (Ch 22 — RAG has its own chapter; this chapter assumes tool use exists)
- Multimodal tool use (Ch 23 covers vision/audio; this chapter focuses on text-based tools)
- Full agent architectures (Phase 15)

**In scope and locked:**
- **The Thought-Action-Observation loop** — ReAct's pattern, productionized
- **Function calling APIs**: OpenAI, Anthropic, Google
- **Tool schemas**: JSON Schema, name + description + parameters
- **Constrained decoding for tool calls** — Ch 19 in production
- **The agent loop**: iterate until completion
- **Multi-tool routing**: selecting the right tool from many
- **Observation handling**: formatting, truncation, error recovery
- **Modern protocols**: Anthropic's Model Context Protocol (MCP)
- **Computer use**: tools that control entire applications/desktops

**Suggested chapter structure** (8 sections):

1. From ReAct to tools (~400 words)
2. Function calling APIs (~600 words)
3. Tool schemas (~500 words)
4. The agent loop (~600 words)
5. Multi-tool routing (~400 words)
6. Observation handling and error recovery (~400 words)
7. MCP and modern protocols (~400 words)
8. The full picture and Phase 13 trajectory (~400 words)

Target: ~3700 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Yao et al. 2022 — "ReAct: Synergizing Reasoning and Acting in Language Models"
- **arXiv:** [2210.03629](https://arxiv.org/abs/2210.03629)
- **What it contributed:** the **Thought-Action-Observation loop**. Reasoning and acting interleave; observations ground the reasoning. **Already covered in Ch 20 §4**; this chapter assumes it and builds the production engineering.
- **For the chapter:** foundational reference; section 1 establishes the bridge from Ch 20.

### Schick et al. 2023 — "Toolformer: Language Models Can Teach Themselves to Use Tools"
- **arXiv:** [2302.04761](https://arxiv.org/abs/2302.04761)
- **What it contributed:** an early demonstration that LLMs could be **trained** to invoke tools, not just prompted. Self-supervised: the model learned which tool calls improved its predictions. **Influential conceptually**; modern systems use SFT + RLHF over tool use.

### Mialon et al. 2023 — "Augmented Language Models: a Survey"
- **arXiv:** [2302.07842](https://arxiv.org/abs/2302.07842)
- **What it contributed:** comprehensive survey of tool-augmented LMs as of 2023. Covers retrieval, code interpreters, calculators, knowledge graphs. **Useful for context.**

### OpenAI 2023 — "Function Calling and other API updates"
- **URL:** [openai.com/blog/function-calling-and-other-api-updates](https://openai.com/blog/function-calling-and-other-api-updates)
- **What it contributed:** **OpenAI's first-party function calling API** (June 2023). Established the JSON-schema-based pattern that became industry standard. **The interface convention that everything else followed.**
- **For the chapter:** central reference for section 2.

### Anthropic 2024 — "Tool use (function calling)"
- **URL:** [docs.anthropic.com/en/docs/build-with-claude/tool-use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- **What it contributed:** Anthropic's tool use API — similar pattern to OpenAI but with explicit tool-result message types and parallel tool calls. **The production reference for Claude-based systems.**
- **For the chapter:** section 2 reference.

### Anthropic 2024 — "Model Context Protocol"
- **URL:** [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **What it contributed:** **MCP** — an open protocol for connecting LLMs to external data sources and tools. Standardizes tool-server interfaces so any MCP-compatible client can use any MCP-compatible server. **Adopted broadly** by 2025 across Claude, third-party agents, and IDE integrations.
- **For the chapter:** central reference for section 7.

### Anthropic 2024 — "Introducing computer use"
- **URL:** [anthropic.com/news/3-5-models-and-computer-use](https://www.anthropic.com/news/3-5-models-and-computer-use)
- **What it contributed:** **computer use** — tools that control an entire desktop (screenshot, mouse, keyboard). Generalizes "tool use" from discrete functions to any application's UI. **The frontier of tool use in 2024-2025.**

### Patil et al. 2023 — "Gorilla: Large Language Model Connected with Massive APIs"
- **arXiv:** [2305.15334](https://arxiv.org/abs/2305.15334)
- **What it contributed:** training and benchmarking LMs on **API selection** from large API catalogs. The challenge of multi-tool routing.

### Qin et al. 2023 — "ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs"
- **arXiv:** [2307.16789](https://arxiv.org/abs/2307.16789)
- **What it contributed:** large-scale dataset and benchmarks for tool use across thousands of real APIs. **A useful empirical reference.**

### LangChain — open-source library
- **URL:** [langchain.com](https://www.langchain.com)
- **What it contributed:** the most-used open-source library for building tool-using LLM applications. Establishes common abstractions (agents, chains, tools). **Worth mentioning for production context.**

---

## Core concepts

### Concept 1: From ReAct to tool use

**The bridge from Ch 20:**
Chapter 20 §4 introduced the ReAct pattern: Thought → Action → Observation → Thought → ... **This chapter converts that pattern into engineered production systems.**

What changes:
- **In ReAct (prompting-era)**: actions are emitted as natural-language strings; the surrounding system parses them with regex or heuristics
- **In modern tool use (production-era)**: actions are emitted as **structured JSON** matching a declared schema; the system parses with a JSON parser; **constrained decoding** (Ch 19) guarantees valid output

What stays:
- The conceptual loop (think → act → observe → repeat)
- The grounding effect (observations are real, not fabricated)
- The model's *autonomy* in choosing when and which tool to call

**The framing claim:**
"Reasoning gave the model time to think (Ch 20); tool use gives it the ability to act. Together they enable agents." (Section 8 expands this.)

**Empirical scale:**
- **Toolformer** (2023): a few dozen tools, ~70% success rate
- **GPT-4 with function calling** (2023): user-supplied tools, ~85-95% success rate on benchmarks
- **Claude with tool use** (2024): parallel tool calls, computer use, MCP integration
- **Modern frontier**: hundreds of tools, agentic loops spanning hundreds of steps, ~70-85% success on complex multi-step tasks (TaskBench)

### Concept 2: Function calling APIs

**The interface convention** (established by OpenAI June 2023):

The model is given:
1. **A list of available tools**, each with: name, description, parameter schema (JSON Schema)
2. **The user's request**
3. **The conversation history** including prior tool calls and results

The model emits **either**:
- A **regular text response** (no tool needed), or
- A **structured tool call** with a tool name and JSON-encoded arguments

The system:
1. Parses the tool call
2. Executes the function
3. Returns the result to the model as a **tool message** in the conversation
4. The model continues with the result in context

**Example (OpenAI-style, conceptual):**

```json
// Tools given to the model
[
  {
    "name": "get_weather",
    "description": "Get current weather for a location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": { "type": "string" },
        "unit": { "type": "string", "enum": ["celsius", "fahrenheit"] }
      },
      "required": ["location"]
    }
  }
]
```

```json
// Model's tool call (the model emits this structured output)
{
  "tool_call": {
    "name": "get_weather",
    "arguments": { "location": "San Francisco, CA", "unit": "fahrenheit" }
  }
}
```

```json
// Tool result fed back to the model
{
  "role": "tool",
  "tool_call_id": "call_abc",
  "content": "72°F, sunny"
}
```

**Provider variations:**
- **OpenAI**: `tools` array; `tool_choice` parameter; `tool_calls` in response
- **Anthropic**: `tools` array; tool-use response blocks; parallel tool calls supported natively
- **Google (Gemini)**: similar pattern; called "function declarations"

**Why structured > natural language:**
- **Reliability**: a JSON parser always succeeds or fails cleanly; regex parsing of natural language is brittle
- **Programmatic dispatch**: function call → function execution is one step, not many
- **Type safety**: parameter schemas catch errors at the boundary
- **Composability**: tool calls chain cleanly through agent loops

### Concept 3: Tool schemas

**A tool schema declares**:
1. **Name** — a stable identifier (`get_weather`, `search_database`)
2. **Description** — natural-language guidance for the model
3. **Parameters** — JSON Schema describing required and optional arguments

**Example (annotated):**

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
      description: "Maximum results to return (1-10, default 5)."
      default: 5
      minimum: 1
      maximum: 10
  required: ["query"]
```

**Best practices** (production tooling):
- **Clear descriptions**: the model picks tools based on the description; vague descriptions = bad tool selection
- **Required vs optional**: only mark truly-required parameters as required
- **Use enums**: constrain string parameters to known values where possible
- **Examples in description**: "Examples: 'pricing changes', 'API authentication'"
- **Avoid overlapping tools**: two tools with similar descriptions confuse the model

**The constrained-decoding bridge (Ch 19):**
- The model is constrained to emit valid JSON matching the schema
- **FSM masking** (Ch 19 §8) enforces this — invalid tokens get masked at each step
- This makes tool calls *structurally guaranteed*; no need to retry on parse errors

```mdx
<Equation label="21.tool-call">
$$\text{model}(\text{context}, \text{schemas}) \;\to\; \text{either text response or } \{\text{name}, \text{args (JSON conforming to schema)}\}$$
</Equation>
```

### Concept 4: The agent loop

**Single tool call** (the simplest pattern):
1. User asks a question requiring one piece of external information
2. Model emits a tool call
3. System executes; returns result
4. Model produces final answer

**Multi-step agent loop** (the general pattern):

```
while not done:
    response = model.generate(context, tools)
    if response.is_text():
        return response.text   # final answer
    else:
        tool_call = response.tool_call
        result = execute(tool_call)
        context.append(tool_call)
        context.append(result)
```

**Termination**:
- **Natural**: the model emits a text response (no more tool calls needed)
- **Limit**: `max_iterations` cap to prevent infinite loops
- **Error**: an unrecoverable error in tool execution

**Parallel tool calls** (Anthropic and OpenAI both support):
- The model can emit *multiple* tool calls in one response
- All execute in parallel
- All results return in the next message
- **Speeds up multi-step workflows significantly** when tool calls are independent

```mdx
<Equation label="21.agent-loop">
$$\text{loop until terminal: } \text{model} \to \text{action(s)} \to \text{execute} \to \text{observation(s)} \to \text{model} \to \ldots$$
</Equation>
```

### Concept 5: Multi-tool routing

**The challenge**: when the model has 5, 50, or 500 tools, **selecting the right one is non-trivial**.

**Production patterns**:

**1. Description-based routing** (default)
The model reads all tool descriptions and picks. Works well at 5-50 tools. **Above ~50 tools, the descriptions consume too much context.**

**2. Hierarchical routing**
First, classify the request into a tool *category*. Then, pick a specific tool within that category. **Common in large-scale tool catalogs.**

**3. Tool retrieval (RAG for tools)**
At each step, retrieve the most-relevant N tools from a large catalog (using embeddings of tool descriptions). Present only the retrieved tools to the model. **Used in production for catalogs >100 tools.**

**4. Tool RBAC and permissions**
Hide tools the user/agent doesn't have access to. **Critical for production safety.**

**Common confusion patterns**:
- **Overlapping tools**: "search_documents" and "find_files" — the model may pick the wrong one
- **Ambiguous descriptions**: "fetch data" — the model has no signal about which data
- **Missing tools**: the model attempts to use a non-existent tool — handle gracefully

### Concept 6: Observation handling and error recovery

**Observations vary in size and quality.** A web search might return 50KB of text; a database query might return 10K rows; a calculation returns a number.

**Truncation strategies**:
- **Length-based**: truncate to N tokens, append `...truncated`
- **Summarization**: use a smaller model to summarize before feeding back
- **Structured**: return only the relevant fields (e.g., `{title, snippet}` from a search result instead of full HTML)

**Error handling**:

**Errors are observations too.** When a tool fails, return the error message as the observation. The model often recovers gracefully:

```
Action: get_weather(location="Atlantis")
Observation: Error: location not found.
Thought: Atlantis isn't a real location. Let me ask the user to clarify.
Final answer: I couldn't find weather for "Atlantis". Could you specify a different city?
```

**Common error patterns**:
- **Bad parameters**: JSON schema validation catches at API level
- **Missing data**: tool returns empty; model handles
- **Service unavailable**: retry with backoff at the system level
- **Permission denied**: tell the model; it can ask for elevated access or pivot
- **Rate limiting**: surface as an error; let the model decide to wait or pivot

**The recovery pattern**:
```
Error → Observation: "Error: X" → Model decides to retry, pivot, or escalate
```

This is **agent resilience** — handled at the loop layer, not the tool layer.

### Concept 7: MCP and modern protocols

**The interoperability problem (2023-2024)**: every tool integration was a custom build. Connecting an LLM to a database meant writing custom function-calling code per integration. **The lack of a standard meant duplicate effort across the ecosystem.**

**Anthropic's Model Context Protocol** (MCP, late 2024):
- **A standard interface** between LLM clients and tool/data servers
- Servers expose **tools, resources, and prompts** via the protocol
- Any MCP-compatible client (Claude, third-party agents, IDE plugins) can talk to any MCP-compatible server
- **Implications**: a database team writes one MCP server; *any* LLM client can use it

**Protocol mechanics** (high level):
- JSON-RPC over stdio or HTTP
- **Capabilities negotiation**: client asks "what tools do you offer?"; server replies
- **Tool invocation**: client sends `tools/call` with name + arguments; server returns result
- **Resource access**: read-only data via URI; useful for context (files, documents)
- **Prompt templates**: reusable prompts the server provides

**Adoption** (early 2025):
- Claude Desktop ships MCP clients
- VS Code, Cursor, and other IDEs include MCP plugins
- Third-party MCP servers exist for Git, GitHub, Slack, Postgres, Notion, Linear, Asana, dozens more
- **An emerging standard** comparable to LSP (Language Server Protocol) for code editing

**Why this matters for the chapter**:
- **MCP is the production interop layer.** Engineers building tool-using systems today are likely to use it.
- **It's a clean conceptual abstraction**: model-side has tool calls; server-side has tool implementations; the protocol bridges them.
- **It illustrates a broader pattern**: standardization unlocks ecosystem effects.

### Concept 8: Computer use and the frontier

**Computer use** (Anthropic, late 2024) generalizes tool use to *any* application's UI:

The "tools" become:
- **Screenshot**: see the screen
- **Mouse**: click at (x, y); drag from (x1, y1) to (x2, y2)
- **Keyboard**: type text; press keys
- **Wait**: pause for animations

The model becomes a "**generalist computer operator**": it can drive any application by looking at the screen and operating mouse + keyboard. **The same agent loop pattern**, just with different tools.

**Implications**:
- **No need to write custom integrations** for legacy apps
- **The model can use anything a human can**
- **Slow and error-prone today** but improving rapidly
- **Frontier capability** in 2025: Claude 4.x, GPT-5 computer use, others

**Limitations**:
- **Visual UI understanding** is hard; model can miss subtle UI elements
- **High-stakes actions** (deleting files, sending emails) need confirmation
- **Latency**: each step requires a screenshot + model call + action
- **Safety**: a misaligned model with computer use can do real damage

---

## Glossary

- **Tool**: an externally-callable function the model can invoke
- **Function call** / **tool call**: structured request from the model to invoke a tool
- **Tool schema**: name + description + parameter spec (JSON Schema)
- **Agent loop**: iterative tool use until completion
- **Parallel tool calls**: emitting multiple tool calls in one response
- **Observation**: the result returned to the model after tool execution
- **Multi-tool routing**: selecting the right tool from many
- **MCP**: Model Context Protocol — Anthropic's open protocol for tool/data servers
- **Computer use**: tools that control entire applications via screenshot + mouse + keyboard
- **Tool retrieval**: using embedding search to surface relevant tools from large catalogs
- **Termination**: the condition under which the agent loop stops
- **JSON Schema**: the schema standard used by virtually all tool-call APIs
- **ReAct**: Reasoning + Action — the pattern from Ch 20 §4; this chapter's foundation

---

## Pedagogical analogies

### 1. Tool calls as remote procedure calls
**RPC** is a familiar pattern: a client calls a function that runs on a remote server; results come back over the network. **Tool calls are RPC for LLMs.** The model is the client; tools are remote procedures; observations are return values. **The mental model port is direct.**

Best used for: section 2.

### 2. Tool schemas as type signatures
A tool schema is a typed contract: the model commits to passing specific argument types; the tool commits to handling them and returning a result. **JSON Schema is the type system.** Without schemas, calls would be untyped strings — fragile.

Best used for: section 3.

### 3. The agent loop as a REPL
A REPL (Read-Eval-Print Loop) iterates: read user input → evaluate → print result → repeat. **The agent loop is the model's REPL.** It reads context → evaluates (decides next action) → produces output (a tool call or final answer) → loops with the result.

Best used for: section 4.

### 4. Multi-tool routing as an autocomplete
When you type in an IDE, autocomplete narrows from "all symbols in the language" to "symbols matching your prefix" via context. **Multi-tool routing is autocomplete for tools.** Narrow from "all available tools" to "tools relevant to this query" via descriptions (or embedding retrieval).

Best used for: section 5.

### 5. MCP as USB-C for AI
USB-C standardized a connector that works across devices, manufacturers, and use cases. **MCP is USB-C for LLMs**: one protocol, many tools, many clients. **The ecosystem effect is the point.**

Best used for: section 7.

---

## Common misconceptions

### MC1: "Tool use is just prompting the model to emit a function call."
**Reality:** misleading. **Modern tool use is engineered**: structured schemas, constrained decoding (Ch 19) to guarantee valid JSON, programmatic dispatch, error handling, loop management. **The "prompting" framing was the 2022 picture (ReAct); modern tool use is production-grade infrastructure.**

### MC2: "Function calling APIs are model-specific and not portable."
**Reality:** mostly true historically, **converging now.** OpenAI, Anthropic, and Google all converged on JSON-Schema-based tool calling with slight API differences. **MCP** (Anthropic 2024) standardizes the tool-server side. **Cross-provider tool definitions are now practical**, even if the surrounding API differs.

### MC3: "More tools is always better."
**Reality:** false beyond ~50 tools. **Description bloat** consumes context; the model gets confused by similar tools. **Above 50-100 tools, you need tool retrieval** (embedding search) or hierarchical routing. **Pre-filter aggressively.**

### MC4: "Parallel tool calls speed everything up."
**Reality:** only when calls are *independent*. **If tool B depends on tool A's result, they must be serial.** The model is usually good at distinguishing — emits parallel calls when independent, serial calls when dependent. **Don't force parallelism.**

### MC5: "Constrained decoding makes tool calls reliable."
**Reality:** mostly true but with nuance. **Structural validity** is guaranteed (the JSON parses; the schema matches). **Semantic correctness** isn't — the model can still pass nonsensical arguments. **Tool implementations need to validate** inputs even after the schema check.

### MC6: "MCP eliminates all integration work."
**Reality:** false. **MCP standardizes the protocol** between LLM clients and tool servers — that's a big deal. But you still need to **write the MCP server** for each new tool; you still need to choose **which** servers to expose. **MCP makes integration *transferable*, not free.**

### MC7: "Computer use will replace all custom tool integrations."
**Reality:** false (so far). **Computer use is powerful but slow, error-prone, and high-latency** vs purpose-built tools. **For most production systems, structured tool calls dominate.** Computer use shines for legacy apps without APIs or for ad-hoc tasks.

### MC8: "Once tool use works on a benchmark, it works in production."
**Reality:** false. **Production tool use has many failure modes** that benchmarks don't capture: rate limits, transient errors, slow tools, partial results, ambiguous inputs, ML model drift. **Robust production tool use requires substantial engineering** around the model's calls — retries, timeouts, fallbacks, monitoring.

---

## Tricky implementation details

### TID1: JSON encoding inside tool calls
The model emits tool calls as JSON. **String escaping matters**: a tool that takes a regex argument needs the regex string properly escaped. **Constrained decoding helps** (escapes are enforced); but argument-content-level validity still depends on the model getting it right.

### TID2: Tool description length tradeoffs
Each tool's description goes into context for every model call. **Verbose descriptions consume tokens** (and money) and dilute attention. **Terse descriptions reduce tool selection accuracy.** Production sweet spot: 50-200 characters per tool description; include 1-2 example inputs if helpful.

### TID3: Argument validation timing
The schema is enforced by the API at parse time. But **semantic validation** (e.g., "this value is in the database") happens inside the tool. **Errors at this stage need clear messages** — the model uses them to recover.

### TID4: Tool call latency
Each tool call adds:
- Tool execution time (variable: ms to seconds)
- Network round-trip
- Model re-invocation with the result
**Tool-heavy agents can be slow.** Batching, caching, and parallel calls help.

### TID5: Context length and observations
A 10-step agent loop with verbose observations can fill 100K+ tokens of context. **Strategies**:
- **Truncate** old observations after they're consumed
- **Summarize** completed sub-tasks
- **Use a smaller model** to compress observations before adding to context
- **Use tool retrieval** to prune unused tools

### TID6: Idempotency and side effects
Some tools have **side effects** (sending email, creating tickets). **Retries can cause duplicates.** Production patterns:
- **Idempotency keys**: include a unique ID; tool de-duplicates
- **Confirmation steps**: agent asks user before high-stakes actions
- **Audit logs**: record every tool call for review

### TID7: Tool versioning
Tool schemas evolve. **A schema change can break agents trained or deployed against an old version.** Production: version tool schemas; deprecate carefully; support old versions during migration.

### TID8: Multi-turn confusion
The model can "forget" what tool calls it already made if the conversation is long. **Compaction strategies** (summarize old turns) help but can lose detail. **Tradeoff between context budget and recall.**

### TID9: Hallucinated tools
Sometimes the model emits a tool call for a tool that doesn't exist. **Handle gracefully**: return a structured error listing valid tools; the model usually picks one of those instead.

### TID10: MCP server resource overhead
Each MCP server is a separate process. **Resource cost adds up** if you connect to 20+ servers. **Production patterns**: lazy-load servers; pool connections; aggressive timeouts.

---

## Reference implementations

### Single tool call (Anthropic-style, schematic)

```python
import anthropic

client = anthropic.Anthropic()

# Define a tool
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

def get_weather(location, unit="fahrenheit"):
    """Mock weather function."""
    return f"72°{'F' if unit == 'fahrenheit' else 'C (about 22°C)'}, sunny"

# Initial call
response = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "What's the weather in SF?"}],
)

# Check if the model wants to call a tool
if response.stop_reason == "tool_use":
    tool_use = next(block for block in response.content if block.type == "tool_use")
    tool_name = tool_use.name
    tool_input = tool_use.input
    tool_use_id = tool_use.id
    
    # Execute the tool
    if tool_name == "get_weather":
        result = get_weather(**tool_input)
    
    # Send the result back
    final = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        tools=tools,
        messages=[
            {"role": "user", "content": "What's the weather in SF?"},
            {"role": "assistant", "content": response.content},
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": result,
                    }
                ],
            },
        ],
    )
    print(final.content[0].text)
```

### Multi-step agent loop

```python
def agent_loop(client, model, tools, tool_functions, user_message, max_iterations=10):
    """
    Run the agent loop until the model stops calling tools or we hit max_iterations.
    """
    messages = [{"role": "user", "content": user_message}]
    
    for iteration in range(max_iterations):
        response = client.messages.create(
            model=model,
            max_tokens=1024,
            tools=tools,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})
        
        if response.stop_reason != "tool_use":
            # Natural termination: model produced a final text response
            return response, messages
        
        # Execute each tool call (parallel-friendly)
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                try:
                    fn = tool_functions[block.name]
                    result = fn(**block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result),
                    })
                except Exception as e:
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": f"Error: {e}",
                        "is_error": True,
                    })
        
        messages.append({"role": "user", "content": tool_results})
    
    return None, messages  # hit max_iterations
```

### Tool schema validation

```python
import jsonschema

def validate_tool_call(tool_call, tool_schemas):
    """
    Validate a model's tool call against the tool's schema.
    Returns (is_valid, error_message).
    """
    name = tool_call["name"]
    args = tool_call.get("input", {})
    
    matching = [t for t in tool_schemas if t["name"] == name]
    if not matching:
        return False, f"Tool '{name}' not found in schema list."
    
    schema = matching[0]["input_schema"]
    try:
        jsonschema.validate(args, schema)
        return True, None
    except jsonschema.ValidationError as e:
        return False, str(e)

# Demo
tool_schemas = [
    {
        "name": "search",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}, "max_results": {"type": "integer", "minimum": 1, "maximum": 10}},
            "required": ["query"],
        },
    }
]

valid_call = {"name": "search", "input": {"query": "tools", "max_results": 5}}
invalid_call = {"name": "search", "input": {"max_results": 5}}     # missing required 'query'
unknown_tool = {"name": "lookup", "input": {"query": "tools"}}

# print(validate_tool_call(valid_call, tool_schemas))      # (True, None)
# print(validate_tool_call(invalid_call, tool_schemas))    # (False, "...required property 'query'...")
# print(validate_tool_call(unknown_tool, tool_schemas))    # (False, "Tool 'lookup' not found...")
```

---

## Connections to other chapters

- **Ch 19 (Sampling)**: constrained decoding enforces valid JSON tool calls. **Direct dependency.** Without FSM masking, tool calls would frequently malform.
- **Ch 20 (Reasoning)**: ReAct is the conceptual foundation. CoT-style reasoning happens *between* tool calls in production agent loops.
- **Ch 22 (RAG)**: retrieval is a kind of tool. **Next chapter.**
- **Ch 23 (Multimodal)**: computer use bridges to multimodal — screenshots are images that the model must understand.
- **Ch 24 (Safety)**: tool use is the highest-risk capability — incorrect tool calls can have real-world consequences (sending emails, deleting files, charging cards).
- **Ch 25 (Interpretability)**: tool call traces are valuable interpretability artifacts — they show what the model was *trying* to do.
- **Ch 26 (Evaluation)**: tool-use benchmarks (TaskBench, ToolBench) have their own methodology — different from chat eval.
- **Ch 27-30 (Agents)**: tool use is the foundation. Phase 15 builds full agent architectures on top.

---

## Open questions for the chapter author

### Q1: How much code for tool calls?
**Recommendation:** medium. Section 2's runnable shows a single Anthropic-style tool call. Section 4's runnable shows the agent loop. **Don't enumerate every provider's API differences** — focus on the conceptual pattern.

### Q2: MCP depth?
**Recommendation:** moderate. Section 7 explains the protocol concept (JSON-RPC, capabilities, tool invocation) but **doesn't deep-dive into specifics.** Mention the protocol exists, what it solves, why it matters; link to the spec for engineers building MCP servers.

### Q3: Computer use depth?
**Recommendation:** brief. Section 8 closes with computer use as the frontier example. **Don't deep-dive into screenshot processing** — that's a vision problem (Ch 23 will touch this). Focus on the *pattern generalization* (tool use scales to any UI).

### Q4: LangChain / framework coverage?
**Recommendation:** minimal. Mention LangChain exists as the most-used OSS library; don't tutorial. **Engineers will find their own framework.** The chapter's job is the *concepts*, not the framework du jour.

### Q5: Production-system depth?
**Recommendation:** substantial in sections 5-6. Multi-tool routing strategies, observation handling, error recovery — these matter for engineers building real systems and are often missing from tutorials. **The chapter should give them confidence to design production tool systems.**

### Q6: Widget candidates
1. **Tool Call Trace (marquee):** animated agent loop walkthrough — step through a Thought → Action → Observation → Thought sequence for a realistic query. Reader watches the model invoke 2-3 tools to answer a multi-part question. **Recommended marquee.**
2. **Tool Schema Validator (secondary):** interactive JSON Schema → tool call validation. Reader edits a tool schema; tries different tool calls; sees which pass and which fail (with structured error messages). **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 21 is a **single-topic chapter**. Uses the **4-file cadence**.

Planned file layout:
- File 119: research (this)
- File 120: page structure (~620 lines, 8 sections; runnables embedded)
- File 121: Tool Call Trace marquee widget
- File 122: Tool Schema Validator secondary widget + exercises + closeout (slot 123 absorbed)

**Pedagogical outcomes for the reader.** After Ch 21, the reader should be able to:
1. Articulate the bridge from ReAct to production tool use
2. Design a tool schema with name, description, and JSON Schema parameters
3. Implement a basic agent loop with tool calls
4. Apply multi-tool routing strategies (description, retrieval, hierarchical)
5. Handle observations and errors gracefully
6. Explain what MCP solves and why it matters
7. Describe computer use as the frontier of tool use
8. Avoid common pitfalls (overlapping tools, semantic-vs-structural validation, idempotency)

Eight outcomes. Exercises hit outcomes 2, 3, 5, 8.

**Tonal framing**: operational and confident — the chapter that turns reasoning into agency. **Concrete numbers**: tool catalog sizes (50 = manageable, 500 = need retrieval); typical agent loop step counts (5-50 in production); production tool call success rates (~85-95% on benchmarks). **Honest tradeoffs**: structured tool calls vs computer use; description-based routing vs embedding-based retrieval; serial vs parallel execution.

**Phase 13 trajectory**: Ch 21 follows Ch 20 (reasoning) in Phase 13. **Tool use is reasoning made effectual** — the model can finally do things, not just describe them. After Ch 21: Ch 22 (RAG) covers retrieval as a kind of tool; Ch 23 (Multimodal) extends to other input modalities. **The capability stack is being assembled.**

**Importance**: tool use is the single most economically consequential LLM capability of 2023-2025. Every production agent runs on it. **Engineers and product folks both need to understand the pattern, the API conventions, the failure modes, and the modern protocols (MCP). The chapter is their roadmap.**
