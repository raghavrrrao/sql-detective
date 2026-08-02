import { memo, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Database, TerminalSquare } from 'lucide-react';
import { QueryToolbar } from './QueryToolbar';

/** Noir syntax theme so the terminal reads as part of the game, not an IDE. */
function defineTheme(monaco) {
  monaco.editor.defineTheme('detective-noir', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'D9B45F', fontStyle: 'bold' },
      { token: 'keyword.sql', foreground: 'D9B45F', fontStyle: 'bold' },
      { token: 'operator.sql', foreground: 'F3F0E8' },
      { token: 'string', foreground: 'EC9AA6' },
      { token: 'string.sql', foreground: 'EC9AA6' },
      { token: 'number', foreground: '8FCCA3' },
      { token: 'comment', foreground: '8C8779', fontStyle: 'italic' },
      { token: 'predefined', foreground: '9BC0E0' },
      { token: 'identifier', foreground: 'E9E6DE' },
      { token: 'delimiter', foreground: 'A9A497' },
    ],
    /*
     * Re-tinted to the new palette. Monaco itself is untouched — this is the
     * theme it was always given, moved off pure black so the console reads as
     * a recessed panel in a charcoal room rather than a hole cut in the desk.
     */
    colors: {
      'editor.background': '#16161C',
      'editor.foreground': '#E9E6DE',
      'editorLineNumber.foreground': '#858591',
      'editorLineNumber.activeForeground': '#B89242',
      'editor.lineHighlightBackground': '#1E1E25',
      'editor.selectionBackground': '#6E111955',
      'editorCursor.foreground': '#C9273A',
      'editorIndentGuide.background1': '#26262F',
      'editorWidget.background': '#20202A',
      'editorSuggestWidget.background': '#20202A',
      'editorSuggestWidget.border': '#3A3A45',
    },
  });
}

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 15,
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontLigatures: true,
  lineHeight: 26,
  lineNumbersMinChars: 3,
  padding: { top: 18, bottom: 14 },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  renderLineHighlight: 'line',
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  automaticLayout: true,
  tabSize: 2,
  ariaLabel: 'SQL investigation terminal',
};

function SQLEditorComponent({ sql, onSqlChange, onRun, onReset, onClear, isRunning, canReset, onEditorReady }) {
  const editorRef = useRef(null);
  // Monaco captures a command callback once and keeps it forever, so the
  // shortcuts read the latest handlers through refs instead of stale closures.
  const handlersRef = useRef({ onRun, onClear });
  handlersRef.current = { onRun, onClear };

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handlersRef.current.onRun?.());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => handlersRef.current.onClear?.());
    onEditorReady?.(editor);
  }, [onEditorReady]);

  useEffect(() => () => { editorRef.current = null; }, []);

  const focusEditor = useCallback(() => editorRef.current?.focus(), []);

  // Toolbar actions hand the caret straight back so typing can continue.
  const handleRun = useCallback(() => { onRun?.(); focusEditor(); }, [onRun, focusEditor]);
  const handleReset = useCallback(() => { onReset?.(); focusEditor(); }, [onReset, focusEditor]);
  const handleClear = useCallback(() => { onClear?.(); focusEditor(); }, [onClear, focusEditor]);
  const handleChange = useCallback((value) => onSqlChange(value ?? ''), [onSqlChange]);

  return (
    <section className="clip-corner flex min-h-[21rem] flex-col overflow-hidden panel-surface shadow-panel backdrop-blur-xl lg:min-h-0">
      {/* A brass rail across the head of the console. Frame only — Monaco itself
          is never touched. */}
      <span aria-hidden="true" className="h-px w-full bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
      <header className="flex flex-wrap items-center gap-3 border-b border-bone/10 bg-gradient-to-b from-bone/[0.06] to-transparent px-5 py-4 shadow-[inset_0_-1px_0_rgba(184,146,66,0.4)]">
        <TerminalSquare size={18} className="text-crimson-glow" strokeWidth={2} aria-hidden="true" />
        <h2 className="font-display text-base font-medium uppercase tracking-[0.18em] text-bone">Investigation terminal</h2>
        <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bone-dim lg:inline">Evidence console</span>

        <div className="ml-auto flex items-center gap-2">
          <span className="clip-corner-sm inline-flex items-center gap-1.5 border border-verdict-clear/35 bg-verdict-clear/10 px-2.5 py-1.5 font-mono text-xs font-medium text-verdict-clear">
            <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-verdict-clear shadow-[0_0_6px_rgba(95,168,119,0.9)]" /> Connected
          </span>
          <span className="clip-corner-sm hidden items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs text-bone-muted sm:inline-flex">
            <Database size={12} strokeWidth={2.2} aria-hidden="true" /> SQLite · Read only
          </span>
        </div>
      </header>

      <div className="min-h-[13rem] flex-1 bg-[#16161C] shadow-[inset_0_8px_18px_-12px_rgba(0,0,0,0.9)]">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={handleChange}
          beforeMount={defineTheme}
          onMount={handleMount}
          theme="detective-noir"
          options={editorOptions}
        />
      </div>

      <QueryToolbar
        onRun={handleRun}
        onReset={handleReset}
        onClear={handleClear}
        isRunning={isRunning}
        canReset={canReset}
        canClear={sql !== ''}
      />
    </section>
  );
}

export const SQLEditor = memo(SQLEditorComponent);
