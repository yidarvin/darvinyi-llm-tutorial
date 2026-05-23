# Chapter 11 — Mixture of Experts (MoE): research

> Curated source material for Chapter 11's build sessions. The first chapter of Phase 10 — alternative architectures. Where Ch 1-6 established the *standard* dense transformer, Ch 11 covers the most significant architectural variant of the modern era: **Mixture of Experts (MoE)**. Replace the dense feed-forward block with a sparse pattern — many small "expert" sub-networks plus a router that picks which experts to use per token. The result: dramatically more parameters at roughly the same FLOPs per token. Used by Mixtral, DeepSeek-V2/V3, GLaM, Switch Transformer, and reportedly GPT-4. **Single-topic chapter** — uses the **4-file cadence**.

---

## Scope reminder (from CURRICULUM.md)

**Chapter title:** Mixture of Experts (MoE)

**Premise:** Standard dense transformers (Ch 1-6) have a fundamental scaling problem: doubling parameters doubles FLOPs per token. MoE breaks this coupling — most parameters are inactive per token (sparse activation), letting you scale parameter count much faster than FLOPs. The Switch Transformer (2021), Mixtral 8x7B (2024), and DeepSeek-V3 (2024) demonstrate the pattern at scale. **MoE is the dominant architectural innovation of 2022-2024.**

**Out of scope (other chapters):**
- The dense transformer block (Ch 5)
- Alternative architectures beyond MoE (Mamba, state-space) — Ch 12 covers these
- Training (Ch 7-10)
- Post-training (Ch 13+)

**In scope and locked:**
- **The motivation**: scale parameters without scaling FLOPs
- **The MoE block**: router + N experts, replacing the standard FFN
- **Top-k routing**: how the router decides which experts process each token (softmax gating, top-k selection)
- **Load balancing**: the central practical challenge (router collapse, auxiliary losses)
- **Expert capacity and dropped tokens**: what happens when experts overflow
- **Modern MoE variants**:
  - **Switch Transformer** (Fedus et al. 2022): top-1 routing, simplicity
  - **GLaM** (Du et al. 2021): top-2 routing, sparser activation
  - **Mixtral 8x7B** (Jiang et al. 2024): top-2 of 8 experts, the open-weights breakthrough
  - **DeepSeek-MoE** (2024): fine-grained experts + shared experts
- **Communication patterns**: all-to-all collectives for distributed MoE
- **MoE training challenges**: instability, expert collapse, fine-tuning difficulties
- **Active vs total parameters**: the key inference economics

**Suggested chapter structure** (8 sections):

1. The setup — scaling parameters without scaling FLOPs (~400 words)
2. The MoE block — router + experts (~700 words — central architecture)
3. Top-k routing — the gating function (~700 words — central math)
4. Load balancing — the practical hard problem (~600 words)
5. Expert capacity and dropped tokens (~500 words)
6. Modern MoE variants — Switch, GLaM, Mixtral, DeepSeek-MoE (~600 words)
7. Why MoE is hard — instability, serving, fine-tuning (~500 words)
8. Bridge to alternative architectures (~300 words)

Target: ~4300 words plus 2 widgets and 3-4 runnable code blocks.

---

## Key papers and references

### Shazeer et al. 2017 — "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer"
- **arXiv:** [1701.06538](https://arxiv.org/abs/1701.06538)
- **What it contributed:** the **original sparse MoE layer** for deep learning. Trained 137-billion-parameter models in 2017 (an enormous number for the time) by sparse activation. Introduced the **gating function** + **top-k routing** + **auxiliary loss** pattern that all modern MoE follows.
- **For the chapter:** the foundational reference. Cite when introducing routing and the load-balancing problem.

### Fedus et al. 2022 — "Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity"
- **arXiv:** [2101.03961](https://arxiv.org/abs/2101.03961)
- **What it contributed:** **Switch Transformer** — top-1 routing (just one expert per token). Simpler than top-k; surprisingly competitive. Demonstrated trillion-parameter MoE training. Also introduced **expert capacity** as a formal concept.
- **For the chapter:** central reference for top-1 routing and capacity. The simplicity of Switch makes it the cleanest pedagogical case.

### Lepikhin et al. 2020 — "GShard: Scaling Giant Models with Conditional Computation and Automatic Sharding"
- **arXiv:** [2006.16668](https://arxiv.org/abs/2006.16668)
- **What it contributed:** **GShard** — large-scale MoE infrastructure for Google translation models. Introduced **all-to-all communication patterns** for distributed MoE; demonstrated expert parallelism alongside data parallelism.
- **For the chapter:** brief reference for distributed MoE patterns.

### Du et al. 2021 — "GLaM: Efficient Scaling of Language Models with Mixture-of-Experts"
- **arXiv:** [2112.06905](https://arxiv.org/abs/2112.06905)
- **What it contributed:** **GLaM** (Generalist Language Model) — 1.2T-parameter MoE language model. Demonstrated that MoE could match dense models on language modeling at ~1/3 the FLOPs. **Top-2 routing** became the de facto standard after GLaM.
- **For the chapter:** central reference for top-2 routing.

### Jiang et al. 2024 — "Mixtral of Experts"
- **arXiv:** [2401.04088](https://arxiv.org/abs/2401.04088)
- **What it contributed:** **Mixtral 8x7B** — the breakthrough open-weights MoE. 46.7B total parameters, 12.9B active per token (top-2 of 8 experts in each MoE layer). Demonstrated MoE working at "modern open-source scale." Often outperforms Llama-2 70B at fraction of inference cost.
- **For the chapter:** the canonical modern example. Use as the running case study in section 6.

### DeepSeek-AI 2024 — "DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models"
- **arXiv:** [2401.06066](https://arxiv.org/abs/2401.06066)
- **What it contributed:** **DeepSeekMoE** — innovations like fine-grained experts (split each expert into many smaller experts) and shared experts (some experts always active). Demonstrated finer-grained MoE outperforms standard MoE.
- **For the chapter:** modern refinement. Mention as evolution of the basic MoE pattern.

### DeepSeek-AI 2024 — "DeepSeek-V3 Technical Report"
- **arXiv:** [2412.19437](https://arxiv.org/abs/2412.19437)
- **What it contributed:** **DeepSeek-V3** — 671B total parameters, 37B activated per token. State-of-the-art open-weights MoE in late 2024. Includes auxiliary-loss-free load balancing innovations.
- **For the chapter:** brief mention as current frontier.

### Zoph et al. 2022 — "ST-MoE: Designing Stable and Transferable Sparse Expert Models"
- **arXiv:** [2202.08906](https://arxiv.org/abs/2202.08906)
- **What it contributed:** **ST-MoE** — systematic study of MoE training stability. The "router z-loss" auxiliary objective to prevent extreme router activations. Critical for stable large-scale MoE training.
- **For the chapter:** brief reference in section 7 (training challenges).

---

## Core derivations

### Derivation 1: The MoE block

**Standard dense transformer block (from Ch 5):**
$$y = x + \text{Attention}(\text{LN}_1(x))$$
$$z = y + \text{FFN}(\text{LN}_2(y))$$

where FFN is a dense feed-forward:
$$\text{FFN}(x) = W_2 \cdot \text{GeLU}(W_1 x)$$

with $W_1 \in \mathbb{R}^{4d \times d}$ and $W_2 \in \mathbb{R}^{d \times 4d}$. **Always all parameters active**.

**MoE block** replaces the FFN with a sparse mixture:
$$\text{MoE}(x) = \sum_{i=1}^N g_i(x) \cdot \text{FFN}_i(x)$$

where:
- There are $N$ experts, each a separate FFN with its own parameters
- $g_i(x) \in [0, 1]$ is the **gate value** for expert $i$ on input $x$
- The gates are computed by a **router**: $g(x) = \text{softmax}(W_r x)$ for routing weights $W_r \in \mathbb{R}^{N \times d}$

**Critical**: most gate values are zeroed out via **top-k selection** — only the top $k$ experts contribute. Typical: $k = 1$ (Switch) or $k = 2$ (most modern MoE).

### Derivation 2: Top-k routing — the gating function

**Step 1**: compute logits for all $N$ experts.
$$\ell(x) = W_r x \in \mathbb{R}^N$$

**Step 2**: pick the top-k experts.
$$\text{top}_k(\ell) = \{i_1, i_2, \ldots, i_k\}$$ (indices of the $k$ largest logits)

**Step 3**: softmax only over the selected experts.
$$g_{i_j}(x) = \frac{\exp(\ell_{i_j})}{\sum_{j'=1}^k \exp(\ell_{i_{j'}})}, \quad g_i(x) = 0 \text{ for } i \notin \text{top}_k(\ell)$$

**Step 4**: combine expert outputs.
$$\text{MoE}(x) = \sum_{i=1}^N g_i(x) \cdot \text{FFN}_i(x)$$

In practice, only the top-$k$ experts' FFNs are computed (the others have $g_i = 0$).

**Important property**: only $k$ experts of $N$ are active per token. **FLOPs per token = $k \times \text{FFN cost}$**, independent of total $N$. Doubling $N$ doubles total parameters but doesn't change per-token FLOPs.

```mdx
<Equation label="11.moe">
$$\text{MoE}(x) = \sum_{i \in \text{top}_k(\ell)} g_i(x) \cdot \text{FFN}_i(x), \quad g_i(x) = \text{softmax}(W_r x)_i$$
</Equation>
```

### Derivation 3: The active-vs-total parameter ratio

For an MoE layer with $N$ total experts, top-$k$ routing, and FFN size $d_{\text{ffn}} = 4d$:

**Total parameters**: $N$ experts × FFN size = $N \cdot 8 d^2$ (FFN has 2 matrices, each $4d \times d$).
**Active parameters per token**: $k$ experts × FFN size = $k \cdot 8 d^2$.

**Sparsity ratio**: $k / N$. For Mixtral 8x7B: $k=2, N=8$, sparsity = 0.25. Only 25% of MoE parameters active per token.

**For Mixtral 8x7B specifically:**
- Total parameters: 46.7B
- Active parameters per token: ~12.9B
- Sparsity: 12.9 / 46.7 ≈ 28%

**This is the key inference economics:** Mixtral has *more* parameters than Llama-2 13B but uses *fewer per token* than Llama-2 70B. Higher quality at lower per-token cost.

### Derivation 4: Load balancing — the auxiliary loss

**The problem**: nothing forces the router to use all experts. In practice, untrained routers send most tokens to a few "favored" experts, leaving most experts unused. This is **router collapse**.

**The fix**: an **auxiliary loss** that encourages balanced expert usage.

Define:
- $f_i$ = fraction of tokens routed to expert $i$ (out of all tokens in the batch)
- $P_i$ = average probability the router assigns to expert $i$ (over all tokens)

**The Switch Transformer auxiliary loss:**
$$\mathcal{L}_{\text{aux}} = \alpha \cdot N \cdot \sum_{i=1}^N f_i \cdot P_i$$

where $\alpha$ is a balance coefficient (typically 0.01).

**Intuition**: this loss is minimized when both $f_i$ and $P_i$ are uniform ($1/N$ each), in which case $\mathcal{L}_{\text{aux}} = \alpha$. Imbalanced routing has higher loss.

**Added to the main training objective**: $\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{LM}} + \mathcal{L}_{\text{aux}}$. The router learns to balance expert usage as part of training.

### Concept: Expert capacity and dropped tokens

**The problem**: even with balanced routing, expert assignments in a single batch can be uneven. Some batches might send too many tokens to one expert, exceeding its compute capacity.

**Expert capacity** $C$ = the maximum number of tokens an expert can process per batch. If more than $C$ tokens are routed to an expert, the excess is **dropped** (passed through via residual without expert processing).

**Capacity factor** $\rho$: $C = \rho \cdot (T / N)$, where $T$ is total tokens and $N$ is expert count. Typical $\rho = 1.0$ to $1.25$. Higher $\rho$ reduces drops but wastes capacity; lower $\rho$ is efficient but drops more.

**Dropped tokens are a real cost**: they skip expert processing entirely, going through the residual connection without contributing computed features. Too many drops degrade model quality.

### Concept: All-to-all communication

**Distributed MoE setup**: experts are placed on different GPUs (**expert parallelism**). Routing decisions are made per-token; routed tokens must travel to their assigned expert's GPU.

**Two phases per MoE layer**:
1. **Forward all-to-all**: each GPU has its tokens; it must send each token to the GPU hosting its assigned expert. All-to-all collective.
2. **Reverse all-to-all**: experts' outputs are sent back to the tokens' origin GPUs.

**Cost**: all-to-all is the most communication-intensive collective. For $n$ GPUs, all-to-all communicates $O(n)$ data per GPU. The communication cost can dominate at scale.

This is why MoE training requires careful infrastructure design — networks (NVLink + InfiniBand) and software (NCCL all-to-all, GShard) matter as much for MoE as parallelism strategy does for dense models.

### Concept: MoE variants timeline

**Switch Transformer (2021, Fedus et al.)**: top-1 routing. The simplest MoE. One expert per token; no convex combination. Easy to implement; train stable.

**GLaM (2021, Du et al.)**: top-2 routing. More expressive than top-1; small extra FLOPs cost. Became the de facto modern standard.

**Mixtral 8x7B (2024, Jiang et al.)**: 8 experts per layer, top-2 routing. Open weights. Demonstrated MoE at "useful production scale." Roughly matches Llama-2 70B at much lower inference cost.

**DeepSeek-MoE (2024)**: fine-grained experts (more experts, each smaller) + shared experts (some experts always active, capturing common features). Outperforms standard MoE at same total parameter count.

**DeepSeek-V3 (Dec 2024)**: 671B total parameters, 37B active. Current open-weights frontier. Introduces auxiliary-loss-free load balancing.

**Reportedly GPT-4**: speculated to be a large MoE (~1.7T total parameters), though architectural details are not public.

---

## Glossary

- **MoE (Mixture of Experts)**: an architectural pattern where the FFN is replaced by a sparse mixture of expert sub-networks.
- **Expert**: a single FFN within the MoE layer. Each layer has $N$ experts.
- **Router (gating network)**: small learned network that decides which experts to use per token.
- **Top-k routing**: select the $k$ experts with the highest router logits for each token.
- **Top-1 routing**: $k=1$ (Switch Transformer).
- **Top-2 routing**: $k=2$ (GLaM, Mixtral, most modern MoE).
- **Active parameters**: parameters actually computed per token. For MoE: $k$ experts' parameters.
- **Total parameters**: all parameters in the model. For MoE: includes all $N$ experts.
- **Sparsity ratio**: $k / N$, the fraction of experts active per token.
- **Auxiliary loss**: additional training loss for load balancing. Penalizes uneven expert usage.
- **Expert capacity**: max number of tokens an expert can process per batch.
- **Capacity factor**: $\rho$, the multiplier on the average expert load.
- **Dropped tokens**: tokens that exceed an expert's capacity and skip expert processing.
- **Router collapse**: failure mode where the router sends most tokens to a few "favored" experts.
- **Expert parallelism**: distributing experts across GPUs.
- **All-to-all communication**: collective operation where every GPU sends data to every other GPU.
- **Shared experts**: experts that are always active (DeepSeek-MoE innovation).
- **Fine-grained experts**: many small experts (vs few large experts).

---

## Pedagogical analogies

### 1. MoE as "specialists vs generalists"
A dense FFN is one generalist — every neuron sees every input. MoE has many specialists — each expert sees only the tokens routed to it. Over training, experts naturally specialize: some learn syntax, some learn factual knowledge, some learn code, etc. The router becomes a "receptionist" that knows which specialist to consult for each token.

**Best used for:** section 2 introducing the MoE block.

### 2. Router as "consulting firm receptionist"
The router doesn't do the work — it directs the work to specialists. The receptionist (router) reads each request (token) and assigns it to the best 1 or 2 consultants (experts). The consultants then do the actual work. The receptionist's job is *just* to pick — and pick well.

**Best used for:** section 3 introducing top-k routing.

### 3. Load balancing as "fair scheduling at a hospital"
A hospital with 10 specialists shouldn't send every patient to one doctor while the others sit idle. Load balancing in MoE is the same problem: don't let the router send all tokens to one expert. The auxiliary loss is the management directive: "spread the work."

**Best used for:** section 4 introducing the auxiliary loss.

### 4. Active vs total parameters as "library books"
A library has 100,000 books (total parameters). You only check out 10 at a time (active parameters). The library "knows" 100K books worth of information, but each user only sees 10. MoE inference is the same: many parameters total; few accessed per token.

**Best used for:** section 6 (parameter economics).

---

## Common misconceptions

### MC1: "MoE has more parameters → more compute per token."
**Reality:** **MoE decouples parameters from compute**. Active parameters per token = $k$ experts' FFN size, regardless of total $N$. Doubling $N$ doubles total parameters but **does not change FLOPs per token**. This is the entire reason MoE matters.

### MC2: "MoE is just an ensemble of models."
**Reality:** an ensemble runs all models in parallel and averages their outputs. MoE picks the top-$k$ experts and uses only those — typically $k=2$ out of $N=8$, so 75% of experts are *not used* per token. The sparsity is the point.

### MC3: "MoE always outperforms dense models."
**Reality:** MoE wins on **parameters-per-FLOP** but not always on **parameters-per-quality**. Quality scaling per parameter is *worse* for MoE than dense. The right comparison is **at the same training compute**: MoE typically matches dense at lower per-token inference cost. At very small scale, dense is simpler and equally good.

### MC4: "Mixtral 8x7B is 56B parameters used per inference."
**Reality:** Mixtral 8x7B has **46.7B total parameters** (not 56B) because experts share embedding/attention/output layers. **Active parameters per token are ~12.9B** (2 of 8 experts in each MoE layer). The "active per token" number is what determines inference cost.

### MC5: "More experts is always better."
**Reality:** there's a sweet spot. Too few experts (e.g., 2 of 4) → not much sparsity benefit. Too many experts (e.g., 8 of 256) → load balancing becomes hard; experts under-train. Modern MoE typically uses 8-64 experts per layer; DeepSeekMoE's fine-grained approach (256+ experts) requires sophisticated load balancing.

### MC6: "MoE replaces dense models."
**Reality:** **they coexist with different trade-offs**. Dense: simpler, more stable training, easier serving, better at small scale. MoE: more parameters at same FLOPs, better quality-per-inference-cost at large scale, harder to train and serve. Choice depends on use case.

### MC7: "Router collapse is solved by the auxiliary loss."
**Reality:** the aux loss helps but doesn't fully solve. Modern MoE still requires careful initialization, learning rate tuning, and sometimes additional techniques (router z-loss from ST-MoE, expert dropout, etc.) to prevent collapse. DeepSeek-V3 recently introduced auxiliary-loss-free load balancing that works *better* than the standard auxiliary loss approach.

---

## Tricky implementation details

### TID1: Top-k softmax — softmax over selected or over all?
**Standard approach**: softmax over the top-$k$ selected logits only (not over all $N$). This produces normalized gate values $\sum g_i = 1$ across the selected experts.

**Alternative**: softmax over all $N$, then mask the bottom $N-k$ to zero (no renormalization). Different gradient flow; some papers use this. Mixtral uses softmax-over-top-k.

### TID2: Router logits in higher precision
The router operates on small values (just $W_r x$); softmax is numerically sensitive. Keep router computation in FP32 even when the rest of the model is in BF16. Otherwise, router instability triggers training collapse.

### TID3: Auxiliary loss balance coefficient
The $\alpha$ in the aux loss is a hyperparameter. Switch Transformer used 0.01. Too small: weak load balancing, collapse risk. Too large: dominates the training signal, hurts language modeling quality. Tune by ablation.

### TID4: Expert capacity calculation
Capacity must be set carefully for stable training. Too low: many drops, model can't learn. Too high: wasted compute on empty slots. Typical: $\rho = 1.0$ at inference, $\rho = 1.25$ at training (training has more variance in routing).

### TID5: Expert parallelism and load imbalance
When experts are sharded across GPUs, GPUs with more-popular experts get more work. Even with auxiliary loss, residual imbalance hurts MFU. Modern systems use **expert parallelism + replication** (popular experts replicated on multiple GPUs) at scale.

### TID6: Shared experts and modulation
DeepSeek-MoE's shared experts always run. This means the FFN computation = shared expert + routed expert(s). The shared expert captures "common knowledge"; the routed experts capture specialization. Improves stability and quality.

---

## Reference implementations

### MoE block forward pass (numpy)

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    return np.exp(x) / np.exp(x).sum(axis=axis, keepdims=True)

def moe_forward(x, router_W, expert_W1s, expert_W2s, k=2):
    """
    MoE forward pass for a sequence of tokens.
    
    x:           (seq_len, d_model) — input
    router_W:    (num_experts, d_model) — router weights
    expert_W1s:  (num_experts, d_ffn, d_model) — first FFN matrix per expert
    expert_W2s:  (num_experts, d_model, d_ffn) — second FFN matrix per expert
    k:           top-k routing
    
    Returns: (seq_len, d_model)
    """
    seq_len, d_model = x.shape
    num_experts = router_W.shape[0]

    # Router logits: (seq_len, num_experts)
    router_logits = x @ router_W.T

    # Top-k selection per token
    top_k_indices = np.argsort(router_logits, axis=-1)[:, -k:][:, ::-1]   # (seq_len, k)
    top_k_logits = np.take_along_axis(router_logits, top_k_indices, axis=-1)
    # Softmax over selected experts only
    gates = softmax(top_k_logits, axis=-1)   # (seq_len, k)

    # Aggregate expert outputs
    output = np.zeros_like(x)
    for t in range(seq_len):
        for j in range(k):
            expert_idx = top_k_indices[t, j]
            gate = gates[t, j]
            # FFN computation for this expert
            h = np.maximum(x[t] @ expert_W1s[expert_idx].T, 0)   # ReLU
            expert_out = h @ expert_W2s[expert_idx].T
            output[t] += gate * expert_out

    return output, top_k_indices, gates

# Demo
np.random.seed(42)
d_model, d_ffn, num_experts = 32, 64, 4
seq_len = 6

x = np.random.normal(0, 1, (seq_len, d_model))
router_W = np.random.normal(0, 0.1, (num_experts, d_model))
expert_W1s = np.random.normal(0, 0.1, (num_experts, d_ffn, d_model))
expert_W2s = np.random.normal(0, 0.1, (num_experts, d_model, d_ffn))

output, indices, gates = moe_forward(x, router_W, expert_W1s, expert_W2s, k=2)

print(f"Output shape: {output.shape}")
print(f"Top-2 expert indices per token:\n{indices}")
print(f"\nGate values per token:\n{gates.round(3)}")
print(f"\nNote: each token routed to {2} of {num_experts} experts.")
print(f"Active parameters per token: {2}/{num_experts} = {2/num_experts:.0%} of expert params.")
```

### Active vs total parameter calculator

```python
def moe_parameter_count(num_experts, k, d_model, d_ffn=None, num_layers=32, attn_d=None):
    """
    Compute total and active parameters for an MoE transformer.
    """
    if d_ffn is None:
        d_ffn = 4 * d_model
    if attn_d is None:
        attn_d = d_model

    # Shared params per layer (attention + layer norms; same for dense and MoE)
    # Attention: 4 * d_model^2 (Q, K, V, O projections)
    attn_params = 4 * d_model * d_model
    # LayerNorm: 2 * d_model per norm; 2 norms per block
    ln_params = 4 * d_model

    # Per-expert FFN: 2 * d_model * d_ffn
    ffn_per_expert = 2 * d_model * d_ffn

    # Per layer:
    moe_layer_total = attn_params + ln_params + num_experts * ffn_per_expert
    moe_layer_active = attn_params + ln_params + k * ffn_per_expert

    # Plus router: num_experts * d_model
    router_params = num_experts * d_model
    moe_layer_total += router_params
    moe_layer_active += router_params   # router always runs

    # Total across all layers
    total = num_layers * moe_layer_total
    active = num_layers * moe_layer_active

    return total, active

# Mixtral 8x7B approximate config
total, active = moe_parameter_count(
    num_experts=8, k=2, d_model=4096, d_ffn=14336, num_layers=32,
)
print(f"Mixtral 8x7B (approx):")
print(f"  Total params:  {total/1e9:.1f}B")
print(f"  Active params: {active/1e9:.1f}B")
print(f"  Sparsity:      {active/total:.0%}")

# Comparison: dense Llama-2 70B
dense_total, dense_active = moe_parameter_count(
    num_experts=1, k=1, d_model=8192, d_ffn=28672, num_layers=80,
)
print(f"\nLlama-2 70B (dense):")
print(f"  Total params:  {dense_total/1e9:.1f}B")
print(f"  Active params: {dense_active/1e9:.1f}B (same as total)")
print(f"\n→ Mixtral 8x7B uses ~12B params per token; Llama-2 70B uses 70B.")
print(f"  Mixtral has lower per-token inference cost despite both being 'large models'.")
```

### Load balancing — the auxiliary loss

```python
def aux_load_balance_loss(router_probs, expert_assignments, num_experts, alpha=0.01):
    """
    Switch Transformer auxiliary load balancing loss.
    
    router_probs:        (num_tokens, num_experts) — softmax of router logits
    expert_assignments:  (num_tokens,) — which expert each token was sent to (top-1 case)
    num_experts:         N
    alpha:               balance coefficient
    
    Returns scalar loss to add to main training objective.
    """
    num_tokens = router_probs.shape[0]

    # f_i: fraction of tokens routed to expert i
    f = np.zeros(num_experts)
    for i in range(num_experts):
        f[i] = np.mean(expert_assignments == i)

    # P_i: average router probability for expert i
    P = np.mean(router_probs, axis=0)

    # Loss: alpha * N * sum(f_i * P_i)
    # Minimized when f and P are both uniform (1/N each)
    loss = alpha * num_experts * np.sum(f * P)
    return loss, f, P

# Demo: balanced vs imbalanced routing
np.random.seed(0)
num_experts, num_tokens = 4, 100

# Case 1: well-balanced routing (uniform across experts)
balanced_probs = np.random.dirichlet([5.0] * num_experts, size=num_tokens)
balanced_assign = np.argmax(balanced_probs, axis=-1)
loss_balanced, f_bal, P_bal = aux_load_balance_loss(balanced_probs, balanced_assign, num_experts)
print(f"Balanced routing:")
print(f"  f (token fractions): {f_bal.round(3)}")
print(f"  P (avg probs):       {P_bal.round(3)}")
print(f"  Aux loss:            {loss_balanced:.5f}\n")

# Case 2: collapsed routing (mostly to expert 0)
collapsed_probs = np.random.dirichlet([10.0, 0.1, 0.1, 0.1], size=num_tokens)
collapsed_assign = np.argmax(collapsed_probs, axis=-1)
loss_collapsed, f_col, P_col = aux_load_balance_loss(collapsed_probs, collapsed_assign, num_experts)
print(f"Collapsed routing (most tokens → expert 0):")
print(f"  f (token fractions): {f_col.round(3)}")
print(f"  P (avg probs):       {P_col.round(3)}")
print(f"  Aux loss:            {loss_collapsed:.5f}")
print(f"\n→ Collapsed routing has higher aux loss; training will push toward balance.")
```

---

## Connections to other chapters

- **Ch 5 (Transformer block):** the MoE block *replaces* the FFN in the standard transformer block. Attention, residuals, and layer norms are unchanged.
- **Ch 7 (Pre-training data):** MoE doesn't change data requirements but does change how loss tokens interact with experts. Some research suggests MoE specializes by *domain* — code experts, math experts, etc.
- **Ch 8 (Training loop):** MoE adds the auxiliary loss to the main training objective. Otherwise the training loop is the same.
- **Ch 9 (Parallelism):** MoE adds **expert parallelism** as a fourth dimension alongside DP / TP / PP. Modern frontier MoE training combines all four.
- **Ch 10 (Infrastructure):** all-to-all collectives are the MoE-specific communication pattern. NCCL all-to-all performance is critical for MoE training throughput.
- **Ch 17 (Inference):** MoE inference is genuinely different from dense — KV cache is the same, but FFN routing changes per token. Specialized inference engines (vLLM, Mistral.rs) have MoE-specific optimizations.

---

## Open questions for the chapter author

### Q1: How deep on routing math?
**Recommendation:** medium. State the softmax-then-top-k formula with a labeled equation. Derive the active-vs-total parameter ratio. Don't derive the gradient of the routing function — that's an implementation detail.

### Q2: Switch (top-1) vs GLaM (top-2) emphasis?
**Recommendation:** introduce top-1 first (simpler, easier to reason about), then top-2 as the modern standard. Mixtral being top-2 is the running case study.

### Q3: How much DeepSeek-MoE?
**Recommendation:** brief mention as the modern evolution. Fine-grained experts + shared experts. Don't deep-dive into auxiliary-loss-free balancing — that's a 2024 innovation that may evolve quickly.

### Q4: Computation savings story
**Recommendation:** emphasize prominently. The "Mixtral 8x7B vs Llama-2 70B" comparison is the cleanest illustration: more total params, fewer active params, better quality-per-inference-cost. This is the chapter's core economic claim.

### Q5: Widget candidates
1. **MoE Routing Visualizer (marquee):** show tokens flowing to experts. Visual: column of tokens on the left; column of experts on the right; lines showing top-2 routing per token. Highlight: which experts each token uses, gate weights, load distribution across experts. **Recommended marquee.**
2. **Active vs Total Parameter Comparison (secondary):** stacked bar chart or comparison cards showing total / active / sparsity for dense models (Llama-2 7B/70B) and MoE models (Mixtral 8x7B, DeepSeek-V3). Sliders for $N$ and $k$ to design custom MoE configurations. **Recommended secondary.**

Recommend both.

---

## Pre-research notes

**Chapter cadence:** Ch 11 is a **single-topic chapter** (MoE architecture). Uses the **4-file cadence**.

Planned file layout:
- File 65: research (this)
- File 66: page structure (~600 lines, 8 sections; runnables embedded)
- File 67: MoE Routing Visualizer marquee widget
- File 68: Active vs Total Parameters secondary widget + exercises + closeout

Original BUILD_ORDER may have more files (68+); will absorb appropriately.

**Pedagogical outcomes for the reader.** After Ch 11, the reader should be able to:
1. State the MoE block equation and contrast with a dense FFN
2. Implement top-k routing (numpy or PyTorch)
3. Compute active vs total parameters for an MoE configuration
4. Explain the load-balancing problem and the auxiliary loss solution
5. Describe expert capacity and dropped tokens
6. Name the major MoE variants (Switch, GLaM, Mixtral, DeepSeek-MoE) and their key features
7. Explain why MoE training is harder than dense training
8. Reason about MoE inference economics (Mixtral vs Llama-2 70B)

Eight outcomes. Exercises hit outcomes 1-2 (implementation), 3 (parameter math), 4 (aux loss).

**This chapter begins Phase 10 — alternative architectures.** Ch 11 (MoE) and Ch 12 (Mamba) are the two major alternatives to dense transformers in 2024. Both deserve careful treatment. After Phase 10 closes, the tutorial enters post-training (Ch 13+) — a different texture.

**Important framing:** MoE is *not* a replacement for dense transformers. Both coexist. The chapter should be honest about MoE's trade-offs: better at scale; harder to train and serve; not always the right choice. **Don't oversell.**
