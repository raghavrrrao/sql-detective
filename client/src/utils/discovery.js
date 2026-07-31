/**
 * The discovery engine.
 *
 * A discovery is one fact the player pulled out of the database themselves.
 * Nothing here consults the solution, and nothing is created except from rows
 * the server actually returned — if a query never ran, the fact does not exist.
 *
 * Records are keyed on the identity of the underlying row, so widening a
 * projection later enriches the discovery instead of duplicating it.
 */

/** The column that carries a row's own timestamp, per table. */
const timeColumns = {
  access_logs: 'access_time',
  cctv_logs: 'observed_at',
  crime_scene: 'recorded_at',
  documents: 'created_at',
  emails: 'sent_at',
  evidence: 'discovered_at',
  phone_logs: 'call_time',
  security_logs: 'event_time',
};

/** The column that says where a row happened, per table. */
const placeColumns = {
  access_logs: 'access_point',
  cctv_logs: 'camera_id',
  crime_scene: 'area',
  evidence: 'location_found',
  locations: 'name',
  vehicles: 'last_seen',
  weapons: 'recovered_from',
};

/**
 * Where a record came from — provenance, not credibility. A machine log is
 * "Recorded" because a machine wrote it, never because it happens to be true.
 */
const provenance = {
  access_logs: 'Recorded',
  cctv_logs: 'Recorded',
  phone_logs: 'Recorded',
  security_logs: 'Recorded',
  emails: 'Recorded',
  evidence: 'Forensic',
  fingerprints: 'Forensic',
  weapons: 'Forensic',
  witnesses: 'Reported',
  suspects: 'Reported',
};

/** Tables whose rows are machine-generated placements of a person. */
export const machineRecordTables = ['access_logs', 'cctv_logs', 'phone_logs', 'security_logs'];

/**
 * Columns that identify a row across different projections of the same table.
 *
 * The natural key comes before `id` on purpose: `SELECT name FROM victims` and
 * `SELECT * FROM victims` have to land on the same key, and only the natural
 * column is present in both. Log tables have no natural key and fall back to id.
 */
const identityColumns = {
  access_logs: ['id'],
  cctv_logs: ['id'],
  crime_scene: ['id'],
  documents: ['title', 'id'],
  emails: ['id'],
  employees: ['name', 'id'],
  evidence: ['title', 'id'],
  fingerprints: ['print_label', 'id'],
  locations: ['name', 'id'],
  phone_logs: ['id'],
  security_logs: ['id'],
  suspects: ['name', 'id'],
  vehicles: ['registration', 'owner_name', 'id'],
  victims: ['name', 'id'],
  weapons: ['name', 'id'],
  witnesses: ['name', 'id'],
};

const text = (value) => (value === null || value === undefined ? '' : String(value));

/** Human-readable one-liners. Every builder tolerates a partial projection. */
const titleBuilders = {
  access_logs: (r) => `Badge · ${text(r.person_name) || 'unnamed'}${r.access_point ? ` at ${r.access_point}` : ''}${r.result ? ` (${r.result})` : ''}`,
  cctv_logs: (r) => `Camera ${text(r.camera_id) || '·'}${r.subject ? ` · ${r.subject}` : ''}`,
  crime_scene: (r) => `Scene · ${text(r.area) || 'observation'}`,
  documents: (r) => `Document · ${text(r.title) || 'untitled'}`,
  emails: (r) => `Email · ${text(r.sender) || '?'} to ${text(r.recipient) || '?'}`,
  employees: (r) => `Personnel · ${text(r.name) || 'unnamed'}${r.role ? ` (${r.role})` : ''}`,
  evidence: (r) => `Exhibit · ${text(r.title) || 'unlabelled'}`,
  fingerprints: (r) => `Print ${text(r.print_label) || '·'}${r.matched_to ? ` matched to ${r.matched_to}` : ''}`,
  locations: (r) => `Location · ${text(r.name) || 'unnamed'}`,
  phone_logs: (r) => `Call · ${text(r.caller) || '?'} to ${text(r.receiver) || '?'}`,
  security_logs: (r) => `${text(r.system_name) || 'System'} · ${text(r.event_type) || 'event'}`,
  suspects: (r) => `Suspect file · ${text(r.name) || 'unnamed'}${r.occupation ? ` (${r.occupation})` : ''}`,
  vehicles: (r) => `Vehicle · ${text(r.owner_name) || 'unknown owner'}${r.vehicle_type ? ` (${r.vehicle_type})` : ''}`,
  victims: (r) => `Victim record · ${text(r.name) || 'unnamed'}`,
  weapons: (r) => `Weapon · ${text(r.name) || 'unlabelled'}`,
  witnesses: (r) => `Statement · ${text(r.name) || 'anonymous'}`,
};

function buildTitle(table, row) {
  const builder = titleBuilders[table];
  const title = builder ? builder(row).trim() : '';
  if (title && !/^[a-z_]+ · $/i.test(title)) return title;
  // A projection too narrow for the usual shape still deserves a readable line.
  const first = Object.values(row).find((value) => text(value) !== '');
  return `${table.replace(/_/g, ' ')} · ${text(first) || 'record'}`;
}

function buildKey(table, row) {
  for (const column of identityColumns[table] ?? ['id']) {
    if (row[column] !== undefined && row[column] !== null && row[column] !== '') {
      return `${table}#${column}=${row[column]}`;
    }
  }
  // No identity column in this projection: fall back to the row's own contents.
  const shape = Object.keys(row).sort().map((column) => `${column}=${text(row[column])}`).join('|');
  return `${table}~${shape}`;
}

function buildTimestamp(table, row) {
  if (table === 'victims') {
    const date = text(row.date_of_death);
    const time = text(row.time_of_death);
    if (date && time) return `${date} ${time}`;
    return time || date || null;
  }
  const column = timeColumns[table];
  const value = column ? text(row[column]) : '';
  return value || null;
}

/** Finds which roster names this row mentions, in any column. */
function findSuspects(row, rosterNames) {
  if (rosterNames.length === 0) return [];
  const blob = Object.values(row).filter((value) => typeof value === 'string' && value !== '').join(' | ');
  if (blob === '') return [];
  return rosterNames.filter((name) => blob.includes(name));
}

/**
 * Turns one successful result set into discovery records.
 *
 * @returns {Array<object>} one record per row, per source table
 */
export function extractDiscoveries({ sql, tables, rows, rosterNames = [], at }) {
  if (!Array.isArray(rows) || rows.length === 0 || tables.length === 0) return [];

  // A JOIN mixes columns from several tables; attribute the row to each table
  // whose identity column actually came back, and fall back to the first table.
  const discoveries = [];
  for (const row of rows) {
    const owning = tables.filter((table) => (identityColumns[table] ?? []).some((column) => row[column] !== undefined));
    const attributed = owning.length > 0 ? owning : [tables[0]];
    const suspects = findSuspects(row, rosterNames);

    for (const table of attributed) {
      const place = placeColumns[table] ? text(row[placeColumns[table]]) : '';
      discoveries.push({
        key: buildKey(table, row),
        title: buildTitle(table, row),
        table,
        sql,
        at,
        suspects,
        location: place || null,
        occurredAt: buildTimestamp(table, row),
        confidence: provenance[table] ?? 'Documented',
      });
    }
  }
  return discoveries;
}

/**
 * Merges new discoveries into the existing list, enriching rather than
 * duplicating when the same row is seen again through a wider projection.
 *
 * @returns {{ discoveries: object[], added: object[] }}
 */
export function mergeDiscoveries(existing, incoming) {
  if (incoming.length === 0) return { discoveries: existing, added: [] };

  const byKey = new Map(existing.map((record) => [record.key, record]));
  const added = [];
  let changed = false;

  for (const record of incoming) {
    const current = byKey.get(record.key);
    if (!current) {
      byKey.set(record.key, record);
      added.push(record);
      changed = true;
      continue;
    }
    // Seen before — keep the original discovery time, take any new detail.
    const merged = {
      ...current,
      title: record.title.length > current.title.length ? record.title : current.title,
      location: current.location ?? record.location,
      occurredAt: current.occurredAt ?? record.occurredAt,
      suspects: current.suspects.length >= record.suspects.length ? current.suspects : record.suspects,
    };
    if (
      merged.title !== current.title
      || merged.location !== current.location
      || merged.occurredAt !== current.occurredAt
      || merged.suspects !== current.suspects
    ) {
      byKey.set(record.key, merged);
      changed = true;
    }
  }

  return { discoveries: changed ? [...byKey.values()] : existing, added };
}
