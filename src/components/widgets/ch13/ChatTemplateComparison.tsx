import { useState } from 'react';
import {
  TEMPLATES,
  CONVERSATION,
  formatConversation,
  type TemplateId,
} from './template-data';
import styles from './ChatTemplateComparison.module.css';

const TEMPLATE_IDS: TemplateId[] = ['chatml', 'llama3', 'mistral', 'gemma'];

export default function ChatTemplateComparison() {
  const [selected, setSelected] = useState<TemplateId>('chatml');
  const info = TEMPLATES[selected];
  const segments = formatConversation(selected, CONVERSATION);

  return (
    <div className={styles.widget}>
      <div className={styles.tabs}>
        <span className={styles.tabsLabel}>Template:</span>
        {TEMPLATE_IDS.map(id => (
          <button
            key={id}
            className={`${styles.tab} ${selected === id ? styles.tabActive : ''}`}
            onClick={() => setSelected(id)}
          >
            {TEMPLATES[id].label}
          </button>
        ))}
      </div>

      <div className={styles.descriptionPanel}>
        <div className={styles.descriptionTitle}>{info.label}</div>
        <div className={styles.descriptionBody}>{info.description}</div>
      </div>

      <div className={styles.outputPanel}>
        <div className={styles.outputTitle}>Formatted conversation</div>
        <pre className={styles.outputBlock}>
          {segments.map((s, i) => {
            if (s.type === 'special')
              return (
                <span key={i} className={styles.segSpecial}>
                  {s.text}
                </span>
              );
            if (s.type === 'role')
              return (
                <span key={i} className={styles.segRole}>
                  {s.text}
                </span>
              );
            if (s.type === 'newline') return s.text;
            return (
              <span key={i} className={styles.segContent}>
                {s.text}
              </span>
            );
          })}
        </pre>
        <div className={styles.outputMeta}>
          <div className={styles.outputMetaRow}>
            <span className={styles.outputMetaLabel}>Special tokens:</span>
            <span className={styles.outputMetaValue}>
              {info.specialTokens.map((t, i) => (
                <code key={i} className={styles.tokenChip}>
                  {t}
                </code>
              ))}
            </span>
          </div>
          <div className={styles.outputMetaRow}>
            <span className={styles.outputMetaLabel}>Used by:</span>
            <span className={styles.outputMetaValue}>{info.models.join(', ')}</span>
          </div>
        </div>
      </div>

      <div className={styles.compareTable}>
        <div className={styles.compareTitle}>Feature comparison</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Feature</th>
              <th>ChatML</th>
              <th>Llama-3</th>
              <th>Mistral</th>
              <th>Gemma</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>System role</td>
              <Yes ok={TEMPLATES.chatml.hasSystemRole} />
              <Yes ok={TEMPLATES.llama3.hasSystemRole} />
              <Yes ok={TEMPLATES.mistral.hasSystemRole} />
              <Yes ok={TEMPLATES.gemma.hasSystemRole} />
            </tr>
            <tr>
              <td>Special tokens</td>
              <td>{TEMPLATES.chatml.specialTokens.length}</td>
              <td>{TEMPLATES.llama3.specialTokens.length}</td>
              <td>{TEMPLATES.mistral.specialTokens.length}</td>
              <td>{TEMPLATES.gemma.specialTokens.length}</td>
            </tr>
            <tr>
              <td>End-of-turn marker</td>
              <td>
                <code>{'<|im_end|>'}</code>
              </td>
              <td>
                <code>{'<|eot_id|>'}</code>
              </td>
              <td>
                <code>{'</s>'}</code>
              </td>
              <td>
                <code>{'<end_of_turn>'}</code>
              </td>
            </tr>
            <tr>
              <td>Role marker</td>
              <td>
                <code>{'<|im_start|>'}</code>
              </td>
              <td>
                <code>{'<|start_header_id|>'}</code>
              </td>
              <td>
                <code>[INST]</code>
              </td>
              <td>
                <code>{'<start_of_turn>'}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.caption}>
        The same conversation, four different formats.{' '}
        <strong>Each model expects its specific template</strong>: the special tokens were
        learned during pre-training. Using ChatML tokens with a Llama-3 model produces broken
        output: the model doesn't recognize the role markers.{' '}
        <strong>Always use the model's intended template</strong> via{' '}
        <code>tokenizer.apply_chat_template()</code>, which ships the right format in every
        modern tokenizer.
      </div>
    </div>
  );
}

function Yes({ ok }: { ok: boolean }) {
  return <td className={ok ? styles.yes : styles.no}>{ok ? '✓' : '✗'}</td>;
}
