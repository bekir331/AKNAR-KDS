import { apiClient } from './axiosClient';
import type { IrrigationLog, CreateIrrigationLogDto, Orchard } from '../types';

export const getIrrigationLogs = async (): Promise<IrrigationLog[]> => {
  const orchards = await apiClient.get<Orchard[]>('/Orchards');
  const allLogs: IrrigationLog[] = [];
  for (const o of orchards.data) {
    const res = await apiClient.get<IrrigationLog[]>(`/IrrigationLogs/orchard/${o.id}`);
    allLogs.push(...res.data);
  }
  return allLogs.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
};

export const getIrrigationByOrchard = async (orchardId: number): Promise<IrrigationLog[]> => {
  const res = await apiClient.get<IrrigationLog[]>(`/IrrigationLogs/orchard/${orchardId}`);
  return res.data;
};

export const createIrrigationLog = async (data: CreateIrrigationLogDto): Promise<void> => {
  await apiClient.post('/IrrigationLogs', data);
};

export const deleteIrrigationLog = async (id: number): Promise<void> => {
  await apiClient.delete(`/IrrigationLogs/${id}`);
};
