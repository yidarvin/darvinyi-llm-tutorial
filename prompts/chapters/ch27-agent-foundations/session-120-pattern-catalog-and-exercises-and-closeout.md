# Session 120 — Ch 27 agent pattern catalog + exercises + closeout

> **The Chapter 27 closeout — the file that completes the foundations chapter.** Three deliverables: (1) implement the **Agent Pattern Catalog** secondary widget — **five common agent patterns** (single-agent linear, ReAct iterative, hierarchical planner-executor, Reflexion self-critique, multi-agent preview) each rendered with a small SVG diagram, use cases, tradeoffs, and a maturity badge; reader picks any pattern to see full detail; the comparison communicates that "agent" isn't a single architecture but a family of them; (2) add an **Exercises section** with 4 problems (minimal ReAct loop, agent with Reflexion-style memory, error handling with retry, design-your-own-agent); (3) flip Ch 27's status from `'draft'` to `'published'`. **Closes Ch 27.** Phase 15 status: one of four chapters published. **Ch 28 (Agents from scratch)** opens next — the engineering deep-dive that builds on this foundation.

This is a **single-topic chapter** (4-file cadence). The secondary widget combines with exercises in this final session — the standard closeout pattern. **File 153 is the file that closes Chapter 27.**

---

## Read first (in this order)

1. **`research/ch27-agent-foundations/research.md`** — concepts 6 (patterns and anti-patterns) and the reference implementations are the source material
2. **`prompts/chapters/ch27-agent-foundations/session-118-page-structure.md`** — for the section-6 widget placeholder and exercise placement
3. **`prompts/chapters/ch27-agent-foundations/session-119-agentic-loop-visualizer-widget.md`** — for the Ch 27 widget conventions
4. **`prompts/chapters/ch26-evaluation/session-117-llm-judge-bias-demo-and-exercises-and-closeout.md`** — for the recent Phase 14+ closeout pattern

---

## Goal

By end of session, three things change in the repo:

1. **`AgentPatternCatalog` widget** is implemented and wired into section 6. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("The agentic stack today") and section 8 ("Phase 15 opens — chapter map"). Four exercises with hints + runnable starter code.
3. **Ch 27's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 27 is the twenty-seventh published chapter — and the first of Phase 15.**

After this session: **Ch 27 is complete. Phase 15 has its first published chapter.** **Ch 28 (Agents from scratch)** opens next.

---

## Inputs

State of the repo after session 119:

- Section 3's `AgenticLoopVisualizer` marquee widget is wired
- Section 6's widget is still stubbed
- All 3 runnable code blocks from session 118 are in place (minimal ReAct, agent with memory, error handling)
- `src/lib/chapters.ts` has Ch 1-26 `'published'`, Ch 27 `'draft'`
- `src/components/widgets/ch27-agent-foundations/` exists with `AgenticLoopVisualizer` already

---

## Deliverables

1. **Create** `src/components/widgets/ch27-agent-foundations/AgentPatternCatalog.tsx` — the React widget
2. **Create** `src/components/widgets/ch27-agent-foundations/AgentPatternCatalog.module.css` — scoped styles
3. **Create** `src/components/widgets/ch27-agent-foundations/pattern-data.ts` — 5 patterns with diagram specs, use cases, tradeoffs
4. **Update** `src/components/widgets/index.ts` — add `AgentPatternCatalog` export
5. **Update** `src/pages/ch27-agent-foundations/index.mdx`:
   - Replace section-6's `<WidgetFrame>` interior with `<AgentPatternCatalog client:visible />`
   - Insert new `## Exercises` section between section 7 ("The agentic stack today") and section 8 ("Phase 15 opens — chapter map")
6. **Update** `src/lib/chapters.ts` — change Ch 27's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 27's marquee widget is sealed.

---

## Detailed spec

### Part A — `AgentPatternCatalog` widget

#### A.1 `pattern-data.ts`

```ts
// src/components/widgets/ch27-agent-foundations/pattern-data.ts

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
        { id: 'in',   label: 'Prompt',  x: 0.07, y: 0.50, role: 'input' },
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
      cons: ['No iteration on errors', 'Can\'t recover from incomplete answers', 'Limited to one-shot tasks'],
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
        { id: 'in',    label: 'Prompt',      x: 0.07, y: 0.50, role: 'input' },
        { id: 'agent', label: 'Agent\n(loop)', x: 0.45, y: 0.50, role: 'agent' },
        { id: 'tool',  label: 'Tools',       x: 0.75, y: 0.50, role: 'tool' },
        { id: 'out',   label: 'Output',      x: 0.93, y: 0.50, role: 'output' },
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
        { id: 'in',       label: 'Goal',     x: 0.06, y: 0.50, role: 'input' },
        { id: 'planner',  label: 'Planner',  x: 0.32, y: 0.50, role: 'planner' },
        { id: 'plan',     label: 'Sub-task\nlist', x: 0.55, y: 0.50, role: 'memory' },
        { id: 'executor', label: 'Executor', x: 0.78, y: 0.50, role: 'executor' },
        { id: 'tool',     label: 'Tools',    x: 0.78, y: 0.18, role: 'tool' },
        { id: 'out',      label: 'Output',   x: 0.94, y: 0.50, role: 'output' },
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
      'Multiple agents with specialized roles cooperate to complete a task. May share a workspace, communicate via messages, or be orchestrated by a manager. **Covered in depth in Ch 29.**',
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
  'production':         { label: 'production-ready',     color: 'var(--emerald-400)' },
  'production-narrow':  { label: 'production (narrow)',  color: 'var(--cyan-400)' },
  'experimental':       { label: 'experimental',         color: 'var(--amber-400)' },
  'preview':            { label: 'preview (Ch 29)',      color: 'var(--violet-400)' },
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
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 920

┌────────────────────────────────────────────────────────────────┐
│ Agent pattern catalog                                            │
│ 5 patterns · pick one to see full detail                          │
│                                                                  │
│ Pick a pattern:                                                   │
│  [ Linear ] [ ReAct ] [ Hierarchical ] [ Reflexion ] [ Multi ]  │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ SINGLE-AGENT ITERATIVE (ReAct)        production-ready       │ │
│ │                                                                │ │
│ │ Description:                                                  │ │
│ │ One agent looping until it decides to stop. Each iteration   │ │
│ │ produces a Thought, an Action, and consumes an Observation.. │ │
│ │                                                                │ │
│ │ Diagram:                                                       │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │                                                            │ │ │
│ │ │   Prompt ──▶ [Agent (loop)] ──action──▶ Tools             │ │ │
│ │ │                  ▲                  │                       │ │ │
│ │ │                  └── observation ───┘                       │ │ │
│ │ │                  │                                          │ │ │
│ │ │                  └── final ──▶ Output                       │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ Use cases:                                                    │ │
│ │  • Multi-step tasks with unknown depth                       │ │
│ │  • Tool-chain composition                                    │ │
│ │  • Coding assistants (Claude Code, Cursor)                   │ │
│ │  • Customer support                                          │ │
│ │                                                                │ │
│ │ Tradeoffs:                                                    │ │
│ │  ✓ Handles arbitrary-depth tasks                              │ │
│ │  ✓ Self-correcting                                            │ │
│ │  ✗ Variable latency                                           │ │
│ │  ✗ Can loop unboundedly without limits                        │ │
│ │                                                                │ │
│ │ Example task:                                                 │ │
│ │ "Find the population of Bhutan, look up its area, compute    │ │
│ │ density."                                                     │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Quick comparison row:                                            │
│ ┌──────────┬──────┬──────────┬──────────┬──────────────────┐ │
│ │ Pattern  │ Maturity │ Complexity │ Use it when...     │ │
│ │ Linear   │ ✓✓✓    │ simple     │ one-shot tasks      │ │
│ │ ReAct    │ ✓✓✓    │ medium     │ multi-step tasks    │ │
│ │ Hier.    │ ✓✓     │ high       │ complex workflows   │ │
│ │ Reflex.  │ ✓✓     │ high       │ iterative on fail   │ │
│ │ Multi    │ ✓      │ very high  │ specialized teams   │ │
│ └──────────┴──────┴──────────┴──────────┴──────────────────┘ │
│                                                                  │
│ Pedagogical caption                                              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click pattern button → load full detail panel for that pattern (description, diagram, use cases, tradeoffs, example)
- Quick comparison row stays visible regardless — gives a persistent overview

**Visual encoding:**
- **Pattern buttons**: 5 buttons; active button in cyan
- **Maturity badge** in detail panel header: emerald (production), cyan (production-narrow), amber (experimental), violet (preview)
- **SVG diagram**: nodes color-coded by role; edges with optional labels; loop edges rendered as curved arrows; renders inside a bordered container
- **Use cases**: bulleted list
- **Tradeoffs**: two-column grid (Pros emerald-tinted, Cons rose-tinted)
- **Example task**: monospace quoted text
- **Quick comparison row**: compact table; clicking a row also selects that pattern

#### A.3 `AgentPatternCatalog.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  PATTERNS, MATURITY, ROLE_COLORS,
  type AgentPattern, type DiagramNode, type DiagramEdge,
} from './pattern-data';
import styles from './AgentPatternCatalog.module.css';

const VIEW_W = 700;
const VIEW_H = 300;
const NODE_W = 90;
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
  
  const x1 = nodeX(from);
  const y1 = nodeY(from);
  const x2 = nodeX(to);
  const y2 = nodeY(to);
  
  if (edge.loop) {
    // Curved path for loop edges
    const dx = x2 - x1;
    const dy = y2 - y1;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    // Offset perpendicular to the line
    const len = Math.sqrt(dx * dx + dy * dy);
    const offsetX = -dy / len * 38;
    const offsetY = dx / len * 38;
    const cx = midX + offsetX;
    const cy = midY + offsetY;
    return {
      d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
      labelX: cx,
      labelY: cy,
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


function PatternDiagram({ pattern }: { pattern: AgentPattern }) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, DiagramNode>();
    pattern.diagram.nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [pattern]);

  const edgePaths = useMemo(() => {
    return pattern.diagram.edges
      .map(e => ({ ...buildEdgePath(e, nodeMap)!, edge: e }))
      .filter(Boolean);
  }, [pattern, nodeMap]);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={styles.diagramSvg}
      role="img"
      aria-label={`Diagram of ${pattern.label}`}
    >
      {/* Arrowhead marker */}
      <defs>
        <marker
          id="arrowhead"
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
            markerEnd="url(#arrowhead)"
          />
          {ep.label && (
            <text x={ep.labelX} y={ep.labelY} className={styles.edgeLabel}>
              {ep.label}
            </text>
          )}
        </g>
      ))}

      {/* Nodes */}
      {pattern.diagram.nodes.map(node => {
        const x = nodeX(node);
        const y = nodeY(node);
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


export default function AgentPatternCatalog() {
  const [idx, setIdx] = useState(1);  // default to ReAct (most central pattern)
  const pattern = PATTERNS[idx]!;
  const maturity = MATURITY[pattern.maturity];

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Agent pattern catalog</div>
        <div className={styles.titleSubLabel}>
          {PATTERNS.length} patterns · pick one for full detail
        </div>
      </div>

      {/* Picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a pattern:</span>
          <div className={styles.patternButtons}>
            {PATTERNS.map((p, i) => (
              <button
                key={p.id}
                className={`${styles.patternButton} ${idx === i ? styles.patternButtonActive : ''}`}
                style={{ borderLeftColor: MATURITY[p.maturity].color }}
                onClick={() => setIdx(i)}
              >{p.shortLabel}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{pattern.label.toUpperCase()}</div>
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

        <div className={styles.descriptionText}>{pattern.description}</div>

        {/* Diagram */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Diagram</div>
          <div className={styles.diagramContainer}>
            <PatternDiagram pattern={pattern} />
          </div>
        </div>

        {/* Use cases */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Use cases</div>
          <ul className={styles.useCases}>
            {pattern.useCases.map((u, i) => (
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
                {pattern.tradeoffs.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div className={styles.tradeoffColumn}>
              <div className={styles.tradeoffHeader}>Cons</div>
              <ul className={`${styles.tradeoffList} ${styles.tradeoffCons}`}>
                {pattern.tradeoffs.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Example task */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Example task</div>
          <div className={styles.exampleTaskBox}>{pattern.exampleTask}</div>
        </div>
      </div>

      {/* Quick comparison row */}
      <div className={styles.comparisonPanel}>
        <div className={styles.sectionLabel}>Quick comparison</div>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Maturity</th>
              <th>Complexity</th>
              <th>Use it when...</th>
            </tr>
          </thead>
          <tbody>
            {PATTERNS.map((p, i) => (
              <tr
                key={p.id}
                className={i === idx ? styles.comparisonRowActive : ''}
                onClick={() => setIdx(i)}
                style={{ cursor: 'pointer' }}
              >
                <td>{p.shortLabel}</td>
                <td>
                  <span
                    className={styles.maturityDot}
                    style={{ background: MATURITY[p.maturity].color }}
                  />
                  {MATURITY[p.maturity].label}
                </td>
                <td>{
                  p.id === 'single-linear'  ? 'simple' :
                  p.id === 'react-iterative' ? 'medium' :
                  p.id === 'hierarchical'    ? 'high' :
                  p.id === 'reflexion'       ? 'high' : 'very high'
                }</td>
                <td>{
                  p.id === 'single-linear'  ? 'one-shot tasks' :
                  p.id === 'react-iterative' ? 'multi-step tasks' :
                  p.id === 'hierarchical'    ? 'complex workflows' :
                  p.id === 'reflexion'       ? 'iterative on failure' : 'specialized teams'
                }</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        <strong>"Agent" isn't one architecture</strong> — it's a family of them. <strong>Linear</strong>{' '}
        for simple one-shots; <strong>ReAct</strong> as the modern default for multi-step tasks;{' '}
        <strong>Hierarchical</strong> when planning matters; <strong>Reflexion</strong> when you can
        get failure signal; <strong>Multi-agent</strong> when specialization helps. <strong>Most
        production agents are single-agent (linear or ReAct)</strong> — multi-agent earns its keep
        only when the task truly decomposes. Chapter 28 builds these in real code; Chapter 29 dives
        deep into multi-agent.
      </div>
    </div>
  );
}
```

#### A.4 `AgentPatternCatalog.module.css`

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
  min-width: 110px;
  padding-top: 0.45rem;
}
.patternButtons { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; }
.patternButton {
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
.patternButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.patternButtonActive {
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
  font-size: 0.74rem;
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
.tradeoffPros li { color: var(--text-primary); }
.tradeoffCons li { color: var(--text-primary); }

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

/* Comparison panel */
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
  .nodeLabel { font-size: 0.62rem; }
  .edgeLabel { font-size: 0.55rem; }
  .comparisonTable { font-size: 0.7rem; }
  .comparisonTable th, .comparisonTable td { padding: 0.35rem 0.4rem; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as AgenticLoopVisualizer } from './ch27-agent-foundations/AgenticLoopVisualizer';
export { default as AgentPatternCatalog }   from './ch27-agent-foundations/AgentPatternCatalog';
```

#### A.6 Update `src/pages/ch27-agent-foundations/index.mdx`

**Edit A: Update widget import:**

```mdx
import { AgenticLoopVisualizer, AgentPatternCatalog } from '@components/widgets';
```

**Edit B: Replace section-6's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Agent pattern catalog" caption="Five agent patterns visualized side-by-side: single-agent linear (one-shot), single-agent iterative (ReAct), hierarchical (planner-executor), Reflexion (self-critique), and multi-agent (Ch 29 preview). Each shows a small diagram, use cases, pros/cons, and a maturity badge. Demonstrates that 'agent' isn't one architecture but a family of them — and the choice matters. Bridges Ch 27 (conceptual) toward Ch 28 (engineering).">
  <AgentPatternCatalog client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("The agentic stack today") and section 8 ("Phase 15 opens — chapter map"). Use this structure:

````mdx
## Exercises

Four exercises that lock in agent foundations. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

The exercises trace the chapter's arc: build a minimal ReAct agent (Ex 1) → add Reflexion-style memory (Ex 2) → add error handling with retries (Ex 3) → design your own agent for a given task (Ex 4). After these, the reader is ready for Ch 28's engineering deep-dive.

### Exercise 1 (easy) — Minimal ReAct agent

Implement a minimal ReAct agent that loops over a task, calling tools and parsing thought/action output until it produces a final answer.

<details>
<summary>Hint</summary>

The ReAct loop structure:
1. Maintain a `history` list of strings
2. Each iteration: pass history to the LLM; parse Thought + Action
3. If Action is `final_answer(...)`, return its content
4. Otherwise: execute the action via the tools dict; append observation to history
5. Cap iterations to prevent runaway loops

Real implementations use JSON / function-calling instead of regex parsing — but the loop structure is identical.

</details>

<RunnableCode
  client:visible
  defaultCode={`import re

# Mock tools — real agents use actual APIs
def tool_weather(city):
    return f"18°C, partly cloudy in {city}"

def tool_date():
    return "2025-05-22"

TOOLS = {'weather': tool_weather, 'date': tool_date}


def mock_llm(prompt):
    """
    Mock LLM that produces ReAct-style output based on the history.
    Real implementation: call Claude/GPT-4 with a system prompt
    requesting Thought/Action format.
    """
    if 'weather' in prompt.lower() and 'Tokyo' not in prompt:
        return 'Thought: I should check the weather.\\nAction: weather("Tokyo")'
    if 'Tokyo' in prompt and '2025' not in prompt:
        return 'Thought: Now I need the date.\\nAction: date()'
    if '2025-05-22' in prompt:
        return 'Thought: I have everything.\\nAction: final_answer("Today (May 22, 2025) in Tokyo: 18°C, partly cloudy.")'
    return 'Action: final_answer("Unable to complete.")'


def parse_react(text):
    """Extract thought and action from LLM output."""
    thought_match = re.search(r'Thought:\\s*(.+?)(?=\\nAction:|$)', text, re.DOTALL)
    action_match = re.search(r'Action:\\s*(.+?)(?=\\n|$)', text, re.DOTALL)
    return (
        thought_match.group(1).strip() if thought_match else '',
        action_match.group(1).strip() if action_match else '',
    )


def execute_action(action_str, tools):
    """Parse 'tool_name(args)' and execute."""
    match = re.match(r'(\\w+)\\((.*)\\)', action_str)
    if not match:
        return f"Error: malformed action"
    tool_name, args = match.group(1), match.group(2).strip().strip('"').strip("'")
    if tool_name == 'final_answer':
        return None
    if tool_name not in tools:
        return f"Error: unknown tool '{tool_name}'"
    return tools[tool_name](args) if args else tools[tool_name]()


def react_agent(task, tools=TOOLS, max_iterations=8):
    """
    Run a ReAct agent on the task.
    Returns the final answer string (or "Max iterations reached.").
    """
    history = [f"Task: {task}"]
    
    # TODO:
    # For each iteration up to max_iterations:
    #   1. prompt = '\\n'.join(history)
    #   2. response = mock_llm(prompt)
    #   3. thought, action = parse_react(response)
    #   4. Append 'Thought: {thought}' and 'Action: {action}' to history
    #   5. Print thought and action
    #   6. If action starts with 'final_answer':
    #        - Extract the answer using regex on action
    #        - Return the extracted answer
    #   7. Else:
    #        - observation = execute_action(action, tools)
    #        - Append 'Observation: {observation}' to history
    #        - Print observation
    # If loop completes without final_answer, return "Max iterations reached."
    pass


# Test
# result = react_agent("What's the weather in Tokyo, and what date is it today?")
# print(f"\\n=== Final answer: {result}")
# 
# # Observations:
# # - Each iteration appends 2-3 lines to history (Thought, Action, [Observation])
# # - max_iterations prevents runaway loops
# # - Real agents use structured output (JSON) instead of regex
# # - The loop pattern is identical regardless of LLM provider
`}
  packages={[]}
/>

### Exercise 2 (medium) — Agent with Reflexion-style memory

Add a Reflexion-style memory that captures verbal critiques after failures and feeds them into future attempts.

<details>
<summary>Hint</summary>

The Reflexion pattern:
1. Agent attempts a task
2. If it fails (e.g., test doesn't pass), agent writes a verbal reflection ("what I did wrong, what to try next")
3. On retry, the reflection is added to the system prompt
4. Each subsequent attempt sees all prior reflections

For this exercise, mock the "verifier" with a hardcoded pass/fail. Real Reflexion uses programmatic verification (test results, compiler errors, etc.).

</details>

<RunnableCode
  client:visible
  defaultCode={`# Reflexion-style agent: retry with verbal reflections after failures.

class ReflectiveAgent:
    def __init__(self):
        self.reflections = []  # List of verbal critiques from prior attempts
    
    def attempt(self, task, attempt_number):
        """
        Attempt to solve the task.
        Returns (answer, did_succeed).
        Real implementation: call LLM with task + accumulated reflections.
        """
        # Build a system prompt with prior reflections
        reflection_context = ""
        if self.reflections:
            reflection_context = "Lessons from prior attempts:\\n" + "\\n".join(
                f"  Attempt {i+1}: {r}" for i, r in enumerate(self.reflections)
            )
        
        print(f"\\n=== Attempt {attempt_number}")
        if reflection_context:
            print(reflection_context)
        
        # Mock: succeed only after 2 reflections (3rd attempt)
        if len(self.reflections) >= 2:
            return f"Solution to '{task}'", True
        else:
            return f"Failed attempt at '{task}'", False
    
    def reflect_on_failure(self, task, failed_attempt):
        """
        Write a verbal reflection after a failed attempt.
        Real implementation: ask the LLM to write a critique of its own attempt.
        """
        # TODO:
        # Generate a reflection based on the attempt number.
        # For demo, use canned reflections:
        #   attempt 1 -> "I tried X but it didn't work. Next time I should try Y."
        #   attempt 2 -> "Y was closer but still wrong. The actual issue is Z."
        # Append the reflection to self.reflections
        pass


def reflexion_run(task, max_attempts=4):
    """Run an agent with Reflexion until success or max_attempts."""
    agent = ReflectiveAgent()
    
    for attempt in range(1, max_attempts + 1):
        result, succeeded = agent.attempt(task, attempt)
        if succeeded:
            print(f"\\n✓ Succeeded on attempt {attempt}: {result}")
            return result, attempt
        
        print(f"  Result: {result}")
        agent.reflect_on_failure(task, result)
        print(f"  Reflection added: {agent.reflections[-1]}")
    
    print(f"\\n✗ Failed after {max_attempts} attempts.")
    return None, max_attempts


# Test
# task = "Compute the area of a circle with radius 5 to 2 decimal places."
# result, attempts = reflexion_run(task)
# 
# # Observations:
# # - Reflections accumulate across attempts
# # - Each attempt sees all prior reflections in context
# # - Real Reflexion: LLM writes its own reflections about its own attempts
# # - Pattern works best with verifiable signals (tests, compilation, evaluation)
# # - SWE-bench-style agents use Reflexion for iterative bug fixing
`}
  packages={[]}
/>

### Exercise 3 (medium) — Error handling with retry

Add robust error handling to an agent: catch tool failures, retry with exponential backoff, and gracefully fall back when retries are exhausted.

<details>
<summary>Hint</summary>

The error handling pattern:
1. Wrap tool calls in try/except
2. On exception, retry with exponential backoff (1s, 2s, 4s...)
3. After max retries, return a structured error
4. The agent should be able to continue (try a different tool, or report failure)

Real production agents also use: circuit breakers (stop hitting a failing tool entirely after N failures), fallback tools, and structured error categorization (retryable vs not).

</details>

<RunnableCode
  client:visible
  defaultCode={`import random
import time


def flaky_search_tool(query):
    """A search tool that fails 40% of the time."""
    if random.random() < 0.4:
        raise ConnectionError("Search service unavailable")
    return f"Mock search results for: {query}"


def flaky_calculator(expression):
    """A calculator that fails 20% of the time."""
    if random.random() < 0.2:
        raise TimeoutError("Calculator timed out")
    return eval(expression)


TOOLS = {
    'search': flaky_search_tool,
    'calc':   flaky_calculator,
}


def execute_with_retry(tool, args, max_retries=3, base_wait=0.001):
    """
    Execute a tool with exponential-backoff retry.
    Returns (result, error_message). One of these is None.
    """
    # TODO:
    # For attempt in range(max_retries):
    #   try:
    #     return (tool(args), None)
    #   except Exception as e:
    #     wait = base_wait * (2 ** attempt)
    #     time.sleep(wait)
    # Return (None, f"Failed after {max_retries} attempts")
    pass


def robust_agent(plan):
    """
    Execute a plan (list of (tool_name, args) steps) with error handling.
    Returns list of (step_result, error) tuples.
    """
    results = []
    for i, (tool_name, args) in enumerate(plan):
        print(f"\\nStep {i+1}: {tool_name}({args!r})")
        if tool_name not in TOOLS:
            print(f"  ✗ Unknown tool '{tool_name}'")
            results.append((None, f"Unknown tool: {tool_name}"))
            continue
        
        result, error = execute_with_retry(TOOLS[tool_name], args)
        if error:
            print(f"  ⚠️  {error}")
            results.append((None, error))
        else:
            print(f"  ✓ {result}")
            results.append((result, None))
    
    return results


# Test
random.seed(42)

plan = [
    ('search', 'Bhutan population'),
    ('search', 'Bhutan area km'),
    ('calc',   '787000 / 38394'),
    ('search', 'population density meaning'),  # may fail flakily
]

results = robust_agent(plan)
successes = sum(1 for r, e in results if r is not None)
print(f"\\n=== Summary: {successes}/{len(plan)} steps succeeded ===")

# Observations:
# - Exponential backoff: waits 1s, 2s, 4s between retries (scaled down here for demo)
# - Some retries will succeed; others exhaust budget
# - Robust agents continue after errors instead of crashing
# - Production: circuit breakers, fallback tools, error categorization
`}
  packages={[]}
/>

### Exercise 4 (hard) — Design-your-own-agent

For each of three different tasks, pick the most appropriate agent pattern and justify your choice. Implement a sketch of one of them.

<details>
<summary>Hint</summary>

The mapping from task → pattern:
- **One-shot lookups** → Linear
- **Multi-step tasks of unknown depth** → ReAct iterative
- **Complex workflows that benefit from planning** → Hierarchical
- **Tasks with verifiable feedback** → Reflexion
- **Tasks that genuinely decompose into specialized roles** → Multi-agent

Each task below has a "right" pattern (not unique — multiple can work). Read the task carefully; what does it require?

</details>

<RunnableCode
  client:visible
  defaultCode={`# Three tasks. For each, pick the agent pattern that fits best.

TASKS = [
    {
        'name': 'task_1',
        'description': "Look up today's date and tell me what day of the week it is.",
        # Pattern: Linear (single tool call + format)
        'recommended_pattern': 'linear',
    },
    {
        'name': 'task_2',
        'description': "Find the population of Bhutan, look up its area, then compute the population density per square kilometer.",
        # Pattern: ReAct iterative (chained tool calls)
        'recommended_pattern': 'react',
    },
    {
        'name': 'task_3',
        'description': "Write a Python function that passes these 5 test cases. If it fails any, fix it and try again.",
        # Pattern: Reflexion (verifiable feedback + iteration)
        'recommended_pattern': 'reflexion',
    },
]


def choose_pattern(task_description):
    """
    Return a string: one of 'linear', 'react', 'hierarchical', 'reflexion', 'multi-agent'.
    Reasoning heuristic based on task characteristics.
    """
    # TODO:
    # Apply the following heuristics (in order):
    # 1. If the task mentions "fix", "retry", "test", "iterate" → 'reflexion'
    # 2. If the task is "look up X and report" (one fact, one tool) → 'linear'
    # 3. If the task is a multi-step chain ("find X, then Y, then compute Z") → 'react'
    # 4. If the task says "plan", "build", "design a full system" → 'hierarchical'
    # 5. If the task explicitly needs roles ("a researcher, a critic, a writer") → 'multi-agent'
    # 6. Default fallback → 'react'
    pass


def sketch_react_for_task_2():
    """
    Implement a sketch of a ReAct agent for task 2 (population density).
    Returns the final answer string.
    """
    # Mock data
    population = 787000
    area = 38394
    
    # TODO:
    # Simulate the 4-turn ReAct trace:
    #   Turn 1: think → search_population_bhutan → 787000
    #   Turn 2: think → search_area_bhutan → 38394
    #   Turn 3: think → calculator(787000 / 38394) → 20.50
    #   Turn 4: think → final_answer
    # Print the trace; return the final answer string.
    pass


# Run
print("=== Pattern recommendations ===\\n")
for task in TASKS:
    chosen = choose_pattern(task['description'])
    correct = chosen == task['recommended_pattern']
    marker = '✓' if correct else '✗'
    print(f"{task['name']}: {task['description'][:60]}...")
    print(f"  Chosen: {chosen}    {marker} (expected: {task['recommended_pattern']})\\n")

# Run sketch for task 2
# print("=== Sketch: ReAct agent for task 2 ===\\n")
# answer = sketch_react_for_task_2()
# print(f"\\nFinal answer: {answer}")

# Observations:
# - Pattern choice depends on task structure
# - Reflexion needs verifiable feedback (tests, compilation, evaluation)
# - Multi-agent is rarely the best choice unless roles are genuinely distinct
# - Most production tasks land in Linear or ReAct
# - The choice is engineering judgment, not algorithmic
`}
  packages={[]}
/>

````

### Part C — Flip Ch 27's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 27, slug: 'ch27-agent-foundations', title: 'Agent foundations', partNum: 9, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 27 still render correctly (no changes to existing sections).
3. **Section 3's** `AgenticLoopVisualizer` marquee widget still renders correctly.
4. **Section 6** now renders the working `AgentPatternCatalog` widget.
5. **Default state**: ReAct iterative selected (idx = 1); detail panel populated with description, diagram, use cases, tradeoffs, example.
6. **Five pattern buttons**: Linear / ReAct / Hierarchical / Reflexion / Multi. Active button cyan.
7. **Maturity badge color coding**: production-ready (emerald), production-narrow (cyan), preview (violet).
8. **SVG diagram**: nodes color-coded by role (input=secondary, agent/planner/executor=cyan, tool=amber, memory=violet, output=emerald, critic=rose, specialist=violet); edges rendered with arrowheads; loop edges curved + dashed cyan.
9. **Use cases**: bulleted list rendered with cyan bullet markers.
10. **Tradeoffs**: 2-column grid (Pros emerald ✓, Cons rose ✗).
11. **Example task**: italicized monospace text in a quoted box.
12. **Quick comparison table**: 5 rows; active row highlighted in cyan; clicking any row selects that pattern.
13. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
14. **Sidebar**: Ch 1-27 all active (published); Ch 28-30 still dimmed.
15. **Prev/next at bottom of Ch 27**: prev = Ch 26 (active); next = Ch 28 (disabled).
16. **TOC**: includes Exercises as h2 between section 7 and section 8.
17. **Mobile** (< 720px): tradeoffs stack vertically; comparison table compacts; diagram remains legible (smaller text).
18. **`npm run typecheck`** passes.
19. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not call a real LLM in any code.** Mock implementations only.
- ❌ **Do not animate the diagrams.** Static SVG only.
- ❌ **Do not implement multi-agent in depth.** That's Ch 29.
- ❌ **Do not flip any other chapter's status.** Only Ch 27 flips.
- ❌ **Do not modify Ch 1-26.** Sealed.
- ❌ **Do not modify Ch 27's marquee widget or prose sections 1-8.** Sealed.

---

## Wire-up

```bash
git add src/components/widgets/ch27-agent-foundations/AgentPatternCatalog.tsx src/components/widgets/ch27-agent-foundations/AgentPatternCatalog.module.css src/components/widgets/ch27-agent-foundations/pattern-data.ts src/components/widgets/index.ts src/pages/ch27-agent-foundations/index.mdx src/lib/chapters.ts
git commit -m "session 120: Ch 27 closeout — agent pattern catalog + exercises + status: published. Phase 15 has its first published chapter."
git push origin main
```

---

## Ch 27 closeout — Phase 15's first chapter

Chapter 27 is now the twenty-seventh complete chapter on production. **Phase 15 has its first published chapter.** The composition arc has begun.

Confirm before declaring Ch 27 done:

- ✅ BUILD_ORDER.md shows files 150-153 ✅
- ✅ File 154 marked ⏭️ (absorbed for 4-file cadence)
- ✅ Ch 27 status is `'published'`
- ✅ Both Ch 27 widgets work in production
- ✅ All 4 Ch 27 exercises render with their starter code

**Cadence check across 27 chapters:**

**4-file cadence** holds for **21 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, **27**).
**5-file cadence** holds for **6 two-topic chapters** (Ch 1, 5, 8, 9, 14, 20).

**27-chapter pattern stable. Phase 15 status:**
- ✅ Ch 27 (Agent foundations) — conceptual: what an agent is, the loop, ReAct, AutoGPT, patterns
- ⬜ Ch 28 (Agents from scratch) — opens next; engineering deep-dive
- ⬜ Ch 29 (Multi-agent) — orchestration
- ⬜ Ch 30 (Agent eval and frameworks) — closes the curriculum

**Three chapters remain. The curriculum's end is in sight.**

---

## Notes for the session author

**On the 5 patterns spanning the agent design space:**

| Pattern | Maturity | Complexity | Best for |
|---------|----------|------------|----------|
| **Linear** | production | simple | one-shot tasks |
| **ReAct** | production | medium | multi-step tasks |
| **Hierarchical** | production-narrow | high | complex workflows |
| **Reflexion** | production-narrow | high | iterative on failure |
| **Multi-agent** | preview (Ch 29) | very high | specialized teams |

Notes-for-author: "**The five patterns are intentionally ordered from simplest to most complex.** Linear is the default for most tasks; ReAct is the modern reference; the others apply in specific cases. **Most production agents use Linear or ReAct** — multi-agent is overhyped relative to its production usage."

**On the SVG diagrams as the central teaching:**
Each pattern has a small node-and-arrow diagram with color-coded roles. Notes-for-author: "**The diagrams make architectural differences visible.** Reader's eye picks up that Linear is straight-through, ReAct loops, Hierarchical has two stages, Reflexion has a feedback path, Multi-agent has parallel specialists. **Visual literacy in agent architectures earned in 60 seconds.**"

**On color coding being consistent across diagrams:**
- **Cyan**: agent / planner / executor (the LLM controller in any role)
- **Amber**: tools (where actions happen)
- **Violet**: memory and specialists
- **Emerald**: output (success)
- **Rose**: critic (the role that produces critique)

Notes-for-author: "**Reader sees the same color = same role across diagrams.** Cyan is always the LLM doing work; amber is always a tool; violet is always state or specialization. **Color literacy reinforces architectural literacy.**"

**On maturity badges being honest:**
- **Production-ready** (emerald): Linear, ReAct — used widely in production today
- **Production-narrow** (cyan): Hierarchical, Reflexion — work for specific use cases
- **Preview** (violet): Multi-agent — covered in Ch 29; hyped but underused in production

Notes-for-author: "**Maturity badges are calibration tools.** The 2023 hype around multi-agent often suggested it was the future; the 2025 reality is that single-agent setups dominate production. **The widget should reflect this honestly without dismissing multi-agent's potential.**"

**On the quick comparison table being a persistent overview:**
The 5-row table at the bottom stays visible as a navigator. **Reader can pick by row or by button.** Notes-for-author: "**The table is the architecture cheat sheet.** A reader who skims everything else still leaves with the table burned in: 5 patterns, their maturity, their complexity, when to use each."

**On the four exercises spanning the agent toolkit:**

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | Minimal ReAct agent | 3 (implement ReAct) |
| 2 | medium | Reflexion-style memory | 5 (memory) |
| 3 | medium | Error handling with retry | 6 (anti-patterns and defenses) |
| 4 | hard | **Design-your-own-agent** | 6, 8 (pattern selection + chapter map) |

Notes-for-author: "**The progression: build the loop → add memory → add resilience → design for new tasks.** Each exercise targets a specific Ch 27 outcome. **By the end, the reader has implemented a complete agent toolkit and can choose patterns for new problems.**"

**On Ex 4 (design-your-own-agent) being the chapter's most production-relevant exercise:**
Engineers choosing patterns for real tasks need to develop this judgment. The heuristic in the hint maps task characteristics to patterns. Notes-for-author: "**Ex 4 is the chapter's most production-relevant exercise.** Real engineers face this decision constantly: which pattern fits my task? **The exercise gives them a heuristic** — keywords in the task description map to pattern choices."

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Define agent operationally | (chapter prose + section 1) |
| 2. Diagram the agentic loop | (section 2 prose + ascii) |
| 3. Implement a minimal ReAct agent | Ex 1 |
| 4. Articulate AutoGPT's significance | (section 4 prose) |
| 5. When to use short-term vs long-term memory | Ex 2 + section 5 |
| 6. Recognize common patterns and anti-patterns | Ex 3 + Ex 4 + section 6 widget |
| 7. Name the 2025 agentic stack | (section 7 prose) |
| 8. Locate within Phase 15 | Ex 4 + section 8 |

Outcomes 3, 5, 6, 8 served by exercises directly. Outcomes 1, 2, 4, 7 served by chapter prose + widgets.

**On Ch 27 being Phase 15's foundations chapter:**
Ch 27 is conceptual; Ch 28 is engineering. **The widget's pattern catalog explicitly bridges them**: reader leaves Ch 27 with vocabulary; enters Ch 28 ready to build. Notes-for-author: "**Section 6's pattern catalog is the natural handoff to Ch 28.** Reader has seen the patterns; Ch 28 will show how to build them."

**Pedagogical claim of the chapter (revisited):**
"An agent is an LLM acting as a controller in a loop with an environment. **ReAct** (Yao 2022) is the foundational pattern. **AutoGPT** demonstrated both promise and limits; the 2025 stack runs on its lessons (bounded autonomy, structured tools, memory, planner-executor). **Memory and state** turn single-shot loops into persistent agents. **Five patterns** cover most production use cases — Linear, ReAct, Hierarchical, Reflexion, Multi-agent — with Linear and ReAct dominating real deployments. **Bounded autonomy with human oversight** is the 2025 production framing. **The capability is the loop, not the model.** Ch 28 builds these patterns in real code."

**Phase 15 progress after this session**:
- ✅ Ch 27 Agent foundations
- ⬜ Ch 28 Agents from scratch
- ⬜ Ch 29 Multi-agent
- ⬜ Ch 30 Agent eval and frameworks (closes the curriculum)

**Three chapters remain.**

Build with care. **This file closes the foundations chapter and prepares the reader for Ch 28's engineering deep-dive.**
