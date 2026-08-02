import { useMemo, useState } from 'react';
import { Clock, Link2, MapPin, Search, Telescope, UserRound } from 'lucide-react';
import { relatedDiscoveries } from '../../utils/evidenceLinks';
import { useInvestigationSession } from '../../state/investigationSession';

const confidenceStyles = {
  Recorded: 'border-verdict-info/35 bg-verdict-info/10 text-verdict-info',
  Forensic: 'border-verdict-clear/35 bg-verdict-clear/10 text-verdict-clear',
  Reported: 'border-verdict-watch/40 bg-verdict-watch/10 text-verdict-watch',
  Documented: 'border-white/15 bg-white/[0.05] text-bone-muted',
};

function DiscoveryRow({ record, all, isOpen, onToggle }) {
  // Links are only computed for the record the player actually opened.
  const links = useMemo(() => (isOpen ? relatedDiscoveries(record, all) : []), [isOpen, record, all]);

  return (
    <li className="clip-corner-sm border border-white/10 bg-white/[0.035]">
      <button
        type="button"
        onClick={() => onToggle(record.key)}
        aria-expanded={isOpen}
        className="w-full p-4 text-left"
      >
        <span className="block typo-document text-base text-bone">{record.title}</span>
        <span className="mt-2 flex flex-wrap items-center gap-2">
          <span className="clip-corner-sm border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-bone-muted">
            {record.table.replace(/_/g, ' ')}
          </span>
          <span className={`clip-corner-sm border px-2 py-0.5 text-xs font-medium uppercase tracking-[0.12em] ${confidenceStyles[record.confidence] ?? confidenceStyles.Documented}`}>
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
      </button>

      {isOpen && (
        <div className="border-t border-white/10 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-bone-dim">Recovered by</p>
          <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6 text-bone-muted">{record.sql}</pre>

          <p className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-bone-dim">
            <Link2 size={13} strokeWidth={2.2} aria-hidden="true" /> Related records you hold
          </p>
          {links.length === 0 ? (
            <p className="mt-2 typo-body-secondary text-sm text-bone-dim">
              Nothing else in your file shares a person, a place or a moment with this record yet.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {links.map(({ record: related, reasons }) => (
                <li key={related.key} className="clip-corner-sm border border-white/10 bg-black/25 px-3.5 py-2.5">
                  <p className="typo-body-secondary text-sm text-bone-muted">{related.title}</p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {reasons.map((reason) => (
                      <span key={reason} className="clip-corner-sm border border-gold/30 bg-gold/[0.07] px-1.5 py-0.5 text-xs font-medium uppercase tracking-[0.1em] text-gold-bright">
                        {reason}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Everything the player has pulled out of the database, with lightweight links
 * to the records that share a person, a place or a moment. The links say what
 * is worth comparing; they never say what the comparison shows.
 */
export function NotebookDiscoveries() {
  const { discoveries } = useInvestigationSession();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [openKey, setOpenKey] = useState(null);

  const sources = useMemo(
    () => [...new Set(discoveries.map((record) => record.table))].sort(),
    [discoveries],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return discoveries.filter((record) => {
      if (source !== 'all' && record.table !== source) return false;
      if (term === '') return true;
      return `${record.title} ${record.table} ${record.location ?? ''} ${record.suspects.join(' ')}`.toLowerCase().includes(term);
    });
  }, [discoveries, search, source]);

  if (discoveries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <Telescope size={30} className="text-bone-dim" strokeWidth={1.8} aria-hidden="true" />
        <p className="font-display text-lg font-medium uppercase tracking-[0.16em] text-bone">Nothing discovered yet</p>
        <p className="max-w-sm typo-body text-base text-bone-muted">
          Every row a successful query returns is filed here, with the statement that recovered it.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search your discoveries</span>
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-dim" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search discoveries..."
          className="clip-corner-sm w-full border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter discoveries by source">
        {['all', ...sources].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSource(value)}
            aria-pressed={source === value}
            className={`clip-corner-sm border px-2.5 py-1.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors ${
              source === value
                ? 'border-gold/55 bg-gold/12 text-gold-bright'
                : 'border-white/10 bg-white/[0.03] text-bone-dim hover:border-white/25 hover:text-bone'
            }`}
          >
            {value === 'all' ? `All (${discoveries.length})` : value.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* A plain list on purpose: a layout-animated one inside a dialog keeps
          the dialog's exit animation from ever completing. */}
      <ul className="mt-4 space-y-2.5">
        {visible.map((record) => (
          <DiscoveryRow
            key={record.key}
            record={record}
            all={discoveries}
            isOpen={openKey === record.key}
            onToggle={(key) => setOpenKey(openKey === key ? null : key)}
          />
        ))}
        {visible.length === 0 && <li className="py-6 text-base text-bone-dim">No discoveries match that search.</li>}
      </ul>
    </div>
  );
}
