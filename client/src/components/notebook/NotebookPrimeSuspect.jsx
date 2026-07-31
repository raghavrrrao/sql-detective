import { Info, Target, UserRound } from 'lucide-react';
import { StatusBadge, resolveStatusTone } from '../StatusBadge';
import { useInvestigationSession } from '../../state/investigationSession';

function initialsOf(name) {
  return name
    .replace(/^(Dr|Mr|Mrs|Ms|Captain)\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Prime Suspect. Exactly one name can carry the pin at a time; picking a new
 * one releases the old. It is an organising tool for the player and has no
 * effect on the case or the database.
 */
export function NotebookPrimeSuspect({ suspects }) {
  const { primeSuspect, setPrimeSuspect } = useInvestigationSession();
  const chosen = suspects.find((suspect) => suspect.name === primeSuspect) ?? null;

  return (
    <div>
      <section className={`clip-corner-sm border p-5 ${chosen ? 'border-crimson-bright/50 bg-crimson/[0.08]' : 'border-white/10 bg-white/[0.035]'}`}>
        <p className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">
          <Target size={16} className="text-crimson-glow" strokeWidth={2.2} aria-hidden="true" /> Current prime suspect
        </p>
        {chosen ? (
          <div className="mt-4 flex items-center gap-4">
            <span className="clip-corner-sm relative flex h-14 w-14 shrink-0 items-center justify-center bg-gradient-to-br from-crimson-deep/70 to-charcoal ring-1 ring-white/12">
              <UserRound size={22} className="absolute text-white/12" strokeWidth={1.5} aria-hidden="true" />
              <span className="relative font-display text-base font-semibold text-bone">{initialsOf(chosen.name)}</span>
            </span>
            <div className="min-w-0">
              <p className="font-display text-xl font-bold uppercase tracking-wide text-bone">{chosen.name}</p>
              <p className="mt-1 text-base text-bone-muted">{chosen.occupation}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-base leading-7 text-bone-muted">Nobody is flagged yet. Pick the name you are building a case against.</p>
        )}
      </section>

      <fieldset className="mt-6">
        <legend className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">Suspect roster</legend>
        <p className="mt-1.5 text-sm leading-6 text-bone-dim">Selecting a name replaces the previous flag. Select it again to clear it.</p>

        <ul className="mt-4 space-y-2.5">
          {suspects.map((suspect) => {
            const isPrime = suspect.name === primeSuspect;
            return (
              <li key={suspect.name}>
                <button
                  type="button"
                  onClick={() => setPrimeSuspect(suspect.name)}
                  aria-pressed={isPrime}
                  className={`clip-corner-sm flex w-full items-center gap-3 border p-3.5 text-left transition-colors ${
                    isPrime ? 'border-crimson-bright/60 bg-crimson/12' : 'border-white/10 bg-white/[0.035] hover:border-gold/40'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`clip-corner-sm flex h-5 w-5 shrink-0 items-center justify-center border ${
                      isPrime ? 'border-crimson-bright bg-crimson/30 text-crimson-glow' : 'border-white/25 text-transparent'
                    }`}
                  >
                    <Target size={12} strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold text-bone">{suspect.name}</span>
                    <span className="block truncate text-sm text-bone-muted">{suspect.occupation}</span>
                  </span>
                  <StatusBadge tone={resolveStatusTone(suspect.status)} label={suspect.status} size="sm" className="hidden sm:inline-flex" />
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <p className="clip-corner-sm mt-6 flex items-start gap-2.5 border border-white/10 bg-white/[0.03] p-3.5 text-sm leading-6 text-bone-dim">
        <Info size={15} className="mt-0.5 shrink-0 text-gold-bright" strokeWidth={2} aria-hidden="true" />
        Flagging someone changes nothing in the case. It is here to keep your own thinking straight.
      </p>
    </div>
  );
}
