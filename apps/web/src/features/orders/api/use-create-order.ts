'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { ServiceRequest, MedicationRequest } from '@medplum/fhirtypes';
import type { OrderFormData } from '../types';

export function useCreateOrder() {
  const medplum = useMedplum();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OrderFormData): Promise<ServiceRequest | MedicationRequest> => {
      const now = new Date().toISOString();
      const currentUser = medplum.getProfile();
      const requesterRef = currentUser?.id
        ? { reference: `Practitioner/${currentUser.id}`, display: `${currentUser.name?.[0]?.given?.[0]} ${currentUser.name?.[0]?.family}`.trim() }
        : undefined;

      if (data.type === 'MEDICATION') {
        const rx: MedicationRequest = {
          resourceType: 'MedicationRequest',
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: {
            text: data.orderText,
            ...(data.medicationCode
              ? { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: data.medicationCode }] }
              : {}),
          },
          subject: { reference: `Patient/${data.patientId}` },
          encounter: data.encounterId ? { reference: `Encounter/${data.encounterId}` } : undefined,
          authoredOn: now,
          requester: requesterRef,
          priority: data.priority,
          dosageInstruction: data.dose
            ? [
                {
                  text: `${data.dose}${data.frequency ? ` ${data.frequency}` : ''}`,
                  timing: data.frequency
                    ? { code: { text: data.frequency } }
                    : undefined,
                  doseAndRate: [
                    {
                      doseQuantity: { value: parseFloat(data.dose), unit: 'mg' },
                    },
                  ],
                },
              ]
            : undefined,
          dispenseRequest: data.durationDays
            ? { expectedSupplyDuration: { value: data.durationDays, unit: 'days', system: 'http://unitsofmeasure.org', code: 'd' } }
            : undefined,
          note: data.notes ? [{ text: data.notes }] : undefined,
        };
        return medplum.createResource(rx);
      }

      // LAB or IMAGING — use ServiceRequest
      const category =
        data.type === 'IMAGING'
          ? [{ coding: [{ system: 'http://snomed.info/sct', code: '363679005', display: 'Imaging' }] }]
          : [{ coding: [{ system: 'http://snomed.info/sct', code: '108252007', display: 'Laboratory procedure' }] }];

      const sr: ServiceRequest = {
        resourceType: 'ServiceRequest',
        status: 'active',
        intent: 'order',
        category,
        code: {
          text: data.orderText,
          ...(data.loincCode
            ? { coding: [{ system: 'http://loinc.org', code: data.loincCode }] }
            : data.snomedCode
            ? { coding: [{ system: 'http://snomed.info/sct', code: data.snomedCode }] }
            : {}),
        },
        subject: { reference: `Patient/${data.patientId}` },
        encounter: data.encounterId ? { reference: `Encounter/${data.encounterId}` } : undefined,
        authoredOn: now,
        requester: requesterRef,
        priority: data.priority,
        note: data.notes ? [{ text: data.notes }] : undefined,
      };

      return medplum.createResource(sr);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', { patientId: variables.patientId }] });
    },
  });
}
