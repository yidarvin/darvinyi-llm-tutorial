export interface StepTiming {
  computeTime: number;
  commTime: number;
}

export interface StepMetrics {
  totalTime: number;
  computeTime: number;
  commTime: number;
  mfu: number;
}

export function sequentialMetrics(t: StepTiming): StepMetrics {
  const total = t.computeTime + t.commTime;
  return {
    totalTime: total,
    computeTime: t.computeTime,
    commTime: t.commTime,
    mfu: t.computeTime / total,
  };
}

export function overlappedMetrics(t: StepTiming): StepMetrics {
  const total = Math.max(t.computeTime, t.commTime);
  return {
    totalTime: total,
    computeTime: t.computeTime,
    commTime: t.commTime,
    mfu: t.computeTime / total,
  };
}

export function speedupFromOverlap(t: StepTiming): number {
  const seq = sequentialMetrics(t).totalTime;
  const ovr = overlappedMetrics(t).totalTime;
  return seq / ovr;
}
