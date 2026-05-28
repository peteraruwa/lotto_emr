'use client';
import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { SafetyFlag } from '../types';

const SEV_STYLES: Record<string, string> = {
  critical: 'bg-red-50 border-red-300 text-red-800',
  high:     'bg-orange-50 border-orange-300 text-orange-800',
  moderate: 'bg-amber-50 border-amber-200 text-amber-800',
  low:      'bg-blue-50 border-blue-200 text-blue-800',
};
const SEV_ICON_COLOR: Record<string, string> = {
  critical: 'text-red-600',
  high:     'text-orange-600',
  moderate: 'text-amber-600',
  low:      'text-blue-500',
};
const SEV_LABEL: Record<string, string> = {
  critical: 'CRITICAL',
  high:     'HIGH',
  moderate: 'MODERATE',
  low:      'LOW',
};
const TYPE_LABEL: Record<string, string> = {
  allergy:          'Allergy Conflict',
  interaction:      'Drug Interaction',
  dose:             'Dose Warning',
  duplicate:        'Duplicate Therapy',
  contraindication: 'Contraindication',
};

interface SafetyFlagsDisplayProps {
  flags: SafetyFlag[];
  compact?: boolean;
}

export function SafetyFlagsDisplay({ flags, compact = false }: SafetyFlagsDisplayProps) {
  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-2.5">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <p className="text-xs font-semibold text-green-700">No safety flags — prescription is clear</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flags.map((flag, i) => (
        <div key={i} className={cn('rounded-xl border p-3', SEV_STYLES[flag.severity])}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={cn('h-4 w-4 flex-shrink-0 mt-0.5', SEV_ICON_COLOR[flag.severity])} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded-full', {
                  'bg-red-600 text-white':    flag.severity === 'critical',
                  'bg-orange-500 text-white': flag.severity === 'high',
                  'bg-amber-400 text-white':  flag.severity === 'moderate',
                  'bg-blue-400 text-white':   flag.severity === 'low',
                })}>
                  {SEV_LABEL[flag.severity]}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide opacity-75">
                  {TYPE_LABEL[flag.type]}
                </span>
              </div>
              <p className={cn('text-xs font-semibold mt-1', compact ? '' : 'mt-1.5')}>{flag.message}</p>
              {!compact && flag.recommendation && (
                <p className="text-[11px] mt-1 opacity-80 flex items-start gap-1">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  {flag.recommendation}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
