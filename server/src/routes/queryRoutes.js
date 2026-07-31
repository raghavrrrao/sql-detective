import { Router } from 'express';
import { runQuery } from '../controllers/queryController.js';

export const queryRouter = Router();
queryRouter.post('/', runQuery);
