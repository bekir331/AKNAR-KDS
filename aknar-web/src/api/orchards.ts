import { apiClient } from './axiosClient';
import type { Orchard, CreateOrchardDto, UpdateOrchardDto, OrchardSummary } from '../types';

export const getOrchards = async (includeInactive: boolean = false): Promise<Orchard[]> => {
  const res = await apiClient.get<Orchard[]>('/Orchards', { params: { includeInactive } });
  return res.data;
};

export const getOrchardById = async (id: number): Promise<Orchard> => {
  const res = await apiClient.get<Orchard>(`/Orchards/${id}`);
  return res.data;
};

export const getOrchardSummary = async (id: number): Promise<OrchardSummary> => {
  const res = await apiClient.get<OrchardSummary>(`/Orchards/${id}/summary`);
  return res.data;
};

export const createOrchard = async (data: CreateOrchardDto): Promise<{ message: string; id: number }> => {
  const res = await apiClient.post('/Orchards', data);
  return res.data;
};

export const updateOrchard = async (id: number, data: UpdateOrchardDto): Promise<void> => {
  await apiClient.put(`/Orchards/${id}`, data);
};

export const deleteOrchard = async (id: number): Promise<void> => {
  await apiClient.delete(`/Orchards/${id}`);
};

export const activateOrchard = async (id: number): Promise<void> => {
  await apiClient.patch(`/Orchards/${id}/activate`);
};

export const getOrchardsWithInactive = async (): Promise<Orchard[]> => {
  const res = await apiClient.get<Orchard[]>('/Orchards/all-with-inactive');
  return res.data;
};
