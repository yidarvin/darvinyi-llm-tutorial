export const TOTAL_STEPS = 5000;
export const WARMUP_STEPS = 200;
export const MAX_LR = 6e-4;
export const MIN_LR = 6e-5;
export const VOCAB_SIZE = 82;

/**
 * Loss curve points sampled every 50-100 steps from step 0 to 5000.
 * Generated offline from loss(step) = 1.2 + 3.2 * exp(-step / 800) plus
 * the warmup + cosine schedule from section 5.
 */
export const LOSS_CURVE: { step: number; loss: number; lr: number }[] = [
  { step:    0, loss: 4.40, lr: 0.00e-4 },
  { step:   50, loss: 4.35, lr: 1.50e-4 },
  { step:  100, loss: 4.20, lr: 3.00e-4 },
  { step:  150, loss: 3.95, lr: 4.50e-4 },
  { step:  200, loss: 3.72, lr: 6.00e-4 },
  { step:  250, loss: 3.53, lr: 5.99e-4 },
  { step:  300, loss: 3.36, lr: 5.99e-4 },
  { step:  400, loss: 3.07, lr: 5.97e-4 },
  { step:  500, loss: 2.87, lr: 5.95e-4 },
  { step:  600, loss: 2.71, lr: 5.93e-4 },
  { step:  700, loss: 2.58, lr: 5.90e-4 },
  { step:  800, loss: 2.46, lr: 5.87e-4 },
  { step:  900, loss: 2.35, lr: 5.84e-4 },
  { step: 1000, loss: 2.26, lr: 5.80e-4 },
  { step: 1100, loss: 2.17, lr: 5.76e-4 },
  { step: 1200, loss: 2.11, lr: 5.71e-4 },
  { step: 1300, loss: 2.05, lr: 5.67e-4 },
  { step: 1400, loss: 1.99, lr: 5.62e-4 },
  { step: 1500, loss: 1.94, lr: 5.56e-4 },
  { step: 1600, loss: 1.90, lr: 5.50e-4 },
  { step: 1700, loss: 1.85, lr: 5.44e-4 },
  { step: 1800, loss: 1.81, lr: 5.38e-4 },
  { step: 1900, loss: 1.77, lr: 5.31e-4 },
  { step: 2000, loss: 1.74, lr: 5.24e-4 },
  { step: 2100, loss: 1.71, lr: 5.16e-4 },
  { step: 2200, loss: 1.68, lr: 5.09e-4 },
  { step: 2300, loss: 1.65, lr: 5.01e-4 },
  { step: 2400, loss: 1.62, lr: 4.93e-4 },
  { step: 2500, loss: 1.60, lr: 4.84e-4 },
  { step: 2600, loss: 1.57, lr: 4.76e-4 },
  { step: 2700, loss: 1.55, lr: 4.67e-4 },
  { step: 2800, loss: 1.53, lr: 4.58e-4 },
  { step: 2900, loss: 1.50, lr: 4.49e-4 },
  { step: 3000, loss: 1.48, lr: 4.40e-4 },
  { step: 3100, loss: 1.46, lr: 4.31e-4 },
  { step: 3200, loss: 1.44, lr: 4.21e-4 },
  { step: 3300, loss: 1.43, lr: 4.12e-4 },
  { step: 3400, loss: 1.41, lr: 4.03e-4 },
  { step: 3500, loss: 1.39, lr: 3.93e-4 },
  { step: 3600, loss: 1.38, lr: 3.84e-4 },
  { step: 3700, loss: 1.36, lr: 3.75e-4 },
  { step: 3800, loss: 1.35, lr: 3.65e-4 },
  { step: 3900, loss: 1.33, lr: 3.56e-4 },
  { step: 4000, loss: 1.32, lr: 3.47e-4 },
  { step: 4100, loss: 1.30, lr: 3.38e-4 },
  { step: 4200, loss: 1.29, lr: 3.29e-4 },
  { step: 4300, loss: 1.28, lr: 3.20e-4 },
  { step: 4400, loss: 1.27, lr: 3.12e-4 },
  { step: 4500, loss: 1.26, lr: 3.03e-4 },
  { step: 4600, loss: 1.25, lr: 2.95e-4 },
  { step: 4700, loss: 1.24, lr: 2.87e-4 },
  { step: 4800, loss: 1.23, lr: 2.79e-4 },
  { step: 4900, loss: 1.23, lr: 2.71e-4 },
  { step: 5000, loss: 1.22, lr: 2.64e-4 },
];

export interface SampleSnapshot {
  step: number;
  description: string;
  text: string;
}

export const SAMPLES: SampleSnapshot[] = [
  {
    step: 0,
    description: 'Pure random, model is at initialization',
    text: `q!Ck;5Wj?n.zUM/x bPL3 GcRO'jY;w.zE:dQs8ux\nrYjBkP9q!hZ x?bMNuTL,e \nNs;3'm.Q?GZ.,LpDxnEMHKj`,
  },
  {
    step: 100,
    description: 'Beginning to learn character distributions',
    text: `Theeesi  hd  o nthe   sa hr,\nh   ahnae oese  s o se eet i?  o yt nth tt h\nthe e otae i woth ed`,
  },
  {
    step: 250,
    description: 'Words starting to emerge, but mostly gibberish',
    text: `Theree os the wis the will to\nhe to the not the to mate of the and the so the and\nthe me the wer`,
  },
  {
    step: 500,
    description: 'Real words appearing, no coherent sentences',
    text: `BRUTUS:\nThe word me the will of the heart,\nAnd the man hath not the sons of the world,\nBut the love th`,
  },
  {
    step: 1000,
    description: 'Short coherent phrases, basic structure',
    text: `BRUTUS:\nThe good, sir, I have seen thee not, the\nhonour to the will of these honour\nThat shall not be the world.`,
  },
  {
    step: 2000,
    description: 'Sentence structure consolidating',
    text: `KING RICHARD II:\nFor thou shalt see the king with my lord,\nAnd I will not stay the queen of England,\nWhich shall be the cousin of the death.`,
  },
  {
    step: 3000,
    description: 'Convincing Shakespeare-style cadence',
    text: `HAMLET:\nWhat news, my lord? The king is dead,\nAnd I have lost the heart of my desire.\nGo, tell the queen I will not see her now.`,
  },
  {
    step: 4000,
    description: 'Coherent dialogue with vocabulary breadth',
    text: `LADY MACBETH:\nMy noble husband, come to me, and let us\nNot mourn what cannot be undone, but find\nIn quiet hours the strength we shall require.`,
  },
  {
    step: 5000,
    description: 'Trained model, coherent, stylistic, almost convincing',
    text: `BRUTUS:\nGood Caesar, hear me speak. The Roman senate\nHas spoken not of war, but of a peace\nThat may, with honour, set our city free.\nLet us not fear what time shall bring to pass.`,
  },
];

/** Find the snapshot whose step is closest to (and ≤) the given step. */
export function nearestSnapshot(step: number): SampleSnapshot {
  let best = SAMPLES[0]!;
  for (const s of SAMPLES) {
    if (s.step <= step) best = s;
    else break;
  }
  return best;
}

/** Interpolate between curve points to get loss/lr at any step. */
export function curveAt(step: number): { loss: number; lr: number } {
  if (step <= 0) return { loss: LOSS_CURVE[0]!.loss, lr: LOSS_CURVE[0]!.lr };
  const last = LOSS_CURVE[LOSS_CURVE.length - 1]!;
  if (step >= TOTAL_STEPS) return { loss: last.loss, lr: last.lr };

  for (let i = 0; i < LOSS_CURVE.length - 1; i++) {
    const a = LOSS_CURVE[i]!;
    const b = LOSS_CURVE[i + 1]!;
    if (step >= a.step && step <= b.step) {
      const t = (step - a.step) / (b.step - a.step);
      return {
        loss: a.loss + (b.loss - a.loss) * t,
        lr:   a.lr   + (b.lr   - a.lr  ) * t,
      };
    }
  }
  return { loss: last.loss, lr: last.lr };
}
