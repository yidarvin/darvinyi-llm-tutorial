import { useMemo, useState } from 'react';
import tokenizerData from './tokenizer-data.json';
import styles from './TokenizerComparison.module.css';

interface Tokenization {
  tokens: string[];
  tokenIds: number[];
  tokenCount: number;
  bytesPerToken: number;
}

interface Example {
  id: string;
  text: string;
  category: string;
  label: string;
  tokenizations: Record<string, Tokenization>;
}

interface TokenizerInfo {
  id: string;
  name: string;
  vocabSize: number;
  description: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  english: 'English',
  multilingual: 'Multilingual',
  numbers: 'Numbers',
  code: 'Code',
  special: 'Special',
};

const CATEGORY_COLORS: Record<string, string> = {
  english: 'var(--cyan-400)',
  multilingual: 'var(--amber-500)',
  numbers: 'var(--rose-500)',
  code: 'var(--emerald-500)',
  special: 'var(--text-secondary)',
};

export default function TokenizerComparison() {
  const data = tokenizerData as unknown as { tokenizers: TokenizerInfo[]; examples: Example[] };
  const [selectedId, setSelectedId] = useState(data.examples[0]!.id);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredExamples = useMemo(() => {
    if (!filterCategory) return data.examples;
    return data.examples.filter((e) => e.category === filterCategory);
  }, [filterCategory, data.examples]);

  const effectiveSelectedId = filteredExamples.find((e) => e.id === selectedId)
    ? selectedId
    : filteredExamples[0]?.id ?? selectedId;
  const selected = data.examples.find((e) => e.id === effectiveSelectedId)!;

  const textCharCount = Array.from(selected.text).length;
  const textByteCount = new TextEncoder().encode(selected.text).length;

  return (
    <div className={styles.widget}>
      <div className={styles.selectorRow}>
        <label className={styles.selectorLabel} htmlFor="tokenizer-example-select">
          Example:
        </label>
        <select
          id="tokenizer-example-select"
          className={styles.selector}
          value={effectiveSelectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {filteredExamples.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.originalPanel}>
        <div className={styles.panelTitle}>Original text</div>
        <div className={styles.originalText}>{selected.text}</div>
        <div className={styles.panelStats}>
          {textCharCount} chars · {textByteCount} UTF-8 bytes
        </div>
      </div>

      {data.tokenizers.map((tok) => {
        const t = selected.tokenizations[tok.id];
        if (!t) return null;
        return (
          <div key={tok.id} className={styles.tokenizerPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>{tok.name}</span>
              <span className={styles.panelVocab}>vocab {tok.vocabSize.toLocaleString()}</span>
            </div>
            <div className={styles.tokenList}>
              {t.tokens.map((token, i) => (
                <code
                  key={i}
                  className={`${styles.tokenChip} ${
                    i % 2 === 0 ? styles.tokenChipEven : styles.tokenChipOdd
                  }`}
                  title={`Token ID: ${t.tokenIds[i]}`}
                >
                  {token}
                </code>
              ))}
            </div>
            <div className={styles.panelStats}>
              <strong>{t.tokenCount}</strong> tokens ·{' '}
              <strong>{t.bytesPerToken.toFixed(2)}</strong> bytes/token
            </div>
          </div>
        );
      })}

      <div className={styles.chipRow}>
        <span className={styles.chipLabel}>Filter by category:</span>
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
          const isOn = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(isOn ? null : cat)}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={{ '--chip-color': CATEGORY_COLORS[cat] } as React.CSSProperties}
              aria-pressed={isOn}
            >
              <span className={styles.chipSwatch} />
              {label}
            </button>
          );
        })}
        {filterCategory && (
          <button onClick={() => setFilterCategory(null)} className={styles.resetButton}>
            Clear filter
          </button>
        )}
      </div>

      <div className={styles.helpBar}>
        Whitespace is shown as <code className={styles.tokenChipInline}>␣</code>; line breaks as{' '}
        <code className={styles.tokenChipInline}>↵</code>. Hover any token chip to see its numeric
        ID.
      </div>
    </div>
  );
}
