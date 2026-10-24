import React, { useState } from 'react';
import {
  Gauge,
  Activity,
  Menu,
  Users,
  UserCheck,
  Building2,
  Bed,
  Clock,
  Zap,
  CheckCircle2,
  Radio,
  Calendar as CalendarIcon,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Stethoscope,
  Tv,
  BarChart2,
  ArrowRight,
  PhoneCall,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { Hospital, User, QueueSession } from '../services/api';

interface IntroPageProps {
  onNavigateToLogin: (role: 'PATIENT' | 'STAFF') => void;
  onNavigateToTab: (tab: 'patient' | 'tv' | 'doctor' | 'beds' | 'analytics') => void;
  currentUser: User | null;
  hospitals: Hospital[];
  session?: QueueSession | null;
  wsConnected?: boolean;
}

// Hourly outpatient throughput dataset for the Line chart
const PATIENT_VELOCITY_DATA = [
  { time: '08:00 AM', booked: 4, completed: 1 },
  { time: '09:00 AM', booked: 14, completed: 8 },
  { time: '10:00 AM', booked: 32, completed: 22 },
  { time: '11:00 AM', booked: 46, completed: 35 },
  { time: '12:00 PM', booked: 40, completed: 38 },
  { time: '01:00 PM', booked: 24, completed: 26 },
  { time: '02:00 PM', booked: 36, completed: 32 },
  { time: '03:00 PM', booked: 50, completed: 44 },
  { time: '04:00 PM', booked: 58, completed: 52 },
  { time: '05:00 PM', booked: 70, completed: 64 },
  { time: '06:00 PM', booked: 78, completed: 73 },
];

export const IntroPage: React.FC<IntroPageProps> = ({
  onNavigateToLogin,
  onNavigateToTab,
  currentUser,
  hospitals,
  session,
  wsConnected = true,
}) => {
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [calendarDate] = useState<number>(24); // Today is Oct 24, 2026

  // Calendar dates matrix for October 2026 (Starts on Thursday Oct 1)
  const calendarDays = [
    null, null, null, null, 1, 2, 3,
    4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17,
    18, 19, 20, 21, 22, 23, 24,
    25, 26, 27, 28, 29, 30, 31,
  ];

  return (
    <div className="w-full min-h-[calc(100vh-65px)] py-4 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ======================================================== */}
        {/* LEFT SIDEBAR NAVIGATION (MATCHING REFERENCE STRUCTURE)   */}
        {/* ======================================================== */}
        <aside className="lg:col-span-3 flex flex-col gap-3.5">
          
          {/* Top Brand & Menu Header */}
          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase">
                    HEALTH ADMIN
                  </h2>
                  <p className="text-[10px] text-teal-700 font-semibold">Hospital OP Live Tracker</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Menu className="w-4 h-4" />
              </div>
            </div>

            {/* User Profile Block (Matching the reference picture) */}
            <div className="pt-3 flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 p-0.5 shadow-sm">
                  <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    {currentUser?.name ? (
                      <span className="text-sm font-bold text-teal-800">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <img
                        src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&q=80"
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0 animate-pulse" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 block font-medium">Welcome</span>
                <h3 className="text-xs font-bold text-slate-900 truncate uppercase">
                  {currentUser?.name ? `MR. ${currentUser.name}` : 'MR. ROHINTH K'}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                    {currentUser?.role || 'PATIENT'}
                  </span>
                  <span className="text-[10px] text-slate-400">• Trichy Hub</span>
                </div>
              </div>
            </div>

            {/* Quick Switch / Sign In */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToLogin('PATIENT')}
                className="flex-1 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold border border-teal-200 transition text-center"
              >
                Patient Portal
              </button>
              <button
                type="button"
                onClick={() => onNavigateToLogin('STAFF')}
                className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium border border-slate-200 transition text-center"
              >
                Staff Login
              </button>
            </div>
          </div>

          {/* Vertical Menu List (Matching Left Sidebar in Picture) */}
          <div className="p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">
              Navigation Menu
            </span>

            <nav className="flex flex-col gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveMenu('dashboard')}
                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition ${
                  activeMenu === 'dashboard'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Gauge className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  activeMenu === 'dashboard' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  Live
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentUser && currentUser.role !== 'PATIENT') onNavigateToTab('doctor');
                  else onNavigateToLogin('STAFF');
                }}
                className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>Doctor Console</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentUser) onNavigateToTab('patient');
                  else onNavigateToLogin('PATIENT');
                }}
                className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Patient Portal</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('tv')}
                className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Tv className="w-4 h-4 text-cyan-600" />
                  <span>Waiting Hall TV Mode</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('beds')}
                className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Bed className="w-4 h-4 text-amber-600" />
                  <span>Emergency Bed Manager</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('analytics')}
                className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart2 className="w-4 h-4 text-purple-600" />
                  <span>Throughput Reports</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </nav>
          </div>

          {/* System Core Guarantees & Hotline */}
          <div className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span>System Core Guarantees</span>
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-150">
                <span className="text-slate-700">Token Duplicates</span>
                <span className="font-bold text-emerald-700">0 (Atomic Lock)</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-150">
                <span className="text-slate-700">No-Show Auto Expiry</span>
                <span className="font-bold text-amber-700">10 Min Grace</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-150">
                <span className="text-slate-700">WebSocket Broadcast</span>
                <span className="font-bold text-cyan-700">Real-Time Sync</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-rose-800 font-bold">
                <PhoneCall className="w-3 h-3 text-rose-600" />
                <span>Trichy Emergency:</span>
              </div>
              <span className="font-bold text-rose-700 font-mono">1066 / 108</span>
            </div>
          </div>

        </aside>

        {/* ======================================================== */}
        {/* MAIN OPERATIONS WORKSPACE (8 STAT CARDS + CHART + CALENDAR) */}
        {/* ======================================================== */}
        <main className="lg:col-span-9 flex flex-col gap-4">
          
          {/* 1. Top Sub-Header & Breadcrumb Bar (Matching Picture) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
                <Gauge className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Dashboard</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </h1>
                <p className="text-xs text-slate-500">
                  Dashboard features • Real-Time Outpatient Queue & Emergency Bed Operations
                </p>
              </div>
            </div>

            {/* Breadcrumbs & Direct Launch */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto text-xs">
              <div className="hidden sm:flex items-center gap-1 text-slate-500 font-medium">
                <span>Home</span>
                <span>/</span>
                <span className="text-teal-700 font-bold">Dashboard</span>
              </div>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <button
                type="button"
                onClick={() => {
                  if (currentUser) onNavigateToTab('patient');
                  else onNavigateToLogin('PATIENT');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Patient Portal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 2. 8 STAT CARDS IN 4x2 GRID (MATCHING REFERENCE STRUCTURE) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Card 1: Active Doctors */}
            <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md hover:bg-white/95 transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">9</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Active Doctors</div>
                <span className="text-[10px] text-teal-700 font-medium">Multi-specialty OPD on duty</span>
              </div>
            </div>

            {/* Card 2: Active Patients */}
            <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md hover:bg-white/95 transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                  {session?.total_waiting ?? 11}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Active Patients</div>
                <span className="text-[10px] text-cyan-700 font-medium">Waiting in live hospital queue</span>
              </div>
            </div>

            {/* Card 3: Connected Hospitals */}
            <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md hover:bg-white/95 transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                  {hospitals.length || 10}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Hospitals Live</div>
                <span className="text-[10px] text-emerald-700 font-medium">Tiruchirappalli Network</span>
              </div>
            </div>

            {/* Card 4: Emergency ICU Beds */}
            <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md hover:bg-white/95 transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Bed className="w-4 h-4" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-rose-700 tabular-nums">5</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Active ICU Beds</div>
                <span className="text-[10px] text-rose-700 font-medium">Critical beds available</span>
              </div>
            </div>

            {/* Card 5: Grace Auto-Expiry */}
            <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md hover:bg-white/95 transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-lg sm:text-xl font-black text-amber-800 tabular-nums">10 Min</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Auto-Expiry</div>
                <span className="text-[10px] text-amber-700 font-medium">Grace deadline protection</span>
              </div>
            </div>

            {/* Card 6: Token Integrity */}
            <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md hover:bg-white/95 transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">0</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">0 Duplicates</div>
                <span className="text-[10px] text-indigo-700 font-medium">Atomic database locking</span>
              </div>
            </div>

            {/* Card 7: Active Serving Turn */}
            <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md hover:bg-white/95 transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
                  #{session?.current_serving_token || '101'}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Serving Turn</div>
                <span className="text-[10px] text-sky-700 font-medium">Cardiology OPD Room 102</span>
              </div>
            </div>

            {/* Card 8: WebSocket Telemetry */}
            <div className="p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md hover:bg-white/95 transition flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Radio className={`w-4 h-4 ${wsConnected ? 'animate-pulse' : ''}`} />
                </div>
                <span className="text-xs sm:text-sm font-black text-emerald-700 uppercase">Live</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">WebSocket Sync</div>
                <span className="text-[10px] text-emerald-700 font-medium">Zero-latency broadcast</span>
              </div>
            </div>

          </div>

          {/* 3. BOTTOM SPLIT: LINE CHART & CALENDAR (MATCHING REFERENCE PICTURE) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* Left (~70%): Line Chart / Patient Flow Velocity */}
            <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Line Chart — Outpatient Flow & Consultations
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-teal-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Tokens Booked
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Completed
                  </span>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PATIENT_VELOCITY_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBooked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: '#cbd5e1',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="booked"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorBooked)"
                      name="Tokens Booked"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      name="Consulted Visits"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Peak Turnout: <strong>11:00 AM - 12:00 PM</strong> (46 arrivals/hr)</span>
                <span className="text-emerald-700 font-semibold">Average Consultation Pace: ~14 mins/patient</span>
              </div>
            </div>

            {/* Right (~30%): Calendar & Live OPD Shifts (Matching Picture) */}
            <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Calendar</h3>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                    OCT 2026
                  </span>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                <span>SUN</span>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
              </div>

              {/* Month Day Matrix */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-7" />;
                  }
                  const isToday = day === calendarDate;
                  return (
                    <div
                      key={`day-${day}`}
                      className={`h-7 flex items-center justify-center rounded-lg font-medium transition ${
                        isToday
                          ? 'bg-teal-600 text-white font-bold shadow-xs ring-2 ring-teal-300'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Today's Active Shifts Schedule */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Today's Doctor OPD Schedule:
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
                    <div>
                      <strong className="text-teal-950 block text-[11px]">Dr. R. Anand (Cardiology)</strong>
                      <span className="text-[10px] text-teal-700">09:00 AM – 01:00 PM • OPD 102</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-600 text-white">
                      In Visit
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 block text-[11px]">Dr. Priya S. (Orthopedics)</strong>
                      <span className="text-[10px] text-slate-500">02:00 PM – 06:00 PM • OPD 105</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-200 text-slate-700">
                      Scheduled
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 4. Trichy Network Hospitals Quick Directory */}
          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Tiruchirappalli Medical Network Directory ({hospitals.length || 10} Centers)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('patient')}
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
              >
                <span>Open Full Catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(hospitals.length > 0 ? hospitals.slice(0, 3) : [
                { id: '1', name: 'Apollo Speciality Hospital Trichy', area: 'Ariyamangalam', emergency_contact: '1066' },
                { id: '2', name: 'Mahatma Gandhi Memorial Govt Hospital (GH Trichy)', area: 'Puthur / Collectorate', emergency_contact: '108' },
                { id: '3', name: 'Kauvery Hospital (Cantonment)', area: 'Cantonment', emergency_contact: '0431-4000100' },
              ]).map((h: any) => (
                <div
                  key={h.id}
                  onClick={() => onNavigateToTab('patient')}
                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 inline-block mb-1">
                      {h.area || 'Trichy'}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">{h.name}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Emergency: <span className="font-semibold text-rose-700 font-mono">{h.emergency_contact || '108'}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
