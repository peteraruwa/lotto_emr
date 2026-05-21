'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@lotto-emr/ui';
import type { AncVisitSummary, AncNoteType } from '../types';
import { ANC_NOTE_TYPE_LABELS } from '../types';

const TYPE_COLORS: Record<AncNoteType, string> = {
  'booking':            'bg-teal-100 text-teal-700 border-teal-300',
  'followup':           'bg-blue-100 text-blue-700 border-blue-300',
  'high-risk-review':   'bg-orange-100 text-orange-700 border-orange-300',
  'delivery-admission': 'bg-purple-100 text-purple-700 border-purple-300',
  'delivery':           'bg-pink-100 text-pink-700 border-pink-300',
  'postnatal':          'bg-green-100 text-green-700 border-green-300',
};

const TYPE_DOT: Record<AncNoteType, string> = {
  'booking':            'bg-teal-500',
  'followup':           'bg-blue-500',
  'high-risk-review':   'bg-orange-500',
  'delivery-admission': 'bg-purple-500',
  'delivery':           'bg-pink-500',
  'postnatal':          'bg-green-500',
};

interface AncTimelineProps {
  visits: AncVisitSummary[];
  patientId: string;
  pregnancyId: string;
}

export function AncTimeline({ visits, patientId, pregnancyId }: AncTimelineProps) {
  const sorted = [...visits].sort(
    (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime(),
  );

  return (
    <div className="space-y-2">
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">
          No visits recorded yet. Start with a booking note.
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200" />

          <div className="space-y-3">
            {sorted.map((visit, idx) => {
              const dotColor = TYPE_DOT[visit.noteType] ?? 'bg-gray-400';
              const chipColor = TYPE_COLORS[visit.noteType] ?? 'bg-gray-100 text-gray-700 border-gray-300';
              const label = ANC_NOTE_TYPE_LABELS[visit.noteType] ?? visit.noteType;
              const dateStr = visit.visitDate
                ? format(new Date(visit.visitDate), 'd MMM yyyy')
                : '—';

              return (
                <div key={visit.encounterId ?? idx} className="relative flex items-start gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2.5 top-2.5 h-3 w-3 rounded-full border-2 border-white ${dotColor} z-10`} />

                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${chipColor}`}>
                          {label}
                        </span>
                        <span className="text-xs text-gray-500">{dateStr}</span>
                        {visit.gestationalAge !== undefined && (
                          <span className="text-xs text-gray-400">GA {visit.gestationalAge}w</span>
                        )}
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>

                    {/* Key findings strip */}
                    {(visit.bp || visit.weight || visit.fetalHeartRate || visit.fundalHeight) && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                        {visit.bp && <span>BP: <strong>{visit.bp}</strong></span>}
                        {visit.weight && <span>Wt: <strong>{visit.weight} kg</strong></span>}
                        {visit.fetalHeartRate && <span>FHR: <strong>{visit.fetalHeartRate}/min</strong></span>}
                        {visit.fundalHeight && <span>FH: <strong>{visit.fundalHeight} cm</strong></span>}
                      </div>
                    )}

                    {visit.assessment && (
                      <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{visit.assessment}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add new visit button */}
      <div className="pt-3">
        <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
          <Link href={`/patients/${patientId}/anc/visit/new?pregnancy=${pregnancyId}`}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Record New Visit
          </Link>
        </Button>
      </div>
    </div>
  );
}
