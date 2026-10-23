import React from 'react';
import { Activity, Tv, Stethoscope, Bed, ShieldCheck, Radio, Bell, BarChart2 } from 'lucide-react';

interface NavbarProps {
  currentTab: 'patient' | 'tv' | 'doctor' | 'beds' | 'analytics';
  setCurrentTab: (tab: 'patient' | 'tv' | 'doctor' | 'beds' | 'analytics') => void;
  wsConnected: boolean;
  onOpenNotifications: () => void;
  notificationCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  wsConnected,
  onOpenNotifications,
  notificationCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Hospital OP Live Tracker
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                AI Queue
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Hospital Outpatient Queue & Bed Management</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80 shadow-inner flex-wrap justify-center gap-1">
          <button
            onClick={() => setCurrentTab('patient')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentTab === 'patient'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Patient Portal
          </button>

          <button
            onClick={() => setCurrentTab('tv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentTab === 'tv'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Tv className="w-4 h-4" />
            Waiting TV Mode
          </button>

          <button
            onClick={() => setCurrentTab('doctor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentTab === 'doctor'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Doctor Console
          </button>

          <button
            onClick={() => setCurrentTab('beds')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentTab === 'beds'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bed className="w-4 h-4" />
            Live Beds
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Analytics
          </button>
        </div>

        {/* Right Action Utilities */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
            title="Dispatched Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Live WebSocket Status Indicator */}
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className={wsConnected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {wsConnected ? 'Live WSS' : 'Polling Sync'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
