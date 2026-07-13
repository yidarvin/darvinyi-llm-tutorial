import { useState, useMemo } from 'react';
import {
  FRAMEWORKS, CATEGORY_COLORS, CATEGORY_LABELS, recommend,
  type Framework, type PickerInputs,
  type LangChainAnswer, type Sensitivity,
} from './framework-data';
import styles from './FrameworkPicker.module.css';


function SegmentedControl<T extends string>(props: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.segmented}>
      {props.options.map(o => (
        <button
          key={o.value}
          className={`${styles.segmentedOption} ${props.value === o.value ? styles.segmentedOptionActive : ''}`}
          onClick={() => props.onChange(o.value)}
        >{o.label}</button>
      ))}
    </div>
  );
}


function FrameworkDetailPanel({ framework, isExpanded, onToggle }: {
  framework: Framework;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = CATEGORY_COLORS[framework.category];

  return (
    <div className={`${styles.frameworkCard} ${isExpanded ? styles.frameworkCardExpanded : ''}`}>
      <button className={styles.frameworkHeader} onClick={onToggle}>
        <span className={styles.frameworkChevron}>{isExpanded ? '▼' : '▶'}</span>
        <span
          className={styles.categoryDot}
          style={{ background: color }}
        />
        <span className={styles.frameworkName}>{framework.label}</span>
        <span className={styles.frameworkCategoryInline}>{CATEGORY_LABELS[framework.category]}</span>
      </button>

      {isExpanded && (
        <div className={styles.frameworkDetail}>
          <div className={styles.philosophyBox}>
            <strong>Philosophy:</strong> {framework.philosophy}
          </div>

          <div className={styles.descriptionText}>{framework.description}</div>

          <div className={styles.twoColGrid}>
            <div className={styles.column}>
              <div className={styles.colHeader}>✓ Strengths</div>
              <ul className={`${styles.detailList} ${styles.listEmerald}`}>
                {framework.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className={styles.column}>
              <div className={styles.colHeader}>✗ Weaknesses</div>
              <ul className={`${styles.detailList} ${styles.listRose}`}>
                {framework.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>

          <div className={styles.twoColGrid}>
            <div className={styles.column}>
              <div className={styles.colHeader}>When to use</div>
              <ul className={`${styles.detailList} ${styles.listCyan}`}>
                {framework.whenToUse.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
            <div className={styles.column}>
              <div className={styles.colHeader}>When NOT to use</div>
              <ul className={`${styles.detailList} ${styles.listRose}`}>
                {framework.whenNotToUse.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
          </div>

          <div className={styles.metaFooter}>
            <div><strong>Pricing:</strong> {framework.pricing}</div>
            <div><strong>Stack alignment:</strong> {framework.stackAlignment}</div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function FrameworkPicker() {
  const [inputs, setInputs] = useState<PickerInputs>({
    usesLangChain: 'unknown',
    costSensitivity: 'medium',
    evalDiscipline: 'medium',
    vendorIndependent: false,
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const recommendations = useMemo(() => recommend(inputs), [inputs]);
  const top = recommendations[0]!;
  const runners = recommendations.slice(1, 4);
  const topFramework = FRAMEWORKS.find(f => f.id === top.frameworkId)!;

  function toggle(id: string) {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  }

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Framework picker</div>
        <div className={styles.titleSubLabel}>
          Toggle inputs · see recommended framework with reasoning
        </div>
      </div>

      {/* Inputs */}
      <div className={styles.inputsPanel}>
        <div className={styles.inputRow}>
          <span className={styles.inputLabel}>Existing LangChain / LangGraph stack?</span>
          <SegmentedControl<LangChainAnswer>
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'unknown', label: 'Unknown' },
            ]}
            value={inputs.usesLangChain}
            onChange={v => setInputs({ ...inputs, usesLangChain: v })}
          />
        </div>

        <div className={styles.inputRow}>
          <span className={styles.inputLabel}>Cost sensitivity:</span>
          <SegmentedControl<Sensitivity>
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            value={inputs.costSensitivity}
            onChange={v => setInputs({ ...inputs, costSensitivity: v })}
          />
        </div>

        <div className={styles.inputRow}>
          <span className={styles.inputLabel}>Team eval discipline:</span>
          <SegmentedControl<Sensitivity>
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            value={inputs.evalDiscipline}
            onChange={v => setInputs({ ...inputs, evalDiscipline: v })}
          />
        </div>

        <div className={styles.inputRow}>
          <span className={styles.inputLabel}>Vendor independence required?</span>
          <SegmentedControl<'yes' | 'no'>
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={inputs.vendorIndependent ? 'yes' : 'no'}
            onChange={v => setInputs({ ...inputs, vendorIndependent: v === 'yes' })}
          />
        </div>
      </div>

      {/* Top recommendation */}
      <div className={styles.topRecommendation}>
        <div className={styles.topRecHeader}>
          <span className={styles.topRecBadge}>▶ Top recommendation</span>
          <span className={styles.topRecScore}>Score: {top.score}</span>
        </div>

        <div className={styles.topRecFramework}>
          <div className={styles.topRecTitle}>{topFramework.label.toUpperCase()}</div>
          <div
            className={styles.topRecCategory}
            style={{
              background: `color-mix(in srgb, ${CATEGORY_COLORS[topFramework.category]} 18%, transparent)`,
              color: CATEGORY_COLORS[topFramework.category],
              borderColor: `color-mix(in srgb, ${CATEGORY_COLORS[topFramework.category]} 40%, transparent)`,
            }}
          >{CATEGORY_LABELS[topFramework.category]}</div>
        </div>

        <div className={styles.topRecPhilosophy}>{topFramework.philosophy}</div>

        {top.reasoning.length > 0 && (
          <div className={styles.reasoningPanel}>
            <div className={styles.sectionLabel}>Why this recommendation</div>
            <ul className={styles.reasoningList}>
              {top.reasoning.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {top.reasoning.length === 0 && (
          <div className={styles.neutralNote}>
            Your inputs don't strongly prefer one framework. Try adjusting them or
            explore the directory below.
          </div>
        )}
      </div>

      {/* Runners-up */}
      {runners.length > 0 && runners.some(r => r.score > 0) && (
        <div className={styles.runnersPanel}>
          <div className={styles.sectionLabel}>Runners-up</div>
          <table className={styles.runnersTable}>
            <tbody>
              {runners.map(r => {
                const fw = FRAMEWORKS.find(f => f.id === r.frameworkId)!;
                return (
                  <tr key={r.frameworkId}>
                    <td>{fw.label}</td>
                    <td>
                      <span
                        className={styles.categoryDot}
                        style={{ background: CATEGORY_COLORS[fw.category] }}
                      />
                      <span className={styles.runnerCategory}>{CATEGORY_LABELS[fw.category]}</span>
                    </td>
                    <td className={styles.runnerScore}>{r.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* All frameworks directory */}
      <div className={styles.directoryPanel}>
        <div className={styles.sectionLabel}>All frameworks (click for detail)</div>
        <div className={styles.frameworkList}>
          {FRAMEWORKS.map(fw => (
            <FrameworkDetailPanel
              key={fw.id}
              framework={fw}
              isExpanded={expandedIds.has(fw.id)}
              onToggle={() => toggle(fw.id)}
            />
          ))}
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        <strong>No framework is universally best.</strong> LangSmith excels on LangChain stacks;
        Helicone wins when cost monitoring is the dominant concern; Braintrust shines for eval-driven
        teams; Anthropic's tooling is best for Anthropic-native deployments; OpenTelemetry is the
        future-proof open standard; <strong>custom code wins when surface area is small</strong> and
        lock-in is unacceptable. <strong>The right framework is the one your team will actually
        use</strong>: feature overload often correlates with under-adoption. <strong>Most production
        systems</strong> use one framework as scaffolding plus custom logic. <strong>The framework is
        plumbing</strong>, not the system. Treat it accordingly.
      </div>
    </div>
  );
}
