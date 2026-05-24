import { useMemo, useState } from 'react';
import {
  EXAMPLE,
  softmaxWithTemperature,
  sliderToT,
  tToSlider,
  classifyState,
} from './temperature-data';
import styles from './TemperatureScaling.module.css';

export default function TemperatureScaling() {
  const [sliderValue, setSliderValue] = useState(0); // 0 corresponds to T=1
  const T = sliderToT(sliderValue);

  const logits = useMemo(() => EXAMPLE.candidates.map((c) => c.logit), []);
  const probs = useMemo(() => softmaxWithTemperature(logits, T), [logits, T]);

  const sorted = probs
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p - a.p);
  const top1 = sorted[0]!;
  const top2 = sorted[1]!;
  const ratio = top2.p / top1.p;

  const { darkKnowledgeStatus, insight } = classifyState(T);

  // Bar widths normalized to the current maximum so the top class always
  // uses the full track at any T.
  const maxProb = top1.p;

  return (
    <div className={styles.widget}>
      {/* Prompt panel */}
      <div className={styles.promptPanel}>
        <span className={styles.promptLabel}>Prompt:</span>
        <span className={styles.promptText}>{EXAMPLE.prompt}</span>
      </div>

      {/* Temperature slider */}
      <div className={styles.sliderPanel}>
        <div className={styles.sliderHeader}>
          <span className={styles.sliderLabel}>Temperature T:</span>
          <span className={styles.sliderValue}>T = {T.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className={styles.slider}
          aria-label="temperature"
        />
        <div className={styles.sliderTicks}>
          {[1, 2, 4, 8, 16, 32, 50].map((t) => (
            <span
              key={t}
              className={styles.sliderTick}
              style={{ left: `${tToSlider(t)}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>
          Distribution (softmax with T = {T.toFixed(2)}):
        </div>
        <div className={styles.barChart}>
          {EXAMPLE.candidates.map((c, i) => {
            const p = probs[i]!;
            const widthPct = (p / maxProb) * 100;
            return (
              <div key={c.label} className={styles.barRow}>
                <span className={`${styles.barLabel} ${styles[`tier_${c.tier}`]}`}>
                  {c.label}
                </span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles[`barFill_${c.tier}`]}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className={styles.barValue}>{p.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top-2 readout */}
      <div className={styles.readoutPanel}>
        <div className={styles.readoutTitle}>Top-2 readout</div>
        <div className={styles.readoutRow}>
          <span className={styles.readoutLabel}>Top-1:</span>
          <span className={styles.readoutValue}>
            {EXAMPLE.candidates[top1.i]!.label} ({top1.p.toFixed(3)})
          </span>
        </div>
        <div className={styles.readoutRow}>
          <span className={styles.readoutLabel}>Top-2:</span>
          <span className={styles.readoutValue}>
            {EXAMPLE.candidates[top2.i]!.label} ({top2.p.toFixed(3)})
          </span>
        </div>
        <div className={styles.readoutRow}>
          <span className={styles.readoutLabel}>Top-2 / Top-1 ratio:</span>
          <span className={styles.readoutValue}>{ratio.toFixed(3)}</span>
        </div>
        <div className={styles.darkKnowledgeRow}>
          <span className={styles.readoutLabel}>Dark knowledge:</span>
          <span
            className={`${styles.dkBadge} ${styles[`dk_${darkKnowledgeStatus}`]}`}
          >
            {darkKnowledgeStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Insight text */}
      <div className={styles.insightPanel}>
        <div className={styles.insightLabel}>Insight</div>
        <div className={styles.insightText}>{insight}</div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Hinton's central insight: <strong>dark knowledge</strong> is the information in
        non-target class probabilities. At T = 1, this information is crushed (the correct
        class dominates). Raising T reveals it — at T = 4–8, the relative similarities
        between classes become visible. <strong>The student trained on softened distributions
        learns more per example</strong> than from hard labels alone.
      </div>
    </div>
  );
}
