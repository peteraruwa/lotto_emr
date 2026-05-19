'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Encounter } from '@medplum/fhirtypes';
import type { EncounterFormData } from '../types';

/**
 * Mutation hook to open a new Encounter (admit / check-in a patient).
 */
export function useCreateEncounter() {
  const medplum = useMedplum();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EncounterFormData): Promise<Encounter> => {
      const encounter = {
        resourceType: 'Encounter',
        status: 'arrived',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: data.class,
          display:
            data.class === 'EMER'
              ? 'Emergency'
              : data.class === 'IMP'
              ? 'Inpatient'
              : 'Ambulatory',
        },
        subject: { reference: `Patient/${data.patientId}` },
        reasonCode: [{ text: data.reason }],
        period: { start: new Date().toISOString() },
        participant: data.practitionerId
          ? [{ individual: { reference: `Practitioner/${data.practitionerId}` } }]
          : undefined,
        location: data.locationId
          ? [{ location: { reference: `Location/${data.locationId}` } }]
          : undefined,
        note: data.notes ? [{ text: data.notes }] : undefined,
      } as Encounter;

      return medplum.createResource(encounter);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['encounters', variables.patientId] });
    },
  });
}
