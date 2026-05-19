'use client';

import React, { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Badge, Button } from '@lotto-emr/ui';
import { RequireRole } from '@/shared/rbac';
import { formatDateTime } from '@/shared/lib/utils';
import { useNotes } from '../api/use-notes';
import { NoteEditor } from './note-editor';
import type { NoteType } from '../types';

const TYPE_COLOR: Record<NoteType, string> = {
  SOAP: 'text-blue-600',
  PROGRESS: 'text-green-600',
  DISCHARGE: 'text-orange-600',
  REFERRAL: 'text-purple-600',
};

interface NoteListProps {
  patientId: string;
}

export function NoteList({ patientId }: NoteListProps) {
  const [showEditor, setShowEditor] = useState(false);
  const { data: notes = [], isLoading } = useNotes(patientId);

  return (
    <div className="space-y-4">
      <RequireRole roles={['doctor', 'nurse']}>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowEditor(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Note
          </Button>
        </div>
      </RequireRole>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 mt-8">
            <h2 className="text-lg font-semibold mb-4">Clinical Note</h2>
            <NoteEditor
              patientId={patientId}
              onSuccess={() => setShowEditor(false)}
              onCancel={() => setShowEditor(false)}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No clinical notes yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-white border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className={`h-4 w-4 ${TYPE_COLOR[note.type]}`} />
                  <span className="font-medium text-sm">{note.title}</span>
                  <Badge variant="outline" className="text-xs">{note.type}</Badge>
                  {note.status !== 'current' && (
                    <Badge variant="cancelled" className="text-xs">{note.status}</Badge>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{note.authorName}</p>
                  <p>{formatDateTime(note.date)}</p>
                </div>
              </div>
              {note.contentPreview && (
                <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                  {note.contentPreview}
                  {note.contentPreview.length >= 200 ? '...' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
