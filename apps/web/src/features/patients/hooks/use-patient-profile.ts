'use client';

import { useQueries } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Patient, Observation, Encounter, AllergyIntolerance, Condition, Coverage, MedicationRequest } from '@medplum/fhirtypes';
import { formatPatientName, formatPatientMRN, getPatientAge, getActiveEncounter } from '@lotto-emr/core';
import { format, parseISO, isValid, isToday } from 'date-fns';

// ── Extension URLs ──────────────────────────────────────────────────────────────
const EXT_BLOOD_GROUP = 'https://lotto-hospital.local/fhir/StructureDefinition/blood-group';
const EXT_GENOTYPE = 'https://lotto-hospital.local/fhir/StructureDefinition/genotype';
const EXT_TRIBE = 'https://lotto-hospital.local/fhir/StructureDefinition/tribe';
const EXT_RELIGION = 'https://lotto-hospital.local/fhir/StructureDefinition/religion';

// ── LOINC vital sign codes ──────────────────────────────────────────────────────
const VITAL_LOINC = {
  BP_PANEL: '55284-4',
  SYSTOLIC: '8480-6',
  DIASTOLIC: '8462-4',
  HR: '8867-4',
  TEMP: '8310-5',
  SPO2: '59408-5',
  WEIGHT: '29463-7',
  HEIGHT: '8302-2',
} as const;

// ── Helper to extract extension value ──────────────────────────────────────────
function getExtension(patient: Patient, url: string): string | undefined {
  return patient.extension?.find((e) => e.url === url)?.valueString;
}

// ── Vital row type ─────────────────────────────────────────────────────────────
export interface VitalRow {
  date: string;           // YYYY-MM-DD
  dateLabel: string;      // "15 Jan 2026"
  isToday: boolean;
  bp?: string;            // "120/80 mmHg"
  hr?: string;            // "72 /min"
  temp?: string;          // "36.5 °C"
  spo2?: string;          // "98 %"
  weight?: string;        // "70 kg"
  height?: string;        // "170 cm"
}

// ── Profile biodata ────────────────────────────────────────────────────────────
export interface PatientBiodata {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  sex: string;
  dateOfBirth: string;
  bloodGroup?: string;
  genotype?: string;
  phone?: string;
  address?: string;
  hmo?: string;
  tribe?: string;
  religion?: string;
  gender: string;
}

export interface AllergyEntry {
  id: string;
  substance: string;
  reaction?: string;
}

export interface ConditionEntry {
  id: string;
  text: string;
}

export interface EncounterEntry {
  id: string;
  date: string;
  visitType: string;
  diagnosis: string;
  status: string;
}

export interface MedicationEntry {
  id: string;
  name: string;
}

export interface PatientProfileData {
  biodata: PatientBiodata;
  hasActiveEncounter: boolean;
  allergies: AllergyEntry[];
  conditions: ConditionEntry[];
  vitalRows: VitalRow[];
  latestVitals: VitalRow | null;
  encounters: EncounterEntry[];
  medications: MedicationEntry[];
}

// ── Helper to format a vital observation value ─────────────────────────────────
function formatVitalValue(obs: Observation, unit: string): string | undefined {
  const val = obs.valueQuantity?.value;
  if (val === undefined) return undefined;
  return `${val} ${unit}`;
}

// ── Build vital rows from a flat list of vital observations ───────────────────
function buildVitalRows(observations: Observation[]): VitalRow[] {
  // Group by date (YYYY-MM-DD)
  const grouped: Map<string, Observation[]> = new Map();
  for (const obs of observations) {
    const dateStr = obs.effectiveDateTime?.slice(0, 10);
    if (!dateStr) continue;
    if (!grouped.has(dateStr)) grouped.set(dateStr, []);
    grouped.get(dateStr)!.push(obs);
  }

  // Sort dates descending
  const sortedDates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  return sortedDates.map((dateStr) => {
    const dayObs = grouped.get(dateStr)!;
    const parsedDate = parseISO(dateStr);
    const dateLabel = isValid(parsedDate) ? format(parsedDate, 'd MMM yyyy') : dateStr;
    const isTodayFlag = isValid(parsedDate) && isToday(parsedDate);

    let bp: string | undefined;
    let hr: string | undefined;
    let temp: string | undefined;
    let spo2: string | undefined;
    let weight: string | undefined;
    let height: string | undefined;

    for (const obs of dayObs) {
      const loincCode = obs.code?.coding?.find((c) => c.system === 'http://loinc.org')?.code;

      if (loincCode === VITAL_LOINC.BP_PANEL) {
        // Blood pressure panel with components
        const systolicComp = obs.component?.find((comp) =>
          comp.code?.coding?.some((c) => c.code === VITAL_LOINC.SYSTOLIC)
        );
        const diastolicComp = obs.component?.find((comp) =>
          comp.code?.coding?.some((c) => c.code === VITAL_LOINC.DIASTOLIC)
        );
        if (systolicComp?.valueQuantity?.value !== undefined && diastolicComp?.valueQuantity?.value !== undefined) {
          bp = `${systolicComp.valueQuantity.value}/${diastolicComp.valueQuantity.value} mmHg`;
        }
      } else if (loincCode === VITAL_LOINC.HR) {
        hr = formatVitalValue(obs, '/min');
      } else if (loincCode === VITAL_LOINC.TEMP) {
        temp = formatVitalValue(obs, '°C');
      } else if (loincCode === VITAL_LOINC.SPO2) {
        spo2 = formatVitalValue(obs, '%');
      } else if (loincCode === VITAL_LOINC.WEIGHT) {
        weight = formatVitalValue(obs, 'kg');
      } else if (loincCode === VITAL_LOINC.HEIGHT) {
        height = formatVitalValue(obs, 'cm');
      }
    }

    return { date: dateStr, dateLabel, isToday: isTodayFlag, bp, hr, temp, spo2, weight, height };
  });
}

// ── Main hook ──────────────────────────────────────────────────────────────────
export function usePatientProfile(patientId: string) {
  const medplum = useMedplum();

  const [
    patientQ,
    coverageQ,
    encountersQ,
    conditionsQ,
    allergiesQ,
    vitalsQ,
    medsQ,
    activeEncountersQ,
  ] = useQueries({
    queries: [
      {
        queryKey: ['patient', patientId],
        queryFn: () => medplum.readResource('Patient', patientId),
        enabled: !!patientId,
      },
      {
        queryKey: ['coverage', patientId],
        queryFn: () =>
          medplum.searchResources('Coverage', { patient: `Patient/${patientId}` }),
        enabled: !!patientId,
      },
      {
        queryKey: ['encounters-all', patientId],
        queryFn: () =>
          medplum.searchResources('Encounter', {
            patient: `Patient/${patientId}`,
            _sort: '-date',
            _count: '20',
          }),
        enabled: !!patientId,
      },
      {
        queryKey: ['conditions', patientId, 'active'],
        queryFn: () =>
          medplum.searchResources('Condition', {
            patient: `Patient/${patientId}`,
            'clinical-status': 'active',
            _count: '20',
          }),
        enabled: !!patientId,
      },
      {
        queryKey: ['allergies', patientId, 'active'],
        queryFn: () =>
          medplum.searchResources('AllergyIntolerance', {
            patient: `Patient/${patientId}`,
            'clinical-status': 'active',
          }),
        enabled: !!patientId,
      },
      {
        queryKey: ['observations', patientId, 'vital-signs'],
        queryFn: () =>
          medplum.searchResources('Observation', {
            patient: `Patient/${patientId}`,
            category: 'vital-signs',
            _sort: '-date',
            _count: '50',
          }),
        enabled: !!patientId,
      },
      {
        queryKey: ['medications', patientId, 'active'],
        queryFn: () =>
          medplum.searchResources('MedicationRequest', {
            patient: `Patient/${patientId}`,
            status: 'active',
            _sort: '-date',
            _count: '20',
          }),
        enabled: !!patientId,
      },
      {
        queryKey: ['encounters', patientId, 'active'],
        queryFn: () =>
          medplum.searchResources('Encounter', {
            patient: `Patient/${patientId}`,
            status: 'in-progress,arrived,triaged',
            _sort: '-date',
            _count: '5',
          }),
        enabled: !!patientId,
      },
    ],
  });

  const isLoading = patientQ.isLoading;

  const error = patientQ.error;

  let profileData: PatientProfileData | null = null;

  if (patientQ.data) {
    const patient = patientQ.data as Patient;
    const coverages = (coverageQ.data ?? []) as Coverage[];
    const encounters = (encountersQ.data ?? []) as Encounter[];
    const activeEncounters = (activeEncountersQ.data ?? []) as Encounter[];
    const conditions = (conditionsQ.data ?? []) as Condition[];
    const allergies = (allergiesQ.data ?? []) as AllergyIntolerance[];
    const observations = (vitalsQ.data ?? []) as Observation[];
    const medications = (medsQ.data ?? []) as MedicationRequest[];

    // Active encounter check
    const activeEncounter = getActiveEncounter(activeEncounters);

    // Address
    const addr = patient.address?.[0];
    const addressParts = [addr?.city, addr?.state, addr?.country].filter(Boolean);
    const addressStr = addressParts.length > 0 ? addressParts.join(', ') : undefined;

    // HMO/Insurance
    const hmo = coverages.length > 0
      ? (coverages[0].payor?.[0]?.display ?? coverages[0].payor?.[0]?.reference ?? 'N/A')
      : 'N/A';

    // Biodata
    const biodata: PatientBiodata = {
      id: patient.id ?? '',
      mrn: formatPatientMRN(patient),
      fullName: formatPatientName(patient.name),
      age: getPatientAge(patient.birthDate),
      sex: patient.gender ?? 'unknown',
      dateOfBirth: patient.birthDate ?? '',
      bloodGroup: getExtension(patient, EXT_BLOOD_GROUP),
      genotype: getExtension(patient, EXT_GENOTYPE),
      phone: patient.telecom?.find((t) => t.system === 'phone')?.value,
      address: addressStr,
      hmo,
      tribe: getExtension(patient, EXT_TRIBE) ?? 'N/A',
      religion: getExtension(patient, EXT_RELIGION) ?? 'N/A',
      gender: patient.gender ?? 'unknown',
    };

    // Allergies
    const allergyEntries: AllergyEntry[] = allergies.map((a) => ({
      id: a.id ?? '',
      substance:
        a.code?.text ??
        a.code?.coding?.[0]?.display ??
        (a as any).reaction?.[0]?.substance?.text ??
        'Unknown allergen',
      reaction: (a as any).reaction?.[0]?.manifestation?.[0]?.text ??
        (a as any).reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display,
    }));

    // Conditions
    const conditionEntries: ConditionEntry[] = conditions.map((c) => ({
      id: c.id ?? '',
      text:
        c.code?.text ??
        c.code?.coding?.[0]?.display ??
        'Unknown condition',
    }));

    // Vital rows
    const vitalRows = buildVitalRows(observations);
    const latestVitals = vitalRows.length > 0 ? vitalRows[0] : null;

    // Encounter entries
    const encounterEntries: EncounterEntry[] = encounters.map((e) => ({
      id: e.id ?? '',
      date: e.period?.start ?? '',
      visitType:
        (e as any).serviceType?.[0]?.text ??
        e.type?.[0]?.text ??
        e.type?.[0]?.coding?.[0]?.display ??
        'Encounter',
      diagnosis:
        e.reasonCode?.[0]?.text ??
        e.reasonCode?.[0]?.coding?.[0]?.display ??
        '—',
      status: e.status ?? 'unknown',
    }));

    // Medications
    const medicationEntries: MedicationEntry[] = medications.map((m) => ({
      id: m.id ?? '',
      name:
        (m as any).medicationCodeableConcept?.text ??
        (m as any).medicationCodeableConcept?.coding?.[0]?.display ??
        'Medication',
    }));

    profileData = {
      biodata,
      hasActiveEncounter: !!activeEncounter,
      allergies: allergyEntries,
      conditions: conditionEntries,
      vitalRows,
      latestVitals,
      encounters: encounterEntries,
      medications: medicationEntries,
    };
  }

  return { profileData, isLoading, error };
}
