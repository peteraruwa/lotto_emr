'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { format, startOfDay, endOfDay } from 'date-fns';
import type { AppointmentListItem } from '../types';

interface UseAppointmentsParams {
  date?: Date;
  practitionerId?: string;
  patientId?: string;
}

export function useAppointments(params: UseAppointmentsParams = {}) {
  const medplum = useMedplum();
  const { date = new Date(), practitionerId, patientId } = params;

  return useQuery({
    queryKey: ['appointments', { date: format(date, 'yyyy-MM-dd'), practitionerId, patientId }],
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        date: `ge${startOfDay(date).toISOString()}`,
        _sort: 'date',
        _count: '100',
      };

      if (practitionerId) {
        searchParams['practitioner'] = `Practitioner/${practitionerId}`;
      }

      if (patientId) {
        searchParams['patient'] = `Patient/${patientId}`;
      }

      // Add end date filter
      searchParams['date'] += `&date=le${endOfDay(date).toISOString()}`;

      const appointments = await medplum.searchResources('Appointment', searchParams);

      return appointments.map((a: any): AppointmentListItem => ({
        id: a.id ?? '',
        patientId:
          a.participant
            ?.find((p: any) => p.actor?.reference?.startsWith('Patient/'))
            ?.actor?.reference?.split('/')?.[1] ?? '',
        patientName:
          a.participant?.find((p: any) => p.actor?.reference?.startsWith('Patient/'))?.actor?.display ?? '',
        practitionerName:
          a.participant?.find((p: any) => p.actor?.reference?.startsWith('Practitioner/'))?.actor?.display ?? '',
        start: a.start ?? '',
        end: a.end ?? '',
        serviceType: a.serviceType?.[0]?.text ?? a.serviceType?.[0]?.coding?.[0]?.display ?? 'Appointment',
        status: a.status ?? 'proposed',
        reason: a.reasonCode?.[0]?.text,
      }));
    },
  });
}
