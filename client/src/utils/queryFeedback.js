/**
 * Turns a result set into a sentence about what was actually recovered.
 * The wording only ever names the table that was queried and counts its rows —
 * it never characterises what the rows contain.
 */

const nouns = {
  access_logs: ['access record', 'access records'],
  cctv_logs: ['CCTV entry', 'CCTV entries'],
  crime_scene: ['scene observation', 'scene observations'],
  documents: ['document', 'documents'],
  emails: ['email', 'emails'],
  employees: ['personnel record', 'personnel records'],
  evidence: ['exhibit', 'exhibits'],
  fingerprints: ['fingerprint match', 'fingerprint matches'],
  locations: ['location', 'locations'],
  phone_logs: ['phone record', 'phone records'],
  security_logs: ['security event', 'security events'],
  suspects: ['suspect file', 'suspect files'],
  vehicles: ['vehicle record', 'vehicle records'],
  victims: ['victim record', 'victim records'],
  weapons: ['weapon record', 'weapon records'],
  witnesses: ['witness statement', 'witness statements'],
};

export function nounFor(table, count) {
  const pair = nouns[table];
  if (!pair) return count === 1 ? 'record' : 'records';
  return count === 1 ? pair[0] : pair[1];
}

/**
 * @param {{tables: string[], rowCount: number, executionTime: number|null}} result
 * @returns {string}
 */
export function describeResult({ tables = [], rowCount = 0, executionTime = null }) {
  // A JOIN or a bare expression has no single subject, so stay generic.
  const table = tables.length === 1 ? tables[0] : null;

  if (rowCount === 0) {
    return table ? `No ${nounFor(table, 2)} found.` : 'No matching records found.';
  }

  const noun = table ? nounFor(table, rowCount) : rowCount === 1 ? 'record' : 'records';
  const timing = executionTime === null ? '' : ` in ${executionTime} ms`;
  return `Recovered ${rowCount} ${noun}${timing}.`;
}
