'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { format, startOfDay, endOfDay } from 'date-fns';

export interface AdminDashboardData {
  todayAppointments: number;
  newRegistrationsToday: number;
  totalActivePatients: number;
  upcomingAppointments: Array<{
    id: string;
    patientName: string;
    practitionerName: string;
    time: string;
    serviceType: string;
    status: string;
  }>;
}

export function useAdminDashboardData() {
  const medplum = useMedplum();
  const today = new Date();

  return useQuery({
    queryKey: ['dashboard-admin', format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      const [todayAppts, newPatients, totalPatients] = await Promise.all([
        medplum.searchResources('Appointment', {
          date: `ge${startOfDay(today).toISOString()}`,
          _count: '50',
          _sort: 'date',
        }),
        medplum.searchResources('Patient', {
          _lastUpdated: `ge${startOfDay(today).toISOString()}`,
          _count: '1',
        }),
        medplum.searchResources('Patient', { active: 'true', _count: '1' }),
      ]);

      return {
        todayAppointments: todayAppts.length,
        newRegistrationsToday: newPatients.length,
        totalActivePatients: totalPatients.length,
        upcomingAppointments: todayAppts.slice(0, 10).map((a: any) => ({
          id: a.id ?? '',
          patientName: a.participant?.find((p: any) => p.actor?.reference?.startsWith('Patient/'))?.actor?.display ?? 'Patient',
          practitionerName: a.participant?.find((p: any) => p.actor?.reference?.startsWith('Practitioner/'))?.actor?.display ?? 'Unassigned',
          time: a.start ?? '',
          serviceType: a.serviceType?.[0]?.text ?? 'Appointment',
          status: a.status ?? 'booked',
        })),
      } as AdminDashboardData;
    },
  });
}
