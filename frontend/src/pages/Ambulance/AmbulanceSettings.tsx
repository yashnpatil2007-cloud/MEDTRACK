import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { AmbulanceProfile } from '../../types';
import { UserCircle, Lock, ShieldCheck, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const AmbulanceSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useNotifications();

  const profile = user?.profile as AmbulanceProfile | undefined;

  // Profile Edit State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
      });
      await refreshUser();
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Ambulance crew details updated successfully.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
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
        title: 'Password Mismatch',
        message: 'New password and confirmation do not match.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      await api.updatePassword(oldPassword, newPassword);
      addToast({
        type: 'success',
        title: 'Security Updated',
        message: 'Password changed successfully.',
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
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Unit Security & Configuration</span>
        <h2 className="text-2xl font-black text-navy-950 tracking-tight">Ambulance Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage crew contact credentials and account security.
        </p>
      </div>

      {/* Crew Profile Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
          <UserCircle className="w-4 h-4 mr-2 text-teal-600" />
          Crew Operational Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Ambulance ID (Permanent)
            </label>
            <input
              type="text"
              disabled
              value={user?.user_id || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold bg-slate-100 text-slate-500 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Account identifiers are immutable</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Age (Recorded at Registration)
            </label>
            <input
              type="text"
              disabled
              value={profile?.age ? `${profile.age} years` : '—'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Full Crew / Driver Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Direct Contact Phone *
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 ml-auto disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingProfile ? 'Saving...' : 'Update Crew Information'}</span>
          </button>
        </div>
      </form>

      {/* Password Security Form */}
      <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
          <Lock className="w-4 h-4 mr-2 text-navy-900" />
          Update Password
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
            <span>{savingPassword ? 'Changing Password...' : 'Save New Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
