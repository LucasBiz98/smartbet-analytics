import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Receipt, 
  BarChart3, 
  Menu, 
  X,
  RefreshCw
} from 'lucide-react';
import { scrapersApi } from '../../services/api';
import { useAppStore } from '../../store/appStore';
import toast from 'react-hot-toast';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isScraping, setScraping } = useAppStore();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/predictions', label: 'Predicciones', icon: Target },
    { path: '/bets', label: 'Apuestas', icon: Receipt },
    { path: '/stats', label: 'Estadísticas', icon: BarChart3 },
  ];
  
  const handleRefresh = async () => {
    if (isScraping) return;
    
    setScraping(true);
    const loadingToast = toast.loading('Actualizando predicciones...');
    
    try {
      const result = await scrapersApi.triggerFootyStats();
      
      if (result.success) {
        toast.success(`¡Actualizado! ${result.matchesFound} predicciones encontradas`, {
          id: loadingToast
        });
      } else {
        toast.error(result.error || 'Error actualizando predicciones', {
          id: loadingToast
        });
      }
    } catch (error) {
      toast.error('Error conectando con el servidor', {
        id: loadingToast
      });
    } finally {
      setScraping(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar para móvil */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
      >
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="absolute left-0 top-0 h-full w-64 bg-slate-800 p-4 animate-slide-in">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-bold text-emerald-400">SmartBet</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Sidebar para escritorio */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-800 border-r border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-emerald-400">SmartBet</h1>
          <p className="text-sm text-slate-500 mt-1">Analytics Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' 
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleRefresh}
            disabled={isScraping}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isScraping ? 'Actualizando...' : 'Actualizar Datos'}</span>
          </button>
        </div>
      </aside>
      
      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header móvil */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
          <h1 className="text-xl font-bold text-emerald-400">SmartBet</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isScraping}
              className="p-2 bg-emerald-500 rounded-lg"
            >
              <RefreshCw className={`w-5 h-5 text-white ${isScraping ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-slate-700 rounded-lg"
            >
              <Menu className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </header>
        
        {/* Contenido de la página */}
        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
