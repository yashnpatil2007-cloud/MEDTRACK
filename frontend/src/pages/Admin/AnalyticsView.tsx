import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart3, Activity, PieChart, Bed, Building2, TrendingUp } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.getAdminAnalytics();
        setAnalytics(res.analytics);
      } catch (err) {
        console.warn('Analytics loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const emergencyLevels = analytics?.emergency_levels || {};
  const requestStatuses = analytics?.request_statuses || {};
  const hospitalUtilization: any[] = analytics?.hospital_utilization || [];

  const totalIncidents = Object.values(emergencyLevels).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Operational Intelligence</span>
        <h2 className="text-2xl font-black text-navy-950 tracking-tight">System Analytics & Capacity Utilization</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Empirical statistics derived strictly from live backend database records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EMERGENCY LEVEL DISTRIBUTION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
              <Activity className="w-4 h-4 mr-2 text-emergency-600" />
              Emergency Severity Distribution
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">{totalIncidents} Total Logged</span>
          </div>

          <div className="space-y-3">
            {[
              { level: 'CRITICAL', color: 'bg-emergency-600', text: 'text-emergency-700' },
              { level: 'HIGH', color: 'bg-amber-500', text: 'text-amber-700' },
              { level: 'MEDIUM', color: 'bg-blue-500', text: 'text-blue-700' },
              { level: 'LOW', color: 'bg-slate-400', text: 'text-slate-700' },
            ].map(({ level, color, text }) => {
              const count = (emergencyLevels[level] || 0) as number;
              const pct = totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0;
              return (
                <div key={level} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className={text}>{level}</span>
                    <span className="font-mono text-slate-600">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INCIDENT STATUS BREAKDOWN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-teal-600" />
              Request Lifecycle Statuses
            </h3>
            <span className="text-xs font-semibold text-slate-500">Live Coordination</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(requestStatuses).map(([status, count]: [string, any]) => (
              <div key={status} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{status}</span>
                <span className="text-2xl font-black text-navy-950 font-mono mt-1 block">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOSPITAL BED UTILIZATION TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide flex items-center">
            <Bed className="w-4 h-4 mr-2 text-cyan-600" />
            Hospital Trauma Bay Occupancy Benchmarking
          </h3>
          <span className="text-xs text-slate-500">Authorized live hospital updates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Facility ID</th>
                <th className="px-4 py-3">Hospital Center</th>
                <th className="px-4 py-3">Total Beds</th>
                <th className="px-4 py-3">Occupied</th>
                <th className="px-4 py-3">Available Free</th>
                <th className="px-4 py-3">Occupancy %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {hospitalUtilization.map((h) => (
                <tr key={h.hospital_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-navy-950">{h.hospital_id}</td>
                  <td className="px-4 py-3 font-semibold text-navy-900">{h.hospital_name}</td>
                  <td className="px-4 py-3 font-mono">{h.total_beds}</td>
                  <td className="px-4 py-3 font-mono text-amber-600 font-bold">{h.occupied_beds}</td>
                  <td className="px-4 py-3 font-mono text-teal-700 font-bold">{h.available_beds}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${h.occupancy_rate > 85 ? 'bg-emergency-600' : 'bg-teal-600'}`}
                          style={{ width: `${Math.min(h.occupancy_rate, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold">{h.occupancy_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
