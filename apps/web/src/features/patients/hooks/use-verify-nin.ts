'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface VerifyNinInput {
  nin:           string;
  patientId:     string;
  adminEmail:    string;
  adminPassword: string;
}

export interface VerifyNinResult {
  verified:  boolean;
  message:   string;
  provider?: string;
  name?:     string;
  dob?:      string;
}

export function useVerifyNin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: VerifyNinInput): Promise<VerifyNinResult> => {
      const res = await fetch('/api/verify-nin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      return data as VerifyNinResult;
    },
    onSuccess: (result, variables) => {
      if (result.verified) {
        // Invalidate the patient query so the profile reloads with the new extension
        queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      }
    },
  });
}
