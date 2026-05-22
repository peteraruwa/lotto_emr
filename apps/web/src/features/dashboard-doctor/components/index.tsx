'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Search, Bell, Calendar,
  Activity, FlaskConical, ClipboardList, Sparkles, DatabaseZap, Loader2,
} from 'lucide-react';
import { Input } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { useQueryClient } from '@tanstack/react-query';
import { formatPatientName } from '@lotto-emr/core';
import type { Patient } from '@medplum/fhirtypes';
import { useDoctorDashboardData } from '../hooks/use-dashboard-data';
import { PatientQueue } from './patient-queue';
import { RightPanel } from './right-panel';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, gradient, href, loading, sub,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  href?: string;
  loading: boolean;
  sub?: string;
}) {
  const inner = (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 ${gradient} text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-3xl font-bold leading-none tracking-tight">
            {loading ? (
              <span className="inline-block w-10 h-8 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              value
            )}
          </p>
          <p className="mt-1.5 text-xs font-semibold text-white/90 truncate">{label}</p>
          {sub && <p className="text-[11px] text-white/60 truncate mt-0.5">{sub}</p>}
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
    </div>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>;
}

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
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-hospital-500 flex-shrink-0" />
          <h1 className="text-base font-bold text-gray-900 truncate">
            {greeting}, Dr.&nbsp;{firstName}
          </h1>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 pl-6">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search patients…"
            className="pl-8 h-9 text-sm w-40 sm:w-52 rounded-xl bg-gray-100 border-transparent focus:border-hospital-300 focus:bg-white transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <Link
          href="/results"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

// ── Seed queue button (dev/testing utility) ───────────────────────────────────

const SEED_SLOTS: { offsetMin: number; status: string; visitType: string }[] = [
  { offsetMin: -150, status: 'arrived',   visitType: 'General Consultation' },
  { offsetMin: -120, status: 'arrived',   visitType: 'Follow-up' },
  { offsetMin:  -90, status: 'fulfilled', visitType: 'General Consultation' },
  { offsetMin:  -60, status: 'booked',    visitType: 'ANC Visit' },
  { offsetMin:  -30, status: 'booked',    visitType: 'General Consultation' },
  { offsetMin:    0, status: 'booked',    visitType: 'Specialist Referral' },
  { offsetMin:   30, status: 'booked',    visitType: 'Follow-up' },
  { offsetMin:   60, status: 'noshow',    visitType: 'General Consultation' },
];

function SeedQueueButton() {
  const medplum     = useMedplum();
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [done, setDone]       = useState(false);

  async function handleSeed() {
    setSeeding(true);
    try {
      const bundle = await medplum.search('Patient', { _count: '10', _sort: '-_lastUpdated' });
      const patients = (bundle.entry ?? [])
        .filter((e) => e.resource?.resourceType === 'Patient')
        .map((e) => e.resource as Patient);

      if (patients.length === 0) return;

      const now = new Date();
      const limit = Math.min(patients.length, SEED_SLOTS.length);

      await Promise.all(
        SEED_SLOTS.slice(0, limit).map((slot, i) => {
          const patient = patients[i];
          const start   = new Date(now.getTime() + slot.offsetMin * 60_000);
          const end     = new Date(start.getTime() + 30 * 60_000);
          return medplum.createResource({
            resourceType: 'Appointment',
            status: slot.status as any,
            start: start.toISOString(),
            end:   end.toISOString(),
            participant: [{
              actor:  { reference: `Patient/${patient.id}`, display: formatPatientName(patient.name) },
              status: 'accepted',
            }],
            serviceType: [{ text: slot.visitType }],
          });
        }),
      );

      await queryClient.invalidateQueries({ queryKey: ['doctor-dash', 'appointments'] });
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <button
      onClick={handleSeed}
      disabled={seeding}
      title="Seed test appointments for today's queue"
      className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-hospital-600 hover:bg-hospital-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
    >
      {seeding
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <DatabaseZap className="h-3.5 w-3.5" />
      }
      {done ? 'Seeded!' : 'Seed queue'}
    </button>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export function DoctorDashboard() {
  const medplum = useMedplum();
  const router = useRouter();
  const { data, isLoading } = useDoctorDashboardData();

  const profile   = medplum.getProfile() as any;
  const firstName = profile?.name?.[0]?.given?.[0] ?? 'Doctor';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Top bar card */}
      <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100">
        <TopBar
          pendingCount={data?.pendingResultsCount ?? 0}
          firstName={firstName}
          greeting={greeting}
        />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Today's Appointments"
          value={data?.todayAppointments ?? 0}
          icon={Calendar}
          gradient="stat-gradient-blue"
          href="/schedule"
          loading={isLoading}
          sub="Scheduled visits"
        />
        <StatCard
          label="Active Encounters"
          value={data?.activeEncounters ?? 0}
          icon={Activity}
          gradient="stat-gradient-green"
          href="/ward"
          loading={isLoading}
          sub="In progress"
        />
        <StatCard
          label="Pending Results"
          value={data?.pendingResultsCount ?? 0}
          icon={FlaskConical}
          gradient="stat-gradient-amber"
          href="/results"
          loading={isLoading}
          sub="Awaiting review"
        />
        <StatCard
          label="Pending Orders"
          value={data?.pendingOrdersCount ?? 0}
          icon={ClipboardList}
          gradient="stat-gradient-violet"
          href="/orders"
          loading={isLoading}
          sub="To be actioned"
        />
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

        {/* Centre: patient queue */}
        <div className="min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-hospital-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-hospital-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm text-gray-800 leading-tight">
                    Today's Patient Queue
                  </h2>
                  {!isLoading && (data?.todayAppointments ?? 0) > 0 && (
                    <p className="text-xs text-gray-400 leading-tight">
                      {data!.todayAppointments} appointment{data!.todayAppointments !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <SeedQueueButton />
                <Link
                  href="/schedule"
                  className="text-xs font-medium text-hospital-600 hover:text-hospital-700 bg-hospital-50 hover:bg-hospital-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  View schedule
                </Link>
              </div>
            </div>
            <PatientQueue
              rows={data?.schedule ?? []}
              loading={isLoading}
              onOpenPatient={(appt) => {
                if (appt.patientId) router.push(`/patients/${appt.patientId}`);
              }}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="min-w-0">
          <RightPanel data={data} isLoading={isLoading} />
        </div>

      </div>
    </div>
  );
}
