/**
 * Five multi-agent architectures (including the single-agent baseline)
 * with SVG diagram nodes/edges, use cases, tradeoffs, and example tasks.
 *
 * The single-agent baseline is INTENTIONALLY first — the chapter's central
 * calibration claim is that most multi-agent designs would work better as
 * well-designed single-agent loops. The widget reinforces this by putting
 * single-agent at the head of the catalog and labeling it production-ready.
 */

export type TopologyMaturity = 'production' | 'production-narrow' | 'experimental' | 'research';

export interface DiagramNode {
  id: string;
  label: string;
  /** 0..1 normalized position in the diagram viewBox. */
  x: number;
  y: number;
  /** Visual role. */
  role: 'input' | 'agent' | 'manager' | 'worker' | 'peer' | 'critic' | 'judge' | 'tool' | 'output';
}

export interface DiagramEdge {
  from: string;
  to: string;
  /** Optional label. */
  label?: string;
  /** Is this edge part of a loop or feedback? Rendered curved + dashed. */
  loop?: boolean;
}

export interface TopologyDiagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface AgentTopology {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  diagram: TopologyDiagram;
  useCases: string[];
  tradeoffs: { pros: string[]; cons: string[] };
  exampleTask: string;
  maturity: TopologyMaturity;
}

export const TOPOLOGIES: AgentTopology[] = [
  {
    id: 'single-agent-baseline',
    label: 'Single-agent baseline',
    shortLabel: 'Single-agent',
    description:
      'One agent in a ReAct loop with multiple tools. The chapter\'s recommended default — handles most production tasks with less complexity than any multi-agent setup. Listed first deliberately: most "I want multi-agent" instincts are better served here.',
    diagram: {
      nodes: [
        { id: 'in',    label: 'Task',     x: 0.07, y: 0.50, role: 'input' },
        { id: 'agent', label: 'Agent\n(loop)', x: 0.42, y: 0.50, role: 'agent' },
        { id: 'tool1', label: 'Tool A',   x: 0.72, y: 0.25, role: 'tool' },
        { id: 'tool2', label: 'Tool B',   x: 0.72, y: 0.75, role: 'tool' },
        { id: 'out',   label: 'Output',   x: 0.93, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in',    to: 'agent' },
        { from: 'agent', to: 'tool1', label: 'call' },
        { from: 'tool1', to: 'agent', label: 'result', loop: true },
        { from: 'agent', to: 'tool2', label: 'call' },
        { from: 'tool2', to: 'agent', label: 'result', loop: true },
        { from: 'agent', to: 'out',   label: 'final' },
      ],
    },
    useCases: [
      'Search-and-summarize tasks',
      'Multi-step tool composition (lookup → compute → format)',
      'Coding assistants (Claude Code, Cursor, Aider)',
      'Customer support with knowledge-base + ticket lookup',
      'Most "complex" tasks turn out to fit here',
    ],
    tradeoffs: {
      pros: [
        'Lowest complexity',
        'Cheapest per task',
        'Easiest to debug',
        'Best production track record',
      ],
      cons: [
        'No genuine role separation',
        'Can\'t parallelize subtasks',
        'One LLM doing everything',
      ],
    },
    exampleTask: '"Look up the population of Bhutan, find its area, compute density."',
    maturity: 'production',
  },
  {
    id: 'manager-worker',
    label: 'Manager-worker (orchestrator-executor)',
    shortLabel: 'Manager-worker',
    description:
      'One manager agent decomposes the task and assigns subtasks to workers; workers execute and return results; manager aggregates into a final answer. The most production-deployed multi-agent pattern.',
    diagram: {
      nodes: [
        { id: 'in',  label: 'Task',     x: 0.05, y: 0.50, role: 'input' },
        { id: 'mgr', label: 'Manager',  x: 0.30, y: 0.50, role: 'manager' },
        { id: 'wa',  label: 'Worker A', x: 0.62, y: 0.18, role: 'worker' },
        { id: 'wb',  label: 'Worker B', x: 0.62, y: 0.50, role: 'worker' },
        { id: 'wc',  label: 'Worker C', x: 0.62, y: 0.82, role: 'worker' },
        { id: 'out', label: 'Output',   x: 0.94, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in',  to: 'mgr' },
        { from: 'mgr', to: 'wa', label: 'task A' },
        { from: 'mgr', to: 'wb', label: 'task B' },
        { from: 'mgr', to: 'wc', label: 'task C' },
        { from: 'wa',  to: 'mgr', label: 'result', loop: true },
        { from: 'wb',  to: 'mgr', label: 'result', loop: true },
        { from: 'wc',  to: 'mgr', label: 'result', loop: true },
        { from: 'mgr', to: 'out', label: 'final' },
      ],
    },
    useCases: [
      'Software-development workflows (MetaGPT: PM → Architect → Engineer)',
      'Research-and-write pipelines (researcher → writer → editor)',
      'Parallel data-gathering (one task assigned to multiple workers)',
      'When task decomposition is the primary value-add',
    ],
    tradeoffs: {
      pros: [
        'Clear orchestration structure',
        'Easy to add/remove workers',
        'Traces are readable (manager-rooted)',
        'Workers can be specialized',
      ],
      cons: [
        'Bad manager plans cascade through execution',
        'Workers can\'t coordinate directly',
        'More LLM calls than single-agent',
        'Often outperformed by good single-agent with tools',
      ],
    },
    exampleTask: '"Build a simple landing page: have a copywriter draft text, a designer choose colors, an engineer assemble HTML."',
    maturity: 'production-narrow',
  },
  {
    id: 'peer-to-peer',
    label: 'Peer-to-peer (round-robin or message-driven)',
    shortLabel: 'Peer-to-peer',
    description:
      'Multiple agents communicate as peers without a designated manager. Each agent decides when it has something to contribute. Termination is by convention (consensus, max rounds, "we\'re done" signal). The architecture behind AutoGen group chats and multi-agent debate.',
    diagram: {
      nodes: [
        { id: 'in', label: 'Task',     x: 0.07, y: 0.50, role: 'input' },
        { id: 'a',  label: 'Peer A',   x: 0.40, y: 0.20, role: 'peer' },
        { id: 'b',  label: 'Peer B',   x: 0.65, y: 0.50, role: 'peer' },
        { id: 'c',  label: 'Peer C',   x: 0.40, y: 0.80, role: 'peer' },
        { id: 'out', label: 'Output',  x: 0.93, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in', to: 'a' },
        { from: 'in', to: 'b' },
        { from: 'in', to: 'c' },
        { from: 'a', to: 'b', loop: true },
        { from: 'b', to: 'c', loop: true },
        { from: 'c', to: 'a', loop: true },
        { from: 'b', to: 'out', label: 'consensus' },
      ],
    },
    useCases: [
      'Multi-agent debate (Du et al. 2023 — accuracy gains on hard tasks)',
      'Collaborative writing (one agent drafts, others edit, consensus emerges)',
      'AutoGen group chats',
      'Brainstorming-style tasks with no fixed step order',
    ],
    tradeoffs: {
      pros: [
        'Flexible — no fixed orchestration',
        'Adversarial dynamics improve quality',
        'Natural for debate/critique workflows',
      ],
      cons: [
        'Termination is hard (when are we done?)',
        'Agents can converge on wrong answers (group dynamics failures)',
        'Most LLM calls of any architecture',
        'Hardest to debug',
      ],
    },
    exampleTask: '"Three agents debate whether a given mathematical proof is correct; consensus produces the verdict."',
    maturity: 'experimental',
  },
  {
    id: 'hierarchical',
    label: 'Hierarchical (recursive teams)',
    shortLabel: 'Hierarchical',
    description:
      'A manager has workers; some workers are themselves managers of sub-teams. Tree structure of arbitrary depth. Each level handles its appropriate scope. Mostly research demos; very rare in production.',
    diagram: {
      nodes: [
        { id: 'in',  label: 'Task',     x: 0.05, y: 0.50, role: 'input' },
        { id: 'top', label: 'Top Mgr', x: 0.22, y: 0.50, role: 'manager' },
        { id: 'm1',  label: 'Mid Mgr', x: 0.45, y: 0.25, role: 'manager' },
        { id: 'm2',  label: 'Mid Mgr', x: 0.45, y: 0.75, role: 'manager' },
        { id: 'w1',  label: 'Worker',  x: 0.70, y: 0.10, role: 'worker' },
        { id: 'w2',  label: 'Worker',  x: 0.70, y: 0.40, role: 'worker' },
        { id: 'w3',  label: 'Worker',  x: 0.70, y: 0.60, role: 'worker' },
        { id: 'w4',  label: 'Worker',  x: 0.70, y: 0.90, role: 'worker' },
        { id: 'out', label: 'Output',  x: 0.94, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in',  to: 'top' },
        { from: 'top', to: 'm1' },
        { from: 'top', to: 'm2' },
        { from: 'm1',  to: 'w1' },
        { from: 'm1',  to: 'w2' },
        { from: 'm2',  to: 'w3' },
        { from: 'm2',  to: 'w4' },
        { from: 'm1',  to: 'top', loop: true },
        { from: 'm2',  to: 'top', loop: true },
        { from: 'top', to: 'out', label: 'final' },
      ],
    },
    useCases: [
      'Very large workflows with natural sub-team structure',
      'Mirroring organizational hierarchies (research demo)',
      'Tasks where supervision-of-supervision is genuinely useful',
      'Rare in 2025 production — mostly research',
    ],
    tradeoffs: {
      pros: [
        'Models real organizational structure',
        'Allows specialization at multiple levels',
        'Recursion can simplify large workflows',
      ],
      cons: [
        'Very complex to implement and debug',
        'High LLM-call cost',
        'Plans cascade through multiple layers',
        'Almost always simpler designs work better',
      ],
    },
    exampleTask: '"Top manager assigns research and writing teams; each team has its own manager and workers. Mostly a research-demo scenario."',
    maturity: 'research',
  },
  {
    id: 'proposer-critic-judge',
    label: 'Proposer-critic-judge (adversarial role specialization)',
    shortLabel: 'Proposer-critic-judge',
    description:
      'Three specialized roles: one generates a candidate answer (proposer), one critiques it (critic), one decides whether to accept or revise (judge). The pattern from Du et al. 2023 — measurable accuracy gains on hard reasoning tasks via adversarial dynamics.',
    diagram: {
      nodes: [
        { id: 'in',  label: 'Task',     x: 0.05, y: 0.50, role: 'input' },
        { id: 'pro', label: 'Proposer', x: 0.28, y: 0.50, role: 'agent' },
        { id: 'cri', label: 'Critic',   x: 0.52, y: 0.50, role: 'critic' },
        { id: 'jud', label: 'Judge',    x: 0.76, y: 0.50, role: 'judge' },
        { id: 'out', label: 'Output',   x: 0.95, y: 0.50, role: 'output' },
      ],
      edges: [
        { from: 'in',  to: 'pro' },
        { from: 'pro', to: 'cri', label: 'answer' },
        { from: 'cri', to: 'jud', label: 'critique' },
        { from: 'jud', to: 'out', label: 'verdict' },
        { from: 'jud', to: 'pro', label: 'revise', loop: true },
      ],
    },
    useCases: [
      'Hard reasoning tasks where the LLM is unreliable as a generator',
      'Code review (proposer = coder; critic = reviewer; judge = tech lead)',
      'Math problem-solving with verification',
      'Any task where critique is easier than generation',
    ],
    tradeoffs: {
      pros: [
        'Measurable accuracy gains (Du 2023)',
        'Roles have distinct cognitive demands',
        'LLMs are often better critics than generators',
        'Natural fit for adversarial tasks',
      ],
      cons: [
        '3× LLM cost vs single-agent',
        'Needs verifiable signal for the judge',
        'Critic can be wrong; judge must arbitrate',
        'Single-agent self-refine often works comparably',
      ],
    },
    exampleTask: '"Solve a math problem: proposer generates a solution; critic flags errors; judge confirms or asks for revision."',
    maturity: 'production-narrow',
  },
];

/** Maturity metadata for badges. */
export const MATURITY: Record<TopologyMaturity, { label: string; color: string }> = {
  'production':         { label: 'production-ready',     color: 'var(--emerald-400)' },
  'production-narrow':  { label: 'production (narrow)',  color: 'var(--cyan-400)' },
  'experimental':       { label: 'experimental',         color: 'var(--amber-400)' },
  'research':           { label: 'research demos',       color: 'var(--violet-400)' },
};

/** Role colors for diagram nodes. */
export const ROLE_COLORS: Record<DiagramNode['role'], string> = {
  input:   'var(--text-secondary)',
  agent:   'var(--cyan-400)',
  manager: 'var(--cyan-400)',
  worker:  'var(--violet-400)',
  peer:    'var(--violet-400)',
  critic:  'var(--rose-400)',
  judge:   'var(--amber-400)',
  tool:    'var(--amber-400)',
  output:  'var(--emerald-400)',
};
