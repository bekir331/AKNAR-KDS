import { useState, useCallback } from 'react';
import type { LoginRequest, LoginResponse } from '../types';
import { login as apiLogin } from '../api/auth';

interface AuthUser {
  token: string;
  email: string;
  role: string;
  userId: number;
  fullName: string;
}

const USER_KEY = 'aknar_user';
const TOKEN_KEY = 'aknar_token';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiLogin(data);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    setUser(response);
    return response;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Admin' || user?.role === 'Consultant';
  const isProducer = user?.role === 'Producer';

  return { user, login, logout, isAdmin, isStaff, isProducer };
}
