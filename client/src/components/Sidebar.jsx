import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, FileText, FolderOpen, MapPinned, MessagesSquare, Search, StickyNote, X } from 'lucide-react';
import { DiscoveredRecord } from './DiscoveredRecord';
import { boardFolderForTable } from '../utils/investigationCategories';
import { useInvestigationSession } from '../state/investigationSession';

const folderMeta = {
  evidence: { label: 'Evidence', icon: FolderOpen },
  witnesses: { label: 'Statements', icon: MessagesSquare },
  'crime-scene': { label: 'Scene', icon: MapPinned },
  timeline: { label: 'Timeline', icon: ClipboardList },
  documents: { label: 'Documents', icon: FileText },
  notes: { label: 'Leads', icon: StickyNote },
};

function matches(value, term) {
  return term === '' || value.toLowerCase().includes(term);
}

/** Everything a discovery holds is searchable, including the columns it carries. */
const searchText = (record) =>
  `${record.title} ${record.table} ${record.location ?? ''} ${record.occurredAt ?? ''} ${record.suspects.join(' ')} ${Object.values(record.fields ?? {}).join(' ')}`;

/**
 * The case board.
 *
 * Every folder except Leads fills from the player's own discoveries. Nothing
 * is here because the briefing handed it over — the folders start empty and a
 * record appears the moment a query returns it, which is what makes SQL the
 * way the case is read rather than a lock on the accuse button.
 *
 * Leads is the one exception, and deliberately so: it holds the official
 * briefing the detective was given before the investigation started.
 */
export function Sidebar({ sections, activeFolder, onSelectFolder, isDrawerOpen, onClose }) {
  const { expanded, toggleExpanded, discoveries, categories } = useInvestigationSession();
  const [search, setSearch] = useState('');

  const section = sections.find((entry) => entry.id === activeFolder) ?? sections[0];
  const sectionId = section?.id;

  // A search term belongs to the folder it was typed in.
  useEffect(() => { setSearch(''); }, [sectionId]);

  const term = search.trim().toLowerCase();

  // Discoveries filed under each folder, newest first.
  const byFolder = useMemo(() => {
    const grouped = {};
    for (const record of discoveries) {
      const folder = boardFolderForTable(record.table);
      (grouped[folder] ??= []).push(record);
    }
    return grouped;
  }, [discoveries]);

  const folderRecords = useMemo(
    () => (byFolder[sectionId] ?? []).filter((record) => matches(searchText(record), term)),
    [byFolder, sectionId, term],
  );

  const filteredEntries = useMemo(
    () => (section?.entries ?? []).filter((entry) => matches(entry, term)),
    [section, term],
  );

  // The category behind this folder, for the recovered/total line.
  const progress = useMemo(
    () => categories.find((category) => category.board === sectionId) ?? null,
    [categories, sectionId],
  );

  const toggleRecord = useCallback((key) => toggleExpanded(`board:${key}`), [toggleExpanded]);

  // Arrow keys walk the folder tabs.
  const handleTabKeys = useCallback((event) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = sections.findIndex((entry) => entry.id === sectionId);
    const next = sections[(index + step + sections.length) % sections.length];
    onSelectFolder(next.id);
    event.currentTarget.querySelector(`#board-tab-${next.id}`)?.focus();
  }, [sections, sectionId, onSelectFolder]);

  const isLeads = sectionId === 'notes';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[21rem] flex-col bg-ink/97 p-4 shadow-panel backdrop-blur-xl transition-transform duration-300 xl:static xl:z-auto xl:w-[21rem] xl:shrink-0 xl:translate-x-0 xl:bg-transparent xl:py-5 xl:pl-5 xl:pr-0 xl:shadow-none ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="clip-corner flex min-h-0 flex-1 flex-col panel-surface xl:shadow-panel">
        <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4">
          <FolderOpen size={18} className="text-crimson-glow" strokeWidth={2} aria-hidden="true" />
          <h2 className="font-display text-base font-medium uppercase tracking-[0.18em] text-bone">Case board</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close case board"
            className="ml-auto p-1.5 text-bone-dim transition-colors hover:text-bone xl:hidden"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        {/* Folder tabs */}
        <div role="tablist" aria-label="Case board folders" onKeyDown={handleTabKeys} className="flex flex-wrap gap-1.5 border-b border-white/10 p-3">
          {sections.map((entry) => {
            const meta = folderMeta[entry.id] ?? { label: entry.title, icon: FolderOpen };
            const Icon = meta.icon;
            const isActive = entry.id === sectionId;
            const count = entry.id === 'notes' ? 0 : (byFolder[entry.id]?.length ?? 0);
            return (
              <button
                key={entry.id}
                id={`board-tab-${entry.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="board-panel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectFolder(entry.id)}
                className={`clip-corner-sm inline-flex items-center gap-1.5 border px-2.5 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-colors ${
                  isActive
                    ? 'border-gold/55 bg-gold/12 text-gold-bright'
                    : 'border-white/10 bg-white/[0.03] text-bone-dim hover:border-white/25 hover:text-bone'
                }`}
              >
                <Icon size={13} strokeWidth={2.2} aria-hidden="true" /> {meta.label}
                {count > 0 && <span className="font-mono text-xs text-bone-muted">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Recovered / total for the open folder */}
        {progress && (
          <div className="border-b border-white/10 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-bone-dim">Recovered</p>
              <p className="font-mono text-xs text-gold-bright">
                {progress.recovered} / {progress.total}
              </p>
            </div>
            <div aria-hidden="true" className="mt-2 h-1 w-full overflow-hidden bg-white/10">
              <span
                className={`block h-full transition-[width] duration-500 ${progress.isComplete ? 'bg-verdict-clear' : 'bg-gold'}`}
                style={{ width: `${Math.round((progress.recovered / Math.max(1, progress.total)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Search */}
        <div className="border-b border-white/10 p-3">
          <label className="relative block">
            <span className="sr-only">Search the case board</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bone-dim" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this folder..."
              className="clip-corner-sm w-full border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
            />
          </label>
        </div>

        <div id="board-panel" role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={sectionId ?? 'empty'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {isLeads ? (
                <ul className="space-y-3">
                  {filteredEntries.map((entry) => (
                    <li key={entry} className="clip-corner-sm panel-surface-raised p-4 typo-document text-[0.9rem] text-bone-muted">
                      {entry}
                    </li>
                  ))}
                  {filteredEntries.length === 0 && <li className="px-1 py-6 text-sm text-bone-dim">Nothing matches that search.</li>}
                </ul>
              ) : (
                <ul className="space-y-2.5">
                  {folderRecords.map((record) => (
                    <DiscoveredRecord
                      key={record.key}
                      record={record}
                      isOpen={Boolean(expanded[`board:${record.key}`])}
                      onToggle={toggleRecord}
                    />
                  ))}

                  {folderRecords.length === 0 && (
                    <li className="px-1 py-8 text-center">
                      <p className="typo-body text-sm text-bone-muted">
                        {term === '' ? (progress?.empty ?? 'Nothing recovered yet.') : 'Nothing in this folder matches that search.'}
                      </p>
                      {term === '' && progress && (
                        <p className="mt-2 typo-body-secondary text-xs text-bone-dim">
                          {progress.total} {progress.total === 1 ? 'record is' : 'records are'} on file in the database. Query for them.
                        </p>
                      )}
                    </li>
                  )}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
