# Session 95 — Tool call trace marquee widget

> The marquee Chapter 21 widget. **An animated step-through of a real multi-step agent loop.** User asks: *"What's the weather in Tokyo right now, and what would that be in Celsius?"* The reader walks through 8 events — a Thought, a structured tool call (`get_weather`), an observation, another Thought, another structured tool call (`calculator`), another observation, and a final answer. **A conversation thread builds up as the reader steps forward.** Each event is color-coded by type: Thought (gray italic), Action (amber, JSON-formatted), Observation (emerald), Final (cyan). **The widget that makes "what an agent actually does" visible in 30 seconds of interaction** — the production version of Ch 20's ReAct pattern.

---

## Read first (in this order)

1. **`research/ch21-tool-use/research.md`** — concept 4 (the agent loop) is the source material
2. **`prompts/chapters/ch21-tool-use/session-94-page-structure.md`** — for the section-4 widget placeholder this session fills
3. **`prompts/chapters/ch20-reasoning/session-91-self-consistency-aggregator-widget.md`** — for the step-through conversation pattern (Self-Consistency was the closest precedent — also built up as reader interacted)
4. **`prompts/chapters/ch19-sampling/session-88-constrained-decoding-and-exercises-and-closeout.md`** — for the step-controls + state-machine pattern (ConstrainedDecoding's prev/next/reset)
5. **`prompts/chapters/ch17-inference-optimization/session-78-kv-cache-animation-widget.md`** — for the playback-state visualization pattern

---

## Goal

Replace the `<WidgetFrame title="Agent loop trace">` placeholder in section 4 with a working interactive widget that:

- Shows a fixed user question at the top: *"What's the weather in Tokyo right now, and what would that be in Celsius?"*
- Provides **step controls**: ◀ Prev / Next ▶ / ↻ Reset / Play (optional auto-advance)
- Builds a **conversation thread** as the reader advances. Each step adds one event:
  - **Thought 1**: model's internal reasoning ("I need to look up Tokyo weather first")
  - **Action 1**: structured tool call (`get_weather(location="Tokyo")`)
  - **Observation 1**: tool result (`"65°F, cloudy"`)
  - **Thought 2**: model decides next step ("Now I need to convert 65°F to Celsius")
  - **Action 2**: structured tool call (`calculator(expression="(65-32)*5/9")`)
  - **Observation 2**: tool result (`"18.33"`)
  - **Final**: cyan summary ("It's currently 65°F (about 18.3°C) and cloudy in Tokyo.")
- **Color-codes each event** by type (Thought / Action / Observation / Final)
- Renders the **Action** as JSON-formatted code (the structured tool call from section 2's API convention)
- Shows a **step counter** ("Step 4 of 7") and **highlight** on the most recent event
- **Pedagogical caption** below explaining what the reader is seeing

**End state:** section 4 of Chapter 21 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) **the agent loop alternates Thought → Action → Observation → ... until a Final answer**; (b) **Actions are structured JSON tool calls**, not natural-language requests; (c) **Observations ground the next Thought** in real data; (d) the pattern is **Ch 20's ReAct in production form**.

---

## Inputs

State of the repo after session 94:

- `src/pages/ch21-tool-use/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 4)
- `src/lib/chapters.ts` has Ch 21 as `'draft'`
- No `src/components/widgets/ch21/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch21/ToolCallTrace.tsx` — the React widget
2. **Create** `src/components/widgets/ch21/ToolCallTrace.module.css` — scoped styles
3. **Create** `src/components/widgets/ch21/trace-data.ts` — the 8-event sequence
4. **Update** `src/components/widgets/index.ts` — add `ToolCallTrace` export
5. **Update** `src/pages/ch21-tool-use/index.mdx` — replace section-4's `<WidgetFrame>` interior with `<ToolCallTrace client:visible />`

---

## Detailed spec

### 1. `trace-data.ts` — the 8-event sequence

```ts
// src/components/widgets/ch21/trace-data.ts

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
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Agent loop trace                                                 │
│                                                                  │
│ User asks:                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ "What's the weather in Tokyo right now, and what would that  │ │
│ │  be in Celsius?"                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [◀ Prev]  [Next ▶]  [↻ Reset]    Step 5 of 7                     │
│                                                                  │
│ Conversation:                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ◐ Thought  (gray italic)                                      │ │
│ │   "I need to look up the current weather in Tokyo first..."  │ │
│ │                                                                │ │
│ │ ▶ Action  (amber JSON block)                                  │ │
│ │   {                                                            │ │
│ │     "name": "get_weather",                                    │ │
│ │     "input": { "location": "Tokyo", "unit": "fahrenheit" }   │ │
│ │   }                                                            │ │
│ │                                                                │ │
│ │ ◀ Observation (emerald)                                       │ │
│ │   65°F, cloudy. Humidity 72%. Wind 8 mph from the NE.        │ │
│ │   ← from tool: get_weather                                    │ │
│ │                                                                │ │
│ │ ◐ Thought  (gray italic)                                      │ │
│ │   "Now I need to convert 65°F to Celsius using                │ │
│ │    C = (F-32) * 5/9..."                                       │ │
│ │                                                                │ │
│ │ ▶ Action  ← HIGHLIGHTED (most recent)                          │ │
│ │   {                                                            │ │
│ │     "name": "calculator",                                     │ │
│ │     "input": { "expression": "(65 - 32) * 5 / 9" }            │ │
│ │   }                                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Step explanation:                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ The model emits a structured tool call — a JSON object        │ │
│ │ matching a declared schema (Section 3). Constrained decoding  │ │
│ │ (Ch 19) guarantees the call is well-formed.                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Pedagogical caption (below)                                       │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- **Prev / Next**: step through the 7 events one at a time. The conversation builds up; events stay visible after they appear.
- **Reset**: clear back to step −1 (only the question visible).
- **Step counter**: shows "Step N of 7" with the current event's `kind` in cyan.
- **Most recent event highlighted**: a subtle ring or background tint marks the most recently revealed event.
- **Step explanation panel**: updates to describe what kind of event the current step is.

**Visual encoding (event colors)**:
- **Thought**: gray-italic text with `◐` marker — represents the model's internal monologue
- **Action**: amber background, JSON-formatted code block, `▶` marker — represents the structured tool call
- **Observation**: emerald-tinted panel, `◀` marker — represents the grounded result
- **Final**: cyan-tinted panel, ✓ marker, larger text — represents the final answer

The convention echoes earlier widgets: amber for "intermediate/source" (action being emitted), emerald for "good/result" (observation grounding the loop), cyan for "preferred/final" (final answer).

### 3. `ToolCallTrace.tsx`

```tsx
import { useState } from 'react';
import {
  USER_QUESTION, TRACE_EVENTS, captionFor,
  type TraceEvent,
} from './trace-data';
import styles from './ToolCallTrace.module.css';

export default function ToolCallTrace() {
  // stepIdx = -1 means "no events revealed yet"; 0..N-1 means events 0..stepIdx are visible
  const [stepIdx, setStepIdx] = useState(-1);
  const isFirst = stepIdx < 0;
  const isLast = stepIdx >= TRACE_EVENTS.length - 1;

  const revealed = stepIdx >= 0 ? TRACE_EVENTS.slice(0, stepIdx + 1) : [];
  const currentEvent = stepIdx >= 0 ? TRACE_EVENTS[stepIdx] : null;
  const currentStepKind = currentEvent?.kind ?? '—';

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Agent loop trace</div>
        <div className={styles.titleSubLabel}>
          A real multi-step tool-use sequence · step through to see the loop
        </div>
      </div>

      {/* User question */}
      <div className={styles.questionPanel}>
        <div className={styles.questionLabel}>User asks</div>
        <div className={styles.questionText}>"{USER_QUESTION}"</div>
      </div>

      {/* Controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlsRow}>
          <button
            className={styles.button}
            onClick={() => setStepIdx(i => Math.max(-1, i - 1))}
            disabled={isFirst}
          >◀ Prev</button>
          <button
            className={styles.button}
            onClick={() => setStepIdx(i => Math.min(TRACE_EVENTS.length - 1, i + 1))}
            disabled={isLast}
          >Next ▶</button>
          <button
            className={styles.button}
            onClick={() => setStepIdx(-1)}
            disabled={isFirst}
          >↻ Reset</button>
          <span className={styles.stepCounter}>
            {isFirst
              ? 'Step 0 of 7 · waiting'
              : <>Step {stepIdx + 1} of {TRACE_EVENTS.length} · <strong>{currentStepKind}</strong></>}
          </span>
        </div>
      </div>

      {/* Conversation thread */}
      <div className={styles.threadPanel}>
        <div className={styles.threadTitle}>Conversation</div>
        {revealed.length === 0 && (
          <div className={styles.emptyState}>
            Click <strong>Next ▶</strong> to begin the trace.
          </div>
        )}
        <div className={styles.threadList}>
          {revealed.map((event, i) => (
            <EventCard
              key={i}
              event={event}
              isLatest={i === revealed.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Step explanation */}
      <div className={styles.explanationPanel}>
        <div className={styles.explanationLabel}>What's happening</div>
        <div className={styles.explanationText}>{captionFor(stepIdx)}</div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Walk through the loop with <strong>Next ▶</strong>. Watch the conversation build:
        <strong>Thought → Action → Observation → Thought → Action → Observation → Final</strong>.
        Each <strong>Action</strong> is a structured JSON tool call (the API convention from Section 2);
        each <strong>Observation</strong> grounds the next Thought in real data. This is Chapter 20's
        ReAct pattern made production — the loop that every modern agent runs on.
      </div>
    </div>
  );
}

interface EventCardProps {
  event: TraceEvent;
  isLatest: boolean;
}
function EventCard({ event, isLatest }: EventCardProps) {
  const cardClass = `${styles.eventCard} ${styles[`event-${event.kind}`]} ${isLatest ? styles.eventLatest : ''}`;

  return (
    <div className={cardClass}>
      <div className={styles.eventHeader}>
        <span className={styles.eventMarker}>{markerFor(event.kind)}</span>
        <span className={styles.eventKind}>{labelFor(event.kind)}</span>
        {event.toolName && (
          <span className={styles.eventTool}>← from tool: {event.toolName}</span>
        )}
      </div>
      <div className={styles.eventBody}>
        {event.kind === 'action' && event.toolCall ? (
          <pre className={styles.eventActionCode}>
{JSON.stringify(event.toolCall, null, 2)}
          </pre>
        ) : (
          <div className={styles.eventText}>{event.text}</div>
        )}
      </div>
    </div>
  );
}

function markerFor(kind: string): string {
  switch (kind) {
    case 'thought': return '◐';
    case 'action': return '▶';
    case 'observation': return '◀';
    case 'final': return '✓';
    default: return '·';
  }
}

function labelFor(kind: string): string {
  switch (kind) {
    case 'thought': return 'Thought';
    case 'action': return 'Action';
    case 'observation': return 'Observation';
    case 'final': return 'Final answer';
    default: return kind;
  }
}
```

### 4. `ToolCallTrace.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .questionPanel, .controlsPanel, .threadPanel, .explanationPanel, .caption {
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

/* Question panel */
.questionLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
}
.questionText {
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.5;
  padding: 0.5rem 0.8rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

/* Controls */
.controlsRow {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.button {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.button:hover:not(:disabled) {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.button:disabled { opacity: 0.35; cursor: not-allowed; }
.stepCounter {
  margin-left: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
}
.stepCounter strong { color: var(--cyan-300); text-transform: capitalize; }

/* Thread */
.threadTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.6rem;
  font-weight: 500;
}
.emptyState {
  padding: 1.5rem 1rem;
  text-align: center;
  color: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
}
.emptyState strong { color: var(--cyan-300); }
.threadList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Event cards */
.eventCard {
  padding: 0.7rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-subtle);
  background: var(--bg-primary);
  transition: all 200ms;
}
.eventLatest {
  outline: 2px solid var(--cyan-500);
  outline-offset: 1px;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--cyan-500) 35%, transparent));
}

.eventHeader {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  margin-bottom: 0.4rem;
}
.eventMarker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 700;
}
.eventKind {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.eventTool {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.eventBody { /* no-op container */ }
.eventText {
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--text-primary);
}
.eventActionCode {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  padding: 0.55rem 0.7rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  white-space: pre;
  overflow-x: auto;
  margin: 0;
  color: var(--text-primary);
  line-height: 1.45;
}

/* Per-kind colors */
.event-thought {
  border-left: 4px solid var(--text-tertiary);
}
.event-thought .eventMarker { color: var(--text-tertiary); }
.event-thought .eventKind { color: var(--text-tertiary); }
.event-thought .eventText { font-style: italic; color: var(--text-secondary); }

.event-action {
  border-left: 4px solid var(--amber-400);
  background: color-mix(in srgb, var(--amber-400) 4%, var(--bg-primary));
}
.event-action .eventMarker { color: var(--amber-400); }
.event-action .eventKind { color: var(--amber-400); }

.event-observation {
  border-left: 4px solid var(--emerald-400);
  background: color-mix(in srgb, var(--emerald-400) 4%, var(--bg-primary));
}
.event-observation .eventMarker { color: var(--emerald-400); }
.event-observation .eventKind { color: var(--emerald-400); }

.event-final {
  border-left: 4px solid var(--cyan-500);
  background: color-mix(in srgb, var(--cyan-500) 6%, var(--bg-primary));
}
.event-final .eventMarker { color: var(--cyan-300); }
.event-final .eventKind { color: var(--cyan-300); }
.event-final .eventText {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
}

/* Explanation */
.explanationPanel {
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
}
.explanationLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--cyan-300);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.explanationText {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.5;
}

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .controlsRow { gap: 0.3rem; }
  .stepCounter { font-size: 0.7rem; }
  .eventActionCode { font-size: 0.72rem; padding: 0.4rem 0.5rem; }
  .eventText { font-size: 0.82rem; }
  .button { padding: 0.3rem 0.6rem; font-size: 0.72rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as ToolCallTrace } from './ch21/ToolCallTrace';
// Session 122 will add:
// export { default as ToolSchemaValidator } from './ch21/ToolSchemaValidator';
```

### 6. Update `src/pages/ch21-tool-use/index.mdx`

**Edit A: Add widget import:**

```mdx
import { ToolCallTrace } from '@components/widgets';
```

**Edit B: Replace section-4's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Agent loop trace" caption="Step through a real multi-step agent loop. User asks for Tokyo's weather in Celsius; the model emits a Thought, calls get_weather, receives an Observation, emits another Thought, calls calculator, receives another Observation, then produces a Final answer. The conversation builds up step by step. Each Action is a structured JSON tool call; each Observation grounds the next Thought. This is Ch 20's ReAct pattern in production form — the loop every modern agent runs on.">
  <ToolCallTrace client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 4 of Ch 21** renders with the working widget. Section 3's placeholder still stubbed.
3. **Default state**: step −1 (no events revealed). "Click Next ▶ to begin the trace." empty-state visible. Prev disabled, Reset disabled, Next enabled.
4. **Question always visible**: the Tokyo weather question shows at top regardless of step.
5. **Step counter**: at step −1 shows "Step 0 of 7 · waiting"; at step 0 shows "Step 1 of 7 · thought"; etc.
6. **Prev**: at step −1, disabled. At step 0, decrements to −1 (clears the thread). At any step, walks back.
7. **Next**: increments. At the last step, disabled.
8. **Reset**: returns to step −1 from any step; disabled at step −1.
9. **Conversation thread builds up**: events stay visible after revealed. Reaching step 6 shows all 7 events.
10. **Most recent event highlighted**: cyan outline + drop-shadow on the latest event card.
11. **Event color coding works**:
    - **Thought**: gray left-border, gray italic text, `◐` marker
    - **Action**: amber left-border, amber tint, `▶` marker, JSON formatted in monospace block
    - **Observation**: emerald left-border, emerald tint, `◀` marker, includes "← from tool: X"
    - **Final**: cyan left-border, cyan tint, `✓` marker, slightly larger text
12. **Action JSON renders correctly**: pretty-printed JSON with name + input fields.
13. **Step explanation panel** updates with each step — describes the *kind* of event (thought/action/observation/final).
14. **Mobile** (< 720px): controls stack; action JSON shrinks slightly but stays readable.
15. **`npm run typecheck`** passes.
16. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement auto-play / animation.** Manual step-through is clearer for this widget.
- ❌ **Do not allow the user to edit the question or trace.** Fixed scenario.
- ❌ **Do not implement multiple scenarios** (no scenario picker). One clean scenario.
- ❌ **Do not implement actual tool execution.** The trace is pre-recorded.
- ❌ **Do not call a real LLM.** All events are pre-defined.
- ❌ **Do not implement parallel tool calls.** Single tool per step (covered conceptually in section 4's prose).
- ❌ **Do not implement error-recovery flow.** Clean happy path only.
- ❌ **Do not flip Ch 21's status**. Session 122 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch21/ src/components/widgets/index.ts src/pages/ch21-tool-use/index.mdx
git commit -m "session 95: tool call trace marquee — visualize the agent loop step by step"
git push origin main
```

Verify on production:
- Prev/Next/Reset all work
- Conversation builds up correctly
- Event colors match the convention
- Action JSON renders prettily
- Step explanation panel updates correctly

---

## Notes for the session author

**On the scenario being a single clean walkthrough:**
The widget intentionally has **one fixed scenario**, not a scenario picker. **Reasoning**: the chapter's central concept (the agent loop) is best taught with a single concrete example walked through carefully. Adding multiple scenarios would distract from the core teaching ("look how Thought → Action → Observation chain together").

Notes-for-author: "**Multi-scenario widgets are good for comparing variations**; this widget is teaching a *pattern*, so a single deep walkthrough is the right shape."

**On the chosen question — Tokyo weather in Celsius:**
The question is engineered to require exactly two tool calls with a natural dependency: `get_weather` first (you can't convert what you don't have), then `calculator` (uses the result of the first call). **This is the simplest non-trivial agent loop.**

Pedagogically valuable because:
1. **Two tool calls** = enough to show the loop, not so many it gets tedious
2. **Tools differ in domain** (weather lookup vs math) so they don't blur together
3. **The dependency is intuitive** — readers grasp why the calls must be serial
4. **The conversion math is simple** but visible — readers can sanity-check the result

**On the conversation building up (vs replacing):**
Each step **adds** an event; revealed events **stay visible**. **This mirrors how an actual agent loop accumulates context** — the model sees the full history at each step. **Reader sees the loop's memory accumulate.**

Notes-for-author: "**Don't replace events as the reader advances.** The whole pedagogical point is that the conversation grows. Each Thought has access to all prior Thoughts and Observations via the KV cache (Ch 17). The widget should reflect this."

**On the event color coding being convention-consistent:**
The color choice ties back to earlier widget conventions:
- **Amber for Action**: amber has been "intermediate / source / being-emitted" across earlier widgets (the tokenizer's source token, the SFT loss's middle position, the RLHF preference pipeline's intermediate stage)
- **Emerald for Observation**: emerald has been "good / result / received" across earlier widgets (kept tokens, accepted speculative tokens, NF4 levels)
- **Cyan for Final**: cyan has been "preferred / final / chosen" throughout (the chapter's accent color, the chosen sampling token, the published chapter status)
- **Gray italic for Thought**: deliberately understated — the model's internal reasoning is "thinking out loud" not "doing"

**On the marker symbols (◐ ▶ ◀ ✓):**
- `◐` for Thought: a half-filled circle, suggesting "in progress / partial knowledge"
- `▶` for Action: a forward-pointing arrow, suggesting "outbound message"
- `◀` for Observation: a back-pointing arrow, suggesting "inbound result"
- `✓` for Final: a checkmark, suggesting "complete"

**The markers tell the loop's direction at a glance.** Notes-for-author: "Symbols are a small detail but they reinforce the agent loop's structure visually."

**On the step explanation panel:**
Each step gets a one-sentence explanation of what *kind* of event is happening:
- Thought: "natural-language reasoning about what to do next"
- Action: "structured tool call — JSON object matching declared schema"
- Observation: "tool executed; result returned as grounded data"
- Final: "no more tool calls needed; agent loop terminates"

Notes-for-author: "**These descriptions tie each event to the chapter's prose.** Reader sees the conceptual term ('structured tool call', 'grounded data') connected to the visual event. Pedagogy and visual reinforce."

**On the latest-event highlighting:**
The most recent event card gets a cyan outline + drop-shadow. **Reader's eye is drawn to where the action is happening** — without losing access to the history.

**On the highlight + explanation combo:**
Together, these two features make the widget self-narrating:
- The highlight says *"this is what just happened"*
- The explanation panel says *"this is what that kind of event means"*

**The reader doesn't need outside instructions to follow the trace.**

**Pedagogical claim this widget supports:**
"The agent loop is the production version of ReAct. The model alternates Thought (internal reasoning) → Action (structured JSON tool call) → Observation (grounded result), repeating until it produces a Final answer. Each Thought has access to all prior Thoughts and Observations via the KV cache. **The conversation builds up; the agent's 'memory' is the conversation itself.** **The widget makes this loop visible step by step — the foundational pattern every modern AI agent runs on.**"

After 30 seconds of interaction (one or two passes through the trace), the reader has internalized: (a) the loop alternates four event kinds; (b) Actions are structured JSON; (c) Observations ground the next Thought; (d) the conversation accumulates — that's the agent's state.

**This is Ch 21's central visualization.** Build with care.
