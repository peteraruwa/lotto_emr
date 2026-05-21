import type { Metadata } from 'next';
import { StructuredNoteEditor } from '@/features/clinical-notes';

interface NewClinicalNotePageProps {
  params: { id: string };
  searchParams: { type?: string };
}

export const metadata: Metadata = { title: 'New Clinical Note' };

export default function NewClinicalNotePage({ params, searchParams }: NewClinicalNotePageProps) {
  return <StructuredNoteEditor patientId={params.id} noteType={searchParams.type} />;
}
