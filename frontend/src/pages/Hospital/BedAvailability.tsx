import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Hospital } from '../../types';
import { 
  Bed, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Radio, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';

export const BedAvailability: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [totalBeds, setTotalBeds] = useState<number | ''>('');
  const [occupiedBeds, setOccupiedBeds] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchBeds = async () => {
    try {
      const res = await api.getHospitalDetail(user?.user_id || '');
      setHospital(res.hospital);
      setTotalBeds(res.hospital.total_beds);
      setOccupiedBeds(res.hospital.occupied_beds);
    } catch (err: any) {
      console.warn('Failed to fetch hospital bed data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, [user?.user_id]);

  // Real-time automatic calculation of Available Beds
  const numericTotal = typeof totalBeds === 'number' ? totalBeds : 0;
  const numericOccupied = typeof occupiedBeds === 'number' ? occupiedBeds : 0;
  const calculatedAvailable = numericTotal - numericOccupied;

  // Real-time client-side validation
  useEffect(() => {
    if (numericTotal < 0) {
      setValidationError('Total beds cannot be a negative value.');
    } else if (numericOccupied < 0) {
      setValidationError('Occupied beds cannot be a negative value.');
    } else if (numericOccupied > numericTotal) {
      setValidationError(`Occupied beds (${numericOccupied}) cannot exceed total capacity (${numericTotal}).`);
    } else {
      setValidationError(null);
    }
  }, [numericTotal, numericOccupied]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    if (totalBeds === '' || occupiedBeds === '') {
      addToast({
        type: 'warning',
        title: 'Input Incomplete',
        message: 'Please provide both Total and Occupied bed numbers.',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateBeds(Number(totalBeds), Number(occupiedBeds));
      setHospital(res.hospital);
      addToast({
        type: 'success',
        title: 'Bed Availability Published',
        message: `Updated to ${res.hospital.available_beds} available beds. Broadcasted to all ambulances.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Rejected',
        message: err.message || 'Failed to update beds.',
      });
    } finally {
      setSaving(false);
    }
  };

  const occupancyPercent = numericTotal > 0 ? Math.round((numericOccupied / numericTotal) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Capacity Management</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Hospital Bed Availability</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain verified trauma bed capacity. Availability is broadcast live to all regional ambulance units.
          </p>
        </div>
        <button
          onClick={fetchBeds}
          className="p-2 rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors self-start sm:self-auto"
          title="Refresh current data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Live Calculated Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">1. Total Beds Capacity</span>
          <div className="text-3xl font-black text-navy-950 mt-2 font-mono">{numericTotal}</div>
          <p className="text-[11px] text-slate-400 mt-1">Configured maximum capacity</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">2. Occupied Beds</span>
          <div className="text-3xl font-black text-amber-600 mt-2 font-mono">{numericOccupied}</div>
          <p className="text-[11px] text-slate-400 mt-1">{occupancyPercent}% Occupancy rate</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-teal-500/40 bg-teal-50/20 shadow-sm">
          <span className="text-xs font-bold text-teal-800 uppercase flex items-center">
            <Radio className="w-3 h-3 mr-1 text-teal-600 animate-pulse" />
            3. Available Beds (Calculated)
          </span>
          <div className="text-3xl font-black text-teal-700 mt-2 font-mono">
            {calculatedAvailable >= 0 ? calculatedAvailable : '0'}
          </div>
          <p className="text-[11px] text-teal-800/80 mt-1 font-semibold">
            Formula: Total ({numericTotal}) - Occupied ({numericOccupied})
          </p>
        </div>
      </div>

      {/* Bed Editor Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
          <Bed className="w-4 h-4 mr-2 text-teal-600" />
          Update Emergency & Trauma Beds
        </h3>

        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Total Beds * (Constraint: &gt;= 0)
            </label>
            <input
              type="number"
              min="0"
              required
              value={totalBeds}
              onChange={(e) => setTotalBeds(e.target.value !== '' ? parseInt(e.target.value) : '')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Occupied Beds * (Constraint: &gt;= 0 and &lt;= Total)
            </label>
            <input
              type="number"
              min="0"
              required
              value={occupiedBeds}
              onChange={(e) => setOccupiedBeds(e.target.value !== '' ? parseInt(e.target.value) : '')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
            />
          </div>
        </div>

        {/* Audit Transparency Note */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center space-x-2 text-navy-950 font-bold">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Authoritative Transparency Commitment</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Ambulance dispatchers and coordination software rely on accurate bed numbers to route patients to available trauma bays. Every update is stamped with the authenticated user ID and timestamped:
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            Last Update: {hospital?.beds_last_updated ? new Date(hospital.beds_last_updated).toLocaleString() : 'Not yet updated'}
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving || !!validationError}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Validating & Broadcasting...' : 'Publish Bed Availability Live'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
