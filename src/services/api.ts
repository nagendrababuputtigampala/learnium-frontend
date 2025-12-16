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

export const signIn = async () => {
  try {
    const firebaseUser = auth.currentUser;
    
    // If this is a signin call and Firebase user has no displayName,
    // it's likely an automatic call during signup before profile is updated - skip it
    if (firebaseUser && !firebaseUser.displayName) {
      throw new Error('Signup in progress - skipping automatic signin');
    }
    
    const requestBody = {
      uid: firebaseUser?.uid || '',
      email: firebaseUser?.email || '',
      displayName: firebaseUser?.displayName || ''
    };
    
    const response = await api.post(SYNC_USER_PATH, requestBody);
    return response.data;
  } catch (error) {
    console.error('Error signing in user:', error);
    throw error;
  }
};

// Legacy method for backward compatibility - for new user registration
export const createUserProfile = async (authRequest: {
  email: string;
  password: string;
  displayName: string;
  gradeLevel: number;
}) => {
  try {
    const firebaseUser = auth.currentUser;
    
    const requestBody = {
      uid: firebaseUser?.uid || '',
      email: authRequest.email,
      displayName: authRequest.displayName,
      password: authRequest.password,
      gradeLevel: authRequest.gradeLevel
    };
    
    const response = await api.post(SYNC_USER_PATH, requestBody);
    return response.data;
  } catch (error) {
    console.error('Error creating user profile:', error);
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
