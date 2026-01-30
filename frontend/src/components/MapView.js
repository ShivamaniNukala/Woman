import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, AlertTriangle, Navigation } from 'lucide-react';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color, iconHtml) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">${iconHtml}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const safeIcon = createCustomIcon('#2DD4BF', '<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>');
const dangerIcon = createCustomIcon('#F97316', '<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>');
const userIcon = createCustomIcon('#38BDF8', '<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>');

function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

export const MapView = ({ 
  incidents = [], 
  tollgates = [], 
  routes = null,
  center = [19.0760, 72.8777],
  userLocation = null 
}) => {
  const [map, setMap] = useState(null);
  
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-white/10" data-testid="map-container">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater center={center} />
        
        {/* User Location */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-white">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Incidents */}
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.lat, incident.lng]}
            icon={dangerIcon}
          >
            <Popup>
              <div className="text-white">
                <strong className="text-destructive">Incident: {incident.incident_type}</strong>
                <p className="text-sm mt-1">Severity: {incident.severity}/5</p>
                {incident.description && (
                  <p className="text-xs mt-1 text-muted-foreground">{incident.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Toll Gates */}
        {tollgates.map((toll) => (
          <Marker
            key={toll.id}
            position={[toll.lat, toll.lng]}
            icon={safeIcon}
          >
            <Popup>
              <div className="text-white">
                <strong className="text-primary">{toll.name}</strong>
                <p className="text-sm mt-1">Monitored Checkpoint</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Routes */}
        {routes && (
          <>
            {/* Safest Route */}
            <Polyline
              positions={routes.safest_route.map(p => [p.lat, p.lng])}
              color="#2DD4BF"
              weight={4}
              opacity={0.8}
            />
            
            {/* Shortest Route */}
            <Polyline
              positions={routes.shortest_route.map(p => [p.lat, p.lng])}
              color="#64748B"
              weight={3}
              opacity={0.6}
              dashArray="10, 5"
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};