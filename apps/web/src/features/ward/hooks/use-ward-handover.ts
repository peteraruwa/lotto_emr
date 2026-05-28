'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Communication } from '@medplum/fhirtypes';
import { format } from 'date-fns';
import type { HandoverEntry, HandoverCategory } from '../types';

const HANDOVER_CODE = 'LP173421-1';
const HANDOVER_SYSTEM = 'http://loinc.org';

function parseHandover(c: Communication): HandoverEntry {
  let meta: { ward?: string; bedNumber?: string; category?: HandoverCategory } = {};
  try {
    meta = JSON.parse(c.note?.[0]?.text ?? '{}');
  } catch {
    meta = {};
  }

  return {
    id: c.id ?? '',
    patientId: c.subject?.reference?.replace('Patient/', '') ?? '',
    patientName: c.subject?.display ?? 'Unknown',
    ward: meta.ward ?? '',
    bedNumber: meta.bedNumber ?? '',
    category: meta.category ?? 'stable',
    note: c.payload?.[0]?.contentString ?? '',
    addedBy: c.sender?.display ?? 'Staff',
    addedAt: c.sent ?? new Date().toISOString(),
    shiftDate: c.sent ? format(new Date(c.sent), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  };
}

export function useWardHandover() {
  const medplum = useMedplum();

  return useQuery<HandoverEntry[]>({
    queryKey: ['ward-handover'],
    staleTime: 60_000,
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const comms = (await medplum.searchResources('Communication', {
        category: `${HANDOVER_SYSTEM}|${HANDOVER_CODE}`,
        sent: `ge${today}`,
        _sort: '-sent',
        _count: '100',
      })) as Communication[];

      return comms.map(parseHandover);
    },
  });
}

export interface AddHandoverInput {
  patientId: string;
  patientName: string;
  ward: string;
  bedNumber: string;
  category: HandoverCategory;
  note: string;
  addedBy: string;
}

export function useAddHandoverEntry() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddHandoverInput) => {
      const comm: Communication = {
        resourceType: 'Communication',
        status: 'completed',
        category: [{
          coding: [{
            system: HANDOVER_SYSTEM,
            code: HANDOVER_CODE,
            display: 'Handover note',
          }],
        }],
        subject: {
          reference: `Patient/${input.patientId}`,
          display: input.patientName,
        },
        sent: new Date().toISOString(),
        sender: { display: input.addedBy },
        payload: [{ contentString: input.note }],
        note: [{
          text: JSON.stringify({
            ward: input.ward,
            bedNumber: input.bedNumber,
            category: input.category,
          }),
        }],
      };
      return medplum.createResource(comm);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ward-handover'] }),
  });
}
