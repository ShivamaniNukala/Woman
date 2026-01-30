import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigation, MapPin } from 'lucide-react';

export const RouteSearch = ({ onSearch, loading }) => {
  const [startLat, setStartLat] = useState('19.0760');
  const [startLng, setStartLng] = useState('72.8777');
  const [endLat, setEndLat] = useState('19.1136');
  const [endLng, setEndLng] = useState('72.8697');
  
  const handleSearch = () => {
    onSearch({
      start_lat: parseFloat(startLat),
      start_lng: parseFloat(startLng),
      end_lat: parseFloat(endLat),
      end_lng: parseFloat(endLng),
    });
  };
  
  const getCurrentLocation = (isStart) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isStart) {
            setStartLat(position.coords.latitude.toFixed(4));
            setStartLng(position.coords.longitude.toFixed(4));
          } else {
            setEndLat(position.coords.latitude.toFixed(4));
            setEndLng(position.coords.longitude.toFixed(4));
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };
  
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Plan Safe Route</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Starting Point</Label>
          <div className="flex gap-2">
            <Input
              data-testid="start-lat-input"
              placeholder="Latitude"
              value={startLat}
              onChange={(e) => setStartLat(e.target.value)}
              type="number"
              step="0.0001"
              className="bg-slate-950/50 border-white/10 focus:border-primary"
            />
            <Input
              data-testid="start-lng-input"
              placeholder="Longitude"
              value={startLng}
              onChange={(e) => setStartLng(e.target.value)}
              type="number"
              step="0.0001"
              className="bg-slate-950/50 border-white/10 focus:border-primary"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => getCurrentLocation(true)}
            className="w-full hover:bg-white/10"
            data-testid="use-current-location-start"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Use Current Location
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Destination</Label>
          <div className="flex gap-2">
            <Input
              data-testid="end-lat-input"
              placeholder="Latitude"
              value={endLat}
              onChange={(e) => setEndLat(e.target.value)}
              type="number"
              step="0.0001"
              className="bg-slate-950/50 border-white/10 focus:border-primary"
            />
            <Input
              data-testid="end-lng-input"
              placeholder="Longitude"
              value={endLng}
              onChange={(e) => setEndLng(e.target.value)}
              type="number"
              step="0.0001"
              className="bg-slate-950/50 border-white/10 focus:border-primary"
            />
          </div>
        </div>
        
        <Button
          data-testid="calculate-route-button"
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(45,212,191,0.5)] rounded-full font-bold tracking-wide transition-all hover:scale-105"
        >
          {loading ? 'Calculating...' : 'Calculate Safest Route'}
        </Button>
      </div>
    </div>
  );
};