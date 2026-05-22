'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Appointment } from '@medplum/fhirtypes';
import { format } from 'date-fns';
import { sendAppointmentConfirmation } from '@/shared/services/sms-service';
import type { AppointmentFormData } from '../types';

export function useCreateAppointment() {
  const medplum = useMedplum();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AppointmentFormData): Promise<Appointment> => {
      const appointment: Appointment = {
        resourceType: 'Appointment',
        status: 'booked',
        serviceType: [{ text: data.serviceType }],
        reasonCode: data.reason ? [{ text: data.reason }] : undefined,
        start: data.start,
        end: data.end,
        participant: [
          {
            actor: { reference: `Patient/${data.patientId}` },
            status: 'accepted',
          },
          {
            actor: { reference: `Practitioner/${data.practitionerId}` },
            status: 'accepted',
          },
        ],
        comment: data.notes,
      };

      const created = await medplum.createResource(appointment);

      // Fire-and-forget SMS confirmation — fetch patient phone asynchronously
      if (data.patientId) {
        medplum.readResource('Patient', data.patientId).then((patient: any) => {
          const phone = patient.telecom?.find((t: any) => t.system === 'phone')?.value;
          const name  = patient.name?.[0]?.text
            ?? `${patient.name?.[0]?.given?.[0] ?? ''} ${patient.name?.[0]?.family ?? ''}`.trim()
            ?? 'Patient';
          const dateTimeStr = data.start
            ? format(new Date(data.start), 'd MMM yyyy \'at\' HH:mm')
            : 'a scheduled time';

          sendAppointmentConfirmation({
            patientName:  name,
            phoneNumber:  phone,
            facilityName: 'Lotto Central Hospital',
            dateTime:     dateTimeStr,
          }).catch(() => undefined);
        }).catch(() => undefined);
      }

      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
