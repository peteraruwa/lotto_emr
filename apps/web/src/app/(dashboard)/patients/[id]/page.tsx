import type { Metadata } from 'next';
import { PatientProfile } from '@/features/patients';

interface PatientProfilePageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: 'Patient Profile' };

export default function PatientProfilePage({ params }: PatientProfilePageProps) {
  return <PatientProfile patientId={params.id} />;
}
