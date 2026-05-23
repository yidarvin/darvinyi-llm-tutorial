# Session 111 — Chapter 25 page structure

> First chapter session for Chapter 25 ("Interpretability"). **The middle chapter of Phase 14's discipline arc.** Where Ch 24 (Safety) covered what we want the model to do, this chapter covers what the model is actually computing inside. Eight sections walking from "the interpretability question" → linear probes (secondary widget here) → polysemanticity and superposition → sparse autoencoders (marquee widget here) → mechanistic interpretability and circuits → causal interventions → current state of the field → connection to Ch 26 (Evaluation). Single-topic chapter; uses the **4-file cadence**. **The chapter that puts a microscope on alignment.**

---

## Read first (in this order)

1. **`research/ch25-interpretability/research.md`** — the source material. Every section, equation, code snippet, and misconception traces back to a corresponding entry there.
2. **`context/PROJECT_OVERVIEW.md`** — for tone, voice, audience
3. **`prompts/chapters/ch24-safety/session-107-page-structure.md`** — for Phase 14's tonal conventions; this chapter continues that voice
4. **`prompts/chapters/ch23-multimodal/session-103-page-structure.md`** — for the recent page structure pattern

If anything contradicts the research file, the research file wins.

---

## Goal

Produce a full `index.mdx` Chapter 25 page. By end of session:

- `src/pages/ch25-interpretability/index.mdx` exists with full prose, equations, code blocks, and two `<WidgetFrame>` placeholders
- `src/pages/ch25-interpretability/index.astro` is **deleted** if it existed
- `src/lib/chapters.ts` has Ch 25's status flipped from `'planned'` to `'draft'`
- The chapter renders at `/ch25-interpretability/` with sidebar showing Ch 25 active, prev/next nav linking to Ch 24 (active) and Ch 26 (disabled)

**Tonal note:** Ch 25 is **empirical research with operational honesty.** Interpretability is **making real progress but is not a solved science.** Concrete numbers (probe accuracies 80-95%; millions of SAE features extracted from Claude 3 Sonnet; ~25 attention heads in the IOI circuit) and **honest open problems** (coverage, scale, automation, verification). **Anthropic's SAE work** is the modern reference — the chapter centers it without overpromising. **No philosophical drift** — engineering and methodology only.

**Phase 14 middle-chapter position**: Ch 24 covered "what we want;" Ch 25 covers "what's actually there;" Ch 26 will cover "how to measure both." Section 8 explicitly bridges to Ch 26.

**Chapter cadence:** Ch 25 uses the **4-file cadence** (single-topic chapter).

---

## Inputs

State of the repo after session 109 (Ch 24 complete):

- Ch 1-24 all `'published'`
- `research/ch25-interpretability/research.md` exists
- `src/lib/chapters.ts` has Ch 1-24 `'published'`, Ch 25-30 `'planned'`
- No `src/pages/ch25-interpretability/index.mdx` yet

---

## Deliverables

1. **Create** `src/pages/ch25-interpretability/index.mdx` — full chapter prose with widget placeholders
2. **Delete** `src/pages/ch25-interpretability/index.astro` if it existed
3. **Update** `src/lib/chapters.ts` — change Ch 25's `status` from `'planned'` to `'draft'`

**Do not modify** any other file. Earlier chapters and widgets are sealed.

---

## Detailed spec

### Frontmatter

```mdx
---
layout: ../../layouts/ChapterLayout.astro
slug: ch25-interpretability
description: Interpretability — the discipline of opening up trained LLMs and reading what's inside. From the foundational technique (linear probes — train a tiny classifier on hidden states), through the polysemanticity problem (one neuron, many concepts) and the superposition explanation, to sparse autoencoders as a path through superposition (Anthropic's Towards Monosemanticity and Scaling Monosemanticity), mechanistic interpretability and circuits (induction heads, IOI circuit), causal interventions (logit lens, activation patching, ROME), and the current state of a rapidly-evolving research field. The middle chapter of Phase 14 — where safety asks "what we want," interpretability asks "what's actually there," and Ch 26 will ask "how do we measure both."
---
```

### Imports

```mdx
import { Callout, Equation, EqRef, Figure, WidgetFrame } from '@components/content';
import { RunnableCode } from '@components/code';
```

### Chapter opening

`ChapterLayout` renders the eyebrow + h1 + description automatically. The MDX file's first content is 3 short paragraphs (~280 words) of opening.

**Sample opening** — rewrite in chapter voice:

> Chapter 24 covered safety from the outside in: alignment training, refusal calibration, red-teaming, the helpful-vs-harmless trade-off. **All of those techniques operate on model behavior.** But behavior is one signal; the model's internals are another. **Interpretability is the discipline of reading those internals.** Probes that decode concepts from hidden states. Sparse autoencoders that pull apart superposition into monosemantic features. Circuits — small weight subgraphs that implement specific algorithms. Causal interventions that test whether a component truly matters. **The goal is two-fold**: understand what the model is computing, and verify that it's computing what we want.
>
> This is not a settled science. **Interpretability research is empirical and progressing fast** — probes have been around since 2016; the modern SAE breakthrough (Bricken et al., Anthropic) is from 2023; circuit discovery is largely an artisanal craft on small models. **What works today**: linear probes for many concepts (80-95% accuracy on hidden states of frontier models); SAEs scaled to Claude 3 Sonnet with millions of extracted features (Templeton 2024); dozens of identified circuits in transformers including induction heads and indirect-object-identification. **What's open**: coverage (do our methods find all features?), scale (most mech-interp work is on small models), and automation (interpreting features still requires humans).
>
> **Why interpretability matters for safety**: sleeper agents (Hubinger 2024, mentioned in Ch 24) demonstrated that behavioral safety training can leave invisible backdoors. **Interpretability is the only known route to catch these.** For engineers, interpretability tools are increasingly used in production — Anthropic's monitoring, OpenAI's interp team, deployed feature-clamping. **By the end of this chapter, you'll have the conceptual toolkit and the operational realism.** Then Ch 26 will cover how to measure all of this quantitatively, and Phase 15 will assemble the full stack into agent architectures.

### Section 1: The interpretability question

**Heading:** `## The interpretability question`
**Word target:** ~400
**Sub-headings:** `### Two senses of black-box`, `### Two complementary goals`

**Teaching beats:**

**Two senses of black-box**:
1. **Internal**: we can't easily tell what computations are happening at each layer
2. **External**: we can't always predict what the model will do on new inputs

**Ch 24** addressed external opacity through alignment training and red-teaming. **This chapter addresses internal opacity through interpretability research.**

**Two complementary goals**:

```mdx
<Equation label="25.interpretability-goals">
$$\text{understanding} \;:\; \text{what does the model compute?} \quad\text{vs.}\quad \text{verification} \;:\; \text{is it doing what we want?}$$
</Equation>
```

- **Understanding** — explain what the model is computing
- **Verification** — confirm or refute alignment claims by reading internal state

**Why this matters now**:
1. **Sleeper agents** (Hubinger 2024, Ch 24) demonstrated that behavioral safety training can leave invisible backdoors. **Interpretability is the only known route to catch these.**
2. **Frontier capability** — models that reason, plan, and act are increasingly hard to evaluate by behavior alone. Reading internals provides a second channel.
3. **Trust at scale** — production deployments need confidence that doesn't depend on perfect red-teaming.

**Empirical scale (early 2025)**:
- Probe accuracy for common concepts: 80-95%
- SAE feature count (Templeton 2024): millions extracted from Claude 3 Sonnet
- Known circuits: dozens (induction heads, IOI circuit, copy-suppression heads)
- Active research labs: Anthropic, OpenAI, DeepMind, Apollo Research, EleutherAI

**Required callout** — type `aside`: Interpretability is **the verification arm of safety.** Where Ch 24's techniques shape behavior, interpretability **reads the model's internals to verify the shaping worked.** Both arms matter — behavioral testing and mechanistic verification together — and they answer different questions. This chapter is the working-engineer's introduction to a rapidly-evolving field.

**No code in this section.** Setup.

**Connection forward:** Section 2 introduces the foundational technique — probes.

### Section 2: Probes — reading concepts from hidden states

**Heading:** `## Probes — reading concepts from hidden states`
**Word target:** ~600 — IMPORTANT
**Sub-headings:** `### The probing recipe`, `### What probes tell you (and don't)`, `### Layer-wise feature emergence`

**Teaching beats:**

**The probing recipe** (Alain & Bengio 2016):
1. Run inputs through a frozen LLM
2. Extract hidden states at a chosen layer
3. Train a small classifier (often linear) on those hidden states to predict a concept
4. The classifier's accuracy is your **probe accuracy** for that concept at that layer

**What you can probe for**:
- **Syntactic concepts**: part-of-speech, dependency relations, sentence boundaries
- **Semantic concepts**: sentiment, entity type, factual properties
- **Abstract concepts**: deception, hedging, intent, refusal

**Why linear probes**:
- **Simple**: fewer parameters than the underlying model → less risk of "learning the concept" from scratch
- **Fast**: trains in seconds on a few thousand examples
- **Interpretable**: a linear weight vector is itself a direction in representation space

**What probes tell you**:
- "Is concept X linearly decodable from layer L?" — yes/no with probe accuracy
- "At which layer does concept X emerge?" — train probes at every layer; find where accuracy spikes
- "How does concept X evolve across layers?" — compare probe accuracies layer by layer

**What probes don't tell you**:
- **Causation**: a probe says the concept is *present*, not that the model *uses* it. The model might decode the concept and ignore it downstream.
- **Mechanism**: a probe doesn't tell you *how* the concept is computed; just that it's there.
- **Robustness**: probes work in-distribution; out-of-distribution accuracy can collapse.

**Layer-wise feature emergence** (a robust finding):
- **Early layers**: surface features (token identity, position)
- **Middle layers**: syntactic / semantic features
- **Late layers**: task-specific / output-aligned features

**Required widget placeholder** — Linear Probing Visualizer (secondary, session 143):

```mdx
<WidgetFrame title="Linear probing visualizer" caption="Pick a concept (sentiment, syntax, named entity, refusal); see probe accuracy at each layer of a small transformer. The layer-wise emergence pattern becomes visible — different concepts come online at different depths. Demonstrates the foundational interpretability technique and what it can (and can't) tell you about a model's internals.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 143 (secondary)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing a linear probe in numpy:

```python
import numpy as np

# A linear probe: train logistic regression on hidden-state vectors
# to predict a binary concept.

def train_linear_probe(hidden_states, labels, n_iterations=500, lr=0.01):
    """
    hidden_states: shape (N, d) — N examples of hidden vectors
    labels: shape (N,) — binary 0/1 labels
    Returns: weight vector w of shape (d,) and bias b.
    """
    N, d = hidden_states.shape
    np.random.seed(0)
    w = np.random.randn(d) * 0.01
    b = 0.0
    
    for _ in range(n_iterations):
        logits = hidden_states @ w + b
        probs = 1 / (1 + np.exp(-logits))
        grad_w = hidden_states.T @ (probs - labels) / N
        grad_b = (probs - labels).mean()
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b


def probe_accuracy(hidden_states, labels, w, b):
    preds = (hidden_states @ w + b > 0).astype(int)
    return (preds == labels).mean()


# Mock: pretend we have hidden states from a 256-dim layer
np.random.seed(7)
N, d = 200, 256

# Synthetic concept: a specific direction in the representation
true_direction = np.random.randn(d)
true_direction /= np.linalg.norm(true_direction)

# Generate hidden states; inject the concept for half the examples
hidden_states = np.random.randn(N, d) * 0.5
labels = np.zeros(N, dtype=int)
labels[N // 2:] = 1
hidden_states[N // 2:] += true_direction * 1.5

# Train probe
w, b = train_linear_probe(hidden_states, labels)
acc = probe_accuracy(hidden_states, labels, w, b)
print(f"Probe accuracy: {acc:.2%}")

# How aligned is the probe direction to the true direction?
w_normed = w / np.linalg.norm(w)
alignment = abs(np.dot(w_normed, true_direction))
print(f"Direction alignment: {alignment:.3f}  (1.0 = perfect)")

# Observations:
# - Probe recovers the true direction even from noisy hidden states
# - A linear classifier finding a concept means the concept is linearly decodable
# - But probe accuracy does NOT prove the model uses this information downstream
# - Causal interventions (section 6) are needed to confirm relevance
```

**Required callout** — type `note`: **MC2 from research.md.** "A probe achieving high accuracy means the model uses that information." False. **A probe shows information is decodable; not that the model uses it.** The model might decode the concept and ignore it downstream. **Probes need to be combined with causal interventions** to confirm relevance — covered in section 6.

**Connection forward:** Section 3 reveals why neuron-level inspection doesn't work — polysemanticity.

### Section 3: The polysemanticity problem

**Heading:** `## The polysemanticity problem`
**Word target:** ~400
**Sub-headings:** `### One neuron, many concepts`, `### Superposition`

**Teaching beats:**

**What you find when you look at neurons**:
A single neuron in a trained LLM activates on **many unrelated concepts**:
- Neuron 1234 fires on Python `for` loops, French sentences about cooking, and digit-grouped numbers
- Neuron 5678 fires on negation, present tense, and the word "however"

This is **polysemanticity** — one neuron, multiple concepts.

**Why this happens — superposition** (Elhage 2022):

Models need to represent **many more features than they have neurons**. The solution: **store features as approximately-orthogonal directions** in the residual stream, not as individual neurons.

```mdx
<Equation label="25.superposition">
$$d_{\text{model}} \ll \text{number of meaningful features} \;\Longrightarrow\; \text{features must share neurons}$$
</Equation>
```

**The consequences**:
- **Neuron-level interpretability is misleading** — a single neuron is not a "feature."
- **Concepts are encoded in directions**, not units.
- **Decoding requires finding the right directions** — not just inspecting raw activations.

**Why this matters**:
- Probes work because they find the right *direction* — a linear combination of neurons.
- **But you can't just inspect a model's neurons** and know what it's doing.
- **You need a method to extract the meaningful directions** from activations.

**The path through superposition**: enter sparse autoencoders (section 4).

**Required callout** — type `warning`: **MC1 from research.md.** "Each neuron in an LLM represents a specific concept." False. **Polysemanticity is the rule, not the exception.** This is why early efforts to inspect individual neurons produced confusing results: neurons don't correspond to concepts; **directions do**. Once you accept this, the field's modern direction (SAEs to find those directions) makes sense.

**No code in this section** (the SAE code in section 4 is where the concept lands).

**Connection forward:** Section 4 introduces the modern technique that addresses the polysemanticity problem.

### Section 4: Sparse autoencoders

**Heading:** `## Sparse autoencoders`
**Word target:** ~600 — IMPORTANT (the chapter's modern flagship)
**Sub-headings:** `### The recipe`, `### What features look like`, `### Why this matters for safety`

**Teaching beats:**

**The SAE recipe** (Bricken 2023, Templeton 2024):
1. Take model activations $\mathbf{x} \in \mathbb{R}^{d}$ from a chosen layer (e.g., the residual stream)
2. Train an autoencoder with a **much wider hidden layer** (e.g., 8x-128x the residual dim) and a **sparsity penalty**
3. **Encoder**: $\mathbf{f} = \text{ReLU}(W_{\text{enc}} \mathbf{x} + \mathbf{b}_{\text{enc}})$
4. **Decoder**: $\hat{\mathbf{x}} = W_{\text{dec}} \mathbf{f} + \mathbf{b}_{\text{dec}}$
5. **Loss**: $\|\mathbf{x} - \hat{\mathbf{x}}\|_2^2 + \lambda \|\mathbf{f}\|_1$ (reconstruction + sparsity)

**What you get**:
- $D$ "features" $\mathbf{f}_1, \ldots, \mathbf{f}_D$, each a sparse signal across the dataset
- For each feature, **identify the inputs that activate it**
- Most features turn out to be **monosemantic** — they activate on a single interpretable concept

**Why this works**:
- The wider layer gives room to **un-pack** superposed features
- Sparsity forces each input to be reconstructed by **few features**
- Together: approximates the original feature decomposition the model implicitly used

**What features look like** (examples from Templeton 2024 on Claude 3 Sonnet):
- A feature that activates on **Golden Gate Bridge mentions**
- A feature that activates on **code vulnerabilities**
- A feature that activates on **scientific reasoning steps**
- A feature that activates on **deception or secrecy**
- A feature that activates on **specific languages** (Spanish, Mandarin)
- A feature that activates on **abstract emotional states**

**Why SAEs matter for safety**:
- **Surfaces concepts the model uses internally** — including potentially-dangerous ones (manipulation, dishonesty)
- **Enables targeted intervention**: clamp a feature's activation → see how behavior changes
- **Validates alignment claims**: confirm "deception" features don't activate during honest behavior

**Required widget placeholder** — SAE Feature Explorer (marquee, session 142):

```mdx
<WidgetFrame title="SAE feature explorer" caption="Browse a curated set of SAE features — each labeled with its interpretable concept (Golden Gate Bridge, code vulnerabilities, deceptive framings, etc.). Pick a feature; see the top-K inputs that activate it. The shared embedding space (decoder weights) shows related features clustering together. The widget makes the SAE → monosemantic features pipeline concrete — Anthropic's flagship interpretability direction.">
  <div style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
    Widget content — session 142 (marquee)
  </div>
</WidgetFrame>
```

**Required code** — `<RunnableCode>` showing a toy SAE:

```python
import numpy as np

# A tiny sparse autoencoder.
# Real SAEs operate on residual stream activations (d ≈ 512-4096) with
# wider hidden dims (D = 8x-128x d) and millions of training examples.
# Toy version: d=32, D=128, 500 examples.

np.random.seed(11)
d = 32       # activation dim
D = 128      # SAE hidden dim (wide)
N = 500

# Synthesize inputs from a small number of "true" features
n_true_features = 12
true_features = np.random.randn(n_true_features, d)
true_features /= np.linalg.norm(true_features, axis=1, keepdims=True)

X = np.zeros((N, d))
for i in range(N):
    active = np.random.choice(n_true_features, size=2, replace=False)
    coeffs = np.random.rand(2)
    X[i] = coeffs[0] * true_features[active[0]] + coeffs[1] * true_features[active[1]]
X += np.random.randn(N, d) * 0.05

# Initialize SAE
W_enc = np.random.randn(D, d) * 0.1
b_enc = np.zeros(D)
W_dec = np.random.randn(d, D) * 0.1
b_dec = np.zeros(d)

# Train
n_iterations = 1500
lr = 0.02
sparsity_lambda = 0.05

for step in range(n_iterations):
    pre = X @ W_enc.T + b_enc
    f = np.maximum(0, pre)
    x_hat = f @ W_dec.T + b_dec
    
    dx_hat = -2 * (X - x_hat) / N
    dW_dec = dx_hat.T @ f
    db_dec = dx_hat.sum(axis=0)
    df = dx_hat @ W_dec + sparsity_lambda / N
    df_pre = df * (pre > 0)
    dW_enc = df_pre.T @ X
    db_enc = df_pre.sum(axis=0)
    
    W_enc -= lr * dW_enc; b_enc -= lr * db_enc
    W_dec -= lr * dW_dec; b_dec -= lr * db_dec
    
    if step % 300 == 0:
        active = (f > 0.01).any(axis=0).sum()
        avg_per_input = (f > 0.01).sum(axis=1).mean()
        recon = np.mean(np.sum((X - x_hat) ** 2, axis=1))
        print(f"step {step:>4}  recon {recon:.4f}  sparsity {avg_per_input:.1f} active/input  {active} live of {D}")

print(f"\\nTrue feature count: {n_true_features}")
print(f"SAE recovers approximately this number of live features.")

# Observations:
# - The SAE is wider than the input (D > d) — room to un-pack superposition
# - Sparsity penalty forces few features active per input
# - Trained SAE recovers approximately the original feature count
# - In real SAEs at production scale: millions of features, mostly monosemantic
```

**Connection forward:** Section 5 turns from "what features the model uses" to "how the model computes."

### Section 5: Mechanistic interpretability — circuits

**Heading:** `## Mechanistic interpretability — circuits`
**Word target:** ~500
**Sub-headings:** `### The mech-interp ambition`, `### Canonical examples`, `### Why it's hard at scale`

**Teaching beats:**

**The mech-interp ambition**: not just identify *what* concepts the model uses (probes, SAEs), but **identify *how* the model computes** — tracing specific algorithmic computations through specific weight subgraphs.

**A circuit is**:
- A small subgraph of weights (a few attention heads + MLPs)
- That implements a specific, interpretable algorithm
- Verifiable by activation patching or direct inspection

**Canonical examples**:

**Curve detectors in InceptionV1** (Cammarata 2020):
- Convolutional neurons that detect curves at various orientations
- Built from simpler edge detectors in lower layers
- Verified by examining activations and weight patterns

**Induction heads in transformers** (Elhage 2021, Olsson 2022):
- A pair of attention heads that implement: "find the previous occurrence of the current token; copy what came after it"
- Pattern: `A B ... A → B`
- **Load-bearing for in-context learning** — ablating induction heads drops in-context learning capability

**Indirect Object Identification (IOI) circuit**:
- A specific GPT-2-small circuit for sentences like "When John and Mary went to the store, John gave a drink to Mary"
- Identifies "Mary" as the indirect object
- Decomposed into ~25 attention heads with named roles (S-inhibition, name mover, etc.)

**The mech-interp methodology**:
1. **Identify a behavior** (e.g., "the model copies text from earlier in context")
2. **Hypothesize a circuit** that might implement it
3. **Verify by activation patching**: remove or alter the components; see whether the behavior breaks
4. **Refine and characterize** the components' individual roles

**Why mech-interp is hard at scale**:
- **Most behaviors aren't localized** — they span many layers and heads
- **Components are polysemantic** — they participate in many circuits
- **Verification is labor-intensive** — confirming a circuit can take weeks

**Required callout** — type `aside`: **MC4 from research.md.** "Mechanistic interpretability scales to GPT-4-sized models." Mostly false as of early 2025. **Most published circuit work is on small models** (GPT-2 small, toy transformers). **SAEs scale better** (Templeton 2024 reached Claude 3 Sonnet); circuit discovery does not yet. **This is one of the field's largest open problems.**

**No code in this section** (the patching code is in section 6).

**Connection forward:** Section 6 turns to the techniques that verify circuits — causal interventions.

### Section 6: Causal interventions

**Heading:** `## Causal interventions`
**Word target:** ~400
**Sub-headings:** `### From correlation to causation`, `### The intervention toolkit`

**Teaching beats:**

**Probes correlate; interventions cause.**

The interpretability discipline pivots from "concept X is present" to "concept X *causes* behavior Y" via direct manipulation of the model.

**The intervention toolkit**:

**Logit lens** (nostalgebraist 2020):
- Project intermediate residual stream activations through the unembedding matrix
- See what the model "would predict" at each layer
- Surfaces layer-by-layer evolution of predictions

**Tuned lens** (Belrose 2023):
- Refined logit lens with learned layer-specific projections
- More accurate; same conceptual frame

**Activation patching**:
- Run two prompts: clean (correct answer) and corrupted (wrong answer)
- Copy activations from clean to corrupted at specific points
- If the corrupted prompt now produces the correct answer, those activations carry the relevant information
- **Identifies which components store specific information**

**ROME** (Meng 2022):
- Identify MLP layers that store factual associations
- Surgically edit MLP weights to change a fact
- Demonstrates causal localization

**Steering vectors**:
- Add a learned direction to the residual stream to push the model toward a behavior
- Subtract to push away
- Crude but effective for behavior modulation

**Feature clamping** (SAE-enabled):
- Force an SAE feature's activation high or low
- Observe behavioral effect
- Maps SAE features to causal influence

**Required code** — `<RunnableCode>` showing activation patching:

```python
import numpy as np

# Mock model: a simple two-layer "transformer" with handcrafted behavior.
# Real activation patching operates on actual transformer hidden states.

def layer1(x):
    return np.tanh(x)

def layer2(h):
    return h @ np.array([0.5, -0.5, 0.3])

def model_forward(x):
    h1 = layer1(x)
    out = layer2(h1)
    return h1, out


# Two prompts: clean produces correct answer; corrupted produces wrong.
clean_input = np.array([1.0, 0.5, -0.5])
corrupt_input = np.array([-1.0, 0.5, -0.5])      # only first dim differs

h1_clean, out_clean = model_forward(clean_input)
h1_corrupt, out_corrupt = model_forward(corrupt_input)

print(f"Clean output:     {out_clean:.4f}")
print(f"Corrupted output: {out_corrupt:.4f}\\n")

# Patch: replace layer1's output for corrupted input with clean's h1.
# If output flips to clean, layer1's output carries the relevant info.
def patched_forward(h1_to_use):
    return layer2(h1_to_use)

patched = patched_forward(h1_clean)
print(f"Patched (corrupted input, clean's layer1 output): {patched:.4f}")
print(f"Matches clean output? {np.isclose(patched, out_clean)}")
print()
print(f"Conclusion: Layer1's output causally determines the difference.")
print(f"This is the basic logic of activation patching at scale.")

# Observations:
# - Patching pinpoints WHERE specific information lives in the network
# - Combined with probes (section 2), gives both correlation AND causation
# - Real activation patching: tests individual attention heads, MLPs, single neurons
# - The IOI circuit was identified primarily via systematic activation patching
```

**Causal vs correlational** (the key teaching):
- A **probe** shows information is decodable from a layer
- An **intervention** shows that the layer's encoding **affects downstream behavior**
- **Both are necessary**; neither alone suffices

**Connection forward:** Section 7 takes stock of where the field is.

### Section 7: The current state of the field

**Heading:** `## The current state of the field`
**Word target:** ~400
**Sub-headings:** `### What works`, `### What's open`

**Teaching beats:**

**What works (early 2025)**:
- **Probing**: mature; works well for many concepts; layer-wise emergence well-characterized
- **SAEs**: rapidly advancing; Anthropic's flagship direction; scaling to frontier models
- **Circuits**: dozens identified in small models; scaling is hard
- **Causal interventions**: well-developed; widely used; combined with SAEs and circuits

**What's open**:
- **Coverage**: do our methods find *all* the model's features? Probably not.
- **Scale**: most mech-interp work is on small models; frontier models are largely uncharted
- **Automation**: discovering circuits and interpreting features still requires human labor
- **Verification**: how do we know a circuit truly explains a behavior, vs a partial story?
- **Generalization**: do circuits found at one scale or task transfer to others?

**Where research is heading**:
- **Larger SAE deployments**: more features, more models
- **Cross-layer circuit discovery**: tracing computations across all layers
- **Safety applications**: detecting specific dangerous behaviors before they manifest
- **Real-time monitoring**: applying interp tools to production model inference

**Key labs and groups**:
- **Anthropic** — SAEs (Bricken 2023, Templeton 2024); circuits; interpretability is a core safety bet
- **OpenAI** — sparse coding and probing; interp team
- **DeepMind** — mechanistic interpretability; circuit discovery
- **Apollo Research** — focused on detecting deceptive alignment via interpretability
- **EleutherAI** — open-source interpretability tools (TransformerLens)
- **Academic groups** — Conjecture, Redwood Research, university labs

**Required callout** — type `note`: **MC5 from research.md.** "Interpretability is a solved science." False. **It's an empirical, rapidly-evolving discipline**, not a mature science. New methods emerge yearly; older methods get superseded. **Engineers should treat interpretability tools as research-grade**, with appropriate caveats. **Same care as any rapidly-progressing area** — the techniques work, but the field is moving.

**No code in this section.**

**Connection forward:** Section 8 closes Ch 25 and previews Ch 26.

### Section 8: Phase 14 ahead

**Heading:** `## Phase 14 ahead`
**Word target:** ~400
**Sub-headings:** `### Connecting interp to eval`, `### The phase's central question`

**Teaching beats:**

**The three Phase 14 disciplines**:
- **Ch 24 (Safety)** — what we want; how we train it; how we red-team
- **Ch 25 (Interpretability, this chapter)** — what the model is actually computing internally
- **Ch 26 (Evaluation, next)** — how we measure capability and safety quantitatively

**The connection**:
- **Safety + Eval without Interp**: behavioral testing only. Catches what we think to test for; misses what we don't.
- **Safety + Interp without Eval**: have tools but no measurement. Can't say "is this model safer than the last?"
- **Interp + Eval without Safety**: have tools and measurements but no operational discipline.

**All three together**: a complete safety practice — *what* we want, *what* the model is computing, *whether* it's improving.

**The phase's central question**: **Can capable models be made trustworthy at scale?** Phase 14 doesn't fully answer it — but lays out the three disciplines that are trying.

**Sample close** (rewrite in chapter voice):

> Interpretability is the verification arm of safety. Probes read concepts from hidden states; sparse autoencoders pull apart superposition into monosemantic features; circuits reveal how the model computes; causal interventions confirm that components actually matter. **None of these techniques are complete; together, they're a microscope on alignment.** Production deployments use them — Anthropic's SAE work on Claude 3 Sonnet, OpenAI's interp team, deployed feature-clamping — and they're improving rapidly.
>
> **Chapter 26 opens the evaluation discipline.** If interpretability tells you what the model is computing, evaluation tells you how well — capability benchmarks, safety benchmarks, leaderboards, what they measure and what they miss. **Together with Chapter 24 (Safety), the three disciplines of Phase 14 turn capability into trustworthiness.** Then Phase 15 assembles the full stack — capability + discipline + composition — into complete agent architectures. **Three chapters from the curriculum's end.**

---

### Update `src/lib/chapters.ts`

Find:

```ts
{ num: 25, slug: 'ch25-interpretability', title: 'Interpretability', partNum: 8, status: 'planned' },
```

Change `status: 'planned'` to `status: 'draft'`.

### Delete the placeholder

```bash
test -f src/pages/ch25-interpretability/index.astro && rm src/pages/ch25-interpretability/index.astro || echo "No placeholder to delete"
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No MDX parsing errors.
2. **`/ch25-interpretability/`** renders with:
   - Chapter eyebrow ("Chapter 25") + h1 + description
   - 8 h2 sections in the order specified
   - **3 `<RunnableCode>` blocks** (sections 2, 4, 6)
   - 2 `<WidgetFrame>` placeholders (sections 2 and 4)
   - Labeled equations `<Equation label="25.interpretability-goals">`, `<Equation label="25.superposition">`
   - At least 5 callouts (section-1 aside, MC2 in section 2, MC1 in section 3, MC4 in section 5, MC5 in section 7 — pick 5)
3. **Sidebar:** Ch 1-24 published; Ch 25 active (draft); Ch 26-30 dimmed
4. **Prev/next nav at bottom of Ch 25:** prev = Ch 24 (active); next = Ch 26 (disabled)
5. **TOC on Ch 25** populates with all 8 sections plus subsections
6. **Word count:** chapter prose between 3500 and 4200 words
7. **`npm run typecheck`** passes
8. **`npm run build`** completes

---

## Out of scope

- ❌ **Do not implement either widget.** Sessions 142 and 143 own them.
- ❌ **Do not write exercises.** Session 143 owns.
- ❌ **Do not flip Ch 25's status to `'published'`.** Session 143 owns.
- ❌ **Do not dive into consciousness or representation philosophy.** Engineering focus only.
- ❌ **Do not enumerate every circuit ever found.** Name the canon (induction heads, IOI); brief.
- ❌ **Do not derive the math of attention again.** Ch 4 covers it; this chapter only references the substrate.
- ❌ **Do not overclaim SAEs.** They're a major advance, not a complete solution.
- ❌ **Do not modify Ch 1-24.** Sealed.

---

## Wire-up

```bash
git add src/pages/ch25-interpretability/index.mdx src/lib/chapters.ts
git rm -f src/pages/ch25-interpretability/index.astro 2>/dev/null || true
git commit -m "session 111: Ch 25 prose — interpretability (middle of Phase 14 discipline arc)"
git push origin main
```

---

## Notes for the session author

**On Anthropic's SAE work being the chapter's center of gravity:**
Bricken 2023 (Towards Monosemanticity) and Templeton 2024 (Scaling Monosemanticity) are the modern interpretability flagship. **Center the chapter on them.** Notes-for-author: "**SAEs are the chapter's most actionable modern technique.** Show the recipe in detail; show what features look like (with sanitized examples from Templeton 2024). Don't overclaim — they're a major advance, not a complete solution."

**On the no-philosophy rule:**
Interpretability touches on questions about consciousness, representation, and meaning. **This chapter avoids those.** Notes-for-author: "**Engineering focus only.** Mention that interpretability connects to questions about model behavior; don't dive into philosophy. The chapter's job is to teach methodology, not adjudicate metaphysics."

**On the polysemanticity → superposition → SAEs chain:**
Sections 2 (probes) → 3 (polysemanticity) → 4 (SAEs) form an argument arc:
1. Probes work, but find directions not neurons
2. Why? Because neurons are polysemantic
3. Why? Because of superposition (Elhage 2022)
4. How do we extract the true features? SAEs (Bricken 2023, Templeton 2024)

Notes-for-author: "**This is the chapter's central pedagogical sequence.** Each section sets up the next. By the end of section 4, the reader understands not just *what* SAEs are but *why* the field needed them."

**On honesty about open problems:**
Section 7 explicitly enumerates open problems (coverage, scale, automation, verification, generalization). **No overclaiming.** Notes-for-author: "**Interpretability is rapidly progressing but far from solved.** The chapter should reflect this. Readers should leave knowing what the field can and can't do — both useful for working engineers and for setting research priorities."

**On the three runnable code blocks**:
- **Section 2 (linear probe)**: 30 lines; trains a logistic-regression probe on synthetic hidden states; recovers a known concept direction
- **Section 4 (toy SAE)**: 50 lines; trains a 32→128 SAE with sparsity penalty; recovers approximately the original feature count
- **Section 6 (activation patching)**: 30 lines; two prompts (clean vs corrupted); patches an intermediate layer; demonstrates causal information transfer

**The progression**: read concepts (probes) → un-pack the encoding (SAEs) → verify causally (patching). **The reader sees the full interp pipeline in code.**

**On the marquee widget placement (section 4 — SAEs):**
SAEs are the chapter's modern flagship. **The marquee belongs there.** Reader browses extracted features (Golden Gate Bridge, code vulnerabilities, deception); sees what monosemantic features look like. Notes-for-author: "**The SAE Feature Explorer makes Anthropic's recent breakthrough concrete.** Reader sees the SAE → features pipeline as something they can interact with, not just read about."

**On the secondary widget placement (section 2 — Probes):**
Linear probing is the foundational technique; layer-wise feature emergence is one of probing's most robust findings. **The secondary widget shows this directly** — pick a concept; see probe accuracy by layer; watch where the concept becomes decodable.

**On the Phase 14 middle-chapter framing:**
Ch 25 is the chapter that sits *between* "what we want" (Ch 24 Safety) and "how we measure both" (Ch 26 Evaluation). Notes-for-author: "**Section 8 should explicitly frame the three disciplines as complementary.** Reader leaves understanding that interpretability isn't separate from safety or evaluation — it's the verification piece of the same project."

**Pedagogical claim of the chapter:**
"Interpretability is the discipline of reading what a trained LLM is doing internally. Linear probes (Alain & Bengio 2016) decode concepts from hidden states; **polysemanticity** (Elhage 2022) explains why neuron-level inspection fails (superposition packs more features than dimensions); **sparse autoencoders** (Bricken 2023, Templeton 2024) decompose activations into monosemantic features at frontier scale; **circuits** (Olah et al., Olsson 2022) trace specific algorithms through specific weight subgraphs; **causal interventions** (logit lens, activation patching, ROME) verify hypotheses. The field is **empirical and rapidly evolving**, not solved. **The deliverable is increasingly verification at the mechanistic level — the only known route to catch behavioral-training failures like sleeper agents.**"

**Phase 14 progress after this session**: Ch 24 ✅, Ch 25 in progress (1/4 files). **Three sessions remain** to close Ch 25; then Ch 26 completes Phase 14.

Build with care. **This chapter is the field's introduction for working engineers.**
