import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5139/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Her istekte token ekle
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aknar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → login sayfasına yönlendir
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aknar_token');
      localStorage.removeItem('aknar_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
