'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Users, ClipboardList, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { useDoctorDashboardData } from '../hooks/use-dashboard-data';

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

/**
 * Doctor dashboard: today's patients, pending orders, critical alerts, recent encounters.
 */
export function DoctorDashboard() {
  const medplum = useMedplum();
  const { data, isLoading } = useDoctorDashboardData();
  const profile = medplum.getProfile();
  const name = profile?.name?.[0]?.given?.[0] ?? 'Doctor';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Good morning, Dr. {name}</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Today's Appointments"
          value={data?.todayPatientCount ?? 0}
          icon={Calendar}
          color="bg-hospital-600"
          href="/schedule"
        />
        <StatCard
          title="Pending Orders"
          value={data?.pendingOrdersCount ?? 0}
          icon={ClipboardList}
          color="bg-amber-500"
          href="/orders"
        />
        <StatCard
          title="Critical Alerts"
          value={data?.criticalAlertsCount ?? 0}
          icon={AlertTriangle}
          color="bg-red-500"
          href="/results"
        />
      </div>

      {/* Upcoming appointments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (data?.upcomingAppointments?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments today</p>
            ) : (
              <ul className="space-y-3">
                {data?.upcomingAppointments.map((appt) => (
                  <li key={appt.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{appt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{appt.reason}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {appt.time ? format(new Date(appt.time), 'HH:mm') : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Active encounters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Encounters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (data?.recentEncounters?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No active encounters</p>
            ) : (
              <ul className="space-y-3">
                {data?.recentEncounters.map((enc) => (
                  <li key={enc.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{enc.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {enc.startTime ? format(new Date(enc.startTime), 'HH:mm') : '—'}
                      </p>
                    </div>
                    <Badge variant="active" className="text-xs capitalize">{enc.status}</Badge>
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
