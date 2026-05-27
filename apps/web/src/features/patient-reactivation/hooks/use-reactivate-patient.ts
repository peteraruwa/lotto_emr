'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Patient } from '@medplum/fhirtypes';

export interface ReactivationUpdateData {
  patientId:    string;
  phone?:       string;
  altPhone?:    string;
  email?:       string;
  addressLine1?: string;
  city?:        string;
  state?:       string;
  hmoProvider?: string;
  hmoPolicyNumber?: string;
  notes?:       string;
}

export function useReactivatePatient() {
  const medplum     = useMedplum();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReactivationUpdateData): Promise<Patient> => {
      // 1. Read current patient
      const current = await medplum.readResource('Patient', data.patientId) as Patient;

      // 2. Build the updated resource — set active:true and patch only provided fields
      const updated: Patient = {
        ...current,
        active: true,

        // Update telecom if new values provided
        telecom: (() => {
          const tel = [...(current.telecom ?? [])];
          if (data.phone) {
            const idx = tel.findIndex((t) => t.use === 'mobile' || t.system === 'phone');
            if (idx >= 0) tel[idx] = { ...tel[idx], value: data.phone };
            else tel.unshift({ system: 'phone', value: data.phone, use: 'mobile' });
          }
          if (data.altPhone) {
            const idx = tel.findIndex((t) => t.use === 'home' && t.system === 'phone');
            if (idx >= 0) tel[idx] = { ...tel[idx], value: data.altPhone };
            else tel.push({ system: 'phone', value: data.altPhone, use: 'home' });
          }
          if (data.email) {
            const idx = tel.findIndex((t) => t.system === 'email');
            if (idx >= 0) tel[idx] = { ...tel[idx], value: data.email };
            else tel.push({ system: 'email', value: data.email, use: 'home' });
          }
          return tel.length > 0 ? tel : undefined;
        })(),

        // Update address if provided
        address: (data.addressLine1 || data.city || data.state)
          ? [{
              ...(current.address?.[0] ?? {}),
              use: 'home' as const,
              line: data.addressLine1 ? [data.addressLine1] : current.address?.[0]?.line,
              city:  data.city  || current.address?.[0]?.city,
              state: data.state || current.address?.[0]?.state,
              country: 'NG',
            }]
          : current.address,
      };

      // 3. Persist
      return medplum.updateResource(updated);
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-reactivation-search'] });
    },
  });
}
