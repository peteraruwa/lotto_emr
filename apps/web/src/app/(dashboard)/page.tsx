'use client';

import React from 'react';
import { ShieldOff } from 'lucide-react';
import { useRoleState } from '@/shared/rbac/use-role';
import { ROLES } from '@/shared/rbac/roles';
import { DoctorDashboard } from '@/features/dashboard-doctor';
import { NurseDashboard } from '@/features/dashboard-nurse';
import { PharmacistDashboard } from '@/features/pharmacy';
import { LabDashboard } from '@/features/lab';
import { RadiologistDashboard } from '@/features/radiology';
import { AdminDashboard } from '@/features/dashboard-admin';
import { HrDashboard } from '@/features/dashboard-hr';
import { RecordsDashboard } from '@/features/dashboard-records';
import { BillingDashboard } from '@/features/billing';
import { SuperadminDashboard } from '@/features/dashboard-superadmin';
import { TodayTeamWidget } from '@/features/roster';
import type { Role } from '@/shared/rbac/roles';

// Roles that have their own right-panel and already embed TodayTeamWidget
const ROLES_WITH_OWN_PANEL = new Set<Role>([ROLES.DOCTOR]);

function RoleDashboard({ role }: { role: Role }) {
  switch (role) {
    case ROLES.DOCTOR:      return <DoctorDashboard />;
    case ROLES.NURSE:       return <NurseDashboard />;
    case ROLES.PHARMACIST:  return <PharmacistDashboard />;
    case ROLES.LAB:         return <LabDashboard />;
    case ROLES.RADIOLOGIST: return <RadiologistDashboard />;
    case ROLES.ADMIN:       return <AdminDashboard />;
    case ROLES.HR:          return <HrDashboard />;
    case ROLES.RECORDS:     return <RecordsDashboard />;
    case ROLES.BILLING:     return <BillingDashboard />;
    case ROLES.SUPERADMIN:  return <SuperadminDashboard />;
  }
}

function NoRolePage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <ShieldOff className="h-6 w-6 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">No role assigned</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Your account has not been assigned a hospital role yet. Contact HR or your system administrator to activate your account.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const roleState = useRoleState();

  if (roleState.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-4 h-4 border-2 border-hospital-400 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (roleState.status === 'unauthenticated') {
    return null; // RouteGuard handles the redirect
  }

  if (roleState.status === 'no-tag') {
    return <NoRolePage />;
  }

  const showSideWidget = !ROLES_WITH_OWN_PANEL.has(roleState.role) && roleState.role !== ROLES.HR;

  return (
    <div className={showSideWidget ? 'grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start' : undefined}>
      <div className="min-w-0">
        <RoleDashboard role={roleState.role} />
      </div>
      {showSideWidget && (
        <div className="xl:sticky xl:top-4">
          <TodayTeamWidget />
        </div>
      )}
    </div>
  );
}
