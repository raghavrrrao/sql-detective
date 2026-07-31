import { largestGap } from './investigationTimeline';

/**
 * Detective observations.
 *
 * Every rule below looks at which *categories* of record the player holds and
 * which they do not. None of them read the contents of a record, compare two
 * records against each other, or name a person as interesting. An insight can
 * therefore suggest where to look next, but can never carry a conclusion.
 */

const GAP_MINUTES = 12;

const has = (tables, name) => tables.includes(name);
const hasAny = (tables, names) => names.some((name) => tables.includes(name));

export function buildInsights({ tables = [], discoveries = [], timeline = [], intel = [], primeSuspect = null }) {
  const insights = [];
  const add = (id, tone, text) => insights.push({ id, tone, text });

  if (discoveries.length === 0) {
    add('start', 'prompt', 'Nothing is on file yet. Every record you recover from the database lands here.');
    return insights;
  }

  if (!has(tables, 'victims')) {
    add('victim', 'prompt', 'You have not opened the victim record. The time and place of death anchor everything else.');
  }

  if (has(tables, 'witnesses') && !hasAny(tables, ['cctv_logs', 'access_logs', 'phone_logs'])) {
    add('statements', 'compare', 'You are holding witness statements and nothing machine-generated. These statements deserve comparison against something that was recorded automatically.');
  }

  if (has(tables, 'access_logs') && !has(tables, 'cctv_logs')) {
    add('badges', 'compare', 'These badge records may be useful lined up against the camera log for the same stretch of the evening.');
  }

  if (has(tables, 'cctv_logs') && !has(tables, 'access_logs')) {
    add('cameras', 'compare', 'You have camera entries but no badge records. Doors and cameras rarely cover exactly the same ground.');
  }

  if (hasAny(tables, ['documents', 'emails']) && !has(tables, 'witnesses')) {
    add('paperwork', 'compare', 'Paperwork is on file but nobody has been interviewed yet. Statements often explain who wanted a document written.');
  }

  if (has(tables, 'fingerprints')) {
    add('forensics', 'compare', 'You have forensic matches. Check those names against the records that place people somewhere.');
  }

  const gap = largestGap(timeline);
  if (gap && gap.minutes >= GAP_MINUTES) {
    add('gap', 'gap', `Your reconstructed timeline jumps ${gap.minutes} minutes between ${gap.from} and ${gap.to}. Nothing you have recovered covers that stretch.`);
  }

  // People turning up in records whose own file has never been queried.
  const named = new Set();
  discoveries.forEach((record) => record.suspects.forEach((name) => named.add(name)));
  const unopened = intel.filter((profile) => named.has(profile.name) && !profile.sources.includes('suspects'));
  if (unopened.length > 0) {
    add('files', 'prompt', `${unopened.length} ${unopened.length === 1 ? 'person appears' : 'people appear'} in your records but ${unopened.length === 1 ? 'their' : 'their'} suspect file has not been opened.`);
  }

  const interesting = intel.filter((profile) => profile.earnedStatus === 'interest');
  if (interesting.length > 0 && !primeSuspect) {
    add('prime', 'prompt', `You have built a substantial file on ${interesting.length} ${interesting.length === 1 ? 'person' : 'people'}. Flagging a prime suspect keeps your own thinking straight — it changes nothing in the case.`);
  }

  if (timeline.length === 0 && discoveries.length > 3) {
    add('undated', 'prompt', 'Nothing you have recovered so far carries a timestamp. The log tables are where the chronology lives.');
  }

  // A file with no obvious hole still deserves a next step rather than silence.
  if (insights.length === 0) {
    add('compare', 'compare', 'Your file covers statements, machine records and physical evidence, and nothing obvious is missing from it. What is left is comparing the records against each other.');
  }

  return insights;
}
