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
 * @property {string[]} detectiveSkills   what the card lists under Detective skills
 * @property {string[]} learningGoals
 * @property {string[]} hints         progressive nudges, never an answer
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
  detectiveSkills: [],
  learningGoals: [],
  hints: [],
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
    routeSlug: 'beginner',
    tier: 'Beginner',
    tierRank: 1,
    caseNumber: 'Case 01',
    title: 'The Locked Office',
    database: 'beginner.db',
    estimatedTime: '10 Minutes',
    recommendedExperience: 'Never written SQL',
    sqlConcepts: ['SELECT', 'WHERE', 'LIMIT'],
    detectiveConcept: 'Reading a record',
    detectiveSkills: ['Read a record as a fact', 'Separate motive from opportunity'],
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
    hints: [
      'Start by finding out who was in the building. One table lists them.',
      'Doors keep records. There is a table for the cards presented to them.',
      'A statement fixes the last moment the papers were definitely there. Read the witnesses.',
      'Try narrowing the door records to the times after that moment.',
    ],
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
    routeSlug: 'easy',
    tier: 'Easy',
    tierRank: 2,
    caseNumber: 'Case 02',
    title: 'The Dormitory Murder',
    database: 'easy.db',
    estimatedTime: '20 Minutes',
    recommendedExperience: 'Knows SELECT',
    sqlConcepts: ['SELECT', 'WHERE', 'ORDER BY', 'LIMIT', 'COUNT'],
    detectiveConcept: 'Absence as evidence',
    detectiveSkills: ['Rule people out with records', 'Treat an absence as evidence'],
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
    objectives: ['victim', 'suspects', 'witnesses', 'evidence', 'access', 'timeline', 'accusation'],
    hints: [
      'Begin with the victim record. It fixes the time everything else is measured against.',
      'The cameras are the fastest way to account for people. Look at cctv_logs.',
      'Sort the camera entries by time and read them in order.',
      'Count how many camera sightings each person has before the time of death.',
    ],
    starterQuery: '-- Case 02 · Five people were in North Hall. Start with the roster.\nSELECT name, occupation FROM suspects;',
    theme: { accent: 'gold', icon: 'GraduationCap' },
    thresholds: {
      readiness: { discoveries: 15, sources: 4, suspects: 3 },
      verdict: { citations: 2, discoveries: 15, sources: 4, timeline: 4 },
    },
  }),

  defineCase({
    id: 'intermediate',
    order: 3,
    slug: 'gallery-theft',
    routeSlug: 'intermediate',
    tier: 'Intermediate',
    tierRank: 3,
    caseNumber: 'Case 03',
    title: 'The Gallery Theft',
    database: 'intermediate.db',
    estimatedTime: '25 Minutes',
    recommendedExperience: 'Comfortable filtering and sorting',
    sqlConcepts: ['GROUP BY', 'LIKE', 'BETWEEN', 'DISTINCT'],
    detectiveConcept: 'Corroboration',
    detectiveSkills: ['Cross-reference evidence', 'Timeline reconstruction', 'Contradictions'],
    learningGoals: [
      'Turn a long log into a short answer with GROUP BY.',
      'Narrow a count to the window that matters with BETWEEN.',
      'Match text with LIKE and strip repeats with DISTINCT.',
    ],
    preview: 'A painting was swapped for a forgery overnight inside a locked gallery. Six people had a card that works after hours, and the busiest person on the door log is not the one you want.',
    victim: 'Harbour at Dusk (Ashcroft Gallery)',
    date: 'June 10, 2026',
    time: '1:48 AM',
    location: 'Ashcroft Gallery · Riverside, Room 3',
    witnesses: 'The curator, the registrar, the night guard, the facilities supervisor, the morning porter, an independent conservator and the courier.',
    crimeScene: 'No forced entry, a wedged loading bay shutter, and a copy hanging on the original wire with the varnish still tacky.',
    evidence: 'The bay reader logged every card presented to it all night. Counting them is easy; counting the right window is the case.',
    objectives: ['suspects', 'witnesses', 'evidence', 'access', 'timeline', 'contradiction', 'accusation'],
    hints: [
      'Six people, one building, one night. Start with the roster and the statements.',
      'Every card presented to a door was logged. Counting them by person is a good first move.',
      'A guard walks the building all night, so an unfiltered count will always favour him. Narrow the window.',
      'The curator saw the original at eleven and the porter found the copy at twenty to eight. Count only what falls between.',
    ],
    starterQuery: '-- Case 03 · Six people had a card that works after hours.\nSELECT name, occupation FROM suspects;',
    theme: { accent: 'gold', icon: 'Frame' },
    thresholds: {
      readiness: { discoveries: 20, sources: 4, suspects: 4, requireVictim: false },
      verdict: { citations: 3, discoveries: 24, sources: 5, timeline: 6 },
    },
  }),

  defineCase({
    id: 'medium',
    order: 4,
    slug: 'blackwood-hill',
    routeSlug: 'hard',
    tier: 'Hard',
    tierRank: 4,
    caseNumber: 'Case 04',
    title: 'The Mansion at Blackwood Hill',
    database: 'medium.db',
    estimatedTime: '35 Minutes',
    recommendedExperience: 'Comfortable joining tables',
    sqlConcepts: ['JOIN', 'LEFT JOIN', 'GROUP BY', 'HAVING', 'BETWEEN'],
    detectiveConcept: 'Contradiction',
    detectiveSkills: ['Cross-reference witnesses', 'Detect contradictions', 'Timeline reconstruction'],
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
    hints: [
      'Seven people, one room with no camera. Start by placing everyone you can.',
      'The study door log names a card, not a hand. Read the witness statements.',
      'Relate the roster to the camera log and see who never appears.',
      'A LEFT JOIN will show you the person with no matching camera record.',
    ],
    starterQuery: '-- Case 04 · Seven suspects, one fob-controlled study. Start with the roster.\nSELECT name, occupation FROM suspects;',
    theme: { accent: 'crimson', icon: 'Landmark' },
    thresholds: {
      readiness: { discoveries: 20, sources: 5, suspects: 4 },
      verdict: { citations: 3, discoveries: 28, sources: 6, timeline: 8 },
    },
  }),

  defineCase({
    id: 'expert',
    order: 5,
    slug: 'aurelian-job',
    routeSlug: 'expert',
    tier: 'Expert',
    tierRank: 5,
    caseNumber: 'Case 05',
    title: 'The Aurelian Job',
    database: 'expert.db',
    estimatedTime: '60 Minutes',
    recommendedExperience: 'Confident across joins',
    sqlConcepts: ['Multi-table JOINs', 'Subqueries', 'CTEs', 'Date arithmetic'],
    detectiveConcept: 'Tampering',
    detectiveSkills: ['Detect a tampered record', 'Correct a systematic error', 'Build a case across many sources'],
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
    hints: [
      'Everyone was aboard. The question is where each of them was, not whether they left.',
      'Two systems recorded Deck 7 that night. Compare what each of them says.',
      'If two records of the same moment disagree, one of them was altered.',
      'Ask which accounts could change a reader clock, then correct the times with date arithmetic.',
    ],
    starterQuery: '-- Case 05 · Nine suspects, one ship, nobody went ashore. Start with the roster.\nSELECT name, occupation FROM suspects;',
    theme: { accent: 'crimson', icon: 'Ship' },
    thresholds: {
      readiness: { discoveries: 25, sources: 6, suspects: 5 },
      verdict: { citations: 4, discoveries: 35, sources: 7, timeline: 10 },
    },
  }),
];

/** Every slot the career contains, sealed ones included, in order. */
export const displayCases = [...caseCatalog].sort((a, b) => a.order - b.order);

/** Cases whose database exists, in unlock order. */
export const availableCases = displayCases.filter((entry) => entry.status === 'available');

/** Every slot as plain ids — what the progression store iterates. */
export const caseOrder = displayCases.map((entry) => entry.id);

export const isPlayable = (entry) => Boolean(entry) && entry.status === 'available';

const byId = new Map(caseCatalog.map((entry) => [entry.id, entry]));

/** @returns {CaseEntry|null} */
export function getCase(id) {
  return byId.get(id) ?? null;
}

export function resolveCaseRouteParam(value) {
  if (!value) return null;
  const exact = getCase(value);
  if (exact) return exact.id;
  const entry = caseCatalog.find((candidate) => candidate.routeSlug === value);
  return entry?.id ?? null;
}

export function getCaseRouteSlug(id) {
  const entry = getCase(id);
  return entry?.routeSlug ?? id;
}

export function getCaseRoutePath(id, prefix = 'case') {
  return `/${prefix}/${getCaseRouteSlug(id)}`;
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
  return displayCases.find((candidate) => candidate.order === entry.order + 1) ?? null;
}

/** The slot immediately before this one, sealed slots included. */
export function getPreviousCase(id) {
  const entry = getCase(id);
  if (!entry) return null;
  return displayCases.find((candidate) => candidate.order === entry.order - 1) ?? null;
}

/**
 * The case that actually has to be solved before this one opens.
 *
 * A sealed slot cannot be solved, so it is transparent to the chain: while
 * Intermediate has no content, Hard is gated on Easy. The moment Intermediate
 * becomes `available` it takes its place in the chain with no code change, and
 * anyone who already passed it keeps their unlock through the progress store.
 */
export function getUnlockGate(id) {
  const entry = getCase(id);
  if (!entry) return null;
  for (let position = entry.order - 1; position >= 1; position -= 1) {
    const candidate = displayCases.find((slot) => slot.order === position);
    if (isPlayable(candidate)) return candidate;
  }
  return null;
}
