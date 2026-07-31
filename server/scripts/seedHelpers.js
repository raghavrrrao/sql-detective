import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

export const databaseDirectory = path.resolve(scriptDirectory, '../../database');

export const run = (database, sql, values = []) => new Promise((resolve, reject) => database.run(sql, values, (error) => error ? reject(error) : resolve()));
export const close = (database) => new Promise((resolve, reject) => database.close((error) => error ? reject(error) : resolve()));

/** Drops any existing case file and recreates it from the shared schema. */
export async function createCaseDatabase(fileName) {
  const databasePath = path.join(databaseDirectory, fileName);
  const schema = fs.readFileSync(path.join(databaseDirectory, 'case-schema.sql'), 'utf8');
  fs.rmSync(databasePath, { force: true });
  const database = new sqlite3.Database(databasePath);
  await new Promise((resolve, reject) => database.exec(schema, (error) => error ? reject(error) : resolve()));
  return database;
}

export async function insert(database, table, columns, rows) {
  const statement = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
  for (const row of rows) await run(database, statement, row);
}
