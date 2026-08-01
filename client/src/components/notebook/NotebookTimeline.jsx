import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Search, UserRound } from 'lucide-react';
import { useInvestigationSession } from '../../state/investigationSession';

/**
 * Timeline reconstruction. Every entry here is a dated record the player pulled
 * out of the database — the chronology only exists to the extent it has been
 * uncovered, and gaps are gaps in the investigation, not hints.
 */
export function NotebookTimeline() {
  const { timeline } = useInvestigationSession();
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === '') return timeline;
    return timeline.filter((event) =>
      `${event.clock} ${event.title} ${event.location ?? ''} ${event.suspects.join(' ')}`.toLowerCase().includes(term));
  }, [timeline, search]);

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <Clock size={30} className="text-bone-dim" strokeWidth={1.8} aria-hidden="true" />
        <p className="font-display text-lg font-medium uppercase tracking-[0.16em] text-bone">No chronology yet</p>
        <p className="max-w-sm typo-body text-base text-bone-muted">
          Recover records that carry a time — cameras, badges, calls, security events — and they assemble here in order.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search the timeline</span>
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-dim" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by time, place or person..."
          className="clip-corner-sm w-full border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
        />
      </label>

      <p className="mt-3 text-sm text-bone-dim">
        {timeline.length} {timeline.length === 1 ? 'event' : 'events'} reconstructed · earliest first
      </p>

      <ol className="relative mt-4 space-y-3 pl-7">
        <span aria-hidden="true" className="absolute bottom-2 left-[0.6rem] top-2 w-px bg-gradient-to-b from-crimson/60 via-crimson/25 to-transparent" />
        {visible.map((event, index) => (
          <motion.li
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
            className="clip-corner-sm relative panel-surface-raised p-4"
          >
            <span aria-hidden="true" className="absolute -left-[1.32rem] top-5 h-2.5 w-2.5 rounded-full border-2 border-crimson-bright bg-ink" />

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 font-mono text-sm font-medium tracking-wide text-gold-bright">
                <Clock size={13} strokeWidth={2.4} aria-hidden="true" /> {event.clock}
              </span>
              <span className="clip-corner-sm border border-white/12 bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-bone-muted">
                {event.source.replace(/_/g, ' ')}
              </span>
              <span className="clip-corner-sm border border-white/12 bg-white/[0.04] px-2 py-0.5 text-xs font-medium uppercase tracking-[0.12em] text-bone-dim">
                {event.confidence}
              </span>
            </div>

            <p className="mt-2 typo-document text-[0.95rem] text-bone">{event.title}</p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-bone-dim">
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {event.location}
                </span>
              )}
              {event.suspects.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <UserRound size={12} strokeWidth={2.2} aria-hidden="true" /> {event.suspects.join(', ')}
                </span>
              )}
            </div>
          </motion.li>
        ))}
        {visible.length === 0 && <li className="py-6 text-base text-bone-dim">No events match that search.</li>}
      </ol>
    </div>
  );
}
