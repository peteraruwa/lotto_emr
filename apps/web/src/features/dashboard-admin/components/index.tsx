'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar, Users, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@lotto-emr/ui';
import { useAdminDashboardData } from '../hooks/use-dashboard-data';

const STATUS_VARIANT: Record<string, 'active' | 'completed' | 'cancelled' | 'pending'> = {
  booked: 'active',
  arrived: 'active',
  fulfilled: 'completed',
  cancelled: 'cancelled',
  noshow: 'cancelled',
  proposed: 'pending',
  pending: 'pending',
};

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration Dashboard</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Appointments", value: data?.todayAppointments ?? 0, icon: Calendar, color: 'bg-hospital-600' },
          { label: 'New Registrations Today', value: data?.newRegistrationsToday ?? 0, icon: UserPlus, color: 'bg-green-600' },
          { label: 'Total Active Patients', value: data?.totalActivePatients ?? 0, icon: Users, color: 'bg-purple-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <table className="clinical-table">
              <thead>
                <tr><th>Time</th><th>Patient</th><th>Provider</th><th>Service</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data?.upcomingAppointments.map((appt) => (
                  <tr key={appt.id}>
                    <td className="font-mono text-xs">
                      {appt.time ? format(new Date(appt.time), 'HH:mm') : '—'}
                    </td>
                    <td className="font-medium">{appt.patientName}</td>
                    <td>{appt.practitionerName}</td>
                    <td>{appt.serviceType}</td>
                    <td>
                      <Badge variant={STATUS_VARIANT[appt.status] ?? 'default'} className="text-xs capitalize">
                        {appt.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
