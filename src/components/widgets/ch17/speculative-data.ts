export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TokenStatus = 'accepted' | 'rejected' | 'corrected' | 'discarded' | 'pending';

export interface RoundToken {
  index: number;
  status: TokenStatus;
  label: string;
}

export function simulateRound(k: number, alpha: number, seed: number): {
  tokens: RoundToken[];
  accepted: number;
  corrected: boolean;
  totalEmitted: number;
} {
  const rand = mulberry32(seed);
  const tokens: RoundToken[] = [];
  let firstReject = -1;

  for (let i = 0; i < k; i++) {
    if (firstReject >= 0) {
      tokens.push({ index: i, status: 'discarded', label: `t${i + 1}` });
      continue;
    }
    if (rand() < alpha) {
      tokens.push({ index: i, status: 'accepted', label: `t${i + 1}` });
    } else {
      tokens.push({ index: i, status: 'rejected', label: `t${i + 1}` });
      firstReject = i;
    }
  }

  const corrected = firstReject >= 0;
  if (corrected) {
    tokens.push({
      index: firstReject,
      status: 'corrected',
      label: `t${firstReject + 1}'`,
    });
  }

  const accepted = tokens.filter(t => t.status === 'accepted').length;
  const totalEmitted = accepted + (corrected ? 1 : 0);

  return { tokens, accepted, corrected, totalEmitted };
}

export function expectedSpeedup(k: number, alpha: number, draftCost = 0.02, overhead = 0.05): {
  expectedAccepted: number;
  expectedEmitted: number;
  costPerRound: number;
  speedup: number;
} {
  const expectedAccepted = alpha < 1
    ? (1 - Math.pow(alpha, k + 1)) / (1 - alpha) - 1
    : k;
  const expectedEmitted = expectedAccepted + 1;
  const costPerRound = 1 + k * draftCost + overhead;
  const speedup = expectedEmitted / costPerRound;

  return { expectedAccepted, expectedEmitted, costPerRound, speedup };
}
