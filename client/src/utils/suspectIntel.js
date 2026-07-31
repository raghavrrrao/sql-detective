import { machineRecordTables } from './discovery';

/**
 * Suspect intelligence.
 *
 * A profile reflects how much the *player* has gathered about a person and
 * nothing else. There is no reading of alibis, no notion of who is lying, and
 * no path by which the solution can influence a status. Two of the five states
 * are the player's own judgement; the rest are a measure of file size.
 */

/** A file this size, spread this wide, is substantial enough to stand out. */
const INTEREST_MIN_RECORDS = 5;
const INTEREST_MIN_SOURCES = 3;

export const suspectStatuses = {
  unknown: {
    label: 'Unknown',
    tone: 'unknown',
    blurb: 'Nothing on file yet. Query a table that names this person.',
  },
  investigated: {
    label: 'Investigated',
    tone: 'investigated',
    blurb: 'You have pulled records that mention this person.',
  },
  interest: {
    label: 'Person of Interest',
    tone: 'interest',
    blurb: 'You have gathered a substantial file from several different sources.',
  },
  cleared: {
    label: 'Cleared',
    tone: 'cleared',
    blurb: 'You marked this person as accounted for.',
  },
  prime: {
    label: 'Prime Suspect',
    tone: 'prime',
    blurb: 'Your working theory. This changes nothing in the case.',
  },
};

const emptyFile = { count: 0, tables: [], firstAt: null, lastAt: null };

/** The automatic part of the ladder: volume and breadth of what has been found. */
export function earnedStatus(file) {
  if (!file || file.count === 0) return 'unknown';
  if (file.count >= INTEREST_MIN_RECORDS && file.tables.length >= INTEREST_MIN_SOURCES) return 'interest';
  return 'investigated';
}

/**
 * @returns {Array<object>} one profile per roster entry, in roster order
 */
export function buildSuspectIntel({ suspects, suspectFiles = {}, primeSuspect = null, cleared = [] }) {
  return suspects.map((suspect) => {
    const file = suspectFiles[suspect.name] ?? emptyFile;
    const earned = earnedStatus(file);

    // The two player judgements sit on top of the earned ladder.
    const status = primeSuspect === suspect.name
      ? 'prime'
      : cleared.includes(suspect.name)
        ? 'cleared'
        : earned;

    return {
      name: suspect.name,
      occupation: suspect.occupation,
      status,
      earnedStatus: earned,
      isPrime: primeSuspect === suspect.name,
      isCleared: cleared.includes(suspect.name),
      recordCount: file.count,
      sources: file.tables,
      firstAt: file.firstAt,
      lastAt: file.lastAt,
      // Clearing needs something that physically places them somewhere.
      canClear: file.tables.some((table) => machineRecordTables.includes(table)),
      toInterest: Math.max(0, INTEREST_MIN_RECORDS - file.count),
    };
  });
}

/** Incrementally folds new discoveries into the per-person file counts. */
export function applyDiscoveriesToFiles(files, added) {
  if (added.length === 0) return files;
  let next = files;
  let changed = false;

  for (const record of added) {
    for (const name of record.suspects) {
      const current = next[name] ?? emptyFile;
      const tables = current.tables.includes(record.table) ? current.tables : [...current.tables, record.table];
      if (!changed) { next = { ...next }; changed = true; }
      next[name] = {
        count: current.count + 1,
        tables,
        firstAt: current.firstAt ?? record.at,
        lastAt: record.at,
      };
    }
  }
  return next;
}
