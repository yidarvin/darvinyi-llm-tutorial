import { useMemo, useState } from 'react';
import {
  MODEL_SIZES, METHODS, TARGETS, RANK_OPTIONS, GPU_OPTIONS,
  computeMemory, formatParams,
  type ModelSizeId, type MethodId, type TargetId,
} from './memory-budget-data';
import styles from './ParameterBudgetCalculator.module.css';

export default function ParameterBudgetCalculator() {
  const [modelId, setModelId] = useState<ModelSizeId>('13b');
  const [methodId, setMethodId] = useState<MethodId>('lora');
  const [rank, setRank] = useState(16);
  const [targetId, setTargetId] = useState<TargetId>('qkvo');

  const memory = useMemo(
    () => computeMemory(modelId, methodId, rank, targetId),
    [modelId, methodId, rank, targetId],
  );

  const isLoRABased = methodId !== 'full';

  const fittingGPUs = GPU_OPTIONS.filter(g => g.memoryGB >= memory.total);
  const recommendedGPU = fittingGPUs[0];

  return (
    <div className={styles.widget} role="group" aria-label="Parameter budget calculator">
      {/* Configuration */}
      <div className={styles.controlsPanel}>
        <div className={styles.panelTitle}>Configuration</div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Model size:</span>
          <div className={styles.optionButtons}>
            {(['7b', '13b', '70b'] as ModelSizeId[]).map(m => (
              <button
                key={m}
                className={`${styles.optionButton} ${modelId === m ? styles.optionActive : ''}`}
                onClick={() => setModelId(m)}
              >
                {MODEL_SIZES[m].label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Method:</span>
          <div className={styles.optionButtons}>
            {(['full', 'lora', 'qlora'] as MethodId[]).map(m => (
              <button
                key={m}
                className={`${styles.optionButton} ${methodId === m ? styles.optionActive : ''}`}
                onClick={() => setMethodId(m)}
                title={METHODS[m].description}
              >
                {METHODS[m].label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.controlRow} ${!isLoRABased ? styles.disabled : ''}`}>
          <span className={styles.controlLabel}>Rank:</span>
          <div className={styles.optionButtons}>
            {RANK_OPTIONS.map(r => (
              <button
                key={r}
                className={`${styles.optionButton} ${rank === r ? styles.optionActive : ''}`}
                onClick={() => setRank(r)}
                disabled={!isLoRABased}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.controlRow} ${!isLoRABased ? styles.disabled : ''}`}>
          <span className={styles.controlLabel}>Target:</span>
          <div className={styles.optionButtons}>
            {(['qv', 'qkvo', 'all'] as TargetId[]).map(t => (
              <button
                key={t}
                className={`${styles.optionButton} ${targetId === t ? styles.optionActive : ''}`}
                onClick={() => setTargetId(t)}
                disabled={!isLoRABased}
              >
                {TARGETS[t].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Memory breakdown */}
      <div className={styles.breakdownPanel}>
        <div className={styles.panelTitle}>Memory breakdown</div>
        <MemoryBar
          label="Base weights"
          subLabel={methodId === 'qlora' ? '(NF4)' : '(BF16)'}
          value={memory.baseWeights}
          maxValue={memory.total}
          colorClass={styles.barBase}
        />
        {isLoRABased && (
          <MemoryBar
            label="Trainable params"
            subLabel="(BF16)"
            value={memory.trainableParams}
            maxValue={memory.total}
            colorClass={styles.barTrainable}
          />
        )}
        <MemoryBar
          label="Gradients"
          subLabel="(BF16)"
          value={memory.gradients}
          maxValue={memory.total}
          colorClass={styles.barGrad}
        />
        <MemoryBar
          label="Optimizer state"
          subLabel="(FP32, AdamW)"
          value={memory.optimizerState}
          maxValue={memory.total}
          colorClass={styles.barOptim}
        />
        <MemoryBar
          label="Activations"
          subLabel="(estimated)"
          value={memory.activations}
          maxValue={memory.total}
          colorClass={styles.barAct}
        />
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>TOTAL</span>
          <span className={styles.totalValue}>~{memory.total.toFixed(1)} GB</span>
        </div>
      </div>

      {/* GPU recommendation */}
      <div className={styles.gpuPanel}>
        <div className={styles.panelTitle}>GPU recommendation</div>
        {GPU_OPTIONS.map(g => {
          const fits = g.memoryGB >= memory.total;
          const isRecommended = fits && g === recommendedGPU;
          return (
            <div
              key={g.label}
              className={`${styles.gpuRow} ${fits ? styles.gpuFits : styles.gpuNoFit}`}
            >
              <span className={styles.gpuMarker}>{fits ? '✓' : '✗'}</span>
              <span className={styles.gpuLabel}>{g.label}</span>
              <span className={styles.gpuMemory}>({g.memoryGB} GB)</span>
              <span className={styles.gpuStatus}>
                {fits
                  ? isRecommended
                    ? <strong className={styles.recommendedTag}>FITS, recommended</strong>
                    : 'fits'
                  : 'does NOT fit'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className={styles.summaryPanel}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Trainable parameters:</span>
          <span className={styles.summaryValue}>
            {formatParams(memory.trainableCount)}{' '}
            ({(100 * memory.trainableRatio).toFixed(3)}% of base)
          </span>
        </div>
        {isLoRABased && (
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Adapter on disk (BF16):</span>
            <span className={styles.summaryValue}>{memory.adapterDiskMB.toFixed(1)} MB</span>
          </div>
        )}
      </div>

      <div className={styles.caption}>
        {methodId === 'full' && (
          <>
            Full fine-tuning needs <strong>{memory.total.toFixed(0)} GB</strong> for {MODEL_SIZES[modelId].label}.
            That's {Math.ceil(memory.total / 80)}× A100 80GB minimum. <strong>Most teams can't afford this.</strong>
          </>
        )}
        {methodId === 'lora' && (
          <>
            LoRA fits {MODEL_SIZES[modelId].label} into <strong>{memory.total.toFixed(0)} GB</strong>.
            {recommendedGPU && <> Fits on a single <strong>{recommendedGPU.label}</strong>.</>}
            {' '}Adapter is {memory.adapterDiskMB.toFixed(0)} MB, easy to store and swap.
          </>
        )}
        {methodId === 'qlora' && (
          <>
            QLoRA (NF4 base) fits {MODEL_SIZES[modelId].label} into <strong>{memory.total.toFixed(0)} GB</strong>.
            {recommendedGPU && <> Fits on a single <strong>{recommendedGPU.label}</strong>.</>}
            {' '}<strong>This is what made open-source post-training accessible.</strong>
          </>
        )}
      </div>
    </div>
  );
}

function MemoryBar({
  label,
  subLabel,
  value,
  maxValue,
  colorClass,
}: {
  label: string;
  subLabel?: string;
  value: number;
  maxValue: number;
  colorClass: string | undefined;
}) {
  const widthPct = Math.max(0.5, (value / maxValue) * 100);
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>
        {label}
        {subLabel && <span className={styles.barSubLabel}> {subLabel}</span>}
      </span>
      <div className={styles.barTrack}>
        <div className={`${styles.barFill} ${colorClass ?? ''}`} style={{ width: `${widthPct}%` }} />
      </div>
      <span className={styles.barValue}>{value.toFixed(2)} GB</span>
    </div>
  );
}
