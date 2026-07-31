import { AlertTriangle, HelpCircle, ShieldCheck, Target } from 'lucide-react';

/**
 * Maps the free-text `status` the API returns for a suspect onto the three
 * verdict colours plus the player's own "prime suspect" flag.
 */
const tones = {
  verified: { label: 'Verified', icon: ShieldCheck, className: 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear' },
  disputed: { label: 'Disputed', icon: AlertTriangle, className: 'border-verdict-watch/50 bg-verdict-watch/10 text-verdict-watch' },
  unverified: { label: 'Unverified', icon: HelpCircle, className: 'border-verdict-alert/50 bg-verdict-alert/10 text-verdict-alert' },
  prime: { label: 'Prime Suspect', icon: Target, className: 'border-crimson-bright/70 bg-crimson/20 text-crimson-glow' },
};

export function resolveStatusTone(status = '') {
  const value = status.toLowerCase();
  if (value.includes('unverified')) return 'unverified';
  if (value.includes('disputed')) return 'disputed';
  if (value.includes('verified') || value.includes('cleared')) return 'verified';
  return 'disputed';
}

export function StatusBadge({ tone, label, size = 'md', className = '' }) {
  const config = tones[tone] ?? tones.disputed;
  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs';

  return (
    <span
      className={`clip-corner-sm inline-flex items-center gap-1.5 border font-semibold uppercase tracking-[0.14em] ${padding} ${config.className} ${className}`}
    >
      <Icon size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />
      {label ?? config.label}
    </span>
  );
}
