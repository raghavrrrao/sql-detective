import { api } from './api';

/**
 * Turns any axios failure into one sentence a player can act on. The server
 * already sends friendly copy for SQL problems, so that message wins whenever
 * it exists; everything below is for the cases where the request never got an
 * answer at all. Stack traces never reach the screen.
 */
function getErrorMessage(error, context) {
  const fromServer = error?.response?.data?.error?.message;
  if (typeof fromServer === 'string' && fromServer.trim() !== '') return fromServer;

  if (error?.code === 'ECONNABORTED') {
    return 'That request took too long and was cancelled. Try a narrower query, or add a LIMIT.';
  }
  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return 'Cannot reach the investigation server. Check that it is running, then try again.';
  }

  const status = error.response.status;
  if (status === 404) {
    return context === 'case'
      ? 'That case file could not be found on the server.'
      : 'The evidence database for this case is unavailable.';
  }
  if (status === 429) return 'Too many queries at once. Wait a moment and run it again.';
  if (status >= 500) return 'The investigation server hit an unexpected problem. Try again in a moment.';

  return 'The investigation service could not complete that request. Please try again.';
}

export async function fetchCaseBriefing(difficulty) {
  try {
    const { data } = await api.get(`/case/${difficulty}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'case'));
  }
}

export async function executeCaseQuery(difficulty, sql) {
  try {
    const { data } = await api.post('/query', { difficulty, sql });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'query'));
  }
}
