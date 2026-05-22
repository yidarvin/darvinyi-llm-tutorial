# Session 12 — Embedding space marquee widget

> The marquee Chapter 2 widget: an interactive 2D scatter of ~50 word embeddings, color-coded by semantic category, with toggleable linear-analogy overlays. The reader sees that words cluster by meaning AND that analogy pairs (king→queen, man→woman, prince→princess) form approximately parallel arrows. Replaces the section-5 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch02-embeddings/research.md`** — for the geometric explanation of linear analogies (Derivation 3) and the relevant misconceptions (MC6, MC7)
2. **`prompts/chapters/ch02-embeddings/session-11-page-structure.md`** — for the section-5 widget placeholder this session fills
3. **`prompts/chapters/ch01-neural-net-primitives/session-08-backprop-visualizer.md`** and **`session-09-mlp-runnable.md`** — for the widget conventions; this session follows them
4. **`context/DESIGN_SYSTEM.md`** — for color palette and accessibility

---

## Goal

Replace the `<WidgetFrame title="Word2vec embedding space">` placeholder in section 5 with a working interactive widget that:

- Renders a 2D scatter plot of 51 pre-positioned words, color-coded by 8 semantic categories
- Supports toggling category visibility via clickable chips (legend doubles as filter)
- Supports toggling three linear-analogy overlay groups, each rendered as colored arrows: **gender pairs** (king/queen, man/woman, prince/princess, boy/girl), **country/capital** (France/Paris, Japan/Tokyo, USA/NYC, UK/London), **comparative adjectives** (big/bigger, small/smaller, happy/happier)
- On hover, highlights the word and shows a tooltip; on click, selects the word and dims everything else
- Has a reset button to return to the default view

**End state:** section 5 of Chapter 2 has a working marquee widget. The reader can see the king/queen/man/woman parallelogram visually, plus two more analogy axes; can filter to specific categories; can hover for word identification.

---

## Inputs

State of the repo after session 11:

- `src/pages/ch02-embeddings/index.mdx` exists with full prose; two `<WidgetFrame>` placeholders (sections 4 and 5)
- `src/lib/chapters.ts` has Ch 2 as `'draft'`
- `src/components/widgets/index.ts` exports `BackpropVisualizer`, `TrainingCurves`, `AutogradGraph` (Ch 1's widgets)
- No `src/components/widgets/ch02/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch02/EmbeddingSpace.tsx` — the React widget
2. **Create** `src/components/widgets/ch02/EmbeddingSpace.module.css` — scoped styles
3. **Create** `src/components/widgets/ch02/embedding-data.ts` — the 51 word points + analogy groups + category metadata
4. **Update** `src/components/widgets/index.ts` — add `EmbeddingSpace` export
5. **Update** `src/pages/ch02-embeddings/index.mdx` — replace section-5's `<WidgetFrame>` interior with `<EmbeddingSpace client:visible />`

**Do NOT modify:** Ch 1's widget files, any layout, styling, or scaffolding file. Do NOT modify Ch 2's section-4 widget placeholder (session 13 owns it).

---

## Detailed spec

### Architecture overview

```
src/components/widgets/
├── ch01/...                        (sealed)
└── ch02/
    ├── EmbeddingSpace.tsx          ← new
    ├── EmbeddingSpace.module.css   ← new
    └── embedding-data.ts           ← new
```

Pure data layer separated from view layer, same pattern as Ch 1's widgets.

### 1. `embedding-data.ts` — the data layer

51 word points with hand-tuned 2D coordinates. The coordinates are designed so that:
1. Same-category words cluster
2. Analogy pairs form **approximately parallel** arrows across all three analogy groups

These coordinates are not derived from real word2vec — they're pedagogically tuned to make the analogy geometry visually clean. The research file MC7 is the relevant honesty check: real word2vec embeddings have these properties less cleanly than this widget shows, and that's documented in the chapter's section 5 prose.

```ts
// src/components/widgets/ch02/embedding-data.ts

export type Category = 'animal' | 'color' | 'country' | 'capital' | 'food' | 'profession' | 'verb' | 'adjective' | 'person';

export interface WordPoint {
  word: string;
  category: Category;
  x: number;     // pre-projected 2D coordinate, domain [-10, 10]
  y: number;
}

export interface AnalogyGroup {
  id: string;
  label: string;
  description: string;
  // Each pair is (source word, target word). Arrow drawn from source → target.
  pairs: [string, string][];
}

export interface CategoryInfo {
  id: Category;
  label: string;
  color: string;     // CSS variable expression
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'animal',     label: 'animals',     color: 'var(--cyan-400)' },
  { id: 'color',      label: 'colors',      color: 'var(--amber-500)' },
  { id: 'country',    label: 'countries',   color: 'var(--rose-500)' },
  { id: 'capital',    label: 'capitals',    color: 'var(--rose-500)' },   // same family as country
  { id: 'food',       label: 'foods',       color: 'var(--emerald-500)' },
  { id: 'profession', label: 'professions', color: 'var(--cyan-300)' },
  { id: 'verb',       label: 'verbs',       color: 'var(--text-secondary)' },
  { id: 'adjective',  label: 'adjectives',  color: 'var(--amber-500)' },
  { id: 'person',     label: 'people',      color: 'var(--cyan-500)' },
];

export const WORDS: WordPoint[] = [
  // Animals — top-left cluster
  { word: 'cat',     category: 'animal',     x: -7.0, y:  5.0 },
  { word: 'dog',     category: 'animal',     x: -6.0, y:  4.5 },
  { word: 'horse',   category: 'animal',     x: -5.0, y:  6.0 },
  { word: 'bird',    category: 'animal',     x: -7.5, y:  7.0 },
  { word: 'fish',    category: 'animal',     x: -6.5, y:  5.5 },
  { word: 'mouse',   category: 'animal',     x: -8.0, y:  4.0 },
  { word: 'lion',    category: 'animal',     x: -4.5, y:  5.5 },
  { word: 'tiger',   category: 'animal',     x: -4.0, y:  6.0 },

  // Colors — top-right cluster
  { word: 'red',     category: 'color',      x:  5.0, y:  6.5 },
  { word: 'blue',    category: 'color',      x:  6.0, y:  7.0 },
  { word: 'green',   category: 'color',      x:  6.5, y:  6.0 },
  { word: 'yellow',  category: 'color',      x:  5.5, y:  7.5 },
  { word: 'black',   category: 'color',      x:  7.0, y:  6.5 },
  { word: 'white',   category: 'color',      x:  7.5, y:  7.0 },
  { word: 'purple',  category: 'color',      x:  6.0, y:  5.5 },

  // Countries — bottom-left cluster
  { word: 'France',  category: 'country',    x: -7.0, y: -5.0 },
  { word: 'Japan',   category: 'country',    x: -5.0, y: -6.0 },
  { word: 'USA',     category: 'country',    x: -8.0, y: -5.5 },
  { word: 'UK',      category: 'country',    x: -6.0, y: -7.0 },

  // Capitals — also bottom-left cluster, but offset by analogy direction (+0.5, +2)
  { word: 'Paris',   category: 'capital',    x: -6.5, y: -3.0 },
  { word: 'Tokyo',   category: 'capital',    x: -4.5, y: -4.0 },
  { word: 'NYC',     category: 'capital',    x: -7.5, y: -3.5 },
  { word: 'London',  category: 'capital',    x: -5.5, y: -5.0 },

  // People — gender-paired, bottom-right cluster, vertical gender axis (~ (0, -2))
  { word: 'king',     category: 'person',    x:  4.0, y: -2.0 },
  { word: 'queen',    category: 'person',    x:  4.0, y: -4.0 },
  { word: 'man',      category: 'person',    x:  5.0, y: -3.0 },
  { word: 'woman',    category: 'person',    x:  5.0, y: -5.0 },
  { word: 'boy',      category: 'person',    x:  6.0, y: -2.5 },
  { word: 'girl',     category: 'person',    x:  6.0, y: -4.5 },
  { word: 'prince',   category: 'person',    x:  3.0, y: -3.0 },
  { word: 'princess', category: 'person',    x:  3.0, y: -5.0 },

  // Foods — center
  { word: 'pizza',   category: 'food',       x:  1.0, y:  1.0 },
  { word: 'sushi',   category: 'food',       x:  2.0, y:  0.5 },
  { word: 'burger',  category: 'food',       x:  1.5, y:  1.5 },
  { word: 'salad',   category: 'food',       x:  0.0, y:  0.0 },
  { word: 'pasta',   category: 'food',       x:  1.0, y:  2.0 },

  // Professions — right-middle
  { word: 'doctor',    category: 'profession', x:  8.0, y:  2.0 },
  { word: 'lawyer',    category: 'profession', x:  8.5, y:  1.0 },
  { word: 'teacher',   category: 'profession', x:  7.5, y:  1.5 },
  { word: 'engineer',  category: 'profession', x:  8.0, y:  0.5 },
  { word: 'artist',    category: 'profession', x:  7.0, y:  2.5 },

  // Verbs — top-middle
  { word: 'run',     category: 'verb',       x:  0.0, y:  6.0 },
  { word: 'walk',    category: 'verb',       x: -0.5, y:  5.5 },
  { word: 'jump',    category: 'verb',       x:  0.5, y:  6.5 },
  { word: 'swim',    category: 'verb',       x: -1.0, y:  5.0 },
  { word: 'fly',     category: 'verb',       x:  1.0, y:  7.0 },

  // Adjectives — comparative pairs, far right; axis ~ (+0.5, -1)
  { word: 'big',      category: 'adjective', x:  9.0, y: -1.0 },
  { word: 'bigger',   category: 'adjective', x:  9.5, y: -2.0 },
  { word: 'small',    category: 'adjective', x:  8.5, y: -0.5 },
  { word: 'smaller',  category: 'adjective', x:  9.0, y: -1.5 },
  { word: 'happy',    category: 'adjective', x:  9.0, y:  4.0 },
  { word: 'happier',  category: 'adjective', x:  9.5, y:  3.0 },
];

export const ANALOGIES: AnalogyGroup[] = [
  {
    id: 'gender',
    label: 'Gender pairs',
    description: 'king → queen, man → woman, prince → princess, boy → girl (gender axis ≈ vertical down)',
    pairs: [
      ['king',   'queen'],
      ['man',    'woman'],
      ['prince', 'princess'],
      ['boy',    'girl'],
    ],
  },
  {
    id: 'capital',
    label: 'Country → capital',
    description: 'France → Paris, Japan → Tokyo, USA → NYC, UK → London (capital axis ≈ up + slightly right)',
    pairs: [
      ['France', 'Paris'],
      ['Japan',  'Tokyo'],
      ['USA',    'NYC'],
      ['UK',     'London'],
    ],
  },
  {
    id: 'comparative',
    label: 'Comparative form',
    description: 'big → bigger, small → smaller, happy → happier (comparative axis ≈ down + slightly right)',
    pairs: [
      ['big',   'bigger'],
      ['small', 'smaller'],
      ['happy', 'happier'],
    ],
  },
];

export const ANALOGY_COLORS: Record<string, string> = {
  gender:      'var(--cyan-400)',
  capital:     'var(--amber-400)',
  comparative: 'var(--rose-400)',
};

// Helper: lookup a word's coordinates
export function findWord(word: string): WordPoint | undefined {
  return WORDS.find(w => w.word === word);
}
```

**Notes on the data:**
- Coordinates are pedagogically tuned: each analogy group's arrows are *exactly* parallel (the gender direction is `(0, -2)` for every pair; capital direction is `(0.5, 2)`; comparative direction is `(0.5, -1)`). Real word2vec is messier; this is calibrated to make the structural point visually unambiguous.
- The `country` and `capital` categories share a color family (rose) because they're conceptually linked; the chapter prose can comment on this if relevant.
- 51 words across 9 categories. Adding more clutters the visualization; fewer makes the categories feel sparse.

### 2. Visual layout

ViewBox: `0 0 700 600` (slightly wider than tall, comfortable for a square scatter + label margins)

```
┌───────────────────────────────────────────────────────────────────┐
│ Categories: [animals✓] [colors✓] [countries✓] [capitals✓]        │
│             [foods✓] [professions✓] [verbs✓] [adjectives✓]       │
│             [people✓]                              [Reset filters] │
│                                                                   │
│       y ↑                                                         │
│         │                                                         │
│         │     • mouse                                             │
│         │  • cat        • run  • jump                            │
│         │     • dog                  • red                       │
│         │           • horse                • blue                 │
│         │ • bird                                                  │
│         │              • walk                                     │
│         │                                                         │
│  ───────┼──────────────────────────────────────────→ x           │
│         │                                                         │
│         │  • USA       • salad                                    │
│         │ • France       • pasta                  • doctor       │
│         │   ↑                                       • teacher    │
│         │ • Paris                                                  │
│         │                          • boy                          │
│         │                            ↓                            │
│         │                          • girl                         │
│         │                                                         │
│ Analogies: [Gender ✓] [Country→Capital  ] [Comparative  ]        │
└───────────────────────────────────────────────────────────────────┘

Tooltip on hover: word name in a small floating label
Selected state: clicked word grows + bold; others fade to low opacity
```

**Coordinate transform:** map data domain `[-10, 10] × [-10, 10]` to SVG domain `[60, 640] × [80, 540]` (leaves margins for axis arrows and labels).

```ts
function toSvgX(dataX: number): number { return 60 + (dataX + 10) * (640 - 60) / 20; }
function toSvgY(dataY: number): number { return 540 - (dataY + 10) * (540 - 80) / 20; }   // flip Y so positive is up
```

### 3. `EmbeddingSpace.tsx`

```tsx
import { useMemo, useRef, useState } from 'react';
import {
  WORDS, CATEGORIES, ANALOGIES, ANALOGY_COLORS,
  type Category, type WordPoint, type AnalogyGroup,
  findWord,
} from './embedding-data';
import styles from './EmbeddingSpace.module.css';

const VIEWBOX_W = 700;
const VIEWBOX_H = 600;
const PLOT_X_MIN = 60;
const PLOT_X_MAX = 640;
const PLOT_Y_MIN = 80;
const PLOT_Y_MAX = 540;

function toSvgX(dataX: number): number {
  return PLOT_X_MIN + (dataX + 10) * (PLOT_X_MAX - PLOT_X_MIN) / 20;
}
function toSvgY(dataY: number): number {
  return PLOT_Y_MAX - (dataY + 10) * (PLOT_Y_MAX - PLOT_Y_MIN) / 20;
}

export default function EmbeddingSpace() {
  const [enabledCategories, setEnabledCategories] = useState<Set<Category>>(
    new Set(CATEGORIES.map(c => c.id))
  );
  const [enabledAnalogies, setEnabledAnalogies] = useState<Set<string>>(new Set(['gender']));
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  function toggleCategory(c: Category) {
    setEnabledCategories(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  }

  function toggleAnalogy(id: string) {
    setEnabledAnalogies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function resetFilters() {
    setEnabledCategories(new Set(CATEGORIES.map(c => c.id)));
    setEnabledAnalogies(new Set(['gender']));
    setSelected(null);
    setHovered(null);
  }

  const visibleWords = useMemo(
    () => WORDS.filter(w => enabledCategories.has(w.category)),
    [enabledCategories]
  );

  const visibleArrows = useMemo(() => {
    const out: Array<{ from: WordPoint; to: WordPoint; color: string; groupId: string }> = [];
    for (const group of ANALOGIES) {
      if (!enabledAnalogies.has(group.id)) continue;
      const color = ANALOGY_COLORS[group.id]!;
      for (const [src, dst] of group.pairs) {
        const a = findWord(src), b = findWord(dst);
        if (!a || !b) continue;
        // Only draw if both words' categories are visible
        if (!enabledCategories.has(a.category) || !enabledCategories.has(b.category)) continue;
        out.push({ from: a, to: b, color, groupId: group.id });
      }
    }
    return out;
  }, [enabledAnalogies, enabledCategories]);

  return (
    <div className={styles.widget}>
      {/* Category chips */}
      <div className={styles.chipRow}>
        <span className={styles.chipLabel}>Categories:</span>
        {CATEGORIES.map(c => {
          const isOn = enabledCategories.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleCategory(c.id)}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={{ '--chip-color': c.color } as React.CSSProperties}
              aria-pressed={isOn}
            >
              <span className={styles.chipSwatch} />
              {c.label}
            </button>
          );
        })}
        <button onClick={resetFilters} className={styles.resetButton}>
          Reset
        </button>
      </div>

      {/* Scatter plot */}
      <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className={styles.svg} role="img" aria-label="2D scatter plot of word embeddings">
        {/* Axes */}
        <g className={styles.axes}>
          <line x1={PLOT_X_MIN} y1={(PLOT_Y_MIN + PLOT_Y_MAX) / 2} x2={PLOT_X_MAX} y2={(PLOT_Y_MIN + PLOT_Y_MAX) / 2} />
          <line x1={(PLOT_X_MIN + PLOT_X_MAX) / 2} y1={PLOT_Y_MIN} x2={(PLOT_X_MIN + PLOT_X_MAX) / 2} y2={PLOT_Y_MAX} />
          <text x={PLOT_X_MAX - 8} y={(PLOT_Y_MIN + PLOT_Y_MAX) / 2 - 6} className={styles.axisLabel}>x</text>
          <text x={(PLOT_X_MIN + PLOT_X_MAX) / 2 + 6} y={PLOT_Y_MIN + 14} className={styles.axisLabel}>y</text>
        </g>

        {/* Analogy arrows (drawn behind dots) */}
        {visibleArrows.map((a, i) => {
          const x1 = toSvgX(a.from.x), y1 = toSvgY(a.from.y);
          const x2 = toSvgX(a.to.x),   y2 = toSvgY(a.to.y);
          return (
            <g key={`arrow-${i}`}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                className={styles.arrow}
                style={{ stroke: a.color }}
                markerEnd={`url(#arrowhead-${a.groupId})`}
              />
            </g>
          );
        })}

        {/* Define arrowhead markers for each analogy color */}
        <defs>
          {ANALOGIES.map(g => (
            <marker
              key={`arrow-marker-${g.id}`}
              id={`arrowhead-${g.id}`}
              viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 Z" style={{ fill: ANALOGY_COLORS[g.id] }} />
            </marker>
          ))}
        </defs>

        {/* Word points */}
        {visibleWords.map(w => {
          const cx = toSvgX(w.x), cy = toSvgY(w.y);
          const isHovered = hovered === w.word;
          const isSelected = selected === w.word;
          const isDimmed = selected !== null && !isSelected;
          const category = CATEGORIES.find(c => c.id === w.category)!;
          return (
            <g
              key={w.word}
              className={`${styles.point} ${isDimmed ? styles.pointDimmed : ''}`}
              onMouseEnter={() => setHovered(w.word)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(prev => prev === w.word ? null : w.word)}
            >
              <circle
                cx={cx} cy={cy}
                r={isSelected || isHovered ? 7 : 5}
                className={styles.pointDot}
                style={{ fill: category.color }}
              />
              <text
                x={cx + 9} y={cy + 4}
                className={`${styles.pointLabel} ${isSelected ? styles.pointLabelSelected : ''}`}
              >
                {w.word}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Analogy toggles */}
      <div className={styles.chipRow}>
        <span className={styles.chipLabel}>Analogies:</span>
        {ANALOGIES.map(g => {
          const isOn = enabledAnalogies.has(g.id);
          return (
            <button
              key={g.id}
              onClick={() => toggleAnalogy(g.id)}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={{ '--chip-color': ANALOGY_COLORS[g.id] } as React.CSSProperties}
              aria-pressed={isOn}
              title={g.description}
            >
              <span className={styles.chipSwatch} />
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Info bar — describes the currently-active analogies */}
      <div className={styles.infoBar} aria-live="polite">
        {hovered ? (
          <>Hovered: <strong>{hovered}</strong> ({findWord(hovered)?.category})</>
        ) : selected ? (
          <>Selected: <strong>{selected}</strong> — click again or press Reset to deselect</>
        ) : enabledAnalogies.size > 0 ? (
          <>Showing {enabledAnalogies.size} analogy group{enabledAnalogies.size === 1 ? '' : 's'}. Notice how arrows within a group are approximately parallel.</>
        ) : (
          <>Toggle an analogy group below to see how vector differences encode relationships.</>
        )}
      </div>
    </div>
  );
}
```

### 4. `EmbeddingSpace.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.chipRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.chipLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 200ms, color 200ms, background 200ms;
}
.chip:hover { color: var(--text-primary); border-color: var(--border-strong); }
.chipOn {
  color: var(--text-primary);
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 10%, transparent);
}
.chipSwatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: var(--chip-color);
  border-radius: 50%;
  opacity: 0.5;
  transition: opacity 200ms;
}
.chipOn .chipSwatch { opacity: 1; }

.resetButton {
  margin-left: auto;
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.resetButton:hover { color: var(--cyan-300); border-color: var(--cyan-500); }

.svg {
  display: block;
  width: 100%;
  height: auto;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin: 0.5rem 0;
}

.axes {
  stroke: var(--border-default);
  stroke-width: 1;
}
.axisLabel {
  fill: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.arrow {
  stroke-width: 2;
  opacity: 0.85;
  pointer-events: none;
}

.point {
  cursor: pointer;
  transition: opacity 250ms;
}
.pointDimmed { opacity: 0.2; }

.pointDot {
  stroke: var(--bg-primary);
  stroke-width: 1.5;
  transition: r 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.pointLabel {
  fill: var(--text-secondary);
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  pointer-events: none;
  user-select: none;
}
.pointLabelSelected {
  fill: var(--cyan-300);
  font-weight: 500;
}

.point:hover .pointLabel {
  fill: var(--text-primary);
  font-weight: 500;
}

.infoBar {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  min-height: 2.5rem;
}
.infoBar strong { color: var(--cyan-300); font-weight: 500; }

@media (prefers-reduced-motion: reduce) {
  .point, .pointDot { transition: none; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
export { default as BackpropVisualizer } from './ch01/BackpropVisualizer';
export { default as TrainingCurves } from './ch01/TrainingCurves';
export { default as AutogradGraph } from './ch01/AutogradGraph';
export { default as EmbeddingSpace } from './ch02/EmbeddingSpace';
// Session 13 will add:
// export { default as Word2VecDynamics } from './ch02/Word2VecDynamics';
```

### 6. Update `src/pages/ch02-embeddings/index.mdx`

At the top of the file, where session 11 placed the widget imports (likely nothing yet for widgets — session 11's imports were for content components only). Add:

```mdx
import { EmbeddingSpace } from '@components/widgets';
```

Then find the section-5 `<WidgetFrame title="Word2vec embedding space">` placeholder and replace its `<div>` interior:

```mdx
<WidgetFrame title="Word2vec embedding space" caption="A 2D projection of pre-computed word2vec-like embeddings, colored by semantic category. Toggle the analogy overlays to see the approximate parallelism of vector pairs.">
  <EmbeddingSpace client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 5 of Ch 2** renders with the working widget. Section 4's widget placeholder is still stubbed.
3. **Initial state:** all 9 categories enabled; "Gender pairs" analogy enabled; "Country→Capital" and "Comparative" disabled. The widget shows 51 dots distributed in their respective regions, with 4 gender-arrow overlays.
4. **Category cluster verification:** zoom into the top-left visually — animals cluster. Top-right — colors. Bottom-left — countries with capitals offset upward. Bottom-right — gender pairs. Adjectives at far right.
5. **Toggling categories:** click "animals" chip — the 8 animal dots disappear; chip border fades. Click again — they return.
6. **Toggling analogies:**
   - Enable "Country→Capital" — 4 amber arrows appear from each country to its capital. Verify they're approximately parallel.
   - Enable "Comparative" — 3 rose arrows appear (big→bigger, small→smaller, happy→happier).
7. **Disabling a category hides its analogy arrows:** disable "people" — gender arrows disappear (since both endpoints are people). Re-enable people — arrows return.
8. **Hover a dot:** dot grows; tooltip in info bar shows "Hovered: <word> (<category>)".
9. **Click a dot:** dot becomes selected (label cyan, slightly larger); all other dots dim to 20% opacity; info bar shows "Selected: <word>".
10. **Click selected dot again or click Reset:** returns to default view.
11. **Mobile (< 640px):** SVG scales via viewBox; chips wrap; info bar remains readable. Tap-to-select works.
12. **`prefers-reduced-motion: reduce`:** point size transitions disabled.
13. **`npm run typecheck`** passes.
14. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not compute embeddings at runtime.** The 51 coordinates are static; the widget illustrates rather than computes.
- ❌ **Do not implement nearest-neighbor search.** Adds complexity; not needed for the marquee claim.
- ❌ **Do not add a "search for a word" input.** With 51 words and visible labels, search is unnecessary.
- ❌ **Do not let the user add new words to the visualization.** That would require a real word2vec model in the browser (Pyodide + gensim = heavy).
- ❌ **Do not use 3D projection or t-SNE in the widget.** 2D is enough; t-SNE would be non-deterministic and slow.
- ❌ **Do not modify session 04's section-4 widget placeholder.** Session 13 owns it.
- ❌ **Do not modify Ch 2's prose.** Only swap the section-5 `<WidgetFrame>` interior.
- ❌ **Do not change Ch 2's status.** Stays `'draft'` until session 13.

---

## Wire-up

```bash
git add src/components/widgets/ch02/ src/components/widgets/index.ts src/pages/ch02-embeddings/index.mdx
git commit -m "session 12: embedding space marquee widget — 51 words, 3 analogy overlays"
git push origin main
```

Visit production. Verify on desktop and mobile:
- Desktop: all 51 words readable, all 4 gender arrows parallel, toggle interactions feel responsive
- Mobile (375px): labels may overlap slightly; that's acceptable since hover still works

---

## Notes for the session author

**On the data being "fake":** the coordinates are hand-tuned, not derived from real word2vec. The chapter prose (section 5) already acknowledges this — MC7 in the research file is explicit that "linear analogies are oversold." The widget makes the *idealized* claim visible; the prose tells the reader real embeddings are messier. Both are honest; together they teach the structure without overselling it.

**On color reuse:** `country` and `capital` use the same rose color family because the geometric relationship between them IS the analogy. Visually, this makes the country/capital arrows look like they're connecting "members of the same color group" — reinforcing the relationship. The chips for these two categories share their swatch color too; users can distinguish them by the chip label.

**On the absence of zoom/pan:** with only 51 points in a [-10, 10]² window, the entire visualization fits comfortably in the SVG. Zoom/pan would add UX complexity for negligible benefit. If a future session wants to scale this up to 500+ words, zoom/pan becomes necessary; this version doesn't.

**On label collisions:** with 51 words, some labels may visually overlap (especially in clusters). Acceptable for v1 — hovering the dot still surfaces the word in the info bar. If readers complain in feedback, a polish session can add label-collision avoidance (e.g., d3-force layout).

**On the info bar's tone:** it's prose-style, not console-style. Says "Hovered: cat (animal)" not just "cat / animal." Small touch — keeps the widget feeling like part of a chapter, not like a JSON debugger.

**On the analogy arrow style:** thin (stroke 2px), with arrowheads. The arrowheads use SVG `<marker>` elements, one per analogy color. The order of `<defs>` and `<g>` matters: `<defs>` declares markers; the lines reference them via `markerEnd`. Don't reorder.

**On color-mix() browser support:** the chip "on" background uses `color-mix(in srgb, var(--chip-color) 10%, transparent)`. This is supported in Chrome 111+ / Safari 16.2+ / Firefox 113+ — basically all modern browsers. If you need to support older browsers, fall back to manual rgba (e.g., `rgba(6, 182, 212, 0.1)` for cyan); but the rest of the project requires modern browsers anyway.

**On accessibility:** the `aria-pressed` on chip buttons announces toggle state. The `aria-live="polite"` on the info bar announces hover/select changes without being aggressive. Each dot is keyboard-navigable via Tab? — NOT in this implementation. Adding keyboard nav to 51 dots is unwieldy. If a screen-reader user needs this content, the prose adequately describes the patterns shown.

**On the pedagogical claim this widget supports:** "Words cluster by meaning; analogous pairs form approximately parallel arrows; this geometric structure is the essence of why word2vec became famous." If after building it, the reader can see those three things in 30 seconds of interaction, the widget has succeeded. If they have to study it carefully to extract the patterns, simplify.

This is Chapter 2's marquee. It will be the most-quoted visual from the chapter in social-media shares, blog references, and similar. Make it look right.
