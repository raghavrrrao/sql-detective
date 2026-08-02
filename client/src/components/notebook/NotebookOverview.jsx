import { motion } from 'framer-motion';
import { CalendarDays, CircleDot, CircleSlash, FileSearch, Lightbulb, MapPin, ShieldCheck, Timer, UserX } from 'lucide-react';
import { useInvestigationSession } from '../../state/investigationSession';

const stateStyles = {
  done: { icon: ShieldCheck, chip: 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear', tone: 'text-verdict-clear' },
  partial: { icon: CircleDot, chip: 'border-verdict-watch/45 bg-verdict-watch/10 text-verdict-watch', tone: 'text-verdict-watch' },
  todo: { icon: CircleSlash, chip: 'border-white/12 bg-white/[0.04] text-bone-dim', tone: 'text-bone-dim' },
};

const factsFor = (timeLabel) => [
  { key: 'date', label: 'Date', icon: CalendarDays },
  { key: 'time', label: timeLabel, icon: Timer },
  { key: 'location', label: 'Location', icon: MapPin },
];

/**
 * Case Overview. The ledger counts what the player has recovered, and the
 * observations react to the shape of that pile — which categories are present
 * and which are missing. Neither reads the contents of a record.
 */
export function NotebookOverview({ caseData, caseFacts }) {
  const { ledger, insights, discoveries, reach, categories, investigation } = useInvestigationSession();
  const isTheft = caseFacts?.crimeType === 'theft';
  const facts = factsFor(caseFacts?.timeLabel ?? 'Time of death');

  return (
    <div className="space-y-6">
      <section className="clip-corner-sm panel-surface-raised p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-glow">{caseData.caseNumber} · {caseFacts?.tier ?? caseData.difficulty}</p>
        <h3 className="mt-2 font-display text-2xl font-medium uppercase leading-tight text-bone">{caseData.title}</h3>
        <p className="mt-3 flex items-center gap-2 text-base text-bone-muted">
          {isTheft
            ? <FileSearch size={16} className="shrink-0 text-crimson-glow" strokeWidth={2.2} aria-hidden="true" />
            : <UserX size={16} className="shrink-0 text-crimson-glow" strokeWidth={2.2} aria-hidden="true" />}
          {caseFacts?.subjectLabel ?? 'Victim'}: <span className="font-medium text-bone">{caseData.victim}</span>
        </p>

        {caseFacts && (
          <dl className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
            {facts.map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-bone-dim">
                  <Icon size={13} className="text-gold-bright" strokeWidth={2.2} aria-hidden="true" /> {label}
                </dt>
                <dd className="mt-1.5 typo-document text-sm text-bone">{caseFacts[key]}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/*
        Investigation, not completion. This measures the file the player has
        built out of the database — every figure is a count of records they
        recovered themselves, against a denominator that says how large the
        table is and nothing about what is in it.
      */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-sm font-medium uppercase tracking-[0.16em] text-bone">Investigation</h3>
          <p className="typo-numeric text-2xl font-semibold leading-none text-gold-bright">
            {investigation}%<span className="sr-only"> investigated</span>
          </p>
        </div>
        <p className="mt-1.5 typo-body-secondary text-sm text-bone-dim">
          How far each line of enquiry has been worked. The mark on a bar is what counts as enough — you never have to empty a table.
        </p>

        <div aria-hidden="true" className="mt-3 h-1.5 w-full overflow-hidden bg-white/10">
          <span
            className="block h-full bg-gradient-to-r from-crimson via-gold to-gold-bright transition-[width] duration-700"
            style={{ width: `${investigation}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2.5">
          {categories.map((category) => {
            const style = category.isComplete ? stateStyles.done : category.isUnlocked ? stateStyles.partial : stateStyles.todo;
            const Icon = style.icon;
            return (
              <li key={category.id} className="clip-corner-sm border border-white/10 bg-white/[0.035] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Icon size={17} className={style.tone} strokeWidth={2.2} aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-base font-medium text-bone">{category.label}</span>
                  <span className={`clip-corner-sm border px-2.5 py-1 font-mono text-xs font-medium ${style.chip}`}>
                    {category.recovered} / {category.total}
                  </span>
                </div>
                <div aria-hidden="true" className="relative mt-2.5 h-1 w-full overflow-hidden bg-white/10">
                  <span
                    className={`block h-full transition-[width] duration-500 ${category.isComplete ? 'bg-verdict-clear' : 'bg-gold'}`}
                    style={{ width: `${Math.round((category.recovered / Math.max(1, category.total)) * 100)}%` }}
                  />
                  <span
                    className="absolute inset-y-0 w-px bg-bone/45"
                    style={{ left: `${Math.round((category.target / Math.max(1, category.total)) * 100)}%` }}
                  />
                </div>
                {!category.isUnlocked && (
                  <p className="mt-2 typo-body-secondary text-xs text-bone-dim">{category.empty}</p>
                )}
              </li>
            );
          })}
        </ul>

        <ul className="mt-4 space-y-2.5">
          {ledger.filter((entry) => entry.id === 'victim' || entry.id === 'suspects').map((entry) => {
            const style = stateStyles[entry.state] ?? stateStyles.todo;
            const Icon = style.icon;
            return (
              <li key={entry.id} className="clip-corner-sm flex items-center gap-3 border border-white/10 bg-white/[0.035] px-4 py-3">
                <Icon size={17} className={style.tone} strokeWidth={2.2} aria-hidden="true" />
                <span className="text-base font-medium text-bone">{entry.label}</span>
                <span className={`clip-corner-sm ml-auto border px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.1em] ${style.chip}`}>
                  {entry.value}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {insights.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.16em] text-bone">
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
                className="clip-corner-sm border border-gold/25 bg-gold/[0.06] p-4 typo-document text-base text-bone-muted"
              >
                {insight.text}
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      <section className="clip-corner-sm grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
        {[
          { label: 'Discoveries', value: discoveries.length },
          { label: 'Sources used', value: reach.tables.length },
          { label: 'Queries run', value: reach.successes + reach.failures },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center justify-between gap-3 bg-charcoal px-4 py-3 text-left sm:block sm:py-4 sm:text-center">
            <p className="order-2 typo-numeric text-2xl font-semibold text-gold-bright sm:order-none">{stat.value}</p>
            <p className="text-xs uppercase tracking-[0.14em] text-bone-dim sm:mt-1">{stat.label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
