import { useMemo, useState } from 'react';
import { Bookmark, ChevronDown, FileSearch, Search } from 'lucide-react';
import { useDebouncedField } from '../../hooks/useDebouncedField';
import { investigationCategories } from '../../utils/investigationCategories';
import { useInvestigationSession } from '../../state/investigationSession';

/** The tables whose rows belong in the case-file tab. */
const EVIDENCE_TABLES = investigationCategories.find((category) => category.id === 'evidence').tables;

const HIDDEN_COLUMNS = new Set(['id']);
const label = (column) => column.replace(/_/g, ' ');

function EvidenceNote({ record }) {
  const { evidenceNotes, setEvidenceNote, bookmarks, toggleBookmark, expanded, toggleExpanded } = useInvestigationSession();
  const key = `evidence:${record.key}`;
  const isOpen = Boolean(expanded[key]);
  const isSaved = bookmarks.includes(key);

  const [note, setNote, flushNote] = useDebouncedField(evidenceNotes[key] ?? '', (value) => setEvidenceNote(key, value));

  const fields = Object.entries(record.fields ?? {}).filter(
    ([column, value]) => !HIDDEN_COLUMNS.has(column) && value !== null && value !== undefined && String(value).trim() !== '',
  );

  return (
    <li className="clip-corner-sm border border-white/10 bg-white/[0.035]">
      <div className="flex items-start gap-2 p-3.5">
        <button
          type="button"
          onClick={() => toggleExpanded(key)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <ChevronDown
            size={17}
            aria-hidden="true"
            className={`mt-1 shrink-0 text-bone-dim transition-transform duration-200 ${isOpen ? 'rotate-180 text-gold-bright' : ''}`}
          />
          <span className="min-w-0 flex-1">
            <span className="block typo-document text-base text-bone">{record.title}</span>
            <span className="mt-1 flex flex-wrap items-center gap-2">
              <span className="clip-corner-sm border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-bone-muted">
                {record.table.replace(/_/g, ' ')}
              </span>
              {note.trim() !== '' && (
                <span className="clip-corner-sm border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs font-medium uppercase tracking-[0.12em] text-gold-bright">
                  Noted
                </span>
              )}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleBookmark(key)}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove bookmark from ${record.title}` : `Bookmark ${record.title}`}
          className={`shrink-0 p-1.5 transition-colors ${isSaved ? 'text-gold-bright' : 'text-bone-dim hover:text-gold-bright'}`}
        >
          <Bookmark size={17} strokeWidth={2.2} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 p-4">
          {fields.length === 0 ? (
            <p className="typo-body-secondary text-sm text-bone-dim">
              You recovered this exhibit without its detail. A wider SELECT on the same table will fill it in.
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

          <label className="mt-4 block">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-bone-dim">Your note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onBlur={flushNote}
              rows={3}
              placeholder="What does this exhibit prove, and who does it point at?"
              className="clip-corner-sm mt-2 w-full resize-y border border-white/10 bg-black/40 p-3.5 typo-body-secondary text-sm text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
            />
          </label>
        </div>
      )}
    </li>
  );
}

/**
 * The case file: physical and forensic exhibits the player has recovered,
 * annotatable and bookmarkable.
 *
 * This tab used to be handed the whole evidence table by the briefing, which
 * meant the exhibits could be read before a single query had run. It now shows
 * only what has actually been pulled out of the database.
 */
export function NotebookEvidenceNotes() {
  const { discoveries, bookmarks, evidenceNotes, categories } = useInvestigationSession();
  const [search, setSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);

  const recovered = useMemo(
    () => discoveries.filter((record) => EVIDENCE_TABLES.includes(record.table)),
    [discoveries],
  );

  const progress = categories.find((category) => category.id === 'evidence') ?? null;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return recovered.filter((record) => {
      if (savedOnly && !bookmarks.includes(`evidence:${record.key}`)) return false;
      if (term === '') return true;
      const note = evidenceNotes[`evidence:${record.key}`] ?? '';
      const columns = Object.values(record.fields ?? {}).join(' ');
      return `${record.title} ${record.table} ${columns} ${note}`.toLowerCase().includes(term);
    });
  }, [recovered, search, savedOnly, bookmarks, evidenceNotes]);

  const bookmarkCount = bookmarks.filter((key) => key.startsWith('evidence:')).length;

  if (recovered.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <FileSearch size={30} className="text-bone-dim" strokeWidth={1.8} aria-hidden="true" />
        <p className="font-display text-lg font-medium uppercase tracking-[0.16em] text-bone">No physical evidence recovered</p>
        <p className="max-w-sm typo-body text-base text-bone-muted">
          {progress
            ? `The database holds ${progress.total} ${progress.total === 1 ? 'exhibit' : 'exhibits'} across evidence, weapons and fingerprints. Query one of them and it is filed here.`
            : 'Query the evidence table and every exhibit you recover is filed here.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {progress && (
        <p className="mb-4 typo-body-secondary text-sm text-bone-dim">
          {progress.recovered} of {progress.total} exhibits recovered.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 sm:min-w-[12rem]">
          <span className="sr-only">Search evidence notes</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-dim" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search exhibits and notes..."
            className="clip-corner-sm w-full border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
          />
        </label>

        <button
          type="button"
          onClick={() => setSavedOnly((value) => !value)}
          aria-pressed={savedOnly}
          className={`clip-corner-sm inline-flex items-center gap-2 border px-3.5 py-3 text-sm font-medium transition-colors ${
            savedOnly ? 'border-gold/55 bg-gold/12 text-gold-bright' : 'border-white/12 bg-white/[0.04] text-bone-muted hover:border-gold/40 hover:text-gold-bright'
          }`}
        >
          <Bookmark size={15} strokeWidth={2.2} fill={savedOnly ? 'currentColor' : 'none'} aria-hidden="true" />
          Bookmarked ({bookmarkCount})
        </button>
      </div>

      <ul className="mt-4 space-y-2.5">
        {visible.map((record) => <EvidenceNote key={record.key} record={record} />)}
        {visible.length === 0 && (
          <li className="py-6 text-base text-bone-dim">
            {savedOnly && bookmarkCount === 0 ? 'You have not bookmarked any exhibits yet.' : 'No exhibits match that search.'}
          </li>
        )}
      </ul>
    </div>
  );
}
