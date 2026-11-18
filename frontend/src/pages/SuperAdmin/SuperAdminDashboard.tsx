import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { 
  ShieldCheck, 
  Cpu, 
  UserPlus, 
  Settings, 
  Save, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Radio 
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { addToast } = useNotifications();

  const [health, setHealth] = useState<any>(null);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New admin form state
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // New setting state
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchSuperData = async () => {
    try {
      const [healthRes, settingsRes] = await Promise.all([
        api.getSuperAdminHealth(),
        api.getSystemSettings(),
      ]);
      setHealth(healthRes.health);
      setSettings(settingsRes.settings);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperData();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminId || !newAdminPass) return;

    setCreatingAdmin(true);
    try {
      await api.createAdmin(newAdminId.trim(), newAdminPass);
      addToast({
        type: 'success',
        title: 'Administrator Provisioned',
        message: `Admin account ${newAdminId} created successfully.`,
      });
      setNewAdminId('');
      setNewAdminPass('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Provisioning Error',
        message: err.message,
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleSaveSetting = async (key: string, value: string, description?: string) => {
    try {
      await api.updateSystemSetting(key, value, description);
      addToast({
        type: 'success',
        title: 'Setting Stored',
        message: `System parameter '${key}' persisted to database.`,
      });
      fetchSuperData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-navy-950 text-white p-7 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-navy-850">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Master Authority Root</span>
          <h2 className="text-2xl font-black tracking-tight text-white">Super Administrator Console</h2>
          <p className="text-xs text-slate-400 mt-1">
            Global architectural configuration, administrator provisioning, and cluster telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-navy-900 px-3.5 py-2 rounded-xl border border-navy-800">
          <Server className="w-4 h-4 text-teal-400" />
          <span>Status: {health?.status || 'OPERATIONAL'}</span>
        </div>
      </div>

      {/* PLATFORM HEALTH TILES (Section 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Database Engine</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-navy-950 font-mono">
            {health?.database_connected ? 'CONNECTED & ACID VERIFIED' : 'DISCONNECTED'}
          </div>
          <p className="text-[11px] text-slate-400">PostgreSQL / SQLite Production Driver</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Real-Time Core</span>
            <Radio className="w-4 h-4 text-teal-600 animate-pulse" />
          </div>
          <div className="text-lg font-black text-navy-950 font-mono">
            {health?.realtime_engine || 'Flask-SocketIO Active'}
          </div>
          <p className="text-[11px] text-slate-400">Sub-second incident dispatches</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Security Scheme</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-navy-950 font-mono">
            {health?.security_mode || 'JWT HS256 Role-Enforced'}
          </div>
          <p className="text-[11px] text-slate-400">PBKDF2 Password Hashing Active</p>
        </div>
      </div>

      {/* ADMIN PROVISIONING SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
          <UserPlus className="w-4 h-4 mr-2 text-purple-600" />
          Provision New Platform Administrator
        </h3>
        <p className="text-xs text-slate-500">
          Super Administrators may securely bootstrap regional triage administrators without hardcoded credentials.
        </p>

        <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">Administrator ID *</label>
            <input
              type="text"
              required
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              placeholder="e.g. admin_regional_02"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase mb-1">Temporary Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newAdminPass}
              onChange={(e) => setNewAdminPass(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creatingAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{creatingAdmin ? 'Provisioning...' : 'Provision Administrator'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SYSTEM SETTINGS MANAGEMENT */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
          <Settings className="w-4 h-4 mr-2 text-teal-600" />
          Platform Configuration Parameters
        </h3>

        <div className="space-y-3">
          {settings.map((s) => (
            <div key={s.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-navy-950">{s.key}</span>
                <span className="text-[10px] text-slate-400">Updated: {new Date(s.updated_at).toLocaleDateString()}</span>
              </div>
              <p className="text-[11px] text-slate-500">{s.description}</p>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  defaultValue={s.value}
                  onBlur={(e) => {
                    if (e.target.value !== s.value) {
                      handleSaveSetting(s.key, e.target.value, s.description);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Parameter */}
        <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
          <span className="text-xs font-bold text-navy-950 uppercase block">Add Dynamic Setting</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              placeholder="CONFIG_KEY_NAME"
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white"
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Config Value"
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            />
            <button
              type="button"
              onClick={() => {
                if (newKey && newValue) {
                  handleSaveSetting(newKey, newValue, newDesc || 'Custom runtime setting');
                  setNewKey('');
                  setNewValue('');
                  setNewDesc('');
                }
              }}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
            >
              Add Parameter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
