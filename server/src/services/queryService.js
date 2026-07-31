import { env } from '../config/env.js';
import { closeDatabase, openReadOnlyCaseDatabase } from '../database/caseDatabase.js';
import { AppError } from '../utils/AppError.js';
import { validateReadOnlySql } from '../utils/sqlPolicy.js';

const timedOut = () => new AppError('Your query took too long to run. Try narrowing the result set.', 408);

/** Turns a raw SQLite driver error into a message a player can act on. */
function friendlyError(error) {
  if (error.code === 'SQLITE_INTERRUPT') return timedOut();
  const detail = String(error.message ?? '').replace(/^SQLITE_[A-Z]+:\s*/, '').trim();
  return new AppError(detail ? `SQL error: ${detail}` : 'The query could not be completed. Check the SQL syntax and try again.', 400);
}

/**
 * Runs the player's statement verbatim and stops stepping once the row cap is
 * reached. The statement is never wrapped in an outer SELECT, so JOIN result
 * columns keep the names SQLite actually produced.
 */
function runQuery(database, statement) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const rows = [];
    let prepared = null;
    let isPrepared = false;
    let settled = false;

    const settle = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const done = () => {
        if (error) return reject(error instanceof AppError ? error : friendlyError(error));
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        resolve({ columns, rows, rowCount: rows.length, executionTime: Math.round((performance.now() - startedAt) * 100) / 100 });
      };
      // Unfinalized statements block the connection from closing. A statement
      // that failed to compile has nothing to finalize and never calls back.
      if (isPrepared) prepared.finalize(() => done());
      else done();
    };

    const timeout = setTimeout(() => {
      if (settled) return;
      database.interrupt();
      settle(timedOut());
    }, env.queryTimeoutMs);

    const step = () => {
      prepared.get((error, row) => {
        if (settled) return;
        if (error) return settle(error);
        if (row === undefined) return settle(null);
        rows.push(row);
        if (rows.length >= env.queryRowLimit) return settle(null);
        step();
      });
    };

    prepared = database.prepare(statement, (error) => {
      if (error) return settle(error);
      isPrepared = true;
      if (settled) return prepared.finalize(() => undefined);
      step();
    });
  });
}

export async function executeInvestigationQuery(difficulty, sql) {
  const statement = validateReadOnlySql(sql);
  const database = openReadOnlyCaseDatabase(difficulty);
  if (!database) throw new AppError('The requested case database is unavailable.', 404);
  try {
    return await runQuery(database, statement);
  } finally {
    await closeDatabase(database);
  }
}
