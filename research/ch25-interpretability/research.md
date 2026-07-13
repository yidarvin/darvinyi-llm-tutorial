# Chapter 25 — Interpretability: research

> Curated source material for Chapter 25's build sessions. **The chapter that puts a microscope on alignment.** Part VIII opened with safety (Ch 24): what we want the model to do, and how we make it do that. **Interpretability asks the complementary question**: *what is the model actually doing inside?* If safety is the behavioral discipline, interpretability is the mechanistic one — pulling apart the weights and activations to surface meaningful computations. Linear probes; the polysemanticity problem (one neuron, many concepts); sparse autoencoders as a path through superposition (Anthropic's "Towards Monosemanticity" 2023 and "Scaling Monosemanticity" 2024); mechanistic interpretability — finding circuits in neural networks (Olah et al.); causal interventions — logit lens, tuned lens, activation patching, ROME; the current state of the field. **Single-topic chapter**; uses the **4-file cadence**. **The chapter that turns black-box models into systems we can inspect — and explains why that's still hard.**

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Interpretability

**Premise:** A trained LLM is a black box in two senses: (1) we can't easily tell what it's doing internally; (2) we can't always predict what it will do externally. Part VIII's safety chapter (Ch 24) addressed the external problem — alignment, refusals, red-teaming. **This chapter addresses the internal problem.** Can we read off concepts from hidden states? Can we identify circuits — specific weight subgraphs — that implement specific computations? Can we causally intervene to test our hypotheses? **Interpretability research says yes, partially**: probes read some concepts; circuits explain some behaviors; sparse autoencoders decompose activations into more-monosemantic features. **It's an empirical field in rapid motion**, not a settled science.

**The framing:** interpretability research has two complementary goals:
1. **Understanding** — explain what computations the model performs
2. **Verification** — confirm or refute alignment claims by reading internal state

The chapter treats both as engineering practices, not philosophy.

**Out of scope (other chapters):**
- Safety techniques (Ch 24 — covered)
- Evaluation methodology (Ch 26 — next)
- Agent-specific interpretability (Ch 29-30 — adjacent)
- Philosophy of AI consciousness — entirely out of scope

**In scope and locked:**
- **Linear probes**: train a small classifier on hidden states to read concepts
- **Polysemanticity and superposition**: why one neuron encodes many concepts
- **Sparse autoencoders (SAEs)**: a path through superposition (Anthropic 2023, 2024)
- **Mechanistic interpretability**: circuits — small weight subgraphs implementing specific computations (Olah et al.)
- **Causal interventions**: logit lens, tuned lens, activation patching, ROME
- **The current state of the field**: rapid progress, large open problems

**Suggested chapter structure** (8 sections):

1. The interpretability question (~400 words)
2. Probes — reading concepts from hidden states (~600 words)
3. The polysemanticity problem (~400 words)
4. Sparse autoencoders (~600 words)
5. Mechanistic interpretability — circuits (~500 words)
6. Causal interventions (~400 words)
7. The current state of the field (~400 words)
8. From interpretability to evaluation (~400 words)

Target: ~3700 words plus 2 widgets and 3 runnable code blocks.

---

## Key papers and references

### Alain & Bengio 2016 — "Understanding intermediate layers using linear classifier probes"
- **arXiv:** [1610.01644](https://arxiv.org/abs/1610.01644)
- **What it contributed:** **Linear probing** — train a small linear classifier on a frozen network's hidden states to predict a concept of interest. If the classifier achieves high accuracy, the concept is **linearly decodable** from those representations. **The foundational probing technique.**
- **For the chapter:** central reference for section 2.

### Belinkov & Glass 2019 — "Analysis Methods in Neural Language Processing: A Survey"
- **arXiv:** [1812.08951](https://arxiv.org/abs/1812.08951)
- **What it contributed:** **Survey of NLP probing methods**. Documents the field's standard methodology — train probes for syntactic and semantic concepts; report accuracies; compare layers.

### Olah et al. 2017 — "Feature Visualization" (Distill)
- **URL:** [distill.pub/2017/feature-visualization](https://distill.pub/2017/feature-visualization/)
- **What it contributed:** **Visualizing what individual neurons in vision models respond to.** Established that individual units often encode specific, interpretable features (textures, parts, objects). **The foundational visualization technique** in the mech-interp lineage.

### Cammarata et al. 2020-2021 — "Curve Detectors" (Distill, "Circuits" thread)
- **URL:** [distill.pub/2020/circuits/](https://distill.pub/2020/circuits/)
- **What it contributed:** **Circuits** — small subgraphs of weights in InceptionV1 implementing specific algorithms (curve detection, gabor filters, dog-head detection). Each circuit decomposable into a few neurons, with weights interpretable as instances of a recognizable algorithm. **The reference example of mechanistic interpretability.**
- **For the chapter:** central reference for section 5.

### Elhage et al. 2021 (Anthropic) — "A Mathematical Framework for Transformer Circuits"
- **URL:** [transformer-circuits.pub](https://transformer-circuits.pub/2021/framework/index.html)
- **What it contributed:** **Mathematical framework for analyzing transformers as circuits.** Decomposes attention heads + MLP layers into interpretable components. Introduces **induction heads** as a learned circuit. Establishes vocabulary (residual stream, OV/QK circuits) used across the field.

### Olsson et al. 2022 (Anthropic) — "In-context Learning and Induction Heads"
- **arXiv:** [2209.11895](https://arxiv.org/abs/2209.11895)
- **What it contributed:** **Induction heads** — a specific circuit that completes patterns like `A B ... A → B`. Discovered to be **load-bearing** for in-context learning. **A worked example of mechanistic interpretability at scale.**

### Elhage et al. 2022 (Anthropic) — "Toy Models of Superposition"
- **URL:** [transformer-circuits.pub/2022/toy_model](https://transformer-circuits.pub/2022/toy_model/index.html)
- **What it contributed:** **Superposition** — models store more features than they have dimensions by packing features into approximately-orthogonal directions in the residual stream. Explains **polysemanticity** (one neuron, many concepts). **The conceptual bridge from probes to SAEs.**
- **For the chapter:** central reference for section 3.

### Bricken et al. 2023 (Anthropic) — "Towards Monosemanticity: Decomposing Language Models With Dictionary Learning"
- **URL:** [transformer-circuits.pub/2023/monosemantic-features](https://transformer-circuits.pub/2023/monosemantic-features/index.html)
- **What it contributed:** **Sparse autoencoders (SAEs)** — train a sparse autoencoder on layer activations; learn a sparse, overcomplete dictionary of features that activate on interpretable concepts. **First demonstration of monosemantic feature decomposition** in real LLMs. **A breakthrough method.**
- **For the chapter:** central reference for section 4.

### Templeton et al. 2024 (Anthropic) — "Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet"
- **URL:** [transformer-circuits.pub/2024/scaling-monosemanticity](https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html)
- **What it contributed:** **Scaled the Bricken 2023 SAE approach to Claude 3 Sonnet** — a production-scale model. Found millions of features including abstract concepts (deception, secrecy, code vulnerabilities). **Demonstrated that SAE-based interpretability scales to frontier models** and surfaces features relevant to safety.
- **For the chapter:** section 4.

### nostalgebraist 2020 — "Interpreting GPT: the logit lens"
- **URL:** [lesswrong.com/posts/AcKRB8wDpdaN6v6ru/interpreting-gpt-the-logit-lens](https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru/interpreting-gpt-the-logit-lens)
- **What it contributed:** **Logit lens** — project intermediate residual stream activations through the unembedding matrix; see what the model "would output" at each layer. Surfaces the layer-by-layer evolution of predictions. **An early, simple causal-intervention technique.**

### Belrose et al. 2023 — "Eliciting Latent Predictions from Transformers with the Tuned Lens"
- **arXiv:** [2303.08112](https://arxiv.org/abs/2303.08112)
- **What it contributed:** **Tuned lens** — a refined version of logit lens that learns layer-specific projections. More accurate than logit lens but same conceptual frame.

### Meng et al. 2022 — "Locating and Editing Factual Associations in GPT" (ROME)
- **arXiv:** [2202.05262](https://arxiv.org/abs/2202.05262)
- **What it contributed:** **ROME (Rank-One Model Editing)** — identify which MLP layers store specific facts; surgically edit those weights to change the fact. Demonstrated both **localization** (facts have specific weights) and **causal verification** (editing changes behavior in predicted ways). **An early causal-intervention success.**
- **For the chapter:** section 6.

### Conmy et al. 2023 — "Towards Automated Circuit Discovery for Mechanistic Interpretability" (ACDC)
- **arXiv:** [2304.14997](https://arxiv.org/abs/2304.14997)
- **What it contributed:** **ACDC** — automated method to find circuits using activation patching. Removes the manual labor that earlier circuit work required. **An attempt to scale circuit discovery.**

### Anthropic 2025 — "Circuits Updates" (ongoing series)
- **URL:** [transformer-circuits.pub](https://transformer-circuits.pub/)
- **What it contributed:** **Ongoing interpretability research from Anthropic.** The reference source for the state of the field as of 2024-2025.

---

## Core concepts

### Concept 1: The interpretability question

**The black-box problem**:
A trained LLM is opaque in two senses:
1. **Internal**: we can't easily tell what computations are happening at each layer
2. **External**: we can't always predict what the model will do on new inputs

Part VIII's safety chapter (Ch 24) addressed the external opacity through **alignment training and red-teaming**. **This chapter addresses internal opacity through interpretability research.**

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
2. **Frontier capability** — models that can reason, plan, and act are increasingly hard to evaluate by behavior alone. Reading internals provides a second channel.
3. **Trust at scale** — production deployments at scale need confidence that doesn't depend on perfect red-teaming.

**The challenge**: modern LLMs have hundreds of billions of parameters, dense feedforward layers, and computations that don't map cleanly to human concepts. **Interpretability research is empirical and progressing fast** — but is not yet a complete science.

**Empirical scale (early 2025)**:
- **Probe accuracy** for common concepts: 80-95% on hidden states of frontier models
- **SAE feature count** (Anthropic 2024): millions of features extracted from Claude 3 Sonnet
- **Known circuits** in transformers: dozens (induction heads, IOI circuit, copy-suppression heads, etc.)
- **Active research labs**: Anthropic, OpenAI, DeepMind, Apollo Research, EleutherAI, academic groups

### Concept 2: Probes — reading concepts from hidden states

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
- **Simple**: fewer parameters than the underlying model → less likely to "learn the concept" from scratch
- **Fast**: trains in seconds on a few thousand examples
- **Interpretable**: a linear weight vector is itself a direction in representation space — you can analyze it

**What probes tell you**:
- **"Is concept X linearly decodable from layer L?"** — yes/no, with probe accuracy as the signal
- **"At which layer does concept X emerge?"** — train probes at every layer; find where accuracy spikes
- **"How does concept X evolve across layers?"** — compare probe accuracies layer by layer

**What probes don't tell you**:
- **Causation**: a probe says the concept is *present*, not that the model *uses* it. **The model might decode the concept and ignore it** in downstream layers.
- **Mechanism**: a probe doesn't tell you *how* the concept is computed; just that it's there.
- **Robustness**: probes work in-distribution; out-of-distribution accuracy can collapse.

**Multi-layer probes** (concept evolution):
- **Early layers**: surface features (token identity, position)
- **Middle layers**: syntactic / semantic features
- **Late layers**: task-specific / output-aligned features

This **layer-wise feature emergence** is one of probing's most robust findings.

### Concept 3: The polysemanticity problem

**What you find when you look at neurons**:
A single neuron in a trained LLM activates on **many unrelated concepts**:
- Neuron 1234 fires on Python `for` loops, French sentences about cooking, and digit-grouped numbers
- Neuron 5678 fires on negation, present tense, and the word "however"

This is **polysemanticity** — one neuron, multiple concepts.

**Why this happens — superposition** (Elhage 2022):

Models need to represent **many more features than they have neurons**. The solution: **store features as approximately-orthogonal directions in the residual stream**, not as individual neurons. When the model needs feature F, the relevant direction lights up — which can manifest as activation on several different neurons.

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

**The path through superposition**: enter sparse autoencoders.

### Concept 4: Sparse autoencoders

**The SAE recipe** (Bricken 2023, Templeton 2024):
1. Take model activations $\mathbf{x} \in \mathbb{R}^{d}$ from a chosen layer (e.g., the residual stream)
2. Train an autoencoder with a **much wider hidden layer** (e.g., 8x-128x the residual dim) and a **sparsity penalty**
3. Encoder: $\mathbf{f} = \text{ReLU}(W_{\text{enc}} \mathbf{x} + \mathbf{b}_{\text{enc}})$, with $W_{\text{enc}} \in \mathbb{R}^{D \times d}$, $D \gg d$
4. Decoder: $\hat{\mathbf{x}} = W_{\text{dec}} \mathbf{f} + \mathbf{b}_{\text{dec}}$
5. **Loss**: $\|\mathbf{x} - \hat{\mathbf{x}}\|_2^2 + \lambda \|\mathbf{f}\|_1$ (reconstruction + sparsity)

**What you get**:
- $D$ "features" $\mathbf{f}_1, \ldots, \mathbf{f}_D$, each a sparse signal across the dataset
- For each feature, you can **identify the inputs that activate it**
- Most features turn out to be **monosemantic** — they activate on a single interpretable concept

**Why this works**:
- The wider layer gives the autoencoder room to **un-pack** superposed features
- The sparsity penalty forces each input to be reconstructed by **few features**
- Together, this approximates the original feature decomposition the model implicitly used

**What SAE features look like** (examples from Templeton 2024 on Claude 3 Sonnet):
- A feature that activates on **Golden Gate Bridge mentions**
- A feature that activates on **code vulnerabilities**
- A feature that activates on **scientific reasoning steps**
- A feature that activates on **deception or secrecy**
- A feature that activates on **specific languages** (Spanish, Mandarin)
- A feature that activates on **abstract emotional states**

**Why SAEs matter for safety**:
- **Surfaces concepts the model uses internally** — including potentially-dangerous ones (e.g., manipulation, dishonesty)
- **Enables targeted intervention**: clamp a feature's activation → see how behavior changes
- **Validates alignment claims**: confirm that "deception" features don't activate during honest behavior

**Tradeoffs**:
- **Compute-expensive**: training SAEs on frontier models is a major effort
- **Feature labeling**: a feature's "meaning" still requires human interpretation
- **Coverage gaps**: SAEs find many features, but probably not *all* features

**The 2024 state of SAE research**: rapidly advancing; Anthropic's flagship interpretability direction; growing open-source ecosystem.

### Concept 5: Mechanistic interpretability — circuits

**The mech-interp ambition**: not just identify *what* concepts the model uses (probes, SAEs), but **identify *how* the model computes** — by tracing specific algorithmic computations through specific weight subgraphs.

**A circuit is**:
- A small subgraph of weights (a few attention heads + MLPs)
- That implements a specific, interpretable algorithm
- Verifiable by activation patching or direct inspection

**Canonical examples**:

**Curve detectors in InceptionV1** (Cammarata 2020):
- A small number of convolutional neurons that detect curves at various orientations
- Built from simpler edge detectors in lower layers
- Verified by examining activations + weight patterns

**Induction heads in transformers** (Elhage 2021, Olsson 2022):
- A pair of attention heads that implement: "find the previous occurrence of the current token; copy what came after it"
- Pattern: `A B ... A → B`
- **Load-bearing for in-context learning** — when induction heads are ablated, in-context learning capability drops

**Indirect Object Identification (IOI) circuit**:
- A specific circuit in GPT-2 small that handles sentences like "When John and Mary went to the store, John gave a drink to Mary"
- Identifies that "Mary" is the indirect object
- Decomposed into ~25 specific attention heads with named roles (S-inhibition, name mover, etc.)

**The mech-interp methodology**:
1. **Identify a behavior** (e.g., "the model can copy text from earlier in the context")
2. **Hypothesize a circuit** that might implement it
3. **Verify by activation patching**: remove or alter the hypothesized components; see whether the behavior breaks
4. **Refine and characterize** the components' individual roles

**Why mech-interp is hard**:
- **Most behaviors aren't localized** — they span many layers and heads
- **Components are polysemantic** — they participate in many circuits
- **Verification is labor-intensive** — confirming a circuit can take weeks

**Where mech-interp is succeeding**:
- Small models (GPT-2 small, toy transformers): dozens of circuits identified
- Specific abstract behaviors (induction, copy-suppression, name-mover)
- Combined with SAEs: surfacing features then tracing how they're computed

### Concept 6: Causal interventions

**Probes correlate; interventions cause.**

The interpretability discipline pivots from "concept X is present" to "concept X *causes* behavior Y" via direct manipulation of the model.

**The intervention toolkit**:

**Logit lens** (nostalgebraist 2020):
- Project intermediate residual stream activations through the unembedding matrix
- See what the model "would predict" at each layer
- Surfaces the layer-by-layer evolution of predictions

**Tuned lens** (Belrose 2023):
- Refined logit lens with learned layer-specific projections
- More accurate; same conceptual frame

**Activation patching**:
- Run two prompts: a "clean" one (correct answer) and a "corrupted" one (wrong answer)
- Copy activations from clean to corrupted at specific points
- If the corrupted prompt now produces the correct answer, those activations carry the information
- **Identifies which components store specific information**

**ROME** (Meng 2022):
- Identify MLP layers that store factual associations
- Surgically edit MLP weights to change a fact (e.g., "Paris is the capital of France" → "Berlin is the capital of France")
- Demonstrates causal localization

**Steering vectors**:
- Add a learned direction to the residual stream to push the model toward a behavior
- Subtract it to push away
- Crude but effective for behavior modulation

**Feature clamping** (SAE-enabled):
- Force an SAE feature's activation high or low
- Observe behavioral effect
- Maps SAE features to causal influence

**Causal vs correlational**:
- A **probe** shows that information is decodable from a layer
- An **intervention** shows that the layer's encoding of that information **affects downstream behavior**
- **Both are necessary**; neither alone suffices

### Concept 7: The current state of the field

**Progress (as of early 2025)**:
- **Probing**: mature; works well for many concepts; layer-wise emergence is well-characterized
- **SAEs**: rapidly advancing; Anthropic's flagship direction; scaling to frontier models
- **Circuits**: dozens identified in small models; scaling is hard
- **Causal interventions**: well-developed; widely used; combined with SAEs and circuits

**Open problems**:
- **Coverage**: do our methods find *all* the model's features? Probably not.
- **Scale**: most mech-interp work is on small models; frontier models are largely uncharted
- **Automation**: discovering circuits and interpreting features still requires human labor
- **Verification**: how do we know a circuit truly explains a behavior, vs a partial story?
- **Generalization**: do circuits found at one scale or task transfer to others?

**Where research is heading** (2025 trajectory):
- **Larger SAE deployments**: more features, more models
- **Cross-layer circuit discovery**: tracing computations across all layers, not just within a few
- **Safety applications**: using interpretability to detect specific dangerous behaviors before they manifest
- **Real-time monitoring**: applying interpretability tools to production model inference

**Key labs and groups**:
- **Anthropic** — SAEs (Bricken 2023, Templeton 2024); circuits (Elhage 2021); interpretability is a core safety bet
- **OpenAI** — sparse coding and probing; interpretability team
- **DeepMind** — mechanistic interpretability; circuit discovery
- **Apollo Research** — focused on detecting deceptive alignment via interpretability
- **EleutherAI** — open-source interpretability tools (TransformerLens)
- **Academic groups** — Conjecture, Redwood Research, university labs

### Concept 8: From interpretability to evaluation

**The three Part VIII disciplines**:
- **Ch 24 (Safety)** — what we want; how we train it; how we red-team
- **Ch 25 (Interpretability, this chapter)** — what the model is actually computing internally
- **Ch 26 (Evaluation, next)** — how we measure capability and safety quantitatively

**The connection**:
- **Safety + Eval without Interp**: behavioral testing only. Catches what we think to test for; misses what we don't.
- **Safety + Interp without Eval**: have tools but no measurement. Can't say "is this model safer than the last?"
- **Interp + Eval without Safety**: have tools and measurements but no operational discipline.

**All three together**: a complete safety practice — *what* we want, *what* the model is computing, *whether* it's improving.

**Then Part IX (Agents)** composes the capability stack with the discipline arc into complete agent architectures. **The curriculum's final arc.**

---

## Glossary

- **Probe**: a small classifier trained on hidden states to predict a concept
- **Linear probe**: a probe whose only learnable parameters are a linear projection
- **Layer-wise feature emergence**: how concepts become decodable across layers
- **Polysemanticity**: one neuron encoding multiple concepts
- **Monosemanticity**: one feature encoding one concept (the SAE goal)
- **Superposition**: representing $> d$ features in a $d$-dim space via approximately-orthogonal directions
- **Sparse autoencoder (SAE)**: a wide, sparsity-regularized autoencoder used to decompose activations into monosemantic features
- **Feature** (in SAE/interp context): a learned direction in activation space corresponding to an interpretable concept
- **Residual stream**: the cumulative sum of layer outputs that transformers build up
- **Circuit**: a small weight subgraph implementing a specific computation
- **Induction head**: a circuit for `A B ... A → B` pattern completion
- **Activation patching**: copying activations from one forward pass to another to test causal roles
- **Logit lens**: projecting intermediate activations through the unembedding matrix
- **Tuned lens**: a learned, layer-specific version of the logit lens
- **ROME**: a method to surgically edit factual associations in MLP layers
- **Steering vector**: a learned residual-stream direction that shifts model behavior
- **TransformerLens**: open-source library for mechanistic interpretability of transformers
- **Mechanistic interpretability ("mech-interp")**: the project of understanding models by finding circuits

---

## Pedagogical analogies

### 1. Probes as thermometers
A thermometer measures temperature but doesn't tell you *why* it's hot. **Linear probes measure whether a concept is present** but don't tell you whether the model uses it or how it's computed. **Useful first step**; not the whole story.

Best used for: section 2.

### 2. Polysemanticity as a closet with overlapping clothes
If a closet has space for 10 outfits but contains 100, items must share hangers. **Polysemantic neurons are hangers** — each one holds pieces of multiple "outfits" (concepts). **You can't read the wardrobe by inspecting individual hangers.**

Best used for: section 3.

### 3. SAEs as a dictionary that decompresses superposition
A dictionary has more entries than any single word — each word maps to a definition that uses other words. **SAEs are a learned dictionary**: each feature is one entry; activations are sparse combinations. **The wide hidden layer is the dictionary's vocabulary**; sparsity ensures each input uses few entries.

Best used for: section 4.

### 4. Circuits as recipes
A recipe is a small, specific algorithm for producing a specific dish. **A circuit is a small, specific algorithm in a trained network for producing a specific behavior.** Like recipes, circuits compose: simple ones combine to make complex ones (edge detectors → curve detectors → shape detectors).

Best used for: section 5.

### 5. Causal interventions as A/B testing on the model's brain
Web A/B testing changes one variable and measures the effect on user behavior. **Activation patching changes one component and measures the effect on model behavior.** Same logic — controlled intervention, observed outcome — applied to the model's internals.

Best used for: section 6.

---

## Common misconceptions

### MC1: "Each neuron in an LLM represents a specific concept."
**Reality:** false. **Polysemanticity is the rule, not the exception.** A typical neuron activates on many unrelated concepts. Per Elhage 2022, this happens because the model is doing **superposition** — representing more features than it has dimensions.

### MC2: "A probe achieving high accuracy means the model uses that information."
**Reality:** false. **A probe shows information is decodable; not that the model uses it.** The model might decode the concept and ignore it downstream. Probes need to be combined with **causal interventions** to confirm relevance.

### MC3: "Sparse autoencoders solve interpretability."
**Reality:** false. **SAEs decompose activations into more-monosemantic features**, which is a major advance. But: feature labeling still requires humans; coverage is incomplete; SAEs add interpretation overhead. **They're a powerful tool, not a complete solution.**

### MC4: "Mechanistic interpretability scales to GPT-4-sized models."
**Reality:** mostly false (as of early 2025). **Most published circuit work is on small models** (GPT-2 small, toy transformers). Scaling is an active research problem. **SAEs scale better** (Templeton 2024 reached Claude 3 Sonnet); circuit discovery does not yet.

### MC5: "Interpretability is a solved science."
**Reality:** false. **It's an empirical, rapidly-evolving discipline**, not a mature science. New methods emerge yearly; older methods get superseded. **Engineers should treat interpretability tools as research-grade**, with appropriate caveats.

### MC6: "Logit lens reveals what the model is 'thinking' at each layer."
**Reality:** half true. **Logit lens shows what the model would output if asked to stop at this layer** — which is related to its internal state, but not identical. **Tuned lens is more reliable**, but neither gives a direct view of "thoughts."

### MC7: "Interpretability is mostly useful for academic understanding, not safety."
**Reality:** false. **Interpretability is increasingly used for safety**: detecting deception via SAE features (Templeton 2024); locating dangerous capability circuits; verifying alignment at the mechanistic level. **The discipline is shifting from understanding to verification.**

### MC8: "Once we have good interpretability, we'll fully understand the model."
**Reality:** uncertain. **Even with perfect circuits and SAEs, the model's high-level behavior may not decompose into human-interpretable terms.** Complexity could exceed our ability to summarize. **Interpretability's deliverable may be a partial map**, not a complete one.

---

## Tricky implementation details

### TID1: Probe overfitting
A linear probe with thousands of parameters can fit small datasets perfectly even if the concept isn't really there. **Regularization, cross-validation, and held-out test sets** are essential. **Probe baselines** (random vectors, untrained models) catch spurious successes.

### TID2: Which layer matters?
Concepts emerge at different layers. **Probing every layer** is standard practice; the layer with peak accuracy varies by concept. Some concepts (token identity) emerge early; others (task-specific) emerge late.

### TID3: SAE training dynamics
SAEs are sensitive to: learning rate, sparsity coefficient (λ), hidden layer width, dead features (features that never activate). **Hyperparameter tuning is a major part of SAE work.** Anthropic's recipes are public starting points but require adaptation.

### TID4: Dead features and feature splitting
- **Dead features**: SAE features that never activate; wasted capacity
- **Feature splitting**: increasing width sometimes splits one feature into many (more specific); sometimes redundant copies emerge

Both indicate incomplete training; experienced practitioners adjust accordingly.

### TID5: Activation caching vs streaming
Running probes or SAEs at scale requires running the model many times. **Caching activations once** for an entire dataset can speed things up 10-100x but uses lots of disk. **Streaming activations** is more memory-friendly but slower.

### TID6: Cross-model interpretability transfer
Probes and SAEs trained on one model rarely transfer cleanly to another. **Even fine-tunes of the same base model can have shifted representations.** Interpretability work is typically per-model.

### TID7: Counterfactual constructions
For activation patching, you need **paired clean/corrupted prompts** where you can verify a specific information difference. Constructing these well is a craft — bad pairs leak information through unintended channels.

### TID8: Distribution effects
Probes trained on in-distribution data can fail completely out-of-distribution. **A "deception" probe trained on movie reviews** may not detect deception in chat conversations. **Distribution-matched evaluation** is essential.

### TID9: Causal sufficiency vs necessity
- **Necessity**: removing a component breaks the behavior
- **Sufficiency**: the component alone (in a small model) implements the behavior

**Both are useful; they answer different questions.** Activation patching primarily tests necessity.

### TID10: Interpreting SAE features
A feature might activate on "things that are red" or it might activate on "things that are red AND in the context of fruit." **Determining a feature's exact concept** requires examining many activating examples — often hundreds. This labor remains substantial.

---

## Reference implementations

### Linear probe (the foundational technique)

```python
import numpy as np

# A linear probe: train a logistic regression on hidden-state vectors
# to predict a binary concept.

def train_linear_probe(hidden_states, labels, n_iterations=500, lr=0.01):
    """
    hidden_states: shape (N, d) — N examples of hidden vectors
    labels: shape (N,) — binary 0/1 labels
    
    Returns: weight vector w of shape (d,) and bias b
    """
    N, d = hidden_states.shape
    
    # Initialize
    np.random.seed(0)
    w = np.random.randn(d) * 0.01
    b = 0.0
    
    # Train via gradient descent on logistic loss
    for _ in range(n_iterations):
        logits = hidden_states @ w + b           # shape (N,)
        probs = 1 / (1 + np.exp(-logits))         # sigmoid
        # Gradient of cross-entropy loss
        grad_w = hidden_states.T @ (probs - labels) / N
        grad_b = (probs - labels).mean()
        w -= lr * grad_w
        b -= lr * grad_b
    
    return w, b


def probe_accuracy(hidden_states, labels, w, b):
    logits = hidden_states @ w + b
    preds = (logits > 0).astype(int)
    return (preds == labels).mean()


# Mock: pretend we have hidden states from a 256-dim layer
np.random.seed(7)
N, d = 200, 256

# Create a synthetic "concept": a specific direction
true_direction = np.random.randn(d)
true_direction /= np.linalg.norm(true_direction)

# Generate hidden states with the concept aligned to its direction
hidden_states = np.random.randn(N, d) * 0.5
# Inject the concept for half the examples
labels = np.zeros(N, dtype=int)
labels[N // 2:] = 1
hidden_states[N // 2:] += true_direction * 1.5

# Train probe
w, b = train_linear_probe(hidden_states, labels)
acc = probe_accuracy(hidden_states, labels, w, b)
print(f"Probe accuracy: {acc:.2%}")

# Compare to baselines
random_baseline = np.mean(labels == np.random.randint(0, 2, N))
print(f"Random baseline:  {random_baseline:.2%}")

# How aligned is the probe's learned direction to the true direction?
w_normed = w / np.linalg.norm(w)
alignment = abs(np.dot(w_normed, true_direction))
print(f"Direction alignment with true: {alignment:.3f}")

# Observations:
# - Probe achieves high accuracy because the concept is linearly decodable
# - The learned weight direction is nearly aligned with the true direction
# - This is the foundational technique: train a tiny classifier, get a direction
# - Real probes operate on hidden states from a frozen LLM, not synthetic data
```

### Sparse autoencoder (toy version)

```python
import numpy as np

# A tiny sparse autoencoder.
# Real SAEs operate on residual stream activations (d ≈ 512-4096) with
# wider hidden dims (D = 8x-128x d) and millions of training examples.
# This toy version: d=32, D=128, 500 examples.

np.random.seed(11)
d = 32       # activation dim
D = 128      # SAE hidden dim (wide)
N = 500      # training examples

# Synthesize input activations from a small number of true "features"
n_true_features = 12
true_features = np.random.randn(n_true_features, d)
true_features /= np.linalg.norm(true_features, axis=1, keepdims=True)

# Each example: a sparse combination of true features
X = np.zeros((N, d))
for i in range(N):
    active = np.random.choice(n_true_features, size=2, replace=False)
    coeffs = np.random.rand(2)
    X[i] = coeffs[0] * true_features[active[0]] + coeffs[1] * true_features[active[1]]
X += np.random.randn(N, d) * 0.05   # small noise

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
    # Encode
    pre_activation = X @ W_enc.T + b_enc           # (N, D)
    f = np.maximum(0, pre_activation)              # ReLU; (N, D)
    
    # Decode
    x_hat = f @ W_dec.T + b_dec                    # (N, d)
    
    # Loss = reconstruction + sparsity
    recon_loss = np.mean(np.sum((X - x_hat) ** 2, axis=1))
    sparsity_loss = sparsity_lambda * np.mean(np.sum(f, axis=1))
    total_loss = recon_loss + sparsity_loss
    
    # Gradients (manual)
    dx_hat = -2 * (X - x_hat) / N                  # (N, d)
    dW_dec = dx_hat.T @ f
    db_dec = dx_hat.sum(axis=0)
    df = dx_hat @ W_dec + sparsity_lambda / N
    df_pre = df * (pre_activation > 0)
    dW_enc = df_pre.T @ X
    db_enc = df_pre.sum(axis=0)
    
    # Update
    W_enc -= lr * dW_enc
    b_enc -= lr * db_enc
    W_dec -= lr * dW_dec
    b_dec -= lr * db_dec
    
    if step % 300 == 0:
        active_features = (f > 0.01).any(axis=0).sum()
        avg_active_per_input = (f > 0.01).sum(axis=1).mean()
        print(f"step {step:>4}  recon_loss {recon_loss:.4f}  "
              f"sparsity {avg_active_per_input:>4.1f} active/input  "
              f"{active_features} live features of {D}")

# Final report
final_f = np.maximum(0, X @ W_enc.T + b_enc)
live_features = (final_f > 0.01).any(axis=0).sum()
print(f"\\nTrained SAE:")
print(f"  Live features: {live_features} of {D}")
print(f"  Sparsity:      {(final_f > 0.01).sum(axis=1).mean():.1f} active per input")
print(f"  (True n_features = {n_true_features}; the SAE should approximate this.)")

# Observations:
# - The SAE is wider than the input (D > d) — room to un-pack superposition
# - Sparsity penalty forces few features active per input
# - Trained SAE recovers approximately the original feature count
# - In real SAEs, each live feature corresponds to an interpretable concept
```

### Activation patching (causal intervention sketch)

```python
import numpy as np

# Mock model: a simple two-layer "transformer" with handcrafted behavior.
# In reality, activation patching operates on real transformer hidden states.

# Layer 1: encodes input to a representation
def layer1(x):
    return np.tanh(x)

# Layer 2: produces "output" based on representation
def layer2(h):
    return h @ np.array([0.5, -0.5, 0.3])

def model_forward(x):
    h1 = layer1(x)
    out = layer2(h1)
    return h1, out


# Two prompts: clean produces correct answer; corrupted produces wrong.
np.random.seed(42)
clean_input = np.array([1.0, 0.5, -0.5])
corrupt_input = np.array([-1.0, 0.5, -0.5])      # only first dim differs

# Run both
h1_clean, out_clean = model_forward(clean_input)
h1_corrupt, out_corrupt = model_forward(corrupt_input)

print(f"Clean output:     {out_clean:.4f}")
print(f"Corrupted output: {out_corrupt:.4f}")
print(f"Difference:       {out_clean - out_corrupt:.4f}\\n")

# Activation patching: replace layer1's output for the corrupted input
# with layer1's output from the clean input. If the corrupted output now
# matches the clean output, then layer1's output carries the relevant info.

def patched_forward(x_to_use, h1_to_use):
    """Compute output using x_to_use for layer1, but override h1 with h1_to_use."""
    out = layer2(h1_to_use)
    return out

# Patch: feed corrupted input to layer 1, but use clean's h1 for layer 2
patched_out = patched_forward(corrupt_input, h1_clean)
print(f"After patching layer1 (clean -> corrupted):")
print(f"  Patched output: {patched_out:.4f}")
print(f"  Matches clean?  {np.isclose(patched_out, out_clean)}")
print(f"  Conclusion:     Layer1's output carries the relevant information.")
print()

# Patch in the other direction: corrupted's h1 into clean's pipeline
unpatched_out = patched_forward(clean_input, h1_corrupt)
print(f"After patching layer1 (corrupted -> clean):")
print(f"  Patched output: {unpatched_out:.4f}")
print(f"  Matches corrupted? {np.isclose(unpatched_out, out_corrupt)}")
print(f"  Conclusion:        Yes — overriding layer1 fully controls the output.")

# Observations:
# - Patching layer1's output transfers the relevant information completely
# - This identifies layer1 as the location where the difference is computed
# - Real activation patching is more nuanced: tests heads, MLPs, individual neurons
# - The same logic: clean vs corrupted; patch; measure transfer of behavior
```

---

## Connections to other chapters

- **Ch 4 (Transformer architecture)**: residual stream, attention heads, MLPs — the substrate interp examines
- **Ch 6 (Embeddings)**: probe directions are analogous to embedding directions
- **Ch 14 (Post-training)**: RLHF reshapes the representation space — what does that look like internally?
- **Ch 20 (Reasoning)**: where do reasoning capabilities live in the weights?
- **Ch 22 (RAG)**: does retrieval-augmentation change internal computations? (open question)
- **Ch 24 (Safety)**: interpretability is the verification arm of safety; the immediate predecessor
- **Ch 26 (Evaluation)**: interp without measurement isn't actionable; the immediate sequel
- **Ch 27-30 (Agents)**: interpretability of agentic behaviors is largely open territory

---

## Open questions for the chapter author

### Q1: How much math?
**Recommendation:** moderate. Show the SAE loss equation, the superposition equation, and one probe-training equation. **Don't derive everything**; engineers will read papers if they want depth.

### Q2: How much philosophy?
**Recommendation:** minimal. The chapter is engineering-focused. **Mention that interpretability connects to questions about model behavior**; don't dive into consciousness or representation philosophy.

### Q3: SAE depth?
**Recommendation:** substantial. SAEs are the chapter's most actionable modern technique. **Explain the recipe in detail** — width, sparsity, training. **Show what features look like** (sanitized examples from Templeton 2024).

### Q4: Mechanistic interpretability depth?
**Recommendation:** moderate. Cover circuits conceptually with concrete examples (induction heads, IOI). **Don't go too deep into specific circuits** — they're more for specialists.

### Q5: Causal interventions depth?
**Recommendation:** moderate. Cover the techniques (logit lens, activation patching, ROME) with the methodology. **The conceptual move from probes to interventions is the key teaching**.

### Q6: How honest about open problems?
**Recommendation:** very. **Interpretability is rapidly progressing but far from solved.** The chapter should reflect this — readers should leave knowing what the field can and can't do.

### Q7: Widget candidates
1. **SAE Feature Explorer (marquee):** an interactive feature browser. Pick from a curated set of 8-12 example features (each labeled with its activating concept); see the top-K activating inputs for that feature; see related features. **Recommended marquee.** Conveys the SAE → monosemantic features pipeline.
2. **Linear Probing Visualizer (secondary):** show how a linear classifier reads a concept off hidden states across layers. Reader picks a concept (sentiment, syntax, named entity); sees probe accuracy by layer. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 25 is a **single-topic chapter**. Uses the **4-file cadence**.

Planned file layout:
- File 140: research (this)
- File 141: page structure (~750 lines, 8 sections; runnables embedded)
- File 142: SAE Feature Explorer marquee widget
- File 143: Linear Probing Visualizer secondary widget + exercises + closeout (slot 144 absorbed)

**Pedagogical outcomes for the reader.** After Ch 25, the reader should be able to:
1. Articulate the interpretability question — what the model is computing internally
2. Describe linear probing and what it can/can't tell you
3. Explain polysemanticity and superposition as the obstacles to neuron-level interpretation
4. Describe sparse autoencoders as a path through superposition
5. Recognize circuits as small weight subgraphs implementing specific computations
6. Apply causal interventions (logit lens, activation patching) to verify hypotheses
7. Assess the current state of interpretability: what works, what's open
8. Connect interpretability to safety (verification) and evaluation (measurement)

Eight outcomes. Exercises hit outcomes 2, 4, 6, 7.

**Tonal framing**: empirical research with operational honesty. **Interpretability is making real progress but is not a solved science.** Concrete numbers (probe accuracies; SAE feature counts in millions; ~25 attention heads in the IOI circuit; circuits found in dozens of papers) and honest open problems (coverage, scale, automation, verification). **Anthropic's SAE work** is the modern reference — the chapter centers it without overpromising.

**Part VIII progression**: Ch 25 is the **middle** chapter of Part VIII. Ch 24 set up "what we want;" Ch 25 covers "what's actually there;" Ch 26 will cover "how to measure both." Section 8 should bridge to Ch 26.

**Importance**: interpretability is the **only known route to mechanistic verification** of alignment claims — particularly important post-sleeper-agents (Ch 24). For engineers, interpretability tools are increasingly used in production (Anthropic's monitoring, OpenAI's interp team, deployed feature-clamping). **This chapter is the working-engineer's introduction to a rapidly-evolving field.**
