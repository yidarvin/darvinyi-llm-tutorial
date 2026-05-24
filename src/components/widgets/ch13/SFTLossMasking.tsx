import { useMemo, useState } from 'react';
import { CONVERSATION, getStats, type Token } from './conversation-data';
import styles from './SFTLossMasking.module.css';

export default function SFTLossMasking() {
  const [maskOn, setMaskOn] = useState(true);
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null);

  const stats = useMemo(() => getStats(), []);

  return (
    <div className={styles.widget}>
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

      <div className={styles.statsPanel}>
        <Stat label="Total tokens" value={stats.total.toString()} />
        <Stat label="In loss" value={maskOn ? stats.inLoss.toString() : stats.total.toString()} highlight />
        <Stat label="% in loss" value={`${maskOn ? stats.inLossPct.toFixed(0) : '100'}%`} />
        <Stat label="System" value={stats.byRole.system.toString()} />
        <Stat label="User" value={stats.byRole.user.toString()} />
        <Stat label="Assistant" value={stats.byRole.assistant.toString()} />
      </div>

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
