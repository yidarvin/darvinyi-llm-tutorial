# Session 130 — Framework picker marquee widget

> The second marquee Chapter 30 widget. **An interactive recommender across six production observability frameworks**: LangSmith (LangChain), Helicone (cost-focused proxy), Braintrust (eval-first), Anthropic's evaluation tooling, OpenTelemetry GenAI (vendor-neutral standard), and Custom code. Reader toggles four task-characteristic inputs (existing LangChain stack, cost sensitivity, team eval discipline, vendor independence) and the widget recommends a framework with explicit reasoning. **Full framework directory** is always visible — each framework's design philosophy, strengths, weaknesses, and when-to-use. **The widget that reinforces the chapter's central framing**: the right framework is the one your team will actually use, not the one with the most features. **A calibration tool against framework-hype** — the agent-platform analog of Ch 29's calibration against multi-agent hype.

---

## Read first (in this order)

1. **`research/ch30-agent-eval-and-frameworks/research.md`** — concept 5 (production observability frameworks) is the source material
2. **`prompts/chapters/ch30-agent-eval-and-frameworks/session-128-page-structure.md`** — for the section-5 widget placeholder this session fills
3. **`prompts/chapters/ch30-agent-eval-and-frameworks/session-129-agent-benchmark-explorer-widget.md`** — for the first Ch 30 widget conventions
4. **`prompts/chapters/ch29-multi-agent/session-125-multi-agent-topology-explorer-widget.md`** — for the Phase 15 widget calibration framing this widget extends

---

## Goal

Replace the `<WidgetFrame title="Framework picker">` placeholder in section 5 with a working interactive widget that:

- Shows a **task-characteristic input panel** with 4 toggleable factors:
  - Existing LangChain/LangGraph stack? (yes / no / unknown)
  - Cost sensitivity? (high / medium / low)
  - Team eval discipline? (high / medium / low)
  - Vendor independence required? (yes / no)
- A **recommendation panel** that updates as inputs change — shows the recommended framework with **explicit reasoning** based on the inputs
- A **framework directory** with all 6 frameworks always visible; reader can expand any for detail
- Each framework's detail shows: design philosophy, strengths (✓), weaknesses (✗), when to use, when NOT to use, pricing model summary
- A **pedagogical caption** below

**End state:** section 5 of Chapter 30 has a working marquee widget. After 60 seconds of interaction (cycling through 2-3 input combinations and exploring 2-3 frameworks), the reader should be able to: (a) **name the 6 production observability options** and what each is designed for; (b) **articulate the decision criteria** that lead to each recommendation; (c) **recognize that no framework is universally best** — the right choice depends on context; (d) **internalize the chapter's framing**: the framework is plumbing, not the system.

---

## Inputs

State of the repo after session 129:

- Section 2's `AgentBenchmarkExplorer` marquee 1 is wired
- Section 5's widget placeholder is still stubbed
- `src/lib/chapters.ts` has Ch 30 as `'draft'`
- `src/components/widgets/ch30-agent-eval-and-frameworks/` exists with `AgentBenchmarkExplorer` already

---

## Deliverables

1. **Create** `src/components/widgets/ch30-agent-eval-and-frameworks/FrameworkPicker.tsx` — the React widget
2. **Create** `src/components/widgets/ch30-agent-eval-and-frameworks/FrameworkPicker.module.css` — scoped styles
3. **Create** `src/components/widgets/ch30-agent-eval-and-frameworks/framework-data.ts` — 6 frameworks with design philosophies + recommendation logic
4. **Update** `src/components/widgets/index.ts` — add `FrameworkPicker` export
5. **Update** `src/pages/ch30-agent-eval-and-frameworks/index.mdx` — replace section-5's `<WidgetFrame>` interior with `<FrameworkPicker client:visible />`

---

## Detailed spec

### 1. `framework-data.ts`

```ts
// src/components/widgets/ch30-agent-eval-and-frameworks/framework-data.ts

/**
 * Six production observability frameworks with design philosophies,
 * strengths, weaknesses, and decision metadata. Plus a small recommendation
 * engine that scores frameworks against reader-provided task characteristics.
 *
 * The widget's calibration: NO framework is universally best. The right
 * choice depends on stack alignment, cost sensitivity, eval discipline,
 * and vendor-independence requirements.
 */

export type FrameworkCategory = 'platform' | 'proxy' | 'eval-platform' | 'vendor-tooling' | 'standard' | 'custom';

export interface Framework {
  id: string;
  label: string;
  shortLabel: string;
  category: FrameworkCategory;
  /** One-sentence design philosophy. */
  philosophy: string;
  /** Plain-prose description. */
  description: string;
  strengths: string[];
  weaknesses: string[];
  whenToUse: string[];
  whenNotToUse: string[];
  /** Pricing model summary (informational; not real-time). */
  pricing: string;
  /** Stack alignment notes. */
  stackAlignment: string;
}

export const FRAMEWORKS: Framework[] = [
  {
    id: 'langsmith',
    label: 'LangSmith',
    shortLabel: 'LangSmith',
    category: 'platform',
    philosophy: 'End-to-end LLM application observability, deeply integrated with LangChain.',
    description:
      'LangChain\'s production observability platform. Trace visualization (the analog of Ch 28\'s flame graph at scale), dataset management, evaluation pipelines, prompt experimentation. The most-adopted platform in the LangChain ecosystem; mature; opinionated about LangChain conventions.',
    strengths: [
      'Tight LangChain / LangGraph integration',
      'Mature trace visualization',
      'Built-in eval pipelines',
      'Dataset management',
      'Most-adopted in the LangChain ecosystem',
    ],
    weaknesses: [
      'Opinionated — assumes LangChain conventions',
      'Less useful outside the LangChain stack',
      'Pricing scales with trace volume',
    ],
    whenToUse: [
      'You\'re building on LangChain or LangGraph',
      'You want end-to-end eval + observability + dataset management',
      'You need a mature platform with production references',
    ],
    whenNotToUse: [
      'You\'re framework-agnostic and avoiding lock-in',
      'You don\'t need the full feature surface',
      'Cost per trace is the dominant concern',
    ],
    pricing: 'Subscription + per-trace usage; free tier available',
    stackAlignment: 'LangChain / LangGraph',
  },
  {
    id: 'helicone',
    label: 'Helicone',
    shortLabel: 'Helicone',
    category: 'proxy',
    philosophy: 'Drop-in LLM proxy with cost tracking and observability — minimal integration overhead.',
    description:
      'Open-source LLM observability proxy. Captures every LLM call via a one-line URL change; tracks cost per request, latency, cache hits, user-level analytics. Lighter-weight than LangSmith; cost-focused. Popular for teams where cost monitoring is the dominant concern.',
    strengths: [
      'One-line integration (URL swap)',
      'Open-source — self-hostable',
      'Cost tracking is first-class',
      'Vendor-neutral (works with any LLM)',
      'Lightweight — small feature surface',
    ],
    weaknesses: [
      'Less feature-rich than LangSmith / Braintrust',
      'Eval pipelines are simpler',
      'Less integrated with downstream workflows',
    ],
    whenToUse: [
      'Cost monitoring is your dominant concern',
      'You want minimal integration overhead',
      'You\'re self-hosting or vendor-independent',
      'Lightweight observability is enough',
    ],
    whenNotToUse: [
      'You need rich eval / regression detection',
      'You want a full development platform, not just observability',
    ],
    pricing: 'Free self-hosted; managed tier has subscription + usage',
    stackAlignment: 'Vendor-neutral (proxy)',
  },
  {
    id: 'braintrust',
    label: 'Braintrust',
    shortLabel: 'Braintrust',
    category: 'eval-platform',
    philosophy: 'Eval-first LLM platform — built for engineering teams that treat eval as core development.',
    description:
      'Evaluation-first LLM platform. Strong eval pipelines, regression detection, prompt experimentation, A/B testing. Designed for engineering teams running rigorous eval-driven development. Steeper learning curve; rewards investment.',
    strengths: [
      'Rigorous eval pipelines',
      'Strong regression detection',
      'A/B testing built-in',
      'Engineering-team focused',
      'Prompt experimentation workflow',
    ],
    weaknesses: [
      'Steeper learning curve',
      'Requires eval discipline to use well',
      'Less useful for teams without an eval culture',
    ],
    whenToUse: [
      'Your team runs rigorous evals as part of development',
      'You need regression detection on every change',
      'A/B testing across prompts / models is central',
      'Eval discipline is a strategic priority',
    ],
    whenNotToUse: [
      'Your team doesn\'t have eval culture yet',
      'You want lightweight observability without rigor',
      'You\'re just getting started',
    ],
    pricing: 'Subscription + usage; enterprise tier',
    stackAlignment: 'Vendor-neutral (SDK-based)',
  },
  {
    id: 'anthropic-eval',
    label: 'Anthropic evaluation tooling',
    shortLabel: 'Anthropic eval',
    category: 'vendor-tooling',
    philosophy: 'Integrated evaluation within Anthropic\'s Console — best for Anthropic-native deployments.',
    description:
      'Anthropic\'s integrated evaluation tooling within the Console. Evaluation playgrounds, prompt comparison, safety tooling. Tight integration with Claude models; safety-aware. Less of a standalone platform — more a complement to Anthropic-specific workflows.',
    strengths: [
      'Tight integration with Claude models',
      'Safety-aware (Anthropic\'s safety framing built in)',
      'Prompt comparison in the Console',
      'No extra infrastructure required',
    ],
    weaknesses: [
      'Anthropic-specific',
      'Less feature-rich than dedicated platforms',
      'Not a full observability stack',
    ],
    whenToUse: [
      'You\'re Anthropic-native (Claude-only)',
      'You want safety-aware evaluation tooling',
      'You don\'t want extra observability infrastructure',
    ],
    whenNotToUse: [
      'You use multiple model vendors',
      'You need a full observability stack',
      'You require regression detection workflows',
    ],
    pricing: 'Included with Anthropic API usage',
    stackAlignment: 'Anthropic / Claude',
  },
  {
    id: 'opentelemetry',
    label: 'OpenTelemetry GenAI conventions',
    shortLabel: 'OpenTelemetry',
    category: 'standard',
    philosophy: 'Open standard for LLM trace data — vendor-neutral, future-proof, requires manual instrumentation.',
    description:
      'Open-source semantic conventions for LLM trace data (span attributes for model name, token counts, costs). The convergence point most platforms now adopt. Vendor-neutral; future-proof. Requires manual instrumentation but works across any observability backend (Datadog, Honeycomb, Jaeger, Tempo).',
    strengths: [
      'Vendor-neutral (no lock-in)',
      'Works with existing observability stacks (Datadog, Honeycomb, etc.)',
      'Future-proof — the convergence standard',
      'Open-source',
      'Tracing standard across non-LLM systems too',
    ],
    weaknesses: [
      'Requires manual instrumentation',
      'No native UI — needs a backend',
      'Eval pipelines are separate',
      'Steeper engineering investment',
    ],
    whenToUse: [
      'Vendor independence is a hard requirement',
      'You already have an observability stack (Datadog, Honeycomb)',
      'You want to future-proof against framework churn',
      'Your team has strong observability engineering',
    ],
    whenNotToUse: [
      'You want a turnkey platform',
      'You don\'t have engineering bandwidth for instrumentation',
      'You need integrated eval pipelines',
    ],
    pricing: 'Free (standard) + cost of your observability backend',
    stackAlignment: 'Vendor-neutral (any backend)',
  },
  {
    id: 'custom',
    label: 'Custom code',
    shortLabel: 'Custom',
    category: 'custom',
    philosophy: 'Hand-rolled logging + database — best when surface area is small and lock-in is unacceptable.',
    description:
      'Roll your own observability: structured logs to a database (Postgres, ClickHouse) with custom dashboards. Common for small teams, simple workloads, or environments where commercial frameworks aren\'t a fit. No external dependencies; full control; engineering cost is high.',
    strengths: [
      'No vendor lock-in whatsoever',
      'Full control over data + retention',
      'Works in environments where SaaS isn\'t viable',
      'No subscription costs',
    ],
    weaknesses: [
      'Significant engineering investment',
      'Maintenance burden grows with feature requests',
      'Slower to ship than using a platform',
      'Easy to underestimate — observability is harder than it looks',
    ],
    whenToUse: [
      'You\'re small with simple workload',
      'You can\'t use SaaS (regulated industry, air-gapped, etc.)',
      'Lock-in is unacceptable and you have engineering bandwidth',
    ],
    whenNotToUse: [
      'You\'re trying to ship fast',
      'Your team is small without observability expertise',
      'A commercial framework would work fine',
    ],
    pricing: 'Engineering time + your database costs',
    stackAlignment: 'Whatever you build',
  },
];


/** Category color mapping. */
export const CATEGORY_COLORS: Record<FrameworkCategory, string> = {
  'platform':       'var(--cyan-400)',
  'proxy':          'var(--emerald-400)',
  'eval-platform':  'var(--violet-400)',
  'vendor-tooling': 'var(--amber-400)',
  'standard':       'var(--rose-400)',
  'custom':         'var(--text-secondary)',
};

export const CATEGORY_LABELS: Record<FrameworkCategory, string> = {
  'platform':       'platform',
  'proxy':          'proxy / cost-focused',
  'eval-platform':  'eval-first platform',
  'vendor-tooling': 'vendor-native tooling',
  'standard':       'open standard',
  'custom':         'custom code',
};


/* ──────────────────────────────────────────────────────────────────────────
 * Recommendation logic
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * Inputs:
 *   - usesLangChain:    'yes' | 'no' | 'unknown'
 *   - costSensitivity:  'high' | 'medium' | 'low'
 *   - evalDiscipline:   'high' | 'medium' | 'low'
 *   - vendorIndependent: boolean
 *
 * Output: ordered list of (framework_id, score, reasoning) — best first.
 * The widget shows the top recommendation prominently and the runners-up below.
 */

export type LangChainAnswer = 'yes' | 'no' | 'unknown';
export type Sensitivity = 'high' | 'medium' | 'low';

export interface PickerInputs {
  usesLangChain: LangChainAnswer;
  costSensitivity: Sensitivity;
  evalDiscipline: Sensitivity;
  vendorIndependent: boolean;
}

export interface Recommendation {
  frameworkId: string;
  score: number;
  reasoning: string[];
}

export function recommend(inputs: PickerInputs): Recommendation[] {
  const scores: Record<string, { score: number; reasons: string[] }> = {
    'langsmith':      { score: 0, reasons: [] },
    'helicone':       { score: 0, reasons: [] },
    'braintrust':     { score: 0, reasons: [] },
    'anthropic-eval': { score: 0, reasons: [] },
    'opentelemetry':  { score: 0, reasons: [] },
    'custom':         { score: 0, reasons: [] },
  };

  // LangChain stack — strong signal for LangSmith
  if (inputs.usesLangChain === 'yes') {
    scores['langsmith']!.score += 4;
    scores['langsmith']!.reasons.push('LangChain stack — LangSmith is the most-aligned option');
  } else if (inputs.usesLangChain === 'no') {
    scores['langsmith']!.score -= 1;
    scores['langsmith']!.reasons.push('Not on LangChain — LangSmith\'s value drops outside that ecosystem');
  }

  // Cost sensitivity
  if (inputs.costSensitivity === 'high') {
    scores['helicone']!.score += 3;
    scores['helicone']!.reasons.push('High cost sensitivity — Helicone\'s cost tracking is first-class');
    scores['custom']!.score += 2;
    scores['custom']!.reasons.push('High cost sensitivity — custom code avoids subscription fees');
    scores['langsmith']!.score -= 1;
    scores['braintrust']!.score -= 1;
  } else if (inputs.costSensitivity === 'low') {
    scores['braintrust']!.score += 1;
    scores['langsmith']!.score += 1;
  }

  // Eval discipline
  if (inputs.evalDiscipline === 'high') {
    scores['braintrust']!.score += 4;
    scores['braintrust']!.reasons.push('High eval discipline — Braintrust\'s eval-first design rewards this');
    scores['langsmith']!.score += 2;
    scores['langsmith']!.reasons.push('Strong eval discipline — LangSmith has solid eval pipelines too');
  } else if (inputs.evalDiscipline === 'low') {
    scores['braintrust']!.score -= 2;
    scores['braintrust']!.reasons.push('Low eval discipline — Braintrust requires eval investment');
    scores['helicone']!.score += 1;
    scores['anthropic-eval']!.score += 1;
  }

  // Vendor independence
  if (inputs.vendorIndependent) {
    scores['opentelemetry']!.score += 4;
    scores['opentelemetry']!.reasons.push('Vendor independence required — OpenTelemetry is the open standard');
    scores['helicone']!.score += 2;
    scores['helicone']!.reasons.push('Vendor independence — Helicone is open-source and self-hostable');
    scores['custom']!.score += 2;
    scores['custom']!.reasons.push('Vendor independence — custom code maximizes control');
    scores['langsmith']!.score -= 2;
    scores['anthropic-eval']!.score -= 2;
    scores['braintrust']!.score -= 1;
  } else {
    scores['langsmith']!.score += 1;
    scores['anthropic-eval']!.score += 1;
  }

  // Convert to sorted array
  const sorted = Object.entries(scores)
    .map(([id, { score, reasons }]) => ({ frameworkId: id, score, reasoning: reasons }))
    .sort((a, b) => b.score - a.score);

  return sorted;
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 1040

┌────────────────────────────────────────────────────────────────┐
│ Framework picker                                                  │
│ Toggle inputs to see recommended framework with reasoning        │
│                                                                  │
│ Tell us your situation:                                          │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Existing LangChain / LangGraph stack?                        │ │
│ │   [ Yes ] [ No ] [ Unknown ]                                  │ │
│ │                                                                │ │
│ │ Cost sensitivity:                                              │ │
│ │   [ High ] [ Medium ] [ Low ]                                 │ │
│ │                                                                │ │
│ │ Team eval discipline:                                          │ │
│ │   [ High ] [ Medium ] [ Low ]                                 │ │
│ │                                                                │ │
│ │ Vendor independence required?                                  │ │
│ │   [ Yes ] [ No ]                                              │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ▶ TOP RECOMMENDATION                                          │ │
│ │                                                                │ │
│ │ LANGSMITH                                       eval-platform │ │
│ │ Score: 6                                                       │ │
│ │                                                                │ │
│ │ Why:                                                           │ │
│ │  ✓ LangChain stack — LangSmith is the most-aligned option    │ │
│ │  ✓ Strong eval discipline — LangSmith has solid eval...      │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Runners-up:                                                      │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Braintrust          score: 4   eval-first platform           │ │
│ │ OpenTelemetry       score: 2   open standard                  │ │
│ │ Helicone            score: 0   proxy / cost-focused           │ │
│ │ ...                                                             │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ All frameworks (click for detail):                              │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ▶ LangSmith                                  [cyan dot]      │ │
│ │ ▶ Helicone                                  [emerald dot]   │ │
│ │ ▶ Braintrust                                [violet dot]    │ │
│ │ ▶ Anthropic eval                            [amber dot]     │ │
│ │ ▶ OpenTelemetry                             [rose dot]      │ │
│ │ ▶ Custom code                               [neutral dot]   │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ (Expanded framework detail when clicked)                         │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ LANGSMITH                                                     │ │
│ │ Philosophy: End-to-end LLM application observability...      │ │
│ │ Description: ...                                              │ │
│ │ Strengths        Weaknesses                                  │ │
│ │  ✓ Tight LangChain...    ✗ Opinionated...                   │ │
│ │ When to use      When NOT to use                              │ │
│ │  ✓ ...                   ✗ ...                                │ │
│ │ Pricing: Subscription + per-trace; free tier                 │ │
│ │ Stack alignment: LangChain / LangGraph                       │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Pedagogical caption                                              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Toggle inputs → recommendations re-compute instantly
- Top recommendation prominently displayed with reasoning
- Runners-up shown below with score and category
- Click any framework in the directory → expand its detail panel
- Multiple frameworks can be expanded simultaneously

**Visual encoding:**
- **Input toggles**: 3-button segmented controls; active in cyan
- **Top recommendation panel**: bordered with cyan; large title; reasoning list with green checkmarks
- **Runners-up list**: compact rows with score; framework name; category dot + label
- **Framework directory**: 6 cards; clickable expandable; category dot
- **Detail panel**: opens within card; strengths emerald ✓; weaknesses rose ✗; when-to-use cyan ✓; when-NOT-to-use rose ✗

### 3. `FrameworkPicker.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  FRAMEWORKS, CATEGORY_COLORS, CATEGORY_LABELS, recommend,
  type Framework, type PickerInputs,
  type LangChainAnswer, type Sensitivity,
} from './framework-data';
import styles from './FrameworkPicker.module.css';


function SegmentedControl<T extends string>(props: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.segmented}>
      {props.options.map(o => (
        <button
          key={o.value}
          className={`${styles.segmentedOption} ${props.value === o.value ? styles.segmentedOptionActive : ''}`}
          onClick={() => props.onChange(o.value)}
        >{o.label}</button>
      ))}
    </div>
  );
}


function FrameworkDetailPanel({ framework, isExpanded, onToggle }: {
  framework: Framework;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = CATEGORY_COLORS[framework.category];
  
  return (
    <div className={`${styles.frameworkCard} ${isExpanded ? styles.frameworkCardExpanded : ''}`}>
      <button className={styles.frameworkHeader} onClick={onToggle}>
        <span className={styles.frameworkChevron}>{isExpanded ? '▼' : '▶'}</span>
        <span
          className={styles.categoryDot}
          style={{ background: color }}
        />
        <span className={styles.frameworkName}>{framework.label}</span>
        <span className={styles.frameworkCategoryInline}>{CATEGORY_LABELS[framework.category]}</span>
      </button>
      
      {isExpanded && (
        <div className={styles.frameworkDetail}>
          <div className={styles.philosophyBox}>
            <strong>Philosophy:</strong> {framework.philosophy}
          </div>
          
          <div className={styles.descriptionText}>{framework.description}</div>
          
          <div className={styles.twoColGrid}>
            <div className={styles.column}>
              <div className={styles.colHeader}>✓ Strengths</div>
              <ul className={`${styles.detailList} ${styles.listEmerald}`}>
                {framework.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className={styles.column}>
              <div className={styles.colHeader}>✗ Weaknesses</div>
              <ul className={`${styles.detailList} ${styles.listRose}`}>
                {framework.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
          
          <div className={styles.twoColGrid}>
            <div className={styles.column}>
              <div className={styles.colHeader}>When to use</div>
              <ul className={`${styles.detailList} ${styles.listCyan}`}>
                {framework.whenToUse.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
            <div className={styles.column}>
              <div className={styles.colHeader}>When NOT to use</div>
              <ul className={`${styles.detailList} ${styles.listRose}`}>
                {framework.whenNotToUse.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
          </div>
          
          <div className={styles.metaFooter}>
            <div><strong>Pricing:</strong> {framework.pricing}</div>
            <div><strong>Stack alignment:</strong> {framework.stackAlignment}</div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function FrameworkPicker() {
  const [inputs, setInputs] = useState<PickerInputs>({
    usesLangChain: 'unknown',
    costSensitivity: 'medium',
    evalDiscipline: 'medium',
    vendorIndependent: false,
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const recommendations = useMemo(() => recommend(inputs), [inputs]);
  const top = recommendations[0]!;
  const runners = recommendations.slice(1, 4);
  const topFramework = FRAMEWORKS.find(f => f.id === top.frameworkId)!;
  
  function toggle(id: string) {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  }

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Framework picker</div>
        <div className={styles.titleSubLabel}>
          Toggle inputs · see recommended framework with reasoning
        </div>
      </div>

      {/* Inputs */}
      <div className={styles.inputsPanel}>
        <div className={styles.inputRow}>
          <span className={styles.inputLabel}>Existing LangChain / LangGraph stack?</span>
          <SegmentedControl<LangChainAnswer>
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'unknown', label: 'Unknown' },
            ]}
            value={inputs.usesLangChain}
            onChange={v => setInputs({ ...inputs, usesLangChain: v })}
          />
        </div>
        
        <div className={styles.inputRow}>
          <span className={styles.inputLabel}>Cost sensitivity:</span>
          <SegmentedControl<Sensitivity>
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            value={inputs.costSensitivity}
            onChange={v => setInputs({ ...inputs, costSensitivity: v })}
          />
        </div>
        
        <div className={styles.inputRow}>
          <span className={styles.inputLabel}>Team eval discipline:</span>
          <SegmentedControl<Sensitivity>
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            value={inputs.evalDiscipline}
            onChange={v => setInputs({ ...inputs, evalDiscipline: v })}
          />
        </div>
        
        <div className={styles.inputRow}>
          <span className={styles.inputLabel}>Vendor independence required?</span>
          <SegmentedControl<'yes' | 'no'>
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={inputs.vendorIndependent ? 'yes' : 'no'}
            onChange={v => setInputs({ ...inputs, vendorIndependent: v === 'yes' })}
          />
        </div>
      </div>

      {/* Top recommendation */}
      <div className={styles.topRecommendation}>
        <div className={styles.topRecHeader}>
          <span className={styles.topRecBadge}>▶ Top recommendation</span>
          <span className={styles.topRecScore}>Score: {top.score}</span>
        </div>
        
        <div className={styles.topRecFramework}>
          <div className={styles.topRecTitle}>{topFramework.label.toUpperCase()}</div>
          <div
            className={styles.topRecCategory}
            style={{
              background: `color-mix(in srgb, ${CATEGORY_COLORS[topFramework.category]} 18%, transparent)`,
              color: CATEGORY_COLORS[topFramework.category],
              borderColor: `color-mix(in srgb, ${CATEGORY_COLORS[topFramework.category]} 40%, transparent)`,
            }}
          >{CATEGORY_LABELS[topFramework.category]}</div>
        </div>
        
        <div className={styles.topRecPhilosophy}>{topFramework.philosophy}</div>
        
        {top.reasoning.length > 0 && (
          <div className={styles.reasoningPanel}>
            <div className={styles.sectionLabel}>Why this recommendation</div>
            <ul className={styles.reasoningList}>
              {top.reasoning.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
        
        {top.reasoning.length === 0 && (
          <div className={styles.neutralNote}>
            Your inputs don't strongly prefer one framework. Try adjusting them or
            explore the directory below.
          </div>
        )}
      </div>

      {/* Runners-up */}
      {runners.length > 0 && runners.some(r => r.score > 0) && (
        <div className={styles.runnersPanel}>
          <div className={styles.sectionLabel}>Runners-up</div>
          <table className={styles.runnersTable}>
            <tbody>
              {runners.map(r => {
                const fw = FRAMEWORKS.find(f => f.id === r.frameworkId)!;
                return (
                  <tr key={r.frameworkId}>
                    <td>{fw.label}</td>
                    <td>
                      <span
                        className={styles.categoryDot}
                        style={{ background: CATEGORY_COLORS[fw.category] }}
                      />
                      <span className={styles.runnerCategory}>{CATEGORY_LABELS[fw.category]}</span>
                    </td>
                    <td className={styles.runnerScore}>{r.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* All frameworks directory */}
      <div className={styles.directoryPanel}>
        <div className={styles.sectionLabel}>All frameworks (click for detail)</div>
        <div className={styles.frameworkList}>
          {FRAMEWORKS.map(fw => (
            <FrameworkDetailPanel
              key={fw.id}
              framework={fw}
              isExpanded={expandedIds.has(fw.id)}
              onToggle={() => toggle(fw.id)}
            />
          ))}
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        <strong>No framework is universally best.</strong> LangSmith excels on LangChain stacks;
        Helicone wins when cost monitoring is the dominant concern; Braintrust shines for eval-driven
        teams; Anthropic's tooling is best for Anthropic-native deployments; OpenTelemetry is the
        future-proof open standard; <strong>custom code wins when surface area is small</strong> and
        lock-in is unacceptable. <strong>The right framework is the one your team will actually
        use</strong> — feature overload often correlates with under-adoption. <strong>Most production
        systems</strong> use one framework as scaffolding plus custom logic. <strong>The framework is
        plumbing</strong>, not the system. Treat it accordingly.
      </div>
    </div>
  );
}
```

### 4. `FrameworkPicker.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .inputsPanel, .topRecommendation, .runnersPanel, .directoryPanel, .caption {
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

/* Inputs */
.inputRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0;
  border-bottom: 1px dashed var(--border-subtle);
  flex-wrap: wrap;
  gap: 0.5rem;
}
.inputRow:last-child { border-bottom: none; }
.inputLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  flex: 1;
  min-width: 200px;
}

/* Segmented control */
.segmented {
  display: inline-flex;
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.segmentedOption {
  padding: 0.35rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-right: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 200ms;
}
.segmentedOption:last-child { border-right: none; }
.segmentedOption:hover { color: var(--cyan-300); }
.segmentedOptionActive {
  background: color-mix(in srgb, var(--cyan-500) 16%, transparent);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Top recommendation */
.topRecommendation {
  border: 1.5px solid var(--cyan-500);
  background: color-mix(in srgb, var(--cyan-500) 6%, var(--bg-elevated));
}
.topRecHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.topRecBadge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--cyan-300);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.topRecScore {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.topRecFramework {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.topRecTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.04em;
}
.topRecCategory {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1px solid;
  text-transform: lowercase;
}
.topRecPhilosophy {
  font-size: 0.86rem;
  color: var(--text-primary);
  line-height: 1.55;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.7rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--cyan-400);
}

.reasoningPanel { margin-top: 0.5rem; }
.reasoningList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.reasoningList li {
  font-size: 0.82rem;
  color: var(--text-primary);
  padding: 0.35rem 0.6rem 0.35rem 1.6rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  position: relative;
  line-height: 1.45;
}
.reasoningList li::before {
  content: '✓';
  position: absolute;
  left: 0.6rem;
  color: var(--emerald-400);
  font-weight: 700;
}

.neutralNote {
  font-size: 0.82rem;
  font-style: italic;
  color: var(--text-tertiary);
  padding: 0.5rem 0.7rem;
}

/* Section label */
.sectionLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
  font-weight: 500;
}

/* Runners-up table */
.runnersTable {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
}
.runnersTable td {
  padding: 0.45rem 0.6rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
}
.runnersTable tr:last-child td { border-bottom: none; }
.runnerCategory { color: var(--text-secondary); }
.runnerScore {
  text-align: right;
  font-weight: 600;
  color: var(--cyan-300);
}

/* Framework directory */
.frameworkList { display: flex; flex-direction: column; gap: 0.4rem; }
.frameworkCard {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
  transition: border-color 200ms;
}
.frameworkCard:hover { border-color: var(--border-default); }
.frameworkCardExpanded {
  border-color: var(--cyan-500);
  background: color-mix(in srgb, var(--cyan-500) 3%, var(--bg-primary));
}
.frameworkHeader {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.84rem;
  color: var(--text-primary);
}
.frameworkChevron {
  color: var(--text-tertiary);
  font-size: 0.7rem;
  width: 0.8rem;
  display: inline-block;
}
.categoryDot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.frameworkName {
  flex: 1;
  font-weight: 500;
}
.frameworkCategoryInline {
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

.frameworkDetail {
  padding: 0.6rem 0.9rem 0.85rem 0.9rem;
  border-top: 1px solid var(--border-subtle);
}

.philosophyBox {
  font-size: 0.84rem;
  color: var(--text-primary);
  padding: 0.45rem 0.6rem;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--cyan-400);
  margin-bottom: 0.55rem;
  line-height: 1.5;
}
.philosophyBox strong { color: var(--cyan-300); }

.descriptionText {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin-bottom: 0.7rem;
}

.twoColGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
}
.column {
  padding: 0.5rem 0.65rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.colHeader {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
  font-weight: 500;
}
.detailList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.detailList li {
  font-size: 0.78rem;
  padding-left: 1.1rem;
  position: relative;
  line-height: 1.45;
  color: var(--text-primary);
}
.listEmerald li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--emerald-400);
  font-weight: 700;
}
.listCyan li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--cyan-400);
  font-weight: 700;
}
.listRose li::before {
  content: '✗';
  position: absolute;
  left: 0;
  color: var(--rose-400);
  font-weight: 700;
}

.metaFooter {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-subtle);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-secondary);
}
.metaFooter strong { color: var(--text-primary); }

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .inputRow { flex-direction: column; align-items: flex-start; }
  .inputLabel { min-width: 0; }
  .twoColGrid { grid-template-columns: 1fr; }
  .topRecFramework { flex-direction: column; align-items: flex-start; }
  .topRecTitle { font-size: 1rem; }
  .runnersTable { font-size: 0.7rem; }
  .runnersTable td { padding: 0.35rem 0.4rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as AgentBenchmarkExplorer } from './ch30-agent-eval-and-frameworks/AgentBenchmarkExplorer';
export { default as FrameworkPicker }       from './ch30-agent-eval-and-frameworks/FrameworkPicker';
```

### 6. Update `src/pages/ch30-agent-eval-and-frameworks/index.mdx`

**Edit A: Update widget import:**

```mdx
import { AgentBenchmarkExplorer, FrameworkPicker } from '@components/widgets';
```

**Edit B: Replace section-5's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="Framework picker" caption="Toggle four task characteristics (existing LangChain stack, cost sensitivity, team eval discipline, vendor independence) and see a recommended framework with explicit reasoning. Six frameworks are always visible — LangSmith, Helicone, Braintrust, Anthropic eval tooling, OpenTelemetry GenAI, and custom code — with strengths, weaknesses, and when-to-use guidance for each. The chapter's framework-as-plumbing framing made interactive.">
  <FrameworkPicker client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 5 of Ch 30** renders with the working widget. Section 2's marquee 1 still renders correctly.
3. **Default inputs**: usesLangChain='unknown', costSensitivity='medium', evalDiscipline='medium', vendorIndependent=false.
4. **Default state produces a neutral recommendation** with low scores (LangSmith or similar with score ≤ 2).
5. **Toggling inputs updates the recommendation panel immediately** (no submit button).
6. **Top recommendation panel**: cyan-bordered; shows framework label, category badge, philosophy, and reasoning bullets (each prefixed with emerald ✓).
7. **Runners-up table**: 3 next-best frameworks shown with score + category.
8. **Framework directory**: 6 cards, collapsible by default; expanded card shows philosophy + description + 2-column strengths/weaknesses + 2-column when-to-use/when-NOT-to-use + pricing + stack alignment.
9. **Category colors**: platform (cyan), proxy (emerald), eval-platform (violet), vendor-tooling (amber), standard (rose), custom (neutral).
10. **Multiple cards can be expanded simultaneously**.
11. **Test cases**:
    - usesLangChain=yes + evalDiscipline=high → LangSmith should rank #1
    - costSensitivity=high + vendorIndependent=yes → Helicone or custom should rank #1
    - vendorIndependent=yes (alone) → OpenTelemetry should rank near top
    - evalDiscipline=high + costSensitivity=low → Braintrust should rank #1
12. **Mobile** (< 720px): segmented controls stack; 2-col grids become 1-col; framework cards remain legible.
13. **`npm run typecheck`** passes.
14. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not include frameworks beyond the 6 specified**. (Phoenix, Arize, OpenLLMetry, etc. are out of scope to keep the catalog focused.)
- ❌ **Do not include real-time pricing or live data**. The pricing strings are informational only.
- ❌ **Do not include link-outs to vendor sites**. The widget is self-contained.
- ❌ **Do not animate the recommendation transitions**. Plain re-render is fine.
- ❌ **Do not flip Ch 30's status**. Session 171 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch30-agent-eval-and-frameworks/ src/components/widgets/index.ts src/pages/ch30-agent-eval-and-frameworks/index.mdx
git commit -m "session 130: framework picker marquee 2 — 6 frameworks with interactive recommendation logic"
git push origin main
```

---

## Notes for the session author

**On the 6 frameworks spanning the observability landscape**:

| Framework | Category | Best for |
|-----------|----------|----------|
| **LangSmith** | platform | LangChain/LangGraph stacks |
| **Helicone** | proxy | Cost-focused, lightweight |
| **Braintrust** | eval-platform | Eval-driven teams |
| **Anthropic eval tooling** | vendor-tooling | Anthropic-native |
| **OpenTelemetry GenAI** | standard | Vendor independence |
| **Custom code** | custom | Small surface, lock-in unacceptable |

Notes-for-author: "**The 6 frameworks deliberately span the spectrum** from feature-rich platforms (LangSmith) to bare-minimum standards (OpenTelemetry) to roll-your-own (custom code). **Reader sees that 'framework' includes everything from SaaS platforms to open standards to no-framework-at-all.**"

**On the recommendation logic being deliberately simple**:
The scoring is heuristic (add/subtract points based on inputs). Notes-for-author: "**The recommendation engine is intentionally not sophisticated.** It's a calibration tool, not an oracle. Reader sees that different inputs produce different recommendations — the point is that framework choice depends on context, not that the widget knows the right answer."

**On the input set being deliberately small (4 factors)**:
Could include more (team size, complexity, regulatory constraints, etc.) but 4 is enough to demonstrate the principle. Notes-for-author: "**More inputs would feel comprehensive but obscure the lesson**: that a few key factors drive framework choice. **Stack alignment, cost sensitivity, eval discipline, and vendor independence are the most decisive factors.**"

**On the framework directory being the persistent reference**:
All 6 frameworks always visible; expandable for detail. Notes-for-author: "**The directory is the reference card.** Reader who already knows what they want skips the recommender and goes straight to the directory. **The widget supports both 'tell me' and 'I already know' workflows.**"

**On strengths/weaknesses being honest**:
Every framework gets concrete weaknesses, including the popular ones. LangSmith's weakness: 'Opinionated — assumes LangChain conventions.' OpenTelemetry's weakness: 'Requires manual instrumentation.' Notes-for-author: "**Honest tradeoffs are the calibration tool.** No framework is universally best; every framework has real downsides. Reader who internalizes this leaves with calibration that takes engineering teams months to build."

**On the cyan-bordered top recommendation panel**:
Visually distinct from the rest of the widget. Notes-for-author: "**The cyan border draws the eye to the recommendation** — but the reasoning bullets matter more than the framework name. Reader should leave knowing WHY a framework was recommended, not just which."

**On custom code being included as an option**:
Most observability-platform comparison articles omit it. **This widget includes it** because it's a real choice for some teams. Notes-for-author: "**Including custom code in the catalog is a calibration choice.** It tells the reader: SaaS platforms aren't the only path; for some contexts (regulated, small, locked-in-unacceptable), custom is the right answer."

**On the chapter's framework-as-plumbing framing made interactive**:
The caption explicitly says "The framework is plumbing, not the system. Treat it accordingly." Notes-for-author: "**The widget's lesson aligns with the chapter's framing.** Framework choice is engineering judgment — based on team, stack, and needs — not a contest of features. **'The right framework is the one your team will actually use' is the chapter's calibration claim, made interactive.**"

**On test cases as acceptance criteria**:
4 specific input combinations are listed with expected top recommendations. Notes-for-author: "**The test cases verify the recommendation engine works as designed.** They also document the heuristic's reasoning. **Reader who reads the source code learns the framework-choice heuristic explicitly.**"

**Pedagogical claim this widget supports:**
"**Production observability frameworks are tools, not solutions.** Six options span the landscape: feature-rich platforms (LangSmith, Braintrust), cost-focused proxies (Helicone), vendor-native tooling (Anthropic), open standards (OpenTelemetry), and custom code. **The right choice depends on stack alignment, cost sensitivity, eval discipline, and vendor independence requirements** — not on feature checklists. **No framework is universally best.** The widget makes this calibration concrete: same problem (build observability), different recommendations depending on context. **The framework is plumbing, not the system.**"

After 60 seconds of interaction (toggling 2-3 input combinations and exploring 2-3 framework details), the reader has internalized: (a) 6 observability options and what each is designed for; (b) the 4 decision factors that determine framework choice; (c) the chapter's framework-as-plumbing framing; (d) honest strengths/weaknesses for every option, including the popular ones.

**This is Ch 30's second central visualization — and the curriculum's final widget.** Build with care.
