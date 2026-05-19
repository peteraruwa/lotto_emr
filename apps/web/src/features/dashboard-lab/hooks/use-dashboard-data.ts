'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';

export interface LabDashboardData {
  pendingOrders: number;
  criticalValues: number;
  labOrders: Array<{ id: string; patientName: string; test: string; priority: string; orderedAt: string }>;
  criticalObservations: Array<{ id: string; patientName: string; test: string; value: string }>;
}

export function useLabDashboardData() {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['dashboard-lab'],
    queryFn: async () => {
      const [orders, observations] = await Promise.all([
        medplum.searchResources('ServiceRequest', {
          status: 'active',
          category: '108252007', // Laboratory procedure SNOMED
          _sort: '-authored',
          _count: '20',
        }),
        medplum.searchResources('Observation', {
          status: 'preliminary',
          _count: '20',
          _sort: '-date',
        }),
      ]);

      return {
        pendingOrders: orders.length,
        criticalValues: observations.filter((o: any) =>
          o.interpretation?.some((i: any) => i.coding?.some((c: any) => c.code === 'LL' || c.code === 'HH'))
        ).length,
        labOrders: orders.slice(0, 10).map((sr: any) => ({
          id: sr.id ?? '',
          patientName: sr.subject?.display ?? 'Patient',
          test: sr.code?.text ?? 'Lab test',
          priority: sr.priority ?? 'routine',
          orderedAt: sr.authoredOn ?? '',
        })),
        criticalObservations: observations
          .filter((o: any) => o.interpretation?.some((i: any) => i.coding?.some((c: any) => c.code === 'LL' || c.code === 'HH')))
          .slice(0, 5)
          .map((o: any) => ({
            id: o.id ?? '',
            patientName: o.subject?.display ?? 'Patient',
            test: o.code?.text ?? 'Observation',
            value: o.valueQuantity ? `${o.valueQuantity.value} ${o.valueQuantity.unit}` : o.valueString ?? '',
          })),
      } as LabDashboardData;
    },
  });
}
