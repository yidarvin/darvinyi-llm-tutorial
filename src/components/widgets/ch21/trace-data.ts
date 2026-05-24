export type EventKind = 'thought' | 'action' | 'observation' | 'final';

export interface TraceEvent {
  kind: EventKind;
  /** Text content. For 'action' events, this is the textual description; the structured call lives in `toolCall`. */
  text: string;
  /** For 'action' events, the structured JSON tool call. */
  toolCall?: {
    name: string;
    input: Record<string, unknown>;
  };
  /** For 'observation' events, the tool name (echoed for clarity). */
  toolName?: string;
}

export const USER_QUESTION =
  "What's the weather in Tokyo right now, and what would that be in Celsius?";

export const TRACE_EVENTS: TraceEvent[] = [
  {
    kind: 'thought',
    text:
      "I need to look up the current weather in Tokyo first, then convert the temperature to Celsius. " +
      "I'll start by calling get_weather, then use calculator for the conversion.",
  },
  {
    kind: 'action',
    text: 'Call the get_weather tool with location="Tokyo".',
    toolCall: {
      name: 'get_weather',
      input: { location: 'Tokyo', unit: 'fahrenheit' },
    },
  },
  {
    kind: 'observation',
    text: '65°F, cloudy. Humidity 72%. Wind 8 mph from the northeast.',
    toolName: 'get_weather',
  },
  {
    kind: 'thought',
    text:
      "Now I need to convert 65°F to Celsius using the formula C = (F − 32) × 5/9. " +
      "I'll call the calculator tool.",
  },
  {
    kind: 'action',
    text: 'Call the calculator tool with the conversion expression.',
    toolCall: {
      name: 'calculator',
      input: { expression: '(65 - 32) * 5 / 9' },
    },
  },
  {
    kind: 'observation',
    text: '18.333333...',
    toolName: 'calculator',
  },
  {
    kind: 'final',
    text:
      "It's currently 65°F (about 18.3°C) and cloudy in Tokyo, with 72% humidity and a light " +
      'northeast breeze.',
  },
];

/** Caption updates based on the current step's kind. */
export function captionFor(stepIdx: number): string {
  if (stepIdx < 0) return 'Click Next to begin the trace.';
  const event = TRACE_EVENTS[stepIdx];
  if (!event) return '';
  switch (event.kind) {
    case 'thought':
      return 'The model produces a Thought — natural-language reasoning about what to do next. This is internal to the model; the structured tool call comes next.';
    case 'action':
      return 'The model emits a structured tool call — a JSON object matching a declared schema (Section 3). Constrained decoding (Ch 19) guarantees the call is well-formed.';
    case 'observation':
      return 'The system executes the tool and returns the result as an Observation. The model now has grounded data to reason over.';
    case 'final':
      return 'The model produces a Final answer in plain text — no more tool calls needed. The agent loop terminates.';
  }
}
