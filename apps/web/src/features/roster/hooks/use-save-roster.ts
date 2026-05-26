'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { ROSTER_CODE_SYSTEM, ROSTER_EXT_BASE, toMonthStr } from './use-roster-data';
import type { StoredRosterEntry } from '../types';

/** Upserts the full roster for the given month as a single Medplum Basic resource. */
export function useSaveRoster(year: number, month: number) {
  const medplum     = useMedplum();
  const queryClient = useQueryClient();
  const ms          = toMonthStr(year, month);

  return useMutation({
    mutationFn: async (entries: StoredRosterEntry[]) => {
      // Find existing Basic resource for this month
      const existing = await medplum.searchResources('Basic', {
        code:   `${ROSTER_CODE_SYSTEM}|MonthlyRoster`,
        _tag:   ms,
        _count: '1',
      } as any);

      const resource: any = {
        resourceType: 'Basic',
        meta: {
          tag: [{ system: ROSTER_CODE_SYSTEM, code: ms }],
        },
        code: {
          coding: [{
            system:  ROSTER_CODE_SYSTEM,
            code:    'MonthlyRoster',
            display: `Monthly Roster ${ms}`,
          }],
        },
        extension: [
          { url: `${ROSTER_EXT_BASE}/month`,   valueString: ms },
          { url: `${ROSTER_EXT_BASE}/entries`, valueString: JSON.stringify(entries) },
        ],
      };

      if (existing.length > 0 && (existing[0] as any).id) {
        resource.id = (existing[0] as any).id;
        await medplum.updateResource(resource);
      } else {
        await medplum.createResource(resource);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster', ms] });
    },
  });
}
