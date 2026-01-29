import { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { betsApi } from '../services/api';
import { Bet } from '../types';
import { useAppStore } from '../store/appStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Bets() {
  const { bets, setBets, setLoadingBets, isLoadingBets } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const [formData, setFormData] = useState({
    predictionId: '',
    amount: '',
    oddsTaken: '',
    market: '',
    selection: '',
    bookmaker: '',
    notes: ''
  });
  
  useEffect(() => {
    loadBets();
  }, [statusFilter]);
  
  const loadBets = async () => {
    try {
      setLoadingBets(true);
      const filters: { status?: string } = {};
      if (statusFilter) filters.status = statusFilter;
      
      const result = await betsApi.getAll(filters);
      setBets(result.bets || []);
    } catch (error) {
      console.error('Error cargando apuestas:', error);
      toast.error('Error cargando apuestas');
    } finally {
      setLoadingBets(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const betData = {
        predictionId: formData.predictionId ? parseInt(formData.predictionId) : undefined,
        amount: parseFloat(formData.amount),
        oddsTaken: parseFloat(formData.oddsTaken),
        market: formData.market,
        selection: formData.selection || undefined,
        bookmaker: formData.bookmaker || undefined,
        notes: formData.notes || undefined
      };
      
      if (editingBet) {
        await betsApi.update(editingBet.id, betData);
        toast.success('Apuesta actualizada');
      } else {
        await betsApi.create(betData);
        toast.success('Apuesta creada');
      }
      
      setShowAddModal(false);
      setEditingBet(null);
      resetForm();
      loadBets();
    } catch (error) {
      toast.error('Error guardando apuesta');
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta apuesta?')) return;
    
    try {
      await betsApi.delete(id);
      toast.success('Apuesta eliminada');
      loadBets();
    } catch (error) {
      toast.error('Error eliminando apuesta');
    }
  };
  
  const handleUpdateStatus = async (bet: Bet, status: 'WON' | 'LOST' | 'VOID') => {
    try {
      await betsApi.update(bet.id, { status });
      toast.success(`Apuesta marcada como ${status === 'WON' ? 'GANADA' : status === 'LOST' ? 'PERDIDA' : 'NULA'}`);
      loadBets();
    } catch (error) {
      toast.error('Error actualizando apuesta');
    }
  };
  
  const resetForm = () => {
    setFormData({
      predictionId: '',
      amount: '',
      oddsTaken: '',
      market: '',
      selection: '',
      bookmaker: '',
      notes: ''
    });
  };
  
  const handleEdit = (bet: Bet) => {
    setEditingBet(bet);
    setFormData({
      predictionId: bet.prediction_id?.toString() || '',
      amount: bet.amount.toString(),
      oddsTaken: bet.odds_taken.toString(),
      market: bet.market,
      selection: bet.selection || '',
      bookmaker: bet.bookmaker || '',
      notes: bet.notes || ''
    });
    setShowAddModal(true);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WON': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'LOST': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return null;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'bg-emerald-500/20 text-emerald-400';
      case 'LOST': return 'bg-red-500/20 text-red-400';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
      case 'VOID': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Apuestas</h1>
          <p className="text-slate-400 mt-1">
            Gestiona y seguimiento de tus apuestas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="WON">Ganadas</option>
            <option value="LOST">Perdidas</option>
            <option value="VOID">Nulas</option>
          </select>
          
          <button
            onClick={loadBets}
            disabled={isLoadingBets}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${isLoadingBets ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              setEditingBet(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Apuesta</span>
          </button>
        </div>
      </div>
      
      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{bets.length}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Ganadas</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {bets.filter(b => b.status === 'WON').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Perdidas</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {bets.filter(b => b.status === 'LOST').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {bets.filter(b => b.status === 'PENDING').length}
          </p>
        </div>
      </div>
      
      {/* Lista de apuestas */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isLoadingBets ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400">Cargando apuestas...</p>
          </div>
        ) : bets.length > 0 ? (
          <div className="divide-y divide-slate-700/50">
            {bets.map((bet) => (
              <div 
                key={bet.id}
                className="p-4 lg:p-6 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info del partido */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bet.status)}`}>
                        {getStatusIcon(bet.status)}
                        <span className="ml-1">{bet.status}</span>
                      </span>
                      <span className="text-slate-500 text-sm">
                        {format(new Date(bet.placed_at), 'd MMM, HH:mm', { locale: es })}
                      </span>
                    </div>
                    <p className="text-white font-medium">
                      {bet.match?.home_team} vs {bet.match?.away_team}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {bet.market} • {bet.selection || 'Sin selección'}
                    </p>
                  </div>
                  
                  {/* Detalles de la apuesta */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-slate-400 text-xs">Cuota</p>
                      <p className="text-white font-bold">{bet.odds_taken.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-xs">Importe</p>
                      <p className="text-white font-bold">€{bet.amount.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-xs">Profit</p>
                      <p className={`font-bold ${bet.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        €{bet.profit_loss.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  {bet.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(bet, 'WON')}
                        className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition-colors"
                        title="Marcar como ganada"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(bet, 'LOST')}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        title="Marcar como perdida"
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(bet)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(bet.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-400">No hay apuestas registradas</p>
            <p className="text-slate-500 text-sm mt-2">Crea tu primera apuesta para comenzar a hacer seguimiento</p>
          </div>
        )}
      </div>
      
      {/* Modal de agregar/editar apuesta */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6 animate-slide-in">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingBet ? 'Editar Apuesta' : 'Nueva Apuesta'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Importe (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Cuota</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.oddsTaken}
                    onChange={(e) => setFormData({ ...formData, oddsTaken: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Mercado</label>
                <input
                  type="text"
                  value={formData.market}
                  onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ej: 1X2, BTTS, Over 2.5"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Selección</label>
                <input
                  type="text"
                  value={formData.selection}
                  onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ej: Home, Away, Draw"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Casa de Apuestas</label>
                <input
                  type="text"
                  value={formData.bookmaker}
                  onChange={(e) => setFormData({ ...formData, bookmaker: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ej: Bet365"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBet(null);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  {editingBet ? 'Actualizar' : 'Crear Apuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
