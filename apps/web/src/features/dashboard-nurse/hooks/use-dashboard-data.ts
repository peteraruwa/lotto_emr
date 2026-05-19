'use client';

import { useQueries } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';

export interface NurseDashboardData {
  wardPatientCount: number;
  pendingVitalsCount: number;
  medicationsDueCount: number;
  wardPatients: Array<{ id: string; patientName: string; location: string; status: string }>;
}

export function useNurseDashboardData() {
  const medplum = useMedplum();

  const [encountersQuery, medsQuery] = useQueries({
    queries: [
      {
        queryKey: ['dashboard-nurse', 'ward-encounters'],
        queryFn: () =>
          medplum.searchResources('Encounter', {
            status: 'in-progress,arrived',
            class: 'IMP,OBSENC',
            _count: '30',
            _sort: 'date',
          }),
      },
      {
        queryKey: ['dashboard-nurse', 'med-admin'],
        queryFn: () =>
          medplum.searchResources('MedicationRequest', {
            status: 'active',
            _count: '50',
          }),
      },
    ],
  });

  const isLoading = encountersQuery.isLoading || medsQuery.isLoading;
  const encounters = encountersQuery.data ?? [];
  const medications = medsQuery.data ?? [];

  return {
    isLoading,
    data: isLoading
      ? null
      : ({
          wardPatientCount: encounters.length,
          pendingVitalsCount: encounters.filter((e: any) => e.status === 'in-progress').length,
          medicationsDueCount: medications.length,
          wardPatients: encounters.slice(0, 8).map((e: any) => ({
            id: e.id ?? '',
            patientName: e.subject?.display ?? 'Patient',
            location: e.location?.[0]?.location?.display ?? 'General Ward',
            status: e.status ?? 'unknown',
          })),
        } as NurseDashboardData),
  };
}
