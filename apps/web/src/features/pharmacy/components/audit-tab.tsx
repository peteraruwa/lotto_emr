'use client';
import React from 'react';
import { ClipboardList } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import type { PharmacyPrescription } from '../types';
import { usePharmacyAudit } from '../hooks/use-pharmacy-audit';

const ACTION_COLORS: Record<string, string> = {
  verified:        'bg-teal-100 text-teal-700',
  rejected:        'bg-red-100 text-red-700',
  'on-hold':       'bg-amber-100 text-amber-700',
  dispensed:       'bg-green-100 text-green-700',
  'partial-dispense': 'bg-indigo-100 text-indigo-700',
  'safety-cleared':'bg-green-100 text-green-700',
  'under-review':  'bg-blue-100 text-blue-700',
  dispensing:      'bg-indigo-100 text-indigo-700',
};

interface AuditTabProps {
  prescriptions: PharmacyPrescription[];
}

export function AuditTab({ prescriptions }: AuditTabProps) {
  const entries = usePharmacyAudit(prescriptions);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-400">No audit entries yet</p>
        <p className="text-xs text-gray-300 mt-1">Actions taken on prescriptions will be logged here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 mb-3">
        <p className="text-[11px] font-bold text-gray-500">Immutable audit log — all pharmacy actions are permanently recorded</p>
      </div>
      {entries.map((entry, i) => {
        const dt = (() => {
          try { const d = parseISO(entry.at); return isValid(d) ? format(d, 'dd MMM yyyy HH:mm:ss') : entry.at; } catch { return entry.at; }
        })();
        return (
          <div key={entry.id ?? i} className="rounded-xl border border-gray-100 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ACTION_COLORS[entry.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {entry.action}
                  </span>
                  <span className="text-xs font-semibold text-gray-700">{entry.drugName}</span>
                </div>
                <p className="text-xs text-gray-600">{entry.patientName}</p>
                <p className="text-[11px] text-gray-500">By {entry.pharmacistName}</p>
                {entry.reason && <p className="text-[11px] text-gray-400 italic mt-0.5">"{entry.reason}"</p>}
                {entry.details && <p className="text-[11px] text-gray-400">{entry.details}</p>}
              </div>
              <p className="text-[10px] text-gray-400 flex-shrink-0 font-mono">{dt}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
