import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { CaseSelectionCard } from '../components/CaseSelectionCard';
import { DetectiveCareer } from '../components/DetectiveCareer';
import { LockedCaseDialog } from '../components/LockedCaseDialog';
import { SectionHeading } from '../components/SectionHeading';
import { displayCases, isPlayable } from '../catalog/caseCatalog';
import { getCaseStatus, getCompletion, getProgress, getUnlockRequirement, isCaseLocked } from '../utils/caseProgress';

export function DifficultyPage() {
  // Read once per mount; progression only changes on navigation.
  const progress = useMemo(() => getProgress(), []);
  const completion = useMemo(() => getCompletion(progress), [progress]);
  const [lockedCase, setLockedCase] = useState(null);

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
          className="inline-flex items-center gap-2.5 font-display text-sm font-medium uppercase tracking-[0.18em] text-bone-dim transition-colors hover:text-gold-bright"
        >
          <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" /> Return to briefing
        </Link>

        <Link
          to="/how-to-play"
          className="ml-6 inline-flex items-center gap-2.5 font-display text-sm font-medium uppercase tracking-[0.18em] text-bone-dim transition-colors hover:text-gold-bright"
        >
          <GraduationCap size={16} strokeWidth={2.2} aria-hidden="true" /> New to SQL? How to play
        </Link>

        <div className="pt-16">
          <SectionHeading
            eyebrow="Case selection"
            title="Choose your case"
            description="Five sealed dossiers, each with its own database. They open in order — every case teaches the SQL the next one expects."
          />
        </div>

        <DetectiveCareer completion={completion} className="mb-10" />

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {displayCases.map((entry, index) => {
            const sealed = !isPlayable(entry);
            return (
              <CaseSelectionCard
                key={entry.id}
                caseKey={entry.id}
                caseData={entry}
                index={index}
                status={getCaseStatus(entry.id, progress)}
                isSealed={sealed}
                isLocked={!sealed && isCaseLocked(entry.id, progress)}
                requirement={getUnlockRequirement(entry.id)}
                onShowLocked={setLockedCase}
              />
            );
          })}
        </div>
      </div>

      <LockedCaseDialog
        isOpen={Boolean(lockedCase)}
        onClose={() => setLockedCase(null)}
        caseData={lockedCase}
        requirement={lockedCase ? getUnlockRequirement(lockedCase.id) : null}
      />
    </motion.main>
  );
}
