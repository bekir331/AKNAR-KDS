import { apiClient } from './axiosClient';
import type { Alert, Orchard } from '../types';

export const getAlerts = async (): Promise<Alert[]> => {
  const orchards = await apiClient.get<Orchard[]>('/Orchards');
  const allAlerts: Alert[] = [];
  for (const o of orchards.data) {
    const res = await apiClient.get<Alert[]>(`/Alerts/orchard/${o.id}`);
    allAlerts.push(...res.data);
  }
  return allAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAlertsByOrchard = async (orchardId: number): Promise<Alert[]> => {
  const res = await apiClient.get<Alert[]>(`/Alerts/orchard/${orchardId}`);
  return res.data;
};

export const markAlertRead = async (id: number): Promise<void> => {
  await apiClient.put(`/Alerts/${id}/read`);
};

export const markAllRead = async (): Promise<void> => {
  const alerts = await getAlerts();
  const unread = alerts.filter(a => !a.isRead);
  for (const a of unread) {
    await markAlertRead(a.id);
  }
};
