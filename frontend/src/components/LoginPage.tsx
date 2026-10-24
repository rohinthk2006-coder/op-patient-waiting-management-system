import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Stethoscope,
  ShieldCheck,
  Lock,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  Sparkles,
  Building,
  KeyRound,
  ShieldAlert,
  ClipboardList,
  ArrowLeft,
  Activity,
  HeartHandshake,
  MessageSquareCheck,
  RotateCcw,
} from 'lucide-react';
import { loginUser, registerUser, sendLoginOtp, verifyLoginOtp, type User } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onBackToHome: () => void;
  initialRole?: 'PATIENT' | 'STAFF';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToHome,
  initialRole = 'PATIENT',
}) => {
  const [activeTab, setActiveTab] = useState<'PATIENT' | 'STAFF'>(initialRole);
  const [patientAuthMode, setPatientAuthMode] = useState<'OTP' | 'PASSWORD'>('OTP');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Form states
  const [phone, setPhone] = useState<string>(initialRole === 'PATIENT' ? '9840112233' : '9876543210');
  const [password, setPassword] = useState<string>(initialRole === 'PATIENT' ? 'patient123' : 'doctor123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');

  // OTP state
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Staff role selector state for quick testing
  const [staffSubRole, setStaffSubRole] = useState<'DOCTOR' | 'RECEPTIONIST' | 'ADMIN'>('DOCTOR');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any = null;
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleTabChange = (tab: 'PATIENT' | 'STAFF') => {
    setActiveTab(tab);
    setError(null);
    setOtpNotice(null);
    setOtpSent(false);
    setIsRegistering(false);
    if (tab === 'PATIENT') {
      setPhone('9840112233');
      setPassword('patient123');
    } else {
      setPhone('9876543210');
      setPassword('doctor123');
      setStaffSubRole('DOCTOR');
    }
  };

  const fillStaffDemo = (role: 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN') => {
    setStaffSubRole(role);
    setError(null);
    if (role === 'DOCTOR') {
      setPhone('9876543210');
      setPassword('doctor123');
    } else if (role === 'RECEPTIONIST') {
      setPhone('9876543211');
      setPassword('recep123');
    } else {
      setPhone('9876543299');
      setPassword('admin123');
    }
  };

  const fillPatientDemo = () => {
    setError(null);
    setPhone('9840112233');
    setPassword('patient123');
    if (patientAuthMode === 'OTP') {
      setOtpSent(true);
      setOtpCode('123456');
      setOtpNotice('Demo OTP code 123456 auto-populated!');
    }
  };

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await sendLoginOtp(phone.trim());
      setOtpSent(true);
      setOtpCode(res.otp_preview || '123456');
      setOtpCountdown(60);
      setOtpNotice(`OTP sent to +91 ${phone.trim()} (Demo code: ${res.otp_preview || '123456'})`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to dispatch OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setError('Please enter the 6-digit OTP code');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await verifyLoginOtp(phone.trim(), otpCode.trim(), name.trim() || undefined);
      onLoginSuccess(res.user);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'OTP verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering && activeTab === 'PATIENT') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!phone.trim() || phone.length < 10) throw new Error('Please enter a valid 10-digit mobile number');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

        const res = await registerUser({
          name: name.trim(),
          phone: phone.trim(),
          password,
          age: age ? parseInt(age) : undefined,
          gender,
          role: 'PATIENT',
        });
        onLoginSuccess(res.user);
      } else {
        if (!phone.trim() || !password) {
          throw new Error('Please enter both mobile number and password');
        }
        const res = await loginUser(phone.trim(), password);
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between font-sans overflow-x-hidden">
      {/* Background Image with Clean Soft Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('/hospital_bg.jpg')`,
        }}
      />
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[3px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900 hidden sm:inline">Hospital OP Live Tracker</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden md:inline">Trichy Healthcare Hub</span>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white/95 border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 backdrop-blur-xl overflow-hidden animate-fadeIn">
          {/* Card Header & Brand */}
          <div className="p-5 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                  activeTab === 'PATIENT'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {activeTab === 'PATIENT' ? (
                  <ShieldCheck className="w-5 h-5 text-teal-700" />
                ) : (
                  <Stethoscope className="w-5 h-5 text-emerald-700" />
                )}
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  Hospital Access Gateway
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Secure
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500">
                  {activeTab === 'PATIENT'
                    ? 'Instant OTP login for appointments, travel time & live queue'
                    : 'Doctor Consultation Console, OPD Desk & Bed Control'}
                </p>
              </div>
            </div>
          </div>

          {/* Dual Tab Switcher */}
          <div className="p-3.5 pb-0">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleTabChange('PATIENT')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'PATIENT'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>Patient Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('STAFF')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'STAFF'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                <span>Staff & Doctor</span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 pt-3">
            {/* 1-Tap Demo Credentials Pill */}
            <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1.5">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  1-Tap Demo Autofill:
                </span>
                <span className="text-[10px] text-slate-400">Click to autofill</span>
              </div>

              {activeTab === 'PATIENT' ? (
                <button
                  type="button"
                  onClick={fillPatientDemo}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-xs text-teal-900 font-medium transition"
                >
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>Rajesh Kumar (Patient)</span>
                  </div>
                  <span className="font-mono text-xs text-teal-700">9840112233 / OTP: 123456</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillStaffDemo('DOCTOR')}
                    className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition ${
                      staffSubRole === 'DOCTOR'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5 mb-0.5 text-emerald-600" />
                    <span className="text-[10px]">Doctor</span>
                    <span className="text-[9px] text-slate-400">Dr. Anand</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillStaffDemo('RECEPTIONIST')}
                    className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition ${
                      staffSubRole === 'RECEPTIONIST'
                        ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5 mb-0.5 text-teal-600" />
                    <span className="text-[10px]">Reception</span>
                    <span className="text-[9px] text-slate-400">OPD Desk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillStaffDemo('ADMIN')}
                    className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition ${
                      staffSubRole === 'ADMIN'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mb-0.5 text-purple-600" />
                    <span className="text-[10px]">Admin</span>
                    <span className="text-[9px] text-slate-400">Super Admin</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification / Success Alert */}
            {otpNotice && (
              <div className="mb-3 p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquareCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  {otpNotice}
                </span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-teal-300 text-teal-800">
                  123456
                </span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* PATIENT OTP LOGIN FLOW */}
            {activeTab === 'PATIENT' && patientAuthMode === 'OTP' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <MessageSquareCheck className="w-3.5 h-3.5 text-teal-600" />
                    Patient Mobile OTP Login
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientAuthMode('PASSWORD');
                      setError(null);
                    }}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-medium"
                  >
                    Use Password instead
                  </button>
                </div>

                {!otpSent ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Enter 10-Digit Mobile Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500 font-mono">
                          +91
                        </span>
                        <input
                          type="tel"
                          placeholder="9840112233"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          maxLength={10}
                          className="w-full pl-11 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition font-mono"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        We will send a 6-digit one-time password to this number.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSendOtp}
                      className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <MessageSquareCheck className="w-4 h-4" />
                          <span>Send Login OTP</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500">OTP sent to:</span>{' '}
                        <strong className="text-slate-900 font-mono">+91 {phone}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpNotice(null);
                        }}
                        className="text-teal-700 hover:text-teal-900 text-[11px] font-semibold"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-700">Enter 6-Digit OTP</label>
                        <button
                          type="button"
                          onClick={() => setOtpCode('123456')}
                          className="text-[10px] text-teal-700 hover:underline font-semibold"
                        >
                          Fill Demo (123456)
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full px-3 py-2.5 text-center tracking-[0.5em] text-lg font-bold font-mono rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Didn't receive code?</span>
                      {otpCountdown > 0 ? (
                        <span className="text-slate-400 font-mono">Resend in {otpCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-teal-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify OTP & Access Portal</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* PASSWORD LOGIN FORM (For Staff or Patient who switched) */
              <form onSubmit={handleSubmit} className="space-y-3">
                {activeTab === 'PATIENT' && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800">Patient Password Login</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientAuthMode('OTP');
                        setError(null);
                      }}
                      className="text-[11px] text-teal-700 hover:text-teal-900 font-medium"
                    >
                      Login via OTP instead
                    </button>
                  </div>
                )}

                {isRegistering && activeTab === 'PATIENT' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. Priya Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                        <input
                          type="number"
                          placeholder="e.g. 32"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-teal-600 transition"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="e.g. 9840112233"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 shadow-xs transition-all mt-2 ${
                    activeTab === 'PATIENT'
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>
                        {isRegistering
                          ? 'Create Patient Account & Sign In'
                          : activeTab === 'PATIENT'
                          ? 'Sign In to Patient Portal'
                          : `Sign In as ${staffSubRole}`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Registration toggle for Patient in Password Mode */}
            {activeTab === 'PATIENT' && patientAuthMode === 'PASSWORD' && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                  }}
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium transition"
                >
                  {isRegistering
                    ? 'Already have an account? Sign In directly'
                    : 'New Patient? Create an account'}
                </button>
              </div>
            )}
          </div>

          {/* Security notice footer in card */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>256-Bit Encrypted Healthcare Session • Trichy Outpatient Network</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-2.5 text-center text-xs text-slate-600 bg-white/90 border-t border-slate-200">
        Hospital OP Live Tracker • Tiruchirappalli Outpatient Queue & Emergency Bed Operations
      </footer>
    </div>
  );
};
