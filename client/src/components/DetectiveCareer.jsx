import { ShieldCheck } from 'lucide-react';
import { getRank } from '../utils/caseProgress';

/**
 * Career standing. Purely cosmetic — the rank changes nothing about what is
 * unlocked or how a case is graded; it is a way of reading the board at a
 * glance and seeing that the set has a shape.
 */
export function DetectiveCareer({ completion, className = '' }) {
  const rank = getRank(completion.solved);

  return (
    <section
      aria-label="Detective career"
      className={`clip-corner panel-surface p-6 shadow-panel ${className}`}
    >
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-crimson-glow">
        <ShieldCheck size={14} strokeWidth={2.4} aria-hidden="true" /> Detective career
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="font-display text-3xl font-medium uppercase leading-none text-bone">{rank}</p>
          <p className="mt-2 text-base text-bone-muted">
            {completion.solved} of {completion.total} cases solved
          </p>
        </div>

        <div className="flex items-center gap-2" role="img" aria-label={`${completion.solved} of ${completion.total} cases solved`}>
          {Array.from({ length: completion.total }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`h-3.5 w-8 border ${
                index < completion.solved
                  ? 'border-verdict-clear/60 bg-verdict-clear/70'
                  : 'border-white/15 bg-white/[0.05]'
              }`}
            />
          ))}
        </div>
      </div>

      {completion.allPlayableSolved && (
        <p className="mt-4 border-t border-white/10 pt-4 typo-body-secondary text-sm text-gold-bright">
          Every case file currently on the shelf is closed. New files are being prepared.
        </p>
      )}
    </section>
  );
}
