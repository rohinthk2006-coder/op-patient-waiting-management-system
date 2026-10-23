import React from 'react';
import {
  ShieldCheck,
  Stethoscope,
  Tv,
  Bed,
  BarChart2,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  Building2,
  HeartPulse,
  ChevronRight,
} from 'lucide-react';
import type { Hospital, User } from '../services/api';

interface IntroPageProps {
  onNavigateToLogin: (role: 'PATIENT' | 'STAFF') => void;
  onNavigateToTab: (tab: 'patient' | 'tv' | 'doctor' | 'beds' | 'analytics') => void;
  currentUser: User | null;
  hospitals: Hospital[];
}

export const IntroPage: React.FC<IntroPageProps> = ({
  onNavigateToLogin,
  onNavigateToTab,
  currentUser,
  hospitals,
}) => {
  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Subtle light healthcare ambient glows */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-teal-100/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-[110px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          {/* Top Medical Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>Healthcare Outpatient Queue & Bed Management</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          {/* Main Title - Reduced font size and crisp white/slate palette */}
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-snug">
            Zero-Wait Outpatient Flow.{' '}
            <span className="text-teal-700">Real-Time Hospital Queue</span> & Emergency Tracking.
          </h1>

          {/* Subtitle - Reduced font size */}
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate outpatient waiting hall congestion with atomic anti-duplicate token booking, 
            server-side grace period auto-expiry, digital signage with audio chimes, and live emergency bed intelligence.
          </p>

          {/* Call-to-Action Buttons - Compact & Elegant */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => {
                if (currentUser) {
                  onNavigateToTab('patient');
                } else {
                  onNavigateToLogin('PATIENT');
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{currentUser?.role === 'PATIENT' ? 'Go to Patient Portal' : 'Patient Portal Login'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>

            <button
              onClick={() => {
                if (currentUser && currentUser.role !== 'PATIENT') {
                  onNavigateToTab('doctor');
                } else {
                  onNavigateToLogin('STAFF');
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-medium text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition"
            >
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>{currentUser && currentUser.role !== 'PATIENT' ? 'Open Staff Console' : 'Hospital Staff & Doctor Login'}</span>
            </button>

            <button
              onClick={() => onNavigateToTab('tv')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Tv className="w-4 h-4 text-cyan-600" />
              <span>Waiting Hall TV Mode</span>
            </button>
          </div>

          {/* Quick Features List */}
          <div className="pt-1 text-xs text-slate-500 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 0 Duplicate tokens
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> 10-Min grace auto-expiry
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> Live WebSocket broadcast
            </span>
          </div>
        </div>

        {/* Live Network Statistics Strip */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hospitals Live</span>
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{hospitals.length || 3}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Multi-specialty centers connected</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Token Integrity</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">0 Duplicates</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Atomic database sequencing</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Auto-Expiry</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">10 Min</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Grace deadline before no-show expiry</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Emergency Tracking</span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">ICU & Trauma</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Live critical bed availability</p>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-teal-700 mb-1">
            Healthcare Operations Suite
          </h2>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            Outpatient & Clinic Modules
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Patient Portal */}
          <div
            onClick={() => {
              if (currentUser) onNavigateToTab('patient');
              else onNavigateToLogin('PATIENT');
            }}
            className="group cursor-pointer p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-400 transition shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center justify-between">
              Patient Live Portal
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compare hospital wait times before traveling. Book atomic OP tokens, 1-tap arrival check-in to disarm auto-expiry, and live countdown timer.
            </p>
          </div>

          {/* Card 2: Doctor Console */}
          <div
            onClick={() => {
              if (currentUser && currentUser.role !== 'PATIENT') onNavigateToTab('doctor');
              else onNavigateToLogin('STAFF');
            }}
            className="group cursor-pointer p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-400 transition shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center justify-between">
              Doctor OPD Console
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Streamlined room console for doctors. One-click controls to Call Next Patient, Start Visit, Complete Consultation, Put on Hold, or Mark Absent.
            </p>
          </div>

          {/* Card 3: Digital Signage TV */}
          <div
            onClick={() => onNavigateToTab('tv')}
            className="group cursor-pointer p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-400 transition shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center justify-between">
              Waiting Hall TV Mode
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition" />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fullscreen display for hospital waiting halls. Giant active token badge, next 3 waiting patients, and Web Audio chime alert.
            </p>
          </div>

          {/* Card 4: Emergency Beds */}
          <div
            onClick={() => onNavigateToTab('beds')}
            className="group cursor-pointer p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 transition shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Bed className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center justify-between">
              Live Bed Availability
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time monitoring across ICU, Emergency Trauma, Oxygen Support, and General Wards with color-coded critical alert thresholds.
            </p>
          </div>

          {/* Card 5: Queue Analytics */}
          <div
            onClick={() => onNavigateToTab('analytics')}
            className="group cursor-pointer p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-400 transition shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center justify-between">
              Throughput Analytics
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hourly patient velocity bar charts and token breakdown distributions (Waiting, Consulted, Expired) powered by Recharts.
            </p>
          </div>

          {/* Card 6: AI Waiting-Time Engine */}
          <div
            onClick={() => onNavigateToTab('patient')}
            className="group cursor-pointer p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-400 transition shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center justify-between">
              AI Wait-Time Engine
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent prediction pipeline multiplying active queue position by dynamic rolling consultation averages with doctor pace adjustments.
            </p>
          </div>
        </div>
      </section>

      {/* Hospital Network Trust Section */}
      <section className="py-8 border-t border-slate-200 bg-white text-center px-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-4">
          Connected Healthcare Partners
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-600 font-medium text-xs">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Apollo Specialty Hospitals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-cyan-600" />
            <span>Fortis Memorial Hospital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>AIIMS Outpatient Network</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Manipal Health Enterprises</span>
          </div>
        </div>
      </section>
    </div>
  );
};
