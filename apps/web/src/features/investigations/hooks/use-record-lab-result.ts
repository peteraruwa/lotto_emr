'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Observation, DiagnosticReport, ServiceRequest } from '@medplum/fhirtypes';
import type { LabResultEntry } from '../types';

const INTERP_MAP: Record<string, string> = {
  'normal': 'N', 'low': 'L', 'high': 'H', 'critical-low': 'LL', 'critical-high': 'HH',
};

export interface RecordLabResultInput {
  orderId: string;
  patientId: string;
  encounterId?: string;
  testName: string;
  entries: LabResultEntry[];
  notes?: string;
  verify?: boolean;     // if true, status='final'; else 'preliminary'
}

export function useRecordLabResult() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordLabResultInput) => {
      const now = new Date().toISOString();
      const status = input.verify ? 'final' : 'preliminary';
      const hasCritical = input.entries.some(e => e.interpretation === 'critical-low' || e.interpretation === 'critical-high');

      // Create one Observation per analyte
      const observations = await Promise.all(
        input.entries.map(entry =>
          medplum.createResource({
            resourceType: 'Observation',
            status,
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
            code: { text: entry.analyte },
            subject: { reference: `Patient/${input.patientId}` },
            ...(input.encounterId ? { encounter: { reference: `Encounter/${input.encounterId}` } } : {}),
            effectiveDateTime: now,
            valueString: `${entry.value} ${entry.unit}`.trim(),
            referenceRange: entry.referenceRange ? [{ text: entry.referenceRange }] : undefined,
            interpretation: [{ coding: [{ code: INTERP_MAP[entry.interpretation] ?? 'N' }] }],
            ...(hasCritical ? { extension: [{ url: 'https://lotto-hospital.local/fhir/critical-value', valueBoolean: true }] } : {}),
          } as Observation)
        )
      );

      // Create DiagnosticReport linking all observations
      const report = await medplum.createResource({
        resourceType: 'DiagnosticReport',
        status,
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB' }] }],
        code: { text: input.testName },
        subject: { reference: `Patient/${input.patientId}` },
        ...(input.encounterId ? { encounter: { reference: `Encounter/${input.encounterId}` } } : {}),
        issued: now,
        result: observations.map(o => ({ reference: `Observation/${o.id}` })),
        note: input.notes ? [{ text: input.notes }] : undefined,
        extension: hasCritical ? [{ url: 'https://lotto-hospital.local/fhir/critical-value', valueBoolean: true }] : undefined,
      } as DiagnosticReport);

      // Mark ServiceRequest as completed
      const sr = await medplum.readResource('ServiceRequest', input.orderId);
      await medplum.updateResource({ ...sr, status: 'completed' } as ServiceRequest);

      return { observations, report };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-orders'] });
      qc.invalidateQueries({ queryKey: ['inv-orders-completed'] });
    },
  });
}
