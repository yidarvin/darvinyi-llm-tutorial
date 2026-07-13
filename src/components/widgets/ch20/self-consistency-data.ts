export interface MockTrace {
  reasoning: string;
  answer: number;
  isCorrect: boolean;
}

export interface MockProblem {
  id: string;
  question: string;
  correctAnswer: number;
  traces: MockTrace[];
}

export const PROBLEMS: MockProblem[] = [
  {
    id: 'train',
    question: 'A train travels 60 miles in 2 hours. What is its speed in miles per hour?',
    correctAnswer: 30,
    traces: [
      { reasoning: 'I think we multiply: 60 × 2 = 120 mph.', answer: 120, isCorrect: false },
      { reasoning: "I'll just say 60. The train went 60 miles.", answer: 60, isCorrect: false },
      { reasoning: 'Speed = distance / time = 60 / 2 = 30 mph.', answer: 30, isCorrect: true },
      { reasoning: '60 miles in 2 hours means 30 miles per hour.', answer: 30, isCorrect: true },
      { reasoning: 'Divide 60 by 2: 60/2 = 30. Speed is 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Half of 60 is 30, so 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'In 1 hour the train covers 30 miles. So 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Distance/time = 60/2 = 30. The answer is 30.', answer: 30, isCorrect: true },
      { reasoning: '60 miles / 2 hours = 30 mph. Final answer: 30.', answer: 30, isCorrect: true },
      { reasoning: "Speed = distance + time = 60 + 2 = 62? No, that's wrong. Speed = 60/2 = 30.", answer: 30, isCorrect: true },
      { reasoning: 'rate × time = distance, so rate = 60/2 = 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Speed = 60 ÷ 2 hours = 30 miles per hour.', answer: 30, isCorrect: true },
      { reasoning: "Maybe it's 60 - 2 = 58? Hmm, that doesn't make sense. Use 60/2 = 30.", answer: 30, isCorrect: true },
      { reasoning: 'Hmm, 60 miles, 2 hours, so 60/2... let me think... 30 mph.', answer: 30, isCorrect: true },
      { reasoning: '2 hours for 60 miles. 60÷2 = 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'speed = 60/2 = 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Each hour covers 30 miles. So 30 mph.', answer: 30, isCorrect: true },
      { reasoning: 'Wait, is it 30 or 40? Let me redo. 60/2 = 30. OK, 30 mph.', answer: 30, isCorrect: true },
      { reasoning: "120 mph since 60 + 60 = 120 in 2 hours? No wait, that's distance. Speed is 30.", answer: 30, isCorrect: true },
      { reasoning: "I think it's 25 mph.", answer: 25, isCorrect: false },
    ],
  },
  {
    id: 'apples',
    question: 'The cafeteria had 23 apples. They used 20 for lunch and then bought 6 more. How many do they have now?',
    correctAnswer: 9,
    traces: [
      { reasoning: '23 - 20 = 3, then 3 + 6 = 9. The answer is 9.', answer: 9, isCorrect: true },
      { reasoning: 'Start: 23. Used 20: 23-20=3 left. Bought 6: 3+6=9.', answer: 9, isCorrect: true },
      { reasoning: '23 apples minus 20 = 3. Plus 6 = 9 apples.', answer: 9, isCorrect: true },
      { reasoning: '23 - 20 + 6 = 9.', answer: 9, isCorrect: true },
      { reasoning: 'Subtract 20 from 23: 3. Add 6: 9. Answer: 9.', answer: 9, isCorrect: true },
      { reasoning: "23 + 6 - 20 = 9 (rearranging doesn't change the result).", answer: 9, isCorrect: true },
      { reasoning: '23-20=3. 3+6=9. Final: 9.', answer: 9, isCorrect: true },
      { reasoning: '23 - 20 = 3. Wait, then minus 6? No, plus 6. So 9.', answer: 9, isCorrect: true },
      { reasoning: 'They had 23, gave 20 away, got 6. 23-20+6 = 9.', answer: 9, isCorrect: true },
      { reasoning: 'I forget the steps. Let me try: 23 + 20 - 6 = 37? Hmm, no. Actually 23-20+6=9.', answer: 9, isCorrect: true },
      { reasoning: 'started 23, used 20: 3. bought 6: 9.', answer: 9, isCorrect: true },
      { reasoning: 'They have 29 apples after all the transactions.', answer: 29, isCorrect: false },
      { reasoning: '23 - 20 = 3. 3 + 6 = 9.', answer: 9, isCorrect: true },
      { reasoning: 'After lunch: 23-20=3. After buying: 9. Answer: 9.', answer: 9, isCorrect: true },
      { reasoning: 'They have 9 left.', answer: 9, isCorrect: true },
      { reasoning: 'Total apples: 23+6=29, minus the 20 used = 9. Answer: 9.', answer: 9, isCorrect: true },
      { reasoning: "Hmm, I subtract 26 from 23? That's negative. Let me redo. 23-20=3, +6=9.", answer: 9, isCorrect: true },
      { reasoning: '23 plus 6 is 29. Then minus 20 is 9.', answer: 9, isCorrect: true },
      { reasoning: "I'll say 3 (the leftover after lunch).", answer: 3, isCorrect: false },
      { reasoning: '23 minus 20 plus 6 equals 9.', answer: 9, isCorrect: true },
    ],
  },
  {
    id: 'bookshelf',
    question: 'A bookshelf has 5 shelves with 12 books each. If 8 books are removed, how many books remain?',
    correctAnswer: 52,
    traces: [
      { reasoning: '5 × 12 = 60. 60 - 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'Total: 5*12=60 books. Remove 8: 60-8=52.', answer: 52, isCorrect: true },
      { reasoning: '5 shelves × 12 books = 60 total. Minus 8 removed = 52.', answer: 52, isCorrect: true },
      { reasoning: '60 - 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'Five times twelve is sixty. Subtract eight: fifty-two.', answer: 52, isCorrect: true },
      { reasoning: '5×12 = 60. After removal: 60-8 = 52 books.', answer: 52, isCorrect: true },
      { reasoning: '12 books per shelf, 5 shelves. 12*5 = 60. 60 - 8 = 52. Answer: 52.', answer: 52, isCorrect: true },
      { reasoning: 'If we remove 8, we have 12 books on 4 shelves plus 4 books on one shelf? Let me redo. Total was 60, now 52.', answer: 52, isCorrect: true },
      { reasoning: 'Total 60, minus 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'I might forget: 5*12 = 60. 60 - 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'Removing 8: starting from 60 → 52.', answer: 52, isCorrect: true },
      { reasoning: "I think 5+12-8 = 9 books. Wait that doesn't make sense. Let me redo. 5*12=60, 60-8=52.", answer: 52, isCorrect: true },
      { reasoning: '60 books minus 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: 'Hmm, 5*12 = 60. Then subtract 8 = 52.', answer: 52, isCorrect: true },
      { reasoning: '5 × 12 = 60. 60 - 8 = 52 books.', answer: 52, isCorrect: true },
      { reasoning: 'There are 5*12-8 = 60-8 = 52 books.', answer: 52, isCorrect: true },
      { reasoning: "I'll guess 48.", answer: 48, isCorrect: false },
      { reasoning: 'Five times twelve is fifty, then minus eight is forty-two. Hmm wait, 5×12=60, not 50. So 60-8=52.', answer: 52, isCorrect: true },
      { reasoning: '5*12 = 60, total. Remove 8 = 52 remain.', answer: 52, isCorrect: true },
      { reasoning: 'Without thinking carefully: 12 - 8 = 4 books per shelf × 5 = 20.', answer: 20, isCorrect: false },
    ],
  },
];

export interface AggregateResult {
  counts: Map<number, number>;
  sortedAnswers: { answer: number; count: number }[];
  majorityAnswer: number;
  majorityCount: number;
  confidence: number;
}

export function aggregate(traces: MockTrace[], n: number): AggregateResult {
  const sampled = traces.slice(0, n);
  const counts = new Map<number, number>();
  for (const t of sampled) {
    counts.set(t.answer, (counts.get(t.answer) ?? 0) + 1);
  }
  const sortedAnswers = Array.from(counts.entries())
    .map(([answer, count]) => ({ answer, count }))
    .sort((a, b) => b.count - a.count);
  const top = sortedAnswers[0]!;
  return {
    counts,
    sortedAnswers,
    majorityAnswer: top.answer,
    majorityCount: top.count,
    confidence: top.count / n,
  };
}

export function singleTraceAccuracy(problem: MockProblem): number {
  return problem.traces.filter((t) => t.isCorrect).length / problem.traces.length;
}

export function insightFor(n: number, isCorrect: boolean, confidence: number): string {
  if (n === 1) {
    return isCorrect
      ? 'Single trace happened to be right — but with only N=1, we have no way to know if we got lucky.'
      : 'Single trace is wrong. With N=1, there is no error correction.';
  }
  if (n <= 3) {
    return isCorrect
      ? 'Small N — majority vote works but confidence is low. Need more traces for reliability.'
      : 'Wrong traces are still outvoting correct ones. Increase N to let the majority emerge.';
  }
  if (n <= 8) {
    return isCorrect
      ? `Mid-range N gives a stable majority. Confidence ${(confidence * 100).toFixed(0)}% — getting reliable.`
      : 'Even at mid-range N, wrong answers can still cluster. Rare, but possible.';
  }
  return isCorrect
    ? `Large N stabilizes the result. Confidence ${(confidence * 100).toFixed(0)}%. Diminishing returns past here — extra traces add little.`
    : 'Even with large N, majority vote can fail if the model has systematic biases.';
}
