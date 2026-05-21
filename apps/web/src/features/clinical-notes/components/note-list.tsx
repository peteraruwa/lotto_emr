'use client';

import React, { useState } from 'react';
import { Plus, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { RequireRole } from '@/shared/rbac';
import { formatDateTime } from '@/shared/lib/utils';
import { useNotes } from '../api/use-notes';
import { NoteEditor } from './note-editor';
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

const SECTION_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  SUBJECTIVE:  { border: 'border-blue-200',   bg: 'bg-blue-50',    text: 'text-blue-700' },
  OBJECTIVE:   { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  ASSESSMENT:  { border: 'border-orange-200',  bg: 'bg-orange-50',  text: 'text-orange-700' },
  PLAN:        { border: 'border-violet-200',  bg: 'bg-violet-50',  text: 'text-violet-700' },
};

function SoapSections({ text }: { text: string }) {
  const sections = parseSoapText(text);
  if (!sections.length) {
    return <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words bg-gray-50 rounded-xl p-3 font-sans">{text}</pre>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
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
                return <p key={i} className="text-xs text-gray-600 break-words">{line}</p>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<string, string> = {
  SOAP:      'bg-blue-50 text-blue-700',
  PROGRESS:  'bg-emerald-50 text-emerald-700',
  DISCHARGE: 'bg-orange-50 text-orange-700',
  REFERRAL:  'bg-violet-50 text-violet-700',
};

// ── Note card ─────────────────────────────────────────────────────────────────

function NoteCard({ note }: { note: NoteListItem }) {
  const [expanded, setExpanded] = useState(false);

  const isSoap = note.contentPreview?.includes('## SUBJECTIVE') ||
                 note.contentPreview?.includes('## OBJECTIVE') ||
                 note.type === 'SOAP' as NoteType;

  const typeCls = TYPE_STYLE[note.type] ?? 'bg-gray-100 text-gray-600';

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
            <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0', typeCls)}>
              {note.type}
            </span>
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

        <button
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0',
            expanded
              ? 'bg-hospital-600 text-white'
              : 'bg-hospital-50 hover:bg-hospital-100 text-hospital-700',
          )}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {expanded ? 'Collapse' : 'View'}
        </button>
      </div>

      {/* Preview — collapsed */}
      {!expanded && note.contentPreview && (
        <div className="px-4 pb-3.5">
          {isSoap ? (
            <div className="flex items-center gap-2 flex-wrap">
              {['SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN'].map((s) => {
                const style = SECTION_STYLE[s] ?? {};
                const hasSection = note.contentPreview?.includes(`## ${s}`);
                return hasSection ? (
                  <span key={s} className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold border', style.border, style.bg, style.text)}>
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
}

export function NoteList({ patientId, typeFilter, hideNewButton = false }: NoteListProps) {
  const [showEditor, setShowEditor] = useState(false);
  const { data: allNotes = [], isLoading } = useNotes(patientId);

  const notes = typeFilter ? allNotes.filter((n) => n.type === typeFilter) : allNotes;

  return (
    <div className="space-y-3">
      {!hideNewButton && (
        <RequireRole roles={['doctor', 'nurse']}>
          <div className="flex justify-end">
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-hospital-600/20"
            >
              <Plus className="h-3.5 w-3.5" />
              New Note
            </button>
          </div>
        </RequireRole>
      )}

      {/* Note editor modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 mt-8 animate-fade-in">
            <h2 className="text-base font-bold text-gray-900 mb-4">Clinical Note</h2>
            <NoteEditor
              patientId={patientId}
              onSuccess={() => setShowEditor(false)}
              onCancel={() => setShowEditor(false)}
            />
          </div>
        </div>
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
          <p className="text-xs text-gray-400 mt-1">Notes will appear here once created</p>
        </div>
      )}

      {/* Notes */}
      {!isLoading && notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
