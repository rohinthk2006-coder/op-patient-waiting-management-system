import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoctorConsole } from '../components/DoctorConsole';
import type { QueueSession } from '../services/api';

vi.mock('../services/api', () => ({
  executeTokenAction: vi.fn(),
  updateDoctorDelay: vi.fn(),
}));

vi.mock('../utils/audioChime', () => ({
  playChime: vi.fn(),
}));

import { executeTokenAction, updateDoctorDelay } from '../services/api';
import { playChime } from '../utils/audioChime';

describe('DoctorConsole Component', () => {
  const mockSession: QueueSession = {
    id: 'qs-1',
    schedule_id: 'sch-card-morning',
    doctor_name: 'Dr. R. Anand',
    department_name: 'Cardiology',
    opd_room: 'OPD Room 102',
    date: '2026-10-24',
    session_status: 'RUNNING',
    current_serving_token: 3,
    next_up_tokens: [4, 5],
    total_booked: 10,
    total_completed: 2,
    total_expired: 0,
    total_waiting: 8,
    doctor_delay_min: 0,
    delay_reason: '',
    tokens: [
      {
        booking_id: 'b-3',
        token_number: 3,
        patient_name: 'A. Sundar',
        status: 'IN_CONSULTATION',
        reporting_deadline: '10:00 AM',
        grace_period_deadline: '10:10 AM',
        estimated_wait_minutes: 0,
      },
      {
        booking_id: 'b-4',
        token_number: 4,
        patient_name: 'K. Rajesh',
        status: 'CHECKED_IN',
        reporting_deadline: '10:15 AM',
        grace_period_deadline: '10:25 AM',
        estimated_wait_minutes: 10,
      },
      {
        booking_id: 'b-5',
        token_number: 5,
        patient_name: 'M. Priya',
        status: 'BOOKED',
        reporting_deadline: '10:30 AM',
        grace_period_deadline: '10:40 AM',
        estimated_wait_minutes: 20,
      },
    ],
  };

  it('renders doctor information and current serving token', () => {
    render(<DoctorConsole session={mockSession} onRefresh={() => {}} />);

    expect(screen.getByText(/Dr\. R\. Anand/i)).toBeInTheDocument();
    expect(screen.getByText(/OPD Room 102/i)).toBeInTheDocument();
    expect(screen.getAllByText('#3').length).toBeGreaterThan(0);
  });

  it('calls executeTokenAction and plays chime when Call button is clicked', async () => {
    vi.mocked(executeTokenAction).mockResolvedValueOnce({ success: true, message: 'Called' });

    render(<DoctorConsole session={mockSession} onRefresh={() => {}} />);

    const callBtn = screen.getByRole('button', { name: /Call #4/i });
    fireEvent.click(callBtn);

    expect(playChime).toHaveBeenCalled();
    await waitFor(() => {
      expect(executeTokenAction).toHaveBeenCalledWith('sch-card-morning', 'CALL', 4, '2026-10-24');
    });
  });

  it('broadcasts doctor delay when Broadcast Delay button is clicked', async () => {
    vi.mocked(updateDoctorDelay).mockResolvedValueOnce({ success: true, message: 'Delay updated' });

    render(<DoctorConsole session={mockSession} onRefresh={() => {}} />);

    const broadcastBtn = screen.getByRole('button', { name: /Broadcast Delay/i });
    fireEvent.click(broadcastBtn);

    await waitFor(() => {
      expect(updateDoctorDelay).toHaveBeenCalled();
    });
  });
});
