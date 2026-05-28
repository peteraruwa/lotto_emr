'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Immunization, Bundle, BundleEntry, Patient } from '@medplum/fhirtypes';
import type { ImmunizationRecord } from '../types';

function parseImmunization(imm: Immunization): ImmunizationRecord {
  const coding = imm.vaccineCode?.coding?.[0];
  const doseExt = imm.protocolApplied?.[0];
  return {
    id: imm.id ?? '',
    patientId: imm.patient?.reference?.replace('Patient/', '') ?? '',
    patientName: imm.patient?.display ?? '',
    vaccineCode: coding?.code ?? '',
    vaccineName: imm.vaccineCode?.text ?? coding?.display ?? 'Unknown Vaccine',
    doseNumber: typeof doseExt?.doseNumberPositiveInt === 'number' ? doseExt.doseNumberPositiveInt : 1,
    seriesName: doseExt?.series,
    lotNumber: imm.lotNumber,
    expirationDate: imm.expirationDate,
    site: imm.site?.text ?? imm.site?.coding?.[0]?.display,
    route: imm.route?.text ?? imm.route?.coding?.[0]?.display,
    dose: imm.doseQuantity ? `${imm.doseQuantity.value} ${imm.doseQuantity.unit ?? ''}`.trim() : undefined,
    performer: imm.performer?.[0]?.actor?.display,
    occurrenceDateTime: (imm as any).occurrenceDateTime ?? imm.recorded ?? '',
    encounterId: imm.encounter?.reference?.replace('Encounter/', ''),
    status: imm.status === 'not-done' ? 'not-done' : imm.status === 'entered-in-error' ? 'entered-in-error' : 'completed',
    statusReason: imm.statusReason?.text ?? imm.statusReason?.coding?.[0]?.display,
    notes: imm.note?.[0]?.text,
  };
}

export function usePatientImmunizations(patientId: string | undefined) {
  const medplum = useMedplum();

  return useQuery<ImmunizationRecord[]>({
    queryKey: ['immunizations', patientId],
    enabled: !!patientId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!patientId) return [];
      const results = await medplum.searchResources('Immunization', {
        patient: `Patient/${patientId}`,
        _sort: '-date',
        _count: '100',
      }) as Immunization[];
      return results.map(parseImmunization);
    },
  });
}

export function useAllPatientsImmunizations(patientIds: string[]) {
  const medplum = useMedplum();

  return useQuery<ImmunizationRecord[]>({
    queryKey: ['immunizations-all', patientIds.join(',')],
    enabled: patientIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      if (patientIds.length === 0) return [];
      const results = await Promise.all(
        patientIds.slice(0, 20).map(pid =>
          medplum.searchResources('Immunization', { patient: `Patient/${pid}`, _sort: '-date', _count: '50' })
            .then(r => (r as Immunization[]).map(parseImmunization))
            .catch(() => [] as ImmunizationRecord[])
        )
      );
      return results.flat().sort((a, b) => b.occurrenceDateTime.localeCompare(a.occurrenceDateTime));
    },
  });
}

export interface RecordImmunizationInput {
  patientId: string;
  patientName: string;
  encounterId?: string;
  vaccineCode: string;
  vaccineName: string;
  doseNumber: number;
  seriesName?: string;
  lotNumber?: string;
  expirationDate?: string;
  site?: string;
  route?: string;
  doseVolume?: string;
  occurrenceDateTime: string;
  performerName?: string;
  notes?: string;
  statusReason?: string;
  status?: 'completed' | 'not-done';
}

export function useRecordImmunization() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordImmunizationInput) => {
      const resource: Immunization = {
        resourceType: 'Immunization',
        status: input.status ?? 'completed',
        ...(input.statusReason && input.status === 'not-done' ? {
          statusReason: { text: input.statusReason },
        } : {}),
        vaccineCode: {
          coding: [{ system: 'http://hl7.org/fhir/sid/cvx', code: input.vaccineCode, display: input.vaccineName }],
          text: input.vaccineName,
        },
        patient: { reference: `Patient/${input.patientId}`, display: input.patientName },
        ...(input.encounterId ? { encounter: { reference: `Encounter/${input.encounterId}` } } : {}),
        occurrenceDateTime: input.occurrenceDateTime,
        ...(input.lotNumber    ? { lotNumber: input.lotNumber } : {}),
        ...(input.expirationDate ? { expirationDate: input.expirationDate } : {}),
        ...(input.site   ? { site:  { text: input.site  } } : {}),
        ...(input.route  ? { route: { text: input.route } } : {}),
        ...(input.doseVolume ? {
          doseQuantity: { value: parseFloat(input.doseVolume), unit: input.doseVolume.replace(/[\d.]/g, '').trim() || 'mL' },
        } : {}),
        ...(input.performerName ? {
          performer: [{ actor: { display: input.performerName } }],
        } : {}),
        protocolApplied: [{
          doseNumberPositiveInt: input.doseNumber,
          ...(input.seriesName ? { series: input.seriesName } : {}),
        }],
        ...(input.notes ? { note: [{ text: input.notes }] } : {}),
        recorded: new Date().toISOString(),
      };
      return medplum.createResource(resource);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['immunizations', vars.patientId] });
      qc.invalidateQueries({ queryKey: ['immunizations-all'] });
    },
  });
}
