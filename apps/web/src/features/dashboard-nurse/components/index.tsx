'use client';

import React from 'react';
import { format } from 'date-fns';
import { Users, Activity, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { useNurseDashboardData } from '../hooks/use-dashboard-data';
import { TriageQueueTable } from '@/features/triage';

export function NurseDashboard() {
  const medplum = useMedplum();
  const profile = medplum.getProfile();
  const name = profile?.name?.[0]?.given?.[0] ?? 'Nurse';
  const { data, isLoading } = useNurseDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {name}</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ward Patients', value: data?.wardPatientCount ?? 0, icon: Users, color: 'bg-hospital-600' },
          { label: 'Vitals Pending', value: data?.pendingVitalsCount ?? 0, icon: Activity, color: 'bg-amber-500' },
          { label: 'Medications Due', value: data?.medicationsDueCount ?? 0, icon: Pill, color: 'bg-green-600' },
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

      {/* Triage Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            Triage Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TriageQueueTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Ward Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (data?.wardPatients?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No patients currently in ward</p>
          ) : (
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.wardPatients.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.patientName}</td>
                    <td>{p.location}</td>
                    <td>
                      <Badge variant="active" className="text-xs capitalize">{p.status}</Badge>
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
