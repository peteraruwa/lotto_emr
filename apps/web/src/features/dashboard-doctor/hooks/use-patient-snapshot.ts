'use client';

import { useQueries } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';

export interface VitalSign {
  code: string;
  label: string;
  value: string;
  unit: string;
  isCritical: boolean;
}

export interface PatientSnapshot {
  vitals: VitalSign[];
  conditions: Array<{ id: string; text: string }>;
  allergies: Array<{ id: string; substance: string; severity?: string }>;
  medications: Array<{ id: string; name: string; dose: string }>;
  activeEncounterId?: string;
}

function parseVital(obs: any): VitalSign | VitalSign[] {
  // Handle blood pressure panel (component)
  if (obs.component?.length) {
    return obs.component.map((c: any) => ({
      code:       c.code?.coding?.[0]?.code ?? '',
      label:      c.code?.coding?.[0]?.display ?? c.code?.text ?? 'Vital',
      value:      String(c.valueQuantity?.value ?? '—'),
      unit:       c.valueQuantity?.unit ?? '',
      isCritical: false,
    }));
  }
  return {
    code:       obs.code?.coding?.[0]?.code ?? '',
    label:      obs.code?.text ?? obs.code?.coding?.[0]?.display ?? 'Vital',
    value:      String(obs.valueQuantity?.value ?? obs.valueString ?? '—'),
    unit:       obs.valueQuantity?.unit ?? '',
    isCritical: false,
  };
}

export function usePatientSnapshot(patientId: string | null) {
  const medplum = useMedplum();

  const [obsQ, condQ, allergyQ, medQ, encQ] = useQueries({
    queries: [
      {
        queryKey: ['snapshot', 'obs', patientId],
        enabled: !!patientId,
        queryFn: () =>
          medplum.searchResources('Observation', {
            patient:   patientId!,
            category:  'vital-signs',
            _sort:     '-date',
            _count:    '10',
          }),
      },
      {
        queryKey: ['snapshot', 'cond', patientId],
        enabled: !!patientId,
        queryFn: () =>
          medplum.searchResources('Condition', {
            patient:  patientId!,
            'clinical-status': 'active',
            _count:   '20',
          }),
      },
      {
        queryKey: ['snapshot', 'allergy', patientId],
        enabled: !!patientId,
        queryFn: () =>
          medplum.searchResources('AllergyIntolerance', {
            patient: patientId!,
            _count:  '10',
          }),
      },
      {
        queryKey: ['snapshot', 'meds', patientId],
        enabled: !!patientId,
        queryFn: () =>
          medplum.searchResources('MedicationRequest', {
            patient: patientId!,
            status:  'active',
            _count:  '10',
          }),
      },
      {
        queryKey: ['snapshot', 'enc', patientId],
        enabled: !!patientId,
        queryFn: () =>
          medplum.searchResources('Encounter', {
            patient:  patientId!,
            status:   'in-progress,arrived',
            _count:   '1',
          }),
      },
    ],
  });

  const isLoading = obsQ.isLoading || condQ.isLoading || allergyQ.isLoading || medQ.isLoading || encQ.isLoading;

  if (!patientId) return { data: null, isLoading: false };
  if (isLoading)  return { data: null, isLoading: true };

  const vitals: VitalSign[] = (obsQ.data ?? []).flatMap((o: any) => {
    const v = parseVital(o);
    return Array.isArray(v) ? v : [v];
  });

  // Deduplicate vitals by LOINC code — keep most recent
  const seenCodes = new Set<string>();
  const dedupVitals = vitals.filter((v) => {
    if (seenCodes.has(v.code)) return false;
    seenCodes.add(v.code);
    return true;
  });

  const conditions = (condQ.data ?? []).map((c: any) => ({
    id:   c.id ?? '',
    text: c.code?.text ?? c.code?.coding?.[0]?.display ?? 'Condition',
  }));

  const allergies = (allergyQ.data ?? []).map((a: any) => ({
    id:        a.id ?? '',
    substance: a.code?.text ?? a.code?.coding?.[0]?.display ?? 'Allergen',
    severity:  a.reaction?.[0]?.severity,
  }));

  const medications = (medQ.data ?? []).map((m: any) => ({
    id:   m.id ?? '',
    name: m.medicationCodeableConcept?.text ?? m.medicationCodeableConcept?.coding?.[0]?.display ?? 'Medication',
    dose: m.dosageInstruction?.[0]?.text ?? '',
  }));

  const activeEncounterId = (encQ.data ?? [])[0]?.id;

  return {
    isLoading: false,
    data: { vitals: dedupVitals, conditions, allergies, medications, activeEncounterId } as PatientSnapshot,
  };
}
