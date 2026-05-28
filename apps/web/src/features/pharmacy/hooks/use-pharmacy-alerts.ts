'use client';
import { useMemo } from 'react';
import type { PharmacyPrescription, PharmacyAlert } from '../types';

export function usePharmacyAlerts(prescriptions: PharmacyPrescription[]): PharmacyAlert[] {
  return useMemo(() => {
    const alerts: PharmacyAlert[] = [];

    for (const rx of prescriptions) {
      // STAT orders pending review
      if (rx.priority === 'stat' && ['pending', 'under-review'].includes(rx.pharmacyStatus)) {
        alerts.push({
          id: `stat-${rx.id}`,
          type: 'stat',
          severity: 'critical',
          message: `STAT order pending — ${rx.drugName} for ${rx.patientName}`,
          prescriptionId: rx.id,
          patientName: rx.patientName,
          at: rx.authoredOn,
          actionRequired: true,
        });
      }

      // Critical allergy conflicts in any unverified prescription
      const allergyFlags = rx.safetyFlags.filter(f => f.type === 'allergy' && f.severity === 'critical');
      if (allergyFlags.length > 0 && !['dispensed', 'rejected'].includes(rx.pharmacyStatus)) {
        alerts.push({
          id: `allergy-${rx.id}`,
          type: 'allergy',
          severity: 'critical',
          message: `Allergy conflict — ${rx.drugName} for ${rx.patientName}: ${allergyFlags[0].message}`,
          prescriptionId: rx.id,
          patientName: rx.patientName,
          at: rx.authoredOn,
          actionRequired: true,
        });
      }

      // Critical drug interactions
      const critInteractions = rx.safetyFlags.filter(f => f.type === 'interaction' && f.severity === 'critical');
      if (critInteractions.length > 0 && !['dispensed', 'rejected'].includes(rx.pharmacyStatus)) {
        alerts.push({
          id: `interaction-${rx.id}`,
          type: 'interaction',
          severity: 'critical',
          message: `Critical interaction — ${rx.drugName} for ${rx.patientName}: ${critInteractions[0].message}`,
          prescriptionId: rx.id,
          patientName: rx.patientName,
          at: rx.authoredOn,
          actionRequired: true,
        });
      }

      // Controlled drug pending
      if (rx.isControlled && rx.pharmacyStatus === 'pending') {
        alerts.push({
          id: `cd-${rx.id}`,
          type: 'controlled-drug',
          severity: 'high',
          message: `Controlled drug request — ${rx.drugName} for ${rx.patientName}`,
          prescriptionId: rx.id,
          patientName: rx.patientName,
          at: rx.authoredOn,
          actionRequired: true,
        });
      }
    }

    return alerts.sort((a, b) => {
      const sev = { critical: 0, high: 1, moderate: 2 };
      return (sev[a.severity] ?? 9) - (sev[b.severity] ?? 9);
    });
  }, [prescriptions]);
}
