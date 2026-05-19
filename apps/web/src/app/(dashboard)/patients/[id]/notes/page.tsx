import type { Metadata } from 'next';
import { NoteList } from '@/features/clinical-notes';

interface NotesPageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: 'Clinical Notes' };

export default function PatientNotesPage({ params }: NotesPageProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Clinical Notes</h2>
      <NoteList patientId={params.id} />
    </div>
  );
}
