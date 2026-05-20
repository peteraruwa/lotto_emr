'use client';

import React from 'react';
import Link from 'next/link';
import { isToday, format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle, Clock, CheckCircle2, ArrowRight,
  FlaskConical, Users, ClipboardCheck,
} from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import type { DoctorDashboardData } from '../hooks/use-dashboard-data';

interface RightPanelProps {
  data: DoctorDashboardData | null;
  isLoading: boolean;
}

export function RightPanel({ data, isLoading }: RightPanelProps) {
  return (
    <div className="space-y-4">

      {/* Results & Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-amber-500" />
              Results & Alerts
              {(data?.pendingResultsCount ?? 0) > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {data!.pendingResultsCount}
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (data?.pendingResults.length ?? 0) === 0 ? (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> All results reviewed
            </div>
          ) : (
            <>
              {data!.pendingResults.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 truncate">{r.patientName}</p>
                  </div>
                </div>
              ))}
              <Link href="/results" className="text-xs text-hospital-600 hover:underline flex items-center gap-1 pt-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Patients */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-hospital-600" /> Recent Patients
            </CardTitle>
            <Link href="/patients" className="text-xs text-hospital-600 hover:underline">
              All
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (data?.recentEncounters.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">No recent patients.</p>
          ) : (
            data!.recentEncounters.slice(0, 6).map((enc) => {
              const href = enc.patientId ? `/patients/${enc.patientId}` : '/patients';
              const start = enc.start ? new Date(enc.start) : null;
              const timeDisplay = start && !isNaN(start.getTime())
                ? isToday(start) ? format(start, 'HH:mm') : formatDistanceToNow(start, { addSuffix: true })
                : null;

              return (
                <Link key={enc.id} href={href} className="flex items-center gap-2 py-1.5 hover:bg-gray-50 rounded px-1 transition-colors group">
                  <div className="w-7 h-7 rounded-full bg-hospital-100 text-hospital-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {enc.patientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate group-hover:text-hospital-700">{enc.patientName}</p>
                    {timeDisplay && (
                      <p className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />{timeDisplay}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={enc.status === 'in-progress' ? 'active' : enc.status === 'finished' ? 'completed' : 'pending'}
                    className="text-xs capitalize flex-shrink-0"
                  >
                    {enc.status}
                  </Badge>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-green-600" /> Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (data?.pendingOrders.length ?? 0) === 0 ? (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> No pending tasks
            </div>
          ) : (
            <>
              {data!.pendingOrders.slice(0, 4).map((o) => (
                <div key={o.id} className="flex items-start gap-2 py-1 border-b last:border-0">
                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    o.priority === 'urgent' || o.priority === 'stat' ? 'bg-red-100 text-red-700'
                    : o.priority === 'asap' ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {o.priority === 'routine' ? 'RTN' : o.priority.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{o.title}</p>
                    <p className="text-xs text-gray-400 truncate">{o.patientName}</p>
                  </div>
                </div>
              ))}
              <Link href="/orders" className="text-xs text-hospital-600 hover:underline flex items-center gap-1 pt-1">
                View all orders <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
