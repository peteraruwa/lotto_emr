'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { FullBillingItem, BillingNote } from '../types';

function parseBillingNote(raw: string): BillingNote {
  try {
    const parsed = JSON.parse(raw);
    return {
      billingStatus:  parsed.billingStatus  ?? 'init',
      paymentMode:    parsed.paymentMode    ?? 'cash',
      items:          parsed.items          ?? [],
      totalEstimate:  parsed.totalEstimate  ?? 0,
      isEmergency:    parsed.isEmergency    ?? false,
      invoiceNumber:  parsed.invoiceNumber,
      invoiceDate:    parsed.invoiceDate,
      hmoVerification: parsed.hmoVerification,
      payments:       parsed.payments       ?? [],
      denialReason:   parsed.denialReason,
      deferredReason: parsed.deferredReason,
      auditLog:       parsed.auditLog       ?? [],
    };
  } catch {
    return { billingStatus: 'init', paymentMode: 'cash', items: [], totalEstimate: 0 };
  }
}

/**
 * Fetches all billing records for a specific patient.
 * Used by non-billing staff to view read-only billing status on the patient profile.
 */
export function usePatientBilling(patientId: string) {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['patient-billing', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<FullBillingItem[]> => {
      const [active, completed, revoked] = await Promise.all([
        medplum.searchResources('RequestGroup', {
          subject: `Patient/${patientId}`,
          status:  'active',
          _sort:   '-authored',
          _count:  '20',
        }),
        medplum.searchResources('RequestGroup', {
          subject: `Patient/${patientId}`,
          status:  'completed',
          _sort:   '-authored',
          _count:  '20',
        }),
        medplum.searchResources('RequestGroup', {
          subject: `Patient/${patientId}`,
          status:  'revoked',
          _sort:   '-authored',
          _count:  '20',
        }),
      ]);

      const all = [...active, ...completed, ...revoked];

      return all
        .map((rg: any): FullBillingItem => ({
          basketId:    rg.id ?? '',
          patientId:   rg.subject?.reference?.replace('Patient/', '') ?? '',
          patientName: rg.subject?.display ?? 'Unknown Patient',
          encounterId: rg.encounter?.reference?.replace('Encounter/', ''),
          submittedAt: rg.authoredOn ?? rg.meta?.lastUpdated ?? '',
          billingNote: parseBillingNote(rg.note?.[0]?.text ?? '{}'),
          fhirStatus:  rg.status ?? 'active',
        }))
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    },
  });
}
