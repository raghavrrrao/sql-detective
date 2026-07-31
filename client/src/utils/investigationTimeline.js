import { formatClock, formatDay, parseStamp } from './timeValue';

/**
 * Timeline reconstruction.
 *
 * The chronology is assembled purely from discoveries that carry their own
 * timestamp, so it grows only as the player pulls dated records out of the
 * database. Nothing is seeded and nothing is inferred.
 */

const UNPLACEABLE = Number.MAX_SAFE_INTEGER;

/**
 * @returns {Array<object>} dated discoveries, earliest first
 */
export function buildTimeline(discoveries) {
  return discoveries
    .filter((record) => record.occurredAt)
    .map((record) => {
      const parsed = parseStamp(record.occurredAt);
      return {
        id: record.key,
        at: record.occurredAt,
        clock: formatClock(record.occurredAt),
        day: formatDay(record.occurredAt),
        title: record.title,
        source: record.table,
        location: record.location,
        suspects: record.suspects,
        confidence: record.confidence,
        // Only fully dated records can be measured against each other.
        sortKey: parsed ? parsed.minutes : UNPLACEABLE,
        isDated: Boolean(parsed?.dated),
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);
}

/**
 * Reports the largest quiet stretch in what has been reconstructed so far.
 * This measures the player's coverage, not the case — a gap simply means no
 * dated record has been recovered for that stretch yet.
 */
export function largestGap(timeline) {
  // A record with a time but no date cannot be placed against a dated one.
  const placed = timeline.filter((event) => event.isDated);
  if (placed.length < 2) return null;

  let best = null;
  for (let index = 1; index < placed.length; index += 1) {
    const previous = placed[index - 1];
    const current = placed[index];
    const minutes = current.sortKey - previous.sortKey;
    if (minutes > 0 && (!best || minutes > best.minutes)) {
      best = { minutes, from: previous.clock, to: current.clock };
    }
  }
  return best;
}

export { formatClock, formatDay };
