'use client';

import { useQueries } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Patient, Observation, Encounter, AllergyIntolerance, Condition, Coverage, MedicationRequest } from '@medplum/fhirtypes';
import { formatPatientName, formatPatientMRN, getPatientAge, getActiveEncounter } from '@lotto-emr/core';
import { format, parseISO, isToday, isValid } from 'date-fns';

// ── Extension URLs ─────────────────────────────────────────────────────────────
const BLOOD_GROUP_URL = 'https://lotto-hospital.local/fhir/StructureDefinition/blood-group';
const GENOTYPE_URL = 'https://lotto-hospital.local/fhir/StructureDefinition/genotype';
const TRIBE_URL = 'https://lotto-hospital.local/fhir/StructureDefinition/tribe';
const RELIGION_URL = 'https://lotto-hospital.local/fhir/StructureDefinition/religion';

// ── LOINC codes for vitals ─────────────────────────────────────────────────────
const LOINC_BP = '55284-4';
const LOINC_SYSTOLIC = '8480-6';
const LOINC_DIASTOLIC = '8462-4';
const LOINC_HR = '8867-4';
const LOINC_TEMP = '8310-5';
const LOINC_SPO2 = '59408-5';
const LOINC_WEIGHT = '29463-7';
const LOINC_HEIGHT = '8302-2';

function getExtension(patient: Patient, url: string): string | undefined {
  return patient.extension?.find((e) => e.url === url)?.valueString;
}

function getLoincCode(obs: Observation): string | undefined {
  return obs.code?.coding?.find((c) => c.system === 'http://loinc.org')?.code;
}

function formatVitalValue(obs: Observation): string {
  if (obs.valueQuantity) {
    return `${obs.valueQuantity.value} ${obs.valueQuantity.unit ?? ''}`.trim();
  }
  if (obs.valueString) return obs.valueString;
  return '';
}

function formatBP(obs: Observation): string {
  const systolic = obs.component?.find((c) =>
    c.code?.coding?.some((cod) => cod.code === LOINC_SYSTOLIC)
  );
  const diastolic = obs.component?.find((c) =>
    c.code?.coding?.some((cod) => cod.code === LOINC_DIASTOLIC)
  );
  if (systolic?.valueQuantity && diastolic?.valueQuantity) {
    return `${systolic.valueQuantity.value}/${diastolic.valueQuantity.value} mmHg`;
  }
  return formatVitalValue(obs);
}

export interface VitalRow {
  date: string; // YYYY-MM-DD
  isToday: boolean;
  bp: string;
  hr: string;
  temp: string;
  spo2: string;
  weight: string;
  height: string;
}

export interface EncounterRow {
  id: string;
  date: string;
  visitType: string;
  diagnosis: string;
  status: string;
}

export interface AllergyRow {
  id: string;
  substance: string;
  reaction?: string;
}

export interface PatientProfileData {
  // Biodata
  patient: Patient;
  mrn: string;
  fullName: string;
  age: number;
  sex: string;
  dob: string;
  bloodGroup: string;
  genotype: string;
  phone: string;
  address: string;
  hmo: string;
  tribe: string;
  religion: string;
  activeEncounterId?: string;
  allergies: AllergyRow[];
  conditions: Array<{ id: string; text: string }>;
  // Vitals
  latestVitals: VitalRow | null;
  vitalRows: VitalRow[];
  // Encounters
  encounters: EncounterRow[];
  // Medications (for note context)
  medications: Array<{ name: string }>;
}

export function usePatientProfile(patientId: string) {
  const medplum = useMedplum();

  const [
    patientQuery,
    coverageQuery,
    encountersQuery,
    conditionsQuery,
    allergiesQuery,
    observationsQuery,
    medsQuery,
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
          medplum.searchResources('Coverage', {
            patient: `Patient/${patientId}`,
            _count: '5',
          }),
        enabled: !!patientId,
      },
      {
        queryKey: ['encounters', patientId, 'all'],
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
            _count: '30',
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
        queryKey: ['vitals', patientId],
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
            _count: '20',
          }),
        enabled: !!patientId,
      },
    ],
  });

  const isLoading =
    patientQuery.isLoading ||
    coverageQuery.isLoading ||
    encountersQuery.isLoading ||
    conditionsQuery.isLoading ||
    allergiesQuery.isLoading ||
    observationsQuery.isLoading ||
    medsQuery.isLoading;

  const error =
    patientQuery.error ||
    encountersQuery.error ||
    conditionsQuery.error ||
    allergiesQuery.error ||
    observationsQuery.error ||
    medsQuery.error;

  let profileData: PatientProfileData | null = null;

  if (patientQuery.data) {
    const patient = patientQuery.data as Patient;
    const coverages = (coverageQuery.data ?? []) as Coverage[];
    const encounters = (encountersQuery.data ?? []) as Encounter[];
    const conditions = (conditionsQuery.data ?? []) as Condition[];
    const rawAllergies = (allergiesQuery.data ?? []) as AllergyIntolerance[];
    const observations = (observationsQuery.data ?? []) as Observation[];
    const medications = (medsQuery.data ?? []) as MedicationRequest[];

    // ── Active encounter ───────────────────────────────────────────────────────
    const activeEncounter = getActiveEncounter(encounters);

    // ── Biodata fields ─────────────────────────────────────────────────────────
    const phone = patient.telecom?.find((t) => t.system === 'phone')?.value ?? '—';
    const addr = patient.address?.[0];
    const addressParts = [addr?.city, addr?.state, addr?.country].filter(Boolean);
    const address = addressParts.length ? addressParts.join(', ') : '—';

    const hmo =
      coverages.length > 0
        ? (coverages[0].payor?.[0]?.display ?? coverages[0].payor?.[0]?.reference ?? 'N/A')
        : 'N/A';

    // ── Allergies ──────────────────────────────────────────────────────────────
    const allergies: AllergyRow[] = rawAllergies.map((a) => ({
      id: a.id ?? '',
      substance:
        a.code?.text ??
        a.code?.coding?.[0]?.display ??
        a.reaction?.[0]?.substance?.text ??
        'Unknown',
      reaction: a.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display,
    }));

    // ── Conditions ─────────────────────────────────────────────────────────────
    const conditionList = conditions.map((c) => ({
      id: c.id ?? '',
      text:
        c.code?.text ??
        c.code?.coding?.[0]?.display ??
        'Unknown condition',
    }));

    // ── Vitals grouping ────────────────────────────────────────────────────────
    // Group by date (YYYY-MM-DD)
    const vitalsByDate = new Map<string, Observation[]>();
    for (const obs of observations) {
      const dt = obs.effectiveDateTime ?? obs.issued;
      if (!dt) continue;
      const parsed = parseISO(dt);
      if (!isValid(parsed)) continue;
      const dateKey = format(parsed, 'yyyy-MM-dd');
      if (!vitalsByDate.has(dateKey)) vitalsByDate.set(dateKey, []);
      vitalsByDate.get(dateKey)!.push(obs);
    }

    function buildVitalRow(dateKey: string, group: Observation[]): VitalRow {
      const findByLoinc = (code: string) =>
        group.find((o) => getLoincCode(o) === code);

      const bpObs = findByLoinc(LOINC_BP);
      const hrObs = findByLoinc(LOINC_HR);
      const tempObs = findByLoinc(LOINC_TEMP);
      const spo2Obs = findByLoinc(LOINC_SPO2);
      const weightObs = findByLoinc(LOINC_WEIGHT);
      const heightObs = findByLoinc(LOINC_HEIGHT);

      const parsed = parseISO(dateKey);

      return {
        date: dateKey,
        isToday: isValid(parsed) && isToday(parsed),
        bp: bpObs ? formatBP(bpObs) : '—',
        hr: hrObs ? `${formatVitalValue(hrObs)} /min` : '—',
        temp: tempObs ? `${formatVitalValue(tempObs)} °C` : '—',
        spo2: spo2Obs ? `${formatVitalValue(spo2Obs)} %` : '—',
        weight: weightObs ? `${formatVitalValue(weightObs)} kg` : '—',
        height: heightObs ? `${formatVitalValue(heightObs)} cm` : '—',
      };
    }

    const sortedDates = Array.from(vitalsByDate.keys()).sort((a, b) => b.localeCompare(a));
    const vitalRows = sortedDates.map((d) => buildVitalRow(d, vitalsByDate.get(d)!));
    const latestVitals = vitalRows.length > 0 ? vitalRows[0] : null;

    // ── Encounter rows ─────────────────────────────────────────────────────────
    const encounterRows: EncounterRow[] = encounters.map((enc) => ({
      id: enc.id ?? '',
      date: enc.period?.start ?? '',
      visitType:
        enc.serviceType?.coding?.[0]?.display ??
        enc.serviceType?.text ??
        enc.type?.[0]?.text ??
        enc.type?.[0]?.coding?.[0]?.display ??
        'Encounter',
      diagnosis:
        enc.reasonCode?.[0]?.text ??
        enc.reasonCode?.[0]?.coding?.[0]?.display ??
        '—',
      status: enc.status ?? 'unknown',
    }));

    // ── Medications list ───────────────────────────────────────────────────────
    const medicationList = medications.map((med) => ({
      name:
        med.medicationCodeableConcept?.text ??
        med.medicationCodeableConcept?.coding?.[0]?.display ??
        'Medication',
    }));

    profileData = {
      patient,
      mrn: formatPatientMRN(patient),
      fullName: formatPatientName(patient.name),
      age: getPatientAge(patient.birthDate),
      sex: patient.gender
        ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
        : '—',
      dob: patient.birthDate ?? '—',
      bloodGroup: getExtension(patient, BLOOD_GROUP_URL) ?? '—',
      genotype: getExtension(patient, GENOTYPE_URL) ?? '—',
      phone,
      address,
      hmo,
      tribe: getExtension(patient, TRIBE_URL) ?? 'N/A',
      religion: getExtension(patient, RELIGION_URL) ?? 'N/A',
      activeEncounterId: activeEncounter?.id,
      allergies,
      conditions: conditionList,
      latestVitals,
      vitalRows,
      encounters: encounterRows,
      medications: medicationList,
    };
  }

  return { profileData, isLoading, error };
}
