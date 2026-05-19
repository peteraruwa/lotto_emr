'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { EncounterListItem } from '../types';

const CLASS_DISPLAY: Record<string, string> = {
  AMB: 'Ambulatory',
  EMER: 'Emergency',
  IMP: 'Inpatient',
  OBSENC: 'Observation',
  SS: 'Short Stay',
};

export function useEncounters(patientId: string | undefined) {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['encounters', patientId],
    queryFn: async () => {
      const encounters = await medplum.searchResources('Encounter', {
        patient: `Patient/${patientId}`,
        _sort: '-date',
        _count: '50',
      });

      return encounters.map((e: any): EncounterListItem => {
        const classCode = e.class?.code ?? 'AMB';
        const start = e.period?.start ?? '';
        const end = e.period?.end;

        let durationMinutes: number | undefined;
        if (start && end) {
          durationMinutes = Math.round(
            (new Date(end).getTime() - new Date(start).getTime()) / 60_000
          );
        }

        return {
          id: e.id ?? '',
          patientId: patientId ?? '',
          patientName: e.subject?.display ?? '',
          status: e.status ?? 'unknown',
          class: classCode,
          classDisplay: CLASS_DISPLAY[classCode] ?? classCode,
          reasonText:
            e.reasonCode?.[0]?.text ??
            e.reasonCode?.[0]?.coding?.[0]?.display ??
            'Not specified',
          periodStart: start,
          periodEnd: end,
          practitionerName: e.participant?.find((p: any) =>
            p.type?.some((t: any) => t.coding?.some((c: any) => c.code === 'PART'))
          )?.individual?.display,
          location: e.location?.[0]?.location?.display,
          durationMinutes,
        };
      });
    },
    enabled: !!patientId,
  });
}
