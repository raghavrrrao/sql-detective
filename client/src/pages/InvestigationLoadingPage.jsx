import { motion } from 'framer-motion';
import { AlertTriangle, Fingerprint, RotateCcw } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { InvestigationLayout } from '../components/InvestigationLayout';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { ActionButton } from '../components/ActionButton';
import { useInvestigationCase } from '../hooks/useInvestigationCase';
import { getCase, isPlayable } from '../catalog/caseCatalog';
import { getProgress, isCaseLocked } from '../utils/caseProgress';

export function InvestigationLoadingPage() {
  const { difficulty } = useParams();
  const caseData = getCase(difficulty);
  const { briefing, isLoading, error, retry } = useInvestigationCase(difficulty);

  // Sealed and locked cases are not reachable by URL either.
  if (!isPlayable(caseData) || isCaseLocked(difficulty, getProgress())) {
    return <Navigate to="/difficulty" replace />;
  }

  if (isLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-center">
        <AnimatedBackground variant="board" />
        <motion.div role="status" aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="relative z-10 flex flex-col items-center gap-6">
          <Fingerprint size={44} className="animate-flicker text-crimson-glow" strokeWidth={1.6} aria-hidden="true" />
          <p className="font-display text-3xl font-bold uppercase tracking-[0.16em] text-bone sm:text-4xl">Securing the scene</p>
          <p className="max-w-md text-lg leading-8 text-bone-muted">Loading the evidence database for {caseData.title}.</p>
          <div className="h-1 w-56 overflow-hidden bg-white/10">
            <span className="block h-full w-1/3 animate-sweep bg-crimson-bright" />
          </div>
        </motion.div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-center">
        <AnimatedBackground />
        <motion.div role="alert" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex max-w-lg flex-col items-center gap-5">
          <AlertTriangle size={40} className="text-verdict-alert" strokeWidth={1.8} aria-hidden="true" />
          <p className="font-display text-3xl font-bold uppercase tracking-[0.14em] text-bone">Investigation unavailable</p>
          <p className="text-lg leading-8 text-bone-muted">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ActionButton variant="primary" icon={RotateCcw} onClick={retry}>Try again</ActionButton>
            <ActionButton as="link" to="/difficulty" variant="ghost">Back to case selection</ActionButton>
          </div>
        </motion.div>
      </main>
    );
  }

  return <InvestigationLayout caseData={briefing.case} briefing={briefing} difficulty={difficulty} />;
}
