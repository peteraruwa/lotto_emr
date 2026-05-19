'use client';

import React from 'react';
import { Badge } from '@lotto-emr/ui';
import { formatDate, formatDateTime } from '@/shared/lib/utils';
import { useEncounters } from '../api/use-encounters';

const STATUS_VARIANT: Record<string, 'active' | 'completed' | 'cancelled' | 'pending' | 'default'> = {
  'in-progress': 'active',
  arrived: 'active',
  triaged: 'pending',
  finished: 'completed',
  cancelled: 'cancelled',
  planned: 'pending',
  unknown: 'default',
};

interface EncounterListProps {
  patientId: string;
}

export function EncounterList({ patientId }: EncounterListProps) {
  const { data: encounters = [], isLoading, error } = useEncounters(patientId);

  if (isLoading) {
    return <div className="text-muted-foreground text-sm py-8 text-center">Loading encounters...</div>;
  }

  if (error) {
    return <div className="text-destructive text-sm py-8 text-center">Failed to load encounters.</div>;
  }

  if (encounters.length === 0) {
    return <div className="text-muted-foreground text-sm py-8 text-center">No encounters recorded for this patient.</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <table className="clinical-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Provider</th>
            <th>Duration</th>
            <th>Discharge</th>
          </tr>
        </thead>
        <tbody>
          {encounters.map((enc) => (
            <tr key={enc.id}>
              <td>{formatDateTime(enc.periodStart)}</td>
              <td>{enc.classDisplay}</td>
              <td>{enc.reasonText}</td>
              <td>
                <Badge variant={STATUS_VARIANT[enc.status] ?? 'default'} className="capitalize text-xs">
                  {enc.status}
                </Badge>
              </td>
              <td>{enc.practitionerName ?? '—'}</td>
              <td>
                {enc.durationMinutes !== undefined
                  ? enc.durationMinutes < 60
                    ? `${enc.durationMinutes} min`
                    : `${Math.floor(enc.durationMinutes / 60)}h ${enc.durationMinutes % 60}m`
                  : '—'}
              </td>
              <td>{enc.periodEnd ? formatDate(enc.periodEnd) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
