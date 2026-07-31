const styles = {
  Easy: 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear',
  Medium: 'border-gold/50 bg-gold/10 text-gold-bright',
  Expert: 'border-crimson-bright/55 bg-crimson/12 text-crimson-glow',
};

export function DifficultyBadge({ difficulty, className = '' }) {
  return (
    <span
      className={`clip-corner-sm inline-flex items-center border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.22em] ${styles[difficulty] ?? styles.Easy} ${className}`}
    >
      {difficulty}
    </span>
  );
}
