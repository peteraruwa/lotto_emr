'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';

export interface RadiologistDashboardData {
  pendingImagingOrders: number;
  reportsToSign: number;
  imagingOrders: Array<{ id: string; patientName: string; study: string; priority: string; orderedAt: string }>;
}

export function useRadiologistDashboardData() {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['dashboard-radiologist'],
    queryFn: async () => {
      const [orders, reports] = await Promise.all([
        medplum.searchResources('ServiceRequest', {
          status: 'active',
          category: '363679005', // Imaging SNOMED
          _sort: '-authored',
          _count: '20',
        }),
        medplum.searchResources('DiagnosticReport', {
          status: 'preliminary',
          _count: '10',
        }),
      ]);

      return {
        pendingImagingOrders: orders.length,
        reportsToSign: reports.length,
        imagingOrders: orders.slice(0, 10).map((sr: any) => ({
          id: sr.id ?? '',
          patientName: sr.subject?.display ?? 'Patient',
          study: sr.code?.text ?? 'Imaging study',
          priority: sr.priority ?? 'routine',
          orderedAt: sr.authoredOn ?? '',
        })),
      } as RadiologistDashboardData;
    },
  });
}
