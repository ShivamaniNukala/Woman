import { Shield, TrendingUp, AlertCircle, MapPin } from 'lucide-react';

export const SafetyScore = ({ routes }) => {
  if (!routes) return null;
  
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-primary';
    if (score >= 50) return 'text-yellow-500';
    return 'text-destructive';
  };
  
  const getScoreLabel = (score) => {
    if (score >= 75) return 'Very Safe';
    if (score >= 50) return 'Moderately Safe';
    return 'Use Caution';
  };
  
  return (
    <div className="glass-card rounded-xl p-6 space-y-6" data-testid="safety-score-panel">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-4">
          <Shield className={`h-12 w-12 ${getScoreColor(routes.safety_score)}`} />
        </div>
        <h2 className="text-5xl font-bold mb-2" data-testid="safety-score-value">
          {routes.safety_score}
        </h2>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Safety Score
        </p>
        <p className={`text-lg font-semibold mt-2 ${getScoreColor(routes.safety_score)}`}>
          {getScoreLabel(routes.safety_score)}
        </p>
      </div>
      
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Distance</span>
          </div>
          <span className="font-semibold" data-testid="route-distance">{routes.distance_km} km</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Estimated Time</span>
          </div>
          <span className="font-semibold" data-testid="route-time">{routes.estimated_time_min} min</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm">Checkpoints</span>
          </div>
          <span className="font-semibold text-primary" data-testid="toll-count">{routes.toll_count}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm">Incidents Nearby</span>
          </div>
          <span className="font-semibold text-destructive" data-testid="incident-count">{routes.incident_count}</span>
        </div>
      </div>
      
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded-full bg-primary"></div>
          <span className="text-sm">Safest Route (Recommended)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-slate-500"></div>
          <span className="text-sm">Shortest Route</span>
        </div>
      </div>
    </div>
  );
};