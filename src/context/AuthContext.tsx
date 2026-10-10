import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authFetch, setStoredToken, clearStoredToken, getStoredToken } from '../utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string, role?: UserRole) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, phone: string, pass: string) => Promise<{ success: boolean; message: string }>;
  quickLogin: (role: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          clearStoredToken();
          setUser(null);
        }
      } else {
        clearStoredToken();
        setUser(null);
      }
    } catch (err) {
      clearStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string, role?: UserRole) => {
    try {
      const res = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          setStoredToken(data.token);
        }
        setUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, message: 'Network error during login. Please try again.' };
    }
  };

  const register = async (name: string, email: string, phone: string, pass: string) => {
    try {
      const res = await authFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password: pass, role: 'citizen' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          setStoredToken(data.token);
        }
        setUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: 'Network error during registration. Please try again.' };
    }
  };

  const quickLogin = async (role: UserRole) => {
    try {
      const res = await authFetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          setStoredToken(data.token);
        }
        setUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Quick login failed' };
    } catch (err: any) {
      return { success: false, message: 'Connection error during demo login.' };
    }
  };

  const logout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // ignore
    } finally {
      clearStoredToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        quickLogin,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
