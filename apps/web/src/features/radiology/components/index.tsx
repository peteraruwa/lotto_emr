'use client';

import React from 'react';
import { format } from 'date-fns';
import { Scan, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@lotto-emr/ui';
import { formatDateTime } from '@/shared/lib/utils';
import { useRadiologistDashboardData } from '../hooks/use-dashboard-data';

export function RadiologistDashboard() {
  const { data, isLoading } = useRadiologistDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Radiology Dashboard</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-600"><Scan className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-xl font-bold">{data?.pendingImagingOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pending Imaging Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500"><FileText className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-xl font-bold">{data?.reportsToSign ?? 0}</p>
              <p className="text-xs text-muted-foreground">Reports to Sign</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pending Imaging Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (data?.imagingOrders?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No pending imaging orders</p>
          ) : (
            <table className="clinical-table">
              <thead>
                <tr><th>Patient</th><th>Study</th><th>Priority</th><th>Ordered</th></tr>
              </thead>
              <tbody>
                {data?.imagingOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.patientName}</td>
                    <td>{order.study}</td>
                    <td>
                      <Badge variant={order.priority === 'stat' ? 'critical' : 'default'} className="text-xs uppercase">
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
