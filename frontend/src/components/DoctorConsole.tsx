import React, { useState } from 'react';
import { Stethoscope, PhoneCall, Play, CheckCircle, Clock, UserX, Zap, RefreshCw } from 'lucide-react';
import type { QueueSession } from '../services/api';
import { executeTokenAction } from '../services/api';
import { playChime } from '../utils/audioChime';

interface DoctorConsoleProps {
  session: QueueSession | null;
  onRefresh: () => void;
}

export const DoctorConsole: React.FC<DoctorConsoleProps> = ({ session, onRefresh }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (action: 'CALL' | 'START' | 'COMPLETE' | 'HOLD' | 'ABSENT' | 'DEMO_EXPIRE', tokenNumber: number) => {
    if (!session) return;
    setLoadingAction(`${action}-${tokenNumber}`);
    try {
      if (action === 'CALL') {
        playChime();
      }
      await executeTokenAction(session.schedule_id, action, tokenNumber, session.date);
      onRefresh();
    } catch (err) {
      console.error('Doctor console action error:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const currentServingToken = session?.current_serving_token;
  const currentPatient = session?.tokens.find((t) => t.token_number === currentServingToken);
  const nextWaiting = session?.tokens.filter(
    (t) => t.status === 'CHECKED_IN' || t.status === 'BOOKED'
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {session?.doctor_name || 'Dr. R. Anand'} — Consultation Desk
            </h2>
            <p className="text-sm text-slate-400">
              {session?.department_name || 'Cardiology'} | {session?.opd_room || 'OPD Room 102'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-sm font-medium transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Main Grid: Active Consultation & Queue Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Active Patient Card */}
        <div className="lg:col-span-7 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Consultation Room
              </span>
              {currentPatient ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {currentPatient.status}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  Ready to Call Next
                </span>
              )}
            </div>

            {currentPatient ? (
              <div className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-3xl font-black text-emerald-400">
                    #{currentPatient.token_number}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{currentPatient.patient_name}</h3>
                    <p className="text-sm text-slate-400">Reporting Deadline: {currentPatient.reporting_deadline}</p>
                    <p className="text-xs text-amber-400">Grace Expiry Deadline: {currentPatient.grace_period_deadline}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <p className="text-lg font-medium text-slate-300">No active patient currently called.</p>
                <p className="text-xs text-slate-500 mt-1">Select an eligible patient below or click 'Call Next'.</p>
              </div>
            )}
          </div>

          {/* Action Button Controls */}
          <div className="pt-6 border-t border-slate-800/80">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Call Next Button */}
              {nextWaiting && nextWaiting.length > 0 && (
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('CALL', nextWaiting[0].token_number)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  <PhoneCall className="w-4 h-4" />
                  Call #{nextWaiting[0].token_number}
                </button>
              )}

              {/* Start Consultation */}
              {currentPatient && (
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('START', currentPatient.token_number)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Start Visit
                </button>
              )}

              {/* Complete Consultation */}
              {currentPatient && (
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('COMPLETE', currentPatient.token_number)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </button>
              )}

              {/* Mark Absent */}
              {currentPatient && (
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('ABSENT', currentPatient.token_number)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600 text-rose-300 hover:text-white font-semibold text-sm transition disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  Absent
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Patient Waiting Queue List */}
        <div className="lg:col-span-5 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Patient Queue List</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                {session?.total_waiting || 0} waiting
              </span>
            </h3>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {session?.tokens && session.tokens.length > 0 ? (
              session.tokens.map((token) => (
                <div
                  key={token.booking_id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    token.token_number === currentServingToken
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-white">
                      #{token.token_number}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{token.patient_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          Est: ~{token.estimated_wait_minutes}m
                        </span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            token.status === 'CHECKED_IN' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {token.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Single-Click Actions per token */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAction('CALL', token.token_number)}
                      title="Call this token"
                      className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition text-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAction('DEMO_EXPIRE', token.token_number)}
                      title="Simulate Auto-Expiry (Grace period expired demo)"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition text-xs font-semibold"
                    >
                      <Zap className="w-3 h-3" />
                      Expire
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                No active bookings in queue. Book a token in the Patient Portal!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
