/**
 * Five common agent patterns with SVG diagram nodes/edges,
 * use cases, tradeoffs, and example tasks.
 *
 * Patterns ordered from simplest to most complex.
 */

export type PatternMaturity = 'production' | 'production-narrow' | 'experimental' | 'preview';

export interface DiagramNode {
  id: string;
  label: string;
  /** 0..1 normalized position in the diagram viewBox. */
  x: number;
  y: number;
  /** Visual role. */
  role: 'input' | 'agent' | 'tool' | 'memory' | 'output' | 'critic' | 'planner' | 'executor' | 'specialist';
}

export interface DiagramEdge {
  from: string;
  to: string;
  /** Optional label. */
  label?: string;
  /** Is this edge part of a loop? Rendered curved. */
  loop?: boolean;
}

export interface PatternDiagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface AgentPattern {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  diagram: PatternDiagram;
  useCases: string[];
  tradeoffs: { pros: string[]; cons: string[] };
  exampleTask: string;
  maturity: PatternMaturity;
}

export const PATTERNS: AgentPattern[] = [
  {
    id: 'single-linear',
    label: 'Single-agent linear',
    shortLabel: 'Linear',
    description:
      'One agent, one task, one execution path. The LLM is called once with tools available; it produces the answer directly or invokes one or two tools to ground the response.',
    diagram: {
      nodes: [
        { id: 'in',    label: 'Prompt', x: 0.07, y: 0.50, role: 'input' },
        { id: 'agent', label: 'Agent',  x: 0.42, y: 0.50, role: 'agent' },
        { id: 'tool',  label: 'Tool',   x: 0.70, y: 0.25, role: 'tool' },
        { id: 'out',   label: 'Output', x: 0.93, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in',    to: 'agent' },
        { from: 'agent', to: 'tool',  label: 'call' },
        { from: 'tool',  to: 'agent', label: 'result' },
        { from: 'agent', to: 'out' },
      ],
    },
    useCases: [
      'Single-purpose tasks: translate, summarize, classify',
      'Quick tool-grounded answers (weather, currency, dates)',
      'Most "chatbot with tools" deployments',
    ],
    tradeoffs: {
      pros: ['Simple to implement', 'Predictable latency', 'Cheap', 'Easy to debug'],
      cons: ['No iteration on errors', "Can't recover from incomplete answers", 'Limited to one-shot tasks'],
    },
    exampleTask: '"Look up the current price of AAPL and report it."',
    maturity: 'production',
  },
  {
    id: 'react-iterative',
    label: 'Single-agent iterative (ReAct)',
    shortLabel: 'ReAct',
    description:
      'One agent looping until it decides to stop. Each iteration produces a Thought, an Action, and consumes an Observation. The canonical agent pattern (Yao 2022).',
    diagram: {
      nodes: [
        { id: 'in',    label: 'Prompt',        x: 0.07, y: 0.50, role: 'input' },
        { id: 'agent', label: 'Agent\\n(loop)', x: 0.45, y: 0.50, role: 'agent' },
        { id: 'tool',  label: 'Tools',         x: 0.75, y: 0.50, role: 'tool' },
        { id: 'out',   label: 'Output',        x: 0.93, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in',    to: 'agent' },
        { from: 'agent', to: 'tool',  label: 'action' },
        { from: 'tool',  to: 'agent', label: 'observation', loop: true },
        { from: 'agent', to: 'out',   label: 'final' },
      ],
    },
    useCases: [
      'Multi-step tasks with unknown depth (research, debugging)',
      'Tool-chain composition (lookup → compute → format)',
      'Coding assistants (Claude Code, Cursor, Aider)',
      'Customer support (information lookup + response generation)',
    ],
    tradeoffs: {
      pros: ['Handles arbitrary-depth tasks', 'Self-correcting', 'Inspectable traces', 'Recovers from tool errors'],
      cons: ['Variable latency', 'Variable cost', 'Can loop unboundedly without limits', 'Context grows turn by turn'],
    },
    exampleTask: '"Find the population of Bhutan, look up its area, compute density."',
    maturity: 'production',
  },
  {
    id: 'hierarchical',
    label: 'Hierarchical (planner + executor)',
    shortLabel: 'Hierarchical',
    description:
      'One agent plans; another executes. Planner generates an ordered list of sub-tasks; executor runs each in sequence (often as a ReAct loop). Separates strategy from tactics.',
    diagram: {
      nodes: [
        { id: 'in',       label: 'Goal',            x: 0.06, y: 0.50, role: 'input' },
        { id: 'planner',  label: 'Planner',         x: 0.32, y: 0.50, role: 'planner' },
        { id: 'plan',     label: 'Sub-task\\nlist', x: 0.55, y: 0.50, role: 'memory' },
        { id: 'executor', label: 'Executor',        x: 0.78, y: 0.50, role: 'executor' },
        { id: 'tool',     label: 'Tools',           x: 0.78, y: 0.18, role: 'tool' },
        { id: 'out',      label: 'Output',          x: 0.94, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in',       to: 'planner' },
        { from: 'planner',  to: 'plan',     label: 'plan' },
        { from: 'plan',     to: 'executor', label: 'next' },
        { from: 'executor', to: 'tool',     label: 'call' },
        { from: 'tool',     to: 'executor', label: 'result' },
        { from: 'executor', to: 'plan',     label: 'update', loop: true },
        { from: 'executor', to: 'out',      label: 'final' },
      ],
    },
    useCases: [
      'Complex multi-step workflows (build me a React app, plan a trip)',
      'Tasks where decomposition matters (AutoGPT-style goals)',
      'When strategy benefits from a separate planning step',
      'Long-horizon work that needs structure',
    ],
    tradeoffs: {
      pros: ['Better structure for complex tasks', 'Plans are inspectable and editable', 'Separates concerns'],
      cons: ['More complexity', 'Bad plans cascade through execution', 'Higher cost (multiple LLM roles)'],
    },
    exampleTask: '"Build a Twitter clone in Next.js with auth, posts, and likes."',
    maturity: 'production-narrow',
  },
  {
    id: 'reflexion',
    label: 'Reflexion (self-critique)',
    shortLabel: 'Reflexion',
    description:
      'After each attempt, the agent writes a verbal reflection ("what I did wrong, what to try next"). The reflection is added to context for the next attempt. Iterative self-improvement on failures (Shinn 2023).',
    diagram: {
      nodes: [
        { id: 'in',     label: 'Task',       x: 0.07, y: 0.50, role: 'input' },
        { id: 'agent',  label: 'Agent',      x: 0.32, y: 0.50, role: 'agent' },
        { id: 'tool',   label: 'Tools',      x: 0.56, y: 0.25, role: 'tool' },
        { id: 'critic', label: 'Reflection', x: 0.56, y: 0.75, role: 'critic' },
        { id: 'mem',    label: 'Memory',     x: 0.78, y: 0.75, role: 'memory' },
        { id: 'out',    label: 'Output',     x: 0.93, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in',     to: 'agent' },
        { from: 'agent',  to: 'tool',   label: 'attempt' },
        { from: 'tool',   to: 'agent',  label: 'result' },
        { from: 'agent',  to: 'critic', label: 'on fail' },
        { from: 'critic', to: 'mem',    label: 'store' },
        { from: 'mem',    to: 'agent',  label: 'retry', loop: true },
        { from: 'agent',  to: 'out',    label: 'final' },
      ],
    },
    useCases: [
      'Tasks where iteration improves performance (coding, math, debugging)',
      'SWE-bench-style agents that retry on test failures',
      'Tasks with verifiable feedback (compilation errors, test results)',
      'Long-horizon problem-solving',
    ],
    tradeoffs: {
      pros: ['Improves on failures', 'Captures lessons explicitly', 'Works with verifiable signals'],
      cons: ['Needs failure signal', 'Cost scales with retries', 'Reflections can be wrong or unhelpful'],
    },
    exampleTask: '"Fix this bug; tests are failing. Retry up to 3 times learning from each attempt."',
    maturity: 'production-narrow',
  },
  {
    id: 'multi-agent',
    label: 'Multi-agent (preview)',
    shortLabel: 'Multi-agent',
    description:
      'Multiple agents with specialized roles cooperate to complete a task. May share a workspace, communicate via messages, or be orchestrated by a manager. Covered in depth in Ch 29.',
    diagram: {
      nodes: [
        { id: 'in',     label: 'Task',       x: 0.07, y: 0.50, role: 'input' },
        { id: 'mgr',    label: 'Manager',    x: 0.30, y: 0.50, role: 'planner' },
        { id: 'agentA', label: 'Researcher', x: 0.55, y: 0.18, role: 'specialist' },
        { id: 'agentB', label: 'Critic',     x: 0.55, y: 0.50, role: 'specialist' },
        { id: 'agentC', label: 'Writer',     x: 0.55, y: 0.82, role: 'specialist' },
        { id: 'out',    label: 'Output',     x: 0.92, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in',     to: 'mgr' },
        { from: 'mgr',    to: 'agentA', label: 'task A' },
        { from: 'mgr',    to: 'agentB', label: 'task B' },
        { from: 'mgr',    to: 'agentC', label: 'task C' },
        { from: 'agentA', to: 'out' },
        { from: 'agentB', to: 'out' },
        { from: 'agentC', to: 'out' },
      ],
    },
    useCases: [
      'Tasks that genuinely decompose into specialized expertise',
      'Adversarial workflows (proposer + critic + judge)',
      'Generative-agent simulations (Park 2023 — Smallville)',
      'Frameworks: CrewAI, AutoGen, Swarm',
    ],
    tradeoffs: {
      pros: ['Specialization improves on hard tasks', 'Adversarial setups catch errors', 'Mirrors human team structures'],
      cons: ['Coordination overhead', 'Communication failures', 'Harder to debug', 'Often outperformed by good single-agent setups'],
    },
    exampleTask: '"Research a topic, write a critical analysis, then revise based on critic feedback."',
    maturity: 'preview',
  },
];

/** Maturity badge metadata. */
export const MATURITY: Record<PatternMaturity, { label: string; color: string }> = {
  'production':         { label: 'production-ready',    color: 'var(--emerald-400)' },
  'production-narrow':  { label: 'production (narrow)', color: 'var(--cyan-400)' },
  'experimental':       { label: 'experimental',        color: 'var(--amber-400)' },
  'preview':            { label: 'preview (Ch 29)',     color: 'var(--violet-400)' },
};

/** Role colors for diagram nodes. */
export const ROLE_COLORS: Record<DiagramNode['role'], string> = {
  input:      'var(--text-secondary)',
  agent:      'var(--cyan-400)',
  tool:       'var(--amber-400)',
  memory:     'var(--violet-400)',
  output:     'var(--emerald-400)',
  critic:     'var(--rose-400)',
  planner:    'var(--cyan-400)',
  executor:   'var(--cyan-400)',
  specialist: 'var(--violet-400)',
};
