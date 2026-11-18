import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Journey } from '../../types';
import { LeafletMap } from '../../components/LeafletMap';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Ambulance, 
  Radio, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Navigation, 
  ShieldAlert, 
  RefreshCw 
} from 'lucide-react';

export const ActiveAmbulances: React.FC = () => {
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveAmbulances = async () => {
    try {
      const res = await api.getActiveJourneys();
      setActiveJourneys(res.active_journeys);
      if (res.active_journeys.length > 0 && !selectedJourney) {
        setSelectedJourney(res.active_journeys[0]);
      } else if (res.active_journeys.length === 0) {
        setSelectedJourney(null);
      }
    } catch (err) {
      console.warn('Error fetching active ambulances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAmbulances();
    const interval = setInterval(fetchActiveAmbulances, 6000);
    return () => clearInterval(interval);
  }, []);

  // Parse route polyline coordinates
  let parsedRoute: [number, number][] = [];
  if (selectedJourney?.route_geometry) {
    try {
      parsedRoute = JSON.parse(selectedJourney.route_geometry);
    } catch {
      parsedRoute = [];
    }
  }

  const currentPos: [number, number] | null = selectedJourney?.latest_lat && selectedJourney?.latest_lng
    ? [selectedJourney.latest_lat, selectedJourney.latest_lng]
    : selectedJourney
    ? [selectedJourney.start_lat, selectedJourney.start_lng]
    : null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Inbound Unit Radar</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Active Ambulances & Live Radar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time GPS tracking of ambulances currently en-route to this facility.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
          <span>{activeJourneys.length} Ambulance(s) En-Route</span>
        </div>
      </div>

      {activeJourneys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Ambulance className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-navy-950">No Inbound Ambulances</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no active ambulance journeys en-route to your hospital. When an accepted request starts transit, it will stream here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Ambulances List Selector */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wide">Select Ambulance Telemetry</h3>
            <div className="space-y-2.5">
              {activeJourneys.map((jrn) => {
                const isSelected = selectedJourney?.journey_id === jrn.journey_id;
                return (
                  <div
                    key={jrn.journey_id}
                    onClick={() => setSelectedJourney(jrn)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-50/40 ring-2 ring-cyan-600/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-xs text-navy-950">{jrn.ambulance_id}</span>
                      <StatusBadge level={jrn.emergency_level || 'CRITICAL'} />
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p className="font-semibold text-navy-900">Patient: {jrn.patient_name || 'Emergency Transfer'}</p>
                      <p className="text-[11px] text-slate-500">Route: {jrn.route_name}</p>
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                        <span className="text-teal-700 font-bold">{jrn.estimated_duration_mins} mins ETA</span>
                        <span className="text-slate-400 font-mono">±{jrn.latest_accuracy || 10}m accuracy</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Map Display */}
          <div className="lg:col-span-8 space-y-4">
            {selectedJourney && (
              <>
                <LeafletMap
                  ambulancePos={currentPos}
                  hospitalPos={[selectedJourney.dest_lat, selectedJourney.dest_lng]}
                  hospitalName={selectedJourney.hospital_id}
                  ambulanceId={selectedJourney.ambulance_id}
                  routeCoordinates={parsedRoute}
                  accuracy={selectedJourney.latest_accuracy}
                  lastUpdated={selectedJourney.latest_telemetry_time}
                  isLiveTracking={true}
                  height="500px"
                  showControls={false}
                />

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-teal-600 animate-pulse" />
                    <span className="font-semibold text-navy-950">Active Incident: {selectedJourney.request_id}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>Speed: ~48 km/h</span>
                    <span>Distance: {selectedJourney.estimated_distance_km} km</span>
                    {selectedJourney.latest_telemetry_time && (
                      <span className="text-slate-400">
                        Signal: {new Date(selectedJourney.latest_telemetry_time).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
