import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Journey, EmergencyRequest } from '../../types';
import { LeafletMap } from '../../components/LeafletMap';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Navigation, 
  Play, 
  CheckCircle, 
  Radio, 
  Clock, 
  MapPin, 
  Building2, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCw,
  Compass
} from 'lucide-react';

interface LiveTrackingProps {
  onJourneyCompleted?: () => void;
}

export const LiveTracking: React.FC<LiveTrackingProps> = ({ onJourneyCompleted }) => {
  const { addToast } = useNotifications();

  const [activeJourneys, setActiveJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [acceptedRequests, setAcceptedRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Live telemetry state
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [isWatchingGps, setIsWatchingGps] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Rerouting state
  const [showRerouteModal, setShowRerouteModal] = useState(false);
  const [newRouteReason, setNewRouteReason] = useState('Traffic congestion reported');

  const fetchActiveState = async () => {
    try {
      const [jrnRes, reqRes] = await Promise.all([
        api.getActiveJourneys(),
        api.getRequests(),
      ]);
      let activeList = jrnRes.active_journeys || [];
      if (activeList.length === 0) {
        const reqWithJrn = (reqRes.requests || []).find(
          (r: any) => (r.status === 'ON JOURNEY' || r.has_active_journey) && r.journey
        );
        if (reqWithJrn && reqWithJrn.journey) {
          activeList = [reqWithJrn.journey];
        }
      }
      setActiveJourneys(activeList);

      const ready = (reqRes.requests || []).filter(
        (r) => r.status === 'ACCEPTED' || r.status === 'BOOKED' || r.status === 'PATIENT PICKED UP' || r.status === 'PENDING'
      );
      setAcceptedRequests(ready);

      if (activeList.length > 0) {
        const jrn = activeList[0];
        setSelectedJourney(jrn);
        if (jrn.latest_lat && jrn.latest_lng) {
          setCurrentPos([jrn.latest_lat, jrn.latest_lng]);
          setCurrentAccuracy(jrn.latest_accuracy || 10);
        } else {
          setCurrentPos([jrn.start_lat, jrn.start_lng]);
        }
      } else {
        setSelectedJourney(null);
      }
    } catch (err) {
      console.error('Error fetching live tracking state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveState();
    const interval = setInterval(fetchActiveState, 8000);
    return () => clearInterval(interval);
  }, []);

  // Browser Geolocation Watcher
  const toggleGpsWatcher = () => {
    if (!navigator.geolocation) {
      addToast({
        type: 'warning',
        title: 'GPS Unavailable',
        message: 'Browser Geolocation API is not supported on this device.',
      });
      return;
    }

    if (isWatchingGps) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatchingGps(false);
      addToast({
        type: 'info',
        title: 'GPS Streaming Paused',
        message: 'Device location updates paused.',
      });
    } else {
      setIsWatchingGps(true);
      addToast({
        type: 'success',
        title: 'GPS Streaming Active',
        message: 'Streaming real-time coordinates to hospital.',
      });

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const acc = position.coords.accuracy;
          const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 45; // km/h
          const heading = position.coords.heading || 0;

          setCurrentPos([lat, lng]);
          setCurrentAccuracy(acc);

          if (selectedJourney) {
            try {
              await api.postLocationUpdate(selectedJourney.journey_id, {
                latitude: lat,
                longitude: lng,
                accuracy: acc,
                speed,
                heading,
              });
            } catch (e) {
              console.warn('Failed to stream telemetry:', e);
            }
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setIsWatchingGps(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
      );
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Handle Starting Journey for an Accepted Request
  const handleStartJourney = async (requestId: string) => {
    try {
      const res = await api.startJourney(requestId);
      addToast({
        type: 'success',
        title: 'Journey Commenced',
        message: 'Live tracking telemetry is now transmitting to hospital.',
      });
      fetchActiveState();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to Start Journey',
        message: err.message,
      });
    }
  };

  // Handle Ending Journey
  const handleEndJourney = async (journeyId: string) => {
    try {
      await api.endJourney(journeyId);
      addToast({
        type: 'success',
        title: 'Journey Completed',
        message: 'Patient safely delivered to trauma emergency bay.',
      });
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsWatchingGps(false);
      }
      fetchActiveState();
      if (onJourneyCompleted) onJourneyCompleted();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Ending Journey',
        message: err.message,
      });
    }
  };

  // Simulation step handler for indoor desktop verification
  const handleSimulateStep = async (lat: number, lng: number) => {
    setCurrentPos([lat, lng]);
    if (selectedJourney) {
      try {
        await api.postLocationUpdate(selectedJourney.journey_id, {
          latitude: lat,
          longitude: lng,
          accuracy: 6.0,
          speed: 52.0,
          heading: 85.0,
        });
      } catch (e) {
        // simulation error
      }
    }
  };

  // Handle Route Alteration
  const handleReroute = async (newRouteName: string) => {
    if (!selectedJourney) return;
    try {
      await api.updateJourneyRoute(selectedJourney.journey_id, newRouteName, newRouteReason);
      addToast({
        type: 'info',
        title: 'Route Alteration Saved',
        message: `Route updated to ${newRouteName}. Hospital notified.`,
      });
      setShowRerouteModal(false);
      fetchActiveState();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Reroute Failed',
        message: err.message,
      });
    }
  };

  // Parse route coordinates from GeoJSON / JSON string
  let parsedRoute: [number, number][] = [];
  if (selectedJourney?.route_geometry) {
    try {
      parsedRoute = JSON.parse(selectedJourney.route_geometry);
    } catch (e) {
      parsedRoute = [];
    }
  }

  // Dynamic route fallback if geometry was not pre-populated
  const [dynamicRouteCoords, setDynamicRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!selectedJourney) return;

    if (selectedJourney.route_geometry) {
      try {
        const parsed = JSON.parse(selectedJourney.route_geometry);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDynamicRouteCoords(parsed);
          return;
        }
      } catch (e) {
        // fallback to live routing calculation
      }
    }

    const startLat = selectedJourney.start_lat || currentPos?.[0] || 18.6750;
    const startLng = selectedJourney.start_lng || currentPos?.[1] || 73.8980;
    const destLat = selectedJourney.dest_lat || 18.5326;
    const destLng = selectedJourney.dest_lng || 73.8777;

    api.calculateRoutes(startLat, startLng, destLat, destLng)
      .then((res) => {
        if (res.routes && res.routes.length > 0 && res.routes[0].coordinates.length > 0) {
          setDynamicRouteCoords(res.routes[0].coordinates);
        }
      })
      .catch((err) => {
        console.warn('Fallback routing fetch notice:', err);
      });
  }, [selectedJourney?.journey_id, selectedJourney?.route_geometry]);

  const activeRouteCoordinates = dynamicRouteCoords.length > 0 ? dynamicRouteCoords : parsedRoute;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Real-Time Navigation</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Active Emergency Transit</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real satellite GPS telemetry streaming directly to the hospital coordination desk.
          </p>
        </div>

        {selectedJourney && (
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleGpsWatcher}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                isWatchingGps
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isWatchingGps ? 'animate-pulse' : ''}`} />
              <span>{isWatchingGps ? 'Pause GPS Stream' : 'Stream Device GPS'}</span>
            </button>

            <button
              onClick={() => handleEndJourney(selectedJourney.journey_id)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>End Journey (Arrived)</span>
            </button>
          </div>
        )}
      </div>

      {/* If no journey is active, show accepted requests awaiting departure */}
      {!selectedJourney && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Navigation className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-navy-950">No Active Transit In Progress</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When a hospital accepts an emergency request, you can commence live GPS tracking here.
          </p>

          {acceptedRequests.length > 0 && (
            <div className="max-w-xl mx-auto pt-4 space-y-3">
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider text-left">
                Accepted Requests Ready for Departure ({acceptedRequests.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {acceptedRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-slate-50 flex items-center justify-between text-left">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-navy-950">{req.request_id}</span>
                        <StatusBadge level={req.emergency_level} />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        Patient: {req.patient_name} ({req.patient_age} yrs)
                      </p>
                      <p className="text-[11px] text-teal-700 font-medium">
                        Target: {req.destination_hospital_name}
                      </p>
                    </div>

                    <button
                      onClick={() => handleStartJourney(req.request_id)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center space-x-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Journey</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE JOURNEY MAP & TELEMETRY CONSOLE */}
      {selectedJourney && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Column */}
          <div className="lg:col-span-8 space-y-4">
            <LeafletMap
              ambulancePos={currentPos}
              hospitalPos={[selectedJourney.dest_lat, selectedJourney.dest_lng]}
              hospitalName={selectedJourney.destination_hospital_name || selectedJourney.hospital_id}
              ambulanceId={selectedJourney.ambulance_id}
              routeCoordinates={activeRouteCoordinates}
              accuracy={currentAccuracy}
              lastUpdated={selectedJourney.latest_telemetry_time}
              isLiveTracking={isWatchingGps}
              onSimulateStep={handleSimulateStep}
              height="520px"
              showControls={true}
            />

            {/* Road Traffic Disclaimer Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>
                Road topology powered by OpenStreetMap contributors via OSRM. Siren clearance active. Simulated traffic advisories are designated.
              </span>
            </div>
          </div>

          {/* Telemetry Sidebar Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-navy-950 uppercase tracking-wide">Transit Status</span>
                <StatusBadge status="ACTIVE" />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Journey Code:</span>
                  <p className="font-mono font-bold text-navy-950">{selectedJourney.journey_id}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Selected Corridor:</span>
                  <p className="font-semibold text-teal-700">{selectedJourney.route_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Destination Emergency Unit:</span>
                  <p className="font-semibold text-navy-950">{selectedJourney.destination_hospital_name || selectedJourney.hospital_id}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Estimated Time</span>
                    <span className="text-sm font-extrabold text-navy-950">{selectedJourney.estimated_duration_mins} mins</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Corridor Distance</span>
                    <span className="text-sm font-extrabold text-navy-950">{selectedJourney.estimated_distance_km} km</span>
                  </div>
                </div>
              </div>

              {/* Reroute Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowRerouteModal(true)}
                  className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-navy-950 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                  <span>Modify Route in Transit</span>
                </button>
              </div>
            </div>

            {/* Telemetry Feed Log */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-navy-950 uppercase tracking-wide block">Real-Time Coordinates</span>
              {currentPos ? (
                <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Latitude:</span>
                    <span className="font-bold text-navy-950">{currentPos[0].toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Longitude:</span>
                    <span className="font-bold text-navy-950">{currentPos[1].toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Accuracy:</span>
                    <span className="text-teal-700">±{currentAccuracy ? Math.round(currentAccuracy) : 8}m</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Awaiting location fix...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reroute Modal */}
      {showRerouteModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-navy-950">Modify Active Transit Route</h3>
            <p className="text-xs text-slate-600">
              Select an alternative corridor if primary arterial route is congested or blocked. The hospital will be alerted instantly.
            </p>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-navy-950 uppercase">Reason for Detour</label>
              <input
                type="text"
                value={newRouteReason}
                onChange={(e) => setNewRouteReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="space-y-2">
              {['Secondary Bypass Corridor', 'Direct Urban Arterial Route', 'Expressway Flyover Network'].map((name) => (
                <button
                  key={name}
                  onClick={() => handleReroute(name)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 text-xs font-semibold text-navy-950 transition-all flex items-center justify-between"
                >
                  <span>{name}</span>
                  <Compass className="w-4 h-4 text-teal-600" />
                </button>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowRerouteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
