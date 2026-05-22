/**
 * BPE training widget data layer.
 *
 * Corpus is intentionally small (~10 short sentences) so 25 merge steps produce
 * pedagogically interesting results in <50ms of in-browser compute.
 *
 * No pre-tokenization regex — we just split on whitespace and operate on chars
 * (not bytes) for visual clarity. The chapter prose explicitly discusses why
 * real BPE uses bytes; this widget chooses character-level for readability.
 */

export const CORPUS_SENTENCES: string[] = [
  'the cat sat on the mat',
  'the dog sat on the rug',
  'the cat ran fast',
  'the dog ran slow',
  'the bird sang in the tree',
  'the cat and the dog',
  'the cat slept on the mat',
  'the dog slept on the rug',
  'the bird flew over the tree',
  'the cat watched the bird',
];

/** Top-5 adjacent pair counts at a given training step */
export interface PairCount {
  pair: [string, string];
  count: number;
}

/** A single training step in the trace */
export interface MergeStep {
  /** Step number, starting at 1 */
  stepNum: number;
  /** The pair chosen to merge */
  chosenPair: [string, string];
  /** Its count */
  chosenCount: number;
  /** The new token formed by concatenation */
  newToken: string;
  /** Top 5 pair counts BEFORE this merge was applied (includes the chosen one) */
  topPairs: PairCount[];
  /** Corpus state AFTER this merge: array of word-tuples, each a list of tokens */
  corpusAfter: string[][];
  /** Running vocabulary size after this step */
  vocabSize: number;
}

export interface TrainingTrace {
  /** Initial corpus: each word as array of single chars */
  initialCorpus: string[][];
  /** Vocabulary size before any merges (count of unique characters) */
  initialVocabSize: number;
  /** Each merge step in order */
  steps: MergeStep[];
}

/**
 * Train BPE on the corpus for `numMerges` steps; return the complete trace.
 * Uses character-level base tokens (not bytes), for visual clarity.
 */
export function precomputeTrace(numMerges: number = 25): TrainingTrace {
  const wordFreq = new Map<string, number>();

  for (const sentence of CORPUS_SENTENCES) {
    for (const word of sentence.split(/\s+/)) {
      if (word === '') continue;
      const tup = Array.from(word);
      const key = tup.join('\x00');
      wordFreq.set(key, (wordFreq.get(key) ?? 0) + 1);
    }
  }

  const initialCorpus: string[][] = Array.from(wordFreq.keys())
    .sort()
    .map(k => k.split('\x00'));

  let corpus = new Map(wordFreq);

  const vocab = new Set<string>();
  for (const key of corpus.keys()) {
    for (const ch of key.split('\x00')) vocab.add(ch);
  }
  const initialVocabSize = vocab.size;

  const steps: MergeStep[] = [];

  for (let step = 1; step <= numMerges; step++) {
    const pairCounts = new Map<string, number>();
    for (const [wordKey, count] of corpus) {
      const tokens = wordKey.split('\x00');
      for (let i = 0; i < tokens.length - 1; i++) {
        const pairKey = `${tokens[i]}\x00${tokens[i + 1]}`;
        pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + count);
      }
    }

    if (pairCounts.size === 0) break;

    const sorted = Array.from(pairCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const top5: PairCount[] = sorted.slice(0, 5).map(([pairKey, count]) => {
      const [a, b] = pairKey.split('\x00') as [string, string];
      return { pair: [a, b], count };
    });

    const [chosenPairKey, chosenCount] = sorted[0]!;
    const [a, b] = chosenPairKey.split('\x00') as [string, string];
    const newToken = a + b;
    vocab.add(newToken);

    const nextCorpus = new Map<string, number>();
    for (const [wordKey, count] of corpus) {
      const tokens = wordKey.split('\x00');
      const newTokens: string[] = [];
      let i = 0;
      while (i < tokens.length) {
        if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
          newTokens.push(newToken);
          i += 2;
        } else {
          newTokens.push(tokens[i]!);
          i += 1;
        }
      }
      const newKey = newTokens.join('\x00');
      nextCorpus.set(newKey, (nextCorpus.get(newKey) ?? 0) + count);
    }
    corpus = nextCorpus;

    const corpusAfter: string[][] = Array.from(corpus.keys())
      .sort()
      .map(k => k.split('\x00'));

    steps.push({
      stepNum: step,
      chosenPair: [a, b],
      chosenCount,
      newToken,
      topPairs: top5,
      corpusAfter,
      vocabSize: vocab.size,
    });
  }

  return { initialCorpus, initialVocabSize, steps };
}
