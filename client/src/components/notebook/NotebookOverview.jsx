import { motion } from 'framer-motion';
import { CalendarDays, CircleDot, CircleSlash, Lightbulb, MapPin, ShieldCheck, Timer, UserX } from 'lucide-react';
import { useInvestigationSession } from '../../state/investigationSession';

const stateStyles = {
  done: { icon: ShieldCheck, chip: 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear', tone: 'text-verdict-clear' },
  partial: { icon: CircleDot, chip: 'border-verdict-watch/45 bg-verdict-watch/10 text-verdict-watch', tone: 'text-verdict-watch' },
  todo: { icon: CircleSlash, chip: 'border-white/12 bg-white/[0.04] text-bone-dim', tone: 'text-bone-dim' },
};

const facts = [
  { key: 'date', label: 'Date', icon: CalendarDays },
  { key: 'time', label: 'Time of death', icon: Timer },
  { key: 'location', label: 'Location', icon: MapPin },
];

/**
 * Case Overview. The ledger counts what the player has recovered, and the
 * observations react to the shape of that pile — which categories are present
 * and which are missing. Neither reads the contents of a record.
 */
export function NotebookOverview({ caseData, caseFacts }) {
  const { ledger, insights, discoveries, reach } = useInvestigationSession();

  return (
    <div className="space-y-6">
      <section className="clip-corner-sm panel-surface-raised p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-glow">{caseData.caseNumber} · {caseFacts?.tier ?? caseData.difficulty}</p>
        <h3 className="mt-2 font-display text-2xl font-medium uppercase leading-tight text-bone">{caseData.title}</h3>
        <p className="mt-3 flex items-center gap-2 text-base text-bone-muted">
          <UserX size={16} className="shrink-0 text-crimson-glow" strokeWidth={2.2} aria-hidden="true" />
          Victim: <span className="font-semibold text-bone">{caseData.victim}</span>
        </p>

        {caseFacts && (
          <dl className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
            {facts.map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-bone-dim">
                  <Icon size={13} className="text-gold-bright" strokeWidth={2.2} aria-hidden="true" /> {label}
                </dt>
                <dd className="mt-1.5 typo-body-secondary text-sm text-bone">{caseFacts[key]}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section>
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">Investigation ledger</h3>
        <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
          Counts what you have recovered. A total only appears once you have read that table in full.
        </p>

        <ul className="mt-4 space-y-2.5">
          {ledger.map((entry) => {
            const style = stateStyles[entry.state] ?? stateStyles.todo;
            const Icon = style.icon;
            return (
              <li key={entry.id} className="clip-corner-sm flex items-center gap-3 border border-white/10 bg-white/[0.035] px-4 py-3">
                <Icon size={17} className={style.tone} strokeWidth={2.2} aria-hidden="true" />
                <span className="text-base font-semibold text-bone">{entry.label}</span>
                <span className={`clip-corner-sm ml-auto border px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-[0.1em] ${style.chip}`}>
                  {entry.value}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {insights.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">
            <Lightbulb size={15} className="text-gold-bright" strokeWidth={2.2} aria-hidden="true" /> Observations
          </h3>
          <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
            Notes on where your file is thin. These react to what you have collected — they never tell you what it means.
          </p>

          <ul className="mt-4 space-y-2.5">
            {insights.map((insight, index) => (
              <motion.li
                key={insight.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                className="clip-corner-sm border border-gold/25 bg-gold/[0.06] p-4 typo-body text-base text-bone-muted"
              >
                {insight.text}
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      <section className="clip-corner-sm grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
        {[
          { label: 'Discoveries', value: discoveries.length },
          { label: 'Sources used', value: reach.tables.length },
          { label: 'Queries run', value: reach.successes + reach.failures },
        ].map((stat) => (
          <div key={stat.label} className="bg-charcoal px-4 py-4 text-center">
            <p className="font-display text-2xl font-medium text-gold-bright">{stat.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-bone-dim">{stat.label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
