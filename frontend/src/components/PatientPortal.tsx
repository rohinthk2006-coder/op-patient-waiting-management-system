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
    <div className="max-w-6xl mx-auto py-5 px-3 sm:px-6 font-sans">
      {/* Active Token Card (if patient has an active booking) */}
      {activeBooking && (
        <div className="mb-6 p-4 rounded-2xl bg-white border border-teal-200 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center text-teal-800 shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600">Token</span>
                <span className="text-2xl font-black text-slate-900">#{activeBooking.token_number}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                    {activeBooking.booking_ref}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      activeBooking.status === 'CHECKED_IN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : activeBooking.status === 'EXPIRED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {activeBooking.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{activeBooking.patient_name}</h3>
                <p className="text-xs text-slate-500">
                  {activeBooking.doctor_name} • {activeBooking.department_name} ({activeBooking.opd_room})
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-teal-600" />
                    Deadline: <strong>{activeBooking.reporting_deadline}</strong>
                  </span>
                  <span className="text-amber-700">
                    Grace Period: <strong>{activeBooking.grace_period_deadline}</strong>
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {checkInLoading ? 'Checking In...' : 'I Am At Hospital (Check In)'}
                </button>
              )}
              {activeBooking.status === 'CHECKED_IN' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Check-in Confirmed. Safe from auto-expiry!
                </div>
              )}
              {activeBooking.status === 'EXPIRED' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Token Expired (Missed reporting deadline)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hospital Comparison & Token Booking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Hospital & Department Comparison */}
        <div className="lg:col-span-7">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">Compare Hospitals & Outpatient Load</h2>
            <p className="text-xs text-slate-500">Real-time waiting times before you travel</p>
          </div>

          <div className="flex flex-col gap-3">
            {hospitals.map((hosp) => (
              <div
                key={hosp.id}
                onClick={() => setSelectedHospitalId(hosp.id)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedHospitalId === hosp.id
                    ? 'bg-teal-50/30 border-teal-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{hosp.name}</h3>
                    <p className="text-[11px] text-slate-500">{hosp.address}, {hosp.city}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Emergency: {hosp.emergency_contact}
                  </span>
                </div>

                {/* Departments Waiting Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5">
                  {hosp.departments.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHospitalId(hosp.id);
                        setSelectedDeptId(dept.id);
                      }}
                      className={`p-2 rounded-lg border text-left transition ${
                        selectedDeptId === dept.id && selectedHospitalId === hosp.id
                          ? 'bg-teal-50 border-teal-400 text-teal-900'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">{dept.name}</div>
                      <div className="text-[10px] text-teal-700 mt-0.5 flex items-center gap-1">
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
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Book OP Token</h3>
                <p className="text-[11px] text-slate-500">Atomic allocation • No duplicate numbers</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Subramanian"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="9840123456"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:bg-white transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="34"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Department selection info */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="text-slate-500">Hospital:</span> <strong className="text-slate-900">{selectedHospital?.name}</strong>
                <br />
                <span className="text-slate-500">Doctor:</span> <strong className="text-teal-800">Dr. R. Anand (Cardiology - OPD 102)</strong>
              </div>

              {/* Walk-in Mode Toggle (Receptionist Feature) */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-800">OPD Reception Walk-In</span>
                  <p className="text-[10px] text-slate-500">Marks token as checked-in immediately</p>
                </div>
                <input
                  type="checkbox"
                  checked={isWalkin}
                  onChange={(e) => setIsWalkin(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded bg-white border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {loading ? 'Allocating Token...' : 'Confirm OP Booking'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
