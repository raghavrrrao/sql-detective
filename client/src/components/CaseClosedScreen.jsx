import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Gavel, KeyRound, Scale, ScrollText, Skull, Target } from 'lucide-react';
import { caseTables } from '../utils/sqlInsights';
import { useInvestigationSession } from '../state/investigationSession';

const reveal = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

function Panel({ icon: Icon, label, children, delay }) {
  return (
    <motion.section {...reveal(delay)} className="clip-corner-sm border border-white/10 bg-white/[0.035] p-5">
      <h3 className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-bright">
        <Icon size={14} strokeWidth={2.2} aria-hidden="true" /> {label}
      </h3>
      <div className="mt-3 text-base leading-7 text-bone-muted">{children}</div>
    </motion.section>
  );
}

/**
 * The Case Closed sequence — the first and only moment the game is allowed to
 * say who did it. Everything shown here comes from the case database, fetched
 * after the verdict was proven.
 */
export function CaseClosedScreen({ isOpen, caseData, onOpenReport, onLeave }) {
  const { reveal: revealed, verdict, discoveries, timeline, reach, accusations } = useInvestigationSession();

  if (!isOpen) return null;

  const killer = revealed?.killer ?? null;
  const victim = revealed?.victim ?? null;
  const untouched = caseTables.filter((table) => !reach.tables.includes(table));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Case closed"
        className="fixed inset-0 z-[60] overflow-y-auto bg-ink/97 backdrop-blur-xl"
      >
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 board-grid-fine opacity-30" />
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 vignette" />

        <div className="relative mx-auto max-w-4xl px-6 py-16 sm:px-10">
          <motion.p {...reveal(0.05)} className="text-center font-mono text-sm uppercase tracking-[0.3em] text-crimson-glow">
            {caseData.caseNumber} · Verdict returned
          </motion.p>

          <motion.h2
            {...reveal(0.15)}
            className="mt-5 text-center font-display text-6xl font-bold uppercase leading-none tracking-tight text-bone sm:text-8xl"
          >
            Case Closed
          </motion.h2>

          <motion.p {...reveal(0.3)} className="mt-6 text-center text-lg leading-8 text-bone-muted">
            The case against <span className="font-semibold text-bone">{verdict?.suspect}</span> is proven.
          </motion.p>

          <motion.div {...reveal(0.45)} className="clip-corner mt-12 border border-crimson/40 bg-crimson-deep/15 p-7 text-center">
            <p className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-crimson-glow">
              <Gavel size={14} strokeWidth={2.4} aria-hidden="true" /> Identity
            </p>
            <p className="mt-4 font-display text-4xl font-bold uppercase tracking-wide text-bone sm:text-5xl">
              {killer?.name ?? verdict?.suspect}
            </p>
            {killer?.occupation && <p className="mt-3 text-lg text-bone-muted">{killer.occupation}</p>}
            {killer?.relationship_to_victim && (
              <p className="mt-1.5 text-base text-bone-dim">{killer.relationship_to_victim}</p>
            )}
          </motion.div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {victim?.cause_of_death && (
              <Panel icon={Skull} label="Method" delay={0.6}>
                {victim.cause_of_death}
                {victim.time_of_death && (
                  <span className="mt-2 block font-mono text-sm text-bone-dim">
                    {victim.name} · {victim.date_of_death} at {victim.time_of_death}
                  </span>
                )}
              </Panel>
            )}

            {killer?.motive && (
              <Panel icon={Scale} label="Motive" delay={0.7}>{killer.motive}</Panel>
            )}

            {killer?.hidden_secret && (
              <Panel icon={KeyRound} label="What they were hiding" delay={0.8}>{killer.hidden_secret}</Panel>
            )}

            {killer?.timeline && (
              <Panel icon={ScrollText} label="Their movements" delay={0.9}>{killer.timeline}</Panel>
            )}
          </div>

          <motion.section {...reveal(1)} className="clip-corner-sm mt-6 border border-white/10 bg-white/[0.035] p-5">
            <h3 className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-bright">
              <Target size={14} strokeWidth={2.2} aria-hidden="true" /> How you worked it
            </h3>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['Records recovered', discoveries.length],
                ['Timeline events', timeline.length],
                ['Sources used', `${reach.tables.length} / ${caseTables.length}`],
                ['Queries run', reach.successes + reach.failures],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-[0.14em] text-bone-dim">{label}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-bone">{value}</dd>
                </div>
              ))}
            </dl>

            {accusations.length > 1 && (
              <p className="mt-4 text-sm text-bone-dim">
                It took {accusations.length} formal accusations to close this file.
              </p>
            )}

            {untouched.length > 0 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bone-dim">Sources you never opened</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {untouched.map((table) => (
                    <span key={table} className="clip-corner-sm border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-bone-muted">
                      {table.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <p className="mt-2.5 text-sm leading-6 text-bone-dim">
                  You proved the case without them. They are worth a look on a replay.
                </p>
              </div>
            )}
          </motion.section>

          <motion.div {...reveal(1.1)} className="mt-10 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLeave}
              className="clip-corner-sm border border-white/12 bg-white/[0.04] px-6 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone transition-colors hover:border-gold/45 hover:text-gold-bright"
            >
              Back to the case board
            </button>
            <button
              type="button"
              onClick={onOpenReport}
              className="clip-corner-sm inline-flex items-center gap-2.5 border border-gold-bright/70 bg-gold px-6 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink shadow-glow transition-transform hover:-translate-y-0.5"
            >
              <FileText size={17} strokeWidth={2.2} aria-hidden="true" /> Open the investigation report
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
