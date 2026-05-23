# Session 105 — Ch 23 ViT patch tokenizer + exercises + closeout

> **The Chapter 23 closeout — and the file that closes Phase 13.** Three deliverables: (1) implement the **ViT Patch Tokenizer** secondary widget — a small procedurally-rendered image (a stylized landscape) overlaid with an 8×8 grid; reader clicks any patch; sees the patch's position, mean RGB, and a sketch of its 768-dim token representation; (2) add an **Exercises section** with 4 problems (patch embedding implementation, CLIP cosine-similarity matrix, multimodal RAG with CLIP embeddings, multimodal hallucination evaluation); (3) flip Ch 23's status from `'draft'` to `'published'`. **Closes Ch 23 — and Phase 13 with it.** The capability arc (Reasoning → Tool use → RAG → Multimodal) is complete. Phase 14 (Safety, Interp, Eval) opens next.

This is a **single-topic chapter** (4-file cadence). The secondary widget combines with exercises in this final session — the standard closeout pattern. **File 133 is the file that closes the capability arc.**

---

## Read first (in this order)

1. **`research/ch23-multimodal/research.md`** — concepts 2 (ViT) and 6-8 (multimodal RAG, computer use, Phase 13 close) are the source material
2. **`prompts/chapters/ch23-multimodal/session-103-page-structure.md`** — for the section-2 widget placeholder and exercise placement
3. **`prompts/chapters/ch23-multimodal/session-104-clip-embedding-space-widget.md`** — for the Ch 23 widget conventions
4. **`prompts/chapters/ch22-retrieval-and-rag/session-100-chunking-visualizer-and-exercises-and-closeout.md`** — for the recent closeout pattern

---

## Goal

By end of session, three things change in the repo:

1. **`ViTPatchTokenizer` widget** is implemented and wired into section 2. Replaces the existing `<WidgetFrame>` placeholder.
2. **An "Exercises" section** is inserted into `index.mdx`. Per the section structure, this goes between section 7 ("Computer use as visual agent") and section 8 ("Closing Phase 13 / opening Phase 14"). Four exercises with hints + runnable starter code.
3. **Ch 23's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 23 is the twenty-third published chapter — and the last of Phase 13. Phase 13 closes.**

After this session: **Ch 23 is complete. Phase 13 is complete.** **Phase 14 opens next** with Ch 24 (Safety).

---

## Inputs

State of the repo after session 104:

- Section 3's `CLIPEmbeddingSpace` marquee widget is wired
- Section 2's widget is still stubbed
- All 3 runnable code blocks from session 103 are in place
- `src/lib/chapters.ts` has Ch 1-22 `'published'`, Ch 23 `'draft'`
- `src/components/widgets/ch23/` exists with `CLIPEmbeddingSpace` already

---

## Deliverables

1. **Create** `src/components/widgets/ch23/ViTPatchTokenizer.tsx` — the React widget
2. **Create** `src/components/widgets/ch23/ViTPatchTokenizer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch23/vit-data.ts` — image data, patch geometry, RGB sampling, projection sketch
4. **Update** `src/components/widgets/index.ts` — add `ViTPatchTokenizer` export
5. **Update** `src/pages/ch23-multimodal/index.mdx`:
   - Replace section-2's `<WidgetFrame>` interior with `<ViTPatchTokenizer client:visible />`
   - Insert new `## Exercises` section between section 7 ("Computer use as visual agent") and section 8 ("Closing Phase 13 / opening Phase 14")
6. **Update** `src/lib/chapters.ts` — change Ch 23's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 23's marquee widget is sealed.

---

## Detailed spec

### Part A — `ViTPatchTokenizer` widget

#### A.1 `vit-data.ts`

```ts
// src/components/widgets/ch23/vit-data.ts

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
export const GRID_SIZE = IMAGE_SIZE / PATCH_SIZE;   // 8
export const N_PATCHES = GRID_SIZE * GRID_SIZE;     // 64
export const EMBED_DIM = 768;                       // standard ViT-Base
export const PATCH_FLAT_DIM = PATCH_SIZE * PATCH_SIZE * 3;   // 768

/** A patch's metadata and pre-computed mean RGB. */
export interface Patch {
  index: number;       // raster order, 0..63
  row: number;         // 0..7
  col: number;         // 0..7
  meanR: number;       // 0..255
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
export function computePatchRGB(row: number, col: number): { r: number; g: number; b: number; region: Patch['region'] } {
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
    // Lighter toward the top, slightly bluer toward middle
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
    // Triangle: col range narrows as we go up (closer to peak)
    const minCol = Math.max(1, 4 - (6 - row));   // row 6 → cols 2..4; row 5 → cols 2..3; row 4 → col 3 only
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

  // Default: shouldn't reach here
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
        row, col,
        meanR: r, meanG: g, meanB: b,
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
  // Seed based on patch index + RGB so neighboring patches get similar but distinct sketches
  let seed = patch.index * 7919 + patch.meanR * 31 + patch.meanG * 17 + patch.meanB * 13;
  // Simple LCG
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const noise = (seed / 0x7fffffff - 0.5) * 0.5;     // [-0.25, 0.25]
    // Bias by RGB: each value reflects a weighted combination of channels + structured noise
    const channelMix = ((patch.meanR / 255 + patch.meanG / 255 + patch.meanB / 255) / 3 - 0.5);
    out.push(channelMix + noise);   // values roughly in [-0.75, 0.75]
  }
  return out;
}
```

#### A.2 Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│ ViT patch tokenizer                                              │
│                                                                  │
│ A 128×128 stylized landscape is split into an 8×8 grid of        │
│ 16×16-pixel patches. Each patch becomes one visual token.        │
│                                                                  │
│ ┌────────────────────┐    Selected patch                          │
│ │                    │    ┌───────────────────────────────────┐  │
│ │      [image with   │    │ Position: row 1, col 6 (index 14) │  │
│ │       8×8 grid     │    │ Region: sun                        │  │
│ │       overlay]     │    │                                    │  │
│ │                    │    │ Mean RGB: rgb(250, 210, 70)        │  │
│ │   each patch is    │    │ [color swatch]                     │  │
│ │   clickable        │    │                                    │  │
│ │                    │    │ Flatten:                           │  │
│ │   selected = cyan  │    │ 16 × 16 × 3 = 768 raw values       │  │
│ │   ring             │    │                                    │  │
│ │                    │    │ Project to 768-dim embedding:      │  │
│ │                    │    │ ┌──────────────────────────────┐   │  │
│ │                    │    │ │ ▎▎▎▎▎▎ (16 sample values)   │   │  │
│ │                    │    │ │ visualized as a sparkline    │   │  │
│ │                    │    │ └──────────────────────────────┘   │  │
│ └────────────────────┘    └───────────────────────────────────┘  │
│                                                                  │
│ Pedagogical caption                                               │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click a patch in the grid → highlights it (cyan ring around the patch border); updates the right panel
- The image renders as an SVG with 8×8 colored squares (one per patch); a grid overlay (1px lines) shows boundaries
- Selected patch indicator: cyan ring inside the patch
- The right panel updates: position, region, mean RGB, color swatch, flatten arithmetic, projection sketch sparkline

**Visual encoding:**
- **Patch grid**: 8×8 of colored squares; each filled with the patch's mean RGB
- **Grid overlay**: thin gray lines between patches
- **Selected patch**: cyan ring (3px); slightly raised z-index visual effect
- **Color swatch**: small colored square in the details panel matching the patch
- **Projection sketch**: 16 vertical bars (sparkline); height proportional to absolute value; cyan for positive, amber for negative — a compact visualization of "the projected embedding"

#### A.3 `ViTPatchTokenizer.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  buildPatches, sketchProjection, rgbCss,
  IMAGE_SIZE, PATCH_SIZE, GRID_SIZE, PATCH_FLAT_DIM, EMBED_DIM,
  type Patch,
} from './vit-data';
import styles from './ViTPatchTokenizer.module.css';

export default function ViTPatchTokenizer() {
  const patches = useMemo(() => buildPatches(), []);
  const [selectedIdx, setSelectedIdx] = useState<number>(14);   // default: the sun patch
  const selected = patches[selectedIdx]!;
  const projection = useMemo(() => sketchProjection(selected), [selected]);

  // SVG sizing — make the image square; ~340px on desktop
  const SVG_SIZE = 340;
  const PX_PER_PATCH = SVG_SIZE / GRID_SIZE;   // 42.5

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>ViT patch tokenizer</div>
        <div className={styles.titleSubLabel}>
          128×128 image · 8×8 grid · 16×16 patches · each becomes one visual token
        </div>
      </div>

      {/* Intro caption */}
      <div className={styles.introPanel}>
        A 128×128 stylized landscape (sky, sun, mountain, ground) is split into an 8×8 grid
        of 16×16-pixel patches. <strong>Each patch becomes one visual token</strong> when fed
        into a Vision Transformer. Click any patch to see what one token represents.
      </div>

      {/* Main two-column area: image grid + details panel */}
      <div className={styles.mainGrid}>
        {/* Left: clickable patch grid (SVG) */}
        <div className={styles.imagePanel}>
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className={styles.imageSvg}
            role="img"
            aria-label="Stylized landscape, 8 by 8 patch grid"
          >
            {/* Patch fills */}
            {patches.map(p => (
              <rect
                key={`fill-${p.index}`}
                x={p.col * PX_PER_PATCH}
                y={p.row * PX_PER_PATCH}
                width={PX_PER_PATCH}
                height={PX_PER_PATCH}
                fill={rgbCss(p.meanR, p.meanG, p.meanB)}
                onClick={() => setSelectedIdx(p.index)}
                className={styles.patchRect}
              />
            ))}
            {/* Grid lines */}
            {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
              <g key={`grid-${i}`}>
                <line
                  x1={i * PX_PER_PATCH} y1={0}
                  x2={i * PX_PER_PATCH} y2={SVG_SIZE}
                  className={styles.gridLine}
                />
                <line
                  x1={0} y1={i * PX_PER_PATCH}
                  x2={SVG_SIZE} y2={i * PX_PER_PATCH}
                  className={styles.gridLine}
                />
              </g>
            ))}
            {/* Selected patch ring */}
            <rect
              x={selected.col * PX_PER_PATCH + 2}
              y={selected.row * PX_PER_PATCH + 2}
              width={PX_PER_PATCH - 4}
              height={PX_PER_PATCH - 4}
              className={styles.selectedRing}
            />
          </svg>
          <div className={styles.imageCaption}>
            Click a patch to inspect →
          </div>
        </div>

        {/* Right: selected patch details */}
        <div className={styles.detailsPanel}>
          {/* Position */}
          <div className={styles.detailsRow}>
            <div className={styles.detailsLabel}>Position</div>
            <div className={styles.detailsValue}>
              row {selected.row}, col {selected.col}
              <span className={styles.detailsAux}>· index {selected.index} of {GRID_SIZE * GRID_SIZE - 1}</span>
            </div>
          </div>

          {/* Region */}
          <div className={styles.detailsRow}>
            <div className={styles.detailsLabel}>Region</div>
            <div className={styles.detailsValue}>
              <span className={styles.regionBadge} data-region={selected.region}>
                {selected.region}
              </span>
            </div>
          </div>

          {/* Mean RGB */}
          <div className={styles.detailsRow}>
            <div className={styles.detailsLabel}>Mean RGB</div>
            <div className={styles.detailsValue}>
              <span
                className={styles.colorSwatch}
                style={{ background: rgbCss(selected.meanR, selected.meanG, selected.meanB) }}
              />
              <span className={styles.rgbText}>
                ({selected.meanR}, {selected.meanG}, {selected.meanB})
              </span>
            </div>
          </div>

          {/* Flatten */}
          <div className={styles.detailsRow}>
            <div className={styles.detailsLabel}>Flatten</div>
            <div className={styles.detailsValue}>
              <span className={styles.formula}>
                {PATCH_SIZE} × {PATCH_SIZE} × 3 = <strong>{PATCH_FLAT_DIM}</strong> raw values
              </span>
            </div>
          </div>

          {/* Projection */}
          <div className={styles.detailsRow}>
            <div className={styles.detailsLabel}>Projected to</div>
            <div className={styles.detailsValue}>
              <span className={styles.formula}>
                <strong>{EMBED_DIM}-dim</strong> embedding (= 1 visual token)
              </span>
              <div className={styles.projectionSketch}>
                {projection.map((v, i) => (
                  <div
                    key={i}
                    className={styles.projBar}
                    style={{
                      height: `${Math.abs(v) * 100 + 5}%`,
                      background: v >= 0 ? 'var(--cyan-400)' : 'var(--amber-400)',
                      bottom: v >= 0 ? '50%' : 'auto',
                      top: v < 0 ? '50%' : 'auto',
                    }}
                    title={`projection[${i}] = ${v.toFixed(2)}`}
                  />
                ))}
              </div>
              <div className={styles.projCaption}>
                (sparkline shows 16 of {EMBED_DIM} dims; cyan = positive, amber = negative)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Click different patches to compare. <strong>Sky patches</strong> are bluish; <strong>the sun
        patch</strong> is bright yellow; <strong>mountain patches</strong> are gray; <strong>ground
        patches</strong> are green. After patch embedding, an image becomes a sequence of {GRID_SIZE * GRID_SIZE}
        visual tokens (plus a <code>[CLS]</code> token), each a {EMBED_DIM}-dim vector. <strong>From the
        transformer's perspective, these are indistinguishable from text tokens</strong> — just vectors
        in a sequence. This is the mechanism that lets the same architecture handle vision and language.
      </div>
    </div>
  );
}
```

#### A.4 `ViTPatchTokenizer.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .introPanel, .imagePanel, .detailsPanel, .caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.titlePanel { padding: 0.7rem 1rem; }
.titleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  color: var(--text-primary);
  font-weight: 500;
}
.titleSubLabel {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}

/* Intro */
.introPanel {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.introPanel strong { color: var(--cyan-300); font-weight: 500; }

/* Main two-column grid */
.mainGrid {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}

/* Image panel */
.imagePanel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  padding: 0.85rem;
  margin-bottom: 0;
}
.imageSvg {
  width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  shape-rendering: crispEdges;
}
.patchRect {
  cursor: pointer;
  transition: opacity 200ms;
}
.patchRect:hover {
  opacity: 0.82;
}
.gridLine {
  stroke: rgba(0, 0, 0, 0.15);
  stroke-width: 0.5;
  pointer-events: none;
}
.selectedRing {
  fill: none;
  stroke: var(--cyan-400);
  stroke-width: 3;
  pointer-events: none;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--cyan-500) 50%, transparent));
}
.imageCaption {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  font-style: italic;
}

/* Details panel */
.detailsPanel {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1rem;
  margin-bottom: 0;
}
.detailsRow {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.detailsLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}
.detailsValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.detailsAux {
  color: var(--text-tertiary);
  font-size: 0.78rem;
}

.regionBadge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-transform: capitalize;
}
.regionBadge[data-region='sky'] { background: rgba(135, 180, 230, 0.25); color: #6aa1ce; }
.regionBadge[data-region='sun'] { background: rgba(250, 210, 70, 0.25); color: var(--amber-400); }
.regionBadge[data-region='mountain'] { background: rgba(140, 140, 150, 0.25); color: #a8a8b8; }
.regionBadge[data-region='ground'] { background: rgba(70, 150, 80, 0.25); color: var(--emerald-400); }
.regionBadge[data-region='horizon'] { background: rgba(110, 140, 180, 0.25); color: #88a4c8; }

.colorSwatch {
  display: inline-block;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
  vertical-align: middle;
}
.rgbText {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.formula {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.formula strong {
  color: var(--cyan-300);
  font-weight: 500;
}

.projectionSketch {
  display: flex;
  width: 100%;
  height: 60px;
  margin-top: 0.45rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 0.2rem;
  gap: 1px;
  align-items: flex-end;
  position: relative;
}
.projectionSketch::before {
  content: '';
  position: absolute;
  left: 0; right: 0;
  top: 50%;
  height: 1px;
  background: var(--border-subtle);
  pointer-events: none;
}
.projBar {
  flex: 1;
  min-width: 4px;
  position: relative;
  border-radius: 1px;
  transition: height 250ms;
}
.projCaption {
  font-size: 0.72rem;
  color: var(--text-tertiary);
  margin-top: 0.3rem;
  font-style: italic;
}

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }
.caption code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  padding: 0.05rem 0.3rem;
  background: var(--bg-primary);
  border-radius: 2px;
  color: var(--text-primary);
}

@media (max-width: 720px) {
  .mainGrid { grid-template-columns: 1fr; gap: 0.7rem; }
  .imagePanel { padding: 0.6rem; }
  .imageSvg { max-width: 320px; }
  .detailsValue { font-size: 0.78rem; }
  .projectionSketch { height: 50px; }
}
```

#### A.5 Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as CLIPEmbeddingSpace } from './ch23/CLIPEmbeddingSpace';
export { default as ViTPatchTokenizer } from './ch23/ViTPatchTokenizer';
```

#### A.6 Update `src/pages/ch23-multimodal/index.mdx`

**Edit A: Update widget import:**

```mdx
import { CLIPEmbeddingSpace, ViTPatchTokenizer } from '@components/widgets';
```

**Edit B: Replace section-2's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="ViT patch tokenizer" caption="A 128×128 stylized landscape image is split into an 8×8 grid of 16×16-pixel patches. Click any patch to inspect what becomes one visual token: position in the grid, mean RGB color, the flatten arithmetic (16×16×3 = 768 raw values), and a sparkline sketch of the 768-dim projected embedding. After patch embedding, the transformer doesn't know it's processing an image — it sees a token sequence, just like text.">
  <ViTPatchTokenizer client:visible />
</WidgetFrame>
```

### Part B — Exercises section

Insert between section 7 ("Computer use as visual agent") and section 8 ("Closing Phase 13 / opening Phase 14"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the multimodal stack. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

The exercises trace the chapter's arc: tokenize an image (Ex 1) → align with text via CLIP (Ex 2) → use the shared space for retrieval (Ex 3) → evaluate multimodal faithfulness (Ex 4).

### Exercise 1 (easy) — Patch embedding implementation

Implement ViT-style patch embedding from scratch: take an image array, split into patches, flatten each, project to a fixed embedding dim, add positional encoding.

<details>
<summary>Hint</summary>

The full ViT patch-embed pipeline:
1. Take an image of shape `(H, W, C)`. Standard: `(224, 224, 3)`.
2. Split into `(H/P) × (W/P)` patches, each of shape `(P, P, C)`. For `P = 16`: 196 patches.
3. Flatten each patch to a 1D vector of length `P × P × C` (= 768 for 16×16 RGB).
4. Apply a linear projection (a learned matrix `W ∈ ℝ^{(P²C) × D}`) to get an embedding of dim `D` (e.g., 768).
5. Add positional encoding (learned or sinusoidal) — each patch position gets a unique vector.
6. (Optional) Prepend a `[CLS]` token.

The full output shape: `(N + 1, D)` where N = number of patches, D = embedding dim, +1 for `[CLS]`.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def patch_embed(image, patch_size=16, embed_dim=768):
    """
    Apply ViT-style patch embedding to a single image.
    
    image: shape (H, W, C), e.g., (224, 224, 3)
    Returns: shape (N + 1, embed_dim), where N = (H/patch_size) * (W/patch_size)
    """
    H, W, C = image.shape
    n_patches_h = H // patch_size
    n_patches_w = W // patch_size
    n_patches = n_patches_h * n_patches_w
    
    # TODO:
    # 1. Slice the image into patches.
    # 2. Flatten each patch to a 1D vector of length patch_size * patch_size * C.
    # 3. Stack patches into shape (n_patches, patch_flat_dim).
    # 4. Apply a linear projection (use np.random.seed(0); shape (patch_flat_dim, embed_dim)).
    # 5. Add a positional encoding (use np.random.seed(1); shape (n_patches, embed_dim)).
    # 6. Prepend a [CLS] token (a single learnable vector; use np.random.seed(2)).
    # 7. Return shape (n_patches + 1, embed_dim).
    pass


# Test
np.random.seed(42)
image = np.random.rand(224, 224, 3) * 255

# tokens = patch_embed(image)
# print(f"Image shape:          {image.shape}")
# print(f"Token sequence shape: {tokens.shape}    (should be (197, 768) — 196 patches + 1 CLS)")
# print(f"Each token is a {tokens.shape[1]}-dim vector")
# 
# # Observations:
# # - The transformer that processes this output doesn't know the input was an image
# # - The token sequence shape (197, 768) is what BERT-Base would produce for a 196-token sentence
# # - This is the architectural unification that enables multimodal models
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — CLIP cosine similarity matrix

Compute the CLIP-style cosine similarity matrix for a small batch of (image, caption) pairs. Verify the diagonal-vs-off-diagonal structure that the contrastive loss produces.

<details>
<summary>Hint</summary>

Given:
- Image embeddings $E^I \in \\mathbb{R}^{N \\times D}$ (L2-normalized rows)
- Text embeddings $E^T \in \\mathbb{R}^{N \\times D}$ (L2-normalized rows)

The similarity matrix is the dot product:

$$S = E^I (E^T)^\\top \\in \\mathbb{R}^{N \\times N}$$

with $s_{ij} = \\cos(\\mathbf{e}^I_i, \\mathbf{e}^T_j)$.

After CLIP training:
- **Diagonal** $s_{ii}$ should be HIGH (paired image-text)
- **Off-diagonal** $s_{ij}$ for $i \\neq j$ should be LOW (unpaired)

For this exercise, generate mock embeddings with injected "paired" structure, then verify the property.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def cosine_similarity_matrix(image_embs, text_embs):
    """
    Compute the N x N cosine similarity matrix between image and text embeddings.
    
    image_embs: shape (N, D)
    text_embs:  shape (N, D)
    Returns:    shape (N, N), where entry (i, j) = cos(img_i, text_j)
    """
    # TODO:
    # 1. L2-normalize each row of image_embs and text_embs.
    # 2. Return image_embs @ text_embs.T
    pass


# Generate mock embeddings with paired structure
np.random.seed(0)
N = 5    # batch of 5 (image, caption) pairs
D = 256

image_embs = np.random.randn(N, D)
text_embs = np.random.randn(N, D)

# Inject paired structure: each text embedding is biased toward its image
for i in range(N):
    text_embs[i] += 0.7 * image_embs[i]

# Test
# sim_matrix = cosine_similarity_matrix(image_embs, text_embs)
# 
# print(f"Cosine similarity matrix (should have high diagonal, low off-diagonal):\\n")
# print(f"{'':>10}", " ".join(f"text_{j}" for j in range(N)))
# for i in range(N):
#     print(f"image_{i}:  ", " ".join(f"{v:>6.2f}" for v in sim_matrix[i]))
# 
# # Verify diagonal vs off-diagonal
# diag_mean = np.mean(np.diag(sim_matrix))
# off_diag_mean = (sim_matrix.sum() - sim_matrix.trace()) / (N * N - N)
# print(f"\\nDiagonal mean (paired):       {diag_mean:>5.3f}")
# print(f"Off-diagonal mean (unpaired): {off_diag_mean:>5.3f}")
# print(f"Gap (should be positive):     {diag_mean - off_diag_mean:>5.3f}")
# 
# # Observations:
# # - Diagonal entries should be noticeably higher than off-diagonal
# # - The bigger the gap, the better the model is at distinguishing pairs
# # - CLIP's training objective directly optimizes this gap
`}
  packages={["numpy"]}
/>

### Exercise 3 (medium) — Multimodal RAG with CLIP embeddings

Build a tiny multimodal RAG system. Index a small corpus of items (images and texts) using mock CLIP embeddings; answer a text query by retrieving top-K nearest items across both modalities.

<details>
<summary>Hint</summary>

The pattern:
1. **Pre-compute**: for each corpus item (image or text), compute a CLIP-style embedding. Both modalities map to the same D-dim space.
2. **At query time**: embed the query (text); compute cosine similarity to each corpus embedding; sort descending; return top-K.
3. **Results are mixed**: top-K can include both images and texts — they live in the same space.

For the exercise: use a mock embedding function. Real CLIP would use the trained encoders.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

# Mock corpus: a mix of image and text items
corpus = [
    {'kind': 'image', 'id': 'img_cat',     'content': 'a fluffy orange cat'},
    {'kind': 'image', 'id': 'img_dog',     'content': 'a black labrador puppy'},
    {'kind': 'image', 'id': 'img_car',     'content': 'a red sports car'},
    {'kind': 'image', 'id': 'img_boat',    'content': 'a small sailboat'},
    {'kind': 'text',  'id': 'txt_cat',     'content': 'How to care for an orange tabby cat'},
    {'kind': 'text',  'id': 'txt_dog',     'content': 'Training tips for labrador retrievers'},
    {'kind': 'text',  'id': 'txt_car',     'content': 'Review of red sports cars'},
    {'kind': 'text',  'id': 'txt_sailing', 'content': 'Beginner sailing technique'},
]

def mock_clip_embed(text, dim=512):
    """
    Mock CLIP embedding. In production: use a real CLIP forward pass.
    Returns an L2-normalized vector with structure biased by keyword presence.
    """
    seed = sum(ord(c) for c in text)
    rng = np.random.RandomState(seed)
    v = rng.randn(dim)
    # Bias by keyword presence (mimicking what CLIP learns)
    for keyword, axis_start in [('cat', 0), ('dog', 10), ('labrador', 10), ('car', 20), ('sailboat', 30), ('sailing', 30)]:
        if keyword in text.lower():
            v[axis_start:axis_start + 5] += 2.0
    return v / np.linalg.norm(v)


def multimodal_rag_retrieve(query_text, corpus, top_k=3):
    """
    Embed the query; rank corpus items by cosine similarity; return top-K.
    Each item's embedding is computed from its 'content' field.
    Returns list of (item, similarity).
    """
    # TODO:
    # 1. Embed the query.
    # 2. For each corpus item, embed its content and compute cosine similarity to query.
    # 3. Sort descending by similarity; return top_k.
    pass


# Test
queries = [
    "tips for caring for a cat",     # should retrieve cat items (image + text)
    "fast vehicles",                  # should retrieve car (and maybe boat)
    "sailing for beginners",          # should retrieve sailing items
]

# for q in queries:
#     results = multimodal_rag_retrieve(q, corpus, top_k=3)
#     print(f"\\nQuery: '{q}'")
#     for item, sim in results:
#         print(f"  sim={sim:>5.2f}  [{item['kind']:>5}]  {item['content']}")
# 
# # Observations:
# # - Top-K mixes images and texts — both are searched in the same embedding space
# # - "tips for caring for a cat" finds BOTH the cat image AND the cat-care text
# # - Cross-modal retrieval is what CLIP enables; no separate image and text indexes needed
# # - This is multimodal RAG in 30 lines of code.
`}
  packages={["numpy"]}
/>

### Exercise 4 (hard) — Multimodal hallucination detection

Implement a faithfulness check for VLM outputs: given a model's caption of an image and the image's ground-truth tags, identify hallucinated entities (objects mentioned in the caption that aren't actually in the image).

<details>
<summary>Hint</summary>

VLM hallucinations are real: models can describe objects that aren't in the image. Detecting them is a key part of multimodal evaluation (e.g., the POPE benchmark).

The check:
1. Tokenize the caption; extract candidate object words (nouns: "cat", "table", "book").
2. For each candidate, check if it's in the image's ground-truth tag set.
3. Candidates not in the ground-truth tags are **potential hallucinations**.

Simplification for this exercise:
- Skip POS tagging — use a simple object-name vocabulary.
- Tag sets are pre-provided (no real object detection).

Real implementations use better NLP and detection models, but the core idea is the same: **compare what the model says to what's actually there.**

</details>

<RunnableCode
  client:visible
  defaultCode={`# A tiny object vocabulary (in production: WordNet, NLTK POS tags, or detection-model labels)
OBJECT_VOCAB = {
    'cat', 'dog', 'puppy', 'kitten', 'car', 'boat', 'sailboat',
    'tree', 'house', 'person', 'mountain', 'sun', 'cloud',
    'book', 'table', 'chair', 'window', 'sky', 'grass',
    'ball', 'guitar', 'flower', 'bird', 'fish',
}

def extract_objects(caption, vocab):
    """Return the set of vocab objects mentioned in the caption."""
    words = set(caption.lower().replace('.', '').replace(',', '').split())
    return words & vocab


def detect_hallucinations(caption, ground_truth_tags, vocab=OBJECT_VOCAB):
    """
    Compare the caption's mentioned objects to the ground-truth tags.
    Returns (mentioned, hallucinated, missed).
    
    mentioned:    objects the caption refers to (from vocab)
    hallucinated: objects in mentioned but NOT in ground_truth_tags
    missed:       objects in ground_truth_tags but NOT mentioned
    """
    # TODO:
    # 1. mentioned = extract_objects(caption, vocab)
    # 2. hallucinated = mentioned - ground_truth_tags
    # 3. missed = ground_truth_tags - mentioned
    # 4. Return all three sets
    pass


# Test cases
test_cases = [
    {
        'image_id': 'img_001',
        'ground_truth': {'cat', 'window', 'sun'},
        'model_caption': 'A fluffy orange cat sitting on a sunny windowsill.',
    },
    {
        'image_id': 'img_002',
        'ground_truth': {'dog', 'grass', 'tree'},
        'model_caption': 'A puppy playing in the grass with a ball, near a tree.',     # hallucinated 'puppy' and 'ball'!
    },
    {
        'image_id': 'img_003',
        'ground_truth': {'car', 'mountain'},
        'model_caption': 'A red sports car on a mountain road, with a person waving.',  # hallucinated 'person'
    },
]

# for case in test_cases:
#     mentioned, hallucinated, missed = detect_hallucinations(case['model_caption'], case['ground_truth'])
#     print(f"\\nImage: {case['image_id']}")
#     print(f"  Caption: {case['model_caption']}")
#     print(f"  Ground truth:   {sorted(case['ground_truth'])}")
#     print(f"  Mentioned:      {sorted(mentioned)}")
#     print(f"  Hallucinated:   {sorted(hallucinated)}   {'⚠️' if hallucinated else '✓'}")
#     print(f"  Missed:         {sorted(missed)}")
# 
# # Observations:
# # - Case 1: clean — all mentioned objects are in ground truth, none missing
# # - Case 2: 'puppy' (similar to 'dog' but in vocab as separate) and 'ball' are hallucinations
# # - Case 3: 'person' is hallucinated; the image actually only has car + mountain
# # - This is the kernel of multimodal hallucination evaluation
# # - Real systems use better object recognition + nuanced scoring (POPE, etc.)
`}
  packages={[]}
/>

````

### Part C — Flip Ch 23's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 23, slug: 'ch23-multimodal', title: 'Multimodal', partNum: 7, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 23 still render correctly (no changes to existing sections).
3. **Section 3's** `CLIPEmbeddingSpace` marquee widget still renders correctly.
4. **Section 2** now renders the working `ViTPatchTokenizer` widget.
5. **Default state**: the sun patch (row 1, col 6) is selected. Image grid shows the 8×8 stylized landscape.
6. **Image rendering**: 64 colored squares forming a recognizable landscape — blue sky at top with yellow sun, gray mountain triangle, green ground at bottom.
7. **Grid overlay**: faint lines between patches.
8. **Click a patch**: the right-side details panel updates immediately. Position, region, mean RGB swatch, flatten formula, and projection sparkline all change.
9. **Selected patch**: cyan ring around its border in the SVG image.
10. **Region badges**: color-coded — sky/sun/mountain/ground/horizon each have distinct badge styling.
11. **Projection sparkline**: 16 vertical bars; positive bars cyan (extending up from midline), negative bars amber (extending down).
12. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
13. **Sidebar**: Ch 1-23 all active (published); Ch 24-30 still dimmed.
14. **Prev/next at bottom of Ch 23**: prev = Ch 22 (active); next = Ch 24 (disabled).
15. **TOC**: includes Exercises as h2 between section 7 and section 8.
16. **Mobile**: layout stacks; image scales; projection sketch remains visible.
17. **`npm run typecheck`** passes.
18. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not allow uploading custom images** in the widget. Procedural rendering only.
- ❌ **Do not call a real ViT or CLIP model.** Pre-computed RGB and mock projections.
- ❌ **Do not flip any other chapter's status.** Only Ch 23 flips.
- ❌ **Do not modify Ch 1-22.** Sealed.
- ❌ **Do not modify Ch 23's marquee widget or prose sections 1-8.** Sealed. (Only insert the new Exercises section between sections 7 and 8.)
- ❌ **Do not implement real ViT positional encodings.** The widget's "projection sparkline" is a sketch, not real math.

---

## Wire-up

```bash
git add src/components/widgets/ch23/ViTPatchTokenizer.tsx src/components/widgets/ch23/ViTPatchTokenizer.module.css src/components/widgets/ch23/vit-data.ts src/components/widgets/index.ts src/pages/ch23-multimodal/index.mdx src/lib/chapters.ts
git commit -m "session 105: Ch 23 closeout — ViT patch tokenizer + exercises + status: published. Phase 13 capability arc complete."
git push origin main
```

---

## Ch 23 closeout — Phase 13 closes here

Chapter 23 is now the twenty-third complete chapter on production. **Phase 13 is complete.** The capability arc — reasoning (Ch 20), tool use (Ch 21), retrieval (Ch 22), multimodal (Ch 23) — is finished.

Confirm before declaring Ch 23 — and Phase 13 — done:

- ✅ BUILD_ORDER.md shows files 130-133 ✅
- ✅ File 134 marked ⏭️ (absorbed for 4-file cadence)
- ✅ Ch 23 status is `'published'`
- ✅ Both Ch 23 widgets work in production
- ✅ All 4 Ch 23 exercises render with their starter code

**Cadence check across 23 chapters:**

**4-file cadence** holds for **17 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, 19, 21, 22, **23**).
**5-file cadence** holds for **6 two-topic chapters** (Ch 1, 5, 8, 9, 14, 20).

**23-chapter pattern stable.** The build process continues to scale.

**Phase 13 (Capabilities) status — COMPLETE:**
- ✅ Ch 20 (Reasoning)
- ✅ Ch 21 (Tool use)
- ✅ Ch 22 (RAG)
- ✅ Ch 23 (Multimodal)

**What's next — Phase 14 (Safety, Interpretability, Evaluation).** Three chapters that turn capable systems into trustworthy ones. **Ch 24 (Safety)** covers alignment, jailbreaks, refusal calibration, and red-teaming. **Ch 25 (Interpretability)** covers probes, mechanistic interpretability, sparse autoencoders, and circuits. **Ch 26 (Evaluation)** covers benchmarks, leaderboards, what they measure and what they miss. After Phase 14: **Phase 15** assembles the full stack into complete agent architectures.

---

## Notes for the session author

**On the procedurally-rendered image being pedagogically chosen:**
The widget uses a deliberately simple stylized landscape — sky, sun, mountain, ground — rather than a real photograph. **Why**:
1. **Region clarity**: the reader can label patches without ambiguity ("this is sky", "this is the sun")
2. **Color contrast**: different regions have very different RGB signatures; the mean RGB for each patch is meaningful
3. **No external dependencies**: rendered entirely in-browser via SVG
4. **Pedagogical control**: the procedural image puts the sun in row 1, the mountain in rows 4-6, etc. — predictable so the reader can verify the patch math

Notes-for-author: "**The simple image is not a limitation — it's a deliberate pedagogical choice.** A photograph would obscure what each patch represents; the stylized landscape makes 'this patch covers the sun' immediately obvious."

**On the projection sparkline:**
A real ViT patch projection is a 768-dim vector. **Showing 768 values is not useful.** The widget shows 16 representative values as vertical bars (sparkline). This communicates:
1. **Embeddings are vectors** (not numbers)
2. **They have positive and negative components** (cyan vs amber)
3. **Different patches produce different sketches** (the sun patch's sketch looks different from a sky patch's)

Notes-for-author: "**The sparkline is a sketch, not real math.** Its job is to communicate 'this patch becomes a 768-dim vector — here's a glimpse of what it might look like.' Reader internalizes that embeddings are continuous vectors, not labels."

**On the region badges:**
Each patch gets a region badge (sky / sun / mountain / ground / horizon) with color-coded styling. **This is the 'what is this patch?' label**: a reader who clicks the bright yellow patch sees "sun" — confirming the visual matches the description. Notes-for-author: "**Region badges close the loop between what the reader sees and what the widget calls it.** No ambiguity."

**On the four exercises spanning the multimodal stack:**

| Ex | Difficulty | Topic | Outcome Hit |
|----|-----------|-------|-------------|
| 1 | easy | Patch embedding | 2 |
| 2 | medium | CLIP cosine similarity | 3 |
| 3 | medium | Multimodal RAG | 6 |
| 4 | hard | **Multimodal hallucination detection** | 8 |

Notes-for-author: "**The progression: tokenize → align → retrieve → evaluate.** By the end, the reader has implemented the core operations of the multimodal stack."

**On Ex 4 (multimodal hallucination detection) being the chapter's safety exercise:**
**VLM hallucinations are real and dangerous** — models describe objects that aren't in images, with confidence. Ex 4 implements a simple version of the POPE-style evaluation: compare the caption's mentioned objects to the ground-truth tags. Notes-for-author: "**Ex 4 is where the reader confronts that multimodal is hard — and that evaluation matters.** This previews Phase 14 (Safety, Interp, Eval) directly: capability without trustworthiness is incomplete."

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Unifying multimodal pattern | (chapter prose) |
| 2. ViT patch embedding | Ex 1 + section 2 widget |
| 3. CLIP contrastive alignment | Ex 2 + section 3 widget |
| 4. Modern VLM architectures | (chapter prose) |
| 5. Audio | (chapter prose) |
| 6. Multimodal RAG | Ex 3 |
| 7. Computer use | (chapter prose) |
| 8. Modality-specific failure modes | Ex 4 |

Outcomes 2, 3, 6, 8 served by exercises directly. Outcomes 1, 4, 5, 7 served by chapter prose.

**On Phase 13 closing with this file:**
This file is the close of Ch 23 AND the close of Phase 13. **The session author should feel the weight of this**: four chapters culminating in the file that flips Ch 23 to published. Notes-for-author: "**The commit message — 'Phase 13 capability arc complete' — is the right framing.** Reasoning, tool use, retrieval, multimodal: four capabilities, four chapters, one phase, done."

**Pedagogical claim of the chapter (revisited):**
"Multimodal extends LLMs beyond text by tokenizing other modalities — images via patch embedding (ViT), audio via spectrograms (Whisper). CLIP's contrastive training creates a shared image-text embedding space, the foundation for modern VLMs (LLaVA, GPT-4V, Claude vision, Gemini) and multimodal RAG. Voice-native models (GPT-4o, Gemini Live) handle audio end-to-end. Computer use closes the loop: vision + reasoning + tool use = a visual agent. **The unifying pattern: any modality, tokenized, becomes input to the same transformer architecture.** With Ch 23 complete, Phase 13's capability arc closes — reasoning, tool use, retrieval, multimodal — four capabilities that together turn next-token generation into something approaching a digital assistant."

**Phase 13 progress after this session — COMPLETE**:
- ✅ Ch 20 Reasoning
- ✅ Ch 21 Tool use
- ✅ Ch 22 RAG
- ✅ Ch 23 Multimodal

**The capability arc is finished. Phase 14 (Safety, Interp, Eval) opens next with Ch 24 (Safety).**

Build with care. **This is the file that completes the capabilities arc.**
