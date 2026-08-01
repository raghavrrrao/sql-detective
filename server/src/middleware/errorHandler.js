import { env } from '../config/env.js';

export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) console.error(error);

  response.status(statusCode).json({
    error: {
      message: statusCode >= 500 && env.nodeEnv === 'production'
        ? 'An unexpected server error occurred.'
        : error.message,
    },
  });
}
