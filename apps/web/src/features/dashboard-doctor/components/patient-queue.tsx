'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { AppointmentRow } from '../hooks/use-dashboard-data';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  booked:    { label: 'Waiting',   className: 'bg-blue-50 text-blue-700' },
  arrived:   { label: 'In Room',   className: 'bg-emerald-50 text-emerald-700' },
  checkedin: { label: 'In Room',   className: 'bg-emerald-50 text-emerald-700' },
  fulfilled: { label: 'Done',      className: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600' },
  noshow:    { label: 'No Show',   className: 'bg-orange-50 text-orange-600' },
  proposed:  { label: 'Pending',   className: 'bg-yellow-50 text-yellow-700' },
  pending:   { label: 'Pending',   className: 'bg-yellow-50 text-yellow-700' },
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

interface PatientQueueProps {
  rows: AppointmentRow[];
  loading: boolean;
  onOpenPatient: (row: AppointmentRow) => void;
  onConsult?: (row: AppointmentRow) => void;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3 w-36 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-2.5 w-24 rounded-full bg-gray-100 animate-pulse" />
      </div>
      <div className="h-6 w-16 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="h-7 w-14 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Calendar className="h-7 w-7 text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-600">No appointments today</p>
      <p className="text-xs text-gray-400 mt-1">Your schedule is clear for today</p>
    </div>
  );
}

function QueueRow({
  appt,
  onOpenPatient,
  onConsult,
}: {
  appt: AppointmentRow;
  onOpenPatient: (a: AppointmentRow) => void;
  onConsult?: (a: AppointmentRow) => void;
}) {
  const d = appt.time ? new Date(appt.time) : null;
  const timeStr = d && !isNaN(d.getTime()) ? format(d, 'HH:mm') : '—';
  const isInRoom = ['arrived', 'checkedin'].includes(appt.status);
  const isDone   = ['fulfilled', 'cancelled', 'noshow'].includes(appt.status);
  const cfg      = STATUS_CONFIG[appt.status] ?? { label: appt.status, className: 'bg-gray-100 text-gray-500' };
  const ini      = initials(appt.patientName);

  function handleClick() {
    if (isInRoom && onConsult) {
      onConsult(appt);
    } else {
      onOpenPatient(appt);
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 transition-colors',
        isInRoom ? 'bg-emerald-50/50' : isDone ? 'opacity-60' : 'hover:bg-gray-50/80',
      )}
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
        isInRoom ? 'bg-emerald-100 text-emerald-700' : 'bg-hospital-100 text-hospital-700')}>
        {ini}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {isInRoom && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
          <Link
            href={`/patients/${appt.patientId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-gray-800 truncate leading-tight hover:text-hospital-700 hover:underline transition-colors"
          >
            {appt.patientName}
          </Link>
        </div>
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Clock className="h-3 w-3" />{timeStr}
          </span>
          <span className="text-gray-200 flex-shrink-0">·</span>
          <span className="text-xs text-gray-400 truncate">{appt.visitType}</span>
        </div>
      </div>

      <span className={cn('hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0', cfg.className)}>
        {cfg.label}
      </span>

      <button
        onClick={handleClick}
        disabled={isDone}
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0',
          isInRoom
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
            : isDone
            ? 'bg-gray-100 text-gray-400 cursor-default'
            : 'bg-hospital-50 hover:bg-hospital-600 hover:text-white text-hospital-700',
        )}
      >
        {isInRoom ? 'Consult' : 'Open'}
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function QueueCard({
  appt,
  onOpenPatient,
  onConsult,
}: {
  appt: AppointmentRow;
  onOpenPatient: (a: AppointmentRow) => void;
  onConsult?: (a: AppointmentRow) => void;
}) {
  const d = appt.time ? new Date(appt.time) : null;
  const timeStr = d && !isNaN(d.getTime()) ? format(d, 'h:mm a') : '—';
  const isInRoom = ['arrived', 'checkedin'].includes(appt.status);
  const isDone   = ['fulfilled', 'cancelled', 'noshow'].includes(appt.status);
  const cfg      = STATUS_CONFIG[appt.status] ?? { label: appt.status, className: 'bg-gray-100 text-gray-500' };
  const ini      = initials(appt.patientName);
  function handleClick() {
    if (isInRoom && onConsult) {
      onConsult(appt);
    } else {
      onOpenPatient(appt);
    }
  }

  return (
    <div className={cn(
      'mx-4 my-2 rounded-xl border p-3 flex items-center gap-3',
      isInRoom ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100',
    )}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
        isInRoom ? 'bg-emerald-100 text-emerald-700' : 'bg-hospital-100 text-hospital-700')}>
        {ini}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/patients/${appt.patientId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-semibold text-gray-800 truncate leading-tight hover:text-hospital-700 hover:underline transition-colors block"
        >
          {appt.patientName}
        </Link>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 flex-shrink-0">{timeStr}</span>
          <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0', cfg.className)}>
            {cfg.label}
          </span>
        </div>
      </div>
      <button
        onClick={handleClick}
        disabled={isDone}
        className={cn(
          'w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors',
          isInRoom
            ? 'bg-emerald-600 text-white'
            : isDone
            ? 'bg-gray-100 text-gray-300 cursor-default'
            : 'bg-hospital-600 text-white',
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PatientQueue({ rows, loading, onOpenPatient, onConsult }: PatientQueueProps) {
  if (loading) {
    return <div>{[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}</div>;
  }

  if (rows.length === 0) return <EmptyQueue />;

  const sorted = [...rows].sort((a, b) => {
    const rank = (s: string) =>
      ['arrived', 'checkedin'].includes(s) ? 0 :
      ['booked', 'pending', 'proposed'].includes(s) ? 1 : 2;
    const rankDiff = rank(a.status) - rank(b.status);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  return (
    <>
      <div className="sm:hidden py-2">
        {sorted.map((appt) => (
          <QueueCard key={appt.id} appt={appt} onOpenPatient={onOpenPatient} onConsult={onConsult} />
        ))}
      </div>
      <div className="hidden sm:block">
        {sorted.map((appt) => (
          <QueueRow key={appt.id} appt={appt} onOpenPatient={onOpenPatient} onConsult={onConsult} />
        ))}
      </div>
    </>
  );
}
