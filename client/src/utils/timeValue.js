/**
 * One timestamp parser for the whole investigation.
 *
 * Case records are not uniform: log tables carry "2026-10-14 22:13:00" while a
 * victim record carries "2026-10-14" and "10:18 PM" separately. Both describe
 * the same kind of instant, so both have to land on the same scale before
 * anything sorts them or measures a distance between them.
 */

const STAMP = /^(?:(\d{4}-\d{2}-\d{2})[T ]?)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i;

/**
 * @returns {{minutes:number, dated:boolean, hours:number, minute:number}|null}
 *          minutes are absolute when a date is present, minutes-of-day otherwise
 */
export function parseStamp(value) {
  const raw = String(value ?? '').trim();
  if (raw === '') return null;

  const match = raw.match(STAMP);
  if (!match) return null;

  const [, date, rawHours, rawMinutes, , suffix] = match;
  let hours = Number(rawHours);
  const minute = Number(rawMinutes);
  if (Number.isNaN(hours) || Number.isNaN(minute) || hours > 23 || minute > 59) return null;

  if (suffix) {
    const isAfternoon = suffix.toLowerCase() === 'pm';
    if (hours === 12) hours = isAfternoon ? 12 : 0;
    else if (isAfternoon) hours += 12;
  }

  const minuteOfDay = hours * 60 + minute;
  if (!date) return { minutes: minuteOfDay, dated: false, hours, minute };

  const midnight = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(midnight)) return { minutes: minuteOfDay, dated: false, hours, minute };
  return { minutes: Math.floor(midnight / 60_000) + minuteOfDay, dated: true, hours, minute };
}

/** Renders any recognised stamp as a 24-hour clock so the timeline lines up. */
export function formatClock(value) {
  const parsed = parseStamp(value);
  if (!parsed) return String(value ?? '').trim();
  return `${String(parsed.hours).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`;
}

export function formatDay(value) {
  const [day] = String(value ?? '').trim().split(/[T ]/);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}
