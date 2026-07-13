import { useState } from 'react';
import {
  SCENARIOS, BIAS_MODES, mitigatedVerdict,
} from './judge-data';
import styles from './LLMJudgeBiasDemo.module.css';

export default function LLMJudgeBiasDemo() {
  const [idx, setIdx] = useState(0);
  const scenario = SCENARIOS[idx]!;
  const mitigated = mitigatedVerdict(scenario);
  const biasInfo = BIAS_MODES[scenario.biasMode];

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>LLM-as-judge bias demo</div>
        <div className={styles.titleSubLabel}>
          5 scenarios · documented bias modes (Zheng 2023)
        </div>
      </div>

      {/* Scenario picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a scenario:</span>
          <div className={styles.scenarioButtons}>
            {SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                className={`${styles.scenarioButton} ${idx === i ? styles.scenarioButtonActive : ''}`}
                onClick={() => setIdx(i)}
              >{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{scenario.label.toUpperCase()}</div>
          <div
            className={styles.biasBadge}
            style={{
              background: `color-mix(in srgb, ${biasInfo.color} 18%, transparent)`,
              color: biasInfo.color,
              borderColor: `color-mix(in srgb, ${biasInfo.color} 40%, transparent)`,
            }}
          >
            {biasInfo.label}
          </div>
        </div>

        {/* Prompt */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Prompt</div>
          <div className={styles.promptBox}>{scenario.prompt}</div>
        </div>

        {/* Two responses side-by-side */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Responses</div>
          <div className={styles.responsesGrid}>
            <div className={styles.responseCard}>
              <div className={styles.responseHeader}>
                <span className={styles.responseLetter}>A</span>
                <span className={styles.responseAuthor}>{scenario.responseA.author}</span>
                <span className={styles.responseChars}>{scenario.responseA.text.length} chars</span>
              </div>
              <div className={styles.responseText}>{scenario.responseA.text}</div>
            </div>
            <div className={styles.responseCard}>
              <div className={styles.responseHeader}>
                <span className={styles.responseLetter}>B</span>
                <span className={styles.responseAuthor}>{scenario.responseB.author}</span>
                <span className={styles.responseChars}>{scenario.responseB.text.length} chars</span>
              </div>
              <div className={styles.responseText}>{scenario.responseB.text}</div>
            </div>
          </div>
        </div>

        {/* Verdict tiles */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Judge verdicts under two orderings</div>
          <div className={styles.verdictsGrid}>
            <div className={styles.verdictRow}>
              <span className={styles.verdictRowLabel}>A first, then B →</span>
              <VerdictTiles picked={scenario.verdictAFirst} />
            </div>
            <div className={styles.verdictRow}>
              <span className={styles.verdictRowLabel}>B first, then A →</span>
              <VerdictTiles picked={scenario.verdictBFirst} />
            </div>
          </div>
        </div>

        {/* Mitigated verdict */}
        <div className={styles.mitigationPanel}>
          <div className={styles.mitigationRow}>
            <span className={styles.mitigationLabel}>Swap-mitigated verdict:</span>
            <span className={styles.mitigationVerdict}>
              {mitigated === 'tie' ? 'TIE' : `Response ${mitigated}`}
            </span>
          </div>
          <div className={styles.mitigationStatus}>
            <span
              className={`${styles.mitigationBadge} ${
                biasInfo.mitigationLevel === 'catches'
                  ? styles.mitigationBadgeCatches
                  : styles.mitigationBadgeMisses
              }`}
            >
              {biasInfo.mitigationLevel === 'catches'
                ? '✓ Mitigation catches'
                : '✗ Mitigation does NOT catch'}
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>What's happening</div>
          <div className={styles.explanationText}>{scenario.explanation}</div>
        </div>

        {/* Mitigation outcome */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Mitigation outcome</div>
          <div className={styles.mitigationOutcomeText}>{scenario.mitigationOutcome}</div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Click through the scenarios. <strong>Position bias</strong> flips with ordering, and swap-mitigation
        catches it (verdict becomes "tie"). <strong>Verbosity bias</strong>, <strong>self-enhancement bias</strong>,
        and <strong>coverage bias</strong> are consistent across orderings: swap-mitigation does NOT help.
        Defending against these requires <strong>multi-judge ensembles, rubric-based judging, anonymization,
        or human calibration</strong>. <strong>No single mitigation defends against all bias modes</strong>:
        production LLM-as-judge requires defense-in-depth, like every other discipline of Part VIII.
      </div>
    </div>
  );
}

function VerdictTiles({ picked }: { picked: 'A' | 'B' | 'tie' }) {
  return (
    <div className={styles.verdictTilesRow}>
      {(['A', 'B', 'tie'] as const).map(option => (
        <div
          key={option}
          className={`${styles.verdictTile} ${picked === option ? styles.verdictTilePicked : ''}`}
        >
          {option === 'tie' ? 'tie' : `Response ${option}`}
        </div>
      ))}
    </div>
  );
}
