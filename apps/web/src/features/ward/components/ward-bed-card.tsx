'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@lotto-emr/ui';
import type { WardPatient } from '../hooks/use-ward-data';

interface WardBedCardProps {
  patient: WardPatient;
}

const STATUS_CONFIG: Record<
  WardPatient['status'],
  { label: string; className: string }
> = {
  stable: {
    label: 'Stable',
    className: 'bg-teal-100 text-teal-800 border border-teal-200',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
  observation: {
    label: 'Observation',
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  'for-discharge': {
    label: 'For Discharge',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
};

export function WardBedCard({ patient }: WardBedCardProps) {
  const statusConf = STATUS_CONFIG[patient.status];

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Bed */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
        {patient.bedNumber}
      </td>

      {/* Patient */}
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">{patient.patientName}</div>
        <div className="text-xs text-muted-foreground">{patient.mrn}</div>
      </td>

      {/* Age/Sex */}
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {patient.age > 0 ? `${patient.age}y` : '—'}{' '}
        {patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : '—'}
      </td>

      {/* Diagnosis */}
      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px]">
        <span className="line-clamp-2">{patient.admittingDiagnosis}</span>
      </td>

      {/* Days */}
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {patient.daysAdmitted === 0 ? 'Today' : `${patient.daysAdmitted}d`}
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.className}`}
        >
          {statusConf.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2">
            <Link href={`/patients/${patient.patientId}`}>View</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2">
            <Link href={`/patients/${patient.patientId}/clinical-note/new`}>Ward Round</Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}
