'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Procedure } from '@medplum/fhirtypes';
import type { FamilyPlanningRecord, FPVisitType, FPMethod } from '../types';

const FP_SYSTEM = 'https://lotto-hospital.local/fhir/CodeSystem/family-planning';
const FP_EXT    = 'https://lotto-hospital.local/fhir/StructureDefinition/fp-visit';

function parseFpProcedure(proc: Procedure): FamilyPlanningRecord {
  const ext  = proc.extension?.find(e => e.url === FP_EXT)?.valueString;
  let parsed: Partial<FamilyPlanningRecord> = {};
  if (ext) { try { parsed = JSON.parse(ext); } catch {} }

  return {
    id: proc.id ?? '',
    patientId: proc.subject?.reference?.replace('Patient/', '') ?? '',
    patientName: proc.subject?.display ?? '',
    visitType: (proc.code?.coding?.[0]?.code as FPVisitType) ?? 'counseling',
    currentMethod: (parsed.currentMethod as FPMethod) ?? 'None',
    previousMethod: parsed.previousMethod as FPMethod | undefined,
    counselingTopics: parsed.counselingTopics,
    lmp: parsed.lmp,
    parity: parsed.parity,
    gravida: parsed.gravida,
    bloodPressure: parsed.bloodPressure,
    weight: parsed.weight,
    contraindications: parsed.contraindications,
    complications: parsed.complications,
    nextVisitDate: parsed.nextVisitDate,
    performer: proc.performer?.[0]?.actor?.display,
    encounterId: proc.encounter?.reference?.replace('Encounter/', ''),
    performedAt: (proc as any).performedDateTime ?? proc.performedPeriod?.start ?? '',
    notes: proc.note?.[0]?.text,
  };
}

export function usePatientFamilyPlanning(patientId: string | undefined) {
  const medplum = useMedplum();

  return useQuery<FamilyPlanningRecord[]>({
    queryKey: ['family-planning', patientId],
    enabled: !!patientId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!patientId) return [];
      const results = await medplum.searchResources('Procedure', {
        patient: `Patient/${patientId}`,
        category: 'http://snomed.info/sct|225372007',
        _sort: '-date',
        _count: '100',
      }) as Procedure[];
      return results.map(parseFpProcedure);
    },
  });
}

export function useAllPatientsFamilyPlanning(patientIds: string[]) {
  const medplum = useMedplum();

  return useQuery<FamilyPlanningRecord[]>({
    queryKey: ['family-planning-all', patientIds.join(',')],
    enabled: patientIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      if (patientIds.length === 0) return [];
      const results = await Promise.all(
        patientIds.slice(0, 20).map(pid =>
          medplum.searchResources('Procedure', {
            patient: `Patient/${pid}`,
            category: 'http://snomed.info/sct|225372007',
            _sort: '-date',
            _count: '20',
          })
            .then(r => (r as Procedure[]).map(parseFpProcedure))
            .catch(() => [] as FamilyPlanningRecord[])
        )
      );
      return results.flat().sort((a, b) => b.performedAt.localeCompare(a.performedAt));
    },
  });
}

export interface RecordFpVisitInput {
  patientId: string;
  patientName: string;
  encounterId?: string;
  visitType: FPVisitType;
  currentMethod: FPMethod;
  previousMethod?: FPMethod;
  counselingTopics?: string[];
  lmp?: string;
  parity?: number;
  gravida?: number;
  bloodPressure?: string;
  weight?: string;
  contraindications?: string;
  complications?: string;
  nextVisitDate?: string;
  performerName?: string;
  performedAt: string;
  notes?: string;
}

const VISIT_TYPE_DISPLAY: Record<string, string> = {
  'new-acceptor':   'New Acceptor Visit',
  'continuing':     'Continuing User Visit',
  'counseling':     'FP Counseling',
  'discontinuation':'FP Discontinuation',
  'complication':   'FP Complication',
  'follow-up':      'FP Follow-up',
};

export function useRecordFpVisit() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordFpVisitInput) => {
      const fpData = {
        currentMethod: input.currentMethod,
        previousMethod: input.previousMethod,
        counselingTopics: input.counselingTopics,
        lmp: input.lmp,
        parity: input.parity,
        gravida: input.gravida,
        bloodPressure: input.bloodPressure,
        weight: input.weight,
        contraindications: input.contraindications,
        complications: input.complications,
        nextVisitDate: input.nextVisitDate,
      };

      const resource: Procedure = {
        resourceType: 'Procedure',
        status: 'completed',
        category: {
          coding: [{ system: 'http://snomed.info/sct', code: '225372007', display: 'Family planning (procedure)' }],
        },
        code: {
          coding: [{ system: FP_SYSTEM, code: input.visitType, display: VISIT_TYPE_DISPLAY[input.visitType] ?? input.visitType }],
          text: VISIT_TYPE_DISPLAY[input.visitType] ?? input.visitType,
        },
        subject: { reference: `Patient/${input.patientId}`, display: input.patientName },
        ...(input.encounterId ? { encounter: { reference: `Encounter/${input.encounterId}` } } : {}),
        performedDateTime: input.performedAt,
        ...(input.performerName ? { performer: [{ actor: { display: input.performerName } }] } : {}),
        extension: [{
          url: FP_EXT,
          valueString: JSON.stringify(fpData),
        }],
        ...(input.notes ? { note: [{ text: input.notes }] } : {}),
      };
      return medplum.createResource(resource);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['family-planning', vars.patientId] });
      qc.invalidateQueries({ queryKey: ['family-planning-all'] });
    },
  });
}
