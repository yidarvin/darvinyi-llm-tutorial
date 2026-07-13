/** Seeded PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boxMuller(rand: () => number): number {
  const u1 = rand();
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export const VOCAB_SIZE = 50;

export type DistributionShape = 'peaked' | 'bimodal' | 'flat';

function generateShape(shape: DistributionShape): number[] {
  const rand = mulberry32(42);
  const z: number[] = [];
  for (let i = 0; i < VOCAB_SIZE; i++) {
    z.push(boxMuller(rand) * 0.7);
  }
  if (shape === 'peaked') {
    z[5] = (z[5] ?? 0) + 5.0;
  } else if (shape === 'bimodal') {
    z[5] = (z[5] ?? 0) + 3.0;
    z[12] = (z[12] ?? 0) + 2.7;
  }
  return z;
}

export const DISTRIBUTIONS: Record<DistributionShape, number[]> = {
  peaked: generateShape('peaked'),
  bimodal: generateShape('bimodal'),
  flat: generateShape('flat'),
};

export function softmax(z: number[]): number[] {
  const max = Math.max(...z);
  const e = z.map((zi) => Math.exp(zi - max));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((ei) => ei / sum);
}

export interface PipelineResult {
  originalProbs: number[];
  postPipelineProbs: number[];
  keptIndices: Set<number>;
  nucleusSize: number;
  truncationKind: 'top-p' | 'top-k' | 'none' | 'both';
  topProbability: number;
  entropy: number;
}

/**
 * Apply the sampling pipeline: temperature -> top-p ∩ top-k truncation -> renormalize.
 */
export function applyPipeline(
  logits: number[],
  T: number,
  topP: number,
  topK: number,
): PipelineResult {
  const originalProbs = softmax(logits);
  const scaled = logits.map((z) => z / T);
  const scaledProbs = softmax(scaled);

  const idxByProb = scaledProbs
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p - a.p);

  let topPCut = scaledProbs.length;
  if (topP < 1.0) {
    let cum = 0;
    for (let i = 0; i < idxByProb.length; i++) {
      cum += idxByProb[i]!.p;
      if (cum >= topP) {
        topPCut = i + 1;
        break;
      }
    }
  }

  const topKCut = Math.min(topK, scaledProbs.length);

  const cut = Math.min(topPCut, topKCut);
  const keptIndices = new Set<number>();
  for (let i = 0; i < cut; i++) {
    keptIndices.add(idxByProb[i]!.i);
  }

  const postScaled = scaled.map((z, i) => (keptIndices.has(i) ? z : -Infinity));
  const postProbs = softmax(postScaled);

  let truncationKind: 'top-p' | 'top-k' | 'none' | 'both' = 'none';
  if (topP < 1.0 && topK < VOCAB_SIZE) {
    truncationKind = topPCut <= topKCut ? 'top-p' : 'top-k';
    if (topPCut === topKCut) truncationKind = 'both';
  } else if (topP < 1.0) {
    truncationKind = 'top-p';
  } else if (topK < VOCAB_SIZE) {
    truncationKind = 'top-k';
  }

  const topProbability = Math.max(...postProbs);
  const entropy = postProbs.reduce(
    (acc, p) => (p > 0 ? acc - p * Math.log2(p) : acc),
    0,
  );

  return {
    originalProbs,
    postPipelineProbs: postProbs,
    keptIndices,
    nucleusSize: keptIndices.size,
    truncationKind,
    topProbability,
    entropy,
  };
}

export function insightFor(
  shape: DistributionShape,
  topP: number,
  nucleusSize: number,
): string {
  if (topP >= 0.999) {
    return 'Top-p effectively disabled: all tokens in the nucleus. Adjust top-p below 1.0 to see truncation.';
  }
  if (shape === 'peaked') {
    return `Nucleus is small (${nucleusSize} tokens): the model is confident; only a few candidates matter.`;
  }
  if (shape === 'bimodal') {
    return `Nucleus includes both peaks (${nucleusSize} tokens): the model is uncertain between two main options.`;
  }
  return `Nucleus is large (${nucleusSize} tokens): the model is uncertain across many options.`;
}
