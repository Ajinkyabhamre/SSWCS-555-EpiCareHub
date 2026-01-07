import axios from 'axios';

/**
 * API Base URL Configuration
 *
 * In PRODUCTION (Vercel): Use relative URLs ("/api", "/brain") which are proxied
 * through Vercel rewrites to the Railway backends. This makes all cookies first-party,
 * fixing Chrome Incognito cross-site cookie restrictions.
 *
 * In DEVELOPMENT: Use localhost URLs for direct backend access.
 *
 * The proxy approach means:
 * - Browser sees: https://epicarehub-frontend.vercel.app/api/login
 * - Vercel proxies to: https://epicarehub-backend-production.up.railway.app/login
 * - Cookies are set as first-party (same origin as frontend)
 */
const isProduction = import.meta.env.PROD;

// In production, use relative URLs (Vercel proxy). In dev, use localhost.
const API_BASE_URL = isProduction
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

const PYTHON_API_URL = isProduction
  ? '/brain'
  : (import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000');

/**
 * Create an Axios instance for the backend API
 *
 * IMPORTANT: withCredentials: true enables sending cookies (session authentication)
 * With Vercel proxy, cookies are now first-party and work in Incognito mode.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies for session auth
});

/**
 * Create an Axios instance for the Python ML service (brain-api)
 *
 * Proxied through /brain/* in production for same-origin cookie handling.
 */
export const pythonApiClient = axios.create({
  baseURL: PYTHON_API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true, // Enable sending cookies
});

// Export the URLs for other components that might need them
export { API_BASE_URL, PYTHON_API_URL };
