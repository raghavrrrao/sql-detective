import { readJson, writeJson } from './storage';

const STORAGE_KEY = 'progress';

/** Case order drives the soft progression gate on the selection screen. */
export const caseOrder = ['easy', 'medium', 'expert'];

/**
 * Flip to false to unlock every case immediately (useful at events where
 * players drop in at any difficulty). Progression is purely a front-end
 * presentation gate — it never touches the API or the case databases.
 */
export const ENFORCE_PROGRESSION = true;

const readStore = () => readJson(STORAGE_KEY, {}) ?? {};

export function getProgress() {
  const store = readStore();
  return caseOrder.reduce((accumulator, key) => {
    accumulator[key] = store[key] ?? { opened: false, queries: 0 };
    return accumulator;
  }, {});
}

export function markCaseOpened(caseKey) {
  const store = readStore();
  const entry = store[caseKey] ?? { opened: false, queries: 0 };
  writeJson(STORAGE_KEY, { ...store, [caseKey]: { ...entry, opened: true } });
}

export function recordQueryRun(caseKey) {
  const store = readStore();
  const entry = store[caseKey] ?? { opened: false, queries: 0 };
  writeJson(STORAGE_KEY, { ...store, [caseKey]: { ...entry, opened: true, queries: entry.queries + 1 } });
}

export function isCaseLocked(caseKey, progress) {
  if (!ENFORCE_PROGRESSION) return false;
  const index = caseOrder.indexOf(caseKey);
  if (index <= 0) return false;
  return !progress[caseOrder[index - 1]]?.opened;
}

export function getCaseStatus(caseKey, progress) {
  const entry = progress[caseKey];
  if (!entry?.opened) return 'new';
  return entry.queries > 0 ? 'in-progress' : 'opened';
}
