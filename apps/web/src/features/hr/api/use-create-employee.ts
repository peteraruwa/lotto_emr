'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Practitioner } from '@medplum/fhirtypes';
import type { EmployeeFormData } from '../schemas/employee.schema';

const ROLE_TAG_SYSTEM    = 'https://lotto-hospital.local/fhir/role';
const STAFF_ID_SYSTEM    = 'https://lotto-hospital.local/fhir/identifier/staff-id';
const DEPT_EXT           = 'https://lotto-hospital.local/fhir/StructureDefinition/department';
const ROLE_EXT           = 'https://lotto-hospital.local/fhir/StructureDefinition/system-role';
const EMPLOYMENT_DATE_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/date-of-employment';

function generateStaffId(): string {
  const year = new Date().getFullYear();
  const seq  = Math.floor(10000 + Math.random() * 90000);
  return `LCH-${year}-${seq}`;
}

export function useCreateEmployee() {
  const medplum      = useMedplum();
  const queryClient  = useQueryClient();

  return useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const staffId = data.employeeId || generateStaffId();

      // 1. Create the Practitioner (biodata)
      const practitioner = await medplum.createResource<Practitioner>({
        resourceType: 'Practitioner',
        active: true,
        identifier: [
          { system: STAFF_ID_SYSTEM, value: staffId },
        ],
        name: [
          {
            use: 'official',
            given: [data.firstName, ...(data.otherNames ? [data.otherNames] : [])],
            family: data.lastName,
          },
        ],
        gender: data.gender,
        birthDate: data.dateOfBirth,
        telecom: [
          { system: 'phone', value: data.phone, use: 'work' },
          { system: 'email', value: data.loginEmail, use: 'work' },
          ...(data.personalEmail
            ? [{ system: 'email' as const, value: data.personalEmail, use: 'home' as const }]
            : []),
        ],
        address: data.address
          ? [{ use: 'home' as const, line: [data.address], state: data.state, country: 'NG' }]
          : undefined,
        qualification: [
          {
            code: { text: data.jobTitle },
            ...(data.qualification
              ? { extension: [{ url: 'qualification-detail', valueString: data.qualification }] }
              : {}),
          },
        ],
        extension: [
          { url: DEPT_EXT,            valueString: data.department },
          { url: ROLE_EXT,            valueString: data.systemRole },
          { url: EMPLOYMENT_DATE_EXT, valueDate:   data.dateOfEmployment },
          ...(data.nextOfKinName
            ? [{ url: 'https://lotto-hospital.local/fhir/StructureDefinition/next-of-kin', valueString: `${data.nextOfKinName}|${data.nextOfKinRelationship ?? ''}|${data.nextOfKinPhone ?? ''}` }]
            : []),
        ],
      });

      // 2. Invite to the project — creates ProjectMembership + login credentials
      const projectId = medplum.getProject()?.id;
      if (!projectId) throw new Error('No active Medplum project found. Please re-login.');

      await medplum.post(`admin/projects/${projectId}/invite`, {
        resourceType: 'Practitioner',
        firstName:    data.firstName,
        lastName:     data.lastName,
        email:        data.loginEmail,
        password:     data.password,
        sendEmail:    false,
        membership: {
          profile: { reference: `Practitioner/${practitioner.id}` },
          meta: {
            tag: [
              {
                system:  ROLE_TAG_SYSTEM,
                code:    data.systemRole,
                display: data.systemRole.charAt(0).toUpperCase() + data.systemRole.slice(1),
              },
            ],
          },
        },
      });

      return practitioner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
