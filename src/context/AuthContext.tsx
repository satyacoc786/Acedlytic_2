import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  login: (role: 'student' | 'staff' | 'admin', username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  faceLogin: (role: 'student' | 'staff', username: string, embedding: number[]) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCurrentUser: (userData: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('acediytix_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('acediytix_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('acediytix_user');
    }
  }, [user]);

  const login = async (role: 'student' | 'staff' | 'admin', username: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const faceLogin = async (role: 'student' | 'staff', username: string, embedding: number[]) => {
    try {
      const res = await fetch('/api/auth/face/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, username, embedding }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Face verification failed' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Face verification service error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('acediytix_user');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  const updateCurrentUser = (userData: Partial<AuthUser>) => {
    setUser(prev => (prev ? { ...prev, ...userData } : null));
  };

  return (
    <AuthContext.Provider value={{ user, login, faceLogin, logout, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
