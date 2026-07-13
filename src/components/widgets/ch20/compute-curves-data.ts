export type Difficulty = 'easy' | 'medium' | 'hard';

export type TechniqueId =
  | 'direct'
  | 'zero-shot-cot'
  | 'self-consistency'
  | 'best-of-n-prm'
  | 'tree-of-thoughts'
  | 'modern-reasoning';

export interface TechniqueSpec {
  id: TechniqueId;
  label: string;
  shortLabel: string;
  color: 'gray' | 'amber' | 'cyan' | 'emerald' | 'violet' | 'cyan-bright';
  description: string;
}

export const TECHNIQUES: TechniqueSpec[] = [
  {
    id: 'direct',
    label: 'Direct generation',
    shortLabel: 'Direct',
    color: 'gray',
    description: 'Single forward pass; baseline.',
  },
  {
    id: 'zero-shot-cot',
    label: 'Zero-shot CoT',
    shortLabel: 'CoT',
    color: 'amber',
    description: '"Let\'s think step by step." Same model, longer trace.',
  },
  {
    id: 'self-consistency',
    label: 'Self-consistency',
    shortLabel: 'Self-cons.',
    color: 'cyan',
    description: 'N independent CoT traces; majority vote.',
  },
  {
    id: 'best-of-n-prm',
    label: 'Best-of-N + PRM',
    shortLabel: 'BoN+PRM',
    color: 'emerald',
    description: 'N traces, scored by a process reward model.',
  },
  {
    id: 'tree-of-thoughts',
    label: 'Tree-of-thoughts',
    shortLabel: 'ToT',
    color: 'violet',
    description: 'Search over reasoning paths with backtracking.',
  },
  {
    id: 'modern-reasoning',
    label: 'Modern reasoning model (o1, R1)',
    shortLabel: 'Reasoning',
    color: 'cyan-bright',
    description: 'RLVR-trained; emits long internal reasoning autonomously.',
  },
];

export const COMPUTE_LEVELS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

export interface CurvePoint {
  compute: number;
  accuracy: number;
  defined: boolean;
}

export type DifficultyProfile = {
  baseline: number;
  cotMultiplier: number;
  asymptote: { [K in TechniqueId]: number };
  steepness: { [K in TechniqueId]: number };
};

const PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: {
    baseline: 75,
    cotMultiplier: 1.18,
    asymptote: {
      'direct': 75,
      'zero-shot-cot': 89,
      'self-consistency': 94,
      'best-of-n-prm': 96,
      'tree-of-thoughts': 95,
      'modern-reasoning': 97,
    },
    steepness: {
      'direct': 0,
      'zero-shot-cot': 0,
      'self-consistency': 1.4,
      'best-of-n-prm': 1.6,
      'tree-of-thoughts': 1.1,
      'modern-reasoning': 1.8,
    },
  },
  medium: {
    baseline: 42,
    cotMultiplier: 1.55,
    asymptote: {
      'direct': 42,
      'zero-shot-cot': 65,
      'self-consistency': 78,
      'best-of-n-prm': 84,
      'tree-of-thoughts': 80,
      'modern-reasoning': 91,
    },
    steepness: {
      'direct': 0,
      'zero-shot-cot': 0,
      'self-consistency': 0.9,
      'best-of-n-prm': 1.0,
      'tree-of-thoughts': 0.7,
      'modern-reasoning': 1.3,
    },
  },
  hard: {
    baseline: 12,
    cotMultiplier: 2.2,
    asymptote: {
      'direct': 12,
      'zero-shot-cot': 26,
      'self-consistency': 48,
      'best-of-n-prm': 64,
      'tree-of-thoughts': 56,
      'modern-reasoning': 85,
    },
    steepness: {
      'direct': 0,
      'zero-shot-cot': 0,
      'self-consistency': 0.6,
      'best-of-n-prm': 0.7,
      'tree-of-thoughts': 0.5,
      'modern-reasoning': 0.9,
    },
  },
};

function saturating(baseline: number, asymptote: number, compute: number, steepness: number): number {
  if (compute <= 1 || steepness === 0) return baseline;
  const ramp = 1 - Math.exp(-steepness * Math.log10(compute));
  return baseline + (asymptote - baseline) * ramp;
}

function operatingRange(t: TechniqueId): [number, number] {
  switch (t) {
    case 'direct':            return [1, 1];
    case 'zero-shot-cot':     return [1, 2];
    case 'self-consistency':  return [5, 1000];
    case 'best-of-n-prm':     return [5, 1000];
    case 'tree-of-thoughts':  return [10, 1000];
    case 'modern-reasoning':  return [10, 1000];
    default:                  return [1, 1000];
  }
}

export function buildCurve(t: TechniqueId, d: Difficulty): CurvePoint[] {
  const profile = PROFILES[d];
  const [minC, maxC] = operatingRange(t);
  const baseline = profile.baseline;
  const asymptote = profile.asymptote[t];
  const steepness = profile.steepness[t];

  return COMPUTE_LEVELS.map(c => {
    if (c < minC || c > maxC) {
      return { compute: c, accuracy: NaN, defined: false };
    }
    let accuracy: number;
    if (t === 'direct') {
      accuracy = baseline;
    } else if (t === 'zero-shot-cot') {
      accuracy = baseline * profile.cotMultiplier;
    } else {
      accuracy = saturating(baseline, asymptote, c / minC, steepness);
    }
    return { compute: c, accuracy: Math.min(100, accuracy), defined: true };
  });
}

export function buildAllCurves(d: Difficulty): Record<TechniqueId, CurvePoint[]> {
  return Object.fromEntries(
    TECHNIQUES.map(t => [t.id, buildCurve(t.id, d)])
  ) as Record<TechniqueId, CurvePoint[]>;
}

export interface InsightBlock {
  difficulty: Difficulty;
  title: string;
  body: string;
  numbers: string;
}

export function insightFor(d: Difficulty): InsightBlock {
  if (d === 'easy') {
    return {
      difficulty: 'easy',
      title: 'Easy problems plateau quickly',
      body: 'All techniques converge near the ceiling. Extra compute beyond a few × is wasted — the model already knows the answer.',
      numbers: 'Direct: ~75% · Reasoning model at 100×: ~93% — an 18-point gap, mostly closed by simple CoT.',
    };
  }
  if (d === 'medium') {
    return {
      difficulty: 'medium',
      title: 'Medium problems reward modest compute',
      body: 'Self-consistency and best-of-N pay off; tree-of-thoughts and reasoning models keep climbing. Diminishing returns appear above ~100×.',
      numbers: 'Direct: ~42% · Reasoning model at 100×: ~78% — a 36-point gap. CoT alone closes ~23 points.',
    };
  }
  return {
    difficulty: 'hard',
    title: 'Hard problems benefit dramatically',
    body: 'Curves spread widely. Modern reasoning models pull well ahead of every other technique — roughly 20 points past the closest competitor (best-of-N+PRM) and 60+ points past direct generation. Compute scaling is *most* valuable here.',
    numbers: 'Direct: ~12% · Reasoning model at 1000×: ~73% — a 61-point gap. CoT alone only reaches ~26%.',
  };
}
