'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';

export interface PharmacistDashboardData {
  pendingPrescriptions: number;
  dispensedToday: number;
  prescriptions: Array<{
    id: string;
    patientName: string;
    medication: string;
    priority: string;
    orderedAt: string;
  }>;
}

export function usePharmacistDashboardData() {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['pharmacy', 'prescriptions'],
    queryFn: async () => {
      const [active, dispensed] = await Promise.all([
        medplum.searchResources('MedicationRequest', { status: 'active', _sort: '-authored', _count: '20' }),
        medplum.searchResources('MedicationDispense', { status: 'completed', _count: '1' }),
      ]);

      return {
        pendingPrescriptions: active.length,
        dispensedToday: dispensed.length,
        prescriptions: active.slice(0, 10).map((mr: any) => ({
          id: mr.id ?? '',
          patientName: mr.subject?.display ?? 'Patient',
          medication: mr.medicationCodeableConcept?.text ?? 'Medication',
          priority: mr.priority ?? 'routine',
          orderedAt: mr.authoredOn ?? '',
        })),
      } as PharmacistDashboardData;
    },
  });
}
