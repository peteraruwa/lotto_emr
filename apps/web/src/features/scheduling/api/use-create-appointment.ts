'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Appointment } from '@medplum/fhirtypes';
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

      return medplum.createResource(appointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
