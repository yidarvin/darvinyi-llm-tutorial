import { useState } from 'react';
import {
  TARGET_MODULES,
  MODEL_CONFIG,
  RANK_OPTIONS,
  paramsPerMatrix,
  paramsPerLayer,
  paramsWholeModel,
  formatParams,
  type TargetModulesOption,
} from './lora-params-data';
import styles from './LoRAArchitecture.module.css';

export default function LoRAArchitecture() {
  const [rank, setRank] = useState(16);
  const [target, setTarget] = useState<TargetModulesOption>('qkvo');
  const targetInfo = TARGET_MODULES[target];

  const alpha = 2 * rank;

  const perMatrix = paramsPerMatrix(MODEL_CONFIG.d_model);
  const perLayer = paramsPerLayer(targetInfo.count, rank);
  const whole = paramsWholeModel(targetInfo.count, rank);

  const perMatrixTrainable = perMatrix.loraAt(rank);
  const baseSizeMB = MODEL_CONFIG.base_size_bf16_gb * 1000;
  const shrinkFactor = baseSizeMB / whole.adapterDiskMB;

  return (
    <div className={styles.widget}>
      <div className={styles.controlsPanel}>
        <div className={styles.configHeader}>
          Configuration: <strong>{MODEL_CONFIG.label}</strong>, d_model = {MODEL_CONFIG.d_model},
          layers = {MODEL_CONFIG.n_layers}
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Rank r:</span>
          <div className={styles.optionButtons}>
            {RANK_OPTIONS.map((r) => (
              <button
                key={r}
                className={`${styles.optionButton} ${rank === r ? styles.optionActive : ''}`}
                onClick={() => setRank(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Alpha α:</span>
          <span className={styles.alphaDisplay}>
            α = 2r = <strong>{alpha}</strong> (scaling factor α/r = 2)
          </span>
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Target:</span>
          <div className={styles.optionButtons}>
            {(['qv', 'qkvo', 'all'] as TargetModulesOption[]).map((t) => (
              <button
                key={t}
                className={`${styles.optionButton} ${target === t ? styles.optionActive : ''}`}
                onClick={() => setTarget(t)}
                title={TARGET_MODULES[t].description}
              >
                {TARGET_MODULES[t].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.diagramPanel}>
        <div className={styles.diagramTitle}>Attention block diagram (one layer)</div>
        <ArchitectureSvg rank={rank} target={target} />
        <div className={styles.diagramNote}>
          Visual proportions are roughly to-scale (with log scaling at low ranks for visibility).
          The frozen matrices (d_model × d_model ≈ {formatParams(perMatrix.frozen)} params each)
          dominate; LoRA adapters ({formatParams(perMatrixTrainable)} params each) are barely
          visible.
        </div>
      </div>

      <div className={styles.statsPanel}>
        <div className={styles.statsTitle}>Parameter counts</div>
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th></th>
              <th>Per matrix</th>
              <th>Per layer ({targetInfo.count} matrices)</th>
              <th>Whole model ({MODEL_CONFIG.n_layers} layers)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={styles.rowLabel}>Frozen</td>
              <td>{formatParams(perMatrix.frozen)}</td>
              <td>{formatParams(perLayer.frozen)}</td>
              <td>{formatParams(whole.baseTotal)}</td>
            </tr>
            <tr className={styles.trainableRow}>
              <td className={styles.rowLabel}>Trainable</td>
              <td>{formatParams(perMatrixTrainable)}</td>
              <td>{formatParams(perLayer.trainable)}</td>
              <td>{formatParams(whole.trainable)}</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>Ratio</td>
              <td>{((100 * perMatrixTrainable) / perMatrix.frozen).toFixed(2)}%</td>
              <td>{((100 * perLayer.trainable) / perLayer.frozen).toFixed(2)}%</td>
              <td>{(100 * whole.ratio).toFixed(3)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.caption}>
        At rank r = {rank} with <strong>{targetInfo.label}</strong> target modules: the trainable
        adapter is <strong>{(100 * whole.ratio).toFixed(2)}%</strong> of the base model. On disk
        (BF16): <strong>{whole.adapterDiskMB.toFixed(1)} MB</strong>. The base model is
        ~{MODEL_CONFIG.base_size_bf16_gb} GB.{' '}
        <strong>The adapter is roughly {shrinkFactor.toFixed(0)}× smaller.</strong> Train cheap,
        deploy cheap, store many adapters per base.
      </div>
    </div>
  );
}

interface ModuleSpec {
  id: 'Q' | 'K' | 'V' | 'O';
  x: number;
  label: string;
  active: boolean;
}

function ArchitectureSvg({ rank, target }: { rank: number; target: TargetModulesOption }) {
  const WIDTH = 720;
  const HEIGHT = 360;

  const modules: ModuleSpec[] = [
    { id: 'Q', x: 90, label: 'W_Q', active: true },
    { id: 'K', x: 260, label: 'W_K', active: target !== 'qv' },
    { id: 'V', x: 430, label: 'W_V', active: true },
    { id: 'O', x: 600, label: 'W_O', active: target !== 'qv' },
  ];

  const showFFN = target === 'all';

  const matrixW = 70;
  const matrixH = 110;
  const loraBoxSize = Math.max(6, Math.min(matrixW / 2, Math.log2(rank + 1) * 5 + 6));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label="LoRA architecture diagram: four attention projection matrices with LoRA adapters"
    >
      <text x={WIDTH / 2} y={26} className={styles.inputLabel} textAnchor="middle">
        x (input)
      </text>
      <line x1={WIDTH / 2} y1={34} x2={WIDTH / 2} y2={58} className={styles.connector} />
      <line
        x1={modules[0]!.x + matrixW / 2}
        y1={58}
        x2={modules[3]!.x + matrixW / 2}
        y2={58}
        className={styles.connector}
      />
      {modules.map((m) => (
        <line
          key={`conn-${m.id}`}
          x1={m.x + matrixW / 2}
          y1={58}
          x2={m.x + matrixW / 2}
          y2={82}
          className={styles.connector}
        />
      ))}

      {modules.map((m) => (
        <g key={m.id} opacity={m.active ? 1 : 0.25}>
          <text
            x={m.x + matrixW / 2}
            y={78}
            className={styles.moduleLabel}
            textAnchor="middle"
          >
            {m.label}
          </text>
          <rect
            x={m.x}
            y={90}
            width={matrixW}
            height={matrixH}
            className={styles.frozenMatrix}
          />
          {[...Array(8)].map((_, i) => (
            <line
              key={`tex-${m.id}-${i}`}
              x1={m.x + 4}
              x2={m.x + matrixW - 4}
              y1={90 + 14 + i * 12}
              y2={90 + 14 + i * 12}
              className={styles.frozenTexture}
            />
          ))}
          <text
            x={m.x + matrixW / 2}
            y={90 + matrixH + 14}
            className={styles.dimLabel}
            textAnchor="middle"
          >
            4096 × 4096
          </text>

          {m.active && (
            <g>
              <line
                x1={m.x + matrixW + 8}
                y1={90}
                x2={m.x + matrixW + 8}
                y2={90 + matrixH}
                className={styles.loraConnector}
              />
              <rect
                x={m.x + matrixW + 4}
                y={120}
                width={loraBoxSize}
                height={loraBoxSize}
                className={styles.loraBox}
              />
              <text
                x={m.x + matrixW + 4 + loraBoxSize / 2}
                y={120 + loraBoxSize / 2 + 3}
                className={styles.loraLabel}
                textAnchor="middle"
                fontSize="7"
              >
                B
              </text>
              <rect
                x={m.x + matrixW + 4}
                y={120 + loraBoxSize + 4}
                width={loraBoxSize}
                height={loraBoxSize}
                className={styles.loraBox}
              />
              <text
                x={m.x + matrixW + 4 + loraBoxSize / 2}
                y={120 + loraBoxSize + 4 + loraBoxSize / 2 + 3}
                className={styles.loraLabel}
                textAnchor="middle"
                fontSize="7"
              >
                A
              </text>
            </g>
          )}
        </g>
      ))}

      <text x={WIDTH / 2} y={260} className={styles.opLabel} textAnchor="middle">
        attn(Q, K, V) → O
      </text>

      <g transform={`translate(20, ${HEIGHT - 40})`}>
        <rect x={0} y={0} width={18} height={14} className={styles.frozenMatrix} />
        <text x={26} y={11} className={styles.legendLabel} fontSize="10">
          frozen base weights
        </text>
        <rect x={170} y={2} width={10} height={10} className={styles.loraBox} />
        <text x={186} y={11} className={styles.legendLabel} fontSize="10">
          LoRA adapters (trainable, rank {rank})
        </text>
      </g>

      {showFFN && (
        <g transform={`translate(${WIDTH - 220}, ${HEIGHT - 40})`}>
          <rect x={0} y={2} width={14} height={10} className={styles.ffnIcon} />
          <text x={20} y={11} className={styles.legendLabel} fontSize="10">
            + FFN up/down (also LoRA'd)
          </text>
        </g>
      )}
    </svg>
  );
}
