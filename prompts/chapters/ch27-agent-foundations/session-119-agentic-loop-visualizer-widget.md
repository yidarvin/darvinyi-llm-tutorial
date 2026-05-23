# Session 119 — Agentic loop visualizer marquee widget

> The marquee Chapter 27 widget. **An interactive step-through of a ReAct agent's loop.** Reader picks one of **four preset scenarios** — a simple multi-step lookup (weather + date), a computation with self-verification (compound interest), a research chain (Bhutan population density), and a failure case (agent recognizes its limits). Step controls (prev / next / restart / play) advance through the agent's turns one at a time; each turn shows a Thought, an Action, and an Observation in distinct visual blocks; previous turns remain visible (faded) so the reader sees context accumulating. A **small loop diagram** in the corner shows where the current turn sits in the canonical observe → think → act cycle. **The widget that makes the loop the protagonist** — and bridges Ch 27 (conceptual) toward Ch 28 (engineering).

---

## Read first (in this order)

1. **`research/ch27-agent-foundations/research.md`** — concepts 2 (agentic loop) and 3 (ReAct) are the source material
2. **`prompts/chapters/ch27-agent-foundations/session-118-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch26-evaluation/session-117-llm-judge-bias-demo-and-exercises-and-closeout.md`** — for the recent secondary widget conventions (scenario-picker + accumulating context)
4. **`prompts/chapters/ch24-safety/session-108-jailbreak-taxonomy-widget.md`** — for the preset-driven Phase 14+ widget pattern

---

## Goal

Replace the `<WidgetFrame title="Agentic loop visualizer">` placeholder in section 3 with a working interactive widget that:

- Shows a **picker over 4 curated scenarios**, each with a multi-turn ReAct trace (2-4 turns)
- For the active scenario, shows:
  - The **task** at the top
  - **Step controls**: prev, next, restart, play/pause; current step indicator ("Step 2 of 4")
  - A **mini loop diagram** showing observe → think → act positions, with the current step highlighted
  - The **accumulating turn history** — each turn shows Thought / Action / Observation blocks; turns up to the current step are visible; the current step is highlighted
  - A **task status indicator** — running, completed, failed
- Provides a **pedagogical caption** explaining what the reader is seeing

**End state:** section 3 of Chapter 27 has a working marquee widget. After 60 seconds of interaction (stepping through 2-3 scenarios), the reader should be able to articulate: (a) **the agentic loop is iteration** — multiple turns of thought-action-observation accumulating context; (b) **the LLM is one component, not the whole agent** — the loop, tools, and termination logic matter as much; (c) **scenarios differ** — some agents complete in 2 turns; some require 4-5; some recognize they can't complete; (d) **the trace is inspectable** — every decision visible, every observation grounded.

---

## Inputs

State of the repo after session 118:

- `src/pages/ch27-agent-foundations/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 6)
- `src/lib/chapters.ts` has Ch 27 as `'draft'`
- No `src/components/widgets/ch27-agent-foundations/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch27-agent-foundations/AgenticLoopVisualizer.tsx` — the React widget
2. **Create** `src/components/widgets/ch27-agent-foundations/AgenticLoopVisualizer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch27-agent-foundations/loop-data.ts` — 4 curated scenarios with multi-turn ReAct traces
4. **Update** `src/components/widgets/index.ts` — add `AgenticLoopVisualizer` export
5. **Update** `src/pages/ch27-agent-foundations/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<AgenticLoopVisualizer client:visible />`

---

## Detailed spec

### 1. `loop-data.ts`

```ts
// src/components/widgets/ch27-agent-foundations/loop-data.ts

/**
 * Four curated ReAct agent scenarios for the loop visualizer.
 *
 * Each scenario is a multi-turn trace: task → (thought, action, observation)*
 * → final_answer. The traces are hand-curated to be realistic-feeling without
 * being reproductions of any specific real-world agent log.
 *
 * Categories chosen to span the spectrum:
 *  - simple: straightforward multi-step (weather + date)
 *  - computation: with self-verification (compound interest)
 *  - research: chained lookups (Bhutan population density)
 *  - failure: agent recognizes it can't complete (best friend birthday)
 */

export type ScenarioCategory = 'simple' | 'computation' | 'research' | 'failure';

export interface AgentTurn {
  /** Number of turn (1-indexed). */
  turn: number;
  /** The agent's reasoning before acting. */
  thought: string;
  /** The action — tool call OR final_answer(...). */
  action: string;
  /** The observation returned after the action. null if final_answer. */
  observation: string | null;
  /** True if this is the final turn of the trace. */
  isFinal: boolean;
}

export interface AgentScenario {
  id: string;
  label: string;
  category: ScenarioCategory;
  task: string;
  /** Plain-prose note about what the scenario teaches. */
  note: string;
  turns: AgentTurn[];
  /** Outcome at end of trace: completed (success), failed (gave up). */
  outcome: 'completed' | 'failed';
  /** Final answer text if completed. */
  finalAnswer: string;
}

export const SCENARIOS: AgentScenario[] = [
  {
    id: 'weather-date',
    label: 'Simple multi-step',
    category: 'simple',
    task: "What's the weather in Tokyo, and what date is it today?",
    note: 'A typical 3-turn task: one lookup, one lookup, final answer. The agent chains two independent tool calls and combines results. This is the most common pattern in production.',
    turns: [
      {
        turn: 1,
        thought: 'I need two pieces of information: the weather in Tokyo and today\'s date. Let me start with the weather.',
        action: 'weather_lookup(city="Tokyo")',
        observation: '18°C, partly cloudy',
        isFinal: false,
      },
      {
        turn: 2,
        thought: 'Good. Now I need today\'s date for context.',
        action: 'get_current_date()',
        observation: '2025-05-22',
        isFinal: false,
      },
      {
        turn: 3,
        thought: 'I have both pieces of information. Time to finalize the answer.',
        action: 'final_answer("Today (May 22, 2025) in Tokyo: 18°C, partly cloudy.")',
        observation: null,
        isFinal: true,
      },
    ],
    outcome: 'completed',
    finalAnswer: 'Today (May 22, 2025) in Tokyo: 18°C, partly cloudy.',
  },
  {
    id: 'compound-interest',
    label: 'Computation with verification',
    category: 'computation',
    task: 'If I deposit $5000 at 4.5% APR for 7 years, how much do I have at the end? Compute both annual and monthly compounding.',
    note: 'A 4-turn task where the agent does the same calculation two ways and reports both. The agent\'s reasoning shows why it\'s doing each step. Compounding frequency makes a meaningful difference — the agent surfaces it.',
    turns: [
      {
        turn: 1,
        thought: 'The compound interest formula is A = P(1 + r/n)^(n*t). For annual compounding, n = 1, so A = 5000 * (1.045)^7.',
        action: 'calculator("5000 * (1 + 0.045)**7")',
        observation: '6802.4533...',
        isFinal: false,
      },
      {
        turn: 2,
        thought: 'Annual compounding gives ~$6,802.45. Now monthly compounding: n = 12, so A = 5000 * (1 + 0.045/12)^(12*7).',
        action: 'calculator("5000 * (1 + 0.045/12)**(12*7)")',
        observation: '6852.0987...',
        isFinal: false,
      },
      {
        turn: 3,
        thought: 'Monthly compounding gives ~$6,852.10. The difference is about $49.65 — monthly compounding earns slightly more. Time to report both.',
        action: 'final_answer("After 7 years at 4.5% APR: $6,802.45 (annual compounding) or $6,852.10 (monthly compounding). Monthly earns ~$49.65 more.")',
        observation: null,
        isFinal: true,
      },
    ],
    outcome: 'completed',
    finalAnswer: 'After 7 years at 4.5% APR: $6,802.45 (annual compounding) or $6,852.10 (monthly compounding). Monthly earns ~$49.65 more.',
  },
  {
    id: 'bhutan-density',
    label: 'Research chain',
    category: 'research',
    task: 'What is the population density of Bhutan in people per square kilometer?',
    note: 'A 4-turn chain: look up population, look up area, divide, finalize. Each tool call depends on the previous. This is the classic "chained research" pattern — common for product lookups, data analysis, and any multi-source question.',
    turns: [
      {
        turn: 1,
        thought: 'I need two numbers: Bhutan\'s population and its area. Let me look up the population first.',
        action: 'web_search("population of Bhutan 2024")',
        observation: 'Approximately 787,000 (2024 estimate, World Bank)',
        isFinal: false,
      },
      {
        turn: 2,
        thought: 'Good. Now I need the area in square kilometers.',
        action: 'web_search("area of Bhutan in square kilometers")',
        observation: '38,394 km² (Wikipedia, World Atlas)',
        isFinal: false,
      },
      {
        turn: 3,
        thought: 'I have both numbers. Density = population / area = 787000 / 38394.',
        action: 'calculator("787000 / 38394")',
        observation: '20.4978...',
        isFinal: false,
      },
      {
        turn: 4,
        thought: 'About 20.5 people per square kilometer — Bhutan is sparsely populated. Time to report.',
        action: 'final_answer("Bhutan has a population density of approximately 20.5 people per square kilometer (population ~787k / area 38,394 km²).")',
        observation: null,
        isFinal: true,
      },
    ],
    outcome: 'completed',
    finalAnswer: 'Bhutan has a population density of approximately 20.5 people per square kilometer (population ~787k / area 38,394 km²).',
  },
  {
    id: 'friend-birthday-failure',
    label: 'Agent recognizes limits',
    category: 'failure',
    task: "What's my best friend's birthday?",
    note: 'A 2-turn case where the agent recognizes it can\'t answer with the tools available. This is the "graceful failure" pattern — the agent reaches a final answer that honestly states the limitation. The alternative (hallucinating a birthday) is far worse.',
    turns: [
      {
        turn: 1,
        thought: 'I don\'t have personal information about the user\'s friends. Let me check if there\'s a memory tool that might know.',
        action: 'memory_lookup(query="best friend birthday")',
        observation: 'No matching memory found.',
        isFinal: false,
      },
      {
        turn: 2,
        thought: 'No tool can answer this without personal information I don\'t have access to. The honest answer is to say so — fabricating a date would be much worse than admitting I don\'t know.',
        action: "final_answer(\"I don\\'t have access to personal information about your best friend. You could store that information in your profile, or share it with me directly so I can remember it for future questions.\")",
        observation: null,
        isFinal: true,
      },
    ],
    outcome: 'failed',
    finalAnswer: "I don't have access to personal information about your best friend. You could store that information in your profile, or share it with me directly so I can remember it for future questions.",
  },
];

/** Category metadata for color coding. */
export const CATEGORIES: Record<ScenarioCategory, { label: string; color: string }> = {
  simple:      { label: 'simple',           color: 'var(--cyan-400)' },
  computation: { label: 'computation',      color: 'var(--amber-400)' },
  research:    { label: 'research chain',   color: 'var(--violet-400)' },
  failure:     { label: 'graceful failure', color: 'var(--rose-400)' },
};

/** Phase of the loop the current step is in. */
export type LoopPhase = 'think' | 'act' | 'observe';

/**
 * Each "step" in the visualizer reveals one piece of a turn.
 * A turn with an observation = 3 steps (think, act, observe).
 * A final turn (no observation) = 2 steps (think, act/final_answer).
 */
export interface RevealStep {
  turnIndex: number;
  phase: LoopPhase;
}

/** Build the ordered list of steps for a scenario. */
export function buildSteps(scenario: AgentScenario): RevealStep[] {
  const steps: RevealStep[] = [];
  scenario.turns.forEach((turn, i) => {
    steps.push({ turnIndex: i, phase: 'think' });
    steps.push({ turnIndex: i, phase: 'act' });
    if (turn.observation !== null) {
      steps.push({ turnIndex: i, phase: 'observe' });
    }
  });
  return steps;
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 900

┌────────────────────────────────────────────────────────────────┐
│ Agentic loop visualizer                                          │
│ 4 scenarios · step through ReAct traces turn by turn             │
│                                                                  │
│ Pick a scenario:                                                 │
│  [ Simple multi-step ] [ Computation with verification ]        │
│  [ Research chain ] [ Agent recognizes limits ]                  │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ SIMPLE MULTI-STEP                              simple        │ │
│ │                                                                │ │
│ │ Task:                                                         │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │ What's the weather in Tokyo, and what date is it today? │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ Step 5 of 8     [ ◀ Prev ] [ ▶ Play ] [ Next ▶ ] [ Restart ] │ │
│ │                                                                │ │
│ │  Loop phase:    [Think]  [Act]  [Observe]                    │ │
│ │                            ^                                  │ │
│ │                          current                              │ │
│ │                                                                │ │
│ │ Accumulating turn history:                                    │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │ Turn 1                                                    │ │ │
│ │ │ 💭 Thought:     I need two pieces of information...      │ │ │
│ │ │ ⚡ Action:      weather_lookup(city="Tokyo")              │ │ │
│ │ │ 👁️  Observation: 18°C, partly cloudy                      │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │ Turn 2 (current)                                          │ │ │
│ │ │ 💭 Thought:     Good. Now I need today's date.            │ │ │
│ │ │ ⚡ Action:      get_current_date()                        │ │ │
│ │ │ ⏳ (observation will arrive next step)                    │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ Status: ▶ Running                                              │ │
│ │                                                                │ │
│ │ Scenario note: A typical 3-turn task — one lookup, one        │ │
│ │ lookup, final answer...                                       │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Pedagogical caption                                              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click scenario button → loads scenario; resets to step 0; clears accumulated turns
- Click Next → reveals one more step (the next phase of the current turn, or the first phase of the next turn)
- Click Prev → hides one step (rewinds)
- Click Play → auto-advance one step per ~1.5s; toggle to pause
- Click Restart → reset to step 0
- The mini loop diagram updates to show which phase of the loop the current step is in
- When the final step is reached, status flips to "Completed" or "Failed" based on outcome

**Visual encoding:**
- **Scenario buttons**: 4 buttons with left-border tinted by category color
- **Category badge** in detail panel: filled background tinted by category color
- **Task** displayed in monospace box
- **Step controls** as buttons; play toggles to pause
- **Mini loop diagram**: three pills (Think / Act / Observe) in a row; the active phase is highlighted in cyan with a downward arrow
- **Turn cards**: each turn rendered as a card with three rows (Thought / Action / Observation); rows are filled in as steps reveal; the current turn has a cyan left border; previous turns are slightly faded
- **Phase icons**: 💭 for Thought, ⚡ for Action, 👁️ for Observation
- **Status indicator**: cyan dot + "Running" while in progress; emerald "Completed" or rose "Failed" at end

### 3. `AgenticLoopVisualizer.tsx`

```tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  SCENARIOS, CATEGORIES, buildSteps,
  type AgentScenario, type LoopPhase, type RevealStep,
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
```

### 4. `AgenticLoopVisualizer.module.css`

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
.scenarioButtons { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; }
.scenarioButton {
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
.scenarioButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.scenarioButtonActive {
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
  letter-spacing: 0.06em;
}
.categoryBadge {
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

/* Task box */
.taskBox {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.84rem;
  padding: 0.6rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

/* Step bar */
.stepBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.stepCounter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.84rem;
  color: var(--text-secondary);
}
.stepCounter strong { color: var(--cyan-300); }
.stepButtons {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.stepButton {
  padding: 0.35rem 0.65rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.stepButton:hover:not(:disabled) {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.stepButton:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.stepButtonPlaying {
  background: color-mix(in srgb, var(--cyan-500) 14%, var(--bg-elevated));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}

/* Mini loop diagram */
.loopDiagram {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}
.loopLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.loopPills {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.loopPill {
  padding: 0.3rem 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  background: var(--bg-elevated);
  color: var(--text-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 999px;
  transition: all 200ms;
}
.loopPillActive {
  background: color-mix(in srgb, var(--cyan-500) 18%, var(--bg-elevated));
  border-color: var(--cyan-400);
  color: var(--cyan-300);
  font-weight: 600;
}

/* Turn cards */
.emptyState {
  padding: 1.1rem 0.9rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.84rem;
  background: var(--bg-primary);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  text-align: center;
}
.emptyState strong { color: var(--cyan-300); }

.turnCard {
  padding: 0.65rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--border-default);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
  opacity: 0.78;
  transition: all 200ms;
}
.turnCardCurrent {
  border-left-color: var(--cyan-400);
  opacity: 1;
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-primary));
}
.turnHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.currentBadge {
  font-size: 0.62rem;
  padding: 0.05rem 0.35rem;
  background: color-mix(in srgb, var(--cyan-400) 20%, transparent);
  color: var(--cyan-300);
  border: 1px solid color-mix(in srgb, var(--cyan-400) 50%, transparent);
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}
.finalBadge {
  font-size: 0.62rem;
  padding: 0.05rem 0.35rem;
  background: color-mix(in srgb, var(--emerald-400) 20%, transparent);
  color: var(--emerald-400);
  border: 1px solid color-mix(in srgb, var(--emerald-400) 50%, transparent);
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}
.turnRow {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.82rem;
  padding: 0.2rem 0;
  line-height: 1.55;
}
.turnRowPending { opacity: 0.6; }
.turnIcon {
  font-size: 0.95rem;
  width: 1.2em;
  text-align: center;
}
.turnRowLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}
.turnRowText {
  color: var(--text-primary);
}
.turnRowText code {
  background: var(--bg-elevated);
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  border: 1px solid var(--border-subtle);
  font-size: 0.78rem;
}

/* Status */
.statusPanel {
  padding: 0.5rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  margin-bottom: 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.statusRunning {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--text-secondary);
}
.statusDot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cyan-400);
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.8); }
}
@media (prefers-reduced-motion: reduce) {
  .statusDot { animation: none; }
}
.statusCompleted { color: var(--emerald-400); font-weight: 600; }
.statusFailed { color: var(--rose-400); font-weight: 600; }

/* Note */
.notePanel {
  padding: 0.6rem 0.75rem;
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
.caption em { color: var(--text-primary); font-style: italic; }

@media (max-width: 720px) {
  .controlLabel { min-width: 0; padding-top: 0; }
  .controlRow { flex-direction: column; }
  .stepBar { flex-direction: column; align-items: flex-start; }
  .turnRow { grid-template-columns: auto 1fr; }
  .turnRowLabel { grid-column: 2; padding-top: 0.1rem; font-size: 0.66rem; }
  .turnRowText { grid-column: 2; }
  .turnIcon { grid-row: span 2; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as AgenticLoopVisualizer } from './ch27-agent-foundations/AgenticLoopVisualizer';
// Session 153 will add:
// export { default as AgentPatternCatalog } from './ch27-agent-foundations/AgentPatternCatalog';
```

### 6. Update `src/pages/ch27-agent-foundations/index.mdx`

**Edit A: Add widget import:**

```mdx
import { AgenticLoopVisualizer } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Agentic loop visualizer" caption="Four ReAct agent scenarios — simple multi-step, computation with verification, research chain, and graceful failure. Step controls (prev/next/play/restart) advance through each agent's turns one phase at a time (think → act → observe). Accumulated context stays visible; the current step is highlighted. A mini loop diagram shows the active phase. Demonstrates the chapter's central operational claim: the agentic loop is iteration — multiple turns of thought-action-observation accumulating context. The capability is the loop, not any single LLM call.">
  <AgenticLoopVisualizer client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 27** renders with the working widget. Section 6's placeholder still stubbed.
3. **Default state**: scenario 0 (Simple multi-step) selected; step = 0; empty state message displayed; status shows "Not started".
4. **Four scenario buttons**: Simple multi-step / Computation with verification / Research chain / Agent recognizes limits. Each has a left-border tint matching its category color.
5. **Category color coding**: simple (cyan), computation (amber), research (violet), failure (rose).
6. **Step controls**: Prev disabled at step 0; Next disabled when complete; Play toggles to Pause; Restart resets to 0.
7. **Mini loop diagram**: three pills (Think / Act / Observe); the pill matching the current step is highlighted in cyan; no pill active at step 0 or when complete.
8. **Turn cards**: each turn renders only the rows revealed so far; current turn has cyan left border and full opacity; previous turns are slightly faded.
9. **Pending observation**: when Action has fired but Observation hasn't, show a "⏳ (arrives next step)" placeholder — except for final turns (no observation expected).
10. **Final turn badge**: when the final turn's Action is revealed (e.g., `final_answer(...)`), show a small "FINAL" badge.
11. **Status indicator**: cyan pulsing dot + "Running" during; emerald "✓ Completed" or rose "⚠ Failed (graceful)" at end.
12. **Play mode**: toggles to advance one step every ~1.5s; auto-stops at completion; disabled when complete.
13. **All 4 scenarios cycle correctly**: scenario change resets state to step 0; play does not carry over.
14. **Reduced-motion preference**: pulse animation disabled when `prefers-reduced-motion: reduce`.
15. **Mobile** (< 720px): controls and rows wrap; turn cards stack icon over labels; remains legible.
16. **`npm run typecheck`** passes.
17. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not call a real LLM.** All scenarios use hardcoded turn data.
- ❌ **Do not allow user-typed tasks.** Four fixed scenarios.
- ❌ **Do not animate dramatic transitions** beyond the pulsing status dot and brief 200ms hover transitions.
- ❌ **Do not implement an interactive loop diagram** (e.g., clickable phase pills). The pills are display-only.
- ❌ **Do not flip Ch 27's status.** Session 153 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch27-agent-foundations/ src/components/widgets/index.ts src/pages/ch27-agent-foundations/index.mdx
git commit -m "session 119: agentic loop visualizer marquee — step-through ReAct traces across 4 scenarios"
git push origin main
```

---

## Notes for the session author

**On the 4 scenarios spanning the agentic spectrum:**

| Scenario | Turns | Teaches |
|----------|-------|---------|
| Simple multi-step | 3 | The common case: two lookups + final answer |
| Computation with verification | 3 | Self-verification — agent does the calculation two ways |
| Research chain | 4 | Chained dependencies — each tool call depends on the previous |
| **Agent recognizes limits** | 2 | Graceful failure — agent honestly reports its limitation |

Notes-for-author: "**The 4 scenarios are deliberately diverse.** Simple shows the common 3-turn case. Computation shows verification. Research shows chaining. **Failure shows what production looks like when the agent can't complete a task** — graceful failure is far better than hallucination, and the widget teaches this without preaching it."

**On the step-by-step reveal pattern being the central teaching:**
Reader advances one phase at a time (Think → Act → Observe → Think → Act → Observe → ...). **The accumulation of context is visible.** Notes-for-author: "**The reveal pattern is the chapter's central teaching made interactive.** At any step the reader sees the same context the LLM would see in its next call. **The agent is not a black box** — every decision is inspectable."

**On the mini loop diagram reinforcing the canonical pattern:**
Three pills (Think / Act / Observe) cycle as the reader steps through. **Reinforces the canonical observe → think → act → observe shape** from section 2's ASCII diagram. Notes-for-author: "**The loop diagram is small but present.** Reader's eye returns to it; it anchors the iteration concept."

**On graceful failure as a deliberate teaching moment:**
Scenario 4 (best friend's birthday) ends without a successful tool call — but the agent reports honestly. Notes-for-author: "**The failure scenario is the chapter's most counterintuitive teaching**: an agent that recognizes its limits is *better* than one that always tries to answer. Hallucinated outputs would be worse than honest 'I don't know.' **Production agents need this pattern.**"

**On category color coding echoing curriculum conventions:**
- **Cyan** (simple) — foundational, correct
- **Amber** (computation) — intermediate, requires verification
- **Violet** (research) — sophisticated, multi-step chaining
- **Rose** (graceful failure) — high-stakes outcome

Notes-for-author: "**Color codes carry meaning carried across the curriculum.** Reader recognizes the family of categories from earlier chapters."

**On the play mode being throttled (1500ms per step):**
The auto-play advances one step every ~1.5 seconds. **Slow enough to read each block; fast enough to feel like progress.** Notes-for-author: "**Default play speed should let readers absorb each block without rushing.** Stepping manually is the primary mode; play is the demo mode for first-time viewers."

**On the pending-observation placeholder bridging Think and Observe:**
When the agent has called a tool but the observation hasn't arrived yet, show "⏳ (arrives next step)". **Reinforces that observations come from tool execution, not LLM imagination.** Notes-for-author: "**The ⏳ placeholder teaches a subtle but important point**: the LLM doesn't generate observations; tools do. **Hallucinated tool outputs** (an anti-pattern in section 6 of the chapter) become a recognizable failure mode after this widget."

**On the FINAL badge appearing on the agent's last action:**
When the agent calls `final_answer(...)`, the turn gets a "FINAL" badge in emerald (or rose if failure). **Reinforces explicit termination.** Notes-for-author: "**Explicit termination is one of section 2's teaching beats.** The widget makes it visible — reader sees that the loop ends because the agent chose to end it, not because it ran out of steps."

**On accessibility (prefers-reduced-motion):**
The pulsing status dot honors `prefers-reduced-motion: reduce`. **No required-but-unstoppable motion in the widget.**

**Pedagogical claim this widget supports:**
"An agent is an LLM acting as a controller in a loop with an environment. **Each turn is an observe → think → act cycle**; context accumulates across turns; the LLM sees the whole trace each call. **Simple tasks complete in 2-3 turns; research chains require 4+; some scenarios end in graceful failure** where the agent recognizes its limits and reports honestly. **The capability is the loop, not the model** — each individual LLM call is short; the iteration is what gives the agent its power. **This is the foundation Ch 28 will build on.**"

After 60 seconds of interaction (stepping through 2-3 scenarios), the reader has internalized: (a) the loop structure (observe → think → act); (b) the accumulation of context; (c) the diversity of agent traces (simple / verifying / chained / graceful failure); (d) the inspectability of agent decisions.

**This is Ch 27's central visualization.** Build with care.
