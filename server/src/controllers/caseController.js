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
    const [evidence, suspects, witnesses, crimeScene, timeline, documents] = await Promise.all([
      all('SELECT id, title, category, description, discovered_at FROM evidence ORDER BY id LIMIT 12'),
      all('SELECT id, name, occupation, status FROM suspects ORDER BY id LIMIT 10'),
      all('SELECT id, name, relationship, statement FROM witnesses ORDER BY id LIMIT 8'),
      all('SELECT id, area, observation, recorded_at FROM crime_scene ORDER BY id LIMIT 6'),
      all('SELECT id, event_time, event_type, details FROM security_logs ORDER BY event_time LIMIT 8'),
      all('SELECT COUNT(*) AS total FROM documents'),
    ]);
    const notebook = [
      { id: 'evidence', title: 'Evidence', entries: evidence.map((item) => item.description) },
      { id: 'witnesses', title: 'Witnesses', entries: witnesses.map((item) => `${item.name}: ${item.statement}`) },
      { id: 'crime-scene', title: 'Crime Scene', entries: crimeScene.map((item) => `${item.area}: ${item.observation}`) },
      { id: 'timeline', title: 'Timeline', entries: timeline.map((item) => `${item.event_time}: ${item.details}`) },
      { id: 'notes', title: 'Notes', entries: metadata.initialNotebook },
    ];
    const inventory = [
      { name: 'Keys', detail: 'Access records', tone: 'text-amber-300' },
      { name: 'Documents', detail: `${documents[0].total} catalogued`, tone: 'text-sky-300' },
      { name: 'USB Drive', detail: 'Encrypted', tone: 'text-violet-300' },
      { name: 'Fingerprint', detail: 'Partial match', tone: 'text-red-300' },
    ];
    return response.json({ case: metadata, evidence, suspects, notebook, inventory, initialNotebook: metadata.initialNotebook, timer: metadata.timer });
  } catch (error) {
    return next(error);
  } finally {
    await closeDatabase(database);
  }
}
