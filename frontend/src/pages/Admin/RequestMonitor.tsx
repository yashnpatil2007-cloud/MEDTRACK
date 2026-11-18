import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { EmergencyRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Activity, Search, Filter, ShieldCheck, MapPin, Building2, Ambulance } from 'lucide-react';

export const RequestMonitor: React.FC = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await api.getAdminRequests(statusFilter);
      setRequests(res.requests);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 8000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Incident Grid</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Request Coordination Oversight</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Network-wide monitoring of emergency transfer requests with clinical privacy redaction.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Triage</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="JOURNEY_ACTIVE">Journey Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Incident ID</th>
                <th className="px-5 py-3">Patient Code (Privacy Safe)</th>
                <th className="px-5 py-3">Emergency Level</th>
                <th className="px-5 py-3">Ambulance Unit</th>
                <th className="px-5 py-3">Destination Hospital</th>
                <th className="px-5 py-3">Transmitted</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading incidents...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">No requests found.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-navy-950">{req.request_id}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {req.patient_identifier || `PAT-${req.id}`} ({req.patient_age_group || 'Adult'})
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge level={req.emergency_level} /></td>
                    <td className="px-5 py-3.5 font-mono text-navy-900">{req.ambulance_id}</td>
                    <td className="px-5 py-3.5 font-semibold text-navy-900">{req.destination_hospital_name}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
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
