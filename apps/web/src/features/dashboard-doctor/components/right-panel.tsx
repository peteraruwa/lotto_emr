'use client';

import React from 'react';
import Link from 'next/link';
import { isToday, format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle, Clock, CheckCircle2, ArrowRight,
  FlaskConical, Users, ClipboardCheck,
} from 'lucide-react';
import { Badge } from '@lotto-emr/ui';
import type { DoctorDashboardData } from '../hooks/use-dashboard-data';

interface RightPanelProps {
  data: DoctorDashboardData | null;
  isLoading: boolean;
}

function SectionHeader({ title, badge, href }: { title: string; badge?: number; href?: string }) {
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-2">
      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
        {title}
        {badge != null && badge > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {href && (
        <Link href={href} className="text-[10px] text-hospital-600 hover:underline flex items-center gap-0.5">
          All <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      )}
    </div>
  );
}

export function RightPanel({ data, isLoading }: RightPanelProps) {
  return (
    <div className="flex flex-col divide-y text-sm">

      {/* Results & Alerts */}
      <div>
        <SectionHeader
          title="Results & Alerts"
          badge={data?.pendingResultsCount}
          href="/results"
        />
        <div className="px-3 pb-3 space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (data?.pendingResults.length ?? 0) === 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> All results reviewed
            </div>
          ) : (
            data!.pendingResults.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{r.title}</p>
                  <p className="text-[11px] text-gray-400 truncate">{r.patientName}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 font-medium ${
                  r.status === 'registered' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                }`}>
                  {r.status === 'registered' ? 'Critical' : 'Ready'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Patients */}
      <div>
        <SectionHeader title="Recent Patients" href="/patients" />
        <div className="px-3 pb-3 space-y-1">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (data?.recentEncounters.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">No recent patients.</p>
          ) : (
            data!.recentEncounters.slice(0, 6).map((enc) => {
              const href = enc.patientId ? `/patients/${enc.patientId}` : '/patients';
              const start = enc.start ? new Date(enc.start) : null;
              const timeDisplay = start && !isNaN(start.getTime())
                ? isToday(start)
                  ? format(start, 'HH:mm')
                  : formatDistanceToNow(start, { addSuffix: true })
                : null;
              return (
                <Link
                  key={enc.id}
                  href={href}
                  className="flex items-center justify-between hover:bg-gray-50 rounded px-1 py-1 group transition-colors"
                >
                  <span className="text-xs font-medium truncate group-hover:text-hospital-700">
                    {enc.patientName}
                  </span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2 flex items-center gap-0.5">
                    {timeDisplay && <><Clock className="h-2.5 w-2.5" />{timeDisplay}</>}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Tasks / Active Orders */}
      <div>
        <SectionHeader title="Tasks" href="/orders" />
        <div className="px-3 pb-3 space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (data?.pendingOrders.length ?? 0) === 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> No pending tasks
            </div>
          ) : (
            data!.pendingOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-start gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                  ['urgent', 'stat'].includes(o.priority)  ? 'bg-red-100 text-red-700'
                  : o.priority === 'asap'                  ? 'bg-orange-100 text-orange-700'
                  :                                          'bg-gray-100 text-gray-500'
                }`}>
                  {o.priority === 'routine' ? 'RTN' : o.priority.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{o.title}</p>
                  <p className="text-[11px] text-gray-400 truncate">{o.patientName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
