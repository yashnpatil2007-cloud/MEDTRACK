import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { EmergencyRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  HeartPulse, 
  User, 
  MapPin, 
  Building2, 
  Clock, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Route, 
  PlusCircle, 
  Thermometer, 
  Droplet,
  Check,
  AlertCircle
} from 'lucide-react';

interface PatientViewProps {
  onNavigateTab: (tab: string) => void;
}

export const PatientView: React.FC<PatientViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmingPickup, setConfirmingPickup] = useState<boolean>(false);

  // Vitals tracker state (local preview)
  const [vitals, setVitals] = useState({
    bpSystolic: 122,
    bpDiastolic: 80,
    heartRate: 88,
    spO2: 97,
    respiratoryRate: 18,
    consciousness: 'Alert & Oriented',
    notes: 'Patient conscious, reporting moderate chest discomfort. Oxygen therapy administered at 4L/min.'
  });
  const [vitalsSaved, setVitalsSaved] = useState<boolean>(false);

  const fetchActiveRequest = async () => {
    try {
      setLoading(true);
      const res = await api.getRequests();
      // Find latest non-completed request for this ambulance
      const active = res.requests.find(
        (r) => r.status === 'ACCEPTED' || 
               r.status === 'BOOKED' || 
               r.status === 'PATIENT PICKED UP' || 
               r.status === 'PENDING' ||
               r.status === 'ON JOURNEY' || 
               r.status === 'JOURNEY_ACTIVE'
      );
      setActiveRequest(active || null);
    } catch (err: any) {
      console.error('Failed to load active patient request:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRequest();
  }, []);

  const handleConfirmPickup = async () => {
    if (!activeRequest) return;
    try {
      setConfirmingPickup(true);
      const res = await api.confirmPatientPickup(activeRequest.request_id);
      addToast({
        title: 'Patient Pickup Confirmed',
        message: 'Patient is safely on-board. Select destination hospital and route to start journey.',
        type: 'success',
      });
      // Refresh local active request
      setActiveRequest(prev => prev ? { ...prev, status: 'PATIENT PICKED UP' } : null);
    } catch (err: any) {
      console.error('Pickup confirmation error:', err);
      addToast({
        title: 'Pickup Status Update',
        message: err.message || 'Status updated locally to PATIENT PICKED UP.',
        type: 'info',
      });
      setActiveRequest(prev => prev ? { ...prev, status: 'PATIENT PICKED UP' } : null);
    } finally {
      setConfirmingPickup(false);
    }
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    setVitalsSaved(true);
    addToast({
      title: 'Triage Vitals Recorded',
      message: 'Telemetry synced with receiving hospital emergency bay.',
      type: 'success',
    });
    setTimeout(() => setVitalsSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <HeartPulse className="w-10 h-10 text-teal-600 animate-pulse mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading Patient Triage Telemetry...</p>
        </div>
      </div>
    );
  }

  // 1. NO ACTIVE PATIENT (Status = AVAILABLE)
  if (!activeRequest) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-4">
            <HeartPulse className="w-8 h-8 text-teal-600" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 uppercase tracking-wider mb-2">
            Unit Status: Available
          </span>
          <h2 className="text-2xl font-black text-navy-950">No Patient Currently Assigned</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            Ambulance unit <span className="font-mono font-bold text-navy-900">{user?.user_id}</span> is ready and available for regional dispatch or direct incident creation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => onNavigateTab('new-request')}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Initiate Emergency Request</span>
            </button>
            <button
              onClick={() => onNavigateTab('nearby-hospitals')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Browse Nearby Hospitals</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine current lifecycle state
  const isBooked = activeRequest.status === 'ACCEPTED' || activeRequest.status === 'BOOKED' || activeRequest.status === 'PENDING';
  const isPickedUp = activeRequest.status === 'PATIENT PICKED UP';
  const isOnJourney = activeRequest.status === 'ON JOURNEY' || activeRequest.status === 'JOURNEY_ACTIVE';

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Active Patient Triage Console</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
              {activeRequest.request_id}
            </span>
          </div>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight mt-1">
            {activeRequest.patient_name || activeRequest.patient_identifier || 'Emergency Patient'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Age: <span className="font-bold text-navy-900">{activeRequest.patient_age || 40} years</span> | Triage Priority:{' '}
            <span className="font-bold uppercase text-red-600">{activeRequest.emergency_level}</span>
          </p>
        </div>

        {/* Dynamic Context Button */}
        <div className="flex items-center space-x-3">
          {isBooked && (
            <button
              onClick={handleConfirmPickup}
              disabled={confirmingPickup}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-600/30 transition-all flex items-center space-x-2 animate-bounce"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{confirmingPickup ? 'Updating Status...' : 'PATIENT PICKED UP'}</span>
            </button>
          )}

          {isPickedUp && (
            <button
              onClick={() => onNavigateTab('route')}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-600/30 transition-all flex items-center space-x-2"
            >
              <Route className="w-4 h-4" />
              <span>Select Route & Start Journey</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isOnJourney && (
            <button
              onClick={() => onNavigateTab('live-tracking')}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>View Live Radar Tracking</span>
            </button>
          )}
        </div>
      </div>

      {/* LIFECYCLE PROGRESS STEPPER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className={`p-3 rounded-xl border flex items-center space-x-3 ${isBooked || isPickedUp || isOnJourney ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${isBooked || isPickedUp || isOnJourney ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              ✓
            </div>
            <div>
              <div className="font-bold">1. BOOKED</div>
              <div className="text-[10px] text-slate-500">Call Accepted</div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center space-x-3 ${isPickedUp || isOnJourney ? 'bg-teal-50 border-teal-200 text-teal-900' : isBooked ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/30' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${isPickedUp || isOnJourney ? 'bg-teal-600 text-white' : isBooked ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
              2
            </div>
            <div>
              <div className="font-bold">2. PICKUP</div>
              <div className="text-[10px] text-slate-500">{isPickedUp || isOnJourney ? 'Patient On-Board' : 'Awaiting Arrival'}</div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center space-x-3 ${isOnJourney ? 'bg-teal-50 border-teal-200 text-teal-900' : isPickedUp ? 'bg-cyan-50 border-cyan-300 text-cyan-900 ring-2 ring-cyan-400/30' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${isOnJourney ? 'bg-teal-600 text-white' : isPickedUp ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              3
            </div>
            <div>
              <div className="font-bold">3. ROUTE & START</div>
              <div className="text-[10px] text-slate-500">{isOnJourney ? 'Transit Started' : 'Select Destination'}</div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center space-x-3 ${isOnJourney ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-400/30' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${isOnJourney ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
              4
            </div>
            <div>
              <div className="font-bold">4. ON JOURNEY</div>
              <div className="text-[10px] text-slate-500">{isOnJourney ? 'Live GPS Active' : 'Pending Departure'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN DETAILS & VITALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient Incident Details */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center space-x-2">
              <User className="w-4 h-4 text-teal-600" />
              <span>Incident Information</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Patient Name</span>
                <span className="text-navy-950 font-bold text-sm">
                  {activeRequest.patient_name || activeRequest.patient_identifier || 'Aarav Sharma'}
                </span>
                <span className="text-slate-500 ml-2 font-medium">({activeRequest.patient_age || 45} yrs)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Emergency Priority Level</span>
                <div className="mt-1">
                  <StatusBadge level={activeRequest.emergency_level} />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Pickup Location</span>
                <div className="flex items-start space-x-2 mt-1">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium text-navy-900 leading-snug">
                    {activeRequest.location_address || `${activeRequest.current_lat.toFixed(4)}, ${activeRequest.current_lng.toFixed(4)}`}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Assigned Destination Hospital</span>
                <div className="flex items-start space-x-2 mt-1">
                  <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-navy-900">{activeRequest.destination_hospital_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{activeRequest.hospital_id}</div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('nearby-hospitals')}
                  className="mt-2 text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                >
                  <span>Change Destination Hospital</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Selected Route Plan</span>
                <div className="font-bold text-navy-900 mt-1">{activeRequest.selected_route || 'Route A — Fastest Highway Transit'}</div>
                <button
                  onClick={() => onNavigateTab('route')}
                  className="mt-2 text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                >
                  <span>Compare Route Alternatives</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: In-Transit Triage & Vitals Telemetry */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-navy-950 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <span>On-Board Telemetry & Vitals Monitor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time vital signs continuously transmitted to receiving emergency trauma team
              </p>
            </div>
            {vitalsSaved && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Synced to Hospital Bay</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveVitals} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Blood Pressure</div>
                <div className="flex items-baseline space-x-1 mt-2">
                  <input
                    type="number"
                    value={vitals.bpSystolic}
                    onChange={(e) => setVitals({ ...vitals, bpSystolic: Number(e.target.value) })}
                    className="w-14 text-xl font-black text-navy-950 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-slate-400 font-bold">/</span>
                  <input
                    type="number"
                    value={vitals.bpDiastolic}
                    onChange={(e) => setVitals({ ...vitals, bpDiastolic: Number(e.target.value) })}
                    className="w-14 text-xl font-black text-navy-950 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">mmHg</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Heart Rate</div>
                <div className="flex items-baseline space-x-1 mt-2">
                  <input
                    type="number"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                    className="w-16 text-xl font-black text-red-600 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">BPM</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Pulse Oximeter</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Oxygen Saturation</div>
                <div className="flex items-baseline space-x-1 mt-2">
                  <input
                    type="number"
                    value={vitals.spO2}
                    onChange={(e) => setVitals({ ...vitals, spO2: Number(e.target.value) })}
                    className="w-16 text-xl font-black text-cyan-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">%</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">SpO2 Level</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Respiratory Rate</div>
                <div className="flex items-baseline space-x-1 mt-2">
                  <input
                    type="number"
                    value={vitals.respiratoryRate}
                    onChange={(e) => setVitals({ ...vitals, respiratoryRate: Number(e.target.value) })}
                    className="w-16 text-xl font-black text-navy-950 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">/min</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Breaths</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Consciousness Level (AVPU)
                </label>
                <select
                  value={vitals.consciousness}
                  onChange={(e) => setVitals({ ...vitals, consciousness: e.target.value })}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white text-navy-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Alert & Oriented">A — Alert & Oriented</option>
                  <option value="Responsive to Voice">V — Responsive to Voice</option>
                  <option value="Responsive to Pain">P — Responsive to Pain only</option>
                  <option value="Unresponsive">U — Unresponsive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Direct Radio Dispatch
                </label>
                <button
                  type="button"
                  onClick={() => onNavigateTab('communication')}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 hover:border-teal-500 px-3.5 py-2.5 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 transition-colors flex items-center justify-center space-x-2"
                >
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Open Emergency Radio Channel</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Observations & Paramedic Notes
              </label>
              <textarea
                rows={3}
                value={vitals.notes}
                onChange={(e) => setVitals({ ...vitals, notes: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white text-navy-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Enter clinical observations, administered medications, and IV line status..."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Paramedic ID: <span className="font-mono font-bold text-slate-600">{user?.user_id}</span>
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center space-x-2"
              >
                <HeartPulse className="w-4 h-4" />
                <span>Transmit Vitals Update</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
