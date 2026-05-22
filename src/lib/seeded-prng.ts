/**
 * Mulberry32 PRNG — deterministic, seedable, fast.
 * Returns a function that produces values in [0, 1).
 *
 * Use whenever a widget needs random values that should be reproducible.
 * Never use Math.random() for anything that affects visual output —
 * see DESIGN_SYSTEM.md "Widget aesthetics" section.
 */
export function seededPRNG(seed: number): () => number {
  let state = seed >>> 0;
  return function rand(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer in [min, max). */
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min)) + min;
}

/** Random float in [min, max). */
export function randFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

/** Pick a uniform-random element from an array. Throws on empty array. */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('Cannot pick from empty array');
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Fisher-Yates shuffle using a seeded RNG. Returns a new array. */
export function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Random normal via Box-Muller transform.
 * Useful for widgets that need Gaussian-distributed values.
 */
export function randNormal(rng: () => number, mean = 0, std = 1): number {
  const u = 1 - rng();
  const v = rng();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return z * std + mean;
}
