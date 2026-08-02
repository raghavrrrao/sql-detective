/**
 * The training investigation.
 *
 * A deliberately tiny, entirely fictional case that exists only to teach the
 * loop. It is not in the case catalog, has no database file, has no solution
 * and cannot be accused — three tables and ten rows, which is exactly enough
 * to demonstrate SELECT, WHERE and ORDER BY and nothing more.
 *
 * IMPORTANT: the real SQL engine is untouched by any of this. Training queries
 * never reach `/api/query`, never open a case database, and never pass through
 * `sqlPolicy`. The evaluator below is a self-contained sandbox that understands
 * only the handful of statements the training teaches, so a recruit can
 * experiment without a server and without any risk to the real cases.
 */

export const trainingTables = [
  { name: 'suspects', rowCount: 3 },
  { name: 'access_logs', rowCount: 5 },
  { name: 'evidence', rowCount: 2 },
];

const data = {
  suspects: [
    { id: 1, name: 'Ellis Warner', role: 'Office Manager', floor: 2 },
    { id: 2, name: 'Rosa MacKay', role: 'Night Cleaner', floor: 2 },
    { id: 3, name: 'Devin Chase', role: 'Accounts Clerk', floor: 3 },
  ],
  access_logs: [
    { id: 1, person_name: 'Rosa MacKay', access_point: 'Rear door', access_time: '17:05', result: 'Granted' },
    { id: 2, person_name: 'Ellis Warner', access_point: 'Main door', access_time: '17:40', result: 'Granted' },
    { id: 3, person_name: 'Devin Chase', access_point: 'Main door', access_time: '18:20', result: 'Granted' },
    { id: 4, person_name: 'Devin Chase', access_point: 'Records room', access_time: '18:24', result: 'Granted' },
    { id: 5, person_name: 'Rosa MacKay', access_point: 'Rear door', access_time: '19:10', result: 'Granted' },
  ],
  evidence: [
    { id: 1, title: 'Empty document wallet', description: 'Found on the records room desk. The wallet is here; the contents are not.' },
    { id: 2, title: 'Records room door log', description: 'The door reader recorded every card presented to it during the evening.' },
  ],
};

/** Rows for a table, copied so nothing the UI does can mutate the fixture. */
export const trainingRows = (table) => (data[table] ?? []).map((row) => ({ ...row }));

const OPERATORS = {
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a !== b,
  '<>': (a, b) => a !== b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '=': (a, b) => a === b,
};

class TrainingQueryError extends Error {}

/**
 * A very small SELECT evaluator.
 *
 * It understands `SELECT <cols|*> FROM <table>` with an optional single
 * `WHERE <column> <op> <value>` and an optional `ORDER BY <column> [DESC]`.
 * Anything else is refused with a message that points back at the training
 * step rather than pretending to be a SQL parser.
 */
export function runTrainingQuery(sql) {
  const started = performance.now();
  const text = String(sql ?? '').trim().replace(/;+\s*$/, '');
  if (text === '') throw new TrainingQueryError('The terminal is empty. Write a query, then run it.');

  const match = text.match(/^select\s+(.+?)\s+from\s+([a-z_][a-z0-9_]*)\s*(.*)$/is);
  if (!match) {
    throw new TrainingQueryError('Training queries start with SELECT … FROM <table>. Try the query the briefing loaded for you.');
  }

  const [, rawColumns, table, rest] = match;
  if (!data[table]) {
    throw new TrainingQueryError(`There is no ${table} table in the training file. It holds suspects, access_logs and evidence.`);
  }

  let rows = trainingRows(table);
  let remainder = rest.trim();

  // --- WHERE -------------------------------------------------------------
  const whereMatch = remainder.match(/^where\s+([a-z_][a-z0-9_]*)\s*(>=|<=|!=|<>|>|<|=)\s*('[^']*'|"[^"]*"|[^\s]+)\s*(.*)$/is);
  if (whereMatch) {
    const [, column, operator, rawValue, tail] = whereMatch;
    if (!(column in rows[0] ?? {})) {
      throw new TrainingQueryError(`${table} has no ${column} column. Run SELECT * FROM ${table}; to see what it holds.`);
    }
    const value = rawValue.replace(/^['"]|['"]$/g, '');
    const compare = OPERATORS[operator];
    rows = rows.filter((row) => {
      const left = row[column];
      // Numbers compare as numbers; everything else compares as text, which is
      // what makes a '18:00' timestamp comparison behave the way it reads.
      if (typeof left === 'number' && value !== '' && !Number.isNaN(Number(value))) return compare(left, Number(value));
      return compare(String(left), value);
    });
    remainder = tail.trim();
  }

  // --- ORDER BY ----------------------------------------------------------
  const orderMatch = remainder.match(/^order\s+by\s+([a-z_][a-z0-9_]*)\s*(asc|desc)?\s*(.*)$/is);
  if (orderMatch) {
    const [, column, direction, tail] = orderMatch;
    if (!(column in rows[0] ?? data[table][0])) {
      throw new TrainingQueryError(`${table} has no ${column} column to sort by.`);
    }
    const factor = String(direction ?? 'asc').toLowerCase() === 'desc' ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      const left = a[column];
      const right = b[column];
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor;
      return String(left).localeCompare(String(right)) * factor;
    });
    remainder = tail.trim();
  }

  if (remainder !== '') {
    throw new TrainingQueryError('The training terminal only understands SELECT, WHERE and ORDER BY. The real cases understand a great deal more.');
  }

  // --- projection --------------------------------------------------------
  const wanted = rawColumns.trim() === '*'
    ? Object.keys(data[table][0])
    : rawColumns.split(',').map((column) => column.trim());

  const unknown = wanted.filter((column) => !(column in data[table][0]));
  if (unknown.length > 0) {
    throw new TrainingQueryError(`${table} has no ${unknown[0]} column. Run SELECT * FROM ${table}; to see what it holds.`);
  }

  const projected = rows.map((row) => Object.fromEntries(wanted.map((column) => [column, row[column]])));

  return {
    columns: wanted,
    rows: projected,
    rowCount: projected.length,
    executionTime: Math.round((performance.now() - started) * 100) / 100,
  };
}

export { TrainingQueryError };
