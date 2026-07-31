import { app } from './app.js';
import { env } from './config/env.js';
import { closeDatabase, getDatabase } from './database/connection.js';

// Open SQLite before listening so startup failures are surfaced immediately.
getDatabase();

const server = app.listen(env.port, () => {
  console.info(`SQL Detective API listening on port ${env.port}`);
});

async function shutdown(signal) {
  console.info(`${signal} received; closing SQL Detective API.`);
  server.close(async () => {
    try {
      await closeDatabase();
      process.exit(0);
    } catch (error) {
      console.error('Failed to close SQLite connection.', error);
      process.exit(1);
    }
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
