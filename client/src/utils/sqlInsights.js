/**
 * Reads an executed statement to work out what the player actually investigated.
 *
 * This is purely a gameplay signal for the objective tracker — it never gates,
 * rewrites or validates a query. The server owns validation; by the time a
 * statement reaches here it has already run.
 */

/** The shared case schema. Every case database exposes exactly these tables. */
export const caseTables = [
  'access_logs',
  'cctv_logs',
  'crime_scene',
  'documents',
  'emails',
  'employees',
  'evidence',
  'fingerprints',
  'locations',
  'phone_logs',
  'security_logs',
  'suspects',
  'vehicles',
  'victims',
  'weapons',
  'witnesses',
];

const tableSet = new Set(caseTables);

/** Blanks comments and string/identifier contents so keywords inside quotes don't count. */
function scrub(sql) {
  let output = '';
  let index = 0;
  while (index < sql.length) {
    const char = sql[index];
    const next = sql[index + 1];

    if (char === '-' && next === '-') {
      while (index < sql.length && sql[index] !== '\n') { output += ' '; index += 1; }
      continue;
    }
    if (char === '/' && next === '*') {
      while (index < sql.length && !(sql[index] === '*' && sql[index + 1] === '/')) { output += ' '; index += 1; }
      output += '  ';
      index += 2;
      continue;
    }
    if (char === "'" || char === '"' || char === '`' || char === '[') {
      const closing = char === '[' ? ']' : char;
      output += ' ';
      index += 1;
      while (index < sql.length && sql[index] !== closing) { output += ' '; index += 1; }
      output += ' ';
      index += 1;
      continue;
    }

    output += char;
    index += 1;
  }
  return output.toLowerCase();
}

const featureTests = [
  ['join', /\bjoin\b/],
  ['left_join', /\bleft\s+(?:outer\s+)?join\b/],
  ['where', /\bwhere\b/],
  ['order_by', /\border\s+by\b/],
  ['group_by', /\bgroup\s+by\b/],
  ['having', /\bhaving\b/],
  ['limit', /\blimit\b/],
  ['distinct', /\bdistinct\b/],
  ['like', /\blike\b/],
  ['between', /\bbetween\b/],
  ['in_list', /\bin\s*\(/],
  ['cte', /\bwith\b[\s\S]*\bas\s*\(/],
  ['aggregate', /\b(?:count|sum|avg|min|max)\s*\(/],
  ['subquery', /\(\s*select\b/],
  ['date_math', /\b(?:datetime|date|time|strftime|julianday)\s*\(/],
];

/**
 * @returns {{ tables: string[], features: string[] }}
 */
export function inspectStatement(sql) {
  if (typeof sql !== 'string' || sql.trim() === '') return { tables: [], features: [] };
  const scrubbed = scrub(sql);

  const tables = new Set();
  const referencePattern = /\b(?:from|join)\s+([a-z_][a-z0-9_]*)/g;
  let match = referencePattern.exec(scrubbed);
  while (match !== null) {
    if (tableSet.has(match[1])) tables.add(match[1]);
    match = referencePattern.exec(scrubbed);
  }

  const features = featureTests.filter(([, pattern]) => pattern.test(scrubbed)).map(([name]) => name);

  return { tables: [...tables], features };
}
