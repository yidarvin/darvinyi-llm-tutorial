export type ExpertCategory =
  | 'punctuation'
  | 'syntax'
  | 'code_keyword'
  | 'code_primary'
  | 'unused'
  | 'entities'
  | 'numeric'
  | 'proper_noun';

export interface ExpertSpec {
  index: number;
  label: string;
  category: ExpertCategory;
  shortDescription: string;
}

export interface TokenSpec {
  index: number;
  text: string;
  category: string;
  /** Hand-tuned router logits for 8 experts. Top-2 should match the token's natural specialization. */
  logits: number[];
}

export const EXPERTS: ExpertSpec[] = [
  { index: 0, label: 'Expert 0', category: 'punctuation',  shortDescription: 'punctuation / boundaries' },
  { index: 1, label: 'Expert 1', category: 'syntax',       shortDescription: 'function words / syntax' },
  { index: 2, label: 'Expert 2', category: 'code_keyword', shortDescription: 'code keywords (secondary)' },
  { index: 3, label: 'Expert 3', category: 'code_primary', shortDescription: 'code (primary)' },
  { index: 4, label: 'Expert 4', category: 'unused',       shortDescription: 'under-utilized — see widget caption' },
  { index: 5, label: 'Expert 5', category: 'entities',     shortDescription: 'named entities' },
  { index: 6, label: 'Expert 6', category: 'numeric',      shortDescription: 'numeric / math' },
  { index: 7, label: 'Expert 7', category: 'proper_noun',  shortDescription: 'proper nouns / capitalized' },
];

/**
 * 16 hand-tuned tokens. Router logits chosen so each token's top-2 reveals
 * the expert specialization in a pedagogically clean way.
 *
 * Expert 4 receives NO high logits — making it visibly under-utilized.
 */
export const TOKENS: TokenSpec[] = [
  { index: 0,  text: '"the"',      category: 'syntax',         logits: [1.5, 2.5, -0.5, -0.3, -0.8, -0.6, -0.4, 0.0] },
  { index: 1,  text: '"def"',      category: 'code',           logits: [-0.2, 0.5, 1.5, 2.5, -0.7, -0.4, -0.3, -0.5] },
  { index: 2,  text: '"Paris"',    category: 'named entity',   logits: [-0.5, -0.3, 0.0, -0.2, -0.6, 2.5, 0.2, 1.5] },
  { index: 3,  text: '"return"',   category: 'code',           logits: [0.1, 0.3, 1.5, 2.5, -0.8, -0.6, -0.4, -0.2] },
  { index: 4,  text: '"and"',      category: 'syntax',         logits: [1.5, 2.5, -0.4, -0.6, -0.7, -0.5, -0.3, 0.1] },
  { index: 5,  text: '"="',        category: 'operator',       logits: [0.5, 0.2, 0.8, 2.5, -0.5, -0.4, 1.5, -0.3] },
  { index: 6,  text: '"2024"',     category: 'numeric',        logits: [-0.4, -0.2, 0.0, 0.3, -0.8, 0.5, 2.5, 1.5] },
  { index: 7,  text: '"function"', category: 'code',           logits: [-0.3, 0.4, 1.5, 2.5, -0.6, -0.5, -0.2, 0.1] },
  { index: 8,  text: '"Einstein"', category: 'named entity',   logits: [-0.4, -0.2, 0.1, 0.0, -0.5, 2.5, 0.3, 1.5] },
  { index: 9,  text: '"if"',       category: 'code',           logits: [0.2, 1.5, 0.8, 2.5, -0.7, -0.5, -0.3, -0.4] },
  { index: 10, text: '","',        category: 'punctuation',    logits: [2.5, 1.5, -0.4, -0.6, -0.8, -0.7, -0.5, -0.2] },
  { index: 11, text: '"sum"',      category: 'math',           logits: [0.0, 0.4, 0.8, 1.5, -0.5, -0.3, 2.5, 0.2] },
  { index: 12, text: '"France"',   category: 'named entity',   logits: [-0.5, -0.3, 0.0, -0.1, -0.7, 2.5, 0.4, 1.5] },
  { index: 13, text: '"x"',        category: 'math var',       logits: [-0.2, 0.3, 0.5, 1.5, -0.6, -0.4, 2.5, 0.1] },
  { index: 14, text: '"import"',   category: 'code',           logits: [-0.3, 0.5, 1.5, 2.5, -0.5, -0.4, -0.2, 0.0] },
  { index: 15, text: '"}"',        category: 'punctuation',    logits: [2.5, 0.8, 0.3, 1.5, -0.7, -0.5, -0.3, -0.4] },
];

function softmax(x: number[]): number[] {
  const max = Math.max(...x);
  const exps = x.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

export interface RoutingDecision {
  tokenIndex: number;
  topKIndices: number[];
  topKLogits: number[];
  gates: number[];
  fullProbs: number[];
}

export function routeToken(token: TokenSpec, k: number): RoutingDecision {
  const indexed = token.logits.map((l, i) => ({ logit: l, idx: i }));
  indexed.sort((a, b) => b.logit - a.logit);
  const topK = indexed.slice(0, k);
  const topKIndices = topK.map(x => x.idx);
  const topKLogits = topK.map(x => x.logit);

  const gates = softmax(topKLogits);
  const fullProbs = softmax(token.logits);

  return {
    tokenIndex: token.index,
    topKIndices,
    topKLogits,
    gates,
    fullProbs,
  };
}

export function routeAllTokens(tokens: TokenSpec[], k: number): {
  decisions: RoutingDecision[];
  expertLoads: number[];
} {
  const decisions = tokens.map(t => routeToken(t, k));
  const expertLoads = new Array(8).fill(0);
  decisions.forEach(d => {
    d.topKIndices.forEach(i => { expertLoads[i] += 1; });
  });
  return { decisions, expertLoads };
}
