import { seededPRNG, randNormal } from '@lib/seeded-prng';

export type WordCategory = 'animal' | 'vehicle' | 'food';

export interface WordInfo {
  word: string;
  category: WordCategory;
}

export const VOCAB: WordInfo[] = [
  { word: 'cat',    category: 'animal' },
  { word: 'dog',    category: 'animal' },
  { word: 'fish',   category: 'animal' },
  { word: 'bird',   category: 'animal' },
  { word: 'car',    category: 'vehicle' },
  { word: 'truck',  category: 'vehicle' },
  { word: 'boat',   category: 'vehicle' },
  { word: 'plane',  category: 'vehicle' },
  { word: 'pizza',  category: 'food' },
  { word: 'salad',  category: 'food' },
  { word: 'soup',   category: 'food' },
  { word: 'bread',  category: 'food' },
  { word: 'liked',  category: 'animal' as WordCategory },
  { word: 'saw',    category: 'animal' as WordCategory },
  { word: 'wanted', category: 'animal' as WordCategory },
];

const CORPUS_LINES: string[][] = [
  ['cat',   'liked',  'fish'],
  ['cat',   'wanted', 'fish'],
  ['dog',   'liked',  'bread'],
  ['dog',   'saw',    'cat'],
  ['fish',  'liked',  'soup'],
  ['bird',  'liked',  'bread'],
  ['bird',  'saw',    'cat'],
  ['cat',   'liked',  'salad'],
  ['dog',   'wanted', 'pizza'],

  ['car',   'liked',  'truck'],
  ['truck', 'saw',    'car'],
  ['boat',  'liked',  'plane'],
  ['plane', 'saw',    'boat'],
  ['car',   'wanted', 'truck'],
  ['truck', 'liked',  'plane'],

  ['pizza', 'liked',  'salad'],
  ['salad', 'wanted', 'soup'],
  ['soup',  'liked',  'bread'],
  ['bread', 'saw',    'pizza'],
  ['pizza', 'liked',  'bread'],
];

const TOTAL_STEPS = 200;
const SNAPSHOT_EVERY = 5;
const K = 3;
const LR = 0.05;

export interface TrainingSnapshot {
  step: number;
  positions: number[][];
}

export interface TrainingTrace {
  vocab: WordInfo[];
  snapshots: TrainingSnapshot[];
}

function sigmoid(x: number): number {
  if (x > 30) return 1;
  if (x < -30) return 0;
  return 1 / (1 + Math.exp(-x));
}

export function computeTrainingTrace(): TrainingTrace {
  const V = VOCAB.length;
  const wordToId: Record<string, number> = {};
  for (let i = 0; i < V; i++) wordToId[VOCAB[i]!.word] = i;

  const initRng = seededPRNG(7);
  const U: number[][] = Array.from({ length: V }, () => [randNormal(initRng) * 0.5, randNormal(initRng) * 0.5]);
  const W: number[][] = Array.from({ length: V }, () => [randNormal(initRng) * 0.5, randNormal(initRng) * 0.5]);

  const pairs: [number, number][] = [];
  for (const line of CORPUS_LINES) {
    for (let i = 0; i < line.length; i++) {
      for (let j = 0; j < line.length; j++) {
        if (i !== j) {
          pairs.push([wordToId[line[i]!]!, wordToId[line[j]!]!]);
        }
      }
    }
  }

  const counts = new Array(V).fill(0);
  for (const [a, b] of pairs) { counts[a]++; counts[b]++; }
  const counts075 = counts.map(c => Math.pow(c, 0.75));
  const totalC = counts075.reduce((a, b) => a + b, 0);
  const noise = counts075.map(c => c / totalC);
  const noiseCum = noise.reduce<number[]>((acc, p, i) => { acc.push((acc[i - 1] ?? 0) + p); return acc; }, []);

  function sampleNegative(rng: () => number, excludeIds: Set<number>): number {
    for (let tries = 0; tries < 20; tries++) {
      const r = rng();
      let lo = 0, hi = V - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (noiseCum[mid]! < r) lo = mid + 1; else hi = mid;
      }
      if (!excludeIds.has(lo)) return lo;
    }
    return Math.floor(rng() * V);
  }

  const trainRng = seededPRNG(42);

  const snapshot = (step: number): TrainingSnapshot => ({
    step,
    positions: U.map(row => [row[0]!, row[1]!]),
  });

  const snapshots: TrainingSnapshot[] = [snapshot(0)];

  const indices = pairs.map((_, i) => i);

  for (let step = 1; step <= TOTAL_STEPS; step++) {
    const pairIdx = Math.floor(trainRng() * indices.length);
    const [wId, cId] = pairs[indices[pairIdx]!]!;
    const u = U[wId]!;
    const v = W[cId]!;
    const exclude = new Set<number>([wId, cId]);

    const negIds: number[] = [];
    for (let n = 0; n < K; n++) {
      negIds.push(sampleNegative(trainRng, exclude));
    }

    const posLogit = u[0]! * v[0]! + u[1]! * v[1]!;
    const negLogits = negIds.map(nid => u[0]! * W[nid]![0]! + u[1]! * W[nid]![1]!);

    const posGrad = sigmoid(posLogit) - 1;
    const negGrads = negLogits.map(l => sigmoid(l));

    let gU0 = posGrad * v[0]!;
    let gU1 = posGrad * v[1]!;
    for (let n = 0; n < K; n++) {
      gU0 += negGrads[n]! * W[negIds[n]!]![0]!;
      gU1 += negGrads[n]! * W[negIds[n]!]![1]!;
    }

    const gV0 = posGrad * u[0]!;
    const gV1 = posGrad * u[1]!;

    const gNegs: number[][] = [];
    for (let n = 0; n < K; n++) {
      gNegs.push([negGrads[n]! * u[0]!, negGrads[n]! * u[1]!]);
    }

    u[0]! -= LR * gU0;
    u[1]! -= LR * gU1;
    v[0]! -= LR * gV0;
    v[1]! -= LR * gV1;
    for (let n = 0; n < K; n++) {
      W[negIds[n]!]![0]! -= LR * gNegs[n]![0]!;
      W[negIds[n]!]![1]! -= LR * gNegs[n]![1]!;
    }

    if (step % SNAPSHOT_EVERY === 0) snapshots.push(snapshot(step));
  }

  return { vocab: VOCAB, snapshots };
}

export function computeTraceForRange() {
  return {
    totalSteps: TOTAL_STEPS,
    snapshotEvery: SNAPSHOT_EVERY,
    expectedSnapshots: Math.floor(TOTAL_STEPS / SNAPSHOT_EVERY) + 1,
  };
}
