import type { Metadata } from 'next';
import { StructuredNoteEditor } from '@/features/clinical-notes';

interface NewClinicalNotePageProps {
  params: { id: string };
  searchParams: { type?: string; noteId?: string };
}

export const metadata: Metadata = { title: 'Clinical Note' };

export default function NewClinicalNotePage({ params, searchParams }: NewClinicalNotePageProps) {
  return (
    <StructuredNoteEditor
      patientId={params.id}
      noteType={searchParams.type}
      existingNoteId={searchParams.noteId}
    />
  );
}
