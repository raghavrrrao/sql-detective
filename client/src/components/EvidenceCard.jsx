import { memo, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, FlaskConical, FileText, Fingerprint, HardDrive, KeyRound, Package, Pill, Swords } from 'lucide-react';

/** Category → icon + accent, so evidence type is readable at a glance. */
const categoryStyles = {
  Weapon: { icon: Swords, tone: 'text-crimson-glow', ring: 'border-crimson/40 bg-crimson-deep/25' },
  Forensic: { icon: FlaskConical, tone: 'text-verdict-clear', ring: 'border-verdict-clear/35 bg-verdict-clear/10' },
  Document: { icon: FileText, tone: 'text-gold-bright', ring: 'border-gold/35 bg-gold-deep/20' },
  Digital: { icon: HardDrive, tone: 'text-sky-300', ring: 'border-sky-400/30 bg-sky-500/10' },
  Access: { icon: KeyRound, tone: 'text-violet-300', ring: 'border-violet-400/30 bg-violet-500/10' },
  Medical: { icon: Pill, tone: 'text-emerald-300', ring: 'border-emerald-400/30 bg-emerald-500/10' },
  Physical: { icon: Package, tone: 'text-orange-300', ring: 'border-orange-400/30 bg-orange-500/10' },
};

const fallback = { icon: Fingerprint, tone: 'text-bone-muted', ring: 'border-white/15 bg-white/[0.05]' };

/** Weapons and forensics get flagged as high priority on the board. */
function importanceOf(category) {
  if (category === 'Weapon') return { label: 'Critical', className: 'border-crimson-bright/60 bg-crimson/15 text-crimson-glow' };
  if (category === 'Forensic' || category === 'Digital') return { label: 'High', className: 'border-gold/45 bg-gold/10 text-gold-bright' };
  return { label: 'Routine', className: 'border-white/15 bg-white/[0.05] text-bone-dim' };
}

function formatStamp(value) {
  if (!value) return null;
  const [, time] = String(value).split(' ');
  return time ? time.slice(0, 5) : value;
}

/**
 * Expansion is uncontrolled by default, but the case board hands in `isOpen`
 * and `onToggle` so an opened exhibit is still open after a refresh.
 */
function EvidenceCardComponent({ item, index, isOpen: controlledOpen, onToggle }) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = controlledOpen ?? localOpen;
  const toggle = useCallback(() => {
    if (onToggle) onToggle(item.id);
    else setLocalOpen((open) => !open);
  }, [onToggle, item.id]);

  const style = categoryStyles[item.category] ?? fallback;
  const Icon = style.icon;
  const importance = importanceOf(item.category);
  const stamp = formatStamp(item.discovered_at);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
      className="clip-corner-sm panel-surface-raised overflow-hidden transition-colors duration-200 hover:border-gold/35"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3.5 p-4 text-left"
      >
        <span className={`clip-corner-sm mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border ${style.ring}`}>
          <Icon size={18} className={style.tone} strokeWidth={2} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[0.95rem] font-medium leading-snug text-bone">{item.title}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span className="clip-corner-sm border border-white/12 bg-white/[0.05] px-2 py-0.5 text-xs font-medium uppercase tracking-[0.12em] text-bone-muted">
              {item.category}
            </span>
            <span className={`clip-corner-sm border px-2 py-0.5 text-xs font-medium uppercase tracking-[0.12em] ${importance.className}`}>
              {importance.label}
            </span>
            {stamp && <span className="font-mono text-xs text-bone-dim">{stamp}</span>}
          </span>
        </span>

        <ChevronDown aria-hidden="true" size={17} className={`mt-1 shrink-0 text-bone-dim transition-transform duration-200 ${isOpen ? 'rotate-180 text-gold-bright' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="border-t border-white/10 px-4 py-4 typo-document text-[0.9rem] text-bone-muted">{item.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export const EvidenceCard = memo(EvidenceCardComponent);
