import { memo } from 'react';
import { Eraser, Play, RotateCcw, ShieldCheck } from 'lucide-react';

function Shortcut({ children }) {
  return (
    <kbd className="clip-corner-sm border border-white/12 bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs font-medium text-bone-muted">
      {children}
    </kbd>
  );
}

function QueryToolbarComponent({ onRun, onReset, onClear, isRunning, canReset, canClear = true }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-t border-white/10 bg-black/35 p-3.5">
      <button
        type="button"
        onClick={onRun}
        disabled={isRunning}
        aria-busy={isRunning}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        className="clip-corner-sm group relative inline-flex items-center gap-2 overflow-hidden border border-crimson-bright/60 bg-crimson px-4 py-2.5 font-display text-sm font-medium uppercase tracking-[0.14em] text-white shadow-crimson transition-colors hover:bg-crimson-bright disabled:cursor-wait disabled:border-white/10 disabled:bg-charcoal-light disabled:text-bone-dim disabled:shadow-none"
      >
        <span aria-hidden="true" className="absolute inset-y-0 -left-full w-1/3 skew-x-[-20deg] bg-white/20 transition-transform duration-500 group-hover:translate-x-[400%]" />
        <span className="relative flex items-center gap-2">
          <Play size={15} strokeWidth={2.4} aria-hidden="true" /> {isRunning ? 'Executing…' : 'Run query'}
        </span>
      </button>

      <button
        type="button"
        onClick={onReset}
        disabled={!canReset}
        title="Restore this case's opening query"
        className="clip-corner-sm inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright disabled:cursor-not-allowed disabled:text-bone-dim disabled:hover:border-white/12"
      >
        <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" /> Reset
      </button>

      <button
        type="button"
        onClick={onClear}
        disabled={!canClear}
        aria-keyshortcuts="Control+L Meta+L"
        title="Empty the terminal"
        className="clip-corner-sm inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright disabled:cursor-not-allowed disabled:text-bone-dim disabled:hover:border-white/12"
      >
        <Eraser size={15} strokeWidth={2.2} aria-hidden="true" /> Clear
      </button>

      <p className="hidden items-center gap-1.5 text-xs text-bone-dim lg:flex">
        <Shortcut>Ctrl</Shortcut>
        <span aria-hidden="true">+</span>
        <Shortcut>Enter</Shortcut>
        <span>to run</span>
      </p>

      <span className="ml-auto hidden items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-verdict-clear sm:flex">
        <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" /> Read only
      </span>
    </div>
  );
}

export const QueryToolbar = memo(QueryToolbarComponent);
