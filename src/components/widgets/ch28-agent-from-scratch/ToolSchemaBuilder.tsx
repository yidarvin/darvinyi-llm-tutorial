import { useState } from 'react';
import {
  TOOLS,
  PATTERN_COLORS,
  PATTERN_LABELS,
} from './tool-data';
import styles from './ToolSchemaBuilder.module.css';

type SchemaTab = 'openai' | 'anthropic' | 'sample';

interface JsonToken {
  text: string;
  kind: 'key' | 'string' | 'literal' | 'number' | 'punct' | 'space' | 'other';
}

function colorJson(json: string): JsonToken[] {
  const out: JsonToken[] = [];
  const regex = /("(?:[^"\\]|\\.)*")(\s*:)?|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([\{\}\[\],])|(\s+)|([^\s\{\}\[\],"]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(json)) !== null) {
    const str = m[1];
    const colon = m[2];
    const lit = m[3];
    const num = m[4];
    const punct = m[5];
    const space = m[6];
    const other = m[7];
    if (str !== undefined) {
      if (colon !== undefined) {
        out.push({ text: str, kind: 'key' });
        out.push({ text: colon, kind: 'punct' });
      } else {
        out.push({ text: str, kind: 'string' });
      }
    } else if (lit !== undefined) {
      out.push({ text: lit, kind: 'literal' });
    } else if (num !== undefined) {
      out.push({ text: num, kind: 'number' });
    } else if (punct !== undefined) {
      out.push({ text: punct, kind: 'punct' });
    } else if (space !== undefined) {
      out.push({ text: space, kind: 'space' });
    } else if (other !== undefined) {
      out.push({ text: other, kind: 'other' });
    }
  }
  return out;
}

/** Pretty-print JSON with key/string/number/bool color spans. */
function PrettyJson({ data }: { data: object }) {
  const json = JSON.stringify(data, null, 2);
  const tokens = colorJson(json);
  return (
    <pre className={styles.jsonPre}>
      <code>
        {tokens.map((t, i) => (
          <span key={i} className={styles[`json-${t.kind}`]}>{t.text}</span>
        ))}
      </code>
    </pre>
  );
}

const PYTHON_KEYWORDS = new Set([
  'def', 'return', 'if', 'else', 'elif', 'import', 'from', 'as',
  'with', 'for', 'in', 'None', 'True', 'False', 'raise', 'try',
  'except', 'finally', 'class',
]);

function renderPythonLine(line: string) {
  const out: React.ReactNode[] = [];
  const regex = /("""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|#[^\n]*|\b(?:def|return|if|else|elif|import|from|as|with|for|in|None|True|False|raise|try|except|finally|class)\b|\b\d+\b|[a-zA-Z_][a-zA-Z0-9_]*|.)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(line)) !== null) {
    const tok = m[1];
    if (tok === undefined) continue;
    if (tok.startsWith('"""') || (tok.startsWith('"') && tok.length > 1)) {
      out.push(<span key={key++} className={styles['py-string']}>{tok}</span>);
    } else if (tok.startsWith('#')) {
      out.push(<span key={key++} className={styles['py-comment']}>{tok}</span>);
    } else if (PYTHON_KEYWORDS.has(tok)) {
      out.push(<span key={key++} className={styles['py-keyword']}>{tok}</span>);
    } else if (/^\d+$/.test(tok)) {
      out.push(<span key={key++} className={styles['py-number']}>{tok}</span>);
    } else {
      out.push(<span key={key++}>{tok}</span>);
    }
  }
  // Render an empty line as a non-breaking space so the line height is preserved
  if (out.length === 0) out.push(<span key={0}>{' '}</span>);
  return out;
}

/** Pretty-print Python source with simple syntax coloring. */
function PrettyPython({ source }: { source: string }) {
  const lines = source.split('\n');
  return (
    <pre className={styles.pythonPre}>
      <code>
        {lines.map((line, i) => (
          <div key={i} className={styles.pythonLine}>{renderPythonLine(line)}</div>
        ))}
      </code>
    </pre>
  );
}

const SCHEMA_TABS: { id: SchemaTab; label: string }[] = [
  { id: 'openai',    label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'sample',    label: 'Sample LLM call' },
];

export default function ToolSchemaBuilder() {
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<SchemaTab>('openai');
  const tool = TOOLS[idx]!;

  const schemaData: object =
    tab === 'openai' ? tool.openaiSchema :
    tab === 'anthropic' ? tool.anthropicSchema :
    tool.sampleCall;

  const patternColor = PATTERN_COLORS[tool.pattern];
  const patternLabel = PATTERN_LABELS[tool.pattern];

  return (
    <div className={styles.widget}>
      {/* Title */}
      <div className={styles.titlePanel}>
        <div className={styles.titleLabel}>Tool schema builder</div>
        <div className={styles.titleSubLabel}>
          {TOOLS.length} tools · Python → OpenAI / Anthropic schemas · sample LLM call
        </div>
      </div>

      {/* Picker */}
      <div className={styles.controlsPanel}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Pick a tool:</span>
          <div className={styles.toolButtons}>
            {TOOLS.map((t, i) => (
              <button
                key={t.id}
                className={`${styles.toolButton} ${idx === i ? styles.toolButtonActive : ''}`}
                style={{ borderLeftColor: PATTERN_COLORS[t.pattern] }}
                onClick={() => { setIdx(i); setTab('openai'); }}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>{tool.label}</div>
          <div
            className={styles.patternBadge}
            style={{
              background: `color-mix(in srgb, ${patternColor} 18%, transparent)`,
              color: patternColor,
              borderColor: `color-mix(in srgb, ${patternColor} 40%, transparent)`,
            }}
          >
            {patternLabel}
          </div>
        </div>

        {/* Python source */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Python source</div>
          <div className={styles.codePanel}>
            <PrettyPython source={tool.pythonSource} />
          </div>
        </div>

        {/* Schema tabs */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Schema</div>
          <div className={styles.tabBar}>
            {SCHEMA_TABS.map(t => (
              <button
                key={t.id}
                className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
                onClick={() => setTab(t.id)}
              >{t.label}</button>
            ))}
          </div>
          <div className={styles.codePanel}>
            <PrettyJson data={schemaData} />
          </div>
        </div>

        {/* Design note */}
        <div className={styles.notePanel}>
          <div className={styles.noteLabel}>Schema design note</div>
          <div className={styles.noteText}>{tool.designNote}</div>
        </div>
      </div>

      {/* Pedagogical caption */}
      <div className={styles.caption}>
        Cycle through the tools. <strong>Each Python function compiles to a schema</strong> the LLM
        reads to decide whether and how to call it. <strong>OpenAI and Anthropic schemas are nearly
        identical</strong>: minor key differences (<code>function</code> vs <code>name</code>), same
        underlying mechanism. <strong>The sample LLM call</strong> shows what the LLM actually emits:
        a structured <code>tool_calls</code> array with the function name and JSON-encoded arguments.
        {' '}<strong>Schema design IS contract design</strong>: descriptions, type constraints, enums,
        and required fields are what stops the LLM from passing malformed inputs. The most
        under-appreciated piece of agent engineering, now visible.
      </div>
    </div>
  );
}
