import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, twoFACode?: string) => Promise<{ requires2FA?: boolean; method?: 'app' | 'sms' }>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const token = authService.getToken();
      const savedUser = authService.getUser();
      
      if (token && savedUser) {
        try {
          // Use settings/profile to get full user data (twoFA, loginHistory, notificationPrefs, etc.)
          const settingsService = await import('../services/settingsService');
          const freshUser = await settingsService.getProfile();
          setUser(freshUser);
        } catch (error) {
          authService.logout();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, twoFACode?: string) => {
    const response = await authService.login({ email, password, twoFACode });
    if (response.requires2FA) return { requires2FA: true, method: response.method };
    setUser(response.user);
    return {};
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await authService.signup({ name, email, password });
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      // Use settings/profile which returns full user data including twoFA, loginHistory, etc.
      const res = await import('../services/settingsService').then(m => m.getProfile());
      setUser(res);
      localStorage.setItem('user', JSON.stringify(res));
    } catch (error) {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
