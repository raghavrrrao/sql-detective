import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Timer, UserX } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { ActionButton } from '../components/ActionButton';
import { CaseFile } from '../components/CaseFile';
import { CaseHeader } from '../components/CaseHeader';
import { MissionCard } from '../components/MissionCard';
import { TypewriterText } from '../components/TypewriterText';
import { getCase, isPlayable } from '../catalog/caseCatalog';
import { getProgress, isCaseLocked, markCaseOpened } from '../utils/caseProgress';

const facts = [
  { key: 'date', label: 'Date', icon: CalendarDays },
  { key: 'time', label: 'Time of death', icon: Timer },
  { key: 'location', label: 'Location', icon: MapPin },
];

export function CaseIntroPage() {
  const { difficulty } = useParams();
  const caseData = getCase(difficulty);
  // A sealed slot has no database, and a locked one has not been earned yet.
  // Either way the board is the only honest place to send a direct link.
  const isOpen = isPlayable(caseData) && !isCaseLocked(difficulty, getProgress());

  useEffect(() => {
    if (isOpen) markCaseOpened(difficulty);
  }, [isOpen, difficulty]);

  if (!isOpen) return <Navigate to="/difficulty" replace />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }} className="relative min-h-screen overflow-hidden text-bone">
      <AnimatedBackground />
      <CaseHeader caseData={caseData} />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-14 sm:px-10 lg:py-20">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.55, delay: 0.15 }} className="text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-crimson-glow">Investigation briefing</p>
          <h1 className="mt-6 min-h-[5.5rem] font-display text-5xl font-bold uppercase leading-[1.05] text-bone sm:min-h-[7rem] sm:text-7xl">
            <TypewriterText text={caseData.title} delay={350} speed={32} />
          </h1>
        </motion.div>

        {/* Victim placard */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="clip-corner mx-auto mt-12 max-w-3xl overflow-hidden panel-surface shadow-panel"
        >
          <div className="relative flex min-h-[17rem] items-end overflow-hidden bg-gradient-to-br from-charcoal-light via-ink-soft to-crimson-deep/40 p-7 sm:min-h-[21rem] sm:p-9">
            <div aria-hidden="true" className="absolute inset-0 board-grid-fine opacity-40" />
            <div aria-hidden="true" className="absolute left-1/2 top-10 h-40 w-32 -translate-x-1/2 rounded-t-[50%] border border-white/10 bg-charcoal/60 shadow-[0_0_90px_rgba(0,0,0,0.8)] sm:h-48 sm:w-40" />
            <div aria-hidden="true" className="absolute left-1/2 top-[9.5rem] h-44 w-56 -translate-x-1/2 rounded-t-[48%] bg-charcoal/75 sm:top-[11.5rem] sm:h-48 sm:w-72" />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(115deg,transparent_25%,rgba(255,255,255,0.05)_45%,transparent_55%)]" />
            <div aria-hidden="true" className="absolute inset-0 film-grain opacity-[0.06] mix-blend-overlay" />
            <div className="relative">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-crimson-glow">
                <UserX size={15} strokeWidth={2.4} /> Victim
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase text-bone sm:text-5xl">{caseData.victim}</h2>
            </div>
          </div>

          <dl className="grid gap-6 border-t border-white/10 bg-white/[0.02] p-6 sm:grid-cols-3 sm:p-7">
            {facts.map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-bone-dim">
                  <Icon size={14} className="text-gold-bright" strokeWidth={2.2} /> {label}
                </dt>
                <dd className="mt-2 text-base leading-6 text-bone">{caseData[key]}</dd>
              </div>
            ))}
          </dl>
        </motion.section>

        <div className="mx-auto mt-8 max-w-3xl space-y-6">
          <CaseFile caseData={caseData} />
          <MissionCard />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 1.05 }}
          className="mx-auto mt-10 flex max-w-3xl flex-col-reverse gap-4 sm:flex-row sm:justify-between"
        >
          <ActionButton as="link" to="/difficulty" variant="ghost" icon={ArrowLeft}>Back</ActionButton>
          <ActionButton as="link" to={`/investigation/${difficulty}`} variant="primary" size="lg" iconRight={ArrowRight}>
            Enter investigation
          </ActionButton>
        </motion.div>
      </main>
    </motion.div>
  );
}
