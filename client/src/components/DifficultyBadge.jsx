/**
 * Colour follows the tier's position on the five-tier scale, not its name, so
 * a new tier only has to declare its rank in the catalog to be styled.
 */
const byRank = {
  1: 'border-sky-400/45 bg-sky-500/10 text-sky-300',
  2: 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear',
  3: 'border-gold/50 bg-gold/10 text-gold-bright',
  4: 'border-orange-400/50 bg-orange-500/10 text-orange-300',
  5: 'border-crimson-bright/55 bg-crimson/12 text-crimson-glow',
};

export function DifficultyBadge({ difficulty, rank = 2, className = '' }) {
  return (
    <span
      className={`clip-corner-sm inline-flex items-center border px-3 py-1.5 font-display text-xs font-medium uppercase tracking-[0.22em] ${byRank[rank] ?? byRank[2]} ${className}`}
    >
      {difficulty}
    </span>
  );
}
