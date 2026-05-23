# Session 113 — Ch 25 linear probing visualizer + exercises + closeout

> **The Chapter 25 closeout.** Three deliverables: (1) implement the **Linear Probing Visualizer** secondary widget — a line chart of probe accuracy across 12 layers of a small transformer for **6 preset concepts** (token identity, sentence boundaries, part-of-speech, named entities, sentiment, refusal patterns); makes **layer-wise feature emergence** visible — surface features peak early, semantic features peak mid-late, task-specific features peak last; (2) add an **Exercises section** with 4 problems (linear probe from scratch, toy SAE training, activation patching, SAE feature labeling); (3) flip Ch 25's status from `'draft'` to `'published'`. **Closes Ch 25.** Phase 14 progress: two of three chapters complete. **Ch 26 (Evaluation) opens next — and closes Phase 14.**

This is a **single-topic chapter** (4-file cadence). The secondary widget combines with exercises in this final session — the standard closeout pattern. **File 143 is the file that closes Chapter 25.**

---

## Read first (in this order)

1. **`research/ch25-interpretability/research.md`** — concepts 2 (probes), 4 (SAEs), 6 (causal interventions) are the source material
2. **`prompts/chapters/ch25-interpretability/session-111-page-structure.md`** — for the section-2 widget placeholder and exercise placement
3. **`prompts/chapters/ch25-interpretability/session-112-sae-feature-explorer-widget.md`** — for the Ch 25 widget conventions
4. **`prompts/chapters/ch24-safety/session-109-prompt-injection-classifier-and-exercises-and-closeout.md`** — for the recent Phase 14 closeout pattern

---

## Goal

By end of session, three things change in the repo:

1. **`LinearProbingVisualizer` widget** is implemented and wired into section 2. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("The current state of the field") and section 8 ("Phase 14 ahead"). Four exercises with hints + runnable starter code.
3. **Ch 25's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 25 is the twenty-fifth published chapter — and the second of Phase 14.**

After this session: **Ch 25 is complete.** Phase 14: two of three chapters on production.

---

## Inputs

State of the repo after session 112:

- Section 4's `SAEFeatureExplorer` marquee widget is wired
- Section 2's widget is still stubbed
- All 3 runnable code blocks from session 111 are in place (linear probe, toy SAE, activation patching)
- `src/lib/chapters.ts` has Ch 1-24 `'published'`, Ch 25 `'draft'`
- `src/components/widgets/ch25-interpretability/` exists with `SAEFeatureExplorer` already

---

## Deliverables

1. **Create** `src/components/widgets/ch25-interpretability/LinearProbingVisualizer.tsx` — the React widget
2. **Create** `src/components/widgets/ch25-interpretability/LinearProbingVisualizer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch25-interpretability/probing-data.ts` — 6 concepts with per-layer probe accuracies
4. **Update** `src/components/widgets/index.ts` — add `LinearProbingVisualizer` export
5. **Update** `src/pages/ch25-interpretability/index.mdx`:
   - Replace section-2's `<WidgetFrame>` interior with `<LinearProbingVisualizer client:visible />`
   - Insert new `## Exercises` section between section 7 ("The current state of the field") and section 8 ("Phase 14 ahead")
6. **Update** `src/lib/chapters.ts` — change Ch 25's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 25's marquee widget is sealed.

---

## Detailed spec

### Part A — `LinearProbingVisualizer` widget

#### A.1 `probing-data.ts`

```ts
// src/components/widgets/ch25-interpretability/probing-data.ts

/**
 * Six concepts and their per-layer probe accuracies on a 12-layer transformer.
 *
 * The data illustrates *layer-wise feature emergence*:
 *   - Surface features (token identity) peak in early layers
 *   - Syntactic features (POS, sentence boundaries) peak in early-middle
 *   - Semantic features (NER, sentiment) peak in middle-late
 *   - Task-specific features (refusal patterns) peak at the end
 *
 * Numbers are illustrative — chosen to reflect typical patterns reported in
 * the probing literature (Tenney et al. 2019, Belinkov & Glass 2019).
 */

export type ConceptCategory = 'surface' | 'syntactic' | 'semantic' | 'task-specific';

export interface ProbeConcept {
  id: string;
  label: string;
  category: ConceptCategory;
  description: string;
  /** Per-layer probe accuracy on a 12-layer model (layers 0..11). 0..1. */
  accuracyByLayer: number[];
  /** Plain-prose note about why this concept emerges at the layer it does. */
  note: string;
}

export const N_LAYERS = 12;

export const CONCEPTS: ProbeConcept[] = [
  {
    id: 'token-identity',
    label: 'Token identity',
    category: 'surface',
    description: 'Decoding which token is at a given position. The most basic information; trivially recoverable from the input embedding.',
    accuracyByLayer: [
      0.99, 0.97, 0.94, 0.89, 0.83, 0.76,    // early layers retain token identity strongly
      0.69, 0.62, 0.55, 0.49, 0.42, 0.36,    // gradually washed out by deeper computation
    ],
    note: 'Token identity is maximally decodable at layer 0 (the embedding). As the model adds task-relevant transformations across layers, the original token identity is gradually mixed into more abstract representations.',
  },
  {
    id: 'sentence-boundary',
    label: 'Sentence boundaries',
    category: 'syntactic',
    description: 'Detecting whether the current token ends a sentence. Mostly punctuation-driven; emerges early.',
    accuracyByLayer: [
      0.74, 0.88, 0.94, 0.96, 0.95, 0.92,    // peaks at layer 3
      0.87, 0.82, 0.77, 0.73, 0.69, 0.66,
    ],
    note: 'Sentence boundary detection requires combining token identity with simple positional patterns. It emerges in the early layers where the model is doing surface-level structural parsing.',
  },
  {
    id: 'pos',
    label: 'Part of speech',
    category: 'syntactic',
    description: 'Classifying each token as a noun, verb, adjective, etc. A syntactic concept; peaks in early-middle layers.',
    accuracyByLayer: [
      0.51, 0.70, 0.84, 0.91, 0.94, 0.93,    // peaks at layer 4
      0.89, 0.84, 0.78, 0.73, 0.69, 0.65,
    ],
    note: 'Part-of-speech information emerges in early-middle layers, after the model has built up enough context to disambiguate (e.g., "run" as noun vs. verb). It declines later as the model moves to more abstract task-relevant representations.',
  },
  {
    id: 'ner',
    label: 'Named entities',
    category: 'semantic',
    description: 'Identifying spans that refer to people, places, organizations. A semantic concept; peaks in mid-late layers.',
    accuracyByLayer: [
      0.42, 0.55, 0.66, 0.74, 0.81, 0.86,
      0.89, 0.91, 0.92, 0.91, 0.89, 0.86,    // peaks at layers 7-8
    ],
    note: 'Named-entity recognition needs both syntactic structure (which tokens are nouns) and semantic knowledge (which nouns are entities). It emerges in middle-late layers where syntax and semantics combine.',
  },
  {
    id: 'sentiment',
    label: 'Sentiment',
    category: 'semantic',
    description: 'Classifying text as positive, negative, or neutral. A semantic concept that requires integration across many tokens.',
    accuracyByLayer: [
      0.51, 0.55, 0.61, 0.68, 0.74, 0.80,
      0.85, 0.89, 0.91, 0.93, 0.92, 0.89,    // peaks at layer 9
    ],
    note: 'Sentiment requires aggregating information across the whole input. It emerges in late layers where the model has had several opportunities to integrate context.',
  },
  {
    id: 'refusal',
    label: 'Refusal patterns',
    category: 'task-specific',
    description: 'Detecting whether the model will (or did) refuse the request. A task-specific behavior; peaks at the last layer.',
    accuracyByLayer: [
      0.50, 0.51, 0.52, 0.54, 0.58, 0.63,
      0.69, 0.75, 0.81, 0.86, 0.91, 0.95,    // peaks at the final layer
    ],
    note: 'Refusal is a decision the model commits to at output. It emerges only in the last layers — after the model has integrated all input context and reached a behavioral conclusion. The "refusal direction" identified in late layers is what makes refusal-clamping interventions possible.',
  },
];

/** Category labels and colors. */
export const CATEGORIES: Record<ConceptCategory, { label: string; color: string }> = {
  'surface':       { label: 'surface',       color: 'var(--cyan-400)' },
  'syntactic':     { label: 'syntactic',     color: 'var(--amber-400)' },
  'semantic':      { label: 'semantic',      color: 'var(--violet-400)' },
  'task-specific': { label: 'task-specific', color: 'var(--rose-400)' },
};

/** Find the peak layer index for a concept. */
export function peakLayer(concept: ProbeConcept): number {
  let bestIdx = 0;
  let best = -Infinity;
  for (let i = 0; i < concept.accuracyByLayer.length; i++) {
    if (concept.accuracyByLayer[i]! > best) {
      best = concept.accuracyByLayer[i]!;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** Find the peak accuracy for a concept. */
export function peakAccuracy(concept: ProbeConcept): number {
  return Math.max(...concept.accuracyByLayer);
}
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ Linear probing visualizer                                        │
│ 6 concepts · 12 layers · layer-wise feature emergence            │
│                                                                  │
│ Pick a concept:                                                  │
│  [ Token identity ] [ Sentence boundary ] [ Part of speech ]    │
│  [ Named entities ] [ Sentiment ] [ Refusal patterns ]           │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ TOKEN IDENTITY                              surface          │ │
│ │                                                                │ │
│ │ Description: Decoding which token is at a given position...  │ │
│ │                                                                │ │
│ │ Probe accuracy by layer:                                     │ │
│ │ ┌──────────────────────────────────────────────────────────┐│ │
│ │ │ 1.0 ●                                                       ││ │
│ │ │     ╲                                                       ││ │
│ │ │      ●                                                      ││ │
│ │ │       ╲   ← peak: layer 0 (0.99)                            ││ │
│ │ │        ●                                                    ││ │
│ │ │         ╲___                                                ││ │
│ │ │             ●___                                            ││ │
│ │ │                 ●___                                        ││ │
│ │ │                     ●___                                    ││ │
│ │ │                         ●___                                ││ │
│ │ │                             ●___                            ││ │
│ │ │                                 ●___                        ││ │
│ │ │ 0.5                                  ●                      ││ │
│ │ │     L0  L1  L2  L3  L4  L5  L6  L7  L8  L9  L10 L11        ││ │
│ │ └──────────────────────────────────────────────────────────┘│ │
│ │                                                                │ │
│ │ Note: Token identity is maximally decodable at layer 0...    │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ All 6 concepts overlaid:                                         │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Multi-line chart showing all concepts in their category      │ │
│ │ colors; selected concept in cyan and bold                    │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Peak layer summary table                                         │
│                                                                  │
│ Pedagogical caption                                               │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click concept button → updates description, primary line chart, note, and highlights this concept's line in the overlay chart
- Both charts re-render with smooth transitions

**Visual encoding:**
- **Concept buttons**: left-border tinted by category color (surface = cyan, syntactic = amber, semantic = violet, task-specific = rose)
- **Category badge** in detail panel: filled background tinted by category color
- **Primary chart**: line + dots; cyan color; gridlines at 0.5, 0.75, 1.0; peak layer marked with a small star/diamond and label
- **Overlay chart**: 6 lines (one per concept) in their category colors; the selected one becomes cyan + bold/thick
- **Peak layer summary table**: 6 rows × 3 columns (concept | category | peak layer | peak accuracy)

#### A.3 `LinearProbingVisualizer.tsx`

```tsx
import { useState } from 'react';
import {
  CONCEPTS, CATEGORIES, N_LAYERS, peakLayer, peakAccuracy,
  type ProbeConcept,
} from './probing-data';
import styles from './LinearProbingVisualizer.module.css';

const CHART_W = 700;
const CHART_H = 300;
const PAD_L = 50;
const PAD_R = 30;
const PAD_T = 25;
const PAD_B = 35;

function toX(layerIdx: number): number {
  return PAD_L + (layerIdx / (N_LAYERS - 1)) * (CHART_W - PAD_L - PAD_R);
}
function toY(accuracy: number): number {
  // Map [0.4, 1.0] to chart vertical
  const norm = (accuracy - 0.4) / 0.6;
  return CHART_H - PAD_B - norm * (CHART_H - PAD_T - PAD_B);
}

function buildPath(accuracies: number[]): string {
  return accuracies.map((acc, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(acc)}`).join(' ');
}

export default function LinearProbingVisualizer() {
  const [idx, setIdx] = useState(0);
  const concept = CONCEPTS[idx]!;
  const peak = peakLayer(concept);
  const peakAcc = peakAccuracy(concept);
  const category = CATEGORIES[concept.category];

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Linear probing visualizer</div>
        <div className={styles.titleSubLabel}>
          6 concepts · 12-layer transformer · layer-wise feature emergence
        </div>
      </div>

      {/* Concept picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a concept:</span>
          <div className={styles.conceptButtons}>
            {CONCEPTS.map((c, i) => (
              <button
                key={c.id}
                className={`${styles.conceptButton} ${idx === i ? styles.conceptButtonActive : ''}`}
                style={{ borderLeftColor: CATEGORIES[c.category].color }}
                onClick={() => setIdx(i)}
              >{c.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel: description + primary chart + note */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{concept.label.toUpperCase()}</div>
          <div
            className={styles.categoryBadge}
            style={{
              background: `color-mix(in srgb, ${category.color} 18%, transparent)`,
              color: category.color,
              borderColor: `color-mix(in srgb, ${category.color} 40%, transparent)`,
            }}
          >
            {category.label}
          </div>
        </div>
        <div className={styles.descriptionText}>{concept.description}</div>

        {/* Primary chart */}
        <div className={styles.chartSection}>
          <div className={styles.sectionLabel}>Probe accuracy by layer</div>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className={styles.primaryChart}
            role="img"
            aria-label={`Probe accuracy across layers for ${concept.label}`}
          >
            {/* Gridlines */}
            {[0.5, 0.75, 1.0].map(val => (
              <g key={val}>
                <line
                  x1={PAD_L} y1={toY(val)}
                  x2={CHART_W - PAD_R} y2={toY(val)}
                  className={styles.gridLine}
                />
                <text
                  x={PAD_L - 8} y={toY(val) + 4}
                  className={styles.axisLabel}
                  textAnchor="end"
                >{val.toFixed(2)}</text>
              </g>
            ))}
            {/* X-axis layer labels */}
            {concept.accuracyByLayer.map((_, i) => (
              <text
                key={`x-${i}`}
                x={toX(i)} y={CHART_H - PAD_B + 16}
                className={styles.axisLabel}
                textAnchor="middle"
              >L{i}</text>
            ))}
            {/* Line + dots */}
            <path
              d={buildPath(concept.accuracyByLayer)}
              className={styles.primaryLine}
            />
            {concept.accuracyByLayer.map((acc, i) => (
              <circle
                key={`pt-${i}`}
                cx={toX(i)} cy={toY(acc)}
                r={i === peak ? 7 : 4}
                fill={i === peak ? 'var(--cyan-300)' : 'var(--cyan-400)'}
                stroke={i === peak ? 'var(--cyan-300)' : 'none'}
                strokeWidth={i === peak ? 2 : 0}
                className={i === peak ? styles.peakDot : styles.primaryDot}
              />
            ))}
            {/* Peak label */}
            <text
              x={toX(peak)} y={toY(peakAcc) - 14}
              className={styles.peakLabel}
              textAnchor={peak < 2 ? 'start' : peak > N_LAYERS - 3 ? 'end' : 'middle'}
            >peak: L{peak} ({peakAcc.toFixed(2)})</text>

            {/* Axis labels */}
            <text x={20} y={CHART_H / 2} className={styles.axisTitle} transform={`rotate(-90 20 ${CHART_H / 2})`} textAnchor="middle">probe accuracy</text>
            <text x={CHART_W / 2} y={CHART_H - 4} className={styles.axisTitle} textAnchor="middle">layer index</text>
          </svg>
        </div>

        {/* Note */}
        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Why this layer?</div>
          <div className={styles.noteText}>{concept.note}</div>
        </div>
      </div>

      {/* Overlay chart: all 6 concepts */}
      <div className={styles.overlayPanel}>
        <div className={styles.overlayTitle}>All 6 concepts overlaid (selected concept in cyan)</div>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className={styles.overlayChart}
          role="img"
          aria-label="All concepts probe accuracy by layer"
        >
          {/* Gridlines */}
          {[0.5, 0.75, 1.0].map(val => (
            <g key={val}>
              <line
                x1={PAD_L} y1={toY(val)}
                x2={CHART_W - PAD_R} y2={toY(val)}
                className={styles.gridLine}
              />
              <text
                x={PAD_L - 8} y={toY(val) + 4}
                className={styles.axisLabel}
                textAnchor="end"
              >{val.toFixed(2)}</text>
            </g>
          ))}
          {/* X-axis */}
          {Array.from({ length: N_LAYERS }, (_, i) => i).map(i => (
            <text
              key={`xo-${i}`}
              x={toX(i)} y={CHART_H - PAD_B + 16}
              className={styles.axisLabel}
              textAnchor="middle"
            >L{i}</text>
          ))}
          {/* Lines for each concept */}
          {CONCEPTS.map((c, i) => {
            const isActive = i === idx;
            const color = isActive ? 'var(--cyan-400)' : CATEGORIES[c.category].color;
            return (
              <g key={c.id}>
                <path
                  d={buildPath(c.accuracyByLayer)}
                  fill="none"
                  stroke={color}
                  strokeWidth={isActive ? 3 : 1.5}
                  opacity={isActive ? 1 : 0.55}
                  className={styles.overlayLine}
                />
                {/* Endpoint label */}
                <text
                  x={toX(N_LAYERS - 1) + 4}
                  y={toY(c.accuracyByLayer[N_LAYERS - 1]!) + 4}
                  className={styles.overlayLineLabel}
                  fill={color}
                  fontWeight={isActive ? 600 : 400}
                  opacity={isActive ? 1 : 0.7}
                >{c.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Peak layer summary table */}
      <div className={styles.summaryPanel}>
        <div className={styles.sectionLabel}>Peak layer summary</div>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Concept</th>
              <th>Category</th>
              <th>Peak layer</th>
              <th>Peak accuracy</th>
            </tr>
          </thead>
          <tbody>
            {CONCEPTS.map((c, i) => {
              const pL = peakLayer(c);
              const pA = peakAccuracy(c);
              return (
                <tr
                  key={c.id}
                  className={i === idx ? styles.summaryRowActive : ''}
                  onClick={() => setIdx(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{c.label}</td>
                  <td>
                    <span
                      className={styles.summaryFamilyDot}
                      style={{ background: CATEGORIES[c.category].color }}
                    />
                    {CATEGORIES[c.category].label}
                  </td>
                  <td>L{pL}</td>
                  <td>{pA.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Click through the concepts. <strong>Surface features</strong> (token identity) peak at layer 0 and
        fade across layers — the model transforms surface info into abstract representations.{' '}
        <strong>Syntactic features</strong> (sentence boundary, POS) peak in early-middle layers.{' '}
        <strong>Semantic features</strong> (named entities, sentiment) peak in middle-late layers, requiring
        more context integration. <strong>Task-specific features</strong> (refusal patterns) peak at the
        last layer — the model commits to behavioral decisions only after integrating all context.{' '}
        <strong>This layer-wise emergence pattern</strong> is one of probing's most robust findings —
        and a window into how computation flows through a transformer.
      </div>
    </div>
  );
}
```

#### A.4 `LinearProbingVisualizer.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .detailPanel, .overlayPanel,
.summaryPanel, .caption {
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
.conceptButtons { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; }
.conceptButton {
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
.conceptButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.conceptButtonActive {
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
.categoryBadge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  font-weight: 500;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  text-transform: lowercase;
  border: 1px solid;
}
.descriptionText {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin-bottom: 0.85rem;
}

.sectionLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
  font-weight: 500;
}

/* Charts */
.chartSection { margin-bottom: 0.85rem; }
.primaryChart, .overlayChart {
  width: 100%;
  height: auto;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.gridLine {
  stroke: var(--border-subtle);
  stroke-width: 1;
  stroke-dasharray: 3 3;
  opacity: 0.6;
}
.axisLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  fill: var(--text-tertiary);
}
.axisTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  fill: var(--text-secondary);
}
.primaryLine {
  fill: none;
  stroke: var(--cyan-400);
  stroke-width: 2.5;
  transition: d 300ms;
}
.primaryDot { transition: cx 300ms, cy 300ms; }
.peakDot {
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--cyan-500) 60%, transparent));
}
.peakLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  fill: var(--cyan-300);
  font-weight: 600;
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

/* Overlay chart */
.overlayTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.6rem;
  font-weight: 500;
}
.overlayLine { transition: stroke-width 200ms, opacity 200ms; }
.overlayLineLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
}

/* Summary table */
.summaryTable {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.summaryTable th {
  text-align: left;
  padding: 0.5rem 0.6rem;
  background: var(--bg-primary);
  color: var(--text-tertiary);
  font-weight: 500;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
}
.summaryTable td {
  padding: 0.5rem 0.6rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
}
.summaryRowActive {
  background: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-elevated));
}
.summaryRowActive td { color: var(--cyan-300); }
.summaryFamilyDot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 0.45rem;
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
  .axisLabel { font-size: 0.55rem; }
  .overlayLineLabel { font-size: 0.55rem; }
  .summaryTable { font-size: 0.72rem; }
  .summaryTable th, .summaryTable td { padding: 0.4rem 0.4rem; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as SAEFeatureExplorer }       from './ch25-interpretability/SAEFeatureExplorer';
export { default as LinearProbingVisualizer }  from './ch25-interpretability/LinearProbingVisualizer';
```

#### A.6 Update `src/pages/ch25-interpretability/index.mdx`

**Edit A: Update widget import:**

```mdx
import { SAEFeatureExplorer, LinearProbingVisualizer } from '@components/widgets';
```

**Edit B: Replace section-2's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Linear probing visualizer" caption="Six concepts (token identity, sentence boundaries, part-of-speech, named entities, sentiment, refusal patterns) probed across 12 layers of a small transformer. Each concept's probe accuracy curve reveals where in the network the concept becomes most decodable. The pattern: surface features peak early, syntactic features in early-middle, semantic features in mid-late, task-specific features at the very end. One of probing's most robust empirical findings — and a window into how computation flows through transformer layers.">
  <LinearProbingVisualizer client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("The current state of the field") and section 8 ("Phase 14 ahead"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the interpretability toolkit. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

The exercises trace the chapter's arc: train a linear probe from scratch (Ex 1) → train a toy sparse autoencoder (Ex 2) → run activation patching to verify causal information flow (Ex 3) → label SAE features by examining their top activating inputs (Ex 4).

### Exercise 1 (easy) — Linear probe from scratch

Implement a linear probe that decodes a binary concept from hidden states. Evaluate at multiple layers and report which layer best decodes the concept.

<details>
<summary>Hint</summary>

The training loop:
1. Initialize `w` (shape `(d,)`) and `b` (scalar) randomly.
2. For each iteration: compute logits = `hidden_states @ w + b`; apply sigmoid to get probs; compute cross-entropy loss; update via gradient descent.
3. The gradient of the cross-entropy loss is: `(probs - labels) @ hidden_states / N` for `w`, mean for `b`.

For multi-layer evaluation: train one probe per layer; report which layer achieved the highest test accuracy.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def train_linear_probe(hidden_states, labels, n_iterations=500, lr=0.01, seed=0):
    """
    Train a logistic regression probe.
    hidden_states: shape (N, d)
    labels: shape (N,) — binary 0/1
    Returns: (w, b) tuple where w has shape (d,)
    """
    N, d = hidden_states.shape
    np.random.seed(seed)
    # TODO:
    # 1. Initialize w (random small values) and b (0.0)
    # 2. For n_iterations:
    #    - Compute logits = hidden_states @ w + b
    #    - Compute probs = sigmoid(logits)
    #    - Compute gradient: dw = hidden_states.T @ (probs - labels) / N
    #                       db = mean(probs - labels)
    #    - Update: w -= lr * dw; b -= lr * db
    # 3. Return (w, b)
    pass


def probe_accuracy(hidden_states, labels, w, b):
    """Predict labels from hidden states and return accuracy."""
    preds = (hidden_states @ w + b > 0).astype(int)
    return (preds == labels).mean()


# Synthetic data: 12 layers, 200 examples
# At each layer, the concept is decodable to varying degrees
np.random.seed(42)
N = 200
n_layers = 12
d = 64

# Generate hidden states across layers
# The concept is most decodable at layer 5 (middle layers, like POS tagging)
hidden_per_layer = []
labels = np.array([1] * (N // 2) + [0] * (N // 2))
# Random concept direction
concept_dir = np.random.randn(d)
concept_dir /= np.linalg.norm(concept_dir)
# Per-layer signal strength (peaks at layer 5)
signal_strengths = [0.4, 0.7, 1.0, 1.3, 1.5, 1.7, 1.5, 1.3, 1.0, 0.7, 0.5, 0.3]

for layer_idx in range(n_layers):
    h = np.random.randn(N, d) * 0.5
    h[:N // 2] += concept_dir * signal_strengths[layer_idx]
    hidden_per_layer.append(h)

# Test: train probe at each layer; find best
# TODO: complete the loop below
# accuracies = []
# for layer_idx in range(n_layers):
#     w, b = train_linear_probe(hidden_per_layer[layer_idx], labels)
#     acc = probe_accuracy(hidden_per_layer[layer_idx], labels, w, b)
#     accuracies.append(acc)
# 
# best_layer = max(range(n_layers), key=lambda i: accuracies[i])
# print(f"Probe accuracy by layer:")
# for i, acc in enumerate(accuracies):
#     marker = '  *peak*' if i == best_layer else ''
#     print(f"  L{i:>2}:  {acc:.2%}{marker}")
# print(f"\\nPeak: layer {best_layer} (signal strength {signal_strengths[best_layer]})")
# 
# # Observations:
# # - Peak layer is wherever the signal is strongest
# # - Real probes show similar curves: concept emerges at a specific depth
# # - The shape of the curve (early/middle/late peak) hints at concept type
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — Toy sparse autoencoder

Train a sparse autoencoder on synthetic data with a known number of "true features." Report how many live features the trained SAE produces.

<details>
<summary>Hint</summary>

The SAE training loop:
1. Encoder: `f = ReLU(W_enc x + b_enc)`, shape `(N, D)` where `D > d`.
2. Decoder: `x_hat = W_dec f + b_dec`.
3. Loss = reconstruction (MSE) + sparsity (L1 penalty on `f`).
4. Gradients via chain rule (manual or with autograd).

A "live" feature is one that activates above a threshold on at least some input.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

np.random.seed(7)
d = 24        # input dim
D = 96        # SAE hidden dim (wider)
N = 400       # examples
n_true_features = 10

# Build true features and synthesize inputs as sparse combinations
true_features = np.random.randn(n_true_features, d)
true_features /= np.linalg.norm(true_features, axis=1, keepdims=True)

X = np.zeros((N, d))
for i in range(N):
    active = np.random.choice(n_true_features, size=2, replace=False)
    coeffs = np.random.rand(2)
    X[i] = coeffs[0] * true_features[active[0]] + coeffs[1] * true_features[active[1]]
X += np.random.randn(N, d) * 0.05


def train_sae(X, D, lr=0.02, sparsity_lambda=0.05, n_iterations=1500, seed=11):
    """
    Train a sparse autoencoder.
    X: shape (N, d)
    D: hidden dim (wider than d)
    Returns: (W_enc, b_enc, W_dec, b_dec)
    """
    N_, d = X.shape
    np.random.seed(seed)
    W_enc = np.random.randn(D, d) * 0.1
    b_enc = np.zeros(D)
    W_dec = np.random.randn(d, D) * 0.1
    b_dec = np.zeros(d)
    
    # TODO:
    # For n_iterations:
    #   1. Forward: pre = X @ W_enc.T + b_enc; f = ReLU(pre); x_hat = f @ W_dec.T + b_dec
    #   2. Loss = reconstruction (MSE) + sparsity (lambda * mean(L1 of f))
    #   3. Backward (manual): chain rule through the decoder, ReLU, encoder
    #   4. Update all four parameters
    
    return W_enc, b_enc, W_dec, b_dec


def count_live_features(X, W_enc, b_enc, threshold=0.01):
    """Count features that activate above threshold on at least one input."""
    f = np.maximum(0, X @ W_enc.T + b_enc)
    return (f > threshold).any(axis=0).sum()


# Test
# W_enc, b_enc, W_dec, b_dec = train_sae(X, D)
# n_live = count_live_features(X, W_enc, b_enc)
# print(f"True feature count: {n_true_features}")
# print(f"Live SAE features:  {n_live} (of {D} possible)")
# 
# # Compute final reconstruction error
# f = np.maximum(0, X @ W_enc.T + b_enc)
# x_hat = f @ W_dec.T + b_dec
# recon_err = np.mean(np.sum((X - x_hat) ** 2, axis=1))
# print(f"Reconstruction MSE: {recon_err:.4f}")
# 
# # Observations:
# # - The wider hidden layer gives room to un-pack the true features
# # - With proper sparsity, SAE recovers approximately n_true_features
# # - Live feature count is sensitive to sparsity_lambda — too high → too few features
# # - Real SAE training: same mechanics, much larger scale
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Activation patching across layers

Implement activation patching to identify which layer carries the relevant information for a behavioral difference between two prompts.

<details>
<summary>Hint</summary>

The patching loop:
1. Run two prompts: a "clean" one (correct answer) and a "corrupted" one (wrong answer).
2. For each layer L, replace layer L's output for the corrupted prompt with layer L's output from the clean prompt.
3. Measure how much the output flips toward the clean answer.
4. The layer with the biggest flip is where the information lives.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

# A mock 4-layer network: each layer transforms its input nonlinearly.
np.random.seed(0)

n_layers = 4
d = 8

# Random weights per layer
W = [np.random.randn(d, d) * 0.5 for _ in range(n_layers)]


def model_layers(x):
    """Run all layers; return list of intermediate activations + final output."""
    h = x
    activations = [h]
    for L in range(n_layers):
        h = np.tanh(h @ W[L])
        activations.append(h)
    # Final scalar output: dot with a fixed readout vector
    readout = np.array([0.5, -0.3, 0.4, -0.1, 0.2, 0.1, -0.2, 0.3])
    out = activations[-1] @ readout
    return activations, out


def patched_forward(clean_acts, corrupt_acts, patch_layer):
    """
    Re-run the network using corrupt_acts up to patch_layer, then clean_acts after.
    Returns the patched output.
    """
    # TODO:
    # 1. Start with corrupt_acts (these were the activations from the corrupted prompt)
    # 2. Replace the activation at patch_layer + 1 with clean_acts[patch_layer + 1]
    # 3. Re-run subsequent layers from there
    # 4. Compute and return the final output
    pass


# Two prompts: clean vs corrupted (differ only in input)
clean_input = np.array([1.0, 0.5, -0.5, 0.2, 0.1, -0.3, 0.4, 0.0])
corrupt_input = np.array([-1.0, 0.5, -0.5, 0.2, 0.1, -0.3, 0.4, 0.0])  # first dim flipped

clean_acts, out_clean = model_layers(clean_input)
corrupt_acts, out_corrupt = model_layers(corrupt_input)

print(f"Clean output:     {out_clean:.4f}")
print(f"Corrupted output: {out_corrupt:.4f}")
print(f"Gap to recover:   {out_clean - out_corrupt:.4f}\\n")

# Patch at each layer; report which layer transfers the most info
# TODO: complete the loop
# for layer_idx in range(n_layers):
#     patched = patched_forward(clean_acts, corrupt_acts, layer_idx)
#     recovery = (patched - out_corrupt) / (out_clean - out_corrupt)   # 0..1
#     print(f"Patch after layer {layer_idx}: output = {patched:.4f}  "
#           f"recovery = {recovery:.0%}")
# 
# # Observations:
# # - Recovery should approach 100% as we patch later layers
# # - The earliest layer where recovery is high tells you where the info lives
# # - In real activation patching: same logic, applied to specific heads or MLPs
# # - This is the foundation of mechanistic circuit discovery (Conmy 2023)
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — SAE feature labeling

Given an SAE feature represented by its top activating inputs, assign it a human-readable label. Evaluate label accuracy against a curated set of "ground truth" features.

<details>
<summary>Hint</summary>

The feature-labeling pipeline:
1. For each feature, look at its top-K activating inputs (text snippets).
2. Identify common patterns: shared topics, common keywords, semantic themes.
3. Generate a short label that captures the common concept.

For this exercise, mock the labeling step with a keyword-frequency heuristic. Real feature labeling uses an LLM to read the inputs and produce a description.

To evaluate: compare your labels to ground-truth labels for some features. Report accuracy as exact-match or label-similarity.

</details>

<RunnableCode
  client:visible
  defaultCode={`from collections import Counter
import re

# Sample SAE features: each has top activating inputs + a ground-truth label.
# In real labeling: an LLM reads the inputs and produces a description.
# This exercise uses a keyword-frequency heuristic instead.

FEATURES = [
    {
        'id': 'feat_001',
        'ground_truth_label': 'Python loops',
        'top_inputs': [
            'for i in range(10): print(i)',
            'for item in my_list: process(item)',
            'while True: data = fetch(); if not data: break',
            'for key in dictionary: print(key, dictionary[key])',
        ],
    },
    {
        'id': 'feat_002',
        'ground_truth_label': 'French language',
        'top_inputs': [
            'Bonjour, comment allez-vous aujourd\\'hui?',
            'Je voudrais commander un café, s\\'il vous plaît.',
            'La Tour Eiffel est un monument iconique.',
            'Nous partons en vacances en Provence.',
        ],
    },
    {
        'id': 'feat_003',
        'ground_truth_label': 'Refusal patterns',
        'top_inputs': [
            "I can't help with that request.",
            "I'm not able to provide that information.",
            "I won't be assisting with this.",
            "I have to decline — that would violate my guidelines.",
        ],
    },
    {
        'id': 'feat_004',
        'ground_truth_label': 'Sentiment positive',
        'top_inputs': [
            "I absolutely love this product, it's wonderful!",
            "Great work team, this is fantastic news!",
            "Amazing experience, would highly recommend!",
            "What a delightful surprise, truly excellent.",
        ],
    },
]


def extract_common_words(texts, top_n=3):
    """Find the most-common content words across a list of texts."""
    stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at',
                 'to', 'for', 'with', 'and', 'or', 'but', 'i', 'you', 'he', 'she',
                 'it', 'we', 'they', 'this', 'that', 'these', 'those', 'of', 'my',
                 'your', 'his', 'her', 'its', 'our', 'their', 'be', 'have', 'has'}
    words = []
    for text in texts:
        for word in re.findall(r"[a-zA-Z']+", text.lower()):
            if word not in stopwords and len(word) > 1:
                words.append(word)
    return [w for w, _ in Counter(words).most_common(top_n)]


def label_feature(feature):
    """
    Generate a short human-readable label for a feature.
    Heuristic: look for common keywords; map to known categories.
    """
    # TODO:
    # 1. Get common words from the top activating inputs
    # 2. Pattern-match against known categories:
    #    - if 'for' or 'while' or 'range' → "Python loops"
    #    - if accented characters or French-pattern words → "French language"
    #    - if "can't" or "won't" or "decline" or "won't" → "Refusal patterns"
    #    - if "love" or "great" or "amazing" or "excellent" → "Sentiment positive"
    # 3. Return the matched label, or "unknown" if no match
    pass


# Test
# correct = 0
# print(f"{'Feature':>10}  {'Ground truth':<25}  {'Generated':<25}  {'Match'}")
# print('-' * 80)
# for feat in FEATURES:
#     generated = label_feature(feat)
#     match = generated == feat['ground_truth_label']
#     correct += match
#     print(f"{feat['id']:>10}  {feat['ground_truth_label']:<25}  {generated:<25}  {'✓' if match else '✗'}")
# 
# print(f"\\nAccuracy: {correct}/{len(FEATURES)} = {correct / len(FEATURES):.0%}")
# 
# # Observations:
# # - Keyword-frequency heuristics catch obvious patterns
# # - Subtle features (abstract behaviors, multi-input concepts) need real LLMs to label
# # - This is one of interpretability's labor bottlenecks — labeling at scale is hard
# # - Production feature-labeling pipelines use frontier LLMs to read inputs and describe
`}
  packages={[]}
/>

````

### Part C — Flip Ch 25's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 25, slug: 'ch25-interpretability', title: 'Interpretability', partNum: 8, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 25 still render correctly (no changes to existing sections).
3. **Section 4's** `SAEFeatureExplorer` marquee widget still renders correctly.
4. **Section 2** now renders the working `LinearProbingVisualizer` widget.
5. **Default state**: concept 0 selected (Token identity); primary chart shows the curve declining from L0 to L11; peak marker at L0.
6. **Six concept buttons**: Token identity / Sentence boundaries / Part of speech / Named entities / Sentiment / Refusal patterns. Each has a left-border tint matching its category color.
7. **Category color coding**: surface (cyan), syntactic (amber), semantic (violet), task-specific (rose).
8. **Primary chart**: line + 12 dots; gridlines at 0.5, 0.75, 1.0; peak dot enlarged with cyan glow; peak label rendered.
9. **Overlay chart**: 6 lines in category colors; selected line is cyan + thick (3px); others are thinner (1.5px) and semi-transparent; endpoint labels visible.
10. **Note panel**: per-concept explanation of why the concept emerges at the peak layer.
11. **Summary table**: 6 rows × 4 columns (concept | category | peak layer | peak accuracy); active row highlighted; clicking any row selects that concept.
12. **All 6 concepts cycle correctly**: charts re-render with smooth transitions; peak position changes appropriately.
13. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
14. **Sidebar**: Ch 1-25 all active (published); Ch 26-30 still dimmed.
15. **Prev/next at bottom of Ch 25**: prev = Ch 24 (active); next = Ch 26 (disabled).
16. **TOC**: includes Exercises as h2 between section 7 and section 8.
17. **Mobile**: layout stacks; charts scale; summary table remains readable.
18. **`npm run typecheck`** passes.
19. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not call a real LLM or train a real probe.** Pre-computed accuracy data only.
- ❌ **Do not animate the lines** beyond the smooth state transitions on selection.
- ❌ **Do not flip any other chapter's status.** Only Ch 25 flips.
- ❌ **Do not modify Ch 1-24.** Sealed.
- ❌ **Do not modify Ch 25's marquee widget or prose sections 1-8.** Sealed. (Only insert the new Exercises section between sections 7 and 8.)

---

## Wire-up

```bash
git add src/components/widgets/ch25-interpretability/LinearProbingVisualizer.tsx src/components/widgets/ch25-interpretability/LinearProbingVisualizer.module.css src/components/widgets/ch25-interpretability/probing-data.ts src/components/widgets/index.ts src/pages/ch25-interpretability/index.mdx src/lib/chapters.ts
git commit -m "session 113: Ch 25 closeout — linear probing visualizer + exercises + status: published. Phase 14 has its second published chapter."
git push origin main
```

---

## Ch 25 closeout

Chapter 25 is now the twenty-fifth complete chapter on production. **Phase 14 has its second chapter on production** — the discipline arc is two-thirds of the way through.

Confirm before declaring Ch 25 done:

- ✅ BUILD_ORDER.md shows files 140-143 ✅
- ✅ File 144 marked ⏭️ (absorbed for 4-file cadence)
- ✅ Ch 25 status is `'published'`
- ✅ Both Ch 25 widgets work in production
- ✅ All 4 Ch 25 exercises render with their starter code

**Cadence check across 25 chapters:**

**4-file cadence** holds for **19 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, 19, 21, 22, 23, 24, **25**).
**5-file cadence** holds for **6 two-topic chapters** (Ch 1, 5, 8, 9, 14, 20).

**25-chapter pattern stable.**

**Phase 14 (Discipline) status:**
- ✅ Ch 24 (Safety)
- ✅ Ch 25 (Interpretability) — JUST COMPLETED
- ⬜ Ch 26 (Evaluation) — opens next; closes Phase 14

**What's next — Ch 26 (Evaluation).** If safety asks "what we want" and interpretability asks "what's actually computing," **evaluation asks "how do we measure both?"** Benchmarks, leaderboards, what they measure and what they miss; capability vs propensity vs safety evals; the design of new evaluations; the politics and economics of evaluation. **Closes Phase 14.** Then Phase 15 (Agents) closes the curriculum.

---

## Notes for the session author

**On the 6 concepts being chosen to span the layer-wise emergence spectrum:**
The 6 concepts deliberately cover the full layer range:

| Concept | Category | Peak |
|---------|----------|------|
| Token identity | surface | L0 (earliest) |
| Sentence boundaries | syntactic | L3 |
| Part of speech | syntactic | L4 |
| Named entities | semantic | L7-8 |
| Sentiment | semantic | L9 |
| Refusal patterns | task-specific | L11 (latest) |

Notes-for-author: "**This is the chapter's central empirical claim made visual.** Surface features at the bottom; task-specific features at the top; everything else fills in between. **The reader sees this without needing to read about it.**"

**On the multi-line overlay chart being the comparative payoff:**
The primary chart shows one concept's curve in detail. **The overlay chart shows all 6 concepts at once** — the eye picks up the layer-wise emergence pattern instantly. Notes-for-author: "**The overlay is where the chapter's central finding clicks.** Surface curves descend; syntactic curves peak early-middle; semantic curves peak middle-late; task-specific curves climb to the end. **Six curves, one pattern.**"

**On the category colors echoing chapter conventions:**
- **Cyan** (surface) — foundational/correct
- **Amber** (syntactic) — intermediate
- **Violet** (semantic) — sophisticated
- **Rose** (task-specific) — high-stakes / final decision

Notes-for-author: "**The chapter's color logic walks from low to high stakes.** Surface (cyan, neutral) → syntactic (amber, intermediate) → semantic (violet, complex) → task-specific (rose, decision-relevant)."

**On the refusal concept being the bridge from interp to safety:**
The refusal-patterns concept is included for a reason: it shows that **safety-relevant behaviors have specific layers and directions** that interpretability can localize. Notes-for-author: "**Refusal at L11 (peak) is the chapter's bridge back to Ch 24.** Reader sees that 'refusal' isn't a black-box property — it has a specific layer signature, which is what makes refusal-clamping (mentioned in Ch 24) possible."

**On the four exercises spanning the interpretability toolkit:**

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | Linear probe + multi-layer eval | 2 |
| 2 | medium | Toy SAE training | 4 |
| 3 | medium | Activation patching across layers | 6 |
| 4 | hard | **SAE feature labeling** | 7 (current state — labeling labor) |

Notes-for-author: "**The progression: probe → SAE → patch → label.** Each exercise targets a specific Ch 25 outcome. By the end, the reader has implemented the core operations of the interpretability stack."

**On Ex 4 (feature labeling) being the chapter's most honest exercise:**
Real SAE feature labeling is **labor-intensive**: a human (or strong LLM) reads many activating examples and writes a description. Ex 4 uses a keyword-frequency heuristic as a stand-in. **The lesson**: even with extracted features, *interpreting* them is non-trivial. Notes-for-author: "**Ex 4 reveals interpretability's labor bottleneck.** Reader sees that the field's progress is gated by how fast we can label features at scale. This previews Ch 26 — evaluation will face similar measurement challenges."

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. The interpretability question | (chapter prose) |
| 2. Linear probing | Ex 1 + section 2 widget |
| 3. Polysemanticity / superposition | (chapter prose) |
| 4. Sparse autoencoders | Ex 2 + section 4 widget |
| 5. Mechanistic interpretability / circuits | (chapter prose) |
| 6. Causal interventions | Ex 3 |
| 7. Current state of the field | Ex 4 |
| 8. Connecting interp to safety + eval | (chapter prose) |

Outcomes 2, 4, 6, 7 served by exercises directly. Outcomes 1, 3, 5, 8 served by chapter prose + section widgets.

**On Ch 25 being Phase 14's middle chapter:**
This file closes Ch 25. **Phase 14 now has two of three chapters complete.** Notes-for-author: "**The discipline arc is two-thirds through.** Ch 24 (Safety) and Ch 25 (Interpretability) are on production; Ch 26 (Evaluation) closes the phase. **The reader has now seen 'what we want' and 'what's actually there' — one more chapter measures both.**"

**Pedagogical claim of the chapter (revisited):**
"Interpretability is the discipline of reading what a trained LLM is doing internally. **Linear probes** decode concepts from hidden states with characteristic layer-wise emergence patterns (surface features peak early; task-specific features peak last). **Polysemanticity and superposition** explain why neuron-level inspection fails — features are directions, not units. **Sparse autoencoders** (Bricken 2023, Templeton 2024) extract monosemantic features at frontier scale. **Circuits** trace specific algorithms through specific weight subgraphs. **Causal interventions** (logit lens, activation patching, ROME) verify hypotheses. **The field is empirical and rapidly evolving**, not solved. **The deliverable is increasingly verification at the mechanistic level — the only known route to catch behavioral-training failures like sleeper agents (Ch 24).**"

**Phase 14 progress after this session**:
- ✅ Ch 24 Safety
- ✅ Ch 25 Interpretability
- ⬜ Ch 26 Evaluation (closes Phase 14)

**One chapter remains in Phase 14. Ch 26 opens next.**

Build with care. **This file closes Ch 25 — the second chapter of the discipline arc.**
