/**
 * Five preset scenarios demonstrating LLM-as-judge bias modes.
 *
 * Each scenario hardcodes:
 *  - prompt + two responses
 *  - what a (mocked) judge says under each ordering
 *  - whether swap-mitigation catches the inconsistency
 *  - the bias mode in play (or "none" for the clean case)
 *
 * These are pedagogical — they illustrate documented bias modes from
 * Zheng et al. 2023 ("Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena").
 */

export type BiasMode =
  | 'position'           // Judge favors whichever response is shown first
  | 'verbosity'          // Judge favors the longer response regardless of quality
  | 'self-enhancement'   // Judge prefers responses from its own model family
  | 'coverage'           // Judge misses a factual error it doesn't know
  | 'none';              // Clean case: genuine quality difference

export interface JudgeScenario {
  id: string;
  label: string;
  prompt: string;
  responseA: { author: string; text: string };
  responseB: { author: string; text: string };
  /** Judge verdict when shown as (A, B). */
  verdictAFirst: 'A' | 'B' | 'tie';
  /** Judge verdict when shown as (B, A). */
  verdictBFirst: 'A' | 'B' | 'tie';
  biasMode: BiasMode;
  /** Plain-prose explanation of what the reader is seeing. */
  explanation: string;
  /** What swap-mitigation does for this case (catches the bias or not). */
  mitigationOutcome: string;
}

export const SCENARIOS: JudgeScenario[] = [
  {
    id: 'position-bias',
    label: 'Position bias',
    prompt: 'In three sentences, explain why exercise improves mood.',
    responseA: {
      author: 'Model-A',
      text: 'Exercise releases endorphins, which lift mood. Regular activity also reduces cortisol over time, lowering stress. Finally, the sense of accomplishment from completing a workout supports self-efficacy.',
    },
    responseB: {
      author: 'Model-B',
      text: 'Physical activity triggers endorphin release that produces euphoria. It also reduces stress hormones like cortisol. Completing exercise builds a sense of agency that improves outlook.',
    },
    verdictAFirst: 'A',
    verdictBFirst: 'B',
    biasMode: 'position',
    explanation:
      'Both responses are roughly equivalent in quality and content. The judge picks whichever is shown first, a documented position bias. With genuinely similar responses, position effects can dominate judgment.',
    mitigationOutcome: 'Swap-mitigation CATCHES this: when both orderings are tried, the verdicts disagree (A-first → A wins; B-first → B wins). The mitigated verdict is "tie."',
  },
  {
    id: 'verbosity-bias',
    label: 'Verbosity bias',
    prompt: 'What is the capital of France?',
    responseA: {
      author: 'Model-A',
      text: 'Paris.',
    },
    responseB: {
      author: 'Model-B',
      text: "Paris is the capital and largest city of France, located in the north-central part of the country along the Seine River. It has served as the country's capital since the early Middle Ages and is one of the world's most prominent cultural, political, and economic centers, known for landmarks like the Eiffel Tower, the Louvre, and Notre-Dame Cathedral.",
    },
    verdictAFirst: 'B',
    verdictBFirst: 'B',
    biasMode: 'verbosity',
    explanation:
      'Both responses are correct. Response A is concise and exactly addresses the question. Response B is much longer with additional context the question didn\'t ask for. The judge favors B in both orderings, a documented verbosity bias.',
    mitigationOutcome: 'Swap-mitigation does NOT catch this: both orderings agree on B. The bias is in the judge itself, not the ordering. Mitigation requires rubric-based judging or human calibration that explicitly penalizes excessive verbosity.',
  },
  {
    id: 'self-enhancement',
    label: 'Self-enhancement bias',
    prompt: 'Write a short poem about autumn.',
    responseA: {
      author: 'GPT-style model',
      text: 'Crisp leaves drift down on amber wind,\nThe forest hushes, half resigned.\nWarm breath in air, a wood-smoke trail;\nAutumn writes its own brief tale.',
    },
    responseB: {
      author: 'Claude-style model',
      text: 'October light slants gold through trees,\nA crimson hush across the breeze.\nThe year, half-spent, leans toward sleep;\nThe sky goes still; the shadows deep.',
    },
    verdictAFirst: 'A',
    verdictBFirst: 'A',
    biasMode: 'self-enhancement',
    explanation:
      "Both poems are reasonable quality. The judge (here mocked as a GPT-family model) prefers Response A in both orderings, a documented self-enhancement bias: judges favor outputs from their own model family. This is one of Zheng 2023's most striking findings.",
    mitigationOutcome: 'Swap-mitigation does NOT catch this: the verdict is consistent across orderings, just biased toward the judge\'s family. Mitigation requires multi-judge ensembles, anonymization of model identity, or human-calibrated rubrics.',
  },
  {
    id: 'coverage-bias',
    label: 'Coverage bias',
    prompt: 'Briefly explain why the sky is blue.',
    responseA: {
      author: 'Model-A',
      text: 'The sky appears blue because nitrogen and oxygen molecules in the atmosphere scatter shorter-wavelength blue light more than longer wavelengths. This is called Rayleigh scattering, and it preferentially scatters violet and blue light, with our eyes perceiving the dominant blue.',
    },
    responseB: {
      author: 'Model-B',
      text: 'The sky appears blue because the atmosphere refracts sunlight through a quantum tunneling effect that filters out red wavelengths. Most of the red light is absorbed by ozone in the upper atmosphere, leaving the blue visible to observers below.',
    },
    verdictAFirst: 'tie',
    verdictBFirst: 'tie',
    biasMode: 'coverage',
    explanation:
      'Response A is correct (Rayleigh scattering). Response B is plausibly written but factually wrong (no quantum tunneling, ozone doesn\'t absorb red). The judge, not knowing physics well enough to catch the error, sees two confident, similar-length explanations and calls it a tie. This is coverage bias: the judge\'s knowledge gap masks a real quality difference.',
    mitigationOutcome: 'Swap-mitigation does NOT catch this: both verdicts agree on "tie." The error is the judge\'s own factual gap. Mitigation requires using a stronger judge model, programmatic verification (when possible), or human expert review for technical domains.',
  },
  {
    id: 'clean-case',
    label: 'Genuine quality difference',
    prompt: 'In one sentence: what is a hash function?',
    responseA: {
      author: 'Model-A',
      text: 'A hash function maps input of any size to a fixed-size output, ideally distributing inputs uniformly across the output space and making it computationally hard to invert.',
    },
    responseB: {
      author: 'Model-B',
      text: 'A hash function is something where you put data in and you get other data out.',
    },
    verdictAFirst: 'A',
    verdictBFirst: 'A',
    biasMode: 'none',
    explanation:
      'Response A is a precise, complete one-sentence definition. Response B is vague and unhelpful. The judge correctly picks A in both orderings, there is no bias here, just a genuine quality difference being detected. This is what LLM-as-judge does well: comparing responses with clear quality gaps.',
    mitigationOutcome: 'Swap-mitigation confirms the verdict: both orderings agree on A. The mitigation costs nothing in this case; when the bias modes don\'t fire, swap-mitigation just doubles the inference cost. The point of mitigation is to catch the cases where bias DOES fire, not to defend every judgment.',
  },
];

/** Bias-mode metadata. */
export const BIAS_MODES: Record<BiasMode, { label: string; color: string; mitigationLevel: 'catches' | 'partial' | 'none' }> = {
  position:         { label: 'position bias',         color: 'var(--amber-400)',   mitigationLevel: 'catches' },
  verbosity:        { label: 'verbosity bias',        color: 'var(--violet-400)',  mitigationLevel: 'none' },
  'self-enhancement': { label: 'self-enhancement bias', color: 'var(--rose-400)',  mitigationLevel: 'none' },
  coverage:         { label: 'coverage bias',         color: 'var(--rose-400)',    mitigationLevel: 'none' },
  none:             { label: 'no bias detected',      color: 'var(--emerald-400)', mitigationLevel: 'catches' },
};

/** Compute the swap-mitigated verdict (if both orderings agree, that's the verdict; else 'tie'). */
export function mitigatedVerdict(scenario: JudgeScenario): 'A' | 'B' | 'tie' {
  if (scenario.verdictAFirst === scenario.verdictBFirst) {
    return scenario.verdictAFirst;
  }
  return 'tie';
}
