import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Hospital {
  id: string;
  name: string;
  code: string;
  city: string;
  area?: string;
  address: string;
  phone: string;
  emergency_contact: string;
  latitude?: number;
  longitude?: number;
  departments: {
    id: string;
    name: string;
    room_number: string;
    active_doctors_count: number;
    current_avg_wait_min: number;
  }[];
}

export interface Doctor {
  id: string;
  name: string;
  hospital_id: string;
  department_id: string;
  department_name: string;
  specialization: string;
  opd_room: string;
  status: string;
  schedules: {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
    avg_consultation_time_min: number;
    max_tokens: number;
    grace_period_min: number;
  }[];
}

export interface Booking {
  id: string;
  booking_ref: string;
  patient_name: string;
  patient_phone: string;
  patient_age?: number;
  patient_gender?: string;
  aadhar_number?: string;
  patient_location?: string;
  patient_latitude?: number;
  patient_longitude?: number;
  travel_mode?: string;
  travel_distance_km?: number;
  estimated_travel_min?: number;
  traffic_condition?: string;
  recommended_departure_time?: string;
  hospital_id: string;
  department_name: string;
  doctor_name: string;
  opd_room: string;
  schedule_id: string;
  booking_date: string;
  token_number: number;
  booking_type: 'ONLINE' | 'OFFLINE_WALKIN';
  status: 'BOOKED' | 'CHECKED_IN' | 'IN_CONSULTATION' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED' | 'NO_SHOW';
  reporting_deadline: string;
  grace_period_deadline: string;
  estimated_consultation_time: string;
  doctor_delay_min?: number;
  delay_reason?: string;
  adjusted_consultation_time?: string;
  adjusted_reporting_deadline?: string;
  created_at: string;
}

export interface QueueSession {
  id: string;
  schedule_id: string;
  doctor_name: string;
  department_name: string;
  opd_room: string;
  date: string;
  current_serving_token: number | null;
  next_up_tokens: number[];
  total_booked: number;
  total_completed: number;
  total_expired: number;
  total_waiting: number;
  doctor_delay_min?: number;
  delay_reason?: string;
  session_status: string;
  tokens: {
    booking_id: string;
    token_number: number;
    patient_name: string;
    status: string;
    reporting_deadline: string;
    grace_period_deadline: string;
    estimated_wait_minutes: number;
    doctor_delay_min?: number;
    delay_reason?: string;
    aadhar_number?: string;
    patient_location?: string;
  }[];
}

export interface BedStatus {
  id: string;
  hospital_id: string;
  hospital_name: string;
  category: 'ICU' | 'EMERGENCY_TRAUMA' | 'OXYGEN_SUPPORT' | 'GENERAL_WARD' | 'PEDIATRIC';
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  status: 'AVAILABLE' | 'LOW' | 'CRITICAL';
  last_updated: string;
}

export interface TrafficEstimateResponse {
  hospital_id: string;
  hospital_name: string;
  hospital_address: string;
  hospital_lat: number;
  hospital_lng: number;
  origin_description: string;
  origin_lat: number;
  origin_lng: number;
  travel_mode: string;
  distance_km: number;
  traffic_level: 'SMOOTH' | 'MODERATE' | 'HEAVY';
  traffic_delay_min: number;
  estimated_travel_min: number;
  recommended_departure_time: string;
  route_summary: string;
}

export interface TrichyLocality {
  name: string;
  latitude: number;
  longitude: number;
}

export const fetchHospitals = async (): Promise<Hospital[]> => {
  const res = await api.get('/hospitals');
  return res.data;
};

export const fetchDoctors = async (hospitalId: string, departmentId?: string): Promise<Doctor[]> => {
  const res = await api.get(`/hospitals/${hospitalId}/doctors`, {
    params: { department_id: departmentId },
  });
  return res.data;
};

export const bookToken = async (payload: {
  hospital_id: string;
  department_id: string;
  doctor_id: string;
  schedule_id: string;
  booking_date: string;
  patient_name: string;
  patient_phone: string;
  patient_age?: number;
  patient_gender?: string;
  aadhar_number?: string;
  patient_location?: string;
  patient_latitude?: number;
  patient_longitude?: number;
  travel_mode?: string;
  travel_distance_km?: number;
  estimated_travel_min?: number;
  traffic_condition?: string;
  recommended_departure_time?: string;
}): Promise<Booking> => {
  const res = await api.post('/bookings', payload);
  return res.data;
};

export const bookWalkin = async (payload: {
  hospital_id: string;
  department_id: string;
  doctor_id: string;
  schedule_id: string;
  booking_date: string;
  patient_name: string;
  patient_phone: string;
  patient_age?: number;
  patient_gender?: string;
  aadhar_number?: string;
  patient_location?: string;
  patient_latitude?: number;
  patient_longitude?: number;
  travel_mode?: string;
  travel_distance_km?: number;
  estimated_travel_min?: number;
  traffic_condition?: string;
  recommended_departure_time?: string;
}): Promise<Booking> => {
  const res = await api.post('/bookings/walkin', payload);
  return res.data;
};

export const checkInPatient = async (bookingId: string): Promise<Booking> => {
  const res = await api.post(`/bookings/${bookingId}/check-in`);
  return res.data;
};

export const fetchQueueSession = async (scheduleId: string, date?: string): Promise<QueueSession> => {
  const res = await api.get(`/queue/session/${scheduleId}`, { params: { date } });
  return res.data;
};

export const executeTokenAction = async (
  scheduleId: string,
  action: 'CALL' | 'START' | 'COMPLETE' | 'HOLD' | 'ABSENT' | 'DEMO_EXPIRE',
  tokenNumber: number,
  date?: string
) => {
  const res = await api.post(`/queue/session/${scheduleId}/action`, {
    action,
    token_number: tokenNumber,
    date,
  });
  return res.data;
};

export const updateDoctorDelay = async (
  scheduleId: string,
  delayMinutes: number,
  delayReason: string = 'OPD Consultation Delay',
  doctorId?: string
) => {
  const res = await api.post('/queue/doctor-delay', {
    schedule_id: scheduleId,
    delay_minutes: delayMinutes,
    delay_reason: delayReason,
    doctor_id: doctorId,
  });
  return res.data;
};

export const getDoctorDelay = async (scheduleId: string) => {
  const res = await api.get(`/queue/doctor-delay/${scheduleId}`);
  return res.data;
};

export const fetchEmergencyBeds = async (hospitalId?: string): Promise<BedStatus[]> => {
  const res = await api.get('/beds', { params: { hospital_id: hospitalId } });
  return res.data;
};

export const calculateTraffic = async (payload: {
  hospital_id: string;
  patient_latitude?: number;
  patient_longitude?: number;
  patient_locality?: string;
  travel_mode?: string;
  target_reporting_time?: string;
}): Promise<TrafficEstimateResponse> => {
  const res = await api.post('/traffic/calculate', payload);
  return res.data;
};

export const fetchTrichyLocalities = async (): Promise<TrichyLocality[]> => {
  const res = await api.get('/traffic/localities');
  return res.data;
};

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  hospital_id?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

const TOKEN_KEY = 'op_tracker_token';
const USER_KEY = 'op_tracker_user';

export const getStoredAuth = (): { token: string | null; user: User | null } => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    let user: User | null = null;
    if (userStr) {
      user = JSON.parse(userStr);
    }
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const setStoredAuth = (token: string, user: User) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } catch (err) {
    console.error('Failed to save auth to storage:', err);
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
  } catch (err) {
    console.error('Failed to clear auth from storage:', err);
  }
};

export const loginUser = async (username: string, password: string): Promise<AuthResponse> => {
  const res = await api.post('/auth/login', {
    username,
    phone: username,
    email: username,
    password,
  });
  setStoredAuth(res.data.access_token, res.data.user);
  return res.data;
};

export const sendLoginOtp = async (phone: string): Promise<{
  success: boolean;
  message: string;
  real_sms_sent?: boolean;
  otp_preview?: string;
  fast2sms_code?: number;
  expires_in_seconds?: number;
}> => {
  const res = await api.post('/auth/otp/send', { phone });
  return res.data;
};

export const verifyLoginOtp = async (phone: string, otp: string, name?: string): Promise<AuthResponse> => {
  const res = await api.post('/auth/otp/verify', { phone, otp, name });
  setStoredAuth(res.data.access_token, res.data.user);
  return res.data;
};

export const registerUser = async (userData: {
  name: string;
  phone: string;
  password: string;
  email?: string;
  age?: number;
  gender?: string;
  role?: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  hospital_id?: string;
}): Promise<AuthResponse> => {
  const res = await api.post('/auth/register', userData);
  setStoredAuth(res.data.access_token, res.data.user);
  return res.data;
};

export default api;
