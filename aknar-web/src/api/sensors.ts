import { apiClient } from './axiosClient';
import type { SensorReading } from '../types';

export const getSensorsByOrchard = async (orchardId: number, limit = 100): Promise<SensorReading[]> => {
  const res = await apiClient.get<SensorReading[]>(`/SensorReadings/orchard/${orchardId}`, {
    params: { limit },
  });
  return res.data;
};

export const getSensorsByDevice = async (deviceId: number): Promise<SensorReading[]> => {
  const res = await apiClient.get<SensorReading[]>(`/SensorReadings/device/${deviceId}`);
  return res.data;
};

export const getLatestByOrchard = async (orchardId: number): Promise<SensorReading | null> => {
  const res = await apiClient.get<SensorReading>(`/SensorReadings/orchard/${orchardId}/latest`);
  return res.data;
};

export const getSensorAnalysis = async (orchardId: number, limit: number = 100): Promise<string> => {
  const res = await apiClient.get<{report: string}>(`/SensorReadings/orchard/${orchardId}/analyze`, {
    params: { limit }
  });
  return res.data.report;
};
