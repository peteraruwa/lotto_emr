'use client';

import React, { useState } from 'react';
import { useRoleState } from '@/shared/rbac/use-role';
import { ROLES, Role } from '@/shared/rbac/roles';
import { DoctorDashboard } from '@/features/dashboard-doctor';
import { NurseDashboard } from '@/features/dashboard-nurse';
import { PharmacistDashboard } from '@/features/dashboard-pharmacist';
import { LabDashboard } from '@/features/dashboard-lab';
import { RadiologistDashboard } from '@/features/dashboard-radiologist';
import { AdminDashboard } from '@/features/dashboard-admin';
import { SuperadminDashboard } from '@/features/dashboard-superadmin';

const ROLE_OPTIONS: { role: Role; label: string; description: string; color: string }[] = [
  { role: ROLES.DOCTOR,      label: 'Doctor',        description: 'Full clinical chart, orders, prescriptions, AI-assisted notes', color: 'bg-blue-600' },
  { role: ROLES.NURSE,       label: 'Nurse',         description: 'Vitals, observations, medication administration, care plans',    color: 'bg-teal-600' },
  { role: ROLES.PHARMACIST,  label: 'Pharmacist',    description: 'Prescription queue, dispense workflow, formulary',              color: 'bg-purple-600' },
  { role: ROLES.LAB,         label: 'Lab Tech',      description: 'Lab orders queue, enter results, flag critical values',         color: 'bg-amber-600' },
  { role: ROLES.RADIOLOGIST, label: 'Radiologist',   description: 'Imaging orders, write diagnostic reports',                      color: 'bg-indigo-600' },
  { role: ROLES.ADMIN,       label: 'Admin',         description: 'Patient registration, scheduling, appointments',                color: 'bg-gray-600' },
  { role: ROLES.SUPERADMIN,  label: 'Super Admin',   description: 'Register employees, manage accounts, system administration',    color: 'bg-red-700' },
];

function RoleDashboard({ role }: { role: Role }) {
  switch (role) {
    case ROLES.DOCTOR:      return <DoctorDashboard />;
    case ROLES.NURSE:       return <NurseDashboard />;
    case ROLES.PHARMACIST:  return <PharmacistDashboard />;
    case ROLES.LAB:         return <LabDashboard />;
    case ROLES.RADIOLOGIST: return <RadiologistDashboard />;
    case ROLES.ADMIN:       return <AdminDashboard />;
    case ROLES.SUPERADMIN:  return <SuperadminDashboard />;
  }
}

function RolePicker({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          Demo Mode — no role tag found on this account
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Choose a role to preview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your Medplum account has no hospital role assigned yet. Pick one to explore that role&apos;s dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLE_OPTIONS.map(({ role, label, description, color }) => (
          <button
            key={role}
            onClick={() => onSelect(role)}
            className="text-left p-4 rounded-xl border border-gray-200 hover:border-hospital-400 hover:shadow-md transition-all group bg-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold`}>
                {label[0]}
              </div>
              <span className="font-semibold text-gray-900 group-hover:text-hospital-700">{label}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        To permanently assign a role, add a tag in Medplum → Project → Members.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const roleState = useRoleState();
  const [demoRole, setDemoRole] = useState<Role | null>(null);

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

  const activeRole = roleState.status === 'resolved' ? roleState.role : demoRole;

  if (!activeRole) {
    return <RolePicker onSelect={setDemoRole} />;
  }

  return (
    <div>
      {roleState.status === 'no-tag' && (
        <div className="mb-4 mx-4 mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2 rounded-lg">
          <span>
            <strong>Demo mode</strong> — viewing as <strong>{activeRole}</strong>. Role not saved to your account.
          </span>
          <button
            onClick={() => setDemoRole(null)}
            className="ml-4 underline hover:no-underline font-medium"
          >
            Switch role
          </button>
        </div>
      )}
      <RoleDashboard role={activeRole} />
    </div>
  );
}
