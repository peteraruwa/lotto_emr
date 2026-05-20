import type { Metadata } from 'next';
import { StructuredNoteEditor } from '@/features/clinical-notes';

interface NewClinicalNotePageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: 'New Clinical Note' };

export default function NewClinicalNotePage({ params }: NewClinicalNotePageProps) {
  return <StructuredNoteEditor patientId={params.id} />;
}
