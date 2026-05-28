'use client';
import React from 'react';
import { AlertTriangle, Bell, Zap, Package, Lock, Pill } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { PharmacyAlert } from '../types';

const SEV_STYLES: Record<string, string> = {
  critical: 'border-l-red-600 bg-red-50',
  high:     'border-l-orange-500 bg-orange-50',
  moderate: 'border-l-amber-400 bg-amber-50',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  allergy:         <AlertTriangle className="h-4 w-4 text-red-600" />,
  interaction:     <AlertTriangle className="h-4 w-4 text-orange-600" />,
  stat:            <Zap           className="h-4 w-4 text-red-600" />,
  'stock-shortage':<Package       className="h-4 w-4 text-amber-600" />,
  'controlled-drug':<Lock         className="h-4 w-4 text-purple-600" />,
  overdose:        <AlertTriangle className="h-4 w-4 text-red-700" />,
  duplicate:       <Pill          className="h-4 w-4 text-orange-600" />,
};

interface AlertsPanelProps {
  alerts: PharmacyAlert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm font-semibold text-green-600">No active alerts</p>
        <p className="text-xs text-gray-300 mt-1">All prescriptions clear</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div key={alert.id} className={cn('rounded-xl border border-transparent border-l-4 p-3 flex items-start gap-2.5', SEV_STYLES[alert.severity])}>
          <div className="flex-shrink-0 mt-0.5">{TYPE_ICON[alert.type] ?? <Bell className="h-4 w-4 text-gray-500" />}</div>
          <div className="flex-1 min-w-0">
            {alert.severity === 'critical' && (
              <span className="text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full mr-2">ACTION REQUIRED</span>
            )}
            {alert.patientName && <p className="text-xs font-bold text-gray-800">{alert.patientName}</p>}
            <p className="text-xs text-gray-700 mt-0.5">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
