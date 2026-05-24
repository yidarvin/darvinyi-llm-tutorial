import { useState, useMemo } from 'react';
import { simulateRound, expectedSpeedup, type RoundToken } from './speculative-data';
import styles from './SpeculativeDecoding.module.css';

const K_VALUES = [1, 3, 5, 7, 10];
const ALPHA_VALUES = [0.3, 0.5, 0.7, 0.9];

export default function SpeculativeDecoding() {
  const [k, setK] = useState(5);
  const [alpha, setAlpha] = useState(0.7);
  const [seed, setSeed] = useState(42);

  const round = useMemo(() => simulateRound(k, alpha, seed), [k, alpha, seed]);
  const expected = useMemo(() => expectedSpeedup(k, alpha), [k, alpha]);

  return (
    <div className={styles.widget}>
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>k (draft length):</span>
          <span className={styles.controlValue}>k = {k}</span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={k}
            onChange={e => setK(Number(e.target.value))}
            className={styles.slider}
            aria-label="draft length k"
          />
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>α (acceptance):</span>
          <span className={styles.controlValue}>α = {alpha.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={0.95}
            step={0.05}
            value={alpha}
            onChange={e => setAlpha(Number(e.target.value))}
            className={styles.slider}
            aria-label="acceptance rate alpha"
          />
        </div>
        <div className={styles.controlRow}>
          <button
            className={styles.resampleButton}
            onClick={() => setSeed(s => s + 1)}
          >
            ↻ Resample
          </button>
          <span className={styles.controlHint}>
            (re-runs the simulation with a new random seed)
          </span>
        </div>
      </div>

      <div className={styles.roundPanel}>
        <div className={styles.roundTitle}>One round of speculative decoding</div>
        <RoundVisualization round={round} k={k} />
      </div>

      <div className={styles.expectedPanel}>
        <div className={styles.expectedTitle}>
          Expected (analytical, at α = {alpha.toFixed(2)}, k = {k})
        </div>
        <ExpectedReadout {...expected} />
      </div>

      <div className={styles.landscapePanel}>
        <div className={styles.landscapeTitle}>Speedup landscape (sweep k and α)</div>
        <SpeedupTable currentK={k} currentAlpha={alpha} />
      </div>

      <div className={styles.caption}>
        Speculative decoding uses a small draft model to propose $k$ tokens in parallel; the big model verifies
        them in <strong>one forward pass</strong>. Accepted tokens are kept; the first rejection triggers a
        correction from the big model. <strong>Net result: more than 1 token per big-model pass.</strong> Speedup
        depends on $k$ (draft length) and $\alpha$ (acceptance rate). Typical sweet spot: $k = 5$, $\alpha = 0.7$
        → ~2-3× speedup.
      </div>
    </div>
  );
}

interface RoundVisualizationProps {
  round: ReturnType<typeof simulateRound>;
  k: number;
}

function RoundVisualization({ round, k }: RoundVisualizationProps) {
  const draftTokens = round.tokens.filter(t => t.status !== 'corrected').slice(0, k);
  const correctedToken = round.tokens.find(t => t.status === 'corrected');

  return (
    <div className={styles.roundContent}>
      <div className={styles.stepRow}>
        <div className={styles.stepNumber}>1.</div>
        <div className={styles.stepContent}>
          <div className={styles.stepLabel}>Draft model proposes k = {k} tokens (cheap, fast):</div>
          <div className={styles.tokenRow}>
            {draftTokens.map(t => (
              <TokenBox key={`draft-${t.index}`} status="pending" label={t.label} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.stepRow}>
        <div className={styles.stepNumber}>2.</div>
        <div className={styles.stepContent}>
          <div className={styles.stepLabel}>Big model verifies all {k} in ONE forward pass:</div>
          <div className={styles.tokenRow}>
            {draftTokens.map(t => (
              <TokenBox key={`verify-${t.index}`} status={t.status} label={t.label} />
            ))}
          </div>
          <div className={styles.verifyAnnotations}>
            {draftTokens.map(t => (
              <span key={`anno-${t.index}`} className={`${styles.anno} ${styles[`anno_${t.status}`]}`}>
                {t.status === 'accepted' && 'accept'}
                {t.status === 'rejected' && 'REJECT'}
                {t.status === 'discarded' && 'discarded'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {correctedToken && (
        <div className={styles.stepRow}>
          <div className={styles.stepNumber}>3.</div>
          <div className={styles.stepContent}>
            <div className={styles.stepLabel}>Big model emits the corrected token:</div>
            <div className={styles.tokenRow}>
              <TokenBox status="corrected" label={correctedToken.label} />
            </div>
          </div>
        </div>
      )}

      <div className={styles.netSummary}>
        <div className={styles.netSummaryRow}>
          <span className={styles.summaryDot} style={{ background: 'var(--emerald-400)' }} />
          <span className={styles.summaryText}>{round.accepted} draft tokens accepted</span>
        </div>
        {round.corrected && (
          <div className={styles.netSummaryRow}>
            <span className={styles.summaryDot} style={{ background: 'var(--cyan-400)' }} />
            <span className={styles.summaryText}>1 big-model correction</span>
          </div>
        )}
        <div className={styles.netSummaryRow}>
          <strong className={styles.summaryText}>
            Total: {round.totalEmitted} token{round.totalEmitted === 1 ? '' : 's'} emitted per 1 big-model pass
          </strong>
        </div>
      </div>
    </div>
  );
}

function TokenBox({ status, label }: { status: RoundToken['status']; label: string }) {
  return (
    <div className={`${styles.tokenBox} ${styles[`tokenBox_${status}`]}`}>
      <span className={styles.tokenLabel}>{label}</span>
      {status === 'accepted' && <span className={styles.tokenMark}>✓</span>}
      {status === 'rejected' && <span className={styles.tokenMark}>✗</span>}
      {status === 'discarded' && <span className={styles.tokenMark}>–</span>}
      {status === 'corrected' && <span className={styles.tokenMark}>✓</span>}
    </div>
  );
}

interface ExpectedReadoutProps {
  expectedAccepted: number;
  expectedEmitted: number;
  costPerRound: number;
  speedup: number;
}
function ExpectedReadout({ expectedAccepted, expectedEmitted, costPerRound, speedup }: ExpectedReadoutProps) {
  return (
    <div className={styles.expectedBody}>
      <div className={styles.expectedRow}>
        <span className={styles.expectedLabel}>Expected accepted:</span>
        <span className={styles.expectedValue}>{expectedAccepted.toFixed(2)} draft tokens</span>
      </div>
      <div className={styles.expectedRow}>
        <span className={styles.expectedLabel}>Expected emitted:</span>
        <span className={styles.expectedValue}>{expectedEmitted.toFixed(2)} tokens per round</span>
      </div>
      <div className={styles.expectedRow}>
        <span className={styles.expectedLabel}>Cost per round:</span>
        <span className={styles.expectedValue}>{costPerRound.toFixed(2)} big-model-equivalents</span>
      </div>
      <div className={styles.expectedDivider} />
      <div className={`${styles.expectedRow} ${styles.expectedHighlight}`}>
        <span className={styles.expectedLabel}>Speedup:</span>
        <span className={styles.expectedValue}>
          {expectedEmitted.toFixed(2)} / {costPerRound.toFixed(2)} = <strong>{speedup.toFixed(2)}×</strong>
        </span>
      </div>
    </div>
  );
}

function SpeedupTable({ currentK, currentAlpha }: { currentK: number; currentAlpha: number }) {
  return (
    <table className={styles.landscapeTable}>
      <thead>
        <tr>
          <th></th>
          {ALPHA_VALUES.map(a => (
            <th key={a}>α = {a}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {K_VALUES.map(rowK => (
          <tr key={rowK}>
            <td className={styles.rowLabel}>k = {rowK}</td>
            {ALPHA_VALUES.map(colAlpha => {
              const sp = expectedSpeedup(rowK, colAlpha).speedup;
              const isCurrent = rowK === currentK && Math.abs(colAlpha - currentAlpha) < 0.05;
              return (
                <td
                  key={`${rowK}-${colAlpha}`}
                  className={`${styles.cell} ${isCurrent ? styles.cellCurrent : ''}`}
                >
                  {sp.toFixed(2)}×{isCurrent && <span className={styles.currentMarker}> ← here</span>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
