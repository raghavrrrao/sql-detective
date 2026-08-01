import { readGlobalJson, removeGlobalKey, writeGlobalJson } from './storage';

/**
 * The festival leaderboard.
 *
 * It lives outside the storage scope on purpose: it belongs to the machine and
 * has to survive every "next detective" reset, every mode switch and every
 * personal-progress wipe. Only an explicit Clear Leaderboard removes it.
 */
const LEADERBOARD_KEY = 'leaderboard';
const LEADERBOARD_LIMIT = 200;
export const TOP_ENTRIES = 10;

const asArray = (value) => (Array.isArray(value) ? value : []);

/** Highest score first; a tie is broken by the faster time. */
function compare(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  return a.timeMs - b.timeMs;
}

export function getLeaderboard() {
  return asArray(readGlobalJson(LEADERBOARD_KEY, []))
    .filter((entry) => entry && typeof entry.name === 'string' && Number.isFinite(entry.score))
    .map((entry) => ({ ...entry, timeMs: Number.isFinite(entry.timeMs) ? entry.timeMs : 0 }))
    .sort(compare);
}

export function getTopEntries(limit = TOP_ENTRIES) {
  return getLeaderboard().slice(0, limit);
}

/**
 * Files a result and hands back where it landed.
 * @returns {{entry: object, rank: number, rankToday: number, total: number}}
 */
export function recordResult({ name, caseId, caseTitle, tier, timeMs, score, hintsUsed = 0, queries = 0, discoveries = 0 }) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    caseId,
    caseTitle,
    tier,
    timeMs,
    score,
    hintsUsed,
    queries,
    discoveries,
    completedAt: new Date().toISOString(),
  };

  const next = [...getLeaderboard(), entry].sort(compare).slice(0, LEADERBOARD_LIMIT);
  writeGlobalJson(LEADERBOARD_KEY, next);

  const today = new Date().toDateString();
  const todays = next.filter((row) => new Date(row.completedAt).toDateString() === today);

  return {
    entry,
    rank: next.findIndex((row) => row.id === entry.id) + 1,
    rankToday: todays.findIndex((row) => row.id === entry.id) + 1,
    total: next.length,
    totalToday: todays.length,
  };
}

export function clearLeaderboard() {
  removeGlobalKey(LEADERBOARD_KEY);
}

export { formatClock as formatDuration } from './clock';
