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
  address: string;
  phone: string;
  emergency_contact: string;
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
  session_status: string;
  tokens: {
    booking_id: string;
    token_number: number;
    patient_name: string;
    status: string;
    reporting_deadline: string;
    grace_period_deadline: string;
    estimated_wait_minutes: number;
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

export const fetchEmergencyBeds = async (hospitalId?: string): Promise<BedStatus[]> => {
  const res = await api.get('/beds', { params: { hospital_id: hospitalId } });
  return res.data;
};

export default api;
