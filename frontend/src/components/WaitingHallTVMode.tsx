import React from 'react';
import { Volume2, BellRing, ArrowRight, Clock, Users, CheckCircle2, AlertOctagon } from 'lucide-react';
import type { QueueSession } from '../services/api';
import { playChime } from '../utils/audioChime';

interface WaitingHallTVModeProps {
  session: QueueSession | null;
  onRefresh: () => void;
}

export const WaitingHallTVMode: React.FC<WaitingHallTVModeProps> = ({ session }) => {
  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-6 px-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              Live OPD Display
            </span>
            <span className="text-slate-400 text-sm">Room: <strong className="text-white text-base">{session?.opd_room || 'OPD Room 102'}</strong></span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            {session?.doctor_name || 'Dr. R. Anand'} — <span className="text-blue-400">{session?.department_name || 'Cardiology'}</span>
          </h2>
        </div>

        <button
          onClick={playChime}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-sm font-semibold transition shadow-md"
        >
          <Volume2 className="w-4 h-4 text-cyan-400" />
          Test Chime Sound
        </button>
      </div>

      {/* Main Big Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center">
        {/* Giant Active Serving Token */}
        <div className="lg:col-span-8 bg-gradient-to-b from-slate-900 to-slate-950 p-8 rounded-3xl border-2 border-emerald-500/30 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-widest text-sm mb-4">
            <BellRing className="w-4 h-4 animate-bounce" />
            Currently Serving
          </div>

          <div className="py-6">
            <span className="text-8xl sm:text-9xl font-black text-white tracking-tight drop-shadow-[0_0_35px_rgba(16,185,129,0.35)]">
              {session?.current_serving_token ? `#${session.current_serving_token}` : 'CALLING'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-300 text-lg font-medium">
            <span>Please proceed to:</span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-cyan-400 font-bold border border-slate-700">
              {session?.opd_room || 'OPD Room 102'}
            </span>
          </div>
        </div>

        {/* Up Next & Session Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Next in Queue */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Next Patients Up</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </h3>

            {session?.next_up_tokens && session.next_up_tokens.length > 0 ? (
              <div className="flex flex-col gap-3">
                {session.next_up_tokens.map((tokenNum, idx) => (
                  <div
                    key={tokenNum}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <span className="text-2xl font-bold text-white">Token #{tokenNum}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                      Be Ready
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">
                No subsequent patients in queue
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{session?.total_waiting || 0}</div>
              <div className="text-[11px] text-slate-400 font-medium">Waiting</div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{session?.total_completed || 0}</div>
              <div className="text-[11px] text-slate-400 font-medium">Completed</div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <AlertOctagon className="w-4 h-4 text-rose-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{session?.total_expired || 0}</div>
              <div className="text-[11px] text-slate-400 font-medium">Expired</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Ticker Instructions */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Please report to the OPD desk <strong>20 minutes</strong> prior to your estimated turn.</span>
        </div>
        <div className="hidden md:block text-slate-500">
          Unreported tokens automatically expire after the 10-minute grace period.
        </div>
      </div>
    </div>
  );
};
