'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Patient, Encounter, Observation } from '@medplum/fhirtypes';

/**
 * Fetches a single Patient by ID.
 */
export function usePatient(id: string | undefined) {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => medplum.readResource('Patient', id as string),
    enabled: !!id,
    select: (data): Patient => data,
  });
}

/**
 * Fetches all Encounters for a given patient, sorted by date descending.
 */
export function useEncounters(patientId: string | undefined) {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['encounters', patientId],
    queryFn: async () => {
      const bundle = await medplum.searchResources('Encounter', {
        patient: `Patient/${patientId}`,
        _sort: '-date',
        _count: '50',
      });
      return bundle;
    },
    enabled: !!patientId,
    select: (data): Encounter[] => data as Encounter[],
  });
}

/**
 * Fetches Observations (lab results, vitals) for a given patient, sorted by date descending.
 */
export function useObservations(patientId: string | undefined) {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['observations', patientId],
    queryFn: async () => {
      const bundle = await medplum.searchResources('Observation', {
        patient: `Patient/${patientId}`,
        _sort: '-date',
        _count: '100',
      });
      return bundle;
    },
    enabled: !!patientId,
    select: (data): Observation[] => data as Observation[],
  });
}
