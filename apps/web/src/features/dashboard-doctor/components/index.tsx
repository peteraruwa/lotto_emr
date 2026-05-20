'use client';

import React from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import {
  Calendar, Users, ClipboardList, FlaskConical,
  AlertCircle, ArrowRight, Plus,
  Clock, CheckCircle2, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { useDoctorDashboardData, type AppointmentRow } from '../hooks/use-dashboard-data';

// ── helpers ───────────────────────────────────────────────────────────────────

const APPT_VARIANT: Record<string, 'active' | 'completed' | 'cancelled' | 'pending' | 'stable'> = {
  booked:    'active',
  arrived:   'stable',
  fulfilled: 'completed',
  cancelled: 'cancelled',
  noshow:    'cancelled',
  proposed:  'pending',
  pending:   'pending',
  checkedin: 'stable',
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'text-red-600 bg-red-50',
  asap:   'text-orange-600 bg-orange-50',
  stat:   'text-red-700 bg-red-100',
};

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, href, loading,
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; href?: string; loading: boolean;
}) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">
            {loading ? <span className="text-gray-200">—</span> : value}
          </p>
          <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function AppointmentTable({ rows, loading }: { rows: AppointmentRow[]; loading: boolean }) {
  if (loading) {
    return <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (rows.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <Calendar className="h-8 w-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No appointments today</p>
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href="/schedule"><Plus className="h-3.5 w-3.5 mr-1" />View schedule</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-14">Time</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Patient</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">Visit Type</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((appt) => {
            const patientId = appt.patientRef?.replace('Patient/', '');
            const d = appt.time ? new Date(appt.time) : null;
            const timeStr = d && !isNaN(d.getTime()) ? format(d, 'HH:mm') : '—';
            return (
              <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{timeStr}</td>
                <td className="px-4 py-2.5">
                  {patientId
                    ? <Link href={`/patients/${patientId}`} className="font-medium text-hospital-700 hover:underline">{appt.patientName}</Link>
                    : <span className="font-medium">{appt.patientName}</span>
                  }
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">{appt.visitType}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={APPT_VARIANT[appt.status] ?? 'pending'} className="text-xs capitalize whitespace-nowrap">
                    {appt.status === 'noshow' ? 'No Show' : appt.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {patientId && (
                    <Link href={`/patients/${patientId}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2">Open Chart</Button>
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── main dashboard ────────────────────────────────────────────────────────────

export function DoctorDashboard() {
  const medplum = useMedplum();
  const { data, isLoading } = useDoctorDashboardData();
  const profile = medplum.getProfile() as any;
  const firstName = profile?.name?.[0]?.given?.[0] ?? 'Doctor';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-5 p-4 md:p-6">

      {/* Header + quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}, Dr. {firstName}</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm">
            <Link href="/patients/new">
              <Plus className="h-4 w-4 mr-1.5" />Register Patient
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/orders">
              <ClipboardList className="h-4 w-4 mr-1.5" />New Order
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/patients">
              <Users className="h-4 w-4 mr-1.5" />All Patients
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Today's Appointments" value={data?.todayAppointments   ?? 0} icon={Calendar}      color="bg-hospital-600" href="/schedule" loading={isLoading} />
        <StatCard label="Pending Results"       value={data?.pendingResultsCount ?? 0} icon={FlaskConical}  color="bg-amber-500"    href="/results"  loading={isLoading} />
        <StatCard label="Active Encounters"     value={data?.activeEncounters    ?? 0} icon={Activity}      color="bg-green-600"                    loading={isLoading} />
        <StatCard label="Pending Orders"        value={data?.pendingOrdersCount  ?? 0} icon={ClipboardList} color="bg-purple-600"  href="/orders"   loading={isLoading} />
      </div>

      {/* Schedule + pending actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Today's schedule — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-hospital-600" />
                Today's Schedule
              </CardTitle>
              <Link href="/schedule" className="text-xs text-hospital-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <AppointmentTable rows={data?.schedule ?? []} loading={isLoading} />
          </CardContent>
        </Card>

        {/* Pending actions — 1/3 width */}
        <div className="space-y-4">

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-amber-500" />
                Pending Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {isLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : (data?.pendingResults.length ?? 0) === 0 ? (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />All results reviewed
                </div>
              ) : (
                <>
                  {data?.pendingResults.slice(0, 4).map((r) => (
                    <div key={r.id} className="flex items-start gap-2 py-1 border-b last:border-0">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{r.title}</p>
                        <p className="text-xs text-gray-400 truncate">{r.patientName}</p>
                      </div>
                    </div>
                  ))}
                  <Link href="/results" className="text-xs text-hospital-600 hover:underline block pt-1">
                    View all results →
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-purple-500" />
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {isLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : (data?.pendingOrders.length ?? 0) === 0 ? (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />No pending orders
                </div>
              ) : (
                <>
                  {data?.pendingOrders.slice(0, 4).map((o) => (
                    <div key={o.id} className="flex items-start gap-2 py-1 border-b last:border-0">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_COLOR[o.priority] ?? 'text-gray-500 bg-gray-100'}`}>
                        {o.priority === 'routine' ? '·' : o.priority.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{o.title}</p>
                        <p className="text-xs text-gray-400 truncate">{o.patientName}</p>
                      </div>
                    </div>
                  ))}
                  <Link href="/orders" className="text-xs text-hospital-600 hover:underline block pt-1">
                    View all orders →
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Recently seen patients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-hospital-600" />
              Recently Seen Patients
            </CardTitle>
            <Link href="/patients" className="text-xs text-hospital-600 hover:underline flex items-center gap-1">
              All patients <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-6 py-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (data?.recentEncounters.length ?? 0) === 0 ? (
            <div className="px-6 py-6 text-center">
              <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent encounters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {data?.recentEncounters.slice(0, 8).map((enc) => (
                <Link
                  key={enc.id}
                  href={enc.patientId ? `/patients/${enc.patientId}` : '/patients'}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-hospital-100 text-hospital-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {initials(enc.patientName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-hospital-700">
                      {enc.patientName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant={enc.status === 'in-progress' ? 'active' : enc.status === 'finished' ? 'completed' : 'pending'}
                        className="text-xs capitalize"
                      >
                        {enc.status}
                      </Badge>
                      {enc.start && !isNaN(new Date(enc.start).getTime()) && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {isToday(new Date(enc.start))
                            ? format(new Date(enc.start), 'HH:mm')
                            : formatDistanceToNow(new Date(enc.start), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
