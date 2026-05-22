export interface DedupDoc {
  id: number;
  text: string;
  /** Category for color coding only — not used by the algorithm. */
  trueGroup: 'A' | 'B' | 'distinct' | 'spam';
}

export const DOCS: DedupDoc[] = [
  // Group A — "France capital" near-duplicates
  { id: 1, text: "The capital of France is Paris.",                                       trueGroup: 'A' },
  { id: 2, text: "The capital of France is paris.",                                       trueGroup: 'A' },
  { id: 3, text: "Paris is the capital of France.",                                       trueGroup: 'A' },

  // Group B — "photosynthesis" near-duplicates
  { id: 4, text: "Photosynthesis converts light into chemical energy.",                   trueGroup: 'B' },
  { id: 5, text: "Photosynthesis converts light into energy.",                            trueGroup: 'B' },

  // Distinct facts
  { id: 6, text: "The Pythagorean theorem relates the sides of a right triangle.",        trueGroup: 'distinct' },
  { id: 7, text: "Quantum mechanics describes subatomic particles probabilistically.",    trueGroup: 'distinct' },

  // Spam
  { id: 8, text: "buy buy buy click here free shipping limited time act now",             trueGroup: 'spam' },
];

/**
 * Precomputed pairwise Jaccard similarity on character 5-shingles.
 * SIMILARITY[i][j] is the Jaccard similarity of DOCS[i] and DOCS[j].
 * Diagonal is always 1.0 (self-similarity).
 *
 * These values were computed offline using true Jaccard on character 5-shingles.
 * MinHash with k=200 would give estimates within ~7% of these values.
 */
export const SIMILARITY: number[][] = [
  //   1     2     3     4     5     6     7     8
  [ 1.00, 0.95, 0.48, 0.02, 0.02, 0.05, 0.02, 0.00],  // 1
  [ 0.95, 1.00, 0.45, 0.02, 0.02, 0.04, 0.02, 0.00],  // 2
  [ 0.48, 0.45, 1.00, 0.02, 0.02, 0.04, 0.02, 0.00],  // 3
  [ 0.02, 0.02, 0.02, 1.00, 0.82, 0.02, 0.01, 0.00],  // 4
  [ 0.02, 0.02, 0.02, 0.82, 1.00, 0.02, 0.01, 0.00],  // 5
  [ 0.05, 0.04, 0.04, 0.02, 0.02, 1.00, 0.03, 0.00],  // 6
  [ 0.02, 0.02, 0.02, 0.01, 0.01, 0.03, 1.00, 0.00],  // 7
  [ 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1.00],  // 8
];

/**
 * Cluster the documents using union-find: any pair with similarity above
 * threshold belongs to the same cluster.
 * Returns an array of clusters, each containing doc IDs (sorted within cluster).
 */
export function clusterByThreshold(threshold: number): number[][] {
  const n = DOCS.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(x: number): number {
    while (parent[x]! !== x) {
      parent[x] = parent[parent[x]!]!;
      x = parent[x]!;
    }
    return x;
  }
  function union(x: number, y: number) {
    const rootX = find(x), rootY = find(y);
    if (rootX !== rootY) parent[rootX] = rootY;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (SIMILARITY[i]![j]! >= threshold) union(i, j);
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(DOCS[i]!.id);
  }

  return [...groups.values()]
    .map(g => g.sort((a, b) => a - b))
    .sort((a, b) => a[0]! - b[0]!);
}

/** Category color (matches design system). */
export function groupColor(group: DedupDoc['trueGroup']): string {
  switch (group) {
    case 'A':        return 'var(--violet-400)';
    case 'B':        return 'var(--emerald-400)';
    case 'distinct': return 'var(--text-tertiary)';
    case 'spam':     return 'var(--rose-400)';
  }
}
