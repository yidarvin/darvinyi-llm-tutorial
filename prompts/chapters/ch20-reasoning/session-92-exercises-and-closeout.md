# Session 92 — Ch 20 exercises + closeout

> **The Chapter 20 closeout.** Two deliverables: (1) add an **Exercises section** with 4 problems covering both eras (zero-shot CoT extraction, self-consistency aggregation, best-of-N + PRM, **test-time compute scaling math** that reproduces the marquee widget's curves analytically); (2) flip Ch 20's status from `'draft'` to `'published'`. **Closes Ch 20** — the first chapter of Phase 13 (Capabilities). Both Ch 20 widgets already exist from sessions 90 and 91. **Five-file cadence** (slot 118 absorbed; this file does the work that would otherwise be split).

---

## Read first (in this order)

1. **`research/ch20-reasoning/research.md`** — all concepts; the source material for exercises
2. **`prompts/chapters/ch20-reasoning/session-89-page-structure.md`** — for the exercise placement (between section 7 and section 8)
3. **`prompts/chapters/ch20-reasoning/session-90-test-time-compute-curves-widget.md`** — the marquee widget; Ex 4 reproduces its curves analytically
4. **`prompts/chapters/ch20-reasoning/session-91-self-consistency-aggregator-widget.md`** — the secondary widget; Ex 2 mirrors its logic
5. **`prompts/chapters/ch19-sampling/session-88-constrained-decoding-and-exercises-and-closeout.md`** — for the recent closeout pattern

---

## Goal

By end of session, two things change in the repo:

1. **An "Exercises" section** is inserted into `src/pages/ch20-reasoning/index.mdx`. Per the section structure, this goes between section 7 ("Modern reasoning models — o1, R1, Gemini Thinking") and section 8 ("The full picture"). Four exercises with hints + runnable starter code.
2. **Ch 20's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. **Ch 20 is the twentieth published chapter — and the first of Phase 13.**

After this session: **Ch 20 is complete. Phase 13 has its first published chapter.** Phase 13 trajectory: Ch 21 (Tool use), Ch 22 (RAG), Ch 23 (Multimodal).

---

## Inputs

State of the repo after session 91:

- Both widgets (Section 3's `SelfConsistencyAggregator` and section 6's `TestTimeComputeCurves`) are wired
- All 3 runnable code blocks from session 89 are in place
- `src/lib/chapters.ts` has Ch 1-19 `'published'`, Ch 20 `'draft'`
- `src/components/widgets/ch20/` exists with both widgets

---

## Deliverables

1. **Update** `src/pages/ch20-reasoning/index.mdx`:
   - Insert new `## Exercises` section between section 7 ("Modern reasoning models — o1, R1, Gemini Thinking") and section 8 ("The full picture")
2. **Update** `src/lib/chapters.ts` — change Ch 20's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters are sealed. Ch 20's prose sections 1-8 are sealed. Ch 20's widgets are sealed.

---

## Detailed spec

### Part A — Exercises section

Insert between section 7 ("Modern reasoning models — o1, R1, Gemini Thinking") and section 8 ("The full picture"). Use this structure:

````mdx
## Exercises

Four exercises that lock in the chapter's two eras. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

The exercises span the chapter's arc: from prompting-era techniques (Ex 1, Ex 2), to verifier-augmented inference (Ex 3), to the test-time compute scaling math that justifies modern reasoning models (Ex 4).

### Exercise 1 (easy) — Zero-shot CoT and answer extraction

Implement a function that takes a question, applies zero-shot CoT, and extracts a numeric answer from the trace. Test on a few different problem statements; verify that the extractor handles varied trace formats.

<details>
<summary>Hint</summary>

Zero-shot CoT recipe (Kojima 2022):
1. Append "Let's think step by step." to the question.
2. Send to the model. Get a reasoning trace.
3. Extract the final numeric answer.

For step 3, use a regex like `r"answer is (\d+(?:\.\d+)?)"` or look for the last number in the trace. Production systems often use the model itself to extract, but regex works for simple cases.

For the demo: use a mock `call_model` function that returns realistic traces.

</details>

<RunnableCode
  client:visible
  defaultCode={`import re

def zero_shot_cot_prompt(question):
    """Return the prompt with the zero-shot CoT trigger."""
    # TODO: append "Let's think step by step." to the question
    pass

def extract_numeric_answer(trace):
    """Extract a number from the trace. Try common patterns first."""
    # TODO:
    # Pattern 1: "the answer is X"
    # Pattern 2: "answer: X"  
    # Pattern 3: last number in the trace (fallback)
    # Return None if no number found
    pass

def call_model(prompt):
    """Mock model — returns canned responses for the demo."""
    # Pretend the model produces good CoT for some questions
    if "60 miles" in prompt and "step by step" in prompt:
        return "Speed = distance / time = 60 / 2 = 30. The answer is 30."
    if "23 apples" in prompt and "step by step" in prompt:
        return "Started with 23. Used 20: 23-20=3. Bought 6: 3+6=9. Answer: 9."
    if "12 books" in prompt and "step by step" in prompt:
        return "5 shelves × 12 = 60 total. Remove 8: 60-8 = 52 books remain."
    # Without CoT trigger: model often gives wrong direct answer
    return "120"  

# Test
questions = [
    "A train travels 60 miles in 2 hours. What is its speed?",
    "The cafeteria had 23 apples. They used 20 and bought 6 more. How many remain?",
    "A bookshelf has 5 shelves with 12 books each. If 8 are removed, how many remain?",
]

# Compare direct vs zero-shot CoT
# print(f"{'Question (truncated)':<50} | {'Direct':>10} | {'Zero-shot CoT':>14}")
# print("-" * 80)
# for q in questions:
#     direct = call_model(q)
#     direct_ans = extract_numeric_answer(direct)
#     cot = call_model(zero_shot_cot_prompt(q))
#     cot_ans = extract_numeric_answer(cot)
#     print(f"{q[:48]:<50} | {direct_ans!s:>10} | {cot_ans!s:>14}")

# Observation:
# - Direct: model often gives wrong answer with no reasoning
# - Zero-shot CoT: reasoning trace + correct answer
# - The extractor handles multiple phrasings ("answer is", "Answer:", trailing number)
`}
  packages={[]}
/>

### Exercise 2 (medium) — Self-consistency aggregation

Implement self-consistency: given N traces (with varied final answers), return the majority answer and confidence. Verify the wisdom-of-crowds effect on a noisy trace pool.

<details>
<summary>Hint</summary>

Self-consistency (Wang 2022):
1. Extract the answer from each of N traces (Exercise 1's extractor works).
2. Count occurrences of each answer.
3. Return the most common answer and its confidence (fraction of total).

For the demo: generate a mock trace pool where the *correct* answer appears in ~75% of traces and various wrong answers in the remaining ~25%. Show that at small N, majority vote can fail; at larger N, it stabilizes.

Sample size affects reliability: at N=1, you get one trace's answer (75% correct); at N=10, majority vote almost always recovers the truth.

</details>

<RunnableCode
  client:visible
  defaultCode={`from collections import Counter
import re

def extract_numeric_answer(trace):
    """Same as Exercise 1's extractor — copy your solution or use the version below."""
    m = re.search(r"answer is (\\d+)", trace.lower())
    if m: return int(m.group(1))
    m = re.search(r"answer:\\s*(\\d+)", trace.lower())
    if m: return int(m.group(1))
    nums = re.findall(r"\\d+", trace)
    return int(nums[-1]) if nums else None

def self_consistency(traces):
    """
    Sample N traces; return (majority_answer, confidence).
    """
    # TODO:
    # 1. Extract answers from each trace
    # 2. Filter out None (failed extractions)
    # 3. Count and find the majority
    # 4. confidence = majority_count / total_with_answer
    pass

# Mock trace pool: 8 correct (answer = 30), 2 wrong (one says 40, one says 25)
mock_pool = [
    "Speed = 60 / 2 = 30. The answer is 30.",
    "60 miles in 2 hours. Speed is 30 mph. Answer: 30.",
    "Distance/time = 60/2. Answer is 30.",
    "Half of 60 is 30. The answer is 30.",
    "1 hour: 30 miles. Speed: 30. The answer is 30.",
    "I think it's 40 mph. Answer is 40.",       # wrong
    "60/2 = 30. Answer: 30.",
    "30 mph. The answer is 30.",
    "Maybe 25 mph? The answer is 25.",          # wrong
    "speed = distance / time = 30. Answer is 30.",
]

# Test at different N
# import random
# random.seed(42)
# 
# print(f"{'N':>3} | {'Majority':>10} | {'Confidence':>11} | {'Correct?':>10}")
# print("-" * 50)
# for n in [1, 3, 5, 7, 10]:
#     sample = random.sample(mock_pool, n)
#     answer, conf = self_consistency(sample)
#     mark = "✓" if answer == 30 else "✗"
#     print(f"{n:>3} | {answer!s:>10} | {conf*100:>9.0f}% | {mark:>10}")
# 
# # Observation:
# # - At N=1: single trace; could be either correct or one of the wrong outliers
# # - At N=3-5: majority usually correct, but not guaranteed
# # - At N=10: majority is robust; wrong traces are outvoted
# # - Self-consistency converts an 80%-reliable single trace into a ~100%-reliable answer.
`}
  packages={[]}
/>

### Exercise 3 (medium) — Best-of-N with PRM scoring

Implement best-of-N with a verifier (mock PRM). Compare three strategies on the same trace pool: (a) random single trace, (b) self-consistency majority vote, (c) best-of-N + PRM. Verify that (c) outperforms (b) when the PRM is informative.

<details>
<summary>Hint</summary>

Best-of-N with PRM (Lightman 2023):
1. For each of N traces, compute a PRM score.
2. Return the trace with the highest score.

Real PRMs are trained transformers that score each *step*. For the exercise, use a mock PRM that gives higher scores to traces with explicit math (= signs, arithmetic), longer reasoning, and structured language.

The key insight: if the PRM is *informative* (correlates with correctness), best-of-N + PRM beats majority vote because it weights *quality* of reasoning, not just frequency of agreement.

But: if the PRM is *uninformative* (random scores), best-of-N + PRM is no better than picking a random trace.

</details>

<RunnableCode
  client:visible
  defaultCode={`from collections import Counter
import re

def extract_numeric_answer(trace):
    m = re.search(r"answer is (\\d+)", trace.lower())
    if m: return int(m.group(1))
    m = re.search(r"answer:\\s*(\\d+)", trace.lower())
    if m: return int(m.group(1))
    nums = re.findall(r"\\d+", trace)
    return int(nums[-1]) if nums else None

def mock_prm_score(trace):
    """
    Mock PRM: scores traces by reasoning quality features.
    Real PRMs are trained transformers.
    """
    # TODO:
    # Score by combining:
    # - Length (longer = more reasoning, up to a cap)
    # - Has explicit math operators (=, /, +, -)
    # - Doesn't start with "I think" or "Maybe" (signs of uncertainty)
    # Return a score in [0, 1].
    pass

def best_of_n_prm(traces):
    """Pick the trace with the highest PRM score."""
    # TODO: return trace and its answer
    pass

def random_single(traces, rng):
    """Pick a random trace (baseline)."""
    return rng.choice(traces)

def majority_vote(traces):
    """Self-consistency baseline."""
    answers = [extract_numeric_answer(t) for t in traces]
    answers = [a for a in answers if a is not None]
    return Counter(answers).most_common(1)[0][0]

# Mock pool: 7 correct (different reasoning styles), 3 wrong
mock_pool = [
    "Speed = distance / time = 60 / 2 = 30 mph. The answer is 30.",      # detailed
    "60 miles in 2 hours. 60/2 = 30. Answer: 30.",                       # clear
    "Half of 60 is 30. Answer: 30.",                                     # terse but correct
    "Speed formula: dist/time. 60/2=30. The answer is 30.",              # formula-based
    "I think the answer is 40. Answer is 40.",                           # wrong (uncertain)
    "30 mph. The answer is 30.",                                         # very terse
    "Maybe 25? Answer is 25.",                                           # wrong (uncertain)
    "We have distance=60 and time=2, so speed = 60/2 = 30. Answer: 30.", # very detailed
    "let me guess: 120? Answer is 120.",                                 # wrong (guessing)
    "60 ÷ 2 = 30 mph. The answer is 30.",                                # symbolic
]

# Compare strategies (one trial)
# import random
# rng = random.Random(0)
# 
# print(f"{'Strategy':<25} | {'Answer':>8} | {'Correct?':>9}")
# print("-" * 50)
# 
# # Random single
# single = random_single(mock_pool, rng)
# single_ans = extract_numeric_answer(single)
# 
# # Majority vote (all 10 traces)
# maj_ans = majority_vote(mock_pool)
# 
# # Best-of-N + PRM (all 10 traces)
# # best_trace, best_ans = best_of_n_prm(mock_pool)
# 
# correct = 30
# # print(f"{'Random single':<25} | {single_ans!s:>8} | {'✓' if single_ans == correct else '✗':>9}")
# # print(f"{'Majority vote (n=10)':<25} | {maj_ans!s:>8} | {'✓' if maj_ans == correct else '✗':>9}")
# # print(f"{'Best-of-N + PRM (n=10)':<25} | {best_ans!s:>8} | {'✓' if best_ans == correct else '✗':>9}")
# 
# # Observation:
# # - Random single: ~70% reliable here
# # - Majority vote: more robust (~95% with this pool)
# # - Best-of-N + PRM: picks the *best-reasoned* trace
# # - When PRM is informative, BoN+PRM ≥ majority vote in expectation.
# # - When PRM is uninformative (random scores), BoN+PRM ≈ random single.
`}
  packages={[]}
/>

### Exercise 4 (hard) — Test-time compute scaling math

Derive the majority-vote accuracy curve analytically and reproduce the marquee widget's pattern. Given a single-trace accuracy $p$, compute the probability that majority vote of $N$ traces is correct (assuming independence and a single dominant wrong answer). Plot accuracy vs $N$; observe the saturation pattern.

<details>
<summary>Hint</summary>

Theoretical setup (Wang 2022 derivation, simplified):

Let single-trace accuracy = $p$ (probability one trace gives the correct answer).
Assume:
- The other $1-p$ probability spreads across $k$ wrong answers
- Wrong answers are *approximately* equiprobable (so each wrong answer has probability $\frac{1-p}{k}$)
- For majority vote, the correct answer wins if it appears more often than any single wrong answer

For odd $N$ and *2-answer* setup (one wrong answer with prob $1-p$):
$$P(\text{correct wins}) = \sum_{j=\lceil N/2 \rceil}^{N} \binom{N}{j} p^j (1-p)^{N-j}$$

This is the **binomial cumulative distribution** evaluated at the majority threshold.

For larger $k$ (multiple wrong answers), the analysis is more complex — but the qualitative shape (saturating curve, faster saturation for higher $p$) holds.

Use `math.comb(N, j)` or `scipy.stats.binom` for the binomial computation.

</details>

<RunnableCode
  client:visible
  defaultCode={`import math

def majority_vote_accuracy(p, n):
    """
    Compute the probability that majority vote of N i.i.d. traces is correct,
    given single-trace accuracy p and the simplifying assumption that all errors
    converge on a single wrong answer.
    
    For odd N, the correct answer wins if it appears in >= ceil(N/2) traces.
    """
    # TODO:
    # Use the binomial sum: sum over j = ceil(N/2) to N of C(N,j) * p^j * (1-p)^(N-j)
    # Return that sum.
    pass

# Reproduce the marquee widget's saturation pattern
# print(f"{'N':>3} | {'p=0.5':>8} | {'p=0.7':>8} | {'p=0.9':>8}")
# print("-" * 35)
# for n in [1, 3, 5, 7, 9, 11, 15, 21, 31, 51, 101]:
#     accs = [majority_vote_accuracy(p, n) for p in [0.5, 0.7, 0.9]]
#     print(f"{n:>3} | {accs[0]:>7.1%} | {accs[1]:>7.1%} | {accs[2]:>7.1%}")
# 
# # Observations:
# # - p=0.5: majority vote at any N is 50% (no info to extract)
# # - p=0.7: saturates around 90% by N=21, with diminishing returns
# # - p=0.9: saturates around 99% by N=11
# # 
# # The qualitative pattern matches the marquee widget:
# # - Curves saturate
# # - Higher starting accuracy saturates faster
# # - Diminishing returns past a certain N
# # 
# # This is the math behind self-consistency's effectiveness:
# # the gap between single-trace accuracy and majority-vote accuracy
# # is exactly what test-time compute scaling exploits.
# 
# # Bonus: for what N does p=0.7 reach 95% accuracy?
# # for n in range(1, 201):
# #     if majority_vote_accuracy(0.7, n) >= 0.95:
# #         print(f"\\np=0.7 reaches 95% accuracy at N={n}")
# #         break
`}
  packages={[]}
/>

````

### Part B — Flip Ch 20's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 20, slug: 'ch20-reasoning', title: 'Reasoning', partNum: 7, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript or MDX errors.
2. **Sections 1-7** of Ch 20 still render correctly (no changes to existing sections).
3. **Section 3's** `SelfConsistencyAggregator` secondary widget still renders correctly.
4. **Section 6's** `TestTimeComputeCurves` marquee widget still renders correctly.
5. **New "## Exercises" section** is between section 7 and section 8. Contains 4 sub-exercises with collapsible hints and runnable starter code.
6. **All 4 exercises render** with their starter Python code, hints collapsed by default.
7. **Sidebar**: Ch 1-20 all active (published); Ch 21-30 still dimmed.
8. **Prev/next at bottom of Ch 20**: prev = Ch 19 (active); next = Ch 21 (disabled).
9. **TOC**: includes Exercises as h2 between section 7 and section 8.
10. **Ch 20 status** is `'published'` in `chapters.ts`.
11. **`npm run typecheck`** passes.
12. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not create a new widget**. Both widgets (sessions 90 and 91) are sealed.
- ❌ **Do not call a real LLM** in exercises. Mock models / pre-written traces only.
- ❌ **Do not flip any other chapter's status.** Only Ch 20 flips.
- ❌ **Do not modify Ch 1-19.** Sealed.
- ❌ **Do not modify Ch 20's widgets or prose sections 1-8.** Sealed.
- ❌ **Do not implement actual reasoning models.** This is a curriculum chapter; the actual training is Ch 14.

---

## Wire-up

```bash
git add src/pages/ch20-reasoning/index.mdx src/lib/chapters.ts
git commit -m "session 92: Ch 20 closeout — exercises + status: published. Phase 13 has first published chapter."
git push origin main
```

---

## Ch 20 closeout

Chapter 20 is now the twentieth complete chapter on production. **Phase 13 (Capabilities) has its first published chapter.** The capabilities arc has begun.

Confirm before declaring Ch 20 done:

- ✅ BUILD_ORDER.md shows files 113-117 ✅
- ✅ File 118 marked ⏭️ (absorbed for 5-file cadence)
- ✅ Ch 20 status is `'published'`
- ✅ Both Ch 20 widgets work in production
- ✅ All 4 Ch 20 exercises render with their starter code

**Cadence check across 20 chapters:**

**4-file cadence** holds for **14 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13, 15, 16, 17, 18, 19).
**5-file cadence** holds for **6 two-topic chapters** (Ch 1, 5, 8, 9, 14, **20**).

**20-chapter pattern stable.** The build process continues to scale.

**Phase 13 (Capabilities) status:**
- ✅ Ch 20 (Reasoning)
- ⬜ Ch 21 (Tool use) — next, single-topic, 4-file
- ⬜ Ch 22 (RAG)
- ⬜ Ch 23 (Multimodal)

**What's next — Ch 21: Tool use.** Where Ch 20 gave the model time to think, Ch 21 gives it the ability to *act*. The ReAct pattern from Ch 20's section 4 is the foundation; Ch 21 covers the production engineering — function calling, tool schemas, observation handling, error recovery, agent loops. **The chapter that turns reasoning into agency.**

---

## Notes for the session author

**On the symbolic weight of closing Ch 20:**
This session closes the chapter that *opened Phase 13*. **The reader who reaches this point has crossed the threshold from deployment to capability.** The closeout should reflect that — the curriculum is now in its "capability" half, where each chapter adds a new dimension to what the model can do.

**On the four exercises spanning the chapter's two eras:**

| Ex | Era | Topic | Outcome Hit |
|----|-----|-------|-------------|
| 1 | Classic | Zero-shot CoT extraction | 2 |
| 2 | Classic | Self-consistency aggregation | 3 |
| 3 | Bridge | Best-of-N + PRM | 5 |
| 4 | Modern | Test-time compute scaling math | 6 |

**The progression mirrors the chapter's arc**: classic prompting (Ex 1, 2) → verifier-augmented inference (Ex 3) → the math that justifies modern reasoning models (Ex 4).

**On Ex 4 being the chapter's most mathematically rich exercise:**
Ex 4 derives the binomial sum that produces the saturation curves the reader saw in the marquee widget. **This is the "you understand it if you can derive it" exercise.**

Notes-for-author: "**Ex 4 connects the widget to first principles.** The reader sees the curves in the widget; now they compute them analytically. The binomial sum is the mathematical heart of self-consistency."

**On Ex 4's pedagogical payoff:**
The reader who completes Ex 4 walks away with:
- A formula: $P(\text{majority correct}) = \sum_{j=\lceil N/2 \rceil}^{N} \binom{N}{j} p^j (1-p)^{N-j}$
- The empirical observation: saturation is real; diminishing returns are real
- A concrete demonstration: at $p = 0.7$, you reach 95% accuracy at around $N=15$
- The intuition: **test-time compute scaling is wisdom-of-crowds at scale, with a real mathematical floor**

Notes-for-author: "**Ex 4 completes the chapter.** The reader has seen CoT, self-consistency, ToT, ReAct, PRMs, test-time scaling, and modern reasoning models. Now they have the math that ties self-consistency to the scaling story."

**On the exercises serving the 8 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Why reasoning matters | (chapter prose) |
| 2. Zero-shot/few-shot CoT | Ex 1 |
| 3. Self-consistency | Ex 2 + secondary widget |
| 4. Tree-of-thoughts | (chapter prose) |
| 5. PRM vs ORM | Ex 3 |
| 6. Test-time compute scaling | Ex 4 + marquee widget |
| 7. Modern reasoning models | (chapter prose) |
| 8. Choosing the right technique | (chapter prose + section 8 table) |

Outcomes 2, 3, 5, 6 served by exercises directly. Outcomes 1, 4, 7, 8 served by chapter prose and widgets.

**On the closeout being relatively short:**
This is a 5-file-cadence two-topic chapter, and the widget development took files 115 and 116 (both substantial). **The closeout file is correspondingly lighter** — exercises + status flip + closing notes. **This is the right shape for a 5-file cadence.**

**On the Phase 13 opening trajectory:**
Ch 20 was the first capabilities chapter. Three more in Phase 13:
- **Ch 21 (Tool use)**: extends ReAct into engineered systems
- **Ch 22 (RAG)**: retrieval-augmented generation
- **Ch 23 (Multimodal)**: vision, audio, video

The closeout should set up Ch 21 with the **ReAct bridge** explicit: "Where Ch 20 gave the model time to think, Ch 21 gives it the ability to *act*."

**Pedagogical claim of the chapter (revisited):**
"Reasoning is the capability that turns deployable models into useful systems. The classic era discovered prompting-based techniques (CoT, self-consistency, ToT, ReAct) that work on any model. The modern era trained reasoning directly via RLVR — o1, R1, Gemini Thinking emit long autonomous reasoning traces. **Test-time compute scaling** (Snell 2024) showed that for hard problems, thinking longer dramatically outperforms thinking with more parameters. The math behind self-consistency (Ex 4's binomial sum) is the mathematical heart of test-time compute scaling. **With Ch 20 complete, Phase 13 (Capabilities) has begun.**"

**Phase 13 trajectory after this session**: Ch 20 ✅. **3 chapters remaining** (Ch 21 Tool use, Ch 22 RAG, Ch 23 Multimodal).

**This session closes the first chapter of the capabilities arc.** The reader who finishes here understands reasoning — the foundational capability for everything that follows. **Honor the chapter's role as the doorway to the back half of the curriculum.**

Build with care.
