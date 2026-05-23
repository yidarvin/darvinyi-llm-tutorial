# Session 129 — Agent benchmark explorer marquee widget

> The first marquee Chapter 30 widget. **Five 2025 agent benchmarks visualized side-by-side**: SWE-bench Verified (coding agents), GAIA (general assistants), OSWorld (computer-use agents), τ-bench (tool-use reliability), BrowseComp (web research). Reader picks any benchmark to see full detail: a small **bar chart visualizing the frontier-vs-human gap**, task count and structure, an example task (paraphrased; never verbatim from the source), notable characteristics, and a maturity badge. **The 2025 agent evaluation landscape made visible** — Phase 14's Ch 26 (Benchmark Heatmap) at the LLM level, extended one layer up to agents. **The widget that makes the agent eval landscape concrete in 60 seconds of interaction.**

---

## Read first (in this order)

1. **`research/ch30-agent-eval-and-frameworks/research.md`** — concept 2 (agent benchmarks) is the source material; the SOTA numbers and characteristics come from here
2. **`prompts/chapters/ch30-agent-eval-and-frameworks/session-128-page-structure.md`** — for the section-2 widget placeholder this session fills
3. **`prompts/chapters/ch26-evaluation/`** — for Ch 26's Benchmark Heatmap widget, the LLM-level analog this widget extends
4. **`prompts/chapters/ch29-multi-agent/session-125-multi-agent-topology-explorer-widget.md`** — for the Phase 15 widget conventions (picker + detail + comparison table)

---

## Goal

Replace the `<WidgetFrame title="Agent benchmark explorer">` placeholder in section 2 with a working interactive widget that:

- Shows a **picker over 5 curated benchmarks**: SWE-bench Verified, GAIA, OSWorld, τ-bench, BrowseComp
- For the active benchmark, shows:
  - The **benchmark label** with a maturity badge
  - A **description** in plain prose
  - A **score bar chart** visualizing frontier agent score, human baseline, and the gap between them
  - **Task structure**: count, difficulty levels (if applicable), key characteristics
  - An **example task** (paraphrased; never verbatim from the original)
  - **Notable characteristics** as bullets
  - A **maturity badge** indicating production readiness
- Provides a **quick comparison row** showing all 5 benchmarks
- A **pedagogical caption** below

**End state:** section 2 of Chapter 30 has a working marquee widget. After 60 seconds of interaction (cycling through 3-4 benchmarks), the reader should be able to: (a) **name 5 production-grade agent benchmarks** with their domains; (b) **state the frontier-vs-human gap** for each; (c) **articulate what each benchmark measures** that the others don't; (d) **recognize that agent capability is still developing** (OSWorld at ~12% shows there's a long way to go).

---

## Inputs

State of the repo after session 128:

- `src/pages/ch30-agent-eval-and-frameworks/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 2 and 5)
- `src/lib/chapters.ts` has Ch 30 as `'draft'`
- No `src/components/widgets/ch30-agent-eval-and-frameworks/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch30-agent-eval-and-frameworks/AgentBenchmarkExplorer.tsx` — the React widget
2. **Create** `src/components/widgets/ch30-agent-eval-and-frameworks/AgentBenchmarkExplorer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch30-agent-eval-and-frameworks/benchmark-data.ts` — 5 curated benchmarks with scores, characteristics, example tasks
4. **Update** `src/components/widgets/index.ts` — add `AgentBenchmarkExplorer` export
5. **Update** `src/pages/ch30-agent-eval-and-frameworks/index.mdx` — replace section-2's `<WidgetFrame>` interior with `<AgentBenchmarkExplorer client:visible />`

---

## Detailed spec

### 1. `benchmark-data.ts`

```ts
// src/components/widgets/ch30-agent-eval-and-frameworks/benchmark-data.ts

/**
 * Five 2025 agent benchmarks with state-of-the-art scores, characteristics,
 * and paraphrased example tasks.
 *
 * IMPORTANT: Example tasks are PARAPHRASED — never verbatim from the original
 * benchmark. This avoids reproduction concerns and reinforces that the widget
 * is teaching about the benchmark, not the benchmark itself.
 *
 * SOTA numbers reflect approximate frontier-agent performance as of early 2025;
 * the field moves fast and these will date. The widget's value is in showing
 * the comparative shape (where each benchmark sits in the landscape), not in
 * being a live leaderboard.
 */

export type BenchmarkCategory = 'coding' | 'general-assistant' | 'computer-use' | 'tool-use' | 'web-research';
export type BenchmarkMaturity = 'standard' | 'established' | 'emerging';

export interface DifficultyLevel {
  label: string;
  frontierScore: number;
  humanScore: number;
}

export interface AgentBenchmark {
  id: string;
  label: string;
  shortLabel: string;
  category: BenchmarkCategory;
  description: string;
  taskCount: number;
  /** SOTA numbers — frontier-agent score and human baseline, as decimals 0..1. */
  frontierScore: number;
  humanScore: number;
  /** Optional difficulty-level breakdown. */
  levels?: DifficultyLevel[];
  /** Paraphrased example task — NEVER verbatim from source. */
  exampleTask: string;
  /** Notable characteristics. */
  characteristics: string[];
  /** What makes the benchmark useful / distinct. */
  whatItMeasures: string;
  /** Year released. */
  year: number;
  maturity: BenchmarkMaturity;
}

export const BENCHMARKS: AgentBenchmark[] = [
  {
    id: 'swe-bench-verified',
    label: 'SWE-bench Verified',
    shortLabel: 'SWE-bench',
    category: 'coding',
    description:
      "Real GitHub issues from popular Python repositories. The agent must produce a code change (a PR) that resolves the issue and passes the original project's tests. The 'Verified' subset is a curated 500-problem version with manually-vetted issues and tests. The de facto coding-agent benchmark.",
    taskCount: 500,
    frontierScore: 0.50,
    humanScore: 0.85,
    exampleTask:
      "A Python data-validation library has an issue: schema validation incorrectly accepts negative numbers when a 'positive: true' constraint is specified. The agent must navigate the codebase, locate the validation logic, write a fix, and produce a PR that passes the project's existing test suite plus the issue's reproducer.",
    characteristics: [
      'Real GitHub issues — not synthetic',
      'Multi-file context; agent must navigate codebase',
      'Success = PR passes the original tests',
      'Verified subset reduces ambiguity in original SWE-bench',
      'Used by every major coding-agent vendor',
    ],
    whatItMeasures:
      "Real-world coding-agent capability under conditions close to professional software-engineering work. **Frontier scores rose from ~5% (2023) to ~50% (early 2025)** — the most rapidly improving agent metric.",
    year: 2023,
    maturity: 'standard',
  },
  {
    id: 'gaia',
    label: 'GAIA',
    shortLabel: 'GAIA',
    category: 'general-assistant',
    description:
      "General AI assistant benchmark with 466 real-world tasks requiring tool use, web browsing, file reading, and reasoning across multiple steps. Three difficulty levels (Level 1: easy; Level 2: moderate; Level 3: hard). Tests the full agent stack: planning, tool use, retrieval, synthesis.",
    taskCount: 466,
    frontierScore: 0.65,  // Level 1 average
    humanScore: 0.92,
    levels: [
      { label: 'Level 1', frontierScore: 0.70, humanScore: 0.92 },
      { label: 'Level 2', frontierScore: 0.50, humanScore: 0.90 },
      { label: 'Level 3', frontierScore: 0.30, humanScore: 0.88 },
    ],
    exampleTask:
      "Given a published research paper, find the country of the author's affiliation; look up that country's population in 2020 from a public statistical source; compute the country's population density given its area (also looked up); report the result rounded to the nearest integer.",
    characteristics: [
      'Multi-step tasks requiring tool composition',
      'Three difficulty levels with widening human-vs-agent gap',
      'Exact-match scoring on final answer',
      'Designed to be unambiguous; reasoning trace not evaluated',
      'Sponsored by Meta + Hugging Face',
    ],
    whatItMeasures:
      "End-to-end agent capability: planning, tool use, browsing, retrieval, synthesis. **The gap widens with difficulty** — frontier agents score 70% on Level 1, 30% on Level 3. Humans stay near 90% across all levels.",
    year: 2023,
    maturity: 'standard',
  },
  {
    id: 'osworld',
    label: 'OSWorld',
    shortLabel: 'OSWorld',
    category: 'computer-use',
    description:
      "Real computer tasks executed in Ubuntu and Windows virtual machines. The agent controls a desktop with mouse, keyboard, and screenshot observations. Tasks span common productivity software (browsers, spreadsheets, file managers, system settings). **The hardest current agent benchmark by a wide margin.**",
    taskCount: 369,
    frontierScore: 0.14,
    humanScore: 0.72,
    exampleTask:
      "Open a spreadsheet application; load a CSV file from the Downloads folder; sort the data by the 'revenue' column descending; save the sorted file as 'sorted-revenue.xlsx' in the Documents folder. Success is verified by checking the actual file system after the agent finishes.",
    characteristics: [
      'Real desktop OS execution in sandboxed VMs',
      'Mouse + keyboard + screenshot interface',
      'State-based verification (file system, application state)',
      'Multimodal — vision required for most tasks',
      'Closest to general-purpose computer use',
    ],
    whatItMeasures:
      "Embodied agent capability — driving real computers, not text APIs. **Frontier agents score ~14%; humans ~72%**, the widest gap in current benchmarks. The 6× gap shows agent capability has substantial headroom in the computer-use regime.",
    year: 2024,
    maturity: 'established',
  },
  {
    id: 'tau-bench',
    label: 'τ-bench (TauBench)',
    shortLabel: 'τ-bench',
    category: 'tool-use',
    description:
      "Customer-service scenarios with structured tool use (retail, airline domains). The agent's customer-facing conversational interface must call tools (look up orders, check policies, perform actions) while satisfying policy constraints. **Distinguished by its pass^k metric: the agent must succeed across all k independent attempts of the same task.**",
    taskCount: 165,
    frontierScore: 0.51,
    humanScore: 0.85,
    levels: [
      { label: 'pass^1', frontierScore: 0.65, humanScore: 0.90 },
      { label: 'pass^4', frontierScore: 0.51, humanScore: 0.85 },
      { label: 'pass^8', frontierScore: 0.42, humanScore: 0.82 },
    ],
    exampleTask:
      "A customer asks to return a recently-delivered item from their order history. The agent must (1) authenticate the customer via the look-up-account tool, (2) verify the order falls within the return window per policy, (3) initiate the return via the create-return tool, and (4) communicate the refund timeline. All across multiple consecutive sessions — pass^k requires consistency.",
    characteristics: [
      'Conversational interface with structured tool use',
      'Policy constraints (returns within X days, etc.)',
      'pass^k metric — must succeed every time across k attempts',
      'Single-domain depth (retail or airline)',
      'Surfaces reliability gaps single-trial benchmarks miss',
    ],
    whatItMeasures:
      "Tool-use reliability under realistic constraints. **The gap between pass^1 (~65%) and pass^4 (~51%) and pass^8 (~42%) is the key signal** — agents that work 65% of the time still fail half of multi-attempt sessions. Production agents need pass^k ≥ ~80% for many deployments.",
    year: 2024,
    maturity: 'established',
  },
  {
    id: 'browsecomp',
    label: 'BrowseComp',
    shortLabel: 'BrowseComp',
    category: 'web-research',
    description:
      "Complex web-research benchmark designed to be hard for both humans and agents. The agent must browse multiple websites, synthesize information from disparate sources, and produce a precise answer. **Questions are deliberately hard to answer via direct lookup**; multi-step reasoning across sources is required.",
    taskCount: 1266,
    frontierScore: 0.42,
    humanScore: 0.30,
    exampleTask:
      "Identify the title and director of a film that meets all the following criteria: released between 2010 and 2015; based on a novel published in the 1970s; the director's previous feature won a major award; the film's lead actor's prior collaboration with this director was a TV series. Multiple sources must be consulted and cross-referenced.",
    characteristics: [
      'Designed to be hard for humans too (~30%)',
      'Multi-source synthesis required',
      'No single lookup suffices',
      'Frontier agents actually exceed human baseline',
      'OpenAI 2024; recent benchmark with growing adoption',
    ],
    whatItMeasures:
      "Complex web-research capability — the rare benchmark where **frontier agents (~42%) actually exceed human performance (~30%)** on the average task. Reflects that agents have tireless browsing capacity humans lack, even when their reasoning is weaker per-step.",
    year: 2024,
    maturity: 'emerging',
  },
];


/** Category color mapping. */
export const CATEGORY_COLORS: Record<BenchmarkCategory, string> = {
  'coding':            'var(--cyan-400)',
  'general-assistant': 'var(--violet-400)',
  'computer-use':      'var(--rose-400)',
  'tool-use':          'var(--amber-400)',
  'web-research':      'var(--emerald-400)',
};


/** Maturity badge metadata. */
export const MATURITY: Record<BenchmarkMaturity, { label: string; color: string }> = {
  'standard':    { label: 'de facto standard', color: 'var(--emerald-400)' },
  'established': { label: 'established',       color: 'var(--cyan-400)' },
  'emerging':    { label: 'emerging',          color: 'var(--violet-400)' },
};
```

### 2. Visual layout

```
ViewBox: 0 0 800 940

┌────────────────────────────────────────────────────────────────┐
│ Agent benchmark explorer                                         │
│ 5 2025 agent benchmarks · pick one for detail                    │
│                                                                  │
│ Pick a benchmark:                                                │
│  [ SWE-bench ] [ GAIA ] [ OSWorld ] [ τ-bench ] [ BrowseComp ]   │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ SWE-BENCH VERIFIED                       de facto standard   │ │
│ │                                                                │ │
│ │ Category: coding                                              │ │
│ │ Released: 2023 · Tasks: 500                                   │ │
│ │                                                                │ │
│ │ Description:                                                  │ │
│ │ Real GitHub issues from popular Python repositories...        │ │
│ │                                                                │ │
│ │ Score (early 2025):                                           │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │  Frontier agent  ████████████████████████░░░░░  50%      │ │ │
│ │ │                                                            │ │ │
│ │ │  Human baseline  ███████████████████████████████  85%     │ │ │
│ │ │                                                            │ │ │
│ │ │                                          gap: 35 pp        │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ What it measures:                                             │ │
│ │ Real-world coding-agent capability...                         │ │
│ │                                                                │ │
│ │ Example task (paraphrased):                                   │ │
│ │ A Python data-validation library has an issue: schema...     │ │
│ │                                                                │ │
│ │ Characteristics:                                              │ │
│ │  • Real GitHub issues — not synthetic                        │ │
│ │  • Multi-file context; agent must navigate codebase          │ │
│ │  • Success = PR passes the original tests                    │ │
│ │  • Verified subset reduces ambiguity                         │ │
│ │  • Used by every major coding-agent vendor                   │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Quick comparison:                                                │
│ ┌──────────┬─────────┬──────────┬─────────┬─────────────────┐ │
│ │ Benchmark│ Category│ Tasks    │ Frontier│ Gap to human    │ │
│ │ SWE-b    │ coding  │ 500      │ 50%     │ -35 pp          │ │
│ │ GAIA     │ general │ 466      │ 65%(L1) │ -27 pp          │ │
│ │ OSWorld  │ comp    │ 369      │ 14%     │ -58 pp          │ │
│ │ τ-bench  │ tool    │ 165      │ 51%(p4) │ -34 pp          │ │
│ │ BrowseC  │ web res │ 1266     │ 42%     │ +12 pp ↑        │ │
│ └──────────┴─────────┴──────────┴─────────┴─────────────────┘ │
│                                                                  │
│ Pedagogical caption                                              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click benchmark button → load full detail panel
- Click any row in quick comparison → selects that benchmark
- Default selection: SWE-bench Verified (the de facto standard)

**Visual encoding:**
- **Benchmark buttons**: 5 buttons; active in cyan; left-border tinted by category color
- **Category badge** in detail header tinted by category color
- **Maturity badge** alongside: emerald (standard), cyan (established), violet (emerging)
- **Score bar chart**: horizontal bars with frontier (cyan) and human (emerald); gap annotation
- **If levels defined**: show each level's bar in a stacked sub-chart
- **What it measures**: highlighted prose block
- **Example task**: italicized monospace in a quoted box
- **Characteristics**: bulleted list with cyan bullets
- **Quick comparison table**: 5 rows; active row highlighted; gap to human (negative for below, positive for above)

### 3. `AgentBenchmarkExplorer.tsx`

```tsx
import { useState } from 'react';
import {
  BENCHMARKS, CATEGORY_COLORS, MATURITY,
  type AgentBenchmark, type DifficultyLevel,
} from './benchmark-data';
import styles from './AgentBenchmarkExplorer.module.css';


function ScoreBar({ score, label, color }: { score: number; label: string; color: string }) {
  const pct = Math.round(score * 100);
  return (
    <div className={styles.scoreBarRow}>
      <div className={styles.scoreBarLabel}>{label}</div>
      <div className={styles.scoreBarTrack}>
        <div
          className={styles.scoreBarFill}
          style={{ width: `${pct}%`, background: color }}
        >
          <span className={styles.scoreBarValue}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}


function ScoreChart({ benchmark }: { benchmark: AgentBenchmark }) {
  const gap = benchmark.frontierScore - benchmark.humanScore;
  const gapPct = Math.round(gap * 100);
  const gapColor = gap >= 0 ? 'var(--emerald-400)' : 'var(--text-secondary)';
  
  return (
    <div className={styles.scoreChart}>
      <ScoreBar score={benchmark.frontierScore} label="Frontier agent" color="var(--cyan-400)" />
      <ScoreBar score={benchmark.humanScore} label="Human baseline" color="var(--emerald-400)" />
      
      <div className={styles.gapLabel}>
        <span style={{ color: gapColor, fontWeight: 600 }}>
          {gap >= 0 ? '↑ ' : ''}
          {gap >= 0 ? '+' : ''}{gapPct} pp
        </span>
        <span className={styles.gapDescription}>
          {gap >= 0 ? 'agents exceed human baseline' : 'agents below human baseline'}
        </span>
      </div>
      
      {benchmark.levels && (
        <div className={styles.levelsSection}>
          <div className={styles.levelsLabel}>By difficulty level:</div>
          {benchmark.levels.map(level => {
            const levelGap = level.frontierScore - level.humanScore;
            return (
              <div key={level.label} className={styles.levelRow}>
                <div className={styles.levelName}>{level.label}</div>
                <div className={styles.levelBars}>
                  <div className={styles.levelMiniBar}>
                    <div
                      className={styles.levelMiniBarFill}
                      style={{
                        width: `${level.frontierScore * 100}%`,
                        background: 'var(--cyan-400)',
                      }}
                    />
                    <span className={styles.levelMiniBarValue}>{Math.round(level.frontierScore * 100)}%</span>
                  </div>
                  <div className={styles.levelMiniBar}>
                    <div
                      className={styles.levelMiniBarFill}
                      style={{
                        width: `${level.humanScore * 100}%`,
                        background: 'var(--emerald-400)',
                      }}
                    />
                    <span className={styles.levelMiniBarValue}>{Math.round(level.humanScore * 100)}%</span>
                  </div>
                  <span className={styles.levelGap}>
                    {Math.round(levelGap * 100)} pp
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default function AgentBenchmarkExplorer() {
  const [idx, setIdx] = useState(0);  // default: SWE-bench Verified
  const benchmark = BENCHMARKS[idx]!;
  const categoryColor = CATEGORY_COLORS[benchmark.category];
  const maturity = MATURITY[benchmark.maturity];

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Agent benchmark explorer</div>
        <div className={styles.titleSubLabel}>
          {BENCHMARKS.length} 2025 agent benchmarks · pick one for detail
        </div>
      </div>

      {/* Picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a benchmark:</span>
          <div className={styles.benchmarkButtons}>
            {BENCHMARKS.map((b, i) => (
              <button
                key={b.id}
                className={`${styles.benchmarkButton} ${idx === i ? styles.benchmarkButtonActive : ''}`}
                style={{ borderLeftColor: CATEGORY_COLORS[b.category] }}
                onClick={() => setIdx(i)}
              >{b.shortLabel}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{benchmark.label.toUpperCase()}</div>
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

        {/* Meta row */}
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span
              className={styles.categoryDot}
              style={{ background: categoryColor }}
            />
            <span className={styles.metaText}>{benchmark.category}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Released:</span>
            <span className={styles.metaText}>{benchmark.year}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Tasks:</span>
            <span className={styles.metaText}>{benchmark.taskCount.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.descriptionText}>{benchmark.description}</div>

        {/* Score chart */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Score (early 2025)</div>
          <div className={styles.chartContainer}>
            <ScoreChart benchmark={benchmark} />
          </div>
        </div>

        {/* What it measures */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>What it measures</div>
          <div className={styles.measuresBox}>{benchmark.whatItMeasures}</div>
        </div>

        {/* Example task */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Example task (paraphrased)</div>
          <div className={styles.exampleTaskBox}>{benchmark.exampleTask}</div>
        </div>

        {/* Characteristics */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Characteristics</div>
          <ul className={styles.characteristicsList}>
            {benchmark.characteristics.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick comparison */}
      <div className={styles.comparisonPanel}>
        <div className={styles.sectionLabel}>Quick comparison (frontier vs human, early 2025)</div>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Benchmark</th>
              <th>Category</th>
              <th>Tasks</th>
              <th>Frontier</th>
              <th>Human</th>
              <th>Gap</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((b, i) => {
              const gap = b.frontierScore - b.humanScore;
              const gapPct = Math.round(gap * 100);
              return (
                <tr
                  key={b.id}
                  className={i === idx ? styles.comparisonRowActive : ''}
                  onClick={() => setIdx(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{b.shortLabel}</td>
                  <td>
                    <span
                      className={styles.categoryDot}
                      style={{ background: CATEGORY_COLORS[b.category] }}
                    />
                    {b.category}
                  </td>
                  <td>{b.taskCount.toLocaleString()}</td>
                  <td style={{ color: 'var(--cyan-300)' }}>
                    {Math.round(b.frontierScore * 100)}%
                  </td>
                  <td style={{ color: 'var(--emerald-400)' }}>
                    {Math.round(b.humanScore * 100)}%
                  </td>
                  <td
                    style={{
                      color: gap >= 0 ? 'var(--emerald-400)' : 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {gap >= 0 ? '↑ +' : ''}{gapPct} pp
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        <strong>The 2025 agent benchmark landscape</strong>: coding (SWE-bench, ~50%), general
        assistance (GAIA, ~65% Level 1), computer use (OSWorld, ~14%), tool-use reliability (τ-bench
        pass^4, ~51%), and complex web research (BrowseComp, ~42% — above human baseline). <strong>The
        gaps to human performance</strong> are real: 35 pp on SWE-bench, 58 pp on OSWorld. <strong>The
        widest gap is OSWorld</strong> (computer use) — embodied desktop interaction remains the
        hardest agent regime. <strong>BrowseComp's positive gap</strong> shows where agents already
        exceed humans: tireless browsing capacity. <strong>Benchmarks measure narrow things</strong>;
        production readiness requires more (cost, latency, safety, reliability, observability —
        sections 3-6 of this chapter). <strong>This is the discipline Ch 26 established, extended to
        the agent layer.</strong>
      </div>
    </div>
  );
}
```

### 4. `AgentBenchmarkExplorer.module.css`

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
.benchmarkButtons { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; }
.benchmarkButton {
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
.benchmarkButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.benchmarkButtonActive {
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

.metaRow {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.7rem;
  flex-wrap: wrap;
  padding: 0.45rem 0.7rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.metaItem {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.metaLabel { color: var(--text-tertiary); }
.metaText { color: var(--text-primary); }
.categoryDot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
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

/* Score chart */
.chartContainer {
  padding: 0.7rem 0.85rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.scoreChart { display: flex; flex-direction: column; gap: 0.55rem; }
.scoreBarRow {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 0.6rem;
}
.scoreBarLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-align: right;
}
.scoreBarTrack {
  position: relative;
  height: 22px;
  background: color-mix(in srgb, var(--bg-elevated) 50%, transparent);
  border-radius: 4px;
  overflow: hidden;
}
.scoreBarFill {
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  min-width: 32px;
  transition: width 300ms ease;
}
.scoreBarValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--bg-primary);
}
.gapLabel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  border-top: 1px dashed var(--border-subtle);
  padding-top: 0.5rem;
}
.gapDescription { color: var(--text-tertiary); font-style: italic; }

/* Levels */
.levelsSection {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-subtle);
}
.levelsLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.4rem;
  font-weight: 500;
}
.levelRow {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.4rem;
}
.levelName {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-primary);
  font-weight: 500;
}
.levelBars {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.levelMiniBar {
  position: relative;
  width: 110px;
  height: 14px;
  background: color-mix(in srgb, var(--bg-elevated) 60%, transparent);
  border-radius: 3px;
  overflow: hidden;
}
.levelMiniBarFill {
  height: 100%;
  border-radius: 3px;
  transition: width 300ms ease;
}
.levelMiniBarValue {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 0 3px var(--bg-primary);
}
.levelGap {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

/* Measures + example */
.measuresBox {
  padding: 0.55rem 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--cyan-400);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.55;
}
.measuresBox strong { color: var(--cyan-300); font-weight: 500; }

.exampleTaskBox {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  padding: 0.55rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-style: italic;
  line-height: 1.55;
}

/* Characteristics */
.characteristicsList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.characteristicsList li {
  font-size: 0.84rem;
  color: var(--text-primary);
  padding: 0.35rem 0.6rem 0.35rem 1.2rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  position: relative;
}
.characteristicsList li::before {
  content: '•';
  position: absolute;
  left: 0.55rem;
  color: var(--cyan-400);
  font-weight: 700;
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
  .scoreBarRow { grid-template-columns: 90px 1fr; }
  .scoreBarLabel { font-size: 0.68rem; }
  .levelRow { grid-template-columns: 60px 1fr; }
  .levelMiniBar { width: 70px; }
  .comparisonTable { font-size: 0.68rem; }
  .comparisonTable th, .comparisonTable td { padding: 0.35rem 0.4rem; }
  .metaRow { gap: 0.5rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as AgentBenchmarkExplorer } from './ch30-agent-eval-and-frameworks/AgentBenchmarkExplorer';
// Session 170 will add:
// export { default as FrameworkPicker } from './ch30-agent-eval-and-frameworks/FrameworkPicker';
```

### 6. Update `src/pages/ch30-agent-eval-and-frameworks/index.mdx`

**Edit A: Add widget import:**

```mdx
import { AgentBenchmarkExplorer } from '@components/widgets';
```

**Edit B: Replace section-2's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Agent benchmark explorer" caption="Five 2025 agent benchmarks visualized side-by-side: SWE-bench Verified (coding), GAIA (general), OSWorld (computer use), τ-bench (tool reliability), BrowseComp (web research). Each shows state-of-the-art numbers, the frontier-vs-human gap, task structure, paraphrased example tasks, and characteristics. The discipline of Ch 26 extended to the agent layer — and a snapshot of where agent capability sits in early 2025.">
  <AgentBenchmarkExplorer client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 2 of Ch 30** renders with the working widget. Section 5's placeholder still stubbed.
3. **Default state**: SWE-bench Verified selected (idx = 0); detail panel populated with description, score chart, characteristics, etc.
4. **Five benchmark buttons**: SWE-bench / GAIA / OSWorld / τ-bench / BrowseComp. Active button cyan; left-border tinted by category color.
5. **Category color coding**: coding (cyan), general-assistant (violet), computer-use (rose), tool-use (amber), web-research (emerald).
6. **Maturity badges**: standard (emerald), established (cyan), emerging (violet).
7. **Score bar chart**: two horizontal bars (frontier in cyan, human in emerald) with percentage labels.
8. **Gap label**: shows gap in pp; emerald-tinted with up-arrow when positive; secondary-tinted when negative.
9. **Level breakdown**: when benchmark has `levels`, show each level's frontier vs human as compact bars + gap.
10. **What it measures**: highlighted block with cyan left border.
11. **Example task**: italicized monospace; paraphrased (not verbatim from source).
12. **Characteristics**: bulleted list with cyan bullets.
13. **Quick comparison table**: 6 columns (Benchmark / Category / Tasks / Frontier / Human / Gap); active row highlighted; clicking any row selects.
14. **All 5 benchmarks cycle correctly**.
15. **Mobile** (< 720px): bars compress; table compacts; remains legible.
16. **`npm run typecheck`** passes.
17. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not reproduce verbatim tasks from any benchmark.** Example tasks are paraphrased.
- ❌ **Do not include benchmarks beyond the 5 specified.** WebArena, AgentBench, etc. are out of scope.
- ❌ **Do not show leaderboard names** (which company holds top score). Generic "frontier agent" only.
- ❌ **Do not flip Ch 30's status.** Session 171 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch30-agent-eval-and-frameworks/ src/components/widgets/index.ts src/pages/ch30-agent-eval-and-frameworks/index.mdx
git commit -m "session 129: agent benchmark explorer marquee 1 — 5 2025 benchmarks with frontier-vs-human gap"
git push origin main
```

---

## Notes for the session author

**On the 5 benchmarks spanning the 2025 agent eval landscape**:

| Benchmark | Category | Frontier | Human | Gap |
|-----------|----------|----------|-------|-----|
| SWE-bench Verified | coding | 50% | 85% | -35 pp |
| GAIA | general | 65% (L1) | 92% | -27 pp |
| OSWorld | computer-use | 14% | 72% | -58 pp |
| τ-bench | tool-use | 51% (p4) | 85% | -34 pp |
| BrowseComp | web-research | 42% | 30% | **+12 pp** ↑ |

Notes-for-author: "**The 5 benchmarks deliberately span the agent eval spectrum**: coding (mature, ~50%), general (Level-based, 30-70%), computer-use (hardest, ~14%), tool-use reliability (pass^k metric, ~51%), web research (the rare benchmark where agents exceed humans). **Reader sees that capability is uneven across domains.**"

**On the frontier-vs-human gap being the chapter's central evaluation signal**:
Each benchmark visualizes the gap explicitly. **OSWorld's 58-pp gap is the visual highlight** — computer-use remains hard. **BrowseComp's positive gap** is the most surprising data point — agents have tireless browsing capacity humans lack. Notes-for-author: "**The gaps tell the story.** Reader who sees OSWorld at 14% vs human 72% understands viscerally that agents have room to grow. **BrowseComp's reversal** teaches that agents can already exceed humans on some tasks — capability isn't uniform."

**On paraphrased example tasks**:
Every example task is paraphrased — never verbatim from the source benchmark. Notes-for-author: "**Paraphrasing avoids reproduction concerns and reinforces that the widget is teaching about the benchmark, not the benchmark itself.** The reader who wants original tasks goes to the source."

**On τ-bench's pass^k breakdown being central**:
The level breakdown for τ-bench shows pass^1 (~65%), pass^4 (~51%), pass^8 (~42%) — the reliability collapse that single-trial benchmarks hide. Notes-for-author: "**The pass^k breakdown is the τ-bench widget's most important detail.** Reader sees concretely that pass^1 of 65% becomes pass^4 of 51% becomes pass^8 of 42%. **Reliability degrades fast across attempts.**"

**On GAIA's three difficulty levels**:
Level 1 ~70%, Level 2 ~50%, Level 3 ~30%. **Human scores stay near 90% across levels** — the agent gap widens with difficulty. Notes-for-author: "**The widening gap with difficulty** is the GAIA insight. Easy multi-step tasks are nearly solved; hard ones remain firmly in human territory."

**On BrowseComp being the surprising data point**:
Frontier agents at ~42%; humans at ~30%. **Positive gap** treated honestly: "agents have tireless browsing capacity humans lack, even when their reasoning is weaker per-step." Notes-for-author: "**BrowseComp shows where agents already win.** Reader leaves with calibration: agents aren't universally worse than humans; the gap depends on the task structure."

**On category color coding being meaningful**:
- **Cyan** (coding) — code is foundational
- **Violet** (general-assistant) — sophisticated multi-task
- **Rose** (computer-use) — hardest / highest-stakes regime
- **Amber** (tool-use) — reliability / verification
- **Emerald** (web-research) — the positive-gap surprise

Notes-for-author: "**Color codes carry meaning across the curriculum.** Reader recognizes rose as hardest/highest-stakes from earlier chapters."

**On maturity badges:**
- **De facto standard**: SWE-bench, GAIA — the canonical benchmarks
- **Established**: OSWorld, τ-bench — important but newer
- **Emerging**: BrowseComp — recent and growing

Notes-for-author: "**Maturity badges help the reader understand which benchmarks are settled vs developing.** SWE-bench is what every coding-agent vendor reports against; BrowseComp may not be in two years if a better one emerges."

**On the quick comparison table including the gap column with up-arrow for positive**:
BrowseComp's "↑ +12 pp" stands out visually. Notes-for-author: "**The up-arrow on BrowseComp catches the eye.** Reader scanning the table sees that one benchmark is different — and clicks to find out why."

**On the gap-to-human as the most-discussed number in agent eval**:
The chapter's discipline framing rests on these numbers. Notes-for-author: "**A reader who memorizes the gap numbers leaves with calibration that takes engineers months to build otherwise.** 35-pp gap on coding; 58-pp gap on computer use; small/positive gap on browsing. **That's the 2025 agent eval landscape.**"

**Pedagogical claim this widget supports:**
"**The 2025 agent benchmark landscape** has five anchors — SWE-bench Verified (coding), GAIA (general), OSWorld (computer use), τ-bench (reliability), BrowseComp (web research) — each measuring different agent capability. **The frontier-vs-human gaps** range from -58 pp (computer use) to +12 pp (web research) — capability is uneven and developing. **τ-bench's pass^k metric** surfaces reliability gaps that single-trial benchmarks miss. **Most production-relevant**: SWE-bench for coding, τ-bench for tool reliability. **Benchmarks measure narrow things**; production readiness requires more (cost, latency, safety, reliability, observability — the rest of this chapter). **This is the discipline of Ch 26, extended to the agent layer.**"

After 60 seconds of interaction, the reader has internalized: (a) 5 benchmarks with their domains and SOTA numbers; (b) the gap-to-human as a central evaluation signal; (c) where agents excel (web research) and where they struggle (computer use); (d) the calibration that agent capability is real but uneven.

**This is Ch 30's first central visualization.** Build with care.
