import { apiClient } from './axiosClient';
import type { Device, CreateDeviceDto, Orchard } from '../types';

export const getDevices = async (): Promise<Device[]> => {
  // Kullanıcının tüm bahçelerini çek
  const orchards = await apiClient.get<Orchard[]>('/Orchards');
  
  const allDevices: Device[] = [];
  // Her bahçe için cihazları çek
  for (const o of orchards.data) {
    const res = await apiClient.get<Device[]>(`/Devices/orchard/${o.id}`);
    allDevices.push(...res.data);
  }
  
  return allDevices;
};

export const getDevicesByOrchard = async (orchardId: number): Promise<Device[]> => {
  const res = await apiClient.get<Device[]>(`/Devices/orchard/${orchardId}`);
  return res.data;
};

export const createDevice = async (data: CreateDeviceDto): Promise<void> => {
  await apiClient.post('/Devices', data);
};

export const toggleDevice = async (id: number): Promise<void> => {
  await apiClient.put(`/Devices/${id}/toggle`);
};

export const deleteDevice = async (id: number): Promise<void> => {
  await apiClient.delete(`/Devices/${id}`);
};
