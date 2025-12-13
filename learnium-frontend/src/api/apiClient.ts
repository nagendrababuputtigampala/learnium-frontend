import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { auth } from '../config/firebase';
import { sessionManager } from '../utils/sessionManager';

// Build base URL from environment variables
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:8080';
const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH || '/learnium/api';
const BASE_URL = `${API_HOST}${API_BASE_PATH}`;

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  withCredentials: true, // Enable credentials for CORS
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Firebase ID token and Session ID
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Always add session ID to every request
    const sessionId = sessionManager.getSessionId();
    config.headers['X-Session-Id'] = sessionId;

    // Add Firebase token if user is authenticated
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Get fresh token (cached if still valid)
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting token for request:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const user = auth.currentUser;
      if (user) {
        try {
          // Force token refresh
          const token = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return apiClient(originalRequest);
        } catch (tokenError) {
          console.error('Token refresh failed:', tokenError);
          // Token refresh failed, user needs to re-authenticate
          return Promise.reject(tokenError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
