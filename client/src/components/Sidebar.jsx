import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, FolderOpen, MapPinned, MessagesSquare, Search, StickyNote, X } from 'lucide-react';
import { EvidenceCard } from './EvidenceCard';
import { TimelineBoard } from './TimelineBoard';
import { WitnessReport } from './WitnessReport';

const folderMeta = {
  evidence: { label: 'Evidence', icon: FolderOpen },
  witnesses: { label: 'Statements', icon: MessagesSquare },
  'crime-scene': { label: 'Scene', icon: MapPinned },
  timeline: { label: 'Timeline', icon: ClipboardList },
  notes: { label: 'Leads', icon: StickyNote },
};

function matches(value, term) {
  return !term || value.toLowerCase().includes(term.toLowerCase());
}

/**
 * The case board. Notebook sections become classified folders; the structured
 * evidence array renders as investigation cards inside the Evidence folder.
 */
export function Sidebar({ sections, evidence, activeFolder, onSelectFolder, isDrawerOpen, onClose }) {
  const [search, setSearch] = useState('');
  const section = sections.find((entry) => entry.id === activeFolder) ?? sections[0];

  const filteredEvidence = evidence.filter((item) => matches(`${item.title} ${item.category} ${item.description}`, search));
  const filteredEntries = (section?.entries ?? []).filter((entry) => matches(entry, search));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[21rem] flex-col bg-ink/97 p-4 shadow-panel backdrop-blur-xl transition-transform duration-300 xl:static xl:z-auto xl:w-[21rem] xl:shrink-0 xl:translate-x-0 xl:bg-transparent xl:py-5 xl:pl-5 xl:pr-0 xl:shadow-none ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="clip-corner flex min-h-0 flex-1 flex-col panel-surface xl:shadow-panel">
        <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4">
          <FolderOpen size={18} className="text-crimson-glow" strokeWidth={2} />
          <h2 className="font-display text-base font-semibold uppercase tracking-[0.18em] text-bone">Case board</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close case board"
            className="ml-auto p-1.5 text-bone-dim transition-colors hover:text-bone xl:hidden"
          >
            <X size={19} />
          </button>
        </header>

        {/* Folder tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/10 p-3">
          {sections.map((entry) => {
            const meta = folderMeta[entry.id] ?? { label: entry.title, icon: FolderOpen };
            const Icon = meta.icon;
            const isActive = entry.id === section?.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectFolder(entry.id)}
                aria-pressed={isActive}
                className={`clip-corner-sm inline-flex items-center gap-1.5 border px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                  isActive
                    ? 'border-gold/55 bg-gold/12 text-gold-bright'
                    : 'border-white/10 bg-white/[0.03] text-bone-dim hover:border-white/25 hover:text-bone'
                }`}
              >
                <Icon size={13} strokeWidth={2.2} /> {meta.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="border-b border-white/10 p-3">
          <label className="relative block">
            <span className="sr-only">Search the case board</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bone-dim" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this folder..."
              className="clip-corner-sm w-full border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={section?.id ?? 'empty'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {section?.id === 'evidence' && (
                <div className="space-y-3">
                  {filteredEvidence.map((item, index) => <EvidenceCard key={item.id} item={item} index={index} />)}
                  {filteredEvidence.length === 0 && <p className="px-1 py-6 text-sm text-bone-dim">No evidence matches that search.</p>}
                </div>
              )}

              {section?.id === 'witnesses' && <WitnessReport entries={filteredEntries} />}
              {section?.id === 'timeline' && <TimelineBoard entries={filteredEntries} />}

              {(section?.id === 'crime-scene' || section?.id === 'notes') && (
                <ul className="space-y-3">
                  {filteredEntries.map((entry) => (
                    <li key={entry} className="clip-corner-sm panel-surface-raised p-4 text-[0.9rem] leading-7 text-bone-muted">
                      {entry}
                    </li>
                  ))}
                  {filteredEntries.length === 0 && <li className="px-1 py-6 text-sm text-bone-dim">Nothing matches that search.</li>}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
