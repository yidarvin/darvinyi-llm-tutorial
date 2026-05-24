/**
 * Procedural "image" geometry for the ViT patch tokenizer widget.
 *
 * Conceptually the widget shows a 128×128 image split into 8×8 patches
 * (each patch is 16×16 pixels = 256 pixels = 768 values across 3 RGB channels).
 *
 * The "image" is a stylized landscape rendered via SVG:
 *  - Sky gradient (top)
 *  - Sun (yellow circle, upper right)
 *  - Mountain (gray triangle, middle-left)
 *  - Ground (green gradient, bottom)
 *
 * Each patch's mean RGB is computed from this scene geometry,
 * giving each patch a distinctive color signature.
 */

export const IMAGE_SIZE = 128;
export const PATCH_SIZE = 16;
export const GRID_SIZE = IMAGE_SIZE / PATCH_SIZE; // 8
export const N_PATCHES = GRID_SIZE * GRID_SIZE; // 64
export const EMBED_DIM = 768; // standard ViT-Base
export const PATCH_FLAT_DIM = PATCH_SIZE * PATCH_SIZE * 3; // 768

/** A patch's metadata and pre-computed mean RGB. */
export interface Patch {
  index: number; // raster order, 0..63
  row: number; // 0..7
  col: number; // 0..7
  meanR: number; // 0..255
  meanG: number;
  meanB: number;
  /** A short label describing what part of the scene the patch covers. */
  region: 'sky' | 'sun' | 'mountain' | 'ground' | 'horizon';
}

/**
 * Compute mean RGB for a patch based on its (row, col) in the 8×8 grid.
 * This is the "ground truth" the widget displays for the selected patch.
 *
 * Scene layout (8×8 grid):
 *  Rows 0-2: SKY (light blue, getting deeper toward top)
 *  Row 3:    HORIZON (mix of sky and ground)
 *  Rows 4-6: MOUNTAIN region (gray triangle in cols 1-4)
 *  Rows 4-7: GROUND elsewhere (green gradient)
 *  Sun:      Row 1, Col 6 (yellow circle)
 */
export function computePatchRGB(
  row: number,
  col: number,
): { r: number; g: number; b: number; region: Patch['region'] } {
  // Sun: bright yellow circle at (row 1, col 6)
  if (row === 1 && col === 6) {
    return { r: 250, g: 210, b: 70, region: 'sun' };
  }
  if (row === 1 && col === 5) {
    return { r: 220, g: 200, b: 130, region: 'sun' };
  }
  if (row === 2 && col === 6) {
    return { r: 220, g: 200, b: 130, region: 'sun' };
  }

  // Sky: rows 0-2 (excluding sun patches above)
  if (row <= 2) {
    const skyR = 130 - row * 5;
    const skyG = 180 - row * 5;
    const skyB = 230;
    return { r: skyR, g: skyG, b: skyB, region: 'sky' };
  }

  // Horizon (row 3): blend of sky and ground
  if (row === 3) {
    return { r: 110, g: 140, b: 180, region: 'horizon' };
  }

  // Mountain: gray triangle in rows 4-6, cols 1-4 (rough triangle)
  if (row >= 4 && row <= 6) {
    const minCol = Math.max(1, 4 - (6 - row));
    const maxCol = Math.min(4, 1 + (6 - row));
    if (col >= minCol && col <= maxCol) {
      const grayShade = 90 + (6 - row) * 5;
      return { r: grayShade, g: grayShade, b: grayShade + 10, region: 'mountain' };
    }
  }

  // Ground: rows 4-7 (everything not mountain)
  if (row >= 4) {
    const groundG = 130 + (row - 4) * 10;
    return { r: 70, g: groundG, b: 80, region: 'ground' };
  }

  return { r: 100, g: 100, b: 100, region: 'ground' };
}

/** Build all 64 patches. */
export function buildPatches(): Patch[] {
  const patches: Patch[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const { r, g, b, region } = computePatchRGB(row, col);
      patches.push({
        index: row * GRID_SIZE + col,
        row,
        col,
        meanR: r,
        meanG: g,
        meanB: b,
        region,
      });
    }
  }
  return patches;
}

/** Format RGB as a CSS color string. */
export function rgbCss(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Pre-computed "projection" sketch for the selected patch.
 * In reality the patch is flattened to 768 values then projected to 768 (learned linear layer).
 * For visualization, we show 16 representative values derived from the patch's mean RGB.
 *
 * The values are computed via a fixed pseudo-random projection seeded by patch index,
 * so each patch gets a reproducible distinctive "signature."
 */
export function sketchProjection(patch: Patch, n = 16): number[] {
  const out: number[] = [];
  let seed = patch.index * 7919 + patch.meanR * 31 + patch.meanG * 17 + patch.meanB * 13;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const noise = (seed / 0x7fffffff - 0.5) * 0.5;
    const channelMix = (patch.meanR / 255 + patch.meanG / 255 + patch.meanB / 255) / 3 - 0.5;
    out.push(channelMix + noise);
  }
  return out;
}
