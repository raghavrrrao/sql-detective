import { ArrowLeft, BookOpen, LayoutPanelLeft, Star, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DifficultyBadge } from './DifficultyBadge';
import { SoundToggle } from './SoundToggle';

const timingByDifficulty = { Easy: '20:00', Medium: '35:00', Expert: '60:00' };
const scoreByDifficulty = { Easy: '1000', Medium: '2000', Expert: '3000' };

export function HeaderBar({ caseData, onOpenSidebar, onOpenNotebook, difficulty }) {
  return (
    <header className="relative z-30 flex min-h-[4.5rem] items-center justify-between gap-3 border-b border-white/10 bg-ink/85 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open case board"
          className="clip-corner-sm border border-white/12 bg-white/[0.04] p-2.5 text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright xl:hidden"
        >
          <LayoutPanelLeft size={19} strokeWidth={2} />
        </button>

        <Link
          to={`/case/${difficulty}`}
          aria-label="Back to case briefing"
          className="clip-corner-sm hidden border border-white/12 bg-white/[0.04] p-2.5 text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright sm:inline-flex"
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </Link>

        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold uppercase tracking-wide text-bone sm:text-xl">{caseData.title}</p>
          <p className="hidden font-mono text-xs uppercase tracking-[0.18em] text-bone-dim sm:block">
            {caseData.caseNumber} · Active investigation
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <DifficultyBadge difficulty={caseData.difficulty} />

        <div className="clip-corner-sm hidden items-center gap-2 border border-white/12 bg-white/[0.04] px-3 py-2 font-mono text-sm text-bone md:flex">
          <Timer size={15} className="text-crimson-glow" strokeWidth={2.2} /> {timingByDifficulty[caseData.difficulty]}
        </div>
        <div className="clip-corner-sm hidden items-center gap-2 border border-white/12 bg-white/[0.04] px-3 py-2 font-mono text-sm text-bone xl:flex">
          <Star size={15} className="text-gold-bright" strokeWidth={2.2} /> {scoreByDifficulty[caseData.difficulty]}
        </div>

        <SoundToggle />

        <button
          type="button"
          onClick={onOpenNotebook}
          aria-label="Open detective notebook"
          className="clip-corner-sm border border-white/12 bg-white/[0.04] p-2.5 text-bone-muted transition-colors hover:border-gold/45 hover:text-gold-bright"
        >
          <BookOpen size={18} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
