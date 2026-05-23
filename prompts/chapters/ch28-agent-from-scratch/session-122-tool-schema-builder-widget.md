# Session 122 — Tool schema builder marquee widget

> The marquee Chapter 28 widget. **An interactive function-to-schema visualization.** Reader picks one of **six curated Python tool functions** (a simple lookup, a search with optional pagination, a multi-parameter action, a file-read with output bounds, a math eval, and a complex tool with an array parameter); sees the **Python function signature with type hints and docstring**; switches between tabs showing the **OpenAI function-calling schema**, **Anthropic tool-use schema**, and a **sample LLM tool-call response** as JSON. **The widget that makes the schema work visible** — every agent framework runs on this contract between engineer and LLM. Most engineers never see it explicitly; this widget makes it concrete.

---

## Read first (in this order)

1. **`research/ch28-agent-from-scratch/research.md`** — concept 4 (tool schemas and structured calls) is the source material
2. **`prompts/chapters/ch28-agent-from-scratch/session-121-page-structure.md`** — for the section-4 widget placeholder this session fills
3. **`prompts/chapters/ch27-agent-foundations/session-119-agentic-loop-visualizer-widget.md`** — for the Ch 27+ widget conventions (scenario picker + detail panel)
4. **`prompts/chapters/ch27-agent-foundations/session-120-pattern-catalog-and-exercises-and-closeout.md`** — for the recent Phase 15 widget pattern (curated items with tabs/comparisons)

---

## Goal

Replace the `<WidgetFrame title="Tool schema builder">` placeholder in section 4 with a working interactive widget that:

- Shows a **picker over 6 curated tool functions**, each demonstrating a different schema pattern
- For the active tool, shows:
  - A **Python code panel** with the function signature, type hints, and docstring
  - A **tabbed schema panel** with three tabs: **OpenAI function-calling**, **Anthropic tool-use**, **Sample LLM call**
  - Each tab renders syntax-aware JSON in monospace
  - A **schema-design note** explaining what the tool's schema teaches
- Provides a **pedagogical caption** below explaining what the reader is seeing

**End state:** section 4 of Chapter 28 has a working marquee widget. After 60 seconds of interaction (cycling through 3-4 tools), the reader should be able to articulate: (a) **the schema is the contract** — Python types become JSON Schema; the LLM reads the schema to call the tool; (b) **OpenAI and Anthropic conventions differ slightly** (key names, message structure) but the underlying mechanism is identical; (c) **descriptions matter as much as types** — the LLM picks tools by reading descriptions; (d) **the LLM's tool call is structured JSON** that the engineer parses and executes; (e) **schema design IS contract design** — get it wrong and the LLM can't use the tool correctly.

---

## Inputs

State of the repo after session 121:

- `src/pages/ch28-agent-from-scratch/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 4 and 6)
- `src/lib/chapters.ts` has Ch 28 as `'draft'`
- No `src/components/widgets/ch28-agent-from-scratch/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch28-agent-from-scratch/ToolSchemaBuilder.tsx` — the React widget
2. **Create** `src/components/widgets/ch28-agent-from-scratch/ToolSchemaBuilder.module.css` — scoped styles
3. **Create** `src/components/widgets/ch28-agent-from-scratch/tool-data.ts` — 6 curated tools with Python source, schemas, sample calls
4. **Update** `src/components/widgets/index.ts` — add `ToolSchemaBuilder` export
5. **Update** `src/pages/ch28-agent-from-scratch/index.mdx` — replace section-4's `<WidgetFrame>` interior with `<ToolSchemaBuilder client:visible />`

---

## Detailed spec

### 1. `tool-data.ts`

```ts
// src/components/widgets/ch28-agent-from-scratch/tool-data.ts

/**
 * Six curated tool functions for the schema builder.
 *
 * Each tool demonstrates a different schema-design pattern:
 *  - simple: single string parameter
 *  - search: optional parameter with default
 *  - action: multiple required parameters
 *  - file-io: required path + optional output bound
 *  - eval: single string expression
 *  - complex: array parameter, enum constraint, nested object
 */

export type SchemaPattern =
  | 'simple'
  | 'search'
  | 'action'
  | 'file-io'
  | 'eval'
  | 'complex';

export interface ToolFunction {
  id: string;
  label: string;
  pattern: SchemaPattern;
  /** Python source as a string. Renders as the source code panel. */
  pythonSource: string;
  /** OpenAI function-calling schema as JSON-stringifiable object. */
  openaiSchema: object;
  /** Anthropic tool-use schema as JSON-stringifiable object. */
  anthropicSchema: object;
  /** Sample LLM tool-call response (OpenAI-flavored). */
  sampleCall: object;
  /** Note about what this tool teaches re: schema design. */
  designNote: string;
}

export const TOOLS: ToolFunction[] = [
  {
    id: 'get-weather',
    label: 'get_weather',
    pattern: 'simple',
    pythonSource: `def get_weather(city: str) -> dict:
    """Get current weather for a city.

    Returns temperature in Celsius and conditions.

    Args:
        city: City name (e.g. "Tokyo", "Paris", "San Francisco")
    """
    response = requests.get(
        f"https://api.weather.com/{city}",
        timeout=10,
    )
    response.raise_for_status()
    return response.json()`,
    openaiSchema: {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather for a city. Returns temperature in Celsius and conditions.',
        parameters: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'City name (e.g. "Tokyo", "Paris", "San Francisco")',
            },
          },
          required: ['city'],
        },
      },
    },
    anthropicSchema: {
      name: 'get_weather',
      description: 'Get current weather for a city. Returns temperature in Celsius and conditions.',
      input_schema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name (e.g. "Tokyo", "Paris", "San Francisco")',
          },
        },
        required: ['city'],
      },
    },
    sampleCall: {
      role: 'assistant',
      tool_calls: [
        {
          id: 'call_a1b2c3',
          type: 'function',
          function: {
            name: 'get_weather',
            arguments: '{"city":"Tokyo"}',
          },
        },
      ],
    },
    designNote: 'The simplest pattern: one required string parameter. Notice that the LLM emits `arguments` as a JSON-encoded string — your code must parse it before calling the function. The description carries the examples — that\'s where the LLM picks up the right input format.',
  },
  {
    id: 'search-web',
    label: 'search_web',
    pattern: 'search',
    pythonSource: `def search_web(query: str, max_results: int = 5) -> list[dict]:
    """Search the web and return results.

    Returns a list of {title, url, snippet} dicts.

    Args:
        query: Search query (natural language)
        max_results: Number of results to return (default 5, max 20)
    """
    response = requests.get(
        "https://api.search.example.com/v1",
        params={"q": query, "n": min(max_results, 20)},
        timeout=15,
    )
    return response.json()["results"]`,
    openaiSchema: {
      type: 'function',
      function: {
        name: 'search_web',
        description: 'Search the web and return results. Returns a list of {title, url, snippet} dicts.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (natural language)',
            },
            max_results: {
              type: 'integer',
              description: 'Number of results to return (default 5, max 20)',
              minimum: 1,
              maximum: 20,
              default: 5,
            },
          },
          required: ['query'],
        },
      },
    },
    anthropicSchema: {
      name: 'search_web',
      description: 'Search the web and return results. Returns a list of {title, url, snippet} dicts.',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (natural language)',
          },
          max_results: {
            type: 'integer',
            description: 'Number of results to return (default 5, max 20)',
            minimum: 1,
            maximum: 20,
            default: 5,
          },
        },
        required: ['query'],
      },
    },
    sampleCall: {
      role: 'assistant',
      tool_calls: [
        {
          id: 'call_d4e5f6',
          type: 'function',
          function: {
            name: 'search_web',
            arguments: '{"query":"Bhutan population 2024","max_results":3}',
          },
        },
      ],
    },
    designNote: 'Optional parameters use `default` in the schema and omit them from the `required` list. The LLM may still pass them — and often does when the description suggests doing so. Notice the `minimum`/`maximum` constraints: these prevent the LLM from passing junk values.',
  },
  {
    id: 'send-email',
    label: 'send_email',
    pattern: 'action',
    pythonSource: `def send_email(to: str, subject: str, body: str) -> dict:
    """Send an email. CONFIRMATION REQUIRED.

    This is a side-effect tool. Confirm with the user before calling.
    Returns {message_id, sent_at} on success.

    Args:
        to: Recipient email address
        subject: Email subject line (max 200 chars)
        body: Email body (plain text)
    """
    return mail_service.send(to=to, subject=subject[:200], body=body)`,
    openaiSchema: {
      type: 'function',
      function: {
        name: 'send_email',
        description: 'Send an email. CONFIRMATION REQUIRED. This is a side-effect tool. Confirm with the user before calling. Returns {message_id, sent_at} on success.',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Recipient email address',
              format: 'email',
            },
            subject: {
              type: 'string',
              description: 'Email subject line (max 200 chars)',
              maxLength: 200,
            },
            body: {
              type: 'string',
              description: 'Email body (plain text)',
            },
          },
          required: ['to', 'subject', 'body'],
        },
      },
    },
    anthropicSchema: {
      name: 'send_email',
      description: 'Send an email. CONFIRMATION REQUIRED. This is a side-effect tool. Confirm with the user before calling. Returns {message_id, sent_at} on success.',
      input_schema: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address',
            format: 'email',
          },
          subject: {
            type: 'string',
            description: 'Email subject line (max 200 chars)',
            maxLength: 200,
          },
          body: {
            type: 'string',
            description: 'Email body (plain text)',
          },
        },
        required: ['to', 'subject', 'body'],
      },
    },
    sampleCall: {
      role: 'assistant',
      tool_calls: [
        {
          id: 'call_g7h8i9',
          type: 'function',
          function: {
            name: 'send_email',
            arguments: '{"to":"alex@example.com","subject":"Meeting confirmation","body":"Hi Alex,\\n\\nConfirming our meeting tomorrow at 2pm.\\n\\nBest,\\nClaude"}',
          },
        },
      ],
    },
    designNote: 'A side-effect tool. **The description starts with "CONFIRMATION REQUIRED"** — a deliberate scaffolding choice. The LLM reads the description and (with a good system prompt) will confirm with the user before calling. Note `format: "email"` and `maxLength`: these constraints prevent malformed inputs.',
  },
  {
    id: 'read-file',
    label: 'read_file',
    pattern: 'file-io',
    pythonSource: `def read_file(path: str, max_chars: int = 10_000) -> str:
    """Read a file and return its contents.

    Output is truncated to max_chars to prevent context bloat.

    Args:
        path: Absolute or relative file path
        max_chars: Maximum characters to return (default 10000)
    """
    with open(path) as f:
        content = f.read()
    if len(content) > max_chars:
        return content[:max_chars] + f"\\n... [truncated; file is {len(content)} chars]"
    return content`,
    openaiSchema: {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read a file and return its contents. Output is truncated to max_chars to prevent context bloat.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Absolute or relative file path',
            },
            max_chars: {
              type: 'integer',
              description: 'Maximum characters to return (default 10000)',
              default: 10000,
              minimum: 100,
              maximum: 50000,
            },
          },
          required: ['path'],
        },
      },
    },
    anthropicSchema: {
      name: 'read_file',
      description: 'Read a file and return its contents. Output is truncated to max_chars to prevent context bloat.',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute or relative file path',
          },
          max_chars: {
            type: 'integer',
            description: 'Maximum characters to return (default 10000)',
            default: 10000,
            minimum: 100,
            maximum: 50000,
          },
        },
        required: ['path'],
      },
    },
    sampleCall: {
      role: 'assistant',
      tool_calls: [
        {
          id: 'call_j1k2l3',
          type: 'function',
          function: {
            name: 'read_file',
            arguments: '{"path":"/tmp/data.txt"}',
          },
        },
      ],
    },
    designNote: 'A file-I/O tool with **bounded output** (max_chars). Critical pattern: tools that read external data must cap their output, or large files blow up the context window. The schema\'s `maximum: 50000` lets the LLM ask for more if needed, but caps the absolute ceiling.',
  },
  {
    id: 'calculate',
    label: 'calculate',
    pattern: 'eval',
    pythonSource: `def calculate(expression: str) -> float:
    """Evaluate a mathematical expression. Returns the result.

    Supports: +, -, *, /, **, sqrt, pi, sin, cos, tan, log.
    Does NOT support: variables, function definitions, file I/O.

    Args:
        expression: Math expression (e.g. "2 + 2", "sqrt(144)", "5 * pi")
    """
    import math
    safe_globals = {"__builtins__": {}}
    safe_locals = {
        "sqrt": math.sqrt, "pi": math.pi,
        "sin": math.sin, "cos": math.cos,
        "tan": math.tan, "log": math.log,
    }
    return eval(expression, safe_globals, safe_locals)`,
    openaiSchema: {
      type: 'function',
      function: {
        name: 'calculate',
        description: 'Evaluate a mathematical expression. Returns the result. Supports: +, -, *, /, **, sqrt, pi, sin, cos, tan, log.',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Math expression (e.g. "2 + 2", "sqrt(144)", "5 * pi")',
            },
          },
          required: ['expression'],
        },
      },
    },
    anthropicSchema: {
      name: 'calculate',
      description: 'Evaluate a mathematical expression. Returns the result. Supports: +, -, *, /, **, sqrt, pi, sin, cos, tan, log.',
      input_schema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Math expression (e.g. "2 + 2", "sqrt(144)", "5 * pi")',
          },
        },
        required: ['expression'],
      },
    },
    sampleCall: {
      role: 'assistant',
      tool_calls: [
        {
          id: 'call_m4n5o6',
          type: 'function',
          function: {
            name: 'calculate',
            arguments: '{"expression":"5000 * (1.045 ** 7)"}',
          },
        },
      ],
    },
    designNote: 'An eval-style tool. **The description explicitly enumerates supported and unsupported features** — preventing the LLM from trying `import` statements or variable assignments. Implementation note: the function uses sandboxed `eval` with an empty `__builtins__` to block dangerous operations. Schema can\'t enforce this; the engineer must.',
  },
  {
    id: 'schedule-meeting',
    label: 'schedule_meeting',
    pattern: 'complex',
    pythonSource: `def schedule_meeting(
    title: str,
    attendees: list[str],
    start_time: str,
    duration_minutes: int = 30,
    location: str | None = None,
) -> dict:
    """Schedule a calendar meeting. CONFIRMATION REQUIRED.

    Args:
        title: Meeting title
        attendees: List of attendee email addresses
        start_time: ISO 8601 datetime (e.g. "2025-05-22T14:00:00")
        duration_minutes: Duration in minutes (default 30, max 480)
        location: Physical or virtual location (optional)
    """
    return calendar_api.create_event(
        title=title,
        attendees=attendees,
        start=start_time,
        duration_min=min(duration_minutes, 480),
        location=location,
    )`,
    openaiSchema: {
      type: 'function',
      function: {
        name: 'schedule_meeting',
        description: 'Schedule a calendar meeting. CONFIRMATION REQUIRED.',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Meeting title',
            },
            attendees: {
              type: 'array',
              items: { type: 'string', format: 'email' },
              description: 'List of attendee email addresses',
            },
            start_time: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 datetime (e.g. "2025-05-22T14:00:00")',
            },
            duration_minutes: {
              type: 'integer',
              description: 'Duration in minutes (default 30, max 480)',
              default: 30,
              minimum: 1,
              maximum: 480,
            },
            location: {
              type: ['string', 'null'],
              description: 'Physical or virtual location (optional)',
            },
          },
          required: ['title', 'attendees', 'start_time'],
        },
      },
    },
    anthropicSchema: {
      name: 'schedule_meeting',
      description: 'Schedule a calendar meeting. CONFIRMATION REQUIRED.',
      input_schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Meeting title',
          },
          attendees: {
            type: 'array',
            items: { type: 'string', format: 'email' },
            description: 'List of attendee email addresses',
          },
          start_time: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 datetime (e.g. "2025-05-22T14:00:00")',
          },
          duration_minutes: {
            type: 'integer',
            description: 'Duration in minutes (default 30, max 480)',
            default: 30,
            minimum: 1,
            maximum: 480,
          },
          location: {
            type: ['string', 'null'],
            description: 'Physical or virtual location (optional)',
          },
        },
        required: ['title', 'attendees', 'start_time'],
      },
    },
    sampleCall: {
      role: 'assistant',
      tool_calls: [
        {
          id: 'call_p7q8r9',
          type: 'function',
          function: {
            name: 'schedule_meeting',
            arguments: '{"title":"Project sync","attendees":["alice@example.com","bob@example.com"],"start_time":"2025-05-23T10:00:00","duration_minutes":45}',
          },
        },
      ],
    },
    designNote: 'The most complex schema. **Array parameter** (`attendees`) with item-level type constraint (`format: "email"`). **Date-time format hint** so the LLM knows the expected ISO format. **Nullable optional** (`type: ["string", "null"]`) for `location`. Each constraint reduces the LLM\'s degrees of freedom — and the chance of a malformed call.',
  },
];

/** Pattern color mapping for tool button left-border. */
export const PATTERN_COLORS: Record<SchemaPattern, string> = {
  simple:    'var(--cyan-400)',
  search:    'var(--amber-400)',
  action:    'var(--rose-400)',
  'file-io': 'var(--cyan-400)',
  eval:      'var(--amber-400)',
  complex:   'var(--violet-400)',
};

/** Pattern label for badge. */
export const PATTERN_LABELS: Record<SchemaPattern, string> = {
  simple:    'simple',
  search:    'optional params',
  action:    'side-effect',
  'file-io': 'bounded output',
  eval:      'sandboxed eval',
  complex:   'complex shape',
};
```

### 2. Visual layout

```
ViewBox: 0 0 800 800

┌────────────────────────────────────────────────────────────────┐
│ Tool schema builder                                              │
│ 6 tools · Python → OpenAI / Anthropic schemas · sample LLM call  │
│                                                                  │
│ Pick a tool:                                                     │
│  [ get_weather ] [ search_web ] [ send_email ]                   │
│  [ read_file ] [ calculate ] [ schedule_meeting ]                │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ get_weather                              simple              │ │
│ │                                                                │ │
│ │ Python source:                                                │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │ def get_weather(city: str) -> dict:                      │ │ │
│ │ │     """Get current weather for a city.                  │ │ │
│ │ │                                                            │ │ │
│ │ │     Returns temperature in Celsius and conditions.       │ │ │
│ │ │                                                            │ │ │
│ │ │     Args:                                                  │ │ │
│ │ │         city: City name (e.g. "Tokyo")                    │ │ │
│ │ │     """                                                    │ │ │
│ │ │     response = requests.get(...)                          │ │ │
│ │ │     ...                                                    │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ Schema:    [ OpenAI ] [ Anthropic ] [ Sample LLM call ]      │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │ {                                                           │ │ │
│ │ │   "type": "function",                                       │ │ │
│ │ │   "function": {                                             │ │ │
│ │ │     "name": "get_weather",                                  │ │ │
│ │ │     "description": "Get current weather for a city...",     │ │ │
│ │ │     "parameters": {                                         │ │ │
│ │ │       "type": "object",                                     │ │ │
│ │ │       ...                                                    │ │ │
│ │ │     }                                                        │ │ │
│ │ │   }                                                          │ │ │
│ │ │ }                                                            │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ Design note:                                                  │ │
│ │ The simplest pattern: one required string parameter...        │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Pedagogical caption                                              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click tool button → load tool data; reset tab to OpenAI
- Click schema tab → switch between OpenAI / Anthropic / Sample LLM call
- The Python source and design note update with the tool
- Code panels show monospaced text with subtle syntax styling (string color for `"..."`, comment color for `# ...`)

**Visual encoding:**
- **Tool buttons**: 6 buttons; active in cyan; left-border tinted by pattern color
- **Pattern badge** in detail panel header
- **Python panel**: scrollable code block; monospace; soft syntax styling
- **Schema tabs**: 3 tabs; active in cyan top border + filled background
- **Schema panel**: scrollable JSON; pretty-printed with 2-space indent; cyan for keys, amber for strings, emerald for numbers/booleans
- **Design note**: italic prose at the bottom of detail panel

### 3. `ToolSchemaBuilder.tsx`

```tsx
import { useState } from 'react';
import {
  TOOLS, PATTERN_COLORS, PATTERN_LABELS,
  type ToolFunction,
} from './tool-data';
import styles from './ToolSchemaBuilder.module.css';

type SchemaTab = 'openai' | 'anthropic' | 'sample';


/** Pretty-print JSON with key/string/number/bool color spans. */
function PrettyJson({ data }: { data: object }) {
  const json = JSON.stringify(data, null, 2);
  // Tokenize for simple syntax coloring
  const tokens = colorJson(json);
  return (
    <pre className={styles.jsonPre}>
      <code>
        {tokens.map((t, i) => (
          <span key={i} className={styles[`json-${t.kind}`]}>{t.text}</span>
        ))}
      </code>
    </pre>
  );
}


function colorJson(json: string): { text: string; kind: string }[] {
  // Naive but effective: tokenize into keys, strings, numbers, booleans, punctuation
  const out: { text: string; kind: string }[] = [];
  const regex = /("(?:[^"\\\\]|\\\\.)*")\s*(:)?|(\\b(?:true|false|null)\\b)|(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)|([\\{\\}\\[\\],])|(\\s+)|([^\\s\\{\\}\\[\\],"]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(json)) !== null) {
    if (m[1] !== undefined) {
      // String token: if followed by ":" it's a key
      if (m[2]) {
        out.push({ text: m[1], kind: 'key' });
        out.push({ text: m[2], kind: 'punct' });
      } else {
        out.push({ text: m[1], kind: 'string' });
      }
    } else if (m[3]) {
      out.push({ text: m[3], kind: 'literal' });
    } else if (m[4]) {
      out.push({ text: m[4], kind: 'number' });
    } else if (m[5]) {
      out.push({ text: m[5], kind: 'punct' });
    } else if (m[6]) {
      out.push({ text: m[6], kind: 'space' });
    } else if (m[7]) {
      out.push({ text: m[7], kind: 'other' });
    }
  }
  return out;
}


/** Pretty-print Python source with simple syntax coloring. */
function PrettyPython({ source }: { source: string }) {
  const lines = source.split('\\n');
  return (
    <pre className={styles.pythonPre}>
      <code>
        {lines.map((line, i) => (
          <div key={i} className={styles.pythonLine}>{renderPythonLine(line)}</div>
        ))}
      </code>
    </pre>
  );
}


function renderPythonLine(line: string): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const regex = /("""[\\s\\S]*?"""|"(?:[^"\\\\]|\\\\.)*"|#[^\\n]*|\\b(?:def|return|if|else|elif|import|from|as|with|for|in|None|True|False|raise|try|except|finally|class)\\b|\\b\\d+\\b|[a-zA-Z_][a-zA-Z0-9_]*|.)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(line)) !== null) {
    const tok = m[1];
    if (tok.startsWith('"""') || tok.startsWith('"') && tok.length > 1) {
      out.push(<span key={key++} className={styles['py-string']}>{tok}</span>);
    } else if (tok.startsWith('#')) {
      out.push(<span key={key++} className={styles['py-comment']}>{tok}</span>);
    } else if (/^(def|return|if|else|elif|import|from|as|with|for|in|None|True|False|raise|try|except|finally|class)$/.test(tok)) {
      out.push(<span key={key++} className={styles['py-keyword']}>{tok}</span>);
    } else if (/^\\d+$/.test(tok)) {
      out.push(<span key={key++} className={styles['py-number']}>{tok}</span>);
    } else {
      out.push(<span key={key++}>{tok}</span>);
    }
  }
  return out;
}


export default function ToolSchemaBuilder() {
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<SchemaTab>('openai');
  const tool = TOOLS[idx]!;

  const schemaData =
    tab === 'openai' ? tool.openaiSchema :
    tab === 'anthropic' ? tool.anthropicSchema :
    tool.sampleCall;

  const patternColor = PATTERN_COLORS[tool.pattern];
  const patternLabel = PATTERN_LABELS[tool.pattern];

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Tool schema builder</div>
        <div className={styles.titleSubLabel}>
          {TOOLS.length} tools · Python → OpenAI / Anthropic schemas · sample LLM call
        </div>
      </div>

      {/* Picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a tool:</span>
          <div className={styles.toolButtons}>
            {TOOLS.map((t, i) => (
              <button
                key={t.id}
                className={`${styles.toolButton} ${idx === i ? styles.toolButtonActive : ''}`}
                style={{ borderLeftColor: PATTERN_COLORS[t.pattern] }}
                onClick={() => { setIdx(i); setTab('openai'); }}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{tool.label}</div>
          <div
            className={styles.patternBadge}
            style={{
              background: `color-mix(in srgb, ${patternColor} 18%, transparent)`,
              color: patternColor,
              borderColor: `color-mix(in srgb, ${patternColor} 40%, transparent)`,
            }}
          >
            {patternLabel}
          </div>
        </div>

        {/* Python source */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Python source</div>
          <div className={styles.codePanel}>
            <PrettyPython source={tool.pythonSource} />
          </div>
        </div>

        {/* Schema tabs */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Schema</div>
          <div className={styles.tabBar}>
            {([
              { id: 'openai',    label: 'OpenAI' },
              { id: 'anthropic', label: 'Anthropic' },
              { id: 'sample',    label: 'Sample LLM call' },
            ] as const).map(t => (
              <button
                key={t.id}
                className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
                onClick={() => setTab(t.id)}
              >{t.label}</button>
            ))}
          </div>
          <div className={styles.codePanel}>
            <PrettyJson data={schemaData} />
          </div>
        </div>

        {/* Design note */}
        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Schema design note</div>
          <div className={styles.noteText}>{tool.designNote}</div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Cycle through the tools. <strong>Each Python function compiles to a schema</strong> the LLM
        reads to decide whether and how to call it. <strong>OpenAI and Anthropic schemas are nearly
        identical</strong> — minor key differences (`function` vs `name`), same underlying mechanism.
        <strong>The sample LLM call</strong> shows what the LLM actually emits: a structured
        `tool_calls` array with the function name and JSON-encoded arguments. <strong>Schema design IS
        contract design</strong>: descriptions, type constraints, enums, and required fields are
        what stops the LLM from passing malformed inputs. The most under-appreciated piece of agent
        engineering — now visible.
      </div>
    </div>
  );
}
```

### 4. `ToolSchemaBuilder.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .detailPanel, .caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.titlePanel { padding: 0.7rem 1rem; }
.titleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  color: var(--text-primary);
  font-weight: 500;
}
.titleSubLabel {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}

/* Controls */
.controlRow {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 110px;
  padding-top: 0.45rem;
}
.toolButtons { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; }
.toolButton {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-left-width: 3px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.toolButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.toolButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Detail panel */
.detailHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.6rem;
  margin-bottom: 0.7rem;
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  gap: 0.5rem;
}
.detailTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}
.patternBadge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  font-weight: 500;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  border: 1px solid;
  text-transform: lowercase;
}

.section { margin-bottom: 0.85rem; }
.sectionLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
  font-weight: 500;
}

/* Tab bar */
.tabBar {
  display: flex;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
  border-bottom: 1px solid var(--border-subtle);
}
.tab {
  padding: 0.4rem 0.9rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  cursor: pointer;
  margin-bottom: -1px;
  transition: all 200ms;
}
.tab:hover { color: var(--cyan-300); }
.tabActive {
  background: var(--bg-primary);
  border-color: var(--border-subtle);
  border-top: 2px solid var(--cyan-400);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Code panel */
.codePanel {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  max-height: 360px;
  overflow: auto;
  padding: 0.7rem 0.85rem;
}
.pythonPre, .jsonPre {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  line-height: 1.55;
  color: var(--text-primary);
  white-space: pre;
}
.pythonLine {
  font-family: inherit;
}

/* Python token colors */
.py-string  { color: var(--amber-400); }
.py-comment { color: var(--text-tertiary); font-style: italic; }
.py-keyword { color: var(--violet-400); font-weight: 500; }
.py-number  { color: var(--emerald-400); }

/* JSON token colors */
.json-key     { color: var(--cyan-300); }
.json-string  { color: var(--amber-400); }
.json-literal { color: var(--violet-400); }
.json-number  { color: var(--emerald-400); }
.json-punct   { color: var(--text-secondary); }
.json-space   { color: inherit; }
.json-other   { color: var(--text-primary); }

/* Note */
.notePanel {
  padding: 0.6rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.noteLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.noteText {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .controlLabel { min-width: 0; padding-top: 0; }
  .controlRow { flex-direction: column; }
  .detailHeader { flex-direction: column; align-items: flex-start; }
  .pythonPre, .jsonPre { font-size: 0.7rem; }
  .codePanel { max-height: 280px; padding: 0.5rem 0.6rem; }
  .tab { padding: 0.3rem 0.5rem; font-size: 0.72rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as ToolSchemaBuilder } from './ch28-agent-from-scratch/ToolSchemaBuilder';
// Session 158 will add:
// export { default as AgentTraceInspector } from './ch28-agent-from-scratch/AgentTraceInspector';
```

### 6. Update `src/pages/ch28-agent-from-scratch/index.mdx`

**Edit A: Add widget import:**

```mdx
import { ToolSchemaBuilder } from '@components/widgets';
```

**Edit B: Replace section-4's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Tool schema builder" caption="Six curated Python tool functions, each a different schema pattern: simple, optional params, side-effect, bounded output, sandboxed eval, complex shape. For each, see the Python source side by side with the OpenAI function-calling schema, the Anthropic tool-use schema, and a sample LLM tool-call response as JSON. Demonstrates the function → schema → invocation pipeline that every agent framework runs on. The schema is the contract between engineer and LLM — descriptions, type constraints, and required fields are what stops the LLM from passing malformed inputs.">
  <ToolSchemaBuilder client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 4 of Ch 28** renders with the working widget. Section 6's placeholder still stubbed.
3. **Default state**: tool 0 (`get_weather`) selected; tab = `openai`; Python source rendered with syntax coloring; OpenAI schema rendered with JSON syntax coloring; design note populated.
4. **Six tool buttons**: get_weather / search_web / send_email / read_file / calculate / schedule_meeting. Each has a left-border tint matching its pattern color.
5. **Pattern color coding**: simple (cyan), search (amber), action (rose), file-io (cyan), eval (amber), complex (violet).
6. **Pattern badge** in detail header: filled background tinted by pattern color.
7. **Python panel**: scrollable code block; monospace; soft syntax coloring (keywords violet, strings amber, comments tertiary, numbers emerald).
8. **Schema tabs**: 3 tabs (OpenAI / Anthropic / Sample LLM call); active tab has cyan top border + filled background.
9. **JSON panel**: scrollable pretty-printed JSON; keys cyan, strings amber, literals (true/false/null) violet, numbers emerald, punctuation in text-secondary.
10. **Tab switching**: clicking a tab switches the JSON content without reloading the tool data.
11. **Tool switching**: clicking a tool button loads the tool's data AND resets tab to `openai`.
12. **Design note**: contextual prose explaining what each tool's schema teaches.
13. **All 6 tools cycle correctly** with their three tabs each (18 view combinations).
14. **Mobile** (< 720px): controls and tabs wrap; code panels reduce in font size and max-height; remains legible.
15. **`npm run typecheck`** passes.
16. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement real schema generation** from Python source. The Python source is display-only; schemas are hardcoded per tool.
- ❌ **Do not implement editable code**. Read-only display.
- ❌ **Do not implement full syntax highlighting** comparable to Shiki/Prism. Simple token-based coloring is enough.
- ❌ **Do not allow tool definition by user input**. Six fixed tools.
- ❌ **Do not flip Ch 28's status.** Session 158 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch28-agent-from-scratch/ src/components/widgets/index.ts src/pages/ch28-agent-from-scratch/index.mdx
git commit -m "session 122: tool schema builder marquee — Python → OpenAI/Anthropic schemas + sample LLM call"
git push origin main
```

---

## Notes for the session author

**On the 6 tools spanning the schema-design space:**

| Tool | Pattern | Teaches |
|------|---------|---------|
| `get_weather` | simple | Required string parameter; descriptions matter |
| `search_web` | search | Optional parameter with default + min/max constraints |
| `send_email` | action | Multiple required parameters + side-effect annotation |
| `read_file` | file-io | Bounded output to prevent context bloat |
| `calculate` | eval | Sandboxing concerns; what schema can't enforce |
| `schedule_meeting` | complex | Array parameters, format hints, nullable optionals |

Notes-for-author: "**The 6 tools are deliberately ordered from simplest to most complex.** Each teaches one additional schema-design concept. **Reader who cycles through all 6 has seen the full range** of common patterns — required + optional + arrays + formats + nullable types + side-effects."

**On the three-tab structure being the central teaching:**
OpenAI / Anthropic / Sample LLM call. Notes-for-author: "**The OpenAI and Anthropic schemas are nearly identical** — minor naming differences (`function` vs `name`; `parameters` vs `input_schema`). The reader sees this and internalizes: **provider switching is mostly mechanical**. **The Sample LLM call tab shows the other half** of the contract — what the LLM emits when it wants to use the tool. **Together, the three tabs tell the complete schema story.**"

**On the design note being the chapter's connective tissue:**
Each tool's design note connects the schema to one of section 2's six principles, or to a section 5 / 7 best practice. Notes-for-author: "**The design notes are micro-lessons.** A reader who only reads the notes still leaves with the chapter's central points: descriptions matter, type constraints matter, side-effects need annotation, sandboxing is engineering not schema."

**On the syntax coloring being intentionally simple:**
Production-grade syntax highlighting (Shiki, Prism) is overkill here. **Token-based coloring** for Python keywords/strings/comments/numbers, and JSON keys/strings/literals/numbers, is sufficient for the widget's pedagogical purpose. Notes-for-author: "**The coloring is a readability aid, not a feature.** Use the curriculum's standard color conventions: cyan for keys (foundational), amber for strings (data), violet for keywords (sophisticated), emerald for numbers (clean values)."

**On the curriculum color conventions being honored**:
- **Cyan**: JSON keys, Python active feature
- **Amber**: strings (in both Python and JSON)
- **Violet**: Python keywords, JSON literals
- **Emerald**: numbers (in both)
- **Tertiary**: comments

Notes-for-author: "**Reader has seen these colors carry consistent meanings across the curriculum.** Code panels continue the convention."

**On the schemas including realistic constraint annotations:**
The schemas use `minimum`, `maximum`, `maxLength`, `format`, `default`, `type: ["string", "null"]` — real JSON Schema constructs. Notes-for-author: "**The schemas are production-grade examples**, not toy schemas. **A reader can copy them as templates** for their own tools. **The constraints aren't optional** — they're how you stop the LLM from passing junk."

**On the "CONFIRMATION REQUIRED" pattern in send_email and schedule_meeting:**
Two of the six tools are side-effect tools (email, meeting scheduling). **Their descriptions start with "CONFIRMATION REQUIRED"** — a deliberate scaffolding choice. Notes-for-author: "**This is a real production pattern.** The LLM reads the description and (with a good system prompt) confirms before calling. The schema can't enforce confirmation — only the description and scaffolding can."

**On the JSON panel being scrollable:**
The schedule_meeting schema is the longest (array with item constraints, nullable optional, format hints). **The code panel has max-height: 360px** with overflow scrolling. Notes-for-author: "**Even the most complex schema fits in the panel.** No truncation; reader scrolls if needed."

**Pedagogical claim this widget supports:**
"Tool schemas are the contract between engineer and LLM. **A Python function becomes a JSON Schema** that describes its name, parameters (with types, constraints, descriptions), and required vs optional. **The LLM reads the schema to decide whether and how to call the tool.** OpenAI and Anthropic schemas differ in details (key names, message structure) but the underlying mechanism is identical. The LLM emits a structured `tool_calls` array with the function name and JSON-encoded arguments; the engineer parses and executes. **Schema design IS contract design**: descriptions, type constraints, enums, required fields, and format hints are how you stop the LLM from passing malformed inputs. **The most under-appreciated piece of agent engineering** — now visible."

After 60 seconds of interaction (cycling through 4-5 tools), the reader has internalized: (a) the function → schema → invocation pipeline; (b) provider differences (OpenAI vs Anthropic) as superficial; (c) the role of constraints in preventing junk; (d) descriptions as the LLM's tool-selection signal; (e) side-effects requiring explicit annotation.

**This is Ch 28's central visualization.** Build with care.
