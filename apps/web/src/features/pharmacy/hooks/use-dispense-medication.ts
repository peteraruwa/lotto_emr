'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { MedicationDispense } from '@medplum/fhirtypes';
import type { DispenseRecord } from '../types';
import { parsePharmacyNote } from './use-prescription-queue';

interface DispenseInput {
  prescriptionId: string;
  patientId: string;
  drugName: string;
  quantity: number;
  isPartial: boolean;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
  pharmacistId: string;
  pharmacistName: string;
  witnessId?: string;
  witnessName?: string;
}

export function useDispenseMedication() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: DispenseInput) => {
      const now = new Date().toISOString();

      // Create MedicationDispense FHIR resource
      const dispense: MedicationDispense = {
        resourceType: 'MedicationDispense',
        status: input.isPartial ? 'in-progress' : 'completed',
        medicationCodeableConcept: { text: input.drugName } as any,
        subject: { reference: `Patient/${input.patientId}` },
        authorizingPrescription: [{ reference: `MedicationRequest/${input.prescriptionId}` }],
        quantity: { value: input.quantity },
        whenHandedOver: now,
        performer: [{ actor: { reference: `Practitioner/${input.pharmacistId}`, display: input.pharmacistName } }],
        note: input.notes ? [{ text: input.notes }] : undefined,
      } as any;

      const created = await medplum.createResource(dispense);

      // Update the MedicationRequest note with dispense record
      const req = await medplum.readResource('MedicationRequest', input.prescriptionId) as any;
      const note = parsePharmacyNote(req.note?.[0]?.text);

      const dispenseRecord: DispenseRecord = {
        id: (created as any).id ?? `disp-${Date.now()}`,
        pharmacistId: input.pharmacistId,
        pharmacistName: input.pharmacistName,
        dispensedAt: now,
        quantity: input.quantity,
        batchNumber: input.batchNumber,
        expiryDate: input.expiryDate,
        notes: input.notes,
        isPartial: input.isPartial,
        witnessId: input.witnessId,
        witnessName: input.witnessName,
      };

      note.dispensed = dispenseRecord;
      note.pharmacyStatus = input.isPartial ? 'dispensing' : 'dispensed';
      note.auditLog = [
        ...(note.auditLog ?? []),
        {
          id: `audit-${Date.now()}`,
          action: input.isPartial ? 'partial-dispense' : 'dispensed',
          prescriptionId: input.prescriptionId,
          drugName: input.drugName,
          pharmacistId: input.pharmacistId,
          pharmacistName: input.pharmacistName,
          at: now,
          details: `Qty: ${input.quantity}${input.isPartial ? ' (partial)' : ''}${input.batchNumber ? `, Batch: ${input.batchNumber}` : ''}`,
        },
      ];

      return medplum.updateResource({
        ...req,
        status: input.isPartial ? 'active' : 'completed',
        note: [
          { text: JSON.stringify(note) },
          ...(req.note?.slice(1) ?? []),
        ],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-queue'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-audit'] });
    },
  });
}
