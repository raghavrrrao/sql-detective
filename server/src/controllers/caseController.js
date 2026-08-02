import { getCaseMetadata } from '../config/caseMetadata.js';
import { closeDatabase, openReadOnlyCaseDatabase } from '../database/caseDatabase.js';
import { AppError } from '../utils/AppError.js';

export async function getCaseBriefing(request, response, next) {
  const { difficulty } = request.params;
  const metadata = getCaseMetadata(difficulty);
  if (!metadata) return next(new AppError('Unknown case difficulty.', 404));
  const database = openReadOnlyCaseDatabase(difficulty);
  if (!database) return next(new AppError('The requested case database is unavailable.', 404));
  try {
    const all = (sql) => new Promise((resolve, reject) => database.all(sql, (error, rows) => error ? reject(error) : resolve(rows)));
    const [suspects, tableNames] = await Promise.all([
      // `status` is deliberately not selected: it is a case-authoring column,
      // and the roster in the UI reflects the player's own progress instead.
      all('SELECT id, name, occupation FROM suspects ORDER BY id LIMIT 10'),
      all("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"),
    ]);

    // The board needs to be able to show a player who has never written SQL
    // which tables this case actually holds. Empty ones are left out: the
    // schema is shared across cases, so a theft has no victims to offer.
    //
    // These row counts are also the only denominators the client ever gets.
    // "3 / 8 recovered" is built from them, which is why the counts are sent
    // even though no row content is.
    const counted = await Promise.all(tableNames.map(async ({ name }) => {
      const [{ total }] = await all(`SELECT COUNT(*) AS total FROM "${name}"`);
      return { name, rowCount: total };
    }));
    const tables = counted.filter((table) => table.rowCount > 0);

    /*
     * The briefing carries the case folders but none of their contents.
     *
     * These sections used to arrive pre-filled with every evidence
     * description, every witness statement, the crime-scene observations and
     * the security log — which meant the case could be read end to end
     * without writing a single query, and SQL became an unlock button rather
     * than the investigation. Each folder now fills from the player's own
     * discoveries; the only thing handed over up front is the official leads.
     */
    const notebook = [
      { id: 'evidence', title: 'Evidence', entries: [] },
      { id: 'witnesses', title: 'Witnesses', entries: [] },
      { id: 'crime-scene', title: 'Crime Scene', entries: [] },
      { id: 'timeline', title: 'Timeline', entries: [] },
      { id: 'documents', title: 'Documents', entries: [] },
      { id: 'notes', title: 'Notes', entries: metadata.initialNotebook },
    ];
    const documentTable = tables.find((table) => table.name === 'documents');
    return response.json({ case: metadata, suspects, notebook, tables, documentCount: documentTable?.rowCount ?? 0, initialNotebook: metadata.initialNotebook, timer: metadata.timer });
  } catch (error) {
    return next(error);
  } finally {
    await closeDatabase(database);
  }
}
