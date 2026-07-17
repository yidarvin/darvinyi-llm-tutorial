import { useId, useRef, useState, type KeyboardEvent } from 'react';
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
  const regex = /("(?:[^"\\]|\\.)*")(\s*:)?|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])|(\s+)|([^\s{}[\],"]+)/g;
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
  const toolTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const schemaTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const toolTabIdPrefix = useId();
  const toolPanelId = useId();
  const schemaTabIdPrefix = useId();
  const schemaPanelId = useId();
  const tool = TOOLS[idx]!;

  const schemaData: object =
    tab === 'openai' ? tool.openaiSchema :
    tab === 'anthropic' ? tool.anthropicSchema :
    tool.sampleCall;

  const patternColor = PATTERN_COLORS[tool.pattern];
  const patternLabel = PATTERN_LABELS[tool.pattern];

  function selectTool(nextIdx: number) {
    setIdx(nextIdx);
    setTab('openai');
  }

  function selectSchemaTab(nextTab: SchemaTab) {
    setTab(nextTab);
  }

  function handleToolTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIdx: number) {
    let nextIdx: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        nextIdx = (currentIdx + 1) % TOOLS.length;
        break;
      case 'ArrowLeft':
        nextIdx = (currentIdx - 1 + TOOLS.length) % TOOLS.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = TOOLS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectTool(nextIdx);
    requestAnimationFrame(() => toolTabRefs.current[nextIdx]?.focus());
  }

  function handleSchemaTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIdx: number) {
    let nextIdx: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        nextIdx = (currentIdx + 1) % SCHEMA_TABS.length;
        break;
      case 'ArrowLeft':
        nextIdx = (currentIdx - 1 + SCHEMA_TABS.length) % SCHEMA_TABS.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = SCHEMA_TABS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectSchemaTab(SCHEMA_TABS[nextIdx]!.id);
    requestAnimationFrame(() => schemaTabRefs.current[nextIdx]?.focus());
  }

  return (
    <div className={styles.widget} role="group" aria-label="Tool schema builder">
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
          <div className={styles.toolButtons} role="tablist" aria-label="Tool examples">
            {TOOLS.map((t, i) => (
              <button
                key={t.id}
                ref={element => { toolTabRefs.current[i] = element; }}
                id={`${toolTabIdPrefix}-${t.id}`}
                role="tab"
                aria-selected={idx === i}
                aria-controls={toolPanelId}
                tabIndex={idx === i ? 0 : -1}
                className={`${styles.toolButton} ${idx === i ? styles.toolButtonActive : ''}`}
                style={{ borderLeftColor: PATTERN_COLORS[t.pattern] }}
                onClick={() => selectTool(i)}
                onKeyDown={event => handleToolTabKeyDown(event, i)}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div
        id={toolPanelId}
        className={styles.detailPanel}
        role="tabpanel"
        aria-labelledby={`${toolTabIdPrefix}-${tool.id}`}
      >
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
          <div className={styles.tabBar} role="tablist" aria-label="Schema format">
            {SCHEMA_TABS.map((t, i) => (
              <button
                key={t.id}
                ref={element => { schemaTabRefs.current[i] = element; }}
                id={`${schemaTabIdPrefix}-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={schemaPanelId}
                tabIndex={tab === t.id ? 0 : -1}
                className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
                onClick={() => selectSchemaTab(t.id)}
                onKeyDown={event => handleSchemaTabKeyDown(event, i)}
              >{t.label}</button>
            ))}
          </div>
          <div
            id={schemaPanelId}
            className={styles.codePanel}
            role="tabpanel"
            aria-labelledby={`${schemaTabIdPrefix}-${tab}`}
            tabIndex={0}
          >
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
