import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WaitingHallTVMode } from '../components/WaitingHallTVMode';
import type { QueueSession } from '../services/api';

vi.mock('../utils/audioChime', () => ({
  playChime: vi.fn(),
}));

import { playChime } from '../utils/audioChime';

describe('WaitingHallTVMode Component', () => {
  const mockSession: QueueSession = {
    id: 'qs-1',
    schedule_id: 'sch-card-morning',
    doctor_name: 'Dr. R. Anand',
    department_name: 'Cardiology',
    opd_room: 'OPD Room 102',
    date: '2026-10-24',
    session_status: 'RUNNING',
    current_serving_token: 5,
    next_up_tokens: [6, 7],
    total_booked: 15,
    total_completed: 4,
    total_expired: 0,
    total_waiting: 11,
    doctor_delay_min: 15,
    delay_reason: 'Emergency angioplasty review',
    tokens: [
      {
        booking_id: 'b-5',
        token_number: 5,
        patient_name: 'R. Sharma',
        status: 'IN_CONSULTATION',
        reporting_deadline: '10:00 AM',
        grace_period_deadline: '10:10 AM',
        estimated_wait_minutes: 0,
      },
      {
        booking_id: 'b-6',
        token_number: 6,
        patient_name: 'A. Kumar',
        status: 'CHECKED_IN',
        reporting_deadline: '10:15 AM',
        grace_period_deadline: '10:25 AM',
        estimated_wait_minutes: 10,
      },
      {
        booking_id: 'b-7',
        token_number: 7,
        patient_name: 'S. Devi',
        status: 'BOOKED',
        reporting_deadline: '10:30 AM',
        grace_period_deadline: '10:40 AM',
        estimated_wait_minutes: 20,
      },
    ],
  };

  it('renders OPD room, doctor name, and currently serving token prominently', () => {
    render(<WaitingHallTVMode session={mockSession} onRefresh={() => {}} />);

    expect(screen.getAllByText('OPD Room 102').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dr\. R\. Anand/i).length).toBeGreaterThan(0);
    expect(screen.getByText('#5')).toBeInTheDocument();
  });

  it('displays doctor delay alert banner when delay > 0', () => {
    render(<WaitingHallTVMode session={mockSession} onRefresh={() => {}} />);

    expect(screen.getByText(/DOCTOR DELAY NOTICE:/i)).toBeInTheDocument();
    expect(screen.getByText(/15 minutes behind schedule/i)).toBeInTheDocument();
  });

  it('renders upcoming queue tokens correctly', () => {
    render(<WaitingHallTVMode session={mockSession} onRefresh={() => {}} />);

    expect(screen.getByText('Token #6')).toBeInTheDocument();
    expect(screen.getByText('Token #7')).toBeInTheDocument();
  });

  it('triggers chime sound when test chime button is clicked', () => {
    render(<WaitingHallTVMode session={mockSession} onRefresh={() => {}} />);

    const chimeBtn = screen.getByRole('button', { name: /Test Chime Sound/i });
    fireEvent.click(chimeBtn);

    expect(playChime).toHaveBeenCalled();
  });
});
