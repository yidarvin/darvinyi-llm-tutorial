import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { runPython } from '@lib/pyodide';
import styles from './RunnableCode.module.css';

export interface RunnableCodeProps {
  defaultCode: string;
  packages?: string[];
  height?: number;
  outputHeight?: number;
  title?: string;
  readonly?: boolean;
}

type Status = 'idle' | 'loading' | 'running' | 'done' | 'error';

export default function RunnableCode({
  defaultCode,
  packages = ['numpy'],
  height = 240,
  outputHeight = 120,
  title,
  readonly = false,
}: RunnableCodeProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const cancelledRef = useRef(false);

  const [status, setStatus] = useState<Status>('idle');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const state = EditorState.create({
      doc: defaultCode.trim(),
      extensions: [
        lineNumbers(),
        history(),
        python(),
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
  }, [defaultCode, readonly]);

  async function handleRun() {
    if (status === 'loading' || status === 'running') return;

    const code = viewRef.current?.state.doc.toString() ?? defaultCode;
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
        insert: defaultCode.trim(),
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

      <div className={styles.editorWrap}>
        <div ref={editorContainerRef} className={styles.editor} />
      </div>

      <div className={styles.toolbar}>
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
