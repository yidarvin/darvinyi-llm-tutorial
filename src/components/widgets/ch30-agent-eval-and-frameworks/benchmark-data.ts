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
    frontierScore: 0.65,
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
