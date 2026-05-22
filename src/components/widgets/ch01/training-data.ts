import { seededPRNG, randNormal } from '@lib/seeded-prng';

const D_IN = 2;
const D_H = 16;
const D_OUT = 4;
const N_TRAIN = 1000;
const BATCH_SIZE = 64;
const TOTAL_STEPS = 500;
const SNAPSHOT_EVERY = 20;
const GRID_RESOLUTION = 30;
const GRID_RANGE = 3;

export const NUM_STEPS = TOTAL_STEPS;
export const SCATTER_SAMPLE = 150;
export const GRID_SIZE = GRID_RESOLUTION;
export const GRID_DOMAIN = GRID_RANGE;

export type OptimizerName = 'sgd' | 'momentum' | 'adam';

export interface TrainingRun {
  losses: number[];
  accuracies: number[];
  snapshots: GridSnapshot[];
}

export interface GridSnapshot {
  step: number;
  predictions: Uint8Array;
}

export interface TrainingData {
  x_data: number[][];
  y_data: Uint8Array;
  runs: Record<OptimizerName, TrainingRun>;
  grid_x: number[];
  grid_y: number[];
  scatter_idx: number[];
}

// === Dataset generation ===

function generateData(): { x: number[][]; y: Uint8Array } {
  const rng = seededPRNG(7);
  const x: number[][] = [];
  const y = new Uint8Array(N_TRAIN);
  for (let i = 0; i < N_TRAIN; i++) {
    const xi = [randNormal(rng), randNormal(rng)];
    x.push(xi);
    y[i] = (xi[0]! > 0 ? 1 : 0) + (xi[1]! > 0 ? 2 : 0);
  }
  return { x, y };
}

// === Math primitives (vectorized for batches) ===

function relu(x: number[][]): number[][] {
  return x.map(row => row.map(v => Math.max(0, v)));
}

function softmax2d(x: number[][]): number[][] {
  return x.map(row => {
    const m = Math.max(...row);
    const exps = row.map(v => Math.exp(v - m));
    const s = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / s);
  });
}

function matmul(a: number[][], b: number[][]): number[][] {
  const m = a.length, k = a[0]!.length, n = b[0]!.length;
  const out: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let p = 0; p < k; p++) s += a[i]![p]! * b[p]![j]!;
      out[i]![j] = s;
    }
  }
  return out;
}

function addBias(z: number[][], b: number[]): number[][] {
  return z.map(row => row.map((v, j) => v + b[j]!));
}

// === MLP forward + backward (batch) ===

interface Weights { W1: number[][]; b1: number[]; W2: number[][]; b2: number[]; }

function initWeights(seed: number): Weights {
  const rng = seededPRNG(seed);
  const std1 = Math.sqrt(2 / D_IN);
  const std2 = Math.sqrt(2 / D_H);
  return {
    W1: Array.from({ length: D_IN },  () => Array.from({ length: D_H },   () => randNormal(rng) * std1)),
    b1: new Array(D_H).fill(0),
    W2: Array.from({ length: D_H },   () => Array.from({ length: D_OUT }, () => randNormal(rng) * std2)),
    b2: new Array(D_OUT).fill(0),
  };
}

function forward(x: number[][], w: Weights) {
  const z1 = addBias(matmul(x, w.W1), w.b1);
  const a1 = relu(z1);
  const z2 = addBias(matmul(a1, w.W2), w.b2);
  const p = softmax2d(z2);
  return { z1, a1, z2, p };
}

function backward(x: number[][], y: Uint8Array, w: Weights, fwd: ReturnType<typeof forward>) {
  const B = x.length;
  const { z1, a1, p } = fwd;

  const dz2: number[][] = p.map((row, i) => row.map((pj, j) => (pj - (y[i] === j ? 1 : 0)) / B));

  const dW2: number[][] = Array.from({ length: D_H }, () => new Array(D_OUT).fill(0));
  for (let h = 0; h < D_H; h++) {
    for (let o = 0; o < D_OUT; o++) {
      let s = 0;
      for (let b = 0; b < B; b++) s += a1[b]![h]! * dz2[b]![o]!;
      dW2[h]![o] = s;
    }
  }
  const db2 = new Array(D_OUT).fill(0);
  for (let b = 0; b < B; b++) for (let o = 0; o < D_OUT; o++) db2[o] += dz2[b]![o]!;

  const da1: number[][] = Array.from({ length: B }, () => new Array(D_H).fill(0));
  for (let b = 0; b < B; b++) {
    for (let h = 0; h < D_H; h++) {
      let s = 0;
      for (let o = 0; o < D_OUT; o++) s += dz2[b]![o]! * w.W2[h]![o]!;
      da1[b]![h] = s;
    }
  }

  const dz1: number[][] = da1.map((row, b) => row.map((g, h) => g * (z1[b]![h]! > 0 ? 1 : 0)));

  const dW1: number[][] = Array.from({ length: D_IN }, () => new Array(D_H).fill(0));
  for (let i = 0; i < D_IN; i++) {
    for (let h = 0; h < D_H; h++) {
      let s = 0;
      for (let b = 0; b < B; b++) s += x[b]![i]! * dz1[b]![h]!;
      dW1[i]![h] = s;
    }
  }
  const db1 = new Array(D_H).fill(0);
  for (let b = 0; b < B; b++) for (let h = 0; h < D_H; h++) db1[h] += dz1[b]![h]!;

  return { dW1, db1, dW2, db2 };
}

// === Optimizers ===

interface OptimizerState {
  v_W1?: number[][]; v_b1?: number[]; v_W2?: number[][]; v_b2?: number[];
  m_W1?: number[][]; m_b1?: number[]; m_W2?: number[][]; m_b2?: number[];
  s_W1?: number[][]; s_b1?: number[]; s_W2?: number[][]; s_b2?: number[];
  t?: number;
}

function sgdStep(w: Weights, g: ReturnType<typeof backward>, lr: number) {
  for (let i = 0; i < D_IN; i++) for (let h = 0; h < D_H; h++) w.W1[i]![h] = w.W1[i]![h]! - lr * g.dW1[i]![h]!;
  for (let h = 0; h < D_H; h++) w.b1[h] = w.b1[h]! - lr * g.db1[h]!;
  for (let h = 0; h < D_H; h++) for (let o = 0; o < D_OUT; o++) w.W2[h]![o] = w.W2[h]![o]! - lr * g.dW2[h]![o]!;
  for (let o = 0; o < D_OUT; o++) w.b2[o] = w.b2[o]! - lr * g.db2[o]!;
}

function momentumStep(w: Weights, g: ReturnType<typeof backward>, state: OptimizerState, lr: number, mu: number) {
  if (!state.v_W1) {
    state.v_W1 = Array.from({ length: D_IN }, () => new Array(D_H).fill(0));
    state.v_b1 = new Array(D_H).fill(0);
    state.v_W2 = Array.from({ length: D_H }, () => new Array(D_OUT).fill(0));
    state.v_b2 = new Array(D_OUT).fill(0);
  }
  for (let i = 0; i < D_IN; i++) for (let h = 0; h < D_H; h++) {
    state.v_W1[i]![h] = mu * state.v_W1[i]![h]! + g.dW1[i]![h]!;
    w.W1[i]![h] = w.W1[i]![h]! - lr * state.v_W1[i]![h]!;
  }
  for (let h = 0; h < D_H; h++) {
    state.v_b1![h] = mu * state.v_b1![h]! + g.db1[h]!;
    w.b1[h] = w.b1[h]! - lr * state.v_b1![h]!;
  }
  for (let h = 0; h < D_H; h++) for (let o = 0; o < D_OUT; o++) {
    state.v_W2![h]![o] = mu * state.v_W2![h]![o]! + g.dW2[h]![o]!;
    w.W2[h]![o] = w.W2[h]![o]! - lr * state.v_W2![h]![o]!;
  }
  for (let o = 0; o < D_OUT; o++) {
    state.v_b2![o] = mu * state.v_b2![o]! + g.db2[o]!;
    w.b2[o] = w.b2[o]! - lr * state.v_b2![o]!;
  }
}

function adamStep(w: Weights, g: ReturnType<typeof backward>, state: OptimizerState,
                  lr: number, b1: number, b2: number, eps: number) {
  if (state.t === undefined) {
    state.t = 0;
    state.m_W1 = Array.from({ length: D_IN }, () => new Array(D_H).fill(0));
    state.s_W1 = Array.from({ length: D_IN }, () => new Array(D_H).fill(0));
    state.m_b1 = new Array(D_H).fill(0);
    state.s_b1 = new Array(D_H).fill(0);
    state.m_W2 = Array.from({ length: D_H }, () => new Array(D_OUT).fill(0));
    state.s_W2 = Array.from({ length: D_H }, () => new Array(D_OUT).fill(0));
    state.m_b2 = new Array(D_OUT).fill(0);
    state.s_b2 = new Array(D_OUT).fill(0);
  }
  state.t++;
  const bc1 = 1 - Math.pow(b1, state.t);
  const bc2 = 1 - Math.pow(b2, state.t);

  const apply = (param: number, grad: number, m: number, s: number): [number, number, number] => {
    const m_new = b1 * m + (1 - b1) * grad;
    const s_new = b2 * s + (1 - b2) * grad * grad;
    const m_hat = m_new / bc1;
    const s_hat = s_new / bc2;
    return [param - lr * m_hat / (Math.sqrt(s_hat) + eps), m_new, s_new];
  };

  for (let i = 0; i < D_IN; i++) for (let h = 0; h < D_H; h++) {
    const [p, m, s] = apply(w.W1[i]![h]!, g.dW1[i]![h]!, state.m_W1![i]![h]!, state.s_W1![i]![h]!);
    w.W1[i]![h] = p; state.m_W1![i]![h] = m; state.s_W1![i]![h] = s;
  }
  for (let h = 0; h < D_H; h++) {
    const [p, m, s] = apply(w.b1[h]!, g.db1[h]!, state.m_b1![h]!, state.s_b1![h]!);
    w.b1[h] = p; state.m_b1![h] = m; state.s_b1![h] = s;
  }
  for (let h = 0; h < D_H; h++) for (let o = 0; o < D_OUT; o++) {
    const [p, m, s] = apply(w.W2[h]![o]!, g.dW2[h]![o]!, state.m_W2![h]![o]!, state.s_W2![h]![o]!);
    w.W2[h]![o] = p; state.m_W2![h]![o] = m; state.s_W2![h]![o] = s;
  }
  for (let o = 0; o < D_OUT; o++) {
    const [p, m, s] = apply(w.b2[o]!, g.db2[o]!, state.m_b2![o]!, state.s_b2![o]!);
    w.b2[o] = p; state.m_b2![o] = m; state.s_b2![o] = s;
  }
}

// === Decision boundary computation ===

function makeGrid(): { grid_x: number[]; grid_y: number[]; grid_points: number[][] } {
  const grid_x = Array.from({ length: GRID_RESOLUTION }, (_, i) => -GRID_RANGE + (i / (GRID_RESOLUTION - 1)) * 2 * GRID_RANGE);
  const grid_y = [...grid_x];
  const grid_points: number[][] = [];
  for (const gy of grid_y) for (const gx of grid_x) grid_points.push([gx, gy]);
  return { grid_x, grid_y, grid_points };
}

function predictGrid(w: Weights, grid_points: number[][]): Uint8Array {
  const out = new Uint8Array(grid_points.length);
  const { p } = forward(grid_points, w);
  for (let i = 0; i < p.length; i++) {
    let best = 0, bestVal = p[i]![0]!;
    for (let j = 1; j < D_OUT; j++) if (p[i]![j]! > bestVal) { best = j; bestVal = p[i]![j]!; }
    out[i] = best;
  }
  return out;
}

function pickScatterIdx(): number[] {
  const rng = seededPRNG(99);
  const picks = new Set<number>();
  while (picks.size < SCATTER_SAMPLE) {
    picks.add(Math.floor(rng() * N_TRAIN));
  }
  return Array.from(picks).sort((a, b) => a - b);
}

// === Main entry point ===

export function computeTrainingData(): TrainingData {
  const { x: x_data, y: y_data } = generateData();
  const { grid_x, grid_y, grid_points } = makeGrid();
  const scatter_idx = pickScatterIdx();

  const optimizerConfigs = {
    sgd:      { lr: 0.05 },
    momentum: { lr: 0.05, mu: 0.9 },
    adam:     { lr: 0.01, b1: 0.9, b2: 0.999, eps: 1e-8 },
  };

  const runs: Record<OptimizerName, TrainingRun> = {
    sgd: emptyRun(),
    momentum: emptyRun(),
    adam: emptyRun(),
  };

  for (const opt of ['sgd', 'momentum', 'adam'] as OptimizerName[]) {
    const w = initWeights(42);
    const state: OptimizerState = {};
    const rng = seededPRNG(123);

    for (let step = 0; step < TOTAL_STEPS; step++) {
      const batch_x: number[][] = [];
      const batch_y = new Uint8Array(BATCH_SIZE);
      for (let b = 0; b < BATCH_SIZE; b++) {
        const idx = Math.floor(rng() * N_TRAIN);
        batch_x.push(x_data[idx]!);
        batch_y[b] = y_data[idx]!;
      }

      const fwd = forward(batch_x, w);
      const grads = backward(batch_x, batch_y, w, fwd);

      let loss = 0, correct = 0;
      for (let i = 0; i < BATCH_SIZE; i++) {
        loss -= Math.log(Math.max(fwd.p[i]![batch_y[i]!]!, 1e-12));
        let pred = 0, pmax = fwd.p[i]![0]!;
        for (let j = 1; j < D_OUT; j++) if (fwd.p[i]![j]! > pmax) { pred = j; pmax = fwd.p[i]![j]!; }
        if (pred === batch_y[i]) correct++;
      }
      runs[opt].losses.push(loss / BATCH_SIZE);
      runs[opt].accuracies.push(correct / BATCH_SIZE);

      if (step % SNAPSHOT_EVERY === 0) {
        runs[opt].snapshots.push({ step, predictions: predictGrid(w, grid_points) });
      }

      const cfg = optimizerConfigs[opt];
      if (opt === 'sgd')      sgdStep(w, grads, cfg.lr);
      if (opt === 'momentum') momentumStep(w, grads, state, cfg.lr, (cfg as { mu: number }).mu);
      if (opt === 'adam') {
        const a = cfg as { lr: number; b1: number; b2: number; eps: number };
        adamStep(w, grads, state, a.lr, a.b1, a.b2, a.eps);
      }
    }
  }

  return { x_data, y_data, runs, grid_x, grid_y, scatter_idx };
}

function emptyRun(): TrainingRun { return { losses: [], accuracies: [], snapshots: [] }; }
