# Chapter 14 — Preference optimization: RLHF, DPO, and RLVR: research

> Curated source material for Chapter 14's build sessions. **The algorithmic centerpiece of Phase 11 (Post-training).** Where Ch 13 (SFT) taught the model *format* (be a chatbot), Ch 14 teaches it *quality* (be a *good* chatbot — helpful, honest, harmless, aligned with human preferences). This chapter covers the family of methods that turn an SFT'd model into something humans prefer: classical **RLHF** (Reward Model + PPO), **DPO** (Direct Preference Optimization — the math trick that skips RL), the DPO variant zoo (**IPO, KTO, ORPO, SimPO**), and the recent **RLVR** breakthrough (RL with Verifiable Rewards — what powered DeepSeek-R1 and OpenAI o1). The chapter is dense: this is where modern post-training gets *interesting*. Two-topic chapter (classical RLHF + modern DPO/RLVR); uses the **5-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Preference Optimization: RLHF, DPO, RLVR

**Premise:** SFT teaches a model to *respond*. It doesn't teach the model to respond *well*. After SFT, the model can produce confidently wrong answers, refuse helpful queries, fail to refuse harmful ones, and generate low-quality responses. Preference optimization addresses this gap: learn from data that says "humans prefer response A over response B" and optimize the model to produce more A-like outputs. The result is the alignment step that turned GPT-3 into ChatGPT.

**Three families of methods covered:**

1. **Classical RLHF** (Christiano et al. 2017; InstructGPT 2022): train a reward model on human preference pairs, then use PPO to optimize the policy against the reward (with a KL constraint to the SFT model).
2. **DPO and variants** (Rafailov et al. 2023): a clever derivation shows that the optimal policy can be trained directly on preference pairs without a separate reward model or RL. **A pure supervised objective.** Variants: IPO, KTO, ORPO, SimPO.
3. **RLVR — RL with Verifiable Rewards** (DeepSeek-R1 2024; o1 system card 2024): when the reward signal is *objectively verifiable* (math correctness, code execution, theorem proofs), you don't need a learned reward model. RL bootstraps reasoning behavior — chain-of-thought emerges from reward maximization.

**Out of scope (other chapters):**
- SFT (Ch 13)
- PEFT / LoRA for fine-tuning (Ch 15)
- Distillation (Ch 16)
- Pre-training (Ch 7-10)

**In scope and locked:**
- **Why SFT alone isn't enough** — the alignment gap
- **Preference data**: pairwise comparisons; ranking; chosen vs rejected
- **Bradley-Terry model**: turning preferences into a probability of preference
- **Reward modeling**: training a scalar reward function from preferences
- **Classical RLHF**: PPO with reward model + KL constraint
- **The KL constraint**: why it matters, what it does, what happens without it
- **DPO derivation**: the closed-form solution to KL-regularized RL turns into a supervised loss
- **DPO variants**: IPO (regularized DPO), KTO (single-rating), ORPO (no reference), SimPO (ref-free)
- **RLVR**: RL with verifiable rewards; reasoning emergence
- **Practical issues**: reward hacking, length bias, mode collapse, scaling laws
- **The modern post-training stack**: SFT → DPO (or PPO) → optionally RLVR for reasoning

**Suggested chapter structure** (9 sections):

1. The setup — SFT teaches format, not quality (~400 words)
2. Preference data and the Bradley-Terry model (~600 words)
3. Classical RLHF — reward model + PPO (~700 words)
4. The KL constraint (~400 words)
5. DPO — direct preference optimization (~900 words — central topic, includes derivation)
6. DPO variants — IPO, KTO, ORPO, SimPO (~500 words)
7. RLVR — RL with verifiable rewards (~700 words — important emerging topic)
8. Practical issues (~400 words)
9. The modern post-training stack (~300 words)

Target: ~4900 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Christiano et al. 2017 — "Deep Reinforcement Learning from Human Preferences"
- **arXiv:** [1706.03741](https://arxiv.org/abs/1706.03741)
- **What it contributed:** **The original RLHF paper.** Applied to Atari and MuJoCo. Showed that you can train RL agents from human comparisons of trajectories without needing a hand-engineered reward.
- **For the chapter:** historical reference. RLHF predates language models.

### Stiennon et al. 2020 — "Learning to summarize with human feedback"
- **arXiv:** [2009.01325](https://arxiv.org/abs/2009.01325)
- **What it contributed:** Applied RLHF to language models for the first time at scale. Summarization task. Showed RLHF dramatically improved summary quality over SFT.
- **For the chapter:** first language-RLHF paper.

### Ouyang et al. 2022 — "Training language models to follow instructions with human feedback" (InstructGPT)
- **arXiv:** [2203.02155](https://arxiv.org/abs/2203.02155)
- **What it contributed:** **InstructGPT** — the canonical three-stage recipe: SFT → reward modeling → PPO. The paper that defined modern post-training. ChatGPT is based on this recipe.
- **For the chapter:** the foundational citation for classical RLHF.

### Schulman et al. 2017 — "Proximal Policy Optimization Algorithms" (PPO)
- **arXiv:** [1707.06347](https://arxiv.org/abs/1707.06347)
- **What it contributed:** **PPO** — the RL algorithm RLHF uses. Clipped surrogate objective that prevents catastrophic updates. Robust, simple, hyperparameter-friendly.
- **For the chapter:** the algorithm. Don't deep-dive into PPO mechanics; cite and sketch.

### Rafailov et al. 2023 — "Direct Preference Optimization: Your Language Model is Secretly a Reward Model"
- **arXiv:** [2305.18290](https://arxiv.org/abs/2305.18290)
- **What it contributed:** **DPO** — the algorithm that revolutionized open-source post-training. Showed that the KL-regularized RL objective has a closed-form solution that reparameterizes into a supervised loss. **No reward model, no PPO, no on-policy sampling needed.** Just gradient descent on preference pairs.
- **For the chapter:** the central reference. **The chapter's pedagogical centerpiece.**

### Azar et al. 2023 — "A General Theoretical Paradigm to Understand Learning from Human Preferences" (IPO)
- **arXiv:** [2310.12036](https://arxiv.org/abs/2310.12036)
- **What it contributed:** **IPO** — Identity Preference Optimization. Adds regularization to DPO; better behavior when preference data is deterministic.
- **For the chapter:** brief reference in variant zoo.

### Ethayarajh et al. 2024 — "KTO: Model Alignment as Prospect Theoretic Optimization"
- **arXiv:** [2402.01306](https://arxiv.org/abs/2402.01306)
- **What it contributed:** **KTO** — works with binary "good"/"bad" ratings instead of pairwise comparisons. More practical for some data-collection setups.
- **For the chapter:** brief reference in variant zoo.

### Hong et al. 2024 — "ORPO: Monolithic Preference Optimization without Reference Model"
- **arXiv:** [2403.07691](https://arxiv.org/abs/2403.07691)
- **What it contributed:** **ORPO** — combines SFT and preference optimization into one stage; no reference model required.
- **For the chapter:** brief reference in variant zoo.

### Meng et al. 2024 — "SimPO: Simple Preference Optimization with a Reference-Free Reward"
- **arXiv:** [2405.14734](https://arxiv.org/abs/2405.14734)
- **What it contributed:** **SimPO** — DPO without a reference model; uses length-normalized log probabilities. Competitive with DPO at lower complexity.
- **For the chapter:** brief reference in variant zoo.

### DeepSeek-AI 2025 — "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning"
- **arXiv:** [2501.12948](https://arxiv.org/abs/2501.12948)
- **What it contributed:** **RLVR breakthrough at scale.** DeepSeek-R1-Zero used pure RL (no SFT) on verifiable math/code problems and produced strong reasoning ability. Long chain-of-thought emerged. DeepSeek-R1 added SFT cold start for stability. **The first open-weights model with frontier reasoning.**
- **For the chapter:** central reference for RLVR. The 2024-2025 turning point.

### OpenAI 2024 — "Learning to Reason with LLMs" (o1 release post + system card)
- **Blog:** [openai.com/index/learning-to-reason-with-llms](https://openai.com/index/learning-to-reason-with-llms/)
- **What it contributed:** **o1** — first frontier reasoning model. Trained with large-scale RL to think before answering. Achieved dramatic gains on math, code, and PhD-level science. Set the agenda that DeepSeek-R1 followed.
- **For the chapter:** central reference. The model that proved RLVR at frontier scale.

### Tunstall et al. 2023 — "Zephyr: Direct Distillation of LM Alignment"
- **arXiv:** [2310.16944](https://arxiv.org/abs/2310.16944)
- **What it contributed:** **Zephyr-7B** — SFT + DPO recipe. Demonstrated that the open-source post-training stack (SFT → DPO) produces ChatGPT-3.5-class 7B models.
- **For the chapter:** reference for the modern open recipe.

---

## Core derivations

### Derivation 1: The Bradley-Terry preference model

Given a context $x$ and two responses $y_w$ (winner / chosen) and $y_l$ (loser / rejected), the **Bradley-Terry model** posits that the probability of preferring $y_w$ is:

$$P(y_w \succ y_l \mid x) = \frac{\exp(r(x, y_w))}{\exp(r(x, y_w)) + \exp(r(x, y_l))} = \sigma(r(x, y_w) - r(x, y_l))$$

where $r(x, y)$ is the (unobserved) reward function and $\sigma$ is the sigmoid. The reward model is *learned* such that its scores produce probabilities matching the observed preferences.

**Why this works**: the difference in rewards $r(x, y_w) - r(x, y_l)$ corresponds to the log-odds of preference. A reward difference of $1$ means ~73% preference probability; $2$ means ~88%.

**Training the reward model** is a standard binary cross-entropy task:
$$\mathcal{L}_{\text{RM}} = -\mathbb{E}_{(x, y_w, y_l) \sim \mathcal{D}} [\log \sigma(r(x, y_w) - r(x, y_l))]$$

### Derivation 2: The RLHF objective

Given a learned reward function $r(x, y)$, classical RLHF optimizes:

$$\max_{\pi_\theta} \mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_\theta(\cdot \mid x)} [r(x, y)] - \beta \cdot D_{KL}(\pi_\theta(\cdot \mid x) \,\|\, \pi_{\text{ref}}(\cdot \mid x))$$

In words: maximize expected reward, subject to a KL penalty keeping $\pi_\theta$ close to a reference policy $\pi_{\text{ref}}$ (typically the SFT model).

**Why the KL penalty matters**:
1. **Prevents reward hacking**: the reward model is an imperfect proxy. Without constraint, the policy finds out-of-distribution responses that score high on the (imperfect) RM but are actually bad.
2. **Preserves base capabilities**: the SFT model has useful knowledge from pre-training. Drifting too far loses it.
3. **Provides regularization**: KL penalty regularizes against degenerate solutions (e.g., always outputting the same response).

In practice, the maximization is done via **PPO** (Schulman et al. 2017) — a clipped policy-gradient algorithm that prevents large updates.

### Derivation 3: The DPO trick

DPO (Rafailov et al. 2023) starts from the observation that the KL-regularized RL objective has a closed-form optimal solution:

$$\pi^*(y \mid x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y \mid x) \exp\left(\frac{1}{\beta} r(x, y)\right)$$

where $Z(x)$ is the partition function. **Solving for $r$:**

$$r(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)$$

The reward equals the log-ratio of optimal-to-reference policy, plus a context-only term.

**Substituting into the Bradley-Terry model**:

$$P(y_w \succ y_l \mid x) = \sigma\left(\beta \log \frac{\pi^*(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi^*(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right)$$

The $Z(x)$ terms cancel! The probability of preference is a function of the policy log-ratios alone.

**The DPO loss** then directly maximizes this log-likelihood over the preference data:

$$\boxed{\mathcal{L}_{\text{DPO}}(\pi_\theta) = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma\left(\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right) \right]}$$

**This is a supervised loss.** Take preference pairs, compute log-probabilities under both $\pi_\theta$ (current) and $\pi_{\text{ref}}$ (frozen reference), compute the sigmoid log-likelihood, backprop. **No reward model. No RL. No on-policy sampling.**

The trick is that the "implicit reward" of DPO is $\beta \log(\pi_\theta(y \mid x) / \pi_{\text{ref}}(y \mid x))$ — the policy itself encodes the reward.

```mdx
<Equation label="14.dpo">
$$\mathcal{L}_{\text{DPO}}(\pi_\theta) = -\mathbb{E} \left[ \log \sigma\left(\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right) \right]$$
</Equation>
```

### Concept 4: DPO variants

The DPO success spawned many variants:

**IPO** (Identity Preference Optimization, Azar et al. 2023): regularized DPO; performs better when preference probabilities are deterministic (i.e., raters are always consistent). Adds a quadratic penalty to the loss.

**KTO** (Kahneman-Tversky Optimization, Ethayarajh et al. 2024): works with binary good/bad ratings instead of pairwise comparisons. Easier to collect — humans rate single responses rather than choose between pairs. Uses prospect-theoretic value function.

**ORPO** (Monolithic Preference Optimization, Hong et al. 2024): combines SFT and DPO into a single training stage. No reference model needed. Useful when starting from a base model (skipping the separate SFT phase).

**SimPO** (Simple Preference Optimization, Meng et al. 2024): drops the reference model entirely. Uses length-normalized log probabilities directly. Competitive with DPO at lower complexity.

The variants share the spirit of DPO (preference optimization as supervised learning) but differ in:
1. **Reference policy use** (DPO/IPO use; ORPO/SimPO don't)
2. **Data format** (DPO/IPO use pairs; KTO uses individual ratings)
3. **Loss function** (sigmoid vs hinge vs square-error variants)
4. **Length handling** (SimPO normalizes by length to combat length bias)

**Which to use?** As of late 2024-2025: DPO is the default; SimPO is gaining traction; KTO is useful when only single-response ratings are available.

### Concept 5: RLVR — RL with Verifiable Rewards

Classical RLHF uses a *learned* reward model that approximates human preferences. The reward signal is noisy and imperfect.

**For some tasks the reward signal is *objective***:
- **Math**: is the final answer correct? (Check against ground truth.)
- **Code**: do the tests pass? (Execute and check.)
- **Theorem proving**: is the proof valid? (Run a verifier.)
- **Game playing**: did you win? (Check the score.)

**RLVR uses these *verifiable* rewards directly** — no learned reward model required. The reward function is a verifier (a calculator, a compiler, a theorem prover).

**DeepSeek-R1** (Jan 2025) demonstrated this at frontier scale. The full DeepSeek-R1 recipe:
1. Start with a base model (DeepSeek-V3-Base)
2. **Cold-start SFT** on a small high-quality reasoning dataset
3. **Large-scale RLVR** on math + code with verifiable rewards
4. **Rejection sampling** to generate higher-quality CoT data
5. **Final SFT + RLVR** on the augmented data

**The emergent behavior**: as RL training progresses, the model learns to **think longer** — chain-of-thought traces grow naturally. The model discovers that **showing its work increases reward**, so it does. No one programmed this; it emerged from reward maximization.

**DeepSeek-R1-Zero**: a variant that skipped the cold-start SFT entirely. Pure RL on a base model. Worked — but unstable, with language-mixing and readability issues. The cold-start SFT in DeepSeek-R1 stabilized this without losing the reasoning gain.

**OpenAI's o1** (Sep 2024) followed a similar recipe at frontier scale. Limited public details but clearly RL-driven reasoning emergence on verifiable tasks.

**The conceptual shift**: RLVR demonstrates that **reasoning can be *learned* via RL**, not just imitated. This is potentially a much more scalable paradigm than collecting human-curated reasoning demonstrations — you just need a way to verify the final answer.

**Where RLVR works well**:
- Math (final answer checkable)
- Code (tests pass / compile)
- Formal proofs (theorem prover checks validity)
- Structured tasks (specific output format requirements)

**Where RLVR doesn't apply**:
- Open-ended generation (creative writing, advice, conversation) — no objective verifier
- Tasks where the "correct answer" is subjective
- Tasks requiring nuanced judgment

For non-verifiable tasks, classical RLHF / DPO with human or model-graded rewards remains necessary.

### Concept 6: Practical issues

**Reward hacking**: the policy finds responses that score high on the reward model but are actually bad. Manifestations:
- **Length hacking**: longer responses often score higher in RMs (reward model length bias). Without length normalization, models become verbose.
- **Sycophancy**: agreeing with the user's premise even when wrong (RMs learn to reward agreement).
- **Repetition**: repeating reward-positive phrases.
- **Out-of-distribution responses**: policy finds bizarre generations that confuse the RM into high scores.

**Mitigations**: stronger KL constraint, length normalization (SimPO), iterative reward model training, diverse preference data.

**Length bias**: the most common reward-hacking failure. Default DPO and PPO can produce models that respond verbosely because verbose responses tended to be preferred during preference collection. **SimPO** explicitly addresses this with length-normalized log probabilities.

**Mode collapse**: the policy converges to a narrow distribution of high-reward responses. Loses diversity. Bad for creative tasks. Mitigated with KL constraint, lower learning rates, fewer training steps.

**Reward model overfitting**: with limited preference data (~10K-100K pairs), the RM can overfit. Symptoms: high preference accuracy on training set but degraded final policy quality. Mitigated with regularization, ensemble RMs, careful hyperparameter tuning.

**Scaling laws**: RLHF/DPO benefit from more preference data, but with diminishing returns. ~10K-100K preference pairs typically suffice. Beyond that, returns saturate.

### Concept 7: The modern post-training stack

The current (late-2024 / early-2025) standard recipe for production chat models:

1. **Base model** (pre-training, possibly with MoE)
2. **SFT** (Ch 13) on a curated instruction dataset
3. **Preference optimization** (this chapter): typically DPO; sometimes PPO at scale (frontier labs); sometimes iterative DPO with online preference collection
4. **Optional: RLVR** (this chapter): for reasoning-focused models, large-scale RL on math/code with verifiable rewards
5. **Optional: PEFT** (Ch 15): if you want to add domain-specific behavior cheaply
6. **Optional: Distillation** (Ch 16): if you want a smaller model

**Most production models** stop at step 3. Frontier reasoning models (o1, DeepSeek-R1, Gemini Thinking) add step 4.

**For open-source 7B-class models**: the dominant recipe in 2024-2025 was **SFT + DPO** (Zephyr's recipe). Late 2024 saw a shift toward **SFT + DPO + light RLVR** following DeepSeek-R1's release.

---

## Glossary

- **RLHF (Reinforcement Learning from Human Feedback)**: classical preference optimization via reward model + PPO.
- **DPO (Direct Preference Optimization)**: preference optimization as supervised learning, without explicit reward model or RL.
- **RLVR (RL with Verifiable Rewards)**: RL where rewards come from an objective verifier (compiler, theorem prover) rather than a learned RM.
- **Preference data / pairwise data**: a dataset of $(x, y_w, y_l)$ tuples where $y_w$ is preferred over $y_l$.
- **Bradley-Terry model**: a probabilistic model of pairwise preferences.
- **Reward model (RM)**: a learned model $r(x, y) \to \mathbb{R}$ that scores responses.
- **Policy ($\pi$)**: the model itself, viewed as a distribution over responses.
- **Reference policy ($\pi_{\text{ref}}$)**: a frozen baseline (usually the SFT model) the trained policy stays close to.
- **KL constraint**: penalizes the policy for drifting too far from the reference.
- **PPO (Proximal Policy Optimization)**: an RL algorithm with clipped surrogate objective; used in RLHF.
- **$\beta$ (beta)**: controls KL constraint strength (in PPO) or temperature (in DPO). Lower = more conservative.
- **Implicit reward**: in DPO, the policy log-ratio $\beta \log(\pi_\theta / \pi_{\text{ref}})$ acts as a reward signal without being explicitly trained.
- **Chosen / rejected**: preference data terminology. Chosen = preferred; rejected = dispreferred.
- **Reward hacking**: the policy exploits weaknesses in the reward model to score high without being good.
- **Length bias**: tendency of reward models to prefer longer responses.
- **Mode collapse**: policy distribution becomes too narrow.
- **Reasoning emergence**: long chain-of-thought traces emerging from RLVR training.

---

## Pedagogical analogies

### 1. SFT as cooking school; preference optimization as restaurant feedback
SFT teaches you *how to cook* — show the chef recipes, they learn to follow them. **Preference optimization teaches them *which dishes diners prefer*** — show pairs of finished dishes ("guests preferred A over B"), they refine their cooking to produce more A-like dishes.

Best used for: section 1 motivation.

### 2. KL constraint as "don't stray too far from your roots"
Without the KL constraint, the policy can drift arbitrarily far from the SFT model in pursuit of reward. The KL constraint says: "your responses must remain *recognizable* — similar enough to your starting point that we know you haven't been corrupted by reward hacking."

Best used for: section 4 KL constraint.

### 3. DPO as the math trick that lets you skip RL
RLHF: train RM → run PPO → fine-tune policy. Three components, lots of moving parts. DPO: a clever derivation shows the *closed-form solution* to the RL objective is a supervised loss on preferences. **Same destination, simpler path.** The trick: the policy itself can be the reward model.

Best used for: section 5 DPO derivation.

### 4. RLVR as homework with answer keys
You don't need a teacher to grade homework if the answer is checkable — just check it. **For tasks where you can verify the answer** (math, code, proofs), you don't need a human-trained reward model. Run the verifier; reward equals correctness. The model learns through trial and error, exploring solutions and getting rewarded for ones that work.

Best used for: section 7 RLVR.

### 5. Reward hacking as Goodhart's law
"When a measure becomes a target, it ceases to be a good measure." A reward model is a *measure* of human preference; once you optimize against it as a *target*, it stops measuring preferences accurately. The model finds out-of-distribution responses that score high but aren't actually preferred. The KL constraint is the mitigation.

Best used for: section 8 practical issues.

---

## Common misconceptions

### MC1: "RLHF and DPO produce identical results."
**Reality:** mathematically equivalent in the *theoretical limit*; **empirically different** in practice. DPO is more stable and easier to tune, but PPO sometimes achieves higher peak performance with the right hyperparameters. The DPO derivation assumes optimality of the trained policy; in practice this assumption breaks down. **Frontier labs (OpenAI, Anthropic, Google) often still use PPO**; open-source mostly uses DPO. Different trade-offs.

### MC2: "DPO is just RLHF without RL."
**Reality:** it's more subtle. DPO *avoids* the explicit RL loop, reward model, and on-policy sampling — but its loss function encodes the same optimization. **The math is equivalent; the algorithm is different.** DPO works because the policy itself parameterizes the implicit reward; you don't *skip* the optimization, you *reformulate* it.

### MC3: "More RL is always better."
**Reality:** false. **Reward hacking** kicks in past a certain point. The policy starts exploiting RM weaknesses rather than improving genuinely. Length bias appears. Mode collapse can occur. Empirically, RLHF/DPO benefits saturate at ~10K-100K preference pairs; more training doesn't help.

### MC4: "RL is what makes ChatGPT good."
**Reality:** SFT + RL together. **Neither alone produces a strong model.** SFT teaches format; RL aligns with preferences. Without SFT, RL is unstable (no reasonable starting point). Without RL, the model is helpful in format but not reliably high-quality. The combination matters.

### MC5: "Reward models are accurate."
**Reality:** they're noisy proxies for human preferences. **RMs typically achieve 65-75% agreement with held-out human preferences** — far from perfect. The remaining 25-35% is noise the RM gets wrong. KL constraints exist precisely because RMs are imperfect — without them, the policy would exploit RM errors.

### MC6: "Preference data is objective."
**Reality:** humans disagree on preferences. **Inter-rater agreement on preference data is often only 65-75%.** Different raters have different values, contexts, and judgments. Common biases: length bias (longer = preferred), confidence bias (assertive = preferred), formatting bias (lists = preferred). RM training averages over these.

### MC7: "RLVR replaces preference learning."
**Reality:** they serve **different purposes**. RLVR works only for tasks with verifiable answers (math, code, proofs). Open-ended tasks (creative writing, helpful conversation, judgment) still need preference learning. The future likely uses both: RLVR for reasoning capabilities; DPO/RLHF for alignment on open-ended tasks. **Frontier reasoning models (o1, DeepSeek-R1) use both.**

### MC8: "Chain-of-thought is hand-engineered."
**Reality:** in RLVR-trained models, **CoT emerges from RL**. The model discovers that "thinking longer" — generating reasoning steps before the answer — increases reward on verifiable tasks. The behavior is *learned*, not programmed. This is what makes RLVR exciting: capabilities emerge from reward maximization on objective tasks.

---

## Tricky implementation details

### TID1: Reference model in DPO
The reference policy $\pi_{\text{ref}}$ is kept **frozen** during DPO. Its log probabilities are computed once (or with a separate forward pass each step) and used as targets. In practice, this means **two model forward passes per step** — one through $\pi_\theta$, one through $\pi_{\text{ref}}$ — increasing memory and compute. Most implementations load both models, often with the reference at lower precision.

### TID2: Beta in DPO
$\beta$ (often 0.1-0.5 for DPO) controls how aggressively to update. **Too small** ($\beta < 0.05$): rapid drift, model collapses to short responses. **Too large** ($\beta > 1$): minimal learning, policy stays close to reference. Empirically, $\beta = 0.1$ is the default starting point.

### TID3: PPO clip parameter
PPO clips the policy-ratio update at $1 \pm \epsilon$ (typically $\epsilon = 0.2$). Without this clip, large gradient updates cause training instability. Clip too tight ($\epsilon < 0.1$): slow learning. Too loose ($\epsilon > 0.4$): instability.

### TID4: Sequence-level vs token-level rewards
Most reward models score the *entire response*, not individual tokens. PPO/DPO then propagate this single reward across all generated tokens (with discounting in PPO; equally in DPO). **Token-level rewards** would be more sample-efficient but are hard to collect.

### TID5: Length normalization
Naive DPO computes $\log \pi_\theta(y \mid x) = \sum_t \log \pi_\theta(y_t \mid y_{<t}, x)$ — sum of token log-probabilities. **Longer responses have larger absolute log-probs** even if their per-token probability is identical. This induces length bias. **SimPO** addresses this by dividing by sequence length.

### TID6: Reward hacking detection
Watch for: training-set RM accuracy increasing while held-out human preferences degrade; response length exploding; specific phrases appearing repeatedly. Mitigations: stronger KL, length normalization, periodic human evaluation, fresh preference data collection.

### TID7: Iterative DPO
Many production recipes do **iterative DPO**: train DPO; sample new responses from the updated policy; have humans/models rate them; train DPO again. Each iteration improves alignment but requires online preference collection.

### TID8: Cold-start vs RL-from-scratch
DeepSeek-R1-Zero (pure RL on base model) worked but had stability issues. DeepSeek-R1 (cold-start SFT + RL) was more stable. **Conclusion: a small high-quality SFT pass before RL stabilizes training.** Pure-RL is the harder path.

---

## Reference implementations

### Bradley-Terry reward model loss

```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def rm_loss(reward_chosen, reward_rejected):
    """
    Bradley-Terry loss for reward model training.
    reward_chosen:   reward for chosen response, shape (B,)
    reward_rejected: reward for rejected response, shape (B,)
    Goal: maximize P(chosen > rejected) = sigmoid(r_chosen - r_rejected).
    """
    diff = reward_chosen - reward_rejected
    return -np.mean(np.log(sigmoid(diff) + 1e-9))

# Demo
np.random.seed(0)
B = 8
# Train scenario: chosen rewards should be HIGHER than rejected
r_chosen = np.array([1.2, 0.8, 0.5, -0.1, 1.5, 0.3, 0.7, 0.9])
r_rejected = np.array([0.1, -0.5, 0.0, -0.8, 0.7, -0.2, 0.2, 0.4])

loss = rm_loss(r_chosen, r_rejected)
print(f"RM loss with consistent preferences: {loss:.3f}")

# Bad scenario: chosen rewards are LOWER (model is wrong)
loss_bad = rm_loss(r_rejected, r_chosen)
print(f"RM loss with flipped preferences:    {loss_bad:.3f}")

print(f"\nLower loss → model assigns higher reward to chosen responses.")
print(f"Bradley-Terry gives a probability of preference from reward differences.")
```

### DPO loss

```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def dpo_loss(logp_chosen, logp_rejected, logp_ref_chosen, logp_ref_rejected, beta=0.1):
    """
    DPO loss for a batch of preference pairs.
    
    logp_chosen:        log pi_theta(y_w | x), shape (B,)
    logp_rejected:      log pi_theta(y_l | x), shape (B,)
    logp_ref_chosen:    log pi_ref(y_w | x),   shape (B,)
    logp_ref_rejected:  log pi_ref(y_l | x),   shape (B,)
    beta:               temperature
    
    Returns: scalar loss; also "implicit rewards" for diagnostics.
    """
    # Implicit reward = beta * (log pi_theta - log pi_ref)
    r_chosen = beta * (logp_chosen - logp_ref_chosen)
    r_rejected = beta * (logp_rejected - logp_ref_rejected)
    
    # DPO loss: -log sigmoid(r_chosen - r_rejected)
    diff = r_chosen - r_rejected
    loss = -np.mean(np.log(sigmoid(diff) + 1e-9))
    return loss, r_chosen.mean(), r_rejected.mean()

# Demo: simulate a batch of preference pairs
np.random.seed(1)
B = 8
# Reference model assigns equal probability to both
logp_ref_chosen = np.full(B, -10.0)
logp_ref_rejected = np.full(B, -10.0)

# Current policy assigns higher log-prob to chosen (good policy)
logp_chosen_good = np.full(B, -8.0)
logp_rejected_good = np.full(B, -12.0)

# Current policy assigns lower log-prob to chosen (bad policy)
logp_chosen_bad = np.full(B, -12.0)
logp_rejected_bad = np.full(B, -8.0)

loss_good, r_chosen_g, r_rejected_g = dpo_loss(
    logp_chosen_good, logp_rejected_good,
    logp_ref_chosen, logp_ref_rejected, beta=0.1,
)
loss_bad, r_chosen_b, r_rejected_b = dpo_loss(
    logp_chosen_bad, logp_rejected_bad,
    logp_ref_chosen, logp_ref_rejected, beta=0.1,
)

print(f"Good policy (chosen has higher log-prob):")
print(f"  DPO loss: {loss_good:.3f}")
print(f"  Implicit rewards: chosen={r_chosen_g:.3f}, rejected={r_rejected_g:.3f}")
print(f"\nBad policy (chosen has lower log-prob):")
print(f"  DPO loss: {loss_bad:.3f}")
print(f"  Implicit rewards: chosen={r_chosen_b:.3f}, rejected={r_rejected_b:.3f}")
print(f"\nDPO drives the policy to assign higher prob to chosen, lower to rejected,")
print(f"relative to the frozen reference policy.")
```

### Verifiable reward computation (math problem)

```python
def extract_final_answer(response):
    """Extract the final answer from a model's response."""
    # Look for the last number in the response (simplified)
    import re
    matches = re.findall(r'-?\d+\.?\d*', response)
    if not matches:
        return None
    return float(matches[-1])

def verify_math_answer(response, correct_answer, tolerance=1e-6):
    """RLVR-style verification: check if final answer matches."""
    answer = extract_final_answer(response)
    if answer is None:
        return 0.0   # no answer found
    if abs(answer - correct_answer) < tolerance:
        return 1.0   # correct
    return 0.0       # wrong

# Demo: verify several model responses
problems = [
    {
        "question": "What is 23 + 47?",
        "correct": 70.0,
        "response": "Let me add these: 23 + 47 = 70. The answer is 70.",
    },
    {
        "question": "What is 15 * 8?",
        "correct": 120.0,
        "response": "15 * 8 = 120",
    },
    {
        "question": "What is the area of a circle with radius 3?",
        "correct": 28.274,   # pi * 9
        "response": "Area = pi * r^2 = pi * 9 = 28.27",
    },
    {
        "question": "What is 100 / 4?",
        "correct": 25.0,
        "response": "100 divided by 4 is 27.",   # WRONG
    },
]

print("RLVR-style verifiable reward:\n")
for p in problems:
    reward = verify_math_answer(p["response"], p["correct"])
    marker = "✓" if reward == 1.0 else "✗"
    print(f"{marker} Q: {p['question']}")
    print(f"  Response: {p['response'][:60]}")
    print(f"  Reward: {reward}\n")

print("With verifiable rewards, no human RM is needed — the verifier IS the reward.")
print("DeepSeek-R1 used this approach at scale on math/code to bootstrap reasoning.")
```

---

## Connections to other chapters

- **Ch 8 (Training loop)**: PPO and DPO are training loops. PPO is more complex (multiple forward passes, advantage estimation); DPO is just a different loss on the same loop.
- **Ch 10 (Training infrastructure)**: PPO is significantly more expensive than SFT/DPO. Needs to maintain both policy and reference model in memory; generates and scores rollouts during training. DPO is closer to SFT in cost.
- **Ch 13 (SFT)**: preference optimization runs *after* SFT. SFT produces the reference policy. The KL constraint keeps the policy close to the SFT model.
- **Ch 15 (PEFT)**: most production DPO is LoRA-based, not full fine-tuning. The reference model is the SFT model (full); the trained policy adds LoRA on top.
- **Ch 21+ (Reasoning, Tool use)**: RLVR-trained reasoning models (o1, R1) connect to the reasoning chapter. Tool-use post-training often combines preference learning with verifiable rewards (did the tool call succeed?).

---

## Open questions for the chapter author

### Q1: How much PPO mechanics?
**Recommendation:** brief. Sketch the clipped surrogate objective in 1-2 paragraphs; don't reproduce the full PPO algorithm. Modern open-source uses DPO; PPO mechanics are a specialty topic.

### Q2: How deep on DPO derivation?
**Recommendation:** medium-deep. The derivation is the chapter's pedagogical centerpiece. Walk through: optimal-policy form → solve for reward → substitute into Bradley-Terry → get DPO loss. Don't try to derive PPO theory.

### Q3: How many DPO variants to cover?
**Recommendation:** 4 (IPO, KTO, ORPO, SimPO). Brief paragraph each. Don't enumerate every paper — there are too many. The four chosen are the most cited and conceptually distinct.

### Q4: RLVR depth?
**Recommendation:** prominent. RLVR is the 2024-2025 breakthrough; it deserves a full section. Cover DeepSeek-R1's recipe in detail; cite o1; explain why "reasoning emerges from reward maximization." This is the most exciting recent development in post-training.

### Q5: Widget candidates
1. **Preference Learning Pipeline visualizer (marquee):** show the data flow from preference pair → reward model → policy update. Compare RLHF (via RM) and DPO (direct) paths. **Recommended marquee.**
2. **DPO Loss Landscape (secondary):** interactive 2D heatmap showing DPO loss as a function of (chosen logp diff, rejected logp diff). Slider for $\beta$. Reader sees how the loss responds to policy changes. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 14 is a **two-topic chapter** (classical RLHF + DPO/RLVR/modern). Uses the **5-file cadence**.

Planned file layout:
- File 81: research (this)
- File 82: page structure (~600 lines, 9 sections; runnables embedded)
- File 83: Preference Learning Pipeline marquee widget
- File 84: DPO Loss Landscape secondary widget
- File 85: exercises + closeout

Files 86-87 from original BUILD_ORDER absorbed.

**Pedagogical outcomes for the reader.** After Ch 14, the reader should be able to:
1. State the Bradley-Terry preference model
2. Sketch the classical RLHF recipe (RM + PPO + KL constraint)
3. Explain what the KL constraint does and why it's necessary
4. Derive (or follow) the DPO loss from the KL-regularized RL objective
5. Name 2-3 DPO variants and what they change
6. Distinguish RLHF (learned RM), DPO (no RM), and RLVR (verifiable RM)
7. Explain how reasoning emerges in RLVR-trained models
8. List common practical pitfalls (reward hacking, length bias)
9. Identify which method to use for a given task

Nine outcomes. Exercises hit outcomes 1 (Bradley-Terry), 4 (DPO), 6 (RLVR vs DPO), 8 (reward hacking detection).

**Two-topic justification:** RLHF (classical) and modern DPO/RLVR are *conceptually* and *algorithmically* distinct. Classical RLHF is RL with a learned reward; DPO is supervised learning that recovers the same optimum; RLVR is RL with objective rewards. Conflating them obscures the key insights. Treating them separately within one chapter (with the bridge being "they all optimize for preferences") is the right organization.

**This chapter is Phase 11's algorithmic centerpiece.** Where Ch 13 was practical engineering, Ch 14 introduces *new objectives* — preference data, reward models, RL. The reader will see the alignment side of post-training. **Density is high; budget care.**

**The DeepSeek-R1 / o1 moment**: late 2024 - early 2025 saw RLVR demonstrate that reasoning can be *learned* via RL on verifiable tasks. This is the most exciting recent development; section 7 should reflect that. Open-source caught up to closed-source on reasoning specifically because RLVR works.

**Tonal framing**: this chapter is *exciting* — the algorithmic ideas (DPO's derivation, RLVR's reasoning emergence) are genuinely beautiful. Don't suppress the excitement, but don't oversell either. Be honest: RLHF is still the harder path; DPO is the easier path; RLVR opens a new frontier for reasoning-capable models.
