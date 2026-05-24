import { useState, useEffect, useRef } from 'react';
import {
  EXAMPLE,
  MAX_SLOTS,
  initialState,
  nextState,
  filledCount,
  type AnimationState,
  type SlotState,
} from './kv-cache-data';
import styles from './KVCacheAnimation.module.css';

const BASE_STEP_MS = 1500;

export default function KVCacheAnimation() {
  const [state, setState] = useState<AnimationState>(initialState());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (state.phase === 'done') {
      setPlaying(false);
      return;
    }
    const intervalMs = BASE_STEP_MS / speed;
    timerRef.current = setTimeout(() => {
      setState(s => nextState(s));
    }, intervalMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, state, speed]);

  function handlePlay() {
    if (state.phase === 'done') {
      setState(initialState());
    }
    setPlaying(true);
  }
  function handlePause() {
    setPlaying(false);
  }
  function handleReset() {
    setPlaying(false);
    setState(initialState());
  }

  const filled = filledCount(state);
  const prefillCount = state.slots.filter(s => s.phase === 'prefill').length;
  const decodeCount = state.slots.filter(s => s.phase === 'decode').length;

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>KV cache lifecycle</div>
        <div className={styles.titleSubLabel}>
          Prompt: <strong>"{EXAMPLE.promptTokens.join(' ')}"</strong> → Generated:{' '}
          <strong>"{EXAMPLE.decodeTokens.join('')}"</strong>
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlButtons}>
          <button
            className={styles.button}
            onClick={handlePlay}
            disabled={playing && state.phase !== 'done'}
          >
            ▶ Play
          </button>
          <button className={styles.button} onClick={handlePause} disabled={!playing}>
            ⏸ Pause
          </button>
          <button className={styles.button} onClick={handleReset}>
            ↻ Reset
          </button>
        </div>
        <div className={styles.speedControl}>
          <span className={styles.speedLabel}>Speed: {speed.toFixed(1)}×</span>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className={styles.speedSlider}
            aria-label="speed"
          />
        </div>
      </div>

      <div className={styles.cachePanel}>
        <div className={styles.cacheTitle}>KV cache (one layer shown for clarity)</div>
        <div className={styles.cacheHeader}>
          <span>position</span>
          <span>K</span>
          <span>V</span>
          <span>token</span>
          <span>phase</span>
        </div>
        <div className={styles.cacheSlots}>
          {state.slots.map(slot => (
            <SlotRow key={slot.position} slot={slot} />
          ))}
        </div>
      </div>

      <div className={styles.statusPanel}>
        <div className={styles.statusLabel}>Status</div>
        <div className={styles.statusText}>{state.statusText}</div>
      </div>

      <div className={styles.statsPanel}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Tokens in cache:</span>
          <span className={styles.statValue}>
            {filled} of {MAX_SLOTS} max
          </span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Prefill tokens:</span>
          <span className={`${styles.statValue} ${styles.statPrefill}`}>
            {prefillCount} (filled simultaneously)
          </span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Decode tokens:</span>
          <span className={`${styles.statValue} ${styles.statDecode}`}>
            {decodeCount} (filled one at a time)
          </span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Current phase:</span>
          <span className={`${styles.statValue} ${styles[`phaseTag_${state.phase}`]}`}>
            {state.phase.toUpperCase()}
          </span>
        </div>
      </div>

      <div className={styles.caption}>
        The KV cache stores K and V vectors for every position.{' '}
        <strong>Prefill</strong> processes all prompt tokens at once — 5 slots fill
        simultaneously. <strong>Decode</strong> generates tokens one at a time — each new
        token fills exactly one slot. Without the cache, every decode step would recompute
        K, V for all previous tokens; the speedup is ~700× for a 1024-token sequence.
      </div>
    </div>
  );
}

function SlotRow({ slot }: { slot: SlotState }) {
  const phaseClass =
    slot.phase === 'prefill'
      ? styles.slotPrefill
      : slot.phase === 'decode'
        ? styles.slotDecode
        : styles.slotEmpty;

  return (
    <div className={`${styles.slotRow} ${phaseClass}`}>
      <span className={styles.slotPosition}>{slot.position}</span>
      <span
        className={`${styles.slotBox} ${slot.filled ? styles.slotBoxFilled : ''}`}
      >
        {slot.filled ? 'K' : '—'}
      </span>
      <span
        className={`${styles.slotBox} ${slot.filled ? styles.slotBoxFilled : ''}`}
      >
        {slot.filled ? 'V' : '—'}
      </span>
      <span className={styles.slotToken}>{slot.filled ? `"${slot.token}"` : '—'}</span>
      <span className={styles.slotPhase}>
        {slot.phase === 'prefill' && '← prefill'}
        {slot.phase === 'decode' && '← decode'}
        {slot.phase === null && ''}
      </span>
    </div>
  );
}
