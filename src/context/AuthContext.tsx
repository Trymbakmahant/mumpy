'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'driver';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  assigned_van_id?: string | null;
  van_plate?: string;
  van_sector?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginAsDriver1: () => Promise<void>;
  loginAsDriver2: () => Promise<void>;
  loginAsDriver: () => Promise<void>; // Alias for Driver 1
  loginAsAdmin: () => Promise<void>;
  logout: () => void;
}

const defaultAdminUser: UserProfile = {
  id: 'admin-hub-04',
  email: 'admin@mumpywater.com',
  full_name: 'Operations Hub Admin',
  role: 'admin',
  phone: '+91 98220 11990',
  avatar_url: '/images/avatar-rajesh.png',
  assigned_van_id: null,
};

const defaultDriver1User: UserProfile = {
  id: 'driver-rajesh-02',
  email: 'driver1@mumpywater.com',
  full_name: 'Rajesh Patil (Driver 1)',
  role: 'driver',
  phone: '+91 98230 45892',
  avatar_url: '/images/avatar-rajesh.png',
  assigned_van_id: 'van-02',
  van_plate: 'MH-12-BR-3042',
  van_sector: 'IT Corridor - Phase 2',
};

const defaultDriver2User: UserProfile = {
  id: 'driver-suresh-01',
  email: 'driver2@mumpywater.com',
  full_name: 'Suresh Kumar (Driver 2)',
  role: 'driver',
  phone: '+91 98901 12345',
  avatar_url: '/images/avatar-rajesh.png',
  assigned_van_id: 'van-01',
  van_plate: 'MH-12-BR-3041',
  van_sector: 'Sector 14 & 15',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: false,
  isLoginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  login: async () => ({ success: false }),
  loginAsDriver1: async () => {},
  loginAsDriver2: async () => {},
  loginAsDriver: async () => {},
  loginAsAdmin: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('mumpy_auth_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      // Local storage fallback
    }
  }, []);

  const login = async (
    email: string,
    password = '',
    role: UserRole = 'admin'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('mumpy_auth_user', JSON.stringify(data.user));
        setIsLoginModalOpen(false);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: data.error || 'Authentication failed' };
    } catch (e: any) {
      console.error('Server dynamic auth error, falling back locally', e);
      setIsLoading(false);
      return { success: false, error: e?.message || 'Server connection error' };
    }
  };

  const loginAsDriver1 = async () => {
    await login('driver1@mumpywater.com', 'Driver1@123', 'driver');
  };

  const loginAsDriver2 = async () => {
    await login('driver2@mumpywater.com', 'Driver2@123', 'driver');
  };

  const loginAsDriver = async () => {
    await loginAsDriver1();
  };

  const loginAsAdmin = async () => {
    await login('admin@mumpywater.com', 'Admin@123', 'admin');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mumpy_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        login,
        loginAsDriver1,
        loginAsDriver2,
        loginAsDriver,
        loginAsAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
