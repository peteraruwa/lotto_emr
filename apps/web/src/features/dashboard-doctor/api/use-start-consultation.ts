'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Encounter, Appointment } from '@medplum/fhirtypes';
import { safeUpdateResource } from '@/shared/lib/fhir-safe-update';

interface StartConsultArgs {
  patientId: string;
  visitReason: string;
  /** Optional appointment ID — if provided its status is bumped to "arrived" */
  appointmentId?: string;
}

export function useStartConsultation() {
  const medplum = useMedplum();
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  return useMutation({
    mutationFn: async ({ patientId, visitReason, appointmentId }: StartConsultArgs): Promise<string> => {
      // 1. Check for existing active encounter today
      const existing = await medplum.searchResources('Encounter', {
        patient: `Patient/${patientId}`,
        date: `ge${todayStr}`,
        status: 'in-progress,arrived,triaged',
        _count: '1',
      });

      let encounterId: string;
      if (existing.length > 0 && existing[0].id) {
        encounterId = existing[0].id;
      } else {
        // 2. Create a new encounter
        const enc: Encounter = {
          resourceType: 'Encounter',
          status: 'in-progress',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'AMB',
            display: 'Ambulatory',
          },
          subject: { reference: `Patient/${patientId}` },
          reasonCode: [{ text: visitReason }],
          period: { start: new Date().toISOString() },
        };
        const created = await medplum.createResource(enc);
        encounterId = created.id!;
      }

      // 3. Mark the appointment as "arrived" so other doctors see "In Room"
      if (appointmentId) {
        try {
          await safeUpdateResource<Appointment>(
            medplum,
            'Appointment',
            appointmentId,
            (appt) => {
              // Only bump forward — don't overwrite a later status
              const current = appt.status ?? 'booked';
              if (['booked', 'pending', 'proposed', 'waitlist'].includes(current)) {
                return { status: 'arrived' };
              }
              return {};
            },
          );
        } catch {
          // Non-fatal — consultation still proceeds even if appointment update fails
        }
      }

      return encounterId;
    },
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-dash', 'encounters'] });
      queryClient.invalidateQueries({ queryKey: ['encounters', patientId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dash', 'appointments'] });
    },
  });
}
