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
    <div className="min-h-[80vh] flex flex-col justify-between py-5 px-3 sm:px-6 max-w-6xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              Live OPD Display
            </span>
            <span className="text-slate-500 text-xs">Room: <strong className="text-slate-900">{session?.opd_room || 'OPD Room 102'}</strong></span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            {session?.doctor_name || 'Dr. R. Anand'} — <span className="text-teal-700">{session?.department_name || 'Cardiology'}</span>
          </h2>
        </div>

        <button
          onClick={playChime}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition"
        >
          <Volume2 className="w-3.5 h-3.5 text-teal-600" />
          Test Chime Sound
        </button>
      </div>

      {/* Main Big Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-5 items-center">
        {/* Giant Active Serving Token */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-300 shadow-xs relative overflow-hidden text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold uppercase tracking-wider text-xs mb-2">
            <BellRing className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
            Currently Serving
          </div>

          <div className="py-4">
            <span className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tight">
              {session?.current_serving_token ? `#${session.current_serving_token}` : 'CALLING'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-slate-600 text-sm font-medium">
            <span>Please proceed to:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold border border-teal-200">
              {session?.opd_room || 'OPD Room 102'}
            </span>
          </div>
        </div>

        {/* Up Next & Session Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Next in Queue */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Next Patients Up</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
            </h3>

            {session?.next_up_tokens && session.next_up_tokens.length > 0 ? (
              <div className="flex flex-col gap-2">
                {session.next_up_tokens.map((tokenNum, idx) => (
                  <div
                    key={tokenNum}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className="text-base font-bold text-slate-900">Token #{tokenNum}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                      Be Ready
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-xs">
                No subsequent patients in queue
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <Users className="w-3.5 h-3.5 text-teal-600 mx-auto mb-0.5" />
              <div className="text-base font-bold text-slate-900">{session?.total_waiting || 0}</div>
              <div className="text-[10px] text-slate-500 font-medium">Waiting</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-0.5" />
              <div className="text-base font-bold text-slate-900">{session?.total_completed || 0}</div>
              <div className="text-[10px] text-slate-500 font-medium">Completed</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600 mx-auto mb-0.5" />
              <div className="text-base font-bold text-slate-900">{session?.total_expired || 0}</div>
              <div className="text-[10px] text-slate-500 font-medium">Expired</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Ticker Instructions */}
      <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-xs">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>Please report to the OPD desk <strong>20 minutes</strong> prior to your estimated turn.</span>
        </div>
        <div className="hidden md:block text-slate-400 text-[11px]">
          Unreported tokens automatically expire after the 10-minute grace period.
        </div>
      </div>
    </div>
  );
};
