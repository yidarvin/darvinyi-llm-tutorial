# Session 116 — Benchmark heatmap marquee widget

> The marquee Chapter 26 widget. **A sortable benchmark heatmap.** Eight frontier models as rows × ten benchmarks as columns; each cell color-coded by score; benchmarks grouped by category (capability / safety / agentic); **saturation indicators** on columns where scores cluster above 90% (signaling "this benchmark stopped discriminating"). Reader sorts by any column to see how rankings shift between benchmarks — the **same set of models in a different order depending on what you measure**. **The widget that makes the chapter's central claim visceral**: *modern AI eval is a dashboard, not a number.* Scores are explicitly illustrative — mid-2024-to-2025 ballparks chosen for pedagogical clarity, not authoritative reproduction of any specific leaderboard.

---

## Read first (in this order)

1. **`research/ch26-evaluation/research.md`** — concepts 2 (capability), 3 (safety), 4 (agentic), and 6 (eval failure modes including saturation) are the source material
2. **`prompts/chapters/ch26-evaluation/session-115-page-structure.md`** — for the section-2 widget placeholder this session fills
3. **`prompts/chapters/ch25-interpretability/session-112-sae-feature-explorer-widget.md`** — for the Ch 25 widget conventions (curated data + 2D layout)
4. **`prompts/chapters/ch24-safety/session-108-jailbreak-taxonomy-widget.md`** — for the preset-driven Phase 14 widget pattern

---

## Goal

Replace the `<WidgetFrame title="Benchmark heatmap">` placeholder in section 2 with a working interactive widget that:

- Shows a **grid of 8 frontier models × 10 benchmarks** with color-coded score cells
- Groups benchmarks into **three categories with header bands**: capability (cyan), safety (rose), agentic (violet)
- Renders each cell with: numeric score (0-100%), background color on a red→yellow→green gradient
- Marks columns as **saturated** when most scores cluster above 90% — visible as a small "SAT" badge in the column header
- Supports **sort by any column or by category average** — clicking a column header sorts models by that benchmark
- Highlights the **active sort column** with a cyan top border
- Includes a **disclaimer panel** stating scores are illustrative ballparks, not authoritative reproductions
- Provides a **pedagogical caption** below explaining what the reader is seeing

**End state:** section 2 of Chapter 26 has a working marquee widget. After 60 seconds of interaction (sorting by 3-4 different columns), the reader should be able to articulate: (a) **different benchmarks rank models differently** — no single "best" model; (b) **saturation is visible at a glance** — whole columns crowded near 95% lose discriminative power; (c) **categories matter** — a model can be top-tier on capability and middle-tier on agentic, or vice versa; (d) **modern AI eval is a dashboard, not a number** — the chapter's central claim made visceral.

---

## Inputs

State of the repo after session 115:

- `src/pages/ch26-evaluation/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 2 and 5)
- `src/lib/chapters.ts` has Ch 26 as `'draft'`
- No `src/components/widgets/ch26-evaluation/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch26-evaluation/BenchmarkHeatmap.tsx` — the React widget
2. **Create** `src/components/widgets/ch26-evaluation/BenchmarkHeatmap.module.css` — scoped styles
3. **Create** `src/components/widgets/ch26-evaluation/benchmark-data.ts` — 8 models × 10 benchmarks with illustrative scores
4. **Update** `src/components/widgets/index.ts` — add `BenchmarkHeatmap` export
5. **Update** `src/pages/ch26-evaluation/index.mdx` — replace section-2's `<WidgetFrame>` interior with `<BenchmarkHeatmap client:visible />`

---

## Detailed spec

### 1. `benchmark-data.ts`

```ts
// src/components/widgets/ch26-evaluation/benchmark-data.ts

/**
 * Illustrative benchmark data for the heatmap widget.
 *
 * Scores are mid-2024-to-2025 ballparks chosen for pedagogical clarity.
 * They are NOT authoritative reproductions of any specific leaderboard.
 * The widget displays a disclaimer panel making this explicit.
 *
 * Categories:
 *  - capability: MMLU, HumanEval, HellaSwag, GPQA, MATH
 *  - safety:     TruthfulQA, HarmBench (safe-refusal rate)
 *  - agentic:    SWE-bench Verified, GAIA, OSWorld
 *
 * Higher is better for all 10 benchmarks (HarmBench is shown as % safely refused).
 */

export type BenchmarkCategory = 'capability' | 'safety' | 'agentic';

export interface Benchmark {
  id: string;
  label: string;
  shortLabel: string;
  category: BenchmarkCategory;
  description: string;
}

export const BENCHMARKS: Benchmark[] = [
  // CAPABILITY
  { id: 'mmlu',      label: 'MMLU',          shortLabel: 'MMLU',   category: 'capability',
    description: '57-subject multiple-choice (Hendrycks 2020). Largely saturated for frontier models.' },
  { id: 'humaneval', label: 'HumanEval',     shortLabel: 'HumEv',  category: 'capability',
    description: 'Python code generation (Chen 2021). Saturated for frontier models.' },
  { id: 'hellaswag', label: 'HellaSwag',     shortLabel: 'HSwag',  category: 'capability',
    description: 'Common-sense sentence completion (Zellers 2019). Saturated; legacy benchmark.' },
  { id: 'gpqa',      label: 'GPQA',          shortLabel: 'GPQA',   category: 'capability',
    description: 'Graduate-level science (Rein 2023). Modern active benchmark.' },
  { id: 'math',      label: 'MATH',          shortLabel: 'MATH',   category: 'capability',
    description: 'Competition math (Hendrycks 2021). Mostly saturated at frontier.' },

  // SAFETY
  { id: 'truthfulqa', label: 'TruthfulQA',   shortLabel: 'TruQA',  category: 'safety',
    description: 'Resistance to common falsehoods (Lin 2021). Higher = more truthful.' },
  { id: 'harmbench',  label: 'HarmBench',    shortLabel: 'HarmB',  category: 'safety',
    description: 'Safe-refusal rate on adversarial prompts (Mazeika 2024). Higher = safer.' },

  // AGENTIC
  { id: 'swebench',  label: 'SWE-bench Verified', shortLabel: 'SWE-V', category: 'agentic',
    description: 'Real GitHub issues; pass hidden tests (Jimenez 2023). Active.' },
  { id: 'gaia',      label: 'GAIA',          shortLabel: 'GAIA',   category: 'agentic',
    description: 'Multi-step real-world tasks (Mialon 2023). Humans ~92%.' },
  { id: 'osworld',   label: 'OSWorld',       shortLabel: 'OS',     category: 'agentic',
    description: 'Computer-use desktop tasks (Xie 2024). New frontier benchmark.' },
];

/** Category styling. */
export const CATEGORIES: Record<BenchmarkCategory, { label: string; color: string }> = {
  capability: { label: 'capability', color: 'var(--cyan-400)' },
  safety:     { label: 'safety',     color: 'var(--rose-400)' },
  agentic:    { label: 'agentic',    color: 'var(--violet-400)' },
};

export interface ModelRow {
  id: string;
  label: string;
  /** Score per benchmark id, 0-100. */
  scores: Record<string, number>;
}

/**
 * 8 frontier models with illustrative scores.
 * Numbers are pedagogical ballparks reflecting mid-2024 to 2025 reports;
 * they are not official measurements.
 */
export const MODELS: ModelRow[] = [
  {
    id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet',
    scores: { mmlu: 89, humaneval: 92, hellaswag: 96, gpqa: 59, math: 78,
              truthfulqa: 65, harmbench: 92,
              swebench: 49, gaia: 64, osworld: 39 },
  },
  {
    id: 'claude-3-opus', label: 'Claude 3 Opus',
    scores: { mmlu: 86, humaneval: 85, hellaswag: 95, gpqa: 50, math: 61,
              truthfulqa: 64, harmbench: 91,
              swebench: 23, gaia: 51, osworld: 24 },
  },
  {
    id: 'gpt-4o', label: 'GPT-4o',
    scores: { mmlu: 88, humaneval: 90, hellaswag: 95, gpqa: 53, math: 76,
              truthfulqa: 60, harmbench: 86,
              swebench: 33, gaia: 60, osworld: 32 },
  },
  {
    id: 'gpt-4-turbo', label: 'GPT-4 Turbo',
    scores: { mmlu: 86, humaneval: 87, hellaswag: 95, gpqa: 48, math: 73,
              truthfulqa: 59, harmbench: 84,
              swebench: 22, gaia: 50, osworld: 22 },
  },
  {
    id: 'gemini-1-5-pro', label: 'Gemini 1.5 Pro',
    scores: { mmlu: 85, humaneval: 84, hellaswag: 93, gpqa: 47, math: 67,
              truthfulqa: 58, harmbench: 81,
              swebench: 19, gaia: 47, osworld: 21 },
  },
  {
    id: 'llama-3-1-405b', label: 'Llama 3.1 405B',
    scores: { mmlu: 88, humaneval: 89, hellaswag: 94, gpqa: 51, math: 73,
              truthfulqa: 56, harmbench: 76,
              swebench: 17, gaia: 38, osworld: 14 },
  },
  {
    id: 'llama-3-1-70b', label: 'Llama 3.1 70B',
    scores: { mmlu: 83, humaneval: 80, hellaswag: 93, gpqa: 41, math: 68,
              truthfulqa: 53, harmbench: 73,
              swebench: 12, gaia: 30, osworld: 9 },
  },
  {
    id: 'gpt-3-5-turbo', label: 'GPT-3.5 Turbo',
    scores: { mmlu: 70, humaneval: 73, hellaswag: 85, gpqa: 28, math: 36,
              truthfulqa: 47, harmbench: 79,
              swebench: 1, gaia: 6, osworld: 3 },
  },
];

/** Compute mean score over a list of benchmark ids. */
export function meanScore(model: ModelRow, benchmarkIds: string[]): number {
  const vals = benchmarkIds.map(id => model.scores[id] ?? 0);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

/** Is a benchmark column "saturated"? Heuristic: most scores at 90%+. */
export function isSaturated(benchmarkId: string, models: ModelRow[]): boolean {
  const scores = models.map(m => m.scores[benchmarkId] ?? 0);
  const above90 = scores.filter(s => s >= 90).length;
  // Saturated if 6 of 8 models are >= 90 (i.e. only the legacy anchor + 1 below)
  return above90 >= 6;
}

/** Sort options: 'overall', 'capability', 'safety', 'agentic', or a benchmark id. */
export type SortKey = 'overall' | BenchmarkCategory | string;

export function sortModels(models: ModelRow[], sortKey: SortKey): ModelRow[] {
  const sorted = [...models];
  if (sortKey === 'overall') {
    sorted.sort((a, b) => meanScore(b, BENCHMARKS.map(b => b.id)) - meanScore(a, BENCHMARKS.map(b => b.id)));
  } else if (sortKey === 'capability' || sortKey === 'safety' || sortKey === 'agentic') {
    const bids = BENCHMARKS.filter(b => b.category === sortKey).map(b => b.id);
    sorted.sort((a, b) => meanScore(b, bids) - meanScore(a, bids));
  } else {
    // sort by single benchmark
    sorted.sort((a, b) => (b.scores[sortKey] ?? 0) - (a.scores[sortKey] ?? 0));
  }
  return sorted;
}

/** Map a score 0-100 to a color on a red→yellow→green gradient. */
export function scoreColor(score: number): string {
  // Use HSL: red (0°) → yellow (60°) → green (120°)
  const hue = Math.max(0, Math.min(120, (score - 20) * 1.5));  // <20% red, >100% green
  return `hsl(${hue}, 55%, 38%)`;
}

/** Text color for a score: light or dark depending on background brightness. */
export function scoreTextColor(score: number): string {
  return score < 40 ? '#ffffff' : '#0d0d0d';
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────────────┐
│ Benchmark heatmap                                                         │
│ 8 models × 10 benchmarks · sort by any column                             │
│                                                                            │
│ Disclaimer: scores are illustrative ballparks (2024-2025), not            │
│ authoritative reproductions of any specific leaderboard.                  │
│                                                                            │
│ Sort by:  [ Overall ] [ Capability ] [ Safety ] [ Agentic ]               │
│                                                                            │
│       │  CAPABILITY (5)              │ SAFETY (2)  │ AGENTIC (3)         │
│       │MMLU HumEv HSwag SAT GPQA MATH│TruQA HarmB  │SWE-V GAIA OS         │
│ ──────┼─────────────────────────────┼─────────────┼─────────────         │
│ Cl3.5S│ 89   92  96 SAT 59   78    │ 65   92      │ 49   64  39          │
│ Cl3Op │ 86   85  95 SAT 50   61    │ 64   91      │ 23   51  24          │
│ GPT4o │ 88   90  95 SAT 53   76    │ 60   86      │ 33   60  32          │
│ ...                                                                        │
│ GPT3.5│ 70   73  85     28   36    │ 47   79      │  1    6   3          │
│ ──────┴─────────────────────────────┴─────────────┴─────────────         │
│                                                                            │
│ Cell tooltip on hover: "Claude 3.5 Sonnet on GPQA: 59%                    │
│ (graduate-level science, active benchmark)"                                │
│                                                                            │
│ Pedagogical caption                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click a category sort button (Overall/Capability/Safety/Agentic) → reorder models by category average
- Click any benchmark column header → reorder models by that benchmark; highlight the column with a cyan top border
- Hover any cell → tooltip with model name, benchmark, score, and short benchmark description

**Visual encoding:**
- **Category bands** at the top of the table — colored backgrounds spanning each category's columns
- **Score cells** — background color on red→yellow→green gradient; text color light on dark cells, dark on light cells
- **SAT badge** in the column header for saturated benchmarks (cyan tag)
- **Active sort column** — 3px cyan top border on the column header
- **Sort buttons** — cyan when active
- **Model labels** — left-aligned, monospace

### 3. `BenchmarkHeatmap.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  BENCHMARKS, MODELS, CATEGORIES, sortModels, isSaturated, scoreColor, scoreTextColor,
  type SortKey,
} from './benchmark-data';
import styles from './BenchmarkHeatmap.module.css';

export default function BenchmarkHeatmap() {
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [hoveredCell, setHoveredCell] = useState<{ modelId: string; benchmarkId: string } | null>(null);

  const sortedModels = useMemo(() => sortModels(MODELS, sortKey), [sortKey]);

  // Group benchmarks by category for the header band
  const categoryGroups = useMemo(() => {
    const groups: Array<{ category: keyof typeof CATEGORIES; benchmarks: typeof BENCHMARKS }> = [];
    let currentGroup: typeof groups[number] | null = null;
    for (const b of BENCHMARKS) {
      if (!currentGroup || currentGroup.category !== b.category) {
        currentGroup = { category: b.category, benchmarks: [] };
        groups.push(currentGroup);
      }
      currentGroup.benchmarks.push(b);
    }
    return groups;
  }, []);

  const saturationMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const b of BENCHMARKS) {
      map[b.id] = isSaturated(b.id, MODELS);
    }
    return map;
  }, []);

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Benchmark heatmap</div>
        <div className={styles.titleSubLabel}>
          {MODELS.length} models · {BENCHMARKS.length} benchmarks · sort by any column
        </div>
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimerPanel}>
        <span className={styles.disclaimerLabel}>Note:</span>{' '}
        Scores are <strong>illustrative ballparks</strong> drawn from mid-2024 to 2025 reports.
        They're chosen for pedagogical clarity, not authoritative reproduction of any specific leaderboard.
        Real benchmark rankings shift with each model release.
      </div>

      {/* Sort controls */}
      <div className={styles.controlsPanel}>
        <span className={styles.controlsLabel}>Sort by:</span>
        <div className={styles.sortButtons}>
          {(['overall', 'capability', 'safety', 'agentic'] as const).map(key => (
            <button
              key={key}
              className={`${styles.sortButton} ${sortKey === key ? styles.sortButtonActive : ''}`}
              onClick={() => setSortKey(key)}
            >
              {key === 'overall' ? 'Overall' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap table */}
      <div className={styles.tableWrapper}>
        <table className={styles.heatmapTable}>
          <thead>
            {/* Category band */}
            <tr className={styles.categoryRow}>
              <th className={styles.cornerCell}></th>
              {categoryGroups.map(group => (
                <th
                  key={group.category}
                  colSpan={group.benchmarks.length}
                  className={styles.categoryHeader}
                  style={{
                    background: `color-mix(in srgb, ${CATEGORIES[group.category].color} 16%, transparent)`,
                    color: CATEGORIES[group.category].color,
                    borderColor: `color-mix(in srgb, ${CATEGORIES[group.category].color} 40%, transparent)`,
                  }}
                >
                  {CATEGORIES[group.category].label} ({group.benchmarks.length})
                </th>
              ))}
            </tr>
            {/* Benchmark headers */}
            <tr>
              <th className={styles.modelLabelHeader}>Model</th>
              {BENCHMARKS.map(b => {
                const isActive = sortKey === b.id;
                const saturated = saturationMap[b.id];
                return (
                  <th
                    key={b.id}
                    className={`${styles.benchmarkHeader} ${isActive ? styles.benchmarkHeaderActive : ''}`}
                    onClick={() => setSortKey(b.id)}
                    title={b.description}
                  >
                    <div className={styles.benchmarkLabelStack}>
                      <span className={styles.benchmarkLabel}>{b.shortLabel}</span>
                      {saturated && (
                        <span className={styles.saturationBadge}>SAT</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, mIdx) => (
              <tr key={model.id} className={mIdx === 0 ? styles.topRow : ''}>
                <th className={styles.modelLabel}>{model.label}</th>
                {BENCHMARKS.map(b => {
                  const score = model.scores[b.id] ?? 0;
                  const bg = scoreColor(score);
                  const fg = scoreTextColor(score);
                  const isHovered = hoveredCell?.modelId === model.id && hoveredCell?.benchmarkId === b.id;
                  return (
                    <td
                      key={b.id}
                      className={`${styles.scoreCell} ${isHovered ? styles.scoreCellHovered : ''}`}
                      style={{ background: bg, color: fg }}
                      onMouseEnter={() => setHoveredCell({ modelId: model.id, benchmarkId: b.id })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${model.label} on ${b.label}: ${score}%`}
                    >
                      {score}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover detail */}
      <div className={styles.hoverPanel}>
        {hoveredCell ? (() => {
          const m = MODELS.find(x => x.id === hoveredCell.modelId);
          const b = BENCHMARKS.find(x => x.id === hoveredCell.benchmarkId);
          if (!m || !b) return null;
          return (
            <>
              <div className={styles.hoverHeader}>
                <span className={styles.hoverModel}>{m.label}</span>
                <span className={styles.hoverArrow}>·</span>
                <span className={styles.hoverBenchmark}>{b.label}</span>
                <span className={styles.hoverScore}>{m.scores[b.id]}%</span>
              </div>
              <div className={styles.hoverDescription}>{b.description}</div>
            </>
          );
        })() : (
          <span className={styles.hoverPlaceholder}>
            Hover a cell for detail · click a column header to sort
          </span>
        )}
      </div>

      {/* Caption */}
      <div className={styles.caption}>
        Try sorting by different columns. <strong>The ranking changes substantially</strong> depending
        on what you measure. <strong>Saturated benchmarks</strong> (marked SAT) have whole rows clustered
        near the top — they no longer distinguish frontier models. <strong>Agentic benchmarks</strong>{' '}
        (SWE-bench, GAIA, OSWorld) show the most spread — they're where models still discriminate, and
        where Phase 15's coverage matters most. <strong>This is the chapter's central claim made visceral</strong>:
        modern AI eval is a dashboard, not a number.
      </div>
    </div>
  );
}
```

### 4. `BenchmarkHeatmap.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .disclaimerPanel, .controlsPanel, .tableWrapper, .hoverPanel, .caption {
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

/* Disclaimer */
.disclaimerPanel {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.55;
  background: color-mix(in srgb, var(--amber-400) 5%, var(--bg-elevated));
  border: 1px solid color-mix(in srgb, var(--amber-400) 30%, var(--border-default));
}
.disclaimerLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--amber-400);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.disclaimerPanel strong { color: var(--amber-400); font-weight: 500; }

/* Controls */
.controlsPanel {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}
.controlsLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
}
.sortButtons { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.sortButton {
  padding: 0.4rem 0.9rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.sortButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.sortButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Table */
.tableWrapper {
  padding: 0.7rem;
  overflow-x: auto;
}
.heatmapTable {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.categoryRow .categoryHeader,
.categoryRow .cornerCell {
  padding: 0.45rem 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
  border-bottom: 1px solid;
}
.cornerCell {
  background: transparent;
  border: none;
}
.modelLabelHeader {
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
.benchmarkHeader {
  padding: 0.5rem 0.35rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
  border-top: 3px solid transparent;
  transition: all 200ms;
  text-align: center;
}
.benchmarkHeader:hover {
  background: color-mix(in srgb, var(--cyan-500) 8%, var(--bg-primary));
}
.benchmarkHeaderActive {
  border-top-color: var(--cyan-400);
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  color: var(--cyan-300);
}
.benchmarkLabelStack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.18rem;
}
.benchmarkLabel { font-weight: 600; }
.saturationBadge {
  display: inline-block;
  font-size: 0.6rem;
  padding: 0.05rem 0.3rem;
  background: color-mix(in srgb, var(--cyan-400) 20%, transparent);
  color: var(--cyan-300);
  border: 1px solid color-mix(in srgb, var(--cyan-400) 45%, transparent);
  border-radius: 2px;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.modelLabel {
  text-align: left;
  padding: 0.4rem 0.6rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.78rem;
  border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.scoreCell {
  padding: 0.45rem 0.35rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  border-bottom: 1px solid color-mix(in srgb, var(--border-subtle) 30%, transparent);
  transition: filter 200ms;
}
.scoreCell:hover { filter: brightness(1.15); }
.scoreCellHovered {
  outline: 2px solid var(--cyan-300);
  outline-offset: -2px;
}
.topRow .scoreCell {
  /* No special treatment by default — top row earned its position */
}

/* Hover detail panel */
.hoverPanel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  min-height: 56px;
}
.hoverHeader {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.3rem;
}
.hoverModel {
  color: var(--text-primary);
  font-weight: 600;
}
.hoverArrow {
  color: var(--text-tertiary);
}
.hoverBenchmark {
  color: var(--text-secondary);
}
.hoverScore {
  margin-left: auto;
  color: var(--cyan-300);
  font-weight: 600;
  font-size: 1rem;
}
.hoverDescription {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-family: 'Inter', sans-serif;
  line-height: 1.5;
}
.hoverPlaceholder {
  color: var(--text-tertiary);
  font-style: italic;
}

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .heatmapTable { font-size: 0.7rem; }
  .scoreCell { padding: 0.35rem 0.2rem; font-size: 0.75rem; }
  .modelLabel { font-size: 0.7rem; padding: 0.3rem 0.4rem; }
  .benchmarkHeader { padding: 0.35rem 0.2rem; }
  .benchmarkLabel { font-size: 0.65rem; }
  .saturationBadge { font-size: 0.5rem; padding: 0 0.2rem; }
  .hoverPanel { font-size: 0.75rem; }
  .hoverScore { font-size: 0.88rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as BenchmarkHeatmap } from './ch26-evaluation/BenchmarkHeatmap';
// Session 148 will add:
// export { default as LLMJudgeBiasDemo } from './ch26-evaluation/LLMJudgeBiasDemo';
```

### 6. Update `src/pages/ch26-evaluation/index.mdx`

**Edit A: Add widget import:**

```mdx
import { BenchmarkHeatmap } from '@components/widgets';
```

**Edit B: Replace section-2's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Benchmark heatmap" caption="Eight frontier models × ten benchmarks (capability + safety + agentic) in a sortable color-coded grid. Click any column header to re-rank models by that benchmark. Saturated columns (SAT badge) cluster scores near the top — they no longer discriminate. Sorting by capability vs agentic gives very different rankings. Scores are illustrative 2024-2025 ballparks; the widget displays an explicit disclaimer. The chapter's central claim made visceral: modern AI eval is a dashboard, not a number.">
  <BenchmarkHeatmap client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 2 of Ch 26** renders with the working widget. Section 5's placeholder still stubbed.
3. **Default state**: sort by "Overall"; rankings reflect the per-model averages.
4. **Disclaimer panel** appears prominently above the controls; amber-tinted; explicitly states "illustrative ballparks."
5. **Four sort buttons**: Overall / Capability / Safety / Agentic. Active button cyan.
6. **Category band**: 3 colored bands above the columns — Capability (cyan), Safety (rose), Agentic (violet) — each spanning its columns and labeled.
7. **Score cells**: 8 × 10 = 80 cells; each colored on the red→yellow→green gradient by score; text light/dark based on cell brightness.
8. **Saturated columns**: HellaSwag, HumanEval should display the SAT badge (most scores ≥ 90).
9. **Sortable columns**: clicking any benchmark column header re-sorts models by that benchmark; active column shows cyan top border.
10. **Hover cells**: cell highlighted with cyan outline; hover detail panel below the table updates with model name, benchmark, score, description.
11. **Default hover panel**: when nothing hovered, shows placeholder "Hover a cell for detail..."
12. **Rankings shift on sort**: sorting by Capability vs Agentic vs single benchmarks gives noticeably different orderings.
13. **Mobile** (< 720px): table scrolls horizontally; cell text remains legible; controls wrap.
14. **`npm run typecheck`** passes.
15. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not use real benchmark scores or claim authority.** All scores are illustrative ballparks; the disclaimer must remain prominent.
- ❌ **Do not enumerate more models or benchmarks.** Eight × ten is the budget.
- ❌ **Do not implement filtering by category.** Sort by category buttons are enough.
- ❌ **Do not animate cells dramatically.** Subtle hover/sort transitions only.
- ❌ **Do not show a tooltip on the column header** — the hover panel below the table handles benchmark descriptions.
- ❌ **Do not flip Ch 26's status.** Session 148 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch26-evaluation/ src/components/widgets/index.ts src/pages/ch26-evaluation/index.mdx
git commit -m "session 116: benchmark heatmap marquee — 8 models × 10 benchmarks, sortable, saturation indicators"
git push origin main
```

---

## Notes for the session author

**On the illustrative-scores rule:**
The scores in `benchmark-data.ts` are **mid-2024-to-2025 ballparks**, chosen for pedagogical clarity. They are **not authoritative**. Real benchmark scores fluctuate with each model release, evaluation methodology updates, and contamination discoveries. **The disclaimer panel must remain prominent.**

Notes-for-author: "**This is a teaching tool, not a leaderboard.** The chapter's claim — *modern AI eval is a dashboard, not a number* — only needs realistic-feeling scores to land. Don't try to match any specific leaderboard exactly; that would imply authority the widget doesn't have."

**On the category color coding echoing earlier widgets:**
- **Cyan** (capability) — foundational, classic capability measurement
- **Rose** (safety) — adversarial/safety-critical (echoes Ch 24 jailbreak conventions)
- **Violet** (agentic) — sophisticated, new frontier (echoes Ch 25 mech-interp)

Notes-for-author: "**Colors are consistent across Phase 14 widgets.** Reader who has seen Ch 24's jailbreak rose and Ch 25's violet recognizes the meaning immediately."

**On saturation visibility being the chapter's key teaching:**
The SAT badge surfaces **automatically** — based on whether 6+ of 8 models score ≥ 90 on a column. **HellaSwag, HumanEval, and possibly HellaSwag get the badge.** Notes-for-author: "**Reader's eye catches the SAT badges instantly.** Whole columns of green-near-100% scores are visible as a band. **This is the saturation phenomenon made visible** without needing to read about it."

**On the sort-by-column being the interactive payoff:**
Clicking column headers re-ranks models. The **same 8 models** appear in **very different orders** depending on which benchmark sorts them. Notes-for-author: "**The sort is the chapter's central claim in interaction form.** Different benchmarks rank models differently. Sort by SWE-bench: Claude 3.5 Sonnet at the top; sort by MMLU: Claude 3.5 Sonnet, Llama 3.1 405B, GPT-4o all clustered. **No 'best' model.**"

**On the active-sort column getting a cyan top border:**
When sorting by a specific benchmark, that column's header gets a 3px cyan top border. **Visual anchor for "this is the column you sorted by."** Notes-for-author: "**The border is the visible feedback** that the click registered. Reader can see at a glance which column drives the current ranking."

**On agentic benchmarks showing the biggest spread:**
Agentic columns (SWE-bench, GAIA, OSWorld) have scores ranging from ~1% (GPT-3.5) to ~64% (Claude 3.5 on GAIA). **The biggest discrimination signal.** Notes-for-author: "**Reader sees that agentic benchmarks discriminate more than capability ones.** The capability columns are flatter (most frontier models 80-90); the agentic columns are more spread (3-64). **This is where models still differ — and where Phase 15 evaluation matters most.**"

**On GPT-3.5 Turbo as the legacy anchor:**
Including a much older model (GPT-3.5 Turbo) gives the heatmap a **calibration anchor**. Without it, all rows would be 80-95% on capability and the visual range would be muted. **GPT-3.5's 70/73/85% adds contrast and makes the gradient meaningful.**

Notes-for-author: "**GPT-3.5 is the legacy anchor.** Including it makes the color gradient meaningful (red → yellow → green spans actual score ranges) instead of all cells being green."

**On the hover panel being persistent rather than tooltips:**
A persistent hover-detail panel below the table is more accessible and stable than floating tooltips. Notes-for-author: "**The hover panel is always visible** — empty placeholder when nothing is hovered. **Reader can read benchmark descriptions without losing their place.**"

**Pedagogical claim this widget supports:**
"Modern AI evaluation is a multi-dimensional landscape — many models, many benchmarks, no single 'best.' Capability benchmarks measure knowledge and reasoning; safety benchmarks measure harm avoidance; agentic benchmarks measure end-to-end task completion. **Saturation** is visible at a glance: whole columns of scores clustered near 100% have lost their power to discriminate. **Ranking shifts** between sort columns reveal that the same models are top-tier on one axis and middle-tier on another. **The chapter's central claim made visceral**: modern AI eval is a dashboard, not a number."

After 60 seconds of interaction, the reader has internalized: (a) different benchmarks rank models differently; (b) saturation is visible as crowded high-score columns; (c) categories matter (capability ≠ safety ≠ agentic); (d) **no single number summarizes a model**.

**This is Ch 26's central visualization.** Build with care.
