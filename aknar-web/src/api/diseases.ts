import { apiClient } from './axiosClient';
import type { DiseaseRecommendation } from '../types';

export const getDiseases = async (): Promise<DiseaseRecommendation[]> => {
  const res = await apiClient.get<DiseaseRecommendation[]>('/DiseaseRecommendations');
  return res.data;
};
