'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { NoteType } from '../types';
import type { NoteListItem } from '../types';

const NOTE_TYPE_MAP: Record<string, NoteType> = {
  '11506-3': NoteType.PROGRESS,
  '18842-5': NoteType.DISCHARGE,
  '57133-1': NoteType.REFERRAL,
  '34137-0': NoteType.SOAP,
};

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

        // Decode base64 content if present
        let contentText = '';
        const attachment = doc.content?.[0]?.attachment;
        if (attachment?.data) {
          try {
            contentText = Buffer.from(attachment.data, 'base64').toString('utf-8');
          } catch {
            contentText = '';
          }
        }

        return {
          id: doc.id ?? '',
          patientId: patientId ?? '',
          type: noteType,
          title: doc.description ?? doc.type?.text ?? noteType,
          contentPreview: contentText.slice(0, 200),
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
