'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, ChevronRight } from 'lucide-react';
import { Badge, Button } from '@lotto-emr/ui';
import type { AppointmentRow } from '../hooks/use-dashboard-data';

const STATUS_VARIANT: Record<string, 'active' | 'completed' | 'cancelled' | 'pending' | 'stable'> = {
  booked:    'active',
  arrived:   'stable',
  checkedin: 'stable',
  fulfilled: 'completed',
  cancelled: 'cancelled',
  noshow:    'cancelled',
  proposed:  'pending',
  pending:   'pending',
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
  onOpenPatient: (row: AppointmentRow) => void;
}

export function PatientQueue({ rows, loading, onOpenPatient }: PatientQueueProps) {
  if (loading) {
    return (
      <div className="divide-y">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
            <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
            <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
            <div className="h-5 w-16 rounded bg-gray-100 animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-8 w-8 text-gray-200 mb-2" />
        <p className="text-sm font-medium text-gray-500">No appointments today</p>
        <p className="text-xs text-muted-foreground mt-0.5">Your schedule is clear</p>
      </div>
    );
  }

  // Sort: in-room → waiting → done
  const sorted = [...rows].sort((a, b) => {
    const rank = (s: string) =>
      ['arrived', 'checkedin'].includes(s) ? 0 :
      ['booked', 'pending', 'proposed'].includes(s) ? 1 : 2;
    return rank(a.status) - rank(b.status);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-16">Time</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Patient</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Visit Type</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((appt) => {
            const patientId = appt.patientRef?.replace('Patient/', '');
            const d = appt.time ? new Date(appt.time) : null;
            const timeStr = d && !isNaN(d.getTime()) ? format(d, 'HH:mm') : '—';
            const isInRoom = ['arrived', 'checkedin'].includes(appt.status);

            return (
              <tr
                key={appt.id}
                className={`transition-colors ${isInRoom ? 'bg-teal-50 hover:bg-teal-100' : 'hover:bg-gray-50'}`}
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                  {timeStr}
                </td>

                <td className="px-4 py-3">
                  {patientId ? (
                    <Link
                      href={`/patients/${patientId}`}
                      className="font-medium text-hospital-700 hover:underline"
                    >
                      {appt.patientName}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-800">{appt.patientName}</span>
                  )}
                </td>

                <td className="px-4 py-3 text-xs text-gray-500">
                  {appt.visitType}
                </td>

                <td className="px-4 py-3">
                  <Badge
                    variant={STATUS_VARIANT[appt.status] ?? 'pending'}
                    className="text-xs whitespace-nowrap"
                  >
                    {STATUS_LABEL[appt.status] ?? appt.status}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-right">
                  {patientId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2"
                      onClick={() => onOpenPatient(appt)}
                    >
                      Open <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
