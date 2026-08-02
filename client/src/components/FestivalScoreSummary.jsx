import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, FileText, Trophy, UserRoundPlus, X } from 'lucide-react';
import { LeaderboardPanel } from './LeaderboardPanel';
import { audio } from '../audio/audioManager';
import { getCase, getCaseThresholds } from '../catalog/caseCatalog';
import { computeScore } from '../utils/scoring';
import { formatClock } from '../utils/clock';
import { getTopEntries, recordResult } from '../utils/leaderboard';
import { useGameMode } from '../state/gameMode';
import { useInvestigationSession } from '../state/investigationSession';

function Stat({ label, value, tone = 'bone' }) {
  return (
    <div className="clip-corner-sm border border-white/10 bg-white/[0.035] px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-bone-dim">{label}</p>
      <p className={`mt-1.5 font-display text-2xl font-medium ${tone === 'gold' ? 'text-gold-bright' : 'text-bone'}`}>{value}</p>
    </div>
  );
}

/**
 * The end of a festival run: what the participant did, what it scored, where it
 * landed on the board, and the button that hands the machine to the next
 * person. Filing the result happens exactly once, on mount.
 */
export function FestivalScoreSummary({ isOpen, caseData, difficulty, onOpenReport, onNextDetective, onClose }) {
  const { detectiveName, startNextDetective } = useGameMode();
  const { verdict, accusations, discoveries, reach, timeline, completionMs, hintsRevealed, tally, investigation } = useInvestigationSession();
  const filedRef = useRef(null);
  const overlayRef = useRef(null);

  // A keydown only reaches the overlay's handler if focus is inside it.
  useEffect(() => {
    if (!isOpen) return undefined;
    // The score reveal is the reward beat of a festival run.
    audio.playSfx('stars');
    const frame = window.requestAnimationFrame(() => overlayRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const entry = useMemo(() => {
    if (!isOpen || !verdict?.proven) return null;
    if (filedRef.current) return filedRef.current;

    const catalogEntry = getCase(difficulty);
    const elapsedMs = completionMs ?? 0;
    const coverage = {
      discoveries: discoveries.length,
      sources: reach.tables.length,
      timeline: timeline.length,
    };
    const { score, breakdown } = computeScore({
      baseScore: caseData.score ?? 1000,
      attempts: accusations.length || 1,
      hintsUsed: hintsRevealed,
      elapsedMs,
      estimate: catalogEntry?.estimatedTime,
      coverage: { ...coverage, queries: reach.successes + reach.failures },
      thresholds: getCaseThresholds(difficulty).verdict,
      objectives: tally,
      // One engine grades both modes, so a leaderboard entry means exactly what
      // a solved case means. Omitting this would score festival play on a
      // different scale from personal play.
      investigation,
    });

    const filed = recordResult({
      name: detectiveName || 'Anonymous',
      caseId: difficulty,
      caseTitle: caseData.title,
      tier: catalogEntry?.tier ?? caseData.difficulty,
      timeMs: elapsedMs,
      score,
      hintsUsed: hintsRevealed,
      queries: reach.successes + reach.failures,
      discoveries: discoveries.length,
    });

    filedRef.current = { ...filed, breakdown, elapsedMs, coverage };
    return filedRef.current;
  }, [isOpen, verdict, accusations.length, discoveries.length, reach, timeline.length, completionMs, hintsRevealed, tally, investigation, caseData, difficulty, detectiveName]);

  const board = useMemo(() => (entry ? getTopEntries() : []), [entry]);

  if (!isOpen || !entry) return null;

  const handleNext = () => {
    startNextDetective();
    onNextDetective();
  };

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label="Final score"
      onKeyDown={(event) => { if (event.key === 'Escape') onClose?.(); }}
      tabIndex={-1}
      className="fixed inset-0 z-[65] overflow-y-auto bg-ink/97 outline-none backdrop-blur-xl"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 board-grid-fine opacity-30" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 vignette" />

      {/*
        Both actions below are one-way: the report stacks another dialog on top
        of this one, and Next detective wipes the session. Somebody who just
        wants to look at the board again needs a way out that destroys nothing.
      */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close the score summary"
        className="clip-corner-sm absolute right-4 top-4 z-10 border border-white/12 bg-white/[0.04] p-2.5 text-bone-dim transition-colors hover:border-gold/45 hover:text-gold-bright sm:right-6 sm:top-6"
      >
        <X size={19} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="relative mx-auto max-w-4xl px-6 py-14 sm:px-10">
        <p className="text-center font-mono text-sm uppercase tracking-[0.3em] text-crimson-glow">Case closed</p>
        <h2 className="mt-4 text-center font-display text-5xl font-medium uppercase leading-none text-bone sm:text-6xl">
          Detective {entry.entry.name}
        </h2>
        <p className="mt-4 text-center text-lg leading-8 text-bone-muted">
          {caseData.caseNumber} · {caseData.title}
        </p>

        <div className="clip-corner mt-10 border border-gold/40 bg-gold/[0.07] p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold-bright">Final score</p>
          <p className="mt-3 typo-numeric text-5xl font-semibold leading-none text-gold-bright sm:text-7xl">{entry.entry.score}</p>
          <p className="mt-4 flex items-center justify-center gap-2 text-base text-bone-muted">
            <Trophy size={17} strokeWidth={2.2} aria-hidden="true" />
            Rank today: {entry.rankToday} of {entry.totalToday} · All time: {entry.rank} of {entry.total}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Accusation" value={<span className="flex items-center gap-2"><BadgeCheck size={22} strokeWidth={2.2} aria-hidden="true" /> Correct</span>} />
          <Stat label="Time taken" value={formatClock(entry.elapsedMs)} />
          <Stat label="SQL queries" value={entry.entry.queries} />
          <Stat label="Evidence found" value={entry.coverage.discoveries} />
          <Stat label="Sources searched" value={entry.coverage.sources} />
          <Stat label="Hints used" value={entry.entry.hintsUsed} />
        </div>

        <p className="mt-4 text-center typo-body-secondary text-sm text-bone-dim">
          Base {entry.breakdown.baseScore} · accuracy {entry.breakdown.accuracy}%
          {entry.breakdown.coverageBonus > 0 ? ` · coverage +${entry.breakdown.coverageBonus}%` : ''}
          {entry.breakdown.speedBonus > 0 ? ` · speed +${entry.breakdown.speedBonus}%` : ''}
          {entry.breakdown.objectiveBonus > 0 ? ` · objectives +${entry.breakdown.objectiveBonus}%` : ''}
          {entry.breakdown.efficiencyBonus > 0 ? ` · efficiency +${entry.breakdown.efficiencyBonus}%` : ''}
          {entry.breakdown.hintPenalty > 0 ? ` · hints −${entry.breakdown.hintPenalty}%` : ''}
          {entry.breakdown.wrongAccusations > 0 ? ` · ${entry.breakdown.wrongAccusations} accusation${entry.breakdown.wrongAccusations === 1 ? '' : 's'} did not hold` : ''}
        </p>

        <LeaderboardPanel entries={board} highlightId={entry.entry.id} className="mt-8" />

        <div className="mt-10 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onOpenReport}
            className="clip-corner-sm inline-flex items-center gap-2.5 border border-white/12 bg-white/[0.04] px-6 py-3.5 font-display text-sm font-medium uppercase tracking-[0.16em] text-bone transition-colors hover:border-gold/45 hover:text-gold-bright"
          >
            <FileText size={17} strokeWidth={2.2} aria-hidden="true" /> Investigation report
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="clip-corner-sm inline-flex items-center gap-2.5 border border-crimson-bright/60 bg-crimson px-6 py-3.5 font-display text-sm font-medium uppercase tracking-[0.16em] text-bone shadow-crimson transition-transform hover:-translate-y-0.5"
          >
            <UserRoundPlus size={17} strokeWidth={2.2} aria-hidden="true" /> Next detective
          </button>
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 border-b border-white/20 pb-0.5 text-sm text-bone-dim transition-colors hover:border-gold/50 hover:text-gold-bright"
          >
            <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" /> Back to the case board
          </button>
        </div>

        <p className="mt-4 text-center typo-body-secondary text-sm text-bone-dim">
          Next detective clears this investigation and returns to the start. The leaderboard is kept.
        </p>
      </div>
    </motion.div>
  );
}
