'use client';
import { useMemo } from 'react';
import { differenceInMinutes } from 'date-fns';
import type { MedScheduleEntry } from '../types';
import type { NursingAlert } from '../types';
import { OVERDUE_THRESHOLDS } from '../constants';

export function useNursingAlerts(medQueue: MedScheduleEntry[]): NursingAlert[] {
  return useMemo(() => {
    const alerts: NursingAlert[] = [];
    const now = new Date();

    for (const entry of medQueue) {
      if (entry.status === 'missed' || (entry.status === 'due' && entry.minutesUntilDue < 0)) {
        const overdueMin = Math.abs(differenceInMinutes(entry.scheduledTime, now));
        let severity: NursingAlert['severity'] = 'info';
        if (overdueMin >= OVERDUE_THRESHOLDS.CRITICAL) severity = 'critical';
        else if (overdueMin >= OVERDUE_THRESHOLDS.ESCALATE) severity = 'warning';
        else if (overdueMin >= OVERDUE_THRESHOLDS.WARNING) severity = 'info';

        alerts.push({
          id: `overdue-${entry.scheduleId}`,
          patientId: entry.patientId,
          patientName: entry.patientName,
          type: 'overdue-med',
          severity,
          message: `${entry.drugName} ${entry.dose} — ${overdueMin} min overdue (${entry.scheduledTimeLabel})`,
          at: entry.scheduledTime.toISOString(),
          minutesOverdue: overdueMin,
        });
      }
    }

    return alerts.sort((a, b) => {
      const sevOrder = { critical: 0, warning: 1, info: 2 };
      return (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9);
    });
  }, [medQueue]);
}
