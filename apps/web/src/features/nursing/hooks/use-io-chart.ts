'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Observation } from '@medplum/fhirtypes';
import { startOfDay } from 'date-fns';
import { FHIR_SYSTEMS } from '@/shared/constants/loinc';
import { IO_LOINC } from '../constants';
import type { IOEntry, IOSummary, IOSubtype } from '../types';

export function useIOChart(patientId: string) {
  const medplum = useMedplum();
  const qc = useQueryClient();

  const query = useQuery<IOSummary>({
    queryKey: ['nursing-io', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const observations = await medplum.searchResources('Observation', {
        patient: `Patient/${patientId}`,
        category: 'vital-signs',
        date: `ge${todayStart}`,
        _count: '100',
        _sort: '-date',
      }) as Observation[];

      const ioLoincs = new Set(Object.values(IO_LOINC));
      const ioObs = observations.filter(o => {
        const code = o.code?.coding?.find(c => c.system === FHIR_SYSTEMS.LOINC)?.code ?? '';
        return ioLoincs.has(code);
      });

      const entries: IOEntry[] = ioObs.map(o => {
        const loincCode = o.code?.coding?.find(c => c.system === FHIR_SYSTEMS.LOINC)?.code ?? '';
        const subtypeEntry = Object.entries(IO_LOINC).find(([_, v]) => v === loincCode);
        const subtype = (subtypeEntry?.[0] ?? 'other') as IOSubtype;
        const isOutput = ['urine', 'drain', 'emesis'].includes(subtype);
        return {
          id: o.id ?? '',
          patientId,
          type: isOutput ? 'output' : 'intake',
          subtype,
          amount: o.valueQuantity?.value ?? 0,
          note: o.note?.[0]?.text,
          recordedAt: o.effectiveDateTime ?? o.meta?.lastUpdated ?? '',
        };
      });

      const totalIntake = entries.filter(e => e.type === 'intake').reduce((s, e) => s + e.amount, 0);
      const totalOutput = entries.filter(e => e.type === 'output').reduce((s, e) => s + e.amount, 0);

      return { totalIntake, totalOutput, balance: totalIntake - totalOutput, entries };
    },
  });

  const add = useMutation({
    mutationFn: async ({ subtype, amount, note, encounterId }: { subtype: IOSubtype; amount: number; note?: string; encounterId: string }) => {
      const loincCode = IO_LOINC[subtype];
      if (!loincCode) throw new Error('Unknown IO type');
      const obs: Observation = {
        resourceType: 'Observation',
        status: 'final',
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'vital-signs' }] }],
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: loincCode }] },
        subject: { reference: `Patient/${patientId}` },
        encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: { value: amount, unit: 'mL', system: 'http://unitsofmeasure.org' },
        note: note ? [{ text: note }] : undefined,
      } as any;
      return medplum.createResource(obs);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nursing-io', patientId] });
    },
  });

  return { query, add };
}
