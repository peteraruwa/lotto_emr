'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { NoteType } from '../types';
import type { NoteListItem } from '../types';

const NOTE_TYPE_MAP: Record<string, NoteType> = {
  '11488-4': NoteType.SOAP,      // Consultation note → treat as SOAP/structured
  '11506-3': NoteType.PROGRESS,  // Progress note
  '18842-5': NoteType.DISCHARGE, // Discharge summary
  '28570-0': NoteType.PROGRESS,  // Procedure note
  '34137-0': NoteType.SOAP,      // SOAP note
  '57133-1': NoteType.REFERRAL,  // Referral note
};

interface StructuredContent {
  presentingComplaints?: string;
  hpc?: string;
  diagnosis?: string;
  plan?: string;
  [key: string]: unknown;
}

export function useNotes(patientId: string | undefined) {
  const medplum = useMedplum();

  return useQuery({
    queryKey: ['notes', patientId],
    queryFn: async () => {
      const docs = await medplum.searchResources('DocumentReference', {
        patient: `Patient/${patientId}`,
        category: 'clinical-note',
        _sort: '-date',
        _count: '50',
      });

      return docs.map((doc: any): NoteListItem => {
        const loincCode = doc.type?.coding?.find((c: any) => c.system === 'http://loinc.org')?.code;
        const noteType = loincCode ? (NOTE_TYPE_MAP[loincCode] ?? NoteType.PROGRESS) : NoteType.PROGRESS;

        let structured: StructuredContent = {};
        const attachment = doc.content?.[0]?.attachment;
        if (attachment?.data) {
          try {
            const raw = Buffer.from(attachment.data, 'base64').toString('utf-8');
            structured = JSON.parse(raw) as StructuredContent;
          } catch {
            structured = {};
          }
        }

        const diagnosis = structured.diagnosis?.trim() ?? '';
        const presentingComplaints = structured.presentingComplaints?.trim() ?? '';
        const contentPreview = diagnosis || presentingComplaints || (structured.hpc?.trim() ?? '');

        return {
          id: doc.id ?? '',
          patientId: patientId ?? '',
          type: noteType,
          title: doc.description?.trim() || diagnosis || doc.type?.text || 'Clinical Note',
          contentPreview: contentPreview.slice(0, 200),
          diagnosis,
          presentingComplaints,
          docStatus: doc.docStatus ?? 'preliminary',
          status: doc.status ?? 'current',
          authorName: doc.author?.[0]?.display ?? 'Unknown',
          date: doc.date ?? '',
          encounterId: doc.context?.encounter?.[0]?.reference?.split('/')?.[1],
        };
      });
    },
    enabled: !!patientId,
  });
}
