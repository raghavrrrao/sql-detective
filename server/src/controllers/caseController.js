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
    const [evidence, suspects, witnesses, crimeScene, timeline, documents, tableNames] = await Promise.all([
      all('SELECT id, title, category, description, discovered_at FROM evidence ORDER BY id LIMIT 12'),
      // `status` is deliberately not selected: it is a case-authoring column,
      // and the roster in the UI reflects the player's own progress instead.
      all('SELECT id, name, occupation FROM suspects ORDER BY id LIMIT 10'),
      all('SELECT id, name, relationship, statement FROM witnesses ORDER BY id LIMIT 8'),
      all('SELECT id, area, observation, recorded_at FROM crime_scene ORDER BY id LIMIT 6'),
      all('SELECT id, event_time, event_type, details FROM security_logs ORDER BY event_time LIMIT 8'),
      all('SELECT COUNT(*) AS total FROM documents'),
      all("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"),
    ]);

    // The board needs to be able to show a player who has never written SQL
    // which tables this case actually holds. Empty ones are left out: the
    // schema is shared across cases, so a theft has no victims to offer.
    const counted = await Promise.all(tableNames.map(async ({ name }) => {
      const [{ total }] = await all(`SELECT COUNT(*) AS total FROM "${name}"`);
      return { name, rowCount: total };
    }));
    const tables = counted.filter((table) => table.rowCount > 0);
    const notebook = [
      { id: 'evidence', title: 'Evidence', entries: evidence.map((item) => item.description) },
      { id: 'witnesses', title: 'Witnesses', entries: witnesses.map((item) => `${item.name}: ${item.statement}`) },
      { id: 'crime-scene', title: 'Crime Scene', entries: crimeScene.map((item) => `${item.area}: ${item.observation}`) },
      { id: 'timeline', title: 'Timeline', entries: timeline.map((item) => `${item.event_time}: ${item.details}`) },
      { id: 'notes', title: 'Notes', entries: metadata.initialNotebook },
    ];
    return response.json({ case: metadata, evidence, suspects, notebook, tables, documentCount: documents[0].total, initialNotebook: metadata.initialNotebook, timer: metadata.timer });
  } catch (error) {
    return next(error);
  } finally {
    await closeDatabase(database);
  }
}
