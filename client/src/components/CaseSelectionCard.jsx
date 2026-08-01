import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, CircleDot, Clock3, Database, Fingerprint, GraduationCap, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DifficultyBadge } from './DifficultyBadge';
import { getCaseRoutePath } from '../catalog/caseCatalog';
import { resetInvestigation } from '../utils/caseProgress';

const statusChips = {
  new: { label: 'Unopened', icon: Sparkles, className: 'border-gold/40 bg-gold/10 text-gold-bright' },
  opened: { label: 'Briefing read', icon: CircleDot, className: 'border-white/20 bg-white/[0.06] text-bone-muted' },
  'in-progress': { label: 'In progress', icon: CircleDot, className: 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear' },
  solved: { label: 'Solved', icon: BadgeCheck, className: 'border-verdict-clear/60 bg-verdict-clear/15 text-verdict-clear' },
  sealed: { label: 'Coming soon', icon: Lock, className: 'border-white/20 bg-white/[0.06] text-bone-muted' },
};

function SkillRow({ icon: Icon, label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-bone-dim">
        <Icon size={13} className="text-gold-bright" strokeWidth={2.2} aria-hidden="true" /> {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="clip-corner-sm border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-bone">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CaseSelectionCard({ caseData, caseKey, index, status = 'new', isLocked = false, isSealed = false, requirement, onShowLocked }) {
  const chip = statusChips[isSealed ? 'sealed' : status] ?? statusChips.new;
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
    navigate(getCaseRoutePath(caseKey, 'investigation'));
  };

  const body = (
    <>
      <div className="flex items-center justify-between gap-4">
        <DifficultyBadge difficulty={caseData.tier} rank={caseData.tierRank} />
        <span className="font-mono text-sm text-bone-dim">{caseData.caseNumber}</span>
      </div>

      <h2 className="mt-7 font-display text-3xl font-medium uppercase leading-tight text-bone">{caseData.title}</h2>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-2 text-base text-bone-muted">
          <Clock3 size={16} className="text-gold-bright" strokeWidth={2} /> {caseData.estimatedTime}
        </span>
        <span className={`clip-corner-sm inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.14em] ${chip.className}`}>
          <ChipIcon size={12} strokeWidth={2.4} /> {chip.label}
        </span>
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm text-bone-dim">
        <GraduationCap size={15} className="shrink-0 text-bone-dim" strokeWidth={2} aria-hidden="true" />
        Recommended: {caseData.recommendedExperience}
      </p>

      <div className="mt-6 space-y-5 border-y border-white/10 py-5">
        <SkillRow icon={Database} label="SQL skills" items={caseData.sqlConcepts} />
        <SkillRow icon={Fingerprint} label="Detective skills" items={caseData.detectiveSkills} />
      </div>

      <p className="mt-6 flex-1 typo-body text-base text-bone-muted">{caseData.preview}</p>
    </>
  );

  /* ------------------------------------------------------------ sealed slot */
  // A slot with no content yet. It is shown in full so the career reads as five
  // cases from the start, and it says plainly that the file is being prepared.
  if (isSealed) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -4 }}
        aria-label={`${caseData.caseNumber}, ${caseData.tier}, file sealed`}
        className="clip-corner relative flex h-full flex-col panel-surface p-7 shadow-panel transition-colors duration-300 hover:border-gold/35"
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        {body}
        <div className="mt-8 border-t border-white/10 pt-5 text-center">
          <p className="font-display text-sm font-medium uppercase tracking-[0.3em] text-gold-bright">Classified</p>
          <p className="mt-2 flex items-center justify-center gap-2 font-display text-base font-medium uppercase tracking-[0.16em] text-bone">
            <Lock size={16} strokeWidth={2.2} aria-hidden="true" /> Investigation file sealed
          </p>
          <p className="mt-2 text-sm text-bone-dim">Coming soon</p>
        </div>
      </motion.article>
    );
  }

  /* ----------------------------------------------------------- locked case */
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -4 }}
        className="h-full"
      >
        <button
          type="button"
          onClick={() => onShowLocked?.(caseData)}
          aria-label={`${caseData.caseNumber}, ${caseData.title}, locked. ${requirement ? `Close ${requirement.title} to unlock.` : ''}`}
          className="clip-corner group relative flex h-full w-full flex-col p-7 text-left panel-surface shadow-panel transition-colors duration-300 hover:border-gold/40"
        >
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink/72 px-6 text-center backdrop-blur-[3px] transition-colors duration-300 group-hover:bg-ink/60">
            <Lock size={30} className="text-gold-bright" strokeWidth={1.8} />
            <p className="font-display text-xl font-medium uppercase tracking-[0.16em] text-bone">Case sealed</p>
            <p className="max-w-[17rem] typo-body-secondary text-sm text-bone-muted">
              {requirement ? `Complete ${requirement.tier} to unlock` : 'Not yet available'}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-bone-dim">Select for details</p>
          </div>
          <div className="opacity-70 grayscale">{body}</div>
          <span className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 font-display text-sm font-medium uppercase tracking-[0.16em] text-bone-dim">
            Locked <Lock size={17} />
          </span>
        </button>
      </motion.div>
    );
  }

  /* ------------------------------------------------------------- available */
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
          <p className="flex items-center gap-2 font-display text-base font-medium uppercase tracking-[0.16em] text-verdict-clear">
            <BadgeCheck size={19} strokeWidth={2.2} aria-hidden="true" /> Solved
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              to={getCaseRoutePath(caseKey, 'investigation')}
              className="clip-corner-sm inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright"
            >
              Review the case file
            </Link>
            <button
              type="button"
              onClick={handleReplay}
              onBlur={() => setConfirmReplay(false)}
              className={`clip-corner-sm inline-flex items-center gap-2 border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                confirmReplay
                  ? 'border-crimson-bright/60 bg-crimson/15 text-crimson-glow'
                  : 'border-white/12 bg-white/[0.04] text-bone-muted hover:border-crimson-bright/50 hover:text-crimson-glow'
              }`}
            >
              <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
              {confirmReplay ? 'Clear progress and replay?' : 'Replay investigation'}
            </button>
          </div>
          <p className="mt-3 typo-body-secondary text-sm text-bone-dim">
            Replaying clears your notes, discoveries and journal for this case. The report you earned is kept, and it never relocks what you have opened.
          </p>
        </div>
      ) : (
        <Link
          to={getCaseRoutePath(caseKey, 'case')}
          className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 font-display text-base font-medium uppercase tracking-[0.16em] text-bone transition-colors hover:text-gold-bright"
        >
          <span>Open case file</span>
          <ArrowUpRight size={20} className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Link>
      )}
    </motion.article>
  );
}
