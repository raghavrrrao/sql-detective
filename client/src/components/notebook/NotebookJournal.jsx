import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, ClipboardCheck, FolderOpen, Search, ShieldCheck, Target, UserPlus } from 'lucide-react';
import { useInvestigationSession } from '../../state/investigationSession';

const kinds = {
  discovery: { icon: BookMarked, tone: 'text-gold-bright', ring: 'border-gold/35 bg-gold-deep/20' },
  source: { icon: FolderOpen, tone: 'text-sky-300', ring: 'border-sky-400/30 bg-sky-500/10' },
  objective: { icon: ClipboardCheck, tone: 'text-verdict-clear', ring: 'border-verdict-clear/35 bg-verdict-clear/10' },
  suspect: { icon: UserPlus, tone: 'text-violet-300', ring: 'border-violet-400/30 bg-violet-500/10' },
  prime: { icon: Target, tone: 'text-crimson-glow', ring: 'border-crimson/40 bg-crimson-deep/25' },
  cleared: { icon: ShieldCheck, tone: 'text-verdict-clear', ring: 'border-verdict-clear/35 bg-verdict-clear/10' },
};

const fallback = { icon: BookMarked, tone: 'text-bone-muted', ring: 'border-white/15 bg-white/[0.05]' };

function formatStamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * The investigation journal: a running account of what the player did and what
 * it turned up, newest first. Written only when something was actually found.
 */
export function NotebookJournal() {
  const { journal } = useInvestigationSession();
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === '') return journal;
    return journal.filter((entry) => `${entry.title} ${entry.detail ?? ''}`.toLowerCase().includes(term));
  }, [journal, search]);

  if (journal.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <BookMarked size={30} className="text-bone-dim" strokeWidth={1.8} aria-hidden="true" />
        <p className="font-display text-lg font-medium uppercase tracking-[0.16em] text-bone">The journal is empty</p>
        <p className="max-w-sm typo-body text-base text-bone-muted">
          Every record you recover, every source you open and every objective you finish is written up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search the journal</span>
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-dim" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search the journal..."
          className="clip-corner-sm w-full border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
        />
      </label>

      <p className="mt-3 text-sm text-bone-dim">
        {journal.length} {journal.length === 1 ? 'entry' : 'entries'} · newest first
      </p>

      <ol className="mt-4 space-y-2.5">
        {visible.map((entry, index) => {
          const style = kinds[entry.type] ?? fallback;
          const Icon = style.icon;
          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.25) }}
              className="clip-corner-sm flex items-start gap-3 border border-white/10 bg-white/[0.035] p-3.5"
            >
              <span className={`clip-corner-sm mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border ${style.ring}`}>
                <Icon size={16} className={style.tone} strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="typo-document text-base text-bone">{entry.title}</p>
                {entry.detail && (
                  <pre className="mt-1.5 overflow-x-auto font-mono text-xs leading-6 text-bone-dim">{entry.detail}</pre>
                )}
              </div>
              <span className="shrink-0 font-mono text-xs text-bone-dim">{formatStamp(entry.at)}</span>
            </motion.li>
          );
        })}
        {visible.length === 0 && <li className="py-6 text-base text-bone-dim">No journal entries match that search.</li>}
      </ol>
    </div>
  );
}
