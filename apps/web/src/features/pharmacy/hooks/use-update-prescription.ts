'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { MedicationRequest } from '@medplum/fhirtypes';
import type { PharmacyStatus, PharmacyAuditEntry, SafetyFlag } from '../types';
import { parsePharmacyNote } from './use-prescription-queue';

interface UpdateInput {
  prescriptionId: string;
  newStatus: PharmacyStatus;
  reason?: string;
  safetyFlags?: SafetyFlag[];
  safetyOverrideReason?: string;
  pharmacistId?: string;
  pharmacistName?: string;
  details?: string;
}

export function useUpdatePrescription() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateInput) => {
      const req = await medplum.readResource('MedicationRequest', input.prescriptionId) as MedicationRequest;
      const note = parsePharmacyNote(req.note?.[0]?.text);

      note.pharmacyStatus = input.newStatus;

      if (input.newStatus === 'verified' || input.newStatus === 'safety-cleared') {
        note.verifiedAt = new Date().toISOString();
        note.verifiedBy = input.pharmacistId;
        note.verifiedByName = input.pharmacistName;
      }
      if (input.newStatus === 'rejected') {
        note.rejectionReason = input.reason;
      }
      if (input.newStatus === 'on-hold') {
        note.holdReason = input.reason;
      }
      if (input.safetyFlags) {
        note.safetyFlags = input.safetyFlags;
      }
      if (input.safetyOverrideReason) {
        note.safetyOverridden = true;
        note.safetyOverrideReason = input.safetyOverrideReason;
      }

      const auditEntry: PharmacyAuditEntry = {
        id: `audit-${Date.now()}`,
        action: input.newStatus,
        prescriptionId: input.prescriptionId,
        pharmacistId: input.pharmacistId ?? 'system',
        pharmacistName: input.pharmacistName ?? 'Pharmacist',
        at: new Date().toISOString(),
        reason: input.reason,
        details: input.details,
      };
      note.auditLog = [...(note.auditLog ?? []), auditEntry];

      // Map pharmacy status to FHIR status
      const fhirStatus: MedicationRequest['status'] =
        input.newStatus === 'rejected' ? 'cancelled' :
        input.newStatus === 'on-hold'  ? 'on-hold' :
        input.newStatus === 'dispensed' ? 'completed' :
        'active';

      const updated: MedicationRequest = {
        ...req,
        status: fhirStatus,
        note: [
          { text: JSON.stringify(note) },
          ...(req.note?.slice(1) ?? []),
        ],
      };

      return medplum.updateResource(updated);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-queue'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-audit'] });
    },
  });
}
