import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, DatabaseZap, FileSearch, Search } from 'lucide-react';

function formatHeader(column) {
  return column.replace(/_/g, ' ');
}

function renderCell(value) {
  if (value === null || value === undefined) return <span className="text-bone-dim">null</span>;
  return String(value);
}

/** Cells stay readable: long prose wraps, short values stay on one line. */
function cellClass(value) {
  return String(value ?? '').length > 60 ? 'min-w-[22rem] max-w-[34rem] whitespace-normal' : 'whitespace-nowrap';
}

export function QueryResultsTable({ columns = [], rows = [], isLoading = false, error = null, executionTime = null, rowCount = 0 }) {
  const isEmpty = !isLoading && !error && rows.length === 0;

  return (
    <section className="clip-corner flex min-h-[18rem] flex-col overflow-hidden panel-surface shadow-panel backdrop-blur-xl">
      <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <DatabaseZap size={18} className="text-crimson-glow" strokeWidth={2} />
        <h2 className="font-display text-base font-semibold uppercase tracking-[0.18em] text-bone">Recovered records</h2>
        {!isLoading && rowCount > 0 && (
          <span className="clip-corner-sm ml-auto border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-xs font-semibold text-gold-bright">
            {rowCount} {rowCount === 1 ? 'row' : 'rows'}
          </span>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex min-h-[16rem] flex-col items-center justify-center gap-4 overflow-hidden"
            >
              <div aria-hidden="true" className="absolute inset-0 scanlines opacity-40" />
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-16 animate-scan bg-gradient-to-b from-crimson/25 to-transparent" />
              <Search size={30} className="relative text-crimson-glow" strokeWidth={1.8} />
              <p className="relative font-display text-lg font-semibold uppercase tracking-[0.2em] text-bone">Searching records…</p>
              <div className="relative h-1 w-52 overflow-hidden bg-white/10">
                <span className="block h-full w-1/3 animate-sweep bg-crimson-bright" />
              </div>
            </motion.div>
          )}

          {!isLoading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[16rem] flex-col items-center justify-center gap-3 px-8 text-center"
            >
              <AlertTriangle size={30} className="text-verdict-alert" strokeWidth={1.9} />
              <p className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-bone">Query rejected</p>
              <p className="max-w-lg text-base leading-7 text-bone-muted">{error}</p>
            </motion.div>
          )}

          {isEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[16rem] flex-col items-center justify-center gap-3 px-8 text-center"
            >
              <FileSearch size={30} className="text-bone-dim" strokeWidth={1.8} />
              <p className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-bone">No records recovered</p>
              <p className="max-w-md text-base leading-7 text-bone-muted">
                The database answered, but nothing matched. Widen your filter or check the table name.
              </p>
            </motion.div>
          )}

          {!isLoading && !error && !isEmpty && (
            <motion.div
              key="rows"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="max-h-[26rem] overflow-auto"
            >
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-charcoal/95 backdrop-blur">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap border-b border-gold/25 px-5 py-3.5 font-display text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright"
                      >
                        {formatHeader(column)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    // Result sets can repeat ids across a JOIN, so position is the only stable key.
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.3) }}
                      className="border-b border-white/[0.06] transition-colors hover:bg-gold/[0.05]"
                    >
                      {columns.map((column) => (
                        <td key={column} className={`px-5 py-3.5 align-top leading-6 text-bone-muted ${cellClass(row[column])}`}>
                          {renderCell(row[column])}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/30 px-5 py-3 font-mono text-xs text-bone-dim">
        <span>{executionTime === null ? 'Awaiting a query' : `${rowCount} ${rowCount === 1 ? 'row' : 'rows'} recovered in ${executionTime} ms`}</span>
        <span className="hidden sm:inline">investigation_db · read-only</span>
      </footer>
    </section>
  );
}
