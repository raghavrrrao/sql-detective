import { AppError } from './AppError.js';

/**
 * Keywords that can never appear in a read-only investigation query. `end`,
 * `replace`, and `case` are deliberately absent: they are legal in SELECT
 * statements (`CASE … END`, `replace()`).
 */
const forbiddenKeywords = /\b(?:alter|analyze|attach|begin|commit|create|delete|detach|drop|insert|into|pragma|reindex|release|rollback|savepoint|truncate|update|vacuum)\b/i;
const leadingReadKeyword = /^(?:select\b|with\b|explain\s+(?:query\s+plan\s+)?(?:select|with)\b)/i;

const quoteTerminators = { "'": "'", '"': '"', '`': '`', '[': ']' };

/**
 * Blanks out comments and the *contents* of string literals and quoted
 * identifiers while preserving the original length, so every offset in the
 * result still maps to the same offset in the input. Keyword and statement
 * scanning then runs over SQL structure only, never over player-supplied text.
 */
function scrubLiteralsAndComments(sql) {
  const source = [...sql];
  const scrubbed = source.slice();
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '-' && next === '-') {
      while (index < source.length && source[index] !== '\n') scrubbed[index++] = ' ';
      continue;
    }

    if (character === '/' && next === '*') {
      const closing = sql.indexOf('*/', index + 2);
      if (closing === -1) throw new AppError('This query has an unclosed /* comment.', 400);
      while (index < closing + 2) scrubbed[index++] = ' ';
      continue;
    }

    const terminator = quoteTerminators[character];
    if (!terminator) {
      index += 1;
      continue;
    }

    index += 1;
    let closed = false;
    while (index < source.length) {
      if (source[index] === terminator) {
        // A doubled quote is an escaped quote, not the end of the literal.
        if (source[index + 1] === terminator && terminator !== ']') {
          scrubbed[index] = ' ';
          scrubbed[index + 1] = ' ';
          index += 2;
          continue;
        }
        index += 1;
        closed = true;
        break;
      }
      scrubbed[index] = ' ';
      index += 1;
    }
    if (!closed) throw new AppError(`This query has an unclosed ${character} quote.`, 400);
  }

  return scrubbed.join('');
}

/**
 * Allows one read-only SQLite statement. The database is opened read-only as a
 * second, independent enforcement layer; user SQL is never concatenated with
 * request values or database identifiers.
 */
export function validateReadOnlySql(sql) {
  if (typeof sql !== 'string' || !sql.trim()) throw new AppError('Enter a SQL query before running it.', 400);
  if (sql.length > 10_000) throw new AppError('Queries are limited to 10,000 characters.', 400);

  const scrubbed = scrubLiteralsAndComments(sql);

  // A semicolon only ends the statement; anything of substance after it is a
  // second statement. Trailing semicolons and blank lines are fine.
  const semicolon = scrubbed.indexOf(';');
  if (semicolon !== -1 && scrubbed.slice(semicolon + 1).trim()) {
    throw new AppError('Only one SQL statement may be executed at a time. Remove the extra query after the semicolon.', 400);
  }

  const end = semicolon === -1 ? sql.length : semicolon;
  const statement = sql.slice(0, end).trim();
  const structure = scrubbed.slice(0, end).trim();
  if (!structure) throw new AppError('Enter a SQL query before running it.', 400);

  if (forbiddenKeywords.test(structure)) throw new AppError('That statement is blocked. Investigation queries are read-only.', 403);
  if (!leadingReadKeyword.test(structure)) throw new AppError('Invalid SQL. Start with SELECT, WITH, or EXPLAIN.', 400);

  return statement;
}
