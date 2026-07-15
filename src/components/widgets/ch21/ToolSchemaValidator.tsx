import { useState, useMemo } from 'react';
import {
  SCHEMAS, CASES, validate,
  type ToolSchema,
} from './schema-cases-data';
import styles from './ToolSchemaValidator.module.css';

export default function ToolSchemaValidator() {
  const [schemaIdx, setSchemaIdx] = useState(0);
  const [caseIdx, setCaseIdx] = useState(0);

  const schema = SCHEMAS[schemaIdx]!;
  const cases = CASES[schema.id] ?? [];
  const currentCase = cases[caseIdx] ?? cases[0]!;

  const result = useMemo(() => validate(currentCase.call, SCHEMAS), [currentCase]);

  return (
    <div className={styles.widget} role="group" aria-label="Tool schema validator">
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Tool schema validator</div>
        <div className={styles.titleSubLabel}>
          See what passes structural validation, and what doesn't
        </div>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a schema:</span>
          <div className={styles.schemaButtons}>
            {SCHEMAS.map((s, i) => (
              <button
                key={s.id}
                className={`${styles.schemaButton} ${schemaIdx === i ? styles.schemaButtonActive : ''}`}
                onClick={() => {
                  setSchemaIdx(i);
                  setCaseIdx(0);
                }}
              >{s.name}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.codePanel}>
        <div className={styles.codeTitle}>Schema definition</div>
        <pre className={styles.codeBlock}>{formatSchema(schema)}</pre>
      </div>

      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Try a tool call:</span>
        </div>
        <div className={styles.caseButtons}>
          {cases.map((c, i) => {
            const isValid = c.label.startsWith('✓');
            return (
              <button
                key={i}
                className={`${styles.caseButton} ${caseIdx === i ? styles.caseButtonActive : ''} ${isValid ? styles.caseButtonValid : styles.caseButtonInvalid}`}
                onClick={() => setCaseIdx(i)}
              >{c.label}</button>
            );
          })}
        </div>
        <div className={styles.caseDescription}>
          {currentCase.description}
        </div>
      </div>

      <div className={styles.codePanel}>
        <div className={styles.codeTitle}>Tool call (what the model would emit)</div>
        <pre className={styles.codeBlock}>{formatToolCall(currentCase.call)}</pre>
      </div>

      <div className={`${styles.resultPanel} ${result.ok ? styles.resultValid : styles.resultInvalid}`}>
        <div className={styles.resultHeader}>
          {result.ok ? '✓ Valid' : '✗ Invalid'}
        </div>
        {result.ok ? (
          <div className={styles.resultBody}>
            This call would pass the API's structural validation.
            Constrained decoding (Ch 19) guarantees this structure at generation time.
          </div>
        ) : (
          <>
            <div className={styles.errorList}>
              <div className={styles.errorListLabel}>Errors:</div>
              <ul>
                {result.errors.map((e, i) => (
                  <li key={i} className={styles.errorItem}>{e.message}</li>
                ))}
              </ul>
            </div>
            <div className={styles.resultBody}>
              The model's API call would fail at the schema-validation layer.
              The system returns the error as an observation; the model uses
              it to retry or pivot (Section 6).
            </div>
          </>
        )}
      </div>

      <div className={styles.caption}>
        Click through the cases. <strong>Valid calls</strong> (cyan ✓) have all required fields, correct
        types, and values within range. <strong>Invalid calls</strong> (rose ✗) fail at the API layer
        with structured errors; the model gets these as observations and recovers. <strong>Constrained
        decoding</strong> (Ch 19) prevents most invalid calls at generation; <strong>semantic correctness</strong>
        (e.g., "Atlantis" isn't a real city) still requires tool-level validation (Section 6's idempotency
        and error-recovery patterns).
      </div>
    </div>
  );
}

function formatSchema(s: ToolSchema): string {
  return JSON.stringify(
    {
      name: s.name,
      description: s.description,
      input_schema: s.inputSchema,
    },
    null,
    2,
  );
}

function formatToolCall(call: { name: string; input: Record<string, unknown> }): string {
  return JSON.stringify(call, null, 2);
}
