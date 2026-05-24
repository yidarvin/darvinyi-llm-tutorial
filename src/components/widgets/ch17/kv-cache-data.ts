export const EXAMPLE = {
  promptTokens: ['The', 'capital', 'of', 'France', 'is'],
  decodeTokens: ['Paris', '.'],
};

export const MAX_SLOTS = 16;

export type Phase = 'idle' | 'prefill' | 'decode' | 'done';

export interface SlotState {
  position: number;
  filled: boolean;
  token: string | null;
  phase: 'prefill' | 'decode' | null;
}

export interface AnimationState {
  phase: Phase;
  step: number;
  slots: SlotState[];
  decodeIndex: number;
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

export function nextState(s: AnimationState): AnimationState {
  switch (s.phase) {
    case 'idle': {
      const newSlots = s.slots.map((slot, i) => {
        if (i < EXAMPLE.promptTokens.length) {
          return {
            ...slot,
            filled: true,
            token: EXAMPLE.promptTokens[i]!,
            phase: 'prefill' as const,
          };
        }
        return slot;
      });
      return {
        ...s,
        phase: 'prefill',
        step: s.step + 1,
        slots: newSlots,
        statusText: `Prefill complete: ${EXAMPLE.promptTokens.length} prompt tokens entered the cache simultaneously.`,
      };
    }
    case 'prefill': {
      if (EXAMPLE.decodeTokens.length === 0) {
        return {
          ...s,
          phase: 'done',
          statusText: 'Decoding complete. The cache holds K, V for every generated token.',
        };
      }
      const slotIdx = EXAMPLE.promptTokens.length;
      const tok = EXAMPLE.decodeTokens[0]!;
      const newSlots = s.slots.map((slot, i) => {
        if (i === slotIdx) {
          return { ...slot, filled: true, token: tok, phase: 'decode' as const };
        }
        return slot;
      });
      return {
        ...s,
        phase: 'decode',
        step: s.step + 1,
        decodeIndex: 1,
        slots: newSlots,
        statusText: `Decode step 1: generated "${tok}". One new cache slot filled.`,
      };
    }
    case 'decode': {
      if (s.decodeIndex >= EXAMPLE.decodeTokens.length) {
        return {
          ...s,
          phase: 'done',
          step: s.step + 1,
          statusText: 'Decoding complete. The cache holds K, V for every generated token.',
        };
      }
      const slotIdx = EXAMPLE.promptTokens.length + s.decodeIndex;
      const tok = EXAMPLE.decodeTokens[s.decodeIndex]!;
      const newSlots = s.slots.map((slot, i) => {
        if (i === slotIdx) {
          return { ...slot, filled: true, token: tok, phase: 'decode' as const };
        }
        return slot;
      });
      const newIndex = s.decodeIndex + 1;
      return {
        ...s,
        phase: 'decode',
        step: s.step + 1,
        decodeIndex: newIndex,
        slots: newSlots,
        statusText: `Decode step ${newIndex}: generated "${tok}". One new cache slot filled.`,
      };
    }
    case 'done':
      return s;
  }
}

export function filledCount(state: AnimationState): number {
  return state.slots.filter(s => s.filled).length;
}
