import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, BookOpen, Check, Search } from 'lucide-react';
import { ReusableModal } from './ReusableModal';

/**
 * The detective notebook. Leads from the case briefing become tickable
 * objectives with a progress bar; everything is local UI state so the
 * investigation itself is untouched.
 */
export function NotebookModal({ isOpen, onClose, leads = [] }) {
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(() => new Set());
  const [bookmarked, setBookmarked] = useState(() => new Set());
  const [search, setSearch] = useState('');

  const toggle = (setter) => (value) =>
    setter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const visible = useMemo(
    () => leads.filter((lead) => lead.toLowerCase().includes(search.toLowerCase())),
    [leads, search],
  );

  const progress = leads.length ? Math.round((done.size / leads.length) * 100) : 0;

  return (
    <ReusableModal isOpen={isOpen} onClose={onClose} title="Detective notebook" icon={BookOpen} size="lg">
      {/* Objective progress */}
      <div className="clip-corner-sm panel-surface-raised p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">Leads followed</p>
          <p className="font-mono text-sm text-gold-bright">{done.size} / {leads.length}</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden bg-white/10">
          <motion.span
            className="block h-full bg-gradient-to-r from-crimson to-gold"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      <label className="relative mt-5 block">
        <span className="sr-only">Search leads</span>
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-dim" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search leads..."
          className="clip-corner-sm w-full border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
        />
      </label>

      <ul className="mt-4 space-y-2.5">
        {visible.map((lead) => {
          const isDone = done.has(lead);
          const isSaved = bookmarked.has(lead);
          return (
            <li key={lead} className="clip-corner-sm flex items-start gap-3 border border-white/10 bg-white/[0.035] p-3.5">
              <button
                type="button"
                onClick={() => toggle(setDone)(lead)}
                aria-pressed={isDone}
                aria-label={isDone ? `Mark "${lead}" as not followed` : `Mark "${lead}" as followed`}
                className={`clip-corner-sm mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                  isDone ? 'border-verdict-clear bg-verdict-clear/20 text-verdict-clear' : 'border-white/25 text-transparent hover:border-gold/60'
                }`}
              >
                <Check size={13} strokeWidth={3} />
              </button>
              <p className={`flex-1 text-base leading-7 ${isDone ? 'text-bone-dim line-through' : 'text-bone-muted'}`}>{lead}</p>
              <button
                type="button"
                onClick={() => toggle(setBookmarked)(lead)}
                aria-pressed={isSaved}
                aria-label={isSaved ? `Remove bookmark from "${lead}"` : `Bookmark "${lead}"`}
                className={`shrink-0 p-1 transition-colors ${isSaved ? 'text-gold-bright' : 'text-bone-dim hover:text-gold-bright'}`}
              >
                <Bookmark size={16} strokeWidth={2.2} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </li>
          );
        })}
        {visible.length === 0 && <li className="py-4 text-base text-bone-dim">No leads match that search.</li>}
      </ul>

      <div className="mt-6">
        <p className="mb-2.5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-bone">Working theory</p>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Who cannot account for themselves, and what proves it?"
          className="clip-corner-sm min-h-40 w-full resize-y border border-white/10 bg-black/40 p-4 text-base leading-7 text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
        />
        <p className="mt-2 text-sm text-bone-dim">Notes stay in this browser session only.</p>
      </div>
    </ReusableModal>
  );
}
