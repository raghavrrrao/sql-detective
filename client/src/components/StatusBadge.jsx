import { CircleHelp, FileSearch, ShieldCheck, Star, Target } from 'lucide-react';

/**
 * Investigation status, never case status.
 *
 * These five states describe how far *the player* has got with a person. There
 * is deliberately no badge for a verified or broken alibi: that is the thing
 * the investigation is for, and the interface must not answer it.
 */
const tones = {
  unknown: { label: 'Unknown', icon: CircleHelp, className: 'border-white/15 bg-white/[0.05] text-bone-dim' },
  investigated: { label: 'Investigated', icon: FileSearch, className: 'border-bone-muted/40 bg-white/[0.07] text-bone' },
  interest: { label: 'Person of Interest', icon: Star, className: 'border-gold/50 bg-gold/12 text-gold-bright' },
  cleared: { label: 'Cleared', icon: ShieldCheck, className: 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear' },
  prime: { label: 'Prime Suspect', icon: Target, className: 'border-crimson-bright/70 bg-crimson/20 text-crimson-glow' },
};

export function StatusBadge({ tone, label, size = 'md', className = '' }) {
  const config = tones[tone] ?? tones.unknown;
  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs';

  return (
    <span
      className={`clip-corner-sm inline-flex items-center gap-1.5 border font-medium uppercase tracking-[0.14em] ${padding} ${config.className} ${className}`}
    >
      <Icon size={size === 'sm' ? 12 : 14} strokeWidth={2.2} aria-hidden="true" />
      {label ?? config.label}
    </span>
  );
}
