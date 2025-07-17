/**
 * Mock Authentication Context
 * Works with the existing backend mock authentication system
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MockUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

interface MockAuthContextType {
  user: MockUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const useMockAuth = (): MockAuthContextType => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

interface MockAuthProviderProps {
  children: ReactNode;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []); // Empty dependency array - only run once on mount

  const signIn = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        await checkAuthStatus();
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setUser(null);
      }
    } catch (error) {
      console.error('Error during sign-out:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: MockAuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};
