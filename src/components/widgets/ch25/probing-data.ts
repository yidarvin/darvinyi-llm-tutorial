// src/components/widgets/ch25/probing-data.ts

/**
 * Six concepts and their per-layer probe accuracies on a 12-layer transformer.
 *
 * The data illustrates *layer-wise feature emergence*:
 *   - Surface features (token identity) peak in early layers
 *   - Syntactic features (POS, sentence boundaries) peak in early-middle
 *   - Semantic features (NER, sentiment) peak in middle-late
 *   - Task-specific features (refusal patterns) peak at the end
 *
 * Numbers are illustrative — chosen to reflect typical patterns reported in
 * the probing literature (Tenney et al. 2019, Belinkov & Glass 2019).
 */

export type ConceptCategory = 'surface' | 'syntactic' | 'semantic' | 'task-specific';

export interface ProbeConcept {
  id: string;
  label: string;
  category: ConceptCategory;
  description: string;
  /** Per-layer probe accuracy on a 12-layer model (layers 0..11). 0..1. */
  accuracyByLayer: number[];
  /** Plain-prose note about why this concept emerges at the layer it does. */
  note: string;
}

export const N_LAYERS = 12;

export const CONCEPTS: ProbeConcept[] = [
  {
    id: 'token-identity',
    label: 'Token identity',
    category: 'surface',
    description: 'Decoding which token is at a given position. The most basic information; trivially recoverable from the input embedding.',
    accuracyByLayer: [
      0.99, 0.97, 0.94, 0.89, 0.83, 0.76,
      0.69, 0.62, 0.55, 0.49, 0.42, 0.36,
    ],
    note: 'Token identity is maximally decodable at layer 0 (the embedding). As the model adds task-relevant transformations across layers, the original token identity is gradually mixed into more abstract representations.',
  },
  {
    id: 'sentence-boundary',
    label: 'Sentence boundaries',
    category: 'syntactic',
    description: 'Detecting whether the current token ends a sentence. Mostly punctuation-driven; emerges early.',
    accuracyByLayer: [
      0.74, 0.88, 0.94, 0.96, 0.95, 0.92,
      0.87, 0.82, 0.77, 0.73, 0.69, 0.66,
    ],
    note: 'Sentence boundary detection requires combining token identity with simple positional patterns. It emerges in the early layers where the model is doing surface-level structural parsing.',
  },
  {
    id: 'pos',
    label: 'Part of speech',
    category: 'syntactic',
    description: 'Classifying each token as a noun, verb, adjective, etc. A syntactic concept; peaks in early-middle layers.',
    accuracyByLayer: [
      0.51, 0.70, 0.84, 0.91, 0.94, 0.93,
      0.89, 0.84, 0.78, 0.73, 0.69, 0.65,
    ],
    note: 'Part-of-speech information emerges in early-middle layers, after the model has built up enough context to disambiguate (e.g., "run" as noun vs. verb). It declines later as the model moves to more abstract task-relevant representations.',
  },
  {
    id: 'ner',
    label: 'Named entities',
    category: 'semantic',
    description: 'Identifying spans that refer to people, places, organizations. A semantic concept; peaks in mid-late layers.',
    accuracyByLayer: [
      0.42, 0.55, 0.66, 0.74, 0.81, 0.86,
      0.89, 0.91, 0.92, 0.91, 0.89, 0.86,
    ],
    note: 'Named-entity recognition needs both syntactic structure (which tokens are nouns) and semantic knowledge (which nouns are entities). It emerges in middle-late layers where syntax and semantics combine.',
  },
  {
    id: 'sentiment',
    label: 'Sentiment',
    category: 'semantic',
    description: 'Classifying text as positive, negative, or neutral. A semantic concept that requires integration across many tokens.',
    accuracyByLayer: [
      0.51, 0.55, 0.61, 0.68, 0.74, 0.80,
      0.85, 0.89, 0.91, 0.93, 0.92, 0.89,
    ],
    note: 'Sentiment requires aggregating information across the whole input. It emerges in late layers where the model has had several opportunities to integrate context.',
  },
  {
    id: 'refusal',
    label: 'Refusal patterns',
    category: 'task-specific',
    description: 'Detecting whether the model will (or did) refuse the request. A task-specific behavior; peaks at the last layer.',
    accuracyByLayer: [
      0.50, 0.51, 0.52, 0.54, 0.58, 0.63,
      0.69, 0.75, 0.81, 0.86, 0.91, 0.95,
    ],
    note: 'Refusal is a decision the model commits to at output. It emerges only in the last layers — after the model has integrated all input context and reached a behavioral conclusion. The "refusal direction" identified in late layers is what makes refusal-clamping interventions possible.',
  },
];

/** Category labels and colors. */
export const CATEGORIES: Record<ConceptCategory, { label: string; color: string }> = {
  'surface':       { label: 'surface',       color: 'var(--cyan-400)' },
  'syntactic':     { label: 'syntactic',     color: 'var(--amber-400)' },
  'semantic':      { label: 'semantic',      color: 'var(--violet-400)' },
  'task-specific': { label: 'task-specific', color: 'var(--rose-400)' },
};

/** Find the peak layer index for a concept. */
export function peakLayer(concept: ProbeConcept): number {
  let bestIdx = 0;
  let best = -Infinity;
  for (let i = 0; i < concept.accuracyByLayer.length; i++) {
    if (concept.accuracyByLayer[i]! > best) {
      best = concept.accuracyByLayer[i]!;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** Find the peak accuracy for a concept. */
export function peakAccuracy(concept: ProbeConcept): number {
  return Math.max(...concept.accuracyByLayer);
}
