import { Eraser, Play, RotateCcw, ShieldCheck } from 'lucide-react';

export function QueryToolbar({ onRun, onReset, onClear, isRunning, canReset }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-t border-white/10 bg-black/35 p-3.5">
      <button
        type="button"
        onClick={onRun}
        disabled={isRunning}
        className="clip-corner-sm group relative inline-flex items-center gap-2 overflow-hidden border border-crimson-bright/60 bg-crimson px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-crimson transition-colors hover:bg-crimson-bright disabled:cursor-wait disabled:border-white/10 disabled:bg-charcoal-light disabled:text-bone-dim disabled:shadow-none"
      >
        <span aria-hidden="true" className="absolute inset-y-0 -left-full w-1/3 skew-x-[-20deg] bg-white/20 transition-transform duration-500 group-hover:translate-x-[400%]" />
        <span className="relative flex items-center gap-2">
          <Play size={15} strokeWidth={2.4} /> {isRunning ? 'Executing…' : 'Run query'}
        </span>
      </button>

      <button
        type="button"
        onClick={onReset}
        disabled={!canReset}
        className="clip-corner-sm inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright disabled:cursor-not-allowed disabled:text-bone-dim disabled:hover:border-white/12"
      >
        <RotateCcw size={15} strokeWidth={2.2} /> Reset
      </button>

      <button
        type="button"
        onClick={onClear}
        className="clip-corner-sm inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright"
      >
        <Eraser size={15} strokeWidth={2.2} /> Clear
      </button>

      <span className="ml-auto hidden items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-verdict-clear sm:flex">
        <ShieldCheck size={13} strokeWidth={2.4} /> Read only
      </span>
    </div>
  );
}
