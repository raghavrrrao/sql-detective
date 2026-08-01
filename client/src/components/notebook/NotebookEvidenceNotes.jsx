import { useMemo, useState } from 'react';
import { Bookmark, ChevronDown, Search } from 'lucide-react';
import { useDebouncedField } from '../../hooks/useDebouncedField';
import { useInvestigationSession } from '../../state/investigationSession';

function EvidenceNote({ item }) {
  const { evidenceNotes, setEvidenceNote, bookmarks, toggleBookmark, expanded, toggleExpanded } = useInvestigationSession();
  const key = `evidence:${item.id}`;
  const isOpen = Boolean(expanded[key]);
  const isSaved = bookmarks.includes(key);

  const [note, setNote, flushNote] = useDebouncedField(evidenceNotes[key] ?? '', (value) => setEvidenceNote(key, value));

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
            <span className="block typo-body text-base font-medium text-bone">{item.title}</span>
            <span className="mt-1 flex flex-wrap items-center gap-2">
              <span className="clip-corner-sm border border-white/12 bg-white/[0.05] px-2 py-0.5 text-xs font-medium uppercase tracking-[0.12em] text-bone-muted">
                {item.category}
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
          aria-label={isSaved ? `Remove bookmark from ${item.title}` : `Bookmark ${item.title}`}
          className={`shrink-0 p-1.5 transition-colors ${isSaved ? 'text-gold-bright' : 'text-bone-dim hover:text-gold-bright'}`}
        >
          <Bookmark size={17} strokeWidth={2.2} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 p-4">
          <p className="typo-body-secondary text-sm text-bone-muted">{item.description}</p>
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

/** Evidence Notes: the case exhibits, annotatable and bookmarkable. */
export function NotebookEvidenceNotes({ evidence }) {
  const { bookmarks, evidenceNotes } = useInvestigationSession();
  const [search, setSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return evidence.filter((item) => {
      if (savedOnly && !bookmarks.includes(`evidence:${item.id}`)) return false;
      if (term === '') return true;
      const note = evidenceNotes[`evidence:${item.id}`] ?? '';
      return `${item.title} ${item.category} ${item.description} ${note}`.toLowerCase().includes(term);
    });
  }, [evidence, search, savedOnly, bookmarks, evidenceNotes]);

  const bookmarkCount = bookmarks.filter((key) => key.startsWith('evidence:')).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[12rem] flex-1">
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
        {visible.map((item) => <EvidenceNote key={item.id} item={item} />)}
        {visible.length === 0 && (
          <li className="py-6 text-base text-bone-dim">
            {savedOnly && bookmarkCount === 0 ? 'You have not bookmarked any exhibits yet.' : 'No exhibits match that search.'}
          </li>
        )}
      </ul>
    </div>
  );
}
