'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { CDSCard, CDSHookResponse } from '../types';

/**
 * Fetches CDS cards for the patient-view hook.
 * Calls the /api/cds-services proxy which forwards to the Medplum bot.
 *
 * Results are cached for 60 seconds — CDS alerts should be timely but
 * we don't want to hammer the server on every render.
 */
export function usePatientViewCards(patientId: string | undefined) {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['cds-cards', 'patient-view', patientId],
    queryFn: async (): Promise<CDSCard[]> => {
      if (!patientId) return [];

      const token = medplum.getAccessToken();

      const response = await fetch('/api/cds-services/patient-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hookInstance: crypto.randomUUID(),
          hook: 'patient-view',
          context: {
            userId: `Practitioner/${medplum.getProfile()?.id}`,
            patientId,
          },
          prefetch: {
            patient: { reference: `Patient/${patientId}` },
          },
        }),
      });

      if (!response.ok) {
        // CDS failures should not block clinical workflow — return empty cards
        console.warn('CDS Hooks patient-view request failed:', response.status);
        return [];
      }

      const data: CDSHookResponse = await response.json();
      return data.cards ?? [];
    },
    enabled: !!patientId,
    staleTime: 60_000,
    retry: false, // CDS alerts should not retry — stale is fine
  });
}
