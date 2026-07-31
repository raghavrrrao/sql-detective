import axios from 'axios';

/** Centralized HTTP client for every browser-to-API request. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  headers: { Accept: 'application/json' },
  timeout: 10_000,
});
