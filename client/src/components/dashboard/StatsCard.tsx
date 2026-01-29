import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'emerald' | 'blue' | 'orange' | 'red';
}

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: 'bg-emerald-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: 'bg-blue-500/20',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    icon: 'bg-orange-500/20',
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    icon: 'bg-red-500/20',
  },
};

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'emerald'
}: StatsCardProps) {
  const colors = colorClasses[color];
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
          {subtitle && (
            <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-500">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.icon}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}
