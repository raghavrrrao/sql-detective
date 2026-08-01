import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { CaseSelectionCard } from '../components/CaseSelectionCard';
import { SectionHeading } from '../components/SectionHeading';
import { availableCases, getPreviousCase } from '../catalog/caseCatalog';
import { getCaseStatus, getCompletion, getProgress, isCaseLocked } from '../utils/caseProgress';

export function DifficultyPage() {
  // Read once per mount; progression only changes on navigation.
  const progress = useMemo(() => getProgress(), []);
  const completion = useMemo(() => getCompletion(progress), [progress]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="relative min-h-screen overflow-hidden px-6 py-16 sm:px-10 lg:px-16 lg:py-24"
    >
      <AnimatedBackground />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-display text-sm font-semibold uppercase tracking-[0.18em] text-bone-dim transition-colors hover:text-gold-bright"
        >
          <ArrowLeft size={16} strokeWidth={2.2} /> Return to briefing
        </Link>

        <div className="pt-16">
          <SectionHeading
            eyebrow={`Case selection · ${completion.solved} of ${completion.total} solved`}
            title="Choose your case"
            description="Each investigation is a sealed dossier with its own database. Work through them in order — every case teaches the SQL the next one expects."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {availableCases.map((entry, index) => {
            const previous = getPreviousCase(entry.id);
            return (
              <CaseSelectionCard
                key={entry.id}
                caseKey={entry.id}
                caseData={entry}
                index={index}
                status={getCaseStatus(entry.id, progress)}
                isLocked={isCaseLocked(entry.id, progress)}
                lockHint={previous ? `Close ${previous.caseNumber} — ${previous.title} — to unlock this file.` : undefined}
              />
            );
          })}
        </div>
      </div>
    </motion.main>
  );
}
