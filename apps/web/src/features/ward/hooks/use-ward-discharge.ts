'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Encounter } from '@medplum/fhirtypes';
import type { DischargeStatus } from '../types';

const DISCHARGE_STATUS_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/discharge-status';
const DISCHARGE_SUMMARY_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/discharge-summary';
const DISCHARGE_TYPE_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/discharge-type';
const DISCHARGE_FOLLOWUP_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/discharge-followup';

export interface UpdateDischargeInput {
  encounterId: string;
  status: DischargeStatus;
  summary?: string;
  followUp?: string;
  dischargeType?: string;
}

export function useUpdateDischargeStatus() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateDischargeInput) => {
      const enc = (await medplum.readResource('Encounter', input.encounterId)) as Encounter;

      const otherExts = (enc.extension ?? []).filter(e =>
        e.url !== DISCHARGE_STATUS_EXT &&
        e.url !== DISCHARGE_SUMMARY_EXT &&
        e.url !== DISCHARGE_TYPE_EXT &&
        e.url !== DISCHARGE_FOLLOWUP_EXT
      );

      const extensions = [
        ...otherExts,
        { url: DISCHARGE_STATUS_EXT, valueString: input.status },
        ...(input.summary ? [{ url: DISCHARGE_SUMMARY_EXT, valueString: input.summary }] : []),
        ...(input.dischargeType ? [{ url: DISCHARGE_TYPE_EXT, valueString: input.dischargeType }] : []),
        ...(input.followUp ? [{ url: DISCHARGE_FOLLOWUP_EXT, valueString: input.followUp }] : []),
      ];

      const isFinishing =
        input.status === 'completed' ||
        input.status === 'dama' ||
        input.status === 'death';

      const next: Encounter = {
        ...enc,
        status: isFinishing ? 'finished' : 'in-progress',
        extension: extensions,
        ...(isFinishing
          ? { period: { start: enc.period?.start, end: new Date().toISOString() } }
          : {}),
      };

      return medplum.updateResource(next);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ward-patients'] });
      qc.invalidateQueries({ queryKey: ['ward-data'] });
      qc.invalidateQueries({ queryKey: ['nursing-patients'] });
    },
  });
}
