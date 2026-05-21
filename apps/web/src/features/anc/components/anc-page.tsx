'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import { useQuery } from '@tanstack/react-query';
import type { Bundle, Condition } from '@medplum/fhirtypes';
import { AncEnrollmentForm } from './anc-enrollment-form';
import { AncVisitTracker } from './anc-visit-tracker';
import type { AncEnrollmentData, AncRecord, AncVisit } from '../types';
import { generateVisitSchedule } from '../lib/anc-utils';

interface AncPageProps {
  patientId: string;
}

function buildAncRecord(condition: Condition, patientId: string): AncRecord {
  const noteText = condition.note?.[0]?.text ?? '';

  const gravidaMatch = noteText.match(/G(\d+)/);
  const paraMatch = noteText.match(/P(\d+)/);
  const abortusMatch = noteText.match(/A(\d+)/);
  const eddMatch = noteText.match(/EDD:\s*([\d-]+)/);
  const riskMatch = noteText.match(/Risk:\s*(\w+)/);
  const factorsMatch = noteText.match(/Risk factors:\s*(.+)$/);

  const lmpDate = (condition.onsetDateTime ?? '').split('T')[0];
  const edd = eddMatch?.[1] ?? '';
  const gravida = Number(gravidaMatch?.[1] ?? 1);
  const para = Number(paraMatch?.[1] ?? 0);
  const abortus = Number(abortusMatch?.[1] ?? 0);
  const riskLevel = (riskMatch?.[1] ?? 'low') as AncRecord['riskLevel'];
  const riskFactors = factorsMatch?.[1]
    ? factorsMatch[1].split(',').map((f) => f.trim()).filter(Boolean)
    : [];

  const scheduleItems = generateVisitSchedule(lmpDate);
  const visits: AncVisit[] = scheduleItems.map((item) => ({
    id: `visit-${item.visitNumber}`,
    ...item,
  }));

  return {
    patientId,
    enrollmentDate: (condition.recordedDate ?? condition.onsetDateTime ?? '').split('T')[0],
    lmpDate,
    edd,
    gestationalWeekAtBooking: 0,
    gravida,
    para,
    abortus,
    riskLevel,
    riskFactors,
    visits,
  };
}

export function AncPage({ patientId }: AncPageProps) {
  const medplum = useMedplum();
  const [localRecord, setLocalRecord] = useState<AncRecord | null>(null);

  const { data: bundle, isLoading } = useQuery<Bundle<Condition>>({
    queryKey: ['anc-condition', patientId],
    queryFn: () =>
      medplum.search('Condition', {
        patient: `Patient/${patientId}`,
        code: '77386006',
        _count: '1',
      }) as Promise<Bundle<Condition>>,
    enabled: !!patientId,
  });

  const existingCondition =
    bundle?.entry?.[0]?.resource as Condition | undefined;

  const ancRecord: AncRecord | null =
    localRecord ??
    (existingCondition ? buildAncRecord(existingCondition, patientId) : null);

  function handleEnrolled(data: AncEnrollmentData) {
    const scheduleItems = generateVisitSchedule(data.lmpDate);
    const visits: AncVisit[] = scheduleItems.map((item) => ({
      id: `visit-${item.visitNumber}`,
      ...item,
    }));

    setLocalRecord({
      patientId,
      enrollmentDate: new Date().toISOString().split('T')[0],
      lmpDate: data.lmpDate,
      edd: data.edd,
      gestationalWeekAtBooking: data.gestationalWeekAtBooking,
      gravida: data.gravida,
      para: data.para,
      abortus: data.abortus,
      riskLevel: data.riskLevel,
      riskFactors: data.riskFactors,
      visits,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading ANC records...</div>
      </div>
    );
  }

  if (ancRecord) {
    return <AncVisitTracker ancRecord={ancRecord} patientId={patientId} />;
  }

  return <AncEnrollmentForm patientId={patientId} onEnrolled={handleEnrolled} />;
}
