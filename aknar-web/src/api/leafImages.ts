import { apiClient } from './axiosClient';
import type { LeafImage, Orchard } from '../types';

export const getLeafImages = async (): Promise<LeafImage[]> => {
  // Kullanıcının tüm bahçelerini çek
  const res = await apiClient.get<Orchard[]>('/Orchards');
  const orchards = res.data;
  
  const allImages: LeafImage[] = [];
  // Her bahçe için analiz geçmişini çek
  for (const o of orchards) {
    try {
      const imagesRes = await apiClient.get<LeafImage[]>(`/LeafImages/orchard/${o.id}`);
      allImages.push(...imagesRes.data);
    } catch (err) {
      console.error(`Bahçe ${o.id} için resimler alınamadı`, err);
    }
  }
  
  // En yeni tarihten eskiye sırala
  return allImages.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
};

export const getLeafImagesByOrchard = async (orchardId: number): Promise<LeafImage[]> => {
  const res = await apiClient.get<LeafImage[]>(`/LeafImages/orchard/${orchardId}`);
  return res.data;
};

export const deleteLeafImage = async (id: number): Promise<void> => {
  await apiClient.delete(`/LeafImages/${id}`);
};
