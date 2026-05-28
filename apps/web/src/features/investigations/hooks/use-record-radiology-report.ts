'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { DiagnosticReport, ServiceRequest } from '@medplum/fhirtypes';
import type { ImagingModality } from '../types';

export interface RecordRadiologyReportInput {
  orderId: string;
  patientId: string;
  encounterId?: string;
  studyType: string;
  modality: ImagingModality;
  findings: string;
  impression: string;
  isCritical?: boolean;
  verify?: boolean;
  notes?: string;
  radiologistName?: string;
}

export function useRecordRadiologyReport() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordRadiologyReportInput) => {
      const now = new Date().toISOString();
      const status = input.verify ? 'final' : 'preliminary';

      const report = await medplum.createResource({
        resourceType: 'DiagnosticReport',
        status,
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'RAD' }] }],
        code: { text: input.studyType },
        subject: { reference: `Patient/${input.patientId}` },
        ...(input.encounterId ? { encounter: { reference: `Encounter/${input.encounterId}` } } : {}),
        issued: now,
        conclusion: `${input.findings}\n\nIMPRESSION:\n${input.impression}`,
        presentedForm: [{
          contentType: 'text/plain',
          title: `${input.studyType} Report`,
          data: btoa(`FINDINGS:\n${input.findings}\n\nIMPRESSION:\n${input.impression}${input.notes ? `\n\nNOTES:\n${input.notes}` : ''}`),
        }],
        performer: input.radiologistName ? [{ display: input.radiologistName }] : undefined,
        extension: [
          { url: 'https://lotto-hospital.local/fhir/radiology-modality', valueString: input.modality },
          ...(input.isCritical ? [{ url: 'https://lotto-hospital.local/fhir/critical-value', valueBoolean: true }] : []),
        ],
      } as DiagnosticReport);

      // Mark ServiceRequest completed
      const sr = await medplum.readResource('ServiceRequest', input.orderId);
      await medplum.updateResource({ ...sr, status: 'completed' } as ServiceRequest);

      return report;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-orders'] });
      qc.invalidateQueries({ queryKey: ['inv-orders-completed'] });
    },
  });
}
