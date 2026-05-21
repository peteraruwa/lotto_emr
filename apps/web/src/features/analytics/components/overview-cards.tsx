'use client';

import React from 'react';
import { TrendingUp, Users, Activity, Stethoscope, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@lotto-emr/ui';
import { useTotalPatients, useEncounterStats, useNewVsReturning } from '../hooks/use-analytics';
import type { DateRange } from '../hooks/use-analytics';

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  loading?: boolean;
  color: string;
}

function KpiCard({ title, value, sub, icon, loading, color }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400 mt-2" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
            {sub && !loading && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  range: DateRange;
}

export function OverviewCards({ range }: Props) {
  const { data: totalPatients, isLoading: pLoading } = useTotalPatients();
  const { data: encounters, isLoading: eLoading } = useEncounterStats(range);
  const { data: nvr, isLoading: nvrLoading } = useNewVsReturning(range);

  const newPct = nvr && nvr.totalCount > 0
    ? Math.round((nvr.newCount / nvr.totalCount) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Total Patients"
        value={totalPatients?.toLocaleString() ?? '—'}
        sub="All time"
        icon={<Users className="h-5 w-5 text-blue-600" />}
        color="bg-blue-50"
        loading={pLoading}
      />
      <KpiCard
        title="Encounters"
        value={encounters?.total?.toLocaleString() ?? '—'}
        sub="In selected period"
        icon={<Activity className="h-5 w-5 text-teal-600" />}
        color="bg-teal-50"
        loading={eLoading}
      />
      <KpiCard
        title="New Patients"
        value={nvr?.newCount?.toLocaleString() ?? '—'}
        sub={`${newPct}% of total`}
        icon={<TrendingUp className="h-5 w-5 text-green-600" />}
        color="bg-green-50"
        loading={nvrLoading}
      />
      <KpiCard
        title="Completed Visits"
        value={encounters?.completed?.toLocaleString() ?? '—'}
        sub="Finished encounters"
        icon={<Stethoscope className="h-5 w-5 text-purple-600" />}
        color="bg-purple-50"
        loading={eLoading}
      />
    </div>
  );
}
