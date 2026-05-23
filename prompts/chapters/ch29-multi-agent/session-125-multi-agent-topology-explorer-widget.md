# Session 125 — Multi-agent topology explorer marquee widget

> The first marquee Chapter 29 widget. **Five multi-agent architectures visualized side-by-side**: a single-agent baseline (the recommended default for most tasks), manager-worker, peer-to-peer, hierarchical, and proposer-critic-judge. Reader picks any architecture to see full detail: a small SVG node-and-arrow diagram, use cases, pros/cons tradeoffs, an example task, and a maturity badge. **Including the single-agent baseline in the catalog is deliberate — the chapter's central honesty made into a widget.** The reader leaves having internalized that "agent" isn't one architecture but a family, that single-agent is the recommended default, and that each multi-agent topology has specific use cases earning it a place. **The chapter's architectural vocabulary, locked in 60 seconds of interaction.**

---

## Read first (in this order)

1. **`research/ch29-multi-agent/research.md`** — concept 2 (architectures) and concept 7 (when NOT to use multi-agent) are the source material
2. **`prompts/chapters/ch29-multi-agent/session-124-page-structure.md`** — for the section-2 widget placeholder this session fills
3. **`prompts/chapters/ch27-agent-foundations/session-120-pattern-catalog-and-exercises-and-closeout.md`** — for the prior Pattern Catalog widget pattern that this widget follows closely
4. **`prompts/chapters/ch28-agent-from-scratch/session-122-tool-schema-builder-widget.md`** — for the recent Ch 28 widget conventions (picker + detail panel + tabs/comparisons)

---

## Goal

Replace the `<WidgetFrame title="Multi-agent topology explorer">` placeholder in section 2 with a working interactive widget that:

- Shows a **picker over 5 curated architectures**: single-agent baseline, manager-worker, peer-to-peer, hierarchical, proposer-critic-judge
- For the active architecture, shows:
  - The **architecture label** with a maturity badge
  - A **description** in plain prose
  - An **SVG diagram** of nodes (agents/components) and edges (communication paths)
  - **Use cases**: bullet list of where this architecture earns its place
  - **Tradeoffs**: two-column pros/cons grid
  - An **example task** in monospace
- Provides a **quick comparison row** showing all 5 architectures with maturity/complexity/use-when
- A **pedagogical caption** below explaining the central calibration claim

**End state:** section 2 of Chapter 29 has a working marquee widget. After 60 seconds of interaction (cycling through 3-4 architectures), the reader should be able to: (a) **distinguish single-agent baseline from the four multi-agent variants** visually and verbally; (b) **name an example task** for each architecture; (c) **articulate at least one tradeoff** for each; (d) **internalize that single-agent is the recommended default** because the catalog shows it as the first option and frames it as production-ready.

---

## Inputs

State of the repo after session 124:

- `src/pages/ch29-multi-agent/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 2 and 4)
- `src/lib/chapters.ts` has Ch 29 as `'draft'`
- No `src/components/widgets/ch29-multi-agent/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch29-multi-agent/MultiAgentTopologyExplorer.tsx` — the React widget
2. **Create** `src/components/widgets/ch29-multi-agent/MultiAgentTopologyExplorer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch29-multi-agent/topology-data.ts` — 5 curated architectures with diagram specs, use cases, tradeoffs
4. **Update** `src/components/widgets/index.ts` — add `MultiAgentTopologyExplorer` export
5. **Update** `src/pages/ch29-multi-agent/index.mdx` — replace section-2's `<WidgetFrame>` interior with `<MultiAgentTopologyExplorer client:visible />`

---

## Detailed spec

### 1. `topology-data.ts`

```ts
// src/components/widgets/ch29-multi-agent/topology-data.ts

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
```

### 2. Visual layout

```
ViewBox: 0 0 800 940

┌────────────────────────────────────────────────────────────────┐
│ Multi-agent topology explorer                                    │
│ 5 architectures · single-agent baseline first · pick for detail  │
│                                                                  │
│ Pick an architecture:                                            │
│  [ Single-agent ] [ Manager-worker ] [ Peer-to-peer ]            │
│  [ Hierarchical ] [ Proposer-critic-judge ]                      │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ SINGLE-AGENT BASELINE              production-ready          │ │
│ │                                                                │ │
│ │ Description:                                                  │ │
│ │ One agent in a ReAct loop with multiple tools. The chapter's │ │
│ │ recommended default...                                        │ │
│ │                                                                │ │
│ │ Diagram:                                                       │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │ [Task] → [Agent (loop)] ↔ [Tool A]                      │ │ │
│ │ │              │           ↔ [Tool B]                      │ │ │
│ │ │              │                                            │ │ │
│ │ │              └─ final → [Output]                          │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ Use cases:                                                    │ │
│ │  • Search-and-summarize tasks                                │ │
│ │  • Multi-step tool composition                                │ │
│ │  • Coding assistants (Claude Code, Cursor)                   │ │
│ │  • Most "complex" tasks turn out to fit here                 │ │
│ │                                                                │ │
│ │ Tradeoffs:                                                    │ │
│ │  ┌─────────────────┬─────────────────┐                       │ │
│ │  │ Pros            │ Cons            │                       │ │
│ │  │ ✓ Lowest comp.. │ ✗ No genuine ro │                       │ │
│ │  │ ✓ Cheapest      │ ✗ Can't parall  │                       │ │
│ │  │ ✓ Easiest to d  │ ✗ One LLM all   │                       │ │
│ │  └─────────────────┴─────────────────┘                       │ │
│ │                                                                │ │
│ │ Example task:                                                 │ │
│ │ "Look up the population of Bhutan, find its area,..."        │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Quick comparison row:                                            │
│ ┌──────────┬──────────┬──────────┬─────────────────────────┐ │
│ │ Topology │ Maturity │ Complex. │ Use it when...           │ │
│ │ Single   │ ✓✓✓     │ low      │ most tasks (default)     │ │
│ │ Mgr-wkr  │ ✓✓      │ medium   │ task decomposition       │ │
│ │ Peer     │ ✓       │ high     │ debate/adversarial       │ │
│ │ Hierarchy│ ✗       │ very hi  │ research; rare in prod   │ │
│ │ P-C-J    │ ✓✓      │ medium   │ adversarial; hard reas.. │ │
│ └──────────┴──────────┴──────────┴─────────────────────────┘ │
│                                                                  │
│ Pedagogical caption                                              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click architecture button → load full detail panel
- Click any row in the quick comparison table → selects that architecture
- Default selection: **single-agent baseline** (the recommended default) — deliberately first

**Visual encoding:**
- **Topology buttons**: 5 buttons; active in cyan; left-border tinted by maturity color
- **Maturity badge**: filled background tinted by maturity color (emerald / cyan / amber / violet)
- **SVG diagram**: nodes color-coded by role; edges with optional labels; loop edges curved + dashed
- **Use cases**: bulleted list with cyan bullet markers
- **Tradeoffs**: 2-column grid (Pros emerald ✓, Cons rose ✗)
- **Example task**: italicized monospace in quoted box
- **Quick comparison table**: compact; active row highlighted in cyan

### 3. `MultiAgentTopologyExplorer.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  TOPOLOGIES, MATURITY, ROLE_COLORS,
  type AgentTopology, type DiagramNode, type DiagramEdge,
} from './topology-data';
import styles from './MultiAgentTopologyExplorer.module.css';

const VIEW_W = 700;
const VIEW_H = 320;
const NODE_W = 92;
const NODE_H = 42;

function nodeX(node: DiagramNode): number { return node.x * VIEW_W; }
function nodeY(node: DiagramNode): number { return node.y * VIEW_H; }

interface EdgePath {
  d: string;
  labelX: number;
  labelY: number;
  isLoop: boolean;
  label?: string;
}

function buildEdgePath(edge: DiagramEdge, nodeMap: Map<string, DiagramNode>): EdgePath | null {
  const from = nodeMap.get(edge.from);
  const to = nodeMap.get(edge.to);
  if (!from || !to) return null;

  const x1 = nodeX(from), y1 = nodeY(from);
  const x2 = nodeX(to),   y2 = nodeY(to);

  if (edge.loop) {
    const dx = x2 - x1, dy = y2 - y1;
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
    const len = Math.sqrt(dx * dx + dy * dy);
    const offsetX = -dy / len * 40;
    const offsetY = dx / len * 40;
    const cx = midX + offsetX, cy = midY + offsetY;
    return {
      d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
      labelX: cx, labelY: cy,
      isLoop: true,
      label: edge.label,
    };
  }
  return {
    d: `M ${x1} ${y1} L ${x2} ${y2}`,
    labelX: (x1 + x2) / 2,
    labelY: (y1 + y2) / 2 - 6,
    isLoop: false,
    label: edge.label,
  };
}


function TopologyDiagram({ topology }: { topology: AgentTopology }) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, DiagramNode>();
    topology.diagram.nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [topology]);

  const edgePaths = useMemo(() => {
    return topology.diagram.edges
      .map(e => ({ ...buildEdgePath(e, nodeMap)!, edge: e }))
      .filter(Boolean);
  }, [topology, nodeMap]);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={styles.diagramSvg}
      role="img"
      aria-label={`Diagram of ${topology.label}`}
    >
      <defs>
        <marker
          id="ch29-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-secondary)" />
        </marker>
      </defs>

      {/* Edges */}
      {edgePaths.map((ep, i) => (
        <g key={i}>
          <path
            d={ep.d}
            className={ep.isLoop ? styles.edgeLoop : styles.edge}
            markerEnd="url(#ch29-arrow)"
          />
          {ep.label && (
            <text x={ep.labelX} y={ep.labelY} className={styles.edgeLabel}>
              {ep.label}
            </text>
          )}
        </g>
      ))}

      {/* Nodes */}
      {topology.diagram.nodes.map(node => {
        const x = nodeX(node), y = nodeY(node);
        const color = ROLE_COLORS[node.role];
        return (
          <g key={node.id}>
            <rect
              x={x - NODE_W / 2}
              y={y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={6}
              fill={`color-mix(in srgb, ${color} 14%, var(--bg-elevated))`}
              stroke={color}
              strokeWidth={1.5}
            />
            {node.label.split('\\n').map((line, i, arr) => (
              <text
                key={i}
                x={x}
                y={y + (i - (arr.length - 1) / 2) * 13 + 4}
                className={styles.nodeLabel}
                textAnchor="middle"
              >{line}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}


function complexityFor(id: string): string {
  switch (id) {
    case 'single-agent-baseline': return 'low';
    case 'manager-worker':        return 'medium';
    case 'peer-to-peer':          return 'high';
    case 'hierarchical':          return 'very high';
    case 'proposer-critic-judge': return 'medium';
    default:                      return '—';
  }
}

function useWhenFor(id: string): string {
  switch (id) {
    case 'single-agent-baseline': return 'most tasks (the default)';
    case 'manager-worker':        return 'task decomposition';
    case 'peer-to-peer':          return 'debate / adversarial';
    case 'hierarchical':          return 'research; rare in production';
    case 'proposer-critic-judge': return 'adversarial role specialization';
    default:                      return '—';
  }
}


export default function MultiAgentTopologyExplorer() {
  const [idx, setIdx] = useState(0);  // default to single-agent (chapter's recommended default)
  const topology = TOPOLOGIES[idx]!;
  const maturity = MATURITY[topology.maturity];

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Multi-agent topology explorer</div>
        <div className={styles.titleSubLabel}>
          {TOPOLOGIES.length} architectures · single-agent baseline first · pick for detail
        </div>
      </div>

      {/* Picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick an architecture:</span>
          <div className={styles.topologyButtons}>
            {TOPOLOGIES.map((t, i) => (
              <button
                key={t.id}
                className={`${styles.topologyButton} ${idx === i ? styles.topologyButtonActive : ''}`}
                style={{ borderLeftColor: MATURITY[t.maturity].color }}
                onClick={() => setIdx(i)}
              >{t.shortLabel}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{topology.label.toUpperCase()}</div>
          <div
            className={styles.maturityBadge}
            style={{
              background: `color-mix(in srgb, ${maturity.color} 18%, transparent)`,
              color: maturity.color,
              borderColor: `color-mix(in srgb, ${maturity.color} 40%, transparent)`,
            }}
          >
            {maturity.label}
          </div>
        </div>

        <div className={styles.descriptionText}>{topology.description}</div>

        {/* Diagram */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Diagram</div>
          <div className={styles.diagramContainer}>
            <TopologyDiagram topology={topology} />
          </div>
        </div>

        {/* Use cases */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Use cases</div>
          <ul className={styles.useCases}>
            {topology.useCases.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>

        {/* Tradeoffs */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Tradeoffs</div>
          <div className={styles.tradeoffs}>
            <div className={styles.tradeoffColumn}>
              <div className={styles.tradeoffHeader}>Pros</div>
              <ul className={`${styles.tradeoffList} ${styles.tradeoffPros}`}>
                {topology.tradeoffs.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div className={styles.tradeoffColumn}>
              <div className={styles.tradeoffHeader}>Cons</div>
              <ul className={`${styles.tradeoffList} ${styles.tradeoffCons}`}>
                {topology.tradeoffs.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Example task */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Example task</div>
          <div className={styles.exampleTaskBox}>{topology.exampleTask}</div>
        </div>
      </div>

      {/* Quick comparison */}
      <div className={styles.comparisonPanel}>
        <div className={styles.sectionLabel}>Quick comparison</div>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Topology</th>
              <th>Maturity</th>
              <th>Complexity</th>
              <th>Use it when...</th>
            </tr>
          </thead>
          <tbody>
            {TOPOLOGIES.map((t, i) => (
              <tr
                key={t.id}
                className={i === idx ? styles.comparisonRowActive : ''}
                onClick={() => setIdx(i)}
                style={{ cursor: 'pointer' }}
              >
                <td>{t.shortLabel}</td>
                <td>
                  <span
                    className={styles.maturityDot}
                    style={{ background: MATURITY[t.maturity].color }}
                  />
                  {MATURITY[t.maturity].label}
                </td>
                <td>{complexityFor(t.id)}</td>
                <td>{useWhenFor(t.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        <strong>Single-agent baseline is the chapter's recommended default</strong> — listed first
        deliberately. Most "I want multi-agent" instincts are better served by a well-designed
        single-agent ReAct loop with the right tools. <strong>Manager-worker</strong> earns its
        place when task decomposition is the main value-add. <strong>Peer-to-peer</strong> shines
        in debate / adversarial workflows (Du et al. 2023 showed measurable accuracy gains).
        <strong>Hierarchical</strong> is mostly research demos. <strong>Proposer-critic-judge</strong> is
        the most useful pure multi-agent pattern in practice — adversarial role specialization with
        measurable quality gains. <strong>The widget's framing reflects the chapter's central honest claim</strong>:
        multi-agent is real and useful in narrow cases, dramatically overused everywhere else.
      </div>
    </div>
  );
}
```

### 4. `MultiAgentTopologyExplorer.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .detailPanel, .comparisonPanel, .caption {
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
  min-width: 130px;
  padding-top: 0.45rem;
}
.topologyButtons { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; }
.topologyButton {
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
.topologyButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.topologyButtonActive {
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
.maturityBadge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  font-weight: 500;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  border: 1px solid;
  text-transform: lowercase;
}

.descriptionText {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 0.85rem;
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

/* Diagram */
.diagramContainer {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 0.6rem;
}
.diagramSvg {
  width: 100%;
  height: auto;
  display: block;
}
.edge {
  fill: none;
  stroke: var(--text-secondary);
  stroke-width: 1.5;
}
.edgeLoop {
  fill: none;
  stroke: var(--cyan-400);
  stroke-width: 1.5;
  stroke-dasharray: 5 3;
}
.edgeLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  fill: var(--text-tertiary);
  text-anchor: middle;
}
.nodeLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  fill: var(--text-primary);
  font-weight: 500;
}

/* Use cases */
.useCases {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.useCases li {
  font-size: 0.84rem;
  color: var(--text-primary);
  padding: 0.35rem 0.6rem 0.35rem 1.2rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  position: relative;
}
.useCases li::before {
  content: '•';
  position: absolute;
  left: 0.55rem;
  color: var(--cyan-400);
  font-weight: 700;
}

/* Tradeoffs */
.tradeoffs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.tradeoffColumn {
  padding: 0.6rem 0.7rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.tradeoffHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
  margin-bottom: 0.4rem;
}
.tradeoffList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.tradeoffList li {
  font-size: 0.82rem;
  padding-left: 1.1rem;
  position: relative;
  line-height: 1.45;
  color: var(--text-primary);
}
.tradeoffPros li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--emerald-400);
  font-weight: 700;
}
.tradeoffCons li::before {
  content: '✗';
  position: absolute;
  left: 0;
  color: var(--rose-400);
  font-weight: 700;
}

/* Example task */
.exampleTaskBox {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.84rem;
  padding: 0.55rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-style: italic;
}

/* Comparison */
.comparisonTable {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.comparisonTable th {
  text-align: left;
  padding: 0.45rem 0.6rem;
  background: var(--bg-primary);
  color: var(--text-tertiary);
  font-weight: 500;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
}
.comparisonTable td {
  padding: 0.45rem 0.6rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  transition: background 200ms;
}
.comparisonTable tbody tr:hover {
  background: color-mix(in srgb, var(--cyan-500) 5%, var(--bg-elevated));
}
.comparisonRowActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-elevated));
}
.comparisonRowActive td { color: var(--cyan-300); }
.maturityDot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 0.4rem;
  vertical-align: middle;
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
  .detailHeader { flex-direction: column; align-items: flex-start; }
  .tradeoffs { grid-template-columns: 1fr; }
  .nodeLabel { font-size: 0.6rem; }
  .edgeLabel { font-size: 0.55rem; }
  .comparisonTable { font-size: 0.68rem; }
  .comparisonTable th, .comparisonTable td { padding: 0.35rem 0.4rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as MultiAgentTopologyExplorer } from './ch29-multi-agent/MultiAgentTopologyExplorer';
// Session 164 will add:
// export { default as InterAgentConversationViewer } from './ch29-multi-agent/InterAgentConversationViewer';
```

### 6. Update `src/pages/ch29-multi-agent/index.mdx`

**Edit A: Add widget import:**

```mdx
import { MultiAgentTopologyExplorer } from '@components/widgets';
```

**Edit B: Replace section-2's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Multi-agent topology explorer" caption="Five architectures visualized side-by-side: single-agent baseline (the recommended default), manager-worker, peer-to-peer, hierarchical, proposer-critic-judge. Each shows an SVG node-and-arrow diagram, use cases, pros/cons tradeoffs, an example task, and a maturity badge. Single-agent is listed first deliberately — the chapter's central calibration claim made into the widget's structure.">
  <MultiAgentTopologyExplorer client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 2 of Ch 29** renders with the working widget. Section 4's placeholder still stubbed.
3. **Default state**: single-agent baseline selected (idx = 0); detail panel populated with description, diagram, use cases, tradeoffs, example.
4. **Five topology buttons**: Single-agent / Manager-worker / Peer-to-peer / Hierarchical / Proposer-critic-judge. Active button cyan; left-border tinted by maturity color.
5. **Maturity badge color coding**: production-ready (emerald), production-narrow (cyan), experimental (amber), research (violet).
6. **SVG diagram**: nodes color-coded by role; edges with optional labels; loop edges curved + dashed cyan.
7. **Use cases**: bulleted list with cyan bullets.
8. **Tradeoffs**: 2-column grid (Pros emerald ✓, Cons rose ✗).
9. **Example task**: italicized monospace.
10. **Quick comparison table**: 5 rows; active row highlighted in cyan; clicking any row selects that topology; columns: Topology / Maturity (with dot) / Complexity / Use it when.
11. **Single-agent baseline is listed FIRST** in both the button row and the comparison table — the chapter's calibration claim baked into the UI.
12. **All 5 topologies cycle correctly**.
13. **Mobile** (< 720px): tradeoffs stack vertically; comparison table compacts; diagram remains legible.
14. **`npm run typecheck`** passes.
15. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not animate diagrams**. Static SVG only.
- ❌ **Do not implement editable diagrams** (e.g., drag nodes).
- ❌ **Do not include AutoGen/CrewAI/MetaGPT as separate topologies**. Those are frameworks (section 5), not architectures (section 2).
- ❌ **Do not flip Ch 29's status**. Session 165 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch29-multi-agent/ src/components/widgets/index.ts src/pages/ch29-multi-agent/index.mdx
git commit -m "session 125: multi-agent topology explorer marquee 1 — 5 architectures with single-agent baseline first"
git push origin main
```

---

## Notes for the session author

**On the 5 architectures being deliberately chosen:**

| Architecture | Maturity | Teaches |
|--------------|----------|---------|
| **Single-agent baseline** | production-ready | The recommended default; **listed first deliberately** |
| Manager-worker | production-narrow | Task decomposition pattern |
| Peer-to-peer | experimental | Debate / adversarial collaboration |
| Hierarchical | research | Recursive teams; rare in production |
| Proposer-critic-judge | production-narrow | Adversarial role specialization |

Notes-for-author: "**Including single-agent baseline as the FIRST architecture is the most important design choice of the widget.** It reinforces the chapter's central calibration claim: single-agent is the recommended default; multi-agent is the exception. **Visually leading with single-agent before any multi-agent variant** makes that case stronger than any prose."

**On the maturity-badge honesty:**
- Single-agent: production-ready (emerald) — most production agents
- Manager-worker, proposer-critic-judge: production-narrow (cyan) — useful in specific cases
- Peer-to-peer: experimental (amber) — accuracy gains demonstrated; production-rare
- Hierarchical: research (violet) — almost no production use

Notes-for-author: "**The maturity badges are calibration tools.** Reader sees the production-ready badge on single-agent and the research/experimental labels on the more exotic architectures. **The visual hierarchy reinforces the prose argument.**"

**On role colors carrying meaning across diagrams:**
- **Cyan** — agent, manager (the LLM-controller role)
- **Violet** — worker, peer (the executor role)
- **Rose** — critic (adversarial role)
- **Amber** — judge, tool (arbitration / external)
- **Emerald** — output (success)
- **Text-secondary** — input

Notes-for-author: "**Same color = same role across diagrams.** Reader who looks across architectures sees that cyan = LLM-controller everywhere, violet = executor everywhere, rose = critic everywhere. **Visual literacy in multi-agent vocabulary earned in 60 seconds.**"

**On the proposer-critic-judge tradeoffs being honest:**
The "cons" list explicitly includes "Single-agent self-refine often works comparably." Notes-for-author: "**This is the chapter's honest framing made into a tradeoff bullet.** Even the most useful multi-agent pattern has a single-agent alternative that often works comparably. **The chapter doesn't dismiss multi-agent; it gives engineers an honest accounting.**"

**On hierarchical being labeled research:**
Most published multi-agent papers use 2-level designs (manager + workers); recursive hierarchies are mostly research demos. Notes-for-author: "**Hierarchical's tradeoffs are deliberately discouraging.** 'Plans cascade through multiple layers'; 'Almost always simpler designs work better.' **The widget is honest that this pattern is rarely the right call.**"

**On the comparison table being a quick reference:**
The 5-row table at the bottom stays visible regardless of which architecture is selected. Notes-for-author: "**The table is the architecture cheat sheet.** A reader who skims everything else still leaves with the table burned in: 5 topologies, their maturity, their complexity, when to use each."

**On the default being single-agent (idx = 0):**
The widget initializes with single-agent baseline selected. Notes-for-author: "**Default state matters.** Reader who lands on the widget without clicking anything still sees the recommended default first. **This is a small UX choice with outsize pedagogical impact.**"

**On the SVG diagrams reinforcing architectural literacy:**
Each architecture has a small node-and-arrow diagram showing data flow. Notes-for-author: "**The diagrams make architectural differences visible.** Reader's eye picks up that single-agent loops with tools; manager-worker fans out and aggregates; peer-to-peer interconnects; hierarchical recurses; proposer-critic-judge pipelines linearly. **Visual literacy in 60 seconds.**"

**Pedagogical claim this widget supports:**
"Five common multi-agent architectures form the design space — but **single-agent is the recommended default** for most tasks. Manager-worker earns its place when task decomposition is the main value-add. Peer-to-peer shines in debate/adversarial workflows. Hierarchical is mostly research demos. Proposer-critic-judge is the most useful pure multi-agent pattern in practice. **The catalog includes single-agent as a deliberate calibration**: visually leading with single-agent before any multi-agent variant teaches the reader that the default should be single-agent, multi-agent is the exception. **'Agent' isn't one architecture but a family — and choosing well matters.**"

After 60 seconds of interaction (cycling through 3-4 architectures), the reader has internalized: (a) single-agent baseline as the recommended default; (b) four multi-agent variants with their narrow use cases; (c) the maturity hierarchy (production → research); (d) the visual vocabulary (cyan agent, violet worker, rose critic, amber judge).

**This is Ch 29's first central visualization.** Build with care.
