/**
 * Colour follows the tier's position on the five-tier scale, not its name, so
 * a new tier only has to declare its rank in the catalog to be styled.
 */
const byRank = {
  1: 'border-verdict-info/50 bg-verdict-info/10 text-verdict-info',
  2: 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear',
  3: 'border-gold/55 bg-gold/12 text-gold-bright',
  4: 'border-orange-400/50 bg-orange-500/12 text-orange-300',
  5: 'border-crimson-bright/60 bg-crimson/15 text-crimson-glow',
};

export function DifficultyBadge({ difficulty, rank = 2, className = '' }) {
  return (
    <span
      // An inset top-light turns a flat chip into a stamped plate.
      className={`clip-corner-sm inline-flex items-center border px-3 py-1.5 font-display text-xs font-medium uppercase tracking-[0.22em] shadow-[inset_0_1px_0_rgba(255,250,236,0.14)] ${byRank[rank] ?? byRank[2]} ${className}`}
    >
      {difficulty}
    </span>
  );
}
