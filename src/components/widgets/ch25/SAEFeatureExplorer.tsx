import { useMemo, useState } from 'react';
import {
  FAMILIES,
  FEATURES,
  topKNearest,
} from './sae-data';
import styles from './SAEFeatureExplorer.module.css';

const MAP_W = 700;
const MAP_H = 320;
const MAP_PAD = 30;

export default function SAEFeatureExplorer() {
  const [idx, setIdx] = useState(0);
  const feature = FEATURES[idx]!;
  const neighbors = useMemo(() => topKNearest(feature, 3), [feature]);
  const neighborIds = new Set(neighbors.map(n => n.id));

  const toX = (x: number) => MAP_PAD + x * (MAP_W - 2 * MAP_PAD);
  const toY = (y: number) => MAP_PAD + (1 - y) * (MAP_H - 2 * MAP_PAD);

  const familyColor = FAMILIES[feature.family].color;

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>SAE feature explorer</div>
        <div className={styles.titleSubLabel}>
          10 curated monosemantic features · inspired by Templeton 2024
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a feature:</span>
          <div className={styles.featureButtons}>
            {FEATURES.map((f, i) => (
              <button
                key={f.id}
                className={`${styles.featureButton} ${idx === i ? styles.featureButtonActive : ''}`}
                style={{ borderLeftColor: FAMILIES[f.family].color }}
                onClick={() => setIdx(i)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{feature.label.toUpperCase()}</div>
          <div
            className={styles.familyBadge}
            style={{
              background: `color-mix(in srgb, ${familyColor} 18%, transparent)`,
              color: familyColor,
              borderColor: `color-mix(in srgb, ${familyColor} 40%, transparent)`,
            }}
          >
            {FAMILIES[feature.family].label}
          </div>
        </div>

        <div className={styles.descriptionText}>{feature.description}</div>

        <div className={styles.inputsSection}>
          <div className={styles.sectionLabel}>Top-5 activating inputs</div>
          <ul className={styles.inputsList}>
            {feature.topInputs.map((input, i) => (
              <li key={i} className={styles.inputItem}>
                <div className={styles.inputText}>&ldquo;{input.text}&rdquo;</div>
                <div className={styles.activationBarWrap}>
                  <div className={styles.activationBarTrack}>
                    <div
                      className={styles.activationBarFill}
                      style={{ width: `${input.activation * 100}%` }}
                    />
                  </div>
                  <div className={styles.activationValue}>{input.activation.toFixed(2)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Discovery note</div>
          <div className={styles.noteText}>{feature.note}</div>
        </div>
      </div>

      <div className={styles.mapPanel}>
        <div className={styles.mapTitle}>Feature space — related features cluster together</div>
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className={styles.mapSvg}
          role="img"
          aria-label="2D map of SAE features"
        >
          <rect
            x={MAP_PAD}
            y={MAP_PAD}
            width={MAP_W - 2 * MAP_PAD}
            height={MAP_H - 2 * MAP_PAD}
            className={styles.mapFrame}
          />

          {neighbors.map(n => (
            <line
              key={`line-${n.id}`}
              x1={toX(feature.x)}
              y1={toY(feature.y)}
              x2={toX(n.x)}
              y2={toY(n.y)}
              className={styles.connectionLine}
            />
          ))}

          {FEATURES.map((f, i) => {
            const isActive = f.id === feature.id;
            const isNeighbor = neighborIds.has(f.id);
            const color = FAMILIES[f.family].color;
            const cx = toX(f.x);
            const cy = toY(f.y);
            return (
              <g
                key={f.id}
                onClick={() => setIdx(i)}
                style={{ cursor: 'pointer' }}
              >
                {isActive ? (
                  <polygon
                    points={`${cx},${cy - 11} ${cx + 9},${cy} ${cx},${cy + 11} ${cx - 9},${cy}`}
                    fill={color}
                    stroke="var(--cyan-300)"
                    strokeWidth={2}
                    className={styles.activeDot}
                  />
                ) : (
                  <>
                    {isNeighbor && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        className={styles.neighborRing}
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={color}
                      className={styles.mapDot}
                    />
                  </>
                )}
                <text
                  x={cx + 11}
                  y={cy + 4}
                  className={`${styles.mapLabel} ${isActive ? styles.mapLabelActive : ''} ${isNeighbor ? styles.mapLabelNeighbor : ''}`}
                >
                  {f.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.neighborsPanel}>
        <div className={styles.sectionLabel}>Top-3 nearest features</div>
        <ol className={styles.neighborsList}>
          {neighbors.map((n, i) => (
            <li key={n.id} className={styles.neighborItem}>
              <span className={styles.neighborRank}>{i + 1}.</span>
              <span
                className={styles.neighborFamilyDot}
                style={{ background: FAMILIES[n.family].color }}
              />
              <span className={styles.neighborLabel}>{n.label}</span>
              <span className={styles.neighborFamily}>— {FAMILIES[n.family].label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.caption}>
        Click through the features. <strong>Each one represents a learned direction</strong> in the model&rsquo;s
        activation space that activates on a specific, interpretable concept. The activation bars show how
        sharply the feature fires on its top inputs — peak inputs hit 1.0, related-but-not-perfect inputs
        fall off. <strong>The 2D map reveals decoder geometry</strong>: features in the same family cluster
        together because the SAE learned them as related directions. <strong>This is what Anthropic&rsquo;s
        breakthrough looks like</strong>: not a finished science, but a tractable handle on what&rsquo;s inside
        the model — and a foundation for safety verification.
      </div>
    </div>
  );
}
