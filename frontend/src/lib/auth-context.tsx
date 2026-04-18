'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { User } from '@/lib/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    studentNumber: string,
    program: string,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = api.getStoredUser();
    if (stored && api.getToken()) {
      setUser(stored);
      api
        .get<User>('/users/me')
        .then(setUser)
        .catch(() => {
          api.logout();
          setUser(null);
        });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    studentNumber: string,
    program: string,
  ) => {
    const res = await api.register(email, password, firstName, lastName, studentNumber, program);
    setUser(res.user);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    const u = await api.get<User>('/users/me');
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
