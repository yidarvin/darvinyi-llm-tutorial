import { useState, useMemo } from 'react';
import {
  buildPatches,
  sketchProjection,
  rgbCss,
  GRID_SIZE,
  PATCH_SIZE,
  PATCH_FLAT_DIM,
  EMBED_DIM,
} from './vit-data';
import styles from './ViTPatchTokenizer.module.css';

export default function ViTPatchTokenizer() {
  const patches = useMemo(() => buildPatches(), []);
  const [selectedIdx, setSelectedIdx] = useState<number>(14); // default: the sun patch
  const selected = patches[selectedIdx]!;
  const projection = useMemo(() => sketchProjection(selected), [selected]);

  const SVG_SIZE = 340;
  const PX_PER_PATCH = SVG_SIZE / GRID_SIZE;

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>ViT patch tokenizer</div>
        <div className={styles.titleSubLabel}>
          128×128 image · 8×8 grid · 16×16 patches · each becomes one visual token
        </div>
      </div>

      <div className={styles.introPanel}>
        A 128×128 stylized landscape (sky, sun, mountain, ground) is split into an 8×8 grid of
        16×16-pixel patches. <strong>Each patch becomes one visual token</strong> when fed into a
        Vision Transformer. Click any patch to see what one token represents.
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.imagePanel}>
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className={styles.imageSvg}
            role="img"
            aria-label="Stylized landscape, 8 by 8 patch grid"
          >
            {patches.map((p) => (
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
            {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
              <g key={`grid-${i}`}>
                <line
                  x1={i * PX_PER_PATCH}
                  y1={0}
                  x2={i * PX_PER_PATCH}
                  y2={SVG_SIZE}
                  className={styles.gridLine}
                />
                <line
                  x1={0}
                  y1={i * PX_PER_PATCH}
                  x2={SVG_SIZE}
                  y2={i * PX_PER_PATCH}
                  className={styles.gridLine}
                />
              </g>
            ))}
            <rect
              x={selected.col * PX_PER_PATCH + 2}
              y={selected.row * PX_PER_PATCH + 2}
              width={PX_PER_PATCH - 4}
              height={PX_PER_PATCH - 4}
              className={styles.selectedRing}
            />
          </svg>
          <div className={styles.imageCaption}>Click a patch to inspect →</div>
        </div>

        <div className={styles.detailsPanel}>
          <div className={styles.detailsRow}>
            <div className={styles.detailsLabel}>Position</div>
            <div className={styles.detailsValue}>
              row {selected.row}, col {selected.col}
              <span className={styles.detailsAux}>
                · index {selected.index} of {GRID_SIZE * GRID_SIZE - 1}
              </span>
            </div>
          </div>

          <div className={styles.detailsRow}>
            <div className={styles.detailsLabel}>Region</div>
            <div className={styles.detailsValue}>
              <span className={styles.regionBadge} data-region={selected.region}>
                {selected.region}
              </span>
            </div>
          </div>

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

          <div className={styles.detailsRow}>
            <div className={styles.detailsLabel}>Flatten</div>
            <div className={styles.detailsValue}>
              <span className={styles.formula}>
                {PATCH_SIZE} × {PATCH_SIZE} × 3 = <strong>{PATCH_FLAT_DIM}</strong> raw values
              </span>
            </div>
          </div>

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

      <div className={styles.caption}>
        Click different patches to compare. <strong>Sky patches</strong> are bluish;{' '}
        <strong>the sun patch</strong> is bright yellow; <strong>mountain patches</strong> are
        gray; <strong>ground patches</strong> are green. After patch embedding, an image becomes a
        sequence of {GRID_SIZE * GRID_SIZE} visual tokens (plus a <code>[CLS]</code> token), each a{' '}
        {EMBED_DIM}-dim vector.{' '}
        <strong>From the transformer's perspective, these are indistinguishable from text tokens</strong>{' '}
        — just vectors in a sequence. This is the mechanism that lets the same architecture handle
        vision and language.
      </div>
    </div>
  );
}
