# Session 96 — Ch 21 tool schema validator + exercises + closeout

> **The Chapter 21 closeout.** Three deliverables: (1) implement the **Tool Schema Validator** secondary widget — three preset tool schemas; multiple example tool calls per schema (valid + invalid); reader clicks to see validation results with structured error messages; (2) add an **Exercises section** with 4 problems (schema definition, agent loop implementation, embedding-based tool routing, idempotent dispatch); (3) flip Ch 21's status from `'draft'` to `'published'`. **Closes Ch 21 — the chapter that turns reasoning into agency.** Two-thirds of Phase 13 complete.

This is a **single-topic chapter** (4-file cadence). The secondary widget gets combined with exercises in this final session — the standard closeout pattern.

---

## Read first (in this order)

1. **`research/ch21-tool-use/research.md`** — concepts 3 (schemas) and 6 (error recovery) are the source material
2. **`prompts/chapters/ch21-tool-use/session-94-page-structure.md`** — for the section-3 widget placeholder and exercise placement
3. **`prompts/chapters/ch21-tool-use/session-95-tool-call-trace-widget.md`** — for the Ch 21 widget conventions
4. **`prompts/chapters/ch20-reasoning/session-92-exercises-and-closeout.md`** — for the recent Phase 13 closeout pattern

---

## Goal

By end of session, three things change in the repo:

1. **`ToolSchemaValidator` widget** is implemented and wired into section 3 of Ch 21. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("MCP and modern protocols") and section 8 ("The full picture"). Four exercises with hints + runnable starter code.
3. **Ch 21's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 21 is the twenty-first published chapter — and the second of Phase 13.**

After this session: **Ch 21 is complete.** Phase 13 trajectory: Ch 22 (RAG), Ch 23 (Multimodal) remain.

---

## Inputs

State of the repo after session 95:

- Section 4's `ToolCallTrace` marquee widget is wired
- Section 3's widget is still stubbed
- All 2 runnable code blocks from session 94 are in place
- `src/lib/chapters.ts` has Ch 1-20 `'published'`, Ch 21 `'draft'`
- `src/components/widgets/ch21/` exists with `ToolCallTrace` already

---

## Deliverables

1. **Create** `src/components/widgets/ch21/ToolSchemaValidator.tsx` — the React widget
2. **Create** `src/components/widgets/ch21/ToolSchemaValidator.module.css` — scoped styles
3. **Create** `src/components/widgets/ch21/schema-cases-data.ts` — three schemas with multiple example calls each
4. **Update** `src/components/widgets/index.ts` — add `ToolSchemaValidator` export
5. **Update** `src/pages/ch21-tool-use/index.mdx`:
   - Replace section-3's `<WidgetFrame>` interior with `<ToolSchemaValidator client:visible />`
   - Insert new `## Exercises` section between section 7 ("MCP and modern protocols") and section 8 ("The full picture")
6. **Update** `src/lib/chapters.ts` — change Ch 21's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 21's marquee widget is sealed.

---

## Detailed spec

### Part A — `ToolSchemaValidator` widget

#### A.1 `schema-cases-data.ts`

```ts
// src/components/widgets/ch21/schema-cases-data.ts

export interface ToolSchema {
  id: string;
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, PropertySchema>;
    required?: string[];
  };
}

export interface PropertySchema {
  type: 'string' | 'integer' | 'number' | 'boolean';
  description: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  default?: unknown;
}

export interface ToolCallCase {
  /** Short label shown in the picker (e.g., "valid", "missing required field"). */
  label: string;
  /** Longer description shown when selected. */
  description: string;
  /** The actual tool call the model would emit. */
  call: { name: string; input: Record<string, unknown> };
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  kind: 'unknown_tool' | 'missing_required' | 'wrong_type' | 'out_of_range' | 'invalid_enum';
  field?: string;
  message: string;
}

// Three preset schemas covering common patterns
export const SCHEMAS: ToolSchema[] = [
  {
    id: 'get_weather',
    name: 'get_weather',
    description: 'Get current weather for a location.',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name, e.g., "San Francisco" or "Tokyo".',
        },
        unit: {
          type: 'string',
          description: 'Temperature unit.',
          enum: ['celsius', 'fahrenheit'],
          default: 'fahrenheit',
        },
      },
      required: ['location'],
    },
  },
  {
    id: 'search_database',
    name: 'search_database',
    description: 'Search the company knowledge base for documents matching a query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query.',
        },
        max_results: {
          type: 'integer',
          description: 'Number of results to return.',
          minimum: 1,
          maximum: 10,
          default: 5,
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'create_event',
    name: 'create_event',
    description: 'Create a calendar event.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Event title.',
        },
        duration_minutes: {
          type: 'integer',
          description: 'Event length in minutes.',
          minimum: 5,
          maximum: 480,
        },
        is_recurring: {
          type: 'boolean',
          description: 'Whether the event repeats.',
        },
      },
      required: ['title', 'duration_minutes'],
    },
  },
];

// Tool calls per schema — mix of valid and invalid
export const CASES: Record<string, ToolCallCase[]> = {
  get_weather: [
    {
      label: '✓ valid',
      description: 'All required fields present; types correct; enum value valid.',
      call: { name: 'get_weather', input: { location: 'Tokyo', unit: 'celsius' } },
    },
    {
      label: '✓ valid (optional omitted)',
      description: "Only the required field 'location' is provided; 'unit' uses its default.",
      call: { name: 'get_weather', input: { location: 'San Francisco' } },
    },
    {
      label: "✗ missing required 'location'",
      description: 'The required field "location" is not present.',
      call: { name: 'get_weather', input: { unit: 'celsius' } },
    },
    {
      label: '✗ invalid enum value',
      description: '"unit" must be one of [celsius, fahrenheit]; "kelvin" is not allowed.',
      call: { name: 'get_weather', input: { location: 'Tokyo', unit: 'kelvin' } },
    },
    {
      label: '✗ wrong type for location',
      description: '"location" must be a string; 42 is an integer.',
      call: { name: 'get_weather', input: { location: 42 } },
    },
    {
      label: '✗ unknown tool',
      description: 'The model emitted a tool name that is not in the catalog.',
      call: { name: 'fetch_temperature', input: { location: 'Tokyo' } },
    },
  ],
  search_database: [
    {
      label: '✓ valid',
      description: 'Required "query" present; max_results within range.',
      call: { name: 'search_database', input: { query: 'pricing changes', max_results: 5 } },
    },
    {
      label: '✓ valid (defaults used)',
      description: 'Required field only; max_results uses its default of 5.',
      call: { name: 'search_database', input: { query: 'API documentation' } },
    },
    {
      label: '✗ max_results out of range (high)',
      description: 'max_results must be ≤ 10.',
      call: { name: 'search_database', input: { query: 'docs', max_results: 50 } },
    },
    {
      label: '✗ max_results out of range (low)',
      description: 'max_results must be ≥ 1.',
      call: { name: 'search_database', input: { query: 'docs', max_results: 0 } },
    },
    {
      label: "✗ missing 'query'",
      description: 'The required field "query" is missing.',
      call: { name: 'search_database', input: { max_results: 5 } },
    },
  ],
  create_event: [
    {
      label: '✓ valid',
      description: 'All required fields present; duration within range; types correct.',
      call: {
        name: 'create_event',
        input: { title: 'Team sync', duration_minutes: 30, is_recurring: false },
      },
    },
    {
      label: '✓ valid (optional omitted)',
      description: 'Only the two required fields; "is_recurring" is optional.',
      call: { name: 'create_event', input: { title: 'Standup', duration_minutes: 15 } },
    },
    {
      label: '✗ duration too short',
      description: 'duration_minutes must be ≥ 5.',
      call: { name: 'create_event', input: { title: 'Sync', duration_minutes: 2 } },
    },
    {
      label: '✗ duration too long',
      description: 'duration_minutes must be ≤ 480 (8 hours).',
      call: {
        name: 'create_event',
        input: { title: 'Workshop', duration_minutes: 600 },
      },
    },
    {
      label: '✗ duration as string',
      description: 'duration_minutes must be an integer; "30" is a string.',
      call: {
        name: 'create_event',
        input: { title: 'Sync', duration_minutes: '30' as unknown as number },
      },
    },
    {
      label: '✗ multiple errors',
      description: 'Missing "duration_minutes" AND is_recurring is wrong type (string instead of boolean).',
      call: { name: 'create_event', input: { title: 'Sync', is_recurring: 'yes' } },
    },
  ],
};

/** Validate a tool call against a schema. */
export function validate(
  call: { name: string; input: Record<string, unknown> },
  schemas: ToolSchema[],
): ValidationResult {
  const schema = schemas.find(s => s.name === call.name);
  if (!schema) {
    return {
      ok: false,
      errors: [
        {
          kind: 'unknown_tool',
          message: `Unknown tool: "${call.name}". Available tools: ${schemas.map(s => s.name).join(', ')}.`,
        },
      ],
    };
  }

  const errors: ValidationError[] = [];

  // Check required fields
  for (const req of schema.inputSchema.required ?? []) {
    if (!(req in call.input)) {
      errors.push({
        kind: 'missing_required',
        field: req,
        message: `Missing required field "${req}".`,
      });
    }
  }

  // Check each provided field
  for (const [field, value] of Object.entries(call.input)) {
    const propSchema = schema.inputSchema.properties[field];
    if (!propSchema) {
      // Unknown field — strict schemas reject these; many production setups warn instead.
      // Treat as an error to be informative.
      errors.push({
        kind: 'wrong_type',
        field,
        message: `Field "${field}" is not declared in the schema.`,
      });
      continue;
    }

    // Type checks
    const expectedType = propSchema.type;
    let typeOk = true;
    if (expectedType === 'string') typeOk = typeof value === 'string';
    else if (expectedType === 'integer') typeOk = typeof value === 'number' && Number.isInteger(value);
    else if (expectedType === 'number') typeOk = typeof value === 'number';
    else if (expectedType === 'boolean') typeOk = typeof value === 'boolean';

    if (!typeOk) {
      errors.push({
        kind: 'wrong_type',
        field,
        message: `Field "${field}" must be ${expectedType}; got ${typeof value}.`,
      });
      continue;
    }

    // Enum check
    if (propSchema.enum && !propSchema.enum.includes(String(value))) {
      errors.push({
        kind: 'invalid_enum',
        field,
        message: `Field "${field}" must be one of [${propSchema.enum.join(', ')}]; got "${value}".`,
      });
    }

    // Range check (integer / number)
    if ((expectedType === 'integer' || expectedType === 'number') && typeof value === 'number') {
      if (propSchema.minimum !== undefined && value < propSchema.minimum) {
        errors.push({
          kind: 'out_of_range',
          field,
          message: `Field "${field}" must be ≥ ${propSchema.minimum}; got ${value}.`,
        });
      }
      if (propSchema.maximum !== undefined && value > propSchema.maximum) {
        errors.push({
          kind: 'out_of_range',
          field,
          message: `Field "${field}" must be ≤ ${propSchema.maximum}; got ${value}.`,
        });
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Tool schema validator                                            │
│                                                                  │
│ Pick a schema:                                                   │
│   [ get_weather ]  [ search_database ]  [ create_event ]         │
│                                                                  │
│ Schema definition:                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {                                                             │ │
│ │   "name": "get_weather",                                     │ │
│ │   "description": "Get current weather for a location.",      │ │
│ │   "input_schema": {                                          │ │
│ │     "type": "object",                                        │ │
│ │     "properties": {                                          │ │
│ │       "location": { "type": "string", ... },                 │ │
│ │       "unit":     { "type": "string", "enum": [...] }        │ │
│ │     },                                                        │ │
│ │     "required": ["location"]                                  │ │
│ │   }                                                            │ │
│ │ }                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Try a tool call:                                                 │
│   [ ✓ valid ]                                                    │
│   [ ✓ valid (optional omitted) ]                                 │
│   [ ✗ missing required 'location' ]                              │
│   [ ✗ invalid enum value ]                                       │
│   [ ✗ wrong type for location ]                                  │
│   [ ✗ unknown tool ]                                             │
│                                                                  │
│ Tool call:                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {                                                             │ │
│ │   "name": "get_weather",                                     │ │
│ │   "input": { "location": "Tokyo", "unit": "celsius" }        │ │
│ │ }                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Validation result:                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✓ Valid                                                       │ │
│ │ This call would pass the API's structural validation.        │ │
│ │ Constrained decoding (Ch 19) guarantees this structure        │ │
│ │ at generation time.                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

When an **invalid** case is selected:

```
│ Validation result:                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✗ Invalid                                                     │ │
│ │                                                                │ │
│ │ Errors:                                                       │ │
│ │   • Missing required field "location".                        │ │
│ │   • Field "unit" must be one of [celsius, fahrenheit]; got    │ │
│ │     "kelvin".                                                 │ │
│ │                                                                │ │
│ │ The model's API call would fail at the schema-validation      │ │
│ │ layer. The system returns the error as an observation;        │ │
│ │ the model uses it to retry or pivot (Section 6).              │ │
│ └─────────────────────────────────────────────────────────────┘ │
```

**Interaction:**
- Click schema button → switches schema; shows the schema's properties and required fields; default-selects the first ("✓ valid") case
- Click tool call case button → updates the tool call shown and the validation result
- Schema display: pretty-printed JSON, read-only
- Tool call display: pretty-printed JSON of the case's call
- Validation result: cyan-tinted "Valid" panel on success; rose-tinted "Invalid" panel on failure, listing all errors

**Visual encoding:**
- Schema buttons + case buttons: cyan-active style consistent with other Phase 13 widgets
- Code blocks: monospace, slight background tint, syntax-highlighted colors via CSS
- Pass/fail panels: cyan for valid, rose for invalid — consistent with constrained-decoding widget's "valid vs masked" convention

#### A.3 `ToolSchemaValidator.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  SCHEMAS, CASES, validate,
  type ToolSchema, type ToolCallCase,
} from './schema-cases-data';
import styles from './ToolSchemaValidator.module.css';

export default function ToolSchemaValidator() {
  const [schemaIdx, setSchemaIdx] = useState(0);
  const [caseIdx, setCaseIdx] = useState(0);

  const schema = SCHEMAS[schemaIdx]!;
  const cases = CASES[schema.id] ?? [];
  const currentCase = cases[caseIdx] ?? cases[0]!;

  const result = useMemo(() => validate(currentCase.call, SCHEMAS), [currentCase]);

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Tool schema validator</div>
        <div className={styles.titleSubLabel}>
          See what passes structural validation — and what doesn't
        </div>
      </div>

      {/* Schema picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a schema:</span>
          <div className={styles.schemaButtons}>
            {SCHEMAS.map((s, i) => (
              <button
                key={s.id}
                className={`${styles.schemaButton} ${schemaIdx === i ? styles.schemaButtonActive : ''}`}
                onClick={() => {
                  setSchemaIdx(i);
                  setCaseIdx(0);
                }}
              >{s.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Schema display */}
      <div className={styles.codePanel}>
        <div className={styles.codeTitle}>Schema definition</div>
        <pre className={styles.codeBlock}>
{formatSchema(schema)}
        </pre>
      </div>

      {/* Case picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Try a tool call:</span>
        </div>
        <div className={styles.caseButtons}>
          {cases.map((c, i) => {
            const isValid = c.label.startsWith('✓');
            return (
              <button
                key={i}
                className={`${styles.caseButton} ${caseIdx === i ? styles.caseButtonActive : ''} ${isValid ? styles.caseButtonValid : styles.caseButtonInvalid}`}
                onClick={() => setCaseIdx(i)}
              >{c.label}</button>
            );
          })}
        </div>
        <div className={styles.caseDescription}>
          {currentCase.description}
        </div>
      </div>

      {/* Tool call */}
      <div className={styles.codePanel}>
        <div className={styles.codeTitle}>Tool call (what the model would emit)</div>
        <pre className={styles.codeBlock}>
{formatToolCall(currentCase.call)}
        </pre>
      </div>

      {/* Validation result */}
      <div className={`${styles.resultPanel} ${result.ok ? styles.resultValid : styles.resultInvalid}`}>
        <div className={styles.resultHeader}>
          {result.ok ? '✓ Valid' : '✗ Invalid'}
        </div>
        {result.ok ? (
          <div className={styles.resultBody}>
            This call would pass the API's structural validation.
            Constrained decoding (Ch 19) guarantees this structure at generation time.
          </div>
        ) : (
          <>
            <div className={styles.errorList}>
              <div className={styles.errorListLabel}>Errors:</div>
              <ul>
                {result.errors.map((e, i) => (
                  <li key={i} className={styles.errorItem}>{e.message}</li>
                ))}
              </ul>
            </div>
            <div className={styles.resultBody}>
              The model's API call would fail at the schema-validation layer.
              The system returns the error as an observation; the model uses
              it to retry or pivot (Section 6).
            </div>
          </>
        )}
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Click through the cases. <strong>Valid calls</strong> (cyan ✓) have all required fields, correct
        types, and values within range. <strong>Invalid calls</strong> (rose ✗) fail at the API layer
        with structured errors — the model gets these as observations and recovers. <strong>Constrained
        decoding</strong> (Ch 19) prevents most invalid calls at generation; <strong>semantic correctness</strong>
        (e.g., "Atlantis" isn't a real city) still requires tool-level validation (Section 6's idempotency
        and error-recovery patterns).
      </div>
    </div>
  );
}

function formatSchema(s: ToolSchema): string {
  return JSON.stringify(
    {
      name: s.name,
      description: s.description,
      input_schema: s.inputSchema,
    },
    null,
    2,
  );
}

function formatToolCall(call: { name: string; input: Record<string, unknown> }): string {
  return JSON.stringify(call, null, 2);
}
```

#### A.4 `ToolSchemaValidator.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .codePanel, .resultPanel, .caption {
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
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 140px;
}
.schemaButtons, .caseButtons {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}
.schemaButton, .caseButton {
  padding: 0.35rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.schemaButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.schemaButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}
.caseButton { font-size: 0.75rem; }
.caseButtonValid:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.caseButtonInvalid:hover { border-color: var(--rose-400); color: var(--rose-400); }
.caseButtonActive {
  font-weight: 500;
}
.caseButtonActive.caseButtonValid {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.caseButtonActive.caseButtonInvalid {
  background: color-mix(in srgb, var(--rose-400) 8%, var(--bg-primary));
  border-color: var(--rose-400);
  color: var(--rose-400);
}
.caseDescription {
  margin-top: 0.55rem;
  padding: 0.45rem 0.7rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  font-style: italic;
}

/* Code panel */
.codeTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.codeBlock {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  padding: 0.6rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  white-space: pre;
  overflow-x: auto;
  margin: 0;
  color: var(--text-primary);
  line-height: 1.5;
}

/* Result */
.resultPanel { border-width: 1.5px; }
.resultValid {
  background: color-mix(in srgb, var(--cyan-500) 5%, var(--bg-elevated));
  border-color: var(--cyan-500);
}
.resultInvalid {
  background: color-mix(in srgb, var(--rose-400) 5%, var(--bg-elevated));
  border-color: var(--rose-400);
}
.resultHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.resultValid .resultHeader { color: var(--cyan-300); }
.resultInvalid .resultHeader { color: var(--rose-400); }
.resultBody {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.errorList { margin-bottom: 0.6rem; }
.errorListLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
  font-weight: 500;
}
.errorList ul {
  margin: 0;
  padding-left: 1.2rem;
}
.errorItem {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--rose-400);
  line-height: 1.5;
  margin-bottom: 0.25rem;
}

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .controlRow { flex-direction: column; align-items: flex-start; }
  .controlLabel { min-width: 0; }
  .codeBlock { font-size: 0.72rem; padding: 0.45rem 0.55rem; }
  .schemaButton, .caseButton { padding: 0.3rem 0.55rem; font-size: 0.7rem; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as ToolCallTrace } from './ch21/ToolCallTrace';
export { default as ToolSchemaValidator } from './ch21/ToolSchemaValidator';
```

#### A.6 Update `src/pages/ch21-tool-use/index.mdx`

**Edit A: Update widget import:**

```mdx
import { ToolCallTrace, ToolSchemaValidator } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Tool schema validator" caption="Three preset tool schemas (get_weather, search_database, create_event); multiple example tool calls per schema covering valid and invalid cases. Watch what structural validation catches: missing required fields, wrong types, out-of-range values, invalid enum choices, unknown tool names. The widget makes 'what constrained decoding guarantees' tangible — and what tool-level validation still has to handle.">
  <ToolSchemaValidator client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("MCP and modern protocols") and section 8 ("The full picture"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the production tool-use stack. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

The exercises trace the chapter's arc: define a schema (Ex 1) → run the agent loop (Ex 2) → route across many tools (Ex 3) → handle side effects safely (Ex 4).

### Exercise 1 (easy) — Define a tool schema

Convert a Python function signature into a JSON-Schema-style tool schema. Cover name, description, required vs optional parameters, and at least one enum.

<details>
<summary>Hint</summary>

A tool schema needs:
- `name`: a stable identifier (snake_case typical)
- `description`: tells the model when to use this tool
- `input_schema.properties`: the parameter definitions
- `input_schema.required`: list of required parameter names

For each parameter, include:
- `type`: "string" / "integer" / "number" / "boolean"
- `description`: tells the model what value to pass
- `enum`: if the value must be one of a closed set
- `minimum` / `maximum`: for numeric ranges
- `default`: for optional parameters

</details>

<RunnableCode
  client:visible
  defaultCode={`# Convert this Python function into a tool schema.
# (In production: this is the boundary you write once per tool.)

def schedule_meeting(title: str, duration_minutes: int = 30, urgency: str = "normal"):
    """
    Schedule a meeting on the user's calendar.
    
    Parameters:
        title (str): The meeting's title or topic.
        duration_minutes (int): Length in minutes. Range 5-480.
        urgency (str): One of 'low', 'normal', 'high'.
    """
    pass

# TODO: Define the tool schema as a dict.
schedule_meeting_schema = {
    "name": "schedule_meeting",
    "description": "TODO: write a description that helps the model decide when to use this tool.",
    "input_schema": {
        "type": "object",
        "properties": {
            # TODO: add properties for title, duration_minutes, urgency
            # Include type, description, and any constraints (enum, minimum, maximum, default).
        },
        "required": [
            # TODO: list the required field names
        ],
    },
}

# Verify
import json
# print(json.dumps(schedule_meeting_schema, indent=2))
# 
# Expected structure (yours should match):
# {
#   "name": "schedule_meeting",
#   "description": "...",
#   "input_schema": {
#     "type": "object",
#     "properties": {
#       "title": {"type": "string", "description": "..."},
#       "duration_minutes": {"type": "integer", "description": "...", "minimum": 5, "maximum": 480, "default": 30},
#       "urgency": {"type": "string", "description": "...", "enum": ["low", "normal", "high"], "default": "normal"},
#     },
#     "required": ["title"],
#   },
# }
`}
  packages={[]}
/>

### Exercise 2 (medium) — Implement the agent loop

Build the agent loop pattern: a function that takes a mock model, a tool registry, and a user message; iterates think → act → observe → repeat until the model returns a final answer or hits `max_iterations`.

<details>
<summary>Hint</summary>

The loop:
1. Send `messages` to the model (mocked here)
2. Check `stop_reason`:
   - If `"end_turn"`: return the text — done
   - If `"tool_use"`: extract the tool call; execute it; append the result; loop
3. Track iterations; break at `max_iterations` to prevent infinite loops

For the mock model: simulate a multi-step response by counting prior tool uses in `messages`.

Production loops also handle: parallel tool calls, partial errors (some tools succeed, others fail), and observation truncation.

</details>

<RunnableCode
  client:visible
  defaultCode={`def mock_model(messages, tools):
    """
    Mock LLM. In production this is a real API call.
    Behavior: emit web_search on first turn, calculator on second, final on third.
    """
    n_tool_uses = sum(
        1 for m in messages
        if m["role"] == "assistant" and any(
            isinstance(c, dict) and c.get("type") == "tool_use" for c in m.get("content", [])
        )
    )
    
    if n_tool_uses == 0:
        return {
            "stop_reason": "tool_use",
            "content": [{"type": "tool_use", "id": "1", "name": "web_search", "input": {"query": "current weather Tokyo"}}],
        }
    if n_tool_uses == 1:
        return {
            "stop_reason": "tool_use",
            "content": [{"type": "tool_use", "id": "2", "name": "calculator", "input": {"expression": "(65-32)*5/9"}}],
        }
    return {
        "stop_reason": "end_turn",
        "content": [{"type": "text", "text": "Tokyo is 65°F (about 18.3°C)."}],
    }

# Tool registry — name → function
def web_search(query): return f"65°F, cloudy. Tokyo current weather."
def calculator(expression): return f"{eval(expression):.2f}"

TOOLS = {
    "web_search": web_search,
    "calculator": calculator,
}

def agent_loop(model, tools, user_message, max_iterations=10):
    """
    Run the agent loop until the model produces a text response or we hit max_iterations.
    """
    messages = [{"role": "user", "content": user_message}]
    
    for iteration in range(max_iterations):
        response = model(messages, list(tools.keys()))
        
        # TODO:
        # 1. Append the assistant's response (response["content"]) to messages.
        # 2. If response["stop_reason"] == "end_turn", extract the text and return it.
        # 3. Otherwise (tool_use): for each tool_use block in response["content"]:
        #    a. Look up the function in `tools`
        #    b. Call it with **block["input"]
        #    c. Append a tool_result message
        # 4. Continue to next iteration.
        pass
    
    return None   # hit max_iterations

# Test
# answer = agent_loop(mock_model, TOOLS, "What's the weather in Tokyo in Celsius?")
# print(f"Final answer: {answer}")
# # Expected: "Tokyo is 65°F (about 18.3°C)."
`}
  packages={[]}
/>

### Exercise 3 (medium) — Multi-tool routing via embeddings

Implement embedding-based tool retrieval for a large tool catalog. Given a user query and a catalog of 20 tools (with mock embeddings), return the top-5 most relevant tools to present to the model.

<details>
<summary>Hint</summary>

The pattern:
1. Pre-embed each tool's `description` (offline; cached)
2. At query time, embed the user's request
3. Compute cosine similarity between query and each tool's embedding
4. Return the top-K most similar tools

For the exercise: use mock embeddings (random 8-dim vectors, but seeded to be reproducible). In production: use a small embedding model like `text-embedding-3-small` or `all-MiniLM-L6-v2`.

Cosine similarity: $\\cos(q, t) = \\frac{q \\cdot t}{\\|q\\| \\|t\\|}$

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

# Mock embeddings (in production: use a real embedding model)
np.random.seed(42)
TOOLS = [
    {"name": "web_search", "description": "Search the web for current information.", "embedding": np.random.randn(8)},
    {"name": "calculator", "description": "Evaluate mathematical expressions.", "embedding": np.random.randn(8)},
    {"name": "send_email", "description": "Compose and send an email.", "embedding": np.random.randn(8)},
    {"name": "create_event", "description": "Create a calendar event.", "embedding": np.random.randn(8)},
    {"name": "search_database", "description": "Query the company knowledge base.", "embedding": np.random.randn(8)},
    {"name": "get_weather", "description": "Get current weather for a city.", "embedding": np.random.randn(8)},
    {"name": "translate", "description": "Translate text between languages.", "embedding": np.random.randn(8)},
    {"name": "summarize", "description": "Summarize long text into bullets.", "embedding": np.random.randn(8)},
    {"name": "execute_code", "description": "Run code in a sandboxed environment.", "embedding": np.random.randn(8)},
    {"name": "fetch_url", "description": "Fetch the contents of a URL.", "embedding": np.random.randn(8)},
    {"name": "list_files", "description": "List files in a directory.", "embedding": np.random.randn(8)},
    {"name": "read_file", "description": "Read the contents of a file.", "embedding": np.random.randn(8)},
    {"name": "write_file", "description": "Write contents to a file.", "embedding": np.random.randn(8)},
    {"name": "git_status", "description": "Show git working-tree status.", "embedding": np.random.randn(8)},
    {"name": "run_tests", "description": "Run the project's test suite.", "embedding": np.random.randn(8)},
    {"name": "deploy", "description": "Deploy the application to production.", "embedding": np.random.randn(8)},
    {"name": "slack_message", "description": "Send a Slack message to a channel.", "embedding": np.random.randn(8)},
    {"name": "create_ticket", "description": "Create a support ticket.", "embedding": np.random.randn(8)},
    {"name": "search_logs", "description": "Search application logs.", "embedding": np.random.randn(8)},
    {"name": "set_timer", "description": "Set a timer / reminder.", "embedding": np.random.randn(8)},
]

def embed_query(query):
    """Mock query embedding. Production: real embedding model."""
    # Mock: same dim, seeded by hash of query string
    seed = sum(ord(c) for c in query)
    rng = np.random.RandomState(seed)
    return rng.randn(8)

def cosine_similarity(a, b):
    """Cosine similarity between two vectors."""
    # TODO: implement
    pass

def retrieve_tools(query, tools, top_k=5):
    """Return the top-K most-relevant tools by cosine similarity."""
    # TODO:
    # 1. Embed the query
    # 2. Compute cosine similarity to each tool's embedding
    # 3. Sort descending; return top_k
    pass

# Test on a few different queries
# queries = [
#     "what's the weather in Paris",
#     "send a message to the team",
#     "find the bug in the test suite",
#     "schedule a meeting next week",
# ]
# 
# for q in queries:
#     top = retrieve_tools(q, TOOLS, top_k=5)
#     print(f"\\nQuery: '{q}'")
#     for tool, score in top:
#         print(f"  {tool['name']:>18}  (score: {score:>5.2f})  — {tool['description'][:50]}")
# 
# # Observations:
# # - With *random* embeddings, retrieval is noisy — the demo shows the *pattern*, not the quality
# # - With *real* embeddings, semantically-similar tools rank higher (weather query → weather tool)
# # - Production catalogs use trained embedding models; refresh embeddings when descriptions change
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Idempotent tool dispatch

Implement a tool dispatcher that handles side-effect-causing tools safely. Use idempotency keys to prevent duplicate executions on retry, and an audit log to track every call.

<details>
<summary>Hint</summary>

Idempotent dispatch pattern:
1. Each tool call includes an **idempotency key** (typically a UUID)
2. Maintain a **cache** keyed by `(tool_name, idempotency_key)`
3. Before executing: check the cache; if a prior call with the same key exists, return the cached result without re-executing
4. After executing: store the result in the cache
5. **Audit log**: append every call (whether executed or cached) for review

This pattern is essential for tools with side effects (sending emails, creating tickets, charging cards). Without it, an agent loop that retries a failed step could send duplicate emails.

</details>

<RunnableCode
  client:visible
  defaultCode={`import uuid
from datetime import datetime

class IdempotentDispatcher:
    """
    Tool dispatcher with idempotency-key-based deduplication and audit logging.
    """
    
    def __init__(self):
        self.tools = {}                       # name → function
        self.cache = {}                       # (tool_name, idem_key) → result
        self.audit = []                       # list of audit entries
    
    def register(self, name, fn):
        self.tools[name] = fn
    
    def dispatch(self, tool_name, args, idem_key=None):
        """
        Execute a tool call. If an idempotency key is provided and we've seen
        it before, return the cached result without re-executing.
        """
        if idem_key is None:
            idem_key = str(uuid.uuid4())
        
        # TODO:
        # 1. Construct cache_key = (tool_name, idem_key)
        # 2. If cache_key in self.cache: log a "cached" entry to self.audit; return self.cache[cache_key]
        # 3. Otherwise:
        #    - Look up the function in self.tools
        #    - If not found: log + return error
        #    - Execute with **args
        #    - Store result in self.cache[cache_key]
        #    - Append "executed" entry to self.audit
        #    - Return result
        pass
    
    def get_audit_log(self):
        return self.audit

# Demo: send_email tool with side effects
sent_emails = []

def send_email(to, subject, body):
    """Side-effect: append to sent_emails."""
    email = {"to": to, "subject": subject, "body": body, "ts": datetime.now()}
    sent_emails.append(email)
    return {"status": "sent", "id": len(sent_emails)}

dispatcher = IdempotentDispatcher()
dispatcher.register("send_email", send_email)

# Send an email (first call: executes; appends to sent_emails)
# r1 = dispatcher.dispatch("send_email", {"to": "alice@x.com", "subject": "Hi", "body": "Hello!"}, idem_key="email-001")
# print(f"First call:  {r1}")
# print(f"Sent emails: {len(sent_emails)}")
# 
# # Retry the same call with the same idempotency key (should NOT send again)
# r2 = dispatcher.dispatch("send_email", {"to": "alice@x.com", "subject": "Hi", "body": "Hello!"}, idem_key="email-001")
# print(f"Retry:       {r2}")
# print(f"Sent emails: {len(sent_emails)}    (should still be 1)")
# 
# # New call with different idempotency key (DOES send)
# r3 = dispatcher.dispatch("send_email", {"to": "bob@x.com", "subject": "Hi Bob", "body": "Hello!"}, idem_key="email-002")
# print(f"New call:    {r3}")
# print(f"Sent emails: {len(sent_emails)}    (should be 2)")
# 
# # Audit log
# print(f"\\nAudit log ({len(dispatcher.get_audit_log())} entries):")
# for entry in dispatcher.get_audit_log():
#     print(f"  {entry}")
# 
# # Observation:
# # - Same idempotency key → cached; no duplicate side effect
# # - New idempotency key → executed
# # - Audit log records every dispatch (executed or cached) for review
# # - This is the production pattern for side-effect-causing tools.
`}
  packages={[]}
/>

````

### Part C — Flip Ch 21's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 21, slug: 'ch21-tool-use', title: 'Tool use', partNum: 7, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 21 still render correctly (no changes to existing sections).
3. **Section 4's** `ToolCallTrace` marquee widget still renders correctly.
4. **Section 3** now renders the working `ToolSchemaValidator` widget.
5. **Default state**: schema = `get_weather`, case = first (`✓ valid`). Schema JSON and tool call JSON both visible.
6. **Three schema buttons**: `get_weather`, `search_database`, `create_event`. Click switches schema; case picker updates; resets case index to 0.
7. **Case buttons** match the schema: 6 cases for `get_weather`, 5 for `search_database`, 6 for `create_event`. Valid cases use cyan style; invalid use rose style.
8. **Case description** updates with each case selection.
9. **Schema display**: pretty-printed JSON of the schema definition.
10. **Tool call display**: pretty-printed JSON of `{name, input}`.
11. **Validation result panel**: cyan-tinted "✓ Valid" for valid; rose-tinted "✗ Invalid" for invalid.
12. **Invalid result**: lists each error message; explains that the system returns errors as observations for recovery (Section 6 reference).
13. **All invalid cases produce errors that match their labels**:
    - "missing required" → "Missing required field..."
    - "invalid enum value" → "must be one of [...]"
    - "wrong type for location" → "must be string; got number"
    - "out of range" → "must be ≤ X" or "must be ≥ X"
    - "unknown tool" → "Unknown tool: ..."
14. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
15. **Sidebar**: Ch 1-21 all active (published); Ch 22-30 still dimmed.
16. **Prev/next at bottom of Ch 21**: prev = Ch 20 (active); next = Ch 22 (disabled).
17. **TOC**: includes Exercises as h2 between section 7 and section 8.
18. **Mobile**: layout stacks; code blocks scroll horizontally if needed.
19. **`npm run typecheck`** passes.
20. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not allow editing the schema or tool call in the widget.** Read-only display; pick-from-presets only.
- ❌ **Do not call a real LLM** in exercises. Mock models only.
- ❌ **Do not flip any other chapter's status.** Only Ch 21 flips.
- ❌ **Do not modify Ch 1-20.** Sealed.
- ❌ **Do not modify Ch 21's marquee widget or prose sections 1-8.** Sealed. (Only insert the new Exercises section between sections 7 and 8.)
- ❌ **Do not implement a real MCP server.** The chapter mentions MCP; exercises don't require building one.

---

## Wire-up

```bash
git add src/components/widgets/ch21/ToolSchemaValidator.tsx src/components/widgets/ch21/ToolSchemaValidator.module.css src/components/widgets/ch21/schema-cases-data.ts src/components/widgets/index.ts src/pages/ch21-tool-use/index.mdx src/lib/chapters.ts
git commit -m "session 96: Ch 21 closeout — schema validator + exercises + status: published"
git push origin main
```

---

## Ch 21 closeout

Chapter 21 is now the twenty-first complete chapter on production. **Phase 13 has two of its four chapters published** (Ch 20 Reasoning, Ch 21 Tool use). The capabilities arc continues.

Confirm before declaring Ch 21 done:

- ✅ BUILD_ORDER.md shows files 119-122 ✅
- ✅ File 123 marked ⏭️ (absorbed for 4-file cadence)
- ✅ Ch 21 status is `'published'`
- ✅ Both Ch 21 widgets work in production
- ✅ All 4 Ch 21 exercises render with their starter code

**Cadence check across 21 chapters:**

**4-file cadence** holds for **15 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, 19, **21**).
**5-file cadence** holds for **6 two-topic chapters** (Ch 1, 5, 8, 9, 14, 20).

**21-chapter pattern stable.** The build process continues to scale.

**Phase 13 (Capabilities) status:**
- ✅ Ch 20 (Reasoning)
- ✅ Ch 21 (Tool use)
- ⬜ Ch 22 (RAG) — next, single-topic, 4-file
- ⬜ Ch 23 (Multimodal)

**What's next — Ch 22: Retrieval-augmented generation (RAG).** Where Ch 21 gave the model the ability to *act*, Ch 22 gives it the ability to *retrieve* — to look up information it doesn't have memorized and ground its outputs in real documents. **The chapter that turns parametric memory into parametric + retrieval memory.**

---

## Notes for the session author

**On the schema validator being driven by preset cases:**
The widget intentionally **does not let the reader edit the schema or tool call**. Reasoning: editing JSON in a textarea is fiddly; readers make typos; the educational point gets lost in debugging. **Preset cases let the reader rapidly survey the validation surface** — see how each kind of error looks without spending time hand-crafting them.

Notes-for-author: "**Preset-driven widgets are good when the *surface area* matters more than the *editing experience*.** Schema validation has 5-6 common error patterns; cycling through them quickly is more pedagogical than fighting a text editor."

**On the three schemas covering common patterns:**
- **get_weather**: smallest schema; required + optional + enum
- **search_database**: integer with min/max range
- **create_event**: multiple required fields + boolean

**These three exercise different validation behaviors**: type checking, range checking, enum checking, required-field checking, unknown-tool checking. **Reader sees the full validation surface in three schemas.**

**On the case labels using ✓ and ✗ in the button text:**
The labels start with ✓ or ✗ to telegraph the expected outcome **before** the reader clicks. This is helpful for survey-style exploration — the reader can intentionally click "missing required" to see what missing-required errors look like.

**Notes-for-author**: "**The labels are part of the pedagogy.** Reader sees '✗ duration too short' and clicks it knowing they'll get a clear out-of-range error. The widget is self-organizing."

**On the multi-error case (`create_event` last case):**
One case in `create_event` produces *two* errors simultaneously (missing required + wrong type). **This demonstrates that validation reports all errors, not just the first.** Production validators behave this way; readers should expect it.

**On the four exercises spanning the chapter's arc:**

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | Define a tool schema | 2 |
| 2 | medium | Implement the agent loop | 3 |
| 3 | medium | Embedding-based tool routing | 4 |
| 4 | hard | Idempotent dispatch with audit log | 5, 8 |

Notes-for-author: "**The progression mirrors the chapter's arc**: schema → loop → routing → safety. By the end, the reader has implemented the full production tool stack from scratch."

**On Ex 4 (idempotent dispatch) being the chapter's most production-realistic exercise:**
Side-effect-causing tools (send_email, charge_card, create_ticket) need idempotency. **Without it, agent loop retries can cause real damage** (duplicate emails sent to customers; double-charged cards). Ex 4 implements the production pattern: idempotency keys + cache + audit log.

Notes-for-author: "**Ex 4 is the chapter's safety exercise.** It's the production discipline that benchmarks usually don't test. Readers building real systems need this pattern."

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Bridge from ReAct | (chapter prose) |
| 2. Design tool schemas | Ex 1 + section 3 widget |
| 3. Implement agent loop | Ex 2 + section 4 widget |
| 4. Multi-tool routing | Ex 3 |
| 5. Observation and error handling | Ex 4 (idempotency) |
| 6. MCP | (chapter prose) |
| 7. Computer use frontier | (chapter prose) |
| 8. Common pitfalls | Ex 4 (idempotency, audit logs) |

Outcomes 2, 3, 4, 5, 8 served by exercises. Outcomes 1, 6, 7 served by chapter prose.

**Pedagogical claim of the chapter (revisited):**
"Tool use is the engineered production version of ReAct. Modern LLMs emit structured tool calls (JSON conforming to declared schemas); constrained decoding (Ch 19) makes calls structurally reliable; agent loops iterate think → act → observe until completion; multi-tool routing scales to large catalogs; error recovery and idempotent dispatch handle production failure modes; MCP standardizes the tool-server interface; computer use generalizes to any application's UI. **Tool use is what turns a reasoning model into an agent — and what every production AI assistant runs on. With Ch 21 complete, Phase 13 has covered both thinking (Ch 20) and acting.**"

**Phase 13 progress after this session**: Ch 20 ✅, Ch 21 ✅. **2 chapters remaining** in Phase 13: Ch 22 (RAG), Ch 23 (Multimodal).

**This chapter is the engineering counterpart to Ch 20's research-survey energy.** Ch 20 covered two eras of reasoning; Ch 21 covers one tightly-engineered architectural pattern. **Together they form the foundation for Phase 15 (Agents).**

Build with care.
