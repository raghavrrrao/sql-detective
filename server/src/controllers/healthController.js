import { getDatabase } from '../database/connection.js';

export function getHealth(_request, response, next) {
  getDatabase().get('SELECT 1 AS available', (error, row) => {
    if (error) return next(error);
    return response.status(200).json({ status: 'ok', database: row.available === 1 });
  });
}
