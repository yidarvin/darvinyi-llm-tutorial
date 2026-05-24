import { useState, useMemo } from 'react';
import {
  TRACES, CATEGORY_COLORS, KIND_COLORS, STATUS_COLORS,
  type Span,
} from './trace-data';
import styles from './AgentTraceInspector.module.css';


function statusIcon(status: Span['status']): string {
  return status === 'ok' ? '✓' : status === 'error' ? '✗' : '⚠';
}


export default function AgentTraceInspector() {
  const [idx, setIdx] = useState(0);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const trace = TRACES[idx]!;
  const categoryColor = CATEGORY_COLORS[trace.category];

  const selectedSpan = useMemo(() => {
    if (!selectedSpanId) return null;
    return trace.spans.find(s => s.id === selectedSpanId) ?? null;
  }, [selectedSpanId, trace]);

  function selectTrace(i: number) {
    setIdx(i);
    setSelectedSpanId(null);
  }

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Agent trace inspector</div>
        <div className={styles.titleSubLabel}>
          {TRACES.length} traces · flame-graph-style nested spans · click for detail
        </div>
      </div>

      {/* Picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a trace:</span>
          <div className={styles.traceButtons}>
            {TRACES.map((t, i) => (
              <button
                key={t.id}
                className={`${styles.traceButton} ${idx === i ? styles.traceButtonActive : ''}`}
                style={{ borderLeftColor: CATEGORY_COLORS[t.category] }}
                onClick={() => selectTrace(i)}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{trace.label.toUpperCase()}</div>
          <div
            className={styles.categoryBadge}
            style={{
              background: `color-mix(in srgb, ${categoryColor} 18%, transparent)`,
              color: categoryColor,
              borderColor: `color-mix(in srgb, ${categoryColor} 40%, transparent)`,
            }}
          >
            {trace.category}
          </div>
        </div>

        {/* Task */}
        <div className={styles.taskBox}>"{trace.task}"</div>

        {/* Summary stats */}
        <div className={styles.summaryRow}>
          <div className={styles.summaryStat}>
            <span className={styles.summaryIcon}>⏱️</span>
            <span className={styles.summaryValue}>{(trace.totalMs / 1000).toFixed(2)}s</span>
            <span className={styles.summaryKey}>total</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryIcon}>💰</span>
            <span className={styles.summaryValue}>${trace.totalCostUsd.toFixed(3)}</span>
            <span className={styles.summaryKey}>cost</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryIcon}>📊</span>
            <span className={styles.summaryValue}>
              {(trace.totalTokensIn + trace.totalTokensOut).toLocaleString()}
            </span>
            <span className={styles.summaryKey}>tokens</span>
          </div>
          <div
            className={`${styles.summaryStat} ${
              trace.outcome === 'completed' ? styles.summaryStatOk :
              trace.outcome === 'completed-with-warnings' ? styles.summaryStatWarn :
              styles.summaryStatErr
            }`}
          >
            <span className={styles.summaryIcon}>
              {trace.outcome === 'completed' ? '✓' :
               trace.outcome === 'completed-with-warnings' ? '⚠' : '✗'}
            </span>
            <span className={styles.summaryValue}>{trace.outcome.replace(/-/g, ' ')}</span>
          </div>
        </div>

        {/* Span flame graph */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Span flame graph · click for detail</div>
          <div className={styles.flameContainer}>
            <div className={styles.timelineHeader}>
              <span>0ms</span>
              <span>{(trace.totalMs / 2).toFixed(0)}ms</span>
              <span>{trace.totalMs}ms</span>
            </div>
            <div className={styles.flameRows}>
              {trace.spans.map(span => {
                const left = (span.startMs / trace.totalMs) * 100;
                const width = Math.max(0.4, (span.durationMs / trace.totalMs) * 100);
                const isSelected = selectedSpanId === span.id;
                const kindColor = KIND_COLORS[span.kind];
                const statusColor = STATUS_COLORS[span.status];
                return (
                  <div
                    key={span.id}
                    className={`${styles.flameRow} ${isSelected ? styles.flameRowSelected : ''}`}
                    onClick={() => setSelectedSpanId(span.id)}
                  >
                    <div
                      className={styles.flameRowLabel}
                      style={{ paddingLeft: `${span.depth * 1.2}rem` }}
                    >
                      <span className={styles.flameStatusIcon} style={{ color: statusColor }}>
                        {statusIcon(span.status)}
                      </span>
                      <span className={styles.flameName}>{span.name}</span>
                    </div>
                    <div className={styles.flameBarTrack}>
                      <div
                        className={styles.flameBar}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          background: kindColor,
                          opacity: span.status === 'error' ? 0.85 : 0.7,
                        }}
                      >
                        <span className={styles.flameBarLabel}>{span.durationMs}ms</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected span detail */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Selected span detail</div>
          {!selectedSpan ? (
            <div className={styles.emptyState}>
              Click a span above to see its full attributes.
            </div>
          ) : (
            <div className={styles.spanDetail}>
              <div className={styles.spanDetailHeader}>
                <span className={styles.spanDetailName}>{selectedSpan.name}</span>
                <span
                  className={styles.spanDetailStatus}
                  style={{ color: STATUS_COLORS[selectedSpan.status] }}
                >
                  {statusIcon(selectedSpan.status)} {selectedSpan.status}
                </span>
              </div>
              <table className={styles.spanDetailTable}>
                <tbody>
                  <tr>
                    <td className={styles.spanDetailKey}>kind</td>
                    <td className={styles.spanDetailValue}>{selectedSpan.kind}</td>
                  </tr>
                  <tr>
                    <td className={styles.spanDetailKey}>start</td>
                    <td className={styles.spanDetailValue}>{selectedSpan.startMs}ms</td>
                  </tr>
                  <tr>
                    <td className={styles.spanDetailKey}>duration</td>
                    <td className={styles.spanDetailValue}>{selectedSpan.durationMs}ms</td>
                  </tr>
                  {Object.entries(selectedSpan.attributes).map(([k, v]) => (
                    <tr key={k}>
                      <td className={styles.spanDetailKey}>{k}</td>
                      <td className={styles.spanDetailValue}>{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedSpan.note && (
                <div className={styles.spanDetailNote}>
                  <span className={styles.spanDetailNoteLabel}>note:</span> {selectedSpan.note}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Insights */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Insights</div>
          <ul className={styles.insightList}>
            {trace.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>

        {/* Scenario note */}
        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Scenario note</div>
          <div className={styles.noteText}>{trace.note}</div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        <strong>This is what production observability looks like.</strong> Each agent task is a tree of
        spans — LLM calls, tool calls, parses, retries, final answers — each with timing, attributes
        (model, tokens, cost), and status. <strong>Clean traces tell you nothing</strong>; they're
        the baseline. <strong>The interesting traces are the failure modes</strong>: transient retries
        (engineering working as designed), hallucinated tool calls (the LLM recovers via structured
        errors), cost-blown runaways (context bloat caught by hard caps). <strong>Without traces, every
        agent failure is mysterious</strong>; with them, the cause is visible in seconds. Production
        tools like LangSmith, Helicone, and Braintrust render this view at scale.
      </div>
    </div>
  );
}
