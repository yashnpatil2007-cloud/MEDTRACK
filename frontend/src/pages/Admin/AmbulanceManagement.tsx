import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { AmbulanceProfile } from '../../types';
import { Ambulance, Power, Phone, User, Radio, MapPin } from 'lucide-react';

export const AmbulanceManagement: React.FC = () => {
  const { addToast } = useNotifications();
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAmbulances = async () => {
    try {
      const res = await api.getAdminAmbulances();
      setAmbulances(res.ambulances);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const handleToggle = async (ambulanceId: string) => {
    try {
      const res = await api.toggleAmbulanceStatus(ambulanceId);
      addToast({
        type: 'info',
        title: 'Status Updated',
        message: res.message,
      });
      fetchAmbulances();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Fleet Operations</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Ambulance Fleet Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered mobile emergency units, telemetry health, and operational dispatch status.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Unit ID</th>
                <th className="px-5 py-3">Paramedic / Driver</th>
                <th className="px-5 py-3">Contact Phone</th>
                <th className="px-5 py-3">Telemetry Position</th>
                <th className="px-5 py-3">Fleet Status</th>
                <th className="px-5 py-3">Account State</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading ambulance fleet...</td>
                </tr>
              ) : ambulances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">No ambulances registered yet.</td>
                </tr>
              ) : (
                ambulances.map((amb) => (
                  <tr key={amb.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-navy-950">{amb.ambulance_id}</td>
                    <td className="px-5 py-3.5 font-semibold text-navy-900">{amb.full_name} ({amb.age}y)</td>
                    <td className="px-5 py-3.5 text-teal-700 font-medium">{amb.phone_number}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {amb.current_lat && amb.current_lng ? (
                        <span>{amb.current_lat.toFixed(4)}°, {amb.current_lng.toFixed(4)}°</span>
                      ) : (
                        <span className="text-slate-400">Not transmitted</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        amb.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {amb.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${amb.is_active ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                        {amb.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleToggle(amb.ambulance_id)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold ${
                          amb.is_active ? 'text-amber-600 hover:bg-amber-50 border-amber-200' : 'text-teal-600 hover:bg-teal-50 border-teal-200'
                        }`}
                        title={amb.is_active ? 'Suspend Unit' : 'Activate Unit'}
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
    </div>
  );
};
