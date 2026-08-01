import { availableCases, caseOrder, getPreviousCase } from '../catalog/caseCatalog';
import { readJson, removeKey, writeJson } from './storage';

const STORAGE_KEY = 'progress';
const PROGRESS_VERSION = 1;

export { caseOrder };

/**
 * Flip to false to unlock every case immediately (useful at events where
 * players drop in at any difficulty). Progression is purely a front-end
 * presentation gate — it never touches the API or the case databases.
 */
export const ENFORCE_PROGRESSION = true;

const blankEntry = {
  opened: false,
  queries: 0,
  solved: false,
  solvedAt: null,
  report: null,
  // Set only by the migration below, for cases a player had already reached
  // under the old "unlock on briefing opened" rule.
  unlockedLegacy: false,
};

/**
 * Reads the store, migrating the pre-v1 shape on the way.
 *
 * The old store was a bare `{ [caseId]: entry }` map and unlocked the next case
 * as soon as a briefing was *opened*. v1 unlocks on *solved*, which would
 * silently re-lock cases a player had already reached. Those cases are
 * grandfathered instead of taken away.
 */
function readStore() {
  const raw = readJson(STORAGE_KEY, null);
  if (!raw || typeof raw !== 'object') return { version: PROGRESS_VERSION, cases: {} };
  if (raw.version === PROGRESS_VERSION && raw.cases) return raw;

  // --- migrate v0 (bare map, opened-based unlocking) -> v1 -----------------
  const legacy = raw.cases ?? raw;
  const cases = {};
  for (const id of Object.keys(legacy)) {
    if (legacy[id] && typeof legacy[id] === 'object') cases[id] = { ...blankEntry, ...legacy[id] };
  }
  for (const entry of availableCases) {
    const previous = getPreviousCase(entry.id);
    const wasReachable = !previous || cases[previous.id]?.opened === true;
    const isSolvedNow = !previous || cases[previous.id]?.solved === true;
    if (wasReachable && !isSolvedNow) {
      cases[entry.id] = { ...blankEntry, ...cases[entry.id], unlockedLegacy: true };
    }
  }

  const migrated = { version: PROGRESS_VERSION, cases };
  writeJson(STORAGE_KEY, migrated);
  return migrated;
}

function update(caseKey, changes) {
  const store = readStore();
  const entry = { ...blankEntry, ...(store.cases[caseKey] ?? {}) };
  writeJson(STORAGE_KEY, {
    ...store,
    cases: { ...store.cases, [caseKey]: { ...entry, ...changes } },
  });
}

/** @returns {Record<string, typeof blankEntry>} one entry per catalogued case */
export function getProgress() {
  const store = readStore();
  return caseOrder.reduce((accumulator, key) => {
    accumulator[key] = { ...blankEntry, ...(store.cases[key] ?? {}) };
    return accumulator;
  }, {});
}

export function markCaseOpened(caseKey) {
  update(caseKey, { opened: true });
}

export function recordQueryRun(caseKey) {
  const store = readStore();
  const entry = { ...blankEntry, ...(store.cases[caseKey] ?? {}) };
  update(caseKey, { opened: true, queries: entry.queries + 1 });
}

/**
 * Records a solved case and the report that goes with it. The report is kept
 * outside the investigation session on purpose, so replaying the case wipes the
 * investigation without losing the debrief that was earned.
 */
export function markCaseSolved(caseKey, report) {
  update(caseKey, { opened: true, solved: true, solvedAt: report.solvedAt, report });
}

export function getCaseReport(caseKey) {
  return readStore().cases[caseKey]?.report ?? null;
}

/** Clears the investigation session only. Progress and the report survive. */
export function resetInvestigation(caseKey) {
  removeKey(`session:${caseKey}`);
}

/**
 * A case opens once the one before it has been *solved*. Reading a briefing no
 * longer unlocks anything — that was the old rule, and players who benefited
 * from it keep their access through `unlockedLegacy`.
 */
export function isCaseLocked(caseKey, progress) {
  if (!ENFORCE_PROGRESSION) return false;
  const previous = getPreviousCase(caseKey);
  if (!previous) return false;
  if (progress[caseKey]?.unlockedLegacy) return false;
  return !progress[previous.id]?.solved;
}

export function getCaseStatus(caseKey, progress) {
  const entry = progress[caseKey];
  if (entry?.solved) return 'solved';
  if (!entry?.opened) return 'new';
  return entry.queries > 0 ? 'in-progress' : 'opened';
}

/** How much of the whole game is closed — used by the selection screen. */
export function getCompletion(progress) {
  const solved = caseOrder.filter((id) => progress[id]?.solved).length;
  return { solved, total: caseOrder.length };
}
