import { apiClient } from './axiosClient';
import type { MLPrediction } from '../types';

export const predictLeaf = async (orchardId: number, imageFile: File): Promise<MLPrediction> => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const res = await apiClient.post(
    `/MLPredictions/predict/orchard/${orchardId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  // Backend { prediction:{...}, aiRecommendation, staticRecommendation, imageUrl } döndürüyor
  const data = res.data;
  return {
    id: data.prediction?.predictionId ?? 0,
    orchardId,
    predictedLabel: data.prediction?.predictedLabel ?? data.predictedLabel ?? 'Tanınamadı',
    confidence: data.prediction?.confidence ?? data.confidence ?? 0,
    riskLevel: data.prediction?.riskLevel ?? data.riskLevel ?? 'Unknown',
    geminiRecommendation: data.aiRecommendation ?? undefined,
    imageUrl: data.imageUrl ?? undefined,
    predictedAt: new Date().toISOString(),
  } as MLPrediction;
};

export const getPredictionHistory = async (): Promise<MLPrediction[]> => {
  const res = await apiClient.get<MLPrediction[]>('/MLPredictions');
  return res.data;
};

export const getPredictionsByOrchard = async (orchardId: number): Promise<MLPrediction[]> => {
  const res = await apiClient.get<MLPrediction[]>(`/MLPredictions/orchard/${orchardId}`);
  return res.data;
};

export const askChatbot = async (message: string, context: string): Promise<string> => {
  const res = await apiClient.post<{ response: string }>('/MLPredictions/chatbot', { message, context });
  return res.data.response;
};

