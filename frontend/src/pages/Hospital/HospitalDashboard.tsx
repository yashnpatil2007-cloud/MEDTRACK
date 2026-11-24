import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Hospital, EmergencyRequest, Journey } from '../../types';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Building2, 
  Bed, 
  Inbox, 
  CheckCircle2, 
  Ambulance, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ShieldAlert, 
  Radio, 
  Activity,
  MapPin,
  ExternalLink,
  Edit3,
  X,
  Sparkles,
  Save,
  Check
} from 'lucide-react';
import { REAL_HOSPITAL_PRESETS } from '../../data/hospitalPresets';
import { LocationPickerMap } from '../../components/LocationPickerMap';

interface HospitalDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({ onNavigateTab }) => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useNotifications();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [activeAmbulances, setActiveAmbulances] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Location Configuration
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [modalAddress, setModalAddress] = useState('');
  const [modalLat, setModalLat] = useState(18.5204);
  const [modalLng, setModalLng] = useState(73.8567);
  const [savingLocation, setSavingLocation] = useState(false);

  const fetchHospitalData = async () => {
    try {
      const [hospRes, reqRes, actRes] = await Promise.all([
        api.getHospitalDetail(user?.user_id || ''),
        api.getHospitalRequests(),
        api.getActiveJourneys(),
      ]);
      setHospital(hospRes.hospital);
      setRequests(reqRes.requests);
      setActiveAmbulances(actRes.active_journeys);

      if (hospRes.hospital) {
        setModalAddress(hospRes.hospital.address || 'Shivajinagar, Pune, Maharashtra 411005');
        setModalLat(hospRes.hospital.latitude || 18.5204);
        setModalLng(hospRes.hospital.longitude || 73.8567);
      }
    } catch (err) {
      console.warn('Hospital dashboard loading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
    const interval = setInterval(fetchHospitalData, 8000);
    return () => clearInterval(interval);
  }, [user?.user_id]);

  const handleOpenLocationModal = () => {
    if (hospital) {
      setModalAddress(hospital.address || '');
      setModalLat(hospital.latitude || 18.5204);
      setModalLng(hospital.longitude || 73.8567);
    }
    setShowLocationModal(true);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = REAL_HOSPITAL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setModalAddress(preset.address);
      setModalLat(preset.latitude);
      setModalLng(preset.longitude);
      addToast({
        type: 'info',
        title: 'Preset Coordinates Loaded',
        message: `Applied location for ${preset.name}. Click 'Save Location' to commit.`,
      });
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAddress.trim()) {
      addToast({
        type: 'warning',
        title: 'Address Required',
        message: 'Please provide a valid physical street address.',
      });
      return;
    }

    setSavingLocation(true);
    try {
      await api.updateHospitalLocation(modalLat, modalLng, modalAddress.trim());
      addToast({
        type: 'success',
        title: 'Facility Location Synced',
        message: 'Updated coordinates and Google Maps location saved successfully.',
      });
      setShowLocationModal(false);
      await fetchHospitalData();
      await refreshUser();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Location Save Failed',
        message: err.message || 'Could not update facility location.',
      });
    } finally {
      setSavingLocation(false);
    }
  };

  const isPendingApproval = hospital?.verification_status === 'PENDING';
  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
  const acceptedRequests = requests.filter((r) => r.status === 'ACCEPTED' || r.status === 'JOURNEY_ACTIVE').length;

  const totalBeds = hospital?.total_beds || 0;
  const occupiedBeds = hospital?.occupied_beds || 0;
  const availableBeds = hospital?.available_beds || 0;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const currentLat = hospital?.latitude || 18.5204;
  const currentLng = hospital?.longitude || 73.8567;
  const googleMapsUrl = `https://www.google.com/maps?q=${currentLat},${currentLng}`;

  return (
    <div className="space-y-6">
      {/* PENDING APPROVAL WARNING BANNER */}
      {isPendingApproval && (
        <div className="p-5 rounded-2xl bg-amber-500 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 flex-shrink-0 animate-pulse" />
            <div>
              <h4 className="text-sm font-extrabold">Hospital Verification Pending Administrator Approval</h4>
              <p className="text-xs opacity-90 mt-0.5">
                Your hospital application is in review. Live ambulance routing will become active once an Administrator verifies your facility credentials.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white/20 px-3 py-1 rounded-lg">
            Status: PENDING
          </span>
        </div>
      )}

      {/* Top Welcome Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Hospital Emergency Command</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">{hospital?.hospital_name || user?.user_id}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Facility ID: <span className="font-mono font-bold text-navy-900">{user?.user_id}</span> | {hospital?.address || 'Shivajinagar, Pune'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('incoming-requests')}
            className="px-4 py-2.5 rounded-xl bg-navy-950 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 relative cursor-pointer"
          >
            <Inbox className="w-4 h-4 text-cyan-400" />
            <span>Incoming Triage Queue</span>
            {pendingRequests > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping absolute -top-1 -right-1" />
            )}
          </button>
          <button
            onClick={() => onNavigateTab('bed-availability')}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Bed className="w-4 h-4" />
            <span>Manage Beds</span>
          </button>
        </div>
      </div>

      {/* FACILITY LOCATION & GOOGLE MAPS REGISTRY BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Facility Location & GPS Registry</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Google Maps Aligned</span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 mt-1">
                {hospital?.address || 'Shivajinagar, Pune, Maharashtra 411005'}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Coordinates: <b>{currentLat.toFixed(5)}° N, {currentLng.toFixed(5)}° E</b> (Ambulance ETA calculates to this destination)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Open this hospital location on Google Maps in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
              <span>View on Google Maps</span>
            </a>

            <button
              onClick={handleOpenLocationModal}
              className="px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-black text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update Location Pin</span>
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
        <StatCard
          title="Incoming Requests"
          value={requests.length}
          icon={Inbox}
          color="navy"
          subtitle="Total assigned"
        />
        <StatCard
          title="Pending Queue"
          value={pendingRequests}
          icon={Clock}
          color="amber"
          subtitle="Needs decision"
        />
        <StatCard
          title="Accepted"
          value={acceptedRequests}
          icon={CheckCircle2}
          color="teal"
          subtitle="Trauma bay reserved"
        />
        <StatCard
          title="Inbound En-Route"
          value={activeAmbulances.length}
          icon={Ambulance}
          color="cyan"
          subtitle="Moving to facility"
        />
        <StatCard
          title="Total Beds"
          value={totalBeds}
          icon={Bed}
          color="navy"
          subtitle="Capacity baseline"
        />
        <StatCard
          title="Occupied Beds"
          value={occupiedBeds}
          icon={Bed}
          color="amber"
          subtitle={`${occupancyRate}% utilization`}
        />
        <StatCard
          title="Available Beds"
          value={availableBeds}
          icon={Bed}
          color="teal"
          subtitle="Ready for patients"
        />
      </div>

      {/* PENDING REQUESTS ACTION QUEUE */}
      {pendingRequests > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
              <h3 className="text-sm font-black text-navy-950 uppercase tracking-wide">
                Urgent Incoming Requests Requiring Decision ({pendingRequests})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('incoming-requests')}
              className="text-xs font-bold text-amber-800 hover:underline flex items-center cursor-pointer"
            >
              <span>Process In Triage Queue</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requests
              .filter((r) => r.status === 'PENDING')
              .slice(0, 4)
              .map((req) => (
                <div key={req.id} className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-navy-950">{req.request_id}</span>
                    <StatusBadge level={req.emergency_level} />
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-navy-950">{req.patient_name} ({req.patient_age} yrs)</p>
                    <p className="text-slate-500 mt-0.5">Ambulance: {req.ambulance_id}</p>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onNavigateTab('incoming-requests')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Review & Decide
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ACTIVE INBOUND AMBULANCES PREVIEW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-950">Active Inbound Ambulances</h3>
            <p className="text-xs text-slate-500">Ambulances with accepted and en-route patient transfers to this trauma center</p>
          </div>
          <button
            onClick={() => onNavigateTab('live-location')}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>Open Map Radar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeAmbulances.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No active ambulance journeys en-route at this moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {activeAmbulances.map((amb) => (
              <div key={amb.journey_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-950 font-mono text-xs">{amb.ambulance_id}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 flex items-center">
                    <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" />
                    En-Route
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>Request: <span className="font-mono font-semibold">{amb.request_id}</span></p>
                  <p>Route: <span className="font-semibold text-teal-700">{amb.route_name}</span></p>
                  <p>ETA: <span className="font-bold text-navy-950">{amb.estimated_duration_mins} mins</span> ({amb.estimated_distance_km} km)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: UPDATE FACILITY LOCATION & GOOGLE MAPS REGISTRY */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-950">Update Hospital Facility Location</h3>
                  <p className="text-[11px] text-slate-500">Configure exact Google Maps GPS coordinates for ambulance dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4">
              {/* Presets */}
              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-navy-950 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Quick-Apply Real Hospital Coordinates:</span>
                </span>
                <select
                  onChange={(e) => handleApplyPreset(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-cyan-300 text-xs font-semibold bg-white text-navy-950"
                  defaultValue=""
                >
                  <option value="" disabled>-- Select a Real Verified Hospital to Auto-Fill --</option>
                  {REAL_HOSPITAL_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.address.split(',')[0]} — {p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                  Street Address & Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={modalAddress}
                  onChange={(e) => setModalAddress(e.target.value)}
                  placeholder="e.g. 40, Sassoon Road, Sangamvadi, Pune 411001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Map Picker */}
              <div>
                <LocationPickerMap
                  latitude={modalLat}
                  longitude={modalLng}
                  onChange={(lat, lng) => {
                    setModalLat(lat);
                    setModalLng(lng);
                  }}
                  height="220px"
                  markerTitle={hospital?.hospital_name || 'Hospital Entrance'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={modalLat}
                    onChange={(e) => setModalLat(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={modalLng}
                    onChange={(e) => setModalLng(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingLocation ? 'Saving Coordinates...' : 'Save Location'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
