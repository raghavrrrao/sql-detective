import { memo } from 'react';
import { Database, TableProperties } from 'lucide-react';
import { Panel } from './Panel';

/**
 * The evidence tables in this case's database.
 *
 * A player who has never written SQL cannot begin until they know what there is
 * to ask about. This panel answers that once, from the real database: the
 * tables that actually hold rows in *this* case, with how many. Clicking one
 * writes a plain `SELECT *` into the terminal so the first query costs nothing
 * but a click, and the player can read it back to see what they just ran.
 *
 * It shows names and sizes only. Nothing here reveals what is in a row.
 */
function CaseTablesPanelComponent({ tables = [], onPickTable }) {
  return (
    <Panel
      icon={Database}
      title="Evidence tables"
      accent="gold"
      meta={<span className="font-mono">{tables.length}</span>}
      bodyClassName="p-3"
    >
      <p className="px-1 pb-3 typo-body-secondary text-xs text-bone-dim">
        Every table in this case file. Pick one to load a query for it.
      </p>

      <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
        {tables.map((table) => (
          <li key={table.name}>
            <button
              type="button"
              onClick={() => onPickTable?.(table.name)}
              title={`Load SELECT * FROM ${table.name};`}
              className="clip-corner-sm flex w-full items-center gap-2.5 border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-left transition-colors hover:border-gold/45 hover:bg-gold/[0.07]"
            >
              <TableProperties size={15} className="shrink-0 text-gold-bright" strokeWidth={2} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-bone">{table.name}</span>
              <span className="shrink-0 font-mono text-xs text-bone-dim">
                {table.rowCount}
                <span className="sr-only"> {table.rowCount === 1 ? 'row' : 'rows'}</span>
              </span>
            </button>
          </li>
        ))}
        {tables.length === 0 && (
          <li className="px-1 py-4 text-sm text-bone-dim">No tables were returned for this case.</li>
        )}
      </ul>
    </Panel>
  );
}

export const CaseTablesPanel = memo(CaseTablesPanelComponent);
