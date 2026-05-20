'use client';

import { useMedplum } from '@medplum/react';
import { Role, ROLES } from './roles';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';

export type RoleState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'no-tag' }          // logged in but no role tag assigned
  | { status: 'resolved'; role: Role };

/**
 * Returns the current user's role state.
 * Distinguishes between "still initialising", "not logged in",
 * "logged in but no role tag", and "role resolved".
 */
export function useRoleState(): RoleState {
  const medplum = useMedplum();

  if (medplum.isLoading()) return { status: 'loading' };

  const profile = medplum.getProfile();
  if (!profile) return { status: 'unauthenticated' };

  const membership = medplum.getProjectMembership();
  if (!membership) return { status: 'no-tag' };

  const roleTag = membership.meta?.tag?.find((t) => t.system === ROLE_TAG_SYSTEM);
  const roleCode = roleTag?.code;
  const validRoles = Object.values(ROLES) as string[];

  if (roleCode && validRoles.includes(roleCode)) {
    return { status: 'resolved', role: roleCode as Role };
  }

  return { status: 'no-tag' };
}

/** Convenience hook — returns the resolved Role or undefined. */
export function useRole(): Role | undefined {
  const state = useRoleState();
  return state.status === 'resolved' ? state.role : undefined;
}
