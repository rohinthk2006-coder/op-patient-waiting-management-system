import React, { useState } from 'react';
import {
  Stethoscope,
  PhoneCall,
  Play,
  CheckCircle,
  Clock,
  UserX,
  Zap,
  RefreshCw,
  AlertTriangle,
  Send,
  MapPin,
  CreditCard,
  Check,
} from 'lucide-react';
import type { QueueSession } from '../services/api';
import { executeTokenAction, updateDoctorDelay } from '../services/api';
import { playChime } from '../utils/audioChime';

interface DoctorConsoleProps {
  session: QueueSession | null;
  onRefresh: () => void;
}

export const DoctorConsole: React.FC<DoctorConsoleProps> = ({ session, onRefresh }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Doctor Delay state
  const [selectedDelayMin, setSelectedDelayMin] = useState<number>(session?.doctor_delay_min || 0);
  const [delayReason, setDelayReason] = useState<string>(
    session?.delay_reason || 'Emergency Trauma Case in OT'
  );
  const [updatingDelay, setUpdatingDelay] = useState<boolean>(false);
  const [delaySuccessNotice, setDelaySuccessNotice] = useState<string | null>(null);

  const handleAction = async (
    action: 'CALL' | 'START' | 'COMPLETE' | 'HOLD' | 'ABSENT' | 'DEMO_EXPIRE',
    tokenNumber: number
  ) => {
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

  const handleUpdateDelay = async () => {
    if (!session) return;
    setUpdatingDelay(true);
    setDelaySuccessNotice(null);
    try {
      await updateDoctorDelay(
        session.schedule_id,
        selectedDelayMin,
        delayReason || 'OPD Consultation Delay'
      );
      setDelaySuccessNotice(
        selectedDelayMin > 0
          ? `+${selectedDelayMin} min delay broadcast to all waiting patients successfully!`
          : `Doctor marked on-time. Delay cleared for waiting patients.`
      );
      onRefresh();
      setTimeout(() => setDelaySuccessNotice(null), 4000);
    } catch (err) {
      console.error('Error updating doctor delay:', err);
    } finally {
      setUpdatingDelay(false);
    }
  };

  const currentServingToken = session?.current_serving_token;
  const currentPatient = session?.tokens.find((t) => t.token_number === currentServingToken);
  const nextWaiting = session?.tokens.filter(
    (t) => t.status === 'CHECKED_IN' || t.status === 'BOOKED'
  );

  return (
    <div className="w-full py-5 px-4 sm:px-6 lg:px-8 font-sans">
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
          {session?.doctor_delay_min && session.doctor_delay_min > 0 ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Active Delay: +{session.doctor_delay_min} mins
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              On Schedule
            </span>
          )}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* DOCTOR DELAY MANAGEMENT CARD */}
      <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                Doctor OPD Delay Notice & Live Patient Broadcast
              </h3>
              <p className="text-xs text-amber-800">
                Running late due to an emergency or procedure? Notify all patients in real-time and extend their reporting deadlines.
              </p>
            </div>
          </div>

          {/* Quick preset minute buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[0, 10, 15, 20, 30, 45].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedDelayMin(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedDelayMin === m
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                }`}
              >
                {m === 0 ? 'On Time (0m)' : `+${m}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Delay Reason and Action Button */}
        <div className="mt-3 pt-3 border-t border-amber-200 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="w-full sm:flex-1 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Emergency Angioplasty / Trauma Case in OT"
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 transition"
            />
          </div>

          <button
            type="button"
            disabled={updatingDelay}
            onClick={handleUpdateDelay}
            className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition shrink-0"
          >
            {updatingDelay ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Delay to Patients</span>
              </>
            )}
          </button>
        </div>

        {delaySuccessNotice && (
          <div className="mt-2 text-xs font-medium text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-emerald-700" />
            {delaySuccessNotice}
          </div>
        )}
      </div>

      {/* Main Grid: Active Consultation & Queue Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-5">
        {/* Active Patient Card */}
        <div className="lg:col-span-7 bg-white/92 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/60 shadow-md flex flex-col justify-between">
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
                  <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl font-black text-emerald-800 shrink-0 tabular-nums">
                    #{currentPatient.token_number}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{currentPatient.patient_name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-600">
                      <span>Reporting: <strong>{currentPatient.reporting_deadline}</strong></span>
                      {currentPatient.doctor_delay_min !== undefined && currentPatient.doctor_delay_min > 0 && (
                        <span className="text-amber-700 font-semibold">
                          (Doctor delay: +{currentPatient.doctor_delay_min}m)
                        </span>
                      )}
                    </div>
                    {currentPatient.aadhar_number && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        <span>Aadhaar: {currentPatient.aadhar_number.replace(/(\d{4})\s*(\d{4})\s*(\d{4})/, '$1-XXXX-$3')}</span>
                      </div>
                    )}
                    {currentPatient.patient_location && (
                      <div className="text-[11px] text-teal-700 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-teal-600" />
                        <span>Origin: {currentPatient.patient_location}</span>
                      </div>
                    )}
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
        <div className="lg:col-span-5 bg-white/92 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/60 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Patient Queue List</span>
              <span className="px-2 py-0.2 rounded-full bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-200">
                {session?.total_waiting || 0} waiting
              </span>
            </h3>
          </div>

          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
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
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-teal-600" />
                          ~{token.estimated_wait_minutes}m wait
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
                      {token.aadhar_number && (
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Aadhaar: {token.aadhar_number.replace(/(\d{4})\s*(\d{4})\s*(\d{4})/, '$1-XXXX-$3')}
                        </div>
                      )}
                      {token.patient_location && (
                        <div className="text-[9px] text-teal-600 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {token.patient_location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
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
