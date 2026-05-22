// src/components/widgets/ch07/quality-data.ts

export interface QualitySample {
  id: number;
  text: string;
  /** True quality category — for color coding, not algorithm. */
  trueCategory: 'clean' | 'spam' | 'repetitive' | 'short' | 'placeholder' | 'non-english';
  /** Per-filter results (hand-computed for pedagogical clarity). */
  filters: {
    lengthOk: boolean;       // length > 100 chars
    languageOk: boolean;     // > 60% ASCII letters
    repetitionOk: boolean;   // unique/total word ratio > 0.3
  };
  /** Quality classifier score in [0, 1] — higher is better. */
  qualityScore: number;
}

export const SAMPLES: QualitySample[] = [
  {
    id: 1,
    text: "A clear explanation of how photosynthesis converts sunlight into chemical energy used by plants on Earth for survival.",
    trueCategory: 'clean',
    filters: { lengthOk: true, languageOk: true, repetitionOk: true },
    qualityScore: 0.92,
  },
  {
    id: 2,
    text: "Tokyo is the capital of Japan and one of the most populous metropolitan areas in the world, home to over 37 million people.",
    trueCategory: 'clean',
    filters: { lengthOk: true, languageOk: true, repetitionOk: true },
    qualityScore: 0.89,
  },
  {
    id: 3,
    text: "the the the the the the the the the the the the the the the the the the the the the the the the the the the",
    trueCategory: 'repetitive',
    filters: { lengthOk: true, languageOk: true, repetitionOk: false },
    qualityScore: 0.04,
  },
  {
    id: 4,
    text: "buy buy buy BUY click here free shipping BUY NOW act now BUY BUY click here BUY",
    trueCategory: 'spam',
    filters: { lengthOk: false, languageOk: true, repetitionOk: false },   // 78 chars, fails length
    qualityScore: 0.08,
  },
  {
    id: 5,
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    trueCategory: 'placeholder',
    filters: { lengthOk: true, languageOk: true, repetitionOk: true },
    qualityScore: 0.22,
  },
  {
    id: 6,
    text: "短いテキスト日本語のサンプル",
    trueCategory: 'non-english',
    filters: { lengthOk: false, languageOk: false, repetitionOk: true },
    qualityScore: 0.40,   // text quality unclear; classifier sees non-English chars
  },
  {
    id: 7,
    text: "Hi.",
    trueCategory: 'short',
    filters: { lengthOk: false, languageOk: true, repetitionOk: true },
    qualityScore: 0.30,
  },
  {
    id: 8,
    text: "Quantum entanglement is a phenomenon where particles become correlated such that the quantum state of each particle cannot be described independently.",
    trueCategory: 'clean',
    filters: { lengthOk: true, languageOk: true, repetitionOk: true },
    qualityScore: 0.95,
  },
  {
    id: 9,
    text: "FREE FREE FREE FREE FREE FREE CLICK HERE NOW NOW NOW WINNER WINNER CLICK CLICK WINNER FREE FREE",
    trueCategory: 'spam',
    filters: { lengthOk: true, languageOk: true, repetitionOk: false },
    qualityScore: 0.05,
  },
  {
    id: 10,
    text: "Photo: cat. Photo: cat. Photo: cat. Photo: cat. Photo: cat. Photo: cat. Photo: cat. Photo: cat.",
    trueCategory: 'repetitive',
    filters: { lengthOk: false, languageOk: true, repetitionOk: false },  // 96 chars, just under 100
    qualityScore: 0.10,
  },
];

/** Color for the true-category indicator. */
export function categoryColor(cat: QualitySample['trueCategory']): string {
  switch (cat) {
    case 'clean':       return 'var(--emerald-400)';
    case 'spam':        return 'var(--rose-400)';
    case 'repetitive':  return 'var(--amber-400)';
    case 'short':       return 'var(--text-tertiary)';
    case 'placeholder': return 'var(--violet-400)';
    case 'non-english': return 'var(--sky-400)';
  }
}

/** Filter categories enabled in the widget. */
export type FilterKey = 'length' | 'language' | 'repetition' | 'classifier';

/** Compute whether a sample passes the enabled filters. */
export function passesFilters(
  sample: QualitySample,
  enabled: Record<FilterKey, boolean>,
  classifierThreshold: number,
): { passes: boolean; perFilter: Record<FilterKey, boolean> } {
  const perFilter: Record<FilterKey, boolean> = {
    length: sample.filters.lengthOk,
    language: sample.filters.languageOk,
    repetition: sample.filters.repetitionOk,
    classifier: sample.qualityScore >= classifierThreshold,
  };
  const passes = (Object.keys(enabled) as FilterKey[]).every(
    f => !enabled[f] || perFilter[f]
  );
  return { passes, perFilter };
}

/** Number of samples that filter X *alone* would drop (others disabled). */
export function dropsAlone(filter: FilterKey, classifierThreshold: number): number {
  const isolated: Record<FilterKey, boolean> = { length: false, language: false, repetition: false, classifier: false };
  isolated[filter] = true;
  return SAMPLES.filter(s => !passesFilters(s, isolated, classifierThreshold).passes).length;
}
