import { useState, useEffect, useRef } from 'react';
import {
  SCENARIOS, CATEGORY_COLORS,
  type Agent,
} from './conversation-data';
import styles from './InterAgentConversationViewer.module.css';

const PLAY_INTERVAL_MS = 1700;


function AgentBadge({ agent, size = 'normal' }: { agent: Agent | undefined; size?: 'normal' | 'small' }) {
  if (!agent) return null;
  return (
    <span
      className={`${styles.agentBadge} ${size === 'small' ? styles.agentBadgeSmall : ''}`}
      style={{
        background: `color-mix(in srgb, ${agent.color} 18%, var(--bg-elevated))`,
        color: agent.color,
        borderColor: `color-mix(in srgb, ${agent.color} 50%, transparent)`,
      }}
      title={`${agent.name} (${agent.role})`}
    >
      {agent.symbol}
    </span>
  );
}


export default function InterAgentConversationViewer() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<number | null>(null);

  const scenario = SCENARIOS[scenarioIdx]!;
  const totalSteps = scenario.messages.length;
  const isComplete = step >= totalSteps;
  const categoryColor = CATEGORY_COLORS[scenario.category];

  const agentsById = new Map<string, Agent>();
  scenario.agents.forEach(a => agentsById.set(a.id, a));

  const visibleMessages = scenario.messages.slice(0, step);

  useEffect(() => {
    setStep(0);
    setIsPlaying(false);
  }, [scenarioIdx]);

  useEffect(() => {
    if (isPlaying && !isComplete) {
      playTimerRef.current = window.setTimeout(() => {
        setStep(s => Math.min(s + 1, totalSteps));
      }, PLAY_INTERVAL_MS);
    } else if (isComplete) {
      setIsPlaying(false);
    }
    return () => {
      if (playTimerRef.current !== null) {
        window.clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, step, totalSteps, isComplete]);

  return (
    <div className={styles.widget} role="group" aria-label="Inter-agent conversation viewer">
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Inter-agent conversation viewer</div>
        <div className={styles.titleSubLabel}>
          {SCENARIOS.length} scenarios · step through multi-agent message flows
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a scenario:</span>
          <div className={styles.scenarioButtons}>
            {SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                className={`${styles.scenarioButton} ${scenarioIdx === i ? styles.scenarioButtonActive : ''}`}
                style={{ borderLeftColor: CATEGORY_COLORS[s.category] }}
                onClick={() => setScenarioIdx(i)}
              >{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{scenario.label.toUpperCase()}</div>
          <div
            className={styles.categoryBadge}
            style={{
              background: `color-mix(in srgb, ${categoryColor} 18%, transparent)`,
              color: categoryColor,
              borderColor: `color-mix(in srgb, ${categoryColor} 40%, transparent)`,
            }}
          >
            {scenario.category}
          </div>
        </div>

        <div className={styles.taskBox}>"{scenario.task}"</div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Agents</div>
          <div className={styles.agentList}>
            {scenario.agents.map(a => (
              <div key={a.id} className={styles.agentCard}>
                <AgentBadge agent={a} />
                <div className={styles.agentInfo}>
                  <div className={styles.agentName}>{a.name}</div>
                  <div className={styles.agentRole}>{a.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.stepBar}>
          <div className={styles.stepCounter} aria-live="polite">
            Step <strong>{step}</strong> of {totalSteps}
          </div>
          <div className={styles.stepButtons}>
            <button
              className={styles.stepButton}
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
            >◀ Prev</button>
            <button
              className={`${styles.stepButton} ${isPlaying ? styles.stepButtonPlaying : ''}`}
              onClick={() => setIsPlaying(p => !p)}
              disabled={isComplete}
            >{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
            <button
              className={styles.stepButton}
              onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
              disabled={step >= totalSteps}
            >Next ▶</button>
            <button
              className={styles.stepButton}
              onClick={() => { setStep(0); setIsPlaying(false); }}
            >↻ Restart</button>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Message timeline</div>
          {visibleMessages.length === 0 && (
            <div className={styles.emptyState}>
              Click <strong>Next</strong> or <strong>Play</strong> to begin the conversation.
            </div>
          )}
          <div className={styles.messageTimeline}>
            {visibleMessages.map((msg, i) => {
              const fromAgent = agentsById.get(msg.from);
              const toAgent = agentsById.get(msg.to);
              const isCurrent = msg.step === step;
              return (
                <div
                  key={i}
                  className={`${styles.messageCard} ${isCurrent ? styles.messageCardCurrent : ''} ${msg.problematic ? styles.messageCardProblematic : ''}`}
                >
                  <div className={styles.messageHeader}>
                    <span className={styles.messageStep}>Step {msg.step}</span>
                    <div className={styles.messageRoute}>
                      <AgentBadge agent={fromAgent} size="small" />
                      <span className={styles.messageArrow}>→</span>
                      <AgentBadge agent={toAgent} size="small" />
                    </div>
                    {isCurrent && <span className={styles.currentBadge}>current</span>}
                    {msg.problematic && <span className={styles.problematicBadge}>⚠ problematic</span>}
                  </div>
                  <div className={styles.messageContent}>{msg.content}</div>
                  {msg.note && (
                    <div className={styles.messageNote}>
                      <span className={styles.messageNoteArrow}>↳</span> {msg.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.statusPanel}>
          {!isComplete ? (
            <span className={styles.statusRunning}>
              <span className={styles.statusDot}></span>
              {step === 0 ? 'Not started' : 'Running'}
            </span>
          ) : scenario.outcome === 'completed' ? (
            <span className={styles.statusCompleted}>✓ Completed: {scenario.finalAnswer}</span>
          ) : scenario.outcome === 'completed-with-warnings' ? (
            <span className={styles.statusWarning}>⚠ Completed with warnings</span>
          ) : (
            <span className={styles.statusFailed}>⚠ Failed (anti-pattern demonstrated)</span>
          )}
        </div>

        {isComplete && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Insights</div>
            <ul className={styles.insightList}>
              {scenario.insights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Scenario note</div>
          <div className={styles.noteText}>{scenario.note}</div>
        </div>
      </div>

      <div className={styles.caption}>
        Step through each scenario. <strong>Three well-designed patterns</strong> (proposer-critic-judge,
        manager-worker, plan-execute-verify) show how distinct roles produce real quality gains.
        <strong> The degenerate scenario</strong> (3 redundant reviewers) shows what happens when engineers
        reach for multi-agent without genuine role separation: <strong>3× LLM cost for 1× quality</strong>;
        no consensus mechanism; no termination criteria; identical outputs from agents that aren't really
        different. <strong>This is the chapter's 80%</strong>: most "I want multi-agent" instincts produce
        the degenerate pattern. <strong>Well-designed multi-agent separates concerns; degenerate multi-agent
        just multiplies them.</strong>
      </div>
    </div>
  );
}
