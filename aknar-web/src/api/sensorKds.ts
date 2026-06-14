import { apiClient } from './axiosClient';

export const getKdsStatus = async () => {
  const res = await apiClient.get('/SensorKds/status');
  return res.data;
};

export const trainSensorModel = async () => {
  const res = await apiClient.post('/SensorKds/train');
  return res.data;
};

export const getSensorKdsReport = async (orchardId: number) => {
  const res = await apiClient.get(`/SensorKds/report/${orchardId}`);
  return res.data;
};

export const getKdsHistory = async (orchardId?: number) => {
  const res = await apiClient.get('/SensorKds/history', {
    params: { orchardId }
  });
  return res.data;
};
