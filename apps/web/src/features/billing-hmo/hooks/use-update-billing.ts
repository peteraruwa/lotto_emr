'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { BillingNote, FullBillingStatus } from '../types';

interface UpdateBillingInput {
  basketId: string;
  patch: Partial<BillingNote>;
  fhirStatus?: 'active' | 'completed' | 'revoked';
  auditAction?: string;
  auditDetail?: string;
}

export function useUpdateBilling() {
  const medplum = useMedplum();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ basketId, patch, fhirStatus, auditAction, auditDetail }: UpdateBillingInput) => {
      const rg = await medplum.readResource('RequestGroup', basketId) as any;

      let currentNote: any = {};
      try { currentNote = JSON.parse(rg.note?.[0]?.text ?? '{}'); } catch {}

      const auditLog = currentNote.auditLog ?? [];
      if (auditAction) {
        auditLog.push({
          action: auditAction,
          at: new Date().toISOString(),
          detail: auditDetail,
        });
      }

      const updatedNote = { ...currentNote, ...patch, auditLog };
      const noteJson = JSON.stringify(updatedNote);

      const updated = {
        ...rg,
        status: fhirStatus ?? rg.status,
        note: [{ text: noteJson }],
      };

      return medplum.updateResource(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-queue-full'] });
      queryClient.invalidateQueries({ queryKey: ['billing-queue'] });
    },
  });
}
