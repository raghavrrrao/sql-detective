import axios from 'axios';

/** Centralized HTTP client for every browser-to-API request. */
const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';

export const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
  timeout: 10_000,
});
