import { seededPRNG, randNormal } from '@lib/seeded-prng';

export interface NetworkState {
  x: number[];
  y_target: number;
  y_onehot: number[];

  W1: number[][];
  b1: number[];
  W2: number[][];
  b2: number[];

  z1: number[];
  a1: number[];
  z2: number[];
  p: number[];
  loss: number;

  dz2: number[];
  dW2: number[][];
  db2: number[];
  da1: number[];
  dz1: number[];
  dW1: number[][];
  db1: number[];
}

export const D_IN = 2;
export const D_H = 4;
export const D_OUT = 3;

export function initialWeights(seed: number = 42): {
  W1: number[][]; b1: number[]; W2: number[][]; b2: number[];
} {
  const rng = seededPRNG(seed);
  // He init: std = sqrt(2 / fan_in)
  const std1 = Math.sqrt(2 / D_IN);
  const std2 = Math.sqrt(2 / D_H);
  const W1 = Array.from({ length: D_IN }, () =>
    Array.from({ length: D_H }, () => randNormal(rng) * std1)
  );
  const W2 = Array.from({ length: D_H }, () =>
    Array.from({ length: D_OUT }, () => randNormal(rng) * std2)
  );
  const b1 = new Array(D_H).fill(0);
  const b2 = new Array(D_OUT).fill(0);
  return { W1, b1, W2, b2 };
}

export function softmax(z: number[]): number[] {
  const max = Math.max(...z);
  const exps = z.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function computeState(
  x: number[],
  y_target: number,
  W1: number[][],
  b1: number[],
  W2: number[][],
  b2: number[],
): NetworkState {
  // Forward — single-example (B=1).

  // z1 = x @ W1 + b1, shape (D_H,)
  const z1 = new Array(D_H).fill(0);
  for (let h = 0; h < D_H; h++) {
    for (let i = 0; i < D_IN; i++) {
      z1[h] += x[i]! * W1[i]![h]!;
    }
    z1[h] += b1[h]!;
  }

  // a1 = ReLU(z1)
  const a1 = z1.map((v) => Math.max(0, v));

  // z2 = a1 @ W2 + b2, shape (D_OUT,)
  const z2 = new Array(D_OUT).fill(0);
  for (let o = 0; o < D_OUT; o++) {
    for (let h = 0; h < D_H; h++) {
      z2[o] += a1[h]! * W2[h]![o]!;
    }
    z2[o] += b2[o]!;
  }

  // p = softmax(z2)
  const p = softmax(z2);

  // loss = -log(p[y_target])
  const loss = -Math.log(Math.max(p[y_target]!, 1e-12));

  // Backward — B=1, no /B factor for visualization clarity.
  const y_onehot = new Array(D_OUT).fill(0);
  y_onehot[y_target] = 1;

  // dz2 = p - y_onehot
  const dz2 = p.map((pi, i) => pi - y_onehot[i]!);

  // dW2[h][o] = a1[h] * dz2[o]
  const dW2 = Array.from({ length: D_H }, (_, h) =>
    Array.from({ length: D_OUT }, (_, o) => a1[h]! * dz2[o]!)
  );

  // db2 = dz2
  const db2 = [...dz2];

  // da1[h] = sum_o W2[h][o] * dz2[o]
  const da1 = new Array(D_H).fill(0);
  for (let h = 0; h < D_H; h++) {
    for (let o = 0; o < D_OUT; o++) {
      da1[h] += W2[h]![o]! * dz2[o]!;
    }
  }

  // dz1[h] = da1[h] * 1[z1[h] > 0]
  const dz1 = da1.map((g, h) => g * (z1[h]! > 0 ? 1 : 0));

  // dW1[i][h] = x[i] * dz1[h]
  const dW1 = Array.from({ length: D_IN }, (_, i) =>
    Array.from({ length: D_H }, (_, h) => x[i]! * dz1[h]!)
  );

  // db1 = dz1
  const db1 = [...dz1];

  return {
    x,
    y_target,
    y_onehot,
    W1,
    b1,
    W2,
    b2,
    z1,
    a1,
    z2,
    p,
    loss,
    dz2,
    dW2,
    db2,
    da1,
    dz1,
    dW1,
    db1,
  };
}

export interface Preset {
  label: string;
  x: number[];
  y_target: number;
}

// Hand-picked so seed-42 weights produce confident/ambiguous/confident classifications.
export const PRESETS: Preset[] = [
  { label: 'A: confident class 0', x: [1.2, -0.8], y_target: 0 },
  { label: 'B: ambiguous', x: [0.1, 0.2], y_target: 1 },
  { label: 'C: confident class 2', x: [-1.0, 1.3], y_target: 2 },
];
