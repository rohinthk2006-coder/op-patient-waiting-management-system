import React, { useState } from 'react';
import type { Hospital, Booking } from '../services/api';
import { bookToken, bookWalkin, checkInPatient } from '../services/api';
import { Clock, ShieldCheck, Ticket, UserCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface PatientPortalProps {
  hospitals: Hospital[];
  onBookingSuccess: () => void;
  activeBooking: Booking | null;
  setActiveBooking: (b: Booking | null) => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  hospitals,
  onBookingSuccess,
  activeBooking,
  setActiveBooking,
}) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospitals[0]?.id || 'hosp-apollo-01');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-card-01');
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [isWalkin, setIsWalkin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      setErrorMsg('Please fill in your name and phone number.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const payload = {
        hospital_id: selectedHospitalId,
        department_id: selectedDeptId,
        doctor_id: 'doc-anand-01',
        schedule_id: 'sch-card-morning',
        booking_date: '2026-10-24',
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_age: patientAge ? parseInt(patientAge) : undefined,
      };

      const booking = isWalkin ? await bookWalkin(payload) : await bookToken(payload);
      setActiveBooking(booking);
      onBookingSuccess();
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
    } catch (err: unknown) {
      console.error('Booking error:', err);
      setErrorMsg('Error generating OP token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfCheckIn = async () => {
    if (!activeBooking) return;
    try {
      setCheckInLoading(true);
      const updated = await checkInPatient(activeBooking.id);
      setActiveBooking(updated);
      onBookingSuccess();
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setCheckInLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Active Token Card (if patient has an active booking) */}
      {activeBooking && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-cyan-950/40 border border-blue-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-2xl bg-blue-600/20 border-2 border-blue-500/40 flex flex-col items-center justify-center text-blue-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Token</span>
                <span className="text-4xl font-black text-white">#{activeBooking.token_number}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {activeBooking.booking_ref}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      activeBooking.status === 'CHECKED_IN'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : activeBooking.status === 'EXPIRED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {activeBooking.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{activeBooking.patient_name}</h3>
                <p className="text-xs text-slate-400">
                  {activeBooking.doctor_name} • {activeBooking.department_name} ({activeBooking.opd_room})
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Reporting Deadline: <strong>{activeBooking.reporting_deadline}</strong>
                  </span>
                  <span className="text-amber-400">
                    Grace Period Expiry: <strong>{activeBooking.grace_period_deadline}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Self Check-in Button */}
            <div>
              {activeBooking.status === 'BOOKED' && (
                <button
                  onClick={handleSelfCheckIn}
                  disabled={checkInLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  <UserCheck className="w-4 h-4" />
                  {checkInLoading ? 'Checking In...' : 'I Am At Hospital (Check In)'}
                </button>
              )}
              {activeBooking.status === 'CHECKED_IN' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Check-in Confirmed. Safe from auto-expiry!
                </div>
              )}
              {activeBooking.status === 'EXPIRED' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  Token Expired (Missed reporting deadline)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hospital Comparison & Token Booking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Hospital & Department Comparison */}
        <div className="lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Compare Hospitals & Outpatient Load</h2>
              <p className="text-xs text-slate-400">Real-time waiting times before you travel</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {hospitals.map((hosp) => (
              <div
                key={hosp.id}
                onClick={() => setSelectedHospitalId(hosp.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedHospitalId === hosp.id
                    ? 'bg-slate-900 border-blue-500/50 shadow-xl shadow-blue-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{hosp.name}</h3>
                    <p className="text-xs text-slate-400">{hosp.address}, {hosp.city}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-cyan-400 border border-slate-700">
                    Emergency: {hosp.emergency_contact}
                  </span>
                </div>

                {/* Departments Waiting Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
                  {hosp.departments.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHospitalId(hosp.id);
                        setSelectedDeptId(dept.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedDeptId === dept.id && selectedHospitalId === hosp.id
                          ? 'bg-blue-600/20 border-blue-500/50'
                          : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-200">{dept.name}</div>
                      <div className="text-[11px] text-cyan-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Avg wait: ~{dept.current_avg_wait_min}m
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Instant OP Token Booking Form */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Book OP Token</h3>
                <p className="text-xs text-slate-400">Atomic allocation • No duplicate numbers</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Subramanian"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="9840123456"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="34"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Department selection info */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                <span className="text-slate-400">Hospital:</span> <strong className="text-white">{selectedHospital?.name}</strong>
                <br />
                <span className="text-slate-400">Doctor:</span> <strong className="text-cyan-400">Dr. R. Anand (Cardiology - OPD 102)</strong>
              </div>

              {/* Walk-in Mode Toggle (Receptionist Feature) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700">
                <div>
                  <span className="text-xs font-semibold text-slate-200">OPD Reception Walk-In</span>
                  <p className="text-[11px] text-slate-500">Marks token as checked-in immediately</p>
                </div>
                <input
                  type="checkbox"
                  checked={isWalkin}
                  onChange={(e) => setIsWalkin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-700 border-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Allocating Token...' : 'Confirm OP Booking'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
