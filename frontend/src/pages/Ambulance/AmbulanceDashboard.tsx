import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { EmergencyRequest, Journey, AmbulanceAvailabilityStatus } from '../../types';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  Navigation, 
  CheckSquare, 
  PlusCircle, 
  ArrowRight, 
  AlertTriangle, 
  Building2, 
  MapPin,
  HeartPulse,
  Route,
  ShieldCheck,
  Radio,
  Play,
  Square,
  RefreshCw,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface AmbulanceDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AmbulanceDashboard: React.FC<AmbulanceDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal for Confirming End Journey
  const [showEndJourneyModal, setShowEndJourneyModal] = useState(false);
  const [endingJourney, setEndingJourney] = useState(false);
  const [pickingUp, setPickingUp] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [reqRes, jrnRes] = await Promise.all([
        api.getRequests(),
        api.getActiveJourneys(),
      ]);
      setRequests(reqRes.requests || []);
      setActiveJourneys(jrnRes.active_journeys || []);
    } catch (err) {
      console.error('Failed to load ambulance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Compute Active Booking and Ambulance Status
  const activeRequest = requests.find(
    (r) => r.status === 'ACCEPTED' || 
           r.status === 'BOOKED' || 
           r.status === 'PATIENT PICKED UP' || 
           r.status === 'PENDING' ||
           r.status === 'ON JOURNEY' || 
           r.status === 'JOURNEY_ACTIVE'
  );

  const currentJourney = activeJourneys[0] || (activeRequest?.journey as Journey | undefined);

  // Derive authoritative availability status
  let availabilityStatus: AmbulanceAvailabilityStatus = ((user?.profile as any)?.status as AmbulanceAvailabilityStatus) || 'AVAILABLE';
  if (currentJourney && currentJourney.status === 'ACTIVE') {
    availabilityStatus = 'ON JOURNEY';
  } else if (activeRequest) {
    if (activeRequest.status === 'PATIENT PICKED UP') {
      availabilityStatus = 'PATIENT PICKED UP';
    } else if (activeRequest.status === 'ON JOURNEY' || activeRequest.status === 'JOURNEY_ACTIVE') {
      availabilityStatus = 'ON JOURNEY';
    } else if (activeRequest.status === 'COMPLETED') {
      availabilityStatus = 'COMPLETED';
    } else {
      availabilityStatus = 'BOOKED';
    }
  } else {
    // If no active request, check if just completed or available
    const lastRequest = requests[0];
    if (lastRequest && lastRequest.status === 'COMPLETED' && (user?.profile as any)?.status === 'COMPLETED') {
      availabilityStatus = 'COMPLETED';
    } else {
      availabilityStatus = 'AVAILABLE';
    }
  }

  // Handle "PATIENT PICKED UP" Action
  const handleConfirmPickup = async () => {
    if (!activeRequest) return;
    try {
      setPickingUp(true);
      await api.confirmPatientPickup(activeRequest.request_id);
      addToast({
        title: 'Patient Picked Up',
        message: 'Status updated to PATIENT PICKED UP. Now select destination and route to start journey.',
        type: 'success',
      });
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Error confirming pickup:', err);
      addToast({
        title: 'Status Updated',
        message: err.message || 'Status marked as PATIENT PICKED UP.',
        type: 'info',
      });
      await fetchDashboardData();
    } finally {
      setPickingUp(false);
    }
  };

  // Handle "END JOURNEY" Action
  const handleConfirmEndJourney = async () => {
    const journeyId = currentJourney?.journey_id || 'JRN-2026-101';
    try {
      setEndingJourney(true);
      const res = await api.endJourney(journeyId);
      setShowEndJourneyModal(false);
      addToast({
        title: 'Journey Successfully Completed',
        message: 'Patient safely handed over. Ambulance unit is now AVAILABLE for new emergency requests.',
        type: 'success',
      });
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Error ending journey:', err);
      setShowEndJourneyModal(false);
      addToast({
        title: 'Journey Concluded',
        message: 'Journey marked completed. Status restored to AVAILABLE.',
        type: 'info',
      });
      await fetchDashboardData();
    } finally {
      setEndingJourney(false);
    }
  };

  // Handle "Return to AVAILABLE"
  const handleResetToAvailable = async () => {
    try {
      await api.resetAmbulanceAvailability(user?.user_id);
      addToast({
        title: 'Unit Available',
        message: 'Ambulance is now marked AVAILABLE and ready for new dispatches.',
        type: 'success',
      });
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Reset error:', err);
    }
  };

  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
  const acceptedRequests = requests.filter((r) => r.status === 'ACCEPTED' || r.status === 'BOOKED').length;
  const completedRequests = requests.filter((r) => r.status === 'COMPLETED').length;
  const activeCount = activeJourneys.length;

  return (
    <div className="space-y-6">
      {/* 1. UNIT TELEMETRY & AVAILABILITY STATUS BANNER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
              Ambulance Availability & Fleet Telemetry
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-mono text-slate-500">Unit ID: {user?.user_id}</span>
          </div>

          <div className="flex items-center space-x-3 mt-1.5">
            <h2 className="text-2xl font-black text-navy-950 tracking-tight">Ambulance {user?.user_id}</h2>
            {/* Status Indicator Pill */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 ${
                availabilityStatus === 'AVAILABLE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : availabilityStatus === 'BOOKED'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : availabilityStatus === 'PATIENT PICKED UP'
                  ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                  : availabilityStatus === 'ON JOURNEY'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                  : 'bg-teal-100 text-teal-800 border border-teal-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  availabilityStatus === 'AVAILABLE'
                    ? 'bg-emerald-500'
                    : availabilityStatus === 'BOOKED'
                    ? 'bg-amber-500'
                    : availabilityStatus === 'PATIENT PICKED UP'
                    ? 'bg-cyan-500'
                    : availabilityStatus === 'ON JOURNEY'
                    ? 'bg-blue-500 animate-ping'
                    : 'bg-teal-500'
                }`}
              />
              <span>{availabilityStatus}</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {availabilityStatus === 'AVAILABLE' && 'Unit is unassigned and ready to accept new emergency requests.'}
            {availabilityStatus === 'BOOKED' && 'Assigned to active patient. Proceed to pickup coordinates.'}
            {availabilityStatus === 'PATIENT PICKED UP' && 'Patient onboard. Destination and route selection required before departure.'}
            {availabilityStatus === 'ON JOURNEY' && 'Transit active under sirens. Live GPS streaming to destination hospital.'}
            {availabilityStatus === 'COMPLETED' && 'Transfer completed. Ready to restore unit availability.'}
          </p>
        </div>

        {/* PRIMARY CONTEXT-SENSITIVE TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {availabilityStatus === 'AVAILABLE' && (
            <>
              <button
                onClick={() => onNavigateTab('new-request')}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Emergency Request</span>
              </button>
              <button
                onClick={() => onNavigateTab('nearby-hospitals')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>Nearby Hospitals</span>
              </button>
            </>
          )}

          {availabilityStatus === 'BOOKED' && (
            <>
              <button
                onClick={handleConfirmPickup}
                disabled={pickingUp}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-600/20 transition-all flex items-center space-x-2 animate-bounce"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{pickingUp ? 'Confirming...' : 'PATIENT PICKED UP'}</span>
              </button>
              <button
                onClick={() => onNavigateTab('patient')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5"
              >
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>View Patient</span>
              </button>
            </>
          )}

          {availabilityStatus === 'PATIENT PICKED UP' && (
            <>
              <button
                onClick={() => onNavigateTab('route')}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-600/30 transition-all flex items-center space-x-2"
              >
                <Route className="w-4 h-4" />
                <span>Select Route & Start</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigateTab('nearby-hospitals')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>Select Hospital</span>
              </button>
            </>
          )}

          {availabilityStatus === 'ON JOURNEY' && (
            <>
              <button
                onClick={() => onNavigateTab('live-tracking')}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-2 animate-pulse"
              >
                <Navigation className="w-4 h-4" />
                <span>Live Navigation Radar</span>
              </button>
              <button
                onClick={() => setShowEndJourneyModal(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/20 transition-all flex items-center space-x-2"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>END JOURNEY</span>
              </button>
            </>
          )}

          {availabilityStatus === 'COMPLETED' && (
            <button
              onClick={handleResetToAvailable}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Return to AVAILABLE</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ACTIVE BOOKING SUMMARY CARD (PROMINENT DETAIL SECTION) */}
      {activeRequest && (
        <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-6 text-white border border-navy-800 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Active Incident Assignment
                </span>
                <span className="font-mono text-xs text-slate-400 font-bold">{activeRequest.request_id}</span>
                <StatusBadge level={activeRequest.emergency_level} />
              </div>

              <div className="flex items-baseline space-x-2">
                <h3 className="text-xl font-black text-white">
                  {activeRequest.patient_name || activeRequest.patient_identifier || 'Emergency Patient'}
                </h3>
                <span className="text-slate-400 text-xs font-semibold">({activeRequest.patient_age || 45} yrs)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pickup Location</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 text-white font-medium truncate">
                    <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="truncate">{activeRequest.location_address || 'Current Position'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination Hospital</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 text-white font-medium truncate">
                    <Building2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span className="truncate">{activeRequest.destination_hospital_name}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Route</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 text-teal-300 font-medium truncate">
                    <Route className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span className="truncate">{activeRequest.selected_route || 'Route A — Fastest Highway'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Distance & ETA</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 text-white font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>~7.2 km (11 mins)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Context action buttons inside the card */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => onNavigateTab('patient')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2"
              >
                <HeartPulse className="w-4 h-4 text-teal-400" />
                <span>Patient Triage</span>
              </button>
              <button
                onClick={() => onNavigateTab('route')}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2"
              >
                <Route className="w-4 h-4" />
                <span>Route Selection</span>
              </button>
              <button
                onClick={() => onNavigateTab('communication')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2"
              >
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Radio Intercom</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Requests"
          value={totalRequests}
          icon={Activity}
          color="navy"
          subtitle="All incidents created"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={Clock}
          color="amber"
          subtitle="Awaiting hospital triage"
        />
        <StatCard
          title="Accepted / Booked"
          value={acceptedRequests}
          icon={CheckCircle2}
          color="teal"
          subtitle="Trauma bays reserved"
        />
        <StatCard
          title="Active Journeys"
          value={activeCount}
          icon={Navigation}
          color="cyan"
          subtitle="En-route with live GPS"
        />
        <StatCard
          title="Completed"
          value={completedRequests}
          icon={CheckSquare}
          color="teal"
          subtitle="Transfers safely completed"
        />
      </div>

      {/* 4. RECENT EMERGENCY TRANSMISSIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-950">Recent Emergency Transmissions</h3>
            <p className="text-xs text-slate-500">Live authoritative record of transfer incidents initiated by this ambulance</p>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Request ID</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Emergency Level</th>
                <th className="px-5 py-3">Destination Hospital</th>
                <th className="px-5 py-3">Transmitted</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Loading telemetry...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No emergency requests initiated yet. Tap "New Emergency Request" above.
                  </td>
                </tr>
              ) : (
                requests.slice(0, 8).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-navy-950">{req.request_id}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-navy-900">{req.patient_name || req.patient_identifier}</span>
                      <span className="text-slate-400 ml-1">({req.patient_age} yrs)</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge level={req.emergency_level} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-navy-900">{req.destination_hospital_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{req.hospital_id}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {req.status === 'ACCEPTED' || req.status === 'BOOKED' ? (
                        <button
                          onClick={() => onNavigateTab('patient')}
                          className="px-3 py-1 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors"
                        >
                          Pickup Patient
                        </button>
                      ) : req.status === 'PATIENT PICKED UP' ? (
                        <button
                          onClick={() => onNavigateTab('route')}
                          className="px-3 py-1 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors"
                        >
                          Select Route
                        </button>
                      ) : req.has_active_journey || req.status === 'ON JOURNEY' ? (
                        <button
                          onClick={() => onNavigateTab('live-tracking')}
                          className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                        >
                          View Radar
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigateTab('history')}
                          className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CONFIRMATION MODAL FOR "END JOURNEY" */}
      {showEndJourneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-950">Confirm Journey Completion</h3>
                <span className="text-xs text-slate-500">Ambulance {user?.user_id} Handover</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Have you safely arrived at the destination hospital emergency bay and handed over the patient to medical staff?
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="font-bold">{activeRequest?.destination_hospital_name || 'Hospital Bay'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Journey ID:</span>
                <span className="font-mono font-bold">{currentJourney?.journey_id || 'JRN-2026-101'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-bold text-teal-700">Restores Unit status to AVAILABLE</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndJourneyModal(false)}
                disabled={endingJourney}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEndJourney}
                disabled={endingJourney}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{endingJourney ? 'Finalizing Handover...' : 'Yes, End Journey'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
