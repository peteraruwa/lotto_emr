'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Search, Bell, Calendar,
  Activity, FlaskConical, ClipboardList, Sparkles,
  CheckCircle2, Clock, ChevronRight, UserCheck,
} from 'lucide-react';
import { Input } from '@lotto-emr/ui';
import { cn } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { useDoctorDashboardData } from '../hooks/use-dashboard-data';
import type { SeenPatientRow } from '../hooks/use-dashboard-data';
import { PatientQueue } from './patient-queue';
import { useStartConsultation } from '../api/use-start-consultation';
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

// ── Patients Seen Today ───────────────────────────────────────────────────────

function seenInitials(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function SeenSkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3 w-40 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-2.5 w-28 rounded-full bg-gray-100 animate-pulse" />
      </div>
      <div className="h-5 w-24 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
    </div>
  );
}

function SeenRow({ row, onOpen }: { row: SeenPatientRow; onOpen: (r: SeenPatientRow) => void }) {
  const ini = seenInitials(row.patientName);
  const timeAgo = row.timeSeen
    ? formatDistanceToNow(new Date(row.timeSeen), { addSuffix: true })
    : '—';
  const timeFormatted = row.timeSeen
    ? format(new Date(row.timeSeen), 'HH:mm')
    : '—';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 transition-colors',
        row.patientId ? 'hover:bg-gray-50/80 cursor-pointer' : '',
      )}
      onClick={() => { if (row.patientId) onOpen(row); }}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {ini}
      </div>

      {/* Name + reason */}
      <div className="flex-1 min-w-0">
        {row.patientId ? (
          <Link
            href={`/patients/${row.patientId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-gray-800 truncate leading-tight hover:text-hospital-700 hover:underline transition-colors block"
          >
            {row.patientName}
          </Link>
        ) : (
          <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{row.patientName}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Clock className="h-3 w-3" />{timeFormatted}
          </span>
          <span className="text-gray-200 flex-shrink-0">·</span>
          <span className="text-xs text-gray-400 truncate">{row.reason}</span>
        </div>
      </div>

      {/* Time ago badge */}
      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 flex-shrink-0">
        <CheckCircle2 className="h-3 w-3" />
        {timeAgo}
      </span>

      {/* Duration chip */}
      {row.duration && row.duration > 0 && (
        <span className="hidden md:inline-flex text-[11px] text-gray-400 font-medium flex-shrink-0">
          {row.duration} min
        </span>
      )}

      {/* Open button (only for real patients with an ID) */}
      {row.patientId ? (
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(row); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-hospital-50 hover:text-hospital-700 text-gray-500 transition-all flex-shrink-0"
        >
          View <ChevronRight className="h-3 w-3" />
        </button>
      ) : (
        <div className="w-[60px] flex-shrink-0" />
      )}
    </div>
  );
}

interface SeenTodayProps {
  rows: SeenPatientRow[];
  loading: boolean;
  onOpen: (row: SeenPatientRow) => void;
}

function SeenToday({ rows, loading, onOpen }: SeenTodayProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm text-gray-800 leading-tight">
              My Consultations Today
            </h2>
            {!loading && rows.length > 0 && (
              <p className="text-xs text-gray-400 leading-tight">
                {rows.length} patient{rows.length !== 1 ? 's' : ''} seen so far
              </p>
            )}
          </div>
        </div>
        <Link
          href="/patients"
          className="flex-shrink-0 text-xs font-medium text-hospital-600 hover:text-hospital-700 bg-hospital-50 hover:bg-hospital-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          All records
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div>{[1, 2, 3].map((i) => <SeenSkeletonRow key={i} />)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <UserCheck className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No consultations yet today</p>
          <p className="text-xs text-gray-400 mt-1">Completed encounters will appear here</p>
        </div>
      ) : (
        <div>
          {rows.map((row) => (
            <SeenRow key={row.id} row={row} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export function DoctorDashboard() {
  const medplum = useMedplum();
  const router = useRouter();
  const { data, isLoading } = useDoctorDashboardData();
  const startConsultation = useStartConsultation();

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

        {/* Centre: patient queue + seen today */}
        <div className="min-w-0 space-y-4">
          {/* Today's patient queue */}
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
                  {!isLoading && (data?.schedule?.length ?? 0) > 0 && (
                    <p className="text-xs text-gray-400 leading-tight">
                      {data!.schedule.length} appointment{data!.schedule.length !== 1 ? 's' : ''} scheduled
                    </p>
                  )}
                </div>
              </div>
              <Link
                href="/schedule"
                className="flex-shrink-0 text-xs font-medium text-hospital-600 hover:text-hospital-700 bg-hospital-50 hover:bg-hospital-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                View schedule
              </Link>
            </div>
            <PatientQueue
              rows={data?.schedule ?? []}
              loading={isLoading}
              onOpenPatient={(appt) => {
                router.push(appt.patientId ? `/patients/${appt.patientId}` : '/patients');
              }}
              onConsult={async (appt) => {
                if (!appt.patientId) return;
                await startConsultation.mutateAsync({
                  patientId: appt.patientId,
                  visitReason: appt.visitType,
                  appointmentId: appt.isMock ? undefined : appt.id,
                });
                router.push(`/patients/${appt.patientId}`);
              }}
            />
          </div>

          {/* Patients seen by me today */}
          <SeenToday
            rows={data?.seenToday ?? []}
            loading={isLoading}
            onOpen={(row) => {
              if (row.patientId) router.push(`/patients/${row.patientId}`);
            }}
          />
        </div>

        {/* Right panel */}
        <div className="min-w-0">
          <RightPanel data={data} isLoading={isLoading} />
        </div>

      </div>
    </div>
  );
}
