'use client';

import React from 'react';
import { format } from 'date-fns';
import { Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@lotto-emr/ui';
import { formatDateTime } from '@/shared/lib/utils';
import { usePharmacistDashboardData } from '../hooks/use-dashboard-data';

const PRIORITY_VARIANT: Record<string, 'critical' | 'destructive' | 'pending' | 'default'> = {
  stat: 'critical',
  urgent: 'destructive',
  asap: 'pending',
  routine: 'default',
};

export function PharmacistDashboard() {
  const { data, isLoading } = usePharmacistDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold">{data?.pendingPrescriptions ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pending Prescriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-600">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold">{data?.dispensedToday ?? 0}</p>
              <p className="text-xs text-muted-foreground">Dispensed Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pending Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (data?.prescriptions?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No pending prescriptions</p>
          ) : (
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medication</th>
                  <th>Priority</th>
                  <th>Ordered</th>
                </tr>
              </thead>
              <tbody>
                {data?.prescriptions.map((rx) => (
                  <tr key={rx.id}>
                    <td className="font-medium">{rx.patientName}</td>
                    <td>{rx.medication}</td>
                    <td>
                      <Badge variant={PRIORITY_VARIANT[rx.priority] ?? 'default'} className="text-xs capitalize">
                        {rx.priority}
                      </Badge>
                    </td>
                    <td>{formatDateTime(rx.orderedAt)}</td>
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
