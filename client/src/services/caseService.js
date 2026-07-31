import { api } from './api';

function getErrorMessage(error) {
  return error.response?.data?.error?.message ?? 'The investigation service is unavailable. Please try again.';
}

export async function fetchCaseBriefing(difficulty) {
  try {
    const { data } = await api.get(`/case/${difficulty}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function executeCaseQuery(difficulty, sql) {
  try {
    const { data } = await api.post('/query', { difficulty, sql });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
