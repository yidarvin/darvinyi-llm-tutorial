import { useState, useMemo } from 'react';
import {
  SAMPLES, type FilterKey, passesFilters, dropsAlone, categoryColor,
} from './quality-data';
import styles from './QualityFilter.module.css';

const DEFAULT_ENABLED: Record<FilterKey, boolean> = {
  length: true,
  language: true,
  repetition: true,
  classifier: true,
};

const DEFAULT_CLASSIFIER_THRESHOLD = 0.5;

const FILTER_LABELS: Record<FilterKey, { short: string; full: string }> = {
  length:     { short: 'L',  full: 'Length (>100 chars)' },
  language:   { short: 'Lg', full: 'Language (>60% ASCII letters)' },
  repetition: { short: 'Rp', full: 'Repetition (unique/total > 0.3)' },
  classifier: { short: 'Cl', full: 'Quality classifier' },
};

export default function QualityFilter() {
  const [enabled, setEnabled] = useState(DEFAULT_ENABLED);
  const [threshold, setThreshold] = useState(DEFAULT_CLASSIFIER_THRESHOLD);

  const results = useMemo(
    () => SAMPLES.map(s => ({ sample: s, ...passesFilters(s, enabled, threshold) })),
    [enabled, threshold]
  );

  const keptCount = results.filter(r => r.passes).length;

  function toggleFilter(key: FilterKey) {
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function reset() {
    setEnabled(DEFAULT_ENABLED);
    setThreshold(DEFAULT_CLASSIFIER_THRESHOLD);
  }

  return (
    <div className={styles.widget}>
      <div className={styles.panelTitle}>Enable filters</div>
      <div className={styles.toggleList}>
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map(key => (
          <label key={key} className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={enabled[key]}
              onChange={() => toggleFilter(key)}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>{FILTER_LABELS[key].full}</span>
            <span className={styles.dropsAlone}>
              [drops {dropsAlone(key, threshold)} alone]
            </span>
          </label>
        ))}
      </div>

      <div className={styles.thresholdRow}>
        <label className={styles.controlLabel}>
          Classifier threshold: <span className={styles.controlValue}>{threshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          className={styles.slider}
          aria-label="Classifier threshold"
          disabled={!enabled.classifier}
        />
        <button onClick={reset} className={styles.resetButton}>Reset</button>
      </div>

      <div className={styles.summary}>
        Result: <strong>{keptCount}</strong> of {SAMPLES.length} samples pass all enabled filters
        {keptCount === 0 && <span className={styles.summaryWarn}> (none pass — try loosening)</span>}
      </div>

      <div className={styles.panelTitle}>Samples</div>
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.colId}>ID</div>
          <div className={styles.colText}>Text</div>
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map(key => (
            <div key={key} className={`${styles.colFilter} ${!enabled[key] ? styles.colDisabled : ''}`} title={FILTER_LABELS[key].full}>
              {FILTER_LABELS[key].short}
            </div>
          ))}
          <div className={styles.colPass}>Pass?</div>
        </div>

        {results.map(({ sample, passes, perFilter }) => (
          <div key={sample.id} className={`${styles.tableRow} ${passes ? styles.rowPasses : styles.rowFails}`}>
            <div className={styles.colId}>
              <span
                className={styles.catIndicator}
                style={{ backgroundColor: categoryColor(sample.trueCategory) }}
                title={`Category: ${sample.trueCategory}`}
              />
              {sample.id}
            </div>
            <div className={styles.colText} title={sample.text}>
              {sample.text.length > 50 ? sample.text.slice(0, 50) + '…' : sample.text}
            </div>
            {(Object.keys(FILTER_LABELS) as FilterKey[]).map(key => (
              <div key={key} className={`${styles.colFilter} ${!enabled[key] ? styles.colDisabled : ''}`}>
                {perFilter[key] ? <span className={styles.passMark}>✓</span> : <span className={styles.failMark}>✗</span>}
              </div>
            ))}
            <div className={`${styles.colPass} ${passes ? styles.passText : styles.failText}`}>
              {passes ? '✓' : '✗'}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footerHint}>
        Try disabling individual filters to see what each catches alone. Quality classifier is the most aggressive — without it, some obvious junk (placeholders, mild spam) slips through heuristics.
      </div>
    </div>
  );
}
