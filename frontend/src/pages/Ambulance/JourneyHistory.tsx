import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { EmergencyRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { History, Search, Filter, Eye, Clock, Calendar, MapPin, Building2, User } from 'lucide-react';

export const JourneyHistory: React.FC = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReq, setSelectedReq] = useState<EmergencyRequest | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.getRequests();
        setRequests(res.requests);
      } catch (err) {
        console.error('Failed to load journey history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = requests.filter((r) => {
    const matchesSearch = 
      r.request_id.toLowerCase().includes(search.toLowerCase()) ||
      (r.patient_name && r.patient_name.toLowerCase().includes(search.toLowerCase())) ||
      r.destination_hospital_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Audit Records</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Ambulance Journey History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all clinical dispatches, timestamps, and destination handovers.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, patient, hospital..."
              className="px-3.5 py-2 pl-9 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none w-52 bg-slate-50/50"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Request ID</th>
                <th className="px-5 py-3">Destination Hospital</th>
                <th className="px-5 py-3">Emergency Level</th>
                <th className="px-5 py-3">Request Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Journey Started</th>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No matching journey records found.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-navy-950">{req.request_id}</td>
                    <td className="px-5 py-3.5 font-semibold text-navy-900">{req.destination_hospital_name}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge level={req.emergency_level} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {req.journey_started_at ? new Date(req.journey_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {req.completed_at ? new Date(req.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                        title="View Record Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspect Modal */}
      <Modal
        isOpen={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
        title={`Audit Record: ${selectedReq?.request_id}`}
        maxWidth="lg"
      >
        {selectedReq && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Patient Name:</span>
                <p className="font-bold text-navy-950 text-sm">{selectedReq.patient_name || selectedReq.patient_identifier}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Patient Age:</span>
                <p className="font-bold text-navy-950 text-sm">{selectedReq.patient_age} years</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Emergency Severity:</span>
                <div className="mt-1"><StatusBadge level={selectedReq.emergency_level} /></div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Authoritative Status:</span>
                <div className="mt-1"><StatusBadge status={selectedReq.status} /></div>
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Hospital:</span>
                <span className="font-bold text-navy-950">{selectedReq.destination_hospital_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Route:</span>
                <span className="font-medium text-teal-700">{selectedReq.selected_route}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Origin Coordinates:</span>
                <span className="font-mono text-slate-700">{selectedReq.current_lat.toFixed(5)}°, {selectedReq.current_lng.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Acquisition Method:</span>
                <span className="font-semibold text-slate-700">{selectedReq.is_manual_location ? 'Manual Entry' : 'Verified Device GPS'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Transmitted:</span>
                <span>{new Date(selectedReq.created_at).toLocaleString()}</span>
              </div>
              {selectedReq.accepted_at && (
                <div className="flex justify-between text-teal-700">
                  <span>Hospital Accepted:</span>
                  <span>{new Date(selectedReq.accepted_at).toLocaleString()}</span>
                </div>
              )}
              {selectedReq.journey_started_at && (
                <div className="flex justify-between text-cyan-700">
                  <span>Transit Started:</span>
                  <span>{new Date(selectedReq.journey_started_at).toLocaleString()}</span>
                </div>
              )}
              {selectedReq.completed_at && (
                <div className="flex justify-between text-emerald-700">
                  <span>Arrival & Handover:</span>
                  <span>{new Date(selectedReq.completed_at).toLocaleString()}</span>
                </div>
              )}
              {selectedReq.rejection_reason && (
                <div className="flex justify-between text-rose-600">
                  <span>Rejection Note:</span>
                  <span>{selectedReq.rejection_reason}</span>
                </div>
              )}
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 rounded-xl bg-navy-950 text-white font-bold text-xs"
              >
                Close Record
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
