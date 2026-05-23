# Session 51 — MoE routing visualizer marquee widget

> The marquee Chapter 11 widget. 16 hand-tuned tokens flow into an MoE layer with 8 experts; top-k routing decisions visualized as bezier curves between tokens and selected experts. Experts have implicit specializations (code, syntax, named entities, math) that emerge from the routing pattern. **One expert is deliberately under-utilized** (load = 0) to make the load-imbalance failure mode visible. Top-k toggle (1/2/4) shows how routing decisions change with $k$. Hover any token to see routing details; hover any expert to see all routed tokens. Replaces the section-3 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch11-moe/research.md`** — derivation 2 (top-k routing math) and the misconceptions on load balancing are the references
2. **`prompts/chapters/ch11-moe/session-50-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch04-attention/session-19-attention-heatmap-widget.md`** — for the hand-tuned-data pattern (AttentionHeatmap is the closest precedent for "data designed for pedagogical clarity")
4. **`prompts/chapters/ch02-embeddings/session-13-embedding-space-widget.md`** — for the hover-readout pattern (EmbeddingSpace uses similar SVG hover interaction)

---

## Goal

Replace the `<WidgetFrame title="MoE routing visualizer">` placeholder in section 3 with a working interactive widget that:

- Shows **16 tokens** in a vertical column on the left
- Shows **8 experts** in a vertical column on the right (with implicit specialization labels)
- Draws **bezier curves** from each token to its top-$k$ selected experts; curve width = gate value
- **Top-k toggle** (1, 2, or 4) — switching changes the routing decisions and curve patterns
- **Load distribution bar** below the diagram showing tokens-per-expert; highlights the deliberately under-utilized expert
- **Selected token panel** below showing routing details (logits, top-k indices, gates) for whichever token is hovered/clicked
- **Hover an expert** highlights all tokens routed to it
- **Hover a token** highlights the routing curves for that token

**End state:** section 3 of Chapter 11 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) the router makes a top-k decision per token; (b) different tokens go to different experts; (c) experts naturally specialize; (d) router collapse / under-utilization is a real failure mode (expert 4 visibly idle).

---

## Inputs

State of the repo after session 50:

- `src/pages/ch11-moe/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 6)
- `src/lib/chapters.ts` has Ch 11 as `'draft'`
- No `src/components/widgets/ch11/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch11/MoERoutingVisualizer.tsx` — the React widget
2. **Create** `src/components/widgets/ch11/MoERoutingVisualizer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch11/routing-data.ts` — hand-tuned tokens, experts, and routing logits
4. **Update** `src/components/widgets/index.ts` — add `MoERoutingVisualizer` export
5. **Update** `src/pages/ch11-moe/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<MoERoutingVisualizer client:visible />`

---

## Detailed spec

### 1. `routing-data.ts` — hand-tuned tokens and experts

The data layer pre-computes router logits such that each token has a clear "natural" top-2 routing to its specialization experts.

```ts
// src/components/widgets/ch11/routing-data.ts

export type ExpertCategory = 'punctuation' | 'syntax' | 'code_keyword' | 'code_primary' | 'unused' | 'entities' | 'numeric' | 'proper_noun';

export interface ExpertSpec {
  index: number;
  label: string;
  category: ExpertCategory;
  shortDescription: string;
}

export interface TokenSpec {
  index: number;
  text: string;
  category: string;
  /** Hand-tuned router logits for 8 experts. Top-2 should match the token's natural specialization. */
  logits: number[];
}

export const EXPERTS: ExpertSpec[] = [
  { index: 0, label: 'Expert 0', category: 'punctuation',  shortDescription: 'punctuation / boundaries' },
  { index: 1, label: 'Expert 1', category: 'syntax',       shortDescription: 'function words / syntax' },
  { index: 2, label: 'Expert 2', category: 'code_keyword', shortDescription: 'code keywords (secondary)' },
  { index: 3, label: 'Expert 3', category: 'code_primary', shortDescription: 'code (primary)' },
  { index: 4, label: 'Expert 4', category: 'unused',       shortDescription: 'under-utilized — see widget caption' },
  { index: 5, label: 'Expert 5', category: 'entities',     shortDescription: 'named entities' },
  { index: 6, label: 'Expert 6', category: 'numeric',      shortDescription: 'numeric / math' },
  { index: 7, label: 'Expert 7', category: 'proper_noun',  shortDescription: 'proper nouns / capitalized' },
];

/**
 * 16 hand-tuned tokens. Router logits chosen so each token's top-2 reveals
 * the expert specialization in a pedagogically clean way.
 *
 * Logit values: high (~2.5) for "primary" expert; medium (~1.5) for "secondary";
 * low/random (~-0.5) for others. Softmax over top-2 gives gates approximately (0.62, 0.38).
 *
 * Expert 4 receives NO high logits — making it visibly under-utilized.
 */
export const TOKENS: TokenSpec[] = [
  // Syntax / function words → Expert 1 + Expert 0
  { index: 0,  text: '"the"',      category: 'syntax',         logits: [1.5, 2.5, -0.5, -0.3, -0.8, -0.6, -0.4, 0.0] },
  { index: 1,  text: '"def"',      category: 'code',           logits: [-0.2, 0.5, 1.5, 2.5, -0.7, -0.4, -0.3, -0.5] },
  { index: 2,  text: '"Paris"',    category: 'named entity',   logits: [-0.5, -0.3, 0.0, -0.2, -0.6, 2.5, 0.2, 1.5] },
  { index: 3,  text: '"return"',   category: 'code',           logits: [0.1, 0.3, 1.5, 2.5, -0.8, -0.6, -0.4, -0.2] },
  { index: 4,  text: '"and"',      category: 'syntax',         logits: [1.5, 2.5, -0.4, -0.6, -0.7, -0.5, -0.3, 0.1] },
  { index: 5,  text: '"="',        category: 'operator',       logits: [0.5, 0.2, 0.8, 2.5, -0.5, -0.4, 1.5, -0.3] },
  { index: 6,  text: '"2024"',     category: 'numeric',        logits: [-0.4, -0.2, 0.0, 0.3, -0.8, 0.5, 2.5, 1.5] },
  { index: 7,  text: '"function"', category: 'code',           logits: [-0.3, 0.4, 1.5, 2.5, -0.6, -0.5, -0.2, 0.1] },
  { index: 8,  text: '"Einstein"', category: 'named entity',   logits: [-0.4, -0.2, 0.1, 0.0, -0.5, 2.5, 0.3, 1.5] },
  { index: 9,  text: '"if"',       category: 'code',           logits: [0.2, 1.5, 0.8, 2.5, -0.7, -0.5, -0.3, -0.4] },
  { index: 10, text: '","',        category: 'punctuation',    logits: [2.5, 1.5, -0.4, -0.6, -0.8, -0.7, -0.5, -0.2] },
  { index: 11, text: '"sum"',      category: 'math',           logits: [0.0, 0.4, 0.8, 1.5, -0.5, -0.3, 2.5, 0.2] },
  { index: 12, text: '"France"',   category: 'named entity',   logits: [-0.5, -0.3, 0.0, -0.1, -0.7, 2.5, 0.4, 1.5] },
  { index: 13, text: '"x"',        category: 'math var',       logits: [-0.2, 0.3, 0.5, 1.5, -0.6, -0.4, 2.5, 0.1] },
  { index: 14, text: '"import"',   category: 'code',           logits: [-0.3, 0.5, 1.5, 2.5, -0.5, -0.4, -0.2, 0.0] },
  { index: 15, text: '"}"',        category: 'punctuation',    logits: [2.5, 0.8, 0.3, 1.5, -0.7, -0.5, -0.3, -0.4] },
];

/** Softmax over an array. */
function softmax(x: number[]): number[] {
  const max = Math.max(...x);
  const exps = x.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

export interface RoutingDecision {
  tokenIndex: number;
  topKIndices: number[];
  topKLogits: number[];
  gates: number[];   // softmax over selected experts; sums to 1
  /** Full probability distribution over all experts (for inspection). */
  fullProbs: number[];
}

/**
 * Compute top-k routing for a token.
 */
export function routeToken(token: TokenSpec, k: number): RoutingDecision {
  // Find top-k indices by logit
  const indexed = token.logits.map((l, i) => ({ logit: l, idx: i }));
  indexed.sort((a, b) => b.logit - a.logit);
  const topK = indexed.slice(0, k);
  const topKIndices = topK.map(x => x.idx);
  const topKLogits = topK.map(x => x.logit);

  // Softmax over selected
  const gates = softmax(topKLogits);

  // Full probabilities (over all experts) for inspection
  const fullProbs = softmax(token.logits);

  return {
    tokenIndex: token.index,
    topKIndices,
    topKLogits,
    gates,
    fullProbs,
  };
}

/**
 * Compute routing for all tokens at given k. Returns per-token decisions
 * plus per-expert load (count of tokens routed to each expert).
 */
export function routeAllTokens(tokens: TokenSpec[], k: number): {
  decisions: RoutingDecision[];
  expertLoads: number[];   // length 8
} {
  const decisions = tokens.map(t => routeToken(t, k));
  const expertLoads = new Array(8).fill(0);
  decisions.forEach(d => {
    d.topKIndices.forEach(i => { expertLoads[i] += 1; });
  });
  return { decisions, expertLoads };
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌─────────────────────────────────────────────────────────────┐
│ Top-k routing:  [● Top-1]  [○ Top-2]  [○ Top-4]            │
│                                                              │
│ Tokens                              Experts                  │
│                                                              │
│ "the"      ───────╲                ┌──────────┐             │
│                    ╲────────────→  │ Expert 0 │ punctuation │
│ "def"      ─────────────────────→  └──────────┘             │
│                                    ┌──────────┐             │
│ "Paris"    ─────────────╲          │ Expert 1 │ syntax       │
│                          ╲───────→ └──────────┘             │
│ "return"   ─────────────────────→  ┌──────────┐             │
│                                    │ Expert 2 │ code 2nd     │
│ "and"      ───────────────────╲    └──────────┘             │
│                                ╲──→┌──────────┐             │
│ ...                                │ Expert 3 │ code main   │
│                                    └──────────┘             │
│                                    ┌──────────┐             │
│                                    │ Expert 4 │ ✗ unused    │
│                                    └──────────┘             │
│                                    ┌──────────┐             │
│ "Einstein" ─────────╲              │ Expert 5 │ entities    │
│                      ╲────────────→└──────────┘             │
│                                    ┌──────────┐             │
│                                    │ Expert 6 │ numeric     │
│                                    └──────────┘             │
│                                    ┌──────────┐             │
│                                    │ Expert 7 │ proper nouns│
│                                    └──────────┘             │
│                                                              │
│ Load distribution (tokens per expert):                       │
│ E0: ███       3                                             │
│ E1: █████     5                                             │
│ E2: ████      4                                             │
│ E3: ██████    6                                             │
│ E4: ░         0  ✗ under-utilized                           │
│ E5: ████      4                                             │
│ E6: ████      4                                             │
│ E7: ██████    6                                             │
│                                                              │
│ Hovered token: "Paris"                                       │
│ Top-2 routing: experts [5, 7] with gates [0.62, 0.38]       │
│ Expert 5 (named entities) is primary; Expert 7              │
│ (proper nouns) is secondary. Expert specialization emerged  │
│ from training, not from explicit assignment.                │
└─────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click a top-k radio (1/2/4) → routing decisions recompute; curves redraw; load bars update
- Hover a token → highlight its routing curves (thicker, brighter); other curves dim; selected-token panel shows that token's details
- Hover an expert → highlight curves *into* that expert from all routed tokens; non-routing tokens dim
- Clicking a token or expert "pins" the selection (sticky) until clicking elsewhere

### 3. `MoERoutingVisualizer.tsx`

```tsx
import { useMemo, useState } from 'react';
import {
  EXPERTS, TOKENS, routeAllTokens, type RoutingDecision,
} from './routing-data';
import styles from './MoERoutingVisualizer.module.css';

export default function MoERoutingVisualizer() {
  const [k, setK] = useState(2);
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);
  const [hoveredExpert, setHoveredExpert] = useState<number | null>(null);
  const [pinnedToken, setPinnedToken] = useState<number | null>(2);   // "Paris" pinned by default

  const { decisions, expertLoads } = useMemo(() => routeAllTokens(TOKENS, k), [k]);

  const activeTokenIdx = hoveredToken ?? pinnedToken;
  const activeDecision = activeTokenIdx !== null ? decisions[activeTokenIdx] : null;
  const activeToken = activeTokenIdx !== null ? TOKENS[activeTokenIdx] : null;
  const activeExpert = hoveredExpert;

  // Determine which curves to render with high opacity vs dimmed
  function isHighlighted(tokenIdx: number, expertIdx: number): boolean {
    if (activeExpert !== null) return expertIdx === activeExpert;
    if (activeTokenIdx !== null) return tokenIdx === activeTokenIdx;
    return true;   // no hover/pin → all visible
  }

  function isDimmed(tokenIdx: number, expertIdx: number): boolean {
    if (activeExpert !== null) return expertIdx !== activeExpert;
    if (activeTokenIdx !== null) return tokenIdx !== activeTokenIdx;
    return false;
  }

  return (
    <div className={styles.widget}>
      {/* Top-k toggle */}
      <div className={styles.kToggle}>
        <span className={styles.kToggleLabel}>Top-k routing:</span>
        {[1, 2, 4].map(kv => (
          <button
            key={kv}
            className={`${styles.kButton} ${k === kv ? styles.kButtonActive : ''}`}
            onClick={() => setK(kv)}
          >
            Top-{kv}
          </button>
        ))}
      </div>

      {/* Main diagram */}
      <div className={styles.diagramPanel}>
        <DiagramSvg
          decisions={decisions}
          k={k}
          isHighlighted={isHighlighted}
          isDimmed={isDimmed}
          activeExpert={activeExpert}
          onTokenHover={setHoveredToken}
          onTokenClick={i => setPinnedToken(i)}
          onExpertHover={setHoveredExpert}
        />
      </div>

      {/* Load distribution */}
      <div className={styles.loadPanel}>
        <div className={styles.loadTitle}>Load distribution (tokens routed per expert at top-{k})</div>
        {EXPERTS.map(e => {
          const load = expertLoads[e.index];
          const totalAssignments = TOKENS.length * k;
          const pct = (load / totalAssignments) * 100;
          const isUnused = load === 0;
          return (
            <div key={e.index} className={styles.loadRow}>
              <span className={styles.loadLabel}>E{e.index}</span>
              <div className={styles.loadBarTrack}>
                <div
                  className={`${styles.loadBarFill} ${isUnused ? styles.loadBarFillUnused : ''}`}
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>
              <span className={styles.loadCount}>{load}</span>
              {isUnused && <span className={styles.loadUnusedBadge}>✗ under-utilized</span>}
            </div>
          );
        })}
      </div>

      {/* Selected token panel */}
      {activeDecision && activeToken && (
        <div className={styles.selectedPanel}>
          <div className={styles.selectedTitle}>
            {hoveredToken !== null ? 'Hovered' : 'Selected'} token: <strong>{activeToken.text}</strong>
            <span className={styles.selectedCategory}>({activeToken.category})</span>
          </div>
          <div className={styles.selectedRouting}>
            Top-{k} routing: experts {' '}
            <strong>[{activeDecision.topKIndices.join(', ')}]</strong>
            {' '}with gates{' '}
            <strong>[{activeDecision.gates.map(g => g.toFixed(2)).join(', ')}]</strong>
          </div>
          <div className={styles.selectedExplanation}>
            Expert {activeDecision.topKIndices[0]} ({EXPERTS[activeDecision.topKIndices[0]!]!.shortDescription}) is primary.
            {activeDecision.topKIndices.length > 1 && (
              <> Expert {activeDecision.topKIndices[1]} ({EXPERTS[activeDecision.topKIndices[1]!]!.shortDescription}) is secondary.</>
            )}
            {' '}Expert specialization emerged from training, not explicit assignment.
          </div>
        </div>
      )}
    </div>
  );
}

interface DiagramProps {
  decisions: RoutingDecision[];
  k: number;
  isHighlighted: (tokenIdx: number, expertIdx: number) => boolean;
  isDimmed: (tokenIdx: number, expertIdx: number) => boolean;
  activeExpert: number | null;
  onTokenHover: (idx: number | null) => void;
  onTokenClick: (idx: number) => void;
  onExpertHover: (idx: number | null) => void;
}

function DiagramSvg(props: DiagramProps) {
  const { decisions, k, isHighlighted, isDimmed, onTokenHover, onTokenClick, onExpertHover } = props;

  const WIDTH = 760;
  const HEIGHT = 540;
  const TOKEN_COL_X = 80;
  const EXPERT_COL_X = 600;
  const TOKEN_ROW_GAP = 30;
  const EXPERT_ROW_GAP = 56;
  const TOKEN_TOP = 30;
  const EXPERT_TOP = 50;

  function tokenY(idx: number): number {
    return TOKEN_TOP + idx * TOKEN_ROW_GAP;
  }
  function expertY(idx: number): number {
    return EXPERT_TOP + idx * EXPERT_ROW_GAP;
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label="MoE routing visualizer">
      {/* Routing curves (bezier paths) — render first (below labels) */}
      {decisions.map((d, tokenIdx) =>
        d.topKIndices.map((expertIdx, j) => {
          const gate = d.gates[j]!;
          const tY = tokenY(tokenIdx);
          const eY = expertY(expertIdx);
          // Bezier control points create smooth curves
          const cx1 = TOKEN_COL_X + 200;
          const cx2 = EXPERT_COL_X - 200;
          const pathD = `M ${TOKEN_COL_X + 50} ${tY} C ${cx1} ${tY}, ${cx2} ${eY}, ${EXPERT_COL_X - 5} ${eY}`;

          const highlighted = isHighlighted(tokenIdx, expertIdx);
          const dimmed = isDimmed(tokenIdx, expertIdx);

          return (
            <path
              key={`curve-${tokenIdx}-${expertIdx}`}
              d={pathD}
              className={`${styles.routingCurve} ${highlighted ? styles.curveHighlighted : ''} ${dimmed ? styles.curveDimmed : ''}`}
              style={{
                strokeWidth: 1 + gate * 3,   // thicker for higher gate
                stroke: dimmed ? 'var(--border-subtle)' : 'var(--cyan-400)',
                opacity: dimmed ? 0.15 : 0.4 + gate * 0.5,
              }}
            />
          );
        })
      )}

      {/* Tokens (left column) */}
      {TOKENS.map((token, idx) => (
        <g key={`token-${idx}`}
           className={styles.tokenGroup}
           onMouseEnter={() => onTokenHover(idx)}
           onMouseLeave={() => onTokenHover(null)}
           onClick={() => onTokenClick(idx)}
           style={{ cursor: 'pointer' }}
        >
          <rect
            x={TOKEN_COL_X - 50} y={tokenY(idx) - 10}
            width={100} height={20}
            rx={3}
            className={styles.tokenBox}
          />
          <text
            x={TOKEN_COL_X} y={tokenY(idx) + 4}
            className={styles.tokenLabel}
            textAnchor="middle"
          >
            {token.text}
          </text>
        </g>
      ))}

      {/* Experts (right column) */}
      {EXPERTS.map((expert, idx) => {
        const eY = expertY(idx);
        const expertLoad = decisions.filter(d => d.topKIndices.includes(idx)).length;
        const isUnused = expertLoad === 0;
        return (
          <g key={`expert-${idx}`}
             className={styles.expertGroup}
             onMouseEnter={() => onExpertHover(idx)}
             onMouseLeave={() => onExpertHover(null)}
             style={{ cursor: 'pointer' }}
          >
            <rect
              x={EXPERT_COL_X} y={eY - 22}
              width={140} height={44}
              rx={5}
              className={`${styles.expertBox} ${isUnused ? styles.expertBoxUnused : ''}`}
            />
            <text x={EXPERT_COL_X + 70} y={eY - 5} className={styles.expertLabel} textAnchor="middle">
              {expert.label}
            </text>
            <text x={EXPERT_COL_X + 70} y={eY + 12} className={styles.expertSubLabel} textAnchor="middle">
              {expert.shortDescription}
            </text>
            {isUnused && (
              <text x={EXPERT_COL_X + 145} y={eY} className={styles.expertUnusedFlag} fontSize="14">
                ✗
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
```

### 4. `MoERoutingVisualizer.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.kToggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.kToggleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-right: 0.5rem;
}
.kButton {
  padding: 0.4rem 0.9rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.kButton:hover { border-color: var(--border-strong); color: var(--text-primary); }
.kButtonActive {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

.diagramPanel {
  padding: 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.svg { width: 100%; height: auto; }

.tokenBox {
  fill: var(--bg-primary);
  stroke: var(--border-default);
  stroke-width: 1;
  transition: stroke 200ms, fill 200ms;
}
.tokenGroup:hover .tokenBox { stroke: var(--cyan-400); fill: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-primary)); }
.tokenLabel {
  fill: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  pointer-events: none;
}

.expertBox {
  fill: var(--bg-primary);
  stroke: var(--border-default);
  stroke-width: 1;
  transition: stroke 200ms, fill 200ms;
}
.expertGroup:hover .expertBox { stroke: var(--cyan-400); fill: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-primary)); }
.expertBoxUnused {
  stroke: var(--rose-400);
  stroke-dasharray: 4 3;
}
.expertLabel {
  fill: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  pointer-events: none;
}
.expertSubLabel {
  fill: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  pointer-events: none;
}
.expertUnusedFlag { fill: var(--rose-400); pointer-events: none; }

.routingCurve {
  fill: none;
  transition: opacity 200ms, stroke-width 200ms;
}

.loadPanel {
  padding: 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.loadTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.loadRow {
  display: grid;
  grid-template-columns: 30px 1fr 30px auto;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
}
.loadLabel { color: var(--text-secondary); }
.loadCount { color: var(--text-primary); text-align: right; }
.loadBarTrack {
  height: 14px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.loadBarFill {
  height: 100%;
  background: var(--cyan-500);
  min-width: 2px;
  transition: width 200ms;
}
.loadBarFillUnused { background: var(--rose-500); opacity: 0.5; }
.loadUnusedBadge {
  color: var(--rose-400);
  font-size: 0.7rem;
  font-style: italic;
}

.selectedPanel {
  padding: 0.85rem 1rem;
  background: color-mix(in srgb, var(--cyan-500) 6%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-md);
}
.selectedTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
}
.selectedTitle strong { color: var(--cyan-300); }
.selectedCategory {
  color: var(--text-tertiary);
  margin-left: 0.5rem;
  font-size: 0.72rem;
}
.selectedRouting {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}
.selectedRouting strong { color: var(--cyan-300); }
.selectedExplanation {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

@media (max-width: 640px) {
  .loadRow { grid-template-columns: 25px 1fr 25px; }
  .loadUnusedBadge { display: none; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as MoERoutingVisualizer } from './ch11/MoERoutingVisualizer';
// Session 52 will add:
// export { default as ActiveVsTotalParams } from './ch11/ActiveVsTotalParams';
```

### 6. Update `src/pages/ch11-moe/index.mdx`

**Edit A: Add widget import:**

```mdx
import { MoERoutingVisualizer } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="MoE routing visualizer" caption="16 hand-tuned tokens flow into an MoE layer with 8 experts. Curves show top-k routing; thicker curves = higher gate values. Hover any token to highlight its routing; hover any expert to see all routed tokens. Toggle top-k between 1, 2, and 4 to see how routing decisions change. Expert 4 is deliberately under-utilized — a real failure mode the auxiliary loss is designed to prevent. Note: real expert specialization is messier than shown; this widget hand-tunes the routing for pedagogical clarity.">
  <MoERoutingVisualizer client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 11** renders with the working widget. Section 6's placeholder still stubbed.
3. **Initial state:** top-2 routing active; 16 token boxes on left; 8 expert boxes on right; bezier curves connecting them; pinned token = "Paris" with routing to experts [5, 7].
4. **At top-1:** each token has exactly one curve. Expert 3 (code main) handles the code tokens; Expert 5 handles named entities; Expert 1 handles syntax. Expert 4 has 0 load.
5. **At top-2:** each token has two curves. Curve thickness reflects gate value (primary expert curve is thicker). Expert loads roughly double.
6. **At top-4:** each token has four curves. Many curves; visualization is busy by design. Reader sees how more routing increases compute and reduces sparsity.
7. **Expert 4 visibly unused** at all top-k values (load = 0; dashed rose border; "✗" flag; "under-utilized" badge in load panel).
8. **Hovering a token:** that token's curves brighten; others dim. Selected-token panel updates to show that token's routing details.
9. **Hovering an expert:** all curves *into* that expert brighten; others dim. Hovering Expert 4 shows no incoming curves.
10. **Clicking a token** pins it as the "selected" token, persisting after hover ends.
11. **Load bars** below diagram show the per-expert distribution. Expert 4's bar is empty (or 1px wide) with rose tint.
12. **Mobile (< 640px):** layout reflows; "under-utilized" badge hides on small screens to save space.
13. **`npm run typecheck`** passes.
14. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not make the routing dynamic (re-randomize logits).** Hand-tuned data is the point.
- ❌ **Do not add an animated forward pass.** Static visualization with hover interaction.
- ❌ **Do not implement the auxiliary loss in the widget.** That belongs in section 4's prose + runnable.
- ❌ **Do not implement expert capacity / dropped tokens visualization.** Out of widget scope.
- ❌ **Do not animate token-by-token routing.** All tokens visible simultaneously.
- ❌ **Do not flip Ch 11's status.** Session 52 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch11/ src/components/widgets/index.ts src/pages/ch11-moe/index.mdx
git commit -m "session 51: MoE routing visualizer marquee widget — top-k routing with hand-tuned expert specialization"
git push origin main
```

Verify on production:
- 8 expert boxes, expert 4 with dashed rose border
- 16 token boxes; clicking each updates the routing panel
- Top-k toggle visibly changes the curve density
- The bezier curves are smooth and color-coded by gate value
- The under-utilized expert is the visual anchor of the load-imbalance story

---

## Notes for the session author

**On the hand-tuned routing logits:**
The logits are not random — they're designed so each token's top-2 reveals the expert's "specialty" cleanly:
- "the", "and" → experts 1 (syntax) + 0 (punctuation/general)
- "def", "return", "function", "import", "if" → experts 3 (code primary) + 2 (code secondary)
- "Paris", "Einstein", "France" → experts 5 (entities) + 7 (proper nouns)
- "2024", "sum", "x", "=" → experts 6 (numeric/math) + 3 (code, since math overlaps)
- ",", "}" → experts 0 (punctuation) + others

Real MoE expert specialization is messier — the Mixtral paper found experts don't strongly specialize by intuitive categories. The widget caption acknowledges this: "Note: real expert specialization is messier than shown; this widget hand-tunes the routing for pedagogical clarity." The point is to show *the routing mechanism*, not to claim real experts specialize this cleanly.

**On Expert 4 being deliberately unused:**
Setting all of Expert 4's logits to slightly negative values (~-0.5 to -0.8) ensures it's never in any token's top-k. This makes the load-imbalance failure mode visible — the reader can *see* an unused expert. The rose-bordered expert with the "✗" flag is the visual anchor for the chapter's load-balancing discussion. Without this, "router collapse" is just an abstract concept.

**On the top-k toggle showing the sparsity trade-off:**
At top-1, each token uses 1/8 = 12.5% of expert parameters → maximum sparsity.
At top-2, each token uses 2/8 = 25% → modern standard.
At top-4, each token uses 4/8 = 50% → less sparse, more compute per token.

The visual density of bezier curves directly reflects the sparsity:
- Top-1: 16 curves (sparse, clean)
- Top-2: 32 curves (modern dense)
- Top-4: 64 curves (visually overwhelming — by design; shows why high-k defeats MoE's purpose)

**On bezier curves vs straight lines:**
Bezier curves are visually superior for "flow" diagrams. The Sankey-style cubic bezier (`M start C cp1, cp2, end`) with control points at ~25% and ~75% across produces smooth, readable flows. Straight lines would cross more confusingly and obscure the routing pattern.

**On the curve thickness encoding gate value:**
Primary expert (gate ≈ 0.62) gets thicker line; secondary expert (gate ≈ 0.38) gets thinner. Reader sees not just *which* experts a token uses but *how much* the router prefers each. The gate magnitude is meaningful — encoding it visually adds depth.

**On the pinned-token default ("Paris"):**
"Paris" is the most pedagogically illustrative example: routes to experts 5 (entities) + 7 (proper nouns), both of which have clean specializations. Reader's first view of the widget shows a sensible routing decision with clear semantics.

**Pedagogical claim this widget supports:**
"MoE routing is a discrete decision per token. The router picks top-k experts based on learned logits. Different tokens go to different expert combinations, and experts naturally specialize through training. But the routing is fragile — without load balancing, some experts dominate and others starve (Expert 4). The auxiliary loss exists precisely to prevent this failure mode."

After 30 seconds of interaction, the reader has internalized: (a) routing is per-token; (b) top-k controls sparsity; (c) experts can specialize; (d) router collapse is a real concern made visible by Expert 4's idle state.

**Build with care.** This is the chapter's most distinctive visualization — the kind of thing that explains MoE in one image.
