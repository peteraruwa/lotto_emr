'use client';
import { useMemo } from 'react';
import type { PharmacyPrescription, PharmacyAuditEntry } from '../types';

export interface AuditWithContext extends PharmacyAuditEntry {
  drugName: string;
  patientName: string;
}

export function usePharmacyAudit(prescriptions: PharmacyPrescription[]): AuditWithContext[] {
  return useMemo(() => {
    const entries: AuditWithContext[] = [];
    for (const rx of prescriptions) {
      for (const entry of rx.auditLog) {
        entries.push({
          ...entry,
          drugName: rx.drugName,
          patientName: rx.patientName,
        });
      }
    }
    return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [prescriptions]);
}
