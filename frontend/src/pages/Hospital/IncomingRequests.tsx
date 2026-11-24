import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { EmergencyRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { 
  Inbox, 
  Check, 
  X, 
  Eye, 
  Clock, 
  Phone, 
  User, 
  AlertTriangle, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Navigation 
} from 'lucide-react';

export const IncomingRequests: React.FC = () => {
  const { addToast } = useNotifications();

  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<EmergencyRequest | null>(null);

  // Reject Modal State
  const [rejectModalReq, setRejectModalReq] = useState<EmergencyRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Critical ICU trauma bay capacity full');
  const [processingDecision, setProcessingDecision] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.getHospitalRequests();
      setRequests(res.requests);
    } catch (err: any) {
      console.warn('Error fetching hospital requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleDecision = async (requestId: string, decision: 'ACCEPTED' | 'REJECTED', reason?: string) => {
    setProcessingDecision(true);
    try {
      const res = await api.makeRequestDecision(requestId, decision, reason);
      addToast({
        type: decision === 'ACCEPTED' ? 'success' : 'warning',
        title: `Request ${decision}`,
        message: `Ambulance crew alerted of ${decision.toLowerCase()} decision.`,
      });

      // Update local state
      setRequests((prev) =>
        prev.map((r) => (r.request_id === requestId ? { ...r, status: decision, rejection_reason: reason } : r))
      );
      setRejectModalReq(null);
      if (selectedReq?.request_id === requestId) {
        setSelectedReq((prev) => (prev ? { ...prev, status: decision, rejection_reason: reason } : null));
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Decision Error',
        message: err.message || 'Unable to record decision.',
      });
    } finally {
      setProcessingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Hospital Triage Admissions</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Incoming Emergency Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept or reject inbound ambulance transport requests to reserve emergency trauma bays.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-teal-600 animate-spin" />
          <span>Real-time polling & WebSocket chimes active</span>
        </div>
      </div>

      {/* Requests Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Request ID</th>
                <th className="px-5 py-3">Patient Info</th>
                <th className="px-5 py-3">Emergency Level</th>
                <th className="px-5 py-3">Ambulance Unit</th>
                <th className="px-5 py-3">Pickup Location</th>
                <th className="px-5 py-3">Expected Arrival / ETA</th>
                <th className="px-5 py-3">Booking Status</th>
                <th className="px-5 py-3 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Loading incoming queue...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No incoming emergency requests for this hospital at this moment.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const isPending = req.status === 'PENDING';
                  const isOnJourney = req.status === 'ON JOURNEY' || req.status === 'JOURNEY_ACTIVE' || req.has_active_journey;
                  return (
                    <tr key={req.id} className={`transition-colors ${isPending ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50'}`}>
                      <td className="px-5 py-3.5 font-mono font-bold text-navy-950">
                        {req.request_id}
                        {isPending && (
                          <span className="w-2 h-2 ml-1.5 rounded-full bg-emergency-500 inline-block animate-ping" />
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-navy-900">{req.patient_name}</div>
                        <div className="text-[11px] text-slate-500">{req.patient_age} years old</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge level={req.emergency_level} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-navy-950 font-mono">{req.ambulance_id}</div>
                        {req.ambulance_driver && (
                          <div className="text-[11px] text-slate-500">{req.ambulance_driver}</div>
                        )}
                        {req.ambulance_phone && (
                          <div className="text-[10px] text-teal-700 flex items-center mt-0.5">
                            <Phone className="w-2.5 h-2.5 mr-1" />
                            {req.ambulance_phone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="flex items-center space-x-1 text-slate-700 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span className="truncate">{req.location_address || `${req.current_lat.toFixed(4)}, ${req.current_lng.toFixed(4)}`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {isOnJourney ? (
                          <span className="text-cyan-700 font-bold flex items-center space-x-1">
                            <Navigation className="w-3 h-3 text-cyan-600 animate-pulse" />
                            <span>En Route (~11 mins)</span>
                          </span>
                        ) : req.status === 'PATIENT PICKED UP' ? (
                          <span className="text-amber-700 font-medium text-[11px]">Picked Up (Ready)</span>
                        ) : req.status === 'ACCEPTED' || req.status === 'BOOKED' ? (
                          <span className="text-teal-700 font-medium text-[11px]">Dispatched to Pickup</span>
                        ) : req.status === 'COMPLETED' ? (
                          <span className="text-emerald-700 font-medium text-[11px]">Arrived & Handed Over</span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">Triage Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                          title="View Request Details"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          Details
                        </button>

                        {isPending && (
                          <>
                            <button
                              onClick={() => handleDecision(req.request_id, 'ACCEPTED')}
                              disabled={processingDecision}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5 inline mr-1" />
                              Accept
                            </button>

                            <button
                              onClick={() => setRejectModalReq(req)}
                              disabled={processingDecision}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5 inline mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Details Modal */}
      <Modal
        isOpen={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
        title={`Incident Details: ${selectedReq?.request_id}`}
        maxWidth="lg"
      >
        {selectedReq && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Patient Full Name:</span>
                <p className="font-bold text-navy-950 text-sm">{selectedReq.patient_name}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Patient Age:</span>
                <p className="font-bold text-navy-950 text-sm">{selectedReq.patient_age} years</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Emergency Triage Level:</span>
                <div className="mt-1"><StatusBadge level={selectedReq.emergency_level} /></div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Current Status:</span>
                <div className="mt-1"><StatusBadge status={selectedReq.status} /></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Ambulance Unit:</span>
                <span className="font-mono font-bold text-navy-950">{selectedReq.ambulance_id}</span>
              </div>
              {selectedReq.ambulance_phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Crew Contact Phone:</span>
                  <span className="font-semibold text-teal-700">{selectedReq.ambulance_phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Incident Location Address:</span>
                <span className="font-semibold text-slate-800">{selectedReq.location_address || 'Current Coordinates'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Incident Coordinates:</span>
                <span className="font-mono text-slate-700">{selectedReq.current_lat.toFixed(5)}°, {selectedReq.current_lng.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Route Corridor:</span>
                <span className="font-semibold text-teal-700">{selectedReq.selected_route}</span>
              </div>
            </div>

            {selectedReq.status === 'PENDING' && (
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    const req = selectedReq;
                    setSelectedReq(null);
                    setRejectModalReq(req);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => {
                    handleDecision(selectedReq.request_id, 'ACCEPTED');
                    setSelectedReq(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                >
                  Accept & Reserve Bay
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalReq !== null}
        onClose={() => setRejectModalReq(null)}
        title="Reject Emergency Request"
        maxWidth="md"
      >
        {rejectModalReq && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Please specify the clinical reason for rejecting request <b>{rejectModalReq.request_id}</b>. This will be transmitted immediately to the ambulance crew to reroute to another regional center.
            </p>

            <div>
              <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                Rejection Reason *
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
              >
                <option value="Critical ICU trauma bay capacity full">Critical ICU trauma bay capacity full</option>
                <option value="Specialist trauma surgical team currently occupied">Specialist trauma surgical team currently occupied</option>
                <option value="Emergency diagnostic equipment undergoing maintenance">Emergency diagnostic equipment undergoing maintenance</option>
                <option value="Facility temporarily diverted to secondary intake">Facility temporarily diverted to secondary intake</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingDecision}
                onClick={() => handleDecision(rejectModalReq.request_id, 'REJECTED', rejectionReason)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
              >
                {processingDecision ? 'Confirming...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
