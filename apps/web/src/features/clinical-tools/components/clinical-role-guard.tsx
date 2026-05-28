'use client';

import React from 'react';
import { isClinicalRole, type Role } from '@/shared/rbac';
import { useRole } from '@/shared/rbac/use-role';

interface ClinicalRoleGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  role?: Role; // optional override (e.g. tests / SSR-prerendered context)
}

/**
 * Gates content to clinical roles only (doctor, nurse, pharmacist, lab,
 * radiologist, superadmin). Non-clinical roles see the fallback (default: null).
 *
 * UX-only — real access control is enforced by Medplum AccessPolicies.
 */
export function ClinicalRoleGuard({ children, fallback = null, role }: ClinicalRoleGuardProps) {
  const detectedRole = useRole();
  const effectiveRole = role ?? detectedRole;

  if (!effectiveRole || !isClinicalRole(effectiveRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
