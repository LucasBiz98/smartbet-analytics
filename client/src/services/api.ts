import axios from 'axios';
import { Bet, FilterState } from '../types';

const API_BASE = '/api';

// Configuración del cliente axios
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en petición API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// === Scrapers API ===

export const scrapersApi = {
  triggerFootyStats: async () => {
    const response = await api.post('/scrapers/trigger');
    return response.data;
  },
  
  triggerSofascore: async (league?: string) => {
    const response = await api.post('/scrapers/sofascore', { league });
    return response.data;
  },
  
  verifyResults: async () => {
    const response = await api.post('/scrapers/verify-results');
    return response.data;
  },
  
  getStatus: async () => {
    const response = await api.get('/scrapers/status');
    return response.data;
  },
};

// === Predictions API ===

export const predictionsApi = {
  getAll: async (filters?: Partial<FilterState>) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/predictions?${params.toString()}`);
    return response.data;
  },
  
  getToday: async () => {
    const response = await api.get('/predictions/today');
    return response.data;
  },
  
  getByStake: async (stake: number) => {
    const response = await api.get(`/predictions/stake/${stake}`);
    return response.data;
  },
  
  getLeagues: async () => {
    const response = await api.get('/predictions/leagues');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/predictions/${id}`);
    return response.data;
  },
};

// === Bets API ===

export const betsApi = {
  getAll: async (filters?: { status?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/bets?${params.toString()}`);
    return response.data;
  },
  
  getPending: async () => {
    const response = await api.get('/bets/pending');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/bets/${id}`);
    return response.data;
  },
  
  create: async (bet: Partial<Bet>) => {
    const response = await api.post('/bets', bet);
    return response.data;
  },
  
  update: async (id: number, updates: Partial<Bet>) => {
    const response = await api.patch(`/bets/${id}`, updates);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/bets/${id}`);
    return response.data;
  },
};

// === Stats API ===

export const statsApi = {
  getDashboard: async (period?: number) => {
    const response = await api.get(`/stats/dashboard?period=${period || 30}`);
    return response.data;
  },
  
  getMarkets: async (period?: number) => {
    const response = await api.get(`/stats/markets?period=${period || 30}`);
    return response.data;
  },
  
  getLeagues: async (period?: number) => {
    const response = await api.get(`/stats/leagues?period=${period || 30}`);
    return response.data;
  },
  
  getHistory: async (days?: number) => {
    const response = await api.get(`/stats/history?days=${days || 30}`);
    return response.data;
  },
};

// === Health Check ===

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
