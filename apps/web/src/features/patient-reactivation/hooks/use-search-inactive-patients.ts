'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Patient } from '@medplum/fhirtypes';

const MRN_SYSTEM = 'https://lotto-hospital.local/fhir/identifier/mrn';
const NIN_SYSTEM = 'https://lotto-hospital.local/fhir/identifier/nin';

export interface PatientSearchResult {
  id:           string;
  fullName:     string;
  mrn:          string;
  nin:          string;
  dateOfBirth:  string;
  gender:       string;
  phone:        string;
  address:      string;
  isActive:     boolean;
  raw:          Patient;
}

function summarise(p: Patient): PatientSearchResult {
  const givenNames = (p.name?.[0]?.given ?? []).join(' ');
  const family     = p.name?.[0]?.family ?? '';
  const fullName   = [givenNames, family].filter(Boolean).join(' ') || 'Unknown';

  const mrn = p.identifier?.find((id) => id.system === MRN_SYSTEM)?.value ?? '—';
  const nin = p.identifier?.find((id) => id.system === NIN_SYSTEM)?.value ?? '';

  const addr  = p.address?.[0];
  const parts = [addr?.line?.[0], addr?.city, addr?.state].filter(Boolean);

  return {
    id:          p.id ?? '',
    fullName,
    mrn,
    nin,
    dateOfBirth: p.birthDate ?? '',
    gender:      p.gender ?? 'unknown',
    phone:       p.telecom?.find((t) => t.system === 'phone')?.value ?? '',
    address:     parts.join(', '),
    isActive:    p.active !== false,   // undefined = active by FHIR convention
    raw:         p,
  };
}

/** Detects whether input looks like an MRN, NIN, or free-text name/phone */
function buildSearchParams(query: string): Record<string, string> {
  const q = query.trim();
  if (/^LCH-\d{4}-\d+$/i.test(q))   return { identifier: `${MRN_SYSTEM}|${q.toUpperCase()}` };
  if (/^\d{11}$/.test(q))             return { identifier: `${NIN_SYSTEM}|${q}` };
  if (/^[+0-9\s\-()]{7,}$/.test(q))  return { telecom: q.replace(/\D/g, '') };
  return { name: q };
}

export function useSearchInactivePatients(query: string) {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['patient-reactivation-search', query],
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
    queryFn: async (): Promise<PatientSearchResult[]> => {
      const params = buildSearchParams(query);

      // Search without active filter to catch both active and inactive patients
      const results = await medplum.searchResources('Patient', {
        ...params,
        _count: '15',
        _sort: 'name',
      });

      return results.map(summarise);
    },
  });
}
