'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { formatPatientName, formatPatientMRN, getPatientAge } from '@lotto-emr/core';
import type { PatientListItem } from '../types';

/**
 * Fetches a single Patient by ID from Medplum.
 */
export function usePatient(patientId: string | undefined) {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const patient = await medplum.readResource('Patient', patientId as string);

      return {
        id: patient.id ?? '',
        mrn: formatPatientMRN(patient),
        fullName: formatPatientName(patient.name),
        givenName: patient.name?.[0]?.given?.[0] ?? '',
        familyName: patient.name?.[0]?.family ?? '',
        dateOfBirth: patient.birthDate ?? '',
        age: getPatientAge(patient.birthDate),
        gender: (patient.gender ?? 'unknown') as PatientListItem['gender'],
        phone: patient.telecom?.find((t) => t.system === 'phone')?.value,
        email: patient.telecom?.find((t) => t.system === 'email')?.value,
        activeConditionsCount: 0,
        allergiesCount: 0,
      } satisfies PatientListItem;
    },
    enabled: !!patientId,
  });
}
