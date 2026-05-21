'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import { useQuery } from '@tanstack/react-query';
import type { Bundle, Condition, Encounter } from '@medplum/fhirtypes';
import { Button } from '@lotto-emr/ui';
import { ClipboardList, CalendarDays } from 'lucide-react';
import { PregnancyHeader } from './pregnancy-header';
import { BookingNoteForm } from './booking-note-form';
import { AncTimeline } from './anc-timeline';
import { AncVisitTracker } from './anc-visit-tracker';
import type { PregnancyRecord, AncVisitSummary, AncNoteType } from '../types';
import { ANC_VISIT_TYPE_SYSTEM } from '../types';
import { parsePregnancyRecord, buildLegacyAncRecord, calculateGestationalWeeks } from '../lib/anc-utils';

interface AncPageProps {
  patientId: string;
}

type ActiveTab = 'timeline' | 'schedule';

// Parse an Encounter resource into an AncVisitSummary
function parseEncounterToVisitSummary(encounter: Encounter, lmpDate: string): AncVisitSummary {
  const noteType = (encounter.type?.[0]?.coding?.[0]?.code ?? 'followup') as AncNoteType;
  const visitDate = (encounter.period?.start ?? encounter.meta?.lastUpdated ?? '').split('T')[0];
  const noteText = ((encounter as unknown as Record<string, unknown>).note as Array<{ text?: string }> | undefined)?.[0]?.text ?? '';

  // Parse GA from visit date and LMP
  let gestationalAge: number | undefined;
  if (visitDate && lmpDate) {
    const visitMs = new Date(visitDate).getTime();
    const lmpMs = new Date(lmpDate).getTime();
    const diffDays = Math.floor((visitMs - lmpMs) / (24 * 60 * 60 * 1000));
    if (diffDays > 0) gestationalAge = Math.floor(diffDays / 7);
  }

  // Parse BP from note text (e.g. "BP: 120/80 mmHg")
  const bpMatch = noteText.match(/BP:\s*(\d+\/\d+)\s*mmHg/i);
  const bp = bpMatch?.[1];

  // Parse weight from note text (e.g. "Weight: 65 kg")
  const weightMatch = noteText.match(/Weight:\s*([\d.]+)\s*kg/i);
  const weight = weightMatch ? Number(weightMatch[1]) : undefined;

  // Parse FHR from note text (e.g. "FHR: 144/min")
  const fhrMatch = noteText.match(/FHR:\s*(\d+)\/min/i);
  const fetalHeartRate = fhrMatch ? Number(fhrMatch[1]) : undefined;

  // Parse fundal height from note text (e.g. "Fundal height: 28 cm")
  const fhMatch = noteText.match(/[Ff]undal\s*height:\s*([\d.]+)\s*cm/i);
  const fundalHeight = fhMatch ? Number(fhMatch[1]) : undefined;

  return {
    encounterId: encounter.id ?? '',
    noteType,
    visitDate,
    gestationalAge,
    bp,
    weight,
    fetalHeartRate,
    fundalHeight,
    assessment: noteText ? noteText.slice(0, 200) : undefined,
    clinicianNote: noteText,
  };
}

export function AncPage({ patientId }: AncPageProps) {
  const medplum = useMedplum();
  const [localPregnancy, setLocalPregnancy] = useState<PregnancyRecord | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');

  // 1. Query for pregnancy Condition (SNOMED 77386006)
  const { data: conditionBundle, isLoading: conditionLoading } = useQuery<Bundle<Condition>>({
    queryKey: ['anc-condition', patientId],
    queryFn: () =>
      medplum.search('Condition', {
        patient: `Patient/${patientId}`,
        code: '77386006',
        _sort: '-recorded-date',
        _count: '1',
      }) as Promise<Bundle<Condition>>,
    enabled: !!patientId,
  });

  const existingCondition = conditionBundle?.entry?.[0]?.resource as Condition | undefined;

  const pregnancy: PregnancyRecord | null =
    localPregnancy ??
    (existingCondition ? parsePregnancyRecord(existingCondition, patientId) : null);

  // 2. Query for ANC Encounters linked to this pregnancy Condition
  const { data: encounterBundle, isLoading: encountersLoading, refetch: refetchEncounters } = useQuery<Bundle<Encounter>>({
    queryKey: ['anc-encounters', pregnancy?.conditionId],
    queryFn: async () => {
      if (!pregnancy?.conditionId) return { resourceType: 'Bundle', entry: [] } as unknown as Bundle<Encounter>;
      return medplum.search('Encounter', {
        patient: `Patient/${patientId}`,
        'reason-reference': `Condition/${pregnancy.conditionId}`,
        _sort: '-date',
        _count: '50',
      }) as Promise<Bundle<Encounter>>;
    },
    enabled: !!pregnancy?.conditionId,
  });

  // Parse encounters into visit summaries
  const visits: AncVisitSummary[] = (encounterBundle?.entry ?? [])
    .map((e) => e.resource)
    .filter((r): r is Encounter => !!r && r.resourceType === 'Encounter')
    .filter((enc) => {
      // Only include ANC visit type encounters
      const typeCode = enc.type?.[0]?.coding?.[0]?.code;
      const typeSystem = enc.type?.[0]?.coding?.[0]?.system;
      return typeSystem === ANC_VISIT_TYPE_SYSTEM && !!typeCode;
    })
    .map((enc) => parseEncounterToVisitSummary(enc, pregnancy?.lmpDate ?? ''));

  // Build legacy AncRecord for WHO schedule tracker
  const legacyAncRecord = pregnancy ? buildLegacyAncRecord(pregnancy) : null;

  // Mark visits as completed in legacy record
  if (legacyAncRecord && visits.length > 0) {
    visits.forEach((visit) => {
      if (!pregnancy) return;
      const gaAtVisit = visit.gestationalAge ?? 0;
      // Find the closest WHO visit slot
      const matchIdx = legacyAncRecord.visits.findIndex((v) => {
        return Math.abs(v.targetWeek - gaAtVisit) <= 2 && v.status !== 'completed';
      });
      if (matchIdx >= 0) {
        legacyAncRecord.visits[matchIdx] = {
          ...legacyAncRecord.visits[matchIdx],
          status: 'completed',
          completedDate: visit.visitDate,
          encounterId: visit.encounterId,
          weight: visit.weight,
          bp: visit.bp,
          fetalHeartRate: visit.fetalHeartRate,
          fundusHeight: visit.fundalHeight,
        };
      }
    });
  }

  const isLoading = conditionLoading || (!!pregnancy && encountersLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading ANC records…</div>
      </div>
    );
  }

  // No pregnancy → show booking form
  if (!pregnancy) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-10">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-900">Antenatal Care</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          No ANC pregnancy record found for this patient. Complete the booking note below to enrol in ANC.
        </p>
        <BookingNoteForm
          patientId={patientId}
          onSuccess={(pr) => {
            setLocalPregnancy(pr);
          }}
        />
      </div>
    );
  }

  // Pregnancy exists → show dashboard
  return (
    <div className="space-y-5 pb-10">
      {/* Persistent pregnancy header */}
      <PregnancyHeader pregnancy={pregnancy} />

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Visit Timeline
          {visits.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
              {visits.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'schedule'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          WHO Schedule
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'timeline' && (
        <AncTimeline
          visits={visits}
          patientId={patientId}
          pregnancyId={pregnancy.conditionId}
        />
      )}

      {activeTab === 'schedule' && legacyAncRecord && (
        <AncVisitTracker
          ancRecord={legacyAncRecord}
          patientId={patientId}
        />
      )}
    </div>
  );
}
