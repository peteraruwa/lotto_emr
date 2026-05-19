'use client';

import React from 'react';
import { useRole } from '@/shared/rbac/use-role';
import { ROLES } from '@/shared/rbac/roles';
import { DoctorDashboard } from '@/features/dashboard-doctor';
import { NurseDashboard } from '@/features/dashboard-nurse';
import { PharmacistDashboard } from '@/features/dashboard-pharmacist';
import { LabDashboard } from '@/features/dashboard-lab';
import { RadiologistDashboard } from '@/features/dashboard-radiologist';
import { AdminDashboard } from '@/features/dashboard-admin';

/**
 * Dashboard index page.
 * Renders the role-appropriate dashboard based on the current user's role.
 */
export default function DashboardPage() {
  const role = useRole();

  if (!role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading dashboard...</div>
      </div>
    );
  }

  switch (role) {
    case ROLES.DOCTOR:
      return <DoctorDashboard />;
    case ROLES.NURSE:
      return <NurseDashboard />;
    case ROLES.PHARMACIST:
      return <PharmacistDashboard />;
    case ROLES.LAB:
      return <LabDashboard />;
    case ROLES.RADIOLOGIST:
      return <RadiologistDashboard />;
    case ROLES.ADMIN:
      return <AdminDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground text-sm">
            Unknown role. Please contact your system administrator.
          </div>
        </div>
      );
  }
}
