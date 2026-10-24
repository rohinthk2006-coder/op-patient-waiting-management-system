import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HospitalLiveLocationMap } from '../components/HospitalLiveLocationMap';
import type { Hospital, TrafficEstimate } from '../services/api';

// Mock ResizeObserver for jsdom
global.ResizeObserver = class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
} as any;

// Mock Leaflet since jsdom does not implement full SVG/Canvas layout engine
vi.mock('leaflet', () => {
  const mockMap = {
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn().mockReturnThis(),
    zoomIn: vi.fn().mockReturnThis(),
    zoomOut: vi.fn().mockReturnThis(),
    panBy: vi.fn().mockReturnThis(),
    panTo: vi.fn().mockReturnThis(),
    dragging: { enable: vi.fn(), disable: vi.fn() },
    touchZoom: { enable: vi.fn(), disable: vi.fn() },
    doubleClickZoom: { enable: vi.fn(), disable: vi.fn() },
    scrollWheelZoom: { enable: vi.fn(), disable: vi.fn() },
    boxZoom: { enable: vi.fn(), disable: vi.fn() },
    keyboard: { enable: vi.fn(), disable: vi.fn() },
  };

  const mockLayerGroup = {
    clearLayers: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  };

  const mockMarker = {
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    openPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  };

  const mockPolyline = {
    addTo: vi.fn().mockReturnThis(),
  };

  const mockControl = {
    zoom: vi.fn(() => ({ addTo: vi.fn() })),
  };

  return {
    default: {
      map: vi.fn(() => mockMap),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      layerGroup: vi.fn(() => mockLayerGroup),
      divIcon: vi.fn(() => ({})),
      marker: vi.fn(() => mockMarker),
      polyline: vi.fn(() => mockPolyline),
      latLngBounds: vi.fn(() => ({})),
      control: mockControl,
    },
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => mockLayerGroup),
    divIcon: vi.fn(() => ({})),
    marker: vi.fn(() => mockMarker),
    polyline: vi.fn(() => mockPolyline),
    latLngBounds: vi.fn(() => ({})),
    control: mockControl,
  };
});

describe('HospitalLiveLocationMap Component', () => {
  const mockHospitals: Hospital[] = [
    {
      id: 'hosp-01',
      name: 'Apollo Speciality OPD',
      address: 'Old Palpannai, Chennai Bypass',
      city: 'Tiruchirappalli',
      area: 'Old Palpannai',
      latitude: 10.8123,
      longitude: 78.6945,
      emergency_contact: '1066',
      departments: [],
    },
    {
      id: 'hosp-02',
      name: 'Kauvery Hospital Cantonment',
      address: 'Royal Road, Cantonment',
      city: 'Tiruchirappalli',
      area: 'Cantonment',
      latitude: 10.7989,
      longitude: 78.6854,
      emergency_contact: '0431-4000100',
      departments: [],
    },
  ];

  const mockTraffic: TrafficEstimate = {
    source_locality: 'Thillai Nagar (Trichy)',
    hospital_name: 'Apollo Speciality OPD',
    distance_km: 7.8,
    travel_mode: 'BIKE',
    estimated_travel_min: 30,
    traffic_level: 'HEAVY',
    traffic_delay_min: 15,
    recommended_departure_time: '08:45 AM',
    suggested_route: 'Via Thanjavur Main Road',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders live GPS map header and patient locality', () => {
    render(
      <HospitalLiveLocationMap
        hospitals={mockHospitals}
        selectedHospitalId="hosp-01"
        onSelectHospital={vi.fn()}
        patientCoords={{ lat: 10.828, lng: 78.687 }}
        patientLocality="Thillai Nagar (Trichy)"
        travelMode="BIKE"
        trafficData={mockTraffic}
        targetOpTime="10:00 AM"
        doctorName="Dr. R. Anand"
        opdRoom="OPD Room 102"
        onDetectGps={vi.fn()}
        detectingGps={false}
      />
    );

    expect(screen.getByText(/Live GPS & Trichy Hospitals Map/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Thillai Nagar/i).length).toBeGreaterThanOrEqual(1);
  });

  it('calculates exact vacate timing by subtracting travel duration and 15m buffer from OP time', () => {
    // OP time: 10:00 AM (600 mins from midnight)
    // Travel duration: 30 mins
    // Hospital Buffer: 15 mins
    // Expected Vacate: 600 - (30 + 15) = 555 mins -> 09:15 AM
    render(
      <HospitalLiveLocationMap
        hospitals={mockHospitals}
        selectedHospitalId="hosp-01"
        onSelectHospital={vi.fn()}
        patientCoords={{ lat: 10.828, lng: 78.687 }}
        patientLocality="Thillai Nagar (Trichy)"
        travelMode="BIKE"
        trafficData={mockTraffic}
        targetOpTime="10:00 AM"
        doctorName="Dr. R. Anand"
        opdRoom="OPD Room 102"
        onDetectGps={vi.fn()}
        detectingGps={false}
      />
    );

    // Verify vacate time calculation is rendered
    expect(screen.getByText(/Vacate Location By:/i)).toBeInTheDocument();
    expect(screen.getAllByText('09:15 AM').length).toBeGreaterThanOrEqual(1);

    // Verify distance and traffic delay are shown
    expect(screen.getByText(/7.8 km/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\+15m/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders step-by-step 4-phase chronological OP journey breakdown', () => {
    render(
      <HospitalLiveLocationMap
        hospitals={mockHospitals}
        selectedHospitalId="hosp-01"
        onSelectHospital={vi.fn()}
        patientCoords={{ lat: 10.828, lng: 78.687 }}
        patientLocality="Thillai Nagar (Trichy)"
        travelMode="BIKE"
        trafficData={mockTraffic}
        targetOpTime="10:00 AM"
        doctorName="Dr. R. Anand"
        opdRoom="OPD Room 102"
        onDetectGps={vi.fn()}
        detectingGps={false}
      />
    );

    expect(screen.getByText('VACATE')).toBeInTheDocument();
    expect(screen.getByText('TRANSIT')).toBeInTheDocument();
    expect(screen.getByText('OPD ENTRY')).toBeInTheDocument();
    expect(screen.getByText('OP TURN')).toBeInTheDocument();
    expect(screen.getAllByText(/OPD Room 102/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders pan controls and directional navigation controls for moving the map', () => {
    render(
      <HospitalLiveLocationMap
        hospitals={mockHospitals}
        selectedHospitalId="hosp-01"
        onSelectHospital={vi.fn()}
        patientCoords={{ lat: 10.828, lng: 78.687 }}
        patientLocality="Thillai Nagar (Trichy)"
        travelMode="BIKE"
        trafficData={mockTraffic}
        targetOpTime="10:00 AM"
        doctorName="Dr. R. Anand"
        opdRoom="OPD Room 102"
        onDetectGps={vi.fn()}
        detectingGps={false}
      />
    );

    // Verify pan controls in header and D-pad
    expect(screen.getAllByTitle(/Pan Map Left/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTitle(/Pan Map Right/i).length).toBeGreaterThanOrEqual(1);

    // Verify D-pad pan controls
    expect(screen.getByTitle(/Pan Map Up/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Pan Map Down/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Smooth Zoom In/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Smooth Zoom Out/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Recenter on My Live Location/i)).toBeInTheDocument();
  });

  it('renders live OP queue tracking with currently serving token, flow sequence, and room status', () => {
    render(
      <HospitalLiveLocationMap
        hospitals={mockHospitals}
        selectedHospitalId="hosp-01"
        onSelectHospital={vi.fn()}
        patientCoords={{ lat: 10.828, lng: 78.687 }}
        patientLocality="Thillai Nagar (Trichy)"
        travelMode="BIKE"
        trafficData={mockTraffic}
        targetOpTime="10:00 AM"
        doctorName="Dr. R. Anand"
        opdRoom="OPD Room 102"
        onDetectGps={vi.fn()}
        detectingGps={false}
      />
    );

    expect(screen.getByText(/Live OP Queue Tracking • OPD Room 102/i)).toBeInTheDocument();
    expect(screen.getByText(/Serving Now/i)).toBeInTheDocument();
    expect(screen.getByText(/Your OP Token/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Queue Flow Sequence:/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero-Refresh Sync/i)).toBeInTheDocument();
  });

  it('renders doctor delay notification banner and recalibrates OP turn with delay', () => {
    render(
      <HospitalLiveLocationMap
        hospitals={mockHospitals}
        selectedHospitalId="hosp-01"
        onSelectHospital={vi.fn()}
        patientCoords={{ lat: 10.828, lng: 78.687 }}
        patientLocality="Thillai Nagar (Trichy)"
        travelMode="BIKE"
        trafficData={mockTraffic}
        targetOpTime="10:00 AM"
        doctorName="Dr. R. Anand"
        opdRoom="OPD Room 102"
        onDetectGps={vi.fn()}
        detectingGps={false}
        doctorDelayInfo={{ delay_minutes: 20, delay_reason: 'Emergency ICU Ward Rounds' }}
        notificationCount={2}
        onOpenNotifications={vi.fn()}
      />
    );

    expect(screen.getByText(/⚠️ Doctor OPD Delay Notification/i)).toBeInTheDocument();
    expect(screen.getByText(/\+20 MIN DELAY ACTIVE/i)).toBeInTheDocument();
    expect(screen.getByText(/Emergency ICU Ward Rounds/i)).toBeInTheDocument();
    expect(screen.getByText(/View in Notifications \(2\)/i)).toBeInTheDocument();
  });
});

