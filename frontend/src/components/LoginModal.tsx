import React, { useState } from 'react';
import {
  User as UserIcon,
  Stethoscope,
  ShieldCheck,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Building,
  KeyRound,
} from 'lucide-react';
import { loginUser, type User } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  defaultRole?: 'PATIENT' | 'STAFF';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  defaultRole = 'PATIENT',
}) => {
  const [activeTab, setActiveTab] = useState<'PATIENT' | 'STAFF'>(defaultRole);

  // Form states - clean inputs without autofill
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTabChange = (tab: 'PATIENT' | 'STAFF') => {
    setActiveTab(tab);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!username.trim() || !password) {
        throw new Error('Please enter both your email ID or phone number and password');
      }
      const res = await loginUser(username.trim(), password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 pb-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                activeTab === 'PATIENT'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {activeTab === 'PATIENT' ? (
                <ShieldCheck className="w-4 h-4 text-teal-700" />
              ) : (
                <Stethoscope className="w-4 h-4 text-emerald-700" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sign In to Live Tracker</h2>
              <p className="text-[11px] text-slate-500">
                {activeTab === 'PATIENT' ? 'Patient Portal Gateway' : 'Doctor & OPD Staff Console'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Tab Switcher */}
        <div className="p-3.5 pb-0">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleTabChange('PATIENT')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

        {/* Body */}
        <div className="p-4 pt-3">
          {/* Error Banner */}
          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email ID or Phone Number
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. user@hospital.com or 9840112233"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition"
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition"
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
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 shadow-xs transition-all mt-3 ${
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
                    {activeTab === 'PATIENT' ? 'Sign In to Patient Portal' : 'Sign In as Staff / Doctor'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>256-Bit Encrypted Healthcare Session • Trichy Outpatient Network</span>
        </div>
      </div>
    </div>
  );
};
