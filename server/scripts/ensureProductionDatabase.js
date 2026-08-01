import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(currentDirectory, '../..');
const databaseDirectory = path.join(repositoryDirectory, 'database');
const requiredFiles = ['beginner.db', 'easy.db', 'intermediate.db', 'medium.db', 'expert.db'];

const missing = requiredFiles.filter((fileName) => !fs.existsSync(path.join(databaseDirectory, fileName)));
if (missing.length > 0) {
  console.error(`Missing production databases: ${missing.join(', ')}`);
  process.exit(1);
}
