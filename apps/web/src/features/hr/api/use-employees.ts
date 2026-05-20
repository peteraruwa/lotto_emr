'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Employee } from '../types';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';
const STAFF_ID_SYSTEM = 'https://lotto-hospital.local/fhir/identifier/staff-id';

export function useEmployees() {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['employees'],
    queryFn: async (): Promise<Employee[]> => {
      const practitioners = await medplum.searchResources('Practitioner', {
        _count: '100',
        _sort: 'family',
      });

      return practitioners.map((p: any): Employee => {
        const given  = p.name?.[0]?.given?.join(' ') ?? '';
        const family = p.name?.[0]?.family ?? '';
        const staffId =
          p.identifier?.find((i: any) => i.system === STAFF_ID_SYSTEM)?.value ??
          `LCH-${p.id?.slice(0, 6).toUpperCase()}`;
        const loginEmail =
          p.telecom?.find((t: any) => t.system === 'email' && t.use === 'work')?.value ?? '';
        const phone =
          p.telecom?.find((t: any) => t.system === 'phone')?.value;
        const department =
          p.extension?.find((e: any) =>
            e.url === 'https://lotto-hospital.local/fhir/StructureDefinition/department'
          )?.valueString ?? '—';
        const systemRole =
          p.extension?.find((e: any) =>
            e.url === 'https://lotto-hospital.local/fhir/StructureDefinition/system-role'
          )?.valueString ?? '—';
        const dateOfEmployment =
          p.extension?.find((e: any) =>
            e.url === 'https://lotto-hospital.local/fhir/StructureDefinition/date-of-employment'
          )?.valueDate ?? '';

        return {
          id:               p.id ?? '',
          staffId,
          fullName:         `${given} ${family}`.trim() || 'Unknown',
          jobTitle:         p.qualification?.[0]?.code?.text ?? '—',
          department,
          systemRole,
          loginEmail,
          phone,
          dateOfEmployment,
          active:           p.active !== false,
        };
      });
    },
  });
}
