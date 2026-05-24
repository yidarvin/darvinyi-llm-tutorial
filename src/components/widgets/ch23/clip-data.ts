export type ItemKind = 'image' | 'text';

export interface EmbeddingItem {
  id: string;
  kind: ItemKind;
  /** For images: an emoji proxy; for texts: a text snippet. */
  label: string;
  /** Short caption shown on hover/highlight; the "content" the embedding represents. */
  caption: string;
  /** Pre-computed 2D position in [0, 1] × [0, 1]. */
  x: number;
  y: number;
}

/**
 * 12 items in four content clusters:
 *  - Cats:  top-left  (x ∈ [0.10, 0.30], y ∈ [0.65, 0.90])
 *  - Dogs:  bottom-left (x ∈ [0.10, 0.30], y ∈ [0.10, 0.35])
 *  - Cars:  top-right (x ∈ [0.70, 0.90], y ∈ [0.65, 0.90])
 *  - Boats: bottom-right (x ∈ [0.70, 0.90], y ∈ [0.10, 0.35])
 */
export const ITEMS: EmbeddingItem[] = [
  // Cats cluster (top-left)
  { id: 'cat-img-1', kind: 'image', label: '🐱', caption: 'a fluffy orange cat on a windowsill', x: 0.18, y: 0.82 },
  { id: 'cat-img-2', kind: 'image', label: '😺', caption: 'a black-and-white kitten sleeping',    x: 0.13, y: 0.71 },
  { id: 'cat-txt-1', kind: 'text',  label: '📄', caption: 'How to care for an orange tabby cat',  x: 0.24, y: 0.74 },

  // Dogs cluster (bottom-left)
  { id: 'dog-img-1', kind: 'image', label: '🐶', caption: 'a golden retriever puppy playing',     x: 0.15, y: 0.22 },
  { id: 'dog-txt-1', kind: 'text',  label: '📄', caption: 'Training tips for labrador retrievers', x: 0.22, y: 0.31 },
  { id: 'dog-txt-2', kind: 'text',  label: '📄', caption: 'Dogs make loyal lifelong companions',   x: 0.27, y: 0.16 },

  // Cars cluster (top-right)
  { id: 'car-img-1', kind: 'image', label: '🚗', caption: 'a red sports car on a mountain road',   x: 0.80, y: 0.84 },
  { id: 'car-img-2', kind: 'image', label: '🏎️', caption: 'a Formula-1 race car at the track',     x: 0.86, y: 0.72 },
  { id: 'car-txt-1', kind: 'text',  label: '📄', caption: 'Review of the latest red sports cars',   x: 0.74, y: 0.69 },

  // Boats cluster (bottom-right)
  { id: 'boat-img-1', kind: 'image', label: '⛵', caption: 'a sailboat on calm blue water',         x: 0.83, y: 0.20 },
  { id: 'boat-img-2', kind: 'image', label: '🚤', caption: 'a speedboat creating a foamy wake',     x: 0.76, y: 0.31 },
  { id: 'boat-txt-1', kind: 'text',  label: '📄', caption: 'Sailing technique for beginners',        x: 0.87, y: 0.13 },
];

/** Preset query: a position in the same 2D space + a label. */
export interface Query {
  id: string;
  text: string;
  /** Position chosen to be near the relevant cluster(s). */
  x: number;
  y: number;
  /** Insight text shown when this query is active. */
  insight: string;
}

export const QUERIES: Query[] = [
  {
    id: 'fluffy-pet',
    text: '"a fluffy pet"',
    x: 0.18, y: 0.55,
    insight: 'A "fluffy pet" query lands between the cats and dogs clusters — both are fluffy pets. CLIP brings the query close to *both* modalities (images and texts) about pets, even though "fluffy" appears in no document literally.',
  },
  {
    id: 'fast-vehicles',
    text: '"fast vehicles"',
    x: 0.82, y: 0.55,
    insight: 'A "fast vehicles" query lands between cars and boats — both are vehicles, both can be fast. Notice how the top neighbors include images and texts from both clusters; CLIP doesn\'t care about modality, only meaning.',
  },
  {
    id: 'ocean',
    text: '"ocean adventures"',
    x: 0.83, y: 0.22,
    insight: 'A specific query lands inside its cluster. "Ocean adventures" sits right in the boats cluster — the matching items (sailboat image, sailing technique text) cross modalities but share semantic content.',
  },
  {
    id: 'caring',
    text: '"caring for animals"',
    x: 0.20, y: 0.55,
    insight: '"Caring for animals" pulls in the care-related texts from cats and dogs. Even though the query mentions neither "cats" nor "dogs", CLIP\'s semantic match brings in both clusters — text-text matches dominate here.',
  },
  {
    id: 'red',
    text: '"anything red"',
    x: 0.60, y: 0.62,
    insight: 'Visual properties like color are encoded in CLIP. "Red" finds the red sports car image (literally red) and the orange-cat image (visually similar warm color). Color-based retrieval works because CLIP saw colors in millions of training pairs.',
  },
];

/** Euclidean distance between two points. */
export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Convert a Euclidean distance to a similarity (0-1). */
export function similarityFromDist(d: number): number {
  // In the unit square, max distance is sqrt(2) ≈ 1.414. Normalize and invert.
  return Math.max(0, Math.min(1, 1 - d / 1.0));
}

/** Find the top-K nearest items to a query. */
export function topKNearest(query: Query, items: EmbeddingItem[], k = 3): Array<{ item: EmbeddingItem; similarity: number }> {
  const scored = items.map(item => ({
    item,
    similarity: similarityFromDist(dist(query, item)),
  }));
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
}
