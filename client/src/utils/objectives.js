import { getCaseWording, getObjectiveIds } from '../catalog/caseCatalog';

/**
 * The objective board.
 *
 * Every objective completes off a real investigation signal — which tables the
 * player has successfully queried, which SQL features they used, and whether
 * the case has been closed. Nothing here watches button clicks, so an objective
 * can only tick by doing the detective work.
 *
 * The library below defines how each objective is *measured*; the catalog
 * decides which of them a given case *uses*. A short tutorial case can list
 * four, an expert case all eight, and neither needs new logic.
 */

/** Log tables that can independently place a person somewhere at a time. */
const recordTables = ['access_logs', 'cctv_logs', 'phone_logs', 'security_logs'];

const has = (list, value) => list.includes(value);
const countOf = (list, values) => values.filter((value) => list.includes(value)).length;

export const objectiveLibrary = {
  victim: {
    label: 'Identify the victim',
    hint: 'Pull the victim record: SELECT * FROM victims;',
    isComplete: ({ tables }) => has(tables, 'victims'),
  },
  suspects: {
    label: 'Open the suspect roster',
    hint: 'Every case starts here: SELECT * FROM suspects;',
    isComplete: ({ tables }) => has(tables, 'suspects'),
  },
  witnesses: {
    label: 'Review witness statements',
    hint: 'People lie, but they lie on the record: SELECT * FROM witnesses;',
    isComplete: ({ tables }) => has(tables, 'witnesses'),
  },
  evidence: {
    label: 'Examine the physical evidence',
    hint: 'Try evidence, weapons or fingerprints.',
    isComplete: ({ tables }) => countOf(tables, ['evidence', 'weapons', 'fingerprints']) > 0,
  },
  access: {
    label: 'Review the badge and access logs',
    hint: 'Doors remember who opened them: SELECT * FROM access_logs;',
    isComplete: ({ tables }) => has(tables, 'access_logs'),
  },
  timeline: {
    label: 'Put the movements in order',
    hint: 'Query cctv_logs or security_logs with an ORDER BY.',
    isComplete: ({ tables, features }) =>
      countOf(tables, ['cctv_logs', 'security_logs']) > 0 && has(features, 'order_by'),
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
 * @param {{tables:string[], features:string[], isSolved?:boolean}} state
 * @returns {Array<{id:string,label:string,hint:string,isDone:boolean}>}
 */
export function evaluateObjectives(caseId, state) {
  return getObjectiveIds(caseId)
    .map((id) => {
      const definition = objectiveLibrary[id];
      if (!definition) return null;
      return {
        id,
        label: definition.label,
        hint: definition.hint,
        isDone: definition.isComplete(state),
      };
    })
    .filter(Boolean);
}

export function objectiveTally(objectives) {
  return { done: objectives.filter((objective) => objective.isDone).length, total: objectives.length };
}
