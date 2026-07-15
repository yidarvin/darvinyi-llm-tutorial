import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { tags as t } from '@lezer/highlight';
import { runPython } from '@lib/pyodide';
import styles from './RunnableCode.module.css';

/* darvinyi-cyan palette — design-system tokens.
 * Mirrors the custom Shiki theme defined inline in astro.config.mjs so
 * static fenced code blocks (Shiki, build-time) and RunnableCode editors
 * (CodeMirror, runtime) render identically. Keep these in sync with the
 * tokenColors block in astro.config.mjs. */
const darvinHighlight = HighlightStyle.define([
  { tag: t.comment, color: '#737373', fontStyle: 'italic' },          /* text-tertiary */
  { tag: t.lineComment, color: '#737373', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#737373', fontStyle: 'italic' },
  { tag: t.docString, color: '#10b981' },                             /* emerald-500 */
  { tag: t.string, color: '#10b981' },
  { tag: t.special(t.string), color: '#10b981' },
  { tag: t.regexp, color: '#10b981' },
  { tag: t.escape, color: '#f59e0b' },                                /* amber-500 */
  { tag: t.number, color: '#f59e0b' },
  { tag: t.bool, color: '#f59e0b' },
  { tag: t.null, color: '#f59e0b' },
  { tag: t.atom, color: '#f59e0b' },
  { tag: t.keyword, color: '#22d3ee' },                               /* cyan-400 */
  { tag: t.controlKeyword, color: '#22d3ee' },
  { tag: t.definitionKeyword, color: '#22d3ee' },
  { tag: t.moduleKeyword, color: '#22d3ee' },
  { tag: t.modifier, color: '#22d3ee' },
  { tag: t.operator, color: '#a3a3a3' },                              /* text-secondary */
  { tag: t.operatorKeyword, color: '#22d3ee' },
  { tag: t.self, color: '#22d3ee', fontStyle: 'italic' },
  { tag: t.function(t.variableName), color: '#67e8f9' },              /* cyan-300 */
  { tag: t.function(t.propertyName), color: '#67e8f9' },
  { tag: t.className, color: '#67e8f9' },
  { tag: t.typeName, color: '#67e8f9' },
  { tag: t.namespace, color: '#f5f5f5' },                             /* text-primary */
  { tag: t.definition(t.variableName), color: '#f5f5f5' },
  { tag: t.variableName, color: '#f5f5f5' },
  { tag: t.propertyName, color: '#f5f5f5' },
  { tag: t.punctuation, color: '#a3a3a3' },
  { tag: t.bracket, color: '#a3a3a3' },
  { tag: t.derefOperator, color: '#a3a3a3' },
  { tag: t.meta, color: '#22d3ee', fontStyle: 'italic' },             /* decorators */
  { tag: t.invalid, color: '#f43f5e' },                               /* rose-500 */
]);

export interface RunnableCodeProps {
  /** Source code for the editor. Either supply this OR pass a fenced
   * markdown code block as children — children are used as a fallback
   * when defaultCode is absent (handles `<RunnableCode>` ```python … ```
   * `</RunnableCode>` MDX form used across ch11–ch30). */
  defaultCode?: string;
  children?: ReactNode;
  packages?: string[];
  height?: number;
  outputHeight?: number;
  title?: string;
  readonly?: boolean;
  /** Keep a reference implementation visible without presenting a Run button
   * for code that requires a local runtime unavailable in Pyodide (for
   * example, CUDA-backed PyTorch). */
  runnable?: boolean;
}

type Status = 'idle' | 'loading' | 'running' | 'done' | 'error';

export default function RunnableCode({
  defaultCode,
  children,
  packages = ['numpy'],
  height = 240,
  outputHeight = 120,
  title,
  readonly = false,
  runnable = true,
}: RunnableCodeProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const childrenRef = useRef<HTMLDivElement>(null);
  /* Resolved source text — set during editor init, used by Reset/Run as
   * the canonical "original code" reference. Single source of truth
   * regardless of whether the code arrived via the prop or via children. */
  const resolvedCodeRef = useRef<string>('');
  const viewRef = useRef<EditorView | null>(null);
  const cancelledRef = useRef(false);

  const [status, setStatus] = useState<Status>('idle');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    /* Prefer the explicit `defaultCode` prop; fall back to text content of
     * rendered children (handles the MDX form where a fenced code block
     * is nested inside `<RunnableCode>...</RunnableCode>`). The hidden
     * container's textContent preserves the original whitespace and
     * newlines from Shiki's `<pre><code>` output. */
    let code = defaultCode;
    if (!code && childrenRef.current) {
      code = childrenRef.current.textContent ?? '';
    }
    if (!code) return; /* nothing to render — bail silently */
    resolvedCodeRef.current = code.trim();

    const state = EditorState.create({
      doc: resolvedCodeRef.current,
      extensions: [
        lineNumbers(),
        history(),
        python(),
        syntaxHighlighting(darvinHighlight),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.editable.of(!readonly),
        EditorView.theme(
          {
            '&': {
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
            },
            '.cm-content': {
              fontFamily: '"JetBrains Mono", "SF Mono", Menlo, monospace',
              padding: '12px 0',
              caretColor: 'var(--cyan-400)',
            },
            '.cm-gutters': {
              backgroundColor: 'transparent',
              border: 'none',
              borderRight: '1px solid var(--border-subtle)',
              color: 'var(--text-tertiary)',
              fontSize: '12px',
              paddingRight: '8px',
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'transparent',
              color: 'var(--cyan-400)',
            },
            '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.02)' },
            '.cm-cursor': { borderLeftColor: 'var(--cyan-400)' },
            '.cm-selectionBackground, & .cm-content ::selection': {
              background: 'rgba(6, 182, 212, 0.25) !important',
            },
            '&.cm-focused': { outline: 'none' },
            '.cm-scroller': { fontFamily: 'inherit' },
          },
          { dark: true }
        ),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });
    viewRef.current = view;

    return () => {
      cancelledRef.current = true;
      view.destroy();
      viewRef.current = null;
    };
  }, [defaultCode, children, readonly]);

  async function handleRun() {
    if (status === 'loading' || status === 'running') return;

    const code = viewRef.current?.state.doc.toString() ?? resolvedCodeRef.current;
    cancelledRef.current = false;
    setOutput('');
    setError(undefined);
    setStatus('loading');

    try {
      const wasAlreadyLoaded = typeof window !== 'undefined' && !!window.__pyodide;
      if (wasAlreadyLoaded) setStatus('running');

      const result = await runPython(code, packages);
      if (cancelledRef.current) return;

      setOutput(result.stdout);
      setError(result.error);
      setStatus(result.error ? 'error' : 'done');
    } catch (e: any) {
      if (cancelledRef.current) return;
      setError(String(e?.message ?? e));
      setStatus('error');
    }
  }

  function handleReset() {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      changes: {
        from: 0,
        to: viewRef.current.state.doc.length,
        insert: resolvedCodeRef.current,
      },
    });
    setOutput('');
    setError(undefined);
    setStatus('idle');
  }

  const isBusy = status === 'loading' || status === 'running';
  const statusLabel: Record<Status, string> = {
    idle: 'Run',
    loading: 'Loading Python…',
    running: 'Running…',
    done: 'Run',
    error: 'Run',
  };

  const cssVars = {
    '--rc-editor-height': `${height}px`,
    '--rc-output-height': `${outputHeight}px`,
  } as CSSProperties;

  return (
    <div className={styles.runnableCode} style={cssVars}>
      {title && <div className={styles.title}>{title}</div>}

      {isBusy && status === 'loading' && (
        <div className={styles.loadingBar} aria-hidden="true" />
      )}

      {/* Hidden container for the children-fallback path: when the chapter
       * uses `<RunnableCode>` ```python ... ``` `</RunnableCode>` instead
       * of the `defaultCode={...}` prop form, the MDX fenced block lands
       * here. We read its textContent in the editor-init effect, then
       * mount CodeMirror with that text. Hidden via the `hidden` HTML
       * attribute — content still lives in the DOM for textContent. */}
      {children && (
        <div ref={childrenRef} hidden aria-hidden="true">
          {children}
        </div>
      )}

      <div className={styles.editorWrap}>
        <div ref={editorContainerRef} className={styles.editor} />
      </div>

      <div className={styles.toolbar}>
        {runnable ? (
          <>
            <button
              type="button"
              onClick={handleRun}
              disabled={isBusy}
              className={styles.runButton}
              aria-label={isBusy ? statusLabel[status] : 'Run code'}
            >
              {isBusy && <span className={styles.spinner} aria-hidden="true" />}
              {statusLabel[status]}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isBusy}
              className={styles.resetButton}
              aria-label="Reset code to original"
            >
              Reset
            </button>
            {!readonly && (
              <span className={styles.editableTag} aria-hidden="true">
                Editable — click to modify
              </span>
            )}
          </>
        ) : (
          <span className={styles.editableTag}>
            Static reference: run in a local PyTorch environment
          </span>
        )}
      </div>

      {(output || error) && (
        <div className={`${styles.output} ${error ? styles.outputError : ''}`}>
          <pre className={styles.outputPre}>
            {output}
            {error && (output ? '\n' : '') + error}
          </pre>
        </div>
      )}
    </div>
  );
}
