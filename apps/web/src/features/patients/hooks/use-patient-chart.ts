'use client';

import { useQueries } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import {
  formatPatientName,
  formatPatientMRN,
  getPatientAge,
  getActiveEncounter,
  isObservationCritical,
  formatObservationValue,
} from '@lotto-emr/core';
import type { PatientChartData } from '../types';
import { formatDate } from '@/shared/lib/utils';

/**
 * Composite hook that fetches all data needed for the patient chart in parallel:
 * - Patient demographics
 * - Active encounter
 * - Active conditions
 * - Allergies
 * - Recent observations (last 20)
 * - Active medication requests
 */
export function usePatientChart(patientId: string) {
  const medplum = useMedplum();

  const [patientQuery, encountersQuery, conditionsQuery, allergiesQuery, observationsQuery, medsQuery] =
    useQueries({
      queries: [
        {
          queryKey: ['patient', patientId],
          queryFn: () => medplum.readResource('Patient', patientId),
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
        {
          queryKey: ['conditions', patientId],
          queryFn: () =>
            medplum.searchResources('Condition', {
              patient: `Patient/${patientId}`,
              'clinical-status': 'active',
              _count: '20',
            }),
          enabled: !!patientId,
        },
        {
          queryKey: ['allergies', patientId],
          queryFn: () =>
            medplum.searchResources('AllergyIntolerance', {
              patient: `Patient/${patientId}`,
              'clinical-status': 'active',
            }),
          enabled: !!patientId,
        },
        {
          queryKey: ['observations', patientId, 'recent'],
          queryFn: () =>
            medplum.searchResources('Observation', {
              patient: `Patient/${patientId}`,
              _sort: '-date',
              _count: '20',
            }),
          enabled: !!patientId,
        },
        {
          queryKey: ['medications', patientId],
          queryFn: () =>
            medplum.searchResources('MedicationRequest', {
              patient: `Patient/${patientId}`,
              status: 'active',
              _sort: '-date',
              _count: '20',
            }),
          enabled: !!patientId,
        },
      ],
    });

  const isLoading =
    patientQuery.isLoading ||
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

  let chartData: PatientChartData | null = null;

  if (patientQuery.data) {
    const patient = patientQuery.data;
    const encounters = encountersQuery.data ?? [];
    const conditions = conditionsQuery.data ?? [];
    const allergies = allergiesQuery.data ?? [];
    const observations = observationsQuery.data ?? [];
    const medications = medsQuery.data ?? [];

    const activeEncounter = getActiveEncounter(encounters as any);

    chartData = {
      patient: {
        id: patient.id ?? '',
        mrn: formatPatientMRN(patient),
        fullName: formatPatientName(patient.name),
        givenName: patient.name?.[0]?.given?.[0] ?? '',
        familyName: patient.name?.[0]?.family ?? '',
        dateOfBirth: patient.birthDate ?? '',
        age: getPatientAge(patient.birthDate),
        gender: (patient.gender ?? 'unknown') as PatientChartData['patient']['gender'],
        phone: patient.telecom?.find((t) => t.system === 'phone')?.value,
        activeConditionsCount: conditions.length,
        allergiesCount: allergies.length,
      },
      activeEncounterId: activeEncounter?.id,
      activeConditions: conditions.map((c: any) => ({
        id: c.id ?? '',
        text: c.code?.text ?? c.code?.coding?.[0]?.display ?? 'Unknown condition',
        onsetDate: c.onsetDateTime ? formatDate(c.onsetDateTime) : undefined,
      })),
      allergies: allergies.map((a: any) => ({
        id: a.id ?? '',
        substance:
          a.code?.text ??
          a.code?.coding?.[0]?.display ??
          a.reaction?.[0]?.substance?.text ??
          'Unknown',
        reaction: a.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display,
        severity: a.reaction?.[0]?.severity,
      })),
      recentObservations: observations.map((obs: any) => ({
        id: obs.id ?? '',
        name: obs.code?.text ?? obs.code?.coding?.[0]?.display ?? 'Observation',
        value: formatObservationValue(obs),
        date: formatDate(obs.effectiveDateTime ?? obs.issued),
        isCritical: isObservationCritical(obs) !== 'normal',
      })),
      activeMedications: medications.map((med: any) => ({
        id: med.id ?? '',
        name:
          med.medicationCodeableConcept?.text ??
          med.medicationCodeableConcept?.coding?.[0]?.display ??
          'Medication',
        dose:
          med.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity
            ? `${med.dosageInstruction[0].doseAndRate[0].doseQuantity.value} ${med.dosageInstruction[0].doseAndRate[0].doseQuantity.unit}`
            : 'Dose not specified',
        frequency: med.dosageInstruction?.[0]?.timing?.code?.text ?? 'Frequency not specified',
      })),
    };
  }

  return { chartData, isLoading, error };
}
