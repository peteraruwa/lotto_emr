'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, ChevronDown, ChevronRight, Lock, Pencil } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { RequireRole } from '@/shared/rbac';
import { formatDateTime } from '@/shared/lib/utils';
import { useNotes } from '../api/use-notes';
import type { NoteListItem, NoteType } from '../types';

// ── SOAP section renderer ──────────────────────────────────────────────────────

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

function SoapSections({ text }: { text: string }) {
  const sections = parseSoapText(text);
  if (!sections.length) {
    return <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words bg-gray-50 rounded-xl p-3 font-sans">{text}</pre>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
      {sections.map((sec) => {
        if (!sec.lines.length) return null;
        return (
          <div key={sec.section} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide mb-2 text-blue-700">
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
                return <p key={i} className="text-xs text-gray-600 break-words">{line}</p>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Note card ─────────────────────────────────────────────────────────────────

function NoteCard({ note }: { note: NoteListItem }) {
  const medplum     = useMedplum();
  const [expanded, setExpanded] = useState(false);

  const currentUser   = medplum.getProfile() as any;
  const currentUserId = currentUser?.id;

  const isFinal    = note.docStatus === 'final';
  const isOwn      = !!note.authorId && note.authorId === currentUserId;
  const canEdit    = !isFinal && isOwn;

  const isSoap = note.contentPreview?.includes('## SUBJECTIVE') ||
                 note.contentPreview?.includes('## OBJECTIVE') ||
                 note.type === 'SOAP' as NoteType;

  const editHref = note.noteTypeKey
    ? `/patients/${note.patientId}/clinical-note/new?type=${note.noteTypeKey}&noteId=${note.id}`
    : undefined;

  return (
    <div className={cn(
      'bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow',
      expanded ? 'shadow-md' : 'shadow-sm hover:shadow-md',
    )}>
      {/* Card header */}
      <div className="flex items-start sm:items-center gap-3 px-4 py-3.5 flex-wrap sm:flex-nowrap">
        <div className="w-8 h-8 rounded-xl bg-hospital-50 flex items-center justify-center flex-shrink-0">
          <FileText className="h-3.5 w-3.5 text-hospital-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{note.title}</p>
            {isFinal ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 flex-shrink-0">
                <Lock className="h-2.5 w-2.5" />
                Final
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 flex-shrink-0">
                Draft
              </span>
            )}
            {note.status !== 'current' && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 flex-shrink-0">
                {note.status}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
            {note.authorName} · {formatDateTime(note.date)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {canEdit && editHref && (
            <Link
              href={editHref}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
              title="Edit draft note"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Link>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              expanded
                ? 'bg-hospital-600 text-white'
                : 'bg-hospital-50 hover:bg-hospital-100 text-hospital-700',
            )}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {expanded ? 'Collapse' : 'View'}
          </button>
        </div>
      </div>

      {/* Preview — collapsed */}
      {!expanded && note.contentPreview && (
        <div className="px-4 pb-3.5">
          {isSoap ? (
            <div className="flex items-center gap-2 flex-wrap">
              {['SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN'].map((s) => {
                const hasSection = note.contentPreview?.includes(`## ${s}`);
                return hasSection ? (
                  <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-blue-100 bg-blue-50 text-blue-700">
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap">
              {note.contentPreview}
            </p>
          )}
        </div>
      )}

      {/* Full content — expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 animate-fade-in">
          {isSoap ? (
            <SoapSections text={note.contentPreview ?? ''} />
          ) : (
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words bg-gray-50 rounded-xl p-3 font-sans mt-3">
              {note.contentPreview}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main list ─────────────────────────────────────────────────────────────────

interface NoteListProps {
  patientId: string;
  typeFilter?: NoteType;
  hideNewButton?: boolean;
  onNewNote?: () => void;
}

export function NoteList({ patientId, typeFilter, hideNewButton = false, onNewNote }: NoteListProps) {
  const { data: allNotes = [], isLoading } = useNotes(patientId);

  const notes = typeFilter ? allNotes.filter((n) => n.type === typeFilter) : allNotes;

  return (
    <div className="space-y-3">
      {!hideNewButton && (
        <RequireRole roles={['doctor', 'nurse']}>
          <div className="flex justify-end">
            <button
              onClick={onNewNote}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-hospital-600/20"
            >
              <Plus className="h-3.5 w-3.5" />
              New Note
            </button>
          </div>
        </RequireRole>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-2.5 w-28 bg-gray-100 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && notes.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileText className="h-8 w-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            {typeFilter ? `No ${typeFilter.toLowerCase()} notes yet` : 'No clinical notes yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Notes will appear here once saved</p>
        </div>
      )}

      {/* Notes */}
      {!isLoading && notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
