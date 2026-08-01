import { motion } from 'framer-motion';
import { Clock3, Database } from 'lucide-react';
import { DifficultyBadge } from './DifficultyBadge';

/** Rail colour follows the tier's rank, matching DifficultyBadge. */
const rails = {
  1: 'bg-sky-400',
  2: 'bg-verdict-clear',
  3: 'bg-gold',
  4: 'bg-orange-400',
  5: 'bg-crimson-bright',
};

export function DifficultyCard({ difficulty, rank = 2, time, concepts, story, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -7 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
      className="clip-corner relative panel-surface p-5 shadow-panel sm:p-7"
    >
      <span aria-hidden="true" className={`absolute left-0 top-0 h-full w-[3px] ${rails[rank] ?? rails[2]}`} />

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="font-display text-2xl font-medium uppercase text-bone sm:text-3xl">{difficulty}</h3>
        <DifficultyBadge difficulty={difficulty} rank={rank} />
      </div>

      <dl className="mt-8 space-y-6">
        <div className="flex items-center gap-3">
          <Clock3 size={17} className="shrink-0 text-gold-bright" strokeWidth={2} />
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-bone-dim">Estimated time</dt>
            <dd className="mt-0.5 text-base font-medium text-bone">{time}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Database size={17} className="mt-1 shrink-0 text-gold-bright" strokeWidth={2} />
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-bone-dim">SQL concepts</dt>
            <dd className="mt-1.5 flex flex-wrap gap-2">
              {concepts.map((concept) => (
                <span key={concept} className="clip-corner-sm border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-bone">{concept}</span>
              ))}
            </dd>
          </div>
        </div>
      </dl>

      <p className="mt-7 border-t border-white/10 pt-6 typo-body text-base text-bone-muted">{story}</p>
    </motion.article>
  );
}
