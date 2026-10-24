import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Crosshair,
  Compass,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  LocateFixed,
  Move,
  Activity,
  Bell,
  Volume2,
  ArrowRight,
} from 'lucide-react';
import type { Hospital, TrafficEstimateResponse, QueueSession, Booking } from '../services/api';
import { updateDoctorDelay } from '../services/api';

interface HospitalLiveLocationMapProps {
  hospitals: Hospital[];
  selectedHospitalId: string;
  onSelectHospital: (hospitalId: string) => void;
  patientCoords: { lat: number; lng: number };
  patientLocality: string;
  travelMode: 'BIKE' | 'CAR' | 'AUTO' | 'BUS';
  trafficData: TrafficEstimateResponse | null;
  targetOpTime?: string; // e.g. "10:00 AM"
  doctorName?: string;
  opdRoom?: string;
  onDetectGps: () => void;
  detectingGps: boolean;
  session?: QueueSession | null;
  activeBooking?: Booking | null;
  doctorDelayInfo?: { delay_minutes: number; delay_reason?: string } | null;
  onOpenNotifications?: () => void;
  notificationCount?: number;
  onRefreshSession?: () => void;
}

export const HospitalLiveLocationMap: React.FC<HospitalLiveLocationMapProps> = ({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  patientCoords,
  patientLocality,
  travelMode,
  trafficData,
  targetOpTime = '10:00 AM',
  doctorName = 'Dr. R. Anand',
  opdRoom = 'OPD Room 102',
  onDetectGps,
  detectingGps,
  session,
  activeBooking,
  doctorDelayInfo,
  onOpenNotifications,
  notificationCount = 0,
  onRefreshSession,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const hasFittedInitialBounds = useRef<boolean>(false);
  const prevSelectedHospRef = useRef<string>(selectedHospitalId);

  // Delay & Notification state
  const [activeDelayMin, setActiveDelayMin] = useState<number>(doctorDelayInfo?.delay_minutes ?? 0);
  const [delayReason, setDelayReason] = useState<string>(
    doctorDelayInfo?.delay_reason || 'Emergency ICU Ward Rounds'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpdatingDelay, setIsUpdatingDelay] = useState<boolean>(false);

  // Sync if prop doctorDelayInfo changes
  useEffect(() => {
    if (doctorDelayInfo && doctorDelayInfo.delay_minutes !== undefined) {
      setActiveDelayMin(doctorDelayInfo.delay_minutes);
      if (doctorDelayInfo.delay_reason) {
        setDelayReason(doctorDelayInfo.delay_reason);
      }
    }
  }, [doctorDelayInfo]);

  // Buffer state (default 15 minutes for hospital entry, parking, desk check-in)
  const [hospitalBufferMin] = useState<number>(15);
  const [opTime, setOpTime] = useState<string>(targetOpTime);

  const selectedHospital =
    hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Helper to parse time strings into minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    try {
      const clean = timeStr.trim().toUpperCase();
      const isPM = clean.includes('PM');
      const isAM = clean.includes('AM');
      const parts = clean.replace(/(AM|PM)/g, '').trim().split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1] || '0', 10);

      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      return hours * 60 + minutes;
    } catch {
      return 10 * 60; // 10:00 AM default
    }
  };

  const formatMinutesToTimeStr = (totalMinutes: number): string => {
    let normalized = totalMinutes % (24 * 60);
    if (normalized < 0) normalized += 24 * 60;
    const hours24 = Math.floor(normalized / 60);
    const mins = normalized % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  // Calculations for Vacate Time & Comparison with OP Time, taking active Doctor Delay into account
  const baseOpMinutes = parseTimeToMinutes(opTime);
  const adjustedOpMinutes = baseOpMinutes + activeDelayMin;
  const adjustedOpTimeStr = formatMinutesToTimeStr(adjustedOpMinutes);

  const travelDurationMin = trafficData?.estimated_travel_min || 25;
  const trafficDelayMin = trafficData?.traffic_delay_min || 0;

  // Vacate departure is adjusted with doctor delay so patients depart later and avoid waiting hall crowd
  const vacateMinutes = adjustedOpMinutes - (travelDurationMin + hospitalBufferMin);
  const vacateTimeStr = formatMinutesToTimeStr(vacateMinutes);
  const hospitalArrivalTimeStr = formatMinutesToTimeStr(vacateMinutes + travelDurationMin);

  // Compare with current local time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const minutesUntilVacate = vacateMinutes - currentMinutes;

  let vacateUrgency: 'SAFE' | 'PREPARE' | 'URGENT' | 'OVERDUE' = 'SAFE';
  if (minutesUntilVacate < -5) {
    vacateUrgency = 'OVERDUE';
  } else if (minutesUntilVacate <= 15) {
    vacateUrgency = 'URGENT';
  } else if (minutesUntilVacate <= 40) {
    vacateUrgency = 'PREPARE';
  }

  // Live OP Queue Tracking Variables
  const servingTokenNumber = session?.current_serving_token || 101;
  const myTokenNumber = activeBooking?.token_number || 104;
  const patientsAhead = Math.max(0, myTokenNumber - servingTokenNumber);
  const queueWaitMinutes = patientsAhead * 6 + activeDelayMin;
  const isServingMe = servingTokenNumber === myTokenNumber;

  const handleBroadcastDelay = async (delayMin: number, reason: string) => {
    try {
      setIsUpdatingDelay(true);
      setActiveDelayMin(delayMin);
      setDelayReason(reason);

      // Call backend API to update delay & broadcast to notification service
      await updateDoctorDelay('sch-card-morning', delayMin, reason);

      const msg =
        delayMin > 0
          ? `🔔 Notification Dispatched: +${delayMin}m Doctor Delay alert sent to SMS & Notifications!`
          : `✅ Notification Dispatched: Doctor schedule marked back on time (0m delay).`;

      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 5000);

      if (onRefreshSession) {
        onRefreshSession();
      }
    } catch (err) {
      console.warn('Error broadcasting doctor delay:', err);
      // Still update UI locally for instant responsive feedback
      setToastMessage(`🔔 Notification Alert: +${delayMin}m delay updated locally.`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsUpdatingDelay(false);
    }
  };

  // Initialize and update the Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [patientCoords.lat, patientCoords.lng],
        zoom: 12.5,
        zoomControl: false,
        // Smooth zoom & physics configuration
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120,
        wheelDebounceTime: 40,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        dragging: true,
        boxZoom: true,
        keyboard: true,
        keyboardPanDelta: 80,
      });

      // Explicitly enable drag, touch, and scroll interactions
      map.dragging?.enable();
      if (map.touchZoom) map.touchZoom.enable();
      if (map.doubleClickZoom) map.doubleClickZoom.enable();
      if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
      if (map.boxZoom) map.boxZoom.enable();
      if (map.keyboard) map.keyboard.enable();

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Custom zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Invalidate container size after mount & on container resizes
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        const resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize({ animate: false });
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ animate: false });
        }
      }, 150);
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Patient Live Marker
    const patientHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-cyan-500/30 animate-ping absolute"></div>
        <div class="w-7 h-7 rounded-full bg-cyan-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold relative z-10">
          📍
        </div>
      </div>
    `;
    const patientIcon = L.divIcon({
      html: patientHtml,
      className: 'patient-live-div-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const patientMarker = L.marker([patientCoords.lat, patientCoords.lng], {
      icon: patientIcon,
      zIndexOffset: 1000,
    }).addTo(layerGroup);

    patientMarker.bindPopup(`
      <div class="font-sans text-xs p-1">
        <strong class="text-cyan-800 text-sm block">Your Live Location</strong>
        <span class="text-slate-600">${patientLocality} (Trichy)</span>
        <div class="mt-1 text-[10px] text-slate-500 font-mono">${patientCoords.lat.toFixed(4)}° N, ${patientCoords.lng.toFixed(4)}° E</div>
      </div>
    `);

    // 2. All Hospitals Markers
    const boundsPoints: [number, number][] = [[patientCoords.lat, patientCoords.lng]];

    hospitals.forEach((hosp) => {
      const isSelected = hosp.id === selectedHospitalId;
      const hospLat = hosp.latitude || 10.8125;
      const hospLng = hosp.longitude || 78.6856;
      boundsPoints.push([hospLat, hospLng]);

      const hospMarkerHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group">
          <div class="px-1.5 py-0.5 rounded shadow text-[9px] font-bold whitespace-nowrap mb-0.5 transition-all ${
            isSelected
              ? 'bg-emerald-600 text-white scale-110 shadow-md ring-2 ring-emerald-300'
              : 'bg-white text-slate-800 border border-slate-300 group-hover:bg-slate-100'
          }">
            ${hosp.name.split(' ')[0]}
          </div>
          <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-md text-white text-[11px] font-bold transition-transform ${
            isSelected
              ? 'bg-emerald-600 ring-4 ring-emerald-400/40 scale-125'
              : 'bg-rose-600 border-2 border-white group-hover:scale-110'
          }">
            🏥
          </div>
        </div>
      `;

      const hospIcon = L.divIcon({
        html: hospMarkerHtml,
        className: 'hospital-div-icon',
        iconSize: [60, 40],
        iconAnchor: [30, 36],
      });

      const marker = L.marker([hospLat, hospLng], {
        icon: hospIcon,
        zIndexOffset: isSelected ? 900 : 500,
      }).addTo(layerGroup);

      marker.on('click', () => {
        onSelectHospital(hosp.id);
      });

      marker.bindPopup(`
        <div class="font-sans text-xs p-1 max-w-[220px]">
          <span class="text-[9px] uppercase tracking-wider font-bold text-teal-700">${hosp.area || 'Trichy'}</span>
          <h4 class="font-bold text-slate-900 text-sm leading-tight mt-0.5">${hosp.name}</h4>
          <p class="text-[11px] text-slate-500 mt-1">${hosp.address}</p>
          <div class="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
            <span class="text-[10px] text-slate-500">Emergency: <strong>${hosp.emergency_contact}</strong></span>
            <button class="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-semibold">
              ${isSelected ? 'Selected' : 'Select Hospital'}
            </button>
          </div>
        </div>
      `);
    });

    // 3. Connect Live Route Polyline between Patient and Selected Hospital
    if (selectedHospital && selectedHospital.latitude && selectedHospital.longitude) {
      const trafficColor =
        trafficData?.traffic_level === 'HEAVY'
          ? '#ef4444' // Red for heavy traffic
          : trafficData?.traffic_level === 'MODERATE'
          ? '#f59e0b' // Amber for moderate
          : '#10b981'; // Green for smooth

      const routePoints: [number, number][] = [
        [patientCoords.lat, patientCoords.lng],
        // Create an intermediate point to simulate realistic Trichy road curvature
        [
          (patientCoords.lat + selectedHospital.latitude) / 2 + 0.003,
          (patientCoords.lng + selectedHospital.longitude) / 2 - 0.002,
        ],
        [selectedHospital.latitude, selectedHospital.longitude],
      ];

      // Route glow line (interactive: false so clicks & drags pass through to map)
      L.polyline(routePoints, {
        color: trafficColor,
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(layerGroup);

      // Route dashed overlay
      L.polyline(routePoints, {
        color: '#ffffff',
        weight: 2,
        dashArray: '6, 8',
        opacity: 0.9,
        interactive: false,
      }).addTo(layerGroup);
    }

    // Fit map bounds only ONCE initially to avoid resetting user's manual pan/scroll position
    if (!hasFittedInitialBounds.current && boundsPoints.length > 1) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [35, 35],
        maxZoom: 14,
      });
      hasFittedInitialBounds.current = true;
    }
  }, [patientCoords, hospitals, selectedHospitalId, trafficData, patientLocality]);

  // Pan smoothly to selected hospital if user changes hospital after initial load
  useEffect(() => {
    if (
      hasFittedInitialBounds.current &&
      mapInstanceRef.current &&
      selectedHospitalId !== prevSelectedHospRef.current &&
      selectedHospital?.latitude &&
      selectedHospital?.longitude
    ) {
      prevSelectedHospRef.current = selectedHospitalId;
      mapInstanceRef.current.panTo([selectedHospital.latitude, selectedHospital.longitude], {
        animate: true,
        duration: 0.6,
      });
    }
  }, [selectedHospitalId, selectedHospital]);

  // Pan controls
  const handlePan = (dx: number, dy: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panBy([dx, dy], { animate: true, duration: 0.3 });
    }
  };

  const handlePanLeft = () => handlePan(-220, 0);
  const handlePanRight = () => handlePan(220, 0);
  const handlePanUp = () => handlePan(0, -180);
  const handlePanDown = () => handlePan(0, 180);

  // Recenter patient
  const handleRecenterPatient = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([patientCoords.lat, patientCoords.lng], 14, { animate: true });
    }
  };

  // Fit all hospitals
  const handleFitAllHospitals = () => {
    if (mapInstanceRef.current && hospitals.length > 0) {
      const pts: [number, number][] = [
        [patientCoords.lat, patientCoords.lng],
        ...hospitals.map((h): [number, number] => [h.latitude || 10.81, h.longitude || 78.68]),
      ];
      mapInstanceRef.current.fitBounds(L.latLngBounds(pts), { padding: [35, 35], maxZoom: 14 });
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn(0.5);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut(0.5);
    }
  };

  return (
    <div className="rounded-2xl bg-white/92 backdrop-blur-md border border-white/60 overflow-hidden shadow-md font-sans transition-all">
      {/* Header Bar */}
      <div className="p-3.5 bg-white/75 backdrop-blur-md border-b border-white/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>Live GPS & Trichy Hospitals Map</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h3>
            <p className="text-[10px] text-slate-500">
              Live location: <strong className="text-slate-800">{patientLocality}</strong> • Showing {hospitals.length} hospitals & route
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
          {/* Quick Pan Left & Right buttons in header */}
          <div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={handlePanLeft}
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 hover:bg-white hover:text-teal-800 transition flex items-center gap-0.5"
              title="Pan Map Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Pan Left</span>
            </button>
            <div className="w-px h-3.5 bg-slate-300 mx-0.5" />
            <button
              type="button"
              onClick={handlePanRight}
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 hover:bg-white hover:text-teal-800 transition flex items-center gap-0.5"
              title="Pan Map Right"
            >
              <span>Pan Right</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onDetectGps}
            disabled={detectingGps}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-teal-800 text-[11px] font-semibold flex items-center gap-1 shadow-xs transition"
          >
            <Crosshair className={`w-3.5 h-3.5 text-teal-600 ${detectingGps ? 'animate-spin' : ''}`} />
            <span>{detectingGps ? 'Locating...' : 'Refresh GPS'}</span>
          </button>
          <button
            type="button"
            onClick={handleFitAllHospitals}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-medium flex items-center gap-1 shadow-xs transition"
            title="View All Hospitals in Trichy"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>All Hospitals</span>
          </button>
          <button
            type="button"
            onClick={handleRecenterPatient}
            className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 text-[11px] font-medium flex items-center gap-1 shadow-xs transition"
            title="Recenter on My Live Location"
          >
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>My Spot</span>
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-[320px] sm:h-[360px] bg-slate-100 border-b border-slate-200">
        <div
          ref={mapContainerRef}
          className="w-full h-full z-0 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
        />

        {/* Floating Map Legend */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-2 text-[10px] text-slate-700">
          <span className="flex items-center gap-1 font-semibold text-cyan-800">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse inline-block" /> You
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Selected Hospital
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-rose-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Other Hospitals
          </span>
        </div>

        {/* Floating Gesture & Directional Guidance Hint */}
        <div className="absolute top-10 left-2.5 z-10 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-medium text-white shadow-xs pointer-events-none flex items-center gap-1.5">
          <Move className="w-3 h-3 text-cyan-300 shrink-0" />
          <span>Drag to Pan • Arrow Keys to Move • Use D-Pad Controls</span>
        </div>

        {/* Floating Dedicated Navigation Hub (4-Way Pan Cross + Zoom) */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-center bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-lg gap-1">
          {/* 4-Way Directional Pan Pad */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={handlePanUp}
              className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-teal-700 transition active:scale-95"
              title="Pan Map Up (▲)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePanLeft}
                className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-teal-700 transition active:scale-95"
                title="Pan Map Left (◀)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRecenterPatient}
                className="w-6 h-6 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 flex items-center justify-center transition active:scale-95"
                title="Recenter to My Live Location"
              >
                <LocateFixed className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handlePanRight}
                className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-teal-700 transition active:scale-95"
                title="Pan Map Right (▶)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handlePanDown}
              className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-teal-700 transition active:scale-95"
              title="Pan Map Down (▼)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full h-px bg-slate-200" />

          {/* Smooth Zoom Controls */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-sm transition active:scale-95"
              title="Smooth Zoom In (+)"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-sm transition active:scale-95"
              title="Smooth Zoom Out (−)"
            >
              −
            </button>
          </div>
        </div>

        {/* Floating Quick Hospital Switcher Chips */}
        <div className="absolute bottom-2 left-2 right-12 z-10 overflow-x-auto flex items-center gap-1.5 py-1 px-1.5 bg-white/92 backdrop-blur-md rounded-xl border border-slate-200 shadow-md">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1 shrink-0 flex items-center gap-1">
            <span>Jump to:</span>
          </span>
          {hospitals.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                onSelectHospital(h.id);
                if (mapInstanceRef.current && h.latitude && h.longitude) {
                  mapInstanceRef.current.panTo([h.latitude, h.longitude], { animate: true, duration: 0.6 });
                }
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                h.id === selectedHospitalId
                  ? 'bg-teal-700 text-white shadow-xs ring-1 ring-teal-400'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {h.name.split(' ')[0]} ({h.area || 'Trichy'})
            </button>
          ))}
        </div>
      </div>

      {/* TIMING, LIVE QUEUE TRACKING & DOCTOR DELAY ENGINE (CORE REQUIREMENT) */}
      <div className="p-4 bg-slate-50/50">
        {/* 1. DOCTOR DELAY ALERT & IN-APP NOTIFICATION DISPATCHER */}
        <div className="mb-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-white border border-amber-300 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    ⚠️ Doctor OPD Delay Notification
                  </span>
                  {activeDelayMin > 0 ? (
                    <span className="text-[10px] font-extrabold text-amber-700 font-mono animate-pulse">
                      +{activeDelayMin} MIN DELAY ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700">ON SCHEDULE</span>
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
                  {doctorName} is running {activeDelayMin > 0 ? `${activeDelayMin} mins behind schedule` : 'on schedule'} ({delayReason}).
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {activeDelayMin > 0 ? (
                    <>
                      Consultation shifted to <strong className="text-slate-800">{adjustedOpTimeStr}</strong>. Your revised departure is <strong className="text-slate-800">{vacateTimeStr}</strong> (enjoy {activeDelayMin} extra minutes before leaving).
                    </>
                  ) : (
                    'Consultation is proceeding exactly as booked. No delays reported.'
                  )}
                </p>
              </div>
            </div>

            {/* Quick Delay Presets & View Notification Button */}
            <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
              <div className="flex items-center gap-1 bg-white/95 p-1 rounded-xl border border-amber-200 shadow-xs">
                <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Broadcast Delay:</span>
                {[
                  { min: 0, label: '0m (On Time)', reason: 'On Schedule' },
                  { min: 15, label: '+15m', reason: 'Ward Rounds' },
                  { min: 20, label: '+20m', reason: 'Emergency ICU Ward Rounds' },
                  { min: 35, label: '+35m', reason: 'Emergency Trauma Surgery' },
                ].map(({ min, label, reason }) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => handleBroadcastDelay(min, reason)}
                    disabled={isUpdatingDelay}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      activeDelayMin === min
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition"
                  title="View Live Dispatched Alerts"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>View in Notifications ({notificationCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Toast Notification Alert for Broadcasted Delay */}
          {toastMessage && (
            <div className="mt-2.5 p-2 rounded-xl bg-amber-700 text-white text-xs font-semibold flex items-center justify-between shadow-md">
              <span className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-200 animate-bounce" />
                <span>{toastMessage}</span>
              </span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-[10px] bg-amber-800 hover:bg-amber-900 px-1.5 py-0.5 rounded text-amber-100"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* 2. LIVE OP QUEUE TRACKING */}
        <div className="mb-3.5 p-3.5 rounded-2xl bg-white border border-teal-200 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span>Live OP Queue Tracking • {opdRoom}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-300">
                    ROOM LIVE
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500">
                  Real-time synchronization with {doctorName} • Bi-directional WebSocket stream
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Zero-Refresh Sync
              </span>
              <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-teal-600" />
                <span>Chimes when 2 tokens ahead</span>
              </span>
            </div>
          </div>

          {/* 4 Live Queue Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 block">
                Serving Now
              </span>
              <div className="text-xl font-black text-emerald-900 tabular-nums flex items-baseline gap-1 mt-0.5">
                <span>#{servingTokenNumber}</span>
                <span className="text-[10px] font-medium text-emerald-700">Room 102</span>
              </div>
              <span className="text-[9px] text-emerald-700 block mt-0.5 font-medium">In Consultation (~4m)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-50/80 border border-cyan-200">
              <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-800 block">
                Your OP Token
              </span>
              <div className="text-xl font-black text-cyan-900 tabular-nums flex items-baseline gap-1 mt-0.5">
                <span>#{myTokenNumber}</span>
                <span className="text-[10px] font-bold text-cyan-700">
                  {isServingMe ? 'YOUR TURN!' : `${patientsAhead} ahead`}
                </span>
              </div>
              <span className="text-[9px] text-cyan-700 block mt-0.5 font-medium">
                {isServingMe ? 'Proceed to Room' : 'Depart by Vacate Time'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 block">
                Estimated Wait
              </span>
              <div className="text-xl font-black text-amber-900 tabular-nums flex items-baseline gap-1 mt-0.5">
                <span>~{queueWaitMinutes}m</span>
                {activeDelayMin > 0 && (
                  <span className="text-[10px] font-bold text-amber-700">+{activeDelayMin}m delay</span>
                )}
              </div>
              <span className="text-[9px] text-amber-700 block mt-0.5 font-medium">
                Pace: ~6 min/patient
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200">
              <span className="text-[9px] font-bold uppercase tracking-wider text-teal-800 block">
                Queue Velocity
              </span>
              <div className="text-xl font-black text-teal-900 tabular-nums flex items-baseline gap-1 mt-0.5">
                <span>100%</span>
                <span className="text-[10px] font-medium text-teal-700">Optimal</span>
              </div>
              <span className="text-[9px] text-teal-700 block mt-0.5 font-medium">
                0 skipped • Auto-Expiry Guard
              </span>
            </div>
          </div>

          {/* Visual Queue Flow Sequence */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Live Queue Flow Sequence:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {[
                { token: servingTokenNumber, status: 'In Consultation', isDoctor: true, isMe: false },
                { token: servingTokenNumber + 1, status: 'Waiting Hall', isDoctor: false, isMe: false },
                { token: servingTokenNumber + 2, status: 'Checked In', isDoctor: false, isMe: false },
                { token: myTokenNumber, status: 'Your Turn (En Route)', isDoctor: false, isMe: true },
                { token: myTokenNumber + 1, status: 'Upcoming Booking', isDoctor: false, isMe: false },
              ].map((item, idx) => (
                <React.Fragment key={item.token}>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-center shrink-0 border transition-all ${
                      item.isDoctor
                        ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300 shadow-xs'
                        : item.isMe
                        ? 'bg-cyan-600 text-white border-cyan-700 ring-2 ring-cyan-300 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="text-xs font-black tabular-nums">#{item.token}</div>
                    <div className="text-[9px] opacity-90 font-medium whitespace-nowrap">{item.status}</div>
                  </div>
                  {idx < 4 && <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* 3. OP Consultation Time vs Vacate Time Main Comparison Banner */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            vacateUrgency === 'OVERDUE'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : vacateUrgency === 'URGENT'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-teal-50/80 border-teal-200 text-teal-950'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  vacateUrgency === 'OVERDUE'
                    ? 'bg-rose-200 text-rose-900'
                    : vacateUrgency === 'URGENT'
                    ? 'bg-amber-200 text-amber-900 animate-pulse'
                    : 'bg-teal-200 text-teal-900'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 inline-block mb-1">
                  ⏱️ Vacate Timing vs OP Consultation Schedule
                </span>
                <h4 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Vacate Location By: <span className="underline decoration-2">{vacateTimeStr}</span>
                </h4>
                <p className="text-xs opacity-90 mt-0.5">
                  Based on <strong>{trafficData?.distance_km || 7.5} km</strong> distance with{' '}
                  <span className="font-semibold uppercase">{trafficData?.traffic_level || 'MODERATE'} traffic</span> (+{trafficDelayMin}m transit delay)
                  {activeDelayMin > 0 && (
                    <span className="font-bold text-amber-800 ml-1">
                      • Adjusted for +{activeDelayMin}m Doctor Delay
                    </span>
                  )}
                  .
                </p>
              </div>
            </div>

            {/* Dynamic Status / Departure Countdown */}
            <div className="flex flex-col items-end shrink-0 w-full md:w-auto">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
                  vacateUrgency === 'OVERDUE'
                    ? 'bg-rose-600 text-white animate-bounce'
                    : vacateUrgency === 'URGENT'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {vacateUrgency === 'OVERDUE' ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Vacate Immediately! Overdue</span>
                  </>
                ) : vacateUrgency === 'URGENT' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Depart in ~{minutesUntilVacate} mins</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>On Schedule: {minutesUntilVacate > 0 ? `~${minutesUntilVacate}m to depart` : 'Leave soon'}</span>
                  </>
                )}
              </span>

              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-600">
                <span>OP Appointment Time:</span>
                <select
                  value={opTime}
                  onChange={(e) => setOpTime(e.target.value)}
                  className="px-2 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                </select>
                {activeDelayMin > 0 && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    ➔ Shifts to {adjustedOpTimeStr}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Step-by-Step Chronological Journey Timeline (OP Comparison Breakdown) */}
        <div className="mt-3.5 pt-3 border-t border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Chronological Journey & OP Turn Breakdown:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {/* Step 1: Vacate Location */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-left shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-[10px] font-bold text-cyan-700 font-mono">VACATE</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                {vacateTimeStr}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Depart from <strong>{patientLocality}</strong>
              </p>
            </div>

            {/* Step 2: Live Transit */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-left shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-[10px] font-bold text-amber-700 font-mono">TRANSIT</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                ~{travelDurationMin} mins
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Via {travelMode.toLowerCase()} ({trafficData?.traffic_level || 'LIVE'} +{trafficDelayMin}m)
              </p>
            </div>

            {/* Step 3: Hospital Arrival & Buffer */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-left shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-[10px] font-bold text-teal-700 font-mono">OPD ENTRY</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                {hospitalArrivalTimeStr}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Arrival + 15m check-in buffer
              </p>
            </div>

            {/* Step 4: OP Consultation Turn */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-300 text-left shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  4
                </span>
                <span className="text-[10px] font-bold text-emerald-800 font-mono">OP TURN</span>
              </div>
              <div className="text-sm font-extrabold text-emerald-950 tabular-nums">
                {adjustedOpTimeStr}
              </div>
              <p className="text-[10px] text-emerald-800 mt-0.5 leading-snug font-medium">
                {doctorName} • {selectedHospital.name.split(' ')[0]} ({opdRoom})
                {activeDelayMin > 0 && <span className="block text-amber-800 font-bold">(+{activeDelayMin}m delay)</span>}
              </p>
            </div>
          </div>

          {/* Route Road Details Bar */}
          <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Route: <strong>{trafficData?.route_summary || 'Main Arterial Corridor'}</strong></span>
            </div>
            <div className="text-[10px] text-slate-400">
              Safe departure ensures zero missed tokens or auto-expiration penalty
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
