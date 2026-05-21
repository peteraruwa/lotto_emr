'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Encounter } from '@medplum/fhirtypes';
import { Button, Card, CardContent } from '@lotto-emr/ui';
import { Activity } from 'lucide-react';

export function TriageQueueTable() {
  const medplum = useMedplum();

  const { data: encounters, isLoading } = useQuery({
    queryKey: ['triage-queue'],
    queryFn: () =>
      medplum.searchResources('Encounter', {
        status: 'arrived',
        _sort: '-date',
        _count: '20',
        _include: 'Encounter:subject',
      }),
  });

  const arrivedEncounters = (encounters ?? []).filter(
    (r): r is Encounter => r.resourceType === 'Encounter',
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border rounded-lg animate-pulse">
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-7 w-16 bg-gray-200 rounded ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (arrivedEncounters.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-12 text-center">
          <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-base font-medium text-gray-900">No patients awaiting triage</p>
          <p className="text-sm text-muted-foreground mt-1">
            Patients with &ldquo;arrived&rdquo; encounters will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Patient
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Arrived
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              MRN
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {arrivedEncounters.map((enc) => {
            const patientRef = enc.subject?.reference ?? '';
            const patientId = patientRef.replace('Patient/', '');
            const patientName = enc.subject?.display ?? 'Unknown Patient';
            const arrivedTime = enc.period?.start;
            const arrivedDisplay = arrivedTime
              ? format(new Date(arrivedTime), 'dd MMM, HH:mm')
              : '—';

            return (
              <tr key={enc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{patientName}</td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">{arrivedDisplay}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{patientId}</td>
                <td className="px-4 py-3 text-right">
                  {patientId && enc.id && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700 text-white h-7 text-xs px-3"
                    >
                      <Link href={`/patients/${patientId}/triage?encounter=${enc.id}`}>
                        Triage
                      </Link>
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
