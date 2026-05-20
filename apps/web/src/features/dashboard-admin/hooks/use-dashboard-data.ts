'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { format, startOfDay } from 'date-fns';

export interface RecentRegistration {
  id: string;
  mrn: string;
  fullName: string;
  gender: string;
  registeredAt: string;
}

export interface AppointmentRow {
  id: string;
  patientName: string;
  patientRef: string;
  practitionerName: string;
  time: string;
  serviceType: string;
  status: string;
}

export interface AdminDashboardData {
  todayAppointments: number;
  newRegistrationsToday: number;
  totalActivePatients: number;
  pendingAppointments: number;
  upcomingAppointments: AppointmentRow[];
  recentRegistrations: RecentRegistration[];
}

export function useAdminDashboardData() {
  const medplum = useMedplum();
  const today = new Date();

  return useQuery({
    queryKey: ['dashboard-admin', format(today, 'yyyy-MM-dd')],
    queryFn: async (): Promise<AdminDashboardData> => {
      const todayStart = startOfDay(today).toISOString();

      const [todayAppts, newPatients, totalPatients, recentPatients] = await Promise.all([
        medplum.searchResources('Appointment', {
          date: `ge${todayStart}`,
          _count: '50',
          _sort: 'date',
        }),
        medplum.searchResources('Patient', {
          _lastUpdated: `ge${todayStart}`,
          _count: '5',
          _sort: '-_lastUpdated',
        }),
        medplum.searchResources('Patient', { active: 'true', _count: '1' }),
        medplum.searchResources('Patient', {
          _count: '8',
          _sort: '-_lastUpdated',
        }),
      ]);

      const pendingCount = todayAppts.filter(
        (a: any) => a.status === 'proposed' || a.status === 'pending'
      ).length;

      const recentRegistrations: RecentRegistration[] = recentPatients.map((p: any) => {
        const given = p.name?.[0]?.given?.join(' ') ?? '';
        const family = p.name?.[0]?.family ?? '';
        const mrn =
          p.identifier?.find((i: any) =>
            i.system?.includes('mrn') || i.system?.includes('MRN')
          )?.value ?? p.id?.slice(0, 8).toUpperCase() ?? '—';

        return {
          id: p.id ?? '',
          mrn,
          fullName: `${given} ${family}`.trim() || 'Unknown',
          gender: p.gender ?? 'unknown',
          registeredAt: p.meta?.lastUpdated ?? '',
        };
      });

      const upcomingAppointments: AppointmentRow[] = todayAppts
        .slice(0, 12)
        .map((a: any) => ({
          id: a.id ?? '',
          patientName:
            a.participant?.find((p: any) =>
              p.actor?.reference?.startsWith('Patient/')
            )?.actor?.display ?? 'Patient',
          patientRef:
            a.participant?.find((p: any) =>
              p.actor?.reference?.startsWith('Patient/')
            )?.actor?.reference ?? '',
          practitionerName:
            a.participant?.find((p: any) =>
              p.actor?.reference?.startsWith('Practitioner/')
            )?.actor?.display ?? 'Unassigned',
          time: a.start ?? '',
          serviceType: a.serviceType?.[0]?.text ?? 'General',
          status: a.status ?? 'booked',
        }));

      return {
        todayAppointments: todayAppts.length,
        newRegistrationsToday: newPatients.length,
        totalActivePatients: totalPatients.length,
        pendingAppointments: pendingCount,
        upcomingAppointments,
        recentRegistrations,
      };
    },
  });
}
