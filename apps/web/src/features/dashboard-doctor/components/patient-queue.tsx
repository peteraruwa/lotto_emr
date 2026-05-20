'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, ChevronRight, User } from 'lucide-react';
import { Badge, Button, Card, CardContent } from '@lotto-emr/ui';
import type { AppointmentRow } from '../hooks/use-dashboard-data';

const STATUS_VARIANT: Record<string, 'active' | 'completed' | 'cancelled' | 'pending' | 'stable'> = {
  booked:    'active',
  arrived:   'stable',
  fulfilled: 'completed',
  cancelled: 'cancelled',
  noshow:    'cancelled',
  proposed:  'pending',
  pending:   'pending',
  checkedin: 'stable',
};

interface PatientQueueProps {
  rows: AppointmentRow[];
  loading: boolean;
  todayCount: number;
  onOpenPatient: (row: AppointmentRow) => void;
}

export function PatientQueue({ rows, loading, todayCount, onOpenPatient }: PatientQueueProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="h-10 w-10 text-gray-200 mb-3" />
        <p className="font-medium text-gray-600">No appointments today</p>
        <p className="text-sm text-muted-foreground mt-1">Your schedule is clear.</p>
      </div>
    );
  }

  const waiting  = rows.filter((r) => ['booked', 'pending', 'proposed'].includes(r.status));
  const inRoom   = rows.filter((r) => ['arrived', 'checkedin'].includes(r.status));
  const done     = rows.filter((r) => ['fulfilled', 'cancelled', 'noshow'].includes(r.status));

  function QueueSection({ title, items, highlight }: { title: string; items: AppointmentRow[]; highlight?: boolean }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-hospital-700' : 'text-gray-400'}`}>
          {title} ({items.length})
        </h3>
        {items.map((appt) => {
          const patientId = appt.patientRef?.replace('Patient/', '');
          const d = appt.time ? new Date(appt.time) : null;
          const timeStr = d && !isNaN(d.getTime()) ? format(d, 'HH:mm') : '—';

          return (
            <Card key={appt.id} className={`hover:shadow-md transition-shadow cursor-pointer ${highlight ? 'border-hospital-200' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${highlight ? 'bg-hospital-100 text-hospital-700' : 'bg-gray-100 text-gray-500'}`}>
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{appt.patientName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{timeStr}
                    </span>
                    <span className="text-xs text-gray-400">{appt.visitType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={STATUS_VARIANT[appt.status] ?? 'pending'} className="text-xs capitalize">
                    {appt.status === 'noshow' ? 'No Show' : appt.status}
                  </Badge>
                  {patientId && (
                    <Button
                      size="sm"
                      variant={highlight ? 'default' : 'outline'}
                      className="h-7 text-xs px-2"
                      onClick={() => onOpenPatient(appt)}
                    >
                      Open <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <QueueSection title="In Room / Arrived" items={inRoom} highlight />
      <QueueSection title="Waiting" items={waiting} highlight />
      <QueueSection title="Completed" items={done} />
    </div>
  );
}
