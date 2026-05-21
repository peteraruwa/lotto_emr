'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { BillingQueueItem, BillingStatus } from '../types';

function parseRequestGroupStatus(fhirStatus: string): BillingStatus {
  if (fhirStatus === 'completed') return 'approved';
  if (fhirStatus === 'revoked') return 'denied';
  return 'pending';
}

export function useBillingData() {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['billing-queue'],
    queryFn: async (): Promise<BillingQueueItem[]> => {
      // Fetch RequestGroups with active and completed/revoked statuses
      const [active, completed, revoked] = await Promise.all([
        medplum.searchResources('RequestGroup', {
          status: 'active',
          _sort: '-authored',
          _count: '30',
        }),
        medplum.searchResources('RequestGroup', {
          status: 'completed',
          _sort: '-authored',
          _count: '30',
        }),
        medplum.searchResources('RequestGroup', {
          status: 'revoked',
          _sort: '-authored',
          _count: '30',
        }),
      ]);

      const allGroups = [...active, ...completed, ...revoked];

      return allGroups.map((rg: any) => {
        let parsedNote: any = {};
        try {
          parsedNote = JSON.parse(rg.note?.[0]?.text ?? '{}');
        } catch {
          parsedNote = {};
        }

        const items: any[] = parsedNote.items ?? [];
        const totalEstimate: number = parsedNote.totalEstimate ?? 0;
        const paymentMode: string = parsedNote.paymentMode ?? 'cash';
        const patientId =
          rg.subject?.reference?.replace('Patient/', '') ?? '';
        const patientName = rg.subject?.display ?? 'Unknown Patient';

        return {
          basketId: rg.id ?? '',
          patientId,
          patientName,
          submittedAt: rg.authoredOn ?? rg.meta?.lastUpdated ?? '',
          itemCount: items.length,
          totalEstimate,
          paymentMode,
          status: parseRequestGroupStatus(rg.status ?? 'active'),
        } satisfies BillingQueueItem;
      }).sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    },
  });
}
