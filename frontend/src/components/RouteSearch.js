import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigation, MapPin } from 'lucide-react';
import { toast } from 'sonner';

// Sample location database for demo
const LOCATIONS = {
  'Gateway of India': { lat: 18.9220, lng: 72.8347 },
  'Bandra Station': { lat: 19.0544, lng: 72.8406 },
  'Andheri Station': { lat: 19.1197, lng: 72.8464 },
  'Dadar Station': { lat: 19.0176, lng: 72.8561 },
  'Colaba': { lat: 18.9067, lng: 72.8147 },
  'Worli Sea Face': { lat: 19.0176, lng: 72.8147 },
  'Powai Lake': { lat: 19.1197, lng: 72.9047 },
  'Juhu Beach': { lat: 19.0896, lng: 72.8264 },
  'Marine Drive': { lat: 18.9432, lng: 72.8236 },
  'Chhatrapati Shivaji Terminus': { lat: 18.9398, lng: 72.8355 },
  'BKC': { lat: 19.0653, lng: 72.8690 },
  'Lower Parel': { lat: 19.0000, lng: 72.8300 },
  'Goregaon Station': { lat: 19.1655, lng: 72.8495 },
  'Malad Station': { lat: 19.1862, lng: 72.8486 },
  'Borivali Station': { lat: 19.2304, lng: 72.8575 },
};

export const RouteSearch = ({ onSearch, loading }) => {
  const [startLocation, setStartLocation] = useState('Bandra Station');
  const [endLocation, setEndLocation] = useState('Andheri Station');
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  
  const getCoordinates = (locationName) => {
    const location = LOCATIONS[locationName];
    if (location) {
      return location;
    }
    // If exact match not found, try partial match
    const partialMatch = Object.keys(LOCATIONS).find(key => 
      key.toLowerCase().includes(locationName.toLowerCase())
    );
    return partialMatch ? LOCATIONS[partialMatch] : null;
  };
  
  const handleSearch = () => {
    const startCoords = getCoordinates(startLocation);
    const endCoords = getCoordinates(endLocation);
    
    if (!startCoords || !endCoords) {
      toast.error('Please select valid locations from the suggestions');
      return;
    }
    
    onSearch({
      start_lat: startCoords.lat,
      start_lng: startCoords.lng,
      end_lat: endCoords.lat,
      end_lng: endCoords.lng,
    });
  };
  
  const handleInputChange = (value, isStart) => {
    if (isStart) {
      setStartLocation(value);
      setActiveSuggestion('start');
    } else {
      setEndLocation(value);
      setActiveSuggestion('end');
    }
    
    // Filter suggestions
    if (value.length > 0) {
      const filtered = Object.keys(LOCATIONS).filter(loc =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };
  
  const selectSuggestion = (location, isStart) => {
    if (isStart) {
      setStartLocation(location);
    } else {
      setEndLocation(location);
    }
    setSuggestions([]);
    setActiveSuggestion(null);
  };
  
  const getCurrentLocation = (isStart) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For demo, find nearest location
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          let nearest = null;
          let minDist = Infinity;
          
          Object.entries(LOCATIONS).forEach(([name, coords]) => {
            const dist = Math.sqrt(
              Math.pow(coords.lat - userLat, 2) + 
              Math.pow(coords.lng - userLng, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              nearest = name;
            }
          });
          
          if (nearest) {
            if (isStart) {
              setStartLocation(nearest);
            } else {
              setEndLocation(nearest);
            }
            toast.success(`Using nearest location: ${nearest}`);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };
  
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Plan Safe Route</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2 relative">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Starting Point</Label>
          <Input
            data-testid="start-location-input"
            placeholder="Enter starting location"
            value={startLocation}
            onChange={(e) => handleInputChange(e.target.value, true)}
            onFocus={() => {
              setActiveSuggestion('start');
              if (startLocation) {
                handleInputChange(startLocation, true);
              }
            }}
            className="bg-slate-950/50 border-white/10 focus:border-primary"
          />
          {activeSuggestion === 'start' && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
              {suggestions.map((loc, index) => (
                <div
                  key={index}
                  onClick={() => selectSuggestion(loc, true)}
                  className="px-4 py-2 hover:bg-primary/20 cursor-pointer text-sm"
                  data-testid={`suggestion-${index}`}
                >
                  {loc}
                </div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => getCurrentLocation(true)}
            className="w-full hover:bg-white/10"
            data-testid="use-current-location-start"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Use Nearest Location
          </Button>
        </div>
        
        <div className="space-y-2 relative">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Destination</Label>
          <Input
            data-testid="end-location-input"
            placeholder="Enter destination"
            value={endLocation}
            onChange={(e) => handleInputChange(e.target.value, false)}
            onFocus={() => {
              setActiveSuggestion('end');
              if (endLocation) {
                handleInputChange(endLocation, false);
              }
            }}
            className="bg-slate-950/50 border-white/10 focus:border-primary"
          />
          {activeSuggestion === 'end' && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
              {suggestions.map((loc, index) => (
                <div
                  key={index}
                  onClick={() => selectSuggestion(loc, false)}
                  className="px-4 py-2 hover:bg-primary/20 cursor-pointer text-sm"
                >
                  {loc}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button
          data-testid="calculate-route-button"
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(45,212,191,0.5)] rounded-full font-bold tracking-wide transition-all hover:scale-105"
        >
          {loading ? 'Calculating...' : 'Calculate Safest Route'}
        </Button>
        
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Available Locations:</span> Gateway of India, Bandra, Andheri, Dadar, Colaba, Worli, Juhu Beach, Marine Drive, BKC, and more...
          </p>
        </div>
      </div>
    </div>
  );
};