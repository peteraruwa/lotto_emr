'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { OrderListItem } from '../types';

interface UseOrdersParams {
  patientId?: string;
  status?: string;
}

export function useOrders(params: UseOrdersParams = {}) {
  const medplum = useMedplum();
  const { patientId, status } = params;

  return useQuery({
    queryKey: ['orders', { patientId, status }],
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        _sort: '-authored',
        _count: '50',
      };

      if (patientId) searchParams['patient'] = `Patient/${patientId}`;
      if (status) searchParams['status'] = status;

      // Fetch both ServiceRequests (lab/imaging) and MedicationRequests in parallel
      const [serviceRequests, medicationRequests] = await Promise.all([
        medplum.searchResources('ServiceRequest', searchParams),
        medplum.searchResources('MedicationRequest', searchParams),
      ]);

      const orders: OrderListItem[] = [];

      for (const sr of serviceRequests as any[]) {
        const categoryCode = sr.category?.[0]?.coding?.[0]?.code;
        const type = categoryCode === '363679005' ? 'IMAGING' : 'LAB';

        orders.push({
          id: sr.id ?? '',
          resourceType: 'ServiceRequest',
          type,
          patientId: sr.subject?.reference?.split('/')?.[1] ?? patientId ?? '',
          patientName: sr.subject?.display ?? '',
          status: sr.status ?? 'unknown',
          orderText: sr.code?.text ?? sr.code?.coding?.[0]?.display ?? 'Lab order',
          orderedBy: sr.requester?.display,
          orderedAt: sr.authoredOn ?? '',
          priority: sr.priority ?? 'routine',
          notes: sr.note?.[0]?.text,
        });
      }

      for (const mr of medicationRequests as any[]) {
        orders.push({
          id: mr.id ?? '',
          resourceType: 'MedicationRequest',
          type: 'MEDICATION',
          patientId: mr.subject?.reference?.split('/')?.[1] ?? patientId ?? '',
          patientName: mr.subject?.display ?? '',
          status: mr.status ?? 'unknown',
          orderText:
            mr.medicationCodeableConcept?.text ??
            mr.medicationCodeableConcept?.coding?.[0]?.display ??
            'Medication',
          orderedBy: mr.requester?.display,
          orderedAt: mr.authoredOn ?? '',
          priority: mr.priority ?? 'routine',
          notes: mr.note?.[0]?.text,
        });
      }

      // Sort by orderedAt descending
      return orders.sort(
        (a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime()
      );
    },
  });
}
