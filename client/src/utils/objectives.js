import { getObjectiveIds } from '../catalog/caseCatalog';

/**
 * The objective board.
 *
 * Objectives are measured goals, not passive prompts. Most of them count real
 * records the player has pulled out of the database — "Recover physical
 * evidence 5 / 8" — and tick over automatically as discoveries land. A few
 * stay boolean because what they teach is a *technique* rather than a volume
 * of records, and those still complete off a real investigation signal:
 * which tables came back with rows and which SQL features were used. Nothing
 * here watches a button, so an objective can only be completed by doing the
 * detective work.
 *
 * The ids below are the same ids the case catalog has always listed, so
 * changing how an objective is measured needs no change to any case.
 *
 * Counted objectives complete at the category's `target`, not its total (see
 * investigationCategories). Recovering everything is rewarded by score and
 * shown in the debrief, but it is never required.
 */

/** Log tables that can independently place a person somewhere at a time. */
const recordTables = ['access_logs', 'cctv_logs', 'phone_logs', 'security_logs'];

const has = (list, value) => list.includes(value);
const countOf = (list, values) => values.filter((value) => list.includes(value)).length;

const categoryOf = (state, id) => state.categories?.find((category) => category.id === id) ?? null;

export const objectiveLibrary = {
  victim: {
    label: 'Identify the victim',
    hint: 'Pull the victim record: SELECT * FROM victims;',
    isComplete: ({ tables }) => has(tables, 'victims'),
  },

  suspects: {
    label: 'Open the suspect files',
    hint: 'Every case starts here: SELECT * FROM suspects;',
    measure: (state) => categoryOf(state, 'suspects'),
  },

  witnesses: {
    label: 'Collect witness statements',
    hint: 'People lie, but they lie on the record: SELECT * FROM witnesses;',
    measure: (state) => categoryOf(state, 'witnesses'),
  },

  evidence: {
    label: 'Recover physical evidence',
    hint: 'Try evidence, weapons or fingerprints.',
    measure: (state) => categoryOf(state, 'evidence'),
  },

  access: {
    label: 'Recover the badge and access logs',
    hint: 'Doors remember who opened them: SELECT * FROM access_logs;',
    // Scoped to one table rather than the whole timeline category: this is the
    // objective that teaches a player to go and read a door log specifically.
    measure: (state) => {
      const total = state.tableTotals?.access_logs ?? 0;
      if (total === 0) return null;
      const recovered = Math.min(total, state.recoveredByTable?.access_logs ?? 0);
      return { recovered, total, target: Math.max(1, Math.ceil(total * 0.6)) };
    },
  },

  timeline: {
    label: 'Reconstruct the timeline',
    hint: 'Query the log tables, then read them in order with ORDER BY.',
    measure: (state) => categoryOf(state, 'timeline'),
    // Recovering the events is most of the work, but the chronology only
    // really exists once they have been put in sequence — so this one keeps
    // its ORDER BY requirement on top of the count.
    alsoRequires: ({ features }) => has(features, 'order_by'),
    blockedHint: 'You have the events. Sort them with ORDER BY to read the night in sequence.',
  },

  contradiction: {
    label: 'Cross-reference a claim against the records',
    hint: 'Narrow two different log tables with WHERE — or JOIN them — and compare.',
    isComplete: ({ tables, features }) =>
      countOf(tables, recordTables) >= 2 && (has(features, 'where') || has(features, 'join')),
  },

  accusation: {
    label: 'Name the person responsible',
    hint: 'File a formal accusation once your file stands up.',
    isComplete: ({ isSolved }) => Boolean(isSolved),
  },
};

/**
 * @param {string} caseId
 * @param {object} state  { tables, features, isSolved, categories, recoveredByTable, tableTotals }
 * @returns {Array<{id,label,hint,isDone,recovered,total,target,isCounted}>}
 */
export function evaluateObjectives(caseId, state) {
  return getObjectiveIds(caseId)
    .map((id) => {
      const definition = objectiveLibrary[id];
      if (!definition) return null;

      // --- boolean objectives -------------------------------------------
      if (!definition.measure) {
        return {
          id,
          label: definition.label,
          hint: definition.hint,
          isDone: definition.isComplete(state),
          isCounted: false,
          recovered: 0,
          total: 0,
          target: 0,
        };
      }

      // --- counted objectives -------------------------------------------
      const measured = definition.measure(state);
      // A category with no rows in this case cannot be an objective for it.
      if (!measured || measured.total === 0) return null;

      const reachedTarget = measured.recovered >= measured.target;
      const gateOpen = definition.alsoRequires ? definition.alsoRequires(state) : true;

      return {
        id,
        label: definition.label,
        hint: reachedTarget && !gateOpen ? definition.blockedHint ?? definition.hint : definition.hint,
        isDone: reachedTarget && gateOpen,
        isCounted: true,
        recovered: measured.recovered,
        total: measured.total,
        target: measured.target,
      };
    })
    .filter(Boolean);
}

export function objectiveTally(objectives) {
  return { done: objectives.filter((objective) => objective.isDone).length, total: objectives.length };
}
