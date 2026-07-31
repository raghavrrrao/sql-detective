/**
 * The investigation ledger.
 *
 * Every figure counts discoveries the player made. Denominators appear only
 * once a table has been read in full — until then the count stands alone,
 * because the game will not tell you how much is left to find.
 */

const rows = [
  { id: 'witnesses', label: 'Witnesses', table: 'witnesses', verb: 'interviewed' },
  { id: 'evidence', label: 'Evidence', table: 'evidence', verb: 'found' },
  { id: 'locations', label: 'Locations', table: 'locations', verb: 'examined' },
  { id: 'documents', label: 'Documents', table: 'documents', verb: 'reviewed' },
];

export function buildProgressLedger({ discoveries = [], tableTotals = {}, timelineCount = 0, intel = [] }) {
  const counts = discoveries.reduce((totals, record) => {
    totals[record.table] = (totals[record.table] ?? 0) + 1;
    return totals;
  }, {});

  const ledger = [];

  const victimCount = counts.victims ?? 0;
  ledger.push({
    id: 'victim',
    label: 'Victim',
    value: victimCount > 0 ? 'Confirmed' : 'Unidentified',
    state: victimCount > 0 ? 'done' : 'todo',
  });

  const investigated = intel.filter((profile) => profile.status !== 'unknown').length;
  ledger.push({
    id: 'suspects',
    label: 'Suspects',
    value: `${investigated} / ${intel.length} investigated`,
    state: intel.length > 0 && investigated >= intel.length ? 'done' : investigated > 0 ? 'partial' : 'todo',
  });

  for (const row of rows) {
    const found = counts[row.table] ?? 0;
    const total = tableTotals[row.table];
    ledger.push({
      id: row.id,
      label: row.label,
      value: total ? `${found} / ${total} ${row.verb}` : `${found} ${row.verb}`,
      state: total && found >= total ? 'done' : found > 0 ? 'partial' : 'todo',
    });
  }

  ledger.push({
    id: 'timeline',
    label: 'Timeline',
    value: `${timelineCount} ${timelineCount === 1 ? 'event' : 'events'}`,
    state: timelineCount >= 8 ? 'done' : timelineCount > 0 ? 'partial' : 'todo',
  });

  return ledger;
}
