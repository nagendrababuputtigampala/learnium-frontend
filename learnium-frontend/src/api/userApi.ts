import apiClient from './apiClient';
import type { AxiosError } from 'axios';

// API Endpoints from environment variables
const API_ENDPOINTS = {
  AUTH_SESSION: import.meta.env.VITE_API_AUTH_SESSION_PATH || '/auth/session',
  USERS_ONBOARDING: import.meta.env.VITE_API_USERS_ONBOARDING_PATH || '/users/onboarding',
  USERS_ME: import.meta.env.VITE_API_USERS_ME_PATH || '/users/me',
  USERS_DASHBOARD: import.meta.env.VITE_API_USERS_DASHBOARD_PATH || '/users/dashboard',
};

export interface UserProfile {
  firebaseUid: string;
  email: string;
  displayName: string;
  role: string;
  grade?: number;
  onboardingRequired: boolean;
  createdAt: string;
}

export interface DashboardSnapshot {
  level: number;
  badgesCount: number;
  streak: number;
  mathSkill: number;
  scienceSkill: number;
  englishSkill: number;
}

export interface SessionResponse {
  userProfile: UserProfile;
  onboardingRequired: boolean;
  dashboardSnapshot?: DashboardSnapshot;
}

export interface OnboardingData {
  grade: number;
  subjects: string[];
}

export interface ProfileSkill {
  name: string;
  level: number;
}

export interface ProfileCertificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl?: string;
}

export interface ProfileEducation {
  id: string;
  institution: string;
  degree?: string;
  grade?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export interface ProfileLink {
  id: string;
  platform: string;
  url: string;
}

export interface ProfileResponse {
  firebaseUid: string;
  email: string;
  displayName: string;
  role: string;
  grade?: number;
  school?: string;
  bio?: string;
  avatar?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  
  // Stats
  totalPoints?: number;
  currentStreak?: number;
  longestStreak?: number;
  problemsSolved?: number;
  badgesEarned?: number;
  
  // Skills
  skills?: ProfileSkill[];
  
  // Certificates
  certificates?: ProfileCertificate[];
  
  // Education
  education?: ProfileEducation[];
  
  // Links
  links?: ProfileLink[];
  
  isProfileComplete: boolean;
  completionPercentage: number;
}

// Initialize or retrieve user session
export const initializeSession = async (): Promise<SessionResponse> => {
  try {
    const response = await apiClient.post<SessionResponse>(API_ENDPOINTS.AUTH_SESSION);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message = axiosError.response?.data?.message;
    throw new Error(message || 'Failed to initialize session');
  }
};

// Complete onboarding
export const completeOnboarding = async (data: OnboardingData): Promise<void> => {
  try {
    await apiClient.post(API_ENDPOINTS.USERS_ONBOARDING, data);
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message = axiosError.response?.data?.message;
    throw new Error(message || 'Failed to complete onboarding');
  }
};

// Get user profile
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await apiClient.get<UserProfile>(API_ENDPOINTS.USERS_ME);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message = axiosError.response?.data?.message;
    throw new Error(message || 'Failed to get user profile');
  }
};

// Get detailed profile with all information
export const getDetailedProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await apiClient.get<ProfileResponse>('/profile/me');
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message = axiosError.response?.data?.message;
    throw new Error(message || 'Failed to get detailed profile');
  }
};

// Get dashboard data
export const getDashboard = async (): Promise<DashboardSnapshot> => {
  try {
    const response = await apiClient.get<DashboardSnapshot>(API_ENDPOINTS.USERS_DASHBOARD);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message = axiosError.response?.data?.message;
    throw new Error(message || 'Failed to get dashboard data');
  }
};
