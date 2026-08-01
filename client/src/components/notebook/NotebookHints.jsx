import { Lightbulb, LockKeyhole } from 'lucide-react';
import { getCase } from '../../catalog/caseCatalog';
import { useInvestigationSession } from '../../state/investigationSession';

/**
 * Progressive hints.
 *
 * Each one is more specific than the last, and none of them names a person or
 * states a conclusion — the most a hint ever does is point at a table or at a
 * way of narrowing one. Taking a hint is recorded and costs score, so the
 * choice is a real one.
 */
export function NotebookHints({ difficulty }) {
  const { hintsRevealed, revealHint } = useInvestigationSession();
  const hints = getCase(difficulty)?.hints ?? [];

  if (hints.length === 0) {
    return <p className="py-10 text-center text-base text-bone-muted">This case has no hints on file.</p>;
  }

  const remaining = hints.length - hintsRevealed;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">Hints</h3>
        <p className="font-mono text-sm text-gold-bright">{hintsRevealed} of {hints.length} taken</p>
      </div>
      <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
        Each hint points a little further than the last. None of them names anybody, and each one you take costs score.
      </p>

      <ol className="mt-4 space-y-2.5">
        {hints.map((hint, index) => {
          const isRevealed = index < hintsRevealed;
          const isNext = index === hintsRevealed;

          return (
            <li
              key={hint}
              className={`clip-corner-sm border p-4 ${
                isRevealed ? 'border-gold/35 bg-gold/[0.07]' : 'border-white/10 bg-white/[0.035]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`clip-corner-sm mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-xs font-semibold ${
                    isRevealed ? 'border-gold/45 bg-gold-deep/25 text-gold-bright' : 'border-white/15 text-bone-dim'
                  }`}
                >
                  {index + 1}
                </span>

                {isRevealed ? (
                  <p className="flex-1 typo-body text-base text-bone-muted">{hint}</p>
                ) : (
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-base text-bone-dim">
                      <LockKeyhole size={15} strokeWidth={2} aria-hidden="true" />
                      Hint {index + 1} is sealed.
                    </p>
                    {isNext && (
                      <button
                        type="button"
                        onClick={() => revealHint(hints.length)}
                        className="clip-corner-sm inline-flex items-center gap-2 border border-gold/45 bg-gold/10 px-3.5 py-2.5 text-sm font-semibold text-gold-bright transition-colors hover:bg-gold/20"
                      >
                        <Lightbulb size={15} strokeWidth={2.2} aria-hidden="true" /> Take this hint
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 typo-body-secondary text-sm text-bone-dim">
        {remaining > 0
          ? `${remaining} ${remaining === 1 ? 'hint' : 'hints'} still sealed. You can close the case without any of them.`
          : 'Every hint has been taken. What is left is the reading.'}
      </p>
    </div>
  );
}
