import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { env } from '../config/env.js';

let database;

export function getDatabase() {
  if (database) return database;

  fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });
  database = new sqlite3.Database(env.databasePath);
  database.exec('PRAGMA foreign_keys = ON;');
  return database;
}

export function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (!database) return resolve();
    database.close((error) => (error ? reject(error) : resolve()));
  });
}
