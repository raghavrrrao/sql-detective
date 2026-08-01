import { Gavel } from 'lucide-react';
import { useInvestigationSession } from '../state/investigationSession';

/**
 * The one way to end an investigation.
 *
 * While it is locked the caption reports how the file is coming along and
 * nothing else — the conditions themselves are never spelled out, because a
 * checklist would turn the investigation into a shopping list.
 */
export function AccuseButton({ onOpen }) {
  const { readiness } = useInvestigationSession();

  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2.5">
      {/* One node carries the caption: it is both the live region and the
          button's description, so screen readers announce it once, not twice. */}
      <p
        id="accuse-readiness"
        role="status"
        aria-live="polite"
        className={`clip-corner-sm max-w-[15rem] border px-3 py-2 text-right text-xs leading-5 ${
          readiness.isReady
            ? 'border-gold/45 bg-gold/10 text-gold-bright'
            : 'border-white/12 bg-ink/90 text-bone-dim'
        }`}
      >
        {readiness.message}
      </p>

      <button
        type="button"
        onClick={onOpen}
        disabled={!readiness.isReady}
        aria-describedby="accuse-readiness"
        className="clip-corner-sm inline-flex items-center gap-2.5 border border-gold-bright/70 bg-gold px-5 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink shadow-glow transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-white/12 disabled:bg-charcoal-light disabled:text-bone-dim disabled:shadow-none disabled:hover:translate-y-0"
      >
        <Gavel size={17} strokeWidth={2.2} aria-hidden="true" /> Accuse
      </button>
    </div>
  );
}
