'use client';

import React from 'react';
import Link from 'next/link';
import { usePersistedToggle } from '@/shared/hooks/use-persisted-toggle';
import { isToday, format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle, CheckCircle2, ArrowRight,
  FlaskConical, Users, ClipboardCheck, Clock,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { TodayTeamWidget } from '@/features/roster';
import type { DoctorDashboardData } from '../hooks/use-dashboard-data';

interface RightPanelProps {
  data: DoctorDashboardData | null;
  isLoading: boolean;
}

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 px-4 py-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-3/4 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-2 w-1/2 rounded-full bg-gray-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelSection({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  count,
  viewAllHref,
  children,
  collapsible = false,
  storageKey,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  count?: number;
  viewAllHref?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  /** localStorage key — required when collapsible so state survives navigation */
  storageKey?: string;
}) {
  // Persisted toggle: defaults to collapsed (false). Falls back to plain false
  // if storageKey is not provided (non-collapsible sections).
  const [open, toggle] = usePersistedToggle(
    storageKey ?? `rp:${title}`,
    false,
  );

  const headerContent = (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
        <span className="text-sm font-semibold text-gray-800 truncate">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {viewAllHref && (
          <Link
            href={viewAllHref}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-0.5 text-xs font-medium text-hospital-600 hover:text-hospital-700 transition-colors"
          >
            All <ArrowRight className="h-3 w-3" />
          </Link>
        )}
        {collapsible && (
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        )}
      </div>
    </>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 text-left"
        >
          {headerContent}
        </button>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {headerContent}
        </div>
      )}

      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export function RightPanel({ data, isLoading }: RightPanelProps) {
  return (
    <div className="space-y-3">

      {/* Today's On-Duty Team */}
      <TodayTeamWidget />

      {/* Results & Alerts */}
      <PanelSection
        icon={FlaskConical}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        title="Results & Alerts"
        count={data?.pendingResultsCount}
        viewAllHref="/results"
        collapsible
        storageKey="rp:resultsAlerts"
      >
        {isLoading ? (
          <SectionSkeleton lines={2} />
        ) : (data?.pendingResults.length ?? 0) === 0 ? (
          <div className="flex items-center gap-2.5 px-4 py-4 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-medium">All results reviewed</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data!.pendingResults.slice(0, 5).map((r) => {
              const href = r.patientId ? `/patients/${r.patientId}` : '/results';
              return (
                <Link
                  key={r.id}
                  href={href}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50/40 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight group-hover:text-amber-700 transition-colors">{r.title}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5 group-hover:text-amber-600 transition-colors">{r.patientName}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </PanelSection>

      {/* Recent Patients */}
      <PanelSection
        icon={Users}
        iconColor="text-hospital-600"
        iconBg="bg-hospital-50"
        title="Recent Patients"
        viewAllHref="/patients"
        collapsible
        storageKey="rp:recentPatients"
      >
        {isLoading ? (
          <SectionSkeleton lines={4} />
        ) : (data?.recentEncounters.length ?? 0) === 0 ? (
          <p className="px-4 py-4 text-xs text-gray-400">No recent patients.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data!.recentEncounters.slice(0, 5).map((enc) => {
              const href  = enc.patientId ? `/patients/${enc.patientId}` : '/patients';
              const start = enc.start ? new Date(enc.start) : null;
              const timeDisplay = start && !isNaN(start.getTime())
                ? isToday(start) ? format(start, 'HH:mm') : formatDistanceToNow(start, { addSuffix: true })
                : null;
              const isActive = enc.status === 'in-progress';
              const ini = enc.patientName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

              return (
                <Link
                  key={enc.id}
                  href={href}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                    isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-hospital-100 text-hospital-700',
                  )}>
                    {ini}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-hospital-700 transition-colors leading-tight">
                      {enc.patientName}
                    </p>
                    {timeDisplay && (
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5 flex-shrink-0" />{timeDisplay}
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </PanelSection>

      {/* Tasks / Pending Orders */}
      <PanelSection
        icon={ClipboardCheck}
        iconColor="text-violet-600"
        iconBg="bg-violet-50"
        title="Pending Orders"
        count={data?.pendingOrdersCount}
        viewAllHref="/orders"
        collapsible
        storageKey="rp:pendingOrders"
      >
        {isLoading ? (
          <SectionSkeleton lines={3} />
        ) : (data?.pendingOrders.length ?? 0) === 0 ? (
          <div className="flex items-center gap-2.5 px-4 py-4 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-medium">No pending tasks</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data!.pendingOrders.slice(0, 5).map((o) => {
              const isUrgent = o.priority === 'urgent' || o.priority === 'stat';
              const isAsap   = o.priority === 'asap';
              const priorityCls = isUrgent
                ? 'bg-red-100 text-red-700'
                : isAsap
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-500';
              const priorityLabel = o.priority === 'routine' ? 'RTN' : o.priority.toUpperCase().slice(0, 4);
              const href = o.patientId ? `/patients/${o.patientId}` : '/orders';

              return (
                <Link
                  key={o.id}
                  href={href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-violet-50/40 transition-colors group"
                >
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0', priorityCls)}>
                    {priorityLabel}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight group-hover:text-violet-700 transition-colors">{o.title}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5 group-hover:text-violet-500 transition-colors">{o.patientName}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </PanelSection>

    </div>
  );
}
