import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { IntroPage } from './components/IntroPage';
import { LoginPage } from './components/LoginPage';
import { PatientPortal } from './components/PatientPortal';
import { WaitingHallTVMode } from './components/WaitingHallTVMode';
import { DoctorConsole } from './components/DoctorConsole';
import { EmergencyBedsDashboard } from './components/EmergencyBedsDashboard';
import { QueueAnalytics } from './components/QueueAnalytics';
import { NotificationsModal } from './components/NotificationsModal';
import { LoginModal } from './components/LoginModal';
import type { Hospital, Booking, QueueSession, User } from './services/api';
import { fetchHospitals, fetchQueueSession, getStoredAuth, clearStoredAuth } from './services/api';
import { playChime } from './utils/audioChime';
import api from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<'intro' | 'login' | 'patient' | 'tv' | 'doctor' | 'beds' | 'analytics'>('intro');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<QueueSession | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);

  // Auth states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalRole, setLoginModalRole] = useState<'PATIENT' | 'STAFF'>('PATIENT');

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
    // Check local storage for persistent user session
    const { user } = getStoredAuth();
    if (user) {
      setCurrentUser(user);
    }

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

  const handleOpenLogin = (role: 'PATIENT' | 'STAFF' = 'PATIENT') => {
    setLoginModalRole(role);
    setCurrentTab('login');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    // Role-based smart redirect
    if (user.role === 'DOCTOR') {
      setCurrentTab('doctor');
    } else if (user.role === 'ADMIN') {
      setCurrentTab('analytics');
    } else {
      setCurrentTab('patient');
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    setCurrentTab('intro');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Hide navbar on full-screen LoginPage to maximize focus on the hospital background and login card */}
      {currentTab !== 'login' && (
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          wsConnected={wsConnected}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          notificationCount={notificationCount}
          currentUser={currentUser}
          onOpenLogin={handleOpenLogin}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1">
        {currentTab === 'intro' && (
          <IntroPage
            onNavigateToLogin={handleOpenLogin}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            currentUser={currentUser}
            hospitals={hospitals}
          />
        )}

        {currentTab === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBackToHome={() => setCurrentTab('intro')}
            initialRole={loginModalRole}
          />
        )}

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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        defaultRole={loginModalRole}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {currentTab !== 'login' && (
        <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-500">
          Hospital OP Live Tracker • Anti-Duplicate Queue Engine • Auto Token Expiry • AI Wait-Time Forecast
        </footer>
      )}
    </div>
  );
}

export default App;


