const STORAGE_KEY = 'sql-detective:progress';

/** Case order drives the soft progression gate on the selection screen. */
export const caseOrder = ['easy', 'medium', 'expert'];

/**
 * Flip to false to unlock every case immediately (useful at events where
 * players drop in at any difficulty). Progression is purely a front-end
 * presentation gate — it never touches the API or the case databases.
 */
export const ENFORCE_PROGRESSION = true;

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* Private browsing — progression simply resets each session. */
  }
}

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
  writeStore({ ...store, [caseKey]: { ...entry, opened: true } });
}

export function recordQueryRun(caseKey) {
  const store = readStore();
  const entry = store[caseKey] ?? { opened: false, queries: 0 };
  writeStore({ ...store, [caseKey]: { ...entry, opened: true, queries: entry.queries + 1 } });
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
