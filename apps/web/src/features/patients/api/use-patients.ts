'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { formatPatientName, formatPatientMRN, getPatientAge } from '@lotto-emr/core';
import type { PatientListItem } from '../types';

interface UsePatientsParams {
  search?: string;
  mrn?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetches the patient list from Medplum with optional search/filter parameters.
 * Maps raw FHIR Patient resources to PatientListItem DTOs.
 */
export function usePatients(params: UsePatientsParams = {}) {
  const medplum = useMedplum();
  const { search, mrn, page = 0, pageSize = 25 } = params;

  return useQuery({
    queryKey: ['patients', { search, mrn, page, pageSize }],
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        _count: String(pageSize),
        _offset: String(page * pageSize),
        _sort: 'family',
        active: 'true',
      };

      if (search) {
        searchParams['name'] = search;
      }

      if (mrn) {
        searchParams['identifier'] = `https://lotto-hospital.local/fhir/identifier/mrn|${mrn}`;
      }

      const patients = await medplum.searchResources('Patient', searchParams);

      return patients.map((patient): PatientListItem => ({
        id: patient.id ?? '',
        mrn: formatPatientMRN(patient),
        fullName: formatPatientName(patient.name),
        givenName: patient.name?.[0]?.given?.[0] ?? '',
        familyName: patient.name?.[0]?.family ?? '',
        dateOfBirth: patient.birthDate ?? '',
        age: getPatientAge(patient.birthDate),
        gender: (patient.gender ?? 'unknown') as PatientListItem['gender'],
        phone: patient.telecom?.find((t) => t.system === 'phone')?.value,
        activeConditionsCount: 0, // Populated separately if needed
        allergiesCount: 0,
      }));
    },
    placeholderData: (prev) => prev,
  });
}
