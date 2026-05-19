'use client';

import React from 'react';
import { format } from 'date-fns';
import { FlaskConical, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@lotto-emr/ui';
import { formatDateTime } from '@/shared/lib/utils';
import { useLabDashboardData } from '../hooks/use-dashboard-data';

export function LabDashboard() {
  const { data, isLoading } = useLabDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laboratory Dashboard</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600"><FlaskConical className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-xl font-bold">{data?.pendingOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pending Lab Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600"><AlertTriangle className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-xl font-bold">{data?.criticalValues ?? 0}</p>
              <p className="text-xs text-muted-foreground">Critical Values to Report</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {(data?.criticalObservations?.length ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Values — Report Immediately
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.criticalObservations.map((obs) => (
              <div key={obs.id} className="flex items-center justify-between py-2 border-b border-red-200 last:border-0">
                <div>
                  <p className="text-sm font-medium">{obs.patientName}</p>
                  <p className="text-xs text-gray-600">{obs.test}</p>
                </div>
                <span className="critical-value">{obs.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pending Lab Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (data?.labOrders?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No pending lab orders</p>
          ) : (
            <table className="clinical-table">
              <thead>
                <tr><th>Patient</th><th>Test</th><th>Priority</th><th>Ordered</th></tr>
              </thead>
              <tbody>
                {data?.labOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.patientName}</td>
                    <td>{order.test}</td>
                    <td>
                      <Badge variant={order.priority === 'stat' ? 'critical' : order.priority === 'urgent' ? 'destructive' : 'default'} className="text-xs uppercase">
                        {order.priority}
                      </Badge>
                    </td>
                    <td>{formatDateTime(order.orderedAt)}</td>
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
