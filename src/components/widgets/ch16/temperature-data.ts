/**
 * The example: "Paris is the capital of ___"
 * Teacher logits chosen so that France clearly dominates at T=1,
 * with European-capital countries emerging as the second tier at moderate T.
 */
export const EXAMPLE = {
  prompt: 'Paris is the capital of ___',
  candidates: [
    { label: 'France',      logit:  4.0, tier: 'correct' as const },
    { label: 'Spain',       logit:  1.2, tier: 'similar' as const },
    { label: 'Italy',       logit:  0.8, tier: 'similar' as const },
    { label: 'Germany',     logit:  0.5, tier: 'similar' as const },
    { label: 'Belgium',     logit:  0.3, tier: 'similar' as const },
    { label: 'Portugal',    logit:  0.1, tier: 'similar' as const },
    { label: 'Switzerland', logit: -0.2, tier: 'other' as const },
    { label: 'Netherlands', logit: -0.4, tier: 'other' as const },
    { label: 'Austria',     logit: -0.5, tier: 'other' as const },
    { label: 'Greece',      logit: -0.8, tier: 'other' as const },
    { label: 'Denmark',     logit: -1.0, tier: 'other' as const },
    { label: 'Sweden',      logit: -1.2, tier: 'other' as const },
    { label: 'Poland',      logit: -1.5, tier: 'other' as const },
    { label: 'Finland',     logit: -2.0, tier: 'other' as const },
    { label: 'Norway',      logit: -2.5, tier: 'other' as const },
  ],
};

export type Tier = 'correct' | 'similar' | 'other';

/** Stable softmax with temperature. */
export function softmaxWithTemperature(logits: number[], T: number): number[] {
  const scaled = logits.map((z) => z / T);
  const maxLogit = Math.max(...scaled);
  const exps = scaled.map((z) => Math.exp(z - maxLogit));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

const T_MIN = 1;
const T_MAX = 50;
const LOG_MIN = Math.log(T_MIN);
const LOG_MAX = Math.log(T_MAX);

/** Slider goes from 0 to 100; maps to T in [1, 50] on a log scale. */
export function sliderToT(sliderValue: number): number {
  const logT = LOG_MIN + (sliderValue / 100) * (LOG_MAX - LOG_MIN);
  return Math.exp(logT);
}

export function tToSlider(T: number): number {
  return (100 * (Math.log(T) - LOG_MIN)) / (LOG_MAX - LOG_MIN);
}

export type DarkKnowledgeStatus = 'hidden' | 'emerging' | 'visible' | 'fading' | 'lost';

/**
 * Classify the current state based on T.
 * Returns a tag for the dark-knowledge indicator and the insight text.
 */
export function classifyState(T: number): {
  darkKnowledgeStatus: DarkKnowledgeStatus;
  insight: string;
} {
  if (T < 1.5) {
    return {
      darkKnowledgeStatus: 'hidden',
      insight:
        'Standard softmax. The correct class dominates; dark knowledge is hidden in the tail.',
    };
  }
  if (T < 3.5) {
    return {
      darkKnowledgeStatus: 'emerging',
      insight: 'Dark knowledge starting to emerge: non-target classes becoming visible.',
    };
  }
  if (T < 10) {
    return {
      darkKnowledgeStatus: 'visible',
      insight:
        'Dark knowledge clearly visible. Non-target classes show their relative similarity. The standard distillation sweet spot (T = 4-8).',
    };
  }
  if (T < 25) {
    return {
      darkKnowledgeStatus: 'fading',
      insight:
        'Distribution flattening. Signal weakening: the gap between correct and incorrect classes is shrinking.',
    };
  }
  return {
    darkKnowledgeStatus: 'lost',
    insight:
      'Distribution near uniform. Information is being lost: at T → ∞, all classes are equal.',
  };
}
