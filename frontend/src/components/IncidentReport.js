import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const IncidentReport = ({ onReportSubmitted }) => {
  const [formData, setFormData] = useState({
    lat: '',
    lng: '',
    incident_type: '',
    severity: '3',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${BACKEND_URL}/api/incidents`, {
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        incident_type: formData.incident_type,
        severity: parseInt(formData.severity),
        description: formData.description,
      });
      
      toast.success('Incident reported anonymously. Thank you for making our community safer!');
      
      // Reset form
      setFormData({
        lat: '',
        lng: '',
        incident_type: '',
        severity: '3',
        description: '',
      });
      
      if (onReportSubmitted) onReportSubmitted();
    } catch (error) {
      console.error('Error reporting incident:', error);
      toast.error('Failed to report incident. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude.toFixed(4),
            lng: position.coords.longitude.toFixed(4),
          }));
          toast.success('Current location added');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location');
        }
      );
    }
  };
  
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="text-lg font-semibold">Report Incident</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Help make routes safer by reporting incidents anonymously. Your identity is protected.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider">Location</Label>
          <div className="flex gap-2">
            <Input
              data-testid="incident-lat-input"
              placeholder="Latitude"
              value={formData.lat}
              onChange={(e) => setFormData({...formData, lat: e.target.value})}
              type="number"
              step="0.0001"
              required
              className="bg-slate-950/50 border-white/10"
            />
            <Input
              data-testid="incident-lng-input"
              placeholder="Longitude"
              value={formData.lng}
              onChange={(e) => setFormData({...formData, lng: e.target.value})}
              type="number"
              step="0.0001"
              required
              className="bg-slate-950/50 border-white/10"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={useCurrentLocation}
            className="w-full hover:bg-white/10"
            data-testid="use-current-location-incident"
          >
            Use Current Location
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider">Incident Type</Label>
          <Select
            value={formData.incident_type}
            onValueChange={(value) => setFormData({...formData, incident_type: value})}
            required
          >
            <SelectTrigger data-testid="incident-type-select" className="bg-slate-950/50 border-white/10">
              <SelectValue placeholder="Select incident type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="theft">Theft</SelectItem>
              <SelectItem value="assault">Assault</SelectItem>
              <SelectItem value="unsafe_zone">Unsafe Zone</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider">Severity (1-5)</Label>
          <Select
            value={formData.severity}
            onValueChange={(value) => setFormData({...formData, severity: value})}
          >
            <SelectTrigger data-testid="incident-severity-select" className="bg-slate-950/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="1">1 - Minor</SelectItem>
              <SelectItem value="2">2 - Low</SelectItem>
              <SelectItem value="3">3 - Moderate</SelectItem>
              <SelectItem value="4">4 - High</SelectItem>
              <SelectItem value="5">5 - Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider">Description (Optional)</Label>
          <Textarea
            data-testid="incident-description-input"
            placeholder="Provide additional details..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="bg-slate-950/50 border-white/10 min-h-[100px]"
          />
        </div>
        
        <Button
          data-testid="submit-incident-button"
          type="submit"
          disabled={loading}
          className="w-full bg-destructive hover:bg-destructive/90 text-white shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] rounded-full font-bold"
        >
          {loading ? 'Submitting...' : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Report Anonymously
            </>
          )}
        </Button>
      </form>
    </div>
  );
};