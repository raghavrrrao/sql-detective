import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, FolderSearch } from 'lucide-react';
import { ActionButton } from './ActionButton';
import { DetectiveCareer } from './DetectiveCareer';
import { displayCases, getCaseRoutePath } from '../catalog/caseCatalog';
import { getCompletion, getCurrentCase, getProgress } from '../utils/caseProgress';

/**
 * The landing page's view of where the player is up to: what they are in the
 * middle of, what opens next, and what they have already closed.
 */
export function CareerSummary() {
  const progress = useMemo(() => getProgress(), []);
  const completion = useMemo(() => getCompletion(progress), [progress]);
  const current = useMemo(() => getCurrentCase(progress), [progress]);
  const solved = useMemo(
    () => displayCases.filter((entry) => progress[entry.id]?.solved),
    [progress],
  );

  const isInProgress = Boolean(current && progress[current.id]?.opened);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5 }}
      className="px-6 pb-4 sm:px-10 lg:px-16"
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="clip-corner panel-surface p-7 shadow-panel">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-crimson-glow">
            <FolderSearch size={14} strokeWidth={2.4} aria-hidden="true" />
            {completion.allPlayableSolved ? 'Case load' : isInProgress ? 'Current investigation' : 'Next available case'}
          </p>

          {completion.allPlayableSolved ? (
            <>
              <h2 className="mt-4 font-display text-3xl font-medium uppercase leading-tight text-bone">
                Awaiting new case files
              </h2>
              <p className="mt-4 max-w-xl typo-body text-base text-bone-muted">
                You have closed every file currently on the shelf. The next investigation is still being prepared.
              </p>
              <ActionButton as="link" to="/difficulty" variant="ghost" className="mt-7" iconRight={ArrowRight}>
                Review your closed cases
              </ActionButton>
            </>
          ) : current ? (
            <>
              <h2 className="mt-4 typo-heading text-3xl leading-tight text-bone">{current.title}</h2>
              <p className="mt-2 font-mono text-sm text-bone-dim">
                {current.caseNumber} · {current.tier} · {current.estimatedTime}
              </p>
              <p className="mt-4 max-w-xl typo-body text-base text-bone-muted">{current.preview}</p>
              <ActionButton
                as="link"
                to={isInProgress ? getCaseRoutePath(current.id, 'investigation') : getCaseRoutePath(current.id, 'case')}
                variant="primary"
                className="mt-7"
                iconRight={ArrowRight}
              >
                {isInProgress ? 'Resume investigation' : 'Open case file'}
              </ActionButton>
            </>
          ) : (
            <p className="mt-4 typo-body text-base text-bone-muted">No case file is open.</p>
          )}

          {solved.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-bone-dim">Completed cases</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {solved.map((entry) => (
                  <li
                    key={entry.id}
                    className="clip-corner-sm inline-flex items-center gap-1.5 border border-verdict-clear/45 bg-verdict-clear/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-verdict-clear"
                  >
                    <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {entry.caseNumber} · {entry.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DetectiveCareer completion={completion} />
      </div>
    </motion.section>
  );
}
