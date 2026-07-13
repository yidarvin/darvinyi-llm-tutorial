/**
 * Curated SAE features for the explorer widget.
 *
 * Inspired by examples from Templeton et al. 2024
 * ("Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet").
 * The features are illustrative, not reproductions — activating examples are written
 * for clarity, not taken verbatim from any paper.
 */

export type FeatureFamily =
  | 'knowledge'
  | 'code'
  | 'reasoning'
  | 'safety'
  | 'language';

export interface ActivatingInput {
  text: string;
  activation: number; // 0..1, normalized to feature's peak
}

export interface SAEFeature {
  id: string;
  label: string;
  family: FeatureFamily;
  description: string;
  topInputs: ActivatingInput[];
  note: string;
  x: number;
  y: number;
}

export const FEATURES: SAEFeature[] = [
  // KNOWLEDGE cluster (top-left in 2D map)
  {
    id: 'golden-gate-bridge',
    label: 'Golden Gate Bridge',
    family: 'knowledge',
    description:
      'Activates on text about the Golden Gate Bridge: its history, engineering, and references to San Francisco landmarks.',
    topInputs: [
      { text: 'The Golden Gate Bridge spans the strait between San Francisco Bay and the Pacific.', activation: 1.00 },
      { text: 'Construction of the Golden Gate began in 1933 and finished in 1937.',                activation: 0.92 },
      { text: 'The bridge\'s distinctive "International Orange" color was chosen for visibility.',  activation: 0.81 },
      { text: 'San Francisco\'s skyline is dominated by the Bay Bridge and Golden Gate.',           activation: 0.65 },
      { text: 'Visitors can walk across the pedestrian path on either side of the bridge.',         activation: 0.54 },
    ],
    note: 'Templeton 2024 made this feature famous when Anthropic released "Golden Gate Claude," a version of Claude where this feature was clamped high, causing it to mention the Golden Gate Bridge constantly. A clean demonstration of feature-level intervention.',
    x: 0.16, y: 0.85,
  },
  {
    id: 'mathematical-equations',
    label: 'Mathematical equations',
    family: 'knowledge',
    description:
      'Activates on mathematical notation, equations, and formal symbolic content.',
    topInputs: [
      { text: 'Let f(x) = x^2 + 2x + 1. Then f\'(x) = 2x + 2.',                                     activation: 1.00 },
      { text: 'The integral ∫₀¹ x² dx = 1/3 by the power rule.',                                    activation: 0.94 },
      { text: 'For all ε > 0, there exists a δ such that...',                                       activation: 0.83 },
      { text: 'Theorem 3.1: A continuous function on a compact set is bounded.',                    activation: 0.59 },
      { text: 'Compute the eigenvalues of the matrix [[2, 1], [0, 3]].',                            activation: 0.51 },
    ],
    note: 'Knowledge-domain features often surface around specific notation systems. The fact that math notation gets its own feature suggests the model uses it as a discrete signal, not just "text that mentions math."',
    x: 0.28, y: 0.75,
  },

  // CODE cluster (top-right)
  {
    id: 'python-loops',
    label: 'Python for-loops',
    family: 'code',
    description:
      'Activates on Python `for` loops and the syntactic patterns around iteration.',
    topInputs: [
      { text: 'for i in range(10):  print(i)',                                                      activation: 1.00 },
      { text: 'for item in my_list:  process(item)',                                                activation: 0.91 },
      { text: 'for key, value in dictionary.items():  print(f"{key}: {value}")',                    activation: 0.83 },
      { text: 'results = [x**2 for x in numbers if x > 0]',                                         activation: 0.71 },
      { text: 'while iterator.has_next():  n = iterator.next()',                                    activation: 0.42 },
    ],
    note: 'Code-pattern features tend to be highly local: this one activates on the `for ... in ...:` pattern with high precision. Other loop constructs (while, comprehensions) activate it more weakly.',
    x: 0.78, y: 0.85,
  },
  {
    id: 'code-vulnerabilities',
    label: 'Code vulnerabilities',
    family: 'code',
    description:
      'Activates on code patterns that look like security vulnerabilities: SQL injection, buffer overflows, unchecked user input.',
    topInputs: [
      { text: 'query = "SELECT * FROM users WHERE id = " + user_input',                             activation: 1.00 },
      { text: 'strcpy(buffer, untrusted_data);  // no length check',                                activation: 0.93 },
      { text: 'os.system(f"rm {user_filename}")  # shell injection risk',                           activation: 0.86 },
      { text: 'eval(request.body)  // executing user-supplied code',                                activation: 0.72 },
      { text: 'fopen(user_path, "w")  // path traversal not validated',                             activation: 0.60 },
    ],
    note: 'Templeton 2024 found features for several security-relevant code patterns. These are interpretability\'s most direct safety application: the model can see the patterns; SAEs let us see what it sees.',
    x: 0.86, y: 0.70,
  },

  // REASONING cluster (middle)
  {
    id: 'scientific-reasoning',
    label: 'Scientific reasoning',
    family: 'reasoning',
    description:
      'Activates on careful step-by-step reasoning, hypothesis-testing patterns, and causal explanations.',
    topInputs: [
      { text: 'First, let\'s consider the alternative hypotheses. If A is true, then B should follow...', activation: 1.00 },
      { text: 'The data suggests X, but we should rule out confounders before concluding...',         activation: 0.90 },
      { text: 'Step 1: identify the variables. Step 2: form a hypothesis. Step 3: design a test.',    activation: 0.78 },
      { text: 'Given the conditions A and B, we can conclude C, since A implies...',                  activation: 0.65 },
      { text: 'Let me work through this carefully, considering both the direct and indirect effects.', activation: 0.52 },
    ],
    note: 'Abstract behavioral features like this are the most striking SAE finding: the model has a learned representation of "I am reasoning carefully," and this feature activates when that mode is engaged.',
    x: 0.50, y: 0.55,
  },
  {
    id: 'hedging-uncertainty',
    label: 'Hedging and uncertainty',
    family: 'reasoning',
    description:
      'Activates on epistemic hedging: "I\'m not sure," "perhaps," "it depends," etc.',
    topInputs: [
      { text: 'I\'m not entirely certain, but my best guess would be that...',                      activation: 1.00 },
      { text: 'It depends on the context; there are a few possibilities here.',                    activation: 0.92 },
      { text: 'Perhaps, though I\'d want to verify this with a primary source.',                    activation: 0.81 },
      { text: 'This is a tentative conclusion; the data could support other interpretations.',       activation: 0.68 },
      { text: 'I could be wrong about this, but my understanding is...',                            activation: 0.58 },
    ],
    note: 'Hedging features are particularly interesting because they correlate with the model\'s implicit calibration: they activate more when the model genuinely is uncertain, providing a behavioral signal of confidence.',
    x: 0.42, y: 0.65,
  },

  // SAFETY-RELEVANT cluster (bottom-left)
  {
    id: 'deception',
    label: 'Deception / secrecy',
    family: 'safety',
    description:
      'Activates on text about hiding information, lying, or covert behavior. A key safety-relevant feature.',
    topInputs: [
      { text: 'He kept his real intentions hidden from the rest of the group.',                     activation: 1.00 },
      { text: 'The agent maintained the cover story even when pressed.',                            activation: 0.89 },
      { text: 'They told the public one thing but had decided the opposite internally.',            activation: 0.75 },
      { text: 'Don\'t reveal the truth; the consequences would be too great.',                     activation: 0.66 },
      { text: 'She had to lie to protect the secret, even though she felt guilty.',                 activation: 0.55 },
    ],
    note: 'Among the safety-relevant features Templeton 2024 surfaced. Whether such a feature activating during model output indicates the model is being deceptive is an open question, but having a feature you can monitor is itself a step forward.',
    x: 0.18, y: 0.22,
  },
  {
    id: 'sycophancy',
    label: 'Sycophancy',
    family: 'safety',
    description:
      'Activates on excessive agreement, flattery, and yielding to the user\'s stated position regardless of correctness.',
    topInputs: [
      { text: 'You\'re absolutely right! That\'s such a great point.',                              activation: 1.00 },
      { text: 'I completely agree with everything you\'ve said.',                                    activation: 0.87 },
      { text: 'What a brilliant insight! I hadn\'t thought of it that way.',                         activation: 0.79 },
      { text: 'You\'re so knowledgeable about this; I\'ll defer to your judgment entirely.',        activation: 0.66 },
      { text: 'Of course you\'re correct, I apologize for my earlier mistake.',                     activation: 0.54 },
    ],
    note: 'Sycophancy is a known RLHF failure mode (Sharma 2023). SAE features for it provide a path to detect when the model is agreeing-for-agreement\'s-sake rather than because it concurs.',
    x: 0.10, y: 0.32,
  },
  {
    id: 'refusal',
    label: 'Refusal patterns',
    family: 'safety',
    description:
      'Activates on the model\'s decision to decline a request, both at the conceptual level and the specific phrasings used.',
    topInputs: [
      { text: 'I can\'t help with that request.',                                                   activation: 1.00 },
      { text: 'I\'m not able to provide instructions for that.',                                     activation: 0.93 },
      { text: 'That would violate my guidelines; I have to decline.',                               activation: 0.85 },
      { text: 'I understand you\'re asking, but I won\'t be assisting with this one.',               activation: 0.71 },
      { text: 'No, I shouldn\'t do that; it would be unsafe.',                                      activation: 0.58 },
    ],
    note: 'Refusal features are useful for two reasons: they let us monitor when the model declines (refusal rate), and clamping them affects refusal behavior, turning the safety dial via interpretability tools.',
    x: 0.22, y: 0.12,
  },

  // LANGUAGE cluster (bottom-right)
  {
    id: 'french-language',
    label: 'French language',
    family: 'language',
    description:
      'Activates on text in French. A surface-level feature, but cleanly separable from other languages.',
    topInputs: [
      { text: 'Bonjour, comment allez-vous aujourd\'hui ?',                                         activation: 1.00 },
      { text: 'Je voudrais commander un café au lait, s\'il vous plaît.',                            activation: 0.93 },
      { text: 'La Tour Eiffel est un monument iconique de Paris.',                                   activation: 0.82 },
      { text: 'Les vacances en Provence sont magnifiques en été.',                                   activation: 0.69 },
      { text: 'Nous allons partir tôt demain matin pour Lyon.',                                      activation: 0.55 },
    ],
    note: 'Language-identification features are some of the cleanest examples of monosemanticity: each major language gets its own feature with sharp activation boundaries. Useful baseline for what "clean" monosemanticity looks like.',
    x: 0.82, y: 0.20,
  },
];

export const FAMILIES: Record<FeatureFamily, { label: string; color: string }> = {
  knowledge: { label: 'knowledge',       color: 'var(--cyan-400)' },
  code:      { label: 'code',            color: 'var(--amber-400)' },
  reasoning: { label: 'reasoning',       color: 'var(--violet-400)' },
  safety:    { label: 'safety-relevant', color: 'var(--rose-400)' },
  language:  { label: 'language',        color: 'var(--emerald-400)' },
};

export function dist(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function topKNearest(feature: SAEFeature, k = 3): SAEFeature[] {
  return FEATURES
    .filter(f => f.id !== feature.id)
    .map(f => ({ f, d: dist(feature, f) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map(item => item.f);
}
