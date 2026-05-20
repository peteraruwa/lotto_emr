'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import type { AppointmentRow } from '../hooks/use-dashboard-data';

const STATUS_COLOR: Record<string, string> = {
  booked:    'bg-blue-100 text-blue-700',
  arrived:   'bg-teal-100 text-teal-700',
  checkedin: 'bg-teal-100 text-teal-700',
  fulfilled: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  noshow:    'bg-gray-100 text-gray-500',
  proposed:  'bg-yellow-100 text-yellow-700',
  pending:   'bg-yellow-100 text-yellow-700',
};

const STATUS_LABEL: Record<string, string> = {
  booked:    'Waiting',
  arrived:   'In Room',
  checkedin: 'In Room',
  fulfilled: 'Done',
  cancelled: 'Cancelled',
  noshow:    'No Show',
  proposed:  'Pending',
  pending:   'Pending',
};

interface PatientQueueProps {
  rows: AppointmentRow[];
  loading: boolean;
  todayCount: number;
  activeApptId?: string;
  onOpenPatient: (row: AppointmentRow) => void;
}

export function PatientQueue({ rows, loading, todayCount, activeApptId, onOpenPatient }: PatientQueueProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Calendar className="h-8 w-8 text-gray-200 mb-2" />
        <p className="text-sm font-medium text-gray-500">No appointments today</p>
        <p className="text-xs text-muted-foreground mt-0.5">Schedule is clear</p>
      </div>
    );
  }

  // Sort: in-room first, then waiting, then done
  const sorted = [...rows].sort((a, b) => {
    const priority = (s: string) =>
      ['arrived', 'checkedin'].includes(s) ? 0 :
      ['booked', 'pending', 'proposed'].includes(s) ? 1 : 2;
    return priority(a.status) - priority(b.status);
  });

  return (
    <div className="space-y-1">
      {sorted.map((appt) => {
        const patientId = appt.patientRef?.replace('Patient/', '');
        const d = appt.time ? new Date(appt.time) : null;
        const timeStr = d && !isNaN(d.getTime()) ? format(d, 'HH:mm') : '—';
        const isActive = appt.id === activeApptId;
        const statusColor = STATUS_COLOR[appt.status] ?? 'bg-gray-100 text-gray-500';
        const statusLabel = STATUS_LABEL[appt.status] ?? appt.status;
        const initials = appt.patientName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        return (
          <button
            key={appt.id}
            onClick={() => patientId && onOpenPatient(appt)}
            disabled={!patientId}
            className={`w-full text-left rounded-lg p-2.5 transition-colors group ${
              isActive
                ? 'bg-hospital-50 border border-hospital-200'
                : 'hover:bg-gray-50 border border-transparent'
            } ${!patientId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-2.5">
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isActive
                  ? 'bg-hospital-600 text-white'
                  : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
              }`}>
                {initials || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-hospital-700' : 'text-gray-900'}`}>
                  {appt.patientName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                    <Clock className="h-3 w-3" />{timeStr}
                  </span>
                  <span className="text-xs text-gray-400 truncate">{appt.visitType}</span>
                </div>
              </div>

              {/* Status badge */}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
