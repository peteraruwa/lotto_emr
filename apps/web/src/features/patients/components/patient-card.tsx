'use client';

import React from 'react';
import Link from 'next/link';
import { User, Calendar, Phone, AlertTriangle } from 'lucide-react';
import { Card, CardContent, Badge } from '@lotto-emr/ui';
import { formatDate } from '@/shared/lib/utils';
import type { PatientListItem } from '../types';

interface PatientCardProps {
  patient: PatientListItem;
}

/**
 * Compact patient card showing key demographic and clinical summary data.
 */
export function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <Link href={`/patients/${patient.id}`} className="block">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-hospital-100 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-hospital-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate hover:text-hospital-700">
                {patient.fullName}
              </p>
              <p className="text-xs font-mono text-gray-400">{patient.mrn}</p>

              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(patient.dateOfBirth)} ({patient.age} yrs,{' '}
                    <span className="capitalize">{patient.gender}</span>)
                  </span>
                </div>

                {patient.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Phone className="h-3 w-3" />
                    <span>{patient.phone}</span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {patient.activeConditionsCount > 0 && (
                  <Badge variant="active" className="text-xs">
                    {patient.activeConditionsCount} condition{patient.activeConditionsCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                {patient.allergiesCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {patient.allergiesCount} allerg{patient.allergiesCount !== 1 ? 'ies' : 'y'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
