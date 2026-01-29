import { useEffect, useState } from 'react';
import { 
  Filter, 
  Copy, 
  ExternalLink, 
  RefreshCw,
  X
} from 'lucide-react';
import { predictionsApi } from '../services/api';
import { Prediction } from '../types';
import { useAppStore } from '../store/appStore';
import toast from 'react-hot-toast';

export default function Predictions() {
  const { 
    predictions, 
    setPredictions, 
    isLoadingPredictions, 
    setLoadingPredictions,
    filters,
    setFilters,
    leagues,
    setLeagues
  } = useAppStore();
  
  const [showFilters, setShowFilters] = useState(false);
  const [betAssistData, setBetAssistData] = useState<Prediction | null>(null);
  
  useEffect(() => {
    loadPredictions();
    loadLeagues();
  }, [filters]);
  
  const loadPredictions = async () => {
    try {
      setLoadingPredictions(true);
      const result = await predictionsApi.getAll(filters);
      setPredictions(result.predictions || []);
    } catch (error) {
      console.error('Error cargando predicciones:', error);
      toast.error('Error cargando predicciones');
    } finally {
      setLoadingPredictions(false);
    }
  };
  
  const loadLeagues = async () => {
    try {
      const result = await predictionsApi.getLeagues();
      setLeagues(result.leagues || []);
    } catch (error) {
      console.error('Error cargando ligas:', error);
    }
  };
  
  const handleCopyToClipboard = (pred: Prediction) => {
    const text = `🎯 SmartBet Prediction\n\n📌 ${pred.match?.home_team} vs ${pred.match?.away_team}\n🏆 ${pred.match?.league}\n📊 Mercado: ${pred.market}\n💰 Cuota: ${pred.odds}\n📈 Probabilidad: ${pred.probability}%\n🔥 Stake: ${pred.stake}/10\n\n🎰 Apuesta disponible en tu casa de apuestas`;
    
    navigator.clipboard.writeText(text).then(() => {
      setBetAssistData(pred);
      toast.success('¡Datos copiados al portapapeles!');
    }).catch(() => {
      toast.error('Error copiando al portapapeles');
    });
  };
  
  const handleOpenBookmaker = (pred: Prediction) => {
    // Abrir casa de apuestas en nueva pestaña
    window.open('https://www.bet365.com', '_blank');
    setBetAssistData(pred);
    toast.success('Casa de apuestas abierta');
  };
  
  const clearFilters = () => {
    setFilters({
      minStake: 0,
      maxStake: 10,
      league: '',
      market: '',
      dateFrom: '',
      dateTo: '',
    });
  };
  
  const markets = ['1X2', 'BTTS', 'Over 2.5', 'Under 2.5', 'Home', 'Away', 'Draw'];
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Predicciones</h1>
          <p className="text-slate-400 mt-1">
            {predictions.length} predicciones disponibles
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {(filters.league || filters.minStake > 0 || filters.market) && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            )}
          </button>
          
          <button
            onClick={loadPredictions}
            disabled={isLoadingPredictions}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingPredictions ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
      
      {/* Filtros */}
      {showFilters && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Liga</label>
              <select
                value={filters.league}
                onChange={(e) => setFilters({ league: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Todas las ligas</option>
                {leagues.map((league) => (
                  <option key={league.league} value={league.league}>
                    {league.league} ({league.prediction_count})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Mercado</label>
              <select
                value={filters.market}
                onChange={(e) => setFilters({ market: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Todos los mercados</option>
                {markets.map((market) => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Stake Mínimo</label>
              <input
                type="range"
                min="0"
                max="10"
                value={filters.minStake}
                onChange={(e) => setFilters({ minStake: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0</span>
                <span className="text-emerald-400 font-medium">{filters.minStake}</span>
                <span>10</span>
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bet Assist Info */}
      {betAssistData && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between animate-slide-in">
          <div>
            <p className="text-emerald-400 font-medium">Bet Assist Activado</p>
            <p className="text-slate-300 text-sm">
              {betAssistData.match?.home_team} vs {betAssistData.match?.away_team} - {betAssistData.market} @ {betAssistData.odds}
            </p>
          </div>
          <button
            onClick={() => setBetAssistData(null)}
            className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-emerald-400" />
          </button>
        </div>
      )}
      
      {/* Tabla de predicciones */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isLoadingPredictions ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400">Cargando predicciones...</p>
          </div>
        ) : predictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50 text-left text-slate-400 text-sm">
                  <th className="px-6 py-4 font-medium">Partido</th>
                  <th className="px-6 py-4 font-medium">Liga</th>
                  <th className="px-6 py-4 font-medium">Mercado</th>
                  <th className="px-6 py-4 font-medium">Cuota</th>
                  <th className="px-6 py-4 font-medium">Prob.</th>
                  <th className="px-6 py-4 font-medium">Stake</th>
                  <th className="px-6 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {predictions.map((pred) => (
                  <tr key={pred.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{pred.match?.home_team}</p>
                        <p className="text-slate-400">{pred.match?.away_team}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{pred.match?.league}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm">
                        {pred.market}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-400 font-bold">{pred.odds.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              pred.probability >= 75 ? 'bg-emerald-500' :
                              pred.probability >= 60 ? 'bg-yellow-500' :
                              pred.probability >= 50 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${pred.probability}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-sm">{pred.probability}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                          pred.stake >= 8 ? 'bg-red-500/20 text-red-400' :
                          pred.stake >= 6 ? 'bg-orange-500/20 text-orange-400' :
                          pred.stake >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {pred.stake}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">
                          {pred.confidence_level?.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyToClipboard(pred)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Copiar datos"
                        >
                          <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                        <button
                          onClick={() => handleOpenBookmaker(pred)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Abrir casa de apuestas"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-400">No se encontraron predicciones</p>
            <p className="text-slate-500 text-sm mt-2">Ajusta los filtros o actualiza los datos</p>
          </div>
        )}
      </div>
    </div>
  );
}
