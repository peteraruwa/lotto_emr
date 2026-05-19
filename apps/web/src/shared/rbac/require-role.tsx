'use client';

import React from 'react';
import { useRole } from './use-role';
import type { Role } from './roles';

interface RequireRoleProps {
  roles: Role[];
  children: React.ReactNode;
  /**
   * Optional fallback content to render when the user doesn't have the required role.
   * Defaults to null (renders nothing).
   */
  fallback?: React.ReactNode;
}

/**
 * Client component that conditionally renders its children based on the current user's role.
 *
 * IMPORTANT: This is a UX convenience only. All actual access control is enforced
 * server-side by Medplum AccessPolicies. Never rely on this for security.
 *
 * @example
 * <RequireRole roles={['doctor', 'nurse']}>
 *   <PrescriptionButton />
 * </RequireRole>
 *
 * @example
 * <RequireRole roles={['doctor']} fallback={<p>Doctors only</p>}>
 *   <SignOrderButton />
 * </RequireRole>
 */
export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  const currentRole = useRole();

  if (!currentRole || !roles.includes(currentRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
