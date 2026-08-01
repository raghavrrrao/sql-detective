import { memo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, DatabaseZap, FileSearch, Lightbulb, Search } from 'lucide-react';
import { caseTables } from '../utils/sqlInsights';

/** Only the first rows animate in; a large result set must not stagger 500 elements. */
const ANIMATED_ROW_LIMIT = 30;

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

/**
 * Turns the server's SQL error into a next step. Purely presentational — the
 * server's own message is always shown above this line.
 */
function hintFor(message = '') {
  const text = message.toLowerCase();
  if (text.includes('no such table')) return `Check the table name. This case holds ${caseTables.slice(0, -1).join(', ')} and ${caseTables.at(-1)}.`;
  if (text.includes('no such column')) return 'That column is not on this table. Run SELECT * on the table first to see what it actually holds.';
  if (text.includes('read-only') || text.includes('blocked')) return 'The evidence database is sealed. You can read it with SELECT, but nothing can be changed.';
  if (text.includes('syntax error') || text.includes('start with select')) return 'Check for a missing comma, quote or keyword. Every query begins with SELECT or WITH.';
  if (text.includes('one sql statement')) return 'Run one query at a time — delete anything after the first semicolon.';
  if (text.includes('cannot reach')) return 'The investigation server needs to be running before queries can be sent.';
  return null;
}

const Row = memo(function Row({ row, columns, index }) {
  const cells = columns.map((column) => (
    <td key={column} className={`px-5 py-3.5 align-top leading-6 text-bone-muted ${cellClass(row[column])}`}>
      {renderCell(row[column])}
    </td>
  ));

  if (index >= ANIMATED_ROW_LIMIT) {
    return <tr className="border-b border-white/[0.06] transition-colors hover:bg-gold/[0.05]">{cells}</tr>;
  }

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.3) }}
      className="border-b border-white/[0.06] transition-colors hover:bg-gold/[0.05]"
    >
      {cells}
    </motion.tr>
  );
});

function QueryResultsTableComponent({ columns = [], rows = [], isLoading = false, error = null, rowCount = 0, hasRun = false, summary = null }) {
  const isEmpty = !isLoading && !error && rows.length === 0;
  const hint = error ? hintFor(error) : null;

  // `summary` names what was actually recovered ("Recovered 8 witness
  // statements") and is built from the tables the statement referenced.
  const statusLine = isLoading
    ? 'Searching database…'
    : error
      ? 'Query rejected.'
      : !hasRun
        ? 'Awaiting your first query.'
        : summary ?? (rows.length === 0 ? 'No matching records found.' : `Recovered ${rowCount} ${rowCount === 1 ? 'record' : 'records'}.`);

  return (
    <section className="clip-corner flex min-h-[18rem] flex-col overflow-hidden panel-surface shadow-panel backdrop-blur-xl">
      <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <DatabaseZap size={18} className="text-crimson-glow" strokeWidth={2} aria-hidden="true" />
        <h2 className="font-display text-base font-medium uppercase tracking-[0.18em] text-bone">Recovered records</h2>
        {!isLoading && !error && rowCount > 0 && (
          <span className="clip-corner-sm ml-auto border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-xs font-medium text-gold-bright">
            {rowCount} {rowCount === 1 ? 'row' : 'rows'}
          </span>
        )}
      </header>

      {/*
        No AnimatePresence here on purpose. A local SQLite query returns in a
        couple of milliseconds, so the panel can go empty → loading → rows
        inside a single frame; a "wait" mode presence would still be playing the
        previous exit and leave the panel blank under a footer that already
        reads "Recovered 5 records". Each state animates in on its own instead.
      */}
      <div className="relative min-h-0 flex-1">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex min-h-[16rem] flex-col items-center justify-center gap-4 overflow-hidden"
          >
            <div aria-hidden="true" className="absolute inset-0 scanlines opacity-40" />
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-16 animate-scan bg-gradient-to-b from-crimson/25 to-transparent" />
            <Search size={30} className="relative text-crimson-glow" strokeWidth={1.8} aria-hidden="true" />
            <p className="relative font-display text-lg font-medium uppercase tracking-[0.2em] text-bone">Searching database…</p>
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
            className="flex min-h-[16rem] flex-col items-center justify-center gap-3 px-8 py-6 text-center"
          >
            <AlertTriangle size={30} className="text-verdict-alert" strokeWidth={1.9} aria-hidden="true" />
            <p className="font-display text-lg font-medium uppercase tracking-[0.16em] text-bone">Query rejected</p>
            <p className="max-w-lg typo-body text-base text-bone-muted">{error}</p>
            {hint && (
              <p className="clip-corner-sm mt-1 flex max-w-lg items-start gap-2.5 border border-gold/30 bg-gold/[0.07] p-3.5 text-left typo-body-secondary text-sm text-bone-muted">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-gold-bright" strokeWidth={2} aria-hidden="true" />
                {hint}
              </p>
            )}
          </motion.div>
        )}

        {isEmpty && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-[16rem] flex-col items-center justify-center gap-3 px-8 text-center"
          >
            <FileSearch size={30} className="text-bone-dim" strokeWidth={1.8} aria-hidden="true" />
            <p className="font-display text-lg font-medium uppercase tracking-[0.16em] text-bone">
              {hasRun ? (summary ?? 'No matching records found') : 'The terminal is ready'}
            </p>
            <p className="max-w-md typo-body text-base text-bone-muted">
              {hasRun
                ? 'The database answered, but nothing matched. Widen your filter or check the table name.'
                : 'Run a query to pull records out of the evidence database. Start with SELECT * FROM suspects;'}
            </p>
          </motion.div>
        )}

        {!isLoading && !error && !isEmpty && (
          <motion.div
            key="rows"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="max-h-[26rem] overflow-auto"
          >
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{statusLine}</caption>
              <thead className="sticky top-0 z-10 bg-charcoal/95 backdrop-blur">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="whitespace-nowrap border-b border-gold/25 px-5 py-3.5 font-display text-xs font-medium uppercase tracking-[0.16em] text-gold-bright"
                    >
                      {formatHeader(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Result sets can repeat ids across a JOIN, so position is the only stable key. */}
                {rows.map((row, index) => <Row key={index} row={row} columns={columns} index={index} />)}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/30 px-5 py-3 font-mono text-xs text-bone-dim">
        <span role="status" aria-live="polite" className={error ? 'text-verdict-alert' : rows.length > 0 ? 'text-verdict-clear' : undefined}>
          {statusLine}
        </span>
        <span className="hidden sm:inline">investigation_db · read-only</span>
      </footer>
    </section>
  );
}

export const QueryResultsTable = memo(QueryResultsTableComponent);
