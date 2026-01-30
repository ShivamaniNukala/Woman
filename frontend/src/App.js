import { useState, useEffect } from 'react';
import '@/App.css';
import 'leaflet/dist/leaflet.css';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MapView } from '@/components/MapView';
import { RouteSearch } from '@/components/RouteSearch';
import { SafetyScore } from '@/components/SafetyScore';
import { SOSButton } from '@/components/SOSButton';
import { IncidentReport } from '@/components/IncidentReport';
import { SafetyStats } from '@/components/SafetyStats';
import { Toaster } from '@/components/ui/sonner';
import { Shield, Map, FileText, BarChart3, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { path: '/', icon: Map, label: 'Map' },
    { path: '/report', icon: FileText, label: 'Report' },
    { path: '/stats', icon: BarChart3, label: 'Stats' },
  ];
  
  return (
    <nav className="glass-card border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SafestPath</h1>
              <p className="text-xs text-muted-foreground">Women's Safety Navigator</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-white/10 text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-white/10 text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

const MapPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [tollgates, setTollgates] = useState([]);
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  
  useEffect(() => {
    fetchData();
    fetchEmergencyContacts();
  }, []);
  
  const fetchData = async () => {
    try {
      const [incidentsRes, tollgatesRes] = await Promise.all([
        axios.get(`${API}/incidents`),
        axios.get(`${API}/tollgates`),
      ]);
      setIncidents(incidentsRes.data);
      setTollgates(tollgatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  const fetchEmergencyContacts = async () => {
    try {
      const response = await axios.get(`${API}/emergency-contacts`);
      setEmergencyContacts(response.data);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
    }
  };
  
  const handleRouteSearch = async (searchData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/routes/calculate`, searchData);
      setRoutes(response.data);
      setMapCenter([searchData.start_lat, searchData.start_lng]);
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <RouteSearch onSearch={handleRouteSearch} loading={loading} />
            {routes && <SafetyScore routes={routes} />}
          </div>
          
          {/* Map */}
          <div className="lg:col-span-3 h-[600px] lg:h-[800px]">
            <MapView
              incidents={incidents}
              tollgates={tollgates}
              routes={routes}
              center={mapCenter}
            />
          </div>
        </div>
      </div>
      
      <SOSButton emergencyContacts={emergencyContacts} />
    </div>
  );
};

const ReportPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetchIncidents();
    fetchStats();
  }, []);
  
  const fetchIncidents = async () => {
    try {
      const response = await axios.get(`${API}/incidents`);
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const handleReportSubmitted = () => {
    fetchIncidents();
    fetchStats();
  };
  
  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Report an Incident</h2>
          <p className="text-lg text-muted-foreground">
            Your anonymous reports help keep our community safe. All submissions are confidential.
          </p>
        </div>
        
        {stats && <SafetyStats stats={stats} />}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncidentReport onReportSubmitted={handleReportSubmitted} />
          
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {incidents.slice(0, 10).map((incident) => (
                <div
                  key={incident.id}
                  className="p-4 rounded-lg bg-slate-950/50 border border-white/10"
                  data-testid="incident-item"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold capitalize">{incident.incident_type.replace('_', ' ')}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Severity: {incident.severity}/5
                      </p>
                      {incident.description && (
                        <p className="text-xs text-muted-foreground mt-2">{incident.description}</p>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      incident.severity >= 4 ? 'bg-destructive/20 text-destructive' :
                      incident.severity >= 3 ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {incident.severity >= 4 ? 'High' : incident.severity >= 3 ? 'Medium' : 'Low'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsPage = () => {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [tollgates, setTollgates] = useState([]);
  
  useEffect(() => {
    fetchAllData();
  }, []);
  
  const fetchAllData = async () => {
    try {
      const [statsRes, incidentsRes, tollgatesRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/incidents`),
        axios.get(`${API}/tollgates`),
      ]);
      setStats(statsRes.data);
      setIncidents(incidentsRes.data);
      setTollgates(tollgatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  const incidentsByType = incidents.reduce((acc, incident) => {
    acc[incident.incident_type] = (acc[incident.incident_type] || 0) + 1;
    return acc;
  }, {});
  
  return (
    <div className="gradient-bg min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Safety Analytics</h2>
          <p className="text-lg text-muted-foreground">
            Comprehensive overview of safety data and incident patterns
          </p>
        </div>
        
        {stats && <SafetyStats stats={stats} />}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Incidents by Type</h3>
            <div className="space-y-4">
              {Object.entries(incidentsByType).map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${(count / incidents.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Monitored Checkpoints</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {tollgates.map((toll) => (
                <div
                  key={toll.id}
                  className="p-4 rounded-lg bg-slate-950/50 border border-white/10 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{toll.name}</h4>
                      <p className="text-xs text-muted-foreground">24/7 Monitored</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold mb-2">Enter Route</h4>
              <p className="text-sm text-muted-foreground">
                Input your starting point and destination
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Our system analyzes incidents and checkpoints
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-semibold mb-2">Safe Route</h4>
              <p className="text-sm text-muted-foreground">
                Get the safest path with real-time safety score
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;