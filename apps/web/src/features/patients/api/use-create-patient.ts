'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Patient } from '@medplum/fhirtypes';
import type { NewPatientFormData } from '../schemas/patient.schema';

const MRN_SYSTEM = 'https://lotto-hospital.local/fhir/identifier/mrn';

function generateMRN(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(100000 + Math.random() * 900000));
  return `LCH-${year}-${seq}`;
}

/**
 * Mutation hook for creating a new Patient resource in Medplum.
 * Generates and embeds an MRN identifier on creation.
 */
export function useCreatePatient() {
  const medplum = useMedplum();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewPatientFormData): Promise<Patient> => {
      const mrn = generateMRN();
      const patientResource: Patient = {
        resourceType: 'Patient',
        active: true,
        name: [
          {
            use: 'official',
            given: [data.firstName],
            family: data.lastName,
          },
        ],
        gender: data.gender,
        birthDate: data.dateOfBirth,
        telecom: [
          { system: 'phone', value: data.phone, use: 'mobile' },
          ...(data.email ? [{ system: 'email' as const, value: data.email, use: 'home' as const }] : []),
        ],
        address: data.address
          ? [
              {
                use: 'home',
                line: [data.address],
                city: data.city,
                state: data.state,
                country: 'NG',
              },
            ]
          : undefined,
        contact: data.nextOfKinName
          ? [
              {
                relationship: [
                  {
                    coding: [
                      {
                        system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                        code: 'N',
                        display: data.nextOfKinRelationship ?? 'Next-of-kin',
                      },
                    ],
                  },
                ],
                name: { text: data.nextOfKinName },
                telecom: data.nextOfKinPhone
                  ? [{ system: 'phone', value: data.nextOfKinPhone }]
                  : [],
              },
            ]
          : undefined,
        extension: [
          ...(data.bloodGroup
            ? [
                {
                  url: 'https://lotto-hospital.local/fhir/StructureDefinition/blood-group',
                  valueString: data.bloodGroup,
                },
              ]
            : []),
          ...(data.genotypeCode
            ? [
                {
                  url: 'https://lotto-hospital.local/fhir/StructureDefinition/genotype',
                  valueString: data.genotypeCode,
                },
              ]
            : []),
        ],
        identifier: [
          {
            system: MRN_SYSTEM,
            value: mrn,
            use: 'official',
            type: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR', display: 'Medical Record Number' }],
              text: 'MRN',
            },
          },
          ...(data.insuranceNumber
            ? [
                {
                  system: 'https://lotto-hospital.local/fhir/identifier/insurance',
                  value: data.insuranceNumber,
                  type: {
                    coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MB' }],
                    text: data.insuranceProvider ?? 'Insurance',
                  },
                },
              ]
            : []),
        ],
      };

      return medplum.createResource(patientResource);
    },
    onSuccess: () => {
      // Invalidate patient list so it refreshes with the new patient
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
