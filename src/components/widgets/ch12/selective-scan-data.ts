export interface Token {
  index: number;
  text: string;
  importance: 'important' | 'filler';
  /** Hand-tuned delta_t value — larger for important tokens. */
  deltaT: number;
  /** Hand-tuned input value driving the SSM. */
  inputValue: number;
}

/**
 * Hand-tuned 16-token sequence demonstrating selective state updates.
 *
 * Important tokens (large delta_t ~0.8): "capital", "France", "Paris", "weather", "rainy", "winter"
 * Filler tokens (small delta_t ~0.05):    "The", "of", "is", ".", "and", "the", "there", "is", "often", "in"
 */
export const TOKENS: Token[] = [
  { index: 0,  text: 'The',     importance: 'filler',    deltaT: 0.05, inputValue: 0.2 },
  { index: 1,  text: 'capital', importance: 'important', deltaT: 0.85, inputValue: 1.0 },
  { index: 2,  text: 'of',      importance: 'filler',    deltaT: 0.05, inputValue: 0.1 },
  { index: 3,  text: 'France',  importance: 'important', deltaT: 0.90, inputValue: 1.2 },
  { index: 4,  text: 'is',      importance: 'filler',    deltaT: 0.05, inputValue: 0.15 },
  { index: 5,  text: 'Paris',   importance: 'important', deltaT: 0.88, inputValue: 1.1 },
  { index: 6,  text: '.',       importance: 'filler',    deltaT: 0.03, inputValue: 0.05 },
  { index: 7,  text: 'and',     importance: 'filler',    deltaT: 0.06, inputValue: 0.15 },
  { index: 8,  text: 'the',     importance: 'filler',    deltaT: 0.05, inputValue: 0.1 },
  { index: 9,  text: 'weather', importance: 'important', deltaT: 0.82, inputValue: 0.9 },
  { index: 10, text: 'there',   importance: 'filler',    deltaT: 0.07, inputValue: 0.2 },
  { index: 11, text: 'is',      importance: 'filler',    deltaT: 0.05, inputValue: 0.15 },
  { index: 12, text: 'often',   importance: 'filler',    deltaT: 0.10, inputValue: 0.3 },
  { index: 13, text: 'rainy',   importance: 'important', deltaT: 0.80, inputValue: 0.95 },
  { index: 14, text: 'in',      importance: 'filler',    deltaT: 0.05, inputValue: 0.1 },
  { index: 15, text: 'winter',  importance: 'important', deltaT: 0.78, inputValue: 0.9 },
];

/**
 * 8 state components with different decay rates.
 * Fast-decay components forget quickly; slow-decay components retain longer.
 */
export const STATE_DIM = 8;

/** Eigenvalues (a_i) for each state component. Negative for stability; smaller |a| = slower decay. */
export const STATE_EIGENVALUES = [-3.0, -2.5, -1.5, -1.0, -0.7, -0.4, -0.2, -0.1];

/** Decay-rate labels for the rows. */
export const STATE_LABELS = [
  'h₀ (fast)',
  'h₁ (fast)',
  'h₂ (medium)',
  'h₃ (medium)',
  'h₄ (medium)',
  'h₅ (slow)',
  'h₆ (slow)',
  'h₇ (slowest)',
];

/** Per-component input weight (B vector). All 1.0 for simplicity — inputs drive all components equally. */
const B_VEC = new Array(STATE_DIM).fill(1.0);

/**
 * Simulate the selective SSM forward pass across the full sequence.
 * Returns the state at each time step, plus the delta_t values used.
 */
export function simulateStateEvolution(): {
  states: number[][];
  deltas: number[];
  inputs: number[];
} {
  const T = TOKENS.length;
  const states: number[][] = [];
  const deltas: number[] = [];
  const inputs: number[] = [];

  let h = new Array(STATE_DIM).fill(0);

  for (let t = 0; t < T; t++) {
    const tok = TOKENS[t]!;
    const dt = tok.deltaT;
    const x = tok.inputValue;

    const newH = new Array(STATE_DIM);
    for (let i = 0; i < STATE_DIM; i++) {
      const aBar = Math.exp(dt * STATE_EIGENVALUES[i]!);
      newH[i] = aBar * h[i]! + dt * B_VEC[i]! * x;
    }
    h = newH;

    states.push([...h]);
    deltas.push(dt);
    inputs.push(x);
  }

  return { states, deltas, inputs };
}

/** Get the maximum state magnitude across all time steps and components (for normalization). */
export function getMaxStateMagnitude(states: number[][]): number {
  let max = 0;
  for (const row of states) {
    for (const v of row) {
      if (Math.abs(v) > max) max = Math.abs(v);
    }
  }
  return max;
}
