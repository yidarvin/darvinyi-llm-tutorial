import { useState } from 'react';
import {
  CATEGORIES,
  captionFor,
} from './jailbreak-data';
import styles from './JailbreakTaxonomy.module.css';

const CHART_W = 600;
const CHART_H = 240;
const CHART_PAD_L = 60;
const CHART_PAD_R = 25;
const CHART_PAD_T = 25;
const CHART_PAD_B = 45;

const PLACEHOLDER_TOKENS = [
  '[BASE64-ENCODED HARMFUL REQUEST]',
  '[HARMFUL REQUEST]',
  '[HARMFUL]',
];

function renderExample(example: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = example;
  let key = 0;
  while (remaining.length > 0) {
    let earliestIdx = -1;
    let earliestToken = '';
    for (const tok of PLACEHOLDER_TOKENS) {
      const i = remaining.indexOf(tok);
      if (i !== -1 && (earliestIdx === -1 || i < earliestIdx)) {
        earliestIdx = i;
        earliestToken = tok;
      }
    }
    if (earliestIdx === -1) {
      nodes.push(<span key={key++}>{remaining}</span>);
      break;
    }
    if (earliestIdx > 0) {
      nodes.push(<span key={key++}>{remaining.slice(0, earliestIdx)}</span>);
    }
    nodes.push(
      <span key={key++} className={styles.payloadPlaceholder}>
        {earliestToken}
      </span>,
    );
    remaining = remaining.slice(earliestIdx + earliestToken.length);
  }
  return nodes;
}

export default function JailbreakTaxonomy() {
  const [idx, setIdx] = useState(0);
  const cat = CATEGORIES[idx]!;

  const successBarWidth = `${cat.successRateHigh}%`;
  const plotW = CHART_W - CHART_PAD_L - CHART_PAD_R;
  const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B;

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Jailbreak taxonomy</div>
        <div className={styles.titleSubLabel}>
          Six attack patterns · sanitized examples · mechanisms · defenses
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Category:</span>
          <div className={styles.categoryButtons}>
            {CATEGORIES.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.categoryButton} ${idx === i ? styles.categoryButtonActive : ''}`}
                onClick={() => setIdx(i)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{cat.label.toUpperCase()}</div>
          <div
            className={`${styles.mechanismBadge} ${
              cat.mechanism === 'competing-objectives'
                ? styles.mechanismCompeting
                : styles.mechanismMismatched
            }`}
          >
            {cat.mechanism === 'competing-objectives'
              ? 'Competing objectives'
              : 'Mismatched generalization'}
          </div>
        </div>

        <div className={styles.exampleSection}>
          <div className={styles.sectionLabel}>Sanitized example</div>
          <pre className={styles.exampleBlock}>{renderExample(cat.example)}</pre>
        </div>

        <div className={styles.explanationSection}>
          <div className={styles.sectionLabel}>Why it works</div>
          <div className={styles.explanationText}>{cat.explanation}</div>
        </div>

        <div className={styles.successRateSection}>
          <div className={styles.sectionLabel}>
            Success rate against frontier models (2024)
          </div>
          <div className={styles.successBarWrap}>
            <div className={styles.successBarTrack}>
              <div
                className={styles.successBarFill}
                style={{ width: successBarWidth }}
              />
            </div>
            <div className={styles.successBarText}>
              {cat.successRateLow}–{cat.successRateHigh}%
            </div>
          </div>
        </div>

        <div className={styles.defensesSection}>
          <div className={styles.sectionLabel}>Defenses</div>
          <ul className={styles.defensesList}>
            {cat.defenses.map((d, i) => (
              <li key={i} className={styles.defenseItem}>
                <span className={styles.defenseBullet}>•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>
          All six categories, by mechanism × success rate
        </div>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className={styles.chartSvg}
          role="img"
          aria-label="Two-axis chart of jailbreak categories"
        >
          <rect
            x={CHART_PAD_L}
            y={CHART_PAD_T}
            width={plotW}
            height={plotH}
            className={styles.chartFrame}
          />

          <text
            x={CHART_PAD_L - 8}
            y={CHART_PAD_T + 10}
            className={styles.axisLabel}
            textAnchor="end"
          >
            high
          </text>
          <text
            x={CHART_PAD_L - 8}
            y={CHART_PAD_T + plotH / 2 + 4}
            className={styles.axisLabel}
            textAnchor="end"
          >
            mid
          </text>
          <text
            x={CHART_PAD_L - 8}
            y={CHART_PAD_T + plotH - 2}
            className={styles.axisLabel}
            textAnchor="end"
          >
            low
          </text>

          <text
            x={CHART_PAD_L + plotW / 2}
            y={CHART_H - 8}
            className={styles.axisLabel}
            textAnchor="middle"
          >
            competing objectives ── mechanism ──→ mismatched generalization
          </text>

          <text
            x={18}
            y={CHART_PAD_T + plotH / 2}
            className={styles.axisLabel}
            transform={`rotate(-90 18 ${CHART_PAD_T + plotH / 2})`}
            textAnchor="middle"
          >
            success rate
          </text>

          {CATEGORIES.map((c, i) => {
            const cx = CHART_PAD_L + c.chartX * plotW;
            const cy = CHART_PAD_T + (1 - c.chartY) * plotH;
            const isActive = i === idx;
            const dotColor =
              c.mechanism === 'competing-objectives'
                ? 'var(--amber-400)'
                : 'var(--violet-400)';
            return (
              <g key={c.id}>
                {isActive && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={12}
                    className={styles.chartActiveRing}
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={dotColor}
                  className={styles.chartDot}
                  onClick={() => setIdx(i)}
                />
                <text
                  x={cx + 10}
                  y={cy + 4}
                  className={`${styles.chartLabel} ${isActive ? styles.chartLabelActive : ''}`}
                  onClick={() => setIdx(i)}
                >
                  {c.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.adaptiveCaption}>
        <div className={styles.adaptiveCaptionLabel}>Pattern</div>
        <div className={styles.adaptiveCaptionText}>{captionFor(cat)}</div>
      </div>

      <div className={styles.caption}>
        Click through all six categories. Notice the two-color split:{' '}
        <strong>amber attacks</strong> exploit competing objectives
        (helpfulness vs harmlessness); <strong>violet attacks</strong> exploit
        mismatched generalization (the safety training distribution).{' '}
        <strong>Suffix attacks</strong> and{' '}
        <strong>multi-modal attacks</strong> have the highest success rates
        because they target deep vulnerabilities the model has no concept of in
        its training. <strong>No single defense covers all categories</strong>:{' '}
        production safety uses defense-in-depth across input filters,
        safety-trained models, and output validation.
      </div>
    </div>
  );
}
