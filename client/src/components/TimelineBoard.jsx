import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

/** Timeline entries arrive as "2026-10-14 22:13:00: details" strings. */
function splitEntry(entry) {
  const separator = entry.indexOf(': ');
  if (separator === -1) return { stamp: null, text: entry };
  const stamp = entry.slice(0, separator);
  const [, time] = stamp.split(' ');
  return { stamp: time ? time.slice(0, 5) : stamp, text: entry.slice(separator + 2) };
}

function TimelineBoardComponent({ entries }) {
  if (entries.length === 0) return <p className="px-4 py-6 text-sm text-bone-dim">No chronology recorded.</p>;

  return (
    <ol className="relative space-y-3 pl-7">
      <span aria-hidden="true" className="absolute bottom-2 left-[0.6rem] top-2 w-px bg-gradient-to-b from-crimson/60 via-crimson/25 to-transparent" />
      {entries.map((entry, index) => {
        const { stamp, text } = splitEntry(entry);
        return (
          <motion.li
            key={entry}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, delay: Math.min(index * 0.06, 0.4) }}
            className="clip-corner-sm relative panel-surface-raised p-4"
          >
            <span aria-hidden="true" className="absolute -left-[1.32rem] top-5 h-2.5 w-2.5 rounded-full border-2 border-crimson-bright bg-ink" />
            {stamp && (
              <span className="flex items-center gap-1.5 font-mono text-sm font-semibold tracking-wide text-gold-bright">
                <Clock size={13} strokeWidth={2.4} /> {stamp}
              </span>
            )}
            <p className="mt-2 text-[0.9rem] leading-7 text-bone-muted">{text}</p>
          </motion.li>
        );
      })}
    </ol>
  );
}

export const TimelineBoard = memo(TimelineBoardComponent);
