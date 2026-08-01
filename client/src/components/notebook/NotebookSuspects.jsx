import { useState } from 'react';
import { Info, ShieldCheck, Target, UserRound } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { suspectStatuses } from '../../utils/suspectIntel';
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
 * Suspect intelligence.
 *
 * Unknown → Investigated → Person of Interest is automatic and measures the
 * size of the file you have built. Cleared and Prime Suspect are your own two
 * judgements: the game will not decide either for you, because deciding would
 * mean telling you the answer.
 */
export function NotebookSuspects() {
  const { intel, setPrimeSuspect, toggleCleared } = useInvestigationSession();
  const [openName, setOpenName] = useState(null);

  return (
    <div>
      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">Suspect files</h3>
      <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
        A file grows as your queries turn up records naming that person. Nothing here reads their alibi.
      </p>

      <ul className="mt-4 space-y-2.5">
        {intel.map((profile) => {
          const isOpen = openName === profile.name;
          return (
            <li key={profile.name} className={`clip-corner-sm border ${profile.isPrime ? 'border-crimson-bright/50 bg-crimson/[0.07]' : 'border-white/10 bg-white/[0.035]'}`}>
              <button
                type="button"
                onClick={() => setOpenName(isOpen ? null : profile.name)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3.5 p-4 text-left"
              >
                <span className="clip-corner-sm relative flex h-12 w-12 shrink-0 items-center justify-center bg-gradient-to-br from-charcoal-light to-charcoal ring-1 ring-white/12">
                  <UserRound size={20} className="absolute text-white/12" strokeWidth={1.5} aria-hidden="true" />
                  <span className="relative font-display text-sm font-semibold text-bone">{initialsOf(profile.name)}</span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-bone">{profile.name}</span>
                  <span className="block truncate text-sm text-bone-muted">{profile.occupation}</span>
                  <span className="mt-1 block font-mono text-xs text-bone-dim">
                    {profile.recordCount === 0
                      ? 'No records on file'
                      : `${profile.recordCount} ${profile.recordCount === 1 ? 'record' : 'records'} · ${profile.sources.length} ${profile.sources.length === 1 ? 'source' : 'sources'}`}
                  </span>
                </span>

                <StatusBadge tone={profile.status} size="sm" className="hidden shrink-0 sm:inline-flex" />
              </button>

              {isOpen && (
                <div className="border-t border-white/10 p-4">
                  <div className="flex flex-wrap items-center gap-2 sm:hidden">
                    <StatusBadge tone={profile.status} size="sm" />
                  </div>
                  <p className="typo-body-secondary text-sm text-bone-muted sm:mt-0">{suspectStatuses[profile.status].blurb}</p>

                  {profile.sources.length > 0 && (
                    <div className="mt-3.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bone-dim">Sources on file</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {profile.sources.map((source) => (
                          <span key={source} className="clip-corner-sm border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-bone-muted">
                            {source.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.earnedStatus === 'investigated' && profile.toInterest > 0 && (
                    <p className="mt-3.5 typo-body-secondary text-sm text-bone-dim">
                      {profile.toInterest} more {profile.toInterest === 1 ? 'record' : 'records'} across at least three sources would make this a substantial file.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPrimeSuspect(profile.name)}
                      aria-pressed={profile.isPrime}
                      className={`clip-corner-sm inline-flex items-center gap-2 border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        profile.isPrime
                          ? 'border-crimson-bright/60 bg-crimson/15 text-crimson-glow'
                          : 'border-white/12 bg-white/[0.04] text-bone-muted hover:border-crimson-bright/50 hover:text-crimson-glow'
                      }`}
                    >
                      <Target size={15} strokeWidth={2.2} aria-hidden="true" />
                      {profile.isPrime ? 'Prime suspect' : 'Flag as prime suspect'}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCleared(profile.name)}
                      disabled={!profile.canClear && !profile.isCleared}
                      aria-pressed={profile.isCleared}
                      title={
                        profile.canClear || profile.isCleared
                          ? 'Your own judgement — the game does not check it'
                          : 'Recover a badge, camera, phone or security record naming this person first'
                      }
                      className={`clip-corner-sm inline-flex items-center gap-2 border px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:text-bone-dim ${
                        profile.isCleared
                          ? 'border-verdict-clear/50 bg-verdict-clear/12 text-verdict-clear'
                          : 'border-white/12 bg-white/[0.04] text-bone-muted enabled:hover:border-verdict-clear/45 enabled:hover:text-verdict-clear'
                      }`}
                    >
                      <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      {profile.isCleared ? 'Cleared' : 'Mark as accounted for'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="clip-corner-sm mt-6 flex items-start gap-2.5 border border-white/10 bg-white/[0.03] p-3.5 typo-body-secondary text-sm text-bone-dim">
        <Info size={15} className="mt-0.5 shrink-0 text-gold-bright" strokeWidth={2} aria-hidden="true" />
        Flagging and clearing are organisational only. Neither is checked against the case, and neither moves you closer to or further from the answer.
      </p>
    </div>
  );
}
