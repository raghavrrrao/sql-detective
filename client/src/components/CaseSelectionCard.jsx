import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, CircleDot, Clock3, GraduationCap, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DifficultyBadge } from './DifficultyBadge';
import { resetInvestigation } from '../utils/caseProgress';

const statusChips = {
  new: { label: 'Unopened', icon: Sparkles, className: 'border-gold/40 bg-gold/10 text-gold-bright' },
  opened: { label: 'Briefing read', icon: CircleDot, className: 'border-white/20 bg-white/[0.06] text-bone-muted' },
  'in-progress': { label: 'In progress', icon: CircleDot, className: 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear' },
  solved: { label: 'Solved', icon: BadgeCheck, className: 'border-verdict-clear/60 bg-verdict-clear/15 text-verdict-clear' },
};

export function CaseSelectionCard({ caseData, caseKey, index, status = 'new', isLocked = false, lockHint }) {
  const chip = statusChips[status] ?? statusChips.new;
  const ChipIcon = chip.icon;
  const isSolved = status === 'solved';
  const [confirmReplay, setConfirmReplay] = useState(false);
  const navigate = useNavigate();

  // Replay clears the investigation session only. The solved record and the
  // report that was earned with it are deliberately left alone, and the case
  // database is never touched.
  const handleReplay = () => {
    if (!confirmReplay) { setConfirmReplay(true); return; }
    resetInvestigation(caseKey);
    navigate(`/investigation/${caseKey}`);
  };

  const body = (
    <>
      <div className="flex items-center justify-between gap-4">
        <DifficultyBadge difficulty={caseData.tier} rank={caseData.tierRank} />
        <span className="font-mono text-sm text-bone-dim">{caseData.caseNumber}</span>
      </div>

      <h2 className="mt-7 font-display text-3xl font-bold uppercase leading-tight text-bone">{caseData.title}</h2>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-2 text-base text-bone-muted">
          <Clock3 size={16} className="text-gold-bright" strokeWidth={2} /> {caseData.estimatedTime}
        </span>
        <span className={`clip-corner-sm inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${chip.className}`}>
          <ChipIcon size={12} strokeWidth={2.4} /> {chip.label}
        </span>
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm text-bone-dim">
        <GraduationCap size={15} className="shrink-0 text-bone-dim" strokeWidth={2} aria-hidden="true" />
        Recommended: {caseData.recommendedExperience}
      </p>

      <div className="mt-6 border-y border-white/10 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-bone-dim">Skills required</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {caseData.sqlConcepts.map((concept) => (
            <span key={concept} className="clip-corner-sm border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-bone">{concept}</span>
          ))}
        </div>
      </div>

      <p className="mt-6 flex-1 text-base leading-7 text-bone-muted">{caseData.preview}</p>
    </>
  );

  if (isLocked) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        aria-disabled="true"
        className="clip-corner relative flex h-full flex-col panel-surface p-7 opacity-70 shadow-panel"
      >
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink/72 px-6 text-center backdrop-blur-[3px]">
          <Lock size={30} className="text-gold-bright" strokeWidth={1.8} />
          <p className="font-display text-xl font-semibold uppercase tracking-[0.16em] text-bone">Case sealed</p>
          <p className="max-w-[16rem] text-sm leading-6 text-bone-muted">{lockHint}</p>
        </div>
        <div className="grayscale">{body}</div>
        <span className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone-dim">
          Locked <Lock size={17} />
        </span>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className={`clip-corner group relative flex h-full flex-col panel-surface p-7 shadow-panel transition-colors duration-300 ${
        isSolved ? 'border-verdict-clear/35 hover:border-verdict-clear/60' : 'hover:border-crimson/45'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent to-transparent transition-transform duration-500 ${
          isSolved ? 'scale-x-100 via-verdict-clear' : 'scale-x-0 via-crimson-bright group-hover:scale-x-100'
        }`}
      />
      {body}

      {isSolved ? (
        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="flex items-center gap-2 font-display text-base font-semibold uppercase tracking-[0.16em] text-verdict-clear">
            <BadgeCheck size={19} strokeWidth={2.2} aria-hidden="true" /> Solved
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              to={`/investigation/${caseKey}`}
              className="clip-corner-sm inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright"
            >
              Review the case file
            </Link>
            <button
              type="button"
              onClick={handleReplay}
              onBlur={() => setConfirmReplay(false)}
              className={`clip-corner-sm inline-flex items-center gap-2 border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                confirmReplay
                  ? 'border-crimson-bright/60 bg-crimson/15 text-crimson-glow'
                  : 'border-white/12 bg-white/[0.04] text-bone-muted hover:border-crimson-bright/50 hover:text-crimson-glow'
              }`}
            >
              <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
              {confirmReplay ? 'Clear progress and replay?' : 'Replay investigation'}
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-bone-dim">
            Replaying clears your notes, discoveries and journal for this case. The report you earned is kept.
          </p>
        </div>
      ) : (
        <Link
          to={`/case/${caseKey}`}
          className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 font-display text-base font-semibold uppercase tracking-[0.16em] text-bone transition-colors hover:text-gold-bright"
        >
          <span>Open case file</span>
          <ArrowUpRight size={20} className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Link>
      )}
    </motion.article>
  );
}
