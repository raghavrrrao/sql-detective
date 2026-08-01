import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverDirectory = path.resolve(currentDirectory, '../..');
const repositoryDirectory = path.resolve(serverDirectory, '..');

dotenv.config({ path: path.join(serverDirectory, '.env') });
dotenv.config({ path: path.join(repositoryDirectory, '.env') });

const port = Number.parseInt(process.env.PORT ?? '4000', 10);
const queryTimeoutMs = Number.parseInt(process.env.QUERY_TIMEOUT_MS ?? '2000', 10);
const queryRowLimit = Number.parseInt(process.env.QUERY_ROW_LIMIT ?? '200', 10);
const databasePath = process.env.DATABASE_PATH ?? '../database/sql-detective.sqlite';
const resolvedDatabasePath = path.isAbsolute(databasePath)
  ? databasePath
  : path.resolve(serverDirectory, databasePath);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port number.');
}

if (!Number.isInteger(queryTimeoutMs) || queryTimeoutMs < 100 || queryTimeoutMs > 10_000) {
  throw new Error('QUERY_TIMEOUT_MS must be between 100 and 10000.');
}

if (!Number.isInteger(queryRowLimit) || queryRowLimit < 1 || queryRowLimit > 5_000) {
  throw new Error('QUERY_ROW_LIMIT must be between 1 and 5000.');
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  clientOrigin: process.env.CLIENT_ORIGIN ?? '*',
  databasePath: resolvedDatabasePath,
  caseDatabaseDirectory: path.resolve(repositoryDirectory, 'database'),
  queryTimeoutMs,
  queryRowLimit,
});
