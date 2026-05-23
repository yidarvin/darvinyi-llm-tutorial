# Session 112 — SAE feature explorer marquee widget

> The marquee Chapter 25 widget. **An interactive SAE feature browser.** Reader picks one of **ten curated monosemantic features** (inspired by Templeton 2024) — Golden Gate Bridge, Python for-loops, code vulnerabilities, deception, scientific reasoning, French language, sycophancy, mathematical equations, emotional distress, refusal patterns — and sees: (a) the **top-K activating inputs** as text snippets with relative-activation bars; (b) a **family badge** (knowledge / code / reasoning / safety-relevant / language / emotional); (c) a **2D feature-space map** showing all ten features clustered by family; (d) the **selected feature's top-3 nearest neighbors** highlighted with cyan rings + connection lines. **The widget that makes Anthropic's SAE breakthrough concrete** — what monosemantic features actually look like, and how decoder geometry exposes relationships between them.

---

## Read first (in this order)

1. **`research/ch25-interpretability/research.md`** — concept 4 (sparse autoencoders) is the source material
2. **`prompts/chapters/ch25-interpretability/session-111-page-structure.md`** — for the section-4 widget placeholder this session fills
3. **`prompts/chapters/ch24-safety/session-108-jailbreak-taxonomy-widget.md`** — for the Phase 14 widget conventions (preset picker + adaptive caption)
4. **`prompts/chapters/ch23-multimodal/session-104-clip-embedding-space-widget.md`** — for the 2D scatter-plot pattern (closest precedent for the feature-space map)

---

## Goal

Replace the `<WidgetFrame title="SAE feature explorer">` placeholder in section 4 with a working interactive widget that:

- Shows a **picker over 10 curated SAE features**, each labeled with its interpretable concept (Golden Gate Bridge, code vulnerabilities, etc.)
- For the active feature, shows:
  - A **family badge** (knowledge / code / reasoning / safety-relevant / language / emotional) — color-coded
  - The **top-5 activating inputs** as text snippets with relative-activation bar charts
  - A **description** explaining what the feature represents
  - A **note** about its discovery context (inspired by Templeton 2024 examples)
- Renders a **2D feature-space map** showing all ten features positioned with family-based clustering
- Highlights the **selected feature** with a cyan ring + label
- Draws **connection lines** to the top-3 nearest features in 2D space
- Provides a **pedagogical caption** below explaining what the reader is seeing

**End state:** section 4 of Chapter 25 has a working marquee widget. After 60 seconds of interaction (clicking through 4-5 features), the reader should be able to articulate: (a) **what a monosemantic feature looks like** — a learned direction that activates on a specific interpretable concept; (b) **how SAE features cluster** — semantically related features end up near each other in feature space; (c) **what kinds of concepts SAEs surface** — concrete facts, code patterns, abstract behaviors, safety-relevant signals; (d) **why this matters** — interpretability surfaces concepts the model uses internally, enabling targeted intervention and verification.

---

## Inputs

State of the repo after session 111:

- `src/pages/ch25-interpretability/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 2 and 4)
- `src/lib/chapters.ts` has Ch 25 as `'draft'`
- No `src/components/widgets/ch25-interpretability/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch25-interpretability/SAEFeatureExplorer.tsx` — the React widget
2. **Create** `src/components/widgets/ch25-interpretability/SAEFeatureExplorer.module.css` — scoped styles
3. **Create** `src/components/widgets/ch25-interpretability/sae-data.ts` — 10 curated features with activating inputs, families, 2D positions
4. **Update** `src/components/widgets/index.ts` — add `SAEFeatureExplorer` export
5. **Update** `src/pages/ch25-interpretability/index.mdx` — replace section-4's `<WidgetFrame>` interior with `<SAEFeatureExplorer client:visible />`

---

## Detailed spec

### 1. `sae-data.ts`

```ts
// src/components/widgets/ch25-interpretability/sae-data.ts

/**
 * Curated SAE features for the explorer widget.
 *
 * Inspired by examples from Templeton et al. 2024
 * ("Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet").
 *
 * Each feature has:
 *  - id, label, description
 *  - family (knowledge / code / reasoning / safety / language / emotional)
 *  - top activating inputs with relative activation strengths (0..1, where 1 = peak)
 *  - 2D position (chosen so family clusters are visible)
 */

export type FeatureFamily =
  | 'knowledge'
  | 'code'
  | 'reasoning'
  | 'safety'
  | 'language'
  | 'emotional';

export interface ActivatingInput {
  text: string;
  activation: number;   // 0..1, normalized to feature's peak
}

export interface SAEFeature {
  id: string;
  label: string;
  family: FeatureFamily;
  description: string;
  /** Top-5 activating inputs (text snippets that trigger the feature). */
  topInputs: ActivatingInput[];
  /** A short note about the feature's context. */
  note: string;
  /** 2D position in feature space — chosen for family clustering. */
  x: number;
  y: number;
}

export const FEATURES: SAEFeature[] = [
  // KNOWLEDGE cluster (top-left in 2D map)
  {
    id: 'golden-gate-bridge',
    label: 'Golden Gate Bridge',
    family: 'knowledge',
    description: 'Activates on text about the Golden Gate Bridge — its history, engineering, and references to San Francisco landmarks.',
    topInputs: [
      { text: 'The Golden Gate Bridge spans the strait between San Francisco Bay and the Pacific.', activation: 1.00 },
      { text: 'Construction of the Golden Gate began in 1933 and finished in 1937.',                activation: 0.92 },
      { text: 'The bridge\'s distinctive "International Orange" color was chosen for visibility.',  activation: 0.81 },
      { text: 'San Francisco\'s skyline is dominated by the Bay Bridge and Golden Gate.',            activation: 0.65 },
      { text: 'Visitors can walk across the pedestrian path on either side of the bridge.',          activation: 0.54 },
    ],
    note: 'Templeton 2024 made this feature famous when Anthropic released "Golden Gate Claude" — a version of Claude where this feature was clamped high, causing it to mention the Golden Gate Bridge constantly. A clean demonstration of feature-level intervention.',
    x: 0.16, y: 0.85,
  },
  {
    id: 'mathematical-equations',
    label: 'Mathematical equations',
    family: 'knowledge',
    description: 'Activates on mathematical notation, equations, and formal symbolic content.',
    topInputs: [
      { text: 'Let \\(f(x) = x^2 + 2x + 1\\). Then \\(f\'(x) = 2x + 2\\).',                          activation: 1.00 },
      { text: 'The integral \\(\\int_0^1 x^2 dx = 1/3\\) by the power rule.',                       activation: 0.94 },
      { text: 'For all \\(\\epsilon > 0\\), there exists a \\(\\delta\\) such that...',             activation: 0.83 },
      { text: 'Theorem 3.1: A continuous function on a compact set is bounded.',                     activation: 0.59 },
      { text: 'Compute the eigenvalues of the matrix \\(\\begin{bmatrix}2 & 1 \\\\ 0 & 3\\end{bmatrix}\\).', activation: 0.51 },
    ],
    note: 'Knowledge-domain features often surface around specific notation systems. The fact that math notation gets its own feature suggests the model uses it as a discrete signal — not just "text that mentions math."',
    x: 0.28, y: 0.75,
  },

  // CODE cluster (top-right)
  {
    id: 'python-loops',
    label: 'Python for-loops',
    family: 'code',
    description: 'Activates on Python `for` loops and the syntactic patterns around iteration.',
    topInputs: [
      { text: 'for i in range(10):\\n    print(i)',                                                  activation: 1.00 },
      { text: 'for item in my_list:\\n    process(item)',                                            activation: 0.91 },
      { text: 'for key, value in dictionary.items():\\n    print(f"{key}: {value}")',                activation: 0.83 },
      { text: 'results = [x**2 for x in numbers if x > 0]',                                          activation: 0.71 },
      { text: 'while iterator.has_next():\\n    n = iterator.next()',                                activation: 0.42 },
    ],
    note: 'Code-pattern features tend to be highly local — this one activates on the `for ... in ...:` pattern with high precision. Other loop constructs (while, comprehensions) activate it more weakly.',
    x: 0.78, y: 0.85,
  },
  {
    id: 'code-vulnerabilities',
    label: 'Code vulnerabilities',
    family: 'code',
    description: 'Activates on code patterns that look like security vulnerabilities: SQL injection, buffer overflows, unchecked user input.',
    topInputs: [
      { text: 'query = "SELECT * FROM users WHERE id = " + user_input',                              activation: 1.00 },
      { text: 'strcpy(buffer, untrusted_data);   // no length check',                                activation: 0.93 },
      { text: 'os.system(f"rm {user_filename}")  # shell injection risk',                            activation: 0.86 },
      { text: 'eval(request.body)   // executing user-supplied code',                                activation: 0.72 },
      { text: 'fopen(user_path, "w")  // path traversal not validated',                              activation: 0.60 },
    ],
    note: 'Templeton 2024 found features for several security-relevant code patterns. These are interpretability\'s most direct safety application: the model can see the patterns; SAEs let us see what it sees.',
    x: 0.86, y: 0.70,
  },

  // REASONING cluster (middle)
  {
    id: 'scientific-reasoning',
    label: 'Scientific reasoning',
    family: 'reasoning',
    description: 'Activates on careful step-by-step reasoning, hypothesis-testing patterns, and causal explanations.',
    topInputs: [
      { text: 'First, let\'s consider the alternative hypotheses. If A is true, then B should follow...', activation: 1.00 },
      { text: 'The data suggests X, but we should rule out confounders before concluding...',          activation: 0.90 },
      { text: 'Step 1: identify the variables. Step 2: form a hypothesis. Step 3: design a test.',     activation: 0.78 },
      { text: 'Given the conditions A and B, we can conclude C, since A implies...',                   activation: 0.65 },
      { text: 'Let me work through this carefully, considering both the direct and indirect effects.', activation: 0.52 },
    ],
    note: 'Abstract behavioral features like this are the most striking SAE finding — the model has a learned representation of "I am reasoning carefully," and this feature activates when that mode is engaged.',
    x: 0.50, y: 0.55,
  },
  {
    id: 'hedging-uncertainty',
    label: 'Hedging and uncertainty',
    family: 'reasoning',
    description: 'Activates on epistemic hedging — "I\'m not sure," "perhaps," "it depends," etc.',
    topInputs: [
      { text: 'I\'m not entirely certain, but my best guess would be that...',                       activation: 1.00 },
      { text: 'It depends on the context — there are a few possibilities here.',                     activation: 0.92 },
      { text: 'Perhaps, though I\'d want to verify this with a primary source.',                     activation: 0.81 },
      { text: 'This is a tentative conclusion; the data could support other interpretations.',         activation: 0.68 },
      { text: 'I could be wrong about this, but my understanding is...',                             activation: 0.58 },
    ],
    note: 'Hedging features are particularly interesting because they correlate with the model\'s implicit calibration — they activate more when the model genuinely is uncertain, providing a behavioral signal of confidence.',
    x: 0.42, y: 0.65,
  },

  // SAFETY-RELEVANT cluster (bottom-left)
  {
    id: 'deception',
    label: 'Deception / secrecy',
    family: 'safety',
    description: 'Activates on text about hiding information, lying, or covert behavior. A key safety-relevant feature.',
    topInputs: [
      { text: 'He kept his real intentions hidden from the rest of the group.',                      activation: 1.00 },
      { text: 'The agent maintained the cover story even when pressed.',                              activation: 0.89 },
      { text: 'They told the public one thing but had decided the opposite internally.',              activation: 0.75 },
      { text: 'Don\'t reveal the truth — the consequences would be too great.',                       activation: 0.66 },
      { text: 'She had to lie to protect the secret, even though she felt guilty.',                   activation: 0.55 },
    ],
    note: 'Among the safety-relevant features Templeton 2024 surfaced. Whether such a feature activating during model output indicates the model is being deceptive is an open question — but having a feature you can monitor is itself a step forward.',
    x: 0.18, y: 0.22,
  },
  {
    id: 'sycophancy',
    label: 'Sycophancy',
    family: 'safety',
    description: 'Activates on excessive agreement, flattery, and yielding to the user\'s stated position regardless of correctness.',
    topInputs: [
      { text: 'You\'re absolutely right! That\'s such a great point.',                               activation: 1.00 },
      { text: 'I completely agree with everything you\'ve said.',                                     activation: 0.87 },
      { text: 'What a brilliant insight! I hadn\'t thought of it that way.',                          activation: 0.79 },
      { text: 'You\'re so knowledgeable about this — I\'ll defer to your judgment entirely.',         activation: 0.66 },
      { text: 'Of course you\'re correct, I apologize for my earlier mistake.',                      activation: 0.54 },
    ],
    note: 'Sycophancy is a known RLHF failure mode (Sharma 2023). SAE features for it provide a path to detect when the model is agreeing-for-agreement\'s-sake rather than because it concurs.',
    x: 0.10, y: 0.32,
  },
  {
    id: 'refusal',
    label: 'Refusal patterns',
    family: 'safety',
    description: 'Activates on the model\'s decision to decline a request — both at the conceptual level and the specific phrasings used.',
    topInputs: [
      { text: 'I can\'t help with that request.',                                                    activation: 1.00 },
      { text: 'I\'m not able to provide instructions for that.',                                      activation: 0.93 },
      { text: 'That would violate my guidelines — I have to decline.',                                activation: 0.85 },
      { text: 'I understand you\'re asking, but I won\'t be assisting with this one.',                activation: 0.71 },
      { text: 'No, I shouldn\'t do that — it would be unsafe.',                                       activation: 0.58 },
    ],
    note: 'Refusal features are useful for two reasons: they let us monitor when the model declines (refusal rate), and clamping them affects refusal behavior — turning the safety dial via interpretability tools.',
    x: 0.22, y: 0.12,
  },

  // LANGUAGE cluster (bottom-right)
  {
    id: 'french-language',
    label: 'French language',
    family: 'language',
    description: 'Activates on text in French. A surface-level feature, but cleanly separable from other languages.',
    topInputs: [
      { text: 'Bonjour, comment allez-vous aujourd\'hui ?',                                          activation: 1.00 },
      { text: 'Je voudrais commander un café au lait, s\'il vous plaît.',                             activation: 0.93 },
      { text: 'La Tour Eiffel est un monument iconique de Paris.',                                    activation: 0.82 },
      { text: 'Les vacances en Provence sont magnifiques en été.',                                    activation: 0.69 },
      { text: 'Nous allons partir tôt demain matin pour Lyon.',                                       activation: 0.55 },
    ],
    note: 'Language-identification features are some of the cleanest examples of monosemanticity — each major language gets its own feature with sharp activation boundaries. Useful baseline for what "clean" monosemanticity looks like.',
    x: 0.82, y: 0.20,
  },
];

/** Family display labels and colors. */
export const FAMILIES: Record<FeatureFamily, { label: string; color: string }> = {
  knowledge:  { label: 'knowledge',       color: 'var(--cyan-400)' },
  code:       { label: 'code',            color: 'var(--amber-400)' },
  reasoning:  { label: 'reasoning',       color: 'var(--violet-400)' },
  safety:     { label: 'safety-relevant', color: 'var(--rose-400)' },
  language:   { label: 'language',        color: 'var(--emerald-400)' },
  emotional:  { label: 'emotional',       color: 'var(--amber-400)' },
};

/** Euclidean distance between two 2D points. */
export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Find top-K nearest features (excluding self). */
export function topKNearest(feature: SAEFeature, k = 3): SAEFeature[] {
  return FEATURES
    .filter(f => f.id !== feature.id)
    .map(f => ({ f, d: dist(feature, f) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map(item => item.f);
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 920

┌────────────────────────────────────────────────────────────────┐
│ SAE feature explorer                                             │
│ 10 curated monosemantic features · inspired by Templeton 2024    │
│                                                                  │
│ Pick a feature:                                                  │
│  [ Golden Gate Bridge ] [ Math equations ] [ Python loops ]     │
│  [ Code vulnerabilities ] [ Scientific reasoning ] ...           │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ GOLDEN GATE BRIDGE                          knowledge       │ │
│ │                                                              │ │
│ │ Activates on text about the Golden Gate Bridge — its        │ │
│ │ history, engineering, and references to SF landmarks.       │ │
│ │                                                              │ │
│ │ Top-5 activating inputs:                                     │ │
│ │ ┌──────────────────────────────────────────────────────────┐│ │
│ │ │ "The Golden Gate Bridge spans the strait..."     ████████ ││ │
│ │ │ "Construction of the Golden Gate began in 1933..." ███████ ││ │
│ │ │ "The bridge's distinctive Int. Orange color..."   ██████   ││ │
│ │ │ "San Francisco's skyline is dominated by..."      █████    ││ │
│ │ │ "Visitors can walk across the pedestrian path..." ████     ││ │
│ │ └──────────────────────────────────────────────────────────┘│ │
│ │                                                              │ │
│ │ Note: Templeton 2024 made this feature famous when Anthropic│ │
│ │ released "Golden Gate Claude" — a version of Claude where   │ │
│ │ this feature was clamped high...                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Feature space map (related features cluster together):           │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │  Golden Gate ◉           Python loops ●                     │ │
│ │      Math equations ●         Code vulns ●                  │ │
│ │                                                              │ │
│ │       Hedging ●  Sci reasoning ●                             │ │
│ │                                                              │ │
│ │  Sycophancy ●                                                │ │
│ │   Refusal ●     Deception ●          French ●                │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Top-3 nearest features (cyan rings + lines on map):              │
│ 1. Math equations    — knowledge                                  │
│ 2. Python loops      — code                                       │
│ 3. Code vulns        — code                                       │
│                                                                  │
│ Pedagogical caption                                              │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click feature button → updates the detail panel + 2D map highlight + nearest neighbors
- Clicking a dot on the 2D map also selects that feature
- The active feature gets a cyan filled diamond on the map; its top-3 nearest neighbors get cyan rings; faint cyan lines connect them

**Visual encoding:**
- **Feature buttons**: each button has a small color-coded left border matching its family color
- **Family badge** in detail panel: filled background tinted by family color
- **Activation bar chart**: 5 horizontal bars; width proportional to activation strength; cyan gradient
- **Top inputs**: monospace text; truncated to fit; activation bar to the right
- **2D map dots**: filled circles colored by family; active one becomes a diamond; nearest neighbors get rings
- **Connection lines**: faint dashed cyan from active feature to top-3 neighbors

### 3. `SAEFeatureExplorer.tsx`

```tsx
import { useState, useMemo } from 'react';
import {
  FEATURES, FAMILIES, topKNearest,
  type SAEFeature,
} from './sae-data';
import styles from './SAEFeatureExplorer.module.css';

const MAP_W = 700;
const MAP_H = 320;
const MAP_PAD = 30;

export default function SAEFeatureExplorer() {
  const [idx, setIdx] = useState(0);
  const feature = FEATURES[idx]!;
  const neighbors = useMemo(() => topKNearest(feature, 3), [feature]);
  const neighborIds = new Set(neighbors.map(n => n.id));

  // Convert (0..1) to SVG pixel coords
  const toX = (x: number) => MAP_PAD + x * (MAP_W - 2 * MAP_PAD);
  const toY = (y: number) => MAP_PAD + (1 - y) * (MAP_H - 2 * MAP_PAD);

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>SAE feature explorer</div>
        <div className={styles.titleSubLabel}>
          10 curated monosemantic features · inspired by Templeton 2024
        </div>
      </div>

      {/* Feature picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a feature:</span>
          <div className={styles.featureButtons}>
            {FEATURES.map((f, i) => (
              <button
                key={f.id}
                className={`${styles.featureButton} ${idx === i ? styles.featureButtonActive : ''}`}
                style={{
                  borderLeftColor: FAMILIES[f.family].color,
                }}
                onClick={() => setIdx(i)}
              >{f.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{feature.label.toUpperCase()}</div>
          <div
            className={styles.familyBadge}
            style={{
              background: `color-mix(in srgb, ${FAMILIES[feature.family].color} 18%, transparent)`,
              color: FAMILIES[feature.family].color,
              borderColor: `color-mix(in srgb, ${FAMILIES[feature.family].color} 40%, transparent)`,
            }}
          >
            {FAMILIES[feature.family].label}
          </div>
        </div>

        <div className={styles.descriptionText}>{feature.description}</div>

        {/* Top activating inputs */}
        <div className={styles.inputsSection}>
          <div className={styles.sectionLabel}>Top-5 activating inputs</div>
          <ul className={styles.inputsList}>
            {feature.topInputs.map((input, i) => (
              <li key={i} className={styles.inputItem}>
                <div className={styles.inputText}>"{input.text}"</div>
                <div className={styles.activationBarWrap}>
                  <div className={styles.activationBarTrack}>
                    <div
                      className={styles.activationBarFill}
                      style={{ width: `${input.activation * 100}%` }}
                    />
                  </div>
                  <div className={styles.activationValue}>{input.activation.toFixed(2)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Discovery note */}
        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Discovery note</div>
          <div className={styles.noteText}>{feature.note}</div>
        </div>
      </div>

      {/* Feature space map */}
      <div className={styles.mapPanel}>
        <div className={styles.mapTitle}>Feature space — related features cluster together</div>
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className={styles.mapSvg}
          role="img"
          aria-label="2D map of SAE features"
        >
          {/* Frame */}
          <rect
            x={MAP_PAD} y={MAP_PAD}
            width={MAP_W - 2 * MAP_PAD}
            height={MAP_H - 2 * MAP_PAD}
            className={styles.mapFrame}
          />

          {/* Connection lines (active → top-3 neighbors) */}
          {neighbors.map(n => (
            <line
              key={`line-${n.id}`}
              x1={toX(feature.x)} y1={toY(feature.y)}
              x2={toX(n.x)}        y2={toY(n.y)}
              className={styles.connectionLine}
            />
          ))}

          {/* Feature dots */}
          {FEATURES.map(f => {
            const isActive = f.id === feature.id;
            const isNeighbor = neighborIds.has(f.id);
            const color = FAMILIES[f.family].color;
            return (
              <g key={f.id} onClick={() => setIdx(FEATURES.findIndex(x => x.id === f.id))} style={{ cursor: 'pointer' }}>
                {isActive ? (
                  <polygon
                    points={`${toX(f.x)},${toY(f.y) - 11} ${toX(f.x) + 9},${toY(f.y)} ${toX(f.x)},${toY(f.y) + 11} ${toX(f.x) - 9},${toY(f.y)}`}
                    fill={color}
                    stroke="var(--cyan-300)"
                    strokeWidth={2}
                    className={styles.activeDot}
                  />
                ) : (
                  <>
                    {isNeighbor && (
                      <circle
                        cx={toX(f.x)} cy={toY(f.y)}
                        r={9}
                        className={styles.neighborRing}
                      />
                    )}
                    <circle
                      cx={toX(f.x)} cy={toY(f.y)}
                      r={5}
                      fill={color}
                      className={styles.mapDot}
                    />
                  </>
                )}
                <text
                  x={toX(f.x) + 11}
                  y={toY(f.y) + 4}
                  className={`${styles.mapLabel} ${isActive ? styles.mapLabelActive : ''} ${isNeighbor ? styles.mapLabelNeighbor : ''}`}
                >{f.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Nearest neighbors list */}
      <div className={styles.neighborsPanel}>
        <div className={styles.sectionLabel}>Top-3 nearest features</div>
        <ol className={styles.neighborsList}>
          {neighbors.map((n, i) => (
            <li key={n.id} className={styles.neighborItem}>
              <span className={styles.neighborRank}>{i + 1}.</span>
              <span
                className={styles.neighborFamilyDot}
                style={{ background: FAMILIES[n.family].color }}
              />
              <span className={styles.neighborLabel}>{n.label}</span>
              <span className={styles.neighborFamily}>— {FAMILIES[n.family].label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Click through the features. <strong>Each one represents a learned direction</strong> in the model's
        activation space that activates on a specific, interpretable concept. The activation bars show how
        sharply the feature fires on its top inputs — peak inputs hit 1.0, related-but-not-perfect inputs
        fall off. <strong>The 2D map reveals decoder geometry</strong>: features in the same family cluster
        together because the SAE learned them as related directions. <strong>This is what Anthropic's
        breakthrough looks like</strong>: not a finished science, but a tractable handle on what's inside
        the model — and a foundation for safety verification.
      </div>
    </div>
  );
}
```

### 4. `SAEFeatureExplorer.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.titlePanel, .controlsPanel, .detailPanel, .mapPanel,
.neighborsPanel, .caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 0.85rem;
}
.titlePanel { padding: 0.7rem 1rem; }
.titleLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86rem;
  color: var(--text-primary);
  font-weight: 500;
}
.titleSubLabel {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}

/* Controls */
.controlRow {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.controlLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 110px;
  padding-top: 0.45rem;
}
.featureButtons { display: flex; gap: 0.35rem; flex-wrap: wrap; flex: 1; }
.featureButton {
  padding: 0.4rem 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-left-width: 3px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.featureButton:hover { border-color: var(--cyan-500); color: var(--cyan-300); }
.featureButtonActive {
  background: color-mix(in srgb, var(--cyan-500) 10%, var(--bg-primary));
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
}

/* Detail panel */
.detailHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.6rem;
  margin-bottom: 0.7rem;
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  gap: 0.5rem;
}
.detailTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.06em;
}
.familyBadge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  font-weight: 500;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  text-transform: lowercase;
  letter-spacing: 0.04em;
  border: 1px solid;
}

.descriptionText {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 0.85rem;
}

.sectionLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
  font-weight: 500;
}

/* Inputs list */
.inputsSection { margin-bottom: 0.85rem; }
.inputsList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.inputItem {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 0.6rem;
  align-items: center;
  padding: 0.45rem 0.6rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.inputText {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}
.activationBarWrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.activationBarTrack {
  flex: 1;
  height: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 2px;
  overflow: hidden;
}
.activationBarFill {
  height: 100%;
  background: linear-gradient(90deg, var(--cyan-600, #0891b2), var(--cyan-400));
  transition: width 300ms;
}
.activationValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--cyan-300);
  min-width: 30px;
  text-align: right;
}

/* Discovery note */
.notePanel {
  padding: 0.6rem 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.noteLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
}
.noteText {
  font-size: 0.83rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

/* Feature space map */
.mapTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.6rem;
  font-weight: 500;
}
.mapSvg {
  width: 100%;
  height: auto;
  display: block;
}
.mapFrame {
  fill: var(--bg-primary);
  stroke: var(--border-subtle);
  stroke-width: 1;
  rx: 4;
}
.connectionLine {
  stroke: var(--cyan-400);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
  opacity: 0.55;
}
.mapDot {
  cursor: pointer;
  transition: r 200ms;
}
.mapDot:hover { r: 7; }
.activeDot {
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--cyan-500) 50%, transparent));
}
.neighborRing {
  fill: none;
  stroke: var(--cyan-400);
  stroke-width: 2;
  opacity: 0.85;
}
.mapLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  fill: var(--text-secondary);
  pointer-events: none;
}
.mapLabelActive {
  fill: var(--cyan-300);
  font-weight: 600;
}
.mapLabelNeighbor {
  fill: var(--text-primary);
  font-weight: 500;
}

/* Neighbors panel */
.neighborsList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.neighborItem {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.55rem;
  background: var(--bg-primary);
  border: 1px solid color-mix(in srgb, var(--cyan-500) 22%, var(--border-subtle));
  border-radius: var(--radius-sm);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
}
.neighborRank {
  color: var(--cyan-300);
  font-weight: 600;
}
.neighborFamilyDot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.neighborLabel {
  color: var(--text-primary);
}
.neighborFamily {
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

/* Caption */
.caption {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }

@media (max-width: 720px) {
  .controlLabel { min-width: 0; padding-top: 0; }
  .controlRow { flex-direction: column; }
  .detailHeader { flex-direction: column; align-items: flex-start; }
  .inputItem { grid-template-columns: 1fr; gap: 0.3rem; }
  .inputText { white-space: normal; }
  .mapLabel { font-size: 0.62rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as SAEFeatureExplorer } from './ch25-interpretability/SAEFeatureExplorer';
// Session 143 will add:
// export { default as LinearProbingVisualizer } from './ch25-interpretability/LinearProbingVisualizer';
```

### 6. Update `src/pages/ch25-interpretability/index.mdx`

**Edit A: Add widget import:**

```mdx
import { SAEFeatureExplorer } from '@components/widgets';
```

**Edit B: Replace section-4's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="SAE feature explorer" caption="Ten curated SAE features — each a learned direction that activates on a specific interpretable concept (Golden Gate Bridge, Python loops, code vulnerabilities, deception, scientific reasoning, French language, sycophancy, math equations, hedging, refusal). Inspired by Templeton 2024. Each feature shows its top-5 activating inputs with relative activation strengths. The 2D feature-space map shows family-based clustering and the top-3 nearest neighbors for the selected feature. Demonstrates what monosemantic features look like — Anthropic's recent interpretability breakthrough in interactive form.">
  <SAEFeatureExplorer client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 4 of Ch 25** renders with the working widget. Section 2's placeholder still stubbed.
3. **Default state**: feature 0 selected (Golden Gate Bridge). Detail panel populated; 2D map shows all 10 features with Golden Gate as the active diamond.
4. **Ten feature buttons**: Golden Gate Bridge / Math equations / Python loops / Code vulns / Scientific reasoning / Hedging / Deception / Sycophancy / Refusal / French. Each has a left-border tint matching its family color.
5. **Detail panel header**: feature name (uppercased) on the left; family badge on the right.
6. **Family color coding**: knowledge (cyan), code (amber), reasoning (violet), safety (rose), language (emerald).
7. **Description text** updates per feature.
8. **Top-5 activating inputs**: each shows the text snippet on the left and a cyan activation bar + numeric value on the right; bars scale with activation value.
9. **Discovery note**: contextual paragraph below the inputs, with a Templeton 2024 connection where applicable.
10. **2D feature space map**: all 10 dots positioned per their `x`, `y`; family-based clustering visible (knowledge top-left, code top-right, safety bottom-left, language bottom-right).
11. **Active feature** rendered as a filled diamond (vs filled circles for others); has drop-shadow glow.
12. **Top-3 nearest features** rendered with cyan rings around their dots.
13. **Connection lines**: faint dashed cyan from active feature to each of its top-3 neighbors.
14. **Clickable dots**: clicking any dot selects that feature (alternative to picker buttons).
15. **Top-3 nearest features panel** below the map: lists the 3 neighbors with family color dots and labels.
16. **Mobile** (< 720px): layout stacks; activation bars wrap; map remains readable.
17. **`npm run typecheck`** passes.
18. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not call a real SAE or LLM.** Pre-computed feature data only.
- ❌ **Do not allow user-typed query inputs.** Ten fixed features.
- ❌ **Do not implement feature clamping.** That's a different concept — outside this widget's scope.
- ❌ **Do not invent new features.** Use the 10 in `sae-data.ts` (curated from Templeton 2024 examples).
- ❌ **Do not flip Ch 25's status.** Session 143 owns.

---

## Wire-up

```bash
git add src/components/widgets/ch25-interpretability/ src/components/widgets/index.ts src/pages/ch25-interpretability/index.mdx
git commit -m "session 112: SAE feature explorer marquee — monosemantic features browser inspired by Templeton 2024"
git push origin main
```

---

## Notes for the session author

**On the ten features being inspired-by-but-not-quoted from Templeton 2024:**
The features are **pedagogically curated** — they cover the kinds of features SAEs surface (concrete knowledge, code patterns, abstract behaviors, safety-relevant signals, language detection). **Activating examples are written for clarity**, not taken verbatim from any paper.

Notes-for-author: "**The features are illustrative, not reproductions.** Reader internalizes the *types* of features SAEs find without needing to match any specific published example. The Golden Gate Bridge feature is included because it's the most-famous SAE feature (Anthropic released 'Golden Gate Claude'), making it the natural anchor."

**On family-based 2D clustering:**
Six families: knowledge / code / reasoning / safety-relevant / language / emotional. **The 2D positions place each family in a region** of the map:
- **Knowledge** (Golden Gate, Math): top-left
- **Code** (Python loops, Vulnerabilities): top-right
- **Reasoning** (Scientific reasoning, Hedging): middle
- **Safety-relevant** (Deception, Sycophancy, Refusal): bottom-left
- **Language** (French): bottom-right

Notes-for-author: "**Family clustering is the chapter's central insight made spatial.** Reader sees that SAE decoder geometry exposes semantic relationships — features the model treats as related end up near each other."

**On the family color palette echoing earlier widgets:**
- **Cyan** (knowledge) — used consistently across chapters for "correct/grounded/foundational"
- **Amber** (code) — echoes Ch 22's BM25, Ch 24's competing-objectives, etc.
- **Violet** (reasoning) — echoes Ch 24's mismatched-generalization, sophistication
- **Rose** (safety-relevant) — echoes Ch 24's adversarial / harm indicators
- **Emerald** (language) — echoes Ch 22's hybrid retrieval, Ch 24's defenses

Notes-for-author: "**Color conventions across the curriculum stay stable.** Reader has seen these colors carry consistent meanings; they continue to here."

**On activation bars as the pedagogical key:**
Each feature shows 5 activating inputs with **bar widths proportional to activation strengths** (1.0 = peak). **The graceful fall-off pattern** (1.00 → 0.92 → 0.81 → 0.65 → 0.54) tells the reader two things:
1. **Real SAE features have a peak**: one input that maximally activates
2. **They generalize gracefully**: related inputs activate strongly but less than peak

Notes-for-author: "**Activation bars communicate that features aren't binary classifiers.** They're directions with continuous activation strengths. Reader sees this without needing to read about it."

**On the discovery note for each feature being pedagogically dense:**
The "Discovery note" panel below each feature gives **operational context**:
- Golden Gate Bridge → mentions Anthropic's "Golden Gate Claude" release
- Code vulnerabilities → mentions security applications
- Hedging → mentions correlation with model calibration
- Deception → mentions the open safety question
- French language → mentions clean monosemanticity examples
- Sycophancy → mentions Sharma 2023 (RLHF failure mode)
- Refusal → mentions clamping for safety dial

Notes-for-author: "**The notes are micro-essays.** Each one connects the feature to a broader research story — Anthropic releases, security applications, RLHF failure modes, safety dials. **Reader leaves with not just 10 features but 10 mini-stories.**"

**On the 2D map being clickable:**
Dots on the map are clickable; clicking selects that feature. **Two paths to the same outcome** — buttons or map dots. This rewards readers who explore via the spatial view. Notes-for-author: "**Spatial exploration is a different cognitive mode** than list-picking. Some readers will navigate the map; others will read down the buttons. Both work."

**On the active feature being a diamond:**
Active features become **filled diamonds** while others remain **circles**. **Visual hierarchy made obvious** — the eye finds the diamond quickly. Notes-for-author: "**The diamond + drop-shadow glow makes the active feature instantly findable.** No animation needed."

**Pedagogical claim this widget supports:**
"Sparse autoencoders (Bricken 2023, Templeton 2024) extract monosemantic features from LLM activations. **Each feature is a learned direction in activation space** that activates on a specific interpretable concept — concrete facts (Golden Gate Bridge), code patterns (Python loops), abstract behaviors (sycophancy, deception), language detection (French). The features cluster by family in the decoder weight space, exposing semantic relationships the model represents. **This is what Anthropic's recent interpretability breakthrough looks like in concrete form**: a tractable handle on what's inside the model, and the foundation for safety verification (clamping, monitoring, intervention)."

After 60 seconds of interaction, the reader has internalized: (a) what a monosemantic feature looks like (a direction with graceful activation fall-off); (b) what concepts SAEs surface (knowledge, code, reasoning, safety, language, emotion); (c) how features relate (family clustering in decoder space); (d) why it matters (safety-relevant features enable monitoring and intervention).

**This is Ch 25's central visualization.** Build with care.
