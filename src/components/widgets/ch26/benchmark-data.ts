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
    const allIds = BENCHMARKS.map(b => b.id);
    sorted.sort((a, b) => meanScore(b, allIds) - meanScore(a, allIds));
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
