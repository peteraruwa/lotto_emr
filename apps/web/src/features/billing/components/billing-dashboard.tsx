'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { useBillingData } from '../hooks/use-billing-data';
import { BillingQueue } from './billing-queue';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}

function StatCard({ label, value, icon: Icon, color, loading }: StatCardProps) {
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

export function BillingDashboard() {
  const { data: queueItems = [], isLoading } = useBillingData();

  // Today's date boundary (midnight in local time)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayItems = queueItems.filter(
    (item) => new Date(item.submittedAt) >= todayStart
  );

  const stats = {
    totalToday:    todayItems.length,
    awaitingAuth:  queueItems.filter((i) => i.status === 'pending').length,
    approved:      queueItems.filter((i) => i.status === 'approved').length,
    denied:        queueItems.filter((i) => i.status === 'denied').length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing &amp; Authorization</h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Today"
          value={stats.totalToday}
          icon={DollarSign}
          color="bg-indigo-600"
          loading={isLoading}
        />
        <StatCard
          label="Awaiting Authorization"
          value={stats.awaitingAuth}
          icon={Clock}
          color="bg-amber-500"
          loading={isLoading}
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={CheckCircle2}
          color="bg-green-600"
          loading={isLoading}
        />
        <StatCard
          label="Denied"
          value={stats.denied}
          icon={XCircle}
          color="bg-red-500"
          loading={isLoading}
        />
      </div>

      {/* Billing Queue */}
      <BillingQueue />
    </div>
  );
}
