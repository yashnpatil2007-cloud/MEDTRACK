import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { EmergencyRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { History, Eye, Search, Clock, Calendar } from 'lucide-react';

export const HospitalHistory: React.FC = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState<EmergencyRequest | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.getHospitalRequests();
        setRequests(res.requests);
      } catch (err) {
        console.warn('Failed to load hospital history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = requests.filter((r) =>
    r.request_id.toLowerCase().includes(search.toLowerCase()) ||
    (r.patient_name && r.patient_name.toLowerCase().includes(search.toLowerCase())) ||
    r.ambulance_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Archival Log</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Hospital Coordination History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history of all emergency triage decisions, patient intake records, and transfer completions.
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search request or patient..."
            className="px-3.5 py-2 pl-9 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none w-56 bg-slate-50/50"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Request ID</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Emergency Level</th>
                <th className="px-5 py-3">Ambulance</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Triage Decision</th>
                <th className="px-5 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No historical coordination records found.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-navy-950">{req.request_id}</td>
                    <td className="px-5 py-3.5 font-semibold text-navy-900">{req.patient_name} ({req.patient_age}y)</td>
                    <td className="px-5 py-3.5"><StatusBadge level={req.emergency_level} /></td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{req.ambulance_id}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100"
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

      <Modal
        isOpen={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
        title={`Audit Record: ${selectedReq?.request_id}`}
        maxWidth="md"
      >
        {selectedReq && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400">Patient:</span>
                <p className="font-bold text-navy-950">{selectedReq.patient_name} ({selectedReq.patient_age} yrs)</p>
              </div>
              <div>
                <span className="text-slate-400">Severity:</span>
                <div className="mt-1"><StatusBadge level={selectedReq.emergency_level} /></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <StatusBadge status={selectedReq.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ambulance Unit:</span>
                <span className="font-mono font-bold text-navy-950">{selectedReq.ambulance_id}</span>
              </div>
              {selectedReq.rejection_reason && (
                <div className="flex justify-between text-rose-600">
                  <span>Rejection Reason:</span>
                  <span>{selectedReq.rejection_reason}</span>
                </div>
              )}
              {selectedReq.completed_at && (
                <div className="flex justify-between text-emerald-700">
                  <span>Completed At:</span>
                  <span>{new Date(selectedReq.completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
