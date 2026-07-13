import { useState, useMemo } from 'react';
import {
  PROBLEMS,
  aggregate,
  singleTraceAccuracy,
  insightFor,
} from './self-consistency-data';
import styles from './SelfConsistencyAggregator.module.css';

export default function SelfConsistencyAggregator() {
  const [problemIdx, setProblemIdx] = useState(0);
  const [n, setN] = useState(7);
  const problem = PROBLEMS[problemIdx]!;

  const result = useMemo(() => aggregate(problem.traces, n), [problem, n]);
  const singleAcc = useMemo(() => singleTraceAccuracy(problem), [problem]);
  const isCorrect = result.majorityAnswer === problem.correctAnswer;
  const insight = insightFor(n, isCorrect, result.confidence);
  const maxCount = result.sortedAnswers[0]?.count ?? 1;

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Self-consistency aggregator</div>
        <div className={styles.titleSubLabel}>
          N independent CoT traces · majority vote
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Problem:</span>
          <div className={styles.problemButtons}>
            {PROBLEMS.map((p, i) => (
              <button
                key={p.id}
                className={`${styles.problemButton} ${problemIdx === i ? styles.problemButtonActive : ''}`}
                onClick={() => setProblemIdx(i)}
              >
                {p.id}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.questionRow}>{problem.question}</div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Number of traces (N):</span>
          <span className={styles.controlValue}>N = {n}</span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className={styles.slider}
            aria-label="Number of traces"
          />
        </div>
      </div>

      <div className={styles.tracesPanel}>
        <div className={styles.tracesTitle}>
          Sampled traces (first {n} of {problem.traces.length})
        </div>
        <div className={styles.tracesList}>
          {problem.traces.slice(0, n).map((t, i) => (
            <div
              key={i}
              className={`${styles.traceRow} ${t.isCorrect ? styles.traceCorrect : styles.traceWrong}`}
            >
              <span className={styles.traceIdx}>#{i + 1}</span>
              <span className={styles.traceStatus}>{t.isCorrect ? '✓' : '✗'}</span>
              <span className={styles.traceReasoning}>{t.reasoning}</span>
              <span className={styles.traceAnswer}>→ {t.answer}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.histogramPanel}>
        <div className={styles.histogramTitle}>Answer distribution (N = {n})</div>
        <div className={styles.histogramBars}>
          {result.sortedAnswers.map(({ answer, count }, i) => {
            const widthPct = (count / maxCount) * 100;
            const isWinner = i === 0;
            const isCorrectAnswer = answer === problem.correctAnswer;
            return (
              <div key={answer} className={styles.histRow}>
                <span className={styles.histAnswerLabel}>{answer}</span>
                <div className={styles.histBarTrack}>
                  <div
                    className={`${styles.histBar} ${isWinner ? styles.histBarWinner : ''} ${isCorrectAnswer ? styles.histBarCorrectAnswer : ''}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className={styles.histCount}>
                  {count} vote{count !== 1 ? 's' : ''}
                  {isWinner && ' ★'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`${styles.resultPanel} ${isCorrect ? styles.resultCorrect : styles.resultWrong}`}
      >
        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>Majority answer:</span>
          <span className={styles.resultValue}>
            {result.majorityAnswer} (confidence {(result.confidence * 100).toFixed(0)}%)
          </span>
        </div>
        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>Correct answer:</span>
          <span className={styles.resultValue}>
            {problem.correctAnswer} {isCorrect ? '(✓ Match)' : '(✗ Mismatch)'}
          </span>
        </div>
      </div>

      <div className={styles.comparisonPanel}>
        <div className={styles.comparisonTitle}>Single-trace vs majority-vote</div>
        <div className={styles.comparisonBody}>
          <div className={styles.comparisonRow}>
            <span className={styles.compLabel}>Single trace accuracy (pool average):</span>
            <span className={styles.compValue}>{(singleAcc * 100).toFixed(0)}%</span>
          </div>
          <div className={styles.comparisonRow}>
            <span className={styles.compLabel}>Majority vote at N = {n}:</span>
            <span
              className={`${styles.compValue} ${isCorrect ? styles.compValueCorrect : styles.compValueWrong}`}
            >
              {isCorrect ? '100% (correct)' : '0% (wrong)'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{insight}</div>
      </div>

      <div className={styles.caption}>
        Drag the slider from <strong>N=1</strong> upward. At <strong>N=1</strong>, you get
        whatever the first trace says, sometimes right, sometimes wrong. As{' '}
        <strong>N grows</strong>, wrong traces get outvoted; the correct answer emerges as the
        majority. <strong>Gains are largest from N=1 to N=10</strong>; past N=10-15, additional
        traces add little. This is self-consistency, the simplest test-time compute technique
        that works, and the conceptual ancestor of best-of-N+PRM and modern reasoning models.
      </div>
    </div>
  );
}
