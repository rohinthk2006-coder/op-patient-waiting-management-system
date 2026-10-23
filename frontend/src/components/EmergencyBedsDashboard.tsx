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
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Emergency Bed Availability Tracker</h2>
            <p className="text-sm text-slate-400">Live ICU, Trauma, Oxygen & Ward Availability for Emergency Triage</p>
          </div>
        </div>

        <button
          onClick={loadBeds}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-sm font-semibold transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Beds
        </button>
      </div>

      {/* Bed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
        {beds.map((bed) => {
          const isCritical = bed.status === 'CRITICAL';
          const isLow = bed.status === 'LOW';

          return (
            <div
              key={bed.id}
              className={`p-6 rounded-2xl border transition-all duration-300 shadow-xl ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-rose-950/30'
                  : isLow
                  ? 'bg-amber-950/20 border-amber-500/30 shadow-amber-950/20'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {bed.hospital_name}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {bed.category.replace('_', ' ')}
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                      : isLow
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isCritical ? (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  ) : isLow ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  {bed.status}
                </span>
              </div>

              {/* Numbers Display */}
              <div className="flex items-end justify-between py-2 mb-4">
                <div>
                  <span className="text-4xl font-extrabold text-white">{bed.available_beds}</span>
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">Beds Free</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-300">
                    {bed.occupied_beds} / {bed.total_beds}
                  </span>
                  <div className="text-[11px] text-slate-500">Occupied</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${bed.occupancy_rate}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
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
