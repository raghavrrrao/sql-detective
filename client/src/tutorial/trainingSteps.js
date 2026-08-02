/**
 * The training script.
 *
 * One mechanic per step, two or three short lines each, and never a paragraph.
 * Three of the steps refuse to advance until the recruit has actually run the
 * query — the whole point is that they perform the mechanic rather than read
 * about it.
 *
 * `anchor` names a `data-tutorial` attribute on a real element. Nothing here
 * knows a coordinate, so the spotlight follows the component wherever the
 * responsive layout puts it.
 */

export const GATES = {
  ranSuspects: 'ranSuspects',
  ranWhere: 'ranWhere',
  ranOrderBy: 'ranOrderBy',
};

export const trainingSteps = [
  {
    id: 'welcome',
    eyebrow: 'Recruitment',
    title: 'Welcome, Detective',
    lines: [
      'Every mystery here is solved through evidence.',
      'Every piece of evidence is uncovered with SQL.',
      'Your first training case is on the desk.',
    ],
    anchor: null,
  },
  {
    id: 'tables',
    eyebrow: 'Briefing 01',
    title: 'The evidence tables',
    lines: [
      'Each table is one source of evidence.',
      'This file holds suspects, access logs and exhibits.',
    ],
    anchor: 'tables',
  },
  {
    id: 'select',
    eyebrow: 'Briefing 02',
    title: 'Ask the first question',
    lines: [
      'SQL is how you question the record.',
      'Run the statement in the terminal to identify everyone on file.',
    ],
    anchor: 'terminal',
    sql: 'SELECT * FROM suspects;',
    requires: GATES.ranSuspects,
    waitingFor: 'Press Execute to run the query.',
  },
  {
    id: 'discovery',
    eyebrow: 'Briefing 03',
    title: 'Nothing arrives on its own',
    lines: [
      'Three suspects were just filed in your notebook.',
      'It only ever holds what you recovered yourself.',
    ],
    anchor: 'notebook',
  },
  {
    id: 'where',
    eyebrow: 'Briefing 04',
    title: 'Narrow the search',
    lines: [
      'WHERE throws away the rows that do not matter.',
      'The document went missing after six. Ask only about then.',
    ],
    anchor: 'terminal',
    sql: "SELECT *\nFROM access_logs\nWHERE access_time > '18:00';",
    requires: GATES.ranWhere,
    waitingFor: 'Press Execute to filter the door log.',
  },
  {
    id: 'order',
    eyebrow: 'Briefing 05',
    title: 'Put the evening in order',
    lines: [
      'Records are filed in any order. Events happen in one.',
      'ORDER BY turns a log into a timeline.',
    ],
    anchor: 'terminal',
    sql: 'SELECT *\nFROM access_logs\nORDER BY access_time;',
    requires: GATES.ranOrderBy,
    waitingFor: 'Press Execute to sort the log.',
  },
  {
    id: 'objectives',
    eyebrow: 'Briefing 06',
    title: 'Objectives',
    lines: [
      'Objectives count what you have actually recovered.',
      'You never need every record — only enough to stand behind.',
    ],
    anchor: 'objectives',
  },
  {
    id: 'progress',
    eyebrow: 'Briefing 07',
    title: 'Investigation progress',
    lines: [
      'This rises as you uncover real evidence.',
      'Running queries at random will not move it.',
    ],
    anchor: 'progress',
  },
  {
    id: 'hints',
    eyebrow: 'Briefing 08',
    title: 'Hints',
    lines: [
      'A hint never names the culprit.',
      'It points at a line of enquiry you have not opened yet — and it costs score.',
    ],
    anchor: 'hints',
  },
  {
    id: 'accuse',
    eyebrow: 'Briefing 09',
    title: 'The accusation',
    lines: [
      'This stays shut until your file supports a conclusion.',
      'A detective builds the case first, then names the person.',
    ],
    anchor: 'accuse',
  },
  {
    id: 'complete',
    eyebrow: 'Cleared for duty',
    title: 'Training complete',
    lines: ['Case 01 is waiting. Good luck, Detective.'],
    anchor: null,
    checklist: [
      'Tables', 'SQL queries', 'Discoveries', 'Notebook', 'Timeline',
      'Objectives', 'Hints', 'Investigation progress', 'Accusations',
    ],
  },
];

export const stepCount = trainingSteps.length;
