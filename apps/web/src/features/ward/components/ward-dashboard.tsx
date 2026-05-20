'use client';

import React from 'react';
import Link from 'next/link';
import { BedDouble, Users, AlertCircle, LogOut } from 'lucide-react';
import { Card, CardContent, Button } from '@lotto-emr/ui';
import { useWardData } from '../hooks/use-ward-data';
import { WardBedCard } from './ward-bed-card';
import type { WardPatient } from '../hooks/use-ward-data';

// ── Status sort order ─────────────────────────────────────────────────────────
const STATUS_ORDER: Record<WardPatient['status'], number> = {
  critical: 0,
  observation: 1,
  stable: 2,
  'for-discharge': 3,
};

function sortByStatus(a: WardPatient, b: WardPatient): number {
  return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// ── Ward section ──────────────────────────────────────────────────────────────
function WardSection({
  wardName,
  patients,
}: {
  wardName: string;
  patients: WardPatient[];
}) {
  const sorted = [...patients].sort(sortByStatus);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2 px-1">
        <BedDouble className="h-4 w-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-gray-800">
          {wardName}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            ({patients.length} patient{patients.length !== 1 ? 's' : ''})
          </span>
        </h3>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Bed
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Age/Sex
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diagnosis
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Days
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((patient) => (
              <WardBedCard key={patient.encounterId} patient={patient} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function WardDashboard() {
  const { data: patients, isLoading, error } = useWardData();

  // ── Compute stats ─────────────────────────────────────────────────────────
  const total = patients?.length ?? 0;
  const stable = patients?.filter((p) => p.status === 'stable').length ?? 0;
  const critical = patients?.filter((p) => p.status === 'critical').length ?? 0;
  const forDischarge = patients?.filter((p) => p.status === 'for-discharge').length ?? 0;

  // ── Group by ward ─────────────────────────────────────────────────────────
  const wardGroups = new Map<string, WardPatient[]>();
  if (patients) {
    for (const patient of patients) {
      const ward = patient.ward || 'General Ward';
      if (!wardGroups.has(ward)) wardGroups.set(ward, []);
      wardGroups.get(ward)!.push(patient);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ward Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Active inpatient encounters
            {total > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-600 text-white text-xs font-bold">
                {total}
              </span>
            )}
          </p>
        </div>
        <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <Link href="/patients">
            <BedDouble className="h-4 w-4" />
            Find Patient to Admit
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Inpatients" value={total} icon={Users} colorClass="bg-teal-600" />
        <StatCard label="Stable" value={stable} icon={BedDouble} colorClass="bg-green-600" />
        <StatCard label="Critical" value={critical} icon={AlertCircle} colorClass="bg-red-600" />
        <StatCard label="For Discharge" value={forDischarge} icon={LogOut} colorClass="bg-blue-600" />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Bed', 'Patient', 'Age/Sex', 'Diagnosis', 'Days', 'Status', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">Failed to load ward data</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please refresh the page or try again later.
            </p>
          </CardContent>
        </Card>
      ) : wardGroups.size === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BedDouble className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-900">No active inpatients</p>
            <p className="text-sm text-muted-foreground mt-1">
              Admitted patients will appear here.
            </p>
            <Button asChild variant="outline" className="mt-4 gap-2">
              <Link href="/patients">
                <BedDouble className="h-4 w-4" />
                Admit a Patient
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          {Array.from(wardGroups.entries()).map(([wardName, wardPatients]) => (
            <WardSection key={wardName} wardName={wardName} patients={wardPatients} />
          ))}
        </div>
      )}
    </div>
  );
}
