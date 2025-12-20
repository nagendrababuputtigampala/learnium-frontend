import axios from 'axios';
import { auth } from '../firebase';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:8080';
const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH || '/learnium/api';
const SYNC_USER_PATH = import.meta.env.VITE_API_AUTH_SIGNIN_PATH || '/auth/signin';
const DASHBOARD_PATH = import.meta.env.VITE_API_USERS_DASHBOARD_PATH || '/users/dashboard';

const BASE_URL = `${API_HOST}${API_BASE_PATH}`;

export const api = axios.create({
  baseURL: BASE_URL,
});

// Public API instance without authentication
export const publicApi = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    // Force refresh the token if it's expired
    const token = await user.getIdToken(false);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Re-export from UserService for backward compatibility
export { signIn, createUserProfile } from './userService';

export const getDashboardData = async () => {
  try {
    const response = await api.get(DASHBOARD_PATH);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};
