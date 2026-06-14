import { apiClient } from './axiosClient';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types';

export const apiLogin = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await apiClient.post<LoginResponse>('/Auth/login', data);
  return res.data;
};

export const login = apiLogin;

export const register = async (data: RegisterRequest): Promise<LoginResponse> => {
  const res = await apiClient.post<LoginResponse>('/Auth/register', data);
  return res.data;
};

export const getMe = async () => {
  const res = await apiClient.get('/Auth/me');
  return res.data;
};
