export const N_STEPS = 100;
export const START = { x: -3.0, y: 4.0 };
export const MINIMUM = { x: 3.0, y: 1.0 };

export function loss(x: number, y: number): number {
  return 10 * (x - MINIMUM.x) ** 2 + (y - MINIMUM.y) ** 2;
}

export function grad(x: number, y: number): { gx: number; gy: number } {
  return {
    gx: 20 * (x - MINIMUM.x),
    gy: 2 * (y - MINIMUM.y),
  };
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  loss: number;
}

function computeSGD(lr: number): TrajectoryPoint[] {
  const traj: TrajectoryPoint[] = [{ x: START.x, y: START.y, loss: loss(START.x, START.y) }];
  let x = START.x, y = START.y;
  for (let t = 1; t <= N_STEPS; t++) {
    const { gx, gy } = grad(x, y);
    x -= lr * gx;
    y -= lr * gy;
    traj.push({ x, y, loss: loss(x, y) });
  }
  return traj;
}

function computeAdam(lr: number, beta1 = 0.9, beta2 = 0.95, eps = 1e-8): TrajectoryPoint[] {
  const traj: TrajectoryPoint[] = [{ x: START.x, y: START.y, loss: loss(START.x, START.y) }];
  let x = START.x, y = START.y;
  let mx = 0, my = 0, vx = 0, vy = 0;
  for (let t = 1; t <= N_STEPS; t++) {
    const { gx, gy } = grad(x, y);
    mx = beta1 * mx + (1 - beta1) * gx;
    my = beta1 * my + (1 - beta1) * gy;
    vx = beta2 * vx + (1 - beta2) * gx * gx;
    vy = beta2 * vy + (1 - beta2) * gy * gy;
    const mxh = mx / (1 - Math.pow(beta1, t));
    const myh = my / (1 - Math.pow(beta1, t));
    const vxh = vx / (1 - Math.pow(beta2, t));
    const vyh = vy / (1 - Math.pow(beta2, t));
    x -= lr * mxh / (Math.sqrt(vxh) + eps);
    y -= lr * myh / (Math.sqrt(vyh) + eps);
    traj.push({ x, y, loss: loss(x, y) });
  }
  return traj;
}

function computeAdamW(lr: number, weight_decay = 0.05, beta1 = 0.9, beta2 = 0.95, eps = 1e-8): TrajectoryPoint[] {
  const traj: TrajectoryPoint[] = [{ x: START.x, y: START.y, loss: loss(START.x, START.y) }];
  let x = START.x, y = START.y;
  let mx = 0, my = 0, vx = 0, vy = 0;
  for (let t = 1; t <= N_STEPS; t++) {
    const { gx, gy } = grad(x, y);
    mx = beta1 * mx + (1 - beta1) * gx;
    my = beta1 * my + (1 - beta1) * gy;
    vx = beta2 * vx + (1 - beta2) * gx * gx;
    vy = beta2 * vy + (1 - beta2) * gy * gy;
    const mxh = mx / (1 - Math.pow(beta1, t));
    const myh = my / (1 - Math.pow(beta1, t));
    const vxh = vx / (1 - Math.pow(beta2, t));
    const vyh = vy / (1 - Math.pow(beta2, t));
    x = (1 - lr * weight_decay) * x - lr * mxh / (Math.sqrt(vxh) + eps);
    y = (1 - lr * weight_decay) * y - lr * myh / (Math.sqrt(vyh) + eps);
    traj.push({ x, y, loss: loss(x, y) });
  }
  return traj;
}

export const TRAJ_SGD: TrajectoryPoint[] = computeSGD(0.04);
export const TRAJ_ADAM: TrajectoryPoint[] = computeAdam(0.3);
export const TRAJ_ADAMW: TrajectoryPoint[] = computeAdamW(0.3, 0.05);

export type OptimizerKey = 'sgd' | 'adam' | 'adamw';

export interface OptimizerSpec {
  key: OptimizerKey;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  trajectory: TrajectoryPoint[];
}

export const OPTIMIZERS: OptimizerSpec[] = [
  {
    key: 'sgd',
    label: 'SGD',
    shortLabel: 'SGD',
    description: "Plain stochastic gradient descent. Same step size in every direction — overshoots in x (steep gradient) and crawls in y (shallow gradient).",
    color: 'var(--rose-400)',
    trajectory: TRAJ_SGD,
  },
  {
    key: 'adam',
    label: 'Adam',
    shortLabel: 'Adam',
    description: "Adaptive per-parameter learning rates via second-moment estimate. Per-axis scaling means x gets smaller updates and y gets larger ones — smooth trajectory.",
    color: 'var(--amber-400)',
    trajectory: TRAJ_ADAM,
  },
  {
    key: 'adamw',
    label: 'AdamW',
    shortLabel: 'AdamW',
    description: "Adam plus decoupled weight decay. Same adaptive updates as Adam, but parameters are shrunk toward zero each step. Convergence point sits slightly toward the origin, away from the minimum.",
    color: 'var(--cyan-400)',
    trajectory: TRAJ_ADAMW,
  },
];
