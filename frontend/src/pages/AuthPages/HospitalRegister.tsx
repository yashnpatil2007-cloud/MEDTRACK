import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Building2, Eye, EyeOff, ArrowRight, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

interface HospitalRegisterProps {
  onNavigate: (page: string) => void;
}

export const HospitalRegister: React.FC<HospitalRegisterProps> = ({ onNavigate }) => {
  const { registerHospital } = useAuth();
  const { addToast } = useNotifications();

  // Exactly 3 registration fields
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredPending, setRegisteredPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!hospitalName || !hospitalId || !password) {
      setErrorMsg('All three fields are required: Hospital Name, Hospital ID, Password.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerHospital({
        hospital_name: hospitalName.trim(),
        hospital_id: hospitalId.trim(),
        password,
      });

      addToast({
        type: 'warning',
        title: 'Registration Submitted',
        message: 'Your hospital account is awaiting Administrator verification.',
        duration: 8000,
      });

      setRegisteredPending(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hospital registration failed.');
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: err.message || 'Unable to register hospital.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-50">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Hospital Center Registration</h2>
          <p className="text-xs text-slate-500">
            Register your medical center for coordinated emergency intake.
          </p>
        </div>

        {registeredPending ? (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
            <Clock className="w-12 h-12 text-amber-600 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-navy-950">Registration Submitted For Verification</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Hospital ID <b>{hospitalId}</b> has been recorded. In compliance with emergency coordination protocols, an Administrator must verify and approve your facility credentials before you can participate in live coordination.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full py-2.5 rounded-xl bg-navy-950 text-white font-bold text-xs hover:bg-black transition-colors"
              >
                Access Hospital Workspace (Pending Mode)
              </button>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Hospital Name */}
              <div>
                <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                  1. Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. City General Trauma & Surgical Center"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Field 2: Create Hospital ID */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-navy-950 uppercase">
                    2. Create Hospital ID *
                  </label>
                  <span className="text-[10px] text-amber-600 font-semibold">Immutable after registration</span>
                </div>
                <input
                  type="text"
                  required
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="e.g. HOSP-CITYGEN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Field 3: Password */}
              <div>
                <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
                  3. Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-slate-50/50"
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

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold">Verification Requirement:</span> Hospital accounts must be approved by an Administrator before receiving live ambulance requests or publishing verified bed counts.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-navy-950 hover:bg-black shadow-md shadow-navy-950/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Submitting Application...' : 'Register Hospital Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('hospital-login')}
              className="font-bold text-navy-900 hover:underline"
            >
              Sign In to Hospital Portal
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
