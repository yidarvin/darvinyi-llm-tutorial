# Session 25 — Transformer block flow widget

> The secondary Chapter 5 widget — visualizes data flowing through a complete Pre-LN transformer block. Seven stages animated in sequence: **Input → LayerNorm₁ → Multi-Head Attention → Residual₁ → LayerNorm₂ → FFN → Residual₂**. An SVG block diagram shows the architecture with the residual "highway" visible as curved arrows; below it, a 6×6 data matrix shows the state at the current stage. The reader sees that the residual path preserves the input while sublayers add refinements. Replaces the section-7 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch05-multihead-and-block/research.md`** — Derivations 3 (residuals) and 5 (Pre-LN vs Post-LN) are the reference
2. **`prompts/chapters/ch05-multihead-and-block/session-23-page-structure.md`** — for the section-7 widget placeholder and the full transformer block code
3. **`prompts/chapters/ch05-multihead-and-block/session-24-multihead-decomposition-widget.md`** — for the widget conventions established by Ch 5's marquee
4. **`prompts/chapters/ch04-attention/session-19-attention-heatmap-widget.md`** — for the stage-based animation pattern

---

## Goal

Replace the `<WidgetFrame title="Pre-LN transformer block">` placeholder in section 7 with a working interactive widget that:

- Shows the full Pre-LN transformer block as an SVG diagram with labeled boxes for each operation (LN₁, MHA, +, LN₂, FFN, +) and **curved residual arrows** clearly visible
- Animates through **7 stages** showing the data state at each step
- The active stage in the diagram is highlighted; previous stages are dimmed but visible
- Below the diagram, displays the **6×6 data matrix** (6 tokens × 6 features) at the current stage, color-coded
- A description explains what just happened: what changed from the previous stage, why
- Play / pause / scrubber / reset controls
- Demonstrates concretely that the residual path preserves the input while sublayers add refinements

**End state:** section 7 of Chapter 5 has a working secondary widget. After 30 seconds of interaction, the reader should be able to (a) trace the full Pre-LN block from input to output, (b) identify the two residual skip connections, (c) describe what each operation does to the data.

---

## Inputs

State of the repo after session 24:

- `src/components/widgets/ch05/MultiHeadDecomposition.{tsx,module.css}` and `multihead-data.ts` exist (session 24)
- `src/components/widgets/index.ts` exports `MultiHeadDecomposition`
- Section 2's marquee widget is wired
- Section 7's widget is still stubbed
- `src/lib/chapters.ts` has Ch 5 as `'draft'`

---

## Deliverables

1. **Create** `src/components/widgets/ch05/TransformerBlockFlow.tsx` — the React widget
2. **Create** `src/components/widgets/ch05/TransformerBlockFlow.module.css` — scoped styles
3. **Create** `src/components/widgets/ch05/block-flow-data.ts` — 7 stages of 6×6 data matrices showing the data state at each step
4. **Update** `src/components/widgets/index.ts` — add `TransformerBlockFlow` export
5. **Update** `src/pages/ch05-multihead-and-block/index.mdx` — replace section-7's `<WidgetFrame>` interior with `<TransformerBlockFlow client:visible />`

**Do NOT modify:** any prior chapter widget, the section-2 marquee, or any other file.

---

## Detailed spec

### 1. `block-flow-data.ts` — the data layer

Seven hand-computed 6×6 matrices showing the data state at each stage. The numbers are *illustrative* — they demonstrate the pattern of how the residual preserves the input while sublayers transform it. We do not run real attention or FFN computations; instead, we encode the *shape* of how data flows through.

**The pattern we encode:**
- **Input**: small random-looking values
- **After LN₁**: normalized values (similar range across tokens, magnitudes near 1)
- **After MHA**: mixed across tokens (each token's row now contains influence from other tokens)
- **After Residual₁** = Input + MHA: original input visible plus the attention contribution
- **After LN₂**: normalized again
- **After FFN**: per-token transformation (different from MHA's cross-token mixing)
- **After Residual₂** = (Residual₁) + FFN: the final output, with original information preserved plus both refinements

```ts
// src/components/widgets/ch05/block-flow-data.ts

export const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
export const N = TOKENS.length;
export const D_MODEL = 6;

export interface BlockStage {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  /** 6 × 6 data matrix — 6 tokens, 6 features */
  data: number[][];
  /** Which operation produced this stage. null for input. */
  via: 'input' | 'layer-norm-1' | 'mha' | 'residual-1' | 'layer-norm-2' | 'ffn' | 'residual-2';
}

// ---------------------------------------------------------------------------
// Stage 0: Input — pre-block representation (from embeddings or previous block)
// Small spread, varied magnitudes
// ---------------------------------------------------------------------------
const INPUT: number[][] = [
  // d0    d1    d2    d3    d4    d5
  [ 0.8, -0.3,  0.2,  0.5,  -0.1,  0.4],   // the
  [-0.2,  0.6,  0.4, -0.3,   0.5,  0.1],   // cat
  [ 0.3,  0.1, -0.5,  0.7,   0.2, -0.3],   // sat
  [ 0.5, -0.4,  0.3,  0.2,  -0.6,  0.4],   // on
  [ 0.7, -0.2,  0.1,  0.6,  -0.2,  0.3],   // the
  [-0.1,  0.5,  0.6, -0.2,   0.4, -0.4],   // mat
];

// ---------------------------------------------------------------------------
// Stage 1: After LayerNorm₁ — each row normalized to mean 0, std 1
// (We don't actually compute it; we encode "normalized-looking" values)
// ---------------------------------------------------------------------------
const AFTER_LN1: number[][] = [
  [ 1.4, -0.9,  0.0,  0.6,  -0.6,  0.3],
  [-0.9,  1.2,  0.6, -1.1,   0.9,  0.0],
  [ 0.3,  0.0, -1.4,  1.5,   0.0, -0.9],
  [ 0.9, -1.1,  0.6,  0.0,  -1.4,  0.6],
  [ 1.2, -0.9,  0.0,  0.9,  -0.6,  0.3],
  [-0.6,  0.9,  1.2, -0.9,   0.6, -1.1],
];

// ---------------------------------------------------------------------------
// Stage 2: After Multi-Head Attention — tokens have mixed information
// (Each token's row is influenced by other tokens; magnitudes vary)
// ---------------------------------------------------------------------------
const AFTER_MHA: number[][] = [
  [ 0.2, -0.1,  0.3,  0.4,  -0.2,  0.1],
  [ 0.1,  0.3,  0.2, -0.1,   0.4,  0.2],
  [ 0.2,  0.1, -0.2,  0.5,   0.1, -0.1],
  [ 0.4, -0.2,  0.3,  0.1,  -0.3,  0.3],
  [ 0.3, -0.1,  0.1,  0.4,  -0.1,  0.2],
  [ 0.1,  0.4,  0.4, -0.1,   0.3, -0.2],
];

// ---------------------------------------------------------------------------
// Stage 3: After Residual₁ = Input + MHA output
// (Computed; just element-wise sum)
// ---------------------------------------------------------------------------
const AFTER_RESIDUAL_1: number[][] = INPUT.map((row, i) =>
  row.map((v, j) => +(v + AFTER_MHA[i]![j]!).toFixed(2))
);

// ---------------------------------------------------------------------------
// Stage 4: After LayerNorm₂ — re-normalized
// ---------------------------------------------------------------------------
const AFTER_LN2: number[][] = [
  [ 1.6, -0.6,  0.6,  1.1,  -0.5,  0.7],
  [-0.3,  1.3,  0.9, -0.9,   1.3,  0.4],
  [ 0.7,  0.3, -1.4,  1.6,   0.4, -0.7],
  [ 1.3, -1.0,  0.9,  0.4,  -1.5,  0.9],
  [ 1.5, -0.5,  0.4,  1.4,  -0.5,  0.7],
  [-0.0,  1.4,  1.5, -0.5,   1.0, -1.1],
];

// ---------------------------------------------------------------------------
// Stage 5: After FFN — per-token transformation, more spread
// (Each row processed independently; magnitudes can grow/shrink)
// ---------------------------------------------------------------------------
const AFTER_FFN: number[][] = [
  [ 0.3, -0.2,  0.4,  0.6,  -0.1,  0.2],
  [-0.1,  0.5,  0.3, -0.2,   0.6,  0.1],
  [ 0.4,  0.2, -0.3,  0.8,   0.2, -0.1],
  [ 0.5, -0.3,  0.4,  0.3,  -0.4,  0.4],
  [ 0.5, -0.1,  0.2,  0.6,  -0.1,  0.3],
  [ 0.0,  0.5,  0.6, -0.1,   0.4, -0.3],
];

// ---------------------------------------------------------------------------
// Stage 6: After Residual₂ = Residual₁ + FFN output (the block's final output)
// ---------------------------------------------------------------------------
const AFTER_RESIDUAL_2: number[][] = AFTER_RESIDUAL_1.map((row, i) =>
  row.map((v, j) => +(v + AFTER_FFN[i]![j]!).toFixed(2))
);

export const STAGES: BlockStage[] = [
  {
    id: 'input',
    label: 'Input',
    shortLabel: 'Input',
    description: 'The block receives an n × d_model matrix as input — for example, the output of the previous block, or the embedded tokens plus positional encoding for the first block.',
    data: INPUT,
    via: 'input',
  },
  {
    id: 'after-ln-1',
    label: 'After LayerNorm₁',
    shortLabel: 'LN₁',
    description: 'The first layer norm normalizes each token\'s features to zero mean and unit standard deviation. Notice the values are now more uniform in magnitude across all six tokens — this is the "scale reset" that stabilizes training.',
    data: AFTER_LN1,
    via: 'layer-norm-1',
  },
  {
    id: 'after-mha',
    label: 'After Multi-Head Attention',
    shortLabel: 'MHA',
    description: 'Multi-head attention mixes information across positions. Each token\'s row is now a weighted combination of all positions\' values. The magnitudes are different from the LN₁ output — attention has reshaped the representation.',
    data: AFTER_MHA,
    via: 'mha',
  },
  {
    id: 'after-residual-1',
    label: 'After Residual₁ (= Input + MHA)',
    shortLabel: 'Res₁',
    description: 'The first residual adds the unchanged input to the attention output. The original input information is still present (look at the values — they\'re close to "Input" plus a small attention contribution). This is the gradient highway: even if attention\'s gradient is small, the identity path preserves it.',
    data: AFTER_RESIDUAL_1,
    via: 'residual-1',
  },
  {
    id: 'after-ln-2',
    label: 'After LayerNorm₂',
    shortLabel: 'LN₂',
    description: 'The second layer norm normalizes again, preparing the data for the FFN. The residual + LN pattern means each sublayer always receives normalized input, regardless of how large the residual stream grows.',
    data: AFTER_LN2,
    via: 'layer-norm-2',
  },
  {
    id: 'after-ffn',
    label: 'After FFN',
    shortLabel: 'FFN',
    description: 'The feedforward network applies a per-token MLP — expanding to 4× hidden dim, applying GELU, contracting back. Unlike attention, the FFN does not mix across tokens; each token is processed independently. This is the "think alone" step that follows attention\'s "talk to others" step.',
    data: AFTER_FFN,
    via: 'ffn',
  },
  {
    id: 'after-residual-2',
    label: 'After Residual₂ — Output',
    shortLabel: 'Output',
    description: 'The second residual adds the post-FFN output to the post-Residual₁ values. The block\'s output. This goes to the next block (or, in the final block, to the output projection / unembedding). Notice the values: the original input from stage 0 is still detectable, plus refinements from both sublayers.',
    data: AFTER_RESIDUAL_2,
    via: 'residual-2',
  },
];
```

### 2. Visual layout

```
ViewBox: 0 0 900 700

┌──────────────────────────────────────────────────────────────────────┐
│  Stage ●━━━━━━━━━━━━━━━━━━ 3 / 7    [▶ Play] [Reset]                 │
│                                                                      │
│  Stage 3: After Residual₁ (= Input + MHA)                            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐         │
│  │              Block diagram (SVG)                       │         │
│  │                                                        │         │
│  │   ────────────── (residual highway, arched arrow) ───  │         │
│  │  ╱                                                  ╲   │         │
│  │ ↓                                                    ↓ │         │
│  │ X ─→ [LN₁] ─→ [MHA] ─→ ⊕ ─→ ... [LN₂] ─→ [FFN] ─→ ⊕   │         │
│  │       │       (active) │                                │         │
│  │   (dimmed)            (lit up)                          │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                      │
│  Current state — 6 tokens × 6 features                              │
│  ┌────────────────────────────────────────────┐                     │
│  │ Token: d0   d1   d2   d3   d4   d5         │                     │
│  │ the   [██] [██] [██] [██] [██] [██]        │                     │
│  │ cat   ...                                  │                     │
│  │ ...                                        │                     │
│  └────────────────────────────────────────────┘                     │
│                                                                      │
│  Description:                                                        │
│  The first residual adds the unchanged input to the attention        │
│  output. The original input information is still present — the       │
│  values are close to "Input" plus a small attention contribution.    │
│  This is the gradient highway: even if attention's gradient is       │
│  small, the identity path preserves it.                              │
└──────────────────────────────────────────────────────────────────────┘
```

**SVG block diagram details:**
- Input node "X" on the far left
- Two horizontal residual paths arcing over the sublayers (curved)
- Six labeled boxes for: LN₁, MHA, ⊕ (first residual sum), LN₂, FFN, ⊕ (second residual sum)
- "Output" label on the far right
- Active box (matching the current stage's `via`) is highlighted with full opacity + cyan border
- Boxes for stages already completed are at full opacity but no border highlight
- Boxes for future stages are dimmed to 40% opacity
- The residual arrows are always visible at full opacity (they're the chapter's key visual claim)

### 3. `TransformerBlockFlow.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import { TOKENS, STAGES, type BlockStage } from './block-flow-data';
import styles from './TransformerBlockFlow.module.css';

const PLAY_FPS = 0.7;   // ~1.4 sec per stage

export default function TransformerBlockFlow() {
  const [stageIdx, setStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    if (stageIdx >= STAGES.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStageIdx(s => s + 1);
    }, 1000 / PLAY_FPS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, stageIdx]);

  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const stage = STAGES[stageIdx]!;

  return (
    <div className={styles.widget}>
      {/* Controls */}
      <div className={styles.controls}>
        <button onClick={() => { setStageIdx(0); setIsPlaying(false); }} className={styles.controlSecondary}>Reset</button>
        <button
          onClick={() => stageIdx >= STAGES.length - 1 ? (setStageIdx(0), setIsPlaying(true)) : setIsPlaying(p => !p)}
          className={styles.controlPrimary}
        >
          {isPlaying ? 'Pause' : stageIdx >= STAGES.length - 1 ? 'Replay' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={STAGES.length - 1}
          value={stageIdx}
          onChange={e => { setIsPlaying(false); setStageIdx(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="Block stage"
        />
        <span className={styles.stepLabel}>Stage {stageIdx + 1} / {STAGES.length}</span>
      </div>

      {/* Stage title */}
      <div className={styles.stageTitle}>{stage.label}</div>

      {/* Block diagram */}
      <BlockDiagram activeVia={stage.via} />

      {/* Data matrix */}
      <div className={styles.dataPanel}>
        <div className={styles.panelTitle}>Current state — 6 tokens × 6 features</div>
        <DataMatrix data={stage.data} />
      </div>

      {/* Description */}
      <div className={styles.description} aria-live="polite">
        {stage.description}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SVG block diagram with arched residual arrows
// -----------------------------------------------------------------------------

interface DiagramProps {
  activeVia: BlockStage['via'];
}

const DIAGRAM_W = 800;
const DIAGRAM_H = 220;

// Operation boxes (x, y, w, h)
const BOXES = {
  X:      { x:  40, y: 100, w: 60, h: 40, label: 'X (in)',  type: 'input' },
  LN1:    { x: 140, y: 100, w: 70, h: 40, label: 'LN₁',     type: 'op'    },
  MHA:    { x: 240, y: 100, w: 80, h: 40, label: 'MHA',     type: 'op'    },
  SUM1:   { x: 350, y: 100, w: 40, h: 40, label: '⊕',       type: 'sum'   },
  LN2:    { x: 430, y: 100, w: 70, h: 40, label: 'LN₂',     type: 'op'    },
  FFN:    { x: 530, y: 100, w: 70, h: 40, label: 'FFN',     type: 'op'    },
  SUM2:   { x: 630, y: 100, w: 40, h: 40, label: '⊕',       type: 'sum'   },
  OUT:    { x: 710, y: 100, w: 60, h: 40, label: 'out',     type: 'output'},
};

const VIA_TO_BOX: Record<BlockStage['via'], keyof typeof BOXES | null> = {
  'input':         'X',
  'layer-norm-1':  'LN1',
  'mha':           'MHA',
  'residual-1':    'SUM1',
  'layer-norm-2':  'LN2',
  'ffn':           'FFN',
  'residual-2':    'SUM2',
};

// Which boxes are "active" (light up) given the current stage
function getBoxState(boxKey: keyof typeof BOXES, activeVia: BlockStage['via']): 'completed' | 'active' | 'pending' {
  const stageOrder: (BlockStage['via'])[] = ['input', 'layer-norm-1', 'mha', 'residual-1', 'layer-norm-2', 'ffn', 'residual-2'];
  const boxOrderIdx = stageOrder.indexOf(activeVia);

  const boxStageMap: Record<keyof typeof BOXES, number> = {
    X: 0, LN1: 1, MHA: 2, SUM1: 3, LN2: 4, FFN: 5, SUM2: 6, OUT: 6,
  };

  const boxIdx = boxStageMap[boxKey];

  if (boxIdx < boxOrderIdx) return 'completed';
  if (boxIdx === boxOrderIdx) return 'active';
  return 'pending';
}

function BlockDiagram({ activeVia }: DiagramProps) {
  return (
    <svg viewBox={`0 0 ${DIAGRAM_W} ${DIAGRAM_H}`} className={styles.svgDiagram} role="img" aria-label="Pre-LN transformer block">
      {/* Forward arrows between boxes */}
      <FlowArrow from={BOXES.X} to={BOXES.LN1} />
      <FlowArrow from={BOXES.LN1} to={BOXES.MHA} />
      <FlowArrow from={BOXES.MHA} to={BOXES.SUM1} />
      <FlowArrow from={BOXES.SUM1} to={BOXES.LN2} />
      <FlowArrow from={BOXES.LN2} to={BOXES.FFN} />
      <FlowArrow from={BOXES.FFN} to={BOXES.SUM2} />
      <FlowArrow from={BOXES.SUM2} to={BOXES.OUT} />

      {/* Residual arrows (curved, arching over the sublayers) */}
      <ResidualArrow
        startX={BOXES.X.x + BOXES.X.w / 2}
        startY={BOXES.X.y}
        endX={BOXES.SUM1.x + BOXES.SUM1.w / 2}
        endY={BOXES.SUM1.y}
        label="residual₁"
        highlight={activeVia === 'residual-1'}
      />
      <ResidualArrow
        startX={BOXES.SUM1.x + BOXES.SUM1.w / 2}
        startY={BOXES.SUM1.y}
        endX={BOXES.SUM2.x + BOXES.SUM2.w / 2}
        endY={BOXES.SUM2.y}
        label="residual₂"
        highlight={activeVia === 'residual-2'}
      />

      {/* Boxes */}
      {(Object.keys(BOXES) as Array<keyof typeof BOXES>).map(key => {
        const box = BOXES[key];
        const state = getBoxState(key, activeVia);
        return <OpBox key={key} box={box} state={state} />;
      })}
    </svg>
  );
}

function OpBox({ box, state }: { box: typeof BOXES[keyof typeof BOXES]; state: 'completed' | 'active' | 'pending' }) {
  const fillClass = state === 'active' ? styles.boxActive
    : state === 'completed' ? styles.boxCompleted
    : styles.boxPending;
  return (
    <g className={`${styles.opBox} ${fillClass}`}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={6} />
      <text x={box.x + box.w / 2} y={box.y + box.h / 2 + 5} textAnchor="middle" className={styles.boxLabel}>
        {box.label}
      </text>
    </g>
  );
}

function FlowArrow({ from, to }: { from: typeof BOXES[keyof typeof BOXES]; to: typeof BOXES[keyof typeof BOXES] }) {
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + to.h / 2;
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} className={styles.flowArrow} markerEnd="url(#arrowhead)" />
  );
}

function ResidualArrow({ startX, startY, endX, endY, label, highlight }: {
  startX: number; startY: number; endX: number; endY: number; label: string; highlight: boolean;
}) {
  const archHeight = 70;
  const midX = (startX + endX) / 2;
  const archY = startY - archHeight;
  const path = `M ${startX} ${startY} Q ${midX} ${archY}, ${endX} ${endY}`;
  return (
    <g className={`${styles.residualArrow} ${highlight ? styles.residualArrowHighlight : ''}`}>
      <path d={path} fill="none" markerEnd="url(#arrowhead-residual)" />
      <text x={midX} y={archY - 6} textAnchor="middle" className={styles.residualLabel}>{label}</text>
    </g>
  );
}

// -----------------------------------------------------------------------------
// Data matrix display
// -----------------------------------------------------------------------------

function DataMatrix({ data }: { data: number[][] }) {
  const absMax = Math.max(...data.flat().map(Math.abs), 1);   // guard against zero

  function cellColor(v: number): string {
    const t = v / absMax;
    if (t > 0) return `rgba(239, 68, 68, ${Math.min(Math.abs(t), 1).toFixed(3)})`;     // red
    return `rgba(59, 130, 246, ${Math.min(Math.abs(t), 1).toFixed(3)})`;                // blue
  }

  return (
    <div className={styles.dataGrid} style={{ gridTemplateColumns: `auto repeat(${data[0]!.length}, 32px)` }}>
      <div></div>
      {data[0]!.map((_, j) => <div key={`ch-${j}`} className={styles.colLabel}>d{j}</div>)}
      {data.map((row, i) => (
        <RowFragment key={i} rowLabel={TOKENS[i]!}>
          {row.map((v, j) => (
            <div
              key={j}
              className={styles.dataCell}
              style={{ backgroundColor: cellColor(v) }}
              title={`${TOKENS[i]}[d${j}] = ${v.toFixed(2)}`}
            >
              {/* Optional: show value as tiny number if cell is large enough */}
            </div>
          ))}
        </RowFragment>
      ))}
    </div>
  );
}

function RowFragment({ rowLabel, children }: { rowLabel: string; children: React.ReactNode }) {
  return (
    <>
      <div className={styles.rowLabel}>{rowLabel}</div>
      {children}
    </>
  );
}

// SVG arrowhead definitions (used by FlowArrow and ResidualArrow)
export function ArrowheadDefs() {
  return (
    <defs>
      <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--text-secondary)" />
      </marker>
      <marker id="arrowhead-residual" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--cyan-400)" />
      </marker>
    </defs>
  );
}
```

**Note on the SVG arrowhead `<defs>`:** the `ArrowheadDefs` component must be rendered *inside* the SVG. Add it as the first child of the `<svg>` in `BlockDiagram` before any geometry.

### 4. `TransformerBlockFlow.module.css`

Match the conventions from earlier widget CSS modules. Key new styles:

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

/* Controls — copy from earlier widgets */
.controls { /* matches BPETraining */ }
.controlPrimary, .controlSecondary { /* matches BPETraining */ }
.scrubber { /* matches BPETraining */ }
.stepLabel { /* matches BPETraining */ }

.stageTitle {
  margin: 0.75rem 0 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  color: var(--cyan-300);
  font-weight: 500;
}

.svgDiagram {
  width: 100%;
  height: auto;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
}

/* Boxes */
.opBox text { fill: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.opBox rect { transition: fill 250ms, stroke 250ms, opacity 250ms; }

.boxCompleted rect { fill: var(--bg-primary); stroke: var(--text-secondary); stroke-width: 1; opacity: 0.75; }
.boxActive rect { fill: color-mix(in srgb, var(--cyan-500) 25%, var(--bg-primary)); stroke: var(--cyan-500); stroke-width: 2; opacity: 1; }
.boxPending rect { fill: var(--bg-primary); stroke: var(--border-default); stroke-width: 1; opacity: 0.4; }

.flowArrow {
  stroke: var(--text-secondary);
  stroke-width: 1.5;
  opacity: 0.7;
}

.residualArrow path {
  stroke: var(--cyan-400);
  stroke-width: 2;
  opacity: 0.7;
  transition: opacity 250ms, stroke-width 250ms;
}
.residualArrowHighlight path {
  stroke-width: 3;
  opacity: 1;
}
.residualLabel {
  fill: var(--cyan-400);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.dataPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
  font-weight: 500;
}

.dataGrid {
  display: grid;
  gap: 1px;
  background: var(--border-default);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 1px;
}
.dataCell {
  height: 28px;
  cursor: pointer;
  transition: outline-color 150ms;
}
.dataCell:hover { outline: 2px solid var(--cyan-500); outline-offset: -2px; }

.colLabel, .rowLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}
.rowLabel { justify-content: flex-end; padding-right: 4px; }

.description {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
  min-height: 4rem;
}

@media (max-width: 640px) {
  .dataCell { height: 24px; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
export { default as AutogradGraph } from './ch01/AutogradGraph';
export { default as EmbeddingSpace } from './ch02/EmbeddingSpace';
export { default as Word2VecDynamics } from './ch02/Word2VecDynamics';
export { default as BPETraining } from './ch03/BPETraining';
export { default as TokenizerComparison } from './ch03/TokenizerComparison';
export { default as AttentionHeatmap } from './ch04/AttentionHeatmap';
export { default as CausalMask } from './ch04/CausalMask';
export { default as MultiHeadDecomposition } from './ch05/MultiHeadDecomposition';
export { default as TransformerBlockFlow } from './ch05/TransformerBlockFlow';
```

### 6. Update `src/pages/ch05-multihead-and-block/index.mdx`

**Edit A: Update imports:**

```mdx
import { MultiHeadDecomposition, TransformerBlockFlow } from '@components/widgets';
```

**Edit B: Replace section 7's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Pre-LN transformer block" caption="Data flowing through one Pre-LN transformer block: input → LN → attention → residual → LN → FFN → residual → output. The two residual arrows (in cyan) form the gradient 'highway' — each sublayer's output is added back to the unchanged input, preserving the path for backprop.">
  <TransformerBlockFlow client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 7 of Ch 5** renders with the working widget. Section 2's marquee widget still works.
3. **Initial state (stage 0):** "X (in)" box is active (cyan border); all other boxes dimmed. Data matrix shows the input values.
4. **Click Play:** advances through 7 stages at ~0.7 stages/sec (~10 seconds total). At each stage:
   - The corresponding box in the diagram becomes "active" (cyan-filled with cyan border)
   - Previously-active boxes become "completed" (slightly dimmed but visible)
   - Future boxes are "pending" (40% opacity)
   - The data matrix updates to show the current stage's values
   - The description updates
5. **Residual arrows:** the two cyan curved arrows arching over the sublayers are always visible (the chapter's key visual claim). When a residual stage is active (stages 3 or 6), the corresponding arrow has thicker stroke and full opacity.
6. **Scrubber works:** drag to jump to any stage.
7. **Data matrix:** 6×6 cells colored by value (red for positive, blue for negative). The "Input" stage (0) has small mixed values; "After LN" stages have more uniform magnitudes; "After Residual" stages preserve traces of the input.
8. **Mobile:** SVG scales via viewBox; data cells shrink slightly; scrubber tappable.
9. **`npm run typecheck`** passes.
10. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not implement live computation of the block.** Stage data is pre-computed; the widget shows the flow, not the math.
- ❌ **Do not show Q, K, V matrices.** The widget abstracts attention into a single MHA box; the Ch 5 marquee widget (session 24) handled multi-head decomposition.
- ❌ **Do not include positional encoding.** Ch 6 owns that; this widget shows the block as-is.
- ❌ **Do not toggle between Pre-LN and Post-LN modes.** Pre-LN only; the chapter prose has both variants discussed in section 7.
- ❌ **Do not flip Ch 5's status.** Session 26 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch05/TransformerBlockFlow.tsx src/components/widgets/ch05/TransformerBlockFlow.module.css src/components/widgets/ch05/block-flow-data.ts src/components/widgets/index.ts src/pages/ch05-multihead-and-block/index.mdx
git commit -m "session 25: transformer block flow widget — 7-stage data flow with visible residual highways"
git push origin main
```

---

## Notes for the session author

**On the SVG block diagram:**
The diagram has 8 boxes (X, LN₁, MHA, ⊕, LN₂, FFN, ⊕, out) and 2 curved residual arrows. The arches are quadratic Bézier curves with control points 70px above the linear path. This is enough arch height to clearly distinguish residuals from forward flow, without overlapping the box labels.

**On the residual highlight pattern:**
The two cyan curved arrows are *always visible at moderate opacity*. When a residual stage is active (stages 3 or 6), the corresponding arrow lights up (full opacity, thicker stroke). This makes the "gradient highway" visible even when not at a residual stage — the chapter's key visual claim is that the highway is always there.

**On the data matrix being "fake" precomputed values:**
The numbers don't come from running real attention or FFN computations. They're hand-tuned to demonstrate:
- Input → varied magnitudes
- After LN → magnitudes normalized (look more uniform)
- After MHA → patterns mixed across tokens
- After Residual₁ → input values clearly visible plus MHA's contribution (verifiable: AFTER_RESIDUAL_1 = INPUT + AFTER_MHA element-wise)
- After LN₂ → re-normalized
- After FFN → per-token transformation
- After Residual₂ → final output with both refinements

The reader can verify the residual additions by inspecting the data matrices (since AFTER_RESIDUAL_1 and AFTER_RESIDUAL_2 are computed as exact element-wise sums in the data file).

**On the 0.7 stages/sec pace:**
Each stage has a meaningful description. ~1.4 seconds per stage gives time to read the description and inspect the diagram + data. Faster pacing skims; slower drags. This is the right pace for a conceptually-dense animation.

**On color choice:**
- Block-diagram boxes: white-fill, cyan-active, dim-pending. Standard for the project.
- Data matrix: diverging red/blue (positive/negative). Same as Ch 4's attention heatmap.
- Residual arrows: cyan (project accent color, signals "look at me" semantics).

**Pedagogical claim this widget supports:** "The Pre-LN transformer block is a sequence of operations with two residual paths. The residual paths preserve the input through each sublayer; sublayers (LN, MHA, FFN) add refinements. The data at the output is the input plus the sum of both sublayer contributions." If the reader walks away believing the input is preserved through the block and that the sublayers are *refinements* not *replacements*, the widget has succeeded.

This is the secondary widget for Ch 5. Together with the marquee (multi-head decomposition), it covers the chapter's two major topics. The closeout session (26) handles exercises and status flip.
