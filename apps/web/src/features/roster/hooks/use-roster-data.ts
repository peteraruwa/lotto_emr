'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { generateMonthRosterAsStored } from '../data/roster-generator';
import type { StoredRosterEntry } from '../types';

export const ROSTER_CODE_SYSTEM = 'https://lotto-hospital.local/fhir/CodeSystem/resource-types';
export const ROSTER_EXT_BASE    = 'https://lotto-hospital.local/fhir/StructureDefinition/roster';

export function toMonthStr(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Fetches the stored roster for the given month from Medplum (Basic resource).
 * Falls back to the deterministic generated roster if none has been saved yet.
 */
export function useRosterData(year: number, month: number) {
  const medplum = useMedplum();
  const ms      = toMonthStr(year, month);

  return useQuery<StoredRosterEntry[]>({
    queryKey: ['roster', ms],
    queryFn: async () => {
      try {
        const results = await medplum.searchResources('Basic', {
          code:   `${ROSTER_CODE_SYSTEM}|MonthlyRoster`,
          _tag:   ms,
          _count: '1',
        } as any);

        if (results.length > 0) {
          const ext = (results[0] as any).extension?.find(
            (e: any) => e.url === `${ROSTER_EXT_BASE}/entries`,
          );
          if (ext?.valueString) {
            return JSON.parse(ext.valueString) as StoredRosterEntry[];
          }
        }
      } catch {
        // Medplum unavailable or unauthorised — fall through to generated data
      }
      return generateMonthRosterAsStored(year, month);
    },
    staleTime: 5 * 60 * 1000, // treat as fresh for 5 min
  });
}
