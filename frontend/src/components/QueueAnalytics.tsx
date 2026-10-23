import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, Users, CheckCircle, AlertOctagon } from 'lucide-react';
import type { QueueSession } from '../services/api';

interface QueueAnalyticsProps {
  session: QueueSession | null;
}

const HOURLY_DATA = [
  { time: '09:00', booked: 8, completed: 6, expired: 1 },
  { time: '10:00', booked: 12, completed: 10, expired: 2 },
  { time: '11:00', booked: 15, completed: 11, expired: 1 },
  { time: '12:00', booked: 9, completed: 7, expired: 0 },
  { time: '13:00', booked: 6, completed: 4, expired: 1 },
];

export const QueueAnalytics: React.FC<QueueAnalyticsProps> = ({ session }) => {
  const pieData = [
    { name: 'Waiting', value: Math.max(session?.total_waiting || 3, 1), color: '#3b82f6' },
    { name: 'Completed', value: Math.max(session?.total_completed || 8, 1), color: '#10b981' },
    { name: 'Expired', value: Math.max(session?.total_expired || 2, 1), color: '#ef4444' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 pb-6 border-b border-slate-800 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Queue Throughput & Velocity Analytics</h2>
          <p className="text-xs text-slate-400">Hourly patient arrival rates, completion efficiency, and auto-expiry metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{session?.total_booked || 14}</div>
            <div className="text-xs text-slate-400">Total Tokens Generated</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">{session?.total_completed || 9}</div>
            <div className="text-xs text-slate-400">Completed Visits</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-400">{session?.total_expired || 2}</div>
            <div className="text-xs text-slate-400">Auto-Expired (No-Show)</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Turnout Bar Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Hourly Outpatient Flow (Tokens vs Completed)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY_DATA}>
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="booked" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Booked" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="expired" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expired" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Token Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
