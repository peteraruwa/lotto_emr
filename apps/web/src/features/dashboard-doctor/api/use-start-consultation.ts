'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Encounter } from '@medplum/fhirtypes';

interface StartConsultArgs {
  patientId: string;
  visitReason: string;
}

export function useStartConsultation() {
  const medplum = useMedplum();
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  return useMutation({
    mutationFn: async ({ patientId, visitReason }: StartConsultArgs): Promise<string> => {
      // Check for existing active encounter today
      const existing = await medplum.searchResources('Encounter', {
        patient: `Patient/${patientId}`,
        date: `ge${todayStr}`,
        status: 'in-progress,arrived,triaged',
        _count: '1',
      });

      if (existing.length > 0 && existing[0].id) {
        return existing[0].id;
      }

      // Create a new encounter
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
      return created.id!;
    },
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-dash', 'encounters'] });
      queryClient.invalidateQueries({ queryKey: ['encounters', patientId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dash', 'appointments'] });
    },
  });
}
