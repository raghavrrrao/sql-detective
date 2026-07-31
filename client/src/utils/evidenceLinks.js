import { parseStamp } from './timeValue';

/**
 * Evidence linking.
 *
 * Deliberately lightweight: two discoveries are related when they name the same
 * person, name the same place, or sit within a few minutes of each other. These
 * are surface facts about records the player already holds — the links suggest
 * what to compare, never what the comparison will show.
 */

const NEAR_MINUTES = 10;
const MAX_LINKS = 6;

/** Only fully dated stamps can be compared; a bare clock has no day to sit on. */
function minutesOf(value) {
  const parsed = parseStamp(value);
  return parsed?.dated ? parsed.minutes : null;
}

const reasonLabels = {
  person: 'Same person',
  place: 'Same place',
  time: 'Close in time',
};

/**
 * @returns {Array<{record: object, reasons: string[]}>} related discoveries
 */
export function relatedDiscoveries(record, all) {
  if (!record) return [];
  const minutes = minutesOf(record.occurredAt);
  const links = [];

  for (const other of all) {
    if (other.key === record.key) continue;
    const reasons = [];

    if (record.suspects.length > 0 && other.suspects.some((name) => record.suspects.includes(name))) {
      reasons.push('person');
    }
    if (record.location && other.location && record.location === other.location) {
      reasons.push('place');
    }
    const otherMinutes = minutesOf(other.occurredAt);
    if (minutes !== null && otherMinutes !== null && Math.abs(minutes - otherMinutes) <= NEAR_MINUTES) {
      reasons.push('time');
    }

    if (reasons.length > 0) links.push({ record: other, reasons, weight: reasons.length });
  }

  return links
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_LINKS)
    .map(({ record: related, reasons }) => ({ record: related, reasons: reasons.map((key) => reasonLabels[key]) }));
}
