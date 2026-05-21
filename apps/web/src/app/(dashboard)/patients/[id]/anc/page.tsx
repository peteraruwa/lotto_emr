import type { Metadata } from 'next';
import { AncPage } from '@/features/anc';

export const metadata: Metadata = { title: 'Antenatal Care' };

export default function AncPatientPage({ params }: { params: { id: string } }) {
  return <AncPage patientId={params.id} />;
}
