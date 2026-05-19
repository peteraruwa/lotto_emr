'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { DocumentReference } from '@medplum/fhirtypes';
import { NoteType } from '../types';
import type { NoteFormData } from '../types';

const NOTE_TYPE_LOINC: Record<NoteType, { code: string; display: string }> = {
  [NoteType.SOAP]: { code: '34137-0', display: 'Outpatient Note' },
  [NoteType.PROGRESS]: { code: '11506-3', display: 'Progress Note' },
  [NoteType.DISCHARGE]: { code: '18842-5', display: 'Discharge Summary' },
  [NoteType.REFERRAL]: { code: '57133-1', display: 'Referral Note' },
};

export function useCreateNote() {
  const medplum = useMedplum();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NoteFormData): Promise<DocumentReference> => {
      const currentUser = medplum.getProfile();
      const loinc = NOTE_TYPE_LOINC[data.type];

      // Encode content as base64
      const contentBase64 = Buffer.from(data.content, 'utf-8').toString('base64');

      const doc: DocumentReference = {
        resourceType: 'DocumentReference',
        status: data.status === 'final' ? 'current' : 'current',
        docStatus: data.status === 'final' ? 'final' : 'preliminary',
        type: {
          coding: [
            {
              system: 'http://loinc.org',
              code: loinc.code,
              display: loinc.display,
            },
          ],
          text: data.type,
        },
        category: [
          {
            coding: [
              {
                system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
                code: 'clinical-note',
                display: 'Clinical Note',
              },
            ],
          },
        ],
        subject: { reference: `Patient/${data.patientId}` },
        date: new Date().toISOString(),
        author: currentUser?.id
          ? [{ reference: `Practitioner/${currentUser.id}`, display: `${currentUser.name?.[0]?.given?.[0]} ${currentUser.name?.[0]?.family}`.trim() }]
          : [],
        description: data.title,
        content: [
          {
            attachment: {
              contentType: 'text/plain',
              data: contentBase64,
              title: data.title,
              creation: new Date().toISOString(),
            },
          },
        ],
        context: {
          encounter: data.encounterId
            ? [{ reference: `Encounter/${data.encounterId}` }]
            : undefined,
        },
      };

      return medplum.createResource(doc);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.patientId] });
    },
  });
}
