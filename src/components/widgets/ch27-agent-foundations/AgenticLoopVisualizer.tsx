import { useState, useEffect, useMemo, useRef } from 'react';
import {
  SCENARIOS, CATEGORIES, buildSteps,
  type LoopPhase, type RevealStep,
} from './loop-data';
import styles from './AgenticLoopVisualizer.module.css';

const PLAY_INTERVAL_MS = 1500;

export default function AgenticLoopVisualizer() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<number | null>(null);

  const scenario = SCENARIOS[scenarioIdx]!;
  const steps = useMemo(() => buildSteps(scenario), [scenario]);
  const totalSteps = steps.length;
  const currentStepInfo: RevealStep | null = step > 0 ? steps[step - 1]! : null;
  const isComplete = step >= totalSteps;
  const category = CATEGORIES[scenario.category];

  // Reset step when scenario changes
  useEffect(() => {
    setStep(0);
    setIsPlaying(false);
  }, [scenarioIdx]);

  // Auto-play
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

  /** What's revealed in turn i, given current step? */
  function revealForTurn(turnIdx: number): { thought: boolean; action: boolean; observation: boolean; isCurrent: boolean } {
    const reveal = { thought: false, action: false, observation: false, isCurrent: false };
    for (let s = 0; s < step; s++) {
      const sInfo = steps[s]!;
      if (sInfo.turnIndex === turnIdx) {
        if (sInfo.phase === 'think') reveal.thought = true;
        if (sInfo.phase === 'act') reveal.action = true;
        if (sInfo.phase === 'observe') reveal.observation = true;
      }
    }
    if (currentStepInfo && currentStepInfo.turnIndex === turnIdx) {
      reveal.isCurrent = true;
    }
    return reveal;
  }

  const visibleTurns = scenario.turns.filter((_, i) => {
    return steps.slice(0, step).some(s => s.turnIndex === i);
  });

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Agentic loop visualizer</div>
        <div className={styles.titleSubLabel}>
          {SCENARIOS.length} scenarios · step through ReAct traces turn by turn
        </div>
      </div>

      {/* Scenario picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a scenario:</span>
          <div className={styles.scenarioButtons}>
            {SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                className={`${styles.scenarioButton} ${scenarioIdx === i ? styles.scenarioButtonActive : ''}`}
                style={{ borderLeftColor: CATEGORIES[s.category].color }}
                onClick={() => setScenarioIdx(i)}
              >{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{scenario.label.toUpperCase()}</div>
          <div
            className={styles.categoryBadge}
            style={{
              background: `color-mix(in srgb, ${category.color} 18%, transparent)`,
              color: category.color,
              borderColor: `color-mix(in srgb, ${category.color} 40%, transparent)`,
            }}
          >
            {category.label}
          </div>
        </div>

        {/* Task */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Task</div>
          <div className={styles.taskBox}>{scenario.task}</div>
        </div>

        {/* Step controls */}
        <div className={styles.stepBar}>
          <div className={styles.stepCounter}>
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

        {/* Mini loop diagram */}
        <div className={styles.loopDiagram}>
          <div className={styles.loopLabel}>Current loop phase:</div>
          <div className={styles.loopPills}>
            {(['think', 'act', 'observe'] as LoopPhase[]).map(phase => {
              const isActive = currentStepInfo?.phase === phase;
              return (
                <div
                  key={phase}
                  className={`${styles.loopPill} ${isActive ? styles.loopPillActive : ''}`}
                >
                  {phase === 'think' && '💭 '}
                  {phase === 'act' && '⚡ '}
                  {phase === 'observe' && '👁️ '}
                  {phase}
                </div>
              );
            })}
          </div>
        </div>

        {/* Accumulating turn history */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Accumulating turn history</div>
          {visibleTurns.length === 0 && (
            <div className={styles.emptyState}>
              Click <strong>Next</strong> or <strong>Play</strong> to begin the trace.
            </div>
          )}
          {visibleTurns.map((turn, idx) => {
            const reveal = revealForTurn(idx);
            return (
              <div
                key={idx}
                className={`${styles.turnCard} ${reveal.isCurrent ? styles.turnCardCurrent : ''}`}
              >
                <div className={styles.turnHeader}>
                  Turn {turn.turn}
                  {reveal.isCurrent && <span className={styles.currentBadge}>current</span>}
                  {turn.isFinal && reveal.action && (
                    <span className={styles.finalBadge}>final</span>
                  )}
                </div>
                {reveal.thought && (
                  <div className={styles.turnRow}>
                    <span className={styles.turnIcon}>💭</span>
                    <span className={styles.turnRowLabel}>Thought:</span>
                    <span className={styles.turnRowText}>{turn.thought}</span>
                  </div>
                )}
                {reveal.action && (
                  <div className={styles.turnRow}>
                    <span className={styles.turnIcon}>⚡</span>
                    <span className={styles.turnRowLabel}>Action:</span>
                    <span className={styles.turnRowText}>
                      <code>{turn.action}</code>
                    </span>
                  </div>
                )}
                {reveal.observation && turn.observation !== null && (
                  <div className={styles.turnRow}>
                    <span className={styles.turnIcon}>👁️</span>
                    <span className={styles.turnRowLabel}>Observation:</span>
                    <span className={styles.turnRowText}>{turn.observation}</span>
                  </div>
                )}
                {/* Placeholder for pending observation */}
                {reveal.action && !reveal.observation && !turn.isFinal && (
                  <div className={`${styles.turnRow} ${styles.turnRowPending}`}>
                    <span className={styles.turnIcon}>⏳</span>
                    <span className={styles.turnRowLabel}>Observation:</span>
                    <span className={styles.turnRowText}>(arrives next step)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status */}
        <div className={styles.statusPanel}>
          {!isComplete ? (
            <span className={styles.statusRunning}>
              <span className={styles.statusDot}></span>
              {step === 0 ? 'Not started' : 'Running'}
            </span>
          ) : scenario.outcome === 'completed' ? (
            <span className={styles.statusCompleted}>✓ Completed</span>
          ) : (
            <span className={styles.statusFailed}>⚠ Failed (graceful)</span>
          )}
        </div>

        {/* Scenario note */}
        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Scenario note</div>
          <div className={styles.noteText}>{scenario.note}</div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Step through each scenario. <strong>Every turn is an observe → think → act cycle</strong>.
        Previous turns stay visible — context <em>accumulates</em>. The LLM sees the whole trace
        each call. <strong>Simple scenarios complete in 2-3 turns</strong>; <strong>research chains
        require 4+</strong>; <strong>some scenarios end in graceful failure</strong> where the
        agent recognizes its limits and reports honestly. <strong>The capability is the loop, not the
        model</strong>: each individual LLM call is short; the iteration is what gives the agent its
        power. This is the foundation Ch 28 will build on.
      </div>
    </div>
  );
}
