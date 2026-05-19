import type { Metadata } from 'next';
import { EncounterList } from '@/features/encounters';

interface EncountersPageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: 'Patient Encounters' };

export default function PatientEncountersPage({ params }: EncountersPageProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Encounter History</h2>
      <EncounterList patientId={params.id} />
    </div>
  );
}
