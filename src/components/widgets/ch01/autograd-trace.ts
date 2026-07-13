export type Op = 'leaf' | '*' | '+' | 'relu';

export interface ValueNode {
  id: string;
  label: string;
  op: Op;
  data: number;
  initialGrad: number;
  finalGrad: number;
  parents: string[];
  x: number;
  y: number;
  backwardCode: string;
}

export interface StageInfo {
  description: string;
  highlightedNode?: string;
  highlightedEdges?: string[];
  showsForward?: boolean;
  showsBackward?: boolean;
  gradUpdates?: Record<string, number>;
  dataUpdates?: Record<string, number>;
}

export interface AutogradTrace {
  nodes: ValueNode[];
  edges: { from: string; to: string }[];
  stages: StageInfo[];
}

export const TRACE: AutogradTrace = {
  nodes: [
    {
      id: 'a',
      label: 'a',
      op: 'leaf',
      data: 2.0,
      initialGrad: 0,
      finalGrad: -3.0,
      parents: [],
      x: 80,
      y: 80,
      backwardCode:
        '# a is a leaf, no _backward function\n# its grad accumulates from its consumers (d, here)',
    },
    {
      id: 'b',
      label: 'b',
      op: 'leaf',
      data: -3.0,
      initialGrad: 0,
      finalGrad: 2.0,
      parents: [],
      x: 80,
      y: 220,
      backwardCode:
        '# b is a leaf, no _backward function\n# its grad accumulates from its consumers (d, here)',
    },
    {
      id: 'c',
      label: 'c',
      op: 'leaf',
      data: 10.0,
      initialGrad: 0,
      finalGrad: 1.0,
      parents: [],
      x: 80,
      y: 360,
      backwardCode:
        '# c is a leaf, no _backward function\n# its grad accumulates from its consumers (e, here)',
    },
    {
      id: 'd',
      label: 'd = a · b',
      op: '*',
      data: -6.0,
      initialGrad: 0,
      finalGrad: 1.0,
      parents: ['a', 'b'],
      x: 320,
      y: 150,
      backwardCode: `def _backward():
    a.grad += b.data * d.grad   # = -3 * 1 = -3
    b.grad += a.data * d.grad   # =  2 * 1 =  2`,
    },
    {
      id: 'e',
      label: 'e = d + c',
      op: '+',
      data: 4.0,
      initialGrad: 0,
      finalGrad: 1.0,
      parents: ['d', 'c'],
      x: 540,
      y: 250,
      backwardCode: `def _backward():
    d.grad += 1.0 * e.grad   # = 1 * 1 = 1
    c.grad += 1.0 * e.grad   # = 1 * 1 = 1`,
    },
    {
      id: 'L',
      label: 'L = relu(e)',
      op: 'relu',
      data: 4.0,
      initialGrad: 1.0,
      finalGrad: 1.0,
      parents: ['e'],
      x: 740,
      y: 250,
      backwardCode: `def _backward():
    # ReLU passes gradient through if input > 0, else zeros it
    e.grad += (1.0 if e.data > 0 else 0.0) * L.grad
    # e.data = 4 > 0, so: e.grad += 1 * 1 = 1`,
    },
  ],
  edges: [
    { from: 'a', to: 'd' },
    { from: 'b', to: 'd' },
    { from: 'd', to: 'e' },
    { from: 'c', to: 'e' },
    { from: 'e', to: 'L' },
  ],
  stages: [
    {
      description:
        'Start: leaves a, b, c have values. Forward will compute d, e, L. Backward then walks gradients in reverse.',
    },
    {
      description: 'Forward: d = a · b = 2 · (-3) = -6',
      highlightedNode: 'd',
      highlightedEdges: ['a-d', 'b-d'],
      showsForward: true,
      dataUpdates: { d: -6.0 },
    },
    {
      description: 'Forward: e = d + c = -6 + 10 = 4',
      highlightedNode: 'e',
      highlightedEdges: ['d-e', 'c-e'],
      showsForward: true,
      dataUpdates: { e: 4.0 },
    },
    {
      description: 'Forward: L = relu(e) = relu(4) = 4',
      highlightedNode: 'L',
      highlightedEdges: ['e-L'],
      showsForward: true,
      dataUpdates: { L: 4.0 },
    },
    {
      description:
        'Seed: L.grad = 1 (backward always starts by setting the output gradient to 1).',
      highlightedNode: 'L',
      showsBackward: true,
      gradUpdates: { L: 1.0 },
    },
    {
      description:
        'L._backward(): e.grad += 1 · L.grad = 1 (ReLU passes gradient through since e > 0).',
      highlightedNode: 'e',
      highlightedEdges: ['e-L'],
      showsBackward: true,
      gradUpdates: { e: 1.0 },
    },
    {
      description:
        'e._backward(): d.grad += 1 · e.grad = 1, c.grad += 1 · e.grad = 1 (add distributes gradient equally).',
      highlightedNode: 'd',
      highlightedEdges: ['d-e', 'c-e'],
      showsBackward: true,
      gradUpdates: { d: 1.0, c: 1.0 },
    },
    {
      description:
        'd._backward(): a.grad += b.data · d.grad = -3, b.grad += a.data · d.grad = 2.',
      highlightedNode: 'a',
      highlightedEdges: ['a-d', 'b-d'],
      showsBackward: true,
      gradUpdates: { a: -3.0, b: 2.0 },
    },
    {
      description:
        'Backward complete. All gradients computed by walking the graph in reverse topological order.',
    },
  ],
};

export const TOTAL_STAGES = TRACE.stages.length - 1;

export function stateAtStage(stage: number): {
  data: Record<string, number>;
  grads: Record<string, number>;
} {
  const data: Record<string, number> = {};
  const grads: Record<string, number> = {};
  for (const n of TRACE.nodes) {
    data[n.id] = n.op === 'leaf' ? n.data : NaN;
    grads[n.id] = 0;
  }
  const clamped = Math.min(stage, TRACE.stages.length - 1);
  for (let i = 0; i <= clamped; i++) {
    const s = TRACE.stages[i]!;
    if (s.dataUpdates) {
      for (const [k, v] of Object.entries(s.dataUpdates)) data[k] = v;
    }
    if (s.gradUpdates) {
      for (const [k, v] of Object.entries(s.gradUpdates)) grads[k] = v;
    }
  }
  return { data, grads };
}
