import { apiClient } from './axiosClient';
import type { User, CreateSystemUserDto } from '../types';

export const getUsers = async (): Promise<User[]> => {
  const res = await apiClient.get<User[]>('/Auth/users');
  return res.data;
};

export const createUser = async (data: CreateSystemUserDto): Promise<void> => {
  if (data.role === 'Admin') {
    await apiClient.post('/Auth/create-admin', {
      fullName: data.fullName,
      email: data.email,
      password: data.password || '123456',
      role: 'Admin'
    });
  } else if (data.role === 'Consultant') {
    await apiClient.post('/Auth/create-consultant', {
      fullName: data.fullName,
      email: data.email,
      password: data.password || '123456',
      role: 'Consultant'
    });
  } else if (data.role === 'Producer') {
    await apiClient.post('/Auth/register', {
      fullName: data.fullName,
      email: data.email,
      password: data.password || '123456',
      phone: data.phone || '0000000000',
      city: data.city || 'Bilinmiyor',
      address: data.address || ''
    });
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/Auth/users/${id}`);
};
