import React, { useState, useEffect } from 'react';
import type { Hospital, Booking, TrafficEstimateResponse, QueueSession } from '../services/api';
import {
  bookToken,
  bookWalkin,
  checkInPatient,
  calculateTraffic,
  getDoctorDelay,
} from '../services/api';
import {
  Clock,
  ShieldCheck,
  Ticket,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  Navigation,
  CreditCard,
  AlertTriangle,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { HospitalLiveLocationMap } from './HospitalLiveLocationMap';

interface PatientPortalProps {
  hospitals: Hospital[];
  onBookingSuccess: () => void;
  activeBooking: Booking | null;
  setActiveBooking: (b: Booking | null) => void;
  session?: QueueSession | null;
  onOpenNotifications?: () => void;
  notificationCount?: number;
  onRefreshData?: () => void;
}

const TRICHY_AREAS = [
  { name: 'Thillai Nagar', lat: 10.826, lng: 78.683 },
  { name: 'Cantonment', lat: 10.8038, lng: 78.685 },
  { name: 'Central Bus Stand', lat: 10.796, lng: 78.6825 },
  { name: 'Chathiram Bus Stand', lat: 10.835, lng: 78.692 },
  { name: 'K.K. Nagar', lat: 10.778, lng: 78.705 },
  { name: 'Srirangam', lat: 10.8625, lng: 78.69 },
  { name: 'Woraiyur', lat: 10.828, lng: 78.672 },
  { name: 'Golden Rock (Ponmalai)', lat: 10.789, lng: 78.718 },
  { name: 'Trichy Airport Area', lat: 10.7654, lng: 78.7144 },
  { name: 'Tiruverumbur', lat: 10.785, lng: 78.775 },
  { name: 'NIT Trichy / Thuvakudi', lat: 10.76, lng: 78.815 },
  { name: 'Samayapuram', lat: 10.925, lng: 78.742 },
  { name: 'Palakkarai', lat: 10.817, lng: 78.694 },
  { name: 'Ariyamangalam', lat: 10.8015, lng: 78.735 },
];

export const HOSPITAL_REAL_IMAGES: Record<string, string> = {
  'hosp-apollo-01': 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=400&q=80',
  'hosp-trichy-gh-01': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80',
  'hosp-kauvery-cantonment-02': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=400&q=80',
  'hosp-kauvery-heartcity-03': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80',
  'hosp-srm-samayapuram-04': 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=400&q=80',
  'hosp-csi-mission-05': 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=400&q=80',
  'hosp-frontline-06': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80',
  'hosp-maruti-07': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
  'hosp-athena-08': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
  'hosp-rathna-09': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=400&q=80',
};

export const PatientPortal: React.FC<PatientPortalProps> = ({
  hospitals,
  onBookingSuccess,
  activeBooking,
  setActiveBooking,
  session,
  onOpenNotifications,
  notificationCount = 0,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    hospitals[0]?.id || 'hosp-apollo-01'
  );
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-card-01');

  // Patient Details & Aadhaar
  const [patientName, setPatientName] = useState<string>('Rajesh Kumar');
  const [patientPhone, setPatientPhone] = useState<string>('9840112233');
  const [patientAge, setPatientAge] = useState<string>('38');
  const [patientGender, setPatientGender] = useState<string>('Male');
  const [aadharNumber, setAadharNumber] = useState<string>('5432 9876 1234');

  // Live Location & Traffic State
  const [patientLocality, setPatientLocality] = useState<string>('Thillai Nagar');
  const [patientCoords, setPatientCoords] = useState<{ lat: number; lng: number }>({
    lat: 10.826,
    lng: 78.683,
  });
  const [locationDetected, setLocationDetected] = useState<boolean>(true);
  const [detectingGps, setDetectingGps] = useState<boolean>(false);
  const [travelMode, setTravelMode] = useState<'BIKE' | 'CAR' | 'AUTO' | 'BUS'>('BIKE');
  const [trafficData, setTrafficData] = useState<TrafficEstimateResponse | null>(null);
  const [calculatingTraffic, setCalculatingTraffic] = useState<boolean>(false);

  // Doctor Delay state
  const [doctorDelayInfo, setDoctorDelayInfo] = useState<{
    delay_minutes: number;
    delay_reason?: string;
  } | null>(null);

  const [isWalkin, setIsWalkin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedHospital =
    hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Re-calculate traffic whenever hospital, locality, or travel mode changes
  const runTrafficCalculation = async (
    hospId: string,
    lat: number,
    lng: number,
    locality: string,
    mode: string
  ) => {
    try {
      setCalculatingTraffic(true);
      const res = await calculateTraffic({
        hospital_id: hospId,
        patient_latitude: lat,
        patient_longitude: lng,
        patient_locality: locality,
        travel_mode: mode,
        target_reporting_time: '09:00',
      });
      setTrafficData(res);
    } catch (err) {
      console.warn('Traffic calculation error:', err);
    } finally {
      setCalculatingTraffic(false);
    }
  };

  // Check doctor delay for the active schedule
  const checkDoctorDelay = async (schedId: string) => {
    try {
      const data = await getDoctorDelay(schedId);
      if (data && data.delay_minutes > 0) {
        setDoctorDelayInfo(data);
      } else {
        setDoctorDelayInfo(null);
      }
    } catch {
      // Silently ignore if not found
    }
  };

  useEffect(() => {
    if (selectedHospitalId) {
      runTrafficCalculation(
        selectedHospitalId,
        patientCoords.lat,
        patientCoords.lng,
        patientLocality,
        travelMode
      );
      checkDoctorDelay('sch-card-morning');
    }
  }, [selectedHospitalId, patientCoords, patientLocality, travelMode]);

  // Handle Live GPS Geolocation
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPatientCoords({ lat, lng });
        setPatientLocality('Live GPS Location (Trichy Area)');
        setLocationDetected(true);
        setDetectingGps(false);
        runTrafficCalculation(selectedHospitalId, lat, lng, 'Live GPS Location', travelMode);
      },
      () => {
        // Fallback to Thillai Nagar
        setDetectingGps(false);
        setPatientCoords({ lat: 10.826, lng: 78.683 });
        setPatientLocality('Thillai Nagar, Trichy (Simulated GPS)');
        setLocationDetected(true);
        runTrafficCalculation(
          selectedHospitalId,
          10.826,
          78.683,
          'Thillai Nagar, Trichy (Simulated GPS)',
          travelMode
        );
      },
      { timeout: 7000 }
    );
  };

  const handleSelectArea = (areaName: string) => {
    const area = TRICHY_AREAS.find((a) => a.name === areaName);
    if (area) {
      setPatientLocality(area.name);
      setPatientCoords({ lat: area.lat, lng: area.lng });
      setLocationDetected(true);
      runTrafficCalculation(selectedHospitalId, area.lat, area.lng, area.name, travelMode);
    }
  };

  const handleAadhaarChange = (val: string) => {
    // Only allow digits, format as XXXX XXXX XXXX
    const digits = val.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.substring(i, i + 4));
    }
    setAadharNumber(parts.join(' '));
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      setErrorMsg('Please fill in patient name and mobile number.');
      return;
    }

    const cleanAadhaar = aadharNumber.replace(/\s/g, '');
    if (cleanAadhaar && cleanAadhaar.length !== 12) {
      setErrorMsg('Aadhaar number must contain exactly 12 digits.');
      return;
    }

    if (!locationDetected) {
      setErrorMsg('Please share or select your live location to calculate traffic and travel time.');
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
        patient_gender: patientGender,
        aadhar_number: aadharNumber || undefined,
        patient_location: `${patientLocality}, Trichy`,
        patient_latitude: patientCoords.lat,
        patient_longitude: patientCoords.lng,
        travel_mode: travelMode,
        travel_distance_km: trafficData?.distance_km,
        estimated_travel_min: trafficData?.estimated_travel_min,
        traffic_condition: trafficData?.traffic_level,
        recommended_departure_time: trafficData?.recommended_departure_time,
      };

      const booking = isWalkin ? await bookWalkin(payload) : await bookToken(payload);
      setActiveBooking(booking);
      onBookingSuccess();
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

  // Filter hospitals by search
  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.area && h.area.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full py-4 px-4 sm:px-6 lg:px-8 font-sans">
      {/* DOCTOR DELAY LIVE ALERT BANNER */}
      {doctorDelayInfo && doctorDelayInfo.delay_minutes > 0 && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Doctor Delay Notice
                </span>
                <span className="px-2 py-0.2 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                  +{doctorDelayInfo.delay_minutes} mins delay
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-0.5">
                Dr. R. Anand is currently delayed due to{' '}
                <strong>{doctorDelayInfo.delay_reason}</strong>. Your reporting deadline and grace
                period have been automatically extended.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 hidden sm:inline">
            Safe From Expiry
          </span>
        </div>
      )}

      {/* ACTIVE TOKEN CARD (if patient has an active booking) */}
      {activeBooking && (
        <div className="mb-6 p-4 rounded-2xl bg-white/92 backdrop-blur-md border border-white/60 shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center text-teal-800 shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600">
                  Token
                </span>
                <span className="text-2xl font-black text-slate-900">
                  #{activeBooking.token_number}
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
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
                  {activeBooking.doctor_delay_min && activeBooking.doctor_delay_min > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      +{activeBooking.doctor_delay_min}m Doctor Delay
                    </span>
                  ) : null}
                </div>
                <h3 className="text-base font-bold text-slate-900">{activeBooking.patient_name}</h3>
                <p className="text-xs text-slate-500">
                  {activeBooking.doctor_name} • {activeBooking.department_name} ({activeBooking.opd_room})
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-teal-600" />
                    Reporting Deadline:{' '}
                    <strong>
                      {activeBooking.adjusted_reporting_deadline || activeBooking.reporting_deadline}
                    </strong>
                  </span>
                  <span className="text-amber-700">
                    Grace Deadline: <strong>{activeBooking.grace_period_deadline}</strong>
                  </span>
                  {activeBooking.aadhar_number && (
                    <span className="text-slate-600 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      Aadhaar:{' '}
                      <strong className="font-mono">
                        {activeBooking.aadhar_number.replace(
                          /(\d{4})\s*(\d{4})\s*(\d{4})/,
                          '$1-XXXX-$3'
                        )}
                      </strong>
                    </span>
                  )}
                  {activeBooking.patient_location && (
                    <span className="text-teal-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-teal-600" />
                      Origin: {activeBooking.patient_location}
                      {activeBooking.travel_distance_km ? ` (${activeBooking.travel_distance_km} km)` : ''}
                    </span>
                  )}
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

      {/* Main Grid: Trichy Hospitals Catalog + Booking with Live Location */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Trichy Hospitals List */}
        <div className="lg:col-span-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>Hospitals in Tiruchirappalli (Trichy)</span>
                <span className="px-2 py-0.2 rounded-full bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-200">
                  {hospitals.length} Hospitals
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Choose a hospital in Trichy to calculate traffic and book an atomic OP token
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Trichy hospital or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition w-full sm:w-56"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 max-h-[720px] overflow-y-auto pr-1">
            {filteredHospitals.map((hosp) => (
              <div
                key={hosp.id}
                onClick={() => setSelectedHospitalId(hosp.id)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedHospitalId === hosp.id
                    ? 'bg-teal-50/75 border-teal-500 shadow-sm ring-1 ring-teal-500/30 backdrop-blur-md'
                    : 'bg-white/88 backdrop-blur-md border-white/60 hover:bg-white/95 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5 mb-2.5">
                  {/* Real Hospital Picture Icon Box */}
                  <div
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border transition-all ${
                      selectedHospitalId === hosp.id
                        ? 'ring-2 ring-teal-500 border-teal-500 shadow-md scale-[1.02]'
                        : 'border-slate-200/90 shadow-xs'
                    }`}
                  >
                    <img
                      src={HOSPITAL_REAL_IMAGES[hosp.id] || HOSPITAL_REAL_IMAGES['hosp-apollo-01']}
                      alt={hosp.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent px-1 py-0.5">
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider block truncate">
                        {hosp.area || 'Trichy'}
                      </span>
                    </div>
                  </div>

                  {/* Hospital Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{hosp.name}</h3>
                        {selectedHospitalId === hosp.id && (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200 shrink-0">
                        Emerg: {hosp.emergency_contact}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{hosp.address}, {hosp.city}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-600">
                      <span className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 font-semibold border border-teal-200">
                        {hosp.departments.length} Specialties
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">
                        Avg Wait: ~{hosp.departments[0]?.current_avg_wait_min || 15}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Departments Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2.5">
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
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">{dept.name}</div>
                      <div
                        className={`text-[10px] mt-0.5 flex items-center gap-1 ${
                          selectedDeptId === dept.id && selectedHospitalId === hosp.id
                            ? 'text-teal-100'
                            : 'text-teal-700'
                        }`}
                      >
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

        {/* Right Column: Live Location, Traffic Calculation & OP Token Booking */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* STEP 1: LIVE LOCATION & TRAFFIC ESTIMATOR */}
          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span>Live Location & Travel Traffic</span>
                    {calculatingTraffic && (
                      <span className="w-2.5 h-2.5 rounded-full border border-teal-600 border-t-transparent animate-spin inline-block" />
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Real-time distance to {selectedHospital?.name?.split(' ')[0] || 'Hospital'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDetectLiveLocation}
                disabled={detectingGps}
                className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <MapPin className="w-3 h-3 text-teal-600" />
                <span>{detectingGps ? 'Locating...' : 'Detect GPS'}</span>
              </button>
            </div>

            {/* Quick Trichy Area Selector */}
            <div className="mt-2.5">
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Your Starting Location in Trichy
              </label>
              <select
                value={patientLocality}
                onChange={(e) => handleSelectArea(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition"
              >
                {TRICHY_AREAS.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name} (Trichy)
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Mode Selector */}
            <div className="mt-2.5">
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Mode of Travel
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { mode: 'BIKE', label: 'Bike 🛵' },
                  { mode: 'CAR', label: 'Car 🚗' },
                  { mode: 'AUTO', label: 'Auto 🛺' },
                  { mode: 'BUS', label: 'Bus 🚌' },
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTravelMode(mode as any)}
                    className={`py-1 rounded-lg text-xs font-semibold text-center transition ${
                      travelMode === mode
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 1.1: INTERACTIVE ALL HOSPITALS MAP & OP VACATE TIMING COMPARISON */}
            <div className="mt-3.5">
              <HospitalLiveLocationMap
                hospitals={hospitals}
                selectedHospitalId={selectedHospitalId}
                onSelectHospital={(id) => setSelectedHospitalId(id)}
                patientCoords={patientCoords}
                patientLocality={patientLocality}
                travelMode={travelMode}
                trafficData={trafficData}
                targetOpTime={
                  activeBooking?.estimated_consultation_time ||
                  activeBooking?.reporting_deadline ||
                  '10:00 AM'
                }
                doctorName="Dr. R. Anand"
                opdRoom={selectedHospital?.departments?.find((d) => d.id === selectedDeptId)?.room_number || 'OPD Room 102'}
                onDetectGps={handleDetectLiveLocation}
                detectingGps={detectingGps}
                session={session}
                activeBooking={activeBooking}
                doctorDelayInfo={doctorDelayInfo}
                onOpenNotifications={onOpenNotifications}
                notificationCount={notificationCount}
                onRefreshSession={onRefreshData}
              />
            </div>
          </div>

          {/* STEP 2: PATIENT OP BOOKING FORM WITH AADHAAR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Book OP Token</h3>
                  <p className="text-[11px] text-slate-500">Atomic allocation • Zero duplicate token</p>
                </div>
              </div>

              {/* 1-tap demo Aadhaar autofill */}
              <button
                type="button"
                onClick={() => {
                  setPatientName('Rajesh Kumar');
                  setPatientPhone('9840112233');
                  setPatientAge('38');
                  setAadharNumber('5432 9876 1234');
                }}
                className="text-[10px] text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1 rounded font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Demo Fill
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:bg-white transition"
                />
              </div>

              {/* Aadhaar Number Field (Requested Feature) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                    <span>Aadhaar Card Number (12 Digits)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">UIDAI Patient Verification</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={14} // formatted with spaces
                  placeholder="XXXX XXXX XXXX"
                  value={aadharNumber}
                  onChange={(e) => handleAadhaarChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:bg-white transition font-mono tracking-wider"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9840112233"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:bg-white transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="38"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Booking Summary Box */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">Hospital:</span>
                  <strong className="text-slate-900 text-right">{selectedHospital?.name}</strong>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">Doctor:</span>
                  <strong className="text-teal-800">Dr. R. Anand (Cardiology)</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Origin Route:</span>
                  <span className="text-slate-700 font-medium">
                    {patientLocality} • {trafficData?.distance_km || 0} km (~
                    {trafficData?.estimated_travel_min || 15}m)
                  </span>
                </div>
              </div>

              {/* Walk-in Mode Toggle */}
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
                {loading ? 'Allocating Token...' : 'Confirm OP Booking with Aadhaar'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
