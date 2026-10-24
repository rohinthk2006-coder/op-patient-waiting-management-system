import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EmergencyBedsDashboard } from '../components/EmergencyBedsDashboard';
import type { BedStatus } from '../services/api';

vi.mock('../services/api', () => ({
  fetchEmergencyBeds: vi.fn(),
}));

import { fetchEmergencyBeds } from '../services/api';

describe('EmergencyBedsDashboard Component', () => {
  const mockBeds: BedStatus[] = [
    {
      id: 'bed-icu-01',
      hospital_id: 'hosp-01',
      category: 'ICU',
      hospital_name: 'Apollo Speciality OPD',
      total_beds: 20,
      occupied_beds: 19,
      available_beds: 1,
      status: 'CRITICAL',
    },
    {
      id: 'bed-oxygen-01',
      hospital_id: 'hosp-01',
      category: 'OXYGEN_SUPPORT',
      hospital_name: 'Apollo Speciality OPD',
      total_beds: 50,
      occupied_beds: 25,
      available_beds: 25,
      status: 'AVAILABLE',
    },
  ];

  it('renders emergency bed tracker title and categories', async () => {
    vi.mocked(fetchEmergencyBeds).mockResolvedValueOnce(mockBeds);

    render(<EmergencyBedsDashboard />);

    expect(screen.getByText('Emergency Bed Availability Tracker')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ICU')).toBeInTheDocument();
      expect(screen.getByText('OXYGEN SUPPORT')).toBeInTheDocument();
    });

    expect(screen.getByText('1')).toBeInTheDocument(); // 1 available ICU bed
    expect(screen.getByText('25')).toBeInTheDocument(); // 25 available Oxygen beds
  });

  it('shows critical indicator for low bed counts', async () => {
    vi.mocked(fetchEmergencyBeds).mockResolvedValueOnce(mockBeds);

    render(<EmergencyBedsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
    });
  });
});
