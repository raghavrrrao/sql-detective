import { motion } from 'framer-motion';
import { Pin, PinOff, TerminalSquare, UserRound } from 'lucide-react';
import { StatusBadge, resolveStatusTone } from './StatusBadge';

function initialsOf(name) {
  return name.replace(/^(Dr|Mr|Mrs|Ms|Captain)\.?\s+/i, '').split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

/** A stable portrait tint per suspect so the roster is visually distinguishable. */
const tints = [
  'from-crimson-deep/70 to-charcoal',
  'from-sky-950 to-charcoal',
  'from-amber-950 to-charcoal',
  'from-violet-950 to-charcoal',
  'from-emerald-950 to-charcoal',
  'from-rose-950 to-charcoal',
  'from-slate-800 to-charcoal',
  'from-teal-950 to-charcoal',
  'from-fuchsia-950 to-charcoal',
];

export function SuspectCard({ suspect, index, isPrime, onTogglePrime, onInspect }) {
  const tone = resolveStatusTone(suspect.status);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.05, 0.35) }}
      whileHover={{ y: -3 }}
      className={`clip-corner-sm panel-surface-raised overflow-hidden transition-colors duration-200 ${
        isPrime ? 'border-crimson-bright/60 shadow-crimson' : 'hover:border-gold/35'
      }`}
    >
      <div className="flex gap-3.5 p-4">
        {/* Portrait */}
        <div className={`clip-corner-sm relative flex h-14 w-14 shrink-0 items-center justify-center bg-gradient-to-br ${tints[index % tints.length]} ring-1 ring-white/12`}>
          <UserRound size={22} className="absolute text-white/12" strokeWidth={1.5} />
          <span className="relative font-display text-base font-semibold tracking-wide text-bone">{initialsOf(suspect.name)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[0.95rem] font-semibold leading-snug text-bone">{suspect.name}</h3>
            <button
              type="button"
              onClick={onTogglePrime}
              aria-pressed={isPrime}
              aria-label={isPrime ? `Remove prime suspect flag from ${suspect.name}` : `Flag ${suspect.name} as prime suspect`}
              className={`shrink-0 p-1 transition-colors ${isPrime ? 'text-crimson-glow' : 'text-bone-dim hover:text-gold-bright'}`}
            >
              {isPrime ? <Pin size={15} strokeWidth={2.4} /> : <PinOff size={15} strokeWidth={2} />}
            </button>
          </div>
          <p className="mt-1 truncate text-sm text-bone-muted">{suspect.occupation}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <StatusBadge tone={tone} label={suspect.status} size="sm" />
            {isPrime && <StatusBadge tone="prime" size="sm" />}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onInspect}
        className="flex w-full items-center justify-center gap-2 border-t border-white/10 bg-white/[0.03] py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-bone-muted transition-colors hover:bg-gold/10 hover:text-gold-bright"
      >
        <TerminalSquare size={14} strokeWidth={2.2} /> Query this profile
      </button>
    </motion.article>
  );
}
