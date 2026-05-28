'use client';
import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Encounter, Patient, Bundle, BundleEntry, AllergyIntolerance } from '@medplum/fhirtypes';
import { differenceInDays, differenceInYears, parseISO } from 'date-fns';
import type { NursingPatient } from '../types';

const EXT_BLOOD_GROUP = 'https://lotto-hospital.local/fhir/StructureDefinition/blood-group';
const EXT_BT_CONSENT = 'https://lotto-hospital.local/fhir/StructureDefinition/blood-transfusion-consent';

export function useNursingPatients() {
  const medplum = useMedplum();

  return useQuery<NursingPatient[]>({
    queryKey: ['nursing-patients'],
    staleTime: 60_000,
    queryFn: async () => {
      // Fetch active inpatient + observation encounters with patients
      const bundle = await medplum.search('Encounter', {
        status: 'in-progress',
        class: 'IMP,OBSENC',
        _count: '50',
        _sort: '-date',
        _include: 'Encounter:patient',
      }) as Bundle;

      const entries: BundleEntry[] = bundle.entry ?? [];
      const encounters = entries.filter(e => e.resource?.resourceType === 'Encounter').map(e => e.resource as Encounter);
      const patientMap = new Map<string, Patient>();
      entries.filter(e => e.resource?.resourceType === 'Patient').forEach(e => {
        const p = e.resource as Patient;
        if (p.id) patientMap.set(p.id, p);
      });

      // Fetch allergies for each patient (batch)
      const patientIds = encounters.map(e => e.subject?.reference?.replace('Patient/', '')).filter(Boolean) as string[];
      const allergyMap = new Map<string, string[]>();
      if (patientIds.length > 0) {
        try {
          const allergyResults = await Promise.all(
            patientIds.slice(0, 20).map(pid =>
              medplum.searchResources('AllergyIntolerance', { patient: `Patient/${pid}` })
                .then(results => ({ pid, results: results as AllergyIntolerance[] }))
                .catch(() => ({ pid, results: [] }))
            )
          );
          allergyResults.forEach(({ pid, results }) => {
            allergyMap.set(pid, results.map(a => a.code?.text ?? a.code?.coding?.[0]?.display ?? 'Unknown').filter(Boolean));
          });
        } catch { /* ignore */ }
      }

      return encounters.map((enc): NursingPatient => {
        const patientId = enc.subject?.reference?.replace('Patient/', '') ?? '';
        const p = patientMap.get(patientId);

        let patientName = enc.subject?.display ?? 'Unknown Patient';
        let age = 0;
        let mrn = '—';
        let bloodGroup: string | undefined;
        let bloodTransfusionConsent: string | undefined;

        if (p) {
          const nameObj = p.name?.[0];
          if (nameObj) {
            patientName = `${nameObj.given?.join(' ') ?? ''} ${nameObj.family ?? ''}`.trim() || patientName;
          }
          if (p.birthDate) {
            try { age = differenceInYears(new Date(), parseISO(p.birthDate)); } catch {}
          }
          mrn = p.identifier?.find(i => i.system?.includes('mrn'))?.value ?? p.identifier?.[0]?.value ?? '—';
          bloodGroup = p.extension?.find(e => e.url === EXT_BLOOD_GROUP)?.valueString;
          bloodTransfusionConsent = p.extension?.find(e => e.url === EXT_BT_CONSENT)?.valueString;
        }

        const locationDisplay = enc.location?.[0]?.location?.display ?? '';
        const parts = locationDisplay.split(' - ');
        const ward = parts[0] || 'General Ward';
        const bed = parts[1] || locationDisplay || '—';

        const wardStatusExt = enc.extension?.find(e => e.url === 'https://lotto-hospital.local/fhir/StructureDefinition/ward-status')?.valueString;
        const status = (['stable','critical','observation','for-discharge'] as const).includes(wardStatusExt as any) ? wardStatusExt as NursingPatient['status'] : 'stable';

        const admissionDate = enc.period?.start ?? '';
        let daysAdmitted = 0;
        if (admissionDate) { try { daysAdmitted = Math.max(0, differenceInDays(new Date(), parseISO(admissionDate))); } catch {} }

        return {
          patientId,
          encounterId: enc.id ?? '',
          patientName,
          mrn,
          age,
          gender: p?.gender ?? 'unknown',
          ward,
          bed,
          status,
          daysAdmitted,
          admittingDiagnosis: enc.reasonCode?.[0]?.text ?? enc.reasonCode?.[0]?.coding?.[0]?.display ?? '—',
          allergies: allergyMap.get(patientId) ?? [],
          bloodGroup,
          bloodTransfusionConsent,
        };
      });
    },
  });
}
