import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { statsApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import toast from 'react-hot-toast';

export default function Stats() {
  const { dashboardStats, setDashboardStats } = useAppStore();
  const [period, setPeriod] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadStats();
  }, [period]);
  
  const loadStats = async () => {
    try {
      setIsLoading(true);
      const stats = await statsApi.getDashboard(period);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast.error('Error cargando estadísticas');
    } finally {
      setIsLoading(false);
    }
  };
  
  const general = dashboardStats?.general;
  const byStake = dashboardStats?.byStake || [];
  
  // Calcular estadísticas
  const totalProfit = byStake.reduce((acc, s) => acc + s.profitLoss, 0);
  const totalBets = byStake.reduce((acc, s) => acc + s.betCount, 0);
  const totalWon = byStake.reduce((acc, s) => acc + s.won, 0);
  
  // Encontrar mejor y peor stake
  const bestStake = byStake.reduce((best, current) => 
    current.profitLoss > best.profitLoss ? current : best, 
    byStake[0] || { stake: 0, profitLoss: 0 }
  );
  
  const worstStake = byStake.reduce((worst, current) => 
    current.profitLoss < worst.profitLoss ? current : worst, 
    byStake[0] || { stake: 0, profitLoss: 0 }
  );
  
  // Datos para gráfico de rendimiento diario

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Estadísticas</h1>
          <p className="text-slate-400 mt-1">Análisis detallado de tu rendimiento</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === days
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
          
          <button
            onClick={loadStats}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Profit Total</p>
                  <p className={`text-3xl font-bold mt-2 ${
                    totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    €{totalProfit.toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${totalProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  {totalProfit >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Win Rate</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {totalBets > 0 ? ((totalWon / totalBets) * 100).toFixed(1) : '0.0'}%
                  </p>
                  <p className="text-slate-500 text-sm mt-1">{totalWon} de {totalBets} apuestas</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Mejor Stake</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-2">
                    {bestStake.stake > 0 ? `Stake ${bestStake.stake}` : '-'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {bestStake.profitLoss > 0 ? `+€${bestStake.profitLoss.toFixed(2)}` : 'Sin datos'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/20">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Peor Stake</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">
                    {worstStake.stake > 0 ? `Stake ${worstStake.stake}` : '-'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {worstStake.profitLoss < 0 ? `€${worstStake.profitLoss.toFixed(2)}` : 'Sin pérdidas'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/20">
                  <TrendingDown className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rendimiento por Stake */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Rendimiento por Stake</h2>
              
              {byStake.length > 0 ? (
                <div className="space-y-4">
                  {byStake.map((stake) => {
                    const winRate = stake.betCount > 0 ? (stake.won / stake.betCount * 100) : 0;
                    const isProfitable = stake.profitLoss >= 0;
                    
                    return (
                      <div key={stake.stake} className="space-y-2">
                        <div className="flex items-center justify-between">
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
                              <p className="text-white font-medium">{stake.betCount} apuestas</p>
                              <p className="text-slate-500 text-xs">
                                {stake.won} ganadas • {stake.lost} perdidas
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                              €{stake.profitLoss.toFixed(2)}
                            </p>
                            <p className="text-slate-500 text-xs">{winRate.toFixed(1)}% win rate</p>
                          </div>
                        </div>
                        
                        {/* Barra de progreso */}
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full"
                            style={{ width: `${winRate}%` }}
                          />
                          <div 
                            className="bg-red-500 h-full"
                            style={{ width: `${100 - winRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  Sin datos para mostrar
                </div>
              )}
            </div>
            
            {/* Resumen General */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Resumen General</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Total Apostado</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    €{(general?.totalStaked || 0).toFixed(2)}
                  </p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">ROI</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    (general?.roi || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {(general?.roi || 0).toFixed(2)}%
                  </p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Apuestas Totales</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {general?.totalBets || 0}
                  </p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">
                    {general?.pendingBets || 0}
                  </p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Ganadas</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {general?.wonBets || 0}
                  </p>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Perdidas</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {general?.lostBets || 0}
                  </p>
                </div>
              </div>
              
              {/* Fórmula ROI */}
              <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                <p className="text-slate-400 text-sm mb-2">Fórmula del ROI</p>
                <p className="text-white font-mono text-sm">
                  ROI = (Profit Total / Total Apostado) × 100 = 
                  <span className={`font-bold ml-2 ${
                    (general?.roi || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {(general?.roi || 0).toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats por Mercado */}
          {dashboardStats && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Rendimiento por Mercado</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                      <th className="pb-3 pr-4">Mercado</th>
                      <th className="pb-3 pr-4">Apuestas</th>
                      <th className="pb-3 pr-4">Ganadas</th>
                      <th className="pb-3 pr-4">Perdidas</th>
                      <th className="pb-3 pr-4">Win Rate</th>
                      <th className="pb-3 pr-4">Total Apostado</th>
                      <th className="pb-3">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {dashboardStats.general && (
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3 pr-4 text-white font-medium">General</td>
                        <td className="py-3 pr-4 text-slate-300">{general?.totalBets || 0}</td>
                        <td className="py-3 pr-4 text-emerald-400">{general?.wonBets || 0}</td>
                        <td className="py-3 pr-4 text-red-400">{general?.lostBets || 0}</td>
                        <td className="py-3 pr-4 text-slate-300">{general?.winRate.toFixed(1)}%</td>
                        <td className="py-3 pr-4 text-slate-300">€{(general?.totalStaked || 0).toFixed(2)}</td>
                        <td className={`py-3 font-bold ${
                          (general?.totalProfitLoss || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          €{(general?.totalProfitLoss || 0).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
