import { useState } from 'react';
import {
  CONCEPTS, CATEGORIES, N_LAYERS, peakLayer, peakAccuracy,
} from './probing-data';
import styles from './LinearProbingVisualizer.module.css';

const CHART_W = 700;
const CHART_H = 300;
const PAD_L = 50;
const PAD_R = 30;
const PAD_T = 25;
const PAD_B = 35;

function toX(layerIdx: number): number {
  return PAD_L + (layerIdx / (N_LAYERS - 1)) * (CHART_W - PAD_L - PAD_R);
}
function toY(accuracy: number): number {
  const norm = (accuracy - 0.3) / 0.7;
  return CHART_H - PAD_B - norm * (CHART_H - PAD_T - PAD_B);
}

function buildPath(accuracies: number[]): string {
  return accuracies.map((acc, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(acc)}`).join(' ');
}

export default function LinearProbingVisualizer() {
  const [idx, setIdx] = useState(0);
  const concept = CONCEPTS[idx]!;
  const peak = peakLayer(concept);
  const peakAcc = peakAccuracy(concept);
  const category = CATEGORIES[concept.category];

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Linear probing visualizer</div>
        <div className={styles.titleSubLabel}>
          6 concepts · 12-layer transformer · layer-wise feature emergence
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a concept:</span>
          <div className={styles.conceptButtons}>
            {CONCEPTS.map((c, i) => (
              <button
                key={c.id}
                className={`${styles.conceptButton} ${idx === i ? styles.conceptButtonActive : ''}`}
                style={{ borderLeftColor: CATEGORIES[c.category].color }}
                onClick={() => setIdx(i)}
              >{c.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{concept.label.toUpperCase()}</div>
          <div
            className={styles.categoryBadge}
            style={{
              background: `color-mix(in srgb, ${category.color} 18%, transparent)`,
              color: category.color,
              borderColor: `color-mix(in srgb, ${category.color} 40%, transparent)`,
            }}
          >
            {category.label}
          </div>
        </div>
        <div className={styles.descriptionText}>{concept.description}</div>

        <div className={styles.chartSection}>
          <div className={styles.sectionLabel}>Probe accuracy by layer</div>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className={styles.primaryChart}
            role="img"
            aria-label={`Probe accuracy across layers for ${concept.label}`}
          >
            {[0.5, 0.75, 1.0].map(val => (
              <g key={val}>
                <line
                  x1={PAD_L} y1={toY(val)}
                  x2={CHART_W - PAD_R} y2={toY(val)}
                  className={styles.gridLine}
                />
                <text
                  x={PAD_L - 8} y={toY(val) + 4}
                  className={styles.axisLabel}
                  textAnchor="end"
                >{val.toFixed(2)}</text>
              </g>
            ))}
            {concept.accuracyByLayer.map((_, i) => (
              <text
                key={`x-${i}`}
                x={toX(i)} y={CHART_H - PAD_B + 16}
                className={styles.axisLabel}
                textAnchor="middle"
              >L{i}</text>
            ))}
            <path
              d={buildPath(concept.accuracyByLayer)}
              className={styles.primaryLine}
            />
            {concept.accuracyByLayer.map((acc, i) => (
              <circle
                key={`pt-${i}`}
                cx={toX(i)} cy={toY(acc)}
                r={i === peak ? 7 : 4}
                fill={i === peak ? 'var(--cyan-300)' : 'var(--cyan-400)'}
                stroke={i === peak ? 'var(--cyan-300)' : 'none'}
                strokeWidth={i === peak ? 2 : 0}
                className={i === peak ? styles.peakDot : styles.primaryDot}
              />
            ))}
            <text
              x={toX(peak)} y={toY(peakAcc) - 14}
              className={styles.peakLabel}
              textAnchor={peak < 2 ? 'start' : peak > N_LAYERS - 3 ? 'end' : 'middle'}
            >peak: L{peak} ({peakAcc.toFixed(2)})</text>

            <text x={20} y={CHART_H / 2} className={styles.axisTitle} transform={`rotate(-90 20 ${CHART_H / 2})`} textAnchor="middle">probe accuracy</text>
            <text x={CHART_W / 2} y={CHART_H - 4} className={styles.axisTitle} textAnchor="middle">layer index</text>
          </svg>
        </div>

        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Why this layer?</div>
          <div className={styles.noteText}>{concept.note}</div>
        </div>
      </div>

      <div className={styles.overlayPanel}>
        <div className={styles.overlayTitle}>All 6 concepts overlaid (selected concept in cyan)</div>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className={styles.overlayChart}
          role="img"
          aria-label="All concepts probe accuracy by layer"
        >
          {[0.5, 0.75, 1.0].map(val => (
            <g key={val}>
              <line
                x1={PAD_L} y1={toY(val)}
                x2={CHART_W - PAD_R} y2={toY(val)}
                className={styles.gridLine}
              />
              <text
                x={PAD_L - 8} y={toY(val) + 4}
                className={styles.axisLabel}
                textAnchor="end"
              >{val.toFixed(2)}</text>
            </g>
          ))}
          {Array.from({ length: N_LAYERS }, (_, i) => i).map(i => (
            <text
              key={`xo-${i}`}
              x={toX(i)} y={CHART_H - PAD_B + 16}
              className={styles.axisLabel}
              textAnchor="middle"
            >L{i}</text>
          ))}
          {CONCEPTS.map((c, i) => {
            const isActive = i === idx;
            const color = isActive ? 'var(--cyan-400)' : CATEGORIES[c.category].color;
            return (
              <g key={c.id}>
                <path
                  d={buildPath(c.accuracyByLayer)}
                  fill="none"
                  stroke={color}
                  strokeWidth={isActive ? 3 : 1.5}
                  opacity={isActive ? 1 : 0.55}
                  className={styles.overlayLine}
                />
                <text
                  x={toX(N_LAYERS - 1) + 4}
                  y={toY(c.accuracyByLayer[N_LAYERS - 1]!) + 4}
                  className={styles.overlayLineLabel}
                  fill={color}
                  fontWeight={isActive ? 600 : 400}
                  opacity={isActive ? 1 : 0.7}
                >{c.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.summaryPanel}>
        <div className={styles.sectionLabel}>Peak layer summary</div>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Concept</th>
              <th>Category</th>
              <th>Peak layer</th>
              <th>Peak accuracy</th>
            </tr>
          </thead>
          <tbody>
            {CONCEPTS.map((c, i) => {
              const pL = peakLayer(c);
              const pA = peakAccuracy(c);
              return (
                <tr
                  key={c.id}
                  className={i === idx ? styles.summaryRowActive : ''}
                  onClick={() => setIdx(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{c.label}</td>
                  <td>
                    <span
                      className={styles.summaryFamilyDot}
                      style={{ background: CATEGORIES[c.category].color }}
                    />
                    {CATEGORIES[c.category].label}
                  </td>
                  <td>L{pL}</td>
                  <td>{pA.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.caption}>
        Click through the concepts. <strong>Surface features</strong> (token identity) peak at layer 0 and
        fade across layers, as the model transforms surface info into abstract representations.{' '}
        <strong>Syntactic features</strong> (sentence boundary, POS) peak in early-middle layers.{' '}
        <strong>Semantic features</strong> (named entities, sentiment) peak in middle-late layers, requiring
        more context integration. <strong>Task-specific features</strong> (refusal patterns) peak at the
        last layer: the model commits to behavioral decisions only after integrating all context.{' '}
        <strong>This layer-wise emergence pattern</strong> is one of probing's most robust findings,
        and a window into how computation flows through a transformer.
      </div>
    </div>
  );
}
