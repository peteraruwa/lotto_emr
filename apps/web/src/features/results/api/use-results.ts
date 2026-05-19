'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import {
  isObservationCritical,
  formatObservationValue,
} from '@lotto-emr/core';
import type { ResultListItem } from '../types';

interface UseResultsParams {
  patientId?: string;
  category?: 'laboratory' | 'imaging' | 'vital-signs';
}

export function useResults(params: UseResultsParams = {}) {
  const medplum = useMedplum();
  const { patientId, category } = params;

  return useQuery({
    queryKey: ['results', { patientId, category }],
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        _sort: '-date',
        _count: '100',
      };

      if (patientId) searchParams['patient'] = `Patient/${patientId}`;
      if (category) searchParams['category'] = category;

      const observations = await medplum.searchResources('Observation', searchParams);

      return observations.map((obs: any): ResultListItem => {
        const criticality = isObservationCritical(obs);

        return {
          id: obs.id ?? '',
          resourceType: 'Observation',
          patientId: obs.subject?.reference?.split('/')?.[1] ?? patientId ?? '',
          name: obs.code?.text ?? obs.code?.coding?.[0]?.display ?? 'Observation',
          value: formatObservationValue(obs),
          unit: obs.valueQuantity?.unit,
          referenceRange: obs.referenceRange?.[0]?.text ??
            (obs.referenceRange?.[0]?.low && obs.referenceRange?.[0]?.high
              ? `${obs.referenceRange[0].low.value}–${obs.referenceRange[0].high.value} ${obs.referenceRange[0].low.unit ?? ''}`
              : undefined),
          criticality,
          status: obs.status ?? 'unknown',
          effectiveDate: obs.effectiveDateTime ?? obs.issued ?? '',
          performerName: obs.performer?.[0]?.display,
          loincCode: obs.code?.coding?.find((c: any) => c.system === 'http://loinc.org')?.code,
        };
      });
    },
  });
}
