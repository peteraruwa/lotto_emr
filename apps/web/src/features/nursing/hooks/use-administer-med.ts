'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { MedicationAdministration } from '@medplum/fhirtypes';

interface AdministerInput {
  requestId: string;
  patientId: string;
  drugName: string;
  dose: string;
  route: string;
  action: 'completed' | 'on-hold' | 'not-done';
  reason?: string;
  scheduledTime: string; // ISO
}

export function useAdministerMed() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdministerInput) => {
      const now = new Date().toISOString();
      const resource: MedicationAdministration = {
        resourceType: 'MedicationAdministration',
        status: input.action,
        subject: { reference: `Patient/${input.patientId}` },
        request: { reference: `MedicationRequest/${input.requestId}` },
        effectiveDateTime: now,
        medicationCodeableConcept: { text: input.drugName },
        dosage: {
          text: input.dose,
          route: input.route ? { text: input.route } : undefined,
        },
        ...(input.reason ? { statusReason: [{ text: input.reason }] } : {}),
        note: input.reason ? [{ text: input.reason }] : undefined,
      } as any;
      return medplum.createResource(resource);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nursing-med-queue'] });
    },
  });
}
