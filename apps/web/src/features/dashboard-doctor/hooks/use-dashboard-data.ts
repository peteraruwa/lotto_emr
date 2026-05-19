'use client';

import { useQueries } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';

export interface DoctorDashboardData {
  todayPatientCount: number;
  pendingOrdersCount: number;
  criticalAlertsCount: number;
  upcomingAppointments: Array<{
    id: string;
    patientName: string;
    time: string;
    reason: string;
  }>;
  recentEncounters: Array<{
    id: string;
    patientName: string;
    status: string;
    startTime: string;
  }>;
}

export function useDoctorDashboardData(): { data: DoctorDashboardData | null; isLoading: boolean } {
  const medplum = useMedplum();
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();
  const currentUser = medplum.getProfile();

  const [appointmentsQuery, ordersQuery, observationsQuery, encountersQuery] = useQueries({
    queries: [
      {
        queryKey: ['dashboard-doctor', 'appointments', currentUser?.id],
        queryFn: () =>
          medplum.searchResources('Appointment', {
            practitioner: `Practitioner/${currentUser?.id}`,
            date: `ge${todayStart}`,
            _count: '10',
            _sort: 'date',
          }),
        enabled: !!currentUser?.id,
      },
      {
        queryKey: ['dashboard-doctor', 'orders'],
        queryFn: () =>
          medplum.searchResources('ServiceRequest', {
            status: 'active',
            _count: '1',
          }),
      },
      {
        queryKey: ['dashboard-doctor', 'critical-obs'],
        queryFn: () =>
          medplum.searchResources('Observation', {
            status: 'preliminary,final',
            _count: '20',
            _sort: '-date',
          }),
      },
      {
        queryKey: ['dashboard-doctor', 'encounters'],
        queryFn: () =>
          medplum.searchResources('Encounter', {
            practitioner: `Practitioner/${currentUser?.id}`,
            status: 'in-progress,arrived',
            _count: '10',
            _sort: '-date',
          }),
        enabled: !!currentUser?.id,
      },
    ],
  });

  const isLoading =
    appointmentsQuery.isLoading ||
    ordersQuery.isLoading ||
    observationsQuery.isLoading ||
    encountersQuery.isLoading;

  if (isLoading) return { data: null, isLoading };

  const appointments = appointmentsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const observations = observationsQuery.data ?? [];
  const encounters = encountersQuery.data ?? [];

  return {
    isLoading,
    data: {
      todayPatientCount: appointments.length,
      pendingOrdersCount: orders.length,
      criticalAlertsCount: observations.filter((o: any) => o.interpretation?.some((i: any) => i.coding?.some((c: any) => c.code === 'LL' || c.code === 'HH'))).length,
      upcomingAppointments: appointments.slice(0, 5).map((a: any) => ({
        id: a.id ?? '',
        patientName: a.participant?.find((p: any) => p.actor?.reference?.startsWith('Patient/'))?.actor?.display ?? 'Patient',
        time: a.start ?? '',
        reason: a.reasonCode?.[0]?.text ?? 'Appointment',
      })),
      recentEncounters: encounters.slice(0, 5).map((e: any) => ({
        id: e.id ?? '',
        patientName: e.subject?.display ?? 'Patient',
        status: e.status ?? 'unknown',
        startTime: e.period?.start ?? '',
      })),
    },
  };
}
