"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (newUser: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('ac_token');
    const savedUser = localStorage.getItem('ac_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    // Global Settings Sync
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          // Merge with current local settings to avoid losing UI-only keys if any
          const local = localStorage.getItem('ac_settings');
          const current = local ? JSON.parse(local) : {};
          const merged = { ...current, ...data };
          
          // Handle types
          if (data.darkMode !== undefined) merged.darkMode = data.darkMode === 'true';
          if (data.exchangeRate !== undefined) merged.exchangeRate = parseFloat(data.exchangeRate);
          
          localStorage.setItem('ac_settings', JSON.stringify(merged));
          
          // Apply theme if dark mode is set
          if (merged.darkMode) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
          }
        }
      })
      .catch(err => console.error('Settings sync failed:', err));

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkInternet = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      try {
        await fetch('https://connectivitycheck.gstatic.com/generate_204', { 
          mode: 'no-cors', 
          cache: 'no-store',
          signal: controller.signal 
        });
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkInternet();
    const interval = setInterval(checkInternet, 3000);
    return () => clearInterval(interval);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('ac_token', newToken);
    localStorage.setItem('ac_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ac_token');
    localStorage.removeItem('ac_user');
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedFields };
      setUser(newUser);
      localStorage.setItem('ac_user', JSON.stringify(newUser));
    }
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      updateUser,
      isAuthenticated: !!token,
      isAdmin: user?.role === 'ADMIN',
      isOnline
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
