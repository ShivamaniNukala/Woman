import { Shield, AlertTriangle, MapPin, TrendingUp } from 'lucide-react';

export const SafetyStats = ({ stats }) => {
  if (!stats) return null;
  
  const statCards = [
    {
      icon: AlertTriangle,
      label: 'Total Incidents',
      value: stats.total_incidents,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      icon: Shield,
      label: 'Safe Checkpoints',
      value: stats.total_tollgates,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: MapPin,
      label: 'High Risk Areas',
      value: stats.high_risk_areas,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="glass-card rounded-xl p-6 hover:border-primary/50 transition-all"
          data-testid={`stat-card-${index}`}
        >
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bg} mb-4`}>
            <stat.icon className={`h-6 w-6 ${stat.color}`} />
          </div>
          <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};