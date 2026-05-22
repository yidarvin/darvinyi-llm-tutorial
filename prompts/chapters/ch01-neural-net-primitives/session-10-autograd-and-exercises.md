# Session 10 — Autograd visualizer + exercises + Ch 1 closeout

> Final Chapter 1 session. Three deliverables: the autograd-graph widget for section 8 (a small DAG of `Value` nodes showing forward then backward traversal with `_backward` closures revealed on hover), an Exercises section at chapter end with 4 problems of varying difficulty, and the status flip from `'draft'` to `'published'`. **End of Phase 3 — validates the chapter pattern at Checkpoint C before the same pattern is applied to chapters 2–30.**

---

## Read first (in this order)

1. **`research/ch01-neural-net-primitives/research.md`** — for the micrograd reference, the autograd section, and misconception MC1 ("autograd is not symbolic differentiation")
2. **`prompts/chapters/ch01-neural-net-primitives/session-07-page-structure.md`** — for the section-8 widget placeholder this session fills, and where exercises will be inserted (after section 8, before the chapter close)
3. **`prompts/chapters/ch01-neural-net-primitives/session-08-backprop-visualizer.md`** and **`session-09-mlp-runnable.md`** — for the widget conventions established by the first two Ch 1 widgets; this session follows them
4. **`prompts/scaffolding/session-05-pyodide-runnable-code.md`** — for how `<RunnableCode>` blocks work; exercises use them
5. **`MASTER_PLAN.md`** — for Checkpoint C's exit criteria and the cadence shift to chapter sessions

---

## Goal

By end of session:

1. **Section 8's `<WidgetFrame>` placeholder is filled** with the autograd-graph widget — a 6-node DAG showing scalar autograd in action, with each node's `_backward` closure revealed on hover
2. **An "Exercises" section is appended** to `index.mdx`, before the chapter close, containing 4 exercises (easy → hard) with hints and starter `<RunnableCode>` blocks
3. **Ch 1's `status` in `chapters.ts` flips from `'draft'` to `'published'`** — activating the landing-page CTA ("Start with Chapter 1 →") and signaling Phase 3 complete
4. **The chapter renders end-to-end as a complete deliverable** that someone could read, run code in, and learn from

This is the final session of Phase 3. After it, the chapter pattern is validated: research file → page structure → marquee widget → secondary widget → final widget + exercises + status flip. Chapters 2–30 follow the same shape.

---

## Inputs

State of the repo after session 09:

- `src/components/widgets/ch01/BackpropVisualizer.{tsx,module.css}` exist (session 08)
- `src/components/widgets/ch01/TrainingCurves.{tsx,module.css}` and `training-data.ts` exist (session 09)
- `src/components/widgets/ch01/network-state.ts` exists (session 08)
- `src/components/widgets/index.ts` exports `BackpropVisualizer` and `TrainingCurves`
- `src/pages/ch01-neural-net-primitives/index.mdx` has sections 4 and 5's widgets working; section 8's widget is still stubbed
- `src/lib/chapters.ts` has Ch 1's `status` as `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch01/AutogradGraph.tsx` — the React widget
2. **Create** `src/components/widgets/ch01/AutogradGraph.module.css` — scoped styles
3. **Create** `src/components/widgets/ch01/autograd-trace.ts` — the precomputed Value-node trace + types
4. **Update** `src/components/widgets/index.ts` — add `AutogradGraph` export
5. **Update** `src/pages/ch01-neural-net-primitives/index.mdx` — three changes:
   - Replace section 8's placeholder `<WidgetFrame>` interior with `<AutogradGraph client:visible />`
   - Add new `## Exercises` section between section 8 (autograd) and the chapter close
   - Verify the chapter close is still in place after the new Exercises section
6. **Update** `src/lib/chapters.ts` — change Ch 1's `status` from `'draft'` to `'published'`

**Do NOT modify:** any other file. Do not touch sessions 08 or 09's widget files. Do not modify the chapter prose in sections 1–8 (only the section-8 widget interior changes).

---

## Detailed spec

### 1. The autograd example

The widget animates a single forward + backward pass through this micrograd-style scalar computation:

```python
a = Value(2.0)
b = Value(-3.0)
c = Value(10.0)

d = a * b          # d = -6.0
e = d + c          # e = 4.0
L = e.relu()       # L = 4.0
L.backward()       # propagates gradients back to a, b, c
```

After `L.backward()`, the gradients are:
- `L.grad = 1.0` (seed)
- `e.grad = 1.0` (from ReLU since `e > 0`)
- `d.grad = 1.0`, `c.grad = 1.0` (from add — distributes gradient equally)
- `a.grad = -3.0` (from `d = a * b`: `a.grad += b.data * d.grad = -3 * 1`)
- `b.grad = 2.0` (from `d = a * b`: `b.grad += a.data * d.grad = 2 * 1`)

These six numbers are the answers the widget builds up to. Hovering any node shows its `_backward` closure as Python code; clicking through the stages animates how the gradients flow.

### 2. `autograd-trace.ts` — the data layer

```ts
// src/components/widgets/ch01/autograd-trace.ts

export type Op = 'leaf' | '*' | '+' | 'relu';

export interface ValueNode {
  id: string;             // 'a', 'b', 'c', 'd', 'e', 'L'
  label: string;          // visible label
  op: Op;
  data: number;
  initialGrad: number;    // always 0 except L (which gets 1.0 to seed backward)
  finalGrad: number;      // after backward()
  parents: string[];      // for non-leaves: the input node ids
  // Visual coordinates within the widget's viewBox (set here, not at render time)
  x: number;
  y: number;
  // The textual representation of this node's _backward closure (shown in tooltips)
  backwardCode: string;
}

export interface AutogradTrace {
  nodes: ValueNode[];
  edges: { from: string; to: string }[];
  // Sequence of stages (0..10) for the animation:
  // 0 = idle, 1-4 = forward computations, 5-9 = backward gradient propagations, 10 = done
  stages: StageInfo[];
}

export interface StageInfo {
  description: string;     // one-line summary shown above the SVG
  highlightedNode?: string;        // which node is "active" this stage
  highlightedEdges?: string[];     // edges that flow during this stage
  showsForward?: boolean;
  showsBackward?: boolean;
  // After this stage, what value/grad updates have applied
  gradUpdates?: Record<string, number>;
  dataUpdates?: Record<string, number>;
}

export const TRACE: AutogradTrace = {
  nodes: [
    {
      id: 'a', label: 'a', op: 'leaf', data: 2.0,
      initialGrad: 0, finalGrad: -3.0,
      parents: [],
      x: 100, y: 100,
      backwardCode: '# a is a leaf — no _backward function\n# its grad accumulates from its consumers',
    },
    {
      id: 'b', label: 'b', op: 'leaf', data: -3.0,
      initialGrad: 0, finalGrad: 2.0,
      parents: [],
      x: 100, y: 250,
      backwardCode: '# b is a leaf — no _backward function',
    },
    {
      id: 'c', label: 'c', op: 'leaf', data: 10.0,
      initialGrad: 0, finalGrad: 1.0,
      parents: [],
      x: 100, y: 400,
      backwardCode: '# c is a leaf — no _backward function',
    },
    {
      id: 'd', label: 'd = a · b', op: '*', data: -6.0,
      initialGrad: 0, finalGrad: 1.0,
      parents: ['a', 'b'],
      x: 350, y: 175,
      backwardCode: `def _backward():
    a.grad += b.data * d.grad   # = -3 * 1 = -3
    b.grad += a.data * d.grad   # =  2 * 1 =  2`,
    },
    {
      id: 'e', label: 'e = d + c', op: '+', data: 4.0,
      initialGrad: 0, finalGrad: 1.0,
      parents: ['d', 'c'],
      x: 550, y: 287,
      backwardCode: `def _backward():
    d.grad += 1.0 * e.grad   # = 1 * 1 = 1
    c.grad += 1.0 * e.grad   # = 1 * 1 = 1`,
    },
    {
      id: 'L', label: 'L = relu(e)', op: 'relu', data: 4.0,
      initialGrad: 1.0, finalGrad: 1.0,
      parents: ['e'],
      x: 750, y: 287,
      backwardCode: `def _backward():
    # ReLU passes gradient through if input > 0, else zeros it
    e.grad += (1.0 if e.data > 0 else 0.0) * L.grad
    # e.data = 4 > 0, so: e.grad += 1 * 1 = 1`,
    },
  ],
  edges: [
    { from: 'a', to: 'd' },
    { from: 'b', to: 'd' },
    { from: 'd', to: 'e' },
    { from: 'c', to: 'e' },
    { from: 'e', to: 'L' },
  ],
  stages: [
    // 0: idle — nodes shown with empty data fields (leaves keep their values)
    {
      description: 'Start: leaves a, b, c have values. Forward pass will compute d, e, L.',
    },
    // 1: compute d = a * b
    {
      description: 'd = a · b = 2 · (-3) = -6',
      highlightedNode: 'd',
      highlightedEdges: ['a-d', 'b-d'],
      showsForward: true,
      dataUpdates: { d: -6.0 },
    },
    // 2: compute e = d + c
    {
      description: 'e = d + c = -6 + 10 = 4',
      highlightedNode: 'e',
      highlightedEdges: ['d-e', 'c-e'],
      showsForward: true,
      dataUpdates: { e: 4.0 },
    },
    // 3: compute L = relu(e)
    {
      description: 'L = relu(e) = relu(4) = 4',
      highlightedNode: 'L',
      highlightedEdges: ['e-L'],
      showsForward: true,
      dataUpdates: { L: 4.0 },
    },
    // 4: backward seed — L.grad = 1
    {
      description: 'Seed: L.grad = 1 (we always start backward by setting the output gradient to 1)',
      highlightedNode: 'L',
      showsBackward: true,
      gradUpdates: { L: 1.0 },
    },
    // 5: L._backward — e.grad += 1 * 1 = 1 (relu's _backward, since e > 0)
    {
      description: 'L._backward(): e.grad += 1 · L.grad = 1 (ReLU passes gradient through since e > 0)',
      highlightedNode: 'e',
      highlightedEdges: ['e-L'],
      showsBackward: true,
      gradUpdates: { e: 1.0 },
    },
    // 6: e._backward — d.grad += 1 * 1; c.grad += 1 * 1
    {
      description: 'e._backward(): d.grad += 1 · e.grad = 1, c.grad += 1 · e.grad = 1 (add distributes gradient equally)',
      highlightedNode: 'd',
      highlightedEdges: ['d-e', 'c-e'],
      showsBackward: true,
      gradUpdates: { d: 1.0, c: 1.0 },
    },
    // 7: d._backward — a.grad += b.data * d.grad; b.grad += a.data * d.grad
    {
      description: 'd._backward(): a.grad += b.data · d.grad = -3, b.grad += a.data · d.grad = 2',
      highlightedNode: 'a',
      highlightedEdges: ['a-d', 'b-d'],
      showsBackward: true,
      gradUpdates: { a: -3.0, b: 2.0 },
    },
    // 8: done
    {
      description: 'Backward complete. All gradients computed by walking the graph in reverse topological order.',
    },
  ],
};

// Cumulative state at a given stage: starting from initial state, apply all updates up to and including this stage
export function stateAtStage(stage: number): { data: Record<string, number>; grads: Record<string, number> } {
  const data: Record<string, number> = {};
  const grads: Record<string, number> = {};
  for (const n of TRACE.nodes) {
    data[n.id] = n.op === 'leaf' ? n.data : NaN;
    grads[n.id] = n.id === 'L' && stage >= 4 ? 1.0 : 0;
  }
  for (let i = 0; i <= stage && i < TRACE.stages.length; i++) {
    const s = TRACE.stages[i]!;
    if (s.dataUpdates) for (const [k, v] of Object.entries(s.dataUpdates)) data[k] = v;
    if (s.gradUpdates) for (const [k, v] of Object.entries(s.gradUpdates)) grads[k] = v;
  }
  return { data, grads };
}

export const TOTAL_STAGES = TRACE.stages.length - 1; // 8 (last index)
```

**Notes:**
- The trace is a static, hand-authored sequence — no JS-side autograd implementation needed. This widget *illustrates* autograd; it doesn't *implement* it. The chapter prose in section 8 explains the engine; the widget shows what the engine does on one specific example.
- `NaN` is used for "not yet computed" data values. The render code displays `NaN` as `—` (em dash).
- The `backwardCode` strings are pseudo-Python that maps directly to the micrograd code reproduced in the chapter's section 8.

### 3. Visual layout

```
ViewBox 850 × 500

┌─────────────────────────────────────────────────────────────────┐
│ "Stage 3: L = relu(e) = relu(4) = 4"            ← description   │
│                                                                 │
│    ┌─────┐                                                      │
│    │  a  │═══════╗                                              │
│    │ 2.0 │       ║                                              │
│    │g:?  │       ▼                                              │
│    └─────┘   ┌──────────┐                                       │
│              │d = a · b │═══╗                                   │
│    ┌─────┐   │  -6.0    │   ║                                   │
│    │  b  │═══│ g: ?      │   ▼                                   │
│    │-3.0 │   └──────────┘  ┌──────────┐                         │
│    │g:?  │                  │e = d + c │═══════╗                │
│    └─────┘   ┌─────┐         │  4.0     │       ▼                │
│              │  c  │═════════│ g: ?     │   ┌──────────────┐     │
│    ┌─────┐   │10.0 │         └──────────┘   │L = relu(e)   │     │
│    │     │   │g:?  │                         │  4.0          │     │
│              └─────┘                         │ g: ?           │     │
│                                              └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘

[◁ Reset]  [▶ Play / Pause]  [▷ Step]   Stage 3 / 8
```

**Node visual:**
- Rounded rect, width 100, height 60
- Top half: data value
- Bottom half: "g:" + gradient value
- Op label (e.g., "d = a · b") above the rect in smaller text
- Forward highlight: cyan border + cyan-tinted bg
- Backward highlight: amber border + amber-tinted bg
- Idle: subtle gray border

**Edge visual:**
- Bezier-curved path from output of source to input of target
- Forward-flowing edges (during forward stages) animate with cyan dashes moving in the forward direction
- Backward-flowing edges animate with amber dashes moving in reverse

**Tooltip:**
- Below the SVG, shows the hovered node's `backwardCode` as a small code block
- For leaves: shows "a is a leaf — accumulates gradient from consumers (d in this case)"

**Description line:**
- Above the SVG, shows `TRACE.stages[currentStage].description`
- Updates as the user steps or plays through

### 4. `AutogradGraph.tsx`

Structure mirrors `BackpropVisualizer.tsx` from session 08. Key differences:

- 9 stages instead of 11 (idle + 4 forward + 4 backward)
- No preset selector — single hard-coded example
- Tooltip shows `_backward` code (multi-line) instead of an inline math statement
- The "node value display" toggles between data and gradient depending on stage type

```tsx
import { useEffect, useRef, useState } from 'react';
import { TRACE, TOTAL_STAGES, stateAtStage, type ValueNode } from './autograd-trace';
import styles from './AutogradGraph.module.css';

const STAGE_DURATION_MS = 750;

export default function AutogradGraph() {
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    if (stage >= TOTAL_STAGES) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (!cancelledRef.current) setStage(s => s + 1);
    }, STAGE_DURATION_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, stage]);

  // Cleanup
  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const state = stateAtStage(stage);
  const stageInfo = TRACE.stages[stage]!;

  return (
    <div className={styles.widget}>
      <div className={styles.description} aria-live="polite">
        {stageInfo.description}
      </div>

      <svg viewBox="0 0 850 500" className={styles.svg} role="img" aria-label="Autograd computational graph">
        {/* Edges (drawn first, behind nodes) */}
        {TRACE.edges.map(e => {
          const from = TRACE.nodes.find(n => n.id === e.from)!;
          const to   = TRACE.nodes.find(n => n.id === e.to)!;
          const edgeId = `${e.from}-${e.to}`;
          const isActive = stageInfo.highlightedEdges?.includes(edgeId) ?? false;
          const direction = stageInfo.showsForward ? 'forward' : stageInfo.showsBackward ? 'backward' : 'idle';
          return (
            <path
              key={edgeId}
              d={bezierPath(from.x + 100, from.y + 30, to.x, to.y + 30)}
              className={`edge ${isActive ? `edge-${direction}` : 'edge-idle'}`}
            />
          );
        })}

        {/* Nodes */}
        {TRACE.nodes.map(n => (
          <NodeView
            key={n.id}
            node={n}
            data={state.data[n.id]!}
            grad={state.grads[n.id]!}
            isHovered={hovered === n.id}
            isActive={stageInfo.highlightedNode === n.id}
            direction={stageInfo.showsForward ? 'forward' : stageInfo.showsBackward ? 'backward' : 'idle'}
            onHover={(id) => setHovered(id)}
          />
        ))}
      </svg>

      <Tooltip nodeId={hovered} />

      <div className={styles.controls}>
        <button onClick={() => { setStage(0); setIsPlaying(false); setHovered(null); }} className={styles.controlSecondary}>
          Reset
        </button>
        <button onClick={() => stage >= TOTAL_STAGES ? (setStage(0), setIsPlaying(true)) : setIsPlaying(p => !p)} className={styles.controlPrimary}>
          {isPlaying ? 'Pause' : stage >= TOTAL_STAGES ? 'Replay' : stage === 0 ? 'Play' : 'Resume'}
        </button>
        <button onClick={() => { if (stage < TOTAL_STAGES) setStage(s => s + 1); setIsPlaying(false); }} className={styles.controlSecondary} disabled={stage >= TOTAL_STAGES || isPlaying}>
          Step
        </button>
        <span className={styles.stageLabel}>Stage {stage} / {TOTAL_STAGES}</span>
      </div>
    </div>
  );
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  // Smooth left-to-right cubic bezier
  const dx = (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function NodeView({ node, data, grad, isHovered, isActive, direction, onHover }: {
  node: ValueNode; data: number; grad: number; isHovered: boolean; isActive: boolean;
  direction: 'forward' | 'backward' | 'idle'; onHover: (id: string | null) => void;
}) {
  const fmt = (v: number) => Number.isNaN(v) ? '—' : v.toFixed(2);
  const nodeClass = `node ${isActive ? `node-${direction}` : ''} ${isHovered ? 'node-hovered' : ''}`;
  return (
    <g
      className={nodeClass}
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      <text className="node-op" x={50} y={-8}>{node.label}</text>
      <rect className="node-rect" width={100} height={60} rx={6} />
      <line className="node-divider" x1={0} y1={30} x2={100} y2={30} />
      <text className="node-data" x={50} y={20}>{fmt(data)}</text>
      <text className="node-grad" x={50} y={50}>g: {fmt(grad)}</text>
    </g>
  );
}

function Tooltip({ nodeId }: { nodeId: string | null }) {
  if (!nodeId) return <div className={styles.tooltipBox}>Hover any node to see its _backward closure.</div>;
  const node = TRACE.nodes.find(n => n.id === nodeId)!;
  return (
    <div className={styles.tooltipBox}>
      <div className={styles.tooltipTitle}>{node.label} — {node.op === 'leaf' ? 'leaf node' : node.op}</div>
      <pre className={styles.tooltipCode}>{node.backwardCode}</pre>
    </div>
  );
}
```

### 5. `AutogradGraph.module.css`

Follows the same conventions as `BackpropVisualizer.module.css` (session 08). Specific additions:

- Node rect styling: rounded rect, var-based bg/border, transition on active state
- `.node-data` font size 14px, monospace
- `.node-grad` font size 11px, in `--text-tertiary` when 0, in `--amber-400` when gradient is non-zero
- `.node-op` font size 11px, in `--text-tertiary`, anchored above the rect
- `.node-divider` thin line between data and grad halves of the rect
- `.tooltipCode`: pre-formatted code, white-space preserved, font-size 0.8rem, JetBrains Mono
- Animation keyframes for `edge-forward` (cyan dashes flowing left-to-right) and `edge-backward` (amber dashes flowing right-to-left), with `prefers-reduced-motion` override

Excerpt:

```css
.widget {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
}

.description {
  padding: 0.75rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.4;
  min-height: 2.5rem;
}

.svg :global(.node-rect) {
  fill: var(--bg-elevated);
  stroke: var(--border-default);
  stroke-width: 1.5;
  transition: stroke 250ms cubic-bezier(0.22, 1, 0.36, 1), fill 250ms cubic-bezier(0.22, 1, 0.36, 1);
}
.svg :global(.node-forward .node-rect) {
  stroke: var(--cyan-500);
  stroke-width: 2;
  fill: rgba(6, 182, 212, 0.10);
}
.svg :global(.node-backward .node-rect) {
  stroke: var(--amber-500);
  stroke-width: 2;
  fill: rgba(245, 158, 11, 0.10);
}
.svg :global(.node-hovered .node-rect) {
  stroke: var(--cyan-300);
}

.svg :global(.node-data) {
  fill: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
}
.svg :global(.node-grad) {
  fill: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
}
.svg :global(.node-backward .node-grad),
.svg :global(.node-hovered .node-grad) {
  fill: var(--amber-400);
}

.svg :global(.node-op) {
  fill: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-anchor: middle;
  pointer-events: none;
}

.svg :global(.node-divider) {
  stroke: var(--border-subtle);
  stroke-width: 1;
  pointer-events: none;
}

.svg :global(.edge) {
  fill: none;
  stroke: var(--border-default);
  stroke-width: 1.5;
  opacity: 0.5;
}
.svg :global(.edge-forward) {
  stroke: var(--cyan-400);
  opacity: 0.9;
  stroke-dasharray: 5 5;
  animation: flow-fwd 1s linear infinite;
}
.svg :global(.edge-backward) {
  stroke: var(--amber-400);
  opacity: 0.9;
  stroke-dasharray: 5 5;
  animation: flow-bwd 1s linear infinite;
}

@keyframes flow-fwd { to { stroke-dashoffset: -20; } }
@keyframes flow-bwd { to { stroke-dashoffset: 20; } }

.tooltipBox {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  min-height: 70px;
}
.tooltipTitle {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}
.tooltipCode {
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-primary);
  white-space: pre;
  overflow-x: auto;
}

/* Controls follow BackpropVisualizer conventions — Run primary, others secondary */

@media (prefers-reduced-motion: reduce) {
  .svg :global(.edge-forward),
  .svg :global(.edge-backward) { animation: none; }
}
```

### 6. Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
export { default as AutogradGraph } from './ch01/AutogradGraph';
```

### 7. Update `src/pages/ch01-neural-net-primitives/index.mdx`

Three edits, in this order:

**Edit 7a: Update the imports**

At the top of the file, the widget import line (added across sessions 08 and 09) becomes:

```mdx
import { BackpropVisualizer, TrainingCurves, AutogradGraph } from '@components/widgets';
```

**Edit 7b: Replace section 8's WidgetFrame interior**

Find the `<WidgetFrame title="Walk the computational graph">` placeholder (originally from session 07). Replace its `<div>` interior with the component:

```mdx
<WidgetFrame title="Walk the computational graph" caption="A six-node DAG showing scalar autograd. Step through forward to compute values; step through backward to watch gradients flow. Hover any node to see its _backward closure as Python code.">
  <AutogradGraph client:visible />
</WidgetFrame>
```

**Edit 7c: Add the Exercises section**

Insert the following new section BETWEEN the autograd section (section 8) and the chapter close. The close paragraph from session 07 stays at the end of the file; the Exercises section goes immediately before it.

```mdx
## Exercises

The exercises below build on the chapter. Each is a self-contained problem with a starting template. Hints are collapsed by default — try the problem first.

### Exercise 1 (easy) — Verify softmax numerical stability

Implement the naive softmax (`np.exp(z) / np.exp(z).sum()`) and the stable softmax (max-subtraction). For each, evaluate on `z = [1000, 999, 998]` and report what happens.

<details>
<summary>Hint</summary>

The naive version overflows because `np.exp(1000)` returns `inf`. The stable version subtracts the max first, so all exponents are non-positive.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax_naive(z):
    # TODO: implement the naive (overflowing) version
    pass

def softmax_stable(z):
    # TODO: implement the stable (max-subtraction) version
    pass

z = np.array([1000.0, 999.0, 998.0])
print("naive:  ", softmax_naive(z))
print("stable: ", softmax_stable(z))
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Extend the MLP to 3 hidden layers

The MLP in section 5 has one hidden layer. Extend it to three hidden layers (input → h1 → h2 → h3 → output) and train it on the same quadrant task. Does it converge faster, slower, or similarly to the 1-hidden-layer version?

<details>
<summary>Hint</summary>

You need three weight matrices and three bias vectors. The forward pass has three (affine + ReLU) blocks before the final logits. The backward pass has three corresponding gradient computations. Most importantly: the chain rule means each layer's `dz` depends on the next layer's `dW` and gradient.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def softmax(z, axis=-1):
    z = z - z.max(axis=axis, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=axis, keepdims=True)

def relu(x): return np.maximum(0, x)
def relu_grad(x): return (x > 0).astype(x.dtype)

class MLP3:
    def __init__(self, d_in, d_h, d_out, seed=42):
        rng = np.random.default_rng(seed)
        # TODO: initialize W1, b1, W2, b2, W3, b3, W_out, b_out
        # Use He init: std = sqrt(2 / fan_in)
        pass

    def forward(self, x):
        # TODO: forward through three hidden layers + output
        pass

    def backward(self, y_true):
        # TODO: backward through three hidden layers + output
        pass

# Compare to the 1-hidden-layer MLP from section 5.
# Train both on the quadrant task. Report which converges faster.
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Implement AdamW from scratch

Take the Adam class from section 7 and modify it to implement AdamW (Loshchilov & Hutter 2017). The key difference: weight decay is applied to the parameter directly (`p -= lr * weight_decay * p`) AFTER the standard Adam update, NOT added to the gradient. Compare AdamW (with `weight_decay=0.01`) to plain Adam on the quadrant task.

<details>
<summary>Hint</summary>

In `Adam.step`, after the line `p -= lr * m_hat / (np.sqrt(v_hat) + eps)`, add a second update: `p -= lr * weight_decay * p`. This decoupled decay means the magnitude of the decay isn't affected by Adam's per-parameter rescaling.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

class AdamW:
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.01):
        self.params = params
        self.lr = lr
        self.b1, self.b2 = betas
        self.eps = eps
        self.weight_decay = weight_decay
        # TODO: initialize m and v as in Adam
        self.t = 0

    def step(self, grads):
        # TODO: standard Adam update, then add decoupled weight decay
        pass

# Test it: minimize f(x, y) = x^2 + 10*y^2 with weight_decay=0.01.
# Compare trajectories to plain Adam (no weight decay).
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Build a tiny autograd engine

Implement a minimal `Value` class in the micrograd style, supporting `+`, `*`, `relu`, and `backward()`. Use it to compute the same 2-layer MLP from section 5 — but using your `Value` objects instead of numpy arrays. (This will be slower than numpy. The point is to see that autograd is just graph traversal applied carefully.)

<details>
<summary>Hint</summary>

Each `Value` object stores: `data`, `grad`, `_backward` (a closure), `_prev` (set of parent Values), and `_op` (a string label). Operations build the graph as they execute. `backward()` does a topological sort then walks in reverse, calling each node's `_backward()`. See the chapter's section 8 code block for the structure.

</details>

<RunnableCode
  client:visible
  defaultCode={`import math

class Value:
    def __init__(self, data, _children=(), _op=''):
        self.data = data
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)
        self._op = _op

    def __add__(self, other):
        # TODO: implement + with correct _backward
        pass

    def __mul__(self, other):
        # TODO: implement * with correct _backward
        pass

    def relu(self):
        # TODO: implement relu with correct _backward
        pass

    def backward(self):
        # TODO: topo sort, then walk in reverse calling each node's _backward
        pass

# Test:
x, w, b = Value(2.0), Value(-3.0), Value(1.0)
L = (x * w + b).relu()
L.backward()
print(f"L = {L.data}")
print(f"dL/dx = {x.grad}, dL/dw = {w.grad}, dL/db = {b.grad}")
# Expected: L = 0.0 (because x*w + b = -5, and relu(-5) = 0)
# So all grads should be 0 too.
`}
  packages={["numpy"]}
/>

If you finish Exercise 4 in working form, you have essentially recreated [Karpathy's micrograd](https://github.com/karpathy/micrograd) — the smallest serious autograd engine that ships. PyTorch, JAX, and TensorFlow are doing the same thing, just at scale.
```

**Edit 7d: Verify the chapter close**

The chapter close paragraph from session 07 (the "See you in Chapter 2" or similar transition) should remain as the final content in the file, AFTER the Exercises section. If session 07 placed it correctly, no change needed — just verify it's still present.

### 8. Flip Ch 1's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 1, slug: 'ch01-neural-net-primitives', title: 'Neural network primitives', partNum: 1, status: 'draft' },
```

Change to:

```ts
{ num: 1, slug: 'ch01-neural-net-primitives', title: 'Neural network primitives', partNum: 1, status: 'published' },
```

This activates the landing-page CTA (`getFirstPublishedChapter()` now returns Ch 1) and makes Ch 1 the first chapter linkable from the front door of the site.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly; no errors.
2. **Section 8 of Ch 1** renders with the autograd-graph widget. Initial state shows leaves with values and internal nodes with `—` for both data and gradient.
3. **Play through the widget:** stages 1-3 compute d, e, L (forward, cyan); stage 4 seeds L.grad = 1; stages 5-7 propagate gradients backward (amber); stage 8 shows all gradients populated. Final values: a.grad = -3, b.grad = 2, c.grad = 1, d.grad = 1, e.grad = 1, L.grad = 1.
4. **Hover any node:** tooltip below shows its `_backward` closure as readable pseudo-Python. Leaves show the appropriate "leaf" message.
5. **Description line** above the SVG updates with each stage.
6. **Reset / Step / Play controls work** identically to session 08's widget.
7. **Exercises section** appears between section 8 (autograd) and the chapter close paragraph.
8. **Each exercise has:** a problem statement, a collapsible hint (uses native `<details><summary>`), a starter `<RunnableCode>` block with `# TODO:` placeholders, and works correctly when the user fills in the TODOs.
9. **Chapter close** is the final content, AFTER the Exercises section.
10. **`/` (landing page):** the CTA now shows "Start with Chapter 1 →" (not "Chapters coming soon") — because Ch 1 is now `'published'`. Clicking it navigates to `/ch01-neural-net-primitives/`.
11. **Sidebar:** Ch 1 remains visible and active; all other chapters still appear dimmed (they're still `'planned'`).
12. **TOC on Ch 1:** now includes the Exercises section as an h2 entry, plus four h3 entries for the individual exercises.
13. **Mobile:** widget scales correctly via viewBox; exercise hints are tappable; runnable code blocks work.
14. **`prefers-reduced-motion`:** edge animations are static; stage transitions still happen but without flowing dashes.
15. **Word count (Ch 1 prose):** total chapter is between 6000 and 7500 words now (was 5500-6500 after session 07; exercises add ~600-1000 words of prose). Use the same word-counter approach as session 07's acceptance criteria.
16. **`npm run typecheck`** passes.
17. **`npm run build`** completes; production renders correctly.
18. **Final repo additions:**

```
src/
├── components/
│   └── widgets/
│       └── ch01/
│           ├── BackpropVisualizer.*           (session 08, unchanged)
│           ├── TrainingCurves.*               (session 09, unchanged)
│           ├── network-state.ts               (session 08, unchanged)
│           ├── training-data.ts               (session 09, unchanged)
│           ├── AutogradGraph.tsx              ← new
│           ├── AutogradGraph.module.css       ← new
│           └── autograd-trace.ts              ← new
└── lib/
    └── chapters.ts                            (Ch 1 status flipped to 'published')
└── pages/
    └── ch01-neural-net-primitives/
        └── index.mdx                          (widget + exercises + close)
```

---

## Out of scope

- ❌ **Do not implement an interactive autograd engine in JS.** The trace is hand-authored; the widget illustrates, doesn't simulate. A live autograd engine in the widget is a different (much larger) project.
- ❌ **Do not add Karpathy-style `tanh`, `pow`, `exp`** operations to the widget. The four operations (leaf, +, *, relu) are enough for the pedagogical claim. The chapter prose can mention "real autograd supports many more ops" without needing the widget to demonstrate them.
- ❌ **Do not show solutions to the exercises.** The starter `<RunnableCode>` has `# TODO:` placeholders; users fill them in. If a public repo of solutions is desired later, that's a separate effort.
- ❌ **Do not flip other chapters' statuses.** Only Ch 1 flips to `'published'`. The remaining 29 chapters stay `'planned'` until their own Phase-N completion sessions land.
- ❌ **Do not add more exercises beyond four.** The chapter is already long; four exercises (easy/medium/medium/hard) is the right shape.
- ❌ **Do not modify the chapter close paragraph.** Session 07 wrote it; this session preserves it.
- ❌ **Do not touch sessions 08 / 09's widgets.** This is the third widget for Ch 1; the other two are sealed.

---

## Wire-up

After all acceptance criteria pass:

```bash
git add src/components/widgets/ch01/AutogradGraph.tsx src/components/widgets/ch01/AutogradGraph.module.css src/components/widgets/ch01/autograd-trace.ts src/components/widgets/index.ts src/lib/chapters.ts src/pages/ch01-neural-net-primitives/index.mdx
git commit -m "session 10: autograd-graph widget + Ch 1 exercises + status: published"
git push origin main
```

After deploy, verify on production:

1. Landing page CTA reads "Start with Chapter 1 →"
2. Click the CTA — navigate to Ch 1
3. Scroll through all 8 sections + exercises
4. Test all three widgets (backprop, training-curves, autograd-graph) in sequence
5. Test all 5 `<RunnableCode>` blocks (the 4 exercise starters + the section-5 MLP)
6. Test on mobile (375px width)

---

## Checkpoint C — Phase 3 closeout

This is the official end of Phase 3 per `MASTER_PLAN.md`. **The chapter pattern is now validated.**

Confirm before declaring Phase 3 complete:

- ✅ `BUILD_ORDER.md` shows files 12-16 (Phase 3) all flipped to ✅
- ✅ Ch 1 is `'published'` and accessible from the landing CTA
- ✅ All three Ch 1 widgets render correctly in production
- ✅ All four Ch 1 exercises can be completed by filling in the TODOs (i.e., the starter code is syntactically valid; the hints point to the right concepts; the expected outputs are achievable)
- ✅ Ch 1's total word count is in the 6000-7500 range
- ✅ Lighthouse scores remain green on `/ch01-neural-net-primitives/` (Performance ≥ 95 desktop, Accessibility = 100)
- ✅ Bundle size for the chapter's chunk is reasonable (< 200 KB gzipped including all three widgets)

If anything is unchecked, return and fix before starting Phase 4.

**Cadence shift for chapters 2-30:** the chapter pattern is now a five-step recipe:

1. **Research file** (one session) — like `research/ch01-neural-net-primitives/research.md`
2. **Page structure** (one session) — like session 07
3. **Marquee widget** (one session) — like session 08
4. **Secondary widget** (one session) — like session 09 (or a runnable code session if no second widget)
5. **Closeout: third widget + exercises + status flip** (one session) — like session 10

Total: 5 sessions per chapter. Across 29 remaining chapters: ~145 chapter sessions, plus 29 research files, plus polish sessions. This matches the BUILD_ORDER ETA.

If a chapter is simpler (e.g., a shorter conceptual chapter), some sessions can collapse. If a chapter is more complex (e.g., Ch 8 "Building a Small LLM" — likely warrants extra widgets), additional sessions can be added.

---

## Notes for the session author

**This is the validation session.** Sessions 7, 8, 9, 10 together produce one complete chapter. If after this session, Ch 1 reads end-to-end as a substantive learning experience — math derivations clear, widgets illuminating, runnable code working, exercises engaging — then the pattern can scale. If it doesn't, identify what's broken and fix it before Phase 4 begins.

**On the autograd widget's scope vs ambition:** the widget shows ONE specific computation. That's intentional. A "more general" autograd widget (let the user build their own expression) is a fundamentally different (more complex) widget. The current scope is correct: illustrate the engine on one example, deeply.

**On exercises as a chapter element:** these are not just "filler." Good exercises:
- Force the reader to engage with the material rather than just read it
- Reveal which parts of the chapter the reader understood vs glossed
- Hint at the next chapter (Exercise 2 sets up multi-layer networks; Exercise 4 sets up PyTorch's autograd)

If an exercise feels arbitrary, replace it. The four chosen here connect to specific chapter sections; each one is essentially asking the reader to extend something already shown.

**On the status flip:** this is the single line change that activates the landing page CTA. Test it carefully. If after the flip the landing still shows "Coming soon," `getFirstPublishedChapter()` may have a bug — verify it returns the first chapter where `status === 'published'`.

**On Checkpoint C celebrations:** when this session lands, Phase 3 is done. That's a real milestone. The first complete chapter exists, end-to-end, on the live production site. The pattern is real. Take a moment.

The next file (#17 in BUILD_ORDER) starts Phase 4: `research/ch02-embeddings/research.md`. That's a research file (~5 hours of focused work) before the next set of chapter sessions begins. The rhythm from here is steady: a research file, then 4-5 chapter sessions to produce that chapter, then move on. ~145 more chapter sessions to go.

Get the first one right; the rest are variations on it.
