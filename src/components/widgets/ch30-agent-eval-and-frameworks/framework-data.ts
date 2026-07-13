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
      'Opinionated, assumes LangChain conventions',
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
    philosophy: 'Drop-in LLM proxy with cost tracking and observability: minimal integration overhead.',
    description:
      'Open-source LLM observability proxy. Captures every LLM call via a one-line URL change; tracks cost per request, latency, cache hits, user-level analytics. Lighter-weight than LangSmith; cost-focused. Popular for teams where cost monitoring is the dominant concern.',
    strengths: [
      'One-line integration (URL swap)',
      'Open-source, self-hostable',
      'Cost tracking is first-class',
      'Vendor-neutral (works with any LLM)',
      'Lightweight, small feature surface',
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
    philosophy: 'Eval-first LLM platform, built for engineering teams that treat eval as core development.',
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
    philosophy: 'Integrated evaluation within Anthropic\'s Console, best for Anthropic-native deployments.',
    description:
      'Anthropic\'s integrated evaluation tooling within the Console. Evaluation playgrounds, prompt comparison, safety tooling. Tight integration with Claude models; safety-aware. Less of a standalone platform, more a complement to Anthropic-specific workflows.',
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
    philosophy: 'Open standard for LLM trace data: vendor-neutral, future-proof, requires manual instrumentation.',
    description:
      'Open-source semantic conventions for LLM trace data (span attributes for model name, token counts, costs). The convergence point most platforms now adopt. Vendor-neutral; future-proof. Requires manual instrumentation but works across any observability backend (Datadog, Honeycomb, Jaeger, Tempo).',
    strengths: [
      'Vendor-neutral (no lock-in)',
      'Works with existing observability stacks (Datadog, Honeycomb, etc.)',
      'Future-proof, the convergence standard',
      'Open-source',
      'Tracing standard across non-LLM systems too',
    ],
    weaknesses: [
      'Requires manual instrumentation',
      'No native UI, needs a backend',
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
    philosophy: 'Hand-rolled logging + database, best when surface area is small and lock-in is unacceptable.',
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
      'Easy to underestimate: observability is harder than it looks',
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
    scores['langsmith']!.reasons.push('LangChain stack: LangSmith is the most-aligned option');
  } else if (inputs.usesLangChain === 'no') {
    scores['langsmith']!.score -= 1;
    scores['langsmith']!.reasons.push('Not on LangChain: LangSmith\'s value drops outside that ecosystem');
  }

  // Cost sensitivity
  if (inputs.costSensitivity === 'high') {
    scores['helicone']!.score += 3;
    scores['helicone']!.reasons.push('High cost sensitivity: Helicone\'s cost tracking is first-class');
    scores['custom']!.score += 2;
    scores['custom']!.reasons.push('High cost sensitivity: custom code avoids subscription fees');
    scores['langsmith']!.score -= 1;
    scores['braintrust']!.score -= 1;
  } else if (inputs.costSensitivity === 'low') {
    scores['braintrust']!.score += 1;
    scores['langsmith']!.score += 1;
  }

  // Eval discipline
  if (inputs.evalDiscipline === 'high') {
    scores['braintrust']!.score += 4;
    scores['braintrust']!.reasons.push('High eval discipline: Braintrust\'s eval-first design rewards this');
    scores['langsmith']!.score += 2;
    scores['langsmith']!.reasons.push('Strong eval discipline: LangSmith has solid eval pipelines too');
  } else if (inputs.evalDiscipline === 'low') {
    scores['braintrust']!.score -= 2;
    scores['braintrust']!.reasons.push('Low eval discipline: Braintrust requires eval investment');
    scores['helicone']!.score += 1;
    scores['anthropic-eval']!.score += 1;
  }

  // Vendor independence
  if (inputs.vendorIndependent) {
    scores['opentelemetry']!.score += 4;
    scores['opentelemetry']!.reasons.push('Vendor independence required: OpenTelemetry is the open standard');
    scores['helicone']!.score += 2;
    scores['helicone']!.reasons.push('Vendor independence: Helicone is open-source and self-hostable');
    scores['custom']!.score += 2;
    scores['custom']!.reasons.push('Vendor independence: custom code maximizes control');
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
