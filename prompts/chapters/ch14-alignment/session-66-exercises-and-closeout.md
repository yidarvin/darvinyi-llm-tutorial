# Session 66 — Ch 14 exercises + closeout

> **The Chapter 14 closeout.** Two deliverables: an **Exercises section** with 4 problems (Bradley-Terry RM training, DPO loss + gradient computation, RLVR math verifier, length-bias detection) and the **status flip** from `'draft'` to `'published'`. **Closes Ch 14.** After this session, the algorithmic centerpiece of post-training (RLHF + DPO + RLVR) is on production. Phase 11 will be 2/4 done; Ch 15 (PEFT) and Ch 16 (distillation) remain.

Note: this is the closeout for a **two-topic chapter** (5-file cadence). Both widgets shipped in sessions 64 and 65; this session is purely exercises + status flip + retrospective. **Cleaner than 4-file closeouts** — no widget to combine with exercises.

---

## Read first (in this order)

1. **`research/ch14-alignment/research.md`** — pedagogical outcomes 1 (Bradley-Terry), 4 (DPO derivation), 6 (RLVR), 8 (practical issues / reward hacking) are the exercises' focus
2. **`prompts/chapters/ch14-alignment/session-63-page-structure.md`** — for the section-8 placement of the exercises (between section 8 "Practical issues" and section 9 "The modern post-training stack")
3. **`prompts/chapters/ch14-alignment/session-64-preference-pipeline-widget.md`** and **`session-65-dpo-loss-landscape-widget.md`** — for the Ch 14 widget conventions
4. **`prompts/chapters/ch09-scaling-and-distributed/session-44-exercises-and-closeout.md`** — for the two-topic-chapter closeout template (Ch 9 closeout pattern)

---

## Goal

By end of session, two things change in the repo:

1. **An "Exercises" section** is inserted into `index.mdx`. Per the section-63 structure, this goes between section 8 ("Practical issues") and section 9 ("The modern post-training stack"). Four exercises with hints + runnable starter code.
2. **Ch 14's status flips from `'draft'` to `'published'`** in `src/lib/chapters.ts`. Ch 14 is the fourteenth published chapter.

After this session: **Ch 14 is complete.** Phase 11 is 2/4 done; Ch 15 (PEFT) and Ch 16 (distillation) remain.

---

## Inputs

State of the repo after session 65:

- Section 3's `PreferenceLearningPipeline` marquee widget is wired
- Section 5's `DPOLossLandscape` secondary widget is wired
- All 3 runnable code blocks from session 63 are in place
- `src/lib/chapters.ts` has Ch 1-13 `'published'`, Ch 14 `'draft'`

---

## Deliverables

1. **Update** `src/pages/ch14-alignment/index.mdx` — insert new `## Exercises` section between section 8 ("Practical issues") and section 9 ("The modern post-training stack")
2. **Update** `src/lib/chapters.ts` — change Ch 14's `status` from `'draft'` to `'published'`

**Do not modify** any other file. Earlier chapters and widgets are sealed. Ch 14's marquee and secondary widgets are sealed.

---

## Detailed spec

### Part A — Exercises section

Insert between section 8 ("Practical issues") and section 9 ("The modern post-training stack"). Use this structure:

````mdx
## Exercises

Four exercises that build on the chapter's machinery. Each is a self-contained problem with a starting template; hints are collapsed by default — try the problem first.

### Exercise 1 (medium) — Bradley-Terry reward model training

Implement reward model training using the Bradley-Terry loss. Train on synthetic preference pairs where the "ground truth" reward is a simple linear function. Verify that, after training, the model assigns higher reward to chosen responses than rejected.

<details>
<summary>Hint</summary>

The Bradley-Terry loss is:
$$\mathcal{L}_{\text{RM}} = -\mathbb{E}_{(x, y_w, y_l)} [\log \sigma(r_\phi(x, y_w) - r_\phi(x, y_l))]$$

For the synthetic setup:
1. Generate $(x, y_w, y_l)$ tuples. Use a "ground truth" reward $r^*(x, y) = w^T \phi(x, y)$ (e.g., $r^*$ is the dot product of $x$ with $y$).
2. The "true" preference is determined by which response has higher $r^*$.
3. Train your reward model $r_\phi(x, y) = w_\phi^T \phi(x, y)$ to predict preferences via BT loss.
4. After ~100 steps of gradient descent, verify the trained $w_\phi$ correlates with the true $w$.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -30, 30)))

def bt_loss(reward_chosen, reward_rejected):
    """Bradley-Terry loss for a batch of preference pairs."""
    diff = reward_chosen - reward_rejected
    return -np.mean(np.log(sigmoid(diff) + 1e-9))

# Setup: 8-dimensional features; true reward = w_true . features
np.random.seed(0)
D = 8
w_true = np.array([1.0, -0.5, 0.3, 0.0, 0.8, -0.2, 0.5, 0.1])

# Generate 200 preference pairs from random features
N = 200
def make_pair():
    y_a = np.random.normal(0, 1, D)
    y_b = np.random.normal(0, 1, D)
    if (w_true @ y_a) > (w_true @ y_b):
        return y_a, y_b   # a is chosen
    return y_b, y_a       # b is chosen

pairs = [make_pair() for _ in range(N)]
chosen = np.array([p[0] for p in pairs])
rejected = np.array([p[1] for p in pairs])

# Initialize reward model: r_phi(y) = w_phi . y
w_phi = np.random.normal(0, 0.1, D)

# TODO: train w_phi via gradient descent on BT loss
# learning_rate = 0.1
# for step in range(500):
#     reward_chosen = chosen @ w_phi
#     reward_rejected = rejected @ w_phi
#     loss = bt_loss(reward_chosen, reward_rejected)
#     
#     # Gradient of BT loss w.r.t. w_phi:
#     # d/dw_phi[-log sigmoid(r_c - r_r)] = -sigmoid(r_r - r_c) * (chosen - rejected)
#     grad_per_pair = -sigmoid(reward_rejected - reward_chosen)[:, None] * (chosen - rejected)
#     grad = grad_per_pair.mean(axis=0)
#     w_phi -= learning_rate * grad
#     
#     if step % 100 == 0:
#         print(f"step {step}: loss={loss:.4f}, cos_sim(w_phi, w_true)={np.dot(w_phi, w_true) / (np.linalg.norm(w_phi) * np.linalg.norm(w_true)):.3f}")

# After training: verify chosen rewards exceed rejected rewards
# r_c = chosen @ w_phi
# r_r = rejected @ w_phi
# accuracy = np.mean(r_c > r_r)
# print(f"\\nFinal accuracy: {accuracy*100:.1f}% of pairs have chosen > rejected reward.")
# print(f"Final cosine similarity w_phi vs w_true: {np.dot(w_phi, w_true) / (np.linalg.norm(w_phi) * np.linalg.norm(w_true)):.3f}")
`}
  packages={["numpy"]}
/>

### Exercise 2 (medium) — DPO loss and gradients

Implement the DPO loss and verify by hand that its gradients push the chosen log-probability up and the rejected log-probability down — exactly what the loss landscape widget showed.

<details>
<summary>Hint</summary>

The DPO loss is:
$$\mathcal{L}_{\text{DPO}} = -\log \sigma\left(\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right)$$

Define implicit rewards $\hat{r}_w = \beta \log(\pi_\theta(y_w)/\pi_{\text{ref}}(y_w))$ and similarly for $\hat{r}_l$. Then:
$$\mathcal{L} = -\log \sigma(\hat{r}_w - \hat{r}_l)$$

Taking gradients with respect to the chosen and rejected log-probs (treating $\pi_{\text{ref}}$ as constant):
- $\partial \mathcal{L} / \partial \log \pi_\theta(y_w) = -\beta \cdot (1 - \sigma(\hat{r}_w - \hat{r}_l))$ — this is *negative*, so gradient descent *increases* $\log \pi_\theta(y_w)$.
- $\partial \mathcal{L} / \partial \log \pi_\theta(y_l) = +\beta \cdot (1 - \sigma(\hat{r}_w - \hat{r}_l))$ — this is *positive*, so gradient descent *decreases* $\log \pi_\theta(y_l)$.

Implement these and verify numerically with finite differences.

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -30, 30)))

def dpo_loss(logp_w, logp_l, logp_ref_w, logp_ref_l, beta=0.1):
    """DPO loss for one preference pair."""
    r_w = beta * (logp_w - logp_ref_w)
    r_l = beta * (logp_l - logp_ref_l)
    return -np.log(sigmoid(r_w - r_l) + 1e-9)

def dpo_grad_analytical(logp_w, logp_l, logp_ref_w, logp_ref_l, beta=0.1):
    """Analytical gradients of DPO loss w.r.t. logp_w and logp_l."""
    r_w = beta * (logp_w - logp_ref_w)
    r_l = beta * (logp_l - logp_ref_l)
    # TODO: compute dL/dlogp_w and dL/dlogp_l
    # grad_w should be NEGATIVE (descent increases logp_w → assigns more probability to chosen)
    # grad_l should be POSITIVE (descent decreases logp_l → assigns less probability to rejected)
    pass

def dpo_grad_numerical(logp_w, logp_l, logp_ref_w, logp_ref_l, beta=0.1, eps=1e-5):
    """Numerical gradients via finite differences."""
    base = dpo_loss(logp_w, logp_l, logp_ref_w, logp_ref_l, beta)
    grad_w = (dpo_loss(logp_w + eps, logp_l, logp_ref_w, logp_ref_l, beta) - base) / eps
    grad_l = (dpo_loss(logp_w, logp_l + eps, logp_ref_w, logp_ref_l, beta) - base) / eps
    return grad_w, grad_l

# Test
logp_w = -8.0
logp_l = -10.0
logp_ref_w = -10.0
logp_ref_l = -10.0
beta = 0.1

# loss = dpo_loss(logp_w, logp_l, logp_ref_w, logp_ref_l, beta)
# grad_w_a, grad_l_a = dpo_grad_analytical(logp_w, logp_l, logp_ref_w, logp_ref_l, beta)
# grad_w_n, grad_l_n = dpo_grad_numerical(logp_w, logp_l, logp_ref_w, logp_ref_l, beta)

# print(f"Loss: {loss:.4f}")
# print(f"Analytical gradients: dL/dlogp_w = {grad_w_a:.5f}, dL/dlogp_l = {grad_l_a:.5f}")
# print(f"Numerical gradients:  dL/dlogp_w = {grad_w_n:.5f}, dL/dlogp_l = {grad_l_n:.5f}")
# print(f"Match: {np.allclose([grad_w_a, grad_l_a], [grad_w_n, grad_l_n], atol=1e-4)}")
# print(f"\\nSign check:")
# print(f"  grad_w {'<' if grad_w_a < 0 else '>='} 0 → descent {'increases' if grad_w_a < 0 else 'decreases'} logp_w (chosen)")
# print(f"  grad_l {'>' if grad_l_a > 0 else '<='} 0 → descent {'decreases' if grad_l_a > 0 else 'increases'} logp_l (rejected)")
`}
  packages={["numpy"]}
/>

### Exercise 3 (easy) — RLVR math verifier

Implement a verifier for arithmetic word problems. Extract the final numeric answer from a model's response and check it against the ground truth. This is the "reward function" used in RLVR for math tasks.

<details>
<summary>Hint</summary>

1. Use a regex to extract numbers from the response.
2. Take the *last* number — it's typically the final answer (e.g., "Let me compute: 5 + 3 = 8. The answer is 8.").
3. Compare to the ground-truth answer with a small tolerance for floating-point.
4. Return 1.0 if correct, 0.0 otherwise. **This is the RL reward signal.**

For bonus credit: handle cases where the response contains no number at all (return 0), cases where the response is correct but expressed differently ("eight" instead of "8"), or cases where the wrong number appears earlier in the response but the final answer is correct.

</details>

<RunnableCode
  client:visible
  defaultCode={`import re

def extract_final_answer(response):
    """Extract the final numeric answer from a model's response."""
    # TODO: find all numbers; return the last one as a float
    # Hint: use re.findall(r'-?\\d+\\.?\\d*', response)
    pass

def verify_math_answer(response, correct_answer, tolerance=1e-4):
    """RLVR-style binary reward: 1.0 if correct, 0.0 otherwise."""
    # TODO: extract, check tolerance, return 0.0 or 1.0
    pass

# Test on a small dataset of "model responses"
problems = [
    {"q": "What is 23 + 47?",         "correct": 70.0,
     "response": "Let me add: 23 + 47 = 70. The answer is 70."},
    {"q": "What is 15 * 8?",          "correct": 120.0,
     "response": "15 times 8 equals 120."},
    {"q": "What is 144 / 12?",        "correct": 12.0,
     "response": "144 divided by 12 is 12."},
    {"q": "Area of circle, radius 5?", "correct": 78.54,
     "response": "Area = pi * 5^2 = pi * 25 ≈ 78.54"},
    {"q": "What is 100 - 37?",        "correct": 63.0,
     "response": "100 minus 37 is 73."},   # WRONG
    {"q": "What is 6 * 7?",           "correct": 42.0,
     "response": "I'm not sure, maybe 41."},   # WRONG
    {"q": "What is sqrt(16)?",        "correct": 4.0,
     "response": "The square root of 16 is 4."},
]

# total_reward = 0
# correct = 0
# print(f"{'Q':<35} {'Response excerpt':<40} {'Reward':<8}")
# print("-" * 90)
# for p in problems:
#     reward = verify_math_answer(p["response"], p["correct"])
#     marker = "✓" if reward == 1.0 else "✗"
#     print(f"{p['q'][:33]:<35} {p['response'][:38]:<40} {marker} {reward}")
#     total_reward += reward
#     if reward == 1.0: correct += 1
# 
# print(f"\\nTotal reward: {total_reward} / {len(problems)} ({correct}/{len(problems)} correct = {correct/len(problems)*100:.0f}%)")
# print(f"\\nIn RLVR, this reward signal trains the policy via RL. No learned RM needed.")
# print(f"The verifier is the reward function. DeepSeek-R1 used this for math + code at scale.")
`}
  packages={[]}
/>

### Exercise 4 (hard) — Length bias detection

Real reward models often exhibit *length bias*: they give higher rewards to longer responses, regardless of quality. This is one of the most common failures in RLHF/DPO. Detect length bias in a synthetic preference dataset by measuring the correlation between response length and "chosen" status.

<details>
<summary>Hint</summary>

For each preference pair $(x, y_w, y_l)$:
1. Compute the length of $y_w$ and $y_l$ (e.g., character count or word count)
2. Tally: how often is $y_w$ *longer* than $y_l$?
3. If the answer is far from 50%, your data has length bias.

Detailed analysis:
- Compute the average length of chosen vs rejected responses
- Compute the Pearson correlation between $(\text{len}(y_w) - \text{len}(y_l))$ and "chosen vs rejected" labels (always +1 if chosen is longer; -1 if rejected is longer)
- Report % of pairs where chosen is longer

Mitigations:
- Length-normalize the reward model
- Use SimPO (length-normalized DPO)
- Curate preference data to balance lengths
- Re-train with length-controlled subsets

</details>

<RunnableCode
  client:visible
  defaultCode={`import numpy as np

def length_bias_analysis(preference_pairs):
    """
    Analyze a list of (chosen, rejected) response pairs for length bias.
    
    Returns a dict with: pct_chosen_longer, avg_len_chosen, avg_len_rejected,
                         len_diff_mean, len_diff_std.
    """
    # TODO: compute the requested statistics
    pass

# Synthetic preference data — some real preferences, some length-biased
np.random.seed(0)
def gen_pair(length_bias=0.0):
    """
    Generate a (chosen, rejected) pair.
    length_bias: 0 = no bias; 1 = always pick longer; -1 = always pick shorter.
    """
    a = "word " * np.random.randint(5, 30)
    b = "word " * np.random.randint(5, 30)
    quality_a = np.random.uniform(-1, 1)   # "true" quality
    quality_b = np.random.uniform(-1, 1)
    # Add length bias to perceived quality
    perceived_a = quality_a + length_bias * len(a) / 100
    perceived_b = quality_b + length_bias * len(b) / 100
    if perceived_a > perceived_b:
        return (a, b)
    return (b, a)

# Three datasets: no bias, mild bias, strong bias
no_bias = [gen_pair(0.0) for _ in range(500)]
mild_bias = [gen_pair(0.5) for _ in range(500)]
strong_bias = [gen_pair(2.0) for _ in range(500)]

# print(f"{'Dataset':<15} {'% chosen longer':<20} {'avg chosen len':<20} {'avg rejected len':<20}")
# print("-" * 75)
# for name, ds in [("no bias", no_bias), ("mild bias", mild_bias), ("strong bias", strong_bias)]:
#     stats = length_bias_analysis(ds)
#     print(f"{name:<15} {stats['pct_chosen_longer']:>6.1f}% {'':<13} {stats['avg_len_chosen']:>6.1f}{'':<14} {stats['avg_len_rejected']:>6.1f}")
# 
# print(f"\\nFor no-bias data, chosen-longer % should be ~50%.")
# print(f"For mild-bias data, it climbs to 60-65%.")
# print(f"For strong-bias data, it climbs to 80-90% — the RM is being length-biased.")
# print(f"\\nMitigations: length-normalize the reward (SimPO); curate balanced data;")
# print(f"  control for length in the RM training; periodically check for length bias.")
`}
  packages={["numpy"]}
/>

````

### Part B — Flip Ch 14's status

In `src/lib/chapters.ts`, find:

```ts
{ num: 14, slug: 'ch14-alignment', title: 'Preference Optimization: RLHF, DPO, RLVR', partNum: 5, status: 'draft' },
```

Change `status: 'draft'` to `status: 'published'`.

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **Sections 1-8** of Ch 14 still render correctly (no changes to existing sections).
3. **New "## Exercises" section** is below section 8 ("Practical issues") and above section 9 ("The modern post-training stack"). Contains 4 sub-exercises with collapsible hints and runnable starter code.
4. **Section 9** ("The modern post-training stack") still renders correctly after the insert.
5. **Sidebar:** Ch 1-14 all active (published); Ch 15-30 still dimmed.
6. **Prev/next at bottom of Ch 14:** prev = Ch 13 (active); next = Ch 15 (disabled).
7. **TOC on Ch 14** includes Exercises as h2 between section 8 and section 9, plus 4 h3 sub-entries.
8. **Exercise starter code runs without errors** in Pyodide (assumes hints are followed — the `pass` statements expect to be replaced; reader should be able to run and see "no output" for unimplemented; copy a hint to make it work).
9. **Mobile:** exercises render with code blocks scrollable horizontally; collapsed hints expand/collapse.
10. **`npm run typecheck`** passes.
11. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not provide exercise solutions.** Hints only.
- ❌ **Do not flip any other chapter's status.** Only Ch 14 flips.
- ❌ **Do not modify Ch 1-13.** Sealed.
- ❌ **Do not modify Ch 14 widgets.** Sealed.
- ❌ **Do not modify Ch 14 prose sections 1-9.** Sealed. (Only insert the new Exercises section between sections 8 and 9.)
- ❌ **Do not implement a full PPO algorithm in an exercise.** Out of scope; pedagogically demanding for a hint-based exercise.

---

## Wire-up

```bash
git add src/pages/ch14-alignment/index.mdx src/lib/chapters.ts
git commit -m "session 66: Ch 14 exercises + status: published — Phase 11 algorithmic centerpiece complete"
git push origin main
```

---

## Ch 14 closeout — Phase 11 at the halfway mark

Chapter 14 is now the fourteenth complete chapter on production. **Phase 11 is half done** — two chapters remaining (Ch 15 PEFT, Ch 16 distillation).

Confirm before declaring Ch 14 done:

- ✅ BUILD_ORDER.md shows files 81-85 ✅
- ✅ Files 86-87 marked ⏭️ (absorbed)
- ✅ Ch 14 status is `'published'`
- ✅ Both Ch 14 widgets work in production
- ✅ All 4 Ch 14 exercises render with their starter code

**Cadence check across 14 chapters:**

| Chapter | Topic shape | Widgets | Files |
|---|---|---|---|
| Ch 1 | Math + code-heavy | 3 | 5 |
| Ch 2 | Concept-heavy | 2 | 4 |
| Ch 3 | Algorithm-heavy | 2 | 4 |
| Ch 4 | Math + visual | 2 | 4 |
| Ch 5 | Two-topic | 2 | 5 |
| Ch 6 | Variants | 2 | 4 |
| Ch 7 | Data engineering | 2 | 4 |
| Ch 8 | Two-topic | 2 | 5 |
| Ch 9 | Two-topic | 2 | 5 |
| Ch 10 | Engineering | 2 | 4 |
| Ch 11 | Architectural variant | 2 | 4 |
| Ch 12 | Architectural variant | 2 | 4 |
| Ch 13 | Practical engineering | 2 | 4 |
| Ch 14 | Two-topic (RLHF + DPO/RLVR) | 2 | 5 |

**4-file cadence holds for 9 single-topic chapters** (Ch 2, 3, 4, 6, 7, 10, 11, 12, 13).
**5-file cadence holds for 5 two-topic chapters** (Ch 1, 5, 8, 9, 14).

**14-chapter pattern stable.**

**Phase 11 (Post-training) status:**
- ✅ Ch 13 (Supervised Fine-Tuning)
- ✅ Ch 14 (Preference Optimization: RLHF, DPO, RLVR)
- ⬜ Ch 15 (PEFT — LoRA, adapters) — next, single-topic, 4-file
- ⬜ Ch 16 (Distillation) — single-topic, 4-file

**What's next — Ch 15: PEFT.** Where Ch 13-14 covered full-parameter post-training methods, Ch 15 covers the *efficient* alternatives: LoRA, adapters, prefix tuning. In practice, **most production fine-tuning is LoRA-based**, not full-parameter. Ch 15 explains why and how. Single-topic chapter; 4-file cadence.

---

## Notes for the session author

**On no widget in this session:**
For two-topic chapters (5-file cadence), both widgets ship in their own sessions (here: 64 marquee, 65 secondary). The closeout (this session) is purely exercises + status flip. **Cleaner than 4-file closeouts** where a secondary widget gets combined with exercises in the same session.

**On the exercise placement:**
Per Ch 14's section structure: section 8 covers practical issues (reward hacking, length bias); section 9 wraps up with the modern post-training stack. **Exercises go *between* these sections** — they reinforce the chapter's mechanics (BT, DPO, RLVR, length bias) before the closing summary. This placement gives readers a chance to do something hands-on before the chapter wraps.

**On the four exercises' progression:**
- **Ex 1 (medium) — BT RM training**: implements the *first* stage of RLHF (reward modeling). Reader trains a linear RM on synthetic preferences and verifies it learns the true preference function. Locks in section 2's math.
- **Ex 2 (medium) — DPO gradients**: implements the DPO loss + analytical and numerical gradients. Reader verifies that the gradient direction matches what the DPO loss landscape widget showed (section 5). Combines algebra + geometry from the two key Ch 14 widgets.
- **Ex 3 (easy) — RLVR verifier**: implements a math verifier. Simple but pedagogically critical — reader sees that "no learned RM needed" is real. Connects section 7 (RLVR) to practice.
- **Ex 4 (hard) — Length bias detection**: detects length bias in synthetic preference data. Practical engineering: this is what you'd do before training a real RM. Locks in section 8 (practical issues) by giving readers tools to *detect* the most common failure mode.

**On the exercises serving the 9 outcomes:**

| Outcome | Exercise |
|---|---|
| 1. Bradley-Terry model | Ex 1 |
| 2. RLHF recipe sketch | (chapter prose + widget) |
| 3. KL constraint | (chapter prose) |
| 4. DPO derivation | Ex 2 |
| 5. DPO variants | (chapter prose) |
| 6. RLVR vs DPO vs RLHF | Ex 3 |
| 7. Reasoning emergence | (chapter prose) |
| 8. Practical pitfalls | Ex 4 |
| 9. Method selection | (chapter prose + widgets) |

Outcomes 1, 4, 6, 8 served by exercises directly. Outcomes 2, 3, 5, 7, 9 served by chapter prose and widgets.

**On the difficulty progression:**
- Ex 3 (RLVR verifier) is easiest because it's just regex + comparison
- Ex 1 (BT training) and Ex 2 (DPO gradients) are medium — gradient descent + chain rule
- Ex 4 (length bias detection) is hardest because it requires statistical analysis + correlation computation

Difficulty: easy → medium → medium → hard. Good progression.

**On the BT training exercise (Ex 1):**
The synthetic setup uses random feature vectors with a "true" reward function $r^*(y) = w_{\text{true}}^T y$. The reward model learns $r_\phi(y) = w_\phi^T y$. After training, $w_\phi$ should align with $w_{\text{true}}$ (high cosine similarity). **This is the simplest non-trivial RM training setup**; reader sees BT loss work on a controlled problem.

**On the DPO gradient verification (Ex 2):**
Reader implements analytical and numerical gradients and compares them. **This is a classic gradient-checking exercise** — but specifically for DPO. After completing it, reader has *implemented* DPO and *verified* its gradients are correct. Plus the sign check: chosen log-prob gradient is negative (descent increases it), rejected is positive (descent decreases it). **Exactly what the DPO loss landscape showed visually** in section 5.

**On the length bias exercise (Ex 4):**
This is the most practical exercise. **In real production**, you would:
1. Generate synthetic preference data with controllable length bias
2. Compute statistics: % chosen longer, avg lengths, length-diff distribution
3. Identify the bias level
4. Choose a mitigation (length-normalize, balance data, switch to SimPO)

The exercise simulates step 1-3. The hint section discusses step 4. **Reader walks away with a concrete diagnostic tool** for real RLHF/DPO pipelines.

**Pedagogical claim of the chapter (revisited):**
"Preference optimization turns an SFT'd model into a *good* model. Classical RLHF does it via a reward model and PPO. DPO simplifies this to supervised learning via a beautiful mathematical derivation. RLVR extends RL to verifiable tasks, where reasoning capabilities *emerge* from reward maximization. The chapter's exercises lock in the math (Ex 1, 2), the algorithmic insight (Ex 3), and the practical engineering (Ex 4)."

**Phase 11 progress after this session**: Ch 13 ✅, Ch 14 ✅. Two chapters remain (Ch 15 PEFT, Ch 16 distillation). Both single-topic, both 4-file cadence. Pace through them after Ch 14.

**This chapter is the algorithmic peak of Phase 11.** Ch 15 (PEFT) and Ch 16 (distillation) are more practical — they're optimizations on top of the methods covered in Ch 13-14. The conceptual heavy lifting is done after Ch 14.

Build with care.
