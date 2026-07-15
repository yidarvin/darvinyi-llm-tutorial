import { useMemo, useState } from 'react';
import {
  REAL_MODELS,
  formatParams,
  computeCustomMoEParams,
  DEFAULT_CUSTOM_CONFIG,
  type CustomMoEConfig,
  type ModelSpec,
} from './model-data';
import styles from './ActiveVsTotalParams.module.css';

type SortMode = 'total' | 'active';

export default function ActiveVsTotalParams() {
  const [custom, setCustom] = useState<CustomMoEConfig>(DEFAULT_CUSTOM_CONFIG);
  const [sortMode, setSortMode] = useState<SortMode>('total');

  const customResult = useMemo(() => computeCustomMoEParams(custom), [custom]);

  const sortedModels = useMemo(() => {
    return [...REAL_MODELS].sort((a, b) => {
      if (sortMode === 'total') return a.totalParams - b.totalParams;
      return a.activeParams - b.activeParams;
    });
  }, [sortMode]);

  const maxParams = Math.max(
    ...REAL_MODELS.map(m => m.totalParams),
    customResult.total,
  );

  const customModel: ModelSpec = {
    key: 'custom',
    label: 'Custom MoE',
    type: 'moe',
    totalParams: customResult.total,
    activeParams: customResult.active,
    note: `${custom.numExperts} experts, top-${custom.topK}`,
    releaseYear: 2024,
  };

  return (
    <div className={styles.widget} role="group" aria-label="Active and total parameter explorer">
      <div className={styles.sortToggle}>
        <span className={styles.sortLabel}>Sort by:</span>
        <button
          className={`${styles.sortButton} ${sortMode === 'total' ? styles.sortButtonActive : ''}`}
          onClick={() => setSortMode('total')}
        >Total params</button>
        <button
          className={`${styles.sortButton} ${sortMode === 'active' ? styles.sortButtonActive : ''}`}
          onClick={() => setSortMode('active')}
        >Active params</button>
      </div>

      <div className={styles.chartPanel}>
        {sortedModels.map(m => (
          <ModelBar key={m.key} model={m} maxParams={maxParams} />
        ))}

        <div className={styles.customSeparator}>Your custom MoE</div>
        <ModelBar model={customModel} maxParams={maxParams} isCustom />

        <div className={styles.legend}>
          <span><span className={styles.legendSwatchActive} /> active (compute cost per token)</span>
          <span><span className={styles.legendSwatchInactive} /> total – active (memory cost only)</span>
        </div>
      </div>

      <div className={styles.configPanel}>
        <div className={styles.configTitle}>Custom MoE configuration</div>
        <div className={styles.configGrid}>
          <Slider
            label="N experts"
            value={custom.numExperts}
            min={2} max={256} step={1}
            onChange={v => setCustom({ ...custom, numExperts: v })}
          />
          <KSelector
            value={custom.topK}
            onChange={v => setCustom({ ...custom, topK: v })}
          />
          <Slider
            label="Layers"
            value={custom.numLayers}
            min={8} max={120} step={1}
            onChange={v => setCustom({ ...custom, numLayers: v })}
          />
          <Slider
            label="d_model"
            value={custom.dModel}
            min={512} max={16384} step={128}
            onChange={v => setCustom({ ...custom, dModel: v, dFFN: 4 * v })}
          />
        </div>
        <div className={styles.configResults}>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Total params</span>
            <span className={styles.configMetricValue}>{formatParams(customResult.total)}</span>
          </div>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Active params</span>
            <span className={styles.configMetricValueActive}>{formatParams(customResult.active)}</span>
          </div>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Sparsity</span>
            <span className={styles.configMetricValue}>{(customResult.active / customResult.total * 100).toFixed(0)}%</span>
          </div>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Memory (BF16)</span>
            <span className={styles.configMetricValue}>{(customResult.total * 2 / 1e9).toFixed(0)} GB</span>
          </div>
          <div className={styles.configMetric}>
            <span className={styles.configMetricLabel}>Compute/token</span>
            <span className={styles.configMetricValue}>{(customResult.active * 6 / 1e9).toFixed(0)} GFLOPs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelBar({ model, maxParams, isCustom }: { model: ModelSpec; maxParams: number; isCustom?: boolean }) {
  const totalPct = (model.totalParams / maxParams) * 100;
  const activePct = (model.activeParams / maxParams) * 100;
  const isMoE = model.type === 'moe';
  const titleParts = [
    model.label,
    `total ${formatParams(model.totalParams)}`,
    `active ${formatParams(model.activeParams)}`,
    model.note ?? '',
    `${model.releaseYear}`,
  ].filter(Boolean);

  return (
    <div className={`${styles.modelRow} ${isCustom ? styles.modelRowCustom : ''}`} title={titleParts.join(' · ')}>
      <div className={styles.modelLabel}>{model.label}</div>
      <div className={styles.barContainer}>
        <div className={styles.barTotal} style={{ width: `${totalPct}%` }} />
        <div className={styles.barActive} style={{ width: `${activePct}%` }} />
      </div>
      <div className={styles.modelStats}>
        {isMoE ? (
          <>
            <span className={styles.statTotal}>{formatParams(model.totalParams)}</span>
            <span className={styles.statSeparator}>/</span>
            <span className={styles.statActive}>{formatParams(model.activeParams)}</span>
          </>
        ) : (
          <span className={styles.statTotal}>{formatParams(model.totalParams)}</span>
        )}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className={styles.sliderGroup}>
      <label className={styles.sliderLabel}>{label}: <span className={styles.sliderValue}>{value}</span></label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={styles.slider}
      />
    </div>
  );
}

function KSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className={styles.sliderGroup}>
      <label className={styles.sliderLabel}>Top-k: <span className={styles.sliderValue}>{value}</span></label>
      <div className={styles.kButtons}>
        {[1, 2, 4, 8].map(k => (
          <button
            key={k}
            className={`${styles.kButton} ${value === k ? styles.kButtonActive : ''}`}
            onClick={() => onChange(k)}
          >{k}</button>
        ))}
      </div>
    </div>
  );
}
