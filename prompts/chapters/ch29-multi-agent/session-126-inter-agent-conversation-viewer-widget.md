# Session 126 — Inter-agent conversation viewer marquee widget

> The second marquee Chapter 29 widget. **An interactive step-through of multi-agent conversations** across **four scenarios**: a proposer-critic-judge solving a reasoning task (catches Sydney → Canberra), a manager-worker decomposing a research task (Bhutan population density), a plan-execute-verify pattern on a coding task (Fibonacci function), and a **degenerate scenario** with three redundant reviewers — the chapter's central anti-pattern made concrete. Reader steps through messages turn by turn with prev/next/play controls; each message shows sender, recipient, content, and the agent's role color; the agent list shows who's active. **The degenerate scenario is the most important one** — it shows what multi-agent failure actually looks like (3 agents producing identical outputs because roles overlap; wasted LLM calls; no consensus mechanism). **The widget that teaches what well-designed multi-agent looks like by showing both well-designed AND degenerate cases side-by-side.**

---

## Read first (in this order)

1. **`research/ch29-multi-agent/research.md`** — concepts 3 (communication patterns), 4 (role specialization), and 7 (when NOT to use multi-agent) are the source material
2. **`prompts/chapters/ch29-multi-agent/session-124-page-structure.md`** — for the section-4 widget placeholder this session fills
3. **`prompts/chapters/ch29-multi-agent/session-125-multi-agent-topology-explorer-widget.md`** — for the first Ch 29 widget conventions
4. **`prompts/chapters/ch27-agent-foundations/session-119-agentic-loop-visualizer-widget.md`** — for the step-through visualization pattern this widget extends to multi-agent

---

## Goal

Replace the `<WidgetFrame title="Inter-agent conversation viewer">` placeholder in section 4 with a working interactive widget that:

- Shows a **picker over 4 curated scenarios**: proposer-critic-judge, manager-worker, plan-execute-verify, and a **degenerate scenario** (3 redundant reviewers)
- For the active scenario, shows:
  - The **task** at the top
  - The **agent list** (cards showing each agent's name + role + color)
  - **Step controls**: prev, next, restart, play/pause; current step indicator ("Step 4 of 7")
  - The **accumulating message timeline** — each message rendered as a card with sender → recipient indicator, content, and agent color
  - The **current message highlighted**
  - A **status indicator** (running / completed / failed)
- Provides a **scenario note** explaining what each scenario teaches
- A **pedagogical caption** below explaining the central calibration claim

**End state:** section 4 of Chapter 29 has a working marquee widget. After 90 seconds of interaction (stepping through 2-3 scenarios), the reader should be able to: (a) **distinguish good vs degenerate multi-agent** by message-flow patterns; (b) **articulate why proposer-critic-judge improves quality** (separate critique role catches errors); (c) **recognize the degenerate-reviewer anti-pattern** (multiple agents with identical roles producing redundant output); (d) **see what message-passing communication actually looks like** in production traces.

---

## Inputs

State of the repo after session 125:

- Section 2's `MultiAgentTopologyExplorer` marquee 1 is wired
- Section 4's widget placeholder is still stubbed
- `src/lib/chapters.ts` has Ch 29 as `'draft'`
- `src/components/widgets/ch29-multi-agent/` exists with `MultiAgentTopologyExplorer` already

---

## Deliverables

1. **Create** `src/components/widgets/ch29-multi-agent/InterAgentConversationViewer.tsx` — the React widget
2. **Create** `src/components/widgets/ch29-multi-agent/InterAgentConversationViewer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch29-multi-agent/conversation-data.ts` — 4 curated scenarios with multi-turn message traces
4. **Update** `src/components/widgets/index.ts` — add `InterAgentConversationViewer` export
5. **Update** `src/pages/ch29-multi-agent/index.mdx` — replace section-4's `<WidgetFrame>` interior with `<InterAgentConversationViewer client:visible />`

---

## Detailed spec

### 1. `conversation-data.ts`

```ts
// src/components/widgets/ch29-multi-agent/conversation-data.ts

/**
 * Four multi-agent conversation scenarios for the viewer widget.
 *
 * Three demonstrate well-designed multi-agent patterns; the fourth is
 * deliberately degenerate to teach the most common multi-agent anti-pattern
 * (overlapping roles producing redundant output).
 */

export type AgentRole =
  | 'user'
  | 'proposer'
  | 'critic'
  | 'judge'
  | 'manager'
  | 'researcher'
  | 'calculator'
  | 'planner'
  | 'executor'
  | 'verifier'
  | 'reviewer';

export type ScenarioCategory = 'proposer-critic-judge' | 'manager-worker' | 'plan-execute-verify' | 'degenerate';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  /** Color CSS var name. */
  color: string;
  /** Single-character symbol for the agent badge. */
  symbol: string;
}

export interface Message {
  step: number;
  from: string;    // agent id
  to: string;      // agent id
  content: string;
  /** Optional emphasis note shown below the message. */
  note?: string;
  /** Mark as showing a problem/anti-pattern. */
  problematic?: boolean;
}

export interface ConversationScenario {
  id: string;
  label: string;
  category: ScenarioCategory;
  task: string;
  agents: Agent[];
  messages: Message[];
  outcome: 'completed' | 'failed' | 'completed-with-warnings';
  /** Final answer or failure mode summary. */
  finalAnswer: string;
  /** Plain-prose note about what this scenario teaches. */
  note: string;
  /** Insights — observations the reader should leave with. */
  insights: string[];
}


export const SCENARIOS: ConversationScenario[] = [
  {
    id: 'proposer-critic-judge',
    label: 'Proposer-critic-judge',
    category: 'proposer-critic-judge',
    task: 'What is the capital of Australia?',
    agents: [
      { id: 'user',     name: 'User',     role: 'user',     color: 'var(--text-secondary)', symbol: 'U' },
      { id: 'proposer', name: 'Proposer', role: 'proposer', color: 'var(--cyan-400)',       symbol: 'P' },
      { id: 'critic',   name: 'Critic',   role: 'critic',   color: 'var(--rose-400)',       symbol: 'C' },
      { id: 'judge',    name: 'Judge',    role: 'judge',    color: 'var(--amber-400)',      symbol: 'J' },
    ],
    messages: [
      { step: 1, from: 'user', to: 'proposer',
        content: 'What is the capital of Australia?' },
      { step: 2, from: 'proposer', to: 'critic',
        content: 'The capital of Australia is Sydney.',
        problematic: true,
        note: 'Confidently wrong — Sydney is the largest city, but Canberra is the capital.' },
      { step: 3, from: 'critic', to: 'judge',
        content: 'Incorrect. Sydney is the largest city in Australia, but Canberra is the federal capital, located in the Australian Capital Territory.',
        note: 'Critic catches the error and explains why.' },
      { step: 4, from: 'judge', to: 'proposer',
        content: 'Reconsider. The critic\'s correction is supported by standard reference material.',
        note: 'Judge accepts the critique and asks for revision.' },
      { step: 5, from: 'proposer', to: 'judge',
        content: 'Revised: The capital of Australia is Canberra.' },
      { step: 6, from: 'judge', to: 'user',
        content: 'Final answer: Canberra is the capital of Australia (Sydney is the largest city, but not the capital).',
        note: 'Judge produces the final answer combining proposer\'s revision and critic\'s context.' },
    ],
    outcome: 'completed',
    finalAnswer: 'Canberra is the capital of Australia (Sydney is the largest city, but not the capital).',
    note: 'Proposer-critic-judge in action. The proposer was wrong initially; the critic caught the error; the judge arbitrated. Each role has a distinct cognitive task — generate, evaluate, arbitrate. Du et al. 2023 showed measurable accuracy gains from this pattern on hard reasoning tasks. **The key insight: LLMs are often better critics than generators.**',
    insights: [
      'Three distinct roles: generate, evaluate, arbitrate',
      'The critic caught what the proposer missed',
      'Cost: 3× single-agent — earned by quality gain on tasks where the LLM is unreliable as a generator',
      'Production use: code review (proposer = coder, critic = reviewer, judge = tech lead), hard reasoning tasks',
    ],
  },
  {
    id: 'manager-worker',
    label: 'Manager-worker',
    category: 'manager-worker',
    task: "What's the population density of Bhutan?",
    agents: [
      { id: 'user',         name: 'User',         role: 'user',        color: 'var(--text-secondary)', symbol: 'U' },
      { id: 'manager',      name: 'Manager',      role: 'manager',     color: 'var(--cyan-400)',       symbol: 'M' },
      { id: 'researcher_a', name: 'Researcher A', role: 'researcher',  color: 'var(--violet-400)',     symbol: 'R₁' },
      { id: 'researcher_b', name: 'Researcher B', role: 'researcher',  color: 'var(--violet-400)',     symbol: 'R₂' },
      { id: 'calculator',   name: 'Calculator',   role: 'calculator',  color: 'var(--amber-400)',      symbol: '∑' },
    ],
    messages: [
      { step: 1, from: 'user', to: 'manager',
        content: "What's the population density of Bhutan?" },
      { step: 2, from: 'manager', to: 'researcher_a',
        content: 'Look up the population of Bhutan (2024).',
        note: 'Manager decomposes — task A goes to one researcher.' },
      { step: 3, from: 'manager', to: 'researcher_b',
        content: 'Look up the area of Bhutan in square kilometers.',
        note: 'Manager decomposes — task B goes to another researcher (parallel).' },
      { step: 4, from: 'researcher_a', to: 'manager',
        content: 'Bhutan\'s population is approximately 787,000 (2024 estimate, World Bank).' },
      { step: 5, from: 'researcher_b', to: 'manager',
        content: 'Bhutan\'s area is 38,394 km² (CIA World Factbook).' },
      { step: 6, from: 'manager', to: 'calculator',
        content: 'Compute 787000 / 38394.',
        note: 'Manager assembles the data; calculator does the arithmetic.' },
      { step: 7, from: 'calculator', to: 'manager',
        content: '20.4978 (≈ 20.5)' },
      { step: 8, from: 'manager', to: 'user',
        content: 'Bhutan has a population density of approximately 20.5 people per square kilometer (population ~787k / area 38,394 km²).',
        note: 'Manager aggregates results into a final answer.' },
    ],
    outcome: 'completed',
    finalAnswer: 'Bhutan has a population density of approximately 20.5 people per square kilometer.',
    note: 'Manager-worker decomposition. The manager assigned subtasks to specialized workers, collected their results, and synthesized a final answer. Workers communicated only with the manager (hub-and-spoke). **Could this be a single agent? Yes — and for this task, probably should be.** This scenario shows the pattern; section 7 of the chapter argues it\'s often unnecessary.',
    insights: [
      'Manager decomposes; workers execute; manager aggregates',
      'Hub-and-spoke communication — workers only talk to the manager',
      'Total: 4 agents, 8 messages, several LLM calls',
      'Same task with single-agent ReAct: ~3 turns, fewer messages, comparable quality',
      'Multi-agent earns its keep when decomposition is genuinely the value-add',
    ],
  },
  {
    id: 'plan-execute-verify',
    label: 'Plan-execute-verify',
    category: 'plan-execute-verify',
    task: 'Write a Python function that returns the nth Fibonacci number.',
    agents: [
      { id: 'user',     name: 'User',     role: 'user',      color: 'var(--text-secondary)', symbol: 'U' },
      { id: 'planner',  name: 'Planner',  role: 'planner',   color: 'var(--cyan-400)',       symbol: 'P' },
      { id: 'executor', name: 'Executor', role: 'executor',  color: 'var(--violet-400)',     symbol: 'E' },
      { id: 'verifier', name: 'Verifier', role: 'verifier',  color: 'var(--amber-400)',      symbol: 'V' },
    ],
    messages: [
      { step: 1, from: 'user', to: 'planner',
        content: 'Write a Python function that returns the nth Fibonacci number.' },
      { step: 2, from: 'planner', to: 'executor',
        content: 'Plan: (1) Define fib(n). (2) Handle base cases n=0, n=1. (3) Use iterative loop to avoid O(2^n) recursion. (4) Return result.',
        note: 'Planner produces a step-by-step plan; executor follows it.' },
      { step: 3, from: 'executor', to: 'verifier',
        content: 'Implementation:\\n\\n```python\\ndef fib(n):\\n    if n <= 1:\\n        return n\\n    a, b = 0, 1\\n    for _ in range(n - 1):\\n        a, b = b, a + b\\n    return b\\n```',
        note: 'Executor implements per the plan; passes to verifier for review.' },
      { step: 4, from: 'verifier', to: 'executor',
        content: 'Tests: fib(0)=0 ✓, fib(1)=1 ✓, fib(5)=5 ✓, fib(10)=55 ✓. Implementation is O(n) time, O(1) space. Approved.',
        note: 'Verifier runs tests + checks complexity; gives approval.' },
      { step: 5, from: 'executor', to: 'user',
        content: 'Done. The function above implements iterative Fibonacci in O(n) time, O(1) space, with verified correctness on n=0..10.' },
    ],
    outcome: 'completed',
    finalAnswer: 'Iterative Fibonacci function in O(n) time, O(1) space, verified correct.',
    note: 'Plan-execute-verify pattern on a coding task. **Each role has a distinct cognitive demand**: planning (high-level decomposition), execution (concrete implementation), verification (testing + complexity analysis). The pattern reduces the chance of errors by separating concerns. Common in SWE-bench-style agent solutions.',
    insights: [
      'Three roles, three cognitive modes',
      'Planning before execution often prevents cascading errors',
      'Verification catches what execution missed',
      'Could a single agent do all three? Yes — Self-Refine (Madaan 2023) is the single-agent alternative',
      'Multi-agent shines when each role benefits from fresh context (no prior bias)',
    ],
  },
  {
    id: 'degenerate-reviewers',
    label: 'Degenerate (3 reviewers)',
    category: 'degenerate',
    task: 'Should we approve this pull request? (3 reviewers, all with the same prompt and tools.)',
    agents: [
      { id: 'user',        name: 'User',        role: 'user',      color: 'var(--text-secondary)', symbol: 'U' },
      { id: 'reviewer_1',  name: 'Reviewer 1',  role: 'reviewer',  color: 'var(--cyan-400)',       symbol: 'R₁' },
      { id: 'reviewer_2',  name: 'Reviewer 2',  role: 'reviewer',  color: 'var(--cyan-400)',       symbol: 'R₂' },
      { id: 'reviewer_3',  name: 'Reviewer 3',  role: 'reviewer',  color: 'var(--cyan-400)',       symbol: 'R₃' },
    ],
    messages: [
      { step: 1, from: 'user', to: 'reviewer_1',
        content: 'Should we approve this PR?' },
      { step: 2, from: 'user', to: 'reviewer_2',
        content: 'Should we approve this PR?' },
      { step: 3, from: 'user', to: 'reviewer_3',
        content: 'Should we approve this PR?' },
      { step: 4, from: 'reviewer_1', to: 'user',
        content: 'I reviewed the PR. The changes look reasonable. I see no issues. Approve.',
        problematic: true,
        note: 'Generic review — could be any reviewer.' },
      { step: 5, from: 'reviewer_2', to: 'user',
        content: 'I reviewed the PR. The changes look reasonable. I see no issues. Approve.',
        problematic: true,
        note: 'Identical output to Reviewer 1 — wasted LLM call.' },
      { step: 6, from: 'reviewer_3', to: 'user',
        content: 'I reviewed the PR. The changes look reasonable. I see no issues. Approve.',
        problematic: true,
        note: 'Identical output to both prior reviewers — third wasted call.' },
      { step: 7, from: 'user', to: 'user',
        content: '[System note] No consensus mechanism — 3 identical "approve" votes were produced. No new information. 3× cost for 1× quality. Multi-agent anti-pattern: agents with overlapping roles, no role differentiation, no judge to arbitrate.',
        problematic: true,
        note: 'The anti-pattern made visible. This is what most "I want multi-agent" instincts produce.' },
    ],
    outcome: 'failed',
    finalAnswer: 'Approved — but 3× the cost of a single reviewer for no quality gain.',
    note: '**The chapter\'s central anti-pattern made concrete.** Three reviewers with identical prompts and tools produce identical outputs. **No role differentiation, no judge, no consensus mechanism, no quality gain.** This is what happens when engineers reach for multi-agent without genuine role separation. The scenario isn\'t exaggerated — it\'s the most common multi-agent failure in the wild.',
    insights: [
      'Three "reviewers" with the same prompt — wasted complexity',
      '3× LLM cost for ~1× quality (the duplicates contribute no new signal)',
      'No judge, no consensus mechanism, no termination criteria',
      'The fix: one well-prompted reviewer agent, OR proposer-critic-judge with distinct roles',
      'This is the chapter\'s 80% — multi-agent designs that would work better as single-agent',
    ],
  },
];


/** Category color for buttons. */
export const CATEGORY_COLORS: Record<ScenarioCategory, string> = {
  'proposer-critic-judge': 'var(--emerald-400)',
  'manager-worker':        'var(--cyan-400)',
  'plan-execute-verify':   'var(--violet-400)',
  'degenerate':            'var(--rose-400)',
};
```

### 2. Visual layout

```
ViewBox: 0 0 800 940

┌────────────────────────────────────────────────────────────────┐
│ Inter-agent conversation viewer                                  │
│ 4 scenarios · step through multi-agent message flows             │
│                                                                  │
│ Pick a scenario:                                                 │
│  [ Proposer-critic-judge ] [ Manager-worker ]                    │
│  [ Plan-execute-verify ] [ Degenerate (3 reviewers) ]            │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ PROPOSER-CRITIC-JUDGE                  proposer-critic-judge │ │
│ │                                                                │ │
│ │ Task:                                                         │ │
│ │ "What is the capital of Australia?"                          │ │
│ │                                                                │ │
│ │ Agents:                                                        │ │
│ │  [U] User    [P] Proposer    [C] Critic    [J] Judge         │ │
│ │                                                                │ │
│ │ Step 3 of 6     [ ◀ Prev ] [ ▶ Play ] [ Next ▶ ] [ Restart ] │ │
│ │                                                                │ │
│ │ Message timeline (click for detail):                          │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │ Step 1: U → P                                            │ │ │
│ │ │ "What is the capital of Australia?"                      │ │ │
│ │ ├────────────────────────────────────────────────────────┤ │ │
│ │ │ Step 2: P → C                              ⚠ problematic │ │ │
│ │ │ "The capital of Australia is Sydney."                    │ │ │
│ │ │ ↳ Confidently wrong — Sydney is the largest city, but..│ │ │
│ │ ├────────────────────────────────────────────────────────┤ │ │
│ │ │ Step 3: C → J   ← CURRENT                                 │ │ │
│ │ │ "Incorrect. Sydney is the largest city in Australia,..." │ │ │
│ │ │ ↳ Critic catches the error and explains why.            │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ Status: ▶ Running                                              │ │
│ │                                                                │ │
│ │ Insights:                                                     │ │
│ │  • Three distinct roles: generate, evaluate, arbitrate        │ │
│ │  • The critic caught what the proposer missed                │ │
│ │  • Cost: 3× single-agent — earned by quality gain            │ │
│ │                                                                │ │
│ │ Scenario note: Proposer-critic-judge in action. The proposer │ │
│ │ was wrong initially; the critic caught the error...           │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Pedagogical caption                                              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click scenario button → loads scenario; resets step to 0; clears visible messages
- Click Next → reveals one more message
- Click Prev → hides one message (rewinds)
- Click Play → auto-advance one step per ~1.7s; toggle to pause
- Click Restart → reset to step 0

**Visual encoding:**
- **Scenario buttons**: 4 buttons; active in cyan; left-border tinted by category color
- **Category badge** in detail header
- **Agent list** at top: each agent rendered as a card with symbol badge + name + role
- **Step controls**: prev/play/next/restart; current step counter
- **Message timeline**: cards in order; current step highlighted with cyan border; problematic messages tinted rose; messages with notes show note text below
- **Sender → recipient indicator**: shows agent symbols with arrow ("U → P")
- **Status indicator**: cyan dot pulsing (running); emerald check (completed); rose ⚠ (failed)
- **Insights list**: bullets after status
- **Scenario note**: italic prose at bottom

### 3. `InterAgentConversationViewer.tsx`

```tsx
import { useState, useEffect, useRef } from 'react';
import {
  SCENARIOS, CATEGORY_COLORS,
  type ConversationScenario, type Message, type Agent,
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
  const currentMessage = step > 0 ? scenario.messages[step - 1] : null;

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

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Inter-agent conversation viewer</div>
        <div className={styles.titleSubLabel}>
          {SCENARIOS.length} scenarios · step through multi-agent message flows
        </div>
      </div>

      {/* Picker */}
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

      {/* Detail */}
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

        {/* Task */}
        <div className={styles.taskBox}>"{scenario.task}"</div>

        {/* Agents */}
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

        {/* Message timeline */}
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
                  <div className={styles.messageContent}>
                    {msg.content.split('\\n').map((line, li) => (
                      line.startsWith('```') ? null :
                      line.includes('```') ? (
                        <div key={li}>{line}</div>
                      ) : (
                        <div key={li}>{line}</div>
                      )
                    ))}
                  </div>
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

        {/* Status */}
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

        {/* Insights */}
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

        {/* Scenario note */}
        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Scenario note</div>
          <div className={styles.noteText}>{scenario.note}</div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Step through each scenario. <strong>Three well-designed patterns</strong> — proposer-critic-judge,
        manager-worker, plan-execute-verify — show how distinct roles produce real quality gains.
        <strong>The degenerate scenario</strong> (3 redundant reviewers) shows what happens when engineers
        reach for multi-agent without genuine role separation: <strong>3× LLM cost for 1× quality</strong>;
        no consensus mechanism; no termination criteria; identical outputs from agents that aren't really
        different. <strong>This is the chapter's 80%</strong> — most "I want multi-agent" instincts produce
        the degenerate pattern. <strong>Well-designed multi-agent separates concerns; degenerate multi-agent
        just multiplies them.</strong>
      </div>
    </div>
  );
}
```

### 4. `InterAgentConversationViewer.module.css`

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

/* Detail */
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

.taskBox {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.84rem;
  padding: 0.55rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  margin-bottom: 0.85rem;
  font-style: italic;
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

/* Agent badges */
.agentBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  font-weight: 700;
  flex-shrink: 0;
}
.agentBadgeSmall {
  width: 24px;
  height: 24px;
  font-size: 0.7rem;
  border-radius: 5px;
}

.agentList {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.agentCard {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.7rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.agentInfo {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.agentName {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-primary);
  font-weight: 500;
}
.agentRole {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: var(--text-tertiary);
  text-transform: lowercase;
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

/* Message timeline */
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

.messageTimeline {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.messageCard {
  padding: 0.6rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--border-default);
  border-radius: var(--radius-sm);
  transition: all 200ms;
}
.messageCardCurrent {
  border-left-color: var(--cyan-400);
  background: color-mix(in srgb, var(--cyan-500) 5%, var(--bg-primary));
}
.messageCardProblematic {
  border-left-color: var(--rose-400);
  background: color-mix(in srgb, var(--rose-400) 4%, var(--bg-primary));
}
.messageHeader {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  flex-wrap: wrap;
}
.messageStep {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.messageRoute {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.messageArrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 600;
}
.currentBadge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  padding: 0.05rem 0.4rem;
  background: color-mix(in srgb, var(--cyan-400) 20%, transparent);
  color: var(--cyan-300);
  border: 1px solid color-mix(in srgb, var(--cyan-400) 50%, transparent);
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}
.problematicBadge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  padding: 0.05rem 0.4rem;
  background: color-mix(in srgb, var(--rose-400) 18%, transparent);
  color: var(--rose-400);
  border: 1px solid color-mix(in srgb, var(--rose-400) 50%, transparent);
  border-radius: 2px;
  font-weight: 500;
}
.messageContent {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.5;
  white-space: pre-wrap;
}
.messageContent code, .messageContent pre {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-elevated);
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
}
.messageNote {
  margin-top: 0.45rem;
  padding: 0.4rem 0.55rem;
  background: color-mix(in srgb, var(--amber-400) 6%, transparent);
  border-left: 2px solid color-mix(in srgb, var(--amber-400) 50%, transparent);
  border-radius: 3px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.45;
  font-style: italic;
}
.messageNoteArrow {
  color: var(--amber-400);
  font-weight: 700;
  margin-right: 0.2rem;
}

/* Status */
.statusPanel {
  padding: 0.55rem 0.8rem;
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
.statusWarning { color: var(--amber-400); font-weight: 600; }
.statusFailed { color: var(--rose-400); font-weight: 600; }

/* Insights */
.insightList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.insightList li {
  font-size: 0.83rem;
  color: var(--text-primary);
  padding: 0.35rem 0.6rem 0.35rem 1.2rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  position: relative;
  line-height: 1.45;
}
.insightList li::before {
  content: '•';
  position: absolute;
  left: 0.55rem;
  color: var(--cyan-400);
  font-weight: 700;
}

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

@media (max-width: 720px) {
  .controlLabel { min-width: 0; padding-top: 0; }
  .controlRow { flex-direction: column; }
  .stepBar { flex-direction: column; align-items: flex-start; }
  .agentList { gap: 0.35rem; }
  .agentCard { padding: 0.3rem 0.5rem; }
  .agentName { font-size: 0.74rem; }
  .agentRole { font-size: 0.62rem; }
  .messageContent { font-size: 0.78rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as MultiAgentTopologyExplorer }     from './ch29-multi-agent/MultiAgentTopologyExplorer';
export { default as InterAgentConversationViewer }   from './ch29-multi-agent/InterAgentConversationViewer';
```

### 6. Update `src/pages/ch29-multi-agent/index.mdx`

**Edit A: Update widget import:**

```mdx
import { MultiAgentTopologyExplorer, InterAgentConversationViewer } from '@components/widgets';
```

**Edit B: Replace section-4's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Inter-agent conversation viewer" caption="Four multi-agent scenarios visualized as step-by-step message flows: proposer-critic-judge solving a reasoning task (catches Sydney → Canberra), manager-worker decomposing Bhutan population density, plan-execute-verify on a coding task, and a degenerate scenario with 3 redundant reviewers — the chapter's central anti-pattern. Reader advances message-by-message with prev/next/play controls. The degenerate scenario teaches what well-designed multi-agent isn't: 3× cost for 1× quality when roles overlap without genuine differentiation.">
  <InterAgentConversationViewer client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 4 of Ch 29** renders with the working widget. Section 2's marquee 1 still renders correctly.
3. **Default state**: scenario 0 (proposer-critic-judge) selected; step = 0; empty-state message in timeline; status shows "Not started".
4. **Four scenario buttons**: Proposer-critic-judge / Manager-worker / Plan-execute-verify / Degenerate (3 reviewers). Each has a left-border tint matching its category color.
5. **Category color coding**: proposer-critic-judge (emerald), manager-worker (cyan), plan-execute-verify (violet), degenerate (rose).
6. **Task box**: italicized monospace below detail header.
7. **Agent list**: each agent rendered as a card with colored symbol badge + name + role.
8. **Step controls**: Prev disabled at step 0; Next disabled when complete; Play toggles to Pause; Restart resets.
9. **Message timeline**: messages appear one at a time as reader advances; current message has cyan left border; problematic messages have rose left border + "⚠ problematic" badge.
10. **Sender → recipient indicator**: shows agent symbols with arrow in each message header.
11. **Message notes**: when present, shown below message content in amber-tinted italic.
12. **Status indicator**: cyan pulsing dot (running); emerald check + final answer (completed); rose warning (failed).
13. **Insights** appear when conversation is complete.
14. **Play mode**: auto-advance 1.7s per step; auto-stops at completion.
15. **All 4 scenarios cycle correctly**: scenario change resets step to 0.
16. **Degenerate scenario**: 3 reviewers visibly produce identical content; final step is a self-message system note explaining the anti-pattern; status flips to "failed" with anti-pattern label.
17. **Reduced-motion preference**: pulse animation disabled when `prefers-reduced-motion: reduce`.
18. **Mobile** (< 720px): agent cards compact; step controls wrap; messages remain legible.
19. **`npm run typecheck`** passes.
20. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not call a real LLM**. All scenarios use hardcoded message data.
- ❌ **Do not animate dramatic transitions** beyond the pulsing status dot and brief 200ms hover.
- ❌ **Do not implement an editable conversation**. Four fixed scenarios.
- ❌ **Do not flip Ch 29's status**. Session 165 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch29-multi-agent/ src/components/widgets/index.ts src/pages/ch29-multi-agent/index.mdx
git commit -m "session 126: inter-agent conversation viewer marquee 2 — 4 scenarios including a degenerate anti-pattern"
git push origin main
```

---

## Notes for the session author

**On the 4 scenarios spanning the chapter's argument**:

| Scenario | Teaches |
|----------|---------|
| **Proposer-critic-judge** | Adversarial role specialization done well (catches Sydney → Canberra) |
| **Manager-worker** | Task decomposition — useful but often unnecessary |
| **Plan-execute-verify** | Sequential role specialization on a coding task |
| **Degenerate (3 reviewers)** | The chapter's anti-pattern made concrete |

Notes-for-author: "**The 4 scenarios form an argument structure**: three well-designed patterns showing what multi-agent can do, then a degenerate scenario showing what most engineers actually produce. **The degenerate scenario is the chapter's central calibration claim made interactive.**"

**On the degenerate scenario being deliberately constructed**:
Three "reviewers" with identical prompts and tools produce identical outputs. The system-note final step explains the anti-pattern explicitly. Notes-for-author: "**The degenerate scenario isn't exaggerated** — it's the most common multi-agent failure in the wild. **Reader who steps through it once will recognize it in their own designs.** This is the widget's most important pedagogical contribution."

**On the Sydney → Canberra example in proposer-critic-judge**:
The proposer is confidently wrong (Sydney); the critic catches it (Canberra is the capital); the judge arbitrates. **This is a real LLM failure mode** — confidently wrong on widely-known facts. Notes-for-author: "**The example is chosen because LLMs do actually get this wrong sometimes** — even frontier models occasionally confuse 'largest city' with 'capital city.' The widget shows how proposer-critic-judge catches it."

**On the manager-worker scenario being honest about its limitations**:
The scenario note explicitly says "Could this be a single agent? Yes — and for this task, probably should be." Notes-for-author: "**Even the well-designed scenarios have honest framing in their notes.** The widget doesn't dismiss multi-agent; it gives readers an honest accounting."

**On the plan-execute-verify scenario showing real code**:
The executor's message includes an actual Python implementation of Fibonacci. **Realistic enough to feel like a real agent trace.** Notes-for-author: "**Use real code in the executor message**, not pseudocode. Reader sees what a plan-execute-verify trace actually looks like in production-style use."

**On the agent badges with single-character symbols**:
U / P / C / J / M / R₁ / R₂ / R₃ / etc. Notes-for-author: "**Single-character badges make message routes scannable.** Reader sees 'C → J' and immediately recognizes 'critic to judge' without re-reading agent names. **Reduces cognitive load for following the conversation.**"

**On the role colors reinforcing the topology widget**:
Same colors used in MultiAgentTopologyExplorer: cyan (manager/agent/proposer/planner), violet (worker/researcher/executor), rose (critic), amber (judge/calculator/verifier/tool), text-secondary (user). Notes-for-author: "**Color literacy carries across both Ch 29 widgets.** Reader who has seen the topology explorer recognizes the same role colors in the conversation viewer. **The two widgets share a visual vocabulary.**"

**On the "↳" note arrow being distinctive**:
Notes below messages start with "↳" in amber color, indicating "this is what to notice about this message." Notes-for-author: "**The notes are teaching annotations**, not part of the conversation. The ↳ arrow makes that distinction clear visually."

**On insights appearing only after completion**:
The insights list is hidden until the conversation is complete. Notes-for-author: "**Insights are the takeaway, not the journey.** Reader who completes a scenario gets the explicit teaching points. **Hiding insights until completion encourages stepping through the full conversation** rather than skimming."

**On the degenerate scenario's final self-message being the punchline**:
Step 7 is a `[System note]` message from user to user, explaining the anti-pattern. **The widget breaks its own narrative pattern to make the teaching explicit.** Notes-for-author: "**This is a deliberate stylistic choice**: the system note isn't part of the conversation; it's the widget speaking directly to the reader. **The fourth wall is broken because the lesson is that important.**"

**Pedagogical claim this widget supports:**
"Multi-agent conversations are message flows between specialized roles. **Well-designed patterns** — proposer-critic-judge, manager-worker, plan-execute-verify — show distinct roles producing real quality gains (catching errors, decomposing tasks, separating concerns). **Degenerate patterns** — agents with overlapping roles, no role differentiation, no consensus mechanism — produce 3× cost for 1× quality and are the most common multi-agent failure in the wild. **The chapter's calibration claim made concrete**: 80% of multi-agent designs are degenerate; 20% are genuinely well-designed. **Well-designed multi-agent separates concerns; degenerate multi-agent just multiplies them.**"

After 90 seconds of interaction (stepping through 2-3 scenarios), the reader has internalized: (a) what well-designed multi-agent looks like in message form; (b) the Sydney → Canberra failure mode that proposer-critic-judge catches; (c) the manager-worker pattern with its honest framing; (d) **the degenerate-reviewer anti-pattern they'll now recognize in their own designs.**

**This is Ch 29's second central visualization.** Build with care.
