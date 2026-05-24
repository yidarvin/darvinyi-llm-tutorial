/**
 * Pedagogical vocabulary — 16 hand-picked tokens that illustrate JSON FSM behavior.
 * Tokens are intentionally chosen so each step has a clear set of valid/invalid distinctions.
 */
export const VOCAB = [
  { id: 0,  label: '{',        kind: 'json-struct' as const },
  { id: 1,  label: '}',        kind: 'json-struct' as const },
  { id: 2,  label: '"',        kind: 'json-struct' as const },
  { id: 3,  label: ':',        kind: 'json-struct' as const },
  { id: 4,  label: ',',        kind: 'json-struct' as const },
  { id: 5,  label: 'name',     kind: 'json-key' as const },
  { id: 6,  label: 'age',      kind: 'json-key' as const },
  { id: 7,  label: 'Alice',    kind: 'json-value-str' as const },
  { id: 8,  label: 'Bob',      kind: 'json-value-str' as const },
  { id: 9,  label: '25',       kind: 'json-value-num' as const },
  { id: 10, label: '30',       kind: 'json-value-num' as const },
  { id: 11, label: 'true',     kind: 'json-value-other' as const },
  { id: 12, label: 'null',     kind: 'json-value-other' as const },
  { id: 13, label: '[',        kind: 'json-bracket' as const },
  { id: 14, label: ']',        kind: 'json-bracket' as const },
  { id: 15, label: 'random',   kind: 'noise' as const },
];

/**
 * FSM states for the grammar: { "name" : "VALUE" }
 *
 * State diagram:
 *   START → AFTER_BRACE → KEY_OPENED → KEY_NAME → KEY_CLOSED → COLON
 *      → VALUE_OPENED → VALUE_NAME → VALUE_CLOSED → DONE
 */
export type FsmState =
  | 'START'
  | 'AFTER_BRACE'
  | 'KEY_OPENED'
  | 'KEY_NAME'
  | 'KEY_CLOSED'
  | 'COLON'
  | 'VALUE_OPENED'
  | 'VALUE_NAME'
  | 'VALUE_CLOSED'
  | 'DONE';

export interface Step {
  state: FsmState;
  description: string;
  validVocabIds: number[];
  modelPreferredId: number;
  chosenId: number;
  emittedSoFar: string;
}

/**
 * Pre-computed step sequence for generating `{"name": "Alice"}`.
 */
export const STEPS: Step[] = [
  {
    state: 'START',
    description: 'Expecting object open `{`',
    validVocabIds: [0],
    modelPreferredId: 15,
    chosenId: 0,
    emittedSoFar: '',
  },
  {
    state: 'AFTER_BRACE',
    description: 'Expecting key open `"`',
    validVocabIds: [2],
    modelPreferredId: 5,
    chosenId: 2,
    emittedSoFar: '{',
  },
  {
    state: 'KEY_OPENED',
    description: 'Expecting key name',
    validVocabIds: [5, 6],
    modelPreferredId: 5,
    chosenId: 5,
    emittedSoFar: '{"',
  },
  {
    state: 'KEY_NAME',
    description: 'Expecting key close `"`',
    validVocabIds: [2],
    modelPreferredId: 3,
    chosenId: 2,
    emittedSoFar: '{"name',
  },
  {
    state: 'KEY_CLOSED',
    description: 'Expecting `:`',
    validVocabIds: [3],
    modelPreferredId: 7,
    chosenId: 3,
    emittedSoFar: '{"name"',
  },
  {
    state: 'COLON',
    description: 'Expecting value open `"`',
    validVocabIds: [2],
    modelPreferredId: 7,
    chosenId: 2,
    emittedSoFar: '{"name":',
  },
  {
    state: 'VALUE_OPENED',
    description: 'Expecting string value',
    validVocabIds: [7, 8],
    modelPreferredId: 7,
    chosenId: 7,
    emittedSoFar: '{"name":"',
  },
  {
    state: 'VALUE_NAME',
    description: 'Expecting value close `"`',
    validVocabIds: [2],
    modelPreferredId: 1,
    chosenId: 2,
    emittedSoFar: '{"name":"Alice',
  },
  {
    state: 'VALUE_CLOSED',
    description: 'Expecting object close `}`',
    validVocabIds: [1],
    modelPreferredId: 4,
    chosenId: 1,
    emittedSoFar: '{"name":"Alice"',
  },
  {
    state: 'DONE',
    description: 'Generation complete',
    validVocabIds: [],
    modelPreferredId: 15,
    chosenId: -1,
    emittedSoFar: '{"name":"Alice"}',
  },
];

export const TARGET_GRAMMAR = '{"name": "<string>"}';
