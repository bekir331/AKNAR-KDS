export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
  userId: number;
  fullName: string;
  message: string;
}

// Orchard
export interface Orchard {
  id: number;
  name: string;
  areaHectare?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  producerId: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateOrchardDto {
  name: string;
  areaHectare?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  producerId?: number;
}

export interface UpdateOrchardDto {
  name: string;
  areaHectare?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
}

// Sensor
export interface SensorReading {
  id: number;
  deviceId: number;
  soilMoisture?: number;
  airTemperature?: number;
  airHumidity?: number;
  lightLevel?: number;
  readAt: string;
}

// OrchardSummary
export interface OrchardSummary {
  orchardId: number;
  lastReading?: {
    soilMoisture?: number;
    airTemperature?: number;
    airHumidity?: number;
    lightLevel?: number;
    readAt: string;
  };
  unreadAlertCount: number;
  lastPrediction?: {
    id: number;
    predictedLabel: string;
    confidence: number;
    riskLevel: string;
    predictedAt: string;
  };
  lastIrrigation?: {
    id: number;
    note?: string;
    loggedAt: string;
  };
}

// Alert
export interface Alert {
  id: number;
  orchardId: number;
  alertType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// IrrigationLog
export interface IrrigationLog {
  id: number;
  orchardId: number;
  userId: string;
  note?: string;
  loggedAt: string;
}

export interface CreateIrrigationLogDto {
  orchardId: number;
  note?: string;
}

// ML Prediction
export interface MLPrediction {
  id: number;
  orchardId?: number;
  predictedLabel: string;
  confidence: number;
  riskLevel: string;
  geminiRecommendation?: string;
  imageUrl?: string;
  predictedAt: string;
}

// Leaf Image History
export interface LeafImage {
  id: number;
  orchardId: number;
  imageUrl: string;
  uploadedAt: string;
  predictionId?: number;
  predictedLabel?: string;
  confidence?: number;
  riskLevel?: string;
  predictedAt?: string;
}

// Producer
export interface Producer {
  id: number;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  userId: number;
  city?: string;
}

// Device
export interface Device {
  id: number;
  orchardId: number;
  deviceCode: string;
  model?: string;
  isActive: boolean;
  lastSeen?: string;
}

export interface CreateDeviceDto {
  orchardId: number;
  deviceCode: string;
  model?: string;
}

// User Management
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface CreateSystemUserDto {
  fullName: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Consultant' | 'Producer';
  // Üretici eklenecekse aşağıdaki alanlar da gerekebilir
  phone?: string;
  city?: string;
  address?: string;
}

// Disease Recommendation Guide
export interface DiseaseRecommendation {
  id: number;
  diseaseName: string;
  description: string;
  treatment: string;
  prevention: string;
  riskLevel: string;
  seasonWarning?: string;
}
