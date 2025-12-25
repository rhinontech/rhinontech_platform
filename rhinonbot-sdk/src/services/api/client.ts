// API client configuration with axios instances and interceptors
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_NEW_SERVER_API_URL || '';
const AI_API_URL = process.env.REACT_APP_API_URL_AI || '';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || '';

// Create axios instance for main server API
export const serverApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for AI API
export const aiApi: AxiosInstance = axios.create({
  baseURL: AI_API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response error handler
const handleResponseError = (error: AxiosError): Promise<never> => {
  if (error.response) {
    // Server responded with error status
    console.error('API Error Response:', error.response.status, error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error('API No Response:', error.request);
  } else {
    // Error setting up request
    console.error('API Request Error:', error.message);
  }
  return Promise.reject(error);
};

// Add response interceptors
serverApi.interceptors.response.use(
  (response) => response,
  handleResponseError
);

aiApi.interceptors.response.use(
  (response) => response,
  handleResponseError
);

// Export URLs for socket connections
export const getSocketUrl = (): string => SOCKET_URL;
export const getAiApiUrl = (): string => AI_API_URL;
export const getServerApiUrl = (): string => API_BASE_URL;

export default serverApi;
