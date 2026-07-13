import { useState, useMemo } from 'react';
import {
  SAMPLES, scanContent, CATEGORY_COLORS, SOURCE_ICONS,
  type PatternMatch,
} from './injection-data';
import styles from './PromptInjectionClassifier.module.css';

export default function PromptInjectionClassifier() {
  const [sampleIdx, setSampleIdx] = useState(1);
  const sample = SAMPLES[sampleIdx]!;
  const matches = useMemo(() => scanContent(sample.content), [sample]);

  const decision = useMemo(() => {
    if (matches.length === 0) return { label: 'ALLOW', tone: 'safe' as const };
    if (matches.length <= 2)   return { label: 'FLAG for human review', tone: 'warn' as const };
    return { label: 'BLOCK', tone: 'danger' as const };
  }, [matches]);

  const highlightedContent = useMemo(() => {
    if (matches.length === 0) {
      return <span>{sample.content}</span>;
    }
    const runs: Array<{ text: string; match: PatternMatch | null }> = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.start < cursor) continue;
      if (m.start > cursor) runs.push({ text: sample.content.slice(cursor, m.start), match: null });
      runs.push({ text: sample.content.slice(m.start, m.end), match: m });
      cursor = m.end;
    }
    if (cursor < sample.content.length) {
      runs.push({ text: sample.content.slice(cursor), match: null });
    }
    return runs.map((run, i) =>
      run.match ? (
        <mark
          key={i}
          className={styles.highlight}
          style={{
            background: `color-mix(in srgb, ${CATEGORY_COLORS[run.match.category]} 14%, transparent)`,
            borderColor: CATEGORY_COLORS[run.match.category],
            color: CATEGORY_COLORS[run.match.category],
          }}
          title={`${run.match.category}: ${run.match.description}`}
        >{run.text}</mark>
      ) : (
        <span key={i}>{run.text}</span>
      )
    );
  }, [sample, matches]);

  return (
    <div className={styles.widget}>
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Prompt injection classifier</div>
        <div className={styles.titleSubLabel}>
          Pattern-based scan over preset retrieved content · 5 pattern categories
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a sample:</span>
          <div className={styles.sampleButtons}>
            {SAMPLES.map((s, i) => (
              <button
                key={s.id}
                className={`${styles.sampleButton} ${sampleIdx === i ? styles.sampleButtonActive : ''} ${s.isAdversarial ? styles.sampleButtonAdv : styles.sampleButtonClean}`}
                onClick={() => setSampleIdx(i)}
              >
                <span className={styles.sampleIcon}>{SOURCE_ICONS[s.source]}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.statusPanel}>
        <div className={styles.statusItem}>
          <div className={styles.statusLabel}>Ground truth</div>
          <div className={`${styles.statusValue} ${sample.isAdversarial ? styles.statusAdv : styles.statusClean}`}>
            {sample.isAdversarial ? 'ADVERSARIAL' : 'CLEAN'}
          </div>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusLabel}>Scanner decision</div>
          <div className={`${styles.statusValue} ${styles[`statusTone_${decision.tone}`]}`}>
            {decision.label}
          </div>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusLabel}>Matches</div>
          <div className={styles.statusValue}>{matches.length}</div>
        </div>
      </div>

      <div className={styles.contentPanel}>
        <div className={styles.sectionLabel}>Content (matched patterns highlighted)</div>
        <pre className={styles.contentBlock}>{highlightedContent}</pre>
      </div>

      {matches.length > 0 && (
        <div className={styles.matchesPanel}>
          <div className={styles.sectionLabel}>Matched patterns ({matches.length})</div>
          <ul className={styles.matchesList}>
            {matches.map((m, i) => (
              <li key={i} className={styles.matchItem}>
                <span
                  className={styles.matchSwatch}
                  style={{ background: CATEGORY_COLORS[m.category] }}
                />
                <div className={styles.matchInfo}>
                  <div className={styles.matchHeader}>
                    <span className={styles.matchCategory}>{m.category}</span>
                    <span className={styles.matchText}>"{m.matchedText}"</span>
                  </div>
                  <div className={styles.matchDescription}>{m.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.notePanel}>
        <div className={styles.noteLabel}>About this sample</div>
        <div className={styles.noteText}>{sample.note}</div>
      </div>

      <div className={styles.limitationsPanel}>
        <div className={styles.limitationsLabel}>Limitations of pattern matching</div>
        <div className={styles.limitationsText}>
          Pattern scanners catch <strong>known patterns</strong>. Novel attacks — paraphrased instructions,
          encoded payloads, language variants, semantic injections — bypass them. <strong>This is one layer
          of defense-in-depth</strong>, not a complete solution. Production safety combines pattern filters,
          model-based classifiers, structural separation of trusted vs untrusted content, and tool-call
          sandboxing.
        </div>
      </div>

      <div className={styles.caption}>
        Click through the samples. Notice that <strong>three of the clean samples</strong> match no patterns
        and all four <strong>adversarial samples</strong> match multiple. <strong>The calendar invite</strong>
        demonstrates how easily an attacker can plant instructions in content the user didn't write —
        anyone can send a meeting invite. <strong>The web snippet</strong> shows how invisible HTML
        (0px text, white-on-white) carries hidden payloads that humans don't see. <strong>Defense-in-depth
        is the rule</strong>, not a single magic filter.
      </div>
    </div>
  );
}
