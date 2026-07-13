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
    note: 'A 4-turn task where the agent does the same calculation two ways and reports both. The agent\'s reasoning shows why it\'s doing each step. Compounding frequency makes a meaningful difference, and the agent surfaces it.',
    turns: [
      {
        turn: 1,
        thought: 'The compound interest formula is A = P(1 + r/n)^(n*t). For annual compounding, n = 1, so A = 5000 * (1.045)^7.',
        action: 'calculator("5000 * (1 + 0.045)**7")',
        observation: '6804.3092...',
        isFinal: false,
      },
      {
        turn: 2,
        thought: 'Annual compounding gives ~$6,804.31. Now monthly compounding: n = 12, so A = 5000 * (1 + 0.045/12)^(12*7).',
        action: 'calculator("5000 * (1 + 0.045/12)**(12*7)")',
        observation: '6847.2613...',
        isFinal: false,
      },
      {
        turn: 3,
        thought: 'Monthly compounding gives ~$6,847.26. The difference is about $42.95; monthly compounding earns slightly more. Time to report both.',
        action: 'final_answer("After 7 years at 4.5% APR: $6,804.31 (annual compounding) or $6,847.26 (monthly compounding). Monthly earns ~$42.95 more.")',
        observation: null,
        isFinal: true,
      },
    ],
    outcome: 'completed',
    finalAnswer: 'After 7 years at 4.5% APR: $6,804.31 (annual compounding) or $6,847.26 (monthly compounding). Monthly earns ~$42.95 more.',
  },
  {
    id: 'bhutan-density',
    label: 'Research chain',
    category: 'research',
    task: 'What is the population density of Bhutan in people per square kilometer?',
    note: 'A 4-turn chain: look up population, look up area, divide, finalize. Each tool call depends on the previous. This is the classic "chained research" pattern, common for product lookups, data analysis, and any multi-source question.',
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
        observation: '20.4980...',
        isFinal: false,
      },
      {
        turn: 4,
        thought: 'About 20.5 people per square kilometer; Bhutan is sparsely populated. Time to report.',
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
    note: 'A 2-turn case where the agent recognizes it can\'t answer with the tools available. This is the "graceful failure" pattern: the agent reaches a final answer that honestly states the limitation. The alternative (hallucinating a birthday) is far worse.',
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
        thought: 'No tool can answer this without personal information I don\'t have access to. The honest answer is to say so; fabricating a date would be much worse than admitting I don\'t know.',
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
