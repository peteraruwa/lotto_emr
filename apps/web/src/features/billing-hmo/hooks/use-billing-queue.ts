'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { FullBillingItem, BillingNote, FullBillingStatus } from '../types';

function parseBillingNote(raw: string): BillingNote {
  try {
    const parsed = JSON.parse(raw);
    return {
      billingStatus: parsed.billingStatus ?? 'init',
      paymentMode: parsed.paymentMode ?? 'cash',
      items: parsed.items ?? [],
      totalEstimate: parsed.totalEstimate ?? 0,
      isEmergency: parsed.isEmergency ?? false,
      invoiceNumber: parsed.invoiceNumber,
      invoiceDate: parsed.invoiceDate,
      hmoVerification: parsed.hmoVerification,
      payments: parsed.payments ?? [],
      denialReason: parsed.denialReason,
      deferredReason: parsed.deferredReason,
      auditLog: parsed.auditLog ?? [],
    };
  } catch {
    return {
      billingStatus: 'init',
      paymentMode: 'cash',
      items: [],
      totalEstimate: 0,
    };
  }
}

export function useBillingQueue(_statusFilter?: FullBillingStatus | 'all') {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['billing-queue-full'],
    queryFn: async (): Promise<FullBillingItem[]> => {
      const [active, completed, revoked] = await Promise.all([
        medplum.searchResources('RequestGroup', { status: 'active',    _sort: '-authored', _count: '50' }),
        medplum.searchResources('RequestGroup', { status: 'completed', _sort: '-authored', _count: '50' }),
        medplum.searchResources('RequestGroup', { status: 'revoked',   _sort: '-authored', _count: '50' }),
      ]);

      const all = [...active, ...completed, ...revoked];

      return all.map((rg: any): FullBillingItem => {
        const noteText = rg.note?.[0]?.text ?? '{}';
        const billingNote = parseBillingNote(noteText);

        return {
          basketId:    rg.id ?? '',
          patientId:   rg.subject?.reference?.replace('Patient/', '') ?? '',
          patientName: rg.subject?.display ?? 'Unknown Patient',
          encounterId: rg.encounter?.reference?.replace('Encounter/', ''),
          submittedAt: rg.authoredOn ?? rg.meta?.lastUpdated ?? '',
          billingNote,
          fhirStatus:  rg.status ?? 'active',
        };
      }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    },
  });
}
