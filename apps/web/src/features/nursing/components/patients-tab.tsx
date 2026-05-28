'use client';
import React from 'react';
import { AlertTriangle, Bed, Clock, User } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { NursingPatient } from '../types';

const STATUS_STYLES = {
  critical:        'bg-red-600 text-white',
  observation:     'bg-amber-500 text-white',
  'for-discharge': 'bg-blue-600 text-white',
  stable:          'bg-green-600 text-white',
};

interface PatientsTabProps {
  patients: NursingPatient[];
  selectedPatientId?: string;
  onSelect: (p: NursingPatient) => void;
}

export function PatientsTab({ patients, selectedPatientId, onSelect }: PatientsTabProps) {
  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <User className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-400">No ward patients</p>
        <p className="text-xs text-gray-300 mt-1">Active inpatient encounters will appear here</p>
      </div>
    );
  }

  const sorted = [...patients].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, observation: 1, 'for-discharge': 2, stable: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <div className="space-y-2">
      {sorted.map(p => {
        const isSelected = p.patientId === selectedPatientId;
        return (
          <button
            key={p.patientId}
            type="button"
            onClick={() => onSelect(p)}
            className={cn(
              'w-full text-left rounded-xl border p-3 transition-all',
              isSelected
                ? 'border-hospital-500 bg-hospital-50 shadow-sm shadow-hospital-100'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Status + Name */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide', STATUS_STYLES[p.status])}>
                    {p.status === 'for-discharge' ? 'FOR D/C' : p.status}
                  </span>
                  <span className="text-sm font-bold text-gray-900 truncate">{p.patientName}</span>
                </div>

                {/* Bed + Ward + MRN */}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Bed className="h-3 w-3" /> Bed {p.bed} · {p.ward}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{p.mrn}</span>
                </div>

                {/* Age/Gender/Diagnosis */}
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {p.age} yrs · {p.gender} · {p.admittingDiagnosis}
                </p>

                {/* Alerts row */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {p.allergies.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                      <AlertTriangle className="h-2.5 w-2.5" /> {p.allergies.slice(0, 2).join(', ')}{p.allergies.length > 2 ? ` +${p.allergies.length - 2}` : ''}
                    </span>
                  )}
                  {p.bloodTransfusionConsent === 'refuses' && (
                    <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                      🚫 NO BLOOD
                    </span>
                  )}
                  {p.bloodGroup && (
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {p.bloodGroup}
                    </span>
                  )}
                </div>
              </div>

              {/* Days admitted */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" /> {p.daysAdmitted}d
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
