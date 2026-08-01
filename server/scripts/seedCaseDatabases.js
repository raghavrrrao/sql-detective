import fs from 'node:fs';
import { databaseDirectory } from './seedHelpers.js';
import { seedBeginnerDatabase } from './seedBeginnerDatabase.js';
import { seedEasyDatabase } from './seedEasyDatabase.js';
import { seedIntermediateDatabase } from './seedIntermediateDatabase.js';
import { seedMediumDatabase } from './seedMediumDatabase.js';
import { seedExpertDatabase } from './seedExpertDatabase.js';

// Every case is hand-authored. There is no generated data left in the project.
fs.mkdirSync(databaseDirectory, { recursive: true });

await seedBeginnerDatabase();
await seedEasyDatabase();
await seedIntermediateDatabase();
await seedMediumDatabase();
await seedExpertDatabase();
