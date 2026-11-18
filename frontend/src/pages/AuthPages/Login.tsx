import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Activity, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Building2, 
  Ambulance, 
  Sparkles 
} from 'lucide-react';

interface LoginProps {
  onNavigate: (page: string) => void;
  defaultRoleHint?: 'AMBULANCE' | 'HOSPITAL' | 'ADMIN';
}

export const Login: React.FC<LoginProps> = ({ onNavigate, defaultRoleHint }) => {
  const { login } = useAuth();
  const { addToast } = useNotifications();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFillDemo = (demoId: string, demoPass: string) => {
    setId(demoId);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!id || !password) {
      setErrorMsg('User ID and Password are required.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(id.trim(), password);
      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome back, ${loggedUser.user_id} (${loggedUser.role}).`,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
      addToast({
        type: 'error',
        title: 'Authentication Failed',
        message: err.message || 'Invalid ID or Password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-50">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-navy-900 via-teal-700 to-teal-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Sign In to MEDTRACK</h2>
          <p className="text-xs text-slate-500">
            Enter your authoritative account ID and password to access your role-specific dashboard.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">
              Account ID *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. AMB-101, HOSP-METRO, or admin1"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-navy-950 uppercase">
                Password *
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-navy-950 hover:bg-black shadow-md shadow-navy-950/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* DEMO ACCOUNTS QUICK-FILL CAROUSEL */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-teal-600" />
            Quick Demo Accounts (1-Click Fill)
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <button
              type="button"
              onClick={() => handleFillDemo('AMB-101', 'Ambulance@123')}
              className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-xs"
            >
              <div className="font-bold text-navy-950 flex items-center">
                <Ambulance className="w-3.5 h-3.5 mr-1 text-teal-600" />
                AMB-101
              </div>
              <div className="text-[10px] text-slate-500">Ambulance Paramedic</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('HOSP-METRO', 'Hospital@123')}
              className="p-2 rounded-lg border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 transition-all text-xs"
            >
              <div className="font-bold text-navy-950 flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-cyan-600" />
                HOSP-METRO
              </div>
              <div className="text-[10px] text-slate-500">Metro Trauma Hospital</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('admin1', 'Admin@MedTrack2026')}
              className="p-2 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all text-xs"
            >
              <div className="font-bold text-navy-950 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" />
                admin1
              </div>
              <div className="text-[10px] text-slate-500">Platform Administrator</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('superadmin', 'SuperAdmin@MedTrack2026')}
              className="p-2 rounded-lg border border-slate-200 hover:border-navy-900 hover:bg-slate-100 transition-all text-xs"
            >
              <div className="font-bold text-navy-950 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-navy-900" />
                superadmin
              </div>
              <div className="text-[10px] text-slate-500">Super Administrator</div>
            </button>
          </div>
        </div>

        {/* Registration links */}
        <div className="text-center pt-2 space-y-1 text-xs text-slate-500">
          <p>
            Need an Ambulance account?{' '}
            <button
              onClick={() => onNavigate('ambulance-register')}
              className="font-bold text-teal-600 hover:underline"
            >
              Register Unit
            </button>
          </p>
          <p>
            Registering a Hospital center?{' '}
            <button
              onClick={() => onNavigate('hospital-register')}
              className="font-bold text-navy-900 hover:underline"
            >
              Hospital Onboarding
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
