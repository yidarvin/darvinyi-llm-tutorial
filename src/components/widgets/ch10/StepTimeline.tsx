import { useState } from 'react';
import {
  sequentialMetrics, overlappedMetrics, speedupFromOverlap,
  type StepTiming,
} from './step-timeline-data';
import styles from './StepTimeline.module.css';

export default function StepTimeline() {
  const [computeTime, setComputeTime] = useState(100);
  const [commTime, setCommTime] = useState(40);

  const timing: StepTiming = { computeTime, commTime };
  const seq = sequentialMetrics(timing);
  const ovr = overlappedMetrics(timing);
  const speedup = speedupFromOverlap(timing);

  return (
    <div className={styles.widget}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Compute time: <span className={styles.controlValue}>{computeTime} ms</span>
          </label>
          <input
            type="range" min={10} max={300} step={5}
            value={computeTime}
            onChange={e => setComputeTime(Number(e.target.value))}
            className={styles.slider}
            aria-label="Compute time"
          />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Communication time: <span className={styles.controlValue}>{commTime} ms</span>
          </label>
          <input
            type="range" min={10} max={300} step={5}
            value={commTime}
            onChange={e => setCommTime(Number(e.target.value))}
            className={styles.slider}
            aria-label="Communication time"
          />
        </div>
      </div>

      <div className={styles.timelinePanel}>
        <div className={styles.timelineLabel}>
          Sequential — communication after compute (no overlap)
        </div>
        <TimelineSvg
          mode="sequential"
          computeTime={computeTime}
          commTime={commTime}
          totalTime={seq.totalTime}
        />
        <div className={styles.metricsRow}>
          <Metric label="Step total" value={`${seq.totalTime} ms`} />
          <Metric label="MFU" value={`${(seq.mfu * 100).toFixed(0)}%`} />
        </div>
      </div>

      <div className={styles.timelinePanel}>
        <div className={styles.timelineLabel}>
          Overlapped — communication hidden behind compute
        </div>
        <TimelineSvg
          mode="overlapped"
          computeTime={computeTime}
          commTime={commTime}
          totalTime={ovr.totalTime}
        />
        <div className={styles.metricsRow}>
          <Metric label="Step total" value={`${ovr.totalTime} ms`} />
          <Metric label="MFU" value={`${(ovr.mfu * 100).toFixed(0)}%`} highlight={ovr.mfu >= 0.95} />
        </div>
      </div>

      <div className={styles.speedupPanel}>
        <span className={styles.speedupLabel}>Speedup from overlap:</span>
        <span className={styles.speedupValue}>{speedup.toFixed(2)}×</span>
        <span className={styles.speedupNote}>
          {speedup >= 1.5 && '— large win, communication was the bottleneck'}
          {speedup >= 1.1 && speedup < 1.5 && '— meaningful win'}
          {speedup < 1.1 && '— small win, communication was already cheap relative to compute'}
        </span>
      </div>

      <div className={styles.caption}>
        The difference between sequential and overlapped MFU here is just <em>ordering</em> —
        same compute, same communication, but communication scheduled to run during compute.
        Modern training frameworks (PyTorch FSDP, Megatron-LM) overlap automatically via async
        CUDA streams and careful kernel scheduling. The MFU gap between a default-tuned and
        well-tuned training run is largely this overlap.
      </div>
    </div>
  );
}

interface TimelineSvgProps {
  mode: 'sequential' | 'overlapped';
  computeTime: number;
  commTime: number;
  totalTime: number;
}

function TimelineSvg({ mode, computeTime, commTime, totalTime }: TimelineSvgProps) {
  const WIDTH = 720;
  const HEIGHT = 120;
  const PADDING_LEFT = 70;
  const PADDING_RIGHT = 20;
  const PADDING_TOP = 20;
  const LANE_HEIGHT = 30;
  const LANE_GAP = 8;

  const plotW = WIDTH - PADDING_LEFT - PADDING_RIGHT;

  const SCALE_MAX = 600;
  function timeToX(t: number): number {
    return (t / SCALE_MAX) * plotW;
  }

  const computeY = PADDING_TOP;
  const computeStartX = PADDING_LEFT;
  const computeEndX = PADDING_LEFT + timeToX(computeTime);

  const commY = PADDING_TOP + LANE_HEIGHT + LANE_GAP;
  let commStartX: number;
  let commEndX: number;

  if (mode === 'sequential') {
    commStartX = computeEndX;
    commEndX = commStartX + timeToX(commTime);
  } else {
    commStartX = PADDING_LEFT;
    commEndX = PADDING_LEFT + timeToX(commTime);
  }

  const totalEndX = PADDING_LEFT + timeToX(totalTime);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} role="img" aria-label={`${mode} timeline`}>
      <line
        x1={PADDING_LEFT} x2={PADDING_LEFT + plotW}
        y1={HEIGHT - 22} y2={HEIGHT - 22}
        className={styles.axisLine}
      />
      {[0, 100, 200, 300, 400, 500, 600].map(t => (
        <g key={`tick-${t}`}>
          <line
            x1={PADDING_LEFT + timeToX(t)} x2={PADDING_LEFT + timeToX(t)}
            y1={HEIGHT - 22} y2={HEIGHT - 18}
            className={styles.tickLine}
          />
          <text
            x={PADDING_LEFT + timeToX(t)} y={HEIGHT - 6}
            className={styles.tickLabel}
            textAnchor="middle"
          >
            {t} ms
          </text>
        </g>
      ))}

      <text x={PADDING_LEFT - 10} y={computeY + LANE_HEIGHT / 2 + 5} className={styles.laneLabel} textAnchor="end">Compute</text>
      <text x={PADDING_LEFT - 10} y={commY + LANE_HEIGHT / 2 + 5} className={styles.laneLabel} textAnchor="end">Comm</text>

      <rect
        x={computeStartX} y={computeY}
        width={computeEndX - computeStartX} height={LANE_HEIGHT}
        rx={3}
        className={styles.computeBlock}
      />
      <text
        x={computeStartX + (computeEndX - computeStartX) / 2}
        y={computeY + LANE_HEIGHT / 2 + 5}
        className={styles.blockLabel}
        textAnchor="middle"
      >
        {computeTime} ms
      </text>

      <rect
        x={commStartX} y={commY}
        width={commEndX - commStartX} height={LANE_HEIGHT}
        rx={3}
        className={styles.commBlock}
      />
      <text
        x={commStartX + (commEndX - commStartX) / 2}
        y={commY + LANE_HEIGHT / 2 + 5}
        className={styles.blockLabel}
        textAnchor="middle"
      >
        {commTime} ms
      </text>

      <line
        x1={totalEndX} x2={totalEndX}
        y1={PADDING_TOP - 5} y2={HEIGHT - 22}
        className={styles.totalMarker}
      />
      <text
        x={totalEndX + 4} y={PADDING_TOP + 5}
        className={styles.totalLabel}
      >
        ← step end ({totalTime} ms)
      </text>
    </svg>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`${styles.metric} ${highlight ? styles.metricHighlight : ''}`}>
      <span className={styles.metricLabel}>{label}:</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  );
}
