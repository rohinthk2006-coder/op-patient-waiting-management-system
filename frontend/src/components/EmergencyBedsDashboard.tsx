import React, { useEffect, useState } from 'react';
import { Bed, ShieldAlert, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import type { BedStatus } from '../services/api';
import { fetchEmergencyBeds } from '../services/api';

export const EmergencyBedsDashboard: React.FC = () => {
  const [beds, setBeds] = useState<BedStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBeds = async () => {
    try {
      setLoading(true);
      const data = await fetchEmergencyBeds();
      setBeds(data);
    } catch (err) {
      console.error('Error loading beds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeds();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-5 px-3 sm:px-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Emergency Bed Availability Tracker</h2>
            <p className="text-xs text-slate-500">Live ICU, Trauma, Oxygen & Ward Availability for Emergency Triage</p>
          </div>
        </div>

        <button
          onClick={loadBeds}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          Refresh Beds
        </button>
      </div>

      {/* Bed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-5">
        {beds.map((bed) => {
          const isCritical = bed.status === 'CRITICAL';
          const isLow = bed.status === 'LOW';

          return (
            <div
              key={bed.id}
              className={`p-4 rounded-xl border transition shadow-xs ${
                isCritical
                  ? 'bg-rose-50/40 border-rose-300'
                  : isLow
                  ? 'bg-amber-50/40 border-amber-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {bed.hospital_name}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {bed.category.replace('_', ' ')}
                  </h3>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    isCritical
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : isLow
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isCritical ? (
                    <ShieldAlert className="w-3 h-3" />
                  ) : isLow ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  {bed.status}
                </span>
              </div>

              {/* Numbers Display */}
              <div className="flex items-end justify-between py-1 mb-2.5">
                <div>
                  <span className="text-2xl font-bold text-slate-900">{bed.available_beds}</span>
                  <span className="text-xs text-slate-500 ml-1 font-medium">Beds Free</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-700">
                    {bed.occupied_beds} / {bed.total_beds}
                  </span>
                  <div className="text-[10px] text-slate-400">Occupied</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${bed.occupancy_rate}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Occupancy: {bed.occupancy_rate}%</span>
                <span>Verified Live</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
