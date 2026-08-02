import { caseTables } from './sqlInsights';
import { thinCategories, unexploredCategories } from './investigationCategories';

/**
 * Contextual hints.
 *
 * A hint is chosen at the moment it is taken, against the state of the
 * investigation right then — so it can never send a player somewhere they have
 * already been. If the witness statements are already on file, no hint will
 * suggest reading the witnesses; it will point at whatever the file is actually
 * missing instead.
 *
 * Two things are deliberately unchanged from the fixed ladder this replaces.
 * The budget is still the number of hints the case author wrote (four, for
 * every current case), so taking hints costs exactly what it always did. And
 * no hint names a person, states a conclusion, or characterises what a record
 * will show — the most any of them does is point at a table, or at a way of
 * narrowing one.
 *
 * Because a hint is picked when it is taken rather than read from a fixed
 * list, the text is stored on the session as it is revealed. That is what
 * keeps a hint the player already paid for from changing under them later.
 */

/** Which known tables a piece of hint text refers to. */
function mentionedTables(text) {
  const haystack = String(text ?? '').toLowerCase();
  return caseTables.filter((table) => haystack.includes(table));
}

/**
 * An authored hint is spent when every table it points at has already been
 * read in full — following it could not tell the player anything new.
 */
function isSpent(hint, categories) {
  const tables = mentionedTables(hint);
  if (tables.length === 0) return false;
  const exhausted = new Set(
    categories.filter((category) => category.isExhausted).flatMap((category) => category.tables),
  );
  return tables.every((table) => exhausted.has(table));
}

/**
 * Picks the most useful hint available right now.
 *
 * @param {object} input
 * @param {string[]} input.authored   the case's own hint ladder, in order
 * @param {object[]} input.categories buildCategoryProgress output
 * @param {string[]} input.features   SQL features used so far
 * @param {string[]} input.taken      hint text already revealed this session
 * @returns {string|null} null when there is genuinely nothing left to suggest
 */
export function nextHint({ authored = [], categories = [], features = [], taken = [] }) {
  const alreadyTaken = new Set(taken);
  const unused = (text) => typeof text === 'string' && text.trim() !== '' && !alreadyTaken.has(text);

  // 1. A whole line of enquiry that has not been opened at all is always the
  //    most valuable thing to point at, heaviest category first.
  for (const category of unexploredCategories(categories)) {
    if (unused(category.lead)) return category.lead;
  }

  // 2. The events are on file but have never been put in order. This is the
  //    one technique nudge worth spending a hint on, because the chronology is
  //    what most cases turn on.
  const timeline = categories.find((category) => category.id === 'timeline');
  if (timeline?.isUnlocked && !features.includes('order_by')) {
    const nudge = 'You are holding dated records but have never sorted them. ORDER BY turns a log into a timeline.';
    if (unused(nudge)) return nudge;
  }

  // 3. Case-specific guidance, skipping anything that points at ground the
  //    player has already covered completely.
  const live = authored.filter((hint) => unused(hint) && !isSpent(hint, categories));
  if (live.length > 0) return live[0];

  // 4. A line of enquiry that was opened and then left thin.
  for (const category of thinCategories(categories)) {
    const nudge = `Your ${category.label.toLowerCase()} are thin — ${category.recovered} of ${category.total} on file. There is more in that table than you have pulled.`;
    if (unused(nudge)) return nudge;
  }

  // 5. Authored hints that were skipped as spent, rather than leaving somebody
  //    who paid for a hint with nothing at all.
  const spent = authored.find((hint) => unused(hint));
  if (spent) return spent;

  // 6. Everything has been opened and read. What is left is genuinely the
  //    reading, and saying so is more honest than inventing another nudge.
  const closing = 'Your file covers every line of enquiry this case offers. What is left is comparing the records you hold against each other.';
  return unused(closing) ? closing : null;
}

/**
 * How many hints this case will hand out. Unchanged from the authored ladder,
 * so the scoring cost of hints is exactly what it was before hints became
 * contextual.
 */
export function hintBudget(authored = []) {
  return authored.length;
}
