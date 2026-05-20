'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Search, Bell, Plus } from 'lucide-react';
import { Button, Input } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { useDoctorDashboardData, type AppointmentRow } from '../hooks/use-dashboard-data';
import { PatientQueue } from './patient-queue';
import { ConsultationView } from './consultation-view';
import { RightPanel } from './right-panel';

// ── Top bar ───────────────────────────────────────────────────────────────────

function TopBar({
  pendingCount,
  firstName,
  greeting,
}: {
  pendingCount: number;
  firstName: string;
  greeting: string;
}) {
  const [search, setSearch] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) window.location.href = `/patients?name=${encodeURIComponent(search.trim())}`;
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white flex-shrink-0">
      <div className="hidden sm:block">
        <p className="text-sm font-semibold text-gray-900">
          {greeting}, Dr. {firstName}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(), 'EEE d MMM yyyy')}
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-sm mx-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search patient (name, MRN, phone)…"
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <Link
          href="/results"
          className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Pending results"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </Link>
        <Button asChild size="sm" className="h-8 text-xs hidden sm:flex">
          <Link href="/patients/new">
            <Plus className="h-3.5 w-3.5 mr-1" />New Patient
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ── Empty consultation placeholder ────────────────────────────────────────────

function NoPatientSelected() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Search className="h-7 w-7 text-gray-300" />
      </div>
      <p className="font-medium text-gray-500">No patient selected</p>
      <p className="text-sm mt-1">Select a patient from the queue to begin consultation</p>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export function DoctorDashboard() {
  const medplum = useMedplum();
  const { data, isLoading } = useDoctorDashboardData();
  const [activeAppt, setActiveAppt] = useState<AppointmentRow | null>(null);

  const profile   = medplum.getProfile() as any;
  const firstName = profile?.name?.[0]?.given?.[0] ?? 'Doctor';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    // Escape AppShell padding (-m-4 / -m-6) so we can control our own layout.
    // h-[calc(100%+Xrem)] compensates for the removed top+bottom padding.
    <div className="-m-4 md:-m-6 h-[calc(100%+2rem)] md:h-[calc(100%+3rem)] flex flex-col bg-gray-50">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <TopBar
        pendingCount={data?.pendingResultsCount ?? 0}
        firstName={firstName}
        greeting={greeting}
      />

      {/* ── Three-column body ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left: patient queue — always visible, fixed width */}
        <div className="w-64 xl:w-72 flex-shrink-0 border-r bg-white overflow-y-auto">
          <div className="px-3 pt-3 pb-1 border-b">
            <h2 className="font-semibold text-sm">Today's Queue</h2>
            {(data?.todayAppointments ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                {data!.todayAppointments} appointment{data!.todayAppointments !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="p-2">
            <PatientQueue
              rows={data?.schedule ?? []}
              loading={isLoading}
              todayCount={data?.todayAppointments ?? 0}
              activeApptId={activeAppt?.id}
              onOpenPatient={setActiveAppt}
            />
          </div>
        </div>

        {/* Center: active consultation */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeAppt ? (
            <div className="p-4">
              <ConsultationView
                appointment={activeAppt}
                onBack={() => setActiveAppt(null)}
              />
            </div>
          ) : (
            <NoPatientSelected />
          )}
        </div>

        {/* Right: results, recent patients, tasks */}
        <div className="w-64 xl:w-72 flex-shrink-0 border-l bg-white overflow-y-auto">
          <RightPanel data={data} isLoading={isLoading} />
        </div>

      </div>
    </div>
  );
}
