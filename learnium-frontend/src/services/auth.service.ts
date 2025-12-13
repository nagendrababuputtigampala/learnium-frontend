import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type UserCredential,
  updateProfile,
  FacebookAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { sessionManager } from '../utils/sessionManager';

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  grade?: string;
  parentEmail?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

const facebookProvider = new FacebookAuthProvider();

// Sign up with email and password
export const signUpWithEmail = async (data: SignupData): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Update user profile with display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: data.fullName,
      });
    }

    // Create new session on signup
    sessionManager.createNewSession();

    // Note: Session initialization is handled by the calling component
    // This allows graceful handling when backend is not ready

    return userCredential;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create account';
    throw new Error(message);
  }
};

// Sign in with email and password
export const signInWithEmail = async (data: LoginData): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    
    // Create new session on login
    sessionManager.createNewSession();
    
    return userCredential;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    throw new Error(message);
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    // Create new session on login
    sessionManager.createNewSession();
    
    return userCredential;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign in with Google';
    throw new Error(message);
  }
};

// Sign in with Facebook
export const signInWithFacebook = async (): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithPopup(auth, facebookProvider);
    
    // Create new session on login
    sessionManager.createNewSession();
    
    return userCredential;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign in with Facebook';
    throw new Error(message);
  }
};

// Sign out
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    
    // Clear session on logout (creates new session ID for next login)
    sessionManager.clearSession();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    throw new Error(message);
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
