import { useState } from 'react';
import { VOCAB, STEPS, TARGET_GRAMMAR } from './fsm-data';
import styles from './ConstrainedDecoding.module.css';

export default function ConstrainedDecoding() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx]!;
  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  const validSet = new Set(step.validVocabIds);
  const wouldBeWrong =
    step.modelPreferredId !== step.chosenId &&
    !validSet.has(step.modelPreferredId);

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Constrained decoding (FSM masking)</div>
        <div className={styles.titleSubLabel}>
          Target grammar: <code className={styles.grammarCode}>{TARGET_GRAMMAR}</code>
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlsRow}>
          <button
            className={styles.button}
            onClick={() => setStepIdx(i => Math.max(0, i - 1))}
            disabled={isFirst}
          >◀ Prev</button>
          <button
            className={styles.button}
            onClick={() => setStepIdx(i => Math.min(STEPS.length - 1, i + 1))}
            disabled={isLast}
          >Next ▶</button>
          <button
            className={styles.button}
            onClick={() => setStepIdx(0)}
          >↻ Reset</button>
          <span className={styles.stepCounter}>
            Step {stepIdx + 1} of {STEPS.length} · state = <strong>{step.state}</strong>
          </span>
        </div>
      </div>

      <div className={styles.expectingPanel}>
        <div className={styles.expectingLabel}>Currently expecting</div>
        <div className={styles.expectingText}>{step.description}</div>
      </div>

      <div className={styles.generatedPanel}>
        <div className={styles.generatedLabel}>Generated so far</div>
        <div className={styles.generatedText}>
          {step.emittedSoFar || <em className={styles.empty}>(nothing yet)</em>}
        </div>
      </div>

      <div className={styles.vocabPanel}>
        <div className={styles.vocabTitle}>Vocabulary candidates (16 tokens)</div>
        <div className={styles.vocabGrid}>
          {VOCAB.map(tok => {
            const isValid = validSet.has(tok.id);
            const isChosen = tok.id === step.chosenId;
            const isModelPref = tok.id === step.modelPreferredId;
            return (
              <div
                key={tok.id}
                className={`${styles.tokenCell} ${isValid ? styles.tokenValid : styles.tokenMasked} ${isChosen ? styles.tokenChosen : ''}`}
              >
                <div className={styles.tokenLabel}>{tok.label}</div>
                <div className={styles.tokenStatus}>
                  {isValid ? '✓ valid' : '✗ masked'}
                </div>
                {isModelPref && (
                  <div className={styles.modelPrefBadge} title="Model's preferred token (without constraints)">★</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!isLast && (
        <div className={styles.comparePanel}>
          <div className={styles.compareRow}>
            <span className={styles.compareLabel}>★ Model's preferred (no constraints):</span>
            <span className={`${styles.compareValue} ${wouldBeWrong ? styles.compareWrong : ''}`}>
              "{VOCAB[step.modelPreferredId]!.label}"
              {wouldBeWrong && <span className={styles.warningTag}> ← would break grammar!</span>}
            </span>
          </div>
          <div className={styles.compareRow}>
            <span className={styles.compareLabel}>✓ Chosen (with constraints):</span>
            <span className={styles.compareChoice}>
              "{VOCAB[step.chosenId]!.label}" ← highest-prob valid token
            </span>
          </div>
        </div>
      )}

      {isLast && (
        <div className={styles.comparePanel}>
          <div className={styles.compareLabel}>Generation complete.</div>
          <div className={styles.compareChoice}>
            Final output: <code className={styles.grammarCode}>{step.emittedSoFar}</code>
          </div>
        </div>
      )}

      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>
          Constrained decoding guarantees the output satisfies the grammar. The model still uses its
          full probability distribution, it just gets restricted to valid options. Without it, the
          model often picks tokens that break the format (★ markers above).
        </div>
      </div>

      <div className={styles.caption}>
        Click <strong>Next ▶</strong> to walk through generating <code>&#123;"name": "Alice"&#125;</code>.
        At each step, watch which tokens are <strong>valid (cyan ✓)</strong> vs <strong>masked (rose ✗)</strong>.
        The ★ marks the model's <em>preferred</em> token without constraints, often invalid! Constrained
        decoding picks the highest-probability valid token instead. <strong>This is how JSON mode and tool-calling
        APIs guarantee structured output.</strong>
      </div>
    </div>
  );
}
