# Session 78 — KV cache animation marquee widget

> The marquee Chapter 17 widget. An **animated visualization of the KV cache lifecycle**. Reader watches the cache go from empty → fully-prefilled-at-once → growing-one-slot-at-a-time-during-decode. The example is concrete: prompt "The capital of France is" → generated "Paris." Phase 1 (prefill) fills 5 cache slots **simultaneously**; Phase 2 (decode) fills the 6th and 7th slots **one at a time**. Color coding: amber for prefill-filled slots, cyan for decode-filled slots, gray for empty. **Play/pause/reset** controls. **The visualization that makes the central inference optimization viscerally obvious** — readers internalize the two-phase structure of inference and see the cache's role at each phase.

---

## Read first (in this order)

1. **`research/ch17-inference-optimization/research.md`** — concepts 1 (two phases) and 2 (KV cache) are the source material
2. **`prompts/chapters/ch17-inference-optimization/session-77-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch12-ssm-and-mamba/session-56-selective-scan-animation-widget.md`** — for the animated-state-evolution pattern (SelectiveScan is the closest precedent — it also animates state evolution token-by-token)
4. **`prompts/chapters/ch08-building-small-llm/session-37-loss-curve-widget.md`** — for the playback-controls pattern

---

## Goal

Replace the `<WidgetFrame title="KV cache lifecycle">` placeholder in section 3 with a working interactive widget that:

- Shows the **two-phase structure** of inference: prefill (all at once) then decode (one at a time)
- Uses a **concrete example**: prompt "The capital of France is" (5 tokens) → generated "Paris" (1 token) → "." (1 token)
- Visualizes the **KV cache as 16 numbered slots**, each showing position number, K and V boxes, and the token text once filled
- **Animation phases**:
  1. **Idle**: all 16 slots empty
  2. **Prefill (one moment)**: 5 prompt tokens fill simultaneously → 5 amber slots
  3. **Decode step 1**: 6th slot fills with "Paris" → 1 cyan slot
  4. **Decode step 2**: 7th slot fills with "." → another cyan slot
  5. **Done**: 7 slots filled; remaining 9 empty
- **Controls**: ▶ Play / ⏸ Pause / ↻ Reset buttons + speed slider
- **Live status text**: describes the current phase
- **Stats panel**: tokens processed, cache size, current phase

**End state:** section 3 of Chapter 17 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) prefill processes all prompt tokens at once; (b) decode generates one token at a time, each filling exactly one cache slot; (c) the cache grows monotonically over time; (d) each cache slot stores K and V for one position at one layer; (e) without the cache, each decode step would have to recompute K and V for all previous tokens.

---

## Inputs

State of the repo after session 77:

- `src/pages/ch17-inference-optimization/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 6)
- `src/lib/chapters.ts` has Ch 17 as `'draft'`
- No `src/components/widgets/ch17/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch17/KVCacheAnimation.tsx` — the React widget
2. **Create** `src/components/widgets/ch17/KVCacheAnimation.module.css` — scoped styles
3. **Create** `src/components/widgets/ch17/kv-cache-data.ts` — example data and state machine
4. **Update** `src/components/widgets/index.ts` — add `KVCacheAnimation` export
5. **Update** `src/pages/ch17-inference-optimization/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<KVCacheAnimation client:visible />`

---

## Detailed spec

### 1. `kv-cache-data.ts` — example and state machine

```ts
// src/components/widgets/ch17/kv-cache-data.ts

export const EXAMPLE = {
  promptTokens: ['The', 'capital', 'of', 'France', 'is'],
  decodeTokens: ['Paris', '.'],
};

export const MAX_SLOTS = 16;

/** Animation phases. */
export type Phase = 'idle' | 'prefill' | 'decode' | 'done';

/** State of a single cache slot. */
export interface SlotState {
  position: number;          // 1-indexed
  filled: boolean;
  token: string | null;
  phase: 'prefill' | 'decode' | null;   // which phase filled this slot
}

/** Full widget state. */
export interface AnimationState {
  phase: Phase;
  step: number;        // step within current phase
  slots: SlotState[];
  decodeIndex: number; // index into decodeTokens that's next
  statusText: string;
}

export function initialState(): AnimationState {
  const slots: SlotState[] = Array.from({ length: MAX_SLOTS }, (_, i) => ({
    position: i + 1,
    filled: false,
    token: null,
    phase: null,
  }));
  return {
    phase: 'idle',
    step: 0,
    slots,
    decodeIndex: 0,
    statusText: 'Ready to start. Press Play to begin.',
  };
}

/** Advance state by one animation step. */
export function nextState(s: AnimationState): AnimationState {
  switch (s.phase) {
    case 'idle': {
      // Move to prefill — fill all prompt tokens at once
      const newSlots = s.slots.map((slot, i) => {
        if (i < EXAMPLE.promptTokens.length) {
          return { ...slot, filled: true, token: EXAMPLE.promptTokens[i]!, phase: 'prefill' as const };
        }
        return slot;
      });
      return {
        ...s,
        phase: 'prefill',
        slots: newSlots,
        statusText: `Prefill complete: ${EXAMPLE.promptTokens.length} prompt tokens entered the cache simultaneously.`,
      };
    }
    case 'prefill': {
      // Move to decode (or done if no decode tokens)
      if (EXAMPLE.decodeTokens.length === 0) {
        return { ...s, phase: 'done', statusText: 'Done.' };
      }
      // Add the first decode token
      const slotIdx = EXAMPLE.promptTokens.length;
      const newSlots = s.slots.map((slot, i) => {
        if (i === slotIdx) {
          return { ...slot, filled: true, token: EXAMPLE.decodeTokens[0]!, phase: 'decode' as const };
        }
        return slot;
      });
      return {
        ...s,
        phase: 'decode',
        decodeIndex: 1,
        slots: newSlots,
        statusText: `Decode step 1: generated "${EXAMPLE.decodeTokens[0]}". One new cache slot filled.`,
      };
    }
    case 'decode': {
      // Continue decoding or finish
      if (s.decodeIndex >= EXAMPLE.decodeTokens.length) {
        return {
          ...s,
          phase: 'done',
          statusText: 'Decoding complete. The cache holds K, V for every generated token.',
        };
      }
      const slotIdx = EXAMPLE.promptTokens.length + s.decodeIndex;
      const newSlots = s.slots.map((slot, i) => {
        if (i === slotIdx) {
          return {
            ...slot,
            filled: true,
            token: EXAMPLE.decodeTokens[s.decodeIndex]!,
            phase: 'decode' as const,
          };
        }
        return slot;
      });
      const newIndex = s.decodeIndex + 1;
      const stepDesc = newIndex >= EXAMPLE.decodeTokens.length
        ? `Decoding complete. The cache holds K, V for every generated token.`
        : `Decode step ${newIndex}: generated "${EXAMPLE.decodeTokens[s.decodeIndex]}". One new cache slot filled.`;
      return {
        ...s,
        decodeIndex: newIndex,
        slots: newSlots,
        statusText: stepDesc,
        phase: newIndex >= EXAMPLE.decodeTokens.length ? 'done' : 'decode',
      };
    }
    case 'done':
      return s;
  }
}

/** Total tokens currently in cache. */
export function filledCount(state: AnimationState): number {
  return state.slots.filter(s => s.filled).length;
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 660

┌────────────────────────────────────────────────────────────────┐
│ KV cache lifecycle                                                │
│                                                                  │
│ Prompt: "The capital of France is" → Generated: "Paris."         │
│                                                                  │
│ Controls:                                                         │
│  [▶ Play]  [⏸ Pause]  [↻ Reset]    Speed: [────●─────]           │
│                                                                  │
│ KV cache (one layer shown for clarity):                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  position  K     V    token                                  │ │
│ │     1     [▓▓] [▓▓]   "The"        ← prefill                │ │
│ │     2     [▓▓] [▓▓]   "capital"    ← prefill                │ │
│ │     3     [▓▓] [▓▓]   "of"         ← prefill                │ │
│ │     4     [▓▓] [▓▓]   "France"     ← prefill                │ │
│ │     5     [▓▓] [▓▓]   "is"         ← prefill                │ │
│ │     6     [▒▒] [▒▒]   "Paris"      ← decode                 │ │
│ │     7     [▒▒] [▒▒]   "."          ← decode                 │ │
│ │     8     [──] [──]   ---          ← empty                  │ │
│ │     ...                                                       │ │
│ │     16    [──] [──]   ---          ← empty                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Status:                                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Decoding complete. The cache holds K, V for every            │ │
│ │ generated token.                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Stats:                                                            │
│  • Tokens in cache: 7 of 16 max                                  │
│  • Prefill tokens: 5 (filled simultaneously)                     │
│  • Decode tokens: 2 (filled one at a time)                       │
│  • Current phase: done                                            │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click ▶ Play → animation auto-advances through phases at the chosen speed
- Click ⏸ Pause → animation pauses
- Click ↻ Reset → state resets to idle (all slots empty)
- Move speed slider → adjusts animation speed (slower for inspection; faster for quick replays)
- During animation, slots transition smoothly: empty → partial fill → full
- Color: prefill slots = amber; decode slots = cyan; empty slots = neutral gray
- "← prefill" / "← decode" labels appear on each filled slot

**Animation timing:**
- Default speed: ~1.5 seconds per phase step
- Idle → Prefill: 1 step (all 5 slots fill at once with a brief "flash")
- Prefill → Decode 1: 1 step (1 slot fills)
- Decode 1 → Decode 2: 1 step (1 slot fills)
- Decode 2 → Done: terminal
- Speed slider range: 0.5× to 3×

### 3. `KVCacheAnimation.tsx`

```tsx
import { useState, useEffect, useRef } from 'react';
import {
  EXAMPLE, MAX_SLOTS, initialState, nextState, filledCount,
  type AnimationState, type SlotState,
} from './kv-cache-data';
import styles from './KVCacheAnimation.module.css';

const BASE_STEP_MS = 1500;

export default function KVCacheAnimation() {
  const [state, setState] = useState<AnimationState>(initialState());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation loop
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
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>KV cache lifecycle</div>
        <div className={styles.titleSubLabel}>
          Prompt: <strong>"{EXAMPLE.promptTokens.join(' ')}"</strong> →
          Generated: <strong>"{EXAMPLE.decodeTokens.join(' ')}"</strong>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlButtons}>
          <button
            className={styles.button}
            onClick={handlePlay}
            disabled={playing && state.phase !== 'done'}
          >▶ Play</button>
          <button
            className={styles.button}
            onClick={handlePause}
            disabled={!playing}
          >⏸ Pause</button>
          <button
            className={styles.button}
            onClick={handleReset}
          >↻ Reset</button>
        </div>
        <div className={styles.speedControl}>
          <span className={styles.speedLabel}>Speed: {speed.toFixed(1)}×</span>
          <input
            type="range"
            min={0.5} max={3.0} step={0.1}
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className={styles.speedSlider}
            aria-label="speed"
          />
        </div>
      </div>

      {/* Cache visualization */}
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

      {/* Status */}
      <div className={styles.statusPanel}>
        <div className={styles.statusLabel}>Status</div>
        <div className={styles.statusText}>{state.statusText}</div>
      </div>

      {/* Stats */}
      <div className={styles.statsPanel}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Tokens in cache:</span>
          <span className={styles.statValue}>{filled} of {MAX_SLOTS} max</span>
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

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        The KV cache stores K and V vectors for every position. <strong>Prefill</strong> processes all prompt
        tokens at once — 5 slots fill simultaneously. <strong>Decode</strong> generates tokens one at a time —
        each new token fills exactly one slot. Without the cache, every decode step would recompute K, V for
        all previous tokens; the speedup is ~700× for a 1024-token sequence.
      </div>
    </div>
  );
}

function SlotRow({ slot }: { slot: SlotState }) {
  const phaseClass = slot.phase === 'prefill'
    ? styles.slotPrefill
    : slot.phase === 'decode'
    ? styles.slotDecode
    : styles.slotEmpty;

  return (
    <div className={`${styles.slotRow} ${phaseClass}`}>
      <span className={styles.slotPosition}>{slot.position}</span>
      <span className={`${styles.slotBox} ${slot.filled ? styles.slotBoxFilled : ''}`}>
        {slot.filled ? 'K' : '—'}
      </span>
      <span className={`${styles.slotBox} ${slot.filled ? styles.slotBoxFilled : ''}`}>
        {slot.filled ? 'V' : '—'}
      </span>
      <span className={styles.slotToken}>
        {slot.filled ? `"${slot.token}"` : '—'}
      </span>
      <span className={styles.slotPhase}>
        {slot.phase === 'prefill' && '← prefill'}
        {slot.phase === 'decode' && '← decode'}
        {slot.phase === null && ''}
      </span>
    </div>
  );
}
```

### 4. `KVCacheAnimation.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel {
  padding: 0.7rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.titleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  color: var(--text-primary);
  font-weight: 500;
}
.titleSubLabel {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}
.titleSubLabel strong { color: var(--cyan-300); }

/* Controls */
.controlsPanel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}
.controlButtons { display: flex; gap: 0.4rem; }
.button {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.button:hover:not(:disabled) {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
}
.button:disabled { opacity: 0.4; cursor: not-allowed; }

.speedControl {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 180px;
}
.speedLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  color: var(--text-secondary);
  min-width: 80px;
}
.speedSlider { flex: 1; }

/* Cache */
.cachePanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.cacheTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.55rem;
  font-weight: 500;
}
.cacheHeader {
  display: grid;
  grid-template-columns: 60px 32px 32px 1fr 80px;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle);
}
.cacheSlots { display: flex; flex-direction: column; gap: 0; }

.slotRow {
  display: grid;
  grid-template-columns: 60px 32px 32px 1fr 80px;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  border-bottom: 1px solid var(--border-subtle);
  transition: background 300ms;
}
.slotRow:last-child { border-bottom: none; }
.slotEmpty { color: var(--text-tertiary); }
.slotPrefill { background: color-mix(in srgb, var(--amber-400) 6%, transparent); }
.slotPrefill .slotBoxFilled { background: var(--amber-400); }
.slotDecode { background: color-mix(in srgb, var(--cyan-500) 8%, transparent); }
.slotDecode .slotBoxFilled { background: var(--cyan-500); }

.slotPosition {
  text-align: right;
  color: var(--text-secondary);
  font-size: 0.74rem;
}
.slotBox {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  width: 24px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-tertiary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  transition: all 300ms;
}
.slotBoxFilled {
  color: var(--bg-primary);
  border-color: transparent;
}
.slotToken {
  color: var(--text-primary);
  font-style: italic;
}
.slotEmpty .slotToken { color: var(--text-tertiary); }
.slotPhase {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}
.slotPrefill .slotPhase { color: var(--amber-400); }
.slotDecode .slotPhase { color: var(--cyan-300); }

/* Status */
.statusPanel {
  padding: 0.85rem 1rem;
  background: color-mix(in srgb, var(--cyan-500) 4%, var(--bg-elevated));
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.statusLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--cyan-300);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.statusText {
  font-size: 0.86rem;
  color: var(--text-primary);
  line-height: 1.5;
}

/* Stats */
.statsPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.statRow {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
}
.statLabel { color: var(--text-secondary); }
.statValue { color: var(--text-primary); font-weight: 500; }
.statPrefill { color: var(--amber-400); }
.statDecode { color: var(--cyan-300); }

.phaseTag_idle    { color: var(--text-tertiary); }
.phaseTag_prefill { color: var(--amber-400); }
.phaseTag_decode  { color: var(--cyan-300); }
.phaseTag_done    { color: var(--emerald-400); }

/* Caption */
.caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .cacheHeader, .slotRow { grid-template-columns: 40px 28px 28px 1fr 70px; gap: 0.3rem; font-size: 0.7rem; }
  .slotBox { height: 18px; width: 20px; font-size: 0.62rem; }
  .controlsPanel { flex-direction: column; align-items: stretch; }
  .speedControl { width: 100%; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as KVCacheAnimation } from './ch17/KVCacheAnimation';
// Session 79 will add:
// export { default as SpeculativeDecoding } from './ch17/SpeculativeDecoding';
```

### 6. Update `src/pages/ch17-inference-optimization/index.mdx`

**Edit A: Add widget import:**

```mdx
import { KVCacheAnimation } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="KV cache lifecycle" caption="Animated visualization of the cache filling during prefill (all prompt tokens at once) and decode (one new token per step). Concrete example: prompt 'The capital of France is' → generated 'Paris.' Prefill fills 5 slots simultaneously (amber); decode fills 2 more slots one at a time (cyan). Play/pause/reset controls; speed slider. The widget makes the central inference optimization visceral.">
  <KVCacheAnimation client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 17** renders with the working widget. Section 6's placeholder still stubbed.
3. **Default state:** all 16 slots empty; status text "Ready to start. Press Play to begin."; phase: IDLE (gray).
4. **Title panel** shows prompt + generated text with bold cyan highlights.
5. **Control panel** has 3 buttons (▶ Play, ⏸ Pause, ↻ Reset) and a speed slider (0.5× to 3×).
6. **Click Play (first time)**: animation advances. Phase 1: all 5 prefill slots fill simultaneously (amber). Phase 2: slot 6 fills with "Paris" (cyan). Phase 3: slot 7 fills with "." (cyan). Phase 4: done.
7. **Color coding**:
   - **Prefill slots** (1-5): amber background tint; "K" and "V" boxes amber
   - **Decode slots** (6-7): cyan background tint; "K" and "V" boxes cyan
   - **Empty slots** (8-16): gray text; dashes for K, V, token
8. **Phase labels** appear on each filled slot:
   - Slots 1-5: "← prefill" in amber text
   - Slots 6-7: "← decode" in cyan text
9. **Status text updates** at each animation step:
   - Idle: "Ready to start. Press Play to begin."
   - After prefill: "Prefill complete: 5 prompt tokens entered the cache simultaneously."
   - After decode 1: "Decode step 1: generated 'Paris'. One new cache slot filled."
   - After decode 2: "Decode step 2: generated '.'..." then "Decoding complete..."
10. **Stats panel** shows live updates:
    - Tokens in cache: 0 → 5 → 6 → 7
    - Prefill tokens: 0 → 5 (stays at 5)
    - Decode tokens: 0 → 1 → 2
    - Current phase: IDLE → PREFILL → DECODE → DONE
11. **Speed slider** changes animation speed (0.5× is slow; 3× is fast).
12. **Reset button** brings state back to all-empty / idle.
13. **Pause button** halts the animation; Play resumes from where paused.
14. **Auto-stop**: when state reaches "done", animation stops; Play button becomes available again to restart.
15. **Smooth transitions** between slot states (300ms color/background transitions).
16. **Mobile** (< 720px): controls stack vertically; cache rows compact.
17. **`npm run typecheck`** passes.
18. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not show multiple layers**. One layer's KV cache is sufficient — multiple layers would clutter the visualization.
- ❌ **Do not animate attention computation**. The widget shows cache state, not the attention math.
- ❌ **Do not implement an actual model**. The example is pre-scripted (prompt + generated tokens).
- ❌ **Do not allow user-provided prompts**. Fixed example only.
- ❌ **Do not show speculative decoding**. That's session 79's widget.
- ❌ **Do not show memory size estimates inline**. The boxed equation in the prose handles that.
- ❌ **Do not flip Ch 17's status.** Session 79 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch17/ src/components/widgets/index.ts src/pages/ch17-inference-optimization/index.mdx
git commit -m "session 78: KV cache animation marquee — visualize prefill + decode phases"
git push origin main
```

Verify on production:
- All controls work (Play/Pause/Reset)
- Animation flows through 4 phases (idle → prefill → decode → done)
- Color coding distinguishes prefill (amber) from decode (cyan)
- Speed slider responsive
- Status text and stats update live

---

## Notes for the session author

**On the visualization choice — single layer's KV cache:**
A real KV cache has shape `(layers, 2, batch, heads, seq, head_dim)`. Visualizing all of that would be overwhelming. **One layer's cache** is enough to convey the structure. The reader extrapolates: this same pattern exists per layer per head.

The "K" and "V" boxes are abstractions — they represent "the key vector for this position" and "the value vector for this position." Not actual numerical values; just symbolic representations.

**On the two-phase animation being the pedagogical centerpiece:**
The animation has only **two key visual events**:
1. **5 slots fill at once** (prefill)
2. **1 slot fills at a time** (decode, twice)

This is the chapter's central insight made visible. The reader literally sees prefill happen "all at once" and decode happen "one at a time." **This is what the visualization is for.**

**On color coding being phase-aware:**
- **Amber for prefill**: warm, "the lump-sum entry"
- **Cyan for decode**: the project's signature color, "the goal"
- **Gray for empty**: background; not pedagogically critical

The colors carry semantic information. Reader sees which slots came from which phase even after the animation finishes.

**On the playback controls being standard:**
▶ Play / ⏸ Pause / ↻ Reset + speed slider. Familiar pattern from video players; doesn't require explanation. Notes-for-author: keep the controls simple — readers should focus on the animation, not the UI.

**On the auto-stop at "done":**
Once the animation reaches "done", the widget doesn't loop. **Looping would obscure the discrete two-phase structure.** The reader presses Reset and Play again if they want to see it again.

**On the stats panel reinforcing the phase structure:**
- "Prefill tokens: 5 (filled simultaneously)" — explicit "simultaneously" framing
- "Decode tokens: 2 (filled one at a time)" — explicit "one at a time" framing

These descriptions teach the reader the right vocabulary while showing the visual.

**On the status text being narrated:**
Each phase transition updates the status text with a specific message. **Pedagogy via narration:** the reader sees the visual AND reads what's happening. No interpretation required.

**On the chosen example — "Paris" + ".":**
Short prompt (5 tokens) and short generation (2 tokens) keep the visualization clean. **Longer examples would dilute the impact.** 7 filled slots out of 16 total leaves visible empty space at the bottom — reinforces that the cache grows monotonically.

**Pedagogical claim this widget supports:**
"The KV cache lifecycle has two phases. Prefill processes the entire prompt at once — all prompt tokens enter the cache simultaneously, in a single forward pass. Decode generates one token at a time; each decode step adds exactly one new cache slot. The cache grows monotonically. **This two-phase structure is the foundation of all subsequent inference optimizations** — Flash Attention (which helps the prefill matmul), continuous batching (which packs requests across the GPU), speculative decoding (which amortizes the decode forward passes), and PagedAttention (which manages cache memory)."

After 30 seconds of interaction, the reader has internalized: (a) prefill fills 5 slots at once; (b) decode fills 1 slot per step; (c) the cache only grows, never shrinks during a sequence; (d) each slot stores K and V for one position; (e) the two phases have completely different characteristics (lump-sum vs incremental).

**This is the chapter's central visualization.** Section 3's math becomes intuitive after this widget.

Build with care.
