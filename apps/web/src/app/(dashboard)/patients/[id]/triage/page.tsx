import type { Metadata } from 'next';
import { TriagePageContent } from './_client';

export const metadata: Metadata = { title: 'Triage' };

interface TriagePageProps {
  params: { id: string };
  searchParams: { encounter?: string };
}

export default function TriagePage({ params, searchParams }: TriagePageProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Triage</h1>
      <TriagePageContent patientId={params.id} encounterId={searchParams.encounter} />
    </div>
  );
}
