/**
 * The objective board.
 *
 * Every objective completes off a real investigation signal — which tables the
 * player has successfully queried, which SQL features they used, and which
 * suspects and exhibits have actually appeared in a result set. Nothing here
 * watches button clicks, so an objective can only tick by doing the detective
 * work. All three cases share one schema, which is why one rule set covers them.
 */

/** Log tables that can independently place a person somewhere at a time. */
const recordTables = ['access_logs', 'cctv_logs', 'phone_logs', 'security_logs'];

const has = (list, value) => list.includes(value);
const countOf = (list, values) => values.filter((value) => list.includes(value)).length;

export const objectiveDefinitions = [
  {
    id: 'victim',
    label: 'Identify the victim',
    hint: 'Pull the victim record: SELECT * FROM victims;',
    isComplete: ({ tables }) => has(tables, 'victims'),
  },
  {
    id: 'suspects',
    label: 'Open the suspect roster',
    hint: 'Every case starts here: SELECT * FROM suspects;',
    isComplete: ({ tables }) => has(tables, 'suspects'),
  },
  {
    id: 'witnesses',
    label: 'Review witness statements',
    hint: 'People lie, but they lie on the record: SELECT * FROM witnesses;',
    isComplete: ({ tables }) => has(tables, 'witnesses'),
  },
  {
    id: 'evidence',
    label: 'Examine the physical evidence',
    hint: 'Try evidence, weapons or fingerprints.',
    isComplete: ({ tables }) => countOf(tables, ['evidence', 'weapons', 'fingerprints']) > 0,
  },
  {
    id: 'access',
    label: 'Review the badge and access logs',
    hint: 'Doors remember who opened them: SELECT * FROM access_logs;',
    isComplete: ({ tables }) => has(tables, 'access_logs'),
  },
  {
    id: 'timeline',
    label: 'Put the movements in order',
    hint: 'Query cctv_logs or security_logs with an ORDER BY.',
    isComplete: ({ tables, features }) =>
      countOf(tables, ['cctv_logs', 'security_logs']) > 0 && has(features, 'order_by'),
  },
  {
    id: 'contradiction',
    label: 'Cross-reference a claim against the records',
    hint: 'Narrow two different log tables with WHERE — or JOIN them — and compare.',
    isComplete: ({ tables, features }) =>
      countOf(tables, recordTables) >= 2 && (has(features, 'where') || has(features, 'join')),
  },
  {
    id: 'accusation',
    label: 'Name the killer',
    hint: 'The accusation phase arrives in a later release.',
    locked: true,
    isComplete: () => false,
  },
];

/**
 * @param {{tables:string[], features:string[]}} discovery
 * @returns {Array<{id:string,label:string,hint:string,locked:boolean,isDone:boolean}>}
 */
export function evaluateObjectives(discovery) {
  return objectiveDefinitions.map((definition) => ({
    id: definition.id,
    label: definition.label,
    hint: definition.hint,
    locked: Boolean(definition.locked),
    isDone: !definition.locked && definition.isComplete(discovery),
  }));
}

/** Objectives the player can actually finish right now (the locked one is excluded). */
export function objectiveTally(objectives) {
  const active = objectives.filter((objective) => !objective.locked);
  return { done: active.filter((objective) => objective.isDone).length, total: active.length };
}

/**
 * The investigation ledger shown in the notebook. Deliberately not a percentage
 * — a detective tracks what is accounted for, not how full a bar is.
 */
export function summariseInvestigation(discovery, totals) {
  const timelineDone = discovery.tables.some((table) => table === 'cctv_logs' || table === 'security_logs')
    && discovery.features.includes('order_by');
  const contradictionFound = countOf(discovery.tables, recordTables) >= 2
    && (discovery.features.includes('where') || discovery.features.includes('join'));

  return [
    { id: 'victim', label: 'Victim', value: has(discovery.tables, 'victims') ? 'Identified' : 'Unknown', state: has(discovery.tables, 'victims') ? 'done' : 'todo' },
    { id: 'witnesses', label: 'Witnesses', value: has(discovery.tables, 'witnesses') ? 'Reviewed' : 'Not read', state: has(discovery.tables, 'witnesses') ? 'done' : 'todo' },
    {
      id: 'suspects',
      label: 'Suspects seen',
      value: `${discovery.suspectsSeen.length} / ${totals.suspects}`,
      state: totals.suspects > 0 && discovery.suspectsSeen.length >= totals.suspects ? 'done' : discovery.suspectsSeen.length > 0 ? 'partial' : 'todo',
    },
    {
      id: 'evidence',
      label: 'Evidence seen',
      value: `${discovery.evidenceSeen.length} / ${totals.evidence}`,
      state: totals.evidence > 0 && discovery.evidenceSeen.length >= totals.evidence ? 'done' : discovery.evidenceSeen.length > 0 ? 'partial' : 'todo',
    },
    { id: 'timeline', label: 'Timeline', value: timelineDone ? 'Reconstructed' : 'Incomplete', state: timelineDone ? 'done' : 'todo' },
    { id: 'contradiction', label: 'Contradiction', value: contradictionFound ? 'Found' : 'Not found', state: contradictionFound ? 'done' : 'todo' },
  ];
}
