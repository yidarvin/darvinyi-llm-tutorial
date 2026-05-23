import { useMemo, useState } from 'react';
import {
  GPU_SPECS,
  type GPUKey,
  evaluateStacks,
  recommendStack,
  estimateTrainingRun,
  sliderToParams,
  paramsToSlider,
  sliderToGpuCount,
  gpuCountToSlider,
  formatLargeNumber,
  formatUSD,
  formatTime,
} from './training-stack-data';
import styles from './TrainingStackPicker.module.css';

export default function TrainingStackPicker() {
  const [paramsSlider, setParamsSlider] = useState(paramsToSlider(7e9));
  const [gpuKey, setGpuKey] = useState<GPUKey>('h100');
  const [gpuCountSlider, setGpuCountSlider] = useState(gpuCountToSlider(64));

  const modelParams = sliderToParams(paramsSlider);
  const gpuCount = sliderToGpuCount(gpuCountSlider);
  const gpu = GPU_SPECS.find(g => g.key === gpuKey)!;

  const stacks = useMemo(
    () => evaluateStacks(modelParams, gpu, gpuCount),
    [modelParams, gpu, gpuCount],
  );

  const recommendedKey = recommendStack(stacks);
  const recommended = stacks.find(s => s.key === recommendedKey)!;

  const trainingRun = useMemo(
    () => estimateTrainingRun(modelParams, gpu, gpuCount, recommended.mfuEstimate),
    [modelParams, gpu, gpuCount, recommended],
  );

  return (
    <div className={styles.widget}>
      <div className={styles.controlsPanel}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Model size:{' '}
            <span className={styles.controlValue}>{formatLargeNumber(modelParams)} params</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={paramsSlider}
            onChange={e => setParamsSlider(Number(e.target.value))}
            className={styles.slider}
            aria-label="Model size"
          />
          <div className={styles.sliderHints}>
            <span>100M</span>
            <span>1B</span>
            <span>10B</span>
            <span>100B</span>
            <span>1T</span>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>GPU type</label>
          <div className={styles.radioGroup}>
            {GPU_SPECS.map(g => (
              <label key={g.key} className={styles.radioItem}>
                <input
                  type="radio"
                  name="gpu-type"
                  checked={gpuKey === g.key}
                  onChange={() => setGpuKey(g.key)}
                />
                <span>{g.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            GPU count:{' '}
            <span className={styles.controlValue}>{gpuCount.toLocaleString()} GPUs</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={gpuCountSlider}
            onChange={e => setGpuCountSlider(Number(e.target.value))}
            className={styles.slider}
            aria-label="GPU count"
          />
          <div className={styles.sliderHints}>
            <span>8</span>
            <span>64</span>
            <span>512</span>
            <span>4K</span>
            <span>16K</span>
          </div>
        </div>
      </div>

      <div className={styles.recommendationPanel}>
        <div className={styles.recommendationHeader}>
          RECOMMENDED: <strong>{recommended.label}</strong>
        </div>
        <div className={styles.recommendationRanks}>
          <span>TP={recommended.tpRank}</span>
          <span>PP={recommended.ppRank}</span>
          <span>DP={recommended.dpRank.toLocaleString()}</span>
        </div>

        <MemoryBar
          used={recommended.memoryPerGPU}
          total={gpu.memoryGB}
          fits={recommended.fits}
        />

        <div className={styles.metricsGrid}>
          <Metric
            label="MFU"
            value={`${(recommended.mfuEstimate * 100).toFixed(0)}%`}
          />
          <Metric
            label="Time"
            value={formatTime(trainingRun.hours)}
            subtext={`(${formatLargeNumber(trainingRun.tokensTotal)} tokens, Chinchilla)`}
          />
          <Metric
            label="Cost"
            value={formatUSD(trainingRun.costUSD)}
            subtext={`@ $${gpu.hourlyCostUSD}/GPU-hour`}
          />
        </div>
      </div>

      <div className={styles.rationalePanel}>
        <div className={styles.rationaleTitle}>Why {recommended.shortLabel}?</div>
        <div className={styles.rationaleBody}>{recommended.rationale}</div>
      </div>

      <div className={styles.compareTitle}>All four stacks at this configuration:</div>
      <div className={styles.compareGrid}>
        {stacks.map(s => (
          <div
            key={s.key}
            className={`${styles.stackCard} ${
              s.key === recommendedKey ? styles.stackCardRecommended : ''
            }`}
          >
            <div className={styles.stackCardHeader}>
              {s.shortLabel} {s.key === recommendedKey && '★'}
            </div>
            <div
              className={`${styles.stackCardFitsRow} ${
                s.fits ? styles.fitsOk : styles.fitsNo
              }`}
            >
              {s.fits ? '✓ fits' : '✗ exceeds GPU memory'}
            </div>
            <div className={styles.stackCardMemory}>
              {s.memoryPerGPU < 1
                ? `${(s.memoryPerGPU * 1024).toFixed(0)} MB`
                : `${s.memoryPerGPU.toFixed(1)} GB`}{' '}
              / GPU
            </div>
            <div className={styles.stackCardRanks}>
              TP={s.tpRank} PP={s.ppRank} DP={s.dpRank.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
      {subtext && <div className={styles.metricSubtext}>{subtext}</div>}
    </div>
  );
}

function MemoryBar({
  used,
  total,
  fits,
}: {
  used: number;
  total: number;
  fits: boolean;
}) {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div className={styles.memoryBarSection}>
      <div className={styles.memoryBarLabel}>
        Per-GPU memory:{' '}
        <strong>
          {used < 1 ? `${(used * 1024).toFixed(0)} MB` : `${used.toFixed(1)} GB`} / {total} GB
        </strong>
        {fits ? (
          <span className={styles.memoryBarOk}> ✓</span>
        ) : (
          <span className={styles.memoryBarBad}> ✗ exceeds</span>
        )}
      </div>
      <div className={styles.memoryBarTrack}>
        <div
          className={`${styles.memoryBarFill} ${
            fits ? styles.memoryBarFillOk : styles.memoryBarFillBad
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
