'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Encounter, Patient, Bundle, BundleEntry } from '@medplum/fhirtypes';
import { differenceInDays, parseISO } from 'date-fns';

const WARD_STATUS_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/ward-status';

export interface WardPatient {
  encounterId: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  mrn: string;
  ward: string;
  bedNumber: string;
  admissionDate: string;
  admittingDiagnosis: string;
  status: 'stable' | 'critical' | 'observation' | 'for-discharge';
  daysAdmitted: number;
}

function extractWardStatus(encounter: Encounter): WardPatient['status'] {
  const ext = encounter.extension?.find((e) => e.url === WARD_STATUS_EXT);
  const val = ext?.valueString;
  if (val === 'critical' || val === 'observation' || val === 'for-discharge' || val === 'stable') {
    return val;
  }
  return 'stable';
}

function calcDaysAdmitted(admissionDate: string | undefined): number {
  if (!admissionDate) return 0;
  try {
    const start = parseISO(admissionDate);
    const days = differenceInDays(new Date(), start);
    return Math.max(0, days);
  } catch {
    return 0;
  }
}

export function useWardData() {
  const medplum = useMedplum();

  return useQuery<WardPatient[]>({
    queryKey: ['ward-patients'],
    queryFn: async () => {
      // Search active inpatient encounters with included patient resources
      const bundle = await medplum.search('Encounter', {
        class: 'IMP',
        status: 'in-progress',
        _count: '50',
        _sort: '-date',
        _include: 'Encounter:patient',
      }) as Bundle;

      const entries: BundleEntry[] = bundle.entry ?? [];

      // Separate encounters and patients
      const encounters: Encounter[] = entries
        .filter((e) => e.resource?.resourceType === 'Encounter')
        .map((e) => e.resource as Encounter);

      const patientMap: Map<string, Patient> = new Map();
      entries
        .filter((e) => e.resource?.resourceType === 'Patient')
        .forEach((e) => {
          const p = e.resource as Patient;
          if (p.id) patientMap.set(p.id, p);
        });

      return encounters.map((encounter): WardPatient => {
        const encounterId = encounter.id ?? '';
        const patientRef = encounter.subject?.reference ?? '';
        const patientId = patientRef.replace('Patient/', '');

        // Get patient name
        const patient = patientMap.get(patientId);
        let patientName = encounter.subject?.display ?? 'Unknown Patient';
        let age = 0;
        let gender = 'unknown';
        let mrn = '—';

        if (patient) {
          const nameObj = patient.name?.[0];
          if (nameObj) {
            const given = nameObj.given?.join(' ') ?? '';
            const family = nameObj.family ?? '';
            patientName = `${given} ${family}`.trim() || patientName;
          }
          gender = patient.gender ?? 'unknown';
          // Calculate age from birthDate
          if (patient.birthDate) {
            try {
              const birth = parseISO(patient.birthDate);
              age = differenceInDays(new Date(), birth);
              age = Math.floor(age / 365);
            } catch {
              age = 0;
            }
          }
          // MRN from identifier
          const mrnIdentifier = patient.identifier?.find(
            (i) => i.system === 'https://lotto-hospital.local/fhir/mrn' || i.type?.text === 'MRN'
          );
          mrn = mrnIdentifier?.value ?? patient.identifier?.[0]?.value ?? '—';
        }

        // Ward and bed extraction
        const locationDisplay = encounter.location?.[0]?.location?.display ?? '';
        const parts = locationDisplay.split(' - ');
        const ward = parts[0] || (encounter as any).serviceType?.text || 'General Ward';
        const bedNumber = parts[1] || locationDisplay || '—';

        const admissionDate = encounter.period?.start ?? '';
        const admittingDiagnosis =
          encounter.reasonCode?.[0]?.text ??
          encounter.reasonCode?.[0]?.coding?.[0]?.display ??
          '—';

        return {
          encounterId,
          patientId,
          patientName,
          age,
          gender,
          mrn,
          ward,
          bedNumber,
          admissionDate,
          admittingDiagnosis,
          status: extractWardStatus(encounter),
          daysAdmitted: calcDaysAdmitted(admissionDate),
        };
      });
    },
    staleTime: 60_000,
  });
}

export function useAdmitPatient() {
  const medplum = useMedplum();
  const [isAdmitting, setIsAdmitting] = useState(false);

  async function admitPatient(params: {
    patientId: string;
    ward: string;
    bedNumber: string;
    diagnosis: string;
    admissionType: 'emergency' | 'elective' | 'urgent';
  }): Promise<string> {
    setIsAdmitting(true);
    try {
      const enc = await medplum.createResource({
        resourceType: 'Encounter',
        status: 'in-progress',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'IMP',
          display: 'inpatient encounter',
        },
        type: [{ text: params.admissionType }],
        subject: { reference: `Patient/${params.patientId}` },
        period: { start: new Date().toISOString() },
        reasonCode: [{ text: params.diagnosis }],
        location: [
          {
            location: {
              display: `${params.ward} - Bed ${params.bedNumber}`,
            },
            status: 'active',
          },
        ],
      } as Encounter);
      return enc.id ?? '';
    } finally {
      setIsAdmitting(false);
    }
  }

  return { admitPatient, isAdmitting };
}
