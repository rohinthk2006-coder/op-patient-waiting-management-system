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
    { name: 'Waiting', value: Math.max(session?.total_waiting || 3, 1), color: '#0284c7' },
    { name: 'Completed', value: Math.max(session?.total_completed || 8, 1), color: '#10b981' },
    { name: 'Expired', value: Math.max(session?.total_expired || 2, 1), color: '#ef4444' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-5 px-3 sm:px-6 font-sans">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 mb-5">
        <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Queue Throughput & Velocity Analytics</h2>
          <p className="text-xs text-slate-500">Hourly patient arrival rates, completion efficiency, and auto-expiry metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{session?.total_booked || 14}</div>
            <div className="text-xs text-slate-500">Total Tokens Generated</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700">{session?.total_completed || 9}</div>
            <div className="text-xs text-slate-500">Completed Consultations</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-rose-700">{session?.total_expired || 2}</div>
            <div className="text-xs text-slate-500">Auto-Expired (No-Show)</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hourly Turnout Bar Chart */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 mb-3">Hourly Outpatient Flow (Tokens vs Completed)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY_DATA}>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px' }}
                />
                <Bar dataKey="booked" fill="#0284c7" radius={[3, 3, 0, 0]} name="Booked" />
                <Bar dataKey="completed" fill="#10b981" radius={[3, 3, 0, 0]} name="Completed" />
                <Bar dataKey="expired" fill="#ef4444" radius={[3, 3, 0, 0]} name="Expired" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 mb-3">Token Distribution</h3>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
