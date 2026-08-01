import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { env } from '../config/env.js';

const caseFiles = Object.freeze({ beginner: 'beginner.db', easy: 'easy.db', intermediate: 'intermediate.db', medium: 'medium.db', expert: 'expert.db' });

export function resolveCaseDatabase(difficulty) {
  const fileName = caseFiles[difficulty];
  if (!fileName) return null;
  const databasePath = path.join(env.caseDatabaseDirectory, fileName);
  return fs.existsSync(databasePath) ? databasePath : null;
}

export function openReadOnlyCaseDatabase(difficulty) {
  const databasePath = resolveCaseDatabase(difficulty);
  if (!databasePath) return null;

  const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
  database.configure('busyTimeout', env.queryTimeoutMs);
  return database;
}

export function closeDatabase(database) {
  return new Promise((resolve) => database.close(() => resolve()));
}
