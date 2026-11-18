import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (id: string, pass: string) => Promise<User>;
  registerAmbulance: (data: { full_name: string; age: number; phone_number: string; ambulance_id: string; password: string }) => Promise<User>;
  registerHospital: (data: { hospital_name: string; hospital_id: string; password: string }) => Promise<{ user: User; notice?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('medtrack_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('medtrack_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('medtrack_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          localStorage.setItem('medtrack_user', JSON.stringify(res.user));
          socketService.connect(storedToken);
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('medtrack_token');
          localStorage.removeItem('medtrack_user');
        }
      }
      setIsLoading(false);
    };

    const handleExpired = () => {
      setUser(null);
      setToken(null);
      socketService.disconnect();
    };

    window.addEventListener('medtrack_auth_expired', handleExpired);
    initAuth();

    return () => {
      window.removeEventListener('medtrack_auth_expired', handleExpired);
    };
  }, []);

  const login = async (id: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login(id, pass);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('medtrack_token', res.token);
      localStorage.setItem('medtrack_user', JSON.stringify(res.user));
      socketService.connect(res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerAmbulance = async (data: { full_name: string; age: number; phone_number: string; ambulance_id: string; password: string }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.registerAmbulance(data);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('medtrack_token', res.token);
      localStorage.setItem('medtrack_user', JSON.stringify(res.user));
      socketService.connect(res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerHospital = async (data: { hospital_name: string; hospital_id: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.registerHospital(data);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('medtrack_token', res.token);
      localStorage.setItem('medtrack_user', JSON.stringify(res.user));
      socketService.connect(res.token);
      return { user: res.user, notice: res.verification_notice };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      socketService.disconnect();
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      localStorage.setItem('medtrack_user', JSON.stringify(res.user));
    } catch (e) {
      console.error("Failed to refresh user profile", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        registerAmbulance,
        registerHospital,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
