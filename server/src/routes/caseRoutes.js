import { Router } from 'express';
import { getCaseBriefing } from '../controllers/caseController.js';

export const caseRouter = Router();
caseRouter.get('/:difficulty', getCaseBriefing);
