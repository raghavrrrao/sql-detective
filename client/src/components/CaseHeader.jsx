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
      className="relative z-10 border-b border-white/10 bg-ink/60 px-6 py-5 backdrop-blur-xl sm:px-10 lg:px-16"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/difficulty"
            aria-label="Back to case selection"
            className="inline-flex h-10 w-10 items-center justify-center border border-white/12 bg-white/[0.04] text-bone-muted transition-colors hover:border-gold/50 hover:text-gold-bright"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </Link>
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-bone-dim">
            {caseData.caseNumber} <span className="text-crimson-glow">/ classified</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DifficultyBadge difficulty={caseData.difficulty} />
          <span className="hidden items-center gap-2 text-sm text-bone-muted sm:flex">
            <Clock3 size={16} className="text-gold-bright" strokeWidth={2} /> {caseData.timeLimit}
          </span>
          <SoundToggle />
        </div>
      </div>
    </motion.header>
  );
}
