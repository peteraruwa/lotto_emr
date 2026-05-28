'use client';
import React, { useState } from 'react';
import { CheckCircle2, XCircle, PauseCircle, ChevronDown, ChevronUp, AlertTriangle, Pill } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { MedScheduleEntry } from '../types';
import { useMedicationQueue } from '../hooks/use-medication-queue';
import { MedAdminPanel } from './med-administration-panel';
import { ROUTE_LABELS } from '../constants';

const STATUS_COLORS: Record<string, string> = {
  due:       'border-l-red-500 bg-red-50',
  upcoming:  'border-l-gray-200 bg-white',
  completed: 'border-l-green-500 bg-green-50',
  missed:    'border-l-orange-500 bg-orange-50',
  held:      'border-l-amber-500 bg-amber-50',
  skipped:   'border-l-gray-400 bg-gray-50',
  prn:       'border-l-purple-400 bg-purple-50',
};

function overdueBadge(minutesUntilDue: number) {
  const min = Math.abs(minutesUntilDue);
  if (minutesUntilDue < -60) return <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">{min}m overdue</span>;
  if (minutesUntilDue < 0)   return <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{min}m overdue</span>;
  if (minutesUntilDue <= 30) return <span className="text-[10px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full">Due in {minutesUntilDue}m</span>;
  return null;
}

function MedCard({ entry, canAdmin }: { entry: MedScheduleEntry; canAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const routeLabel = ROUTE_LABELS[entry.route.toUpperCase()] ?? entry.route;
  const isDue    = entry.status === 'due';
  const isMissed = entry.status === 'missed';

  return (
    <div className={cn('rounded-xl border-l-4 border border-gray-100 p-3 transition-all', STATUS_COLORS[entry.status] ?? 'bg-white')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900">{entry.drugName}</p>
            {entry.isSTAT && <span className="text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full">STAT</span>}
            {entry.isPRN  && <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full">PRN</span>}
            {entry.allergies.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
          </div>
          <p className="text-xs text-gray-600 mt-0.5">{entry.dose} · {routeLabel || entry.route}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{entry.patientName}</span>
            {entry.bed && <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Bed {entry.bed}</span>}
            {entry.scheduledTimeLabel !== 'PRN' && entry.scheduledTimeLabel !== 'STAT' && (
              <span className="text-xs font-mono text-gray-500">{entry.scheduledTimeLabel}</span>
            )}
            {(isDue || isMissed) && overdueBadge(entry.minutesUntilDue)}
          </div>
        </div>

        {/* Status icon / action toggle */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {entry.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {entry.status === 'held'      && <PauseCircle  className="h-5 w-5 text-amber-500" />}
          {entry.status === 'skipped'   && <XCircle      className="h-5 w-5 text-gray-400" />}
          {(isDue || isMissed || entry.isPRN || entry.isSTAT) && canAdmin && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors',
                expanded ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              )}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Close' : 'Action'}
            </button>
          )}
        </div>
      </div>

      {expanded && canAdmin && (
        <MedAdminPanel entry={entry} onDone={() => setExpanded(false)} />
      )}

      {/* Admin record detail */}
      {entry.adminRecord && entry.status !== 'completed' && entry.adminRecord.reason && (
        <p className="text-[11px] text-gray-500 mt-1.5 italic">Reason: {entry.adminRecord.reason}</p>
      )}
    </div>
  );
}

interface MedicationsTabProps {
  selectedPatientId?: string;
  showAllPatients?: boolean;
}

export function MedicationsTab({ selectedPatientId, showAllPatients = true }: MedicationsTabProps) {
  const { data: allEntries = [], isLoading } = useMedicationQueue();
  const [showAll, setShowAll] = useState(showAllPatients);

  const entries = showAll || !selectedPatientId
    ? allEntries
    : allEntries.filter(e => e.patientId === selectedPatientId);

  const dueNow   = entries.filter(e => e.status === 'due' || e.isSTAT);
  const overdue  = entries.filter(e => e.status === 'missed');
  const upcoming = entries.filter(e => e.status === 'upcoming');
  const prn      = entries.filter(e => e.isPRN && e.status === 'prn');
  const done     = entries.filter(e => ['completed','held','skipped'].includes(e.status));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Pill className="h-8 w-8 text-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Patient filter toggle */}
      {selectedPatientId && (
        <div className="flex gap-2">
          <button onClick={() => setShowAll(false)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors', !showAll ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
            This Patient
          </button>
          <button onClick={() => setShowAll(true)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors', showAll ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
            All Ward ({allEntries.filter(e => e.status === 'due').length} due)
          </button>
        </div>
      )}

      {/* DUE NOW */}
      {(dueNow.length > 0 || overdue.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-xs font-black text-red-700 uppercase tracking-wide">
              Due Now ({dueNow.length}) {overdue.length > 0 && `· Overdue (${overdue.length})`}
            </h3>
          </div>
          <div className="space-y-2">
            {[...dueNow, ...overdue].map(e => <MedCard key={e.scheduleId} entry={e} canAdmin />)}
          </div>
        </section>
      )}

      {/* PRN */}
      {prn.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-purple-700 uppercase tracking-wide mb-2">
            PRN / As Needed ({prn.length})
          </h3>
          <div className="space-y-2">
            {prn.map(e => <MedCard key={e.scheduleId} entry={e} canAdmin />)}
          </div>
        </section>
      )}

      {/* UPCOMING */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
            Upcoming — Next 4h ({upcoming.length})
          </h3>
          <div className="space-y-2">
            {upcoming.map(e => <MedCard key={e.scheduleId} entry={e} canAdmin={false} />)}
          </div>
        </section>
      )}

      {/* COMPLETED / HELD / SKIPPED */}
      {done.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">
            Completed Today ({done.length})
          </h3>
          <div className="space-y-2">
            {done.map(e => <MedCard key={e.scheduleId} entry={e} canAdmin={false} />)}
          </div>
        </section>
      )}

      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Pill className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-400">No medications scheduled</p>
        </div>
      )}
    </div>
  );
}
