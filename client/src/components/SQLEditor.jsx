import Editor from '@monaco-editor/react';
import { Database, TerminalSquare } from 'lucide-react';
import { QueryToolbar } from './QueryToolbar';

export const defaultQuery = 'SELECT * FROM suspects;';

/** Noir syntax theme so the terminal reads as part of the game, not an IDE. */
function defineTheme(monaco) {
  monaco.editor.defineTheme('detective-noir', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'E8C766', fontStyle: 'bold' },
      { token: 'keyword.sql', foreground: 'E8C766', fontStyle: 'bold' },
      { token: 'operator.sql', foreground: 'F3F2EE' },
      { token: 'string', foreground: 'F0A0A8' },
      { token: 'string.sql', foreground: 'F0A0A8' },
      { token: 'number', foreground: '7FD4A3' },
      { token: 'comment', foreground: '6E6E7A', fontStyle: 'italic' },
      { token: 'predefined', foreground: '9DC7F0' },
      { token: 'identifier', foreground: 'E9E8EE' },
      { token: 'delimiter', foreground: 'A9A8B4' },
    ],
    colors: {
      'editor.background': '#0A0A0E',
      'editor.foreground': '#E9E8EE',
      'editorLineNumber.foreground': '#4A4A55',
      'editorLineNumber.activeForeground': '#C9A227',
      'editor.lineHighlightBackground': '#16161C',
      'editor.selectionBackground': '#7A0A1C88',
      'editorCursor.foreground': '#E5233F',
      'editorIndentGuide.background1': '#1E1E26',
      'editorWidget.background': '#12121A',
      'editorSuggestWidget.background': '#12121A',
      'editorSuggestWidget.border': '#2A2A34',
    },
  });
}

export function SQLEditor({ sql, onSqlChange, onRun, onReset, onClear, isRunning, canReset, onEditorMount }) {
  return (
    <section className="clip-corner flex min-h-[21rem] flex-col overflow-hidden panel-surface shadow-panel backdrop-blur-xl lg:min-h-0">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <TerminalSquare size={18} className="text-crimson-glow" strokeWidth={2} />
        <h2 className="font-display text-base font-semibold uppercase tracking-[0.18em] text-bone">Investigation terminal</h2>

        <div className="ml-auto flex items-center gap-2">
          <span className="clip-corner-sm inline-flex items-center gap-1.5 border border-verdict-clear/35 bg-verdict-clear/10 px-2.5 py-1.5 font-mono text-xs font-medium text-verdict-clear">
            <span className="h-1.5 w-1.5 rounded-full bg-verdict-clear" /> Connected
          </span>
          <span className="clip-corner-sm hidden items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs text-bone-muted sm:inline-flex">
            <Database size={12} strokeWidth={2.2} /> SQLite · Read only
          </span>
        </div>
      </header>

      <div className="min-h-[13rem] flex-1 bg-[#0A0A0E]">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={(value) => onSqlChange(value ?? '')}
          beforeMount={defineTheme}
          onMount={onEditorMount}
          theme="detective-noir"
          options={{
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
          }}
        />
      </div>

      <QueryToolbar onRun={onRun} onReset={onReset} onClear={onClear} isRunning={isRunning} canReset={canReset} />
    </section>
  );
}
