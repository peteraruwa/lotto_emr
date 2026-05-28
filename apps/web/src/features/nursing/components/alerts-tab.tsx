'use client';
import React from 'react';
import { AlertTriangle, Pill, Bell } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { NursingAlert } from '../types';

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-l-red-600 bg-red-50',
  warning:  'border-l-amber-500 bg-amber-50',
  info:     'border-l-blue-400 bg-blue-50',
};

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />,
  warning:  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />,
  info:     <Bell          className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />,
};

interface AlertsTabProps {
  alerts: NursingAlert[];
}

export function AlertsTab({ alerts }: AlertsTabProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bell className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-green-600 font-semibold">No active alerts</p>
        <p className="text-xs text-gray-300 mt-1">All medications on time · No critical vitals</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={cn('rounded-xl border border-gray-100 border-l-4 p-3 flex items-start gap-3', SEVERITY_STYLES[alert.severity])}
        >
          {SEVERITY_ICON[alert.severity]}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {alert.severity === 'critical' && (
                <span className="text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full">CRITICAL</span>
              )}
              <p className="text-sm font-semibold text-gray-800">{alert.patientName}</p>
            </div>
            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
              {alert.type === 'overdue-med' && <Pill className="h-3 w-3 text-gray-400" />}
              {alert.message}
            </p>
            {alert.minutesOverdue !== undefined && alert.minutesOverdue >= 60 && (
              <p className="text-[10px] text-red-600 font-bold mt-1">
                ⚠ Escalate to Charge Nurse — {alert.minutesOverdue >= 120 ? 'CRITICAL DELAY' : 'Overdue >60 min'}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
