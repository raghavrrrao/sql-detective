/**
 * The case catalog — the single source of truth for every case in the game.
 *
 * Adding a case means adding one entry here and one database file. Nothing else
 * in the client should need to change: progression order, objectives,
 * accusation thresholds, the starter query, the selection card and the landing
 * page all read from this list.
 *
 * `id` is the contract with everything outside the client: it is the API's
 * difficulty parameter, the database filename stem, and the localStorage key
 * for that case's saved session. **Ids never change.** The five-tier
 * progression is expressed by `order` and `tier`, which are display concerns
 * and may be reshuffled freely. That is why the second case is still `medium`
 * internally while presenting as Hard — renaming it would orphan every save.
 *
 * @typedef {object} CaseEntry
 * @property {string}   id            backend id, database stem and storage key
 * @property {number}   order         position in the unlock chain, 1-based
 * @property {string}   slug          stable human-readable handle
 * @property {string}   tier          display difficulty
 * @property {number}   tierRank      position on the five-tier scale
 * @property {string}   caseNumber    as printed on the dossier
 * @property {string}   title
 * @property {string}   database      file the server opens for this case
 * @property {string}   estimatedTime
 * @property {string}   recommendedExperience
 * @property {string[]} sqlConcepts
 * @property {string}   detectiveConcept  the reasoning skill this case teaches
 * @property {string[]} learningGoals
 * @property {string}   preview
 * @property {string}   starterQuery
 * @property {string[]} objectives    ids resolved against the objective library
 * @property {object}   thresholds    accusation gates, see utils/accusation
 * @property {object}   theme         accent + icon name for presentation
 * @property {string}   status        'available' once its database exists
 */

/** Applied to every entry so a new case only has to state what differs. */
const defaults = {
  status: 'available',
  tier: 'Easy',
  tierRank: 2,
  estimatedTime: '20 Minutes',
  recommendedExperience: 'Comfortable with SELECT',
  sqlConcepts: [],
  detectiveConcept: 'Reading a record',
  learningGoals: [],
  objectives: ['victim', 'suspects', 'witnesses', 'evidence', 'access', 'timeline', 'contradiction', 'accusation'],
  theme: { accent: 'crimson', icon: 'Fingerprint' },
  starterQuery: 'SELECT name, occupation FROM suspects;',
  thresholds: {
    // What the file has to look like before an accusation may be filed.
    readiness: { discoveries: 15, sources: 4, suspects: 3, requireVictim: true, allowRepeatAccusation: false },
    // What a proven case needs on top of naming the right person.
    verdict: { citations: 3, discoveries: 20, sources: 5, timeline: 6 },
  },
};

/** Merges an entry over the defaults, keeping the nested groups intact. */
export function defineCase(entry) {
  return {
    ...defaults,
    ...entry,
    theme: { ...defaults.theme, ...entry.theme },
    thresholds: {
      readiness: { ...defaults.thresholds.readiness, ...entry.thresholds?.readiness },
      verdict: { ...defaults.thresholds.verdict, ...entry.thresholds?.verdict },
    },
  };
}

export const caseCatalog = [
  defineCase({
    id: 'beginner',
    order: 1,
    slug: 'locked-office',
    tier: 'Beginner',
    tierRank: 1,
    caseNumber: 'Case 01',
    title: 'The Locked Office',
    database: 'beginner.db',
    estimatedTime: '10 Minutes',
    recommendedExperience: 'Never written SQL',
    sqlConcepts: ['SELECT', 'WHERE', 'LIMIT'],
    detectiveConcept: 'Reading a record',
    learningGoals: [
      'Run a query and read what comes back.',
      'Narrow a table down with a single WHERE.',
      'Take one fact from a statement and use it to rule someone out.',
    ],
    preview: 'Confidential research papers were copied from a locked university office. Nothing was forced and nothing was carried away. Three people were in the building, and every door keeps a record.',
    victim: 'Professor Sarah Collins',
    date: 'September 15, 2026',
    time: '6:52 PM',
    location: 'Hawthorne University · North Wing, Office N-118',
    witnesses: 'Professor Collins herself, a research assistant, and the night porter.',
    crimeScene: 'An undamaged card-controlled door, a locked drawer with nothing missing from it, and a photocopier still warm two doors along.',
    evidence: 'The door reader logged every card presented to it that evening, and the copy room machine counted the pages.',
    // A theft has no victim record to pull, and the tutorial should not ask for
    // constructs it never teaches, so the ladder is five one-query steps.
    objectives: ['suspects', 'witnesses', 'evidence', 'access', 'accusation'],
    starterQuery: '-- Case 01 · Three people were in the North Wing. Start with the roster.\nSELECT * FROM suspects;',
    theme: { accent: 'gold', icon: 'GraduationCap' },
    thresholds: {
      readiness: { discoveries: 8, sources: 3, suspects: 2, requireVictim: false, allowRepeatAccusation: true },
      verdict: { citations: 1, discoveries: 8, sources: 3, timeline: 2 },
    },
  }),

  defineCase({
    id: 'easy',
    order: 2,
    slug: 'dormitory-murder',
    tier: 'Easy',
    tierRank: 2,
    caseNumber: 'Case 02',
    title: 'The Dormitory Murder',
    database: 'easy.db',
    estimatedTime: '20 Minutes',
    recommendedExperience: 'Knows SELECT',
    sqlConcepts: ['SELECT', 'WHERE', 'ORDER BY', 'LIMIT', 'COUNT'],
    detectiveConcept: 'Absence as evidence',
    learningGoals: [
      'Read a table and recognise a row as a fact.',
      'Narrow a result set with WHERE.',
      'Notice who is missing from a set of records.',
    ],
    preview: 'A professor is stabbed during a ten-minute campus blackout. Five people were in the building. Four of them are on camera. Find the fifth.',
    victim: 'Professor Ethan Ross',
    date: 'October 14, 2026',
    time: '10:18 PM',
    location: 'Hawthorne University · North Hall, Office 204',
    witnesses: 'A research assistant, a lab technician, a graduate student, a security officer, and the department secretary.',
    crimeScene: 'An unlocked office with no forced entry, a wiped knife handle, and a monitor cable pulled at 10:18 PM.',
    evidence: 'Camera footage, badge records, and a fingerprint on a window that one suspect swears he never touched.',
    starterQuery: '-- Case 02 · Five people were in North Hall. Start with the roster.\nSELECT name, occupation FROM suspects;',
    theme: { accent: 'gold', icon: 'GraduationCap' },
    thresholds: {
      readiness: { discoveries: 15, sources: 4, suspects: 3 },
      verdict: { citations: 2, discoveries: 15, sources: 4, timeline: 4 },
    },
  }),

  defineCase({
    id: 'medium',
    order: 3,
    slug: 'blackwood-hill',
    tier: 'Hard',
    tierRank: 4,
    caseNumber: 'Case 03',
    title: 'The Mansion at Blackwood Hill',
    database: 'medium.db',
    estimatedTime: '35 Minutes',
    recommendedExperience: 'Comfortable joining tables',
    sqlConcepts: ['JOIN', 'LEFT JOIN', 'GROUP BY', 'HAVING', 'BETWEEN'],
    detectiveConcept: 'Contradiction',
    learningGoals: [
      'Relate two tables with an INNER JOIN.',
      'Find the row with no match using a LEFT JOIN.',
      'Filter grouped results with HAVING.',
    ],
    preview: 'Arthur Blackwood announced a new will over dinner and was dead within the hour. The study door log names his estate manager — but she was in the garage on camera at the time.',
    victim: 'Arthur Blackwood',
    date: 'November 03, 2026',
    time: '9:47 PM',
    location: 'Blackwood Estate · West Sussex',
    witnesses: 'The widow, the son, the daughter, the family solicitor, the butler, the estate manager, and the business partner.',
    crimeScene: 'A fob-controlled study with no camera inside. An open safe behind a portrait, and a mantel clock stopped at 9:47.',
    evidence: 'One page of the new will is printed on different paper. Work out who benefits from that page and you have your motive.',
    starterQuery: '-- Case 03 · Seven suspects, one fob-controlled study. Start with the roster.\nSELECT name, occupation FROM suspects;',
    theme: { accent: 'crimson', icon: 'Landmark' },
    thresholds: {
      readiness: { discoveries: 20, sources: 5, suspects: 4 },
      verdict: { citations: 3, discoveries: 28, sources: 6, timeline: 8 },
    },
  }),

  defineCase({
    id: 'expert',
    order: 4,
    slug: 'aurelian-job',
    tier: 'Expert',
    tierRank: 5,
    caseNumber: 'Case 04',
    title: 'The Aurelian Job',
    database: 'expert.db',
    estimatedTime: '60 Minutes',
    recommendedExperience: 'Confident across joins',
    sqlConcepts: ['Multi-table JOINs', 'Subqueries', 'CTEs', 'Date arithmetic'],
    detectiveConcept: 'Tampering',
    learningGoals: [
      'Compose a query from a CTE.',
      'Correct a systematic error with date arithmetic.',
      'Treat a record as something that can itself be altered.',
    ],
    preview: 'A CEO is killed hours before she was due to name the person who stole her company\'s designs. Nine suspects, one ship, and nobody went ashore.',
    victim: 'Celia Voss',
    date: 'December 19, 2026',
    time: '1:07 AM',
    location: 'M/V Aurelian · Adriatic Sea',
    witnesses: 'Her husband, four executives, an investor, and three of the ship\'s crew.',
    crimeScene: 'A suite with no camera and no forced entry, an open safe with only one document missing, and an access panel found hanging open two decks below.',
    evidence: 'The badge log and the camera disagree about when people were on Deck 7. Only one of them was tampered with, and only three accounts could have done it.',
    starterQuery: '-- Case 04 · Nine suspects, one ship, nobody went ashore. Start with the roster.\nSELECT name, occupation FROM suspects;',
    theme: { accent: 'crimson', icon: 'Ship' },
    thresholds: {
      readiness: { discoveries: 25, sources: 6, suspects: 5 },
      verdict: { citations: 4, discoveries: 35, sources: 7, timeline: 10 },
    },
  }),
];

/** Cases whose database exists, in unlock order. */
export const availableCases = caseCatalog
  .filter((entry) => entry.status === 'available')
  .sort((a, b) => a.order - b.order);

/** Unlock order as plain ids — what the progression store iterates. */
export const caseOrder = availableCases.map((entry) => entry.id);

const byId = new Map(caseCatalog.map((entry) => [entry.id, entry]));

/** @returns {CaseEntry|null} */
export function getCase(id) {
  return byId.get(id) ?? null;
}

export function getCaseThresholds(id) {
  return getCase(id)?.thresholds ?? defaults.thresholds;
}

export function getStarterQuery(id) {
  return getCase(id)?.starterQuery ?? defaults.starterQuery;
}

export function getObjectiveIds(id) {
  return getCase(id)?.objectives ?? defaults.objectives;
}

/** The case that follows this one, or null at the end of the chain. */
export function getNextCase(id) {
  const entry = getCase(id);
  if (!entry) return null;
  return availableCases.find((candidate) => candidate.order === entry.order + 1) ?? null;
}

/** The case that must be solved before this one opens, or null for the first. */
export function getPreviousCase(id) {
  const entry = getCase(id);
  if (!entry) return null;
  return availableCases.find((candidate) => candidate.order === entry.order - 1) ?? null;
}
