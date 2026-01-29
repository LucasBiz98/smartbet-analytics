import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Percent,
  Clock
} from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import { statsApi, predictionsApi } from '../services/api';
import { Prediction } from '../types';
import { useAppStore } from '../store/appStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const { dashboardStats, setDashboardStats, setPredictions, setLoadingPredictions } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [todayPredictions, setTodayPredictions] = useState<Prediction[]>([]);
  
  useEffect(() => {
    loadDashboardData();
    loadTodayPredictions();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const stats = await statsApi.getDashboard(30);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadTodayPredictions = async () => {
    try {
      setLoadingPredictions(true);
      const result = await predictionsApi.getToday();
      setPredictions(result.predictions || []);
      setTodayPredictions(result.predictions || []);
    } catch (error) {
      console.error('Error cargando predicciones:', error);
    } finally {
      setLoadingPredictions(false);
    }
  };
  
  const general = dashboardStats?.general;
  
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Resumen de tu actividad de apuestas</p>
        </div>
        <div className="text-right hidden lg:block">
          <p className="text-slate-400 text-sm">{format(new Date(), 'EEEE, d MMMM yyyy', { locale: es })}</p>
          <p className="text-slate-500 text-xs mt-1">Última actualización: {format(new Date(), 'HH:mm')}</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Profit Total"
          value={`€${(general?.totalProfitLoss || 0).toFixed(2)}`}
          icon={general?.totalProfitLoss && general.totalProfitLoss >= 0 ? TrendingUp : TrendingDown}
          trend={{ value: 12.5, isPositive: true }}
          color={general?.totalProfitLoss && general.totalProfitLoss >= 0 ? 'emerald' : 'red'}
        />
        <StatsCard
          title="Win Rate"
          value={`${(general?.winRate || 0).toFixed(1)}%`}
          subtitle={`${general?.wonBets || 0} ganadas de ${general?.totalBets || 0}`}
          icon={Target}
          color="blue"
        />
        <StatsCard
          title="ROI"
          value={`${(general?.roi || 0).toFixed(2)}%`}
          subtitle="Retorno sobre inversión"
          icon={Percent}
          color={general?.roi && general.roi >= 0 ? 'emerald' : 'red'}
        />
        <StatsCard
          title="Total Apostado"
          value={`€${(general?.totalStaked || 0).toFixed(2)}`}
          subtitle={`${general?.pendingBets || 0} apuestas pendientes`}
          icon={DollarSign}
          color="orange"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predicciones de hoy */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Predicciones del Día</h2>
            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
              {todayPredictions.length} partidos
            </span>
          </div>
          
          {todayPredictions.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {todayPredictions.slice(0, 10).map((pred) => (
                <div 
                  key={pred.id}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">
                      {pred.match?.home_team} vs {pred.match?.away_team}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {pred.match?.league} • {pred.market}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">{pred.odds.toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-slate-500 text-xs">Stake:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        pred.stake >= 8 ? 'bg-red-500/20 text-red-400' :
                        pred.stake >= 6 ? 'bg-orange-500/20 text-orange-400' :
                        pred.stake >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {pred.stake}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hay predicciones para hoy</p>
              <p className="text-slate-500 text-sm mt-1">Haz clic en "Actualizar Datos" para buscar nuevas predicciones</p>
            </div>
          )}
        </div>
        
        {/* Rendimiento por Stake */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Rendimiento por Stake</h2>
          
          {dashboardStats?.byStake && dashboardStats.byStake.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {dashboardStats.byStake.map((stake) => {
                const winRate = stake.betCount > 0 ? (stake.won / stake.betCount * 100).toFixed(1) : '0';
                const isProfitable = stake.profitLoss >= 0;
                
                return (
                  <div 
                    key={stake.stake}
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm ${
                        stake.stake >= 8 ? 'bg-red-500/20 text-red-400' :
                        stake.stake >= 6 ? 'bg-orange-500/20 text-orange-400' :
                        stake.stake >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {stake.stake}
                      </span>
                      <div>
                        <p className="text-white font-medium text-sm">{stake.betCount} apuestas</p>
                        <p className="text-slate-400 text-xs">{stake.won}W - {stake.lost}L</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                        €{stake.profitLoss.toFixed(2)}
                      </p>
                      <p className="text-slate-400 text-xs">{winRate}% win rate</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Sin datos aún</p>
              <p className="text-slate-500 text-sm mt-1">Las estadísticas aparecerán cuando tengas apuestas registradas</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Últimas apuestas */}
      {dashboardStats?.recentBets && dashboardStats.recentBets.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Últimas Apuestas</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                  <th className="pb-3 pr-4">Partido</th>
                  <th className="pb-3 pr-4">Mercado</th>
                  <th className="pb-3 pr-4">Cuota</th>
                  <th className="pb-3 pr-4">Stake</th>
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3">Profit</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {dashboardStats.recentBets.slice(0, 5).map((bet) => (
                  <tr key={bet.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 pr-4">
                      <p className="text-white">{bet.match?.home_team || 'N/A'}</p>
                      <p className="text-slate-400">{bet.match?.away_team || 'N/A'}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{bet.market}</td>
                    <td className="py-3 pr-4 text-slate-300">{bet.odds_taken.toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        bet.prediction?.stake && bet.prediction.stake >= 8 ? 'bg-red-500/20 text-red-400' :
                        bet.prediction?.stake && bet.prediction.stake >= 6 ? 'bg-orange-500/20 text-orange-400' :
                        bet.prediction?.stake && bet.prediction.stake >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {bet.prediction?.stake || '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bet.status === 'WON' ? 'bg-emerald-500/20 text-emerald-400' :
                        bet.status === 'LOST' ? 'bg-red-500/20 text-red-400' :
                        bet.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {bet.status}
                      </span>
                    </td>
                    <td className={`py-3 font-medium ${
                      bet.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      €{bet.profit_loss.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
