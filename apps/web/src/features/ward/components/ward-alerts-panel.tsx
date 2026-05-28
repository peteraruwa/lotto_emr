'use client';
import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Activity, Pill, CheckCircle2, X } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { WardAlert, WardPatient, WardTask } from '../types';

interface WardAlertsPanelProps {
  alerts: WardAlert[];
  patients: WardPatient[];
  tasks: WardTask[];
  acknowledgedIds: Set<string>;
  onAcknowledge: (alertId: string) => void;
  onClose?: () => void;
}

const SEVERITY_STYLES: Record<WardAlert['severity'], { border: string; bg: string; text: string; iconColor: string; pill: string }> = {
  critical: {
    border: 'border-red-300',
    bg: 'bg-red-50',
    text: 'text-red-800',
    iconColor: 'text-red-600',
    pill: 'bg-red-600 text-white',
  },
  high: {
    border: 'border-orange-300',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    iconColor: 'text-orange-600',
    pill: 'bg-orange-500 text-white',
  },
  warning: {
    border: 'border-amber-300',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    iconColor: 'text-amber-600',
    pill: 'bg-amber-500 text-white',
  },
};

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return 'just now';
  }
}

export function WardAlertsPanel({
  alerts,
  patients,
  tasks,
  acknowledgedIds,
  onAcknowledge,
  onClose,
}: WardAlertsPanelProps) {
  const activeAlerts = alerts.filter(a => !acknowledgedIds.has(a.id));
  const deteriorating = patients.filter(
    p => p.status === 'critical' || p.status === 'observation' || (p.news2Score ?? 0) >= 5
  );
  const pendingMeds = tasks
    .filter(t => t.type === 'medication' && (t.status === 'due' || t.status === 'upcoming' || t.status === 'overdue'))
    .slice(0, 6);

  return (
    <aside className="w-[280px] shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-teal-600" />
          <h3 className="text-xs font-bold text-slate-800">Live Activity</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Critical Alerts */}
        <section className="px-3 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                Critical Alerts
              </h4>
            </div>
            <span className="text-[10px] font-bold text-red-600">{activeAlerts.length}</span>
          </div>

          {activeAlerts.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-1 py-2">
              No active alerts. All patients stable.
            </p>
          ) : (
            <div className="space-y-1.5">
              {activeAlerts.slice(0, 8).map(a => {
                const s = SEVERITY_STYLES[a.severity];
                return (
                  <div key={a.id} className={cn('rounded-md border p-2', s.border, s.bg)}>
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className={cn('h-3 w-3 mt-0.5 shrink-0', s.iconColor)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={cn('text-[9px] font-bold uppercase px-1 py-0.5 rounded', s.pill)}>
                            {a.severity}
                          </span>
                          <span className={cn('text-[10px] font-semibold truncate', s.text)}>
                            {a.patientName}
                          </span>
                        </div>
                        <p className={cn('text-[10px] mt-0.5 leading-snug', s.text)}>{a.message}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          {a.ward} · Bed {a.bedNumber} · {timeAgo(a.detectedAt)}
                        </p>
                        <button
                          onClick={() => onAcknowledge(a.id)}
                          className="mt-1 text-[10px] px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Deteriorating Patients */}
        <section className="px-3 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-orange-600" />
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                Deteriorating
              </h4>
            </div>
            <span className="text-[10px] font-bold text-orange-600">{deteriorating.length}</span>
          </div>

          {deteriorating.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-1 py-2">No deteriorating patients.</p>
          ) : (
            <div className="space-y-1">
              {deteriorating.slice(0, 6).map(p => (
                <Link
                  key={p.patientId}
                  href={`/patients/${p.patientId}`}
                  className="block rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-slate-800 truncate">
                      {p.patientName}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                        p.status === 'critical'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-100 text-amber-800'
                      )}
                    >
                      A{p.acuityScore ?? 1}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {p.ward} · Bed {p.bedNumber}
                    {p.news2Score !== undefined && ` · NEWS2 ${p.news2Score}`}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Pending Meds */}
        <section className="px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5 text-indigo-600" />
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                Pending Meds
              </h4>
            </div>
            <span className="text-[10px] font-bold text-indigo-600">{pendingMeds.length}</span>
          </div>

          {pendingMeds.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-1 py-2">No medication tasks pending.</p>
          ) : (
            <div className="space-y-1">
              {pendingMeds.map(t => (
                <div key={t.id} className="rounded-md border border-slate-200 bg-white p-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-slate-800 truncate">
                      {t.patientName}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase px-1 py-0.5 rounded',
                        t.status === 'overdue' && 'bg-red-100 text-red-700',
                        t.status === 'due' && 'bg-amber-100 text-amber-700',
                        t.status === 'upcoming' && 'bg-blue-100 text-blue-700'
                      )}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 truncate mt-0.5">{t.description}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Bed {t.bedNumber} ·{' '}
                    {t.minutesUntilDue < 0
                      ? `${Math.abs(t.minutesUntilDue)}m overdue`
                      : `in ${t.minutesUntilDue}m`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
