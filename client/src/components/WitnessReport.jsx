import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

/** Witness entries arrive as "Name: “statement”" strings. */
function splitEntry(entry) {
  const separator = entry.indexOf(': ');
  if (separator === -1) return { name: 'Statement', text: entry };
  return { name: entry.slice(0, separator), text: entry.slice(separator + 2) };
}

function initialsOf(name) {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function WitnessReport({ entries }) {
  if (entries.length === 0) return <p className="px-4 py-6 text-sm text-bone-dim">No statements on file.</p>;

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const { name, text } = splitEntry(entry);
        return (
          <motion.article
            key={entry}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: Math.min(index * 0.06, 0.4) }}
            className="clip-corner-sm dossier-surface p-4"
          >
            <header className="flex items-center gap-3 border-b border-gold/15 pb-3">
              <span className="clip-corner-sm flex h-9 w-9 shrink-0 items-center justify-center border border-gold/30 bg-gold-deep/25 font-display text-sm font-semibold text-gold-bright">
                {initialsOf(name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.9rem] font-semibold text-bone">{name}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-bone-dim">Interview record</p>
              </div>
            </header>
            <div className="mt-3 flex gap-2.5">
              <Quote size={15} className="mt-1 shrink-0 text-gold/60" strokeWidth={2} />
              <p className="text-[0.9rem] leading-7 text-bone-muted">{text}</p>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
