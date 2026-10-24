import React from 'react';
import {
  Activity,
  Tv,
  Stethoscope,
  Bed,
  ShieldCheck,
  Radio,
  Bell,
  BarChart2,
  LogOut,
  User as UserIcon,
  Building,
  Home,
} from 'lucide-react';
import type { User } from '../services/api';

interface NavbarProps {
  currentTab: 'intro' | 'login' | 'patient' | 'tv' | 'doctor' | 'beds' | 'analytics';
  setCurrentTab: (tab: 'intro' | 'login' | 'patient' | 'tv' | 'doctor' | 'beds' | 'analytics') => void;
  wsConnected: boolean;
  onOpenNotifications: () => void;
  notificationCount: number;
  currentUser: User | null;
  onOpenLogin: (defaultRole?: 'PATIENT' | 'STAFF') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  wsConnected,
  onOpenNotifications,
  notificationCount,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Doctor',
        };
      case 'RECEPTIONIST':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          label: 'Reception',
        };
      case 'ADMIN':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Admin',
        };
      default:
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Patient',
        };
    }
  };

  return (
    <header className="border-b border-white/40 bg-white/85 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-2.5 shadow-sm transition-colors w-full">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Logo and Brand */}
        <div
          onClick={() => setCurrentTab('intro')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Return to Hospital Overview"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shadow-xs shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Hospital OP Live Tracker
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                AI Queue
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Outpatient Queue & Bed Management</p>
          </div>
        </div>

        {/* Navigation Tabs - Compact Font & Clean White/Slate Styling */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner flex-wrap justify-center gap-0.5">
          <button
            onClick={() => setCurrentTab('intro')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'intro'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-teal-600" />
            Home
          </button>

          <button
            onClick={() => setCurrentTab('patient')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'patient'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Patient Portal
          </button>

          <button
            onClick={() => setCurrentTab('tv')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'tv'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-cyan-600" />
            Waiting TV Mode
          </button>

          <button
            onClick={() => {
              if (!currentUser || currentUser.role === 'PATIENT') {
                if (!currentUser) onOpenLogin('STAFF');
              }
              setCurrentTab('doctor');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'doctor'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            Doctor Console
          </button>

          <button
            onClick={() => setCurrentTab('beds')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'beds'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Bed className="w-3.5 h-3.5 text-amber-600" />
            Live Beds
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-purple-600" />
            Analytics
          </button>
        </div>

        {/* Right Action Utilities & Auth Section */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs transition"
            title="Dispatched Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal-600 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Live WebSocket Status Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
            <Radio className={`w-3 h-3 ${wsConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span className={wsConnected ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
              {wsConnected ? 'Live WSS' : 'Polling'}
            </span>
          </div>

          {/* Auth Controls */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 max-w-[95px] truncate">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded border ${
                        getRoleBadge(currentUser.role).bg
                      }`}
                    >
                      {getRoleBadge(currentUser.role).label}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 shadow-xs transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              <button
                onClick={() => onOpenLogin('PATIENT')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-medium transition shadow-xs"
              >
                <UserIcon className="w-3 h-3" />
                <span>Patient Login</span>
              </button>
              <button
                onClick={() => onOpenLogin('STAFF')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-medium transition shadow-xs"
              >
                <Building className="w-3 h-3" />
                <span>Staff Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
