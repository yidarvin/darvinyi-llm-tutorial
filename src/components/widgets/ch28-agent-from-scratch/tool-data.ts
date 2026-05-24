/**
 * Six curated tool functions for the schema builder.
 *
 * Each tool demonstrates a different schema-design pattern:
 *  - simple: single string parameter
 *  - search: optional parameter with default
 *  - action: multiple required parameters
 *  - file-io: required path + optional output bound
 *  - eval: single string expression
 *  - complex: array parameter, format hints, nullable optional
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
