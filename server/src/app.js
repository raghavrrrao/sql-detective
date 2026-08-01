import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { healthRouter } from './routes/healthRoutes.js';
import { caseRouter } from './routes/caseRoutes.js';
import { queryRouter } from './routes/queryRoutes.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverDirectory = path.resolve(currentDirectory, '..');
const repositoryDirectory = path.resolve(serverDirectory, '..');
const clientBuildDirectory = path.join(repositoryDirectory, 'client', 'dist');
const indexFile = path.join(clientBuildDirectory, 'index.html');

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.clientOrigin === '*' ? true : env.clientOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRouter);
app.use('/api/case', caseRouter);
app.use('/api/query', queryRouter);

if (fs.existsSync(clientBuildDirectory)) {
  app.use(express.static(clientBuildDirectory));
  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api/')) return next();
    if (request.path.includes('.')) return next();
    return response.sendFile(indexFile);
  });
}

app.use(notFound);
app.use(errorHandler);
