export type TokenRole = 'system' | 'user' | 'assistant' | 'special';

export interface Token {
  index: number;
  text: string;
  role: TokenRole;
  /** True if this token contributes to the SFT loss (only assistant tokens). */
  inLoss: boolean;
}

function makeTokens(items: Array<[string, TokenRole, boolean]>): Token[] {
  return items.map(([text, role, inLoss], index) => ({ index, text, role, inLoss }));
}

export const CONVERSATION: Token[] = makeTokens([
  // System turn
  ['<|im_start|>', 'special', false],
  ['system',       'special', false],
  ['You',          'system',  false],
  ['are',          'system',  false],
  ['a',            'system',  false],
  ['helpful',      'system',  false],
  ['assistant.',   'system',  false],
  ['<|im_end|>',   'special', false],

  // User turn 1
  ['<|im_start|>', 'special', false],
  ['user',         'special', false],
  ['What',         'user',    false],
  ['is',           'user',    false],
  ['the',          'user',    false],
  ['capital',      'user',    false],
  ['of',           'user',    false],
  ['France?',      'user',    false],
  ['<|im_end|>',   'special', false],

  // Assistant turn 1 — only the content tokens are in_loss
  ['<|im_start|>', 'special',   false],
  ['assistant',    'special',   false],
  ['The',          'assistant', true],
  ['capital',      'assistant', true],
  ['of',           'assistant', true],
  ['France',       'assistant', true],
  ['is',           'assistant', true],
  ['Paris.',       'assistant', true],
  ['<|im_end|>',   'special',   true],   // end-of-turn IS in loss — model must learn to STOP

  // User turn 2
  ['<|im_start|>', 'special', false],
  ['user',         'special', false],
  ['And',          'user',    false],
  ['its',          'user',    false],
  ['population?',  'user',    false],
  ['<|im_end|>',   'special', false],

  // Assistant turn 2
  ['<|im_start|>', 'special',   false],
  ['assistant',    'special',   false],
  ['Paris',        'assistant', true],
  ['has',          'assistant', true],
  ['about',        'assistant', true],
  ['2.1',          'assistant', true],
  ['million',      'assistant', true],
  ['people.',      'assistant', true],
  ['<|im_end|>',   'special',   true],   // end-of-turn IS in loss
]);

export function getLossTokens(tokens: Token[] = CONVERSATION): Token[] {
  return tokens.filter(t => t.inLoss);
}

export function getCountByRole(tokens: Token[] = CONVERSATION): Record<TokenRole, number> {
  const counts: Record<TokenRole, number> = { system: 0, user: 0, assistant: 0, special: 0 };
  tokens.forEach(t => counts[t.role]++);
  return counts;
}

export function getLossCount(tokens: Token[] = CONVERSATION): number {
  return tokens.filter(t => t.inLoss).length;
}

export function getStats(tokens: Token[] = CONVERSATION) {
  const total = tokens.length;
  const inLoss = getLossCount(tokens);
  const byRole = getCountByRole(tokens);
  return {
    total,
    inLoss,
    inLossPct: (inLoss / total) * 100,
    byRole,
  };
}
