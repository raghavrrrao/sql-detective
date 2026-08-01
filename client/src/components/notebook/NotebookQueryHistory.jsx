import { useCallback, useMemo, useState } from 'react';
import { Check, Copy, History, Play, Search, Trash2 } from 'lucide-react';
import { copyText } from '../../utils/clipboard';
import { useInvestigationSession } from '../../state/investigationSession';

function formatStamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function HistoryEntry({ entry, onRerun }) {
  const { deleteHistoryEntry } = useInvestigationSession();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyText(entry.sql);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [entry.sql]);

  return (
    <li className={`clip-corner-sm border bg-white/[0.035] ${entry.ok ? 'border-white/10' : 'border-verdict-alert/35'}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span
          className={`clip-corner-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] ${
            entry.ok ? 'border-verdict-clear/45 bg-verdict-clear/10 text-verdict-clear' : 'border-verdict-alert/50 bg-verdict-alert/10 text-verdict-alert'
          }`}
        >
          {entry.ok ? `${entry.rowCount} ${entry.rowCount === 1 ? 'row' : 'rows'}` : 'Rejected'}
        </span>
        <span className="font-mono text-xs text-bone-dim">{formatStamp(entry.at)}</span>
        {entry.ok && entry.executionTime !== null && (
          <span className="font-mono text-xs text-bone-dim">{entry.executionTime} ms</span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRerun(entry.sql)}
            aria-label="Run this query again"
            title="Run again"
            className="clip-corner-sm p-1.5 text-bone-dim transition-colors hover:text-verdict-clear"
          >
            <Play size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Query copied' : 'Copy this query'}
            title={copied ? 'Copied' : 'Copy'}
            className={`clip-corner-sm p-1.5 transition-colors ${copied ? 'text-verdict-clear' : 'text-bone-dim hover:text-gold-bright'}`}
          >
            {copied ? <Check size={15} strokeWidth={2.6} aria-hidden="true" /> : <Copy size={15} strokeWidth={2.2} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => deleteHistoryEntry(entry.id)}
            aria-label="Delete this query from history"
            title="Delete"
            className="clip-corner-sm p-1.5 text-bone-dim transition-colors hover:text-verdict-alert"
          >
            <Trash2 size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>

      <pre className="overflow-x-auto px-4 py-3 font-mono text-sm leading-6 text-bone-muted">{entry.sql}</pre>
      {!entry.ok && entry.error && (
        <p className="border-t border-white/10 px-4 py-2.5 text-sm leading-6 text-verdict-alert">{entry.error}</p>
      )}
    </li>
  );
}

/** Query History: every statement the player has sent, newest first. */
export function NotebookQueryHistory({ onClose }) {
  const { history, clearHistory, setSql, runQuery } = useInvestigationSession();
  const [search, setSearch] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term === '' ? history : history.filter((entry) => entry.sql.toLowerCase().includes(term));
  }, [history, search]);

  // Re-running puts the statement back in the terminal and gets out of the way.
  const handleRerun = useCallback((sql) => {
    setSql(sql);
    runQuery(sql);
    onClose?.();
  }, [setSql, runQuery, onClose]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <History size={30} className="text-bone-dim" strokeWidth={1.8} aria-hidden="true" />
        <p className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-bone">No queries yet</p>
        <p className="max-w-sm typo-body text-base text-bone-muted">Every statement you run is logged here so you can re-run, copy or clear it.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[12rem] flex-1">
          <span className="sr-only">Search query history</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-dim" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your queries..."
            className="clip-corner-sm w-full border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-base text-bone outline-none transition-colors placeholder:text-bone-dim focus:border-gold/50"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            if (!confirmClear) { setConfirmClear(true); return; }
            clearHistory();
            setConfirmClear(false);
          }}
          onBlur={() => setConfirmClear(false)}
          className={`clip-corner-sm inline-flex items-center gap-2 border px-3.5 py-3 text-sm font-semibold transition-colors ${
            confirmClear ? 'border-verdict-alert/60 bg-verdict-alert/12 text-verdict-alert' : 'border-white/12 bg-white/[0.04] text-bone-muted hover:border-verdict-alert/50 hover:text-verdict-alert'
          }`}
        >
          <Trash2 size={15} strokeWidth={2.2} aria-hidden="true" />
          {confirmClear ? 'Confirm clear' : 'Clear all'}
        </button>
      </div>

      <p className="mt-3 text-sm text-bone-dim">
        {history.length} {history.length === 1 ? 'query' : 'queries'} logged · newest first · the last 50 are kept
      </p>

      <ul className="mt-4 space-y-3">
        {visible.map((entry) => <HistoryEntry key={entry.id} entry={entry} onRerun={handleRerun} />)}
        {visible.length === 0 && <li className="py-6 text-base text-bone-dim">No queries match that search.</li>}
      </ul>
    </div>
  );
}
