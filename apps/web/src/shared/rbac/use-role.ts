'use client';

import { useMedplum } from '@medplum/react';
import { Role, ROLES } from './roles';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';

/**
 * Returns the current user's Role by reading the role tag from their
 * ProjectMembership resource.
 *
 * The tag is set during user creation / seeding:
 *   meta.tag = [{ system: ROLE_TAG_SYSTEM, code: 'doctor' }]
 *
 * Returns undefined if the user is not authenticated or the role cannot be determined.
 */
export function useRole(): Role | undefined {
  const medplum = useMedplum();
  const membership = medplum.getProjectMembership();

  if (!membership) return undefined;

  const roleTag = membership.meta?.tag?.find((t) => t.system === ROLE_TAG_SYSTEM);
  const roleCode = roleTag?.code;

  // Validate against the known role values
  const validRoles = Object.values(ROLES) as string[];
  if (roleCode && validRoles.includes(roleCode)) {
    return roleCode as Role;
  }

  return undefined;
}
