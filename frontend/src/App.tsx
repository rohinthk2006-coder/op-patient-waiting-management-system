import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PatientPortal } from './components/PatientPortal';
import { WaitingHallTVMode } from './components/WaitingHallTVMode';
import { DoctorConsole } from './components/DoctorConsole';
import { EmergencyBedsDashboard } from './components/EmergencyBedsDashboard';
import { QueueAnalytics } from './components/QueueAnalytics';
import { NotificationsModal } from './components/NotificationsModal';
import type { Hospital, Booking, QueueSession } from './services/api';
import { fetchHospitals, fetchQueueSession } from './services/api';
import { playChime } from './utils/audioChime';
import api from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<'patient' | 'tv' | 'doctor' | 'beds' | 'analytics'>('patient');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<QueueSession | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      const [hospData, sessionData, notifRes] = await Promise.all([
        fetchHospitals(),
        fetchQueueSession('sch-card-morning', '2026-10-24'),
        api.get('/notifications').catch(() => ({ data: [] })),
      ]);
      setHospitals(hospData);
      setSession(sessionData);
      setNotificationCount(notifRes.data?.length || 0);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Setup Real-Time WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
        console.log('Real-Time WebSocket connected.');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket event received:', data);

          if (data.event === 'TOKEN_CALLED') {
            playChime();
            loadData();
          } else if (
            data.event === 'TOKEN_EXPIRED' ||
            data.event === 'CONSULTATION_COMPLETED' ||
            data.event === 'NEW_TOKEN_BOOKED' ||
            data.event === 'PATIENT_CHECKED_IN'
          ) {
            loadData();
          }
        } catch {
          // Pong / Ping message
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      console.warn('Could not establish WebSocket connection:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        wsConnected={wsConnected}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        notificationCount={notificationCount}
      />

      <main className="flex-1">
        {currentTab === 'patient' && (
          <PatientPortal
            hospitals={hospitals}
            onBookingSuccess={loadData}
            activeBooking={activeBooking}
            setActiveBooking={setActiveBooking}
          />
        )}

        {currentTab === 'tv' && (
          <WaitingHallTVMode session={session} onRefresh={loadData} />
        )}

        {currentTab === 'doctor' && (
          <DoctorConsole session={session} onRefresh={loadData} />
        )}

        {currentTab === 'beds' && (
          <EmergencyBedsDashboard />
        )}

        {currentTab === 'analytics' && (
          <QueueAnalytics session={session} />
        )}
      </main>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        Hospital OP Live Tracker • Anti-Duplicate Queue Engine • Auto Token Expiry • AI Wait-Time Forecast
      </footer>
    </div>
  );
}

export default App;
