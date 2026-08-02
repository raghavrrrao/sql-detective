/**
 * Investigation categories.
 *
 * This is the model the whole discovery loop is built on: every table in the
 * shared case schema belongs to exactly one category, a category is the unit
 * the notebook shows and objectives count against, and "investigation %" is a
 * weighted reading of how far each category has been recovered.
 *
 * Three rules govern the design:
 *
 *  1. Nothing here consults the solution, and nothing is seeded. A category
 *     only has content because the player's own query returned rows for it.
 *
 *  2. A category is *sufficient* well before it is exhausted. `RECOVERY_TARGET`
 *     is what counts as done; the full row count is still shown so a
 *     completionist can see what they left behind, but nobody is forced to
 *     `SELECT *` every table to finish a case. That is the difference between
 *     an investigation and a checklist.
 *
 *  3. Categories with no rows in this case disappear entirely rather than
 *     sitting at 0/0 forever. A theft has no victim record and some cases have
 *     no emails — those simply are not part of that case's investigation, and
 *     no per-case configuration is needed to express it.
 */

/** How much of a category counts as sufficiently investigated. */
export const RECOVERY_TARGET = 0.6;

/**
 * Order matters: this is the order categories are listed in the notebook and
 * the order unexplored ones are suggested as hints.
 */
export const investigationCategories = [
  {
    id: 'suspects',
    label: 'Suspect files',
    board: 'suspects',
    tables: ['suspects'],
    weight: 1,
    empty: 'No suspect files opened.',
    lead: 'Nobody on the roster has a file yet. `SELECT * FROM suspects;` opens them.',
  },
  {
    id: 'witnesses',
    label: 'Witness statements',
    board: 'witnesses',
    tables: ['witnesses'],
    weight: 1,
    empty: 'No witness statements collected.',
    lead: 'Nobody has been interviewed yet. The `witnesses` table holds what people said.',
  },
  {
    id: 'evidence',
    label: 'Physical evidence',
    board: 'evidence',
    tables: ['evidence', 'weapons', 'fingerprints'],
    weight: 1,
    empty: 'No physical evidence recovered.',
    lead: 'No exhibits are on file. Try `evidence`, and the forensic tables beside it.',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    board: 'timeline',
    tables: ['access_logs', 'cctv_logs', 'security_logs', 'phone_logs'],
    weight: 1.25,
    empty: 'No timeline has been reconstructed.',
    lead: 'Nothing you hold carries a time. The log tables are where the chronology lives.',
  },
  {
    id: 'documents',
    label: 'Documents',
    board: 'documents',
    tables: ['documents', 'emails'],
    weight: 0.75,
    empty: 'No documents discovered.',
    lead: 'No paperwork has been read. `documents` often carries the motive.',
  },
  {
    id: 'scene',
    label: 'Scene and victim',
    board: 'crime-scene',
    tables: ['crime_scene', 'locations', 'victims'],
    weight: 0.75,
    empty: 'No scene observations recorded.',
    lead: 'The scene itself has not been examined. Try `crime_scene`.',
  },
];

const tableToCategory = new Map();
for (const category of investigationCategories) {
  for (const table of category.tables) tableToCategory.set(table, category.id);
}

/** @returns {string|null} the category a table files into */
export function categoryForTable(table) {
  return tableToCategory.get(table) ?? null;
}

/** Which board folder a table's discoveries appear in. */
export function boardFolderForTable(table) {
  const id = categoryForTable(table);
  return investigationCategories.find((category) => category.id === id)?.board ?? 'notes';
}

/**
 * Measures how far each category has been recovered.
 *
 * `total` comes from the row counts the briefing sent, so denominators are
 * known from the first moment — the player can always see the size of the job
 * even before they have found any of it.
 *
 * @param {{discoveries: object[], tableTotals: Record<string, number>}} input
 * @returns {Array<object>} one entry per category present in this case
 */
export function countByTable(discoveries = []) {
  const counts = {};
  for (const record of discoveries) {
    counts[record.table] = (counts[record.table] ?? 0) + 1;
  }
  return counts;
}

export function buildCategoryProgress({ discoveries = [], tableTotals = {} }) {
  const recoveredByTable = countByTable(discoveries);

  return investigationCategories
    .map((category) => {
      const total = category.tables.reduce((sum, table) => sum + (tableTotals[table] ?? 0), 0);
      // Discoveries are capped at the known total: a JOIN can attribute the
      // same underlying row through more than one projection, and a category
      // reading 9/8 would look like a bug rather than thoroughness.
      const recovered = Math.min(
        total,
        category.tables.reduce((sum, table) => sum + (recoveredByTable[table] ?? 0), 0),
      );
      const target = total === 0 ? 0 : Math.max(1, Math.ceil(total * RECOVERY_TARGET));

      return {
        id: category.id,
        label: category.label,
        board: category.board,
        tables: category.tables,
        weight: category.weight,
        empty: category.empty,
        lead: category.lead,
        recovered,
        total,
        target,
        isUnlocked: recovered > 0,
        isComplete: total > 0 && recovered >= target,
        isExhausted: total > 0 && recovered >= total,
        share: target === 0 ? 0 : Math.min(1, recovered / target),
      };
    })
    // A category with no rows in this case is not part of this case.
    .filter((category) => category.total > 0);
}

/**
 * Investigation percentage — how much of the case has actually been worked.
 *
 * Deliberately *not* the same number as case completion: it measures the file
 * the player has built, not whether they have won. It is what gates the
 * accusation and what the debrief reports back.
 *
 * @returns {number} 0–100
 */
export function computeInvestigationPercent(categories) {
  if (categories.length === 0) return 0;
  const weighted = categories.reduce((sum, category) => sum + category.share * category.weight, 0);
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
  return Math.round((weighted / totalWeight) * 100);
}

/** Categories with nothing on file yet, most valuable first — the hint source. */
export function unexploredCategories(categories) {
  return categories.filter((category) => !category.isUnlocked).sort((a, b) => b.weight - a.weight);
}

/** Categories opened but not yet sufficient, thinnest first. */
export function thinCategories(categories) {
  return categories
    .filter((category) => category.isUnlocked && !category.isComplete)
    .sort((a, b) => a.share - b.share);
}
