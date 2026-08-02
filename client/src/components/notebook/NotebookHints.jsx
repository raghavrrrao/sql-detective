import { Lightbulb, LockKeyhole } from 'lucide-react';
import { getCase } from '../../catalog/caseCatalog';
import { hintBudget } from '../../utils/hints';
import { useInvestigationSession } from '../../state/investigationSession';

/**
 * Contextual hints.
 *
 * A hint is chosen when it is taken, against the state of the investigation at
 * that moment — so it will never send you somewhere you have already been. If
 * the statements are already on file, no hint suggests reading the witnesses;
 * it points at whatever the file is actually missing instead.
 *
 * None of them names a person or states a conclusion. The most a hint ever
 * does is point at a table, or at a way of narrowing one. Taking one is
 * recorded and costs score, so the choice is a real one.
 */
export function NotebookHints({ difficulty }) {
  const { hintsTaken, revealHint, categories } = useInvestigationSession();
  const authored = getCase(difficulty)?.hints ?? [];
  const budget = hintBudget(authored);

  if (budget === 0) {
    return <p className="py-10 text-center text-base text-bone-muted">This case has no hints on file.</p>;
  }

  const remaining = budget - hintsTaken.length;
  // With nothing on file at all, a hint can only restate the briefing. Asking
  // for one query first keeps the first hint worth what it costs.
  const hasStarted = categories.some((category) => category.isUnlocked);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-medium uppercase tracking-[0.16em] text-bone">Hints</h3>
        <p className="font-mono text-sm text-gold-bright">{hintsTaken.length} of {budget} taken</p>
      </div>
      <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
        Each hint is chosen against the file as it stands, so it always points at something you have not done yet.
        None of them names anybody, and each one you take costs score.
      </p>

      <ol className="mt-4 space-y-2.5">
        {hintsTaken.map((hint, index) => (
          <li key={hint} className="clip-corner-sm border border-gold/35 bg-gold/[0.07] p-4">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="clip-corner-sm mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-gold/45 bg-gold-deep/25 font-mono text-xs font-medium text-gold-bright"
              >
                {index + 1}
              </span>
              <p className="flex-1 typo-document text-base text-bone-muted">{hint}</p>
            </div>
          </li>
        ))}

        {remaining > 0 && (
          <li className="clip-corner-sm border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-base text-bone-dim">
                <LockKeyhole size={15} strokeWidth={2} aria-hidden="true" />
                {hasStarted
                  ? `Hint ${hintsTaken.length + 1} is sealed.`
                  : 'Run a query first — a hint is worth more once there is a file to read.'}
              </p>
              {hasStarted && (
                <button
                  type="button"
                  onClick={() => revealHint()}
                  className="clip-corner-sm inline-flex items-center gap-2 border border-gold/45 bg-gold/10 px-3.5 py-2.5 text-sm font-medium text-gold-bright transition-colors hover:bg-gold/20"
                >
                  <Lightbulb size={15} strokeWidth={2.2} aria-hidden="true" /> Take a hint
                </button>
              )}
            </div>
          </li>
        )}
      </ol>

      <p className="mt-5 typo-body-secondary text-sm text-bone-dim">
        {remaining > 0
          ? `${remaining} ${remaining === 1 ? 'hint' : 'hints'} still sealed. You can close the case without any of them.`
          : 'Every hint has been taken. What is left is the reading.'}
      </p>
    </div>
  );
}
