import { Check, Lock } from 'lucide-react';
import { useInvestigationSession } from '../../state/investigationSession';

/**
 * Objectives tick themselves. Each one watches a real investigation signal —
 * which tables came back with rows, which SQL features were used — so nothing
 * here can be completed by clicking a button.
 */
export function NotebookObjectives({ leads }) {
  const { objectives, tally, leadsDone, toggleLead } = useInvestigationSession();

  return (
    <div className="space-y-7">
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-sm font-medium uppercase tracking-[0.16em] text-bone">Investigation objectives</h3>
          <p className="font-mono text-sm text-gold-bright">{tally.done} of {tally.total} complete</p>
        </div>
        <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">These count what you have actually recovered, and tick over on their own as you query. The mark on each bar is what counts as enough — you never have to empty a table.</p>

        <ul className="mt-4 space-y-2.5">
          {objectives.map((objective) => (
            <li
              key={objective.id}
              className={`clip-corner-sm flex items-start gap-3 border p-4 ${
                objective.isDone ? 'border-verdict-clear/35 bg-verdict-clear/[0.07]' : 'border-white/10 bg-white/[0.035]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`clip-corner-sm mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
                  objective.locked
                    ? 'border-white/15 text-bone-dim'
                    : objective.isDone
                      ? 'border-verdict-clear bg-verdict-clear/20 text-verdict-clear'
                      : 'border-white/25 text-transparent'
                }`}
              >
                {objective.locked ? <Lock size={11} strokeWidth={2.6} /> : <Check size={13} strokeWidth={3} />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className={`text-base font-medium leading-6 ${objective.isDone ? 'text-verdict-clear' : 'text-bone'}`}>
                    {objective.label}
                    <span className="sr-only">{objective.locked ? ' — locked' : objective.isDone ? ' — complete' : ' — outstanding'}</span>
                  </p>
                  {objective.isCounted && (
                    <p className={`font-mono text-sm ${objective.isDone ? 'text-verdict-clear' : 'text-gold-bright'}`}>
                      {objective.recovered} / {objective.total}
                      <span className="sr-only"> recovered</span>
                    </p>
                  )}
                </div>

                {/* The bar fills to the whole table; the notch is what counts
                    as enough, so a player can see they have sufficient without
                    being told they must empty the table. */}
                {objective.isCounted && (
                  <div aria-hidden="true" className="relative mt-2 h-1 w-full overflow-hidden bg-white/10">
                    <span
                      className={`block h-full transition-[width] duration-500 ${objective.isDone ? 'bg-verdict-clear' : 'bg-gold'}`}
                      style={{ width: `${Math.round((objective.recovered / Math.max(1, objective.total)) * 100)}%` }}
                    />
                    <span
                      className="absolute inset-y-0 w-px bg-bone/45"
                      style={{ left: `${Math.round((objective.target / Math.max(1, objective.total)) * 100)}%` }}
                    />
                  </div>
                )}

                {!objective.isDone && <p className="mt-1.5 typo-body-secondary text-sm text-bone-muted">{objective.hint}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {leads.length > 0 && (
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-sm font-medium uppercase tracking-[0.16em] text-bone">Case leads</h3>
            <p className="font-mono text-sm text-bone-dim">{leadsDone.length} of {leads.length} followed</p>
          </div>
          <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">Your own checklist — tick these off as you work through them.</p>

          <ul className="mt-4 space-y-2.5">
            {leads.map((lead) => {
              const isDone = leadsDone.includes(lead);
              return (
                <li key={lead} className="clip-corner-sm border border-white/10 bg-white/[0.035]">
                  <button
                    type="button"
                    onClick={() => toggleLead(lead)}
                    aria-pressed={isDone}
                    className="flex w-full items-start gap-3 p-3.5 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={`clip-corner-sm mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                        isDone ? 'border-verdict-clear bg-verdict-clear/20 text-verdict-clear' : 'border-white/25 text-transparent'
                      }`}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className={`flex-1 typo-document text-base ${isDone ? 'text-bone-dim line-through' : 'text-bone-muted'}`}>{lead}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
