const NAMESPACE = 'sql-detective';

/**
 * Every persisted value in the game goes through here. localStorage throws in
 * private-browsing modes and during SSR there is no window at all, so each
 * helper degrades to "no save" rather than taking the investigation down.
 *
 * Keys are written under an active *scope*. Personal play uses the empty
 * scope, so its keys are exactly what they always were; festival play writes
 * under `festival:`. That makes the isolation structural rather than a matter
 * of remembering to clean up — a festival session physically cannot reach a
 * personal save, and wiping a scope cannot touch the other one.
 *
 * Settings and the leaderboard are deliberately outside the scope: they belong
 * to the machine, not to a participant, and must survive every reset.
 */
let activeScope = '';

export function setStorageScope(scope) {
  activeScope = scope ?? '';
}

export function getStorageScope() {
  return activeScope;
}

function getStore() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

const fullKey = (key, global) => `${NAMESPACE}:${global ? '' : activeScope}${key}`;

function read(key, fallback, global) {
  const store = getStore();
  if (!store) return fallback;
  try {
    const raw = store.getItem(fullKey(key, global));
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value, global) {
  const store = getStore();
  if (!store) return false;
  try {
    store.setItem(fullKey(key, global), JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded or a locked-down browser: the session stays in memory.
    return false;
  }
}

function remove(key, global) {
  const store = getStore();
  if (!store) return;
  try {
    store.removeItem(fullKey(key, global));
  } catch {
    /* Nothing to recover from — the key is already unreachable. */
  }
}

/* ------------------------------------------------------------- scoped keys */

export const readJson = (key, fallback) => read(key, fallback, false);
export const writeJson = (key, value) => write(key, value, false);
export const removeKey = (key) => remove(key, false);

/* -------------------------------------------- machine-wide keys, unscoped */

export const readGlobalJson = (key, fallback) => read(key, fallback, true);
export const writeGlobalJson = (key, value) => write(key, value, true);
export const removeGlobalKey = (key) => remove(key, true);

/** The complete set of scopes. Personal is the empty prefix by design. */
export const SCOPES = { personal: '', festival: 'festival:' };

/** Keys that belong to the machine and outlive every reset. */
const GLOBAL_KEYS = ['settings', 'leaderboard'];

/**
 * Wipes every key belonging to one scope. Used to hand the machine to the next
 * participant without touching settings, the leaderboard, or anything saved by
 * someone playing in personal mode.
 *
 * @param {string} scope
 * @param {{keep?: string[]}} [options] unscoped key names to leave alone
 * @returns {number} how many keys were removed
 */
export function clearScope(scope = '', { keep = [] } = {}) {
  const store = getStore();
  if (!store) return 0;
  // The personal scope is the empty prefix, so every other scope's keys would
  // otherwise look like personal keys. Skip them explicitly.
  const foreignPrefixes = Object.values(SCOPES).filter((value) => value !== '' && value !== scope);

  try {
    const doomed = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (!key || !key.startsWith(`${NAMESPACE}:`)) continue;

      const rest = key.slice(NAMESPACE.length + 1);
      if (GLOBAL_KEYS.includes(rest)) continue;
      if (!rest.startsWith(scope)) continue;
      // Named survivors: clearing an investigation should not also make the
      // game forget that this player has already been trained.
      if (keep.includes(rest.slice(scope.length))) continue;
      if (foreignPrefixes.some((prefix) => rest.startsWith(prefix))) continue;

      doomed.push(key);
    }
    doomed.forEach((key) => store.removeItem(key));
    return doomed.length;
  } catch {
    return 0;
  }
}
