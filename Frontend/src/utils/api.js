import axios from 'axios';

// Get API base URLs from environment variables with fallback to defaults
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

/**
 * Create an Axios instance for the backend API
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create an Axios instance for the Python ML service
 */
export const pythonApiClient = axios.create({
  baseURL: PYTHON_API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Export the URLs for other components that might need them
export { API_BASE_URL, PYTHON_API_URL };
