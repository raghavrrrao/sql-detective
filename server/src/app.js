import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { healthRouter } from './routes/healthRoutes.js';
import { caseRouter } from './routes/caseRoutes.js';
import { queryRouter } from './routes/queryRoutes.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRouter);
app.use('/api/case', caseRouter);
app.use('/api/query', queryRouter);
app.use(notFound);
app.use(errorHandler);
