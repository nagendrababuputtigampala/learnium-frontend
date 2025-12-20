import { api } from './api';
import { auth } from '../firebase';

// Types for user-related API responses
export interface UserProfile {
  userId?: string; // Add userId field
  email: string;
  displayName: string;
  gradeName: string;
  gradeId: string; // Changed to string for UUID
  onboardingDone: boolean;
  role: string;
  status: string;
  school: string | null;
  bio: string | null;
  avatar: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  problemsSolved: number;
  badgesEarned: number;
  completionPercentage: number;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// New Bootstrap API response interfaces
export interface BootstrapGrade {
  gradeId: string;
  code: string;
  name: string;
}

export interface BootstrapAuth {
  provider: string;
  firebaseUid: string;
  emailVerified: boolean;
}

export interface BootstrapUser {
  userId: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface BootstrapStudentProfile {
  studentProfileId: string | null;
  studentName: string | null;
  grade: BootstrapGrade;
  onboardingStatus: string | null;
}

export interface BootstrapPermissions {
  roles: string[];
  scopes: string[];
}

export interface BootstrapFeatureFlags {
  enablePercentile: boolean;
  enableBadges: boolean;
  enableFillBlanks: boolean;
  enableFlashcards: boolean;
}

export interface BootstrapApp {
  featureFlags: BootstrapFeatureFlags;
}

export interface BootstrapResponse {
  serverTime: string;
  isNewUser: boolean | null;
  auth: BootstrapAuth;
  user: BootstrapUser;
  studentProfile: BootstrapStudentProfile;
  permissions: BootstrapPermissions;
  app: BootstrapApp;
}

export interface SignInResponse {
  userProfile: UserProfile;
  onboardingRequired: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  gradeLevel: number;
  gradeCode?: string; // New field for grade code
  acceptTerms?: boolean; // For consent tracking
  marketingOptIn?: boolean; // For marketing consent
}

// New interfaces for create user request body
export interface ClientInfo {
  platform: string;
  appVersion: string;
  deviceId: string;
  timezone: string;
  locale: string;
}

export interface StudentInfo {
  gradeCode: string;
  studentName: string;
  dob: string;
}

export interface Consents {
  termsAccepted: boolean;
  marketingOptIn: boolean;
}

export interface CreateUserRequestBody {
  client: ClientInfo;
  student: StudentInfo;
  consents: Consents;
}

export interface Submission {
  id: string;
  testName: string;
  subject: string;
  topic: string;
  type: 'Quiz' | 'Flashcard' | 'Fill in the Blank' | 'Game';
  score: number;
  totalQuestions: number;
  timeSpent: string;
  date: string;
  passed: boolean;
}

// API endpoints from environment variables
const ENDPOINTS = {
  AUTH_SIGNIN: import.meta.env.VITE_API_AUTH_SIGNIN_PATH || '/auth/signin',
  USER_PROFILE: import.meta.env.VITE_API_USER_PROFILE_PATH || '/user/profile',
  USER_SUBMISSIONS: import.meta.env.VITE_API_USER_SUBMISSIONS_PATH || '/user/submissions',
  USERS_DASHBOARD: import.meta.env.VITE_API_USERS_DASHBOARD_PATH || '/users/dashboard',
};

/**
 * User Service - Centralized API calls for user-related operations
 */
export class UserService {
  /**
   * Sign in user and get profile using bootstrap API
   * @returns Promise<SignInResponse>
   */
  static async signIn(): Promise<SignInResponse> {
    try {
      const firebaseUser = auth.currentUser;
      
      // Skip automatic signin if Firebase user has no displayName (signup in progress)
      if (firebaseUser && !firebaseUser.displayName) {
        throw new Error('Signup in progress - skipping automatic signin');
      }
      
      // Bootstrap API expects no body, just uses the auth token
      const response = await api.post<BootstrapResponse>(ENDPOINTS.AUTH_SIGNIN);
      
      // Map bootstrap response to SignInResponse format
      const bootstrapData = response.data;
      console.log('Bootstrap API response:', bootstrapData);
      
      const userProfile: UserProfile = {
        userId: bootstrapData.user.userId, // Add userId from bootstrap response
        email: bootstrapData.user.email,
        displayName: bootstrapData.user.displayName || bootstrapData.studentProfile?.studentName || 'User',
        gradeName: bootstrapData.studentProfile.grade?.name || '',
        gradeId: bootstrapData.studentProfile.grade?.gradeId || '',
        onboardingDone: bootstrapData.studentProfile.onboardingStatus === 'COMPLETED',
        role: bootstrapData.permissions.roles[0] || 'STUDENT',
        status: bootstrapData.user.status,
        school: null,
        bio: null,
        avatar: bootstrapData.user.photoUrl,
        phone: null,
        city: null,
        state: null,
        country: null,
        totalPoints: 0, // Will be updated in phase 2
        currentStreak: 0,
        longestStreak: 0,
        problemsSolved: 0,
        badgesEarned: 0,
        completionPercentage: 0,
        profileComplete: !!bootstrapData.studentProfile.studentName,
        createdAt: bootstrapData.user.createdAt,
        updatedAt: bootstrapData.user.createdAt, // Use createdAt for now
      };
      
      return {
        userProfile,
        onboardingRequired: !bootstrapData.studentProfile.studentName || 
                          bootstrapData.studentProfile.onboardingStatus !== 'COMPLETED'
      };
    } catch (error: any) {
      console.error('Error signing in user:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to sign in');
    }
  }

  /**
   * Create user profile during signup using bootstrap API with extended body
   * @param userData - User registration data
   * @returns Promise<SignInResponse>
   */
  static async createUserProfile(userData: CreateUserRequest): Promise<SignInResponse> {
    try {
      const firebaseUser = auth.currentUser;
      
      // Helper function to get client information with defaults
      const getClientInfo = (): ClientInfo => {
        return {
          platform: "WEB",
          appVersion: "1.1",
          deviceId: UserService.generateDeviceId(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          locale: navigator.language || "en"
        };
      };
      
      // Helper function to determine grade code from grade level
      const getGradeCode = (gradeLevel: number): string => {
        return userData.gradeCode || `G${gradeLevel}`;
      };
      
      // Prepare request body with new structure
      const requestBody: CreateUserRequestBody = {
        client: getClientInfo(),
        student: {
          gradeCode: getGradeCode(userData.gradeLevel),
          studentName: userData.displayName,
          dob: "" // Empty for now, can be collected later
        },
        consents: {
          termsAccepted: userData.acceptTerms ?? true,
          marketingOptIn: userData.marketingOptIn ?? false
        }
      };
      
      const response = await api.post<BootstrapResponse>(ENDPOINTS.AUTH_SIGNIN, requestBody);
      
      // Map bootstrap response to SignInResponse format
      const bootstrapData = response.data;
      console.log('Bootstrap API response (create):', bootstrapData);
      
      const userProfile: UserProfile = {
        email: bootstrapData.user.email,
        displayName: bootstrapData.user.displayName || bootstrapData.studentProfile?.studentName || userData.displayName || 'User',
        gradeName: bootstrapData.studentProfile.grade?.name || '',
        gradeId: bootstrapData.studentProfile.grade?.gradeId || '',
        onboardingDone: bootstrapData.studentProfile.onboardingStatus === 'COMPLETED',
        role: bootstrapData.permissions.roles[0] || 'STUDENT',
        status: bootstrapData.user.status,
        school: null,
        bio: null,
        avatar: bootstrapData.user.photoUrl,
        phone: null,
        city: null,
        state: null,
        country: null,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        problemsSolved: 0,
        badgesEarned: 0,
        completionPercentage: 0,
        profileComplete: !!bootstrapData.studentProfile.studentName,
        createdAt: bootstrapData.user.createdAt,
        updatedAt: bootstrapData.user.createdAt,
      };
      
      return {
        userProfile,
        onboardingRequired: !bootstrapData.studentProfile.studentName || 
                          bootstrapData.studentProfile.onboardingStatus !== 'COMPLETED'
      };
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to create user profile');
    }
  }
  
  /**
   * Generate a device ID for client tracking
   * @returns string
   */
  static generateDeviceId(): string {
    // Generate a simple device ID based on browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function to generate device ID
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Update user profile
   * @param updates - Partial user profile updates
   * @returns Promise<UserProfile>
   */
  static async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.put<UserProfile>(ENDPOINTS.USER_PROFILE, updates);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  /**
   * Get user submissions/test history
   * @returns Promise<Submission[]>
   */
  static async getSubmissions(): Promise<Submission[]> {
    try {
      const response = await api.get<Submission[]>(ENDPOINTS.USER_SUBMISSIONS);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user submissions:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
    }
  }

  /**
   * Get dashboard data
   * @returns Promise<any>
   */
  static async getDashboardData(): Promise<any> {
    try {
      const response = await api.get(ENDPOINTS.USERS_DASHBOARD);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
}

// Re-export for backward compatibility with existing imports
export const signIn = UserService.signIn;
export const createUserProfile = UserService.createUserProfile;