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
  label: string;
  description: string;
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

  for (const req of schema.inputSchema.required ?? []) {
    if (!(req in call.input)) {
      errors.push({
        kind: 'missing_required',
        field: req,
        message: `Missing required field "${req}".`,
      });
    }
  }

  for (const [field, value] of Object.entries(call.input)) {
    const propSchema = schema.inputSchema.properties[field];
    if (!propSchema) {
      errors.push({
        kind: 'wrong_type',
        field,
        message: `Field "${field}" is not declared in the schema.`,
      });
      continue;
    }

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

    if (propSchema.enum && !propSchema.enum.includes(String(value))) {
      errors.push({
        kind: 'invalid_enum',
        field,
        message: `Field "${field}" must be one of [${propSchema.enum.join(', ')}]; got "${value}".`,
      });
    }

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
