'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { format } from 'date-fns';
import {
  ChevronDown, ChevronRight, FileText, Clock, Calendar, Loader2,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { useEncounters } from '../api/use-encounters';

// ── SOAP note renderer ────────────────────────────────────────────────────────

function parseSoapText(text: string): { section: string; lines: string[] }[] {
  const sections: { section: string; lines: string[] }[] = [];
  let current: { section: string; lines: string[] } | null = null;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      current = { section: line.replace('## ', ''), lines: [] };
    } else if (line && current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

const SECTION_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  SUBJECTIVE:  { border: 'border-blue-300',   bg: 'bg-blue-50',   text: 'text-blue-700' },
  OBJECTIVE:   { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  ASSESSMENT:  { border: 'border-orange-300',  bg: 'bg-orange-50', text: 'text-orange-700' },
  PLAN:        { border: 'border-violet-300',  bg: 'bg-violet-50', text: 'text-violet-700' },
};

function SoapNoteView({ encounterId }: { encounterId: string }) {
  const medplum = useMedplum();

  const { data: doc, isLoading } = useQuery({
    queryKey: ['encounter-note', encounterId],
    queryFn: async () => {
      const docs = await medplum.searchResources('DocumentReference', {
        encounter: `Encounter/${encounterId}`,
        _sort: '-date',
        _count: '5',
      });
      return (docs as any[]).filter((d: any) => d.status !== 'entered-in-error');
    },
    enabled: !!encounterId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 px-4 text-xs text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading notes…
      </div>
    );
  }

  if (!doc || doc.length === 0) {
    return (
      <div className="py-4 px-4 text-xs text-gray-400 flex items-center gap-2">
        <FileText className="h-3.5 w-3.5" />
        No clinical notes recorded for this encounter.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {doc.map((d: any) => {
        // Decode base64 content
        let noteText = '';
        const attachment = d.content?.[0]?.attachment;
        if (attachment?.data) {
          try {
            noteText = decodeURIComponent(escape(atob(attachment.data)));
          } catch {
            noteText = atob(attachment.data);
          }
        }

        const isSoap = noteText.includes('## SUBJECTIVE') || noteText.includes('## OBJECTIVE');
        const sections = isSoap ? parseSoapText(noteText) : null;
        const author = d.author?.[0]?.display ?? 'Unknown';
        const dateStr = d.date ? format(new Date(d.date), 'd MMM yyyy, HH:mm') : '';

        return (
          <div key={d.id} className="px-4 py-4">
            {/* Note header */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-hospital-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-700">{d.description ?? 'Clinical Note'}</span>
                <span className="px-2 py-0.5 rounded-full bg-hospital-50 text-hospital-700 text-[11px] font-semibold">
                  {d.type?.text ?? 'SOAP'}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] text-gray-500">{author}</p>
                <p className="text-[11px] text-gray-400">{dateStr}</p>
              </div>
            </div>

            {/* SOAP sections */}
            {isSoap && sections ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sections.map((sec) => {
                  const style = SECTION_STYLE[sec.section] ?? { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-700' };
                  if (!sec.lines.length) return null;
                  return (
                    <div key={sec.section} className={cn('rounded-xl border p-3', style.border, style.bg)}>
                      <p className={cn('text-[11px] font-bold uppercase tracking-wide mb-2', style.text)}>
                        {sec.section}
                      </p>
                      <div className="space-y-1.5">
                        {sec.lines.map((line, i) => {
                          const boldMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
                          if (boldMatch) {
                            return (
                              <div key={i}>
                                <span className="text-xs font-semibold text-gray-700">{boldMatch[1]}: </span>
                                <span className="text-xs text-gray-600 break-words">{boldMatch[2]}</span>
                              </div>
                            );
                          }
                          return (
                            <p key={i} className="text-xs text-gray-600 break-words">{line}</p>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words bg-gray-50 rounded-xl p-3 font-sans">
                {noteText || 'No content.'}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Status styles ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  'in-progress': 'bg-emerald-50 text-emerald-700',
  arrived:       'bg-emerald-50 text-emerald-700',
  triaged:       'bg-yellow-50 text-yellow-700',
  finished:      'bg-gray-100 text-gray-600',
  cancelled:     'bg-red-50 text-red-600',
  planned:       'bg-blue-50 text-blue-700',
  unknown:       'bg-gray-100 text-gray-500',
};

const CLASS_COLOR: Record<string, string> = {
  AMB:    'bg-hospital-50 text-hospital-700',
  EMER:   'bg-red-50 text-red-700',
  IMP:    'bg-violet-50 text-violet-700',
  OBSENC: 'bg-amber-50 text-amber-700',
  SS:     'bg-teal-50 text-teal-700',
};

// ── EncounterRow ──────────────────────────────────────────────────────────────

function EncounterRow({ enc }: { enc: any }) {
  const [expanded, setExpanded] = useState(false);

  const startDate = enc.periodStart ? new Date(enc.periodStart) : null;
  const endDate   = enc.periodEnd   ? new Date(enc.periodEnd)   : null;
  const dateStr   = startDate && !isNaN(startDate.getTime())
    ? format(startDate, 'd MMM yyyy')
    : '—';
  const timeStr   = startDate && !isNaN(startDate.getTime())
    ? format(startDate, 'HH:mm')
    : '';
  const duration  = enc.durationMinutes !== undefined
    ? enc.durationMinutes < 60
      ? `${enc.durationMinutes}m`
      : `${Math.floor(enc.durationMinutes / 60)}h ${enc.durationMinutes % 60}m`
    : null;

  const statusCls = STATUS_STYLE[enc.status] ?? 'bg-gray-100 text-gray-500';
  const classCls  = CLASS_COLOR[enc.class]   ?? 'bg-gray-100 text-gray-600';

  return (
    <div className={cn('border-b border-gray-50 last:border-0 transition-colors', expanded ? 'bg-gray-50/50' : 'hover:bg-gray-50/50')}>
      {/* ── Main row ── */}
      <div className="flex items-start sm:items-center gap-3 px-4 py-3.5 flex-wrap sm:flex-nowrap">

        {/* Date + icon */}
        <div className="flex items-center gap-2.5 flex-shrink-0 min-w-[100px]">
          <div className="w-8 h-8 rounded-xl bg-hospital-50 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-3.5 w-3.5 text-hospital-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 leading-tight">{dateStr}</p>
            {timeStr && (
              <p className="text-[11px] text-gray-400 flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />{timeStr}
              </p>
            )}
          </div>
        </div>

        {/* Type + reason */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0', classCls)}>
              {enc.classDisplay}
            </span>
            <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize flex-shrink-0', statusCls)}>
              {enc.status.replace('-', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-600 truncate">{enc.reasonText}</p>
        </div>

        {/* Provider + duration */}
        <div className="hidden sm:block text-right flex-shrink-0 min-w-[100px]">
          {enc.practitionerName && (
            <p className="text-[11px] text-gray-500 truncate">{enc.practitionerName}</p>
          )}
          {duration && (
            <p className="text-[11px] text-gray-400">{duration}</p>
          )}
          {endDate && (
            <p className="text-[11px] text-gray-400">Ended {format(endDate, 'd MMM')}</p>
          )}
        </div>

        {/* View note button */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0',
            expanded
              ? 'bg-hospital-600 text-white'
              : 'bg-hospital-50 hover:bg-hospital-100 text-hospital-700',
          )}
        >
          <FileText className="h-3 w-3" />
          {expanded ? 'Hide' : 'View'}
          {expanded
            ? <ChevronDown className="h-3 w-3" />
            : <ChevronRight className="h-3 w-3" />}
        </button>
      </div>

      {/* ── Expanded note ── */}
      {expanded && (
        <div className="border-t border-gray-100 bg-white animate-fade-in">
          <SoapNoteView encounterId={enc.id} />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface EncounterListProps {
  patientId: string;
}

export function EncounterList({ patientId }: EncounterListProps) {
  const { data: encounters = [], isLoading, error } = useEncounters(patientId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {[1,2,3,4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 last:border-0">
            <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-2.5 w-48 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-7 w-16 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-sm text-red-500">Failed to load encounters.</p>
      </div>
    );
  }

  if (encounters.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <Calendar className="h-8 w-8 text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500">No encounters recorded</p>
        <p className="text-xs text-gray-400 mt-1">Encounters will appear here once recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {encounters.length} encounter{encounters.length !== 1 ? 's' : ''} · click <span className="text-hospital-600">View</span> to see full clinical note
        </p>
      </div>
      {encounters.map((enc) => (
        <EncounterRow key={enc.id} enc={enc} />
      ))}
    </div>
  );
}
