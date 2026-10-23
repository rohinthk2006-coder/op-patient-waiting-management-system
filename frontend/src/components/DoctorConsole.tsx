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
    <div className="max-w-6xl mx-auto py-5 px-3 sm:px-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {session?.doctor_name || 'Dr. R. Anand'} — OPD Desk
            </h2>
            <p className="text-xs text-slate-500">
              {session?.department_name || 'Cardiology'} | {session?.opd_room || 'OPD Room 102'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Main Grid: Active Consultation & Queue Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-5">
        {/* Active Patient Card */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Consultation Room
              </span>
              {currentPatient ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentPatient.status}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Ready to Call Next
                </span>
              )}
            </div>

            {currentPatient ? (
              <div className="py-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl font-black text-emerald-800 shrink-0">
                    #{currentPatient.token_number}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{currentPatient.patient_name}</h3>
                    <p className="text-xs text-slate-500">Deadline: {currentPatient.reporting_deadline}</p>
                    <p className="text-[11px] text-amber-700">Grace Expiry: {currentPatient.grace_period_deadline}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">
                <p className="text-sm font-medium text-slate-700">No active patient currently called.</p>
                <p className="text-xs text-slate-400 mt-0.5">Select a patient below or click 'Call Next'.</p>
              </div>
            )}
          </div>

          {/* Action Button Controls */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Call Next Button */}
              {nextWaiting && nextWaiting.length > 0 && (
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('CALL', nextWaiting[0].token_number)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition disabled:opacity-50"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Call #{nextWaiting[0].token_number}
                </button>
              )}

              {/* Start Consultation */}
              {currentPatient && (
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('START', currentPatient.token_number)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Visit
                </button>
              )}

              {/* Complete Consultation */}
              {currentPatient && (
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('COMPLETE', currentPatient.token_number)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Complete
                </button>
              )}

              {/* Mark Absent */}
              {currentPatient && (
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('ABSENT', currentPatient.token_number)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-medium text-xs shadow-xs transition disabled:opacity-50"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Absent
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Patient Waiting Queue List */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Patient Queue List</span>
              <span className="px-2 py-0.2 rounded-full bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-200">
                {session?.total_waiting || 0} waiting
              </span>
            </h3>
          </div>

          <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
            {session?.tokens && session.tokens.length > 0 ? (
              session.tokens.map((token) => (
                <div
                  key={token.booking_id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                    token.token_number === currentServingToken
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800 shadow-xs">
                      #{token.token_number}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">{token.patient_name}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-teal-600" />
                          ~{token.estimated_wait_minutes}m
                        </span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            token.status === 'CHECKED_IN' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {token.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Single-Click Actions per token */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAction('CALL', token.token_number)}
                      title="Call this token"
                      className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition text-xs"
                    >
                      <PhoneCall className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleAction('DEMO_EXPIRE', token.token_number)}
                      title="Simulate Auto-Expiry (Grace period expired demo)"
                      className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition text-[10px] font-semibold"
                    >
                      <Zap className="w-3 h-3" />
                      Expire
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active bookings in queue. Book a token in the Patient Portal!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
