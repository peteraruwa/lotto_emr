'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Observation } from '@medplum/fhirtypes';
import { LOINC_VITALS, FHIR_SYSTEMS } from '@/shared/constants/loinc';
import type { VitalEntryForm } from '../types';

function makeObs(patientId: string, encounterId: string, loincCode: string, value: number, unit: string): Observation {
  return {
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'vital-signs' }] }],
    code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: loincCode }] },
    subject: { reference: `Patient/${patientId}` },
    encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
    effectiveDateTime: new Date().toISOString(),
    valueQuantity: { value, unit, system: 'http://unitsofmeasure.org' },
  } as any;
}

export function useVitalsQuick() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (form: VitalEntryForm) => {
      const obs: Observation[] = [];
      const { patientId, encounterId } = form;

      if (form.systolic !== undefined && form.diastolic !== undefined) {
        obs.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'vital-signs' }] }],
          code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.BP_PANEL }] },
          subject: { reference: `Patient/${patientId}` },
          encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
          effectiveDateTime: new Date().toISOString(),
          component: [
            { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.SYSTOLIC }] }, valueQuantity: { value: form.systolic, unit: 'mmHg' } },
            { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.DIASTOLIC }] }, valueQuantity: { value: form.diastolic, unit: 'mmHg' } },
          ],
        } as any);
      }
      if (form.hr !== undefined)     obs.push(makeObs(patientId, encounterId, LOINC_VITALS.HEART_RATE, form.hr, '/min'));
      if (form.temp !== undefined)   obs.push(makeObs(patientId, encounterId, LOINC_VITALS.TEMPERATURE, form.temp, '°C'));
      if (form.spo2 !== undefined)   obs.push(makeObs(patientId, encounterId, LOINC_VITALS.SPO2, form.spo2, '%'));
      if (form.rr !== undefined)     obs.push(makeObs(patientId, encounterId, LOINC_VITALS.RESPIRATORY_RATE, form.rr, '/min'));
      if (form.weight !== undefined) obs.push(makeObs(patientId, encounterId, LOINC_VITALS.BODY_WEIGHT, form.weight, 'kg'));

      return Promise.all(obs.map(o => medplum.createResource(o)));
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['patient', vars.patientId] });
      qc.invalidateQueries({ queryKey: ['observations', vars.patientId] });
      qc.invalidateQueries({ queryKey: ['nursing-patients'] });
    },
  });
}
