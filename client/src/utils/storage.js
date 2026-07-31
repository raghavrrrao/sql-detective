const NAMESPACE = 'sql-detective';

/**
 * Every persisted value in the game goes through here. localStorage throws in
 * private-browsing modes and during SSR there is no window at all, so each
 * helper degrades to "no save" rather than taking the investigation down.
 */
function getStore() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readJson(key, fallback) {
  const store = getStore();
  if (!store) return fallback;
  try {
    const raw = store.getItem(`${NAMESPACE}:${key}`);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  const store = getStore();
  if (!store) return false;
  try {
    store.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded or a locked-down browser: the session simply stays in memory.
    return false;
  }
}

