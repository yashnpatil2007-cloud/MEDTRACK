import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, ShieldAlert, Radio, Play, Pause, RotateCcw } from 'lucide-react';

interface LeafletMapProps {
  ambulancePos?: [number, number] | null;
  hospitalPos?: [number, number] | null;
  hospitalName?: string;
  ambulanceId?: string;
  routeCoordinates?: [number, number][];
  accuracy?: number | null;
  lastUpdated?: string | null;
  isLiveTracking?: boolean;
  onSimulateStep?: (lat: number, lng: number) => void;
  height?: string;
  showControls?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  ambulancePos,
  hospitalPos,
  hospitalName = 'Destination Hospital',
  ambulanceId = 'Ambulance Unit',
  routeCoordinates = [],
  accuracy,
  lastUpdated,
  isLiveTracking = false,
  onSimulateStep,
  height = '450px',
  showControls = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Simulation state for desktop demo verification
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(0);

  // Create custom SVG icons
  const createAmbulanceIcon = () => {
    return L.divIcon({
      className: 'custom-ambulance-icon',
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(220, 38, 38, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 30px; height: 30px; border-radius: 50%; background: #0B192C; border: 2px solid #EF4444; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 10H6"/>
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.507l-1.74-2.898A1 1 0 0 0 14.216 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  };

  const createHospitalIcon = () => {
    return L.divIcon({
      className: 'custom-hospital-icon',
      html: `
        <div style="width: 36px; height: 36px; border-radius: 50%; background: #0D9488; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(13, 148, 136, 0.4);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6v12"/>
            <path d="M6 12h12"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = ambulancePos || hospitalPos || [12.9716, 77.5946];
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView(defaultCenter, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers, Polylines and Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Hospital Marker
    if (hospitalPos && hospitalPos[0] && hospitalPos[1]) {
      if (!hospitalMarkerRef.current) {
        hospitalMarkerRef.current = L.marker(hospitalPos, { icon: createHospitalIcon() })
          .addTo(map)
          .bindPopup(`<b>${hospitalName}</b><br/><span style="font-size:11px;color:#64748b;">Emergency Destination</span>`);
      } else {
        hospitalMarkerRef.current.setLatLng(hospitalPos);
      }
    } else if (hospitalMarkerRef.current) {
      map.removeLayer(hospitalMarkerRef.current);
      hospitalMarkerRef.current = null;
    }

    // 2. Ambulance Marker & Accuracy Circle
    if (ambulancePos && ambulancePos[0] && ambulancePos[1]) {
      if (!ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current = L.marker(ambulancePos, { icon: createAmbulanceIcon() })
          .addTo(map)
          .bindPopup(`<b>${ambulanceId}</b><br/><span style="font-size:11px;color:#64748b;">Active Telemetry Feed</span>`);
      } else {
        ambulanceMarkerRef.current.setLatLng(ambulancePos);
      }

      // Accuracy circle
      if (accuracy && accuracy > 0) {
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle(ambulancePos, {
            radius: Math.min(accuracy, 200),
            color: '#06B6D4',
            fillColor: '#06B6D4',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng(ambulancePos);
          accuracyCircleRef.current.setRadius(Math.min(accuracy, 200));
        }
      }
    } else if (ambulanceMarkerRef.current) {
      map.removeLayer(ambulanceMarkerRef.current);
      ambulanceMarkerRef.current = null;
      if (accuracyCircleRef.current) {
        map.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
    }

    // 3. Route Polyline
    if (routeCoordinates && routeCoordinates.length > 0) {
      if (!polylineRef.current) {
        polylineRef.current = L.polyline(routeCoordinates, {
          color: '#0D9488',
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);
      } else {
        polylineRef.current.setLatLngs(routeCoordinates);
      }

      // Fit bounds to encompass the route
      try {
        const bounds = L.latLngBounds(routeCoordinates);
        if (ambulancePos) bounds.extend(ambulancePos);
        if (hospitalPos) bounds.extend(hospitalPos);
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch (err) {
        // bounds calculation fallback
      }
    } else if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
  }, [ambulancePos, hospitalPos, routeCoordinates, accuracy, hospitalName, ambulanceId]);

  // Simulation loop for test driving along route
  useEffect(() => {
    if (!isSimulating || !routeCoordinates || routeCoordinates.length === 0) return;

    const timer = setInterval(() => {
      setSimIndex((prev) => {
        const next = (prev + 1) % routeCoordinates.length;
        const pt = routeCoordinates[next];
        if (onSimulateStep && pt) {
          onSimulateStep(pt[0], pt[1]);
        }
        return next;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [isSimulating, routeCoordinates, onSimulateStep]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full" />

      {/* Live Telemetry Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto bg-navy-950/85 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2.5 shadow-lg border border-slate-700">
          <Radio className={`w-3.5 h-3.5 ${isLiveTracking ? 'text-teal-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="font-semibold">
            {isLiveTracking ? 'Live Satellite GPS Active' : 'Static Coordinates'}
          </span>
          {accuracy && (
            <span className="text-[11px] text-slate-300 border-l border-slate-600 pl-2">
              Accuracy: ±{Math.round(accuracy)}m
            </span>
          )}
        </div>

        {lastUpdated && (
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md text-navy-900 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 shadow-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Desktop Simulation Testing Bar (allows verifying moving map without physical car) */}
      {showControls && routeCoordinates && routeCoordinates.length > 1 && onSimulateStep && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200 shadow-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-navy-950 flex items-center">
              <Navigation className="w-3.5 h-3.5 mr-1 text-teal-600" />
              Demo Route Simulator:
            </span>
            <span className="text-slate-500 hidden sm:inline">
              Step {simIndex + 1} of {routeCoordinates.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition-colors ${
                isSimulating 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Simulate Transit</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsSimulating(false);
                setSimIndex(0);
                if (routeCoordinates[0]) {
                  onSimulateStep(routeCoordinates[0][0], routeCoordinates[0][1]);
                }
              }}
              className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Reset to Origin"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
