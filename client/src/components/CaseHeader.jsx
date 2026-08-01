import { motion } from 'framer-motion';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DifficultyBadge } from './DifficultyBadge';
import { SoundToggle } from './SoundToggle';

export function CaseHeader({ caseData }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative z-10 border-b border-white/10 bg-ink/60 px-4 py-4 backdrop-blur-xl sm:px-10 sm:py-5 lg:px-16"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link
            to="/difficulty"
            aria-label="Back to case selection"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-white/12 bg-white/[0.04] text-bone-muted transition-colors hover:border-gold/50 hover:text-gold-bright"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <p className="min-w-0 truncate font-mono text-xs font-medium uppercase tracking-[0.14em] text-bone-dim sm:text-sm sm:tracking-[0.2em]">
            {caseData.caseNumber} <span className="text-crimson-glow">/ classified</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DifficultyBadge difficulty={caseData.tier} rank={caseData.tierRank} />
          <span className="hidden items-center gap-2 text-sm text-bone-muted sm:inline-flex">
            <Clock3 size={16} className="text-gold-bright" strokeWidth={2} /> {caseData.estimatedTime}
          </span>
          <SoundToggle />
        </div>
      </div>
    </motion.header>
  );
}
