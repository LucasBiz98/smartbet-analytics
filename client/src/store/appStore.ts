import { create } from 'zustand';
import { Prediction, Bet, DashboardStats, League, FilterState } from '../types';

interface AppState {
  // Datos
  predictions: Prediction[];
  bets: Bet[];
  dashboardStats: DashboardStats | null;
  leagues: League[];
  
  // Estados de carga
  isLoadingPredictions: boolean;
  isLoadingBets: boolean;
  isLoadingStats: boolean;
  isScraping: boolean;
  
  // Filtros
  filters: FilterState;
  
  // Errores
  error: string | null;
  
  // Acciones para predicciones
  setPredictions: (predictions: Prediction[]) => void;
  setLoadingPredictions: (loading: boolean) => void;
  
  // Acciones para apuestas
  setBets: (bets: Bet[]) => void;
  setLoadingBets: (loading: boolean) => void;
  
  // Acciones para estadísticas
  setDashboardStats: (stats: DashboardStats) => void;
  setLoadingStats: (loading: boolean) => void;
  
  // Acciones para ligas
  setLeagues: (leagues: League[]) => void;
  
  // Acciones para filtros
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  
  // Acciones de scraping
  setScraping: (scraping: boolean) => void;
  
  // Acciones de error
  setError: (error: string | null) => void;
  clearError: () => void;
}

const defaultFilters: FilterState = {
  minStake: 0,
  maxStake: 10,
  league: '',
  market: '',
  dateFrom: '',
  dateTo: '',
};

export const useAppStore = create<AppState>((set) => ({
  // Datos iniciales
  predictions: [],
  bets: [],
  dashboardStats: null,
  leagues: [],
  
  // Estados de carga iniciales
  isLoadingPredictions: false,
  isLoadingBets: false,
  isLoadingStats: false,
  isScraping: false,
  
  // Filtros iniciales
  filters: defaultFilters,
  
  // Error inicial
  error: null,
  
  // Acciones para predicciones
  setPredictions: (predictions) => set({ predictions }),
  setLoadingPredictions: (isLoadingPredictions) => set({ isLoadingPredictions }),
  
  // Acciones para apuestas
  setBets: (bets) => set({ bets }),
  setLoadingBets: (isLoadingBets) => set({ isLoadingBets }),
  
  // Acciones para estadísticas
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  setLoadingStats: (isLoadingStats) => set({ isLoadingStats }),
  
  // Acciones para ligas
  setLeagues: (leagues) => set({ leagues }),
  
  // Acciones para filtros
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  clearFilters: () => set({ filters: defaultFilters }),
  
  // Acciones de scraping
  setScraping: (isScraping) => set({ isScraping }),
  
  // Acciones de error
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
