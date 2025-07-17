/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Viewer';
  avatar?: string;
}

interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'avatar'>>) => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = '/api';
const TOKEN_STORAGE_KEY = 'auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
const USER_STORAGE_KEY = 'auth_user';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const isAuthenticated = !!user && !!accessToken;

  /**
   * Store authentication data in localStorage
   */
  const storeAuthData = (session: AuthSession) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refreshToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    setUser(session.user);
  };

  /**
   * Clear authentication data from localStorage
   */
  const clearAuthData = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  /**
   * Load authentication data from localStorage
   */
  const loadAuthData = () => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const refresh = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      const userStr = localStorage.getItem(USER_STORAGE_KEY);

      if (token && refresh && userStr) {
        const userData = JSON.parse(userStr);
        setAccessToken(token);
        setRefreshToken(refresh);
        setUser(userData);
        return true;
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      clearAuthData();
    }
    return false;
  };

  /**
   * Make authenticated API request
   */
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token might be expired, try to refresh
      if (refreshToken) {
        try {
          await refreshSession();
          // Retry the original request with new token
          return apiRequest(endpoint, options);
        } catch (error) {
          clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
      } else {
        clearAuthData();
        throw new Error('Authentication required. Please login.');
      }
    }

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    let data;
    if (contentType && contentType.includes('application/json') && text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
    } else {
      data = { message: text || 'Empty response' };
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  };

  /**
   * Login user with email and password
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔍 AuthContext: Login attempt for:', email);
      setIsLoading(true);
      
      console.log('🔍 AuthContext: Making login request to:', `${API_BASE_URL}/auth/login`);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔍 AuthContext: Login response status:', response.status);
      const data = await response.json();
      console.log('🔍 AuthContext: Login response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.data) {
        console.log('✅ AuthContext: Login successful, storing auth data');
        storeAuthData({
          user: data.data.user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresAt: data.data.expiresAt,
        });
        console.log('✅ AuthContext: Auth data stored successfully');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (email: string, password: string, name: string, role?: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // After successful registration, automatically login
      await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      if (accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  /**
   * Refresh authentication session
   */
  const refreshSession = async (): Promise<void> => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      if (data.success && data.data) {
        storeAuthData({
          user: data.data.user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresAt: data.data.expiresAt,
        });
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      throw error;
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'avatar'>>): Promise<void> => {
    try {
      const data = await apiRequest('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (data.success && data.data.user) {
        setUser(data.data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data.user));
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  /**
   * Get headers for authenticated requests
   */
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
  };

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔍 AuthContext: Initializing authentication...');
      const hasAuthData = loadAuthData();
      console.log('🔍 AuthContext: Has stored auth data:', hasAuthData);
      
      if (hasAuthData && refreshToken) {
        try {
          console.log('🔍 AuthContext: Validating stored session...');
          // Verify the session is still valid
          await apiRequest('/auth/me');
          console.log('✅ AuthContext: Session validated successfully');
        } catch (error) {
          console.warn('⚠️ AuthContext: Session validation failed, clearing auth data');
          clearAuthData();
        }
      }
      
      console.log('✅ AuthContext: Authentication initialization complete');
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Set up automatic token refresh
   */
  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    // Set up automatic refresh 5 minutes before expiration
    const refreshInterval = setInterval(async () => {
      try {
        await refreshSession();
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
        clearAuthData();
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [accessToken, refreshToken]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshSession,
    resetPassword,
    updateProfile,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};