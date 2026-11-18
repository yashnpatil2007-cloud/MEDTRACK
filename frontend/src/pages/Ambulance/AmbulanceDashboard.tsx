import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { EmergencyRequest, Journey } from '../../types';
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
  MapPin 
} from 'lucide-react';

interface AmbulanceDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AmbulanceDashboard: React.FC<AmbulanceDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [reqRes, jrnRes] = await Promise.all([
        api.getRequests(),
        api.getActiveJourneys(),
      ]);
      setRequests(reqRes.requests);
      setActiveJourneys(jrnRes.active_journeys);
    } catch (err) {
      console.error('Failed to load ambulance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
  const acceptedRequests = requests.filter((r) => r.status === 'ACCEPTED').length;
  const completedRequests = requests.filter((r) => r.status === 'COMPLETED').length;
  const activeCount = activeJourneys.length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Ambulance Telemetry Console</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Unit {user?.user_id}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Status: <span className="font-bold text-teal-700">Online & Dispatched to Regional Coordination</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('new-request')}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Emergency Request</span>
          </button>
          {activeCount > 0 && (
            <button
              onClick={() => onNavigateTab('live-tracking')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-2 animate-pulse"
            >
              <Navigation className="w-4 h-4" />
              <span>Active Journey Live</span>
            </button>
          )}
        </div>
      </div>

      {/* OVERVIEW METRIC CARDS (Section 6) */}
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
          title="Accepted Requests"
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
          subtitle="Patient transfers finished"
        />
      </div>

      {/* ACTIVE JOURNEY ALERT BANNER */}
      {activeJourneys.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white animate-spin" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Transit in Progress
                </span>
                <span className="text-xs font-mono">{activeJourneys[0].journey_id}</span>
              </div>
              <p className="text-sm font-bold mt-0.5">
                Transfer en-route to {activeJourneys[0].hospital_id} ({activeJourneys[0].route_name})
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('live-tracking')}
            className="px-4 py-2 rounded-xl bg-white text-navy-950 font-bold text-xs hover:bg-slate-100 transition-colors shadow-md flex items-center space-x-1.5 flex-shrink-0"
          >
            <span>Open Live Navigation Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RECENT REQUESTS TABLE */}
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
                    Loading requests telemetry...
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
                      {req.status === 'ACCEPTED' && !req.has_active_journey && (
                        <button
                          onClick={() => onNavigateTab('live-tracking')}
                          className="px-3 py-1 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors"
                        >
                          Start Journey
                        </button>
                      )}
                      {req.has_active_journey && (
                        <button
                          onClick={() => onNavigateTab('live-tracking')}
                          className="px-3 py-1 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors"
                        >
                          View Live
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
    </div>
  );
};
