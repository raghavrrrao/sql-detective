import { getCaseMetadata } from '../config/caseMetadata.js';
import { executeInvestigationQuery } from '../services/queryService.js';
import { AppError } from '../utils/AppError.js';

export async function runQuery(request, response, next) {
  const { difficulty, sql } = request.body ?? {};
  if (!getCaseMetadata(difficulty)) return next(new AppError('Unknown case difficulty.', 404));
  try {
    const result = await executeInvestigationQuery(difficulty, sql);
    return response.json(result);
  } catch (error) {
    return next(error);
  }
}
