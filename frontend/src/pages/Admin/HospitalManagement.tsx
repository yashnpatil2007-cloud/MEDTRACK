import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Hospital } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Building2, Check, X, ShieldAlert, AlertTriangle, Eye, Bed, Power } from 'lucide-react';

export const HospitalManagement: React.FC = () => {
  const { addToast } = useNotifications();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Reject modal
  const [rejectingHospital, setRejectingHospital] = useState<Hospital | null>(null);
  const [rejectReason, setRejectReason] = useState('Verification documentation incomplete');

  const fetchHospitals = async () => {
    try {
      const res = await api.getAdminHospitals(statusFilter);
      setHospitals(res.hospitals);
    } catch (err) {
      console.warn('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [statusFilter]);

  const handleApprove = async (hospitalId: string) => {
    try {
      await api.approveHospital(hospitalId);
      addToast({
        type: 'success',
        title: 'Hospital Approved',
        message: `Hospital ${hospitalId} verified and admitted to live coordination grid.`,
      });
      fetchHospitals();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Approval Error', message: err.message });
    }
  };

  const handleReject = async () => {
    if (!rejectingHospital) return;
    try {
      await api.rejectHospital(rejectingHospital.hospital_id, rejectReason);
      addToast({
        type: 'warning',
        title: 'Application Rejected',
        message: `Hospital application ${rejectingHospital.hospital_id} was rejected.`,
      });
      setRejectingHospital(null);
      fetchHospitals();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Rejection Error', message: err.message });
    }
  };

  const handleToggleStatus = async (hospitalId: string) => {
    try {
      const res = await api.toggleHospitalStatus(hospitalId);
      addToast({
        type: 'info',
        title: 'Status Updated',
        message: res.message,
      });
      fetchHospitals();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Verification Registry</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Hospital Facility Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit, verify, and approve hospital centers before they can participate in live emergency dispatch.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
        >
          <option value="">All Verification Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved & Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Hospital ID</th>
                <th className="px-5 py-3">Facility Name</th>
                <th className="px-5 py-3">Address & Coordinates</th>
                <th className="px-5 py-3">Beds (Avail / Tot)</th>
                <th className="px-5 py-3">Verification</th>
                <th className="px-5 py-3">Account State</th>
                <th className="px-5 py-3 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading hospitals...</td>
                </tr>
              ) : hospitals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">No hospitals found matching filter.</td>
                </tr>
              ) : (
                hospitals.map((hosp) => (
                  <tr key={hosp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-navy-950">{hosp.hospital_id}</td>
                    <td className="px-5 py-3.5 font-semibold text-navy-900">{hosp.hospital_name}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <div>{hosp.address}</div>
                      <div className="text-[10px] text-slate-400 font-mono">({hosp.latitude.toFixed(4)}, {hosp.longitude.toFixed(4)})</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className="font-bold text-teal-700">{hosp.available_beds}</span>
                      <span className="text-slate-400"> / {hosp.total_beds}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        hosp.verification_status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : hosp.verification_status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {hosp.verification_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hosp.is_active ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                        {hosp.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      {hosp.verification_status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(hosp.hospital_id)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5 inline mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingHospital(hosp)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
                          >
                            <X className="w-3.5 h-3.5 inline mr-1" />
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleToggleStatus(hosp.hospital_id)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold ${
                          hosp.is_active ? 'text-amber-600 hover:bg-amber-50 border-amber-200' : 'text-teal-600 hover:bg-teal-50 border-teal-200'
                        }`}
                        title={hosp.is_active ? 'Suspend Account' : 'Reactivate Account'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectingHospital !== null}
        onClose={() => setRejectingHospital(null)}
        title="Reject Hospital Facility Registration"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Specify the audit rationale for rejecting <b>{rejectingHospital?.hospital_name}</b> ({rejectingHospital?.hospital_id}):
          </p>

          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none"
          />

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setRejectingHospital(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
