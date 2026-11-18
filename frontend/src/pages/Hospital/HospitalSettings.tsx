import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Hospital } from '../../types';
import { Building2, Lock, ShieldCheck, Save, MapPin } from 'lucide-react';

export const HospitalSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useNotifications();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hospitalName, setHospitalName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const res = await api.getHospitalDetail(user?.user_id || '');
        setHospital(res.hospital);
        setHospitalName(res.hospital.hospital_name);
        setAddress(res.hospital.address);
        setLatitude(res.hospital.latitude);
        setLongitude(res.hospital.longitude);
      } catch (e) {
        console.warn(e);
      }
    };
    fetchHospital();
  }, [user?.user_id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile({
        hospital_name: hospitalName.trim(),
        address: address.trim(),
      });
      if (latitude !== '' && longitude !== '') {
        await api.updateHospitalLocation(Number(latitude), Number(longitude), address.trim());
      }
      await refreshUser();
      addToast({
        type: 'success',
        title: 'Facility Settings Saved',
        message: 'Hospital details and emergency coordinates updated.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Error',
        message: err.message,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({
        type: 'warning',
        title: 'Mismatch',
        message: 'Passwords do not match.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      await api.updatePassword(oldPassword, newPassword);
      addToast({
        type: 'success',
        title: 'Security Updated',
        message: 'Hospital account password successfully updated.',
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Password Change Failed',
        message: err.message,
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Facility Configuration</span>
        <h2 className="text-2xl font-black text-navy-950 tracking-tight">Hospital Center Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure facility address, dispatch coordinates, and portal authentication credentials.
        </p>
      </div>

      <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-cyan-600" />
          Facility Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Hospital ID (Immutable)
            </label>
            <input
              type="text"
              disabled
              value={user?.user_id || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold bg-slate-100 text-slate-500 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Account identity is permanent</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Verification Status
            </label>
            <input
              type="text"
              disabled
              value={hospital?.verification_status || 'PENDING'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-100 text-teal-700 cursor-not-allowed"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Hospital Official Name *
            </label>
            <input
              type="text"
              required
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Facility Address *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Emergency Map Latitude *
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Emergency Map Longitude *
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
            />
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 ml-auto disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingProfile ? 'Saving...' : 'Save Hospital Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Password Change Form */}
      <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
          <Lock className="w-4 h-4 mr-2 text-navy-900" />
          Update Access Password
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 uppercase mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 uppercase mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-black text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 ml-auto disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
