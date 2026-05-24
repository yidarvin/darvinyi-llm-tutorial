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

export type ScenarioCategory =
  | 'proposer-critic-judge'
  | 'manager-worker'
  | 'plan-execute-verify'
  | 'degenerate';

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
        content: "Reconsider. The critic's correction is supported by standard reference material.",
        note: 'Judge accepts the critique and asks for revision.' },
      { step: 5, from: 'proposer', to: 'judge',
        content: 'Revised: The capital of Australia is Canberra.' },
      { step: 6, from: 'judge', to: 'user',
        content: 'Final answer: Canberra is the capital of Australia (Sydney is the largest city, but not the capital).',
        note: "Judge produces the final answer combining proposer's revision and critic's context." },
    ],
    outcome: 'completed',
    finalAnswer: 'Canberra is the capital of Australia (Sydney is the largest city, but not the capital).',
    note: 'Proposer-critic-judge in action. The proposer was wrong initially; the critic caught the error; the judge arbitrated. Each role has a distinct cognitive task — generate, evaluate, arbitrate. Du et al. 2023 showed measurable accuracy gains from this pattern on hard reasoning tasks. The key insight: LLMs are often better critics than generators.',
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
        content: "Bhutan's population is approximately 787,000 (2024 estimate, World Bank)." },
      { step: 5, from: 'researcher_b', to: 'manager',
        content: "Bhutan's area is 38,394 km² (CIA World Factbook)." },
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
    note: "Manager-worker decomposition. The manager assigned subtasks to specialized workers, collected their results, and synthesized a final answer. Workers communicated only with the manager (hub-and-spoke). Could this be a single agent? Yes — and for this task, probably should be. This scenario shows the pattern; section 7 of the chapter argues it's often unnecessary.",
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
        content: 'Implementation:\n\ndef fib(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(n - 1):\n        a, b = b, a + b\n    return b',
        note: 'Executor implements per the plan; passes to verifier for review.' },
      { step: 4, from: 'verifier', to: 'executor',
        content: 'Tests: fib(0)=0 ✓, fib(1)=1 ✓, fib(5)=5 ✓, fib(10)=55 ✓. Implementation is O(n) time, O(1) space. Approved.',
        note: 'Verifier runs tests + checks complexity; gives approval.' },
      { step: 5, from: 'executor', to: 'user',
        content: 'Done. The function above implements iterative Fibonacci in O(n) time, O(1) space, with verified correctness on n=0..10.' },
    ],
    outcome: 'completed',
    finalAnswer: 'Iterative Fibonacci function in O(n) time, O(1) space, verified correct.',
    note: 'Plan-execute-verify pattern on a coding task. Each role has a distinct cognitive demand: planning (high-level decomposition), execution (concrete implementation), verification (testing + complexity analysis). The pattern reduces the chance of errors by separating concerns. Common in SWE-bench-style agent solutions.',
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
    note: "The chapter's central anti-pattern made concrete. Three reviewers with identical prompts and tools produce identical outputs. No role differentiation, no judge, no consensus mechanism, no quality gain. This is what happens when engineers reach for multi-agent without genuine role separation. The scenario isn't exaggerated — it's the most common multi-agent failure in the wild.",
    insights: [
      'Three "reviewers" with the same prompt — wasted complexity',
      '3× LLM cost for ~1× quality (the duplicates contribute no new signal)',
      'No judge, no consensus mechanism, no termination criteria',
      'The fix: one well-prompted reviewer agent, OR proposer-critic-judge with distinct roles',
      "This is the chapter's 80% — multi-agent designs that would work better as single-agent",
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
