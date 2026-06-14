import { apiClient } from './axiosClient';
import type { Producer } from '../types';

export const getProducers = async (): Promise<Producer[]> => {
  const res = await apiClient.get<Producer[]>('/Producers');
  return res.data;
};

export const getProducerById = async (id: number): Promise<Producer> => {
  const res = await apiClient.get<Producer>(`/Producers/${id}`);
  return res.data;
};

export const getMyProfile = async (): Promise<Producer> => {
  const res = await apiClient.get<Producer>('/Producers/me');
  return res.data;
};

export const updateProducer = async (id: number, data: Partial<Producer> & { password?: string }): Promise<void> => {
  await apiClient.put(`/Producers/${id}`, data);
};

