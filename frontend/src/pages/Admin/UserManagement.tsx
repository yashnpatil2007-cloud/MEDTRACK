import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { User, Role } from '../../types';
import { Users, Search, Filter, Power, ShieldCheck, UserCheck } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { addToast } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.getAdminUsers(roleFilter, search);
      setUsers(res.users);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggle = async (userId: string) => {
    try {
      const res = await api.toggleUserStatus(userId);
      addToast({
        type: 'info',
        title: 'User Status Updated',
        message: res.message,
      });
      fetchUsers();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Access Control</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">Platform User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based authorization oversight across ambulance crews, hospital desks, and administrators.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search User ID..."
              className="px-3.5 py-2 pl-9 rounded-xl border border-slate-300 text-xs focus:outline-none w-48 bg-slate-50/50"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="">All Roles</option>
            <option value="AMBULANCE">Ambulance</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="ADMIN">Administrator</option>
            <option value="SUPERADMIN">Super Administrator</option>
          </select>

          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Account ID (Immutable)</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3">Registered On</th>
                <th className="px-5 py-3">Verified</th>
                <th className="px-5 py-3">Account State</th>
                <th className="px-5 py-3 text-right">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">Loading accounts...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-navy-950">{u.user_id}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        u.role === 'AMBULANCE' ? 'bg-teal-50 text-teal-700' :
                        u.role === 'HOSPITAL' ? 'bg-cyan-50 text-cyan-800' :
                        u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' :
                        'bg-navy-900 text-white'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(u.created_at || '').toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_verified ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                        {u.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_active ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {u.role !== 'SUPERADMIN' ? (
                        <button
                          onClick={() => handleToggle(u.user_id)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold ${
                            u.is_active ? 'text-amber-600 hover:bg-amber-50 border-amber-200' : 'text-teal-600 hover:bg-teal-50 border-teal-200'
                          }`}
                          title={u.is_active ? 'Suspend Account' : 'Reactivate Account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Protected</span>
                      )}
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
