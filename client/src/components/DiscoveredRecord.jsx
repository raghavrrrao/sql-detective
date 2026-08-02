import { ChevronDown, Clock, MapPin, UserRound } from 'lucide-react';

const confidenceStyles = {
  Recorded: 'border-verdict-info/35 bg-verdict-info/10 text-verdict-info',
  Forensic: 'border-verdict-clear/35 bg-verdict-clear/10 text-verdict-clear',
  Reported: 'border-verdict-watch/40 bg-verdict-watch/10 text-verdict-watch',
  Documented: 'border-white/15 bg-white/[0.05] text-bone-muted',
};

/** `id` is a database key, not a fact about the case. */
const HIDDEN_COLUMNS = new Set(['id']);

const label = (column) => column.replace(/_/g, ' ');

/**
 * One record the player pulled out of the database.
 *
 * It renders the columns that came back and nothing else — a narrow projection
 * shows a thin record, and running `SELECT *` over the same row later fills it
 * out. That is the whole point: the notebook holds what was asked for, not
 * what exists.
 */
export function DiscoveredRecord({ record, isOpen, onToggle }) {
  const fields = Object.entries(record.fields ?? {}).filter(
    ([column, value]) => !HIDDEN_COLUMNS.has(column) && value !== null && value !== undefined && String(value).trim() !== '',
  );

  return (
    <li className="clip-corner-sm border border-white/10 bg-white/[0.035]">
      <button
        type="button"
        onClick={() => onToggle(record.key)}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 p-3.5 text-left"
      >
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`mt-0.5 shrink-0 text-bone-dim transition-transform duration-200 ${isOpen ? 'rotate-180 text-gold-bright' : ''}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block typo-document text-[0.9rem] text-bone">{record.title}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span className="clip-corner-sm border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-bone-muted">
              {record.table.replace(/_/g, ' ')}
            </span>
            <span className={`clip-corner-sm border px-2 py-0.5 text-xs font-medium uppercase tracking-[0.1em] ${confidenceStyles[record.confidence] ?? confidenceStyles.Documented}`}>
              {record.confidence}
            </span>
            {record.occurredAt && (
              <span className="flex items-center gap-1 font-mono text-xs text-bone-dim">
                <Clock size={11} strokeWidth={2.2} aria-hidden="true" /> {record.occurredAt}
              </span>
            )}
            {record.location && (
              <span className="flex items-center gap-1 text-xs text-bone-dim">
                <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {record.location}
              </span>
            )}
            {record.suspects.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-bone-dim">
                <UserRound size={11} strokeWidth={2.2} aria-hidden="true" /> {record.suspects.join(', ')}
              </span>
            )}
          </span>
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-white/10 p-4">
          {fields.length === 0 ? (
            <p className="typo-body-secondary text-sm text-bone-dim">
              This record was recovered with no readable columns. Run a wider SELECT to fill it out.
            </p>
          ) : (
            <dl className="space-y-2.5">
              {fields.map(([column, value]) => (
                <div key={column}>
                  <dt className="text-xs font-medium uppercase tracking-[0.14em] text-bone-dim">{label(column)}</dt>
                  <dd className="mt-0.5 typo-document text-sm text-bone-muted">{String(value)}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-4 border-t border-white/10 pt-3 font-mono text-xs leading-5 text-bone-dim">
            Recovered by: {record.sql}
          </p>
        </div>
      )}
    </li>
  );
}
