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
        <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">These complete on their own as you work the database.</p>

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
                <p className={`text-base font-medium leading-6 ${objective.isDone ? 'text-verdict-clear' : 'text-bone'}`}>
                  {objective.label}
                  <span className="sr-only">{objective.locked ? ' — locked' : objective.isDone ? ' — complete' : ' — outstanding'}</span>
                </p>
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
