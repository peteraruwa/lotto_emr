'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Search, Bell, Calendar,
  Activity, FlaskConical, ClipboardList, Plus,
} from 'lucide-react';
import { Card, CardContent, Button, Input } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { useDoctorDashboardData, type AppointmentRow } from '../hooks/use-dashboard-data';
import { PatientQueue } from './patient-queue';
import { ConsultationView } from './consultation-view';
import { RightPanel } from './right-panel';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, href, loading,
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; href?: string; loading: boolean;
}) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xl font-bold leading-tight">
            {loading ? <span className="text-gray-200">—</span> : value}
          </p>
          <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
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
    <div className="flex items-center gap-3 pb-2 border-b mb-1">
      <div className="hidden sm:block flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900">{greeting}, Dr. {firstName}</p>
        <p className="text-xs text-muted-foreground">{format(new Date(), 'EEE, d MMM yyyy')}</p>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-xs">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search patients…"
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/results" className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-600" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </Link>
        <Button asChild size="sm" className="h-8 text-xs">
          <Link href="/patients/new">
            <Plus className="h-3.5 w-3.5 mr-1" />New Patient
          </Link>
        </Button>
      </div>
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
    <div className="space-y-4">

      {/* Top bar */}
      <TopBar
        pendingCount={data?.pendingResultsCount ?? 0}
        firstName={firstName}
        greeting={greeting}
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Today's Appts"     value={data?.todayAppointments   ?? 0} icon={Calendar}      color="bg-hospital-600" href="/schedule" loading={isLoading} />
        <StatCard label="Active Encounters"  value={data?.activeEncounters    ?? 0} icon={Activity}      color="bg-green-600"                    loading={isLoading} />
        <StatCard label="Pending Results"   value={data?.pendingResultsCount ?? 0} icon={FlaskConical}  color="bg-amber-500"    href="/results"  loading={isLoading} />
        <StatCard label="Pending Orders"    value={data?.pendingOrdersCount  ?? 0} icon={ClipboardList} color="bg-purple-600"  href="/orders"   loading={isLoading} />
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

        {/* Centre: queue table OR active consultation */}
        <div>
          {activeAppt ? (
            <ConsultationView
              appointment={activeAppt}
              onBack={() => setActiveAppt(null)}
            />
          ) : (
            <Card>
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-hospital-600" />
                  Today's Patient Queue
                  {(data?.todayAppointments ?? 0) > 0 && (
                    <span className="ml-1 text-xs bg-hospital-100 text-hospital-700 px-1.5 py-0.5 rounded-full font-medium">
                      {data!.todayAppointments}
                    </span>
                  )}
                </h2>
                <Link href="/schedule" className="text-xs text-hospital-600 hover:underline">
                  Manage schedule →
                </Link>
              </div>
              <CardContent className="p-0">
                <PatientQueue
                  rows={data?.schedule ?? []}
                  loading={isLoading}
                  onOpenPatient={(appt) => setActiveAppt(appt)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right panel: alerts + recent patients + tasks */}
        <RightPanel data={data} isLoading={isLoading} />

      </div>
    </div>
  );
}
