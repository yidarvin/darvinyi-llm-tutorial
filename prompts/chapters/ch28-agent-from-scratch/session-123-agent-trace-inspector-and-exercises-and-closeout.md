# Session 123 — Ch 28 agent trace inspector + exercises + closeout

> **The Chapter 28 closeout — the file that completes the engineering chapter.** Three deliverables: (1) implement the **Agent Trace Inspector** secondary widget — **four preset agent traces** (clean success, transient-failure retries, hallucinated tool call, cost-blown runaway) each rendered as a **flame-graph-style nested span visualization** with per-span timing, attributes (model name, token counts, cost, status), and a click-for-detail panel; (2) add an **Exercises section** with 4 problems (tool registry, retry-with-backoff, structured tracing, complete agent harness); (3) flip Ch 28's status from `'draft'` to `'published'`. **Closes Ch 28.** Phase 15 status: two of four chapters published. **Ch 29 (Multi-agent)** opens next.

This is a **single-topic chapter** (4-file cadence). The secondary widget combines with exercises in this final session — the standard closeout pattern. **File 158 is the file that closes Chapter 28.**

---

## Read first (in this order)

1. **`research/ch28-agent-from-scratch/research.md`** — concept 6 (observability) and the reference implementations are the source material
2. **`prompts/chapters/ch28-agent-from-scratch/session-121-page-structure.md`** — for the section-6 widget placeholder and exercise placement
3. **`prompts/chapters/ch28-agent-from-scratch/session-122-tool-schema-builder-widget.md`** — for the Ch 28 widget conventions
4. **`prompts/chapters/ch27-agent-foundations/session-120-pattern-catalog-and-exercises-and-closeout.md`** — for the recent Phase 15 closeout pattern

---

## Goal

By end of session, three things change in the repo:

1. **`AgentTraceInspector` widget** is implemented and wired into section 6. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("Scaffolding the agent") and section 8 ("Three chapters from the end"). Four exercises with hints + runnable starter code.
3. **Ch 28's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 28 is the twenty-eighth published chapter — and the second of Phase 15.**

After this session: **Ch 28 is complete. Phase 15 has its second published chapter.** **Ch 29 (Multi-agent)** opens next.

---

## Inputs

State of the repo after session 122:

- Section 4's `ToolSchemaBuilder` marquee widget is wired
- Section 6's widget is still stubbed
- All 3 runnable code blocks from session 121 are in place (tool registry, circuit-breaker + retry, tracing layer)
- `src/lib/chapters.ts` has Ch 1-27 `'published'`, Ch 28 `'draft'`
- `src/components/widgets/ch28-agent-from-scratch/` exists with `ToolSchemaBuilder` already

---

## Deliverables

1. **Create** `src/components/widgets/ch28-agent-from-scratch/AgentTraceInspector.tsx` — the React widget
2. **Create** `src/components/widgets/ch28-agent-from-scratch/AgentTraceInspector.module.css` — scoped styles
3. **Create** `src/components/widgets/ch28-agent-from-scratch/trace-data.ts` — 4 preset traces (clean / retries / hallucinated tool / cost-blown)
4. **Update** `src/components/widgets/index.ts` — add `AgentTraceInspector` export
5. **Update** `src/pages/ch28-agent-from-scratch/index.mdx`:
   - Replace section-6's `<WidgetFrame>` interior with `<AgentTraceInspector client:visible />`
   - Insert new `## Exercises` section between section 7 ("Scaffolding the agent") and section 8 ("Three chapters from the end")
6. **Update** `src/lib/chapters.ts` — change Ch 28's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 28's marquee widget is sealed.

---

## Detailed spec

### Part A — `AgentTraceInspector` widget

#### A.1 `trace-data.ts`

```ts
// src/components/widgets/ch28-agent-from-scratch/trace-data.ts

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
      'Tool calls are fast (140-200ms each) — the bottleneck is the model, not the tools',
      'Cost: ~$0.019 total for 3 LLM calls — manageable for most production use cases',
      'Three iterations match the 3 thought-action-observation triples in the chapter\'s opener',
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
        note: 'Timed out after 5s — first attempt failed' },
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
    note: 'Same task as the clean trace, but the first weather API call times out. Retry-with-backoff catches it: 1s wait, then a successful retry. The agent completes the task — slower by ~6 seconds, but successfully. **This is what robust agents look like in the wild.**',
    insights: [
      'Total time: 8.3s vs 2.3s clean — ~6s spent on the failed attempt + backoff',
      'Cost is barely affected: ~$0.0004 increase from retries (the LLM doesn\'t re-run)',
      'The first attempt status is "error"; the second is "ok" — the trace shows both',
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
        status: 'error', attributes: { iteration: 1 }, note: 'LLM called a tool that doesn\'t exist' },
      { id: 's2', name: 'llm_call',     kind: 'llm_call',   startMs: 5,    durationMs: 690,   depth: 1,
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 285, tokens_out: 80, cost_usd: 0.0052 } },
      { id: 's3', name: 'parse',        kind: 'parse',      startMs: 700,  durationMs: 2,     depth: 1,
        status: 'ok', attributes: { format: 'tool_call' } },
      { id: 's4', name: 'wikipedia_search', kind: 'tool_call', startMs: 705,  durationMs: 1,  depth: 1,
        status: 'error', attributes: { tool: 'wikipedia_search', error: 'UnknownTool: wikipedia_search not in registry' },
        note: 'Hallucinated tool — not in the registered toolset' },
      { id: 's5', name: 'agent_turn 2', kind: 'agent_turn', startMs: 990,  durationMs: 750,   depth: 0,
        status: 'ok', attributes: { iteration: 2 }, note: 'Agent recovered — used a real tool' },
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
    note: 'The LLM emitted a call to `wikipedia_search` — a tool that doesn\'t exist in the registry. **The execute() wrapper surfaced the error as a structured observation**, so the LLM saw "UnknownTool" and recovered by trying `web_search` instead. **Errors as observations is the chapter\'s central error-handling principle.** Hallucinated tool calls are common; well-engineered agents recover automatically.',
    insights: [
      'Hallucinated tool call surfaced as a structured error, not a Python exception',
      'The LLM read the error message and tried a different (real) tool on the next turn',
      'Total task time and cost are barely affected — the hallucinated call cost ~$0.005',
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
        note: 'Returned 4200 chars — large output' },
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
        status: 'ok', attributes: { model: 'claude-sonnet-4', tokens_in: 17800, tokens_out: 120, cost_usd: 0.0827 } },
      { id: 's15', name: 'final_answer', kind: 'final_answer', startMs: 12490, durationMs: 5,  depth: 1,
        status: 'warning', attributes: { answer_chars: 320, reason: 'cost_budget_exceeded' },
        note: 'Returned partial answer; cost budget caught the runaway' },
    ],
    totalMs: 12500,
    totalTokensIn: 46550,
    totalTokensOut: 1280,
    totalCostUsd: 0.247,
    outcome: 'completed-with-warnings',
    note: 'A task where the agent paginated through a large catalog without ever summarizing intermediate results. **Context bloated** — each LLM call had progressively more tokens (850 → 5100 → 9300 → 13500 → 17800). **Cost ballooned** — $0.014 → $0.083 in a single turn. **Cost budget triggered** at $0.25 and forced termination. **A classic anti-pattern**: unbounded accumulation of intermediate results.',
    insights: [
      'Token count grew 20× across 5 turns (850 → 17,800) — context bloat in action',
      'Cost grew 6× per turn at the peak — runaway cost growth',
      'Hard cost cap ($0.25) triggered termination — the agent returned a partial answer',
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
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 900

┌────────────────────────────────────────────────────────────────┐
│ Agent trace inspector                                            │
│ 4 traces · flame-graph-style nested spans · click for detail     │
│                                                                  │
│ Pick a trace:                                                    │
│  [ Clean ] [ Retries ] [ Hallucinated tool ] [ Cost-blown ]      │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ CLEAN SUCCESS                            clean              │ │
│ │                                                                │ │
│ │ Task: "What's the weather in Tokyo, and what date is..."     │ │
│ │                                                                │ │
│ │ Summary:                                                      │ │
│ │  ⏱️  2.29s    💰 $0.019   📊 1515 tokens   ✓ completed       │ │
│ │                                                                │ │
│ │ Span flame graph (click for detail):                          │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │ 0ms                              2.29s                    │ │ │
│ │ │ ├─ agent_turn 1                  ████████████             │ │ │
│ │ │ │  ├─ llm_call                   ██████████              │ │ │
│ │ │ │  ├─ parse                      .                        │ │ │
│ │ │ │  └─ get_weather                ███                      │ │ │
│ │ │ ├─ agent_turn 2                              ███████████ │ │ │
│ │ │ │  ├─ llm_call                               █████████    │ │ │
│ │ │ │  └─ get_date                               ██           │ │ │
│ │ │ └─ agent_turn 3                                    ██████│ │ │
│ │ │    ├─ llm_call                                     ██████│ │ │
│ │ │    └─ final_answer                                 .     │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ Selected span detail:                                         │ │
│ │ ┌────────────────────────────────────────────────────────┐ │ │
│ │ │ llm_call                                                 │ │ │
│ │ │ kind:     llm_call       status:   ok                    │ │ │
│ │ │ start:    5ms            duration: 720ms                 │ │ │
│ │ │ attributes:                                              │ │ │
│ │ │   model:        claude-sonnet-4                          │ │ │
│ │ │   tokens_in:    320                                       │ │ │
│ │ │   tokens_out:   95                                        │ │ │
│ │ │   cost_usd:     0.0058                                    │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                                │ │
│ │ Insights:                                                     │ │
│ │  • Total task time: ~2.3s, dominated by LLM latency (1.9s)   │ │
│ │  • Tool calls fast (140-200ms); bottleneck is model          │ │
│ │  • Cost: ~$0.019 total — manageable for production           │ │
│ │                                                                │ │
│ │ Scenario note:                                                │ │
│ │ A clean 3-turn ReAct trace: two tool calls (weather, date)... │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Pedagogical caption                                              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click trace button → load preset; reset selected span; reset detail panel
- Click any span bar or row → select; populate detail panel
- Each span shows: indent based on depth, name, duration bar starting at the span's startMs/totalMs offset
- Status icon on the right (✓ ✗ ⚠️)
- Selected span has cyan outline

**Visual encoding:**
- **Trace buttons**: 4 buttons; active in cyan; left-border tinted by category color (emerald clean / amber retries / violet hallucinated / rose cost-blown)
- **Category badge** in detail header
- **Summary stats row**: time, cost, tokens, outcome — 4 inline metrics
- **Flame graph**: each row is a span; bars colored by kind; horizontal position = startMs; width = durationMs
- **Selected span**: cyan ring around the bar + cyan-tinted row background
- **Detail panel**: structured table of attributes for the selected span
- **Insights**: bulleted list with cyan bullets
- **Scenario note**: italic prose at bottom

#### A.3 `AgentTraceInspector.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  TRACES, CATEGORY_COLORS, KIND_COLORS, STATUS_COLORS,
  type AgentTrace, type Span,
} from './trace-data';
import styles from './AgentTraceInspector.module.css';


function statusIcon(status: Span['status']): string {
  return status === 'ok' ? '✓' : status === 'error' ? '✗' : '⚠';
}


export default function AgentTraceInspector() {
  const [idx, setIdx] = useState(0);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const trace = TRACES[idx]!;
  const categoryColor = CATEGORY_COLORS[trace.category];

  const selectedSpan = useMemo(() => {
    if (!selectedSpanId) return null;
    return trace.spans.find(s => s.id === selectedSpanId) ?? null;
  }, [selectedSpanId, trace]);

  function selectTrace(i: number) {
    setIdx(i);
    setSelectedSpanId(null);
  }

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Agent trace inspector</div>
        <div className={styles.titleSubLabel}>
          {TRACES.length} traces · flame-graph-style nested spans · click for detail
        </div>
      </div>

      {/* Picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a trace:</span>
          <div className={styles.traceButtons}>
            {TRACES.map((t, i) => (
              <button
                key={t.id}
                className={`${styles.traceButton} ${idx === i ? styles.traceButtonActive : ''}`}
                style={{ borderLeftColor: CATEGORY_COLORS[t.category] }}
                onClick={() => selectTrace(i)}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{trace.label.toUpperCase()}</div>
          <div
            className={styles.categoryBadge}
            style={{
              background: `color-mix(in srgb, ${categoryColor} 18%, transparent)`,
              color: categoryColor,
              borderColor: `color-mix(in srgb, ${categoryColor} 40%, transparent)`,
            }}
          >
            {trace.category}
          </div>
        </div>

        {/* Task */}
        <div className={styles.taskBox}>"{trace.task}"</div>

        {/* Summary stats */}
        <div className={styles.summaryRow}>
          <div className={styles.summaryStat}>
            <span className={styles.summaryIcon}>⏱️</span>
            <span className={styles.summaryValue}>{(trace.totalMs / 1000).toFixed(2)}s</span>
            <span className={styles.summaryKey}>total</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryIcon}>💰</span>
            <span className={styles.summaryValue}>${trace.totalCostUsd.toFixed(3)}</span>
            <span className={styles.summaryKey}>cost</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryIcon}>📊</span>
            <span className={styles.summaryValue}>
              {(trace.totalTokensIn + trace.totalTokensOut).toLocaleString()}
            </span>
            <span className={styles.summaryKey}>tokens</span>
          </div>
          <div
            className={`${styles.summaryStat} ${
              trace.outcome === 'completed' ? styles.summaryStatOk :
              trace.outcome === 'completed-with-warnings' ? styles.summaryStatWarn :
              styles.summaryStatErr
            }`}
          >
            <span className={styles.summaryIcon}>
              {trace.outcome === 'completed' ? '✓' :
               trace.outcome === 'completed-with-warnings' ? '⚠' : '✗'}
            </span>
            <span className={styles.summaryValue}>{trace.outcome.replace(/-/g, ' ')}</span>
          </div>
        </div>

        {/* Span flame graph */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Span flame graph · click for detail</div>
          <div className={styles.flameContainer}>
            <div className={styles.timelineHeader}>
              <span>0ms</span>
              <span>{(trace.totalMs / 2).toFixed(0)}ms</span>
              <span>{trace.totalMs}ms</span>
            </div>
            <div className={styles.flameRows}>
              {trace.spans.map(span => {
                const left = (span.startMs / trace.totalMs) * 100;
                const width = Math.max(0.4, (span.durationMs / trace.totalMs) * 100);
                const isSelected = selectedSpanId === span.id;
                const kindColor = KIND_COLORS[span.kind];
                const statusColor = STATUS_COLORS[span.status];
                return (
                  <div
                    key={span.id}
                    className={`${styles.flameRow} ${isSelected ? styles.flameRowSelected : ''}`}
                    onClick={() => setSelectedSpanId(span.id)}
                  >
                    <div
                      className={styles.flameRowLabel}
                      style={{ paddingLeft: `${span.depth * 1.2}rem` }}
                    >
                      <span className={styles.flameStatusIcon} style={{ color: statusColor }}>
                        {statusIcon(span.status)}
                      </span>
                      <span className={styles.flameName}>{span.name}</span>
                    </div>
                    <div className={styles.flameBarTrack}>
                      <div
                        className={styles.flameBar}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          background: kindColor,
                          opacity: span.status === 'error' ? 0.85 : 0.7,
                        }}
                      >
                        <span className={styles.flameBarLabel}>{span.durationMs}ms</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected span detail */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Selected span detail</div>
          {!selectedSpan ? (
            <div className={styles.emptyState}>
              Click a span above to see its full attributes.
            </div>
          ) : (
            <div className={styles.spanDetail}>
              <div className={styles.spanDetailHeader}>
                <span className={styles.spanDetailName}>{selectedSpan.name}</span>
                <span
                  className={styles.spanDetailStatus}
                  style={{ color: STATUS_COLORS[selectedSpan.status] }}
                >
                  {statusIcon(selectedSpan.status)} {selectedSpan.status}
                </span>
              </div>
              <table className={styles.spanDetailTable}>
                <tbody>
                  <tr>
                    <td className={styles.spanDetailKey}>kind</td>
                    <td className={styles.spanDetailValue}>{selectedSpan.kind}</td>
                  </tr>
                  <tr>
                    <td className={styles.spanDetailKey}>start</td>
                    <td className={styles.spanDetailValue}>{selectedSpan.startMs}ms</td>
                  </tr>
                  <tr>
                    <td className={styles.spanDetailKey}>duration</td>
                    <td className={styles.spanDetailValue}>{selectedSpan.durationMs}ms</td>
                  </tr>
                  {Object.entries(selectedSpan.attributes).map(([k, v]) => (
                    <tr key={k}>
                      <td className={styles.spanDetailKey}>{k}</td>
                      <td className={styles.spanDetailValue}>{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedSpan.note && (
                <div className={styles.spanDetailNote}>
                  <span className={styles.spanDetailNoteLabel}>note:</span> {selectedSpan.note}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Insights */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Insights</div>
          <ul className={styles.insightList}>
            {trace.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>

        {/* Scenario note */}
        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Scenario note</div>
          <div className={styles.noteText}>{trace.note}</div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        <strong>This is what production observability looks like.</strong> Each agent task is a tree of
        spans — LLM calls, tool calls, parses, retries, final answers — each with timing, attributes
        (model, tokens, cost), and status. <strong>Clean traces tell you nothing</strong>; they're
        the baseline. <strong>The interesting traces are the failure modes</strong>: transient retries
        (engineering working as designed), hallucinated tool calls (the LLM recovers via structured
        errors), cost-blown runaways (context bloat caught by hard caps). <strong>Without traces, every
        agent failure is mysterious</strong>; with them, the cause is visible in seconds. Production
        tools like LangSmith, Helicone, and Braintrust render this view at scale.
      </div>
    </div>
  );
}
```

#### A.4 `AgentTraceInspector.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .detailPanel, .caption {
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
.traceButtons { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; }
.traceButton {
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
.traceButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.traceButtonActive {
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
  border: 1px solid;
  text-transform: lowercase;
}

.taskBox {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.84rem;
  padding: 0.55rem 0.8rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  margin-bottom: 0.85rem;
  font-style: italic;
}

/* Summary row */
.summaryRow {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.85rem;
}
.summaryStat {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.7rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  flex: 1 1 auto;
  min-width: 110px;
}
.summaryIcon { font-size: 0.95rem; }
.summaryValue { color: var(--text-primary); font-weight: 600; }
.summaryKey { color: var(--text-tertiary); font-size: 0.72rem; }
.summaryStatOk { border-color: color-mix(in srgb, var(--emerald-400) 40%, transparent); }
.summaryStatOk .summaryValue { color: var(--emerald-400); }
.summaryStatWarn { border-color: color-mix(in srgb, var(--amber-400) 40%, transparent); }
.summaryStatWarn .summaryValue { color: var(--amber-400); }
.summaryStatErr { border-color: color-mix(in srgb, var(--rose-400) 40%, transparent); }
.summaryStatErr .summaryValue { color: var(--rose-400); }

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

/* Flame graph */
.flameContainer {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 0.7rem;
}
.timelineHeader {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: var(--text-tertiary);
  padding-left: 220px;
  margin-bottom: 0.4rem;
  border-bottom: 1px dashed var(--border-subtle);
  padding-bottom: 0.25rem;
}
.flameRows {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}
.flameRow {
  display: grid;
  grid-template-columns: 220px 1fr;
  align-items: center;
  padding: 0.18rem 0.3rem;
  border-radius: 3px;
  cursor: pointer;
  transition: background 200ms;
}
.flameRow:hover { background: color-mix(in srgb, var(--cyan-500) 6%, transparent); }
.flameRowSelected {
  background: color-mix(in srgb, var(--cyan-500) 12%, transparent);
  outline: 1px solid color-mix(in srgb, var(--cyan-500) 40%, transparent);
  outline-offset: -1px;
}
.flameRowLabel {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.flameStatusIcon { font-weight: 700; width: 0.9rem; text-align: center; }
.flameName { color: var(--text-primary); }
.flameBarTrack {
  position: relative;
  height: 18px;
  background: color-mix(in srgb, var(--bg-elevated) 50%, transparent);
  border-radius: 3px;
}
.flameBar {
  position: absolute;
  top: 1px;
  height: 16px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--bg-primary);
  overflow: hidden;
  transition: opacity 200ms;
}
.flameBarLabel { white-space: nowrap; }

/* Span detail */
.emptyState {
  padding: 0.9rem 0.8rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  background: var(--bg-primary);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  text-align: center;
}
.spanDetail {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 0.7rem 0.85rem;
}
.spanDetailHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
  font-family: 'JetBrains Mono', monospace;
}
.spanDetailName {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
}
.spanDetailStatus {
  font-size: 0.82rem;
  font-weight: 600;
}
.spanDetailTable {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.spanDetailTable td {
  padding: 0.25rem 0.4rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-subtle) 60%, transparent);
}
.spanDetailKey {
  color: var(--text-tertiary);
  width: 130px;
}
.spanDetailValue {
  color: var(--text-primary);
}
.spanDetailNote {
  margin-top: 0.5rem;
  padding: 0.5rem 0.65rem;
  background: color-mix(in srgb, var(--amber-400) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--amber-400) 30%, transparent);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
.spanDetailNoteLabel {
  color: var(--amber-400);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  margin-right: 0.3rem;
}

/* Insights */
.insightList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.insightList li {
  font-size: 0.84rem;
  color: var(--text-primary);
  padding: 0.35rem 0.6rem 0.35rem 1.2rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  position: relative;
  line-height: 1.5;
}
.insightList li::before {
  content: '•';
  position: absolute;
  left: 0.55rem;
  color: var(--cyan-400);
  font-weight: 700;
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
  .timelineHeader { padding-left: 140px; font-size: 0.6rem; }
  .flameRow { grid-template-columns: 140px 1fr; }
  .flameRowLabel { font-size: 0.66rem; }
  .flameBarLabel { display: none; }
  .summaryStat { font-size: 0.7rem; min-width: 90px; }
  .spanDetailKey { width: 90px; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as ToolSchemaBuilder }     from './ch28-agent-from-scratch/ToolSchemaBuilder';
export { default as AgentTraceInspector }   from './ch28-agent-from-scratch/AgentTraceInspector';
```

#### A.6 Update `src/pages/ch28-agent-from-scratch/index.mdx`

**Edit A: Update widget import:**

```mdx
import { ToolSchemaBuilder, AgentTraceInspector } from '@components/widgets';
```

**Edit B: Replace section-6's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Agent trace inspector" caption="Four agent traces visualized as flame-graph-style nested spans: clean success, transient-failure retries, hallucinated tool call, cost-blown runaway. Each span shows timing, attributes (model, tokens, cost), and status. Click any span for full detail. Mirrors what production tools (LangSmith, Helicone, Braintrust) render at scale. Demonstrates that observability isn't optional — it's the only way to debug production agent failures.">
  <AgentTraceInspector client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("Scaffolding the agent") and section 8 ("Three chapters from the end"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the engineering toolkit. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

The exercises trace the chapter's arc: build a tool registry (Ex 1) → implement a retry pattern (Ex 2) → add structured tracing (Ex 3) → tie everything together in a complete agent harness (Ex 4). After these, the reader has all the components of a production agent.

### Exercise 1 (easy) — Tool registry with execute()

Build a tool registry where tools are registered by name, schemas are generated from metadata, and execution is wrapped in structured error handling.

<details>
<summary>Hint</summary>

The pattern:
1. A `Tool` class holds: name, description, parameters schema, function
2. A `register` decorator adds tools to a global registry
3. Each tool's `execute(arguments)` method calls the function and wraps any exception in a structured `{'status': 'error', 'error_type': ..., 'message': ...}` response
4. On success: `{'status': 'ok', 'result': ...}`

The point is that the LLM never sees a Python exception — it sees a structured observation it can reason about.

</details>

<RunnableCode
  client:visible
  defaultCode={`from typing import Callable
import math

class Tool:
    def __init__(
        self,
        name: str,
        description: str,
        parameters_schema: dict,
        function: Callable,
    ):
        self.name = name
        self.description = description
        self.parameters_schema = parameters_schema
        self.function = function
    
    def execute(self, arguments: dict) -> dict:
        """
        Execute the tool with given arguments.
        Returns a structured response:
          {'status': 'ok', 'result': ...}      on success
          {'status': 'error', 'error_type': str, 'message': str}  on exception
        """
        # TODO:
        # try:
        #     result = self.function(**arguments)
        #     return {'status': 'ok', 'result': result}
        # except Exception as e:
        #     return {
        #         'status': 'error',
        #         'error_type': type(e).__name__,
        #         'message': str(e),
        #     }
        pass
    
    def to_openai_schema(self) -> dict:
        """Convert to OpenAI function-calling schema format."""
        return {
            'type': 'function',
            'function': {
                'name': self.name,
                'description': self.description,
                'parameters': self.parameters_schema,
            },
        }


TOOLS: dict[str, Tool] = {}


def register(name: str, description: str, parameters_schema: dict):
    """Decorator: register a function as a Tool in the global registry."""
    def wrapper(fn):
        TOOLS[name] = Tool(name, description, parameters_schema, fn)
        return fn
    return wrapper


# Register some example tools
@register(
    name='get_weather',
    description='Get current weather for a city.',
    parameters_schema={
        'type': 'object',
        'properties': {
            'city': {'type': 'string', 'description': 'City name'},
        },
        'required': ['city'],
    },
)
def get_weather(city: str) -> dict:
    return {'city': city, 'temp_c': 18, 'conditions': 'partly cloudy'}


@register(
    name='calculate',
    description='Evaluate a mathematical expression.',
    parameters_schema={
        'type': 'object',
        'properties': {
            'expression': {'type': 'string', 'description': 'Math expression'},
        },
        'required': ['expression'],
    },
)
def calculate(expression: str) -> float:
    safe = {'__builtins__': {}}
    locals_ = {'sqrt': math.sqrt, 'pi': math.pi}
    return eval(expression, safe, locals_)


# Test
# print("Registered tools:", list(TOOLS.keys()))
# print()
# 
# # Successful call
# result = TOOLS['get_weather'].execute({'city': 'Tokyo'})
# print(f"get_weather(Tokyo): {result}")
# 
# # Error: division by zero
# result = TOOLS['calculate'].execute({'expression': '1/0'})
# print(f"calculate(1/0):     {result}")
# 
# # Error: wrong argument name
# result = TOOLS['get_weather'].execute({'town': 'Tokyo'})
# print(f"get_weather(town):  {result}")
# 
# # Observations:
# # - Successful calls return {status:'ok', result:...}
# # - All exceptions become {status:'error', ...} — never raised to the agent
# # - Schema generation uses metadata only (no inspection); explicit is better
# # - Real production: also generate Anthropic schema; add OpenAPI conversion
`}
  packages={[]}
/>

### Exercise 2 (medium) — Retry with exponential backoff

Implement a retry helper that re-executes a flaky function with exponential backoff, returning a structured `(result, error)` tuple after success or exhaustion.

<details>
<summary>Hint</summary>

The pattern:
1. Attempt up to `max_retries` times
2. On exception, sleep for `base_wait * 2^attempt` (exponential backoff)
3. Return `(result, None)` on success, `(None, "error message")` on exhaustion
4. The structured tuple lets the caller decide what to do — no exceptions raised

Real production also adds: error categorization (retryable vs not), circuit breakers, jitter (small random offset to avoid thundering-herd retries).

</details>

<RunnableCode
  client:visible
  defaultCode={`import time
import random


def with_retry(fn, *args, max_retries=3, base_wait=0.001, **kwargs):
    """
    Retry fn with exponential backoff.
    Returns (result, error_message). Exactly one of these is None.
    """
    # TODO:
    # For attempt in range(max_retries):
    #   try:
    #     result = fn(*args, **kwargs)
    #     return (result, None)
    #   except Exception as e:
    #     wait = base_wait * (2 ** attempt)
    #     print(f"  Attempt {attempt + 1} failed: {e}. Waiting {wait*1000:.0f}ms...")
    #     time.sleep(wait)
    # Return (None, f"Failed after {max_retries} attempts")
    pass


# Mock flaky tool
def flaky_search(query):
    """Fails 50% of the time."""
    if random.random() < 0.5:
        raise ConnectionError("Service temporarily unavailable")
    return f"Search results for: {query}"


# Test
# random.seed(42)
# 
# for i in range(4):
#     print(f"\\nCall {i + 1}: query='topic_{i}'")
#     result, error = with_retry(flaky_search, f'topic_{i}', max_retries=3)
#     if error:
#         print(f"  ✗ Final: {error}")
#     else:
#         print(f"  ✓ Final: {result}")
# 
# # Observations:
# # - Exponential backoff: waits 1ms, 2ms, 4ms between retries (scaled down for demo)
# # - Some calls succeed on retry; some exhaust their budget
# # - The (result, error) tuple lets the caller decide what to do next
# # - Real production: add jitter, circuit breakers, error categorization
`}
  packages={[]}
/>

### Exercise 3 (medium) — Structured tracing layer

Add a `Tracer` class that records spans (timed operations) with attributes. Spans nest via Python's context-manager protocol. Use it to trace a mock agent loop.

<details>
<summary>Hint</summary>

The pattern:
1. `Tracer` keeps a list of span records and a stack of currently-open spans
2. `tracer.span(name, **attrs)` returns a context manager that:
   - on enter: pushes a new span onto the stack with start time + attrs
   - on exit: pops, records end time and status
3. Each span records: id, parent_id, name, start, duration, attributes, status
4. `report()` prints the tree with indentation

Real production uses OpenTelemetry, but the conceptual model is identical.

</details>

<RunnableCode
  client:visible
  defaultCode={`import time
import uuid
from contextlib import contextmanager


class Tracer:
    def __init__(self):
        self.spans = []
        self.span_stack = []
        self.task_id = None
    
    def start_task(self, name: str) -> str:
        self.task_id = str(uuid.uuid4())
        self.spans = []
        self.span_stack = []
        return self.task_id
    
    @contextmanager
    def span(self, name: str, **attrs):
        """
        Context manager. On enter: open a span. On exit: close it.
        Spans nest naturally based on the call stack.
        """
        # TODO:
        # 1. Generate span_id (uuid4 first 8 chars)
        # 2. parent_id = span_stack[-1] if span_stack else None
        # 3. record = {span_id, parent_id, task_id, name, start: time.time(), attributes: attrs}
        # 4. Append record to self.spans
        # 5. Push span_id onto self.span_stack
        # 6. try: yield record; record['status'] = 'ok'
        #    except: record['status'] = 'error'; record['error'] = str(e); raise
        #    finally: record['end'] = time.time(); record['duration_ms'] = (end-start)*1000
        #             self.span_stack.pop()
        pass
    
    def report(self):
        print(f"=== Trace for task {self.task_id} ===")
        for span in self.spans:
            # Compute depth by walking parent chain
            depth = 0
            pid = span['parent_id']
            while pid:
                depth += 1
                pid = next((s['parent_id'] for s in self.spans if s['span_id'] == pid), None)
            indent = '  ' * depth
            icon = '✓' if span.get('status') == 'ok' else '✗'
            attrs_str = ' '.join(f'{k}={v}' for k, v in span['attributes'].items())
            print(f"{indent}{icon} {span['name']:<20} ({span['duration_ms']:.1f}ms)  {attrs_str}")


# Test
# tracer = Tracer()
# tracer.start_task("answer_user_query")
# 
# with tracer.span("agent_turn", iteration=1):
#     with tracer.span("llm_call", model="claude-sonnet-4", tokens_in=320, tokens_out=95):
#         time.sleep(0.04)
#     with tracer.span("tool_call", tool="get_weather", city="Tokyo"):
#         time.sleep(0.02)
# 
# with tracer.span("agent_turn", iteration=2):
#     with tracer.span("llm_call", model="claude-sonnet-4", tokens_in=455, tokens_out=60):
#         time.sleep(0.03)
#     with tracer.span("tool_call", tool="get_date"):
#         time.sleep(0.01)
# 
# tracer.report()
# 
# # Observations:
# # - Spans nest via context managers (with statement)
# # - Each span has start, end, duration, attributes
# # - Trace structure mirrors the call structure of the agent
# # - Real production: OpenTelemetry standardizes this; LangSmith renders it
# # - Visualization turns hours of debugging into seconds of inspection
`}
  packages={[]}
/>

### Exercise 4 (hard) — Complete agent harness

Tie everything together: build a complete agent harness that uses a tool registry (Ex 1), retry helper (Ex 2), and tracer (Ex 3) to execute a multi-turn ReAct task.

<details>
<summary>Hint</summary>

The harness:
1. `Agent(tools, tracer, max_iterations)` holds the components
2. `run(task)` executes the ReAct loop with tracing
3. Each iteration: traced agent_turn span; traced llm_call; parse; traced tool_call (with retry)
4. Returns the final answer (or error) when the loop ends

The point is that all the pieces compose: the tool registry executes safely; retry handles flakiness; the tracer records everything; the agent loop drives the iteration.

For the LLM, you'll mock responses — focus on the orchestration, not the model.

</details>

<RunnableCode
  client:visible
  defaultCode={`import time
import uuid
import random
import re
from contextlib import contextmanager
from typing import Callable


# Reuse: Tool, Tracer, with_retry from previous exercises
# (For brevity in this exercise, we'll define minimal versions inline.)

class Tool:
    def __init__(self, name, description, function):
        self.name = name; self.description = description; self.function = function
    
    def execute(self, arguments):
        try:
            return {'status': 'ok', 'result': self.function(**arguments)}
        except Exception as e:
            return {'status': 'error', 'error_type': type(e).__name__, 'message': str(e)}


class Tracer:
    def __init__(self):
        self.spans = []; self.stack = []
    
    @contextmanager
    def span(self, name, **attrs):
        span = {'name': name, 'start': time.time(), 'attributes': attrs, 'depth': len(self.stack)}
        self.spans.append(span); self.stack.append(span)
        try: yield span; span['status'] = 'ok'
        except Exception as e: span['status'] = 'error'; span['error'] = str(e); raise
        finally:
            span['duration_ms'] = (time.time() - span['start']) * 1000
            self.stack.pop()
    
    def report(self):
        for s in self.spans:
            icon = '✓' if s.get('status') == 'ok' else '✗'
            attrs = ' '.join(f'{k}={v}' for k, v in s['attributes'].items())
            print(f"{'  ' * s['depth']}{icon} {s['name']:<20} ({s['duration_ms']:.1f}ms)  {attrs}")


# Mock tools
def tool_weather(city):
    return f"18°C, partly cloudy in {city}"

def tool_date():
    return "2025-05-22"

TOOLS = {
    'get_weather': Tool('get_weather', 'Weather', tool_weather),
    'get_date':    Tool('get_date',    'Date',    tool_date),
}


def mock_llm(prompt):
    """Mock LLM that drives a 3-turn task."""
    if 'weather' in prompt and 'Tokyo' not in prompt:
        return 'Thought: weather first\\nAction: get_weather(city="Tokyo")'
    if 'Tokyo' in prompt and '2025-05-22' not in prompt:
        return 'Thought: date next\\nAction: get_date()'
    if '2025-05-22' in prompt:
        return 'Thought: ready to answer\\nAction: final_answer("Today in Tokyo: 18°C, partly cloudy.")'
    return 'Action: final_answer("Unable to answer.")'


def parse_react(text):
    t = re.search(r'Thought:\\s*(.+?)(?=\\n|$)', text)
    a = re.search(r'Action:\\s*(.+?)(?=\\n|$)', text)
    return (t.group(1) if t else '', a.group(1) if a else '')


def parse_action(action_str):
    m = re.match(r'(\\w+)\\((.*)\\)', action_str)
    if not m: return None, {}
    name = m.group(1)
    args_str = m.group(2)
    # Naive: parse "key=value" pairs
    args = {}
    for pair in re.findall(r'(\\w+)\\s*=\\s*"([^"]*)"', args_str):
        args[pair[0]] = pair[1]
    return name, args


class Agent:
    def __init__(self, tools, tracer, max_iterations=8):
        self.tools = tools
        self.tracer = tracer
        self.max_iterations = max_iterations
    
    def run(self, task):
        """
        Run the ReAct loop with tracing.
        Returns the final answer string.
        """
        # TODO:
        # 1. history = [f"Task: {task}"]
        # 2. For iteration in range(self.max_iterations):
        #      with self.tracer.span("agent_turn", iteration=iteration+1):
        #        with self.tracer.span("llm_call", tokens=420):  # mock attributes
        #          response = mock_llm("\\n".join(history))
        #        thought, action = parse_react(response)
        #        history.extend([f"Thought: {thought}", f"Action: {action}"])
        #        if action.startswith('final_answer'):
        #          answer = re.search(r'final_answer\\(["\\'](.*)["\\']\\)', action)
        #          return answer.group(1) if answer else "Done"
        #        tool_name, tool_args = parse_action(action)
        #        if tool_name not in self.tools:
        #          history.append(f"Observation: Error - unknown tool {tool_name}")
        #          continue
        #        with self.tracer.span("tool_call", tool=tool_name):
        #          result = self.tools[tool_name].execute(tool_args)
        #        if result['status'] == 'error':
        #          history.append(f"Observation: Error - {result['message']}")
        #        else:
        #          history.append(f"Observation: {result['result']}")
        # 3. Return "Max iterations reached."
        pass


# Test
# tracer = Tracer()
# agent = Agent(TOOLS, tracer)
# 
# answer = agent.run("What's the weather in Tokyo and the date today?")
# print(f"\\n=== Final answer: {answer}")
# print(f"\\n=== Trace:")
# tracer.report()
# 
# # Observations:
# # - The agent orchestrates: tools execute safely; tracer records everything;
# #   loop terminates on final_answer or max_iterations
# # - Each component is independent; the agent composes them
# # - Real production agents add: retry on tool errors, cost tracking, 
# #   structured logging, observability platform integration
# # - This is the engineering 80% the chapter covers, in compact form
`}
  packages={[]}
/>

````

### Part C — Flip Ch 28's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 28, slug: 'ch28-agent-from-scratch', title: 'Agents from scratch', partNum: 9, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 28 still render correctly (no changes to existing sections).
3. **Section 4's** `ToolSchemaBuilder` marquee widget still renders correctly.
4. **Section 6** now renders the working `AgentTraceInspector` widget.
5. **Default state**: trace 0 (Clean success) selected; no span selected; empty-state message in detail panel.
6. **Four trace buttons**: Clean / Retries / Hallucinated tool / Cost-blown. Active button cyan; left-border tinted by category color.
7. **Category color coding**: clean (emerald), retries (amber), hallucinated (violet), cost-blown (rose).
8. **Task box**: italicized monospace, displayed below detail header.
9. **Summary stats row**: 4 stats (time, cost, tokens, outcome); outcome stat colored by outcome (emerald/amber/rose).
10. **Flame graph**: each span rendered as a row with label (indented by depth) + duration bar; bars colored by kind; bar label shows duration.
11. **Span selection**: clicking any span row populates the detail panel; selected row has cyan outline.
12. **Span detail table**: shows kind, start, duration, all attributes; status icon colored by status; note (if any) in amber-tinted callout.
13. **Empty state**: when no span selected, show "Click a span above to see its full attributes."
14. **Insights list**: 4-5 bullets per trace.
15. **Scenario note**: prose paragraph below insights.
16. **All 4 traces cycle correctly**: span lists change; summary updates; detail clears.
17. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
18. **Sidebar**: Ch 1-28 all active (published); Ch 29-30 still dimmed.
19. **Prev/next at bottom of Ch 28**: prev = Ch 27 (active); next = Ch 29 (disabled).
20. **TOC**: includes Exercises as h2 between section 7 and section 8.
21. **Mobile** (< 720px): flame row labels narrow; bar labels hidden; controls wrap.
22. **`npm run typecheck`** passes.
23. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not call a real LLM** in any code or trace data.
- ❌ **Do not implement real OpenTelemetry integration.** Mock trace data only.
- ❌ **Do not animate the flame graph.** Static rendering only.
- ❌ **Do not flip any other chapter's status.** Only Ch 28 flips.
- ❌ **Do not modify Ch 1-27.** Sealed.
- ❌ **Do not modify Ch 28's marquee widget or prose sections 1-8.** Sealed.

---

## Wire-up

```bash
git add src/components/widgets/ch28-agent-from-scratch/AgentTraceInspector.tsx src/components/widgets/ch28-agent-from-scratch/AgentTraceInspector.module.css src/components/widgets/ch28-agent-from-scratch/trace-data.ts src/components/widgets/index.ts src/pages/ch28-agent-from-scratch/index.mdx src/lib/chapters.ts
git commit -m "session 123: Ch 28 closeout — agent trace inspector + exercises + status: published. Phase 15's second chapter complete."
git push origin main
```

---

## Ch 28 closeout — Phase 15's second chapter

Chapter 28 is now the twenty-eighth complete chapter on production. **Phase 15 has its second published chapter.**

Confirm before declaring Ch 28 done:

- ✅ BUILD_ORDER.md shows files 155-158 ✅
- ✅ File 159 marked ⏭️ (absorbed for 4-file cadence)
- ✅ Ch 28 status is `'published'`
- ✅ Both Ch 28 widgets work in production
- ✅ All 4 Ch 28 exercises render with their starter code

**Cadence check across 28 chapters:**

**4-file cadence** holds for **22 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, **28**).
**5-file cadence** holds for **6 two-topic chapters** (Ch 1, 5, 8, 9, 14, 20).

**28-chapter pattern stable. Phase 15 status:**
- ✅ Ch 27 (Agent foundations) — conceptual
- ✅ Ch 28 (Agents from scratch) — engineering
- ⬜ Ch 29 (Multi-agent) — opens next; composition
- ⬜ Ch 30 (Agent eval and frameworks) — closes the curriculum

**Two chapters remain. The curriculum's end is very close.**

---

## Notes for the session author

**On the 4 traces being deliberately chosen as a teaching set:**

| Trace | Teaches |
|-------|---------|
| **Clean** | What success looks like — the baseline; LLM dominates latency |
| **Retries** | Engineering working as designed — transient failure caught + recovered |
| **Hallucinated tool** | **Errors-as-observations** — the chapter's central error-handling principle |
| **Cost-blown** | What anti-patterns produce — context bloat → cost runaway → forced termination |

Notes-for-author: "**The 4 traces are deliberately curated to span: success, recoverable failure, soft-failure-with-recovery, and hard-failure-caught-by-budget.** Together they make the chapter's principles visible in real timing data."

**On the flame-graph format being the chapter's visual language:**
Real production observability tools (LangSmith, Helicone, Braintrust, OpenTelemetry-based stacks) all use flame-graph-style nested spans. Notes-for-author: "**The widget mirrors what engineers actually see in production.** Reader who has seen this widget will recognize the same view when they hit LangSmith or any other agent-observability tool."

**On the cost-blown trace being the most pedagogically rich:**
Token counts grow from 850 → 17,800 across 5 turns; cost per turn grows from $0.014 → $0.083; total cost is $0.247 — a 13× increase from the clean trace. Notes-for-author: "**The cost-blown trace is the chapter's strongest argument for engineering discipline.** Reader sees exactly how context bloat compounds — each iteration carries forward all prior observations, doubling and redoubling. **Cost budgets aren't optional**; they're the only thing that catches this anti-pattern."

**On the hallucinated-tool trace demonstrating errors-as-observations:**
The LLM calls `wikipedia_search` (not in the registry); the registry returns `{status: 'error', error_type: 'UnknownTool', ...}`; the LLM sees the structured error and tries `web_search` on the next turn. Notes-for-author: "**This trace is the chapter's central error-handling principle made concrete.** Section 5's MC8 callout said 'surface errors as structured observations' — the trace shows exactly what that produces: graceful recovery."

**On the insights list per trace being pedagogically dense:**
Each trace has 3-5 insights. Notes-for-author: "**The insights are the chapter's takeaways made specific.** Clean trace teaches that LLM is the bottleneck; retries trace teaches the cost is barely affected; hallucinated trace teaches recovery via structured errors; cost-blown teaches budget caps."

**On the click-for-detail interaction making attributes visible:**
The full span attributes (model name, tokens in/out, cost, status, error info) only appear in the detail panel. Notes-for-author: "**The list view shows shape; the detail view shows depth.** Reader scans the flame graph for structure, clicks individual spans for what production debuggers actually look at."

**On the four exercises spanning the full engineering toolkit:**

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | Tool registry with structured errors | 3 |
| 2 | medium | Retry with exponential backoff | 5 |
| 3 | medium | Structured tracing layer | 6 |
| 4 | hard | **Complete agent harness** | 1, 7, 8 (composition) |

Notes-for-author: "**The progression: registry → retry → tracing → harness.** Each exercise targets a specific Ch 28 outcome. **By the end, the reader has implemented every component of a production agent.** **Ex 4 is the chapter's most production-relevant exercise** — engineers will adapt this harness for their actual work."

**On Ex 4 (complete agent harness) tying everything together:**
Combines tool registry, retry helper, and tracer into a single Agent class. **The composition is the lesson.** Notes-for-author: "**Production agents look like Ex 4: small classes, clean composition, structured everything.** No magic; just careful engineering. **The 80% engineering reality** of section 1 made concrete in code."

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. 80/20 framing | Ex 4 (composition demonstrates the 80%) |
| 2. Tool design principles | (chapter prose + section 2) |
| 3. Tool implementation patterns | Ex 1 |
| 4. Schemas and structured calls | (section 4 marquee widget) |
| 5. Error handling and recovery | Ex 2 |
| 6. Observability | Ex 3 + section 6 widget |
| 7. Scaffolding | Ex 4 (system prompts implicit) + section 7 |
| 8. Connection to Phase 15 | Ex 4 + section 8 |

Outcomes 1, 3, 5, 6, 7, 8 served by exercises directly. Outcomes 2, 4 served by chapter prose + marquee widget.

**On Ch 28 being Phase 15's engineering chapter:**
Ch 27 was conceptual; Ch 28 was engineering. **Together they form the foundation for Ch 29 (composition) and Ch 30 (eval).** Notes-for-author: "**Engineers who can build a Ch 28 agent are ready for Ch 29's multi-agent territory.** This chapter is the engineering qualifier."

**Pedagogical claim of the chapter (revisited):**
"Production agents are 80% engineering, 20% LLM. **Tool design** (six principles) is the most important non-LLM skill. **Tool implementation** (sync/async, timeouts, output bounds) turns design into code. **Schemas** (function calling, MCP) tell the LLM how to call tools. **Error handling** (retry, circuit breakers, fallback, surfacing errors) keeps agents alive. **Observability** (structured logs, traces, spans) is the only path to debugging. **Scaffolding** (system prompts, descriptions, examples) compounds capability. **The engineering 80% is what separates a tutorial agent from a production one.** Composition follows in Ch 29; evaluation closes the curriculum in Ch 30."

**Phase 15 progress after this session**:
- ✅ Ch 27 Agent foundations
- ✅ Ch 28 Agents from scratch
- ⬜ Ch 29 Multi-agent
- ⬜ Ch 30 Agent eval and frameworks (closes the curriculum)

**Two chapters remain.**

Build with care. **This file closes the engineering chapter and prepares the reader for Ch 29's composition territory.**
