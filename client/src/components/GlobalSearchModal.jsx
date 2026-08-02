import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { ReusableModal } from './ReusableModal';
import { searchInvestigation } from '../utils/globalSearch';
import { useInvestigationSession } from '../state/investigationSession';

/**
 * Global investigation search. Everything it can find is already visible
 * somewhere in the player's own file — it is a faster way in, not a new source.
 */
export function GlobalSearchModal({ isOpen, onClose, briefing, onOpenSection }) {
  const { discoveries, journal, timeline, intel, objectives, history, notes } = useInvestigationSession();
  const [term, setTerm] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    setTerm('');
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  // Only the leads folder still carries briefing text; every other folder is
  // built from discoveries now, and those are searched through `discoveries`.
  const briefingEntries = useMemo(
    () => briefing.notebook.flatMap((section) => section.entries),
    [briefing.notebook],
  );

  const results = useMemo(
    () => searchInvestigation(term, {
      discoveries, journal, timeline, intel, objectives, history,
      notebook: briefingEntries, notes,
    }),
    [term, discoveries, journal, timeline, intel, objectives, history, briefingEntries, notes],
  );

  return (
    <ReusableModal isOpen={isOpen} onClose={onClose} title="Search the investigation" icon={Search} size="lg">
      <label className="relative block">
        <span className="sr-only">Search everything you have gathered</span>
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-bone-dim" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search discoveries, timeline, journal, suspects, history..."
          className="clip-corner-sm w-full border border-white/10 bg-black/40 py-3.5 pl-11 pr-4 text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
        />
      </label>

      <p className="mt-3 text-sm text-bone-dim" role="status" aria-live="polite">
        {term.trim() === ''
          ? 'Searches everything you have gathered so far — nothing you have not found yet.'
          : `${results.total} ${results.total === 1 ? 'match' : 'matches'} across ${results.groups.length} ${results.groups.length === 1 ? 'area' : 'areas'}`}
      </p>

      {term.trim() !== '' && results.total === 0 && (
        <p className="py-10 text-center text-base text-bone-muted">Nothing in your file matches that.</p>
      )}

      <div className="mt-5 space-y-6">
        {results.groups.map((group) => (
          <section key={group.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-medium uppercase tracking-[0.16em] text-gold-bright">{group.label}</h3>
              {group.section && (
                <button
                  type="button"
                  onClick={() => onOpenSection(group.section)}
                  className="text-xs font-medium uppercase tracking-[0.12em] text-bone-dim transition-colors hover:text-gold-bright"
                >
                  Open section
                </button>
              )}
            </div>
            <ul className="mt-2.5 space-y-2">
              {group.items.map((item) => (
                <li key={`${group.id}:${item.id}`} className="clip-corner-sm border border-white/10 bg-white/[0.035] px-4 py-3">
                  <p className="typo-body text-base text-bone">{item.title}</p>
                  {item.detail && <p className="mt-1 typo-body-secondary text-sm text-bone-dim">{item.detail}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ReusableModal>
  );
}
