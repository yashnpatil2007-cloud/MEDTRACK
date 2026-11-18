import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  Activity 
} from 'lucide-react';

interface HospitalDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [activeAmbulances, setActiveAmbulances] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

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

  const isPendingApproval = hospital?.verification_status === 'PENDING';
  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
  const acceptedRequests = requests.filter((r) => r.status === 'ACCEPTED' || r.status === 'JOURNEY_ACTIVE').length;

  const totalBeds = hospital?.total_beds || 0;
  const occupiedBeds = hospital?.occupied_beds || 0;
  const availableBeds = hospital?.available_beds || 0;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

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
                Your hospital application is in review. Live ambulance routing will become active once an Administrator verifies your facility.
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
            Facility ID: <span className="font-mono font-bold text-navy-900">{user?.user_id}</span> | {hospital?.address || 'Central District'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('incoming-requests')}
            className="px-4 py-2.5 rounded-xl bg-navy-950 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 relative"
          >
            <Inbox className="w-4 h-4 text-cyan-400" />
            <span>Incoming Triage Queue</span>
            {pendingRequests > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping absolute -top-1 -right-1" />
            )}
          </button>
          <button
            onClick={() => onNavigateTab('bed-availability')}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2"
          >
            <Bed className="w-4 h-4" />
            <span>Manage Beds</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD OVERVIEW METRICS (Section 7) */}
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
          subtitle="Ready for intake"
        />
      </div>

      {/* BED OCCUPANCY PROGRESS GAUGE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-navy-950 uppercase tracking-wide">
          <span className="flex items-center">
            <Bed className="w-4 h-4 mr-1.5 text-teal-600" />
            Bed Capacity Utilization
          </span>
          <span className="font-mono text-teal-700 font-extrabold">{availableBeds} Free / {totalBeds} Total Beds</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              occupancyRate > 90 ? 'bg-emergency-600' : occupancyRate > 75 ? 'bg-amber-500' : 'bg-teal-600'
            }`}
            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500">
          <span>Occupied: {occupiedBeds} beds ({occupancyRate}%)</span>
          <span>Last Updated: {hospital?.beds_last_updated ? new Date(hospital.beds_last_updated).toLocaleTimeString() : 'Recently'}</span>
        </div>
      </div>

      {/* PENDING REQUESTS URGENT CARD LIST */}
      {pendingRequests > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emergency-600 animate-ping" />
              <h3 className="text-sm font-black text-navy-950 uppercase tracking-wide">
                Urgent Incoming Requests Requiring Decision ({pendingRequests})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('incoming-requests')}
              className="text-xs font-bold text-amber-800 hover:underline flex items-center"
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
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
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
            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center space-x-1"
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
    </div>
  );
};
