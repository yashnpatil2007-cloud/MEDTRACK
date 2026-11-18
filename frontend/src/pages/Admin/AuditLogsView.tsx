import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';
import { FileText, ShieldCheck, Clock, Terminal, User, Search, RefreshCw } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.getAdminAuditLogs(100);
      setLogs(res.audit_logs);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) =>
    l.actor_id.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Forensic Integrity</span>
          <h2 className="text-2xl font-black text-navy-950 tracking-tight">System Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable server-generated logs recording administrative actions, approvals, and security updates.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action or actor..."
              className="px-3.5 py-2 pl-9 rounded-xl border border-slate-300 text-xs focus:outline-none w-52 bg-slate-50/50"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-100"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Actor (ID & Role)</th>
                <th className="px-5 py-3">Action Event</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3">Details / Change Description</th>
                <th className="px-5 py-3">IP Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">No audit records found.</td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-navy-950">{log.actor_id}</span>
                      <span className="text-[10px] text-teal-700 ml-1.5 font-sans font-bold">[{log.actor_role}]</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-purple-700 font-sans px-2 py-0.5 rounded bg-purple-50 border border-purple-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {log.target_type && `${log.target_type}: `}
                      <span className="font-bold text-navy-900">{log.target_id || '—'}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-sans text-xs max-w-md truncate" title={log.details || ''}>
                      {log.details || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-[11px]">{log.ip_address || '127.0.0.1'}</td>
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
