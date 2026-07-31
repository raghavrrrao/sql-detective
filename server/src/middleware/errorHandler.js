export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) console.error(error);

  response.status(statusCode).json({
    error: {
      message: statusCode >= 500 ? 'An unexpected server error occurred.' : error.message,
    },
  });
}
