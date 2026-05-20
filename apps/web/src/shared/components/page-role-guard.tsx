'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleState } from '@/shared/rbac';
import type { Role } from '@/shared/rbac';

interface PageRoleGuardProps {
  roles: Role[];
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Client component that restricts a page to specific roles.
 * Redirects to redirectTo (default: '/') if the current user's role is not allowed.
 *
 * IMPORTANT: UX only — all real security is enforced by Medplum AccessPolicies.
 */
export function PageRoleGuard({ roles, redirectTo = '/', children }: PageRoleGuardProps) {
  const roleState = useRoleState();
  const router = useRouter();

  useEffect(() => {
    if (roleState.status === 'resolved' && !roles.includes(roleState.role)) {
      router.replace(redirectTo);
    }
  }, [roleState, roles, redirectTo, router]);

  if (roleState.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="inline-block w-6 h-6 border-3 border-hospital-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (roleState.status !== 'resolved' || !roles.includes(roleState.role)) {
    return null;
  }

  return <>{children}</>;
}
