import { useState } from 'react';
import {
  USER_QUESTION,
  TRACE_EVENTS,
  captionFor,
  type TraceEvent,
} from './trace-data';
import styles from './ToolCallTrace.module.css';

export default function ToolCallTrace() {
  const [stepIdx, setStepIdx] = useState(-1);
  const isFirst = stepIdx < 0;
  const isLast = stepIdx >= TRACE_EVENTS.length - 1;

  const revealed = stepIdx >= 0 ? TRACE_EVENTS.slice(0, stepIdx + 1) : [];
  const currentEvent = stepIdx >= 0 ? TRACE_EVENTS[stepIdx] : null;
  const currentStepKind = currentEvent?.kind ?? '—';

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Agent loop trace</div>
        <div className={styles.titleSubLabel}>
          A real multi-step tool-use sequence · step through to see the loop
        </div>
      </div>

      <div className={styles.questionPanel}>
        <div className={styles.questionLabel}>User asks</div>
        <div className={styles.questionText}>"{USER_QUESTION}"</div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlsRow}>
          <button
            className={styles.button}
            onClick={() => setStepIdx((i) => Math.max(-1, i - 1))}
            disabled={isFirst}
          >
            ◀ Prev
          </button>
          <button
            className={styles.button}
            onClick={() =>
              setStepIdx((i) => Math.min(TRACE_EVENTS.length - 1, i + 1))
            }
            disabled={isLast}
          >
            Next ▶
          </button>
          <button
            className={styles.button}
            onClick={() => setStepIdx(-1)}
            disabled={isFirst}
          >
            ↻ Reset
          </button>
          <span className={styles.stepCounter}>
            {isFirst ? (
              <>Step 0 of {TRACE_EVENTS.length} · waiting</>
            ) : (
              <>
                Step {stepIdx + 1} of {TRACE_EVENTS.length} ·{' '}
                <strong>{currentStepKind}</strong>
              </>
            )}
          </span>
        </div>
      </div>

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

      <div className={styles.explanationPanel}>
        <div className={styles.explanationLabel}>What's happening</div>
        <div className={styles.explanationText}>{captionFor(stepIdx)}</div>
      </div>

      <div className={styles.caption}>
        Walk through the loop with <strong>Next ▶</strong>. Watch the
        conversation build:{' '}
        <strong>
          Thought → Action → Observation → Thought → Action → Observation →
          Final
        </strong>
        . Each <strong>Action</strong> is a structured JSON tool call (the API
        convention from Section 2); each <strong>Observation</strong> grounds
        the next Thought in real data. This is Chapter 20's ReAct pattern made
        production — the loop that every modern agent runs on.
      </div>
    </div>
  );
}

interface EventCardProps {
  event: TraceEvent;
  isLatest: boolean;
}

function EventCard({ event, isLatest }: EventCardProps) {
  const kindClass = styles[`event-${event.kind}`] ?? '';
  const cardClass = `${styles.eventCard} ${kindClass} ${isLatest ? styles.eventLatest : ''}`;

  return (
    <div className={cardClass}>
      <div className={styles.eventHeader}>
        <span className={styles.eventMarker}>{markerFor(event.kind)}</span>
        <span className={styles.eventKind}>{labelFor(event.kind)}</span>
        {event.toolName && (
          <span className={styles.eventTool}>
            ← from tool: {event.toolName}
          </span>
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
    case 'thought':
      return '◐';
    case 'action':
      return '▶';
    case 'observation':
      return '◀';
    case 'final':
      return '✓';
    default:
      return '·';
  }
}

function labelFor(kind: string): string {
  switch (kind) {
    case 'thought':
      return 'Thought';
    case 'action':
      return 'Action';
    case 'observation':
      return 'Observation';
    case 'final':
      return 'Final answer';
    default:
      return kind;
  }
}
