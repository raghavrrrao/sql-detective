import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverDirectory = path.resolve(currentDirectory, '../..');

dotenv.config({ path: path.join(serverDirectory, '.env') });

const required = ['PORT', 'CLIENT_ORIGIN', 'DATABASE_PATH'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT, 10),
  clientOrigin: process.env.CLIENT_ORIGIN,
  databasePath: path.resolve(serverDirectory, process.env.DATABASE_PATH),
  caseDatabaseDirectory: path.resolve(serverDirectory, '../database'),
  queryTimeoutMs: Number.parseInt(process.env.QUERY_TIMEOUT_MS ?? '2000', 10),
  queryRowLimit: Number.parseInt(process.env.QUERY_ROW_LIMIT ?? '200', 10),
});

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT must be a valid TCP port number.');
}

if (!Number.isInteger(env.queryTimeoutMs) || env.queryTimeoutMs < 100 || env.queryTimeoutMs > 10_000) {
  throw new Error('QUERY_TIMEOUT_MS must be between 100 and 10000.');
}

if (!Number.isInteger(env.queryRowLimit) || env.queryRowLimit < 1 || env.queryRowLimit > 5_000) {
  throw new Error('QUERY_ROW_LIMIT must be between 1 and 5000.');
}
