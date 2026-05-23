# Session 60 — SFT loss masking marquee widget

> The marquee Chapter 13 widget. A 5-turn conversation rendered as a flowing grid of role-colored token cards. **Toggle the response mask on/off** to see which tokens contribute to the loss: only assistant tokens have gradient when masked; everything has gradient when unmasked. Stats panel below counts tokens by role and mask state. Hover any token for its index, role, and mask state. **The visualization that makes loss masking viscerally obvious** — readers see the chapter's central mechanical detail in one image. Replaces the section-3 `<WidgetFrame>` placeholder.

---

## Read first (in this order)

1. **`research/ch13-sft/research.md`** — concept 2 (response-only loss masking) is the reference
2. **`prompts/chapters/ch13-sft/session-59-page-structure.md`** — for the section-3 widget placeholder this session fills
3. **`prompts/chapters/ch11-moe/session-51-moe-routing-visualizer-widget.md`** — for the hand-tuned-tokens + role-coloring pattern (MoERoutingVisualizer is the closest precedent for "tokens displayed with semantic meaning")
4. **`prompts/chapters/ch04-attention/session-19-attention-heatmap-widget.md`** — for the hand-tuned-data pattern (AttentionHeatmap established the data-designed-for-pedagogical-clarity pattern)

---

## Goal

Replace the `<WidgetFrame title="SFT loss masking">` placeholder in section 3 with a working interactive widget that:

- Renders a **5-turn conversation** (system + 2 user/assistant exchanges) as a flowing grid of token cards
- Each token shows its **text content** and is colored by **role** (system / user / assistant / special)
- **Toggle "Response mask"** (default ON): when ON, only assistant tokens at full opacity (active); when OFF, all tokens at full opacity (no masking)
- **Hover any token**: tooltip shows index, role, mask state
- **Stats panel** at the bottom: total tokens, tokens contributing to loss, breakdown by role
- **Pedagogical caption** explaining what the reader is looking at

**End state:** section 3 of Chapter 13 has a working marquee widget. After 30 seconds of interaction, the reader should be able to articulate: (a) the conversation is one long token sequence; (b) special tokens mark role boundaries; (c) without masking, every token contributes to loss; (d) with masking, only assistant tokens contribute; (e) the masked count is much smaller than the total — the model only learns to *respond*, not to memorize prompts.

---

## Inputs

State of the repo after session 59:

- `src/pages/ch13-sft/index.mdx` exists with prose; two `<WidgetFrame>` placeholders (sections 3 and 4)
- `src/lib/chapters.ts` has Ch 13 as `'draft'`
- No `src/components/widgets/ch13/` directory yet

---

## Deliverables

1. **Create** `src/components/widgets/ch13/SFTLossMasking.tsx` — the React widget
2. **Create** `src/components/widgets/ch13/SFTLossMasking.module.css` — scoped styles
3. **Create** `src/components/widgets/ch13/conversation-data.ts` — hand-tokenized conversation
4. **Update** `src/components/widgets/index.ts` — add `SFTLossMasking` export
5. **Update** `src/pages/ch13-sft/index.mdx` — replace section-3's `<WidgetFrame>` interior with `<SFTLossMasking client:visible />`

---

## Detailed spec

### 1. `conversation-data.ts` — hand-tokenized conversation

The data layer pre-tokenizes a 5-turn conversation in ChatML format. Token boundaries are hand-picked for pedagogical clarity (don't try to match a real BPE tokenizer).

```ts
// src/components/widgets/ch13/conversation-data.ts

export type TokenRole = 'system' | 'user' | 'assistant' | 'special';

export interface Token {
  index: number;
  text: string;
  role: TokenRole;
  /** True if this token contributes to the SFT loss (only assistant tokens). */
  inLoss: boolean;
}

/**
 * Hand-tokenized 5-turn conversation in ChatML format.
 *
 * Tokenization is approximate (split by words + special tokens) — not BPE.
 * Pedagogical clarity over realism: each word or special token is one "token."
 *
 * Roles: 'system' / 'user' / 'assistant' / 'special' (for <|im_start|>, <|im_end|>, etc.)
 *
 * inLoss: only assistant content tokens (not special tokens around them) contribute.
 */
function makeTokens(items: Array<[string, TokenRole, boolean]>): Token[] {
  return items.map(([text, role, inLoss], index) => ({ index, text, role, inLoss }));
}

export const CONVERSATION: Token[] = makeTokens([
  // System turn
  ['<|im_start|>', 'special', false],
  ['system',       'special', false],
  ['You',          'system',  false],
  ['are',          'system',  false],
  ['a',            'system',  false],
  ['helpful',      'system',  false],
  ['assistant.',   'system',  false],
  ['<|im_end|>',   'special', false],

  // User turn 1
  ['<|im_start|>', 'special', false],
  ['user',         'special', false],
  ['What',         'user',    false],
  ['is',           'user',    false],
  ['the',          'user',    false],
  ['capital',      'user',    false],
  ['of',           'user',    false],
  ['France?',      'user',    false],
  ['<|im_end|>',   'special', false],

  // Assistant turn 1 — only the content tokens are in_loss
  ['<|im_start|>',     'special',   false],
  ['assistant',        'special',   false],
  ['The',              'assistant', true],
  ['capital',          'assistant', true],
  ['of',               'assistant', true],
  ['France',           'assistant', true],
  ['is',               'assistant', true],
  ['Paris.',           'assistant', true],
  ['<|im_end|>',       'special',   true],   // end-of-turn IS in loss — model must learn to STOP

  // User turn 2
  ['<|im_start|>', 'special', false],
  ['user',         'special', false],
  ['And',          'user',    false],
  ['its',          'user',    false],
  ['population?',  'user',    false],
  ['<|im_end|>',   'special', false],

  // Assistant turn 2
  ['<|im_start|>',     'special',   false],
  ['assistant',        'special',   false],
  ['Paris',            'assistant', true],
  ['has',              'assistant', true],
  ['about',            'assistant', true],
  ['2.1',              'assistant', true],
  ['million',          'assistant', true],
  ['people.',          'assistant', true],
  ['<|im_end|>',       'special',   true],   // end-of-turn IS in loss
]);

/** Get tokens that contribute to loss. */
export function getLossTokens(tokens: Token[] = CONVERSATION): Token[] {
  return tokens.filter(t => t.inLoss);
}

/** Get count by role. */
export function getCountByRole(tokens: Token[] = CONVERSATION): Record<TokenRole, number> {
  const counts: Record<TokenRole, number> = { system: 0, user: 0, assistant: 0, special: 0 };
  tokens.forEach(t => counts[t.role]++);
  return counts;
}

/** Get count of tokens in loss. */
export function getLossCount(tokens: Token[] = CONVERSATION): number {
  return tokens.filter(t => t.inLoss).length;
}

/** Compute statistics for the conversation. */
export function getStats(tokens: Token[] = CONVERSATION) {
  const total = tokens.length;
  const inLoss = getLossCount(tokens);
  const byRole = getCountByRole(tokens);
  return {
    total,
    inLoss,
    inLossPct: (inLoss / total) * 100,
    byRole,
  };
}
```

### 2. Visual layout

```
ViewBox: 0 0 800 720

┌────────────────────────────────────────────────────────────────┐
│  Response mask: [● ON]  [○ OFF]                                 │
│                                                                  │
│  Conversation (flowing tokens):                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ░<|im_start|>░ ░system░ ░You░ ░are░ ░a░ ░helpful░         │  │
│  │ ░assistant.░ ░<|im_end|>░ ░<|im_start|>░ ░user░ ░What░    │  │
│  │ ░is░ ░the░ ░capital░ ░of░ ░France?░ ░<|im_end|>░          │  │
│  │ ░<|im_start|>░ ░assistant░ ████The████ ████capital████    │  │
│  │ ████of████ ████France████ ████is████ ████Paris.████       │  │
│  │ ████<|im_end|>████ ░<|im_start|>░ ░user░ ░And░ ░its░      │  │
│  │ ░population?░ ░<|im_end|>░ ░<|im_start|>░ ░assistant░     │  │
│  │ ████Paris████ ████has████ ████about████ ████2.1████       │  │
│  │ ████million████ ████people.████ ████<|im_end|>████        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Legend: █ active (contributes to loss)  ░ dimmed (no loss)    │
│                                                                  │
│  Stats:                                                          │
│  ┌─────────┬─────────┬──────────┬────────┬────────┬─────────┐  │
│  │ Total   │ In loss │ % loss   │ System │ User   │ Asst    │  │
│  │ 41      │ 14      │ 34%      │ 5      │ 9      │ 12      │  │
│  └─────────┴─────────┴──────────┴────────┴────────┴─────────┘  │
│                                                                  │
│  What you're seeing:                                            │
│  With response masking ON, only the 14 assistant tokens         │
│  (including end-of-turn markers) contribute to the loss.        │
│  The remaining 27 tokens (system, user, role markers) are       │
│  context — the model sees them but doesn't learn to produce     │
│  them. Toggle OFF to see what would happen without masking:     │
│  every token contributes, and the model wastes capacity         │
│  learning to predict user prompts and system messages.          │
└────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Toggle "Response mask" → tokens visually transition between full-color (active) and dim (inactive)
- Hover any token → tooltip shows index, text, role, in-loss status
- Stats update in real-time as the mask toggle changes
- Pedagogical caption updates to reflect the current state

### 3. `SFTLossMasking.tsx`

```tsx
import { useMemo, useState } from 'react';
import { CONVERSATION, getStats, type Token } from './conversation-data';
import styles from './SFTLossMasking.module.css';

export default function SFTLossMasking() {
  const [maskOn, setMaskOn] = useState(true);
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null);

  const stats = useMemo(() => getStats(), []);

  return (
    <div className={styles.widget}>
      {/* Mode toggle */}
      <div className={styles.controls}>
        <span className={styles.controlsLabel}>Response mask:</span>
        <button
          className={`${styles.toggleButton} ${maskOn ? styles.toggleActive : ''}`}
          onClick={() => setMaskOn(true)}
        >
          ON (standard SFT)
        </button>
        <button
          className={`${styles.toggleButton} ${!maskOn ? styles.toggleActive : ''}`}
          onClick={() => setMaskOn(false)}
        >
          OFF (loss on all tokens)
        </button>
      </div>

      {/* Token grid */}
      <div className={styles.conversationPanel}>
        <div className={styles.panelTitle}>Conversation tokenized (ChatML format)</div>
        <div className={styles.tokenGrid}>
          {CONVERSATION.map(token => (
            <TokenCard
              key={token.index}
              token={token}
              maskOn={maskOn}
              isHovered={hoveredToken?.index === token.index}
              onHover={() => setHoveredToken(token)}
              onLeave={() => setHoveredToken(null)}
            />
          ))}
        </div>
        <div className={styles.legend}>
          <span><span className={styles.legendSwatchActive} /> active (gradient flows here)</span>
          <span><span className={styles.legendSwatchInactive} /> dimmed (no gradient)</span>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsPanel}>
        <Stat label="Total tokens" value={stats.total.toString()} />
        <Stat label="In loss" value={maskOn ? stats.inLoss.toString() : stats.total.toString()} highlight />
        <Stat label="% in loss" value={`${maskOn ? stats.inLossPct.toFixed(0) : '100'}%`} />
        <Stat label="System" value={stats.byRole.system.toString()} />
        <Stat label="User" value={stats.byRole.user.toString()} />
        <Stat label="Assistant" value={stats.byRole.assistant.toString()} />
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        {maskOn ? (
          <>
            With response masking <strong>ON</strong>, only <strong>{stats.inLoss} assistant tokens</strong>
            {' '}contribute to the loss (out of <strong>{stats.total} total</strong>). The system message,
            user prompts, and role markers are <em>context</em> — the model sees them but doesn't learn
            to produce them. <strong>Standard SFT.</strong>
          </>
        ) : (
          <>
            With response masking <strong>OFF</strong>, every token contributes to the loss. The model
            wastes capacity learning to predict the user's questions and the system prompt — neither of
            which the model needs to generate. <strong>Slightly worse than masked SFT;</strong> not what
            anyone actually does in production. This mode exists to illustrate the contrast.
          </>
        )}
      </div>

      {/* Hover tooltip */}
      {hoveredToken && (
        <div className={styles.hoverPanel}>
          <span><strong>idx:</strong> {hoveredToken.index}</span>
          <span><strong>text:</strong> {hoveredToken.text}</span>
          <span><strong>role:</strong> {hoveredToken.role}</span>
          <span><strong>in loss:</strong> {hoveredToken.inLoss ? 'yes ✓' : 'no ✗'}</span>
        </div>
      )}
    </div>
  );
}

function TokenCard({
  token, maskOn, isHovered, onHover, onLeave,
}: {
  token: Token; maskOn: boolean; isHovered: boolean;
  onHover: () => void; onLeave: () => void;
}) {
  const isActive = maskOn ? token.inLoss : true;
  const className = [
    styles.tokenCard,
    styles[`role_${token.role}`],
    isActive ? styles.active : styles.dimmed,
    isHovered ? styles.hovered : '',
  ].filter(Boolean).join(' ');

  return (
    <span
      className={className}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      title={`${token.role} — ${token.inLoss ? 'in loss' : 'no loss'}`}
    >
      {token.text}
    </span>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`${styles.statCell} ${highlight ? styles.statHighlight : ''}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}
```

### 4. `SFTLossMasking.module.css`

```css
.widget {
  width: 100%;
  font-family: 'Inter', sans-serif;
  position: relative;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.controlsLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-right: 0.5rem;
}
.toggleButton {
  padding: 0.4rem 0.9rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms;
}
.toggleButton:hover { border-color: var(--border-strong); color: var(--text-primary); }
.toggleActive {
  border-color: var(--cyan-500);
  color: var(--cyan-300);
  font-weight: 500;
  background: color-mix(in srgb, var(--cyan-500) 6%, transparent);
}

.conversationPanel {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}
.panelTitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
  font-weight: 500;
}

.tokenGrid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  line-height: 1.8;
  padding: 0.5rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
}

/* Token card base */
.tokenCard {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  border-radius: 3px;
  border: 1px solid transparent;
  cursor: default;
  transition: all 200ms;
  white-space: nowrap;
}

/* Role-based base colors */
.role_system {
  /* Violet for system */
  background: color-mix(in srgb, var(--violet-400) 14%, transparent);
  color: var(--violet-300);
}
.role_user {
  /* Amber for user */
  background: color-mix(in srgb, var(--amber-400) 14%, transparent);
  color: var(--amber-400);
}
.role_assistant {
  /* Cyan for assistant — the "in-loss" color */
  background: color-mix(in srgb, var(--cyan-500) 18%, transparent);
  color: var(--cyan-300);
}
.role_special {
  /* Tertiary text color for special tokens */
  background: var(--bg-elevated);
  color: var(--text-tertiary);
  font-style: italic;
}

/* Mask states */
.active {
  /* Bright + bordered */
  border-color: color-mix(in srgb, currentColor 60%, transparent);
  font-weight: 500;
}
.dimmed {
  opacity: 0.35;
}

.hovered {
  transform: scale(1.05);
  border-color: var(--text-primary);
  z-index: 10;
}

.legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--text-tertiary);
  flex-wrap: wrap;
}
.legendSwatchActive {
  display: inline-block;
  width: 14px; height: 12px;
  background: var(--cyan-500);
  border: 1px solid var(--cyan-400);
  margin-right: 0.4rem;
  vertical-align: middle;
  border-radius: 2px;
}
.legendSwatchInactive {
  display: inline-block;
  width: 14px; height: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  opacity: 0.4;
  margin-right: 0.4rem;
  vertical-align: middle;
  border-radius: 2px;
}

.statsPanel {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
  margin-bottom: 1rem;
}
.statCell {
  padding: 0.55rem 0.7rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.statHighlight {
  border-color: var(--cyan-500);
  background: color-mix(in srgb, var(--cyan-500) 6%, var(--bg-elevated));
}
.statLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.2rem;
}
.statValue {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 500;
}
.statHighlight .statValue { color: var(--cyan-300); }

.caption {
  padding: 0.85rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.55;
}
.caption strong { color: var(--cyan-300); font-weight: 500; }
.caption em { color: var(--text-primary); font-style: italic; }

.hoverPanel {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  padding: 0.5rem 0.85rem;
  background: var(--bg-elevated);
  border: 1px solid var(--cyan-500);
  border-radius: var(--radius-sm);
  display: flex;
  gap: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-secondary);
  pointer-events: none;
  z-index: 20;
  flex-wrap: wrap;
  max-width: 90%;
}
.hoverPanel strong { color: var(--cyan-300); }

@media (max-width: 720px) {
  .statsPanel { grid-template-columns: repeat(3, 1fr); }
  .tokenCard { font-size: 0.7rem; padding: 0.15rem 0.4rem; }
}
```

### 5. Update `src/components/widgets/index.ts`

```ts
// ... earlier exports ...
export { default as SFTLossMasking } from './ch13/SFTLossMasking';
// Session 61 will add:
// export { default as ChatTemplateComparison } from './ch13/ChatTemplateComparison';
```

### 6. Update `src/pages/ch13-sft/index.mdx`

**Edit A: Add widget import:**

```mdx
import { SFTLossMasking } from '@components/widgets';
```

**Edit B: Replace section-3's `<WidgetFrame>` interior:**

```mdx
<WidgetFrame title="SFT loss masking" caption="A 5-turn conversation tokenized in ChatML format. Each token is colored by role (violet = system, amber = user, cyan = assistant, gray = special tokens). Toggle 'Response mask' to see which tokens contribute to the loss. Standard SFT (mask ON) trains only on assistant tokens; the rest of the conversation is context. Stats panel shows that only ~34% of tokens contribute — the rest are seen but not learned from.">
  <SFTLossMasking client:visible />
</WidgetFrame>
```

---

## Acceptance criteria

All must hold:

1. **`npm run dev`** starts cleanly. No TypeScript errors.
2. **Section 3 of Ch 13** renders with the working widget. Section 4's placeholder still stubbed.
3. **Default state:** Response mask ON. Token grid visible with assistant tokens at full opacity and others dimmed. Stats show total 41, in-loss 14 (≈34%).
4. **Token colors** by role:
   - System tokens: violet
   - User tokens: amber
   - Assistant tokens: cyan (the "in-loss" color)
   - Special tokens (`<|im_start|>`, `<|im_end|>`): gray italics
5. **Toggle mask OFF**: all tokens become full opacity; stats update (in-loss = 41); caption changes.
6. **Toggle mask ON**: only assistant tokens (including their `<|im_end|>` markers) at full opacity; others dimmed; stats update.
7. **Hover any token**: tooltip in bottom-right shows index, text, role, and in-loss status.
8. **Hovered token** scales up slightly (transform: scale(1.05)) and gets a primary-text-color border.
9. **End-of-turn markers** (`<|im_end|>`) at the end of assistant turns are in-loss (true) — model must learn to stop. The `<|im_start|>` and `assistant` tokens before content are NOT in-loss.
10. **Stats panel** shows 6 cells: Total, In loss, % loss, System, User, Assistant. The "In loss" cell is highlighted.
11. **Pedagogical caption** updates when toggle changes: "ON" version explains masking; "OFF" version explains why no one does this.
12. **Mobile (< 720px):** stats panel collapses to 3 columns; token cards smaller.
13. **`npm run typecheck`** passes.
14. **`npm run build`** completes.

---

## Out of scope

- ❌ **Do not use a real tokenizer.** Hand-tokenize for clarity.
- ❌ **Do not animate token-by-token.** All tokens visible simultaneously.
- ❌ **Do not implement BPE.** Word-level "tokenization" is sufficient for the visualization.
- ❌ **Do not add a "gradient flow" visualization.** Out of scope for this widget; the mask is the focus.
- ❌ **Do not show multiple chat templates** here. Session 61's secondary widget owns template comparison.
- ❌ **Do not let the user edit the conversation.** Hand-tuned data is the point.
- ❌ **Do not flip Ch 13's status.** Session 61 owns that.

---

## Wire-up

```bash
git add src/components/widgets/ch13/ src/components/widgets/index.ts src/pages/ch13-sft/index.mdx
git commit -m "session 60: SFT loss masking marquee widget — response-only mask visualized"
git push origin main
```

Verify on production:
- 5 turns visible in token grid
- Mask ON by default; only assistant tokens at full color
- Toggle visibly changes which tokens are active
- Stats accurately reflect the role breakdown
- Hover works on all tokens

---

## Notes for the session author

**On the hand-tokenization being pedagogical, not realistic:**
Real BPE tokenizers split things like "Paris." into ["Paris", "."] and "assistant" into multiple subwords. The widget uses word-level approximations because:
1. **Subword tokens are visually noisy** — the reader's eye should focus on the masking pattern, not subword splitting
2. **The widget illustrates a *concept* (masking), not BPE specifics** (which Ch 3 covered)
3. **Real BPE would more than double the token count** and clutter the visualization

Acknowledge this implicitly via the widget caption: "tokenized in ChatML format" — doesn't claim BPE accuracy.

**On end-of-turn (`<|im_end|>`) being in-loss:**
This is a subtle but important detail. The assistant's `<|im_end|>` token IS in the loss because **the model must learn when to stop**. Without learning the end-of-turn marker, the model would continue generating indefinitely. The `<|im_start|>` and `assistant` tokens *before* the content are NOT in loss — those are the model being told "now respond"; they're context, not output.

This subtlety is visible in the data: assistant content tokens + final `<|im_end|>` are in_loss = true; everything else (including `<|im_start|>` + `assistant` role marker) is false.

**On the role colors:**
- **System = violet**: distinctive, evokes "behind the scenes" instruction
- **User = amber**: warm, conversational; evokes the human side
- **Assistant = cyan**: project default — and crucially, the "active" / "in-loss" color
- **Special tokens = tertiary gray**: visually quiet, italicized — these are the chrome, not the content

Cyan being the assistant color is intentional: when the mask is ON, the visualization is dominated by cyan = "this is what the model is learning to produce."

**On the toggle being binary (not a slider):**
The pedagogical contrast is binary: with masking vs without. Sliding between would suggest there's a continuum, which there isn't (you either mask or you don't, in standard SFT). A clear ON/OFF toggle makes the contrast stark.

**On the "OFF" mode caption being honest:**
The OFF mode says: "Slightly worse than masked SFT; not what anyone actually does in production." This is honest — no one trains without masking in real SFT. The OFF mode exists only to make the contrast visible. Don't oversell it as a real alternative.

**On the stats panel reflecting both modes:**
When mask is ON: total=41, in-loss=14. When OFF: total=41, in-loss=41. The "In loss" cell updates dynamically. Reader sees the percentage change (34% → 100%) and internalizes that masking dramatically restricts what the model learns from.

**Pedagogical claim this widget supports:**
"SFT masks the loss to assistant tokens only. A multi-turn conversation has many tokens (system prompt, user messages, role markers), but the model only learns to produce *responses*. With masking, ~30% of tokens contribute to gradient; the rest are context. This is the chapter's central mechanical detail, made concrete: see exactly which tokens the model learns from."

After 30 seconds of interaction, the reader has internalized: (a) a conversation is one long token sequence; (b) special tokens mark role boundaries; (c) standard SFT only learns from assistant tokens; (d) end-of-turn must be learned (model must know when to stop); (e) the unmasked alternative wastes capacity on user prompts.

**This is the chapter's central technical visualization.** No equation will make masking feel real the way this does.

Build with care.
