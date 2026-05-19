import type { Metadata } from 'next';
import { PatientChart } from '@/features/patients';

interface PatientChartPageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: 'Patient Chart' };

export default function PatientChartPage({ params }: PatientChartPageProps) {
  return <PatientChart patientId={params.id} />;
}
