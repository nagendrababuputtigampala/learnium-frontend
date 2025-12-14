import axios from 'axios';
import { auth } from '../firebase';

const API_HOST = import.meta.env.VITE_API_HOST;
const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH;
const SYNC_USER_PATH = '/auth/signin'; // As per the sequence diagram
const DASHBOARD_PATH = import.meta.env.VITE_API_USERS_DASHBOARD_PATH;

const BASE_URL = `${API_HOST}${API_BASE_PATH}`;

const api = axios.create({
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

// This function handles the new login flow as per the diagram
export const signIn = async () => {
  try {
    const response = await api.post(SYNC_USER_PATH);
    return response.data; // Expected to return { userProfile, nextRoute }
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
};

export const getDashboardData = async () => {
  try {
    const response = await api.get(DASHBOARD_PATH);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};
