import { Trophy } from 'lucide-react';
import { TOP_ENTRIES, formatDuration, getTopEntries } from '../utils/leaderboard';

/**
 * The festival board. Highest score first, a tie broken by the faster time.
 */
export function LeaderboardPanel({ entries, highlightId = null, limit = TOP_ENTRIES, className = '' }) {
  const rows = entries ?? getTopEntries(limit);

  return (
    <section aria-label="Leaderboard" className={`clip-corner panel-surface shadow-panel ${className}`}>
      <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <Trophy size={18} className="text-gold-bright" strokeWidth={2} aria-hidden="true" />
        <h2 className="font-display text-base font-medium uppercase tracking-[0.18em] text-bone">Leaderboard</h2>
        <span className="ml-auto font-mono text-xs text-bone-dim">Top {limit}</span>
      </header>

      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-base text-bone-muted">
          No cases have been closed on this machine yet.
        </p>
      ) : (
        <div className="max-h-[26rem] overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-charcoal/95 backdrop-blur">
              <tr>
                {['#', 'Detective', 'Case', 'Time', 'Hints', 'Score'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap border-b border-gold/25 px-4 py-3 font-display text-xs font-medium uppercase tracking-[0.16em] text-gold-bright"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`border-b border-white/[0.06] ${
                    entry.id === highlightId ? 'bg-gold/[0.1]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <td className="px-4 py-3 typo-numeric text-bone-dim">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-bone">{entry.name}</td>
                  <td className="px-4 py-3 text-bone-muted">
                    {entry.caseTitle}
                    <span className="ml-2 font-mono text-xs text-bone-dim">{entry.tier}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 typo-numeric text-bone-muted">{formatDuration(entry.timeMs)}</td>
                  <td className="px-4 py-3 typo-numeric text-bone-muted">{entry.hintsUsed}</td>
                  <td className="px-4 py-3 typo-numeric font-semibold text-gold-bright">{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
