import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SystemStats, Hospital, EmergencyRequest } from '../../types';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Ambulance, 
  Clock, 
  Activity, 
  Navigation, 
  Bed, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  BarChart3, 
  FileText 
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [pendingHospitals, setPendingHospitals] = useState<Hospital[]>([]);
  const [recentRequests, setRecentRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [statsRes, hospRes, reqRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminHospitals('PENDING'),
        api.getAdminRequests(),
      ]);
      setStats(statsRes.stats);
      setPendingHospitals(hospRes.hospitals);
      setRecentRequests(reqRes.requests);
    } catch (err) {
      console.warn('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (hospitalId: string) => {
    try {
      await api.approveHospital(hospitalId);
      fetchAdminData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Administrative Grid Command</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">System Oversight Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational governance, facility verifications, fleet health, and clinical audit trail.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateTab('hospitals')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5"
          >
            <Building2 className="w-4 h-4" />
            <span>Verify Hospitals</span>
          </button>
          <button
            onClick={() => onNavigateTab('audit-logs')}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD STATISTICS CARDS (Section 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={Users}
          color="navy"
          subtitle="All platform accounts"
        />
        <StatCard
          title="Hospitals"
          value={stats?.total_hospitals || 0}
          icon={Building2}
          color="cyan"
          subtitle="Registered centers"
        />
        <StatCard
          title="Ambulances"
          value={stats?.total_ambulances || 0}
          icon={Ambulance}
          color="teal"
          subtitle="Active fleet units"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pending_hospital_approvals || 0}
          icon={Clock}
          color={stats?.pending_hospital_approvals ? 'amber' : 'navy'}
          subtitle="Requires admin check"
        />
        <StatCard
          title="Active Requests"
          value={stats?.active_requests || 0}
          icon={Activity}
          color="emergency"
          subtitle="In flight / Triage"
        />
        <StatCard
          title="Active Journeys"
          value={stats?.active_journeys || 0}
          icon={Navigation}
          color="teal"
          subtitle="Streaming live GPS"
        />
      </div>

      {/* AGGREGATE REGIONAL BED METRIC BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-teal-50 text-teal-700">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-950">Metropolitan Bed Capacity Aggregate</h4>
            <p className="text-xs text-slate-500">Real-time capacity across all approved regional hospital centers</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Beds</span>
            <span className="text-lg font-black text-navy-950">{stats?.aggregate_total_beds || 0}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Occupied Beds</span>
            <span className="text-lg font-black text-amber-600">{stats?.aggregate_occupied_beds || 0}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Beds</span>
            <span className="text-lg font-black text-teal-600">{stats?.aggregate_available_beds || 0}</span>
          </div>
        </div>
      </div>

      {/* PENDING HOSPITAL APPROVALS SPOTLIGHT */}
      {pendingHospitals.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-sm font-black text-navy-950 uppercase tracking-wide">
                Pending Hospital Verifications ({pendingHospitals.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('hospitals')}
              className="text-xs font-bold text-amber-800 hover:underline flex items-center"
            >
              <span>Manage All Applications</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingHospitals.map((hosp) => (
              <div key={hosp.hospital_id} className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-navy-950">{hosp.hospital_name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{hosp.hospital_id} | {hosp.address}</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Submitted: {new Date(hosp.created_at || '').toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleApprove(hosp.hospital_id)}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
                >
                  Approve Facility
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT NETWORK-WIDE INCIDENTS (PRIVACY-PRESERVED) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-950">Active Platform Emergency Activity</h3>
            <p className="text-xs text-slate-500">Live operational overview across metropolitan emergency corridors (HIPAA/privacy redacted)</p>
          </div>
          <button
            onClick={() => onNavigateTab('requests')}
            className="text-xs font-bold text-purple-700 hover:underline flex items-center"
          >
            <span>View All Transmissions</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Incident ID</th>
                <th className="px-5 py-3">Patient Code</th>
                <th className="px-5 py-3">Emergency Level</th>
                <th className="px-5 py-3">Ambulance</th>
                <th className="px-5 py-3">Destination Hospital</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentRequests.slice(0, 6).map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-navy-950">{req.request_id}</td>
                  <td className="px-5 py-3.5 text-slate-600 font-mono">{req.patient_identifier || `PAT-${req.id}`} ({req.patient_age_group || 'Adult'})</td>
                  <td className="px-5 py-3.5"><StatusBadge level={req.emergency_level} /></td>
                  <td className="px-5 py-3.5 font-mono text-navy-900">{req.ambulance_id}</td>
                  <td className="px-5 py-3.5 font-semibold text-navy-900">{req.destination_hospital_name}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
