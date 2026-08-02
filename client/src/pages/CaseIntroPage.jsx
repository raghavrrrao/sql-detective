import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, FileSearch, MapPin, Timer, UserX } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { ActionButton } from '../components/ActionButton';
import { CaseFile } from '../components/CaseFile';
import { CaseHeader } from '../components/CaseHeader';
import { MissionCard } from '../components/MissionCard';
import { TypewriterText } from '../components/TypewriterText';
import { getCase, getCaseRoutePath, getCaseWording, isPlayable, resolveCaseRouteParam } from '../catalog/caseCatalog';
import { getProgress, isCaseLocked, markCaseOpened } from '../utils/caseProgress';

/** A theft has no time of death, so the middle label comes from the case. */
const factsFor = (wording) => [
  { key: 'date', label: 'Date', icon: CalendarDays },
  { key: 'time', label: wording.time, icon: Timer },
  { key: 'location', label: 'Location', icon: MapPin },
];

export function CaseIntroPage() {
  const { difficulty: routeDifficulty } = useParams();
  const difficulty = resolveCaseRouteParam(routeDifficulty) ?? routeDifficulty;
  const caseData = getCase(difficulty);
  const wording = getCaseWording(difficulty);
  const facts = factsFor(wording);
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

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-14 sm:px-10 lg:py-20">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.55, delay: 0.15 }} className="text-center">
          <p className="font-mono text-sm font-medium uppercase tracking-[0.28em] text-crimson-glow">Investigation briefing</p>
          <h1 className="mt-6 min-h-[4.5rem] typo-heading text-4xl leading-[1.12] text-bone sm:min-h-[7rem] sm:text-5xl md:text-7xl">
            <TypewriterText text={caseData.title} delay={350} speed={32} />
          </h1>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="clip-corner mx-auto mt-12 max-w-3xl overflow-hidden panel-surface shadow-panel"
        >
          <div className="relative flex min-h-[17rem] items-end overflow-hidden p-5 sm:min-h-[21rem] sm:p-9">
            {caseData.previewImage && (
              <img
                src={caseData.previewImage}
                alt={`Artwork for ${caseData.title}`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center"
                style={{ filter: 'brightness(1.1) contrast(1.1) saturate(1.1)' }}
              />
            )}
            {/*
              The art is the hero, so nothing dims it as a whole. The scrim is
              anchored to the bottom third only — enough to guarantee the
              caption reads on a bright plate, while the top of the plate is
              left completely alone.
            */}
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink-deep/92 via-ink-deep/55 to-transparent" />
            <div aria-hidden="true" className="absolute inset-0 film-grain opacity-[0.035] mix-blend-overlay" />
            {/* A brass mount, the way a photograph sits in a case file. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(184,146,66,0.22),inset_0_0_60px_-18px_rgba(0,0,0,0.9)]" />
            <div className="relative">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-crimson-glow">
                {wording.isTheft ? <FileSearch size={15} strokeWidth={2.4} /> : <UserX size={15} strokeWidth={2.4} />} {wording.subject}
              </p>
              <h2
                className="mt-3 font-display text-3xl font-medium uppercase leading-tight text-bone sm:text-4xl md:text-5xl"
                style={{ textShadow: '0 3px 10px rgba(0,0,0,0.85)' }}
              >
                {caseData.victim}
              </h2>
            </div>
          </div>

          <dl className="grid gap-6 border-t border-white/10 bg-white/[0.02] p-5 sm:grid-cols-3 sm:p-7">
            {facts.map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-bone-dim">
                  <Icon size={14} className="text-gold-bright" strokeWidth={2.2} /> {label}
                </dt>
                <dd className="mt-2 typo-document text-base text-bone">{caseData[key]}</dd>
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
          <ActionButton as="link" to={getCaseRoutePath(difficulty, 'investigation')} variant="primary" size="lg" iconRight={ArrowRight}>
            Enter investigation
          </ActionButton>
        </motion.div>
      </main>
    </motion.div>
  );
}
