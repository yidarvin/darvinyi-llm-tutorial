/**
 * Four preset agent traces for the inspector widget.
 *
 * Each trace is a tree of spans with timing, attributes, and status.
 * Traces are realistic-feeling but hand-curated — they're not from any
 * specific production deployment.
 *
 * Scenarios:
 *  - clean: a successful 3-turn task; no errors
 *  - retries: same task but with one transient tool failure that retries
 *  - hallucinated: LLM emits a call to a tool that doesn't exist
 *  - cost-blown: a task that loops too much before terminating
 */

export type SpanStatus = 'ok' | 'error' | 'warning';

export interface Span {
  id: string;
  name: string;
  kind: 'agent_turn' | 'llm_call' | 'tool_call' | 'parse' | 'retry' | 'final_answer';
  /** Offset from task start, in milliseconds. */
  startMs: number;
  /** Duration in milliseconds. */
  durationMs: number;
  /** Depth in the tree (0 = root, 1 = nested under root, etc.). */
  depth: number;
  status: SpanStatus;
  /** Key/value attributes shown in the detail panel. */
  attributes: Record<string, string | number>;
  /** Optional one-line note about why this span matters in the trace. */
  note?: string;
}

export type TraceCategory = 'clean' | 'retries' | 'hallucinated' | 'cost-blown';

export interface AgentTrace {
  id: string;
  label: string;
  category: TraceCategory;
  task: string;
  spans: Span[];
  totalMs: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  outcome: 'completed' | 'failed' | 'completed-with-warnings';
  /** Plain-prose note about what this trace teaches. */
  note: string;
  /** Insights — one-liners about what a reader should notice. */
  insights: string[];
}


export const TRACES: AgentTrace[] = [
  {
    id: 'clean-success',
    label: 'Clean success',
    category: 'clean',
    task: "What's the weather in Tokyo, and what date is it today?",
    spans: [
      { id: 's1',  name: 'agent_turn 1',  kind: 'agent_turn',  startMs: 0,    durationMs: 950,   depth: 0,
        status: 'ok', attributes: { iteration: 1 } },
      { id: 's2',  name: 'llm_call',      kind: 'llm_call',    startMs: 5,    durationMs: 720,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 320, tokens_out: 95, cost_usd: 0.0058 } },
      { id: 's3',  name: 'parse',         kind: 'parse',       startMs: 730,  durationMs: 2,     depth: 1,
        status: 'ok', attributes: { format: 'tool_call' } },
      { id: 's4',  name: 'get_weather',   kind: 'tool_call',   startMs: 740,  durationMs: 195,   depth: 1,
        status: 'ok', attributes: { tool: 'get_weather', city: 'Tokyo', result_chars: 35 } },
      { id: 's5',  name: 'agent_turn 2',  kind: 'agent_turn',  startMs: 960,  durationMs: 840,   depth: 0,
        status: 'ok', attributes: { iteration: 2 } },
      { id: 's6',  name: 'llm_call',      kind: 'llm_call',    startMs: 965,  durationMs: 680,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 455, tokens_out: 60, cost_usd: 0.0064 } },
      { id: 's7',  name: 'parse',         kind: 'parse',       startMs: 1650, durationMs: 1,     depth: 1,
        status: 'ok', attributes: { format: 'tool_call' } },
      { id: 's8',  name: 'get_date',      kind: 'tool_call',   startMs: 1655, durationMs: 140,   depth: 1,
        status: 'ok', attributes: { tool: 'get_date', result_chars: 10 } },
      { id: 's9',  name: 'agent_turn 3',  kind: 'agent_turn',  startMs: 1810, durationMs: 480,   depth: 0,
        status: 'ok', attributes: { iteration: 3 } },
      { id: 's10', name: 'llm_call',      kind: 'llm_call',    startMs: 1815, durationMs: 460,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 540, tokens_out: 45, cost_usd: 0.0068 } },
      { id: 's11', name: 'final_answer',  kind: 'final_answer', startMs: 2280, durationMs: 5,    depth: 1,
        status: 'ok', attributes: { answer_chars: 56 } },
    ],
    totalMs: 2290,
    totalTokensIn: 1315,
    totalTokensOut: 200,
    totalCostUsd: 0.019,
    outcome: 'completed',
    note: 'A clean 3-turn ReAct trace: two tool calls (weather, date) followed by a final answer. No retries, no errors, modest cost. This is what production agents look like on the happy path.',
    insights: [
      'Total task time: ~2.3 seconds, dominated by LLM latency (1.9s of 2.3s)',
      'Tool calls are fast (140-200ms each); the bottleneck is the model, not the tools',
      'Cost: ~$0.019 total for 3 LLM calls, manageable for most production use cases',
      "Three iterations match the 3 thought-action-observation triples in the chapter's opener",
    ],
  },
  {
    id: 'retries',
    label: 'Transient retries',
    category: 'retries',
    task: "What's the weather in Tokyo, and what date is it today?",
    spans: [
      { id: 's1',  name: 'agent_turn 1',  kind: 'agent_turn',  startMs: 0,    durationMs: 2150,  depth: 0,
        status: 'warning', attributes: { iteration: 1 }, note: 'Tool retried twice' },
      { id: 's2',  name: 'llm_call',      kind: 'llm_call',    startMs: 5,    durationMs: 720,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 320, tokens_out: 95, cost_usd: 0.0058 } },
      { id: 's3',  name: 'get_weather (attempt 1)', kind: 'tool_call',  startMs: 730,  durationMs: 5040,  depth: 1,
        status: 'error', attributes: { tool: 'get_weather', city: 'Tokyo', error: 'ConnectionTimeout' },
        note: 'Timed out after 5s; first attempt failed' },
      { id: 's4',  name: 'retry_backoff',  kind: 'retry',     startMs: 5770, durationMs: 1000,  depth: 1,
        status: 'warning', attributes: { wait_ms: 1000, attempt: 2 } },
      { id: 's5',  name: 'get_weather (attempt 2)', kind: 'tool_call',  startMs: 6770, durationMs: 180,   depth: 1,
        status: 'ok', attributes: { tool: 'get_weather', city: 'Tokyo', result_chars: 35, attempt: 2 },
        note: 'Second attempt succeeded' },
      { id: 's6',  name: 'agent_turn 2',  kind: 'agent_turn',  startMs: 6960, durationMs: 840,   depth: 0,
        status: 'ok', attributes: { iteration: 2 } },
      { id: 's7',  name: 'llm_call',      kind: 'llm_call',    startMs: 6965, durationMs: 680,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 470, tokens_out: 60, cost_usd: 0.0066 } },
      { id: 's8',  name: 'get_date',      kind: 'tool_call',   startMs: 7655, durationMs: 140,   depth: 1,
        status: 'ok', attributes: { tool: 'get_date', result_chars: 10 } },
      { id: 's9',  name: 'agent_turn 3',  kind: 'agent_turn',  startMs: 7810, durationMs: 480,   depth: 0,
        status: 'ok', attributes: { iteration: 3 } },
      { id: 's10', name: 'llm_call',      kind: 'llm_call',    startMs: 7815, durationMs: 460,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 555, tokens_out: 45, cost_usd: 0.0070 } },
      { id: 's11', name: 'final_answer',  kind: 'final_answer', startMs: 8280, durationMs: 5,    depth: 1,
        status: 'ok', attributes: { answer_chars: 56 } },
    ],
    totalMs: 8290,
    totalTokensIn: 1345,
    totalTokensOut: 200,
    totalCostUsd: 0.0194,
    outcome: 'completed-with-warnings',
    note: "Same task as the clean trace, but the first weather API call times out. Retry-with-backoff catches it: 1s wait, then a successful retry. The agent completes the task (slower by ~6 seconds, but successfully). **This is what robust agents look like in the wild.**",
    insights: [
      'Total time: 8.3s vs 2.3s clean; ~6s spent on the failed attempt + backoff',
      "Cost is barely affected: ~$0.0004 increase from retries (the LLM doesn't re-run)",
      'The first attempt status is "error"; the second is "ok". The trace shows both',
      'Production observability: alert on traces with >2 retries (probable service degradation)',
    ],
  },
  {
    id: 'hallucinated',
    label: 'Hallucinated tool call',
    category: 'hallucinated',
    task: 'Look up the population of Bhutan.',
    spans: [
      { id: 's1', name: 'agent_turn 1', kind: 'agent_turn', startMs: 0,    durationMs: 990,   depth: 0,
        status: 'error', attributes: { iteration: 1 }, note: "LLM called a tool that doesn't exist" },
      { id: 's2', name: 'llm_call',     kind: 'llm_call',   startMs: 5,    durationMs: 690,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 285, tokens_out: 80, cost_usd: 0.0052 } },
      { id: 's3', name: 'parse',        kind: 'parse',      startMs: 700,  durationMs: 2,     depth: 1,
        status: 'ok', attributes: { format: 'tool_call' } },
      { id: 's4', name: 'wikipedia_search', kind: 'tool_call', startMs: 705,  durationMs: 1,  depth: 1,
        status: 'error', attributes: { tool: 'wikipedia_search', error: 'UnknownTool: wikipedia_search not in registry' },
        note: 'Hallucinated tool: not in the registered toolset' },
      { id: 's5', name: 'agent_turn 2', kind: 'agent_turn', startMs: 990,  durationMs: 750,   depth: 0,
        status: 'ok', attributes: { iteration: 2 }, note: 'Agent recovered: used a real tool' },
      { id: 's6', name: 'llm_call',     kind: 'llm_call',   startMs: 995,  durationMs: 595,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 360, tokens_out: 70, cost_usd: 0.0060 } },
      { id: 's7', name: 'web_search',   kind: 'tool_call',  startMs: 1595, durationMs: 130,   depth: 1,
        status: 'ok', attributes: { tool: 'web_search', query: 'population of Bhutan 2024', result_chars: 280 } },
      { id: 's8', name: 'agent_turn 3', kind: 'agent_turn', startMs: 1745, durationMs: 510,   depth: 0,
        status: 'ok', attributes: { iteration: 3 } },
      { id: 's9', name: 'llm_call',     kind: 'llm_call',   startMs: 1750, durationMs: 490,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 690, tokens_out: 50, cost_usd: 0.0078 } },
      { id: 's10', name: 'final_answer', kind: 'final_answer', startMs: 2245, durationMs: 5, depth: 1,
        status: 'ok', attributes: { answer_chars: 78 } },
    ],
    totalMs: 2255,
    totalTokensIn: 1335,
    totalTokensOut: 200,
    totalCostUsd: 0.019,
    outcome: 'completed-with-warnings',
    note: "The LLM emitted a call to `wikipedia_search`, a tool that doesn't exist in the registry. **The execute() wrapper surfaced the error as a structured observation**, so the LLM saw \"UnknownTool\" and recovered by trying `web_search` instead. **Errors as observations is the chapter's central error-handling principle.** Hallucinated tool calls are common; well-engineered agents recover automatically.",
    insights: [
      'Hallucinated tool call surfaced as a structured error, not a Python exception',
      'The LLM read the error message and tried a different (real) tool on the next turn',
      'Total task time and cost are barely affected: the hallucinated call cost ~$0.005',
      'Production observability: alert on traces with >3 hallucinations (probable schema/description issue)',
    ],
  },
  {
    id: 'cost-blown',
    label: 'Cost-blown runaway',
    category: 'cost-blown',
    task: 'Find every product on this catalog that costs under $50.',
    spans: [
      { id: 's1', name: 'agent_turn 1', kind: 'agent_turn', startMs: 0,     durationMs: 1850,  depth: 0,
        status: 'ok', attributes: { iteration: 1 } },
      { id: 's2', name: 'llm_call',     kind: 'llm_call',   startMs: 5,     durationMs: 1450,  depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 850, tokens_out: 320, cost_usd: 0.0144 } },
      { id: 's3', name: 'list_products', kind: 'tool_call', startMs: 1460,  durationMs: 380,   depth: 1,
        status: 'ok', attributes: { tool: 'list_products', page: 1, result_chars: 4200 },
        note: 'Returned 4200 chars: large output' },
      { id: 's4', name: 'agent_turn 2', kind: 'agent_turn', startMs: 1860,  durationMs: 2950,  depth: 0,
        status: 'ok', attributes: { iteration: 2 } },
      { id: 's5', name: 'llm_call',     kind: 'llm_call',   startMs: 1865,  durationMs: 2580,  depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 5100, tokens_out: 280, cost_usd: 0.0306 } },
      { id: 's6', name: 'list_products', kind: 'tool_call', startMs: 4460,  durationMs: 370,   depth: 1,
        status: 'ok', attributes: { tool: 'list_products', page: 2, result_chars: 4150 } },
      { id: 's7', name: 'agent_turn 3', kind: 'agent_turn', startMs: 4830,  durationMs: 3200,  depth: 0,
        status: 'ok', attributes: { iteration: 3 } },
      { id: 's8', name: 'llm_call',     kind: 'llm_call',   startMs: 4835,  durationMs: 3000,  depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 9300, tokens_out: 290, cost_usd: 0.0500 } },
      { id: 's9', name: 'list_products', kind: 'tool_call', startMs: 7850,  durationMs: 380,   depth: 1,
        status: 'ok', attributes: { tool: 'list_products', page: 3, result_chars: 4100 } },
      { id: 's10', name: 'agent_turn 4', kind: 'agent_turn', startMs: 8030, durationMs: 3300,  depth: 0,
        status: 'ok', attributes: { iteration: 4 } },
      { id: 's11', name: 'llm_call',    kind: 'llm_call',   startMs: 8035,  durationMs: 3100,  depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 13500, tokens_out: 270, cost_usd: 0.0697 } },
      { id: 's12', name: 'list_products', kind: 'tool_call', startMs: 11150, durationMs: 390,  depth: 1,
        status: 'ok', attributes: { tool: 'list_products', page: 4, result_chars: 4050 } },
      { id: 's13', name: 'agent_turn 5', kind: 'agent_turn', startMs: 11550, durationMs: 950,  depth: 0,
        status: 'warning', attributes: { iteration: 5 }, note: 'Cost budget exceeded; forced termination' },
      { id: 's14', name: 'llm_call',    kind: 'llm_call',   startMs: 11555, durationMs: 920,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 17800, tokens_out: 120, cost_usd: 0.0900 } },
      { id: 's15', name: 'final_answer', kind: 'final_answer', startMs: 12490, durationMs: 5,  depth: 1,
        status: 'warning', attributes: { answer_chars: 320, reason: 'cost_budget_exceeded' },
        note: 'Returned partial answer; cost budget caught the runaway' },
    ],
    totalMs: 12500,
    totalTokensIn: 46550,
    totalTokensOut: 1280,
    totalCostUsd: 0.2547,
    outcome: 'completed-with-warnings',
    note: 'A task where the agent paginated through a large catalog without ever summarizing intermediate results. **Context bloated**: each LLM call had progressively more tokens (850 → 5100 → 9300 → 13500 → 17800). **Cost ballooned**: $0.014 → $0.09 across the 5 turns. **Cost budget triggered** at $0.25 and forced termination. **A classic anti-pattern**: unbounded accumulation of intermediate results.',
    insights: [
      'Token count grew 20× across 5 turns (850 → 17,800), context bloat in action',
      'Total cost grew ~6× across 5 turns ($0.014 → $0.09 per-call), runaway cost growth',
      'Hard cost cap ($0.25) triggered termination; the agent returned a partial answer',
      'Fix: tools should summarize or paginate; agent should aggregate without re-passing every detail',
      'Production observability: alert on traces where any single LLM call exceeds 10× the median',
    ],
  },
];


/** Category color mapping. */
export const CATEGORY_COLORS: Record<TraceCategory, string> = {
  clean:          'var(--emerald-400)',
  retries:        'var(--amber-400)',
  hallucinated:   'var(--violet-400)',
  'cost-blown':   'var(--rose-400)',
};


/** Span kind color. */
export const KIND_COLORS: Record<Span['kind'], string> = {
  agent_turn:   'var(--cyan-400)',
  llm_call:     'var(--violet-400)',
  tool_call:    'var(--amber-400)',
  parse:        'var(--text-secondary)',
  retry:        'var(--amber-400)',
  final_answer: 'var(--emerald-400)',
};


/** Status color. */
export const STATUS_COLORS: Record<SpanStatus, string> = {
  ok:      'var(--emerald-400)',
  error:   'var(--rose-400)',
  warning: 'var(--amber-400)',
};
