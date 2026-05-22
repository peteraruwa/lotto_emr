'use client';

import React from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Users,
  UserPlus,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@lotto-emr/ui';
import { useAdminDashboardData, type AppointmentRow } from '../hooks/use-dashboard-data';

const APPT_VARIANT: Record<string, 'active' | 'completed' | 'cancelled' | 'pending' | 'stable'> = {
  booked: 'active',
  arrived: 'stable',
  fulfilled: 'completed',
  cancelled: 'cancelled',
  noshow: 'cancelled',
  proposed: 'pending',
  pending: 'pending',
};

const GENDER_LABEL: Record<string, string> = {
  male: 'M',
  female: 'F',
  other: 'O',
  unknown: '—',
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">
            {loading ? <span className="text-gray-300">—</span> : value}
          </p>
          <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={APPT_VARIANT[status] ?? 'default'} className="text-xs capitalize whitespace-nowrap">
      {status === 'noshow' ? 'No Show' : status}
    </Badge>
  );
}

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboardData();

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm">
            <Link href="/patients/new">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Register Patient
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/schedule">
              <Plus className="h-4 w-4 mr-1.5" />
              New Appointment
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/patients">
              <Users className="h-4 w-4 mr-1.5" />
              All Patients
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Today's Appointments"   value={data?.todayAppointments ?? 0}    icon={Calendar}  color="bg-hospital-600" loading={isLoading} />
        <StatCard label="New Registrations Today" value={data?.newRegistrationsToday ?? 0} icon={UserPlus}  color="bg-green-600"    loading={isLoading} />
        <StatCard label="Total Active Patients"   value={data?.totalActivePatients ?? 0}  icon={Users}     color="bg-purple-600"   loading={isLoading} />
        <StatCard label="Pending Confirmations"   value={data?.pendingAppointments ?? 0}  icon={Clock}     color="bg-amber-500"    loading={isLoading} />
      </div>

      {/* Today's Schedule + Recent Registrations side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Appointment schedule — takes 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-hospital-600" />
                Today&apos;s Schedule
              </CardTitle>
              <Link href="/schedule" className="text-xs text-hospital-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (data?.upcomingAppointments.length ?? 0) === 0 ? (
              <div className="px-6 py-8 text-center">
                <Calendar className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No appointments scheduled today</p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link href="/schedule"><Plus className="h-3.5 w-3.5 mr-1" />Book one</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Time</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Patient</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Doctor</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Service</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data?.upcomingAppointments.map((appt: AppointmentRow) => {
                      const patientId = appt.patientRef?.replace('Patient/', '');
                      return (
                        <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-600 whitespace-nowrap">
                            {appt.time ? format(new Date(appt.time), 'HH:mm') : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            {patientId ? (
                              <Link href={`/patients/${patientId}`} className="font-medium text-hospital-700 hover:underline">
                                {appt.patientName}
                              </Link>
                            ) : (
                              <span className="font-medium">{appt.patientName}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">{appt.practitionerName}</td>
                          <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">{appt.serviceType}</td>
                          <td className="px-4 py-2.5">
                            <AppointmentStatusBadge status={appt.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent registrations — takes 1/3 width */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                Recent Registrations
              </CardTitle>
              <Link href="/patients" className="text-xs text-hospital-600 hover:underline flex items-center gap-1">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (data?.recentRegistrations.length ?? 0) === 0 ? (
              <div className="px-4 py-6 text-center">
                <UserPlus className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No patients registered yet</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/patients/new"><Plus className="h-3.5 w-3.5 mr-1" />Register first patient</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data?.recentRegistrations.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/patients/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-hospital-100 text-hospital-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-hospital-700">
                          {p.fullName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.mrn} · {GENDER_LABEL[p.gender] ?? '—'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">
                          {p.registeredAt
                            ? formatDistanceToNow(new Date(p.registeredAt), { addSuffix: true })
                            : '—'}
                        </p>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-auto mt-0.5" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
