import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, AuthResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (registerData: any) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<AuthResponse>('/auth/me');
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          logout();
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    if (!response.data.success || !response.data.token || !response.data.user) {
      throw new Error(response.data.message || 'Login failed');
    }

    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (registerData: any): Promise<User> => {
    const response = await api.post<AuthResponse>('/auth/register', registerData);
    if (!response.data.success || !response.data.token || !response.data.user) {
      throw new Error(response.data.message || 'Registration failed');
    }

    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
