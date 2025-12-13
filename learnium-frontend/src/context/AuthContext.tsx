import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  idToken: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  idToken: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get fresh ID token
          const token = await user.getIdToken();
          setIdToken(token);
        } catch (error) {
          console.error('Error getting ID token:', error);
          setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Refresh token periodically (tokens expire after 1 hour)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      try {
        const token = await currentUser.getIdToken(true); // force refresh
        setIdToken(token);
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }, 50 * 60 * 1000); // Refresh every 50 minutes

    return () => clearInterval(interval);
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    idToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
