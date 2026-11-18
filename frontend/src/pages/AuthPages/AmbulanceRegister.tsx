import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Ambulance, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface AmbulanceRegisterProps {
  onNavigate: (page: string) => void;
}

export const AmbulanceRegister: React.FC<AmbulanceRegisterProps> = ({ onNavigate }) => {
  const { registerAmbulance } = useAuth();
  const { addToast } = useNotifications();

  // Exactly 5 registration fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ambulanceId, setAmbulanceId] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !age || !phoneNumber || !ambulanceId || !password) {
      setErrorMsg('All five fields are required.');
      return;
    }

    setLoading(true);
    try {
      await registerAmbulance({
        full_name: fullName.trim(),
        age: Number(age),
        phone_number: phoneNumber.trim(),
        ambulance_id: ambulanceId.trim(),
        password,
      });

      addToast({
        type: 'success',
        title: 'Registration Successful',
        message: `Ambulance Unit ${ambulanceId} is now active.`,
      });

      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: err.message || 'Error creating ambulance unit.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-50">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Ambulance className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Ambulance Unit Registration</h2>
          <p className="text-xs text-slate-500">
            Create an official emergency transport profile on the MEDTRACK grid.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field 1: Full Name */}
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              1. Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Officer Marcus Vance"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Field 2: Age */}
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              2. Age *
            </label>
            <input
              type="number"
              min="18"
              max="75"
              required
              value={age}
              onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 34"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Field 3: Phone Number */}
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              3. Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +1-555-019-2831"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Field 4: Create Ambulance ID */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-navy-950 uppercase">
                4. Create Ambulance ID *
              </label>
              <span className="text-[10px] text-amber-600 font-semibold">Immutable after registration</span>
            </div>
            <input
              type="text"
              required
              value={ambulanceId}
              onChange={(e) => setAmbulanceId(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              placeholder="e.g. AMB-205"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Field 5: Password */}
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              5. Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>IDs are permanent and logged on all clinical chain-of-custody dispatches.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Creating Unit Profile...' : 'Complete Ambulance Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('ambulance-login')}
              className="font-bold text-teal-600 hover:underline"
            >
              Sign In to Ambulance Portal
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
