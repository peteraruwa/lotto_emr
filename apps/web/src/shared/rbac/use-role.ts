'use client';

import { useMedplum } from '@medplum/react';
import type { Extension } from '@medplum/fhirtypes';
import { Role, ROLES } from './roles';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';
const SYSTEM_ROLE_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/system-role';

export type RoleState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'no-tag' }
  | { status: 'resolved'; role: Role };

export function useRoleState(): RoleState {
  const medplum = useMedplum();

  if (medplum.isLoading()) return { status: 'loading' };

  const profile = medplum.getProfile();
  if (!profile) return { status: 'unauthenticated' };

  const membership = medplum.getProjectMembership();
  if (!membership) return { status: 'no-tag' };

  const validRoles = Object.values(ROLES) as string[];

  // Primary: ProjectMembership meta.tag (set via admin invite + role tag PUT)
  const tagCode = membership.meta?.tag?.find((t) => t.system === ROLE_TAG_SYSTEM)?.code;
  if (tagCode && validRoles.includes(tagCode)) {
    return { status: 'resolved', role: tagCode as Role };
  }

  // Fallback: system-role extension on the Practitioner profile
  // This is always set during account creation (via EmployeeForm or provision script)
  // and is returned in the login response alongside the profile resource.
  const extCode = (profile as { extension?: Extension[] })
    .extension
    ?.find((e) => e.url === SYSTEM_ROLE_EXT)
    ?.valueString;
  if (extCode && validRoles.includes(extCode)) {
    return { status: 'resolved', role: extCode as Role };
  }

  return { status: 'no-tag' };
}

/** Convenience hook — returns the resolved Role or undefined. */
export function useRole(): Role | undefined {
  const state = useRoleState();
  return state.status === 'resolved' ? state.role : undefined;
}
