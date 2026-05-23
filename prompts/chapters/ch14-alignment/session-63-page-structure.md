# Session 63 — Chapter 14 page structure

> First chapter session for Chapter 14 ("Preference Optimization: RLHF, DPO, RLVR"). **Phase 11's algorithmic centerpiece.** Where Ch 13 (SFT) taught the model *format*, Ch 14 teaches it *quality* — covering classical RLHF (Reward Model + PPO), the DPO derivation that skips RL entirely, the DPO variant zoo (IPO, KTO, ORPO, SimPO), and the recent RLVR breakthrough that powers DeepSeek-R1 and o1. **Two-topic chapter** — uses the **5-file cadence**.

---

## Read first (in this order)

1. **`research/ch14-alignment/research.md`** — the source material. Every section, derivation, code snippet, and misconception in this session traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch09-scaling-and-distributed/session-41-page-structure.md`** — for the two-topic-chapter template (Ch 9 covered scaling laws + distributed training as one chapter; Ch 14 covers RLHF + DPO/RLVR similarly)
4. **`prompts/chapters/ch13-sft/session-59-page-structure.md`** — for the Phase 11 voice (post-training is *practical*, not just theoretical)

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 14 page. By end of session:

- `src/pages/ch14-alignment/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch14-alignment/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 14's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch14-alignment/` with sidebar showing Ch 14 active, prev/next nav linking to Ch 13 (active) and Ch 15 (disabled)

**Tonal note:** Ch 14 is **algorithmically rich and conceptually beautiful**. The DPO derivation is one of the prettiest mathematical results in recent ML — a closed-form solution to a constrained optimization problem turns into a supervised loss. **Don't suppress the excitement**, but match it with care. Walk through the derivation rather than just stating the result. The RLVR section (the 2024-2025 breakthrough) is genuinely exciting — reasoning capabilities emerging from RL on verifiable tasks is one of the most important developments in modern post-training. **Match the chapter to the topic**: this is where the algorithm comes alive.

**Two-topic framing:** the chapter has two distinct topics — classical RLHF (sections 3-4) and modern DPO/RLVR (sections 5-7) — connected by the unifying theme of "preference optimization." The structure should make this transition explicit.

**Chapter cadence:** Ch 14 uses the **5-file cadence** (two-topic).

---

## Inputs

State of the repo after session 61 (Ch 13 complete):

- Ch 1-13 all `'published'`
- `research/ch14-alignment/research.md` exists
- `src/lib/chapters.ts` has Ch 1-13 `'published'`, Ch 14-30 `'planned'`
- No `src/pages/ch14-alignment/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch14-alignment/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch14-alignment/index.astro` if it exists
3. **Update** `src/lib/chapters.ts` — change Ch 14's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch14-alignment
description: Preference optimization — the algorithmic centerpiece of post-training. Where SFT (Chapter 13) taught the model to respond, this chapter teaches it to respond well. Covers classical RLHF (reward model + PPO with KL constraint), Direct Preference Optimization (DPO — the math trick that skips RL entirely), DPO variants (IPO, KTO, ORPO, SimPO), and the recent RLVR breakthrough (RL with Verifiable Rewards — what powered DeepSeek-R1 and OpenAI o1's reasoning capabilities). The chapter's pedagogical centerpiece is the DPO derivation: a closed-form solution to a KL-regularized RL objective becomes a supervised loss on preference pairs. Two-topic chapter walking classical and modern alignment.
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~280 words) that frame the chapter.

**Sample opening** — rewrite in chapter voice:

> Chapter 13 left you with an SFT'd model: it knows the format of being a chatbot, follows instructions, and produces grammatical responses. It does *not* know how to produce *good* responses. Given a hard question, it may confidently invent an answer. Asked for help on something edgy, it may refuse harmlessly or comply harmfully. The format is there; the quality and alignment aren't.
>
> **Preference optimization** addresses this gap. The premise: humans can't easily *demonstrate* the best response, but can readily *compare* two responses and pick the better one. Collect a dataset of preference pairs (instruction + chosen response + rejected response), and train the model to produce more chosen-like outputs and fewer rejected-like ones. The mechanics are where it gets interesting.
>
> Three families of methods cover this space. **Classical RLHF** (Christiano 2017; InstructGPT 2022) trains a reward model on preferences, then optimizes the policy with PPO against the reward, constrained by a KL penalty to the SFT model. **DPO** (Rafailov 2023) is the mathematical insight that the KL-regularized RL objective has a closed-form solution that reparameterizes into a *supervised loss* — no reward model, no PPO, no RL loop. **RLVR** (DeepSeek-R1, o1, 2024-2025) extends RL to settings where rewards are *objectively verifiable* (math correctness, code tests passing) — bootstrapping reasoning capability without any human-labeled reward. This chapter walks all three.

### Section 1: The setup — SFT teaches format, not quality

**Heading:** `## The setup — SFT teaches format, not quality`
**Word target:** ~400

**Teaching beats:**
1. **What SFT gives you**: a model that follows the chat template, knows it's a chatbot, and produces grammatical responses.
2. **What SFT doesn't give you**: a model that produces *good* responses. After SFT:
   - The model may confidently invent answers to questions it doesn't know
   - It may refuse helpful queries (over-refusal) or fail to refuse harmful ones (under-refusal)
   - It may be verbose, hedging, sycophantic — patterns from SFT data that don't generalize
   - Reasoning is shallow; complex multi-step problems often fail
3. **The premise of preference optimization**: humans struggle to *demonstrate* the optimal response (especially for open-ended tasks), but can readily *compare* two responses and pick the better one. **Preference pairs are easier to collect than ideal responses.**
4. **The three families**:
   - **RLHF**: learned reward model + PPO (classical recipe; InstructGPT)
   - **DPO**: supervised loss derived from KL-regularized RL (the math trick)
   - **RLVR**: RL with objective rewards from verifiers (math/code; new frontier)
5. **The bridge from Ch 13**: SFT precedes preference optimization. The trained model from Ch 13 becomes the *reference policy* — preference methods stay close to it via KL constraint.

**Required callout** — type `note`: This chapter has two topics. Sections 2-4 cover **classical RLHF** (the original recipe, still used by frontier labs). Sections 5-7 cover **modern alternatives** — DPO (now the open-source default), DPO variants, and RLVR (the 2024-2025 reasoning breakthrough). Section 8-9 covers practical issues and the production stack.

**No code in this section.** Setup and motivation.

**Connection forward:** Section 2 introduces the data.

### Section 2: Preference data and the Bradley-Terry model

**Heading:** `## Preference data and the Bradley-Terry model`
**Word target:** ~600
**Sub-headings:** `### Preference data structure`, `### The Bradley-Terry model`

**Teaching beats:**

**Preference data structure:**
1. **The format**: each preference example is a tuple $(x, y_w, y_l)$ where $x$ is the prompt/context, $y_w$ ("chosen" / "winner") is the preferred response, $y_l$ ("rejected" / "loser") is the dispreferred one.
2. **How it's collected**: a human (or strong model — for synthetic preferences) is shown $x, y_1, y_2$ and asked "which is better?" Their choice determines $y_w$ vs $y_l$.
3. **Inter-rater agreement is imperfect** — typical is 65-75%. Different humans have different values, biases, and judgments.
4. **Common biases**: length bias (longer = preferred), confidence bias (assertive = preferred), formatting bias (lists/headers = preferred). These propagate into models.

**The Bradley-Terry model:**
5. **Map preferences to probabilities**: posit that each response has a hidden "quality" score $r(x, y)$. The probability that humans prefer $y_w$ over $y_l$ is the sigmoid of the score difference:
   $$P(y_w \succ y_l \mid x) = \sigma(r(x, y_w) - r(x, y_l))$$
6. **Why sigmoid?**: it's the natural choice for binary outcomes from continuous scores. A reward difference of 1 means ~73% preference; 2 means ~88%; 0 means 50/50.
7. **Training the reward model**: standard binary cross-entropy:
   $$\mathcal{L}_{\text{RM}} = -\mathbb{E}_{(x, y_w, y_l)} [\log \sigma(r_\phi(x, y_w) - r_\phi(x, y_l))]$$
   This is just classification: predict which response a human preferred.
8. **The result**: a scalar reward function $r_\phi(x, y) \to \mathbb{R}$ that approximates human preferences.

**Required code** — `<RunnableCode>` with Bradley-Terry RM loss:

```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def rm_loss(reward_chosen, reward_rejected):
    """
    Bradley-Terry loss for reward model training.
    Maximize P(chosen > rejected) = sigmoid(r_chosen - r_rejected).
    """
    diff = reward_chosen - reward_rejected
    return -np.mean(np.log(sigmoid(diff) + 1e-9))

# Demo: 8 preference pairs
np.random.seed(0)
B = 8

# Scenario A: model gives chosen higher rewards (correct)
r_chosen_correct = np.array([1.2, 0.8, 0.5, -0.1, 1.5, 0.3, 0.7, 0.9])
r_rejected_correct = np.array([0.1, -0.5, 0.0, -0.8, 0.7, -0.2, 0.2, 0.4])

# Scenario B: model is wrong — gives rejected higher rewards
loss_correct = rm_loss(r_chosen_correct, r_rejected_correct)
loss_wrong = rm_loss(r_rejected_correct, r_chosen_correct)

print(f"Loss when chosen scores higher (correct): {loss_correct:.3f}")
print(f"Loss when rejected scores higher (wrong): {loss_wrong:.3f}")
print(f"\nThe RM is trained to drive chosen rewards above rejected.")
print(f"After training, reward differences map to preference probabilities.")
```

**Required callout** — type `warning`: MC6 from research.md. "Preference data is objective." False — **inter-rater agreement on preference data is typically only 65-75%.** Different raters disagree because of different values, biases, and judgments. Common systematic biases: length (longer = preferred), confidence (assertive = preferred), formatting (lists = preferred). Reward models trained on this data inherit these biases.

**Connection forward:** with a reward model in hand, we can run RL. Section 3.

### Section 3: Classical RLHF — reward model + PPO

**Heading:** `## Classical RLHF — reward model + PPO`
**Word target:** ~700
**Sub-headings:** `### The three-stage recipe`, `### The optimization objective`, `### PPO mechanics, briefly`

**Teaching beats:**

**The three-stage recipe:**
1. **Stage 1: SFT** (Ch 13) — produces the starting policy $\pi_{\text{SFT}}$
2. **Stage 2: Reward modeling** — train $r_\phi(x, y)$ on preference data using Bradley-Terry loss
3. **Stage 3: PPO fine-tuning** — optimize $\pi_\theta$ to maximize $r_\phi$ while staying close to $\pi_{\text{SFT}}$ via KL constraint

InstructGPT (Ouyang et al. 2022) introduced this recipe; ChatGPT is based on it.

**The optimization objective:**
4. **Maximize expected reward, penalize divergence from reference**:
   $$\max_{\pi_\theta} \mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_\theta(\cdot \mid x)} \left[ r_\phi(x, y) \right] - \beta \cdot D_{KL}(\pi_\theta(\cdot \mid x) \,\|\, \pi_{\text{ref}}(\cdot \mid x))$$
5. **Two terms**: the policy *wants* high reward but is *penalized* for drifting from $\pi_{\text{ref}}$ (typically $\pi_{\text{SFT}}$). $\beta$ controls the trade-off.

**PPO mechanics, briefly:**
6. **The challenge**: $\pi_\theta$ generates responses, gets scored by $r_\phi$, and gets updated. This is on-policy RL — the policy must generate samples for training.
7. **PPO's clipped surrogate**: instead of directly optimizing $r$, PPO uses a clipped policy ratio. This prevents catastrophic updates. The clip ratio (typically $\epsilon = 0.2$) is the key hyperparameter.
8. **The full PPO update** uses Generalized Advantage Estimation (GAE) for value estimation, multiple epochs per batch, and several other tricks. **Don't deep-dive on PPO here** — it's a specialty topic.

**Required widget placeholder** — Preference Learning Pipeline (marquee, session 64):

```mdx
<WidgetFrame title="Preference learning pipeline" caption="The data flow from a preference pair to a trained policy, comparing classical RLHF and DPO paths side-by-side. RLHF: pair → reward model → PPO → policy. DPO: pair → direct loss → policy. Same data, two algorithmic paths to similar destinations. Toggle to highlight each path.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 64 (marquee)
  </div>
</WidgetFrame>
```

**Required callout** — type `note`: PPO is significantly more expensive than SFT. It requires keeping both $\pi_\theta$ (training) and $\pi_{\text{ref}}$ (frozen) in memory; generating rollouts during training (which is slow); and scoring them with the RM. **Most open-source teams switched to DPO** (next section) precisely because PPO is operationally heavy. Frontier labs still use PPO, often with significant infrastructure investment.

**Connection forward:** Section 4 zooms in on the KL constraint.

### Section 4: The KL constraint

**Heading:** `## The KL constraint`
**Word target:** ~400
**Sub-headings:** `### Why the constraint matters`, `### What happens without it`

**Teaching beats:**

**Why the constraint matters:**
1. **The reward model is imperfect** (typical 65-75% accuracy on held-out preferences). Optimizing against an imperfect proxy is dangerous.
2. **Without constraint**: the policy finds *out-of-distribution* responses that score high on the (imperfect) RM but aren't actually preferred by humans. This is **reward hacking**.
3. **Common reward-hacking failures**: extreme length, repetitive content, sycophantic agreement, formatting tricks (excessive lists/headers).
4. **The KL constraint says**: "stay close enough to the reference that we know the responses are *recognizable*." Goodhart's law mitigation.

**What happens without it:**
5. **Empirically**: removing the KL constraint causes the policy to converge to degenerate solutions within a few hundred steps. Responses become bizarre.
6. **The base capabilities also degrade**: drifting too far from the SFT model loses the pre-training knowledge encoded in it.
7. **Choosing $\beta$**: too small ($\beta < 0.01$): reward hacking. Too large ($\beta > 0.5$): minimal learning, the policy doesn't move from $\pi_{\text{ref}}$. Empirically $\beta = 0.05$ to $0.2$ is typical for RLHF.

**Required callout** — type `warning`: MC3 from research.md. "More RL is always better." False — **reward hacking** kicks in past a certain point. The policy starts exploiting reward-model weaknesses rather than improving genuinely. **Length bias** is the most common manifestation. Empirically, RLHF benefits saturate at ~10K-100K preference pairs; more training doesn't help.

**No code in this section.** Conceptual deep-dive.

**Connection forward:** Section 5 is the chapter's centerpiece. The DPO derivation shows how to skip the reward model and PPO entirely.

### Section 5: DPO — direct preference optimization

**Heading:** `## DPO — direct preference optimization`
**Word target:** ~900 — CENTRAL TOPIC
**Sub-headings:** `### The closed-form optimal policy`, `### Solving for the reward`, `### Substituting into Bradley-Terry`, `### The DPO loss`

**Teaching beats:**

**The closed-form optimal policy:**
1. **Recall** the RLHF objective: maximize reward minus $\beta$ × KL.
2. **A surprising result**: this constrained optimization has a *closed-form* optimal policy:
   $$\pi^*(y \mid x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y \mid x) \exp\left(\frac{1}{\beta} r(x, y)\right)$$
   where $Z(x) = \sum_y \pi_{\text{ref}}(y \mid x) \exp(r(x, y)/\beta)$ is a normalizer.
3. **Intuition**: the optimal policy is the reference policy *reweighted* by the exponential of the reward. High-reward responses get boosted; low-reward ones get suppressed.

**Solving for the reward:**
4. **Rearrange to solve for $r$**:
   $$r(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)$$
5. **The reward equals the log policy ratio**, plus a context-only term ($Z(x)$ depends on $x$ but not on $y$).

**Substituting into Bradley-Terry:**
6. **Plug into BT**:
   $$P(y_w \succ y_l \mid x) = \sigma\left(\beta \log \frac{\pi^*(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi^*(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right)$$
7. **The $\log Z(x)$ terms cancel!** Both responses are evaluated at the same context.
8. **The probability of preference is a function of policy log-ratios alone.**

**The DPO loss:**
9. **The DPO loss** directly maximizes this log-likelihood:

```mdx
<Equation label="14.dpo">
$$\mathcal{L}_{\text{DPO}}(\pi_\theta) = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma\left(\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right) \right]$$
</Equation>
```

10. **This is supervised.** Take preference pairs, compute log-probabilities under both $\pi_\theta$ (current) and $\pi_{\text{ref}}$ (frozen), apply sigmoid log-likelihood. **No reward model. No RL. No on-policy sampling.**
11. **The implicit reward**: $\beta \log(\pi_\theta(y \mid x) / \pi_{\text{ref}}(y \mid x))$. **The policy itself encodes the reward.**

**Required widget placeholder** — DPO Loss Landscape (secondary, session 65):

```mdx
<WidgetFrame title="DPO loss landscape" caption="The DPO loss surface as a function of two variables: (β log π_θ(y_w)/π_ref(y_w)) and (β log π_θ(y_l)/π_ref(y_l)) — the implicit rewards for chosen and rejected. Slider for β. The loss is low when chosen reward is high and rejected reward is low — the diagonal where DPO learns is visible as a clear gradient.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 65 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` with DPO loss implementation:

```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def dpo_loss(logp_chosen, logp_rejected, logp_ref_chosen, logp_ref_rejected, beta=0.1):
    """DPO loss for a batch of preference pairs."""
    # Implicit rewards = beta * log policy ratio
    r_chosen = beta * (logp_chosen - logp_ref_chosen)
    r_rejected = beta * (logp_rejected - logp_ref_rejected)
    # Standard sigmoid log-likelihood
    diff = r_chosen - r_rejected
    return -np.mean(np.log(sigmoid(diff) + 1e-9)), r_chosen.mean(), r_rejected.mean()

# Demo: simulate good vs bad policy
np.random.seed(1)
B = 8
logp_ref = np.full(B, -10.0)   # reference assigns -10 to both

# Good policy: assigns higher prob to chosen
logp_good_chosen = np.full(B, -8.0)
logp_good_rejected = np.full(B, -12.0)

# Bad policy: assigns lower prob to chosen
logp_bad_chosen = np.full(B, -12.0)
logp_bad_rejected = np.full(B, -8.0)

loss_good, r_c_g, r_r_g = dpo_loss(logp_good_chosen, logp_good_rejected, logp_ref, logp_ref, beta=0.1)
loss_bad,  r_c_b, r_r_b = dpo_loss(logp_bad_chosen,  logp_bad_rejected,  logp_ref, logp_ref, beta=0.1)

print(f"Good policy (chosen has higher log-prob than ref):")
print(f"  DPO loss: {loss_good:.3f}")
print(f"  Implicit rewards: chosen={r_c_g:.3f}, rejected={r_r_g:.3f}")
print(f"\nBad policy (chosen has lower log-prob than ref):")
print(f"  DPO loss: {loss_bad:.3f}")
print(f"  Implicit rewards: chosen={r_c_b:.3f}, rejected={r_r_b:.3f}")
print(f"\nDPO is just a supervised loss. No reward model, no PPO.")
```

**Required callout** — type `warning`: MC2 from research.md. "DPO is just RLHF without RL." Subtler than that. **DPO avoids the explicit RL loop but encodes the same optimization mathematically.** The math is equivalent; the algorithm is different. DPO works because the *policy* parameterizes the implicit reward — you don't *skip* the optimization, you *reformulate* it.

**Connection forward:** Section 6 covers the variants.

### Section 6: DPO variants — IPO, KTO, ORPO, SimPO

**Heading:** `## DPO variants — IPO, KTO, ORPO, SimPO`
**Word target:** ~500
**Sub-headings:** `### Four variants`, `### Which to use`

**Teaching beats:**

**Four variants:**

1. **IPO** (Identity Preference Optimization, Azar et al. 2023): adds quadratic regularization to DPO. Better behaved when preferences are *deterministic* (raters always pick the same response). DPO can be unstable in that regime.

2. **KTO** (Kahneman-Tversky Optimization, Ethayarajh et al. 2024): works with *individual* good/bad ratings instead of pairs. Easier data collection — rate one response at a time instead of choosing between pairs. Uses a prospect-theoretic value function.

3. **ORPO** (Monolithic Preference Optimization, Hong et al. 2024): combines SFT and DPO into a single training stage. **No reference model needed.** Train from a base model directly to an aligned model.

4. **SimPO** (Simple Preference Optimization, Meng et al. 2024): drops the reference model and uses *length-normalized* log probabilities. Addresses length bias directly. Competitive with DPO at lower complexity.

**Which to use:**
5. **DPO** is the default starting point. Well-studied, stable, easy to tune.
6. **SimPO** is gaining adoption — simpler code, addresses length bias.
7. **KTO** when you only have single-response ratings (e.g., thumbs up/down feedback).
8. **ORPO** for end-to-end pipelines that skip a separate SFT phase.
9. **IPO** when your preference labels are fully deterministic (rare in practice).

**Required callout** — type `note`: The DPO variant space is large and evolves quickly. Beyond the four covered here, others exist (DPOP, RPO, IRPO, etc.). The four shown represent the most cited *conceptually distinct* variants. The differences between them are: (1) whether they use a reference model, (2) what data format they need, (3) what their loss looks like, (4) how they handle length. Don't try to memorize them all — pick one (DPO is the safe default) and learn it well.

**Connection forward:** Section 7 turns to the most recent breakthrough — RLVR.

### Section 7: RLVR — RL with verifiable rewards

**Heading:** `## RLVR — RL with verifiable rewards`
**Word target:** ~700 — IMPORTANT EMERGING TOPIC
**Sub-headings:** `### When rewards are objective`, `### DeepSeek-R1's recipe`, `### Reasoning emergence`, `### Where RLVR applies`

**Teaching beats:**

**When rewards are objective:**
1. **Classical RLHF uses a *learned* reward model** to approximate human preferences. The signal is noisy.
2. **For some tasks the reward is objective**: math (answer correctness), code (test passing), proofs (verifier validity), games (win/loss).
3. **RLVR uses these *verifiable* rewards directly** — no learned RM. The "reward function" is a verifier: a calculator, a compiler, a theorem prover.
4. **Why this matters**: verifiable rewards are *not noisy*. The model gets unambiguous signal. RL works much better when rewards are not noisy.

**DeepSeek-R1's recipe:**
5. **DeepSeek-R1** (Jan 2025) demonstrated RLVR at frontier scale. The full recipe:
   - Start from base model (DeepSeek-V3-Base)
   - **Cold-start SFT** on a small high-quality reasoning dataset
   - **Large-scale RLVR** on math + code with verifiable rewards
   - **Rejection sampling** to generate higher-quality CoT data
   - **Final SFT + RLVR** on the augmented data
6. **DeepSeek-R1-Zero**: a variant that skipped cold-start SFT entirely. Pure RL on a base model. **Worked** — but with stability issues (language mixing, readability problems). The cold-start SFT in DeepSeek-R1 stabilized this without losing reasoning gains.
7. **OpenAI's o1** (Sep 2024) followed a similar recipe. Limited public details, but the pattern (RL on verifiable tasks → reasoning emergence) is clearly the same.

**Reasoning emergence:**
8. **The most striking finding**: as RL training progresses, the model learns to **think longer**. Chain-of-thought traces grow naturally.
9. **The mechanism**: the model discovers that **showing its work increases reward**. So it does. Long CoT is a *learned behavior*, not a hand-engineered prompt template.
10. **No one programmed this**: it emerged from reward maximization. **This is the most exciting recent development in post-training.**

**Where RLVR applies:**
11. **Works well**:
    - Math (final answer checkable)
    - Code (tests pass / compile)
    - Theorem proving (validator)
    - Games (score)
    - Structured tasks (output format)
12. **Doesn't apply**:
    - Creative writing (no objective verifier)
    - Open-ended advice (no ground truth)
    - Conversation quality (subjective)
13. **For non-verifiable tasks**: classical RLHF / DPO with human or model-graded rewards remains necessary.

**Required code** — `<RunnableCode>` with verifiable reward example:

```python
import re

def extract_final_answer(response):
    """Extract the final numeric answer from a model's response."""
    matches = re.findall(r'-?\d+\.?\d*', response)
    if not matches:
        return None
    return float(matches[-1])

def verify_math_answer(response, correct_answer, tolerance=1e-6):
    """RLVR-style verification: check if final answer matches."""
    answer = extract_final_answer(response)
    if answer is None:
        return 0.0
    return 1.0 if abs(answer - correct_answer) < tolerance else 0.0

# Verify several model responses
problems = [
    {"q": "What is 23 + 47?",         "correct": 70.0,
     "response": "Let me add: 23 + 47 = 70. The answer is 70."},
    {"q": "What is 15 * 8?",          "correct": 120.0,
     "response": "15 * 8 = 120"},
    {"q": "Area of circle, radius 3?", "correct": 28.274,
     "response": "Area = pi * r^2 = pi * 9 ≈ 28.27"},
    {"q": "What is 100 / 4?",         "correct": 25.0,
     "response": "100 divided by 4 is 27."},   # wrong!
]

print("RLVR verifier on model responses:\n")
for p in problems:
    reward = verify_math_answer(p["response"], p["correct"])
    marker = "✓" if reward == 1.0 else "✗"
    print(f"{marker} Q: {p['q']}")
    print(f"  Response: {p['response'][:55]}")
    print(f"  Reward: {reward}\n")

print("No human RM needed — the verifier IS the reward.")
print("DeepSeek-R1 used this on math + code at scale to bootstrap reasoning.")
```

**Required callout** — type `note`: MC8 from research.md. "Chain-of-thought is hand-engineered." In RLVR-trained models, **CoT emerges from RL**. The model discovers that "thinking longer" increases reward on verifiable tasks. The behavior is *learned*, not programmed. This is what makes RLVR exciting: capabilities emerge from reward maximization on objective tasks. **The model writes its own thinking template.**

**Connection forward:** Section 8 returns to practical issues.

### Section 8: Practical issues

**Heading:** `## Practical issues`
**Word target:** ~400
**Sub-headings:** `### Reward hacking`, `### Length bias`, `### Mode collapse`

**Teaching beats:**

**Reward hacking:**
1. **Goodhart's law**: when a measure becomes a target, it ceases to be a good measure. Reward models are imperfect proxies; optimizing against them eventually breaks the proxy.
2. **Common manifestations**:
   - **Length hacking**: longer responses score higher → models become verbose
   - **Sycophancy**: agreeing with user premises → less honest
   - **Repetition**: reward-positive phrases repeated
   - **Out-of-distribution responses**: bizarre generations that confuse the RM
3. **Mitigations**: KL constraint (the main defense), length normalization (SimPO), iterative RM training, diverse preference data.

**Length bias:**
4. **The most common reward-hacking failure**. Reward models trained on human-preferred pairs learn to prefer length because *humans rate longer responses higher on average*.
5. **Why humans prefer longer**: longer responses *seem* more thorough and confident; rated higher even when they're not actually better.
6. **SimPO's fix**: normalize log-probabilities by sequence length. Removes the length-scaling advantage.

**Mode collapse:**
7. **The policy converges to a narrow distribution** of high-reward responses. Loses diversity.
8. **Bad for**: creative writing, brainstorming, anything benefiting from variety.
9. **Mitigations**: stronger KL, fewer training steps, lower learning rate.

**Required callout** — type `aside`: MC5 from research.md. "Reward models are accurate." **They're noisy proxies.** Typical RMs achieve only 65-75% agreement with held-out human preferences. The remaining 25-35% is noise. Without KL constraints, the policy exploits this noise. Be skeptical of any claim that the RM "captures human preferences."

**Connection forward:** Section 9 wraps up with the modern stack.

### Section 9: The modern post-training stack

**Heading:** `## The modern post-training stack`
**Word target:** ~300

**Teaching beats:**
1. **The current standard recipe** (late 2024 / early 2025):
   - **Base model** (Ch 7-10): pre-trained on web text, code, etc.
   - **SFT** (Ch 13): on curated instructions
   - **Preference optimization** (this chapter): typically DPO; sometimes PPO at frontier scale; sometimes iterative DPO with online preference collection
   - **Optional RLVR**: for reasoning-focused models, large-scale RL on verifiable tasks
   - **Optional PEFT** (Ch 15): for domain-specific behavior
   - **Optional distillation** (Ch 16): for smaller models
2. **Most production models** stop at preference optimization (step 3).
3. **Frontier reasoning models** (o1, DeepSeek-R1, Gemini Thinking) add RLVR (step 4).
4. **Open-source 7B-class models in 2024-2025**: the dominant recipe was **SFT + DPO** (Zephyr's). Late 2024 saw a shift toward **SFT + DPO + light RLVR** following DeepSeek-R1.

**Sample close** (rewrite in chapter voice):

> Preference optimization is the algorithmic centerpiece of post-training. SFT taught the model to *respond*; preference methods teach it to respond *well*. Classical RLHF (reward model + PPO + KL constraint) was the founding recipe; DPO simplified the math (and the implementation) by deriving a supervised loss equivalent to the RL objective; DPO variants explored the design space; RLVR opened a new frontier by extending RL to verifiable tasks where reasoning *emerges* from reward maximization.
>
> What's next in Phase 11: **Chapter 15** covers PEFT — LoRA, adapters, and other parameter-efficient methods that make full fine-tuning unnecessary for most teams. **Chapter 16** covers distillation — compressing a fully-trained model into a smaller one. Most production teams don't reach steps 15 and 16; they're optimizations that build on the foundations covered in Ch 13-14. Together, Phase 11 gives you the full post-training toolkit — from "I have a pre-trained model" to "I have a useful, aligned, possibly reasoning chatbot."

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 14, slug: 'ch14-alignment', title: 'Preference Optimization: RLHF, DPO, RLVR', partNum: 5, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch14-alignment/index.astro && rm src/pages/ch14-alignment/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch14-alignment/`** renders with:
   - Chapter eyebrow ("Chapter 14") + h1 + description
   - 9 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 5, 7)
   - 2 `<WidgetFrame>` placeholders (sections 3 and 5)
   - Labeled equation `<Equation label="14.dpo">` in section 5
   - At least 6 callouts (targeting MC2, MC3, MC5, MC6, MC8 from research.md, plus the two-topic note in section 1 and the PPO-cost aside in section 3)
3. **Sidebar:** Ch 1-13 published; Ch 14 active (draft); Ch 15-30 dimmed
4. **Landing page CTA:** still "Start with Chapter 1 →"
5. **Prev/next nav at bottom of Ch 14:** prev = Ch 13 (active); next = Ch 15 (disabled)
6. **TOC on Ch 14** populates with all 9 sections plus subsections
7. **Word count:** chapter prose between 4500 and 5500 words
8. **`npm run typecheck`** passes
9. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 64 and 65 own them.
- ❌ **Do not write exercises.** Session 66 owns.
- ❌ **Do not flip Ch 14's status to `'published'`.** Session 66 owns.
- ❌ **Do not derive PPO in detail.** Mention it; sketch clip ratio; cite Schulman et al.
- ❌ **Do not derive GAE or value functions.** Out of scope.
- ❌ **Do not enumerate every DPO variant.** Cover 4 (IPO, KTO, ORPO, SimPO).
- ❌ **Do not deep-dive into Constitutional AI** (Anthropic) or RLAIF. Worth a brief mention if relevant; not full coverage.
- ❌ **Do not modify Ch 1-13.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch14-alignment/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch14-alignment/index.astro 2>/dev/null || true
git commit -m "session 63: Ch 14 prose — RLHF, DPO, RLVR (Phase 11 algorithmic centerpiece)"
git push origin main
```

---

## Notes for the session author

**On voice — this chapter is exciting:**
Where Ch 13 was "cheap and cheerful" and grounded, Ch 14 has genuinely beautiful mathematical results (the DPO derivation) and a major recent breakthrough (RLVR / DeepSeek-R1). **Don't suppress the excitement, but don't oversell either.** The voice should be: "here's something elegant" rather than "this is going to change everything."

**On the DPO derivation being the chapter's pedagogical centerpiece:**
Section 5 should walk through the derivation step-by-step. Don't just present the result — show how it's derived. Four steps:
1. Closed-form optimal policy
2. Solve for reward (the policy log-ratio)
3. Substitute into Bradley-Terry (Z(x) cancels)
4. Get the DPO loss (a supervised loss)

The reader who follows this should walk away thinking: "DPO isn't magic — it's the *mathematical consequence* of the RLHF objective."

**On the two-topic framing:**
Section 1's callout explicitly signals: "sections 2-4 are classical RLHF; sections 5-7 are modern alternatives." This helps the reader navigate the two-topic structure. The transition between sections 4 (KL constraint) and 5 (DPO) is the structural pivot.

**On RLVR being honest about its newness:**
Section 7 should be honest: RLVR at frontier scale is *very* new (DeepSeek-R1 was January 2025; o1 was September 2024). The current consensus is rapidly evolving. **State what's known; don't claim more.** Reasoning emergence is well-documented; the long-term implications are unclear.

**On the widget placements:**
- **Marquee (Preference Learning Pipeline)**: section 3 — when classical RLHF is introduced. The widget shows both RLHF and DPO paths side-by-side, so it sets up section 5's DPO content.
- **Secondary (DPO Loss Landscape)**: section 5 — right alongside the DPO derivation. Reader sees the loss surface visually after seeing the equation.

**On the 3 runnable code blocks:**
- Section 2 (Bradley-Terry): RM loss; reader sees the basic preference learning math
- Section 5 (DPO loss): the full DPO loss with implicit rewards; reader sees the supervised nature
- Section 7 (verifiable reward): RLVR-style verifier; reader sees that "no human RM needed" is real

3 blocks. Slightly higher density than other chapters because the chapter is longer (9 sections vs 8), but proportional.

**On the modern post-training stack section closing the chapter:**
Section 9 should provide a clear summary: SFT → preference opt → optional RLVR → optional PEFT → optional distillation. Reader knows where Ch 14 fits in the broader pipeline and what's coming next (Ch 15 PEFT, Ch 16 distillation).

**Pedagogical claim of the chapter:**
"Preference optimization turns an SFT'd model into a *good* model. Classical RLHF does this via a reward model and PPO. DPO simplifies it to supervised learning via a beautiful derivation: the KL-regularized RL objective has a closed-form solution that reparameterizes into a sigmoid log-likelihood on policy log-ratios. RLVR extends RL to verifiable tasks, where reasoning capabilities emerge from reward maximization. Together these three methods cover the algorithmic space of modern post-training."

**This chapter is dense.** 9 sections, 5400+ words, two widgets, three runnables, several derivations. Budget care. The 5-file cadence gives Ch 14 the room it needs.

**Phase 11 progress after this session**: Ch 13 done, Ch 14 in progress (draft). After session 66 closes Ch 14, only Ch 15 (PEFT) and Ch 16 (distillation) remain in Phase 11. Both single-topic; both 4-file cadence. Pace through them after Ch 14.

Build with care.
