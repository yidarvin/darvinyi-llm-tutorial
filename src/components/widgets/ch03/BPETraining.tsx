import { useEffect, useRef, useState } from 'react';
import { type TrainingTrace, type MergeStep, precomputeTrace } from './bpe-corpus';
import styles from './BPETraining.module.css';

const NUM_MERGES = 25;
const PLAY_FPS = 2;

export default function BPETraining() {
  const [trace, setTrace] = useState<TrainingTrace | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (cancelledRef.current) return;
      setTrace(precomputeTrace(NUM_MERGES));
    }, 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isPlaying || !trace) return;
    if (stepIdx >= trace.steps.length) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setStepIdx(s => s + 1);
    }, 1000 / PLAY_FPS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, stepIdx, trace]);

  useEffect(() => () => {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  if (!trace) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>
          <div className={styles.loadingBar} />
          Training BPE on the toy corpus…
        </div>
      </div>
    );
  }

  const totalSteps = trace.steps.length;
  const currentCorpus = stepIdx === 0 ? trace.initialCorpus : trace.steps[stepIdx - 1]!.corpusAfter;
  const currentStep: MergeStep | null = stepIdx === 0 ? null : trace.steps[stepIdx - 1]!;
  const newToken = currentStep?.newToken ?? null;
  const vocabSize = currentStep?.vocabSize ?? trace.initialVocabSize;

  const recentMerges = stepIdx === 0
    ? []
    : trace.steps.slice(Math.max(0, stepIdx - 5), stepIdx).reverse();

  const maxCount = currentStep?.topPairs[0]?.count ?? 1;

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <button
          onClick={() => { setStepIdx(0); setIsPlaying(false); }}
          className={styles.controlSecondary}
        >
          Reset
        </button>
        <button
          onClick={() => {
            if (stepIdx >= totalSteps) {
              setStepIdx(0);
              setIsPlaying(true);
            } else {
              setIsPlaying(p => !p);
            }
          }}
          className={styles.controlPrimary}
        >
          {isPlaying ? 'Pause' : stepIdx >= totalSteps ? 'Replay' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={totalSteps}
          value={stepIdx}
          onChange={e => { setIsPlaying(false); setStepIdx(Number(e.target.value)); }}
          className={styles.scrubber}
          aria-label="BPE training step"
        />
        <span className={styles.stepLabel} aria-live="polite">
          Step {stepIdx} / {totalSteps}
        </span>
      </div>

      <div className={styles.justMerged} aria-live="polite">
        {currentStep ? (
          <>
            Just merged:{' '}
            <code className={styles.tokenChip}>{escapeWs(currentStep.chosenPair[0])}</code>
            {' + '}
            <code className={styles.tokenChip}>{escapeWs(currentStep.chosenPair[1])}</code>
            {' → '}
            <code className={`${styles.tokenChip} ${styles.tokenChipNew}`}>
              {escapeWs(currentStep.newToken)}
            </code>
            {' (count: '}<strong>{currentStep.chosenCount}</strong>{')'}
          </>
        ) : (
          <>Initial corpus — no merges yet. Press Play to start training.</>
        )}
      </div>

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Top adjacent pairs (this step)</div>
          {currentStep ? (
            <ul className={styles.pairList}>
              {currentStep.topPairs.map((pc, i) => {
                const isChosen =
                  pc.pair[0] === currentStep.chosenPair[0] &&
                  pc.pair[1] === currentStep.chosenPair[1];
                const widthPct = (pc.count / maxCount) * 100;
                return (
                  <li
                    key={i}
                    className={isChosen ? styles.pairItemChosen : styles.pairItem}
                  >
                    <span className={styles.pairBar} style={{ width: `${widthPct}%` }} />
                    <span className={styles.pairLabel}>
                      <code className={styles.tokenChip}>{escapeWs(pc.pair[0])}</code>
                      {' + '}
                      <code className={styles.tokenChip}>{escapeWs(pc.pair[1])}</code>
                    </span>
                    <span className={styles.pairCount}>{pc.count}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.emptyPanel}>Counts will appear when training begins.</div>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Recent merges</div>
          {recentMerges.length > 0 ? (
            <ul className={styles.mergeList}>
              {recentMerges.map(m => (
                <li key={m.stepNum} className={styles.mergeItem}>
                  <span className={styles.mergeStepNum}>{m.stepNum}.</span>{' '}
                  <code className={styles.tokenChip}>{escapeWs(m.chosenPair[0])}</code>
                  {' + '}
                  <code className={styles.tokenChip}>{escapeWs(m.chosenPair[1])}</code>
                  {' → '}
                  <code
                    className={`${styles.tokenChip} ${
                      m.stepNum === stepIdx ? styles.tokenChipNew : ''
                    }`}
                  >
                    {escapeWs(m.newToken)}
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyPanel}>
              Merges will appear here as they're learned.
            </div>
          )}
          <div className={styles.vocabSize}>
            Vocab size: <strong>{vocabSize}</strong>
          </div>
        </div>
      </div>

      <div className={styles.corpusPanel}>
        <div className={styles.panelTitle}>Corpus state — each word as token sequence</div>
        <div className={styles.corpusGrid}>
          {currentCorpus.map((wordTokens, wIdx) => (
            <div key={wIdx} className={styles.corpusWord}>
              {wordTokens.map((tok, tIdx) => (
                <code
                  key={tIdx}
                  className={`${styles.tokenChip} ${
                    newToken !== null && tok === newToken ? styles.tokenChipGlow : ''
                  }`}
                >
                  {escapeWs(tok)}
                </code>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function escapeWs(s: string): string {
  return s.replace(/ /g, '␣').replace(/\n/g, '↵').replace(/\t/g, '⇥');
}
